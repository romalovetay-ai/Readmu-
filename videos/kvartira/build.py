#!/usr/bin/env python3
"""Build the narrated explainer: TTS -> timeline -> frames (pycairo, 4 workers) -> music/SFX mix -> MP4.

  python3 build.py               full render  -> out/kvartira.mp4
  python3 build.py --preview 60  first N seconds at half resolution
  python3 build.py --stills      one PNG per beat into out/stills/ (fast visual check)
"""
import argparse, asyncio, hashlib, json, math, os, re, subprocess, sys, wave
import multiprocessing as mp
import numpy as np
import cairo

import gfx
import character
import scenes
import importlib
script = importlib.import_module(os.environ.get("SCRIPT", "script"))
SUFFIX = "" if script.__name__ == "script" else "_" + script.__name__.split("_", 1)[1]

ROOT = os.path.dirname(os.path.abspath(__file__))
TTS = os.path.join(ROOT, "cache", "tts")
OUT = os.path.join(ROOT, "out")
FPS = 25
SR = 44100
VOICE = "ru-RU-DmitryNeural"
RATE = "+16%"
GAP = 0.2
os.makedirs(TTS, exist_ok=True)
os.makedirs(OUT, exist_ok=True)


# ------------------------------------------------------------------ TTS
def spoken(s):
    """Text for the voice: drop {n} anchors and *emphasis* marks."""
    s = re.sub(r"\{\d+\}", "", s)
    return re.sub(r"\s+", " ", s.replace("*", "")).strip()


async def _tts(text, mp3, js, shout=False):
    import certifi
    ca = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
    if os.path.exists(ca):
        certifi.where = lambda: ca
    import edge_tts
    for attempt in range(6):
        try:
            c = edge_tts.Communicate(text, VOICE, rate="+28%" if shout else RATE, volume="+40%" if shout else "+0%",
                                    pitch="+22Hz" if shout else "+0Hz", boundary="WordBoundary")
            words = []
            with open(mp3 + ".part", "wb") as f:
                async for ch in c.stream():
                    if ch["type"] == "audio":
                        f.write(ch["data"])
                    elif ch["type"] == "WordBoundary":
                        words.append([ch["offset"] / 1e7, (ch["offset"] + ch["duration"]) / 1e7, ch["text"]])
            os.replace(mp3 + ".part", mp3)
            json.dump(words, open(js, "w"), ensure_ascii=False)
            return
        except Exception as e:  # service hiccups: retry
            print("tts retry", attempt, e, file=sys.stderr)
            await asyncio.sleep(2 * (attempt + 1))
    raise RuntimeError("TTS failed: " + text[:60])


def tts(text, shout=False):
    h = hashlib.md5((VOICE + RATE + text + ("!shout" if shout else "")).encode()).hexdigest()[:16]
    mp3, js, wav = (os.path.join(TTS, h + e) for e in (".mp3", ".json", ".wav"))
    if not os.path.exists(wav):
        if not os.path.exists(mp3):
            asyncio.run(_tts(text, mp3, js, shout))
        subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", mp3, "-ac", "1", "-ar", str(SR), wav], check=True)
    with wave.open(wav) as w:
        a = np.frombuffer(w.readframes(w.getnframes()), np.int16).astype(np.float32) / 32768
    return a, json.load(open(js))


# ------------------------------------------------------------------ timeline
def anchor_times(say, words):
    """Map {n} markers to the start time of the next spoken word."""
    toks = re.findall(r"\{\d+\}|[^\s{}]+", say)
    out, wi = {}, 0
    for tk in toks:
        m = re.fullmatch(r"\{(\d+)\}", tk)
        if m:
            out[int(m.group(1))] = words[wi][0] if wi < len(words) else (words[-1][1] if words else 0)
        else:
            clean = re.sub(r"[^\wёЁ%₽]", "", tk.replace("*", ""))
            if clean:
                wi += 1
    return out


def build_timeline():
    beats, t = [], 0.0
    voice = []
    for i, b in enumerate(script.BEATS):
        b = dict(b)
        if b.get("say"):
            a, words = tts(spoken(b["say"]), b.get("shout", False))
            dur = len(a) / SR + b.get("pad", GAP)
        else:
            a, words = np.zeros(0, np.float32), []
            dur = b.get("dur", 1.5)
        b.update(idx=i, start=t, dur=dur, words=words, anchors=anchor_times(b.get("say", ""), words))
        voice.append((t, a))
        beats.append(b)
        t += dur
    total = t + 1.0
    vt = np.zeros(int(total * SR) + SR, np.float32)
    for st, a in voice:
        s = int(st * SR)
        vt[s:s + len(a)] += a
    return beats, total, vt


