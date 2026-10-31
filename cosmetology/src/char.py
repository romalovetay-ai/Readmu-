"""Glossy translucent mascots drawn with cairo: Vitamin C drop, Hyaluronic acid drop, Retinol capsule, Niacinamide pearl."""
import math
import cairo

PAL = {
    "vitc": dict(base=(1.00, 0.55, 0.05), light=(1.00, 0.86, 0.50), dark=(0.72, 0.25, 0.00), iris=(0.36, 0.16, 0.02),
                 label="C", shape="drop"),
    "ha": dict(base=(0.20, 0.68, 1.00), light=(0.78, 0.94, 1.00), dark=(0.02, 0.38, 0.75), iris=(0.03, 0.22, 0.45),
               label="HA", shape="drop"),
    "retinol": dict(base=(0.95, 0.66, 0.10), light=(1.00, 0.92, 0.62), dark=(0.66, 0.36, 0.02), iris=(0.35, 0.18, 0.02),
                    label="A", shape="capsule"),
    "b3": dict(base=(0.40, 0.86, 0.74), light=(0.90, 1.00, 0.96), dark=(0.10, 0.52, 0.44), iris=(0.04, 0.30, 0.26),
               label="B3", shape="pearl"),
}


def rgba(c, a=1.0):
    return (c[0], c[1], c[2], a)


def mix(a, b, t):
    return tuple(a[i] + (b[i] - a[i]) * t for i in range(3))


def body_path(cr, shape):
    """Body in unit space: bottom at y=0, top at y=-1, centred on x=0."""
    cr.new_path()
    if shape == "drop":
        r = 0.40
        cy = -r - 0.01
        cr.move_to(0, -1.04)
        cr.curve_to(0.10, -0.86, r * 1.02, -0.66, r, cy)
        cr.arc(0, cy, r, 0, math.pi)
        cr.curve_to(-r * 1.02, -0.66, -0.10, -0.86, 0, -1.04)
        cr.close_path()
    elif shape == "capsule":
        w, rr = 0.33, 0.33
        cr.arc(0, -1 + rr, w, math.pi, 2 * math.pi)
        cr.arc(0, -rr, w, 0, math.pi)
        cr.close_path()
    else:
        cr.arc(0, -0.47, 0.47, 0, 2 * math.pi)
        cr.close_path()


def body_halfwidth(shape, y):
    if shape == "drop":
        return 0.40 if y > -0.6 else 0.40 * max(0.0, (1.04 + y) / 0.44)
    if shape == "capsule":
        return 0.33
    return math.sqrt(max(0.0, 0.47 ** 2 - (y + 0.47) ** 2))


def draw_shadow(cr, x, y, h, kind, alpha=1.0, lift=0.0):
    """Contact shadow plus the coloured caustic a translucent body throws on the skin."""
    p = PAL[kind]
    s = h * (1 - 0.35 * min(1.0, lift))
    a = alpha * (1 - 0.6 * min(1.0, lift))
    cr.save()
    cr.translate(x + h * 0.10, y + h * 0.015)
    cr.scale(s * 0.42, s * 0.085)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, 1)
    g.add_color_stop_rgba(0, 0.18, 0.08, 0.05, 0.55 * a)
    g.add_color_stop_rgba(0.6, 0.25, 0.12, 0.08, 0.25 * a)
    g.add_color_stop_rgba(1, 0.3, 0.15, 0.1, 0)
    cr.set_source(g)
    cr.arc(0, 0, 1, 0, 2 * math.pi)
    cr.fill()
    cr.restore()
    cr.save()
    cr.translate(x + h * 0.22, y + h * 0.02)
    cr.scale(s * 0.20, s * 0.045)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, 1)
    g.add_color_stop_rgba(0, *mix(p["light"], (1, 1, 1), 0.3), 0.55 * a)
    g.add_color_stop_rgba(1, *p["base"], 0)
    cr.set_source(g)
    cr.arc(0, 0, 1, 0, 2 * math.pi)
    cr.fill()
    cr.restore()


