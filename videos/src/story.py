from engine import *
import engine


def S(text, draw, **kw):
    d = dict(text=text, draw=draw, pre=0.15, post=0.25, night=0.0, green=0.0, zoom=(1.0, 1.06, 360, 640),
             sfx=[], flash=[], shake=[], badge=None, top=None, fx=None, dur=None, glitch=[], red=0, roll=0,
             flicker=False)
    d.update(kw)
    d["sfx"] = list(d["sfx"]) + [(g, "glitch") for g in d["glitch"]]
    return d


def vl():
    return engine.VLEVEL


def sleeping(ctx, x, y, st=HERO, eyes="closed", t=0, talk=False):
    """Person lying on the bed, face up, under a blanket that rises with breathing."""
    skin = st.get("skin", SKIN)
    hx, hy = 112, 852
    rrect(ctx, 52, 858, 110, 40, 16, "#FFFFFF")
    ocircle(ctx, hx, hy, 40, skin, 3)
    col(ctx, st["hair"])
    ctx.arc(hx, hy, 42, math.pi * 0.55, math.pi * 1.25)
    ctx.close_path()
    ctx.fill()
    ocircle(ctx, hx + 8, hy - 42, 7, darken(skin, 0.92), 2)
    for ox in (-10, 12):
        cx, cy = hx + ox, hy - 22
        if eyes == "closed":
            col(ctx, "#222222")
            ctx.set_line_width(3)
            ctx.arc(cx, cy - 3, 7, math.pi * 0.15, math.pi * 0.85)
            ctx.stroke()
        else:
            r = 11 if eyes in ("wide", "creepy") else 9
            ocircle(ctx, cx, cy, r, "#FFFFFF", 2.2)
            pr = 2.6 if eyes == "creepy" else 4.2
            circle(ctx, cx + 2, cy - 3, pr, "#151515")
            if st.get("copy"):
                glow(ctx, cx + 2, cy - 3, 14, "#7CFFA0", 0.7)
                circle(ctx, cx + 2, cy - 3, 1.9, "#B6FFC8")
    if talk and vl() > 0.12:
        col(ctx, "#4A1818")
        ctx.save()
        ctx.translate(hx + 26, hy - 4)
        ctx.scale(0.3 + 1.0 * vl(), 1.0)
        ctx.arc(0, 0, 8, 0, 2 * math.pi)
        ctx.restore()
        ctx.fill()
    elif eyes == "creepy":
        col(ctx, "#4A1818")
        ctx.set_line_width(3)
        ctx.arc(hx + 18, hy - 6, 14, -0.9, 0.9)
        ctx.stroke()
    elif eyes == "wide":
        circle(ctx, hx + 26, hy - 4, 5, "#4A1818")
    br = 1 + 0.035 * math.sin(t * 1.6)
    ctx.save()
    ctx.translate(0, 900)
    ctx.scale(1, br)
    ctx.translate(0, -900)
    col(ctx, "#3F6FA8")
    ctx.move_to(140, 900)
    ctx.curve_to(150, 835, 210, 838, 240, 850)
    ctx.curve_to(290, 860, 320, 845, 368, 862)
    ctx.line_to(372, 905)
    ctx.close_path()
    ctx.fill_preserve()
    col(ctx, "#1C1820")
    ctx.set_line_width(3)
    ctx.stroke()
    line(ctx, 175, 870, 220, 880, 3, "#2F5A8C")
    line(ctx, 260, 875, 320, 868, 3, "#2F5A8C")
    ctx.restore()


def footprints(ctx, a):
    for i in range(7):
        x = 160 + i * 52
        y = 1120 - i * 30
        col(ctx, "#16293A", 0.9 * a)
        ctx.save()
        ctx.translate(x + (12 if i % 2 else -12), y)
        ctx.scale(1, 0.55)
        ctx.arc(0, 0, 19, 0, 2 * math.pi)
        ctx.restore()
        ctx.fill()


KNOCK3 = [0.0, 0.42, 0.84]
RHYTHM = [0.0, 0.62, 0.86]


def ks(t0, pattern=KNOCK3, name="knock"):
    return [(t0 + k, name) for k in pattern]


def phase(t, a, b):
    return ease((t - a) / max(b - a, 1e-3))


def hit(t, t0, pattern, w=0.12):
    return any(0 < t - t0 - k < w for k in pattern)


EP = {}

