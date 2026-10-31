"""
shorts.py - monta um SHORT vertical 9:16 (1080x1920) a partir de um TRECHO da
narracao do video longo + imagens, reenquadrando pra vertical.

Aplica o que o tema `edicao-video-faceless` fechou sobre Shorts:
  - 9:16 1080x1920 (specs oficiais YouTube); <=3min (aqui miramos <=60s).
  - reframe sem cortar o sujeito: imagem inteira (fit) sobre fundo borrado (cover+blur).
  - legenda no TERCO CENTRAL (safe zone): fora do topo ~20% e da base ~25% (UI do app).
  - grade de cor dark/epico + Ken Burns (reuso do montar.py).
  - loudnorm -14 (mesma cadeia de audio do longo).
  - FUNIL: o Short deve linkar de volta ao longo (Remix>Edit into a Short OU
    "video relacionado" no Studio) - isso e' feito no YouTube, nao aqui.

Uso:  python shorts.py            -> usa producao/ e shorts.json
      python shorts.py tesla      -> usa producao/tesla/ e shorts-tesla.json

shorts-<proj>.json:
  {
    "narracao": "tesla-narracao.mp3",   # mp3 do longo (na pasta do projeto)
    "srt":      "tesla-narracao.srt",   # opcional; recortado e queimado no centro
    "ini": 0.0, "fim": 19.79,            # janela da narracao (segundos)
    "saida": "shorts/tesla-coldopen.mp4",
    "cenas": [ {"slug": "feira-chicago", "peso": 5}, ... ]
  }
"""
import json, subprocess, sys, shutil, os, re
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent       # .../producao
PROJ = sys.argv[1] if len(sys.argv) > 1 else None
ROOT = BASE / PROJ if PROJ else BASE
IMG = ROOT / "img"
TMP = ROOT / "_tmp_shorts"
_sb = f"shorts-{PROJ}.json" if PROJ else "shorts.json"
SB = json.loads((Path(__file__).parent / _sb).read_text(encoding="utf-8"))

W, H, FPS = 1080, 1920, 30      # vertical 9:16, 30fps

# mesma grade dark/epico do montar.py (look consistente entre longo e Short)
GRADE = ("eq=contrast=1.08:saturation=0.90:gamma=0.95,"
         "colorbalance=bs=0.04:gs=0.02:rh=0.05:bh=-0.05,vignette")

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
    sys.exit(f"ERRO: {exe} nao encontrado. Instale com: winget install Gyan.FFmpeg")

FFMPEG = achar("ffmpeg")
FFPROBE = achar("ffprobe")

def run(args, cwd=None):
    r = subprocess.run(args, capture_output=True, text=True, cwd=cwd)
    if r.returncode != 0:
        print("--- ffmpeg falhou ---")
        print(" ".join(str(a) for a in args))
        print(r.stderr[-1800:])
        sys.exit(1)
    return r

def achar_imagem(slug):
    fs = sorted(IMG.glob(slug + ".*"))
    return fs[0] if fs else None

def cortar_cues(src, ini, fim):
    """Le o .srt, recorta para a janela [ini,fim], re-baseia os tempos em 0 e
    retorna [(inicio, fim, texto), ...]. Texto com as linhas juntas num espaco."""
    txt = Path(src).read_text(encoding="utf-8")
    def parse(t):
        h, mn, resto = t.split(":")
        s, ms = resto.split(",")
        return int(h)*3600 + int(mn)*60 + int(s) + int(ms)/1000
    # robusto: acha cada entrada pelo par de timestamps (não depende de linha em branco)
    pat = re.compile(r"(\d{2}:\d{2}:\d{2},\d{3})\s*-->\s*(\d{2}:\d{2}:\d{2},\d{3})\s*\n(.*?)"
                     r"(?=\n\s*\d+\s*\n\d{2}:\d{2}:\d{2}|\Z)", re.S)
    cues = []
    for m in pat.finditer(txt):
        a, z = parse(m[1]), parse(m[2])
        if z <= ini or a >= fim:
            continue
        texto = " ".join(l.strip() for l in m[3].strip().split("\n"))
        cues.append((round(max(a, ini) - ini, 3), round(min(z, fim) - ini, 3), texto.strip()))
    return cues

def quebrar(texto, max_chars=24):
    """Quebra o texto em linhas de ~max_chars (por palavra) pro drawtext."""
    linhas, atual = [], ""
    for p in texto.split():
        if atual and len(atual) + 1 + len(p) > max_chars:
            linhas.append(atual); atual = p
        else:
            atual = f"{atual} {p}".strip()
    if atual:
        linhas.append(atual)
    return "\n".join(linhas)

def clipe_imagem(img, cdur, dst):
    """Reframe vertical: imagem INTEIRA (fit) sobre fundo cover+blur dela mesma,
    com Ken Burns leve, em 1080x1920. Nao corta o sujeito."""
    frames = max(int(cdur * FPS), 1)
    inc = round(0.18 / frames, 6)        # zoom ~1.0 -> ~1.18 (sutil)
    vf = (f"[0:v]split=2[bg][fg];"
          f"[bg]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
          f"boxblur=24:1,eq=brightness=-0.12,setsar=1[bgb];"
          f"[fg]scale={W}:{H}:force_original_aspect_ratio=decrease,setsar=1[fgs];"
          f"[bgb][fgs]overlay=(W-w)/2:(H-h)/2,"
          f"zoompan=z=min(zoom+{inc}\\,1.18):x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):"
          f"d={frames}:fps={FPS}:s={W}x{H},{GRADE},format=yuv420p")
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-loop", "1",
         "-framerate", str(FPS), "-i", str(img), "-t", f"{cdur}",
         "-filter_complex", vf, "-c:v", "libx264", "-preset", "veryfast",
         "-pix_fmt", "yuv420p", str(dst)])

