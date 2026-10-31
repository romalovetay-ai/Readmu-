// Cathedral Glass (Painterly). A leaded Gothic window in a dim stone nave: hand-cut pieces of streaky, seedy antique
// glass (each piece its own tint and gradient) held in thick dark came with solder at the joints, grisaille paint for
// the lettering on pale banner glass, and daylight blazing through in dusty rays that sweep across the panes.
// Elements are glass: boxes are panels of cut pieces that light up one by one, arrows are leaded glass strips,
// emphasis is a ring of ruby glass that flares. Scene change = a cloud dims the window to dusk and back.
(function () {
  const GL = { blue: '#1f3f9a', deep: '#14245e', ruby: '#b3152b', gold: '#e3a51e', green: '#2f7a3a', violet: '#5b2d82', amber: '#d9822b', pale: '#efe1b6', lead: '#17140f', paint: '#3a2412' };
  const TITLE = 'Grenze Gotisch', SERIF = 'Cinzel';
  const S = (W, H) => K.layout(W, H).s;

  function archPath(x, W, H) {
    const s = S(W, H), p = H > W;
    const L = p ? 40 * s : 58 * s, R = W - L, B = H - (p ? 30 : 12) * s, top = (p ? 26 : 12) * s, spring = p ? H * 0.2 : 210 * s, mid = W / 2;
    x.beginPath(); x.moveTo(L, B); x.lineTo(L, spring);
    x.bezierCurveTo(L, spring - (spring - top) * 0.7, mid - (mid - L) * 0.45, top, mid, top);
    x.bezierCurveTo(mid + (R - mid) * 0.45, top, R, spring - (spring - top) * 0.7, R, spring);
    x.lineTo(R, B); x.closePath();
    return { L, R, B, top, spring };
  }
  // lead came: dark core, faint highlight on the upper edge
  function came(x, s, w = 5) { x.lineJoin = 'round'; x.lineCap = 'round'; x.strokeStyle = GL.lead; x.lineWidth = w * s; x.stroke(); x.strokeStyle = 'rgba(160,150,130,0.25)'; x.lineWidth = 1.2 * s; x.stroke(); }
  // one glass piece: tinted gradient, streak, a few seeds (bubbles)
  function piece(x, poly, col, r, s, lit = 1) {
    const xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]), x0 = Math.min(...xs), y0 = Math.min(...ys), x1 = Math.max(...xs), y1 = Math.max(...ys);
    const c = K.hex(col), v = r.range(-0.18, 0.22), base = K.mix(c, v > 0 ? [255, 255, 255] : [0, 0, 0], Math.abs(v));
    const g = x.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, K.rgba(K.mix(base, [255, 255, 240], 0.25 * lit), 1)); g.addColorStop(1, K.rgba(K.mix(base, [0, 0, 0], 0.35), 1));
    x.fillStyle = g; K.poly(x, poly, true); x.fill();
    x.save(); K.poly(x, poly, true); x.clip();
    x.strokeStyle = K.rgba(K.mix(base, [255, 255, 255], 0.5), 0.18); x.lineWidth = r.range(2, 6) * s;
    x.beginPath(); const a = r.range(0, Math.PI); for (let k = 0; k < 2; k++) { const ox = r.range(x0, x1), oy = r.range(y0, y1); x.moveTo(ox - Math.cos(a) * 200 * s, oy - Math.sin(a) * 200 * s); x.quadraticCurveTo(ox, oy + r.range(-20, 20) * s, ox + Math.cos(a) * 200 * s, oy + Math.sin(a) * 200 * s); } x.stroke();
    x.fillStyle = 'rgba(255,255,255,0.35)'; for (let k = 0; k < 3; k++) { x.beginPath(); x.arc(r.range(x0, x1), r.range(y0, y1), r.range(0.8, 2.2) * s, 0, Math.PI * 2); x.fill(); }
    x.restore();
  }
  // jittered grid of quads (some split into triangles) covering a rect
  function cells(x0, y0, w, h, size, r, jit = 0.32) {
    const nx = Math.max(1, Math.round(w / size)), ny = Math.max(1, Math.round(h / size)), V = [];
    for (let j = 0; j <= ny; j++) { V.push([]); for (let i = 0; i <= nx; i++) { const edge = i === 0 || j === 0 || i === nx || j === ny; V[j].push([x0 + (i / nx) * w + (edge && (i === 0 || i === nx) ? 0 : r.range(-jit, jit) * (w / nx)), y0 + (j / ny) * h + (edge && (j === 0 || j === ny) ? 0 : r.range(-jit, jit) * (h / ny))]); } }
    const out = [];
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const a = V[j][i], b = V[j][i + 1], c = V[j + 1][i + 1], d = V[j + 1][i];
      if (r() < 0.35) { out.push([a, b, c]); out.push([a, c, d]); } else out.push([a, b, c, d]);
    }
    return out;
  }

  function stone(W, H) {
    return K.cached(`sg-stone:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(4);
      x.drawImage(K.paperTex(W, H, '#3a332c', 9, 0.12, false), 0, 0);
      const bh = 54 * s;
      for (let y = 0, row = 0; y < H; y += bh, row++) { let xx = row % 2 ? -60 * s : 0; while (xx < W) { const bw = r.range(110, 170) * s; x.fillStyle = `rgba(${r() < 0.5 ? '255,240,220' : '0,0,0'},${r.range(0.02, 0.07)})`; x.fillRect(xx + 2 * s, y + 2 * s, bw - 4 * s, bh - 4 * s); x.strokeStyle = 'rgba(10,8,6,0.55)'; x.lineWidth = 3 * s; x.strokeRect(xx, y, bw, bh); xx += bw; } }
      const g = x.createRadialGradient(W / 2, H * 0.4, 0, W / 2, H * 0.4, Math.hypot(W, H) * 0.6); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      return c;
    });
  }
  function windowLayer(W, H) {
    return K.cached(`sg-window:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(77);
      // stone surround (splayed jamb)
      x.save(); archPath(x, W, H); x.lineWidth = 34 * s; x.strokeStyle = '#5a5045'; x.stroke(); x.lineWidth = 22 * s; x.strokeStyle = '#7a6d5e'; x.stroke(); x.lineWidth = 6 * s; x.strokeStyle = '#2a241e'; x.stroke(); x.restore();
      x.save(); archPath(x, W, H); x.clip();
      // background mosaic: deep blues with violet and a few green/gold sparks
      const cs = cells(0, 0, W, H, 62 * s, r, 0.36), pal = [GL.blue, GL.blue, GL.deep, GL.blue, GL.deep, '#2a58b8', '#24408f', GL.violet];
      for (const pc of cs) { const sp = r(); piece(x, pc, sp < 0.025 ? GL.gold : sp < 0.045 ? GL.green : sp < 0.06 ? GL.ruby : r.pick(pal), r, s, 0.6); }
      x.fillStyle = 'rgba(5,8,30,0.22)'; x.fillRect(0, 0, W, H);
      for (const pc of cs) { K.poly(x, pc, true); came(x, s, 4); }
      // border band of alternating ruby / gold squares
      const ap = { band: 26 * s };
      x.restore();
      x.save(); archPath(x, W, H); x.lineWidth = ap.band * 2; x.strokeStyle = 'rgba(0,0,0,0)'; x.clip();
      const b = archPath(x, W, H); x.lineWidth = ap.band; x.setLineDash([22 * s, 6 * s]); x.strokeStyle = GL.ruby; x.stroke(); x.setLineDash([10 * s, 18 * s]); x.strokeStyle = GL.gold; x.stroke(); x.setLineDash([]);
      x.restore();
      x.save(); archPath(x, W, H); x.lineWidth = 8 * s; x.strokeStyle = GL.lead; x.stroke(); x.restore();
      return c;
    });
  }
  // streaky antique-glass texture laid over every pane (overlay)
  function glassTex(W, H) {
    return K.cached(`sg-tex:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(12), nz = K.noise(13);
      const img = x.createImageData(W, H), d = img.data;
      for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) { const v = 128 + nz.fbm2(i * 0.01 / s, y * 0.05 / s, 3) * 90 + (r() - 0.5) * 30, o = (y * W + i) * 4; d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = 255; }
      x.putImageData(img, 0, 0); return c;
    });
  }

  const style = {
    id: 'stained-glass', name: 'Cathedral Glass', family: 'Painterly',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;800&family=Grenze+Gotisch:wght@600;800&display=block', specs: ['800 40px "Cinzel"', '800 60px "Grenze Gotisch"'] }],
    palette: { bg: '#2a241e', ...GL, ink: GL.paint, accent: GL.ruby },
    sfx: { draw: null, land: 'chime', emphasis: 'ding', transition: 'swell', bed: 'space' },
    setup(W, H) { stone(W, H); windowLayer(W, H); glassTex(W, H); },

    background(ctx, W, H, t) { ctx.drawImage(stone(W, H), 0, 0); ctx.drawImage(windowLayer(W, H), 0, 0); },

    // daylight sweep through the glass, antique-glass streaks, then dusty rays falling into the nave
    finish(ctx, W, H, t, o = {}) {
      const s = S(W, H), dim = o.dim || 0;
      ctx.save(); archPath(ctx, W, H); ctx.clip();
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.35; ctx.drawImage(glassTex(W, H), 0, 0); ctx.globalAlpha = 1;
      const sx = K.lerp(-0.3, 1.3, (t % 12) / 12) * W, g = ctx.createLinearGradient(sx - W * 0.35, 0, sx + W * 0.35, H);
      g.addColorStop(0, 'rgba(255,240,200,0)'); g.addColorStop(0.5, `rgba(255,240,200,${0.32 * (1 - dim)})`); g.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      // rays + dust
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 4; i++) {
        const x0 = W * (0.15 + i * 0.22) + Math.sin(t * 0.3 + i) * 20 * s, wd = (60 + i * 25) * s;
        const rg = ctx.createLinearGradient(x0, 0, x0 + W * 0.25, H); rg.addColorStop(0, `rgba(255,235,190,${0.1 * (1 - dim)})`); rg.addColorStop(1, 'rgba(255,235,190,0)');
        ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(x0, 0); ctx.lineTo(x0 + wd, 0); ctx.lineTo(x0 + wd + W * 0.3, H); ctx.lineTo(x0 + W * 0.3 - wd * 0.2, H); ctx.closePath(); ctx.fill();
      }
      const r = K.rng(5); ctx.fillStyle = `rgba(255,240,210,${0.55 * (1 - dim)})`;
      for (let i = 0; i < 60; i++) { const x = (r() * W + t * r.range(4, 12) * s) % W, y = (r() * H + Math.sin(t * 0.7 + i) * 8 * s + t * 3 * s) % H; ctx.fillRect(x, y, 1.8 * s, 1.8 * s); }
      ctx.restore();
      if (dim > 0) { ctx.save(); ctx.fillStyle = `rgba(8,10,25,${0.82 * dim})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      K.vignette(ctx, W, H, 0.45, '#000');
      K.grain(ctx, W, H, t, 0.04, 24, 'overlay');
    },

    // grisaille lettering on a pale banner piece held in lead
    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 60) * s, fam = o.family || TITLE;
      ctx.save(); ctx.font = K.font(size, fam, 800);
      const w = ctx.measureText(text).width, padX = 28 * s, bw = w + padX * 2, bh = size * 1.32, bx = x - (o.align === 'left' ? 0 : o.align === 'right' ? bw : bw / 2), by = y - size * 0.98;
      if (o.banner !== false) {
        const lit = K.clamp(p * 2.5), r = K.rng(o.seed || 9);
        ctx.globalAlpha = lit;
        const ban = [[bx, by + bh * 0.12], [bx + bw * 0.5, by], [bx + bw, by + bh * 0.12], [bx + bw, by + bh * 0.88], [bx + bw * 0.5, by + bh], [bx, by + bh * 0.88]];
        piece(ctx, ban, o.glass || GL.pale, r, s, 1.3);
        // banner cut into two or three pieces, as real banners are
        for (const cx of [bx + 13 * s, bx + bw - 13 * s]) { ctx.beginPath(); ctx.moveTo(cx + 4 * s, by + bh * 0.08); ctx.lineTo(cx - 4 * s, by + bh * 0.92); came(ctx, s, 3.5); }
        K.poly(ctx, ban, true); came(ctx, s, 6);
        ctx.globalAlpha = 1;
      }
      // painted in: trace-line grisaille, revealed left to right
      ctx.beginPath(); ctx.rect(bx, by - 10 * s, bw * K.clamp((p - 0.25) / 0.75), bh + 20 * s); ctx.clip();
      ctx.textAlign = 'center'; ctx.fillStyle = o.color || GL.paint; ctx.globalAlpha = 0.92; ctx.fillText(text, bx + bw / 2, y);
      ctx.globalAlpha = 0.25; ctx.fillText(text, bx + bw / 2 + 1.5 * s, y + 1 * s);
      ctx.restore();
      return { w: bw, h: bh, x: bx, y: by };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 32, family: SERIF, ...o }); },

    // a strip of glass between two leads, ending in a glass arrowhead
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || GL.gold, w = (o.width || 16) * s;
      const pts = K.arcPts(from, to, o.bend ?? 0.12, 24), q = K.trim(pts, K.clamp(p / 0.8)); if (q.length < 2) return null;
      const r = K.rng(o.seed || 3), L = [], R = [];
      for (let i = 0; i < q.length; i++) { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; L.push([q[i][0] - (dy / l) * w / 2, q[i][1] + (dx / l) * w / 2]); R.push([q[i][0] + (dy / l) * w / 2, q[i][1] - (dx / l) * w / 2]); }
      // cut the strip into pieces every ~60px
      const step = Math.max(2, Math.round(60 * s / (K.pathLen(q) / q.length || 1)));
      for (let i = 0; i < q.length - 1; i += step) { const j = Math.min(q.length - 1, i + step), pc = L.slice(i, j + 1).concat(R.slice(i, j + 1).reverse()); piece(ctx, pc, col, r, s, 1.2); K.poly(ctx, pc, true); came(ctx, s, 4); }
      if (p > 0.8) {
        const k = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hl = 30 * s * k, hw = 22 * s * k, e = q[q.length - 1];
        const tri = [[e[0] + Math.cos(ang) * hl, e[1] + Math.sin(ang) * hl], [e[0] - Math.sin(ang) * hw, e[1] + Math.cos(ang) * hw], [e[0] + Math.sin(ang) * hw, e[1] - Math.cos(ang) * hw]];
        piece(ctx, tri, o.headColor || GL.ruby, r, s, 1.2); K.poly(ctx, tri, true); came(ctx, s, 4);
      }
      return q[q.length - 1];
    },

    // a leaded panel: pieces light up one by one from the top-left
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), r = K.rng(o.seed || 5), cs = cells(x, y, w, h, (o.cell || 58) * s, r, 0.3);
      const col = o.color || GL.gold, alt = o.alt || GL.amber;
      const order = cs.map((pc, i) => [pc, Math.hypot(pc[0][0] - x, pc[0][1] - y)]).sort((a, b) => a[1] - b[1]);
      const n = Math.ceil(order.length * K.clamp(p * 1.15)), pr = K.rng((o.seed || 5) + 1);
      order.forEach(([pc], i) => { const c = pr() < 0.3 ? alt : col; if (i < n) piece(ctx, pc, c, pr, s, 1.1); else { ctx.fillStyle = 'rgba(10,12,30,0.55)'; K.poly(ctx, pc, true); ctx.fill(); } });
      for (const [pc] of order) { K.poly(ctx, pc, true); came(ctx, s, 3.5); }
      ctx.beginPath(); ctx.rect(x, y, w, h); came(ctx, s, 9);
      // solder blobs at the corners
      ctx.fillStyle = '#3a352c'; for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) { ctx.beginPath(); ctx.arc(cx, cy, 6 * s, 0, Math.PI * 2); ctx.fill(); }
    },

    counter(ctx, value, x, y, p, o = {}) {
      return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 104, family: SERIF, align: o.align || 'center', glass: GL.pale, seed: 31, color: o.color || GL.paint });
    },

    // ruby ring of glass pieces that flares with light as it completes
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), n = 18, rx = r * 1.22, ry = r * 0.6, th = 22 * s, rr = K.rng(o.seed || 13), shown = Math.ceil(n * K.clamp(p));
      for (let i = 0; i < shown; i++) {
        const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
        const pc = [[x + Math.cos(a0) * (rx - th / 2), y + Math.sin(a0) * (ry - th / 2)], [x + Math.cos(a1) * (rx - th / 2), y + Math.sin(a1) * (ry - th / 2)], [x + Math.cos(a1) * (rx + th / 2), y + Math.sin(a1) * (ry + th / 2)], [x + Math.cos(a0) * (rx + th / 2), y + Math.sin(a0) * (ry + th / 2)]];
        piece(ctx, pc, o.color || GL.ruby, rr, s, 1.4); K.poly(ctx, pc, true); came(ctx, s, 4);
      }
      if (p >= 1) { const f = K.clamp(o.flare ?? 1); ctx.save(); ctx.globalCompositeOperation = 'screen'; const g = ctx.createRadialGradient(x, y, 0, x, y, rx * 1.3); g.addColorStop(0, `rgba(255,220,180,${0.35 * f})`); g.addColorStop(1, 'rgba(255,200,160,0)'); ctx.fillStyle = g; ctx.fillRect(x - rx * 1.4, y - rx * 1.4, rx * 2.8, rx * 2.8); ctx.restore(); }
    },

    // a cloud crosses the sun: the window falls to dusk (0.5) and blazes back
    transition(ctx, W, H, p, o = {}) {
      const d = Math.sin(Math.PI * K.clamp(p));
      ctx.save(); ctx.fillStyle = `rgba(6,8,22,${0.88 * d})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    },
  };

  // ---------- demo: the window lit pane by pane ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const STRIPS = [GL.green, GL.gold, GL.green, GL.gold, GL.green, GL.gold, GL.green];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [110 * s, 290 * s, 240 * s, 150 * s], node: [455 * s, 296 * s, 300 * s, 138 * s],
      chips: PLATFORMS.map((n, i) => [1052 * s, (185 + i * 72) * s]), title: [W / 2, 128 * s], counter: [W / 2, 420 * s] };
    return { s, video: [W * 0.26, H * 0.24, W * 0.48, H * 0.11], node: [W * 0.17, H * 0.43, W * 0.66, H * 0.08],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.72 : W * 0.28, H * (0.61 + Math.floor(i / 2) * 0.075)]), title: [W / 2, H * 0.1], counter: [W / 2, H * 0.5] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W;
      style.background(ctx, W, H, t);
      ctx.save(); archPath(ctx, W, H); ctx.clip();
      if (t < 8.1) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.2, 1.4, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 100 * s, K.clamp(tp * tt.length - i), { size: portrait ? 58 : 58, align: 'center', seed: 3 + i }));
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.9, 'lin'), { seed: 21, color: '#e9d9a8', alt: GL.pale, cell: 50 });
        if (t > 2.7) { const k = K.beat(t, 2.7, 0.3, 'out'), cx = vx + vw * 0.5, cy = vy + vh * 0.5, z = Math.min(vw, vh) * 0.28 * k; const tri = [[cx - z * 0.7, cy - z], [cx - z * 0.7, cy + z], [cx + z, cy]]; piece(ctx, tri, GL.ruby, K.rng(22), s, 1.3); K.poly(ctx, tri, true); came(ctx, s, 5); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 62 * s, K.beat(t, 3.0, 0.5, 'lin'), { glass: GL.gold, seed: 23 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 82 * s], [nx + nw / 2, ny - 12 * s]] : [[vx + vw + 10 * s, vy + vh / 2], [nx - 36 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.5, 0.55, 'lin'), { seed: 31, bend: 0 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.9, 'lin'), { seed: 41, color: GL.green, alt: '#3f9a4c', cell: 56 });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 16 * s, K.beat(t, 4.5, 0.45, 'lin'), { size: 40, family: SERIF, align: 'center', seed: 42 });
        if (portrait) style.arrow(ctx, [W / 2, ny + nh + 4 * s], [W / 2, Lo.chips[6][1] - 6 * s], K.beat(t, 4.95, 0.45, 'lin'), { seed: 49, bend: 0, color: GL.gold, headColor: GL.gold });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'lin');
          const lb = 'X' === name ? 70 * s : 0;
          if (portrait) style.arrow(ctx, [W / 2, cy - 12 * s], [left ? W * 0.47 - 0 : W * 0.53, cy - 12 * s], p, { seed: 50 + i, bend: 0, color: STRIPS[i], width: 12 });
          else style.arrow(ctx, [nx + nw + 6 * s, ny + nh / 2], [cx - 166 * s + lb * 0.8, cy - 12 * s], p, { seed: 50 + i, bend: (i - 3) * 0.03, color: STRIPS[i], width: 12 });
          style.label(ctx, name, portrait ? (left ? W * 0.27 : W * 0.73) : cx, cy, K.beat(t, t0 + 0.24, 0.32, 'lin'), { size: portrait ? 31 : 31, glass: i % 2 ? '#d8e6f2' : GL.pale, seed: 60 + i });
        });
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.25 : 120 * s;
        style.box(ctx, W / 2 - nw / 2, top - nh / 2, nw, nh, 1, { seed: 41, color: GL.green, alt: '#3f9a4c', cell: 56 });
        style.title(ctx, 'Creator OS', W / 2, top + 16 * s, 1, { size: 40, family: SERIF, align: 'center', seed: 42 });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 86 : 96 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 84 * s, K.beat(t, 8.7, 0.4, 'lin'), { size: 34, glass: GL.gold, seed: 70 });
        const ep = K.beat(t, 10.0, 0.5, 'lin');
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 10 * s, (portrait ? 250 : 268) * s, ep, { flare: 1 - K.clamp((t - 10.5) / 1.2) * 0.6 });
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.9, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, W / 2, (portrait ? H * 0.75 : 650 * s) + i * 96 * s, K.clamp(tp * tk.length - i), { size: portrait ? 50 : 46, align: 'center', seed: 80 + i }));
      }
      ctx.restore();
      const dim = t > 7.4 && t < 8.8 ? Math.sin(Math.PI * K.clamp((t - 7.4) / 1.4)) : 0;
      style.finish(ctx, W, H, t, { dim: dim * 0.5 });
      if (dim > 0) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.4), {});
    },
    score(k) {
      k.bed('space', 0, 12, 1); k.play('swell', 0, { dur: 2.5, chord: ['C4', 'G4', 'E5'], gain: 1.2 });
      k.play('chime', 0.4, { note: 'G5', gain: 0.6 });
      for (let i = 0; i < 6; i++) k.play('tick', 2.0 + i * 0.15, { gain: 0.6, pitch: 1.2 });
      k.play('ding', 2.75, { gain: 0.5 }); k.play('pluck', 3.05, { note: 'E5' });
      k.play('tick', 3.55, { gain: 0.6 }); for (let i = 0; i < 6; i++) k.play('tick', 4.0 + i * 0.15, { gain: 0.6, pitch: 1.1 });
      k.play('chime', 4.5, { note: 'C6', gain: 0.6 });
      const notes = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7'];
      for (let i = 0; i < 7; i++) k.play('chime', 5.24 + i * 0.4, { note: notes[i], gain: 0.45 });
      k.play('swell', 7.4, { dur: 1.5, chord: ['A3', 'C4', 'E4'], gain: 1.2 }); k.play('whoosh', 7.5, { dur: 1.0, gain: 0.4 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('ding', 10.0); k.play('stamp', 10.05, { gain: 0.4 });
      k.play('swell', 10.5, { dur: 1.5, chord: ['C4', 'E4', 'G4', 'C5'], gain: 1.2 }); k.play('chime', 11.3, { note: 'C6' });
    },
  };
  MS.register(style);
})();
