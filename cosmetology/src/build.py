"""Render one cosmetology reel: python3 build.py vitc|ha|retinol|b3 [--preview SECONDS] [--frames a,b,c]"""
import sys, os, re, math, json, hashlib, subprocess, asyncio, time, argparse
import multiprocessing as mp
import numpy as np
import cv2
import cairo
from scipy.signal import butter, sosfilt

ROOT = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, ROOT)
import skin, views, char, section
from reels import REELS
from char import PAL, mix

W, H, FPS, SR = 1080, 1920, 30, 44100
TTS_DIR = os.path.join(ROOT, "cache", "tts")
OUT_DIR = os.path.join(os.path.dirname(ROOT))
os.makedirs(TTS_DIR, exist_ok=True)
FEET = (540, 1400)
CH = 540
DROP_SCREEN = (790, 1470)
CAM = (1536, 2650)
GAP = 0.22


def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def ease_out(x):
    x = min(1.0, max(0.0, x))
    return 1 - (1 - x) ** 3


def back_out(x):
    x = min(1.0, max(0.0, x))
    c = 1.9
    return 1 + (c + 1) * (x - 1) ** 3 + c * (x - 1) ** 2


# ------------------------------------------------------------------ voice
def tts(text, voice, rate, pitch):
    clean = text.replace("*", "")
    h = hashlib.md5((clean + voice + rate + pitch).encode()).hexdigest()[:12]
    mp3, js = os.path.join(TTS_DIR, h + ".mp3"), os.path.join(TTS_DIR, h + ".json")
    if not (os.path.exists(mp3) and os.path.exists(js)):
        import certifi
        certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
        import edge_tts

        async def go(bnd):
            c = edge_tts.Communicate(clean, voice, rate=rate, pitch=pitch, boundary=bnd)
            data, words = b"", []
            async for ch in c.stream():
                if ch["type"] == "audio":
                    data += ch["data"]
                elif ch["type"] == "WordBoundary":  # Dmitry only works with sentence boundaries
                    words.append((ch["text"], ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7))
            return data, words
        for attempt in range(40):
            try:
                data, words = asyncio.run(go("WordBoundary" if attempt < 2 else "SentenceBoundary"))
                if len(data) > 1000:
                    open(mp3, "wb").write(data)
                    json.dump(words, open(js, "w"), ensure_ascii=False)
                    break
            except Exception as e:
                print("tts retry", e)
            time.sleep(1.5)
        else:
            raise RuntimeError("TTS failed")
    af = "highpass=f=80,equalizer=f=250:t=q:w=1:g=-1.5,equalizer=f=3500:t=q:w=1.2:g=2.5," \
         "acompressor=threshold=-20dB:ratio=3:attack=5:release=80:makeup=2"
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", mp3, "-af", af, "-ac", "1", "-ar", str(SR), "-f", "f32le", "-"],
                       capture_output=True, check=True)
    return np.frombuffer(r.stdout, np.float32).copy(), json.load(open(js))


def caption_tokens(line):
    toks, state = [], False
    for w in line.split():
        hl = False
        clean = ""
        for chh in w:
            if chh == "*":
                state = not state
                hl = True
            else:
                clean += chh
                if state:
                    hl = True
        if re.search(r"\w", clean):
            toks.append([clean.upper(), hl])
        elif toks:
            toks[-1][0] += " " + clean
    return toks


def time_tokens(toks, words, dur):
    if len(words) == len(toks):
        return [(t[0], t[1], w[1], w[2]) for t, w in zip(toks, words)]
    a = words[0][1] if words else 0.1
    b = words[-1][2] if words else dur - 0.1
    lens = np.array([len(t[0]) + 2 for t in toks], float)
    edges = a + (b - a) * np.concatenate([[0], np.cumsum(lens)]) / lens.sum()
    return [(t[0], t[1], edges[i], edges[i + 1]) for i, t in enumerate(toks)]


def chunk_tokens(tt):
    res, cur = [], []
    for tok in tt:
        cur.append(tok)
        n = sum(len(x[0]) for x in cur)
        if len(cur) >= 3 or n >= 14 or re.search(r"[.?!,:—]$", tok[0]):
            res.append(cur)
            cur = []
    if cur:
        res.append(cur)
    return res


def plan(kind):
    cfg = REELS[kind]
    scenes, t = [], 0.35
    voices = []
    for i, line in enumerate(cfg["lines"]):
        audio, words = tts(line, cfg["voice"], cfg["rate"], cfg["pitch"])
        dur = len(audio) / SR
        toks = time_tokens(caption_tokens(line), words, dur)
        lead = 0.35 if i == 0 else 0.0
        sd = dur + GAP + (0.9 if i == 6 else 0) + (0.2 if i in (3, 4) else 0)
        scenes.append(dict(i=i, start=t - lead, dur=sd + lead, vstart=t, vdur=dur,
                           chunks=[[(w, hl, s + t, e + t) for (w, hl, s, e) in c] for c in chunk_tokens(toks)]))
        voices.append((t, audio))
        t += sd
    total = t
    return cfg, scenes, voices, total


