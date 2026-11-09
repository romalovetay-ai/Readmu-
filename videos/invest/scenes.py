"""Cinematic scenes. Each s_<name>(f) sets the camera, builds 3D objects and queues 2D overlays on the frame f.
render(b, tl, t, level, beats) composes one finished BGR frame."""
import math
import random
import numpy as np
import cairo

import cine
import fx
from cine import (W, H, Cam, Scene, box, bevel_box, cylinder, prism, wedge, sphere_sprite, ease, ease_io, ease_back,
                  clamp, col, gfx_rrect, draw_on_quad)
from fx import F_BLACK, F_XB, F_SB, F_MED
import character

GOLD, RED, GREEN, BLUE = (1.0, 0.74, 0.22), (0.95, 0.22, 0.26), (0.22, 0.85, 0.5), (0.3, 0.52, 1.0)


def at(b, k):
    return 0.0 if k == 0 else b["anchors"].get(k, b["dur"] * 0.5)


def age(b, k, tl):
    return tl - at(b, k)


# ------------------------------------------------------------------ frame
class Frame:
    def __init__(self, b, tl, t, lv, beats):
        self.b, self.tl, self.t, self.lv, self.beats = b, tl, t, lv, beats
        self.dur = b["dur"]
        self.cam = None
        self.sc = None
        self.mood = (0.0, 0.0)
        self.dof = 7.0
        self.mid = []
        self.ui = []
        self.char = None
        self.beams = 1.0
        self.accent = None
        self.exposure = 1.0
        self.flash = 0.0
        self.bloom = 0.55
        self.studio = True
        self.k_in = ease(tl / 1.0)   # settles from 0 to 1 over the first second
        self.prog = clamp(tl / max(0.1, self.dur))

    def scene(self, reflect=0.22, shadow=0.6):
        if self.sc is None:
            self.sc = Scene(self.cam, reflect=reflect, shadow=shadow)
        return self.sc

    def orbit(self, target=(0, 1.2, 2.0), dist=10.0, yaw=0.0, pitch=0.14, fov=36.0, push=0.06, drift=0.05, roll=0.0):
        """Slow cinematic camera: starts slightly further and settles in (push), drifts in yaw over the beat."""
        t = self.t
        d = dist * (1 + push * (1 - self.k_in)) * (1 - 0.03 * ease_io(self.prog))
        yw = yaw + drift * (ease_io(self.prog) - 0.5) + 0.012 * math.sin(t * 0.31)
        pt = pitch + 0.006 * math.sin(t * 0.23)
        tx, ty, tz = target
        pos = (tx + d * math.sin(yw) * math.cos(pt), ty + d * math.sin(pt), tz - d * math.cos(yw) * math.cos(pt))
        self.cam = Cam(pos, target, fov, roll=roll + 0.004 * math.sin(t * 0.4))
        return self.cam

    def put_char(self, where=None, shot=None):
        b = self.b
        where = where or b.get("char", "center")
        if where == "none":
            return
        shot = shot or b.get("shot", "medium" if where == "center" else "side")
        if shot == "close":
            x, base, sc = 960, H + 92, 1.0
        elif shot == "medium" or where == "center":
            x, base, sc = 960, H + 40, 0.70
        else:
            x, base, sc = (1560 if where == "right" else 360), H + 6, 0.56
        # parallax with the camera drift
        x += 18 * math.sin(self.t * 0.31)
        self.char = {"x": x, "base": base, "sc": sc, "where": where, "shot": shot}


def content_target(f, x=0.0, y=1.2, z=2.0):
    """Camera target so that 3D content around x sits left of the narrator (if he is on the right)."""
    shift = 2.3 if f.b.get("char", "center") == "right" else 0.0
    return (x + shift, y, z)


# ------------------------------------------------------------------ 3D building blocks
def coin_stack(sc, pos, n, r=0.55, hh=0.075, color="gold", ry=0.0, sides=36):
    """Stack of coins as one metal cylinder + groove rings (sprite)."""
    if n <= 0:
        return None
    m = cylinder(r, n * hh, sides, color, gloss=0.85, metal=0.8)
    m.place(pos, ry=ry)
    sc.add(m)
    cam = sc.cam
    x0, y0, z0 = pos

    def rings(ctx, x, y, k):
        ctx.set_line_width(1.2)
        for i in range(1, n):
            yy = y0 + i * hh
            pts = [(x0 + r * math.cos(a), yy, z0 + r * math.sin(a)) for a in np.linspace(math.pi, 2 * math.pi, 14)]
            p2 = cam.proj(np.array(pts))
            ctx.move_to(*p2[0, :2])
            for q in p2[1:]:
                ctx.line_to(*q[:2])
        ctx.set_source_rgba(0.35, 0.18, 0.02, 0.5)
        ctx.stroke()

    sc.sprite((x0, y0 + n * hh * 0.5, z0 - r - 0.01), rings)
    return m


def note_stack(sc, pos, h, w=1.5, d=0.75, ry=0.0, color=(0.30, 0.62, 0.45)):
    """Stack of banknotes with a printed top and paper edge stripes."""
    m = box(w, h, d, color, gloss=0.25)
    m.place(pos, ry=ry)
    m.face_colors = {0: (0.30, 0.55, 0.40), 2: (0.28, 0.52, 0.38), 3: (0.28, 0.52, 0.38)}

    def top(ctx):
        ctx.rectangle(0, 0, 300, 150)
        ctx.set_source_rgb(0.34, 0.64, 0.48)
        ctx.fill()
        ctx.rectangle(12, 12, 276, 126)
        ctx.set_source_rgba(1, 1, 1, 0.25)
        ctx.set_line_width(3)
        ctx.stroke()
        ctx.arc(75, 75, 38, 0, 2 * math.pi)
        ctx.set_source_rgba(1, 1, 1, 0.22)
        ctx.fill()
        fx.plain(ctx, "₽", 75, 96, 60, F_BLACK, (0.1, 0.3, 0.2), 0.8, shadow=0)
        fx.plain(ctx, "5000", 210, 95, 52, F_BLACK, (0.12, 0.32, 0.22), 0.85, shadow=0)

    def side(ctx):
        n = max(3, int(h / 0.045))
        ctx.rectangle(0, 0, 300, 100)
        ctx.set_source_rgb(0.30, 0.55, 0.40)
        ctx.fill()
        for i in range(n):
            ctx.rectangle(0, i * 100 / n, 300, 100 / n * 0.28)
        ctx.set_source_rgba(0.85, 0.95, 0.85, 0.55)
        ctx.fill()
        # paper band around the bundle
        ctx.rectangle(130, 0, 40, 100)
        ctx.set_source_rgba(0.95, 0.92, 0.8, 0.9)
        ctx.fill()

    m.decals[4] = (top, (300, 150))
    m.decals[0] = (side, (300, 100))
    m.decals[3] = (side, (300, 100))
    sc.add(m)
    return m


def tile(sc, pos, w, h, d, color, fn=None, ry=0.0, rx=0.0, dw=400, gloss=0.5, alpha=1.0, emissive=0.0):
    """Bevelled block with optional front decal fn(ctx) in a dw x dw*h/w canvas."""
    m = box(w, h, d, color, gloss=gloss, alpha=alpha, emissive=emissive)
    m.place(pos, rx=rx, ry=ry)
    if fn:
        m.decals[0] = (fn, (dw, dw * h / w))
    sc.add(m)
    return m


def area_line(cam, pts, color, alpha=1.0, fill=0.45, lw=6, glow=True, upto=1.0, base_y=0.0):
    """Sprite fn: glowing 3D line through world points with a gradient area down to the floor."""
    c = np.array(col(color))
    P = np.array(pts, float)
    n = len(P)
    m = max(2, int(1 + (n - 1) * clamp(upto)))
    frac = (n - 1) * clamp(upto) - (m - 1) + 1
    P = P[:m].copy()
    if m < n and m >= 2:
        nxt = np.array(pts[m], float)
        P = np.vstack([P, P[-1] + (nxt - P[-1]) * clamp(frac)])
    top = cam.proj(P)
    bot = cam.proj(P * np.array([1, 0, 1]) + np.array([0, base_y, 0]))

    def fn(ctx, x, y, k):
        if fill > 0:
            ctx.move_to(*top[0, :2])
            for q in top[1:]:
                ctx.line_to(*q[:2])
            for q in bot[::-1]:
                ctx.line_to(*q[:2])
            ctx.close_path()
            ymin = top[:, 1].min()
            ymax = bot[:, 1].max()
            g = cairo.LinearGradient(0, ymin, 0, ymax)
            g.add_color_stop_rgba(0, *c, fill * alpha)
            g.add_color_stop_rgba(1, *c, 0.02 * alpha)
            ctx.set_source(g)
            ctx.fill()
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        for w_, a in (((lw * 5, 0.10), (lw * 2.2, 0.25)) if glow else ()) + ((lw, 1.0), (lw * 0.35, 0.9)):
            ctx.move_to(*top[0, :2])
            for q in top[1:]:
                ctx.line_to(*q[:2])
            ctx.set_line_width(w_)
            cc = c if w_ != lw * 0.35 else np.clip(c * 0.4 + 0.65, 0, 1)
            ctx.set_source_rgba(*cc, a * alpha)
            ctx.stroke()
        # glowing head
        hx, hy = top[-1, :2]
        rg = cairo.RadialGradient(hx, hy, 0, hx, hy, lw * 5)
        rg.add_color_stop_rgba(0, 1, 1, 1, 0.9 * alpha)
        rg.add_color_stop_rgba(0.3, *c, 0.6 * alpha)
        rg.add_color_stop_rgba(1, *c, 0)
        ctx.arc(hx, hy, lw * 5, 0, 2 * math.pi)
        ctx.set_source(rg)
        ctx.fill()

    return fn, top


def lbl3d(sc, pos, s, size=34, color="white", alpha=1.0, bg=True, face=F_XB):
    """Caption that lives at a 3D point (depth-sorted, follows the camera)."""
    def fn(ctx, x, y, k):
        fx.label(ctx, s, x, y, size, color, alpha, "center", bg, face)
    sc.sprite(pos, fn)


def big3d(sc, pos, s, size, color="white", age_=1.0):
    def fn(ctx, x, y, k):
        fx.pop3d(ctx, s, x, y, size, age_, color)
    sc.sprite(pos, fn)


def pedestal(sc, pos, r=1.0, h=0.25, color=(0.16, 0.13, 0.22)):
    m = cylinder(r, h, 40, color, gloss=0.7)
    m.place(pos)
    sc.add(m)
    cam = sc.cam

    def ring(ctx, X, Y, K):
        pts = [(pos[0] + r * 1.005 * math.cos(a), pos[1] + h * 0.6, pos[2] + r * 1.005 * math.sin(a)) for a in np.linspace(0, 2 * math.pi, 48)]
        p2 = cam.proj(np.array(pts))
        for w_, a in ((10, 0.12), (4, 0.35), (1.5, 0.9)):
            ctx.move_to(*p2[0, :2])
            for q in p2[1:]:
                ctx.line_to(*q[:2])
            ctx.close_path()
            ctx.set_line_width(w_)
            ctx.set_source_rgba(1.0, 0.45, 0.6, a)
            ctx.stroke()
    sc.sprite((pos[0], pos[1] + h, pos[2] - r * 0.98), ring)
    return h


def cone(r0, r1, h, n=28, color="brown", **kw):
    ang = [2 * math.pi * i / n for i in range(n)]
    v = [(r0 * math.cos(a), 0, r0 * math.sin(a)) for a in ang] + [(r1 * math.cos(a), h, r1 * math.sin(a)) for a in ang]
    faces = [list(range(2 * n - 1, n - 1, -1)), list(range(n))]
    for i in range(n):
        j = (i + 1) % n
        faces.append([i, n + i, n + j, j])
    m = cine.Mesh(v, faces, color, smooth=[False, False] + [True] * n,
                  vn=np.array([(math.cos(a), (r0 - r1) / h, math.sin(a)) for a in ang] * 2, float), **kw)
    cine._orient(m)
    return m


