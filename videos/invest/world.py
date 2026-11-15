"""Illustrated location: an evening street with Vasya's shawarma kiosk, drawn in world coordinates.
A continuous camera (cx, cy, zoom) flies over it; layers get parallax by depth."""
import math
import random
import numpy as np
import cairo

import art
from art import (W, H, INK, shape, ground, coin, block, tag, title, plain, fit, rrect_path, ell_path, poly_path, gloss,
                 ease, ease_io, ease_back, clamp, C, shade_of, light_of, person, F_BLACK, F_XB, F_SB)

STREET_Y = 860           # sidewalk line in world units


def squash(age, dur=0.35, k=0.28):
    """Squash & stretch after a landing at age=0: returns (sx, sy)."""
    if age < 0 or age > dur:
        return 1.0, 1.0
    u = age / dur
    a = k * math.sin(u * math.pi * 2.2) * (1 - u)
    return 1 + a, 1 - a


def sky(c, mood, t):
    """Evening sky; mood -> 0 calm sunset, 1 storm."""
    top = np.array([0.20, 0.10, 0.36]) * (1 - mood) + np.array([0.09, 0.08, 0.13]) * mood
    mid = np.array([0.78, 0.32, 0.46]) * (1 - mood) + np.array([0.22, 0.18, 0.26]) * mood
    low = np.array([1.00, 0.66, 0.42]) * (1 - mood) + np.array([0.32, 0.28, 0.34]) * mood
    g = cairo.LinearGradient(0, 0, 0, H)
    g.add_color_stop_rgb(0, *top)
    g.add_color_stop_rgb(0.55, *mid)
    g.add_color_stop_rgb(0.85, *low)
    c.rectangle(0, 0, W, H)
    c.set_source(g)
    c.fill()
    # sun glow
    if mood < 0.95:
        sx, sy = W * 0.32, H * 0.62
        rg = cairo.RadialGradient(sx, sy, 0, sx, sy, 520)
        rg.add_color_stop_rgba(0, 1, 0.92, 0.7, 0.75 * (1 - mood))
        rg.add_color_stop_rgba(0.18, 1, 0.8, 0.55, 0.45 * (1 - mood))
        rg.add_color_stop_rgba(1, 1, 0.6, 0.5, 0)
        c.set_source(rg)
        c.paint()
        ell_path(c, sx, sy, 90, 90)
        c.set_source_rgba(1, 0.95, 0.8, 0.9 * (1 - mood))
        c.fill()


_CLOUDS = [(0.1, 0.18, 1.0), (0.45, 0.10, 1.4), (0.75, 0.22, 0.9), (1.05, 0.14, 1.2), (1.35, 0.20, 1.0)]


def clouds(c, t, mood, pan):
    for u, v, s in _CLOUDS:
        x = (u * W * 1.2 + t * 14 * s - pan * 0.08) % (W * 1.5) - W * 0.25
        y = v * H
        col = np.array([1.0, 0.78, 0.82]) * (1 - mood) + np.array([0.30, 0.28, 0.36]) * mood

        def cl(q, x=x, y=y, s=s):
            for dx, dy, r in ((0, 0, 60), (70, -26, 74), (150, 0, 62), (80, 18, 66)):
                q.new_sub_path()
                q.arc(x + dx * s, y + dy * s, r * s, 0, 2 * math.pi)
        cl(c)
        c.set_source_rgba(*col, 0.75)
        c.fill()


rnd = random.Random(7)
FAR = []
_x = -600
while _x < 5200:
    w_ = rnd.randint(120, 260)
    FAR.append((_x, w_, rnd.randint(220, 480)))
    _x += w_ + rnd.randint(-20, 10)
MID = []
_x = -500
palette = [(0.93, 0.62, 0.50), (0.62, 0.52, 0.80), (0.95, 0.80, 0.55), (0.55, 0.72, 0.78), (0.86, 0.55, 0.66)]
while _x < 5200:
    w_ = rnd.randint(260, 420)
    MID.append((_x, w_, rnd.randint(330, 560), palette[len(MID) % len(palette)], rnd.random()))
    _x += w_ + rnd.randint(0, 40)