# ------------------------------------------------------------------ audio
def lp(x, f):
    return sosfilt(butter(2, f, "low", fs=SR, output="sos"), x)


def bp(x, f1, f2):
    return sosfilt(butter(2, [f1, f2], "band", fs=SR, output="sos"), x)


rng_a = np.random.default_rng(9)


def sfx(name):
    if name == "whoosh":
        n = int(0.7 * SR); t = np.arange(n) / SR
        e = np.sin(np.pi * t / 0.7) ** 2
        return bp(rng_a.standard_normal(n), 400, 5000) * e * 0.28
    if name == "boop":
        n = int(0.35 * SR); t = np.arange(n) / SR
        f = 420 * np.exp(-t * 5) + 180
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 12) * 0.45
    if name == "plink":
        n = int(0.6 * SR); t = np.arange(n) / SR
        f = 900 + 1400 * np.exp(-t * 30)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 9) * 0.35
    if name == "splash":
        n = int(0.8 * SR); t = np.arange(n) / SR
        return bp(rng_a.standard_normal(n), 800, 7000) * np.exp(-t * 7) * 0.32
    if name == "pop":
        n = int(0.12 * SR); t = np.arange(n) / SR
        return np.sin(2 * np.pi * (700 - 2500 * t) * t) * np.exp(-t * 40) * 0.3
    if name == "shimmer":
        n = int(2.2 * SR); t = np.arange(n) / SR
        s = np.zeros(n)
        for k, f in enumerate((1568, 2093, 2637, 3136, 2349, 2794)):
            st = int(k * 0.12 * SR)
            tt = t[:n - st]
            s[st:] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 3.5) * 0.08
        return s
    if name == "zoom":
        n = int(0.9 * SR); t = np.arange(n) / SR
        e = (t / 0.9) ** 2
        return (bp(rng_a.standard_normal(n), 300, 3000) * e * 0.35 +
                np.sin(2 * np.pi * np.cumsum(200 + 600 * t / 0.9) / SR) * e * 0.1)
    raise KeyError(name)


def music(n):
    """Soft, airy bed: warm pad chords with a gentle plucked arpeggio, 100 bpm."""
    t = np.arange(n) / SR
    beat = 60 / 100
    chords = [(57, 60, 64, 67), (53, 57, 60, 64), (55, 59, 62, 67), (52, 55, 59, 64)]   # Am7 Fmaj7 G Em7
    out = np.zeros(n)
    bar = beat * 4
    for bi in range(int(n / SR / bar) + 2):
        notes = chords[bi % 4]
        s0 = int(bi * bar * SR)
        ln = int(bar * SR * 1.1)
        if s0 >= n:
            break
        seg = np.arange(min(ln, n - s0)) / SR
        env = np.minimum(seg / 0.6, 1) * np.exp(-seg * 0.25)
        for m in notes:
            f = 440 * 2 ** ((m - 69) / 12)
            out[s0:s0 + len(seg)] += (np.sin(2 * np.pi * f * seg) + 0.3 * np.sin(2 * np.pi * f * 2.003 * seg)) * env * 0.05
        arp = [notes[0] + 12, notes[2] + 12, notes[1] + 12, notes[3] + 12, notes[2] + 12, notes[1] + 24, notes[3], notes[2] + 12]
        for k, m in enumerate(arp):
            st = s0 + int(k * beat / 2 * SR)
            if st >= n:
                break
            ln2 = min(int(0.9 * SR), n - st)
            tt = np.arange(ln2) / SR
            f = 440 * 2 ** ((m - 69) / 12)
            out[st:st + ln2] += np.sin(2 * np.pi * f * tt) * np.exp(-tt * 5) * 0.06 * (1 - np.exp(-tt * 300))
        # soft kick + hat
        for k in range(4):
            st = s0 + int(k * beat * SR)
            if st >= n:
                break
            ln3 = min(int(0.25 * SR), n - st)
            tt = np.arange(ln3) / SR
            out[st:st + ln3] += np.sin(2 * np.pi * (50 + 80 * np.exp(-tt * 30)) * tt) * np.exp(-tt * 14) * 0.14
            sth = st + int(beat / 2 * SR)
            if sth < n:
                ln4 = min(int(0.05 * SR), n - sth)
                out[sth:sth + ln4] += bp(rng_a.standard_normal(ln4), 6000, 12000) * np.exp(-np.arange(ln4) / SR * 80) * 0.05
    out = lp(out, 7000)
    return out


