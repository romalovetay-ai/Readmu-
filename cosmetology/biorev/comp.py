"""Edit the biorevitalisation reel from the Cycles plates: voice, labelled cards, captions, grade, music.

    python3 comp.py            -> ../Рилс_5_Биоревитализация.mp4
    python3 comp.py --frames 30,200   -> /tmp/bio_XXXX.png stills for review
"""
import os, sys, math, json, subprocess, argparse, time
import multiprocessing as mp
import numpy as np
import cv2
import cairo

HERE = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(HERE, "..", "src")
sys.path.insert(0, SRC)
import build as B          # tts, sfx, music helpers from the first four reels
import views
import skin

W, H, FPS, SR = 1080, 1920, 30, 44100
PLATES = os.path.join(HERE, "cache", "plates")
ANIM = os.path.join(HERE, "cache", "anim")
OUT = os.path.join(HERE, "..", "Рилс_5_Биоревитализация.mp4")
VOICE = ("ru-RU-SvetlanaNeural", "+12%", "-2Hz")
GEL = (0.45, 0.75, 1.0)
INK = (0.20, 0.12, 0.09)
CARD = (0.97, 0.93, 0.87)

LINES = [
    ("surface", "Кожа тусклая, *обезвоженная*, появились морщинки? Ей не хватает *воды*."),
    ("syringe", "Я — *биоревитализант*: гель *гиалуроновой кислоты* для введения в кожу."),
    ("layers", "Вот кожа в разрезе: *эпидермис*, а под ним — *дерма* с коллагеном и сосудами."),
    ("aging", "С возрастом *влаги* здесь всё меньше, а волокна коллагена — *тоньше*."),
    ("inject", "Меня вводят тонкой иглой в *дерму* — маленькими папулами."),
    ("dermis", "Я притягиваю *воду* и пробуждаю *фибробласты*: они вырабатывают свой *коллаген*."),
    ("result", "Кожа становится *увлажнённой*, плотной и сияющей. Курс — *три–четыре* процедуры."),
    ("end", "Доверяй это только *врачу-косметологу*. Сохрани себе!"),
]

# label anchors in plate pixel coordinates (1080x1920 plates), set after looking at the renders
LAYER_LABELS = [
    ("РОГОВОЙ СЛОЙ", "защитный барьер", (330, 520), (60, 330)),
    ("ЭПИДЕРМИС", "клетки и пигмент меланин", (560, 640), (520, 430)),
    ("ДЕРМА", "коллаген, эластин, сосуды", (420, 1050), (60, 870)),
    ("ГИПОДЕРМА", "жировая клетчатка", (300, 1560), (520, 1330)),
]
AGING_LABELS = [
    ("МАЛО ВЛАГИ", "кожа теряет упругость", (420, 980), (60, 760)),
    ("ТОНКИЕ ВОЛОКНА", "коллаген разрушается", (700, 1150), (540, 1000)),
    ("ПИГМЕНТ", "неровный тон", (640, 640), (560, 470)),
]


# ------------------------------------------------------------------ helpers
def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 3


def load_plate(name):
    p = os.path.join(PLATES, name + ".png")
    a = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    a = a[..., :3][..., ::-1].astype(np.float32) / (65535 if a.dtype == np.uint16 else 255)
    if a.shape[:2] != (H, W):
        a = cv2.resize(a, (W, H), interpolation=cv2.INTER_LANCZOS4)
    return a


def move(img, zoom, cx, cy):
    """Slow camera: scale `img` by zoom around plate point (cx, cy) kept at the same screen place."""
    M = np.float32([[zoom, 0, cx - zoom * cx], [0, zoom, cy - zoom * cy]])
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)


def to_screen(p, zoom, cx, cy):
    return (cx + (p[0] - cx) * zoom, cy + (p[1] - cy) * zoom)


def surface():
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    return s, cairo.Context(s)


def over(img, s):
    a = np.ndarray((H, W, 4), np.uint8, s.get_data()).astype(np.float32) / 255
    return img * (1 - a[..., 3:4]) + a[..., [2, 1, 0]]


def rr(cr, x, y, w, h, r):
    cr.new_path()
    cr.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    cr.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    cr.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    cr.arc(x + r, y + r, r, math.pi, 3 * math.pi / 2)
    cr.close_path()


