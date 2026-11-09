"""High-quality 2D illustrated scenes (cel-shaded vector style). render(b, tl, t, level, beats) -> BGR frame."""
import math
import random
import numpy as np
import cairo

import art
import cine
import character
from art import (W, H, INK, shape, ground, coin, coin_stack, banknote, bundle, block, arrow, check, card, person, tag,
                 title, pop_title, plain, fit, rrect_path, ell_path, poly_path, gloss, ease, ease_io, ease_back, clamp, C,
                 shade_of, light_of, F_BLACK, F_XB, F_SB)

FLOOR = 800      # horizon line
GY = 900         # where objects stand


def at(b, k):
    return 0.0 if k == 0 else b["anchors"].get(k, b["dur"] * 0.5)


def age(b, k, tl):
    return tl - at(b, k)


class Frame:
    def __init__(self, b, tl, t, lv, beats):
        self.b, self.tl, self.t, self.lv, self.beats = b, tl, t, lv, beats
        self.dur = b["dur"]
        self.prog = clamp(tl / max(0.1, self.dur))
        self.mood = (0.0, 0.0)
        self.char = None
        self.main = []
        self.ui = []
        self.flash = 0.0
        self.zoom = 1.0 + 0.035 * ease_io(self.prog)      # slow push-in over every beat
        self.focus = (760, 560)                            # zoom centre
        self.letter = 0.0

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
            x, base, sc = (1600 if where == "right" else 330), H + 6, 0.56
        self.char = {"x": x, "base": base, "sc": sc, "where": where, "shot": shot}
        if where == "center":
            self.focus = (960, 600)

    def m(self, fn):
        self.main.append(fn)

    def u(self, fn):
        self.ui.append(fn)


def headline(f, s, k=0, y=150, size=100, color="white", x=None, face=F_BLACK):
    a = age(f.b, k, f.tl)
    xx = x if x is not None else (650 if f.char and f.char["where"] == "right" else 960)
    f.u(lambda c: pop_title(c, s, xx, y, fit(c, s, size, 1150 if f.char and f.char["where"] == "right" else 1700, face), a, color, face=face))


def subline(f, s, k, y=990, size=60, color="gold", x=None):
    headline(f, s, k, y, size, color, x, F_XB)


def bob(t, k=1.0, sp=1.6, ph=0.0):
    return k * math.sin(t * sp + ph)


# ------------------------------------------------------------------ illustrated props
def kiosk(c, x, y, s=1.0, closed=0.0, t=0.0, alpha=1.0):
    """Street shawarma kiosk standing on (x, y)."""
    w, h = 460 * s, 330 * s
    ground(c, x, y + 6, w * 0.65, 0.45 * alpha)
    shape(c, lambda q: rrect_path(q, x - w / 2, y - h, w, h, 14 * s), (0.93, 0.86, 0.74), alpha, shade=0.12)
    # window with warm light
    win = (x - w * 0.38, y - h * 0.78, w * 0.76, h * 0.42)
    lit = 1 - closed
    shape(c, lambda q: rrect_path(q, *win, 10 * s), (1.0, 0.82 * lit + 0.3 * closed, 0.45 * lit + 0.3 * closed), alpha, shade=0.10, light=0.0)
    if lit > 0:
        # spit with meat rotating inside the window
        cx, cy = x - w * 0.18, y - h * 0.57
        shape(c, lambda q: rrect_path(q, cx - 26 * s, cy - 60 * s, 52 * s, 120 * s, 22 * s), (0.70, 0.36, 0.18), alpha * lit, shade=0.3, light=0.1, lw=3.5)
        for k in range(4):
            yy = cy - 45 * s + k * 30 * s + (t * 20 * s) % (30 * s)
            c.move_to(cx - 22 * s, yy)
            c.line_to(cx + 22 * s, yy - 6 * s)
        c.set_source_rgba(0.45, 0.2, 0.08, 0.6 * alpha)
        c.set_line_width(3)
        c.stroke()
        # steam
        for k in range(3):
            ph = (t * 0.5 + k / 3) % 1
            c.arc(cx + 50 * s + 20 * s * math.sin(ph * 6 + k), cy - 70 * s - ph * 80 * s, (8 + 10 * ph) * s, 0, 2 * math.pi)
            c.set_source_rgba(1, 1, 1, 0.25 * (1 - ph) * alpha * lit)
            c.fill()
    # counter
    shape(c, lambda q: rrect_path(q, x - w * 0.52, y - h * 0.34, w * 1.04, 34 * s, 8 * s), (0.55, 0.36, 0.25), alpha, shade=0.3)
    # striped awning
    aw_y = y - h - 10 * s
    stripes = 8
    for i in range(stripes):
        x0 = x - w * 0.56 + i * w * 1.12 / stripes
        x1 = x0 + w * 1.12 / stripes
        col = (0.95, 0.34, 0.37) if i % 2 == 0 else (0.99, 0.95, 0.88)
        shape(c, lambda q, x0=x0, x1=x1: (q.move_to(x0 + 10 * s, aw_y - 60 * s), q.line_to(x1 + 10 * s, aw_y - 60 * s),
                                          q.line_to(x1, aw_y + 20 * s), q.curve_to(x1, aw_y + 46 * s, x0, aw_y + 46 * s, x0, aw_y + 20 * s),
                                          q.close_path()), col, alpha, shade=0.18, light=0.05, lw=4)
    # sign board
    sb = (x - w * 0.46, aw_y - 150 * s, w * 0.92, 84 * s)
    shape(c, lambda q: rrect_path(q, *sb, 14 * s), (0.20, 0.12, 0.26), alpha, shade=0.12)
    tsz = fit(c, "ШАУРМА У ВАСИ", 50 * s, w * 0.82)
    title(c, "ШАУРМА У ВАСИ", x, aw_y - 150 * s + 60 * s, tsz, "gold", alpha)
    if closed > 0:
        c.save()
        c.translate(x, y - h * 0.55)
        c.rotate(-0.18)
        L = w * 1.15 * ease(closed)
        shape(c, lambda q: q.rectangle(-L / 2, -32 * s, L, 64 * s), (1.0, 0.86, 0.15), alpha, shade=0.15, lw=4)
        if closed > 0.6:
            plain(c, "ЗАКРЫТО", 0, 16 * s, 44 * s, F_BLACK, INK, alpha)
        c.restore()