def pops(f, items, x=None, ys=(190, 320, 440)):
    """Talk-scene headlines (3D extruded) queued as UI."""
    b = f.b
    centre = f.char and f.char["shot"] in ("medium", "close")
    for i, p in enumerate(items):
        k, s, y, size, c = p
        a = age(b, k, f.tl)
        if a < 0:
            continue
        if centre:
            xx = 960 if f.char["shot"] == "medium" else (330 if i % 2 == 0 else 1590)
            yy = ys[min(i, 2)] - (40 if f.char["shot"] == "close" else 0)
            if f.char["shot"] == "close":
                yy = 260 + 150 * i
            sz = min(size, 130 if i == 0 else 100)
        else:
            xx, yy, sz = x or 700, y, size
        mw = 900 if not (centre and f.char["shot"] == "close") else 560
        f.ui.append(lambda ctx, s=s, xx=xx, yy=yy, sz=sz, a=a, c=c, mw=mw: fx.pop3d(ctx, s, xx, yy, fx.fit(ctx, s, sz, mw), a, c))


# ------------------------------------------------------------------ scenes
def s_talk(f):
    b = f.b
    f.put_char("center", b.get("shot", "medium"))
    close = f.char["shot"] == "close"
    f.orbit((0, 1.6, 6.0), 9.0 if close else 11.0, yaw=0.10 if b["idx"] % 2 else -0.10, pitch=0.08, fov=30 if close else 36)
    f.dof = 14 if close else 10
    if b.get("pops"):
        pops(f, b["pops"])


def s_disclaimer(f):
    f.orbit((0, 1.5, 6), 12, 0.0, 0.1)
    f.dof = 18
    f.beams = 0.4
    a = clamp(f.tl / 0.5) * (1 - clamp((f.tl - f.dur + 0.5) / 0.5))

    def ui(ctx):
        ctx.set_source_rgba(0, 0, 0, 0.45 * a)
        ctx.paint()
        fx.glass(ctx, 360, 380, 1200, 300, a)
        fx.plain(ctx, "Не индивидуальная инвестиционная рекомендация.", 960, 500, 46, F_XB, "white", a)
        fx.plain(ctx, "Все цифры — примеры для понимания, а не обещания доходности.", 960, 575, 34, F_SB, "grey", a)
    f.ui.append(ui)


def s_chapter(f):
    b, tl = f.b, f.tl
    yaw = -0.35 + 0.25 * ease_io(tl / f.dur)
    f.orbit((0, 1.6, 4), 11, yaw, 0.10, fov=34, push=0.25, drift=0)
    f.dof = 12
    f.flash = 0.22 * max(0.0, 1 - tl / 0.2)
    sc = f.scene(reflect=0.35)
    # floating ring of glowing tiles behind the title
    for i in range(14):
        a = i / 14 * 2 * math.pi + tl * 0.25
        m = bevel_box(0.5, 0.5, 0.08, 0.06, "dark", gloss=0.9)
        m.place((math.cos(a) * 4.5, 2.2 + math.sin(a) * 1.6, 7 + math.sin(a) * 0.5), rz=a, ry=0.3)
        m.cast = False
        m.edge = 0.25
        sc.add(m)
    k = ease(tl / 0.6)

    def ui(ctx):
        sw = (tl - 0.3) / 0.8
        if b.get("num"):
            fx.plain(ctx, "ГЛАВА " + b["num"], 960, 330, 40, F_XB, "gold", clamp(tl / 0.4), shadow=0.3)
            # huge ghost number behind
            ctx.save()
            ctx.translate(960, 640)
            s = 1.15 - 0.15 * k
            ctx.scale(s, s)
            fx._font(ctx, F_BLACK, 520)
            e = ctx.text_extents(b["num"])
            ctx.move_to(-e.x_advance / 2, 170)
            ctx.text_path(b["num"])
            ctx.set_line_width(3)
            ctx.set_source_rgba(1, 0.5, 0.6, 0.18 * k)
            ctx.stroke()
            ctx.restore()
        size = fx.fit(ctx, b["title"], 150, 1500)
        fx.pop3d(ctx, b["title"], 960, 560, size, tl - 0.05, "white")
        if b.get("title2"):
            s2 = fx.fit(ctx, b["title2"], 66, 1400, F_XB)
            fx.pop3d(ctx, b["title2"], 960, 670, s2, tl - 0.3, "gold", face=F_XB)
        fx.flare(ctx, 960 - 700 + 1400 * ease_io(tl / f.dur), 480, 0.9 * math.sin(math.pi * clamp(tl / f.dur)))
        fx.letterbox(ctx, min(1.0, tl / 0.35) * (1 - clamp((tl - f.dur + 0.3) / 0.3)))
    f.ui.append(ui)


def s_melt(f):
    b, tl = f.b, f.tl
    f.put_char()
    stage = b.get("stage", 1)
    f.orbit(content_target(f, 0, 1.1, 2.5), 7.0, yaw=-0.30 + 0.15 * f.prog, pitch=0.30)
    sc = f.scene()
    # value shrinks over time: stage 1 -> 100 .. 92, stage 2 -> 92 .. 65
    if stage == 1:
        v = 1.0 - 0.08 * ease_io(clamp((tl - at(b, 2)) / 3.0))
    else:
        v = 0.92 - 0.27 * ease_io(clamp((tl - 0.5) / 3.5))
    h = 1.6 * v
    note_stack(sc, (0, 0, 2.5), h, 1.6, 0.8, ry=0.15)
    # golden puddle where the value melts
    pud = 1.0 - v

    def puddle(ctx, x, y, k):
        cx, cy, _ = sc.cam.pt((0.15, 0.002, 2.6))
        rx = (0.6 + 2.8 * pud) * k
        ctx.save()
        ctx.translate(cx, cy)
        ctx.scale(1, 0.28)
        rg = cairo.RadialGradient(-rx * 0.3, -rx * 0.2, 0, 0, 0, rx)
        rg.add_color_stop_rgba(0, 1.0, 0.85, 0.4, 0.85)
        rg.add_color_stop_rgba(0.7, 0.85, 0.55, 0.12, 0.7)
        rg.add_color_stop_rgba(1, 0.6, 0.35, 0.05, 0)
        ctx.arc(0, 0, rx, 0, 2 * math.pi)
        ctx.set_source(rg)
        ctx.fill()
        ctx.restore()
    if pud > 0.01:
        sc.sprite((0.15, 0.0, 3.4), puddle)
    # drips
    val = int(round(100 * v)) * 1000
    lbl_pos = (0, 2.6, 2.5)

    def ui(ctx):
        x, y, _ = sc.cam.pt(lbl_pos)
        fx.text3d(ctx, f"{val:,}".replace(",", " ") + " ₽", x, y, 96, "white" if v > 0.95 else "gold", clamp(tl / 0.3))
        if stage == 1 and age(b, 2, tl) > 0:
            fx.pop3d(ctx, "ТИХО ХУДЕЮТ", x, 980, 72, age(b, 2, tl), "red", face=F_XB)
        if stage == 2:
            fx.pop3d(ctx, "≈ 65 000 ₽ ЧЕРЕЗ 10 ЛЕТ", x, 980, 52, tl - 1.0, "gold", face=F_XB)
            if age(b, 1, tl) > 0:
                fx.pop3d(ctx, "ИНФЛЯЦИЯ", x, 170, 110, age(b, 1, tl), "red")
    f.ui.append(ui)


def s_agenda(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.8, 3.0), 9.5, yaw=-0.18, pitch=0.10)
    sc = f.scene()
    cam = sc.cam
    for i, (k, s) in enumerate(b["items"]):
        a = age(b, k, tl)
        if a < 0:
            continue
        e = ease_back(a / 0.6)
        y = 3.1 - i * 1.25
        x = 0.5 + (1 - e) * -3.0
        alpha = clamp(a / 0.3)

        def fn(ctx, X, Y, K, s=s, x=x, y=y, alpha=alpha, i=i, a=a):
            w, h = 5.0, 1.0
            corners = [(x - w / 2, y + h / 2, 2.5 + i * 0.15), (x + w / 2, y + h / 2, 2.2 + i * 0.15),
                       (x + w / 2, y - h / 2, 2.2 + i * 0.15), (x - w / 2, y - h / 2, 2.5 + i * 0.15)]
            q = cam.proj(np.array(corners))

            def content(c):
                fx.glass(c, 0, 0, 920, 180, alpha, r=30, glow=(1, 0.75, 0.3) if a < 1.0 else None)
                gfx_rrect(c, 24, 30, 120, 120, 26)
                c.set_source_rgba(1, 0.74, 0.22, alpha)
                c.fill()
                fx.plain(c, str(i + 1), 84, 117, 80, F_BLACK, (0.15, 0.08, 0.02), alpha, shadow=0)
                fx.plain(c, s, 180, 117, fx.fit(c, s, 62, 700), F_BLACK, "white", alpha, "left")
            draw_on_quad(ctx, q, 920, 180, content, subdiv=2)
        sc.sprite((x, y, 2.3 + i * 0.15), fn)


def s_prices(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.3, 2.5), 10, yaw=-0.3 + 0.12 * f.prog, pitch=0.16)
    sc = f.scene()
    a1, a2 = age(b, 1, tl), age(b, 2, tl)
    hp = 0.6 + 1.7 * ease_io(clamp(a1 / 3.0)) if a1 > 0 else 0.6
    hs = 0.6 + 1.0 * ease_io(clamp(a2 / 3.0)) if a2 > 0 else 0.6
    m = bevel_box(1.2, hp, 1.2, 0.1, "red", gloss=0.6)
    m.place((-1.2, 0, 2.5))
    sc.add(m)
    coin_stack(sc, (1.2, 0, 2.5), max(1, int(hs / 0.075)), 0.55)
    lbl3d(sc, (-1.2, hp + 0.45, 2.5), "ЦЕНЫ", 40, "red")
    lbl3d(sc, (1.2, hs + 0.45, 2.5), "ЗАРПЛАТА И НАКОПЛЕНИЯ", 32, "gold")

    def ui(ctx):
        x, y, _ = sc.cam.pt((-1.2, hp + 1.1, 2.5))
        if a1 > 0:
            fx.arrow(ctx, x, y + 60, x, y - 40 - 30 * math.sin(tl * 3), "red", clamp(a1 / 0.3))
        fx.pop3d(ctx, "ИНФЛЯЦИЯ", 640, 170, 100, tl, "white")
    f.ui.append(ui)


def s_shawarma(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.0, 2.5), 7.5, yaw=-0.2 + 0.3 * f.prog, pitch=0.18)
    sc = f.scene()
    # plate + shawarma roll (cylinder lying on its side) + price tag flipping
    plate = cylinder(1.3, 0.08, 40, "white", gloss=0.8)
    plate.place((0, 0, 2.5))
    sc.add(plate)
    roll = cylinder(0.38, 1.9, 28, (0.93, 0.80, 0.55), gloss=0.2)
    roll.place((-0.95, 0.47, 2.5), rz=-math.pi / 2, ry=0.4)
    sc.add(roll)
    filling = cylinder(0.33, 0.06, 24, (0.75, 0.35, 0.15), gloss=0.3)
    filling.place((0.62, 0.70, 2.0), rz=-math.pi / 2, ry=0.4)
    filling.cast = False
    sc.add(filling)
    flip = ease_io(clamp((age(b, 1, tl)) / 0.6))
    tag = box(1.4, 0.8, 0.05, (1.0, 0.85, 0.3), y0=False, gloss=0.4)
    ang = math.pi * flip
    tag.place((1.5, 2.1 + 0.05 * math.sin(tl * 2), 2.3), ry=ang + 0.2)
    sc.add(tag)
    front = "100 ₽"
    back = "400 ₽"

    def ft(ctx):
        ctx.rectangle(0, 0, 400, 230)
        ctx.set_source_rgb(1.0, 0.86, 0.32)
        ctx.fill()
        fx.plain(ctx, front, 200, 145, 110, F_BLACK, (0.15, 0.1, 0.05), 1, shadow=0)

    def bk(ctx):
        ctx.rectangle(0, 0, 400, 230)
        ctx.set_source_rgb(1.0, 0.40, 0.35)
        ctx.fill()
        fx.plain(ctx, back, 200, 145, 110, F_BLACK, (1, 1, 1), 1, shadow=0)
    tag.decals[0] = (ft, (400, 230))
    tag.decals[1] = (bk, (400, 230))
    lbl3d(sc, (1.5, 2.85, 2.3), "ШАУРМА", 34, "cream")

    def ui(ctx):
        if age(b, 1, tl) > 0.8:
            fx.pop3d(ctx, "ТОЛЬКО ПОНЮХАТЬ", 620, 940, 72, age(b, 1, tl) - 0.8, "gold", face=F_XB)
    f.ui.append(ui)


