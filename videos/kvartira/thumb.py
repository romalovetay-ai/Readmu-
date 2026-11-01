"""Thumbnail 1280x720 -> out/thumb.jpg"""
import math, subprocess, cairo
import gfx, character
from gfx import text, rgba, F_BLACK, F_XB

S = 1280 / 1920
surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, 1920, 1080)
c = cairo.Context(surf)
gfx.bg_grid(c, 2.0, tint=(0.62, 0.05, 0.08), alpha=0.28)
# distant skyline silhouette along the bottom
for i in range(9):
    bw = 150 + (i * 53) % 90
    bh = 260 + (i * 97) % 260
    x = -20 + i * 175
    gfx.panel_building(c, x, 1080 - bh, bw, bh, int(bh / 40), 4, lit=0.18, color=(0.16, 0.05, 0.07), seed=i + 21)
g = cairo.LinearGradient(0, 600, 0, 1080)
g.add_color_stop_rgba(0, 0, 0, 0, 0)
g.add_color_stop_rgba(1, 0, 0, 0, 0.6)
c.set_source(g)
c.paint()
# huge number
c.save()
c.translate(80, 330)
c.rotate(-0.05)
text(c, "17 080 000 ₽", 0, 0, 205, F_BLACK, (1, 1, 1), align="left", glow=1.0)
c.restore()
c.save()
c.translate(90, 470)
c.rotate(-0.05)
gfx.rrect(c, 0, -80, 560, 110, 18)
rgba(c, (1, 0.25, 0.25))
c.fill()
text(c, "ЗА ОДНУШКУ", 280, 8, 76, F_BLACK, (1, 1, 1), shadow=False)
c.restore()
character.draw(c, 1530, 1095, 0.78, {"pose": "facepalm", "emo": "sad", "t": 1.3, "look": -0.6})
surf.write_to_png("out/thumb.png")
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", "out/thumb.png", "-vf", "scale=1280:720", "-q:v", "2",
                "out/thumb.jpg"], check=True)