# ------------------------------------------------------------------ EPISODE 1
EP[1] = dict(title="ДЕШЁВАЯ КВАРТИРА", shots=[
    # cold open hook
    S("Если в {3:07|три ноль семь} из-под пола стучат — !никогда! не отвечай.",
      lambda c, x, t, T: hatch_close(c, x, t, dict(scratch=1.0, fingers=phase(t, 0.6, T - 0.3))),
      top=("ПРАВИЛО №1", "НЕ ОТВЕЧАЙ"), night=0.7, red=0.5, zoom=(1.0, 1.35, 360, 700),
      sfx=ks(0.0) + [(-0.6, "riser")], glitch=[0.0, -0.35], shake=[(k, 0.12, 9) for k in KNOCK3], roll=(-3, 3)),
    S("Ты снял квартиру за *пять тысяч* в месяц.",
      lambda c, x, t, T: (building(c, x, t, dict(mark=True)),
                          person(c, 540, 1150, 0.85, -1, LANDLORD, dict(emo="smirk"), t),
                          person(c, lerp(-80, 280, phase(t, 0, T * 0.8)), 1150, 0.85, 1, HERO,
                                 dict(walk_pose(t) if t < T * 0.8 else {}, emo="calm"), t)),
      badge=("АРЕНДА 5 000 ₽", "#FFD21E"), flash=[0.0]),
    S("Хозяин отдал ключи и странно постучал по двери.",
      lambda c, x, t, T: (building(c, x, t, {}),
                          person(c, 260, 1150, 0.85, 1, HERO,
                                 dict(handF=(120, -170), emo="worry" if t > T - 1.3 else "calm"), t),
                          person(c, 480, 1150, 0.85, -1, LANDLORD,
                                 dict(armF=(100 + 25 * hit(t, T - 1.2, RHYTHM), 120), emo="smirk"), t)),
      zoom=(1.0, 1.15, 380, 900), post=1.3, sfx=ks(-1.2, RHYTHM)),
    S("И сказал: «Ночью в *подвал* не спускайся».",
      lambda c, x, t, T: landlord_close(c, x, t, dict(talk=t > 0.9, keys=True,
                                                    emo="evil" if t > T - 1.0 else "smirk")),
      zoom=(1.0, 1.15, 360, 560), sfx=[(-0.9, "hit")]),
    S("Но подвала в этом доме !нет!. Под тобой — бетон.",
      lambda c, x, t, T: section(c, x, t, dict(reveal=0.0, figs=[dict(x=330, y=545, s=0.5,
                                                                        pose=dict(emo="worry", pupil=(0, 1)))])),
      badge=("ПОДВАЛА НЕТ", "#FF4A3A")),
    S("Первая ночь. Ровно в {3:07|три ноль семь}…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06" if t < T - 0.9 else "03:07")),
                          sleeping(c, 340, 880, t=t)),
      night=1.0, zoom=(1.0, 1.5, 385, 580), post=0.6, sfx=[(-0.9, "tick")], glitch=[-0.9]),
    S("…*стук*. Три удара. Прямо из-под !пола!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07")),
                          sitting_bed(c, HERO, "terror", t, dict(mark="!", mark_t=t - 0.2)) if t > 0.15 else
                          sleeping(c, 340, 880, t=t)),
      night=1.0, pre=1.5, sfx=ks(0.1) + [(0.5, "heart")], shake=[(0.1 + k, 0.15, 12) for k in KNOCK3],
      zoom=(1.45, 1.6, 230, 820), roll=(0, -4), red=0.3),
    S("Ты прикладываешь ухо к полу. *Тишина*.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07")),
                          person(c, 600, 1120, 0.95, 1, HERO, dict(lie=True, emo="fear", pupil=(0, 1)), t)),
      night=1.0, zoom=(1.0, 1.3, 330, 1050), post=0.6),
    S("Внизу кто-то *дышит*. Прямо под твоей !щекой!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:08")),
                          person(c, 600, 1120, 0.95, 1, HERO, dict(lie=True, emo="terror", pupil=(0, 1)), t),
                          shadow_eyes(c, 330, 1170, t, 0.6, "#FF3B30", phase(t, 0.8, 2.0))),
      night=1.0, zoom=(1.8, 2.3, 300, 1110), post=0.5, sfx=[(0.2, "breath")], red=0.6, roll=(2, -2)),
    S("Утром ты срываешь ковёр. А под ним — !люк!.",
      lambda c, x, t, T: hatch_close(c, x, t, dict(carpet_off=phase(t, 0.4, T - 1.0), scratch=0)),
      sfx=[(-1.0, "hit")], shake=[(-1.0, 0.3, 10)]),
    S("На крышке нацарапано: «!Не отвечай!».",
      lambda c, x, t, T: hatch_close(c, x, t, dict(scratch=phase(t, 0.6, T - 0.2))), zoom=(1.0, 1.25, 360, 520),
      sfx=[(0.6, "scratch")]),
    S("Царапины свежие. Будто писали !снизу!.",
      lambda c, x, t, T: hatch_close(c, x, t, dict(scratch=1.0)), zoom=(1.2, 1.5, 360, 560), post=0.4,
      glitch=[-0.4], red=0.3),
    S("Следующей ночью стук *повторяется*. И ты не выдерживаешь…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False)),
                          person(c, 170, 1100, 1.1, 1, HERO, dict(emo="fear" if t < T * 0.6 else "angry"), t)),
      night=1.0, pre=1.4, sfx=ks(0.1), shake=[(0.1 + k, 0.15, 8) for k in KNOCK3], flicker=True),
    S("…и стучишь в ответ. *Три раза*.",
      lambda c, x, t, T: fist_floor(c, x, t, dict(hits=[T - 1.4 + k for k in KNOCK3])),
      night=0.8, post=1.5, sfx=ks(-1.4), shake=[(-1.4 + k, 0.12, 10) for k in KNOCK3],
      zoom=(1.0, 1.15, 360, 800), roll=(-2, 2)),
    S("Тишина…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False)),
                          person(c, 250, 1100, 1.1, 1, HERO, dict(emo="worry", pupil=(1, 0)), t)),
      night=1.0, post=1.0, zoom=(1.1, 1.3, 330, 760), sfx=[(0.2, "heart")]),
    S("А потом стук раздаётся… изнутри твоего !шкафа!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False, wopen=0.1,
                                             weyes=t > T - 1.7, shake=1.0 if t > T - 1.4 else 0.0)),
                          person(c, 250, 1100, 1.1, 1, HERO,
                                 dict(emo="terror" if t > T - 1.3 else "fear", pupil=(1, -0.5),
                                      handF=(40, -300) if t > T - 1.3 else None,
                                      mark="!" if t > T - 1.3 else None, mark_t=t - (T - 1.3)), t)),
      night=1.0, post=1.4, zoom=(1.0, 1.3, 430, 720), sfx=ks(-1.4) + [(-1.4, "hit"), (-2.6, "riser")],
      shake=[(-1.4, 1.0, 8)], glitch=[-1.0], red=0.5, roll=(0, 5)),
], next="СЕРИЯ 2")

