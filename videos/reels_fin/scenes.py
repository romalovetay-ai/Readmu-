"""Scene renderers. draw(ctx, beat, tl, t, level, beats): tl = seconds into the beat, t = absolute seconds."""
import math
import random
import cairo

import gfx
from gfx import W, H, WHITE, RED, GREEN, GOLD, GREY, F_XB, F_BLACK, F_SB, F_MED, clamp, ease, ease_back, text, rgba
import character

COL = {"white": WHITE, "red": RED, "green": GREEN, "gold": GOLD, "grey": GREY}


def at(b, k):
    return 0.0 if k == 0 else b["anchors"].get(k, 0.0)


def age(b, k, tl):
    return tl - at(b, k)


# ------------------------------------------------------------------ shared layers
def draw_char(ctx, b, tl, t, level):
    where = b.get("char", "center")
    if where == "none" or b["scene"] in ("chapter", "disclaimer"):
        return
    x, sc = {"center": (960, 0.62), "right": (1560, 0.54), "left": (360, 0.54)}[where]
    k = ease(tl / 0.35) if b.get("_enter") else 1.0
    base = H + 6 + (1 - k) * 220
    st = character.perform(t, level, b.get("pose", "explain"), b.get("emo", "neutral"), seed=b["idx"])
    if b.get("style") == "shout":
        st["emo"] = "angry" if int(t * 1.5) % 3 else "wow"
    # look towards the content on screen when standing at the side, otherwise at the viewer
    st["look"] = {"center": st["look"] * 0.5, "right": -0.7, "left": 0.7}[where]
    character.draw(ctx, x, base, sc, st)


def draw_pops(ctx, b, tl):
    centre = b.get("char", "center") == "center" and b["scene"] == "talk"
    for i, p in enumerate(b.get("pops", [])):
        k, s, y, size, c = p
        if centre:
            y = (190, 330, 440)[min(i, 2)]
            size = min(size, 150 if i == 0 else 96)
        a = age(b, k, tl)
        if a >= 0:
            x = 960 if b.get("char") in ("center", "none", None) else (720 if b.get("char") == "right" else 1200)
            gfx.pop_text(ctx, s, x, y, size, a, F_BLACK, COL.get(c, WHITE), glow=0.5 if c != "white" else 0.2)


def background(ctx, b, t):
    gfx.bg_calm(ctx, t, 1.0 if b.get("style") == "shout" else 0.0)


# ------------------------------------------------------------------ scenes
def s_talk(ctx, b, tl, t, lv):
    pass


def s_flat(ctx, b, tl, t, lv):
    gfx.icon_flat(ctx, 330, 470, 1.25, tl)
    text(ctx, "1-комн. · " + b.get("area", ""), 560, 420, 56, F_SB, WHITE, clamp(tl / 0.3), "left")
    a = age(b, 2, tl) if 2 in b["anchors"] else tl - 0.5
    if a >= 0:
        gfx.pop_text(ctx, b["price"], 560, 520, 96, a, F_BLACK, WHITE, glow=0.3, align="left")
    if b.get("extra"):
        a1 = age(b, 1, tl)
        if a1 >= 0:
            gfx.pop_text(ctx, b["extra"], 560, 620, 56, a1, F_XB, GOLD, glow=0.4, align="left")


def s_bigeq(ctx, b, tl, t, lv):
    y = 330
    for k, lab, val in b["lines"]:
        a = age(b, k, tl)
        if a >= 0:
            al = clamp(a / 0.25)
            if lab:
                text(ctx, lab, 140, y, 62, F_SB, (0.85, 0.85, 0.9), al, "left")
            if val:
                gfx.pop_text(ctx, val, 140 + (560 if lab else 0), y, 100, a, F_BLACK,
                             GOLD if "=" in val or ">" in val else WHITE, glow=0.4, align="left")
        y += 150


def s_list3(ctx, b, tl, t, lv):
    for i, (k, s) in enumerate(b["items"]):
        a = age(b, k, tl)
        if a >= 0:
            x = 1300
            y = 320 + i * 190
            gfx.card(ctx, x - 380, y - 90, 760, 140, a, fill=(1, 1, 1))
            text(ctx, s, x, y + 5, 70, F_BLACK, (0.08, 0.08, 0.1), clamp(a / 0.25), shadow=False)


