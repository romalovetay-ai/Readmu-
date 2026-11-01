"""Three clickable thumbnails (1280x720) for the 18+ version -> out/thumb_A.jpg, thumb_B.jpg, thumb_C.jpg"""
import math, subprocess, cairo
import gfx, character
from gfx import text, rgba, rrect, F_BLACK, F_XB, WHITE, RED, GOLD, GREEN

W, H = 1920, 1080


def base(c, tint=(0.70, 0.04, 0.07)):
    g = cairo.RadialGradient(1300, 420, 50, 1100, 540, 1300)
    g.add_color_stop_rgb(0, *tint)
    g.add_color_stop_rgb(0.6, tint[0] * 0.35, tint[1] * 0.3, tint[2] * 0.3)
    g.add_color_stop_rgb(1, 0.02, 0, 0.01)
    c.set_source(g)
    c.paint()
    # speed rays behind the character for energy
    c.save()
    c.translate(1450, 520)
    for k in range(28):
        a = k * 2 * math.pi / 28
        c.move_to(0, 0)
        c.line_to(1600 * math.cos(a - 0.05), 1600 * math.sin(a - 0.05))
        c.line_to(1600 * math.cos(a + 0.05), 1600 * math.sin(a + 0.05))
        c.close_path()
        rgba(c, (1, 0.6, 0.5), 0.06)
        c.fill()
    c.restore()
    # dark skyline
    for i in range(10):
        bw = 150 + (i * 53) % 90
        bh = 200 + (i * 97) % 230
        gfx.panel_building(c, -20 + i * 170, H - bh, bw, bh, int(bh / 40), 4, lit=0.15, color=(0.12, 0.03, 0.05), seed=i + 31)
    g = cairo.LinearGradient(0, 650, 0, H)
    g.add_color_stop_rgba(0, 0, 0, 0, 0)
    g.add_color_stop_rgba(1, 0, 0, 0, 0.7)
    c.set_source(g)
    c.paint()


def outlined(c, s, x, y, size, color=WHITE, stroke=14, align="left", rot=0.0, glow=0.0):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.select_font_face(F_BLACK)
    c.set_font_size(size)
    w = c.text_extents(s).x_advance
    x0 = -w / 2 if align == "center" else 0
    if glow:
        for r, a in ((60, 0.10), (34, 0.18)):
            c.move_to(x0, 0)
            c.text_path(s)
            c.set_line_width(r)
            rgba(c, color, a * glow)
            c.stroke()
    c.move_to(x0 + 6, 10)
    c.text_path(s)
    rgba(c, (0, 0, 0), 0.6)
    c.fill()
    c.move_to(x0, 0)
    c.text_path(s)
    c.set_line_width(stroke)
    c.set_line_join(cairo.LINE_JOIN_ROUND)
    rgba(c, (0.05, 0.02, 0.02))
    c.stroke_preserve()
    rgba(c, color)
    c.fill()
    c.restore()
    return w


def sticker(c, s, x, y, size, bg=GOLD, fg=(0.05, 0.05, 0.05), rot=-0.06):
    c.save()
    c.translate(x, y)
    c.rotate(rot)
    c.select_font_face(F_BLACK)
    c.set_font_size(size)
    w = c.text_extents(s).x_advance
    rrect(c, -24, -size * 0.95, w + 48, size * 1.25, 18)
    rgba(c, bg)
    c.fill()
    c.move_to(0, 0)
    c.text_path(s)
    rgba(c, fg)
    c.fill()
    c.restore()


def save(surf, name):
    png = f"out/{name}.png"
    surf.write_to_png(png)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", png, "-vf", "scale=1280:720", "-q:v", "2",
                    f"out/{name}.jpg"], check=True)


def variant_a():
    """Shocked face + one huge number."""
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(s)
    base(c)
    character.draw(c, 1440, 1180, 1.05, {"pose": "shrug", "emo": "wow", "t": 0.4, "level": 0.9, "look": -0.5})
    outlined(c, "17 МЛН", 70, 400, 300, WHITE, glow=0.8, rot=-0.04)
    sticker(c, "ЗА ОДНУШКУ?!", 95, 560, 104, RED, WHITE)
    save(s, "thumb_A")


def variant_b():
    """Crossed-out price -> real price."""
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(s)
    base(c, (0.55, 0.05, 0.06))
    character.draw(c, 1440, 1150, 0.9, {"pose": "point", "emo": "angry", "t": 0.7, "level": 0.8, "look": -0.8})
    w = outlined(c, "5,4 МЛН", 90, 270, 170, (0.85, 0.85, 0.85), stroke=10, rot=-0.03)
    c.save()
    c.translate(90, 270)
    c.rotate(-0.03)
    c.move_to(-10, -50)
    c.line_to(w + 10, -70)
    rgba(c, RED)
    c.set_line_width(22)
    c.stroke()
    c.restore()
    outlined(c, "→ 17 МЛН", 70, 560, 230, RED, glow=1.0, rot=-0.03)
    sticker(c, "ЗА ТУ ЖЕ ХАТУ", 110, 720, 80, GOLD)
    save(s, "thumb_B")


def variant_c():
    """93% of salary to the bank: pie + facepalm."""
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(s)
    base(c, (0.5, 0.03, 0.06))
    cx, cy, r = 430, 470, 300
    c.arc(cx, cy, r + 14, 0, 2 * math.pi)
    rgba(c, (0.05, 0.02, 0.02))
    c.fill()
    c.move_to(cx, cy)
    c.arc(cx, cy, r, -math.pi / 2, -math.pi / 2 + 2 * math.pi * 0.93)
    c.close_path()
    rgba(c, RED)
    c.fill()
    c.move_to(cx, cy)
    c.arc(cx, cy, r, -math.pi / 2 + 2 * math.pi * 0.93, 1.5 * math.pi)
    c.close_path()
    rgba(c, GREEN)
    c.fill()
    outlined(c, "93%", cx, cy + 75, 210, WHITE, align="center")
    sticker(c, "ЗАРПЛАТЫ — БАНКУ", 120, 940, 84, GOLD, rot=-0.03)
    character.draw(c, 1460, 1150, 1.0, {"pose": "facepalm", "emo": "sad", "t": 1.3, "look": -0.6})
    outlined(c, "20 ЛЕТ", 790, 190, 140, WHITE, glow=0.6, rot=0.05)
    save(s, "thumb_C")


if __name__ == "__main__":
    variant_a()
    variant_b()
    variant_c()