# ------------------------------------------------------------------ helpers for the retention cut (eps 2-5)


def ff(draw, at):
    """Flash-forward: freeze-ish frame of a later shot, drawn at a fixed moment."""
    return lambda c, x, t, T: draw(c, x, at + t * 0.3, 4.0)


def phone_in_hand(c, x, t, T, emo="fear", press=False):
    room(c, x, t, dict(time="03:08", hatch="closed", carpet=False))
    person(c, 300, 1060, 0.95, 1, HERO, dict(emo=emo, handF=(55, -250), handB=(40, -230) if press else None), t)
    rrect(c, 335, 770, 30, 52, 6, "#111111")
    rrect(c, 338, 774, 24, 42, 4, "#3D6BFF")
    glow(c, 350, 795, 90, "#3D6BFF", 0.35)
    if not press and int(t * 6) % 2 == 0:
        circle(c, 350, 760, 4, "#2EB85C")


def ep2_final(c, x, t, T):
    room(c, x, t, dict(time="03:09", hatch="open", carpet=False, fingers=phase(t, 0.4, 1.8)))
    person(c, 160, 1060, 0.95, 1, HERO, dict(emo="terror", handF=(40, -300), lean=-10, mark="!", mark_t=t), t)


# ------------------------------------------------------------------ EPISODE 2
EP[2] = dict(title="ТЕТРАДЬ", endcard=False, progress=True, tempo=1.06,
             cta=("А ТЫ БЫ СПУСТИЛСЯ?", "ДА / НЕТ — ПИШИ В КОММЕНТЫ", 3.2, "СЕРИЯ 3 — УЖЕ В ПРОФИЛЕ"), shots=[
    S("Через минуту ты пожалеешь, что взял !трубку!.",
      ff(ep2_final, 1.5), top=("ЧАСТЬ 2", "ЧЕРЕЗ 60 СЕКУНД…"), night=1.0, red=0.6, glitch=[0.0, -0.25],
      sfx=[(0.0, "hit")], zoom=(1.4, 1.25, 375, 950), roll=(-4, 0)),
    S("Из-под пола стучат в {3:07|три ноль семь}. А теперь звонят — с !твоего номера!.",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=True)), night=0.4, red=0.3, sfx=[(0.0, "ring")],
      zoom=(1.25, 1.0, 360, 600), roll=(3, -1), flash=[0.0]),
    S("Но сначала — стук из шкафа. Ты рывком распахиваешь дверцы. Внутри — только *куртки*.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:08", wopen=phase(t, 0.9, 1.4))),
                          person(c, 380, 1060, 0.9, 1, HERO,
                                 dict(handF=(150, -250) if t < 1.5 else (110, -150),
                                      emo="terror" if t < 1.5 else "worry", lean=8 if t < 1.5 else 0), t)),
      night=1.0, sfx=[(0.9, "creak"), (0.9, "hit")], shake=[(0.9, 0.3, 12)], zoom=(1.0, 1.15, 520, 700)),
    S("А на дне — !чужая тетрадь!.",
      lambda c, x, t, T: wardrobe_in(c, x, t, {}), night=0.6, zoom=(1.0, 1.3, 365, 820), glitch=[-0.3]),
    S("«День первый. Стук в {3:07|три ноль семь}».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", 0.1, T - 0.4)])),
      sfx=[(0.1, "scratch")], zoom=(1.0, 1.08, 360, 500)),
    S("«День пятый. Оно знает мой *голос*».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", -9, 1),
                                                       ("День 5. Оно знает мой голос", 0.1, T - 0.4)])),
      sfx=[(0.1, "scratch")], zoom=(1.08, 1.16, 360, 520)),
    S("«День девятый. Теперь !стучу я!».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", -9, 1),
                                                       ("День 5. Оно знает мой голос", -9, 1),
                                                       ("", -9, 1),
                                                       ("День 9. Теперь стучу Я", 0.1, T - 0.4)],
                                                red={3: True})),
      zoom=(1.0, 1.3, 360, 700), sfx=[(0.1, "scratch"), (-0.4, "hit")], glitch=[-0.4], red=0.4),
    S("А на последней странице: «Если читаешь это — !не бери трубку!».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("", -9, 1), ("", -9, 1), ("", -9, 1), ("", -9, 1),
                                                       ("Не бери трубку!", 0.6, T - 0.6)], red={4: True})),
      zoom=(1.15, 1.35, 300, 860), red=0.5, sfx=[(0.6, "scratch"), (-0.3, "hit")], glitch=[-0.3], roll=(0, 3)),
    S("Соседка, баба Зина, *бледнеет*, увидев тетрадь.",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, gemo="shock" if t > 0.8 else "neutral",
                                                  ghand=(40, -250) if t < 0.8 else (35, -300))),
      sfx=[(0.8, "heart")]),
    S("«Это почерк Вити. Он !пропал! прошлой весной».",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, talk=True, gemo="sad", hemo="fear")),
      zoom=(1.1, 1.3, 520, 640)),
    S("«Он тоже жаловался на стук. А хозяин потом сдал квартиру — *дешевле*».",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, talk=True, gemo="fear", hemo="terror")),
      zoom=(1.3, 1.5, 470, 640), badge=("БЫЛО 8 000, СТАЛО 5 000 ₽", "#FFD21E"), red=0.2),
    S("Ночью звонит телефон. На экране — !твой номер!.",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=True)), sfx=[(0.0, "ring")], night=0.3,
      zoom=(1.0, 1.15, 360, 560)),
    S("Ты помнишь запись в тетради. Но палец сам жмёт *«ответить»*.",
      lambda c, x, t, T: phone_in_hand(c, x, t, T, emo="fear" if t < T - 0.8 else "terror", press=t > T - 0.8),
      night=1.0, zoom=(1.3, 1.7, 330, 800), sfx=[(0.0, "heart"), (-0.8, "hit")], red=0.4, roll=(0, -3)),
    S("И ты слышишь… !свой голос!.",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=False)), night=0.3, zoom=(1.0, 1.2, 360, 600),
      glitch=[-0.5]),
    S("«Не открывай люк. Только *не открывай*».",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=False)), night=0.3, fx="phone",
      zoom=(1.2, 1.4, 360, 600), red=0.3, roll=(0, -3)),
    S("За спиной — !скрип!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:09", hatch="closed", carpet=False)),
                          person(c, 300, 1060, 0.95, 1 if t < T * 0.5 else -1, HERO,
                                 dict(emo="fear", handF=(60, -170)), t)),
      night=1.0, sfx=[(0.0, "creak"), (0.2, "heart")], zoom=(1.3, 1.2, 300, 750), flicker=True),
    S("Люк уже !открыт!. А ты бы спустился? Пиши в комментариях.",
      ep2_final, night=1.0, sfx=[(0.1, "hit"), (-1.5, "riser")], zoom=(1.0, 1.4, 375, 1000), glitch=[0.1],
      red=0.6, shake=[(0.1, 0.4, 12)], roll=(0, -4)),
])

