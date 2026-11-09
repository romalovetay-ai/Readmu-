"""Cinematic kit: a small 3D renderer drawn with cairo (camera, lit meshes, soft shadows, floor reflections, decals),
a 3D studio set, narrator lighting and film post-processing (bloom, grade, vignette, grain, DOF).

Coordinates: y up, floor at y = 0, camera looks along +z.
"""
import math
import numpy as np
import cairo
import cv2

W, H = 1920, 1080

KEY = np.array([-0.80, 0.62, -0.30])           # direction TO the key light (upper left, in front)
KEY /= np.linalg.norm(KEY)
KEY_COL = np.array([1.0, 0.86, 0.72])
FILL = np.array([0.7, 0.2, -0.6]); FILL /= np.linalg.norm(FILL)
FILL_COL = np.array([0.30, 0.38, 0.80])
RIM = np.array([0.6, 0.4, 0.9]); RIM /= np.linalg.norm(RIM)  # from behind right
RIM_COL = np.array([1.0, 0.38, 0.55])
AMB = np.array([0.16, 0.13, 0.22])

PAL = {"gold": (1.0, 0.74, 0.22), "red": (0.95, 0.22, 0.26), "green": (0.22, 0.85, 0.50), "blue": (0.30, 0.52, 1.0),
       "amber": (1.0, 0.55, 0.15), "white": (0.92, 0.92, 0.95), "dark": (0.10, 0.09, 0.13), "grey": (0.45, 0.45, 0.52),
       "purple": (0.55, 0.30, 0.95), "teal": (0.20, 0.80, 0.85), "cream": (0.97, 0.92, 0.80), "brown": (0.55, 0.32, 0.18)}


def col(c):
    return PAL[c] if isinstance(c, str) else c


def _n(v):
    return v / (np.linalg.norm(v) + 1e-9)


def ease(x):
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 3


def ease_io(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def ease_back(x):
    x = min(1.0, max(0.0, x))
    return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


# ------------------------------------------------------------------ camera
class Cam:
    def __init__(self, pos, target, fov=38.0, roll=0.0, w=W, h=H):
        self.pos = np.array(pos, float)
        self.target = np.array(target, float)
        f = _n(self.target - self.pos)
        r = _n(np.cross([0, 1, 0], f))
        u = np.cross(f, r)
        if roll:
            c, s = math.cos(roll), math.sin(roll)
            r, u = r * c + u * s, -r * s + u * c
        self.f, self.r, self.u = f, r, u
        self.w, self.h = w, h
        self.focal = (h / 2) / math.tan(math.radians(fov) / 2)

    def cam(self, P):
        d = np.atleast_2d(P) - self.pos
        return np.stack([d @ self.r, d @ self.u, d @ self.f], axis=1)

    def proj(self, P):
        c = self.cam(P)
        z = np.maximum(c[:, 2], 1e-3)
        return np.stack([self.w / 2 + self.focal * c[:, 0] / z, self.h / 2 - self.focal * c[:, 1] / z, z], axis=1)

    def pt(self, p):
        x, y, z = self.proj(np.array([p], float))[0]
        return x, y, z

    def px_per_unit(self, p):
        """Screen pixels per world unit at point p."""
        return self.focal / max(1e-3, self.cam(np.array([p], float))[0, 2])


# ------------------------------------------------------------------ meshes
def rot(rx=0.0, ry=0.0, rz=0.0):
    cx, sx, cy, sy, cz, sz = math.cos(rx), math.sin(rx), math.cos(ry), math.sin(ry), math.cos(rz), math.sin(rz)
    Rx = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]])
    Ry = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]])
    Rz = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Ry @ Rx @ Rz


class Mesh:
    """v: (N,3) local vertices; faces: list of vertex-index lists (CCW seen from outside).
    vn: optional per-vertex normals for smooth faces (smooth=list of face flags)."""

    def __init__(self, v, faces, color="gold", gloss=0.5, metal=0.0, emissive=0.0, alpha=1.0, smooth=None, vn=None,
                 face_colors=None, edge=0.0):
        self.v = np.asarray(v, float)
        self.faces = faces
        self.color = np.array(col(color), float)
        self.gloss, self.metal, self.emissive, self.alpha = gloss, metal, emissive, alpha
        self.smooth = smooth or [False] * len(faces)
        self.vn = vn
        self.face_colors = face_colors or {}
        self.decals = {}  # face index -> fn(ctx, w, h) drawn in face-local coordinates
        self.edge = edge
        self.pos = np.zeros(3)
        self.R = np.eye(3)
        self.scale = np.ones(3)
        self.cast = True

    def place(self, pos=(0, 0, 0), rx=0.0, ry=0.0, rz=0.0, scale=1.0):
        self.pos = np.array(pos, float)
        self.R = rot(rx, ry, rz)
        self.scale = np.array(scale if hasattr(scale, "__len__") else (scale,) * 3, float)
        return self

    def world(self):
        return (self.v * self.scale) @ self.R.T + self.pos

    def world_normals(self):
        if self.vn is None:
            return None
        n = (self.vn / self.scale) @ self.R.T
        return n / (np.linalg.norm(n, axis=1, keepdims=True) + 1e-9)


