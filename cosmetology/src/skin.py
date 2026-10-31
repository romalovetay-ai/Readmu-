"""Procedural macro skin: micro-relief, pores, subsurface scattering, and a 'problem' and 'healed' state per reel.

skin_pair(kind) -> (bad_rgb, good_rgb, meta) as float32 sRGB arrays of shape (S, S, 3) in 0..1, cached as .npy.
"""
import os, json
import numpy as np
import cv2
from scipy.spatial import cKDTree

S = 3072
ROOT = os.path.dirname(os.path.abspath(__file__))
CACHE = os.path.join(ROOT, "cache")
os.makedirs(CACHE, exist_ok=True)


def fbm(rng, size, base, octaves=5, pers=0.5):
    out = np.zeros((size, size), np.float32)
    amp, tot = 1.0, 0.0
    cell = base
    for _ in range(octaves):
        n = max(2, int(size / cell) + 2)
        g = rng.standard_normal((n, n)).astype(np.float32)
        out += cv2.resize(g, (size, size), interpolation=cv2.INTER_CUBIC) * amp
        tot += amp
        amp *= pers
        cell /= 2
    return out / tot


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def voronoi(rng, size, spacing, warp, warp_scale):
    n = int((size / spacing) ** 2 * 1.15)
    pts = rng.uniform(-spacing, size + spacing, (n, 2))
    tree = cKDTree(pts)
    yy, xx = np.mgrid[0:size, 0:size].astype(np.float32)
    wx = fbm(rng, size, warp_scale, 3) * warp
    wy = fbm(rng, size, warp_scale, 3) * warp
    q = np.stack([(xx + wx).ravel(), (yy + wy).ravel()], 1)
    d, idx = tree.query(q, k=3, workers=-1)
    d = d.astype(np.float32).reshape(size, size, 3)
    idx = idx[:, 0].reshape(size, size)
    edge = (d[..., 1] - d[..., 0]) * 0.5        # distance to nearest cell border
    vert = d[..., 2] - d[..., 0]                # small where three cells meet
    return edge, vert, idx


def srgb_to_lin(c):
    return np.power(np.clip(c, 0, 1), 2.2)


def lin_to_srgb(c):
    return np.power(np.clip(c, 0, 1), 1 / 2.2)


def blob_mask(rng, size, cx, cy, r, rough=0.35):
    yy, xx = np.ogrid[0:size, 0:size]
    d = np.sqrt((xx - cx) ** 2 + (yy - cy) ** 2) / r
    return d


