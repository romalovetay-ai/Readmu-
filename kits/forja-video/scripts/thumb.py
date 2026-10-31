"""
thumb.py - gera a THUMBNAIL (1280x720) de um episódio no layout do canal "O Cronista":
  [ marca + ícone | TÍTULO grande | tagline âmbar ]  +  retrato do personagem à direita.

Lê do storyboard-<proj>.json (campos opcionais):
  "thumb_img":    slug da imagem do personagem (default: 1ª cena)
  "thumb_titulo": título grande (default: "nome" ou "subtitulo")  ex.: "NIKOLA TESLA"
  "thumb_sub":    linha âmbar (default: "Glória e Ruína")
Usa o ícone do canal em identidade/ (ver README).

Uso:  python thumb.py            (Alexandre/legado)
      python thumb.py tesla
"""
import json, subprocess, sys, shutil, os
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent      # raiz do kit
PROJ = sys.argv[1] if len(sys.argv) > 1 else None
ROOT = BASE / PROJ if PROJ else BASE
IMG = ROOT / "img"
TMP = ROOT / "_tmp_thumb"
_sb = f"storyboard-{PROJ}.json" if PROJ else "storyboard.json"
SB = json.loads((Path(__file__).parent / _sb).read_text(encoding="utf-8"))
def _achar_icone():
    """Icone do canal: prefere identidade/icone.jpg, senao a 1a imagem da pasta."""
    d = BASE / "identidade"
    pref = d / "icone.jpg"
    if pref.exists():
        return pref
    imgs = [p for p in sorted(d.glob("*")) if d.is_dir()
            and p.suffix.lower() in (".jpg", ".jpeg", ".png")]
    # sem icone.jpg, prefere um arquivo com "icon" no nome a pegar o 1o alfabetico
    return next((p for p in imgs if "icon" in p.stem.lower()), imgs[0] if imgs else None)


ICON = _achar_icone()

W, H = 1280, 720
AMBER = "#E8B24C"

def achar(exe):
    p = shutil.which(exe)
    if p:
        return p
    cands = [Path(os.path.expandvars(rf"%LOCALAPPDATA%\Microsoft\WinGet\Links\{exe}.exe"))]
    pkgs = Path(os.path.expandvars(r"%LOCALAPPDATA%\Microsoft\WinGet\Packages"))
    if pkgs.exists():
        cands += list(pkgs.glob(f"Gyan.FFmpeg*/**/{exe}.exe"))
    for c in cands:
        if c and Path(c).exists():
            return str(c)
    sys.exit(f"ERRO: {exe} nao encontrado.")
FFMPEG = achar("ffmpeg")

def run(args, cwd=None):
    r = subprocess.run(args, capture_output=True, text=True, cwd=cwd)
    if r.returncode != 0:
        print("--- ffmpeg falhou ---"); print(" ".join(str(a) for a in args)); print(r.stderr[-1500:])
        sys.exit(1)
    return r

def achar_imagem(slug):
    fs = sorted(IMG.glob(slug + ".*"))
    return fs[0] if fs else None

def quebrar_titulo(t):
    """1-2 linhas equilibradas; fontsize estimado p/ caber em ~600px de largura."""
    pal = t.split()
    if len(pal) <= 1:
        linhas = pal or [t]
    else:
        meio = (len(pal) + 1) // 2
        linhas = [" ".join(pal[:meio]), " ".join(pal[meio:])]
    maxc = max(len(l) for l in linhas)
    fs = int(min(132, 600 / (maxc * 0.55)))   # Arial Bold ~0.55*fs por caractere
    return linhas, max(fs, 40)

def main():
    titulo = SB.get("thumb_titulo") or SB.get("nome") or SB.get("subtitulo", "").upper()
    sub = SB.get("thumb_sub", "Glória e Ruína")
    slug = SB.get("thumb_img") or (SB["cenas"][0]["slug"] if SB.get("cenas") else None)
    fig = achar_imagem(slug) if slug else None
    if not fig:
        sys.exit(f"imagem do personagem nao encontrada (thumb_img/{slug}).")
    if ICON is None:
        sys.exit("icone do canal nao encontrado: ponha o seu em identidade/icone.jpg "
                 "(a pasta identidade/ nao vai no repo - e a marca do seu canal).")

    TMP.mkdir(exist_ok=True)
    shutil.copy(Path(os.path.expandvars(r"%WINDIR%\Fonts")) / "arialbd.ttf", TMP / "arialbd.ttf")
    linhas, fs = quebrar_titulo(titulo)
    (TMP / "marca.txt").write_text("O CRONISTA", encoding="utf-8")
    (TMP / "sub.txt").write_text(sub, encoding="utf-8")
    for i, l in enumerate(linhas):
        (TMP / f"t{i}.txt").write_text(l, encoding="utf-8")

    # bloco de título centralizado verticalmente em ~y=360 na coluna esquerda
    gap = int(fs * 0.10)
    alt = len(linhas) * fs + (len(linhas) - 1) * gap
    top = int(360 - alt / 2)
    dt = [f"drawtext=fontfile=arialbd.ttf:textfile=marca.txt:fontcolor={AMBER}:fontsize=34:x=176:y=66"]
    y = top
    for i in range(len(linhas)):
        dt.append(f"drawtext=fontfile=arialbd.ttf:textfile=t{i}.txt:fontcolor=white:fontsize={fs}:"
                  f"borderw=4:bordercolor=black:x=60:y={y}")
        y += fs + gap
    dt.append(f"drawtext=fontfile=arialbd.ttf:textfile=sub.txt:fontcolor={AMBER}:fontsize=52:"
              f"borderw=3:bordercolor=black:x=64:y={y + 14}")
    draws = ",".join(dt)

    saida = ROOT / f"thumb-{PROJ}.png" if PROJ else ROOT / "thumb.png"
    fc = (f"[1:v]scale=620:720:force_original_aspect_ratio=increase,crop=620:720,"
          f"eq=contrast=1.12:saturation=0.92,colorbalance=bs=0.04:rh=0.04[fig];"
          f"[2:v]scale=120:120[ico];"
          f"[0:v][fig]overlay=660:0[a];"
          f"[a]drawbox=x=652:y=0:w=8:h=720:color={AMBER}@0.95:t=fill[b];"
          f"[b][ico]overlay=46:40[c];"
          f"[c]{draws}[out]")
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
         "-f", "lavfi", "-i", f"color=#0E0F16:s={W}x{H}",
         "-i", str(fig), "-i", str(ICON),
         "-filter_complex", fc, "-map", "[out]", "-frames:v", "1", "-update", "1", str(saida)],
        cwd=str(TMP))
    shutil.rmtree(TMP, ignore_errors=True)
    print(f"PRONTO -> {saida.name}  ({W}x{H})  | titulo: {' / '.join(linhas)} (fs={fs}) | fig: {fig.name}")

if __name__ == "__main__":
    main()