def build_audio(scenes, voices, total, path):
    n = int((total + 0.2) * SR)
    v = np.zeros(n)
    for st, a in voices:
        i = int(st * SR)
        v[i:i + len(a)] += a[:n - i]
    fx = np.zeros(n)

    def add(name, at, g=1.0):
        s = sfx(name) * g
        i = int(at * SR)
        if i < n:
            fx[i:i + len(s)] += s[:n - i]
    sc = scenes
    add("whoosh", sc[1]["start"] - 0.1)
    add("boop", sc[1]["start"] + 0.45)
    for k in range(3):
        add("pop", sc[0]["start"] + 0.6 + k * 0.35, 0.8)
        add("pop", sc[2]["start"] + 0.5 + k * 0.55, 0.8)
    add("plink", sc[3]["start"] + 0.75)
    add("splash", sc[3]["start"] + 0.8)
    add("zoom", sc[4]["start"] - 0.75)
    add("pop", sc[4]["start"] + sc[4]["dur"] * 0.25, 0.8)
    add("pop", sc[4]["start"] + sc[4]["dur"] * 0.55, 0.8)
    add("shimmer", sc[5]["start"] + 0.2)
    add("whoosh", sc[5]["start"] + sc[5]["dur"] * 0.55 - 0.2, 0.8)
    add("whoosh", sc[6]["start"] - 0.1, 0.8)
    for k in range(3):
        add("pop", sc[6]["start"] + 0.6 + k * 0.4, 0.7)
    m = music(n)
    env = np.abs(v)
    env = lp(np.convolve(env, np.ones(2000) / 2000, mode="same"), 8)
    duck = 1 - 0.55 * np.clip(env / (env.max() * 0.25 + 1e-6), 0, 1)
    fade = np.minimum(1, np.minimum(np.arange(n) / (0.5 * SR), (n - np.arange(n)) / (1.2 * SR)))
    mix_ = v * 1.0 + fx * 0.8 + m * 0.55 * duck * fade
    mix_ = mix_ / (np.abs(mix_).max() + 1e-6) * 0.92
    raw = path + ".f32"
    mix_.astype(np.float32).tofile(raw)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-ar", str(SR), "-ac", "2", path], check=True)
    os.remove(raw)
    # per-frame mouth envelope
    fr = int(total * FPS) + 2
    mouth = np.zeros(fr)
    hop = SR // FPS
    for f in range(fr):
        seg = v[f * hop:(f + 1) * hop]
        mouth[f] = np.sqrt((seg ** 2).mean()) if len(seg) else 0
    mouth = mouth / (np.percentile(mouth[mouth > 0], 90) + 1e-6)
    return np.clip(mouth, 0, 1.2)


# ------------------------------------------------------------------ drawing helpers
def rr_path(cr, x, y, w, h, r):
    section.rr_path(cr, x, y, w, h, r)


