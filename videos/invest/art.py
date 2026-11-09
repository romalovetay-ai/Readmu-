"""Polished 2D illustration kit (cel-shaded vector style matching the narrator):
every shape gets a base fill, a cel shadow crescent, a rim highlight, a dark plum outline and a soft ground shadow."""
import math
import random
import numpy as np
import cairo

W, H = 1920, 1080
INK = (0.13, 0.06, 0.15)          # outline colour (same family as the narrator's lines)
LW = 5.0                          # base outline width at 1080p

P = {"gold": (1.00, 0.78, 0.28), "green": (0.36, 0.80, 0.52), "red": (0.95, 0.34, 0.37), "blue": (0.38, 0.56, 0.96),
     "purple": (0.62, 0.42, 0.95), "teal": (0.28, 0.78, 0.80), "amber": (1.0, 0.58, 0.24), "cream": (0.99, 0.94, 0.82),
     "white": (0.97, 0.96, 0.98), "grey": (0.62, 0.60, 0.68), "dark": (0.20, 0.16, 0.26), "brown": (0.62, 0.40, 0.24),
     "pink": (1.0, 0.55, 0.65), "note": (0.45, 0.72, 0.55), "steel": (0.55, 0.57, 0.66), "wood": (0.78, 0.55, 0.33)}


def C(c):
    return P[c] if isinstance(c, str) else c


def shade_of(c, k=0.68):
    """Cel shadow colour: darker and shifted toward plum."""
    c = np.array(C(c))
    return tuple(np.clip(c * k + np.array([0.06, -0.01, 0.10]) * (1 - k), 0, 1))


def light_of(c, k=0.45):
    c = np.array(C(c))
    return tuple(np.clip(c + (1 - c) * k, 0, 1))


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def ease(x):
    x = clamp(x)
    return 1 - (1 - x) ** 3


def ease_io(x):
    x = clamp(x)
    return x * x * (3 - 2 * x)


def ease_back(x):
    x = clamp(x)
    return 1 + 2.70158 * (x - 1) ** 3 + 1.70158 * (x - 1) ** 2


def rrect_path(ctx, x, y, w, h, r):
    r = max(0.0, min(r, w / 2, h / 2))
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()


def ell_path(ctx, cx, cy, rx, ry):
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(max(rx, 0.01), max(ry, 0.01))
    ctx.new_sub_path()
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()


def poly_path(ctx, pts):
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.close_path()


# ------------------------------------------------------------------ the core cel-shaded shape
def shape(ctx, path, color, alpha=1.0, shade=0.32, light=0.10, lw=LW, outline=True, sdir=(1, 1), grad=True):
    """path(ctx) builds the path. shade/light are offsets (fraction of ~shape size in px if >1 they are px)."""
    if alpha <= 0:
        return
    c = C(color)
    path(ctx)
    x0, y0, x1, y1 = ctx.fill_extents()
    ctx.new_path()
    size = max(8.0, min(x1 - x0, y1 - y0))
    # base fill with a soft vertical gradient
    path(ctx)
    if grad:
        g = cairo.LinearGradient(0, y0, 0, y1)
        g.add_color_stop_rgba(0, *light_of(c, 0.12), alpha)
        g.add_color_stop_rgba(1, *c, alpha)
        ctx.set_source(g)
    else:
        ctx.set_source_rgba(*c, alpha)
    ctx.fill()
    ctx.save()
    path(ctx)
    ctx.clip()
    # cel shadow: everything outside a copy of the shape moved toward the light
    if shade:
        d = shade if shade > 1 else size * shade
        ctx.rectangle(x0 - 50, y0 - 50, x1 - x0 + 100, y1 - y0 + 100)
        ctx.save()
        ctx.translate(-d * sdir[0] * 0.55, -d * sdir[1])
        path(ctx)
        ctx.restore()
        ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
        ctx.set_source_rgba(*shade_of(c), alpha * 0.9)
        ctx.fill()
        ctx.set_fill_rule(cairo.FILL_RULE_WINDING)
    # rim highlight: outside a copy moved away from the light, on the lit side
    if light:
        d = light if light > 1 else size * light
        ctx.rectangle(x0 - 50, y0 - 50, x1 - x0 + 100, y1 - y0 + 100)
        ctx.save()
        ctx.translate(d * sdir[0] * 0.7, d * sdir[1])
        path(ctx)
        ctx.restore()
        ctx.set_fill_rule(cairo.FILL_RULE_EVEN_ODD)
        ctx.set_source_rgba(1, 1, 1, alpha * 0.30)
        ctx.fill()
        ctx.set_fill_rule(cairo.FILL_RULE_WINDING)
    ctx.restore()
    if outline:
        path(ctx)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_line_width(lw)
        ctx.set_source_rgba(*INK, alpha)
        ctx.stroke()