# ------------------------------------------------------------------ EPISODE 3


def copy_room(c, x, t, eyes="closed", time="03:06", talk=False):
    room(c, x, t, dict(time=time, green=True, carpet=True))
    sleeping(c, 340, 880, COPY, eyes=eyes, t=t, talk=talk)


def copy_sits(c, x, t, T):
    room(c, x, t, dict(time="03:07", green=True, carpet=True))
    sitting_bed(c, COPY, "creepy", t, dict(talk=True, handF=(130, -230)))


def stairs_dark(c, x, t, T):
    stairs_down(c, x, t + 9, dict(count=False))
    on = t > T - 1.0 or (int(t * 9) % 4 == 0 and t < 1.0)
    if not on:
        rect(c, -300, -300, W + 600, 2000, "#000000", 0.93)
        shadow_eyes(c, 560, 700, t, 0.8, "#FF3B30", phase(t, 0.8, 1.4))


EP[3] = dict(title="ПОДВАЛ", endcard=False, progress=True, tempo=1.06,
             cta=("ЧТО БЫ ТЫ СДЕЛАЛ?", "ПИШИ В КОММЕНТЫ", 3.2, "СЕРИЯ 4 — УЖЕ В ПРОФИЛЕ"), shots=[
    S("Через минуту ты встретишь !себя!.",
      ff(copy_sits, 2.0), top=("ЧАСТЬ 3", "ЧЕРЕЗ 60 СЕКУНД…"), night=0.5, green=1.0, red=0.6,
      glitch=[0.0, -0.25], sfx=[(0.0, "hit")], zoom=(1.7, 1.5, 160, 760), roll=(-5, 0)),
    S("Люк открыт. И снизу тебя !зовут!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:10", hatch="open", carpet=False)),
                          person(c, 170, 1060, 0.95, 1, HERO, dict(emo="fear", handF=(110, -170)), t)),
      night=1.0, zoom=(1.0, 1.25, 380, 1000), sfx=[(0, "wind"), (0.2, "breath")], flash=[0.0]),
    S("Ты берёшь фонарик и спускаешься. Ступенек !больше!, чем должно быть.",
      lambda c, x, t, T: stairs_down(c, x, t, dict(count=True)), sfx=[(0.3, "steps")]),
    S("Сорок. Пятьдесят. Шестьдесят. А дом — *пятиэтажка*.",
      lambda c, x, t, T: stairs_down(c, x, t + 6, dict(count=True, speed=1.8)), sfx=[(0.1, "steps")],
      badge=("ДОМ: 5 ЭТАЖЕЙ", "#FF4A3A"), roll=(0, 4)),
    S("И тут фонарик !гаснет!.",
      stairs_dark, sfx=[(0.0, "hit"), (0.3, "heart"), (0.6, "breath")], red=0.4, roll=(0, -3)),
    S("Он мигает и загорается. Перед тобой — коридор *длиннее дома*.",
      lambda c, x, t, T: section(c, x, t, dict(reveal=phase(t, 0, 1.0), endless=True,
                                             figs=[dict(x=230, y=1110, s=0.42, pose=dict(emo="fear"))])),
      zoom=(1.0, 1.15, 360, 800)),
    S("На каждой двери — номер !твоей квартиры!. А в конце что-то *моргает*.",
      lambda c, x, t, T: (corridor(c, x, t, dict(move=0.6, tally=False)),
                          shadow_eyes(c, 360, 560, t, 0.5, "#FF3B30", phase(t, 1.5, 2.5))),
      badge=("КВ. 1", "#5CFF8A"), night=0.2, flicker=True, zoom=(1.0, 1.35, 360, 560)),
    S("На стенах — сотни зарубок. И имя: !«Витя»!.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=4.0, move=0.3, tally=True)), night=0.3,
      zoom=(1.0, 1.4, 160, 560), badge=("ВИТЯ", "#FF4A3A"), sfx=[(-0.5, "hit")]),
    S("Одна дверь приоткрыта. Оттуда — *знакомый свет*.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=8.0 + min(t, T) * 0.5, move=0.0, ajar=12, tally=True)),
      night=0.2, zoom=(1.0, 1.15, 300, 640)),
    S("За ней — твоя комната. До последней трещины.",
      lambda c, x, t, T: room(c, x, t, dict(time="03:06", green=True)), night=0.5, green=1.0,
      zoom=(1.0, 1.2, 560, 300), sfx=[(-0.6, "creak")]),
    S("А на кровати спишь… !ты!.",
      lambda c, x, t, T: copy_room(c, x, t), night=0.5, green=1.0, zoom=(1.0, 1.6, 230, 860),
      sfx=[(-0.5, "hit")], glitch=[-0.5], red=0.3),
    S("Часы: {3:06|три ноль шесть}. Тик. Тик.",
      lambda c, x, t, T: copy_room(c, x, t), night=0.5, green=1.0, zoom=(2.2, 2.5, 385, 575),
      sfx=[(0.3, "tick"), (1.3, "tick"), (2.3, "tick")]),
    S("Второй ты *открывает глаза*.",
      lambda c, x, t, T: copy_room(c, x, t, eyes="creepy" if t > T * 0.5 else "closed"), night=0.5, green=1.0,
      zoom=(2.3, 2.7, 110, 830), sfx=[(0.0, "heart")], red=0.3),
    S("И шепчет: «Наконец-то. Твоя очередь !стучать!».",
      copy_sits, night=0.5, green=1.0, zoom=(1.6, 1.9, 160, 760), fx="whisper",
      sfx=[(-0.4, "hit")], glitch=[-0.4], red=0.5, roll=(0, -4)),
    S("Что бы ты сделал? Пиши в комментариях.",
      copy_sits, night=0.5, green=1.0, zoom=(1.9, 2.0, 160, 760), red=0.6, sfx=[(-1.5, "riser")]),
])

