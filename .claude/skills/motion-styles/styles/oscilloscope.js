// Oscilloscope Vector Art (Retro Digital). One P31 green beam on an analogue lab scope draws everything: a single-
// stroke vector font, dwell-bright vertices, dim fast retraces, bloom + halation, an internal graticule etched on the
// glass, a moulded bezel and a knobbed instrument front panel. The scene change is the instrument's own: Y gain to
// zero, X gain to zero (the picture collapses to a dot), then it re-expands.
(function () {
  const P31 = '#3dff6e', CORE = '#c4ffd0', AMBER = '#ffb347';
  const SCREEN_BG = '#060c08';

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

  // ---------- the beam: draws a list of polylines in order, the first fraction p of their length ----------
  function beam(ctx, polys, p, o = {}) {
    const s = o.s || 1, I = o.intensity ?? 1, col = o.color || P31, core = o.core || CORE;
    if (p <= 0 || !polys.length) return null;
    const lens = polys.map(K.pathLen), total = lens.reduce((a, b) => a + b, 0) || 1;
    let budget = total * K.clamp(p), head = null;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let k = 0; k < polys.length && budget > 0; k++) {
      const pl = polys[k], L = lens[k] || 0.001, q = budget >= L ? pl : K.trim(pl, budget / L);
      budget -= L; if (q.length < 2) continue;
      // halation: wide, faint
      ctx.strokeStyle = K.rgba(col, 0.12 * I); ctx.lineWidth = 13 * s; K.poly(ctx, q); ctx.stroke();
      ctx.strokeStyle = K.rgba(col, 0.32 * I); ctx.lineWidth = 5.5 * s; K.poly(ctx, q); ctx.stroke();
      // core: per segment, long (fast) strokes are dimmer
      for (let i = 1; i < q.length; i++) {
        const d = Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]);
        const b = K.clamp(1.15 - d / (300 * s), 0.5, 1) * I;
        ctx.strokeStyle = K.rgba(core, 0.9 * b); ctx.lineWidth = 2.6 * s;
        ctx.beginPath(); ctx.moveTo(q[i - 1][0], q[i - 1][1]); ctx.lineTo(q[i][0], q[i][1]); ctx.stroke();
      }
      // dwell: the beam slows at vertices, so they burn brighter
      if (pl.length <= 8) { ctx.fillStyle = K.rgba(core, 0.5 * I); for (let i = 0; i < q.length; i++) { ctx.beginPath(); ctx.arc(q[i][0], q[i][1], 2.6 * s, 0, 6.283); ctx.fill(); } }
      head = q[q.length - 1];
    }
    if (head && p < 1) { // the writing spot itself
      const g = ctx.createRadialGradient(head[0], head[1], 0, head[0], head[1], 16 * s);
      g.addColorStop(0, K.rgba('#ffffff', 0.95 * I)); g.addColorStop(0.25, K.rgba(col, 0.6 * I)); g.addColorStop(1, K.rgba(col, 0));
      ctx.fillStyle = g; ctx.fillRect(head[0] - 16 * s, head[1] - 16 * s, 32 * s, 32 * s);
    }
    ctx.restore();
    return head;
  }

  // ---------- geometry ----------
  function geom(W, H) {
    const L = K.layout(W, H);
    if (!L.portrait) return { ...L, scr: [W * 0.019, H * 0.036, W * 0.74, H * 0.928], pan: [W * 0.775, H * 0.036, W * 0.206, H * 0.928] };
    return { ...L, scr: [W * 0.028, H * 0.016, W * 0.944, H * 0.65], pan: [W * 0.028, H * 0.69, W * 0.944, H * 0.29] };
  }
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

  function knob(x, ctx, cx, cy, r, ang, label, s, ticks) {
    ctx.save();
    ctx.strokeStyle = '#3b4a63'; ctx.lineWidth = 1.5 * s; ctx.fillStyle = '#3b4a63'; ctx.font = K.font(10 * s, 'Inter', 600); ctx.textAlign = 'center';
    for (let i = 0; i <= 10; i++) { const a = Math.PI * 0.75 + (i / 10) * Math.PI * 1.5; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 1.2, cy + Math.sin(a) * r * 1.2); ctx.lineTo(cx + Math.cos(a) * r * 1.35, cy + Math.sin(a) * r * 1.35); ctx.stroke(); if (ticks && i % 2 === 0) ctx.fillText(ticks[i / 2], cx + Math.cos(a) * r * 1.62, cy + Math.sin(a) * r * 1.62 + 4 * s); }
    const g = ctx.createRadialGradient(cx - r * 0.35, cy - r * 0.4, r * 0.1, cx, cy, r);
    g.addColorStop(0, '#5b5f66'); g.addColorStop(0.5, '#1f2226'); g.addColorStop(1, '#0b0c0e');
    ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetY = 3 * s;
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.283); ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1 * s;
    for (let i = 0; i < 24; i++) { const a = (i / 24) * 6.283; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); ctx.lineTo(cx + Math.cos(a) * r * 0.97, cy + Math.sin(a) * r * 0.97); ctx.stroke(); }
    ctx.strokeStyle = '#f2f2ee'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ang) * r * 0.2, cy + Math.sin(ang) * r * 0.2); ctx.lineTo(cx + Math.cos(ang) * r * 0.85, cy + Math.sin(ang) * r * 0.85); ctx.stroke();
    if (label) { ctx.fillStyle = '#2b2f36'; ctx.font = K.font(11 * s, 'Inter', 800); ctx.fillText(label, cx, cy + r * 2.05); }
    ctx.restore();
  }
  function panelLayer(W, H) {
    return K.cached(`osc-panel:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), g = geom(W, H), s = g.s * (g.portrait ? 0.95 : 1);
      // instrument body
      const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#e4e5e0'); bg.addColorStop(1, '#cfd0ca');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      const r = K.rng(5); x.fillStyle = 'rgba(0,0,0,0.025)'; for (let i = 0; i < 2500; i++) x.fillRect(r() * W, r() * H, 1.5, 1.5);
      // moulded bezel around the tube
      const [sx, sy, sw, sh] = g.scr, b = 18 * g.s;
      const bz = x.createLinearGradient(sx, sy, sx + sw, sy + sh); bz.addColorStop(0, '#2a2d2c'); bz.addColorStop(1, '#121413');
      x.fillStyle = bz; rr(x, sx - b, sy - b, sw + 2 * b, sh + 2 * b, 26 * g.s); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.12)'; x.lineWidth = 2 * g.s; rr(x, sx - b + 3, sy - b + 3, sw + 2 * b - 6, sh + 2 * b - 6, 24 * g.s); x.stroke();
      for (const [px, py] of [[sx - b * 0.5, sy - b * 0.5], [sx + sw + b * 0.5, sy - b * 0.5], [sx - b * 0.5, sy + sh + b * 0.5], [sx + sw + b * 0.5, sy + sh + b * 0.5]]) { x.fillStyle = '#6b6f70'; x.beginPath(); x.arc(px, py, 5 * g.s, 0, 6.283); x.fill(); }
      // front panel
      const [px, py, pw, ph] = g.pan;
      x.fillStyle = '#2b2f36'; x.font = K.font(26 * s, 'Space Grotesk', 700); x.fillText('XY-2', px + 14 * s, py + 34 * s);
      x.font = K.font(12 * s, 'Inter', 800); x.fillText('OSCILLOGRAPH', px + 92 * s, py + 22 * s);
      x.fillStyle = '#4a6fa5'; x.font = K.font(10 * s, 'Inter', 600); x.fillText('DUAL TRACE  20 MHz', px + 92 * s, py + 38 * s);
      x.fillStyle = '#4a6fa5'; x.fillRect(px + 14 * s, py + 48 * s, pw - 28 * s, 2 * s);
      const sec = (yy, hh, name) => { x.strokeStyle = '#7b8aa3'; x.lineWidth = 1.5 * s; rr(x, px + 10 * s, yy, pw - 20 * s, hh, 10 * s); x.stroke(); x.fillStyle = '#e1e2dd'; const tw = x.measureText(name).width; x.fillRect(px + pw / 2 - tw / 2 - 8 * s, yy - 8 * s, tw + 16 * s, 16 * s); x.fillStyle = '#4a6fa5'; x.font = K.font(11 * s, 'Inter', 800); x.textAlign = 'center'; x.fillText(name, px + pw / 2, yy + 4 * s); x.textAlign = 'left'; };
      const tk = ['5', '2', '1', '.5', '.2', '.1'];
      if (!g.portrait) {
        knob(0, x, px + pw * 0.2, py + 90 * s, 15 * s, -2.2, 'INTENSITY', s);
        knob(0, x, px + pw * 0.45, py + 90 * s, 15 * s, -1.0, 'FOCUS', s);
        sec(py + 150 * s, 220 * s, 'VERTICAL');
        knob(0, x, px + pw * 0.28, py + 250 * s, 26 * s, -2.4, 'CH1  X', s, tk);
        knob(0, x, px + pw * 0.72, py + 250 * s, 26 * s, -2.0, 'CH2  Y', s, tk);
        sec(py + 395 * s, 190 * s, 'HORIZONTAL');
        knob(0, x, px + pw * 0.33, py + 485 * s, 28 * s, 2.2, 'TIME/DIV', s, tk);
        ['X-Y', 'ALT', 'CHOP'].forEach((n, i) => { const yy = py + (440 + i * 40) * s; x.fillStyle = '#2b2f36'; x.font = K.font(11 * s, 'Inter', 800); x.fillText(n, px + pw * 0.6, yy + 5 * s); const bgb = x.createLinearGradient(0, yy - 9 * s, 0, yy + 9 * s); bgb.addColorStop(0, '#f4f4f1'); bgb.addColorStop(1, '#b9bab4'); x.fillStyle = bgb; rr(x, px + pw * 0.78, yy - 9 * s, 38 * s, 18 * s, 3 * s); x.fill(); });
        ['CH1', 'CH2', 'EXT'].forEach((n, i) => { const cx = px + pw * (0.2 + i * 0.3), cy = py + 625 * s; x.fillStyle = '#9a9c96'; x.beginPath(); x.arc(cx, cy, 13 * s, 0, 6.283); x.fill(); x.fillStyle = '#3a3d40'; x.beginPath(); x.arc(cx, cy, 6 * s, 0, 6.283); x.fill(); x.fillStyle = '#2b2f36'; x.font = K.font(10 * s, 'Inter', 800); x.textAlign = 'center'; x.fillText(n, cx, cy + 28 * s); x.textAlign = 'left'; });
      } else {
        sec(py + 70 * s, ph - 90 * s, 'VERTICAL   HORIZONTAL');
        knob(0, x, px + pw * 0.16, py + ph * 0.45, 40 * s, -2.4, 'CH1  X', s, tk);
        knob(0, x, px + pw * 0.4, py + ph * 0.45, 40 * s, -2.0, 'CH2  Y', s, tk);
        knob(0, x, px + pw * 0.64, py + ph * 0.45, 40 * s, 2.2, 'TIME/DIV', s, tk);
        ['X-Y', 'ALT', 'CHOP'].forEach((n, i) => { const yy = py + ph * (0.3 + i * 0.16); x.fillStyle = '#2b2f36'; x.font = K.font(14 * s, 'Inter', 800); x.fillText(n, px + pw * 0.8, yy + 6 * s); const bgb = x.createLinearGradient(0, yy - 11 * s, 0, yy + 11 * s); bgb.addColorStop(0, '#f4f4f1'); bgb.addColorStop(1, '#b9bab4'); x.fillStyle = bgb; rr(x, px + pw * 0.88, yy - 11 * s, 52 * s, 22 * s, 3 * s); x.fill(); });
        ['CH1 OR X', 'CH2 OR Y', 'EXT TRIG', 'CAL .5V'].forEach((n, i) => { const cx = px + pw * (0.16 + i * 0.22), cy = py + ph * 0.8; x.fillStyle = '#9a9c96'; x.beginPath(); x.arc(cx, cy, 18 * s, 0, 6.283); x.fill(); x.fillStyle = '#3a3d40'; x.beginPath(); x.arc(cx, cy, 8 * s, 0, 6.283); x.fill(); x.fillStyle = '#2b2f36'; x.font = K.font(12 * s, 'Inter', 800); x.textAlign = 'center'; x.fillText(n, cx, cy + 38 * s); x.textAlign = 'left'; });
        knob(0, x, px + pw * 0.85, py + 30 * s, 16 * s, -1.0, '', s);
        knob(0, x, px + pw * 0.72, py + 30 * s, 16 * s, -2.2, '', s);
      }
      return c;
    });
  }
  // the bezel sits in front of the tube: a layer with the screen cut out
  function bezelFront(W, H) {
    return K.cached(`osc-front:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), g = geom(W, H), [sx, sy, sw, sh] = g.scr;
      x.drawImage(panelLayer(W, H), 0, 0);
      x.globalCompositeOperation = 'destination-out'; rr(x, sx, sy, sw, sh, 22 * g.s); x.fill();
      x.globalCompositeOperation = 'source-over';
      // inner lip shadow
      x.save(); rr(x, sx, sy, sw, sh, 22 * g.s); x.clip(); x.shadowColor = 'rgba(0,0,0,0.9)'; x.shadowBlur = 28 * g.s; x.lineWidth = 30 * g.s; x.strokeStyle = '#000'; rr(x, sx - 15 * g.s, sy - 15 * g.s, sw + 30 * g.s, sh + 30 * g.s, 30 * g.s); x.stroke(); x.restore();
      return c;
    });
  }
  function graticule(W, H) {
    return K.cached(`osc-grat:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), g = geom(W, H), [sx, sy, sw, sh] = g.scr, s = g.s;
      const mx = sw * 0.04, my = sh * 0.05, gx = sx + mx, gy = sy + my, gw = sw - 2 * mx, gh = sh - 2 * my;
      const nx = g.portrait ? 8 : 10, ny = g.portrait ? 10 : 8;
      x.strokeStyle = 'rgba(150,210,165,0.16)'; x.lineWidth = 1.2 * s;
      for (let i = 0; i <= nx; i++) { x.beginPath(); x.moveTo(gx + (gw * i) / nx, gy); x.lineTo(gx + (gw * i) / nx, gy + gh); x.stroke(); }
      for (let j = 0; j <= ny; j++) { x.beginPath(); x.moveTo(gx, gy + (gh * j) / ny); x.lineTo(gx + gw, gy + (gh * j) / ny); x.stroke(); }
      x.strokeStyle = 'rgba(150,210,165,0.22)';
      for (let i = 0; i <= nx * 5; i++) { const xx = gx + (gw * i) / (nx * 5); x.beginPath(); x.moveTo(xx, gy + gh / 2 - 4 * s); x.lineTo(xx, gy + gh / 2 + 4 * s); x.stroke(); }
      for (let j = 0; j <= ny * 5; j++) { const yy = gy + (gh * j) / (ny * 5); x.beginPath(); x.moveTo(gx + gw / 2 - 4 * s, yy); x.lineTo(gx + gw / 2 + 4 * s, yy); x.stroke(); }
      x.fillStyle = 'rgba(150,210,165,0.22)'; x.font = K.font(11 * s, 'Inter', 600);
      x.fillText('100', gx + 4 * s, gy + gh * 0.12 - 4 * s); x.fillText('90', gx + 4 * s, gy + gh * 0.25 - 4 * s); x.fillText('10', gx + 4 * s, gy + gh * 0.75 - 4 * s); x.fillText('0%', gx + 4 * s, gy + gh * 0.88 - 4 * s);
      // glass: a broad soft reflection of the room light
      const rg = x.createLinearGradient(sx, sy, sx + sw * 0.7, sy + sh);
      rg.addColorStop(0, 'rgba(255,255,255,0.07)'); rg.addColorStop(0.35, 'rgba(255,255,255,0.015)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = rg; x.fillRect(sx, sy, sw, sh);
      // tube corner falloff
      const v = x.createRadialGradient(sx + sw / 2, sy + sh / 2, Math.min(sw, sh) * 0.35, sx + sw / 2, sy + sh / 2, Math.hypot(sw, sh) * 0.58);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.6)'); x.fillStyle = v; x.fillRect(sx, sy, sw, sh);
      return c;
    });
  }
  // bloom: quarter-res copy of the screen, blurred, added back
  function bloom(ctx, W, H, amt, blur) {
    const g = geom(W, H), d = 4, w = Math.ceil(W / d), h = Math.ceil(H / d);
    const a = K.cached(`osc-bloomA:${W}x${H}`, () => K.layer(w, h)), b = K.cached(`osc-bloomB:${W}x${H}`, () => K.layer(w, h));
    const ax = a.getContext('2d'), bx = b.getContext('2d');
    ax.clearRect(0, 0, w, h); ax.drawImage(ctx.canvas, 0, 0, w, h);
    bx.clearRect(0, 0, w, h); bx.filter = `blur(${blur}px)`; bx.drawImage(a, 0, 0); bx.filter = 'none';
    const [sx, sy, sw, sh] = g.scr;
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amt; ctx.drawImage(b, 0, 0, W, H); ctx.globalAlpha = amt * 0.5; ctx.drawImage(b, -6, -6, W + 12, H + 12); ctx.restore();
  }

  let flare = 0; // emphasis pushes the bloom up for the current frame

  const style = {
    id: 'oscilloscope', name: 'Oscilloscope Vector Art', family: 'Retro Digital',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Inter:wght@600;800&family=Space+Grotesk:wght@700&display=block', specs: ['800 12px "Inter"', '600 12px "Inter"', '700 26px "Space Grotesk"'] }],
    palette: { bg: SCREEN_BG, beam: P31, core: CORE, warn: AMBER, panel: '#dcddd8', bezel: '#1d1f1e', label: '#4a6fa5' },
    sfx: { draw: null, land: 'blip', emphasis: 'thud', transition: 'whoosh', bed: 'hum' },
    vecText, beam,
    screen: (W, H) => geom(W, H).scr,

    background(ctx, W, H, t) {
      ctx.drawImage(panelLayer(W, H), 0, 0);
      const [sx, sy, sw, sh] = geom(W, H).scr;
      const g = ctx.createRadialGradient(sx + sw / 2, sy + sh / 2, 0, sx + sw / 2, sy + sh / 2, Math.hypot(sw, sh) / 2);
      g.addColorStop(0, '#0b1a10'); g.addColorStop(1, SCREEN_BG);
      ctx.fillStyle = g; ctx.fillRect(sx, sy, sw, sh);
    },

    finish(ctx, W, H, t) {
      bloom(ctx, W, H, 1.0 + flare, 5 + flare * 4); flare = 0;
      ctx.drawImage(graticule(W, H), 0, 0);
      ctx.drawImage(bezelFront(W, H), 0, 0);
      // power LED
      const g = geom(W, H), [px, py, pw, ph] = g.pan, s = g.s;
      const lx = g.portrait ? px + pw * 0.95 : px + pw * 0.86, ly = g.portrait ? py + 30 * s * 0.8 : py + 90 * s;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 14 * s); lg.addColorStop(0, 'rgba(255,190,90,1)'); lg.addColorStop(0.3, 'rgba(255,140,40,0.6)'); lg.addColorStop(1, 'rgba(255,140,40,0)');
      ctx.fillStyle = lg; ctx.fillRect(lx - 14 * s, ly - 14 * s, 28 * s, 28 * s);
      K.grain(ctx, W, H, t, 0.03, 30, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = K.layout(ctx.canvas.width, ctx.canvas.height).s, v = vecText(text, x, y, (o.size || 52) * s, o.align);
      beam(ctx, v.polys, p, { s, color: o.color, intensity: o.intensity });
      return { w: v.w, h: v.h };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 30, ...o }); },

    arrow(ctx, from, to, p, o = {}) {
      const s = K.layout(ctx.canvas.width, ctx.canvas.height).s, pts = K.arcPts(from, to, o.bend ?? 0, 24);
      const b = pts[pts.length - 1], a = pts[pts.length - 3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 16 * s;
      const head = [[b[0] - Math.cos(ang - 0.5) * L, b[1] - Math.sin(ang - 0.5) * L], b, [b[0] - Math.cos(ang + 0.5) * L, b[1] - Math.sin(ang + 0.5) * L]];
      return beam(ctx, [pts, head], p, { s, color: o.color, intensity: o.intensity });
    },

    box(ctx, x, y, w, h, p, o = {}) {
      const s = K.layout(ctx.canvas.width, ctx.canvas.height).s;
      if (o.ring) { // the node: a ring traced twice with a phase twist, like an XY figure
        const ph = o.phase || 0, cx = x + w / 2, cy = y + h / 2;
        const a = K.circlePts(cx, cy, w / 2, h / 2, 80, -Math.PI / 2, Math.PI * 2);
        const b = Array.from({ length: 81 }, (_, i) => { const k = (i / 80) * Math.PI * 2; return [cx + Math.cos(k) * w * 0.55, cy + Math.sin(k + 0.5 * Math.sin(ph)) * h * 0.6]; });
        return beam(ctx, [a, b], p, { s, color: o.color, intensity: o.intensity });
      }
      return beam(ctx, [K.rectPts(x, y, w, h)], p, { s, color: o.color, intensity: o.intensity });
    },

    counter(ctx, value, x, y, p, o = {}) {
      return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 84, align: o.align || 'center', color: o.color, intensity: o.intensity ?? 1.15 });
    },

    // a damped sine burst under the key number + the bloom flares
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = K.layout(ctx.canvas.width, ctx.canvas.height).s, n = 120, ph = (o.t || 0) * 9;
      const pts = Array.from({ length: n + 1 }, (_, i) => { const k = i / n, xx = x - r + 2 * r * k; return [xx, y + Math.sin(k * 26 + ph) * 18 * s * Math.sin(k * Math.PI) * (1 - 0.5 * K.clamp(p))]; });
      beam(ctx, [pts], K.clamp(p * 1.6), { s, color: o.color, intensity: 1.2 });
      flare = Math.max(flare, 0.9 * Math.sin(K.clamp(p) * Math.PI));
    },

    // Y gain to zero (picture folds into a line), X gain to zero (a dot), then back out. 0.5 = a single dot.
    transition(ctx, W, H, p, o = {}) {
      const g = geom(W, H), [sx, sy, sw, sh] = g.scr, cx = sx + sw / 2, cy = sy + sh / 2;
      const cp = K.cached(`osc-tr:${W}x${H}`, () => K.layer(W, H)), x = cp.getContext('2d');
      x.clearRect(0, 0, W, H); x.drawImage(ctx.canvas, 0, 0);
      const k = p < 0.5 ? p * 2 : (1 - p) * 2; // 0 -> 1 (collapsed) -> 0
      const ys = 1 - K.ease.inOut(K.clamp(k / 0.55)), xs = 1 - K.ease.inOut(K.clamp((k - 0.45) / 0.55));
      ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
      const bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.hypot(sw, sh) / 2); bg.addColorStop(0, '#0b1a10'); bg.addColorStop(1, SCREEN_BG);
      ctx.fillStyle = bg; ctx.fillRect(sx, sy, sw, sh);
      ctx.globalCompositeOperation = 'lighter';
      const dw = Math.max(1, sw * xs), dh = Math.max(1.5, sh * ys);
      ctx.drawImage(cp, sx, sy, sw, sh, cx - dw / 2, cy - dh / 2, dw, dh);
      ctx.drawImage(cp, sx, sy, sw, sh, cx - dw / 2, cy - dh / 2, dw, dh);
      if (k > 0.3) { // the compressed trace burns hot
        const r = (8 + 30 * K.clamp(k)) * g.s, gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gr.addColorStop(0, 'rgba(255,255,255,0.95)'); gr.addColorStop(0.3, K.rgba(P31, 0.7)); gr.addColorStop(1, K.rgba(P31, 0));
        ctx.fillStyle = gr; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
        if (xs > 0.02 && ys < 0.1) { ctx.strokeStyle = K.rgba(CORE, 0.8); ctx.lineWidth = 2.5 * g.s; ctx.beginPath(); ctx.moveTo(cx - dw / 2, cy); ctx.lineTo(cx + dw / 2, cy); ctx.stroke(); }
      }
      ctx.restore();
    },
  };

  // ---------- the shared demo, written by one beam ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const g = geom(W, H), s = g.s, [sx, sy, sw, sh] = g.scr, cx = sx + sw / 2;
    if (!g.portrait) return {
      g, s, cx, title: [[cx, 320 * s], [cx, 400 * s]], tsize: 50,
      card: [80 * s, 200 * s, 170 * s, 110 * s], cardLbl: [165 * s, 170 * s],
      node: [330 * s, 330 * s, 260 * s, 150 * s], nodeTxt: 30,
      chips: PLATFORMS.map((_, i) => [665 * s, (145 + i * 77) * s]), lsize: 30,
      top: [cx, 105 * s], cnt: [cx, 330 * s], csize: 84, views: [cx, 440 * s], wave: [cx, 372 * s, 330 * s],
      take: [[cx, 555 * s, 'POST ONCE.'], [cx, 630 * s, 'REACH EVERYWHERE.']], ksize: 46,
    };
    return {
      g, s, cx, title: [[cx, H * 0.27], [cx, H * 0.33]], tsize: 42,
      card: [cx - W * 0.2, H * 0.065, W * 0.4, H * 0.08], cardLbl: [cx, H * 0.185],
      node: [cx - W * 0.3, H * 0.245, W * 0.6, H * 0.075], nodeTxt: 30,
      chips: PLATFORMS.map((_, i) => [i % 2 ? W * 0.55 : W * 0.45, H * (0.39 + Math.floor(i / 2) * 0.068)]), lsize: 28,
      top: [cx, H * 0.075], cnt: [cx, H * 0.24], csize: 62, views: [cx, H * 0.32], wave: [cx, H * 0.265, W * 0.4],
      take: [[cx, H * 0.43, 'POST ONCE.'], [cx, H * 0.49, 'REACH'], [cx, H * 0.55, 'EVERYWHERE.']], ksize: 44,
    };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, por = Lo.g.portrait;
      style.background(ctx, W, H, t);
      const [sx, sy, sw, sh] = Lo.g.scr;
      ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
      // analogue drift: the whole picture breathes by a fraction of a pixel
      const nz = K.noise(9); ctx.translate(nz.n2(t * 3, 1) * 1.2 * s, nz.n2(t * 3, 7) * 1.2 * s);
      // readouts
      style.title(ctx, 'CH1 .5V', sx + 30 * s, sy + 50 * s, 1, { size: 20, intensity: 0.6 });
      style.title(ctx, t < 8.25 ? 'X-Y' : 'Y-T', sx + sw - 30 * s, sy + sh - 30 * s, 1, { size: 20, align: 'right', intensity: 0.6 });
      // power-on: the spot blooms in the middle
      if (t < 0.5) { const k = K.beat(t, 0, 0.35), r = (4 + 40 * k) * s, cx = sx + sw / 2, cy = sy + sh / 2, gr = ctx.createRadialGradient(cx, cy, 0, cx, cy, r); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, K.rgba(P31, 0.8)); gr.addColorStop(1, K.rgba(P31, 0)); ctx.globalAlpha = 1 - K.clamp((t - 0.3) / 0.2); ctx.fillStyle = gr; ctx.fillRect(cx - r, cy - r, 2 * r, 2 * r); ctx.globalAlpha = 1; }
      if (t < 8.25) {
        // hook: written by the beam, then the beam stops refreshing it and the phosphor fades
        const fade = 1 - K.clamp((t - 2.0) / 0.5);
        if (fade > 0) {
          style.title(ctx, 'One video.', Lo.title[0][0], Lo.title[0][1], K.beat(t, 0.2, 0.5, 'lin'), { size: Lo.tsize, align: 'center', intensity: fade });
          style.title(ctx, 'Every platform.', Lo.title[1][0], Lo.title[1][1], K.beat(t, 0.65, 0.75, 'lin'), { size: Lo.tsize, align: 'center', intensity: fade });
        }
        const [vx, vy, vw, vh] = Lo.card;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.6, 'lin'));
        if (t > 2.5) beam(ctx, [[[vx + vw * 0.42, vy + vh * 0.28], [vx + vw * 0.42, vy + vh * 0.72], [vx + vw * 0.64, vy + vh * 0.5], [vx + vw * 0.42, vy + vh * 0.28]]], K.beat(t, 2.5, 0.35, 'lin'), { s });
        style.label(ctx, 'your video', Lo.cardLbl[0], Lo.cardLbl[1], K.beat(t, 2.9, 0.5, 'lin'), { size: 28, align: 'center' });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = por ? [[vx + vw / 2, H * 0.195], [nx + nw / 2, ny - 8 * s]] : [[vx + vw / 2 + 20 * s, vy + vh + 12 * s], [nx + 6 * s, ny + nh / 2 - 6 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.4, 0.6, 'lin'), { bend: por ? 0 : 0.18 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.7, 'lin'), { ring: true, phase: t * 1.6 });
        if (por) style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 15 * s, K.beat(t, 4.4, 0.6, 'lin'), { size: Lo.nodeTxt, align: 'center' });
        else { style.title(ctx, 'Creator', nx + nw / 2, ny + nh / 2 - 6 * s, K.beat(t, 4.4, 0.45, 'lin'), { size: Lo.nodeTxt, align: 'center' }); style.title(ctx, 'OS', nx + nw / 2, ny + nh / 2 + 40 * s, K.beat(t, 4.8, 0.2, 'lin'), { size: Lo.nodeTxt, align: 'center' }); }
        if (por) { const yl = Lo.chips[6][1] - 12 * s; style.arrow(ctx, [W / 2, ny + nh + 10 * s], [W / 2, yl], K.beat(t, 4.95, 0.5, 'lin'), {}); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'lin');
          if (por) {
            beam(ctx, [[[W / 2, cy - 14 * s], [left ? W * 0.465 : W * 0.535, cy - 14 * s]]], p, { s });
            style.label(ctx, name, cx, cy, K.beat(t, t0 + 0.2, 0.3, 'lin'), { size: Lo.lsize, align: left ? 'right' : 'left' });
          } else {
            style.arrow(ctx, [nx + nw + 8 * s, ny + nh / 2], [cx - 16 * s, cy - 14 * s], p, {});
            style.label(ctx, name, cx, cy, K.beat(t, t0 + 0.2, 0.3, 'lin'), { size: Lo.lsize });
          }
        });
      } else {
        style.box(ctx, Lo.top[0] - (por ? W * 0.3 : 170 * s), Lo.top[1] - (por ? 55 : 48) * s, por ? W * 0.6 : 340 * s, (por ? 110 : 96) * s, 1, { ring: true, phase: t * 1.6, intensity: 0.8 });
        style.title(ctx, 'Creator OS', Lo.top[0], Lo.top[1] + 15 * s, 1, { size: 30, align: 'center', intensity: 0.8 });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.cnt[0], Lo.cnt[1], 1, { size: Lo.csize });
        style.emphasis(ctx, Lo.wave[0], Lo.wave[1], Lo.wave[2], K.beat(t, 10.0, 0.8, 'lin'), { t });
        style.label(ctx, 'views', Lo.views[0], Lo.views[1], K.beat(t, 8.7, 0.4, 'lin'), { size: 34, align: 'center' });
        Lo.take.forEach(([x, y, txt], i) => style.title(ctx, txt, x, y, K.beat(t, 10.5 + i * 0.35, 0.55, 'lin'), { size: Lo.ksize, align: 'center' }));
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 1);
      k.play('blip', 0.05, { note: 'C5', dur: 0.15 });
      // the beam is audio: a quiet XY tone while it writes
      const write = (t, d, f = 220) => k.tone({ t, f, f2: f * 1.5, dur: d, type: 'triangle', gain: 0.035, send: 0.1, glide: 'lin' });
      write(0.2, 0.5, 196); write(0.65, 0.75, 247);
      write(2.0, 0.6, 165); k.play('blip', 2.6, { note: 'E5' }); write(2.9, 0.5, 330); k.play('blip', 3.4, { note: 'G5' });
      write(3.4, 0.6, 262); write(4.0, 0.9, 147); k.play('blip', 4.9, { note: 'C6' });
      for (let i = 0; i < 7; i++) { write(5.0 + i * 0.4, 0.45, 196 + i * 22); k.play('blip', 5.5 + i * 0.4, { note: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'][i], gain: 0.9 }); }
      k.play('click', 7.6, { pitch: 0.6, gain: 2 }); k.play('whoosh', 7.6, { dur: 0.6, up: false }); k.play('whoosh', 8.3, { dur: 0.6 }); k.play('click', 8.9, { pitch: 0.6, gain: 2 });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('riser', 9.4, { dur: 0.6, gain: 0.6 }); k.play('thud', 10.0); k.tone({ t: 10.0, f: 880, f2: 440, dur: 0.8, type: 'sine', gain: 0.06 });
      write(10.5, 0.55, 220); write(10.85, 0.55, 262); write(11.2, 0.55, 330);
      k.play('chime', 11.4, { note: 'E5' });
    },
  };
  MS.register(style);
})();
