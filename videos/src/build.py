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
          "atempo=%.4f" % tempo]
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
_yy, _xx = np.mgrid[0:H, 0:W]
VIG = np.clip(((_xx - W / 2) / (W * 0.62)) ** 2 + ((_yy - H / 2) / (H * 0.58)) ** 2, 0, 1).astype(np.float32)[..., None]
G = {}


def draw_caption(img, chunk, age):
    words = chunk
    pop = 1.0 + 0.18 * max(0.0, 1 - age / 0.1)
    size = 64
    f = font("RussoOne.ttf", size)
    sp = f.getlength(" ")
    widths = [f.getlength(w) for w, _ in words]
    total = sum(widths) + sp * (len(words) - 1)
    lines = [words]
    if total > 640 and len(words) > 1:
        lines = [words[:len(words) // 2 + len(words) % 2], words[len(words) // 2 + len(words) % 2:]]
    layer = Image.new("RGBA", (W, 260), (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for li, ln in enumerate(lines):
        ws = [f.getlength(w) for w, _ in ln]
        tw = sum(ws) + sp * (len(ln) - 1)
        sc = min(1.0, 660 / tw)
        ff = font("RussoOne.ttf", size * sc) if sc < 1 else f
        ws = [ff.getlength(w) for w, _ in ln]
        tw = sum(ws) + ff.getlength(" ") * (len(ln) - 1)
        x = W / 2 - tw / 2
        y = 130 + (li - (len(lines) - 1) / 2) * 76
        for (w, c), wd in zip(ln, ws):
            d.text((x, y), w, font=ff, fill=c, anchor="lm", stroke_width=7, stroke_fill="#000000")
            x += wd + ff.getlength(" ")
    if pop != 1.0:
        nw, nh = int(W * pop), int(260 * pop)
        layer = layer.resize((nw, nh), Image.BILINEAR)
        img.alpha_composite(layer, (int(W / 2 - nw / 2), int(CAP_Y - nh / 2)))
    else:
        img.alpha_composite(layer, (0, CAP_Y - 130))


def pill(img, cx, cy, text, bg, fg="#111111", size=26, scale=1.0):
    f = font("Rubik-ExtraBold.ttf", size * scale)
    tw = f.getlength(text)
    d = ImageDraw.Draw(img)
    h = size * scale * 1.5
    d.rounded_rectangle((cx - tw / 2 - 18 * scale, cy - h / 2, cx + tw / 2 + 18 * scale, cy + h / 2), radius=h / 2,
                        fill=bg)
    d.text((cx, cy), text, font=f, fill=fg, anchor="mm")


def render(fi):
    shots, ep = G["shots"], G["ep"]
    tt = fi / FPS
    si = 0
    while si < len(shots) - 1 and tt >= shots[si + 1]["t0"]:
        si += 1
    s = shots[si]
    t = tt - s["t0"]
    T = s["T"]
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    ctx = cairo.Context(surf)
    texts = Texts()
    z0, z1, fx, fy = s["zoom"]
    z = lerp(z0, z1, ease(t / T))
    k = clamp((z - 1) / 0.6)
    px, py = lerp(fx, 360, k), lerp(fy, 600, k)
    sx = sy = 0
    for (a, d, amp) in s["shake"]:
        a = rel(s, a)
        if a <= t < a + d:
            r = random.Random(fi)
            q = 1 - (t - a) / d
            sx += (r.random() - 0.5) * 2 * amp * q
            sy += (r.random() - 0.5) * 2 * amp * q
    ctx.translate(px + sx, py + sy)
    ctx.scale(z, z)
    ctx.translate(-fx, -fy)
    s["draw"](ctx, texts, t, T)
    buf = np.ndarray((H, W, 4), np.uint8, surf.get_data())
    rgb = buf[..., [2, 1, 0]].astype(np.float32) / 255
    night, green = s["night"], s["green"]
    if night:
        rgb = rgb * np.array([1 - 0.5 * night, 1 - 0.42 * night, 1 - 0.18 * night], np.float32)
    if green:
        rgb = rgb * np.array([1 - 0.3 * green, 1.0, 1 - 0.25 * green], np.float32)
    rgb = rgb * (1 - VIG * (0.35 + 0.35 * night))
    fl = 0.0
    for a in s["flash"]:
        a = rel(s, a)
        if t >= a:
            fl = max(fl, math.exp(-(t - a) * 3.5))
    if fl > 0.01:
        rgb = rgb + (1 - rgb) * fl
    img = Image.fromarray((np.clip(rgb, 0, 1) * 255).astype(np.uint8)).convert("RGBA")
    texts.draw(img)
    # top series pill
    pill(img, W / 2, 46, "СТУК В 3:07 · СЕРИЯ %d" % ep if ep < 5 else "СТУК В 3:07 · ФИНАЛ", "#111111", "#FFFFFF", 22)
    if s.get("top"):
        a, b = s["top"]
        f1 = font("RussoOne.ttf", 56)
        d = ImageDraw.Draw(img)
        d.text((W / 2, 130), a, font=f1, fill="#FFFFFF", anchor="mm", stroke_width=6, stroke_fill="#000000")
        if b:
            d.text((W / 2, 200), b, font=font("RussoOne.ttf", 70), fill=YEL, anchor="mm", stroke_width=7,
                   stroke_fill="#000000")
    if s.get("badge"):
        txt, c = s["badge"]
        sc = min(1.0, t / 0.15) if t < 0.15 else 1.0
        sc = 0.6 + 0.4 * ease(sc)
        pill(img, W / 2, 290 if s.get("top") else 150, txt, c, "#111111", 30, sc)
    for a, b, ch in s["caps"]:
        if a <= t < b:
            draw_caption(img, ch, t - a)
    return img.convert("RGB").tobytes()


def build_audio(shots, voices, ep, path):
    n = int(TARGET * SR) + SR
    mix = np.zeros(n, np.float32)
    vtrack = np.zeros(n, np.float32)
    for s, v in zip(shots, voices):
        if len(v):
            i = int((s["t0"] + s["pre"]) * SR)
            vtrack[i:i + len(v)] += v[: n - i]
        for (a, name) in s["sfx"]:
            a = rel(s, a)
            x = sfx(name).astype(np.float32)
            i = int((s["t0"] + a) * SR)
            if i < 0:
                continue
            m = min(len(x), n - i)
            mix[i:i + m] += x[:m] * 0.8
    m = music(n, ep).astype(np.float32)
    # duck the music under the voice
    envv = np.convolve(np.abs(vtrack), np.ones(4410) / 4410, mode="same")
    duck = 1 - 0.45 * np.clip(envv * 8, 0, 1)
    vpk = np.abs(vtrack).max() or 1
    out = m * duck + vtrack / vpk * 0.85 + mix
    out = out[: int(TARGET * SR)]
    out = out / max(1e-6, np.abs(out).max()) * 0.95
    fade = int(0.4 * SR)
    out[-fade:] *= np.linspace(1, 0, fade)
    raw = path + ".f32"
    out.astype(np.float32).tofile(raw)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-f", "f32le", "-ar", str(SR), "-ac", "1", "-i", raw,
                    "-af", "loudnorm=I=-15:TP=-1.5:LRA=11", "-ar", str(SR), path], check=True)
    os.remove(raw)


def main(ep, preview=None):
    shots, voices, tempo = build_timeline(ep)
    G["shots"], G["ep"] = shots, ep
    print("ep", ep, "tempo %.3f" % tempo, "shots", ["%.2f" % s["T"] for s in shots],
          "total %.2f" % sum(s["T"] for s in shots), "voice %.1f" % sum(s["vdur"] for s in shots), flush=True)
    if preview is not None:
        frames = [int((s["t0"] + s["T"] * 0.7) * FPS) for s in shots]
        ims = [Image.frombytes("RGB", (W, H), render(f)).resize((240, 427)) for f in frames]
        cols = 5
        rows = (len(ims) + cols - 1) // cols
        sheet = Image.new("RGB", (240 * cols, 427 * rows))
        for i, im in enumerate(ims):
            sheet.paste(im, ((i % cols) * 240, (i // cols) * 427))
        sheet.save(os.path.join(OUT, "sheet%d.png" % ep))
        return
    wav = os.path.join(OUT, "ep%d.wav" % ep)
    build_audio(shots, voices, ep, wav)
    nf = int(round(TARGET * FPS))
    mp4 = os.path.join(OUT, "Стук_в_3-07_серия_%d.mp4" % ep)
    ff = subprocess.Popen(["ffmpeg", "-v", "error", "-y", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", "%dx%d" % (W, H),
                           "-r", str(FPS), "-i", "-", "-i", wav, "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                           "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "192k", "-t", "%.3f" % TARGET,
                           "-movflags", "+faststart", mp4], stdin=subprocess.PIPE)
    with mp.get_context("fork").Pool(4) as pool:
        for i, b in enumerate(pool.imap(render, range(nf), chunksize=6)):
            ff.stdin.write(b)
    ff.stdin.close()
    ff.wait()
    print("done", mp4, flush=True)


if __name__ == "__main__":
    eps = [int(x) for x in sys.argv[1].split(",")]
    for e in eps:
        main(e, preview=("preview" in sys.argv) or None)
