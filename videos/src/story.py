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

# ------------------------------------------------------------------ EPISODE 2
EP[2] = dict(title="ТЕТРАДЬ", shots=[
    S("Есть звонки, на которые нельзя !отвечать!.",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=True)), top=("ОН ЗВОНИТ", "С ТВОЕГО НОМЕРА"),
      night=0.4, red=0.5, sfx=[(0.0, "ring")], glitch=[0.0, -0.3], zoom=(1.3, 1.0, 360, 600), roll=(4, -2)),
    S("Ты рывком открываешь шкаф. Внутри — только *куртки*.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:08", wopen=phase(t, 0.2, 0.7))),
                          person(c, 380, 1060, 0.9, 1, HERO,
                                 dict(handF=(150, -250) if t < 0.8 else (110, -150),
                                      emo="terror" if t < 0.8 else "worry", lean=8 if t < 0.8 else 0), t)),
      night=1.0, sfx=[(0.2, "creak"), (0.2, "hit")], shake=[(0.2, 0.3, 10)], zoom=(1.0, 1.1, 520, 700)),
    S("Но на дне лежит !тетрадь!. Не твоя.",
      lambda c, x, t, T: wardrobe_in(c, x, t, {}), night=0.6, zoom=(1.0, 1.25, 365, 820)),
    S("«День первый. Стук в {3:07|три ноль семь}».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", 0.2, T - 0.6)])),
      sfx=[(0.2, "scratch")], zoom=(1.0, 1.08, 360, 500)),
    S("«День пятый. Оно знает мой *голос*».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", -9, 1),
                                                       ("День 5. Оно знает мой голос", 0.2, T - 0.6)])),
      sfx=[(0.2, "scratch")], zoom=(1.05, 1.12, 360, 520)),
    S("«День девятый. Теперь !стучу я!».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", -9, 1),
                                                       ("День 5. Оно знает мой голос", -9, 1),
                                                       ("", -9, 1),
                                                       ("День 9. Теперь стучу Я", 0.2, T - 0.6)],
                                                red={3: True})),
      zoom=(1.0, 1.35, 360, 700), sfx=[(0.2, "scratch"), (-0.5, "hit")], post=0.6, glitch=[-0.5], red=0.4),
    S("Соседка, баба Зина, *бледнеет*, увидев тетрадь.",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, gemo="shock" if t > 1.0 else "neutral",
                                                  ghand=(40, -250) if t < 1.0 else (35, -300))),
      sfx=[(1.0, "heart")]),
    S("«Это почерк Вити. Он !пропал! прошлой весной».",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, talk=True, gemo="sad", hemo="fear")),
      zoom=(1.1, 1.3, 520, 640)),
    S("«И знаешь… он тоже жаловался на !стук!».",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, talk=True, gemo="fear", hemo="terror")),
      zoom=(1.3, 1.5, 470, 640), sfx=[(-0.3, "heart")], red=0.3),
    S("«А хозяин на следующий день снова сдал квартиру. *Дешевле*».",
      lambda c, x, t, T: granny_scene(c, x, t, dict(talk=True, gemo="worry", hemo="worry")),
      badge=("БЫЛО 8 000, СТАЛО 5 000 ₽", "#FFD21E")),
    S("Ночью звонит телефон. На экране — твой *собственный номер*.",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=True)), sfx=[(0.0, "ring")], night=0.3,
      zoom=(1.0, 1.15, 360, 560)),
    S("Ты берёшь трубку и слышишь… !свой голос!.",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=False)), night=0.3, zoom=(1.0, 1.2, 360, 600),
      glitch=[-0.6]),
    S("«Не открывай люк. Только *не открывай*».",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=False)), night=0.3, fx="phone",
      zoom=(1.2, 1.4, 360, 600), red=0.3, roll=(0, -3)),
    S("Ты медленно оборачиваешься.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:09", hatch="closed", carpet=False)),
                          person(c, 300, 1060, 0.95, 1 if t < T * 0.6 else -1, HERO,
                                 dict(emo="fear", handF=(60, -170)), t)),
      night=1.0, post=0.8, sfx=[(0.0, "heart"), (-1.2, "riser")], zoom=(1.3, 1.2, 300, 750), flicker=True),
    S("Люк уже !открыт!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:09", hatch="open", carpet=False,
                                             fingers=phase(t, 0.4, 1.8))),
                          person(c, 160, 1060, 0.95, 1, HERO,
                                 dict(emo="terror", handF=(40, -300), lean=-10, mark="!", mark_t=t), t)),
      night=1.0, post=1.6, sfx=[(0.1, "hit")], zoom=(1.0, 1.5, 375, 1000), glitch=[0.1, -0.4], red=0.6,
      shake=[(0.1, 0.4, 12)], roll=(0, -5)),
], next="СЕРИЯ 3")