def price_tag(c, x, y, s, text_, color="gold", rot=0.0, alpha=1.0, flip=1.0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(max(0.05, abs(flip)), 1)
    w, h = 300 * s, 150 * s

    def p(q):
        q.move_to(-w / 2 + 50 * s, -h / 2)
        q.line_to(w / 2, -h / 2)
        q.line_to(w / 2, h / 2)
        q.line_to(-w / 2 + 50 * s, h / 2)
        q.line_to(-w / 2, 0)
        q.close_path()
    shape(c, p, color, alpha, shade=0.15)
    ell_path(c, -w / 2 + 45 * s, 0, 12 * s, 12 * s)
    c.set_source_rgba(*INK, alpha)
    c.fill()
    if abs(flip) > 0.25:
        title(c, text_, 25 * s, 24 * s, fit(c, text_, 76 * s, w * 0.72), "white" if color != "cream" else "gold", alpha)
    c.restore()


def chart_card(c, x, y, w, h, series, upto=1.0, alpha=1.0, grid=True, labels=None, fill=True, ymin=None, ymax=None):
    """Illustrated chart panel. series = [(values, color)]; returns function to map (i, v) -> screen."""
    card(c, x, y, w, h, alpha=alpha)
    px0, py0, px1, py1 = x + 40, y + 40, x + w - 40, y + h - 40
    allv = [v for vals, _ in series for v in vals]
    lo = min(allv) if ymin is None else ymin
    hi = max(allv) if ymax is None else ymax
    if grid:
        for k in range(1, 5):
            yy = py0 + (py1 - py0) * k / 5
            c.move_to(px0, yy)
            c.line_to(px1, yy)
        c.set_source_rgba(1, 1, 1, 0.08 * alpha)
        c.set_line_width(2)
        c.stroke()

    def mp(i, v, n):
        return px0 + (px1 - px0) * i / (n - 1), py1 - (py1 - py0) * (v - lo) / max(1e-6, hi - lo)
    heads = []
    for vals, col in series:
        n = len(vals)
        m_ = max(2, 1 + (n - 1) * clamp(upto))
        k = int(m_)
        frac = m_ - k
        pts = [mp(i, vals[i], n) for i in range(min(k, n))]
        if k < n and frac > 0:
            a0, a1 = mp(k - 1, vals[k - 1], n), mp(k, vals[k], n)
            pts.append((a0[0] + (a1[0] - a0[0]) * frac, a0[1] + (a1[1] - a0[1]) * frac))
        if fill:
            c.move_to(pts[0][0], py1)
            for p in pts:
                c.line_to(*p)
            c.line_to(pts[-1][0], py1)
            c.close_path()
            g = cairo.LinearGradient(0, py0, 0, py1)
            g.add_color_stop_rgba(0, *C(col), 0.45 * alpha)
            g.add_color_stop_rgba(1, *C(col), 0.03 * alpha)
            c.set_source(g)
            c.fill()
        c.set_line_join(cairo.LINE_JOIN_ROUND)
        c.set_line_cap(cairo.LINE_CAP_ROUND)
        for lw_, cc in ((14, INK), (8, C(col))):
            c.move_to(*pts[0])
            for p in pts[1:]:
                c.line_to(*p)
            c.set_line_width(lw_)
            c.set_source_rgba(*cc, alpha)
            c.stroke()
        hx, hy = pts[-1]
        shape(c, lambda q: ell_path(q, hx, hy, 13, 13), col, alpha, shade=0, light=0, lw=4)
        heads.append((hx, hy))
    return mp, heads


def pie2d(c, cx, cy, r, parts, ages, spin=0.0, depth=40, explode=14, labels=True, tilt=0.55):
    """2.5D pie: tilted disc with thickness. parts=[(name, frac, color)]."""
    ground(c, cx, cy + r * tilt + depth, r * 1.15, 0.4)
    a0 = spin
    segs = []
    for (name, fr, col), a in zip(parts, ages):
        a1 = a0 + 2 * math.pi * fr
        segs.append((a0, a1, name, fr, col, a))
        a0 = a1
    # draw sides first (back to front by mid angle sin)
    for a0, a1, name, fr, col, a in sorted(segs, key=lambda s: math.sin((s[0] + s[1]) / 2)):
        if a <= 0:
            continue
        e = ease_back(clamp(a / 0.45))
        mid = (a0 + a1) / 2
        ox, oy = explode * e * math.cos(mid), explode * e * math.sin(mid) * tilt
        n = max(4, int((a1 - a0) / 0.06))
        angs = [a0 + (a1 - a0) * i / n for i in range(n + 1)]
        top = [(cx + ox + r * math.cos(q), cy + oy + r * math.sin(q) * tilt) for q in angs]
        front = [p for p, q in zip(top, angs) if math.sin(q) > -0.05]
        if len(front) >= 2:
            side = front + [(p[0], p[1] + depth * e) for p in front[::-1]]
            shape(c, lambda q, side=side: poly_path(q, side), shade_of(col, 0.7), 1, shade=0, light=0, lw=4)
    for a0, a1, name, fr, col, a in segs:
        if a <= 0:
            continue
        e = ease_back(clamp(a / 0.45))
        mid = (a0 + a1) / 2
        ox, oy = explode * e * math.cos(mid), explode * e * math.sin(mid) * tilt
        n = max(4, int((a1 - a0) / 0.06))
        pts = [(cx + ox, cy + oy)] + [(cx + ox + r * e * math.cos(a0 + (a1 - a0) * i / n), cy + oy + r * e * math.sin(a0 + (a1 - a0) * i / n) * tilt)
                                      for i in range(n + 1)]
        shape(c, lambda q, pts=pts: poly_path(q, pts), col, 1, shade=0, light=0.04, lw=4)
    for a0, a1, name, fr, col, a in segs:
        if a <= 0.2 or not labels:
            continue
        mid = (a0 + a1) / 2
        lx, ly = cx + (r + 95) * math.cos(mid), cy + (r * tilt + 70) * math.sin(mid) + 10
        tag(c, f"{name} {int(round(fr * 100))}%", lx, ly, 30, col, alpha=clamp((a - 0.2) / 0.3))


def phone(c, x, y, w, h, screen, alpha=1.0, rot=0.0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    shape(c, lambda q: rrect_path(q, -w / 2, -h / 2, w, h, w * 0.14), (0.16, 0.14, 0.2), alpha, shade=0.06)
    c.save()
    rrect_path(c, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, w * 0.1)
    c.clip()
    c.translate(-w / 2 + 14, -h / 2 + 14)
    screen(c, w - 28, h - 28)
    c.restore()
    rrect_path(c, -w * 0.15, -h / 2 + 22, w * 0.3, 14, 7)
    c.set_source_rgba(0, 0, 0, alpha)
    c.fill()
    c.restore()


def egg(c, x, y, s, alpha=1.0, rot=0.0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    shape(c, lambda q: (q.move_to(0, -48 * s), q.curve_to(30 * s, -48 * s, 36 * s, 20 * s, 0, 22 * s),
                        q.curve_to(-36 * s, 20 * s, -30 * s, -48 * s, 0, -48 * s)), "cream", alpha, shade=0.25, light=0.08, lw=4)
    gloss(c, -10 * s, -26 * s, 12 * s, 6 * s, 0.7 * alpha, -1.0)
    c.restore()


def basket(c, x, y, s, rot=0.0, alpha=1.0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    shape(c, lambda q: (q.move_to(-150 * s, -90 * s), q.line_to(150 * s, -90 * s), q.line_to(110 * s, 0), q.line_to(-110 * s, 0),
                        q.close_path()), "wood", alpha, shade=0.2)
    for k in range(1, 4):
        yy = -90 * s + k * 22 * s
        c.move_to(-150 * s + k * 10 * s, yy)
        c.line_to(150 * s - k * 10 * s, yy)
    for k in range(-5, 6):
        c.move_to(k * 26 * s, -90 * s)
        c.line_to(k * 20 * s, 0)
    c.set_source_rgba(*shade_of("wood", 0.6), alpha)
    c.set_line_width(3)
    c.stroke()
    shape(c, lambda q: rrect_path(q, -162 * s, -104 * s, 324 * s, 24 * s, 12 * s), shade_of("wood", 0.9), alpha, shade=0.2)
    c.restore()


def splat(c, x, y, s, alpha=1.0):
    shape(c, lambda q: (q.move_to(x - 70 * s, y), q.curve_to(x - 80 * s, y - 30 * s, x - 20 * s, y - 26 * s, x, y - 22 * s),
                        q.curve_to(x + 30 * s, y - 34 * s, x + 90 * s, y - 20 * s, x + 70 * s, y),
                        q.curve_to(x + 60 * s, y + 20 * s, x - 60 * s, y + 22 * s, x - 70 * s, y)), "white", alpha, shade=0.1, lw=3.5)
    shape(c, lambda q: ell_path(q, x + 6 * s, y - 6 * s, 24 * s, 16 * s), (1.0, 0.72, 0.12), alpha, shade=0.2, lw=3.5)


def monitor(c, x, y, w, h, t, seed, alpha=1.0):
    shape(c, lambda q: rrect_path(q, x - w / 2, y - h / 2, w, h, 16), (0.18, 0.16, 0.22), alpha, shade=0.05)
    sx, sy, sw, sh = x - w / 2 + 16, y - h / 2 + 16, w - 32, h - 32
    c.rectangle(sx, sy, sw, sh)
    c.set_source_rgb(0.05, 0.06, 0.09)
    c.fill()
    rnd = random.Random(seed + int(t * 8))
    v = sh / 2
    for i in range(14):
        o = v
        v = min(sh - 14, max(14, v + rnd.gauss(0, sh * 0.12)))
        xx = sx + 10 + i * (sw - 20) / 14
        col = (0.3, 0.9, 0.5) if v < o else (0.95, 0.3, 0.32)
        c.rectangle(xx + 6, sy + min(o, v) - 10, 3, abs(v - o) + 20)
        c.rectangle(xx, sy + min(o, v), 15, max(3, abs(v - o)))
        c.set_source_rgb(*col)
        c.fill()
    shape(c, lambda q: q.rectangle(x - 12, y + h / 2, 24, 40), (0.25, 0.22, 0.3), alpha, shade=0.2, lw=4)


def hourglass(c, x, y, s, k, t):
    """Hourglass standing on (x, y); k = how much sand fell (0..1)."""
    ground(c, x, y + 5, 120 * s, 0.4)
    shape(c, lambda q: rrect_path(q, x - 120 * s, y - 30 * s, 240 * s, 30 * s, 10 * s), "wood", 1, shade=0.25)
    shape(c, lambda q: rrect_path(q, x - 120 * s, y - 390 * s, 240 * s, 30 * s, 10 * s), "wood", 1, shade=0.25)
    glass = lambda q: (q.move_to(x - 95 * s, y - 360 * s), q.line_to(x + 95 * s, y - 360 * s), q.curve_to(x + 95 * s, y - 250 * s, x + 12 * s, y - 230 * s, x + 12 * s, y - 195 * s),
                       q.curve_to(x + 12 * s, y - 160 * s, x + 95 * s, y - 140 * s, x + 95 * s, y - 30 * s), q.line_to(x - 95 * s, y - 30 * s),
                       q.curve_to(x - 95 * s, y - 140 * s, x - 12 * s, y - 160 * s, x - 12 * s, y - 195 * s),
                       q.curve_to(x - 12 * s, y - 230 * s, x - 95 * s, y - 250 * s, x - 95 * s, y - 360 * s), q.close_path())
    glass(c)
    c.set_source_rgba(0.75, 0.85, 1.0, 0.25)
    c.fill()
    c.save()
    glass(c)
    c.clip()
    top_h = 120 * s * (1 - k)
    c.rectangle(x - 100 * s, y - 220 * s - top_h, 200 * s, top_h)
    bot_h = 110 * s * k
    c.move_to(x - 95 * s, y - 30 * s)
    c.line_to(x + 95 * s, y - 30 * s)
    c.line_to(x + 95 * s, y - 30 * s - bot_h * 0.6)
    c.line_to(x, y - 30 * s - bot_h * 1.3)
    c.line_to(x - 95 * s, y - 30 * s - bot_h * 0.6)
    c.close_path()
    c.set_source_rgb(*C("gold"))
    c.fill()
    if k < 1:
        c.rectangle(x - 3 * s, y - 200 * s, 6 * s, 170 * s - bot_h)
        c.fill()
    c.restore()
    glass(c)
    c.set_line_width(5)
    c.set_source_rgba(*INK, 1)
    c.stroke()
    gloss(c, x - 55 * s, y - 300 * s, 14 * s, 50 * s, 0.5, 0.3)


# ------------------------------------------------------------------ scenes
def s_talk(f):
    b = f.b
    f.put_char("center", b.get("shot", "medium"))
    close = f.char["shot"] == "close"
    f.zoom = 1.0 + (0.05 if close else 0.03) * ease_io(f.prog)
    ys = (260, 410) if close else (190, 330)
    for i, (k, s, y, size, col) in enumerate(b.get("pops", [])):
        if close:
            x, mw = (330 if i % 2 == 0 else 1590), 540
            yy = ys[min(i, 1)]
        else:
            x, mw = 960, 1100
            yy = ys[min(i, 1)]
            size = min(size, 130 if i == 0 else 100)
        a = age(b, k, f.tl)
        f.u(lambda c, s=s, x=x, yy=yy, size=size, a=a, col=col, mw=mw: pop_title(c, s, x, yy, fit(c, s, size, mw), a, col))


def s_disclaimer(f):
    a = clamp(f.tl / 0.5) * (1 - clamp((f.tl - f.dur + 0.5) / 0.5))

    def ui(c):
        c.set_source_rgba(0.05, 0.0, 0.08, 0.5 * a)
        c.paint()
        card(c, 360, 380, 1200, 300, alpha=a)
        plain(c, "Не индивидуальная инвестиционная рекомендация.", 960, 505, 46, F_XB, "white", a)
        plain(c, "Все цифры — примеры для понимания, а не обещания доходности.", 960, 575, 34, F_SB, (0.8, 0.78, 0.86), a)
    f.u(ui)


def s_chapter(f):
    b, tl = f.b, f.tl
    f.flash = 0.18 * max(0.0, 1 - tl / 0.2)
    f.zoom = 1.08 - 0.08 * ease(tl / 0.8)
    f.focus = (960, 540)

    def ui(c):
        # sweeping diagonal bands
        k = ease_io(tl / 0.5)
        for i, col in enumerate(("gold", "pink", "purple")):
            off = (1 - k) * (W + 600) * (1 if i % 2 else -1)
            c.save()
            c.translate(W / 2 + off * (0.6 + 0.2 * i), H / 2 + 40 * i - 40)
            c.rotate(-0.12)
            shape(c, lambda q: q.rectangle(-W, -70 + i * 6, 2 * W, 150 - i * 30), col, 0.92 if i == 0 else 0.85, shade=0.12, light=0.05)
            c.restore()
        if b.get("num"):
            pop_title(c, "ГЛАВА " + b["num"], 960, 330, 52, tl - 0.15, "cream", face=F_XB)
        pop_title(c, b["title"], 960, 585, fit(c, b["title"], 150, 1500), tl - 0.2, "white")
        if b.get("title2"):
            pop_title(c, b["title2"], 960, 720, fit(c, b["title2"], 64, 1400, F_XB), tl - 0.4, "gold", face=F_XB)
        for i in range(6):
            ph = (tl * 0.8 + i / 6) % 1
            art.sparkle(c, 300 + i * 260 + 30 * math.sin(i), 260 + 500 * ((i * 0.37) % 1), 18 * math.sin(math.pi * ph), 0.8)
    f.u(ui)


def s_melt(f):
    b, tl = f.b, f.tl
    f.put_char()
    st = b.get("stage", 1)
    v = (1.0 - 0.08 * ease_io(clamp((tl - at(b, 2)) / 3.0))) if st == 1 else (0.92 - 0.27 * ease_io(clamp((tl - 0.5) / 3.5)))
    hgt = 380 * v
    melt = 1 - v

    def main(c):
        x, y = 560, GY
        # golden puddle spreading
        if melt > 0.01:
            shape(c, lambda q: ell_path(q, x + 20, y + 10, 200 + 520 * melt, 26 + 40 * melt), (1.0, 0.78, 0.30), 0.95, shade=0.3, light=0.1, lw=4)
            gloss(c, x - 60, y + 2, 120, 8, 0.5, 0)
        bundle(c, x, y, 470, hgt)
        # drips running down the front
        for i in range(4):
            ph = (tl * 0.5 + i * 0.29) % 1
            dx = x - 140 + i * 90
            if melt > 0.01:
                shape(c, lambda q, dx=dx, ph=ph: (q.move_to(dx - 9, y - hgt + 6), q.line_to(dx + 9, y - hgt + 6),
                                                  q.line_to(dx + 9, y - hgt + 20 + ph * hgt * 0.8),
                                                  q.arc(dx, y - hgt + 20 + ph * hgt * 0.8, 9, 0, math.pi), q.close_path()),
                      (1.0, 0.78, 0.3), 1, shade=0.2, lw=3)
        val = int(round(100 * v)) * 1000
        title(c, f"{val:,}".replace(",", " ") + " ₽", x, y - hgt - 120, 100, "white" if v > 0.95 else "gold", clamp(tl / 0.3))
    f.m(main)
    if st == 1:
        subline(f, "ТИХО ХУДЕЮТ", 2, 1000, 72, "red", 600)
    else:
        headline(f, "ИНФЛЯЦИЯ", 1, 140, 120, "red", 600)
        subline(f, "≈ 65 000 ₽ ЧЕРЕЗ 10 ЛЕТ", 0, 1000, 60, "gold", 600)


def s_agenda(f):
    b, tl = f.b, f.tl
    f.put_char()

    def main(c):
        for i, (k, s) in enumerate(b["items"]):
            a = age(b, k, tl)
            if a < 0:
                continue
            e = ease_back(a / 0.5)
            x = 110 - (1 - e) * 900
            y = 200 + i * 230
            card(c, x, y, 1080, 180, alpha=clamp(a / 0.2))
            shape(c, lambda q, x=x, y=y: rrect_path(q, x + 26, y + 28, 124, 124, 30), "gold", 1, shade=0.15)
            title(c, str(i + 1), x + 88, y + 122, 86, "white")
            title(c, s, x + 185, y + 115, fit(c, s, 64, 860), "white", 1, "left")
    f.m(main)


def s_prices(f):
    b, tl = f.b, f.tl
    f.put_char()
    a1, a2 = age(b, 1, tl), age(b, 2, tl)
    hp = 120 + 300 * ease_io(clamp(a1 / 3.0)) if a1 > 0 else 120
    hs = 120 + 110 * ease_io(clamp(a2 / 3.0)) if a2 > 0 else 120

    def main(c):
        block(c, 380, GY, 220, hp, "red")
        items = ["ШАУРМА", "КОФЕ", "БЕНЗИН", "ПРОДУКТЫ"]
        for i, it in enumerate(items):
            if a1 > i * 0.4:
                yy = GY - 120 - i * 80 + bob(tl, 6, 2, i)
                tag(c, it + " ↑", 600, yy, 30, "red", alpha=clamp((a1 - i * 0.4) / 0.3))
        top = coin_stack(c, 950, GY, max(1, int(hs / 15)), 90)
        tag(c, "ЗАРПЛАТА И НАКОПЛЕНИЯ", 950, top - 60, 30, "gold")
    f.m(main)
    headline(f, "ИНФЛЯЦИЯ", 0, 150, 110)


def s_shawarma(f):
    b, tl = f.b, f.tl
    f.put_char()
    a1 = age(b, 1, tl)
    flip = math.cos(math.pi * ease_io(clamp(a1 / 0.6))) if a1 > 0 else 1.0

    def main(c):
        x, y = 560, GY
        ground(c, x, y + 4, 340, 0.4)
        shape(c, lambda q: ell_path(q, x, y - 20, 320, 60), "white", 1, shade=0.15)
        ell_path(c, x, y - 28, 250, 40)
        c.set_source_rgba(*shade_of("white", 0.85), 1)
        c.fill()
        # shawarma roll: wrapped lavash with filling peeking out
        c.save()
        c.translate(x, y - 80)
        c.rotate(-0.22)
        shape(c, lambda q: rrect_path(q, -230, -62, 460, 124, 60), (0.98, 0.76, 0.42), 1, shade=0.25, light=0.08)
        for k in range(5):
            c.move_to(-180 + k * 85, -60)
            c.curve_to(-160 + k * 85, -20, -190 + k * 85, 20, -170 + k * 85, 60)
        c.set_source_rgba(0.75, 0.55, 0.3, 0.5)
        c.set_line_width(3)
        c.stroke()
        shape(c, lambda q: ell_path(q, 230, 0, 34, 58), (0.98, 0.9, 0.7), 1, shade=0.2)
        for k, colr in enumerate(((0.35, 0.75, 0.3), (0.92, 0.3, 0.25), (0.7, 0.4, 0.2))):
            shape(c, lambda q, k=k: ell_path(q, 232, -28 + k * 26, 18, 13), colr, 1, shade=0.2, lw=3)
        c.restore()
        # price tag flips 100 -> 400
        price_tag(c, 1000, 420 + bob(tl, 8), 1.2, "100 ₽" if flip >= 0 else "400 ₽", "gold" if flip >= 0 else "red", -0.08, 1, flip)
        # sniff lines
        if a1 > 0.8:
            for k in range(3):
                ph = (tl * 1.2 + k / 3) % 1
                c.move_to(820 + k * 40, 760 - ph * 120)
                c.curve_to(840 + k * 40, 740 - ph * 120, 800 + k * 40, 720 - ph * 120, 820 + k * 40, 700 - ph * 120)
                c.set_source_rgba(1, 1, 1, 0.6 * (1 - ph))
                c.set_line_width(6)
                c.stroke()
    f.m(main)
    subline(f, "ТОЛЬКО ПОНЮХАТЬ", 1, 1010, 70, "gold", 620)
    f.ui[-1] = (lambda c, a=age(b, 1, tl) - 0.8: pop_title(c, "ТОЛЬКО ПОНЮХАТЬ", 620, 1010, 70, a, "gold", face=F_XB))


def s_treadmill(f):
    b, tl = f.b, f.tl
    f.put_char()

    def main(c):
        x, y = 600, GY
        ground(c, x, y + 6, 520, 0.45)
        # frame posts + handle
        for sx in (-330, 330):
            shape(c, lambda q, sx=sx: rrect_path(q, x + sx - 16, y - 420, 32, 360, 14), "steel", 1, shade=0.3)
        shape(c, lambda q: rrect_path(q, x - 350, y - 440, 700, 34, 16), "steel", 1, shade=0.3)
        # belt
        shape(c, lambda q: rrect_path(q, x - 420, y - 90, 840, 90, 45), (0.22, 0.20, 0.27), 1, shade=0.2)
        c.save()
        rrect_path(c, x - 400, y - 80, 800, 30, 15)
        c.clip()
        off = (tl * 420) % 80
        for k in range(-1, 12):
            c.rectangle(x - 400 + k * 80 + off, y - 80, 14, 30)
        c.set_source_rgba(1, 1, 1, 0.18)
        c.fill()
        c.restore()
        for rx in (-370, 370):
            shape(c, lambda q, rx=rx: ell_path(q, x + rx, y - 45, 32, 32), "steel", 1, shade=0.25)
        # running coin with little legs
        cy = y - 230 - abs(math.sin(tl * 9)) * 18
        for k, ph in enumerate((0, math.pi)):
            lx = x + 40 * math.sin(tl * 9 + ph)
            c.move_to(x + (k * 30 - 15), cy + 70)
            c.line_to(lx, y - 92)
            c.set_line_width(14)
            c.set_line_cap(cairo.LINE_CAP_ROUND)
            c.set_source_rgba(*INK, 1)
            c.stroke()
        coin(c, x, cy, 100, flip=1.0)
        # sweat drops
        for k in range(2):
            ph = (tl * 1.5 + k * 0.5) % 1
            shape(c, lambda q, ph=ph, k=k: ell_path(q, x - 120 - k * 40 - ph * 60, cy - 80 + ph * 70, 10, 14), (0.6, 0.85, 1.0), 1 - ph, shade=0.2, lw=3)
        tag(c, "ВКЛАД", x, y - 380, 36, "gold")
    f.m(main)
    headline(f, "ВКЛАД ≈ ИНФЛЯЦИЯ", 1, 150, 90)
    subline(f, "СТОИШЬ НА МЕСТЕ", 2, 1010, 66, "red")


def _walk(seed, n, trend, vol):
    rnd = random.Random(seed)
    v, out = 0.0, []
    for _ in range(n):
        v += trend + rnd.gauss(0, vol)
        out.append(v)
    return out


def s_race(f):
    b, tl = f.b, f.tl
    n = 40
    infl = [1 + 0.031 * i for i in range(n)]
    dep = [1 + 0.036 * i + 0.03 * math.sin(i * 0.7) for i in range(n)]
    stk = [1 + max(-0.2, v) for v in _walk(4, n, 0.08, 0.12)]
    up = ease_io(clamp((tl - 0.3) / max(1.0, f.dur - 1.5)))

    def main(c):
        mp, heads = chart_card(c, 140, 230, 1640, 700, [(infl, "red"), (dep, "blue"), (stk, "gold")], up, ymin=0.6)
        for (hx, hy), (nm, col, dy) in zip(heads, (("ИНФЛЯЦИЯ", "red", 40), ("ВКЛАДЫ", "blue", -40), ("АКЦИИ", "gold", -50))):
            tag(c, nm, hx - 40, hy + dy, 30, col)
        plain(c, "условная иллюстрация, не реальные котировки", 960, 1010, 26, F_SB, (0.75, 0.72, 0.8), 0.9)
    f.m(main)
    headline(f, "В ДОЛГУЮ", 0, 150, 96)
    f.u(lambda c, a=age(b, 2, tl): pop_title(c, "10–20 ЛЕТ", 1500, 150, 70, a, "gold", face=F_XB))


def share_grid(c, x, y, s, t, out=False, grey=False, appear=99.0):
    cell = 26 * s
    for i in range(10):
        for j in range(10):
            if out and i == 9 and j == 0:
                continue
            k = clamp((appear - (i + j) * 0.03) / 0.25)
            if k <= 0:
                continue
            cx, cy = x + i * cell, y - j * cell * 0.62
            col = (0.45, 0.43, 0.5) if grey else "gold"
            shape(c, lambda q, cx=cx, cy=cy: rrect_path(q, cx, cy - cell * 0.9 * k, cell * 0.9, cell * 0.9 * k, 4), col, 1, shade=0, light=0, lw=2.5)


def s_shop(f):
    b, tl = f.b, f.tl
    f.put_char()
    st = b.get("stage", 1)
    if st == 3:
        f.mood = (0.85 * clamp(tl / 0.4), 0.0)

    def main(c):
        if st == 1:
            kiosk(c, 560, GY, 1.25, 0, tl)
            a2 = age(b, 2, tl)
            if a2 > 0:
                c.save()
                al = clamp(a2 / 0.5)
                rrect_path(c, 950, GY - 330, 300, 330, 14)
                c.set_dash([18, 12])
                c.set_line_width(5)
                c.set_source_rgba(1, 1, 1, 0.45 * al)
                c.stroke()
                c.restore()
                title(c, "?", 1100, GY - 120, 160, "cream", al)
                tag(c, "ВТОРАЯ ТОЧКА", 1100, GY - 380, 32, "cream", alpha=al)
        else:
            kiosk(c, 400, GY, 1.0, clamp(age(b, 1, tl) / 0.4) if st == 3 else 0, tl)
            out = age(b, 1, tl) if st == 2 else 9
            share_grid(c, 720, GY - 40, 1.0, tl, out=out > 0, grey=(st == 3), appear=tl * 2 if st == 2 else 99)
            tag(c, "100 АКЦИЙ", 850, GY - 260, 32, "cream")
            if out > 0:
                e = ease_io(clamp(out / 0.9))
                px, py = 720 + 9 * 26 + e * 120, GY - 60 - e * 380
                rot = tl * 0.6
                col = "gold"
                if st == 3:
                    fall = clamp((tl - at(b, 2)) / 0.7)
                    py = py + 420 * fall ** 2
                    rot = 0.6 * fall
                    col = (0.5, 0.48, 0.55)
                c.save()
                c.translate(px, py)
                c.rotate(math.sin(rot) * 0.2)
                block(c, 0, 50, 100, 100, col)
                c.restore()
                tag(c, "ТВОЯ 1%" if st == 2 else "НИКОМУ НЕ НУЖНА", px + 20, py - 100, 36, "gold" if st == 2 else "red")
    f.m(main)
    if st == 2:
        headline(f, "ТЫ СОВЛАДЕЛЕЦ!", 2, 150, 100, "gold")
    if st == 3:
        headline(f, "АКЦИИ ПАДАЮТ", 0, 150, 110, "red")


def s_tickers(f):
    b, tl = f.b, f.tl
    f.put_char()
    a2 = age(b, 2, tl)

    def main(c):
        if a2 < 0:
            e = ease_back(clamp(tl / 0.5))
            c.save()
            c.translate(620, GY - 20 + bob(tl, 10))
            c.scale(e, e)
            block(c, 0, 0, 240, 240, "gold")
            c.restore()
            tag(c, "АКЦИЯ = КУСОЧЕК КОМПАНИИ", 620, GY - 360, 38, "gold")
        else:
            for i, (nm, col) in enumerate((("СБЕР", "green"), ("ЛУКОЙЛ", "red"), ("ЯНДЕКС", "amber"))):
                a = a2 - i * 0.22
                if a < 0:
                    continue
                e = ease_back(clamp(a / 0.45))
                x, y = 250 + i * 380, 540 + bob(tl, 8, 1.4, i)
                c.save()
                c.translate(x, y)
                c.scale(e, e)
                card(c, -165, -150, 330, 300)
                shape(c, lambda q: ell_path(q, 0, -70, 50, 50), col, 1, shade=0.2)
                title(c, nm[0], 0, -48, 60, "white")
                plain(c, nm, 0, 30, 46, F_BLACK, "white")
                rnd = random.Random(i)
                pts = [(-130 + k * 18, 110 - k * 4 - rnd.gauss(0, 8)) for k in range(15)]
                c.move_to(*pts[0])
                for p in pts[1:]:
                    c.line_to(*p)
                c.set_line_width(6)
                c.set_source_rgb(*C("green"))
                c.stroke()
                c.restore()
    f.m(main)
    headline(f, "АКЦИЯ", 0, 150, 120)


def s_twoways(f):
    b, tl = f.b, f.tl
    a1, a2 = age(b, 1, tl), age(b, 2, tl)

    def main(c):
        for x, k, a in ((560, 1, a1), (1360, 2, a2)):
            ground(c, x, GY + 6, 280, 0.4)
            shape(c, lambda q, x=x: ell_path(q, x, GY, 250, 50), (0.30, 0.24, 0.40), 1, shade=0.2)
            title(c, str(k), x, 330, 100, "green" if k == 1 else "gold", clamp(a / 0.3) if a > 0 else 0.25)
        if a1 > 0:
            g = 120 + 140 * ease_io(clamp(a1 / 2.0))
            block(c, 560, GY - 10, g, g, "gold")
            arrow(c, 560 + g * 0.8, GY - g * 0.4, 560 + g * 0.8 + 60, GY - g - 80, "green")
            tag(c, "+ РОСТ ЦЕНЫ", 560, GY - g - 140, 40, "green")
        if a2 > 0:
            n = int(clamp(a2 / 2.5) * 16) + 1
            top = coin_stack(c, 1360, GY - 10, n, 100)
            ph = (a2 * 1.4) % 1
            if a2 < 3.5:
                coin(c, 1360, top - 40 - 400 * (1 - ph) ** 2, 70, flip=math.cos(tl * 8))
            tag(c, "+ ДИВИДЕНДЫ", 1360, top - 90, 40, "gold")
    f.m(main)
    headline(f, "ДВА СПОСОБА ЗАРАБОТАТЬ", 0, 150, 90)


def gauge(c, cx, cy, r, level, t):
    n = 10
    for i in range(n):
        a0 = math.pi + math.pi * i / n
        a1 = math.pi + math.pi * (i + 1) / n
        col = tuple(np.array(C("green")) * (1 - i / (n - 1)) + np.array(C("red")) * (i / (n - 1)))
        shape(c, lambda q, a0=a0, a1=a1: (q.arc(cx, cy, r, a0 + 0.015, a1 - 0.015), q.arc_negative(cx, cy, r * 0.62, a1 - 0.015, a0 + 0.015),
                                          q.close_path()), col, 1, shade=0.1, light=0.05, lw=4)
    ang = math.pi + math.pi * level
    c.save()
    c.translate(cx, cy)
    c.rotate(ang)
    shape(c, lambda q: (q.move_to(0, -14), q.line_to(r * 0.85, 0), q.line_to(0, 14), q.close_path()), "white", 1, shade=0.2, lw=4)
    c.restore()
    shape(c, lambda q: ell_path(q, cx, cy, 34, 34), "dark", 1, shade=0.2)


def s_gauge(f):
    b, tl = f.b, f.tl
    f.put_char()
    lvl = b.get("level", 0.85)
    k = ease_back(clamp(tl / 1.4)) * lvl + 0.025 * math.sin(tl * 7) * (tl > 1.4)

    def main(c):
        card(c, 130, 300, 1060, 560)
        gauge(c, 660, 760, 380, k, tl)
        tag(c, "СПОКОЙНО", 330, 820, 30, "green")
        tag(c, "КАЧЕЛИ", 990, 820, 30, "red")
    f.m(main)
    headline(f, b.get("label", "АКЦИИ"), 0, 160, 110)
    subline(f, "ВЫСОКИЙ ДОХОД = ВЫСОКИЙ РИСК", 1, 1000, 54)


def certificate(c, x, y, w, rot=0.0, alpha=1.0, label="ОБЛИГАЦИЯ"):
    h = w * 0.68
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    shape(c, lambda q: rrect_path(q, -w / 2, -h / 2, w, h, 10), "cream", alpha, shade=0.1, light=0.04)
    rrect_path(c, -w / 2 + 14, -h / 2 + 14, w - 28, h - 28, 6)
    c.set_line_width(4)
    c.set_source_rgba(0.75, 0.55, 0.25, alpha)
    c.stroke()
    plain(c, label, 0, -h * 0.12, w * 0.12, F_BLACK, (0.45, 0.3, 0.15), alpha)
    for k in range(3):
        c.rectangle(-w * 0.32, h * 0.02 + k * h * 0.09, w * 0.64, 4)
    c.set_source_rgba(0.6, 0.5, 0.4, 0.5 * alpha)
    c.fill()
    shape(c, lambda q: ell_path(q, w * 0.3, h * 0.28, w * 0.09, w * 0.09), "red", alpha, shade=0.2, lw=3.5)
    c.restore()


def s_bond(f):
    b, tl = f.b, f.tl
    f.put_char()
    a0, a2 = tl - 0.4, age(b, 2, tl)

    def main(c):
        person(c, 260, GY, 1.4, "blue", "happy")
        tag(c, "ТЫ", 260, GY + 60, 36, "cream")
        # borrower: a government building
        bx = 1060
        ground(c, bx, GY + 6, 260, 0.4)
        shape(c, lambda q: q.rectangle(bx - 200, GY - 230, 400, 230), "cream", 1, shade=0.12)
        for k in range(5):
            shape(c, lambda q, k=k: q.rectangle(bx - 170 + k * 80, GY - 210, 34, 190), "white", 1, shade=0.25, lw=3.5)
        shape(c, lambda q: poly_path(q, [(bx - 230, GY - 230), (bx, GY - 360), (bx + 230, GY - 230)]), (0.9, 0.84, 0.72), 1, shade=0.15)
        tag(c, "ГОСУДАРСТВО / КОМПАНИЯ", bx, GY + 60, 30, "cream")
        e = ease_io(clamp(a0 / 1.2))
        coin(c, 330 + (bx - 330) * e, GY - 300 - 220 * math.sin(math.pi * e), 80, flip=math.cos(tl * 6))
        if a0 > 1.0:
            k = ease_io(clamp((a0 - 1.0) / 1.0))
            certificate(c, bx - (bx - 330) * k, GY - 320 - 160 * math.sin(math.pi * k), 260, 0.2 - 0.3 * k)
        if a2 > 0:
            for i in range(4):
                ph = a2 * 0.7 - i * 0.25
                if 0 < ph < 1:
                    p = ease_io(ph)
                    coin(c, bx - (bx - 330) * p, GY - 170 - 140 * math.sin(math.pi * p), 40, flip=math.cos(tl * 7 + i))
            tag(c, "КУПОНЫ", 680, GY - 380, 40, "gold")
    f.m(main)
    headline(f, "ОБЛИГАЦИЯ = ДОЛГ", 0, 150, 96)


def s_coupons(f):
    b, tl = f.b, f.tl
    a2, a3 = age(b, 2, tl), age(b, 3, tl)

    def main(c):
        x0, x1, y = 160, 1500, GY - 30
        shape(c, lambda q: rrect_path(q, x0, y, x1 - x0, 26, 13), (0.35, 0.28, 0.45), 1, shade=0.3)
        for yr in range(1, 6):
            x = x0 + yr * (x1 - x0) / 6
            plain(c, f"{yr}-Й ГОД", x, y + 80, 30, F_XB, (0.85, 0.82, 0.9))
            a = a2 - (yr - 1) * 0.45
            if a > 0:
                n = max(1, int(9 * ease_back(clamp(a / 0.5))))
                top = coin_stack(c, x, y, n, 80, seed=yr)
                tag(c, "КУПОН", x, top - 50, 28, "gold")
        if a3 > 0:
            e = ease_back(clamp(a3 / 0.6))
            block(c, 1690, y, 200, 420 * e, "green")
            tag(c, "ВСЯ СУММА НАЗАД", 1690, y - 420 * e - 60, 30, "green")
    f.m(main)
    f.u(lambda c: pop_title(c, "ОФЗ", 300, 190, 130, tl, "gold"))
    f.u(lambda c: plain(c, "облигации федерального займа", 300, 250, 32, F_SB, "white", clamp(tl / 0.5)))
    f.u(lambda c, a=age(b, 1, tl): pop_title(c, "ТЫ → МИНФИН", 300, 350, 54, a, "white", face=F_XB))


def s_scale(f):
    b, tl = f.b, f.tl
    f.put_char()

    def main(c):
        for name, x, inc, risk, k in (("ОФЗ", 380, 160, 90, 0), ("КОМПАНИИ", 900, 320, 360, 1)):
            a = age(b, k, tl)
            if a < 0:
                continue
            e = ease_io(clamp(a / 1.0))
            block(c, x - 85, GY, 140, inc * e + 2, "gold")
            block(c, x + 85, GY, 140, risk * e + 2, "red")
            tag(c, "ДОХОД", x - 85, GY - inc * e - 60, 28, "gold")
            tag(c, "РИСК", x + 85, GY - risk * e - 60, 28, "red")
            title(c, name, x, GY + 66, 42, "white")
    f.m(main)
    headline(f, "ДОХОД vs РИСК", 0, 150, 100)
    subline(f, "ЖИРНАЯ ДОХОДНОСТЬ = ПОДВОХ", 2, 1050, 52, "red")


def jar(c, x, y, w, h, content, alpha=1.0, lid="gold"):
    """Glass jar standing on (x, y); content(c) draws inside (clipped)."""
    ground(c, x, y + 6, w * 0.7, 0.4)
    body = lambda q: rrect_path(q, x - w / 2, y - h, w, h, w * 0.18)
    body(c)
    c.set_source_rgba(0.75, 0.85, 1.0, 0.18 * alpha)
    c.fill()
    c.save()
    body(c)
    c.clip()
    content(c)
    c.restore()
    body(c)
    c.set_source_rgba(*INK, alpha)
    c.set_line_width(5)
    c.stroke()
    gloss(c, x - w * 0.32, y - h * 0.6, w * 0.06, h * 0.5, 0.35, 0)
    shape(c, lambda q: rrect_path(q, x - w * 0.42, y - h - 40, w * 0.84, 50, 14), lid, alpha, shade=0.2)


def s_fund(f):
    b, tl = f.b, f.tl
    f.put_char()
    st = b.get("stage", 1)
    a2 = age(b, 2, tl) if st == 1 else 9.0
    cols = ["gold", "blue", "green", "purple", "teal", "amber", "red", "pink"]

    def content(c):
        for i in range(24):
            gx, gy = i % 6, i // 6
            tx, ty = 420 + gx * 82, GY - 40 - gy * 82
            rnd = random.Random(i)
            k = ease_io(clamp((a2 - i * 0.05) / 0.8)) if st == 1 else 1.0
            sx, sy = tx + rnd.uniform(-600, 600), ty - rnd.uniform(500, 900)
            x, y = sx + (tx - sx) * k, sy + (ty - sy) * k
            col = cols[i % 8]
            if st == 3 and i == 9:
                continue
            if st == 1 and a2 < 0:
                continue
            block(c, x, y, 64, 64, col, depth=10, r=8)

    def main(c):
        jar(c, 620, GY, 560, 460, content)
        if st == 3:
            fall = clamp((tl - 0.3) / 1.2)
            x = 620 + 330 * fall
            y = GY - 300 + 300 * fall ** 2
            c.save()
            c.translate(x, y)
            c.rotate(fall * 2)
            block(c, 0, 32, 64, 64, "red", depth=10, r=8)
            c.restore()
        lab = {1: "1 ПАЙ", 2: "ИНДЕКС МОСБИРЖИ", 3: "ПОЧТИ НЕ ЗАМЕТНО"}[st]
        tag(c, lab, 620, GY - 560, 40, "gold" if st < 3 else "green")
    f.m(main)
    headline(f, "ФОНД", 0 if st == 1 else -99, 150, 120)
    if st == 1:
        subline(f, "ВНУТРИ — ДЕСЯТКИ КОМПАНИЙ", 2, 1010, 54)
    if st == 2:
        subline(f, "КРУПНЕЙШИЕ КОМПАНИИ СТРАНЫ", 2, 1010, 54)
    if st == 3:
        subline(f, "−1 КОМПАНИЯ", 0, 1010, 64, "red")


def s_bars(f):
    b, tl = f.b, f.tl
    ser = b["series"]
    mx = max(v for _, _, v, _ in ser)

    def main(c):
        for i, (k, name, v, col) in enumerate(ser):
            a = age(b, k, tl)
            x = 700 + i * 520
            shape(c, lambda q, x=x: ell_path(q, x, GY, 200, 40), (0.30, 0.24, 0.40), 1, shade=0.2)
            title(c, name, x, GY + 100, 50, "white")
            if a < 0:
                continue
            e = ease_io(clamp(a / 1.5))
            hgt = 520 * v / mx * e
            block(c, x, GY - 10, 230, hgt + 2, col)
            title(c, f"{v * e:.1f} МЛН ₽".replace(".", ","), x, GY - hgt - 70, 58, col)
    f.m(main)
    headline(f, b.get("title", ""), 0, 130, 80)
    d = b.get("diff")
    if d:
        f.u(lambda c, a=age(b, d[0], tl): pop_title(c, d[1], 960, 560, 72, a, "red"))


def s_drunk(f, crash=False, stage=1):
    b, tl = f.b, f.tl
    f.put_char()
    n = 60
    if crash:
        ys = _walk(11, n, 0.05, 0.05)
        ci = 40
        for i in range(ci, n):
            ys[i] -= 1.5
        if stage == 2:
            for i in range(ci + 1, n):
                ys[i] += (i - ci) * 0.05
    else:
        ys = _walk(8, n, 0.045, 0.16)
    if crash and stage == 1:
        up = min(0.69, 0.55 + 0.14 * ease_io(clamp((tl - 0.3) / 1.0)))
    elif crash:
        up = 0.69 + 0.31 * ease_io(clamp((tl - 0.3) / (f.dur - 1.0)))
    else:
        up = ease_io(clamp((tl - 0.2) / (f.dur - 0.8)))
    red = crash and stage == 1 and up > 0.67
    if red:
        f.mood = (0.85, 0.0)

    def main(c):
        mp, heads = chart_card(c, 110, 260, 1200, 640, [(ys, "red" if red else "gold")], up, ymin=min(ys) - 0.3, ymax=max(ys) + 0.3)
        hx, hy = heads[0]
        if not crash:
            # tipsy uncle emoji-face riding the line head
            c.save()
            c.translate(hx, hy - 50)
            c.rotate(0.25 * math.sin(tl * 3))
            shape(c, lambda q: ell_path(q, 0, 0, 40, 40), (1.0, 0.84, 0.7), 1, shade=0.2)
            for ex in (-13, 13):
                c.move_to(ex - 7, -6)
                c.line_to(ex + 7, -2)
            c.set_line_width(4)
            c.set_source_rgba(*INK, 1)
            c.stroke()
            ell_path(c, -22, 12, 9, 6)
            c.set_source_rgba(1, 0.4, 0.45, 0.7)
            c.fill()
            ell_path(c, 22, 12, 9, 6)
            c.fill()
            c.arc(0, 14, 12, 0.2, math.pi - 0.2)
            c.set_source_rgba(*INK, 1)
            c.stroke()
            c.restore()
        if crash and stage == 2:
            px, py = mp(ci + 1, ys[ci + 1], n)
            tag(c, "ПРОДАЛ НА ДНЕ ✕", px, py + 70, 32, "red")
            tag(c, "ДЕРЖАЛ", hx - 20, hy - 60, 36, "green", alpha=clamp((tl - 1.0) / 0.4))
    f.m(main)
    if not crash:
        headline(f, "ТУДА-СЮДА", 2, 160, 96)
        subline(f, "НО В ЦЕЛОМ ВПЕРЁД", 3, 1010, 64, "green")
    elif stage == 1:
        headline(f, "2022", 0, 170, 120)
        if up > 0.67:
            f.u(lambda c: pop_title(c, "−33% ЗА ДЕНЬ", 700, 1010, 100, tl - 1.0, "red"))
    else:
        headline(f, "ВОССТАНОВЛЕНИЕ — НЕ СРАЗУ", 2, 170, 64, face=F_XB)


def s_crash(f):
    s_drunk(f, crash=True, stage=f.b.get("stage", 1))


def s_rule(f):
    b, tl = f.b, f.tl
    f.put_char()

    def main(c):
        hourglass(c, 620, GY, 1.3, f.prog, tl)
    f.m(main)
    f.u(lambda c, a=age(b, 1, tl): pop_title(c, b.get("big", "5+ ЛЕТ"), 620, 230, 170, a, "gold"))
    f.u(lambda c, a=age(b, 1, tl) - 0.3: pop_title(c, b.get("sub", ""), 620, 320, 50, a, "white", face=F_XB))


def s_snowball(f):
    b, tl = f.b, f.tl
    f.put_char()

    def main(c):
        for i in range(9):
            a = tl - 0.3 - i * 0.35
            if a < 0:
                continue
            n = max(1, int(1.36 ** i * 2 * ease_back(clamp(a / 0.5))))
            top = coin_stack(c, 150 + i * 135, GY, n, 52, seed=i)
            if i > 0 and a > 0.3:
                arrow(c, 150 + (i - 1) * 135 + 30, top - 80 + 20, 150 + i * 135 - 20, top - 40, "green", clamp((a - 0.3) / 0.3), lw=8)
    f.m(main)
    headline(f, "СЛОЖНЫЙ ПРОЦЕНТ", 1, 160, 92, "gold")
    subline(f, "ДОХОД ПРИНОСИТ ДОХОД", 2, 1010, 60, "white")


def s_towers(f):
    b, tl = f.b, f.tl
    ser = b["series"]
    mx = ser[-1][2]

    def main(c):
        for i, (k, name, v) in enumerate(ser):
            a = age(b, k, tl)
            x = 520 + i * 440
            shape(c, lambda q, x=x: ell_path(q, x, GY, 170, 34), (0.30, 0.24, 0.40), 1, shade=0.2)
            title(c, name, x, GY + 95, 50, "white")
            if a < 0:
                continue
            e = ease_io(clamp(a / 1.6))
            hgt = 640 * v / mx * e
            n = max(1, int(hgt / (95 * 0.22)))
            top = coin_stack(c, x, GY - 8, n, 95, seed=i)
            val = v * e
            title(c, (f"{val:.1f}" if v < 10 else f"{val:.0f}").replace(".", ",") + " МЛН ₽", x, top - 60, 56, "gold")
    f.m(main)
    headline(f, b.get("title", ""), 0, 110, 66, face=F_XB)
    f.u(lambda c: plain(c, "расчёт-пример, доходность не гарантирована", 960, 1050, 26, F_SB, (0.75, 0.72, 0.8), 0.9))


def s_split(f):
    b, tl = f.b, f.tl
    f.put_char()
    own, tot = b["own"], b["total"]
    Ht = 680
    ho = Ht * own / tot

    def main(c):
        e = ease_io(clamp(tl / 1.0))
        a1 = age(b, 1, tl)
        g = ease_io(clamp(a1 / 1.5)) if a1 > 0 else 0
        x = 820
        if g > 0:
            block(c, x, GY - ho * e + 2, 260, (Ht - ho) * g, "gold")
            tag(c, "ПРОЦЕНТЫ ≈ 19 МЛН", x - 380, GY - ho - (Ht - ho) * g * 0.5, 40, "gold")
        block(c, x, GY, 260, ho * e + 2, "blue")
        tag(c, "СВОИ 3,6 МЛН", x - 380, GY - ho * 0.5, 40, "blue")
    f.m(main)
    headline(f, "ИЗ 22,6 МЛН", 0, 140, 92)


def s_eggs(f):
    b, tl = f.b, f.tl
    f.put_char()
    a2 = age(b, 2, tl)
    tip = ease_io(clamp(a2 / 0.5)) if a2 > 0 else 0.0

    def main(c):
        bx, by = 620, GY - 20
        for i in range(6):
            ex, ey = bx - 100 + i * 40, by - 110 - (i % 2) * 18
            rot = (i - 2.5) * 0.12
            if a2 > 0.15:
                ft = a2 - 0.15 - i * 0.05
                if ft > 0:
                    ex = ex - 160 * ft + 60 * (i - 2.5) * ft
                    ey = min(GY - 10, ey - 200 * ft + 1400 * ft * ft)
                    rot += ft * 6
                    if ey >= GY - 10 and ft > 0.25:
                        splat(c, ex, GY, 0.9)
                        continue
            egg(c, ex, ey, 1.1, rot=rot)
        basket(c, bx + 60 * tip, by + 10 * tip, 1.0, rot=-0.9 * tip)
    f.m(main)
    headline(f, "ВСЕ ЯЙЦА В ОДНОЙ КОРЗИНЕ", 1, 160, 70, face=F_XB)
    subline(f, "НИ ЯИЦ, НИ ЯИЧНИЦЫ", 2.5 if False else 2, 1010, 64, "red")


def s_pie(f):
    b, tl = f.b, f.tl
    f.put_char()
    parts = [(n, fr, col) for _, n, fr, col in b["parts"]]
    ages = [age(b, k, tl) - 0.12 * i for i, (k, *_r) in enumerate(b["parts"])]
    f.m(lambda c: pie2d(c, 640, 600, 330, parts, ages, spin=-math.pi / 2 + tl * 0.08))
    headline(f, "ДИВЕРСИФИКАЦИЯ", 0, 150, 92)


def s_boat(f):
    b, tl = f.b, f.tl
    f.put_char()
    roll = 0.16 * math.sin(tl * 1.6)
    heave = 14 * math.sin(tl * 1.6 + 0.8)

    def waves(c, z, alpha):
        pts = [(x, 760 + z * 40 + 18 * math.sin(x * 0.008 + tl * 2 + z) + 8 * math.sin(x * 0.02 - tl * 1.3)) for x in range(-20, W + 40, 20)]
        c.move_to(*pts[0])
        for p in pts[1:]:
            c.line_to(*p)
        c.line_to(W + 40, H)
        c.line_to(-20, H)
        c.close_path()
        g = cairo.LinearGradient(0, 700, 0, H)
        g.add_color_stop_rgba(0, 0.38, 0.62, 0.98, alpha)
        g.add_color_stop_rgba(1, 0.12, 0.18, 0.45, alpha)
        c.set_source(g)
        c.fill_preserve()
        c.set_source_rgba(*INK, alpha)
        c.set_line_width(4)
        c.stroke()

    def main(c):
        waves(c, 0, 0.8)
        c.save()
        c.translate(640, 720 + heave)
        c.rotate(roll)
        shape(c, lambda q: (q.move_to(-300, -60), q.line_to(320, -60), q.curve_to(290, 40, 200, 70, 120, 70), q.line_to(-200, 70),
                            q.curve_to(-260, 70, -290, 20, -300, -60), q.close_path()), "red", 1, shade=0.2)
        shape(c, lambda q: q.rectangle(-300, -60, 620, 24), "white", 1, shade=0.2, lw=4)
        shape(c, lambda q: rrect_path(q, -150, -200, 260, 140, 16), "cream", 1, shade=0.15)
        plain(c, "ПОРТФЕЛЬ", -20, -112, 44, F_BLACK, INK)
        shape(c, lambda q: q.rectangle(160, -330, 14, 270), "wood", 1, shade=0.2, lw=4)
        shape(c, lambda q: poly_path(q, [(174, -320), (300, -270), (174, -220)]), "gold", 1, shade=0.15, lw=4)
        c.restore()
        waves(c, 1, 0.95)
    f.m(main)
    headline(f, "АКЦИИ ↑  ОБЛИГАЦИИ ДЕРЖАТ", 0, 150, 56, face=F_XB)
    headline(f, "АКЦИИ ↓  ОБЛИГАЦИИ СМЯГЧАЮТ", 1, 240, 56, "gold", face=F_XB)
    subline(f, "КАЧАЕТ, НО НЕ ТОПИТ", 2, 1010, 66, "green")


def s_twopies(f):
    b, tl = f.b, f.tl
    a1, a2 = age(b, 1, tl), age(b, 2, tl)

    def main(c):
        pie2d(c, 560, 600, 260, [("АКЦИИ", 0.8, "purple"), ("ОБЛ.", 0.2, "blue")], [a1, a1 - 0.15], spin=-math.pi / 2)
        pie2d(c, 1360, 600, 260, [("АКЦИИ", 0.3, "purple"), ("ОБЛ.", 0.7, "blue")], [a2, a2 - 0.15], spin=-math.pi / 2)
    f.m(main)
    headline(f, "СКОЛЬКО КУДА?", 0, 150, 92)
    f.u(lambda c: pop_title(c, "КРЕПКИЕ НЕРВЫ", 560, 1010, 56, a1, "purple", face=F_XB))
    f.u(lambda c: pop_title(c, "БОИШЬСЯ ПРОСАДОК", 1360, 1010, 56, a2, "blue", face=F_XB))


STEP_NAMES = ["ПОДУШКА", "БРОКЕРСКИЙ СЧЁТ", "СТРАТЕГИЯ", "РЕГУЛЯРНОСТЬ"]


def s_steps(f):
    b, tl = f.b, f.tl
    f.put_char()
    st = b.get("step", 1)

    def main(c):
        for i in range(4):
            x = 230 + i * 260
            hgt = 120 + i * 110
            on, done = i + 1 == st, i + 1 < st
            col = "gold" if on else ("green" if done else (0.36, 0.30, 0.46))
            block(c, x, GY, 240, hgt, col, depth=40)
            plain(c, str(i + 1), x, GY - hgt / 2 + 30, 80, F_BLACK, (1, 1, 1), 0.9)
            tag(c, STEP_NAMES[i], x, GY - hgt - (200 if on else 60), 26 if not on else 30, "gold" if on else ("green" if done else "grey"))
        # coin hops onto the current step
        hop = ease_io(clamp(tl / 0.7))
        x1 = 230 + (st - 1) * 260
        x0 = x1 - 260 if st > 1 else x1 - 200
        h1 = 120 + (st - 1) * 110
        h0 = h1 - 110 if st > 1 else 0
        cx = x0 + (x1 - x0) * hop
        cy = GY - (h0 + (h1 - h0) * hop) - 90 - 160 * math.sin(math.pi * hop)
        coin(c, cx, cy, 70, flip=math.cos(tl * 4))
    f.m(main)
    headline(f, f"ШАГ {st}", 0, 150, 110, "gold")
    headline(f, STEP_NAMES[st - 1], 0, 240, 58, face=F_XB)
    extra = {1: (1, "3–6 МЕСЯЦЕВ РАСХОДОВ"), 2: (1, "ПРИЛОЖЕНИЕ · 10 МИНУТ"), 3: (1, "2 ФОНДА: АКЦИИ + ОБЛИГАЦИИ"),
             4: (2, "КАЖДЫЙ МЕСЯЦ")}[st]
    subline(f, extra[1], extra[0], 1010, 54, "white")
    if st == 1:
        subline(f, "БЕЗ НЕЁ — НЕ ИНВЕСТИРУЙ", 2, 330, 46, "red")
    if st == 4:
        subline(f, "2 000 – 20 000 ₽", 3, 330, 56, "gold")


def s_iis(f):
    b, tl = f.b, f.tl
    f.put_char()
    a1 = age(b, 1, tl)

    def main(c):
        x, y = 600, GY
        ground(c, x, y + 6, 300, 0.45)
        shape(c, lambda q: rrect_path(q, x - 250, y - 460, 500, 460, 30), "steel", 1, shade=0.12)
        shape(c, lambda q: rrect_path(q, x - 200, y - 410, 400, 360, 20), (0.48, 0.50, 0.60), 1, shade=0.15)
        c.save()
        c.translate(x, y - 230)
        shape(c, lambda q: ell_path(q, 0, 0, 100, 100), (0.36, 0.38, 0.46), 1, shade=0.2)
        c.rotate(tl * 0.8)
        for k in range(6):
            c.rotate(math.pi / 3)
            shape(c, lambda q: rrect_path(q, -9, -95, 18, 60, 9), "white", 1, shade=0.2, lw=3)
        c.restore()
        plain(c, "ИИС", x, y - 80, 60, F_BLACK, "gold")
        for side in (-1, 1):
            shape(c, lambda q, side=side: rrect_path(q, x + side * 170 - 30, y - 10, 60, 30, 8), "dark", 1, shade=0.2, lw=4)
        if a1 > 0:
            for i in range(5):
                ph = (a1 * 0.7 - i * 0.2) % 1.4
                if ph < 1:
                    p = ease_io(ph)
                    coin(c, x + 420 - 380 * p, y - 520 + 40 * p + 60 * math.sin(math.pi * p), 46, flip=math.cos(tl * 6 + i))
    f.m(main)
    headline(f, "ИИС", 0, 150, 120, "gold")
    headline(f, "+52 000 ₽ / ГОД", 1, 260, 76, "green")
    subline(f, "ДЕРЖАТЬ ДОЛГО · УТОЧНЯЙ УСЛОВИЯ", 2, 1010, 46, "white")


def s_dca(f):
    b, tl = f.b, f.tl
    n = 48
    ys = [1.6 + 0.9 * math.sin(i * 0.22) + 0.3 * math.sin(i * 0.61) + 0.012 * i for i in range(n)]
    up = ease_io(clamp((tl - 0.3) / (f.dur - 1.5)))

    def main(c):
        mp, heads = chart_card(c, 140, 230, 1640, 700, [(ys, "blue")], up, ymin=0.3, ymax=3.2)
        k = int((n - 1) * up)
        buys = [i for i in range(2, n, 5) if i <= k]
        for i in buys:
            x, y = mp(i, ys[i], n)
            coin(c, x, y - 40, 30, flip=1.0)
        if buys:
            avg = float(np.mean([ys[i] for i in buys]))
            a3 = age(b, 3, tl)
            if a3 > 0:
                x0, y0 = mp(0, avg, n)
                x1, _ = mp(n - 1, avg, n)
                xe = x0 + (x1 - x0) * ease_io(clamp(a3 / 1.0))
                c.move_to(x0, y0)
                c.line_to(xe, y0)
                c.set_dash([24, 14])
                c.set_line_width(7)
                c.set_source_rgb(*C("gold"))
                c.stroke()
                c.set_dash([])
                tag(c, "СРЕДНЯЯ ЦЕНА", x1 - 150, y0 + 45, 30, "gold")
    f.m(main)
    headline(f, "НЕ УГАДЫВАЙ МОМЕНТ", 0, 140, 84)
    subline(f, "ПОКУПАЙ КАЖДЫЙ МЕСЯЦ", 2, 1010, 60)


def s_rebalance(f):
    b, tl = f.b, f.tl
    f.put_char()
    plan = [0.40, 0.30, 0.20, 0.10]
    drift = [0.55, 0.22, 0.16, 0.07]
    a1, a2 = age(b, 1, tl), age(b, 2, tl)
    kb = ease_io(clamp(a2 / 1.0)) if a2 > 0 else 0.0
    e = ease_io(clamp(a1 / 1.0)) if a1 > 0 else 0.0
    fr = [p + (d - p) * e * (1 - kb) for p, d in zip(plan, drift)]
    parts = list(zip(["АКЦИИ", "ОБЛИГАЦИИ", "ФОНДЫ", "ЗОЛОТО"], fr, ["purple", "blue", "green", "amber"]))
    f.m(lambda c: pie2d(c, 640, 620, 320, parts, [9] * 4, spin=-math.pi / 2))
    headline(f, "РЕБАЛАНСИРОВКА", 0, 140, 88)
    headline(f, "РАЗ В ГОД", 0, 230, 56, "gold", face=F_XB)
    subline(f, "НАЗАД К ПЛАНУ", 2, 1030, 64, "green")


def s_trader(f):
    b, tl = f.b, f.tl
    f.put_char()
    a1 = age(b, 1, tl)

    def main(c):
        for i, x in enumerate((260, 640, 1020)):
            monitor(c, x, 560 + bob(tl, 4, 1, i), 340, 230, tl * 2.2, i * 7)
        shape(c, lambda q: rrect_path(q, 60, 740, 1180, 40, 12), "wood", 1, shade=0.25)
    f.m(main)
    headline(f, "ОШИБКА №1", 0, 120, 70, "red", face=F_XB)
    headline(f, "ТРЕЙДИНГ", 0, 230, 110)
    f.u(lambda c: pop_title(c, "КУПИЛ", 420, 1010, 66, a1, "green", face=F_XB))
    f.u(lambda c: pop_title(c, "ПРОДАЛ", 860, 1010, 66, a1 - 0.6, "red", face=F_XB))


def s_losers(f):
    b, tl = f.b, f.tl
    f.put_char()
    a1 = age(b, 1, tl)
    f.mood = (0.7 * clamp(a1 / 0.5), 0.0) if a1 > 0 else (0.0, 0.0)

    def main(c):
        for row in range(2):
            for j in range(5):
                i = row * 5 + j
                x = 200 + j * 230 + row * 110
                y = GY - 120 + row * 140
                lose = i not in (3, 6)
                k = clamp((a1 - i * 0.1) / 0.4) if a1 > 0 else 0.0
                col = ("red" if lose else "green") if k > 0 else "grey"
                person(c, x, y, 0.95, col, ("sad" if lose else "happy") if k > 0 else "neutral", lean=0.25 * ease_io(k) * (1 if lose else 0))
    f.m(main)
    headline(f, "ЧАСТНЫЕ ТРЕЙДЕРЫ", 0, 150, 84)
    subline(f, "БОЛЬШИНСТВО — В МИНУСЕ", 1, 1010, 70, "red")


def s_hype(f):
    b, tl = f.b, f.tl
    f.put_char()
    a1, a2 = age(b, 1, tl), age(b, 2, tl)
    msgs = ["БЕРИ, УЛЕТИТ!!!", "ДО ЛУНЫ!!!", "Я ВСЁ ЗАКИНУЛ", "ПОСЛЕДНИЙ ШАНС!!"]

    def screen(c, w, h):
        c.rectangle(0, 0, w, h)
        c.set_source_rgb(0.10, 0.09, 0.14)
        c.fill()
        c.rectangle(0, 0, w, 80)
        c.set_source_rgb(0.2, 0.16, 0.28)
        c.fill()
        plain(c, "ЧАТ ИНВЕСТОРОВ", w / 2, 52, 26, F_XB, "white")
        nmsg = int(clamp(a1 / 2.0) * len(msgs) + 0.999) if a1 > 0 else 1
        for i in range(nmsg):
            y = 110 + i * 120
            x = 20 + (i % 2) * 40
            rrect_path(c, x, y, w - 80, 90, 24)
            c.set_source_rgb(*((0.32, 0.5, 0.98) if i % 2 else (0.3, 0.26, 0.4)))
            c.fill()
            plain(c, msgs[i], x + (w - 80) / 2, y + 56, 24, F_XB, "white")

    def main(c):
        phone(c, 330, 560, 330, 620, screen, rot=-0.05 + 0.02 * math.sin(tl))
        n = 30
        ys = [0.6 + 0.004 * i * i for i in range(22)] + [0.6 + 0.004 * 441 - (i - 21) * 0.2 for i in range(22, n)]
        up = 0.3 + 0.7 * ease_io(clamp(a2 / 2.0)) if a2 > 0 else 0.6 * ease_io(clamp(tl / 2.0))
        mp, heads = chart_card(c, 560, 300, 720, 520, [(ys, "red" if up > 0.73 else "gold")], up, ymin=0.4, ymax=2.6)
        if a2 > 0:
            px, py = mp(21, ys[21], n)
            tag(c, "ТЫ КУПИЛ ТУТ", px, py - 50, 32, "red", alpha=clamp(a2 / 0.4))
    f.m(main)
    headline(f, "ОШИБКА №2", 0, 110, 66, "red", face=F_XB)
    headline(f, "ХАЙП", 0, 220, 110)


def s_roulette(f):
    b, tl = f.b, f.tl
    f.put_char()

    def main(c):
        cx, cy, r = 640, 640, 360
        ground(c, cx, cy + r * 0.5 + 60, r * 1.15, 0.4)
        shape(c, lambda q: ell_path(q, cx, cy + 40, r + 30, (r + 30) * 0.5), "wood", 1, shade=0.15)
        n = 18
        spin = tl * 2.0
        for i in range(n):
            a0, a1 = spin + i * 2 * math.pi / n, spin + (i + 1) * 2 * math.pi / n
            col = "green" if i == 0 else ("red" if i % 2 else (0.14, 0.12, 0.17))
            pts = [(cx + r * 0.45 * math.cos(a0), cy + r * 0.45 * math.sin(a0) * 0.5)] + \
                  [(cx + r * math.cos(a0 + (a1 - a0) * k / 4), cy + r * math.sin(a0 + (a1 - a0) * k / 4) * 0.5) for k in range(5)] + \
                  [(cx + r * 0.45 * math.cos(a1), cy + r * 0.45 * math.sin(a1) * 0.5)]
            shape(c, lambda q, pts=pts: poly_path(q, pts), col, 1, shade=0, light=0, lw=3)
        shape(c, lambda q: ell_path(q, cx, cy, r * 0.45, r * 0.225), "gold", 1, shade=0.2)
        shape(c, lambda q: rrect_path(q, cx - 14, cy - 90, 28, 90, 10), "gold", 1, shade=0.25, lw=4)
        ba = -tl * 3.5
        shape(c, lambda q: ell_path(q, cx + r * 0.85 * math.cos(ba), cy + r * 0.85 * math.sin(ba) * 0.5 - 10, 16, 16), "white", 1, shade=0.25, lw=3)
    f.m(main)
    headline(f, "ОШИБКА №3", 0, 110, 66, "red", face=F_XB)
    headline(f, "ИНВЕСТИЦИИ В КРЕДИТ", 0, 215, 80)
    subline(f, "СТАВКА — ГАРАНТИРОВАНА", 1, 940, 52, "red")
    subline(f, "ДОХОД — НЕТ", 2, 1030, 60, "gold")


def s_tower(f):
    b, tl = f.b, f.tl
    f.put_char()
    a2 = age(b, 2, tl)

    def main(c):
        for i in range(8):
            y = GY - i * 80
            x, rot = 640, 0.0
            if a2 > 0:
                ft = clamp(a2 - (7 - i) * 0.05)
                rnd = random.Random(i)
                x += (rnd.random() - 0.35) * 500 * ft
                y = min(GY - 10, y + 1600 * ft * ft * (1 + i * 0.1))
                rot = (rnd.random() - 0.5) * 2.4 * ft
            c.save()
            c.translate(x, y)
            c.rotate(rot)
            block(c, 0, 0, 220, 74, "gold" if i % 2 else "amber", depth=36)
            c.restore()
        if a2 <= 0:
            tag(c, "ОДНА КОМПАНИЯ", 640, GY - 700, 38, "gold")
    f.m(main)
    headline(f, "ОШИБКА №4", 0, 110, 66, "red", face=F_XB)
    headline(f, "ВСЁ В ОДНУ БУМАГУ", 0, 215, 84)
    subline(f, "ВЕЧНЫХ КОМПАНИЙ НЕТ", 2, 1010, 64, "red")


def s_pyramid(f):
    b, tl = f.b, f.tl
    f.put_char()
    f.mood = (0.85 * clamp(tl / 0.4), 0.0)
    a2 = age(b, 2, tl)

    def main(c):
        lv = 5
        for L in range(lv):
            nrow = lv - L
            for i in range(nrow):
                x = 640 + (i - (nrow - 1) / 2) * 150
                y = GY - L * 100
                rot = 0.0
                if a2 > 0:
                    ft = clamp(a2 - L * 0.1)
                    rnd = random.Random(L * 10 + i)
                    x += (rnd.random() - 0.5) * 500 * ft
                    y = min(GY - 10, y + 1700 * ft * ft)
                    rot = (rnd.random() - 0.5) * 2 * ft
                c.save()
                c.translate(x, y)
                c.rotate(rot)
                block(c, 0, 0, 138, 92, "gold" if L == lv - 1 else "amber", depth=26)
                c.restore()
        if a2 <= 0:
            tag(c, "30% В МЕСЯЦ ГАРАНТИРОВАННО", 640, GY - 620, 34, "gold")
    f.m(main)
    headline(f, "ОШИБКА №5", 0, 110, 66, "red", face=F_XB)
    headline(f, "ИНФОЦЫГАНЕ", 0, 220, 104)
    subline(f, "ЭТО ПИРАМИДА", 2, 1010, 90, "red")


def s_checklist(f):
    b, tl = f.b, f.tl
    f.put_char()

    def main(c):
        a = clamp(tl / 0.4)
        card(c, 140, 130, 1080, 850, alpha=a)
        title(c, "ПЛАН ИНВЕСТОРА", 680, 235, 64, "gold", a)
        for i, (k, s) in enumerate(b["items"]):
            ai = age(b, k, tl)
            y = 350 + i * 130
            shape(c, lambda q, y=y: rrect_path(q, 210, y - 50, 90, 90, 22), (0.32, 0.26, 0.42), a, shade=6, light=3, lw=4)
            if ai > 0:
                check(c, 255, y - 6, 64, ai / 0.35)
                title(c, s, 340, y + 20, fit(c, s, 54, 820, F_XB), "white", clamp(ai / 0.25), "left", F_XB)
    f.m(main)


def s_outro(f):
    b, tl = f.b, f.tl
    st = b.get("stage", 1)
    if st == 2:
        f.put_char("center", "medium")
        headline(f, "УВИДИМСЯ!", 1, 280, 140, "gold")

        def fade(c):
            if tl > f.dur - 1.0:
                c.set_source_rgba(0, 0, 0, clamp((tl - f.dur + 1.0) / 0.9))
                c.paint()
        f.u(fade)
        return
    f.put_char()
    a1 = age(b, 1, tl)
    pressed = a1 > 0.6

    def main(c):
        x, y = 640, 560
        press = 10 * math.sin(math.pi * clamp((a1 - 0.45) / 0.3)) if a1 > 0.45 else 0
        rrect_path(c, x - 380 + 12, y - 100 + 18, 760, 200, 100)
        c.set_source_rgba(*INK, 0.5)
        c.fill()
        shape(c, lambda q: rrect_path(q, x - 380, y - 100 + press, 760, 200, 100), (0.40, 0.38, 0.45) if pressed else "red", 1, shade=0.12, light=0.06)
        s = "ВЫ ПОДПИСАНЫ ✓" if pressed else "ПОДПИСАТЬСЯ"
        title(c, s, x, y + 32 + press, fit(c, s, 84, 640), "white")
        # bell
        bx, by = x + 470, y - 10
        rot = 0.3 * math.sin(tl * 10) * clamp((a1 - 0.6) / 0.2) * (1 - clamp((a1 - 2.0) / 0.5)) if a1 > 0.6 else 0
        c.save()
        c.translate(bx, by - 60)
        c.rotate(rot)
        shape(c, lambda q: (q.move_to(-60, 60), q.curve_to(-60, -40, -30, -60, 0, -60), q.curve_to(30, -60, 60, -40, 60, 60), q.close_path()),
              "gold", 1, shade=0.2)
        shape(c, lambda q: ell_path(q, 0, 70, 16, 16), "gold", 1, shade=0.2, lw=4)
        c.restore()
        if a1 > 0:
            e = ease_io(clamp(a1 / 0.5))
            cx, cy = x + 120 + 300 * (1 - e), y + 40 + 200 * (1 - e)
            shape(c, lambda q: poly_path(q, [(cx, cy), (cx + 14, cy + 66), (cx + 30, cy + 48), (cx + 58, cy + 56)]), "white", 1, shade=0, light=0, lw=4)
    f.m(main)
    headline(f, "БЫЛО ПОЛЕЗНО?", 0, 180, 96)
    subline(f, "КИНЬ ДРУГУ С ДЕНЬГАМИ В НОСКЕ", 2, 1000, 52)


SCENES = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}


# ------------------------------------------------------------------ compositor
def render(b, tl, t, level, beats):
    f = Frame(b, tl, t, level, beats)
    SCENES[b["scene"]](f)
    shout = b.get("style") == "shout"
    if shout:
        f.mood = (max(f.mood[0], 0.5 * clamp(tl / 0.4)), f.mood[1])
        f.zoom += 0.035 * ease(tl / 0.5) + 0.01 * level
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(surf)
    fx_, fy_ = f.focus
    # background moves a little less than the foreground (parallax)
    c.save()
    zb = 1 + (f.zoom - 1) * 0.5
    c.translate(fx_, fy_)
    c.scale(zb, zb)
    c.translate(-fx_, -fy_)
    art.background(c, t, f.mood, FLOOR, pan=12 * math.sin(t * 0.1))
    c.restore()
    c.save()
    c.translate(fx_, fy_)
    if shout:
        c.rotate(0.006 * math.sin(t * 1.8))
    c.scale(f.zoom, f.zoom)
    c.translate(-fx_, -fy_)
    for fn in f.main:
        fn(c)
    if f.char:
        ch = f.char
        cs = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
        cc = cairo.Context(cs)
        stt = character.perform(t, level, b.get("pose", "explain"), b.get("emo", "neutral"), seed=b["idx"])
        if shout:
            stt["emo"] = "angry" if int(t * 1.5) % 3 else "wow"
        stt["look"] = {"center": stt["look"] * 0.5, "right": -0.7, "left": 0.7}.get(ch["where"], 0.0)
        prev = beats[b["idx"] - 1] if b["idx"] > 0 else None
        enter = prev is None or prev.get("char", "center") != b.get("char", "center") or prev.get("shot") != b.get("shot")
        k = ease(tl / 0.45) if enter else 1.0
        character.draw(cc, ch["x"], ch["base"] + (1 - k) * 160, ch["sc"], stt)
        cine.drop_shadow(c, cs, -36 if ch["x"] >= 960 else 36, 6, 22, 0.42)
        c.set_source_surface(cs)
        c.paint()
    c.restore()
    for fn in f.ui:
        fn(c)
    if shout:
        k = clamp(tl / 0.4) * (0.55 + 0.25 * level + 0.1 * math.sin(t * 3))
        g = cairo.RadialGradient(W / 2, H / 2, H * 0.34, W / 2, H / 2, W * 0.62)
        g.add_color_stop_rgba(0, 1.0, 0.2, 0.22, 0)
        g.add_color_stop_rgba(1, 1.0, 0.2, 0.22, 0.65 * k)
        c.set_source(g)
        c.paint()
    flash = f.flash + (0.08 * (1 - tl / 0.15) if (tl < 0.15 and b["idx"] > 0) else 0.0)
    return cine.post(cine.to_np(surf), t, bloom=0.18, grain=1.0, flash=flash)
