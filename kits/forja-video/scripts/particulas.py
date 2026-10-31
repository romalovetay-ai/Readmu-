"""
particulas.py - gera um overlay de POEIRA/BRASA (motes de luz à deriva) em loop perfeito.
Saida: assets/particulas.mp4 (1920x1080, 10s, fundo PRETO + motes âmbar/branco).
O montar.py sobrepoe via blend 'screen' (o preto vira transparente). Movimento puramente
senoidal -> frame final == frame inicial -> loop sem emenda. Determinístico (seed fixa).
Uso: python particulas.py
"""
import math, shutil, subprocess, os, glob
from pathlib import Path
import random
from PIL import Image, ImageDraw, ImageFilter

BASE = Path(__file__).resolve().parent
OUT = BASE / "assets" / "particulas.mp4"
OUT.parent.mkdir(parents=True, exist_ok=True)
TMP = BASE / "_tmp_part"
if TMP.exists():
    shutil.rmtree(TMP)
TMP.mkdir()

W, H, FPS, DUR = 1920, 1080, 25, 10
N = FPS * DUR
NUM = 160

def achar_ffmpeg():
    import shutil as sh
    p = sh.which("ffmpeg")
    if p:
        return p
    pkgs = Path(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages"))
    hits = list(pkgs.glob("Gyan.FFmpeg*/**/ffmpeg.exe")) if pkgs.exists() else []
    return str(hits[0]) if hits else "ffmpeg"
FFMPEG = achar_ffmpeg()

random.seed(7)
P = []
for i in range(NUM):
    P.append(dict(
        x=random.uniform(0, W), y=random.uniform(0, H),
        r=random.uniform(1.0, 3.2),
        ax=random.uniform(6, 26), ay=random.uniform(10, 40),   # amplitude do bob (px)
        kx=random.choice([1, 1, 2]), ky=random.choice([1, 1, 2]),  # ciclos por loop
        phx=random.uniform(0, 2*math.pi), phy=random.uniform(0, 2*math.pi),
        base=random.uniform(110, 205),     # brilho
        tw=random.uniform(0, 2*math.pi),   # fase do tremular
        warm=random.random() < 0.72,       # 72% âmbar, resto branco-frio
    ))

for f in range(N):
    t = f / N  # 0..1 (periódico)
    img = Image.new("RGB", (W, H), (0, 0, 0))
    dr = ImageDraw.Draw(img)
    for p in P:
        ox = p["ax"] * math.sin(2*math.pi*p["kx"]*t + p["phx"])
        oy = p["ay"] * math.sin(2*math.pi*p["ky"]*t + p["phy"])
        x = (p["x"] + ox) % W
        y = (p["y"] + oy) % H
        tw = 0.55 + 0.45 * math.sin(2*math.pi*t*p["kx"] + p["tw"])
        b = max(0, int(p["base"] * tw))
        col = (b, int(b*0.80), int(b*0.45)) if p["warm"] else (int(b*0.88), int(b*0.92), b)
        r = p["r"]
        dr.ellipse([x-r, y-r, x+r, y+r], fill=col)
    img = img.filter(ImageFilter.GaussianBlur(1.2))
    img.save(TMP / f"f{f:04d}.png")

subprocess.run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-framerate", str(FPS),
                "-i", str(TMP / "f%04d.png"), "-c:v", "libx264", "-preset", "veryfast",
                "-pix_fmt", "yuv420p", "-crf", "20", str(OUT)], check=True)
shutil.rmtree(TMP, ignore_errors=True)
print(f"PRONTO -> {OUT}  ({N} frames, {DUR}s loop)")
