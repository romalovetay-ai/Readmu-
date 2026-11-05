"""Find inserted clips (cards over the narrator background) in a video: per-frame difference from the median frame."""
import sys, json, subprocess
import numpy as np
f = sys.argv[1]
W, H, FPS = 320, 180, 5
raw = subprocess.run(["ffmpeg", "-loglevel", "error", "-i", f, "-vf", f"fps={FPS},scale={W}:{H}", "-f", "rawvideo",
                      "-pix_fmt", "rgb24", "-"], capture_output=True, check=True).stdout
fr = np.frombuffer(raw, np.uint8).reshape(-1, H, W, 3).astype(np.int16)
med = np.median(fr[::5], axis=0)
diff = np.abs(fr - med).mean(axis=3)  # n,H,W
mask = diff > 40
score = mask[:, int(H * 0.12):int(H * 0.95), int(W * 0.12):int(W * 0.92)].mean(axis=(1, 2))
on = score > 0.18
segs, i = [], 0
while i < len(on):
    if on[i]:
        j = i
        while j < len(on) and on[j]:
            j += 1
        if (j - i) / FPS >= 0.8:
            mid = (i + j) // 2
            m = mask[i + (j - i) // 4: j - (j - i) // 4].mean(axis=0) > 0.6
            ys, xs = np.nonzero(m)
            if len(xs):
                x0, x1 = np.percentile(xs, [3, 97]); y0, y1 = np.percentile(ys, [3, 97])
                segs.append({"start": round(i / FPS, 2), "end": round(j / FPS, 2),
                             "box": [round(x0 / W, 3), round(y0 / H, 3), round(x1 / W, 3), round(y1 / H, 3)]})
        i = j
    else:
        i += 1
json.dump(segs, open(sys.argv[2], "w"), indent=1)
print(f, len(segs))