def s_chapter(ctx, b, tl, t, lv):
    gfx.flash(ctx, tl, 0.2, WHITE, 0.5)
    k = ease(tl / 0.45)
    ctx.save()
    ctx.translate(W / 2, H / 2)
    ctx.scale(1.25 - 0.25 * k, 1.25 - 0.25 * k)
    size = 120 if len(b["title"]) < 14 else 76
    text(ctx, b["title"], 0, 10, size, F_BLACK, WHITE, k, glow=0.6)
    ctx.restore()
    if tl > 0.35:
        text(ctx, b.get("sub", ""), W / 2, H / 2 + 100, 44, F_SB, GREY, clamp((tl - 0.35) / 0.3))
    # glitch slices
    if tl < 0.3:
        rnd = random.Random(int(tl * 60))
        for _ in range(5):
            yy = rnd.random() * H
            ctx.rectangle(0, yy, W, rnd.random() * 18)
            rgba(ctx, RED, 0.35)
            ctx.fill()


# --- old TV archive art (code-drawn, no third-party footage)
def tv_art(ctx, art, tl, t):
    x, y, w, h = 260, 120, 1400, 840
    if art in ("blocks", "blocks2000"):
        sky = cairo.LinearGradient(0, y, 0, y + h)
        sky.add_color_stop_rgb(0, 0.55, 0.62, 0.7)
        sky.add_color_stop_rgb(1, 0.85, 0.82, 0.75)
        ctx.set_source(sky)
        ctx.rectangle(x, y, w, h)
        ctx.fill()
        pan = tl * 18
        for i, (bx, bw, fl, cols) in enumerate(((300, 360, 9, 6), (700, 300, 12, 5), (1050, 420, 14, 7), (1500, 300, 9, 5))):
            bh = fl * 52
            gfx.panel_building(ctx, bx - pan, y + h - bh - 60, bw, bh, fl, cols, lit=0.15,
                               color=(0.78, 0.76, 0.72) if art == "blocks" else (0.82, 0.7, 0.6), seed=i + 3)
        ctx.rectangle(x, y + h - 60, w, 60)
        rgba(ctx, (0.35, 0.35, 0.33))
        ctx.fill()
        # people in a queue (blocks) or cars (2000)
        for j in range(14):
            px = x + 120 + j * 70 + (tl * 30 if art == "blocks2000" else 0)
            if art == "blocks":
                ctx.arc(px, y + h - 120, 13, 0, 2 * math.pi)
                ctx.rectangle(px - 15, y + h - 106, 30, 50)
                rgba(ctx, (0.15, 0.13, 0.12))
                ctx.fill()
    elif art == "crane":
        ctx.rectangle(x, y, w, h)
        rgba(ctx, (0.62, 0.66, 0.7))
        ctx.fill()
        gfx.panel_building(ctx, 520, 520, 520, 380, 7, 8, lit=0.0, color=(0.72, 0.7, 0.66), seed=8)
        ctx.rectangle(560, 470, 420, 50)
        rgba(ctx, (0.5, 0.5, 0.5))
        ctx.fill()
        sw = math.sin(t * 0.6) * 0.05
        ctx.save()
        ctx.translate(1250, 900)
        rgba(ctx, (0.85, 0.65, 0.1))
        ctx.rectangle(-18, -680, 36, 680)
        ctx.fill()
        ctx.rotate(sw)
        ctx.rectangle(-700, -700, 900, 30)
        ctx.fill()
        ctx.move_to(-520, -670)
        ctx.line_to(-520, -400)
        rgba(ctx, (0.1, 0.1, 0.1))
        ctx.set_line_width(4)
        ctx.stroke()
        ctx.rectangle(-580, -400, 120, 70)
        rgba(ctx, (0.6, 0.6, 0.58))
        ctx.fill()
        ctx.restore()
    elif art == "exchange":
        ctx.rectangle(x, y, w, h)
        rgba(ctx, (0.35, 0.3, 0.2))
        ctx.fill()
        gfx.rrect(ctx, 520, 240, 880, 560, 20)
        rgba(ctx, (0.95, 0.8, 0.2))
        ctx.fill()
        text(ctx, "ОБМЕН ВАЛЮТ", 960, 330, 72, F_BLACK, (0.6, 0.1, 0.1), shadow=False)
        rates = [("USD", "ПОКУПКА 5 960", "ПРОДАЖА 6 020"), ("DM", "ПОКУПКА 3 380", "ПРОДАЖА 3 450")]
        flick = int(t * 3) % 2
        for i, (c, b1, b2) in enumerate(rates):
            yy = 450 + i * 150
            text(ctx, c, 580, yy, 60, F_BLACK, (0.1, 0.1, 0.1), shadow=False, align="left")
            text(ctx, b1 if flick else b1.replace("0", "5", 1), 740, yy, 34, F_XB, (0.15, 0.15, 0.15), shadow=False, align="left")
            text(ctx, b2, 1370, yy, 34, F_XB, (0.15, 0.15, 0.15), shadow=False, align="right")
    elif art == "crash":
        ctx.rectangle(x, y, w, h)
        rgba(ctx, (0.08, 0.1, 0.14))
        ctx.fill()
        for gx in range(x, x + w, 100):
            ctx.rectangle(gx, y, 1, h)
        for gy in range(y, y + h, 100):
            ctx.rectangle(x, gy, w, 1)
        rgba(ctx, (0.3, 0.5, 0.4), 0.3)
        ctx.fill()
        rnd = random.Random(7)
        pts, v = [], 0.25
        for i in range(60):
            v += rnd.uniform(-0.02, 0.035) if i < 30 else rnd.uniform(-0.05, 0.015)
            pts.append((x + 60 + i * 21, y + h - 100 - v * 900))
        n = int(clamp(tl / 2.5) * len(pts))
        if n > 1:
            ctx.move_to(*pts[0])
            for p in pts[1:n]:
                ctx.line_to(*p)
            rgba(ctx, (0.3, 1, 0.5) if n < 32 else RED)
            ctx.set_line_width(5)
            ctx.stroke()


