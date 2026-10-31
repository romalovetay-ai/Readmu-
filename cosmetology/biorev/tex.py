"""Numpy texture maps for the skin block: cut face (cross-section) and top surface, 'bad' and 'good' states.

Writes PNG albedo (sRGB) and 16-bit height maps into biorev/cache/tex/.
Cut face: x in [-BW/2, BW/2] -> u, depth 0..BD -> v.
"""
import os, sys
import numpy as np
import cv2
from scipy.spatial import cKDTree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, "..", "src"))
import skin as sk

OUT = os.path.join(HERE, "cache", "tex")
os.makedirs(OUT, exist_ok=True)
BW, BD = 3.0, 2.4          # block width and depth shown on the cut face (units)
TW, TH = 3600, 2880        # cut-face texture size
PX = TW / BW               # px per unit


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
    return fbm(rng, n, 1, cell, octaves)[0]


def smooth(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t)


def lin(c):
    return np.power(np.array(c, np.float32), 2.2)


def lerp(a, b, t):
    return a + (b - a) * t


def voronoi_cells(rng, w, h, spacing, sx=1.0, sy=1.0, jitter_warp=0.0):
    n = int(w * h / spacing ** 2 * 1.2)
    pts = np.stack([rng.uniform(0, w * sx, n), rng.uniform(0, h * sy, n)], 1)
    tree = cKDTree(pts)
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    q = np.stack([(xx * sx).ravel(), (yy * sy).ravel()], 1)
    d, idx = tree.query(q, k=2, workers=-1)
    d = d.reshape(h, w, 2).astype(np.float32)
    return (d[..., 1] - d[..., 0]) * 0.5, d[..., 0], idx[:, 0].reshape(h, w)


