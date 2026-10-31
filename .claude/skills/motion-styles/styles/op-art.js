// Op Art Sphere (Generative & Type). Hard-edged black and ivory checkerboard that ripples into Riley folds and swells
// into a Vasarely lens-sphere, with red cells flipping in from the centre. Flat acrylic on primed canvas: every cell
// is a warped quad of the same grid, so the optical vibration is real geometry, not a filter.
(function () {
  const C = { ivory: '#efe9da', black: '#121212', red: '#d22b21', canvas: '#e6dfcd' };
  const HEAD = 'Archivo Black';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;

  // warp of a grid point: Riley folds (column squeeze + drift) then the lens (radial sine magnification)
  function warp(x, y, W, H, o) {
    let X = x, Y = y;
    if (o.fold) { const k = TAU / (o.lam || W * 0.22); X += o.fold * Math.sin(y * k * 0.6 + o.ph) * 0.35 + o.fold * Math.sin(x * k + o.ph * 0.7); Y += o.fold * 0.3 * Math.sin(x * k * 0.8 - o.ph); }
    if (o.lens > 0) {
      const dx = X - o.cx, dy = Y - o.cy, d = Math.hypot(dx, dy), R = o.R;
      if (d < R && d > 0) { const u = d / R, d2 = R * Math.sin(u * Math.PI / 2); const nd = K.lerp(d, d2, o.lens); X = o.cx + (dx / d) * nd; Y = o.cy + (dy / d) * nd; }
    }
    return [X, Y];
  }
  function board(ctx, W, H, t, o) {
    const s = S(W, H), cell = (o.cell || 46) * s, cols = Math.ceil(W / cell) + 3, rows = Math.ceil(H / cell) + 3, ox = -cell * 1.5 + ((W - (cols - 3) * cell) / 2) % cell, oy = -cell * 1.5;
    const G = [];
    for (let j = 0; j <= rows; j++) { const row = []; for (let i = 0; i <= cols; i++) row.push(warp(ox + i * cell, oy + j * cell, W, H, o)); G.push(row); }
    ctx.fillStyle = C.ivory; ctx.fillRect(0, 0, W, H);
    const red = o.red || 0, rc = o.R * 0.66;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const black = (i + j) % 2 === 0, cx0 = ox + (i + 0.5) * cell, cy0 = oy + (j + 0.5) * cell;
      const dd = Math.hypot(cx0 - o.cx, cy0 - o.cy), isRed = !black && o.lens > 0.5 && dd < rc && red > dd / rc;
      if (!black && !isRed) continue;
      const a = G[j][i], b = G[j][i + 1], c = G[j + 1][i + 1], d = G[j + 1][i];
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.lineTo(d[0], d[1]); ctx.closePath();
      ctx.fillStyle = isRed ? C.red : C.black; ctx.fill();
    }
  }

  const style = {
    id: 'op-art', name: 'Op Art Sphere', family: 'Generative & Type',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=block', specs: ['400 60px "Archivo Black"'] }],
    palette: C,
    sfx: { draw: null, land: 'click', emphasis: 'stamp', transition: 'whoosh', bed: 'room' },

    background(ctx, W, H, t, o = {}) { board(ctx, W, H, t, { cx: W / 2, cy: H / 2, R: 1, lens: 0, fold: 0, ph: 0, ...o }); },

    // primed canvas: linen weave + faint brush drag, a whisper of vignette
    finish(ctx, W, H, t) {
      const s = S(W, H);
      const weave = K.cached(`oa-weave`, () => {
        const n = 64, c = K.layer(n, n), x = c.getContext('2d'), r = K.rng(5);
        x.fillStyle = '#808080'; x.fillRect(0, 0, n, n);
        for (let i = 0; i < n; i += 2) { x.fillStyle = `rgba(255,255,255,${0.10 + r() * 0.08})`; x.fillRect(0, i, n, 1); x.fillStyle = `rgba(0,0,0,${0.08 + r() * 0.08})`; x.fillRect(i, 0, 1, n); }
        return c;
      });
      ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.55; ctx.fillStyle = ctx.createPattern(weave, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
      const brush = K.cached(`oa-brush:${W}x${H}`, () => K.paperTex(W, H, '#808080', 44, 0.25, true));
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = 0.5; ctx.drawImage(brush, 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.18, '#000');
      K.grain(ctx, W, H, t, 0.03, 12, 'overlay');
    },

    // headline on a hard-edged ivory band with a black slab edge; slides in as a solid slab
    title(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = K.fitSize(ctx, text, HEAD, 400, (o.size || 58) * s, ctx.canvas.width * 0.88);
      ctx.save(); ctx.font = K.font(size, HEAD, 400);
      const tw = ctx.measureText(text).width, pad = size * 0.45, w = tw + pad * 2, h = size * 1.45, e = K.ease.out(K.clamp(p));
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      ctx.beginPath(); ctx.rect(x0, y - h * 0.72, w * e, h); ctx.clip();
      ctx.fillStyle = o.band || C.ivory; ctx.fillRect(x0, y - h * 0.72, w, h);
      ctx.fillStyle = C.black; ctx.fillRect(x0, y - h * 0.72, w, 6 * s); ctx.fillRect(x0, y + h * 0.28 - 6 * s, w, 6 * s);
      ctx.fillStyle = o.color || C.black; ctx.fillText(text, x0 + pad, y);
      ctx.restore(); return { w, h };
    },
    // hard-edged slab label: black (or red) block, ivory type
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 30) * s, e = K.ease.out(K.clamp(p));
      ctx.save(); ctx.font = K.font(size, HEAD, 400);
      const tw = ctx.measureText(text).width, w = tw + size * 0.9, h = size * 1.55;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      ctx.beginPath(); ctx.rect(x0, y - h / 2, w, h * e); ctx.clip();
      ctx.fillStyle = C.ivory; ctx.fillRect(x0 - 5 * s, y - h / 2 - 5 * s, w + 10 * s, h + 10 * s);
      ctx.fillStyle = o.fill || C.black; ctx.fillRect(x0, y - h / 2, w, h);
      ctx.fillStyle = o.color || C.ivory; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + size * 0.45, y + size * 0.05);
      ctx.restore(); return { w, h };
    },
    // hard bar arrow: black bar with ivory keyline so it reads over the checkers
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.ease.inOut(K.clamp(p)), dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy), th = (o.width || 12) * s, len = L * e;
      ctx.save(); ctx.translate(from[0], from[1]); ctx.rotate(Math.atan2(dy, dx));
      const shape = () => { ctx.beginPath(); ctx.moveTo(0, -th / 2); ctx.lineTo(Math.max(0, len - th * 2), -th / 2); ctx.lineTo(Math.max(0, len - th * 2), -th * 1.4); ctx.lineTo(len, 0); ctx.lineTo(Math.max(0, len - th * 2), th * 1.4); ctx.lineTo(Math.max(0, len - th * 2), th / 2); ctx.lineTo(0, th / 2); ctx.closePath(); };
      shape(); ctx.lineJoin = 'miter'; ctx.strokeStyle = C.ivory; ctx.lineWidth = 8 * s; ctx.stroke(); ctx.fillStyle = o.color || C.black; ctx.fill();
      ctx.restore(); return [from[0] + dx * e, from[1] + dy * e];
    },
    // ivory panel with a heavy black frame and a red corner block
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.ease.back(K.clamp(p));
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(e, e); ctx.translate(-w / 2, -h / 2);
      ctx.fillStyle = C.black; ctx.fillRect(-8 * s, -8 * s, w + 16 * s, h + 16 * s); ctx.fillStyle = o.fill || C.ivory; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = C.red; ctx.fillRect(w - 26 * s, h - 26 * s, 26 * s, 26 * s);
      ctx.restore();
    },
    // Archivo Black figures on a full ivory band
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), W = ctx.canvas.width, size = K.fitSize(ctx, K.fmt(1000000), HEAD, 400, (o.size || 120) * s, W * 0.86), txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, HEAD, 400);
      const h = size * 1.3; ctx.fillStyle = C.ivory; ctx.fillRect(0, y - size * 0.95, W, h); ctx.fillStyle = C.black; ctx.fillRect(0, y - size * 0.95, W, 8 * s); ctx.fillRect(0, y - size * 0.95 + h - 8 * s, W, 8 * s);
      ctx.fillStyle = o.color || C.black; ctx.textAlign = 'center'; ctx.fillText(txt, x, y);
      ctx.restore();
    },
    // Vasarely concentric squares stepping out, alternating red and black
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p));
      ctx.save(); ctx.lineJoin = 'miter';
      for (let i = 0; i < 5; i++) { const q = K.clamp(k * 1.3 - i * 0.08); if (q <= 0) continue; const rr = r * (0.55 + i * 0.12) * q, ry = rr * (o.ry ?? 0.42); ctx.strokeStyle = i % 2 ? C.black : C.red; ctx.lineWidth = 10 * s; ctx.strokeRect(x - rr, y - ry, rr * 2, ry * 2); }
      ctx.restore();
    },
    // Riley fold: the picture is crushed into ever more crowded black/ivory columns (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), e = Math.sin(Math.PI * p), n = 40, cover = K.clamp(e * 1.15);
      ctx.save();
      for (let i = 0; i < n; i++) {
        const u0 = i / n, u1 = (i + 1) / n, f = (u) => u + 0.06 * Math.sin(u * TAU * 3 + p * 6) * e;
        const x0 = f(u0) * W, x1 = f(u1) * W, wc = (x1 - x0) * cover;
        ctx.fillStyle = i % 2 ? C.black : C.ivory;
        for (let j = 0; j < 6; j++) { const y0 = (j / 6) * H, yy = H / 6 + 1, sk = Math.sin(j * 1.7 + p * 9) * 20 * s * e; ctx.fillRect(x0 + (x1 - x0 - wc) / 2 + sk, y0, wc, yy); }
      }
      ctx.restore();
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 100 * s], video: [70 * s, 290 * s, 210 * s, 140 * s], node: [560 * s, 400 * s, 210 * s],
      chips: PLATFORMS.map((n, i) => [960 * s, (190 + i * 70) * s]), counter: [W / 2, 420 * s], take: [W / 2, 650 * s], top: [W / 2, 160 * s, 120 * s] };
    return { s, P: true, title: [W / 2, H * 0.08], video: [W * 0.3, H * 0.115, W * 0.4, H * 0.075], node: [W / 2, H * 0.43, W * 0.26],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.67 + Math.floor(i / 2) * 0.066)]), counter: [W / 2, H * 0.55], take: [W / 2, H * 0.8], top: [W / 2, H * 0.28, W * 0.22] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, s2 = t >= 8.25;
      const [ncx, ncy, nR] = s2 ? Lo.top : Lo.node;
      // folds ripple in, then the lens swells past its size and settles; red cells flip in from the centre
      const fold = (s2 ? 10 : K.lerp(0, 22, K.beat(t, 0.2, 1.6, 'inOut'))) * s * (1 + 0.2 * Math.sin(t * 1.2));
      const lensT = s2 ? 1 : K.beat(t, 3.9, 0.9, 'back');
      const R = nR * (s2 ? 1 : (0.2 + 0.8 * Math.min(1.15, lensT)) * (1 + 0.03 * Math.sin(t * 2)));
      style.background(ctx, W, H, t, { cx: ncx, cy: ncy, R, lens: s2 ? 1 : K.clamp(lensT), fold, ph: t * 0.6, red: s2 ? 1 : K.beat(t, 4.6, 0.9, 'lin'), cell: P ? 40 : 46 });
      if (!s2) {
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.3, 0.8), { size: P ? 48 : 52, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.5, 'lin'));
        if (t > 2.3) { ctx.fillStyle = C.black; ctx.beginPath(); ctx.moveTo(vx + vw * 0.38, vy + vh * 0.28); ctx.lineTo(vx + vw * 0.64, vy + vh * 0.5); ctx.lineTo(vx + vw * 0.38, vy + vh * 0.72); ctx.fill(); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 44 * s, K.beat(t, 2.6, 0.3), { align: 'center' });
        const a1 = P ? [[W / 2, vy + vh + 80 * s], [W / 2, ncy - nR - 14 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [ncx - nR - 12 * s, ncy - 40 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.5));
        style.label(ctx, 'Creator OS', ncx, ncy + nR + (P ? 50 : 42) * s, K.beat(t, 4.6, 0.3), { align: 'center', fill: C.red, size: 34 });
        if (P) style.arrow(ctx, [W / 2, ncy + nR + 92 * s], [W / 2, Lo.chips[6][1] + 30 * s], K.beat(t, 4.9, 0.5), { width: 10 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const a = -0.75 + (i / 6) * 1.5, from = P ? [W / 2, cy] : [ncx + Math.cos(a) * nR * 1.02, ncy + Math.sin(a) * nR * 1.02], to = P ? [left ? W * 0.455 : W * 0.545, cy] : [cx - 14 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35), { width: P ? 9 : 9, color: i % 2 ? C.red : C.black });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.3, 0.25), { align: P ? (left ? 'right' : 'left') : 'left', fill: i % 2 ? C.red : C.black, size: P ? 28 : 30 });
        });
      } else {
        style.label(ctx, 'Creator OS', ncx, ncy + nR + (P ? 46 : 36) * s, 1, { align: 'center', fill: C.red, size: P ? 32 : 28 });
        const [cx, cy] = Lo.counter, v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.emphasis(ctx, cx, cy - 40 * s, (P ? 470 : 600) * s, K.beat(t, 10.0, 0.7, 'lin'), { ry: P ? 0.5 : 0.3 });
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy, 1, { size: P ? 110 : 120 });
        style.label(ctx, 'views', cx, cy + (P ? 90 : 70) * s, K.beat(t, 8.8, 0.3), { align: 'center' });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.8), { size: P ? 48 : 52, align: 'center' });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      for (let i = 0; i < 8; i++) k.play('click', 0.2 + i * 0.2, { pitch: 0.8 + i * 0.05 });
      k.play('thud', 0.3, { gain: 0.5 }); k.play('click', 2.0); k.play('pop', 2.3, { pitch: 0.7 }); k.play('click', 2.6, { pitch: 1.3 });
      k.play('whoosh', 3.3, { dur: 0.5 }); k.play('riser', 3.6, { dur: 0.5, gain: 0.5 }); k.play('thud', 4.2);
      for (let i = 0; i < 10; i++) k.play('tick', 4.6 + i * 0.09, { pitch: 1 + i * 0.05 });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.2, gain: 0.4 }); k.play('click', 5.3 + i * 0.4, { pitch: 1 + i * 0.07 }); }
      k.play('whoosh', 7.6, { dur: 1.1 }); for (let i = 0; i < 10; i++) k.play('click', 7.7 + i * 0.1, { pitch: 1.5 - i * 0.05 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('stamp', 10.0); k.play('stamp', 10.15, { gain: 0.5 });
      k.play('click', 10.5); k.play('chime', 11.3, { note: 'G5' });
    },
  };
  MS.register(style);
})();
