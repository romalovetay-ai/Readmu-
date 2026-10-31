// Impasto Night (Painterly). Thick oil in short loaded strokes that follow a swirling flow field, Post-Impressionist
// night sky. Every daub is painted as relief: a shadowed edge, the body colour, and a lit ridge on top, with the
// colour broken from daub to daub. Lettering, arrows, panels and numbers are fat daubs in chrome yellow and
// vermilion against the blues; star halos pulse ring by ring. Scene change = a palette-knife drag across the canvas.
(function () {
  const OIL = { night: '#14286b', blue: '#2650b0', sky: '#4f7fd0', pale: '#a9c8ee', yellow: '#f2c230', chrome: '#ffd84a', vermilion: '#e2442a', green: '#2f5f3a', dark: '#0c1636', cream: '#f6e9b8' };
  const FONT = 'Fraunces';
  const S = (W, H) => K.layout(W, H).s;
  const shade = (c, k) => K.rgba(K.mix(c, k < 0 ? [8, 10, 30] : [255, 250, 225], Math.abs(k)));

  // one daub in relief: shadow edge, body, lit ridge
  function daub(x, px, py, ang, len, w, col) {
    const ca = Math.cos(ang) * len / 2, sa = Math.sin(ang) * len / 2;
    x.lineCap = 'round';
    x.strokeStyle = shade(col, -0.55); x.lineWidth = w; x.beginPath(); x.moveTo(px - ca + w * 0.14, py - sa + w * 0.22); x.lineTo(px + ca + w * 0.14, py + sa + w * 0.22); x.stroke();
    x.strokeStyle = typeof col === 'string' ? col : K.rgba(col); x.lineWidth = w * 0.9; x.beginPath(); x.moveTo(px - ca, py - sa); x.lineTo(px + ca, py + sa); x.stroke();
    x.strokeStyle = shade(col, 0.5); x.lineWidth = w * 0.24; x.beginPath(); x.moveTo(px - ca * 0.65 - w * 0.12, py - sa * 0.65 - w * 0.2); x.lineTo(px + ca * 0.55 - w * 0.12, py + sa * 0.55 - w * 0.2); x.stroke();
  }
  // swirl flow field
  function flow(W, H) {
    const vort = H > W ? [[0.3, 0.12, 1], [0.72, 0.3, -1], [0.35, 0.55, 1], [0.7, 0.78, -1]] : [[0.22, 0.25, 1], [0.55, 0.42, -1], [0.82, 0.22, 1]];
    const R = Math.min(W, H) * 0.22;
    return (x, y) => {
      let vx = 0.9, vy = Math.sin(x / W * 6) * 0.25;
      for (const [fx, fy, k] of vort) { const dx = x - fx * W, dy = y - fy * H, d2 = (dx * dx + dy * dy) / (R * R) + 0.3; vx += (-dy / R) * k * 1.6 / d2; vy += (dx / R) * k * 1.6 / d2; }
      return Math.atan2(vy, vx);
    };
  }
  function sky(W, H) {
    return K.cached(`im-sky:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(5), dir = flow(W, H), nz = K.noise(6);
      // canvas weave under the paint
      x.fillStyle = '#c9b892'; x.fillRect(0, 0, W, H);
      x.globalAlpha = 0.25; for (let i = 0; i < W; i += 3 * s) { x.fillStyle = i % (6 * s) < 3 * s ? '#a89670' : '#ddd0ad'; x.fillRect(i, 0, 1.5 * s, H); } for (let j = 0; j < H; j += 3 * s) { x.fillStyle = '#a89670'; x.fillRect(0, j, W, 1.2 * s); } x.globalAlpha = 1;
      // underpainting
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, OIL.night); g.addColorStop(0.7, OIL.blue); g.addColorStop(1, '#1e3a5a'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const n = Math.floor((W * H) / (150 * s * s)), hills = H > W ? H * 0.9 : H * 0.84;
      for (let i = 0; i < n; i++) {
        const px = r() * W, py = r() * H, ang = dir(px, py) + r.range(-0.12, 0.12), m = nz.fbm2(px * 0.004 / s, py * 0.004 / s, 3);
        let col = m > 0.18 ? OIL.sky : m > 0.02 ? OIL.blue : m > -0.15 ? '#1f45a0' : OIL.night;
        if (r() < 0.12) col = OIL.pale; if (r() < 0.03) col = '#7fa9d8';
        if (py > hills + Math.sin(px * 0.004) * 30 * s) { col = r() < 0.6 ? OIL.green : '#1d3b2a'; }
        daub(x, px, py, ang, r.range(16, 30) * s, r.range(6, 10) * s, K.mix(col, [r.range(0, 40), r.range(0, 40), r.range(0, 60)], 0.08));
      }
      return c;
    });
  }
  // impasto paint tile used as a fill for text and panels (colour broken stroke to stroke)
  function tile(cols, seed) {
    return K.cached('im-tile:' + cols.join() + seed, () => {
      const n = 96, c = K.layer(n, n), x = c.getContext('2d'), r = K.rng(seed);
      x.fillStyle = cols[0]; x.fillRect(0, 0, n, n);
      for (let i = 0; i < 90; i++) { const px = r() * n, py = r() * n, ang = r.range(-0.5, 0.5) + (i % 2 ? 0.2 : -0.3), col = r.pick(cols); for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) daub(x, px + ox, py + oy, ang, r.range(10, 18), r.range(4, 7), col); }
      return c;
    });
  }
  const YEL = [OIL.yellow, OIL.chrome, '#e8a820', OIL.cream];
  const VER = [OIL.vermilion, '#f06a3a', '#c8321f', OIL.chrome];
  const NAVY = [OIL.dark, OIL.night, '#1c3580', '#25469a'];

  function paintText(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 64) * s;
    ctx.save(); ctx.font = K.font(size, FONT, 900, 'italic'); ctx.textAlign = 'left';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.beginPath(); ctx.rect(x0 - 20 * s, y - size * 1.2, (w + 40 * s) * K.clamp(p), size * 1.8); ctx.clip();
    ctx.lineJoin = 'round';
    ctx.strokeStyle = K.rgba(OIL.dark, 0.85); ctx.lineWidth = 7 * s; ctx.strokeText(text, x0 + 2 * s, y + 3 * s);
    ctx.fillStyle = K.rgba(OIL.dark, 0.9); ctx.fillText(text, x0 + 2.5 * s, y + 3.5 * s);
    ctx.fillStyle = ctx.createPattern(tile(o.cols || YEL, o.seed || 3), 'repeat'); ctx.fillText(text, x0, y);
    ctx.strokeStyle = 'rgba(255,250,225,0.45)'; ctx.lineWidth = 1.4 * s; ctx.strokeText(text, x0 - 1 * s, y - 1 * s);
    ctx.restore(); return { w, h: size };
  }
  function daubPath(ctx, pts, p, o = {}) {
    const q = K.trim(pts, p); if (q.length < 2) return null;
    const s = S(ctx.canvas.width, ctx.canvas.height), r = K.rng(o.seed || 1), L = K.pathLen(q), step = (o.step || 11) * s, cols = o.cols || YEL;
    let acc = 0, i = 1, d = 0;
    for (let k = 0; k * step < L; k++) {
      const target = k * step; while (i < q.length - 1 && acc + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]) < target) { acc += Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1]); i++; }
      const a = q[i - 1], b = q[i], seg = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, f = K.clamp((target - acc) / seg), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      daub(ctx, K.lerp(a[0], b[0], f) + r.range(-1.5, 1.5) * s, K.lerp(a[1], b[1], f) + r.range(-1.5, 1.5) * s, ang + r.range(-0.15, 0.15), (o.len || 22) * s, (o.width || 10) * s, r.pick(cols));
    }
    return q[q.length - 1];
  }

  const style = {
    id: 'impasto-oil', name: 'Impasto Night', family: 'Painterly',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,900&display=block', specs: ['italic 900 64px "Fraunces"'] }],
    palette: { bg: OIL.night, ...OIL, ink: OIL.yellow, accent: OIL.vermilion },
    sfx: { draw: 'brush', land: 'pluck', emphasis: 'thud', transition: 'whoosh', bed: 'space' },
    setup(W, H) { sky(W, H); },

    background(ctx, W, H, t) {
      ctx.drawImage(sky(W, H), 0, 0);
      // the paint itself turning: a few hundred daubs riding the swirl, plus pulsing star halos
      const s = S(W, H), dir = flow(W, H), r = K.rng(9);
      ctx.save();
      for (let i = 0; i < 220; i++) {
        let px = r() * W, py = r() * H * 0.82; const sp = r.range(10, 22) * s, life = 6, ph = (t * 0.5 + r() * life) % life;
        for (let k = 0; k < 4; k++) { const a = dir(px, py); px += Math.cos(a) * sp * ph * 0.25; py += Math.sin(a) * sp * ph * 0.25; }
        ctx.globalAlpha = Math.sin((ph / life) * Math.PI) * 0.9;
        daub(ctx, px, py, dir(px, py), r.range(16, 26) * s, r.range(6, 9) * s, r() < 0.3 ? OIL.pale : OIL.sky);
      }
      ctx.globalAlpha = 1;
      const stars = H > W ? [[0.12, 0.035, 0.8], [0.9, 0.25, 0.8], [0.1, 0.36, 0.6], [0.88, 0.62, 0.8]] : [[0.06, 0.1, 1.1], [0.94, 0.12, 0.9], [0.62, 0.035, 0.5], [0.95, 0.5, 0.7]];
      stars.forEach(([fx, fy, z], si) => {
        const cx = fx * W, cy = fy * H;
        for (let ring = 3; ring >= 0; ring--) {
          const R = (14 + ring * 16) * s * z * (1 + 0.06 * Math.sin(t * 2.2 - ring * 0.9 + si)), n = Math.max(6, Math.floor((R * Math.PI * 2) / (13 * s)));
          const col = ring === 0 ? OIL.chrome : ring === 1 ? OIL.yellow : ring === 2 ? OIL.cream : OIL.pale;
          ctx.globalAlpha = ring === 3 ? 0.5 + 0.3 * Math.sin(t * 2 + si) : 1;
          for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2 + t * 0.15 * (ring % 2 ? 1 : -1); daub(ctx, cx + Math.cos(a) * R, cy + Math.sin(a) * R, a + Math.PI / 2, 15 * s, 7 * s, col); }
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = ctx.createPattern(tile(YEL, 11), 'repeat'); ctx.beginPath(); ctx.arc(cx, cy, 12 * s * z, 0, Math.PI * 2); ctx.fill();
      });
      ctx.restore();
    },
    finish(ctx, W, H, t) {
      // varnish: warm glaze, raking light from the top-left across the relief, canvas grain
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,230,170,0.35)'); g.addColorStop(1, 'rgba(0,0,20,0.35)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.45, '#050818');
      K.grain(ctx, W, H, t, 0.06, 12, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) { return paintText(ctx, text, x, y, p, { size: 66, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return paintText(ctx, text, x, y, p, { size: 38, ...o }); },
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), cols = o.cols || (o.color === 'vermilion' ? VER : YEL);
      const pts = K.arcPts(from, to, o.bend ?? 0.16, 40);
      const e = daubPath(ctx, pts, K.clamp(p / 0.8), { cols, seed: o.seed, width: o.width || 10 });
      if (p > 0.8) { const k = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 24 * s * k;
        for (const sg of [-1, 1]) daub(ctx, b[0] - Math.cos(ang + sg * 0.55) * L * 0.5, b[1] - Math.sin(ang + sg * 0.55) * L * 0.5, ang + sg * 0.55, L, 10 * s, cols[0]); }
      return e;
    },
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), fp = K.clamp((p - 0.3) / 0.5);
      if (fp > 0) { ctx.save(); ctx.globalAlpha = fp; ctx.fillStyle = ctx.createPattern(tile(o.fill || NAVY, (o.seed || 5) + 1), 'repeat'); ctx.beginPath(); ctx.roundRect(x, y, w, h, 18 * s); ctx.fill(); ctx.restore(); }
      return daubPath(ctx, K.rectPts(x, y, w, h), K.clamp(p / 0.8), { cols: o.cols || YEL, seed: o.seed || 5, width: 11, len: 24, step: 12 });
    },
    counter(ctx, value, x, y, p, o = {}) { return paintText(ctx, K.fmt(value), x, y, 1, { size: o.size || 128, align: o.align || 'center', cols: o.cols || YEL, seed: 21 }); },
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), t = o.t || 0;
      daubPath(ctx, K.circlePts(x, y, r * 1.22, r * 0.62, 90, -Math.PI / 2, Math.PI * 2), p, { cols: VER, seed: 31, width: 14, len: 26, step: 10 });
      if (p >= 1) for (let ring = 1; ring <= 2; ring++) { const k = 1 + ring * 0.12 + 0.02 * Math.sin(t * 3 - ring), n = 60; ctx.save(); ctx.globalAlpha = 0.75 / ring; for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; daub(ctx, x + Math.cos(a) * r * 1.22 * k, y + Math.sin(a) * r * 0.62 * k, a + Math.PI / 2, 14 * s, 6 * s, ring === 1 ? OIL.chrome : OIL.cream); } ctx.restore(); }
    },
    // palette knife: a broad smear of mixed paint dragged across (covered at 0.5), then scraped back off
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), smear = K.cached(`im-smear:${W}x${H}`, () => { const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(71); x.fillStyle = OIL.night; x.fillRect(0, 0, W, H);
        for (let i = 0; i < 900; i++) { const y = r() * H, col = r.pick([OIL.night, OIL.blue, OIL.sky, OIL.dark, OIL.pale, '#1f45a0']); x.strokeStyle = K.rgba(col, r.range(0.4, 0.9)); x.lineWidth = r.range(2, 10) * s; x.beginPath(); x.moveTo(r.range(-W * 0.2, W), y); x.lineTo(r.range(0, W * 1.2), y + r.range(-6, 6) * s); x.stroke(); }
        x.strokeStyle = 'rgba(255,255,255,0.12)'; for (let i = 0; i < 200; i++) { const y = r() * H; x.lineWidth = 1 * s; x.beginPath(); x.moveTo(0, y); x.lineTo(W, y + r.range(-3, 3) * s); x.stroke(); } return c; });
      const k = K.ease.inOut(K.clamp(p)), edge = p < 0.5 ? K.lerp(-60 * s, W + 60 * s, k * 2) : K.lerp(-60 * s, W + 60 * s, (k - 0.5) * 2);
      ctx.save(); ctx.beginPath();
      if (p < 0.5) ctx.rect(0, 0, edge, H); else ctx.rect(edge, 0, W - edge, H);
      ctx.clip(); ctx.drawImage(smear, 0, 0); ctx.restore();
      // the knife blade edge with its ridge of pushed paint
      ctx.save(); ctx.fillStyle = 'rgba(10,15,40,0.6)'; ctx.fillRect(edge - 4 * s, 0, 8 * s, H); ctx.fillStyle = 'rgba(220,230,255,0.35)'; ctx.fillRect(edge - 6 * s, 0, 2 * s, H); ctx.restore();
    },
  };

  // ---------- demo: painted into the night sky ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [110 * s, 285 * s, 250 * s, 160 * s], node: [480 * s, 295 * s, 300 * s, 140 * s],
      chips: PLATFORMS.map((n, i) => [990 * s, (176 + i * 70) * s]), title: [W / 2, 122 * s], counter: [W / 2, 420 * s] };
    return { s, video: [W * 0.25, H * 0.2, W * 0.5, H * 0.115], node: [W * 0.16, H * 0.41, W * 0.68, H * 0.08],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.59 + Math.floor(i / 2) * 0.078)]), title: [W / 2, H * 0.1], counter: [W / 2, H * 0.49] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W;
      const cam = { x: W / 2 + (portrait ? 0 : K.lerp(-18, 18, t / 12) * s), y: H / 2 + (portrait ? K.lerp(-18, 18, t / 12) * s : 0), zoom: 1.035 };
      ctx.save(); K.camera(ctx, W, H, cam);
      style.background(ctx, W, H, t);
      if (t < 8.0) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.15, 1.5, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 84 * s, K.clamp(tp * tt.length - i), { size: portrait ? 66 : 64, align: 'center', seed: 3 + i }));
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.9, 'lin'), { seed: 21 });
        if (t > 2.6) daubPath(ctx, [[vx + vw * 0.42, vy + vh * 0.26], [vx + vw * 0.42, vy + vh * 0.74], [vx + vw * 0.64, vy + vh * 0.5], [vx + vw * 0.42, vy + vh * 0.26]], K.beat(t, 2.6, 0.4, 'lin'), { cols: VER, seed: 22, width: 10, len: 18, step: 8 });
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 54 * s, K.beat(t, 3.0, 0.45, 'lin'), { align: 'center', cols: VER, seed: 5 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 72 * s], [nx + nw / 2, ny - 20 * s]] : [[vx + vw + 20 * s, vy + vh / 2], [nx - 22 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.45, 0.55, 'lin'), { seed: 31, bend: portrait ? 0.08 : -0.14 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.9, 'lin'), { seed: 41, cols: VER });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 18 * s, K.beat(t, 4.5, 0.45, 'lin'), { size: 52, align: 'center', seed: 7 });
        if (portrait) daubPath(ctx, [[W / 2, ny + nh + 16 * s], [W / 2, Lo.chips[6][1] - 14 * s]], K.beat(t, 4.95, 0.45, 'lin'), { seed: 49, width: 10 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'lin');
          const from = portrait ? [W / 2, cy - 14 * s] : [nx + nw + 20 * s, ny + nh / 2], to = portrait ? [left ? W * 0.455 : W * 0.545, cy - 14 * s] : [cx - 20 * s, cy - 13 * s];
          style.arrow(ctx, from, to, p, { seed: 50 + i, bend: portrait ? 0 : (i - 3) * 0.035, width: 9 });
          style.label(ctx, name, portrait ? (left ? W * 0.43 : W * 0.57) : cx, cy, K.beat(t, t0 + 0.24, 0.32, 'lin'), { size: portrait ? 40 : 38, align: portrait ? (left ? 'right' : 'left') : 'left', seed: 60 + i, cols: i % 2 ? YEL : [OIL.cream, OIL.chrome, OIL.cream, '#fff2c8'] });
        });
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.25 : 125 * s;
        style.box(ctx, W / 2 - nw / 2, top - nh / 2, nw, nh, 1, { seed: 41, cols: VER });
        style.title(ctx, 'Creator OS', W / 2, top + 18 * s, 1, { size: 52, align: 'center', seed: 7 });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t >= 8.55) style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 104 : 112 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 64 * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', size: 46, cols: [OIL.cream, OIL.pale, OIL.cream] });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 36 * s, (portrait ? 236 : 262) * s, K.beat(t, 10.0, 0.55, 'lin'), { t });
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.95, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, W / 2, (portrait ? H * 0.74 : 638 * s) + i * 88 * s, K.clamp(tp * tk.length - i), { size: portrait ? 66 : 58, align: 'center', seed: 80 + i }));
      }
      ctx.restore();
      if (t > 7.3 && t < 8.7) style.transition(ctx, W, H, K.clamp((t - 7.3) / 1.4), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('space', 0, 12, 1); k.play('swell', 0, { dur: 3, chord: ['C3', 'G3', 'E4'], gain: 1 });
      k.play('scribble', 0.15, { medium: 'brush', dur: 1.5, gain: 1.4 });
      k.play('scribble', 2.0, { medium: 'brush', dur: 0.9, gain: 1.4 }); k.play('scribble', 2.6, { medium: 'brush', dur: 0.4, gain: 1.2 });
      k.play('scribble', 3.45, { medium: 'brush', dur: 0.55, gain: 1.2 }); k.play('pluck', 4.0, { note: 'G4', gain: 0.7 });
      k.play('scribble', 4.0, { medium: 'brush', dur: 0.9, gain: 1.4 });
      const notes = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'];
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'brush', dur: 0.3, gain: 1.1 }); k.play('pluck', 5.26 + i * 0.4, { note: notes[i], gain: 0.55 }); }
      k.play('whoosh', 7.3, { dur: 0.7, gain: 0.8 }); k.play('scribble', 7.3, { medium: 'spray', dur: 0.7 }); k.play('whoosh', 8.0, { dur: 0.7, gain: 0.6, up: false });
      k.play('count', 8.6, { dur: 1.4 }); k.play('thud', 10.0); k.play('scribble', 10.0, { medium: 'brush', dur: 0.55, gain: 1.3 });
      k.play('swell', 10.5, { dur: 1.5, chord: ['C4', 'E4', 'G4', 'B4'] }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