def s_treadmill(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 0.9, 2.5), 8.5, yaw=-0.45 + 0.1 * f.prog, pitch=0.2)
    sc = f.scene()
    base = box(4.2, 0.35, 1.6, (0.12, 0.11, 0.15), gloss=0.6)
    base.place((0, 0, 2.5))
    sc.add(base)
    off = (tl * 300) % 60

    def belt(ctx):
        ctx.rectangle(0, 0, 840, 320)
        ctx.set_source_rgb(0.08, 0.08, 0.1)
        ctx.fill()
        for i in range(-1, 16):
            ctx.rectangle(i * 60 + off, 0, 8, 320)
        ctx.set_source_rgba(1, 1, 1, 0.12)
        ctx.fill()
    base.decals[4] = (belt, (840, 320))
    for sx in (-1.9, 1.9):
        p = box(0.12, 1.8, 0.12, (0.3, 0.3, 0.35), gloss=0.8, metal=0.6)
        p.place((sx, 0.35, 1.9))
        sc.add(p)
    bar = box(4.0, 0.1, 0.12, (0.3, 0.3, 0.35), gloss=0.8, metal=0.6)
    bar.place((0, 2.15, 1.9))
    sc.add(bar)
    # rolling coin on the belt, running but staying in place
    coin = cylinder(0.55, 0.12, 36, "gold", gloss=0.9, metal=0.8, y0=-0.06)
    coin.place((0, 0.35 + 0.55 + 0.03 * abs(math.sin(tl * 9)), 2.5), rx=math.pi / 2, ry=0.0, rz=tl * 6)
    sc.add(coin)
    lbl3d(sc, (0, 1.75, 2.5), "ВКЛАД", 38, "gold")

    def ui(ctx):
        if age(b, 1, tl) > 0:
            fx.pop3d(ctx, "ВКЛАД ≈ ИНФЛЯЦИЯ", 640, 180, 84, age(b, 1, tl), "white")
        if age(b, 2, tl) > 0:
            fx.pop3d(ctx, "СТОИШЬ НА МЕСТЕ", 640, 960, 66, age(b, 2, tl), "red", face=F_XB)
    f.ui.append(ui)


def _walk(seed, n, trend, vol, crash_at=None, crash=0.0):
    rnd = random.Random(seed)
    v, out = 0.0, []
    for i in range(n):
        v += trend + rnd.gauss(0, vol)
        if crash_at is not None and i == crash_at:
            v -= crash
        out.append(v)
    return out


def s_race(f):
    b, tl = f.b, f.tl
    f.orbit((0.5, 1.6, 3.0), 10.5, yaw=-0.42 + 0.22 * f.prog, pitch=0.18)
    sc = f.scene(reflect=0.3)
    cam = sc.cam
    n = 40
    xs = np.linspace(-4.5, 4.5, n)
    lines = [("ИНФЛЯЦИЯ", "red", [0.3 + 0.031 * i for i in range(n)], 4.2),
             ("ВКЛАДЫ", "blue", [0.3 + 0.040 * i + 0.03 * math.sin(i * 0.7) for i in range(n)], 3.0),
             ("АКЦИИ", "gold", [0.3 + v for v in np.maximum(-0.2, np.array(_walk(4, n, 0.085, 0.13)))], 1.8)]
    up = clamp((tl - 0.3) / max(1.0, f.dur - 1.5))
    for name, c, ys, z in lines:
        pts = [(x, max(0.05, y), z) for x, y in zip(xs, ys)]
        fn, top = area_line(cam, pts, c, upto=ease_io(up), fill=0.35)
        sc.sprite((0, 1, z), fn)
        k = int((n - 1) * ease_io(up))
        lbl3d(sc, (pts[k][0] + 0.2, pts[k][1] + (0.45 if c != "red" else -0.25), z), name, 34, c)

    def ui(ctx):
        fx.pop3d(ctx, "В ДОЛГУЮ", 960, 150, 90, tl - 0.2, "white")
        fx.plain(ctx, "условная иллюстрация, не реальные котировки", 960, 1040, 26, F_MED, "grey", 0.8)
        if age(b, 2, tl) > 0:
            fx.pop3d(ctx, "10–20 ЛЕТ", 960, 260, 64, age(b, 2, tl), "gold", face=F_XB)
    f.ui.append(ui)


def kiosk(sc, pos, closed=0.0, t=0.0):
    x, y, z = pos
    body = bevel_box(3.0, 2.2, 2.0, 0.12, (0.86, 0.80, 0.70), gloss=0.3)
    body.place(pos)
    sc.add(body)
    win = box(2.2, 1.0, 0.05, (1.0, 0.75, 0.4), emissive=0.9 * (1 - closed), gloss=0.9)
    win.place((x, y + 0.7, z - 1.03))
    win.cast = False
    sc.add(win)
    # striped awning
    aw = prism([(-1.7, -1.6), (1.7, -1.6), (1.7, -0.9), (-1.7, -0.9)], 0.12, "red", gloss=0.3)
    aw.place((x, y + 2.05, z), rx=-0.35)
    sc.add(aw)
    roof = box(3.2, 0.25, 2.2, (0.25, 0.2, 0.3), gloss=0.5)
    roof.place((x, y + 2.2, z))
    sc.add(roof)
    sign = box(2.8, 0.7, 0.1, (0.12, 0.08, 0.16), gloss=0.6)
    sign.place((x, y + 2.45, z - 0.9))
    sign.cast = False

    def sg(ctx):
        ctx.rectangle(0, 0, 560, 140)
        ctx.set_source_rgb(0.12, 0.06, 0.15)
        ctx.fill()
        fx.text3d(ctx, "ШАУРМА У ВАСИ", 280, 92, 58, "gold", 1, glow=0.6, depth=3)
    sign.decals[0] = (sg, (560, 140))
    sc.add(sign)
    if closed > 0:
        def tape(ctx, X, Y, k):
            cx, cy, _ = sc.cam.pt((x, y + 1.1, z - 1.1))
            ctx.save()
            ctx.translate(cx, cy)
            ctx.rotate(-0.25)
            w = 3.4 * k * closed
            ctx.rectangle(-w / 2, -0.16 * k, w, 0.32 * k)
            ctx.set_source_rgb(1.0, 0.85, 0.1)
            ctx.fill()
            fx.plain(ctx, "ЗАКРЫТО", 0, 0.1 * k, 0.24 * k, F_BLACK, (0.1, 0.1, 0.1), closed, shadow=0)
            ctx.restore()
        sc.sprite((x, y + 1.1, z - 1.2), tape)


def s_shop(f):
    b, tl = f.b, f.tl
    f.put_char()
    stage = b.get("stage", 1)
    if stage == 3:
        f.mood = (min(1.0, tl / 0.4) * 0.9, 0.0)
    sc_target = content_target(f, -0.6 if stage == 2 else 0.0, 1.4, 3.0)
    f.orbit(sc_target, 12.5 if stage != 1 else 10.5, yaw=-0.35 + 0.15 * f.prog, pitch=0.17)
    sc = f.scene()
    kx = -1.6 if stage >= 2 else 0.0
    kiosk(sc, (kx, 0, 3.4), closed=clamp(age(b, 1, tl) / 0.4) if stage == 3 else 0.0, t=tl)
    if stage == 1:
        a2 = age(b, 2, tl)
        if a2 > 0:
            ghost = bevel_box(3.0, 2.2, 2.0, 0.12, (0.5, 0.5, 0.7), alpha=0.25 * clamp(a2 / 0.5), gloss=0.2)
            ghost.place((3.6, 0, 3.4))
            ghost.edge = 0.4
            sc.add(ghost)
            lbl3d(sc, (3.6, 2.7, 3.4), "ВТОРАЯ ТОЧКА?", 34, "grey")
    if stage >= 2:
        # 100 shares: 10 x 10 cubes, one flies out
        a0 = tl
        out = age(b, 1, tl)
        for i in range(10):
            for j in range(10):
                d = 0.16
                p0 = (1.4 + i * 0.19, 0, 2.2 + j * 0.19)
                appear = clamp((a0 - (i + j) * 0.025) / 0.3)
                if appear <= 0:
                    continue
                if i == 9 and j == 0 and out > 0:
                    continue
                c = "gold" if stage == 2 else (0.35, 0.33, 0.38)
                m = box(d, d * appear, d, c, gloss=0.6, metal=0.3)
                m.place(p0)
                m.cast = False
                sc.add(m)
        lbl3d(sc, (2.25, 0.75, 2.2), "100 АКЦИЙ", 32, "white")
        if out > 0:
            e = ease_io(clamp(out / 0.9))
            p = (1.4 + 9 * 0.19 - e * 1.6, 0.1 + e * 1.4, 2.2 - e * 1.2)
            if stage == 3:
                fall = clamp((tl - at(b, 2)) / 0.8)
                p = (p[0], max(0.0, p[1] - 1.7 * fall ** 2), p[2])
            m = bevel_box(0.62, 0.62, 0.62, 0.06, "gold" if stage == 2 else (0.4, 0.38, 0.42), gloss=0.8, metal=0.5)
            m.place(p, ry=tl * 0.8, rx=0.3 * (stage == 3) * clamp((tl - at(b, 2)) / 0.8))
            sc.add(m)
            lbl3d(sc, (p[0], p[1] + 1.0, p[2]), "ТВОЯ 1%" if stage == 2 else "НИКОМУ НЕ НУЖНА", 36,
                  "gold" if stage == 2 else "red")

    def ui(ctx):
        if stage == 2 and age(b, 2, tl) > 0:
            fx.pop3d(ctx, "ТЫ СОВЛАДЕЛЕЦ!", 640, 180, 96, age(b, 2, tl), "gold")
        if stage == 3:
            fx.pop3d(ctx, "АКЦИИ ПАДАЮТ", 640, 170, 104, tl, "red")
    f.ui.append(ui)


def s_tickers(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.8, 3.0), 10, yaw=-0.25 + 0.12 * f.prog, pitch=0.08)
    sc = f.scene()
    names = [("СБЕР", "green"), ("ЛУКОЙЛ", "red"), ("ЯНДЕКС", "amber")]
    a2 = age(b, 2, tl)
    # Vasya's kiosk as a small block that is replaced by tickers
    for i, (nm, c) in enumerate(names):
        a = a2 - i * 0.25
        if a < 0:
            continue
        e = ease_back(a / 0.5)
        rnd = random.Random(i)
        spark = [0.5 + 0.08 * k + rnd.gauss(0, 0.12) for k in range(16)]

        def fn(ctx, nm=nm, c=c, spark=spark):
            ctx.rectangle(0, 0, 400, 300)
            g = cairo.LinearGradient(0, 0, 0, 300)
            g.add_color_stop_rgb(0, 0.16, 0.12, 0.22)
            g.add_color_stop_rgb(1, 0.07, 0.05, 0.10)
            ctx.set_source(g)
            ctx.fill()
            fx.plain(ctx, nm, 200, 90, 62, F_BLACK, "white", 1, shadow=0)
            ctx.move_to(30, 270 - spark[0] * 80)
            for k, v in enumerate(spark):
                ctx.line_to(30 + k * 22.6, 270 - min(1.6, v) * 80)
            ctx.set_line_width(6)
            ctx.set_source_rgb(*col("green"))
            ctx.stroke()
        tile(sc, (-1.9 + i * 2.2, 0.9 + 0.08 * math.sin(tl * 1.5 + i), 3.0), 1.8 * e, 1.35 * e, 0.18, (0.2, 0.16, 0.26), fn,
             ry=0.0, gloss=0.8)
    a0 = tl
    if a2 < 0:
        # one share cube = a piece of a company
        m = bevel_box(1.0, 1.0, 1.0, 0.08, "gold", gloss=0.85, metal=0.5)
        m.place((0, 0.4 + 0.1 * math.sin(tl * 2), 3.0), ry=tl * 0.7)
        sc.add(m)
        lbl3d(sc, (0, 2.1, 3.0), "АКЦИЯ = КУСОЧЕК КОМПАНИИ", 38, "gold")

    def ui(ctx):
        fx.pop3d(ctx, "АКЦИЯ", 640, 170, 110, a0, "white")
    f.ui.append(ui)