def s_tv(ctx, b, tl, t, lv):
    def inside(c):
        tv_art(c, b.get("art", "blocks"), tl, t)
    gfx.old_tv(ctx, 260, 120, 1400, 840, inside, t)
    if b.get("ruler"):
        a = tl
        if a < 1.6:
            ctx.rectangle(260, 120, 1400, 840)
            rgba(ctx, (0, 0, 0), 0.55 * (1 - clamp((a - 1.1) / 0.5)))
            ctx.fill()
            gfx.timeline_ruler(ctx, b["ruler"], a, cy=540)
    if b.get("kv"):
        for i, (k, lab, val) in enumerate(b["kv"]):
            a = age(b, k, tl)
            if a >= 0:
                y = 330 + i * 170
                gfx.card(ctx, 520, y - 90, 880, 130, a, fill=(0.05, 0.05, 0.06))
                text(ctx, lab, 570, y, 56, F_SB, GREY, clamp(a / 0.25), "left")
                text(ctx, val, 1360, y, 70, F_BLACK, GOLD, clamp(a / 0.25), "right", glow=0.4)
    draw_pops(ctx, b, tl)


def s_cycle(ctx, b, tl, t, lv):
    for i, (k, s) in enumerate(b["steps"]):
        a = age(b, k, tl)
        if a < 0:
            continue
        y = 260 + i * 230
        gfx.pop_text(ctx, s, 640, y, 84, a, F_BLACK, RED if i == 2 else WHITE, glow=0.4 if i == 2 else 0)
        if i < 2 and age(b, b["steps"][i + 1][0], tl) >= 0:
            aa = clamp(age(b, b["steps"][i + 1][0], tl) / 0.3)
            ctx.move_to(640, y + 40)
            ctx.line_to(640, y + 40 + 110 * aa)
            rgba(ctx, WHITE, 0.8)
            ctx.set_line_width(6)
            ctx.stroke()
            if aa >= 1:
                ctx.move_to(615, y + 125)
                ctx.line_to(640, y + 155)
                ctx.line_to(665, y + 125)
                ctx.stroke()


def s_compare(ctx, b, tl, t, lv):
    (l_lab, l_v), (r_lab, r_v) = b["left"], b["right"]
    a2 = age(b, 2, tl) if 2 in b["anchors"] else tl - 1.0
    items = [(l_lab, l_v, (0.85, 0.85, 0.9))]
    if a2 >= 0:
        items.append((r_lab, r_v, GREEN))
    gfx.bars_compare(ctx, 260, 200, 640, items, tl, bw=280, gap=220, ymax=5, fmt=lambda v: f"{v:g}".replace(".", ","))
    text(ctx, b.get("unit", ""), 650, 1000, 40, F_SB, GREY, clamp(tl / 0.3))


def s_rates(ctx, b, tl, t, lv):
    mx = max(v for _, _, v in b["bars"]) * 1.1
    for i, (k, lab, v) in enumerate(b["bars"]):
        a = age(b, k, tl)
        if a < 0:
            continue
        y = 330 + i * 200
        c = GREEN if v < 8 else RED
        gfx.bar(ctx, 160, y, 1000, v / mx, lab, f"{v:g}%".replace(".", ","), a, c, h=48)


def s_strategy(ctx, b, tl, t, lv):
    a = tl
    lab = b.get("label", "СТРАТЕГИЯ")
    gfx.pop_text(ctx, f"{lab} №{b['n']}", W / 2, 420, 110, a, F_BLACK, WHITE, glow=0.4)
    a1 = age(b, 1, tl)
    if a1 >= 0:
        gfx.pop_text(ctx, b["name"], W / 2, 600, 92, a1, F_XB, GOLD, glow=0.5)
    gfx.flash(ctx, tl, 0.15, WHITE, 0.35)


