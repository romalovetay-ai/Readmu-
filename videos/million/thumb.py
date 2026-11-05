"""Thumbnails for the million video -> out/thumb_A.jpg, thumb_B.jpg, thumb_C.jpg"""
import math, subprocess, cairo
import gfx, character, gags
from gfx import text, rgba, rrect, F_BLACK, F_XB, WHITE, RED, GOLD, GREEN

W, H = 1920, 1080


def base(c, warm=0.0):
    gfx.bg_calm(c, 2.0, warm)
    c.save()
    c.translate(1450, 520)
    for k in range(28):
        a = k * 2 * math.pi / 28
        c.move_to(0, 0)
        c.line_to(1600 * math.cos(a - 0.05), 1600 * math.sin(a - 0.05))
        c.line_to(1600 * math.cos(a + 0.05), 1600 * math.sin(a + 0.05))
        c.close_path()
        rgba(c, (1, 0.75, 0.85), 0.05)
        c.fill()
    c.restore()


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



def cash_pile(c, x, y, s=1.0):
    for i in range(14):
        gags.banknote(c, x + (i % 5) * 70 * s - 140 * s, y - (i // 5) * 40 * s - (i % 3) * 6, 1.3 * s, -0.25 + 0.11 * (i % 5))


def variant_a():
    """Million in cash + 'и это всё?!' + shocked narrator shrugging."""
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(s)
    base(c)
    cash_pile(c, 420, 900, 1.2)
    character.draw(c, 1530, 1180, 0.95, {"pose": "shrug", "emo": "wow", "t": 0.4, "level": 0.9, "look": -0.5})
    outlined(c, "1 000 000 ₽", 60, 300, 180, GREEN, glow=0.9, rot=-0.04)
    sticker(c, "И ЭТО ВСЁ?!", 95, 490, 120, RED, WHITE)
    save(s, "thumb_A")


def variant_b():
    """Huge golden 7 + 'причин копить миллион', narrator pointing."""
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(s)
    base(c)
    character.draw(c, 1560, 1160, 0.9, {"pose": "point", "emo": "smirk", "t": 0.7, "level": 0.6, "look": -0.8})
    outlined(c, "7", 110, 780, 760, GOLD, glow=1.0, stroke=18)
    outlined(c, "ПРИЧИН", 500, 400, 140, WHITE, glow=0.4)
    sticker(c, "КОПИТЬ", 520, 580, 100, GREEN, (0.05, 0.05, 0.05))
    sticker(c, "МИЛЛИОН", 520, 730, 100, GOLD, (0.05, 0.05, 0.05))
    save(s, "thumb_B")


def variant_c():
    """Empty wallet with a moth + 'миллион = ноль?', narrator facepalm."""
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(s)
    base(c, 0.6)
    gags.screen_card(c, 90, 520, 900, 480, 2.0, lambda cc, w, h: gags.g_wallet(cc, w, h, 1.6, 1.6))
    rrect(c, 120, 545, 840, 90, 10)
    rgba(c, (0.18, 0.14, 0.16))
    c.fill()
    character.draw(c, 1470, 1150, 1.0, {"pose": "facepalm", "emo": "sad", "t": 1.3, "look": -0.6})
    outlined(c, "МИЛЛИОН", 70, 230, 190, WHITE, glow=0.6, rot=-0.03)
    outlined(c, "= НОЛЬ?", 90, 400, 170, RED, glow=0.9, rot=-0.03)
    save(s, "thumb_C")


if __name__ == "__main__":
    variant_a()
    variant_b()
    variant_c()