class Base:
    """Shared skin geometry for one reel: both states derive from the same relief so the morph is seamless."""

    def __init__(self, seed):
        rng = np.random.default_rng(seed)
        self.rng = rng
        yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
        wx = fbm(rng, S, 700, 3) * 60
        wy = fbm(rng, S, 700, 3) * 60
        X, Y = xx + wx, yy + wy
        # skin micro-relief: families of crossing furrows that form the rhomboid pattern of real skin
        self.furrow = np.zeros((S, S), np.float32)
        self.fine_furrow = np.zeros((S, S), np.float32)
        base_a = rng.uniform(0, np.pi)
        for k, (da, sp, w, strength, target) in enumerate([
                (0.0, 150, 4.2, 1.0, "furrow"), (1.05, 180, 4.6, 0.9, "furrow"), (2.2, 210, 4.0, 0.75, "furrow"),
                (0.5, 52, 1.8, 0.6, "fine_furrow"), (1.7, 46, 1.6, 0.55, "fine_furrow"), (2.7, 60, 1.7, 0.5, "fine_furrow")]):
            a = base_a + da + rng.uniform(-0.15, 0.15)
            u = X * np.cos(a) + Y * np.sin(a)
            jit = fbm(rng, S, sp * 4, 3) * sp * 0.35
            q = (u + jit) / sp
            d = np.abs(q - np.round(q)) * sp
            line = np.exp(-(d / w) ** 2)
            presence = smooth(-0.35, 0.25, fbm(rng, S, sp * 3.5, 3))
            line *= presence * strength
            setattr(self, target, np.maximum(getattr(self, target), line))
        # pores, loosely placed with a minimum spacing
        self.pores = []
        tries = 0
        while len(self.pores) < 700 and tries < 20000:
            tries += 1
            x, y = rng.uniform(0, S, 2)
            if self.pores:
                p = np.array(self.pores)[:, :2]
                if ((p[:, 0] - x) ** 2 + (p[:, 1] - y) ** 2).min() < 85 ** 2:
                    continue
            self.pores.append((float(x), float(y), float(rng.uniform(0.7, 1.3)), float(rng.random())))
        self.low = fbm(rng, S, 900, 4)
        self.mid = fbm(rng, S, 160, 4)
        self.peel = fbm(rng, S, 22, 2)
        self.fine = fbm(rng, S, 7, 2)
        self.tone = fbm(rng, S, 500, 5)
        self.mottle = fbm(rng, S, 90, 4)
        self.red = fbm(rng, S, 420, 4)
        self.gl = fbm(rng, S, 300, 4)
        self.cap = np.zeros((S, S), np.float32)
        for _ in range(9):   # faint capillaries under the surface
            x, y = rng.uniform(0, S, 2); a = rng.uniform(0, np.pi * 2)
            pts = []
            for i in range(40):
                a += rng.normal(0, 0.18); x += np.cos(a) * 18; y += np.sin(a) * 18
                pts.append((x, y))
            cv2.polylines(self.cap, [np.int32(np.array(pts) * 4)], False, 1.0, 10, cv2.LINE_AA, shift=2)
        self.cap = cv2.GaussianBlur(self.cap, (0, 0), 5)
        self.hairs = []
        for _ in range(9):
            x, y = rng.uniform(0, S, 2)
            a = rng.uniform(0, np.pi * 2)
            self.hairs.append((x, y, a, rng.uniform(220, 420), rng.uniform(-0.6, 0.6)))

    def pore_map(self, scale=1.0, frac=1.0, depth_var=True):
        m = np.zeros((S, S), np.float32)
        for x, y, s, r in self.pores:
            if r > frac:
                continue
            rad = 7.0 * s * scale
            cv2.circle(m, (int(x * 4), int(y * 4)), int(rad * 4), 1.0, -1, cv2.LINE_AA, shift=2)
        return cv2.GaussianBlur(m, (0, 0), max(2.2, 2.6 * scale))


def relief(b, furrow=1.0, fine=1.0, pore_r=1.0, pore_p=0.75, pore_depth=1.0, plump=1.0):
    f1 = b.furrow
    f2 = b.fine_furrow
    pore = b.pore_map(pore_r, pore_p)
    plate = cv2.GaussianBlur(f1, (0, 0), 18)
    h = (-5.0 * furrow * f1 - 1.8 * furrow * f2 - 3.5 * plump * plate * 0
         - 4.5 * pore_depth * pore + 0.9 * fine * b.fine + 0.9 * b.peel + 2.0 * b.mid + 6 * b.low)
    h = h + plump * 2.5 * (1 - cv2.GaussianBlur(f1, (0, 0), 10))
    return h.astype(np.float32), np.clip(f1 + 0.5 * f2, 0, 1), pore


def shade(h, albedo, gloss, ao, light=(-0.55, -0.62, 0.56), normal_k=0.42, sheen=0.0, wet=None):
    gy, gx = np.gradient(h)
    nx, ny, nz = -gx * normal_k, -gy * normal_k, np.ones_like(h)
    inv = 1 / np.sqrt(nx * nx + ny * ny + nz * nz)
    nx, ny, nz = nx * inv, ny * inv, nz * inv
    L = np.array(light, np.float32); L /= np.linalg.norm(L)
    ndl = nx * L[0] + ny * L[1] + nz * L[2]
    wrap = np.clip((ndl + 0.35) / 1.35, 0, 1)
    Hv = L + np.array([0, 0, 1], np.float32); Hv /= np.linalg.norm(Hv)
    ndh = np.clip(nx * Hv[0] + ny * Hv[1] + nz * Hv[2], 0, 1)
    # subsurface: red light travels further under the surface than blue
    lr = cv2.GaussianBlur(wrap, (0, 0), 14)
    lg = cv2.GaussianBlur(wrap, (0, 0), 6)
    lb = cv2.GaussianBlur(wrap, (0, 0), 3)
    light_rgb = np.stack([0.3 * wrap + 0.7 * lr, 0.5 * wrap + 0.5 * lg, 0.65 * wrap + 0.35 * lb], -1)
    key = np.array([1.08, 1.0, 0.92], np.float32)
    amb = np.array([0.30, 0.27, 0.27], np.float32)
    col = albedo * (amb * ao[..., None] + 1.05 * key * light_rgb * ao[..., None])
    spec = (ndh ** 90) * 1.4 + (ndh ** 14) * 0.18 + sheen * (ndh ** 5) * 0.2
    spec = spec * gloss
    col = col + spec[..., None] * np.array([1.0, 0.97, 0.93], np.float32)
    if wet is not None:
        col = col + wet
    return col