def s_twoways(f):
    b, tl = f.b, f.tl
    f.orbit((0, 1.6, 3.0), 10.5, yaw=-0.12 + 0.24 * f.prog, pitch=0.14)
    sc = f.scene()
    a1, a2 = age(b, 1, tl), age(b, 2, tl)
    pedestal(sc, (-2.6, 0, 3.0), 1.3)
    pedestal(sc, (2.6, 0, 3.0), 1.3)
    if a1 > 0:
        g = 0.6 + 0.7 * ease_io(clamp(a1 / 2.0))
        m = bevel_box(g, g, g, 0.06, "gold", gloss=0.85, metal=0.6)
        m.place((-2.6, 0.25, 3.0), ry=tl * 0.5)
        sc.add(m)
        lbl3d(sc, (-2.6, 0.25 + g + 0.5, 3.0), "+ РОСТ ЦЕНЫ", 40, "green")
    if a2 > 0:
        n = int(clamp(a2 / 2.5) * 14)
        coin_stack(sc, (2.6, 0.25, 3.0), max(1, n), 0.6)
        ph = (a2 * 1.6) % 1.0
        if a2 < 3.5:
            c = cylinder(0.6, 0.075, 30, "gold", gloss=0.9, metal=0.8)
            c.place((2.6, 0.25 + n * 0.075 + 3.0 * (1 - ph) ** 2, 3.0), rx=0.3 * (1 - ph))
            sc.add(c)
        lbl3d(sc, (2.6, 0.25 + n * 0.075 + 0.6, 3.0), "+ ДИВИДЕНДЫ", 40, "gold")

    def ui(ctx):
        fx.pop3d(ctx, "ДВА СПОСОБА ЗАРАБОТАТЬ", 960, 160, 84, tl, "white")
        fx.pop3d(ctx, "1", 520, 330, 90, a1, "green")
        fx.pop3d(ctx, "2", 1400, 330, 90, a2, "gold")
    f.ui.append(ui)


def s_gauge(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.6, 3.0), 9.5, yaw=-0.2 + 0.1 * f.prog, pitch=0.1)
    sc = f.scene()
    n = 10
    for i in range(n):
        a0 = math.pi * (1 - i / n)
        a1 = math.pi * (1 - (i + 1) / n) + 0.02
        c = np.array(GREEN) * (1 - i / (n - 1)) + np.array(RED) * (i / (n - 1))
        m = wedge(1.6, 2.4, a1, a0, 0.3, tuple(c), gloss=0.6)
        m.place((0, 0.6, 3.2), rx=-math.pi / 2)
        sc.add(m)
    lvl = b.get("level", 0.8)
    k = ease_back(clamp(tl / 1.4)) * lvl + 0.03 * math.sin(tl * 7) * (tl > 1.4)
    ang = math.pi * (1 - k)
    needle = box(0.12, 2.1, 0.12, "white", gloss=0.9, metal=0.4)
    needle.place((0, 0.6, 2.9), rz=-(math.pi / 2 - ang))
    sc.add(needle)
    hub = cylinder(0.25, 0.2, 24, "dark", gloss=0.9)
    hub.place((0, 0.6, 2.85), rx=-math.pi / 2)
    sc.add(hub)
    lbl3d(sc, (-2.0, 0.2, 3.0), "СПОКОЙНО", 30, "green")
    lbl3d(sc, (2.0, 0.2, 3.0), "КАЧЕЛИ", 30, "red")

    def ui(ctx):
        fx.pop3d(ctx, b.get("label", "АКЦИИ"), 640, 170, 100, tl, "white")
        if age(b, 1, tl) > 0:
            fx.pop3d(ctx, "ВЫСОКИЙ ДОХОД = ВЫСОКИЙ РИСК", 640, 960, 52, age(b, 1, tl), "gold", face=F_XB)
    f.ui.append(ui)


def s_bond(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.3, 3.0), 10, yaw=-0.25 + 0.15 * f.prog, pitch=0.15)
    sc = f.scene()
    pedestal(sc, (-2.4, 0, 3.0), 0.9)
    pedestal(sc, (2.4, 0, 3.0), 0.9)
    lbl3d(sc, (-2.4, 0.7, 2.1), "ТЫ", 40, "white")
    lbl3d(sc, (2.4, 0.7, 2.1), "ГОСУДАРСТВО / КОМПАНИЯ", 30, "white")
    # big coin flies to the borrower, certificate comes back, coupons trickle back
    a0, a2 = tl - 0.4, age(b, 2, tl)
    e = ease_io(clamp(a0 / 1.2))
    cx = -2.4 + 4.8 * e
    coin = cylinder(0.6, 0.12, 36, "gold", gloss=0.9, metal=0.8, y0=-0.06)
    coin.place((cx, 0.9 + 1.6 * math.sin(math.pi * e), 3.0), rx=math.pi / 2, rz=tl * 3)
    sc.add(coin)
    if a0 > 1.0:
        k = ease_io(clamp((a0 - 1.0) / 1.0))
        doc = box(1.2, 0.04, 0.85, (0.96, 0.92, 0.82), gloss=0.2)
        doc.place((2.4 - 4.8 * k, 0.3 + 0.04 + 1.2 * math.sin(math.pi * k), 3.0), ry=0.3 * k, rx=-0.15)

        def dd(ctx):
            ctx.rectangle(0, 0, 360, 255)
            ctx.set_source_rgb(0.96, 0.92, 0.82)
            ctx.fill()
            ctx.rectangle(12, 12, 336, 231)
            ctx.set_source_rgba(0.6, 0.45, 0.2, 0.8)
            ctx.set_line_width(4)
            ctx.stroke()
            fx.plain(ctx, "ОБЛИГАЦИЯ", 180, 95, 46, F_BLACK, (0.3, 0.2, 0.1), 1, shadow=0)
            ctx.arc(180, 175, 40, 0, 2 * math.pi)
            ctx.set_source_rgba(0.85, 0.2, 0.2, 0.85)
            ctx.fill()
        doc.decals[4] = (dd, (360, 255))
        sc.add(doc)
    if a2 > 0:
        for i in range(4):
            ph = (a2 * 0.7 - i * 0.25)
            if 0 < ph < 1:
                p = ease_io(ph)
                c = cylinder(0.25, 0.06, 24, "gold", gloss=0.9, metal=0.8, y0=-0.03)
                c.place((2.4 - 4.8 * p, 1.0 + 1.0 * math.sin(math.pi * p), 2.8), rx=math.pi / 2, rz=tl * 5)
                sc.add(c)
        lbl3d(sc, (0, 2.6, 2.8), "КУПОНЫ", 40, "gold")

    def ui(ctx):
        fx.pop3d(ctx, "ОБЛИГАЦИЯ = ДОЛГ", 640, 170, 92, tl, "white")
    f.ui.append(ui)


def s_coupons(f):
    b, tl = f.b, f.tl
    # dolly along a 5-year timeline
    px = -3.5 + 7.0 * ease_io(f.prog)
    f.orbit((px * 0.6, 0.9, 3.0), 8.5, yaw=-0.30, pitch=0.24, drift=0.0)
    sc = f.scene()
    track = box(10.5, 0.06, 0.5, (0.2, 0.17, 0.28), gloss=0.7)
    track.place((0, 0, 3.0))
    sc.add(track)
    a2, a3 = age(b, 2, tl), age(b, 3, tl)
    for yr in range(1, 6):
        x = -5 + yr * 1.8
        lbl3d(sc, (x, 0.0, 2.4), f"{yr}-Й ГОД", 28, "grey", bg=False)
        a = a2 - (yr - 1) * 0.45
        if a > 0:
            hgt = 0.9 * ease_back(clamp(a / 0.5))
            coin_stack(sc, (x, 0.06, 3.0), max(1, int(hgt / 0.075)), 0.38)
            lbl3d(sc, (x, 0.06 + hgt + 0.4, 3.0), "КУПОН", 26, "gold")
    if a3 > 0:
        x = -5 + 5 * 1.8 + 1.0
        e = ease_back(clamp(a3 / 0.7))
        m = bevel_box(1.1, 2.2 * e, 1.1, 0.1, "green", gloss=0.7)
        m.place((x, 0.06, 3.0))
        sc.add(m)
        lbl3d(sc, (x, 2.2 * e + 0.5, 3.0), "ВСЯ СУММА НАЗАД", 30, "green")

    def ui(ctx):
        fx.pop3d(ctx, "ОФЗ", 300, 180, 120, tl, "gold")
        fx.plain(ctx, "облигации федерального займа", 300, 240, 30, F_SB, "white", clamp(tl / 0.5), "center")
        if age(b, 1, tl) > 0:
            fx.pop3d(ctx, "ТЫ → МИНФИН", 300, 340, 56, age(b, 1, tl), "white", face=F_XB)
    f.ui.append(ui)


def s_scale(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.3, 3.0), 10, yaw=-0.25 + 0.15 * f.prog, pitch=0.14)
    sc = f.scene()
    groups = [("ОФЗ", -1.9, 0.9, 0.5, 0), ("КОМПАНИИ", 1.3, 1.8, 2.0, 1)]
    for name, x, inc, risk, k in groups:
        a = age(b, k, tl)
        if a < 0:
            continue
        e = ease_io(clamp(a / 1.0))
        m = bevel_box(0.9, inc * e + 0.02, 0.9, 0.08, "gold", gloss=0.7, metal=0.4)
        m.place((x - 0.55, 0, 3.0))
        sc.add(m)
        r = bevel_box(0.9, risk * e + 0.02, 0.9, 0.08, "red", gloss=0.6)
        r.place((x + 0.55, 0, 3.0))
        sc.add(r)
        lbl3d(sc, (x - 0.55, inc * e + 0.35, 3.0), "ДОХОД", 26, "gold")
        lbl3d(sc, (x + 0.55, risk * e + 0.35, 3.0), "РИСК", 26, "red")
        lbl3d(sc, (x, -0.0, 2.2), name, 38, "white")

    def ui(ctx):
        fx.pop3d(ctx, "ДОХОД vs РИСК", 640, 170, 96, tl, "white")
        if age(b, 2, tl) > 0:
            fx.pop3d(ctx, "ЖИРНАЯ ДОХОДНОСТЬ = ПОДВОХ", 640, 960, 56, age(b, 2, tl), "red", face=F_XB)
    f.ui.append(ui)