def gloss(ctx, x, y, w, h, alpha=0.55, ang=-0.5):
    """Little white specular streak."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    rrect_path(ctx, -w / 2, -h / 2, w, h, h / 2)
    ctx.set_source_rgba(1, 1, 1, alpha)
    ctx.fill()
    ctx.restore()


def ground(ctx, cx, cy, rx, alpha=0.35, ry=None):
    """Soft contact shadow under an object."""
    ry = ry or rx * 0.18
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(1, ry / rx)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, rx)
    g.add_color_stop_rgba(0, 0.05, 0.0, 0.08, alpha)
    g.add_color_stop_rgba(0.6, 0.05, 0.0, 0.08, alpha * 0.55)
    g.add_color_stop_rgba(1, 0.05, 0.0, 0.08, 0)
    ctx.arc(0, 0, rx, 0, 2 * math.pi)
    ctx.set_source(g)
    ctx.fill()
    ctx.restore()


# ------------------------------------------------------------------ text
F_BLACK = "Inter Display Black"
F_XB = "Inter Display ExtraBold"
F_SB = "Inter SemiBold"


def text_w(ctx, s, size, face=F_BLACK):
    ctx.select_font_face(face)
    ctx.set_font_size(size)
    return ctx.text_extents(s).x_advance


def fit(ctx, s, size, maxw, face=F_BLACK):
    w = text_w(ctx, s, size, face)
    return size if w <= maxw else size * maxw / w


def title(ctx, s, x, y, size, color="white", alpha=1.0, align="center", face=F_BLACK, outline=True):
    """Sticker-style headline: thick ink outline, offset ink shadow, two-tone fill with a highlight band."""
    if alpha <= 0:
        return 0
    ctx.select_font_face(face)
    ctx.set_font_size(size)
    e = ctx.text_extents(s)
    w = e.x_advance
    x0 = x - w / 2 if align == "center" else (x - w if align == "right" else x)
    c = C(color)
    o = max(3.0, size * 0.075)
    # drop shadow (solid ink, offset)
    ctx.move_to(x0 + o * 0.6, y + o * 1.1)
    ctx.text_path(s)
    ctx.set_line_width(o * 2.2)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_source_rgba(*INK, 0.55 * alpha)
    ctx.stroke_preserve()
    ctx.fill()
    if outline:
        ctx.move_to(x0, y)
        ctx.text_path(s)
        ctx.set_line_width(o * 2.2)
        ctx.set_source_rgba(*INK, alpha)
        ctx.stroke()
    ctx.move_to(x0, y)
    ctx.text_path(s)
    g = cairo.LinearGradient(0, y - size * 0.75, 0, y)
    g.add_color_stop_rgba(0, *light_of(c, 0.35), alpha)
    g.add_color_stop_rgba(0.5, *c, alpha)
    g.add_color_stop_rgba(0.51, *shade_of(c, 0.86), alpha)
    g.add_color_stop_rgba(1, *shade_of(c, 0.78), alpha)
    ctx.set_source(g)
    ctx.fill()
    return w


def pop_title(ctx, s, x, y, size, age, color="white", align="center", face=F_BLACK, out=None):
    if age < 0:
        return
    k = ease_back(age / 0.38)
    a = clamp(age / 0.15)
    if out is not None:
        a *= clamp(out / 0.25)
    ctx.save()
    ctx.translate(x, y)
    sc = 0.5 + 0.5 * k
    ctx.rotate(-0.04 * (1 - ease(age / 0.4)))
    ctx.scale(sc, sc)
    title(ctx, s, 0, 0, size, color, a, align, face)
    ctx.restore()


def plain(ctx, s, x, y, size, face=F_SB, color="white", alpha=1.0, align="center"):
    ctx.select_font_face(face)
    ctx.set_font_size(size)
    e = ctx.text_extents(s)
    x0 = x - e.x_advance / 2 if align == "center" else (x - e.x_advance if align == "right" else x)
    ctx.move_to(x0, y)
    ctx.text_path(s)
    ctx.set_source_rgba(*C(color), alpha)
    ctx.fill()
    return e.x_advance


def tag(ctx, s, x, y, size=34, color="cream", text_color=None, alpha=1.0, rot=0.0):
    """Rounded label with outline (object captions)."""
    if alpha <= 0:
        return
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    ctx.select_font_face(F_XB)
    ctx.set_font_size(size)
    w = ctx.text_extents(s).x_advance
    pw, ph = w + size * 1.0, size * 1.45
    shape(ctx, lambda c: rrect_path(c, -pw / 2, -ph / 2, pw, ph, ph * 0.32), color, alpha, shade=6, light=3, lw=4)
    tc = text_color or ((0.15, 0.08, 0.15) if sum(C(color)) > 1.8 else (1, 1, 1))
    plain(ctx, s, 0, size * 0.36, size, F_XB, tc, alpha)
    ctx.restore()


# ------------------------------------------------------------------ objects
def coin(ctx, x, y, r, color="gold", flip=1.0, alpha=1.0, symbol="₽"):
    """Coin seen face-on; flip in -1..1 squashes it horizontally (spinning)."""
    sx = max(0.06, abs(flip))
    th = r * 0.16
    # edge
    shape(ctx, lambda c: ell_path(c, x + th * 0.5 * (1 if flip >= 0 else -1), y + th * 0.5, r * sx, r), shade_of(color, 0.8), alpha,
          shade=0, light=0)
    shape(ctx, lambda c: ell_path(c, x, y, r * sx, r), color, alpha, shade=0.16, light=0.07)
    if sx > 0.35:
        ell_path(ctx, x, y, r * sx * 0.74, r * 0.74)
        ctx.set_line_width(r * 0.07)
        ctx.set_source_rgba(*shade_of(color, 0.75), alpha * 0.8)
        ctx.stroke()
        ctx.save()
        ctx.translate(x, y)
        ctx.scale(sx, 1)
        ctx.select_font_face(F_BLACK)
        ctx.set_font_size(r * 1.05)
        e = ctx.text_extents(symbol)
        ctx.move_to(-e.x_advance / 2 + r * 0.04, r * 0.38 + r * 0.04)
        ctx.text_path(symbol)
        ctx.set_source_rgba(*shade_of(color, 0.6), alpha)
        ctx.fill()
        ctx.move_to(-e.x_advance / 2, r * 0.38)
        ctx.text_path(symbol)
        ctx.set_source_rgba(*light_of(color, 0.5), alpha)
        ctx.fill()
        ctx.restore()
        gloss(ctx, x - r * 0.42 * sx, y - r * 0.45, r * 0.35 * sx, r * 0.12, 0.6 * alpha)


def coin_stack(ctx, x, y, n, r=60, color="gold", alpha=1.0, wobble=0.0, seed=0):
    """Side view stack of coins standing on (x, y). Returns top y."""
    hh = r * 0.22
    rnd = random.Random(seed)
    ground(ctx, x, y + 4, r * 1.5, 0.35 * alpha)
    top = y
    for i in range(n):
        dx = (rnd.random() - 0.5) * r * 0.10 + wobble * math.sin(i * 0.9)
        cy = y - i * hh
        cx = x + dx
        shape(ctx, lambda c, cx=cx, cy=cy: (rrect_path(c, cx - r, cy - hh, 2 * r, hh, hh * 0.3)), color, alpha,
              shade=0.0, light=0.0, lw=3.5)
        ctx.rectangle(cx - r * 0.55, cy - hh * 0.75, r * 0.25, hh * 0.35)
        ctx.set_source_rgba(1, 1, 1, 0.35 * alpha)
        ctx.fill()
        ctx.rectangle(cx + r * 0.4, cy - hh, r * 0.6 - 2, hh - 1)
        ctx.set_source_rgba(*shade_of(color), 0.55 * alpha)
        ctx.fill()
        top = cy - hh
    # top face
    if n > 0:
        cx = x + (rnd.random() - 0.5) * 0
        shape(ctx, lambda c: ell_path(c, x + dx, top, r, r * 0.28), light_of(color, 0.15), alpha, shade=0, light=0, lw=3.5)
        ctx.select_font_face(F_BLACK)
        ctx.set_font_size(r * 0.42)
        ctx.save()
        ctx.translate(x + dx, top)
        ctx.scale(1, 0.32)
        e = ctx.text_extents("₽")
        ctx.move_to(-e.x_advance / 2, r * 0.45)
        ctx.text_path("₽")
        ctx.set_source_rgba(*shade_of(color, 0.7), alpha)
        ctx.fill()
        ctx.restore()
    return top


def banknote(ctx, x, y, w, rot=0.0, color="note", alpha=1.0, value="5000"):
    h = w * 0.48
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rot)
    shape(ctx, lambda c: rrect_path(c, -w / 2, -h / 2, w, h, w * 0.04), color, alpha, shade=0.12, light=0.05, lw=4)
    rrect_path(ctx, -w / 2 + w * 0.05, -h / 2 + h * 0.1, w * 0.9, h * 0.8, w * 0.03)
    ctx.set_source_rgba(1, 1, 1, 0.35 * alpha)
    ctx.set_line_width(2.5)
    ctx.stroke()
    ell_path(ctx, -w * 0.25, 0, h * 0.28, h * 0.28)
    ctx.set_source_rgba(1, 1, 1, 0.3 * alpha)
    ctx.fill()
    plain(ctx, "₽", -w * 0.25, h * 0.13, h * 0.38, F_BLACK, shade_of(color, 0.55), alpha)
    plain(ctx, value, w * 0.18, h * 0.14, h * 0.32, F_BLACK, shade_of(color, 0.55), alpha)
    ctx.restore()


def bundle(ctx, x, y, w, h, color="note", alpha=1.0):
    """Thick bundle of banknotes standing on (x, y): front shows the paper edges, top shows a note."""
    d = w * 0.22
    ground(ctx, x + d * 0.3, y + 4, w * 0.75, 0.4 * alpha)

    def front(c):
        rrect_path(c, x - w / 2, y - h, w, h, 8)
    shape(ctx, front, color, alpha, shade=0.10, light=0.04)
    ctx.save()
    front(ctx)
    ctx.clip()
    n = max(3, int(h / 9))
    for i in range(n):
        ctx.rectangle(x - w / 2, y - h + (i + 0.5) * h / n, w, 1.6)
    ctx.set_source_rgba(1, 1, 1, 0.28 * alpha)
    ctx.fill()
    ctx.rectangle(x - w * 0.08, y - h, w * 0.16, h)
    ctx.set_source_rgba(*C("cream"), alpha)
    ctx.fill()
    ctx.restore()
    front(ctx)
    ctx.set_line_width(LW)
    ctx.set_source_rgba(*INK, alpha)
    ctx.stroke()
    # top
    top = [(x - w / 2, y - h), (x + w / 2, y - h), (x + w / 2 + d, y - h - d * 0.55), (x - w / 2 + d, y - h - d * 0.55)]
    shape(ctx, lambda c: poly_path(c, top), light_of(color, 0.2), alpha, shade=0, light=0)
    side = [(x + w / 2, y - h), (x + w / 2 + d, y - h - d * 0.55), (x + w / 2 + d, y - d * 0.55), (x + w / 2, y)]
    shape(ctx, lambda c: poly_path(c, side), shade_of(color, 0.75), alpha, shade=0, light=0)
    ctx.save()
    ctx.translate(x + d * 0.5, y - h - d * 0.27)
    ctx.scale(1, 0.32)
    plain(ctx, "₽", 0, w * 0.1, w * 0.3, F_BLACK, shade_of(color, 0.6), alpha)
    ctx.restore()


def block(ctx, x, y, w, h, color, alpha=1.0, depth=None, r=10, label=None, lsize=34):
    """Chunky 2.5D bar/box standing on (x, y) (bottom-centre): front, top and side faces, outlined."""
    d = depth if depth is not None else w * 0.22
    ground(ctx, x + d * 0.3, y + 3, w * 0.8, 0.38 * alpha)
    side = [(x + w / 2, y - h), (x + w / 2 + d, y - h - d * 0.55), (x + w / 2 + d, y - d * 0.55), (x + w / 2, y)]
    shape(ctx, lambda c: poly_path(c, side), shade_of(color, 0.72), alpha, shade=0, light=0)
    top = [(x - w / 2, y - h), (x + w / 2, y - h), (x + w / 2 + d, y - h - d * 0.55), (x - w / 2 + d, y - h - d * 0.55)]
    shape(ctx, lambda c: poly_path(c, top), light_of(color, 0.3), alpha, shade=0, light=0)
    shape(ctx, lambda c: rrect_path(c, x - w / 2, y - h, w, h, min(r, h / 2)), color, alpha, shade=0.0, light=0.06)
    if h > 30:
        ctx.rectangle(x - w / 2 + w * 0.12, y - h + 12, w * 0.08, max(0, h - 24))
        ctx.set_source_rgba(1, 1, 1, 0.22 * alpha)
        ctx.fill()
    if label:
        plain(ctx, label, x, y - h / 2 + lsize * 0.35, lsize, F_BLACK, (1, 1, 1), alpha)


def arrow(ctx, x0, y0, x1, y1, color="gold", alpha=1.0, lw=16):
    ang = math.atan2(y1 - y0, x1 - x0)
    L = math.hypot(x1 - x0, y1 - y0)
    hl = lw * 2.4

    def path(c):
        c.save()
        c.translate(x0, y0)
        c.rotate(ang)
        c.move_to(0, -lw / 2)
        c.line_to(L - hl, -lw / 2)
        c.line_to(L - hl, -lw * 1.4)
        c.line_to(L, 0)
        c.line_to(L - hl, lw * 1.4)
        c.line_to(L - hl, lw / 2)
        c.line_to(0, lw / 2)
        c.close_path()
        c.restore()
    shape(ctx, path, color, alpha, shade=6, light=3, lw=4)


def check(ctx, x, y, s, k, color="green"):
    if k <= 0:
        return
    pts = [(x - s * 0.5, y), (x - s * 0.12, y + s * 0.38), (x + s * 0.55, y - s * 0.42)]
    L1 = math.dist(pts[0], pts[1])
    L2 = math.dist(pts[1], pts[2])
    d = (L1 + L2) * clamp(k)
    ctx.move_to(*pts[0])
    if d <= L1:
        f = d / L1
        ctx.line_to(pts[0][0] + (pts[1][0] - pts[0][0]) * f, pts[0][1] + (pts[1][1] - pts[0][1]) * f)
    else:
        ctx.line_to(*pts[1])
        f = (d - L1) / L2
        ctx.line_to(pts[1][0] + (pts[2][0] - pts[1][0]) * f, pts[1][1] + (pts[2][1] - pts[1][1]) * f)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_width(s * 0.30)
    ctx.set_source_rgba(*INK, 1)
    ctx.stroke_preserve()
    ctx.set_line_width(s * 0.17)
    ctx.set_source_rgba(*C(color), 1)
    ctx.stroke()


def card(ctx, x, y, w, h, color=(0.22, 0.17, 0.30), alpha=1.0, r=28):
    """Illustrated panel: drop shadow, fill, inner top sheen, ink outline."""
    if alpha <= 0:
        return
    rrect_path(ctx, x + 10, y + 14, w, h, r)
    ctx.set_source_rgba(*INK, 0.45 * alpha)
    ctx.fill()
    shape(ctx, lambda c: rrect_path(c, x, y, w, h, r), color, alpha, shade=10, light=5, lw=5)


def person(ctx, x, y, s, color="blue", mood="neutral", alpha=1.0, lean=0.0, t=0.0):
    """Little round-headed figure (investors, traders): body, head, face."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(lean)
    ground(ctx, 0, 0, 55 * s, 0.35 * alpha)
    shape(ctx, lambda c: (c.move_to(-48 * s, 0), c.curve_to(-50 * s, -90 * s, -30 * s, -120 * s, 0, -120 * s),
                          c.curve_to(30 * s, -120 * s, 50 * s, -90 * s, 48 * s, 0), c.close_path()), color, alpha)
    hy = -160 * s
    skin = (1.0, 0.84, 0.70)
    shape(ctx, lambda c: ell_path(c, 0, hy, 42 * s, 44 * s), skin, alpha, shade=0.22, light=0.08)
    # face
    for ex in (-14, 14):
        ell_path(ctx, ex * s, hy - 4 * s, 4.5 * s, 6 * s)
        ctx.set_source_rgba(*INK, alpha)
        ctx.fill()
    ctx.set_line_width(4 * s)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    if mood == "happy":
        ctx.arc(0, hy + 10 * s, 13 * s, 0.2, math.pi - 0.2)
    elif mood == "sad":
        ctx.arc(0, hy + 26 * s, 12 * s, math.pi + 0.3, 2 * math.pi - 0.3)
    else:
        ctx.move_to(-9 * s, hy + 16 * s)
        ctx.line_to(9 * s, hy + 16 * s)
    ctx.set_source_rgba(*INK, alpha)
    ctx.stroke()
    if mood == "sad":  # sweat drop
        shape(ctx, lambda c: (c.move_to(36 * s, hy - 30 * s), c.curve_to(30 * s, hy - 14 * s, 32 * s, hy - 6 * s, 38 * s, hy - 6 * s),
                              c.curve_to(44 * s, hy - 6 * s, 46 * s, hy - 14 * s, 36 * s, hy - 30 * s)), (0.55, 0.8, 1.0), alpha, lw=3)
    ctx.restore()


