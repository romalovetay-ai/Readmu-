"""YouTube cover 1280x720 in the 2D style: narrator + money growing vs melting + big sticker title."""
import math, cairo, cv2
import art, cine, character
from art import *

def make(path, variant=0):
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); c = cairo.Context(s)
    background(c, 3.0, (0.0, 0.0), 820)
    # left: coin towers growing with an arrow
    for i, n in enumerate((3, 6, 11, 19)):
        coin_stack(c, 170 + i * 190, 1000, n, 80, seed=i)
    arrow(c, 180, 800, 800, 520, "green", lw=34)
    coin(c, 900, 520, 100, flip=0.9)
    title(c, "ИНВЕСТИЦИИ", 540, 200, fit(c, "ИНВЕСТИЦИИ", 170, 960), "white")
    title(c, "НА ПАЛЬЦАХ", 540, 340, 130, "gold")
    tag(c, "БЕЗ ИНФОЦЫГАН", 540, 450, 54, "red", rot=-0.05)
    cs = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); cc = cairo.Context(cs)
    st = character.perform(1.2, 0.7, "point", "wow"); st["look"] = -0.6
    character.draw(cc, 1530, H + 120, 0.95, st)
    cine.drop_shadow(c, cs, -40, 6, 24, 0.5)
    c.set_source_surface(cs); c.paint()
    img = cine.post(cine.to_np(s), 0.0, bloom=0.15, grain=0.0)
    cv2.imwrite(path, cv2.resize(img, (1280, 720), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 92])

if __name__ == "__main__":
    make("out/thumb.jpg")
