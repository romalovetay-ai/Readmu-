"""Photoreal-style texture maps for the skin block, modelled on the reference look:
hundreds of thin wavy lamellae in magenta / pink / cream, dense dark cell dots with rings, wispy fibres,
a dry cracked pigmented surface.  Writes into biorev/cache/tex/ (same names as tex.py).

    python3 tex2.py [cut] [top]
"""
import os, sys, json, time
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "cache", "tex")
os.makedirs(OUT, exist_ok=True)
BW, BD = 3.0, 2.4
TW, TH = 4200, 3360
PX = TW / BW


def fbm(rng, w, h, cell, octaves=4, pers=0.5):
    out = np.zeros((h, w), np.float32)
    amp, tot = 1.0, 0.0
    for _ in range(octaves):
        nx, ny = max(2, int(w / cell) + 2), max(2, int(h / cell) + 2)
        g = rng.standard_normal((ny, nx)).astype(np.float32)
        out += cv2.resize(g, (w, h), interpolation=cv2.INTER_CUBIC) * amp
        tot += amp
        amp *= pers
        cell /= 2
    return out / tot


def fbm1(rng, n, cell, octaves=4):
    return fbm(rng, n, 2, cell, octaves)[0]


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def lin(c):
    return np.power(np.array(c, np.float32), 2.2)


def mixc(a, b, t):
    return a + (b - a) * t


def ramp(x, stops):
    """Piecewise-linear colour ramp; x array in [0,1], stops [(pos, (r,g,b)), ...] in sRGB."""
    pos = np.array([p for p, _ in stops], np.float32)
    cols = np.array([lin(c) for _, c in stops], np.float32)
    x = np.clip(x, 0, 1)
    out = np.empty(x.shape + (3,), np.float32)
    for ch in range(3):
        out[..., ch] = np.interp(x, pos, cols[:, ch])
    return out


def dots_layer(rng, w, h, density_map, n, rmin, rmax, ring_frac=0.0):
    """Dark cell dots (nuclei / melanin), optionally with a ring (cell outline)."""
    dot = np.zeros((h, w), np.float32)
    ring = np.zeros((h, w), np.float32)
    halo = np.zeros((h, w), np.float32)
    xs = rng.uniform(0, w, n * 3)
    ys = rng.uniform(0, h, n * 3)
    keep = rng.uniform(0, 1, n * 3) < density_map[ys.astype(int).clip(0, h - 1), xs.astype(int).clip(0, w - 1)]
    xs, ys = xs[keep][:n], ys[keep][:n]
    for x, y in zip(xs, ys):
        r = rng.uniform(rmin, rmax)
        cv2.circle(dot, (int(x * 4), int(y * 4)), int(r * 4), float(rng.uniform(0.6, 1.0)), -1, cv2.LINE_AA, shift=2)
        if rng.random() < ring_frac:
            R = r * rng.uniform(2.6, 3.6)
            cv2.circle(ring, (int(x * 4), int(y * 4)), int(R * 4), 1.0, 2, cv2.LINE_AA, shift=2)
            cv2.circle(halo, (int(x * 4), int(y * 4)), int(R * 4), 1.0, -1, cv2.LINE_AA, shift=2)
    return cv2.GaussianBlur(dot, (0, 0), 0.6), cv2.GaussianBlur(ring, (0, 0), 0.8), cv2.GaussianBlur(halo, (0, 0), 2)


def fibres(rng, w, h, n, mask, conf_grad, length=(60, 260), width=1, wander=0.25):
    """Thin wispy fibres, mostly running along the lamellae."""
    out = np.zeros((h, w), np.float32)
    for _ in range(n):
        x, y = rng.uniform(0, w), rng.uniform(0, h)
        if mask[int(y), int(x)] < 0.5:
            continue
        gx, gy = conf_grad
        a = np.arctan2(-gx[int(y), int(x)], gy[int(y), int(x)] + 1e-6) + rng.normal(0, wander)
        ln = rng.uniform(*length)
        pts = []
        for k in range(24):
            pts.append((x, y))
            a += rng.normal(0, 0.06)
            x += np.cos(a) * ln / 24
            y += np.sin(a) * ln / 24
            if not (0 <= x < w and 0 <= y < h):
                break
        if len(pts) > 2:
            cv2.polylines(out, [np.int32(np.array(pts) * 4)], False, float(rng.uniform(0.4, 1.0)), width, cv2.LINE_AA,
                          shift=2)
    return cv2.GaussianBlur(out, (0, 0), 0.5)


