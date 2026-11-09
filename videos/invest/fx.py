"""Cinematic 2D overlays: extruded 3D text with a light sweep, glass panels, flares, labels."""
import math
import numpy as np
import cairo

from cine import W, H, ease, ease_back, ease_io, clamp, col, gfx_rrect, draw_on_quad

F_BLACK = "Inter Display Black"
F_XB = "Inter Display ExtraBold"
F_SB = "Inter SemiBold"
F_MED = "Inter Medium"
WHITE = (1, 1, 1)
TXT = {"white": (0.97, 0.96, 0.95), "gold": (1.0, 0.80, 0.30), "red": (1.0, 0.30, 0.30), "green": (0.35, 0.95, 0.58),
       "grey": (0.66, 0.64, 0.72), "blue": (0.45, 0.65, 1.0), "amber": (1.0, 0.6, 0.2), "cream": (0.97, 0.92, 0.80)}


def tcol(c):
    return TXT.get(c, None) or col(c)


def _font(ctx, face, size):
    ctx.select_font_face(face)
    ctx.set_font_size(size)


def width(ctx, s, size, face=F_BLACK):
    _font(ctx, face, size)
    return ctx.text_extents(s).x_advance


def plain(ctx, s, x, y, size, face=F_SB, color="white", alpha=1.0, align="center", shadow=0.5):
    _font(ctx, face, size)
    e = ctx.text_extents(s)
    x0 = x - e.x_advance / 2 if align == "center" else (x - e.x_advance if align == "right" else x)
    c = tcol(color)
    if shadow:
        ctx.move_to(x0 + 2, y + 3)
        ctx.text_path(s)
        ctx.set_source_rgba(0, 0, 0, shadow * alpha)
        ctx.fill()
    ctx.move_to(x0, y)
    ctx.text_path(s)
    ctx.set_source_rgba(*c, alpha)
    ctx.fill()
    return e.x_advance


def text3d(ctx, s, x, y, size, color="white", alpha=1.0, align="center", face=F_BLACK, depth=None, sweep=None, glow=0.35):
    """Extruded, lit headline text. y = baseline. sweep in 0..1 moves a specular band across the letters."""
    if alpha <= 0:
        return 0
    _font(ctx, face, size)
    e = ctx.text_extents(s)
    w = e.x_advance
    x0 = x - w / 2 if align == "center" else (x - w if align == "right" else x)
    c = np.array(tcol(color))
    depth = depth if depth is not None else max(4, int(size * 0.09))
    # soft drop shadow
    for r, a in ((size * 0.10, 0.18), (size * 0.05, 0.25)):
        ctx.move_to(x0 + depth * 0.9, y + depth * 1.6)
        ctx.text_path(s)
        ctx.set_line_width(r)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_source_rgba(0, 0, 0, a * alpha)
        ctx.stroke_preserve()
        ctx.fill()
    # glow
    if glow > 0:
        for r, a in ((size * 0.30, 0.06), (size * 0.16, 0.10), (size * 0.07, 0.16)):
            ctx.move_to(x0, y)
            ctx.text_path(s)
            ctx.set_line_width(r)
            ctx.set_source_rgba(*c, a * glow * alpha)
            ctx.stroke()
    # extrusion: stacked copies going down-right, darker with depth
    side = c * 0.35
    for i in range(depth, 0, -1):
        k = i / depth
        ctx.move_to(x0 + i * 0.55, y + i * 0.9)
        ctx.text_path(s)
        cc = side * (1.15 - 0.55 * k)
        ctx.set_source_rgba(*cc, alpha)
        ctx.fill()
    # front face: vertical gradient
    ctx.move_to(x0, y)
    ctx.text_path(s)
    g = cairo.LinearGradient(0, y - size * 0.78, 0, y + size * 0.05)
    g.add_color_stop_rgba(0, *np.clip(c * 0.55 + 0.48, 0, 1), alpha)
    g.add_color_stop_rgba(0.55, *c, alpha)
    g.add_color_stop_rgba(1, *(c * 0.72), alpha)
    ctx.set_source(g)
    ctx.fill_preserve()
    # thin bright bevel line on top
    ctx.set_line_width(max(1.0, size * 0.012))
    ctx.set_source_rgba(1, 1, 1, 0.35 * alpha)
    ctx.stroke()
    # specular sweep
    if sweep is not None and 0 < sweep < 1:
        ctx.save()
        ctx.move_to(x0, y)
        ctx.text_path(s)
        ctx.clip()
        sx = x0 - size + (w + 2 * size) * sweep
        g = cairo.LinearGradient(sx - size * 0.5, y - size, sx + size * 0.5, y)
        g.add_color_stop_rgba(0, 1, 1, 1, 0)
        g.add_color_stop_rgba(0.5, 1, 1, 1, 0.75 * alpha)
        g.add_color_stop_rgba(1, 1, 1, 1, 0)
        ctx.set_source(g)
        ctx.paint()
        ctx.restore()
    return w


