from engine import *


def S(text, draw, **kw):
    d = dict(text=text, draw=draw, pre=0.15, post=0.25, night=0.0, green=0.0, zoom=(1.0, 1.06, 360, 640),
             sfx=[], flash=[], shake=[], badge=None, top=None, fx=None, dur=None)
    d.update(kw)
    return d


def sleeping(ctx, x, y, st=HERO, eyes="closed", t=0, talk=False):
    person(ctx, x, y, 0.82, 1, st, dict(lie=True, eyes=eyes, armF=(0, 0), talk=talk, pupil=(0, -1)), t)
    rect(ctx, 150, 852, 220, 36, "#3F6FA8")


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


EP = {}

# ------------------------------------------------------------------ EPISODE 1
EP[1] = dict(title="ДЕШЁВАЯ КВАРТИРА", shots=[
    S("Ты снял квартиру за *пять тысяч* в месяц.",
      lambda c, x, t, T: (building(c, x, t, dict(mark=True)),
                          person(c, 540, 1150, 0.85, -1, LANDLORD, dict(eyes="half"), t),
                          person(c, lerp(-80, 280, phase(t, 0, T * 0.8)), 1150, 0.85, 1, HERO,
                                 walk_pose(t) if t < T * 0.8 else {}, t)),
      top=("КВАРТИРА", "ЗА 5 000 РУБЛЕЙ"), badge=("АРЕНДА 5 000 ₽", "#FFD21E")),
    S("Хозяин отдал ключи и странно постучал по двери.",
      lambda c, x, t, T: (building(c, x, t, {}),
                          person(c, 260, 1150, 0.85, 1, HERO, dict(armF=(60, 50)), t),
                          person(c, 480, 1150, 0.85, -1, LANDLORD,
                                 dict(armF=(100 + 25 * (any(0 < t - (T - 1.2) - k < 0.12 for k in RHYTHM)), 120),
                                      eyes="half"), t)),
      zoom=(1.0, 1.15, 380, 900), post=1.3, sfx=ks(-1.2, RHYTHM)),
    S("И сказал только одно: «Ночью в *подвал* не спускайся».",
      lambda c, x, t, T: landlord_close(c, x, t, dict(talk=t > 1.3, keys=True)), zoom=(1.0, 1.08, 360, 600),
      fx=None),
    S("Но подвала в этом доме !нет!. Ты на первом этаже, под тобой — бетон.",
      lambda c, x, t, T: section(c, x, t, dict(reveal=0.0, figs=[dict(x=330, y=545, s=0.5)])),
      badge=("ПОДВАЛА НЕТ", "#FF4A3A")),
    S("Первая ночь. Ровно в {3:07|три ноль семь}…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06" if t < T - 0.9 else "03:07")),
                          sleeping(c, 340, 880, t=t)),
      night=1.0, zoom=(1.0, 1.3, 300, 760), post=0.5, sfx=[(-0.9, "tick")]),
    S("…*стук*. Три удара. Прямо из-под !пола!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07")),
                          sleeping(c, 340, 880, eyes="wide" if t > 0.3 else "closed", t=t)),
      night=1.0, pre=1.5, sfx=ks(0.1), shake=[(0.1 + k, 0.15, 10) for k in KNOCK3], zoom=(1.5, 1.5, 240, 800)),
    S("Ты прикладываешь ухо к полу. *Тишина*.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07")),
                          person(c, 600, 1120, 0.95, 1, HERO, dict(lie=True, eyes="wide", pupil=(0, 1)), t)),
      night=1.0, zoom=(1.0, 1.3, 330, 1050), post=0.6),
    S("Внизу кто-то *дышит*. Медленно. Прямо под твоей !щекой!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:08")),
                          person(c, 600, 1120, 0.95, 1, HERO, dict(lie=True, eyes="wide", pupil=(0, 1)), t)),
      night=1.0, zoom=(1.8, 2.3, 300, 1100), post=0.5, sfx=[(0.2, "breath")]),
    S("Утром ты снимаешь ковёр. А под ним — !люк!.",
      lambda c, x, t, T: hatch_close(c, x, t, dict(carpet_off=phase(t, 0.4, T - 1.0), scratch=0)),
      sfx=[(-1.0, "sting")]),
    S("На крышке нацарапано: «!Не отвечай!».",
      lambda c, x, t, T: hatch_close(c, x, t, dict(scratch=phase(t, 0.6, T - 0.2))), zoom=(1.0, 1.25, 360, 520),
      sfx=[(0.6, "scratch")]),
    S("Царапины свежие. Будто писали !снизу!.",
      lambda c, x, t, T: hatch_close(c, x, t, dict(scratch=1.0)), zoom=(1.2, 1.4, 360, 560), post=0.4),
    S("Следующей ночью стук *повторяется*. И ты не выдерживаешь…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False)),
                          person(c, 170, 1100, 1.1, 1, HERO, dict(eyes="angry"), t)),
      night=1.0, pre=1.4, sfx=ks(0.1), shake=[(0.1 + k, 0.15, 8) for k in KNOCK3]),
    S("…и стучишь в ответ. *Три раза*.",
      lambda c, x, t, T: fist_floor(c, x, t, dict(hits=[T - 1.4 + k for k in KNOCK3])),
      night=0.8, post=1.5, sfx=ks(-1.4), shake=[(-1.4 + k, 0.12, 8) for k in KNOCK3], zoom=(1.0, 1.1, 360, 800)),
    S("Тишина…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False)),
                          person(c, 250, 1100, 1.1, 1, HERO, dict(eyes="wide", pupil=(1, 0)), t)),
      night=1.0, post=1.0, zoom=(1.1, 1.25, 330, 800), sfx=[(0.3, "heart")]),
    S("А потом стук раздаётся… изнутри твоего !шкафа!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False,
                                             shake=1.0 if t > T - 1.3 else 0.0)),
                          person(c, 250, 1100, 1.1, 1, HERO, dict(eyes="wide", mouth="o", pupil=(1, -0.5)), t)),
      night=1.0, post=1.4, zoom=(1.0, 1.4, 560, 700), sfx=ks(-1.3) + [(-1.3, "sting")],
      shake=[(-1.3, 1.0, 6)]),
], next="СЕРИЯ 2")