def tonemap(c):
    c = c * 1.05
    a, b2, cc, d, e = 2.51, 0.03, 2.43, 0.59, 0.14   # ACES-ish filmic curve
    c = np.clip((c * (a * c + b2)) / (c * (cc * c + d) + e), 0, 1)
    return lin_to_srgb(c).astype(np.float32)


def base_albedo(b, sat=1.0, bright=1.0, redness=0.0):
    base = srgb_to_lin(np.array([0.90, 0.69, 0.58], np.float32))
    alb = np.empty((S, S, 3), np.float32)
    t = b.tone * 0.05
    alb[..., 0] = base[0] * (1 + t)
    alb[..., 1] = base[1] * (1 + t * 1.3)
    alb[..., 2] = base[2] * (1 + t * 1.5)
    m = b.mottle * 0.06
    alb[..., 0] *= 1 + m * 0.6
    alb[..., 1] *= 1 + m
    alb[..., 2] *= 1 + m * 1.2
    cap = b.cap * (0.18 + redness)
    alb[..., 1] *= 1 - cap * 0.25
    alb[..., 2] *= 1 - cap * 0.15
    r = np.clip(b.red * 0.6 + 0.2, 0, 1) * (0.10 + redness)
    alb[..., 0] *= 1 + r * 0.25
    alb[..., 1] *= 1 - r * 0.35
    alb[..., 2] *= 1 - r * 0.25
    lum = alb.mean(-1, keepdims=True)
    alb = lum + (alb - lum) * sat
    return np.clip(alb * bright, 0, 1)


def mul_color(alb, m, col):
    c = srgb_to_lin(np.array(col, np.float32))
    return alb * (1 - m[..., None]) + alb * c * m[..., None] / srgb_to_lin(np.array([0.9, 0.69, 0.58], np.float32)) * 0.9


def draw_hairs(b, img, alpha):
    over = np.zeros((S, S), np.float32)
    for (x, y, a, ln, bend) in b.hairs:
        pts = []
        for k in range(24):
            t = k / 23
            aa = a + bend * t
            pts.append((x + np.cos(aa) * ln * t, y + np.sin(aa) * ln * t))
        p = np.array(pts)
        for k in range(len(p) - 1):
            w = 1 + int(2 * (1 - k / len(p)))
            cv2.line(over, tuple(np.int32(p[k] * 4)), tuple(np.int32(p[k + 1] * 4)), 1.0, w, cv2.LINE_AA, shift=2)
    over = cv2.GaussianBlur(over, (0, 0), 0.7)
    sh = np.roll(cv2.GaussianBlur(over, (0, 0), 4), (10, 8), (0, 1)) * 0.25
    img = img * (1 - sh[..., None] * alpha)
    hair = np.array([0.55, 0.42, 0.33], np.float32)
    o = over[..., None] * alpha * 0.8
    return img * (1 - o) + hair * o


# ------------------------------------------------------------------ problems
def features(rng, n, lo, hi, margin=500):
    out = []
    tries = 0
    while len(out) < n and tries < 5000:
        tries += 1
        x, y = rng.uniform(margin, S - margin, 2)
        r = rng.uniform(lo, hi)
        if all((x - a) ** 2 + (y - c) ** 2 > (r + rr + 120) ** 2 for a, c, rr in out):
            out.append((float(x), float(y), float(r)))
    return out


def irregular(b, rng, x, y, r, rough=0.22):
    d = blob_mask(rng, S, x, y, r)
    n = fbm(rng, S, r * 1.6, 3)
    return smooth(1.05, 0.55, d + n * rough)