# ------------------------------------------------------------------ EPISODE 4


def swap_figs(t, T, a=0.0):
    k = phase(t, a, a + 1.6)
    up = (330, 545)
    dn = (300, 1110)
    return [dict(x=lerp(dn[0], up[0], k), y=lerp(dn[1], up[1], k), s=0.5, st=HERO, pose=dict(emo="fear")),
            dict(x=lerp(up[0] + 60, dn[0] + 60, k), y=lerp(up[1], dn[1], k), s=0.5, st=COPY, look=-1,
                 pose=dict(emo="creepy"))]


def arrows(c, t, a):
    k = clamp((t - a) / 1.6)
    if k <= 0 or k >= 1:
        return
    col(c, "#FFD21E", 1 - abs(k - 0.5) * 1.2)
    c.set_line_width(8)
    c.arc(360, 830, 180, -math.pi * 0.6, -math.pi * 0.6 + math.pi * 1.2 * k)
    c.stroke()


def vitya_arrives(c, x, t, T):
    k = phase(t, 0.2, T * 0.8)
    corridor(c, x, t, dict(depth=3.0, tally=True, figs=[
        dict(x=470, y=lerp(860, 1180, k), s=lerp(0.5, 0.95, k), st=VITYA, look=-1,
             pose=dict(walk_pose(t) if t < T * 0.8 else {}, emo="tired")),
        dict(x=170, y=1260, s=1.05, st=HERO, pose=dict(emo="terror", handF=(40, -300)))]))


