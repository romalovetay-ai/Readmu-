"""TikTok branding for «ЧЁ ПО БАБКАМ»: avatar 1080x1080, series covers 1080x1920 for the shorts, profile mockup.
Narrator v2 look (CLAUDE.md), hands never cover the face."""
import os, sys, math, cairo, cv2, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(1, os.path.join(HERE, "..", "invest"))
import art, cine, character
from art import *

OUT = os.path.join(HERE, "out")


def shadow(c, mask, w, h, dx=-30, dy=8, sigma=24, alpha=0.5):
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h); q = cairo.Context(s)
    q.set_source_rgba(0, 0, 0, 1); q.mask_surface(mask, dx, dy)
    cine.blur_layer(s, sigma, 0.25)
    c.set_source_surface(s); c.paint_with_alpha(alpha)


def burst(c, w, h, cx, cy, inner, mid, outer, rays=26, ray_a=0.07):
    g = cairo.RadialGradient(cx, cy, 30, cx, cy, max(w, h) * 1.05)
    g.add_color_stop_rgb(0, *inner); g.add_color_stop_rgb(0.40, *mid); g.add_color_stop_rgb(1, *outer)
    c.rectangle(0, 0, w, h); c.set_source(g); c.fill()
    for i in range(rays):
        a0 = 2 * math.pi * i / rays; a1 = a0 + math.pi / rays
        c.move_to(cx, cy)
        c.line_to(cx + 4000 * math.cos(a0), cy + 4000 * math.sin(a0))
        c.line_to(cx + 4000 * math.cos(a1), cy + 4000 * math.sin(a1))
        c.close_path(); c.set_source_rgba(1, 0.88, 0.65, ray_a); c.fill()


def narrator(w, h, x, base, scale, pose, emo, look=0.0, mouth=None):
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, h); q = cairo.Context(s)
    st = character.perform_v2(1.2, 0.0, [], 0.0, pose, emo)
    st.update(emo2=None, look=look)
    if mouth:
        st.update(vis=mouth, vamt=1.0)
    character.draw(q, x, base, scale, st)
    return s


def ruble_badge(c, x, y, r):
    shape(c, lambda q: ell_path(q, x, y, r, r), "green", 1, shade=0.18, lw=10)
    title(c, "₽", x, y + r * 0.40, r * 1.15, "white")


# ---------------------------------------------------------------- avatar
def avatar(path):
    S = 1080
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, S, S); c = cairo.Context(s)
    burst(c, S, S, S / 2, S * 0.42, (0.98, 0.45, 0.30), (0.62, 0.10, 0.28), (0.12, 0.04, 0.20), 22, 0.08)
    # a few coins flying behind the head
    for x, y, r, f in ((150, 300, 62, 0.9), (930, 250, 54, -0.6), (120, 760, 46, 0.4), (960, 620, 40, 0.8)):
        coin(c, x, y, r, flip=f)
    m = narrator(S, S, S / 2 - 18 * 1.25, 1430, 1.25, "idle", "smirk", look=0.0)
    shadow(c, m, S, S, -24, 10, 26, 0.5)
    c.set_source_surface(m); c.paint()
    ruble_badge(c, 830, 830, 110)
    # gold ring hugging TikTok's circular crop
    c.arc(S / 2, S / 2, S / 2 - 22, 0, 2 * math.pi); c.set_line_width(36)
    c.set_source_rgb(*C("gold")); c.stroke()
    c.arc(S / 2, S / 2, S / 2 - 42, 0, 2 * math.pi); c.set_line_width(6)
    c.set_source_rgba(*INK, 1); c.stroke()
    img = cine.post(cine.to_np(s), 0.0, bloom=0.12, grain=0.0)
    cv2.imwrite(path, img, [cv2.IMWRITE_PNG_COMPRESSION, 6])
    cv2.imwrite(path.replace(".png", "_200.png"), cv2.resize(img, (200, 200), interpolation=cv2.INTER_AREA))


