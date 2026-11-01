"""Narrator: a young guy with messy light-blond hair and a neck tattoo, drawn in pycairo.

draw(ctx, cx, base_y, scale, state) draws a waist-up bust whose bottom edge sits on base_y.
state keys: pose (think|cross|explain|shrug|point|idle|shock|facepalm), emo (neutral|smirk|wow|sad|doubt|happy),
t (seconds), level (mouth opening 0..1), look (-1..1 horizontal gaze), blink (0..1 override), tilt (radians).
Coordinates below are in a 1000-unit "character space": head centre at (0, -640), shoulders at y=-300.
"""
import math
import cairo

OUT = (0.09, 0.08, 0.10)
SKIN = (0.96, 0.80, 0.68)
SKIN_SH = (0.87, 0.64, 0.52)
SKIN_HI = (1.0, 0.88, 0.78)
HAIR = (0.96, 0.84, 0.47)
HAIR_SH = (0.80, 0.63, 0.28)
HAIR_HI = (1.0, 0.95, 0.72)
HOOD = (0.17, 0.18, 0.22)
HOOD_SH = (0.11, 0.115, 0.14)
HOOD_HI = (0.25, 0.27, 0.32)
TEE = (0.92, 0.92, 0.90)
INK = (0.13, 0.22, 0.30)
IRIS = (0.36, 0.60, 0.74)
LW = 7.0


def _c(ctx, c, a=1.0):
    ctx.set_source_rgba(c[0], c[1], c[2], a)


def _fill_stroke(ctx, fill, lw=LW, a=1.0):
    _c(ctx, fill, a)
    ctx.fill_preserve()
    _c(ctx, OUT)
    ctx.set_line_width(lw)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.stroke()