def cut_face(state):
    g = float(state)
    rng = np.random.default_rng(31)
    W, Hh = TW, TH
    x = np.arange(W, dtype=np.float32) / PX
    yy, xx = np.mgrid[0:Hh, 0:W].astype(np.float32)
    d = yy / PX
    n_low = fbm(rng, W, Hh, 700, 4)
    n_mid = fbm(rng, W, Hh, 160, 4)
    n_fine = fbm(rng, W, Hh, 18, 3)
    # big waves of the dermo-epidermal junction, conformal coordinate that every lamella follows
    wave = (0.11 * np.sin(2 * np.pi * x / 0.95 + 0.8) + 0.045 * np.sin(2 * np.pi * x / 0.37 + 2.1)
            + 0.03 * fbm1(rng, W, 700))
    amp_d = 1.0 - 0.45 * smooth(0.3, 1.9, d)
    conf = d - wave[None] * amp_d + 0.012 * n_mid + 0.03 * n_low
    gy, gx = np.gradient(conf)
    # layer depths along conf
    SC, EPI, PAP, HYP = 0.06, 0.32 + (0.0 if g else -0.03), 0.72, 1.85
    hyp_line = HYP + 0.08 * np.sin(2 * np.pi * x / 1.3)[None] + 0.04 * fbm1(rng, W, 500)[None]
    m_sc = conf < SC
    m_epi = (conf >= SC) & (conf < EPI)
    m_der = (conf >= EPI) & (d < hyp_line)
    m_hyp = d >= hyp_line
    # lamellae: thin lines whose spacing breathes, merging and splitting
    sp = 0.0095
    ph = conf / sp + 0.55 * fbm(rng, W, Hh, 900, 3) + 0.25 * np.sin(conf / 0.03)
    fr = ph - np.floor(ph)
    line = np.exp(-((fr - 0.5) / 0.07) ** 2)                 # bright thin line in each lamella
    terrace = fr                                              # stacked-sheet relief
    line_vis = smooth(-0.4, 0.3, fbm(rng, W, Hh, 120, 3))     # lines fade in and out
    # base colour by depth band, with noise to break uniformity
    band = conf / 2.2 + 0.10 * np.sin(conf / 0.05 + 2 * n_low) + 0.05 * np.sin(conf / 0.017 + n_mid) + 0.03 * n_low
    hydr = g
    der = ramp(band,
               [(0.00, (0.88, 0.52, 0.45)), (0.12, (0.82, 0.30, 0.50)), (0.22, (0.55, 0.17, 0.42)),
                (0.34, (0.88, 0.38, 0.58)), (0.46, (0.95, 0.60, 0.58)), (0.58, (0.74, 0.25, 0.48)),
                (0.72, (0.92, 0.50, 0.52)), (0.86, (0.60, 0.20, 0.42)), (1.00, (0.85, 0.45, 0.45))])
    if not hydr:
        lum = der.mean(-1, keepdims=True)
        der = mixc(der, lum * np.array([1.05, 0.95, 0.9], np.float32), 0.18) * 0.93
    cream = lin((0.97, 0.86, 0.76))
    lam_col = mixc(der, cream, (line * line_vis * (0.75 if hydr else 0.55))[..., None])
    # epidermis: peach-brown, heavily speckled, flaky lamellae on top
    epi = ramp(np.clip((conf - SC) / (EPI - SC), 0, 1) + 0.08 * n_mid,
               [(0.0, (0.82, 0.58, 0.44)), (0.45, (0.70, 0.44, 0.34)), (0.85, (0.52, 0.28, 0.26)), (1.0, (0.62, 0.30, 0.38))])
    sc = ramp(np.clip(conf / SC, 0, 1) + 0.1 * n_mid, [(0, (0.90, 0.74, 0.60)), (1, (0.82, 0.60, 0.46))])
    alb = np.where(m_der[..., None], lam_col, 0)
    alb = np.where(m_epi[..., None], mixc(epi, cream, (line * 0.35)[..., None]), alb)
    alb = np.where(m_sc[..., None], mixc(sc, cream, (line * 0.6)[..., None]), alb)
    # pigment: brown blotches in the lower epidermis (stronger before)
    pig = smooth(0.0, 0.5, fbm(rng, W, Hh, 380, 3) + 0.15) * smooth(SC, EPI, conf) * m_epi * (1.0 if not g else 0.3)
    alb = mixc(alb, lin((0.30, 0.15, 0.09))[None, None], (pig * 0.75)[..., None])
    # cells: dark dots with rings, denser in the epidermis
    dens = (m_epi * 1.0 + m_der * (0.75 - 0.5 * smooth(0.4, 1.6, conf)) * smooth(-0.5, 0.4, n_low) + m_sc * 0.2).astype(np.float32)
    dot, ring, halo = dots_layer(rng, W, Hh, dens * dens, 11000, 2.0, 4.2, ring_frac=0.22)
    alb = mixc(alb, mixc(alb, cream, 0.35), (halo * 0.35 * m_der)[..., None])
    alb = mixc(alb, lin((0.35, 0.16, 0.24))[None, None], (ring * 0.6)[..., None])
    dark = lin((0.08, 0.04, 0.04)) if not g else lin((0.20, 0.08, 0.10))
    alb = mixc(alb, dark[None, None], (dot * (0.95 if not g else 0.7))[..., None])
    # wispy fibres along the lamellae, and a few crossing ones
    fib = fibres(rng, W, Hh, 5200 if g else 2600, (m_der | m_epi).astype(np.float32), (gx, gy))
    fib2 = fibres(rng, W, Hh, 160, m_der.astype(np.float32), (gx, gy), (80, 260), 1, wander=0.8)
    alb = mixc(alb, cream[None, None], (np.clip(fib + fib2 * 0.8, 0, 1) * 0.7)[..., None])
    # blood vessels and nerves: thin branching threads in the lower dermis
    ves = np.zeros((Hh, W), np.float32)
    vcol = np.zeros((Hh, W, 3), np.float32)

    def branch(x0, y0, a, ln, w, col, depth):
        pts = [(x0, y0)]
        for k in range(int(ln / 8)):
            a += rng.normal(0, 0.05) - 0.02 * a
            x0 += np.cos(a) * 8
            y0 += np.sin(a) * 8
            pts.append((x0, y0))
            if depth > 0 and rng.random() < 0.012:
                branch(x0, y0, a + rng.choice([-1, 1]) * rng.uniform(0.4, 0.9), ln * 0.5, max(2, w - 2), col, depth - 1)
        m = np.zeros((Hh, W), np.float32)
        cv2.polylines(m, [np.int32(np.array(pts) * 4)], False, 1.0, w, cv2.LINE_AA, shift=2)
        np.copyto(vcol, lin(col)[None, None] * np.ones_like(vcol), where=(m[..., None] > ves[..., None]) & (m[..., None] > 0.3))
        np.maximum(ves, m, out=ves)
    for _ in range(4):
        branch(rng.uniform(-100, W * 0.6), rng.uniform(1.45, 1.75) * PX, rng.uniform(-0.15, 0.1), rng.uniform(1500, 2600),
               7, (0.55, 0.04, 0.06), 1)
    for _ in range(2):
        branch(rng.uniform(-100, W * 0.5), rng.uniform(1.55, 1.8) * PX, rng.uniform(-0.12, 0.1), rng.uniform(1500, 2400),
               7, (0.16, 0.18, 0.50), 1)
    for _ in range(2):
        branch(rng.uniform(0, W * 0.5), rng.uniform(1.3, 1.6) * PX, rng.uniform(-0.1, 0.1), rng.uniform(1200, 2000),
               4, (0.92, 0.78, 0.45), 0)
    ves = cv2.GaussianBlur(ves, (0, 0), 1.0) * m_der
    alb = mixc(alb, vcol, ves[..., None] * 0.95)
    # hypodermis: fat cells, honey yellow with pink septa
    from scipy.spatial import cKDTree
    pts = np.stack([rng.uniform(0, W, 9000), rng.uniform(1.6 * PX, Hh, 9000)], 1)
    q = np.stack([xx[m_hyp], yy[m_hyp]], 1)
    dd, _ = cKDTree(pts).query(q, k=2, workers=-1)
    e = np.zeros((Hh, W), np.float32)
    c0 = np.zeros((Hh, W), np.float32)
    e[m_hyp] = (dd[:, 1] - dd[:, 0]) * 0.5
    c0[m_hyp] = dd[:, 0]
    septa = np.exp(-(e / 3.0) ** 2)
    fat = mixc(lin((1.0, 0.84, 0.42)), lin((0.90, 0.60, 0.22)), np.clip(c0 / 30, 0, 1)[..., None])
    fat = mixc(fat, lin((0.84, 0.46, 0.44)), septa[..., None] * 0.8)
    alb = np.where(m_hyp[..., None], fat, alb)
    alb = np.clip(alb * (0.92 + 0.12 * n_low[..., None]) * (0.96 + 0.06 * n_fine[..., None]), 0, 1)
    # height: stacked sheets + lines + cells + vessels + fat domes
    hgt = (terrace * 0.9 + line * 0.6) * (m_der | m_epi) * (1.0 if g else 0.75)
    hgt += m_sc * (terrace * 1.2 + 0.8 * smooth(0.2, 0.7, n_fine))
    hgt += 0.6 * np.sin(conf / 0.06) * (m_der | m_epi)              # broad folds
    hgt += ring * 0.8 + halo * 0.4 - dot * 0.6 + fib * 0.5 + ves * 1.6
    hgt += m_hyp * ((1 - np.clip(c0 / 30, 0, 1) ** 2) * 2.4 - septa * 0.8)
    hgt += 0.3 * n_fine
    hgt = cv2.GaussianBlur(hgt.astype(np.float32), (0, 0), 0.7)
    rough = np.where(m_hyp, 0.25, np.where(m_sc, 0.7, 0.42 if g else 0.55)).astype(np.float32)
    rough = rough - 0.15 * line * m_der
    meta = dict(epi=EPI, hyp=HYP)
    return alb, hgt, rough, meta


