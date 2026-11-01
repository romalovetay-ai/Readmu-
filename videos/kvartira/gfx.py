"""Drawing kit for the narrated explainer: backgrounds, kinetic text, cards, tables, charts, icons. pycairo, 1920x1080."""
import math
import random
import cairo

W, H = 1920, 1080
WHITE = (1, 1, 1)
RED = (1.0, 0.27, 0.27)
GREEN = (0.30, 0.95, 0.55)
GOLD = (1.0, 0.80, 0.25)
CYAN = (0.35, 0.85, 1.0)
GREY = (0.62, 0.62, 0.66)
DARK = (0.06, 0.06, 0.08)

F_BLACK = "Inter Display Black"
F_XB = "Inter Display ExtraBold"
F_SB = "Inter SemiBold"
F_MED = "Inter Medium"


def ease(x):
    x = max(0.0, min(1.0, x))
    return 1 - (1 - x) ** 3


def ease_back(x):
    x = max(0.0, min(1.0, x))
    c1, c3 = 1.70158, 2.70158
    return 1 + c3 * (x - 1) ** 3 + c1 * (x - 1) ** 2


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lerp(a, b, t):
    return a + (b - a) * t


def rgba(ctx, c, a=1.0):
    ctx.set_source_rgba(c[0], c[1], c[2], a)


def rrect(ctx, x, y, w, h, r):
    r = min(r, w / 2, h / 2)
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()


# ------------------------------------------------------------------ backgrounds
def bg_grid(ctx, t, tint=(0.45, 0.04, 0.07), lines=(1.0, 0.55, 0.6), alpha=0.22):
    """Dark radial backdrop with a slowly breathing, wavy grid (the channel's signature backdrop)."""
    g = cairo.RadialGradient(W / 2, H * 0.45, 50, W / 2, H * 0.45, W * 0.75)
    g.add_color_stop_rgb(0, *tint)
    g.add_color_stop_rgb(0.55, tint[0] * 0.45, tint[1] * 0.45, tint[2] * 0.45)
    g.add_color_stop_rgb(1, 0.02, 0.0, 0.01)
    ctx.set_source(g)
    ctx.paint()
    ctx.set_line_width(2.0)
    step = 120
    amp = 16

    def warp(x, y):
        return (x + amp * math.sin(y * 0.006 + t * 0.6) + 8 * math.sin(y * 0.017 - t * 0.9),
                y + amp * math.sin(x * 0.005 + t * 0.5) + 8 * math.cos(x * 0.013 + t * 0.7))

    for gx in range(-step, W + 2 * step, step):
        pts = [warp(gx, y) for y in range(-40, H + 60, 30)]
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
    for gy in range(-step, H + 2 * step, step):
        pts = [warp(x, gy) for x in range(-40, W + 60, 30)]
        ctx.move_to(*pts[0])
        for p in pts[1:]:
            ctx.line_to(*p)
    rgba(ctx, lines, alpha)
    ctx.stroke()
    vignette(ctx, 0.75)


def bg_topo(ctx, t, tint=(0.35, 0.02, 0.04)):
    """Topographic contour lines — used for the history chapter."""
    ctx.set_source_rgb(0.03, 0.0, 0.01)
    ctx.paint()
    ctx.set_line_width(2.2)
    for k in range(14):
        r0 = 80 + k * 70
        for cx, cy, ph in ((W * 0.25, H * 0.3, 0), (W * 0.8, H * 0.75, 2)):
            ctx.new_path()
            for i in range(0, 361, 6):
                a = math.radians(i)
                r = r0 + 28 * math.sin(3 * a + t * 0.4 + k * 0.5 + ph) + 14 * math.sin(5 * a - t * 0.3 + k)
                ctx.line_to(cx + r * math.cos(a) * 1.3, cy + r * math.sin(a))
            ctx.close_path()
            rgba(ctx, (0.9, 0.12, 0.18), 0.30 - k * 0.012)
            ctx.stroke()
    vignette(ctx, 0.8)


def bg_dark(ctx, t):
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgb(0, 0.05, 0.05, 0.07)
    g.add_color_stop_rgb(1, 0.01, 0.01, 0.02)
    ctx.set_source(g)
    ctx.paint()
    vignette(ctx, 0.6)


def vignette(ctx, k=0.7):
    g = cairo.RadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.72)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, k)
    ctx.set_source(g)
    ctx.paint()


def grain(ctx, t, k=0.05, seed=0):
    rnd = random.Random(int(t * 30) + seed)
    for _ in range(260):
        x, y = rnd.random() * W, rnd.random() * H
        rgba(ctx, WHITE, rnd.random() * k)
        ctx.rectangle(x, y, 2, 2)
        ctx.fill()


