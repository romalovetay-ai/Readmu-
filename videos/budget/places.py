"""Locations, the recurring character Серёга and props for «Куда утекает зарплата» (2D cel-shaded style from art.py)."""
import math
import random
import numpy as np
import cairo

import art
from art import (W, H, INK, shape, ground, coin, coin_stack, banknote, tag, title, pop_title, plain, fit, rrect_path, ell_path,
                 poly_path, gloss, ease, ease_io, ease_back, clamp, C, shade_of, light_of, person, check, F_BLACK, F_XB, F_SB)

FLOOR_Y = 900          # room floor line (world units, camera 1:1 at zoom 1)
SKIN = (1.0, 0.83, 0.70)


def squash(age, dur=0.4, k=0.22):
    if age < 0 or age > dur:
        return 1.0, 1.0
    u = age / dur
    a = k * math.sin(u * math.pi * 2.2) * (1 - u)
    return 1 + a, 1 - a


# ------------------------------------------------------------------ Серёга
def serega(c, x, y, s, t, mood="neutral", pose="stand", phone=False, alpha=1.0, look=0.0, bounce=0.0):
    """Серёга: young office guy, teal hoodie, jeans, brown hair. (x, y) = feet (stand) / seat point (sit).
    pose: stand | sit | jump | lie (head on a pillow, body under a blanket handled by the bed) | run."""
    c.save()
    c.translate(x, y - bounce)
    c.scale(s, s)
    hood = (0.22, 0.62, 0.66)
    jeans = (0.25, 0.32, 0.52)
    breathe = 2 * math.sin(t * 1.7)
    if pose in ("stand", "jump", "run"):
        ground(c, 0, 4 + bounce / max(s, 0.1), 70, 0.35 * alpha)
        # legs
        ph = math.sin(t * 10) if pose == "run" else 0.0
        for sx in (-1, 1):
            lx = sx * 22 + (ph * 26 * sx if pose == "run" else 0)
            shape(c, lambda q, lx=lx: rrect_path(q, lx - 17, -130, 34, 128, 14), jeans, alpha, shade=0.2, lw=4)
            shape(c, lambda q, lx=lx, sx=sx: rrect_path(q, lx - 22 + sx * 4, -14, 48, 22, 10), "white", alpha, shade=0.2, lw=4)
        body_y = -130
    elif pose == "sit":
        for sx in (-1, 1):
            shape(c, lambda q, sx=sx: rrect_path(q, sx * 22 - 17, -40, 110, 36, 16), jeans, alpha, shade=0.2, lw=4)
            shape(c, lambda q, sx=sx: rrect_path(q, sx * 22 + 76, -40, 34, 100, 14), jeans, alpha, shade=0.2, lw=4)
            shape(c, lambda q, sx=sx: rrect_path(q, sx * 22 + 70, 50, 52, 22, 10), "white", alpha, shade=0.2, lw=4)
        body_y = -30
    else:  # lie: only head + arm with phone are drawn (the bed draws the blanket)
        body_y = 0
    if pose != "lie":
        # torso (hoodie)
        shape(c, lambda q: (q.move_to(-62, body_y), q.curve_to(-70, body_y - 120, -50, body_y - 170 + breathe, 0, body_y - 172 + breathe),
                            q.curve_to(50, body_y - 170 + breathe, 70, body_y - 120, 62, body_y), q.close_path()), hood, alpha, shade=0.18)
        shape(c, lambda q: rrect_path(q, -30, body_y - 60, 60, 34, 12), shade_of(hood, 0.85), alpha, shade=0, light=0, lw=3.5)  # pocket
        for sx in (-1, 1):  # hoodie strings
            c.move_to(sx * 12, body_y - 165)
            c.line_to(sx * 14, body_y - 120)
        c.set_line_width(4)
        c.set_source_rgba(1, 1, 1, alpha)
        c.stroke()
        hy = body_y - 240
    else:
        hy = -40
    # arms
    arm_up = pose == "jump" or mood == "joy"
    for sx in (-1, 1):
        c.save()
        c.translate(sx * 56, body_y - 150 if pose != "lie" else hy + 90)
        if phone and sx == 1:
            ang = -2.2
        elif arm_up:
            ang = -2.6 if sx == 1 else -0.55
            ang += 0.15 * math.sin(t * 9 + sx)
        elif pose == "run":
            ang = 1.57 + 0.6 * math.sin(t * 10 + (0 if sx > 0 else math.pi))
        elif mood == "sad":
            ang = 1.75 if sx > 0 else 1.4
        else:
            ang = 1.45 if sx > 0 else 1.69
        if pose == "lie" and sx == -1:
            c.restore()
            continue
        c.rotate(ang if sx > 0 else math.pi - ang if False else ang)
        shape(c, lambda q: rrect_path(q, -14, -16, 110, 32, 15), hood, alpha, shade=0.2, lw=4)
        shape(c, lambda q: ell_path(q, 112, 0, 18, 18), SKIN, alpha, shade=0.2, lw=4)
        if phone and sx == 1:
            c.save()
            c.translate(118, 0)
            c.rotate(1.9)
            shape(c, lambda q: rrect_path(q, -18, -32, 36, 64, 8), (0.15, 0.14, 0.2), alpha, shade=0.1, lw=3.5)
            rrect_path(c, -13, -26, 26, 50, 5)
            c.set_source_rgba(0.55, 0.85, 1.0, alpha)
            c.fill()
            c.restore()
        c.restore()
    # head
    shape(c, lambda q: ell_path(q, 0, hy, 62, 66), SKIN, alpha, shade=0.2, light=0.06)
    # hair
    shape(c, lambda q: (q.move_to(-64, hy - 6), q.curve_to(-70, hy - 70, -20, hy - 92, 10, hy - 84), q.curve_to(50, hy - 90, 76, hy - 50, 64, hy - 8),
                        q.curve_to(50, hy - 40, 20, hy - 46, 0, hy - 40), q.curve_to(-20, hy - 52, -50, hy - 36, -64, hy - 6), q.close_path()),
          (0.42, 0.27, 0.16), alpha, shade=0.2, light=0.08)
    # ears
    for sx in (-1, 1):
        shape(c, lambda q, sx=sx: ell_path(q, sx * 62, hy + 6, 12, 16), SKIN, alpha, shade=0.2, lw=3.5)
    # eyes
    blink = (t % 3.9) < 0.12
    for sx in (-1, 1):
        ex = sx * 22 + look * 6
        if blink or mood == "joy":
            c.move_to(ex - 9, hy - 2)
            c.curve_to(ex - 4, hy - 9 if mood == "joy" else hy, ex + 4, hy - 9 if mood == "joy" else hy, ex + 9, hy - 2)
            c.set_line_width(5)
            c.set_source_rgba(*INK, alpha)
            c.stroke()
        else:
            ell_path(c, ex, hy - 2, 8, 11)
            c.set_source_rgba(*INK, alpha)
            c.fill()
            ell_path(c, ex + 2.5, hy - 6, 2.6, 2.6)
            c.set_source_rgba(1, 1, 1, alpha)
            c.fill()
    # brows
    bt = {"sad": 7, "worried": 9, "angry": -8, "happy": -2, "joy": -4, "shock": -10}.get(mood, 0)
    for sx in (-1, 1):
        c.move_to(sx * 34, hy - 24 + (bt if mood in ("sad", "worried") else 0))
        c.line_to(sx * 12, hy - 24 - (bt if mood not in ("sad", "worried") else -0) - (bt if mood in ("sad", "worried") else 0) * 0.6)
        c.set_line_width(6)
        c.set_source_rgba(0.32, 0.2, 0.12, alpha)
        c.stroke()
    # mouth
    my = hy + 32
    if mood in ("happy", "joy"):
        shape(c, lambda q: (q.move_to(-20, my - 4), q.curve_to(-10, my + 18, 10, my + 18, 20, my - 4), q.close_path()), (0.45, 0.12, 0.14), alpha,
              shade=0, light=0, lw=3.5)
    elif mood == "shock":
        shape(c, lambda q: ell_path(q, 0, my + 4, 11, 14), (0.45, 0.12, 0.14), alpha, shade=0, light=0, lw=3.5)
    elif mood in ("sad", "worried"):
        c.move_to(-16, my + 8)
        c.curve_to(-6, my - 2, 6, my - 2, 16, my + 8)
        c.set_line_width(5)
        c.set_source_rgba(*INK, alpha)
        c.stroke()
    else:
        c.move_to(-14, my + 2)
        c.line_to(14, my + 2)
        c.set_line_width(5)
        c.set_source_rgba(*INK, alpha)
        c.stroke()
    if mood == "worried" or mood == "sad":
        shape(c, lambda q: (q.move_to(58, hy - 40), q.curve_to(51, hy - 24, 53, hy - 14, 60, hy - 14), q.curve_to(67, hy - 14, 69, hy - 24, 58, hy - 40)),
              (0.6, 0.85, 1.0), alpha, lw=3)
    ell_path(c, -38, hy + 18, 10, 6)
    c.set_source_rgba(1, 0.5, 0.5, 0.35 * alpha)
    c.fill()
    ell_path(c, 38, hy + 18, 10, 6)
    c.fill()
    c.restore()


