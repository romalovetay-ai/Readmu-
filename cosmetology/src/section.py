"""Cross-section of the skin, drawn with cairo: stratum corneum, epidermis, dermis, and the active's molecules at work.

draw(cr, kind, t, dur, q, particles_on) -- q is local healing 0..1.
"""
import math
import random
import cairo
from char import PAL, mix

W, H = 1080, 1920
SURF = 360          # skin surface y
EPI = 840           # dermo-epidermal junction (mean)
_geo = {}


def geo(kind):
    if kind in _geo:
        return _geo[kind]
    rnd = random.Random(42)
    g = {}
    bricks = []
    for row in range(5):
        x = -rnd.uniform(0, 120)
        while x < W + 40:
            w = rnd.uniform(110, 170)
            bricks.append((row, x, w, rnd.uniform(-1, 1), rnd.random()))
            x += w + 5
    g["bricks"] = bricks
    cells = []
    y = SURF + 112
    row = 0
    while y < EPI - 10:
        f = (y - SURF) / (EPI - SURF)
        size = 62 - 6 * f
        flat = 0.55 + 0.45 * f
        x = -rnd.uniform(0, size)
        while x < W + size:
            cells.append((x + rnd.uniform(-6, 6), y + rnd.uniform(-5, 5), size * rnd.uniform(0.9, 1.08) / 2,
                          flat, rnd.random(), f))
            x += size * 1.02
        y += size * flat * 0.92
        row += 1
    g["cells"] = cells
    g["mel"] = [(140 + i * 260 + rnd.uniform(-30, 30), EPI - 24) for i in range(4)]
    g["granules"] = []
    for (mx, my) in g["mel"]:
        for _ in range(60):
            g["granules"].append((mx + rnd.gauss(0, 85), my - abs(rnd.gauss(0, 170)) - 20, rnd.uniform(3, 6.5),
                                  rnd.random()))
    g["fibers"] = []
    for i in range(22):
        y0 = EPI + 120 + i * 48 + rnd.uniform(-15, 15)
        g["fibers"].append((y0, rnd.uniform(0, 6.28), rnd.uniform(18, 34), rnd.uniform(0.6, 1.0), rnd.random()))
    g["elastin"] = [(EPI + 150 + rnd.uniform(0, 950), rnd.uniform(0, 6.28)) for _ in range(9)]
    g["fibro"] = [(rnd.uniform(80, W - 80), EPI + 200 + rnd.uniform(0, 860), rnd.uniform(-0.4, 0.4)) for _ in range(8)]
    g["radicals"] = [(rnd.uniform(60, W - 60), rnd.uniform(SURF + 40, EPI - 60), rnd.random() * 6.28, rnd.random())
                     for _ in range(26)]
    g["water"] = [(rnd.uniform(30, W - 30), rnd.uniform(SURF - 150, EPI - 60), rnd.random()) for _ in range(90)]
    parts = []
    for i in range(90):
        parts.append(dict(start=rnd.uniform(0.0, 0.55), x0=W / 2 + rnd.gauss(0, 120), ph=rnd.uniform(0, 6.28),
                          depth=rnd.random(), spread=rnd.gauss(0, 1), r=rnd.uniform(7, 12)))
    g["parts"] = parts
    _geo[kind] = g
    return g


def junction_y(x):
    return EPI + 26 * math.sin(x / 95.0) + 10 * math.sin(x / 37.0 + 1.3)


def rr_path(cr, x, y, w, h, r):
    cr.new_path()
    cr.arc(x + w - r, y + r, r, -math.pi / 2, 0)
    cr.arc(x + w - r, y + h - r, r, 0, math.pi / 2)
    cr.arc(x + r, y + h - r, r, math.pi / 2, math.pi)
    cr.arc(x + r, y + r, r, math.pi, 3 * math.pi / 2)
    cr.close_path()