# ------------------------------------------------------------------ text
def text_size(ctx, s, size, face=F_XB):
    ctx.select_font_face(face)
    ctx.set_font_size(size)
    e = ctx.text_extents(s)
    return e.x_advance, e.height


def text(ctx, s, x, y, size, face=F_XB, color=WHITE, alpha=1.0, align="center", glow=0.0, shadow=True):
    """Single line; y is the baseline. Returns width."""
    ctx.select_font_face(face)
    ctx.set_font_size(size)
    e = ctx.text_extents(s)
    w = e.x_advance
    x0 = x - w / 2 if align == "center" else (x - w if align == "right" else x)
    if shadow:
        ctx.move_to(x0 + 3, y + 5)
        ctx.text_path(s)
        rgba(ctx, (0, 0, 0), 0.55 * alpha)
        ctx.fill()
    if glow > 0:
        for r, a in ((14, 0.10), (8, 0.16), (4, 0.22)):
            ctx.move_to(x0, y)
            ctx.text_path(s)
            ctx.set_line_width(r)
            ctx.set_line_join(cairo.LINE_JOIN_ROUND)
            rgba(ctx, color, a * glow * alpha)
            ctx.stroke()
    ctx.move_to(x0, y)
    ctx.text_path(s)
    rgba(ctx, color, alpha)
    ctx.fill()
    return w


def pop_text(ctx, s, x, y, size, age, face=F_XB, color=WHITE, glow=0.0, dur=0.35, out=None, align="center"):
    """Text that pops in (scale overshoot + fade); age = seconds since appearance; out = seconds until disappear."""
    if age < 0:
        return
    k = ease_back(age / dur)
    a = clamp(age / (dur * 0.6))
    if out is not None and out < 0.25:
        a *= clamp(out / 0.25)
    ctx.save()
    ctx.translate(x, y)
    sc = 0.6 + 0.4 * k
    ctx.scale(sc, sc)
    text(ctx, s, 0, 0, size, face, color, a, align, glow)
    ctx.restore()


def typed_lines(ctx, lines, x, y, size, age, face=F_SB, color=WHITE, lh=1.25, cps=40, align="center"):
    """Lines revealed character by character."""
    n = int(age * cps)
    for i, ln in enumerate(lines):
        if n <= 0:
            break
        part = ln[:n]
        n -= len(ln)
        text(ctx, part, x, y + i * size * lh, size, face, color, 1.0, align)


def word_reveal(ctx, words, x, y, size, times, now, face=F_XB, color=WHITE, hl=None, max_w=1500, lh=1.18):
    """Kinetic caption: words appear at their own times; hl maps word index -> colour. Wraps lines, centred."""
    ctx.select_font_face(face)
    ctx.set_font_size(size)
    space = ctx.text_extents(" ").x_advance
    widths = [ctx.text_extents(w).x_advance for w in words]
    lines, cur, cw = [], [], 0
    for i, w in enumerate(widths):
        if cur and cw + space + w > max_w:
            lines.append((cur, cw))
            cur, cw = [], 0
        cw += (space if cur else 0) + w
        cur.append(i)
    if cur:
        lines.append((cur, cw))
    y0 = y - (len(lines) - 1) * size * lh / 2
    for li, (idxs, lw_) in enumerate(lines):
        xx = x - lw_ / 2
        for i in idxs:
            age = now - times[i]
            if age >= 0:
                a = clamp(age / 0.18)
                dy = (1 - ease(age / 0.25)) * 18
                c = (hl or {}).get(i, color)
                text(ctx, words[i], xx, y0 + li * size * lh + dy, size, face, c, a, "left",
                     glow=0.8 if i in (hl or {}) else 0.0)
            xx += widths[i] + space


# ------------------------------------------------------------------ panels
def card(ctx, x, y, w, h, age, fill=(0.97, 0.97, 0.96), r=26, shadow=True, border=None):
    """Rounded card sliding up into place. Returns alpha used, caller draws contents inside (x,y,w,h)."""
    k = ease(age / 0.4)
    a = clamp(age / 0.25)
    oy = (1 - k) * 60
    if shadow:
        for i in range(6):
            rrect(ctx, x - i * 3, y + oy + 10 - i * 2, w + i * 6, h + i * 6, r + i * 3)
            rgba(ctx, (0, 0, 0), 0.07 * a)
            ctx.fill()
    rrect(ctx, x, y + oy, w, h, r)
    rgba(ctx, fill, a)
    ctx.fill()
    if border:
        rrect(ctx, x, y + oy, w, h, r)
        rgba(ctx, border, 0.9 * a)
        ctx.set_line_width(3)
        ctx.stroke()
    return a, oy


