// Multi-scale Truchet (Generative & Type). Bold two-ink winged Truchet tiling across three scales: every tile is a
// square with a band of two quarter annuli (radii w/3 to 2w/3) and corner "wing" disks of radius w/6 that reach
// into the neighbours; each finer scale swaps the two inks and is drawn under the coarser one, so the paths flow
// continuously across scale changes. A third ink is screened only inside letter shapes, so a word surfaces from
// the maze. Printed blocks with a misregistered accent carry the labels.
(function () {
  const C = { cream: '#efe8d6', navy: '#16224a', orange: '#e8542a', paper: '#e9e1cc' };
  const HEAD = 'Archivo Black';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  const ARC = [[0, 0, 0], [1, 0, 1], [1, 1, 2], [0, 1, 3]]; // corner (dx, dy) + quarter index

  function tile(ctx, x, y, w, ori, lvl, k, pal) {
    if (k <= 0) return;
    const bg = lvl % 2 ? pal.b : pal.a, fg = lvl % 2 ? pal.a : pal.b;
    ctx.save();
    if (k < 1) { ctx.translate(x + w / 2, y + w / 2); ctx.scale(k, k); ctx.rotate((1 - k) * Math.PI / 2); ctx.translate(-x - w / 2, -y - w / 2); }
    ctx.fillStyle = bg; ctx.fillRect(x - 0.5, y - 0.5, w + 1, w + 1);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, w); ctx.clip();
    ctx.strokeStyle = fg; ctx.lineWidth = w / 3; ctx.lineCap = 'butt';
    for (const ci of ori ? [1, 3] : [0, 2]) { const [dx, dy, q] = ARC[ci]; ctx.beginPath(); ctx.arc(x + dx * w, y + dy * w, w / 2, q * Math.PI / 2, (q + 1) * Math.PI / 2); ctx.stroke(); }
    ctx.restore();
    ctx.fillStyle = fg; for (const [dx, dy] of ARC) { ctx.beginPath(); ctx.arc(x + dx * w, y + dy * w, w / 6, 0, TAU); ctx.fill(); }
    ctx.restore();
  }
  // the tiling: base grid, deterministic subdivision (3 scales), timings for the diagonal laying sweep and splits
  function plan(W, H, s, seed) {
    return K.cached(`tr-plan:${W}x${H}:${seed}`, () => {
      const B = (H > W ? 180 : 160) * s, cols = Math.ceil(W / B) + 1, rows = Math.ceil(H / B) + 1, ox = (W - cols * B) / 2, oy = (H - rows * B) / 2, r = K.rng(seed), out = [];
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const x = ox + i * B, y = oy + j * B, diag = (i + j) / (cols + rows);
        const T = { x, y, w: B, lvl: 0, ori: r() < 0.5 ? 1 : 0, t0: diag, kids: null };
        if (r() < 0.62) { T.ts = 1.0 + diag * 1.1 + r() * 0.15; T.kids = [];
          for (const [a, b] of [[0, 0], [1, 0], [0, 1], [1, 1]]) { const c = { x: x + a * B / 2, y: y + b * B / 2, w: B / 2, lvl: 1, ori: r() < 0.5 ? 1 : 0, kids: null };
            if (r() < 0.45) { c.ts = 2.0 + diag * 1.1 + r() * 0.15; c.kids = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([e, f]) => ({ x: c.x + e * B / 4, y: c.y + f * B / 4, w: B / 4, lvl: 2, ori: r() < 0.5 ? 1 : 0 })); }
            T.kids.push(c); } }
        out.push(T);
      }
      return out;
    });
  }
  // leaves visible at time t (with pop-in progress), finest first so coarser tiles and wings land on top
  function leaves(P, t, lay = 1.2) {
    const out = [];
    for (const T of P) {
      const k0 = K.ease.out(K.clamp((t - T.t0 * lay) / 0.3));
      if (!T.kids || t < T.ts) { out.push([T, k0]); continue; }
      for (const c of T.kids) { const k1 = K.ease.back(K.clamp((t - T.ts) / 0.25)); if (!c.kids || t < c.ts) out.push([c, k1]); else for (const g of c.kids) out.push([g, K.ease.back(K.clamp((t - c.ts) / 0.25))]); }
    }
    return out.sort((a, b) => b[0].lvl - a[0].lvl);
  }
  function drawMaze(ctx, list, pal) { for (const [T, k] of list) tile(ctx, T.x, T.y, T.w, T.ori, T.lvl, k, pal); }

  const style = {
    id: 'truchet', name: 'Multi-scale Truchet', family: 'Generative & Type',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=block', specs: ['400 60px "Archivo Black"'] }],
    palette: C,
    sfx: { draw: null, land: 'click', emphasis: 'stamp', transition: 'whoosh', bed: 'tape' },
    tile, plan, leaves,

    background(ctx, W, H, t, o = {}) {
      const s = S(W, H); ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
      drawMaze(ctx, leaves(plan(W, H, s, o.seed || 7), o.t ?? t, o.lay), { a: C.cream, b: C.navy });
    },
    // print finish: paper tooth, slight ink gain at edges, grain
    finish(ctx, W, H, t) {
      const tooth = K.cached(`tr-tooth:${W}x${H}`, () => K.paperTex(W, H, '#808080', 21, 0.35, false));
      ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.35; ctx.drawImage(tooth, 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.2, '#0b1024');
      K.grain(ctx, W, H, t, 0.05, 12, 'overlay');
    },

    // printed block: cream slab, navy type, the orange plate slides into register as p completes
    title(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = K.fitSize(ctx, text, HEAD, 400, (o.size || 56) * s, ctx.canvas.width * 0.84);
      ctx.save(); ctx.font = K.font(size, HEAD, 400);
      const tw = ctx.measureText(text).width, pad = size * 0.4, w = tw + pad * 2, h = size * 1.45, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      const e = K.ease.out(K.clamp(p * 1.6)), reg = 1 - K.ease.inOut(K.clamp((p - 0.3) / 0.7));
      ctx.globalAlpha = e;
      ctx.fillStyle = C.navy; ctx.fillRect(x0 - 6 * s, y - h * 0.72 - 6 * s, w + 12 * s, h + 12 * s);
      ctx.fillStyle = o.fill || C.cream; ctx.fillRect(x0, y - h * 0.72, w, h);
      ctx.fillStyle = C.orange; ctx.globalAlpha = e * 0.95; ctx.fillText(text, x0 + pad + reg * 14 * s + 3 * s, y + reg * 8 * s + 3 * s);
      ctx.globalAlpha = e; ctx.fillStyle = o.color || C.navy; ctx.fillText(text, x0 + pad, y);
      ctx.restore(); return { w, h };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y + (o.size || 30) * 0.35 * S(ctx.canvas.width, ctx.canvas.height), p, { size: o.size || 30, ...o }); },

    // thick navy bar with a cream keyline and a quarter-round head (a Truchet path that points)
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.arcPts(from, to, o.bend ?? 0, 30), sub = K.trim(pts, K.ease.inOut(K.clamp(p))), th = (o.width || 12) * s;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = C.cream; ctx.lineWidth = th + 8 * s; K.poly(ctx, sub); ctx.stroke();
      ctx.strokeStyle = o.color || C.navy; ctx.lineWidth = th; K.poly(ctx, sub); ctx.stroke();
      const b = sub[sub.length - 1];
      if (p >= 1) { const a = pts[pts.length - 3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]); ctx.translate(b[0], b[1]); ctx.rotate(ang);
        ctx.beginPath(); ctx.moveTo(th * 1.3, 0); ctx.lineTo(-th * 0.6, -th * 1.5); ctx.lineTo(-th * 0.6, th * 1.5); ctx.closePath(); ctx.lineWidth = 6 * s; ctx.strokeStyle = C.cream; ctx.stroke(); ctx.fillStyle = o.color || C.navy; ctx.fill(); }
      ctx.restore(); return b;
    },
    // printed block frame
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.ease.back(K.clamp(p));
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(e, e); ctx.translate(-w / 2, -h / 2);
      ctx.fillStyle = C.navy; ctx.fillRect(-8 * s, -8 * s, w + 16 * s, h + 16 * s); ctx.fillStyle = o.fill || C.cream; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.orange; ctx.fillRect(w * 0.06, h * 0.08, 10 * s, h * 0.84);
      ctx.restore();
    },
    counter(ctx, value, x, y, p, o = {}) { return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 110, align: o.align || 'center' }); },

    // accent rings: concentric quarter-arc bands in orange and navy spin out around the hit
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p));
      ctx.save(); ctx.lineCap = 'butt';
      for (let i = 0; i < 4; i++) { const rr = r * (0.7 + i * 0.12) * k; ctx.lineWidth = 16 * s; ctx.strokeStyle = C.cream; for (let q = 0; q < 4; q += 2) { ctx.beginPath(); ctx.ellipse(x, y, rr, rr * (o.ry || 0.45), 0, (q + i * 0.5 + p) * Math.PI / 2, (q + 1 + i * 0.5 + p) * Math.PI / 2); ctx.stroke(); }
        ctx.lineWidth = 10 * s; ctx.strokeStyle = i % 2 ? C.navy : C.orange; for (let q = 0; q < 4; q += 2) { ctx.beginPath(); ctx.ellipse(x, y, rr, rr * (o.ry || 0.45), 0, (q + i * 0.5 + p) * Math.PI / 2, (q + 1 + i * 0.5 + p) * Math.PI / 2); ctx.stroke(); } }
      ctx.restore();
    },
    // the tiles are re-laid: a diagonal sweep of solid navy tiles quarter-turns in, covers, then turns out (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), B = 90 * s, cols = Math.ceil(W / B), rows = Math.ceil(H / B);
      ctx.save();
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
        const d = (i + j) / (cols + rows), q = p < 0.5 ? K.clamp((p * 2 - d * 0.6) / 0.4) : 1 - K.clamp(((p - 0.5) * 2 - d * 0.6) / 0.4);
        if (q <= 0) continue; const k = K.ease.out(q), x = i * B, y = j * B;
        ctx.save(); ctx.translate(x + B / 2, y + B / 2); ctx.rotate((1 - k) * Math.PI / 2); ctx.scale(k, k);
        ctx.fillStyle = (i + j) % 2 ? C.navy : '#1d2b5a'; ctx.fillRect(-B / 2 - 1, -B / 2 - 1, B + 2, B + 2);
        ctx.strokeStyle = C.orange; ctx.lineWidth = B / 3; ctx.beginPath(); ctx.arc(-B / 2, -B / 2, B / 2, 0, Math.PI / 2); ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    },
  };

  // accent screen: the word's letters, filled with the maze in (orange, navy) inks, slid into register
  function accentWord(ctx, W, H, word, cx, cy, size, list, reg, s) {
    const L = K.cached(`tr-acc:${W}x${H}`, () => K.layer(W, H)), x = L.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'source-over';
    x.font = K.font(size, HEAD, 400); x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillStyle = '#000'; x.fillText(word, cx, cy);
    x.globalCompositeOperation = 'source-in'; x.translate((1 - reg) * 60 * s, (1 - reg) * 20 * s); drawMaze(x, list, { a: C.orange, b: C.navy }); x.setTransform(1, 0, 0, 1, 0, 0);
    x.globalCompositeOperation = 'source-over';
    ctx.save(); ctx.globalAlpha = K.clamp(reg * 3); ctx.drawImage(L, 0, 0); ctx.restore();
    // keyline round the letters so the word reads on the maze
    ctx.save(); ctx.font = K.font(size, HEAD, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.globalAlpha = K.clamp(reg * 2); ctx.strokeStyle = C.cream; ctx.lineWidth = 6 * s; ctx.lineJoin = 'round'; ctx.strokeText(word, cx, cy); ctx.strokeStyle = C.navy; ctx.lineWidth = 2.5 * s; ctx.strokeText(word, cx, cy); ctx.restore();
  }

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 100 * s], video: [80 * s, 300 * s, 210 * s, 140 * s], node: [600 * s, 380 * s, 240 * s],
      chips: PLATFORMS.map((n, i) => [930 * s, (190 + i * 70) * s]), counter: [W / 2, 420 * s], take: [W / 2, 650 * s] };
    return { s, P: true, title: [W / 2, H * 0.08], video: [W * 0.3, H * 0.13, W * 0.4, H * 0.08], node: [W / 2, H * 0.38, 220 * s],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.62 + Math.floor(i / 2) * 0.07)]), counter: [W / 2, H * 0.52], take: [W / 2, H * 0.78] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, s2 = t >= 8.25;
      const seed = s2 ? 11 : 7, mt = s2 ? 1.2 + (t - 8.25) * 1.6 : t;   // scene 2 re-lays a fresh tiling quickly
      ctx.fillStyle = C.paper; ctx.fillRect(0, 0, W, H);
      const list = leaves(plan(W, H, s, seed), s2 ? Math.min(4, mt) : t, s2 ? 0.01 : 1.2);
      drawMaze(ctx, list, { a: C.cream, b: C.navy });
      if (!s2) {
        const [vx, vy, vw, vh] = Lo.video, [nx, ny, ns] = Lo.node;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.5, 'lin'));
        if (t > 2.3) { ctx.fillStyle = C.navy; ctx.beginPath(); ctx.moveTo(vx + vw * 0.42, vy + vh * 0.28); ctx.lineTo(vx + vw * 0.66, vy + vh * 0.5); ctx.lineTo(vx + vw * 0.42, vy + vh * 0.72); ctx.fill(); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 40 * s, K.beat(t, 2.6, 0.4), { align: 'center', size: 28 });
        // the word OS surfaces from the maze at the node
        const reg = K.beat(t, 3.9, 0.9, 'inOut');
        const a1 = P ? [[W / 2, vy + vh + 82 * s], [nx, ny - ns * 0.5]] : [[vx + vw + 16 * s, vy + vh / 2], [nx - ns * 0.85, ny - 20 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.5));
        if (reg > 0) accentWord(ctx, W, H, 'OS', nx, ny, ns, list, reg, s);
        style.label(ctx, 'Creator OS', nx, ny + ns * 0.55 + 20 * s, K.beat(t, 4.7, 0.4), { align: 'center', size: 32, fill: C.orange, color: C.cream });
        if (P) style.arrow(ctx, [W / 2, ny + ns * 0.55 + 70 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.5), { width: 10 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy] : [nx + ns * 0.8, ny - 10 * s], to = P ? [left ? W * 0.465 : W * 0.535, cy] : [cx - 14 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35), { width: P ? 9 : 9, color: i % 2 ? C.orange : C.navy });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.3, 0.3), { align: P ? (left ? 'right' : 'left') : 'left', size: P ? 28 : 28 });
        });
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.3, 1.0, 'lin'), { size: 52, align: 'center' });
      } else {
        const [cx, cy] = Lo.counter, v = K.count(t, 8.6, 1.5, 0, 1000000);
        accentWord(ctx, W, H, 'OS', W / 2, P ? H * 0.25 : 175 * s, P ? 200 * s : 150 * s, list, 1, s);
        style.emphasis(ctx, cx, cy - 40 * s, (P ? 440 : 470) * s, K.beat(t, 10.0, 0.9, 'lin'), { ry: P ? 0.45 : 0.36 });
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy, 1, { size: P ? 96 : 104 });
        style.label(ctx, 'views', cx, cy + (P ? 100 : 86) * s, K.beat(t, 8.8, 0.4), { align: 'center', size: 30, fill: C.orange, color: C.cream });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: 50, align: 'center' });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('tape', 0, 12, 1);
      for (let i = 0; i < 12; i++) k.play('click', 0.05 + i * 0.1, { pitch: 0.8 + i * 0.04 });
      for (let i = 0; i < 10; i++) k.play('tick', 1.0 + i * 0.12, { pitch: 1.2 });
      for (let i = 0; i < 10; i++) k.play('tick', 2.0 + i * 0.12, { pitch: 1.5, gain: 0.7 });
      k.play('pop', 2.0, { pitch: 0.8 }); k.play('click', 2.6); k.play('whoosh', 3.3, { dur: 0.5 });
      k.play('whoosh', 3.9, { dur: 0.9, gain: 0.6 }); k.play('stamp', 4.75, { gain: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.25, gain: 0.35 }); k.play('click', 5.32 + i * 0.4, { pitch: 1 + i * 0.07 }); }
      k.play('whoosh', 7.6, { dur: 1.2 }); for (let i = 0; i < 12; i++) k.play('click', 7.65 + i * 0.1, { pitch: 1.4 - i * 0.04, gain: 0.6 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('stamp', 10.0);
      k.play('click', 10.5); k.play('chime', 11.3, { note: 'D6' });
    },
  };
  MS.register(style);
})();