def s_kvt(ctx, b, tl, t, lv):
    rows = b["rows"]
    times = [at(b, k) + 0.05 * i for i, (k, _, _) in enumerate(rows)]
    colors = {}
    if b.get("red_last"):
        colors[len(rows) - 1] = RED
    if b.get("green_last"):
        colors[len(rows) - 1] = GREEN
    if b.get("green_first"):
        colors[0] = GREEN
    if b.get("red_all"):
        colors = {i: RED for i in range(len(rows))}
    y0 = 330 if len(rows) > 2 else 450
    if b.get("title"):
        text(ctx, b["title"], 620, 220, 48, F_SB, GREY, clamp(tl / 0.3))
    gfx.kv_table(ctx, [(r[1], r[2]) for r in rows], 650, y0, times, tl, 80, 1040, b.get("box_last", False), colors)
    draw_pops(ctx, b, tl)


def s_startfinish(ctx, b, tl, t, lv):
    a = clamp(tl / 0.3)
    text(ctx, b["sf_from"], 200, 200, 64, F_XB, WHITE, a, "left")
    a1 = age(b, 1, tl)
    if a1 >= 0:
        text(ctx, b["sf_to"], W - 200, 200, 64, F_XB, RED, clamp(a1 / 0.3), "right", glow=0.4)
        # progress line from start to finish
        k = ease(a1 / 1.4)
        ctx.move_to(200, 300)
        ctx.line_to(200 + (W - 400) * k, 300)
        rgba(ctx, WHITE, 0.8)
        ctx.set_line_width(8)
        ctx.stroke()
        character.draw(ctx, 200 + (W - 400) * k, 1080, 0.5, {"pose": "facepalm" if k > 0.95 else "idle",
                                                           "emo": "sad", "t": t, "level": lv, "look": 0.5})
    a2 = age(b, 2, tl)
    if a2 >= 0:
        gfx.pop_text(ctx, b["big"], W / 2, 480, 170, a2, F_BLACK, GOLD, glow=0.6)


def s_race(ctx, b, tl, t, lv):
    for i, (k, lab, val, frac, c) in enumerate(b["bars"]):
        a = age(b, k, tl)
        if a >= 0:
            gfx.bar(ctx, 140, 400 + i * 260, 1100, frac, lab, val, a, GREEN if c == "green" else RED, h=48)


def s_pie(ctx, b, tl, t, lv):
    cx, cy, r = 640, 540, 300
    k = ease(tl / 1.2) * b["share"]
    ctx.arc(cx, cy, r, 0, 2 * math.pi)
    rgba(ctx, WHITE, 0.12)
    ctx.fill()
    ctx.move_to(cx, cy)
    ctx.arc(cx, cy, r, -math.pi / 2, -math.pi / 2 + 2 * math.pi * k)
    ctx.close_path()
    rgba(ctx, RED, 0.95)
    ctx.fill()
    ctx.arc(cx, cy, r * 0.55, 0, 2 * math.pi)
    rgba(ctx, (0.1, 0.02, 0.03))
    ctx.fill()
    text(ctx, b["label"], cx, cy + 30, 110, F_BLACK, WHITE, clamp(tl / 0.4))
    text(ctx, b.get("top", "ПЛАТЁЖ БАНКУ"), cx, cy - r - 40, 52, F_XB, RED, clamp(tl / 0.4))
    a1 = age(b, b.get("rest_k", 1), tl)
    if a1 >= 0:
        gfx.pop_text(ctx, b["rest"], cx, cy + r + 90, 64, a1, F_XB, GREEN, glow=0.4)


def s_total(ctx, b, tl, t, lv):
    y = 330
    for k, lab, val in b["lines"]:
        a = age(b, k, tl)
        if a >= 0:
            last = lab == "ИТОГО"
            if last:
                ctx.rectangle(160, y - 100, 1000, 4)
                rgba(ctx, WHITE, 0.6)
                ctx.fill()
            text(ctx, lab, 160, y, 56, F_SB, GREY, clamp(a / 0.25), "left")
            gfx.pop_text(ctx, val, 1160, y, 92 if last else 72, a, F_BLACK, RED if last else WHITE,
                         glow=0.6 if last else 0, align="right")
        y += 170


def s_checklist(ctx, b, tl, t, lv):
    for i, (k, s) in enumerate(b["items"]):
        a = age(b, k, tl)
        if a >= 0:
            y = 350 + i * 170
            gfx.card(ctx, 140, y - 85, 1000, 130, a, fill=(0.98, 0.98, 0.97))
            text(ctx, "!", 210, y + 20, 80, F_BLACK, RED, clamp(a / 0.25), shadow=False)
            text(ctx, s, 270, y + 15, 58, F_XB, (0.08, 0.08, 0.1), clamp(a / 0.25), "left", shadow=False)


