#!/usr/bin/env python3
"""Upgrade demo: the «shawarma» part of the invest video (chapter 2) rebuilt as one continuous illustrated location,
with Vasya as a character, squash-and-stretch animation, kinetic words synced to the voice, the upgraded narrator
(lip-sync, brow accents, overlapping arm motion) and a full SFX pass.
  TTS=f5 VOICE_MODEL=podcaster python3 demo.py   -> out/demo_upgrade.mp4
"""
import math, os, random, re, subprocess, sys, wave
import multiprocessing as mp
import numpy as np
import cairo

import build
import art
import cine
import character
import scenes2d
import world as Wd
from art import W, H, INK, shape, ground, coin, tag, title, pop_title, plain, fit, rrect_path, ell_path, poly_path, ease, ease_io, \
    ease_back, clamp, C, person, F_BLACK, F_XB

FPS = 60
FIRST, LAST = 13, 18          # beats (chapter card + 5 story beats)
OUT = build.OUT

KEYWORDS = {
    14: [("вася", "ВАСЯ", "gold"), ("шаурмичную", "ШАУРМИЧНАЯ", "white"), ("прёт", "ДЕЛО ПРЁТ!", "green"), ("бабла", "БАБЛА НЕ ХВАТАЕТ", "red")],
    15: [("сто", "100 КУСОЧКОВ", "white"), ("один", "1 — ТВОЙ", "gold"), ("совладелец", "ТЫ СОВЛАДЕЛЕЦ!", "gold")],
    16: [("акция", "АКЦИЯ", "gold"), ("кусочек", "КУСОЧЕК КОМПАНИИ", "white"), ("сбер", "СБЕР · ЛУКОЙЛ · ЯНДЕКС", "gold")],
    17: [("двумя", "2 СПОСОБА", "white"), ("дорожает", "РОСТ ЦЕНЫ ↑", "green"), ("дивиденды", "ДИВИДЕНДЫ", "gold")],
    18: [("падать", "АКЦИИ ПАДАЮТ", "red"), ("санэпидемстанция", "ЗАКРЫТО", "red"), ("нахер", "НИКОМУ НЕ НУЖЕН", "red")],
}
KX = 1500        # kiosk world x


def norm(w):
    return re.sub(r"[^а-яё0-9]", "", w.lower())


def word_time(b, key):
    for w0, w1, w in b["words"]:
        if norm(w).startswith(key):
            return w0
    return None


# ------------------------------------------------------------------ continuous camera
def cam_keys(B):
    s = {i: B[i]["start"] for i in range(FIRST, LAST + 1)}
    a = lambda i, k: s[i] + B[i]["anchors"].get(k, B[i]["dur"] * 0.5)
    return [
        (s[14], (900, 120, 0.80)), (s[14] + 1.6, (KX, 560, 1.0)), (a(14, 2), (KX + 40, 560, 1.0)), (a(14, 2) + 0.7, (KX, 470, 1.12)),
        (s[15] + 0.3, (KX, 560, 1.12)), (a(15, 1) + 0.3, (KX - 260, 560, 1.0)), (a(15, 2) + 0.6, (KX - 300, 540, 0.98)),
        (s[16] + 0.2, (KX + 200, 560, 1.0)), (a(16, 2) - 0.1, (KX + 200, 560, 1.0)), (a(16, 2) + 1.4, (KX + 900, 380, 0.62)),
        (s[17] + 0.4, (KX - 250, 560, 0.92)), (a(17, 2) + 0.3, (KX - 420, 560, 0.86)), (s[17] + B[17]["dur"], (KX - 440, 560, 0.86)),
        (s[18] + 0.2, (KX, 600, 1.08)), (s[18] + B[18]["dur"], (KX + 60, 600, 1.14)),
    ]


def camera(keys, t):
    if t <= keys[0][0]:
        return keys[0][1]
    for (t0, c0), (t1, c1) in zip(keys, keys[1:]):
        if t0 <= t <= t1:
            u = ease_io((t - t0) / max(1e-3, t1 - t0))
            return tuple(a + (b - a) * u for a, b in zip(c0, c1))
    return keys[-1][1]


