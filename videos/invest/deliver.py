"""Split the master into parts at chapter boundaries, each HEVC-encoded to fit under ~28 MB (two-pass)."""
import json, os, subprocess, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(ROOT, "out")
MASTER = os.path.join(OUT, "invest_master.mp4")
LIMIT_MB = 28.0
FULL = len(sys.argv) > 1 and sys.argv[1] == "full"
N = 1 if FULL else (int(sys.argv[1]) if len(sys.argv) > 1 else 4)


def dur(p):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p]))


tl = json.load(open(os.path.join(OUT, "timeline.json")))
total = dur(MASTER)
chap = [b["start"] for b in tl if b["scene"] == "chapter"]
# pick chapter starts closest to equal splits
cuts = [0.0]
for k in range(1, N):
    want = total * k / N
    cuts.append(min(chap, key=lambda c: abs(c - want)))
cuts = sorted(set(cuts)) + [total]
for i in range(len(cuts) - 1):
    a, b = cuts[i], cuts[i + 1]
    d = b - a
    kbps = int(LIMIT_MB * 8192 / d - (96 if FULL else 128))
    out = os.path.join(OUT, "invest_full.mp4" if FULL else f"invest_part{i + 1}.mp4")
    common = ["-ss", f"{a:.3f}", "-t", f"{d:.3f}", "-i", MASTER, "-c:v", "libx265", "-preset", "slow", "-b:v", f"{kbps}k",
              "-pix_fmt", "yuv420p", "-tag:v", "hvc1"]
    log = os.path.join(OUT, f"x265_{i}")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + common + ["-x265-params", f"pass=1:stats={log}.log:log-level=error",
                    "-an", "-f", "null", "-"], check=True)
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error"] + common + ["-x265-params", f"pass=2:stats={log}.log:log-level=error",
                    "-c:a", "aac", "-b:a", "96k" if FULL else "128k", "-movflags", "+faststart", out], check=True)
    print(out, f"{a / 60:.2f}-{b / 60:.2f} min", f"{os.path.getsize(out) / 1e6:.1f} MB", f"{kbps} kbps", flush=True)
