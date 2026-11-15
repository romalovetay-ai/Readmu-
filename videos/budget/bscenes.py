"""Scenes for «Куда утекает зарплата» in the approved channel style (videos/STYLE.md): illustrated locations with Серёга,
continuous camera, squash & stretch, word-synced headlines, narrator v2 on the right, comic shout.
render(b, tl, t, level, beats, body=None) -> BGR frame."""
import math
import random
import numpy as np
import cairo

import art
import cine
import character
import scenes2d
import world as Wd
import places as P
from art import (W, H, INK, shape, ground, coin, coin_stack, banknote, tag, title, pop_title, plain, fit, rrect_path, ell_path,
                 poly_path, gloss, ease, ease_io, ease_back, clamp, C, shade_of, light_of, check, F_BLACK, F_XB, F_SB)

DELEGATE = {"talk", "chapter", "disclaimer", "checklist", "outro"}
WORLD = {"payday": "room", "leaks": "room", "subs": "room", "delivery": "room", "receipt": "room", "fix": "desk",
         "taxi": "street", "coffee": "cafe", "night": "bedroom", "rule48": "bedroom", "split": "room", "fees": "room",
         "raise": "room"}


def an(b, k):
    return 0.0 if k == 0 else b["anchors"].get(k, b["dur"] * 0.5)


def ag(b, k, tl):
    return tl - an(b, k)


def variant(b, beats):
    """Second beat with the same scene+stage gets variant 1 (different action on the same set)."""
    prev = beats[b["idx"] - 1] if b["idx"] > 0 else None
    if prev and prev["scene"] == b["scene"] and prev.get("stage", 1) == b.get("stage", 1) and prev.get("step") == b.get("step"):
        return 1
    return 0


class F:
    def __init__(self, b, tl, t, beats):
        self.b, self.tl, self.t, self.beats = b, tl, t, beats
        self.ui = []        # screen-space overlays drawn after the narrator
        self.mid = []       # screen-space overlays drawn before the narrator
        self.cam = (900, 560, 1.0)
        self.night = 0.0
        self.storm = 0.0
        self.dim = 0.0
        self.var = variant(b, beats)

    def head(self, s, k=0, y=150, size=96, color="white", face=F_BLACK, x=650):
        a = ag(self.b, k, self.tl)
        self.ui.append(lambda c: pop_title(c, s, x, y, fit(c, s, size, 1150, face), a, color, face=face))

    def sub(self, s, k=0, y=1000, size=58, color="gold", x=650):
        self.head(s, k, y, size, color, F_XB, x)


# ------------------------------------------------------------------ worlds
def draw_world(c, f, name):
    t = f.t
    if name == "room":
        P.room(c, t, night=f.night)
        P.sofa(c, 860, t)
    elif name == "desk":
        P.room(c, t, wall=(0.86, 0.88, 0.95), night=0.2, window_x=1050)
        P.desk(c, 620, t)
    elif name == "bedroom":
        P.room(c, t, wall=(0.70, 0.72, 0.92), night=f.night, window_x=1000, lamp=False)
        P.bed(c, 640, t)
    elif name == "cafe":
        cafe(c, t)
    elif name == "street":
        Wd.sky(c, f.storm * 0.9, t)
        Wd.clouds(c, t, f.storm, 0)
        Wd.far_city(c, f.storm)
        Wd.mid_houses(c, t, f.storm, 1)
        Wd.street(c, f.storm)
        for lx in (300, 1000, 1700):
            Wd.lamp(c, lx, t)


def cafe(c, t):
    g = cairo.LinearGradient(0, 0, 0, P.FLOOR_Y)
    g.add_color_stop_rgb(0, 0.36, 0.24, 0.20)
    g.add_color_stop_rgb(1, 0.52, 0.34, 0.26)
    c.rectangle(-1000, -600, 4000, P.FLOOR_Y + 600)
    c.set_source(g)
    c.fill()
    for k in range(-10, 40):  # brick pattern
        for r in range(0, 16):
            x = k * 120 + (60 if r % 2 else 0)
            y = r * 56
            rrect_path(c, x, y, 112, 48, 6)
    c.set_source_rgba(0.62, 0.40, 0.30, 0.35)
    c.fill()
    # menu board
    shape(c, lambda q: rrect_path(q, 180, 120, 520, 300, 16), (0.16, 0.18, 0.16), 1, shade=0.06)
    plain(c, "МЕНЮ", 440, 190, 46, F_BLACK, "cream")
    for i, (nm, pr) in enumerate((("КАПУЧИНО", "250"), ("ЛАТТЕ", "270"), ("РАФ", "320"))):
        plain(c, nm, 230, 260 + i * 52, 32, F_XB, "white", 1, "left")
        plain(c, pr + " ₽", 650, 260 + i * 52, 32, F_BLACK, "gold", 1, "right")
    # pendant lamps
    for lx in (300, 760, 1220):
        c.move_to(lx, -100)
        c.line_to(lx, 60)
        c.set_line_width(4)
        c.set_source_rgba(*INK, 1)
        c.stroke()
        shape(c, lambda q, lx=lx: (q.move_to(lx - 50, 110), q.line_to(lx + 50, 110), q.line_to(lx + 26, 60), q.line_to(lx - 26, 60), q.close_path()),
              "gold", 1, shade=0.15, lw=4)
        rg = cairo.RadialGradient(lx, 120, 0, lx, 120, 360)
        rg.add_color_stop_rgba(0, 1, 0.85, 0.55, 0.30)
        rg.add_color_stop_rgba(1, 1, 0.85, 0.55, 0)
        c.set_source(rg)
        c.arc(lx, 120, 360, 0, 2 * math.pi)
        c.fill()
    # floor
    c.rectangle(-1000, P.FLOOR_Y, 4000, 600)
    c.set_source_rgb(0.30, 0.22, 0.20)
    c.fill()
    # counter with coffee machine
    shape(c, lambda q: rrect_path(q, 120, P.FLOOR_Y - 330, 1150, 60, 12), "wood", 1, shade=0.2)
    shape(c, lambda q: rrect_path(q, 150, P.FLOOR_Y - 270, 1090, 270, 10), (0.30, 0.20, 0.18), 1, shade=0.1)
    shape(c, lambda q: rrect_path(q, 860, P.FLOOR_Y - 560, 300, 230, 20), "steel", 1, shade=0.12)
    shape(c, lambda q: rrect_path(q, 900, P.FLOOR_Y - 520, 220, 60, 10), (0.2, 0.2, 0.25), 1, shade=0.1, lw=4)
    for k in range(3):  # steam
        ph = (t * 0.6 + k / 3) % 1
        c.arc(990 + 18 * math.sin(ph * 6 + k), P.FLOOR_Y - 600 - ph * 120, 10 + 14 * ph, 0, 2 * math.pi)
        c.set_source_rgba(1, 1, 1, 0.3 * (1 - ph))
        c.fill()


def cup(c, x, y, s=1.0, alpha=1.0, color=(0.98, 0.95, 0.90)):
    shape(c, lambda q: poly_path(q, [(x - 30 * s, y - 90 * s), (x + 30 * s, y - 90 * s), (x + 22 * s, y), (x - 22 * s, y)]), color, alpha, shade=0.2, lw=4)
    shape(c, lambda q: rrect_path(q, x - 34 * s, y - 104 * s, 68 * s, 18 * s, 6 * s), (0.45, 0.30, 0.22), alpha, shade=0.2, lw=4)
    shape(c, lambda q: q.rectangle(x - 28 * s, y - 62 * s, 56 * s, 22 * s), (0.62, 0.42, 0.30), alpha, shade=0, light=0, lw=3)


