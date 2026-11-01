"""Channel branding: avatar 800x800 (circle-safe) and banner 2560x1440 (key content inside the 1546x423 safe area).
  python3 brand.py ["ИМЯ КАНАЛА"]  -> out/brand_avatar.png, out/brand_banner.jpg, out/brand_banner_preview.jpg"""
import math, sys, subprocess, cairo
import gfx, character
from gfx import rgba, rrect, F_BLACK, F_XB, F_SB, WHITE, RED, GOLD, GREEN

NAME = sys.argv[1] if len(sys.argv) > 1 else "ЧЁ ПО БАБКАМ"
TAG = "считаю деньги без курсов и без воды"


def grid(c, w, h, t=1.0, tint=(0.62, 0.04, 0.07), alpha=0.22):
    g = cairo.RadialGradient(w * 0.6, h * 0.45, 30, w * 0.55, h * 0.5, max(w, h) * 0.8)
    g.add_color_stop_rgb(0, *tint)
    g.add_color_stop_rgb(0.6, tint[0] * 0.35, tint[1] * 0.3, tint[2] * 0.3)
    g.add_color_stop_rgb(1, 0.02, 0, 0.01)
    c.set_source(g)
    c.paint()
    step, amp = 120, 16

    def warp(x, y):
        return (x + amp * math.sin(y * 0.006 + t * 0.6), y + amp * math.sin(x * 0.005 + t * 0.5))
    for gx in range(-step, w + 2 * step, step):
        pts = [warp(gx, y) for y in range(-40, h + 60, 30)]
        c.move_to(*pts[0])
        for p in pts[1:]:
            c.line_to(*p)
    for gy in range(-step, h + 2 * step, step):
        pts = [warp(x, gy) for x in range(-40, w + 60, 30)]
        c.move_to(*pts[0])
        for p in pts[1:]:
            c.line_to(*p)
    rgba(c, (1, 0.55, 0.6), alpha)
    c.set_line_width(2)
    c.stroke()


def outlined(c, s, x, y, size, color=WHITE, stroke=12, align="left", glow=0.0, face=F_BLACK):
    c.select_font_face(face)
    c.set_font_size(size)
    w = c.text_extents(s).x_advance
    x0 = x - w / 2 if align == "center" else (x - w if align == "right" else x)
    if glow:
        for r, a in ((50, 0.10), (26, 0.18)):
            c.move_to(x0, y)
            c.text_path(s)
            c.set_line_width(r)
            rgba(c, color, a * glow)
            c.stroke()
    c.move_to(x0, y)
    c.text_path(s)
    c.set_line_width(stroke)
    c.set_line_join(cairo.LINE_JOIN_ROUND)
    rgba(c, (0.05, 0.02, 0.02))
    c.stroke_preserve()
    rgba(c, color)
    c.fill()
    return w


def avatar():
    S = 800
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, S, S)
    c = cairo.Context(s)
    grid(c, S, S, tint=(0.80, 0.06, 0.09), alpha=0.25)
    # coin-gold ring that survives the circle crop
    c.arc(S / 2, S / 2, S / 2 - 18, 0, 2 * math.pi)
    rgba(c, GOLD)
    c.set_line_width(22)
    c.stroke()
    # head-and-shoulders close-up, face centred for the circle
    c.save()
    c.arc(S / 2, S / 2, S / 2 - 30, 0, 2 * math.pi)
    c.clip()
    character.draw(c, S / 2, S + 250, 0.95, {"pose": "idle", "emo": "smirk", "t": 0.5, "look": 0.0})
    c.restore()
    # ruble badge
    bx, by, br = S - 175, S - 175, 92
    c.arc(bx, by, br, 0, 2 * math.pi)
    rgba(c, GREEN)
    c.fill_preserve()
    rgba(c, (0.05, 0.05, 0.05))
    c.set_line_width(10)
    c.stroke()
    outlined(c, "₽", bx, by + 42, 130, WHITE, stroke=8, align="center")
    s.write_to_png("out/brand_avatar.png")


def banner():
    Wb, Hb = 2560, 1440
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, Wb, Hb)
    c = cairo.Context(s)
    grid(c, Wb, Hb)
    # skyline along the bottom (visible on TV only, decoration)
    for i in range(16):
        bw = 150 + (i * 53) % 90
        bh = 220 + (i * 97) % 260
        gfx.panel_building(c, -20 + i * 165, Hb - bh, bw, bh, int(bh / 40), 4, lit=0.15, color=(0.12, 0.03, 0.05), seed=i + 41)
    # safe area (1546 x 423) centred: everything important lives here
    sx, sy, sw, sh = (Wb - 1546) / 2, (Hb - 423) / 2, 1546, 423
    # character on the right of the safe area, cropped by its bottom edge
    c.save()
    c.rectangle(0, 0, Wb, sy + sh)
    c.clip()
    character.draw(c, sx + sw - 215, sy + sh + 25, 0.45, {"pose": "point", "emo": "smirk", "t": 0.9, "look": -0.7})
    c.restore()
    outlined(c, NAME, sx + 20, sy + 200, 150, WHITE, glow=0.6)
    c.select_font_face(F_XB)
    c.set_font_size(54)
    tw = c.text_extents(TAG.upper()).x_advance
    rrect(c, sx + 20, sy + 250, tw + 56, 84, 16)
    rgba(c, GOLD)
    c.fill()
    c.move_to(sx + 48, sy + 310)
    c.text_path(TAG.upper())
    rgba(c, (0.05, 0.05, 0.05))
    c.fill()
    outlined(c, "ИПОТЕКА · ЗАРПЛАТЫ · ИНВЕСТИЦИИ · ПОЧЕМУ ВСЁ ДОРОГО", sx + 20, sy + 395, 40, (0.95, 0.85, 0.85),
             stroke=6, face=F_XB)
    s.write_to_png("out/brand_banner.png")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "out/brand_banner.png", "-q:v", "2", "out/brand_banner.jpg"],
                   check=True)
    # preview with the safe area marked, to check the crop on phones
    c.rectangle(sx, sy, sw, sh)
    rgba(c, (0.3, 1, 0.5), 0.9)
    c.set_line_width(4)
    c.stroke()
    s.write_to_png("out/brand_banner_preview.png")


if __name__ == "__main__":
    avatar()
    banner()
