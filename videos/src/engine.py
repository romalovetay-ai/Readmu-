import math, random
import cairo
import numpy as np
from PIL import Image, ImageDraw, ImageFont

W, H, FPS = 720, 1280, 30
FONTDIR = "/tmp/claude-0/-home-user-Readmu-/ef786176-9eaf-51d0-8768-a9c5eb90af56/scratchpad/fonts/"
_fonts = {}


def font(name, size):
    k = (name, int(size))
    if k not in _fonts:
        _fonts[k] = ImageFont.truetype(FONTDIR + name, int(size))
    return _fonts[k]


def hexc(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))


def col(ctx, c, a=1.0):
    if isinstance(c, str):
        c = hexc(c)
    ctx.set_source_rgba(c[0], c[1], c[2], a)


def ease(x):
    x = max(0.0, min(1.0, x))
    return x * x * (3 - 2 * x)


def clamp(x, a=0.0, b=1.0):
    return max(a, min(b, x))


def lerp(a, b, t):
    return a + (b - a) * t


def rect(ctx, x, y, w, h, c, a=1.0):
    col(ctx, c, a)
    ctx.rectangle(x, y, w, h)
    ctx.fill()


def rrect(ctx, x, y, w, h, r, c=None, a=1.0, fill=True):
    ctx.new_sub_path()
    ctx.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    ctx.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    ctx.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    ctx.arc(x + r, y + r, r, math.pi, 1.5 * math.pi)
    ctx.close_path()
    if c is not None:
        col(ctx, c, a)
        if fill:
            ctx.fill()


def circle(ctx, x, y, r, c, a=1.0):
    col(ctx, c, a)
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.fill()


def line(ctx, x1, y1, x2, y2, w, c, a=1.0):
    col(ctx, c, a)
    ctx.set_line_width(w)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.move_to(x1, y1)
    ctx.line_to(x2, y2)
    ctx.stroke()


def poly(ctx, pts, c, a=1.0):
    col(ctx, c, a)
    ctx.move_to(*pts[0])
    for p in pts[1:]:
        ctx.line_to(*p)
    ctx.close_path()
    ctx.fill()


def glow(ctx, x, y, r, c, a=0.6):
    c = hexc(c) if isinstance(c, str) else c
    g = cairo.RadialGradient(x, y, 0, x, y, r)
    g.add_color_stop_rgba(0, c[0], c[1], c[2], a)
    g.add_color_stop_rgba(1, c[0], c[1], c[2], 0)
    ctx.set_source(g)
    ctx.arc(x, y, r, 0, 2 * math.pi)
    ctx.fill()


class Texts:
    """Text drawn with PIL after the cairo pass; positions follow the camera."""

    def __init__(self):
        self.items = []

    def add(self, ctx, x, y, s, size, color="#ffffff", fname="Rubik-ExtraBold.ttf", anchor="mm",
            stroke=0, stroke_color="#000000", alpha=1.0, rot=0):
        dx, dy = ctx.user_to_device(x, y)
        m = ctx.get_matrix()
        sc = math.hypot(m.xx, m.yx)
        self.items.append((dx, dy, s, size * sc, color, fname, anchor, stroke * sc, stroke_color, alpha, rot))

    def draw(self, img):
        for (x, y, s, size, color, fname, anchor, stroke, sc, alpha, rot) in self.items:
            if alpha <= 0.01 or size < 2:
                continue
            f = font(fname, size)
            if rot == 0 and alpha >= 0.99:
                ImageDraw.Draw(img).text((x, y), s, font=f, fill=color, anchor=anchor,
                                         stroke_width=int(round(stroke)), stroke_fill=sc)
                continue
            bb = f.getbbox(s, anchor="mm", stroke_width=int(stroke))
            pad = int(stroke) + 6
            tw, th = bb[2] - bb[0] + 2 * pad, bb[3] - bb[1] + 2 * pad
            layer = Image.new("RGBA", (tw, th), (0, 0, 0, 0))
            ImageDraw.Draw(layer).text((tw / 2, th / 2), s, font=f, fill=color, anchor="mm",
                                       stroke_width=int(round(stroke)), stroke_fill=sc)
            if rot:
                layer = layer.rotate(rot, expand=True, resample=Image.BICUBIC)
            if alpha < 0.99:
                a = layer.getchannel("A").point(lambda v: int(v * alpha))
                layer.putalpha(a)
            img.alpha_composite(layer, (int(x - layer.width / 2), int(y - layer.height / 2)))


# ---------------------------------------------------------------- characters

SKIN = "#F2C9A0"
HERO = dict(body="#2E7D4F", stripe="#FFFFFF", hair="#3B2A1E", pants="#2E7D4F", shoe="#1E1E1E")
COPY = dict(body="#2E7D4F", stripe="#FFFFFF", hair="#3B2A1E", pants="#2E7D4F", shoe="#1E1E1E", copy=True)
LANDLORD = dict(body="#7A5236", stripe=None, hair="#9A9A9A", pants="#4A3426", shoe="#2A1C14", fat=True,
                mustache=True, bald=True)
GRANNY = dict(body="#8A4F7D", stripe=None, hair="#C9C9C9", pants="#5B3A55", shoe="#3A2A20", scarf="#C0392B",
              skirt=True)
VITYA = dict(body="#6E8A76", stripe="#B9C4BC", hair="#4A4038", pants="#6E8A76", shoe="#2A2A2A", beard=True,
             thin=True, skin="#D9C2A8")
TENANT = dict(body="#C2662D", stripe=None, hair="#1E1E1E", pants="#3A3F55", shoe="#222222")


