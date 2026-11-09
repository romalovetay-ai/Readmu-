"""Quick visual check: one frame per beat (or chosen beats) with fake or real timings -> out/stills/NNN.jpg"""
import os, sys, json, re
import cv2
import script, scenes

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "out", "stills")
os.makedirs(OUT, exist_ok=True)


def fake_beats():
    beats, t = [], 0.0
    for i, b in enumerate(script.BEATS):
        b = dict(b)
        n = len(re.findall(r"\{\d+\}", b.get("say", "")))
        dur = b.get("dur") or max(4.0, 0.075 * len(b.get("say", "")))
        b.update(idx=i, start=t, dur=dur, words=[], anchors={k: dur * k / (n + 1.2) for k in range(1, n + 1)})
        beats.append(b)
        t += dur
    return beats


if __name__ == "__main__":
    beats = fake_beats()
    sel = [int(x) for x in sys.argv[1].split(",")] if len(sys.argv) > 1 else range(len(beats))
    frac = float(sys.argv[2]) if len(sys.argv) > 2 else 0.8
    for i in sel:
        b = beats[i]
        tl = b["dur"] * frac
        img = scenes.render(b, tl, b["start"] + tl, 0.4, beats)
        cv2.imwrite(os.path.join(OUT, f"{i:03d}.jpg"), cv2.resize(img, (960, 540), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_JPEG_QUALITY, 88])
        print(i, b["scene"], flush=True)