def draw(cr, kind, t, dur, q, mol_t):
    p = PAL[kind]
    g = geo(kind)
    # --- air above the skin, with the serum film
    gr = cairo.LinearGradient(0, 0, 0, SURF)
    gr.add_color_stop_rgb(0, 0.99, 0.96, 0.93)
    gr.add_color_stop_rgb(1, 0.96, 0.89, 0.84)
    cr.set_source(gr)
    cr.rectangle(0, 0, W, SURF + 10)
    cr.fill()
    film = min(1.0, mol_t * 3)
    if film > 0:
        gr = cairo.LinearGradient(0, SURF - 60, 0, SURF)
        gr.add_color_stop_rgba(0, *p["light"], 0.0)
        gr.add_color_stop_rgba(1, *p["base"], 0.55 * film * (1 - 0.6 * q))
        cr.set_source(gr)
        cr.rectangle(0, SURF - 60, W, 62)
        cr.fill()
    # --- dermis background
    gr = cairo.LinearGradient(0, EPI, 0, H)
    gr.add_color_stop_rgb(0, 0.96, 0.70, 0.66)
    gr.add_color_stop_rgb(0.5, 0.90, 0.56, 0.55)
    gr.add_color_stop_rgb(1, 0.70, 0.36, 0.38)
    cr.set_source(gr)
    cr.rectangle(0, EPI - 60, W, H)
    cr.fill()
    # collagen bundles
    dens = q if kind == "retinol" else 0.75
    for i, (y0, ph, amp, br, rr) in enumerate(g["fibers"]):
        if kind == "retinol" and rr > 0.35 + 0.65 * dens:
            continue
        thick = (10 + 14 * (dens if kind == "retinol" else 0.8)) * br
        for k in range(5):
            off = (k - 2) * thick * 0.28
            cr.new_path()
            for xi in range(0, W + 41, 40):
                yy = y0 + off + amp * math.sin(xi / 160.0 + ph) + 6 * math.sin(xi / 47.0 + ph * 2)
                if xi == 0:
                    cr.move_to(xi - 20, yy)
                else:
                    cr.line_to(xi - 20, yy)
            cr.set_line_width(thick * 0.32)
            cr.set_line_cap(cairo.LINE_CAP_ROUND)
            shade = 0.92 + 0.08 * (k % 2)
            cr.set_source_rgba(1.0 * shade, 0.86 * shade, 0.82 * shade, 0.55 + 0.25 * (k == 2))
            cr.stroke()
        if kind == "retinol" and q > 0.3:
            # new fibres glow while they form
            glow = max(0.0, min(1.0, (q - 0.3) * 3)) * (1 - max(0.0, q - 0.85) * 6)
            if glow > 0 and rr > 0.35:
                cr.new_path()
                for xi in range(0, W + 41, 40):
                    yy = y0 + amp * math.sin(xi / 160.0 + ph) + 6 * math.sin(xi / 47.0 + ph * 2)
                    cr.line_to(xi - 20, yy)
                cr.set_line_width(thick * 1.6)
                cr.set_source_rgba(*p["light"], 0.25 * glow)
                cr.stroke()
    for (y0, ph) in g["elastin"]:
        cr.new_path()
        for xi in range(0, W + 31, 30):
            cr.line_to(xi, y0 + 30 * math.sin(xi / 70.0 + ph) + 14 * math.sin(xi / 23.0))
        cr.set_line_width(3)
        cr.set_source_rgba(1.0, 0.9, 0.55, 0.55)
        cr.stroke()
    # capillary loops with moving blood cells
    for cx in (200, 560, 900):
        cr.new_path()
        cr.move_to(cx - 26, H)
        cr.curve_to(cx - 30, EPI + 300, cx - 22, EPI + 40, cx, EPI + 30)
        cr.curve_to(cx + 22, EPI + 40, cx + 30, EPI + 300, cx + 26, H)
        cr.set_line_width(22)
        cr.set_source_rgba(0.78, 0.16, 0.20, 0.55)
        cr.stroke_preserve()
        cr.set_line_width(12)
        cr.set_source_rgba(0.92, 0.30, 0.32, 0.6)
        cr.stroke()
        for k in range(10):
            s = ((t * 0.12 + k / 10.0) % 1.0)
            if s < 0.5:
                u = s * 2
                yy = H - (H - EPI - 40) * u
                xx = cx - 26 + 4 * u
            else:
                u = (s - 0.5) * 2
                yy = EPI + 40 + (H - EPI - 40) * u
                xx = cx + 26 - 4 * (1 - u)
            cr.save()
            cr.translate(xx, yy)
            cr.scale(1, 0.6)
            cr.arc(0, 0, 7, 0, 2 * math.pi)
            cr.restore()
            cr.set_source_rgba(0.75, 0.05, 0.10, 0.9)
            cr.fill()
    # fibroblasts
    for i, (fx, fy, a) in enumerate(g["fibro"]):
        act = q if kind == "retinol" else 0.2
        cr.save()
        cr.translate(fx, fy)
        cr.rotate(a)
        if kind == "retinol" and act > 0.1:
            rg = cairo.RadialGradient(0, 0, 0, 0, 0, 90)
            rg.add_color_stop_rgba(0, *p["light"], 0.55 * act * (0.7 + 0.3 * math.sin(t * 6 + i)))
            rg.add_color_stop_rgba(1, *p["base"], 0)
            cr.set_source(rg)
            cr.arc(0, 0, 90, 0, 2 * math.pi)
            cr.fill()
        cr.scale(46, 15)
        cr.arc(0, 0, 1, 0, 2 * math.pi)
        rg = cairo.RadialGradient(-0.2, -0.3, 0.1, 0, 0, 1)
        rg.add_color_stop_rgb(0, 0.95, 0.78, 0.90)
        rg.add_color_stop_rgb(1, 0.70, 0.45, 0.68)
        cr.set_source(rg)
        cr.fill()
        cr.scale(1 / 46, 1 / 15)
        cr.arc(0, 0, 9, 0, 2 * math.pi)
        cr.set_source_rgb(0.45, 0.25, 0.50)
        cr.fill()
        cr.restore()
    # hair follicle + sebaceous gland (B3)
    if kind == "b3":
        fx = 300
        infl = 1 - q
        rg = cairo.RadialGradient(fx, SURF + 150, 10, fx, SURF + 150, 380)
        rg.add_color_stop_rgba(0, 1.0, 0.15, 0.15, 0.55 * infl)
        rg.add_color_stop_rgba(1, 1.0, 0.2, 0.2, 0)
        cr.set_source(rg)
        cr.rectangle(0, 0, W, H)
        cr.fill()
        cr.new_path()
        cr.move_to(fx - 46, SURF)
        cr.curve_to(fx - 40, SURF + 400, fx - 34, SURF + 700, fx - 38, SURF + 980)
        cr.line_to(fx + 38, SURF + 980)
        cr.curve_to(fx + 34, SURF + 700, fx + 40, SURF + 400, fx + 46, SURF)
        cr.close_path()
        cr.set_source_rgb(0.86, 0.62, 0.58)
        cr.fill_preserve()
        cr.set_line_width(4)
        cr.set_source_rgb(0.70, 0.45, 0.42)
        cr.stroke()
        cr.new_path()
        cr.move_to(fx, SURF + 960)
        cr.curve_to(fx + 4, SURF + 600, fx - 6, SURF + 200, fx + 30, SURF - 160)
        cr.set_line_width(13)
        cr.set_source_rgb(0.35, 0.22, 0.16)
        cr.stroke()
        size = 1.0 - 0.42 * q
        for (dx, dy, r) in ((70, 470, 70), (120, 540, 62), (78, 600, 58), (130, 450, 46)):
            r2 = r * size
            rg = cairo.RadialGradient(fx + dx * (0.7 + 0.3 * size) - r2 * 0.3, SURF + dy - r2 * 0.3, 2,
                                      fx + dx * (0.7 + 0.3 * size), SURF + dy, r2)
            rg.add_color_stop_rgb(0, 1.0, 0.95, 0.65)
            rg.add_color_stop_rgb(0.7, 0.96, 0.80, 0.35)
            rg.add_color_stop_rgb(1, 0.80, 0.60, 0.22)
            cr.set_source(rg)
            cr.arc(fx + dx * (0.7 + 0.3 * size), SURF + dy, r2, 0, 2 * math.pi)
            cr.fill()
        # sebum rising
        rate = 1.0 - 0.8 * q
        for k in range(14):
            s = (t * 0.25 + k / 14.0) % 1.0
            if (k / 14.0) > rate:
                continue
            yy = SURF + 520 - s * 600
            cr.arc(fx + 6 * math.sin(k + t * 3), yy, 10 + 4 * (k % 2), 0, 2 * math.pi)
            cr.set_source_rgba(1.0, 0.86, 0.35, 0.85)
            cr.fill()
        # sebum pool on the surface
        cr.save()
        cr.translate(fx, SURF - 6)
        cr.scale(140 * rate + 20, 22 * rate + 4)
        cr.arc(0, 0, 1, math.pi, 2 * math.pi)
        cr.restore()
        cr.set_source_rgba(1.0, 0.88, 0.4, 0.75)
        cr.fill()
    # --- epidermis
    gr = cairo.LinearGradient(0, SURF, 0, EPI)
    gr.add_color_stop_rgb(0, 0.97, 0.84, 0.76)
    gr.add_color_stop_rgb(1, 0.95, 0.76, 0.70)
    cr.set_source(gr)
    cr.new_path()
    cr.move_to(0, SURF + 80)
    cr.line_to(W, SURF + 80)
    for xi in range(W, -11, -10):
        cr.line_to(xi, junction_y(xi))
    cr.close_path()
    cr.fill()
    plump = 0.84 + 0.16 * q if kind == "ha" else 0.97
    for (x, y, r, flat, rr, f) in g["cells"]:
        if kind == "b3" and abs(x - 300) < 60:
            continue
        if y + r * flat > junction_y(x) + 8:
            continue
        rx, ry = r * plump, r * flat * plump
        cr.save()
        cr.translate(x, y)
        cr.scale(rx, ry)
        cr.arc(0, 0, 1, 0, 2 * math.pi)
        cr.restore()
        rg = cairo.RadialGradient(x - rx * 0.3, y - ry * 0.4, 1, x, y, max(rx, ry))
        tint = (0.99, 0.88, 0.80) if not (kind == "ha" and q > 0) else mix((0.99, 0.88, 0.80), (0.92, 0.95, 1.0), 0.35 * q)
        rg.add_color_stop_rgb(0, *mix(tint, (1, 1, 1), 0.3))
        rg.add_color_stop_rgb(0.75, *tint)
        rg.add_color_stop_rgb(1, 0.86, 0.62, 0.58)
        cr.set_source(rg)
        cr.fill_preserve()
        cr.set_line_width(2)
        cr.set_source_rgba(0.75, 0.48, 0.45, 0.6)
        cr.stroke()
        if kind == "ha" and q > 0.05:
            cr.arc(x - rx * 0.35, y - ry * 0.35, rx * 0.18, 0, 2 * math.pi)
            cr.set_source_rgba(1, 1, 1, 0.55 * q)
            cr.fill()
        cr.save()
        cr.translate(x + rx * 0.1, y + ry * 0.05)
        cr.scale(rx * 0.32, ry * 0.32 / max(flat, 0.6))
        cr.arc(0, 0, 1, 0, 2 * math.pi)
        cr.restore()
        cr.set_source_rgba(0.62, 0.38, 0.55, 0.75)
        cr.fill()
    # melanocytes and melanin
    if kind == "vitc":
        mel = 1 - 0.85 * q
        for (gx, gy, gr_, rr) in g["granules"]:
            cr.arc(gx, gy, gr_, 0, 2 * math.pi)
            cr.set_source_rgba(0.35, 0.18, 0.08, 0.85 * mel * (0.6 + 0.4 * rr))
            cr.fill()
        for (mx, my) in g["mel"]:
            for k in range(6):
                a = -math.pi / 2 + (k - 2.5) * 0.45
                cr.new_path()
                cr.move_to(mx, my)
                cr.curve_to(mx + math.cos(a) * 40, my + math.sin(a) * 30, mx + math.cos(a) * 80, my + math.sin(a) * 90,
                            mx + math.cos(a) * 95, my + math.sin(a) * 120)
                cr.set_line_width(8)
                cr.set_source_rgba(0.42 + 0.3 * q, 0.24 + 0.25 * q, 0.14 + 0.2 * q, 0.9)
                cr.stroke()
            rg = cairo.RadialGradient(mx - 8, my - 8, 2, mx, my, 30)
            rg.add_color_stop_rgb(0, 0.70 + 0.2 * q, 0.48 + 0.2 * q, 0.32 + 0.2 * q)
            rg.add_color_stop_rgb(1, 0.34 + 0.3 * q, 0.18 + 0.25 * q, 0.10 + 0.2 * q)
            cr.set_source(rg)
            cr.arc(mx, my, 28, 0, 2 * math.pi)
            cr.fill()
    # basement membrane
    cr.new_path()
    for xi in range(0, W + 11, 10):
        cr.line_to(xi, junction_y(xi))
    cr.set_line_width(5)
    cr.set_source_rgba(0.80, 0.50, 0.50, 0.9)
    cr.stroke()
    # --- stratum corneum (bricks and mortar)
    cr.set_source_rgb(1.0, 0.95, 0.86) if kind != "b3" else cr.set_source_rgb(*mix((0.93, 0.80, 0.70), (1.0, 0.95, 0.86), q))
    cr.rectangle(0, SURF, W, 112)
    cr.fill()
    for (row, x, w, jit, rr) in g["bricks"]:
        y = SURF + 4 + row * 21
        lift = 0.0
        if kind == "ha":
            lift = (1 - q) * (1 if row < 2 and rr > 0.35 else 0)
        if kind == "b3" and abs(x + w / 2 - 300) < 70:
            continue
        cr.save()
        cr.translate(x + w / 2, y + 8)
        cr.rotate(lift * jit * 0.22)
        cr.translate(0, -lift * (14 - row * 5))
        rr_path(cr, -w / 2, -8, w, 16, 7)
        cr.restore()
        gr = cairo.LinearGradient(0, y, 0, y + 16)
        dry = (1 - q) if kind == "ha" else 0
        c1 = mix((0.95, 0.80, 0.70), (0.96, 0.92, 0.88), dry)
        gr.add_color_stop_rgb(0, *mix(c1, (1, 1, 1), 0.25))
        gr.add_color_stop_rgb(1, *mix(c1, (0.75, 0.55, 0.5), 0.35))
        cr.set_source(gr)
        cr.fill()
    # --- free radicals (Vitamin C neutralises them)
    if kind == "vitc":
        for i, (rx_, ry_, ph, rr) in enumerate(g["radicals"]):
            gone = q * 1.25 - rr * 0.35
            a = max(0.0, 1 - gone * 1.4)
            if a <= 0:
                continue
            x = rx_ + 14 * math.sin(t * 2 + ph)
            y = ry_ + 10 * math.cos(t * 1.7 + ph)
            cr.save()
            cr.translate(x, y)
            cr.rotate(t * 2 + ph)
            rg = cairo.RadialGradient(0, 0, 0, 0, 0, 34)
            rg.add_color_stop_rgba(0, 1.0, 0.25, 0.1, 0.5 * a)
            rg.add_color_stop_rgba(1, 1.0, 0.25, 0.1, 0)
            cr.set_source(rg)
            cr.arc(0, 0, 34, 0, 2 * math.pi)
            cr.fill()
            cr.new_path()
            for k in range(14):
                rad = 16 if k % 2 == 0 else 7
                aa = k * math.pi / 7
                cr.line_to(math.cos(aa) * rad, math.sin(aa) * rad)
            cr.close_path()
            cr.set_source_rgba(0.95, 0.15, 0.08, 0.9 * a)
            cr.fill()
            cr.restore()
    # --- water (HA)
    if kind == "ha":
        for (wx, wy, rr) in g["water"]:
            appear = max(0.0, min(1.0, (mol_t - rr * 0.5) * 3))
            if appear <= 0:
                continue
            yy = wy - 150 * (1 - appear)
            cr.arc(wx + 5 * math.sin(t * 2 + rr * 9), yy, 6 + 3 * rr, 0, 2 * math.pi)
            cr.set_source_rgba(0.45, 0.78, 1.0, 0.75 * appear)
            cr.fill()
            cr.arc(wx + 5 * math.sin(t * 2 + rr * 9) - 2, yy - 2, 2, 0, 2 * math.pi)
            cr.set_source_rgba(1, 1, 1, 0.9 * appear)
            cr.fill()
    # --- active molecules
    target = {"vitc": (SURF + 80, EPI), "ha": (SURF + 20, EPI - 150), "retinol": (SURF + 200, H - 200),
              "b3": (SURF + 60, SURF + 700)}[kind]
    for pt in g["parts"]:
        s = (mol_t - pt["start"]) / 0.45
        if s <= 0:
            continue
        s = min(s, 1.0)
        e = 1 - (1 - s) ** 2.2
        ty = target[0] + (target[1] - target[0]) * pt["depth"]
        y = SURF - 90 + (ty - SURF + 90) * e
        x = pt["x0"] + pt["spread"] * 330 * e + 18 * math.sin(t * 2.5 + pt["ph"])
        if kind == "b3" and pt["depth"] < 0.45:
            x = 300 + (x - 300) * 0.5
        r = pt["r"]
        rg = cairo.RadialGradient(x, y, 0, x, y, r * 3.2)
        rg.add_color_stop_rgba(0, *p["light"], 0.7)
        rg.add_color_stop_rgba(1, *p["base"], 0)
        cr.set_source(rg)
        cr.arc(x, y, r * 3.2, 0, 2 * math.pi)
        cr.fill()
        rg = cairo.RadialGradient(x - r * 0.35, y - r * 0.35, 1, x, y, r)
        rg.add_color_stop_rgb(0, 1, 1, 1)
        rg.add_color_stop_rgb(0.35, *p["light"])
        rg.add_color_stop_rgb(1, *p["base"])
        cr.set_source(rg)
        cr.arc(x, y, r, 0, 2 * math.pi)
        cr.fill()
    # layer tags
    for (yy, txt) in ((SURF + 40, "роговой слой"), (SURF + 330, "эпидермис"), (EPI + 260, "дерма")):
        tag(cr, 40, yy, txt)


def tag(cr, x, y, txt):
    cr.select_font_face("Inter", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    cr.set_font_size(26)
    e = cr.text_extents(txt)
    rr_path(cr, x, y - 24, e.x_advance + 32, 40, 20)
    cr.set_source_rgba(0.15, 0.07, 0.06, 0.45)
    cr.fill()
    cr.move_to(x + 16, y + 5)
    cr.set_source_rgba(1, 1, 1, 0.95)
    cr.show_text(txt)