def far_city(c, mood):
    col = np.array([0.42, 0.20, 0.42]) * (1 - mood) + np.array([0.16, 0.14, 0.2]) * mood
    for x, w, h in FAR:
        rrect_path(c, x, STREET_Y - 120 - h, w, h + 130, 8)
    c.set_source_rgba(*col, 1)
    c.fill()
    for i, (x, w, h) in enumerate(FAR):
        for k in range(int(w / 40) * int(h / 50)):
            if (i * 31 + k * 17) % 9 > 2:
                continue
            cx = x + 16 + (k % int(w / 40)) * 40
            cy = STREET_Y - 100 - h + 20 + (k // int(w / 40)) * 50
            c.rectangle(cx, cy, 14, 18)
    c.set_source_rgba(1, 0.85, 0.55, 0.55)
    c.fill()


def mid_houses(c, t, mood, lights):
    for i, (x, w, h, col, r) in enumerate(MID):
        cc = np.array(col) * (1 - 0.6 * mood) + np.array([0.18, 0.17, 0.22]) * 0.6 * mood
        shape(c, lambda q, x=x, w=w, h=h: rrect_path(q, x, STREET_Y - h, w, h + 10, 6), tuple(cc), 1, shade=0.10, light=0.03, lw=4.5)
        # roof cornice
        shape(c, lambda q, x=x, w=w, h=h: rrect_path(q, x - 10, STREET_Y - h - 18, w + 20, 26, 6), tuple(shade_of(cc, 0.8)), 1,
              shade=0, light=0, lw=4)
        # windows
        cols, rows = int((w - 40) / 80), int((h - 160) / 95)
        for a in range(cols):
            for b in range(rows):
                wx = x + 30 + a * 80 + (w - 40 - cols * 80) / 2
                wy = STREET_Y - h + 40 + b * 95
                lit = ((i * 7 + a * 3 + b * 5) % 4 == 0) and lights > 0
                fill = (1.0, 0.86, 0.55) if lit else tuple(np.clip(np.array([0.36, 0.42, 0.62]) * (1 - mood * 0.5), 0, 1))
                shape(c, lambda q, wx=wx, wy=wy: rrect_path(q, wx, wy, 46, 60, 6), fill, 1, shade=0.2 if not lit else 0, light=0, lw=3.5)
                if not lit:
                    gloss(c, wx + 14, wy + 18, 6, 22, 0.25, 0.4)


def lamp(c, x, t, on=1.0):
    shape(c, lambda q: rrect_path(q, x - 9, STREET_Y - 430, 18, 430, 8), (0.25, 0.22, 0.32), 1, shade=0.3, lw=4)
    shape(c, lambda q: (q.move_to(x, STREET_Y - 430), q.curve_to(x, STREET_Y - 480, x + 70, STREET_Y - 480, x + 80, STREET_Y - 440)),
          (0.25, 0.22, 0.32), 1, shade=0, light=0, lw=10)
    shape(c, lambda q: rrect_path(q, x + 58, STREET_Y - 448, 46, 26, 10), (1.0, 0.85, 0.5) if on > 0.5 else (0.4, 0.4, 0.45), 1,
          shade=0.1, lw=4)
    if on > 0:
        rg = cairo.RadialGradient(x + 81, STREET_Y - 430, 0, x + 81, STREET_Y - 430, 260)
        rg.add_color_stop_rgba(0, 1, 0.85, 0.55, 0.40 * on)
        rg.add_color_stop_rgba(1, 1, 0.85, 0.55, 0)
        c.set_source(rg)
        c.arc(x + 81, STREET_Y - 430, 260, 0, 2 * math.pi)
        c.fill()


def tree(c, x, t, s=1.0):
    sw = 0.03 * math.sin(t * 1.3 + x)
    shape(c, lambda q: (q.move_to(x - 14 * s, STREET_Y), q.line_to(x - 10 * s, STREET_Y - 200 * s), q.line_to(x + 10 * s, STREET_Y - 200 * s),
                        q.line_to(x + 14 * s, STREET_Y)), "brown", 1, shade=0.3, lw=4)
    c.save()
    c.translate(x, STREET_Y - 220 * s)
    c.rotate(sw)
    for dx, dy, r, k in ((-60, 10, 80, 0.85), (60, 0, 85, 0.9), (0, -60, 100, 1.0)):
        shape(c, lambda q, dx=dx, dy=dy, r=r: ell_path(q, dx * s, dy * s, r * s, r * s * 0.9), tuple(np.array(C("green")) * k), 1,
              shade=0.18, light=0.06, lw=4.5)
    c.restore()


def street(c, mood):
    # sidewalk
    col = np.array([0.62, 0.52, 0.62]) * (1 - mood * 0.5)
    c.rectangle(-2000, STREET_Y, 9000, 70)
    c.set_source_rgb(*col)
    c.fill()
    c.rectangle(-2000, STREET_Y, 9000, 6)
    c.set_source_rgba(*INK, 1)
    c.fill()
    for k in range(-20, 80):
        c.rectangle(k * 120, STREET_Y + 8, 3, 60)
    c.set_source_rgba(*shade_of(col, 0.8), 1)
    c.fill()
    # curb + road
    c.rectangle(-2000, STREET_Y + 70, 9000, 18)
    c.set_source_rgb(*shade_of(col, 0.7))
    c.fill()
    road = np.array([0.24, 0.20, 0.30]) * (1 - mood * 0.3)
    c.rectangle(-2000, STREET_Y + 88, 9000, 400)
    c.set_source_rgb(*road)
    c.fill()
    for k in range(-20, 80):
        rrect_path(c, k * 260, STREET_Y + 170, 130, 14, 7)
    c.set_source_rgba(1, 0.9, 0.6, 0.6)
    c.fill()


def vasya(c, x, y, s, t, mood="happy", wave=0.0, alpha=1.0, look=0.0):
    """Vasya behind the counter (waist up): round body, white apron, chef cap, big moustache."""
    bob = 4 * math.sin(t * 3.0)
    c.save()
    c.translate(x, y + bob)
    c.scale(s, s)
    # body (t-shirt) + apron
    shape(c, lambda q: (q.move_to(-110, 40), q.curve_to(-120, -90, -70, -140, 0, -140), q.curve_to(70, -140, 120, -90, 110, 40),
                        q.close_path()), (0.36, 0.56, 0.92), alpha)
    shape(c, lambda q: rrect_path(q, -70, -110, 140, 160, 24), "white", alpha, shade=0.15)
    plain(c, "₽", 0, -20, 60, F_BLACK, (0.85, 0.3, 0.3), alpha)
    # arms
    for sx in (-1, 1):
        if sx == 1 and wave > 0:
            ang = -1.9 + 0.35 * math.sin(t * 12) * wave
            c.save()
            c.translate(95, -95)
            c.rotate(ang)
            shape(c, lambda q: rrect_path(q, -22, -10, 130, 44, 22), (0.36, 0.56, 0.92), alpha, shade=0.2, lw=4)
            shape(c, lambda q: ell_path(q, 130, 12, 30, 30), (1.0, 0.82, 0.68), alpha, shade=0.2, lw=4)
            c.restore()
        else:
            shape(c, lambda q, sx=sx: rrect_path(q, sx * 92 - 22, -100, 44, 120, 22), (0.36, 0.56, 0.92), alpha, shade=0.2, lw=4)
    # head
    hy = -205
    skin = (1.0, 0.82, 0.68)
    shape(c, lambda q: ell_path(q, 0, hy, 78, 74), skin, alpha, shade=0.2, light=0.06)
    ell_path(c, -50, hy + 22, 14, 9)
    c.set_source_rgba(1, 0.45, 0.45, 0.45 * alpha)
    c.fill()
    ell_path(c, 50, hy + 22, 14, 9)
    c.fill()
    # eyes with blink
    bl = 1.0 if (t % 3.3) < 0.12 else 0.0
    for ex in (-27, 27):
        if bl or mood == "happy" and False:
            c.move_to(ex - 10 + look * 6, hy - 6)
            c.line_to(ex + 10 + look * 6, hy - 6)
            c.set_line_width(5)
            c.set_source_rgba(*INK, alpha)
            c.stroke()
        else:
            shape(c, lambda q, ex=ex: ell_path(q, ex + look * 6, hy - 8, 9, 12), INK, alpha, shade=0, light=0, lw=1)
            ell_path(c, ex + 3 + look * 6, hy - 12, 3, 3)
            c.set_source_rgba(1, 1, 1, alpha)
            c.fill()
    # brows
    tilt = {"happy": -4, "sad": 10, "worried": 12, "proud": -8}.get(mood, 0)
    for sx in (-1, 1):
        c.move_to(sx * 42, hy - 32 + (tilt if sx > 0 else tilt))
        c.line_to(sx * 14, hy - 32 - tilt * (1 if mood in ("sad", "worried") else -0.3))
        c.set_line_width(8)
        c.set_source_rgba(0.35, 0.22, 0.14, alpha)
        c.stroke()
    # nose + moustache + mouth
    shape(c, lambda q: ell_path(q, 0, hy + 12, 18, 15), (1.0, 0.72, 0.6), alpha, shade=0.2, lw=4)
    shape(c, lambda q: (q.move_to(0, hy + 26), q.curve_to(-20, hy + 18, -60, hy + 22, -66, hy + 44), q.curve_to(-40, hy + 40, -16, hy + 44, 0, hy + 36),
                        q.curve_to(16, hy + 44, 40, hy + 40, 66, hy + 44), q.curve_to(60, hy + 22, 20, hy + 18, 0, hy + 26)),
          (0.40, 0.25, 0.15), alpha, shade=0.15, lw=4)
    if mood in ("happy", "proud"):
        shape(c, lambda q: (q.move_to(-26, hy + 48), q.curve_to(-14, hy + 72, 14, hy + 72, 26, hy + 48), q.close_path()), (0.4, 0.1, 0.12), alpha,
              shade=0, light=0, lw=4)
    else:
        c.move_to(-20, hy + 62)
        c.curve_to(-8, hy + 52, 8, hy + 52, 20, hy + 62)
        c.set_line_width(5)
        c.set_source_rgba(*INK, alpha)
        c.stroke()
    if mood == "worried":
        shape(c, lambda q: (q.move_to(70, hy - 50), q.curve_to(62, hy - 30, 64, hy - 20, 72, hy - 20), q.curve_to(80, hy - 20, 82, hy - 30, 70, hy - 50)),
              (0.6, 0.85, 1.0), alpha, lw=3)
    # chef cap
    shape(c, lambda q: rrect_path(q, -62, hy - 92, 124, 34, 10), "white", alpha, shade=0.15, lw=4.5)
    shape(c, lambda q: (q.new_sub_path(), q.arc(-36, hy - 112, 34, 0, 2 * math.pi), q.new_sub_path(), q.arc(0, hy - 128, 40, 0, 2 * math.pi),
                        q.new_sub_path(), q.arc(36, hy - 112, 34, 0, 2 * math.pi)), "white", alpha, shade=0.15, lw=4.5)
    c.restore()


def kiosk(c, x, s, t, closed=0.0, light=1.0, slices=0.0, missing=None, grow=1.0, tape=0.0):
    """Vasya's kiosk standing on the sidewalk at world x. slices: 0..1 draws the 10x10 share grid over it."""
    y = STREET_Y
    s = s * grow
    w, h = 520 * s, 380 * s
    ground(c, x, y + 4, w * 0.62, 0.45)
    body = lambda q: rrect_path(q, x - w / 2, y - h, w, h, 16 * s)
    shape(c, body, (0.96, 0.88, 0.74), 1, shade=0.10)
    win = (x - w * 0.40, y - h * 0.82, w * 0.80, h * 0.46)
    lit = light * (1 - closed)
    shape(c, lambda q: rrect_path(q, *win, 12 * s), (0.45 + 0.55 * lit, 0.40 + 0.45 * lit, 0.45), 1, shade=0.08, light=0.0)
    if lit > 0:
        rg = cairo.RadialGradient(x, y - h * 0.6, 0, x, y - h * 0.6, w * 0.8)
        rg.add_color_stop_rgba(0, 1, 0.85, 0.5, 0.35 * lit)
        rg.add_color_stop_rgba(1, 1, 0.85, 0.5, 0)
        c.set_source(rg)
        c.arc(x, y - h * 0.6, w * 0.8, 0, 2 * math.pi)
        c.fill()
    # counter
    shape(c, lambda q: rrect_path(q, x - w * 0.53, y - h * 0.36, w * 1.06, 38 * s, 8 * s), (0.58, 0.38, 0.26), 1, shade=0.3)
    # awning stripes
    aw = y - h - 8 * s
    n = 8
    for i in range(n):
        x0 = x - w * 0.56 + i * w * 1.12 / n
        x1 = x0 + w * 1.12 / n
        col = (0.95, 0.34, 0.37) if i % 2 == 0 else (0.99, 0.95, 0.88)
        flap = 4 * s * math.sin(t * 3 + i)
        shape(c, lambda q, x0=x0, x1=x1, flap=flap: (q.move_to(x0 + 10 * s, aw - 64 * s), q.line_to(x1 + 10 * s, aw - 64 * s), q.line_to(x1, aw + 22 * s),
                                                     q.curve_to(x1, aw + 50 * s + flap, x0, aw + 50 * s + flap, x0, aw + 22 * s), q.close_path()),
              col, 1, shade=0.18, light=0.05, lw=4)
    sb = (x - w * 0.46, aw - 160 * s, w * 0.92, 90 * s)
    shape(c, lambda q: rrect_path(q, *sb, 16 * s), (0.20, 0.12, 0.26), 1, shade=0.12)
    on = lit > 0.5 or (closed > 0 and int(t * 9) % 3 == 0 and closed < 0.8)
    title(c, "ШАУРМА У ВАСИ", x, aw - 160 * s + 64 * s, fit(c, "ШАУРМА У ВАСИ", 54 * s, w * 0.82), "gold" if on else "grey", 1)
    if on:
        rg = cairo.RadialGradient(x, aw - 115 * s, 0, x, aw - 115 * s, w * 0.6)
        rg.add_color_stop_rgba(0, 1, 0.8, 0.3, 0.25)
        rg.add_color_stop_rgba(1, 1, 0.8, 0.3, 0)
        c.set_source(rg)
        c.arc(x, aw - 115 * s, w * 0.6, 0, 2 * math.pi)
        c.fill()
    # 10x10 share grid
    gx0, gy0, gw, gh = x - w / 2, aw - 64 * s, w, y - (aw - 64 * s)
    if slices > 0:
        c.set_line_width(4)
        c.set_source_rgba(1, 1, 1, 0.85)
        k = ease_io(slices)
        for i in range(1, 10):
            xx = gx0 + gw * i / 10
            c.move_to(xx, gy0)
            c.line_to(xx, gy0 + gh * k)
            yy = gy0 + gh * i / 10
            c.move_to(gx0, yy)
            c.line_to(gx0 + gw * k, yy)
        c.stroke()
    if missing is not None:
        mi, mj = missing
        rrect_path(c, gx0 + gw * mi / 10, gy0 + gh * mj / 10, gw / 10, gh / 10, 4)
        c.set_source_rgba(0.1, 0.05, 0.12, 0.85)
        c.fill()
    if tape > 0:
        c.save()
        c.translate(x, y - h * 0.55)
        c.rotate(-0.16)
        L = w * 1.25 * ease_back(clamp(tape / 0.4))
        shape(c, lambda q: q.rectangle(-L / 2, -36 * s, L, 72 * s), (1.0, 0.86, 0.15), 1, shade=0.15, lw=4)
        if tape > 0.3:
            plain(c, "ЗАКРЫТО · САНЭПИДЕМСТАНЦИЯ", 0, 18 * s, fit(c, "ЗАКРЫТО · САНЭПИДЕМСТАНЦИЯ", 46 * s, L * 0.9), F_BLACK, INK, 1)
        c.restore()
    return (gx0, gy0, gw, gh)


def share_tile(c, x, y, size, t, color="gold", rot=0.0, sx=1.0, sy=1.0, label=None, crack=0.0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(sx, sy)
    shape(c, lambda q: rrect_path(q, -size / 2, -size / 2, size, size, size * 0.14), color, 1, shade=0.18, light=0.08)
    gloss(c, -size * 0.22, -size * 0.25, size * 0.25, size * 0.08, 0.6, -0.5)
    if label:
        plain(c, label, 0, size * 0.09, size * 0.24, F_BLACK, shade_of(color, 0.5), 1)
    if crack > 0:
        c.move_to(-size * 0.1, -size / 2)
        pts = [(-size * 0.02, -size * 0.2), (-size * 0.16, 0), (size * 0.05, size * 0.18), (-size * 0.04, size / 2)]
        for i, p in enumerate(pts):
            if i / len(pts) < crack:
                c.line_to(*p)
        c.set_line_width(5)
        c.set_source_rgba(*INK, 1)
        c.stroke()
    c.restore()


def tower(c, x, w, h, name, color, alpha=1.0):
    """Big company tower rising from the street (simple glassy skyscraper with a name sign)."""
    y = STREET_Y
    ground(c, x, y + 4, w * 0.7, 0.4 * alpha)
    shape(c, lambda q: rrect_path(q, x - w / 2, y - h, w, h + 8, 12), color, alpha, shade=0.12, light=0.04)
    c.save()
    rrect_path(c, x - w / 2, y - h, w, h, 12)
    c.clip()
    for r in range(int(h / 60)):
        for k in range(int(w / 50)):
            c.rectangle(x - w / 2 + 14 + k * 50, y - h + 90 + r * 60, 30, 34)
    c.set_source_rgba(1, 1, 1, 0.22 * alpha)
    c.fill()
    c.restore()
    shape(c, lambda q: rrect_path(q, x - w * 0.46, y - h - 70, w * 0.92, 80, 14), (0.16, 0.12, 0.22), alpha, shade=0.1)
    title(c, name, x, y - h - 12, fit(c, name, 52, w * 0.82), "white", alpha)


def rain(c, t, k):
    if k <= 0:
        return
    rnd_ = random.Random(3)
    c.set_line_width(2.5)
    for i in range(160):
        x0 = rnd_.random() * (W + 300)
        sp = 900 + rnd_.random() * 500
        y0 = (rnd_.random() * H + t * sp) % (H + 100) - 50
        c.move_to(x0 - y0 * 0.15, y0)
        c.line_to(x0 - y0 * 0.15 - 8, y0 + 34)
    c.set_source_rgba(0.75, 0.82, 1.0, 0.45 * k)
    c.stroke()


def confetti(c, x, y, age, n=40, seed=1):
    if age < 0 or age > 2.2:
        return
    rnd_ = random.Random(seed)
    for i in range(n):
        a = rnd_.uniform(-math.pi, 0)
        sp = rnd_.uniform(500, 1100)
        vx, vy = math.cos(a) * sp, math.sin(a) * sp
        px = x + vx * age
        py = y + vy * age + 900 * age * age
        col = rnd_.choice(["gold", "pink", "green", "blue", "purple"])
        c.save()
        c.translate(px, py)
        c.rotate(age * rnd_.uniform(4, 12))
        c.rectangle(-9, -5, 18, 10)
        c.set_source_rgba(*C(col), clamp(2.2 - age))
        c.fill()
        c.restore()


def piggy(c, x, y, s, age_hit=-1.0):
    sx, sy = squash(age_hit, 0.4, 0.18)
    c.save()
    c.translate(x, y)
    c.scale(s * sx, s * sy)
    ground(c, 0, 4, 110, 0.4)
    pink = (1.0, 0.62, 0.72)
    for lx in (-50, 40):
        shape(c, lambda q, lx=lx: rrect_path(q, lx, -40, 26, 40, 8), shade_of(pink, 0.85), 1, shade=0.2, lw=4)
    shape(c, lambda q: ell_path(q, 0, -95, 110, 80), pink, 1, shade=0.2, light=0.07)
    shape(c, lambda q: ell_path(q, 100, -95, 26, 24), shade_of(pink, 0.9), 1, shade=0.2, lw=4)
    for nx in (93, 107):
        ell_path(c, nx, -95, 4, 6)
        c.set_source_rgba(*INK, 1)
        c.fill()
    shape(c, lambda q: poly_path(q, [(30, -165), (55, -200), (70, -160)]), pink, 1, shade=0.2, lw=4)
    ell_path(c, 55, -115, 6, 8)
    c.set_source_rgba(*INK, 1)
    c.fill()
    shape(c, lambda q: rrect_path(q, -30, -178, 60, 12, 6), INK, 1, shade=0, light=0, lw=1)
    c.restore()
