import sys, os, re, math, json, hashlib, subprocess, asyncio, time, random
import multiprocessing as mp
import numpy as np
from scipy.signal import butter, sosfilt
import cairo
from PIL import Image, ImageDraw
import engine
from engine import W, H, FPS, font, ease, clamp, lerp, Texts
import story

ROOT = os.path.dirname(os.path.abspath(__file__))
TTS_DIR = os.path.join(ROOT, "tts")
OUT = os.path.join(ROOT, "out")
os.makedirs(TTS_DIR, exist_ok=True)
os.makedirs(OUT, exist_ok=True)
SR = 44100
TARGET = 63.0
END_MIN = 2.2
CAP_Y = 900
YEL, RED, WHITE = "#FFD21E", "#FF3B30", "#FFFFFF"


# ------------------------------------------------------------------ text parsing
def tts_text(s):
    s = re.sub(r"\{([^|]*)\|([^}]*)\}", r"\2", s)
    return s.replace("*", "").replace("!", "")


def cap_words(s):
    s = re.sub(r"\{([^|]*)\|([^}]*)\}", r"\1", s)
    out, state = [], None
    for w in s.split():
        clean, c = "", None
        for ch in w:
            if ch == "*":
                state = None if state == YEL else YEL
                c = c or YEL
            elif ch == "!":
                state = None if state == RED else RED
                c = c or RED
            else:
                clean += ch
                if state:
                    c = state
        out.append((clean.upper(), c or WHITE))
    return out


def chunks(words):
    res, cur = [], []
    for w, c in words:
        cur.append((w, c))
        n = sum(len(x) for x, _ in cur)
        if len(cur) >= 3 or n >= 13 or re.search(r"[.?:»…]$", w):
            res.append(cur)
            cur = []
    if cur:
        res.append(cur)
    return res


# ------------------------------------------------------------------ TTS
def tts_raw(text):
    h = hashlib.md5(text.encode()).hexdigest()[:12]
    path = os.path.join(TTS_DIR, h + ".mp3")
    if os.path.exists(path) and os.path.getsize(path) > 1000:
        return path
    import certifi
    certifi.where = lambda: "/root/.ccr/ca-bundle.crt"
    import edge_tts

    async def go():
        c = edge_tts.Communicate(text, "ru-RU-DmitryNeural")
        data = b""
        async for ch in c.stream():
            if ch["type"] == "audio":
                data += ch["data"]
        return data

    for attempt in range(25):
        try:
            data = asyncio.run(go())
            if len(data) > 1000:
                open(path, "wb").write(data)
                return path
        except Exception as e:
            pass
        time.sleep(1.5 + attempt * 0.5)
    raise RuntimeError("TTS failed: " + text)


def load_voice(text, tempo, fx):
    raw = tts_raw(text)
    af = ["silenceremove=start_periods=1:start_threshold=-45dB",
          "areverse", "silenceremove=start_periods=1:start_threshold=-45dB", "areverse",
          "atempo=%.4f" % tempo, "highpass=f=75", "equalizer=f=200:t=q:w=1:g=-2",
          "equalizer=f=3200:t=q:w=1.2:g=3", "equalizer=f=9000:t=q:w=1:g=1.5",
          "acompressor=threshold=-20dB:ratio=3.5:attack=4:release=90:makeup=2"]
    if fx == "phone":
        af += ["highpass=f=400", "lowpass=f=3000", "acompressor=threshold=-20dB:ratio=6", "volume=1.6"]
    elif fx == "whisper":
        af += ["asetrate=%d,aresample=%d,atempo=%.4f" % (int(24000 * 0.92), 24000, 1 / 0.92),
               "aecho=0.8:0.7:60|120:0.35|0.2"]
    r = subprocess.run(["ffmpeg", "-v", "error", "-i", raw, "-af", ",".join(af), "-ac", "1", "-ar", str(SR),
                        "-f", "f32le", "-"], capture_output=True, check=True)
    return np.frombuffer(r.stdout, dtype=np.float32).copy()