def box(w, h, d, color="gold", y0=True, **kw):
    """Axis box; with y0 the base sits on y = 0."""
    x, z = w / 2, d / 2
    b, t = (0.0, h) if y0 else (-h / 2, h / 2)
    v = [(-x, b, -z), (x, b, -z), (x, t, -z), (-x, t, -z), (-x, b, z), (x, b, z), (x, t, z), (-x, t, z)]
    faces = [[0, 3, 2, 1], [4, 5, 6, 7], [0, 4, 7, 3], [1, 2, 6, 5], [3, 7, 6, 2], [0, 1, 5, 4]]
    # face order: 0 front(-z) 1 back(+z) 2 left(-x) 3 right(+x) 4 top 5 bottom
    return Mesh(v, faces, color, **kw)


def bevel_box(w, h, d, r, color="gold", **kw):
    """Box with chamfered vertical edges (reads as a bevelled solid)."""
    pts = []
    for cx, cz, a0 in ((w / 2 - r, -d / 2 + r, -90), (w / 2 - r, d / 2 - r, 0), (-w / 2 + r, d / 2 - r, 90), (-w / 2 + r, -d / 2 + r, 180)):
        for k in range(3):
            a = math.radians(a0 + k * 45)
            pts.append((cx + r * math.cos(a), cz + r * math.sin(a)))
    return prism(pts, h, color, **kw)


def prism(poly, h, color="gold", y0=0.0, **kw):
    """Extrude a 2D polygon (x, z) — CCW seen from above — upward by h."""
    n = len(poly)
    v = [(x, y0, z) for x, z in poly] + [(x, y0 + h, z) for x, z in poly]
    faces = [list(range(n, 2 * n)), list(range(n - 1, -1, -1))]
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, j, n + j, n + i])
    # top face index 0; orientation fix: top must face +y
    m = Mesh(v, faces, color, **kw)
    _orient(m)
    return m


def cylinder(r, h, n=40, color="gold", y0=0.0, **kw):
    """Vertical cylinder (coins, towers). Top face index 0, bottom 1, sides smooth."""
    ang = [2 * math.pi * i / n for i in range(n)]
    v = [(r * math.cos(a), y0, r * math.sin(a)) for a in ang] + [(r * math.cos(a), y0 + h, r * math.sin(a)) for a in ang]
    faces = [list(range(2 * n - 1, n - 1, -1)), list(range(n))]
    smooth = [False, False]
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, n + i, n + j, j])
        smooth.append(True)
    vn = [(math.cos(a), 0, math.sin(a)) for a in ang] * 2
    m = Mesh(v, faces, color, smooth=smooth, vn=np.array(vn, float), **kw)
    _orient(m)
    return m


def newell(p):
    """Robust polygon normal (works for long thin / near-collinear faces)."""
    n = np.zeros(3)
    q = np.roll(p, -1, axis=0)
    n[0] = np.sum((p[:, 1] - q[:, 1]) * (p[:, 2] + q[:, 2]))
    n[1] = np.sum((p[:, 2] - q[:, 2]) * (p[:, 0] + q[:, 0]))
    n[2] = np.sum((p[:, 0] - q[:, 0]) * (p[:, 1] + q[:, 1]))
    return n


def _orient(m):
    """Make every face's normal point away from the mesh centre."""
    c = m.v.mean(axis=0)
    for i, f in enumerate(m.faces):
        p = m.v[f]
        nrm = newell(p)
        if np.dot(nrm, p.mean(axis=0) - c) < 0:
            m.faces[i] = f[::-1]


def wedge(r0, r1, a0, a1, h, color, n=None, **kw):
    """Pie wedge (annular sector) extruded upward; angles in radians around +y."""
    n = n or max(3, int(abs(a1 - a0) / 0.08))
    outer = [(r1 * math.cos(a0 + (a1 - a0) * i / n), r1 * math.sin(a0 + (a1 - a0) * i / n)) for i in range(n + 1)]
    inner = [(r0 * math.cos(a1 - (a1 - a0) * i / n), r0 * math.sin(a1 - (a1 - a0) * i / n)) for i in range(n + 1)] if r0 > 0 else [(0, 0)]
    m = prism(outer + inner, h, color, **kw)
    return m