def sparkle(ctx, x, y, r, alpha=1.0, color=(1, 1, 0.9)):
    ctx.save()
    ctx.translate(x, y)
    ctx.move_to(0, -r)
    for k in range(4):
        a = k * math.pi / 2
        ctx.curve_to(r * 0.12 * math.cos(a + 0.8), r * 0.12 * math.sin(a + 0.8) - 0,
                     r * 0.12 * math.cos(a + 0.8), r * 0.12 * math.sin(a + 0.8), r * math.cos(a + math.pi / 2 - math.pi / 2 + math.pi / 2), r * math.sin(a + math.pi / 2))
    ctx.close_path()
    ctx.set_source_rgba(*color, alpha)
    ctx.fill()
    ctx.restore()


# ------------------------------------------------------------------ background
_BLOBS = [(0.15, 0.25, 0.30, 0.0), (0.85, 0.20, 0.28, 1.3), (0.70, 0.80, 0.34, 2.1), (0.25, 0.85, 0.26, 3.0), (0.50, 0.50, 0.22, 4.2)]


_rnd = random.Random(21)
_CITY = []
_x = -200
while _x < W + 400:
    _w = _rnd.randint(70, 170)
    _CITY.append((_x, _w, _rnd.randint(90, 330), _rnd.random(), _rnd.randint(0, 3)))
    _x += _w + _rnd.randint(-10, 18)
