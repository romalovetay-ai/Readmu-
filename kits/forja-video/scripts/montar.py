"""
montar.py - monta o video completo a partir de: narracao (mp3) + storyboard + imagens.

Pipeline:
  1) le a duracao da narracao (ffprobe)
  2) distribui a duracao entre as cenas na proporcao dos "peso" do storyboard
  3) gera um clipe por cena (imagem + Ken Burns zoom-in) via ffmpeg
  4) concatena os clipes (video mudo)
  5) cola a narracao por cima; se existir producao/musica.mp3, mistura como trilha baixinha
  6) saida = producao/<saida do storyboard>

Reutilizavel: pra outro video, troque a narracao, o storyboard e as imagens.
Uso:  python montar.py
"""
import json, subprocess, sys, shutil, os, re
from pathlib import Path

BASE = Path(__file__).resolve().parent.parent       # .../producao
# projeto opcional: `python montar.py tesla` -> usa producao/tesla/ e storyboard-tesla.json
PROJ = sys.argv[1] if len(sys.argv) > 1 else None
ROOT = BASE / PROJ if PROJ else BASE
IMG = ROOT / "img"
TMP = ROOT / "_tmp_clipes"
_sb = f"storyboard-{PROJ}.json" if PROJ else "storyboard.json"
SB = json.loads((Path(__file__).parent / _sb).read_text(encoding="utf-8"))

W, H, FPS = 1920, 1080, 25

# Overlay de POEIRA/BRASA (motes de luz) sobre todas as cenas — look "tela viva" que os
# canais dark usam (lição do teardown de concorrente). Gerar com particulas.py. Aplicado
# num passe final via blend 'screen' (preto = transparente). Desliga com "particulas": false.
PARTICULAS = Path(__file__).parent / "assets" / "particulas.mp4"

# Grade de cor (look dark/épico) — aplicada a cada CENA (não à intro/card).
# Valores = ponto de partida (ver tema edicao-video-faceless/cor-e-look); calibrar no olho.
# eq: +contraste, leve dessaturação, sombras um tico mais densas (gamma<1).
# colorbalance: sombras frias (teal) + altas quentes (laranja). vignette: foco sutil.
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

def achar_fonte():
    for f in ("georgiab.ttf", "timesbd.ttf", "arialbd.ttf", "seguisb.ttf", "georgia.ttf"):
        p = Path(os.path.expandvars(r"%WINDIR%\Fonts")) / f
        if p.exists():
            return str(p)   # caminho cru; o card copia a fonte e usa nome relativo
    return None
FONTE = achar_fonte()

def run(args, cwd=None):
    r = subprocess.run(args, capture_output=True, text=True, cwd=cwd)
    if r.returncode != 0:
        print("--- ffmpeg falhou ---")
        print(" ".join(str(a) for a in args))
        print(r.stderr[-1500:])
        sys.exit(1)
    return r

def loudnorm_linear(audio_inputs, apre):
    """loudnorm de 2 passos: mede o áudio (pass 1) e devolve a string loudnorm com
    measured_* + linear=true. Ganho LINEAR preserva a dinâmica (silêncio dramático,
    stinger) — o single-pass dinâmico bombeia os trechos quietos e MATA o silêncio.
    Cai pro loudnorm dinâmico se a medição falhar."""
    LN = "loudnorm=I=-14:TP=-1:LRA=11"
    meas = f"{apre};[amx]{LN}:print_format=json"
    r = subprocess.run([FFMPEG, "-hide_banner"] + audio_inputs +
                       ["-filter_complex", meas, "-vn", "-f", "null", "-"],
                       capture_output=True, text=True)
    try:
        s = r.stderr
        d = json.loads(s[s.rfind("{"):s.rfind("}") + 1])
        return (f"{LN}:measured_I={d['input_i']}:measured_TP={d['input_tp']}:"
                f"measured_LRA={d['input_lra']}:measured_thresh={d['input_thresh']}:"
                f"offset={d['target_offset']}:linear=true")
    except Exception as e:
        print(f"  (loudnorm 2-pass falhou: {e} -> dinâmico)")
        return LN