def source_card(ctx, cx, cy, w, source, headline, body, age, hl_lines=(), out=None):
    """Light 'article' card: source label, bold headline, body lines; hl_lines are highlighted like a marker."""
    lines_h = 66 * len(body)
    h = 150 + 76 * len(headline) + lines_h
    x, y = cx - w / 2, cy - h / 2
    a, oy = card(ctx, x, y, w, h, age)
    if out is not None and out < 0.25:
        a *= clamp(out / 0.25)
    y += oy
    text(ctx, source.upper(), x + 50, y + 66, 30, F_SB, (0.55, 0.55, 0.6), a, "left", shadow=False)
    rgba(ctx, RED, a)
    ctx.rectangle(x + 46, y + 78, 70, 5)
    ctx.fill()
    yy = y + 140
    for ln in headline:
        text(ctx, ln, x + 50, yy, 56, F_XB, (0.08, 0.08, 0.1), a, "left", shadow=False)
        yy += 76
    yy += 10
    for i, ln in enumerate(body):
        if i in hl_lines:
            mk = ease((age - 0.6 - 0.25 * hl_lines.index(i)) / 0.5)
            if mk > 0:
                tw, _ = text_size(ctx, ln, 40, F_MED)
                ctx.rectangle(x + 42, yy - 42, (tw + 16) * mk, 56)
                rgba(ctx, (1.0, 0.86, 0.25), 0.85 * a)
                ctx.fill()
        text(ctx, ln, x + 50, yy, 40, F_MED, (0.18, 0.18, 0.22), a, "left", shadow=False)
        yy += 66


def header(ctx, s, age, y=88):
    """Chapter label at top centre, small caps with letter spacing."""
    a = clamp(age / 0.3)
    text(ctx, s, W / 2, y, 34, F_XB, WHITE, a, glow=0.3)


def kv_table(ctx, rows, x, y, times, now, size=56, w=760, box_last=False, colors=None):
    """Rows of label / value appearing one by one (СУММА ... 8 800 000 ₽)."""
    for i, (k, v) in enumerate(rows):
        age = now - times[i]
        if age < 0:
            continue
        a = clamp(age / 0.2)
        dx = (1 - ease(age / 0.3)) * 40
        yy = y + i * size * 1.35
        text(ctx, k, x - w / 2 - dx, yy, size * 0.82, F_SB, (0.85, 0.85, 0.88), a, "left")
        c = (colors or {}).get(i, WHITE)
        vw = text(ctx, v, x + w / 2 + dx, yy, size, F_XB, c, a, "right", glow=0.5 if i in (colors or {}) else 0)
        if box_last and i == len(rows) - 1:
            ctx.rectangle(x + w / 2 - vw - 18, yy - size * 0.95, vw + 36, size * 1.25)
            rgba(ctx, WHITE, a)
            ctx.set_line_width(3)
            ctx.stroke()


def bar(ctx, x, y, w, frac, label, value, age, color=GREEN, h=22):
    a = clamp(age / 0.2)
    text(ctx, label, x, y - 28, 54, F_SB, WHITE, a, "left")
    rrect(ctx, x, y, w, h, h / 2)
    rgba(ctx, WHITE, 0.10 * a)
    ctx.fill()
    f = frac * ease((age - 0.2) / 1.2)
    if f > 0:
        for r, al in ((16, 0.08), (8, 0.15)):
            rrect(ctx, x - r / 2, y - r / 2, w * f + r, h + r, (h + r) / 2)
            rgba(ctx, color, al * a)
            ctx.fill()
        rrect(ctx, x, y, max(h, w * f), h, h / 2)
        rgba(ctx, color, a)
        ctx.fill()
        text(ctx, value, x + w * f, y + h + 56, 46, F_XB, color, a, "right")