def font(cr, size, fam="Inter", bold=True):
    cr.select_font_face(fam, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD if bold else cairo.FONT_WEIGHT_NORMAL)
    cr.set_font_size(size)


def card(cr, x, y, title, sub, prog, target=None):
    """Beige label card in the style of the reference, with a hand-drawn leader line to `target`."""
    if prog <= 0:
        return
    a = ease(prog / 0.25)
    font(cr, 36)
    tw = cr.text_extents(title).x_advance
    font(cr, 25, bold=False)
    sw = cr.text_extents(sub).x_advance
    w = max(tw, sw) + 64
    h = 104
    k = 0.9 + 0.1 * ease_out(prog / 0.3)
    cr.save()
    cr.translate(x + w / 2, y + h / 2)
    cr.scale(k, k)
    cr.translate(-w / 2, -h / 2)
    rr(cr, 4, 8, w, h, 14)
    cr.set_source_rgba(0, 0, 0, 0.28 * a)
    cr.fill()
    rr(cr, 0, 0, w, h, 14)
    cr.set_source_rgba(*CARD, 0.94 * a)
    cr.fill_preserve()
    cr.set_line_width(2)
    cr.set_source_rgba(0.75, 0.62, 0.50, 0.9 * a)
    cr.stroke()
    rr(cr, 14, 16, 6, h - 32, 3)
    cr.set_source_rgba(0.45, 0.28, 0.18, a)
    cr.fill()
    font(cr, 36)
    cr.move_to(34, 46)
    cr.set_source_rgba(*INK, a)
    cr.show_text(title)
    font(cr, 25, bold=False)
    cr.move_to(34, 82)
    cr.set_source_rgba(0.42, 0.33, 0.28, a)
    cr.show_text(sub)
    cr.restore()
    if target is not None:
        la = ease((prog - 0.15) / 0.3)
        if la > 0:
            sx = x + w / 2 if abs(target[0] - (x + w / 2)) < w / 2 else (x + w if target[0] > x + w else x)
            sy = y + h if target[1] > y + h else y
            ex = sx + (target[0] - sx) * la
            ey = sy + (target[1] - sy) * la
            cr.move_to(sx, sy)
            cr.curve_to(sx, sy + (ey - sy) * 0.5, ex - (ex - sx) * 0.3, ey, ex, ey)
            cr.set_line_width(3)
            cr.set_source_rgba(1, 1, 1, 0.9 * a)
            cr.stroke()
            if la >= 1:
                ang = math.atan2(ey - (sy + (ey - sy) * 0.5), ex - (ex - (ex - sx) * 0.3))
                for da in (2.6, -2.6):
                    cr.move_to(ex, ey)
                    cr.line_to(ex + 22 * math.cos(ang + da), ey + 22 * math.sin(ang + da))
                cr.set_line_width(3)
                cr.set_source_rgba(1, 1, 1, 0.95)
                cr.stroke()


def header(cr, title, sub, a, idx=0, total=0):
    if a <= 0:
        return
    hb = 250
    g = cairo.LinearGradient(0, 0, 0, hb)
    g.add_color_stop_rgba(0, 0.95, 0.90, 0.83, 0.97 * a)
    g.add_color_stop_rgba(1, 0.92, 0.86, 0.78, 0.97 * a)
    cr.set_source(g)
    cr.rectangle(0, 0, W, hb)
    cr.fill()
    cr.rectangle(0, hb, W, 3)
    cr.set_source_rgba(0.72, 0.58, 0.45, 0.8 * a)
    cr.fill()
    font(cr, 25, "Inter")
    t = "БИОРЕВИТАЛИЗАЦИЯ"
    sp = 7
    widths = [cr.text_extents(ch).x_advance + sp for ch in t]
    x = W / 2 - (sum(widths) - sp) / 2
    cr.set_source_rgba(0.55, 0.42, 0.32, a)
    for ch, w_ in zip(t, widths):
        cr.move_to(x, 112)
        cr.show_text(ch)
        x += w_
    font(cr, 56, "DejaVu Serif")
    e = cr.text_extents(title.upper())
    cr.move_to(W / 2 - e.x_advance / 2, 180)
    cr.set_source_rgba(0.30, 0.18, 0.12, a)
    cr.show_text(title.upper())
    font(cr, 27, "Inter", bold=False)
    e = cr.text_extents(sub)
    cr.move_to(W / 2 - e.x_advance / 2, 224)
    cr.set_source_rgba(0.42, 0.32, 0.26, a)
    cr.show_text(sub)
    # footer
    fy = 1828
    cr.rectangle(0, fy, W, H - fy)
    cr.set_source_rgba(0.95, 0.90, 0.83, 0.95 * a)
    cr.fill()
    cr.rectangle(60, fy + 26, W - 120, 1.5)
    cr.set_source_rgba(0.72, 0.58, 0.45, 0.8 * a)
    cr.fill()
    font(cr, 22, "Inter", bold=False)
    cr.move_to(60, fy + 66)
    cr.set_source_rgba(0.42, 0.32, 0.26, a)
    cr.show_text("АНАТОМИЧЕСКИЙ РАЗРЕЗ КОЖИ")
    if total:
        font(cr, 22, "Inter")
        t = "%02d / %02d" % (idx, total)
        e = cr.text_extents(t)
        cr.move_to(W - 60 - e.x_advance, fy + 66)
        cr.set_source_rgba(0.30, 0.18, 0.12, a)
        cr.show_text(t)