def cut_face(state):
    """state: 0 = dehydrated/aged, 1 = after biorevitalisation."""
    rng = np.random.default_rng(21)
    g = state
    W, Hh = TW, TH
    u = np.arange(W, dtype=np.float32)
    x = u / PX
    yy, xx = np.mgrid[0:Hh, 0:W].astype(np.float32)
    d = yy / PX                                           # depth in units
    n_low = fbm(rng, W, Hh, 500, 4)
    n_mid = fbm(rng, W, Hh, 90, 4)
    n_fine = fbm(rng, W, Hh, 14, 3)
    n_str = fbm(rng, W, Hh, 260, 3)
    # layer boundaries (units below the surface)
    sc_b = 0.045 + 0.006 * fbm1(rng, W, 300) - 0.012 * (1 - g) * 0
    pap_wave = np.sin(2 * np.pi * x / 0.21 + 1.2 * fbm1(rng, W, 400))
    dej = 0.25 + (0.035 + 0.025 * g) * np.sign(pap_wave) * np.abs(pap_wave) ** 0.7 + 0.015 * fbm1(rng, W, 600)
    epi_thin = 0.0 if g else -0.035                       # dehydrated epidermis is thinner
    dej = dej + epi_thin
    pap = 0.62 + 0.05 * np.sin(2 * np.pi * x / 1.1 + 0.6) + 0.03 * fbm1(rng, W, 500)
    hyp = 1.72 + 0.10 * np.sin(2 * np.pi * x / 1.7 + 2.0) + 0.05 * fbm1(rng, W, 400)
    SC, DEJ, PAP, HYP = sc_b[None], dej[None], pap[None], hyp[None]
    alb = np.zeros((Hh, W, 3), np.float32)
    hgt = np.zeros((Hh, W), np.float32)
    rough = np.full((Hh, W), 0.55, np.float32)
    sss = np.zeros((Hh, W), np.float32)

    # --- conformal coordinate for striations that follow the wavy junction, fading with depth
    below = d - DEJ
    conf = d - (DEJ - 0.25) * np.exp(-np.clip(below, 0, None) / 0.55)
    stripes = 0.5 + 0.5 * np.sin(2 * np.pi * conf / 0.034 + 2.4 * n_str + 0.8 * n_mid + 5 * n_low)
    stripes = 0.5 + (stripes - 0.5) * (0.55 + 0.6 * smooth(-0.4, 0.4, fbm(rng, W, Hh, 180, 3)))
    stripes2 = 0.5 + 0.5 * np.sin(2 * np.pi * conf / 0.011 + 1.5 * n_mid)

    # --- stratum corneum
    m_sc = d < SC
    lam = 0.5 + 0.5 * np.sin(2 * np.pi * d / 0.0075 + 2 * n_mid)
    c_sc = lerp(lin((0.80, 0.66, 0.56)), lin((0.88, 0.74, 0.64)), lam[..., None])
    if not g:
        c_sc = lerp(c_sc, lin((0.86, 0.80, 0.74)), 0.45)
    alb[m_sc] = c_sc[m_sc]
    hgt += m_sc * (0.4 * lam + (0.0 if g else 0.6 * (n_fine > 0.3)))

    # --- epidermis: flattened cells near the top, rounder lower down
    m_epi = (d >= SC) & (d < DEJ)
    edge, dist0, cid = voronoi_cells(rng, W, Hh, 34, 1.0, 1.0)
    f = np.clip((d - SC) / np.maximum(DEJ - SC, 1e-3), 0, 1)
    cell_rand = rng.uniform(0, 1, cid.max() + 1).astype(np.float32)[cid]
    membrane = np.exp(-(edge / 2.0) ** 2) * 0.7
    nucleus = np.exp(-(dist0 / 7.5) ** 2) * (f > 0.15)
    c_epi = lerp(lin((0.86, 0.62, 0.52)), lin((0.80, 0.50, 0.45)), f[..., None])
    c_epi = c_epi * (0.92 + 0.12 * cell_rand[..., None])
    c_epi = lerp(c_epi, lin((0.62, 0.36, 0.36)), membrane[..., None] * 0.55)
    c_epi = lerp(c_epi, lin((0.45, 0.25, 0.38)), nucleus[..., None] * 0.6)
    if not g:
        c_epi = lerp(c_epi, lin((0.74, 0.62, 0.55)), 0.30)
    alb[m_epi] = c_epi[m_epi]
    hgt += m_epi * (0.55 * (1 - membrane) + 0.35 * nucleus)
    sss += m_epi * 0.6
    # melanin in the basal layer and above it
    near_dej = (DEJ - d)
    band = smooth(0.09, 0.0, near_dej) * (near_dej > -0.004)
    mel_amount = 1.0 if not g else 0.35
    dots = np.zeros((Hh, W), np.float32)
    for _ in range(int(2600 * mel_amount)):
        cx = rng.uniform(0, W)
        ix = int(cx)
        cy = (dej[ix] - abs(rng.normal(0, 0.035))) * PX
        r = rng.uniform(1.8, 4.2)
        cv2.circle(dots, (int(cx * 4), int(cy * 4)), int(r * 4), float(rng.uniform(0.5, 1)), -1, cv2.LINE_AA, shift=2)
    blot = smooth(0.15, 0.6, fbm(rng, W, Hh, 300, 3)) * (1.0 if not g else 0.2)   # hyperpigmented patch
    mel = np.clip(dots + band * blot * 0.8, 0, 1) * m_epi
    alb = lerp(alb, lin((0.28, 0.15, 0.08))[None, None], (mel * 0.85)[..., None])

    # --- dermis
    m_pd = (d >= DEJ) & (d < PAP)
    m_rd = (d >= PAP) & (d < HYP)
    m_der = m_pd | m_rd
    fib = np.clip(0.5 + 0.5 * fbm(rng, W, Hh, 9, 2) * 1.6, 0, 1)
    fib_h = cv2.GaussianBlur(fib, (0, 0), sigmaX=6, sigmaY=0.6)       # horizontal fibrous streaks
    sat = 1.0 if g else 0.55
    pink_l = lerp(lin((0.82, 0.62, 0.58)), lin((0.94, 0.62, 0.66)), sat)
    pink_d = lerp(lin((0.62, 0.36, 0.38)), lin((0.80, 0.28, 0.42)), sat)
    cream = lin((0.95, 0.82, 0.74))
    coral = lerp(lin((0.80, 0.52, 0.46)), lin((0.92, 0.46, 0.40)), sat)
    wisp = cv2.GaussianBlur(np.clip(fbm(rng, W, Hh, 20, 3) * 2, -1, 1), (0, 0), sigmaX=1.5, sigmaY=4)
    t_pd = np.clip(stripes2 * 0.35 + fib_h * 0.5 + wisp * 0.4, 0, 1)
    c_pd = lerp(pink_l, cream, (t_pd * 0.6)[..., None])
    s_mix = stripes[..., None]
    c_rd = lerp(pink_d, pink_l, s_mix)
    c_rd = lerp(c_rd, cream, (np.clip(stripes2 - 0.55, 0, 1) * 1.6 * fib_h)[..., None])
    c_rd = lerp(c_rd, coral, smooth(0.2, 0.7, n_low)[..., None] * 0.5)
    c_rd = c_rd * (0.85 + 0.25 * fib_h[..., None])
    alb = np.where(m_pd[..., None], c_pd, alb)
    alb = np.where(m_rd[..., None], c_rd, alb)
    # dehydrated dermis: thin fibres with dark gaps between bundles
    if not g:
        gaps = smooth(0.78, 0.95, 1 - stripes) * smooth(-0.1, 0.4, n_mid) * m_rd
        alb = lerp(alb, lin((0.35, 0.18, 0.20))[None, None], (gaps * 0.7)[..., None])
        hgt -= gaps * 1.2
    ridge = stripes * (1.0 if g else 0.55) + 0.35 * stripes2 + 0.4 * fib_h
    hgt += m_der * ridge
    sss += m_der * 0.8
    rough = np.where(m_der, 0.45 if g else 0.6, rough)

    # capillary loops into the papillae
    lines = np.zeros((Hh, W), np.float32)
    peaks = np.where((pap_wave[1:-1] > pap_wave[:-2]) & (pap_wave[1:-1] >= pap_wave[2:]) & (pap_wave[1:-1] < 0) |
                     ((-pap_wave[1:-1] > -pap_wave[:-2]) & (-pap_wave[1:-1] >= -pap_wave[2:])))[0]
    for pk in peaks[::1]:
        top = dej[pk] * PX + 18
        pts = []
        for k in range(30):
            t = k / 29
            yv = top + (0.42 - dej[pk]) * PX * (1 - np.sin(np.pi * t)) + 4
            xv = pk + np.sin((t - 0.5) * np.pi) * 26 + 6 * np.sin(t * 9)
            pts.append((xv, yv))
        cv2.polylines(lines, [np.int32(np.array(pts) * 4)], False, 1.0, 7, cv2.LINE_AA, shift=2)
    lines = cv2.GaussianBlur(lines, (0, 0), 1.2) * m_der
    alb = lerp(alb, lin((0.70, 0.08, 0.10))[None, None], (lines * 0.85)[..., None])
    hgt += lines * 1.3

    # vessels running along the reticular dermis and cut vessels
    ves = np.zeros((Hh, W), np.float32)
    vcol = np.zeros((Hh, W, 3), np.float32)
    for k, (yc, col) in enumerate(((1.2, (0.62, 0.05, 0.08)), (1.32, (0.18, 0.20, 0.55)), (1.55, (0.66, 0.06, 0.09)),
                                   (0.95, (0.85, 0.75, 0.40)))):
        ph = rng.uniform(0, 6)
        path = (yc + 0.06 * np.sin(x / 0.35 + ph) + 0.03 * np.sin(x / 0.13 + ph * 2)) * PX
        thick = 36 if k < 3 else 14
        msk = np.zeros((Hh, W), np.float32)
        pts = np.stack([u, path], 1)
        cv2.polylines(msk, [np.int32(pts * 4)], False, 1.0, thick, cv2.LINE_AA, shift=2)
        msk = cv2.GaussianBlur(msk, (0, 0), 2)
        tube = np.clip(1 - ((yy - path[None]) / (thick / 2)) ** 2, 0, 1)
        vcol = np.where(msk[..., None] > ves[..., None], lin(col)[None, None] * (0.6 + 0.6 * tube[..., None]), vcol)
        ves = np.maximum(ves, msk)
        hgt += msk * tube * 2.2
    for _ in range(9):
        cx, cy = rng.uniform(150, W - 150), rng.uniform(0.75, 1.6) * PX
        r = rng.uniform(16, 34)
        col = (0.62, 0.05, 0.08) if rng.random() < 0.6 else (0.20, 0.20, 0.55)
        msk = np.zeros((Hh, W), np.float32)
        cv2.circle(msk, (int(cx), int(cy)), int(r), 1.0, -1, cv2.LINE_AA)
        wall = np.zeros((Hh, W), np.float32)
        cv2.circle(wall, (int(cx), int(cy)), int(r), 1.0, 6, cv2.LINE_AA)
        vcol = np.where(msk[..., None] > 0.5, lin(col)[None, None], vcol)
        vcol = np.where(wall[..., None] > 0.5, lin((0.85, 0.55, 0.55))[None, None], vcol)
        ves = np.maximum(ves, np.maximum(msk, wall))
        hgt += wall * 1.5 - msk * 0.6
    ves *= m_der
    alb = lerp(alb, vcol, ves[..., None])

    # fibroblasts: spindle cells among the bundles
    fb = np.zeros((Hh, W), np.float32)
    n_fb = 160 if g else 90
    for _ in range(n_fb):
        cx, cy = rng.uniform(0, W), rng.uniform(0.32, 1.65) * PX
        ang = rng.uniform(-20, 20)
        cv2.ellipse(fb, (int(cx * 4), int(cy * 4)), (int(rng.uniform(14, 22) * 4), int(4.5 * 4)), ang, 0, 360, 1.0, -1,
                    cv2.LINE_AA, shift=2)
    fb = cv2.GaussianBlur(fb, (0, 0), 1.0) * m_der
    alb = lerp(alb, lin((0.55, 0.30, 0.62) if g else (0.45, 0.30, 0.45))[None, None], (fb * 0.85)[..., None])
    hgt += fb * 1.0

    # --- hypodermis: fat lobules
    m_hyp = d >= HYP
    ed2, d02, cid2 = voronoi_cells(rng, W, Hh, 70, 1.0, 1.0)
    lob = np.clip(d02 / 40, 0, 1)
    septa = np.exp(-(ed2 / 5) ** 2)
    c_fat = lerp(lin((1.0, 0.86, 0.45)), lin((0.92, 0.66, 0.25)), lob[..., None])
    c_fat = lerp(c_fat, lin((0.86, 0.50, 0.48)), septa[..., None] * 0.8)
    alb = np.where(m_hyp[..., None], c_fat, alb)
    hgt += m_hyp * ((1 - lob ** 2) * 2.2 - septa * 0.8)
    rough = np.where(m_hyp, 0.28, rough)
    sss += m_hyp * 0.5

    # boundaries: a soft seam between layers
    for B, a in ((DEJ, 0.35), (PAP, 0.15), (HYP, 0.4)):
        seam = np.exp(-((d - B) * PX / 3.5) ** 2)
        alb = lerp(alb, lin((0.55, 0.30, 0.30))[None, None], (seam * a)[..., None])
    hgt += 0.25 * n_fine
    alb = np.clip(alb * (0.95 + 0.1 * n_low[..., None]), 0, 1)
    hgt = cv2.GaussianBlur(hgt, (0, 0), 0.8)
    meta = dict(dej=float(np.mean(dej)), pap=float(np.mean(pap)), hyp=float(np.mean(hyp)))
    return alb, hgt, rough, meta


