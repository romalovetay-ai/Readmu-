// Watercolor Wash (Painterly). Transparent pigment glazed in many ragged low-opacity layers on cold-press paper:
// each wash is a stack of independently deformed polygons (so the edge goes soft and ragged), with a darker pooled
// rim where the water dried, granulation specks, a cauliflower bloom, untouched paper for the lights and a faint
// pencil sketch underneath. Washes flood in from a point; arrows are tapered loaded-brush strokes; titles are
// brush-lettered. Scene change = a wet indigo wash sweeps the sheet, then is lifted off.
(function () {
  const PG = { ultra: '#2f4fa8', indigo: '#2a2f5c', sap: '#4f8a3c', ochre: '#d9a23a', sienna: '#b0582c', alizarin: '#c22a45', teal: '#2a8a8c', violet: '#6a4a9c' };
  const BRUSH = 'Caveat Brush';
  const PAPER = '#fbf7ee';
  const S = (W, H) => K.layout(W, H).s;

  // midpoint displacement: every pass splits each edge and nudges the new point along the edge normal
  function deform(pts, r, depth, amt) {
    let P = pts;
    for (let d = 0; d < depth; d++) {
      const out = [];
      for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, nx = -(b[1] - a[1]) / L, ny = (b[0] - a[0]) / L, g = r.gauss() * L * amt;
        out.push(a, [(a[0] + b[0]) / 2 + nx * g, (a[1] + b[1]) / 2 + ny * g]);
      }
      P = out; amt *= 0.62;
    }
    return P;
  }
  // resample a closed polygon to points every `step` px so displacement stays proportional along long edges
  function resample(pts, step) {
    const out = [];
    for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
      for (let k = 0; k < n; k++) out.push([K.lerp(a[0], b[0], k / n), K.lerp(a[1], b[1], k / n)]); }
    return out;
  }
  const blobPts = (cx, cy, rx, ry, n = 14) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2; return [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]; });
  const roundRect = (x, y, w, h, n = 5) => { const r = Math.min(w, h) * 0.12, pts = []; const c = [[x + w - r, y + r, -0.5], [x + w - r, y + h - r, 0], [x + r, y + h - r, 0.5], [x + r, y + r, 1]];
    c.forEach(([cx, cy, a0]) => { for (let i = 0; i <= n; i++) { const a = (a0 + i / n / 2) * Math.PI; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } }); return pts; };

  // Build one wash once (cached): glazed layers, pooled rim, granulation, optional bloom.
  function washLayer(key, pts, col, o = {}) {
    return K.cached('wc-wash:' + key, () => {
      const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), pad = 40;
      const bx = Math.min(...xs) - pad, by = Math.min(...ys) - pad, bw = Math.max(...xs) - bx + pad, bh = Math.max(...ys) - by + pad;
      const c = K.layer(bw, bh), x = c.getContext('2d'), r = K.rng(o.seed || 1), loc = pts.map(([a, b]) => [a - bx, b - by]);
      const base = deform(resample(loc, 70), r, 1, 0.07), [cr, cg, cb] = K.hex(col), A = o.alpha ?? 1;
      const layers = o.layers || 11;
      for (let i = 0; i < layers; i++) {
        const P = deform(base, K.rng((o.seed || 1) * 31 + i), 3, 0.11);
        x.filter = i % 3 ? 'blur(1.5px)' : 'none'; x.fillStyle = `rgba(${cr},${cg},${cb},${0.095 * A})`; K.poly(x, P, true); x.fill();
      }
      x.filter = 'none';
      // pooled rim: pigment carried to the edge as the wash dried
      x.save(); x.filter = 'blur(1.2px)';
      for (let i = 0; i < 2; i++) { const P = deform(base, K.rng((o.seed || 1) * 7 + i), 3, 0.07); x.strokeStyle = `rgba(${cr * 0.72},${cg * 0.72},${cb * 0.72},${0.5 * A})`; x.lineWidth = 2.6 - i * 0.9; K.poly(x, P, true); x.stroke(); }
      x.restore();
      // granulation: pigment settling into the paper tooth
      x.save(); x.globalCompositeOperation = 'source-atop';
      const n = (bw * bh) / 30; for (let i = 0; i < n; i++) { x.fillStyle = `rgba(${cr * 0.7},${cg * 0.7},${cb * 0.7},${r.range(0.05, 0.22) * A})`; x.fillRect(r() * bw, r() * bh, r.range(0.8, 2.2), r.range(0.8, 2.2)); }
      // wet-in-wet: a second pigment dropped in, bleeding softly
      if (o.drop) { const [dr, dg, db] = K.hex(o.drop); const g = x.createRadialGradient(bw * 0.7, bh * 0.35, 0, bw * 0.7, bh * 0.35, Math.max(bw, bh) * 0.45); g.addColorStop(0, `rgba(${dr},${dg},${db},0.32)`); g.addColorStop(1, `rgba(${dr},${dg},${db},0)`); x.fillStyle = g; x.fillRect(0, 0, bw, bh); }
      // cauliflower bloom: water backrun pushes pigment out into a frilly dark edge
      if (o.bloom) {
        const bc = [bw * 0.3, bh * 0.62], P = deform(blobPts(bc[0], bc[1], bw * 0.14, bh * 0.16, 10), r, 4, 0.3);
        x.globalCompositeOperation = 'destination-out'; x.fillStyle = 'rgba(0,0,0,0.35)'; K.poly(x, P, true); x.fill();
        x.globalCompositeOperation = 'source-atop'; x.strokeStyle = `rgba(${cr * 0.75},${cg * 0.75},${cb * 0.75},0.35)`; x.lineWidth = 1.6; K.poly(x, P, true); x.stroke();
      }
      x.restore();
      return { c, bx, by };
    });
  }
  // draw a cached wash, flooding in from (ox, oy) with a ragged wet front
  function wash(ctx, key, pts, col, p, o = {}) {
    if (p <= 0) return;
    const L = washLayer(key, pts, col, o);
    ctx.save();
    if (p < 1) {
      const ox = o.from ? o.from[0] : L.bx + L.c.width / 2, oy = o.from ? o.from[1] : L.by + L.c.height / 2, R = Math.hypot(L.c.width, L.c.height) * K.ease.out(p);
      const ring = deform(blobPts(ox, oy, R, R, 12), K.rng(o.seed || 3), 3, 0.18); K.poly(ctx, ring, true); ctx.clip();
    }
    ctx.drawImage(L.c, L.bx, L.by); ctx.restore();
  }

  // loaded round brush along a path: tapered body, double glaze, pooled bead at the end
  function brush(ctx, pts, p, o = {}) {
    const q = K.trim(pts, p); if (q.length < 3) return null;
    const s = S(ctx.canvas.width, ctx.canvas.height), w = (o.width || 9) * s, col = o.color || PG.indigo, n = q.length, total = pts.length;
    const left = [], right = [];
    for (let i = 0; i < n; i++) {
      const a = q[Math.max(0, i - 1)], b = q[Math.min(n - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1;
      const u = i / Math.max(1, total - 1), taper = Math.min(1, u * 6) * (0.55 + 0.45 * Math.sin(Math.PI * Math.min(1, u * 1.05))), hw = (w / 2) * Math.max(0.15, taper);
      left.push([q[i][0] - (dy / L) * hw, q[i][1] + (dx / L) * hw]); right.push([q[i][0] + (dy / L) * hw, q[i][1] - (dx / L) * hw]);
    }
    const poly = left.concat(right.reverse());
    ctx.save();
    ctx.fillStyle = K.rgba(col, 0.38); K.poly(ctx, poly, true); ctx.fill();
    ctx.fillStyle = K.rgba(col, 0.3); ctx.translate(0.8 * s, 0.6 * s); K.poly(ctx, poly, true); ctx.fill(); ctx.translate(-0.8 * s, -0.6 * s);
    ctx.strokeStyle = K.rgba(col, 0.45); ctx.lineWidth = 1.1 * s; K.poly(ctx, poly, true); ctx.stroke();
    const e = q[n - 1]; ctx.fillStyle = K.rgba(col, 0.45); ctx.beginPath(); ctx.arc(e[0], e[1], w * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.restore(); return e;
  }
  function pencilSketch(ctx, pts, a = 0.35) { const s = S(ctx.canvas.width, ctx.canvas.height); ctx.save(); ctx.strokeStyle = `rgba(90,90,100,${a})`; ctx.lineWidth = 1 * s; K.poly(ctx, pts, true); ctx.stroke(); ctx.restore(); }

  function letter(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 72) * s, col = o.color || PG.indigo;
    ctx.save(); ctx.font = K.font(size, BRUSH, 400); ctx.textAlign = 'left';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    // brushed in stroke by stroke: a soft-edged reveal that runs left to right
    const edge = x0 - 30 * s + (w + 60 * s) * K.clamp(p), g = ctx.createLinearGradient(edge - 30 * s, 0, edge, 0);
    ctx.beginPath(); ctx.rect(x0 - 20 * s, y - size * 1.1, edge - x0 + 20 * s, size * 1.6); ctx.clip();
    ctx.fillStyle = K.rgba(col, 0.55); ctx.fillText(text, x0, y);
    ctx.fillStyle = K.rgba(col, 0.35); ctx.fillText(text, x0 + 1.2 * s, y + 0.8 * s);
    ctx.strokeStyle = K.rgba(col, 0.4); ctx.lineWidth = 1.3 * s; ctx.strokeText(text, x0, y);
    ctx.restore(); return { w, h: size };
  }

  function paper(W, H) {
    return K.cached(`wc-paper:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), portrait = H > W;
      // cold-press: embossed bumps lit from the top-left (per-pixel once, cached)
      const img = x.createImageData(W, H), d = img.data, nz = K.noise(301), r = K.rng(302), [br, bg, bb] = K.hex(PAPER);
      for (let y = 0; y < H; y++) for (let i = 0; i < W; i++) {
        const u = i / s, v = y / s, h0 = nz.n2(u * 0.16, v * 0.16), hl = nz.n2((u - 1.2) * 0.16, (v - 1.2) * 0.16);
        const k = 1 + (hl - h0) * 0.09 + nz.fbm2(u * 0.004, v * 0.004, 3) * 0.03 + (r() - 0.5) * 0.02, o = (y * W + i) * 4;
        d[o] = br * k; d[o + 1] = bg * k; d[o + 2] = bb * k; d[o + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      // a few loose background washes (sky + ground) and splatter, like the sheet was warmed up first
      const big = (key, pts, col, o) => { const L = washLayer(key + W + 'x' + H, pts, col, o); x.globalAlpha = o.ga || 0.6; x.drawImage(L.c, L.bx, L.by); x.globalAlpha = 1; };
      big('bg1', blobPts(W * 0.12, H * 0.12, W * 0.28, H * 0.22), PG.ultra, { seed: 5, layers: 7, ga: 0.5 });
      big('bg2', blobPts(W * 0.88, H * 0.92, W * 0.3, H * 0.18), PG.ochre, { seed: 6, layers: 7, ga: 0.45, drop: PG.sienna });
      if (portrait) big('bg3', blobPts(W * 0.95, H * 0.42, W * 0.22, H * 0.12), PG.violet, { seed: 7, layers: 6, ga: 0.3 });
      for (let i = 0; i < 40; i++) { const cx = r() < 0.5 ? r.range(0.02, 0.3) * W : r.range(0.7, 0.98) * W, cy = r.range(0.02, 0.98) * H; x.fillStyle = K.rgba(r.pick([PG.ultra, PG.sienna, PG.sap, PG.ochre]), r.range(0.15, 0.4)); x.beginPath(); x.arc(cx, cy, r.range(1, 4.5) * s, 0, Math.PI * 2); x.fill(); }
      return c;
    });
  }

  const style = {
    id: 'watercolor', name: 'Watercolor Wash', family: 'Painterly',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Caveat+Brush&display=block', specs: ['400 72px "Caveat Brush"'] }],
    palette: { bg: PAPER, ink: PG.indigo, ...PG, accent: PG.alizarin },
    sfx: { draw: 'brush', land: 'pluck', emphasis: 'pluck', transition: 'whoosh', bed: 'room' },
    setup(W, H) { paper(W, H); },

    background(ctx, W, H, t) { ctx.drawImage(paper(W, H), 0, 0); },
    finish(ctx, W, H, t) {
      // pigment sits in the paper: a faint multiply of the paper bumps over everything, soft light falloff
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.18; ctx.drawImage(paper(W, H), 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.14, '#5a4a30');
      K.grain(ctx, W, H, t, 0.03, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return letter(ctx, text, x, y, p, { size: 76, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return letter(ctx, text, x, y, p, { size: 44, ...o }); },
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || PG.sienna;
      const pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.16, 40), 1.6 * s, o.seed || 3, 0.03);
      const e = brush(ctx, pts, K.clamp(p / 0.8), { width: 10, color: col });
      if (p > 0.8) { const k = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 6], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.min(26 * s, Math.hypot(to[0] - from[0], to[1] - from[1]) * 0.35);
        for (const sg of [-1, 1]) brush(ctx, K.bezier([b[0] - Math.cos(ang + sg * 0.5) * L, b[1] - Math.sin(ang + sg * 0.5) * L], b, b, b, 10), k, { width: 9, color: col }); }
      return e;
    },
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = roundRect(x, y, w, h);
      pencilSketch(ctx, pts, 0.32 * K.clamp(p * 4));
      wash(ctx, `box:${x | 0},${y | 0},${w | 0},${h | 0}:${o.color || PG.ultra}:${o.seed || 5}`, pts, o.color || PG.ultra, K.clamp((p - 0.15) / 0.85), { seed: o.seed || 5, bloom: o.bloom, drop: o.drop, from: [x + w * 0.2, y + h * 0.3] });
    },
    counter(ctx, value, x, y, p, o = {}) { return letter(ctx, K.fmt(value), x, y, 1, { size: o.size || 130, align: o.align || 'center', color: o.color || PG.ultra }); },
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || PG.alizarin;
      brush(ctx, K.wobble(K.circlePts(x, y, r * 1.22, r * 0.62, 90, -2.5, Math.PI * 2.15), 3 * s, o.seed || 13, 0.02), p, { width: 13, color: col });
      if (p > 0.9) { const rr = K.rng(91); ctx.save(); for (let i = 0; i < 16; i++) { const a = rr() * Math.PI * 2, d = r * rr.range(1.3, 1.6); ctx.fillStyle = K.rgba(col, rr.range(0.2, 0.5)); ctx.beginPath(); ctx.arc(x + Math.cos(a) * d * 1.1, y + Math.sin(a) * d * 0.6, rr.range(1.5, 5) * s, 0, Math.PI * 2); ctx.fill(); } ctx.restore(); }
    },
    // a wet indigo wash floods the sheet (covered at 0.5), then is lifted off with a damp sponge
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), r = K.rng(o.seed || 21);
      ctx.save();
      if (p < 0.5) {
        const k = K.ease.inOut(p / 0.5), fx = K.lerp(-W * 0.2, W * 1.25, k), front = [];
        for (let y = -20; y <= H + 20; y += 18 * s) front.push([fx + Math.sin(y * 0.012) * 50 * s + r.range(-22, 22) * s, y]);
        const reg = [[-10, -20]].concat(front, [[-10, H + 20]]);
        ctx.save(); K.poly(ctx, reg, true); ctx.clip(); ctx.drawImage(paper(W, H), 0, 0);
        ctx.fillStyle = K.rgba(PG.indigo, 0.22); ctx.fillRect(0, 0, W, H); ctx.restore();
        ctx.strokeStyle = K.rgba(PG.indigo, 0.45); ctx.lineWidth = 6 * s; ctx.filter = 'blur(2px)'; K.poly(ctx, front); ctx.stroke(); ctx.filter = 'none';
      } else {
        const a = 1 - (p - 0.5) / 0.5; ctx.fillStyle = K.rgba(PG.indigo, 0.22 * a); ctx.fillRect(0, 0, W, H);
      }
      ctx.restore();
    },
  };

  // ---------- demo: painted along one sheet ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const DOTS = [PG.alizarin, PG.indigo, PG.alizarin, PG.indigo, PG.ultra, PG.violet, PG.ultra];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [110 * s, 285 * s, 260 * s, 160 * s], node: [490 * s, 295 * s, 300 * s, 140 * s],
      chips: PLATFORMS.map((n, i) => [1010 * s, (172 + i * 70) * s]), title: [W / 2, 122 * s], counter: [W / 2, 420 * s] };
    return { s, video: [W * 0.24, H * 0.2, W * 0.52, H * 0.12], node: [W * 0.16, H * 0.43, W * 0.68, H * 0.075],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.605 + Math.floor(i / 2) * 0.078)]), title: [W / 2, H * 0.1], counter: [W / 2, H * 0.49] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W;
      // gentle pan along the sheet
      const cam = { x: W / 2 + (portrait ? 0 : K.lerp(-14, 14, t / 12) * s), y: H / 2 + (portrait ? K.lerp(-14, 14, t / 12) * s : 0), zoom: 1.03 };
      ctx.save(); K.camera(ctx, W, H, cam);
      style.background(ctx, W, H, t);
      if (t < 8.1) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.15, 1.5, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 84 * s, K.clamp(tp * tt.length - i), { size: portrait ? 70 : 74, align: 'center' }));
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 1.0, 'out'), { color: PG.ochre, seed: 21, drop: PG.sienna, bloom: true });
        if (t > 2.6) brush(ctx, [[vx + vw * 0.42, vy + vh * 0.26], [vx + vw * 0.42, vy + vh * 0.74], [vx + vw * 0.64, vy + vh * 0.5], [vx + vw * 0.42, vy + vh * 0.26]].flatMap((pt, i, A) => (i ? K.bezier(A[i - 1], A[i - 1], pt, pt, 8).slice(1) : [pt])), K.beat(t, 2.6, 0.4, 'lin'), { width: 8, color: PG.sienna });
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 54 * s, K.beat(t, 3.0, 0.5, 'lin'), { align: 'center', color: PG.sienna });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 74 * s], [nx + nw / 2, ny - 18 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 20 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.45, 0.6, 'lin'), { seed: 31, bend: portrait ? 0.1 : -0.14 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 1.0, 'out'), { color: PG.teal, seed: 41, drop: PG.sap });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 22 * s, K.beat(t, 4.45, 0.5, 'lin'), { size: 62, align: 'center', color: PG.indigo });
        if (portrait) brush(ctx, K.wobble(K.bezier([W / 2, ny + nh + 18 * s], [W / 2, ny + nh + 18 * s], [W / 2, Lo.chips[6][1] - 14 * s], [W / 2, Lo.chips[6][1] - 14 * s], 40), 1.2 * s, 49), K.beat(t, 4.95, 0.45, 'lin'), { width: 9, color: PG.sienna });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.32, 'lin');
          const from = portrait ? [W / 2, cy - 14 * s] : [nx + nw + 18 * s, ny + nh / 2], to = portrait ? [left ? W * 0.42 : W * 0.58, cy - 14 * s] : [cx - 46 * s, cy - 14 * s];
          style.arrow(ctx, from, to, p, { seed: 50 + i, bend: portrait ? 0 : (i - 3) * 0.035 });
          // a little dab of colour for each platform, then its brush-lettered name
          const dx = portrait ? (left ? W * 0.4 : W * 0.6) : cx - 22 * s, lx = portrait ? dx : cx;
          if (!portrait) wash(ctx, `dot${i}:${W}x${H}`, blobPts(dx, cy - 14 * s, 13 * s, 13 * s, 10), DOTS[i], K.beat(t, t0 + 0.2, 0.3, 'out'), { seed: 60 + i, layers: 6 });
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.26, 0.35, 'lin'), { size: portrait ? 46 : 44, align: portrait ? (left ? 'right' : 'left') : 'left', color: DOTS[i] === PG.alizarin ? PG.alizarin : PG.indigo });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.4), {});
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.24 : 128 * s, bx = W / 2 - nw / 2, by = top - nh / 2;
        style.box(ctx, bx, by, nw, nh, K.beat(t, 8.1, 0.8, 'out'), { color: PG.teal, seed: 43, drop: PG.sap });
        style.title(ctx, 'Creator OS', W / 2, top + 22 * s, K.beat(t, 8.25, 0.45, 'lin'), { size: 62, align: 'center' });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], K.beat(t, 8.6, 0.2), { size: portrait ? 116 : 136 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 64 * s, K.beat(t, 8.7, 0.45, 'lin'), { align: 'center', size: 50, color: PG.sienna });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 34 * s, (portrait ? 225 : 250) * s, K.beat(t, 10.0, 0.6, 'lin'), {});
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.95, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, W / 2, (portrait ? H * 0.72 : 640 * s) + i * 90 * s, K.clamp(tp * tk.length - i), { size: portrait ? 74 : 66, align: 'center' }));
        if (t < 8.8) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.4), {});
      }
      ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.8); k.play('swell', 0.1, { dur: 3, chord: ['D4', 'F#4', 'A4'], gain: 0.8 });
      k.play('scribble', 0.15, { medium: 'brush', dur: 1.5 });
      k.play('scribble', 2.0, { medium: 'brush', dur: 1.0, gain: 1.2 }); k.play('scribble', 2.6, { medium: 'brush', dur: 0.4 });
      k.play('scribble', 3.0, { medium: 'brush', dur: 0.5, gain: 0.8 });
      k.play('scribble', 3.45, { medium: 'brush', dur: 0.6 }); k.play('pluck', 4.05, { note: 'A5', gain: 0.6 });
      k.play('scribble', 4.0, { medium: 'brush', dur: 1.0, gain: 1.2 });
      const notes = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6'];
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'brush', dur: 0.32, gain: 0.9 }); k.play('pluck', 5.3 + i * 0.4, { note: notes[i], gain: 0.55 }); }
      k.play('whoosh', 7.4, { dur: 0.9, gain: 0.7 });
      k.play('scribble', 8.1, { medium: 'brush', dur: 0.8 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('pluck', 10.0, { note: 'D6', gain: 0.9 }); k.play('scribble', 10.0, { medium: 'brush', dur: 0.6 });
      k.play('scribble', 10.5, { medium: 'brush', dur: 0.95 }); k.play('chime', 11.4, { note: 'D6' });
    },
  };
  MS.register(style);
})();