# ------------------------------------------------------------------ EPISODE 2
EP[2] = dict(title="ТЕТРАДЬ", shots=[
    S("Ты рывком открываешь шкаф. Внутри — только *куртки*.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:08", wopen=phase(t, 0.2, 0.7))),
                          person(c, 380, 1060, 0.9, 1, HERO, dict(armF=(110, 100), eyes="wide"), t)),
      night=1.0, top=("СТУК ИЗ", "ШКАФА"), sfx=[(0.2, "creak")], zoom=(1.0, 1.1, 520, 700)),
    S("Но на дне лежит !тетрадь!. Не твоя.",
      lambda c, x, t, T: wardrobe_in(c, x, t, {}), night=0.6, zoom=(1.0, 1.15, 365, 760)),
    S("«День первый. Стук в {3:07|три ноль семь}».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", 0.2, T - 0.6)])),
      top=None, sfx=[(0.2, "scratch")]),
    S("«День пятый. Оно знает мой *голос*».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", -9, 1),
                                                       ("День 5. Оно знает мой голос", 0.2, T - 0.6)])),
      sfx=[(0.2, "scratch")]),
    S("«День девятый. Теперь !стучу я!».",
      lambda c, x, t, T: notebook(c, x, t, dict(lines=[("День 1. Стук в 3:07", -9, 1),
                                                       ("День 5. Оно знает мой голос", -9, 1),
                                                       ("", -9, 1),
                                                       ("День 9. Теперь стучу Я", 0.2, T - 0.6)],
                                                red={3: True})),
      zoom=(1.0, 1.3, 360, 700), sfx=[(0.2, "scratch"), (-0.5, "sting")], post=0.6),
    S("Соседка, баба Зина, *бледнеет*, увидев тетрадь.",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, geyes="wide" if t > 1.2 else "open"))),
    S("«Это Витин почерк. Жил тут до тебя. !Пропал! прошлой весной».",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, talk=True, geyes="wide")),
      zoom=(1.1, 1.3, 520, 640)),
    S("«И знаешь… он тоже жаловался на !стук!».",
      lambda c, x, t, T: granny_scene(c, x, t, dict(show=True, talk=True, geyes="wide", scared=True)),
      zoom=(1.3, 1.45, 470, 640), sfx=[(-0.3, "heart")]),
    S("«А хозяин на следующий день снова сдал квартиру. *Дешевле*».",
      lambda c, x, t, T: granny_scene(c, x, t, dict(talk=True, scared=True)), badge=("БЫЛО 8 000, СТАЛО 5 000 ₽", "#FFD21E")),
    S("Ночью звонит телефон. На экране — твой *собственный номер*.",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=True)), sfx=[(0.0, "ring")], night=0.3),
    S("Ты берёшь трубку и слышишь… !свой голос!.",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=False)), night=0.3, zoom=(1.0, 1.2, 360, 600)),
    S("«Не открывай люк. Слышишь? Только *не открывай*».",
      lambda c, x, t, T: phone_scene(c, x, t, dict(ring=False)), night=0.3, fx="phone", zoom=(1.2, 1.35, 360, 600)),
    S("Ты медленно оборачиваешься.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:09", hatch="closed", carpet=False)),
                          person(c, 300, 1060, 0.95, 1 if t < T * 0.6 else -1, HERO,
                                 dict(eyes="wide", armF=(70, 110)), t)),
      night=1.0, post=0.8, sfx=[(0.0, "heart")], zoom=(1.3, 1.2, 300, 750)),
    S("Люк уже !открыт!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:09", hatch="open", carpet=False)),
                          person(c, 160, 1060, 0.95, 1, HERO, dict(eyes="wide", mouth="scream", armF=(30, 60)),
                                 t)),
      night=1.0, post=1.6, sfx=[(0.3, "sting")], zoom=(1.0, 1.45, 375, 1000)),
], next="СЕРИЯ 3")