# ------------------------------------------------------------------ shading
def shade(base, n, p, campos, gloss=0.5, metal=0.0, emissive=0.0):
    v = _n(campos - p)
    ndl = max(0.0, float(np.dot(n, KEY)))
    fill = max(0.0, float(np.dot(n, FILL)))
    rim = (1 - max(0.0, float(np.dot(n, v)))) ** 3 * max(0.0, float(np.dot(n, RIM)) + 0.35)
    hv = _n(KEY + v)
    spec = max(0.0, float(np.dot(n, hv))) ** (8 + 120 * gloss) * (0.25 + 1.4 * gloss)
    sky = 0.5 + 0.5 * n[1]
    diff = base * (AMB * (0.6 + 0.8 * sky) + KEY_COL * ndl * 0.95 + FILL_COL * fill * 0.45)
    if metal:
        # fake studio environment: bright sky band above the horizon, dark floor below, warm stripe at the horizon
        rf = 2 * np.dot(n, v) * n - v
        env = (0.12 + 0.8 * max(0.0, rf[1]) ** 0.6 + 0.55 * math.exp(-((rf[1] - 0.04) / 0.10) ** 2)
               + 0.9 * max(0.0, math.sin(rf[0] * 7.0 + 1.3)) ** 10)
        diff = diff * (1 - 0.6 * metal) + base * metal * env
    spec_col = (KEY_COL * (1 - metal) + base * metal * 1.4) * spec
    c = diff + spec_col + RIM_COL * rim * 0.9 + base * emissive
    return np.clip(c, 0, 1.6)


# ------------------------------------------------------------------ decal mapping
def face_affine(ctx, quad2d, w, h):
    """Set ctx so that face-local (0..w, 0..h) maps onto projected quad (p0 top-left, p1 top-right, p3 bottom-left)."""
    p0, p1, _, p3 = quad2d
    xx, yx = (p1[0] - p0[0]) / w, (p1[1] - p0[1]) / w
    xy, yy = (p3[0] - p0[0]) / h, (p3[1] - p0[1]) / h
    ctx.transform(cairo.Matrix(xx, yx, xy, yy, p0[0], p0[1]))


def draw_on_quad(ctx, quad2d, w, h, fn, subdiv=3):
    """Draw fn(ctx) in local (0..w,0..h) space onto a projected quad, with perspective approximated by sub-quads."""
    p = np.array([q[:2] for q in quad2d], float)

    def bil(u, v):
        top = p[0] + (p[1] - p[0]) * u
        bot = p[3] + (p[2] - p[3]) * u
        return top + (bot - top) * v

    for i in range(subdiv):
        for j in range(subdiv):
            u0, u1, v0, v1 = i / subdiv, (i + 1) / subdiv, j / subdiv, (j + 1) / subdiv
            q = [bil(u0, v0), bil(u1, v0), bil(u1, v1), bil(u0, v1)]
            ctx.save()
            ctx.move_to(*q[0])
            for k in (1, 2, 3):
                ctx.line_to(*q[k])
            ctx.close_path()
            # slight overdraw to hide seams
            ctx.set_line_width(1.2)
            ctx.clip_preserve()
            ctx.new_path()
            sw, sh = w / subdiv, h / subdiv
            xx, yx = (q[1][0] - q[0][0]) / sw, (q[1][1] - q[0][1]) / sw
            xy, yy = (q[3][0] - q[0][0]) / sh, (q[3][1] - q[0][1]) / sh
            ctx.transform(cairo.Matrix(xx, yx, xy, yy, q[0][0], q[0][1]))
            ctx.translate(-u0 * w, -v0 * h)
            fn(ctx)
            ctx.restore()


# ------------------------------------------------------------------ renderer
def _layer(w=W, h=H):
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h)
    return s, cairo.Context(s)


def to_np(surf):
    surf.flush()
    return np.ndarray((surf.get_height(), surf.get_width(), 4), np.uint8, surf.get_data(), strides=(surf.get_stride(), 4, 1))


def blur_layer(surf, sigma, scale=0.25):
    """Gaussian blur of a premultiplied ARGB surface (in place), done at reduced resolution."""
    a = to_np(surf)
    h, w = a.shape[:2]
    sw, sh = max(1, int(w * scale)), max(1, int(h * scale))
    small = cv2.resize(a, (sw, sh), interpolation=cv2.INTER_AREA)
    small = cv2.GaussianBlur(small, (0, 0), max(0.5, sigma * scale))
    a[:] = cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR)
    surf.mark_dirty()
    return surf


