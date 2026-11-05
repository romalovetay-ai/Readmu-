"""Hand-drawn gag inserts (replace movie/meme clips). Each gag draws inside a rounded 'screen' card.

draw_gag(ctx, kind, tl, t, x, y, w, h): tl = seconds since the beat started.
All art is original vector drawing in the channel's flat style: 7 px outlines, cel shading, soft shadows.
"""
import math
import random
import cairo

import gfx
from gfx import rgba, rrect, text, ease, ease_back, clamp, WHITE, RED, GREEN, GOLD, F_XB, F_BLACK, F_SB

OUT = (0.09, 0.08, 0.10)
SKIN = (0.96, 0.80, 0.68)
MONEY = (0.55, 0.78, 0.45)
MONEY_D = (0.35, 0.58, 0.30)


def fs(ctx, fill, lw=6, a=1.0):
    rgba(ctx, fill, a)
    ctx.fill_preserve()
    rgba(ctx, OUT)
    ctx.set_line_width(lw)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.stroke()


def ell(ctx, x, y, rx, ry):
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(rx, ry)
    ctx.new_sub_path()
    ctx.arc(0, 0, 1, 0, 2 * math.pi)
    ctx.restore()


def shadow(ctx, x, y, rx, ry=None, a=0.25):
    ell(ctx, x, y, rx, ry or rx * 0.22)
    rgba(ctx, (0, 0, 0), a)
    ctx.fill()


# ------------------------------------------------------------------ reusable props
def banknote(ctx, x, y, s=1.0, ang=0.0):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    rrect(ctx, -70, -34, 140, 68, 8)
    fs(ctx, MONEY, 4)
    rrect(ctx, -60, -24, 120, 48, 6)
    rgba(ctx, MONEY_D)
    ctx.set_line_width(2.5)
    ctx.stroke()
    ell(ctx, 0, 0, 18, 18)
    rgba(ctx, (0.80, 0.92, 0.72))
    ctx.fill()
    text(ctx, "₽", 0, 10, 28, F_BLACK, MONEY_D, shadow=False)
    ctx.restore()


def coin(ctx, x, y, r=22):
    ell(ctx, x, y, r, r)
    g = cairo.RadialGradient(x - r * 0.3, y - r * 0.3, 1, x, y, r)
    g.add_color_stop_rgb(0, 1, 0.93, 0.55)
    g.add_color_stop_rgb(1, 0.85, 0.62, 0.15)
    ctx.set_source(g)
    ctx.fill_preserve()
    rgba(ctx, OUT)
    ctx.set_line_width(4)
    ctx.stroke()
    text(ctx, "₽", x, y + r * 0.38, r * 1.05, F_BLACK, (0.62, 0.42, 0.05), shadow=False)


def phone(ctx, x, y, s=1.0, ang=0.0, screen=(0.25, 0.55, 0.95)):
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(ang)
    ctx.scale(s, s)
    rrect(ctx, -46, -90, 92, 180, 18)
    fs(ctx, (0.20, 0.20, 0.24), 5)
    rrect(ctx, -38, -80, 76, 160, 12)
    g = cairo.LinearGradient(0, -80, 0, 80)
    g.add_color_stop_rgb(0, *screen)
    g.add_color_stop_rgb(1, screen[0] * 0.5, screen[1] * 0.4, screen[2] * 0.7)
    ctx.set_source(g)
    ctx.fill()
    rrect(ctx, -14, -76, 28, 8, 4)
    rgba(ctx, (0.05, 0.05, 0.06))
    ctx.fill()
    ctx.move_to(-30, -60)
    ctx.line_to(10, -80)
    ctx.line_to(30, -80)
    ctx.line_to(-30, -30)
    ctx.close_path()
    rgba(ctx, WHITE, 0.15)
    ctx.fill()
    ctx.restore()


def mini_guy(ctx, x, y, s=1.0, mood="neutral", look=0.0, hair=(0.40, 0.28, 0.18), shirt=(0.30, 0.45, 0.70), t=0.0):
    """Small background character (not the narrator): round head, simple body."""
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s, s)
    rrect(ctx, -60, 20, 120, 140, 50)
    fs(ctx, shirt, 6)
    ell(ctx, 0, -40, 62, 66)
    fs(ctx, SKIN, 6)
    ctx.move_to(-62, -50)
    ctx.curve_to(-60, -120, 60, -120, 62, -50)
    ctx.curve_to(30, -80, -30, -80, -62, -50)
    fs(ctx, hair, 6)
    for sx in (-1, 1):
        ell(ctx, sx * 22 + look * 6, -38, 9, 11)
        rgba(ctx, OUT)
        ctx.fill()
    ctx.set_line_width(5)
    if mood == "sad":
        ctx.move_to(-18, 2)
        ctx.curve_to(-6, -10, 6, -10, 18, 2)
    elif mood == "happy":
        ctx.move_to(-20, -6)
        ctx.curve_to(-8, 10, 8, 10, 20, -6)
    elif mood == "angry":
        ctx.move_to(-20, 0)
        ctx.line_to(20, 0)
        for sx in (-1, 1):
            ctx.move_to(sx * 34, -64)
            ctx.line_to(sx * 10, -54)
    else:
        ctx.move_to(-14, -2)
        ctx.line_to(14, -2)
    rgba(ctx, OUT)
    ctx.stroke()
    ctx.restore()


