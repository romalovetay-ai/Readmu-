// Editorial Chart (Data & Information). A prestige-newspaper data graphic on salmon newsprint: serif headline and
// dek under a black rule, hairline grid, one claret highlight series against quiet greys, direct labels, elbow leader
// lines, handwritten Caveat annotations with inked arrows, a small-caps source line and a page-scroll scene change.
(function () {
  const P = { paper: '#fff1e5', ink: '#33302e', claret: '#990f3d', grey: '#b9afa5', grey2: '#857d75', grey3: '#66605c', grid: '#e3d5c8', wash: '#990f3d', teal: '#0d7680' };
  const SERIF = 'Libre Baskerville', SANS = 'Inter', HAND = 'Caveat';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  function paper(ctx, W, H) {
    const tex = K.cached(`ed-paper:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d');
      x.drawImage(K.paperTex(W, H, P.paper, 6, 0.02, false), 0, 0);
      return c;
    });
    ctx.drawImage(tex, 0, 0);
  }
  // Newspaper furniture: top rule with the claret section block and the eyebrow.
  function masthead(ctx, W, H, s, p, eyebrow) {
    const m = 48 * s, k = K.ease.out(K.clamp(p));
    ctx.save(); ctx.fillStyle = P.ink; ctx.fillRect(m, 40 * s, (W - m * 2) * k, 2 * s);
    ctx.fillStyle = P.claret; ctx.fillRect(m, 40 * s, 70 * s * k, 6 * s);
    if (eyebrow) { ctx.globalAlpha = K.clamp(p * 2 - 0.5); ctx.font = `700 ${Math.round(20 * s)}px "${SANS}"`; ctx.fillStyle = P.claret; ctx.letterSpacing = `${2 * s}px`; ctx.fillText(eyebrow, m, 72 * s); }
    ctx.restore();
  }
  function sourceLine(ctx, W, H, s, p) {
    const m = 48 * s; ctx.save(); ctx.globalAlpha = K.clamp(p);
    ctx.fillStyle = P.ink; ctx.fillRect(m, H - 58 * s, W - m * 2, 1 * s);
    ctx.font = `600 ${Math.round(20 * s)}px "${SANS}"`; ctx.fillStyle = P.grey3; ctx.letterSpacing = `${1.5 * s}px`;
    ctx.fillText('SOURCE: CREATOR OS. FIGURES ARE ILLUSTRATIVE', m, H - 30 * s);
    if (W > H) { ctx.textAlign = 'right'; ctx.fillText('GRAPHIC BY THE DATA DESK', W - m, H - 30 * s); }
    ctx.restore();
  }
  // Inked hand-drawn arrow: a slightly wobbly curve, tapering, with an open two-stroke head.
  function inkArrow(ctx, from, to, p, o = {}) {
    const s = sOf(ctx), pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.3, 40), 1.4 * s, o.seed || 4), q = K.trim(pts, K.clamp(p / 0.85));
    if (q.length < 2) return null;
    ctx.save(); ctx.strokeStyle = o.color || P.ink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 1; i < q.length; i++) { ctx.lineWidth = (1.4 + 1.2 * Math.sin((i / pts.length) * Math.PI)) * s; ctx.beginPath(); ctx.moveTo(q[i - 1][0], q[i - 1][1]); ctx.lineTo(q[i][0], q[i][1]); ctx.stroke(); }
    if (p > 0.85) {
      const hp = K.clamp((p - 0.85) / 0.15), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 14 * s * hp;
      ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(b[0] - Math.cos(ang - 0.45) * L, b[1] - Math.sin(ang - 0.45) * L); ctx.lineTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang + 0.5) * L * 0.9, b[1] - Math.sin(ang + 0.5) * L * 0.9); ctx.stroke();
    }
    ctx.restore();
    return q[q.length - 1];
  }
  function note(ctx, text, x, y, p, o = {}) {
    const s = sOf(ctx), size = (o.size || 32) * s, lines = String(text).split('\n');
    ctx.save(); ctx.font = `700 ${Math.round(size)}px "${HAND}"`; ctx.fillStyle = o.color || P.ink; ctx.textAlign = o.align || 'left';
    let used = Math.round(lines.join('').length * K.clamp(p));
    lines.forEach((l, i) => { const n = Math.min(l.length, used); used -= n; ctx.fillText(l.slice(0, n), x, y + i * size * 0.95); });
    ctx.restore();
  }

  const style = {
    id: 'editorial-chart', name: 'Editorial Chart', family: 'Data & Information',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@400;700&family=Inter:wght@400;600;700&family=Caveat:wght@600;700&display=block',
      specs: ['700 50px "Libre Baskerville"', '400 28px "Libre Baskerville"', '600 28px "Inter"', '400 28px "Inter"', '700 20px "Inter"', '700 32px "Caveat"'] }],
    palette: { ...P },
    sfx: { draw: 'pen', land: 'tick', emphasis: 'scribble', transition: 'paper', bed: 'room' },

    background(ctx, W, H, t) { paper(ctx, W, H); },
    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.07, '#8a6a55');
      K.grain(ctx, W, H, t, 0.035, 12, 'soft-light');
    },
    // Serif headline that sets line by line (each line rises a few pixels as it fades in).
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 50) * s, lines = String(text).split('\n'), lh = size * 1.18;
      ctx.save(); ctx.font = `700 ${Math.round(size)}px "${SERIF}"`; ctx.textAlign = o.align || 'left'; ctx.fillStyle = o.color || P.ink;
      let w = 0;
      lines.forEach((l, i) => { const q = K.clamp(p * lines.length - i); w = Math.max(w, ctx.measureText(l).width); if (q <= 0) return; ctx.globalAlpha = K.ease.out(q); ctx.fillText(l, x, y + i * lh + (1 - K.ease.out(q)) * 10 * s); });
      ctx.restore();
      return { w, h: lh * lines.length };
    },
    // Direct label: Inter semibold, optional colour key swatch.
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 28) * s; if (p <= 0) return { w: 0 };
      ctx.save(); ctx.globalAlpha = K.clamp(p * 1.5); ctx.font = `${o.weight || 600} ${Math.round(size)}px "${o.serif ? SERIF : SANS}"`; ctx.fillStyle = o.color || P.ink; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x + (1 - K.ease.out(K.clamp(p))) * -8 * s * (o.align === 'right' ? -1 : 1), y);
      const w = ctx.measureText(text).width; ctx.restore();
      return { w, h: size };
    },
    // Elbow leader line (newspaper style): hairline, right angles, a small dot where it lands.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx);
      if (o.hand) return inkArrow(ctx, from, to, p, o);
      const pts = o.pts || ((mx) => [from, [mx, from[1]], [mx, to[1]], to])(o.elbowX ?? (from[0] + to[0]) / 2);
      const q = K.trim(pts, K.clamp(p)); if (q.length < 2) return null;
      ctx.save(); ctx.strokeStyle = o.color || P.ink; ctx.lineWidth = (o.width || 1.4) * s; ctx.lineJoin = 'miter'; K.poly(ctx, q); ctx.stroke();
      const end = q[q.length - 1];
      if (p >= 1) { ctx.fillStyle = o.color || P.ink; ctx.beginPath(); ctx.arc(end[0], end[1], 3.2 * s, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      return end;
    },
    // Panel: hairline box with a heavier top rule (an inset chart panel).
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.ease.out(K.clamp(p)); if (k <= 0) return;
      ctx.save(); ctx.globalAlpha = K.clamp(p * 2);
      ctx.fillStyle = o.fill || 'rgba(255,250,244,0.65)'; ctx.fillRect(x, y, w, h * k);
      ctx.strokeStyle = o.color || P.grey2; ctx.lineWidth = 1 * s; ctx.strokeRect(x, y, w, h * k);
      ctx.fillStyle = o.color || P.ink; ctx.fillRect(x, y, w * k, (o.rule || 3) * s);
      ctx.restore();
    },
    // Set numerals in the serif, tabular feel.
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 80) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = `700 ${Math.round(size)}px "${SERIF}"`; ctx.fillStyle = o.color || P.claret; ctx.textAlign = o.align || 'left'; ctx.fillText(txt, x, y);
      const w = ctx.measureText(txt).width; ctx.restore();
      return { w, h: size };
    },
    // Hand-inked ring around the key point plus a soft pulse on the data point itself.
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return;
      const pts = K.wobble(K.circlePts(x, y, r * 1.15, r * 0.85, 60, -2.2, Math.PI * 2.2), 2 * s, o.seed || 9);
      const q = K.trim(pts, K.clamp(p / 0.7));
      ctx.save(); ctx.strokeStyle = o.color || P.ink; ctx.lineCap = 'round'; ctx.lineWidth = 2.4 * s; K.poly(ctx, q); ctx.stroke();
      if (o.dot) { const k = K.clamp((p - 0.2) / 0.8); ctx.globalAlpha = 1 - k; ctx.strokeStyle = P.claret; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(o.dot[0], o.dot[1], 8 * s + k * 30 * s, 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    },
    // Scene change: the page scrolls. The finished panel slides up off the top, the next panel rises from below.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), tmp = K.cached(`ed-tmp:${W}x${H}`, () => K.layer(W, H)), x = tmp.getContext('2d');
      x.clearRect(0, 0, W, H); x.drawImage(ctx.canvas, 0, 0);
      const e = K.ease.inOut, off = p < 0.5 ? -e(p * 2) * H : (1 - e((p - 0.5) * 2)) * H;
      paper(ctx, W, H);
      ctx.drawImage(tmp, 0, off);
      // the rule between the two stories
      const ry = p < 0.5 ? off + H - 2 * s : off - 6 * s;
      ctx.fillStyle = P.ink; ctx.fillRect(48 * s, ry, W - 96 * s, 2 * s);
    },
    inkArrow, note,
  };

  // ---------- the shared demo: a newspaper graphic ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const SHARE = [0.92, 0.84, 0.76, 0.42, 0.5, 0.36, 0.58];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, portrait: false, head: [48 * s, 120 * s], dek: [48 * s, 162 * s], hs: 48,
      video: [64 * s, 300 * s, 210 * s, 130 * s], node: [340 * s, 322 * s, 230 * s, 86 * s], rowX: 690 * s, barX: 860 * s, barW: 360 * s,
      rows: PLATFORMS.map((n, i) => (240 + i * 62) * s), chart: [140 * s, 262 * s, 880 * s, 330 * s] };
    return { s, portrait: true, head: [48 * s, H * 0.09], dek: [48 * s, H * 0.155], hs: 46,
      video: [W * 0.06, H * 0.245, W * 0.36, H * 0.09], node: [W * 0.54, H * 0.258, W * 0.4, H * 0.065], rowX: W * 0.1, barX: W * 0.45, barW: W * 0.47,
      rows: PLATFORMS.map((n, i) => H * (0.43 + i * 0.062)), chart: [W * 0.14, H * 0.3, W * 0.78, H * 0.4] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        masthead(ctx, W, H, s, K.beat(t, 0, 0.6), 'DISTRIBUTION');
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.head[0], Lo.head[1], K.beat(t, 0.2, 1.0, 'lin'), { size: Lo.hs });
        ctx.save(); ctx.globalAlpha = K.beat(t, 1.1, 0.5); ctx.font = `400 ${Math.round(28 * s)}px "${SANS}"`; ctx.fillStyle = P.grey3;
        ctx.fillText(portrait ? 'How Creator OS sends one upload' : 'How Creator OS sends a single upload to seven networks', Lo.dek[0], Lo.dek[1] + (portrait ? 40 * s : 0));
        if (portrait) ctx.fillText('to seven networks', Lo.dek[0], Lo.dek[1] + 78 * s);
        ctx.restore();
        // the video panel
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.5), {});
        if (t > 2.3) {
          const a = K.beat(t, 2.3, 0.4), fx = vx + vw * 0.2, fy = vy + vh * 0.22, fw = vw * 0.6, fh = vh * 0.48;
          ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = P.ink; ctx.fillRect(fx, fy, fw, fh);
          ctx.fillStyle = P.paper; ctx.beginPath(); ctx.moveTo(fx + fw * 0.42, fy + fh * 0.28); ctx.lineTo(fx + fw * 0.42, fy + fh * 0.72); ctx.lineTo(fx + fw * 0.62, fy + fh * 0.5); ctx.fill(); ctx.restore();
          style.label(ctx, 'your video', vx + vw / 2, vy + vh * 0.86, K.beat(t, 2.7, 0.4), { align: 'center', size: 28 });
        }
        // the Creator OS box, claret ruled
        const [nx, ny, nw, nh] = Lo.node;
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.5), { color: P.claret, rule: 5, fill: 'rgba(153,15,61,0.06)' });
        style.label(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 4 * s, K.beat(t, 4.3, 0.4), { align: 'center', size: portrait ? 36 : 34, serif: true, weight: 700, color: P.claret });
        // handwritten annotation and inked arrow from the video to Creator OS
        const a0 = portrait ? [vx + vw * 0.6, vy + vh + 14 * s] : [vx + vw * 0.75, vy - 10 * s], a1 = portrait ? [nx + nw * 0.3, ny + nh + 14 * s] : [nx + 20 * s, ny - 10 * s];
        inkArrow(ctx, a0, a1, K.beat(t, 3.3, 0.7, 'inOut'), { bend: portrait ? 0.35 : -0.35, seed: 3 });
        note(ctx, 'upload once', portrait ? (a0[0] + a1[0]) / 2 : (a0[0] + a1[0]) / 2, portrait ? a0[1] + 46 * s : a0[1] - 50 * s, K.beat(t, 3.6, 0.6), { align: 'center', size: 34 });
        // the bar chart of channels with elbow leaders
        const src = portrait ? [nx + nw / 2, ny + nh] : [nx + nw, ny + nh / 2];
        ctx.save(); ctx.strokeStyle = P.grid; ctx.lineWidth = 1 * s;
        for (let g = 0; g <= 4; g++) { const gx = Lo.barX + (g / 4) * Lo.barW; ctx.globalAlpha = K.beat(t, 4.6, 0.5); ctx.beginPath(); ctx.moveTo(gx, Lo.rows[0] - 30 * s); ctx.lineTo(gx, Lo.rows[6] + 30 * s); ctx.stroke(); }
        ctx.restore();
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, y = Lo.rows[i], hi = i === 0;
          const pts = portrait ? [src, [src[0], Lo.rows[0] - 28 * s], [W * 0.05, Lo.rows[0] - 28 * s], [W * 0.05, y], [Lo.rowX - 10 * s, y]] : [src, [Lo.rowX - 50 * s, src[1]], [Lo.rowX - 50 * s, y], [Lo.rowX - 12 * s, y]];
          style.arrow(ctx, null, null, K.beat(t, t0, 0.35, 'out'), { pts, color: hi ? P.claret : P.grey2, width: hi ? 2 : 1.3 });
          style.label(ctx, name, Lo.rowX, y, K.beat(t, t0 + 0.25, 0.3), { size: 28, color: hi ? P.claret : P.ink, weight: hi ? 700 : 600 });
          const bw = Lo.barW * SHARE[i] * K.beat(t, t0 + 0.3, 0.6, 'out');
          ctx.fillStyle = hi ? P.claret : P.grey; ctx.fillRect(Lo.barX, y - 13 * s, bw, 26 * s);
        });
        note(ctx, 'same upload,\nevery feed', Lo.barX + Lo.barW * 0.7, Lo.rows[6] + (portrait ? 80 * s : -330 * s), K.beat(t, 7.0, 0.5), { size: 30, color: P.claret, align: 'center' });
        sourceLine(ctx, W, H, s, K.beat(t, 1.5, 0.5));
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      } else {
        masthead(ctx, W, H, s, 1, 'REACH');
        const tp = K.beat(t, 10.5, 0.8, 'lin');
        style.title(ctx, portrait ? 'Views since posting' : 'Views since posting, by day', Lo.head[0], Lo.head[1], 1 - tp, { size: Lo.hs });
        style.title(ctx, portrait ? 'Post once.\nReach everywhere.' : 'Post once. Reach everywhere.', Lo.head[0], Lo.head[1], tp, { size: Lo.hs, color: P.claret });
        const [cx, cy, cw, ch] = Lo.chart, x0 = cx, y0 = cy + ch;
        // hairline grid + axis labels
        ctx.save(); ctx.font = `400 ${Math.round(22 * s)}px "${SANS}"`; ctx.fillStyle = P.grey3; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ['0', '250k', '500k', '750k', '1m'].forEach((lab, i) => { const gy = y0 - (i / 4) * ch; ctx.fillStyle = i ? P.grid : P.ink; ctx.fillRect(x0, gy, cw, (i ? 1 : 1.6) * s); ctx.fillStyle = P.grey3; ctx.fillText(lab, x0 - 10 * s, gy); });
        ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (let d = 0; d <= 6; d++) ctx.fillText('Day ' + (d + 1), x0 + (d / 6) * cw, y0 + 10 * s);
        ctx.restore();
        // grey context series: posting by hand to one network
        const nz = K.noise(5);
        const series = (k, amp, fn) => Array.from({ length: 61 }, (_, i) => { const u = i / 60; return [x0 + u * cw, y0 - fn(u) * ch * amp - nz.n2(u * 8, k) * 6 * s]; });
        const ctxSeries = [series(1, 0.2, (u) => Math.pow(u, 0.8)), series(2, 0.12, (u) => u), series(3, 0.28, (u) => Math.sqrt(u))];
        ctx.save(); ctx.strokeStyle = P.grey; ctx.lineWidth = 2 * s; ctxSeries.forEach((sr) => { K.poly(ctx, sr); ctx.stroke(); }); ctx.restore();
        style.label(ctx, portrait ? 'one network, by hand' : 'posting to one network by hand', x0 + cw * 0.98, y0 - ch * 0.31, 1, { size: 24, color: P.grey2, align: 'right', weight: 400 });
        // claret Creator OS series draws on with its wash
        const main = series(4, 1, (u) => 1 - Math.pow(1 - u, 2.4));
        const prog = K.beat(t, 8.6, 1.4, 'out'), q = K.trim(main, prog), tip = q[q.length - 1];
        if (q.length > 1) {
          ctx.save(); ctx.beginPath(); ctx.moveTo(q[0][0], y0); q.forEach((pt) => ctx.lineTo(pt[0], pt[1])); ctx.lineTo(tip[0], y0); ctx.closePath();
          const g = ctx.createLinearGradient(0, cy, 0, y0); g.addColorStop(0, 'rgba(153,15,61,0.22)'); g.addColorStop(1, 'rgba(153,15,61,0.03)'); ctx.fillStyle = g; ctx.fill();
          ctx.strokeStyle = P.claret; ctx.lineWidth = 4 * s; ctx.lineJoin = 'round'; K.poly(ctx, q); ctx.stroke(); ctx.restore();
          ctx.fillStyle = P.claret; ctx.beginPath(); ctx.arc(tip[0], tip[1], 6 * s, 0, Math.PI * 2); ctx.fill();
        }
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        const cpos = portrait ? [x0 + cw, cy - 100 * s] : [x0 + cw - 16 * s, cy - 34 * s];
        style.counter(ctx, v, cpos[0], cpos[1], 1, { size: portrait ? 64 : 72, align: 'right' });
        style.label(ctx, 'Creator OS', tip[0] + (portrait ? -10 * s : 14 * s), tip[1] + (portrait ? 40 * s : 4 * s), prog, { color: P.claret, weight: 700, size: 28, align: portrait ? 'right' : 'left' });
        if (portrait) style.label(ctx, 'views', cpos[0], cpos[1] + 36 * s, K.beat(t, 8.7, 0.4), { align: 'right', size: 28, color: P.grey3, weight: 400 });
        else style.label(ctx, 'views', x0 + cw + 14 * s, cy - 56 * s, K.beat(t, 8.7, 0.4), { size: 28, color: P.grey3, weight: 400 });
        style.emphasis(ctx, tip[0], tip[1], 34 * s, K.beat(t, 10.0, 0.7, 'lin'), { dot: tip });
        inkArrow(ctx, [x0 + cw * 0.28, y0 - ch * 0.98], [x0 + cw * 0.5, y0 - ch * 0.8], K.beat(t, 10.1, 0.5), { bend: -0.3, seed: 7 });
        note(ctx, 'posted once,\neverywhere', x0 + cw * 0.04, y0 - ch * 1.0, K.beat(t, 9.6, 0.6), { size: 32 });
        sourceLine(ctx, W, H, s, 1);
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.7);
      k.play('paper', 0.05, { dur: 0.3, gain: 0.6 }); k.play('tick', 0.25); k.play('tick', 0.75); k.play('tick', 1.15, { gain: 0.6 });
      k.play('tick', 2.0); k.play('tick', 2.4, { gain: 0.7 }); k.play('scribble', 3.3, { medium: 'pen', dur: 0.7 }); k.play('scribble', 3.6, { medium: 'pen', dur: 0.6, gain: 0.6 });
      k.play('tick', 4.0); k.play('pluck', 4.3, { note: 'D4', gain: 0.5 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pencil', dur: 0.3, gain: 0.5 }); k.play('tick', 5.3 + i * 0.4, { pitch: 1 + i * 0.04 }); }
      k.play('scribble', 7.0, { medium: 'pen', dur: 0.5, gain: 0.6 });
      k.play('paper', 7.6, { dur: 1.1 }); k.play('whoosh', 7.7, { dur: 1.0, gain: 0.35 });
      k.play('scribble', 8.6, { medium: 'pen', dur: 1.4, gain: 0.5 }); k.play('count', 8.6, { dur: 1.4 });
      k.play('scribble', 9.6, { medium: 'pen', dur: 0.6, gain: 0.6 });
      k.play('scribble', 10.0, { medium: 'pen', dur: 0.5 }); k.play('stamp', 10.0, { gain: 0.5 });
      k.play('chime', 11.3, { note: 'G5', gain: 0.8 });
    },
  };
  MS.register(style);
})();