def s_comment(ctx, b, tl, t, lv):
    a = tl
    x, y, w, h = 140, 320, 1120, 240
    gfx.card(ctx, x, y, w, h, a, fill=(0.1, 0.1, 0.12), border=(0.3, 0.3, 0.35))
    ctx.arc(x + 80, y + 85, 42, 0, 2 * math.pi)
    rgba(ctx, (0.45, 0.35, 0.85), clamp(a / 0.3))
    ctx.fill()
    text(ctx, "@успешный_успех_2007", x + 150, y + 75, 34, F_SB, GREY, clamp(a / 0.3), "left", shadow=False)
    a1 = age(b, 1, tl)
    if a1 >= 0:
        gfx.typed_lines(ctx, [b["comment"]], x + 150, y + 150, 54, a1, F_XB, WHITE, cps=30, align="left")
    draw_pops(ctx, b, tl)


def s_chart(ctx, b, tl, t, lv):
    fmt = {"pct": lambda v: f"{v}%", "pctpm": lambda v: f"{v:+g}%", "mln": lambda v: (f"{v:g} млн".replace(".", ",") if v else "0")}.get(b.get("fmt"), str)
    text(ctx, b.get("title", ""), 700, 140, 46, F_SB, GREY, clamp(tl / 0.3))
    a = age(b, 1, tl) if 1 in b["anchors"] else tl
    gfx.line_chart(ctx, 180, 300, 1060, 520, b["series"], a + 0.3, color=GOLD, fmt=fmt, dur=2.2,
                   marks=tuple(range(len(b["series"]))), ymax=100 if b.get("fmt") == "pct" else None)
    draw_pops(ctx, b, tl)


def s_card(ctx, b, tl, t, lv):
    gfx.source_card(ctx, 720, 520, 1240, b["source"], b["headline"], b["body"], tl, hl_lines=tuple(b.get("hl", ())))


def s_quote(ctx, b, tl, t, lv):
    a = tl
    text(ctx, "“", 700, 360, 260, F_BLACK, GOLD, clamp(a / 0.3), shadow=False)
    for i, ln in enumerate(b["quote"]):
        gfx.pop_text(ctx, ln, 700, 520 + i * 100, 72, a - 0.2 - i * 0.25, F_XB, WHITE)
    a1 = age(b, 2, tl)
    if a1 >= 0:
        text(ctx, "— кому её приписывают?", 700, 800, 44, F_SB, GREY, clamp(a1 / 0.3))


def s_factcheck(ctx, b, tl, t, lv):
    text(ctx, "ФАКТЧЕК", 640, 240, 90, F_BLACK, GOLD, clamp(tl / 0.3), glow=0.5)
    for i, (k, s) in enumerate(b["items"]):
        a = age(b, k, tl)
        if a >= 0:
            y = 420 + i * 160
            ok = i > 0
            ctx.arc(260, y - 20, 44, 0, 2 * math.pi)
            rgba(ctx, GREEN if ok else WHITE, clamp(a / 0.25))
            ctx.fill()
            text(ctx, "✓" if ok else "R", 260, y, 54, F_BLACK, (0.05, 0.05, 0.05), clamp(a / 0.25), shadow=False)
            text(ctx, s, 340, y, 60, F_XB, WHITE, clamp(a / 0.25), "left")


def sub_icon(ctx, kind, cx, cy, a):
    rgba(ctx, WHITE, a)
    ctx.set_line_width(10)
    if kind == "МУЗЫКА":
        ctx.arc(cx - 30, cy + 40, 26, 0, 2 * math.pi)
        ctx.arc(cx + 40, cy + 25, 26, 0, 2 * math.pi)
        ctx.fill()
        ctx.move_to(cx - 6, cy + 40)
        ctx.line_to(cx - 6, cy - 50)
        ctx.line_to(cx + 64, cy - 65)
        ctx.line_to(cx + 64, cy + 25)
        ctx.stroke()
    elif kind == "ФИЛЬМЫ":
        ctx.move_to(cx - 40, cy - 55)
        ctx.line_to(cx + 55, cy)
        ctx.line_to(cx - 40, cy + 55)
        ctx.close_path()
        ctx.fill()
    elif kind == "МАШИНА":
        gfx.rrect(ctx, cx - 85, cy - 10, 170, 55, 14)
        ctx.fill()
        ctx.move_to(cx - 55, cy - 10)
        ctx.line_to(cx - 30, cy - 50)
        ctx.line_to(cx + 35, cy - 50)
        ctx.line_to(cx + 60, cy - 10)
        ctx.close_path()
        ctx.fill()
        for wx in (-48, 48):
            ctx.arc(cx + wx, cy + 48, 20, 0, 2 * math.pi)
            rgba(ctx, (0.12, 0.12, 0.15), a)
            ctx.fill_preserve()
            rgba(ctx, WHITE, a)
            ctx.set_line_width(8)
            ctx.stroke()
    elif kind == "ОФИС":
        ctx.rectangle(cx - 55, cy - 70, 110, 140)
        ctx.stroke()
        for r in range(3):
            for c in range(2):
                ctx.rectangle(cx - 35 + c * 45, cy - 50 + r * 40, 24, 22)
        ctx.fill()
    else:  # СОФТ: app window
        gfx.rrect(ctx, cx - 75, cy - 60, 150, 120, 14)
        ctx.stroke()
        ctx.rectangle(cx - 75, cy - 60, 150, 28)
        ctx.fill()


