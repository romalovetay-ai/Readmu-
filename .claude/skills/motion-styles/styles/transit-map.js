// Transit Map (Data & Information). A Beck-style metro diagram: fat coloured lines locked to 0/45/90 degrees with
// rounded bends, bundled without crossings, line-colour station ticks, black-ringed interchanges, terminus bars,
// a river, clean sans lettering, trains gliding on finished routes, an amber dot-matrix departure board and a
// passing-train scene change.
(function () {
  const P = { paper: '#f7f5ef', ink: '#1b1f3b', river: '#bfddeb', riverInk: '#4b8db0', navy: '#2e3a87', amber: '#ffb000', board: '#121212',
    red: '#dc2a26', teal: '#00a0a8', orange: '#f39419', black: '#1f1f1f', blue: '#0a6cb8', purple: '#8b4a9c', green: '#00894a' };
  const SANS = 'Inter', SERIF = 'Libre Baskerville', DOT = 'VT323';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // Round the corners of an orthogonal/45 degree polyline into short arcs (sampled, so K.trim can draw it on).
  function rounded(pts, r) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length - 1; i++) {
      const a = pts[i - 1], v = pts[i], b = pts[i + 1], la = Math.hypot(a[0] - v[0], a[1] - v[1]), lb = Math.hypot(b[0] - v[0], b[1] - v[1]);
      const ka = Math.min(r / la, 0.5), kb = Math.min(r / lb, 0.5), p1 = [v[0] + (a[0] - v[0]) * ka, v[1] + (a[1] - v[1]) * ka], p2 = [v[0] + (b[0] - v[0]) * kb, v[1] + (b[1] - v[1]) * kb];
      for (let k = 0; k <= 8; k++) { const u = k / 8, w = 1 - u; out.push([w * w * p1[0] + 2 * w * u * v[0] + u * u * p2[0], w * w * p1[1] + 2 * w * u * v[1] + u * u * p2[1]]); }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  // Route from a to b: horizontal, then a 45 degree diagonal starting at x0, then horizontal (or the vertical twin).
  function route45(a, b, x0, vertical = false) {
    if (!vertical) { const dy = b[1] - a[1], d = Math.abs(dy), sx = Math.sign(b[0] - a[0]) || 1; return [a, [x0, a[1]], [x0 + d * sx, b[1]], b]; }
    const dx = b[0] - a[0], d = Math.abs(dx), sy = Math.sign(b[1] - a[1]) || 1; return [a, [a[0], x0], [b[0], x0 + d * sy], b];
  }
  function line(ctx, pts, p, col, w) {
    const q = K.trim(pts, K.clamp(p)); if (q.length < 2) return null;
    ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round'; ctx.strokeStyle = col; ctx.lineWidth = w; K.poly(ctx, q); ctx.stroke(); ctx.restore();
    return q;
  }
  function tick(ctx, pts, u, col, w, side = 1) {
    const q = K.trim(pts, u), b = q[q.length - 1], a = q[Math.max(0, q.length - 2)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + (Math.PI / 2) * side;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.55; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] + Math.cos(ang) * w * 1.05, b[1] + Math.sin(ang) * w * 1.05); ctx.stroke(); ctx.restore();
  }
  function terminusBar(ctx, pts, col, w) {
    const b = pts[pts.length - 1], a = pts[pts.length - 2], ang = Math.atan2(b[1] - a[1], b[0] - a[0]) + Math.PI / 2;
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = w * 0.6; ctx.beginPath(); ctx.moveTo(b[0] - Math.cos(ang) * w * 1.1, b[1] - Math.sin(ang) * w * 1.1); ctx.lineTo(b[0] + Math.cos(ang) * w * 1.1, b[1] + Math.sin(ang) * w * 1.1); ctx.stroke(); ctx.restore();
  }
  function interchange(ctx, x, y, r, s, k = 1) {
    if (k <= 0) return; const rr = r * K.ease.back(K.clamp(k));
    ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = P.ink; ctx.lineWidth = 4.5 * s; ctx.beginPath(); ctx.arc(x, y, rr, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  // A small train on a route at fraction u.
  function train(ctx, pts, u, col, s) {
    const q = K.trim(pts, u), b = q[q.length - 1], a = q[Math.max(0, q.length - 3)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    ctx.save(); ctx.translate(b[0], b[1]); ctx.rotate(ang);
    ctx.fillStyle = '#fff'; ctx.strokeStyle = P.ink; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.roundRect(-22 * s, -7 * s, 30 * s, 14 * s, 5 * s); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(-19 * s, -3 * s, 6 * s, 6 * s); ctx.fillRect(-10 * s, -3 * s, 6 * s, 6 * s); ctx.fillRect(-1 * s, -3 * s, 6 * s, 6 * s);
    ctx.restore();
  }
  // Dot-matrix mask tile for the departure board.
  const dotTile = (d) => K.cached('tm-dot:' + d, () => { const c = K.layer(d, d), x = c.getContext('2d'); x.fillStyle = 'rgba(18,18,18,1)'; x.fillRect(0, 0, d, d); x.globalCompositeOperation = 'destination-out'; x.beginPath(); x.arc(d / 2, d / 2, d * 0.36, 0, Math.PI * 2); x.fill(); return c; });

  const style = {
    id: 'transit-map', name: 'Transit Map', family: 'Data & Information',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Inter:wght@500;700;800&family=Libre+Baskerville:ital@1&family=VT323&display=block',
      specs: ['800 50px "Inter"', '700 28px "Inter"', '500 20px "Inter"', 'italic 400 24px "Libre Baskerville"', '400 64px "VT323"'] }],
    palette: { ...P },
    sfx: { draw: null, land: 'click', emphasis: 'ding', transition: 'whoosh', bed: 'crowd' },

    background(ctx, W, H, t) {
      const cv = K.cached(`tm-bg:${W}x${H}`, () => { const c = K.layer(W, H), x = c.getContext('2d'); x.drawImage(K.paperTex(W, H, P.paper, 9, 0.018, true), 0, 0); return c; });
      ctx.drawImage(cv, 0, 0);
    },
    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.06, '#6b6a5a');
      K.grain(ctx, W, H, t, 0.025, 12, 'soft-light');
    },
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 50) * s, lines = String(text).split('\n'), lh = size * 1.08;
      ctx.save(); ctx.font = K.font(size, SANS, 800); ctx.fillStyle = o.color || P.ink; ctx.textAlign = o.align || 'left';
      let w = 0;
      lines.forEach((l, i) => { const q = K.clamp(p * lines.length - i); w = Math.max(w, ctx.measureText(l).width); if (q <= 0) return; ctx.save(); ctx.beginPath(); const lw = ctx.measureText(l).width, x0 = o.align === 'center' ? x - lw / 2 : x; ctx.rect(x0 - 4, y + i * lh - size, (lw + 8) * K.ease.out(q), size * 1.3); ctx.clip(); ctx.fillText(l, x, y + i * lh); ctx.restore(); });
      ctx.restore();
      return { w, h: lh * lines.length };
    },
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 28) * s; if (p <= 0) return { w: 0 };
      ctx.save(); ctx.globalAlpha = K.clamp(p * 2); ctx.font = K.font(size, SANS, o.weight || 700); ctx.fillStyle = o.color || P.ink; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + (1 - K.ease.out(K.clamp(p))) * 6 * s); const w = ctx.measureText(text).width; ctx.restore();
      return { w, h: size };
    },
    // A route drawn on from its terminus, locked to 0/45/90 degrees, rounded bends.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), w = (o.width || 12) * s;
      const raw = o.pts || route45(from, to, o.x0 ?? (from[0] + to[0]) / 2 - Math.abs(to[1] - from[1]) / 2, o.vertical);
      const pts = rounded(raw, (o.r || 26) * s), q = line(ctx, pts, p, o.color || P.navy, w);
      if (q && p >= 1) terminusBar(ctx, pts, o.color || P.navy, w);
      return q ? q[q.length - 1] : null;
    },
    // Interchange capsule: white with a black ring, sized to the rect.
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.ease.back(K.clamp(p)); if (k <= 0.01) return;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = P.ink; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, Math.min(w, h) / 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    },
    // Amber dot-matrix departure board readout.
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 120) * s, txt = typeof value === 'string' ? value : K.fmt(value);
      ctx.save(); ctx.font = `400 ${Math.round(size)}px "${DOT}"`; ctx.textAlign = o.align || 'center';
      ctx.shadowColor = 'rgba(255,176,0,0.7)'; ctx.shadowBlur = 14 * s; ctx.fillStyle = o.color || P.amber; ctx.fillText(txt, x, y);
      ctx.restore();
      return { h: size };
    },
    // Station pulse: line-colour rings radiating from an interchange.
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return; const cols = o.colors || [P.red, P.orange, P.blue];
      ctx.save();
      for (let i = 0; i < 3; i++) { const q = K.clamp(p * 1.3 - i * 0.15); if (q <= 0 || q >= 1) continue; ctx.globalAlpha = 1 - q; ctx.strokeStyle = cols[i % cols.length]; ctx.lineWidth = 8 * s * (1 - q) + 2 * s; ctx.beginPath(); ctx.arc(x, y, r * (0.4 + q), 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    },
    // Scene change: a train rushes across the frame, filling it, then leaves a clean platform behind.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), L = W * 2.2, x = W - p * (W + L), r = K.rng(3);
      if (x > W || x + L < 0) return;
      ctx.save();
      ctx.fillStyle = '#e8e6e0'; ctx.fillRect(x, 0, L, H);
      ctx.fillStyle = P.red; ctx.fillRect(x, H * 0.62, L, H * 0.12);
      ctx.fillStyle = P.navy; ctx.fillRect(x, H * 0.74, L, H * 0.05);
      const car = W * 0.55;
      for (let c = 0; c * car < L; c++) {
        const cx = x + c * car;
        ctx.fillStyle = '#c9c6bd'; ctx.fillRect(cx, 0, 6 * s, H);
        for (let wnd = 0; wnd < 3; wnd++) { const wx = cx + car * (0.1 + wnd * 0.3); ctx.fillStyle = '#26314f'; ctx.beginPath(); ctx.roundRect(wx, H * 0.2, car * 0.2, H * 0.32, 14 * s); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(wx + car * 0.02, H * 0.22, car * 0.05, H * 0.28); }
        ctx.fillStyle = '#b8b4aa'; ctx.fillRect(cx + car * 0.9, H * 0.15, car * 0.06, H * 0.6);
      }
      ctx.globalAlpha = 0.35; ctx.fillStyle = '#ffffff';
      for (let i = 0; i < 14; i++) ctx.fillRect(x + r() * L, r() * H, r.range(80, 260) * s, 2 * s);
      ctx.restore();
    },
    rounded, route45, line, tick, interchange, train,
  };

  // ---------- the shared demo: seven lines out of one interchange ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const LC = [P.red, P.teal, P.orange, P.black, P.blue, P.purple, P.green];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) {
      const cap = [478 * s, 418 * s], gap = 26 * s;
      return { s, portrait: false, title: [56 * s, 96 * s], cap, gap, src: [120 * s, cap[1]], x0: 600 * s, termX: 1000 * s, labX: 1022 * s,
        rows: PLATFORMS.map((n, i) => (172 + i * 72) * s), river: 668 * s };
    }
    const cap = [W * 0.2, H * 0.6], gap = 26 * s;
    return { s, portrait: true, title: [56 * s, H * 0.08], cap, gap, src: [cap[0], H * 0.27], x0: W * 0.3, termX: W * 0.62, labX: W * 0.645,
      rows: PLATFORMS.map((n, i) => H * (0.39 + i * 0.07)), river: H * 0.91 };
  }
  function network(ctx, W, H, t, Lo, prog) {
    const s = Lo.s, w = 12 * s, n = 7, [cx, cy] = Lo.cap, capH = (n - 1) * Lo.gap + 34 * s, capW = 40 * s;
    // river behind everything
    ctx.save(); ctx.strokeStyle = P.river; ctx.lineWidth = 34 * s; ctx.lineJoin = 'round';
    K.poly(ctx, rounded([[-20, Lo.river + 30 * s], [W * 0.18, Lo.river + 30 * s], [W * 0.18 + 60 * s, Lo.river - 30 * s], [W + 20, Lo.river - 30 * s]], 40 * s)); ctx.stroke();
    ctx.font = `italic 400 ${Math.round(24 * s)}px "${SERIF}"`; ctx.fillStyle = P.riverInk; ctx.fillText('Feed Lake', W * 0.62, Lo.river - 22 * s); ctx.restore();
    const out = { routes: [] };
    // upload line from the video terminus into the interchange
    const up = rounded(Lo.portrait ? [Lo.src, [cx, cy - capH / 2]] : [Lo.src, [cx - capW / 2, cy]], 26 * s);
    const uq = line(ctx, up, prog.upload, P.navy, w * 1.15);
    if (uq) { tick(ctx, up, 0.35, P.navy, w, -1); tick(ctx, up, 0.7, P.navy, w, -1); }
    if (prog.upload > 0) { ctx.save(); ctx.strokeStyle = P.navy; ctx.lineWidth = w * 0.7; const a = Lo.src; ctx.beginPath(); if (Lo.portrait) { ctx.moveTo(a[0] - w * 1.2, a[1]); ctx.lineTo(a[0] + w * 1.2, a[1]); } else { ctx.moveTo(a[0], a[1] - w * 1.2); ctx.lineTo(a[0], a[1] + w * 1.2); } ctx.stroke(); ctx.restore(); }
    // seven lines leaving the capsule, bundled, 45 degree diagonals that never cross
    for (let i = 0; i < n; i++) {
      const sy = cy - capH / 2 + 17 * s + i * Lo.gap, ty = Lo.rows[i];
      const raw = route45([cx, sy], [Lo.termX, ty], Lo.x0);
      const pts = rounded(raw, 30 * s);
      out.routes.push(pts);
      const p = prog.lines[i]; if (p <= 0) continue;
      line(ctx, pts, p, LC[i], w);
      if (p > 0.55) tick(ctx, pts, 0.62, LC[i], w, i < 3 ? 1 : -1);
      if (p > 0.8) tick(ctx, pts, 0.84, LC[i], w, i < 3 ? 1 : -1);
      if (p >= 1) terminusBar(ctx, pts, LC[i], w);
    }
    // the interchange capsule drawn over the line ends
    if (prog.cap > 0) {
      const k = K.ease.back(K.clamp(prog.cap));
      ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
      ctx.fillStyle = '#fff'; ctx.strokeStyle = P.ink; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.roundRect(-capW / 2, -capH / 2, capW, capH, capW / 2); ctx.fill(); ctx.stroke(); ctx.restore();
    }
    out.capH = capH; out.capW = capW;
    return out;
  }
  // Departure board.
  function board(ctx, x, y, w, h, s, rowsText, t) {
    ctx.save();
    ctx.fillStyle = '#2b2b2b'; ctx.beginPath(); ctx.roundRect(x - 10 * s, y - 10 * s, w + 20 * s, h + 20 * s, 16 * s); ctx.fill();
    ctx.fillStyle = P.board; ctx.beginPath(); ctx.roundRect(x, y, w, h, 8 * s); ctx.fill();
    ctx.restore();
    rowsText(ctx);
    // dot-matrix mask over the lit characters
    ctx.save(); ctx.beginPath(); ctx.roundRect(x, y, w, h, 8 * s); ctx.clip();
    const d = Math.max(3, Math.round(5 * s)); ctx.fillStyle = ctx.createPattern(dotTile(d), 'repeat'); ctx.globalAlpha = 0.55; ctx.fillRect(x, y, w, h);
    ctx.globalAlpha = 1; const g = ctx.createLinearGradient(x, y, x, y + h); g.addColorStop(0, 'rgba(255,255,255,0.06)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    ctx.restore();
    void t;
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.1, 'lin'), { size: portrait ? 50 : 48 });
        ctx.save(); ctx.globalAlpha = K.beat(t, 1.0, 0.5); ctx.font = `500 ${Math.round(20 * s)}px "${SANS}"`; ctx.fillStyle = '#6a6d80'; ctx.letterSpacing = `${2 * s}px`;
        ctx.fillText('CREATOR OS NETWORK MAP', Lo.title[0], Lo.title[1] + (portrait ? 140 : 40) * s); ctx.restore();
        const prog = { upload: K.beat(t, 2.0, 1.3, 'inOut'), cap: K.beat(t, 3.9, 0.5, 'lin'), lines: PLATFORMS.map((_, i) => K.beat(t, 4.9 + i * 0.4, 0.5, 'inOut')) };
        const net = network(ctx, W, H, t, Lo, prog);
        // terminus label for the video
        style.label(ctx, 'your video', Lo.src[0] + (portrait ? 30 * s : -10 * s), Lo.src[1] + (portrait ? 0 : -46 * s), K.beat(t, 2.2, 0.4), { align: portrait ? 'left' : 'left', size: 30 });
        if (!portrait) style.label(ctx, 'Upload Line', (Lo.src[0] + Lo.cap[0]) / 2, Lo.cap[1] + 36 * s, K.beat(t, 3.0, 0.4), { align: 'center', size: 22, weight: 500, color: P.navy });
        const [cx, cy] = Lo.cap;
        style.label(ctx, 'Creator OS', cx + (portrait ? 0 : 0), portrait ? cy + net.capH / 2 + 46 * s : cy - net.capH / 2 - 40 * s, K.beat(t, 4.2, 0.4), { align: 'center', size: 36, weight: 800 });
        PLATFORMS.forEach((name, i) => {
          const p = prog.lines[i];
          style.label(ctx, name, Lo.labX, Lo.rows[i], K.beat(t, 4.9 + i * 0.4 + 0.4, 0.3), { size: 28 });
          if (p >= 1) { const u = ((t - (5.4 + i * 0.4)) * 0.35) % 1; if (u > 0) train(ctx, net.routes[i], 0.05 + u * 0.9, LC[i], s); }
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      } else {
        // the interchange, top, with its seven stubs; the board counts views and flips to the takeaway
        const cx = W / 2, cy = portrait ? H * 0.2 : 196 * s, n = 7, gap = 24 * s, w = 12 * s, capW = (n - 1) * gap + 34 * s, capH = 40 * s;
        for (let i = 0; i < n; i++) {
          const x = cx - capW / 2 + 17 * s + i * gap, len = (portrait ? 100 : 70) * s;
          const pts = rounded([[x, cy], [x, cy - len * 0.5], [x + (i - 3) * len * 0.4, cy - len * 0.5 - Math.abs(i - 3) * len * 0.4]], 18 * s);
          line(ctx, pts, 1, LC[i], w); terminusBar(ctx, pts, LC[i], w);
          line(ctx, [[x, cy], [x, cy + 70 * s]], 1, LC[i], w);
        }
        ctx.save(); ctx.fillStyle = '#fff'; ctx.strokeStyle = P.ink; ctx.lineWidth = 5 * s; ctx.beginPath(); ctx.roundRect(cx - capW / 2, cy - capH / 2, capW, capH, capH / 2); ctx.fill(); ctx.stroke(); ctx.restore();
        style.label(ctx, 'Creator OS', cx + capW / 2 + 22 * s, cy, 1, { size: 32, weight: 800 });
        style.emphasis(ctx, cx, cy, 120 * s, K.beat(t, 10.0, 1.2, 'lin'), { colors: [P.red, P.orange, P.blue] });
        const bw = portrait ? W * 0.9 : 1000 * s, bh = (portrait ? 440 : 320) * s, bx = W / 2 - bw / 2, by = portrait ? H * 0.38 : 330 * s;
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        board(ctx, bx, by, bw, bh, s, (c) => {
          c.save(); c.font = `400 ${Math.round((portrait ? 44 : 40) * s)}px "${DOT}"`; c.fillStyle = P.amber; c.shadowColor = 'rgba(255,176,0,0.6)'; c.shadowBlur = 8 * s;
          c.fillText('ALL LINES', bx + 30 * s, by + 52 * s); c.textAlign = 'right'; c.fillText('VIEWS', bx + bw - 30 * s, by + 52 * s); c.restore();
          c.fillStyle = 'rgba(255,176,0,0.25)'; c.fillRect(bx + 24 * s, by + 70 * s, bw - 48 * s, 2 * s);
          const flip = K.beat(t, 10.5, 0.35, 'lin');
          if (flip < 1) { c.save(); c.translate(0, by + bh * 0.62); c.scale(1, 1 - flip); style.counter(c, v, W / 2, (portrait ? 40 : 46) * s, 1, { size: portrait ? 150 : 150 }); c.restore(); }
          else {
            c.save(); c.font = `400 ${Math.round((portrait ? 76 : 74) * s)}px "${DOT}"`; c.fillStyle = P.amber; c.textAlign = 'center'; c.shadowColor = 'rgba(255,176,0,0.7)'; c.shadowBlur = 12 * s;
            const k = K.beat(t, 10.85, 0.35, 'lin');
            if (portrait) { c.fillText('POST ONCE.', W / 2, by + bh * 0.5); c.fillText('REACH EVERYWHERE.', W / 2, by + bh * 0.5 + 84 * s * k); }
            else c.fillText('POST ONCE. REACH EVERYWHERE.', W / 2, by + bh * 0.66 + (1 - k) * 20 * s);
            c.restore();
          }
          if (flip < 1) { c.save(); c.font = `400 ${Math.round(34 * s)}px "${DOT}"`; c.fillStyle = 'rgba(255,176,0,0.8)'; c.textAlign = 'center'; c.fillText('VIEWS ARRIVING ON 7 LINES', W / 2, by + bh - 24 * s); c.restore(); }
        }, t);
        // the takeaway is the board itself flipping (no separate caption)
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('crowd', 0, 12, 0.7);
      k.play('click', 0.2); k.play('click', 0.6, { pitch: 1.2 });
      k.play('whoosh', 2.0, { dur: 1.3, gain: 0.25 }); k.play('click', 2.45, { pitch: 0.9 }); k.play('click', 2.9, { pitch: 0.9 });
      k.play('pop', 3.95, { pitch: 0.8 }); k.play('ding', 4.3, { gain: 0.7 });
      const notes = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'];
      for (let i = 0; i < 7; i++) { k.play('whoosh', 4.9 + i * 0.4, { dur: 0.45, gain: 0.18 }); k.play('click', 5.3 + i * 0.4); k.play('pluck', 5.35 + i * 0.4, { note: notes[i], gain: 0.5 }); }
      // the passing train: a low rumble from the kit's raw noise helper, wheel clicks over the rail joints
      k.noise({ t: 7.6, dur: 1.3, a: 0.5, gain: 0.12, type: 'lowpass', f: 220, curve: 'lin' });
      k.play('whoosh', 7.7, { dur: 1.2 }); k.play('thud', 7.9, { gain: 0.4 });
      for (let i = 0; i < 8; i++) k.play('click', 7.75 + i * 0.13, { pitch: 0.5, gain: 0.9 });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('ding', 10.0); k.play('click', 10.5, { pitch: 0.7 }); k.play('click', 10.55, { pitch: 0.9 }); k.play('click', 10.6, { pitch: 0.7 });
      k.play('chime', 11.3, { note: 'E6' });
    },
  };
  MS.register(style);
})();