# ------------------------------------------------------------------ EPISODE 3


def copy_room(c, x, t, eyes="closed", time="03:06", talk=False):
    room(c, x, t, dict(time=time, green=True, carpet=True))
    sleeping(c, 340, 880, COPY, eyes=eyes, t=t, talk=talk)


EP[3] = dict(title="ПОДВАЛ", shots=[
    S("Внизу тебя ждали. *Очень давно*.",
      lambda c, x, t, T: copy_room(c, x, t, eyes="creepy"), top=("ПОД ПОЛОМ", "ЖИВЁТ ТВОЯ КОПИЯ"), night=0.6,
      green=1.0, red=0.4, zoom=(2.9, 2.5, 110, 830), glitch=[0.0, -0.3], sfx=[(0.0, "hit")], roll=(-4, 2)),
    S("Из люка тянет *холодом*. Вниз уходит лестница.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:10", hatch="open", carpet=False)),
                          person(c, 170, 1060, 0.95, 1, HERO, dict(emo="fear", handF=(110, -170)), t)),
      night=1.0, zoom=(1.0, 1.2, 380, 1000), sfx=[(0, "wind")]),
    S("Ты спускаешься. Ступенек !больше!, чем должно быть.",
      lambda c, x, t, T: stairs_down(c, x, t, dict(count=True)), sfx=[(0.3, "steps")]),
    S("Сорок. Пятьдесят. Шестьдесят. А дом — *пятиэтажка*.",
      lambda c, x, t, T: stairs_down(c, x, t + 6, dict(count=True, speed=1.8)), sfx=[(0.1, "steps")],
      badge=("ДОМ: 5 ЭТАЖЕЙ", "#FF4A3A"), roll=(0, 4)),
    S("Внизу — коридор. *Длиннее*, чем весь дом.",
      lambda c, x, t, T: section(c, x, t, dict(reveal=phase(t, 0, 1.0), endless=True,
                                             figs=[dict(x=230, y=1110, s=0.42, pose=dict(emo="fear"))])),
      zoom=(1.0, 1.15, 360, 800)),
    S("На каждой двери — номер !твоей квартиры!.",
      lambda c, x, t, T: (corridor(c, x, t, dict(move=0.6, tally=False)),
                          shadow_eyes(c, 360, 560, t, 0.5, "#FF3B30", phase(t, 1.0, 2.0))),
      badge=("КВ. 1", "#5CFF8A"), night=0.2, flicker=True),
    S("На стенах — зарубки. *Сотни*. А рядом имя: !«Витя»!.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=4.0, move=0.3, tally=True)), night=0.3,
      zoom=(1.0, 1.4, 160, 560), badge=("ВИТЯ", "#FF4A3A"), sfx=[(-0.5, "hit")]),
    S("Одна дверь приоткрыта. Оттуда льётся *знакомый свет*.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=8.0 + min(t, T) * 0.5, move=0.0, ajar=12, tally=True)),
      night=0.2, zoom=(1.0, 1.15, 300, 640)),
    S("За ней — твоя комната. Ты делаешь шаг… и скрипит половица.",
      lambda c, x, t, T: room(c, x, t, dict(time="03:06", green=True)), night=0.5, green=1.0,
      zoom=(1.0, 1.15, 360, 800), sfx=[(-0.9, "creak")]),
    S("А на кровати спишь… !ты!.",
      lambda c, x, t, T: copy_room(c, x, t), night=0.5, green=1.0, zoom=(1.0, 1.6, 230, 860), post=0.8,
      sfx=[(-0.8, "hit")], glitch=[-0.8], red=0.3),
    S("Часы показывают {3:06|три ноль шесть}.",
      lambda c, x, t, T: copy_room(c, x, t), night=0.5, green=1.0, zoom=(2.2, 2.5, 385, 575),
      sfx=[(0.3, "tick"), (1.3, "tick"), (2.3, "tick")]),
    S("Второй ты *открывает глаза*.",
      lambda c, x, t, T: copy_room(c, x, t, eyes="creepy" if t > T * 0.5 else "closed"), night=0.5, green=1.0,
      zoom=(2.3, 2.7, 110, 830), post=0.6, sfx=[(0.0, "heart")], red=0.3),
    S("И шепчет: «Наконец-то. Твоя очередь !стучать!».",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", green=True, carpet=True)),
                          sitting_bed(c, COPY, "creepy", t, dict(talk=True, handF=(130, -230)))),
      night=0.5, green=1.0, zoom=(1.6, 2.0, 160, 760), post=1.6, fx="whisper",
      sfx=[(-1.6, "hit"), (-3.4, "riser")], glitch=[-1.6, -0.6], red=0.6, roll=(0, -6)),
], next="СЕРИЯ 4")

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
    if t < 0.8:
        corridor(c, x, t, dict(depth=3.0, tally=True, figs=[
            dict(x=170, y=1260, s=1.05, st=HERO, pose=dict(emo="fear"))]))
        shadow_eyes(c, 470, 640, t, 0.6)
        return
    k = phase(t, 0.8, T * 0.8)
    corridor(c, x, t, dict(depth=3.0, tally=True, figs=[
        dict(x=470, y=lerp(860, 1180, k), s=lerp(0.5, 0.95, k), st=VITYA, look=-1,
             pose=dict(walk_pose(t) if t < T * 0.8 else {}, emo="tired")),
        dict(x=170, y=1260, s=1.05, st=HERO, pose=dict(emo="terror", handF=(40, -300)))]))