def s_subs(ctx, b, tl, t, lv):
    for i, (k, s) in enumerate(b["items"]):
        a = age(b, k, tl)
        if a < 0:
            continue
        col, row = i % 3, i // 3
        x, y = 150 + col * 370, 200 + row * 370
        gfx.card(ctx, x, y, 320, 320, a, fill=(0.12, 0.12, 0.15), border=(0.35, 0.35, 0.4))
        al = clamp(a / 0.25)
        sub_icon(ctx, s, x + 160, y + 130, al)
        text(ctx, s, x + 160, y + 255, 40, F_XB, GREY, al, shadow=False)
        gfx.rrect(ctx, x + 75, y + 272, 170, 32, 16)
        rgba(ctx, GOLD, al)
        ctx.fill()
        text(ctx, "ПОДПИСКА", x + 160, y + 296, 22, F_XB, (0.1, 0.1, 0.1), al, shadow=False)


def s_lock(ctx, b, tl, t, lv):
    a1 = age(b, 1, tl)
    if a1 < 0:
        gfx.icon_house(ctx, 640, 520, 2.2, clamp(tl / 0.3), GOLD)
        text(ctx, "КВАРТИРА → НУЖЕН СУД", 640, 860, 54, F_XB, WHITE, clamp(tl / 0.3))
    else:
        shake = 8 * math.sin(tl * 50) * max(0, 1 - age(b, 2, tl) / 0.4) if age(b, 2, tl) >= 0 else 0
        gfx.icon_lock(ctx, 640 + shake, 500, 2.4, clamp(a1 / 0.3), RED)
        a2 = age(b, 2, tl)
        if a2 >= 0:
            gfx.pop_text(ctx, "ДОСТУП ЗАКРЫТ", 640, 860, 90, a2, F_BLACK, RED, glow=0.6)
    a3 = age(b, 3, tl)
    if a3 >= 0:
        ctx.rectangle(0, 0, W, H)
        rgba(ctx, (0, 0, 0), 0.0)
        ctx.fill()


def s_versus(ctx, b, tl, t, lv):
    a = clamp(tl / 0.3)
    ctx.rectangle(W / 2 - 2, 160, 4, 760)
    rgba(ctx, WHITE, 0.5 * a)
    ctx.fill()
    gfx.icon_key(ctx, 480, 380, 1.8, a, GREEN)
    text(ctx, b["left"], 480, 620, 96, F_BLACK, WHITE, a, glow=0.3)
    text(ctx, b["lsub"], 480, 720, 60, F_XB, GREEN, a, glow=0.4)
    a1 = age(b, 1, tl)
    if a1 >= 0:
        aa = clamp(a1 / 0.3)
        gfx.icon_lock(ctx, 1440, 380, 1.6, aa, RED)
        text(ctx, b["right"], 1440, 620, 96, F_BLACK, WHITE, aa, glow=0.3)
    a2 = age(b, 2, tl)
    if a2 >= 0:
        text(ctx, b["rsub"], 1440, 720, 60, F_XB, RED, clamp(a2 / 0.3), glow=0.4)


def s_china(ctx, b, tl, t, lv):
    # skyline of empty towers at night
    for i in range(11):
        bx = 60 + i * 175
        bh = 380 + (i * 137 % 300)
        gfx.panel_building(ctx, bx, H - bh, 150, bh, int(bh / 50), 4, lit=0.03, color=(0.18, 0.19, 0.24), seed=i)
    rgba(ctx, (0, 0, 0), 0.35)
    ctx.paint()
    draw_pops(ctx, b, tl)
    a2 = age(b, 2, tl)
    if a2 >= 0:
        gfx.pop_text(ctx, "КИТАЙ", W / 2, 380, 150, a2, F_BLACK, RED, glow=0.6)