def make_vitc(b):
    rng = np.random.default_rng(11)
    spots = [(1300, 1750, 230), (1950, 1350, 160), (900, 2350, 130), (2050, 2250, 190), (1500, 1100, 95),
             (2400, 1800, 85)]
    pig = np.zeros((S, S), np.float32)
    for x, y, r in spots:
        pig = np.maximum(pig, irregular(b, rng, x, y, r) * rng.uniform(0.75, 1.0))
    # freckle dust
    for _ in range(140):
        x, y = rng.uniform(600, 2500, 2)
        r = rng.uniform(6, 16)
        cv2.circle(pig, (int(x), int(y)), int(r), float(rng.uniform(0.3, 0.6)), -1, cv2.LINE_AA)
    pig = np.maximum(cv2.GaussianBlur(pig, (0, 0), 6), 0)
    h, f1, pore = relief(b)
    ao = 1 - 0.32 * f1 - 0.55 * pore
    out = {}
    for state in ("bad", "good"):
        if state == "bad":
            alb = base_albedo(b, sat=0.72, bright=0.86)
            alb = alb * 0.9 + alb.mean(-1, keepdims=True) * np.array([0.1, 0.1, 0.13])
            alb = mul_color(alb, pig * 0.95, (0.56, 0.36, 0.24))
            gloss = 0.10 + 0.05 * b.gl
            img = shade(h, alb, gloss, ao)
        else:
            alb = base_albedo(b, sat=1.08, bright=1.04, redness=0.02)
            alb = mul_color(alb, pig * 0.10, (0.56, 0.36, 0.24))
            gloss = np.clip(0.55 + 0.25 * b.gl, 0.2, 1)
            img = shade(h, alb, gloss, ao, sheen=1.0)
            img = img * np.array([1.05, 1.0, 0.95], np.float32)
        out[state] = draw_hairs(b, tonemap(img), 0.55)
    meta = {"spots": [[x, y, r] for x, y, r in spots[:4]]}
    return out, meta


