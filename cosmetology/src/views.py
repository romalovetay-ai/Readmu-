"""Camera views onto the skin texture: macro top-down and a low 'standing on the skin' perspective with depth of field."""
import numpy as np
import cv2

W, H = 1080, 1920
S = 3072

_noise = None


def noise_tex():
    global _noise
    if _noise is None:
        rng = np.random.default_rng(5)
        n = np.zeros((384, 384), np.float32)
        for cell, a in ((48, 1.0), (24, 0.5), (12, 0.25)):
            g = rng.standard_normal((384 // cell + 2, 384 // cell + 2)).astype(np.float32)
            n += cv2.resize(g, (384, 384), interpolation=cv2.INTER_CUBIC) * a
        _noise = n / 1.75
    return _noise


def topdown_H(cx, cy, zoom):
    """Screen->texture homography for a straight-down view centred on (cx, cy); zoom 1 = 1.35 tex px per screen px."""
    s = 1.35 / zoom
    return np.array([[s, 0, cx - W / 2 * s], [0, s, cy - H / 2 * s], [0, 0, 1]], np.float64)


def persp_H(cx, cy, near=1000.0, far=3300.0, depth=2700.0, yaw=0.0):
    """Screen->texture homography for a camera low over the skin looking forward (up the texture).

    The bottom edge of the screen sees a strip `near` texture px wide centred on (cx, cy); the top edge sees a
    strip `far` wide `depth` px further away."""
    c, s = np.cos(yaw), np.sin(yaw)

    def rot(dx, dy):
        return [cx + dx * c - dy * s, cy + dx * s + dy * c]
    src = np.float32([[0, 0], [W, 0], [W, H], [0, H]])
    dst = np.float32([rot(-far / 2, -depth), rot(far / 2, -depth), rot(near / 2, 0), rot(-near / 2, 0)])
    return cv2.getPerspectiveTransform(src, dst).astype(np.float64)


def tex_coords(Hm, step=1):
    ys, xs = np.mgrid[0:H:step, 0:W:step].astype(np.float32)
    d = Hm[2, 0] * xs + Hm[2, 1] * ys + Hm[2, 2]
    u = (Hm[0, 0] * xs + Hm[0, 1] * ys + Hm[0, 2]) / d
    v = (Hm[1, 0] * xs + Hm[1, 1] * ys + Hm[1, 2]) / d
    return u, v


def project(Hm, u, v):
    """Texture point -> screen point."""
    inv = np.linalg.inv(Hm)
    p = inv @ np.array([u, v, 1.0])
    return p[0] / p[2], p[1] / p[2]


def heal_mask(Hm, origin, radius, soft=140.0, step=2):
    """0 = problem skin, 1 = healed, as an organic front spreading from `origin` (texture coords)."""
    u, v = tex_coords(Hm, step)
    d = np.sqrt((u - origin[0]) ** 2 + (v - origin[1]) ** 2)
    n = noise_tex()
    nz = cv2.remap(n, (u / 9 % 384).astype(np.float32), (v / 9 % 384).astype(np.float32), cv2.INTER_LINEAR)
    x = (radius - d + nz * 160) / soft
    m = np.clip(x, 0, 1)
    m = m * m * (3 - 2 * m)
    front = np.exp(-((x - 0.15) / 0.35) ** 2) * (radius > 1)
    if step != 1:
        m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR)
        front = cv2.resize(front.astype(np.float32), (W, H), interpolation=cv2.INTER_LINEAR)
    return m.astype(np.float32), front.astype(np.float32)


def warp(tex, Hm):
    return cv2.warpPerspective(tex, Hm, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                               borderMode=cv2.BORDER_REFLECT)


_dof_cache = {}


def dof(img, focus_y, persp=True):
    """Blend sharp and blurred copies by screen row: far (top) gets very soft, as in a macro lens."""
    key = (int(focus_y), persp)
    if key not in _dof_cache:
        y = np.arange(H, dtype=np.float32)
        if persp:
            d = np.where(y < focus_y, (focus_y - y) / 700.0, (y - focus_y) / 900.0)
        else:
            d = np.abs(y - focus_y) / 2200.0
        d = np.clip(d, 0, 1.6)
        w1 = np.clip(d, 0, 1)
        w2 = np.clip(d - 0.6, 0, 1)
        _dof_cache.clear()
        _dof_cache[key] = (w1[:, None, None], w2[:, None, None])
    w1, w2 = _dof_cache[key]
    small = cv2.resize(img, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
    b1 = cv2.resize(cv2.GaussianBlur(small, (0, 0), 2.2), (W, H), interpolation=cv2.INTER_LINEAR)
    sm2 = cv2.resize(img, (W // 4, H // 4), interpolation=cv2.INTER_AREA)
    b2 = cv2.resize(cv2.GaussianBlur(sm2, (0, 0), 3.5), (W, H), interpolation=cv2.INTER_LINEAR)
    out = img * (1 - w1) + b1 * w1
    out = out * (1 - w2) + b2 * w2
    return out


_haze = None


def haze(img, amount=1.0):
    """Warm atmospheric fade and soft bokeh at the top of the perspective view."""
    global _haze
    if _haze is None:
        y = np.arange(H, dtype=np.float32)
        a = np.clip((560 - y) / 560, 0, 1) ** 1.6
        col = np.zeros((H, W, 3), np.float32)
        top = np.array([1.0, 0.93, 0.86], np.float32)
        col[:] = top
        bok = np.zeros((H, W), np.float32)
        rng = np.random.default_rng(3)
        for _ in range(26):
            x, yy = rng.uniform(0, W), rng.uniform(0, 520)
            r = rng.uniform(18, 70)
            cv2.circle(bok, (int(x), int(yy)), int(r), float(rng.uniform(0.15, 0.4)), -1, cv2.LINE_AA)
        bok = cv2.GaussianBlur(bok, (0, 0), 3)
        _haze = (a[:, None, None], col, bok[..., None])
    a, col, bok = _haze
    out = img * (1 - a * 0.85 * amount) + col * a * 0.85 * amount
    return out + bok * np.array([1.0, 0.95, 0.85], np.float32) * a * amount * 0.5


_vig = None


def grade(img, frame, grain=0.018, vignette=0.28):
    global _vig
    if _vig is None:
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        d = np.sqrt(((xx - W / 2) / (W * 0.62)) ** 2 + ((yy - H / 2) / (H * 0.62)) ** 2)
        _vig = (1 - np.clip(d - 0.55, 0, 1) ** 1.6 * 1.0)[..., None].astype(np.float32)
    out = img * (1 - vignette + vignette * _vig)
    # bloom on highlights
    hi = np.clip(out - 0.82, 0, 1)
    small = cv2.resize(hi, (W // 8, H // 8), interpolation=cv2.INTER_AREA)
    bl = cv2.resize(cv2.GaussianBlur(small, (0, 0), 4), (W, H), interpolation=cv2.INTER_LINEAR)
    out = out + bl * 0.9
    rng = np.random.default_rng(frame)
    g = rng.standard_normal((H // 2, W // 2)).astype(np.float32)
    g = cv2.resize(g, (W, H), interpolation=cv2.INTER_LINEAR)
    out = out + g[..., None] * grain
    return np.clip(out, 0, 1)
