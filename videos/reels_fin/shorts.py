#!/usr/bin/env python3
"""Cut vertical reels (1080x1920) from the finished 18+ live-voice video.
Layout: hook title on top, the 16:9 frame in the middle over a blurred copy, word-by-word captions below, end call to action.
  TTS=f5 SCRIPT=script_18 python3 reels.py   -> out/reels/reel_N.mp4
"""
import os, re, subprocess
import build

SRC = os.path.join(build.OUT, f"kvartira{build.SUFFIX}_f5.mp4")
DST = os.path.join(build.OUT, "reels")
os.makedirs(DST, exist_ok=True)

# (file name, hook title lines (with *highlight*), list of beat ranges [a, b] inclusive)
REELS = [
    ("short_1_million", ["На миллион", "*НИХУЯ* не купишь?!"], [(1, 5)],
     "НО ПОЧЕМУ ОН ВСЁ РАВНО НУЖЕН — 7 ПРИЧИН В ПОЛНОМ ВИДЕО"),
    ("short_2_iq", ["Безденежье", "отнимает *13 IQ*"], [(41, 44)],
     "ЕЩЁ 6 ПРИЧИН КОПИТЬ МИЛЛИОН — В ПОЛНОМ ВИДЕО"),
    ("short_3_iphone", ["Айфон в кредит", "за *230 000 ₽*"], [(46, 49)],
     "ЧТО ДЕЛАТЬ ВМЕСТО ЭТОГО — В ПОЛНОМ ВИДЕО"),
]


def ass_time(t):
    h, m = int(t // 3600), int(t % 3600 // 60)
    return f"{h}:{m:02d}:{t % 60:05.2f}"


def esc(s):
    return s.replace("{", "(").replace("}", ")")


def title_ass(lines):
    out = []
    for ln in lines:
        out.append(re.sub(r"\*([^*]+)\*", r"{\\c&H1ECCFF&}\1{\\c&HFFFFFF&}", esc(ln).upper()))
    return "\\N".join(out)


def build_reel(name, title, ranges, beats, cta_text="ПОЛНОЕ ВИДЕО — НА КАНАЛЕ"):
    segs, words, t_out = [], [], 0.0
    for a, b in ranges:
        st = beats[a]["start"]
        en = beats[b]["start"] + beats[b]["dur"]
        segs.append((st, en))
        for bt in beats[a:b + 1]:
            for w0, w1, w in bt["words"]:
                words.append((t_out + bt["start"] - st + w0, t_out + bt["start"] - st + w1, w))
        t_out += en - st
    total = t_out
    # captions: chunks of up to 3 words, current word highlighted
    ev = []
    i = 0
    while i < len(words):
        chunk = words[i:i + 2]
        for j, (w0, w1, _) in enumerate(chunk):
            nxt = chunk[j + 1][0] if j + 1 < len(chunk) else (words[i + 2][0] if i + 2 < len(words) else w1 + 0.3)
            txt = " ".join(("{\\c&H1ECCFF&}" + esc(w).upper() + "{\\c&HFFFFFF&}") if k == j else esc(w).upper()
                           for k, (_, _, w) in enumerate(chunk))
            if w0 >= total - 4.0:
                continue
            ev.append(f"Dialogue: 1,{ass_time(w0)},{ass_time(min(nxt, w0 + 2.5, total - 4.0))},Cap,,0,0,0,,{txt}")
        i += 2
    head = f"Dialogue: 2,{ass_time(0)},{ass_time(total)},Title,,0,0,0,,{title_ass(title)}"
    tag = f"Dialogue: 2,{ass_time(0)},{ass_time(total)},Tag,,0,0,0,,ЧЁ ПО БАБКАМ"
    cta = f"Dialogue: 3,{ass_time(max(0, total - 4.0))},{ass_time(total)},Cta,,0,0,0,,{{\\fad(200,0)}}{cta_text}"
    ass = os.path.join(DST, name + ".ass")
    open(ass, "w").write(f"""[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Title,Inter Display Black,92,&H00FFFFFF,&H00FFFFFF,&H00101010,&H80000000,1,0,0,0,100,100,0,0,1,7,4,8,60,60,250,1
Style: Tag,Inter Display ExtraBold,40,&H0060D0FF,&H00FFFFFF,&H00101010,&H80000000,1,0,0,0,100,100,2,0,1,4,0,8,60,60,170,1
Style: Cap,Inter Display Black,88,&H00FFFFFF,&H00FFFFFF,&H00101010,&H90000000,1,0,0,0,100,100,0,0,1,8,4,2,40,40,440,1
Style: Cta,Inter Display Black,50,&H00101010,&H00FFFFFF,&H001ECCFF,&H001ECCFF,1,0,0,0,100,100,0,0,3,18,0,2,60,60,330,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
{head}
{tag}
{cta}
""" + "\n".join(ev) + "\n")
    # video: concat ranges, blurred background, framed foreground, burned subtitles
    parts, fc = [], []
    for k, (st, en) in enumerate(segs):
        parts += ["-ss", f"{st:.3f}", "-t", f"{en - st:.3f}", "-i", SRC]
    n = len(segs)
    fc.append("".join(f"[{k}:v][{k}:a]" for k in range(n)) + f"concat=n={n}:v=1:a=1[v][a]")
    fc.append("[v]split[vb][vf]")
    fc.append("[vb]scale=-2:1920,crop=1080:1920,boxblur=30:3,eq=brightness=-0.25[bg]")
    fc.append("[vf]scale=1200:-2,crop=1080:ih[fg]")
    fc.append("[bg][fg]overlay=0:610[comp]")
    fc.append(f"[comp]ass='{ass}'[out]")
    out = os.path.join(DST, name + ".mp4")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *parts, "-filter_complex", ";".join(fc),
                    "-map", "[out]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "18",
                    "-pix_fmt", "yuv420p", "-r", "30", "-c:a", "aac", "-b:a", "160k", "-movflags", "+faststart", out],
                   check=True)
    print(f"{name}: {total:.1f}s -> {out}", flush=True)


def main():
    beats, total, vt = build.build_timeline()
    name, title, cta = build.script.REEL
    build_reel(name, title, [(0, len(beats) - 1)], beats, cta)


if __name__ == "__main__":
    main()