_rnd2 = random.Random(5)
_CITY2 = []
_x = -200
while _x < W + 400:
    _w = _rnd2.randint(90, 210)
    _CITY2.append((_x, _w, _rnd2.randint(60, 200)))
    _x += _w + _rnd2.randint(0, 30)


def skyline(ctx, t, floor_y, top, bot, pan=0.0):
    """Two layers of a soft distant city on the horizon with a few warm windows, fading into haze."""
    far = np.clip(bot * 0.9 + top * 0.4 + 0.03, 0, 1)
    for x, w, h in _CITY2:
        xx = x - pan * 0.15
        rrect_path(ctx, xx, floor_y - h, w, h + 4, 6)
    ctx.set_source_rgba(*far, 0.55)
    ctx.fill()
    near = np.clip(bot * 0.62 + 0.02, 0, 1)
    for x, w, h, r, kind in _CITY:
        xx = x - pan * 0.3
        rrect_path(ctx, xx, floor_y - h, w, h + 4, 5)
        if kind == 0:   # antenna
            ctx.rectangle(xx + w / 2 - 2, floor_y - h - 36, 4, 36)
    ctx.set_source_rgba(*near, 0.85)
    ctx.fill()
    # lit windows (twinkle slowly)
    for i, (x, w, h, r, kind) in enumerate(_CITY):
        xx = x - pan * 0.3
        cols, rows = max(1, int(w / 26)), max(1, int(h / 30))
        for cx in range(cols):
            for ry in range(rows):
                v = (i * 7 + cx * 13 + ry * 29) % 17
                if v > 4:
                    continue
                on = 0.5 + 0.5 * math.sin(t * 0.3 + v + i)
                ctx.rectangle(xx + 10 + cx * 26, floor_y - h + 14 + ry * 30, 12, 14)
                ctx.set_source_rgba(1.0, 0.82, 0.55, 0.20 + 0.25 * on)
                ctx.fill()
    # haze over the city
    g = cairo.LinearGradient(0, floor_y - 360, 0, floor_y)
    g.add_color_stop_rgba(0, *bot, 0)
    g.add_color_stop_rgba(1, *np.clip(bot * 1.2, 0, 1), 0.55)
    ctx.rectangle(0, floor_y - 360, W, 360)
    ctx.set_source(g)
    ctx.fill()


