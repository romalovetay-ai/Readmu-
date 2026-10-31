"""
narrar.py - gera NARRACAO (mp3) + LEGENDA (srt) a partir de um texto, via edge-tts.

- Voz neural local (grátis): pt-BR-AntonioNeural, levemente mais lenta/grave (drama).
- A legenda sai do PROPRIO TTS (SentenceBoundary: offset+duration+texto) — alinhamento
  perfeito, sem Whisper. Frases longas são quebradas em ~2 partes (tempo proporcional).
- Conforme o tema edicao-video-faceless: edge-tts só tem rate/pitch/volume (sem SSML).

Uso:  python narrar.py <texto.txt> <saida.mp3> [saida.srt]
"""
import asyncio, sys, re
from pathlib import Path
import edge_tts

VOICE = "pt-BR-AntonioNeural"
RATE  = "-6%"     # um tico mais lento = mais dramático (sem arrastar)
PITCH = "-2Hz"    # levemente mais grave
MAX_CHARS = 84    # acima disso, quebra a frase em partes (cada parte ~2 linhas no burn)

def _fmt(t):
    if t < 0: t = 0
    h = int(t//3600); t -= h*3600
    m = int(t//60); t -= m*60
    s = int(t); ms = int(round((t-s)*1000))
    return f"{h:02d}:{m:02d}:{s:02d},{ms:03d}"

def _split_longa(ini, fim, texto):
    """Quebra uma frase longa em partes <= MAX_CHARS, tempo proporcional ao nº de chars."""
    if len(texto) <= MAX_CHARS:
        return [(ini, fim, texto)]
    palavras = texto.split()
    partes, atual = [], ""
    for w in palavras:
        if atual and len(atual) + 1 + len(w) > MAX_CHARS:
            partes.append(atual); atual = w
        else:
            atual = f"{atual} {w}".strip()
    if atual:
        partes.append(atual)
    # distribui o intervalo [ini,fim] proporcional ao tamanho de cada parte
    total = sum(len(p) for p in partes)
    out, t = [], ini
    for p in partes:
        dt = (fim - ini) * (len(p) / total)
        out.append((t, t + dt, p))
        t += dt
    return out

async def _gerar(texto, mp3):
    comm = edge_tts.Communicate(texto, VOICE, rate=RATE, pitch=PITCH)
    bounds = []
    with open(mp3, "wb") as f:
        async for ch in comm.stream():
            if ch["type"] == "audio":
                f.write(ch["data"])
            elif ch["type"] in ("SentenceBoundary", "WordBoundary"):
                bounds.append((ch["offset"] / 1e7, ch["duration"] / 1e7, ch["text"].strip()))
    return bounds

def main():
    if len(sys.argv) < 3:
        sys.exit("Uso: python narrar.py <texto.txt> <saida.mp3> [saida.srt]")
    txt = Path(sys.argv[1]); mp3 = Path(sys.argv[2])
    srt = Path(sys.argv[3]) if len(sys.argv) > 3 else mp3.with_suffix(".srt")
    texto = txt.read_text(encoding="utf-8").strip()
    bounds = asyncio.run(_gerar(texto, mp3))
    cues = []
    for off, dur, t in bounds:
        if t:
            cues.extend(_split_longa(off, off + dur, t))
    out = "\n\n".join(f"{i+1}\n{_fmt(a)} --> {_fmt(z)}\n{t}" for i, (a, z, t) in enumerate(cues))
    srt.write_text(out + "\n", encoding="utf-8")
    dur = cues[-1][1] if cues else 0
    print(f"PRONTO -> {mp3.name} + {srt.name}  |  {len(texto.split())} palavras  |  "
          f"{len(cues)} legendas  |  ~{dur/60:.1f} min")

if __name__ == "__main__":
    main()