class View:
    """world -> screen with parallax depth p (1 = street plane)."""
    def __init__(self, cam, ox=760, oy=560):
        self.cx, self.cy, self.z = cam
        self.ox, self.oy = ox, oy

    def apply(self, c, p=1.0):
        z = 1 + (self.z - 1) * p
        c.translate(self.ox, self.oy)
        c.scale(z, z)
        c.translate(-self.cx * p - (1 - p) * KX, -self.cy * (0.5 + 0.5 * p) - (1 - (0.5 + 0.5 * p)) * 560)

    def pt(self, x, y):
        return (x - self.cx) * self.z + self.ox, (y - self.cy) * self.z + self.oy


# ------------------------------------------------------------------ story frame
def story(c, B, i, tl, T, keys, level):
    b = B[i]
    an = lambda k: b["anchors"].get(k, b["dur"] * 0.5)
    v = View(camera(keys, T))
    storm = clamp(tl / 0.6) if i == 18 else 0.0
    Wd.sky(c, storm * 0.92, T)
    Wd.clouds(c, T, storm, v.cx)
    for p, fn in ((0.35, lambda q: Wd.far_city(q, storm)), (0.7, lambda q: Wd.mid_houses(q, T, storm, 1))):
        c.save()
        v.apply(c, p)
        fn(c)
        c.restore()
    c.save()
    v.apply(c, 1.0)
    Wd.street(c, storm)
    Wd.tree(c, 700, T)
    Wd.tree(c, 2350, T, 1.1)
    for lx in (380, 1050, 2050, 2900):
        Wd.lamp(c, lx, T, 1.0)
    # --- towers rise behind in beat 16
    if i >= 16:
        k16 = clamp((T - (B[16]["start"] + B[16]["anchors"].get(2, 2.7))) / 1.2)
        if i > 16:
            k16 = 1.0 - clamp((T - B[17]["start"]) / 0.6)
        for j, (x, w, h, nm, col) in enumerate(((2150, 300, 700, "СБЕР", (0.30, 0.72, 0.48)),
                                                 (2550, 320, 820, "ЛУКОЙЛ", (0.88, 0.36, 0.38)),
                                                 (2980, 300, 640, "ЯНДЕКС", (0.98, 0.72, 0.30)))):
            kj = ease_back(clamp((k16 * 1.6 - j * 0.25)))
            if kj > 0.04:
                Wd.tower(c, x, w, h * kj, nm, col)
    # --- kiosk + Vasya
    closed_tape = (tl - an(1)) if i == 18 else -1
    slices = 0.0
    missing = None
    if i == 15:
        slices = clamp((tl - 0.2) / 1.2)
        if tl > an(1):
            missing = (0, 6)
    if i in (16, 17, 18):
        missing = (0, 6)
    grow = 1.0
    if i == 17:
        grow = 1.0 + 0.18 * ease_back(clamp((tl - an(1)) / 0.6))
    light = 1.0 if i != 18 else (1.0 if tl < an(1) else (0.0 if int(T * 10) % 4 else 0.6) * (1 - clamp((tl - an(1)) / 0.8)))
    # Vasya behind the counter (drawn before the kiosk front counter overlap: inside the window)
    mood = "happy"
    wave = 0.0
    if i == 14:
        wave = clamp((tl - 0.9) / 0.2) * (1 - clamp((tl - 2.6) / 0.3))
        mood = "worried" if tl > an(2) else "happy"
    if i == 15:
        mood = "proud" if tl > an(2) else "happy"
    if i == 17:
        wave = clamp((tl - an(2)) / 0.2)
    if i == 18:
        mood = "sad" if tl > an(1) else "worried"
    pop = ease_back(clamp((T - B[14]["start"] - 0.7) / 0.45))
    sxv, syv = Wd.squash(T - B[14]["start"] - 1.15, 0.4, 0.15)
    s = 1.12 * grow
    gx = Wd.kiosk(c, KX, 1.12, T, closed=0.0, light=light, slices=0, missing=None, grow=grow)
    c.save()
    gx0, gy0, gw, gh = gx
    rrect_path(c, KX - 520 * s * 0.40, Wd.STREET_Y - 380 * s * 0.82, 520 * s * 0.80, 380 * s * 0.46 + 2, 12 * s)
    c.clip()
    c.translate(KX, Wd.STREET_Y - 380 * s * 0.36 + 10)
    c.scale(sxv, syv)
    Wd.vasya(c, 0, 300 * (1 - pop) + 20, 0.60 * s, T, mood, wave, 1.0, look=-0.4)
    c.restore()
    # redraw counter and grid on top of Vasya
    shape(c, lambda q: rrect_path(q, KX - 520 * s * 0.53, Wd.STREET_Y - 380 * s * 0.36, 520 * s * 1.06, 38 * s, 8 * s), (0.58, 0.38, 0.26), 1, shade=0.3)
    if slices > 0 or missing:
        c.set_line_width(4)
        c.set_source_rgba(1, 1, 1, 0.85)
        kk = ease_io(slices) if i == 15 else 0.0
        for j in range(1, 10):
            xx = gx0 + gw * j / 10
            c.move_to(xx, gy0)
            c.line_to(xx, gy0 + gh * kk)
            yy = gy0 + gh * j / 10
            c.move_to(gx0, yy)
            c.line_to(gx0 + gw * kk, yy)
        c.stroke()
        if missing:
            mi, mj = missing
            rrect_path(c, gx0 + gw * mi / 10, gy0 + gh * mj / 10, gw / 10, gh / 10, 4)
            c.set_source_rgba(0.1, 0.05, 0.12, 0.85)
            c.fill()
    if i == 18 and closed_tape > 0:
        c.save()
        c.translate(KX, Wd.STREET_Y - 380 * s * 0.55)
        c.rotate(-0.16)
        k = ease_back(clamp(closed_tape / 0.35))
        L = 520 * s * 1.3 * k
        shape(c, lambda q: q.rectangle(-L / 2, -38, L, 76), (1.0, 0.86, 0.15), 1, shade=0.15, lw=4)
        if closed_tape > 0.25:
            plain(c, "ЗАКРЫТО · САНЭПИДЕМСТАНЦИЯ", 0, 18, fit(c, "ЗАКРЫТО · САНЭПИДЕМСТАНЦИЯ", 44, L * 0.9), F_BLACK, INK, 1)
        c.restore()
    # --- customers queue + coins into the jar (beat 14 after {1})
    if i == 14:
        a1 = tl - an(1)
        for j in range(4):
            px = 700 - j * 130 + 260 * ease_io(clamp((a1 - j * 0.15) / 0.8)) if a1 > 0 else -400
            if a1 > 0:
                person(c, px + 240, Wd.STREET_Y + 10, 0.85, ["teal", "purple", "amber", "green"][j], "happy")
        if a1 > 0:
            for j in range(5):
                ca = a1 - 0.3 - j * 0.28
                if 0 < ca < 0.6:
                    u = ca / 0.6
                    coin(c, 1000 + 300 * u, Wd.STREET_Y - 420 - 260 * math.sin(math.pi * u), 34, flip=math.cos(T * 9 + j))
            jar_sx, jar_sy = Wd.squash(a1 - 1.3, 0.35, 0.12)
            c.save()
            c.translate(1330, Wd.STREET_Y - 420)
            c.scale(jar_sx, jar_sy)
            shape(c, lambda q: rrect_path(q, -60, -110, 120, 110, 26), (0.75, 0.88, 1.0), 0.55, shade=0.0, light=0.1)
            for j in range(min(6, max(0, int((a1 - 0.6) / 0.28)))):
                ell_path(c, -30 + (j % 3) * 30, -18 - (j // 3) * 22, 22, 10)
                c.set_source_rgb(*C("gold"))
                c.fill()
            c.restore()
        if tl > an(2):
            # thought bubble: second kiosk with "?" and an empty wallet
            ka = ease_back(clamp((tl - an(2)) / 0.45))
            bx, by = KX + 420, Wd.STREET_Y - 700
            for r_, (dx, dy) in zip((14, 22), ((-150, 170), (-110, 120))):
                shape(c, lambda q, dx=dx, dy=dy, r_=r_: ell_path(q, bx + dx, by + dy, r_ * ka, r_ * ka), "white", 1, shade=0.1, lw=4)
            c.save()
            c.translate(bx, by)
            c.scale(ka, ka)
            shape(c, lambda q: (q.new_sub_path(), q.arc(-90, 0, 90, 0, 2 * math.pi), q.new_sub_path(), q.arc(10, -40, 110, 0, 2 * math.pi),
                                q.new_sub_path(), q.arc(110, 0, 90, 0, 2 * math.pi), q.new_sub_path(), q.arc(10, 40, 100, 0, 2 * math.pi)),
                  "white", 1, shade=0.08, light=0.0)
            shape(c, lambda q: rrect_path(q, -120, -60, 120, 100, 14), (0.85, 0.82, 0.9), 1, shade=0.15, lw=4)
            title(c, "?", -60, 30, 90, "red")
            shape(c, lambda q: rrect_path(q, 30, -40, 130, 90, 14), "brown", 1, shade=0.2, lw=4)
            # moth flying out of the empty wallet
            mt = (tl - an(2)) * 2
            mx, my = 100 + 40 * math.sin(mt * 3), -60 - 30 * mt
            for sgn in (-1, 1):
                shape(c, lambda q, sgn=sgn: ell_path(q, mx + sgn * 14, my, 14, 9 + 5 * abs(math.sin(mt * 12))), (0.85, 0.82, 0.75), 1, shade=0.1, lw=3)
            c.restore()
    # --- the share tile: pops out in 15, flips into "АКЦИЯ" in 16, grows in 17, cracks in 18
    tile_home = (gx0 + gw * 0.5 / 10, gy0 + gh * 6.5 / 10)
    tile_spot = (KX - 480, Wd.STREET_Y - 110)
    price = None
    if i == 15 and tl > an(1):
        u = clamp((tl - an(1)) / 0.7)
        e = ease_io(u)
        x = tile_home[0] + (tile_spot[0] - tile_home[0]) * e
        y = tile_home[1] + (tile_spot[1] - tile_home[1]) * e - 260 * math.sin(math.pi * e)
        sxx, syy = Wd.squash(tl - an(1) - 0.7, 0.45, 0.3)
        Wd.share_tile(c, x, y, 120, T, "gold", rot=u * 2 * math.pi * (1 - e) * 0.5, sx=sxx, sy=syy)
        if tl > an(2):
            Wd.confetti(c, x, y - 60, tl - an(2), 50, 3)
            # stamp slam
            sa = tl - an(2)
            k = ease_back(clamp(sa / 0.25))
            c.save()
            c.translate(tile_spot[0] + 60, tile_spot[1] - 240)
            c.rotate(-0.15)
            c.scale(2.2 - 1.2 * k, 2.2 - 1.2 * k)
            rrect_path(c, -250, -55, 500, 110, 16)
            c.set_source_rgba(1, 0.3, 0.32, clamp(sa / 0.15))
            c.set_line_width(10)
            c.stroke()
            plain(c, "СОВЛАДЕЛЕЦ", 0, 22, fit(c, "СОВЛАДЕЛЕЦ", 64, 440), F_BLACK, (1, 0.3, 0.32), clamp(sa / 0.15))
            c.restore()
    elif i >= 16:
        x, y = tile_spot
        size = 120
        flip = 1.0
        if i == 16:
            flip = math.cos(math.pi * ease_io(clamp(tl / 0.5)))
        label = "АКЦИЯ" if (i > 16 or flip < 0) else None
        col = "gold"
        crack = 0.0
        rot = 0.0
        if i == 17:
            size = 120 + 50 * ease_back(clamp((tl - an(1)) / 0.6))
            price = 1000 + 500 * ease_io(clamp((tl - an(1)) / 1.2))
        if i == 18:
            size = 170
            price = 1500 * (1 - ease_io(clamp((tl - an(2)) / 0.9)))
            if tl > an(2):
                col = (0.55, 0.52, 0.58)
                crack = clamp((tl - an(2)) / 0.4)
                fall = clamp((tl - an(2) - 0.6) / 0.6)
                y = y + 140 * fall ** 2
                rot = 0.5 * fall
        Wd.share_tile(c, x, y, size, T, col, rot=rot, sx=abs(flip), sy=1.0, label=label, crack=crack)
        if price is not None:
            tag(c, f"{int(round(price / 10) * 10):,} ₽".replace(",", " "), x, y - size * 0.5 - 50, 40, "green" if i == 17 else "red")
        if i == 18 and tl > an(2) + 1.0:
            sa = tl - an(2) - 1.0
            for j in range(8):
                a = j / 8 * math.pi
                d = 60 + 160 * sa
                c.arc(x + math.cos(a) * d, y + 60 - math.sin(a) * d * 0.6 + 400 * sa * sa, 8 * (1 - clamp(sa)), 0, 2 * math.pi)
                c.set_source_rgba(0.6, 0.75, 1.0, 0.8 * (1 - clamp(sa)))
                c.fill()
    # --- dividends: coins arc from Vasya to a piggy bank
    if i == 17:
        pg_x = KX - 820
        hits = []
        for j in range(5):
            ca = tl - an(2) - 0.15 - j * 0.32
            if ca > 0.55:
                hits.append(ca - 0.55)
            if 0 < ca < 0.55:
                u = ca / 0.55
                coin(c, KX - 120 + (pg_x - KX + 120) * u, Wd.STREET_Y - 420 - 300 * math.sin(math.pi * u) + 200 * u, 36, flip=math.cos(T * 10 + j))
        if tl > an(2) - 0.3:
            Wd.piggy(c, pg_x, Wd.STREET_Y + 20, 1.0 * ease_back(clamp((tl - an(2) + 0.3) / 0.4)), min(hits) if hits else -1)
    c.restore()   # end world space
    Wd.rain(c, T, storm)
    if i == 18 and int(T * 6) % 17 == 0 and tl > 0.3:
        c.set_source_rgba(1, 1, 1, 0.25)
        c.paint()
    return v


def kinetic(c, b, tl):
    """Key words pop exactly when they are spoken; the previous one floats up and fades."""
    items = [(word_time(b, k), s, col) for k, s, col in KEYWORDS.get(b["idx"], [])]
    items = [it for it in items if it[0] is not None]
    for j, (t0, s, col) in enumerate(items):
        a = tl - t0
        if a < 0:
            continue
        nxt = items[j + 1][0] if j + 1 < len(items) else 99
        out = tl - nxt
        y = 165 - 160 * ease_io(clamp(out / 0.22))
        alpha_out = 1 - clamp(out / 0.18)
        if alpha_out <= 0:
            continue
        c.save()
        c.translate(650, y)
        sx, sy = Wd.squash(a - 0.3, 0.35, 0.12)
        c.scale(sx, sy)
        c.push_group()
        pop_title(c, s, 0, 0, fit(c, s, 104, 1100), a, col)
        c.pop_group_to_source()
        c.paint_with_alpha(alpha_out)
        c.restore()


# ------------------------------------------------------------------ render
G = {}


def init(B, env, keys):
    G["B"], G["env"], G["keys"] = B, env, keys
    k = int(FPS * 0.35)
    G["body"] = np.convolve(env, np.ones(k) / k, "same") if env is not None else []


def frame(fi):
    B, keys = G["B"], G["keys"]
    T = B[FIRST]["start"] + fi / FPS
    i = max(k for k in range(FIRST, LAST + 1) if B[k]["start"] <= T + 1e-6)
    b = B[i]
    tl = T - b["start"]
    afi = int(T * FPS)
    level = float(G["env"][afi]) if afi < len(G["env"]) else 0.0
    if i == FIRST:
        img = scenes2d.render(b, tl, T, level, B)
        # last 0.25 s: iris closes to black, story opens with a crane-down
        k = clamp((tl - b["dur"] + 0.25) / 0.25)
        if k > 0:
            img = (img * (1 - k)).astype(np.uint8)
        return img
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(surf)
    story(c, B, i, tl, T, keys, level)
    # narrator (upgraded acting) on the right
    if b.get("style") == "shout":
        art.shout_fx(c, tl, T, level, 1610, H + 6 - 680 * 0.56, b["words"], layer="back")
    cs = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cc = cairo.Context(cs)
    st = character.perform_v2(T, level, b["words"], tl, b.get("pose", "explain"), b.get("emo", "neutral"), seed=b["idx"],
                              body_level=float(G["body"][afi]) if afi < len(G["body"]) else level)
    if b.get("style") == "shout":
        st["emo"] = st["emo2"] = "angry"
    st["look"] = -0.7
    enter = i == FIRST + 1
    k = ease(tl / 0.5) if enter else 1.0
    character.draw(cc, 1610, H + 6 + (1 - k) * 200, 0.56, st)
    cine.drop_shadow(c, cs, -36, 6, 22, 0.45)
    c.set_source_surface(cs)
    c.paint()
    kinetic(c, b, tl)
    if b.get("style") == "shout":
        art.shout_fx(c, tl, T, level, 1610, H + 6 - 680 * 0.56, b["words"], layer="front")
    # opening of the story: fade up from black
    if i == FIRST + 1 and tl < 0.3:
        c.set_source_rgba(0, 0, 0, 1 - tl / 0.3)
        c.paint()
    return cine.post(cine.to_np(surf), T, bloom=0.16, grain=0.0)


def seg(args):
    a, z, path = args
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", f"{W}x{H}", "-r", str(FPS),
                          "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "16", "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    for fi in range(a, z):
        p.stdin.write(frame(fi).tobytes())
    p.stdin.close()
    p.wait()
    return path


# ------------------------------------------------------------------ sound design
SR = build.SR


def tone(freqs, dur, decay, amp=0.3, noise=0.0, seed=0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    out = sum(np.sin(2 * np.pi * f * t + rng.random()) for f in freqs) / len(freqs)
    if noise:
        out = out * (1 - noise) + noise * np.convolve(rng.standard_normal(n), np.ones(6) / 6, "same")
    return (amp * out * np.exp(-t * decay)).astype(np.float32)


def sfx_lib():
    rng = np.random.default_rng(4)
    L = {}
    L["clink"] = [tone([2600 + 300 * k, 4100 + 200 * k, 6200], 0.35, 14, 0.22, seed=k) for k in range(4)]
    L["pop"] = tone([500], 0.18, 22, 0.35)
    n = int(SR * 0.18)
    t = np.arange(n) / SR
    L["pop"] = (0.35 * np.sin(2 * np.pi * (380 + 900 * np.exp(-t * 28)) * t) * np.exp(-t * 20)).astype(np.float32)
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    wn = np.convolve(rng.standard_normal(n), np.ones(18) / 18, "same")
    L["whoosh"] = (0.5 * wn * np.sin(np.pi * t / t[-1]) ** 2).astype(np.float32)
    n = int(SR * 0.5)
    t = np.arange(n) / SR
    L["thud"] = (0.6 * np.sin(2 * np.pi * (70 + 80 * np.exp(-t * 18)) * t) * np.exp(-t * 9)
                 + 0.15 * np.convolve(rng.standard_normal(n), np.ones(40) / 40, "same") * np.exp(-t * 25)).astype(np.float32)
    n = int(SR * 0.9)
    t = np.arange(n) / SR
    L["sparkle"] = sum(tone([3000 + 700 * k], 0.9, 6 + k, 0.08, seed=k) * (np.arange(n) > k * 0.07 * SR) for k in range(6)).astype(np.float32)
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    L["crack"] = (0.45 * rng.standard_normal(n) * np.exp(-t * 18)).astype(np.float32)
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    L["splash"] = (0.35 * np.convolve(rng.standard_normal(n), np.ones(8) / 8, "same") * np.exp(-t * 7)).astype(np.float32)
    n = int(SR * 3.0)
    t = np.arange(n) / SR
    L["thunder"] = (0.7 * np.convolve(rng.standard_normal(n), np.ones(300) / 300, "same") * 6 * np.exp(-t * 1.2)
                    * (0.6 + 0.4 * np.sin(t * 9))).astype(np.float32)
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    L["tick"] = (0.18 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60)).astype(np.float32)
    L["ding"] = tone([1320, 1980], 0.8, 6, 0.22)
    L["rise"] = (0.25 * np.sin(2 * np.pi * np.cumsum(np.linspace(80, 400, int(SR * 1.2))) / SR)
                 * np.linspace(0, 1, int(SR * 1.2)) ** 2).astype(np.float32)
    return L


def sfx_events(B):
    ev = []
    an = lambda i, k: B[i]["start"] + B[i]["anchors"].get(k, B[i]["dur"] * 0.5)
    s = lambda i: B[i]["start"]
    ev += [(s(14), "whoosh", 0.8), (s(14) + 1.15, "pop", 1.0)]
    for j in range(5):
        ev.append((an(14, 1) + 0.3 + j * 0.28 + 0.6, "clink", 0.9))
    ev.append((an(14, 2), "pop", 0.9))
    for j in range(10):
        ev.append((s(15) + 0.2 + j * 0.12, "tick", 0.7))
    ev += [(an(15, 1), "whoosh", 0.6), (an(15, 1) + 0.7, "thud", 0.6), (an(15, 2), "thud", 1.0), (an(15, 2), "sparkle", 1.0)]
    ev += [(s(16), "whoosh", 0.5), (an(16, 2), "rise", 0.9), (an(16, 2) + 0.8, "thud", 0.6)]
    ev += [(an(17, 1), "pop", 0.9), (an(17, 1) + 0.4, "ding", 0.7)]
    for j in range(5):
        ev.append((an(17, 2) + 0.15 + j * 0.32 + 0.55, "clink", 1.0))
    ev += [(s(18), "thunder", 0.9), (an(18, 1), "thud", 1.0), (an(18, 2), "crack", 0.9), (an(18, 2) + 1.2, "splash", 0.9)]
    return ev


def audio(B, vt, path):
    t0 = B[FIRST]["start"]
    t1 = B[LAST]["start"] + B[LAST]["dur"]
    n = int((t1 - t0) * SR)
    voice = vt[int(t0 * SR):int(t0 * SR) + n]
    voice = np.pad(voice, (0, max(0, n - len(voice))))
    import music as _m
    mus = _m.lofi(t1 + 1, SR)[int(t0 * SR):int(t0 * SR) + n] * 0.8
    mus = np.pad(mus, (0, max(0, n - len(mus))))
    hop = 1024
    lvl = np.array([np.abs(voice[i:i + hop]).mean() for i in range(0, n, hop)])
    duck = np.convolve(np.repeat(np.where(lvl > 0.01, 0.42, 1.0), hop)[:n], np.ones(SR // 4) / (SR // 4), "same")
    mix = voice + mus * 0.5 * duck
    L = sfx_lib()
    # rain bed under the storm beat
    rs, re_ = int((B[18]["start"] - t0) * SR), n
    rng = np.random.default_rng(9)
    mix[rs:re_] += (0.05 * np.convolve(rng.standard_normal(re_ - rs), np.ones(4) / 4, "same")
                    * np.clip(np.arange(re_ - rs) / (0.6 * SR), 0, 1)).astype(np.float32)
    for k, (at, kind, amp) in enumerate(sfx_events(B)):
        s_ = L[kind][k % len(L[kind])] if isinstance(L[kind], list) else L[kind]
        p = int((at - t0) * SR)
        if 0 <= p < n:
            e = min(n, p + len(s_))
            mix[p:e] += s_[:e - p] * amp
    mix = np.clip(mix / (np.max(np.abs(mix)) + 1e-9) * 0.89, -1, 1)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())
    return t1 - t0


def main():
    B, total, vt = build.build_timeline()
    n_frames_all = int(total * FPS)
    hop = SR // FPS
    env = build.mouth_env(vt, n_frames_all) if build.FPS == FPS else None
    keys = cam_keys(B)
    wav = os.path.join(OUT, "demo_mix.wav")
    dur = audio(B, vt, wav)
    if "--still" in sys.argv:
        init(B, env, keys)
        import cv2
        for tt in [float(x) for x in sys.argv[sys.argv.index("--still") + 1].split(",")]:
            cv2.imwrite(os.path.join(OUT, f"demo_{tt:05.1f}.jpg"), cv2.resize(frame(int(tt * FPS)), (960, 540)))
        return
    nf = int(dur * FPS)
    chunk = nf // 8 + 1
    segs = [(a, min(nf, a + chunk), os.path.join(OUT, f"dseg_{a:05d}.mp4")) for a in range(0, nf, chunk)]
    with mp.Pool(4, initializer=init, initargs=(B, env, keys)) as pool:
        for k, p in enumerate(pool.imap(seg, segs)):
            print("seg", k + 1, len(segs), flush=True)
    lst = os.path.join(OUT, "dsegs.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for *_, p in segs))
    out = os.path.join(OUT, "demo_upgrade.mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst, "-i", wav, "-map", "0:v", "-map", "1:a",
                    "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-af", "loudnorm=I=-14:TP=-1.5", "-shortest", "-movflags", "+faststart", out],
                   check=True)
    for *_, p in segs:
        os.remove(p)
    print("done", out)


if __name__ == "__main__":
    main()