def steps_closer(c, x, t, T):
    corridor(c, x, t, dict(depth=3.0, tally=True, figs=[
        dict(x=170, y=1260, s=1.05, st=HERO, pose=dict(emo="terror", pupil=(1, -0.3)))]))
    shadow_eyes(c, 470, lerp(600, 700, phase(t, 0, T)), t, lerp(0.4, 0.9, phase(t, 0, T)))


def plan(c, x, t, T):
    below(c, x, t, dict(fist=phase(t, 0.2, 1.2), emo="determined"))


EP[4] = dict(title="ПРАВИЛА", endcard=False, progress=True, tempo=1.06,
             cta=("УГАДАЕШЬ ПЛАН?", "ПИШИ ВЕРСИЮ В КОММЕНТЫ", 3.2, "ФИНАЛ — УЖЕ В ПРОФИЛЕ"), shots=[
    S("Через минуту у тебя будет !план!. Жестокий.",
      ff(plan, 1.5), top=("ЧАСТЬ 4", "ЧЕРЕЗ 60 СЕКУНД…"), red=0.7, glitch=[0.0, -0.25],
      sfx=[(0.0, "hit")], zoom=(1.5, 1.3, 360, 600), roll=(4, 0)),
    S("Двойник сказал: твоя очередь. Одно правило — и ты навсегда !под полом!.",
      lambda c, x, t, T: (section(c, x, t, dict(reveal=1.0, figs=swap_figs(t, T, 1.0))), arrows(c, t, 1.0)),
      red=0.4, flash=[1.0], sfx=[(1.0, "whoosh")], zoom=(1.2, 1.0, 360, 800)),
    S("Второй ты молча проходит мимо — *наверх*.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=6.0, tally=True, figs=[
          dict(x=lerp(520, 380, phase(t, 0, T)), y=lerp(1250, 760, phase(t, 0, T)),
               s=lerp(1.0, 0.25, phase(t, 0, T)), st=COPY, look=-1, pose=dict(walk_pose(t), emo="creepy")),
          dict(x=170, y=1260, s=1.05, st=HERO, pose=dict(emo="fear", pupil=(1, -0.3)))])),
      night=0.3, sfx=[(0, "steps")]),
    S("Дверь захлопывается. Лестницы !больше нет!.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=2.0 - t * 0.8, tally=True, figs=[
          dict(x=360, y=1260, s=1.05, st=HERO, pose=dict(walk_pose(t, 1.8, 30), emo="terror", lean=10))])),
      night=0.3, flash=[0.05], shake=[(0.05, 0.5, 18)], sfx=[(0.05, "slam")], flicker=True, roll=(-3, 3)),
    S("Из темноты — шаги. Всё *ближе*.",
      steps_closer, night=0.4, sfx=[(0.0, "steps"), (0.4, "heart")], red=0.5, zoom=(1.0, 1.3, 400, 800)),
    S("Это худой бородатый человек. !Витя!. Пропавший жилец.",
      vitya_arrives, night=0.3, badge=("ПРОПАЛ ГОД НАЗАД", "#FF4A3A")),
    S("«Не кричи. Оно *слышит*».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(arm=150, arm2=175, emo="fear")), night=0.2,
      zoom=(1.0, 1.1, 360, 600), fx="whisper"),
    S("«Я здесь *год*. Это мои зарубки».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(emo="tired", arm=40, arm2=60)), night=0.2,
      zoom=(1.1, 1.2, 360, 600), badge=("365 ЗАРУБОК", "#FFD21E")),
    S("«В {3:07|три ноль семь} тот, кто внизу, стучит в потолок».",
      lambda c, x, t, T: section(c, x, t, dict(reveal=1.0, waves=0.6, figs=[
          dict(x=330, y=545, s=0.5, st=COPY, pose=dict(emo="creepy")),
          dict(x=300, y=1110, s=0.5, st=HERO, pose=dict(armF=(175, 175), emo="determined"))])),
      sfx=ks(0.6), badge=("ПРАВИЛО 1", "#FFD21E")),
    S("«Если наверху !ответят! — вы меняетесь местами».",
      lambda c, x, t, T: (section(c, x, t, dict(reveal=1.0, figs=swap_figs(t, T, 0.8))), arrows(c, t, 0.8)),
      badge=("ПРАВИЛО 2", "#FFD21E"), flash=[0.8], sfx=[(0.8, "whoosh")]),
    S("«А хозяин всё знает. Он !кормит подвал! жильцами».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(emo="angry", arm=60, arm2=80)), night=0.2,
      zoom=(1.15, 1.35, 360, 600), badge=("АРЕНДА 5 000 ₽", "#FF4A3A"), red=0.3, sfx=[(-0.5, "hit")]),
    S("Наверху — твоя копия. А у тебя *одна минута*.",
      lambda c, x, t, T: below(c, x, t, dict(fist=0.0, vitya=True, emo="fear", vemo="tired")),
      badge=("03:06", "#FF4A3A"), sfx=[(0.3, "tick"), (1.3, "tick"), (2.3, "tick")]),
    S("И тут в квартиру входит !хозяин!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(emo="creepy"), t),
                          person(c, lerp(-80, 220, phase(t, 0, T * 0.7)), 1060, 0.9, 1, LANDLORD,
                                 dict(walk_pose(t) if t < T * 0.7 else {}, emo="smirk"), t)),
      night=1.0, sfx=[(0.0, "door")]),
    S("Он стучит по шкафу, как всегда: тук… тук-тук.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(emo="creepy"), t),
                          person(c, 380, 1060, 0.9, 1, LANDLORD,
                                 dict(emo="smirk", armF=(95 + 25 * hit(t, T - 1.1, RHYTHM), 110)), t)),
      night=1.0, post=1.1, sfx=ks(-1.1, RHYTHM), zoom=(1.0, 1.2, 450, 800)),
    S("И у тебя появляется *план*. Угадаешь какой? Пиши в комментариях.",
      plan, zoom=(1.0, 1.4, 360, 600), sfx=[(0.3, "hit"), (-1.8, "riser")], red=0.5, roll=(0, 4)),
])

