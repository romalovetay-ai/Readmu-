// ISOTYPE Pictograms (Data & Information). Vienna Method picture statistics: identical flat pictograms where each
// symbol is a fixed quantity, partial symbols for remainders, three muted litho inks on cream with ink voids and a
// faint misregistration, strict grid, geometric sans caps, flat Isotype arrows, stepped 12 fps rubber-stamp timing,
// and a sideways pan along the chart sheet as the scene change.
(function () {
  const P = { paper: '#efe7d4', navy: '#294c63', red: '#c2432c', ochre: '#d49a33', ink: '#26231f', rule: '#8c8070' };
  const FONT = 'Space Grotesk';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  const step = (t) => Math.floor(t * 12) / 12;                // 12 fps stamp timing
  const sbeat = (t, t0, d) => K.clamp((step(t) - t0) / d);       // stepped progress
  const caps = (ctx, text, x, y, size, col, o = {}) => { ctx.save(); ctx.font = K.font(size, FONT, o.weight || 700); ctx.letterSpacing = `${(o.track ?? 0.12) * size}px`; ctx.fillStyle = col; ctx.textAlign = o.align || 'left'; ctx.textBaseline = o.base || 'alphabetic'; ctx.fillText(String(text).toUpperCase(), x, y); const w = ctx.measureText(String(text).toUpperCase()).width; ctx.restore(); return w; };

  // ---------- pictograms (flat ink, drawn in a u x u cell, (x,y) = bottom centre) ----------
  function person(ctx, x, y, u, col) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(x, y - u * 0.83, u * 0.13, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - u * 0.24, y - u * 0.36); ctx.lineTo(x - u * 0.24, y - u * 0.58); ctx.quadraticCurveTo(x - u * 0.24, y - u * 0.67, x - u * 0.14, y - u * 0.67); ctx.lineTo(x + u * 0.14, y - u * 0.67); ctx.quadraticCurveTo(x + u * 0.24, y - u * 0.67, x + u * 0.24, y - u * 0.58); ctx.lineTo(x + u * 0.24, y - u * 0.36); ctx.lineTo(x + u * 0.17, y - u * 0.36); ctx.lineTo(x + u * 0.17, y - u * 0.52); ctx.lineTo(x - u * 0.17, y - u * 0.52); ctx.lineTo(x - u * 0.17, y - u * 0.36); ctx.closePath(); ctx.fill();
    ctx.fillRect(x - u * 0.16, y - u * 0.53, u * 0.32, u * 0.24);
    ctx.fillRect(x - u * 0.15, y - u * 0.3, u * 0.13, u * 0.3); ctx.fillRect(x + u * 0.02, y - u * 0.3, u * 0.13, u * 0.3);
  }
  function screen(ctx, x, y, u, col) {
    ctx.fillStyle = col; ctx.fillRect(x - u * 0.45, y - u * 0.86, u * 0.9, u * 0.62); ctx.fillRect(x - u * 0.06, y - u * 0.26, u * 0.12, u * 0.16); ctx.fillRect(x - u * 0.24, y - u * 0.1, u * 0.48, u * 0.08);
    ctx.fillStyle = P.paper; ctx.beginPath(); ctx.moveTo(x - u * 0.1, y - u * 0.71); ctx.lineTo(x - u * 0.1, y - u * 0.39); ctx.lineTo(x + u * 0.16, y - u * 0.55); ctx.closePath(); ctx.fill();
  }
  // A row of identical symbols for `count` (fractional = a partial symbol cut on the right), stamped one by one.
  function symbolRow(ctx, draw, x, y, u, gap, count, shown, col) {
    for (let i = 0; i < Math.ceil(count); i++) {
      if (i >= shown) break;
      const frac = Math.min(1, count - i), cx = x + i * (u + gap) + u / 2;
      ctx.save();
      if (frac < 1) { ctx.beginPath(); ctx.rect(cx - u / 2, y - u * 1.05, u * frac, u * 1.1); ctx.clip(); }
      draw(ctx, cx, y, u, col);
      ctx.restore();
    }
  }
  // litho texture: paper fibre, plus ink voids (paper-colour specks) laid over everything
  const voids = (W, H) => K.cached(`it-voids:${W}x${H}`, () => {
    const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(61), [pr, pg, pb] = K.hex(P.paper);
    for (let i = 0; i < (W * H) / 260; i++) { x.fillStyle = `rgba(${pr},${pg},${pb},${(0.25 + r() * 0.5).toFixed(2)})`; const sz = r() < 0.9 ? 1 : 2; x.fillRect(r() * W, r() * H, sz, sz); }
    return c;
  });

  const style = {
    id: 'isotype', name: 'ISOTYPE Pictograms', family: 'Data & Information',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=block', specs: ['700 46px "Space Grotesk"', '500 28px "Space Grotesk"', '700 28px "Space Grotesk"'] }],
    palette: { ...P },
    sfx: { draw: null, land: 'stamp', emphasis: 'stamp', transition: 'paper', bed: 'room' },

    background(ctx, W, H, t) { ctx.drawImage(K.paperTex(W, H, P.paper, 14, 0.035, true), 0, 0); },
    finish(ctx, W, H, t) {
      ctx.drawImage(voids(W, H), 0, 0);
      K.vignette(ctx, W, H, 0.1, '#7a6a50');
      K.grain(ctx, W, H, step(t), 0.03, 12, 'soft-light');
    },
    // Letterspaced geometric caps, stamped in word by word on the 12 fps grid.
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 46) * s, lines = String(text).split('\n'), lh = size * 1.25;
      const words = lines.map((l) => l.split(' ')), total = words.flat().length, shown = Math.floor(K.clamp(p) * total + 0.001);
      let k = 0, wMax = 0;
      ctx.save(); ctx.font = K.font(size, FONT, 700); ctx.letterSpacing = `${0.12 * size}px`;
      words.forEach((ws, li) => {
        const full = ctx.measureText(lines[li].toUpperCase()).width; wMax = Math.max(wMax, full);
        let cx = o.align === 'center' ? x - full / 2 : x;
        ws.forEach((wd) => { const W2 = ctx.measureText(wd.toUpperCase() + ' ').width; if (k++ < shown) { ctx.fillStyle = o.color || P.ink; ctx.fillText(wd.toUpperCase(), cx, y + li * lh); } cx += W2; });
      });
      ctx.restore();
      return { w: wMax, h: lh * lines.length };
    },
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return { w: 0 };
      const w = caps(ctx, text, x, y, (o.size || 28) * s, o.color || P.ink, { align: o.align, base: 'middle', track: o.track ?? 0.06, weight: o.weight || 700 });
      return { w };
    },
    // Flat Isotype arrow: a solid shaft with a broad triangular head, growing in stamped steps.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), q = Math.floor(K.clamp(p) * 6) / 6; if (q <= 0) return null;
      const w = (o.width || 14) * s, dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy) * q, a = Math.atan2(dy, dx), hl = Math.min(L, w * 1.6);
      ctx.save(); ctx.translate(from[0], from[1]); ctx.rotate(a); ctx.fillStyle = o.color || P.ochre;
      ctx.fillRect(0, -w / 2, Math.max(0, L - hl), w);
      ctx.beginPath(); ctx.moveTo(L - hl, -w * 1.05); ctx.lineTo(L, 0); ctx.lineTo(L - hl, w * 1.05); ctx.closePath(); ctx.fill();
      ctx.restore();
      return [from[0] + Math.cos(a) * L, from[1] + Math.sin(a) * L];
    },
    // Solid ink block (no outline), stamped on.
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return; const s = sOf(ctx), pop = p < 0.2 ? 1.06 : 1;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(pop, pop); ctx.fillStyle = o.color || P.red; ctx.fillRect(-w / 2, -h / 2, w, h); ctx.restore();
      void s;
    },
    // Stamped numerals with a hairline of misregistered red under the black.
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 104) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, FONT, 700); ctx.textAlign = o.align || 'center'; ctx.letterSpacing = `${0.02 * size}px`;
      ctx.fillStyle = K.rgba(P.red, 0.55); ctx.fillText(txt, x + 2.5 * s, y + 2 * s);
      ctx.fillStyle = o.color || P.ink; ctx.fillText(txt, x, y);
      ctx.restore();
      return { h: size };
    },
    // Emphasis: a heavy red stamped frame that lands in three steps, slightly askew.
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return; const s = sOf(ctx), q = Math.min(3, Math.floor(p * 4 + 1)), w = r * 2 * (o.aspect || 2.2), h = r * 2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(-0.025); ctx.strokeStyle = o.color || P.red; ctx.lineWidth = 9 * s * (q === 1 ? 1.4 : 1);
      ctx.globalAlpha = q === 1 ? 0.6 : 1; ctx.strokeRect(-w / 2 * (q === 1 ? 1.08 : 1), -h / 2 * (q === 1 ? 1.08 : 1), w * (q === 1 ? 1.08 : 1), h * (q === 1 ? 1.08 : 1));
      ctx.restore();
    },
    // Scene change: the camera pans along the long chart sheet; the next panel slides in from the right on 12 fps steps.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), q = Math.floor(K.clamp(p) * 16) / 16, tmp = K.cached(`it-tmp:${W}x${H}`, () => K.layer(W, H)), x = tmp.getContext('2d');
      x.clearRect(0, 0, W, H); x.drawImage(ctx.canvas, 0, 0);
      const e = K.ease.inOut, off = q < 0.5 ? -e(q * 2) * W : (1 - e((q - 0.5) * 2)) * W;
      ctx.drawImage(K.paperTex(W, H, P.paper, 14, 0.035, true), 0, 0);
      ctx.drawImage(tmp, off, 0);
      const rx = q < 0.5 ? off + W : off - 2 * s;
      ctx.fillStyle = P.ink; ctx.fillRect(rx - 3 * s, 40 * s, 6 * s, H - 80 * s);
    },
    person, screen, symbolRow,
  };

  // ---------- the shared demo: an Isotype sheet of views ----------
  // each viewer figure = 50,000 views; the seven rows add up to 20 figures = 1,000,000
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COUNTS = [4.5, 4, 3.5, 1.5, 2.5, 1.5, 2.5];
  const INKS = [P.red, P.navy, P.red, P.navy, P.navy, P.navy, P.navy];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, portrait: false, title: [W / 2, 74 * s], tsize: 44, video: [100 * s, 400 * s], vu: 92 * s, node: [200 * s, 330 * s, 250 * s, 100 * s],
      trunkX: 490 * s, labX: 520 * s, iconX: 720 * s, u: 52 * s, gap: 10 * s, rows: PLATFORMS.map((n, i) => (170 + i * 70) * s), key: [W - 50 * s, 132 * s] };
    return { s, portrait: true, title: [W / 2, H * 0.07], tsize: 42, video: [W * 0.18, H * 0.25], vu: 120 * s, node: [W * 0.36, H * 0.205, W * 0.56, H * 0.075],
      trunkX: W * 0.05, labX: W * 0.09, iconX: W * 0.43, u: 58 * s, gap: 8 * s, rows: PLATFORMS.map((n, i) => H * (0.4 + i * 0.075)), key: [W - 40 * s, H * 0.355] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait, ts = step(t);
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.title[0], Lo.title[1], sbeat(t, 0.15, 1.2), { size: Lo.tsize, align: 'center' });
        ctx.save(); ctx.globalAlpha = sbeat(t, 1.0, 0.1); ctx.fillStyle = P.ink; ctx.fillRect(Lo.title[0] - (portrait ? 420 : 560) * s / 2, Lo.title[1] + (portrait ? 92 : 20) * s, (portrait ? 420 : 560) * s, 2 * s); ctx.restore();
        // key
        if (ts >= 1.4) {
          const [kx, ky] = Lo.key, ku = 34 * s;
          const kw = style.label(ctx, 'each figure = 50,000 views', kx, ky - 10 * s, 1, { size: 22, align: 'right', weight: 500, track: 0.04 }).w;
          person(ctx, kx - kw - 26 * s, ky + 8 * s, ku, P.navy);
        }
        // the video symbol, an arrow into the Creator OS block
        if (ts >= 2.0) screen(ctx, Lo.video[0], Lo.video[1], Lo.vu * (ts < 2.1 ? 1.12 : 1), P.navy);
        style.label(ctx, 'your video', Lo.video[0], Lo.video[1] + 30 * s, sbeat(t, 2.5, 0.1), { align: 'center', size: 28 });
        const [nx, ny, nw, nh] = Lo.node;
        const a0 = portrait ? [Lo.video[0] + Lo.vu * 0.55, Lo.video[1] - Lo.vu * 0.5] : [Lo.video[0] + Lo.vu * 0.55, Lo.video[1] - Lo.vu * 0.5];
        style.arrow(ctx, a0, portrait ? [nx - 14 * s, a0[1]] : [nx - 14 * s, a0[1]], sbeat(t, 3.4, 0.6), {});
        if (portrait) { /* node sits to the right of the video in portrait too */ }
        style.box(ctx, nx, ny, nw, nh, sbeat(t, 4.0, 0.4), { color: P.red });
        if (ts >= 4.2) caps(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 2 * s, (portrait ? 40 : 30) * s, P.paper, { align: 'center', base: 'middle', track: 0.08 });
        // flat arrows: trunk then one branch per row
        const trunkTop = portrait ? ny + nh + 30 * s : ny + nh / 2, tx = Lo.trunkX;
        if (portrait) style.arrow(ctx, [nx + nw / 2, ny + nh], [nx + nw / 2, trunkTop], sbeat(t, 4.6, 0.2), { width: 12, color: P.ochre });
        const tp = sbeat(t, 4.7, 0.3);
        if (tp > 0) { ctx.fillStyle = P.ochre; const y0 = portrait ? trunkTop - 6 * s : Lo.rows[0], y1 = Lo.rows[6]; ctx.fillRect(tx - 6 * s, Math.min(y0, trunkTop), 12 * s, (Math.max(y1, trunkTop) - Math.min(y0, trunkTop)) * tp); if (!portrait) ctx.fillRect(nx + nw, ny + nh / 2 - 6 * s, tx - nx - nw, 12 * s); else ctx.fillRect(tx - 6 * s, trunkTop - 6 * s, nx + nw / 2 - tx, 12 * s); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, y = Lo.rows[i];
          style.arrow(ctx, [tx, y], [Lo.labX - 8 * s, y], sbeat(t, t0, 0.15), { width: 10 });
          style.label(ctx, name, Lo.labX, y, sbeat(t, t0 + 0.1, 0.05), { size: 28, color: INKS[i] === P.red ? P.red : P.ink });
          const shown = Math.max(0, Math.floor((ts - (t0 + 0.15)) * 12 / 1.2) + 1);
          if (ts >= t0 + 0.15) symbolRow(ctx, person, Lo.iconX, y + Lo.u * 0.5, Lo.u, Lo.gap, COUNTS[i], shown, INKS[i]);
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      } else {
        // the whole million as one block of 20 figures, stamped in rows of ten
        const cols = 10, gap = (portrait ? 10 : 12) * s, u = portrait ? (W * 0.9 - 9 * gap) / 10 : 66 * s, gw = cols * u + (cols - 1) * gap, gx = W / 2 - gw / 2;
        const gy0 = portrait ? H * 0.54 : 366 * s, rowH = u * 1.2;
        const n = Math.min(20, Math.max(0, Math.floor((ts - 8.6) * 12 / 0.84)));
        for (let r = 0; r < 2; r++) symbolRow(ctx, person, gx, gy0 + r * rowH, u, gap, 10, Math.max(0, n - r * 10), r ? P.navy : P.red);
        const v = Math.min(1000000, n * 50000);
        style.counter(ctx, v, W / 2, portrait ? H * 0.38 : 196 * s, 1, { size: portrait ? 92 : 96 });
        style.label(ctx, 'views', W / 2, portrait ? H * 0.417 : 236 * s, 1, { size: 30, align: 'center', track: 0.3 });
        style.emphasis(ctx, W / 2, portrait ? H * 0.37 : 180 * s, (portrait ? 92 : 82) * s, sbeat(t, 10.0, 0.4), { aspect: portrait ? 2.8 : 3.4 });
        // Creator OS block stays in the corner of the sheet
        const bw = (portrait ? 320 : 230) * s, bh = (portrait ? 74 : 60) * s, bx = portrait ? W / 2 - bw / 2 : 50 * s, by = portrait ? H * 0.11 : 50 * s;
        style.box(ctx, bx, by, bw, bh, 1, { color: P.red });
        caps(ctx, 'Creator OS', bx + bw / 2, by + bh / 2 + 2 * s, (portrait ? 34 : 26) * s, P.paper, { align: 'center', base: 'middle', track: 0.08 });
        style.label(ctx, 'each figure = 50,000 views', W / 2, portrait ? gy0 + rowH * 2 + 20 * s : gy0 + rowH + 36 * s, 1, { size: 24, align: 'center', weight: 500, track: 0.04 });
        style.title(ctx, portrait ? 'Post once.\nReach everywhere.' : 'Post once. Reach everywhere.', W / 2, portrait ? H * 0.78 : 650 * s, sbeat(t, 10.5, 0.7), { size: portrait ? 44 : 40, align: 'center' });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.8);
      for (let i = 0; i < 4; i++) k.play('stamp', 0.15 + i * 0.3, { gain: 0.35 });
      k.play('paper', 1.4, { dur: 0.2 });
      k.play('stamp', 2.0, { gain: 0.6 }); k.play('click', 2.5);
      for (let i = 0; i < 4; i++) k.play('click', 3.4 + i * 0.1, { pitch: 0.7 });
      k.play('stamp', 4.0, { gain: 0.7 }); k.play('click', 4.6); k.play('click', 4.7);
      for (let i = 0; i < 7; i++) {
        const t0 = 5.0 + i * 0.4; k.play('click', t0, { pitch: 0.8 });
        for (let j = 0; j < Math.ceil([4.5, 4, 3.5, 1.5, 2.5, 1.5, 2.5][i]); j++) k.play('stamp', t0 + 0.15 + j * 0.1, { gain: 0.22 });
      }
      k.play('paper', 7.6, { dur: 1.2, gain: 1.1 });
      for (let i = 0; i < 20; i++) k.play('stamp', 8.6 + i * 0.07, { gain: 0.2 });
      k.play('count', 8.6, { dur: 1.4, gain: 0.6 });
      k.play('stamp', 10.0, { gain: 1.2 }); k.play('thud', 10.0, { gain: 0.3 });
      for (let i = 0; i < 4; i++) k.play('stamp', 10.5 + i * 0.18, { gain: 0.3 });
      k.play('chime', 11.3, { note: 'D6', gain: 0.8 });
    },
  };
  MS.register(style);
})();
