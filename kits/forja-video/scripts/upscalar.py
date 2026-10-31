"""
upscalar.py - melhora a resolucao das imagens pequenas ANTES de montar o video.

Por que: o montar.py escala cada imagem pra 2400px no Ken Burns. Imagem de origem
pequena (ex.: gravura do Wikimedia em 339px) vira um borrao esticado. O Real-ESRGAN
(IA, roda na GPU AMD via Vulkan - sem CUDA) reconstroi os detalhes em 4x.

Nao-destrutivo e idempotente:
  - os originais sao movidos pra img/_originais/ (so na 1a vez)
  - a versao melhorada fica em img/ com o MESMO nome -> montar.py funciona sem mudanca
  - rodar de novo pula o que ja foi feito (original ja guardado)

Modelos (Real-ESRGAN):
  - anime  (PADRAO): linhas nitidas, cor solida. Melhor p/ PINTURA/GRAVURA/ILUMINURA/MAPA.
  - geral           : preserva textura fotografica. Melhor p/ FOTO real antiga.

So upscala imagens com largura < LIMIAR (1920). As que ja sao grandes ficam intactas.

Uso:  python upscalar.py [projeto] [--modelo anime|geral]
       python upscalar.py balduino
       python upscalar.py balduino --modelo geral
"""
import sys, os, shutil, subprocess
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent          # .../producao
AQUI = Path(__file__).resolve().parent                 # .../montador
EXE = AQUI / "realesrgan" / "realesrgan-ncnn-vulkan.exe"

LIMIAR = 1920          # so upscala imagens menores que isso (largura)
EXTS = (".jpg", ".jpeg", ".png", ".webp")
MODELOS = {"anime": "realesrgan-x4plus-anime", "geral": "realesrgan-x4plus"}

def args():
    proj, modelo = None, "anime"
    rest = sys.argv[1:]
    if "--modelo" in rest:
        i = rest.index("--modelo")
        modelo = rest[i + 1]
        del rest[i:i + 2]
    if rest:
        proj = rest[0]
    if modelo not in MODELOS:
        sys.exit(f"ERRO: modelo '{modelo}' invalido. Use: anime | geral")
    return proj, modelo

def largura(p):
    """Largura em px sem depender de libs extras (le o cabecalho via ffprobe se houver,
    senao usa System.Drawing via PIL se instalado; fallback: tenta Pillow)."""
    try:
        from PIL import Image
        with Image.open(p) as im:
            return im.width
    except Exception:
        # fallback: ffprobe
        ff = shutil.which("ffprobe")
        if ff:
            out = subprocess.run([ff, "-v", "error", "-select_streams", "v:0",
                                  "-show_entries", "stream=width", "-of", "csv=p=0", str(p)],
                                 capture_output=True, text=True)
            try:
                return int(out.stdout.strip())
            except ValueError:
                pass
    return None

def main():
    if not EXE.exists():
        sys.exit(f"ERRO: Real-ESRGAN nao encontrado em {EXE}")
    proj, modelo = args()
    img = (BASE / proj / "img") if proj else (BASE / "img")
    if not img.is_dir():
        sys.exit(f"ERRO: pasta de imagens nao existe: {img}")
    orig = img / "_originais"
    orig.mkdir(exist_ok=True)

    modelo_nome = MODELOS[modelo]
    feitos, pulados = 0, 0
    for p in sorted(img.iterdir()):
        if p.suffix.lower() not in EXTS or p.is_dir():
            continue
        if (orig / p.name).exists():        # ja upscalado numa rodada anterior
            pulados += 1
            continue
        w = largura(p)
        if w is None:
            print(f"  ?? {p.name}: nao consegui ler a largura, pulando")
            continue
        if w >= LIMIAR:
            print(f"  ok {p.name}: {w}px ja e grande, mantido")
            continue
        # 1) guarda o original
        shutil.move(str(p), str(orig / p.name))
        src = orig / p.name
        # 2) upscala 4x -> mesmo nome em img/ (sempre .png p/ nao perder qualidade)
        saida = p.with_suffix(".png")
        print(f"  >> {p.name}: {w}px -> upscalando 4x ({modelo})...", flush=True)
        r = subprocess.run([str(EXE), "-i", str(src), "-o", str(saida),
                            "-s", "4", "-n", modelo_nome],
                           capture_output=True, text=True)
        if r.returncode != 0 or not saida.exists():
            shutil.move(str(src), str(p))   # desfaz: devolve o original
            print(f"     FALHOU, original restaurado. {r.stderr.strip()[:120]}")
            continue
        feitos += 1
    print(f"\nPRONTO -> {feitos} upscaladas, {pulados} ja feitas antes. "
          f"Originais em {orig.relative_to(BASE)}")

if __name__ == "__main__":
    main()