# ------------------------------------------------------------------ EPISODE 5


def wake_up(c, x, t, T):
    room(c, x, t, dict(night=False, time="08:15", hatch="closed", carpet=False))
    if t < 1.0:
        sleeping(c, 340, 880, eyes="open", t=t)
    else:
        sitting_bed(c, HERO, "shock" if t < 2.0 else "relief", t)


def last_knock(c, x, t, T):
    room(c, x, t, dict(time="03:07", hatch=None))
    if t > 1.0:
        sitting_bed(c, TENANT, "terror", t, dict(mark="!", mark_t=t - 1.0))
    else:
        sleeping(c, 340, 880, TENANT, t=t)


def the_swap(c, x, t, T):
    section(c, x, t, dict(reveal=1.0, figs=[
        dict(x=lerp(300, 330, phase(t, 0.1, 1.4)), y=lerp(1110, 545, phase(t, 0.1, 1.4)), s=0.5, st=HERO,
             pose=dict(emo="determined")),
        dict(x=lerp(250, 200, phase(t, 0.1, 1.4)), y=lerp(1110, 545, phase(t, 0.1, 1.4)), s=0.48, st=VITYA,
             pose=dict(emo="fear")),
        dict(x=420, y=lerp(545, 1110, phase(t, 0.1, 1.4)), s=0.55,
             st=LANDLORD, look=-1, pose=dict(emo="terror"))]))
    arrows(c, t, 0.1)