# ------------------------------------------------------------------ EPISODE 3


def copy_room(c, x, t, eyes="closed", time="03:06", talk=False):
    room(c, x, t, dict(time=time, green=True, carpet=True))
    sleeping(c, 340, 880, COPY, eyes=eyes, t=t, talk=talk)


EP[3] = dict(title="ПОДВАЛ", shots=[
    S("Из люка тянет *холодом*. Вниз уходит лестница.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:10", hatch="open", carpet=False)),
                          person(c, 170, 1060, 0.95, 1, HERO, dict(eyes="open", armF=(90, 80)), t)),
      night=1.0, top=("ЛЮК", "ОТКРЫТ"), zoom=(1.0, 1.2, 380, 1000), sfx=[(0, "wind")]),
    S("Ты спускаешься с фонариком. Ступенек !больше!, чем должно быть.",
      lambda c, x, t, T: stairs_down(c, x, t, dict(count=True)), sfx=[(0.3, "steps")]),
    S("Сорок. Пятьдесят. Шестьдесят. А дом — всего *пятиэтажка*.",
      lambda c, x, t, T: stairs_down(c, x, t + 6, dict(count=True, speed=1.6)), sfx=[(0.1, "steps")],
      badge=("ДОМ: 5 ЭТАЖЕЙ", "#FF4A3A")),
    S("Внизу — коридор. Он *длиннее*, чем весь дом.",
      lambda c, x, t, T: section(c, x, t, dict(reveal=phase(t, 0, 1.0), endless=True,
                                             figs=[dict(x=230, y=1110, s=0.42)])),
      zoom=(1.0, 1.15, 360, 800)),
    S("Вдоль стен — двери. И на каждой номер !твоей квартиры!.",
      lambda c, x, t, T: corridor(c, x, t, dict(move=0.6, tally=False)), badge=("КВ. 1", "#5CFF8A"), night=0.2),
    S("На стенах — зарубки. *Сотни*. Кто-то считал ночи.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=4.0, move=0.4, tally=True)), night=0.2),
    S("А рядом с последней зарубкой нацарапано имя: !«Витя»!.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=5.5, move=0.15, tally=True)), night=0.3,
      zoom=(1.3, 1.6, 120, 520), sfx=[(-0.6, "sting")], badge=("ВИТЯ", "#FF4A3A")),
    S("Одна дверь приоткрыта. Оттуда льётся *знакомый свет*.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=8.0 + min(t, T) * 0.5, move=0.0, ajar=12, tally=True)),
      night=0.2, zoom=(1.0, 1.15, 300, 640)),
    S("За ней — твоя комната. Твой ковёр. Твой шкаф.",
      lambda c, x, t, T: room(c, x, t, dict(time="03:06", green=True)), night=0.5, green=1.0,
      zoom=(1.0, 1.1, 360, 700)),
    S("Даже трещина на потолке — *та же самая*. Ты делаешь шаг… и скрипит половица.",
      lambda c, x, t, T: room(c, x, t, dict(time="03:06", green=True)), night=0.5, green=1.0,
      zoom=(1.1, 1.25, 360, 900), sfx=[(-0.9, "creak")]),
    S("А на кровати спишь… !ты!.",
      lambda c, x, t, T: copy_room(c, x, t), night=0.5, green=1.0, zoom=(1.0, 1.5, 230, 860), post=0.8,
      sfx=[(-0.8, "sting")]),
    S("Часы показывают {3:06|три ноль шесть}.",
      lambda c, x, t, T: copy_room(c, x, t), night=0.5, green=1.0, zoom=(2.2, 2.4, 385, 575),
      sfx=[(0.3, "tick"), (1.3, "tick"), (2.3, "tick")]),
    S("Второй ты *открывает глаза*.",
      lambda c, x, t, T: copy_room(c, x, t, eyes="open" if t > T * 0.55 else "closed"), night=0.5, green=1.0,
      zoom=(2.3, 2.6, 110, 830), post=0.6, sfx=[(0.0, "heart")]),
    S("И шепчет: «Наконец-то. Твоя очередь !стучать!».",
      lambda c, x, t, T: copy_room(c, x, t, eyes="open", talk=t > 0.8 and t < T - 0.8, time="03:07"),
      night=0.5, green=1.0, zoom=(2.6, 2.9, 110, 830), post=1.6, fx="whisper", sfx=[(-1.6, "sting")]),
], next="СЕРИЯ 4")