class Scene:
    """Collects meshes and sprites, renders with soft shadows + floor reflection onto a cairo context."""

    def __init__(self, cam, floor=True, reflect=0.22, shadow=0.6):
        self.cam = cam
        self.meshes = []
        self.sprites = []  # (world pos, fn(ctx, x, y, px_per_unit, depth))
        self.floor = floor
        self.reflect = reflect
        self.shadow = shadow

    def add(self, m):
        self.meshes.append(m)
        return m

    def sprite(self, pos, fn, shadow_r=0.0):
        self.sprites.append((np.array(pos, float), fn, shadow_r))

    # -------------------------------------------------- faces
    def _faces(self, mirror=False):
        cam = self.cam
        out = []
        for m in self.meshes:
            Pw = m.world()
            Nv = m.world_normals()
            if mirror:
                Pw = Pw * np.array([1, -1, 1])
                if Nv is not None:
                    Nv = Nv * np.array([1, -1, 1])
            P2 = cam.proj(Pw)
            for fi, f in enumerate(m.faces):
                pts = Pw[f]
                nrm = _n(newell(pts))
                if mirror:
                    nrm = -nrm
                c = pts.mean(axis=0)
                if np.dot(nrm, cam.pos - c) <= 0 and m.alpha >= 0.99:
                    continue
                if (P2[f, 2] < 0.05).any():
                    continue
                base = np.array(col(m.face_colors[fi]), float) if fi in m.face_colors else m.color
                if m.smooth[fi] and Nv is not None:
                    cols = [shade(base, Nv[k], Pw[k], cam.pos, m.gloss, m.metal, m.emissive) for k in f]
                else:
                    cols = [shade(base, nrm, Pw[k], cam.pos, m.gloss, m.metal, m.emissive) for k in f]
                depth = float(np.linalg.norm(c - cam.pos))
                out.append((depth, P2[f, :2], cols, m, fi))
        out.sort(key=lambda x: -x[0])
        return out

    def _draw_faces(self, ctx, faces, alpha=1.0):
        for depth, p2, cols, m, fi in faces:
            ctx.move_to(*p2[0])
            for q in p2[1:]:
                ctx.line_to(*q)
            ctx.close_path()
            lum = [c.sum() for c in cols]
            i0, i1 = int(np.argmax(lum)), int(np.argmin(lum))
            a = m.alpha * alpha
            if i0 == i1 or abs(lum[i0] - lum[i1]) < 0.02:
                c = np.mean(cols, axis=0)
                ctx.set_source_rgba(*np.clip(c, 0, 1), a)
            else:
                g = cairo.LinearGradient(*p2[i0], *p2[i1])
                g.add_color_stop_rgba(0, *np.clip(cols[i0], 0, 1), a)
                g.add_color_stop_rgba(1, *np.clip(cols[i1], 0, 1), a)
                ctx.set_source(g)
            ctx.fill_preserve()
            ctx.set_line_width(0.8)
            ctx.stroke_preserve() if a >= 0.99 else None
            ctx.new_path()
            if m.edge > 0:
                ctx.move_to(*p2[0])
                for q in p2[1:]:
                    ctx.line_to(*q)
                ctx.close_path()
                ctx.set_line_width(1.6)
                ctx.set_source_rgba(1, 0.95, 0.9, m.edge * a)
                ctx.stroke()
            if fi in m.decals:
                ctx.save()
                spec = m.decals[fi]
                fn, (dw, dh) = spec[0], spec[1]
                order = spec[2] if len(spec) > 2 else ((2, 3, 0, 1) if fi == 1 else (1, 2, 3, 0))
                draw_on_quad(ctx, [p2[k] for k in order], dw, dh, fn)
                ctx.restore()

    # -------------------------------------------------- shadows
    def _shadow_layer(self):
        s, c = _layer()
        L = KEY
        any_ = False
        for m in self.meshes:
            if not m.cast:
                continue
            Pw = m.world()
            Pw = Pw[Pw[:, 1] > -1e-3]
            if not len(Pw):
                continue
            proj = Pw - L[None, :] * (Pw[:, 1:2] / L[1])
            proj[:, 1] = 0
            p2 = self.cam.proj(proj)
            if (p2[:, 2] < 0.05).any():
                continue
            hull = cv2.convexHull(p2[:, :2].astype(np.float32))
            c.move_to(*hull[0][0])
            for q in hull[1:]:
                c.line_to(*q[0])
            c.close_path()
            c.set_source_rgba(0, 0, 0, 0.85 * m.alpha)
            c.fill()
            any_ = True
        for pos, fn, r in self.sprites:
            if r > 0:
                x, y, z = self.cam.pt((pos[0] - 0.3 * r, 0, pos[2] + 0.2 * r))
                k = self.cam.px_per_unit((pos[0], 0, pos[2]))
                c.save()
                c.translate(x, y)
                c.scale(r * k, r * k * 0.35)
                c.arc(0, 0, 1, 0, 2 * math.pi)
                c.restore()
                c.set_source_rgba(0, 0, 0, 0.8)
                c.fill()
                any_ = True
        if not any_:
            return None
        blur_layer(s, 14, 0.25)
        return s

    def _contact_layer(self):
        """Tight dark occlusion right under the objects."""
        s, c = _layer()
        any_ = False
        for m in self.meshes:
            if not m.cast:
                continue
            Pw = m.world()
            low = Pw[Pw[:, 1] < 0.04]
            if len(low) < 3:
                continue
            low = low.copy()
            low[:, 1] = 0
            ctr = low.mean(axis=0)
            low = ctr + (low - ctr) * 1.04
            p2 = self.cam.proj(low)
            hull = cv2.convexHull(p2[:, :2].astype(np.float32))
            c.move_to(*hull[0][0])
            for q in hull[1:]:
                c.line_to(*q[0])
            c.close_path()
            c.set_source_rgba(0, 0, 0, 0.9 * m.alpha)
            c.fill()
            any_ = True
        if not any_:
            return None
        blur_layer(s, 5, 0.5)
        return s

    def render(self, ctx):
        if self.floor and self.reflect > 0 and self.meshes:
            rs, rc = _layer()
            self._draw_faces(rc, self._faces(mirror=True))
            # fade reflection with distance below the horizon line of the objects
            blur_layer(rs, 5, 0.5)
            ctx.set_source_surface(rs)
            ctx.paint_with_alpha(self.reflect)
        if self.floor and self.shadow > 0:
            sh = self._shadow_layer()
            if sh is not None:
                ctx.set_source_surface(sh)
                ctx.paint_with_alpha(self.shadow)
            ct = self._contact_layer()
            if ct is not None:
                ctx.set_source_surface(ct)
                ctx.paint_with_alpha(0.75)
        # meshes and sprites, depth-sorted together
        faces = self._faces()
        items = [(d, "f", (d, p, c, m, fi)) for d, p, c, m, fi in faces]
        for pos, fn, r in self.sprites:
            x, y, z = self.cam.pt(pos)
            if z > 0.05:
                items.append((float(np.linalg.norm(pos - self.cam.pos)), "s", (fn, x, y, self.cam.px_per_unit(pos), z)))
        items.sort(key=lambda it: -it[0])
        for d, kind, data in items:
            if kind == "f":
                self._draw_faces(ctx, [data])
            else:
                fn, x, y, k, z = data
                ctx.save()
                fn(ctx, x, y, k)
                ctx.restore()