def achar_imagem(slug):
    fs = sorted(IMG.glob(slug + ".*"))
    return fs[0] if fs else None

def achar_video(nome):
    """Resolve um b-roll de video por nome: tenta broll/<nome>, <root>/<nome> ou caminho absoluto."""
    if not nome:
        return None
    for c in (Path(nome), ROOT / "broll" / nome, ROOT / nome):
        if c.exists():
            return c
    return None

def deslocar_srt(src, offset_s, dst):
    """Desloca todos os timestamps de um .srt por offset_s segundos (casar com a intro)."""
    def shift(m):
        t = int(m[1]) * 3600 + int(m[2]) * 60 + int(m[3]) + int(m[4]) / 1000 + offset_s
        h = int(t // 3600); t -= h * 3600
        mn = int(t // 60); t -= mn * 60
        s = int(t); msec = int(round((t - s) * 1000))
        return f"{h:02d}:{mn:02d}:{s:02d},{msec:03d}"
    txt = Path(src).read_text(encoding="utf-8")
    txt = re.sub(r"(\d{2}):(\d{2}):(\d{2}),(\d{3})", shift, txt)
    Path(dst).write_text(txt, encoding="utf-8")

def fazer_card_titulo(titulo, subtitulo, segundos=4):
    """Card de abertura (fundo escuro + titulo + subtitulo) em passes isolados:
    cada drawtext sozinho em -vf, sem virgula -> sem ambiguidade no filtergraph."""
    # copia a fonte pra TMP e usa nome RELATIVO no filtergraph (evita o ':' do drive,
    # que o parser do ffmpeg recusa mesmo com aspas/escape). cwd=TMP nas chamadas.
    fonte_tmp = TMP / "titlefont.ttf"
    shutil.copy(FONTE, fonte_tmp)
    cwd = str(TMP)
    bg = TMP / "card_bg.mp4"
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi",
         "-i", f"color=c=0x0A0A0A:s={W}x{H}:r={FPS}:d={segundos}",
         "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(bg)], cwd=cwd)
    p1 = TMP / "card_1.mp4"
    dt1 = (f"drawtext=fontfile=titlefont.ttf:text={titulo}:fontcolor=white:fontsize=112:"
           f"x=(w-text_w)/2:y=(h-text_h)/2-50:shadowcolor=black:shadowx=4:shadowy=4")
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", str(bg),
         "-vf", dt1, "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(p1)], cwd=cwd)
    card = TMP / "card.mp4"
    st = subtitulo.replace(",", "")   # sem virgula no card
    dt2 = (f"drawtext=fontfile=titlefont.ttf:text={st}:fontcolor=0xC8A24B:fontsize=54:"
           f"x=(w-text_w)/2:y=(h-text_h)/2+75:shadowcolor=black:shadowx=3:shadowy=3")
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", str(p1),
         "-vf", dt2, "-c:v", "libx264", "-preset", "veryfast", "-pix_fmt", "yuv420p", str(card)], cwd=cwd)
    return card

INTRO_PROJ = BASE.parent / "animacao" / "tesla-intro"   # projeto Remotion da intro animada

def achar_remotion():
    b = INTRO_PROJ / "node_modules" / ".bin" / ("remotion.cmd" if os.name == "nt" else "remotion")
    return str(b) if b.exists() else None

def fazer_intro_remotion(canal, nome, tagline):
    """Renderiza a intro ANIMADA (Remotion, headless) com os textos do personagem e
    re-encoda pra casar com as cenas (25fps, libx264, sem audio). Retorna o clipe ou None."""
    rem = achar_remotion()
    if not rem:
        return None
    props = {"canal": canal, "nome": nome, "tagline": tagline}
    pjson = TMP / "intro_props.json"
    pjson.write_text(json.dumps(props, ensure_ascii=False), encoding="utf-8")
    raw = TMP / "intro_raw.mp4"
    pre = ["cmd", "/c"] if os.name == "nt" else []
    run(pre + [rem, "render", "Intro", str(raw), f"--props={pjson}"], cwd=str(INTRO_PROJ))
    intro = TMP / "intro.mp4"
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", str(raw),
         "-r", str(FPS), "-c:v", "libx264", "-preset", "veryfast",
         "-pix_fmt", "yuv420p", "-an", str(intro)])
    return intro