def main():
    narr = ROOT / SB["narracao"]
    if not narr.exists():
        sys.exit(f"narracao nao encontrada: {narr}")
    ini, fim = float(SB["ini"]), float(SB["fim"])
    dur = round(fim - ini, 3)
    if dur <= 0:
        sys.exit("janela invalida: fim <= ini")
    if dur > 180:
        sys.exit("Short > 3min: o YouTube nao classifica como Short.")
    print(f"janela: {ini:.2f}s -> {fim:.2f}s  ({dur:.2f}s)")

    cenas = SB["cenas"]
    total = sum(c["peso"] for c in cenas)
    primeira = next((achar_imagem(c["slug"]) for c in cenas if achar_imagem(c["slug"])), None)
    if not primeira:
        sys.exit("Nenhuma imagem das cenas encontrada em img/.")

    TMP.mkdir(exist_ok=True)
    linhas = []
    for i, c in enumerate(cenas):
        img = achar_imagem(c["slug"]) or primeira
        cdur = round(dur * c["peso"] / total, 3)
        clipe = TMP / f"s{i:02d}.mp4"
        clipe_imagem(img, cdur, clipe)
        linhas.append(f"file '{clipe.as_posix()}'")
        print(f"  cena {i:02d} {c['slug']:<16} {cdur:4.1f}s  ({img.name})")

    lista = TMP / "lista.txt"
    lista.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    mudo = TMP / "mudo.mp4"
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-f", "concat",
         "-safe", "0", "-i", str(lista), "-c", "copy", str(mudo)])

    LN = "loudnorm=I=-14:TP=-1:LRA=11"
    # LEGENDA via DRAWTEXT (nao subtitles/libass): esta build do ffmpeg nao tem fontconfig,
    # entao o libass desenha vazio. drawtext com fontfile RELATIVO (cwd=TMP) e' o caminho
    # que funciona (mesmo truque do card). textfile=cueN.txt evita escape de aspas/virgula.
    # Posicao: terco central-baixo (fora da base ~25% da UI e do topo ~20%).
    vfilt, vmap, vcodec, cwd = "", "0:v", ["-c:v", "copy"], None
    srtname = SB.get("srt")
    if srtname and (ROOT / srtname).exists() and SB.get("legenda", True):
        cues = cortar_cues(ROOT / srtname, ini, fim)
        fdir = Path(os.path.expandvars(r"%WINDIR%\Fonts"))
        for f in ("arialbd.ttf",):
            if (fdir / f).exists():
                shutil.copy(fdir / f, TMP / f)
        partes = []
        for i, (a, z, texto) in enumerate(cues):
            (TMP / f"cue{i}.txt").write_text(quebrar(texto), encoding="utf-8")
            partes.append(
                f"drawtext=fontfile=arialbd.ttf:textfile=cue{i}.txt:fontcolor=white:"
                f"fontsize=54:line_spacing=10:borderw=6:bordercolor=black@0.9:"
                f"x=(w-text_w)/2:y=h*0.66-text_h/2:enable='between(t,{a},{z})'")
        if partes:
            vfilt = f";[0:v]" + ",".join(partes) + "[v]"
            vmap, vcodec, cwd = "[v]", ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20"], str(TMP)
            print(f"  legenda: {len(cues)} blocos via drawtext (terco central)")

    saida = ROOT / SB["saida"]
    saida.parent.mkdir(parents=True, exist_ok=True)
    # AUDIO: narração (fatiada) + trilha com DUCKING + loudnorm. Se não houver musica.*, só narração.
    mus = sorted(ROOT.glob("musica.*"))
    if mus and SB.get("musica", True):
        print(f"  trilha ({mus[0].name}) -> ducking + loudnorm -14")
        afc = (f"[1:a]asplit=2[nmix][nkey];[2:a]volume=0.45[mv];"
               f"[mv][nkey]sidechaincompress=threshold=0.02:ratio=12:attack=20:release=400[mduck];"
               f"[nmix][mduck]amix=inputs=2:duration=first:normalize=0,{LN}[a]")
        run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(mudo), "-ss", f"{ini}", "-t", f"{dur}", "-i", str(narr),
             "-stream_loop", "-1", "-i", str(mus[0]),
             "-filter_complex", afc + vfilt, "-map", vmap, "-map", "[a]"]
            + vcodec + ["-c:a", "aac", "-b:a", "192k", "-shortest", str(saida)], cwd=cwd)
    else:
        afc = f"[1:a]{LN}[a]"
        run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
             "-i", str(mudo), "-ss", f"{ini}", "-t", f"{dur}", "-i", str(narr),
             "-filter_complex", afc + vfilt, "-map", vmap, "-map", "[a]"]
            + vcodec + ["-c:a", "aac", "-b:a", "192k", "-shortest", str(saida)], cwd=cwd)

    info = run([FFPROBE, "-v", "error", "-select_streams", "v:0", "-show_entries",
                "stream=width,height", "-show_entries", "format=duration",
                "-of", "default=noprint_wrappers=1:nokey=1", str(saida)]).stdout.split()
    mb = saida.stat().st_size / (1024*1024)
    shutil.rmtree(TMP, ignore_errors=True)
    print(f"\nPRONTO -> {saida.name}  |  {info[0]}x{info[1]}  |  {float(info[2]):.1f}s  |  {mb:.1f} MB")
    print("Funil: no YouTube, linkar este Short ao video longo (Studio > video relacionado).")

if __name__ == "__main__":
    main()
