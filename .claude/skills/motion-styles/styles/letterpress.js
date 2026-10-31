// Wood Type Letterpress (Print). A two-ink broadside on cream stock: mixed wood display faces set letter by letter,
// each sort inked a little differently (wood grain, worn edges, ink squeezed to the rims), every letter bitten
// into the paper, brass rules and ornaments, arrows set from short rule pieces, a red rubber stamp, and the
// finished sheet lifted off the press for a fresh one as the scene change.
(function () {
  const C = { paper: '#efe3c8', ink: '#1c1a17', red: '#c4362b', rim: '#0b0a09' };
  const F = { block: 'Anton', fat: 'Abril Fatface', cond: 'Bebas Neue', mono: 'Rubik Mono One' };
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // inked-sort tile: alpha mask with horizontal wood grain, pale worn specks and a mottled ink film
  function sortTile(col, v) {
    return K.cached(`lp-ink:${col}:${v}`, () => {
      const n = 256, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
      const nz = K.noise(100 + v), r = K.rng(200 + v), [R, G, B] = K.hex(col);
      for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
        const grain = nz.n2(i * 0.012, y * 0.32 + nz.n2(i * 0.01, y * 0.01) * 2.5), film = nz.fbm2(i * 0.02 + 9, y * 0.02, 3);
        let a = 0.93 + film * 0.14 - (grain > 0.42 ? (grain - 0.42) * 1.6 : 0) - (r() < 0.025 ? 0.5 * r() : 0);
        const o = (y * n + i) * 4; d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = K.clamp(a, 0.18, 1) * 255;
      }
      x.putImageData(img, 0, 0); return c;
    });
  }
  function inkPat(ctx, col, seed) {
    const r = K.rng(seed), pt = ctx.createPattern(sortTile(col, seed % 4), 'repeat');
    pt.setTransform(new DOMMatrix().translate(r() * 256, r() * 256)); return pt;
  }
  // one wood sort printed: bitten impression, ink fill (own grain + density), rims squeezed darker
  function sort(ctx, ch, x, y, size, fam, col, seed, k = 1) {
    if (k <= 0 || ch === ' ') return;
    const s = sOf(ctx), r = K.rng(seed);
    ctx.save(); ctx.font = K.font(size, fam, 400); ctx.textBaseline = 'alphabetic';
    const land = 1 + 0.07 * (1 - K.ease.out(k)), w = ctx.measureText(ch).width;
    ctx.translate(x + w / 2, y); ctx.scale(land, land); ctx.translate(-w / 2, 0);
    // impression: shadowed lower-right and lifted upper-left edges of the bite
    ctx.fillStyle = 'rgba(70,50,25,0.22)'; ctx.fillText(ch, 1.3 * s, 1.6 * s);
    ctx.fillStyle = 'rgba(255,250,235,0.6)'; ctx.fillText(ch, -1 * s, -1 * s);
    ctx.globalAlpha = (0.86 + r() * 0.14) * K.clamp(k * 2);
    ctx.fillStyle = inkPat(ctx, col, seed); ctx.fillText(ch, 0, 0);
    ctx.globalAlpha *= 0.55; ctx.lineWidth = Math.max(1, size * 0.018); ctx.strokeStyle = col === C.red ? '#8e2219' : C.rim; ctx.strokeText(ch, 0, 0);
    ctx.restore();
  }
  // set a line of type letter by letter (p = share landed); returns width
  function setLine(ctx, text, x, y, size, fam, col, p, o = {}) {
    ctx.save(); ctx.font = K.font(size, fam, 400);
    const track = (o.track || 0.02) * size, ws = [...text].map((ch) => ctx.measureText(ch).width), total = ws.reduce((a, b) => a + b + track, -track);
    ctx.restore();
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    const n = text.length;
    [...text].forEach((ch, i) => {
      const k = K.clamp((p * (n + 2) - i) / 2.2);
      sort(ctx, ch, cx, y + (K.rng((o.seed || 1) * 31 + i)() - 0.5) * size * 0.012, size, fam, col, (o.seed || 1) * 97 + i * 13, k);
      cx += ws[i] + track;
    });
    return total;
  }
  // brass rule: a slightly uneven bar, optionally doubled
  function rule(ctx, x, y, w, th, col, seed) {
    ctx.save(); ctx.fillStyle = inkPat(ctx, col, seed); ctx.fillRect(x, y - th / 2, w, th); ctx.restore();
  }
  function diamond(ctx, x, y, r, col, seed) { ctx.save(); ctx.fillStyle = inkPat(ctx, col, seed); ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); ctx.fill(); ctx.restore(); }

  const style = {
    id: 'letterpress', name: 'Wood Type Letterpress', family: 'Print',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Anton&family=Bebas+Neue&family=Rubik+Mono+One&display=block',
      specs: ['400 64px "Anton"', '400 64px "Abril Fatface"', '400 40px "Bebas Neue"', '400 30px "Rubik Mono One"'] }],
    palette: { bg: C.paper, ink: C.ink, accent: C.red, red: C.red },
    sfx: { draw: null, land: 'thud', emphasis: 'stamp', transition: 'paper', bed: 'room' },

    background(ctx, W, H, t) {
      const tex = K.cached(`lp-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(4);
        x.drawImage(K.paperTex(W, H, C.paper, 23, 0.07, false), 0, 0);
        // cotton rag flecks + a blind (uninked) deboss of the chase edge
        for (let i = 0; i < 500; i++) { x.fillStyle = r() < 0.6 ? 'rgba(120,95,60,0.18)' : 'rgba(255,253,245,0.6)'; x.fillRect(r() * W, r() * H, (0.6 + r() * 1.8) * s, (0.5 + r()) * s); }
        x.strokeStyle = 'rgba(110,85,50,0.12)'; x.lineWidth = 2 * s; x.strokeRect(24 * s, 22 * s, W - 48 * s, H - 44 * s);
        x.strokeStyle = 'rgba(255,252,240,0.5)'; x.lineWidth = 1.5 * s; x.strokeRect(22.5 * s, 20.5 * s, W - 48 * s, H - 44 * s);
        return c;
      });
      ctx.drawImage(tex, 0, 0);
      // head and foot rules, red and black, like a broadside
      const s = S(W, H);
      rule(ctx, 46 * s, 44 * s, W - 92 * s, 6 * s, C.red, 3); rule(ctx, 46 * s, 56 * s, W - 92 * s, 2.2 * s, C.ink, 5);
      rule(ctx, 46 * s, H - 56 * s, W - 92 * s, 2.2 * s, C.ink, 6); rule(ctx, 46 * s, H - 44 * s, W - 92 * s, 6 * s, C.red, 7);
    },

    finish(ctx, W, H, t) {
      // uneven platen pressure: a soft lighter band, plus the paper's tooth over the ink
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, 'rgba(255,248,230,0.06)'); g.addColorStop(0.5, 'rgba(255,248,230,0)'); g.addColorStop(1, 'rgba(90,60,30,0.06)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.3; ctx.drawImage(K.paperTex(W, H, '#f6eedc', 61, 0.09, false), 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.16, '#4a3418');
      K.grain(ctx, W, H, t, 0.045, 12, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 72) * s;
      const w = setLine(ctx, o.upper === false ? text : text.toUpperCase(), x, y, size, o.family || F.block, o.color || C.ink, K.clamp(p), { align: o.align, seed: o.seed || 3, track: o.track ?? 0.03 });
      return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 40) * s;
      const w = setLine(ctx, text.toUpperCase(), x, y, size, o.family || F.cond, o.color || C.ink, K.clamp(p), { align: o.align, seed: o.seed || 11, track: 0.06 });
      return { w, h: size };
    },

    // arrow locked up from short rule pieces with a cast triangle head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.1, 60), len = K.pathLen(pts), piece = 16 * s, gap = 6 * s, col = o.color || C.ink;
      const n = Math.floor((len - 20 * s) / (piece + gap)), shown = Math.floor(n * K.clamp(p / 0.85));
      for (let i = 0; i < shown; i++) {
        const a = K.trim(pts, (i * (piece + gap)) / len), b = K.trim(pts, (i * (piece + gap) + piece) / len), A = a[a.length - 1], B = b[b.length - 1];
        ctx.save(); ctx.translate(A[0], A[1]); ctx.rotate(Math.atan2(B[1] - A[1], B[0] - A[0])); ctx.fillStyle = inkPat(ctx, col, 70 + i); ctx.fillRect(0, -2.4 * s, Math.hypot(B[0] - A[0], B[1] - A[1]), 4.8 * s); ctx.restore();
      }
      if (p > 0.85) {
        const k = K.clamp((p - 0.85) / 0.15), e = pts[pts.length - 1], a = pts[pts.length - 6], ang = Math.atan2(e[1] - a[1], e[0] - a[0]), L = 22 * s * (0.9 + 0.1 * k);
        ctx.save(); ctx.translate(e[0], e[1]); ctx.rotate(ang); ctx.globalAlpha = k; ctx.fillStyle = inkPat(ctx, col, 91);
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L, -L * 0.55); ctx.lineTo(-L, L * 0.55); ctx.fill(); ctx.restore();
      }
      return pts[pts.length - 1];
    },

    // a ruled box: thick + thin rule border with corner ornaments, pieces locked up in order
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), col = o.color || C.ink, k = K.clamp(p), seed = o.seed || 30;
      if (o.fill) { ctx.save(); ctx.globalAlpha = K.clamp(k * 3); ctx.fillStyle = inkPat(ctx, o.fill, seed + 9); ctx.fillRect(x, y, w, h); ctx.restore(); }
      const sides = [[x, y, w, 5 * s], [x + w - 5 * s, y, 5 * s, h], [x, y + h - 5 * s, w, 5 * s], [x, y, 5 * s, h]];
      sides.forEach((r, i) => { const q = K.clamp(k * 4 - i); if (q > 0) { ctx.save(); ctx.globalAlpha = q; ctx.fillStyle = inkPat(ctx, col, seed + i); ctx.fillRect(...r); ctx.restore(); } });
      if (k > 0.5) {
        const i2 = 11 * s; ctx.save(); ctx.globalAlpha = K.clamp((k - 0.5) * 4); ctx.strokeStyle = inkPat(ctx, col, seed + 5); ctx.lineWidth = 1.8 * s; ctx.strokeRect(x + i2, y + i2, w - 2 * i2, h - 2 * i2); ctx.restore();
        for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) diamond(ctx, cx, cy, 9 * s * K.clamp((k - 0.6) * 3), o.ornament || C.red, seed + 7);
      }
    },

    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 130) * s;
      return { w: setLine(ctx, K.fmt(value), x, y, size, F.block, o.color || C.ink, 1, { align: o.align || 'center', seed: 500 + Math.floor(value / 997), track: 0.04 }), h: size };
    },

    // a red rubber stamp slapped across the moment (ring + word, patchy rubber texture, slight double bounce)
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      const sc = 1 + 0.5 * (1 - K.ease.out(K.clamp(k * 2.5))), word = o.word || 'SMASH HIT';
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.16); ctx.scale(sc, sc);
      ctx.globalAlpha = K.clamp(k * 3) * 0.92; ctx.globalCompositeOperation = 'multiply';
      const pt = inkPat(ctx, o.color || C.red, 2); ctx.strokeStyle = pt; ctx.fillStyle = pt;
      ctx.font = K.font(r * 0.42, F.mono, 400); const tw = ctx.measureText(word).width, bw = tw + r * 0.5, bh = r * 0.8;
      ctx.lineWidth = 7 * s; ctx.beginPath(); ctx.roundRect(-bw / 2, -bh / 2, bw, bh, 14 * s); ctx.stroke();
      ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.roundRect(-bw / 2 + 11 * s, -bh / 2 + 11 * s, bw - 22 * s, bh - 22 * s, 8 * s); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(word, 0, r * 0.03);
      ctx.restore();
    },

    // the printed sheet is lifted off the press (covered at 0.5 by fresh stock), then the platen prints the next one
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H);
      if (p < 0.5) {
        const snap = K.cached(`lp-snap:${W}x${H}`, () => K.layer(W, H)), g = snap.getContext('2d');
        g.globalCompositeOperation = 'copy'; g.drawImage(ctx.canvas, 0, 0);
        const k = K.ease.in(p / 0.5);
        ctx.save(); style.background(ctx, W, H, 0);
        ctx.translate(W * 0.5, H * 0.5 - k * H * 1.15); ctx.rotate(-0.08 * k); ctx.translate(-W * 0.5, -H * 0.5);
        ctx.shadowColor = 'rgba(40,25,10,0.45)'; ctx.shadowBlur = 40 * s * k; ctx.shadowOffsetY = 18 * s * k;
        ctx.drawImage(snap, 0, 0); ctx.restore();
      } else {
        // fresh sheet; the platen comes down top to bottom and leaves the impression behind it
        const k = K.ease.inOut((p - 0.5) / 0.5), yy = k * H * 1.05;
        ctx.save(); ctx.beginPath(); ctx.rect(0, yy, W, H); ctx.clip(); style.background(ctx, W, H, 0); ctx.restore();
        const g = ctx.createLinearGradient(0, yy - 40 * s, 0, yy + 10 * s); g.addColorStop(0, 'rgba(60,40,20,0)'); g.addColorStop(1, 'rgba(60,40,20,0.25)');
        ctx.fillStyle = g; ctx.fillRect(0, yy - 40 * s, W, 50 * s);
      }
    },
  };

  // ---------- the shared demo: a broadside proofed block by block ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const PCOL = [C.ink, C.red, C.ink, C.red, C.ink, C.red, C.ink];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, t1: [W / 2, 140 * s], t2: [W / 2, 210 * s], video: [90 * s, 330 * s, 250 * s, 150 * s], node: [455 * s, 335 * s, 330 * s, 140 * s],
      chips: PL.map((_, i) => [920 * s, (282 + i * 58) * s]), top: [W / 2, 150 * s], counter: [W / 2, 400 * s], take: [W / 2, 585 * s] };
    return { s, P: true, t1: [W / 2, H * 0.1], t2: [W / 2, H * 0.155], video: [W * 0.25, H * 0.21, W * 0.5, H * 0.12], node: [W * 0.15, H * 0.42, W * 0.7, H * 0.08],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.6 + Math.floor(i / 2) * 0.075)]), top: [W / 2, H * 0.18], counter: [W / 2, H * 0.46], take: [W / 2, H * 0.73] };
  }
  function node(ctx, x, y, w, h, p, s) {
    style.box(ctx, x, y, w, h, p, { seed: 41, ornament: C.red });
    if (p > 0.3) style.title(ctx, 'CREATOR OS', x + w / 2, y + h / 2 + 24 * s, K.clamp((p - 0.3) / 0.7), { size: 62, align: 'center', color: C.red, seed: 43, family: F.block });
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      // the platen kiss: a tiny squeeze of the whole sheet on each landing beat
      const kiss = [0.3, 2.0, 4.0, 8.4, 10.0].reduce((a, t0) => a + Math.max(0, K.spring(t, t0, 1, 6, 9)), 0);
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(1 - 0.004 * kiss, 1 - 0.004 * kiss); ctx.translate(-W / 2, -H / 2);
      style.background(ctx, W, H, t);
      if (!scene2) {
        style.title(ctx, 'One video.', Lo.t1[0], Lo.t1[1], K.beat(t, 0.15, 0.8, 'lin'), { size: P ? 96 : 84, align: 'center', family: F.block });
        diamond(ctx, Lo.t2[0] - (P ? 420 : 330) * s, Lo.t2[1] - 18 * s, 9 * s * K.beat(t, 1.0, 0.2), C.ink, 4); diamond(ctx, Lo.t2[0] + (P ? 420 : 330) * s, Lo.t2[1] - 18 * s, 9 * s * K.beat(t, 1.0, 0.2), C.ink, 4);
        style.title(ctx, 'Every platform.', Lo.t2[0], Lo.t2[1], K.beat(t, 0.9, 1.0, 'lin'), { size: P ? 64 : 56, align: 'center', family: F.fat, color: C.red, upper: false, seed: 9 });
        const [vx, vy, vw, vh] = Lo.video, vp = K.beat(t, 2.0, 0.6, 'lin');
        style.box(ctx, vx, vy, vw, vh, vp, { seed: 21 });
        if (vp > 0.7) { ctx.save(); ctx.fillStyle = inkPat(ctx, C.red, 22); const r = Math.min(vw, vh) * 0.28, cx = vx + vw * 0.52, cy = vy + vh / 2; ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx - r * 0.6, cy + r); ctx.fill(); ctx.restore(); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 50 * s, K.beat(t, 2.6, 0.5, 'lin'), { align: 'center', size: 40 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 72 * s], [nx + nw / 2, ny - 14 * s]] : [[vx + vw + 16 * s, vy + vh / 2], [nx - 16 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: 0 });
        node(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.9, 'lin'), s);
        if (P) style.arrow(ctx, [W / 2, ny + nh + 14 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0 });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 16 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 12 * s] : [cx - 20 * s, cy - 13 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.3, 'lin'), { bend: P ? 0 : (i - 3) * 0.02, color: PCOL[i] });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.25, 0.35, 'lin'), { size: P ? 40 : 40, align: P ? (left ? 'right' : 'left') : 'left', color: PCOL[i], seed: 60 + i });
        });
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw, h2 = nh;
        node(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, s);
        // counter re-set and re-stamped six times a second
        const tq = Math.floor(t * 6) / 6, v = K.count(tq, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 120 : 140 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 64 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 46, color: C.red, seed: 77 });
        style.emphasis(ctx, P ? W / 2 : W * 0.815, P ? Lo.counter[1] + 185 * s : Lo.counter[1] + 70 * s, (P ? 110 : 100) * s, K.beat(t, 10.0, 0.35, 'lin'), {});
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.6, 'lin'), { size: 80, align: 'center' }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 80 * s, K.beat(t, 10.8, 0.8, 'lin'), { size: 60, align: 'center', family: F.fat, color: C.red, upper: false, seed: 19 }); }
        else { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1] - 18 * s, K.beat(t, 10.5, 0.5, 'lin'), { size: 60, align: 'center' }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 44 * s, K.beat(t, 10.8, 0.8, 'lin'), { size: 46, align: 'center', family: F.fat, color: C.red, upper: false, seed: 19 }); }
      }
      ctx.restore();
      if (t > 7.5 && t < 9.1) style.transition(ctx, W, H, K.clamp((t - 7.5) / 1.6), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2);
      // each sort landing is a soft press thud; heavier on block lock-ups
      for (let i = 0; i < 10; i++) k.play('thud', 0.2 + i * 0.08, { gain: 0.25 });
      for (let i = 0; i < 15; i++) k.play('click', 0.95 + i * 0.065, { pitch: 0.6, gain: 0.8 });
      k.play('thud', 2.05, { gain: 0.6 }); k.play('stamp', 2.4, { gain: 0.35 });
      for (let i = 0; i < 10; i++) k.play('click', 2.65 + i * 0.05, { pitch: 0.7 });
      for (let i = 0; i < 8; i++) k.play('click', 3.3 + i * 0.09, { pitch: 0.5, gain: 0.8 });
      k.play('thud', 4.0, { gain: 0.7 }); for (let i = 0; i < 10; i++) k.play('click', 4.3 + i * 0.06, { pitch: 0.65 });
      for (let i = 0; i < 7; i++) { k.play('click', 5.0 + i * 0.4, { pitch: 0.55 }); k.play('thud', 5.3 + i * 0.4, { gain: 0.35 }); }
      k.play('paper', 7.5, { dur: 0.8, gain: 1.4 }); k.play('whoosh', 7.6, { dur: 0.6, gain: 0.5 }); k.play('thud', 8.4, { gain: 0.8 });
      for (let i = 0; i < 9; i++) k.play('stamp', 8.6 + i * (1 / 6), { gain: 0.18 });
      k.play('stamp', 10.0, { gain: 1.2 }); k.play('thud', 10.0, { gain: 0.5 });
      for (let i = 0; i < 10; i++) k.play('click', 10.5 + i * 0.06, { pitch: 0.6 });
      k.play('chime', 11.4, { note: 'D6' });
    },
  };
  MS.register(style);
})();