def s_fund(f):
    b, tl = f.b, f.tl
    f.put_char()
    stage = b.get("stage", 1)
    f.orbit(content_target(f, 0, 1.5, 3.0), 9.5, yaw=-0.35 + 0.2 * f.prog, pitch=0.18)
    sc = f.scene()
    S = 2.4
    glassbox = box(S, S, S, (0.6, 0.7, 1.0), alpha=0.18, gloss=0.9)
    glassbox.place((0, 0, 3.0))
    glassbox.edge = 0.5
    glassbox.cast = False
    sc.add(glassbox)
    cols = ["gold", "blue", "green", "purple", "teal", "amber", "red", "white"]
    n = 27
    a1 = age(b, 1, tl) if stage == 1 else 9.0
    a2 = age(b, 2, tl) if stage == 1 else 9.0
    bad = 13
    for i in range(n):
        gx, gy, gz = i % 3, (i // 3) % 3, i // 9
        target = np.array([(gx - 1) * 0.7, 0.3 + gy * 0.7, 3.0 + (gz - 1) * 0.7])
        rnd = random.Random(i)
        start = target + np.array([rnd.uniform(-6, 6), rnd.uniform(3, 6), rnd.uniform(-3, 2)])
        k = ease_io(clamp((a2 - i * 0.05) / 0.9)) if stage == 1 else 1.0
        p = start + (target - start) * k
        c = cols[i % len(cols)]
        if stage == 3 and i == bad:
            fall = clamp((tl - at(b, 0) - 0.3) / 1.2)
            p = target + np.array([0, -0.3 * fall, -2.0 * ease_io(fall)])
            p[1] = max(0.0, target[1] + 1.5 * fall - 3 * fall ** 2)
            c = (0.9, 0.15, 0.15)
        if stage == 1 and a2 < 0:
            continue
        m = bevel_box(0.5, 0.5, 0.5, 0.05, c, gloss=0.7, metal=0.2)
        m.place((p[0], p[1] - 0.25, p[2]), ry=(1 - k) * 3 + (stage == 3 and i == bad) * tl * 2)
        m.cast = False
        sc.add(m)
    if stage == 1 and a1 > 0:
        lbl3d(sc, (0, S + 0.45, 3.0), "1 ПАЙ", 44, "gold")
    if stage == 2:
        lbl3d(sc, (0, S + 0.45, 3.0), "ИНДЕКС МОСБИРЖИ", 40, "gold")
    if stage == 3:
        lbl3d(sc, (0, S + 0.45, 3.0), "ПОЧТИ НЕ ЗАМЕТНО", 40, "green")

    def ui(ctx):
        fx.pop3d(ctx, "ФОНД", 640, 170, 120, tl if stage == 1 else 9, "white")
        if stage == 1 and a2 > 0:
            fx.pop3d(ctx, "ВНУТРИ — ДЕСЯТКИ КОМПАНИЙ", 640, 960, 54, a2 + 0.5, "gold", face=F_XB)
        if stage == 2 and age(b, 2, tl) > 0:
            fx.pop3d(ctx, "КРУПНЕЙШИЕ КОМПАНИИ СТРАНЫ", 640, 960, 54, age(b, 2, tl), "gold", face=F_XB)
        if stage == 3 and tl > 0.3:
            fx.pop3d(ctx, "−1 КОМПАНИЯ", 640, 1030, 64, tl - 0.3, "red", face=F_XB)
    f.ui.append(ui)


def s_bars(f):
    b, tl = f.b, f.tl
    f.orbit((0, 2.3, 3.0), 13.0, yaw=-0.3 + 0.2 * f.prog, pitch=0.10)
    sc = f.scene(reflect=0.3)
    ser = b["series"]
    mx = max(v for _, _, v, _ in ser)
    for i, (k, name, v, c) in enumerate(ser):
        a = age(b, k, tl)
        x = -1.6 + i * 3.2
        pedestal(sc, (x, 0, 3.0), 1.2, 0.18)
        if a < 0:
            continue
        hgt = 3.6 * v / mx * ease_io(clamp(a / 1.5))
        m = bevel_box(1.4, max(0.02, hgt), 1.4, 0.12, c, gloss=0.75, metal=0.4)
        m.place((x, 0.18, 3.0))
        sc.add(m)
        val = v * ease_io(clamp(a / 1.5))
        lbl3d(sc, (x, 0.18 + hgt + 0.5, 3.0), f"{val:.1f} МЛН ₽".replace(".", ","), 44, c)
        lbl3d(sc, (x, 0.0, 1.6), name, 36, "white")
    d = b.get("diff")

    def ui(ctx):
        fx.pop3d(ctx, b.get("title", ""), 960, 110, 70, tl, "white")
        if d and age(b, d[0], tl) > 0:
            fx.pop3d(ctx, d[1], 960, 1020, 84, age(b, d[0], tl), "red")
    f.ui.append(ui)


def s_drunk(f, crash=False, stage=1):
    b, tl = f.b, f.tl
    f.put_char()
    n = 70
    if crash:
        ys = _walk(11, n, 0.06, 0.06)
        ci = 44
        for i in range(ci, n):
            ys[i] -= 1.9
        if stage == 2:
            for i in range(ci + 1, n):
                ys[i] += (i - ci) * 0.045
    else:
        ys = _walk(8, n, 0.045, 0.16)
    xs = np.linspace(-6, 6, n)
    pts = [(x, 0.9 + y * 0.5, 3.0) for x, y in zip(xs, ys)]
    if crash and stage == 1:
        up = 0.55 + 0.1 * ease_io(clamp((tl - 0.2) / 1.0)) if tl < 1.4 else 0.65
        up = min(up, 0.64)
    elif crash:
        up = 0.64 + 0.36 * ease_io(clamp((tl - 0.3) / (f.dur - 1.0)))
    else:
        up = ease_io(clamp((tl - 0.2) / (f.dur - 0.8)))
    k = int((n - 1) * up)
    head = pts[k]
    if crash and stage == 2:
        f.orbit(content_target(f, 0.0, 1.3, 3.0), 13.5, yaw=-0.2 + 0.1 * f.prog, pitch=0.12)
    else:
        f.orbit(content_target(f, head[0] - 1.5, max(1.2, head[1] - 0.3), 3.0), 10.0, yaw=-0.3, pitch=0.12, drift=0.0)
    sc = f.scene(reflect=0.3)
    red = crash and stage == 1 and k >= 44
    if red:
        f.mood = (0.9, 0.0)
    fn, top = area_line(sc.cam, pts, "red" if red else "gold", upto=up, fill=0.25, lw=7)
    sc.sprite((0, 1, 3.0), fn)

    def ui(ctx):
        if not crash:
            if age(b, 2, tl) > 0:
                fx.pop3d(ctx, "ТУДА-СЮДА", 640, 170, 96, age(b, 2, tl), "white")
            if age(b, 3, tl) > 0:
                fx.pop3d(ctx, "НО В ЦЕЛОМ ВПЕРЁД", 640, 960, 64, age(b, 3, tl), "green", face=F_XB)
        elif stage == 1:
            fx.pop3d(ctx, "2022", 640, 180, 110, tl, "white")
            if k >= 44:
                fx.pop3d(ctx, "−33% ЗА ДЕНЬ", 640, 960, 100, tl - 1.0, "red")
        else:
            hx, hy = top[-1, :2]
            fx.label(ctx, "ДЕРЖАЛ", hx, hy - 50, 38, "green", clamp((tl - 1.0) / 0.4))
            cx, cy, _ = sc.cam.pt(pts[45])
            fx.label(ctx, "ПРОДАЛ НА ДНЕ ✕", cx, cy + 80, 34, "red", clamp(tl / 0.4))
            if age(b, 2, tl) > 0:
                fx.pop3d(ctx, "ВОССТАНОВЛЕНИЕ — НЕ СРАЗУ", 640, 170, 60, age(b, 2, tl), "white", face=F_XB)
    f.ui.append(ui)


def s_crash(f):
    s_drunk(f, crash=True, stage=f.b.get("stage", 1))


def s_rule(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.4, 3.0), 9, yaw=-0.3 + 0.25 * f.prog, pitch=0.12)
    sc = f.scene()
    pedestal(sc, (0, 0, 3.0), 1.4, 0.35)
    # slowly turning hourglass made of two cones
    a = tl * 0.6
    for flip in (0, 1):
        m = cone(0.8, 0.08, 1.0, 28, (0.75, 0.85, 1.0), alpha=0.5, gloss=0.9)
        m.place((0, 0.35 + (2.0 if flip else 0.0), 3.0), rx=math.pi * flip, ry=a)
        m.cast = False
        sc.add(m)
    sand = cone(0.6, 0.05, 0.6 * (1 - 0.6 * f.prog), 24, "gold", gloss=0.4)
    sand.place((0, 0.35, 3.0))
    sc.add(sand)

    def ui(ctx):
        x, y, _ = sc.cam.pt((0, 3.0, 3.0))
        fx.pop3d(ctx, b.get("big", "5+ ЛЕТ"), x, 230, 170, age(b, 1, tl), "gold")
        fx.pop3d(ctx, b.get("sub", ""), x, 320, 48, age(b, 1, tl) - 0.3, "white", face=F_XB)
    f.ui.append(ui)


def s_snowball(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.2, 3.0), 10, yaw=-0.5 + 0.25 * f.prog, pitch=0.16)
    sc = f.scene()
    for i in range(9):
        a = tl - 0.3 - i * 0.35
        if a < 0:
            continue
        hgt = 0.25 * (1.38 ** i) * ease_back(clamp(a / 0.5))
        coin_stack(sc, (-3.6 + i * 0.9, 0, 3.0 + 0.0 * i), max(1, int(hgt / 0.075)), 0.36, sides=28)
    a2 = age(b, 2, tl)

    def ui(ctx):
        fx.pop3d(ctx, "СЛОЖНЫЙ ПРОЦЕНТ", 640, 170, 92, age(b, 1, tl), "gold")
        if a2 > 0:
            fx.pop3d(ctx, "ДОХОД ПРИНОСИТ ДОХОД", 640, 960, 60, a2, "white", face=F_XB)
    f.ui.append(ui)


def s_towers(f):
    b, tl = f.b, f.tl
    ser = b["series"]
    last = age(b, ser[-1][0], tl)
    tilt = 0.10 + 0.22 * ease_io(clamp(last / 2.0)) if last > 0 else 0.10
    lk = ease_io(clamp(last / 2.0)) if last > 0 else 0.0
    f.orbit((0.6, 1.8 + 1.4 * lk, 3.0), 11 + 5.0 * lk,
            yaw=-0.35 + 0.2 * f.prog, pitch=tilt)
    sc = f.scene(reflect=0.3)
    mx = ser[-1][2]
    for i, (k, name, v) in enumerate(ser):
        a = age(b, k, tl)
        x = -2.6 + i * 2.6
        pedestal(sc, (x, 0, 3.0), 1.0, 0.18)
        lbl3d(sc, (x, 0.0, 1.9), name, 36, "white")
        if a < 0:
            continue
        hgt = 5.0 * v / mx * ease_io(clamp(a / 1.6))
        coin_stack(sc, (x, 0.18, 3.0), max(1, int(hgt / 0.12)), 0.8, hh=0.12)
        val = v * ease_io(clamp(a / 1.6))
        lbl3d(sc, (x, 0.18 + hgt + 0.55, 3.0), (f"{val:.1f}" if v < 10 else f"{val:.0f}").replace(".", ",") + " МЛН ₽", 44, "gold")

    def ui(ctx):
        fx.pop3d(ctx, b.get("title", ""), 960, 130, 64, tl, "white", face=F_XB)
        fx.plain(ctx, "расчёт-пример, доходность не гарантирована", 960, 1045, 26, F_MED, "grey", 0.8)
    f.ui.append(ui)


def s_split(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, -0.6, 2.9, 3.0), 15, yaw=-0.25 + 0.15 * f.prog, pitch=0.12)
    sc = f.scene()
    own, tot = b["own"], b["total"]
    H6 = 6.0
    ho = H6 * own / tot
    e = ease_io(clamp(tl / 1.2))
    m = bevel_box(1.6, ho * e + 0.01, 1.6, 0.1, "blue", gloss=0.6)
    m.place((0, 0, 3.0))
    sc.add(m)
    a1 = age(b, 1, tl)
    if a1 > 0:
        g = ease_io(clamp(a1 / 1.5))
        m2 = bevel_box(1.6, (H6 - ho) * g + 0.01, 1.6, 0.1, "gold", gloss=0.85, metal=0.6)
        m2.place((0, ho, 3.0))
        sc.add(m2)
        lbl3d(sc, (-2.6, ho + (H6 - ho) * g * 0.5, 3.0), "ПРОЦЕНТЫ ≈ 19 МЛН", 40, "gold")
    lbl3d(sc, (-2.6, ho * 0.5, 3.0), "СВОИ 3,6 МЛН", 40, "blue")

    def ui(ctx):
        fx.pop3d(ctx, "ИЗ 22,6 МЛН", 640, 150, 90, tl, "white")
    f.ui.append(ui)


