// Ballpoint Notebook (Hand-Drawn). A blue Bic doodle on college-ruled paper: pressure-varied lines with an ink blob
// where each stroke starts, crosshatched drop shadows built pass by pass, bubble lettering with a hatched shadow,
// compulsive margin doodles traced over and over, three punched holes and a red margin rule.
// Scene change = the page is torn out of the pad along a ragged perforation.
(function () {
  const INK = { blue: '#1f3a9c', dark: '#16286e', red: '#c4302b' };
  const BUB = 'Fredoka', HAND = 'Gloria Hallelujah';
  const PAPER = '#fbfbf6', RULE = 'rgba(90,150,210,0.55)';
  const S = (W, H) => K.layout(W, H).s;
  const geo = (W, H) => { const s = S(W, H), p = H > W; return { s, rule: (p ? 30 : 34) * s, top: (p ? 150 : 88) * s, margin: p ? W * 0.14 : 150 * s, holeX: p ? W * 0.055 : 50 * s }; };

  // Ballpoint line: width and darkness follow seeded "pressure", blob at the start, slight skip on fast parts.
  function pen(ctx, pts, p, o = {}) {
    const q = K.trim(pts, p); if (q.length < 2) return null;
    const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || INK.blue, w = (o.width || 2.4) * s, nz = K.noise(o.seed || 1);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col;
    let d = 0;
    for (let i = 1; i < q.length; i++) {
      const a = q[i - 1], b = q[i]; d += Math.hypot(b[0] - a[0], b[1] - a[1]);
      const pr = 0.6 + 0.4 * (nz.n2(d * 0.02, 0.5) * 0.5 + 0.5);
      ctx.globalAlpha = 0.55 + 0.45 * pr; ctx.lineWidth = w * (0.55 + 0.6 * pr);
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    }
    ctx.globalAlpha = 0.9; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(q[0][0], q[0][1], w * 0.95, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return q[q.length - 1];
  }
  const dense = (pts, n = 6) => pts.flatMap((pt, i) => (i ? K.bezier(pts[i - 1], pts[i - 1], pt, pt, n).slice(1) : [pt]));

  // Hatch tile for bubble-letter shadows (pattern fill = hatched text without per-string caching).
  const hatchTile = (col, cross) => K.cached(`bn-hatch:${col}:${cross}`, () => {
    const n = 24, c = K.layer(n, n), x = c.getContext('2d'); x.strokeStyle = col; x.lineWidth = 1.6; x.globalAlpha = 0.95;
    for (let k = -n; k <= n * 2; k += 4) { x.beginPath(); x.moveTo(k, n); x.lineTo(k + n, 0); x.stroke(); if (cross) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + n, n); x.stroke(); } }
    return c;
  });
  // Crosshatch a region (a clip path function), pass by pass: p 0..1 grows passes and line count.
  function hatch(ctx, clip, bb, p, o = {}) {
    if (p <= 0) return;
    const s = S(ctx.canvas.width, ctx.canvas.height), sp = (o.spacing || 7) * s, r = K.rng(o.seed || 3);
    const angles = o.angles || [-0.8, 0.75, -0.2];
    ctx.save(); clip(ctx); ctx.clip(); ctx.strokeStyle = o.color || INK.blue; ctx.lineCap = 'round';
    angles.forEach((ang, k) => {
      const pk = K.clamp(p * angles.length - k); if (pk <= 0) return;
      const cx = bb[0] + bb[2] / 2, cy = bb[1] + bb[3] / 2, R = Math.hypot(bb[2], bb[3]) / 2, ca = Math.cos(ang), sa = Math.sin(ang);
      const n = Math.floor(((2 * R) / sp) * pk);
      for (let i = 0; i < n; i++) {
        const off = -R + i * sp + r.range(-1, 1) * s, L = R * r.range(0.9, 1.05);
        ctx.globalAlpha = r.range(0.45, 0.85); ctx.lineWidth = r.range(0.9, 1.6) * s;
        ctx.beginPath(); ctx.moveTo(cx - sa * off - ca * L, cy + ca * off - sa * L); ctx.lineTo(cx - sa * off + ca * L, cy + ca * off + sa * L); ctx.stroke();
      }
    });
    ctx.restore();
  }

  function bubble(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 64) * s, col = o.color || INK.blue, off = size * 0.085;
    ctx.save(); ctx.font = K.font(size, BUB, 700); ctx.textAlign = o.align || 'left'; if (o.spacing) ctx.letterSpacing = o.spacing * s + 'px';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    // pen writes left to right: reveal clip, plus a later pass that adds the hatched shadow
    ctx.beginPath(); ctx.rect(x0 - 20 * s, y - size * 1.2, (w + 40 * s) * K.clamp(p * 1.25), size * 1.7); ctx.clip();
    const sh = K.clamp((p - 0.35) / 0.65);
    if (sh > 0) { ctx.globalAlpha = sh; ctx.fillStyle = ctx.createPattern(hatchTile(col, o.cross), 'repeat'); ctx.fillText(text, x + off, y + off); ctx.globalAlpha = 1; }
    ctx.fillStyle = PAPER; ctx.fillText(text, x, y);
    ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = 3.2 * s; ctx.globalAlpha = 0.92; ctx.strokeText(text, x, y);
    ctx.globalAlpha = 0.35; ctx.lineWidth = 1.2 * s; ctx.strokeText(text, x + 1.4 * s, y - 1 * s);
    ctx.restore(); return { w, h: size };
  }
  function hand(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 34) * s;
    ctx.save(); ctx.font = K.font(size, HAND, 400); ctx.textAlign = 'left';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, n = Math.ceil(text.length * K.clamp(p));
    ctx.fillStyle = o.color || INK.blue; ctx.globalAlpha = 0.92; ctx.fillText(text.slice(0, n), x0, y);
    ctx.globalAlpha = 0.3; ctx.fillText(text.slice(0, n), x0 + 0.8 * s, y + 0.5 * s);
    ctx.restore(); return { w, h: size };
  }

  function page(W, H, k = 0) {
    return K.cached(`bn-page:${W}x${H}:${k}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), G = geo(W, H), s = G.s, r = K.rng(40 + k);
      x.drawImage(K.paperTex(W, H, PAPER, 51 + k, 0.025, true), 0, 0);
      const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0.06)'); g.addColorStop(0.08, 'rgba(0,0,0,0)'); g.addColorStop(0.92, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.05)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      x.strokeStyle = RULE; x.lineWidth = 1.2 * s;
      for (let y = G.top; y < H - 6 * s; y += G.rule) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
      x.strokeStyle = 'rgba(215,70,80,0.6)'; x.lineWidth = 1.5 * s; x.beginPath(); x.moveTo(G.margin, 0); x.lineTo(G.margin, H); x.stroke();
      x.beginPath(); x.moveTo(G.margin + 4 * s, 0); x.lineTo(G.margin + 4 * s, H); x.globalAlpha = 0.5; x.stroke(); x.globalAlpha = 1;
      // punched holes showing the dark desk through the page
      for (const fy of [0.16, 0.5, 0.84]) {
        const hy = H * fy, R = 15 * s;
        x.fillStyle = '#3b3f46'; x.beginPath(); x.arc(G.holeX, hy, R, 0, Math.PI * 2); x.fill();
        x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2 * s; x.beginPath(); x.arc(G.holeX + 1 * s, hy + 1 * s, R, Math.PI * 0.9, Math.PI * 1.9); x.stroke();
      }
      // margin doodles, each traced over several times
      const tr = (pts, times = 3, sd = 1, col = INK.blue) => { for (let i = 0; i < times; i++) pen(x, K.wobble(dense(pts, 5), 1.4 * s, sd * 10 + i, 0.06), 1, { width: 1.8, seed: sd * 10 + i, color: col }); };
      const mx = G.holeX + (G.margin - G.holeX) / 2;
      const star = (cx, cy, R) => { const pts = []; for (let i = 0; i <= 5; i++) { const a = -Math.PI / 2 + i * ((Math.PI * 4) / 5); pts.push([cx + Math.cos(a) * R, cy + Math.sin(a) * R]); } return pts; };
      const spiral = (cx, cy, R) => Array.from({ length: 60 }, (_, i) => { const a = i * 0.32, rr = (R * i) / 60; return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]; });
      const cube = (cx, cy, R) => [[cx - R, cy - R * 0.4], [cx + R * 0.5, cy - R * 0.4], [cx + R * 0.5, cy + R], [cx - R, cy + R], [cx - R, cy - R * 0.4], [cx - R * 0.5, cy - R], [cx + R, cy - R], [cx + R, cy + R * 0.4], [cx + R * 0.5, cy + R], [cx + R * 0.5, cy - R * 0.4], [cx + R, cy - R]];
      const zig = (cx, cy, R) => [[cx - R, cy], [cx - R * 0.5, cy - R * 0.5], [cx, cy], [cx + R * 0.5, cy - R * 0.5], [cx + R, cy]];
      const D = [[star, 0.3], [zig, 0.4], [cube, 0.62], [spiral, 0.72], [star, 0.95]];
      D.forEach(([f, fy], i) => tr(f(mx, H * fy, 24 * s), 4, i + 2));
      if (k === 0) { tr(spiral(W - 70 * s, H - 70 * s, 26 * s), 2, 9); }
      return c;
    });
  }

  const style = {
    id: 'ballpoint-notebook', name: 'Ballpoint Notebook', family: 'Hand-Drawn',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@600;700&family=Gloria+Hallelujah&display=block', specs: ['700 64px "Fredoka"', '400 34px "Gloria Hallelujah"'] }],
    palette: { bg: PAPER, ink: INK.blue, dark: INK.dark, accent: INK.red, rule: '#5a96d2' },
    sfx: { draw: 'pen', land: 'tick', emphasis: 'pluck', transition: 'paper', bed: 'room' },
    setup(W, H) { page(W, H, 0); page(W, H, 1); },

    background(ctx, W, H, t, o = {}) { ctx.drawImage(page(W, H, o.page || 0), 0, 0); },

    finish(ctx, W, H, t) {
      // desk lamp falloff across the page, fine paper grain
      const g = ctx.createRadialGradient(W * 0.6, H * 0.35, 0, W * 0.6, H * 0.4, Math.hypot(W, H) * 0.65);
      g.addColorStop(0, 'rgba(255,250,235,0.0)'); g.addColorStop(1, 'rgba(60,60,80,0.18)');
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.grain(ctx, W, H, t, 0.03, 24, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return bubble(ctx, text, x, y, p, { size: 62, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return hand(ctx, text, x, y, p, { size: 34, ...o }); },

    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || INK.blue;
      const pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.18, 36), 1.6 * s, o.seed || 3, 0.05);
      const e = pen(ctx, pts, K.clamp(p / 0.8), { color: col, width: 2.6, seed: o.seed });
      if (p > 0.6) pen(ctx, K.wobble(pts, 1.2 * s, (o.seed || 3) + 5), K.clamp((p - 0.6) / 0.4), { color: col, width: 1.6, seed: (o.seed || 3) + 5 });
      if (p > 0.8) {
        const k = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 20 * s;
        const tri = [b, [b[0] - Math.cos(ang - 0.45) * L, b[1] - Math.sin(ang - 0.45) * L], [b[0] - Math.cos(ang + 0.45) * L, b[1] - Math.sin(ang + 0.45) * L], b];
        pen(ctx, dense(tri, 4), k, { color: col, width: 2.4, seed: 77 });
        if (k >= 1) { ctx.save(); ctx.fillStyle = K.rgba(col, 0.7); K.poly(ctx, tri, true); ctx.fill(); ctx.restore(); }
      }
      return e;
    },

    // double-traced outline with a crosshatched drop shadow down and to the right
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || INK.blue, d = (o.depth || 12) * s, sd = o.seed || 5;
      const sh = K.clamp((p - 0.5) / 0.5);
      hatch(ctx, (c) => { c.beginPath(); c.moveTo(x + w, y + d); c.lineTo(x + w + d, y + d); c.lineTo(x + w + d, y + h + d); c.lineTo(x + d, y + h + d); c.lineTo(x + d, y + h); c.lineTo(x + w, y + h); c.closePath(); }, [x, y, w + d, h + d], sh, { seed: sd, color: col, spacing: 5 });
      const e = pen(ctx, K.wobble(dense(K.rectPts(x, y, w, h), 8), 1.3 * s, sd, 0.05), K.clamp(p * 2), { color: col, width: 2.6, seed: sd });
      if (p > 0.3) pen(ctx, K.wobble(dense(K.rectPts(x + 2 * s, y - 1.5 * s, w - 1 * s, h + 2 * s), 8), 1.8 * s, sd + 9, 0.05), K.clamp((p - 0.3) / 0.4), { color: col, width: 1.6, seed: sd + 9 });
      return e;
    },

    counter(ctx, value, x, y, p, o = {}) { return bubble(ctx, K.fmt(value), x, y, 1, { size: o.size || 120, align: o.align || 'center', color: o.color || INK.blue, cross: true }); },

    // red pen: loop, loop, loop, the way a margin gets circled during a boring lecture
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || INK.red;
      for (let i = 0; i < 3; i++) {
        const pts = K.wobble(K.circlePts(x, y, r * (1.2 + i * 0.035), r * (0.6 + i * 0.025), 70, -2.5 + i * 0.4, Math.PI * 2.1), 3 * s, 13 + i, 0.03);
        pen(ctx, pts, K.clamp(p * 3 - i), { color: col, width: 2.6, seed: 13 + i });
      }
    },

    // tear the page out of the pad: the ragged tear sweeps right to left, the clean next page shows behind it
    transition(ctx, W, H, p, o = {}) {
      if (p >= 0.5) return;
      const s = S(W, H), k = K.ease.inOut(K.clamp(p / 0.5)), r = K.rng(o.seed || 77), nx = K.lerp(W + 60 * s, -80 * s, k);
      const edge = []; for (let y = 0; y <= H; y += 10 * s) edge.push([nx + (y / H) * 70 * s + r.range(-7, 7) * s, y]);
      ctx.save();
      // next page (clean, ruled) to the right of the tear
      ctx.beginPath(); ctx.moveTo(W + 10, 0); edge.forEach((pt) => ctx.lineTo(pt[0], pt[1])); ctx.lineTo(W + 10, H); ctx.closePath();
      ctx.save(); ctx.clip(); ctx.drawImage(page(W, H, 1), 0, 0); ctx.restore();
      // the torn-away sheet lifts: shadow and the white fibrous tear strip
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 16 * s; K.poly(ctx, edge.map(([a, b]) => [a - 10 * s, b])); ctx.stroke();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 6 * s; K.poly(ctx, edge.map(([a, b]) => [a - 3 * s, b])); ctx.stroke();
      ctx.strokeStyle = 'rgba(200,200,190,0.7)'; ctx.lineWidth = 1 * s; K.poly(ctx, edge); ctx.stroke();
      ctx.restore();
    },
  };

  // ---------- demo: doodled in the back of the notebook ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const G = geo(W, H), s = G.s;
    if (H <= W) { const ry = (i) => G.top + G.rule * i; return { G, s, video: [205 * s, ry(7), 240 * s, G.rule * 5], node: [530 * s, ry(7), 280 * s, G.rule * 5],
      chips: PLATFORMS.map((n, i) => [995 * s, ry(4 + i * 2) - 6 * s]), title: [700 * s, 124 * s], counter: [700 * s, 476 * s] }; }
    const ry = (i) => G.top + G.rule * i, cx = W * 0.57;
    return { G, s, cx, video: [cx - W * 0.22, ry(9), W * 0.44, G.rule * 5], node: [cx - W * 0.3, ry(20), W * 0.6, G.rule * 3],
      chips: PLATFORMS.map((n, i) => [i % 2 ? cx + W * 0.07 : cx - W * 0.07, ry(29 + Math.floor(i / 2) * 5) - 6 * s]), title: [cx, H * 0.085], counter: [cx, ry(25)] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W, G = Lo.G, CX = portrait ? Lo.cx : 700 * s;
      const scene2 = t >= 8.0;
      style.background(ctx, W, H, t, { page: scene2 ? 1 : 0 });
      if (!scene2) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.15, 1.6, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 78 * s, K.clamp(tp * tt.length - i), { size: portrait ? 54 : 58, align: 'center' }));
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 1.0, 'lin'), { seed: 21 });
        if (t > 2.6) pen(ctx, dense([[vx + vw * 0.42, vy + vh * 0.25], [vx + vw * 0.42, vy + vh * 0.75], [vx + vw * 0.63, vy + vh * 0.5], [vx + vw * 0.42, vy + vh * 0.25]], 6), K.beat(t, 2.6, 0.35, 'lin'), { width: 2.8, seed: 22, color: INK.red });
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + (portrait ? G.rule * 2 : G.rule * 2) - 8 * s, K.beat(t, 3.0, 0.45, 'lin'), { align: 'center' });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[CX, vy + vh + G.rule * 2 + 8 * s], [CX, ny - 12 * s]] : [[vx + vw + 22 * s, vy + vh / 2], [nx - 14 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.45, 0.6, 'lin'), { seed: 31, bend: portrait ? 0.1 : -0.15 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.9, 'lin'), { seed: 41 });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 16 * s, K.beat(t, 4.45, 0.5, 'lin'), { size: portrait ? 46 : 44, align: 'center' });
        if (portrait) pen(ctx, K.wobble(dense([[CX, ny + nh + 16 * s], [CX, Lo.chips[6][1] - 12 * s]], 20), 1.2 * s, 49), K.beat(t, 4.95, 0.45, 'lin'), { width: 2.4, seed: 49 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'lin');
          const from = portrait ? [CX, cy - 12 * s] : [nx + nw + 20 * s, ny + nh / 2], to = portrait ? [left ? CX - W * 0.05 : CX + W * 0.05, cy - 12 * s] : [cx - 16 * s, cy - 10 * s];
          style.arrow(ctx, from, to, p, { seed: 50 + i, bend: portrait ? 0 : (i - 3) * 0.04 });
          style.label(ctx, name, portrait ? (left ? cx : cx) : cx, cy, K.beat(t, t0 + 0.26, 0.3, 'lin'), { size: portrait ? 34 : 34, align: portrait ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.5) style.transition(ctx, W, H, K.clamp((t - 7.5) / 1.0), {});
      } else {
        const [, , nw] = Lo.node, nh = G.rule * (portrait ? 3 : 4), top = portrait ? G.top + G.rule * 6 : G.top + G.rule * 1, bx = CX - nw / 2;
        style.box(ctx, bx, top, nw, nh, K.beat(t, 8.0, 0.5, 'lin'), { seed: 41 });
        style.title(ctx, 'Creator OS', CX, top + nh / 2 + 16 * s, K.beat(t, 8.2, 0.4, 'lin'), { size: portrait ? 46 : 44, align: 'center' });
        const v = K.count(t, 8.6, 1.4, 0, 1000000), cy = portrait ? H * 0.47 : Lo.counter[1];
        if (t >= 8.6) style.counter(ctx, Math.round(v / 1000) * 1000, CX, cy, 1, { size: portrait ? 104 : 124 });
        style.label(ctx, 'views', CX, cy + (portrait ? 62 : 58) * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', size: 40 });
        style.emphasis(ctx, CX, cy - 32 * s, (portrait ? 220 : 228) * s, K.beat(t, 10.0, 0.55, 'lin'), {});
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.95, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, CX, (portrait ? H * 0.74 : 640 * s) + i * 82 * s, K.clamp(tp * tk.length - i), { size: portrait ? 56 : 52, align: 'center' }));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.9);
      k.play('scribble', 0.15, { medium: 'pen', dur: 1.6 });
      k.play('scribble', 2.0, { medium: 'pen', dur: 1.0 }); k.play('scribble', 2.6, { medium: 'pen', dur: 0.35 });
      k.play('scribble', 3.0, { medium: 'pen', dur: 0.45, gain: 0.7 });
      k.play('scribble', 3.45, { medium: 'pen', dur: 0.6 }); k.play('tick', 4.05);
      k.play('scribble', 4.0, { medium: 'pen', dur: 0.95 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.32, gain: 0.8 }); k.play('tick', 5.3 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('paper', 7.5, { dur: 0.5, gain: 1.6 }); k.play('paper', 7.75, { dur: 0.3, gain: 1.2 }); k.play('whoosh', 7.7, { dur: 0.4, gain: 0.4 });
      k.play('scribble', 8.0, { medium: 'pen', dur: 0.6 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('pluck', 10.0, { note: 'G5' }); k.play('scribble', 10.0, { medium: 'pen', dur: 0.55 });
      k.play('scribble', 10.5, { medium: 'pen', dur: 0.95 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