def screen_card(ctx, x, y, w, h, tl, draw_inside, tint=(0.10, 0.10, 0.14)):
    """Rounded 'clip' card with drop shadow, slide-in, subtle film grain and a glossy top edge."""
    a, oy = gfx.card(ctx, x, y, w, h, tl, fill=tint, r=30)
    ctx.save()
    rrect(ctx, x, y + oy, w, h, 30)
    ctx.clip()
    ctx.translate(x, y + oy)
    draw_inside(ctx, w, h)
    rnd = random.Random(int(tl * 24))
    for _ in range(90):
        ctx.rectangle(rnd.random() * w, rnd.random() * h, 2, 2)
        rgba(ctx, WHITE, rnd.random() * 0.08)
        ctx.fill()
    g = cairo.LinearGradient(0, 0, 0, h * 0.4)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.08)
    g.add_color_stop_rgba(1, 1, 1, 1, 0)
    ctx.set_source(g)
    ctx.paint()
    ctx.restore()
    rrect(ctx, x, y + oy, w, h, 30)
    rgba(ctx, OUT)
    ctx.set_line_width(8)
    ctx.stroke()


def room_bg(ctx, w, h, wall=(0.86, 0.80, 0.70), floor=(0.55, 0.40, 0.28)):
    ctx.rectangle(0, 0, w, h * 0.72)
    rgba(ctx, wall)
    ctx.fill()
    for k in range(0, int(w), 46):
        ctx.rectangle(k, 0, 2, h * 0.72)
    rgba(ctx, (0, 0, 0), 0.04)
    ctx.fill()
    ctx.rectangle(0, h * 0.72, w, h * 0.28)
    rgba(ctx, floor)
    ctx.fill()
    for k in range(0, int(w), 90):
        ctx.move_to(k, h * 0.72)
        ctx.line_to(k - 60, h)
    rgba(ctx, (0, 0, 0), 0.12)
    ctx.set_line_width(3)
    ctx.stroke()


def sky_bg(ctx, w, h, top=(0.45, 0.70, 0.95), bottom=(0.85, 0.92, 0.98)):
    g = cairo.LinearGradient(0, 0, 0, h)
    g.add_color_stop_rgb(0, *top)
    g.add_color_stop_rgb(1, *bottom)
    ctx.set_source(g)
    ctx.paint()


