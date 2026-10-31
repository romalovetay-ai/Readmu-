// Gouache Travel Poster (Painterly). A mid-century travel poster hand-painted in gouache: a handful of flat, opaque,
// matte colours stacked in receding layers (sky bands, sun, far and near ridges, ground), dry-brush streaks inside
// every shape and ragged dry edges where the paint thins, chalky paper grain, and a bold hand-lettered band.
// Shapes are painted on in one brush pass each; arrows are flat poster arrows; emphasis is an orange starburst.
// Scene change = a fresh coat of cream swept across the board before the next poster.
(function () {
  const GO = { cream: '#efe5cf', peach: '#f3b79a', pink: '#e98f86', sun: '#e8582a', teal: '#4f9a98', deep: '#24626a', sage: '#9cbf9b', navy: '#1e3350', mustard: '#e2a93b', ink: '#1b2638' };
  const BIG = 'Bebas Neue', SMALL = 'Oswald';
  const S = (W, H) => K.layout(W, H).s;

  // dry-brush streak tiles: one neutral (light/dark streaks inside shapes), one per colour (ragged edges)
  const streaks = () => K.cached('go-streaks', () => {
    const w = 320, h = 256, c = K.layer(w, h), x = c.getContext('2d'), r = K.rng(4);
    for (let i = 0; i < 160; i++) {
      const y = r() * h, x0 = r() * w, L = r.range(40, 200);
      x.strokeStyle = r() < 0.5 ? `rgba(255,250,235,${r.range(0.03, 0.08)})` : `rgba(20,15,10,${r.range(0.02, 0.06)})`; x.lineWidth = r.range(0.6, 2.2);
      for (const ox of [0, -w]) { x.beginPath(); x.moveTo(x0 + ox, y); x.lineTo(x0 + ox + L, y + r.range(-1.5, 1.5)); x.stroke(); }
    }
    return c;
  });
  const dry = (col) => K.cached('go-dry:' + col, () => {
    const w = 128, h = 48, c = K.layer(w, h), x = c.getContext('2d'), r = K.rng(9);
    for (let i = 0; i < 60; i++) { const y = r() * h; x.strokeStyle = K.rgba(col, r.range(0.5, 1)); x.lineWidth = r.range(0.6, 2.2); const x0 = r() * w, L = r.range(10, 70); x.beginPath(); x.moveTo(x0, y); x.lineTo(x0 + L, y + r.range(-1, 1)); x.stroke(); x.beginPath(); x.moveTo(x0 - w, y); x.lineTo(x0 - w + L, y); x.stroke(); }
    return c;
  });
  // paint a flat gouache shape: opaque fill, streaks inside, a dry ragged edge; o.p sweeps the brush left to right
  function paint(ctx, path, col, o = {}) {
    const s = S(ctx.canvas.width, ctx.canvas.height), p = o.p ?? 1; if (p <= 0) return;
    ctx.save();
    if (p < 1 && o.bb) { const [bx, by, bw, bh] = o.bb, e = bx - 20 * s + (bw + 40 * s) * p; ctx.beginPath(); ctx.rect(bx - 40 * s, by - 40 * s, e - bx + 40 * s, bh + 80 * s); ctx.clip(); }
    path(ctx); ctx.fillStyle = col; ctx.fill();
    ctx.save(); path(ctx); ctx.clip(); ctx.fillStyle = ctx.createPattern(streaks(), 'repeat'); ctx.fillRect(-ctx.canvas.width, -ctx.canvas.height, ctx.canvas.width * 3, ctx.canvas.height * 3); ctx.restore();
    path(ctx); ctx.strokeStyle = ctx.createPattern(dry(col), 'repeat'); ctx.lineWidth = (o.edge || 7) * s; ctx.stroke();
    ctx.restore();
  }
  const polyPath = (pts) => (c) => K.poly(c, pts, true);
  const rrPath = (x, y, w, h, r) => (c) => { c.beginPath(); c.roundRect(x, y, w, h, r); };

  function letters(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 72) * s, fam = o.family || BIG;
    ctx.save(); ctx.font = K.font(size, fam, fam === SMALL ? 700 : 400); if (o.spacing) ctx.letterSpacing = o.spacing * s + 'px';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.textAlign = 'left';
    ctx.beginPath(); ctx.rect(x0 - 10 * s, y - size, (w + 20 * s) * K.clamp(p), size * 1.4); ctx.clip();
    ctx.fillStyle = o.color || GO.cream; ctx.fillText(text, x0, y);
    // hand-lettered: brush streaks inside the letters and a slightly uneven second pass
    ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = ctx.createPattern(streaks(), 'repeat'); ctx.fillRect(x0, y - size, w, size * 1.3);
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 0.25; ctx.fillStyle = o.color || GO.cream; ctx.fillText(text, x0 + 1 * s, y - 0.6 * s);
    ctx.restore(); return { w, h: size };
  }

  function frameRect(W, H) { const s = S(W, H), b = (H > W ? 30 : 22) * s; return [b, b, W - 2 * b, H - 2 * b]; }
  function bandY(W, H) { return H > W ? H * 0.8 : H * 0.79; }

  const style = {
    id: 'gouache-poster', name: 'Gouache Travel Poster', family: 'Painterly',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Oswald:wght@500;700&display=block', specs: ['400 72px "Bebas Neue"', '700 30px "Oswald"'] }],
    palette: { bg: GO.cream, ...GO, accent: GO.sun },
    sfx: { draw: 'brush', land: 'pop', emphasis: 'stamp', transition: 'whoosh', bed: 'room' },

    // the poster scenery: stacked flat layers with a slow parallax and a rising sun
    background(ctx, W, H, t, o = {}) {
      const s = S(W, H), [fx, fy, fw, fh] = frameRect(W, H), portrait = H > W, by = bandY(W, H), rise = o.rise ?? K.clamp(t / 12);
      ctx.fillStyle = GO.cream; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.rect(fx, fy, fw, fh); ctx.clip();
      const horizon = portrait ? H * 0.6 : H * 0.6;
      // sky in three flat bands
      paint(ctx, rrPath(fx, fy, fw, horizon - fy, 0), GO.pink, { edge: 0 });
      paint(ctx, rrPath(fx, fy + (horizon - fy) * 0.38, fw, (horizon - fy) * 0.62, 0), GO.peach, { edge: 6 });
      paint(ctx, rrPath(fx, fy + (horizon - fy) * 0.74, fw, (horizon - fy) * 0.26, 0), '#f6cfa8', { edge: 6 });
      // sun rising behind the ridges
      const sx = portrait ? W * 0.5 : W * 0.5, sy = horizon - (portrait ? 80 : 60) * s - rise * 70 * s, sr = (portrait ? 150 : 120) * s;
      paint(ctx, (c) => { c.beginPath(); c.arc(sx, sy, sr, 0, Math.PI * 2); }, GO.sun, { edge: 6 });
      // birds
      ctx.strokeStyle = GO.ink; ctx.lineWidth = 3 * s; ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) { const bx = W * (portrait ? 0.2 : 0.18) + i * 34 * s + t * 6 * s, bb = fy + (portrait ? 0.08 : 0.16) * H + Math.sin(i * 2 + t) * 6 * s; ctx.beginPath(); ctx.moveTo(bx - 10 * s, bb - 4 * s); ctx.quadraticCurveTo(bx - 4 * s, bb - 8 * s, bx, bb); ctx.quadraticCurveTo(bx + 4 * s, bb - 8 * s, bx + 10 * s, bb - 4 * s); ctx.stroke(); }
      // far + near ridges with parallax drift
      const ridge = (base, amp, n, seed, shift) => { const r = K.rng(seed), pts = [[fx - 40 * s, by]]; for (let i = 0; i <= n; i++) pts.push([fx - 40 * s + ((fw + 80 * s) * i) / n + shift, base - (i % 2 ? amp * r.range(0.6, 1) : amp * r.range(0.05, 0.3))]); pts.push([fx + fw + 80 * s, by]); return pts; };
      const far = ridge(horizon + 10 * s, (portrait ? 170 : 140) * s, portrait ? 7 : 11, 3, -t * 3 * s);
      paint(ctx, polyPath(far), GO.teal, { edge: 6 });
      // snow caps on the far peaks
      far.forEach((pt, i) => { if (i % 2 === 0 || i === 0 || i >= far.length - 1) return; const a = far[i - 1], b = far[i + 1], k = 0.22; paint(ctx, polyPath([pt, [K.lerp(pt[0], b[0], k), K.lerp(pt[1], b[1], k)], [K.lerp(pt[0], a[0], k), K.lerp(pt[1], a[1], k)]]), GO.cream, { edge: 3 }); });
      paint(ctx, polyPath(ridge(horizon + 60 * s, (portrait ? 110 : 80) * s, portrait ? 5 : 8, 5, -t * 7 * s)), GO.deep, { edge: 6 });
      paint(ctx, polyPath([[fx, horizon + (portrait ? 130 : 100) * s], [fx + fw * 0.4, horizon + (portrait ? 100 : 80) * s - 0], [fx + fw, horizon + (portrait ? 140 : 105) * s], [fx + fw, by], [fx, by]]), GO.sage, { edge: 6 });
      // lettering band
      paint(ctx, rrPath(fx, by, fw, fy + fh - by, 0), GO.navy, { edge: 5 });
      ctx.restore();
    },
    finish(ctx, W, H, t) {
      // matte paper: chalky grain multiplied over everything, a faint sun-faded edge
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(K.paperTex(W, H, '#f4ecdc', 15, 0.06, false), 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.18, '#6a4a2a');
      K.grain(ctx, W, H, t, 0.05, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return letters(ctx, text.toUpperCase(), x, y, p, { size: 80, spacing: 2, ...o }); },
    // labels: navy hand-lettering on a painted cream tag
    label(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 36) * s;
      ctx.save(); ctx.font = K.font(size, BIG, 400); ctx.letterSpacing = 1.5 * s + 'px'; const w = ctx.measureText(text.toUpperCase()).width; ctx.restore();
      const pad = 14 * s, bw = w + pad * 2, bh = size * 1.2, bx = o.align === 'center' ? x - bw / 2 : o.align === 'right' ? x - bw : x, by = y - size * 0.95;
      if (o.tag !== false) paint(ctx, rrPath(bx, by, bw, bh, 6 * s), o.tagColor || GO.cream, { p: K.clamp(p * 1.6), bb: [bx, by, bw, bh], edge: 5 });
      letters(ctx, text.toUpperCase(), bx + pad, y, K.clamp((p - 0.3) / 0.7), { size: o.size || 36, color: o.color || GO.navy, spacing: 1.5 });
      return { w: bw, h: bh };
    },
    // flat poster arrow: a thick shaft and a wide triangular head, painted in one pass
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || GO.cream, w = (o.width || 14) * s, L = Math.hypot(to[0] - from[0], to[1] - from[1]), ang = Math.atan2(to[1] - from[1], to[0] - from[0]);
      const hl = Math.min(34 * s, L * 0.45), len = L * K.clamp(p);
      if (len < 2) return null;
      ctx.save(); ctx.translate(from[0], from[1]); ctx.rotate(ang);
      const shaft = Math.max(0, len - hl), pts = len > hl ? [[0, -w / 2], [shaft, -w / 2], [shaft, -w * 1.5], [len, 0], [shaft, w * 1.5], [shaft, w / 2], [0, w / 2]] : [[0, -w / 2], [len, -w / 2], [len, w / 2], [0, w / 2]];
      paint(ctx, polyPath(pts), col, { edge: 4 });
      ctx.restore();
      return [from[0] + Math.cos(ang) * len, from[1] + Math.sin(ang) * len];
    },
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      // offset flat shadow block, then the card painted in one stroke of the brush
      paint(ctx, rrPath(x + 10 * s, y + 10 * s, w, h, 12 * s), o.shadow || GO.ink, { p: K.clamp(p * 1.3), bb: [x, y, w + 10 * s, h + 10 * s], edge: 4 });
      paint(ctx, rrPath(x, y, w, h, 12 * s), o.color || GO.cream, { p: K.clamp(p * 1.3 - 0.15), bb: [x, y, w, h], edge: 6 });
    },
    counter(ctx, value, x, y, p, o = {}) { return letters(ctx, K.fmt(value), x, y, 1, { size: o.size || 150, align: o.align || 'center', color: o.color || GO.navy, spacing: 3 }); },
    // orange starburst stamped behind the key number
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), n = 18, k = K.ease.back(K.clamp(p)), pts = [];
      for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 + 0.1, rr = (i % 2 ? r * 0.78 : r) * k; pts.push([x + Math.cos(a) * rr * 1.25, y + Math.sin(a) * rr * 0.75]); }
      if (k > 0.01) paint(ctx, polyPath(pts), o.color || GO.mustard, { edge: 6 });
    },
    // a fresh coat of cream swept across the board: covered at 0.5
    transition(ctx, W, H, p, o = {}) {
      if (p >= 0.5) return;
      const s = S(W, H), k = K.ease.inOut(K.clamp(p / 0.5)), e = K.lerp(-80 * s, W + 120 * s, k);
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, Math.max(0, e - 40 * s), H); ctx.fillStyle = GO.cream; ctx.fill();
      ctx.fillStyle = ctx.createPattern(streaks(), 'repeat'); ctx.fillRect(0, 0, Math.max(0, e - 40 * s), H);
      // dry front edge of the brush
      ctx.fillStyle = ctx.createPattern(dry(GO.cream), 'repeat'); ctx.fillRect(e - 46 * s, 0, 70 * s, H);
      ctx.restore();
    },
  };

  // ---------- demo: one poster becomes the next ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [90 * s, 220 * s, 240 * s, 150 * s], node: [470 * s, 240 * s, 290 * s, 120 * s],
      chips: PLATFORMS.map((n, i) => [940 * s, (112 + i * 64) * s]), counter: [W / 2, 330 * s] };
    return { s, video: [W * 0.27, H * 0.14, W * 0.46, H * 0.1], node: [W * 0.17, H * 0.31, W * 0.66, H * 0.075],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.475 + Math.floor(i / 2) * 0.075)]), counter: [W / 2, H * 0.43] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W, by = bandY(W, H), [fx, fy, fw, fh] = frameRect(W, H), scene2 = t >= 7.75;
      style.background(ctx, W, H, t, { rise: scene2 ? K.clamp((t - 7.75) / 4) : K.clamp(t / 7.5) });
      const bandText = (lines, p, sz) => lines.forEach((ln, i) => style.title(ctx, ln, fx + 40 * s, by + (portrait ? 108 + i * 100 : 104) * s, K.clamp(p * lines.length - i), { size: sz }));
      const sub = (txt, p) => { ctx.save(); ctx.font = K.font(24 * s, SMALL, 700); const w = ctx.measureText(txt).width; ctx.restore(); letters(ctx, txt, fx + fw - 40 * s - w, by + (portrait ? 70 : 50) * s, p, { size: 24, family: SMALL, color: GO.mustard, spacing: 2 }); };
      if (!scene2) {
        bandText(portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], K.beat(t, 0.15, 1.4, 'lin'), portrait ? 84 : 84);
        if (!portrait) sub('CREATOR OS LINE', K.beat(t, 1.2, 0.5, 'lin'));
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.7, 'out'), {});
        if (t > 2.6) { const k = K.beat(t, 2.6, 0.3, 'back'), cx = vx + vw * 0.5, cy = vy + vh * 0.5, z = Math.min(vw, vh) * 0.25 * k; paint(ctx, polyPath([[cx - z * 0.8, cy - z], [cx - z * 0.8, cy + z], [cx + z, cy]]), GO.sun, { edge: 4 }); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 56 * s, K.beat(t, 3.0, 0.45, 'lin'), { align: 'center', tagColor: GO.mustard, color: GO.navy });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 76 * s], [nx + nw / 2, ny - 14 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 16 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.45, 0.5, 'out'), { color: GO.navy });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.7, 'out'), { color: GO.navy, shadow: GO.sun });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 24 * s, K.beat(t, 4.45, 0.45, 'lin'), { size: 64, align: 'center', color: GO.cream });
        if (portrait) style.arrow(ctx, [W / 2, ny + nh + 14 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.95, 0.4, 'out'), { color: GO.navy, width: 12 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'out');
          const from = portrait ? [W / 2, cy - 14 * s] : [nx + nw + 18 * s, ny + nh / 2], to = portrait ? [left ? W * 0.455 : W * 0.545, cy - 14 * s] : [cx - 14 * s, cy - 14 * s];
          style.arrow(ctx, from, to, p, { color: GO.navy, width: 9 });
          style.label(ctx, name, portrait ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.2, 0.3, 'lin'), { size: portrait ? 38 : 36, align: portrait ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.25) style.transition(ctx, W, H, K.clamp((t - 7.25) / 1.0), {});
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.13 : 95 * s;
        style.box(ctx, W / 2 - nw / 2, top - nh / 2, nw, nh, K.beat(t, 7.8, 0.5, 'out'), { color: GO.navy, shadow: GO.sun });
        style.title(ctx, 'Creator OS', W / 2, top + 24 * s, K.beat(t, 8.1, 0.4, 'lin'), { size: 64, align: 'center', color: GO.cream });
        const C = Lo.counter, ep = K.beat(t, 10.0, 0.45, 'lin');
        style.emphasis(ctx, C[0], C[1] - 40 * s, (portrait ? 250 : 220) * s, ep, {});
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t >= 8.55) style.counter(ctx, Math.round(v / 1000) * 1000, C[0], C[1], 1, { size: portrait ? 150 : 150 });
        letters(ctx, 'VIEWS', C[0], C[1] + 58 * s, K.beat(t, 8.7, 0.4, 'lin'), { size: 48, align: 'center', color: GO.navy, spacing: 6 });
        bandText(portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], K.beat(t, 10.5, 0.9, 'lin'), portrait ? 80 : 84);
        if (!portrait) sub('DEPARTS DAILY', K.beat(t, 10.9, 0.4, 'lin'));
        if (t < 8.25) style.transition(ctx, W, H, K.clamp((t - 7.25) / 1.0), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.8); k.play('swell', 0, { dur: 2.5, chord: ['F4', 'A4', 'C5'], gain: 0.9 });
      k.play('scribble', 0.15, { medium: 'brush', dur: 1.4 });
      k.play('scribble', 2.0, { medium: 'brush', dur: 0.7 }); k.play('pop', 2.75);
      k.play('scribble', 3.0, { medium: 'brush', dur: 0.4, gain: 0.7 }); k.play('whoosh', 3.45, { dur: 0.45, gain: 0.5 });
      k.play('scribble', 4.0, { medium: 'brush', dur: 0.7 }); k.play('pop', 4.6, { pitch: 0.8 });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.25, gain: 0.3 }); k.play('pop', 5.22 + i * 0.4, { pitch: 1 + i * 0.07 }); }
      k.play('whoosh', 7.25, { dur: 0.8, gain: 0.8 }); k.play('scribble', 7.25, { medium: 'brush', dur: 0.8, gain: 1.4 });
      k.play('scribble', 7.8, { medium: 'brush', dur: 0.5 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0);
      k.play('scribble', 10.5, { medium: 'brush', dur: 0.9 }); k.play('chime', 11.4, { note: 'F6' });
    },
  };
  MS.register(style);
})();