def captions(cr, sc, gt):
    chs = sc["chunks"]
    for ci, ch in enumerate(chs):
        s, e = ch[0][2] - 0.05, ch[-1][3] + 0.15
        if ci + 1 < len(chs):
            e = min(e, chs[ci + 1][0][2] - 0.05)
        if not (s <= gt < e):
            continue
        age = gt - s
        a = ease(age / 0.12)
        font(cr, 66, "Inter Display Black")
        words = [w for (w, hl, a_, b_) in ch]
        sp = cr.text_extents(" ").x_advance
        widths = [cr.text_extents(w).x_advance for w in words]
        total = sum(widths) + sp * (len(words) - 1)
        x = W / 2 - total / 2
        y = 1600 + 10 * (1 - ease_out(age / 0.2))
        for (w, hl, ws, we), ww in zip(ch, widths):
            active = ws - 0.03 <= gt < we + 0.05
            col = GEL if hl else (1, 1, 1)
            if active and not hl:
                col = (1.0, 0.95, 0.85)
            cr.move_to(x + 2, y + 4)
            cr.text_path(w)
            cr.set_source_rgba(0, 0, 0, 0.45 * a)
            cr.fill()
            cr.move_to(x, y)
            cr.text_path(w)
            cr.set_line_width(7)
            cr.set_line_join(cairo.LINE_JOIN_ROUND)
            cr.set_source_rgba(0.08, 0.05, 0.04, 0.75 * a)
            cr.stroke_preserve()
            cr.set_source_rgba(*col, a)
            cr.fill()
            x += ww + sp


def glow_dot(cr, x, y, r, col, a):
    g = cairo.RadialGradient(x, y, 0, x, y, r * 3)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.9 * a)
    g.add_color_stop_rgba(0.25, *col, 0.6 * a)
    g.add_color_stop_rgba(1, *col, 0)
    cr.set_source(g)
    cr.arc(x, y, r * 3, 0, 2 * math.pi)
    cr.fill()


# ------------------------------------------------------------------ grade
_vig = None