EP[4] = dict(title="ПРАВИЛА", shots=[
    S("Одно правило — и ты навсегда !под полом!.",
      lambda c, x, t, T: (section(c, x, t, dict(reveal=1.0, figs=swap_figs(t, T, 0.3))), arrows(c, t, 0.3)),
      top=("ОДИН ОТВЕТ", "И ВЫ ПОМЕНЯЛИСЬ"), red=0.5, flash=[0.3], sfx=[(0.3, "whoosh"), (0.3, "hit")],
      glitch=[0.0, -0.3], zoom=(1.2, 1.0, 360, 800)),
    S("Второй ты молча проходит мимо — *наверх*.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=6.0, tally=True, figs=[
          dict(x=lerp(520, 380, phase(t, 0, T)), y=lerp(1250, 760, phase(t, 0, T)),
               s=lerp(1.0, 0.25, phase(t, 0, T)), st=COPY, look=-1, pose=dict(walk_pose(t), emo="creepy")),
          dict(x=170, y=1260, s=1.05, st=HERO, pose=dict(emo="fear", pupil=(1, -0.3)))])),
      night=0.3, sfx=[(0, "steps")]),
    S("Дверь захлопывается. А !лестницы больше нет!.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=2.0 - t * 0.8, tally=True, figs=[
          dict(x=360, y=1260, s=1.05, st=HERO, pose=dict(walk_pose(t, 1.8, 30), emo="terror", lean=10))])),
      night=0.3, flash=[0.05], shake=[(0.05, 0.5, 18)], sfx=[(0.05, "slam")], flicker=True, roll=(-3, 3)),
    S("Из темноты выходит худой бородатый человек. *Витя*.",
      vitya_arrives, night=0.3, badge=("ПРОПАЛ ГОД НАЗАД", "#FF4A3A"), sfx=[(0.0, "heart")]),
    S("«Не кричи. Оно *слышит*».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(arm=150, arm2=175, emo="fear")), night=0.2,
      zoom=(1.0, 1.1, 360, 600), fx="whisper"),
    S("«Я здесь уже *год*. Это мои зарубки».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(emo="tired", arm=40, arm2=60)), night=0.2,
      zoom=(1.1, 1.2, 360, 600), badge=("365 ЗАРУБОК", "#FFD21E")),
    S("«В {3:07|три ноль семь} тот, кто внизу, стучит в потолок».",
      lambda c, x, t, T: section(c, x, t, dict(reveal=1.0, waves=1.0, figs=[
          dict(x=330, y=545, s=0.5, st=COPY, pose=dict(emo="creepy")),
          dict(x=300, y=1110, s=0.5, st=HERO, pose=dict(armF=(175, 175), emo="determined"))])),
      sfx=ks(1.0), badge=("ПРАВИЛО 1", "#FFD21E")),
    S("«Если наверху !ответят! — вы меняетесь местами».",
      lambda c, x, t, T: (section(c, x, t, dict(reveal=1.0, figs=swap_figs(t, T, 1.0))), arrows(c, t, 1.0)),
      badge=("ПРАВИЛО 2", "#FFD21E"), flash=[1.0], sfx=[(1.0, "whoosh")]),
    S("«Моя копия пожила наверху неделю и *съехала*».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(emo="sad")), night=0.2, zoom=(1.05, 1.15, 360, 600)),
    S("«А хозяин всё знает. Он !кормит подвал! жильцами».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(emo="angry", arm=60, arm2=80)), night=0.2,
      zoom=(1.15, 1.35, 360, 600), badge=("АРЕНДА 5 000 ₽", "#FF4A3A"), red=0.3, sfx=[(-0.5, "hit")]),
    S("Наверху — твоя копия. А у тебя *одна минута*.",
      lambda c, x, t, T: below(c, x, t, dict(fist=0.0, vitya=True, emo="fear", vemo="tired")),
      badge=("03:06", "#FF4A3A"), sfx=[(0.3, "tick"), (1.3, "tick"), (2.3, "tick"), (3.3, "tick")]),
    S("И тут в твою квартиру входит !хозяин!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(emo="creepy"), t),
                          person(c, lerp(-80, 220, phase(t, 0, T * 0.7)), 1060, 0.9, 1, LANDLORD,
                                 dict(walk_pose(t) if t < T * 0.7 else {}, emo="smirk"), t)),
      night=1.0, sfx=[(0.0, "door")]),
    S("Он стучит по шкафу, как всегда: тук… тук-тук.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(emo="creepy"), t),
                          person(c, 380, 1060, 0.9, 1, LANDLORD,
                                 dict(emo="smirk", armF=(95 + 25 * hit(t, T - 1.3, RHYTHM), 110)), t)),
      night=1.0, post=1.3, sfx=ks(-1.3, RHYTHM), zoom=(1.0, 1.2, 450, 800)),
    S("Тот самый стук. Как в *первый день*.",
      lambda c, x, t, T: (building(c, x, t, {}),
                          person(c, 480, 1150, 0.85, -1, LANDLORD, dict(emo="evil", armF=(120, 120)), t)),
      night=0.4, green=0.3, zoom=(1.3, 1.45, 420, 860), glitch=[0.0]),
    S("И у тебя появляется *план*.",
      lambda c, x, t, T: below(c, x, t, dict(fist=phase(t, 0.2, 1.2), emo="determined")),
      post=1.6, zoom=(1.0, 1.4, 360, 600), sfx=[(-1.4, "hit"), (-3.2, "riser")], red=0.5, roll=(0, 4)),
], next="ФИНАЛ")

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