def s_eggs(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.0, 3.0), 8.5, yaw=-0.25 + 0.1 * f.prog, pitch=0.2)
    sc = f.scene()
    a2 = age(b, 2, tl)
    tip = ease_io(clamp(a2 / 0.6)) if a2 > 0 else 0.0
    basket = cone(0.9, 1.3, 0.9, 32, (0.80, 0.55, 0.28), gloss=0.2)
    basket.place((0, 0.0 + 0.5 * tip, 3.0), rz=0.9 * tip)
    sc.add(basket)
    for i in range(6):
        a = i / 6 * 2 * math.pi
        p = np.array([0.55 * math.cos(a), 1.0, 3.0 + 0.45 * math.sin(a)])
        if a2 > 0.2:
            ft = a2 - 0.2 - i * 0.05
            if ft > 0:
                p = p + np.array([-1.5 * ft - 0.4 * i * ft, 0, -0.3 * i * ft])
                p[1] = max(0.15, 1.0 + 1.2 * ft - 4.9 * ft * ft)
            if p[1] <= 0.16 and ft > 0.2:
                def splat(ctx, x, y, k, i=i):
                    ctx.save()
                    ctx.translate(x, y)
                    ctx.scale(1, 0.35)
                    ctx.arc(0, 0, 0.45 * k, 0, 2 * math.pi)
                    ctx.set_source_rgba(0.98, 0.96, 0.9, 0.95)
                    ctx.fill()
                    ctx.arc(0.05 * k, 0, 0.2 * k, 0, 2 * math.pi)
                    ctx.set_source_rgba(1.0, 0.7, 0.1, 1)
                    ctx.fill()
                    ctx.restore()
                sc.sprite((p[0], 0.0, p[2]), splat)
                continue
        sc.sprite(tuple(p), sphere_sprite("cream", 0.24, gloss=0.7, sy=1.25), shadow_r=0.2)

    def ui(ctx):
        fx.pop3d(ctx, "ВСЕ ЯЙЦА В ОДНОЙ КОРЗИНЕ", 640, 170, 64, age(b, 1, tl), "white", face=F_XB)
        if a2 > 0.5:
            fx.pop3d(ctx, "НИ ЯИЦ, НИ ЯИЧНИЦЫ", 640, 960, 64, a2 - 0.5, "red", face=F_XB)
    f.ui.append(ui)


def pie(sc, pos, parts, tl_ages, r=2.0, h=0.4, spin=0.0, explode=0.12, label=True):
    """3D pie: parts = [(name, frac, color)], tl_ages = age per part (appearance)."""
    a0 = spin
    x0, y0, z0 = pos
    for (name, frac, c), a in zip(parts, tl_ages):
        a1 = a0 + 2 * math.pi * frac
        if a > 0:
            e = ease_back(clamp(a / 0.5))
            mid = (a0 + a1) / 2
            off = explode * e
            m = wedge(0, r, a0, a1, h * e, c, gloss=0.6, metal=0.15)
            m.place((x0 + off * math.cos(mid), y0, z0 + off * math.sin(mid)))
            sc.add(m)
            if label:
                lp = (x0 + (r * 0.95 + 0.6) * math.cos(mid), y0 + h + 0.35, z0 + (r * 0.95 + 0.6) * math.sin(mid))
                lbl3d(sc, lp, f"{name} {int(round(frac * 100))}%", 30, c if isinstance(c, str) else "white", alpha=clamp(a / 0.4))
        a0 = a1


def s_pie(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 0.6, 3.0), 9, yaw=-0.2 + 0.15 * f.prog, pitch=0.42)
    sc = f.scene()
    parts = [(n, fr, c) for _, n, fr, c in b["parts"]]
    ages = [age(b, k, tl) - 0.15 * i for i, (k, *_r) in enumerate(b["parts"])]
    pie(sc, (0, 0, 3.0), parts, ages, spin=tl * 0.15)

    def ui(ctx):
        fx.pop3d(ctx, "ДИВЕРСИФИКАЦИЯ", 640, 150, 92, tl, "white")
    f.ui.append(ui)


def s_boat(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 0.9, 3.0), 8.5, yaw=-0.3 + 0.12 * f.prog, pitch=0.16)
    f.studio = True
    sc = f.scene(reflect=0.0, shadow=0.0)
    roll = 0.22 * math.sin(tl * 1.6)
    heave = 0.12 * math.sin(tl * 1.6 + 0.8)
    hull = prism([(-1.6, -0.6), (1.6, -0.6), (2.1, 0.0), (1.6, 0.6), (-1.6, 0.6), (-1.9, 0.0)], 0.7, (0.75, 0.2, 0.2), gloss=0.5)
    hull.place((0, 0.35 + heave, 3.0), rx=roll)
    sc.add(hull)
    cab = box(1.2, 0.7, 0.8, "white", gloss=0.4)
    cab.place((-0.2, 1.05 + heave, 3.0), rx=roll)

    def cd(ctx):
        ctx.rectangle(0, 0, 400, 230)
        ctx.set_source_rgb(0.95, 0.95, 0.97)
        ctx.fill()
        fx.plain(ctx, "ПОРТФЕЛЬ", 200, 140, 64, F_BLACK, (0.2, 0.2, 0.3), 1, shadow=0)
    cab.decals[0] = (cd, (400, 230))
    sc.add(cab)
    cam = sc.cam

    def waves(ctx, X, Y, K, layer=0):
        for L in range(3):
            z = 2.2 + L * 0.9 if layer == 0 else 1.6
            pts = []
            for i in range(60):
                x = -7 + i * 14 / 59
                y = 0.45 + 0.18 * math.sin(x * 1.3 + tl * 2.0 + L) + 0.08 * math.sin(x * 3.1 - tl * 1.3)
                pts.append((x, y, z))
            p2 = cam.proj(np.array(pts))
            b2 = cam.proj(np.array([(x, -0.6, z) for x, _, _ in pts]))
            ctx.move_to(*p2[0, :2])
            for q in p2[1:]:
                ctx.line_to(*q[:2])
            for q in b2[::-1]:
                ctx.line_to(*q[:2])
            ctx.close_path()
            g = cairo.LinearGradient(0, p2[:, 1].min(), 0, b2[:, 1].max())
            g.add_color_stop_rgba(0, 0.25, 0.55, 0.95, 0.75 if layer else 0.55)
            g.add_color_stop_rgba(1, 0.05, 0.08, 0.25, 0.95)
            ctx.set_source(g)
            ctx.fill()
            ctx.move_to(*p2[0, :2])
            for q in p2[1:]:
                ctx.line_to(*q[:2])
            ctx.set_source_rgba(0.7, 0.9, 1, 0.5)
            ctx.set_line_width(2)
            ctx.stroke()
            if layer:
                break
    sc.sprite((0, 0.4, 4.6), waves)
    sc.sprite((0, 0.4, 1.4), lambda c, X, Y, K: waves(c, X, Y, K, 1))

    def ui(ctx):
        fx.pop3d(ctx, "АКЦИИ ↑  ОБЛИГАЦИИ ДЕРЖАТ", 640, 170, 54, tl, "white", face=F_XB)
        if age(b, 1, tl) > 0:
            fx.pop3d(ctx, "АКЦИИ ↓  ОБЛИГАЦИИ СМЯГЧАЮТ", 640, 260, 54, age(b, 1, tl), "gold", face=F_XB)
        if age(b, 2, tl) > 0:
            fx.pop3d(ctx, "КАЧАЕТ, НО НЕ ТОПИТ", 640, 980, 66, age(b, 2, tl), "green", face=F_XB)
    f.ui.append(ui)


def s_twopies(f):
    b, tl = f.b, f.tl
    f.orbit((0, 0.6, 3.0), 10.5, yaw=-0.1 + 0.2 * f.prog, pitch=0.45)
    sc = f.scene()
    a1, a2 = age(b, 1, tl), age(b, 2, tl)
    pie(sc, (-2.7, 0, 3.0), [("АКЦИИ", 0.8, "purple"), ("ОБЛ.", 0.2, "blue")], [a1, a1 - 0.15], r=1.6, spin=tl * 0.2)
    pie(sc, (2.7, 0, 3.0), [("АКЦИИ", 0.3, "purple"), ("ОБЛ.", 0.7, "blue")], [a2, a2 - 0.15], r=1.6, spin=-tl * 0.2)

    def ui(ctx):
        fx.pop3d(ctx, "СКОЛЬКО КУДА?", 960, 150, 92, tl, "white")
        fx.pop3d(ctx, "КРЕПКИЕ НЕРВЫ", 560, 960, 56, a1, "gold", face=F_XB)
        fx.pop3d(ctx, "БОИШЬСЯ ПРОСАДОК", 1360, 960, 56, a2, "blue", face=F_XB)
    f.ui.append(ui)


STEP_NAMES = ["ПОДУШКА", "БРОКЕРСКИЙ СЧЁТ", "СТРАТЕГИЯ", "РЕГУЛЯРНОСТЬ"]


def s_steps(f):
    b, tl = f.b, f.tl
    f.put_char()
    st = b.get("step", 1)
    sx = -3.0 + (st - 1) * 1.6
    sy = (st - 1) * 0.55
    f.orbit(content_target(f, -0.6 + 0.25 * (st - 2.5), 1.3, 3.0), 12.5, yaw=-0.40 + 0.1 * f.prog, pitch=0.18)
    sc = f.scene()
    for i in range(4):
        hgt = 0.55 * (i + 1)
        on = i + 1 == st
        done = i + 1 < st
        c = (0.95, 0.70, 0.22) if on else ((0.25, 0.65, 0.42) if done else (0.22, 0.19, 0.30))
        m = bevel_box(1.6, hgt, 1.8, 0.08, c, gloss=0.6, emissive=0.15 if on else 0.0)
        m.place((-3.0 + i * 1.6, 0, 3.0))
        sc.add(m)
        lbl3d(sc, (-3.0 + i * 1.6, hgt + 0.35, 2.3), f"{i + 1}. {STEP_NAMES[i]}", 26 if not on else 32,
              "gold" if on else ("green" if done else "grey"))
    # coin hopping onto the current step
    hop = ease_io(clamp(tl / 0.7))
    cx = sx - 1.6 * (1 - hop)
    cy = 0.55 * st + 0.62 + 0.9 * math.sin(math.pi * hop) - (0.55 * (1 - hop) if st > 1 else 0.0)
    coin = cylinder(0.45, 0.1, 32, "gold", gloss=0.9, metal=0.8, y0=-0.05)
    coin.place((cx, cy, 3.0), rx=math.pi / 2, rz=tl * 2.5)
    sc.add(coin)
    extra = {1: (1, "3–6 МЕСЯЦЕВ РАСХОДОВ"), 2: (1, "ПРИЛОЖЕНИЕ · 10 МИНУТ"), 3: (1, "2 ФОНДА: АКЦИИ + ОБЛИГАЦИИ"),
             4: (2, "КАЖДЫЙ МЕСЯЦ")}[st]

    def ui(ctx):
        fx.pop3d(ctx, f"ШАГ {st}", 640, 160, 110, tl, "gold")
        fx.pop3d(ctx, STEP_NAMES[st - 1], 640, 250, 60, tl - 0.2, "white", face=F_XB)
        if age(b, extra[0], tl) > 0:
            fx.pop3d(ctx, extra[1], 640, 980, 54, age(b, extra[0], tl), "white", face=F_XB)
        if st == 1 and age(b, 2, tl) > 0:
            fx.pop3d(ctx, "БЕЗ НЕЁ — НЕ ИНВЕСТИРУЙ", 640, 890, 50, age(b, 2, tl), "red", face=F_XB)
        if st == 4 and age(b, 3, tl) > 0:
            fx.pop3d(ctx, "2 000 – 20 000 ₽", 640, 890, 60, age(b, 3, tl), "gold")
    f.ui.append(ui)