def _smooth(ctx, pts, closed=True, k=0.22):
    """Catmull-Rom style smooth path through points."""
    n = len(pts)
    if n < 3:
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
        return
    rng = range(n) if closed else range(n - 1)
    ctx.move_to(*pts[0])
    for i in rng:
        p0 = pts[(i - 1) % n] if (closed or i > 0) else pts[i]
        p1 = pts[i]
        p2 = pts[(i + 1) % n]
        p3 = pts[(i + 2) % n] if (closed or i + 2 < n) else p2
        c1 = (p1[0] + (p2[0] - p0[0]) * k, p1[1] + (p2[1] - p0[1]) * k)
        c2 = (p2[0] - (p3[0] - p1[0]) * k, p2[1] - (p3[1] - p1[1]) * k)
        ctx.curve_to(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    if closed:
        ctx.close_path()


def _rng(seed):
    import random
    return random.Random(seed)


def _ellipse(ctx, x, y, rx, ry):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(rx, ry)
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()


# ----------------------------------------------------------------- body
def _torso(ctx, breathe):
    s = 1 + 0.012 * breathe
    ctx.save()
    ctx.scale(s, 1)
    # hoodie body
    pts = [(-430, 0), (-420, -190), (-360, -290), (-210, -345), (-95, -360), (0, -352), (95, -360),
           (210, -345), (360, -290), (420, -190), (430, 0)]
    _smooth(ctx, pts, closed=False)
    ctx.line_to(430, 40)
    ctx.line_to(-430, 40)
    ctx.close_path()
    _fill_stroke(ctx, HOOD)
    # side shading
    _smooth(ctx, [(-430, 0), (-420, -190), (-360, -290), (-300, -310), (-330, -150), (-340, 40)], closed=False)
    ctx.line_to(-430, 40)
    ctx.close_path()
    _c(ctx, HOOD_SH, 0.8)
    ctx.fill()
    # hood rim lying around the neck
    _smooth(ctx, [(-230, -340), (-150, -395), (0, -405), (150, -395), (230, -340), (160, -300), (0, -290),
                  (-160, -300)], closed=True)
    _fill_stroke(ctx, HOOD_HI, 6)
    # inner collar of the white tee
    _smooth(ctx, [(-120, -330), (0, -265), (120, -330), (60, -350), (0, -340), (-60, -350)], closed=True)
    _fill_stroke(ctx, TEE, 5)
    ctx.move_to(-104, -326)
    ctx.curve_to(-50, -286, 50, -286, 104, -326)
    _c(ctx, (0.78, 0.78, 0.76))
    ctx.set_line_width(3)
    ctx.stroke()
    # inner lining of the hood, slightly lighter, with a fold line
    _smooth(ctx, [(-200, -350), (-120, -388), (0, -396), (120, -388), (200, -350), (120, -370), (0, -376),
                  (-120, -370)], closed=True)
    _c(ctx, (0.30, 0.32, 0.38), 0.9)
    ctx.fill()
    # shoulder seams and chest folds
    for sx in (-1, 1):
        ctx.move_to(sx * 235, -335)
        ctx.curve_to(sx * 280, -250, sx * 300, -150, sx * 310, -40)
        ctx.move_to(sx * 150, -250)
        ctx.curve_to(sx * 170, -200, sx * 165, -150, sx * 150, -110)
        ctx.move_to(sx * 330, -120)
        ctx.curve_to(sx * 300, -90, sx * 290, -60, sx * 300, -20)
    _c(ctx, HOOD_SH)
    ctx.set_line_width(5)
    ctx.stroke()
    # light falling on the shoulders
    for sx in (-1, 1):
        _smooth(ctx, [(sx * 230, -338), (sx * 330, -300), (sx * 380, -240), (sx * 340, -255), (sx * 250, -300)])
        _c(ctx, (1, 1, 1), 0.06)
        ctx.fill()
    # kangaroo pocket seam
    ctx.move_to(-200, 40)
    ctx.curve_to(-180, -40, -150, -70, -110, -75)
    ctx.line_to(110, -75)
    ctx.curve_to(150, -70, 180, -40, 200, 40)
    _c(ctx, HOOD_SH)
    ctx.set_line_width(5)
    ctx.stroke()
    # double stitching along seams (dashed)
    ctx.save()
    ctx.set_dash([7, 6])
    for sx in (-1, 1):
        ctx.move_to(sx * 245, -332)
        ctx.curve_to(sx * 292, -248, sx * 312, -150, sx * 322, -40)
    ctx.move_to(-188, 40)
    ctx.curve_to(-170, -30, -142, -58, -104, -62)
    ctx.line_to(104, -62)
    ctx.curve_to(142, -58, 170, -30, 188, 40)
    _c(ctx, (0.36, 0.38, 0.44), 0.9)
    ctx.set_line_width(2.5)
    ctx.stroke()
    ctx.restore()
    # chest patch: small embroidered coin with a ruble sign
    px, py = 190, -215
    ctx.arc(px, py, 30, 0, 2 * math.pi)
    _c(ctx, (0.85, 0.68, 0.22))
    ctx.fill_preserve()
    _c(ctx, OUT)
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.save()
    ctx.set_dash([4, 4])
    ctx.arc(px, py, 24, 0, 2 * math.pi)
    _c(ctx, (0.55, 0.40, 0.08))
    ctx.set_line_width(2)
    ctx.stroke()
    ctx.restore()
    ctx.move_to(px - 6, py + 16)
    ctx.line_to(px - 6, py - 14)
    ctx.curve_to(px + 14, py - 16, px + 14, py + 2, px - 6, py)
    ctx.move_to(px - 13, py + 7)
    ctx.line_to(px + 6, py + 7)
    _c(ctx, (0.30, 0.20, 0.03))
    ctx.set_line_width(4)
    ctx.stroke()
    # metal grommets where the drawstrings come out
    for sx in (-70, 70):
        ctx.arc(sx, -300, 11, 0, 2 * math.pi)
        _c(ctx, (0.70, 0.72, 0.76))
        ctx.fill_preserve()
        _c(ctx, OUT)
        ctx.set_line_width(3)
        ctx.stroke()
        ctx.arc(sx, -300, 5, 0, 2 * math.pi)
        _c(ctx, (0.10, 0.10, 0.12))
        ctx.fill()
    # drawstrings
    for sx in (-70, 70):
        ctx.move_to(sx, -300)
        ctx.curve_to(sx + 6, -230, sx - 8, -170, sx + 4, -110)
        _c(ctx, (0.85, 0.85, 0.82))
        ctx.set_line_width(9)
        ctx.stroke()
        ctx.rectangle(sx - 5, -122, 18, 30)
        _fill_stroke(ctx, (0.72, 0.74, 0.78), 4)
        ctx.rectangle(sx - 1, -118, 4, 22)
        _c(ctx, (1, 1, 1), 0.7)
        ctx.fill()
    ctx.restore()


def _neck(ctx):
    _smooth(ctx, [(-78, -470), (-82, -360), (-60, -318), (0, -300), (60, -318), (82, -360), (78, -470)], closed=False)
    ctx.close_path()
    _fill_stroke(ctx, SKIN)
    # jaw shadow on the neck
    _smooth(ctx, [(-78, -470), (0, -420), (78, -470), (78, -445), (0, -395), (-78, -445)], closed=True)
    _c(ctx, SKIN_SH, 0.85)
    ctx.fill()
    ctx.move_to(-14, -385)
    ctx.curve_to(-6, -372, 6, -372, 12, -385)
    _c(ctx, SKIN_SH)
    ctx.set_line_width(4)
    ctx.stroke()
    _tattoo(ctx)


T_NAVY = (0.10, 0.10, 0.12)
T_BLUE = (0.42, 0.42, 0.45)
T_RED = (0.30, 0.30, 0.33)
T_CREAM = (0.96, 0.80, 0.68)  # left as bare skin (negative space)
T_INK = (0.06, 0.07, 0.10)


def _feather(ctx, bx, by, tx, ty, w, fill=T_NAVY, edge=T_BLUE):
    """One long feather: a lens from base to tip with a light edge band and a quill line."""
    a = math.atan2(ty - by, tx - bx)
    ln = math.hypot(tx - bx, ty - by)
    ctx.save()
    ctx.translate(bx, by)
    ctx.rotate(a)
    ctx.move_to(0, -w * 0.4)
    ctx.curve_to(ln * 0.35, -w, ln * 0.8, -w * 0.7, ln, 0)
    ctx.curve_to(ln * 0.8, w * 0.55, ln * 0.35, w * 0.8, 0, w * 0.4)
    ctx.close_path()
    _c(ctx, fill)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    ctx.move_to(ln * 0.1, -w * 0.62)
    ctx.curve_to(ln * 0.4, -w * 0.95, ln * 0.8, -w * 0.62, ln * 1.02, 0)
    _c(ctx, edge)
    ctx.set_line_width(w * 0.55)
    ctx.stroke()
    ctx.restore()
    _c(ctx, T_INK)
    ctx.set_line_width(2.6)
    ctx.stroke()
    ctx.move_to(ln * 0.05, 0)
    ctx.curve_to(ln * 0.4, -w * 0.15, ln * 0.7, -w * 0.1, ln * 0.92, 0)
    for k in range(1, 6):  # barbs
        u = k / 6.5
        ctx.move_to(ln * u, -w * 0.08)
        ctx.line_to(ln * (u + 0.07), -w * 0.55 * (1 - u * 0.6))
        ctx.move_to(ln * u, w * 0.05)
        ctx.line_to(ln * (u + 0.06), w * 0.4 * (1 - u * 0.6))
    _c(ctx, T_INK, 0.6)
    ctx.set_line_width(1.2)
    ctx.stroke()
    ctx.restore()


def _nautical_star(ctx, x, y, r, rot=0.0):
    pts = []
    for k in range(10):
        a = -math.pi / 2 + rot + k * math.pi / 5
        rr = r if k % 2 == 0 else r * 0.42
        pts.append((x + rr * math.cos(a), y + rr * math.sin(a)))
    # two-tone halves of each point
    for k in range(0, 10, 2):
        tip, lft, rgt = pts[k], pts[k - 1], pts[(k + 1) % 10]
        for side, col in ((lft, T_NAVY), (rgt, T_RED)):
            ctx.move_to(x, y)
            ctx.line_to(*tip)
            ctx.line_to(*side)
            ctx.close_path()
            _c(ctx, col)
            ctx.fill()
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.close_path()
    for k in range(0, 10, 2):
        ctx.move_to(x, y)
        ctx.line_to(*pts[k])
    _c(ctx, T_INK)
    ctx.set_line_width(2.2)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()


TATTOO_TEXT = "WUZI"
TATTOO_FONT = "Pirata One"  # videos/narrator/fonts (OFL); falls back to a serif if not installed


def _tattoo(ctx):
    """Black-and-grey blackletter lettering across the side of the neck, slightly arched."""
    ctx.save()
    _smooth(ctx, [(-78, -470), (-82, -360), (-60, -318), (0, -300), (60, -318), (82, -360), (78, -470)], closed=False)
    ctx.close_path()
    ctx.clip()
    ctx.translate(4, -338)
    ctx.rotate(-0.06)
    ctx.select_font_face(TATTOO_FONT, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_NORMAL)
    ctx.set_font_size(56)
    ext = ctx.text_extents(TATTOO_TEXT)
    total = ext.x_advance
    # build the arched text path letter by letter
    ctx.new_path()
    x = -total / 2
    for ch in TATTOO_TEXT:
        w = ctx.text_extents(ch).x_advance
        u = (x + w / 2) / (total / 2)  # -1..1
        ctx.save()
        ctx.translate(x + w / 2, 6 * u * u)  # gentle smile-shaped arch
        ctx.rotate(0.10 * u)
        ctx.move_to(-w / 2, 0)
        ctx.text_path(ch)
        ctx.restore()
        x += w
    path = ctx.copy_path()
    ctx.push_group()
    # thick soft outline (healed ink spread) -> black fill -> grey gradient shading -> small whip highlights
    ctx.append_path(path)
    _c(ctx, T_INK, 0.25)
    ctx.set_line_width(3)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()
    ctx.append_path(path)
    _c(ctx, T_INK)
    ctx.fill()
    ctx.append_path(path)
    ctx.save()
    ctx.clip()
    g = cairo.LinearGradient(0, -38, 0, 8)
    g.add_color_stop_rgba(0, 0.45, 0.45, 0.48, 0.0)
    g.add_color_stop_rgba(0.55, 0.45, 0.45, 0.48, 0.0)
    g.add_color_stop_rgba(1, 0.50, 0.50, 0.53, 0.75)
    ctx.set_source(g)
    ctx.paint()
    r = _rng(9)
    for _ in range(90):  # stipple in the lower half of the strokes
        ctx.arc(r.uniform(-total / 2, total / 2), r.uniform(-14, 6), r.uniform(0.4, 0.9), 0, 2 * math.pi)
    _c(ctx, (0.62, 0.62, 0.65), 0.6)
    ctx.fill()
    ctx.restore()
    # thin baseline flourish under the word
    ctx.move_to(-total / 2 + 8, 12)
    ctx.curve_to(-total / 4, 17, total / 4, 17, total / 2 - 8, 12)
    _c(ctx, T_INK)
    ctx.set_line_width(2)
    ctx.stroke()
    ctx.pop_group_to_source()
    ctx.paint_with_alpha(0.9)  # healed-ink look
    ctx.restore()


# ----------------------------------------------------------------- head
def _lock(ctx, bx, by, ang, ln, wd, bend, fill, lw=6):
    """A tapered crescent-shaped lock from base (bx,by) in direction ang (0 = up); bend bows it sideways."""
    dx, dy = math.sin(ang), -math.cos(ang)
    nx, ny = math.cos(ang), math.sin(ang)
    tx, ty = bx + dx * ln + nx * bend, by + dy * ln + ny * bend
    m1 = (bx + dx * ln * 0.5 + nx * (bend * 0.9 - wd * 0.55), by + dy * ln * 0.5 + ny * (bend * 0.9 - wd * 0.55))
    m2 = (bx + dx * ln * 0.5 + nx * (bend * 0.6 + wd * 0.5), by + dy * ln * 0.5 + ny * (bend * 0.6 + wd * 0.5))
    ctx.move_to(bx - nx * wd, by - ny * wd)
    ctx.curve_to(bx - nx * wd + dx * ln * 0.25, by - ny * wd + dy * ln * 0.25, m1[0] - dx * ln * 0.15,
                 m1[1] - dy * ln * 0.15, m1[0], m1[1])
    ctx.curve_to(m1[0] + dx * ln * 0.2, m1[1] + dy * ln * 0.2, tx - dx * ln * 0.12, ty - dy * ln * 0.12, tx, ty)
    ctx.curve_to(tx - dx * ln * 0.18, ty - dy * ln * 0.18, m2[0] + dx * ln * 0.2, m2[1] + dy * ln * 0.2, m2[0], m2[1])
    ctx.curve_to(m2[0] - dx * ln * 0.15, m2[1] - dy * ln * 0.15, bx + nx * wd + dx * ln * 0.25,
                 by + ny * wd + dy * ln * 0.25, bx + nx * wd, by + ny * wd)
    ctx.close_path()
    g = cairo.LinearGradient(bx, by, tx, ty)
    dark = tuple(c * 0.78 for c in fill)
    light = tuple(min(1.0, c * 1.07 + 0.04) for c in fill)
    g.add_color_stop_rgb(0, *dark)
    g.add_color_stop_rgb(0.55, *fill)
    g.add_color_stop_rgb(1, *light)
    ctx.set_source(g)
    ctx.fill_preserve()
    _c(ctx, OUT)
    ctx.set_line_width(lw)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()
    # a soft rim light along one edge of the lock for volume
    ctx.move_to(bx + nx * wd * 0.5, by + ny * wd * 0.5)
    ctx.curve_to(m2[0] - nx * wd * 0.15, m2[1] - ny * wd * 0.15, tx - dx * ln * 0.25, ty - dy * ln * 0.25,
                 tx - dx * ln * 0.08, ty - dy * ln * 0.08)
    _c(ctx, (1, 0.97, 0.85), 0.45)
    ctx.set_line_width(max(2.0, wd * 0.12))
    ctx.stroke()


H_DEEP = (0.70, 0.52, 0.22)
H_SHADOW = (0.86, 0.70, 0.34)
H_BASE = (0.97, 0.86, 0.50)
H_LIGHT = (1.0, 0.92, 0.62)
H_SHINE = (1.0, 0.98, 0.86)


def _clump_path(ctx, bx, by, ang, ln, wd, bend, fork):
    """Ragged tapered hair clump; fork > 0 splits the tip into two points."""
    dx, dy = math.sin(ang), -math.cos(ang)
    nx, ny = math.cos(ang), math.sin(ang)

    def P(u, v):  # u along the clump 0..1, v across -1..1 (scaled by width that tapers)
        w = wd * (1 - u ** 1.7) * (0.92 + 0.08 * math.sin(u * 9))
        b = bend * u * u * 1.4
        return (bx + dx * ln * u + nx * (v * w + b), by + dy * ln * u + ny * (v * w + b))
    tipL = P(1.0, 0)
    left = [P(u, -1) for u in (0.0, 0.2, 0.4, 0.6, 0.78, 0.9)]
    right = [P(u, 1) for u in (0.9, 0.78, 0.6, 0.4, 0.2, 0.0)]
    _smooth(ctx, left, closed=False)
    if fork:
        notch = P(0.8 - fork * 0.08, 0.2)
        t2 = P(0.93, 0.6)
        ctx.line_to(tipL[0] - nx * wd * 0.1, tipL[1] - ny * wd * 0.1)
        ctx.line_to(*notch)
        ctx.line_to(t2[0] + dx * ln * 0.05, t2[1] + dy * ln * 0.05)
    else:
        ctx.line_to(*tipL)
    ctx.line_to(*right[0])
    x0, y0 = right[0]
    for k in range(len(right) - 1):  # smooth back along the right edge
        p0 = right[max(0, k - 1)]
        p1, p2 = right[k], right[k + 1]
        p3 = right[min(len(right) - 1, k + 2)]
        c1 = (p1[0] + (p2[0] - p0[0]) * 0.22, p1[1] + (p2[1] - p0[1]) * 0.22)
        c2 = (p2[0] - (p3[0] - p1[0]) * 0.22, p2[1] - (p3[1] - p1[1]) * 0.22)
        ctx.curve_to(c1[0], c1[1], c2[0], c2[1], p2[0], p2[1])
    ctx.close_path()
    return P


def _clump(ctx, bx, by, ang, ln, wd, bend, fork=0, tone=0, lw=5.5, shade_side=1):
    """Cel-shaded clump: base fill, shadow band on one side, light band, shine streak, inner strand lines, outline."""
    base = (H_SHADOW, H_BASE, H_LIGHT)[tone]
    P = _clump_path(ctx, bx, by, ang, ln, wd, bend, fork)
    _c(ctx, base)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    # shadow band along one edge + darker root
    s = shade_side
    ctx.move_to(*P(0, s * 1.2))
    for u in (0.25, 0.5, 0.75, 1.0):
        ctx.line_to(*P(u, s * 0.25))
    for u in (1.0, 0.75, 0.5, 0.25, 0.0):
        ctx.line_to(*P(u, s * 1.3))
    ctx.close_path()
    _c(ctx, H_SHADOW if tone else H_DEEP, 0.9)
    ctx.fill()
    g = cairo.LinearGradient(*P(0, 0), *P(0.35, 0))
    g.add_color_stop_rgba(0, H_DEEP[0], H_DEEP[1], H_DEEP[2], 0.75)
    g.add_color_stop_rgba(1, H_DEEP[0], H_DEEP[1], H_DEEP[2], 0)
    ctx.set_source(g)
    ctx.paint()
    # light band on the other side
    ctx.move_to(*P(0.15, -s * 0.15))
    for u in (0.35, 0.6, 0.85):
        ctx.line_to(*P(u, -s * (0.05 + 0.1 * u)))
    for u in (0.85, 0.6, 0.35, 0.15):
        ctx.line_to(*P(u, -s * 0.75))
    ctx.close_path()
    _c(ctx, H_LIGHT if tone < 2 else H_SHINE, 0.85)
    ctx.fill()
    # shine streak
    ctx.move_to(*P(0.22, -s * 0.45))
    a, b = P(0.4, -s * 0.5), P(0.55, -s * 0.42)
    ctx.curve_to(a[0], a[1], a[0], a[1], b[0], b[1])
    _c(ctx, H_SHINE, 0.95)
    ctx.set_line_width(max(2.5, wd * 0.09))
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.stroke()
    ctx.restore()
    # inner strand lines
    for v, u1 in ((-0.35, 0.82), (0.1, 0.92), (0.5, 0.7)):
        a, b, c_ = P(0.12, v), P(0.5, v * 0.7), P(u1, v * 0.35)
        ctx.move_to(*a)
        ctx.curve_to(b[0], b[1], b[0], b[1], c_[0], c_[1])
    _c(ctx, H_DEEP, 0.7)
    ctx.set_line_width(2.2)
    ctx.stroke()
    _clump_path(ctx, bx, by, ang, ln, wd, bend, fork)
    _c(ctx, OUT)
    ctx.set_line_width(lw)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()


# back silhouette: (angle deg from up, length, width, bend, fork)
HAIR_BACK = [(-118, 120, 62, 26, 0), (-100, 160, 70, -30, 1), (-82, 190, 72, 34, 0), (-64, 175, 70, -28, 1),
             (-46, 215, 74, 30, 0), (-28, 185, 70, -36, 1), (-10, 235, 76, 28, 0), (8, 200, 72, -30, 1),
             (26, 245, 76, 40, 0), (44, 195, 72, -34, 1), (62, 215, 72, 30, 0), (80, 170, 68, -28, 1),
             (98, 175, 66, 34, 0), (116, 120, 60, -24, 1)]
# top layer: clumps flowing from the crown whorl over the skull towards the hairline
HAIR_TOP = [(-185, -780, -1.75, 120, 62, -40, 1), (-140, -835, -2.15, 130, 66, -34, 0), (-80, -870, -2.55, 120, 64, -30, 1),
            (-15, -885, -2.95, 110, 62, -26, 0), (50, -882, 2.85, 115, 62, 28, 1), (115, -860, 2.45, 125, 66, 32, 0),
            (170, -820, 2.05, 120, 62, 36, 1), (210, -760, 1.7, 105, 56, 34, 0)]
# spiky clumps standing up on the crown
HAIR_SPIKES = [(-60, -880, -0.45, 95, 40, -18, 1), (20, -900, 0.05, 105, 42, 16, 0), (95, -880, 0.55, 95, 40, 20, 1)]
FRINGE = [  # (base x, base y, angle rad (0=up, pi=down), length, width, bend, fork)
    (-200, -735, 2.80, 130, 50, -45, 0), (-140, -760, 3.00, 160, 56, 40, 1), (-75, -770, 3.30, 145, 54, -38, 0),
    (-10, -775, 2.95, 170, 58, 50, 1), (55, -770, 3.40, 150, 54, -45, 0), (120, -760, 3.10, 165, 56, 38, 1),
    (180, -740, 3.55, 125, 50, -40, 0), (220, -705, 3.80, 95, 42, 30, 1),
]


def _hair_back(ctx, t, sway):
    _ellipse(ctx, 0, -665, 245, 235)
    _c(ctx, H_DEEP)
    ctx.fill()
    for i, (ang, ln, wd, bend, fork) in enumerate(HAIR_BACK):
        a = math.radians(ang + sway * (1 + i % 3) + 2.0 * math.sin(t * 1.2 + i * 0.7))
        bx, by = 195 * math.sin(a), -665 - 195 * math.cos(a)
        _clump(ctx, bx, by, a, ln * 0.62, wd, bend * 0.5 + 4 * math.sin(t * 1.5 + i), fork, 0,
               shade_side=1 if ang < 0 else -1)


def _hair_front(ctx, t, sway):
    # skull cover under the top clumps (no flat helmet visible: clumps sit on it edge to edge)
    _smooth(ctx, [(-236, -650), (-234, -748), (-180, -835), (-90, -878), (10, -890), (110, -872), (190, -820),
                  (234, -740), (238, -660), (190, -712), (120, -742), (40, -755), (-50, -752), (-140, -738),
                  (-200, -706)], closed=True)
    _c(ctx, H_SHADOW)
    ctx.fill()
    for i, (bx, by, ang, ln, wd, bend, fork) in enumerate(HAIR_TOP):
        _clump(ctx, bx, by, ang + 0.03 * math.sin(t * 1.1 + i), ln, wd, bend + sway * 5, fork, 1,
               shade_side=-1 if bx < 0 else 1)
    for i, (bx, by, ang, ln, wd, bend, fork) in enumerate(FRINGE):
        b = bend + sway * 8 + 5 * math.sin(t * 1.6 + i * 1.1)
        _clump(ctx, bx, by, ang + 0.03 * math.sin(t + i), ln, wd, b, fork, 2 if i % 2 else 1,
               shade_side=1 if i % 2 else -1)
    for i, (bx, by, ang, ln, wd, bend, fork) in enumerate(HAIR_SPIKES):
        _clump(ctx, bx, by, ang + 0.06 * math.sin(t * 1.4 + i), ln, wd, bend, fork, 2, shade_side=-1 if ang < 0 else 1)
    # a few loose strays
    for (x0, y0, dx, dy) in ((-60, -890, -55, -50), (90, -880, 70, -40), (205, -790, 60, -20), (-210, -770, -55, -15)):
        ctx.move_to(x0, y0)
        ctx.curve_to(x0 + dx * 0.3, y0 + dy * 0.6, x0 + dx * 0.8, y0 + dy * 0.8, x0 + dx + 4 * math.sin(t * 2), y0 + dy)
        _c(ctx, OUT)
        ctx.set_line_width(3.5)
        ctx.stroke()


def _ears(ctx):
    for sx in (-1, 1):
        _ellipse(ctx, sx * 222, -610, 40, 62)
        _fill_stroke(ctx, SKIN, 6)
        _ellipse(ctx, sx * 226, -610, 18, 34)
        _c(ctx, SKIN_SH)
        ctx.fill()
        ctx.move_to(sx * 236, -650)
        ctx.curve_to(sx * 252, -630, sx * 250, -590, sx * 232, -575)
        _c(ctx, OUT)
        ctx.set_line_width(4)
        ctx.stroke()


def _crystal(ctx, x, y, w, h, ang=0.0):
    """Faceted drop crystal hanging from (x,y): table on top, pavilion to a point, facets, glints."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    top, girdle, tip = (0, 0), h * 0.32, h
    L, R = (-w / 2, girdle), (w / 2, girdle)
    crown = [(-w * 0.28, 0), (w * 0.28, 0), R, (0, tip), L]
    ctx.move_to(*crown[0])
    for pt in crown[1:]:
        ctx.line_to(*pt)
    ctx.close_path()
    g = cairo.LinearGradient(-w / 2, 0, w / 2, tip)
    g.add_color_stop_rgb(0, 0.88, 0.97, 1.0)
    g.add_color_stop_rgb(0.45, 0.55, 0.80, 0.98)
    g.add_color_stop_rgb(1, 0.30, 0.52, 0.86)
    ctx.set_source(g)
    ctx.fill_preserve()
    _c(ctx, OUT)
    ctx.set_line_width(2.6)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()
    # facets: girdle line and lines to the point / table
    for a, b in ((L, R), ((-w * 0.28, 0), (-w * 0.12, girdle)), ((w * 0.28, 0), (w * 0.12, girdle)),
                 ((-w * 0.12, girdle), (0, tip)), ((w * 0.12, girdle), (0, tip)), (L, (0, tip * 0.7)),
                 (R, (0, tip * 0.7))):
        ctx.move_to(*a)
        ctx.line_to(*b)
    _c(ctx, (0.18, 0.32, 0.55), 0.7)
    ctx.set_line_width(1.3)
    ctx.stroke()
    # bright facets
    ctx.move_to(-w * 0.28, 0)
    ctx.line_to(-w * 0.12, girdle)
    ctx.line_to(L[0], L[1])
    ctx.close_path()
    _c(ctx, (1, 1, 1), 0.75)
    ctx.fill()
    ctx.move_to(w * 0.12, girdle)
    ctx.line_to(0, tip)
    ctx.line_to(0, tip * 0.7)
    ctx.close_path()
    _c(ctx, (0.85, 0.95, 1.0), 0.6)
    ctx.fill()
    ctx.restore()


def _sparkle(ctx, x, y, r, a=1.0):
    ctx.move_to(x, y - r)
    ctx.curve_to(x + r * 0.12, y - r * 0.12, x + r * 0.12, y - r * 0.12, x + r, y)
    ctx.curve_to(x + r * 0.12, y + r * 0.12, x + r * 0.12, y + r * 0.12, x, y + r)
    ctx.curve_to(x - r * 0.12, y + r * 0.12, x - r * 0.12, y + r * 0.12, x - r, y)
    ctx.curve_to(x - r * 0.12, y - r * 0.12, x - r * 0.12, y - r * 0.12, x, y - r)
    ctx.close_path()
    _c(ctx, (1, 1, 1), a)
    ctx.fill()


def _drop(ctx, x, y, w, h, ang=0.0):
    """Teardrop crystal hanging from (x,y): pointed top, round bottom, faceted, with highlights."""
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    r = w / 2
    cy = h - r

    def outline():
        ctx.move_to(0, 0)
        ctx.curve_to(r * 0.35, h * 0.25, r, cy - r * 0.6, r, cy)
        ctx.arc(0, cy, r, 0, math.pi)
        ctx.curve_to(-r, cy - r * 0.6, -r * 0.35, h * 0.25, 0, 0)
        ctx.close_path()
    outline()
    g = cairo.RadialGradient(-r * 0.35, cy - r * 0.4, 1, 0, cy, r * 1.4)
    g.add_color_stop_rgb(0, 0.92, 0.98, 1.0)
    g.add_color_stop_rgb(0.5, 0.58, 0.82, 0.99)
    g.add_color_stop_rgb(1, 0.28, 0.50, 0.85)
    ctx.set_source(g)
    ctx.fill_preserve()
    ctx.save()
    ctx.clip()
    # facets: lines from the tip and a ring of facets around the bottom
    for k in (-0.6, -0.2, 0.2, 0.6):
        ctx.move_to(0, 2)
        ctx.line_to(k * r, cy + r * 0.2)
    ctx.arc(0, cy, r * 0.55, 0.15 * math.pi, 0.85 * math.pi)
    for k in range(5):
        a = (0.15 + 0.175 * k) * math.pi
        ctx.move_to(r * 0.55 * math.cos(a), cy + r * 0.55 * math.sin(a))
        ctx.line_to(r * math.cos(a), cy + r * math.sin(a))
    _c(ctx, (0.20, 0.36, 0.62), 0.55)
    ctx.set_line_width(1.2)
    ctx.stroke()
    # bright facet on the left and a soft reflection on the right
    ctx.move_to(0, 2)
    ctx.line_to(-r * 0.2, cy + r * 0.2)
    ctx.line_to(-r * 0.95, cy - r * 0.1)
    ctx.close_path()
    _c(ctx, (1, 1, 1), 0.7)
    ctx.fill()
    _ellipse(ctx, r * 0.4, cy + r * 0.35, r * 0.18, r * 0.32)
    _c(ctx, (0.85, 0.95, 1.0), 0.6)
    ctx.fill()
    ctx.restore()
    outline()
    _c(ctx, OUT)
    ctx.set_line_width(2.4)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.stroke()
    ctx.restore()


def _earrings(ctx, t):
    """A teardrop crystal hanging straight from each earlobe, swinging slightly, with a twinkle."""
    for sx in (-1, 1):
        lx, ly = sx * 238, -560
        swing = 0.14 * math.sin(t * 2.3 + sx)
        _drop(ctx, lx, ly, 22, 40, -swing)
        tw = 0.5 + 0.5 * math.sin(t * 3.1 + sx * 1.7)
        _sparkle(ctx, lx - 5 + 30 * swing, ly + 24, 4 + 5 * tw, 0.55 + 0.45 * tw)


FACE = [(-218, -700), (-222, -600), (-200, -510), (-140, -440), (-60, -405), (0, -400), (60, -405),
        (140, -440), (200, -510), (222, -600), (218, -700), (150, -770), (0, -790), (-150, -770)]


def _face_shape(ctx):
    _smooth(ctx, FACE)
    _fill_stroke(ctx, SKIN, 7)
    ctx.save()
    _smooth(ctx, FACE)
    ctx.clip()
    _smooth(ctx, [(120, -800), (240, -700), (240, -480), (150, -400), (60, -390), (150, -470), (190, -560),
                  (185, -680)])
    _c(ctx, SKIN_SH, 0.45)
    ctx.fill()
    ctx.restore()
    _smooth(ctx, FACE)
    _c(ctx, OUT)
    ctx.set_line_width(7)
    ctx.stroke()
    # cheek blush
    for sx in (-1, 1):
        g = cairo.RadialGradient(sx * 135, -520, 5, sx * 135, -520, 70)
        g.add_color_stop_rgba(0, 0.95, 0.55, 0.5, 0.35)
        g.add_color_stop_rgba(1, 0.95, 0.55, 0.5, 0)
        ctx.set_source(g)
        ctx.arc(sx * 135, -520, 70, 0, 2 * math.pi)
        ctx.fill()
    for (fx, fy) in ((-120, -540), (-100, -528), (-138, -522), (-110, -508), (112, -540), (132, -526), (100, -522),
                     (124, -508), (-30, -548), (34, -550)):
        ctx.arc(fx, fy, 3.6, 0, 2 * math.pi)
        _c(ctx, (0.78, 0.50, 0.38), 0.55)
        ctx.fill()


EMO = {
    #          lid  brow_raise brow_tilt  mouth    pupil
    "neutral": (0.42, 0.0, 0.0, "flat", 1.0),
    "doubt": (0.50, 0.0, 0.25, "side", 1.0),
    "smirk": (0.45, 0.1, 0.1, "smirk", 1.0),
    "wow": (0.0, 1.0, 0.0, "o", 0.8),
    "sad": (0.30, 0.5, -0.45, "down", 1.0),
    "happy": (0.30, 0.5, 0.0, "smile", 1.0),
    "angry": (0.40, -0.4, 0.5, "down", 0.9),
}


def _eyes(ctx, emo, t, look, blink_override):
    lid, braise, btilt, _, pup = EMO.get(emo, EMO["neutral"])
    blink = blink_override
    if blink is None:
        ph = t % 4.1
        blink = max(0.0, 1 - abs(ph - 0.08) / 0.08) if ph < 0.16 else 0.0
    for sx in (-1, 1):
        ex, ey = sx * 92, -610
        rx, ry = 62, 56 if emo != "wow" else 64
        # eye white
        _ellipse(ctx, ex, ey, rx, ry)
        _c(ctx, (1, 1, 1))
        ctx.fill_preserve()
        ctx.save()
        ctx.clip()
        px = ex + look * 20 + sx * 2
        py = ey + 6
        g = cairo.RadialGradient(px, py - 8, 4, px, py, 32 * pup)
        g.add_color_stop_rgb(0, 0.55, 0.78, 0.90)
        g.add_color_stop_rgb(0.7, IRIS[0], IRIS[1], IRIS[2])
        g.add_color_stop_rgb(1, 0.16, 0.30, 0.42)
        _ellipse(ctx, px, py, 30 * pup, 32 * pup)
        ctx.set_source(g)
        ctx.fill()
        for k in range(12):
            a = k * math.pi / 6
            ctx.move_to(px + 17 * pup * math.cos(a), py + 18 * pup * math.sin(a))
            ctx.line_to(px + 27 * pup * math.cos(a), py + 29 * pup * math.sin(a))
        _c(ctx, (0.20, 0.38, 0.52), 0.5)
        ctx.set_line_width(2)
        ctx.stroke()
        _ellipse(ctx, px, py, 30 * pup, 32 * pup)
        _c(ctx, (0.10, 0.18, 0.26))
        ctx.set_line_width(3)
        ctx.stroke()
        _ellipse(ctx, px, py, 15 * pup, 16 * pup)
        _c(ctx, (0.06, 0.07, 0.09))
        ctx.fill()
        _ellipse(ctx, px + 10, py - 12, 8, 8)
        _c(ctx, (1, 1, 1))
        ctx.fill()
        _ellipse(ctx, px - 9, py + 10, 3.5, 3.5)
        _c(ctx, (1, 1, 1), 0.85)
        ctx.fill()
        # upper lid (heavy, sleepy-skeptical look) + blink
        cover = min(1.0, lid + blink * (1 - lid))
        if cover > 0:
            ly = ey - ry + 2 * ry * cover
            ctx.rectangle(ex - rx - 5, ey - ry - 5, 2 * rx + 10, ly - (ey - ry) + 5)
            _c(ctx, SKIN_SH)
            ctx.fill()
        ctx.restore()
        _ellipse(ctx, ex, ey, rx, ry)
        _c(ctx, OUT)
        ctx.set_line_width(6)
        ctx.stroke()
        cover = min(1.0, lid + blink * (1 - lid))
        if cover > 0.02:
            ly = ey - ry + 2 * ry * cover
            half = rx * math.sqrt(max(0.0, 1 - ((ly - ey) / ry) ** 2))
            ctx.move_to(ex - half - 4, ly)
            ctx.line_to(ex + half + 4, ly)
            ctx.set_line_width(7)
            ctx.stroke()
        # lashes at the outer corner
        if cover < 0.95:
            ly = ey - ry + 2 * ry * cover
            ox = ex + sx * rx * 0.92
            for k in range(3):
                ctx.move_to(ox - sx * k * 9, ly + 4 + k * 2)
                ctx.line_to(ox + sx * (14 - k * 3), ly - 10 - k * 5)
            _c(ctx, OUT)
            ctx.set_line_width(4)
            ctx.stroke()
        # lower lid
        ctx.move_to(ex - rx * 0.7, ey + ry * 0.86)
        ctx.curve_to(ex - rx * 0.3, ey + ry * 1.02, ex + rx * 0.3, ey + ry * 1.02, ex + rx * 0.7, ey + ry * 0.86)
        _c(ctx, (0.75, 0.52, 0.42))
        ctx.set_line_width(3)
        ctx.stroke()
        # tired lower line
        ctx.move_to(ex - 40, ey + ry + 14)
        ctx.curve_to(ex - 15, ey + ry + 24, ex + 15, ey + ry + 24, ex + 40, ey + ry + 14)
        _c(ctx, SKIN_SH)
        ctx.set_line_width(5)
        ctx.stroke()
        # brows
        by = ey - ry - 28 - braise * 26
        inner = -btilt * 22  # positive tilt: inner end lower (frown)
        ctx.move_to(ex - sx * 55, by + 6)
        ctx.curve_to(ex - sx * 20, by - 10, ex + sx * 20, by - 8 - inner * 0.3, ex + sx * -60 + sx * 120, by - inner)
        ctx.new_path()
        x_out, x_in = ex + sx * 58, ex - sx * 52
        ctx.move_to(x_out, by + 8)
        ctx.curve_to(ex + sx * 20, by - 8, ex - sx * 10, by - 6, x_in, by + 4 - inner)
        _c(ctx, (0.62, 0.48, 0.22))
        ctx.set_line_width(14)
        ctx.stroke()
        for k in range(7):  # individual brow hairs
            u = k / 6
            hx = x_out + (x_in - x_out) * u
            hy = by + 8 - 12 * math.sin(u * math.pi) + (4 - inner) * u
            ctx.move_to(hx - sx * 6, hy + 6)
            ctx.line_to(hx + sx * 8, hy - 8)
        _c(ctx, (0.45, 0.33, 0.12), 0.8)
        ctx.set_line_width(2.5)
        ctx.stroke()


def _nose_mouth(ctx, emo, level):
    # nose
    ctx.move_to(-6, -575)
    ctx.curve_to(-16, -540, -22, -515, -4, -505)
    ctx.curve_to(8, -500, 20, -506, 22, -514)
    _c(ctx, OUT)
    ctx.set_line_width(5)
    ctx.stroke()
    _ellipse(ctx, 2, -540, 6, 12)
    _c(ctx, SKIN_HI, 0.9)
    ctx.fill()
    mouth = EMO.get(emo, EMO["neutral"])[3]
    mx, my = 4, -458
    if level > 0.08:
        h = 10 + 46 * min(1.0, level)
        w = 46 + 10 * min(1.0, level)
        ctx.move_to(mx - w, my)
        ctx.curve_to(mx - w * 0.6, my - 6, mx + w * 0.6, my - 6, mx + w, my)
        ctx.curve_to(mx + w * 0.7, my + h, mx - w * 0.7, my + h, mx - w, my)
        ctx.close_path()
        _c(ctx, (0.35, 0.10, 0.12))
        ctx.fill_preserve()
        ctx.save()
        ctx.clip()
        _ellipse(ctx, mx, my + h * 0.95, w * 0.5, h * 0.45)
        _c(ctx, (0.85, 0.40, 0.42))
        ctx.fill()
        ctx.rectangle(mx - w, my - 4, 2 * w, 9)
        _c(ctx, (1, 1, 1))
        ctx.fill()
        ctx.restore()
        ctx.move_to(mx - w, my)
        ctx.curve_to(mx - w * 0.6, my - 6, mx + w * 0.6, my - 6, mx + w, my)
        ctx.curve_to(mx + w * 0.7, my + h, mx - w * 0.7, my + h, mx - w, my)
        ctx.close_path()
        _c(ctx, OUT)
        ctx.set_line_width(6)
        ctx.stroke()
        return
    ctx.move_to(mx - 18, my + 22)
    ctx.curve_to(mx - 6, my + 30, mx + 8, my + 30, mx + 20, my + 22)
    _c(ctx, SKIN_SH)
    ctx.set_line_width(4)
    ctx.stroke()
    _c(ctx, OUT)
    ctx.set_line_width(7)
    if mouth == "flat":
        ctx.move_to(mx - 44, my + 2)
        ctx.curve_to(mx - 15, my + 8, mx + 15, my + 6, mx + 44, my - 2)
    elif mouth == "side":
        ctx.move_to(mx - 40, my + 6)
        ctx.curve_to(mx - 10, my + 6, mx + 20, my - 2, mx + 46, my - 10)
    elif mouth == "smirk":
        ctx.move_to(mx - 42, my + 2)
        ctx.curve_to(mx - 10, my + 10, mx + 26, my + 4, mx + 48, my - 16)
    elif mouth == "smile":
        ctx.move_to(mx - 50, my - 10)
        ctx.curve_to(mx - 25, my + 26, mx + 25, my + 26, mx + 50, my - 10)
    elif mouth == "down":
        ctx.move_to(mx - 42, my + 12)
        ctx.curve_to(mx - 15, my - 8, mx + 15, my - 8, mx + 42, my + 12)
    elif mouth == "o":
        _ellipse(ctx, mx, my + 6, 22, 28)
        _c(ctx, (0.35, 0.10, 0.12))
        ctx.fill_preserve()
        _c(ctx, OUT)
    ctx.stroke()


# ----------------------------------------------------------------- arms and hands
def _sleeve(ctx, pts, w=138, fill=None):
    """Thick hoodie sleeve along a polyline: outline, body, top highlight, elbow creases, ribbed cuff."""
    ctx.new_path()
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    _c(ctx, OUT)
    ctx.set_line_width(w + 2 * LW)
    ctx.stroke_preserve()
    _c(ctx, fill or HOOD_HI)
    ctx.set_line_width(w)
    ctx.stroke_preserve()
    # soft highlight along the upper side of the fabric
    ctx.save()
    ctx.translate(-w * 0.12, -w * 0.16)
    _c(ctx, (1, 1, 1), 0.07)
    ctx.set_line_width(w * 0.35)
    ctx.stroke()
    ctx.restore()
    ctx.new_path()
    # creases at each bend (elbow)
    for i in range(1, len(pts) - 1):
        (x0, y0), (x1, y1), (x2, y2) = pts[i - 1], pts[i], pts[i + 1]
        a1 = math.atan2(y1 - y0, x1 - x0)
        a2 = math.atan2(y2 - y1, x2 - x1)
        bis = (a1 + a2) / 2 + math.pi / 2
        for k, off in enumerate((-0.18, 0.0, 0.18)):
            cx = x1 + math.cos(a1) * off * w
            cy = y1 + math.sin(a1) * off * w
            ctx.move_to(cx + math.cos(bis) * w * 0.38, cy + math.sin(bis) * w * 0.38)
            ctx.curve_to(cx + math.cos(bis) * w * 0.1 + 6, cy + math.sin(bis) * w * 0.1,
                         cx - math.cos(bis) * w * 0.05, cy - math.sin(bis) * w * 0.05,
                         cx - math.cos(bis) * w * (0.2 + 0.08 * k), cy - math.sin(bis) * w * (0.2 + 0.08 * k))
        _c(ctx, HOOD_SH, 0.9)
        ctx.set_line_width(5)
        ctx.stroke()
    # ribbed cuff
    x, y = pts[-1]
    px, py = pts[-2]
    a = math.atan2(y - py, x - px)
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(a)
    rrect_ = (-34, -w / 2 + 2, 38, w - 4)
    ctx.new_path()
    r = 10
    x0, y0, cw, ch = rrect_
    ctx.arc(x0 + cw - r, y0 + r, r, -math.pi / 2, 0)
    ctx.arc(x0 + cw - r, y0 + ch - r, r, 0, math.pi / 2)
    ctx.arc(x0 + r, y0 + ch - r, r, math.pi / 2, math.pi)
    ctx.arc(x0 + r, y0 + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()
    _fill_stroke(ctx, HOOD_SH, 6)
    for k in range(1, 6):
        yy = y0 + ch * k / 6
        ctx.move_to(x0 + 6, yy)
        ctx.line_to(x0 + cw - 6, yy)
    _c(ctx, (0.05, 0.05, 0.07), 0.6)
    ctx.set_line_width(3)
    ctx.stroke()
    ctx.restore()


# finger specs: (base y on the palm edge, segment lengths, width)
FINGERS = [(-27, (27, 19, 15), 25), (-8, (30, 21, 16), 26), (11, (28, 19, 15), 25), (27, (22, 16, 13), 22)]
HAND_POSES = {
    #          spread per finger            (curl1, curl2) per finger                     thumb (angle, curl, front)
    "open":   ((-0.22, -0.07, 0.07, 0.22), ((0.05, 0.05), (0.04, 0.04), (0.06, 0.06), (0.1, 0.1)), (-0.85, 0.15, False)),
    "relax":  ((-0.12, -0.04, 0.04, 0.12), ((0.35, 0.35), (0.40, 0.40), (0.50, 0.45), (0.6, 0.5)), (-0.9, 0.3, False)),
    "fist":   ((-0.05, 0.0, 0.03, 0.08), ((1.6, 1.7), (1.6, 1.7), (1.6, 1.7), (1.6, 1.6)), (0.15, 1.0, True)),
    "point":  ((-0.04, 0.0, 0.03, 0.08), ((0.0, 0.0), (1.6, 1.7), (1.6, 1.7), (1.6, 1.6)), (0.25, 0.9, True)),
    "chin":   ((-0.05, 0.0, 0.05, 0.10), ((1.25, 1.1), (1.3, 1.1), (1.35, 1.15), (1.4, 1.2)), (-0.55, 0.1, False)),
    "flat":   ((-0.10, -0.03, 0.03, 0.10), ((0.08, 0.08), (0.06, 0.06), (0.08, 0.08), (0.1, 0.1)), (-0.95, 0.2, False)),
}


def _capsule_chain(ctx, pts, w, lw=5):
    ctx.new_path()
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    _c(ctx, OUT)
    ctx.set_line_width(w + 2 * lw)
    ctx.stroke_preserve()
    _c(ctx, SKIN)
    ctx.set_line_width(w)
    ctx.stroke_preserve()
    # shade along the lower edge
    ctx.save()
    ctx.translate(0, w * 0.18)
    _c(ctx, SKIN_SH, 0.55)
    ctx.set_line_width(w * 0.38)
    ctx.stroke()
    ctx.restore()
    ctx.new_path()


def _finger_pts(bx, by, ang, segs, c1, c2):
    pts = [(bx, by)]
    a = ang
    for k, ln in enumerate(segs):
        a += (0 if k == 0 else (c1 if k == 1 else c2)) if k else c1 * 0.6
        x, y = pts[-1]
        pts.append((x + ln * math.cos(a), y + ln * math.sin(a)))
    return pts


def _nail(ctx, pts, w):
    (x0, y0), (x1, y1) = pts[-2], pts[-1]
    a = math.atan2(y1 - y0, x1 - x0)
    ctx.save()
    ctx.translate(x1 - math.cos(a) * w * 0.25, y1 - math.sin(a) * w * 0.25)
    ctx.rotate(a)
    _ellipse(ctx, 0, -w * 0.1, w * 0.32, w * 0.24)
    _c(ctx, (1.0, 0.90, 0.86))
    ctx.fill_preserve()
    _c(ctx, SKIN_SH)
    ctx.set_line_width(2.5)
    ctx.stroke()
    ctx.restore()


def _knuckle_marks(ctx, pts, w):
    for (x, y) in pts[1:-1]:
        ctx.move_to(x - w * 0.18, y - w * 0.22)
        ctx.curve_to(x - w * 0.05, y - w * 0.1, x + w * 0.05, y - w * 0.1, x + w * 0.18, y - w * 0.22)
    _c(ctx, SKIN_SH)
    ctx.set_line_width(2.5)
    ctx.stroke()


def _hand(ctx, x, y, ang, kind="open", s=1.0, flip=1):
    """Detailed cartoon hand. Wrist at (x,y), fingers pointing along angle `ang`; flip=-1 mirrors (other hand)."""
    spread, curls, (t_ang, t_curl, t_front) = HAND_POSES.get(kind, HAND_POSES["open"])
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s * flip)
    palm = [(-4, -30), (30, -42), (62, -40), (78, -16), (79, 14), (68, 38), (36, 46), (4, 36), (-10, 4)]
    fingers = []
    for (fy, segs, w), sp, (c1, c2) in zip(FINGERS, spread, curls):
        if c1 >= 0.9:  # folded finger: knuckle out front, tip tucked back onto the palm
            fingers.append(([(60, fy * 0.95), (84, fy * 0.95 + 2), (70, fy * 0.95 + 12)], w + 2, c1))
        else:
            fingers.append((_finger_pts(68, fy, sp, segs, c1, c2), w, c1))
    if t_front:  # thumb lying across the folded fingers
        thumb = [(26, -30), (50, -22), (74, -16)]
    else:
        thumb = [(30, -30)]
        a = t_ang
        for k, ln in enumerate((30, 24)):
            a += t_curl * (0.5 if k else 0.2)
            px_, py_ = thumb[-1]
            thumb.append((px_ + ln * math.cos(a), py_ + ln * math.sin(a)))
    # fingers that stay in front of the palm only when strongly curled
    back = [f for f in fingers if f[2] < 0.9]
    front = [f for f in fingers if f[2] >= 0.9]
    for pts, w, _ in reversed(back):
        _capsule_chain(ctx, pts, w)
        _knuckle_marks(ctx, pts, w)
        _nail(ctx, pts, w)
    if not t_front:
        _capsule_chain(ctx, thumb, 28)
        _nail(ctx, thumb, 28)
    _smooth(ctx, palm)
    _fill_stroke(ctx, SKIN, 6)
    # palm creases and heel shading
    ctx.move_to(14, -18)
    ctx.curve_to(30, -6, 48, -8, 62, -22)
    ctx.move_to(10, 10)
    ctx.curve_to(30, 18, 52, 16, 66, 6)
    _c(ctx, SKIN_SH)
    ctx.set_line_width(3)
    ctx.stroke()
    _ellipse(ctx, 8, 14, 16, 22)
    _c(ctx, SKIN_SH, 0.35)
    ctx.fill()
    for pts, w, _ in front:
        _capsule_chain(ctx, pts, w)
    if front:  # knuckle bumps of the curled fingers
        for pts, w, _ in front:
            x1, y1 = pts[1]
            ctx.arc(x1, y1, w * 0.18, 0, 2 * math.pi)
            _c(ctx, SKIN_HI, 0.8)
            ctx.fill()
    if t_front:
        _capsule_chain(ctx, thumb, 28)
        _nail(ctx, thumb, 28)
    ctx.restore()


def _arm(ctx, pts, kind, s=1.5, flip=1, dang=0.0, w=138, fill=None):
    """Sleeve along pts, then the hand coming straight out of the cuff along the forearm."""
    _sleeve(ctx, pts, w, fill)
    (x0, y0), (x1, y1) = pts[-2], pts[-1]
    a = math.atan2(y1 - y0, x1 - x0)
    _hand(ctx, x1 - math.cos(a) * 6, y1 - math.sin(a) * 6, a + dang, kind, s, flip)


def _arms(ctx, pose, t, front):
    """Arms over the torso for each pose; hands are attached to the cuffs automatically."""
    w = math.sin(t * 2.0) * 6
    if pose in ("idle", "explain_low"):
        return
    if pose == "think":
        _arm(ctx, [(-330, -260), (-260, -80), (-120, -240), (-75, -365)], "chin", 1.67, -1, 0.15)
    elif pose == "cross":
        _arm(ctx, [(-345, -265), (-300, -110), (150, -200)], "fist", 1.49, 1, 0.0, 140, (0.22, 0.235, 0.28))
        _sleeve(ctx, [(345, -265), (300, -80), (-140, -150)], 140)
        for fx in (40, 120):
            ctx.move_to(fx, -150 + (fx - 40) * 0.12)
            ctx.curve_to(fx + 10, -125, fx + 5, -105, fx - 8, -92)
            _c(ctx, HOOD_SH)
            ctx.set_line_width(5)
            ctx.stroke()
        _hand(ctx, -150, -152, math.atan2(-70, -440), "fist", 1.49, -1)
    elif pose == "explain":
        _arm(ctx, [(330, -260), (300, -60), (420, -230 + w)], "open", 1.72, -1, -0.15)
    elif pose == "shrug":
        _arm(ctx, [(-330, -260), (-330, -90), (-470, -210 + w)], "open", 1.67, 1, 0.25)
        _arm(ctx, [(330, -260), (330, -90), (470, -210 - w)], "open", 1.67, -1, -0.25)
    elif pose == "point":
        _arm(ctx, [(330, -260), (330, -100), (440, -370 + w)], "point", 1.72, -1, -0.1)
    elif pose == "facepalm":
        _arm(ctx, [(-330, -260), (-240, -80), (-110, -320), (-70, -470)], "flat", 1.95, -1, 0.05)


GESTURES = ["explain", "point", "shrug", "explain", "think", "cross", "explain", "point"]
TALK_EMOS = {"neutral": ["neutral", "smirk", "doubt", "smirk"], "smirk": ["smirk", "happy", "smirk", "doubt"],
             "doubt": ["doubt", "smirk", "doubt", "wow"], "sad": ["sad", "doubt", "sad", "angry"],
             "angry": ["angry", "angry", "wow", "angry"], "wow": ["wow", "smirk", "wow", "happy"],
             "happy": ["happy", "smirk", "happy", "wow"]}


def perform(t, level, pose="explain", emo="neutral", seed=0, hold=2.6):
    """Make the narrator act while talking: change gesture every ~hold seconds, shift expression,
    tilt and nod the head with speech. Returns a state dict for draw(). Use it for every talking shot."""
    k = int((t + seed * 1.37) / hold)
    talking = level > 0.08
    p = pose
    if talking and pose in ("idle", "explain"):
        p = GESTURES[(k + seed) % len(GESTURES)]
    emos = TALK_EMOS.get(emo, TALK_EMOS["neutral"])
    e = emos[(k + seed) % len(emos)] if talking else emo
    tilt = 0.05 * math.sin(t * 0.9 + seed) + (0.04 * math.sin(t * 3.1) * level)
    look = 0.35 * math.sin(t * 0.45 + seed)
    return {"pose": p, "emo": e, "t": t, "level": level, "look": look, "tilt": tilt}


def draw(ctx, cx, base_y, scale, state):
    t = state.get("t", 0.0)
    pose = state.get("pose", "idle")
    emo = state.get("emo", "neutral")
    level = state.get("level", 0.0)
    look = state.get("look", 0.0)
    breathe = math.sin(t * 1.6)
    sway = math.sin(t * 0.9) * 0.6 + state.get("tilt", 0.0) * 8
    ctx.save()
    ctx.translate(cx, base_y)
    ctx.scale(scale, scale)
    ctx.translate(0, -40 + 4 * breathe)
    _torso(ctx, breathe)
    _neck(ctx)
    # head group with small tilt and nod while talking
    nod = level * 6 * math.sin(t * 9)
    ctx.save()
    ctx.translate(0, -420)
    ctx.rotate(state.get("tilt", 0.0) + 0.015 * math.sin(t * 0.7))
    ctx.translate(0, 420 + nod)
    _hair_back(ctx, t, sway)
    _ears(ctx)
    _face_shape(ctx)
    _earrings(ctx, t)
    _eyes(ctx, emo, t, look, state.get("blink"))
    _nose_mouth(ctx, emo, level)
    _hair_front(ctx, t, sway)
    ctx.restore()
    _arms(ctx, pose, t, True)
    ctx.restore()


if __name__ == "__main__":
    import sys
    W, H = 1920, 1080
    poses = [("think", "doubt"), ("cross", "neutral"), ("explain", "smirk"), ("shrug", "sad"), ("point", "wow"),
             ("facepalm", "sad"), ("idle", "happy"), ("explain", "neutral")]
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    ctx.set_source_rgb(0.25, 0.05, 0.07)
    ctx.paint()
    for i, (p, e) in enumerate(poses):
        x = 120 + (i % 4) * 560 * 0.95 + 120
        y = 520 if i < 4 else 1080
        draw(ctx, 140 + (i % 4) * 480, y, 0.42, {"pose": p, "emo": e, "t": 1.0 + i, "level": 0.6 if i == 7 else 0.0})
    surf.write_to_png(sys.argv[1] if len(sys.argv) > 1 else "/tmp/char.png")