# ------------------------------------------------------------------ SFX
def env(n, attack, decay):
    t = np.arange(n) / SR
    return np.minimum(t / max(attack, 1e-4), 1) * np.exp(-t * decay)


def lp(x, f, order=2):
    return sosfilt(butter(order, f, "low", fs=SR, output="sos"), x)


def bp(x, f1, f2):
    return sosfilt(butter(2, [f1, f2], "band", fs=SR, output="sos"), x)


rng = np.random.default_rng(7)


def sfx(name):
    if name == "knock":
        n = int(0.35 * SR)
        t = np.arange(n) / SR
        s = np.sin(2 * np.pi * 85 * t) * np.exp(-t * 22) * 0.9 + np.sin(2 * np.pi * 170 * t) * np.exp(-t * 35) * 0.4
        s += lp(rng.standard_normal(n), 900) * env(n, 0.001, 45) * 0.8
        return s * 0.95
    if name == "tick":
        n = int(0.08 * SR)
        return bp(rng.standard_normal(n), 2000, 6000) * env(n, 0.0005, 90) * 0.35
    if name == "sting":
        n = int(2.6 * SR)
        t = np.arange(n) / SR
        s = np.sin(2 * np.pi * 42 * t + 3 * np.sin(2 * np.pi * 3 * t)) * np.exp(-t * 1.4) * 0.8
        s += lp(rng.standard_normal(n), 300) * np.exp(-t * 3) * 0.6
        s += (np.sin(2 * np.pi * 740 * t) + np.sin(2 * np.pi * 783 * t)) * np.exp(-t * 1.8) * 0.06
        return s
    if name == "heart":
        out = np.zeros(int(2.6 * SR))
        for k in range(3):
            for d, a in ((0, 1.0), (0.18, 0.7)):
                n = int(0.25 * SR)
                t = np.arange(n) / SR
                b = np.sin(2 * np.pi * 52 * t) * np.exp(-t * 18) * a
                i = int((k * 0.85 + d) * SR)
                out[i:i + n] += b
        return out * 0.9
    if name == "ring":
        n = int(3.2 * SR)
        t = np.arange(n) / SR
        s = (np.sin(2 * np.pi * 440 * t) + np.sin(2 * np.pi * 480 * t)) * 0.5
        gate = ((t % 1.6) < 1.0) * (np.sin(2 * np.pi * 20 * t) > 0)
        return lp(s * gate, 3000) * 0.18
    if name == "slam":
        n = int(1.5 * SR)
        t = np.arange(n) / SR
        s = np.sin(2 * np.pi * 55 * t) * np.exp(-t * 6) + lp(rng.standard_normal(n), 1200) * np.exp(-t * 10)
        return s * 0.9
    if name == "whoosh":
        n = int(1.4 * SR)
        t = np.arange(n) / SR
        e = np.sin(np.pi * np.clip(t / 1.4, 0, 1)) ** 2
        s = bp(rng.standard_normal(n), 300, 4000) * e * 0.5
        s += np.sin(2 * np.pi * (200 + 900 * t) * t) * e * 0.08
        return s
    if name == "creak":
        n = int(1.0 * SR)
        t = np.arange(n) / SR
        f = 180 + 60 * np.sin(2 * np.pi * 1.3 * t) + 15 * rng.standard_normal(n).cumsum() / 300
        ph = 2 * np.pi * np.cumsum(f) / SR
        s = np.sign(np.sin(ph)) * 0.5 + np.sin(ph * 2) * 0.3
        return bp(s, 300, 2500) * np.sin(np.pi * t / 1.0) * 0.18
    if name == "scratch":
        n = int(1.6 * SR)
        t = np.arange(n) / SR
        g = (np.sin(2 * np.pi * 5 * t) > -0.2).astype(float)
        return bp(rng.standard_normal(n), 2500, 7000) * g * 0.08
    if name == "wind":
        n = int(4.0 * SR)
        t = np.arange(n) / SR
        e = np.sin(np.pi * t / 4.0)
        return bp(rng.standard_normal(n), 200, 900) * e * (0.6 + 0.4 * np.sin(2 * np.pi * 0.7 * t)) * 0.25
    if name == "steps":
        out = np.zeros(int(4.0 * SR))
        for k in range(7):
            n = int(0.15 * SR)
            i = int(k * 0.55 * SR)
            out[i:i + n] += lp(rng.standard_normal(n), 600) * env(n, 0.002, 30) * 0.5
        return out
    if name == "glitch":
        n = int(0.4 * SR)
        t = np.arange(n) / SR
        g = (np.sin(2 * np.pi * 37 * t) > 0).astype(float)
        s = (np.sign(np.sin(2 * np.pi * 1800 * t * (1 + g))) * 0.3 + rng.standard_normal(n) * 0.5) * g
        return bp(s, 500, 7000) * np.exp(-t * 6) * 0.35
    if name == "riser":
        n = int(2.0 * SR)
        t = np.arange(n) / SR
        f = 120 + 900 * (t / 2.0) ** 2
        s = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.15 + bp(rng.standard_normal(n), 800, 6000) * 0.25
        return s * (t / 2.0) ** 2
    if name == "hit":
        n = int(1.8 * SR)
        t = np.arange(n) / SR
        return (np.sin(2 * np.pi * 38 * t) * np.exp(-t * 2.2) + lp(rng.standard_normal(n), 2500) * np.exp(-t * 14) * 0.7) * 0.95
    if name == "breath":
        n = int(3.0 * SR)
        t = np.arange(n) / SR
        e = np.sin(np.pi * (t % 1.5) / 1.5) ** 2
        return bp(rng.standard_normal(n), 250, 1400) * e * 0.35
    if name == "door":
        return np.concatenate([sfx("creak") * 1.5, np.zeros(1)])
    if name == "birds":
        n = int(3.0 * SR)
        t = np.arange(n) / SR
        out = np.zeros(n)
        for k in range(5):
            st = 0.3 + k * 0.5 + 0.1 * k % 3
            m = (t > st) & (t < st + 0.15)
            out += np.sin(2 * np.pi * (3200 + 800 * np.sin(2 * np.pi * 25 * t)) * t) * m * 0.05
        return out
    raise KeyError(name)