def limb(ctx, x, y, a1, a2, l1, l2, w, c, stripe=None, s=1):
    """Two-segment limb; angles in degrees from straight down, positive = forward (+x)."""
    r1, r2 = math.radians(a1), math.radians(a2)
    ex, ey = x + math.sin(r1) * l1, y + math.cos(r1) * l1
    hx, hy = ex + math.sin(r2) * l2, ey + math.cos(r2) * l2
    col(ctx, c)
    ctx.set_line_width(w)
    ctx.set_line_cap(cairo.LINE_CAP_ROUND)
    ctx.set_line_join(cairo.LINE_JOIN_ROUND)
    ctx.move_to(x, y)
    ctx.line_to(ex, ey)
    ctx.line_to(hx, hy)
    ctx.stroke()
    if stripe:
        col(ctx, stripe)
        ctx.set_line_width(3.2 * s)
        off = w * 0.18
        ctx.move_to(x + off, y + 4 * s)
        ctx.line_to(ex + off, ey)
        ctx.line_to(hx + off * 0.7, hy - 6 * s)
        ctx.stroke()
    return hx, hy


def person(ctx, x, y, s=1.0, look=1, st=None, pose=None, t=0.0):
    st = st or HERO
    p = dict(armB=(8, -10), armF=(-8, 10), legB=0, legF=0, lean=0, eyes="open", mouth="none",
             head_dx=0, sit=False, lie=False, talk=False, pupil=(1, 0))
    if pose:
        p.update(pose)
    skin = st.get("skin", SKIN)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(s * look, s)
    if p["lie"]:
        ctx.rotate(-math.pi / 2)
    fat = st.get("fat", False)
    thin = st.get("thin", False)
    tw = 46 if fat else (30 if thin else 34)
    hip_y = -150
    sh_y = -272
    if p["sit"]:
        hip_y = -95
        sh_y = -217
    ctx.save()
    ctx.translate(0, hip_y)
    ctx.rotate(math.radians(p["lean"]))
    ctx.translate(0, -hip_y)
    # back limbs
    shoe = st["shoe"]
    if p["sit"]:
        lx, ly = limb(ctx, -6, hip_y, 90 + p["legB"], 0, 70, 82, 25, st["pants"], st.get("stripe"))
        line(ctx, lx, ly, lx + 16, ly, 16, shoe)
    elif not st.get("skirt"):
        lx, ly = limb(ctx, -6, hip_y, p["legB"], p["legB"] * 0.3, 75, 72, 25, st["pants"], st.get("stripe"))
        line(ctx, lx - 4, ly, lx + 14, ly, 15, shoe)
    else:
        line(ctx, -6, hip_y + 60, -6, -4, 14, "#2b2b2b")
        line(ctx, -10, -4, 8, -4, 14, shoe)
    ax, ay = limb(ctx, -4, sh_y + 10, p["armB"][0], p["armB"][1], 62, 60, 20, darken(st["body"], 0.85),
                  st.get("stripe"))
    circle(ctx, ax, ay, 11, darken(skin, 0.9))
    # torso
    if st.get("skirt"):
        poly(ctx, [(-tw, sh_y + 20), (tw, sh_y + 20), (tw + 18, hip_y + 70), (-tw - 18, hip_y + 70)], st["pants"])
    rrect(ctx, -tw, sh_y - 12, tw * 2, hip_y - sh_y + 26, 18, st["body"])
    if st.get("stripe") and not st.get("copy_faded"):
        rect(ctx, tw * 0.15, sh_y - 8, 4, 40, st["stripe"], 0.9)
    if st.get("scarf"):
        pass
    # front leg
    if p["sit"]:
        lx, ly = limb(ctx, 6, hip_y, 90 + p["legF"], 0, 70, 82, 26, st["pants"], st.get("stripe"))
        line(ctx, lx, ly, lx + 18, ly, 16, shoe)
    elif not st.get("skirt"):
        lx, ly = limb(ctx, 6, hip_y, p["legF"], p["legF"] * 0.3, 75, 72, 26, st["pants"], st.get("stripe"))
        line(ctx, lx - 4, ly, lx + 16, ly, 16, shoe)
    else:
        line(ctx, 8, hip_y + 60, 8, -4, 14, "#2b2b2b")
        line(ctx, 4, -4, 24, -4, 14, shoe)
    # head
    hx, hy = p["head_dx"], sh_y - 58
    rect(ctx, -8, sh_y - 26, 16, 20, skin)
    circle(ctx, hx, hy, 46, skin)
    hair = st["hair"]
    if st.get("scarf"):
        col(ctx, st["scarf"])
        ctx.arc(hx, hy, 52, math.pi * 0.95, math.pi * 2.05)
        ctx.fill()
        poly(ctx, [(hx - 50, hy + 4), (hx - 30, hy + 10), (hx - 46, hy + 52)], st["scarf"])
    elif st.get("bald"):
        col(ctx, hair)
        ctx.arc(hx, hy, 47, math.pi * 0.75, math.pi * 1.05)
        ctx.arc_negative(hx, hy, 38, math.pi * 1.05, math.pi * 0.75)
        ctx.fill()
    else:
        col(ctx, hair)
        ctx.arc(hx, hy, 48, math.pi * 1.0, math.pi * 1.95)
        ctx.close_path()
        ctx.fill()
        poly(ctx, [(hx - 48, hy - 2), (hx - 30, hy - 30), (hx - 30, hy + 14), (hx - 46, hy + 16)], hair)
    if st.get("beard"):
        col(ctx, hair)
        ctx.arc(hx + 6, hy + 8, 42, math.pi * 0.05, math.pi * 0.95)
        ctx.fill()
    # eyes
    ex = hx + 18
    ey = hy - 4
    e = p["eyes"]
    pdx, pdy = p["pupil"]
    for k, (ox, rr) in enumerate(((0, 10.5), (22, 10.5))):
        cx = ex + ox
        if e == "closed":
            line(ctx, cx - 7, ey + 2, cx + 7, ey + 2, 3, "#222222")
            continue
        r = rr * (1.35 if e == "wide" else 1.0)
        circle(ctx, cx, ey, r, "#FFFFFF")
        pr = 4.6 if e != "wide" else 3.8
        circle(ctx, cx + pdx * 3.5, ey + pdy * 3, pr, "#151515")
        if st.get("copy"):
            circle(ctx, cx + pdx * 3.5, ey + pdy * 3, pr * 0.45, "#9BFFB0")
        if e == "angry":
            line(ctx, cx - 9, ey - 13 + (k * 4), cx + 9, ey - 9 - (k * 4), 3.5, "#222222")
        if e == "half":
            rect(ctx, cx - r - 1, ey - r - 1, 2 * r + 2, r + 1, skin)
            line(ctx, cx - r, ey, cx + r, ey, 2.5, "#333333")
    # nose
    circle(ctx, hx + 46, hy + 10, 7, darken(skin, 0.92))
    if st.get("mustache"):
        poly(ctx, [(hx + 22, hy + 22), (hx + 50, hy + 18), (hx + 56, hy + 30), (hx + 26, hy + 30)], "#5A4636")
    m = p["mouth"]
    if p["talk"]:
        m = "o" if (int(t * 9) % 3) else "flat"
    if m == "o":
        circle(ctx, hx + 30, hy + 32, 6, "#5A2020")
    elif m == "flat":
        line(ctx, hx + 22, hy + 30, hx + 36, hy + 30, 3, "#5A2020")
    elif m == "smile":
        col(ctx, "#5A2020")
        ctx.set_line_width(3)
        ctx.arc(hx + 28, hy + 22, 10, 0.2, math.pi - 0.6)
        ctx.stroke()
    elif m == "scream":
        rrect(ctx, hx + 22, hy + 24, 16, 20, 7, "#5A2020")
    # front arm
    ax, ay = limb(ctx, 6, sh_y + 10, p["armF"][0], p["armF"][1], 62, 60, 21, st["body"], st.get("stripe"))
    circle(ctx, ax, ay, 12, skin)
    ctx.restore()
    ctx.restore()
    return ax, ay