def pop3d(ctx, s, x, y, size, age, color="white", align="center", face=F_BLACK, out=None, glow=0.35):
    """Headline that flies in: scale overshoot, slight rise, light sweep shortly after landing."""
    if age < 0:
        return
    k = ease_back(age / 0.42)
    a = clamp(age / 0.22)
    if out is not None:
        a *= clamp(out / 0.25)
    ctx.save()
    ctx.translate(x, y + 30 * (1 - ease(age / 0.4)))
    sc = 0.55 + 0.45 * k
    ctx.scale(sc, sc)
    text3d(ctx, s, 0, 0, size, color, a, align, face, sweep=(age - 0.35) / 0.7, glow=glow)
    ctx.restore()


def fit(ctx, s, size, maxw, face=F_BLACK):
    w = width(ctx, s, size, face)
    return size if w <= maxw else size * maxw / w


def glass(ctx, x, y, w, h, alpha=1.0, r=26, tint=(0.10, 0.07, 0.18), border=(1, 1, 1), glow=None):
    """Frosted glass panel with bevel highlight."""
    if alpha <= 0:
        return
    # shadow
    for k, a in ((26, 0.10), (14, 0.14), (6, 0.18)):
        gfx_rrect(ctx, x - k * 0.2, y + k * 0.6, w + k * 0.4, h + k * 0.4, r + k)
        ctx.set_source_rgba(0, 0, 0, a * alpha)
        ctx.fill()
    gfx_rrect(ctx, x, y, w, h, r)
    g = cairo.LinearGradient(x, y, x + w * 0.4, y + h)
    g.add_color_stop_rgba(0, *(np.array(tint) + 0.10), 0.82 * alpha)
    g.add_color_stop_rgba(1, *tint, 0.88 * alpha)
    ctx.set_source(g)
    ctx.fill()
    # inner top sheen
    ctx.save()
    gfx_rrect(ctx, x, y, w, h, r)
    ctx.clip()
    g = cairo.LinearGradient(0, y, 0, y + h * 0.45)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.10 * alpha)
    g.add_color_stop_rgba(1, 1, 1, 1, 0)
    ctx.set_source(g)
    ctx.paint()
    ctx.restore()
    gfx_rrect(ctx, x + 1, y + 1, w - 2, h - 2, r)
    g = cairo.LinearGradient(x, y, x + w, y + h)
    bc = border if glow is None else glow
    g.add_color_stop_rgba(0, *bc, 0.55 * alpha)
    g.add_color_stop_rgba(0.5, *bc, 0.12 * alpha)
    g.add_color_stop_rgba(1, *bc, 0.35 * alpha)
    ctx.set_source(g)
    ctx.set_line_width(2.0)
    ctx.stroke()