# ---------------------------------------------------------------- covers
SERIES = {
    "budget": dict(name="ДЫРЫ В БЮДЖЕТЕ", inner=(0.98, 0.45, 0.30), mid=(0.62, 0.10, 0.28), outer=(0.12, 0.04, 0.20), tagc="red"),
    "invest": dict(name="ИНВЕСТИЦИИ", inner=(0.45, 0.85, 0.60), mid=(0.24, 0.20, 0.55), outer=(0.07, 0.05, 0.18), tagc="purple"),
}
COVERS = [  # file, series, top line, big line, big colour, sub line, pose, emo
    ("cover_1_zero", "budget", "ЗАРПЛАТА 80К", "0 ₽", "red", "к 20-му числу", "shrug", "wow"),
    ("cover_2_coffee", "budget", "КОФЕ С СОБОЙ", "70 000 ₽", "gold", "в год. серьёзно", "point", "doubt"),
    ("cover_3_subs", "budget", "ПОДПИСКИ", "30 000 ₽", "gold", "в год на ерунду", "explain", "angry"),
    ("cover_4_inflation", "invest", "ТВОИ 100 000 ₽", "ХУДЕЮТ", "red", "инфляция не спит", "explain", "doubt"),
    ("cover_5_shawarma", "invest", "СОВЛАДЕЛЕЦ", "ШАУРМЫ", "gold", "как это работает", "point", "smirk"),
    ("cover_6_22mln", "invest", "10 000 ₽ В МЕСЯЦ", "22 МЛН", "green", "без магии и инфоцыган", "shrug", "happy"),
]


def cover(path, ser, top, big, bigc, sub, pose, emo, num):
    Wc, Hc = 1080, 1920
    S_ = SERIES[ser]
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, Wc, Hc); c = cairo.Context(s)
    burst(c, Wc, Hc, Wc / 2, 820, S_["inner"], S_["mid"], S_["outer"], 30, 0.07)
    # series tag + episode number (inside the 3:4 grid crop, y 240..1680)
    tag(c, S_["name"], Wc / 2, 310, 46, S_["tagc"], rot=-0.03)
    title(c, top, Wc / 2, 480, fit(c, top, 110, 960), "white")
    title(c, big, Wc / 2, 705, fit(c, big, 230, 1000), bigc)
    plain(c, sub, Wc / 2, 800, 54, F_XB, "white")
    m = narrator(Wc, Hc, Wc / 2 - 18 * 0.9, 1800, 0.9, pose, emo, look=0.0)
    shadow(c, m, Wc, Hc, -26, 10, 28, 0.5)
    c.set_source_surface(m); c.paint()
    # channel bug at the bottom of the grid crop
    tag(c, "ЧЁ ПО БАБКАМ", Wc / 2, 1640, 44, "gold")
    shape(c, lambda q: ell_path(q, 960, 310, 62, 62), "gold", 1, shade=0.15, lw=6)
    title(c, str(num), 960, 338, 80, "white")
    img = cine.post(cine.to_np(s), 0.0, bloom=0.14, grain=0.0)
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 92])
    return img


def profile_mock(path, av, covers):
    """Rough phone mockup of the profile: avatar circle + 3x2 grid of 3:4 crops."""
    Wm, Hm = 1080, 1500
    img = np.full((Hm, Wm, 3), (18, 10, 14), np.uint8)
    a = cv2.resize(cv2.imread(av), (260, 260))
    mask = np.zeros((260, 260), np.uint8); cv2.circle(mask, (130, 130), 130, 255, -1)
    roi = img[40:300, 410:670]; roi[mask > 0] = a[mask > 0]
    cw, ch = 356, 474
    for i, cv in enumerate(covers):
        crop = cv[240:1680]
        crop = cv2.resize(crop, (cw, ch), interpolation=cv2.INTER_AREA)
        x = 4 + (i % 3) * (cw + 2); y = 520 + (i // 3) * (ch + 2)
        img[y:y + ch, x:x + cw] = crop
    cv2.imwrite(path, img, [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == "__main__":
    os.makedirs(os.path.join(OUT, "covers"), exist_ok=True)
    av = os.path.join(OUT, "avatar.png")
    avatar(av)
    imgs = [cover(os.path.join(OUT, "covers", f + ".jpg"), *rest, i + 1) for i, (f, *rest) in enumerate(COVERS)]
    profile_mock(os.path.join(OUT, "profile_preview.jpg"), av, imgs)
    print("ok")