def line_chart(ctx, x, y, w, h, series, age, labels=None, color=GOLD, ymax=None, fmt=None, dur=2.0, marks=()):
    """Animated line chart. series = list of (x_label, value)."""
    a = clamp(age / 0.3)
    vals = [v for _, v in series]
    ymax = ymax or max(vals) * 1.15
    rgba(ctx, WHITE, 0.25 * a)
    ctx.set_line_width(2)
    ctx.move_to(x, y)
    ctx.line_to(x, y + h)
    ctx.line_to(x + w, y + h)
    ctx.stroke()
    n = len(series)
    pts = [(x + w * i / (n - 1), y + h - h * v / ymax) for i, (_, v) in enumerate(series)]
    prog = ease(age / dur) * (n - 1)
    k = int(prog)
    fr = prog - k
    draw = pts[:k + 1]
    if k + 1 < n:
        p0, p1 = pts[k], pts[k + 1]
        draw = draw + [(lerp(p0[0], p1[0], fr), lerp(p0[1], p1[1], fr))]
    if len(draw) > 1:
        for lw, al in ((18, 0.10), (10, 0.18), (5, 1.0)):
            ctx.move_to(*draw[0])
            for p in draw[1:]:
                ctx.line_to(*p)
            rgba(ctx, color, al * a)
            ctx.set_line_width(lw)
            ctx.set_line_join(cairo.LINE_JOIN_ROUND)
            ctx.set_line_cap(cairo.LINE_CAP_ROUND)
            ctx.stroke()
    for i, (lab, v) in enumerate(series):
        if i <= prog + 0.01:
            px, py = pts[i]
            ctx.arc(px, py, 9, 0, 2 * math.pi)
            rgba(ctx, color, a)
            ctx.fill()
            text(ctx, lab, px, y + h + 56, 40, F_SB, GREY, a)
            if i in marks or i == n - 1 or i == 0:
                text(ctx, fmt(v) if fmt else str(v), px, py - 30, 54, F_XB, WHITE, a)


def bars_compare(ctx, x, y, h, items, age, bw=150, gap=90, ymax=None, fmt=str):
    """Vertical bars growing up: items = list of (label, value, colour)."""
    ymax = ymax or max(v for _, v, _ in items) * 1.1
    for i, (lab, v, c) in enumerate(items):
        ag = age - i * 0.35
        if ag < 0:
            continue
        a = clamp(ag / 0.2)
        bh = h * v / ymax * ease(ag / 1.0)
        bx = x + i * (bw + gap)
        rrect(ctx, bx, y + h - bh, bw, bh, 14)
        rgba(ctx, c, 0.9 * a)
        ctx.fill()
        text(ctx, lab, bx + bw / 2, y + h + 60, 48, F_SB, GREY, a)
        text(ctx, fmt(v), bx + bw / 2, y + h - bh - 24, 64, F_XB, WHITE, a)


# ------------------------------------------------------------------ icons
def neon(ctx, path_fn, color=GREEN, a=1.0, lw=6):
    for w_, al in ((26, 0.08), (14, 0.16), (lw, 1.0)):
        path_fn()
        rgba(ctx, color, al * a)
        ctx.set_line_width(w_)
        ctx.set_line_join(cairo.LINE_JOIN_ROUND)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.stroke()


def icon_flat(ctx, cx, cy, s, age, color=GREEN):
    """Neon floor-plan icon with m²."""
    a = clamp(age / 0.3)

    def p():
        ctx.rectangle(cx - 80 * s, cy - 80 * s, 160 * s, 160 * s)
        ctx.move_to(cx - 80 * s, cy - 10 * s)
        ctx.line_to(cx - 20 * s, cy - 10 * s)
        ctx.move_to(cx + 20 * s, cy - 80 * s)
        ctx.line_to(cx + 20 * s, cy - 30 * s)
        ctx.move_to(cx + 20 * s, cy + 30 * s)
        ctx.line_to(cx + 20 * s, cy + 80 * s)
    neon(ctx, p, color, a)
    text(ctx, "м²", cx - 25 * s, cy + 50 * s, 50 * s, F_XB, color, a, shadow=False, glow=0.6)


def icon_house(ctx, cx, cy, s, a=1.0, color=GOLD):
    def p():
        ctx.move_to(cx - 90 * s, cy - 10 * s)
        ctx.line_to(cx, cy - 95 * s)
        ctx.line_to(cx + 90 * s, cy - 10 * s)
        ctx.move_to(cx - 70 * s, cy - 25 * s)
        ctx.line_to(cx - 70 * s, cy + 80 * s)
        ctx.line_to(cx + 70 * s, cy + 80 * s)
        ctx.line_to(cx + 70 * s, cy - 25 * s)
        ctx.rectangle(cx - 22 * s, cy + 20 * s, 44 * s, 60 * s)
    neon(ctx, p, color, a)


def icon_key(ctx, cx, cy, s, a=1.0, color=GOLD):
    def p():
        ctx.new_sub_path()
        ctx.arc(cx - 55 * s, cy, 38 * s, 0, 2 * math.pi)
        ctx.move_to(cx - 17 * s, cy)
        ctx.line_to(cx + 90 * s, cy)
        ctx.line_to(cx + 90 * s, cy + 30 * s)
        ctx.move_to(cx + 55 * s, cy)
        ctx.line_to(cx + 55 * s, cy + 24 * s)
    neon(ctx, p, color, a)