def s_iis(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.3, 3.0), 9, yaw=-0.35 + 0.2 * f.prog, pitch=0.15)
    sc = f.scene()
    safe = box(2.4, 2.4, 2.0, (0.30, 0.30, 0.36), gloss=0.8, metal=0.7)
    safe.place((0, 0, 3.0))

    def door(ctx):
        ctx.rectangle(0, 0, 400, 400)
        ctx.set_source_rgb(0.32, 0.32, 0.38)
        ctx.fill()
        ctx.arc(200, 200, 110, 0, 2 * math.pi)
        ctx.set_source_rgb(0.2, 0.2, 0.25)
        ctx.fill()
        ctx.save()
        ctx.translate(200, 200)
        ctx.rotate(tl * 0.8)
        for i in range(6):
            ctx.rotate(math.pi / 3)
            ctx.rectangle(-8, -100, 16, 70)
        ctx.set_source_rgb(0.7, 0.7, 0.75)
        ctx.fill()
        ctx.restore()
        fx.plain(ctx, "ИИС", 200, 380, 52, F_BLACK, "gold", 1, shadow=0)
    safe.decals[0] = (door, (400, 400))
    sc.add(safe)
    a1 = age(b, 1, tl)
    if a1 > 0:
        for i in range(6):
            ph = (a1 * 0.8 - i * 0.16) % 1.6
            if ph < 1:
                p = ease_io(ph)
                c = cylinder(0.32, 0.07, 24, "gold", gloss=0.9, metal=0.8, y0=-0.035)
                c.place((0.4 + 2.2 * p, 1.6 + 0.7 * math.sin(math.pi * p) - 1.2 * p, 2.2 - p), rx=math.pi / 2, rz=tl * 6 + i)
                sc.add(c)

    def ui(ctx):
        fx.pop3d(ctx, "ИИС", 640, 160, 120, tl, "gold")
        if a1 > 0:
            fx.pop3d(ctx, "+52 000 ₽ / ГОД", 640, 270, 76, a1, "green")
        if age(b, 2, tl) > 0:
            fx.pop3d(ctx, "ДЕРЖАТЬ ДОЛГО · УТОЧНЯЙ УСЛОВИЯ", 640, 980, 46, age(b, 2, tl), "white", face=F_XB)
    f.ui.append(ui)


def s_dca(f):
    b, tl = f.b, f.tl
    f.orbit((0.0, 1.6, 3.0), 10.5, yaw=-0.3 + 0.2 * f.prog, pitch=0.14)
    sc = f.scene(reflect=0.3)
    cam = sc.cam
    n = 48
    ys = [1.6 + 0.9 * math.sin(i * 0.22) + 0.3 * math.sin(i * 0.61) + 0.012 * i for i in range(n)]
    xs = np.linspace(-5, 5, n)
    pts = [(x, y, 3.0) for x, y in zip(xs, ys)]
    up = ease_io(clamp((tl - 0.3) / (f.dur - 1.5)))
    fn, top = area_line(cam, pts, "blue", upto=up, fill=0.3, lw=6)
    sc.sprite((0, 1.5, 3.0), fn)
    k = int((n - 1) * up)
    buys = [i for i in range(2, n, 5) if i <= k]
    for i in buys:
        coin = cylinder(0.22, 0.06, 20, "gold", gloss=0.9, metal=0.8, y0=-0.03)
        coin.place((xs[i], ys[i], 2.9), rx=math.pi / 2, rz=tl * 2 + i)
        coin.cast = False
        sc.add(coin)
    if buys:
        avg = float(np.mean([ys[i] for i in buys]))
        a3 = age(b, 3, tl)
        if a3 > 0:
            fn2, _ = area_line(cam, [(-5, avg, 3.0), (5, avg, 3.0)], "gold", upto=ease_io(clamp(a3 / 1.0)), fill=0.0, lw=4)
            sc.sprite((0, avg, 2.95), fn2)
            lbl3d(sc, (-4.0, avg + 0.45, 3.0), "СРЕДНЯЯ ЦЕНА", 30, "gold")

    def ui(ctx):
        fx.pop3d(ctx, "НЕ УГАДЫВАЙ МОМЕНТ", 960, 140, 80, tl, "white")
        if age(b, 2, tl) > 0:
            fx.pop3d(ctx, "ПОКУПАЙ КАЖДЫЙ МЕСЯЦ", 960, 980, 60, age(b, 2, tl), "gold", face=F_XB)
    f.ui.append(ui)


def s_rebalance(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 0.6, 3.0), 9, yaw=-0.2 + 0.15 * f.prog, pitch=0.42)
    sc = f.scene()
    plan = [0.40, 0.30, 0.20, 0.10]
    drift = [0.55, 0.22, 0.16, 0.07]
    a2 = age(b, 2, tl)
    k = ease_io(clamp(a2 / 1.0)) if a2 > 0 else 0.0
    if tl < at(b, 1):
        fr = plan
    else:
        e = ease_io(clamp(age(b, 1, tl) / 1.0))
        fr = [p + (d - p) * e * (1 - k) for p, d in zip(plan, drift)]
    names = ["АКЦИИ", "ОБЛИГАЦИИ", "ФОНДЫ", "ЗОЛОТО"]
    colors = ["purple", "blue", "green", "amber"]
    pie(sc, (0.6, 0, 3.0), list(zip(names, fr, colors)), [9] * 4, spin=tl * 0.1)

    def ui(ctx):
        fx.pop3d(ctx, "РЕБАЛАНСИРОВКА", 640, 150, 88, tl, "white")
        fx.pop3d(ctx, "РАЗ В ГОД", 640, 240, 56, tl - 0.3, "gold", face=F_XB)
        if a2 > 0:
            fx.pop3d(ctx, "НАЗАД К ПЛАНУ", 640, 980, 66, a2, "green", face=F_XB)
    f.ui.append(ui)


def monitor(sc, pos, w, h, fn, ry=0.0):
    m = box(w, h, 0.12, (0.08, 0.08, 0.1), y0=False, gloss=0.8)
    m.place(pos, ry=ry)
    m.decals[0] = (fn, (480, 480 * h / w))
    m.cast = False
    sc.add(m)
    return m


def candles(ctx, w, h, t, seed, crazy=1.0):
    ctx.rectangle(0, 0, w, h)
    ctx.set_source_rgb(0.03, 0.04, 0.06)
    ctx.fill()
    rnd = random.Random(seed + int(t * 6 * crazy))
    v = h / 2
    for i in range(18):
        o = v
        v = min(h - 20, max(20, v + rnd.gauss(0, 30 * crazy)))
        hi, lo = min(o, v) - rnd.random() * 15, max(o, v) + rnd.random() * 15
        x = 16 + i * (w - 32) / 18
        c = (0.25, 0.9, 0.5) if v < o else (0.95, 0.25, 0.3)
        ctx.rectangle(x + 6, hi, 2, lo - hi)
        ctx.rectangle(x, min(o, v), 14, max(3, abs(v - o)))
        ctx.set_source_rgb(*c)
        ctx.fill()


def s_trader(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.6, 3.0), 10.5, yaw=-0.2 + 0.1 * f.prog, pitch=0.08)
    sc = f.scene()
    for i, (x, ry) in enumerate(((-2.2, 0.35), (0, 0), (2.2, -0.35))):
        monitor(sc, (x, 1.8 + 0.05 * math.sin(tl + i), 3.2 + abs(x) * 0.25), 2.2, 1.4,
                lambda c, i=i: candles(c, 480, 305, tl, i * 7, 2.0), ry=ry)
    desk = box(7.5, 0.12, 1.6, (0.15, 0.12, 0.18), gloss=0.7)
    desk.place((0, 0.8, 2.6))
    sc.add(desk)
    a1, a2 = age(b, 1, tl), age(b, 2, tl)

    def ui(ctx):
        fx.pop3d(ctx, "ОШИБКА №1", 640, 150, 76, tl, "red", face=F_XB)
        fx.pop3d(ctx, "ТРЕЙДИНГ", 640, 260, 110, tl - 0.2, "white")
        if a1 > 0:
            fx.pop3d(ctx, "КУПИЛ", 420, 960, 64, a1, "green", face=F_XB)
            fx.pop3d(ctx, "ПРОДАЛ", 860, 960, 64, a1 + 0.4 - (at(b, 2) - at(b, 1)) * 0.5, "red", face=F_XB)
    f.ui.append(ui)


def pawn(sc, pos, color, fallen=0.0):
    x, y, z = pos
    body = cone(0.35, 0.18, 0.9, 20, color, gloss=0.6)
    body.place((x, y, z), rz=fallen * 1.4)
    sc.add(body)
    hx = x - math.sin(fallen * 1.4) * 1.05
    hy = y + math.cos(fallen * 1.4) * 1.05
    sc.sprite((hx, hy - 0.22, z), sphere_sprite(color, 0.22, gloss=0.6), shadow_r=0.18)


def s_losers(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.mood = (0.7 * clamp(age(b, 1, tl) / 0.5), 0.0)
    f.orbit(content_target(f, 0, 0.9, 3.0), 9.5, yaw=-0.3 + 0.15 * f.prog, pitch=0.22)
    sc = f.scene()
    a1 = age(b, 1, tl)
    for i in range(10):
        x = -3.4 + (i % 5) * 1.7
        z = 2.4 + (i // 5) * 1.4
        lose = i not in (3, 6)
        k = clamp((a1 - i * 0.12) / 0.5) if (a1 > 0 and lose) else 0.0
        c = (0.9, 0.2, 0.22) if k > 0 else ((0.3, 0.85, 0.5) if (a1 > 0 and not lose) else (0.75, 0.75, 0.8))
        pawn(sc, (x, 0, z), c, ease_io(k))

    def ui(ctx):
        fx.pop3d(ctx, "ЧАСТНЫЕ ТРЕЙДЕРЫ", 640, 160, 80, tl, "white")
        if a1 > 0:
            fx.pop3d(ctx, "БОЛЬШИНСТВО — В МИНУСЕ", 640, 980, 70, a1, "red")
    f.ui.append(ui)


def s_hype(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.8, 3.0), 9, yaw=-0.3 + 0.2 * f.prog, pitch=0.08)
    sc = f.scene()
    a1, a2 = age(b, 1, tl), age(b, 2, tl)
    msgs = ["БЕРИ, УЛЕТИТ!!!", "ДО ЛУНЫ!!!", "Я ВСЁ ЗАКИНУЛ", "ПОСЛЕДНИЙ ШАНС!!"]

    def screen(ctx):
        ctx.rectangle(0, 0, 480, 960)
        ctx.set_source_rgb(0.06, 0.06, 0.09)
        ctx.fill()
        ctx.rectangle(0, 0, 480, 90)
        ctx.set_source_rgb(0.14, 0.12, 0.2)
        ctx.fill()
        fx.plain(ctx, "ЧАТ ИНВЕСТОРОВ", 240, 58, 30, F_XB, "white", 1, shadow=0)
        n = int(clamp(a1 / 2.0) * len(msgs) + 0.999) if a1 > 0 else 0
        for i in range(n):
            y = 140 + i * 150
            gfx_rrect(ctx, 30 + (i % 2) * 60, y, 360, 110, 28)
            ctx.set_source_rgb(0.25, 0.45, 0.95) if i % 2 else ctx.set_source_rgb(0.22, 0.2, 0.3)
            ctx.fill()
            fx.plain(ctx, msgs[i], 210 + (i % 2) * 60, y + 70, 30, F_XB, "white", 1, shadow=0)
    phone = box(1.5, 3.0, 0.15, (0.1, 0.1, 0.12), y0=False, gloss=0.9)
    phone.place((-0.9, 1.8 + 0.05 * math.sin(tl * 1.4), 3.0), ry=0.25, rz=0.05)
    phone.decals[0] = (screen, (480, 960))
    phone.edge = 0.3
    sc.add(phone)
    n = 30
    ys = [0.6 + 0.004 * i * i * (1 if i < 22 else 0) for i in range(n)]
    for i in range(22, n):
        ys[i] = ys[21] - (i - 21) * 0.18
    pts = [(0.9 + i * 0.11, y, 3.2) for i, y in enumerate(ys)]
    up = ease_io(clamp(a2 / 2.0)) * 0.7 + 0.3 if a2 > 0 else 0.6 * ease_io(clamp(tl / 2))
    fn, top = area_line(sc.cam, pts, "gold" if up < 0.73 else "red", upto=up, fill=0.3)
    sc.sprite((2, 1, 3.2), fn)

    def ui(ctx):
        fx.pop3d(ctx, "ОШИБКА №2", 640, 150, 76, tl, "red", face=F_XB)
        fx.pop3d(ctx, "ХАЙП", 640, 270, 120, tl - 0.2, "white")
        if a2 > 0:
            px, py, _ = sc.cam.pt(pts[21])
            fx.label(ctx, "ТЫ КУПИЛ ТУТ", px, py - 50, 34, "red", clamp(a2 / 0.4))
    f.ui.append(ui)


def s_roulette(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 0.3, 3.0), 10.5, yaw=-0.2 + 0.1 * f.prog, pitch=0.5)
    sc = f.scene()
    n = 18
    spin = tl * 2.2
    for i in range(n):
        a0 = spin + i * 2 * math.pi / n
        a1 = a0 + 2 * math.pi / n
        c = (0.85, 0.12, 0.15) if i % 2 else (0.08, 0.08, 0.1)
        if i == 0:
            c = (0.1, 0.6, 0.3)
        m = wedge(0.9, 2.2, a0, a1, 0.25, c, gloss=0.8)
        m.place((0, 0, 3.0))
        sc.add(m)
    hub = cone(0.9, 0.3, 0.55, 28, "gold", gloss=0.9, metal=0.8)
    hub.place((0, 0.0, 3.0))
    sc.add(hub)
    ba = -tl * 3.5
    sc.sprite((1.95 * math.cos(ba), 0.32, 3.0 + 1.95 * math.sin(ba)), sphere_sprite("white", 0.12, gloss=0.9), shadow_r=0.1)

    def ui(ctx):
        fx.pop3d(ctx, "ОШИБКА №3", 640, 150, 76, tl, "red", face=F_XB)
        fx.pop3d(ctx, "ИНВЕСТИЦИИ В КРЕДИТ", 640, 260, 76, tl - 0.2, "white")
        if age(b, 1, tl) > 0:
            fx.pop3d(ctx, "СТАВКА — ГАРАНТИРОВАНА", 640, 900, 52, age(b, 1, tl), "red", face=F_XB)
        if age(b, 2, tl) > 0:
            fx.pop3d(ctx, "ДОХОД — НЕТ", 640, 990, 60, age(b, 2, tl), "gold", face=F_XB)
    f.ui.append(ui)