# ------------------------------------------------------------------ EPISODE 4


def swap_figs(t, T, a=0.0):
    k = phase(t, a, a + 1.6)
    up = (330, 545)
    dn = (300, 1110)
    return [dict(x=lerp(dn[0], up[0], k), y=lerp(dn[1], up[1], k), s=0.5, st=HERO),
            dict(x=lerp(up[0] + 60, dn[0] + 60, k), y=lerp(up[1], dn[1], k), s=0.5, st=COPY, look=-1)]


def arrows(c, t, a):
    k = clamp((t - a) / 1.6)
    if k <= 0 or k >= 1:
        return
    col(c, "#FFD21E", 1 - abs(k - 0.5) * 1.2)
    c.set_line_width(8)
    c.arc(360, 830, 180, -math.pi * 0.6, -math.pi * 0.6 + math.pi * 1.2 * k)
    c.stroke()


EP[4] = dict(title="ПРАВИЛА", shots=[
    S("Второй ты встаёт и молча проходит мимо — *наверх*.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=6.0, tally=True, figs=[
          dict(x=lerp(520, 380, phase(t, 0, T)), y=lerp(1250, 760, phase(t, 0, T)),
               s=lerp(1.0, 0.25, phase(t, 0, T)), st=COPY, look=-1, pose=walk_pose(t)),
          dict(x=170, y=1260, s=1.05, st=HERO, pose=dict(eyes="wide", pupil=(1, -0.3)))])),
      night=0.3, top=("ТВОЯ", "ОЧЕРЕДЬ"), sfx=[(0, "steps")]),
    S("Дверь захлопывается. Ты бежишь назад — а !лестницы нет!.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=2.0 - t * 0.8, tally=True, figs=[
          dict(x=360, y=1260, s=1.05, st=HERO, pose=dict(walk_pose(t, 1.8, 30), eyes="wide"))])),
      night=0.3, flash=[0.05], shake=[(0.05, 0.5, 18)], sfx=[(0.05, "slam")]),
    S("Из темноты выходит худой бородатый человек. Это *Витя*.",
      lambda c, x, t, T: corridor(c, x, t, dict(depth=3.0, tally=True, figs=[
          dict(x=470, y=lerp(860, 1180, phase(t, 0, T * 0.7)), s=lerp(0.5, 0.95, phase(t, 0, T * 0.7)), st=VITYA,
               look=-1, pose=walk_pose(t) if t < T * 0.7 else {}),
          dict(x=170, y=1260, s=1.05, st=HERO, pose=dict(eyes="wide"))])),
      night=0.3, badge=("ПРОПАЛ ГОД НАЗАД", "#FF4A3A")),
    S("«Не кричи. Оно *слышит*».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(arm=150, arm2=175)), night=0.2, zoom=(1.0, 1.1, 360, 600),
      fx="whisper"),
    S("«Я здесь уже *год*. Это мои зарубки на стенах».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(eyes="half", arm=40, arm2=60)), night=0.2,
      zoom=(1.1, 1.2, 360, 600), badge=("365 ЗАРУБОК", "#FFD21E")),
    S("«Каждую ночь в {3:07|три ноль семь} тот, кто внизу, стучит в потолок».",
      lambda c, x, t, T: section(c, x, t, dict(reveal=1.0, waves=1.0, figs=[
          dict(x=330, y=545, s=0.5, st=COPY), dict(x=300, y=1110, s=0.5, st=HERO,
                                                   pose=dict(armF=(175, 175)))])),
      sfx=ks(1.0), badge=("ПРАВИЛО 1", "#FFD21E")),
    S("«Если наверху !ответят! — вы меняетесь местами».",
      lambda c, x, t, T: (section(c, x, t, dict(reveal=1.0, figs=swap_figs(t, T, 1.0))), arrows(c, t, 1.0)),
      badge=("ПРАВИЛО 2", "#FFD21E"), flash=[1.0], sfx=[(1.0, "whoosh")]),
    S("«Я ответил год назад. Моя копия пожила наверху неделю и *съехала*».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(eyes="half")), night=0.2, zoom=(1.05, 1.15, 360, 600)),
    S("«А хозяин всё знает. Он !кормит подвал! жильцами. Поэтому так дёшево».",
      lambda c, x, t, T: vitya_close(c, x, t, dict(eyes="angry", arm=60, arm2=80)), night=0.2,
      zoom=(1.15, 1.3, 360, 600), badge=("АРЕНДА 5 000 ₽", "#FF4A3A")),
    S("Наверху — твоя копия. А у тебя осталась *одна минута*.",
      lambda c, x, t, T: below(c, x, t, dict(fist=0.0, vitya=True, eyes="wide")),
      badge=("03:06", "#FF4A3A"), sfx=[(0.3, "tick"), (1.3, "tick"), (2.3, "tick"), (3.3, "tick")]),
    S("И тут наверху в твою квартиру входит !хозяин!.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(eyes="open"), t),
                          person(c, lerp(-80, 220, phase(t, 0, T * 0.7)), 1060, 0.9, 1, LANDLORD,
                                 dict(walk_pose(t) if t < T * 0.7 else {}, eyes="half"), t)),
      night=1.0, sfx=[(0.0, "door")]),
    S("Он стучит по шкафу, как всегда: тук… тук-тук.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(eyes="open"), t),
                          person(c, 380, 1060, 0.9, 1, LANDLORD,
                                 dict(eyes="half", armF=(95 + 25 * any(0 < t - (T - 1.3) - k < 0.12 for k in RHYTHM),
                                                         110)), t)),
      night=1.0, post=1.3, sfx=ks(-1.3, RHYTHM), zoom=(1.0, 1.2, 450, 800)),
    S("Тот самый стук. Как в *первый день*, у подъезда.",
      lambda c, x, t, T: building(c, x, t, {}), night=0.4, green=0.3, zoom=(1.3, 1.4, 360, 860)),
    S("И у тебя появляется *план*.",
      lambda c, x, t, T: below(c, x, t, dict(fist=phase(t, 0.2, 1.2), eyes="angry")),
      post=1.6, zoom=(1.0, 1.35, 360, 600), sfx=[(-1.4, "sting")]),
], next="ФИНАЛ")