def background(ctx, t, mood=(0.0, 0.0), floor_y=900, pan=0.0):
    """Calm illustrated set in the channel colours: wine->indigo wall, soft shapes, a floor band with a horizon line."""
    red, grn = mood
    top = np.array([0.16, 0.07, 0.24])
    bot = np.array([0.36, 0.10, 0.22])
    top = top * (1 - red) + np.array([0.30, 0.04, 0.08]) * red
    bot = bot * (1 - red) + np.array([0.55, 0.08, 0.10]) * red
    top = top * (1 - grn) + np.array([0.04, 0.18, 0.14]) * grn
    bot = bot * (1 - grn) + np.array([0.08, 0.32, 0.20]) * grn
    g = cairo.LinearGradient(0, 0, 0, floor_y)
    g.add_color_stop_rgb(0, *top)
    g.add_color_stop_rgb(1, *bot)
    ctx.rectangle(0, 0, W, floor_y)
    ctx.set_source(g)
    ctx.fill()
    # big soft blobs drifting slowly (parallax with pan)
    for i, (u, v, s, ph) in enumerate(_BLOBS):
        x = u * W + 60 * math.sin(t * 0.07 + ph) - pan * (0.3 + 0.2 * i)
        y = v * floor_y + 40 * math.cos(t * 0.05 + ph)
        r = s * W
        rg = cairo.RadialGradient(x, y, 0, x, y, r)
        cc = np.clip(bot * 1.5 + np.array([0.05, 0.0, 0.08]), 0, 1) if i % 2 else np.clip(top * 1.7, 0, 1)
        rg.add_color_stop_rgba(0, *cc, 0.45)
        rg.add_color_stop_rgba(1, *cc, 0)
        ctx.set_source(rg)
        ctx.paint()
    # rotating rounded squares (channel motif), faint
    for i in range(6):
        x = (i * 360 + 120 - pan * 0.5) % (W + 200) - 100
        y = 160 + (i % 3) * 230
        s = 70 + (i % 2) * 40
        ctx.save()
        ctx.translate(x, y + 12 * math.sin(t * 0.4 + i))
        ctx.rotate(t * 0.08 * (1 if i % 2 else -1) + i)
        rrect_path(ctx, -s / 2, -s / 2, s, s, s * 0.25)
        ctx.set_line_width(4)
        ctx.set_source_rgba(1, 0.75, 0.85, 0.07)
        ctx.stroke()
        ctx.restore()
    skyline(ctx, t, floor_y, top, bot, pan)
    # floor
    fg = cairo.LinearGradient(0, floor_y, 0, H)
    fl = bot * 0.55 + np.array([0.02, 0.0, 0.04])
    fg.add_color_stop_rgb(0, *(fl * 1.25))
    fg.add_color_stop_rgb(1, *(fl * 0.7))
    ctx.rectangle(0, floor_y, W, H - floor_y)
    ctx.set_source(fg)
    ctx.fill()
    ctx.rectangle(0, floor_y - 3, W, 6)
    ctx.set_source_rgba(1, 0.7, 0.8, 0.18)
    ctx.fill()
    # floor planks / perspective lines
    ctx.set_line_width(2)
    for k in range(-8, 9):
        ctx.move_to(W / 2 + k * 160 - pan * 0.8, floor_y)
        ctx.line_to(W / 2 + k * 420 - pan * 1.6, H)
    ctx.set_source_rgba(1, 1, 1, 0.035)
    ctx.stroke()
    # warm spotlight pool on the floor + soft light from above
    sp = cairo.RadialGradient(W * 0.42, floor_y + 70, 0, W * 0.42, floor_y + 70, 700)
    sp.add_color_stop_rgba(0, 1, 0.8, 0.7, 0.16)
    sp.add_color_stop_rgba(1, 1, 0.8, 0.7, 0)
    ctx.save()
    ctx.translate(0, floor_y + 70)
    ctx.scale(1, 0.25)
    ctx.translate(0, -(floor_y + 70))
    ctx.set_source(sp)
    ctx.paint()
    ctx.restore()
    tl = cairo.RadialGradient(W * 0.4, -200, 0, W * 0.4, -200, 1300)
    tl.add_color_stop_rgba(0, 1, 0.85, 0.8, 0.14)
    tl.add_color_stop_rgba(1, 1, 0.85, 0.8, 0)
    ctx.set_source(tl)
    ctx.paint()