def font(cr, size, weight="black"):
    fam = {"black": "Inter Display Black", "bold": "Inter Display", "semi": "Inter"}[weight]
    cr.select_font_face(fam, cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(size)


def outlined_text(cr, x, y, txt, size, fill, stroke=(0.1, 0.04, 0.03), sw=10, align="center", alpha=1.0, weight="black"):
    font(cr, size, weight)
    e = cr.text_extents(txt)
    if align == "center":
        x0 = x - e.x_advance / 2
    elif align == "right":
        x0 = x - e.x_advance
    else:
        x0 = x
    cr.new_path()
    cr.move_to(x0 + 3, y + 5)
    cr.text_path(txt)
    cr.set_source_rgba(0, 0, 0, 0.28 * alpha)
    cr.fill()
    cr.move_to(x0, y)
    cr.text_path(txt)
    cr.set_line_join(cairo.LINE_JOIN_ROUND)
    cr.set_line_width(sw)
    cr.set_source_rgba(*stroke, 0.85 * alpha)
    cr.stroke_preserve()
    cr.set_source_rgba(*fill, alpha)
    cr.fill()
    return e.x_advance


def pill(cr, cx, cy, txt, size, kind, scale=1.0, alpha=1.0, dot=True, dark=False):
    if scale <= 0.01 or alpha <= 0:
        return
    p = PAL[kind]
    font(cr, size, "bold")
    e = cr.text_extents(txt)
    w = e.x_advance + size * 1.3 + (size * 0.9 if dot else 0)
    h = size * 1.9
    cr.save()
    cr.translate(cx, cy)
    cr.scale(scale, scale)
    rr_path(cr, -w / 2 + 4, -h / 2 + 8, w, h, h / 2)
    cr.set_source_rgba(0.2, 0.08, 0.05, 0.22 * alpha)
    cr.fill()
    rr_path(cr, -w / 2, -h / 2, w, h, h / 2)
    if dark:
        cr.set_source_rgba(0.12, 0.07, 0.06, 0.82 * alpha)
    else:
        cr.set_source_rgba(1, 1, 1, 0.92 * alpha)
    cr.fill_preserve()
    cr.set_line_width(3)
    cr.set_source_rgba(*p["base"], 0.9 * alpha)
    cr.stroke()
    x = -w / 2 + size * 0.65
    if dot:
        cr.arc(x + size * 0.3, 0, size * 0.28, 0, 2 * math.pi)
        cr.set_source_rgba(*p["base"], alpha)
        cr.fill()
        x += size * 0.9
    cr.move_to(x, size * 0.36)
    if dark:
        cr.set_source_rgba(1, 1, 1, alpha)
    else:
        cr.set_source_rgba(0.14, 0.08, 0.06, alpha)
    cr.show_text(txt)
    cr.restore()


def captions(cr, sc, gt, kind):
    p = PAL[kind]
    hl_col = mix(p["base"], (1, 1, 0.6), 0.25) if kind != "b3" else (0.45, 1.0, 0.82)
    chs = sc["chunks"]
    for ci, ch in enumerate(chs):
        s, e = ch[0][2] - 0.05, ch[-1][3] + 0.15
        if ci + 1 < len(chs):
            e = min(e, chs[ci + 1][0][2] - 0.05)
        elif sc["i"] < 6:
            e = min(e + 0.25, sc["start"] + sc["dur"])
        nxt = None
        if not (s <= gt < e):
            continue
        age = gt - s
        sc_ = 0.82 + 0.18 * back_out(age / 0.18)
        font(cr, 80)
        words = [w for (w, hl, a, b) in ch]
        widths = [cr.text_extents(w + " ").x_advance for w in words]
        total = sum(widths) - cr.text_extents(" ").x_advance
        lines = [list(range(len(words)))]
        if total > 940:
            lines = [list(range(len(words) - 1)), [len(words) - 1]]
        cr.save()
        cr.translate(540, 1585)
        cr.scale(sc_, sc_)
        for li, idxs in enumerate(lines):
            lw = sum(widths[i] for i in idxs) - cr.text_extents(" ").x_advance
            x = -lw / 2
            y = (li - (len(lines) - 1) / 2) * 92 + 28
            for i in idxs:
                w, hl, a, b = ch[i]
                active = a - 0.03 <= gt < b + 0.05
                col = hl_col if hl else (1, 1, 1)
                if active and not hl:
                    col = (1.0, 0.97, 0.88)
                lift = -6 if active else 0
                outlined_text(cr, x, y + lift, w, 80, col, sw=12, align="left")
                x += widths[i]
        cr.restore()


def callout(cr, x, y, r, label, kind, prog, flat=1.0, side=1):
    if prog <= 0:
        return
    p = PAL[kind]
    k = back_out(prog / 0.35)
    a = min(1.0, prog / 0.15)
    cr.save()
    cr.translate(x, y)
    cr.scale(1, flat)
    cr.arc(0, 0, r * k, 0, 2 * math.pi)
    cr.restore()
    cr.set_line_width(6)
    cr.set_source_rgba(1, 1, 1, 0.95 * a)
    cr.set_dash([16, 10], prog * 40)
    cr.stroke()
    cr.set_dash([])
    # leader + label
    lx = x + side * (r + 40)
    ly = y - r * flat - 40
    cr.move_to(x + side * r * 0.7, y - r * flat * 0.7)
    cr.line_to(lx, ly)
    cr.set_line_width(4)
    cr.set_source_rgba(1, 1, 1, 0.9 * a)
    cr.stroke()
    font(cr, 34, "bold")
    tw = cr.text_extents(label).x_advance + 34 * 1.3 + 30
    cx = lx + side * tw / 2
    cx = min(max(cx, tw / 2 + 20), W - tw / 2 - 20)
    pill(cr, cx, ly - 10, label, 34, kind, scale=back_out(min(1, (prog - 0.1) / 0.3)) if prog > 0.1 else 0, alpha=a)


def sparkle(cr, x, y, s, a, col):
    cr.save()
    cr.translate(x, y)
    rg = cairo.RadialGradient(0, 0, 0, 0, 0, s * 2.2)
    rg.add_color_stop_rgba(0, 1, 1, 1, 0.9 * a)
    rg.add_color_stop_rgba(0.3, *col, 0.4 * a)
    rg.add_color_stop_rgba(1, *col, 0)
    cr.set_source(rg)
    cr.arc(0, 0, s * 2.2, 0, 2 * math.pi)
    cr.fill()
    cr.new_path()
    for k in range(8):
        rad = s if k % 2 == 0 else s * 0.18
        ang = k * math.pi / 4
        cr.line_to(math.cos(ang) * rad, math.sin(ang) * rad)
    cr.close_path()
    cr.set_source_rgba(1, 1, 1, a)
    cr.fill()
    cr.restore()


def bookmark(cr, x, y, s, col):
    cr.new_path()
    cr.move_to(x - s * 0.5, y - s * 0.65)
    cr.line_to(x + s * 0.5, y - s * 0.65)
    cr.line_to(x + s * 0.5, y + s * 0.65)
    cr.line_to(x, y + s * 0.3)
    cr.line_to(x - s * 0.5, y + s * 0.65)
    cr.close_path()
    cr.set_source_rgb(*col)
    cr.fill()


# ------------------------------------------------------------------ frame rendering
G = {}


def init_worker(kind):
    bad, good, meta = skin.skin_pair(kind)
    G["bad"] = (np.asarray(bad, np.float32) * 255).clip(0, 255).astype(np.uint8)
    G["good"] = (np.asarray(good, np.float32) * 255).clip(0, 255).astype(np.uint8)
    G["meta"] = meta
    G["kind"] = kind


def surface():
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    return s, cairo.Context(s)


def over(img, s):
    a = np.ndarray((H, W, 4), np.uint8, s.get_data()).astype(np.float32) / 255
    return img * (1 - a[..., 3:4]) + a[..., [2, 1, 0]]


def skin_view(Hm, heal=0.0, origin=None, radius=0.0, state="bad"):
    a = views.warp(G["bad"], Hm).astype(np.float32) / 255
    if state == "good" and radius <= 0:
        return views.warp(G["good"], Hm).astype(np.float32) / 255, None
    if radius > 0:
        b = views.warp(G["good"], Hm).astype(np.float32) / 255
        m, front = views.heal_mask(Hm, origin, radius)
        return a * (1 - m[..., None]) + b * m[..., None], front
    return a, None


def char_pose(sc_i, lt, sd, gt, mouth):
    blink = 1.0 if (gt % 3.3) < 0.11 else 0.0
    talk = mouth
    pose = dict(blink=blink, squash=0.035 * math.sin(gt * 4.2), mood="happy")
    y_off = 0.0
    if sc_i == 1:
        fall = 0.5
        if lt < fall:
            u = lt / fall
            y_off = -(1 - u * u) * 1500
            pose["squash"] = -0.25
            pose["mood"] = "wow"
        elif lt < fall + 0.25:
            u = (lt - fall) / 0.25
            pose["squash"] = 0.35 * math.sin(u * math.pi) * (1 - u) + 0.0
        pose["arm_l"] = "wave" if lt > fall + 0.2 else "up"
        pose["arm_r"] = "hip" if lt > fall + 0.2 else "up"
    elif sc_i == 2:
        pose.update(mood="worried", arm_r="point", arm_l="hip", look=(1, -0.5))
    elif sc_i == 3:
        pose.update(look=(1, -1), arm_l="rest", arm_r="rest")
        if lt > 0.8:
            j = max(0.0, math.sin((lt - 0.8) * 7)) * max(0.0, 1 - (lt - 0.8) / 1.4)
            y_off = -j * 90
            pose.update(mood="wow", arm_l="up", arm_r="up", look=(1, 0.3))
    elif sc_i == 5:
        j = abs(math.sin(lt * 5.5)) * 50 * max(0.0, 1 - lt / 2.2)
        y_off = -j
        pose.update(arm_l="up", arm_r="up", mood="happy")
    elif sc_i == 6:
        pose.update(arm_l="hip", arm_r="point", point=(0.6, -1), look=(0.4, -1))
    return pose, y_off, talk


def render_frame(args):
    fi, kind, cfg, scenes, mouth_env, total = args
    gt = fi / FPS
    sc = scenes[-1]
    for s_ in scenes:
        if s_["start"] <= gt < s_["start"] + s_["dur"]:
            sc = s_
            break
    i, lt, sd = sc["i"], gt - sc["start"], sc["dur"]
    u = lt / sd
    p = PAL[kind]
    meta = G["meta"]
    speaking = sc["vstart"] <= gt < sc["vstart"] + sc["vdur"]
    mouth = float(mouth_env[min(fi, len(mouth_env) - 1)]) if speaking else 0.0
    s, cr = surface()
    img = None
    persp_Hm = views.persp_H(CAM[0] + 40 * math.sin(gt * 0.3), CAM[1] - 60 * u)
    drop_tex = None

    def tex_of_screen(Hm, x, y):
        q = Hm @ np.array([x, y, 1.0])
        return q[0] / q[2], q[1] / q[2]

    show_char = i in (1, 2, 3, 5, 6)
    if i == 0:
        sp = meta["spots"][:3]
        sx, sy = sum(x for x, _, _ in sp) / 3, sum(y for _, y, _ in sp) / 3 - 150
        z = 1.0 + 0.3 * ease(u)
        Hm = views.topdown_H(sx, sy, z)
        img, _ = skin_view(Hm)
        img = views.dof(img, 900, persp=False)
        for k, (x, y, r) in enumerate(meta["spots"][:3]):
            px, py = views.project(Hm, x, y)
            rs = r / 1.35 * z
            if 80 < px < 1000 and 560 < py < 1450:
                callout(cr, px, py, rs * 0.95, cfg["problems"][k], kind, lt - 0.6 - k * 0.35, side=1 if px < 540 else -1)
        # hook title
        for k, line in enumerate(cfg["hook"]):
            a = ease((lt - 0.05 - k * 0.18) / 0.25)
            if a <= 0:
                continue
            sc2 = 0.7 + 0.3 * back_out((lt - 0.05 - k * 0.18) / 0.3)
            cr.save()
            cr.translate(540, 330 + k * 112)
            cr.scale(sc2, sc2)
            col = (1, 1, 1) if k == 0 else mix(p["base"], (1, 0.95, 0.6), 0.2)
            font(cr, 92)
            fit = min(1.0, 980 / cr.text_extents(line).x_advance)
            cr.scale(fit, fit)
            outlined_text(cr, 0, 0, line, 92, col, sw=14, alpha=a)
            cr.restore()
    elif i in (1, 2, 3, 6) or (i == 5 and u < 0.56):
        state = "good" if i == 6 else "bad"
        radius, origin = 0.0, None
        if i == 5:
            origin = tex_of_screen(persp_Hm, *DROP_SCREEN)
            radius = 4200 * ease_out(lt / (sd * 0.5))
        img, front = skin_view(persp_Hm, origin=origin, radius=radius, state=state)
        img = views.dof(img, FEET[1] + 20)
        if front is not None:
            img = img + front[..., None] * np.array(p["light"], np.float32) * 0.35
        img = views.haze(img)
        if i == 2:
            # project problem spots into the perspective view
            vis = []
            for (x, y, r) in meta["spots"]:
                px, py = views.project(persp_Hm, x, y)
                ex_, ey_ = views.project(persp_Hm, x + r, y)
                rs = abs(ex_ - px)
                if 130 < px < 950 and 600 < py < 1300 and abs(px - FEET[0]) + abs(py - 1150) > 200:
                    vis.append((px, py, rs))
            vis.sort(key=lambda v: v[1])
            if len(vis) < 2:
                vis += [(250, 1000, 110), (820, 820, 90)][len(vis):]
            for k, (px, py, rs) in enumerate(vis[:2]):
                callout(cr, px, py, min(160, max(60, rs * 0.9)), cfg["problems"][k], kind, lt - 0.4 - k * 0.6,
                        flat=0.5, side=-1 if px < 540 else 1)
        if i == 3:
            # serum drop falls and splashes beside the hero
            fall_t = 0.75
            dx, dy = DROP_SCREEN
            if lt < fall_t:
                v = lt / fall_t
                y = -200 + (dy - 40 + 200) * v * v
                char.serum_drop(cr, kind, dx, y, 46, stretch=1.0 + 0.4 * v)
            else:
                k = lt - fall_t
                # serum puddle soaking in
                pa = max(0.0, 1 - k / (sd - fall_t + 0.4))
                cr.save()
                cr.translate(dx, dy)
                cr.scale(1, 0.32)
                rg = cairo.RadialGradient(-20, -20, 5, 0, 0, 140 * ease_out(k / 0.4))
                rg.add_color_stop_rgba(0, *mix(p["light"], (1, 1, 1), 0.4), 0.85 * pa)
                rg.add_color_stop_rgba(0.6, *p["base"], 0.55 * pa)
                rg.add_color_stop_rgba(1, *p["base"], 0)
                cr.set_source(rg)
                cr.arc(0, 0, 140 * ease_out(k / 0.4) + 1, 0, 2 * math.pi)
                cr.fill()
                cr.restore()
                for rk in range(3):
                    rr = (k - rk * 0.18) / 0.9
                    if 0 < rr < 1:
                        cr.save()
                        cr.translate(dx, dy)
                        cr.scale(1, 0.32)
                        cr.arc(0, 0, 40 + 260 * ease_out(rr), 0, 2 * math.pi)
                        cr.restore()
                        cr.set_line_width(5 * (1 - rr))
                        cr.set_source_rgba(1, 1, 1, 0.7 * (1 - rr))
                        cr.stroke()
                for dk in range(9):
                    ang = -math.pi * (0.1 + 0.8 * dk / 8)
                    sp = 380 + 90 * (dk % 3)
                    tt = k
                    if tt < 0.55:
                        x = dx + math.cos(ang) * sp * tt
                        y = dy + math.sin(ang) * sp * tt + 1300 * tt * tt
                        cr.arc(x, y, 9 - 4 * (dk % 2), 0, 2 * math.pi)
                        cr.set_source_rgba(*mix(p["light"], (1, 1, 1), 0.3), 0.9)
                        cr.fill()
        if i == 5:
            rng = np.random.default_rng(int(lt * 10))
            rr_ = np.random.default_rng(77)
            for k in range(26):
                x, y = rr_.uniform(60, W - 60), rr_.uniform(700, 1700)
                ph = rr_.uniform(0, 1)
                a = math.sin(math.pi * ((lt * 1.6 + ph) % 1.0))
                d = math.hypot(x - DROP_SCREEN[0], (y - DROP_SCREEN[1]) * 1.8)
                if d < radius * 0.32:
                    sparkle(cr, x, y, 16 + 10 * (k % 3), a * 0.9, p["light"])
        if i == 1:
            a = ease((lt - 0.7) / 0.3)
            if a > 0:
                k = back_out((lt - 0.7) / 0.35)
                cr.save()
                cr.translate(540, 360)
                cr.scale(k, k)
                font(cr, 34, "bold")
                outlined_text(cr, 0, 0, cfg["name"], 112, mix(p["base"], (1, 0.95, 0.7), 0.15), sw=16, alpha=a)
                outlined_text(cr, 0, 70, cfg["role"], 44, (1, 1, 1), sw=9, alpha=a, weight="bold")
                cr.restore()
        if i == 6:
            # tips card
            a = ease(lt / 0.35)
            k = back_out(lt / 0.4)
            cr.save()
            cr.translate(540, 470)
            cr.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k)
            cw, chh = 900, 470
            rr_path(cr, -cw / 2 + 6, -chh / 2 + 14, cw, chh, 44)
            cr.set_source_rgba(0.2, 0.08, 0.05, 0.22 * a)
            cr.fill()
            rr_path(cr, -cw / 2, -chh / 2, cw, chh, 44)
            cr.set_source_rgba(1, 1, 1, 0.9 * a)
            cr.fill()
            rr_path(cr, -cw / 2, -chh / 2, cw, 14, 7)
            cr.set_source_rgba(*p["base"], a)
            cr.fill()
            font(cr, 54)
            cr.move_to(-cw / 2 + 50, -chh / 2 + 92)
            cr.set_source_rgba(0.13, 0.07, 0.05, a)
            cr.show_text(cfg["tips_title"])
            for tk, tip in enumerate(cfg["tips"]):
                ta = ease((lt - 0.5 - tk * 0.4) / 0.25)
                if ta <= 0:
                    continue
                y = -chh / 2 + 175 + tk * 82
                x = -cw / 2 + 50 + (1 - ta) * 40
                cr.arc(x + 20, y - 14, 20, 0, 2 * math.pi)
                cr.set_source_rgba(*p["base"], ta)
                cr.fill()
                cr.move_to(x + 10, y - 14)
                cr.line_to(x + 18, y - 5)
                cr.line_to(x + 31, y - 23)
                cr.set_line_width(5)
                cr.set_source_rgba(1, 1, 1, ta)
                cr.stroke()
                font(cr, 40, "bold")
                cr.move_to(x + 58, y)
                cr.set_source_rgba(0.15, 0.09, 0.07, ta)
                cr.show_text(tip)
            font(cr, 24, "semi")
            cr.move_to(-cw / 2 + 50, chh / 2 - 34)
            cr.set_source_rgba(0.4, 0.3, 0.28, a * 0.9)
            cr.show_text(cfg["note"])
            cr.restore()
            # save CTA
            ca = ease((lt - 1.9) / 0.3)
            if ca > 0:
                pulse = 1 + 0.04 * math.sin(lt * 7)
                cr.save()
                cr.translate(540, 790)
                cr.scale(back_out((lt - 1.9) / 0.35) * pulse, back_out((lt - 1.9) / 0.35) * pulse)
                font(cr, 44)
                txt = "СОХРАНИ СЕБЕ"
                tw = cr.text_extents(txt).x_advance + 140
                rr_path(cr, -tw / 2, -46, tw, 92, 46)
                cr.set_source_rgba(*p["base"], ca)
                cr.fill()
                bookmark(cr, -tw / 2 + 58, 0, 40, (1, 1, 1))
                cr.move_to(-tw / 2 + 98, 16)
                cr.set_source_rgba(1, 1, 1, ca)
                cr.show_text(txt)
                cr.restore()
    elif i == 4:
        q = ease((u - 0.3) / 0.6)
        ss, scr = surface()
        zoom = 1.0 + 0.06 * u
        scr.translate(540, 900)
        scr.scale(zoom, zoom)
        scr.translate(-540, -900)
        section.draw(scr, kind, gt, sd, q, u)
        sec = np.ndarray((H, W, 4), np.uint8, ss.get_data())[..., [2, 1, 0]].astype(np.float32) / 255
        img = views.dof(sec, 700, persp=False)
        for k, chip in enumerate(cfg["chips"]):
            st = 0.22 + k * 0.22
            pr = (u - st) / 0.08
            if pr > 0:
                pill(cr, 540, 225 + k * 88, chip, 40, kind, scale=back_out(min(1, pr)), alpha=min(1, pr * 2), dark=True)
    else:
        # before / after split, top-down
        v = (u - 0.56) / 0.44
        sx, sy, _ = meta["spots"][0]
        Hm = views.topdown_H(sx + 120, sy + 250, 1.15)
        a = views.warp(G["bad"], Hm).astype(np.float32) / 255
        b = views.warp(G["good"], Hm).astype(np.float32) / 255
        split = W - (W / 2) * ease_out(v / 0.35)
        xs = np.arange(W)[None, :, None]
        img = np.where(xs < split, a, b)
        img = views.dof(img, 900, persp=False)
        cr.rectangle(split - 4, 0, 8, H)
        cr.set_source_rgba(1, 1, 1, 0.95)
        cr.fill()
        cr.arc(split, 960, 40, 0, 2 * math.pi)
        cr.set_source_rgba(1, 1, 1, 1)
        cr.fill()
        cr.set_source_rgba(*p["base"], 1)
        cr.set_line_width(6)
        for sgn in (-1, 1):
            cr.move_to(split + sgn * 8, 945)
            cr.line_to(split + sgn * 20, 960)
            cr.line_to(split + sgn * 8, 975)
            cr.stroke()
        la = ease((v - 0.3) / 0.2)
        pill(cr, 270, 330, "ДО", 50, kind, scale=la, alpha=la, dot=False, dark=True)
        pill(cr, 810, 330, "ПОСЛЕ", 50, kind, scale=la, alpha=la, dot=False)
        for k in range(10):
            rr_ = np.random.default_rng(k)
            x, y = rr_.uniform(split + 30, W - 30), rr_.uniform(450, 1450)
            a2 = math.sin(math.pi * ((lt * 1.3 + k * 0.17) % 1.0))
            if x < W - 10:
                sparkle(cr, x, y, 14 + 8 * (k % 3), a2 * 0.8, p["light"])
    # hero on top of the skin
    if show_char and not (i == 5 and u >= 0.56):
        pose, y_off, talk = char_pose(i, lt, sd, gt, mouth)
        fx, fy = FEET
        if i == 6:
            fy = 1420
        lift = min(1.0, -y_off / 600) if y_off < 0 else 0
        s2, cr2 = surface()
        char.draw_shadow(cr2, fx, fy, CH, kind, lift=lift)
        char.draw(cr2, kind, fx, fy + y_off, CH, t=gt, mouth=talk, pose=pose)
        img = over(img, s2)
    img = over(img, s)
    # captions after everything else
    s3, cr3 = surface()
    captions(cr3, sc, gt, kind)
    # series tag
    font(cr3, 26, "bold")
    tag = "АКТИВЫ ДЛЯ КОЖИ · %d/4" % cfg["n"]
    tw = cr3.text_extents(tag).x_advance
    rr_path(cr3, 540 - tw / 2 - 22, 118, tw + 44, 50, 25)
    cr3.set_source_rgba(0.1, 0.05, 0.04, 0.38)
    cr3.fill()
    cr3.move_to(540 - tw / 2, 152)
    cr3.set_source_rgba(1, 1, 1, 0.95)
    cr3.show_text(tag)
    img = over(img, s3)
    # transitions: zoom into the skin at the end of scene 3, white flash into the section
    if i == 3 and lt > sd - 0.55:
        k = ease((lt - (sd - 0.55)) / 0.55)
        z = 1 + 2.2 * k * k
        M = cv2.getRotationMatrix2D(DROP_SCREEN, 0, z)
        img = cv2.warpAffine(img, M, (W, H), borderMode=cv2.BORDER_REFLECT)
        img = img * (1 - k * 0.8) + np.float32(1.0) * k * 0.8
    if i == 4 and lt < 0.35:
        k = 1 - ease(lt / 0.35)
        img = img * (1 - k * 0.8) + k * 0.8
    if (i == 5 and abs(lt - sd * 0.56) < 0.12) or (i == 6 and lt < 0.12) or (i == 1 and lt < 0.12):
        img = img * 0.85 + 0.15
    img = views.grade(img, fi)
    if gt < 0.25:
        img = img * (gt / 0.25)
    return (img * 255).astype(np.uint8).tobytes()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("kind")
    ap.add_argument("--frames", default=None)
    ap.add_argument("--procs", type=int, default=4)
    a = ap.parse_args()
    kind = a.kind
    cfg, scenes, voices, total = plan(kind)
    skin.skin_pair(kind)
    work = os.path.join(ROOT, "cache", "work")
    os.makedirs(work, exist_ok=True)
    wav = os.path.join(work, kind + ".wav")
    mouth = build_audio(scenes, voices, total, wav)
    nfr = int(total * FPS)
    print(kind, "duration %.1fs, %d frames" % (total, nfr), [round(s["dur"], 2) for s in scenes])
    if a.frames:
        init_worker(kind)
        from PIL import Image
        for f in [int(x) for x in a.frames.split(",")]:
            buf = render_frame((f, kind, cfg, scenes, mouth, total))
            Image.frombytes("RGB", (W, H), buf).save("/tmp/frame_%s_%04d.png" % (kind, f))
        return
    out = os.path.join(OUT_DIR, cfg["file"] + ".mp4")
    vid = os.path.join(work, kind + "_video.mp4")
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H),
                           "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "slow", "-crf", "17",
                           "-pix_fmt", "yuv420p", "-profile:v", "high", vid], stdin=subprocess.PIPE)
    t0 = time.time()
    jobs = ((f, kind, cfg, scenes, mouth, total) for f in range(nfr))
    with mp.get_context("fork").Pool(a.procs, initializer=init_worker, initargs=(kind,)) as pool:
        for k, buf in enumerate(pool.imap(render_frame, jobs, chunksize=2)):
            ff.stdin.write(buf)
            if k % 150 == 0:
                print("  frame %d/%d  %.0fs" % (k, nfr, time.time() - t0), flush=True)
    ff.stdin.close()
    ff.wait()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", vid, "-i", wav, "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", "-movflags", "+faststart", out], check=True)
    print("done", out, "%.0fs" % (time.time() - t0))


if __name__ == "__main__":
    main()
