#!/usr/bin/env python3
"""Voice any text with the narrator's voice: ESpeech F5 (lively, conversational) + RUAccent stresses,
generated sentence by sentence and re-rolled until Whisper hears the same text.

  python3 say.py "Короче. Я тут посчитал..." out.wav [--shout] [--ref voice/ref_alt.wav]
First run downloads the models (~1.5 GB) and takes a few minutes on CPU; ~10 s of speech per minute of CPU time.
"""
import argparse, difflib, os, re, subprocess, sys
import numpy as np
import soundfile as sf

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "voice"))
SAY_FIX = [(r"\bЦБ\b", "цэ-бэ"), (r"\bРФ\b", "эр-эф"), (r"\bСША\b", "эс-ша-а"), (r"\bВВП\b", "вэ-вэ-пэ")]


def words(s):
    from num2words import num2words
    s = s.lower().replace("ё", "е").replace("%", " процентов ")
    s = re.sub(r"(\d)[ .,](?=\d{3}\b)", r"\1", s)
    s = re.sub(r"\d+", lambda m: " " + num2words(int(m.group()), lang="ru") + " ", s)
    return [w for w in re.sub(r"[^а-яa-z ]", " ", s).split() if w]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("text")
    ap.add_argument("out")
    ap.add_argument("--ref", default=os.path.join(HERE, "voice", "ref.wav"))
    ap.add_argument("--shout", action="store_true", help="louder, faster, a bit higher (for yelling lines)")
    ap.add_argument("--tries", type=int, default=3)
    a = ap.parse_args()
    import f5
    from faster_whisper import WhisperModel
    text = a.text
    for p, r in SAY_FIX:
        text = re.sub(p, r, text)
    v = f5.Voice(a.ref, open(a.ref + ".txt").read())
    wm = WhisperModel("small", device="cpu", compute_type="int8")
    parts, sr = [], 24000
    for snt in [x for x in re.split(r"(?<=[.!?…])\s+", text) if x.strip()]:
        best = (-1, None)
        for k in range(a.tries):
            tmp = f"{a.out}.try{k}.wav"
            v.say(snt.lower(), tmp, speed=1.08 if a.shout else 1.0, nfe=16)
            segs, _ = wm.transcribe(tmp, language="ru")
            r = difflib.SequenceMatcher(a=words(snt), b=words(" ".join(x.text for x in segs))).ratio()
            if r > best[0]:
                best = (r, tmp)
            if r >= 0.86:
                break
        y, sr = sf.read(best[1], dtype="float32")
        parts += [y, np.zeros(int(0.13 * sr), np.float32)]
        print(f"{best[0]:.2f}  {snt}", file=sys.stderr)
        for k in range(a.tries):
            if os.path.exists(f"{a.out}.try{k}.wav"):
                os.remove(f"{a.out}.try{k}.wav")
    raw = a.out + ".raw.wav"
    sf.write(raw, np.concatenate(parts[:-1]), sr)
    af = "loudnorm=I=-16:TP=-1.5"
    if a.shout:
        af = "rubberband=pitch=1.06,volume=4dB,acompressor=threshold=-18dB:ratio=6:attack=5:release=60," + af
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", raw, "-af", af, "-ar", "44100", a.out], check=True)
    os.remove(raw)


if __name__ == "__main__":
    main()