# ------------------------------------------------------------------ shaded sphere / egg sprite
def sphere_sprite(color, r, gloss=0.6, sx=1.0, sy=1.0):
    base = np.array(col(color))

    def fn(ctx, x, y, k):
        R = r * k
        ctx.save()
        ctx.translate(x, y - R * sy)
        ctx.scale(sx, sy)
        g = cairo.RadialGradient(-R * 0.35, -R * 0.4, R * 0.05, 0, 0, R)
        hi = np.clip(base * 1.02 + 0.04, 0, 1)
        g.add_color_stop_rgb(0, *hi)
        g.add_color_stop_rgb(0.55, *(base * 0.7))
        g.add_color_stop_rgb(1, *(base * 0.28))
        ctx.arc(0, 0, R, 0, 2 * math.pi)
        ctx.set_source(g)
        ctx.fill()
        # rim light
        g = cairo.RadialGradient(R * 0.25, -R * 0.1, R * 0.7, 0, 0, R * 1.02)
        g.add_color_stop_rgba(0, *RIM_COL, 0)
        g.add_color_stop_rgba(1, *RIM_COL, 0.55)
        ctx.arc(0, 0, R, 0, 2 * math.pi)
        ctx.set_source(g)
        ctx.fill()
        # specular
        g = cairo.RadialGradient(-R * 0.38, -R * 0.45, 0, -R * 0.38, -R * 0.45, R * 0.32)
        g.add_color_stop_rgba(0, 1, 1, 1, 0.9 * gloss)
        g.add_color_stop_rgba(1, 1, 1, 1, 0)
        ctx.arc(0, 0, R, 0, 2 * math.pi)
        ctx.set_source(g)
        ctx.fill()
        ctx.restore()

    return fn