# ------------------------------------------------------------------ gags
def g_dream(ctx, w, h, tl, t):
    """Younger self dreaming on a balcony: thought cloud with a pile of cash and a smoothie."""
    sky_bg(ctx, w, h, (0.98, 0.70, 0.45), (1.0, 0.88, 0.70))
    ell(ctx, w * 0.82, h * 0.25, 70, 70)
    rgba(ctx, (1, 0.95, 0.7))
    ctx.fill()
    for i in range(6):
        gfx.panel_building(ctx, i * w / 6, h * 0.45 + (i % 3) * 30, w / 6 - 10, h, 8, 3, lit=0.0,
                           color=(0.80, 0.55, 0.45), seed=i)
    ctx.rectangle(0, h * 0.78, w, h * 0.22)
    rgba(ctx, (0.55, 0.55, 0.60))
    ctx.fill()
    for k in range(0, int(w), 40):
        ctx.rectangle(k, h * 0.70, 10, h * 0.08)
    rgba(ctx, (0.40, 0.40, 0.45))
    ctx.fill()
    mini_guy(ctx, w * 0.30, h * 0.62, 1.0, "happy", 0.5, hair=(0.96, 0.84, 0.47), shirt=(0.85, 0.35, 0.30), t=t)
    k = max(0.02, ease(tl / 0.8))
    for i, (dx, dy, r) in enumerate(((60, -110, 10), (90, -150, 16))):
        ell(ctx, w * 0.30 + dx, h * 0.62 + dy, r * k, r * k)
        fs(ctx, WHITE, 4)
    cx, cy = w * 0.62, h * 0.30
    ctx.save()
    ctx.translate(cx, cy)
    ctx.scale(k, k)
    for (dx, dy, r) in ((-120, 10, 80), (-40, -40, 95), (60, -20, 90), (130, 20, 70), (0, 50, 90), (-90, 60, 60), (90, 60, 65)):
        ell(ctx, dx, dy, r, r * 0.8)
    rgba(ctx, WHITE)
    ctx.fill_preserve()
    rgba(ctx, OUT)
    ctx.set_line_width(6)
    ctx.stroke()
    for (dx, dy, r) in ((-120, 10, 80), (-40, -40, 95), (60, -20, 90), (130, 20, 70), (0, 50, 90), (-90, 60, 60), (90, 60, 65)):
        ell(ctx, dx, dy, r - 6, r * 0.8 - 6)
    rgba(ctx, WHITE)
    ctx.fill()
    for i in range(6):
        banknote(ctx, -60 + (i % 3) * 50, 20 - (i // 3) * 22 - i * 3, 0.7, -0.1 + 0.06 * i)
    text(ctx, "1 000 000 ₽", 20, -55, 44, F_BLACK, MONEY_D, shadow=False)
    ctx.restore()


def g_wallet(ctx, w, h, tl, t):
    """Opened wallet with a sad single coin, a moth flies out."""
    rgba(ctx, (0.18, 0.14, 0.16))
    ctx.paint()
    cx, cy = w / 2, h * 0.58
    shadow(ctx, cx, cy + 150, 260, 30)
    rrect(ctx, cx - 250, cy - 120, 500, 260, 30)
    fs(ctx, (0.45, 0.26, 0.16), 7)
    rrect(ctx, cx - 230, cy - 160, 460, 120, 24)
    fs(ctx, (0.55, 0.33, 0.20), 7)
    ctx.save()
    ctx.set_dash([10, 8])
    rrect(ctx, cx - 230, cy - 100, 460, 220, 22)
    rgba(ctx, (0.85, 0.65, 0.40))
    ctx.set_line_width(3)
    ctx.stroke()
    ctx.restore()
    coin(ctx, cx + 120, cy + 60, 26)
    # moth fluttering out
    k = clamp(tl / 2.5)
    mx = cx - 40 + 260 * k + 20 * math.sin(t * 9)
    my = cy - 180 - 180 * k + 25 * math.sin(t * 6)
    flap = 0.5 + 0.5 * math.sin(t * 28)
    for sx in (-1, 1):
        ctx.save()
        ctx.translate(mx, my)
        ctx.scale(sx, 1)
        ctx.move_to(0, 0)
        ctx.curve_to(30, -40 * flap - 10, 70, -20, 60, 10)
        ctx.curve_to(40, 20, 20, 15, 0, 0)
        fs(ctx, (0.80, 0.75, 0.62), 4)
        ctx.restore()
    ell(ctx, mx, my, 8, 18)
    fs(ctx, (0.55, 0.48, 0.38), 4)
    text(ctx, "−1 000 000 ₽ ВЗНОС?", cx, 90, 52, F_BLACK, RED, glow=0.3)


def g_car(ctx, w, h, tl, t):
    """Showroom: bare budget car with a price tag 'без подушек', a sofa cushion on the roof."""
    room_bg(ctx, w, h, (0.88, 0.90, 0.94), (0.70, 0.72, 0.76))
    for k in range(5):
        ell(ctx, 160 + k * 260, 30, 80, 14)
        rgba(ctx, (1, 1, 0.9), 0.8)
        ctx.fill()
    cx, cy = w * 0.45, h * 0.62
    shadow(ctx, cx, cy + 110, 330, 30, 0.3)
    ctx.move_to(cx - 330, cy + 60)
    ctx.line_to(cx - 330, cy)
    ctx.curve_to(cx - 300, cy - 40, cx - 200, cy - 50, cx - 150, cy - 60)
    ctx.line_to(cx - 80, cy - 150)
    ctx.line_to(cx + 140, cy - 150)
    ctx.line_to(cx + 220, cy - 60)
    ctx.curve_to(cx + 300, cy - 50, cx + 330, cy - 20, cx + 330, cy + 60)
    ctx.close_path()
    fs(ctx, (0.88, 0.88, 0.86), 7)
    ctx.move_to(cx - 60, cy - 135)
    ctx.line_to(cx + 20, cy - 135)
    ctx.line_to(cx + 20, cy - 65)
    ctx.line_to(cx - 125, cy - 65)
    ctx.close_path()
    fs(ctx, (0.55, 0.70, 0.82), 5)
    ctx.move_to(cx + 40, cy - 135)
    ctx.line_to(cx + 130, cy - 135)
    ctx.line_to(cx + 195, cy - 65)
    ctx.line_to(cx + 40, cy - 65)
    ctx.close_path()
    fs(ctx, (0.55, 0.70, 0.82), 5)
    for wx in (cx - 200, cx + 200):
        ell(ctx, wx, cy + 60, 62, 62)
        fs(ctx, (0.15, 0.15, 0.17), 7)
        ell(ctx, wx, cy + 60, 28, 28)
        fs(ctx, (0.75, 0.75, 0.78), 4)
    # cushion on the roof (the joke)
    k = ease_back((tl - 1.2) / 0.5)
    if k > 0:
        ctx.save()
        ctx.translate(cx + 30, cy - 175 - (1 - k) * 200)
        rrect(ctx, -70, -26, 140, 52, 24)
        fs(ctx, (0.85, 0.40, 0.45), 5)
        for sx in (-1, 0, 1):
            ell(ctx, sx * 35, 0, 4, 4)
            rgba(ctx, OUT)
            ctx.fill()
        ctx.restore()
    # price tag
    ctx.save()
    ctx.translate(w * 0.80, h * 0.30)
    ctx.rotate(0.08 * math.sin(t * 1.5))
    ctx.move_to(0, -60)
    ctx.line_to(0, 0)
    rgba(ctx, OUT)
    ctx.set_line_width(3)
    ctx.stroke()
    rrect(ctx, -130, 0, 260, 150, 14)
    fs(ctx, (1, 0.95, 0.6), 5)
    text(ctx, "999 900 ₽", 0, 60, 46, F_BLACK, OUT, shadow=False)
    text(ctx, "без подушек", 0, 110, 32, F_XB, RED, shadow=False)
    ctx.restore()


def g_pension(ctx, w, h, tl, t):
    """Old guy at a bank counter gets a tiny receipt; long queue fades behind."""
    room_bg(ctx, w, h, (0.82, 0.86, 0.82), (0.50, 0.46, 0.40))
    for i in range(5):
        mini_guy(ctx, w * 0.85 - i * 110, h * 0.64 - i * 6, 0.62 - i * 0.05, "sad", -0.5, hair=(0.85, 0.85, 0.85),
                 shirt=(0.45 + i * 0.05, 0.42, 0.40))
    rrect(ctx, 40, h * 0.42, w * 0.38, h * 0.5, 10)
    fs(ctx, (0.62, 0.48, 0.36), 6)
    text(ctx, "КАССА", 40 + w * 0.19, h * 0.42 + 60, 40, F_BLACK, WHITE, shadow=False)
    mini_guy(ctx, w * 0.50, h * 0.66, 0.9, "sad", -1, hair=(0.92, 0.92, 0.92), shirt=(0.40, 0.38, 0.48))
    k = clamp((tl - 0.6) / 1.2)
    ctx.save()
    ctx.translate(w * 0.38, h * 0.50 - 40 * k)
    ctx.rotate(-0.15)
    rrect(ctx, -70, -40, 140, 80 + 60 * k, 6)
    fs(ctx, WHITE, 4)
    text(ctx, "ПЕНСИЯ", 0, -8, 24, F_XB, OUT, shadow=False)
    text(ctx, "?", 0, 40, 48 * k + 1, F_BLACK, RED, shadow=False)
    ctx.restore()


def g_rules(ctx, w, h, tl, t):
    """A board game whose rule card keeps being rewritten: crossed numbers, red marker."""
    rgba(ctx, (0.18, 0.40, 0.30))
    ctx.paint()
    rrect(ctx, w * 0.1, h * 0.15, w * 0.8, h * 0.72, 20)
    fs(ctx, (0.97, 0.94, 0.86), 7)
    text(ctx, "ПРАВИЛА ИГРЫ «ПЕНСИЯ»", w / 2, h * 0.15 + 70, 46, F_BLACK, OUT, shadow=False)
    rows = [("ВОЗРАСТ ВЫХОДА", "60", "65"), ("БАЛЛЫ", "—", "30"), ("СТАЖ", "5 лет", "15 лет")]
    for i, (lab, old, new) in enumerate(rows):
        y = h * 0.15 + 160 + i * 110
        text(ctx, lab, w * 0.15, y, 40, F_XB, OUT, align="left", shadow=False)
        text(ctx, old, w * 0.62, y, 44, F_BLACK, (0.3, 0.3, 0.3), shadow=False)
        a = tl - 0.7 - i * 0.6
        if a > 0:
            k = ease(a / 0.3)
            ctx.move_to(w * 0.62 - 60, y - 14)
            ctx.line_to(w * 0.62 - 60 + 120 * k, y - 18)
            rgba(ctx, RED)
            ctx.set_line_width(8)
            ctx.stroke()
            gfx.pop_text(ctx, new, w * 0.80, y, 50, a - 0.2, F_BLACK, RED)


def g_rain(ctx, w, h, tl, t):
    """Banknotes raining on a happy desk; the 'shef' sits sad in the corner."""
    room_bg(ctx, w, h, (0.80, 0.86, 0.92), (0.50, 0.42, 0.36))
    rnd = random.Random(3)
    for i in range(26):
        x0 = rnd.uniform(0, w)
        sp = rnd.uniform(120, 220)
        y = (rnd.uniform(-h, 0) + tl * sp) % (h + 100) - 80
        banknote(ctx, x0 + 30 * math.sin(t * 2 + i), y, 0.55, math.sin(t * 2.5 + i) * 0.6)
    rrect(ctx, w * 0.2, h * 0.70, w * 0.6, 40, 8)
    fs(ctx, (0.55, 0.38, 0.25), 6)
    for i in range(5):
        banknote(ctx, w * 0.35 + i * 30, h * 0.66 - i * 10, 0.8, -0.05 * i)
    text(ctx, "+130 000 ₽ / ГОД", w / 2, 90, 56, F_BLACK, GREEN, glow=0.5)


def g_boss(ctx, w, h, tl, t):
    """Angry boss at a desk tears the 'ПРЕМИЯ' sheet in half."""
    room_bg(ctx, w, h, (0.75, 0.78, 0.82), (0.42, 0.36, 0.32))
    rrect(ctx, w * 0.18, h * 0.62, w * 0.64, 60, 10)
    fs(ctx, (0.40, 0.28, 0.20), 6)
    mini_guy(ctx, w * 0.5, h * 0.48, 1.25, "angry", 0, hair=(0.30, 0.25, 0.22), shirt=(0.25, 0.25, 0.30))
    for sx in (-1, 1):
        ctx.move_to(w * 0.5 + sx * 60, h * 0.48 - 150)
        ctx.line_to(w * 0.5 + sx * 80, h * 0.48 - 200)
        rgba(ctx, RED, 0.6 + 0.4 * math.sin(t * 12))
        ctx.set_line_width(6)
        ctx.stroke()
    k = ease(clamp((tl - 1.0) / 0.6))
    for side in (-1, 1):
        ctx.save()
        ctx.translate(w * 0.5 + side * (20 + 120 * k), h * 0.60 - 40 * k)
        ctx.rotate(side * 0.4 * k)
        ctx.move_to(0, -70)
        ctx.line_to(side * 110, -70)
        ctx.line_to(side * 110, 70)
        ctx.line_to(0, 70)
        for j in range(6):
            ctx.line_to(side * (8 if j % 2 else -6), 70 - j * 28)
        ctx.close_path()
        fs(ctx, WHITE, 4)
        text(ctx, "ПРЕМ" if side < 0 else "ИЯ", side * 55, 12, 36, F_BLACK, RED, shadow=False)
        ctx.restore()


def g_shawarma(ctx, w, h, tl, t):
    """'Chance' as a shawarma with an expiry sticker; stink lines appear."""
    rgba(ctx, (0.22, 0.20, 0.22))
    ctx.paint()
    cx, cy = w / 2, h * 0.56
    shadow(ctx, cx, cy + 170, 220, 26)
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(-0.25)
    rrect(ctx, -90, -160, 180, 330, 80)
    fs(ctx, (0.93, 0.82, 0.62), 7)
    for k in range(5):
        ctx.move_to(-80, -110 + k * 55)
        ctx.curve_to(-20, -100 + k * 55, 20, -120 + k * 55, 80, -105 + k * 55)
    rgba(ctx, (0.78, 0.62, 0.40))
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.move_to(-90, -150)
    ctx.curve_to(-60, -210, 60, -210, 90, -150)
    fs(ctx, (0.45, 0.70, 0.30), 6)
    for i in range(5):
        ell(ctx, -50 + i * 25, -165 - (i % 2) * 10, 14, 10)
        fs(ctx, (0.85, 0.30, 0.25) if i % 2 else (0.55, 0.80, 0.35), 3)
    ctx.restore()
    rrect(ctx, cx + 70, cy - 40, 250, 110, 12)
    fs(ctx, (1, 0.95, 0.6), 5)
    text(ctx, "ШАНС", cx + 195, cy + 5, 38, F_BLACK, OUT, shadow=False)
    text(ctx, "годен до: вчера", cx + 195, cy + 48, 26, F_XB, RED, shadow=False)
    if tl > 1.2:
        for i in range(3):
            ph = t * 2 + i
            ctx.move_to(cx - 60 + i * 50, cy - 230)
            for j in range(6):
                ctx.line_to(cx - 60 + i * 50 + 14 * math.sin(ph + j), cy - 230 - j * 18)
            rgba(ctx, (0.55, 0.75, 0.40), 0.8)
            ctx.set_line_width(5)
            ctx.stroke()


def g_wave(ctx, w, h, tl, t):
    """The narrator waves goodbye to a train named 'ШАНС' leaving the platform."""
    import character
    sky_bg(ctx, w, h, (0.70, 0.82, 0.95), (0.95, 0.95, 0.98))
    ctx.rectangle(0, h * 0.62, w, h * 0.38)
    rgba(ctx, (0.55, 0.55, 0.58))
    ctx.fill()
    for k in range(0, int(w), 60):
        ctx.rectangle(k, h * 0.72, 40, 10)
    rgba(ctx, (0.35, 0.30, 0.28))
    ctx.fill()
    x = w * 0.28 + tl * 90
    rrect(ctx, x, h * 0.30, 520, 220, 30)
    fs(ctx, (0.85, 0.25, 0.25), 7)
    for i in range(4):
        rrect(ctx, x + 40 + i * 115, h * 0.30 + 40, 90, 70, 10)
        fs(ctx, (0.75, 0.88, 0.98), 4)
    text(ctx, "ШАНС", x + 260, h * 0.30 + 180, 52, F_BLACK, WHITE, shadow=False)
    for wx in (x + 90, x + 430):
        ell(ctx, wx, h * 0.30 + 225, 34, 34)
        fs(ctx, (0.2, 0.2, 0.22), 6)
    character.draw(ctx, w * 0.17, h + 30, 0.42, {"pose": "explain", "emo": "sad", "t": t, "level": 0.5, "look": 1.0})


def g_accidents(ctx, w, h, tl, t):
    """Three panels pop in: broken car, aching tooth, flooded ceiling."""
    rgba(ctx, (0.16, 0.15, 0.18))
    ctx.paint()
    labs = [("ТАЧКА", (0.95, 0.75, 0.30)), ("ЗУБ", (0.95, 0.95, 0.98)), ("ПОТОП", (0.45, 0.70, 0.95))]
    pw = w / 3 - 30
    for i, (lab, col) in enumerate(labs):
        a = tl - 0.3 - i * 0.9
        if a < 0:
            continue
        k = ease_back(a / 0.4)
        x0 = 20 + i * (pw + 25)
        ctx.save()
        ctx.translate(x0 + pw / 2, h * 0.52)
        ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k)
        rrect(ctx, -pw / 2, -h * 0.36, pw, h * 0.72, 22)
        fs(ctx, (0.92, 0.90, 0.86), 6)
        if i == 0:
            rrect(ctx, -150, -10, 300, 80, 20)
            fs(ctx, col, 5)
            for wx in (-90, 90):
                ell(ctx, wx, 75, 30, 30)
                fs(ctx, (0.2, 0.2, 0.22), 5)
            for j in range(3):
                ph = t * 3 + j
                ctx.move_to(-20 + j * 30, -20)
                ctx.curve_to(-30 + j * 30, -60, 10 + j * 30, -80 + 10 * math.sin(ph), -10 + j * 30, -120)
                rgba(ctx, (0.4, 0.4, 0.45), 0.7)
                ctx.set_line_width(10)
                ctx.stroke()
        elif i == 1:
            ctx.move_to(-80, -90)
            ctx.curve_to(-110, 40, -60, 120, -30, 120)
            ctx.line_to(0, 40)
            ctx.line_to(30, 120)
            ctx.curve_to(60, 120, 110, 40, 80, -90)
            ctx.curve_to(40, -120, -40, -120, -80, -90)
            fs(ctx, col, 6)
            for j in range(3):
                a2 = -0.6 + j * 0.6 + 0.1 * math.sin(t * 10)
                ctx.move_to(130 * math.cos(a2 - 1.57), 130 * math.sin(a2 - 1.57) - 20)
                ctx.line_to(170 * math.cos(a2 - 1.57), 170 * math.sin(a2 - 1.57) - 20)
            rgba(ctx, RED)
            ctx.set_line_width(7)
            ctx.stroke()
        else:
            ctx.rectangle(-pw / 2 + 10, -h * 0.36 + 10, pw - 20, 60)
            rgba(ctx, (0.75, 0.72, 0.65))
            ctx.fill()
            for j in range(5):
                dy = ((t * 260 + j * 70) % 260)
                ell(ctx, -100 + j * 50, -h * 0.36 + 80 + dy, 10, 16)
                fs(ctx, col, 3)
            ell(ctx, 0, 110, 150, 26)
            fs(ctx, col, 4)
        text(ctx, lab, 0, -h * 0.36 + 70 if i != 2 else h * 0.30, 44, F_BLACK, OUT, shadow=False)
        ctx.restore()


def g_storm(ctx, w, h, tl, t):
    """The narrator under a personal storm cloud with lightning flashes."""
    import character
    rgba(ctx, (0.10, 0.10, 0.14))
    ctx.paint()
    flash = 1 if (t * 1.3) % 2.2 < 0.12 else 0
    if flash:
        rgba(ctx, (0.85, 0.85, 1.0), 0.35)
        ctx.paint()
    character.draw(ctx, w / 2, h + 40, 0.6, {"pose": "facepalm", "emo": "sad", "t": t, "level": 0.0})
    cx, cy = w / 2, 140
    for (dx, dy, r) in ((-160, 20, 90), (-60, -20, 110), (60, -10, 100), (160, 25, 85), (0, 40, 110)):
        ell(ctx, cx + dx, cy + dy, r, r * 0.7)
    rgba(ctx, (0.35, 0.36, 0.42))
    ctx.fill_preserve()
    rgba(ctx, OUT)
    ctx.set_line_width(6)
    ctx.stroke()
    rnd = random.Random(int(t * 3))
    if flash or (t * 1.3) % 2.2 < 0.25:
        x = cx + rnd.uniform(-120, 120)
        ctx.move_to(x, cy + 70)
        for k in range(5):
            x += rnd.uniform(-40, 40)
            ctx.line_to(x, cy + 70 + (k + 1) * 50)
        rgba(ctx, (1, 0.95, 0.4))
        ctx.set_line_width(9)
        ctx.stroke()
    for i in range(40):
        x = (i * 53 + t * 40) % w
        y = (i * 97 + t * 600) % h
        ctx.move_to(x, y)
        ctx.line_to(x - 6, y + 26)
    rgba(ctx, (0.6, 0.7, 0.9), 0.5)
    ctx.set_line_width(3)
    ctx.stroke()


def g_brain(ctx, w, h, tl, t):
    """A brain with a battery indicator draining from 100 to 'IQ −13'."""
    rgba(ctx, (0.15, 0.12, 0.18))
    ctx.paint()
    cx, cy = w * 0.38, h * 0.52
    for (dx, dy, r) in ((-80, -40, 90), (20, -70, 100), (110, -30, 90), (-60, 50, 90), (60, 50, 95)):
        ell(ctx, cx + dx, cy + dy, r, r * 0.85)
    rgba(ctx, (0.95, 0.65, 0.72))
    ctx.fill_preserve()
    rgba(ctx, OUT)
    ctx.set_line_width(7)
    ctx.stroke()
    for k in range(6):
        ctx.move_to(cx - 140 + k * 50, cy - 80)
        ctx.curve_to(cx - 120 + k * 50, cy - 20, cx - 160 + k * 50, cy + 20, cx - 130 + k * 50, cy + 80)
    rgba(ctx, (0.75, 0.40, 0.50))
    ctx.set_line_width(5)
    ctx.stroke()
    # dizzy eyes
    for sx in (-1, 1):
        ex, ey = cx + sx * 45, cy - 10
        for r in (18, 10):
            ctx.arc(ex, ey, r, t * 6 * sx, t * 6 * sx + 4.5)
        rgba(ctx, OUT)
        ctx.set_line_width(4)
        ctx.stroke()
    # battery
    bx, by = w * 0.72, h * 0.30
    rrect(ctx, bx, by, 150, 300, 20)
    fs(ctx, (0.25, 0.25, 0.28), 7)
    rrect(ctx, bx + 45, by - 24, 60, 28, 8)
    fs(ctx, (0.25, 0.25, 0.28), 5)
    lvl = 1 - 0.8 * ease(clamp(tl / 2.5))
    col = GREEN if lvl > 0.5 else (GOLD if lvl > 0.3 else RED)
    rrect(ctx, bx + 16, by + 16 + 268 * (1 - lvl), 118, 268 * lvl, 10)
    rgba(ctx, col)
    ctx.fill()
    if tl > 2.0:
        gfx.pop_text(ctx, "IQ −13", bx + 75, by + 380, 70, tl - 2.0, F_BLACK, RED, glow=0.6)


def g_tunnel(ctx, w, h, tl, t):
    """Tunnel vision: everything black except a small circle showing 'ДО ЗАРПЛАТЫ 3 ДНЯ'."""
    rgba(ctx, (0.85, 0.82, 0.78))
    ctx.paint()
    for i in range(6):
        gfx.panel_building(ctx, i * w / 6, h * 0.35, w / 6 - 8, h, 9, 3, lit=0.2, color=(0.62, 0.60, 0.58), seed=i + 4)
    text(ctx, "ИНВЕСТИЦИИ", w * 0.15, 120, 34, F_XB, OUT, shadow=False)
    text(ctx, "УЧЁБА", w * 0.85, 160, 34, F_XB, OUT, shadow=False)
    text(ctx, "ЗДОРОВЬЕ", w * 0.2, h - 80, 34, F_XB, OUT, shadow=False)
    r = 260 - 140 * ease(clamp(tl / 1.6))
    ctx.rectangle(0, 0, w, h)
    ctx.new_sub_path()
    ctx.arc_negative(w / 2, h / 2, r, 2 * math.pi, 0)
    rgba(ctx, (0.03, 0.03, 0.04))
    ctx.fill()
    rrect(ctx, w / 2 - 100, h / 2 - 50, 200, 100, 14)
    fs(ctx, (1, 0.95, 0.6), 4)
    text(ctx, "ДО ЗП", w / 2, h / 2 - 6, 30, F_BLACK, OUT, shadow=False)
    text(ctx, "3 ДНЯ", w / 2, h / 2 + 34, 34, F_BLACK, RED, shadow=False)


def g_iphone(ctx, w, h, tl, t):
    """A shiny phone on a chain locked to a heavy weight labelled '36 мес'."""
    rgba(ctx, (0.14, 0.13, 0.17))
    ctx.paint()
    g = cairo.RadialGradient(w * 0.4, h * 0.45, 10, w * 0.4, h * 0.45, 360)
    g.add_color_stop_rgba(0, 1, 0.95, 0.8, 0.25)
    g.add_color_stop_rgba(1, 1, 0.95, 0.8, 0)
    ctx.set_source(g)
    ctx.paint()
    phone(ctx, w * 0.38, h * 0.45 + 8 * math.sin(t * 2), 1.6, -0.12, (0.85, 0.45, 0.85))
    # chain
    x0, y0, x1, y1 = w * 0.42, h * 0.72, w * 0.72, h * 0.80
    for k in range(9):
        f = k / 8
        ell(ctx, x0 + (x1 - x0) * f, y0 + (y1 - y0) * f + 20 * math.sin(f * math.pi), 18, 11)
        rgba(ctx, (0.65, 0.66, 0.70))
        ctx.set_line_width(7)
        ctx.stroke()
    ctx.move_to(w * 0.68, h * 0.95)
    ctx.line_to(w * 0.72, h * 0.70)
    ctx.line_to(w * 0.88, h * 0.70)
    ctx.line_to(w * 0.92, h * 0.95)
    ctx.close_path()
    fs(ctx, (0.30, 0.30, 0.34), 7)
    text(ctx, "36 МЕС", w * 0.80, h * 0.86, 44, F_BLACK, WHITE, shadow=False)
    text(ctx, "В КРЕДИТ", w * 0.40, 80, 56, F_BLACK, RED, glow=0.4)


def g_phones(ctx, w, h, tl, t):
    """Ten phones fan out, then nine fade away leaving one with '+1 в год'."""
    rgba(ctx, (0.16, 0.14, 0.20))
    ctx.paint()
    k = ease(clamp(tl / 1.0))
    fade = clamp((tl - 2.2) / 0.8)
    for i in range(10):
        a = (i - 4.5) * 0.15 * k
        if i != 4:
            ctx.push_group()
            phone(ctx, w / 2 + math.sin(a) * 420, h * 0.62 - math.cos(a) * 60, 1.1, a, (0.3 + 0.06 * i, 0.5, 0.9))
            ctx.pop_group_to_source()
            ctx.paint_with_alpha(1 - fade * 0.85)
    phone(ctx, w / 2, h * 0.55, 1.35, 0, (0.95, 0.75, 0.30))
    text(ctx, "× 10" if fade < 0.5 else "+1 КАЖДЫЙ ГОД", w / 2, 90, 60, F_BLACK, GOLD if fade < 0.5 else GREEN, glow=0.5)


def g_tee(ctx, w, h, tl, t):
    """Plain t-shirt on a hanger with a tiny price tag '500 ₽' vs an expensive logo tee crossed out."""
    room_bg(ctx, w, h, (0.88, 0.86, 0.82), (0.60, 0.50, 0.42))
    ctx.move_to(0, 110)
    ctx.line_to(w, 110)
    rgba(ctx, (0.45, 0.45, 0.48))
    ctx.set_line_width(10)
    ctx.stroke()
    for i, (x, col, price, logo) in enumerate(((w * 0.30, (0.20, 0.21, 0.25), "500 ₽", False),
                                                (w * 0.70, (0.95, 0.95, 0.95), "25 000 ₽", True))):
        sw = 0.04 * math.sin(t * 1.4 + i)
        ctx.save()
        ctx.translate(x, 110)
        ctx.rotate(sw)
        ctx.move_to(0, 0)
        ctx.line_to(0, 30)
        ctx.move_to(-110, 70)
        ctx.line_to(0, 30)
        ctx.line_to(110, 70)
        rgba(ctx, (0.35, 0.35, 0.38))
        ctx.set_line_width(6)
        ctx.stroke()
        ctx.move_to(-60, 60)
        ctx.line_to(-170, 110)
        ctx.line_to(-130, 190)
        ctx.line_to(-90, 170)
        ctx.line_to(-90, 380)
        ctx.line_to(90, 380)
        ctx.line_to(90, 170)
        ctx.line_to(130, 190)
        ctx.line_to(170, 110)
        ctx.line_to(60, 60)
        ctx.curve_to(30, 90, -30, 90, -60, 60)
        fs(ctx, col, 6)
        if logo:
            text(ctx, "LOGO", 0, 200, 54, F_BLACK, (0.85, 0.15, 0.15), shadow=False)
        rrect(ctx, 40, 290, 120, 60, 8)
        fs(ctx, (1, 0.95, 0.6), 4)
        text(ctx, price, 100, 330, 26, F_BLACK, OUT, shadow=False)
        ctx.restore()
    a = tl - 1.0
    if a > 0:
        k = ease(a / 0.4)
        ctx.move_to(w * 0.55, 200)
        ctx.line_to(w * 0.55 + 300 * k, 200 + 300 * k)
        ctx.move_to(w * 0.85, 200)
        ctx.line_to(w * 0.85 - 300 * k, 200 + 300 * k)
        rgba(ctx, RED)
        ctx.set_line_width(14)
        ctx.stroke()


def g_rats(ctx, w, h, tl, t):
    """Hamster wheel with a little guy running; a 'ВЫХОД' sign lights up and he steps out."""
    rgba(ctx, (0.20, 0.18, 0.24))
    ctx.paint()
    cx, cy, r = w * 0.40, h * 0.52, 230
    ctx.save()
    ctx.translate(cx, cy)
    ctx.rotate(t * (2.5 if tl < 2.5 else 0.3))
    ctx.arc(0, 0, r, 0, 2 * math.pi)
    rgba(ctx, (0.75, 0.75, 0.80))
    ctx.set_line_width(14)
    ctx.stroke()
    for k in range(16):
        a = k * math.pi / 8
        ctx.move_to(0, 0)
        ctx.line_to(r * math.cos(a), r * math.sin(a))
    rgba(ctx, (0.55, 0.55, 0.60))
    ctx.set_line_width(4)
    ctx.stroke()
    ctx.restore()
    out = ease(clamp((tl - 2.5) / 1.2))
    bob = 10 * abs(math.sin(t * 10)) * (1 - out)
    mini_guy(ctx, cx + 360 * out, cy + 110 - bob, 0.7, "happy" if out > 0.5 else "sad", 1,
             hair=(0.96, 0.84, 0.47), shirt=(0.20, 0.21, 0.25))
    rrect(ctx, w * 0.70, h * 0.14, 280, 100, 14)
    fs(ctx, (0.15, 0.55, 0.30) if out > 0.1 else (0.25, 0.30, 0.28), 6)
    text(ctx, "ВЫХОД", w * 0.70 + 140, h * 0.14 + 66, 50, F_BLACK, WHITE if out > 0.1 else (0.5, 0.5, 0.5), shadow=False)


def g_boring(ctx, w, h, tl, t):
    """A tiny chart crawling at +0.3%, a snail on the line, the guy yawning."""
    rgba(ctx, (0.95, 0.95, 0.96))
    ctx.paint()
    for k in range(6):
        ctx.move_to(80, 100 + k * 90)
        ctx.line_to(w - 60, 100 + k * 90)
    rgba(ctx, (0.85, 0.85, 0.88))
    ctx.set_line_width(2)
    ctx.stroke()
    n = int(clamp(tl / 3.0) * 60) + 2
    pts = [(80 + i * (w - 140) / 60, 500 - i * 0.9 - 6 * math.sin(i * 0.9)) for i in range(n)]
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    rgba(ctx, GREEN)
    ctx.set_line_width(6)
    ctx.stroke()
    sx, sy = pts[-1]
    ell(ctx, sx, sy - 20, 26, 22)
    fs(ctx, (0.80, 0.55, 0.35), 4)
    ctx.arc(sx - 4, sy - 22, 12, 0, 5.5)
    rgba(ctx, (0.55, 0.35, 0.20))
    ctx.set_line_width(3)
    ctx.stroke()
    text(ctx, "+217 ₽ за квартал", w * 0.5, 80, 50, F_BLACK, (0.3, 0.6, 0.3), shadow=False)
    if tl > 2.0:
        text(ctx, "Z z z", w * 0.85, 200 - 20 * math.sin(t * 2), 60, F_BLACK, (0.5, 0.5, 0.6), shadow=False)


def g_sandbox(ctx, w, h, tl, t):
    """Sandbox with a toy shovel on the left, a big game board with houses/garages on the right."""
    sky_bg(ctx, w, h, (0.60, 0.80, 0.95), (0.90, 0.95, 0.98))
    ctx.rectangle(0, h * 0.70, w, h * 0.30)
    rgba(ctx, (0.45, 0.70, 0.40))
    ctx.fill()
    rrect(ctx, 40, h * 0.55, w * 0.40, h * 0.30, 14)
    fs(ctx, (0.65, 0.45, 0.30), 6)
    rrect(ctx, 60, h * 0.58, w * 0.40 - 40, h * 0.24, 10)
    rgba(ctx, (0.95, 0.85, 0.55))
    ctx.fill()
    ctx.move_to(170, h * 0.60)
    ctx.line_to(230, h * 0.40)
    rgba(ctx, (0.85, 0.25, 0.25))
    ctx.set_line_width(10)
    ctx.stroke()
    text(ctx, "до 1 млн", 40 + w * 0.2, h * 0.52, 34, F_XB, OUT, shadow=False)
    k = ease(clamp((tl - 1.0) / 0.8))
    bx = w * 0.52 + (1 - k) * 200
    rrect(ctx, bx, h * 0.35, w * 0.44, h * 0.50, 18)
    fs(ctx, (0.95, 0.92, 0.85), 6)
    for i in range(3):
        x = bx + 60 + i * 150
        y = h * 0.55
        ctx.move_to(x - 50, y)
        ctx.line_to(x, y - 50)
        ctx.line_to(x + 50, y)
        ctx.line_to(x + 50, y + 70)
        ctx.line_to(x - 50, y + 70)
        ctx.close_path()
        fs(ctx, ((0.85, 0.35, 0.30), (0.40, 0.55, 0.85), (0.55, 0.75, 0.40))[i], 5)
    text(ctx, "после 1 млн", bx + w * 0.22, h * 0.32, 34, F_XB, OUT, shadow=False)


def g_filter(ctx, w, h, tl, t):
    """A funnel: mixed little people fall in, whiners bounce off, friendly ones come out."""
    rgba(ctx, (0.17, 0.15, 0.22))
    ctx.paint()
    cx = w / 2
    ctx.move_to(cx - 300, 160)
    ctx.line_to(cx + 300, 160)
    ctx.line_to(cx + 60, 420)
    ctx.line_to(cx + 60, 520)
    ctx.line_to(cx - 60, 520)
    ctx.line_to(cx - 60, 420)
    ctx.close_path()
    fs(ctx, (0.55, 0.60, 0.70), 7)
    text(ctx, "1 000 000 ₽", cx, 300, 46, F_BLACK, WHITE, shadow=False)
    for i in range(5):
        ph = (tl * 0.6 + i * 0.37) % 1.0
        whiner = i % 2 == 0
        if whiner:
            x = cx - 340 + i * 30 - ph * 300
            y = 120 - math.sin(ph * math.pi) * 120
            mini_guy(ctx, x, y, 0.35, "sad", 0, hair=(0.3, 0.3, 0.3), shirt=(0.45, 0.45, 0.50))
        else:
            x = cx + (i - 2) * 140 * ph
            y = 560 + ph * 80
            mini_guy(ctx, x, y, 0.38, "happy", 0, hair=(0.5, 0.3, 0.2), shirt=(0.30, 0.65, 0.45))


GAGS = {k[2:]: v for k, v in globals().items() if k.startswith("g_")}


def draw_gag(ctx, kind, tl, t, x, y, w, h):
    screen_card(ctx, x, y, w, h, tl, lambda c, ww, hh: GAGS[kind](c, ww, hh, tl, t))