def icon_lock(ctx, cx, cy, s, a=1.0, color=RED):
    def p():
        rrect(ctx, cx - 70 * s, cy - 20 * s, 140 * s, 110 * s, 16 * s)
        ctx.new_sub_path()
        ctx.arc(cx, cy - 20 * s, 48 * s, math.pi, 2 * math.pi)
        ctx.move_to(cx, cy + 20 * s)
        ctx.line_to(cx, cy + 50 * s)
    neon(ctx, p, color, a)


def panel_building(ctx, x, y, w, h, floors, cols, t=0.0, lit=0.35, color=(0.55, 0.55, 0.58), seed=1):
    """A Soviet-style panel block with windows; some windows lit."""
    ctx.rectangle(x, y, w, h)
    rgba(ctx, color)
    ctx.fill()
    rnd = random.Random(seed)
    fw, fh = w / cols, h / floors
    for r in range(floors):
        for c in range(cols):
            on = rnd.random() < lit
            ctx.rectangle(x + c * fw + fw * 0.2, y + r * fh + fh * 0.25, fw * 0.6, fh * 0.5)
            rgba(ctx, (1.0, 0.85, 0.45) if on else (0.18, 0.2, 0.25), 0.95)
            ctx.fill()
        rgba(ctx, (0, 0, 0), 0.25)
        ctx.rectangle(x, y + r * fh, w, 2)
        ctx.fill()


def old_tv(ctx, x, y, w, h, draw_inside, t, sepia=True):
    """Rounded 'old TV / film' frame with grain and scanlines; draw_inside(ctx) draws the picture in (x,y,w,h)."""
    ctx.save()
    rrect(ctx, x, y, w, h, 40)
    ctx.clip()
    draw_inside(ctx)
    if sepia:
        rgba(ctx, (0.55, 0.38, 0.18), 0.28)
        ctx.paint()
    for yy in range(int(y), int(y + h), 4):
        ctx.rectangle(x, yy, w, 1)
    rgba(ctx, (0, 0, 0), 0.18)
    ctx.fill()
    rnd = random.Random(int(t * 24))
    for _ in range(120):
        ctx.rectangle(x + rnd.random() * w, y + rnd.random() * h, 2, 2)
        rgba(ctx, WHITE, rnd.random() * 0.25)
        ctx.fill()
    g = cairo.RadialGradient(x + w / 2, y + h / 2, h * 0.3, x + w / 2, y + h / 2, w * 0.7)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, 0.7)
    ctx.set_source(g)
    ctx.paint()
    ctx.restore()
    rrect(ctx, x, y, w, h, 40)
    rgba(ctx, (0.08, 0.08, 0.09))
    ctx.set_line_width(18)
    ctx.stroke()


def timeline_ruler(ctx, label, age, cx=W / 2, cy=H / 2):
    """'2000-е' over a dashed ruler, sliding in."""
    a = clamp(age / 0.3)
    dx = (1 - ease(age / 0.6)) * 200
    text(ctx, label, cx + dx, cy - 30, 96, F_XB, WHITE, a, glow=0.4)
    for i in range(-12, 13):
        xx = cx + i * 34 + dx * 0.5
        hh = 26 if i == 0 else 10
        ctx.rectangle(xx - 2, cy + 40 - hh / 2, 4 if i == 0 else 14, 3 if i else hh)
        rgba(ctx, WHITE, a * (1 - abs(i) / 14))
        ctx.fill()


def flash(ctx, age, dur=0.18, color=WHITE, k=0.6):
    if 0 <= age < dur:
        rgba(ctx, color, k * (1 - age / dur))
        ctx.paint()


def subscribe_button(ctx, cx, cy, age):
    a = clamp(age / 0.3)
    k = ease_back(age / 0.4)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(0.7 + 0.3 * k, 0.7 + 0.3 * k)
    rrect(ctx, -190, -42, 380, 84, 42)
    pressed = age > 1.2
    rgba(ctx, (0.25, 0.25, 0.28) if pressed else (1, 1, 1), a)
    ctx.fill()
    text(ctx, "ВЫ ПОДПИСАНЫ" if pressed else "ПОДПИСАТЬСЯ", 0, 14, 34, F_XB,
         WHITE if pressed else (0.05, 0.05, 0.05), a, shadow=False)
    ctx.restore()
