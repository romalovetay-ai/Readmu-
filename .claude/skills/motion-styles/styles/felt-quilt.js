// Felt & Patchwork (Paper & Craft). A cosy patchwork quilt of cotton prints with puffy quilted squares and sunk
// seams, topped with fuzzy felt appliqué edged in blanket stitch, buttons sewn on with thread crosses, arrows and
// rings sewn stitch by stitch in running stitch, woven name tags, felt digits, and the quilt itself panning past as
// the scene change. The padding breathes slowly.
(function () {
  const C = { navy: '#2b3a5c', red: '#c8473d', mustard: '#d9a53a', sage: '#7fa37a', rose: '#d98b8b', denim: '#5b7aa6', cream: '#f4ead6', thread: '#f7f0e0', ink: '#2a2a35', teal: '#3f9c94' };
  const FABRIC = ['#d9a0a0', '#9fb79a', '#e3c27a', '#8fa6c9', '#e8dcc4', '#c99a7f', '#a7c1bd'];
  const FONT = 'Fredoka';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // felt: dense matted fibres, a pattern per colour
  function felt(ctx, col) {
    const tile = K.cached(`fq-felt:${col}`, () => {
      const n = 200, c = K.layer(n, n), x = c.getContext('2d'), r = K.rng(col);
      x.fillStyle = col; x.fillRect(0, 0, n, n);
      for (let i = 0; i < 1800; i++) { const px = r() * n, py = r() * n, a = r() * 6.3, l = 2 + r() * 5; x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.13)' : 'rgba(0,0,0,0.12)'; x.lineWidth = 0.7; x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
      return c;
    });
    return ctx.createPattern(tile, 'repeat');
  }
  // fuzzy felt edge: the shape filled, then a halo of tiny fibres sticking out of the cut
  function feltShape(ctx, path, col, s, o = {}) {
    ctx.save(); ctx.shadowColor = 'rgba(40,25,15,0.35)'; ctx.shadowBlur = (o.lift || 8) * s; ctx.shadowOffsetX = 2 * s; ctx.shadowOffsetY = (o.lift || 8) * 0.6 * s;
    ctx.fillStyle = col; path(ctx); ctx.fill(); ctx.restore();
    ctx.save(); ctx.fillStyle = felt(ctx, col); path(ctx); ctx.fill();
    ctx.lineWidth = 2.2 * s; ctx.strokeStyle = K.rgba(K.mix(col, '#ffffff', 0.25), 0.5); ctx.setLineDash([1.2 * s, 2 * s]); path(ctx); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }
  // arc-length sampler over a polyline: at(d) -> [x, y, dx, dy] (unit tangent); avoids re-trimming per stitch
  function sampler(pts) {
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const L = cum[cum.length - 1];
    const at = (d) => { d = K.clamp(d, 0, L); let lo = 1, hi = cum.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (cum[m] < d) lo = m + 1; else hi = m; } const a = pts[lo - 1], b = pts[lo], seg = cum[lo] - cum[lo - 1] || 1, k = (d - cum[lo - 1]) / seg, dx = (b[0] - a[0]) / seg, dy = (b[1] - a[1]) / seg; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, dx, dy]; };
    return { L, at };
  }
  // blanket stitch along a closed polyline: edge thread + perpendicular legs reaching in
  function blanket(ctx, pts, s, col = C.thread, k = 1) {
    const sm = sampler(pts), step = 13 * s, n = Math.floor((sm.L / step) * k), leg = 8 * s;
    ctx.save(); ctx.lineCap = 'round';
    for (const pass of [0, 1]) {
      ctx.strokeStyle = pass ? col : 'rgba(30,15,5,0.35)'; ctx.lineWidth = 2 * s; const o = pass ? 0 : 1.2 * s;
      ctx.beginPath(); let prev = null;
      for (let i = 0; i <= n; i++) { const [x, y, dx, dy] = sm.at(i * step); if (prev) { ctx.moveTo(prev[0] + o, prev[1] + o); ctx.lineTo(x + o, y + o); } ctx.moveTo(x + o, y + o); ctx.lineTo(x - dy * leg + o, y + dx * leg + o); prev = [x, y]; }
      ctx.stroke();
    }
    ctx.restore();
  }
  // running stitch along a path, revealed stitch by stitch (thread shadow, body, sheen)
  function running(ctx, pts, k, s, col = C.red, w = 3.4) {
    const sm = sampler(pts), st = 14 * s, gap = 7 * s, n = Math.floor(sm.L / (st + gap)), shown = Math.floor(n * K.clamp(k));
    if (!shown) return 0;
    ctx.save(); ctx.lineCap = 'round';
    const segs = []; for (let i = 0; i < shown; i++) { const A = sm.at(i * (st + gap)), B = sm.at(i * (st + gap) + st); segs.push([A, B]); }
    const pass = (style, lw, ox, oy) => { ctx.strokeStyle = style; ctx.lineWidth = lw; ctx.beginPath(); for (const [A, B] of segs) { ctx.moveTo(A[0] + ox, A[1] + oy); ctx.lineTo(B[0] + ox, B[1] + oy); } ctx.stroke(); };
    pass('rgba(25,12,5,0.4)', w * 1.25 * s, 1.2 * s, 2 * s);
    pass(col, w * s, 0, 0);
    pass('rgba(255,255,255,0.35)', w * 0.3 * s, 0, -w * 0.25 * s);
    ctx.restore();
    return shown;
  }
  function button(ctx, x, y, r, col, s) {
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 5 * s; ctx.shadowOffsetY = 3 * s; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.restore();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r); g.addColorStop(0, 'rgba(255,255,255,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.arc(x, y, r * 0.75, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.beginPath(); ctx.arc(x + dx * r * 0.25, y + dy * r * 0.25, r * 0.09, 0, 7); ctx.fill(); }
    ctx.strokeStyle = C.thread; ctx.lineWidth = r * 0.1; ctx.beginPath(); ctx.moveTo(x - r * 0.25, y - r * 0.25); ctx.lineTo(x + r * 0.25, y + r * 0.25); ctx.moveTo(x + r * 0.25, y - r * 0.25); ctx.lineTo(x - r * 0.25, y + r * 0.25); ctx.stroke();
  }
  const rrPath = (x, y, w, h, r) => (c) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

  const style = {
    id: 'felt-quilt', name: 'Felt & Patchwork', family: 'Paper & Craft',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=block', specs: ['700 60px "Fredoka"', '600 32px "Fredoka"'] }],
    palette: { bg: '#d9c7a8', ink: C.ink, accent: C.red, ...C },
    sfx: { draw: 'pen', land: 'pop', emphasis: 'pluck', transition: 'whoosh', bed: 'room' },

    // the quilt: printed cotton squares, puffed between sunk seams, a dashed quilting line inside each square
    background(ctx, W, H, t, o = {}) {
      const s = S(W, H), off = o.offset || 0;
      const quilt = K.cached(`fq-quilt:${W}x${H}:${off}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), sq = 128 * s, r = K.rng(11 + off);
        for (let gy = -1; gy * sq < H + sq; gy++) for (let gx = -1; gx * sq < W + sq; gx++) {
          const px = gx * sq + (off * 0.37 % 1) * sq, py = gy * sq, col = FABRIC[Math.floor(r() * FABRIC.length)], kind = Math.floor(r() * 5);
          x.save(); x.beginPath(); x.rect(px, py, sq, sq); x.clip();
          x.fillStyle = col; x.fillRect(px, py, sq, sq);
          const ink = K.rgba(K.mix(col, kind % 2 ? '#ffffff' : '#3a2a20', 0.35), 0.75);
          x.fillStyle = ink; x.strokeStyle = ink;
          if (kind === 0) { for (let yy = 6 * s; yy < sq; yy += 16 * s) for (let xx = ((yy / (16 * s)) % 2) * 8 * s + 6 * s; xx < sq; xx += 16 * s) { x.beginPath(); x.arc(px + xx, py + yy, 2.6 * s, 0, 7); x.fill(); } }
          else if (kind === 1) { x.globalAlpha = 0.35; for (let v = 0; v < sq; v += 18 * s) { x.fillRect(px + v, py, 9 * s, sq); x.fillRect(px, py + v, sq, 9 * s); } x.globalAlpha = 1; }
          else if (kind === 2) { for (let v = 0; v < sq; v += 14 * s) x.fillRect(px + v, py, 4 * s, sq); }
          else if (kind === 3) { x.lineWidth = 1.6 * s; for (let yy = 10 * s; yy < sq; yy += 22 * s) for (let xx = 10 * s; xx < sq; xx += 22 * s) { x.beginPath(); x.moveTo(px + xx - 4 * s, py + yy); x.lineTo(px + xx + 4 * s, py + yy); x.moveTo(px + xx, py + yy - 4 * s); x.lineTo(px + xx, py + yy + 4 * s); x.stroke(); } }
          // weave texture, puffy shading, sunk seams
          x.globalAlpha = 0.06; x.fillStyle = '#000'; for (let v = 0; v < sq; v += 2.2 * s) x.fillRect(px, py + v, sq, 0.7 * s); x.globalAlpha = 1;
          const g = x.createRadialGradient(px + sq * 0.45, py + sq * 0.4, sq * 0.1, px + sq / 2, py + sq / 2, sq * 0.75);
          g.addColorStop(0, 'rgba(255,250,240,0.22)'); g.addColorStop(0.7, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(40,25,15,0.35)'); x.fillStyle = g; x.fillRect(px, py, sq, sq);
          x.restore();
          x.save(); x.strokeStyle = 'rgba(250,244,230,0.85)'; x.lineWidth = 1.6 * s; x.setLineDash([7 * s, 5 * s]); x.strokeRect(px + 9 * s, py + 9 * s, sq - 18 * s, sq - 18 * s); x.restore();
        }
        return c;
      });
      const b = 1 + 0.004 * Math.sin(t * 1.4);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(b, b); ctx.translate(-W / 2, -H / 2); ctx.drawImage(quilt, 0, 0); ctx.restore();
    },
    finish(ctx, W, H, t) {
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,240,215,0.1)'); g.addColorStop(1, 'rgba(60,35,20,0.12)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      K.vignette(ctx, W, H, 0.32, '#2a180c');
      K.grain(ctx, W, H, t, 0.04, 12, 'overlay');
    },

    // felt letters on a cream felt banner, outlined in running stitch
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 60) * s, k = K.clamp(p); if (k <= 0) return { w: 0, h: 0 };
      ctx.save(); ctx.font = K.font(size, FONT, 700); const tw = ctx.measureText(text).width; ctx.restore();
      const w = tw + size * 0.9, h = size * 1.5, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - size * 1.08;
      const drop = K.ease.back(K.clamp(k * 2)), sq = 1 + 0.08 * Math.sin(K.clamp(k * 2) * Math.PI);
      ctx.save(); ctx.translate(x0 + w / 2, y0 + h); ctx.scale(sq, (1 / sq) * drop + (1 - drop) * 0.0001); ctx.translate(-(x0 + w / 2), -(y0 + h));
      if (o.banner !== false) { feltShape(ctx, rrPath(x0, y0, w, h, 14 * s), o.bg || C.cream, s); blanket(ctx, K.rectPts(x0 + 3 * s, y0 + 3 * s, w - 6 * s, h - 6 * s), s, o.stitch || C.red, K.clamp((k - 0.3) / 0.7)); }
      ctx.font = K.font(size, FONT, 700); ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 3 * s; ctx.shadowOffsetY = 2 * s;
      ctx.fillStyle = felt(ctx, o.color || C.navy); ctx.globalAlpha = K.clamp((k - 0.15) * 3); ctx.fillText(text, x0 + (w - tw) / 2, y0 + h / 2 + size * 0.36);
      ctx.restore();
      return { w, h };
    },
    // a woven name tag stitched on at both ends
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 34) * s, k = K.clamp(p); if (k <= 0) return { w: 0, h: 0 };
      ctx.save(); ctx.font = K.font(size, FONT, 600); const tw = ctx.measureText(text).width; ctx.restore();
      const w = tw + size * 1.2, h = size * 1.4, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - size * 1.02;
      const pop = K.ease.back(K.clamp(k * 1.6));
      ctx.save(); ctx.translate(x0 + w / 2, y0 + h / 2); ctx.scale(pop, pop); ctx.rotate(o.tilt ?? 0); ctx.translate(-(x0 + w / 2), -(y0 + h / 2));
      ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 5 * s; ctx.shadowOffsetY = 3 * s; ctx.fillStyle = o.bg || '#fbf6ea'; ctx.fillRect(x0, y0, w, h); ctx.shadowColor = 'transparent';
      ctx.globalAlpha = 0.07; ctx.fillStyle = '#000'; for (let v = 0; v < h; v += 2 * s) ctx.fillRect(x0, y0 + v, w, 0.7 * s); ctx.globalAlpha = 1;
      ctx.fillStyle = o.edge || C.red; ctx.fillRect(x0, y0 + 4 * s, w, 2.5 * s); ctx.fillRect(x0, y0 + h - 6.5 * s, w, 2.5 * s);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6 * s; for (const ex of [x0 + 7 * s, x0 + w - 7 * s]) for (let v = 9 * s; v < h - 8 * s; v += 7 * s) { ctx.beginPath(); ctx.moveTo(ex - 2.5 * s, y0 + v); ctx.lineTo(ex + 2.5 * s, y0 + v + 3 * s); ctx.stroke(); }
      ctx.font = K.font(size, FONT, 600); ctx.fillStyle = o.color || C.navy; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + (w - tw) / 2, y0 + h / 2 + 1 * s);
      ctx.restore();
      return { w, h };
    },
    // a thread sewn on in running stitch, button knot at the start, stitched head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.2, 60), col = o.color || C.red;
      running(ctx, pts, K.clamp(p / 0.85), s, col, o.width || 3.4);
      if (p > 0.85) { const k = K.clamp((p - 0.85) / 0.15), b = pts[pts.length - 1], a = pts[pts.length - 6], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 20 * s;
        for (const sg of [-1, 1]) running(ctx, [b, [b[0] - Math.cos(ang + sg * 0.55) * L, b[1] - Math.sin(ang + sg * 0.55) * L]], k, s, col, o.width || 3.4); }
      if (o.knot !== false && p > 0.02) button(ctx, from[0], from[1], 9 * s, o.knot || C.mustard, s);
      return pts[pts.length - 1];
    },
    // a felt patch dropped on with a lifted shadow and soft squash, blanket-stitched round the edge
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      const land = K.clamp(k * 1.5), lift = K.lerp(22, 6, K.ease.out(land)), sq = 1 + 0.07 * Math.sin(land * Math.PI), dy = (1 - K.ease.out(land)) * -40 * s;
      ctx.save(); ctx.globalAlpha = K.clamp(k * 4); ctx.translate(x + w / 2, y + h + dy); ctx.scale(sq, 1 / sq); ctx.translate(-(x + w / 2), -(y + h));
      feltShape(ctx, rrPath(x, y, w, h, 18 * s), o.color || C.teal, s, { lift });
      blanket(ctx, K.rectPts(x + 4 * s, y + 4 * s, w - 8 * s, h - 8 * s), s, o.stitch || C.thread, K.clamp((k - 0.4) / 0.6));
      ctx.restore();
    },
    // felt digits with a stitched outline
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 120) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, FONT, 700); const tw = ctx.measureText(txt).width, x0 = x - tw / 2; ctx.textBaseline = 'alphabetic';
      ctx.shadowColor = 'rgba(40,20,10,0.45)'; ctx.shadowBlur = 10 * s; ctx.shadowOffsetY = 6 * s; ctx.fillStyle = o.color || C.red; ctx.fillText(txt, x0, y); ctx.shadowColor = 'transparent';
      ctx.fillStyle = felt(ctx, o.color || C.red); ctx.fillText(txt, x0, y);
      ctx.setLineDash([6 * s, 5 * s]); ctx.lineWidth = 2 * s; ctx.strokeStyle = C.thread; ctx.strokeText(txt, x0, y);
      ctx.restore();
      return { w: tw, h: size };
    },
    // a ring sewn around the moment, stitch by stitch, and a felt heart patch popping on the corner
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), pts = K.circlePts(x, y, r * 1.12, r * (o.ry || 0.6), 120, -Math.PI / 2, Math.PI * 2);
      running(ctx, pts, K.clamp(p * 1.25), s, o.color || C.navy, 4.5);
      const hk = K.ease.back(K.clamp((p - 0.6) / 0.4)); if (hk <= 0) return;
      const hx = x + r * (o.hx ?? 1.0), hy = y - r * (o.ry || 0.6) * 0.9, hr = 34 * s * hk;
      const heart = (c) => { c.beginPath(); c.moveTo(hx, hy + hr * 0.9); c.bezierCurveTo(hx - hr * 1.6, hy - hr * 0.2, hx - hr * 0.6, hy - hr * 1.3, hx, hy - hr * 0.45); c.bezierCurveTo(hx + hr * 0.6, hy - hr * 1.3, hx + hr * 1.6, hy - hr * 0.2, hx, hy + hr * 0.9); c.closePath(); };
      feltShape(ctx, heart, C.red, s, { lift: 6 });
    },
    // the quilt pans: the next section slides in from the right (covered at 0.5), then on out to the left
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), x = K.lerp(W, -W, K.ease.inOut(p));
      ctx.save(); ctx.shadowColor = 'rgba(30,15,5,0.5)'; ctx.shadowBlur = 30 * s; ctx.fillStyle = '#d9c7a8'; ctx.fillRect(x, 0, W, H); ctx.restore();
      ctx.save(); ctx.beginPath(); ctx.rect(x, 0, W, H); ctx.clip(); ctx.translate(x, 0); style.background(ctx, W, H, 0, { offset: 7 }); ctx.restore();
      // binding along both edges of the travelling section
      for (const ex of [x, x + W]) { ctx.fillStyle = felt(ctx, C.red); ctx.fillRect(ex - 9 * s, 0, 18 * s, H); ctx.save(); ctx.strokeStyle = C.thread; ctx.lineWidth = 2 * s; ctx.setLineDash([8 * s, 6 * s]); ctx.beginPath(); ctx.moveTo(ex, 0); ctx.lineTo(ex, H); ctx.stroke(); ctx.restore(); }
    },
  };

  // ---------- the shared demo, sewn onto one quilt ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const THREAD = [C.red, C.navy, C.red, C.ink, C.navy, C.ink, C.navy];
  const BTN = [C.mustard, C.rose, C.sage, C.denim, C.mustard, C.rose, C.sage];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 118 * s], video: [85 * s, 255 * s, 260 * s, 160 * s], node: [455 * s, 270 * s, 320 * s, 140 * s],
      chips: PL.map((_, i) => [910 * s, (210 + i * 66) * s]), top: [W / 2, 108 * s], counter: [W / 2, 410 * s], take: [W / 2, 620 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.225, W * 0.5, H * 0.1], node: [W * 0.15, H * 0.4, W * 0.7, H * 0.072],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.565 + Math.floor(i / 2) * 0.07)]), top: [W / 2, H * 0.14], counter: [W / 2, H * 0.44], take: [W / 2, H * 0.68] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      style.background(ctx, W, H, t, { offset: scene2 ? 7 : 0 });
      if (!scene2) {
        if (P) { style.title(ctx, 'One video.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 0.8, 'lin'), { size: 60, align: 'center' }); style.title(ctx, 'Every platform.', Lo.title[0], Lo.title[1] + 120 * s, K.beat(t, 0.7, 1.0, 'lin'), { size: 56, align: 'center', bg: C.mustard, color: C.navy }); }
        else style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.4, 'lin'), { size: 58, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video, vp = K.beat(t, 2.0, 0.6, 'lin');
        style.box(ctx, vx, vy, vw, vh, vp, { color: C.denim });
        if (vp > 0.6) { const r = Math.min(vw, vh) * 0.25, cx = vx + vw / 2, cy = vy + vh / 2; feltShape(ctx, (c) => { c.beginPath(); c.moveTo(cx - r * 0.6, cy - r); c.lineTo(cx + r, cy); c.lineTo(cx - r * 0.6, cy + r); c.closePath(); }, C.cream, s, { lift: 4 }); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 58 * s, K.beat(t, 2.6, 0.5, 'lin'), { align: 'center', tilt: -0.03 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 84 * s], [nx + nw / 2, ny - 20 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 22 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: P ? 0 : -0.15 });
        const np = K.beat(t, 4.0, 0.8, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, { color: C.red, stitch: C.cream });
        if (np > 0.4) { ctx.save(); ctx.globalAlpha = K.clamp((np - 0.4) * 3); ctx.font = K.font(K.fitSize(ctx, 'Creator OS', FONT, 700, 54 * s, nw - 60 * s), FONT, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 3 * s; ctx.shadowOffsetY = 2 * s; ctx.fillStyle = felt(ctx, C.cream); ctx.fillText('Creator OS', nx + nw / 2, ny + nh / 2 + 3 * s); ctx.restore(); }
        if (P) style.arrow(ctx, [W / 2, ny + nh + 20 * s], [W / 2, Lo.chips[6][1] + 6 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0, color: C.ink, knot: false });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 14 * s] : [nx + nw + 22 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 14 * s] : [cx - 24 * s, cy - 14 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, color: THREAD[i], knot: P ? false : BTN[i], width: 4 });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.2, 0.4, 'lin'), { size: 34, align: P ? (left ? 'right' : 'left') : 'left', tilt: (i % 2 ? 0.02 : -0.02), edge: THREAD[i] === C.ink ? C.mustard : THREAD[i] });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * 0.8, h2 = nh * 0.8;
        style.box(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, { color: C.red, stitch: C.cream });
        ctx.save(); ctx.font = K.font(44 * s, FONT, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = felt(ctx, C.cream); ctx.fillText('Creator OS', Lo.top[0], Lo.top[1] + 3 * s); ctx.restore();
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 110 : 128, color: C.navy });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + (P ? 80 : 70) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 36 });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 30 * s, (P ? 300 : 330) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: P ? 0.6 : 0.5, hx: P ? 0.7 : 1.0 });
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1] + 30 * s, K.beat(t, 10.5, 0.6, 'lin'), { size: 58, align: 'center' }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 150 * s, K.beat(t, 10.7, 0.7, 'lin'), { size: 54, align: 'center', bg: C.mustard }); }
        else style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: 52, align: 'center' });
        if (t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.4);
      k.play('thud', 0.2, { gain: 0.25 }); k.play('scribble', 0.5, { medium: 'pen', dur: 1.0, gain: 0.9 });
      k.play('thud', 2.05, { gain: 0.3 }); k.play('pop', 2.3, { pitch: 0.6, gain: 0.5 }); k.play('scribble', 2.4, { medium: 'pen', dur: 0.5 });
      k.play('pop', 2.75, { pitch: 0.8, gain: 0.6 }); k.play('click', 3.3, { pitch: 0.6 });
      for (let i = 0; i < 8; i++) k.play('tick', 3.35 + i * 0.08, { gain: 0.45, pitch: 0.6 });
      k.play('thud', 4.05, { gain: 0.35 }); k.play('scribble', 4.3, { medium: 'pen', dur: 0.5 });
      for (let i = 0; i < 7; i++) { k.play('click', 5.0 + i * 0.4, { pitch: 0.6 }); for (let j = 0; j < 3; j++) k.play('tick', 5.05 + i * 0.4 + j * 0.09, { gain: 0.4, pitch: 0.55 }); k.play('pop', 5.3 + i * 0.4, { pitch: 0.7 + i * 0.05, gain: 0.6 }); }
      k.play('whoosh', 7.4, { dur: 1.6, gain: 0.7 }); k.play('paper', 7.6, { dur: 1.2, gain: 0.6 });
      k.play('count', 8.6, { dur: 1.4 });
      for (let i = 0; i < 10; i++) k.play('tick', 10.0 + i * 0.05, { gain: 0.5, pitch: 0.55 }); k.play('pluck', 10.4, { note: 'E5' }); k.play('pop', 10.4, { pitch: 0.6 });
      k.play('thud', 10.5, { gain: 0.3 }); k.play('chime', 11.4, { note: 'G5' });
    },
  };
  MS.register(style);
})();