EP[5] = dict(title="ТРИ НОЛЬ СЕМЬ", endcard=False, progress=True, tempo=1.06,
             cta=("А ТЫ БЫ ОТВЕТИЛ?", "ДА / НЕТ — ПИШИ В КОММЕНТЫ", 3.4, "ВСЕ СЕРИИ — В ПРОФИЛЕ"), shots=[
    S("Через минуту кто-то !провалится! под пол навсегда.",
      ff(the_swap, 0.9), top=("ФИНАЛ", "ЧЕРЕЗ 60 СЕКУНД…"), red=0.6, glitch=[0.0, -0.25],
      sfx=[(0.0, "hit"), (0.0, "whoosh")], zoom=(1.3, 1.15, 360, 800), roll=(-4, 0)),
    S("{3:07|Три ноль семь}. Один стук решит, кто останется !внизу!.",
      lambda c, x, t, T: below(c, x, t, dict(fist=1.0, vitya=True, emo="determined", vemo="fear")),
      badge=("03:07", "#FF4A3A"), zoom=(1.2, 1.05, 360, 700), sfx=[(0, "tick")], flash=[0.0]),
    S("Ответит хозяин — и здесь окажется *он*. Жестоко? Он годами кормил этот подвал людьми.",
      lambda c, x, t, T: landlord_close(c, x, t, dict(talk=False, emo="evil")), night=0.6,
      zoom=(1.0, 1.25, 360, 500), red=0.3),
    S("Ты стучишь его ритмом. Тук… тук-тук.",
      lambda c, x, t, T: below(c, x, t, dict(fist=1.0, knock_at=T - 1.1, gap=0.0, knocks=0, emo="angry",
                                           rhythm="ТУК… ТУК-ТУК" if t > T - 1.2 else None)),
      post=1.2, sfx=ks(-1.1, RHYTHM), shake=[(-1.1 + k, 0.12, 10) for k in RHYTHM], roll=(0, -3)),
    S("Наверху хозяин !замирает!. Но рука уже сама отвечает…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(emo="creepy"), t),
                          person(c, 330, 1060, 0.9, 1, LANDLORD,
                                 dict(emo="shock" if t < T * 0.5 else "terror", lean=phase(t, T * 0.5, T) * 40,
                                      armF=(phase(t, T * 0.5, T) * 120, phase(t, T * 0.5, T) * 140),
                                      mark="!", mark_t=t), t)),
      night=1.0, zoom=(1.0, 1.3, 360, 850), sfx=[(0.0, "heart")], red=0.3),
    S("…тук… тук-тук.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(emo="creepy"), t),
                          person(c, 330, 1060, 0.9, 1, LANDLORD,
                                 dict(emo="terror", lean=40, armF=(120 + 25 * hit(t, 0.7, RHYTHM), 140)), t)),
      night=1.0, post=0.4, pre=0.1, sfx=ks(0.7, RHYTHM) + [(-0.9, "riser")], zoom=(1.3, 1.45, 360, 950),
      flicker=True),
    S("!Вспышка!. Пол уходит из-под ног.",
      the_swap, flash=[0.05], shake=[(0.05, 0.8, 22)], sfx=[(0.05, "whoosh"), (0.05, "hit")], glitch=[0.05]),
    S("Ты просыпаешься в своей кровати. *Утро*.",
      wake_up, zoom=(1.3, 1.1, 250, 800), sfx=[(0.0, "birds")]),
    S("Рядом кашляет Витя. Он держался за твою руку — и вышел *вместе с тобой*.",
      lambda c, x, t, T: (room(c, x, t, dict(night=False, time="08:15", hatch="closed", carpet=False)),
                          person(c, 250, 1060, 0.9, 1, HERO, dict(emo="relief"), t),
                          person(c, 470, 1080, 0.85, -1, VITYA, dict(sit=True, emo="relief", talk=True), t))),
    S("И тут из-под люка — слабый стук. Это хозяин. Теперь !его очередь!.",
      lambda c, x, t, T: hatch_close(c, x, t, dict(scratch=1.0, fingers=0.35 + 0.1 * math.sin(t * 3))),
      sfx=ks(0.2), shake=[(0.2 + k, 0.1, 6) for k in KNOCK3], zoom=(1.0, 1.3, 360, 700), red=0.3,
      glitch=[-0.4]),
    S("А твоей копии нет. Только мокрые следы ведут… к !шкафу!.",
      lambda c, x, t, T: (room(c, x, t, dict(night=False, time="08:16", hatch="closed", carpet=False,
                                             wopen=0.1, weyes=t > T - 1.2, weyes_c="#7CFFA0")),
                          footprints(c, phase(t, 0.3, 2.0))),
      zoom=(1.0, 1.45, 540, 760), sfx=[(-0.9, "hit")], glitch=[-0.9], red=0.2),
    S("Вы съезжаете в тот же день. А через неделю на подъезде: «Сдаётся. *Дёшево*».",
      lambda c, x, t, T: building(c, x, t, dict(ad=True)), zoom=(1.0, 2.8, 360, 835),
      badge=("АРЕНДА 4 000 ₽", "#FFD21E")),
    S("Новый жилец засыпает. Ровно в {3:07|три ноль семь}…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06" if t < T - 0.6 else "03:07", hatch=None)),
                          sleeping(c, 340, 880, TENANT, t=t)),
      night=1.0, zoom=(1.0, 1.3, 400, 760), sfx=[(-0.6, "tick")], glitch=[-0.6]),
    S("",
      last_knock, night=1.0, dur=2.4, sfx=ks(0.3, RHYTHM) + [(1.0, "hit")],
      shake=[(0.3 + k, 0.12, 9) for k in RHYTHM], zoom=(1.2, 1.5, 220, 820), caption="ТУК… ТУК-ТУК", red=0.6,
      glitch=[1.0], roll=(0, -4)),
    S("А ты бы ответил? Пиши в комментариях.",
      lambda c, x, t, T: last_knock(c, x, t + 3.0, T), night=1.0, zoom=(1.5, 1.6, 220, 820), red=0.5),
])
