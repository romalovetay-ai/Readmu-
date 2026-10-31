// Ukiyo-e Woodblock (Art & Design Movements). An Edo-period print: washi with fibres, a Prussian-blue bokashi sky
// fading into ochre, flat colour blocks pressed slightly off register from a carved keyblock outline, a towering wave
// with claw-like foam whose spray breaks into data cubes, a cargo boat in the trough, Fuji, paper cartouches,
// currents with foam heads for flow, vermilion seals for judgements and golden kasumi clouds between scenes.
(function () {
  const C = { washi: '#efe3c6', key: '#1c2233', prussian: '#1d3a63', mid: '#4f7aa6', pale: '#a9c3d1', foam: '#f3ead2', ochre: '#e3c98f', verm: '#c4412a', wood: '#7b4a2a', gold: '#d8b25c', snow: '#f6f1e2' };
  const SERIF = 'Noto Serif JP';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  const REG = [2.2, -1.4]; // the colour blocks land a hair off the keyblock

  function sky(W, H) {
    return K.cached(`uki-sky:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(1830);
      x.drawImage(K.paperTex(W, H, C.washi, 18, 0.05, false), 0, 0);
      // bokashi: Prussian blue wiped across the top edge, fading out into the ochre sky
      const P = H > W, hz = H * (P ? 0.5 : 0.6);
      const g = x.createLinearGradient(0, 0, 0, hz); g.addColorStop(0, 'rgba(29,58,99,0.92)'); g.addColorStop(0.22, 'rgba(79,122,166,0.45)'); g.addColorStop(0.5, 'rgba(227,201,143,0.35)'); g.addColorStop(1, 'rgba(227,201,143,0.6)');
      x.fillStyle = g; x.fillRect(0, 0, W, hz);
      // the sea: flat mid blue block with carved wave lines
      x.fillStyle = C.mid; x.fillRect(0, hz, W, H - hz);
      const sg = x.createLinearGradient(0, hz, 0, H); sg.addColorStop(0, 'rgba(169,195,209,0.5)'); sg.addColorStop(1, 'rgba(29,58,99,0.65)'); x.fillStyle = sg; x.fillRect(0, hz, W, H - hz);
      x.strokeStyle = 'rgba(243,234,210,0.55)'; x.lineWidth = 1.6 * s;
      for (let y = hz + 14 * s, i = 0; y < H; y += 16 * s * (1 + i * 0.04), i++) { x.beginPath(); for (let xx = 0; xx <= W; xx += 8 * s) x.lineTo(xx, y + Math.sin(xx * 0.03 / s + i) * 3 * s); x.stroke(); }
      x.strokeStyle = C.key; x.lineWidth = 2.2 * s; x.beginPath(); x.moveTo(0, hz); x.lineTo(W, hz); x.stroke();
      // washi fibres on top of everything printed into the sheet
      x.strokeStyle = 'rgba(255,250,235,0.18)'; x.lineWidth = 0.8 * s;
      for (let i = 0; i < 500; i++) { const a = r() * W, b = r() * H, l = r.range(6, 26) * s, ang = r() * 6.28; x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a + Math.cos(ang + 0.5) * l * 0.5, b + Math.sin(ang + 0.5) * l * 0.5, a + Math.cos(ang) * l, b + Math.sin(ang) * l); x.stroke(); }
      return c;
    });
  }
  // a wood-grain tile laid over every frame very lightly (the block's grain shows in flat colour)
  function grainTile(s) {
    return K.cached(`uki-wood:${s.toFixed(3)}`, () => {
      const w = Math.round(512 * s), h = Math.round(256 * s), c = K.layer(w, h), x = c.getContext('2d'), nz = K.noise(44);
      x.strokeStyle = 'rgba(60,35,15,1)'; x.lineWidth = 1;
      for (let i = 0; i < 70; i++) { const y0 = (i / 70) * h; x.globalAlpha = 0.25 + 0.5 * Math.abs(nz.n2(i * 0.3, 0)); x.beginPath();
        for (let xx = 0; xx <= w; xx += 6) { const yy = y0 + nz.fbm2(xx / (140 * s), i * 0.21, 3) * 22 * s; xx ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
      return c;
    });
  }

  // keyblock line: carved, so its width wavers a little along the stroke
  function key(ctx, build, w, col) { const s = sOf(ctx); ctx.save(); build(); ctx.strokeStyle = col || C.key; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = (w || 2.4) * s; ctx.stroke(); ctx.restore(); }
  function block(ctx, build, col, p) { if (p <= 0) return; const s = sOf(ctx); ctx.save(); ctx.globalAlpha = K.clamp(p * 2.5); ctx.translate(REG[0] * s, REG[1] * s); build(); ctx.fillStyle = col; ctx.fill(); ctx.restore(); }

  // ---- the great wave (unit coordinates, scaled into x, y, w, h) ----
  function wave(ctx, x, y, w, h, t, p) {
    const s = sOf(ctx), sw = Math.sin(t * 0.9) * 0.015, lean = Math.sin(t * 0.7 + 1) * 0.02;
    const P = (u, v) => [x + u * w, y + v * h];
    const body = () => { ctx.beginPath(); const pts = [[0, 1], [0.02, 0.62], [0.1, 0.32 + sw], [0.26, 0.1 + sw], [0.46, 0.04 + sw], [0.64 + lean, 0.1], [0.74 + lean, 0.26], [0.7 + lean, 0.36], [0.6 + lean, 0.3], [0.52, 0.27], [0.44, 0.34], [0.42, 0.5], [0.5, 0.74], [0.64, 1]];
      ctx.moveTo(...P(...pts[0])); for (let i = 1; i < pts.length - 1; i++) { const a = P(...pts[i]), b = P(...pts[i + 1]); ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } ctx.lineTo(...P(...pts[pts.length - 1])); ctx.closePath(); };
    const inner = () => { ctx.beginPath(); const pts = [[0.08, 1], [0.1, 0.62], [0.18, 0.36 + sw], [0.32, 0.2 + sw], [0.46, 0.15 + sw], [0.56, 0.2], [0.5, 0.3], [0.38, 0.42], [0.36, 0.62], [0.44, 1]];
      ctx.moveTo(...P(...pts[0])); for (let i = 1; i < pts.length - 1; i++) { const a = P(...pts[i]), b = P(...pts[i + 1]); ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } ctx.lineTo(...P(...pts[pts.length - 1])); ctx.closePath(); };
    const kp = K.clamp(p / 0.3), cp = K.clamp((p - 0.25) / 0.5);
    block(ctx, body, C.prussian, cp); block(ctx, inner, C.mid, K.clamp(cp * 1.4 - 0.4));
    // striations: pale lines following the wall of water
    if (cp > 0.5) { ctx.save(); body(); ctx.clip(); ctx.strokeStyle = K.rgba(C.foam, 0.6 * K.clamp((cp - 0.5) * 2)); ctx.lineWidth = 1.8 * s;
      for (let i = 0; i < 9; i++) { const k = i / 9; ctx.beginPath(); ctx.moveTo(...P(0.04 + k * 0.3, 1)); ctx.quadraticCurveTo(...P(0.02 + k * 0.32, 0.45 - k * 0.1), ...P(0.3 + k * 0.18, 0.14 + k * 0.08 + sw)); ctx.stroke(); } ctx.restore(); }
    ctx.save(); ctx.globalAlpha = kp; key(ctx, body, 2.6); ctx.restore();
    // claw foam along the crest: little curled fingers
    const fp = K.clamp((p - 0.45) / 0.4);
    if (fp > 0) {
      const crest = K.bezier(P(0.1, 0.33 + sw), P(0.24, 0.0 + sw), P(0.6 + lean, 0.0), P(0.73 + lean, 0.3), 26), n = Math.floor(crest.length * fp);
      for (let i = 2; i < n; i++) {
        const [cx, cy] = crest[i], [px, py] = crest[i - 1], ang = Math.atan2(cy - py, cx - px) - Math.PI / 2, L = (16 + (i % 3) * 5) * s * (w / (500 * s));
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang + Math.sin(t * 3 + i) * 0.08);
        ctx.beginPath(); ctx.moveTo(-L * 0.35, 0); ctx.quadraticCurveTo(-L * 0.5, -L * 1.1, L * 0.35, -L * 1.2); ctx.quadraticCurveTo(L * 0.1, -L * 0.7, L * 0.35, 0); ctx.closePath();
        ctx.fillStyle = C.foam; ctx.fill(); ctx.strokeStyle = C.key; ctx.lineWidth = 1.4 * s; ctx.stroke(); ctx.restore();
      }
    }
    // spray breaking into data cubes, tumbling off the lip
    if (p > 0.8) for (let i = 0; i < 16; i++) {
      const r = K.rng(300 + i), ph = (t * 0.25 + r()) % 1, [lx, ly] = P(0.66 + lean, 0.06);
      const cx = lx + (r.range(-0.1, 0.35) * w) * ph, cy = ly - r.range(0.05, 0.25) * h * Math.sin(ph * Math.PI) + ph * ph * h * 0.2, sz = r.range(5, 10) * s * (1 - ph * 0.4);
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(ph * 4 + i); ctx.globalAlpha = K.clamp((1 - ph) * 2) * K.clamp((p - 0.8) * 5);
      ctx.fillStyle = C.foam; ctx.fillRect(-sz / 2, -sz / 2, sz, sz); ctx.fillStyle = C.pale; ctx.fillRect(-sz / 2, -sz / 2, sz, sz * 0.35);
      ctx.strokeStyle = C.key; ctx.lineWidth = 1.1 * s; ctx.strokeRect(-sz / 2, -sz / 2, sz, sz); ctx.restore();
    }
  }
  function fuji(ctx, cx, base, w, h, p) {
    const s = sOf(ctx), body = () => { ctx.beginPath(); ctx.moveTo(cx - w / 2, base); ctx.quadraticCurveTo(cx - w * 0.2, base - h * 0.55, cx - w * 0.09, base - h); ctx.lineTo(cx + w * 0.09, base - h); ctx.quadraticCurveTo(cx + w * 0.2, base - h * 0.55, cx + w / 2, base); ctx.closePath(); };
    const snow = () => { ctx.beginPath(); ctx.moveTo(cx - w * 0.09, base - h); ctx.lineTo(cx + w * 0.09, base - h); ctx.lineTo(cx + w * 0.17, base - h * 0.68);
      for (let i = 0; i <= 6; i++) ctx.lineTo(cx + w * 0.17 - (i / 6) * w * 0.34, base - h * (0.68 + (i % 2 ? 0.1 : 0))); ctx.closePath(); };
    const cp = K.clamp((p - 0.3) / 0.5);
    block(ctx, body, C.prussian, cp);
    if (cp > 0) { ctx.save(); ctx.translate(REG[0] * s, REG[1] * s); body(); ctx.clip(); const g = ctx.createLinearGradient(0, base - h, 0, base); g.addColorStop(0, 'rgba(169,195,209,0)'); g.addColorStop(1, K.rgba(C.pale, 0.75 * cp)); ctx.fillStyle = g; ctx.fillRect(cx - w, base - h, w * 2, h); ctx.restore(); }
    block(ctx, snow, C.snow, K.clamp((p - 0.55) / 0.3));
    ctx.save(); ctx.globalAlpha = K.clamp(p / 0.3); key(ctx, body, 2.4); key(ctx, snow, 1.6); ctx.restore();
  }
  // a cargo boat with a crate bearing the play mark
  function boat(ctx, cx, cy, w, t, p) {
    const s = sOf(ctx), roll = Math.sin(t * 1.4) * 0.05, h = w * 0.2;
    ctx.save(); ctx.translate(cx, cy + Math.sin(t * 1.4 + 1) * 4 * s); ctx.rotate(roll);
    const hull = () => { ctx.beginPath(); ctx.moveTo(-w / 2, -h * 0.2); ctx.lineTo(w / 2, -h * 0.5); ctx.lineTo(w * 0.42, h * 0.45); ctx.lineTo(-w * 0.4, h * 0.45); ctx.closePath(); };
    const crate = () => { ctx.beginPath(); ctx.rect(-w * 0.26, -h * 2.2, w * 0.46, h * 1.9); };
    const cp = K.clamp((p - 0.3) / 0.5);
    block(ctx, hull, C.wood, cp); block(ctx, crate, C.ochre, cp);
    ctx.save(); ctx.globalAlpha = K.clamp(p / 0.3); key(ctx, hull, 2.2); key(ctx, crate, 2); ctx.restore();
    const tri = () => { ctx.beginPath(); ctx.moveTo(-w * 0.1, -h * 1.75); ctx.lineTo(-w * 0.1, -h * 0.75); ctx.lineTo(w * 0.1, -h * 1.25); ctx.closePath(); };
    block(ctx, tri, C.verm, K.clamp((p - 0.6) / 0.3)); ctx.save(); ctx.globalAlpha = K.clamp((p - 0.5) / 0.3); key(ctx, tri, 1.6); ctx.restore();
    ctx.restore();
  }
  // paper cartouche: cream label, double keyblock border, a pale-blue head band
  function cartouche(ctx, x, y, w, h, p, o = {}) {
    if (p <= 0) return; const s = sOf(ctx), e = K.ease.out(K.clamp(p * 1.5));
    ctx.save(); ctx.globalAlpha = K.clamp(p * 3); ctx.translate(0, (1 - e) * 10 * s);
    const r = () => { ctx.beginPath(); ctx.rect(x, y, w, h); };
    block(ctx, r, o.fill || C.foam, 1);
    if (o.band !== false) block(ctx, () => { ctx.beginPath(); ctx.rect(x, y, w, Math.min(h * 0.16, 14 * s)); }, o.band || C.pale, 1);
    key(ctx, r, 2.4); key(ctx, () => { ctx.beginPath(); ctx.rect(x + 5 * s, y + 5 * s, w - 10 * s, h - 10 * s); }, 1.1);
    ctx.restore();
  }
  function seal(ctx, x, y, size, p, chars) {
    if (p <= 0) return; const s = sOf(ctx), land = K.clamp(p / 0.3), sc = 1 + (1 - K.ease.in(land)) * 0.5;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.06); ctx.scale(sc, sc); ctx.globalAlpha = land;
    const r = K.rng(8); ctx.fillStyle = C.verm; ctx.beginPath(); ctx.roundRect(-size / 2, -size / 2, size, size, size * 0.08); ctx.fill();
    ctx.fillStyle = C.foam; ctx.font = K.font(size * (chars.length > 1 ? 0.4 : 0.66), SERIF, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    if (chars.length > 1) { ctx.fillText(chars[0], 0, -size * 0.2); ctx.fillText(chars[1], 0, size * 0.22); } else ctx.fillText(chars, 0, size * 0.04);
    ctx.strokeStyle = C.foam; ctx.lineWidth = size * 0.05; ctx.strokeRect(-size * 0.4, -size * 0.4, size * 0.8, size * 0.8);
    // uneven inking: paper shows through in specks
    for (let i = 0; i < 40; i++) { ctx.fillStyle = 'rgba(239,227,198,0.6)'; ctx.fillRect(r.range(-0.5, 0.5) * size, r.range(-0.5, 0.5) * size, r.range(1, 4) * s, r.range(1, 3) * s); }
    ctx.restore();
  }

  const style = {
    id: 'ukiyo-e', name: 'Ukiyo-e Woodblock', family: 'Art & Design Movements',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@500;700;900&display=block',
      specs: ['700 48px "Noto Serif JP"', '900 48px "Noto Serif JP"', '500 34px "Noto Serif JP"', '900 48px "Noto Serif JP"'] }],
    palette: { bg: C.washi, key: C.key, prussian: C.prussian, mid: C.mid, pale: C.pale, foam: C.foam, ochre: C.ochre, vermilion: C.verm },
    sfx: { draw: 'brush', land: 'thud', emphasis: 'stamp', transition: 'whoosh', bed: 'ocean' },
    wave, fuji, boat, cartouche, seal,

    background(ctx, W, H, t) { ctx.drawImage(sky(W, H), 0, 0); },
    finish(ctx, W, H, t) {
      const s = S(W, H);
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.09; ctx.fillStyle = ctx.createPattern(grainTile(s), 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
      K.grain(ctx, W, H, t, 0.05, 12, 'soft-light');
      K.vignette(ctx, W, H, 0.18, '#3a2a12');
    },

    // carved Mincho lettering printed in keyblock ink, characters pressed in one by one
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 52) * s;
      ctx.save(); ctx.font = K.font(size, SERIF, o.weight || 900); const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      let cx = x0; const n = text.length * K.clamp(p);
      for (let i = 0; i < text.length; i++) { const cw = ctx.measureText(text[i]).width, a = K.clamp(n - i); if (a > 0) { ctx.globalAlpha = a; ctx.fillStyle = o.color || C.key; ctx.fillText(text[i], cx, y + (1 - a) * 4 * s); } cx += cw; }
      ctx.restore(); return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 34, weight: 700, ...o }); },

    // a current: a blue band with pale streaks, ending in a curling claw-foam head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), t = o.t || 0, pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.12, 40), 4 * s, o.seed || 2, 0.02), q = K.trim(pts, K.clamp(p));
      if (q.length < 2) return null;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.translate(REG[0] * s, REG[1] * s); ctx.strokeStyle = o.color || C.prussian; ctx.lineWidth = (o.width || 12) * s; K.poly(ctx, q); ctx.stroke(); ctx.translate(-REG[0] * s, -REG[1] * s);
      ctx.strokeStyle = K.rgba(C.foam, 0.8); ctx.lineWidth = 1.5 * s; ctx.setLineDash([10 * s, 8 * s]); ctx.lineDashOffset = -t * 30 * s; K.poly(ctx, q); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = C.key; ctx.lineWidth = 1.6 * s; const off = (o.width || 12) * s * 0.5;
      for (const sg of [-1, 1]) { ctx.beginPath(); q.forEach((pt, i) => { const a = q[Math.min(q.length - 1, i + 1)], b = q[Math.max(0, i - 1)], dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1; const px = pt[0] - (dy / l) * off * sg, py = pt[1] + (dx / l) * off * sg; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }); ctx.stroke(); }
      // foam head at the leading edge
      const e = q[q.length - 1], b = q[Math.max(0, q.length - 3)], ang = Math.atan2(e[1] - b[1], e[0] - b[0]), L = (o.width || 12) * s * 1.2;
      ctx.translate(e[0], e[1]); ctx.rotate(ang);
      for (let i = 0; i < 3; i++) { ctx.save(); ctx.rotate((i - 1) * 0.6); ctx.beginPath(); ctx.moveTo(0, -L * 0.25); ctx.quadraticCurveTo(L * 1.2, -L * 0.6, L * 0.9, L * 0.2); ctx.quadraticCurveTo(L * 0.6, -L * 0.1, 0, L * 0.25); ctx.closePath(); ctx.fillStyle = C.foam; ctx.fill(); ctx.strokeStyle = C.key; ctx.lineWidth = 1.3 * s; ctx.stroke(); ctx.restore(); }
      ctx.restore(); return e;
    },
    box(ctx, x, y, w, h, p, o = {}) { return cartouche(ctx, x, y, w, h, p, o); },
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 110) * s; ctx.save(); ctx.font = K.font(size, SERIF, 900); ctx.textAlign = o.align || 'center';
      ctx.fillStyle = C.prussian; ctx.fillText(K.fmt(value), x + REG[0] * s, y + REG[1] * s); ctx.fillStyle = C.key; ctx.globalAlpha = 0.25; ctx.fillText(K.fmt(value), x, y);
      const w = ctx.measureText(K.fmt(value)).width; ctx.restore(); return { w, h: size };
    },
    // a vermilion seal stamped beside the moment: 百万 (one million) by default
    emphasis(ctx, x, y, r, p, o = {}) { seal(ctx, x, y, r, p, o.chars || '百万'); },

    // golden kasumi clouds: banded mist with rounded ends drifts across, covers, and drifts on
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), n = 7, bh = H / (n - 1.5);
      for (let i = 0; i < n; i++) {
        const dir = i % 2 ? 1 : -1, k = K.ease.inOut(p), off = (i * 0.07) % 0.2;
        const cx = W / 2 + dir * K.lerp(W * 1.4 + off * W, -W * 1.4 - off * W, k) * -1, cy = (i - 0.2) * bh, w = W * 1.25, hh = bh * 1.1;
        ctx.save(); ctx.fillStyle = C.gold; ctx.strokeStyle = C.key; ctx.lineWidth = 2 * s;
        ctx.beginPath(); ctx.moveTo(cx - w / 2 + hh / 2, cy - hh / 2); ctx.lineTo(cx + w / 2 - hh / 2, cy - hh / 2); ctx.arc(cx + w / 2 - hh / 2, cy, hh / 2, -Math.PI / 2, Math.PI / 2); ctx.lineTo(cx - w / 2 + hh / 2, cy + hh / 2); ctx.arc(cx - w / 2 + hh / 2, cy, hh / 2, Math.PI / 2, Math.PI * 1.5); ctx.closePath();
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = 'rgba(255,240,200,0.35)'; ctx.fillRect(cx - w / 2 + hh, cy - hh * 0.3, w - hh * 2, hh * 0.12);
        ctx.restore();
      }
    },
  };

  // ---------- the shared demo: one print, then a second print behind golden clouds ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, wave: [-30 * s, 150 * s, 520 * s, 600 * s], boat: [300 * s, 560 * s, 170 * s], fuji: [640 * s, 430 * s, 300 * s, 190 * s],
      title: [380 * s, 30 * s, 870 * s, 92 * s], chips: PLATFORMS.map((n, i) => [880 * s, (150 + i * 74) * s, 290 * s, 58 * s]) };
    return { s, P: true, wave: [-40 * s, H * 0.14, W * 0.72, H * 0.4], boat: [W * 0.42, H * 0.47, W * 0.26], fuji: [W * 0.78, H * 0.48, W * 0.38, H * 0.12],
      title: [W * 0.05, H * 0.03, W * 0.9, H * 0.1], chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.53 : W * 0.06, H * (0.62 + Math.floor(i / 2) * 0.085), W * 0.41, H * 0.055]) };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const scene2 = t >= 8.25;
      if (!scene2) {
        const [tx, ty, tw, th] = Lo.title;
        cartouche(ctx, tx, ty, tw, th, K.beat(t, 0.0, 0.4, 'lin'));
        if (P) { style.title(ctx, 'One video.', tx + tw / 2, ty + th * 0.47, K.beat(t, 0.2, 0.6, 'lin'), { size: 54, align: 'center' }); style.title(ctx, 'Every platform.', tx + tw / 2, ty + th * 0.86, K.beat(t, 0.8, 0.8, 'lin'), { size: 54, align: 'center' }); }
        else style.title(ctx, 'One video. Every platform.', tx + tw / 2, ty + th * 0.68, K.beat(t, 0.2, 1.4, 'lin'), { size: 50, align: 'center' });
        const [wx, wy, ww, wh] = Lo.wave; wave(ctx, wx, wy, ww, wh, t, K.beat(t, 0.4, 2.2, 'lin'));
        const [bx, by, bw] = Lo.boat; boat(ctx, bx, by, bw, t, K.beat(t, 2.0, 1.0, 'lin'));
        const lx = P ? bx - 70 * s : bx, ly = P ? by + bw * 0.42 : by + 92 * s;
        cartouche(ctx, lx - (P ? 150 : 115) * s, ly - 40 * s, (P ? 300 : 230) * s, 58 * s, K.beat(t, 2.9, 0.3, 'lin'), { band: false });
        style.label(ctx, 'your video', lx, ly + 2 * s, K.beat(t, 3.0, 0.5, 'lin'), { align: 'center' });
        const [fx, fb, fw, fh] = Lo.fuji;
        style.arrow(ctx, [bx + bw * 0.45, by - bw * 0.1], [fx - fw * 0.42, fb - fh * 0.25], K.beat(t, 3.4, 0.7, 'lin'), { t, bend: -0.25, seed: 3 });
        fuji(ctx, fx, fb, fw, fh, K.beat(t, 3.9, 0.9, 'lin'));
        const nx = P ? fx - 150 * s : fx - 150 * s, ny = fb + 16 * s;
        cartouche(ctx, nx, ny, 300 * s, 66 * s, K.beat(t, 4.5, 0.3, 'lin'));
        style.title(ctx, 'Creator OS', nx + 150 * s, ny + 50 * s, K.beat(t, 4.6, 0.4, 'lin'), { size: 40, align: 'center' });
        const hub = P ? [fx - 20 * s, ny + 66 * s] : [fx + fw * 0.38, fb - fh * 0.2];
        if (P) style.arrow(ctx, hub, [W / 2, Lo.chips[6][1] + 10 * s], K.beat(t, 4.95, 0.5, 'lin'), { t, bend: 0.06, width: 9, seed: 9 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy, cw, ch] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.35, 'lin');
          if (P) style.arrow(ctx, [W / 2, cy + ch / 2], [left ? cx + cw + 6 * s : cx - 6 * s, cy + ch / 2], p, { t, bend: 0, width: 7, seed: 20 + i });
          else style.arrow(ctx, hub, [cx - 10 * s, cy + ch / 2], p, { t, bend: (i - 3) * 0.04, width: 8, seed: 20 + i });
          const lp = K.beat(t, t0 + 0.25, 0.3, 'lin');
          cartouche(ctx, cx, cy, cw, ch, lp, { band: i % 2 ? C.ochre : C.pale });
          style.label(ctx, name, cx + cw / 2, cy + ch * 0.72, lp, { align: 'center', size: P ? 36 : 32 });
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        // second print: Fuji at the head, the tally in a cartouche, the seal, the takeaway
        const fx = W / 2, fb = P ? H * 0.2 : 170 * s, fw = P ? W * 0.42 : 240 * s, fh = P ? H * 0.11 : 120 * s;
        fuji(ctx, fx, fb, fw, fh, 1);
        cartouche(ctx, fx - 140 * s, fb + 10 * s, 280 * s, 60 * s, 1);
        style.title(ctx, 'Creator OS', fx, fb + 52 * s, 1, { size: 38, align: 'center' });
        wave(ctx, P ? -60 * s : -40 * s, P ? H * 0.72 : 470 * s, P ? W * 0.5 : 300 * s, P ? H * 0.3 : 260 * s, t, 1);
        const cy = P ? H * 0.45 : 400 * s, cw = P ? W * 0.84 : 640 * s, ch = P ? 230 * s : 190 * s;
        cartouche(ctx, W / 2 - cw / 2, cy - ch * 0.62, cw, ch, K.beat(t, 8.3, 0.3, 'lin'));
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t > 8.5) style.counter(ctx, Math.round(v / 1000) * 1000, W / 2, cy + 6 * s, 1, { size: P ? 86 : 104 });
        style.label(ctx, 'views', W / 2, cy + ch * 0.3, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 36 });
        style.emphasis(ctx, P ? W / 2 - cw / 2 + 50 * s : W / 2 + cw / 2 + 20 * s, cy - ch * 0.62 - (P ? 30 : 12) * s, (P ? 96 : 92) * s, K.beat(t, 10.0, 0.5, 'lin'), {});
        const ty = P ? H * 0.66 : 620 * s, tw = P ? W * 0.84 : 760 * s, th = P ? 170 * s : 76 * s, tp = K.beat(t, 10.5, 0.9, 'lin');
        cartouche(ctx, W / 2 - tw / 2, P ? ty - 100 * s : ty - th * 0.66, tw, P ? 205 * s : th, K.beat(t, 10.4, 0.3, 'lin'), { band: C.ochre });
        if (P) { style.title(ctx, 'Post once.', W / 2, ty - 10 * s, K.clamp(tp * 2), { size: 54, align: 'center' }); style.title(ctx, 'Reach everywhere.', W / 2, ty + 62 * s, K.clamp(tp * 2 - 1), { size: 54, align: 'center' }); }
        else style.title(ctx, 'Post once. Reach everywhere.', W / 2, ty + 14 * s, tp, { size: 46, align: 'center' });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      // the artist's vertical signature cartouche + seal in the corner
      const sx = W - (P ? 70 : 52) * s, sy = (P ? H * 0.16 : 150 * s);
      ctx.save(); ctx.fillStyle = C.foam; ctx.fillRect(sx - 20 * s, sy, 40 * s, 140 * s); ctx.strokeStyle = C.key; ctx.lineWidth = 1.6 * s; ctx.strokeRect(sx - 20 * s, sy, 40 * s, 140 * s);
      ctx.font = K.font(28 * s, SERIF, 700); ctx.fillStyle = C.key; ctx.textAlign = 'center'; ['動', '画', '百', '景'].forEach((c, i) => ctx.fillText(c, sx, sy + 32 * s + i * 32 * s)); ctx.restore();
      seal(ctx, sx, sy + 168 * s, 36 * s, 1, '創');
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('ocean', 0, 12, 1.2);
      k.play('thud', 0.05, { gain: 0.5 }); k.play('scribble', 0.4, { medium: 'brush', dur: 2.0, gain: 0.8 }); k.play('pluck', 0.2, { note: 'D4' }); k.play('pluck', 0.6, { note: 'A4' });
      k.play('whoosh', 1.2, { dur: 1.0 }); k.play('thud', 2.05, { gain: 0.4 }); k.play('scribble', 2.2, { medium: 'brush', dur: 0.8 }); k.play('pluck', 2.95, { note: 'E5' });
      k.play('whoosh', 3.4, { dur: 0.7, gain: 0.7 }); k.play('thud', 3.95, { gain: 0.5 }); k.play('scribble', 4.1, { medium: 'brush', dur: 0.7 }); k.play('pluck', 4.6, { note: 'D5' });
      const notes = ['D5', 'E5', 'G5', 'A5', 'B5', 'D6', 'E6'];
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.25, gain: 0.4 }); k.play('pluck', 5.3 + i * 0.4, { note: notes[i], gain: 0.7 }); }
      k.play('whoosh', 7.6, { dur: 1.2, gain: 0.8 }); k.play('swell', 7.7, { chord: ['D4', 'A4', 'E5'], dur: 1.4, gain: 0.7 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.15); k.play('thud', 10.15, { gain: 0.5 });
      k.play('scribble', 10.5, { medium: 'brush', dur: 0.9, gain: 0.6 }); k.play('chime', 11.3, { note: 'A5' });
    },
  };
  MS.register(style);
})();
