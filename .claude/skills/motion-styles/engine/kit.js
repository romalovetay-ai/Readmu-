// kit.js: drawing toolkit for the Creator OS motion-style suite.
// Every frame is a pure function of t: draw(ctx, W, H, t). Randomness only from K.rng(seed) / K.noise(seed).
// Loaded as a plain <script>; exposes window.K.
(function () {
  'use strict';
  const K = (window.K = {});

  // ---------- seeded randomness (mulberry32 over an FNV-1a hash for string seeds) ----------
  function fnv(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
  K.rng = function (seed) {
    let a = (typeof seed === 'string' ? fnv(seed) : seed >>> 0) || 1;
    const r = () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    r.range = (lo, hi) => lo + r() * (hi - lo);
    r.int = (lo, hi) => Math.floor(lo + r() * (hi - lo + 1));
    r.pick = (arr) => arr[Math.floor(r() * arr.length)];
    r.chance = (p) => r() < p;
    r.gauss = () => { let u = 0, v = 0; while (!u) u = r(); while (!v) v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
    return r;
  };

  // ---------- value noise with smooth interpolation (2D/3D) + fbm ----------
  K.noise = function (seed) {
    const r = K.rng(seed), P = new Uint16Array(512), G = new Float32Array(256);
    const perm = [...Array(256).keys()];
    for (let i = 255; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [perm[i], perm[j]] = [perm[j], perm[i]]; }
    for (let i = 0; i < 512; i++) P[i] = perm[i & 255];
    for (let i = 0; i < 256; i++) G[i] = r() * 2 - 1;
    const f = (t) => t * t * t * (t * (t * 6 - 15) + 10);
    const L = (a, b, t) => a + (b - a) * t;
    const v3 = (X, Y, Z) => G[P[P[P[X & 255] + (Y & 255)] + (Z & 255)]];
    function n3(x, y, z) {
      const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), u = f(x - X), v = f(y - Y), w = f(z - Z);
      return L(L(L(v3(X, Y, Z), v3(X + 1, Y, Z), u), L(v3(X, Y + 1, Z), v3(X + 1, Y + 1, Z), u), v),
        L(L(v3(X, Y, Z + 1), v3(X + 1, Y, Z + 1), u), L(v3(X, Y + 1, Z + 1), v3(X + 1, Y + 1, Z + 1), u), v), w);
    }
    const n2 = (x, y) => n3(x, y, 0.37);
    const fbm3 = (x, y, z, oct = 4) => { let s = 0, a = 0.5, q = 1, n = 0; for (let i = 0; i < oct; i++) { s += a * n3(x * q, y * q, z * q); n += a; a *= 0.5; q *= 2.03; } return s / n; };
    const fbm2 = (x, y, oct = 4) => fbm3(x, y, 0.37, oct);
    return { n2, n3, fbm2, fbm3 };
  };

  // ---------- math + timing ----------
  K.lerp = (a, b, t) => a + (b - a) * t;
  K.clamp = (v, lo = 0, hi = 1) => Math.max(lo, Math.min(hi, v));
  K.map = (v, a, b, c, d) => c + ((v - a) / (b - a)) * (d - c);
  K.smooth = (e0, e1, x) => { const t = K.clamp((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };
  K.ease = {
    lin: (t) => t,
    in: (t) => t * t * t,
    out: (t) => 1 - Math.pow(1 - t, 3),
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    back: (t) => { const c = 1.70158; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); },
    elastic: (t) => (t <= 0 ? 0 : t >= 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    bounce: (t) => { const n = 7.5625, d = 2.75; if (t < 1 / d) return n * t * t; if (t < 2 / d) return n * (t -= 1.5 / d) * t + 0.75; if (t < 2.5 / d) return n * (t -= 2.25 / d) * t + 0.9375; return n * (t -= 2.625 / d) * t + 0.984375; },
  };
  // Progress of a beat that starts at t0 and lasts dur, eased (0 before, 1 after).
  K.beat = (t, t0, dur, easing = 'out') => K.ease[easing](K.clamp((t - t0) / Math.max(1e-6, dur)));
  // In-hold-out envelope: 0 -> 1 over fin, holds, 1 -> 0 over fout ending at t1.
  K.env = (t, t0, t1, fin = 0.3, fout = 0.3) => Math.min(K.clamp((t - t0) / fin), K.clamp((t1 - t) / fout));
  // Damped spring kick starting at t0 (0 before): overshoot + settle.
  K.spring = (t, t0, amp = 1, freq = 2.2, damp = 5) => (t < t0 ? 0 : amp * Math.exp(-damp * (t - t0)) * Math.sin(2 * Math.PI * freq * (t - t0)));

  // ---------- color ----------
  K.hex = (h) => { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map((c) => c + c).join(''); const n = parseInt(h, 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
  K.rgba = (c, a = 1) => { const [r, g, b] = Array.isArray(c) ? c : K.hex(c); return `rgba(${r | 0},${g | 0},${b | 0},${a})`; };
  K.mix = (c1, c2, t) => { const a = Array.isArray(c1) ? c1 : K.hex(c1), b = Array.isArray(c2) ? c2 : K.hex(c2); return [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * t); };

  // ---------- canvases + cached textures ----------
  K.layer = (w, h) => { const c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; };
  const CACHE = new Map();
  // Build once, reuse every frame (key must include anything the build depends on).
  K.cached = (key, build) => { if (!CACHE.has(key)) CACHE.set(key, build()); return CACHE.get(key); };

  // Paper/surface texture as a cached canvas: base colour + fibre noise + soft mottling.
  K.paperTex = function (W, H, base = '#f2ead8', seed = 3, strength = 0.07, fibre = true) {
    return K.cached(`paper:${W}x${H}:${base}:${seed}:${strength}:${fibre}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), img = x.createImageData(W, H), d = img.data;
      const nz = K.noise(seed), [br, bg, bb] = K.hex(base), r = K.rng(seed + 11);
      for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
        const m = nz.fbm2(i * 0.006, y * 0.006, 4) * 0.6 + nz.n2(i * 0.09, y * 0.02) * (fibre ? 0.3 : 0) + (r() - 0.5) * 0.25;
        const s = 1 + m * strength * 2, o = (y * W + i) * 4;
        d[o] = br * s; d[o + 1] = bg * s; d[o + 2] = bb * s; d[o + 3] = 255;
      }
      x.putImageData(img, 0, 0); return c;
    });
  };
  // Film grain overlay as a small cached noise tile, shifted every frame (cheap, deterministic).
  K.grain = function (ctx, W, H, t, amount = 0.08, fps = 24, mode = 'overlay') {
    const tile = K.cached(`grain:${amount}`, () => {
      const s = 256, c = K.layer(s, s), x = c.getContext('2d'), img = x.createImageData(s, s), d = img.data, r = K.rng(77);
      for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() - 0.5) * 255 * amount * 2.2; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      x.putImageData(img, 0, 0); return c;
    });
    const k = Math.floor(t * fps), r = K.rng(k + 1), ox = r.int(0, 255), oy = r.int(0, 255);
    ctx.save(); ctx.globalCompositeOperation = mode; ctx.globalAlpha = 0.9;
    ctx.translate(-ox, -oy);
    ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.fillRect(ox, oy, W, H);
    ctx.restore();
  };
  K.vignette = function (ctx, W, H, strength = 0.45, color = '#000') {
    const g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
    g.addColorStop(0, K.rgba(color, 0)); g.addColorStop(1, K.rgba(color, strength));
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
  };

  // ---------- camera ----------
  // K.camera(ctx, W, H, {x, y, zoom, rot}) centres world point (x, y) on screen. Wrap world drawing in save/restore.
  K.camera = function (ctx, W, H, c) {
    ctx.translate(W / 2, H / 2); ctx.rotate(c.rot || 0); ctx.scale(c.zoom || 1, c.zoom || 1); ctx.translate(-(c.x ?? W / 2), -(c.y ?? H / 2));
  };
  // Keyframed camera: keys = [[t, {x, y, zoom}], ...], eased between keys.
  K.camAt = function (keys, t, easing = 'inOut') {
    if (t <= keys[0][0]) return { ...keys[0][1] };
    for (let i = 1; i < keys.length; i++) {
      const [t1, c1] = keys[i], [t0, c0] = keys[i - 1];
      if (t <= t1) { const p = K.ease[easing](K.clamp((t - t0) / (t1 - t0))); const o = {}; for (const k of Object.keys(c1)) o[k] = K.lerp(c0[k] ?? c1[k], c1[k], p); return o; }
    }
    return { ...keys[keys.length - 1][1] };
  };

  // ---------- paths: wobble, draw-on, arrows ----------
  // Sample a cubic bezier into points.
  K.bezier = (p0, p1, p2, p3, n = 48) => { const out = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; out.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return out; };
  // Curved arrow path from a to b, bending by `bend` (fraction of length, sign picks the side).
  K.arcPts = (a, b, bend = 0.25, n = 48) => { const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, dx = b[0] - a[0], dy = b[1] - a[1]; const c = [mx - dy * bend, my + dx * bend]; return K.bezier(a, [K.lerp(a[0], c[0], 0.66), K.lerp(a[1], c[1], 0.66)], [K.lerp(b[0], c[0], 0.66), K.lerp(b[1], c[1], 0.66)], b, n); };
  // Hand-drawn jitter: perturb points along their normal with seeded noise (amp px).
  K.wobble = (pts, amp = 2, seed = 1, freq = 0.03) => { const nz = K.noise(seed); let s = 0; return pts.map((p, i) => { if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]); const q = pts[Math.min(pts.length - 1, i + 1)], o = pts[Math.max(0, i - 1)], dx = q[0] - o[0], dy = q[1] - o[1], l = Math.hypot(dx, dy) || 1, w = nz.n2(s * freq, seed) * amp; return [p[0] - (dy / l) * w, p[1] + (dx / l) * w]; }); };
  K.pathLen = (pts) => { let s = 0; for (let i = 1; i < pts.length; i++) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); return s; };
  // First fraction p of a polyline (by length) -> points.
  K.trim = (pts, p) => { if (p >= 1) return pts; if (p <= 0) return [pts[0]]; const L = K.pathLen(pts) * p; let s = 0; const out = [pts[0]]; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); if (s + d >= L) { const k = (L - s) / d; out.push([K.lerp(pts[i - 1][0], pts[i][0], k), K.lerp(pts[i - 1][1], pts[i][1], k)]); return out; } s += d; out.push(pts[i]); } return out; };
  K.poly = (ctx, pts, close = false) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); if (close) ctx.closePath(); };
  // Stroke the first p of a path (draw-on).
  K.drawOn = (ctx, pts, p, style = {}) => { const q = K.trim(pts, p); if (q.length < 2) return; ctx.save(); Object.assign(ctx, { lineCap: 'round', lineJoin: 'round' }, style); K.poly(ctx, q); ctx.stroke(); ctx.restore(); return q[q.length - 1]; };
  // Arrowhead at the end of a drawn path (size px), returns nothing.
  K.arrowHead = (ctx, pts, size = 18, style = {}, filled = false) => { if (pts.length < 2) return; const b = pts[pts.length - 1], a = pts[Math.max(0, pts.length - 4)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]); ctx.save(); Object.assign(ctx, { lineCap: 'round', lineJoin: 'round' }, style); ctx.beginPath(); ctx.moveTo(b[0] - Math.cos(ang - 0.45) * size, b[1] - Math.sin(ang - 0.45) * size); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang + 0.45) * size, b[1] - Math.sin(ang + 0.45) * size); if (filled) { ctx.closePath(); ctx.fill(); } else ctx.stroke(); ctx.restore(); };
  K.circlePts = (cx, cy, rx, ry = rx, n = 64, a0 = -Math.PI / 2, sweep = Math.PI * 2) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + (sweep * i) / n; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  K.rectPts = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h], [x, y]];

  // ---------- text ----------
  K.font = (size, family = 'Inter', weight = 700, style = '') => `${style} ${weight} ${size | 0}px "${family}"`.trim();
  // Shrink a font size until `text` fits maxW.
  K.fitSize = (ctx, text, family, weight, size, maxW, min = 12) => { let s = size; for (; s > min; s -= 2) { ctx.font = K.font(s, family, weight); if (ctx.measureText(text).width <= maxW) break; } return s; };
  // Draw text with a typed-on reveal (p 0..1 = share of characters) and optional per-letter jitter.
  K.text = function (ctx, text, x, y, o = {}) {
    const p = o.p == null ? 1 : K.clamp(o.p), n = Math.round(text.length * p), s = text.slice(0, n);
    ctx.save(); ctx.font = K.font(o.size || 48, o.family || 'Inter', o.weight ?? 700, o.style || '');
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.baseline || 'alphabetic';
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = o.shadowBlur ?? 12; }
    if (o.stroke) { ctx.lineWidth = o.strokeW || 6; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
    ctx.fillStyle = o.color || '#111'; ctx.fillText(s, x, y); ctx.restore();
    return n < text.length;
  };
  // Word-wrap text into lines that fit maxW at the current ctx.font.
  K.wrap = (ctx, text, maxW) => { const words = text.split(/\s+/), lines = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; } else cur = t; } if (cur) lines.push(cur); return lines; };

  // ---------- number formatting for counters ----------
  K.fmt = (v, dec = 0) => Number(v).toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  // Counter value at t: rolls from a to b between t0 and t0+dur, settling with easeOut.
  K.count = (t, t0, dur, a, b) => K.lerp(a, b, K.beat(t, t0, dur, 'out'));

  // ---------- portrait-aware layout ----------
  // K.layout(W, H) -> {portrait, s, cx, cy, pad}: s scales 1280x720-authored sizes so they read at 1080x1920 too.
  // Portrait (1080x1920) scales type/stroke ~1.5x so it reads on a phone; place things with fractions of W/H (L.fx/L.fy).
  K.layout = (W, H) => { const portrait = H > W; const s = portrait ? (W / 1280) * 1.75 : Math.min(W / 1280, H / 720); return { portrait, s, cx: W / 2, cy: H / 2, pad: Math.round(48 * s), fx: (f) => f * W, fy: (f) => f * H }; };
})();
