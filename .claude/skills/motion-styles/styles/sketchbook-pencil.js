// Sketchbook Graphite (Hand-Drawn). A graphite study in a spiral sketchbook: faint construction lines that overshoot
// first, confident darker contours over them, directional hatching that breaks on the paper tooth (graphite is a
// grain-tile pattern, so the paper shows through), smudged tone, kneaded-eraser highlights, a value strip and a
// margin note. Numbers are pencilled over their erased ghosts. Scene change = the page turns over.
(function () {
  const GR = { lead: '#2c2c30', mid: '#6b6b70', soft: '#9a9a9e', red: '#a8463c' };
  const HAND = 'Caveat';
  const PAPER = '#f2ede1';
  const S = (W, H) => K.layout(W, H).s;
  const mid = (a, b, k) => [K.lerp(a[0], b[0], k), K.lerp(a[1], b[1], k)];
  const line = (a, b, n = 16) => K.bezier(a, mid(a, b, 0.33), mid(a, b, 0.66), b, n);

  // graphite grain: dark specks with holes where the paper tooth stays white
  function grain(col) {
    return K.cached('sk-grain:' + col, () => {
      const n = 160, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data, nz = K.noise(61), r = K.rng(62), [cr, cg, cb] = K.hex(col);
      for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
        const tooth = nz.n2(i * 0.5, y * 0.5) * 0.5 + nz.n2(i * 0.11, y * 0.13) * 0.35 + (r() - 0.5) * 0.6, o = (y * n + i) * 4;
        d[o] = cr; d[o + 1] = cg; d[o + 2] = cb; d[o + 3] = 255 * K.clamp(0.58 + tooth * 0.9);
      }
      x.putImageData(img, 0, 0); return c;
    });
  }
  const pat = (ctx, col) => ctx.createPattern(grain(col), 'repeat');

  function graphite(ctx, pts, p, o = {}) {
    const q = K.trim(pts, p); if (q.length < 2) return null;
    const s = S(ctx.canvas.width, ctx.canvas.height), w = (o.width || 2.6) * s;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = pat(ctx, o.color || GR.lead);
    ctx.globalAlpha = o.alpha ?? 0.95; ctx.lineWidth = w; K.poly(ctx, q); ctx.stroke();
    // graphite sheen: a thin lighter core where the lead burnished the paper
    ctx.globalAlpha = (o.alpha ?? 1) * 0.5; ctx.lineWidth = w * 0.45; ctx.translate(0.4 * s, -0.4 * s); K.poly(ctx, q); ctx.stroke();
    ctx.restore(); return q[q.length - 1];
  }
  // construction line: long, faint, runs past both ends
  function construct(ctx, a, b, p, seed) {
    const s = S(ctx.canvas.width, ctx.canvas.height), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1, ex = (dx / L) * 26 * s, ey = (dy / L) * 26 * s;
    return graphite(ctx, K.wobble(line([a[0] - ex, a[1] - ey], [b[0] + ex, b[1] + ey]), 0.8 * s, seed, 0.02), p, { width: 1.2, alpha: 0.35, color: GR.mid });
  }
  // directional hatching inside a clip, strokes break on the tooth because they share the grain pattern
  function hatch(ctx, clip, bb, p, o = {}) {
    if (p <= 0) return;
    const s = S(ctx.canvas.width, ctx.canvas.height), r = K.rng(o.seed || 4), sp = (o.spacing || 6) * s, ang = o.angle ?? -1.0;
    ctx.save(); clip(ctx); ctx.clip(); ctx.strokeStyle = pat(ctx, o.color || GR.mid); ctx.lineCap = 'round';
    const cx = bb[0] + bb[2] / 2, cy = bb[1] + bb[3] / 2, R = Math.hypot(bb[2], bb[3]) / 2, ca = Math.cos(ang), sa = Math.sin(ang), n = Math.floor(((2 * R) / sp) * p);
    for (let i = 0; i < n; i++) { const off = -R + i * sp, L = R * r.range(0.4, 1); ctx.globalAlpha = r.range(0.5, 0.95); ctx.lineWidth = r.range(1.2, 2.2) * s;
      ctx.beginPath(); ctx.moveTo(cx - sa * off - ca * L, cy + ca * off - sa * L); ctx.lineTo(cx - sa * off + ca * L * 0.8, cy + ca * off + sa * L * 0.8); ctx.stroke(); }
    ctx.restore();
  }
  function smudge(ctx, x, y, w, h, a) {
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(w, h) / 2);
    g.addColorStop(0, `rgba(90,90,95,${a})`); g.addColorStop(1, 'rgba(90,90,95,0)'); ctx.save(); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
  }
  function write(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 70) * s;
    ctx.save(); ctx.font = K.font(size, HAND, o.weight ?? 700); ctx.textAlign = 'left';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.beginPath(); ctx.rect(x0 - 10 * s, y - size, (w + 20 * s) * K.clamp(p), size * 1.5); ctx.clip();
    ctx.fillStyle = pat(ctx, o.color || GR.lead); ctx.globalAlpha = o.alpha ?? 0.95; ctx.fillText(text, x0, y);
    ctx.globalAlpha = (o.alpha ?? 1) * 0.55; ctx.fillText(text, x0 + 0.7 * s, y + 0.5 * s);
    ctx.restore(); return { w, h: size };
  }

  function paper(W, H, k = 0) {
    return K.cached(`sk-paper:${W}x${H}:${k}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), portrait = H > W, r = K.rng(5 + k);
      x.drawImage(K.paperTex(W, H, PAPER, 71 + k, 0.045, false), 0, 0);
      // paper tooth: tiny pits that catch the light
      { const t = r; x.fillStyle = 'rgba(120,110,95,0.07)'; for (let i = 0; i < (W * H) / (90 * s * s); i++) x.fillRect(t() * W, t() * H, 1.4 * s, 1.4 * s); x.fillStyle = 'rgba(255,255,250,0.25)'; for (let i = 0; i < (W * H) / (140 * s * s); i++) x.fillRect(t() * W, t() * H, 1.2 * s, 1.2 * s); }
      // spiral binding: punched holes + wire coils (left edge, or top in portrait)
      const n = portrait ? 18 : 16;
      for (let i = 0; i < n; i++) {
        const f = (i + 0.5) / n, hx = portrait ? f * W : 26 * s, hy = portrait ? 26 * s : f * H;
        x.fillStyle = '#2d2a27'; x.beginPath(); x.ellipse(portrait ? hx : hx + 16 * s, portrait ? hy + 16 * s : hy, 6 * s, 6 * s, 0, 0, Math.PI * 2); x.fill();
        x.strokeStyle = '#8e8f93'; x.lineWidth = 4 * s; x.beginPath();
        if (portrait) x.ellipse(hx, hy, 9 * s, 22 * s, 0.25, Math.PI * 0.6, Math.PI * 2.1); else x.ellipse(hx, hy, 22 * s, 9 * s, -0.25, Math.PI * 1.1, Math.PI * 2.6);
        x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 1.4 * s; x.stroke();
      }
      const g = portrait ? x.createLinearGradient(0, 0, 0, 90 * s) : x.createLinearGradient(0, 0, 90 * s, 0);
      g.addColorStop(0, 'rgba(60,50,40,0.18)'); g.addColorStop(1, 'rgba(60,50,40,0)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      // old erased marks + a few stray smudges
      for (let i = 0; i < 7; i++) { const cx = r.range(0.15, 0.95) * W, cy = r.range(0.1, 0.95) * H, rr = r.range(30, 90) * s; const gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); gg.addColorStop(0, 'rgba(110,110,115,0.05)'); gg.addColorStop(1, 'rgba(110,110,115,0)'); x.fillStyle = gg; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      // value strip and margin note in the corner (study furniture)
      const vx = portrait ? W * 0.56 : W - 300 * s, vy = portrait ? H - 90 * s : H - 70 * s, sw = 44 * s;
      [0.1, 0.28, 0.48, 0.7, 0.92].forEach((a, i) => { x.save(); x.globalAlpha = a; x.fillStyle = x.createPattern(grain(GR.lead), 'repeat'); x.fillRect(vx + i * (sw + 6 * s), vy, sw, 28 * s); x.restore(); x.strokeStyle = 'rgba(70,70,75,0.35)'; x.lineWidth = 1; x.strokeRect(vx + i * (sw + 6 * s), vy, sw, 28 * s); });
      x.font = K.font(30 * s, HAND, 400); x.fillStyle = 'rgba(80,80,85,0.65)'; x.fillText(k ? 'sketch no. 8' : 'sketch no. 7', portrait ? W * 0.08 : 110 * s, portrait ? H - 60 * s : H - 40 * s);
      return c;
    });
  }

  function pencil(ctx, at, s) {
    if (!at) return;
    ctx.save(); ctx.translate(at[0], at[1]); ctx.rotate(-0.95); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(40,30,20,0.15)'; ctx.fillRect(14, 10, 230, 14);
    ctx.fillStyle = '#2e2e30'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(10, -3); ctx.lineTo(10, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e2c49a'; ctx.beginPath(); ctx.moveTo(10, -3); ctx.lineTo(40, -9); ctx.lineTo(40, 9); ctx.lineTo(10, 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#2f5a3a'; ctx.fillRect(40, -9, 190, 18); ctx.fillStyle = '#3d7550'; ctx.fillRect(40, -9, 190, 6); ctx.fillStyle = '#21402a'; ctx.fillRect(40, 4, 190, 5);
    ctx.fillStyle = '#c9c9c4'; ctx.fillRect(230, -9, 16, 18);
    ctx.restore();
  }

  const style = {
    id: 'sketchbook-pencil', name: 'Sketchbook Graphite', family: 'Hand-Drawn',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&display=block', specs: ['700 70px "Caveat"', '400 40px "Caveat"'] }],
    palette: { bg: PAPER, ink: GR.lead, mid: GR.mid, soft: GR.soft, accent: GR.red },
    sfx: { draw: 'pencil', land: 'tick', emphasis: 'paper', transition: 'whoosh', bed: 'room' },
    setup(W, H) { paper(W, H, 0); paper(W, H, 1); Object.values(GR).forEach(grain); },

    background(ctx, W, H, t, o = {}) { ctx.drawImage(paper(W, H, o.page || 0), 0, 0); },
    finish(ctx, W, H, t) {
      // soft north light, graphite-dust grain
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,252,240,0.08)'); g.addColorStop(1, 'rgba(50,45,40,0.12)');
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.22, '#3a3328');
      K.grain(ctx, W, H, t, 0.04, 24, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return write(ctx, text, x, y, p, { size: 74, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return write(ctx, text, x, y, p, { size: 42, weight: 700, color: GR.lead, ...o }); },

    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      const pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.16, 32), 1.4 * s, o.seed || 3, 0.04);
      construct(ctx, from, to, K.clamp(p / 0.4), (o.seed || 3) + 1);
      const e = graphite(ctx, pts, K.clamp((p - 0.2) / 0.65), { width: 2.8, color: o.color });
      if (p > 0.85) { const k = K.clamp((p - 0.85) / 0.15), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 20 * s;
        for (const sg of [-1, 1]) graphite(ctx, line(b, [b[0] - Math.cos(ang + sg * 0.5) * L, b[1] - Math.sin(ang + sg * 0.5) * L], 6), k, { width: 2.8, color: o.color }); }
      return e;
    },

    // construction lines -> firm contour -> hatched shadow side + smudge -> kneaded-eraser highlight
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), sd = o.seed || 5, d = 14 * s;
      const c1 = K.clamp(p / 0.3), c2 = K.clamp((p - 0.25) / 0.4), c3 = K.clamp((p - 0.6) / 0.4);
      construct(ctx, [x, y], [x + w, y], c1, sd); construct(ctx, [x, y + h], [x + w, y + h], c1, sd + 1);
      construct(ctx, [x, y], [x, y + h], c1, sd + 2); construct(ctx, [x + w, y], [x + w, y + h], c1, sd + 3);
      if (c3 > 0) {
        smudge(ctx, x + w - 10 * s, y + h - 10 * s, d * 3, d * 3, 0.12 * c3); smudge(ctx, x + 10 * s, y + h, w, d * 2.4, 0.1 * c3);
        hatch(ctx, (c) => { c.beginPath(); c.moveTo(x + w, y + d); c.lineTo(x + w + d, y + d); c.lineTo(x + w + d, y + h + d); c.lineTo(x + d, y + h + d); c.lineTo(x + d, y + h); c.lineTo(x + w, y + h); c.closePath(); }, [x, y, w + d, h + d], c3, { seed: sd, spacing: 4.5, angle: -1.05 });
        // tone across the face, then a kneaded-eraser lift near the top-left
        hatch(ctx, (c) => { c.beginPath(); c.rect(x, y, w, h); }, [x, y, w, h], c3 * 0.55, { seed: sd + 7, spacing: 9, angle: -0.95, color: GR.soft });
        ctx.save(); const g = ctx.createRadialGradient(x + w * 0.25, y + h * 0.3, 0, x + w * 0.25, y + h * 0.3, Math.min(w, h) * 0.6);
        g.addColorStop(0, K.rgba(PAPER, 0.85 * c3)); g.addColorStop(1, K.rgba(PAPER, 0)); ctx.fillStyle = g; ctx.fillRect(x, y, w, h); ctx.restore();
      }
      return graphite(ctx, K.wobble(K.rectPts(x, y, w, h).flatMap((pt, i, A) => (i ? line(A[i - 1], pt, 10).slice(1) : [pt])), 1.2 * s, sd, 0.04), c2, { width: 3 });
    },

    // pencilled over the erased ghosts of the last few values
    counter(ctx, value, x, y, p, o = {}) {
      const step = o.step || 125000;
      for (let k = 1; k <= 2; k++) { const prev = Math.max(0, Math.floor(value / step - k) * step); if (prev > 0 && prev < value) write(ctx, K.fmt(prev), x + k * 3, y - k * 2, 1, { size: o.size || 128, align: o.align || 'center', alpha: 0.08 }); }
      return write(ctx, K.fmt(value), x, y, 1, { size: o.size || 128, align: o.align || 'center', color: o.color || GR.lead });
    },

    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      for (let i = 0; i < 2; i++) graphite(ctx, K.wobble(K.circlePts(x, y, r * (1.22 + i * 0.04), r * (0.6 + i * 0.03), 70, -2.6 + i * 0.5, Math.PI * 2.15), 2.5 * s, 13 + i, 0.03), K.clamp(p * 2 - i), { width: 3.4 - i, color: o.color || GR.lead });
      // a hatched arrow-flag pointing at it from the corner, the way an artist flags the good one
      if (p > 0.6) write(ctx, 'yes!', x + r * 0.98, y - r * 0.6, K.clamp((p - 0.6) / 0.4), { size: 46, color: GR.red, weight: 700 });
    },

    // page turn: the sheet lifts at the right edge and folds over to the left, showing its back and the fresh page
    transition(ctx, W, H, p, o = {}) {
      if (p >= 0.5) return;
      const s = S(W, H), k = K.ease.inOut(K.clamp(p / 0.5)), fx = K.lerp(W, 0, k), back = Math.sin(Math.PI * k) * W * 0.18 + 2;
      ctx.save();
      ctx.save(); ctx.beginPath(); ctx.rect(fx, 0, W - fx, H); ctx.clip(); ctx.drawImage(paper(W, H, 1), 0, 0);
      const sh = ctx.createLinearGradient(fx, 0, fx + 60 * s, 0); sh.addColorStop(0, 'rgba(40,30,20,0.35)'); sh.addColorStop(1, 'rgba(40,30,20,0)'); ctx.fillStyle = sh; ctx.fillRect(fx, 0, 60 * s, H); ctx.restore();
      // back of the turning sheet: a curled band left of the fold
      const g = ctx.createLinearGradient(fx - back, 0, fx, 0); g.addColorStop(0, '#d9d2c2'); g.addColorStop(0.7, '#efe9dc'); g.addColorStop(1, '#c9c1b0');
      ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(fx, 0); ctx.quadraticCurveTo(fx - back * 1.15, H * 0.5, fx, H); ctx.lineTo(fx - back, H); ctx.quadraticCurveTo(fx - back * 1.35, H * 0.5, fx - back, 0); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = 'rgba(60,50,40,0.25)'; ctx.lineWidth = 1.5 * s; ctx.stroke();
      ctx.restore();
    },
  };

  // ---------- demo: a study on one spread ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [150 * s, 290 * s, 250 * s, 150 * s], node: [500 * s, 300 * s, 290 * s, 130 * s],
      chips: PLATFORMS.map((n, i) => [1010 * s, (170 + i * 70) * s]), title: [680 * s, 118 * s], counter: [W / 2, 410 * s] };
    return { s, video: [W * 0.25, H * 0.2, W * 0.5, H * 0.12], node: [W * 0.17, H * 0.405, W * 0.66, H * 0.075],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.58 + Math.floor(i / 2) * 0.078)]), title: [W / 2, H * 0.1], counter: [W / 2, H * 0.48] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W, scene2 = t >= 8.0;
      style.background(ctx, W, H, t, { page: scene2 ? 1 : 0 });
      let tip = null; const track = (pt, p) => { if (p > 0 && p < 1 && pt) tip = pt; };
      if (!scene2) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.15, 1.4, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 78 * s, K.clamp(tp * tt.length - i), { size: portrait ? 64 : 72, align: 'center' }));
        const [vx, vy, vw, vh] = Lo.video, bp = K.beat(t, 2.0, 1.0, 'lin'); track(style.box(ctx, vx, vy, vw, vh, bp, { seed: 21 }), bp);
        if (t > 2.7) { const pp = K.beat(t, 2.7, 0.35, 'lin'); track(graphite(ctx, [[vx + vw * 0.42, vy + vh * 0.27], [vx + vw * 0.42, vy + vh * 0.73], [vx + vw * 0.62, vy + vh * 0.5], [vx + vw * 0.42, vy + vh * 0.27]].flatMap((pt, i, A) => (i ? line(A[i - 1], pt, 8).slice(1) : [pt])), pp, { width: 3.4 }), pp); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 52 * s, K.beat(t, 3.05, 0.45, 'lin'), { align: 'center', color: GR.mid });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 72 * s], [nx + nw / 2, ny - 16 * s]] : [[vx + vw + 20 * s, vy + vh / 2], [nx - 18 * s, ny + nh / 2]];
        const ap = K.beat(t, 3.45, 0.6, 'lin'); track(style.arrow(ctx, a1[0], a1[1], ap, { seed: 31, bend: portrait ? 0.1 : -0.15 }), ap);
        const np = K.beat(t, 4.0, 0.9, 'lin'); track(style.box(ctx, nx, ny, nw, nh, np, { seed: 41 }), np);
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 20 * s, K.beat(t, 4.5, 0.45, 'lin'), { size: 58, align: 'center' });
        if (portrait) { const yl = Lo.chips[6][1] - 12 * s, p2 = K.beat(t, 4.95, 0.45, 'lin'); track(graphite(ctx, K.wobble(line([W / 2, ny + nh + 16 * s], [W / 2, yl], 24), 1.2 * s, 49), p2, { width: 2.8 }), p2); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.32, 'lin');
          const from = portrait ? [W / 2, cy - 12 * s] : [nx + nw + 18 * s, ny + nh / 2], to = portrait ? [left ? W * 0.45 : W * 0.55, cy - 12 * s] : [cx - 18 * s, cy - 12 * s];
          track(style.arrow(ctx, from, to, p, { seed: 50 + i, bend: portrait ? 0 : (i - 3) * 0.035 }), p);
          style.label(ctx, name, portrait ? (left ? W * 0.43 : W * 0.57) : cx, cy, K.beat(t, t0 + 0.27, 0.3, 'lin'), { size: portrait ? 44 : 42, align: portrait ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.2), {});
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.24 : 130 * s, bx = W / 2 - nw / 2, by = top - nh / 2;
        const bp = K.beat(t, 8.0, 0.55, 'lin'); track(style.box(ctx, bx, by, nw, nh, bp, { seed: 41 }), bp);
        style.title(ctx, 'Creator OS', W / 2, top + 20 * s, K.beat(t, 8.25, 0.35, 'lin'), { size: 58, align: 'center' });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t >= 8.6) style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 110 : 132 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 62 * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', size: 48, color: GR.mid });
        const ep = K.beat(t, 10.0, 0.6, 'lin');
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 34 * s, (portrait ? 220 : 240) * s, ep, {});
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.95, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, W / 2, (portrait ? H * 0.72 : 628 * s) + i * 84 * s, K.clamp(tp * tk.length - i), { size: portrait ? 70 : 66, align: 'center' }));
        if (tp > 0 && tp < 1) tip = null;
      }
      pencil(ctx, tip, s);
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.9);
      k.play('scribble', 0.15, { medium: 'pencil', dur: 1.4, gain: 1.3 });
      k.play('scribble', 2.0, { medium: 'pencil', dur: 1.0, gain: 1.2 }); k.play('scribble', 2.7, { medium: 'pencil', dur: 0.35, gain: 1.2 });
      k.play('scribble', 3.05, { medium: 'pencil', dur: 0.45 });
      k.play('scribble', 3.45, { medium: 'pencil', dur: 0.6, gain: 1.2 }); k.play('tick', 4.05);
      k.play('scribble', 4.0, { medium: 'pencil', dur: 0.95, gain: 1.3 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pencil', dur: 0.32, gain: 1.1 }); k.play('tick', 5.3 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('paper', 7.4, { dur: 0.35 }); k.play('whoosh', 7.5, { dur: 0.55, gain: 0.6 }); k.play('paper', 7.95, { dur: 0.2 });
      k.play('scribble', 8.0, { medium: 'pencil', dur: 0.6, gain: 1.2 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('paper', 10.0, { dur: 0.25, gain: 1.4 }); k.play('scribble', 10.0, { medium: 'pencil', dur: 0.6, gain: 1.3 });
      k.play('scribble', 10.5, { medium: 'pencil', dur: 0.95, gain: 1.2 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
