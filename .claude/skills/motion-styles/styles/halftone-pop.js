// Halftone Pop Panel (Print). A blown-up Lichtenstein comic panel: fat tapering black brush outlines, mechanical
// Ben-Day dot fields, flat process yellow, Bangers lettering slammed in word by word, a MEANWHILE caption wipe,
// and an off-register newsprint finish (paper tooth, a cyan/magenta plate ghost, warm aged stock).
(function () {
  const C = { paper: '#fbf2da', black: '#141414', yellow: '#ffd21f', red: '#e2231a', blue: '#1d5bd0', skin: '#f05a5a', white: '#fffaf0' };
  const FONT = 'Bangers';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // Ben-Day dot tile: staggered dots of `col` on `bg` (pitch px). Cached per size; returned as a pattern.
  function dots(ctx, col, bg, pitch, rad) {
    const key = `ht-dots:${col}:${bg}:${pitch.toFixed(1)}:${rad.toFixed(2)}`;
    const tile = K.cached(key, () => {
      const n = Math.max(4, Math.round(pitch)), c = K.layer(n * 2, n * 2), x = c.getContext('2d');
      if (bg) { x.fillStyle = bg; x.fillRect(0, 0, n * 2, n * 2); }
      x.fillStyle = col;
      for (const [cx, cy] of [[0, 0], [n * 2, 0], [0, n * 2], [n * 2, n * 2], [n, n]]) { x.beginPath(); x.arc(cx, cy, n * rad, 0, Math.PI * 2); x.fill(); }
      return c;
    });
    return ctx.createPattern(tile, 'repeat');
  }
  // Tapering brush polygon along a polyline: width swells in the middle and thins at both ends like an inked brush.
  function brush(ctx, pts, w, o = {}) {
    if (pts.length < 2) return;
    const nz = K.noise(o.seed || 1), L = [], R = [], tot = K.pathLen(pts); let acc = 0;
    for (let i = 0; i < pts.length; i++) {
      if (i) acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      const u = tot ? acc / tot : 0, taper = o.closed ? 1 : Math.pow(Math.sin(Math.PI * K.clamp(u * 0.92 + 0.04)), 0.45);
      const hw = 0.5 * w * taper * (0.82 + 0.3 * nz.n2(acc * 0.012, 3));
      L.push([pts[i][0] - (dy / l) * hw, pts[i][1] + (dx / l) * hw]); R.push([pts[i][0] + (dy / l) * hw, pts[i][1] - (dx / l) * hw]);
    }
    ctx.save(); ctx.fillStyle = o.color || C.black; ctx.beginPath();
    L.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])));
    for (let i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath(); ctx.fill();
    if (o.closed) { ctx.lineWidth = w * 0.7; ctx.strokeStyle = o.color || C.black; ctx.lineJoin = 'round'; K.poly(ctx, pts); ctx.stroke(); }
    ctx.restore();
  }
  // densify a polyline so the brush taper/noise has samples to work with
  const dense = (pts, step) => { const out = []; for (let i = 1; i < pts.length; i++) { const [a, b] = [pts[i - 1], pts[i]], n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step)); for (let k = 0; k < n; k++) out.push([K.lerp(a[0], b[0], k / n), K.lerp(a[1], b[1], k / n)]); } out.push(pts[pts.length - 1]); return out; };
  function burstPts(x, y, r, n, seed, jag = 0.32) { const rr = K.rng(seed), out = []; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, k = i % 2 ? 1 - jag * (0.7 + rr() * 0.6) : 1 + rr() * 0.08; out.push([x + Math.cos(a) * r * k * 1.25, y + Math.sin(a) * r * k * 0.7]); } out.push(out[0]); return out; }

  // Words slam in one by one (scale 1.6 -> 1 with a tiny overshoot). Returns width.
  function slamText(ctx, text, x, y, p, o) {
    const s = sOf(ctx), size = (o.size || 60) * s;
    ctx.save(); ctx.font = K.font(size, FONT, 400); ctx.textBaseline = 'alphabetic';
    const words = text.split(' '), sp = ctx.measureText(' ').width, ws = words.map((w) => ctx.measureText(w).width);
    const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    const per = 1 / words.length;
    words.forEach((w, i) => {
      const k = K.clamp((p - i * per * 0.85) / (per * 0.9));
      if (k > 0) {
        const sc = 1 + 0.6 * (1 - K.ease.back(k)) , cxw = cx + ws[i] / 2;
        ctx.save(); ctx.translate(cxw, y - size * 0.35); ctx.scale(sc, sc); ctx.rotate((o.tilt ?? -0.02));
        if (o.stroke) { ctx.lineWidth = size * 0.14; ctx.strokeStyle = o.stroke; ctx.lineJoin = 'round'; ctx.strokeText(w, -ws[i] / 2, size * 0.35); }
        ctx.fillStyle = o.color || C.black; ctx.fillText(w, -ws[i] / 2, size * 0.35); ctx.restore();
      }
      cx += ws[i] + sp;
    });
    ctx.restore();
    return { w: total, h: size };
  }

  const style = {
    id: 'halftone-pop', name: 'Halftone Pop Panel', family: 'Print',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Bangers&display=block', specs: ['400 60px "Bangers"'] }],
    palette: { bg: C.paper, ink: C.black, accent: C.red, yellow: C.yellow, blue: C.blue, red: C.red },
    sfx: { draw: 'brush', land: 'pop', emphasis: 'stamp', transition: 'whoosh', bed: 'room' },

    // the panel: paper gutter, thick brushed border, blue Ben-Day field inside (o.dot picks the field colour)
    background(ctx, W, H, t, o = {}) {
      const s = S(W, H), m = 18 * s;
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = C.white; ctx.fillRect(m, m, W - 2 * m, H - 2 * m);
      ctx.fillStyle = dots(ctx, o.dot || C.blue, null, 13 * s, 0.34); ctx.fillRect(m, m, W - 2 * m, H - 2 * m);
      brush(ctx, dense(K.rectPts(m, m, W - 2 * m, H - 2 * m), 30 * s), 11 * s, { closed: true, seed: 2 });
    },

    finish(ctx, W, H, t) {
      const s = S(W, H);
      // off-register ghost plate: the frame's own image nudged and tinted, like a slipped magenta/cyan pass
      const ghost = K.cached(`ht-g:${W}x${H}`, () => K.layer(W, H)), g = ghost.getContext('2d');
      g.globalCompositeOperation = 'copy'; g.drawImage(ctx.canvas, 0, 0);
      g.globalCompositeOperation = 'source-in'; g.fillStyle = 'rgba(0,150,210,1)'; g.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.07; ctx.drawImage(ghost, 2.5 * s, -1.5 * s); ctx.restore();
      // aged newsprint stock multiplied over everything, then paper tooth + a faint fold vignette
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.55;
      ctx.drawImage(K.paperTex(W, H, '#f6ead0', 31, 0.09, true), 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.16, '#5a3a10');
      K.grain(ctx, W, H, t, 0.05, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) {
      // a yellow caption box (the narrator's box) that drops in first, then the words slam in
      const s = sOf(ctx), size = (o.size || 60) * s;
      ctx.save(); ctx.font = K.font(size, FONT, 400); const w = ctx.measureText(text).width + size * 0.9, h = size * 1.35; ctx.restore();
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - size * 1.0;
      const bp = K.ease.back(K.clamp(p * 4));
      if (o.box !== false && bp > 0) {
        ctx.save(); ctx.translate(x0 + w / 2, y0 + h / 2); ctx.scale(bp, bp); ctx.rotate(-0.012);
        ctx.fillStyle = o.boxColor || C.yellow; ctx.fillRect(-w / 2, -h / 2, w, h);
        brush(ctx, dense(K.rectPts(-w / 2, -h / 2, w, h), 24 * s), 6 * s, { closed: true, seed: 9 });
        ctx.restore();
      }
      return slamText(ctx, o.upper === false ? text : text.toUpperCase(), x0 + w / 2, y0 + h / 2 + size * 0.36, K.clamp((p - 0.2) / 0.8), { ...o, align: 'center' });
    },
    label(ctx, text, x, y, p, o = {}) {
      // white caption chip with brush border (or a speech balloon with o.balloon)
      const s = sOf(ctx), size = (o.size || 36) * s;
      ctx.save(); ctx.font = K.font(size, FONT, 400); const tw = ctx.measureText(text.toUpperCase()).width; ctx.restore();
      const w = tw + size * 0.9, h = size * 1.3, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, cy = y - size * 0.35;
      const k = K.ease.back(K.clamp(p * 1.6));
      if (k <= 0) return { w, h };
      ctx.save(); ctx.translate(x0 + w / 2, cy); ctx.scale(k, k); ctx.rotate(o.tilt ?? 0.015);
      if (o.balloon) {
        const pts = K.circlePts(0, 0, w * 0.62, h * 0.85, 60);
        ctx.fillStyle = C.white; K.poly(ctx, pts, true); ctx.fill();
        ctx.beginPath(); ctx.moveTo(-w * 0.1, h * 0.7); ctx.lineTo(-w * 0.3, h * 1.45); ctx.lineTo(w * 0.08, h * 0.78); ctx.fill();
        brush(ctx, dense(pts, 18 * s), 5 * s, { closed: true, seed: 4 });
        brush(ctx, [[-w * 0.1, h * 0.8], [-w * 0.3, h * 1.45], [w * 0.08, h * 0.82]], 4 * s, { seed: 5 });
      } else {
        ctx.fillStyle = o.fill || C.white; ctx.fillRect(-w / 2, -h / 2, w, h);
        brush(ctx, dense(K.rectPts(-w / 2, -h / 2, w, h), 20 * s), 5 * s, { closed: true, seed: o.seed || 4 });
      }
      ctx.font = K.font(size, FONT, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = o.color || C.black; ctx.fillText(text.toUpperCase(), 0, size * 0.04);
      ctx.restore();
      return { w, h };
    },

    // fat yellow comic arrow: tapered shaft grows on, black brushed rim, red dot shading on the underside
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), all = K.arcPts(from, to, o.bend ?? 0.12, 40), q = K.trim(all, K.clamp(p));
      if (q.length < 2) return null;
      const w = (o.width || 22) * s, end = q[q.length - 1], pre = q[Math.max(0, q.length - 4)], ang = Math.atan2(end[1] - pre[1], end[0] - pre[0]);
      const head = o.head === false ? 0 : Math.min(w * 1.6, K.pathLen(q) * 0.6), base = [end[0] - Math.cos(ang) * head, end[1] - Math.sin(ang) * head];
      const shaft = K.trim(q, K.clamp(1 - head / Math.max(1, K.pathLen(q))));
      const Lp = [], Rp = [];
      shaft.forEach((pt, i) => { const a = shaft[Math.max(0, i - 1)], b = shaft[Math.min(shaft.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, hw = w * 0.5 * (0.6 + 0.4 * i / shaft.length); Lp.push([pt[0] - (dy / l) * hw, pt[1] + (dx / l) * hw]); Rp.push([pt[0] + (dy / l) * hw, pt[1] - (dx / l) * hw]); });
      const px = -Math.sin(ang), py = Math.cos(ang), hw = w * 1.05;
      const poly = head ? [...Lp, [base[0] + px * hw, base[1] + py * hw], end, [base[0] - px * hw, base[1] - py * hw], ...Rp.reverse()] : [...Lp, ...Rp.reverse()];
      ctx.save();
      ctx.fillStyle = o.color || C.yellow; K.poly(ctx, poly, true); ctx.fill();
      ctx.save(); K.poly(ctx, poly, true); ctx.clip(); ctx.translate(px * w * 0.35, py * w * 0.35);
      ctx.fillStyle = dots(ctx, C.red, null, 7 * s, 0.32); ctx.globalAlpha = 0.7; K.poly(ctx, Lp.concat([[base[0] + px * hw, base[1] + py * hw], end]), true); ctx.fill(); ctx.restore();
      ctx.lineJoin = 'round'; ctx.lineWidth = 4.5 * s; ctx.strokeStyle = C.black; K.poly(ctx, poly, true); ctx.stroke();
      ctx.restore();
      return end;
    },

    // a comic panel: flat fill or a Ben-Day field, brushed border, slammed in from 1.3x scale
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.ease.back(K.clamp(p * 1.3));
      if (k <= 0) return;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.rotate(o.tilt || 0);
      ctx.fillStyle = 'rgba(20,20,20,0.9)'; ctx.fillRect(-w / 2 + 9 * s, -h / 2 + 9 * s, w, h);
      ctx.fillStyle = o.fill || C.yellow; ctx.fillRect(-w / 2, -h / 2, w, h);
      if (o.dot) { ctx.fillStyle = dots(ctx, o.dot, null, (o.pitch || 10) * s, 0.36); ctx.fillRect(-w / 2, -h / 2, w, h); }
      brush(ctx, dense(K.rectPts(-w / 2, -h / 2, w, h), 22 * s), (o.lw || 9) * s, { closed: true, seed: o.seed || 6 });
      ctx.restore();
    },

    // number bursting out of a yellow explosion balloon
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 120) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, FONT, 400); const tw = ctx.measureText(txt).width; ctx.restore();
      const r = Math.max(tw * 0.5, size * 0.9), k = K.ease.back(K.clamp(p * 1.5));
      ctx.save(); ctx.translate(x, y - size * 0.32); ctx.scale(k, k);
      const pts = burstPts(0, 0, r, 14, o.seed || 77, 0.22);
      ctx.fillStyle = C.yellow; K.poly(ctx, pts, true); ctx.fill();
      ctx.save(); K.poly(ctx, pts, true); ctx.clip(); ctx.fillStyle = dots(ctx, C.red, null, 9 * s, 0.3); ctx.globalAlpha = 0.85;
      ctx.beginPath(); ctx.ellipse(0, 0, r * 1.3, r * 0.95, 0, 0, Math.PI * 2); ctx.ellipse(0, 0, r * 0.95, r * 0.62, 0, 0, Math.PI * 2, true); ctx.fill('evenodd'); ctx.restore();
      brush(ctx, dense(pts, 16 * s), 7 * s, { closed: true, seed: 12 });
      ctx.font = K.font(size, FONT, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.1; ctx.strokeStyle = C.white; ctx.strokeText(txt, 0, size * 0.04);
      ctx.fillStyle = o.color || C.black; ctx.fillText(txt, 0, size * 0.04);
      ctx.restore();
      return { w: r * 2, h: size };
    },

    // radiating brush speed lines around the target + a red WOW! burst stuck to the corner
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), rr = K.rng(o.seed || 21), n = 22, k = K.clamp(p);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rr() * 0.12, r0 = r * (1.02 + rr() * 0.1), len = r * (0.22 + rr() * 0.22) * K.ease.out(k);
        if (len < 2) continue;
        brush(ctx, [[x + Math.cos(a) * r0, y + Math.sin(a) * r0 * (o.ry ?? 0.62)], [x + Math.cos(a) * (r0 + len), y + Math.sin(a) * (r0 + len) * (o.ry ?? 0.62)]], 8 * s, { seed: 30 + i });
      }
      const bk = K.ease.back(K.clamp((p - 0.25) / 0.5));
      if (bk > 0) {
        const bx = x + r * (o.wx ?? 0.82), by = y - r * (o.wy ?? 0.42), br = 62 * s;
        ctx.save(); ctx.translate(bx, by); ctx.rotate(0.18); ctx.scale(bk, bk);
        const pts = burstPts(0, 0, br, 11, 41, 0.35);
        ctx.fillStyle = C.red; K.poly(ctx, pts, true); ctx.fill(); brush(ctx, dense(pts, 12 * s), 5 * s, { closed: true, seed: 42 });
        ctx.font = K.font(54 * s, FONT, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.lineWidth = 7 * s; ctx.strokeStyle = C.black; ctx.lineJoin = 'round'; ctx.strokeText(o.word || 'WOW!', 0, 3 * s);
        ctx.fillStyle = C.yellow; ctx.fillText(o.word || 'WOW!', 0, 3 * s);
        ctx.restore();
      }
    },

    // a new slanted panel slams across the page carrying a MEANWHILE caption, then slides on past
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), slant = 0.35 * H;
      let a, b; // covered band between edge a (left) and b (right)
      if (p < 0.5) { const k = K.ease.inOut(p / 0.5); a = K.lerp(W + slant, -slant, k); b = W + slant * 2; }
      else { const k = K.ease.inOut((p - 0.5) / 0.5); a = -slant * 2; b = K.lerp(W + slant, -slant, k); }
      const poly = [[a + slant, 0], [b + slant, 0], [b, H], [a, H]];
      ctx.save();
      ctx.fillStyle = C.paper; K.poly(ctx, poly, true); ctx.fill();
      ctx.save(); K.poly(ctx, poly, true); ctx.clip();
      ctx.fillStyle = C.white; ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = dots(ctx, C.red, null, 13 * s, 0.34); ctx.fillRect(0, 0, W, H);
      const cap = o.caption || 'MEANWHILE...';
      ctx.font = K.font(72 * s, FONT, 400); const cw = ctx.measureText(cap).width + 60 * s;
      ctx.fillStyle = C.yellow; ctx.fillRect(W / 2 - cw / 2, H / 2 - 60 * s, cw, 110 * s);
      brush(ctx, dense(K.rectPts(W / 2 - cw / 2, H / 2 - 60 * s, cw, 110 * s), 20 * s), 7 * s, { closed: true, seed: 66 });
      ctx.fillStyle = C.black; ctx.textAlign = 'center'; ctx.fillText(cap, W / 2, H / 2 + 22 * s);
      ctx.restore();
      for (const e of [a, b]) brush(ctx, dense([[e + slant, -10], [e, H + 10]], 30 * s), 16 * s, { closed: true, seed: 70 });
      ctx.restore();
    },
  };

  // ---------- the shared demo, as one comic page ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const CHIPFILL = [C.white, C.yellow, C.white, C.white, C.yellow, C.white, C.white];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 128 * s], video: [95 * s, 300 * s, 270 * s, 165 * s], node: [470 * s, 315 * s, 300 * s, 140 * s],
      chips: PL.map((_, i) => [975 * s, (212 + i * 71) * s]), top: [W / 2, 112 * s], counter: [W / 2, 440 * s], take: [W / 2, 668 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.19, W * 0.5, H * 0.13], node: [W * 0.16, H * 0.42, W * 0.68, H * 0.085],
      chips: PL.map((_, i) => [i % 2 ? W * 0.735 : W * 0.265, H * (0.605 + Math.floor(i / 2) * 0.085)]), top: [W / 2, H * 0.22], counter: [W / 2, H * 0.5], take: [W / 2, H * 0.79] };
  }
  function playCard(ctx, x, y, w, h, p, s) {
    style.box(ctx, x, y, w, h, p, { fill: C.white, dot: C.skin, pitch: 9, seed: 21 });
    const k = K.ease.back(K.clamp((p - 0.4) / 0.6)); if (k <= 0) return;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
    const r = Math.min(w, h) * 0.3, tri = [[-r * 0.6, -r], [r, 0], [-r * 0.6, r], [-r * 0.6, -r]];
    ctx.fillStyle = C.yellow; K.poly(ctx, tri, true); ctx.fill(); brush(ctx, dense(tri, 10 * s), 6 * s, { closed: true, seed: 23 });
    ctx.restore();
  }
  function node(ctx, x, y, w, h, p, s, size) {
    style.box(ctx, x, y, w, h, p, { fill: C.yellow, seed: 41, lw: 11 });
    if (p > 0.35) slamText(ctx, 'CREATOR OS', x + w / 2, y + h / 2 + size * s * 0.36, K.clamp((p - 0.35) / 0.65), { size, align: 'center', tilt: -0.03 });
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      const scene2 = t >= 8.3;
      // camera shake on the emphasis hit
      const shake = K.spring(t, 10.0, 7 * s, 9, 7);
      ctx.save(); ctx.translate(shake, -shake * 0.6);
      style.background(ctx, W, H, t, { dot: scene2 ? C.red : C.blue });
      if (!scene2) {
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.4, 'lin'), { size: P ? 54 : 74, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video;
        playCard(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.6, 'lin'), s);
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + (P ? 70 : 62) * s, K.beat(t, 2.6, 0.4, 'lin'), { balloon: true, align: 'center', size: P ? 34 : 34 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 115 * s], [nx + nw / 2, ny - 18 * s]] : [[vx + vw + 22 * s, vy + vh / 2], [nx - 22 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'out'), { bend: P ? 0 : -0.12, width: 26 });
        node(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.8, 'lin'), s, P ? 56 : 56);
        if (P) {
          const yL = Lo.chips[6][1];
          style.arrow(ctx, [W / 2, ny + nh + 20 * s], [W / 2, yL + 24 * s], K.beat(t, 4.9, 0.6, 'out'), { bend: 0, width: 20, head: false });
        }
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2 + (left ? -14 : 14) * s, cy] : [nx + nw + 18 * s, ny + nh * (0.18 + i * 0.11)];
          const to = P ? [left ? W * 0.41 : W * 0.59, cy] : [cx - 18 * s, cy - 10 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'out'), { bend: P ? 0 : (i - 3) * 0.03, width: 13 });
          const lx = P ? (left ? W * 0.395 : W * 0.605) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.25, 0.3, 'lin'), { size: P ? 40 : 42, align: P ? (left ? 'right' : 'left') : 'left', fill: CHIPFILL[i], seed: 60 + i, tilt: (i % 2 ? -1 : 1) * 0.015 });
        });
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * (P ? 0.8 : 0.85), h2 = nh * 0.85;
        node(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, s, P ? 50 : 50);
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], K.beat(t, 8.45, 0.4, 'lin'), { size: P ? 110 : 112 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + (P ? 120 : 98) * s, K.beat(t, 8.9, 0.35, 'lin'), { align: 'center', size: 40, fill: C.yellow });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 40 * s, (P ? 250 : 300) * s, K.beat(t, 10.0, 0.5, 'lin'), { wx: P ? 0.55 : 0.95, wy: P ? 0.6 : 0.5, ry: P ? 0.8 : 0.5 });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 1.0, 'lin'), { size: P ? 46 : 56, align: 'center' });
      }
      ctx.restore();
      if (t > 7.5 && t < 9.1) style.transition(ctx, W, H, K.clamp((t - 7.5) / 1.6), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      ['One', 'video.', 'Every', 'platform.'].forEach((_, i) => k.play('pop', 0.45 + i * 0.27, { pitch: 0.8 + i * 0.1 }));
      k.play('thud', 2.05, { gain: 0.6 }); k.play('pop', 2.45, { pitch: 1.3 }); k.play('pop', 2.7, { pitch: 1.1 });
      k.play('scribble', 3.3, { medium: 'brush', dur: 0.7 }); k.play('whoosh', 3.3, { dur: 0.6, gain: 0.6 });
      k.play('thud', 4.05, { gain: 0.8 }); k.play('pop', 4.4); k.play('pop', 4.6, { pitch: 1.2 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'brush', dur: 0.3, gain: 0.7 }); k.play('pop', 5.3 + i * 0.4, { pitch: 1 + i * 0.07, gain: 0.85 }); }
      k.play('whoosh', 7.5, { dur: 0.8 }); k.play('stamp', 8.3, { gain: 0.6 }); k.play('whoosh', 8.3, { dur: 0.7, up: false });
      k.play('thud', 8.5, { gain: 0.7 }); k.play('count', 8.6, { dur: 1.4 }); k.play('pop', 8.95, { pitch: 1.2 });
      k.play('stamp', 10.0); k.play('thud', 10.0, { gain: 0.5 }); k.play('pop', 10.2, { pitch: 1.4 });
      ['Post', 'once.', 'Reach', 'everywhere.'].forEach((_, i) => k.play('pop', 10.7 + i * 0.22, { pitch: 0.9 + i * 0.1, gain: 0.8 }));
      k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