def limb(cr, x0, y0, x1, y1, cx, cy, w, col_dark, col):
    cr.new_path()
    cr.move_to(x0, y0)
    cr.curve_to(cx, cy, cx, cy, x1, y1)
    cr.set_line_cap(cairo.LINE_CAP_ROUND)
    cr.set_line_width(w * 1.25)
    cr.set_source_rgba(*col_dark, 1)
    cr.stroke_preserve()
    cr.set_line_width(w * 0.75)
    cr.set_source_rgba(*mix(col, (1, 1, 1), 0.15), 1)
    cr.stroke()
    cr.new_path()


def hand(cr, x, y, r, p, open_=0.0):
    g = cairo.RadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r * 1.1)
    g.add_color_stop_rgb(0, *mix(p["light"], (1, 1, 1), 0.4))
    g.add_color_stop_rgb(0.6, *p["base"])
    g.add_color_stop_rgb(1, *p["dark"])
    cr.set_source(g)
    cr.arc(x, y, r, 0, 2 * math.pi)
    cr.fill()


def draw(cr, kind, x, y, h, t=0.0, mouth=0.0, pose=None):
    """Draw the mascot with its feet at (x, y), total height h px.

    pose keys: arm_l / arm_r ('rest' | 'wave' | 'point' | 'up' | 'hip'), point (dx, dy) direction,
    squash (-1..1), blink (0..1), mood ('happy' | 'worried' | 'wow'), look (dx, dy) eye offset, lean (rad).
    """
    pose = pose or {}
    p = PAL[kind]
    shape = p["shape"]
    sq = pose.get("squash", 0.0)
    sx, sy = 1 + 0.18 * sq, 1 - 0.18 * sq
    leg = 0.2
    cr.save()
    cr.translate(x, y)
    cr.rotate(pose.get("lean", 0.0))
    cr.scale(h * sx, h * sy)
    lw = 0.052
    # legs and feet
    step = pose.get("step", 0.0)
    for side in (-1, 1):
        fx = side * 0.13 + (step * side * 0.04)
        fy = -0.005 - max(0.0, step * side) * 0.05
        limb(cr, side * 0.11, -leg - 0.02, fx, fy - 0.02, side * 0.12, -leg * 0.5, lw, p["dark"], p["base"])
        cr.save()
        cr.translate(fx + side * 0.03, fy)
        cr.scale(0.085, 0.042)
        g = cairo.RadialGradient(-0.3, -0.5, 0.1, 0, 0, 1.1)
        g.add_color_stop_rgb(0, 1, 1, 1)
        g.add_color_stop_rgb(0.7, 0.93, 0.93, 0.95)
        g.add_color_stop_rgb(1, 0.7, 0.7, 0.75)
        cr.set_source(g)
        cr.arc(0, 0, 1, 0, 2 * math.pi)
        cr.fill()
        cr.restore()
    cr.translate(0, -leg)
    bh = 1 - leg            # body height in unit space
    cr.scale(bh, bh)
    # arms behind the body for 'rest', in front otherwise; draw them after body for clarity
    def arm(side, mode):
        sh_y = -0.45
        hw = body_halfwidth(shape, sh_y)
        x0, y0 = side * (hw - 0.03), sh_y
        if mode == "wave":
            a = -math.pi / 2 - side * (0.5 + 0.35 * math.sin(t * 9))
            ln = 0.42
        elif mode == "up":
            a = -math.pi / 2 - side * 0.55 + 0.08 * math.sin(t * 8 + side)
            ln = 0.45
        elif mode == "point":
            dx, dy = pose.get("point", (side, 0))
            a = math.atan2(dy, dx)
            ln = 0.5
        elif mode == "hip":
            a = math.pi / 2 + side * 0.9
            ln = 0.26
        else:
            a = math.pi / 2 - side * (0.55 + 0.05 * math.sin(t * 2.2 + side))
            ln = 0.34
        x1, y1 = x0 + math.cos(a) * ln, y0 + math.sin(a) * ln
        if mode == "hip":
            cx, cy = x0 + side * 0.22, y0 + 0.02
            x1, y1 = x0 + side * 0.02, y0 + 0.24
        else:
            bend = 0.12 * side
            cx, cy = (x0 + x1) / 2 + side * 0.08, (y0 + y1) / 2 + (0.06 if mode in ("wave", "up") else -0.02)
        limb(cr, x0, y0, x1, y1, cx, cy, lw * 1.1 / bh, p["dark"], p["base"])
        hand(cr, x1, y1, 0.075, p)

    # body
    body_path(cr, shape)
    path = cr.copy_path()
    cr.save()
    cr.append_path(path)
    cr.clip()
    g = cairo.RadialGradient(-0.16, -0.66, 0.05, 0.0, -0.45, 0.62)
    g.add_color_stop_rgba(0, *mix(p["light"], (1, 1, 1), 0.2), 1)
    g.add_color_stop_rgba(0.45, *p["base"], 1)
    g.add_color_stop_rgba(1, *p["dark"], 1)
    cr.set_source(g)
    cr.paint()
    if shape == "capsule":     # second half of the soft-gel in a deeper shade
        cr.rectangle(-0.5, -0.5, 1, 0.6)
        cr.set_source_rgba(*p["dark"], 0.28)
        cr.fill()
        cr.rectangle(-0.5, -0.515, 1, 0.03)
        cr.set_source_rgba(1, 1, 1, 0.25)
        cr.fill()
    if shape == "pearl":       # iridescent sheen
        g = cairo.LinearGradient(-0.5, -0.9, 0.5, 0.0)
        g.add_color_stop_rgba(0, 1.0, 0.85, 0.95, 0.0)
        g.add_color_stop_rgba(0.45, 0.85, 0.80, 1.0, 0.35)
        g.add_color_stop_rgba(0.7, 1.0, 1.0, 0.85, 0.25)
        g.add_color_stop_rgba(1, 1.0, 0.9, 0.8, 0.0)
        cr.set_source(g)
        cr.paint()
    # caustic glow at the bottom (light focused through the body)
    g = cairo.RadialGradient(0.10, -0.12, 0.0, 0.10, -0.12, 0.38)
    g.add_color_stop_rgba(0, *mix(p["light"], (1, 1, 0.9), 0.4), 0.85)
    g.add_color_stop_rgba(1, *p["light"], 0)
    cr.set_source(g)
    cr.paint()
    # floating bubbles inside
    for i in range(7):
        ph = (t * (0.08 + 0.02 * i) + i * 0.37) % 1.0
        bx = math.sin(i * 2.3 + t * 0.9) * 0.22
        by = -0.08 - ph * 0.8
        br = 0.012 + 0.012 * ((i * 7) % 3)
        a = math.sin(ph * math.pi)
        cr.arc(bx, by, br, 0, 2 * math.pi)
        cr.set_source_rgba(1, 1, 1, 0.18 * a)
        cr.fill_preserve()
        cr.set_line_width(0.006)
        cr.set_source_rgba(1, 1, 1, 0.55 * a)
        cr.stroke()
    # fresnel: darker rim, then a thin back-light on the lower right
    cr.append_path(path)
    cr.set_line_width(0.10)
    cr.set_source_rgba(*p["dark"], 0.35)
    cr.stroke()
    cr.append_path(path)
    cr.set_line_width(0.035)
    g = cairo.LinearGradient(-0.4, -0.9, 0.4, 0.0)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.0)
    g.add_color_stop_rgba(0.6, 1, 1, 1, 0.0)
    g.add_color_stop_rgba(1, *mix(p["light"], (1, 1, 1), 0.5), 0.9)
    cr.set_source(g)
    cr.stroke()
    # label on the belly
    cr.select_font_face("Inter Display Black", cairo.FONT_SLANT_NORMAL, cairo.FONT_WEIGHT_BOLD)
    fs = 0.24 if len(p["label"]) == 1 else 0.17
    cr.set_font_size(fs)
    ext = cr.text_extents(p["label"])
    ly = -0.13
    cr.move_to(-ext.width / 2 - ext.x_bearing, ly)
    cr.text_path(p["label"])
    cr.set_source_rgba(1, 1, 1, 0.78)
    cr.fill()
    cr.restore()
    # specular highlights (outside the clip so they stay crisp)
    cr.save()
    cr.translate(-0.17, -0.70 if shape != "pearl" else -0.72)
    cr.rotate(-0.6)
    cr.scale(0.075, 0.15)
    g = cairo.RadialGradient(0, 0, 0, 0, 0, 1)
    g.add_color_stop_rgba(0, 1, 1, 1, 0.95)
    g.add_color_stop_rgba(0.5, 1, 1, 1, 0.55)
    g.add_color_stop_rgba(1, 1, 1, 1, 0)
    cr.set_source(g)
    cr.arc(0, 0, 1, 0, 2 * math.pi)
    cr.fill()
    cr.restore()
    cr.arc(-0.07, -0.86 if shape == "drop" else -0.88, 0.025, 0, 2 * math.pi)
    cr.set_source_rgba(1, 1, 1, 0.9)
    cr.fill()
    cr.arc(0.27, -0.22, 0.02, 0, 2 * math.pi)
    cr.set_source_rgba(1, 1, 1, 0.5)
    cr.fill()
    # face
    mood = pose.get("mood", "happy")
    lx, ly2 = pose.get("look", (0.0, 0.0))
    blink = pose.get("blink", 0.0)
    ey = -0.53
    for side in (-1, 1):
        ex = side * 0.13
        cr.save()
        cr.translate(ex, ey)
        cr.scale(1, max(0.06, 1 - blink))
        cr.arc(0, 0, 0.082, 0, 2 * math.pi)
        g = cairo.RadialGradient(-0.02, -0.03, 0.01, 0, 0, 0.09)
        g.add_color_stop_rgb(0, 1, 1, 1)
        g.add_color_stop_rgb(0.8, 0.96, 0.96, 0.98)
        g.add_color_stop_rgb(1, 0.82, 0.84, 0.9)
        cr.set_source(g)
        cr.fill()
        ix, iy = lx * 0.025, ly2 * 0.025
        cr.arc(ix, iy + 0.008, 0.055, 0, 2 * math.pi)
        g = cairo.RadialGradient(ix, iy + 0.03, 0.005, ix, iy + 0.008, 0.055)
        g.add_color_stop_rgb(0, *mix(p["base"], (1, 1, 1), 0.2))
        g.add_color_stop_rgb(0.55, *p["iris"])
        g.add_color_stop_rgb(1, 0.05, 0.03, 0.02)
        cr.set_source(g)
        cr.fill()
        cr.arc(ix, iy + 0.008, 0.028, 0, 2 * math.pi)
        cr.set_source_rgb(0.02, 0.01, 0.01)
        cr.fill()
        cr.arc(ix - 0.02, iy - 0.017, 0.016, 0, 2 * math.pi)
        cr.set_source_rgba(1, 1, 1, 0.95)
        cr.fill()
        cr.arc(ix + 0.018, iy + 0.025, 0.008, 0, 2 * math.pi)
        cr.set_source_rgba(1, 1, 1, 0.8)
        cr.fill()
        cr.restore()
        # brows
        cr.new_path()
        tilt = {"happy": 0.0, "worried": 0.06, "wow": -0.03}.get(mood, 0)
        by = ey - 0.115 - (0.02 if mood == "wow" else 0)
        cr.move_to(ex - side * 0.055, by - tilt * 1.4)
        cr.curve_to(ex - side * 0.02, by - 0.025, ex + side * 0.02, by - 0.025, ex + side * 0.06, by + tilt * 0.6 + 0.005)
        cr.set_line_width(0.022)
        cr.set_line_cap(cairo.LINE_CAP_ROUND)
        cr.set_source_rgba(*p["iris"], 0.9)
        cr.stroke()
    # blush
    for side in (-1, 1):
        cr.save()
        cr.translate(side * 0.22, -0.42)
        cr.scale(0.07, 0.035)
        g = cairo.RadialGradient(0, 0, 0, 0, 0, 1)
        g.add_color_stop_rgba(0, 1.0, 0.35, 0.40, 0.45)
        g.add_color_stop_rgba(1, 1.0, 0.35, 0.40, 0)
        cr.set_source(g)
        cr.arc(0, 0, 1, 0, 2 * math.pi)
        cr.fill()
        cr.restore()
    # mouth
    my = -0.395
    m = max(0.0, min(1.0, mouth))
    if mood == "worried" and m < 0.15:
        cr.new_path()
        cr.move_to(-0.05, my + 0.015)
        cr.curve_to(-0.02, my - 0.012, 0.02, my - 0.012, 0.05, my + 0.015)
        cr.set_line_width(0.02)
        cr.set_source_rgba(0.25, 0.06, 0.05, 1)
        cr.stroke()
    else:
        w = 0.075 + 0.02 * m
        oh = 0.012 + 0.075 * m + (0.03 if mood == "wow" else 0)
        cr.new_path()
        cr.move_to(-w, my - 0.006)
        cr.curve_to(-w * 0.5, my + oh * 0.2 - 0.004, w * 0.5, my + oh * 0.2 - 0.004, w, my - 0.006)
        cr.curve_to(w * 0.75, my + oh * 1.25 + 0.02, -w * 0.75, my + oh * 1.25 + 0.02, -w, my - 0.006)
        cr.close_path()
        cr.set_source_rgb(0.30, 0.04, 0.06)
        cr.fill_preserve()
        cr.save()
        cr.clip()
        cr.arc(0, my + oh * 1.2 + 0.03, w * 0.6, 0, 2 * math.pi)
        cr.set_source_rgb(0.95, 0.42, 0.45)
        cr.fill()
        cr.rectangle(-w, my - 0.02, 2 * w, 0.018 + 0.006 * m)
        cr.set_source_rgba(1, 1, 1, 0.92 if m > 0.25 else 0)
        cr.fill()
        cr.restore()
    arm(-1, pose.get("arm_l", "rest"))
    arm(1, pose.get("arm_r", "rest"))
    cr.restore()


