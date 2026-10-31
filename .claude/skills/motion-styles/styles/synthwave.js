// Synthwave Outrun (Retro UI & Neon). An 80s outrun poster: a neon grid highway racing to a striped sunset, wireframe
// vector mountains, chrome-bevelled italic lettering (extruded, sky-to-sunset gradient with a hard horizon line inside
// the letters and sweeping glints), a hot-pink neon script that flickers on, all bathed in bloom, faint scanlines and
// grain. The camera tilts up into the sky between beats; the cover transition is a sweep of sun-stripe neon bars.
(function () {
  const PINK = '#ff3ea5', CYAN = '#3ef0ff', PURP = '#7a2cff', GOLD = '#ffcf4a', SKY0 = '#0a0420', SKY1 = '#2a0a52', SKY2 = '#7a1a7a';
  const CHROME = 'Orbitron', SCRIPT = 'Yellowtail';
  const S = (ctx) => K.layout(ctx.canvas.width, ctx.canvas.height).s;

  // ---------- lettering ----------
  function chrome(ctx0, text, x, y, size, o = {}) {
    const p = o.p ?? 1; if (p <= 0) return 0;
    const W = ctx0.canvas.width, H = ctx0.canvas.height, L = K.cached(`sw-chr:${W}x${H}`, () => K.layer(W, H)), ctx = L.getContext('2d');
    ctx.clearRect(0, Math.max(0, y - size * 1.6), W, size * 2.4);
    ctx.save(); ctx.font = `900 ${size}px "${CHROME}"`; const w = ctx.measureText(text).width;
    const x0 = o.align === 'center' ? -w / 2 : o.align === 'right' ? -w : 0, k = K.ease.back(K.clamp(p)), sc = 1 + (1 - K.clamp(p)) * 0.6;
    ctx.translate(x, y); ctx.scale(sc, sc); ctx.transform(1, 0, -0.2, 1, 0, 0); ctx.globalAlpha = K.clamp(p * 2);
    // extrusion
    for (let i = 7; i >= 1; i--) { ctx.fillStyle = i > 5 ? '#12031f' : '#3a0d5a'; ctx.fillText(text, x0 + i * size * 0.012, i * size * 0.012); }
    ctx.lineJoin = 'round'; ctx.strokeStyle = '#1a0630'; ctx.lineWidth = size * 0.07; ctx.strokeText(text, x0, 0);
    const g = ctx.createLinearGradient(0, -size * 0.74, 0, 0);
    g.addColorStop(0, '#e9f8ff'); g.addColorStop(0.25, '#7ec8ff'); g.addColorStop(0.5, '#ffffff'); g.addColorStop(0.52, '#3a1a3a'); g.addColorStop(0.6, '#8a3a6a'); g.addColorStop(0.8, '#ff9a4a'); g.addColorStop(1, '#ffe6a8');
    ctx.fillStyle = g; ctx.fillText(text, x0, 0);
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(1, size * 0.012); ctx.strokeText(text, x0, 0);
    if (o.t != null) { // a glint sweeping across the chrome, only on the letters
      const gx = x0 + ((o.t * 0.45 + (o.seed || 0)) % 1.6 - 0.3) * w;
      ctx.globalCompositeOperation = 'source-atop';
      const sh = ctx.createLinearGradient(gx - size * 0.3, 0, gx + size * 0.3, 0); sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.5, 'rgba(255,255,255,0.45)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = sh; ctx.fillRect(gx - size * 0.3, -size * 1.2, size * 0.6, size * 1.5);
    }
    ctx.restore();
    ctx0.drawImage(L, 0, Math.max(0, y - size * 1.6), W, size * 2.4, 0, Math.max(0, y - size * 1.6), W, size * 2.4);
    return w;
  }
  // neon tube: wide soft glow, saturated tube, hot white core; flickers on with p
  function neonOn(p, seed = 1) { if (p <= 0) return 0; if (p >= 1) return 1; const r = K.rng(seed + Math.floor(p * 14)); return r() < p * 1.2 ? 0.4 + 0.6 * p : 0.08; }
  function neonText(ctx, text, x, y, size, o = {}) {
    const a = neonOn(o.p ?? 1, o.seed || 3); if (!a) return 0;
    ctx.save(); ctx.font = `${o.font || `400 ${size}px "${SCRIPT}"`}`; ctx.textAlign = o.align || 'left'; ctx.lineJoin = 'round'; ctx.globalAlpha = a;
    const col = o.color || PINK;
    ctx.strokeStyle = K.rgba(col, 0.25); ctx.lineWidth = size * 0.16; ctx.strokeText(text, x, y);
    ctx.strokeStyle = K.rgba(col, 0.9); ctx.lineWidth = size * 0.06; ctx.strokeText(text, x, y);
    ctx.fillStyle = K.mix(col, '#ffffff', 0.65).length ? K.rgba(K.mix(col, '#ffffff', 0.7), 1) : '#fff'; ctx.fillText(text, x, y);
    const w = ctx.measureText(text).width; ctx.restore(); return w;
  }
  function neonPath(ctx, pts, p, col, s, a = 1) {
    const q = K.trim(pts, K.clamp(p)); if (q.length < 2) return null;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.globalAlpha = a;
    ctx.strokeStyle = K.rgba(col, 0.22); ctx.lineWidth = 14 * s; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = col; ctx.lineWidth = 5 * s; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = K.rgba(K.mix(col, '#ffffff', 0.75), 1); ctx.lineWidth = 1.8 * s; K.poly(ctx, q); ctx.stroke();
    ctx.restore(); return q[q.length - 1];
  }

  // ---------- the world ----------
  function skyLayer(W, H) {
    return K.cached(`sw-sky:${W}x${H}`, () => {
      const c = K.layer(W, H * 2), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, H * 2);
      g.addColorStop(0, '#05010f'); g.addColorStop(0.45, SKY0); g.addColorStop(0.7, SKY1); g.addColorStop(0.88, '#5a1470'); g.addColorStop(1, '#d83a8a');
      x.fillStyle = g; x.fillRect(0, 0, W, H * 2);
      const r = K.rng(42); for (let i = 0; i < 260; i++) { const y = r() * H * 1.6; x.fillStyle = `rgba(255,255,255,${0.2 + r() * 0.6})`; const z = r() < 0.08 ? 2.2 : 1.2; x.fillRect(r() * W, y, z, z); }
      return c;
    });
  }
  function mountainLayer(W, H, s) {
    return K.cached(`sw-mtn:${W}x${H}`, () => {
      const mh = 230 * s, c = K.layer(W, mh + 4), x = c.getContext('2d'), n = K.noise(17), cols = 46, rows = 7;
      const hgt = (u) => { const side = Math.abs(u - 0.5) * 2; return mh * K.clamp(Math.pow(side, 1.6) * 1.15) * (0.55 + 0.45 * Math.abs(n.fbm2(u * 6, 1.3, 4)) * 2.2); };
      const P = []; for (let j = 0; j <= rows; j++) { const row = []; for (let i = 0; i <= cols; i++) { const u = i / cols, h = hgt(u) * (1 - j / rows) + n.n2(u * 20, j) * 6 * s * (1 - j / rows); row.push([u * W + n.n2(i, j * 3) * 6 * s, mh - h * (1 - j / rows * 0.15) + (j / rows) * 0]); } P.push(row); }
      // fill the silhouette dark, then the wireframe
      x.fillStyle = '#12052a'; x.beginPath(); x.moveTo(0, mh); P[0].forEach((p) => x.lineTo(p[0], p[1])); x.lineTo(W, mh); x.fill();
      x.strokeStyle = 'rgba(190,90,255,0.75)'; x.lineWidth = 1.3 * s;
      for (let j = 0; j <= rows; j++) { const row = P[j].map(([px, py]) => [px, K.lerp(py, mh, j / rows)]); K.poly(x, row); x.stroke(); }
      for (let i = 0; i <= cols; i++) { x.beginPath(); x.moveTo(P[0][i][0], P[0][i][1]); x.lineTo(P[0][i][0] + (i / cols - 0.5) * 30 * s, mh); x.stroke(); }
      x.strokeStyle = 'rgba(255,120,255,0.9)'; x.lineWidth = 2 * s; K.poly(x, P[0]); x.stroke();
      return c;
    });
  }
  function world(ctx, W, H, t, hz, s) {
    // sky (slides with the horizon so a tilt-up reads as camera motion)
    ctx.drawImage(skyLayer(W, H), 0, hz - H * 2 + H * 0.05, W, H * 2);
    // striped sun
    const por = H > W, sr = (por ? 260 : 170) * s, sx = W / 2, sy = hz - sr * 0.28;
    ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.283); ctx.clip();
    const sg = ctx.createLinearGradient(0, sy - sr, 0, sy + sr); sg.addColorStop(0, '#ffe96a'); sg.addColorStop(0.5, '#ff9a3a'); sg.addColorStop(1, '#ff2a8a');
    ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, sr * 2, sr * 2);
    ctx.fillStyle = SKY2; for (let i = 0; i < 8; i++) { const yy = sy - sr * 0.3 + i * sr * 0.1, hh = sr * (0.012 + i * 0.01); ctx.fillRect(sx - sr, yy, sr * 2, hh); }
    ctx.restore();
    const halo = ctx.createRadialGradient(sx, sy, sr * 0.8, sx, sy, sr * 2); halo.addColorStop(0, 'rgba(255,90,160,0.35)'); halo.addColorStop(1, 'rgba(255,90,160,0)'); ctx.fillStyle = halo; ctx.fillRect(sx - sr * 2, sy - sr * 2, sr * 4, sr * 4);
    // wireframe mountains
    const m = mountainLayer(W, H, s); ctx.drawImage(m, 0, hz - m.height + 2);
    // floor: dark plane, perspective grid racing toward camera, the highway
    const fg = ctx.createLinearGradient(0, hz, 0, H); fg.addColorStop(0, '#2a0838'); fg.addColorStop(1, '#090014'); ctx.fillStyle = fg; ctx.fillRect(0, hz, W, H - hz);
    ctx.save(); ctx.beginPath(); ctx.rect(0, hz, W, H - hz); ctx.clip();
    const vx = W / 2, depth = H - hz;
    ctx.lineWidth = 2 * s;
    for (let i = 0; i < 14; i++) { const z = ((i + (t * 2.2) % 1) / 14), yy = hz + depth * Math.pow(z, 2.2) * 1.05; ctx.strokeStyle = `rgba(255,62,165,${0.25 + 0.6 * z})`; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    for (let i = -16; i <= 16; i++) { ctx.strokeStyle = 'rgba(255,62,165,0.6)'; ctx.beginPath(); ctx.moveTo(vx + i * 26 * s, hz); ctx.lineTo(vx + i * W * 0.22, H + depth * 0.5); ctx.stroke(); }
    // road
    const rw = W * (por ? 0.5 : 0.36); ctx.fillStyle = '#1a0628'; ctx.beginPath(); ctx.moveTo(vx - 6 * s, hz); ctx.lineTo(vx + 6 * s, hz); ctx.lineTo(vx + rw, H); ctx.lineTo(vx - rw, H); ctx.fill();
    for (const sg2 of [-1, 1]) neonPath(ctx, [[vx + sg2 * 6 * s, hz], [vx + sg2 * rw, H]], 1, CYAN, s * 0.7, 0.9);
    for (let i = 0; i < 7; i++) { const z = ((i + (t * 2.2) % 1) / 7), y0 = hz + depth * Math.pow(z, 2.2), y1 = hz + depth * Math.pow(z + 0.05, 2.2); ctx.fillStyle = `rgba(255,240,220,${0.4 + 0.6 * z})`; ctx.fillRect(vx - (1 + z * 5) * s, y0, (2 + z * 10) * s, y1 - y0); }
    ctx.restore();
    // horizon glow line
    const hg = ctx.createLinearGradient(0, hz - 6 * s, 0, hz + 10 * s); hg.addColorStop(0, 'rgba(255,120,220,0)'); hg.addColorStop(0.5, 'rgba(255,200,240,0.9)'); hg.addColorStop(1, 'rgba(255,120,220,0)');
    ctx.fillStyle = hg; ctx.fillRect(0, hz - 6 * s, W, 16 * s);
  }

  const style = {
    id: 'synthwave', name: 'Synthwave Outrun', family: 'Retro UI & Neon',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Orbitron:wght@700;900&family=Yellowtail&display=block', specs: ['900 80px "Orbitron"', '700 30px "Orbitron"', '400 60px "Yellowtail"'] }],
    palette: { bg: SKY0, pink: PINK, cyan: CYAN, purple: PURP, gold: GOLD, sky: SKY1, horizon: SKY2 },
    sfx: { draw: null, land: 'pluck', emphasis: 'riser', transition: 'whoosh', bed: 'space' },
    chrome, neonText, neonPath, world,

    background(ctx, W, H, t) { const L = K.layout(W, H); world(ctx, W, H, t, L.portrait ? H * 0.62 : H * 0.6, L.s); },
    finish(ctx, W, H, t) {
      const d = 4, w = Math.ceil(W / d), h = Math.ceil(H / d), a = K.cached(`sw-ba:${W}x${H}`, () => K.layer(w, h)), b = K.cached(`sw-bb:${W}x${H}`, () => K.layer(w, h));
      const ax = a.getContext('2d'), bx = b.getContext('2d'); ax.clearRect(0, 0, w, h); ax.drawImage(ctx.canvas, 0, 0, w, h);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      bx.clearRect(0, 0, w, h); bx.filter = 'blur(3px) brightness(0.9)'; bx.drawImage(a, 0, 0); bx.filter = 'none'; ctx.globalAlpha = 0.3; ctx.drawImage(b, 0, 0, W, H);
      bx.clearRect(0, 0, w, h); bx.filter = 'blur(12px)'; bx.drawImage(a, 0, 0); bx.filter = 'none'; ctx.globalAlpha = 0.28; ctx.drawImage(b, 0, 0, W, H);
      ctx.restore();
      const sl = K.cached(`sw-sl:${W}x${H}`, () => { const c = K.layer(W, H), x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1); return c; });
      ctx.drawImage(sl, 0, 0); K.vignette(ctx, W, H, 0.45, '#05010f'); K.grain(ctx, W, H, t, 0.05, 24, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) { const s = S(ctx), size = (o.size || 84) * s; return { w: chrome(ctx, text, x, y, size, { ...o, p }), h: size }; },
    label(ctx, text, x, y, p, o = {}) {
      const s = S(ctx), size = (o.size || 30) * s;
      if (o.script) return { w: neonText(ctx, text, x, y, size * 1.6, { p, align: o.align, color: o.color, seed: o.seed }), h: size };
      return { w: neonText(ctx, text, x, y, size, { p, align: o.align, color: o.color || CYAN, seed: o.seed, font: `700 ${size}px "${CHROME}"` }), h: size };
    },
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx), pts = K.arcPts(from, to, o.bend ?? 0, 24), e = neonPath(ctx, pts, p, o.color || PINK, s);
      if (p >= 1) { const b = pts[pts.length - 1], a = pts[pts.length - 3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 16 * s; neonPath(ctx, [[b[0] - Math.cos(ang - 0.55) * L, b[1] - Math.sin(ang - 0.55) * L], b, [b[0] - Math.cos(ang + 0.55) * L, b[1] - Math.sin(ang + 0.55) * L]], 1, o.color || PINK, s); }
      return e;
    },
    // a dark glass panel outlined in neon tube that traces itself on
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return; const s = S(ctx), r = 14 * s;
      ctx.save(); ctx.globalAlpha = K.clamp(p * 2) * 0.85; ctx.fillStyle = 'rgba(14,4,30,0.85)'; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill(); ctx.restore();
      const pts = []; const seg = (a, b) => { for (let i = 0; i <= 10; i++) pts.push([K.lerp(a[0], b[0], i / 10), K.lerp(a[1], b[1], i / 10)]); };
      seg([x + r, y], [x + w - r, y]); seg([x + w, y + r], [x + w, y + h - r]); seg([x + w - r, y + h], [x + r, y + h]); seg([x, y + h - r], [x, y + r]); pts.push([x + r, y]);
      neonPath(ctx, pts, p, o.color || CYAN, s);
    },
    counter(ctx, value, x, y, p, o = {}) { const s = S(ctx), size = (o.size || 120) * s; return { w: chrome(ctx, K.fmt(value), x, y, size, { align: o.align || 'center', t: o.t, seed: 0.3 }), h: size }; },
    // lens flare: four-point star burst + horizontal streak over the key number
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return; const s = S(ctx), k = Math.sin(K.clamp(p) * Math.PI), R = r * (0.4 + 0.6 * K.clamp(p));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, R * 0.5); g.addColorStop(0, `rgba(255,255,255,${0.9 * k})`); g.addColorStop(0.3, `rgba(255,120,220,${0.5 * k})`); g.addColorStop(1, 'rgba(255,60,160,0)'); ctx.fillStyle = g; ctx.fillRect(x - R, y - R, R * 2, R * 2);
      const st = ctx.createLinearGradient(x - R * 1.6, 0, x + R * 1.6, 0); st.addColorStop(0, 'rgba(62,240,255,0)'); st.addColorStop(0.5, `rgba(220,250,255,${0.9 * k})`); st.addColorStop(1, 'rgba(62,240,255,0)'); ctx.fillStyle = st; ctx.fillRect(x - R * 1.6, y - 3 * s, R * 3.2, 6 * s);
      ctx.fillStyle = `rgba(255,255,255,${k})`; ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * 6.283, rr = i % 2 ? R * 0.06 : R * 0.45; ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } ctx.fill();
      ctx.restore();
    },
    // sun-stripe bars sweep in from top and bottom to cover (0.5), then part
    transition(ctx, W, H, p, o = {}) {
      const k = p < 0.5 ? K.ease.inOut(p * 2) : K.ease.inOut((1 - p) * 2), n = 10, bh = H / n;
      for (let i = 0; i < n; i++) { const top = i < n / 2, d = top ? i : n - 1 - i, f = K.clamp(k * 1.4 - d * 0.08); if (f <= 0) continue; const hh = bh * f; ctx.fillStyle = i % 2 ? '#2a0a52' : '#3a0c62'; ctx.fillRect(0, i * bh + (bh - hh) / 2, W, hh); ctx.fillStyle = 'rgba(255,62,165,0.8)'; ctx.fillRect(0, i * bh + (bh - hh) / 2, W, Math.max(1, 2 * S(ctx))); }
    },
  };

  // ---------- the shared demo as a night drive ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const NEON = [PINK, CYAN, GOLD, CYAN, PINK, GOLD, CYAN];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, por: false, hz1: H * 0.66, hz2: H * 0.93, hook: [W / 2, 220 * s], hsize: 104, hscript: [W / 2 + 60 * s, 315 * s],
      card: [90 * s, 110 * s, 230 * s, 130 * s], cardLbl: [205 * s, 290 * s], node: [470 * s, 125 * s, 290 * s, 100 * s],
      chips: PLATFORMS.map((_, i) => [880 * s, (66 + i * 56) * s]), lsize: 33,
      top: [W / 2 - 150 * s, 30 * s, 300 * s, 70 * s], cnt: [W / 2, 300 * s], csize: 124, views: [W / 2, 385 * s], take: [W / 2, 520 * s], tscript: [W / 2, 610 * s] };
    return { s, por: true, hz1: H * 0.66, hz2: H * 0.86, hook: [W / 2, H * 0.2], hsize: 74, hscript: [W / 2, H * 0.27],
      card: [W / 2 - 170 * s, H * 0.06, 340 * s, 120 * s], cardLbl: [W / 2, H * 0.185], node: [W / 2 - 220 * s, H * 0.215, 440 * s, 90 * s],
      chips: PLATFORMS.map((_, i) => [i % 2 ? W * 0.54 : W * 0.46, H * (0.33 + Math.floor(i / 2) * 0.05)]), lsize: 27,
      top: [W / 2 - 200 * s, H * 0.05, 400 * s, 80 * s], cnt: [W / 2, H * 0.26], csize: 84, views: [W / 2, H * 0.31], take: [W / 2, H * 0.47], tscript: [W / 2, H * 0.535] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, por = Lo.por;
      // camera: tilts up into the sky across the transition (the horizon drops)
      const tilt = K.beat(t, 7.7, 1.1, 'inOut'), hz = K.lerp(Lo.hz1, Lo.hz2, tilt), dy = (hz - Lo.hz1);
      world(ctx, W, H, t, hz, s);
      if (t < 8.25) {
        ctx.save(); ctx.translate(0, dy * 1.4);
        if (t < 2.1) {
          style.title(ctx, por ? 'ONE VIDEO.' : 'ONE VIDEO.', Lo.hook[0], Lo.hook[1], K.beat(t, 0.2, 0.45, 'out'), { size: Lo.hsize, align: 'center', t });
          style.label(ctx, 'Every platform.', Lo.hscript[0], Lo.hscript[1], K.beat(t, 0.8, 0.6, 'lin'), { size: por ? 44 : 48, script: true, align: 'center', seed: 5 });
          if (t > 0.6) { const ulp = K.beat(t, 1.1, 0.4, 'lin'), x0 = Lo.hscript[0] - (por ? 220 : 220) * s; neonPath(ctx, [[x0, Lo.hscript[1] + 18 * s], [x0 + 440 * s, Lo.hscript[1] + 6 * s]], ulp, PINK, s * 0.7); }
        } else {
          const [vx, vy, vw, vh] = Lo.card;
          style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.6, 'lin'), { color: PINK });
          if (t > 2.4) { ctx.save(); ctx.globalAlpha = neonOn(K.beat(t, 2.4, 0.3, 'lin'), 9); ctx.fillStyle = '#fff'; ctx.shadowColor = PINK; ctx.shadowBlur = 16 * s; ctx.beginPath(); ctx.moveTo(vx + vw * 0.42, vy + vh * 0.28); ctx.lineTo(vx + vw * 0.42, vy + vh * 0.72); ctx.lineTo(vx + vw * 0.62, vy + vh * 0.5); ctx.fill(); ctx.restore(); }
          style.label(ctx, 'your video', Lo.cardLbl[0], Lo.cardLbl[1], K.beat(t, 2.7, 0.4, 'lin'), { size: 34, script: true, align: 'center', seed: 11 });
          const [nx, ny, nw, nh] = Lo.node;
          if (por) style.arrow(ctx, [W / 2, Lo.cardLbl[1] + 20 * s], [W / 2, ny - 12 * s], K.beat(t, 3.3, 0.5, 'lin'));
          else style.arrow(ctx, [vx + vw + 14 * s, vy + vh / 2], [nx - 14 * s, ny + nh / 2], K.beat(t, 3.3, 0.5, 'lin'));
          style.box(ctx, nx, ny, nw, nh, K.beat(t, 3.9, 0.5, 'lin'));
          if (t > 4.3) chrome(ctx, 'CREATOR OS', nx + nw / 2, ny + nh / 2 + 14 * s, 36 * s, { align: 'center', p: K.beat(t, 4.3, 0.35), t, seed: 0.6 });
          if (por && t > 4.9) neonPath(ctx, [[W / 2, ny + nh + 10 * s], [W / 2, Lo.chips[6][1] - 10 * s]], K.beat(t, 4.9, 0.6, 'lin'), CYAN, s * 0.7);
          PLATFORMS.forEach((name, i) => {
            const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], p = K.beat(t, t0, 0.3, 'lin'), left = i % 2 === 0;
            if (por) neonPath(ctx, [[W / 2, cy - 10 * s], [left ? W * 0.475 : W * 0.525, cy - 10 * s]], p, NEON[i], s * 0.7);
            else style.arrow(ctx, [nx + nw + 12 * s, ny + nh / 2], [cx - 16 * s, cy - 10 * s], p, { color: NEON[i], bend: 0.05 });
            style.label(ctx, name.toUpperCase(), cx, cy, K.beat(t, t0 + 0.2, 0.35, 'lin'), { size: Lo.lsize, color: NEON[i], seed: 20 + i, align: por ? (left ? 'right' : 'left') : 'left' });
          });
        }
        ctx.restore();
      } else {
        const [tx, ty, tw, th] = Lo.top; style.box(ctx, tx, ty, tw, th, 1);
        chrome(ctx, 'CREATOR OS', tx + tw / 2, ty + th / 2 + 14 * s, 38 * s, { align: 'center', t, seed: 0.6 });
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        style.counter(ctx, v, Lo.cnt[0], Lo.cnt[1], 1, { size: Lo.csize, t });
        style.label(ctx, 'views', Lo.views[0], Lo.views[1], K.beat(t, 8.7, 0.4, 'lin'), { size: 34, script: true, align: 'center', seed: 31 });
        style.emphasis(ctx, Lo.cnt[0] + (por ? 250 : 330) * s, Lo.cnt[1] - Lo.csize * 0.55 * s, 300 * s, K.beat(t, 10.0, 0.7, 'lin'));
        style.title(ctx, 'POST ONCE.', Lo.take[0], Lo.take[1], K.beat(t, 10.45, 0.4, 'out'), { size: por ? 66 : 96, align: 'center', t });
        style.label(ctx, 'Reach everywhere.', Lo.tscript[0], Lo.tscript[1], K.beat(t, 10.8, 0.5, 'lin'), { size: por ? 40 : 46, script: true, align: 'center', seed: 41 });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('space', 0, 12, 1);
      k.play('swell', 0.0, { dur: 3, chord: ['A2', 'E3', 'C4'], gain: 1.2 });
      k.play('thud', 0.2); k.play('whoosh', 0.1, { dur: 0.3 }); k.play('glitch', 0.8, { gain: 0.4 }); k.play('pluck', 1.1, { note: 'E5' });
      k.play('pluck', 2.0, { note: 'A4' }); k.play('click', 2.4, { gain: 1.5 }); k.play('pluck', 2.7, { note: 'C5', gain: 0.7 });
      k.play('whoosh', 3.3, { dur: 0.5 }); k.play('pluck', 3.9, { note: 'E5' }); k.play('stamp', 4.3, { gain: 0.6 });
      const n = ['A5', 'C6', 'E6', 'A5', 'D6', 'E6', 'G6'];
      for (let i = 0; i < 7; i++) { k.play('click', 5.2 + i * 0.4, { gain: 1.2 }); k.play('pluck', 5.25 + i * 0.4, { note: n[i], gain: 0.8 }); }
      k.play('swell', 7.6, { dur: 1.6, chord: ['F3', 'A3', 'C4'] }); k.play('whoosh', 7.7, { dur: 1.0 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('riser', 9.4, { dur: 0.6 }); k.play('thud', 10.0); k.play('ding', 10.0, { gain: 0.6 });
      k.play('stamp', 10.5, { gain: 0.7 }); k.play('glitch', 10.8, { gain: 0.3 });
      k.play('chime', 11.3, { note: 'A5' }); k.play('swell', 11.0, { dur: 1.0, chord: ['A3', 'C4', 'E4'] });
    },
  };
  MS.register(style);
})();