# ------------------------------------------------------------------ studio set (background)
def studio(ctx, cam, t, mood=(0.0, 0.0), w=W, h=H, accent=None):
    """Dark cinematic studio: back wall with LED strips, glossy floor, haze, beams. Drawn in the camera's view.
    mood[0] = red alarm amount, mood[1] = green/positive amount."""
    red, grn = mood
    # wall gradient (wine -> indigo), tinted by mood
    top = np.array([0.07, 0.035, 0.13]) * (1 - red) + np.array([0.20, 0.02, 0.04]) * red
    mid = np.array([0.20, 0.05, 0.13]) * (1 - red) + np.array([0.35, 0.03, 0.05]) * red
    top = top * (1 - grn) + np.array([0.02, 0.10, 0.08]) * grn
    mid = mid * (1 - grn) + np.array([0.04, 0.22, 0.14]) * grn
    hx, hy, _ = cam.pt((0, 0, 60))  # horizon (far floor line)
    g = cairo.LinearGradient(0, 0, 0, h)
    g.add_color_stop_rgb(0, *top)
    g.add_color_stop_rgb(clamp(hy / h - 0.02), *mid)
    g.add_color_stop_rgb(clamp(hy / h + 0.01), *(mid * 0.55))
    g.add_color_stop_rgb(1, *(mid * 0.32 + 0.015))
    ctx.set_source(g)
    ctx.paint()
    zw = 14.0  # back wall depth
    accent = np.array(accent if accent is not None else (1.0, 0.30, 0.45))
    strip = accent * (1 - red) + np.array([1.0, 0.15, 0.12]) * red
    strip = strip * (1 - grn) + np.array([0.25, 1.0, 0.55]) * grn
    # LED strips on the back wall + their streaks on the floor
    for i, x in enumerate((-9.5, -6.2, -3.0, 3.0, 6.2, 9.5)):
        a = 0.55 + 0.25 * math.sin(t * 0.7 + i * 1.7)
        p0 = cam.pt((x, 0.0, zw))
        p1 = cam.pt((x, 6.0, zw))
        k = cam.px_per_unit((x, 3, zw))
        sw = 0.10 * k
        # glow
        for gw, ga in ((sw * 10, 0.05), (sw * 4, 0.12), (sw * 1.6, 0.4)):
            ctx.rectangle(p1[0] - gw / 2, p1[1], gw, p0[1] - p1[1])
            ctx.set_source_rgba(*strip, ga * a)
            ctx.fill()
        ctx.rectangle(p1[0] - sw / 2, p1[1], sw, p0[1] - p1[1])
        ctx.set_source_rgba(*np.clip(strip * 0.4 + 0.65, 0, 1), 0.9 * a)
        ctx.fill()
        # floor reflection streak
        f0 = cam.pt((x, 0, zw))
        f1 = cam.pt((x, 0, 2.0))
        lg = cairo.LinearGradient(0, f0[1], 0, f1[1])
        lg.add_color_stop_rgba(0, *strip, 0.30 * a)
        lg.add_color_stop_rgba(1, *strip, 0.0)
        ctx.move_to(f0[0] - sw * 2, f0[1])
        ctx.line_to(f0[0] + sw * 2, f0[1])
        ctx.line_to(f1[0] + sw * 9, f1[1])
        ctx.line_to(f1[0] - sw * 9, f1[1])
        ctx.close_path()
        ctx.set_source(lg)
        ctx.fill()
    # big soft panel behind centre (key backdrop light)
    c = cam.pt((0, 2.6, zw))
    k = cam.px_per_unit((0, 2.6, zw))
    rg = cairo.RadialGradient(c[0], c[1], 0, c[0], c[1], 5.5 * k)
    rg.add_color_stop_rgba(0, *(strip * 0.6 + 0.2), 0.30)
    rg.add_color_stop_rgba(1, *strip, 0)
    ctx.set_source(rg)
    ctx.paint()
    # warm light pool on the floor where the action is (makes contact shadows read)
    pc = cam.pt((0.0, 0, 2.5))
    k = cam.px_per_unit((0, 0, 2.5))
    ctx.save()
    ctx.translate(pc[0], pc[1])
    ctx.scale(1.0, 0.32)
    rg = cairo.RadialGradient(0, 0, 0, 0, 0, 7.0 * k)
    rg.add_color_stop_rgba(0, 0.95, 0.70, 0.62, 0.30)
    rg.add_color_stop_rgba(0.6, 0.6, 0.35, 0.45, 0.12)
    rg.add_color_stop_rgba(1, 0.4, 0.2, 0.3, 0)
    ctx.arc(0, 0, 7.0 * k, 0, 2 * math.pi)
    ctx.set_source(rg)
    ctx.fill()
    ctx.restore()
    # floor grid (perspective)
    ctx.set_line_width(1.0)
    for gx in range(-16, 17, 2):
        a0 = cam.pt((gx, 0, 1.0))
        a1 = cam.pt((gx, 0, zw))
        if a0[2] > 0.05:
            ctx.move_to(a0[0], a0[1])
            ctx.line_to(a1[0], a1[1])
    for gz in range(1, int(zw) + 1):
        a0 = cam.pt((-16, 0, gz))
        a1 = cam.pt((16, 0, gz))
        ctx.move_to(a0[0], a0[1])
        ctx.line_to(a1[0], a1[1])
    ctx.set_source_rgba(*(strip * 0.6 + 0.3), 0.07)
    ctx.stroke()
    # wall / floor seam glow
    s0 = cam.pt((-20, 0, zw))
    s1 = cam.pt((20, 0, zw))
    lg = cairo.LinearGradient(0, s0[1] - 30, 0, s0[1] + 30)
    lg.add_color_stop_rgba(0, *strip, 0)
    lg.add_color_stop_rgba(0.5, *strip, 0.16)
    lg.add_color_stop_rgba(1, *strip, 0)
    ctx.rectangle(0, s0[1] - 30, w, 60)
    ctx.set_source(lg)
    ctx.fill()
    # floating deep-background cubes (out of focus thanks to the bg blur)
    for i in range(7):
        ang = t * 0.15 + i * 0.9
        p = (-11 + i * 3.6, 3.2 + 1.5 * math.sin(i * 2.1 + t * 0.3), zw - 1.5 - (i % 3))
        x, y, z = cam.pt(p)
        if z < 0.1:
            continue
        s = 0.45 * cam.px_per_unit(p)
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(ang)
        gfx_rrect(ctx, -s / 2, -s / 2, s, s, s * 0.18)
        lg = cairo.LinearGradient(-s / 2, -s / 2, s / 2, s / 2)
        lg.add_color_stop_rgba(0, *(strip * 0.5 + 0.2), 0.35)
        lg.add_color_stop_rgba(1, 0.05, 0.03, 0.1, 0.35)
        ctx.set_source(lg)
        ctx.fill()
        ctx.restore()