def top_surface(state):
    """Dry, cracked, pigmented skin seen from above (bad) or smooth, dewy skin (good)."""
    sys.path.insert(0, os.path.join(HERE, "..", "src"))
    import skin as sk
    g = float(state)
    rng = np.random.default_rng(41)
    S = sk.S
    b = sk.Base(102)
    h, f1, pore = sk.relief(b, furrow=1.7 if not g else 0.7, fine=1.8 if not g else 0.7, plump=0.5 if not g else 1.6,
                            pore_r=1.15, pore_p=0.95)
    yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
    n_low = fbm(rng, S, S, 600, 4)
    n_mid = fbm(rng, S, S, 120, 4)
    from scipy.spatial import cKDTree
    wx, wy = fbm(rng, S, S, 300, 3) * 30, fbm(rng, S, S, 300, 3) * 30
    pts = rng.uniform(0, S, (2200, 2))
    dd, idx = cKDTree(pts).query(np.stack([(xx + wx).ravel(), (yy + wy).ravel()], 1), k=2, workers=-1)
    e = ((dd[:, 1] - dd[:, 0]) * 0.5).reshape(S, S).astype(np.float32)
    dry = smooth(-0.15, 0.35, fbm(rng, S, S, 500, 3)) * (1.0 if not g else 0.0)
    crack = np.exp(-(e / 1.8) ** 2) * dry
    lift = np.clip(np.exp(-(e / 9.0) ** 2) - np.exp(-(e / 2.5) ** 2), 0, 1) * dry
    if g:
        base = ramp(0.5 + 0.25 * n_low + 0.1 * n_mid, [(0, (0.80, 0.56, 0.46)), (0.5, (0.87, 0.64, 0.54)), (1, (0.92, 0.71, 0.61))])
    else:
        base = ramp(0.5 + 0.25 * n_low + 0.1 * n_mid, [(0, (0.68, 0.47, 0.36)), (0.5, (0.77, 0.55, 0.43)), (1, (0.84, 0.64, 0.50))])
    pig = smooth(0.1, 0.6, fbm(rng, S, S, 420, 4) + 0.05) * (1.0 if not g else 0.15)
    alb = mixc(base, lin((0.33, 0.17, 0.10))[None, None], (pig * 0.75)[..., None])
    alb = alb * (1 - 0.25 * f1[..., None])
    alb = mixc(alb, lin((0.18, 0.09, 0.06))[None, None], (pore * (0.75 if not g else 0.35))[..., None])
    dens = np.clip(0.15 + pig * 1.0, 0, 1)
    dot, _, _ = dots_layer(rng, S, S, dens, 5000 if not g else 900, 1.6, 3.6, 0.0)
    alb = mixc(alb, lin((0.12, 0.06, 0.05))[None, None], (dot * 0.85)[..., None])
    cream = lin((0.96, 0.88, 0.78))
    alb = mixc(alb, cream[None, None], (lift * 0.6 + dry * 0.12)[..., None])
    alb = mixc(alb, lin((0.30, 0.17, 0.12))[None, None], (crack * 0.7)[..., None])
    alb = np.clip(alb, 0, 1)
    hgt = h * 0.25 + lift * 2.0 + dry * 1.0 - crack * 2.0 - dot * 0.5
    rough = np.where(dry > 0.3, 0.8, 0.55 if not g else 0.3).astype(np.float32) - 0.15 * lift
    return alb, hgt.astype(np.float32), rough


def save(name, alb, hgt, rough):
    cv2.imwrite(os.path.join(OUT, name + "_alb.png"),
                (np.power(np.clip(alb, 0, 1), 1 / 2.2)[..., ::-1] * 255).astype(np.uint8))
    hn = (hgt - hgt.min()) / (hgt.max() - hgt.min() + 1e-6)
    cv2.imwrite(os.path.join(OUT, name + "_h.png"), (hn * 65535).astype(np.uint16))
    cv2.imwrite(os.path.join(OUT, name + "_r.png"), (np.clip(rough, 0, 1) * 255).astype(np.uint8))


if __name__ == "__main__":
    which = sys.argv[1:] or ["cut", "top"]
    for st, nm in ((0, "bad"), (1, "good")):
        t = time.time()
        if "cut" in which:
            a, h, r, m = cut_face(st)
            save("cut_" + nm, a, h, r)
            del a, h, r
        if "top" in which:
            a, h, r = top_surface(st)
            save("top_" + nm, a, h, r)
        print(nm, "%.0fs" % (time.time() - t), flush=True)