def darken(c, k):
    c = hexc(c) if isinstance(c, str) else c
    return (c[0] * k, c[1] * k, c[2] * k)


def walk_pose(t, speed=1.0, amp=24):
    ph = math.sin(t * 7 * speed)
    return dict(legB=amp * ph, legF=-amp * ph, armB=(-20 * ph, -10 * ph - 8), armF=(20 * ph, 10 * ph + 8))


# ---------------------------------------------------------------- environments

def wall_pattern(ctx, x0, y0, w, h, base, fg, step=60):
    rect(ctx, x0, y0, w, h, base)
    col(ctx, fg, 0.35)
    for i in range(int(w // step) + 2):
        for j in range(int(h // step) + 2):
            cx = x0 + i * step + (step / 2 if j % 2 else 0)
            cy = y0 + j * step
            ctx.move_to(cx, cy - 9)
            ctx.line_to(cx + 7, cy)
            ctx.line_to(cx, cy + 9)
            ctx.line_to(cx - 7, cy)
            ctx.close_path()
    ctx.fill()


def floorboards(ctx, x0, y0, w, h, c="#8A5A3B"):
    rect(ctx, x0, y0, w, h, c)
    for i in range(int(h // 26) + 1):
        line(ctx, x0, y0 + i * 26, x0 + w, y0 + i * 26, 2, darken(c, 0.8))
    random.seed(3)
    for i in range(int(h // 26) + 1):
        for k in range(4):
            xx = x0 + random.random() * w
            line(ctx, xx, y0 + i * 26, xx, y0 + i * 26 + 26, 2, darken(c, 0.8))


def window(ctx, x, y, w, h, night=True, t=0):
    rect(ctx, x - 10, y - 10, w + 20, h + 20, "#F4F1EA")
    if night:
        g = cairo.LinearGradient(0, y, 0, y + h)
        g.add_color_stop_rgb(0, *hexc("#0E1530"))
        g.add_color_stop_rgb(1, *hexc("#24305A"))
    else:
        g = cairo.LinearGradient(0, y, 0, y + h)
        g.add_color_stop_rgb(0, *hexc("#9CCBEA"))
        g.add_color_stop_rgb(1, *hexc("#D8ECF7"))
    ctx.set_source(g)
    ctx.rectangle(x, y, w, h)
    ctx.fill()
    if night:
        circle(ctx, x + w * 0.72, y + h * 0.25, 18, "#F5F0D0")
        circle(ctx, x + w * 0.72 + 7, y + h * 0.25 - 4, 15, "#24305A")
        random.seed(5)
        for _ in range(10):
            circle(ctx, x + random.random() * w, y + random.random() * h * 0.6, 1.5, "#FFFFFF", 0.7)
    # silhouette of panel blocks
    random.seed(9)
    bx = x
    while bx < x + w:
        bw = 40 + random.random() * 50
        bh = h * (0.25 + random.random() * 0.3)
        rect(ctx, bx, y + h - bh, bw, bh, "#1A1F33" if night else "#B8C4CF")
        for i in range(int(bw // 14)):
            for j in range(int(bh // 18)):
                if random.random() < (0.25 if night else 0.0):
                    rect(ctx, bx + 4 + i * 14, y + h - bh + 6 + j * 18, 6, 8, "#F7D774", 0.9)
        bx += bw + 4
    line(ctx, x + w / 2, y, x + w / 2, y + h, 8, "#F4F1EA")
    line(ctx, x, y + h * 0.45, x + w, y + h * 0.45, 8, "#F4F1EA")


def wardrobe(ctx, x, y, w=190, h=420, shake=0.0, open_=0.0, t=0):
    dx = math.sin(t * 60) * shake * 6
    ctx.save()
    ctx.translate(dx, 0)
    rect(ctx, x, y, w, h, "#6B4428")
    rect(ctx, x + 8, y + 8, w - 16, h - 16, "#3A2416")
    if open_ < 0.99:
        dw = (w / 2 - 10) * (1 - open_)
        rect(ctx, x + 10, y + 10, dw, h - 30, "#7E5233")
        rect(ctx, x + w - 10 - dw, y + 10, dw, h - 30, "#7E5233")
        if dw > 20:
            circle(ctx, x + 10 + dw - 12, y + h / 2, 5, "#D6B37A")
            circle(ctx, x + w - 10 - dw + 12, y + h / 2, 5, "#D6B37A")
    rect(ctx, x - 6, y - 14, w + 12, 16, "#5A3820")
    ctx.restore()


def bed(ctx, x, y, w=330):
    rect(ctx, x, y - 70, w, 50, "#E8E2D6")
    rect(ctx, x, y - 24, w, 24, "#5A3A25")
    rect(ctx, x - 14, y - 150, 22, 150, "#5A3A25")
    rect(ctx, x + w - 8, y - 95, 20, 95, "#5A3A25")
    rrect(ctx, x + 10, y - 100, 90, 36, 14, "#FFFFFF")
    rect(ctx, x + 90, y - 82, w - 92, 30, "#3F6FA8")


def nightstand_clock(ctx, texts, x, y, txt="03:07", red=True, blink=True, t=0):
    rrect(ctx, x + 8, y - 142, 94, 52, 10, "#151515")
    on = (not blink) or (int(t * 2) % 2 == 0)
    glow(ctx, x + 55, y - 116, 70, "#FF3030", 0.25 if red else 0.1)
    texts.add(ctx, x + 55, y - 116, txt if on else txt.replace(":", " "), 34, "#FF4A3A" if red else "#7CFF8C",
              "RussoOne.ttf")


def room(ctx, texts, t, p):
    night = p.get("night", True)
    wall = "#C9B48E" if not p.get("green") else "#9DB59A"
    wall_pattern(ctx, -200, -200, W + 400, 1120, wall, darken(wall, 0.75))
    rect(ctx, -200, 880, W + 400, 14, "#6B4428")
    floorboards(ctx, -200, 894, W + 400, 700)
    window(ctx, 70, 230, 230, 300, night=night, t=t)
    if p.get("carpet", True):
        poly(ctx, [(150, 1010), (600, 1010), (660, 1140), (90, 1140)], "#9E2B2B")
        poly(ctx, [(180, 1025), (575, 1025), (620, 1125), (130, 1125)], "#B63A3A")
    hatch = p.get("hatch")
    if hatch:
        hx, hy = 375, 1075
        poly(ctx, [(hx - 120, hy - 50), (hx + 120, hy - 50), (hx + 150, hy + 50), (hx - 150, hy + 50)], "#2F2F33")
        if hatch == "open":
            poly(ctx, [(hx - 105, hy - 40), (hx + 105, hy - 40), (hx + 130, hy + 40), (hx - 130, hy + 40)],
                 "#050505")
            glow(ctx, hx, hy, 140, "#5CFF8A", 0.18 + 0.06 * math.sin(t * 3))
            poly(ctx, [(hx - 120, hy - 50), (hx + 120, hy - 50), (hx + 110, hy - 250), (hx - 110, hy - 250)],
                 "#4A4A50")
            line(ctx, hx - 60, hy - 170, hx + 60, hy - 170, 6, "#777777")
            texts.add(ctx, hx, hy - 120, "НЕ ОТВЕЧАЙ", 26, "#D9D9D9", "RussoOne.ttf", rot=0, alpha=0.8)
        else:
            poly(ctx, [(hx - 105, hy - 40), (hx + 105, hy - 40), (hx + 130, hy + 40), (hx - 130, hy + 40)],
                 "#4A4A50")
            line(ctx, hx - 40, hy, hx + 40, hy, 7, "#777777")
    wardrobe(ctx, 480, 460, shake=p.get("shake", 0), open_=p.get("wopen", 0), t=t)
    bed(ctx, 40, 960, 330)
    rect(ctx, 380, 870, 110, 90, "#6B4428")
    line(ctx, 390, 915, 480, 915, 3, "#4A2E1A")
    if p.get("clock", True):
        nightstand_clock(ctx, texts, 330, 690, p.get("time", "03:07"), t=t, blink=p.get("blink", False))
    if p.get("lamp", True):
        line(ctx, 360, 0, 360, 120, 3, "#333333")
        poly(ctx, [(330, 120), (390, 120), (405, 160), (315, 160)], "#E9D9A6")
        if not night or p.get("lamp_on"):
            glow(ctx, 360, 170, 380, "#FFE7A0", 0.25)


def building(ctx, texts, t, p):
    g = cairo.LinearGradient(0, 0, 0, 900)
    g.add_color_stop_rgb(0, *hexc("#7FB6DE"))
    g.add_color_stop_rgb(1, *hexc("#D7EAF3"))
    ctx.set_source(g)
    ctx.rectangle(-300, -300, W + 600, 1300)
    ctx.fill()
    for cx, cy in ((120, 160), (560, 230)):
        for dx, r in ((0, 34), (34, 44), (74, 30)):
            circle(ctx, cx + dx, cy, r, "#FFFFFF", 0.85)
    rect(ctx, 40, 120, 640, 820, "#D8C9A8")
    for fl in range(5):
        for i in range(5):
            wx, wy = 80 + i * 120, 170 + fl * 140
            if fl == 4 and i == 2:
                continue
            rect(ctx, wx, wy, 70, 90, "#F4F1EA")
            rect(ctx, wx + 6, wy + 6, 58, 78, "#8FB3CC")
            line(ctx, wx + 35, wy + 6, wx + 35, wy + 84, 4, "#F4F1EA")
    # first floor window highlighted
    if p.get("mark"):
        a = 0.5 + 0.5 * math.sin(t * 5)
        col(ctx, "#FFD21E", a)
        ctx.set_line_width(6)
        ctx.rectangle(434, 726, 82, 102)
        ctx.stroke()
    rect(ctx, 300, 770, 120, 170, "#5A3A25")
    rect(ctx, 290, 750, 140, 18, "#8C8C8C")
    rect(ctx, -300, 940, W + 600, 400, "#6E6E72")
    rect(ctx, -300, 940, W + 600, 12, "#8C8C8C")
    if p.get("ad"):
        rect(ctx, 320, 800, 80, 70, "#FFFFFF")
        for i in range(6):
            line(ctx, 330 + i * 12, 860, 330 + i * 12, 878, 6, "#FFFFFF")
        texts.add(ctx, 360, 822, "СДАЁТСЯ", 12, "#C0392B")


def section(ctx, texts, t, p):
    """Cross-section: apartment above, concrete / secret basement below."""
    rect(ctx, -300, -300, W + 600, 2000, "#A8D0E6")
    rect(ctx, -300, 560, W + 600, 1200, "#7B5A3E")
    random.seed(11)
    for _ in range(80):
        circle(ctx, random.random() * W, 600 + random.random() * 700, 3 + random.random() * 4, "#6A4C33")
    rect(ctx, 80, 230, 560, 330, "#E8DCC0")
    poly(ctx, [(60, 230), (360, 60), (660, 230)], "#A33A2E")
    rect(ctx, 100, 250, 520, 300, "#C9B48E")
    rect(ctx, 100, 530, 520, 30, "#8A5A3B")
    texts.add(ctx, 360, 285, "КВ. 1", 22, "#5A3A25", "RussoOne.ttf")
    reveal = p.get("reveal", 1.0)
    if reveal < 1:
        rect(ctx, 60, 560, 600, 120, "#8E8E8E")
        for i in range(10):
            line(ctx, 60 + i * 60, 560, 60 + i * 60, 680, 2, "#777777")
        texts.add(ctx, 360, 620, "БЕТОН", 30, "#5E5E5E", "RussoOne.ttf", alpha=1 - reveal)
    if reveal > 0:
        a = reveal
        col(ctx, "#1C2A22", a)
        ctx.rectangle(100, 700, 520, 420)
        ctx.fill()
        if p.get("endless"):
            for k in range(6):
                rect(ctx, 100 + k * 90, 760, 50, 90, "#2E4A38", a)
                texts.add(ctx, 125 + k * 90, 790, "1", 22, "#5CFF8A", "RussoOne.ttf", alpha=a)
        line(ctx, 360, 560, 360, 700, 12, "#555555", a)
        for i in range(6):
            line(ctx, 340, 575 + i * 22, 380, 575 + i * 22, 5, "#777777", a)
        glow(ctx, 360, 900, 260, "#5CFF8A", 0.12 * a)
    # figures
    for fig in p.get("figs", []):
        person(ctx, fig["x"], fig["y"], fig.get("s", 0.62), fig.get("look", 1), fig.get("st", HERO),
               fig.get("pose"), t)
    # knock waves
    kt = p.get("waves")
    if kt is not None:
        for k in range(3):
            tt = (t - kt - k * 0.35)
            if 0 < tt < 1.2:
                col(ctx, "#FFD21E", 1 - tt / 1.2)
                ctx.set_line_width(5)
                ctx.arc(360, 560, 30 + tt * 160, math.pi, 2 * math.pi)
                ctx.stroke()


def hatch_close(ctx, texts, t, p):
    floorboards(ctx, -200, -200, W + 400, 1700, "#8A5A3B")
    rev = p.get("carpet_off", 1.0)
    rect(ctx, 110, 380, 500, 500, "#2F2F33")
    rect(ctx, 125, 395, 470, 470, "#4E4E55")
    for i in range(4):
        line(ctx, 140, 470 + i * 110, 580, 470 + i * 110, 3, "#3D3D44")
    rrect(ctx, 300, 600, 120, 40, 12, "#2B2B2B")
    sc = p.get("scratch", 1.0)
    if sc > 0:
        msg = "НЕ ОТВЕЧАЙ"
        n = int(len(msg) * clamp(sc))
        texts.add(ctx, 360, 520, msg[:n], 50, "#E6E6E6", "RussoOne.ttf", rot=-4, alpha=0.9)
        for k in range(5):
            line(ctx, 190 + k * 16, 760, 200 + k * 16, 820, 4, "#C9C9C9", 0.7)
        line(ctx, 180, 790, 280, 785, 4, "#C9C9C9", 0.7)
    if rev < 1:
        # carpet being pulled away to the right
        off = ease(rev) * 900
        poly(ctx, [(60 + off, 300), (680 + off, 300), (680 + off, 960), (60 + off, 960)], "#9E2B2B")
        poly(ctx, [(90 + off, 330), (650 + off, 330), (650 + off, 930), (90 + off, 930)], "#B63A3A")
        circle(ctx, 60 + off, 630, 40, "#7E2020")


def wardrobe_in(ctx, texts, t, p):
    rect(ctx, -200, -200, W + 400, 1700, "#2A1A10")
    rect(ctx, 60, 120, 600, 1000, "#3A2416")
    line(ctx, 60, 260, 660, 260, 10, "#9A9A9A")
    cols = ["#3F6FA8", "#7D3C3C", "#4A4A4A", "#5D7A3A"]
    for i, c in enumerate(cols):
        x = 140 + i * 140 + math.sin(t * 2 + i) * 4
        line(ctx, x, 260, x, 290, 4, "#BBBBBB")
        poly(ctx, [(x - 55, 290), (x + 55, 290), (x + 65, 680), (x - 65, 680)], c)
    rect(ctx, 60, 1040, 600, 80, "#4A2E1A")
    if p.get("book", True):
        rrect(ctx, 270, 985, 190, 60, 6, "#1F3A5F")
        rect(ctx, 280, 1035, 170, 8, "#EEEEEE")
        texts.add(ctx, 365, 1012, "ТЕТРАДЬ", 20, "#DDE6F0", "RussoOne.ttf")
        glow(ctx, 365, 1010, 150, "#FFE7A0", 0.15 + 0.08 * math.sin(t * 4))


def notebook(ctx, texts, t, p):
    rect(ctx, -200, -200, W + 400, 1700, "#4A2E1A")
    ctx.save()
    ctx.translate(360, 640)
    ctx.rotate(-0.03)
    rrect(ctx, -300, -430, 600, 860, 10, "#F5F2E8")
    for i in range(24):
        line(ctx, -280, -360 + i * 34, 280, -360 + i * 34, 1.5, "#A9C6E8")
    line(ctx, -220, -430, -220, 430, 2, "#E88A8A")
    ctx.restore()
    for i, (txt, t0, dur) in enumerate(p["lines"]):
        if t < t0:
            continue
        n = int(len(txt) * clamp((t - t0) / max(dur, 0.1)))
        y = 330 + i * 130
        texts.add(ctx, 110, y, txt[:n], 50, "#1C2C66" if not p.get("red", {}).get(i) else "#A01818",
                  "Caveat-Bold.ttf", anchor="lm", rot=0)


def granny_scene(ctx, texts, t, p):
    rect(ctx, -200, -200, W + 400, 760, "#6F9C8A")
    rect(ctx, -200, 560, W + 400, 400, "#4F7A68")
    rect(ctx, -200, 940, W + 400, 600, "#7D7468")
    for i in range(12):
        line(ctx, -200 + i * 90, 940, -200 + i * 90, 1500, 2, "#6B6358")
    rect(ctx, 400, 360, 250, 580, "#3A2A20")
    rect(ctx, 415, 375, 220, 565, "#1C140F")
    glow(ctx, 520, 600, 260, "#FFE7A0", 0.25)
    texts.add(ctx, 525, 330, "КВ. 2", 22, "#2A3A33", "RussoOne.ttf")
    person(ctx, 500, 935, 1.0, -1, GRANNY, dict(talk=p.get("talk", False), eyes=p.get("geyes", "open"),
                                                 armF=(-30, -60), pupil=(1, 0)), t)
    person(ctx, 170, 935, 1.0, 1, HERO, dict(armF=(40, 30) if p.get("show") else (-8, 10),
                                              eyes="wide" if p.get("scared") else "open"), t)
    if p.get("show"):
        rrect(ctx, 225, 640, 60, 80, 4, "#1F3A5F")


def phone_scene(ctx, texts, t, p):
    rect(ctx, -200, -200, W + 400, 1700, "#141B30")
    glow(ctx, 360, 640, 560, "#3D6BFF", 0.18)
    ring = p.get("ring", False)
    dx = math.sin(t * 50) * (5 if ring else 0)
    ctx.save()
    ctx.translate(dx, 0)
    rrect(ctx, 200, 260, 320, 640, 40, "#111111")
    rrect(ctx, 216, 290, 288, 580, 26, "#1E2A48")
    circle(ctx, 360, 470, 64, "#4A5878")
    circle(ctx, 360, 448, 22, "#AEB8CC")
    col(ctx, "#AEB8CC")
    ctx.arc(360, 510, 36, math.pi, 2 * math.pi)
    ctx.fill()
    texts.add(ctx, 360, 580, p.get("name", "Я"), 44, "#FFFFFF", "Rubik-ExtraBold.ttf")
    texts.add(ctx, 360, 630, "+7 912 307-03-07", 22, "#C9D3EA", "Rubik-Medium.ttf")
    texts.add(ctx, 360, 670, "это ваш номер", 20, "#FF7A6A", "Rubik-Medium.ttf")
    if ring:
        circle(ctx, 290, 790, 34, "#E53935")
        circle(ctx, 430, 790, 34 + 4 * math.sin(t * 10), "#2EB85C")
    else:
        texts.add(ctx, 360, 760, "00:%02d" % int(t), 30, "#FFFFFF", "Rubik-Medium.ttf")
        circle(ctx, 360, 820, 34, "#E53935")
    ctx.restore()
    if ring:
        for k in range(3):
            tt = (t * 1.5 + k / 3) % 1
            col(ctx, "#FFFFFF", 1 - tt)
            ctx.set_line_width(4)
            ctx.arc(360, 580, 200 + tt * 140, math.pi * 1.2, math.pi * 1.8)
            ctx.stroke()


def stairs_down(ctx, texts, t, p):
    rect(ctx, -300, -300, W + 600, 2000, "#0B0F0C")
    prog = t * p.get("speed", 1.0)
    step_h, step_w = 70, 110
    off = (prog * 120) % step_h
    offx = (prog * 120 / step_h * step_w) % step_w
    for i in range(-3, 16):
        x = -220 + i * step_w - offx
        y = 200 + i * step_h - off
        rect(ctx, x, y, step_w, 900, "#2E3A33")
        rect(ctx, x, y, step_w, 10, "#46564C")
    # walls lines
    # hero walking down
    pose = walk_pose(t, 0.8, 18)
    hy = 640 + 70 * 0.5
    person(ctx, 330, hy + 40, 0.95, 1, HERO, dict(pose, eyes="wide", armF=(80, 70)), t)
    # flashlight cone
    ctx.save()
    g = cairo.RadialGradient(470, 420, 10, 640, 900, 520)
    g.add_color_stop_rgba(0, 1, 0.95, 0.75, 0.55)
    g.add_color_stop_rgba(1, 1, 0.95, 0.75, 0)
    ctx.set_source(g)
    ctx.move_to(440, 450)
    ctx.line_to(900, 980)
    ctx.line_to(900, 1400)
    ctx.line_to(480, 1400)
    ctx.close_path()
    ctx.fill()
    ctx.restore()
    if p.get("count"):
        texts.add(ctx, 600, 210, "СТУПЕНЬ %d" % (14 + int(prog * 9)), 26, "#FFD21E", "RussoOne.ttf")


def corridor(ctx, texts, t, p):
    rect(ctx, -300, -300, W + 600, 2000, "#070A08")
    vx, vy = 360, 560
    depth = p.get("depth", 0.0) + t * p.get("move", 0.0)
    # planes
    for k in range(14, -1, -1):
        z = k - (depth % 1.0)
        if z <= 0.15:
            continue
        sc = 1.0 / (0.35 + z * 0.35)
        hw, hh = 360 * sc, 560 * sc
        shade = clamp(1.2 - z * 0.09, 0, 1)
        c1 = tuple(v * shade for v in hexc("#2E4A38"))
        c2 = tuple(v * shade for v in hexc("#22362A"))
        # left & right wall segments
        z2 = z + 1
        sc2 = 1.0 / (0.35 + z2 * 0.35)
        hw2, hh2 = 360 * sc2, 560 * sc2
        poly(ctx, [(vx - hw, vy - hh), (vx - hw2, vy - hh2), (vx - hw2, vy + hh2), (vx - hw, vy + hh)], c1)
        poly(ctx, [(vx + hw, vy - hh), (vx + hw2, vy - hh2), (vx + hw2, vy + hh2), (vx + hw, vy + hh)], c1)
        poly(ctx, [(vx - hw, vy + hh), (vx - hw2, vy + hh2), (vx + hw2, vy + hh2), (vx + hw, vy + hh)], c2)
        poly(ctx, [(vx - hw, vy - hh), (vx - hw2, vy - hh2), (vx + hw2, vy - hh2), (vx + hw, vy - hh)],
             tuple(v * 0.6 for v in c2))
        idx = int(math.floor(depth)) + k
        # doors on alternating sides
        if idx % 2 == 0:
            side = -1 if (idx // 2) % 2 == 0 else 1
            dxa = vx + side * (hw * 0.92)
            dxb = vx + side * (hw2 * 0.92 + (hw - hw2) * 0.15)
            dta = vy - hh * 0.05
            poly(ctx, [(dxa, dta), (dxb, vy - hh2 * 0.05), (dxb, vy + hh2 * 0.97), (dxa, vy + hh * 0.97)],
                 tuple(v * shade for v in hexc("#8A6440")))
            texts.add(ctx, (dxa + dxb) / 2, vy + hh * 0.18, "1", 46 * sc / 1.3, "#FFF2C0", "RussoOne.ttf",
                      alpha=shade)
            ajar = p.get("ajar")
            if ajar is not None and idx == ajar:
                glow(ctx, (dxa + dxb) / 2, vy + hh * 0.4, 200 * sc / 1.5, "#FFE7A0", 0.6 * shade)
        else:
            # tally scratches
            if p.get("tally"):
                for side in (-1, 1):
                    bx = vx + side * hw * 0.96
                    for m in range(5):
                        line(ctx, bx - side * m * 6 * sc / 2, vy - hh * 0.3, bx - side * m * 6 * sc / 2,
                             vy - hh * 0.1, 3 * sc / 1.5, "#D8F0DE", shade)
    glow(ctx, vx, vy, 120, "#5CFF8A", 0.1)
    for fig in p.get("figs", []):
        person(ctx, fig["x"], fig["y"], fig.get("s", 1.0), fig.get("look", 1), fig.get("st", HERO),
               fig.get("pose"), t)
    if p.get("flash", True):
        g = cairo.RadialGradient(vx, vy + 150, 20, vx, vy + 150, 520)
        g.add_color_stop_rgba(0, 1, 0.95, 0.75, 0.22)
        g.add_color_stop_rgba(1, 1, 0.95, 0.75, 0)
        ctx.set_source(g)
        ctx.paint()


def below(ctx, texts, t, p):
    """Under the floor: hero below, ceiling = floorboards of the apartment."""
    rect(ctx, -300, -300, W + 600, 2000, "#16221B")
    floorboards(ctx, -200, -200, W + 400, 360, "#5E3F2A")
    rect(ctx, -200, 160, W + 400, 14, "#2A1C12")
    for i in range(8):
        line(ctx, -100 + i * 120, 174, -100 + i * 120, 1400, 3, "#1E2E25")
    rect(ctx, -300, 1080, W + 600, 400, "#0F1712")
    glow(ctx, 360, 600, 500, "#5CFF8A", 0.07)
    fist = p.get("fist", 1.0)
    knock_t = p.get("knock_at")
    hit = 0
    if knock_t is not None:
        for k in range(p.get("knocks", 3)):
            tt = t - knock_t - k * p.get("gap", 0.5)
            if -0.12 < tt < 0.05:
                hit = 1
    reach = lerp(-60, 175, ease(fist)) - hit * 14
    st = p.get("st", HERO)
    person(ctx, 330, 1080, 1.05, 1, st, dict(armF=(reach, reach), eyes=p.get("eyes", "angry"), pupil=(0.6, -1)),
           t)
    if p.get("vitya"):
        person(ctx, 120, 1080, 0.95, 1, VITYA, dict(eyes="wide", armF=(30, 40), mouth="o"), t)
    if knock_t is not None:
        for k in range(p.get("knocks", 3)):
            tt = t - knock_t - k * p.get("gap", 0.5)
            if 0 < tt < 1.0:
                col(ctx, "#FFD21E", 1 - tt)
                ctx.set_line_width(5)
                ctx.arc(410, 174, 30 + tt * 220, 0, math.pi)
                ctx.stroke()
    if p.get("rhythm"):
        texts.add(ctx, 360, 260, p["rhythm"], 48, "#FFD21E", "RussoOne.ttf", stroke=4)


def vitya_close(ctx, texts, t, p):
    corridor(ctx, texts, 0, dict(depth=2.3, tally=True, flash=False))
    rect(ctx, -300, -300, W + 600, 2000, "#000000", 0.35)
    person(ctx, 300, 1500, 2.1, 1, VITYA, dict(talk=p.get("talk", True), eyes=p.get("eyes", "wide"),
                                                armF=(p.get("arm", 20), p.get("arm2", 30))), t)


def landlord_close(ctx, texts, t, p):
    building(ctx, texts, 0, {})
    rect(ctx, -300, -300, W + 600, 2000, "#000000", 0.15)
    person(ctx, 300, 1530, 2.2, 1, LANDLORD, dict(talk=p.get("talk", True), eyes=p.get("eyes", "half"),
                                                   armF=(50, 70)), t)
    if p.get("keys"):
        kx, ky = 560 + math.sin(t * 4) * 10, 960
        line(ctx, kx, ky - 60, kx, ky, 3, "#AAAAAA")
        circle(ctx, kx, ky + 12, 20, "#D4AF37")
        circle(ctx, kx, ky + 12, 10, "#00000000", 0)
        rect(ctx, kx - 4, ky + 28, 8, 46, "#D4AF37")


def endcard(ctx, texts, t, p):
    rect(ctx, -300, -300, W + 600, 2000, "#0B0B0D")
    glow(ctx, 360, 600, 500, "#C0392B", 0.25)
    texts.add(ctx, 360, 470, "СТУК В 3:07", 70, "#FFFFFF", "RussoOne.ttf", stroke=5)
    texts.add(ctx, 360, 640, p.get("big", "СЕРИЯ 2"), 80 + 4 * math.sin(t * 4), "#FFD21E", "RussoOne.ttf",
              stroke=6)
    texts.add(ctx, 360, 760, p.get("small", "ПРОДОЛЖЕНИЕ СЛЕДУЕТ"), 34, "#FFFFFF", "Rubik-ExtraBold.ttf")


SCENES = dict(room=room, building=building, section=section, hatch_close=hatch_close, wardrobe_in=wardrobe_in,
              notebook=notebook, granny=granny_scene, phone=phone_scene, stairs=stairs_down, corridor=corridor,
              below=below, vitya=vitya_close, landlord=landlord_close, endcard=endcard)


def fist_floor(ctx, texts, t, p):
    floorboards(ctx, -200, -200, W + 400, 1700, "#8A5A3B")
    rect(ctx, -200, 980, W + 400, 600, "#2F2F33")
    rect(ctx, -200, 1000, W + 400, 600, "#4E4E55")
    hits = p.get("hits", [])
    lift = 1.0
    for h in hits:
        d = t - h
        if -0.18 < d < 0.0:
            lift = min(lift, -d / 0.18)
        elif 0.0 <= d < 0.08:
            lift = 0.0
    fx, fy = 430, 760 - lift * 260
    line(ctx, -60, -200, fx - 30, fy - 60, 120, "#2E7D4F")
    line(ctx, -40, -200, fx - 52, fy - 40, 10, "#FFFFFF")
    circle(ctx, fx, fy, 70, SKIN)
    for k in range(4):
        circle(ctx, fx - 40 + k * 26, fy + 52, 18, darken(SKIN, 0.92))
    for h in hits:
        d = t - h
        if 0 < d < 0.9:
            col(ctx, "#FFD21E", 1 - d / 0.9)
            ctx.set_line_width(7)
            ctx.save()
            ctx.translate(fx, 840)
            ctx.scale(1, 0.4)
            ctx.arc(0, 0, 60 + d * 380, 0, 2 * math.pi)
            ctx.restore()
            ctx.stroke()

SCENES["fist_floor"] = fist_floor