def top_surface(state):
    b = sk.Base(102)
    if state == 0:
        h, f1, pore = sk.relief(b, furrow=1.9, fine=1.8, plump=0.4, pore_r=1.0)
        alb = sk.base_albedo(b, sat=0.70, bright=0.90)
        rng = np.random.default_rng(12)
        flake = smooth(0.05, 0.35, sk.fbm(rng, sk.S, 520, 4) + 0.08)
        fl = np.zeros((sk.S, sk.S), np.float32)
        for _ in range(1600):
            xx, yy = rng.uniform(0, sk.S, 2)
            if flake[int(yy), int(xx)] < 0.4:
                continue
            r = rng.uniform(18, 60)
            n = rng.integers(5, 8)
            ang = np.sort(rng.uniform(0, 2 * np.pi, n))
            rad = r * rng.uniform(0.5, 1.0, n)
            pts = np.stack([xx + np.cos(ang) * rad * 1.4, yy + np.sin(ang) * rad], 1)
            cv2.fillPoly(fl, [np.int32(pts * 4)], float(rng.uniform(0.5, 1.0)), cv2.LINE_AA, shift=2)
        fl = cv2.GaussianBlur(fl, (0, 0), 1.5)
        h = h + 3.5 * fl
        white = sk.srgb_to_lin(np.array([0.93, 0.88, 0.84], np.float32))
        alb = lerp(alb, white, np.clip(fl * 0.7 + flake * 0.12, 0, 1)[..., None])
        rough = 0.75 - 0.1 * fl
    else:
        h, f1, pore = sk.relief(b, furrow=0.55, fine=0.6, plump=1.8, pore_r=0.9)
        alb = sk.base_albedo(b, sat=1.05, bright=1.02, redness=0.03)
        rough = np.full_like(h, 0.32)
    alb = alb * (1 - 0.25 * f1[..., None]) * (1 - 0.35 * pore[..., None])
    return alb, h, rough