def aplicar_particulas(saida):
    """Passe final: sobrepoe o overlay de poeira/brasa (blend screen) em todo o video.
    Re-encoda so o video (audio copiado). Gated por particulas.mp4 existir + SB."""
    if not (PARTICULAS.exists() and SB.get("particulas", True)):
        return
    op = SB.get("particulas_opacidade", 0.7)
    tmp = saida.with_name("_part_" + saida.name)
    # BLEND em RGB (gbrp): screen nos planos de croma YUV gera cast roxo — converter p/ RGB,
    # blendar, e voltar p/ yuv420p.
    vf = (f"[1:v]scale={W}:{H}:force_original_aspect_ratio=increase,crop={W}:{H},"
          f"fps={FPS},format=gbrp[p];[0:v]format=gbrp[b];"
          f"[b][p]blend=all_mode=screen:all_opacity={op},format=yuv420p[v]")
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", str(saida),
         "-stream_loop", "-1", "-i", str(PARTICULAS), "-filter_complex", vf,
         "-map", "[v]", "-map", "0:a", "-c:v", "libx264", "-preset", "veryfast",
         "-crf", "19", "-c:a", "copy", "-shortest", str(tmp)])
    tmp.replace(saida)
    print(f"  partículas: overlay poeira/brasa (opacidade {op})")