EP[5] = dict(title="ТРИ НОЛЬ СЕМЬ", shots=[
    S("Один стук решит, кто останется !внизу!.",
      lambda c, x, t, T: below(c, x, t, dict(fist=1.0, emo="angry", knock_at=0.2, gap=0.42, knocks=1)),
      top=("ФИНАЛ", "КТО ОСТАНЕТСЯ ВНИЗУ?"), red=0.6, glitch=[0.0, -0.3], sfx=[(0.2, "knock"), (0.2, "hit")],
      zoom=(1.35, 1.15, 380, 760), roll=(5, 0)),
    S("{3:07|Три ноль семь}. Ответит хозяин — и здесь окажется *он*.",
      lambda c, x, t, T: below(c, x, t, dict(fist=1.0, vitya=True, emo="determined", vemo="fear")),
      badge=("03:07", "#FF4A3A"), zoom=(1.0, 1.1, 360, 600), sfx=[(0, "tick")]),
    S("Жестоко? Он годами отдавал людей этому *подвалу*.",
      lambda c, x, t, T: landlord_close(c, x, t, dict(talk=False, emo="evil")), night=0.6,
      zoom=(1.0, 1.2, 360, 500), red=0.3),
    S("Ты стучишь его ритмом. Тук… тук-тук.",
      lambda c, x, t, T: below(c, x, t, dict(fist=1.0, knock_at=T - 1.2, gap=0.0, knocks=0, emo="angry",
                                           rhythm="ТУК… ТУК-ТУК" if t > T - 1.3 else None)),
      post=1.4, sfx=ks(-1.2, RHYTHM), shake=[(-1.2 + k, 0.12, 10) for k in RHYTHM], roll=(0, -3)),
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
                                 dict(emo="terror", lean=40, armF=(120 + 25 * hit(t, 0.9, RHYTHM), 140)), t)),
      night=1.0, post=0.6, pre=0.1, sfx=ks(0.9, RHYTHM) + [(-0.9, "riser")], zoom=(1.3, 1.45, 360, 950),
      flicker=True),
    S("!Вспышка!. Пол уходит из-под ног.",
      lambda c, x, t, T: (section(c, x, t, dict(reveal=1.0, figs=[
          dict(x=lerp(300, 330, phase(t, 0.1, 1.4)), y=lerp(1110, 545, phase(t, 0.1, 1.4)), s=0.5, st=HERO,
               pose=dict(emo="determined")),
          dict(x=lerp(250, 200, phase(t, 0.1, 1.4)), y=lerp(1110, 545, phase(t, 0.1, 1.4)), s=0.48, st=VITYA,
               pose=dict(emo="fear")),
          dict(x=420, y=lerp(545, 1110, phase(t, 0.1, 1.4)), s=0.55,
               st=LANDLORD, look=-1, pose=dict(emo="terror"))])), arrows(c, t, 0.1)),
      flash=[0.05], shake=[(0.05, 0.8, 22)], sfx=[(0.05, "whoosh"), (0.05, "hit")], glitch=[0.05]),
    S("Ты просыпаешься в своей кровати. *Утро*.",
      wake_up, zoom=(1.3, 1.1, 250, 800), sfx=[(0.0, "birds")]),
    S("Рядом кашляет Витя. Он держался за твою руку — и вышел *вместе с тобой*.",
      lambda c, x, t, T: (room(c, x, t, dict(night=False, time="08:15", hatch="closed", carpet=False)),
                          person(c, 250, 1060, 0.9, 1, HERO, dict(emo="relief"), t),
                          person(c, 470, 1080, 0.85, -1, VITYA, dict(sit=True, emo="relief", talk=True), t))),
    S("А твоей копии нет. Только мокрые следы ведут… к !шкафу!.",
      lambda c, x, t, T: (room(c, x, t, dict(night=False, time="08:16", hatch="closed", carpet=False,
                                             wopen=0.1, weyes=t > T - 1.0, weyes_c="#7CFFA0")),
                          footprints(c, phase(t, 0.3, 2.0))),
      zoom=(1.0, 1.45, 540, 760), post=0.9, sfx=[(-0.9, "hit")], glitch=[-0.9], red=0.2),
    S("Вы съезжаете в тот же день.",
      lambda c, x, t, T: (building(c, x, t, {}),
                          person(c, lerp(330, 820, phase(t, 0, T)), 1150, 0.85, 1, HERO,
                                 dict(walk_pose(t), emo="determined"), t),
                          person(c, lerp(200, 690, phase(t, 0, T)), 1150, 0.82, 1, VITYA,
                                 dict(walk_pose(t + 0.3), emo="tired"), t))),
    S("Через неделю на подъезде объявление: «Сдаётся. *Дёшево*».",
      lambda c, x, t, T: building(c, x, t, dict(ad=True)), zoom=(1.0, 2.8, 360, 835),
      badge=("АРЕНДА 4 000 ₽", "#FFD21E")),
    S("Новый жилец засыпает. Ровно в {3:07|три ноль семь}…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06" if t < T - 0.6 else "03:07", hatch=None)),
                          sleeping(c, 340, 880, TENANT, t=t)),
      night=1.0, zoom=(1.0, 1.3, 400, 760), sfx=[(-0.6, "tick")], glitch=[-0.6]),
    S("",
      last_knock, night=1.0, dur=2.6, sfx=ks(0.3, RHYTHM) + [(1.0, "hit")],
      shake=[(0.3 + k, 0.12, 9) for k in RHYTHM], zoom=(1.2, 1.55, 220, 820), caption="ТУК… ТУК-ТУК", red=0.6,
      glitch=[1.0], roll=(0, -5)),
], next="КОНЕЦ?", next_small="ПОДПИШИСЬ, ЧТОБЫ НЕ ПРОПУСТИТЬ")