def s_rule(ctx, b, tl, t, lv):
    a = tl
    text(ctx, b["n"], 170, 330, 160, F_BLACK, GOLD, clamp(a / 0.3), "left", glow=0.5)
    for i, ln in enumerate(b["text"]):
        if ln:
            gfx.pop_text(ctx, ln, 170, 500 + i * 110, 88, a - 0.15 - 0.15 * i, F_XB, WHITE, align="left")
    a1 = age(b, max(b["anchors"]) if b["anchors"] else 1, tl)
    if a1 >= 0 and b.get("note"):
        text(ctx, b["note"], 170, 780, 50, F_SB, GREY, clamp(a1 / 0.3), "left")


def s_outro(ctx, b, tl, t, lv):
    """Reel outro: subscribe button that gets pressed, arrow to the profile, 'полные разборы' card."""
    ctx.save()
    ctx.translate(W / 2 - 300, 200)
    ctx.scale(1.6, 1.6)
    gfx.subscribe_button(ctx, 0, 0, tl)
    ctx.restore()
    a1 = age(b, 1, tl)
    if a1 >= 0:
        gfx.card(ctx, 160, 380, 980, 230, a1, fill=(0.12, 0.12, 0.15), border=GOLD)
        text(ctx, "ЗАХОДИ В ПРОФИЛЬ", 650, 480, 72, F_BLACK, GOLD, clamp(a1 / 0.3), glow=0.4)
        text(ctx, "там полные разборы про деньги", 650, 560, 44, F_SB, WHITE, clamp(a1 / 0.3))
        k = 0.5 + 0.5 * math.sin(t * 6)
        ctx.move_to(650, 640 + 20 * k)
        ctx.line_to(610, 600 + 20 * k)
        ctx.move_to(650, 640 + 20 * k)
        ctx.line_to(690, 600 + 20 * k)
        rgba(ctx, GOLD, clamp(a1 / 0.3))
        ctx.set_line_width(10)
        ctx.set_line_cap(cairo.LINE_CAP_ROUND)
        ctx.stroke()


import gags


def s_gag(ctx, b, tl, t, lv):
    """Drawn gag insert in a card; with a side character the card leaves room for him."""
    if b.get("char", "center") == "none":
        gags.draw_gag(ctx, b["gag"], tl, t, 200, 110, 1520, 860)
    else:
        gags.draw_gag(ctx, b["gag"], tl, t, 90, 130, 1180, 760)


def s_seven(ctx, b, tl, t, lv):
    """Big glowing 7 with 'причин' and seven ticks filling in."""
    a = clamp(tl / 0.4)
    gfx.pop_text(ctx, "7", 520, 640, 520, tl, F_BLACK, GOLD, glow=1.0)
    text(ctx, "ПРИЧИН", 520, 800, 110, F_BLACK, WHITE, a, glow=0.3)
    a1 = age(b, 1, tl)
    for i in range(7):
        ai = a1 - i * 0.12
        if ai > 0:
            x = 160 + i * 105
            gfx.rrect(ctx, x, 880, 80, 22, 11)
            rgba(ctx, GREEN, clamp(ai / 0.2))
            ctx.fill()


def s_disclaimer(ctx, b, tl, t, lv):
    a = clamp(tl / 0.4) * (1 - clamp((tl - b["dur"] + 0.4) / 0.4))
    rgba(ctx, (0, 0, 0), 0.55 * a)
    ctx.paint()
    text(ctx, "Всё, что дальше, — не индивидуальная инвестиционная рекомендация.", 960, 500, 44, F_SB, WHITE, a)
    text(ctx, "Автор просто делится опытом и считает на открытых данных.", 960, 570, 40, F_SB, GREY, a)


def s_pyramid(ctx, b, tl, t, lv):
    """Population pyramid morphing from a 'tree' (young base) to a 'mushroom' (old top) + counters."""
    k = ease(clamp((tl - 0.3) / 2.5))
    cx, top, bot = 640, 170, 900
    n = 20
    for i in range(n):
        f = i / (n - 1)  # 0 = oldest (top), 1 = youngest (bottom)
        young = 60 + 300 * f ** 0.8
        old = 260 - 120 * abs(f - 0.45) * 2 + 40 * (1 - f)
        wdt = young * (1 - k) + old * k
        y = top + f * (bot - top)
        hh = (bot - top) / n - 4
        gfx.rrect(ctx, cx - wdt, y, wdt - 6, hh, 6)
        rgba(ctx, (0.35, 0.55, 0.95), 0.9)
        ctx.fill()
        gfx.rrect(ctx, cx + 6, y, wdt * 1.08 - 6, hh, 6)
        rgba(ctx, (0.95, 0.40, 0.45), 0.9)
        ctx.fill()
    text(ctx, "1990" if k < 0.5 else "2030+", cx, 130, 60, F_BLACK, WHITE, glow=0.3)
    text(ctx, "пожилые", cx - 400, top + 40, 34, F_SB, GREY, align="left")
    text(ctx, "молодые", cx - 400, bot - 10, 34, F_SB, GREY, align="left")
    a1 = age(b, 0, tl)
    gfx.pop_text(ctx, "40 МЛН ПЕНСИОНЕРОВ", 640, 1000, 56, a1 - 0.8, F_BLACK, GOLD, glow=0.4)