def save(name, alb, hgt, rough):
    cv2.imwrite(os.path.join(OUT, name + "_alb.png"),
                (np.power(np.clip(alb, 0, 1), 1 / 2.2)[..., ::-1] * 255).astype(np.uint8))
    hn = (hgt - hgt.min()) / (hgt.max() - hgt.min() + 1e-6)
    cv2.imwrite(os.path.join(OUT, name + "_h.png"), (hn * 65535).astype(np.uint16))
    cv2.imwrite(os.path.join(OUT, name + "_r.png"), (np.clip(rough, 0, 1) * 255).astype(np.uint8))
    return float(hgt.max() - hgt.min())


if __name__ == "__main__":
    import json, time
    meta = {}
    only_cut = "cut" in sys.argv
    for st, nm in ((0, "bad"), (1, "good")):
        t = time.time()
        a, h, r, m = cut_face(st)
        meta["cut_" + nm] = m
        meta["cut_" + nm]["hrange"] = save("cut_" + nm, a, h, r)
        if only_cut:
            continue
        a, h, r = top_surface(st)
        meta["top_" + nm] = {"hrange": save("top_" + nm, a, h, r)}
        print(nm, time.time() - t)
    mp = os.path.join(OUT, "meta.json")
    old = json.load(open(mp)) if os.path.exists(mp) else {}
    old.update(meta)
    json.dump(old, open(mp, "w"), indent=1)
