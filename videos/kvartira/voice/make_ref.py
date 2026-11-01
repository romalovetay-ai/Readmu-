"""Build a 12-15 s reference clip for one Common Voice speaker: pick the loudest clean clips, trim silence, join.
  make_ref.py <speaker_dir> <meta.json> <speaker_key> <out.wav>   -> also writes <out>.txt with the transcript"""
import json, sys, numpy as np, librosa, soundfile as sf
d, meta, key, out = sys.argv[1:5]
clips = json.load(open(meta))[key]
cand = []
for name, s, _ in clips:
    y, sr = librosa.load(f"{d}/{name}", sr=24000)
    yt, _ = librosa.effects.trim(y, top_db=32)
    if 2.5 < len(yt) / sr < 5.0:
        cand.append((float(np.sqrt(np.mean(yt ** 2))), yt, s))
cand.sort(key=lambda c: -c[0])
pieces, texts, total = [], [], 0.0
for _, yt, s in cand:
    if total > 6.5:
        break
    pieces += [yt / (np.max(np.abs(yt)) + 1e-6) * 0.8, np.zeros(int(0.35 * 24000), np.float32)]
    texts.append(s.strip())
    total += len(yt) / 24000 + 0.35
sf.write(out, np.concatenate(pieces).astype(np.float32), 24000)
open(out + ".txt", "w").write(" ".join(texts))
print(key, round(total, 1), "s:", " ".join(texts)[:160])