def main():
    narr = ROOT / SB["narracao"]
    if not narr.exists():
        sys.exit(f"narracao nao encontrada: {narr}")
    dur = float(run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                     "-of", "default=noprint_wrappers=1:nokey=1", str(narr)]).stdout.strip())
    print(f"narracao: {dur:.1f}s")

    cenas = SB["cenas"]
    total_peso = sum(c["peso"] for c in cenas)
    titulo = SB.get("titulo", "")
    subtitulo = SB.get("subtitulo", "")
    if titulo and not FONTE:
        print("aviso: nenhuma fonte encontrada em Windows\\Fonts -> card de titulo desativado")

    # fallback: 1a imagem disponivel, pra cenas cuja imagem nao baixou
    primeira = next((achar_imagem(c["slug"]) for c in cenas if achar_imagem(c["slug"])), None)
    if not primeira:
        sys.exit("Nenhuma imagem em img/. Rode baixar.py primeiro.")

    TMP.mkdir(exist_ok=True)

    # normaliza qualquer imagem (gif/pdf/svg/tif) para um PNG estatico limpo (cache por arquivo)
    norm_cache = {}
    def normalizar(img):
        chave = str(img)
        if chave in norm_cache:
            return norm_cache[chave]
        out = TMP / ("norm_" + img.stem + ".png")
        run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-i", str(img),
             "-frames:v", "1", str(out)])
        norm_cache[chave] = out
        return out

    lista = TMP / "lista.txt"
    linhas = []
    for i, c in enumerate(cenas):
        cdur = round(dur * c["peso"] / total_peso, 3)
        frames = max(int(cdur * FPS), 1)
        clipe = TMP / f"c{i:02d}.mp4"
        vid = achar_video(c.get("video"))
        if vid:
            # cena de B-ROLL em VIDEO: cobre 16:9 (crop), em loop ate a duracao da cena, sem audio.
            run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error",
                 "-stream_loop", "-1", "-i", str(vid), "-t", f"{cdur}",
                 "-vf", f"scale={W}:{H}:force_original_aspect_ratio=increase,"
                        f"crop={W}:{H},fps={FPS},{GRADE},format=yuv420p",
                 "-an", "-c:v", "libx264", "-preset", "veryfast",
                 "-pix_fmt", "yuv420p", str(clipe)])
            rotulo = f"[video] {vid.name}"
        else:
            img = normalizar(achar_imagem(c["slug"]) or primeira)
            inc = round(0.22 / frames, 6)   # zoom ~1.0 -> ~1.22 ao longo da cena
            # PREP (frente E, doc ffmpeg): `normalize` SUAVE unifica exposicao/dominante das
            # fontes dispares do Wikimedia (independence baixo preserva matiz, so corta cast);
            # `deband` mata o banding de JPEG comprimido (gradfun nao serve: e "playback only",
            # some na re-compressao). So no ramo de IMAGEM (em video, normalize por frame piscaria).
            prep = ("normalize=blackpt=0x0A0A0A:whitept=0xEDEDED:independence=0.4,deband,"
                    if SB.get("normalizar", True) else "")
            # NAO corta a imagem: encaixa inteira (decrease) sobre um fundo desfocado da
            # propria imagem (cover+blur); o Ken Burns (zoompan) roda sobre o conjunto em 16:9.
            vf = (f"[0:v]{prep}split=2[bg][fg];"
                  f"[bg]scale=2560:1440:force_original_aspect_ratio=increase,crop=2560:1440,"
                  f"boxblur=22:1,eq=brightness=-0.10,setsar=1[bgb];"
                  f"[fg]scale=2560:1440:force_original_aspect_ratio=decrease,setsar=1[fgs];"
                  f"[bgb][fgs]overlay=(W-w)/2:(H-h)/2,"
                  f"zoompan=z=min(zoom+{inc}\\,1.22):x=iw/2-(iw/zoom/2):y=ih/2-(ih/zoom/2):"
                  f"d={frames}:fps={FPS}:s={W}x{H},{GRADE},format=yuv420p")
            run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-loop", "1",
                 "-framerate", str(FPS), "-i", str(img), "-t", f"{cdur}",
                 "-filter_complex", vf, "-c:v", "libx264", "-preset", "veryfast",
                 "-pix_fmt", "yuv420p", str(clipe)])
            rotulo = img.name
        linhas.append(f"file '{clipe.as_posix()}'")
        print(f"  cena {i:02d} {c.get('slug', '(video)'):<18} {cdur:5.1f}s  ({rotulo})")

    # abertura: prefere a INTRO ANIMADA (Remotion, headless); fallback = card estatico
    card_dur = 0
    canal = SB.get("titulo", "")
    nome = SB.get("nome") or subtitulo.upper()
    tagline = SB.get("tagline", "")
    intro = fazer_intro_remotion(canal, nome, tagline) if canal else None
    if intro:
        linhas.insert(0, f"file '{intro.as_posix()}'")
        card_dur = float(run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                              "-of", "default=noprint_wrappers=1:nokey=1", str(intro)]).stdout.strip())
        print(f"  intro animada (Remotion): {card_dur:.1f}s")
    elif titulo and FONTE:
        card = fazer_card_titulo(titulo, subtitulo, 4)
        linhas.insert(0, f"file '{card.as_posix()}'")
        card_dur = 4
        print(f"  card de titulo (fallback): {card_dur}s no inicio")

    lista.write_text("\n".join(linhas) + "\n", encoding="utf-8")
    mudo = TMP / "video_mudo.mp4"
    run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-f", "concat",
         "-safe", "0", "-i", str(lista), "-c", "copy", str(mudo)])

    saida = ROOT / SB["saida"]
    ms = int(card_dur * 1000)
    pre = f"adelay={ms}:all=1," if ms else ""   # atrasa narração pra começar após a intro
    LN = "loudnorm=I=-14:TP=-1:LRA=11"          # loudness alvo YouTube ~-14

    # LEGENDA (burn-in): se houver .srt ao lado da narração, queima deslocada pela intro.
    srt = narr.with_suffix(".srt")
    vfilt, vmap, vcodec, cwd = "", "0:v", ["-c:v", "copy"], None
    if srt.exists() and SB.get("legenda", True):
        deslocar_srt(srt, card_dur, TMP / "legenda.srt")
        est = ("Fontname=Arial,Fontsize=20,PrimaryColour=&H00FFFFFF,"
               "OutlineColour=&H00000000,BorderStyle=1,Outline=2,Shadow=1,"
               "Alignment=2,MarginV=55")
        vfilt = f";[0:v]subtitles=legenda.srt:force_style='{est}'[v]"
        vmap, vcodec, cwd = "[v]", ["-c:v", "libx264", "-preset", "veryfast", "-crf", "20"], str(TMP)
        print(f"  legenda: burn-in (deslocada {card_dur:.1f}s)")

    mus = sorted(ROOT.glob("musica.*"))
    if mus:
        musica = mus[0]
        # SOM POR ATO (opcional, via storyboard; tempos em segundos RELATIVOS à narração):
        #   "silencio": [a, b]  -> corta a TRILHA a zero nessa janela (ex.: a morte)
        #   "stinger_em": t     -> insere um boom grave sintetizado nesse instante (peripeteia)
        # (o +card_dur alinha com a narração, que começa depois da intro)
        mv = "[2:a]volume=0.5"
        sil = SB.get("silencio")
        if sil:
            a0, b0 = sil[0] + card_dur, sil[1] + card_dur
            mv += f",volume=enable=between(t\\,{a0:.2f}\\,{b0:.2f}):volume=0"
            print(f"  som: silêncio da trilha {a0:.1f}-{b0:.1f}s (morte)")
        mv += "[mv]"
        extra_in, extra_decl, extra_mix, ncount = [], "", "", 2
        stg = SB.get("stinger_em")
        if stg is not None:
            stinger = TMP / "stinger.wav"
            run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error", "-f", "lavfi", "-i",
                 "aevalsrc=0.7*sin(2*PI*55*t)*exp(-2.5*t)+0.3*sin(2*PI*140*t)*exp(-6*t):d=2:s=48000",
                 str(stinger)])
            st_ms = int((stg + card_dur) * 1000)
            extra_in = ["-i", str(stinger)]
            extra_decl = f"[3:a]adelay={st_ms}:all=1,volume=0.7[stg];"
            extra_mix = "[stg]"; ncount = 3
            print(f"  som: stinger em {(stg + card_dur):.1f}s (peripeteia)")
        print(f"trilha ({musica.name}) -> DUCKING + loudnorm LINEAR"
              + (" + silêncio" if sil else "") + (" + stinger" if stg is not None else ""))
        apre = (f"[1:a]{pre}asplit=2[nmix][nkey];{mv};"
                f"[mv][nkey]sidechaincompress=threshold=0.02:ratio=12:attack=20:release=400[mduck];"
                f"{extra_decl}"
                f"[nmix][mduck]{extra_mix}amix=inputs={ncount}:duration=first:dropout_transition=0:normalize=0[amx]")
        ain = (["-i", str(mudo), "-i", str(narr), "-stream_loop", "-1", "-i", str(musica)] + extra_in)
        afc = f"{apre};[amx]{loudnorm_linear(ain, apre)}[a]"
        run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error"] + ain
            + ["-filter_complex", afc + vfilt, "-map", vmap, "-map", "[a]"]
            + vcodec + ["-c:a", "aac", "-b:a", "192k", "-shortest", str(saida)], cwd=cwd)
    else:
        print("sem musica -> narracao + loudnorm LINEAR")
        apre = f"[1:a]{pre}anull[amx]"
        ain = ["-i", str(mudo), "-i", str(narr)]
        afc = f"{apre};[amx]{loudnorm_linear(ain, apre)}[a]"
        run([FFMPEG, "-y", "-hide_banner", "-loglevel", "error"] + ain
            + ["-filter_complex", afc + vfilt, "-map", vmap, "-map", "[a]"]
            + vcodec + ["-c:a", "aac", "-b:a", "192k", "-shortest", str(saida)], cwd=cwd)

    aplicar_particulas(saida)

    fin = float(run([FFPROBE, "-v", "error", "-show_entries", "format=duration",
                     "-of", "default=noprint_wrappers=1:nokey=1", str(saida)]).stdout.strip())
    mb = saida.stat().st_size / (1024 * 1024)
    shutil.rmtree(TMP, ignore_errors=True)
    print(f"\nPRONTO -> {saida.name}  |  {fin/60:.1f} min  |  {mb:.1f} MB")

if __name__ == "__main__":
    main()