def s_tower(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.8, 3.0), 10, yaw=-0.3 + 0.15 * f.prog, pitch=0.12)
    sc = f.scene()
    a2 = age(b, 2, tl)
    for i in range(8):
        y = i * 0.5
        if a2 > 0:
            ft = clamp(a2 - (7 - i) * 0.05)
            rnd = random.Random(i)
            dx = (rnd.random() - 0.3) * 3 * ft
            y = max(0.0, y - 4.9 * ft * ft * (1 + i * 0.1))
            rz = (rnd.random() - 0.5) * 2.5 * ft
        else:
            dx, rz = 0.0, 0.0
        m = bevel_box(1.3, 0.48, 1.3, 0.05, "gold" if i % 2 else (0.85, 0.65, 0.2), gloss=0.7, metal=0.4)
        m.place((dx, y, 3.0), rz=rz, ry=0.1 * i)
        sc.add(m)
    if a2 <= 0:
        lbl3d(sc, (0, 4.5, 3.0), "ОДНА КОМПАНИЯ", 36, "gold")

    def ui(ctx):
        fx.pop3d(ctx, "ОШИБКА №4", 640, 150, 76, tl, "red", face=F_XB)
        fx.pop3d(ctx, "ВСЁ В ОДНУ БУМАГУ", 640, 260, 84, tl - 0.2, "white")
        if a2 > 0:
            fx.pop3d(ctx, "ВЕЧНЫХ КОМПАНИЙ НЕТ", 640, 980, 64, a2, "red", face=F_XB)
    f.ui.append(ui)


def s_pyramid(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.mood = (0.85 * clamp(tl / 0.4), 0.0)
    f.orbit(content_target(f, 0, 1.4, 3.0), 10, yaw=-0.35 + 0.2 * f.prog, pitch=0.16)
    sc = f.scene()
    a2 = age(b, 2, tl)
    lv = 5
    for L in range(lv):
        nrow = lv - L
        for i in range(nrow):
            x = (i - (nrow - 1) / 2) * 0.82
            y = L * 0.6
            if a2 > 0:
                ft = clamp(a2 - (L * 0.12))
                rnd = random.Random(L * 10 + i)
                x += (rnd.random() - 0.5) * 2.5 * ft
                y = max(0.0, y - 4.9 * ft * ft)
                rz = (rnd.random() - 0.5) * 2 * ft
            else:
                rz = 0.0
            m = bevel_box(0.78, 0.56, 0.78, 0.05, "gold" if L == lv - 1 else (0.9, 0.55, 0.2), gloss=0.7, metal=0.3)
            m.place((x, y, 3.0), rz=rz)
            sc.add(m)
    if a2 <= 0:
        lbl3d(sc, (0, 3.5, 3.0), "30% В МЕСЯЦ ГАРАНТИРОВАННО", 34, "gold")

    def ui(ctx):
        fx.pop3d(ctx, "ОШИБКА №5", 640, 150, 76, tl, "red", face=F_XB)
        fx.pop3d(ctx, "ИНФОЦЫГАНЕ", 640, 260, 104, tl - 0.2, "white")
        if a2 > 0:
            fx.pop3d(ctx, "ЭТО ПИРАМИДА", 640, 980, 90, a2, "red")
    f.ui.append(ui)


def s_checklist(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.orbit(content_target(f, 0, 1.8, 3.0), 10, yaw=-0.2, pitch=0.08)
    sc = f.scene()
    cam = sc.cam
    items = b["items"]

    def fn(ctx, X, Y, K):
        corners = [(-2.6, 4.0, 2.9), (2.2, 4.0, 2.6), (2.2, -0.2, 2.6), (-2.6, -0.2, 2.9)]
        q = cam.proj(np.array(corners))

        def content(c):
            fx.glass(c, 0, 0, 900, 790, clamp(tl / 0.4), r=36)
            fx.plain(c, "ПЛАН ИНВЕСТОРА", 450, 90, 52, F_BLACK, "gold", clamp(tl / 0.4), shadow=0)
            for i, (k, s) in enumerate(items):
                a = age(b, k, tl)
                y = 200 + i * 125
                gfx_rrect(c, 50, y - 50, 80, 80, 20)
                c.set_source_rgba(1, 1, 1, 0.12)
                c.fill()
                if a > 0:
                    fx.check(c, 90, y - 10, 58, a / 0.35)
                    fx.plain(c, s, 160, y + 8, fx.fit(c, s, 50, 700, F_XB), F_XB, "white", clamp(a / 0.25), "left", shadow=0)
        draw_on_quad(ctx, q, 900, 790, content, subdiv=3)
    sc.sprite((0, 2, 2.7), fn)


def s_outro(f):
    b, tl = f.b, f.tl
    stage = b.get("stage", 1)
    if stage == 2:
        f.put_char("center", "medium")
        f.orbit((0, 1.6, 6), 11, yaw=0.05, pitch=0.08)
        f.dof = 12

        def ui(ctx):
            fx.pop3d(ctx, "УВИДИМСЯ!", 960, 300, 140, age(b, 1, tl), "gold")
            fx.letterbox(ctx, clamp((tl - f.dur + 1.6) / 1.2))
            if tl > f.dur - 1.0:
                ctx.set_source_rgba(0, 0, 0, clamp((tl - f.dur + 1.0) / 0.9))
                ctx.paint()
        f.ui.append(ui)
        return
    f.put_char()
    f.orbit(content_target(f, 0, 1.4, 3.0), 9, yaw=-0.25 + 0.1 * f.prog, pitch=0.12)
    sc = f.scene()
    a1 = age(b, 1, tl)
    pressed = a1 > 0.6
    btn = box(4.2, 1.2, 0.5, (0.85, 0.12, 0.15) if not pressed else (0.3, 0.3, 0.34), gloss=0.7)
    press = 0.12 * math.sin(math.pi * clamp((a1 - 0.45) / 0.3)) if a1 > 0.45 else 0.0
    btn.place((0, 0.9, 3.0 + press))

    def lab(ctx):
        ctx.rectangle(0, 0, 840, 240)
        ctx.set_source_rgb(*((0.85, 0.12, 0.15) if not pressed else (0.3, 0.3, 0.34)))
        ctx.fill()
        fx.plain(ctx, "ПОДПИСАТЬСЯ" if not pressed else "ВЫ ПОДПИСАНЫ ✓", 420, 150, 92 if not pressed else 76, F_BLACK, "white", 1, shadow=0)
    btn.decals[0] = (lab, (840, 240))
    sc.add(btn)
    # cursor
    if a1 > 0:
        def cur(ctx, x, y, k):
            e = ease_io(clamp(a1 / 0.5))
            cx, cy, _ = sc.cam.pt((1.2 + 2.0 * (1 - e), 1.2 - 1.0 * (1 - e), 2.6))
            ctx.move_to(cx, cy)
            ctx.line_to(cx + 10, cy + 52)
            ctx.line_to(cx + 22, cy + 38)
            ctx.line_to(cx + 44, cy + 44)
            ctx.close_path()
            ctx.set_source_rgb(1, 1, 1)
            ctx.fill_preserve()
            ctx.set_source_rgb(0, 0, 0)
            ctx.set_line_width(2)
            ctx.stroke()
        sc.sprite((1.2, 1.2, 2.4), cur)

    def ui(ctx):
        if age(b, 2, tl) > 0:
            fx.pop3d(ctx, "КИНЬ ДРУГУ С ДЕНЬГАМИ В НОСКЕ", 640, 960, 52, age(b, 2, tl), "gold", face=F_XB)
        fx.pop3d(ctx, "БЫЛО ПОЛЕЗНО?", 640, 180, 92, tl, "white")
    f.ui.append(ui)


SCENES = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}


# ------------------------------------------------------------------ compositor
def render(b, tl, t, level, beats):
    f = Frame(b, tl, t, level, beats)
    SCENES[b["scene"]](f)
    if f.cam is None:
        f.orbit()
    shout = b.get("style") == "shout"
    if shout:
        f.mood = (max(f.mood[0], 0.55 * clamp(tl / 0.4)), f.mood[1])
    # background set at half resolution, blurred for depth of field
    bs, bc = cine._layer(W // 2, H // 2)
    bc.scale(0.5, 0.5)
    cine.studio(bc, f.cam, t, f.mood, accent=f.accent)
    cine.blur_layer(bs, f.dof * 0.5, 0.5)
    fs, fc = cine._layer()
    fc.save()
    fc.scale(2, 2)
    fc.set_source_surface(bs)
    fc.get_source().set_filter(cairo.FILTER_BILINEAR)
    fc.paint()
    fc.restore()
    cine.beams(fc, t, f.beams)
    cine.dust(fc, t)
    if f.sc is not None:
        f.sc.render(fc)
    for fn in f.mid:
        fn(fc)
    if f.char:
        ch = f.char
        cs, cc = cine._layer()
        st = character.perform(t, level, b.get("pose", "explain"), b.get("emo", "neutral"), seed=b["idx"])
        if shout:
            st["emo"] = "angry" if int(t * 1.5) % 3 else "wow"
        st["look"] = {"center": st["look"] * 0.5, "right": -0.7, "left": 0.7}.get(ch["where"], 0.0)
        # gentle entrance when the narrator appears in a new position
        prev = beats[b["idx"] - 1] if b["idx"] > 0 else None
        enter = prev is None or prev.get("char", "center") != b.get("char", "center") or prev.get("shot") != b.get("shot")
        k = ease(tl / 0.45) if enter else 1.0
        character.draw(cc, ch["x"], ch["base"] + (1 - k) * 160, ch["sc"], st)
        cine.light_character(cs, 1.0, rim_side=1 if ch["x"] >= 960 else -1)
        cine.drop_shadow(fc, cs, -60 if ch["x"] >= 960 else 60, 0, 34, 0.55)
        fc.set_source_surface(cs)
        fc.paint()
    cine.dust(fc, t, near=True)
    for fn in f.ui:
        fn(fc)
    if shout:
        fx.edge_glow(fc, (1.0, 0.18, 0.2), clamp(tl / 0.4) * (0.55 + 0.25 * level + 0.1 * math.sin(t * 3)))
    # cut: brief exposure lift at the start of each beat (no black dip)
    flash = f.flash + (0.10 * (1 - tl / 0.18) if (tl < 0.18 and b["idx"] > 0) else 0.0)
    return cine.post(cine.to_np(fs), t, bloom=f.bloom, exposure=f.exposure, flash=flash)