def serum_drop(cr, kind, x, y, r, stretch=1.0, alpha=1.0):
    """A falling glossy serum drop (tip up), centre of its round part at (x, y)."""
    p = PAL[kind]
    cr.save()
    cr.translate(x, y)
    cr.scale(r, r * stretch)
    cr.new_path()
    cr.move_to(0, -2.3)
    cr.curve_to(0.25, -1.6, 1.0, -0.8, 1.0, 0)
    cr.arc(0, 0, 1.0, 0, math.pi)
    cr.curve_to(-1.0, -0.8, -0.25, -1.6, 0, -2.3)
    cr.close_path()
    path = cr.copy_path()
    g = cairo.RadialGradient(-0.3, -0.4, 0.1, 0, 0, 1.4)
    g.add_color_stop_rgba(0, *mix(p["light"], (1, 1, 1), 0.5), 0.85 * alpha)
    g.add_color_stop_rgba(0.5, *p["base"], 0.55 * alpha)
    g.add_color_stop_rgba(1, *p["dark"], 0.85 * alpha)
    cr.set_source(g)
    cr.fill()
    cr.append_path(path)
    cr.set_line_width(0.06)
    cr.set_source_rgba(1, 1, 1, 0.5 * alpha)
    cr.stroke()
    cr.save()
    cr.translate(-0.38, -0.35)
    cr.rotate(-0.5)
    cr.scale(0.18, 0.38)
    cr.arc(0, 0, 1, 0, 2 * math.pi)
    cr.set_source_rgba(1, 1, 1, 0.85 * alpha)
    cr.fill()
    cr.restore()
    g = cairo.RadialGradient(0.2, 0.55, 0, 0.2, 0.55, 0.5)
    g.add_color_stop_rgba(0, 1, 1, 0.9, 0.7 * alpha)
    g.add_color_stop_rgba(1, 1, 1, 0.9, 0)
    cr.set_source(g)
    cr.arc(0.2, 0.55, 0.5, 0, 2 * math.pi)
    cr.fill()
    cr.restore()
