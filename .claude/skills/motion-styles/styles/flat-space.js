// Flat-Vector Science (Popular Explainer Looks). Outline-free vector space illustration: navy-to-violet sky,
// multi-stop gradient shapes with flat crescent shadows and rim highlights, banded ringed planets, sparkles,
// soft radial glows, chunky dotted rounded arrows and a cute big-eyed robot as the Creator OS node.
(function () {
  const C = { navy: '#161b4f', indigo: '#2b2170', violet: '#5a2a8f', teal: '#38c6e0', tealD: '#1f8fb8', yellow: '#ffd23f', orange: '#ff8a3d', pink: '#ff5fa2', white: '#ffffff', ink: '#1b1f4a', sky: '#7fd8ff', mint: '#3ee0b0' };
  const FONT = 'Nunito';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;

  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }
  // 4-point sparkle star
  function sparkle(ctx, x, y, r, a = 1, col = '#fff') {
    ctx.save(); ctx.globalAlpha *= a; ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i < 8; i++) { const ang = (i * Math.PI) / 4, rad = i % 2 ? r * 0.22 : r; ctx.lineTo(x + Math.cos(ang) * rad, y + Math.sin(ang) * rad); }
    ctx.closePath(); ctx.fill(); ctx.restore();
  }
  function glow(ctx, x, y, r, col, a) {
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, K.rgba(col, a)); g.addColorStop(1, K.rgba(col, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  // Banded planet with flat crescent shadow and rim highlight; optional ring drawn in two halves.
  function planet(ctx, x, y, r, cols, o = {}) {
    const ring = o.ring, tilt = o.tilt ?? -0.25;
    const ringHalf = (front) => {
      if (!ring) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(tilt);
      ctx.beginPath(); if (front) ctx.rect(-r * 3, 0, r * 6, r * 3); else ctx.rect(-r * 3, -r * 3, r * 6, r * 3); ctx.clip();
      [[2.15, ring[0], 0.16], [1.85, ring[1], 0.12], [1.6, ring[0], 0.07]].forEach(([k, c, w]) => {
        ctx.strokeStyle = c; ctx.lineWidth = r * w; ctx.beginPath(); ctx.ellipse(0, 0, r * k, r * k * 0.28, 0, 0, TAU); ctx.stroke();
      });
      ctx.restore();
    };
    ringHalf(false);
    ctx.save();
    ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.clip();
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r);
    g.addColorStop(0, cols[0]); g.addColorStop(0.55, cols[1]); g.addColorStop(1, cols[2]);
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    // bands
    ctx.translate(x, y); ctx.rotate(tilt);
    const bands = o.bands ?? 5;
    for (let i = 0; i < bands; i++) {
      const by = -r + ((i + 0.6) / bands) * r * 2, bh = r * (0.1 + ((i * 37) % 5) * 0.025);
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.10)';
      rr(ctx, -r * 1.2, by, r * 2.4, bh, bh / 2); ctx.fill();
    }
    ctx.rotate(-tilt); ctx.translate(-x, -y);
    // flat crescent shadow + rim highlight
    ctx.fillStyle = 'rgba(30,10,70,0.30)'; ctx.beginPath(); ctx.arc(x + r * 0.42, y + r * 0.38, r * 1.05, 0, TAU); ctx.arc(x, y, r * 2, 0, TAU, true); ctx.fill();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = r * 0.07; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(x, y, r * 0.86, Math.PI * 1.05, Math.PI * 1.45); ctx.stroke(); ctx.restore();
    ringHalf(true);
  }

  const style = {
    id: 'flat-space', name: 'Flat-Vector Science', family: 'Popular Explainer Looks',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Nunito:wght@700;800;900&display=block', specs: ['900 64px "Nunito"', '800 34px "Nunito"'] }],
    palette: { bg: C.navy, ...C },
    sfx: { draw: null, land: 'pop', emphasis: 'ding', transition: 'whoosh', bed: 'space' },

    background(ctx, W, H, t) {
      const s = S(W, H);
      const bg = K.cached(`fs-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(11);
        const g = x.createLinearGradient(0, 0, W * 0.6, H);
        g.addColorStop(0, '#121649'); g.addColorStop(0.45, '#2a1f6e'); g.addColorStop(0.8, '#4b2585'); g.addColorStop(1, '#5d2a8d');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        glow(x, W * 0.78, H * 0.3, Math.max(W, H) * 0.45, '#7a3cc8', 0.35);
        glow(x, W * 0.12, H * 0.85, Math.max(W, H) * 0.35, '#2e5bd8', 0.25);
        for (let i = 0; i < 220; i++) { x.fillStyle = `rgba(255,255,255,${r.range(0.15, 0.7)})`; x.beginPath(); x.arc(r() * W, r() * H, r.range(0.6, 1.8) * s, 0, TAU); x.fill(); }
        return c;
      });
      ctx.drawImage(bg, 0, 0);
      // twinkling sparkles
      const r = K.rng(5);
      for (let i = 0; i < 16; i++) { const x = r() * W, y = r() * H, ph = r() * TAU, sz = r.range(5, 10) * s; sparkle(ctx, x, y, sz, 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * 2.2 + ph))); }
      // parallax background planets drifting
      planet(ctx, W * 0.05 + t * 4 * s, H * 0.86, 34 * s, ['#ff9a5a', '#e8603a', '#b8402e'], { bands: 4 });
      planet(ctx, W * 0.92 - t * 3 * s, H * 0.12, 24 * s, ['#c9c3ff', '#9a8fe0', '#6f62c0'], { bands: 3 });
    },

    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.35, '#0a0b2a');
      K.grain(ctx, W, H, t, 0.03, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 64) * s;
      ctx.save(); ctx.font = K.font(size, FONT, 900); ctx.textBaseline = 'alphabetic';
      const words = text.split(' '), sp = ctx.measureText(' ').width, ws = words.map((w) => ctx.measureText(w).width);
      const total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
      let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
      const hi = o.highlight ?? -1;
      words.forEach((w, i) => {
        const wp = K.clamp(p * words.length - i), k = K.ease.back(wp);
        if (wp > 0) {
          ctx.save(); ctx.translate(cx + ws[i] / 2, y - size * 0.35); ctx.scale(k, k); ctx.globalAlpha = K.clamp(wp * 3);
          ctx.fillStyle = 'rgba(10,8,40,0.35)'; ctx.fillText(w, -ws[i] / 2 + 3 * s, size * 0.35 + 5 * s);
          ctx.fillStyle = i === hi || (hi === 'last' && i === words.length - 1) ? C.yellow : (o.color || C.white);
          ctx.fillText(w, -ws[i] / 2, size * 0.35); ctx.restore();
        }
        cx += ws[i] + sp;
      });
      ctx.restore();
      return { w: total, h: size };
    },

    // white speech-bubble pill with navy text, pops in with overshoot
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 32) * s;
      ctx.save(); ctx.font = K.font(size, FONT, 800);
      const tw = ctx.measureText(text).width, pw = tw + size * 0.9, ph = size * 1.45;
      const x0 = o.align === 'center' ? x - pw / 2 : o.align === 'right' ? x - pw : x;
      const k = K.ease.back(K.clamp(p));
      ctx.translate(x0 + pw / 2, y); ctx.scale(k, k);
      ctx.fillStyle = 'rgba(10,8,40,0.3)'; rr(ctx, -pw / 2 + 3 * s, -ph / 2 + 6 * s, pw, ph, ph / 2); ctx.fill();
      ctx.fillStyle = o.fill || C.white; rr(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fill();
      ctx.fillStyle = 'rgba(40,30,110,0.10)'; rr(ctx, -pw / 2, ph * 0.12, pw, ph * 0.38, ph * 0.19); ctx.fill();
      if (o.dot) { ctx.fillStyle = o.dot; ctx.beginPath(); ctx.arc(-pw / 2 - ph * 0.1, 0, ph * 0.32, 0, TAU); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.arc(-pw / 2 - ph * 0.2, -ph * 0.1, ph * 0.08, 0, TAU); ctx.fill(); }
      ctx.fillStyle = o.color || C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.04);
      ctx.restore();
      return { w: pw, h: ph };
    },

    // chunky dotted rounded curve; dots appear along the path, rounded arrowhead lands last
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.arcPts(from, to, o.bend ?? 0.2, 60), L = K.pathLen(pts);
      const gap = 16 * s, n = Math.floor(L / gap), shown = Math.floor(n * K.clamp(p / 0.9));
      ctx.save(); ctx.fillStyle = o.color || C.sky;
      let last = pts[0];
      for (let i = 0; i <= shown && i < n - 1; i++) { const q = K.trim(pts, i / n); last = q[q.length - 1]; ctx.beginPath(); ctx.arc(last[0], last[1], 4.2 * s, 0, TAU); ctx.fill(); }
      if (p > 0.9) {
        const hp = K.ease.back(K.clamp((p - 0.9) / 0.1)), b = pts[pts.length - 1], a = pts[pts.length - 6], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.scale(hp, hp);
        ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.lineTo(-14 * s, -11 * s); ctx.lineTo(-14 * s, 11 * s); ctx.closePath();
        ctx.lineJoin = 'round'; ctx.lineWidth = 6 * s; ctx.strokeStyle = o.color || C.sky; ctx.stroke(); ctx.fill();
      }
      ctx.restore();
      return last;
    },

    // glossy outline-free capsule: gradient body, flat crescent shadow, rim highlight, soft glow
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.back(K.clamp(p)), r = o.radius ?? Math.min(w, h) * 0.28;
      const cols = o.colors || [C.teal, '#2aa6d6', '#1d6fb8'];
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2);
      glow(ctx, w / 2, h / 2, Math.max(w, h) * 0.85, cols[0], 0.28);
      const g = ctx.createLinearGradient(0, 0, w * 0.4, h);
      g.addColorStop(0, cols[0]); g.addColorStop(0.6, cols[1]); g.addColorStop(1, cols[2]);
      rr(ctx, 0, 0, w, h, r); ctx.fillStyle = g; ctx.fill();
      ctx.save(); rr(ctx, 0, 0, w, h, r); ctx.clip();
      ctx.fillStyle = 'rgba(20,10,70,0.25)'; rr(ctx, w * 0.12, h * 0.22, w * 1.0, h * 1.0, r * 1.2); ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r * 0.8, 7 * s + 2); ctx.lineTo(w * 0.45, 7 * s + 2); ctx.stroke();
      ctx.restore();
    },

    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 120) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, FONT, 900); ctx.textAlign = o.align || 'center'; ctx.textBaseline = 'alphabetic';
      glow(ctx, x, y - size * 0.35, size * 2.2, C.orange, 0.18);
      ctx.fillStyle = 'rgba(20,8,60,0.45)'; ctx.fillText(txt, x + 4 * s, y + 8 * s);
      const g = ctx.createLinearGradient(0, y - size * 0.8, 0, y);
      g.addColorStop(0, '#fff1a8'); g.addColorStop(0.45, C.yellow); g.addColorStop(1, C.orange);
      ctx.fillStyle = g; ctx.fillText(txt, x, y);
      ctx.restore();
    },

    // pulsing glow ring + burst of sparkles
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p));
      ctx.save();
      ctx.globalAlpha = 1 - k * 0.6; ctx.strokeStyle = o.color || C.yellow; ctx.lineWidth = 12 * s * (1 - k * 0.4);
      ctx.beginPath(); ctx.arc(x, y, r * (0.7 + k * 0.45), 0, TAU); ctx.stroke(); ctx.globalAlpha = 1;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * TAU + 0.3, d = r * (0.85 + k * 0.5), sz = (i % 2 ? 12 : 20) * s * Math.sin(Math.PI * K.clamp(p * 1.2));
        sparkle(ctx, x + Math.cos(a) * d * 1.25, y + Math.sin(a) * d * 0.75, Math.max(0, sz), 1, i % 3 ? C.yellow : C.white);
      }
      ctx.restore();
    },

    // a foreground ringed planet sweeps across and fills the frame (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const R = Math.hypot(W, H) * 0.62, x = K.lerp(-R * 1.2, W + R * 1.2, K.ease.inOut(p)), y = H * 0.5 + (p - 0.5) * H * 0.3;
      planet(ctx, x, y, R, ['#ff8fc4', '#e2559c', '#9b2f86'], { ring: ['#f7b267', '#e07a3f'], tilt: -0.3, bands: 7 });
    },
  };

  // ---------- cute robot = the Creator OS node ----------
  function robot(ctx, cx, cy, r, t, o = {}) {
    const bob = Math.sin(t * 2.4) * r * 0.04, blink = (t % 3.1) > 2.95 ? 0.15 : 1;
    ctx.save(); ctx.translate(cx, cy + bob);
    glow(ctx, 0, 0, r * 2, C.teal, 0.25);
    // flame
    const fl = 0.85 + 0.15 * Math.sin(t * 20);
    const fg = ctx.createLinearGradient(0, r * 0.8, 0, r * 1.7);
    fg.addColorStop(0, C.yellow); fg.addColorStop(1, 'rgba(255,120,40,0)');
    ctx.fillStyle = fg; ctx.beginPath(); ctx.moveTo(-r * 0.22, r * 0.85); ctx.quadraticCurveTo(0, r * (1.2 + 0.5 * fl), r * 0.22, r * 0.85); ctx.fill();
    // antenna
    ctx.strokeStyle = '#9fe9ff'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(0, -r * 0.95); ctx.lineTo(0, -r * 1.22); ctx.stroke();
    ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(0, -r * 1.27, r * 0.1, 0, TAU); ctx.fill();
    // head sphere
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#8ff0ff'); g.addColorStop(0.5, C.teal); g.addColorStop(1, '#1b78b0');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill();
    ctx.save(); ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.clip();
    ctx.fillStyle = 'rgba(20,20,90,0.22)'; ctx.beginPath(); ctx.arc(r * 0.35, r * 0.35, r * 1.02, 0, TAU); ctx.arc(0, 0, r * 2, 0, TAU, true); ctx.fill();
    ctx.restore();
    ctx.strokeStyle = 'rgba(255,255,255,0.65)'; ctx.lineWidth = r * 0.07; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, r * 0.84, Math.PI * 1.1, Math.PI * 1.4); ctx.stroke();
    // visor
    ctx.fillStyle = '#18204f'; rr(ctx, -r * 0.68, -r * 0.42, r * 1.36, r * 0.72, r * 0.36); ctx.fill();
    for (const ex of [-0.3, 0.3]) {
      ctx.save(); ctx.translate(ex * r, -r * 0.06); ctx.scale(1, blink);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, r * 0.19, 0, TAU); ctx.fill();
      ctx.fillStyle = '#18204f'; ctx.beginPath(); ctx.arc(r * 0.02, r * 0.02, r * 0.11, 0, TAU); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-r * 0.04, -r * 0.05, r * 0.045, 0, TAU); ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.arc(0, r * 0.14, r * 0.12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.lineWidth = r * 0.05; ctx.strokeStyle = '#7fe0ff'; ctx.stroke();
    // cheek lights
    [[-0.22, C.pink], [0, C.yellow], [0.22, C.mint]].forEach(([dx, c]) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(dx * r, r * 0.55, r * 0.06, 0, TAU); ctx.fill(); });
    ctx.restore();
  }
  // video card as a floating screen gadget
  function videoCard(ctx, x, y, w, h, p, t, s) {
    style.box(ctx, x, y, w, h, p, { colors: ['#ff7ab6', '#e9508f', '#a8357c'], radius: 26 * s });
    if (p > 0.6) {
      const k = K.ease.back(K.clamp((p - 0.6) / 0.4)), cx = x + w / 2, cy = y + h / 2;
      ctx.save(); ctx.translate(cx, cy); ctx.scale(k, k);
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, h * 0.26, 0, TAU); ctx.fill();
      ctx.fillStyle = '#e9508f'; ctx.beginPath(); ctx.moveTo(-h * 0.07, -h * 0.12); ctx.lineTo(h * 0.13, 0); ctx.lineTo(-h * 0.07, h * 0.12); ctx.closePath(); ctx.fill();
      ctx.restore();
    }
  }

  // ---------- the shared demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const DOTS = ['#ff5fa2', '#3ee0d0', '#ff4b4b', '#e8e8f8', '#3b8cff', '#c9a7ff', '#4f7dff'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 108 * s], video: [90 * s, 300 * s, 240 * s, 150 * s], node: [600 * s, 380 * s, 92 * s],
      chips: PLATFORMS.map((n, i) => [1000 * s, (180 + i * 72) * s]), counter: [W / 2, 430 * s], take: [W / 2, 640 * s], top: [W / 2, 175 * s, 66 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.28, H * 0.16, W * 0.44, H * 0.11], node: [W / 2, H * 0.41, 70 * s],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.6 + Math.floor(i / 2) * 0.072)]), counter: [W / 2, H * 0.52], take: [W / 2, H * 0.76], top: [W / 2, H * 0.27, 70 * s] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      if (t < 8.4) {
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.2, 1.4, 'lin'), { size: P ? 46 : 62, align: 'center', highlight: 'last' });
        const [vx, vy, vw, vh] = Lo.video;
        videoCard(ctx, vx, vy + Math.sin(t * 1.8) * 4 * s, vw, vh, K.beat(t, 2.0, 0.7, 'lin'), t, s);
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 44 * s, K.beat(t, 2.7, 0.4, 'lin'), { align: 'center', size: 30 });
        const [nx, ny, nr] = Lo.node;
        const a1 = P ? [[W / 2, vy + vh + 90 * s], [W / 2, ny - nr * 1.75]] : [[vx + vw + 16 * s, vy + vh / 2], [nx - nr * 1.25, ny - 10 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.9, 'lin'), { bend: P ? 0.12 : -0.12, color: C.sky });
        const rp = K.beat(t, 4.0, 0.6, 'back');
        if (rp > 0) { ctx.save(); ctx.translate(nx, ny); ctx.scale(rp, rp); robot(ctx, 0, 0, nr, t); ctx.restore(); }
        style.label(ctx, 'Creator OS', nx, ny + nr * 1.85, K.beat(t, 4.4, 0.4, 'lin'), { align: 'center', size: 32, fill: C.yellow });
        if (P) {
          const yl = Lo.chips[6][1];
          style.arrow(ctx, [W / 2, ny + nr * 2.5], [W / 2, yl + 6 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0.01, color: C.sky });
        }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy] : [nx + nr * 1.25, ny];
          const to = P ? [left ? W * 0.47 : W * 0.53, cy] : [cx - 34 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, color: DOTS[i] });
          style.label(ctx, name, P ? (left ? W * 0.43 : W * 0.57) : cx, cy, K.beat(t, t0 + 0.28, 0.3, 'lin'), { size: P ? 30 : 32, align: P ? (left ? 'right' : 'left') : 'left', dot: P ? null : DOTS[i] });
        });
      } else {
        const [tx, ty, tr] = Lo.top;
        robot(ctx, tx, ty, tr, t);
        const v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 92 : 124 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 58 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 32 });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 40 * s, (P ? 230 : 250) * s, K.beat(t, 10.0, 0.8, 'lin'));
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: P ? 44 : 58, align: 'center', highlight: 'last' });
      }
      if (t > 7.6 && t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.6));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('space', 0, 12, 1);
      k.play('swell', 0.1, { dur: 1.6, chord: ['C4', 'E4', 'G4'] });
      [0.2, 0.55, 0.9, 1.25].forEach((x, i) => k.play('pop', x, { pitch: 1 + i * 0.08, gain: 0.7 }));
      k.play('pop', 2.0); k.play('pop', 2.75, { pitch: 1.2 });
      for (let i = 0; i < 6; i++) k.play('blip', 3.3 + i * 0.15, { note: ['C6', 'D6', 'E6', 'G6', 'A6', 'C7'][i], gain: 0.5 });
      k.play('pop', 4.0, { pitch: 0.8 }); k.play('pop', 4.45, { pitch: 1.1 });
      for (let i = 0; i < 7; i++) k.play('pop', 5.28 + i * 0.4, { pitch: 1 + i * 0.07 });
      k.play('whoosh', 7.7, { dur: 1.3 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('ding', 10.0);
      [0.0, 0.3, 0.6].forEach((d) => k.play('pop', 10.5 + d, { pitch: 1.3 + d }));
      k.play('chime', 11.3, { note: 'C6' });
    },
  };
  MS.register(style);
})();