def grade(img, fi):
    global _vig
    if _vig is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W * 0.7)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
        _vig = (1 - np.clip(d - 0.45, 0, 1) ** 1.5 * 0.95)[..., None].astype(np.float32)
    x = np.clip(img, 0, 1)
    # filmic S-curve, warm highlights / cool shadows
    x = x * x * (3 - 2 * x) * 0.35 + x * 0.65
    lum = x.mean(-1, keepdims=True)
    x = lum + (x - lum) * 1.12
    x = x + (lum - 0.5) * np.array([0.035, 0.0, -0.035], np.float32)
    x = x * _vig
    hi = np.clip(x - 0.78, 0, 1)
    small = cv2.resize(hi, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    x = x + cv2.resize(cv2.GaussianBlur(small, (0, 0), 5), (W, H)) * 0.8
    rng = np.random.default_rng(fi)
    g = cv2.resize(rng.standard_normal((H // 2, W // 2)).astype(np.float32), (W, H))
    x = x + g[..., None] * 0.022
    return np.clip(x, 0, 1)


# ------------------------------------------------------------------ plan / audio
def plan():
    scenes, t = [], 0.4
    voices = []
    for i, (kind, line) in enumerate(LINES):
        audio, words = B.tts(line, *VOICE)
        dur = len(audio) / SR
        toks = B.time_tokens(B.caption_tokens(line), words, dur)
        lead = 0.4 if i == 0 else 0.0
        extra = {"inject": 0.6, "dermis": 0.4, "end": 1.5, "result": 0.4}.get(kind, 0.0)
        sd = dur + 0.25 + extra
        scenes.append(dict(i=i, kind=kind, start=t - lead, dur=sd + lead, vstart=t, vdur=dur,
                           chunks=[[(w, hl, s + t, e + t) for (w, hl, s, e) in c] for c in B.chunk_tokens(toks)]))
        voices.append((t, audio))
        t += sd
    return scenes, voices, t


def cinematic_music(n):
    """Slow, warm ambient bed: sustained pads with a soft pulse, 72 bpm."""
    t = np.arange(n) / SR
    out = np.zeros(n)
    prog = [(45, 57, 60, 64, 71), (41, 53, 57, 60, 67), (43, 55, 59, 62, 69), (40, 52, 55, 59, 67)]
    bar = 60 / 72 * 4
    for bi in range(int(n / SR / bar) + 2):
        s0 = int(bi * bar * SR)
        if s0 >= n:
            break
        ln = min(int(bar * 1.4 * SR), n - s0)
        seg = np.arange(ln) / SR
        env = np.minimum(seg / 1.2, 1) * np.exp(-np.maximum(seg - bar, 0) * 3)
        for m in prog[bi % 4]:
            f = 440 * 2 ** ((m - 69) / 12)
            v = np.sin(2 * np.pi * f * seg) + 0.4 * np.sin(2 * np.pi * f * 1.004 * seg) + 0.2 * np.sin(2 * np.pi * f * 2 * seg)
            out[s0:s0 + ln] += v * env * (0.06 if m < 50 else 0.035)
        for k in range(8):
            st = s0 + int(k * bar / 8 * SR)
            if st >= n:
                break
            l2 = min(int(0.6 * SR), n - st)
            tt = np.arange(l2) / SR
            m = prog[bi % 4][1 + (k * 3) % 4] + 12
            f = 440 * 2 ** ((m - 69) / 12)
            out[st:st + l2] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 6) * 0.025
    out = B.lp(out, 5000)
    # long reverb-ish smear
    ir = np.exp(-np.arange(int(1.5 * SR)) / SR * 3) * np.random.default_rng(2).standard_normal(int(1.5 * SR)) * 0.02
    from scipy.signal import fftconvolve
    out = out + fftconvolve(out, ir)[:n]
    return out


def build_audio(scenes, voices, total, path):
    n = int((total + 0.2) * SR)
    v = np.zeros(n)
    for st, a in voices:
        i = int(st * SR)
        v[i:i + len(a)] += a[:n - i]
    fx = np.zeros(n)

    def add(name, at, g=1.0):
        s = B.sfx(name) * g
        i = int(at * SR)
        if 0 <= i < n:
            fx[i:i + len(s)] += s[:n - i]
    sc = {s["kind"]: s for s in scenes}
    for k in ("syringe", "layers", "inject", "dermis", "result", "end"):
        add("whoosh", sc[k]["start"] - 0.25, 0.6)
    add("plink", sc["inject"]["start"] + 0.7, 0.7)
    add("zoom", sc["dermis"]["start"] - 0.6, 0.5)
    add("shimmer", sc["dermis"]["start"] + sc["dermis"]["dur"] * 0.35, 0.8)
    add("shimmer", sc["result"]["start"] + 0.3, 0.8)
    for s in scenes:
        if s["kind"] in ("layers", "aging"):
            for k in range(4 if s["kind"] == "layers" else 3):
                add("pop", s["start"] + 0.5 + k * s["dur"] * 0.2, 0.5)
    m = cinematic_music(n)
    env = B.lp(np.convolve(np.abs(v), np.ones(2000) / 2000, mode="same"), 8)
    duck = 1 - 0.5 * np.clip(env / (env.max() * 0.25 + 1e-6), 0, 1)
    fade = np.minimum(1, np.minimum(np.arange(n) / (1.0 * SR), (n - np.arange(n)) / (1.5 * SR)))
    mix_ = v + fx * 0.7 + m * 0.9 * duck * fade
    mix_ = mix_ / (np.abs(mix_).max() + 1e-6) * 0.92
    raw = path + ".f32"
    mix_.astype(np.float32).tofile(raw)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "2", path], check=True)
    os.remove(raw)


# ------------------------------------------------------------------ frames
G = {}


def init():
    for nm in ("syringe", "section_bad", "section_good", "dermis_bad", "dermis_good", "surface_bad", "surface_good"):
        G[nm] = load_plate(nm)
    frames = sorted(f for f in os.listdir(ANIM) if f.endswith(".png"))
    G["anim"] = [os.path.join(ANIM, f) for f in frames]
    G["anim_cache"] = {}
    # where the bolus sits in the dermis plate (bright blue blob centroid)
    d = G["dermis_good"]
    blue = (d[..., 2] - d[..., 0]) > 0.15
    ys, xs = np.nonzero(blue)
    G["bolus_d"] = (float(xs.mean()), float(ys.mean())) if len(xs) else (540, 760)
    d = G["section_good"]
    blue = (d[..., 2] - d[..., 0]) > 0.12
    ys, xs = np.nonzero(blue)
    G["bolus_s"] = (float(xs.mean()), float(ys.mean())) if len(xs) else (330, 700)


def anim_frame(u):
    """Injection animation at fractional position u in [0, 1], blending neighbouring frames."""
    fr = G["anim"]
    x = u * (len(fr) - 1)
    i = int(min(len(fr) - 2, max(0, math.floor(x))))
    t = x - i

    def get(k):
        c = G["anim_cache"]
        if k not in c:
            if len(c) > 6:
                c.clear()
            a = cv2.imread(fr[k], cv2.IMREAD_UNCHANGED)
            a = a[..., :3][..., ::-1].astype(np.float32) / (65535 if a.dtype == np.uint16 else 255)
            c[k] = cv2.resize(a, (W, H), interpolation=cv2.INTER_LANCZOS4)
        return c[k]
    return get(i) * (1 - t) + get(i + 1) * t


def radial_mask(c, radius, soft=220.0):
    yy, xx = np.mgrid[0:H:2, 0:W:2].astype(np.float32)
    n = views.noise_tex()
    nz = cv2.resize(n[:240, :135], (W // 2, H // 2))
    d = np.sqrt((xx - c[0]) ** 2 + ((yy - c[1]) * 0.9) ** 2)
    m = np.clip((radius - d + nz * 120) / soft, 0, 1)
    m = cv2.resize(m * m * (3 - 2 * m), (W, H))
    return m[..., None]


def render_frame(args):
    fi, scenes, total = args
    gt = fi / FPS
    sc = scenes[-1]
    for s_ in scenes:
        if s_["start"] <= gt < s_["start"] + s_["dur"]:
            sc = s_
            break
    kind, lt, sd = sc["kind"], gt - sc["start"], sc["dur"]
    u = lt / sd
    s, cr = surface()
    hdr = None
    if kind in ("surface", "end"):
        state = "surface_bad" if kind == "surface" else "surface_good"
        img = move(G[state], 1.0 + 0.12 * ease(u), 540, 1250)
        # raking light sweep
        sweep = np.exp(-((np.arange(W)[None, :, None] - (-200 + 1500 * u)) / 260.0) ** 2) * 0.10
        img = img + sweep * np.array([1.0, 0.9, 0.8], np.float32)
        if kind == "surface":
            a = ease((lt - 0.3) / 0.6)
            font(cr, 30, "Inter")
            t = "Б И О Р Е В И Т А Л И З А Ц И Я"
            e = cr.text_extents(t)
            cr.move_to(W / 2 - e.x_advance / 2, 300)
            cr.set_source_rgba(0.95, 0.86, 0.74, a)
            cr.show_text(t)
            font(cr, 76, "DejaVu Serif")
            for k, ln in enumerate(("Кожа просит", "воды")):
                ak = ease((lt - 0.6 - k * 0.25) / 0.5)
                e = cr.text_extents(ln)
                cr.move_to(W / 2 - e.x_advance / 2, 410 + k * 92 + 12 * (1 - ak))
                cr.set_source_rgba(1, 1, 1, ak)
                cr.show_text(ln)
        else:
            img = cv2.GaussianBlur(img, (0, 0), 6) * 0.8
            a = ease(lt / 0.5)
            cw, chh = 900, 720
            x0, y0 = (W - cw) / 2, 330
            rr(cr, x0 + 6, y0 + 12, cw, chh, 30)
            cr.set_source_rgba(0, 0, 0, 0.3 * a)
            cr.fill()
            rr(cr, x0, y0, cw, chh, 30)
            cr.set_source_rgba(*CARD, 0.95 * a)
            cr.fill()
            font(cr, 26, "Inter")
            cr.move_to(x0 + 56, y0 + 80)
            cr.set_source_rgba(0.6, 0.45, 0.35, a)
            cr.show_text("БИОРЕВИТАЛИЗАЦИЯ · ПАМЯТКА")
            font(cr, 54, "DejaVu Serif")
            cr.move_to(x0 + 56, y0 + 160)
            cr.set_source_rgba(*INK, a)
            cr.show_text("Как проходит курс")
            items = [("3–4 процедуры", "с интервалом 2–3 недели"), ("Внутрикожно", "микропапулами, ~1 мм"),
                     ("Эффект", "увлажнение, тонус, сияние"), ("Только у врача", "есть противопоказания")]
            for k, (t1, t2) in enumerate(items):
                ak = ease((lt - 0.5 - k * 0.35) / 0.3)
                yy = y0 + 250 + k * 108
                cr.arc(x0 + 80, yy - 12, 22, 0, 2 * math.pi)
                cr.set_source_rgba(*GEL, ak)
                cr.fill()
                cr.move_to(x0 + 69, yy - 12)
                cr.line_to(x0 + 78, yy - 2)
                cr.line_to(x0 + 93, yy - 23)
                cr.set_line_width(5)
                cr.set_source_rgba(1, 1, 1, ak)
                cr.stroke()
                font(cr, 38, "Inter")
                cr.move_to(x0 + 124, yy - 4)
                cr.set_source_rgba(*INK, ak)
                cr.show_text(t1)
                font(cr, 28, "Inter", bold=False)
                cr.move_to(x0 + 124, yy + 34)
                cr.set_source_rgba(0.42, 0.33, 0.28, ak)
                cr.show_text(t2)
            ca = ease((lt - 2.2) / 0.4)
            if ca > 0:
                font(cr, 42, "Inter Display Black")
                t = "СОХРАНИ СЕБЕ"
                tw = cr.text_extents(t).x_advance + 150
                pul = 1 + 0.03 * math.sin(lt * 6)
                cr.save()
                cr.translate(W / 2, y0 + chh + 110)
                cr.scale(pul, pul)
                rr(cr, -tw / 2, -46, tw, 92, 46)
                cr.set_source_rgba(0.30, 0.62, 0.95, ca)
                cr.fill()
                cr.move_to(-tw / 2 + 50, -20)
                cr.line_to(-tw / 2 + 80, -20)
                cr.line_to(-tw / 2 + 80, 22)
                cr.line_to(-tw / 2 + 65, 10)
                cr.line_to(-tw / 2 + 50, 22)
                cr.close_path()
                cr.set_source_rgba(1, 1, 1, ca)
                cr.fill()
                cr.move_to(-tw / 2 + 102, 15)
                cr.show_text(t)
                cr.restore()
    elif kind == "syringe":
        z = 1.0 + 0.10 * ease(u)
        img = move(G["syringe"], z, 560, 900)
        if "bokeh" not in G:
            bk = np.zeros((H, W, 3), np.float32)
            rng = np.random.default_rng(11)
            for _ in range(38):
                x, y, r = rng.uniform(0, W), rng.uniform(0, H), rng.uniform(40, 150)
                col = (0.9, 0.55, 0.35) if rng.random() < 0.6 else (0.35, 0.6, 0.95)
                cv2.circle(bk, (int(x), int(y)), int(r), tuple(c * rng.uniform(0.05, 0.16) for c in col), -1, cv2.LINE_AA)
            bk = cv2.GaussianBlur(bk, (0, 0), 6)
            g = np.linspace(0, 1, H, dtype=np.float32)[:, None, None]
            G["bokeh"] = bk + np.array([0.09, 0.05, 0.035], np.float32) * (1 - g) * 0.8
        lum = img.mean(-1, keepdims=True)
        bg = np.clip(1 - lum / 0.06, 0, 1)
        shift = np.float32([[1, 0, -40 * u], [0, 1, 0]])
        img = img + cv2.warpAffine(G["bokeh"], shift, (W, H), borderMode=cv2.BORDER_REFLECT) * bg
        # light sweep along the glass
        xs = np.arange(W)[None, :, None].astype(np.float32)
        ys = np.arange(H)[:, None, None].astype(np.float32)
        band = np.exp(-(((xs + ys * 0.55) - (300 + 1700 * u)) / 120.0) ** 2) * 0.10
        img = img + band * np.array([0.8, 0.9, 1.0], np.float32)
        card(cr, 60, 1160, "БИОРЕВИТАЛИЗАНТ", "гиалуроновая кислота в форме геля", lt - 0.8)
        card(cr, 60, 1290, "БЕЗ СШИВКИ", "не держит объём, а питает кожу", lt - 1.6)
        hdr = ("Препарат", "знакомьтесь — это я")
    elif kind in ("layers", "aging"):
        base_u = 0 if kind == "layers" else 1
        su = (base_u + u) / 2
        z = 1.0 + 0.16 * ease(su)
        cx, cy = 480, 900
        img = move(G["section_bad"], z, cx, cy)
        labels = LAYER_LABELS if kind == "layers" else AGING_LABELS
        step = sd * 0.72 / len(labels)
        for k, (t1, t2, tgt, pos) in enumerate(labels):
            p = lt - 0.35 - k * step
            if kind == "aging" or p < 99:
                card(cr, pos[0], pos[1], t1, t2, p, to_screen(tgt, z, cx, cy))
        hdr = ("Кожа в разрезе", "анатомия слоёв") if kind == "layers" else ("Что меняется", "обезвоживание и старение")
    elif kind == "inject":
        img = anim_frame(ease(min(1.0, lt / (sd * 0.92))))
        img = move(img, 1.0 + 0.05 * u, 450, 850)
        card(cr, 60, 1240, "ВВЕДЕНИЕ ГЕЛЯ", "внутрикожно, на глубину ~1 мм", lt - 0.6)
        card(cr, 520, 1380, "ПАПУЛА", "гель формирует депо в дерме", lt - 2.2)
        hdr = ("Процедура", "микропапульная техника")
    elif kind == "dermis":
        z = 1.0 + 0.08 * u
        c = G["bolus_d"]
        a_ = move(G["dermis_bad"], z, *c)
        b_ = move(G["dermis_good"], z, *c)
        m = radial_mask(to_screen(c, z, *c), 1500 * ease((u - 0.25) / 0.65))
        img = a_ * (1 - m) + b_ * m
        bc = to_screen(c, z, *c)
        rng = np.random.default_rng(4)
        # water molecules drawn towards the gel
        for k in range(70):
            ang = rng.uniform(0, 2 * math.pi)
            r0 = rng.uniform(350, 900)
            ph = rng.uniform(0, 1)
            p = ((lt * 0.35 + ph) % 1.0)
            r = r0 * (1 - ease(p)) + 120
            x = bc[0] + math.cos(ang + p * 0.8) * r
            y = bc[1] + math.sin(ang + p * 0.8) * r * 0.75
            glow_dot(cr, x, y, 7 + 3 * (k % 3), (0.45, 0.75, 1.0), math.sin(math.pi * p) * min(1, lt / 0.6))
        # fibroblasts waking up
        for k in range(12):
            x, y = rng.uniform(80, W - 80), rng.uniform(1000, 1700)
            w_ = ease((u - 0.3 - k * 0.03) / 0.2) * (0.6 + 0.4 * math.sin(lt * 5 + k))
            if w_ > 0:
                glow_dot(cr, x, y, 22, (1.0, 0.75, 0.55), w_ * 0.8)
        card(cr, 60, 400, "ПРИТЯГИВАЕТ ВОДУ", "гиалуроновая кислота — губка", lt - 0.5)
        card(cr, 420, 540, "ФИБРОБЛАСТЫ", "просыпаются и работают", lt - sd * 0.35)
        card(cr, 60, 1330, "НОВЫЙ КОЛЛАГЕН", "и эластин", lt - sd * 0.6)
        hdr = ("Как я работаю", "внутри дермы")
    else:  # result
        z = 1.12 - 0.08 * ease(u)
        cx, cy = 480, 900
        a_ = move(G["section_bad"], z, cx, cy)
        b_ = move(G["section_good"], z, cx, cy)
        if u < 0.62:
            m = radial_mask(to_screen(G["bolus_s"], z, cx, cy), 2400 * ease(u / 0.55))
            img = a_ * (1 - m) + b_ * m
        else:
            v = (u - 0.62) / 0.38
            split = W - (W / 2) * ease_out(v / 0.4)
            xs = np.arange(W)[None, :, None]
            img = np.where(xs < split, a_, b_)
            cr.rectangle(split - 3, 330, 6, H - 330)
            cr.set_source_rgba(1, 1, 1, 0.95)
            cr.fill()
            la = ease((v - 0.3) / 0.2)
            for (txt, xx) in (("ДО", split - 200), ("ПОСЛЕ", split + 40)):
                if la > 0:
                    font(cr, 40, "Inter")
                    tw = cr.text_extents(txt).x_advance
                    rr(cr, xx, 380, tw + 50, 70, 35)
                    cr.set_source_rgba(*CARD, 0.92 * la)
                    cr.fill()
                    cr.move_to(xx + 25, 428)
                    cr.set_source_rgba(*INK, la)
                    cr.show_text(txt)
        if u < 0.62:
            card(cr, 60, 400, "УВЛАЖНЕНИЕ", "кожа гладкая и упругая", lt - 0.6)
            card(cr, 520, 560, "РОВНЫЙ ТОН", "сияние без пигмента", lt - 1.3)
            card(cr, 60, 1300, "ПЛОТНАЯ ДЕРМА", "больше коллагена", lt - 2.0)
        hdr = ("Результат", "после курса процедур")
    if hdr:
        ha = min(ease(lt / 0.4), ease((sd - lt) / 0.3) if sc["i"] == len(scenes) - 1 else 1)
        header(cr, hdr[0], hdr[1], ha, sc["i"], len(scenes) - 2)
    img = over(img, s)
    s3, cr3 = surface()
    captions(cr3, sc, gt)
    img = over(img, s3)
    # cut transitions: short dip through warm black
    for s_ in scenes[1:]:
        dt = gt - s_["start"]
        if -0.18 < dt < 0.18:
            k = 1 - abs(dt) / 0.18
            img = img * (1 - 0.85 * k)
    img = grade(img, fi)
    if gt < 0.5:
        img = img * ease(gt / 0.5)
    if gt > total - 0.6:
        img = img * ease((total - gt) / 0.6)
    return (img * 255).astype(np.uint8).tobytes()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--frames", default=None)
    a = ap.parse_args()
    scenes, voices, total = plan()
    nfr = int(total * FPS)
    print("duration %.1fs" % total, [(s["kind"], round(s["dur"], 1)) for s in scenes])
    if a.frames:
        init()
        from PIL import Image
        for f in [int(x) for x in a.frames.split(",")]:
            Image.frombytes("RGB", (W, H), render_frame((f, scenes, total))).save("/tmp/bio_%04d.png" % f)
        return
    work = os.path.join(HERE, "cache")
    wav = os.path.join(work, "bio.wav")
    build_audio(scenes, voices, total, wav)
    vid = os.path.join(work, "bio_video.mp4")
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H),
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "19",
                           "-maxrate", "10M", "-bufsize", "20M", "-pix_fmt", "yuv420p", vid], stdin=subprocess.PIPE)
    t0 = time.time()
    with mp.get_context("fork").Pool(4, initializer=init) as pool:
        for k, buf in enumerate(pool.imap(render_frame, ((f, scenes, total) for f in range(nfr)), chunksize=2)):
            ff.stdin.write(buf)
            if k % 150 == 0:
                print("  frame %d/%d %.0fs" % (k, nfr, time.time() - t0), flush=True)
    ff.stdin.close()
    ff.wait()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", OUT], check=True)
    print("done", OUT)


if __name__ == "__main__":
    main()
