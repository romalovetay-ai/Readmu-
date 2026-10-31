// Vector Arcade 1980 (Retro Digital). An XY vector-monitor cabinet: hair-thin phosphor beams on pure black, additive
// bloom, bright dwell dots where the beam pauses at vertices, dimmer long strokes, beam-load flicker, wireframe 3D in
// perspective and a hand-built single-stroke font. The scene change is a hyperspace jump.
(function () {
  const GRN = '#5dff7a', RED = '#ff4d3a', WHT = '#e6f2ff', CYN = '#4de8ff';

  // ---------- single-stroke vector font (our own glyphs on a 4x6 grid, y down) ----------
  const G = {
    A: [[[0, 6], [0, 2], [2, 0], [4, 2], [4, 6]], [[0, 4], [4, 4]]],
    B: [[[0, 6], [0, 0], [3, 0], [4, 1], [4, 2], [3, 3], [0, 3]], [[3, 3], [4, 4], [4, 5], [3, 6], [0, 6]]],
    C: [[[4, 0], [0, 0], [0, 6], [4, 6]]],
    D: [[[0, 0], [2, 0], [4, 2], [4, 4], [2, 6], [0, 6], [0, 0]]],
    E: [[[4, 0], [0, 0], [0, 6], [4, 6]], [[0, 3], [3, 3]]],
    F: [[[4, 0], [0, 0], [0, 6]], [[0, 3], [3, 3]]],
    G: [[[4, 1], [4, 0], [0, 0], [0, 6], [4, 6], [4, 3], [2, 3]]],
    H: [[[0, 0], [0, 6]], [[4, 0], [4, 6]], [[0, 3], [4, 3]]],
    I: [[[0, 0], [4, 0]], [[2, 0], [2, 6]], [[0, 6], [4, 6]]],
    J: [[[0, 4], [1, 6], [4, 6], [4, 0]]],
    K: [[[0, 0], [0, 6]], [[4, 0], [0, 3], [4, 6]]],
    L: [[[0, 0], [0, 6], [4, 6]]],
    M: [[[0, 6], [0, 0], [2, 2], [4, 0], [4, 6]]],
    N: [[[0, 6], [0, 0], [4, 6], [4, 0]]],
    O: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]]],
    P: [[[0, 6], [0, 0], [4, 0], [4, 3], [0, 3]]],
    Q: [[[0, 0], [4, 0], [4, 4], [2, 6], [0, 6], [0, 0]], [[2, 4], [4, 6]]],
    R: [[[0, 6], [0, 0], [4, 0], [4, 3], [0, 3]], [[1, 3], [4, 6]]],
    S: [[[4, 0], [0, 0], [0, 3], [4, 3], [4, 6], [0, 6]]],
    T: [[[0, 0], [4, 0]], [[2, 0], [2, 6]]],
    U: [[[0, 0], [0, 6], [4, 6], [4, 0]]],
    V: [[[0, 0], [2, 6], [4, 0]]],
    W: [[[0, 0], [0, 6], [2, 4], [4, 6], [4, 0]]],
    X: [[[0, 0], [4, 6]], [[4, 0], [0, 6]]],
    Y: [[[0, 0], [2, 2], [4, 0]], [[2, 2], [2, 6]]],
    Z: [[[0, 0], [4, 0], [0, 6], [4, 6]]],
    0: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[4, 0], [0, 6]]],
    1: [[[1, 1], [2, 0], [2, 6]], [[1, 6], [3, 6]]],
    2: [[[0, 0], [4, 0], [4, 3], [0, 3], [0, 6], [4, 6]]],
    3: [[[0, 0], [4, 0], [4, 6], [0, 6]], [[1, 3], [4, 3]]],
    4: [[[0, 0], [0, 3], [4, 3]], [[4, 0], [4, 6]]],
    5: [[[4, 0], [0, 0], [0, 3], [4, 3], [4, 6], [0, 6]]],
    6: [[[4, 0], [0, 0], [0, 6], [4, 6], [4, 3], [0, 3]]],
    7: [[[0, 0], [4, 0], [4, 6]]],
    8: [[[0, 0], [4, 0], [4, 6], [0, 6], [0, 0]], [[0, 3], [4, 3]]],
    9: [[[4, 3], [0, 3], [0, 0], [4, 0], [4, 6]]],
    '.': [[[1.7, 5.6], [2.3, 6]]],
    ',': [[[2, 5.2], [1.2, 7]]],
    '!': [[[2, 0], [2, 4]], [[1.7, 5.6], [2.3, 6]]],
    '?': [[[0, 1], [0, 0], [4, 0], [4, 3], [2, 3], [2, 4]], [[1.7, 5.6], [2.3, 6]]],
    ':': [[[1.7, 1.6], [2.3, 2]], [[1.7, 4.6], [2.3, 5]]],
    '-': [[[1, 3], [3, 3]]],
    '%': [[[0, 6], [4, 0]], [[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]], [[3, 5], [4, 5], [4, 6], [3, 6], [3, 5]]],
  };
  const ADV = 0.95;
  // text -> polylines in screen space (y = baseline). size = cap height in px (already scaled).
  function vecText(text, x, y, size, align = 'left') {
    const t = String(text).toUpperCase(), u = size / 6, adv = size * ADV;
    const w = t.length * adv - (adv - 4 * u);
    const x0 = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
    const out = [];
    for (let i = 0; i < t.length; i++) {
      const g = G[t[i]]; if (!g) continue;
      for (const pl of g) out.push(pl.map(([gx, gy]) => [x0 + i * adv + gx * u, y - size + gy * u]));
    }
    return { polys: out, w, h: size };
  }


  // ---------- the beam ----------
  function beam(ctx, polys, p, o = {}) {
    const s = o.s || 1, col = o.color || GRN, I = (o.intensity ?? 1) * (o.flicker ?? 1);
    if (p <= 0 || !polys.length) return null;
    const lens = polys.map(K.pathLen), total = lens.reduce((a, b) => a + b, 0) || 1;
    let budget = total * K.clamp(p), head = null;
    const core = K.mix(col, '#ffffff', 0.55);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < polys.length && budget > 0; k++) {
      const pl = polys[k], L = lens[k] || 0.001, q = budget >= L ? pl : K.trim(pl, budget / L);
      budget -= L; if (q.length < 2) continue;
      ctx.strokeStyle = K.rgba(col, 0.18 * I); ctx.lineWidth = 6 * s; K.poly(ctx, q); ctx.stroke();
      for (let i = 1; i < q.length; i++) {
        const d = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]), b = K.clamp(1.2 - d / (360 * s), 0.55, 1) * I;
        ctx.strokeStyle = K.rgba(core, 0.95 * b); ctx.lineWidth = 1.7 * s;
        ctx.beginPath(); ctx.moveTo(q[i - 1][0], q[i - 1][1]); ctx.lineTo(q[i][0], q[i][1]); ctx.stroke();
      }
      if (pl.length <= 8) { ctx.fillStyle = K.rgba('#ffffff', 0.75 * I); for (const v of q) ctx.fillRect(v[0] - 1.6 * s, v[1] - 1.6 * s, 3.2 * s, 3.2 * s); }
      head = q[q.length - 1];
    }
    if (head && p < 1) { ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(head[0], head[1], 3.5 * s, 0, 6.283); ctx.fill(); }
    ctx.restore();
    return head;
  }
  const SC = (ctx) => K.layout(ctx.canvas.width, ctx.canvas.height).s;
  // beam load: the more the beam draws, the more the whole picture flickers
  const flick = (t) => 0.86 + 0.14 * K.noise(31).n2(t * 40, 3);

  // ---------- wireframe 3D ----------
  const PHI = 1.618;
  const ICO_V = [[0, 1, PHI], [0, -1, PHI], [0, 1, -PHI], [0, -1, -PHI], [1, PHI, 0], [-1, PHI, 0], [1, -PHI, 0], [-1, -PHI, 0], [PHI, 0, 1], [-PHI, 0, 1], [PHI, 0, -1], [-PHI, 0, -1]];
  const ICO_E = []; for (let i = 0; i < 12; i++) for (let j = i + 1; j < 12; j++) { const a = ICO_V[i], b = ICO_V[j]; if (Math.abs(Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]) - 2) < 0.01) ICO_E.push([i, j]); }
  const CUBE_V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]];
  const CUBE_E = [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]];
  function wire(V, E, cx, cy, r, ry, rx, sx = 1, sy = 1, sz = 1) {
    const P = V.map(([x, y, z]) => {
      x *= sx; y *= sy; z *= sz;
      let X = x * Math.cos(ry) + z * Math.sin(ry), Z = -x * Math.sin(ry) + z * Math.cos(ry);
      let Y = y * Math.cos(rx) - Z * Math.sin(rx); Z = y * Math.sin(rx) + Z * Math.cos(rx);
      const f = 4.5 / (4.5 + Z); return [cx + X * r * f, cy + Y * r * f];
    });
    return E.map(([a, b]) => [P[a], P[b]]);
  }

  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, por: false, title: [[W / 2, 270 * s], [W / 2, 360 * s]], tsize: 54,
      card: [170 * s, 330 * s, 62 * s], cardLbl: [170 * s, 475 * s], core: [500 * s, 320 * s, 92 * s], coreLbl: [500 * s, 480 * s],
      chips: Array.from({ length: 7 }, (_, i) => [820 * s, (140 + i * 76) * s]), lsize: 30, horizon: 640 * s,
      top: [W / 2, 175 * s, 58 * s], cnt: [W / 2, 400 * s], csize: 84, views: [W / 2, 470 * s], take: [[W / 2, 590 * s, 'POST ONCE.'], [W / 2, 665 * s, 'REACH EVERYWHERE.']], ksize: 44 };
    return { s, por: true, title: [[W / 2, H * 0.4], [W / 2, H * 0.45]], tsize: 42,
      card: [W / 2, H * 0.11, 46 * s], cardLbl: [W / 2, H * 0.2], core: [W / 2, H * 0.3, 74 * s], coreLbl: [W / 2, H * 0.41],
      chips: Array.from({ length: 7 }, (_, i) => [i % 2 ? W * 0.55 : W * 0.45, H * (0.48 + Math.floor(i / 2) * 0.06)]), lsize: 28, horizon: H * 0.8,
      top: [W / 2, H * 0.16, 75 * s], cnt: [W / 2, H * 0.4], csize: 62, views: [W / 2, H * 0.455], take: [[W / 2, H * 0.6, 'POST ONCE.'], [W / 2, H * 0.66, 'REACH'], [W / 2, H * 0.72, 'EVERYWHERE.']], ksize: 44 };
  }

  const style = {
    id: 'vector-arcade', name: 'Vector Arcade 1980', family: 'Retro Digital',
    fonts: [],
    palette: { bg: '#000000', green: GRN, red: RED, white: WHT, cyan: CYN },
    sfx: { draw: null, land: 'blip', emphasis: 'glitch', transition: 'riser', bed: 'hum' },
    vecText, beam, wire,

    background(ctx, W, H, t) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H); },

    finish(ctx, W, H, t) {
      // bloom: quarter-res, blurred, added twice (tight + wide halo)
      const d = 4, w = Math.ceil(W / d), h = Math.ceil(H / d);
      const a = K.cached(`va-a:${W}x${H}`, () => K.layer(w, h)), b = K.cached(`va-b:${W}x${H}`, () => K.layer(w, h));
      const ax = a.getContext('2d'), bx = b.getContext('2d');
      ax.clearRect(0, 0, w, h); ax.drawImage(ctx.canvas, 0, 0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      bx.clearRect(0, 0, w, h); bx.filter = 'blur(2px)'; bx.drawImage(a, 0, 0); bx.filter = 'none'; ctx.globalAlpha = 0.9; ctx.drawImage(b, 0, 0, W, H);
      bx.clearRect(0, 0, w, h); bx.filter = 'blur(7px)'; bx.drawImage(a, 0, 0); bx.filter = 'none'; ctx.globalAlpha = 0.7; ctx.drawImage(b, 0, 0, W, H);
      ctx.restore();
      // the tube glass: faint reflection, corner falloff, a little noise
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(120,140,160,0.05)'); g.addColorStop(0.4, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      K.vignette(ctx, W, H, 0.55, '#000');
      K.grain(ctx, W, H, t, 0.04, 30, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = SC(ctx), v = vecText(text, x, y, (o.size || 54) * s, o.align);
      beam(ctx, v.polys, p, { s, color: o.color || GRN, intensity: o.intensity, flicker: o.flicker });
      return { w: v.w, h: v.h };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 30, ...o }); },
    arrow(ctx, from, to, p, o = {}) {
      const s = SC(ctx), pts = [from, to], b = to, ang = Math.atan2(to[1] - from[1], to[0] - from[0]), L = 14 * s;
      // dashed like a tracer: segments with gaps
      const n = Math.max(2, Math.floor(Math.hypot(to[0] - from[0], to[1] - from[1]) / (22 * s))), dash = [];
      for (let i = 0; i < n; i++) { const a0 = i / n, a1 = (i + 0.6) / n; dash.push([[K.lerp(from[0], to[0], a0), K.lerp(from[1], to[1], a0)], [K.lerp(from[0], to[0], a1), K.lerp(from[1], to[1], a1)]]); }
      dash.push([[b[0] - Math.cos(ang - 0.55) * L, b[1] - Math.sin(ang - 0.55) * L], b, [b[0] - Math.cos(ang + 0.55) * L, b[1] - Math.sin(ang + 0.55) * L]]);
      return beam(ctx, dash, p, { s, color: o.color || CYN, flicker: o.flicker });
    },
    box(ctx, x, y, w, h, p, o = {}) {
      const s = SC(ctx), c = 16 * s;
      return beam(ctx, [[[x + c, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + c, y + h], [x, y + h - c], [x, y + c], [x + c, y]]], p, { s, color: o.color || GRN, flicker: o.flicker });
    },
    counter(ctx, value, x, y, p, o = {}) {
      return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 84, align: o.align || 'center', color: o.color || RED, flicker: o.flicker });
    },
    // lock-on: four corner brackets slam in from wide, then a bright ring pulses
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = SC(ctx), k = K.ease.out(K.clamp(p / 0.5)), R = K.lerp(r * 2.2, r, k), ry = R * (o.aspect || 0.45), c = 34 * s, polys = [];
      for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) polys.push([[x + sx * R, y + sy * ry - sy * -c * 0 + (sy < 0 ? c : -c)], [x + sx * R, y + sy * ry], [x + sx * R - sx * c, y + sy * ry]]);
      beam(ctx, polys, 1, { s, color: RED, intensity: 0.4 + 0.6 * k, flicker: o.flicker });
      if (p > 0.5) { const q = K.clamp((p - 0.5) / 0.5); beam(ctx, [K.circlePts(x, y, R * (1 + q * 0.3), ry * (1 + q * 0.6), 64)], 1, { s, color: WHT, intensity: 1 - q }); }
    },
    // hyperspace: stars stretch into streaks from the centre, white-out at 0.5, then snap back
    transition(ctx, W, H, p, o = {}) {
      const s = SC(ctx), k = p < 0.5 ? p * 2 : (1 - p) * 2, r = K.rng(808), cx = W / 2, cy = H / 2, polys = [];
      ctx.save(); ctx.fillStyle = `rgba(0,0,0,${K.clamp(k * 1.6)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      for (let i = 0; i < 90; i++) {
        const a = r() * 6.283, d0 = r() * 0.5 + 0.05, len = K.ease.in(k) * 0.9, R = Math.hypot(W, H) / 2;
        const d1 = d0 + len * (0.3 + r() * 0.7);
        polys.push([[cx + Math.cos(a) * d0 * R, cy + Math.sin(a) * d0 * R], [cx + Math.cos(a) * d1 * R, cy + Math.sin(a) * d1 * R]]);
      }
      beam(ctx, polys, 1, { s, color: r() > 0.5 ? WHT : CYN, intensity: 0.4 + k });
      if (k > 0.85) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = `rgba(200,255,220,${(k - 0.85) * 3})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
  };

  // ---------- scenery ----------
  function mountains(ctx, W, H, y0, s, f) {
    const r = K.rng(12), pts = []; let x = 0;
    while (x < W) { pts.push([x, y0 - r.range(0, 1) * 70 * s * (x % 3 ? 1 : 0.6)]); x += r.range(50, 140) * s; }
    pts.push([W, y0 - 20 * s]);
    beam(ctx, [[[0, y0], [W, y0]], pts], 1, { s, color: GRN, intensity: 0.45, flicker: f });
  }
  function ground(ctx, W, H, y0, t, s, f) {
    const polys = [], cx = W / 2;
    for (let i = -8; i <= 8; i++) polys.push([[cx + i * 40 * s, y0 + 2 * s], [cx + i * 260 * s, H + 40 * s]]);
    for (let j = 0; j < 6; j++) { const z = ((j + (t * 1.2) % 1) / 6), yy = y0 + (H - y0) * z * z; polys.push([[0, yy], [W, yy]]); }
    beam(ctx, polys, 1, { s, color: GRN, intensity: 0.22, flicker: f });
  }
  function stars(ctx, W, H, t, s) {
    const r = K.rng(3); ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 60; i++) { const x = r() * W, y = r() * H, tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 2 + i)); ctx.fillStyle = `rgba(230,242,255,${0.6 * tw})`; ctx.fillRect(x, y, 2 * s, 2 * s); }
    ctx.restore();
  }
  function hud(ctx, W, H, t, score, s, por, f) {
    style.title(ctx, 'SCORE', 40 * s, 52 * s, 1, { size: 22, color: RED, flicker: f });
    style.title(ctx, String(Math.floor(score)).padStart(7, '0'), 40 * s, 92 * s, 1, { size: 30, color: GRN, flicker: f });
    style.title(ctx, 'HI 1000000', W - 40 * s, 52 * s, 1, { size: 22, color: RED, align: 'right', flicker: f });
    if (!por && t < 8.25) { // radar sweep
      const cx = W / 2, cy = 62 * s, R = 36 * s, a = t * 3;
      beam(ctx, [K.circlePts(cx, cy, R, R, 40), [[cx, cy], [cx + Math.cos(a) * R, cy + Math.sin(a) * R]]], 1, { s, color: RED, intensity: 0.8, flicker: f });
    }
  }

  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, f = flick(t), por = Lo.por;
      style.background(ctx, W, H, t);
      const landed = PLATFORMS.filter((_, i) => t > 5.2 + i * 0.4).length;
      const score = t < 8.25 ? landed * 1250 + (t > 4.5 ? 5000 : 0) : K.count(t, 8.6, 1.4, 0, 1000000);
      if (t < 8.25) {
        mountains(ctx, W, H, Lo.horizon, s, f); ground(ctx, W, H, Lo.horizon, t, s, f);
        hud(ctx, W, H, t, score, s, por, f);
        const fade = 1 - K.clamp((t - 1.9) / 0.3);
        if (fade > 0) {
          style.title(ctx, 'One video.', Lo.title[0][0], Lo.title[0][1], K.beat(t, 0.15, 0.5, 'lin'), { size: Lo.tsize, align: 'center', color: RED, intensity: fade, flicker: f });
          style.title(ctx, 'Every platform.', Lo.title[1][0], Lo.title[1][1], K.beat(t, 0.6, 0.7, 'lin'), { size: Lo.tsize, align: 'center', intensity: fade, flicker: f });
        }
        // the video: a wireframe cube flying in from the distance
        if (t > 2.0) {
          const k = K.beat(t, 2.0, 0.8), [cx, cy, r] = Lo.card;
          const edges = wire(CUBE_V, CUBE_E, cx, cy, r * K.lerp(0.1, 1, k), t * 1.1, 0.5, 1.3, 0.85, 0.35);
          beam(ctx, edges, K.beat(t, 2.0, 0.6, 'lin'), { s, color: WHT, flicker: f });
          if (k > 0.6) beam(ctx, [[[cx - 12 * s, cy - 16 * s], [cx - 12 * s, cy + 16 * s], [cx + 16 * s, cy], [cx - 12 * s, cy - 16 * s]]], 1, { s, color: RED, flicker: f });
          style.label(ctx, 'your video', Lo.cardLbl[0], Lo.cardLbl[1], K.beat(t, 2.8, 0.5, 'lin'), { size: 28, align: 'center', color: WHT, flicker: f });
        }
        const [ox, oy, orr] = Lo.core;
        if (por) style.arrow(ctx, [Lo.card[0], Lo.cardLbl[1] + 22 * s], [ox, oy - orr * 1.15], K.beat(t, 3.4, 0.6, 'lin'), { flicker: f });
        else style.arrow(ctx, [Lo.card[0] + 100 * s, Lo.card[1]], [ox - orr * 1.3, oy], K.beat(t, 3.4, 0.6, 'lin'), { flicker: f });
        if (t > 3.9) {
          const k = K.beat(t, 3.9, 0.9);
          beam(ctx, wire(ICO_V, ICO_E, ox, oy, orr * 0.62 * k, t * 1.3, t * 0.7), K.beat(t, 3.9, 0.7, 'lin'), { s, color: WHT, flicker: f });
          beam(ctx, [K.circlePts(ox, oy, orr * 1.45, orr * 0.42, 60)], K.beat(t, 4.3, 0.5, 'lin'), { s, color: GRN, intensity: 0.6, flicker: f });
          style.label(ctx, 'Creator OS', Lo.coreLbl[0], Lo.coreLbl[1], K.beat(t, 4.4, 0.6, 'lin'), { size: 32, align: 'center', color: GRN, flicker: f });
        }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.25, 'lin');
          if (por) {
            if (i === 0) style.arrow(ctx, [W / 2, Lo.coreLbl[1] + 18 * s], [W / 2, Lo.chips[6][1] - 10 * s], K.beat(t, 4.95, 0.5, 'lin'), { flicker: f });
            beam(ctx, [[[W / 2, cy - 14 * s], [left ? W * 0.465 : W * 0.535, cy - 14 * s]]], p, { s, color: CYN, flicker: f });
            style.label(ctx, name, cx, cy, K.beat(t, t0 + 0.15, 0.3, 'lin'), { size: Lo.lsize, align: left ? 'right' : 'left', flicker: f });
          } else {
            style.arrow(ctx, [ox + orr * 1.5, oy], [cx - 18 * s, cy - 14 * s], p, { flicker: f });
            style.label(ctx, name, cx, cy, K.beat(t, t0 + 0.15, 0.3, 'lin'), { size: Lo.lsize, flicker: f });
          }
          // a lock-on tick that flashes as each target lands
          const fl = K.env(t, t0 + 0.4, t0 + 0.7, 0.05, 0.25);
          if (fl > 0 && !por) beam(ctx, [[[cx - 14 * s, cy + 8 * s], [cx + 260 * s, cy + 8 * s]]], 1, { s, color: RED, intensity: fl, flicker: f });
        });
      } else {
        stars(ctx, W, H, t, s);
        hud(ctx, W, H, t, score, s, por, f);
        const [tx, ty, tr] = Lo.top;
        beam(ctx, wire(ICO_V, ICO_E, tx, ty, tr * 0.62, t * 1.3, t * 0.7), 1, { s, color: WHT, flicker: f });
        beam(ctx, [K.circlePts(tx, ty, tr * 1.45, tr * 0.42, 60)], 1, { s, color: GRN, intensity: 0.6, flicker: f });
        style.counter(ctx, Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000, Lo.cnt[0], Lo.cnt[1], 1, { size: Lo.csize, flicker: f });
        style.label(ctx, 'views', Lo.views[0], Lo.views[1], K.beat(t, 8.7, 0.4, 'lin'), { size: 34, align: 'center', color: GRN, flicker: f });
        style.emphasis(ctx, Lo.cnt[0], Lo.cnt[1] - 40 * s, por ? W * 0.44 : 420 * s, K.beat(t, 10.0, 0.7, 'lin'), { flicker: f, aspect: por ? 0.25 : 0.2 });
        if (t > 10.0 && t < 10.15) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,80,60,0.25)'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
        Lo.take.forEach(([x, y, txt], i) => style.title(ctx, txt, x, y, K.beat(t, 10.5 + i * 0.3, 0.5, 'lin'), { size: Lo.ksize, align: 'center', color: i ? GRN : WHT, flicker: f }));
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 0.8);
      // the beam's own buzz while it strokes letters
      const zap = (t, d, f) => k.tone({ t, f, f2: f * 0.5, dur: d, type: 'sawtooth', gain: 0.03, send: 0.05 });
      zap(0.15, 0.5, 440); zap(0.6, 0.7, 520);
      k.play('whoosh', 2.0, { dur: 0.7 }); k.play('blip', 2.8, { note: 'A5' });
      zap(3.4, 0.6, 330); k.play('blip', 4.0, { note: 'E5' }); k.tone({ t: 3.9, f: 110, f2: 220, dur: 0.9, type: 'square', gain: 0.04 }); k.play('blip', 4.5, { note: 'B5' });
      for (let i = 0; i < 7; i++) { k.play('blip', 5.15 + i * 0.4, { note: ['E6', 'G6', 'A6', 'B6', 'D7', 'E7', 'G7'][i], dur: 0.05 }); k.play('click', 5.4 + i * 0.4, { pitch: 1.5 }); }
      k.play('riser', 7.6, { dur: 0.65 }); k.play('thud', 8.25, { gain: 0.8 }); k.play('whoosh', 8.25, { dur: 0.6, up: false });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('glitch', 10.0); k.play('stamp', 10.0, { gain: 0.8 }); k.tone({ t: 10.05, f: 1760, f2: 880, dur: 0.4, type: 'square', gain: 0.04 });
      zap(10.5, 0.5, 392); zap(10.8, 0.5, 494);
      k.play('chime', 11.4, { note: 'E6' });
    },
  };
  MS.register(style);
})();