def water_drops(img, drops):
    img = img.copy()
    for x, y, r in drops:
        x0, y0, R = int(x - r * 1.6), int(y - r * 1.6), int(r * 3.2)
        patch = img[y0:y0 + R, x0:x0 + R].copy()
        yy, xx = np.mgrid[0:R, 0:R].astype(np.float32)
        dx, dy = xx - r * 1.6, yy - r * 1.6
        d = np.sqrt(dx * dx + dy * dy) / r
        inside = d < 1
        # lens: magnify and flip what is under the drop
        k = np.clip(1 - d * d, 0, 1)
        sx = (r * 1.6 - dx * (0.55 + 0.25 * (1 - k))).astype(np.float32)
        sy = (r * 1.6 - dy * (0.55 + 0.25 * (1 - k))).astype(np.float32)
        lens = cv2.remap(patch, sx, sy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        lens = lens * 1.06
        rim = np.clip((d - 0.72) / 0.28, 0, 1) ** 2 * inside
        lens = lens * (1 - rim[..., None] * 0.45)
        # contact shadow just outside the drop, caustic inside on the far side
        sh = np.exp(-((d - 1.05) / 0.12) ** 2) * (dx * 0.6 + dy * 0.8 > 0) * 0.25
        caus = np.exp(-(((dx - r * 0.35) / (r * 0.35)) ** 2 + ((dy - r * 0.4) / (r * 0.25)) ** 2)) * 0.35
        hl = np.exp(-(((dx + r * 0.38) / (r * 0.16)) ** 2 + ((dy + r * 0.42) / (r * 0.11)) ** 2)) * 1.2
        hl2 = np.exp(-(((dx - r * 0.25) / (r * 0.07)) ** 2 + ((dy - r * 0.55) / (r * 0.05)) ** 2)) * 0.6
        a = np.clip((1 - d) * r / 1.5, 0, 1)[..., None]
        outp = patch * (1 - sh[..., None]) * (1 - a) + lens * a
        outp = outp + ((caus + hl + hl2) * inside)[..., None]
        img[y0:y0 + R, x0:x0 + R] = np.clip(outp, 0, 1)
    return img


def make_ha(b):
    rng = np.random.default_rng(12)
    flake = smooth(0.05, 0.35, fbm(rng, S, 520, 4) + 0.08)
    edge_lift = np.clip(cv2.GaussianBlur(b.furrow, (0, 0), 7) * 2.2 - b.furrow, 0, 1) * flake * smooth(-0.2, 0.2, b.mottle)
    cracks = b.furrow * flake
    fl = np.zeros((S, S), np.float32)
    for _ in range(1400):
        x, y = rng.uniform(0, S, 2)
        if flake[int(y), int(x)] < 0.4:
            continue
        r = rng.uniform(18, 60)
        n = rng.integers(5, 8)
        ang = np.sort(rng.uniform(0, 2 * np.pi, n))
        rad = r * rng.uniform(0.5, 1.0, n)
        pts = np.stack([x + np.cos(ang) * rad * 1.4, y + np.sin(ang) * rad], 1)
        cv2.fillPoly(fl, [np.int32(pts * 4)], float(rng.uniform(0.5, 1.0)), cv2.LINE_AA, shift=2)
    fl = cv2.GaussianBlur(fl, (0, 0), 1.5)
    out = {}
    drops = features(rng, 26, 14, 42, margin=300)
    for state in ("bad", "good"):
        if state == "bad":
            h, f1, pore = relief(b, furrow=1.9, fine=1.8, plump=0.4, pore_r=1.0)
            h = h + 5 * edge_lift - 4 * cracks + 3.5 * fl
            ao = 1 - 0.45 * f1 - 0.5 * pore - 0.35 * np.clip(np.roll(fl, (5, 4), (0, 1)) - fl, 0, 1)
            alb = base_albedo(b, sat=0.70, bright=0.92)
            white = srgb_to_lin(np.array([0.93, 0.88, 0.84], np.float32))
            m = np.clip(edge_lift * 0.6 + flake * 0.15 + fl * 0.75, 0, 1)[..., None]
            alb = alb * (1 - m) + white * m
            img = shade(h, alb, 0.04 + 0.0 * b.gl, ao, normal_k=0.7)
        else:
            h, f1, pore = relief(b, furrow=0.55, fine=0.6, plump=1.8, pore_r=0.9)
            dm = np.zeros((S, S), np.float32)
            for x, y, r in drops:
                yy, xx = np.ogrid[int(y - r):int(y + r), int(x - r):int(x + r)]
                d2 = (xx - x) ** 2 + (yy - y) ** 2
                dome = np.sqrt(np.clip(r * r - d2, 0, None)) * 0.9
                dm[int(y - r):int(y + r), int(x - r):int(x + r)] = np.maximum(
                    dm[int(y - r):int(y + r), int(x - r):int(x + r)], dome)
            ao = 1 - 0.25 * f1 - 0.45 * pore
            alb = base_albedo(b, sat=1.06, bright=1.03, redness=0.03)
            gloss = np.clip(0.8 + 0.3 * b.gl, 0.3, 1.3)
            img = shade(h, alb, gloss, ao, sheen=1.2)
        out[state] = draw_hairs(b, tonemap(img), 0.5)
        if state == "good":
            out[state] = water_drops(out[state], drops)
    ys, xs = np.unravel_index(np.argsort(-cv2.GaussianBlur(flake, (0, 0), 60)[::64, ::64].ravel())[:1], (S // 64, S // 64))
    meta = {"spots": [[1500, 1500, 300], [1100, 2100, 200], [2000, 2000, 220]]}
    return out, meta


def make_retinol(b):
    rng = np.random.default_rng(13)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    wr = np.zeros((S, S), np.float32)
    lines = [(1250, 0.00045, 160, 34, 1.0), (1700, -0.0003, 120, 30, 0.9), (2150, 0.0004, 140, 26, 0.8),
             (2550, -0.0002, 90, 20, 0.6), (900, 0.0002, 80, 16, 0.5)]
    warp = fbm(rng, S, 400, 3) * 40
    for y0, curv, amp, w, dep in lines:
        yc = y0 + curv * (xx - S / 2) ** 2 * 0.6 + amp * np.sin(xx / 700 + y0) + warp
        d = np.abs(yy - yc)
        fade = smooth(0, 500, xx) * smooth(S, S - 500, xx)
        wr = np.maximum(wr, np.exp(-(d / w) ** 2) * dep * fade)
        # fine parallel creases
        wr = np.maximum(wr, np.exp(-((d - w * 2.2) / (w * 0.35)) ** 2) * dep * 0.35 * fade)
    out = {}
    for state in ("bad", "good"):
        k = 1.0 if state == "bad" else 0.15
        h, f1, pore = relief(b, furrow=1.5 if state == "bad" else 0.8, fine=2.6 if state == "bad" else 0.7,
                             plump=0.7 if state == "bad" else 1.5)
        h = h - wr * 26 * k
        ao = 1 - 0.38 * f1 - 0.5 * pore - wr * 0.45 * k
        if state == "bad":
            alb = base_albedo(b, sat=0.82, bright=0.9)
            alb = alb * (1 + b.mid[..., None] * 0.08)
            img = shade(h, alb, 0.12, ao, normal_k=0.6)
        else:
            alb = base_albedo(b, sat=1.04, bright=1.03, redness=0.02)
            img = shade(h, alb, np.clip(0.5 + 0.2 * b.gl, 0.2, 1), ao, sheen=1.2)
        out[state] = draw_hairs(b, tonemap(img), 0.5)
    meta = {"spots": [[1536, 1250 + 0.00045 * 0.6 * 0, 260], [1536, 1700, 240], [1536, 2150, 220]]}
    return out, meta


def make_b3(b):
    rng = np.random.default_rng(14)
    pap = [(1250, 1500, 70), (1950, 1900, 58), (1500, 2350, 50), (2150, 1250, 44), (950, 2000, 40)]
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    bump = np.zeros((S, S), np.float32)
    halo = np.zeros((S, S), np.float32)
    head = np.zeros((S, S), np.float32)
    for i, (x, y, r) in enumerate(pap):
        d = np.sqrt((xx - x) ** 2 + (yy - y) ** 2)
        bump = np.maximum(bump, np.exp(-(d / (r * 0.6)) ** 2))
        halo = np.maximum(halo, np.exp(-(d / (r * 1.7)) ** 2))
        if i in (0, 2):
            head = np.maximum(head, np.exp(-(d / (r * 0.32)) ** 2))
    oil = smooth(-0.1, 0.4, fbm(rng, S, 700, 3) + 0.1)
    out = {}
    for state in ("bad", "good"):
        if state == "bad":
            h, f1, pore = relief(b, pore_r=1.6, pore_p=0.9, pore_depth=2.0, furrow=1.1)
            h = h + bump * 26
            ao = 1 - 0.3 * f1 - 0.5 * pore
            alb = base_albedo(b, sat=1.0, bright=0.95, redness=0.18)
            alb = mul_color(alb, np.clip(halo * 1.25, 0, 1), (0.80, 0.22, 0.24))
            alb = mul_color(alb, pore * 0.8 * (b.mottle > -0.1), (0.35, 0.28, 0.24))
            wh = srgb_to_lin(np.array([0.96, 0.92, 0.78], np.float32))
            alb = alb * (1 - head[..., None] * 0.9) + wh * head[..., None] * 0.9
            gloss = 0.2 + oil * 1.0
            img = shade(h, alb, gloss, ao, sheen=1.4)
        else:
            h, f1, pore = relief(b, pore_r=0.8, pore_p=0.6, pore_depth=0.8, furrow=0.9, plump=1.3)
            h = h + bump * 2
            ao = 1 - 0.28 * f1 - 0.45 * pore
            alb = base_albedo(b, sat=1.03, bright=1.02, redness=0.0)
            alb = mul_color(alb, halo * 0.10, (0.86, 0.45, 0.42))
            img = shade(h, alb, np.clip(0.3 + 0.1 * b.gl, 0.1, 1), ao, sheen=0.6)
        out[state] = draw_hairs(b, tonemap(img), 0.5)
    meta = {"spots": [[x, y, r * 2.2] for x, y, r in pap[:4]]}
    return out, meta


MAKERS = {"vitc": (make_vitc, 101), "ha": (make_ha, 102), "retinol": (make_retinol, 103), "b3": (make_b3, 104)}


def skin_pair(kind):
    pb = os.path.join(CACHE, kind + "_bad.npy")
    pg = os.path.join(CACHE, kind + "_good.npy")
    pm = os.path.join(CACHE, kind + "_meta.json")
    if os.path.exists(pb) and os.path.exists(pg) and os.path.exists(pm):
        return np.load(pb, mmap_mode="r"), np.load(pg, mmap_mode="r"), json.load(open(pm))
    fn, seed = MAKERS[kind]
    b = Base(seed)
    out, meta = fn(b)
    np.save(pb, out["bad"].astype(np.float16))
    np.save(pg, out["good"].astype(np.float16))
    json.dump(meta, open(pm, "w"))
    return skin_pair(kind)


if __name__ == "__main__":
    import sys, time
    from PIL import Image
    for k in sys.argv[1:]:
        t = time.time()
        bad, good, meta = skin_pair(k)
        print(k, time.time() - t)
        for nm, im in (("bad", bad), ("good", good)):
            a = (np.asarray(im, np.float32) * 255).clip(0, 255).astype(np.uint8)
            Image.fromarray(a[1000:2200, 900:2100]).save(f"/tmp/skin_{k}_{nm}_crop.png")
            Image.fromarray(cv2.resize(a, (1024, 1024), interpolation=cv2.INTER_AREA)).save(f"/tmp/skin_{k}_{nm}.png")