def courier(c, x, y, s, t, alpha=1.0):
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    ground(c, 0, 4, 70, 0.35)
    shape(c, lambda q: rrect_path(q, -40, -130, 80, 128, 14), (0.25, 0.25, 0.3), alpha, shade=0.2, lw=4)
    shape(c, lambda q: (q.move_to(-58, -130), q.curve_to(-62, -250, -40, -290, 0, -290), q.curve_to(40, -290, 62, -250, 58, -130), q.close_path()),
          (0.98, 0.62, 0.20), alpha, shade=0.18)
    shape(c, lambda q: rrect_path(q, -110, -300, 92, 110, 14), (0.98, 0.72, 0.25), alpha, shade=0.2, lw=4)   # thermo bag
    plain(c, "ЕДА", -64, -238, 26, F_BLACK, INK, alpha)
    shape(c, lambda q: ell_path(q, 0, -340, 50, 52), SKIN, alpha, shade=0.2)
    shape(c, lambda q: (q.move_to(-54, -350), q.curve_to(-50, -410, 50, -410, 54, -350), q.close_path()), (0.98, 0.62, 0.20), alpha, shade=0.2, lw=4)
    for sx in (-1, 1):
        ell_path(c, sx * 17, -342, 6, 8)
        c.set_source_rgba(*INK, alpha)
        c.fill()
    c.move_to(-12, -314)
    c.curve_to(-4, -306, 4, -306, 12, -314)
    c.set_line_width(4)
    c.stroke()
    c.restore()