# ------------------------------------------------------------------ EPISODE 5
EP[5] = dict(title="ТРИ НОЛЬ СЕМЬ", shots=[
    S("{3:07|Три ноль семь}. Ответит хозяин — и окажется здесь !он!.",
      lambda c, x, t, T: below(c, x, t, dict(fist=1.0, vitya=True)), badge=("03:07", "#FF4A3A"),
      top=("ФИНАЛ", ""), zoom=(1.0, 1.1, 360, 600), sfx=[(0, "tick")]),
    S("Жестоко? Он годами отдавал людей этому *подвалу*.",
      lambda c, x, t, T: landlord_close(c, x, t, dict(talk=False, eyes="half")), night=0.6,
      zoom=(1.0, 1.15, 360, 500)),
    S("Ты стучишь его ритмом. Тук… тук-тук.",
      lambda c, x, t, T: below(c, x, t, dict(fist=1.0, knock_at=T - 1.2, gap=0.0, knocks=0,
                                           rhythm="ТУК… ТУК-ТУК" if t > T - 1.3 else None)),
      post=1.4, sfx=ks(-1.2, RHYTHM), shake=[(-1.2 + k, 0.12, 8) for k in RHYTHM]),
    S("Наверху хозяин !замирает!. Но рука уже сама отвечает…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(eyes="open", mouth="smile"), t),
                          person(c, 330, 1060, 0.9, 1, LANDLORD,
                                 dict(eyes="wide", lean=phase(t, T * 0.5, T) * 40,
                                      armF=(phase(t, T * 0.5, T) * 120, phase(t, T * 0.5, T) * 140)), t)),
      night=1.0, zoom=(1.0, 1.25, 360, 850), sfx=[(0.0, "heart")]),
    S("…тук… тук-тук.",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch="closed", carpet=False)),
                          person(c, 520, 1060, 0.9, -1, COPY, dict(eyes="open", mouth="smile"), t),
                          person(c, 330, 1060, 0.9, 1, LANDLORD,
                                 dict(eyes="wide", lean=40,
                                      armF=(120 + 25 * any(0 < t - 0.9 - k < 0.12 for k in RHYTHM), 140)), t)),
      night=1.0, post=0.6, pre=0.1, sfx=ks(0.9, RHYTHM), zoom=(1.25, 1.35, 360, 950)),
    S("!Вспышка!. Пол уходит из-под ног.",
      lambda c, x, t, T: (section(c, x, t, dict(reveal=1.0, figs=[
          dict(x=lerp(300, 330, phase(t, 0.1, 1.4)), y=lerp(1110, 545, phase(t, 0.1, 1.4)), s=0.5, st=HERO),
          dict(x=lerp(250, 200, phase(t, 0.1, 1.4)), y=lerp(1110, 545, phase(t, 0.1, 1.4)), s=0.48, st=VITYA),
          dict(x=lerp(420, 420, phase(t, 0.1, 1.4)), y=lerp(545, 1110, phase(t, 0.1, 1.4)), s=0.55,
               st=LANDLORD, look=-1, pose=dict(eyes="wide", mouth="scream"))])), arrows(c, t, 0.1)),
      flash=[0.05], shake=[(0.05, 0.8, 22)], sfx=[(0.05, "whoosh"), (0.05, "sting")]),
    S("Ты просыпаешься в своей кровати. *Утро*.",
      lambda c, x, t, T: (room(c, x, t, dict(night=False, time="08:15", hatch="closed", carpet=False)),
                          sleeping(c, 340, 880, eyes="open" if t > 0.6 else "closed", t=t)),
      zoom=(1.2, 1.0, 300, 800), sfx=[(0.0, "birds")]),
    S("Рядом на полу кашляет Витя. Он держался за твою руку — и вышел *вместе с тобой*.",
      lambda c, x, t, T: (room(c, x, t, dict(night=False, time="08:15", hatch="closed", carpet=False)),
                          person(c, 250, 1060, 0.9, 1, HERO, dict(eyes="open"), t),
                          person(c, 470, 1080, 0.85, -1, VITYA, dict(sit=True, eyes="half", talk=True), t))),
    S("А твоей копии нигде нет. Только мокрые следы ведут… к !шкафу!.",
      lambda c, x, t, T: (room(c, x, t, dict(night=False, time="08:16", hatch="closed", carpet=False,
                                             wopen=0.15)), footprints(c, phase(t, 0.3, 2.0))),
      zoom=(1.0, 1.35, 520, 900), post=0.8, sfx=[(-0.8, "sting")]),
    S("Вы съезжаете в тот же день.",
      lambda c, x, t, T: (building(c, x, t, {}),
                          person(c, lerp(330, 820, phase(t, 0, T)), 1080, 0.62, 1, HERO, walk_pose(t), t),
                          person(c, lerp(230, 720, phase(t, 0, T)), 1080, 0.6, 1, VITYA, walk_pose(t + 0.3), t))),
    S("А через неделю на подъезде висит объявление: «Сдаётся. *Дёшево*».",
      lambda c, x, t, T: building(c, x, t, dict(ad=True)), zoom=(1.0, 2.8, 360, 835),
      badge=("АРЕНДА 4 000 ₽", "#FFD21E")),
    S("Новый жилец засыпает. Ровно в {3:07|три ноль семь}…",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:06" if t < T - 0.6 else "03:07", hatch=None)),
                          sleeping(c, 340, 880, TENANT, t=t)),
      night=1.0, zoom=(1.0, 1.2, 400, 860), sfx=[(-0.6, "tick")]),
    S("",
      lambda c, x, t, T: (room(c, x, t, dict(time="03:07", hatch=None)),
                          sleeping(c, 340, 880, TENANT, eyes="wide" if t > 0.9 else "closed", t=t)),
      night=1.0, dur=2.6, sfx=ks(0.3, RHYTHM), shake=[(0.3 + k, 0.12, 9) for k in RHYTHM],
      zoom=(1.2, 1.5, 300, 860), caption="ТУК… ТУК-ТУК"),
], next="КОНЕЦ?", next_small="ПОДПИШИСЬ, ЧТОБЫ НЕ ПРОПУСТИТЬ")