def flare(ctx, x, y, k=1.0, color=(0.55, 0.75, 1.0), length=900):
    """Anamorphic lens flare: long horizontal streak + core glow."""
    if k <= 0:
        return
    g = cairo.LinearGradient(x - length, y, x + length, y)
    g.add_color_stop_rgba(0, *color, 0)
    g.add_color_stop_rgba(0.5, *color, 0.55 * k)
    g.add_color_stop_rgba(1, *color, 0)
    ctx.rectangle(x - length, y - 3, 2 * length, 6)
    ctx.set_source(g)
    ctx.fill()
    ctx.rectangle(x - length * 0.6, y - 12, 1.2 * length, 24)
    g2 = cairo.LinearGradient(x - length * 0.6, y, x + length * 0.6, y)
    g2.add_color_stop_rgba(0, *color, 0)
    g2.add_color_stop_rgba(0.5, *color, 0.12 * k)
    g2.add_color_stop_rgba(1, *color, 0)
    ctx.set_source(g2)
    ctx.fill()
    r = 120
    rg = cairo.RadialGradient(x, y, 0, x, y, r)
    rg.add_color_stop_rgba(0, 1, 1, 1, 0.8 * k)
    rg.add_color_stop_rgba(0.2, *color, 0.35 * k)
    rg.add_color_stop_rgba(1, *color, 0)
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.set_source(rg)
    ctx.fill()


def label(ctx, s, x, y, size=34, color="white", alpha=1.0, align="center", bg=True, face=F_XB):
    """Small caption chip (used for 3D object labels)."""
    if alpha <= 0:
        return
    _font(ctx, face, size)
    e = ctx.text_extents(s)
    w = e.x_advance
    x0 = x - w / 2 if align == "center" else (x - w if align == "right" else x)
    if bg:
        pad = size * 0.45
        gfx_rrect(ctx, x0 - pad, y - size * 0.95, w + 2 * pad, size * 1.35, size * 0.3)
        ctx.set_source_rgba(0.05, 0.03, 0.09, 0.72 * alpha)
        ctx.fill_preserve()
        ctx.set_source_rgba(*tcol(color), 0.45 * alpha)
        ctx.set_line_width(1.6)
        ctx.stroke()
    ctx.move_to(x0, y)
    ctx.text_path(s)
    ctx.set_source_rgba(*tcol(color), alpha)
    ctx.fill()


def arrow(ctx, x0, y0, x1, y1, color="gold", alpha=1.0, lw=8, head=26):
    c = tcol(color)
    ang = math.atan2(y1 - y0, x1 - x0)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    for w_, a in ((lw * 3, 0.15), (lw, 1.0)):
        ctx.move_to(x0, y0)
        ctx.line_to(x1 - math.cos(ang) * head * 0.6, y1 - math.sin(ang) * head * 0.6)
        ctx.set_line_width(w_)
        ctx.set_source_rgba(*c, a * alpha)
        ctx.stroke()
    ctx.move_to(x1, y1)
    ctx.line_to(x1 - head * math.cos(ang - 0.45), y1 - head * math.sin(ang - 0.45))
    ctx.line_to(x1 - head * math.cos(ang + 0.45), y1 - head * math.sin(ang + 0.45))
    ctx.close_path()
    ctx.set_source_rgba(*c, alpha)
    ctx.fill()


def check(ctx, x, y, s, k, color="green"):
    """Animated check mark; k = draw progress 0..1."""
    if k <= 0:
        return
    c = tcol(color)
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
    ctx.set_line_width(s * 0.22)
    ctx.set_source_rgba(*c, 0.25)
    ctx.stroke_preserve()
    ctx.set_line_width(s * 0.13)
    ctx.set_source_rgba(*c, 1)
    ctx.stroke()


def edge_glow(ctx, color, k):
    """Coloured glow around the frame edges (used for shouting)."""
    if k <= 0:
        return
    g = cairo.RadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, W * 0.62)
    g.add_color_stop_rgba(0, *color, 0)
    g.add_color_stop_rgba(1, *color, 0.7 * k)
    ctx.set_source(g)
    ctx.paint()


def letterbox(ctx, k):
    """Cinematic bars sliding in (k 0..1)."""
    if k <= 0:
        return
    hb = 120 * ease_io(k)
    ctx.rectangle(0, 0, W, hb)
    ctx.rectangle(0, H - hb, W, hb)
    ctx.set_source_rgba(0, 0, 0, 1)
    ctx.fill()