# ------------------------------------------------------------------ rooms
def room(c, t, wall=(0.92, 0.80, 0.84), night=0.0, window_x=380, lamp=True):
    """Серёга's living room: patterned wallpaper, window with the city, skirting, wooden floor, rug."""
    wc = np.array(wall) * (1 - 0.72 * night) + np.array([0.10, 0.08, 0.20]) * 0.72 * night
    g = cairo.LinearGradient(0, 0, 0, FLOOR_Y)
    g.add_color_stop_rgb(0, *(wc * 0.92))
    g.add_color_stop_rgb(1, *wc)
    c.rectangle(-1200, -600, 4400, FLOOR_Y + 600)
    c.set_source(g)
    c.fill()
    # wallpaper pattern: small diamonds
    c.set_source_rgba(*shade_of(tuple(wc), 0.86), 0.55)
    for gx in range(-1200, 3200, 90):
        for gy in range(-560, FLOOR_Y - 40, 90):
            ox = 45 if (gy // 90) % 2 else 0
            c.move_to(gx + ox, gy - 10)
            c.line_to(gx + ox + 10, gy)
            c.line_to(gx + ox, gy + 10)
            c.line_to(gx + ox - 10, gy)
            c.close_path()
    c.fill()
    # window
    wx, wy, ww, wh = window_x, 160, 420, 420
    sky = cairo.LinearGradient(0, wy, 0, wy + wh)
    sky.add_color_stop_rgb(0, *(np.array([0.36, 0.55, 0.95]) * (1 - night) + np.array([0.06, 0.06, 0.18]) * night))
    sky.add_color_stop_rgb(1, *(np.array([0.98, 0.75, 0.62]) * (1 - night) + np.array([0.18, 0.12, 0.30]) * night))
    rrect_path(c, wx, wy, ww, wh, 10)
    c.set_source(sky)
    c.fill()
    c.save()
    rrect_path(c, wx, wy, ww, wh, 10)
    c.clip()
    rnd = random.Random(4)
    for i in range(9):
        bx = wx - 20 + i * 52
        bh = rnd.randint(90, 260)
        c.rectangle(bx, wy + wh - bh, 46, bh)
        c.set_source_rgba(*(np.array([0.55, 0.45, 0.70]) * (1 - night) + np.array([0.12, 0.10, 0.22]) * night), 1)
        c.fill()
        for k in range(bh // 40):
            if (i * 7 + k) % 3 == 0:
                c.rectangle(bx + 10, wy + wh - bh + 14 + k * 40, 10, 14)
                c.rectangle(bx + 26, wy + wh - bh + 14 + k * 40, 10, 14)
        c.set_source_rgba(1, 0.86, 0.5, 0.35 + 0.6 * night)
        c.fill()
    if night > 0.5:
        shape(c, lambda q: ell_path(q, wx + ww - 90, wy + 90, 40, 40), (1, 0.97, 0.85), 1, shade=0, light=0, lw=0.5)
    c.restore()
    for lw_, col in ((34, INK), (26, (0.97, 0.95, 0.92))):
        rrect_path(c, wx - 4, wy - 4, ww + 8, wh + 8, 12)
        c.set_line_width(lw_)
        c.set_source_rgb(*col)
        c.stroke()
    c.rectangle(wx + ww / 2 - 7, wy, 14, wh)
    c.rectangle(wx, wy + wh / 2 - 7, ww, 14)
    c.set_source_rgb(0.97, 0.95, 0.92)
    c.fill()
    shape(c, lambda q: rrect_path(q, wx - 40, wy + wh + 10, ww + 80, 26, 8), (0.97, 0.95, 0.92), 1, shade=0.2, lw=4)
    # skirting + floor
    shape(c, lambda q: q.rectangle(-1200, FLOOR_Y - 26, 4400, 30), (0.97, 0.95, 0.92), 1, shade=0, light=0, lw=4)
    fl = np.array([0.78, 0.55, 0.36]) * (1 - 0.6 * night) + np.array([0.15, 0.10, 0.12]) * 0.6 * night
    c.rectangle(-1200, FLOOR_Y, 4400, 600)
    c.set_source_rgb(*fl)
    c.fill()
    c.set_line_width(3)
    for k in range(-30, 80):
        c.move_to(k * 90, FLOOR_Y)
        c.line_to(k * 90 - 160, FLOOR_Y + 600)
    c.set_source_rgba(*shade_of(tuple(fl), 0.8), 0.6)
    c.stroke()
    # rug
    shape(c, lambda q: ell_path(q, 960, FLOOR_Y + 110, 520, 70), (0.85, 0.35, 0.42), 1, shade=0.12, light=0.04)
    ell_path(c, 960, FLOOR_Y + 110, 440, 52)
    c.set_line_width(5)
    c.set_source_rgba(1, 0.9, 0.7, 0.5)
    c.stroke()
    if lamp:
        floor_lamp(c, 1420, t, on=1.0 if night > 0.3 else 0.6)


def floor_lamp(c, x, t, on=1.0):
    shape(c, lambda q: rrect_path(q, x - 8, FLOOR_Y - 420, 16, 420, 6), (0.25, 0.22, 0.3), 1, shade=0.3, lw=4)
    shape(c, lambda q: ell_path(q, x, FLOOR_Y - 4, 60, 12), (0.25, 0.22, 0.3), 1, shade=0.2, lw=4)
    shape(c, lambda q: poly_path(q, [(x - 70, FLOOR_Y - 420), (x + 70, FLOOR_Y - 420), (x + 44, FLOOR_Y - 520), (x - 44, FLOOR_Y - 520)]),
          (1.0, 0.86, 0.6), 1, shade=0.15, lw=4)
    if on > 0:
        rg = cairo.RadialGradient(x, FLOOR_Y - 420, 0, x, FLOOR_Y - 420, 520)
        rg.add_color_stop_rgba(0, 1, 0.85, 0.55, 0.28 * on)
        rg.add_color_stop_rgba(1, 1, 0.85, 0.55, 0)
        c.set_source(rg)
        c.arc(x, FLOOR_Y - 420, 520, 0, 2 * math.pi)
        c.fill()


def sofa(c, x, t, color=(0.42, 0.40, 0.72)):
    y = FLOOR_Y
    ground(c, x, y + 8, 380, 0.4)
    shape(c, lambda q: rrect_path(q, x - 330, y - 300, 660, 190, 40), color, 1, shade=0.12)          # back
    shape(c, lambda q: rrect_path(q, x - 360, y - 170, 720, 120, 30), light_of(color, 0.08), 1, shade=0.15)  # seat
    for sx in (-1, 1):
        shape(c, lambda q, sx=sx: rrect_path(q, x + sx * 340 - 50, y - 230, 100, 200, 40), shade_of(color, 0.9), 1, shade=0.15)
    for k in (-1, 1):
        shape(c, lambda q, k=k: rrect_path(q, x + k * 160 - 150, y - 280, 300, 130, 30), light_of(color, 0.04), 1, shade=0.12, lw=4)
    for sx in (-1, 1):
        shape(c, lambda q, sx=sx: rrect_path(q, x + sx * 300 - 14, y - 50, 28, 50, 6), (0.35, 0.25, 0.2), 1, shade=0.2, lw=4)


def wall_calendar(c, x, y, day, flip=0.0, red=False):
    """Tear-off calendar on the wall; flip 0..1 animates the top page falling away."""
    shape(c, lambda q: rrect_path(q, x - 90, y - 20, 180, 210, 12), "white", 1, shade=0.1)
    shape(c, lambda q: rrect_path(q, x - 90, y - 20, 180, 50, 12), (0.92, 0.30, 0.34), 1, shade=0.1, lw=4)
    plain(c, "НОЯБРЬ", x, y + 16, 26, F_BLACK, "white")
    title(c, str(day), x, y + 150, 100, "red" if red else "dark" if False else (0.2, 0.15, 0.25))
    if flip > 0:
        c.save()
        c.translate(x, y + 30)
        c.rotate(0.6 * flip)
        c.translate(0, 300 * flip * flip)
        shape(c, lambda q: rrect_path(q, -90, 0, 180, 160, 8), "white", 1 - flip, shade=0.1, lw=4)
        c.restore()


def phone_ui(c, x, y, w, h, draw_screen, alpha=1.0, rot=0.0, scale=1.0):
    """Big floating phone with a drawn screen; draw_screen(c, w, h) in screen space."""
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.scale(scale, scale)
    rrect_path(c, -w / 2 + 14, -h / 2 + 22, w, h, w * 0.12)
    c.set_source_rgba(*INK, 0.45 * alpha)
    c.fill()
    shape(c, lambda q: rrect_path(q, -w / 2, -h / 2, w, h, w * 0.12), (0.14, 0.13, 0.19), alpha, shade=0.04, light=0.03)
    c.save()
    rrect_path(c, -w / 2 + 16, -h / 2 + 16, w - 32, h - 32, w * 0.09)
    c.clip()
    c.translate(-w / 2 + 16, -h / 2 + 16)
    draw_screen(c, w - 32, h - 32)
    c.restore()
    rrect_path(c, -w * 0.14, -h / 2 + 26, w * 0.28, 16, 8)
    c.set_source_rgba(0, 0, 0, alpha)
    c.fill()
    c.restore()


def app_bg(c, w, h, top=(0.20, 0.16, 0.30), bot=(0.10, 0.08, 0.16)):
    g = cairo.LinearGradient(0, 0, 0, h)
    g.add_color_stop_rgb(0, *top)
    g.add_color_stop_rgb(1, *bot)
    c.rectangle(0, 0, w, h)
    c.set_source(g)
    c.fill()


def app_row(c, x, y, w, icon_col, letter, name, price, alpha=1.0, strike=0.0, highlight=None):
    rrect_path(c, x, y, w, 92, 22)
    c.set_source_rgba(1, 1, 1, 0.08 * alpha if highlight is None else 0.0)
    c.fill()
    if highlight is not None:
        rrect_path(c, x, y, w, 92, 22)
        c.set_source_rgba(*C(highlight), 0.30 * alpha)
        c.fill()
    shape(c, lambda q: rrect_path(q, x + 14, y + 14, 64, 64, 18), icon_col, alpha, shade=0.15, light=0.05, lw=3)
    plain(c, letter, x + 46, y + 60, 36, F_BLACK, "white", alpha)
    plain(c, name, x + 96, y + 56, 30, F_XB, "white", alpha, "left")
    plain(c, price, x + w - 18, y + 56, 30, F_BLACK, "gold", alpha, "right")
    if strike > 0:
        c.move_to(x + 10, y + 46)
        c.line_to(x + 10 + (w - 20) * strike, y + 46)
        c.set_line_width(7)
        c.set_source_rgba(*C("red"), alpha)
        c.stroke()


def counter(c, value, x, y, size, color="white", alpha=1.0, suffix=" ₽", prefix=""):
    s = prefix + f"{int(round(value)):,}".replace(",", " ") + suffix
    title(c, s, x, y, size, color, alpha)


def jar(c, x, y, w, h, fill, color="gold", label=None, alpha=1.0, lid="red"):
    ground(c, x, y + 6, w * 0.7, 0.4)
    body = lambda q: rrect_path(q, x - w / 2, y - h, w, h, w * 0.2)
    body(c)
    c.set_source_rgba(0.8, 0.9, 1.0, 0.25 * alpha)
    c.fill()
    if fill > 0:
        c.save()
        body(c)
        c.clip()
        fh = h * clamp(fill)
        c.rectangle(x - w / 2, y - fh, w, fh)
        c.set_source_rgba(*C(color), alpha)
        c.fill()
        for k in range(int(fh / 26)):
            ell_path(c, x - w / 4 + (k % 2) * w / 2.5, y - 14 - k * 26, w * 0.22, 9)
            c.set_source_rgba(*light_of(color, 0.3), alpha * 0.7)
            c.fill()
        c.restore()
    body(c)
    c.set_source_rgba(*INK, alpha)
    c.set_line_width(5)
    c.stroke()
    gloss(c, x - w * 0.3, y - h * 0.6, w * 0.07, h * 0.45, 0.35, 0)
    shape(c, lambda q: rrect_path(q, x - w * 0.42, y - h - 30, w * 0.84, 36, 12), lid, alpha, shade=0.2, lw=4)
    if label:
        tag(c, label, x, y - h * 0.45, 30, "cream", alpha=alpha)


def bat(c, x, y, s, t, alpha=1.0):
    """Little cartoon vampire bat (subscriptions draining money)."""
    flap = math.sin(t * 14) * 0.5
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    for sx in (-1, 1):
        shape(c, lambda q, sx=sx: (q.move_to(0, 0), q.curve_to(sx * 30, -30 - 20 * flap, sx * 70, -20 - 30 * flap, sx * 90, -10 - 25 * flap),
                                   q.curve_to(sx * 70, 0, sx * 60, 10, sx * 45, 6), q.curve_to(sx * 35, 18, sx * 20, 12, 0, 10), q.close_path()),
              (0.30, 0.22, 0.40), alpha, shade=0.15, lw=3.5)
    shape(c, lambda q: ell_path(q, 0, 0, 22, 24), (0.36, 0.26, 0.48), alpha, shade=0.2, lw=3.5)
    for sx in (-1, 1):
        ell_path(c, sx * 8, -4, 5, 6)
        c.set_source_rgba(1, 0.9, 0.3, alpha)
        c.fill()
        c.move_to(sx * 5, 12)
        c.line_to(sx * 3, 22)
        c.line_to(sx * 1, 12)
        c.set_source_rgba(1, 1, 1, alpha)
        c.fill()
    c.restore()


def money_fly(c, x0, y0, x1, y1, u, size=60, rot=0.0, alpha=1.0):
    e = ease_io(u)
    x = x0 + (x1 - x0) * e
    y = y0 + (y1 - y0) * e - 160 * math.sin(math.pi * e)
    banknote(c, x, y, size * 1.6, rot + u * 3, alpha=alpha * (1 - clamp((u - 0.85) / 0.15)))


def receipt(c, x, y, w, lines, k, total=None, alpha=1.0):
    """Paper receipt unrolling downwards: lines = [(name, value, color)], k = 0..1 how much is unrolled."""
    n = len(lines) + (2 if total else 0)
    full = 120 + n * 64
    hgt = 60 + (full - 60) * ease_io(k)
    c.save()
    rrect_path(c, x - w / 2 + 10, y + 14, w, hgt, 6)
    c.set_source_rgba(*INK, 0.35 * alpha)
    c.fill()
    # zigzag bottom
    def paper(q):
        q.move_to(x - w / 2, y)
        q.line_to(x + w / 2, y)
        q.line_to(x + w / 2, y + hgt)
        steps = 14
        for i in range(steps + 1):
            q.line_to(x + w / 2 - i * w / steps, y + hgt + (12 if i % 2 else 0))
        q.close_path()
    shape(c, paper, "white", alpha, shade=0.04, light=0)
    c.save()
    c.rectangle(x - w / 2, y, w, hgt)
    c.clip()
    plain(c, "ЧЕК", x, y + 60, 40, F_BLACK, (0.2, 0.15, 0.25), alpha)
    for i, (nm, val, col) in enumerate(lines):
        yy = y + 130 + i * 64
        plain(c, nm, x - w / 2 + 30, yy, 30, F_XB, (0.25, 0.2, 0.3), alpha, "left")
        plain(c, val, x + w / 2 - 30, yy, 30, F_BLACK, col or (0.25, 0.2, 0.3), alpha, "right")
        c.set_dash([6, 8])
        c.move_to(x - w / 2 + 30, yy + 18)
        c.line_to(x + w / 2 - 30, yy + 18)
        c.set_line_width(2)
        c.set_source_rgba(0.6, 0.55, 0.65, alpha)
        c.stroke()
        c.set_dash([])
    if total:
        yy = y + 130 + len(lines) * 64 + 50
        plain(c, "ИТОГО", x - w / 2 + 30, yy, 40, F_BLACK, (0.2, 0.15, 0.25), alpha, "left")
        plain(c, total, x + w / 2 - 30, yy, 44, F_BLACK, "red", alpha, "right")
    c.restore()
    c.restore()


def car(c, x, y, s, t, color=(0.98, 0.78, 0.22), taxi=True):
    c.save()
    c.translate(x, y)
    c.scale(s, s)
    ground(c, 0, 6, 230, 0.45)
    shape(c, lambda q: (q.move_to(-220, -40), q.line_to(-200, -100), q.line_to(-110, -110), q.line_to(-60, -180), q.line_to(90, -180),
                        q.line_to(150, -110), q.line_to(215, -95), q.line_to(225, -40), q.close_path()), color, 1, shade=0.15)
    for wx in (-140, 140):
        shape(c, lambda q, wx=wx: ell_path(q, wx, -30, 46, 46), (0.18, 0.16, 0.22), 1, shade=0.2)
        shape(c, lambda q, wx=wx: ell_path(q, wx, -30, 20, 20), (0.7, 0.7, 0.75), 1, shade=0.2, lw=3)
    shape(c, lambda q: poly_path(q, [(-90, -112), (-50, -168), (10, -168), (10, -112)]), (0.65, 0.85, 1.0), 1, shade=0.1, lw=3.5)
    shape(c, lambda q: poly_path(q, [(25, -112), (25, -168), (80, -168), (125, -112)]), (0.65, 0.85, 1.0), 1, shade=0.1, lw=3.5)
    if taxi:
        shape(c, lambda q: rrect_path(q, -40, -215, 90, 34, 8), (1.0, 0.95, 0.6), 1, shade=0.1, lw=3.5)
        plain(c, "ТАКСИ", 5, -190, 22, F_BLACK, INK)
        for k in range(8):
            c.rectangle(-200 + k * 50, -80, 25, 16)
        c.set_source_rgba(*INK, 0.85)
        c.fill()
    c.restore()


def bed(c, x, t, night=1.0):
    y = FLOOR_Y
    ground(c, x, y + 8, 420, 0.45)
    shape(c, lambda q: rrect_path(q, x - 380, y - 330, 60, 330, 14), (0.55, 0.38, 0.30), 1, shade=0.2)   # headboard
    shape(c, lambda q: rrect_path(q, x - 360, y - 170, 760, 130, 26), (0.95, 0.94, 0.97), 1, shade=0.12)  # mattress
    shape(c, lambda q: rrect_path(q, x - 330, y - 250, 190, 90, 40), (0.96, 0.96, 1.0), 1, shade=0.15)     # pillow
    for sx in (-1, 1):
        shape(c, lambda q, sx=sx: rrect_path(q, x + (sx * 360 if sx > 0 else -360) - 16, y - 50, 32, 50, 6), (0.45, 0.30, 0.24), 1, shade=0.2, lw=4)


def blanket(c, x, t):
    y = FLOOR_Y
    shape(c, lambda q: (q.move_to(x - 200, y - 175), q.curve_to(x - 100, y - 230, x + 200, y - 225, x + 400, y - 175),
                        q.line_to(x + 410, y - 60), q.curve_to(x + 100, y - 40, x - 100, y - 40, x - 210, y - 60), q.close_path()),
          (0.42, 0.55, 0.92), 1, shade=0.15, light=0.05)
    for k in range(5):
        c.move_to(x - 150 + k * 110, y - 200)
        c.line_to(x - 140 + k * 110, y - 60)
    c.set_line_width(3)
    c.set_source_rgba(1, 1, 1, 0.25)
    c.stroke()


def desk(c, x, t):
    y = FLOOR_Y
    ground(c, x, y + 6, 420, 0.4)
    shape(c, lambda q: rrect_path(q, x - 420, y - 330, 840, 40, 10), "wood", 1, shade=0.25)
    for sx in (-1, 1):
        shape(c, lambda q, sx=sx: rrect_path(q, x + sx * 380 - 18, y - 292, 36, 292, 8), shade_of("wood", 0.8), 1, shade=0.2, lw=4)


def hamster_wheel(c, x, y, r, t, k=1.0):
    ang = t * 5
    shape(c, lambda q: (q.move_to(x - r * 0.6, y + r + 60), q.line_to(x, y), q.line_to(x + r * 0.6, y + r + 60)), "steel", 1, shade=0, light=0, lw=10)
    ell_path(c, x, y, r, r)
    c.set_line_width(16)
    c.set_source_rgba(*INK, 1)
    c.stroke_preserve()
    c.set_line_width(10)
    c.set_source_rgb(*C("steel"))
    c.stroke()
    for i in range(16):
        a = ang + i * math.pi / 8
        c.move_to(x + r * 0.95 * math.cos(a), y + r * 0.95 * math.sin(a))
        c.line_to(x + r * 0.7 * math.cos(a), y + r * 0.7 * math.sin(a))
    c.set_line_width(5)
    c.set_source_rgba(*shade_of("steel", 0.7), 1)
    c.stroke()
    shape(c, lambda q: ell_path(q, x, y, 20, 20), "steel", 1, shade=0.2, lw=4)
