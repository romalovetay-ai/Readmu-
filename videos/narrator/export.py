#!/usr/bin/env python3
"""Export the narrator as transparent PNG sprites and preview sheets.

  python3 export.py                 -> sprites/<pose>.png (neutral-ish emotion per pose), sheet_poses.png, sheet_emotions.png
  python3 export.py --pose point --emo wow --height 1600 --out me.png   -> one custom sprite
"""
import argparse, os, cairo
import narrator as N

HERE = os.path.dirname(os.path.abspath(__file__))
POSES = {"idle": "smirk", "think": "doubt", "cross": "neutral", "explain": "smirk", "shrug": "sad", "point": "wow",
         "facepalm": "sad"}
EMOS = list(N.EMO.keys())


def sprite(pose, emo, height=1400, level=0.0, look=0.0, path=None):
    """Bust from the bottom edge; extra room on the sides for arms."""
    sc = height / 1150
    w = int(1300 * sc)
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, w, height)
    c = cairo.Context(s)
    N.draw(c, w / 2, height + 40 * sc, sc, {"pose": pose, "emo": emo, "t": 1.0, "level": level, "look": look,
                                            "blink": 0.0})
    if path:
        s.write_to_png(path)
    return s


def sheet(items, cols, cell_w, cell_h, path, label=True):
    rows = (len(items) + cols - 1) // cols
    s = cairo.ImageSurface(cairo.FORMAT_ARGB32, cols * cell_w, rows * cell_h)
    c = cairo.Context(s)
    c.set_source_rgb(0.22, 0.04, 0.06)
    c.paint()
    for i, (pose, emo, lv) in enumerate(items):
        x, y = (i % cols) * cell_w, (i // cols) * cell_h
        sp = sprite(pose, emo, int(cell_h * 0.88), lv)
        c.set_source_surface(sp, x + (cell_w - sp.get_width()) / 2, y + cell_h - sp.get_height())
        c.paint()
        if label:
            c.select_font_face("Inter Display ExtraBold")
            c.set_font_size(cell_h * 0.06)
            c.set_source_rgb(1, 0.82, 0.25)
            c.move_to(x + 16, y + cell_h * 0.08)
            c.show_text(f"{pose} · {emo}")
    s.write_to_png(path)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--pose")
    ap.add_argument("--emo", default="neutral")
    ap.add_argument("--height", type=int, default=1400)
    ap.add_argument("--level", type=float, default=0.0, help="mouth opening 0..1")
    ap.add_argument("--out")
    a = ap.parse_args()
    if a.pose:
        sprite(a.pose, a.emo, a.height, a.level, path=a.out or f"{a.pose}_{a.emo}.png")
        return
    os.makedirs(os.path.join(HERE, "sprites"), exist_ok=True)
    for pose, emo in POSES.items():
        sprite(pose, emo, 1400, path=os.path.join(HERE, "sprites", f"{pose}.png"))
    sheet([(p, e, 0.0) for p, e in POSES.items()], 4, 600, 560, os.path.join(HERE, "sheet_poses.png"))
    sheet([("idle", e, 0.6 if e == "angry" else 0.0) for e in EMOS], 4, 480, 480, os.path.join(HERE, "sheet_emotions.png"))
    print("exported sprites/ and sheets")


if __name__ == "__main__":
    main()