# ------------------------------------------------------------------ scenes (world drawing + overlays)
def s_payday(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    f.night = 0.0 if st != 2 else 0.35
    draw_world(c, f, "room")
    # calendar
    if st == 1:
        day, flip = 5, 0.0
    elif st == 2 and f.var == 0:
        k = clamp(tl / max(1.0, b["dur"] - 1.0))
        day = 5 + int(15 * ease_io(k))
        flip = (15 * ease_io(k)) % 1.0
    elif st == 2:
        day, flip = 20, 0.0
    else:
        day, flip = 5, 0.0
    P.wall_calendar(c, 1240, 300, day, flip, red=(st == 2))
    # balance
    if st == 1:
        bal = 80000 * ease_io(clamp(ag(b, 1, tl) / 1.0)) if ag(b, 1, tl) > 0 else 1200
    elif st == 2 and f.var == 0:
        bal = 80000 * (1 - ease_io(clamp(tl / max(1.0, b["dur"] - 0.6)))) + 300
    elif st == 2:
        bal = 300
    else:
        bal = 23000
    mood = {1: "joy" if ag(b, 2, tl) > 0 else "happy", 2: "worried" if f.var == 0 else "sad", 3: "happy"}[st]
    jump = 0.0
    if st == 1 and ag(b, 2, tl) > 0:
        a2 = ag(b, 2, tl)
        jump = 140 * abs(math.sin(min(a2, 2.0) * 4.2)) * (1 - clamp(a2 / 2.2))
    P.serega(c, 860, P.FLOOR_Y - 120, 1.15, t, mood, "jump" if jump > 4 else "sit", phone=(st != 1 or jump < 4), bounce=jump, look=-0.5)
    if st == 2 and f.var == 1:
        # money slipping away through gaps in the floor + a moth from the empty wallet
        for i in range(6):
            ph = (tl * 0.5 + i / 6) % 1.0
            banknote(c, 300 + i * 150, P.FLOOR_Y + 40 + ph * 260, 90, ph * 4 + i, alpha=1 - ph)
        mt = tl * 1.4
        for sgn in (-1, 1):
            shape(c, lambda q, sgn=sgn: ell_path(q, 760 + 60 * math.sin(mt * 2) + sgn * 14, 420 - 40 * mt + 10 * math.sin(mt * 9),
                                                 14, 9 + 5 * abs(math.sin(mt * 12))), (0.85, 0.82, 0.75), 1, shade=0.1, lw=3)
    if st == 1 and ag(b, 2, tl) > 0:
        a2 = ag(b, 2, tl)
        for i in range(12):
            rnd = random.Random(i)
            x = 500 + rnd.random() * 800
            y = -100 + (a2 * (500 + rnd.random() * 300)) - 60 * i * 0.2
            if y < P.FLOOR_Y:
                coin(c, x, y, 34, flip=math.cos(t * 6 + i))
    if st == 3:
        P.jar(c, 1250, P.FLOOR_Y - 10, 180, 240, 0.25 + 0.15 * ease_io(clamp(tl / 2)), "gold", "ОСТАЛОСЬ", lid="green")
        cup(c, 1000, P.FLOOR_Y - 200, 0.9)

    def bank(q, w, h):
        P.app_bg(q, w, h)
        plain(q, "МОЙ БАНК", w / 2, 70, 30, F_XB, (0.8, 0.78, 0.9))
        plain(q, "Баланс", w / 2, 170, 30, F_SB, (0.8, 0.78, 0.9))
        col = "green" if bal > 20000 else ("gold" if bal > 5000 else "red")
        P.counter(q, bal, w / 2, 250, fit(q, "80 000 ₽", 74, w - 40), col)
        if st == 1 and ag(b, 1, tl) > 0:
            k = ease_back(clamp(ag(b, 1, tl) / 0.4))
            q.save()
            q.translate(w / 2, 360)
            q.scale(k, k)
            rrect_path(q, -w / 2 + 20, -46, w - 40, 92, 22)
            q.set_source_rgba(*C("green"), 0.9)
            q.fill()
            plain(q, "+80 000 ₽  ЗАРПЛАТА", 0, 12, fit(q, "+80 000 ₽  ЗАРПЛАТА", 32, w - 80), F_BLACK, "white")
            q.restore()
        if st == 2:
            for i, (nm, v) in enumerate((("Доставка", "−1 240"), ("Подписка", "−399"), ("Такси", "−680"), ("Маркетплейс", "−2 990"),
                                         ("Кофе", "−250"), ("Рассрочка", "−3 000"))):
                if tl > 0.3 + i * 0.5 or f.var:
                    plain(q, nm, 30, 440 + i * 64, 28, F_XB, "white", 1, "left")
                    plain(q, v, w - 30, 440 + i * 64, 28, F_BLACK, "red", 1, "right")
        if st == 3:
            plain(q, "5 декабря", w / 2, 360, 30, F_XB, "gold")
    f.mid.append(lambda q: P.phone_ui(q, 330, 520, 400, 760, bank, rot=-0.04))
    if st == 1:
        f.head("ЗАРПЛАТА", 1, 140, 100, "green", x=780)
    elif st == 2 and f.var == 0:
        f.head("20-Е ЧИСЛО", 0, 140, 100, "red", x=780)
        f.sub("КУДА ВСЁ ДЕЛОСЬ?", 1, 1010, 66, "white", x=780)
    elif st == 2:
        f.head("ДЕНЬГИ ПРОСТО УТЕКАЮТ", 0, 140, 76, "white", x=780)
    else:
        f.head("ДЕНЬГИ ОСТАЛИСЬ!", 1, 140, 96, "green", x=780)
        f.sub("И КОФЕ НЕ БРОСИЛ", 2, 1010, 60, "gold", x=780)
    f.cam = {1: (860, 560, 1.0), 2: (860, 560, 1.03), 3: (860, 560, 1.0)}[st]


def s_leaks(c, f):
    b, tl, t = f.b, f.tl, f.t
    draw_world(c, f, "room")
    c.save()
    c.set_source_rgba(0.08, 0.04, 0.12, 0.45)
    c.paint()
    c.restore()
    x, y = 640, P.FLOOR_Y + 40
    level = 1.0 - 0.6 * ease_io(clamp(tl / b["dur"]))
    # bucket
    body = lambda q: (q.move_to(x - 260, y - 520), q.line_to(x + 260, y - 520), q.line_to(x + 200, y), q.line_to(x - 200, y), q.close_path())
    shape(c, body, "steel", 1, shade=0.12)
    c.save()
    body(c)
    c.clip()
    c.rectangle(x - 300, y - 520 * level, 600, 520 * level)
    c.set_source_rgba(*C("gold"), 0.9)
    c.fill()
    c.restore()
    body(c)
    c.set_line_width(6)
    c.set_source_rgba(*INK, 1)
    c.stroke()
    tag(c, "ЗАРПЛАТА", x, y - 560, 40, "gold")
    holes = [(-180, -380), (-120, -200), (-60, -440), (20, -120), (90, -300), (160, -420), (190, -160)]
    names = ["ПОДПИСКИ", "ДОСТАВКА", "КОФЕ", "МАРКЕТПЛЕЙСЫ", "РАССРОЧКИ", "КОМИССИИ", "«Я ЗАСЛУЖИЛ»"]
    a1 = ag(b, 1, tl)
    for i, (hx, hy) in enumerate(holes):
        ai = (a1 + 1.0) - i * 0.35 if a1 > -1.0 else -1
        if ai < 0:
            continue
        side = -1 if hx < 0 else 1
        px, py = x + hx, y + hy
        shape(c, lambda q, px=px, py=py: ell_path(q, px, py, 16, 12), INK, 1, shade=0, light=0, lw=1)
        for k in range(5):
            ph = (t * 1.3 + k / 5 + i * 0.13) % 1.0
            cx_ = px + side * ph * 220
            cy_ = py + 400 * ph * ph
            if cy_ < y + 60:
                coin(c, cx_, cy_, 16, flip=math.cos(t * 8 + k))
        if ai > 0.2:
            tag(c, f"{i + 1}. {names[i]}", px + side * (250 + 40 * (i % 2)), py - 30 - 18 * (i % 3), 26, "red", alpha=clamp((ai - 0.2) / 0.3))
    f.head("7 ДЫР", 0, 140, 120, "red", x=780)
    f.sub("И КАК ИХ ЗАЛАТАТЬ", 2, 1010, 60, "green", x=780)
    f.cam = (760, 560, 1.0)


SUBS = [((0.95, 0.35, 0.45), "М", "Музыка", "299 ₽"), ((0.35, 0.55, 0.95), "К", "Кино", "399 ₽"), ((0.45, 0.80, 0.55), "О", "Облако", "149 ₽"),
        ((0.62, 0.42, 0.95), "К", "Ещё кино", "349 ₽"), ((0.98, 0.70, 0.25), "Т", "Тренировки", "499 ₽"), ((0.30, 0.78, 0.80), "М", "Медитация", "449 ₽")]


def s_subs(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    f.night = 0.25
    draw_world(c, f, "room")
    P.serega(c, 1020, P.FLOOR_Y - 120, 1.0, t, "neutral" if st < 3 else ("worried" if st == 3 else "happy"), "sit", phone=True, look=-0.6)
    rows_shown = len(SUBS) if st > 1 else int(clamp((tl - 0.4) / max(1.0, b["dur"] - 1.5)) * len(SUBS) + 0.999)
    triple = st == 4 and f.var == 1
    cut = 0
    if st == 4 and f.var == 0:
        cut = int(clamp((ag(b, 1, tl)) / 2.0) * 4) if ag(b, 1, tl) > 0 else 0

    def screen(q, w, h):
        P.app_bg(q, w, h)
        plain(q, "ПОДПИСКИ", w / 2, 70, 34, F_BLACK, "white")
        items = SUBS if not triple else [SUBS[1], SUBS[1], SUBS[1]]
        for i, (col, let, nm, pr) in enumerate(items[:rows_shown] if not triple else items):
            k = ease_back(clamp((tl - 0.4 - i * (b["dur"] - 1.5) / len(SUBS)) / 0.35)) if st == 1 else 1.0
            q.save()
            q.translate((1 - k) * w, 0)
            dead = st == 4 and not triple and i in (1, 3, 4, 5)[:cut]
            P.app_row(q, 16, 120 + i * 110, w - 32, col, let, nm if not triple else "Кино", pr, 1.0, strike=1.0 if dead else 0.0,
                      highlight="gold" if triple else None)
            q.restore()
        if st >= 2 and not triple:
            tot = 2144
            if st == 4:
                tot = 2144 - sum((399 + 349 + 499 + 449, 0)[0] * 0 + v for v in (349, 499, 449, 399)[:cut])
            plain(q, "в месяц:", 30, h - 60, 30, F_XB, (0.8, 0.78, 0.9), 1, "left")
            P.counter(q, tot, w - 120, h - 52, 46, "gold" if st != 4 else "green")
    f.mid.append(lambda q: P.phone_ui(q, 420, 540, 470, 900, screen, rot=-0.03))
    if st == 1:
        f.head("ДЫРА №1", 0, 130, 70, "red", face=F_XB, x=900)
        f.head("ПОДПИСКИ", 0, 230, 100, "white", x=900)
    if st == 2:
        f.head("≈ 2 000–3 000 ₽ / МЕС", 1, 150, 70, "gold", x=900)
        f.sub("× 12 = 30 000+ ₽ В ГОД", 2, 1000, 64, "red", x=900)
        a2 = ag(b, 2, tl)
        if a2 > 0:
            def bats(q):
                for i in range(4):
                    ph = a2 * 0.6 + i * 0.25
                    bx = 420 + 300 * math.cos(ph * 2.2 + i)
                    by = 500 + 220 * math.sin(ph * 2.9 + i * 1.3)
                    P.bat(q, bx, by, 1.0, t + i, alpha=clamp(a2 / 0.4))
                    coin(q, bx, by + 40, 18, flip=math.cos(t * 7 + i))
            f.ui.append(bats)
    if st == 3:
        a1, a2 = ag(b, 1, tl), ag(b, 2, tl)

        def trial(q):
            k = ease_back(clamp(a1 / 0.4))
            if a1 > 0:
                q.save()
                q.translate(1000, 300)
                q.scale(k, k)
                q.rotate(-0.06)
                art.card(q, -260, -70, 520, 140, color=(0.20, 0.60, 0.40))
                plain(q, "7 ДНЕЙ БЕСПЛАТНО", 0, 18, 46, F_BLACK, "white")
                q.restore()
            if a2 > 0:
                for i in range(int(a2 / 0.55) + 1):
                    ai = a2 - i * 0.55
                    if ai < 0 or i > 6:
                        continue
                    y = 520 + i * 60 - 30 * ease(ai / 0.3)
                    pop_title(q, "−449 ₽", 1220 + (i % 2) * 90, y - 60, 50, ai, "red")
        f.ui.append(trial)
        f.head("ПРОБНЫЙ ПЕРИОД", 0, 140, 90, "white", x=900)
    if st == 4 and not triple:
        f.head("РЕЖЬ БЕЗЖАЛОСТНО", 1, 140, 90, "green", x=900)
        f.sub("РАЗ В МЕСЯЦ", 0, 1000, 60, "gold", x=900)
    if triple:
        f.head("ТРИ ОДИНАКОВЫХ КИНО", 0, 140, 80, "gold", x=900)
        f.sub("× 3 !", 1, 1000, 80, "red", x=900)
    f.cam = (760, 560, 1.0)


def s_delivery(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    if st == 2:
        f.storm = 0.0
        draw_world(c, f, "street")
        Wd.kiosk(c, 520, 1.0, t)
        kx, ky = 520, Wd.STREET_Y - 120
        a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
        c.save()
        rrect_path(c, 520 - 520 * 0.40, Wd.STREET_Y - 380 * 0.82, 520 * 0.80, 380 * 0.46, 12)
        c.clip()
        c.translate(520, Wd.STREET_Y - 380 * 0.36 + 10)
        Wd.vasya(c, 0, 20, 0.62, t, "worried" if a2 > 0 else "happy", 0.0, 1.0, look=0.5)
        c.restore()
        shape(c, lambda q: rrect_path(q, 520 - 520 * 0.53, Wd.STREET_Y - 380 * 0.36, 520 * 1.06, 38, 8), (0.58, 0.38, 0.26), 1, shade=0.3)
        # route to Серёга's sofa
        k = ease_io(clamp(a1 / 1.2)) if a1 > 0 else 0
        if k > 0:
            c.move_to(800, Wd.STREET_Y - 200)
            pts = [(800 + 380 * u, Wd.STREET_Y - 200 - 260 * math.sin(math.pi * u)) for u in np.linspace(0, k, 30)]
            for p in pts:
                c.line_to(*p)
            c.set_dash([18, 14])
            c.set_line_width(8)
            c.set_source_rgb(*C("gold"))
            c.stroke()
            c.set_dash([])
            P.courier(c, pts[-1][0], Wd.STREET_Y + 20 - 0, 0.6, t)
        price = 300 if a1 < 0.4 else 300 + 280 * ease_io(clamp((a1 - 0.4) / 1.0))
        tag(c, f"{int(price)} ₽", 520, Wd.STREET_Y - 560, 44, "gold" if price < 320 else "red")
        f.head("У ВАСИ: 300 ₽", 0, 140, 84, "gold", x=780)
        f.sub("ДО ДИВАНА: ~600 ₽", 1, 1010, 64, "red", x=780)
        f.cam = (800, 560, 1.0)
        return
    f.night = 0.55
    draw_world(c, f, "room")
    # door on the right of the room
    shape(c, lambda q: rrect_path(q, 1260, P.FLOOR_Y - 520, 240, 520, 10), (0.62, 0.44, 0.32), 1, shade=0.12)
    shape(c, lambda q: ell_path(q, 1290, P.FLOOR_Y - 260, 12, 12), "gold", 1, shade=0.2, lw=3)
    a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
    P.serega(c, 860, P.FLOOR_Y - 120, 1.1, t, "worried" if a2 < 0 else "happy", "sit", phone=True, look=0.5)
    if a2 > 0.4:
        k = ease_back(clamp((a2 - 0.4) / 0.5))
        P.courier(c, 1380 + 220 * (1 - k), P.FLOOR_Y, 1.0, t)
        if a2 < 1.4:
            for i in range(3):  # ding-dong waves
                r = 30 + 60 * ((a2 * 2 + i / 3) % 1)
                c.arc(1260, P.FLOOR_Y - 300, r, -0.8, 0.8)
                c.set_line_width(5)
                c.set_source_rgba(1, 1, 1, 0.6)
                c.stroke()

    def timer(q):
        if a2 > -0.2:
            k = ease_back(clamp((a2 + 0.2) / 0.4))
            q.save()
            q.translate(420, 330)
            q.scale(k, k)
            shape(q, lambda r: ell_path(r, 0, 0, 110, 110), "white", 1, shade=0.12)
            prog = clamp((a2 + 0.2) / 2.0)
            q.move_to(0, 0)
            q.arc(0, 0, 92, -math.pi / 2, -math.pi / 2 + 2 * math.pi * prog)
            q.close_path()
            q.set_source_rgba(*C("amber"), 0.85)
            q.fill()
            plain(q, "40", 0, 14, 64, F_BLACK, INK)
            plain(q, "МИН", 0, 62, 26, F_XB, INK)
            q.restore()
    f.mid.append(timer)
    f.head("ДЫРА №2", 0, 130, 70, "red", face=F_XB, x=780)
    f.head("ДОСТАВКА", 0, 230, 100, "white", x=780)
    f.cam = (1080, 560, 1.0)


def s_receipt(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    f.night = 0.55
    draw_world(c, f, "room")
    c.set_source_rgba(0.06, 0.03, 0.10, 0.5)
    c.paint()
    if st == 1:
        lines = [("Еда", "640 ₽", None), ("Доставка", "199 ₽", "red"), ("Сервисный сбор", "99 ₽", "red"), ("Наценка в приложении", "+20%", "red")]
        shown = [ln for i, ln in enumerate(lines) if tl > (0.3 if i == 0 else an(b, 1) + (i - 1) * 0.7)]
        k = clamp(tl / (b["dur"] * 0.8))
        P.receipt(c, 620, 140, 640, shown, k, total="≈ 1 050 ₽" if ag(b, 2, tl) > 0.8 else None)
        f.head("ЗА ЧТО ТЫ ПЛАТИШЬ", 0, 120, 80, "white", x=1180) if False else None
        f.cam = (760, 560, 1.0)
    else:
        lines = [("Доставка × 14", "8 400 ₽", None), ("Такси × 20", "6 200 ₽", None)]
        P.receipt(c, 560, 160, 620, lines, clamp(tl / 1.2), total="14 600 ₽")
        a1 = ag(b, 1, tl)
        if a1 > 0:
            # salary bar with a fifth burnt
            x0, y0, wbar = 120, 880, 1000
            shape(c, lambda q: rrect_path(q, x0, y0, wbar, 60, 30), "green", 1, shade=0.15)
            k = ease_io(clamp(a1 / 0.8))
            shape(c, lambda q: rrect_path(q, x0 + wbar * (1 - 0.18 * k), y0, wbar * 0.18 * k + 0.01, 60, 30), "red", 1, shade=0.15)
            plain(c, "ЗАРПЛАТА 80 000 ₽", x0 + 20, y0 - 20, 32, F_XB, "white", 1, "left")
            if a1 > 0.6:
                tag(c, "≈ 1/5", x0 + wbar * 0.91, y0 - 40, 36, "red")
        f.cam = (700, 560, 1.0)


def s_taxi(c, f):
    b, tl, t = f.b, f.tl, f.t
    a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
    f.storm = clamp(a2 / 0.6) if a2 > 0 else 0.0
    draw_world(c, f, "street")
    x = 640 + 30 * math.sin(t * 0.5)
    P.car(c, x, Wd.STREET_Y + 160, 1.15, t)
    P.serega(c, 1080, Wd.STREET_Y + 10, 0.9, t, "worried" if a2 > 0 else "neutral", "stand", phone=True, look=-0.6)
    if a1 > 0:
        tag(c, "5 МИН ПЕШКОМ", 1080, Wd.STREET_Y - 330, 32, "cream", rot=-0.05)
    mult = 1.0 + (1.7 * ease_io(clamp(a2 / 1.6)) if a2 > 0 else 0.0)

    def meter(q):
        art.card(q, 140, 260, 420, 220, color=(0.14, 0.12, 0.20))
        plain(q, "ЦЕНА ПОЕЗДКИ", 350, 320, 30, F_XB, (0.8, 0.78, 0.9))
        P.counter(q, 250 * mult, 350, 410, 80, "gold" if mult < 1.5 else "red")
        tag(q, f"× {mult:.1f}".replace(".", ","), 520, 270, 30, "red" if mult > 1.5 else "cream")
    f.mid.append(meter)
    Wd.rain(c, t, f.storm)
    f.head("ТАКСИ", 0, 140, 100, "white", x=780)
    f.sub("ДОЖДЬ + ЧАС ПИК = КРЫЛО САМОЛЁТА", 2, 1010, 50, "red", x=780)
    f.cam = (800, 560, 1.0)


def s_coffee(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    draw_world(c, f, "cafe")
    if st == 1:
        a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
        P.serega(c, 520, P.FLOOR_Y + 40, 1.0, t, "happy", "stand", look=0.6)
        if a1 > 0:
            k = ease_back(clamp(a1 / 0.4))
            c.save()
            c.translate(1010, P.FLOOR_Y - 330)
            c.scale(k, k)
            cup(c, 0, 0, 1.0)
            c.restore()
        if a2 > 0:
            for i, (nm, col) in enumerate((("БУЛКА", "amber"), ("ЭНЕРГЕТИК", "green"), ("ШОКОЛАДКА", "brown"))):
                ai = a2 - i * 0.35
                if ai > 0:
                    k = ease_back(clamp(ai / 0.35))
                    sx, sy = P.squash(ai - 0.35)
                    c.save()
                    c.translate(700 + i * 120, P.FLOOR_Y - 330)
                    c.scale(k * sx, k * sy)
                    shape(c, lambda q: rrect_path(q, -45, -70, 90, 70, 14), col, 1, shade=0.2)
                    c.restore()
                    tag(c, nm, 700 + i * 120, P.FLOOR_Y - 430 - (i % 2) * 50, 22, "cream", alpha=clamp(ai / 0.3))
        f.head("ДЫРА №3", 0, 130, 70, "red", face=F_XB, x=780)
        f.head("МЕЛОЧЬ КАЖДЫЙ ДЕНЬ", 0, 230, 84, "white", x=780)
        f.cam = (760, 560, 1.0)
    elif st == 3:
        # checkout: shelf with sweets right at the cashier
        shape(c, lambda q: rrect_path(q, 300, P.FLOOR_Y - 600, 300, 420, 12), (0.45, 0.30, 0.25), 1, shade=0.12)
        for r in range(4):
            shape(c, lambda q, r=r: q.rectangle(300, P.FLOOR_Y - 590 + r * 100, 300, 12), "wood", 1, shade=0, light=0, lw=3)
            for k in range(4):
                col = ["red", "gold", "purple", "green"][(r + k) % 4]
                shape(c, lambda q, r=r, k=k, col=col: rrect_path(q, 315 + k * 70, P.FLOOR_Y - 570 + r * 100, 56, 64, 8), col, 1, shade=0.2, lw=3)
        a2 = ag(b, 2, tl)
        P.serega(c, 820, P.FLOOR_Y + 40, 1.0, t, "neutral", "stand", look=-0.8)
        if a2 > 0:
            # a hand reaching for the shelf: chocolate flies into the basket
            u = clamp(a2 / 0.8)
            x = 560 + (780 - 560) * ease_io(u)
            y = P.FLOOR_Y - 400 - 120 * math.sin(math.pi * u)
            shape(c, lambda q: rrect_path(q, x - 30, y - 22, 60, 44, 8), "brown", 1, shade=0.2, lw=3.5)
        f.head("У КАССЫ — ЛОВУШКА", 1, 150, 84, "white", x=780)
        f.cam = (700, 560, 1.0)
    else:
        a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
        n = int(clamp(tl / max(1.0, an(b, 1) + 0.5)) * 22)
        for i in range(n):
            cup(c, 180 + (i % 11) * 95, P.FLOOR_Y - 330 - (i // 11) * 110, 0.8)
        c.set_source_rgba(0.06, 0.03, 0.08, 0.35)
        c.rectangle(-1000, -600, 4000, 3000)
        c.fill()

        def calc(q):
            art.card(q, 160, 280, 980, 300, color=(0.18, 0.12, 0.14))
            plain(q, "250 ₽ × 22 дня", 650, 380, 56, F_BLACK, "white")
            if a1 > 0:
                P.counter(q, 5500 * ease_io(clamp(a1 / 0.8)), 650, 500, 76, "gold", suffix=" ₽ / мес")
            if a2 > 0:
                k = ease_back(clamp(a2 / 0.4))
                q.save()
                q.translate(650, 760)
                q.scale(k, k)
                title(q, "≈ 70 000 ₽ / ГОД", 0, 0, 100, "red")
                q.restore()
        f.mid.append(calc)
        f.cam = (700, 560, 1.0)


def s_night(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    f.night = 1.0
    draw_world(c, f, "bedroom")
    P.serega(c, 400, P.FLOOR_Y - 240, 0.9, t, "happy" if st == 1 else "neutral", "lie", phone=True, look=0.6)
    P.blanket(c, 640, t)
    # phone glow on the bed
    rg = cairo.RadialGradient(470, P.FLOOR_Y - 330, 0, 470, P.FLOOR_Y - 330, 300)
    rg.add_color_stop_rgba(0, 0.55, 0.8, 1.0, 0.35)
    rg.add_color_stop_rgba(1, 0.55, 0.8, 1.0, 0)
    c.set_source(rg)
    c.arc(470, P.FLOOR_Y - 330, 300, 0, 2 * math.pi)
    c.fill()
    a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
    cart = 0
    if st == 1:
        cart = (1 if a2 > 0.6 else 0) + (1 if a2 > 1.6 else 0)
    elif st == 3 and f.var == 1:
        cart = 3 + int(clamp(a2 / 2.0) * 4) if a2 > 0 else 2

    def screen(q, w, h):
        P.app_bg(q, w, h, top=(0.95, 0.40, 0.62), bot=(0.45, 0.20, 0.60))
        plain(q, "МАРКЕТ", 30, 70, 34, F_BLACK, "white", 1, "left")
        plain(q, "🛒" if False else f"КОРЗИНА: {cart}", w - 30, 70, 26, F_XB, "white", 1, "right")
        if st == 1:
            for i, (nm, pr, col) in enumerate((("Набор отвёрток", "1 490 ₽", "steel"), ("Светящийся кактус", "990 ₽", "green"))):
                y = 130 + i * 330
                rrect_path(q, 20, y, w - 40, 300, 24)
                q.set_source_rgba(1, 1, 1, 0.92)
                q.fill()
                shape(q, lambda r, y=y, col=col: rrect_path(r, 50, y + 30, 150, 150, 20), col, 1, shade=0.2, lw=3)
                if i == 1:
                    rg2 = cairo.RadialGradient(125, y + 105, 0, 125, y + 105, 110)
                    rg2.add_color_stop_rgba(0, 0.6, 1, 0.6, 0.6 + 0.3 * math.sin(t * 5))
                    rg2.add_color_stop_rgba(1, 0.6, 1, 0.6, 0)
                    q.set_source(rg2)
                    q.arc(125, y + 105, 110, 0, 2 * math.pi)
                    q.fill()
                plain(q, nm, 220, y + 80, 30, F_XB, (0.2, 0.15, 0.25), 1, "left")
                plain(q, pr, 220, y + 130, 36, F_BLACK, (0.85, 0.2, 0.4), 1, "left")
                bought = cart > i
                rrect_path(q, 50, y + 210, w - 100, 64, 32)
                q.set_source_rgb(*((0.3, 0.75, 0.45) if bought else (0.55, 0.25, 0.85)))
                q.fill()
                plain(q, "В КОРЗИНЕ ✓" if bought else "КУПИТЬ", w / 2, y + 254, 30, F_BLACK, "white")
        elif st == 2:
            rrect_path(q, 20, 130, w - 40, 560, 24)
            q.set_source_rgba(1, 1, 1, 0.92)
            q.fill()
            shape(q, lambda r: rrect_path(r, 60, 160, w - 120, 220, 20), "amber", 1, shade=0.2, lw=3)
            plain(q, "3 990 ₽", 60, 450, 36, F_XB, (0.5, 0.5, 0.55), 1, "left")
            q.move_to(56, 440)
            q.line_to(210, 440)
            q.set_line_width(5)
            q.set_source_rgb(0.85, 0.2, 0.3)
            q.stroke()
            plain(q, "1 190 ₽", 60, 520, 64, F_BLACK, (0.85, 0.2, 0.4), 1, "left")
            if a1 > 0:
                secs = max(0, 7198 - int(tl * 1))
                plain(q, f"ОСТАЛОСЬ {secs // 3600:02d}:{secs % 3600 // 60:02d}:{secs % 60:02d}", w / 2, 600, 30, F_BLACK, (0.85, 0.2, 0.3))
            if a2 > 0:
                plain(q, f"👀" if False else f"{30 + int(tl * 2) % 7} человек смотрят", w / 2, 650, 26, F_XB, (0.4, 0.35, 0.45))
        else:
            if f.var == 0:
                rrect_path(q, 20, 160, w - 40, 420, 24)
                q.set_source_rgba(1, 1, 1, 0.92)
                q.fill()
                title(q, "−70%", w / 2, 360, 120, "red")
                if a1 > 0:
                    plain(q, "на ненужную вещь", w / 2, 450, 30, F_XB, (0.3, 0.25, 0.35))
            else:
                plain(q, "До бесплатной доставки", w / 2, 180, 28, F_XB, "white")
                left = max(0, 1000 - (cart - 3) * 300)
                prog = 1 - left / 1000
                rrect_path(q, 30, 220, w - 60, 40, 20)
                q.set_source_rgba(1, 1, 1, 0.3)
                q.fill()
                rrect_path(q, 30, 220, (w - 60) * max(0.05, prog), 40, 20)
                q.set_source_rgb(*C("green"))
                q.fill()
                plain(q, f"осталось {left} ₽", w / 2, 310, 30, F_BLACK, "gold")
                for i in range(min(8, cart)):
                    shape(q, lambda r, i=i: rrect_path(r, 40 + (i % 4) * ((w - 80) / 4), 360 + (i // 4) * 140, (w - 80) / 4 - 16, 120, 16),
                          ["steel", "green", "amber", "pink", "blue", "purple", "teal", "gold"][i], 1, shade=0.2, lw=3)
    f.mid.append(lambda q: P.phone_ui(q, 1000, 520, 470, 880, screen, rot=0.03))
    if st == 1:
        f.head("ДЫРА №4", 0, 130, 70, "red", face=F_XB, x=520)
        f.head("03:00 НОЧИ", 0, 230, 100, "white", x=520)
    elif st == 2:
        f.head("ТЕБЯ ЛОВЯТ НА СКИДКУ", 0, 150, 70, "white", x=520)
    elif f.var == 0:
        f.head("−70% ≠ ЭКОНОМИЯ", 0, 150, 84, "gold", x=520)
        f.sub("100% ПОТЕРЯННЫХ ДЕНЕГ", 2, 1010, 60, "red", x=520)
    else:
        f.head("«БЕСПЛАТНАЯ» ДОСТАВКА", 0, 150, 76, "white", x=520)
    f.cam = (760, 560, 1.0)


def s_rule48(c, f):
    b, tl, t = f.b, f.tl, f.t
    f.night = 0.4
    draw_world(c, f, "bedroom")
    c.set_source_rgba(0.05, 0.03, 0.10, 0.4)
    c.paint()
    a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
    scenes2d.hourglass(c, 420, P.FLOOR_Y + 40, 1.2, clamp(a1 / 2.5) if a1 > 0 else 0.0, t)
    # cart with items, half of them puff away after {2}
    cx, cy = 900, P.FLOOR_Y + 20
    ground(c, cx, cy + 6, 220, 0.4)
    shape(c, lambda q: poly_path(q, [(cx - 200, cy - 260), (cx + 200, cy - 260), (cx + 160, cy - 60), (cx - 160, cy - 60)]), "steel", 1, shade=0.15)
    for wx in (-120, 120):
        shape(c, lambda q, wx=wx: ell_path(q, cx + wx, cy - 20, 30, 30), (0.25, 0.22, 0.3), 1, shade=0.2, lw=4)
    cols = ["green", "amber", "pink", "blue", "purple", "teal"]
    for i, col in enumerate(cols):
        gone = a2 > 0 and i % 2 == 1 and a2 > 0.3 + i * 0.12
        if gone:
            u = clamp((a2 - 0.3 - i * 0.12) / 0.5)
            if u < 1:
                c.arc(cx - 140 + (i % 3) * 140, cy - 300 - (i // 3) * 90 - 80 * u, 40 + 50 * u, 0, 2 * math.pi)
                c.set_source_rgba(1, 1, 1, 0.5 * (1 - u))
                c.fill()
            continue
        shape(c, lambda q, i=i, col=col: rrect_path(q, cx - 180 + (i % 3) * 130, cy - 360 - (i // 3) * 90, 110, 100, 14), col, 1, shade=0.2, lw=4)
    f.head("ПРАВИЛО 48 ЧАСОВ", 1, 150, 90, "gold", x=780)
    f.sub("ПОЛОВИНА ХОТЕЛОК ОТПАДЁТ", 2, 1010, 60, "green", x=780)
    f.cam = (760, 560, 1.0)


def s_split(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    f.night = 0.3
    draw_world(c, f, "room")
    c.set_source_rgba(0.06, 0.03, 0.10, 0.45)
    c.paint()
    a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
    if st == 3:
        f.night = 0.6
        P.hamster_wheel(c, 640, 520, 330, t)
        c.save()
        c.translate(640, 520)
        P.serega(c, 0, 300, 0.95, t * 1.5, "worried", "run", look=0.5)
        c.restore()
        for i in range(5):
            ph = (t * 0.8 + i / 5) % 1
            coin(c, 640 + 360 * math.cos(-t * 2 + i * 1.3), 520 + 360 * math.sin(-t * 2 + i * 1.3), 28, flip=math.cos(t * 5 + i))
        f.head("БЕГ ПО КРУГУ", 2, 150, 100, "red", x=780)
        f.sub("ТРАТИШЬ СЛЕДУЮЩУЮ ЗАРПЛАТУ", 1, 1010, 56, "white", x=780)
        f.cam = (760, 560, 1.0)
        return
    items = [("Наушники", "1/4", "blue"), ("Телефон", "3/12", "purple"), ("Кроссовки", "2/4", "amber"), ("Пылесос", "1/6", "teal"),
             ("Куртка", "2/3", "pink")]

    def cal(q):
        x0, y0, cw, ch = 140, 230, 1060, 690
        art.card(q, x0, y0, cw, ch, color=(0.94, 0.93, 0.97))
        plain(q, "ДЕКАБРЬ", x0 + cw / 2, y0 + 60, 40, F_BLACK, (0.25, 0.2, 0.3))
        for d in range(35):
            gx, gy = d % 7, d // 7
            xx, yy = x0 + 30 + gx * 143, y0 + 100 + gy * 115
            rrect_path(q, xx, yy, 133, 105, 12)
            q.set_source_rgba(0.85, 0.84, 0.9, 1)
            q.fill()
            if d < 31:
                plain(q, str(d + 1), xx + 12, yy + 30, 22, F_XB, (0.4, 0.38, 0.45), 1, "left")
        if st == 1 or f.var == 0:
            for i, (nm, part, col) in enumerate(items):
                ai = tl - 0.3 - i * 0.6
                if ai < 0:
                    continue
                if st == 2:
                    # everything slides to the same day (15th)
                    tgt = (14 % 7, 14 // 7)
                    src = ((3 + i * 5) % 7, (3 + i * 5) // 7 % 5)
                    u = ease_io(clamp((a1 + 0.2) / 1.0)) if a1 > -0.2 else 0.0
                    gx = src[0] + (tgt[0] - src[0]) * u
                    gy = src[1] + (tgt[1] - src[1]) * u
                    oy = -i * 26 * u
                else:
                    gx, gy = (3 + i * 5) % 7, (3 + i * 5) // 7 % 5
                    oy = 0
                k = ease_back(clamp(ai / 0.35))
                xx, yy = x0 + 30 + gx * 143 + 8, y0 + 100 + gy * 115 + 46 + oy
                q.save()
                q.translate(xx + 58, yy + 22)
                q.scale(k, k)
                shape(q, lambda r: rrect_path(r, -62, -24, 124, 48, 14), col, 1, shade=0.15, lw=3)
                plain(q, f"{nm[:7]} {part}", 0, 9, 18, F_XB, "white")
                q.restore()
        if st == 2 and f.var == 0 and a2 > 0:
            k = ease_back(clamp(a2 / 0.4))
            q.save()
            q.translate(x0 + cw / 2, y0 + ch / 2 + 40)
            q.scale(k, k)
            art.card(q, -330, -90, 660, 180, color=(0.95, 0.30, 0.34))
            plain(q, "БАЛАНС: 0 ₽", 0, 22, 70, F_BLACK, "white")
            q.restore()
        if st == 2 and f.var == 1:
            plain(q, "5 × 3 000 ₽", x0 + cw / 2, y0 + 260, 80, F_BLACK, (0.25, 0.2, 0.3))
            if a1 > 0:
                pop_title(q, "= 15 000 ₽ / МЕС", x0 + cw / 2, y0 + 400, 80, a1, "red")
            if a2 > 0:
                pop_title(q, "× ЕЩЁ 6 МЕСЯЦЕВ", x0 + cw / 2, y0 + 540, 64, a2, "gold")
    f.mid.append(cal)
    if st == 1:
        f.head("ДЫРА №5", 0, 110, 66, "red", face=F_XB, x=670)
        f.head("«ДОЛЯМИ»", 0, 200, 90, "white", x=670)
    f.cam = (760, 560, 1.0)


def s_fees(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    f.night = 0.2
    draw_world(c, f, "room")
    c.set_source_rgba(0.06, 0.03, 0.10, 0.45)
    c.paint()
    a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
    rows = [("Обслуживание карты", "−199 ₽"), ("Уведомления", "−99 ₽"), ("Перевод в другой банк", "−150 ₽"), ("Чужой банкомат", "−300 ₽")]
    if st in (1, 2) and not (st == 2 and f.var == 1):
        def screen(q, w, h):
            P.app_bg(q, w, h)
            plain(q, "ВЫПИСКА", w / 2, 70, 34, F_BLACK, "white")
            for i, (nm, v) in enumerate(rows):
                show = st == 2 or tl > 0.3 + i * 0.55
                if not show:
                    continue
                y = 130 + i * 110
                rrect_path(q, 16, y, w - 32, 92, 20)
                q.set_source_rgba(*C("red"), 0.18 + 0.12 * math.sin(t * 4 + i))
                q.fill()
                plain(q, nm, 34, y + 56, 26, F_XB, "white", 1, "left")
                plain(q, v, w - 34, y + 56, 28, F_BLACK, "red", 1, "right")
        f.mid.append(lambda q: P.phone_ui(q, 420, 540, 470, 820, screen, rot=-0.03))
    if st == 2 and f.var == 0:
        # coins fly from the statement into a growing bank tower
        hgt = 260 + 380 * ease_io(clamp(tl / b["dur"]))
        Wd.tower(c, 1080, 280, hgt, "БАНК", (0.45, 0.55, 0.85))
        for i in range(6):
            ph = (tl * 0.8 + i / 6) % 1
            coin(c, 600 + 480 * ease_io(ph), 600 - 300 * math.sin(math.pi * ph), 26, flip=math.cos(t * 6 + i))
        if a2 > 0:
            tag(c, "НОВЫЙ ОФИС", 1080, P.FLOOR_Y - hgt - 120, 32, "gold", alpha=clamp(a2 / 0.3))
        f.head("ПО 100–200 ₽", 0, 140, 86, "white", x=780)
    if st == 2 and f.var == 1:
        def sms(q):
            for i in range(4):
                ai = tl - 0.4 - i * 0.9
                if ai < 0:
                    continue
                k = ease_back(clamp(ai / 0.35))
                q.save()
                q.translate(560 + (i % 2) * 120, 330 + i * 150)
                q.scale(k, k)
                art.card(q, -380, -55, 760, 110, color=(0.25, 0.45, 0.85))
                txt = "Списано 99 ₽ за SMS-уведомления" if i < 3 else "…об этом списании 😐" if False else "Списано 99 ₽ за SMS об этом"
                plain(q, txt, 0, 12, fit(q, txt, 32, 700, F_XB), F_XB, "white")
                q.restore()
        f.mid.append(sms)
        f.head("SMS ПРО SMS", 0, 140, 90, "gold", x=780)
    if st == 3:
        def late(q):
            art.card(q, 160, 240, 900, 560, color=(0.94, 0.93, 0.97))
            plain(q, "ПЛАТЁЖ ПО КРЕДИТКЕ", 610, 320, 40, F_BLACK, (0.25, 0.2, 0.3))
            plain(q, "до 10 декабря", 610, 380, 32, F_XB, (0.45, 0.4, 0.5))
            if a1 > 0:
                pop_title(q, "ПРОСРОЧЕНО", 610, 520, 84, a1, "red")
            if a2 > 0:
                k = ease_back(clamp(a2 / 0.25))
                q.save()
                q.translate(700, 680)
                q.rotate(-0.12)
                q.scale(2.0 - k, 2.0 - k)
                rrect_path(q, -260, -55, 520, 110, 14)
                q.set_source_rgba(0.9, 0.2, 0.25, clamp(a2 / 0.15))
                q.set_line_width(10)
                q.stroke()
                plain(q, "ПЕНИ + ШТРАФ", 0, 22, 62, F_BLACK, (0.9, 0.2, 0.25), clamp(a2 / 0.15))
                q.restore()
        f.mid.append(late)
        f.head("ПРОСРОЧКИ", 0, 140, 96, "red", x=780)
    if st == 4:
        def toggles(q):
            art.card(q, 160, 260, 920, 520, color=(0.18, 0.15, 0.26))
            for i, (nm, on_after, k_) in enumerate((("Платные уведомления", False, 1), ("Платное обслуживание", False, 1), ("Автоплатёж по кредиту", True, 2))):
                y = 360 + i * 140
                plain(q, nm, 210, y + 14, 36, F_XB, "white", 1, "left")
                a = ag(b, k_, tl) - i * 0.3
                u = ease_io(clamp(a / 0.35)) if a > 0 else 0
                on = (not on_after) * (1 - u) + on_after * u
                rrect_path(q, 900, y - 30, 120, 60, 30)
                q.set_source_rgb(*(np.array(C("green")) * on + np.array([0.45, 0.43, 0.5]) * (1 - on)))
                q.fill()
                shape(q, lambda r, y=y, on=on: ell_path(r, 930 + 60 * on, y, 26, 26), "white", 1, shade=0.1, lw=3)
        f.mid.append(toggles)
        f.head("ОТКЛЮЧИ И НАСТРОЙ", 0, 140, 86, "green", x=780)
        f.sub("МИНУС ЕЩЁ ОДНА ДЫРА", 2, 1010, 60, "gold", x=780)
    if st == 1:
        f.head("ДЫРА №6", 0, 120, 66, "red", face=F_XB, x=900)
        f.head("КОМИССИИ", 0, 220, 96, "white", x=900)
    f.cam = (760, 560, 1.0)


def s_raise(c, f):
    b, tl, t = f.b, f.tl, f.t
    st = b.get("stage", 1)
    f.night = 0.15
    draw_world(c, f, "room")
    a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
    x0, y0 = 160, P.FLOOR_Y - 20
    inc = 80000 if (st == 1 and a1 < 0) else 120000
    if st == 1 and a1 >= 0:
        inc = 80000 + 40000 * ease_io(clamp(a1 / 1.0))
    scale = 640 / 130000
    if st == 3:
        # treadmill: both bars keep rising together while Серёга runs in place
        g = clamp(tl / b["dur"])
        inc = 80000 + 90000 * g
    art.block(c, x0 + 140, y0, 200, inc * scale, "green", label=None)
    plain(c, "ДОХОД", x0 + 140, y0 + 60, 34, F_BLACK, "green")
    P.counter(c, inc, x0 + 140, y0 - inc * scale - 30, 44, "green")
    exp = 0.0
    if st == 2 and f.var == 0:
        parts = [("КВАРТИРА", 45000, "purple", 0.4), ("МАШИНА В КРЕДИТ", 35000, "blue", an(b, 1)), ("РЕСТОРАНЫ", 40000, "amber", an(b, 2))]
    elif st == 2:
        parts = [("КВАРТИРА", 45000, "purple", -9), ("МАШИНА В КРЕДИТ", 35000, "blue", -9), ("РЕСТОРАНЫ", 40000, "amber", -9)]
    elif st == 3:
        parts = [("ТРАТЫ", inc * 0.98, "red", -9)]
    else:
        parts = []
    yy = y0
    for nm, v, col, t0 in parts:
        u = ease_back(clamp((tl - t0) / 0.5))
        if u <= 0:
            continue
        hh = v * scale * u
        art.block(c, x0 + 440, yy, 200, hh, col)
        if hh > 50:
            plain(c, nm, x0 + 440, yy - hh / 2 + 10, fit(c, nm, 26, 180, F_XB), F_XB, "white")
        yy -= hh
        exp += v * u
    if parts:
        plain(c, "РАСХОДЫ", x0 + 440, y0 + 60, 34, F_BLACK, "red")
    mood = "joy" if st == 1 and a2 > 0 else ("happy" if st == 1 else ("worried" if st == 2 else "sad"))
    if st == 3:
        P.serega(c, 1050, P.FLOOR_Y + 10, 1.0, t * 1.4, "worried", "run", look=-0.5)
        shape(c, lambda q: rrect_path(q, 850, P.FLOOR_Y - 10, 420, 40, 20), (0.22, 0.20, 0.27), 1, shade=0.2)
    else:
        jump = 120 * abs(math.sin(min(a2, 1.8) * 4.4)) * (1 - clamp(a2 / 2.0)) if (st == 1 and a2 > 0) else 0.0
        P.serega(c, 1050, P.FLOOR_Y + 10, 1.0, t, mood, "jump" if jump > 4 else "stand", bounce=jump, look=-0.6)
    if st == 2 and f.var == 1:
        def bubbles(q):
            for i, s_ in enumerate(("«Я ЖЕ БОЛЬШЕ ЗАРАБАТЫВАЮ»", "«Я ЗАСЛУЖИЛ»", "«ОДИН РАЗ ЖИВЁМ»")):
                a = ag(b, i, tl) if i else tl - 0.2
                if a < 0:
                    continue
                k = ease_back(clamp(a / 0.35))
                q.save()
                q.translate(1100, 280 + i * 130)
                q.scale(k, k)
                art.card(q, -280, -48, 560, 96, color=(0.98, 0.97, 1.0))
                plain(q, s_, 0, 12, fit(q, s_, 30, 520, F_XB), F_XB, (0.3, 0.2, 0.35))
                q.restore()
        f.ui.append(bubbles)
    if st == 1:
        f.head("ДЫРА №7", 0, 120, 66, "red", face=F_XB, x=900)
        f.head("120 000 ₽ !", 1, 220, 100, "green", x=900)
    elif st == 2 and f.var == 0:
        f.head("ЧЕРЕЗ ПОЛГОДА", 0, 140, 86, "white", x=900)
    elif st == 3:
        f.head("ИНФЛЯЦИЯ ОБРАЗА ЖИЗНИ", 0, 140, 72, "red", x=900)
        f.sub("БЕЖИШЬ — НО СТОИШЬ НА МЕСТЕ", 2, 1010, 54, "white", x=900)
    f.cam = (800, 560, 1.0)


FIX_NAMES = ["ЗАПИСЫВАЙ ТРАТЫ", "СНАЧАЛА — СЕБЕ", "ЛИМИТЫ", "РЕВИЗИЯ РАЗ В МЕСЯЦ"]


def s_fix(c, f):
    b, tl, t = f.b, f.tl, f.t
    stp = b.get("step", 1)
    st = b.get("stage", 1)
    draw_world(c, f, "desk")
    a1, a2 = ag(b, 1, tl), ag(b, 2, tl)
    top = P.FLOOR_Y - 330
    if stp == 1:
        # notebook with handwritten expenses
        shape(c, lambda q: rrect_path(q, 300, top - 360, 600, 360, 14), (0.99, 0.97, 0.90), 1, shade=0.08)
        for k in range(8):
            c.move_to(330, top - 320 + k * 40)
            c.line_to(870, top - 320 + k * 40)
        c.set_line_width(2)
        c.set_source_rgba(0.6, 0.7, 0.9, 0.6)
        c.stroke()
        lines = [("кофе", "250"), ("такси", "680"), ("доставка", "1 240"), ("жвачка", "59"), ("подписка", "399"), ("шоколадка", "89"), ("маркет", "2 990")]
        n = int(clamp(tl / max(1.0, b["dur"] - 1.0)) * len(lines) + 0.999) if st == 1 else len(lines)
        for i, (nm, v) in enumerate(lines[:n]):
            plain(c, nm, 340, top - 328 + i * 40 + 30, 28, F_XB, (0.2, 0.25, 0.55), 1, "left")
            plain(c, v + " ₽", 860, top - 328 + i * 40 + 30, 28, F_XB, (0.75, 0.2, 0.3), 1, "right")
        P.serega(c, 1080, P.FLOOR_Y + 10, 1.0, t, "shock" if st == 2 else "neutral", "stand", look=-0.6)
        if st == 2 and a1 > 0:
            # magnifier over the sum
            k = ease_back(clamp(a1 / 0.4))
            c.save()
            c.translate(700, top - 120)
            c.scale(k, k)
            shape(c, lambda q: ell_path(q, 0, 0, 130, 130), (0.85, 0.95, 1.0), 0.6, shade=0.05, light=0.1, lw=8)
            title(c, "5 707 ₽", 0, 20, 60, "red")
            c.restore()
    elif stp == 2:
        # payday: coins flow; the first 15% go straight into the savings jar
        P.jar(c, 820, top, 200, 260, (0.2 + 0.5 * ease_io(clamp(a1 / 2.0))) if a1 > 0 else 0.2, "gold", "НАКОПЛЕНИЯ", lid="green")
        wallet_x = 420
        shape(c, lambda q: rrect_path(q, wallet_x - 120, top - 150, 240, 150, 20), "brown", 1, shade=0.2)
        plain(c, "НА ЖИЗНЬ", wallet_x, top - 60, 30, F_BLACK, "cream")
        if a1 > 0:
            for i in range(8):
                ph = (a1 * 0.7 - i * 0.12)
                if 0 < ph < 1:
                    tgt = 820 if i < 3 else wallet_x
                    u = ease_io(ph)
                    coin(c, 620 + (tgt - 620) * u, top - 600 + (460 if tgt == wallet_x else 330) * u - 160 * math.sin(math.pi * u), 30,
                         flip=math.cos(t * 7 + i))
        if st == 2:
            # eye closed icon over the jar: what you do not see, you do not spend
            k = ease_back(clamp(tl / 0.4))
            c.save()
            c.translate(820, top - 330)
            c.scale(k, k)
            shape(c, lambda q: (q.move_to(-80, 0), q.curve_to(-40, 40, 40, 40, 80, 0)), INK, 1, shade=0, light=0, lw=10)
            for i in range(5):
                c.move_to(-60 + i * 30, 22)
                c.line_to(-66 + i * 33, 44)
            c.set_line_width(7)
            c.set_source_rgba(*INK, 1)
            c.stroke()
            c.restore()
        P.serega(c, 1100, P.FLOOR_Y + 10, 1.0, t, "happy", "stand", look=-0.6)
    elif stp == 3:
        names = [("ЖИЛЬЁ", "purple"), ("ЕДА", "green"), ("ТРАНСПОРТ", "blue"), ("РАЗВЛЕЧЕНИЯ", "amber")]
        for i, (nm, col) in enumerate(names):
            a = (a1 - i * 0.3) if a1 > 0 else -1
            x = 290 + i * 210
            if st == 1:
                P.jar(c, x, top, 150, 200, 0.6 * ease_io(clamp(a / 0.8)) if a > 0 else 0.0, col, None, lid=col)
                tag(c, nm, x, top - 260, 22, col)
            else:
                k = ease_back(clamp((tl - 0.3 - i * 0.25) / 0.4))
                c.save()
                c.translate(x, top - 120)
                c.scale(k, k)
                c.rotate(-0.08 + 0.05 * i)
                shape(c, lambda q, col=col: rrect_path(q, -95, -60, 190, 120, 14), col, 1, shade=0.15)
                shape(c, lambda q: rrect_path(q, -70, -30, 40, 30, 6), "gold", 1, shade=0.2, lw=3)
                plain(c, nm, 0, 42, fit(c, nm, 22, 170, F_XB), F_XB, "white")
                c.restore()
        P.serega(c, 1150, P.FLOOR_Y + 10, 1.0, t, "happy", "stand", look=-0.6)
    else:
        def review(q):
            art.card(q, 160, 240, 900, 560, color=(0.18, 0.15, 0.26))
            for i, nm in enumerate(("ПОДПИСКИ", "ТАРИФЫ БАНКА", "РАССРОЧКИ")):
                a = ag(b, 1, tl) - i * 0.35
                y = 360 + i * 120
                rrect_path(q, 210, y - 40, 70, 70, 16)
                q.set_source_rgba(1, 1, 1, 0.15)
                q.fill()
                if a > 0:
                    check(q, 245, y - 5, 54, a / 0.35)
                plain(q, nm, 320, y + 14, 44, F_BLACK, "white", 1, "left")
            if ag(b, 2, tl) > 0:
                pop_title(q, "20 МИНУТ = ТЫСЯЧИ ₽", 610, 740, 60, ag(b, 2, tl), "gold")
        f.mid.append(review)
        P.serega(c, 1180, P.FLOOR_Y + 10, 1.0, t, "happy", "stand", look=-0.6)
    if st == 1:
        f.head(f"ШАГ {stp}", 0, 120, 80, "gold", x=700)
        f.head(FIX_NAMES[stp - 1], 0, 215, 76, "white", x=700)
    elif stp == 1:
        f.head("НЕПРИЯТНО, НО НУЖНО", 0, 150, 80, "white", x=700)
    elif stp == 2:
        f.head("НЕ ВИДИШЬ — НЕ ТРАТИШЬ", 0, 150, 76, "gold", x=700)
    elif stp == 3:
        f.head("КАЖДОЙ КУЧКЕ — СВОЯ КАРТА", 0, 150, 70, "white", x=700)
    if stp == 2 and st == 1:
        f.sub("10–20% В ДЕНЬ ЗАРПЛАТЫ", 1, 1010, 60, "green", x=700)
    f.cam = (760, 470, 1.0)


SCENES = {k[2:]: v for k, v in globals().items() if k.startswith("s_")}


# ------------------------------------------------------------------ compositor
def render(b, tl, t, level, beats, body=None):
    if b["scene"] in DELEGATE:
        bb = dict(b)
        bb["_body"] = level if body is None else body
        return scenes2d.render(bb, tl, t, level, beats)
    f = F(b, tl, t, beats)
    surf = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    c = cairo.Context(surf)
    shout = b.get("style") == "shout"
    # world in camera space: settle-in + slow push over the beat
    c.save()
    cx0, cy0, z0 = 860, 560, 1.0
    rec = cairo.RecordingSurface(cairo.CONTENT_COLOR_ALPHA, None)
    rc = cairo.Context(rec)
    SCENES[b["scene"]](rc, f)
    cx, cy, z = f.cam
    k_in = ease(tl / 0.9)
    prog = clamp(tl / max(0.1, b["dur"]))
    z = z * (1.0 + 0.05 * (1 - k_in)) * (1 + 0.035 * ease_io(prog)) * (1 + (0.035 * ease(tl / 0.5) + 0.01 * level if shout else 0))
    c.translate(W / 2, H / 2)
    if shout:
        c.rotate(0.006 * math.sin(t * 1.8))
    c.scale(z, z)
    c.translate(-cx, -cy)
    c.set_source_surface(rec)
    c.paint()
    c.restore()
    for fn in f.mid:
        fn(c)
    if shout:
        art.shout_fx(c, tl, t, level, 1610, H + 6 - 680 * 0.56, b.get("words", []), layer="back")
    # narrator v2 on the right
    cs = cairo.ImageSurface(cairo.FORMAT_ARGB32, W, H)
    cc = cairo.Context(cs)
    st = character.perform_v2(t, level, b.get("words", []), tl, b.get("pose", "explain"), b.get("emo", "neutral"), seed=b["idx"],
                              body_level=level if body is None else body)
    if shout:
        st["emo"] = st["emo2"] = "angry"
    st["look"] = -0.7
    prev = beats[b["idx"] - 1] if b["idx"] > 0 else None
    enter = prev is None or prev.get("char", "center") != b.get("char", "center") or prev["scene"] in DELEGATE and prev.get("char") != "right"
    kk = ease(tl / 0.45) if enter else 1.0
    character.draw(cc, 1610, H + 6 + (1 - kk) * 200, 0.56, st)
    cine.drop_shadow(c, cs, -36, 6, 22, 0.45)
    c.set_source_surface(cs)
    c.paint()
    for fn in f.ui:
        fn(c)
    if shout:
        art.shout_fx(c, tl, t, level, 1610, H + 6 - 680 * 0.56, b.get("words", []), layer="front")
    flash = 0.06 * (1 - tl / 0.15) if (tl < 0.15 and b["idx"] > 0) else 0.0
    return cine.post(cine.to_np(surf), t, bloom=0.16, grain=0.0, flash=flash)
