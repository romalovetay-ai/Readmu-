// Kawaii Anime (Popular Explainer Looks). Flat 2D kawaii illustration: strawberry-milk pink, mint, butter, lavender
// and sky shapes with soft plum outlines of even weight, one cel-shadow tone and a small highlight, big glossy anime
// eyes with blush marks, polka dots, clouds and twinkling sparkles. Everything pops on twos with squash and stretch,
// scenes change through star and heart iris wipes.
(function () {
  const C = { bg: '#ffe3ec', dot: '#ffd0de', pink: '#ff8fb5', pinkD: '#f06c9b', mint: '#9eecd0', butter: '#ffe79a', lav: '#cdb6ff', sky: '#a9dcff', plum: '#5d3a5f', white: '#ffffff', cream: '#fff7f0', blush: '#ff9bb8' };
  const HEAD = 'Mochiy Pop One', BODY = 'Fredoka';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  const twos = (t) => Math.floor(t * 12) / 12;
  const shade = (col, k) => { const [r, g, b] = K.hex(col); return `rgb(${r * k | 0},${g * k | 0},${b * k | 0})`; };
  // squash-and-stretch pop: returns [sx, sy] for progress p (overshoot then settle)
  function squash(p) { if (p <= 0) return [0, 0]; if (p >= 1) return [1, 1]; const k = K.ease.elastic(p), st = Math.sin(p * Math.PI * 2) * (1 - p) * 0.35; return [k * (1 + st), k * (1 - st)]; }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }
  function star(ctx, x, y, r, pts = 5, inner = 0.48, rot = -Math.PI / 2) { ctx.beginPath(); for (let i = 0; i < pts * 2; i++) { const a = rot + (i * Math.PI) / pts, rad = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } ctx.closePath(); }
  function heart(ctx, x, y, r) { ctx.beginPath(); ctx.moveTo(x, y + r * 0.9); ctx.bezierCurveTo(x - r * 1.5, y - r * 0.1, x - r * 0.7, y - r * 1.2, x, y - r * 0.45); ctx.bezierCurveTo(x + r * 0.7, y - r * 1.2, x + r * 1.5, y - r * 0.1, x, y + r * 0.9); ctx.closePath(); }
  function sparkle(ctx, x, y, r, col) { ctx.beginPath(); for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4, rad = i % 2 ? r * 0.25 : r; ctx.lineTo(x + Math.cos(a) * rad, y + Math.sin(a) * rad); } ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
  // flat fill + one cel shadow tone (clipped crescent) + small highlight + even plum outline
  function cel(ctx, path, col, s, o = {}) {
    const sx = o.sx ?? 10 * s, sy = o.sy ?? 10 * s;
    path(); ctx.fillStyle = shade(col, 0.86); ctx.fill();
    ctx.save(); path(); ctx.clip(); ctx.translate(-sx, -sy); path(); ctx.fillStyle = col; ctx.fill(); ctx.restore();
    path(); ctx.strokeStyle = C.plum; ctx.lineWidth = (o.lw || 4.5) * s; ctx.lineJoin = 'round'; ctx.stroke();
  }

  const style = {
    id: 'kawaii', name: 'Kawaii Anime', family: 'Popular Explainer Looks',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Mochiy+Pop+One&family=Fredoka:wght@500;600;700&display=block', specs: ['400 60px "Mochiy Pop One"', '600 32px "Fredoka"'] }],
    palette: C,
    sfx: { draw: null, land: 'pop', emphasis: 'ding', transition: 'whoosh', bed: 'room' },

    background(ctx, W, H, t) {
      const bg = K.cached(`kw-bg:${W}x${H}`, () => {
        const s = S(W, H), c = K.layer(W, H), x = c.getContext('2d');
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#ffe8f0'); g.addColorStop(1, '#ffd9e6'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.fillStyle = C.dot; const st = 46 * s;
        for (let j = 0, y = st / 2; y < H; j++, y += st) for (let x0 = (j % 2 ? st / 2 : 0); x0 < W + st; x0 += st) { x.beginPath(); x.arc(x0, y, 6.5 * s, 0, TAU); x.fill(); }
        // soft clouds
        const r = K.rng(4); x.fillStyle = 'rgba(255,255,255,0.55)';
        for (let i = 0; i < 5; i++) { const cx = r() * W, cy = r() * H, sc = r.range(0.7, 1.3) * s; for (const [dx, dy, rad] of [[0, 0, 70], [70, -20, 60], [140, 5, 55], [60, 30, 65], [-60, 20, 50]]) { x.beginPath(); x.arc(cx + dx * sc, cy + dy * sc, rad * sc, 0, TAU); x.fill(); } }
        return c;
      });
      ctx.drawImage(bg, 0, 0);
      // twinkling sparkles + floating hearts, on twos
      const s = S(W, H), tq = twos(t), r = K.rng(8);
      for (let i = 0; i < 12; i++) { const x = r() * W, y = r() * H, ph = r() * TAU, k = 0.5 + 0.5 * Math.sin(tq * 3 + ph); sparkle(ctx, x, y, (6 + 7 * k) * s, i % 3 ? '#fff' : C.butter); }
      for (let i = 0; i < 5; i++) { const x = r() * W, y = (r() * H - tq * 20 * s + H) % H; heart(ctx, x, y, 9 * s); ctx.fillStyle = 'rgba(255,143,181,0.6)'; ctx.fill(); }
    },
    finish(ctx, W, H, t) {
      // soft pastel bloom at the top, gentle edge tint, very fine print grain
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.4); g.addColorStop(0, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.4);
      K.vignette(ctx, W, H, 0.16, '#d4709a');
      K.grain(ctx, W, H, twos(t), 0.025, 12, 'soft-light');
    },

    // chunky white letters with a thick pink outline and a plum drop, letters pop in on twos
    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 60) * s, q = twos(p * 1.0);
      ctx.save(); ctx.font = K.font(size, HEAD, 400); ctx.lineJoin = 'round';
      const gap = size * 0.05, adv = (i) => ctx.measureText(text[i]).width + (text[i] === ' ' ? size * 0.22 : gap);
      let total = 0; for (let i = 0; i < text.length; i++) total += adv(i);
      let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i], cw = adv(i);
        const lp = K.clamp((p * (text.length + 6) - i) / 6), [sx, sy] = squash(Math.floor(lp * 8) / 8);
        if (sx > 0 && ch !== ' ') {
          ctx.save(); ctx.translate(cx + cw / 2, y); ctx.scale(sx, sy); ctx.rotate(Math.sin(i * 1.7) * 0.05);
          ctx.strokeStyle = C.plum; ctx.lineWidth = size * 0.2; ctx.strokeText(ch, -cw / 2 + 3 * s, 5 * s);
          ctx.strokeStyle = o.outline || C.pinkD; ctx.lineWidth = size * 0.17; ctx.strokeText(ch, -cw / 2, 0);
          ctx.fillStyle = o.color || C.white; ctx.fillText(ch, -cw / 2, 0);
          ctx.restore();
        }
        cx += cw;
      }
      ctx.restore(); return { w: total, h: size };
    },

    // pastel pill with plum outline, cel shade and highlight dot; squash-and-stretch pop
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 30) * s, [sx, sy] = squash(Math.floor(K.clamp(p) * 8) / 8);
      ctx.save(); ctx.font = K.font(size, BODY, 600);
      const tw = ctx.measureText(text).width, ph = size * 1.55, pw = tw + size * (o.icon ? 2.0 : 1.1);
      const x0 = o.align === 'center' ? x - pw / 2 : o.align === 'right' ? x - pw : x;
      ctx.translate(x0 + pw / 2, y + ph / 2); ctx.scale(sx, sy); ctx.translate(0, -ph / 2);
      cel(ctx, () => rr(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2), o.fill || C.white, s, { sx: 0, sy: 7 * s, lw: 4 });
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-pw / 2 + ph * 0.45, -ph * 0.22, ph * 0.12, ph * 0.07, -0.4, 0, TAU); ctx.fill();
      if (o.icon) { ctx.beginPath(); ctx.arc(-pw / 2 + ph * 0.55, 0, ph * 0.26, 0, TAU); ctx.fillStyle = o.icon; ctx.fill(); ctx.strokeStyle = C.plum; ctx.lineWidth = 3 * s; ctx.stroke(); }
      ctx.fillStyle = C.plum; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(text, o.icon ? ph * 0.3 : 0, size * 0.04);
      ctx.restore(); return { w: pw, h: ph };
    },

    // dotted candy arrow: alternating pink/mint dots that hop on, finished with a heart
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.arcPts(from, to, o.bend ?? 0.18, 60), L = K.pathLen(pts), n = Math.max(2, Math.floor(L / (19 * s)));
      const shown = Math.floor(n * K.clamp(Math.floor(p * 10) / 10 / 0.85)); let last = null;
      ctx.save();
      for (let i = 0; i < Math.min(shown, n - 1); i++) {
        const q = K.trim(pts, i / n); last = q[q.length - 1];
        ctx.beginPath(); ctx.arc(last[0], last[1], 5.5 * s, 0, TAU); ctx.fillStyle = (i + (o.seed || 0)) % 2 ? (o.c2 || C.mint) : (o.color || C.pink); ctx.fill(); ctx.strokeStyle = C.plum; ctx.lineWidth = 2.2 * s; ctx.stroke();
      }
      if (p > 0.85) {
        const b = pts[pts.length - 1], [sx] = squash(K.clamp((p - 0.85) / 0.15));
        ctx.translate(b[0], b[1]); ctx.scale(sx, sx); heart(ctx, 0, 0, 11 * s); ctx.fillStyle = o.color || C.pink; ctx.fill(); ctx.strokeStyle = C.plum; ctx.lineWidth = 3 * s; ctx.stroke();
      }
      ctx.restore(); return last;
    },

    // chunky rounded pastel card with plum outline, cel shade and highlight
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), [sx, sy] = squash(Math.floor(K.clamp(p) * 8) / 8), r = o.radius ?? Math.min(w, h) * 0.25;
      ctx.save(); ctx.translate(x + w / 2, y + h); ctx.scale(sx, sy); ctx.translate(-w / 2, -h);
      ctx.fillStyle = 'rgba(160,80,120,0.16)'; ctx.beginPath(); ctx.ellipse(w / 2, h + 10 * s, w * 0.48, 12 * s, 0, 0, TAU); ctx.fill();
      cel(ctx, () => rr(ctx, 0, 0, w, h, r), o.color || C.lav, s);
      ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.beginPath(); ctx.ellipse(r * 0.8, r * 0.55, r * 0.22, r * 0.12, -0.6, 0, TAU); ctx.fill();
      ctx.restore();
    },

    // bouncing outlined numerals: digits hop in sequence
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 110) * s, txt = K.fmt(value), t = o.t ?? 0;
      ctx.save(); ctx.font = K.font(size, HEAD, 400); ctx.lineJoin = 'round';
      const tot = ctx.measureText(txt).width; let cx = x - tot / 2;
      for (let i = 0; i < txt.length; i++) {
        const ch = txt[i], cw = ctx.measureText(txt.slice(0, i + 1)).width - ctx.measureText(txt.slice(0, i)).width;
        const hop = Math.abs(Math.sin(twos(t) * 5 - i * 0.6)) * 10 * s * (o.bounce ?? 1);
        ctx.strokeStyle = C.plum; ctx.lineWidth = size * 0.2; ctx.strokeText(ch, cx + 4 * s, y - hop + 6 * s);
        ctx.strokeStyle = C.pinkD; ctx.lineWidth = size * 0.16; ctx.strokeText(ch, cx, y - hop);
        ctx.fillStyle = i % 4 === 1 ? C.butter : C.white; ctx.fillText(ch, cx, y - hop);
        cx += cw;
      }
      ctx.restore();
    },

    // star-and-heart confetti burst with sparkles
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), q = Math.floor(K.clamp(p) * 10) / 10, k = K.ease.out(q), rnd = K.rng(o.seed || 3);
      ctx.save();
      for (let i = 0; i < 18; i++) {
        const a = rnd() * TAU, d = r * (0.55 + rnd() * 0.6) * k, px = x + Math.cos(a) * d, py = y + Math.sin(a) * d * 0.7 + q * q * 20 * s, sz = (10 + rnd() * 10) * s * (1 - q * 0.3);
        ctx.save(); ctx.translate(px, py); ctx.rotate(rnd() * TAU + q * 3);
        if (i % 3 === 0) heart(ctx, 0, 0, sz * 0.8); else star(ctx, 0, 0, sz);
        ctx.fillStyle = [C.pink, C.butter, C.mint, C.lav, C.sky][i % 5]; ctx.fill(); ctx.strokeStyle = C.plum; ctx.lineWidth = 2.5 * s; ctx.stroke(); ctx.restore();
      }
      for (let i = 0; i < 4; i++) { const a = i * 1.6 + 0.4; sparkle(ctx, x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 0.6, 18 * s * Math.sin(Math.PI * K.clamp(p * 1.5)), '#fff'); }
      ctx.restore();
    },

    // star iris closes to a point, then a heart iris opens the next scene (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const R = Math.hypot(W, H) * 0.75, cx = W / 2, cy = H / 2, q = twos(p * 1.3) / 1.3;
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H);
      if (q < 0.5) { const r = R * (1 - q * 2); if (r > 1) { const rot = q * 2; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + rot + (i * Math.PI) / 5, rad = i % 2 ? r * 0.48 : r; i ? ctx.lineTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad) : ctx.moveTo(cx + Math.cos(a) * rad, cy + Math.sin(a) * rad); } ctx.closePath(); } }
      else { const r = R * (q - 0.5) * 2 * 0.9; if (r > 1) { ctx.moveTo(cx, cy + r * 0.9); ctx.bezierCurveTo(cx + r * 1.5, cy - r * 0.1, cx + r * 0.7, cy - r * 1.2, cx, cy - r * 0.45); ctx.bezierCurveTo(cx - r * 0.7, cy - r * 1.2, cx - r * 1.5, cy - r * 0.1, cx, cy + r * 0.9); ctx.closePath(); } }
      ctx.fillStyle = C.pink; ctx.fill('evenodd');
      ctx.restore();
    },
  };

  // ---------- characters ----------
  function animeEye(ctx, x, y, r, s, blink, iris = '#7a5bd6') {
    ctx.save(); ctx.translate(x, y); ctx.scale(1, blink);
    ctx.beginPath(); ctx.ellipse(0, 0, r * 0.8, r, 0, 0, TAU); ctx.fillStyle = '#fff'; ctx.fill(); ctx.strokeStyle = C.plum; ctx.lineWidth = 3.5 * s; ctx.stroke();
    const g = ctx.createLinearGradient(0, -r, 0, r); g.addColorStop(0, '#3a2366'); g.addColorStop(0.6, iris); g.addColorStop(1, '#c8b4ff');
    ctx.beginPath(); ctx.ellipse(0, r * 0.08, r * 0.62, r * 0.84, 0, 0, TAU); ctx.fillStyle = g; ctx.fill();
    ctx.beginPath(); ctx.ellipse(0, r * 0.12, r * 0.3, r * 0.42, 0, 0, TAU); ctx.fillStyle = '#2a1745'; ctx.fill();
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-r * 0.22, -r * 0.35, r * 0.24, r * 0.3, -0.3, 0, TAU); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.25, r * 0.38, r * 0.11, 0, TAU); ctx.fill();
    ctx.restore();
    // lash line
    ctx.strokeStyle = C.plum; ctx.lineWidth = 5 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.ellipse(x, y, r * 0.86, r * 1.06 * blink, 0, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke();
  }
  function mascot(ctx, cx, cy, r, t, s, mood = 0) {
    const tq = twos(t), bob = Math.sin(tq * 3) * r * 0.05, blink = (tq % 2.7) > 2.55 ? 0.12 : 1;
    ctx.save(); ctx.translate(cx, cy + bob); ctx.rotate(Math.sin(tq * 2.2) * 0.03);
    ctx.fillStyle = 'rgba(160,80,120,0.16)'; ctx.beginPath(); ctx.ellipse(0, r * 1.75 - bob, r * 0.9, r * 0.14, 0, 0, TAU); ctx.fill();
    // body
    cel(ctx, () => rr(ctx, -r * 0.62, r * 0.75, r * 1.24, r * 0.85, r * 0.35), C.pink, s);
    cel(ctx, () => rr(ctx, -r * 0.36, r * 0.92, r * 0.72, r * 0.42, r * 0.14), C.mint, s, { sx: 0, sy: 5 * s, lw: 3.5 });
    [[-0.18, C.butter], [0.05, C.sky], [0.27, C.lav]].forEach(([dx, c]) => { ctx.beginPath(); ctx.arc(dx * r, r * 1.13, r * 0.08, 0, TAU); ctx.fillStyle = c; ctx.fill(); ctx.strokeStyle = C.plum; ctx.lineWidth = 2.5 * s; ctx.stroke(); });
    // ears
    for (const sx of [-1, 1]) cel(ctx, () => { ctx.beginPath(); ctx.ellipse(sx * r * 0.98, 0, r * 0.2, r * 0.3, 0, 0, TAU); }, C.pink, s, { sx: 4 * s, sy: 4 * s });
    // antenna + heart
    ctx.strokeStyle = C.plum; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(0, -r * 0.9); ctx.lineTo(0, -r * 1.22); ctx.stroke();
    heart(ctx, 0, -r * 1.32, r * 0.17); ctx.fillStyle = C.pinkD; ctx.fill(); ctx.stroke();
    // head
    cel(ctx, () => { ctx.beginPath(); ctx.ellipse(0, 0, r * 0.98, r * 0.88, 0, 0, TAU); }, C.cream, s, { sx: 12 * s, sy: 10 * s });
    if (mood === 1) { // star eyes
      for (const ex of [-0.38, 0.38]) { star(ctx, ex * r, r * 0.02, r * 0.3, 5, 0.5); ctx.fillStyle = C.butter; ctx.fill(); ctx.strokeStyle = C.plum; ctx.lineWidth = 3.5 * s; ctx.stroke(); }
    } else for (const ex of [-0.38, 0.38]) animeEye(ctx, ex * r, r * 0.02, r * 0.3, s, blink);
    ctx.fillStyle = 'rgba(255,140,170,0.55)'; for (const ex of [-0.66, 0.66]) { ctx.beginPath(); ctx.ellipse(ex * r, r * 0.38, r * 0.14, r * 0.08, 0, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = C.plum; ctx.lineWidth = 3.5 * s; ctx.beginPath(); ctx.arc(0, r * 0.4, r * 0.1, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    ctx.restore();
  }
  function tvBuddy(ctx, x, y, w, h, p, t, s) {
    style.box(ctx, x, y, w, h, p, { color: C.sky, radius: 26 * s });
    if (p < 0.6) return;
    const tq = twos(t);
    ctx.save(); rr(ctx, x + w * 0.12, y + h * 0.16, w * 0.76, h * 0.62, 16 * s); ctx.fillStyle = C.cream; ctx.fill(); ctx.strokeStyle = C.plum; ctx.lineWidth = 3.5 * s; ctx.stroke();
    const cx = x + w / 2, cy = y + h * 0.47; ctx.beginPath(); ctx.moveTo(cx - 14 * s, cy - 18 * s); ctx.lineTo(cx + 20 * s, cy); ctx.lineTo(cx - 14 * s, cy + 18 * s); ctx.closePath(); ctx.fillStyle = C.pinkD; ctx.fill(); ctx.strokeStyle = C.plum; ctx.stroke();
    // little feet + antenna sparkle
    for (const fx of [0.3, 0.7]) { rr(ctx, x + w * fx - 12 * s, y + h - 2 * s, 24 * s, 14 * s, 7 * s); ctx.fillStyle = C.lav; ctx.fill(); ctx.stroke(); }
    sparkle(ctx, x + w * 0.92, y - 6 * s, (8 + 4 * Math.sin(tq * 6)) * s, C.butter);
    ctx.restore();
  }

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const ICON = [C.pink, C.mint, '#ff7a8a', C.lav, C.sky, C.butter, '#8fb8ff'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 110 * s], video: [90 * s, 290 * s, 220 * s, 150 * s], node: [600 * s, 330 * s, 95 * s],
      chips: PLATFORMS.map((n, i) => [960 * s, (180 + i * 70) * s]), counter: [W / 2 + 120 * s, 400 * s], take: [W / 2, 640 * s], top: [260 * s, 330 * s, 100 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.31, H * 0.13, W * 0.38, H * 0.09], node: [W / 2, H * 0.42, 80 * s],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.62 + Math.floor(i / 2) * 0.07)]), counter: [W / 2, H * 0.58], take: [W / 2, H * 0.78], top: [W / 2, H * 0.28, 95 * s] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, tq = twos(t);
      style.background(ctx, W, H, t);
      if (t < 8.3) {
        style.title(ctx, 'One video. Every platform!', Lo.title[0], Lo.title[1], K.beat(tq, 0.15, 1.4, 'lin'), { size: P ? 40 : 54, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video;
        tvBuddy(ctx, vx, vy, vw, vh, K.beat(tq, 2.0, 0.6, 'lin'), t, s);
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 38 * s, K.beat(tq, 2.6, 0.4, 'lin'), { align: 'center', size: 28, fill: C.butter });
        const [nx, ny, nr] = Lo.node;
        const a1 = P ? [[W / 2, vy + vh + 100 * s], [W / 2, ny - nr * 1.6]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - nr * 1.3, ny]];
        style.arrow(ctx, a1[0], a1[1], K.beat(tq, 3.3, 0.7, 'lin'), { bend: P ? 0 : -0.15 });
        const mp = K.beat(tq, 4.0, 0.7, 'lin');
        if (mp > 0) { const [sx, sy] = squash(mp); ctx.save(); ctx.translate(nx, ny + nr * 1.7); ctx.scale(sx, sy); ctx.translate(-nx, -ny - nr * 1.7); mascot(ctx, nx, ny, nr, t, s); ctx.restore(); }
        style.label(ctx, 'Creator OS', nx, ny + nr * 1.85, K.beat(tq, 4.5, 0.4, 'lin'), { align: 'center', size: 30, fill: C.lav });
        if (P) style.arrow(ctx, [W / 2, ny + nr * 2.75], [W / 2, Lo.chips[6][1] + 20 * s], K.beat(tq, 4.9, 0.5, 'lin'), { bend: 0 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy + 22 * s] : [nx + nr * 1.25, ny + 10 * s], to = P ? [left ? W * 0.46 : W * 0.54, cy + 22 * s] : [cx - 22 * s, cy + 22 * s];
          style.arrow(ctx, from, to, K.beat(tq, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.04, seed: i, color: ICON[i] === C.mint ? C.pink : ICON[i] });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(tq, t0 + 0.28, 0.35, 'lin'), { size: P ? 28 : 28, align: P ? (left ? 'right' : 'left') : 'left', icon: ICON[i] });
        });
      } else {
        const [tx, ty, tr] = Lo.top, happy = t > 10.0 ? 1 : 0;
        mascot(ctx, tx, ty, tr, t, s, happy);
        const v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 84 : 104, t, bounce: t < 10.1 ? 1 : 0.4 });
        style.label(ctx, 'views!', Lo.counter[0], Lo.counter[1] + 40 * s, K.beat(tq, 8.8, 0.4, 'lin'), { align: 'center', size: 30, fill: C.mint });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 40 * s, (P ? 330 : 360) * s, K.beat(t, 10.0, 0.9, 'lin'));
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1], K.beat(tq, 10.5, 0.5, 'lin'), { size: 50, align: 'center' }); style.title(ctx, 'Reach everywhere!', Lo.take[0], Lo.take[1] + 100 * s, K.beat(tq, 10.8, 0.6, 'lin'), { size: 50, align: 'center' }); }
        else style.title(ctx, 'Post once. Reach everywhere!', Lo.take[0], Lo.take[1], K.beat(tq, 10.5, 0.9, 'lin'), { size: 50, align: 'center' });
      }
      if (t > 7.6 && t < 9.0) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.4));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.8);
      for (let i = 0; i < 6; i++) k.play('pop', 0.2 + i * 0.22, { pitch: 1.1 + i * 0.1, gain: 0.7 });
      k.play('pop', 2.0, { pitch: 0.9 }); k.play('blip', 2.3, { note: 'A6' }); k.play('pop', 2.65, { pitch: 1.3 });
      for (let i = 0; i < 5; i++) k.play('blip', 3.3 + i * 0.14, { note: ['C6', 'E6', 'G6', 'C7', 'E7'][i], gain: 0.5 });
      k.play('pop', 4.0, { pitch: 0.7 }); k.play('pluck', 4.2, { note: 'E5' }); k.play('pop', 4.55, { pitch: 1.2 });
      for (let i = 0; i < 7; i++) { k.play('blip', 5.0 + i * 0.4, { note: 'G6', gain: 0.35 }); k.play('pop', 5.33 + i * 0.4, { pitch: 1 + i * 0.09 }); }
      k.play('whoosh', 7.6, { dur: 0.6 }); k.play('whoosh', 8.3, { dur: 0.6, up: false });
      k.play('count', 8.6, { dur: 1.5 }); k.play('ding', 10.0); [0, 0.12, 0.24].forEach((d, i) => k.play('pop', 10.05 + d, { pitch: 1.4 + i * 0.2 }));
      k.play('pluck', 10.5, { note: 'C5' }); k.play('pluck', 10.7, { note: 'E5' }); k.play('chime', 11.2, { note: 'G6' });
    },
  };
  MS.register(style);
})();
