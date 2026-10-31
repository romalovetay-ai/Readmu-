// Sticky-Note Wall (Illustration). A brainstorming cork board in a wooden frame: Post-its with a glossy adhesive
// band, a curled lifting corner and its soft shadow, marker handwriting, a taped index card, push pins, and red
// yarn sagging from pin to pin. Notes slap on with a bounce; yarn unspools; the red marker circles the key moment.
(function () {
  const C = { cork: '#b98a57', corkDk: '#8a5f34', wood: '#6b4325', ink: '#1d2430', blue: '#1f4fa8', red: '#d2312a', yarn: '#c3262b', card: '#fbf8f0',
    yellow: '#f7e463', pink: '#f59bbd', blueN: '#8fd0f0', green: '#a6e07a', orange: '#f8b25c' };
  const MARK = 'Permanent Marker', HAND = 'Caveat';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  function board(W, H) {
    return K.cached(`sticky-board:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(61);
      const g = x.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2); g.addColorStop(0, '#c49563'); g.addColorStop(1, '#a87a48');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // cork granules: thousands of tiny light and dark crumbs
      const n = Math.floor(W * H / 22);
      for (let i = 0; i < n; i++) { const v = r(); x.fillStyle = v < 0.45 ? 'rgba(90,55,25,0.35)' : v < 0.8 ? 'rgba(225,185,130,0.35)' : 'rgba(60,35,15,0.5)';
        const sz = r.range(0.6, 2.4) * s; x.fillRect(r() * W, r() * H, sz, sz * r.range(0.5, 1.2)); }
      for (let i = 0; i < 60; i++) { x.fillStyle = 'rgba(70,40,15,0.35)'; x.beginPath(); x.arc(r() * W, r() * H, r.range(1, 3) * s, 0, 7); x.fill(); }
      // old pin holes
      for (let i = 0; i < 40; i++) { x.fillStyle = 'rgba(30,15,5,0.6)'; x.beginPath(); x.arc(r() * W, r() * H, 1.3 * s, 0, 7); x.fill(); }
      // wooden frame with grain and an inner shadow on the cork
      const f = 20 * s;
      const wg = x.createLinearGradient(0, 0, 0, f); wg.addColorStop(0, '#8a5a32'); wg.addColorStop(1, '#5a3418');
      x.fillStyle = C.wood; x.fillRect(0, 0, W, f); x.fillRect(0, H - f, W, f); x.fillRect(0, 0, f, H); x.fillRect(W - f, 0, f, H);
      x.strokeStyle = 'rgba(40,20,5,0.35)'; x.lineWidth = 1;
      for (let i = 0; i < 6; i++) { const o = (i + 0.5) * f / 6; x.beginPath(); x.moveTo(0, o); x.lineTo(W, o + r.range(-2, 2)); x.moveTo(0, H - o); x.lineTo(W, H - o); x.moveTo(o, 0); x.lineTo(o, H); x.moveTo(W - o, 0); x.lineTo(W - o, H); x.stroke(); }
      const sh = 26 * s;
      for (const [a, b, cc, d, gx0, gy0, gx1, gy1] of [[f, f, W - 2 * f, sh, 0, f, 0, f + sh], [f, H - f - sh, W - 2 * f, sh, 0, H - f, 0, H - f - sh], [f, f, sh, H - 2 * f, f, 0, f + sh, 0], [W - f - sh, f, sh, H - 2 * f, W - f, 0, W - f - sh, 0]]) {
        const lg = x.createLinearGradient(gx0, gy0, gx1, gy1); lg.addColorStop(0, 'rgba(40,20,5,0.45)'); lg.addColorStop(1, 'rgba(40,20,5,0)'); x.fillStyle = lg; x.fillRect(a, b, cc, d); }
      return c;
    });
  }

  // a push pin seen from above at a slight angle
  function pin(ctx, x, y, col, s) {
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x + 6 * s, y + 7 * s, 9 * s, 6 * s, 0.5, 0, 7); ctx.fill();
    const g = ctx.createRadialGradient(x - 3 * s, y - 3 * s, 1, x, y, 10 * s); g.addColorStop(0, K.rgba(K.mix(col, '#ffffff', 0.6))); g.addColorStop(0.5, col); g.addColorStop(1, K.rgba(K.mix(col, '#000000', 0.45)));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, 9.5 * s, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(x - 3.5 * s, y - 3.5 * s, 3 * s, 2 * s, -0.7, 0, 7); ctx.fill();
    ctx.restore();
  }
  // handwriting: per-letter wobble, revealed letter by letter
  function hand(ctx, text, x, y, p, o) {
    const s = sOf(ctx), size = (o.size || 40) * s, fam = o.family || MARK, r = K.rng(o.seed || 7);
    ctx.save(); ctx.font = K.font(size, fam, o.weight || 400); ctx.textBaseline = 'alphabetic';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, n = text.length * K.clamp(p);
    let cx = x0; ctx.fillStyle = o.color || C.ink;
    for (let i = 0; i < text.length; i++) { const ch = text[i], cw = ctx.measureText(ch).width, rot = (r() - 0.5) * 0.08, dy = (r() - 0.5) * 3 * s;
      if (i < n) { ctx.save(); ctx.translate(cx, y + dy); ctx.rotate(rot); ctx.globalAlpha = 0.93; ctx.fillText(ch, 0, 0); ctx.restore(); }
      cx += cw; }
    ctx.restore(); return { w, h: size };
  }
  // a Post-it: lands with a slap (scale + lift), curled lower-right corner, adhesive band, lifted shadow
  function note(ctx, x, y, w, h, p, o = {}) {
    if (p <= 0) return null; const s = sOf(ctx), col = o.color || C.yellow, rot = o.rot || 0;
    const land = K.clamp(p / 0.35), sc = 1 + (1 - K.ease.out(land)) * 0.25 + K.spring(p, 0.35, 0.04, 3, 10), air = 1 - K.ease.out(land);
    const cx = x + w / 2, cy = y + h / 2, curl = Math.min(w, h) * 0.13;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
    // shadow: tight along the stuck top, soft and wide under the curl
    ctx.save(); ctx.shadowColor = 'rgba(30,15,0,0.45)'; ctx.shadowBlur = (8 + air * 24) * s; ctx.shadowOffsetX = (3 + air * 10) * s; ctx.shadowOffsetY = (5 + air * 16) * s;
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h - curl); ctx.quadraticCurveTo(w - curl * 0.2, h - curl * 0.2, w - curl, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill(); ctx.restore();
    // paper shading: adhesive band at the top, darker toward the lifting bottom
    const g = ctx.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(0.17, 'rgba(255,255,255,0.1)'); g.addColorStop(0.18, 'rgba(0,0,0,0.02)'); g.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, 0); ctx.lineTo(w, h - curl); ctx.quadraticCurveTo(w - curl * 0.2, h - curl * 0.2, w - curl, h); ctx.lineTo(0, h); ctx.closePath(); ctx.fill();
    // the curled corner's underside
    ctx.fillStyle = K.rgba(K.mix(col, '#000000', 0.18)); ctx.beginPath(); ctx.moveTo(w, h - curl); ctx.quadraticCurveTo(w - curl * 0.55, h - curl * 0.55, w - curl, h); ctx.quadraticCurveTo(w - curl * 0.2, h - curl * 0.2, w, h - curl); ctx.fill();
    const hg = ctx.createLinearGradient(w - curl, h - curl, w, h); hg.addColorStop(0, 'rgba(255,255,255,0)'); hg.addColorStop(1, 'rgba(255,255,255,0.35)'); ctx.fillStyle = hg; ctx.fill();
    if (o.draw) o.draw(ctx, w, h);
    ctx.restore();
    return [cx, y + 14 * s];
  }
  function card(ctx, x, y, w, h, p, o = {}) {
    if (p <= 0) return; const s = sOf(ctx), land = K.clamp(p / 0.35), sc = 1 + (1 - K.ease.out(land)) * 0.2, air = 1 - K.ease.out(land);
    ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate(o.rot || 0); ctx.scale(sc, sc); ctx.translate(-w / 2, -h / 2);
    ctx.save(); ctx.shadowColor = 'rgba(30,15,0,0.4)'; ctx.shadowBlur = (6 + air * 20) * s; ctx.shadowOffsetY = (4 + air * 14) * s; ctx.fillStyle = C.card; ctx.fillRect(0, 0, w, h); ctx.restore();
    // ruled index card: blue lines, red header rule
    ctx.strokeStyle = 'rgba(80,130,200,0.45)'; ctx.lineWidth = 1.2 * s; for (let yy = h * 0.32; yy < h - 6 * s; yy += 22 * s) { ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(w, yy); ctx.stroke(); }
    ctx.strokeStyle = 'rgba(210,50,40,0.6)'; ctx.beginPath(); ctx.moveTo(0, h * 0.24); ctx.lineTo(w, h * 0.24); ctx.stroke();
    // tape strips on the top corners
    for (const sx of [0, 1]) { ctx.save(); ctx.translate(sx * w, 0); ctx.rotate(sx ? 0.6 : -0.6); ctx.fillStyle = 'rgba(240,230,190,0.6)'; ctx.fillRect(-36 * s, -12 * s, 72 * s, 24 * s); ctx.strokeStyle = 'rgba(180,160,110,0.4)'; ctx.strokeRect(-36 * s, -12 * s, 72 * s, 24 * s); ctx.restore(); }
    if (o.draw) o.draw(ctx, w, h);
    ctx.restore();
  }
  // red yarn: a sagging catenary-ish curve with a twisted highlight, unspooled with p
  function yarn(ctx, a, b, p, o = {}) {
    const s = sOf(ctx), d = Math.hypot(b[0] - a[0], b[1] - a[1]), sag = (o.sag ?? 0.12) * d;
    const pts = K.bezier(a, [K.lerp(a[0], b[0], 0.33), K.lerp(a[1], b[1], 0.33) + sag], [K.lerp(a[0], b[0], 0.66), K.lerp(a[1], b[1], 0.66) + sag], b, 40);
    const q = K.trim(pts, K.clamp(p)); if (q.length < 2) return null;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = 'rgba(40,10,0,0.3)'; ctx.lineWidth = 3.6 * s; ctx.beginPath(); q.forEach((pt, i) => (i ? ctx.lineTo(pt[0] + 3 * s, pt[1] + 5 * s) : ctx.moveTo(pt[0] + 3 * s, pt[1] + 5 * s))); ctx.stroke();
    ctx.strokeStyle = o.color || C.yarn; ctx.lineWidth = 3.4 * s; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,170,160,0.6)'; ctx.lineWidth = 1 * s; ctx.setLineDash([3 * s, 4 * s]); K.poly(ctx, q); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore(); return q[q.length - 1];
  }
  function markerLoop(ctx, x, y, rx, ry, p, col, seed) {
    const s = sOf(ctx), pts = K.wobble(K.circlePts(x, y, rx, ry, 80, -2.3, Math.PI * 2.25), 5 * s, seed, 0.02), q = K.trim(pts, K.clamp(p));
    if (q.length < 2) return; ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = K.rgba(col, 0.85); ctx.lineWidth = 7 * s; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 1.5 * s; K.poly(ctx, q.map(([a, b]) => [a + 1.5 * s, b - 1.5 * s])); ctx.stroke(); ctx.restore();
  }

  const style = {
    id: 'sticky-notes', name: 'Sticky-Note Wall', family: 'Illustration',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Caveat:wght@600;700&display=block',
      specs: ['400 44px "Permanent Marker"', '700 40px "Caveat"', '600 32px "Caveat"'] }],
    palette: { bg: C.cork, ink: C.ink, accent: C.red, yarn: C.yarn, yellow: C.yellow, pink: C.pink, blue: C.blueN, green: C.green, orange: C.orange, card: C.card },
    sfx: { draw: 'marker', land: 'paper', emphasis: 'stamp', transition: 'whoosh', bed: 'room' },
    note, card, pin, yarn, hand, markerLoop,

    background(ctx, W, H, t) { ctx.drawImage(board(W, H), 0, 0); },
    finish(ctx, W, H, t) {
      // overhead office light: warm centre falloff + grain
      K.vignette(ctx, W, H, 0.3, '#2a1606');
      K.grain(ctx, W, H, t, 0.035, 24, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return hand(ctx, text, x, y, p, { size: 48, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return hand(ctx, text, x, y, p, { size: 40, family: HAND, weight: 700, ...o }); },
    // connectors are red yarn between two pins (pins pressed in at both ends)
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return null;
      const end = yarn(ctx, from, to, p, o);
      pin(ctx, from[0], from[1], o.pinFrom || C.red, s);
      if (p >= 1) pin(ctx, to[0], to[1], o.pinTo || C.blue, s);
      return end;
    },
    box(ctx, x, y, w, h, p, o = {}) { return note(ctx, x, y, w, h, p, o); },

    // the number on a taped index card; earlier milestones it passed are crossed out above it
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 110) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, MARK, 400); ctx.textAlign = 'center'; ctx.fillStyle = o.color || C.blue;
      ctx.fillText(txt, x, y); const w = ctx.measureText(txt).width; ctx.restore();
      return { w, h: size };
    },
    emphasis(ctx, x, y, r, p, o = {}) { markerLoop(ctx, x, y, r * 1.2, r * (o.ry || 0.6), p, o.color || C.red, o.seed || 9); },

    // whip pan across the board: a fresh stretch of cork streaks in, then streaks out the other side
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), b = board(W, H), first = p < 0.5, k = first ? K.ease.in(p * 2) : K.ease.out((p - 0.5) * 2);
      const x = first ? K.lerp(W, 0, k) : K.lerp(0, -W, k);
      ctx.save(); ctx.beginPath(); ctx.rect(Math.max(0, x), 0, W, H); ctx.clip();
      for (let i = 0; i < 5; i++) { ctx.globalAlpha = i ? 0.25 : 1; ctx.drawImage(b, x + i * 40 * s * (first ? 1 : -1), 0); }
      ctx.restore();
      if (x > 0 && x < W) { const g = ctx.createLinearGradient(x - 60 * s, 0, x, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,15,0,0.35)'); ctx.fillStyle = g; ctx.fillRect(x - 60 * s, 0, 60 * s, H); }
    },
  };

  // ---------- the shared demo: one cork board ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const NCOL = [C.pink, C.blueN, C.yellow, C.green, C.blueN, C.orange, C.pink];
  const PINS = ['#2f7de0', '#e8c22a', '#2fa04a', '#d2312a', '#8a3fd0', '#2f7de0', '#e07a2a'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, card: [300 * s, 46 * s, 680 * s, 118 * s], video: [90 * s, 270 * s, 220 * s, 200 * s], node: [410 * s, 280 * s, 310 * s, 190 * s],
      chips: PLATFORMS.map((n, i) => [890 * s, (190 + i * 70) * s, 250 * s, 58 * s]) };
    return { s, P: true, card: [W * 0.06, H * 0.035, W * 0.88, H * 0.12], video: [W * 0.07, H * 0.2, W * 0.38, H * 0.15], node: [W * 0.53, H * 0.21, W * 0.41, H * 0.15],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.535 : W * 0.065, H * (0.45 + Math.floor(i / 2) * 0.12), W * 0.4, H * 0.085]) };
  }
  function playDoodle(ctx, cx, cy, r, s) {
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4 * s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    K.poly(ctx, K.wobble(K.rectPts(cx - r * 1.3, cy - r * 0.9, r * 2.6, r * 1.8), 1.5 * s, 3)); ctx.stroke();
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(cx - r * 0.35, cy - r * 0.5); ctx.lineTo(cx - r * 0.35, cy + r * 0.5); ctx.lineTo(cx + r * 0.5, cy); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const scene2 = t >= 8.25;
      if (!scene2) {
        const [kx, ky, kw, kh] = Lo.card;
        card(ctx, kx, ky, kw, kh, K.beat(t, 0.0, 0.5, 'lin'), { rot: -0.012, draw: (c, w, h) => {
          if (P) { hand(c, 'One video.', w / 2, h * 0.47, K.beat(t, 0.3, 0.6, 'lin'), { size: 54, align: 'center', color: C.blue, seed: 2 });
            hand(c, 'Every platform.', w / 2, h * 0.9, K.beat(t, 0.9, 0.8, 'lin'), { size: 54, align: 'center', color: C.blue, seed: 3 }); }
          else hand(c, 'One video. Every platform.', w / 2, h * 0.72, K.beat(t, 0.3, 1.4, 'lin'), { size: 50, align: 'center', color: C.blue, seed: 2 });
        } });
        const [vx, vy, vw, vh] = Lo.video;
        note(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.7, 'lin'), { color: C.yellow, rot: -0.06, draw: (c, w, h) => {
          if (t > 2.3) playDoodle(c, w / 2, h * 0.42, Math.min(w, h) * 0.17, s);
          hand(c, 'your video', w / 2, h * 0.86, K.beat(t, 2.8, 0.6, 'lin'), { size: P ? 44 : 42, align: 'center', family: HAND, weight: 700, seed: 4 });
        } });
        const [nx, ny, nw, nh] = Lo.node;
        note(ctx, nx, ny, nw, nh, K.beat(t, 3.9, 0.7, 'lin'), { color: C.pink, rot: 0.035, draw: (c, w, h) => {
          hand(c, 'Creator OS', w / 2, h * 0.5, K.beat(t, 4.3, 0.6, 'lin'), { size: P ? 48 : 40, align: 'center', seed: 5 });
          hand(c, 'post once', w / 2, h * 0.84, K.beat(t, 4.7, 0.3, 'lin'), { size: 34, align: 'center', family: HAND, weight: 600, color: C.blue, seed: 6 });
        } });
        // yarn: video -> Creator OS
        const vPin = [vx + vw * 0.5, vy + 14 * s], nPin = [nx + nw * 0.5, ny + 14 * s];
        if (t > 2.3) pin(ctx, vPin[0], vPin[1], '#e8c22a', s);
        style.arrow(ctx, vPin, nPin, K.beat(t, 3.3, 0.7, 'lin'), { sag: 0.25, pinTo: C.red });
        if (t > 4.6) pin(ctx, nPin[0], nPin[1], C.red, s);
        const hub = P ? [nx + nw * 0.5, ny + nh - 10 * s] : [nx + nw - 12 * s, ny + nh * 0.5];
        if (t > 4.95) pin(ctx, hub[0], hub[1], '#2f7de0', s);
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy, cw, ch] = Lo.chips[i], left = i % 2 === 0;
          note(ctx, cx, cy, cw, ch, K.beat(t, t0, 0.5, 'lin'), { color: NCOL[i], rot: ((i * 37) % 7 - 3) * 0.012, draw: (c, w, h) => {
            hand(c, name, P ? w / 2 : w * 0.18, h * 0.72, K.beat(t, t0 + 0.2, 0.3, 'lin'), { size: P ? 44 : 40, align: P ? 'center' : 'left', family: HAND, weight: 700, seed: 10 + i });
          } });
          const tp = P ? [left ? cx + cw - 16 * s : cx + 16 * s, cy + 14 * s] : [cx + 14 * s, cy + ch / 2];
          const yp = K.beat(t, t0 + 0.15, 0.3, 'lin');
          if (yp > 0) { yarn(ctx, hub, tp, yp, { sag: P ? 0.06 : 0.05 }); if (yp >= 1) pin(ctx, tp[0], tp[1], PINS[i], s); }
        });
        if (t > 4.95) pin(ctx, hub[0], hub[1], '#2f7de0', s);
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        // the board further along: Creator OS pinned up top, the tally card, the takeaway note
        const nw = P ? W * 0.5 : 260 * s, nh = P ? H * 0.1 : 110 * s, nx = W / 2 - nw / 2, ny = P ? H * 0.05 : 40 * s;
        note(ctx, nx, ny, nw, nh, 1, { color: C.pink, rot: 0.02, draw: (c, w, h) => hand(c, 'Creator OS', w / 2, h * 0.68, 1, { size: P ? 50 : 44, align: 'center', seed: 5 }) });
        pin(ctx, W / 2, ny + 14 * s, C.red, s);
        const cw = P ? W * 0.86 : 640 * s, ch = P ? H * 0.25 : 270 * s, cx = W / 2 - cw / 2, cy = P ? H * 0.2 : 185 * s;
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        card(ctx, cx, cy, cw, ch, K.beat(t, 8.25, 0.4, 'lin'), { rot: -0.01, draw: (c, w, h) => {
          // crossed-out earlier milestones, then the live number
          const marks = [[0.25, '10,000', 8.9], [0.75, '250,000', 9.3]];
          for (const [fx, txt, tt] of marks) if (t > tt) { hand(c, txt, w * fx, h * 0.2, 1, { size: 34, align: 'center', family: HAND, weight: 700, color: C.ink, seed: 20 });
            const sp = K.beat(t, tt + 0.15, 0.25, 'lin'); c.save(); c.strokeStyle = C.red; c.lineWidth = 4 * s; c.lineCap = 'round'; c.beginPath(); c.moveTo(w * fx - 70 * s, h * 0.2 - 10 * s); c.lineTo(w * fx - 70 * s + 140 * s * sp, h * 0.2 - 14 * s); c.stroke(); c.restore(); }
          if (t > 8.5) style.counter(c, Math.round(v / 1000) * 1000, w / 2, h * 0.68, 1, { size: P ? 92 : 100 });
          hand(c, 'views', w / 2, h * 0.92, K.beat(t, 8.8, 0.4, 'lin'), { size: 44, align: 'center', family: HAND, weight: 700, seed: 21 });
        } });
        style.emphasis(ctx, W / 2, cy + ch * 0.6, (P ? 280 : 290) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: P ? 0.42 : 0.33 });
        const tw = P ? W * 0.8 : 560 * s, th = P ? H * 0.17 : 120 * s, tx = W / 2 - tw / 2, ty = P ? H * 0.62 : 560 * s;
        note(ctx, tx, ty, tw, th, K.beat(t, 10.5, 0.5, 'lin'), { color: C.green, rot: -0.02, draw: (c, w, h) => {
          if (P) { hand(c, 'Post once.', w / 2, h * 0.42, K.beat(t, 10.6, 0.35, 'lin'), { size: 60, align: 'center', seed: 30 }); hand(c, 'Reach everywhere.', w / 2, h * 0.82, K.beat(t, 10.9, 0.5, 'lin'), { size: 60, align: 'center', seed: 31 }); }
          else hand(c, 'Post once. Reach everywhere.', w / 2, h * 0.64, K.beat(t, 10.6, 0.75, 'lin'), { size: 44, align: 'center', seed: 30 });
        } });
        if (t > 10.6) pin(ctx, W / 2, ty + 14 * s, '#2f7de0', s);
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2);
      k.play('paper', 0.05, { dur: 0.15 }); k.play('thud', 0.1, { gain: 0.35 }); k.play('scribble', 0.3, { medium: 'marker', dur: 1.4 });
      k.play('paper', 2.05, { dur: 0.15 }); k.play('thud', 2.1, { gain: 0.35 }); k.play('click', 2.3); k.play('scribble', 2.35, { medium: 'marker', dur: 0.5 }); k.play('scribble', 2.8, { medium: 'marker', dur: 0.6 });
      k.play('scribble', 3.3, { medium: 'pencil', dur: 0.7, gain: 0.6 }); k.play('click', 4.0);
      k.play('paper', 3.95, { dur: 0.15 }); k.play('thud', 4.0, { gain: 0.35 }); k.play('scribble', 4.3, { medium: 'marker', dur: 0.6 }); k.play('scribble', 4.7, { medium: 'marker', dur: 0.3 });
      for (let i = 0; i < 7; i++) { k.play('paper', 5.0 + i * 0.4, { dur: 0.12 }); k.play('pop', 5.08 + i * 0.4, { pitch: 0.9 + i * 0.05, gain: 0.5 }); k.play('scribble', 5.2 + i * 0.4, { medium: 'marker', dur: 0.3, gain: 0.7 }); k.play('click', 5.45 + i * 0.4, { gain: 0.8 }); }
      k.play('whoosh', 7.6, { dur: 1.1 });
      k.play('paper', 8.3, { dur: 0.2 }); k.play('count', 8.6, { dur: 1.4 }); k.play('scribble', 8.9, { medium: 'marker', dur: 0.4 }); k.play('scribble', 9.3, { medium: 'marker', dur: 0.4 });
      k.play('scribble', 10.0, { medium: 'marker', dur: 0.6 }); k.play('stamp', 10.55, { gain: 0.5 });
      k.play('paper', 10.5, { dur: 0.15 }); k.play('scribble', 10.7, { medium: 'marker', dur: 0.9 }); k.play('click', 10.65); k.play('chime', 11.4, { note: 'G5' });
    },
  };
  MS.register(style);
})();