def gfx_rrect(ctx, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()


def beams(ctx, t, k=1.0, w=W, h=H, color=(1.0, 0.85, 0.7)):
    """Volumetric light beams from the top-left + floating dust (drawn over the set, under the subject)."""
    for i, (x0, spread, a) in enumerate(((260, 380, 0.07), (620, 300, 0.05), (1500, 420, 0.04))):
        sway = 40 * math.sin(t * 0.2 + i)
        g = cairo.LinearGradient(x0, -40, x0 + 300, h)
        g.add_color_stop_rgba(0, *color, a * k)
        g.add_color_stop_rgba(1, *color, 0)
        ctx.move_to(x0 - 60 + sway, -40)
        ctx.line_to(x0 + 60 + sway, -40)
        ctx.line_to(x0 + spread + 300 + sway, h)
        ctx.line_to(x0 - spread * 0.3 + 300 + sway, h)
        ctx.close_path()
        ctx.set_source(g)
        ctx.fill()


_DUST = np.random.default_rng(5).random((70, 4))


def dust(ctx, t, k=1.0, w=W, h=H, near=False):
    """Bokeh dust motes drifting slowly."""
    for i, (u, v, s, ph) in enumerate(_DUST):
        if near != (i % 4 == 0):
            continue
        x = (u * w + t * (12 + 20 * s) + 30 * math.sin(t * 0.3 + ph * 6)) % (w + 100) - 50
        y = (v * h - t * (6 + 10 * s) + 20 * math.cos(t * 0.25 + ph * 5)) % (h + 100) - 50
        r = (2 + 5 * s) * (5 if near else 1)
        a = (0.05 + 0.12 * s) * k * (0.35 if near else 1) * (0.6 + 0.4 * math.sin(t + ph * 9))
        g = cairo.RadialGradient(x, y, 0, x, y, r)
        g.add_color_stop_rgba(0, 1, 0.9, 0.8, a)
        g.add_color_stop_rgba(1, 1, 0.9, 0.8, 0)
        ctx.arc(x, y, r, 0, 2 * math.pi)
        ctx.set_source(g)
        ctx.fill()


# ------------------------------------------------------------------ narrator lighting
def light_character(surf, strength=1.0, rim_side=1):
    """Turn a flat character layer into a lit one: key-light gradient, rim light on the far edge, ambient occlusion low.
    rim_side: +1 -> rim on the right edge. Returns (lit surface, alpha mask uint8)."""
    a = to_np(surf)
    alpha = a[:, :, 3]
    ys, xs = np.nonzero(alpha > 8)
    if not len(xs):
        return surf, alpha
    x0, x1, y0, y1 = xs.min(), xs.max(), ys.min(), ys.max()
    pad = 30
    x0, y0 = max(0, x0 - pad), max(0, y0 - pad)
    x1, y1 = min(a.shape[1], x1 + pad), min(a.shape[0], y1 + pad)
    roi = a[y0:y1, x0:x1].astype(np.float32)
    al = roi[:, :, 3:4] / 255.0
    hh, ww = roi.shape[:2]
    # key gradient: brighter top-left, darker bottom-right
    gx = np.linspace(1.10, 0.78, ww, dtype=np.float32)[None, :, None]
    if rim_side < 0:
        gx = gx[:, ::-1]
    gy = np.linspace(1.06, 0.80, hh, dtype=np.float32)[:, None, None]
    lit = roi[:, :, :3] * (gx * gy)
    # warm key tint, cool shadow tint (BGR order)
    lit = lit * np.array([0.97, 0.99, 1.04], np.float32)
    # rim: alpha minus alpha shifted away from the rim side
    m = (al[:, :, 0] * 255).astype(np.uint8)
    sh = 7
    M = np.float32([[1, 0, -sh * rim_side], [0, 1, sh]])
    shifted = cv2.warpAffine(m, M, (ww, hh))
    rim = np.clip(m.astype(np.float32) - shifted.astype(np.float32), 0, 255) / 255.0
    rim = cv2.GaussianBlur(rim, (0, 0), 2.0)[:, :, None]
    rim_bgr = np.array([RIM_COL[2], RIM_COL[1], RIM_COL[0]], np.float32) * 255
    lit = lit + rim * rim_bgr * 0.85 * strength * al
    # top-left key edge light (thin warm)
    M2 = np.float32([[1, 0, 5 * rim_side], [0, 1, 5]])
    sh2 = cv2.warpAffine(m, M2, (ww, hh))
    edge = np.clip(m.astype(np.float32) - sh2.astype(np.float32), 0, 255) / 255.0
    edge = cv2.GaussianBlur(edge, (0, 0), 1.5)[:, :, None]
    lit = lit + edge * np.array([150, 200, 255], np.float32) * 0.35 * strength * al
    roi[:, :, :3] = np.clip(lit, 0, 255) * 1.0
    roi[:, :, :3] = np.minimum(roi[:, :, :3], roi[:, :, 3:4])  # keep premultiplied valid
    a[y0:y1, x0:x1] = roi.astype(np.uint8)
    surf.mark_dirty()
    return surf, alpha


def drop_shadow(dst_ctx, mask_surf, dx=-40, dy=10, sigma=26, alpha=0.55):
    """Soft shadow of a layer cast onto what is already drawn (character onto the set)."""
    s, c = _layer()
    c.set_source_rgba(0, 0, 0, 1)
    c.mask_surface(mask_surf, dx, dy)
    blur_layer(s, sigma, 0.25)
    dst_ctx.set_source_surface(s)
    dst_ctx.paint_with_alpha(alpha)


# ------------------------------------------------------------------ post-processing
_VIG = None
_GRAIN = None
_LUT = None


def _init_post(w, h):
    global _VIG, _GRAIN, _LUT
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    r = np.sqrt(((xx - w / 2) / (w * 0.62)) ** 2 + ((yy - h / 2) / (h * 0.70)) ** 2)
    _VIG = np.clip(1.0 - 0.55 * np.clip(r - 0.45, 0, None) ** 1.6, 0.0, 1.0)[:, :, None]
    rng = np.random.default_rng(3)
    small = [rng.normal(0, 1, (h // 2, w // 2)).astype(np.float32) for _ in range(6)]
    _GRAIN = [cv2.resize(g, (w, h), interpolation=cv2.INTER_LINEAR)[:, :, None] for g in small]
    # filmic tone curve + split toning (BGR): shadows -> teal/indigo, highlights -> warm
    x = np.arange(256, dtype=np.float32) / 255
    curve = x + 0.10 * np.sin(2 * np.pi * (x - 0.5) / 2) * (x * (1 - x)) * 4  # gentle S
    curve = np.clip(curve, 0, 1)
    b = np.clip(curve + 0.035 * (1 - x) ** 3 - 0.02 * x ** 2, 0, 1)
    g = np.clip(curve + 0.006 * (1 - x) ** 2, 0, 1)
    r_ = np.clip(curve - 0.01 * (1 - x) ** 3 + 0.025 * x ** 2, 0, 1)
    _LUT = np.stack([b, g, r_], axis=1)


def post(bgra, t, bloom=0.55, grain=1.4, exposure=1.0, flash=0.0):
    """Film look on a BGRA uint8 frame -> BGR uint8."""
    h, w = bgra.shape[:2]
    if _VIG is None or _VIG.shape[0] != h:
        _init_post(w, h)
    img = bgra[:, :, :3].astype(np.float32) * (1.0 / 255)
    # bloom: bright pass, two blur radii at low resolution
    if bloom > 0:
        small = cv2.resize(img, (w // 4, h // 4), interpolation=cv2.INTER_AREA)
        br = np.clip(small - 0.55, 0, None) * 1.6
        b1 = cv2.GaussianBlur(br, (0, 0), 4)
        b2 = cv2.GaussianBlur(cv2.resize(br, (w // 16, h // 16), interpolation=cv2.INTER_AREA), (0, 0), 3)
        b2 = cv2.resize(b2, (w // 4, h // 4), interpolation=cv2.INTER_LINEAR)
        bl = cv2.resize(b1 * 0.6 + b2 * 0.9, (w, h), interpolation=cv2.INTER_LINEAR)
        img += bl * bloom
    if exposure != 1.0 or flash > 0:
        img = img * exposure + flash
    # soft highlight roll-off
    img = img / (1 + 0.18 * img)
    img *= 1.18
    img *= _VIG
    if grain > 0:
        img += _GRAIN[int(t * 24) % len(_GRAIN)] * (grain / 255)
    out = np.clip(img * 255, 0, 255).astype(np.uint8)
    lut = (_LUT * 255).astype(np.uint8)
    for ch in range(3):
        out[:, :, ch] = cv2.LUT(out[:, :, ch], lut[:, ch])
    return out
