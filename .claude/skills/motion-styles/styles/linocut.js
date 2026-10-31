// Linocut Relief Print (Print). The whole frame is one pulled proof: a dense, salty black block printed on cream
// rice paper with deckled margins, everything "cut" from it as tapering white gouge strokes, a red reduction pass
// for colour, an edition number + title + signature pencilled in the margin, and the next proof peeled back
// diagonally as the scene change. A raking glint slides over the wet ink.
(function () {
  const C = { paper: '#efe6d1', ink: '#16120e', red: '#c2412c', cut: '#efe6d1', pencil: '#5d5a55' };
  const CARVE = 'Archivo Black', HAND = 'Caveat';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // Block rectangle (the inked area) for a frame size; margins carry the pencil notes.
  function block(W, H) { const s = S(W, H), P = H > W; return P ? [34 * s, 40 * s, W - 68 * s, H - 150 * s] : [36 * s, 28 * s, W - 72 * s, H - 96 * s]; }

  // salty ink tile: near-solid with pale salt specks, mottled density and faint roller ridges
  function inkTile(col, seed) {
    return K.cached(`lino-ink:${col}:${seed}`, () => {
      const n = 256, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
      const nz = K.noise(seed), r = K.rng(seed + 3), [R, G, B] = K.hex(col);
      for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
        const m = nz.fbm2(i * 0.012, y * 0.012, 3), fine = nz.n2(i * 0.22, y * 0.22), salt = r() < 0.035 ? 0.6 * r() : 0;
        const a = K.clamp(0.97 + m * 0.08 - salt - (fine > 0.55 ? 0.35 : 0) + 0.02 * Math.sin(y * 0.4), 0.2, 1), o = (y * n + i) * 4;
        d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = a * 255;
      }
      x.putImageData(img, 0, 0); return c;
    });
  }
  const pat = (ctx, col, seed = 1) => ctx.createPattern(inkTile(col, seed), 'repeat');
  // a single gouge stroke: a sliver that is pointed at the entry, widest past the middle, pointed at the exit
  function gouge(ctx, a, b, w, bow = 0) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l, ny = dx / l;
    const m1 = [a[0] + dx * 0.6 + nx * (w + bow), a[1] + dy * 0.6 + ny * (w + bow)], m2 = [a[0] + dx * 0.6 - nx * (w - bow), a[1] + dy * 0.6 - ny * (w - bow)];
    ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(m1[0], m1[1], b[0], b[1]); ctx.quadraticCurveTo(m2[0], m2[1], a[0], a[1]); ctx.fill();
  }
  // gouged channel along a path: chain of overlapping slivers, slightly irregular widths (hand-cut)
  function channel(ctx, pts, w, seed) {
    const r = K.rng(seed), step = 5;
    for (let i = 0; i + step < pts.length; i += step - 1) {
      const a = pts[i], b = pts[Math.min(pts.length - 1, i + step + 1)];
      gouge(ctx, a, b, w * (0.75 + r() * 0.45), (r() - 0.5) * w * 0.4);
    }
  }
  // cut-out lettering: paper colour, with nicks and a slightly ragged contour from re-stroking the knife
  function cutText(ctx, text, x, y, size, o = {}) {
    const s = sOf(ctx), r = K.rng(o.seed || text.length);
    ctx.save(); ctx.font = K.font(size, o.family || CARVE, o.weight || 400); ctx.textBaseline = 'alphabetic'; ctx.textAlign = o.align || 'left';
    ctx.fillStyle = o.color || C.cut; ctx.fillText(text, x, y);
    ctx.globalAlpha = 0.5; ctx.fillText(text, x + 1.2 * s, y - 0.8 * s); ctx.globalAlpha = 1;
    // ink specks that held on inside the cut letters
    ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = C.ink;
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    for (let i = 0; i < text.length * 3; i++) { ctx.globalAlpha = 0.5 + r() * 0.5; ctx.fillRect(x0 + r() * w, y - r() * size * 0.75, (1 + r() * 2.5) * s, (0.6 + r() * 1.4) * s); }
    ctx.restore();
    return w;
  }

  const style = {
    id: 'linocut', name: 'Linocut Relief Print', family: 'Print',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Caveat:wght@500;700&display=block', specs: ['400 60px "Archivo Black"', '700 34px "Caveat"', '500 30px "Caveat"'] }],
    palette: { bg: C.paper, ink: C.ink, accent: C.red, red: C.red, cut: C.cut },
    sfx: { draw: 'pencil', land: 'thud', emphasis: 'stamp', transition: 'paper', bed: 'room' },

    background(ctx, W, H, t, o = {}) {
      const tex = K.cached(`lino-bg:${W}x${H}:${o.edition || 3}:${o.title !== false}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), [bx, by, bw, bh] = block(W, H), r = K.rng(8);
        x.drawImage(K.paperTex(W, H, C.paper, 41, 0.06, false), 0, 0);
        // loose rice-paper fibres
        for (let i = 0; i < 260; i++) { x.strokeStyle = r() < 0.5 ? 'rgba(255,252,240,0.5)' : 'rgba(150,130,100,0.12)'; x.lineWidth = (0.5 + r()) * s; const px = r() * W, py = r() * H, a = r() * 6.3, l = (8 + r() * 30) * s; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 0.6) * l * 0.5, py + Math.sin(a + 0.6) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
        // the inked block, edges not quite straight (lino edge picks up ink unevenly)
        x.save(); x.fillStyle = x.createPattern(inkTile(C.ink, 5), 'repeat');
        K.poly(x, K.wobble(K.rectPts(bx, by, bw, bh).flatMap((p, i, a) => (i ? K.bezier(a[i - 1], a[i - 1], p, p, 20).slice(1) : [p])), 1.6 * s, 9, 0.05), true); x.fill();
        // carved tone: radiating gouge rays in the outer band, a carved double border
        x.fillStyle = C.cut; const cx = bx + bw / 2, cy = by + bh / 2;
        x.save(); x.beginPath(); x.rect(bx + 14 * s, by + 14 * s, bw - 28 * s, bh - 28 * s); x.clip();
        for (let i = 0; i < 64; i++) { const a = (i / 64) * Math.PI * 2 + r() * 0.04, R0 = Math.hypot(bw, bh) * (0.36 + r() * 0.06), R1 = Math.hypot(bw, bh) * 0.62; x.globalAlpha = 0.55 + r() * 0.35; gouge(x, [cx + Math.cos(a) * R1, cy + Math.sin(a) * R1], [cx + Math.cos(a) * R0, cy + Math.sin(a) * R0], (2 + r() * 2.5) * s); }
        x.restore(); x.globalAlpha = 1;
        channel(x, K.rectPts(bx + 12 * s, by + 12 * s, bw - 24 * s, bh - 24 * s).flatMap((p, i, a) => (i ? K.bezier(a[i - 1], a[i - 1], p, p, 30).slice(1) : [p])), 1.8 * s, 3);
        x.restore();
        // pencil in the margin: edition, title, signature
        x.fillStyle = C.pencil; x.globalAlpha = 0.85; x.font = K.font(30 * s, HAND, 500); x.textBaseline = 'alphabetic';
        const my = by + bh + (H > W ? 70 : 52) * s;
        x.textAlign = 'left'; x.fillText(`${o.edition || 3}/20`, bx + 20 * s, my);
        if (o.title !== false) { x.textAlign = 'center'; x.fillText('One Video', W / 2, my); }
        x.textAlign = 'right'; x.fillText('Creator OS  2026', bx + bw - 20 * s, my);
        x.strokeStyle = C.pencil; x.lineWidth = 1.2 * s; x.globalAlpha = 0.5; x.beginPath(); x.moveTo(bx + bw - 230 * s, my + 6 * s); x.lineTo(bx + bw - 20 * s, my + 4 * s); x.stroke();
        return c;
      });
      ctx.drawImage(tex, 0, 0);
    },

    finish(ctx, W, H, t) {
      const s = S(W, H), [bx, by, bw, bh] = block(W, H);
      // raking glint over the wet ink, sliding slowly
      const gx = K.lerp(-0.3, 1.3, (t * 0.07) % 1) * W;
      const g = ctx.createLinearGradient(gx - 260 * s, 0, gx + 260 * s, H * 0.4);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,248,230,0.09)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save(); ctx.beginPath(); ctx.rect(bx, by, bw, bh); ctx.clip(); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      // paper tooth printed through: multiply the fibre texture lightly over everything
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.35; ctx.drawImage(K.paperTex(W, H, '#f4ecd9', 77, 0.08, false), 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.14, '#3a2a18');
      K.grain(ctx, W, H, t, 0.05, 12, 'overlay');
    },

    // carved headline: letters appear as the knife cuts them, left to right (on twos)
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 60) * s;
      const n = Math.floor(text.length * K.clamp(Math.floor(p * 12 * 2) / 24 + (p >= 1 ? 1 : 0)));
      ctx.save(); ctx.font = K.font(size, CARVE, 400); const w = ctx.measureText(text).width; ctx.restore();
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      if (n > 0) cutText(ctx, text.slice(0, n), x0, y, size, { color: o.color, seed: o.seed });
      return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 34) * s;
      ctx.save(); ctx.font = K.font(size, CARVE, 400); const w = ctx.measureText(text).width; ctx.restore();
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      // red reduction banner under the cut letters
      const k = K.ease.out(K.clamp(p * 1.5));
      if (o.banner !== false && k > 0) { ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = pat(ctx, o.bannerColor || C.red, 12); ctx.fillRect(x0 - 12 * s, y - size * 0.92, (w + 24 * s) * k, size * 1.22); ctx.restore(); }
      const n = Math.floor(text.length * K.clamp((p - 0.3) / 0.7));
      if (n > 0) cutText(ctx, text.slice(0, n), x0, y, size, { color: o.color, seed: o.seed });
      return { w, h: size };
    },

    // gouged channel with a carved head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.12, 60), q = K.trim(pts, K.clamp(p));
      if (q.length < 3) return null;
      ctx.save(); ctx.fillStyle = o.color || C.cut;
      channel(ctx, q, (o.width || 3.6) * s, o.seed || 4);
      if (p > 0.15) { const b = q[q.length - 1], a = q[Math.max(0, q.length - 6)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 26 * s;
        for (const sg of [-1, 1]) gouge(ctx, [b[0] - Math.cos(ang + sg * 0.5) * L, b[1] - Math.sin(ang + sg * 0.5) * L], b, 4 * s); }
      ctx.restore();
      return q[q.length - 1];
    },

    // a carved panel: red reduction fill, cut double border, parallel tone carving on one side
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p);
      if (k <= 0) return;
      ctx.save();
      if (o.fill !== false) { ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h * K.clamp(k * 1.6)); ctx.clip(); ctx.fillStyle = pat(ctx, o.fill || C.red, 21); ctx.fillRect(x + 2 * s, y + 2 * s, w, h); ctx.restore(); }
      ctx.fillStyle = o.color || C.cut;
      const ring = K.rectPts(x, y, w, h).flatMap((pp, i, a) => (i ? K.bezier(a[i - 1], a[i - 1], pp, pp, 26).slice(1) : [pp]));
      const q = K.trim(ring, K.clamp(k * 1.25)); if (q.length > 3) channel(ctx, q, 3.2 * s, o.seed || 7);
      // tone carving: parallel slivers down the left edge, getting shorter
      const rr = K.rng(o.seed || 7), n = Math.floor((o.tone ?? 10) * K.clamp((k - 0.5) * 2));
      for (let i = 0; i < n; i++) { const xx = x + 12 * s + i * 8 * s, len = h * (0.75 - i * 0.065) * (0.9 + rr() * 0.1); gouge(ctx, [xx, y + h / 2 - len / 2], [xx + 1.5 * s, y + h / 2 + len / 2], (1.4 + rr()) * s); }
      ctx.restore();
    },

    // big carved numerals, re-cut on twos
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 120) * s, txt = K.fmt(value);
      return { w: cutText(ctx, txt, x, y, size, { align: o.align || 'center', seed: Math.floor(value / 9973) + 1, color: o.color }), h: size };
    },
    // red reduction sunburst carved around the moment
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), rr = K.rng(o.seed || 31), n = 26, k = K.ease.out(K.clamp(p));
      ctx.save(); ctx.fillStyle = pat(ctx, o.color || C.red, 33);
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + rr() * 0.06, r0 = r * (0.98 + rr() * 0.06), r1 = r0 + r * (0.22 + rr() * 0.2) * k;
        if (k > 0.02) gouge(ctx, [x + Math.cos(a) * r1, y + Math.sin(a) * r1 * (o.ry || 0.55)], [x + Math.cos(a) * r0, y + Math.sin(a) * r0 * (o.ry || 0.55)], (5 + rr() * 4) * s);
      }
      ctx.restore();
    },

    // the next proof: a fresh sheet is laid from the bottom-right corner, then peeled back toward the top-left
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), D = Math.hypot(W, H), d = [W / D, H / D];
      // fold line position along the diagonal; region beyond it is covered by paper
      const u = p < 0.5 ? K.lerp(D * 1.1, -D * 0.1, K.ease.inOut(p / 0.5)) : K.lerp(D * 1.1, -D * 0.1, K.ease.inOut((p - 0.5) / 0.5));
      const covered = (pp) => (p < 0.5 ? pp >= u : pp <= u);
      const nrm = [-d[1], d[0]], big = D * 2;
      const lineAt = (v) => [[d[0] * v + nrm[0] * big, d[1] * v + nrm[1] * big], [d[0] * v - nrm[0] * big, d[1] * v - nrm[1] * big]];
      const [a1, a2] = lineAt(u), far = p < 0.5 ? D * 3 : -D * 3, [b1, b2] = lineAt(far);
      ctx.save();
      K.poly(ctx, [a1, a2, b2, b1], true); ctx.save(); ctx.clip();
      ctx.drawImage(K.paperTex(W, H, C.paper, 41, 0.06, false), 0, 0);
      ctx.restore();
      // the curled flap: lighter back of the sheet with a soft shadow, on the uncovered side of the fold
      const f = 90 * s, dir = p < 0.5 ? -1 : 1, [c1, c2] = lineAt(u + dir * f);
      const g = ctx.createLinearGradient(d[0] * u, d[1] * u, d[0] * (u + dir * f), d[1] * (u + dir * f));
      g.addColorStop(0, '#d9cfb8'); g.addColorStop(0.55, '#fbf6ea'); g.addColorStop(1, '#e8dfca');
      if (p > 0.02 && p < 0.98 && Math.abs(p - 0.5) > 0.02) {
        ctx.shadowColor = 'rgba(0,0,0,0.35)'; ctx.shadowBlur = 24 * s; ctx.fillStyle = g; K.poly(ctx, [a1, a2, c2, c1], true); ctx.fill();
      }
      ctx.restore();
      void covered;
    },
  };

  // ---------- the shared demo: carved on one block, proof pulled for the result ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 128 * s], video: [100 * s, 280 * s, 260 * s, 160 * s], node: [450 * s, 290 * s, 340 * s, 140 * s],
      chips: PL.map((_, i) => [935 * s, (205 + i * 63) * s]), top: [W / 2, 115 * s], counter: [W / 2, 375 * s], take: [W / 2, 560 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.18, W * 0.5, H * 0.13], node: [W * 0.17, H * 0.41, W * 0.66, H * 0.085],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.6 + Math.floor(i / 2) * 0.07)]), top: [W / 2, H * 0.2], counter: [W / 2, H * 0.47], take: [W / 2, H * 0.72] };
  }
  function node(ctx, x, y, w, h, p, s) {
    style.box(ctx, x, y, w, h, p, { fill: C.red, seed: 41, tone: 6 });
    if (p > 0.45) { const sz = K.fitSize(ctx, 'CREATOR OS', CARVE, 400, 46 * s, w - 84 * s); style.title(ctx, 'CREATOR OS', x + w / 2 + 26 * s, y + h / 2 + sz * 0.36, K.clamp((p - 0.45) / 0.55), { size: sz / s, align: 'center', seed: 42 }); }
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      // gentle camera ease-in on the print
      const z = 1 + 0.025 * K.beat(t, scene2 ? 8.3 : 0, 4, 'inOut');
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      style.background(ctx, W, H, t, { edition: scene2 ? 4 : 3, title: !scene2 || t < 10.3 });
      if (!scene2) {
        if (P) { style.title(ctx, 'ONE VIDEO.', Lo.title[0], Lo.title[1] - 30 * s, K.beat(t, 0.2, 0.8, 'lin'), { size: 56, align: 'center' }); style.title(ctx, 'EVERY PLATFORM.', Lo.title[0], Lo.title[1] + 50 * s, K.beat(t, 0.9, 1.0, 'lin'), { size: 56, align: 'center' }); }
        else style.title(ctx, 'ONE VIDEO. EVERY PLATFORM.', Lo.title[0], Lo.title[1], K.beat(t, 0.2, 1.6, 'lin'), { size: 56, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video;
        const vp = K.beat(t, 2.0, 0.9, 'lin');
        style.box(ctx, vx, vy, vw, vh, vp, { fill: false, seed: 21 });
        if (vp > 0.6) { ctx.save(); ctx.fillStyle = pat(ctx, C.red, 50); const r = Math.min(vw, vh) * 0.28, cx = vx + vw * 0.55, cy = vy + vh / 2; ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx - r * 0.6, cy + r); ctx.closePath(); ctx.fill(); ctx.fillStyle = C.cut; for (let i = 0; i < 4; i++) gouge(ctx, [cx - r * 0.45, cy - r * 0.7 + i * r * 0.45], [cx + r * 0.3, cy - r * 0.2 + i * r * 0.2], 1.6 * s); ctx.restore(); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 52 * s, K.beat(t, 2.7, 0.5, 'lin'), { align: 'center', size: 32 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 80 * s], [nx + nw / 2, ny - 16 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 18 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: P ? 0 : -0.1 });
        node(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.9, 'lin'), s);
        if (P) style.arrow(ctx, [W / 2, ny + nh + 14 * s], [W / 2, Lo.chips[6][1] + 12 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0.0, width: 3 });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 16 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 12 * s] : [cx - 24 * s, cy - 12 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, width: 2.6, seed: 50 + i });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.25, 0.35, 'lin'), { size: P ? 30 : 32, align: P ? (left ? 'right' : 'left') : 'left', banner: i % 3 === 0, seed: 60 + i });
        });
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * 0.9, h2 = nh * 0.85;
        node(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, s);
        { const [bx, by, bw, bh] = block(W, H); ctx.save(); ctx.beginPath(); ctx.rect(bx + 14 * s, by + 14 * s, bw - 28 * s, bh - 28 * s); ctx.clip();
          style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 40 * s, (P ? 250 : 300) * s, K.beat(t, 10.0, 0.5, 'out'), { ry: P ? 1.0 : 0.5 }); ctx.restore(); }
        const v = K.count(Math.floor(t * 12) / 12, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 104 : 120 });
        style.label(ctx, 'VIEWS', Lo.counter[0], Lo.counter[1] + 66 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 36 });
        const tk = K.beat(t, 10.5, 1.0, 'lin');
        if (P) { style.title(ctx, 'POST ONCE.', Lo.take[0], Lo.take[1], tk, { size: 46, align: 'center' }); style.title(ctx, 'REACH EVERYWHERE.', Lo.take[0], Lo.take[1] + 68 * s, K.beat(t, 10.8, 0.9, 'lin'), { size: 46, align: 'center' }); }
        else style.title(ctx, 'POST ONCE. REACH EVERYWHERE.', Lo.take[0], Lo.take[1], tk, { size: 50, align: 'center' });
        // the printmaker's pencil note in the margin, ticking the result
        const np = K.beat(t, 10.3, 0.6, 'lin');
        if (np > 0) { ctx.save(); ctx.fillStyle = C.pencil; ctx.font = K.font(34 * s, HAND, 700); ctx.textAlign = 'center'; const n = Math.ceil('good edition!'.length * np); const [, by0, , bh0] = block(W, H); ctx.fillText('good edition!'.slice(0, n), W / 2, by0 + bh0 + (P ? 70 : 52) * s); ctx.restore(); }
      }
      ctx.restore();
      if (t > 7.4 && t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2);
      for (let i = 0; i < 6; i++) k.play('paper', 0.2 + i * 0.27, { dur: 0.2, gain: 0.8 });
      k.play('scribble', 2.0, { medium: 'pencil', dur: 0.9, gain: 1.6 }); k.play('paper', 2.0, { dur: 0.8 });
      k.play('thud', 2.7, { gain: 0.5 }); k.play('paper', 3.3, { dur: 0.7 }); k.play('scribble', 3.3, { medium: 'chalk', dur: 0.7, gain: 0.6 });
      k.play('paper', 4.0, { dur: 0.9 }); k.play('thud', 4.8, { gain: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('paper', 5.0 + i * 0.4, { dur: 0.3, gain: 0.7 }); k.play('thud', 5.3 + i * 0.4, { gain: 0.45 }); }
      k.play('paper', 7.4, { dur: 0.9, gain: 1.4 }); k.play('thud', 8.3, { gain: 0.6 }); k.play('paper', 8.3, { dur: 0.9, gain: 1.2 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0); k.play('scribble', 10.3, { medium: 'pencil', dur: 0.6, gain: 1.6 });
      for (let i = 0; i < 4; i++) k.play('paper', 10.5 + i * 0.25, { dur: 0.18, gain: 0.7 });
      k.play('chime', 11.4, { note: 'G5' });
    },
  };
  MS.register(style);
})();
