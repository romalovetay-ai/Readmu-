"""YouTube cover 1280x720: leaking salary bucket, Серёга with an empty wallet, narrator, sticker title."""
import os, sys, math, cairo, cv2
sys.path.insert(1, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "invest"))
import art, cine, character
import places as P
from art import *

s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); c = cairo.Context(s)
background(c, 3.0, (0.25, 0.0), 820)
# leaking bucket with coins pouring out of holes
x, y = 520, 1000
body = lambda q: (q.move_to(x - 230, y - 470), q.line_to(x + 230, y - 470), q.line_to(x + 180, y), q.line_to(x - 180, y), q.close_path())
shape(c, body, "steel", 1, shade=0.12)
c.save(); body(c); c.clip(); c.rectangle(x - 300, y - 200, 600, 200); c.set_source_rgb(*C("gold")); c.fill(); c.restore()
body(c); c.set_line_width(6); c.set_source_rgba(*INK, 1); c.stroke()
tag(c, "ЗАРПЛАТА", x, y - 500, 44, "gold")
for i, (hx, hy) in enumerate(((-150, -340), (-90, -160), (60, -380), (140, -220), (170, -90))):
    side = -1 if hx < 0 else 1
    for k in range(5):
        ph = k / 5
        coin(c, x + hx + side * ph * 240, y + hy + 380 * ph * ph, 22, flip=math.cos(k + i))
title(c, "КУДА УХОДИТ", 600, 190, 140, "white")
title(c, "ЗАРПЛАТА?", 600, 330, 150, "red")
cs = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); cc = cairo.Context(cs)
st = character.perform_v2(1.2, 0.0, [], 0.0, "point", "wow"); st.update(emo2=None, vis=(0.6, 0.78, 1.0, 0.0), vamt=0.9, look=-0.6)
character.draw(cc, 1530, H + 120, 0.95, st)
cine.drop_shadow(c, cs, -40, 6, 24, 0.5)
c.set_source_surface(cs); c.paint()
img = cine.post(cine.to_np(s), 0.0, bloom=0.15, grain=0.0)
os.makedirs("out", exist_ok=True)
cv2.imwrite("out/thumb.jpg", cv2.resize(img, (1280, 720), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 92])
