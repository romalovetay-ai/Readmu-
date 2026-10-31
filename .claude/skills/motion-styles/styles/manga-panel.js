// Manga Page (Illustration). Black-and-white manga: thick panel borders on slanted gutters, true halftone
// screentone (dot grids and dot-size gradients), boiling focus lines, bold outlined arrows, katakana SFX with
// white knock-out borders, narration boxes and hand-lettered balloons. Panels slam in with a camera shake.
(function () {
  const INK = '#111111', PAPER = '#f3f1ea', WHITE = '#ffffff';
  const HEAD = 'Archivo Black', HAND = 'Patrick Hand', SFX = 'Dela Gothic One';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // ---- screentone ----
  // Flat tone: a small cached tile of dots on a 45 degree grid, used as a repeating pattern.
  function toneTile(s, r) {
    return K.cached(`manga-tone:${s.toFixed(3)}:${r}`, () => {
      const p = Math.max(4, Math.round(7 * s)), c = K.layer(p * 2, p * 2), x = c.getContext('2d');
      x.fillStyle = INK; const rr = p * r;
      for (const [a, b] of [[0, 0], [p, p], [2 * p, 0], [0, 2 * p], [2 * p, 2 * p]]) { x.beginPath(); x.arc(a, b, rr, 0, 7); x.fill(); }
      return c;
    });
  }
  function tone(ctx, r, build) {
    const s = sOf(ctx); ctx.save(); build(); ctx.clip();
    ctx.fillStyle = ctx.createPattern(toneTile(s, r), 'repeat'); ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height); ctx.restore();
  }
  // Gradient tone: dot radius follows a field f(u, v) in 0..1 (u, v = frame fractions). Cached per frame size.
  function gradTone(W, H, kind) {
    return K.cached(`manga-grad:${W}x${H}:${kind}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), p = Math.max(4, Math.round(6.5 * s));
      x.fillStyle = INK;
      for (let j = 0, y = 0; y < H + p; y += p, j++) for (let i = 0, X = (j % 2) * p / 2; X < W + p; X += p, i++) {
        const u = X / W, v = y / H;
        let f = kind === 'top' ? 1 - v : kind === 'radial' ? K.clamp(Math.hypot(u - 0.5, (v - 0.5) * H / W) * 1.9) : kind === 'left' ? 1 - u : v;
        f = K.clamp(f); const r = p * 0.62 * Math.sqrt(f);
        if (r > 0.4) { x.beginPath(); x.arc(X, y, r, 0, 7); x.fill(); }
      }
      return c;
    });
  }
  function gradFill(ctx, kind, build, alpha = 1) {
    const W = ctx.canvas.width, H = ctx.canvas.height; ctx.save(); build(); ctx.clip(); ctx.globalAlpha = alpha; ctx.drawImage(gradTone(W, H, kind), 0, 0); ctx.restore();
  }

  // Focus lines: tapered black wedges converging on (cx, cy), boiling on twos (re-seeded every 2 frames at 24fps).
  function focusLines(ctx, cx, cy, rx, ry, t, o = {}) {
    const W = ctx.canvas.width, H = ctx.canvas.height, R = Math.hypot(W, H), n = o.n || 150, k = Math.floor(t * 12), r = K.rng(1000 + k + (o.seed || 0));
    ctx.save(); ctx.fillStyle = o.color || INK; ctx.globalAlpha = o.alpha ?? 1; ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + r() * 0.04, w = r.range(0.004, 0.016), inner = r.range(1.0, 1.6);
      const ix = cx + Math.cos(a) * rx * inner, iy = cy + Math.sin(a) * ry * inner;
      ctx.moveTo(ix, iy); ctx.lineTo(cx + Math.cos(a - w) * R, cy + Math.sin(a - w) * R); ctx.lineTo(cx + Math.cos(a + w) * R, cy + Math.sin(a + w) * R); ctx.closePath();
    }
    ctx.fill(); ctx.restore();
  }
  // Speed lines inside a box (horizontal hatching with tapered ends).
  function speedLines(ctx, x, y, w, h, t, seed) {
    const r = K.rng(seed + Math.floor(t * 12)), s = sOf(ctx);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.fillStyle = INK;
    for (let i = 0; i < 46; i++) { const yy = y + r() * h, l = r.range(0.2, 0.7) * w, x0 = x + r() * (w - l), th = r.range(0.8, 2.6) * s;
      ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + l, yy - th / 2); ctx.lineTo(x0 + l, yy + th / 2); ctx.closePath(); ctx.fill(); }
    ctx.restore();
  }

  // Katakana SFX with a white knock-out border, trembling per letter.
  function sfx(ctx, text, x, y, size, t, o = {}) {
    const s = sOf(ctx), k = Math.floor(t * 12), r = K.rng(77 + k + (o.seed || 0));
    ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.12); ctx.font = K.font(size, SFX, 400); ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    let cx = 0; const vertical = !!o.vertical;
    for (const ch of text) {
      const jx = (r() - 0.5) * 4 * s * (o.shake ?? 1), jy = (r() - 0.5) * 4 * s * (o.shake ?? 1), cw = ctx.measureText(ch).width;
      const px = vertical ? jx : cx + jx, py = vertical ? cx + jy : jy;
      ctx.strokeStyle = WHITE; ctx.lineWidth = size * 0.28; ctx.strokeText(ch, px, py);
      ctx.strokeStyle = INK; ctx.lineWidth = size * 0.08; ctx.strokeText(ch, px, py);
      ctx.fillStyle = o.fill || INK; ctx.fillText(ch, px, py);
      cx += vertical ? size * 0.92 : cw * 0.92;
    }
    ctx.restore();
  }
  // Narration box / caption: white box, thick border, hand-lettered caps.
  function caption(ctx, text, x, y, p, o) {
    const s = sOf(ctx), size = (o.size || 34) * s, pad = 12 * s;
    ctx.save(); ctx.font = K.font(size, o.family || HAND, o.weight || 400);
    const txt = o.caps === false ? text : text.toUpperCase(), w = ctx.measureText(txt).width;
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const pop = K.ease.back(K.clamp(p * 1.6)); if (pop <= 0) { ctx.restore(); return { w, h: size }; }
    ctx.translate(x0 + w / 2, y - size * 0.35); ctx.scale(pop, pop); ctx.translate(-(x0 + w / 2), -(y - size * 0.35));
    if (o.box !== false) { ctx.fillStyle = WHITE; ctx.fillRect(x0 - pad, y - size * 0.95, w + pad * 2, size * 1.3); ctx.strokeStyle = INK; ctx.lineWidth = 3 * s; ctx.strokeRect(x0 - pad, y - size * 0.95, w + pad * 2, size * 1.3); }
    ctx.fillStyle = o.color || INK; ctx.fillText(txt.slice(0, Math.ceil(txt.length * K.clamp(p * 1.4))), x0, y);
    ctx.restore();
    return { w, h: size };
  }
  // A hand-lettered speech balloon with a tail.
  function balloon(ctx, lines, x, y, p, o = {}) {
    const s = sOf(ctx), size = (o.size || 48) * s; ctx.save(); ctx.font = K.font(size, HAND, 400);
    const w = Math.max(...lines.map((l) => ctx.measureText(l).width)), h = lines.length * size * 1.05;
    const rx = w * 0.62 + 30 * s, ry = h * 0.62 + 26 * s, pop = K.ease.back(K.clamp(p * 1.5));
    if (pop <= 0) { ctx.restore(); return; }
    ctx.translate(x, y); ctx.scale(pop, pop);
    ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 3.5 * s;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7);
    const tx = o.tail || [-rx * 0.5, ry * 1.5]; ctx.moveTo(-rx * 0.35, ry * 0.75); ctx.quadraticCurveTo(tx[0] * 0.6, ry, tx[0], tx[1]); ctx.quadraticCurveTo(-rx * 0.05, ry * 0.95, -rx * 0.05, ry * 0.95);
    ctx.fill(); ctx.stroke(); ctx.fillStyle = WHITE; ctx.beginPath(); ctx.ellipse(0, 0, rx - 2 * s, ry - 2 * s, 0, 0, 7); ctx.fill();
    ctx.fillStyle = INK; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const shown = Math.ceil(lines.join(' ').length * K.clamp(p * 1.3)); let used = 0;
    lines.forEach((l, i) => { const n = Math.max(0, Math.min(l.length, shown - used)); used += l.length + 1; ctx.fillText(l.slice(0, n), 0, (i - (lines.length - 1) / 2) * size * 1.05); });
    ctx.restore();
  }

  function panelPath(ctx, q) { ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1]); for (let i = 1; i < 4; i++) ctx.lineTo(q[i][0], q[i][1]); ctx.closePath(); }
  // A panel = quad; drops in from a little above with a scale settle; returns the quad actually drawn.
  function panel(ctx, q, p, o = {}) {
    if (p <= 0) return null; const s = sOf(ctx);
    const d = (1 - K.ease.out(K.clamp(p * 2.2))) * 26 * s;
    const qq = q.map(([a, b]) => [a, b - d]);
    ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.0)';
    panelPath(ctx, qq); ctx.fillStyle = o.fill || WHITE; ctx.fill();
    if (o.inner) { ctx.save(); panelPath(ctx, qq); ctx.clip(); o.inner(qq); ctx.restore(); }
    panelPath(ctx, qq); ctx.strokeStyle = INK; ctx.lineWidth = (o.border || 4.5) * s; ctx.lineJoin = 'miter'; ctx.stroke();
    ctx.restore();
    return qq;
  }

  const style = {
    id: 'manga-panel', name: 'Manga Page', family: 'Illustration',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Patrick+Hand&family=Dela+Gothic+One&display=block',
      specs: ['400 64px "Archivo Black"', '400 34px "Patrick Hand"', '400 80px "Dela Gothic One"'] }],
    palette: { bg: PAPER, ink: INK, paper: WHITE, tone: '#8a8a8a' },
    sfx: { draw: 'pen', land: 'thud', emphasis: 'stamp', transition: 'paper', bed: 'room' },
    focusLines, sfx_text: sfx, tone, gradFill, balloon, caption, panel,

    background(ctx, W, H, t) {
      ctx.drawImage(K.paperTex(W, H, PAPER, 23, 0.025, false), 0, 0);
    },
    finish(ctx, W, H, t) {
      // newsprint: faint warm multiply, grain, a whisper of print-through from the other side of the page
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(250,246,234,0.5)'; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.grain(ctx, W, H, t, 0.06, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 64) * s, k = K.clamp(p);
      ctx.save(); ctx.font = K.font(size, HEAD, 400); ctx.textAlign = o.align || 'left'; ctx.lineJoin = 'round';
      // slams in word by word, each word overshooting from 1.6x
      const words = text.split(' '), total = ctx.measureText(text).width, sp = ctx.measureText(' ').width;
      let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x; ctx.textAlign = 'left';
      words.forEach((wd, i) => {
        const wp = K.clamp(k * words.length - i), ww = ctx.measureText(wd).width;
        if (wp > 0) { const sc = 1 + (1 - K.ease.out(K.clamp(wp * 1.5))) * 0.6; ctx.save(); ctx.translate(cx + ww / 2, y - size * 0.35); ctx.scale(sc, sc); ctx.translate(-(cx + ww / 2), -(y - size * 0.35));
          if (o.knock !== false) { ctx.strokeStyle = WHITE; ctx.lineWidth = size * 0.2; ctx.strokeText(wd, cx, y); }
          ctx.fillStyle = o.color || INK; ctx.fillText(wd, cx, y); ctx.restore(); }
        cx += ww + sp;
      });
      ctx.restore();
      return { w: total, h: size };
    },
    label(ctx, text, x, y, p, o = {}) { return caption(ctx, text, x, y, p, { size: 34, ...o }); },

    // bold outlined arrow: white body, thick black outline, speed lines trailing behind
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.1, 30), q = K.trim(pts, K.clamp(p));
      if (q.length < 2) return null;
      const w = (o.width || 9) * s, end = q[q.length - 1], prev = q[Math.max(0, q.length - 3)], ang = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
      const left = [], right = [];
      for (let i = 0; i < q.length; i++) { const a = q[Math.min(q.length - 1, i + 1)], b = q[Math.max(0, i - 1)], dx = a[0] - b[0], dy = a[1] - b[1], l = Math.hypot(dx, dy) || 1, ww = w * (0.45 + 0.55 * (i / q.length));
        left.push([q[i][0] - (dy / l) * ww, q[i][1] + (dx / l) * ww]); right.push([q[i][0] + (dy / l) * ww, q[i][1] - (dx / l) * ww]); }
      const hl = w * 3.2, hw = w * 2.3, base = [end[0] - Math.cos(ang) * hl * 0.2, end[1] - Math.sin(ang) * hl * 0.2];
      ctx.save(); ctx.beginPath();
      left.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
      ctx.lineTo(base[0] - Math.sin(ang) * hw, base[1] + Math.cos(ang) * hw);
      ctx.lineTo(end[0] + Math.cos(ang) * hl * 0.8, end[1] + Math.sin(ang) * hl * 0.8);
      ctx.lineTo(base[0] + Math.sin(ang) * hw, base[1] - Math.cos(ang) * hw);
      for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(right[i][0], right[i][1]);
      ctx.closePath(); ctx.fillStyle = o.fill || WHITE; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3.5 * s; ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
      return end;
    },

    // a panel-style card: lands with a drop, optional screentone fill (o.tone: 'flat' | 'top' | 'radial')
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), q = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
      return panel(ctx, q, p, { fill: o.fill || WHITE, inner: o.tone ? () => (o.tone === 'flat' ? tone(ctx, o.r || 0.32, () => panelPath(ctx, q)) : gradFill(ctx, o.tone, () => panelPath(ctx, q))) : null, border: o.border });
    },

    // the number, set huge in heavy caps with a white knock-out border and a black drop
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 120) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, HEAD, 400); ctx.textAlign = o.align || 'center'; ctx.lineJoin = 'round';
      ctx.strokeStyle = INK; ctx.lineWidth = size * 0.3; ctx.strokeText(txt, x + 6 * s, y + 6 * s);
      ctx.strokeStyle = WHITE; ctx.lineWidth = size * 0.2; ctx.strokeText(txt, x, y);
      ctx.fillStyle = INK; ctx.fillText(txt, x, y);
      const w = ctx.measureText(txt).width; ctx.restore();
      return { w, h: size };
    },

    // focus-line burst + a trembling katakana hit
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return; const s = sOf(ctx), t = o.t || 0, e = K.ease.back(K.clamp(p * 1.4));
      ctx.save(); ctx.globalAlpha = K.clamp(p * 3);
      // jagged white starburst with a black edge
      const n = 22, r0 = r * 0.92 * e, r1 = r * 1.22 * e, rr = K.rng(5);
      ctx.beginPath(); const ry = o.ry || 0.62; for (let i = 0; i <= n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2, R = i % 2 ? r0 : r1 * rr.range(0.9, 1.1); ctx.lineTo(x + Math.cos(a) * R * 1.35, y + Math.sin(a) * R * ry); }
      ctx.closePath(); ctx.strokeStyle = INK; ctx.lineWidth = 4 * s; ctx.stroke();
      ctx.restore();
      const W = ctx.canvas.width, fs = (o.size || 74) * s;
      if (p > 0.25) sfx(ctx, o.text || 'ドン!', Math.min(x + r * 1.15, W - fs * 2.6), y - r * 0.55, fs, t, { rot: -0.2, seed: 9 });
    },

    // manga page turn: the next page swings over from the left (right-to-left reading), then the old one is gone
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), e = K.ease.inOut(K.clamp(p * 2)), e2 = K.ease.inOut(K.clamp(p * 2 - 1));
      ctx.save();
      const edge = p < 0.5 ? K.lerp(0, W, e) : K.lerp(W, W * 1.3, e2);
      ctx.beginPath(); ctx.rect(0, 0, Math.min(W, edge), H); ctx.clip();
      style.background(ctx, W, H, 0);
      ctx.restore();
      if (edge < W) {
        const g = ctx.createLinearGradient(edge, 0, edge + 60 * s, 0); g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(edge, 0, 60 * s, H);
        ctx.fillStyle = INK; ctx.fillRect(edge - 2 * s, 0, 3 * s, H);
      }
    },
  };

  // ---------- the shared demo, as a two-page manga ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const LANDS = [0.0, 2.0, 4.0, 4.95, 8.25];
  function shake(t, s) { let x = 0, y = 0; for (const t0 of LANDS) { x += K.spring(t, t0 + 0.12, 7 * s, 9, 9); y += K.spring(t, t0 + 0.12, 5 * s, 7, 9); } return [x, y]; }
  function playIcon(ctx, cx, cy, r, s) {
    ctx.save(); ctx.fillStyle = WHITE; ctx.strokeStyle = INK; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(cx - r * 0.3, cy - r * 0.45); ctx.lineTo(cx - r * 0.3, cy + r * 0.45); ctx.lineTo(cx + r * 0.5, cy); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // a phone held in a hand silhouette: the "your video"
  function phone(ctx, cx, cy, h, s, t) {
    const w = h * 0.52; ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.08);
    ctx.fillStyle = INK; ctx.beginPath(); ctx.roundRect(-w / 2 - 8 * s, -h / 2 - 8 * s, w + 16 * s, h + 16 * s, 14 * s); ctx.fill();
    ctx.fillStyle = WHITE; ctx.fillRect(-w / 2, -h / 2, w, h);
    gradFill(ctx, 'radial', () => { ctx.beginPath(); ctx.rect(-w / 2, -h / 2, w, h); }, 0.7);
    playIcon(ctx, 0, 0, w * 0.28, s);
    ctx.restore();
  }
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s, g = 14 * s;
    if (!L.portrait) {
      const m = 18 * s, top = 200 * s;
      return { s, P: false,
        p1: [[m, m], [W - m, m], [W - m, top - 18 * s], [m, top + 10 * s]],
        p2: [[m, top + 10 * s + g], [380 * s, top - 4 * s + g], [350 * s, H - m], [m, H - m]],
        p3: [[380 * s + g, top - 4 * s + g], [800 * s, top - 13 * s + g], [780 * s, H - m], [350 * s + g, H - m]],
        p4: [[800 * s + g, top - 13 * s + g], [W - m, top - 18 * s + g], [W - m, H - m], [780 * s + g, H - m]],
        title: [W / 2, 128 * s], vid: [190 * s, 420 * s, 230 * s], node: [W * 0.45, 440 * s], chips: PLATFORMS.map((n, i) => [1000 * s, (262 + i * 64) * s]) };
    }
    const m = 22 * s;
    return { s, P: true,
      p1: [[m, m], [W - m, m], [W - m, H * 0.17], [m, H * 0.185]],
      p2: [[m, H * 0.185 + g], [W - m, H * 0.17 + g], [W - m, H * 0.36], [m, H * 0.375]],
      p3: [[m, H * 0.375 + g], [W - m, H * 0.36 + g], [W - m, H * 0.5], [m, H * 0.5]],
      p4: [[m, H * 0.5 + g], [W - m, H * 0.5 + g], [W - m, H - m], [m, H - m]],
      title: [W / 2, H * 0.08], vid: [W / 2, H * 0.27, H * 0.14], node: [W / 2, H * 0.437], chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.6 + Math.floor(i / 2) * 0.1)]) };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const [sx, sy] = shake(t, s); ctx.save(); ctx.translate(sx, sy);
      const scene2 = t >= 8.25;
      if (!scene2) {
        // panel 1: the hook, focus lines and a gradient tone sky
        panel(ctx, Lo.p1, K.beat(t, 0.0, 0.3, 'lin'), { inner: (q) => { gradFill(ctx, 'top', () => panelPath(ctx, q), 0.55); focusLines(ctx, W / 2, Lo.title[1] - 20 * s, W * 0.36, (P ? 120 : 70) * s, t, { n: 130, alpha: 0.9 }); } });
        if (P) { style.title(ctx, 'One video.', W / 2, H * 0.085, K.beat(t, 0.15, 0.6, 'lin'), { size: 64, align: 'center' });
          style.title(ctx, 'Every platform.', W / 2, H * 0.145, K.beat(t, 0.75, 0.8, 'lin'), { size: 64, align: 'center' }); }
        else style.title(ctx, 'One video. Every platform.', W / 2, Lo.title[1], K.beat(t, 0.15, 1.3, 'lin'), { size: 66, align: 'center' });
        if (t > 1.1) sfx(ctx, 'ドドド', P ? W * 0.74 : W * 0.88, P ? H * 0.035 : 175 * s, (P ? 46 : 44) * s, t, { rot: -0.15, seed: 3 });
        // panel 2: the video in hand
        panel(ctx, Lo.p2, K.beat(t, 2.0, 0.3, 'lin'), { inner: (q) => { speedLines(ctx, 0, 0, W, H, t, 40); } });
        if (t > 2.15) { const [vx, vy, vh] = Lo.vid; phone(ctx, vx, vy - (P ? 0 : 20 * s), vh * K.ease.back(K.beat(t, 2.15, 0.4, 'lin')), s, t);
          caption(ctx, 'your video', P ? W * 0.75 : vx, P ? vy + vh * 0.2 : vy + vh * 0.5 + 34 * s, K.beat(t, 2.8, 0.4, 'lin'), { align: 'center', size: 38 }); }
        // panel 3: Creator OS under a radial burst
        const n3 = panel(ctx, Lo.p3, K.beat(t, 4.0, 0.3, 'lin'), { inner: (q) => { gradFill(ctx, 'radial', () => panelPath(ctx, q), 0.85); focusLines(ctx, Lo.node[0], Lo.node[1], 150 * s, 70 * s, t, { n: 110, seed: 2 }); } });
        const ap = K.beat(t, 3.4, 0.6, 'lin');
        const a1 = P ? [[W * 0.24, Lo.vid[1] + Lo.vid[2] * 0.42], [W * 0.28, Lo.node[1] - 50 * s]] : [[Lo.vid[0] + 90 * s, Lo.vid[1] + 40 * s], [Lo.node[0] - 150 * s, Lo.node[1] + 10 * s]];
        if (n3) {
          ctx.save(); const np = K.ease.back(K.beat(t, 4.1, 0.4, 'lin')); ctx.translate(Lo.node[0], Lo.node[1]); ctx.scale(np, np); ctx.translate(-Lo.node[0], -Lo.node[1]);
          const bw = 330 * s, bh = 100 * s; style.box(ctx, Lo.node[0] - bw / 2, Lo.node[1] - bh / 2, bw, bh, 1, { border: 6 });
          ctx.font = K.font(44 * s, HEAD, 400); ctx.textAlign = 'center'; ctx.fillStyle = INK; ctx.fillText('Creator OS', Lo.node[0], Lo.node[1] + 16 * s); ctx.restore();
        }
        style.arrow(ctx, a1[0], a1[1], ap, { bend: P ? 0.25 : -0.2 });
        // panel 4: the fan-out
        panel(ctx, Lo.p4, K.beat(t, 4.95, 0.3, 'lin'), { inner: (q) => tone(ctx, 0.18, () => panelPath(ctx, q)) });
        if (P) { const tp = K.beat(t, 5.0, 0.4, 'lin'); style.arrow(ctx, [W / 2, Lo.node[1] + 60 * s], [W / 2, Lo.chips[6][1] - 10 * s], tp, { bend: 0, width: 7 }); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'lin');
          if (P) style.arrow(ctx, [W / 2, cy - 12 * s], [left ? W * 0.47 : W * 0.53, cy - 12 * s], p, { bend: 0, width: 6 });
          else style.arrow(ctx, [Lo.node[0] + 160 * s, Lo.node[1]], [cx - 34 * s, cy - 12 * s], p, { bend: (i - 3) * 0.03, width: 6 });
          caption(ctx, name, P ? (left ? W * 0.43 : W * 0.57) : cx, cy, K.beat(t, t0 + 0.25, 0.3, 'lin'), { size: P ? 38 : 34, align: P ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 6.2) sfx(ctx, 'シュバッ', P ? W * 0.08 : 820 * s, P ? H * 0.95 : 690 * s, 40 * s, t, { rot: -0.1, seed: 5 });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        // page 2: one big splash panel for the count, a small panel keeps Creator OS on screen
        const m = (P ? 22 : 18) * s, top = P ? H * 0.14 : 130 * s;
        panel(ctx, [[m, m], [W - m, m], [W - m, top], [m, top]], K.beat(t, 8.25, 0.25, 'lin'), { inner: (q) => tone(ctx, 0.3, () => panelPath(ctx, q)) });
        ctx.save(); ctx.font = K.font(50 * s, HEAD, 400); ctx.textAlign = 'center'; ctx.lineJoin = 'round'; ctx.strokeStyle = WHITE; ctx.lineWidth = 12 * s;
        ctx.strokeText('Creator OS', W / 2, (m + top) / 2 + 18 * s); ctx.fillStyle = INK; ctx.fillText('Creator OS', W / 2, (m + top) / 2 + 18 * s); ctx.restore();
        const cy = P ? H * 0.43 : 400 * s;
        panel(ctx, [[m, top + 14 * s], [W - m, top + 14 * s], [W - m, H - m], [m, H - m]], K.beat(t, 8.3, 0.25, 'lin'), { inner: (q) => { gradFill(ctx, 'radial', () => panelPath(ctx, q), 0.9); focusLines(ctx, W / 2, cy - 40 * s, (P ? 420 : 380) * s, (P ? 160 : 110) * s, t, { n: 170, seed: 4 }); } });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t > 8.5) style.counter(ctx, Math.round(v / 1000) * 1000, W / 2, cy, 1, { size: P ? 100 : 128 });
        caption(ctx, 'views', W / 2, cy + 74 * s, K.beat(t, 8.8, 0.3, 'lin'), { align: 'center', size: 40 });
        style.emphasis(ctx, W / 2, cy - 40 * s, (P ? 215 : 290) * s, K.beat(t, 10.0, 0.35, 'lin'), { t, text: 'ドン!', size: P ? 80 : 74, ry: P ? 0.75 : 0.5 });
        if (P) balloon(ctx, ['POST ONCE.', 'REACH EVERYWHERE.'], W / 2, H * 0.74, K.beat(t, 10.5, 0.8, 'lin'), { size: 54, tail: [-150 * s, 220 * s] });
        else balloon(ctx, ['POST ONCE. REACH EVERYWHERE.'], W / 2, 600 * s, K.beat(t, 10.5, 0.8, 'lin'), { size: 48, tail: [-180 * s, 110 * s] });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.8);
      k.play('thud', 0.05); k.play('whoosh', 0.0, { dur: 0.2 }); k.play('riser', 0.4, { dur: 0.8, gain: 0.5 }); k.play('stamp', 1.15, { gain: 0.6 });
      k.play('thud', 2.05); k.play('whoosh', 2.15, { dur: 0.3 }); k.play('pop', 2.85);
      k.play('scribble', 3.4, { medium: 'pen', dur: 0.6 }); k.play('thud', 4.05); k.play('pop', 4.2, { pitch: 0.8 });
      k.play('thud', 5.0, { gain: 0.8 });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.18, gain: 0.5 }); k.play('thud', 5.28 + i * 0.4, { gain: 0.45 }); k.play('pop', 5.3 + i * 0.4, { pitch: 1 + i * 0.07, gain: 0.6 }); }
      k.play('paper', 7.6, { dur: 0.8 }); k.play('whoosh', 7.7, { dur: 0.9 }); k.play('thud', 8.3);
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0); k.play('thud', 10.0, { gain: 0.8 });
      k.play('pop', 10.55); k.play('chime', 11.3, { note: 'E6' });
    },
  };
  MS.register(style);
})();