def music(n, ep):
    t = np.arange(n) / SR
    roots = {1: 55.0, 2: 51.9, 3: 49.0, 4: 46.2, 5: 55.0}
    f0 = roots[ep]
    s = np.zeros(n)
    for mult, a in ((1, 0.5), (1.5, 0.22), (2, 0.25), (2.378, 0.12)):
        s += np.sin(2 * np.pi * f0 * mult * t + 0.3 * np.sin(2 * np.pi * 0.11 * mult * t)) * a
    s *= 0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t)
    s += lp(rng.standard_normal(n), 400) * 0.25
    # slow pulse that speeds up toward the end
    bpm = 50 + 40 * (t / (n / SR))
    ph = np.cumsum(bpm / 60 / SR)
    pulse = np.exp(-(ph % 1) * 14) * np.sin(2 * np.pi * 45 * t)
    s += pulse * 0.6
    return s * 0.11


# ------------------------------------------------------------------ timeline
def build_timeline(ep):
    E = story.EP[ep]
    shots = [dict(s) for s in E["shots"]]
    tempo = 1.0
    for _ in range(6):
        voices, total = [], 0
        for s in shots:
            v = load_voice(tts_text(s["text"]), tempo, s["fx"]) if s["text"] else np.zeros(0, np.float32)
            voices.append(v)
            vd = len(v) / SR
            s["vdur"] = vd
            s["T"] = s["dur"] if s["dur"] else s["pre"] + vd + s["post"]
            total += s["T"]
        if total + END_MIN <= TARGET:
            break
        vsum = sum(s["vdur"] for s in shots)
        over = total + END_MIN - TARGET
        tempo *= vsum / max(1.0, vsum - over - 0.2)
        if tempo > 1.4:
            raise RuntimeError("episode %d script too long for %.0fs" % (ep, TARGET))
    extra = TARGET - END_MIN - total
    talk = [s for s in shots if not s["dur"]]
    add = min(0.5, max(0.0, extra) / max(1, len(talk)))
    for s in talk:
        s["post"] += add
        s["T"] += add
    total = sum(s["T"] for s in shots)
    end = dict(story.S("", lambda c, x, t, T: engine.endcard(c, x, t, dict(big=E["next"],
                                                                         small=E.get("next_small",
                                                                                     "ПРОДОЛЖЕНИЕ СЛЕДУЕТ"))),
                       zoom=(1.0, 1.05, 360, 640), sfx=[(0.0, "sting")]))
    end["T"] = TARGET - total
    end["vdur"] = 0
    shots.append(end)
    voices.append(np.zeros(0, np.float32))
    t0 = 0
    for s in shots:
        s["t0"] = t0
        t0 += s["T"]
        words = [(w, c) for w, c in cap_words(s.get("caption") or s["text"])] if (s.get("caption") or s["text"]) else []
        chs = chunks(words)
        cap = []
        if chs:
            vd = s["vdur"] if s["vdur"] > 0 else s["T"] - 0.4
            weights = [sum(len(w) for w, _ in ch) + 3 for ch in chs]
            tot = sum(weights)
            acc = s["pre"] if s["vdur"] > 0 else 0.3
            for ch, wgt in zip(chs, weights):
                d = vd * wgt / tot
                cap.append((acc, acc + d, ch))
                acc += d
            # hold the last chunk through the pause
            a, b, ch = cap[-1]
            cap[-1] = (a, s["T"] - 0.05, ch)
        s["caps"] = cap
    return shots, voices, tempo


