"""Picture for a Telegram post in the channel style: big number / headline, short subline, the narrator.

    python3 card.py --big "17 МЛН ₽" --sub "за однушку за 5,4 млн" --pose shrug --emo wow --color red --out out/card.jpg

1080x1350 (4:5, the largest a photo shows in the Telegram feed). Colors: red | green | gold | blue.
The narrator is the approved one from videos/narrator (never redraw him here).
"""
import argparse
import math
import os
import subprocess
import sys

import cairo

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "..", "videos", "narrator"))
import narrator  # noqa: E402

W, H = 1080, 1350
F_BLACK = "Inter Display Black"
F_XB = "Inter Display ExtraBold"
WHITE = (1, 1, 1)
TINTS = {"red": ((0.70, 0.04, 0.07), (1.0, 0.27, 0.27)), "green": ((0.03, 0.42, 0.20), (0.30, 0.95, 0.55)),
         "gold": ((0.55, 0.36, 0.02), (1.0, 0.80, 0.25)), "blue": ((0.05, 0.22, 0.55), (0.35, 0.85, 1.0))}


def background(c, tint):
    g = cairo.RadialGradient(W * 0.6, H * 0.62, 40, W * 0.5, H * 0.55, H * 0.95)
    g.add_color_stop_rgb(0, *tint)
    g.add_color_stop_rgb(0.6, tint[0] * 0.33, tint[1] * 0.3, tint[2] * 0.3)
    g.add_color_stop_rgb(1, 0.02, 0.01, 0.02)
    c.set_source(g)
    c.paint()
    c.save()
    c.translate(W * 0.62, H * 0.7)
    for k in range(26):
        a = k * 2 * math.pi / 26
        c.move_to(0, 0)
        c.line_to(1800 * math.cos(a - 0.05), 1800 * math.sin(a - 0.05))
        c.line_to(1800 * math.cos(a + 0.05), 1800 * math.sin(a + 0.05))
        c.close_path()
        c.set_source_rgba(1, 0.85, 0.7, 0.05)
        c.fill()
    c.restore()


def fit(c, s, face, size, max_w):
    c.select_font_face(face)
    while size > 30:
        c.set_font_size(size)
        if c.text_extents(s).x_advance <= max_w:
            break
        size -= 4
    return size


def outlined(c, s, x, y, size, color, face=F_BLACK, stroke=16):
    c.select_font_face(face)
    c.set_font_size(size)
    w = c.text_extents(s).x_advance
    x0 = x - w / 2
    for r, a in ((70, 0.10), (38, 0.18)):
        c.move_to(x0, y)
        c.text_path(s)
        c.set_line_width(r)
        c.set_source_rgba(*color, a)
        c.stroke()
    c.move_to(x0 + 7, y + 11)
    c.text_path(s)
    c.set_source_rgba(0, 0, 0, 0.6)
    c.fill()
    c.move_to(x0, y)
    c.text_path(s)
    c.set_line_width(stroke)
    c.set_line_join(cairo.LINE_JOIN_ROUND)
    c.set_source_rgb(0.05, 0.02, 0.02)
    c.stroke_preserve()
    c.set_source_rgb(*color)
    c.fill()


def wrap(c, s, size, max_w, face=F_XB):
    c.select_font_face(face)
    c.set_font_size(size)
    lines, cur = [], ""
    for word in s.split():
        t = (cur + " " + word).strip()
        if c.text_extents(t).x_advance > max_w and cur:
            lines.append(cur)
            cur = word
        else:
            cur = t
    return lines + ([cur] if cur else [])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--big", required=True, help="главная цифра или 1–3 слова")
    ap.add_argument("--sub", default="", help="подпись под цифрой, до ~40 символов")
    ap.add_argument("--pose", default="shrug", choices=["idle", "think", "cross", "explain", "shrug", "point", "facepalm"])
    ap.add_argument("--emo", default="wow", choices=["neutral", "doubt", "smirk", "wow", "sad", "happy", "angry"])
    ap.add_argument("--color", default="red", choices=list(TINTS))
    ap.add_argument("--out", default=os.path.join(HERE, "out", "card.jpg"))
    a = ap.parse_args()

    tint, accent = TINTS[a.color]
    surf = cairo.ImageSurface(cairo.FORMAT_RGB24, W, H)
    c = cairo.Context(surf)
    background(c, tint)

    narrator.draw(c, W * 0.5, H + 120, 0.74, {"pose": a.pose, "emo": a.emo, "t": 0.6, "level": 0.7, "look": 0.0})
    g = cairo.LinearGradient(0, 0, 0, 560)
    g.add_color_stop_rgba(0, 0, 0, 0, 0.75)
    g.add_color_stop_rgba(1, 0, 0, 0, 0)
    c.set_source(g)
    c.paint()

    big = a.big.upper()
    size = fit(c, big, F_BLACK, 190, W - 110)
    outlined(c, big, W / 2, 130 + size * 0.85, size, accent)
    y = 130 + size * 0.85 + 95
    for line in wrap(c, a.sub, 64, W - 140)[:2]:
        outlined(c, line, W / 2, y, 64, WHITE, face=F_XB, stroke=12)
        y += 78

    c.select_font_face(F_XB)
    c.set_font_size(34)
    tag = "ЧЁ ПО БАБКАМ"
    tw = c.text_extents(tag).x_advance
    c.set_source_rgba(0, 0, 0, 0.55)
    c.rectangle((W - tw) / 2 - 20, 34, tw + 40, 54)
    c.fill()
    c.set_source_rgb(*accent)
    c.move_to((W - tw) / 2, 73)
    c.show_text(tag)

    os.makedirs(os.path.dirname(os.path.abspath(a.out)), exist_ok=True)
    png = a.out.rsplit(".", 1)[0] + ".png"
    surf.write_to_png(png)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", png, "-q:v", "3", a.out], check=True)
    os.remove(png)
    print(a.out)


if __name__ == "__main__":
    main()
