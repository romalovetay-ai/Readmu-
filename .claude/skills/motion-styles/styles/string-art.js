// Nail & Thread String Art (Generative & Type). Taut cotton threads strung between brass nails on a stained walnut
// board. Every curve is an envelope of straight chords; each thread is drawn with its cast shadow, a translucent body
// and a sheen line, so the crossings glow. Kraft tags are nailed on, arrows are threads with nail barbs, counters
// are nail-and-thread seven-segment digits, and the title is burned in with a travelling ember.
(function () {
  const C = { wood: '#6a3d20', woodD: '#4a2914', woodL: '#8a5631', brass: '#c9a24a', thread: '#f6e7b8', gold: '#ffd25e', red: '#d8392f', kraft: '#c9a678', burn: '#2c160a', ink: '#2a1a10' };
  const SCRIPT = 'Kaushan Script', TYPE = 'Special Elite';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;

  function nail(ctx, x, y, s, k = 1) {
    if (k <= 0) return;
    const r = 4.2 * s * k;
    ctx.fillStyle = 'rgba(20,8,2,0.45)'; ctx.beginPath(); ctx.ellipse(x + 2.5 * s, y + 3 * s, r * 1.1, r * 0.8, 0.5, 0, TAU); ctx.fill();
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r); g.addColorStop(0, '#fff2c4'); g.addColorStop(0.45, C.brass); g.addColorStop(1, '#6e5418');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
  }
  // one taut thread between two points: shadow, translucent body, sheen
  function thread(ctx, a, b, s, col = C.thread, alpha = 0.75, w = 1.4) {
    ctx.strokeStyle = 'rgba(15,6,2,0.32)'; ctx.lineWidth = w * 1.2 * s; ctx.beginPath(); ctx.moveTo(a[0] + 2 * s, a[1] + 3 * s); ctx.lineTo(b[0] + 2 * s, b[1] + 3 * s); ctx.stroke();
    ctx.strokeStyle = K.rgba(col, alpha); ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.lineWidth = w * 0.35 * s; ctx.beginPath(); ctx.moveTo(a[0] - 0.4 * s, a[1] - 0.4 * s); ctx.lineTo(b[0] - 0.4 * s, b[1] - 0.4 * s); ctx.stroke();
  }
  function ringNails(cx, cy, r, n) { return Array.from({ length: n }, (_, i) => [cx + Math.cos((i / n) * TAU - Math.PI / 2) * r, cy + Math.sin((i / n) * TAU - Math.PI / 2) * r]); }
  // a ring of nails wound with star chords i -> i + k; p winds chord by chord. Envelope glows as it fills.
  function windRing(ctx, cx, cy, r, n, k, p, s, o = {}) {
    const pts = ringNails(cx, cy, r, n), np = K.clamp(p * 3);
    const chords = Math.floor(K.clamp((p - 0.25) / 0.75) * n);
    if (chords > 0 && o.glow !== false) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(cx, cy, r * 0.5, cx, cy, r * 1.05); const a = 0.22 * chords / n; g.addColorStop(0, `rgba(255,190,70,0)`); g.addColorStop(0.75, `rgba(255,200,80,${a})`); g.addColorStop(1, 'rgba(255,190,70,0)'); ctx.fillStyle = g; ctx.fillRect(cx - r * 1.1, cy - r * 1.1, r * 2.2, r * 2.2); ctx.restore(); }
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < chords; i++) thread(ctx, pts[i], pts[(i + k) % n], s, o.col || C.thread, 0.62);
    if (o.k2) for (let i = 0; i < chords; i++) thread(ctx, pts[i], pts[(i + o.k2) % n], s, o.col2 || C.gold, 0.55, 1.1);
    ctx.restore();
    pts.forEach((q, i) => nail(ctx, q[0], q[1], s, K.clamp(np * n - i)));
    return pts;
  }
  // seven-segment digit strung on nails
  const SEG = { '0': 'abcfed', '1': 'bc', '2': 'abged', '3': 'abgcd', '4': 'fgbc', '5': 'afgcd', '6': 'afgedc', '7': 'abc', '8': 'abcdefg', '9': 'abcdfg' };
  function digit(ctx, ch, x, y, w, h, s, col) {
    const P = { tl: [x, y], tr: [x + w, y], ml: [x, y + h / 2], mr: [x + w, y + h / 2], bl: [x, y + h], br: [x + w, y + h] };
    const segs = { a: ['tl', 'tr'], b: ['tr', 'mr'], c: ['mr', 'br'], d: ['bl', 'br'], e: ['ml', 'bl'], f: ['tl', 'ml'], g: ['ml', 'mr'] };
    for (const sg of SEG[ch] || '') { const [p0, p1] = segs[sg], a = P[p0], b = P[p1]; for (let k = -1; k <= 1; k++) { const off = k * 2.2 * s, horiz = a[1] === b[1]; thread(ctx, [a[0] + (horiz ? 0 : off), a[1] + (horiz ? off : 0)], [b[0] + (horiz ? 0 : off), b[1] + (horiz ? off : 0)], s, col, 0.85, 1.6); } }
    const used = new Set(); for (const sg of SEG[ch] || '') segs[sg].forEach((k) => used.add(k));
    used.forEach((k) => nail(ctx, P[k][0], P[k][1], s));
  }

  const style = {
    id: 'string-art', name: 'Nail & Thread String Art', family: 'Generative & Type',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Kaushan+Script&family=Special+Elite&display=block', specs: ['400 60px "Kaushan Script"', '400 30px "Special Elite"'] }],
    palette: C,
    sfx: { draw: null, land: 'tick', emphasis: 'pluck', transition: 'whoosh', bed: 'room' },
    windRing, nail, thread,

    background(ctx, W, H, t, o = {}) {
      const wood = K.cached(`sa-wood:${W}x${H}`, () => {
        const sc = 2, w = Math.ceil(W / sc), h = Math.ceil(H / sc), c = K.layer(w, h), x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data, nz = K.noise(808);
        const A = K.hex(C.woodD), B = K.hex(C.woodL), plank = Math.max(60, h / 4.3);
        for (let j = 0; j < h; j++) { const pk = Math.floor(j / plank), seam = (j % plank) < 1.6; for (let i = 0; i < w; i++) {
          const u = i / Math.max(w, h) * 3, v = j / Math.max(w, h) * 3, warp = nz.fbm2(u * 0.5 + pk * 7, v * 1.5 + pk, 4) * 3, ring = Math.sin((v * 48 + warp * 4 + pk * 1.7) * Math.PI);
          let k = 0.5 + 0.13 * ring + 0.1 * Math.sign(ring) * Math.pow(Math.abs(ring), 6) + nz.n2(u * 3, v * 260) * 0.16 + nz.fbm2(u * 1.2, v * 6 + pk * 3, 3) * 0.25; k = K.clamp(k);
          const o4 = (j * w + i) * 4, sh = seam ? 0.45 : 1; d[o4] = (A[0] + (B[0] - A[0]) * k) * sh; d[o4 + 1] = (A[1] + (B[1] - A[1]) * k) * sh; d[o4 + 2] = (A[2] + (B[2] - A[2]) * k) * sh; d[o4 + 3] = 255;
        } }
        x.putImageData(img, 0, 0);
        const big = K.layer(W, H), bx = big.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(c, 0, 0, W, H); return big;
      });
      const ox = o.pan || 0;
      if (ox) { ctx.drawImage(wood, -((ox % W) + W) % W, 0); ctx.drawImage(wood, W - ((ox % W) + W) % W, 0); } else ctx.drawImage(wood, 0, 0);
    },
    // warm lamp from above, satin finish sheen, vignette, grain
    finish(ctx, W, H, t) {
      const g = ctx.createRadialGradient(W * 0.45, H * 0.3, 0, W * 0.45, H * 0.3, Math.hypot(W, H) * 0.7);
      g.addColorStop(0, 'rgba(255,200,130,0.16)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.55, '#120602');
      K.grain(ctx, W, H, t, 0.045, 24, 'overlay');
    },

    // pyrography: burned script revealed left to right behind a travelling ember
    title(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = K.fitSize(ctx, text, SCRIPT, 400, (o.size || 62) * s, ctx.canvas.width * 0.9);
      ctx.save(); ctx.font = K.font(size, SCRIPT, 400); ctx.textBaseline = 'alphabetic';
      const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, e = K.clamp(p);
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 20 * s, y - size * 1.2, (w + 40 * s) * e, size * 1.8); ctx.clip();
      ctx.fillStyle = 'rgba(60,25,8,0.45)'; ctx.shadowColor = 'rgba(40,15,3,0.9)'; ctx.shadowBlur = 6 * s; ctx.fillText(text, x0 + 1 * s, y + 1 * s);
      ctx.shadowBlur = 0; ctx.fillStyle = o.color || C.burn; ctx.fillText(text, x0, y);
      ctx.restore();
      if (e < 1) { const ex = x0 + (w + 40 * s) * e - 20 * s, ey = y - size * 0.35 + Math.sin(e * 40) * size * 0.2; ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(ex, ey, 0, ex, ey, 22 * s); g.addColorStop(0, 'rgba(255,230,150,1)'); g.addColorStop(0.3, 'rgba(255,120,30,0.8)'); g.addColorStop(1, 'rgba(255,60,0,0)'); ctx.fillStyle = g; ctx.fillRect(ex - 22 * s, ey - 22 * s, 44 * s, 44 * s); }
      if (o.underline !== false && e >= 1) { ctx.strokeStyle = C.burn; ctx.lineWidth = 2.4 * s; ctx.beginPath(); ctx.moveTo(x0 + w * 0.05, y + size * 0.28); ctx.quadraticCurveTo(x0 + w * 0.5, y + size * 0.22, x0 + w * 0.95, y + size * 0.3); ctx.stroke(); }
      ctx.restore(); return { w, h: size };
    },
    // kraft tag nailed on: tag shape with a reinforced hole, a nail through it, typewriter text
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 28) * s, e = K.ease.back(K.clamp(p));
      ctx.save(); ctx.font = K.font(size, TYPE, 400);
      const tw = ctx.measureText(text).width, h = size * 1.6, w = tw + size * 1.6, left = o.align === 'right';
      const x0 = o.align === 'center' ? x - w / 2 : left ? x - w : x;
      ctx.translate(x0 + (left ? w : 0), y); ctx.rotate((o.rot ?? ((o.seed || 1) % 3 - 1) * 0.03) * e); ctx.scale(1, e);
      const dir = left ? -1 : 1, nt = h * 0.45;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(dir * nt, -h / 2); ctx.lineTo(dir * w, -h / 2); ctx.lineTo(dir * w, h / 2); ctx.lineTo(dir * nt, h / 2); ctx.closePath();
      ctx.shadowColor = 'rgba(10,4,0,0.5)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetX = 3 * s; ctx.shadowOffsetY = 5 * s; ctx.fillStyle = o.fill || C.kraft; ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(dir > 0 ? nt : -w, -h / 2, w - nt, 3 * s);
      ctx.beginPath(); ctx.arc(dir * nt * 0.55, 0, 7 * s, 0, TAU); ctx.fillStyle = '#e9d6ae'; ctx.fill(); nail(ctx, dir * nt * 0.55, 0, s);
      ctx.fillStyle = C.ink; ctx.textBaseline = 'middle'; ctx.textAlign = dir > 0 ? 'left' : 'right'; ctx.fillText(text, dir * (nt + size * 0.35), size * 0.06);
      ctx.restore(); return { w, h };
    },
    // a thread pulled from nail to nail, finished with a barb of two short threads round a third nail
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.ease.inOut(K.clamp(p)), end = [K.lerp(from[0], to[0], e), K.lerp(from[1], to[1], e)];
      ctx.save(); ctx.lineCap = 'round';
      nail(ctx, from[0], from[1], s);
      // slack while being pulled, taut at the end: a slight sag that vanishes
      const sag = (1 - e) * 14 * s, mid = [(from[0] + end[0]) / 2, (from[1] + end[1]) / 2 + sag];
      thread(ctx, from, mid, s, o.color || C.thread, 0.9, 1.8); thread(ctx, mid, end, s, o.color || C.thread, 0.9, 1.8);
      if (e >= 1) {
        const ang = Math.atan2(to[1] - from[1], to[0] - from[0]), L = 16 * s;
        const b1 = [to[0] - Math.cos(ang - 0.55) * L, to[1] - Math.sin(ang - 0.55) * L], b2 = [to[0] - Math.cos(ang + 0.55) * L, to[1] - Math.sin(ang + 0.55) * L];
        thread(ctx, to, b1, s, o.color || C.thread, 0.9, 1.8); thread(ctx, to, b2, s, o.color || C.thread, 0.9, 1.8); nail(ctx, b1[0], b1[1], s); nail(ctx, b2[0], b2[1], s);
      }
      nail(ctx, end[0], end[1], s);
      ctx.restore(); return end;
    },
    // nails round a rectangle, thread wound round the outline then laced across it
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), step = 22 * s, pts = [];
      for (let xx = x; xx < x + w; xx += step) pts.push([xx, y]); for (let yy = y; yy < y + h; yy += step) pts.push([x + w, yy]);
      for (let xx = x + w; xx > x; xx -= step) pts.push([xx, y + h]); for (let yy = y + h; yy > y; yy -= step) pts.push([x, yy]);
      const n = pts.length, nk = K.clamp(p * 2.5), outline = K.clamp((p - 0.3) / 0.35), lace = K.clamp((p - 0.6) / 0.4);
      ctx.save(); ctx.lineCap = 'round';
      const no = Math.floor(outline * n); for (let i = 0; i < no; i++) thread(ctx, pts[i], pts[(i + 1) % n], s, o.color || C.thread, 0.9, 1.6);
      const nl = Math.floor(lace * n); for (let i = 0; i < nl; i++) thread(ctx, pts[i], pts[(i + Math.floor(n * 0.37)) % n], s, o.lace || C.gold, 0.45, 1.1);
      ctx.restore();
      pts.forEach((q, i) => nail(ctx, q[0], q[1], s, K.clamp(nk * n - i)));
    },
    // nail-and-thread seven-segment numerals
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), txt = K.fmt(value), dh = (o.size || 120) * s, dw = dh * 0.52, gap = dh * 0.2, cw = dh * 0.18;
      let tot = 0; for (const ch of txt) tot += ch === ',' ? cw : dw + gap; tot -= gap;
      let cx = x - tot / 2; ctx.save(); ctx.lineCap = 'round';
      for (const ch of txt) { if (ch === ',') { nail(ctx, cx + cw * 0.3, y, s); thread(ctx, [cx + cw * 0.3, y], [cx, y + dh * 0.15], s, o.color || C.gold, 0.9, 1.8); nail(ctx, cx, y + dh * 0.15, s); cx += cw; continue; } digit(ctx, ch, cx, y - dh, dw, dh, s, o.color || C.gold); cx += dw + gap; }
      ctx.restore();
    },
    // red thread wound round a ring of nails
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), n = 40, ry = o.ry ?? 0.5, pts = Array.from({ length: n }, (_, i) => [x + Math.cos((i / n) * TAU) * r, y + Math.sin((i / n) * TAU) * r * ry]);
      const k = Math.floor(K.clamp(p) * n); ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < k; i++) { thread(ctx, pts[i], pts[(i + 1) % n], s, C.red, 0.95, 2); thread(ctx, pts[i], pts[(i + 3) % n], s, C.red, 0.7, 1.4); }
      ctx.restore(); pts.forEach((q, i) => nail(ctx, q[0], q[1], s, K.clamp(p * n * 1.5 - i)));
    },
    // the camera travels along the board: a fresh stretch of walnut slides in with a motion smear (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), x = K.lerp(W, -W, K.ease.inOut(p)), wood = K.cached(`sa-wood:${W}x${H}`, () => null);
      ctx.save(); ctx.beginPath(); ctx.rect(Math.max(0, x - W * 0.2), 0, W * 1.4, H); ctx.clip();
      if (wood) { ctx.globalAlpha = 1; ctx.drawImage(wood, x - W * 0.2, 0); ctx.drawImage(wood, x - W * 1.2, 0); }
      const e = Math.sin(Math.PI * p); ctx.globalAlpha = 0.35 * e; ctx.fillStyle = '#1a0a03';
      const r = K.rng(Math.floor(p * 20)); for (let i = 0; i < 30; i++) ctx.fillRect(r() * W, r() * H, r.range(100, 400) * s, r.range(1, 3) * s);
      ctx.restore();
      const edge = x - W * 0.2; if (edge > 0 && edge < W) { const g = ctx.createLinearGradient(edge - 40 * s, 0, edge, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.5)'); ctx.fillStyle = g; ctx.fillRect(edge - 40 * s, 0, 40 * s, H); }
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 100 * s], video: [80 * s, 300 * s, 230 * s, 150 * s], node: [600 * s, 390 * s, 125 * s],
      chips: PLATFORMS.map((n, i) => [940 * s, (190 + i * 70) * s]), counter: [W / 2, 430 * s], take: [W / 2, 645 * s], top: [W / 2, 160 * s, 70 * s] };
    return { s, P: true, title: [W / 2, H * 0.08], video: [W * 0.3, H * 0.13, W * 0.4, H * 0.085], node: [W / 2, H * 0.4, W * 0.2],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.62 + Math.floor(i / 2) * 0.07)]), counter: [W / 2, H * 0.57], take: [W / 2, H * 0.78], top: [W / 2, H * 0.24, W * 0.15] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      // slow push-in on the board
      ctx.save(); const z = 1 + t * 0.004; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        const [vx, vy, vw, vh] = Lo.video, [nx, ny, nr] = Lo.node;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 1.0, 'lin'));
        if (t > 2.6) { const tri = [[vx + vw * 0.4, vy + vh * 0.28], [vx + vw * 0.64, vy + vh * 0.5], [vx + vw * 0.4, vy + vh * 0.72]]; const tp = K.clamp((t - 2.6) / 0.3); ctx.save(); for (let i = 0; i < 3 * tp; i++) thread(ctx, tri[i], tri[(i + 1) % 3], s, C.red, 0.95, 2.2); ctx.restore(); tri.forEach((q) => nail(ctx, q[0], q[1], s)); }
        style.label(ctx, 'your video', vx + 10 * s, vy + vh + 40 * s, K.beat(t, 2.8, 0.4), { seed: 2 });
        const a1 = P ? [[W / 2, vy + vh + 84 * s], [nx, ny - nr - 18 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - nr - 18 * s, ny - 20 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.6));
        windRing(ctx, nx, ny, nr, 60, 23, K.beat(t, 3.9, 1.3, 'lin'), s, { k2: 11 });
        style.label(ctx, 'Creator OS', nx - (P ? 0 : 0), ny + nr + 40 * s, K.beat(t, 4.9, 0.35), { align: 'center', size: 32, fill: '#e2c48f', rot: 0 });
        if (P) style.arrow(ctx, [W / 2, ny + nr + 84 * s], [W / 2, Lo.chips[6][1]], K.beat(t, 5.0, 0.5));
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const a = -0.8 + (i / 6) * 1.6, from = P ? [W / 2, cy] : [nx + Math.cos(a) * nr, ny + Math.sin(a) * nr], to = P ? [left ? W * 0.44 + 6 * s : W * 0.56 - 6 * s, cy] : [cx - 6 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35), { color: i % 2 ? C.gold : C.thread });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.3, 0.3), { align: P ? (left ? 'right' : 'left') : 'left', seed: i + 3 });
        });
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.3, 'lin'), { size: P ? 60 : 64, align: 'center' });
      } else {
        const [tx, ty, tr] = Lo.top;
        windRing(ctx, tx, ty, tr, 40, 15, 1, s, { k2: 7 });
        style.label(ctx, 'Creator OS', tx + tr + 20 * s, ty, 1, { size: 28, fill: '#e2c48f', rot: 0 });
        const [cx, cy] = Lo.counter, v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy, 1, { size: P ? 100 : 120 });
        style.label(ctx, 'views', cx - 50 * s, cy + 50 * s, K.beat(t, 8.8, 0.3), { seed: 4 });
        style.emphasis(ctx, cx, cy - (P ? 60 : 60) * s, (P ? 470 : 470) * s, K.beat(t, 10.0, 0.8, 'lin'), { ry: P ? 0.5 : 0.36 });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.4, 0.9, 'lin'), { size: P ? 58 : 60, align: 'center' });
      }
      ctx.restore();
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2);
      k.play('scribble', 0.2, { medium: 'pencil', dur: 1.6, gain: 1.2 });
      for (let i = 0; i < 10; i++) k.play('tick', 2.0 + i * 0.05, { pitch: 0.7 });
      for (let i = 0; i < 6; i++) k.play('pluck', 2.4 + i * 0.1, { note: 'C4', gain: 0.25, dur: 0.15 });
      k.play('pluck', 3.9, { note: 'G4', dur: 0.6 }); k.play('whoosh', 3.3, { dur: 0.6, gain: 0.4 });
      for (let i = 0; i < 16; i++) k.play('tick', 3.9 + i * 0.03, { pitch: 0.8 });
      for (let i = 0; i < 12; i++) k.play('pluck', 4.2 + i * 0.08, { note: ['C5', 'E5', 'G5', 'C6'][i % 4], gain: 0.2, dur: 0.2 });
      for (let i = 0; i < 7; i++) { k.play('pluck', 5.0 + i * 0.4, { note: ['G4', 'A4', 'C5', 'D5', 'E5', 'G5', 'A5'][i], gain: 0.5 }); k.play('tick', 5.33 + i * 0.4, { pitch: 0.7 }); }
      k.play('whoosh', 7.6, { dur: 1.2 });
      k.play('count', 8.6, { dur: 1.5 }); for (let i = 0; i < 8; i++) k.play('pluck', 10.0 + i * 0.08, { note: 'E5', gain: 0.4, dur: 0.25 });
      k.play('scribble', 10.5, { medium: 'pencil', dur: 1.2 }); k.play('chime', 11.5, { note: 'C6' });
    },
  };
  MS.register(style);
})();