def rel(s, tt):
    return tt if tt >= 0 else s["T"] + tt


# ------------------------------------------------------------------ rendering
SC = 1.5                       # logical 720x1280 -> output 1080x1920
OW, OH = int(W * SC), int(H * SC)
_yy, _xx = np.mgrid[0:OH, 0:OW]
VIG = np.clip(((_xx - OW / 2) / (OW * 0.62)) ** 2 + ((_yy - OH / 2) / (OH * 0.58)) ** 2, 0, 1).astype(np.float32)[..., None]
del _yy, _xx
_g = np.random.default_rng(3)
GRAIN = [(_g.standard_normal((OH // 2, OW // 2)).astype(np.float32)) for _ in range(6)]
G = {}


def caption_layer(chunk):
    size = 64 * SC
    f = font("RussoOne.ttf", size)
    sp = f.getlength(" ")
    total = sum(f.getlength(w) for w, _ in chunk) + sp * (len(chunk) - 1)
    lines = [chunk]
    if total > 640 * SC and len(chunk) > 1:
        h = len(chunk) // 2 + len(chunk) % 2
        lines = [chunk[:h], chunk[h:]]
    LW, LH = OW, int(300 * SC)
    layer = Image.new("RGBA", (LW, LH), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for li, ln in enumerate(lines):
        ws = [f.getlength(w) for w, _ in ln]
        tw = sum(ws) + sp * (len(ln) - 1)
        sc = min(1.0, 660 * SC / tw)
        ff = font("RussoOne.ttf", size * sc) if sc < 1 else f
        ws = [ff.getlength(w) for w, _ in ln]
        tw = sum(ws) + ff.getlength(" ") * (len(ln) - 1)
        x = LW / 2 - tw / 2
        y = LH / 2 + (li - (len(lines) - 1) / 2) * 78 * SC
        for (w, c), wd in zip(ln, ws):
            # soft drop shadow, then thick outline
            d.text((x + 4 * SC, y + 5 * SC), w, font=ff, fill=(0, 0, 0, 150), anchor="lm",
                   stroke_width=int(8 * SC), stroke_fill=(0, 0, 0, 150))
            d.text((x, y), w, font=ff, fill=c, anchor="lm", stroke_width=int(7 * SC), stroke_fill="#000000")
            x += wd + ff.getlength(" ")
    return layer


_caps_cache = {}


def draw_caption(img, chunk, age):
    key = tuple(chunk)
    if key not in _caps_cache:
        _caps_cache[key] = caption_layer(chunk)
    layer = _caps_cache[key]
    # pop-in with a little overshoot
    x = clamp(age / 0.16)
    pop = 1.0 + 0.22 * (1 - x) - 0.05 * math.sin(x * math.pi)
    a = clamp(age / 0.05)
    if abs(pop - 1.0) > 0.002:
        nw, nh = int(layer.width * pop), int(layer.height * pop)
        l2 = layer.resize((nw, nh), Image.BILINEAR)
    else:
        l2 = layer
    if a < 1:
        l2 = l2.copy()
        l2.putalpha(l2.getchannel("A").point(lambda v: int(v * a)))
    img.alpha_composite(l2, (int(OW / 2 - l2.width / 2), int(CAP_Y * SC - l2.height / 2)))


def pill(img, cx, cy, text, bg, fg="#111111", size=26, scale=1.0):
    cx, cy, size = cx * SC, cy * SC, size * SC
    f = font("Rubik-ExtraBold.ttf", size * scale)
    tw = f.getlength(text)
    d = ImageDraw.Draw(img)
    h = size * scale * 1.55
    pad = 20 * SC * scale
    d.rounded_rectangle((cx - tw / 2 - pad + 3 * SC, cy - h / 2 + 4 * SC, cx + tw / 2 + pad + 3 * SC, cy + h / 2 + 4 * SC),
                        radius=h / 2, fill=(0, 0, 0, 110))
    d.rounded_rectangle((cx - tw / 2 - pad, cy - h / 2, cx + tw / 2 + pad, cy + h / 2), radius=h / 2, fill=bg)
    d.text((cx, cy), text, font=f, fill=fg, anchor="mm")


def render(fi):
    shots, ep = G["shots"], G["ep"]
    tt = fi / FPS
    engine.VLEVEL = float(G["venv"][min(fi, len(G["venv"]) - 1)])
    si = 0
    while si < len(shots) - 1 and tt >= shots[si + 1]["t0"]:
        si += 1
    s = shots[si]
    t = tt - s["t0"]
    T = s["T"]
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, OW, OH)
    ctx = cairo.Context(surf)
    ctx.scale(SC, SC)
    texts = Texts()
    z0, z1, fx, fy = s["zoom"]
    z = lerp(z0, z1, ease(t / T))
    # punch-in on every cut + slow handheld drift
    z *= 1 + 0.045 * (1 - ease(t / 0.3))
    k = clamp((z - 1) / 0.6)
    px, py = lerp(fx, 360, k), lerp(fy, 600, k)
    sx = 2.2 * math.sin(tt * 0.9) + 1.3 * math.sin(tt * 2.3)
    sy = 1.8 * math.sin(tt * 1.1 + 1) + 1.0 * math.sin(tt * 2.9)
    for (a, d, amp) in s["shake"]:
        a = rel(s, a)
        if a <= t < a + d:
            r = random.Random(fi)
            q = 1 - (t - a) / d
            sx += (r.random() - 0.5) * 2 * amp * q
            sy += (r.random() - 0.5) * 2 * amp * q
    # heartbeat: punch the zoom on every beat of a "heart" cue
    beat = 0.0
    for (a, name) in s["sfx"]:
        if name == "heart":
            a = rel(s, a)
            for k3 in range(3):
                for dd, amp in ((0, 1.0), (0.18, 0.6)):
                    bt = a + k3 * 0.85 + dd
                    if t >= bt:
                        beat = max(beat, amp * math.exp(-(t - bt) * 9))
    z *= 1 + 0.03 * beat
    ctx.translate(px + sx, py + sy)
    roll = s.get("roll", 0)
    if roll:
        r0, r1 = roll if isinstance(roll, tuple) else (0, roll)
        ctx.rotate(math.radians(lerp(r0, r1, ease(t / T))))
    ctx.scale(z, z)
    ctx.translate(-fx, -fy)
    engine.SHOT_NIGHT = s["night"]
    s["draw"](ctx, texts, t, T)
    if s["night"] > 0.2 or s["green"]:
        engine.dust(ctx, tt, s["night"] or 0.6)
    buf = np.ndarray((OH, OW, 4), np.uint8, surf.get_data())
    rgb = buf[..., [2, 1, 0]].astype(np.float32) * (1 / 255)
    night, green = s["night"], s["green"]
    if night:
        rgb *= np.array([1 - 0.5 * night, 1 - 0.42 * night, 1 - 0.18 * night], np.float32)
    if green:
        rgb *= np.array([1 - 0.3 * green, 1.0, 1 - 0.25 * green], np.float32)
    # gentle filmic grade: lift blacks, warm highlights
    rgb = rgb * 0.94 + 0.025
    rgb *= (1 - VIG * (0.38 + 0.35 * night))
    g = GRAIN[fi % len(GRAIN)]
    g = np.repeat(np.repeat(g, 2, 0), 2, 1)[..., None]
    rgb += g * (0.010 + 0.008 * night)
    red = s.get("red", 0) * (0.65 + 0.35 * math.sin(tt * 6)) + 0.5 * beat * (s.get("red", 0) > 0 or True)
    if red > 0.01:
        rgb[..., 0:1] += VIG * red * 0.55
        rgb[..., 1:3] *= (1 - VIG * red * 0.35)
    if s.get("flicker"):
        rr = random.Random(int(tt * 14) + 7 * si)
        if rr.random() < 0.13:
            rgb *= 0.18
    fl = 0.0
    for a in s["flash"]:
        a = rel(s, a)
        if t >= a:
            fl = max(fl, math.exp(-(t - a) * 3.5))
    if fl > 0.01:
        rgb = rgb + (1 - rgb) * fl
    # quick fade-in from black at each cut into a new scene (2 frames) keeps cuts crisp but not harsh
    if si > 0 and t < 2 / FPS:
        rgb *= 0.55 + 0.45 * (t * FPS / 2)
    gl = 0.0
    for a in s.get("glitch", []):
        a = rel(s, a)
        if 0 <= t - a < 0.4:
            gl = max(gl, 1 - (t - a) / 0.4)
    img = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).convert("RGBA")
    texts.draw(img)
    if gl > 0.02:
        arr = np.array(img)
        rr = random.Random(fi * 13)
        sh = int(18 * gl * SC)
        arr[..., 0] = np.roll(arr[..., 0], sh, axis=1)
        arr[..., 2] = np.roll(arr[..., 2], -sh, axis=1)
        for _ in range(int(2 + 5 * gl)):
            y0 = rr.randrange(0, OH - 60)
            hgt = rr.randrange(8, int(70 * SC))
            arr[y0:y0 + hgt] = np.roll(arr[y0:y0 + hgt], rr.randrange(-60, 60), axis=1)
        img = Image.fromarray(arr)
    pill(img, W / 2, 46, "СТУК В 3:07 · СЕРИЯ %d" % ep if ep < 5 else "СТУК В 3:07 · ФИНАЛ", "#111111", "#FFFFFF", 22)
    if s.get("top"):
        a, b = s["top"]
        d = ImageDraw.Draw(img)
        ap = ease(t / 0.25)
        d.text((OW / 2, (130 - 20 * (1 - ap)) * SC), a, font=font("RussoOne.ttf", 56 * SC), fill="#FFFFFF",
               anchor="mm", stroke_width=int(6 * SC), stroke_fill="#000000")
        if b:
            fs = 70 * SC
            while font("RussoOne.ttf", fs).getlength(b) > 660 * SC:
                fs -= 2
            d.text((OW / 2, 200 * SC), b, font=font("RussoOne.ttf", fs * (0.7 + 0.3 * ap)), fill=YEL, anchor="mm",
                   stroke_width=int(7 * SC), stroke_fill="#000000")
    if s.get("badge"):
        txt, c = s["badge"]
        sc = 0.6 + 0.4 * ease(min(1.0, t / 0.15))
        pill(img, W / 2, 290 if s.get("top") else 150, txt, c, "#111111", 30, sc)
    for a, b, ch in s["caps"]:
        if a <= t < b:
            draw_caption(img, ch, t - a)
    return img.convert("RGB").tobytes()


def reverb_ir(sec, decay, bright=4000):
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = rng.standard_normal(n) * np.exp(-t * decay)
    ir = lp(ir, bright)
    ir[0] = 0
    return ir / np.abs(ir).sum() * 6


def music(n, ep):
    from scipy.signal import fftconvolve
    t = np.arange(n) / SR
    roots = {1: 55.0, 2: 51.9, 3: 49.0, 4: 46.2, 5: 55.0}
    f0 = roots[ep]
    pad = np.zeros(n)
    # dark minor pad with slowly detuned voices
    for mult, a in ((1, 0.5), (1.5, 0.2), (2, 0.25), (2.378, 0.14), (3, 0.06)):
        for det in (-0.4, 0.4):
            pad += np.sin(2 * np.pi * (f0 * mult + det) * t + 0.3 * np.sin(2 * np.pi * 0.11 * mult * t)) * a * 0.5
    pad *= 0.65 + 0.35 * np.sin(2 * np.pi * 0.06 * t)
    pad += lp(rng.standard_normal(n), 300) * 0.22
    # sparse music-box notes in A minor, a little detuned (creepy)
    notes = [0, 3, 7, 10, 12, 15, 14, 7]
    mel = np.zeros(n)
    r = np.random.default_rng(ep)
    tt = 1.5
    while tt < n / SR - 3:
        semi = notes[r.integers(len(notes))]
        f = f0 * 8 * 2 ** (semi / 12) * (1 + 0.004 * r.standard_normal())
        L = int(2.5 * SR)
        i = int(tt * SR)
        tl = np.arange(min(L, n - i)) / SR
        mel[i:i + len(tl)] += (np.sin(2 * np.pi * f * tl) + 0.3 * np.sin(4 * np.pi * f * tl)) * np.exp(-tl * 2.2) * 0.12
        tt += r.choice([1.5, 2.0, 3.0])
    mel = mel + fftconvolve(mel, reverb_ir(2.5, 2.0), mode="full")[:n] * 0.8
    # heartbeat-like pulse speeding up toward the cliffhanger
    bpm = 52 + 40 * (t / (n / SR)) ** 1.5
    ph = np.cumsum(bpm / 60 / SR)
    pulse = np.exp(-(ph % 1) * 14) * np.sin(2 * np.pi * 48 * t)
    return (pad * 0.11 + mel * 0.9 + pulse * 0.07)


def voice_track(shots, voices, n):
    vtrack = np.zeros(n, np.float32)
    for s, v in zip(shots, voices):
        if len(v):
            i = int((s["t0"] + s["pre"]) * SR)
            vtrack[i:i + len(v)] += v[: n - i]
    return vtrack


def frame_envelope(vtrack):
    hop = SR // FPS
    nf = len(vtrack) // hop
    e = np.sqrt((vtrack[: nf * hop].reshape(nf, hop) ** 2).mean(1))
    e = e / (np.percentile(e[e > 1e-4], 95) if (e > 1e-4).any() else 1)
    return np.clip(e, 0, 1)


def build_audio(shots, voices, ep, path):
    from scipy.signal import fftconvolve
    n = int(TARGET * SR) + SR
    mix = np.zeros(n, np.float32)
    vtrack = voice_track(shots, voices, n)
    for s in shots:
        for (a, name) in s["sfx"]:
            a = rel(s, a)
            x = sfx(name).astype(np.float32)
            i = int((s["t0"] + a) * SR)
            if i < 0:
                continue
            m = min(len(x), n - i)
            mix[i:i + m] += x[:m] * 0.8
    # sfx live in the same dark room as the voice
    mix = mix + fftconvolve(mix, reverb_ir(1.2, 4.0, 2500), mode="full")[:n] * 0.35
    vpk = np.abs(vtrack).max() or 1
    vtrack = vtrack / vpk
    vroom = fftconvolve(vtrack, reverb_ir(0.6, 9.0, 5000), mode="full")[:n] * 0.10
    m = music(n, ep).astype(np.float32)
    envv = np.convolve(np.abs(vtrack), np.ones(4410) / 4410, mode="same")
    duck = 1 - 0.55 * np.clip(envv * 10, 0, 1)
    out = m * duck + (vtrack + vroom) * 0.9 + mix * 0.75
    out = out[: int(TARGET * SR)]
    out = out / max(1e-6, np.abs(out).max()) * 0.95
    fade = int(0.4 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    raw = path + ".f32"
    out.astype(np.float32).tofile(raw)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                    "-af", "acompressor=threshold=-16dB:ratio=2.5:attack=10:release=150,"
                           "loudnorm=I=-14:TP=-1.0:LRA=9", "-ar", "48000", "-ac", "2", path], check=True)
    os.remove(raw)


def main(ep, preview=None):
    shots, voices, tempo = build_timeline(ep)
    G["shots"], G["ep"] = shots, ep
    n = int(TARGET * SR) + SR
    G["venv"] = frame_envelope(voice_track(shots, voices, n))
    print("ep", ep, "tempo %.3f" % tempo, "shots", ["%.2f" % s["T"] for s in shots],
          "total %.2f" % sum(s["T"] for s in shots), "voice %.1f" % sum(s["vdur"] for s in shots), flush=True)
    if preview is not None:
        frames = [int((s["t0"] + s["T"] * 0.7) * FPS) for s in shots]
        ims = [Image.frombytes("RGB", (OW, OH), render(f)).resize((240, 427)) for f in frames]
        cols = 5
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (240 * cols, 427 * rows))
        for i, im in enumerate(ims):
            sheet.paste(im, ((i % cols) * 240, (i // cols) * 427))
        sheet.save(os.path.join(OUT, "sheet%d.png" % ep))
        Image.frombytes("RGB", (OW, OH), render(frames[min(5, len(frames) - 1)])).save(os.path.join(OUT, "full%d.png" % ep))
        return
    wav = os.path.join(OUT, "ep%d.wav" % ep)
    build_audio(shots, voices, ep, wav)
    nf = int(round(TARGET * FPS))
    mp4 = os.path.join(OUT, "Стук_в_3-07_серия_%d.mp4" % ep)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (OW, OH),
                           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "slow", "-crf", "17",
                           "-profile:v", "high", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k",
                           "-t", "%.3f" % TARGET, "-movflags", "+faststart", mp4], stdin=subprocess.PIPE)
    with mp.get_context("fork").Pool(4) as pool:
        for i, b in enumerate(pool.imap(render, range(nf), chunksize=4)):
            ff.stdin.write(b)
    ff.stdin.close()
    ff.wait()
    print("done", mp4, flush=True)


if __name__ == "__main__":
    eps = [int(x) for x in sys.argv[1].split(",")]
    for e in eps:
        main(e, preview=("preview" in sys.argv) or None)