def mouth_env(vt, n_frames):
    hop = SR // FPS
    env = np.zeros(n_frames, np.float32)
    for f in range(n_frames):
        seg = vt[f * hop:(f + 1) * hop]
        if len(seg):
            env[f] = np.sqrt(np.mean(seg ** 2))
    env = np.clip(env / (np.percentile(env[env > 0], 90) + 1e-6 if (env > 0).any() else 1), 0, 1.2)
    sm = np.copy(env)
    for f in range(1, n_frames):
        sm[f] = max(env[f], sm[f - 1] * 0.55)
    return sm


# ------------------------------------------------------------------ audio: music + sfx
def synth_music(total):
    """Calm minor-key pad with a soft pulse, synthesised (no licensing issues)."""
    n = int(total * SR)
    t = np.arange(n) / SR
    out = np.zeros(n, np.float32)
    chords = [[57, 60, 64], [53, 57, 60], [55, 59, 62], [52, 55, 59]]  # Am F G Em
    bar = 4 * 60 / 76
    for k in range(int(total / bar) + 1):
        s, e = int(k * bar * SR), min(n, int((k + 1) * bar * SR))
        if s >= n:
            break
        tt = t[s:e] - k * bar
        envl = np.minimum(1, tt / 0.8) * np.minimum(1, (bar - tt) / 0.8)
        for m in chords[k % 4]:
            f = 440 * 2 ** ((m - 69) / 12)
            out[s:e] += 0.05 * envl * (np.sin(2 * np.pi * f * tt) + 0.3 * np.sin(2 * np.pi * 2 * f * tt + 0.3))
        fb = 440 * 2 ** ((chords[k % 4][0] - 12 - 69) / 12)
        for beat in range(4):
            bs = beat * bar / 4
            m_ = (tt >= bs) & (tt < bs + 0.35)
            out[s:e][m_] += 0.08 * np.exp(-(tt[m_] - bs) * 9) * np.sin(2 * np.pi * fb * (tt[m_] - bs))
    # light hats
    rng = np.random.default_rng(1)
    step = int(SR * 60 / 76 / 2)
    for p in range(0, n - 2000, step):
        out[p:p + 1500] += 0.012 * rng.standard_normal(1500) * np.exp(-np.arange(1500) / 300)
    return out


def sfx(kind):
    n = int(SR * (0.5 if kind == "whoosh" else 0.25))
    t = np.arange(n) / SR
    rng = np.random.default_rng(len(kind))
    if kind == "whoosh":
        noise = rng.standard_normal(n)
        env = np.sin(np.pi * t / t[-1]) ** 2
        # crude band sweep
        out = np.convolve(noise, np.ones(12) / 12, "same") * env * 0.25
    elif kind == "pop":
        out = 0.35 * np.sin(2 * np.pi * (600 + 900 * np.exp(-t * 30)) * t) * np.exp(-t * 25)
    elif kind == "ding":
        out = 0.22 * (np.sin(2 * np.pi * 1320 * t) + 0.5 * np.sin(2 * np.pi * 1980 * t)) * np.exp(-t * 9)
    elif kind == "thud":
        out = 0.5 * np.sin(2 * np.pi * (90 + 60 * np.exp(-t * 20)) * t) * np.exp(-t * 12)
    else:
        out = np.zeros(n)
    return out.astype(np.float32)