def s_pensbar(ctx, b, tl, t, lv):
    """Average pension vs income from one million: two big bars."""
    gfx.bar(ctx, 140, 420, 1100, 1.0, "Средняя пенсия по старости", "≈ 27 200 ₽", tl, (0.75, 0.75, 0.80), h=56)
    a1 = age(b, 1, tl)
    if a1 >= 0:
        gfx.bar(ctx, 140, 700, 1100, 10800 / 27200, "Доход с 1 млн на вкладе", "≈ 10 800 ₽", a1, GREEN, h=56)
        gfx.pop_text(ctx, "≈ 40%", 1000, 640, 90, a1 - 1.2, F_BLACK, GREEN, glow=0.6)


def s_formula(ctx, b, tl, t, lv):
    """УСПЕХ = ВОЗМОЖНОСТЬ + ГОТОВНОСТЬ; with 'filled' the second slot fills with a money stack."""
    y = 520
    gfx.pop_text(ctx, "УСПЕХ", 260, y, 92, tl, F_BLACK, WHITE)
    a1 = age(b, 1, tl) if 1 in b["anchors"] else tl
    a2 = age(b, 2, tl) if 2 in b["anchors"] else tl
    if a1 >= 0:
        gfx.pop_text(ctx, "=", 470, y, 92, a1, F_BLACK, GREY)
        gfx.card(ctx, 540, y - 110, 320, 160, a1, fill=(0.98, 0.96, 0.92))
        text(ctx, "ШАНС", 700, y - 10, 66, F_BLACK, (0.15, 0.15, 0.2), clamp(a1 / 0.3), shadow=False)
    if a2 >= 0:
        gfx.pop_text(ctx, "+", 920, y, 92, a2, F_BLACK, GREY)
        gfx.card(ctx, 990, y - 110, 360, 160, a2, fill=(0.20, 0.55, 0.32) if b.get("filled") else (0.98, 0.96, 0.92))
        lab = "1 000 000 ₽" if b.get("filled") else "ГОТОВНОСТЬ"
        text(ctx, lab, 1170, y - 10, 56 if b.get("filled") else 50, F_BLACK,
             WHITE if b.get("filled") else (0.15, 0.15, 0.2), clamp(a2 / 0.3), shadow=False)
        if b.get("filled"):
            for i in range(5):
                gags.banknote(ctx, 1080 + i * 45, y + 120 - i * 8, 0.6, -0.1 + 0.05 * i)


SCENES = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}


def draw(ctx, b, tl, t, level, beats):
    # mark the first beat of each character run so it slides in
    prev = beats[b["idx"] - 1] if b["idx"] > 0 else None
    b["_enter"] = prev is None or prev.get("char", "center") != b.get("char", "center")
    # subtle punch-in at the start of each beat
    z = 1.0 + 0.025 * (1 - ease(tl / 0.5))
    ctx.save()
    if b.get("style") == "shout":
        k = 0.6 + 0.4 * level
        ctx.translate(14 * k * math.sin(t * 61), 10 * k * math.cos(t * 47))
        z += 0.03 * level
    ctx.translate(W / 2, H / 2)
    ctx.scale(z, z)
    ctx.translate(-W / 2, -H / 2)
    background(ctx, b, t)
    SCENES[b["scene"]](ctx, b, tl, t, level)
    if b["scene"] not in ("tv", "kvt", "comment", "chart", "gag"):
        draw_pops(ctx, b, tl)
    draw_char(ctx, b, tl, t, level)
    ctx.restore()
    if b.get("style") == "shout":
        rgba(ctx, RED, 0.06 + 0.12 * level)
        ctx.paint()
    if b.get("darken"):
        rgba(ctx, (0, 0, 0), 0.4 * clamp(tl / 1.5))
        ctx.paint()
    # fade from the previous beat
    if tl < 0.12 and b["idx"] > 0:
        rgba(ctx, (0, 0, 0), 0.35 * (1 - tl / 0.12))
        ctx.paint()
