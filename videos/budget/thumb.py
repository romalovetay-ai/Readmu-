"""YouTube cover 1280x720 (v2): burst background, phone «80 000 -> 0 ₽» with money flying out, «ГДЕ ДЕНЬГИ?!», shocked narrator."""
import os, sys, math, random, cairo, cv2
sys.path.insert(1, os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "invest"))
import art, cine, character
import places as PL
from art import *

s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); c = cairo.Context(s)
PX, PY = 560, 700  # phone centre

# --- background: deep indigo + crimson burst from the phone ---
g = cairo.RadialGradient(PX, PY - 80, 50, PX, PY - 80, 1500)
g.add_color_stop_rgb(0, 0.98, 0.42, 0.30)
g.add_color_stop_rgb(0.35, 0.62, 0.10, 0.28)
g.add_color_stop_rgb(1, 0.10, 0.04, 0.18)
c.rectangle(0, 0, W, H); c.set_source(g); c.fill()
n = 28
for i in range(n):
    a0 = 2 * math.pi * i / n; a1 = a0 + math.pi / n
    c.move_to(PX, PY - 80)
    c.line_to(PX + 2600 * math.cos(a0), PY - 80 + 2600 * math.sin(a0))
    c.line_to(PX + 2600 * math.cos(a1), PY - 80 + 2600 * math.sin(a1))
    c.close_path()
    c.set_source_rgba(1, 0.85, 0.6, 0.07)
    c.fill()

# --- money flying out of the phone ---
rnd = random.Random(7)
notes = []
for i in range(16):
    ang = rnd.uniform(-math.pi * 0.98, -math.pi * 0.45) if i % 3 else math.pi + rnd.uniform(-0.35, 0.35)
    d = rnd.uniform(330, 700)
    notes.append((PX + d * math.cos(ang) * 1.25, PY - 120 + d * math.sin(ang) * 0.85, ang, d))
notes += [(PX + 260, 330, -1.0, 400), (PX + 300, 560, -0.35, 520), (PX + 180, 150, -1.2, 600)]
for x, y, ang, d in sorted(notes, key=lambda v: v[3]):
    # speed streaks behind each note
    for k in range(3):
        off = (k - 1) * 18
        c.move_to(x - 120 * math.cos(ang) + off * math.sin(ang), y - 120 * math.sin(ang) - off * math.cos(ang))
        c.line_to(x - 260 * math.cos(ang) + off * math.sin(ang), y - 260 * math.sin(ang) - off * math.cos(ang))
        c.set_line_width(6); c.set_line_cap(cairo.LINE_CAP_ROUND)
        c.set_source_rgba(1, 1, 1, 0.22); c.stroke()
    if rnd.random() < 0.35:
        coin(c, x, y, 34 + d * 0.02, flip=math.cos(d))
    else:
        banknote(c, x, y, 150 + d * 0.06, rot=ang + rnd.uniform(-0.6, 0.6), value=rnd.choice(("5000", "1000", "2000")))

# --- phone: 80 000 crossed -> 0 ₽ ---
def screen(q, w, h):
    PL.app_bg(q, w, h, (0.22, 0.14, 0.30), (0.08, 0.05, 0.13))
    plain(q, "МОЙ БАНК", w / 2, 92, 38, F_XB, (0.8, 0.75, 0.9))
    plain(q, "Баланс на 20-е", w / 2, 200, 36, F_SB, (0.75, 0.7, 0.85))
    plain(q, "80 000 ₽", w / 2, 300, 78, F_BLACK, "gold")
    q.move_to(w / 2 - 175, 278); q.line_to(w / 2 + 175, 266)
    q.set_line_width(12); q.set_source_rgba(*C("red"), 1); q.stroke()
    gg = cairo.RadialGradient(w / 2, 470, 10, w / 2, 470, 230)
    gg.add_color_stop_rgba(0, 1, 0.25, 0.3, 0.55); gg.add_color_stop_rgba(1, 1, 0.25, 0.3, 0)
    q.rectangle(0, 220, w, 500); q.set_source(gg); q.fill()
    title(q, "0 ₽", w / 2, 560, 230, "red")
PL.phone_ui(c, PX, PY + 40, 450, 860, screen, rot=-0.10)

# --- headline ---
_sz = 180
_w1, _w2, _sp = text_w(c, "ГДЕ", _sz), text_w(c, "ДЕНЬГИ?!", _sz), 50
_x0 = 70
title(c, "ГДЕ", _x0, 200, _sz, "white", align="left")
title(c, "ДЕНЬГИ?!", _x0 + _w1 + _sp, 200, _sz, "gold", align="left")

# --- narrator, shocked, open palms (hands away from the face) ---
cs = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H); cc = cairo.Context(cs)
st = character.perform_v2(1.2, 0.0, [], 0.0, "shrug", "wow")
st.update(emo2=None, vis=(0.75, 0.85, 1.0, 0.0), vamt=1.0, look=-0.5)
character.draw(cc, 1520, H + 150, 0.98, st)
cine.drop_shadow(c, cs, -40, 6, 24, 0.55)
c.set_source_surface(cs); c.paint()

# vignette
v = cairo.RadialGradient(W / 2, H / 2, 500, W / 2, H / 2, 1250)
v.add_color_stop_rgba(0, 0, 0, 0, 0); v.add_color_stop_rgba(1, 0.05, 0, 0.08, 0.6)
c.rectangle(0, 0, W, H); c.set_source(v); c.fill()

img = cine.post(cine.to_np(s), 0.0, bloom=0.15, grain=0.0)
os.makedirs("out", exist_ok=True)
cv2.imwrite("out/thumb.jpg", cv2.resize(img, (1280, 720), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 92])