def build_audio(beats, total, vt, path):
    n = int(total * SR)
    voice = vt[:n]
    if len(voice) < n:
        voice = np.pad(voice, (0, n - len(voice)))
    music = synth_music(total)[:n]
    # duck music under the voice
    hop = 1024
    lvl = np.array([np.abs(voice[i:i + hop]).mean() for i in range(0, n, hop)])
    duck = np.repeat(np.where(lvl > 0.01, 0.45, 1.0), hop)[:n]
    k = np.ones(SR // 4) / (SR // 4)
    duck = np.convolve(duck, k, "same")
    mix = voice * 1.0 + music * 0.55 * duck
    for b in beats:
        for kind, key in b.get("sfx", []):
            at = b["start"] + (b["anchors"].get(key, 0.0) if isinstance(key, int) else 0.0)
            s = sfx(kind)
            p = int(at * SR)
            if p + len(s) < n:
                mix[p:p + len(s)] += s
        if b.get("scene_change", True) and b["idx"] > 0 and b.get("whoosh", False):
            s = sfx("whoosh")
            p = int(b["start"] * SR)
            mix[p:p + len(s)] += s[:max(0, n - p)]
    peak = np.max(np.abs(mix)) + 1e-9
    mix = np.clip(mix / peak * 0.89, -1, 1)
    with wave.open(path, "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes((mix * 32767).astype(np.int16).tobytes())


# ------------------------------------------------------------------ rendering
G = {}


def init_worker(beats, env, scale):
    G["beats"], G["env"], G["scale"] = beats, env, scale


def beat_at(t):
    bs = G["beats"]
    lo, hi = 0, len(bs) - 1
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if bs[mid]["start"] <= t:
            lo = mid
        else:
            hi = mid - 1
    return bs[lo]


def render_frame(fi):
    t = fi / FPS
    b = beat_at(t)
    sc = G["scale"]
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, int(gfx.W * sc), int(gfx.H * sc))
    ctx = cairo.Context(surf)
    ctx.scale(sc, sc)
    lvl = float(G["env"][fi]) if fi < len(G["env"]) else 0.0
    scenes.draw(ctx, b, t - b["start"], t, lvl, G["beats"])
    surf.flush()
    return bytes(surf.get_data())


def render_segment(args):
    a, z, path = args
    sc = G["scale"]
    w, h = int(gfx.W * sc), int(gfx.H * sc)
    p = subprocess.Popen(["ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "bgra", "-s", f"{w}x{h}",
                          "-r", str(FPS), "-i", "-", "-c:v", "libx264", "-preset", "medium", "-crf", "19",
                          "-pix_fmt", "yuv420p", path], stdin=subprocess.PIPE)
    for fi in range(a, z):
        p.stdin.write(render_frame(fi))
    p.stdin.close()
    p.wait()
    return path


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--preview", type=float, default=0)
    ap.add_argument("--stills", action="store_true")
    ap.add_argument("--from", dest="t0", type=float, default=0)
    a = ap.parse_args()
    beats, total, vt = build_timeline()
    json.dump([{k: v for k, v in b.items() if k != "words"} | {"n_words": len(b["words"])} for b in beats],
              open(os.path.join(OUT, "timeline.json"), "w"), ensure_ascii=False, indent=1, default=str)
    print(f"beats {len(beats)}, duration {total / 60:.1f} min")
    n_frames = int(total * FPS)
    env = mouth_env(vt, n_frames)
    if a.stills:
        os.makedirs(os.path.join(OUT, "stills"), exist_ok=True)
        init_worker(beats, env, 0.5)
        for b in beats:
            t = b["start"] + min(b["dur"] - 0.05, max(0.8, b["dur"] * 0.7))
            fi = int(t * FPS)
            data = render_frame(fi)
            s = cairo.ImageSurface.create_for_data(bytearray(data), cairo.FORMAT_ARGB32, gfx.W // 2, gfx.H // 2)
            s.write_to_png(os.path.join(OUT, "stills", f"{b['idx']:03d}.png"))
        print("stills done")
        return
    scale = 0.5 if a.preview else 1.0
    f0 = int(a.t0 * FPS)
    f1 = min(n_frames, f0 + int(a.preview * FPS)) if a.preview else n_frames
    workers = max(1, os.cpu_count() or 4)
    chunk = max(FPS * 10, (f1 - f0) // (workers * 3) + 1)
    segs = [(s, min(f1, s + chunk), os.path.join(OUT, f"seg_{s:06d}.mp4")) for s in range(f0, f1, chunk)]
    with mp.Pool(workers, initializer=init_worker, initargs=(beats, env, scale)) as pool:
        for i, pth in enumerate(pool.imap(render_segment, segs)):
            print(f"segment {i + 1}/{len(segs)}", flush=True)
    lst = os.path.join(OUT, "segs.txt")
    open(lst, "w").write("".join(f"file '{p}'\n" for _, _, p in segs))
    wav = os.path.join(OUT, "mix.wav")
    build_audio(beats, total, vt, wav)
    name = "preview.mp4" if a.preview else f"kvartira{SUFFIX}.mp4"
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", lst,
                    "-ss", str(f0 / FPS), "-t", str((f1 - f0) / FPS), "-i", wav,
                    "-map", "0:v", "-map", "1:a", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-af", "loudnorm=I=-14:TP=-1.5:LRA=11", "-shortest", "-movflags", "+faststart",
                    os.path.join(OUT, name)], check=True)
    for _, _, p in segs:
        os.remove(p)
    print("done", os.path.join(OUT, name))


if __name__ == "__main__":
    main()
