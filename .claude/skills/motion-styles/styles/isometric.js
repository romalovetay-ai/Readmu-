// Isometric Pastel (Dimensional). True 30 degree projection on a floating tile: three-tone flat faces, long soft
// ground shadows, mint lollipop trees, tiny walkers for scale, white pin tags with a coral icon, dotted coral arcs
// carrying data cubes, and a pastel cube-wave scene change.
(function () {
  const P = { bg: '#f3f1fa', ink: '#2d3058', sub: '#6f6e98', coral: '#ff6b5b', mint: '#7fc8a8', blue: '#8e9bd0',
    lav: '#d8d4ea', side: '#b9b1dd', navy: '#4a5488', white: '#ffffff', floor: '#fbf9f6' };
  const FONT = 'Inter';
  const C = Math.cos(Math.PI / 6);
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  const VIOLET = [74, 70, 136];
  const shade = (col, k) => K.rgba(K.mix(col, VIOLET, k));
  // iso point: screen anchor (X, Y) is the ground point (0,0,0); x runs down-right, y down-left, z up.
  const ip = (X, Y, x, y, z) => [X + (x - y) * C, Y + (x + y) * 0.5 - z];
  const fill = (ctx, pts, col) => { K.poly(ctx, pts, true); ctx.fillStyle = col; ctx.fill(); };

  // Long soft shadow cast to the down-right along the ground (light from the back left).
  function longShadow(ctx, X, Y, a, b, h, k = 1.0, alpha = 0.16) {
    const A = a / 2, B = b / 2, L = h * k;
    const pts = [ip(X, Y, -A, -B, 0), ip(X, Y, A + L, -B, 0), ip(X, Y, A + L, B, 0), ip(X, Y, -A, B, 0)];
    const g0 = ip(X, Y, A, 0, 0), g1 = ip(X, Y, A + L, 0, 0);
    const g = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]);
    g.addColorStop(0, `rgba(84,72,160,${alpha})`); g.addColorStop(1, 'rgba(84,72,160,0)');
    fill(ctx, pts, g);
  }
  // A box: footprint a (along x) by b (along y), height h. Returns face helpers for decorating.
  function block(ctx, X, Y, a, b, h, col, o = {}) {
    const A = a / 2, B = b / 2, s = sOf(ctx), g = (x, y, z) => ip(X, Y, x, y, z);
    if (o.shadow !== false && h > 1) longShadow(ctx, X, Y, a, b, h, o.shadowK ?? 1.0, o.shadowA ?? 0.16);
    const left = [g(-A, B, 0), g(A, B, 0), g(A, B, h), g(-A, B, h)];
    const right = [g(A, -B, 0), g(A, B, 0), g(A, B, h), g(A, -B, h)];
    const top = [g(-A, -B, h), g(A, -B, h), g(A, B, h), g(-A, B, h)];
    fill(ctx, left, o.left || shade(col, 0.13));
    fill(ctx, right, o.right || shade(col, 0.27));
    fill(ctx, top, o.top || col);
    // soft ambient occlusion where the walls meet the ground
    if (h > 6 * s && o.ao !== false) {
      const p0 = g(-A, B, 0), p1 = g(-A, B, Math.min(h, 22 * s));
      const ao = ctx.createLinearGradient(p0[0], p0[1], p1[0], p1[1]);
      ao.addColorStop(0, 'rgba(60,50,130,0.18)'); ao.addColorStop(1, 'rgba(60,50,130,0)');
      fill(ctx, left, ao); fill(ctx, right, ao);
    }
    // crisp light edges on the top rim and the front vertical edge
    ctx.save(); ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 1.3 * s;
    K.poly(ctx, [g(-A, B, h), g(A, B, h), g(A, -B, h)]); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; K.poly(ctx, [g(A, B, 0), g(A, B, h)]); ctx.stroke();
    ctx.restore();
    // face mappers: u 0..1 along the face, v 0..1 up the face
    return {
      left: (u, v) => g(-A + u * a, B, v * h), right: (u, v) => g(A, B - u * b, v * h), top: (u, v) => g(-A + u * a, -B + v * b, h),
      g,
    };
  }
  // A quad on a face from (u0,v0) to (u1,v1).
  const quad = (f, u0, v0, u1, v1) => [f(u0, v0), f(u1, v0), f(u1, v1), f(u0, v1)];

  // Lollipop tree: trunk + faceted mint sphere.
  function tree(ctx, X, Y, r, s) {
    longShadow(ctx, X, Y, r * 1.2, r * 1.2, r * 2.6, 0.9, 0.12);
    ctx.fillStyle = '#b9a7a0'; ctx.fillRect(X - 2 * s, Y - r * 1.4, 4 * s, r * 1.4);
    const cy = Y - r * 2.1;
    ctx.fillStyle = P.mint; ctx.beginPath(); ctx.arc(X, cy, r, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(P.mint, 0.25); ctx.beginPath(); ctx.arc(X, cy, r, -Math.PI * 0.35, Math.PI * 0.65); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.beginPath(); ctx.arc(X - r * 0.35, cy - r * 0.35, r * 0.28, 0, Math.PI * 2); ctx.fill();
  }
  // Tiny person for scale, walking (bob from t).
  function person(ctx, X, Y, s, col, t, seed) {
    const bob = Math.abs(Math.sin(t * 7 + seed)) * 1.5 * s;
    ctx.fillStyle = 'rgba(84,72,160,0.18)'; ctx.beginPath(); ctx.ellipse(X + 6 * s, Y + 1 * s, 8 * s, 2.5 * s, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = P.ink; ctx.fillRect(X - 2.4 * s, Y - 8 * s - bob, 2 * s, 8 * s); ctx.fillRect(X + 0.6 * s, Y - 8 * s - bob, 2 * s, 8 * s);
    ctx.fillStyle = col; ctx.beginPath(); ctx.roundRect(X - 3.5 * s, Y - 18 * s - bob, 7 * s, 11 * s, 3 * s); ctx.fill();
    ctx.fillStyle = '#f2c4a8'; ctx.beginPath(); ctx.arc(X, Y - 21.5 * s - bob, 3.2 * s, 0, Math.PI * 2); ctx.fill();
  }

  // White pin tag with a coral icon square (the labelling device of the medium).
  function tag(ctx, text, x, y, p, o = {}) {
    const s = sOf(ctx), size = (o.size || 30) * s;
    const k = K.ease.back(K.clamp(p)); if (k <= 0.001) return { w: 0, h: 0 };
    ctx.save(); ctx.font = K.font(size, FONT, o.weight || 700);
    const tw = ctx.measureText(text).width, icon = size * 0.95, padX = size * 0.5, gap = size * 0.4;
    const w = padX + icon + gap + tw + padX, h = size * 1.75;
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - h / 2;
    ctx.translate(x0 + w / 2, y); ctx.scale(k, k); ctx.translate(-(x0 + w / 2), -y);
    ctx.globalAlpha = K.clamp(p * 3);
    ctx.fillStyle = 'rgba(70,60,150,0.13)'; ctx.beginPath(); ctx.roundRect(x0 + 3 * s, y0 + 7 * s, w, h, 10 * s); ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(x0, y0, w, h, 10 * s); ctx.fill();
    ctx.strokeStyle = 'rgba(140,130,200,0.35)'; ctx.lineWidth = 1 * s; ctx.stroke();
    const ic = o.color || P.coral;
    ctx.fillStyle = ic; ctx.beginPath(); ctx.roundRect(x0 + padX, y - icon / 2, icon, icon, 6 * s); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.9)'; ctx.beginPath(); ctx.roundRect(x0 + padX + icon * 0.28, y - icon * 0.22, icon * 0.44, icon * 0.44, 2 * s); ctx.fill();
    ctx.fillStyle = P.ink; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + padX + icon + gap, y + size * 0.04);
    ctx.restore();
    return { w, h, x0, y0 };
  }

  const style = {
    id: 'isometric', name: 'Isometric Pastel', family: 'Dimensional',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=block', specs: ['800 56px "Inter"', '700 30px "Inter"', '600 24px "Inter"'] }],
    palette: { ...P },
    sfx: { draw: null, land: 'pop', emphasis: 'ding', transition: 'whoosh', bed: 'room' },

    background(ctx, W, H, t) {
      const g = ctx.createLinearGradient(0, 0, W * 0.4, H);
      g.addColorStop(0, '#f8f6fb'); g.addColorStop(1, '#ebe8f5');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const glow = ctx.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.3, H * 0.15, Math.max(W, H) * 0.7);
      glow.addColorStop(0, 'rgba(255,250,244,0.8)'); glow.addColorStop(1, 'rgba(255,250,244,0)');
      ctx.fillStyle = glow; ctx.fillRect(0, 0, W, H);
      // tiny floating cubes drifting, as in the medium
      const s = S(W, H), r = K.rng(9);
      for (let i = 0; i < 7; i++) {
        const x = r.range(0.05, 0.95) * W, y = r.range(0.1, 0.95) * H + Math.sin(t * 0.9 + i) * 6 * s, sz = r.range(8, 16) * s;
        block(ctx, x, y, sz, sz, sz, '#f1eefa', { shadow: false, ao: false });
      }
    },

    finish(ctx, W, H, t) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, 'rgba(255,255,255,0.10)'); g.addColorStop(1, 'rgba(120,110,190,0.06)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      K.vignette(ctx, W, H, 0.10, '#6b63a8');
      K.grain(ctx, W, H, t, 0.03, 24, 'soft-light');
    },

    // Headline: Inter 800 navy with the short coral bar, words rise in on a soft overshoot.
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 56) * s, lines = String(text).split('\n'), lh = size * 1.1;
      ctx.save(); ctx.font = K.font(size, FONT, 800); ctx.textBaseline = 'alphabetic';
      const widths = lines.map((l) => ctx.measureText(l).width), w = Math.max(...widths);
      const words = []; lines.forEach((l, li) => { let cx = 0; for (const wd of l.split(' ')) { words.push({ wd, li, cx }); cx += ctx.measureText(wd + ' ').width; } });
      words.forEach((it, i) => {
        const q = K.clamp(p * (words.length + 2) - i), e = K.ease.back(K.clamp(q));
        if (q <= 0) return;
        const lw = widths[it.li], x0 = o.align === 'center' ? x - lw / 2 : o.align === 'right' ? x - lw : x;
        ctx.globalAlpha = K.clamp(q * 2); ctx.fillStyle = o.color || P.ink;
        ctx.fillText(it.wd, x0 + it.cx, y + it.li * lh + (1 - e) * 22 * s);
      });
      if (o.bar !== false) {
        const bw = 44 * s * K.ease.out(K.clamp(p * 2)), bx = o.align === 'center' ? x - bw / 2 : o.align === 'right' ? x - bw : x;
        ctx.globalAlpha = 1; ctx.fillStyle = P.coral; ctx.beginPath(); ctx.roundRect(bx, y - size * 1.12, bw, 6 * s, 3 * s); ctx.fill();
      }
      ctx.restore();
      return { w, h: lh * lines.length };
    },
    label(ctx, text, x, y, p, o = {}) { return tag(ctx, text, x, y, p, o); },

    // Dotted coral arc with a dot at each end; data cubes ride it once drawn.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? -0.18, 60), q = K.trim(pts, K.clamp(p));
      if (q.length < 2) return null;
      const col = o.color || P.coral;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = K.rgba(col, 0.9); ctx.lineWidth = 2.6 * s; ctx.setLineDash([2 * s, 8 * s]); ctx.lineDashOffset = -(o.t || 0) * 30 * s;
      K.poly(ctx, q); ctx.stroke(); ctx.setLineDash([]);
      ctx.fillStyle = col;
      const end = q[q.length - 1];
      ctx.beginPath(); ctx.arc(q[0][0], q[0][1], 4 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = K.rgba(col, 0.25); ctx.beginPath(); ctx.arc(end[0], end[1], 9 * s, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = col; ctx.beginPath(); ctx.arc(end[0], end[1], 4.5 * s, 0, Math.PI * 2); ctx.fill();
      // data cubes travelling along the finished arc
      if (p >= 1 && o.t != null) {
        for (let k = 0; k < 2; k++) {
          const u = ((o.t * 0.55 + k * 0.5 + (o.seed || 0) * 0.13) % 1), pt = K.trim(pts, u).pop(), c = 8 * s;
          block(ctx, pt[0], pt[1] + c * 0.5, c, c, c, k ? P.coral : '#ffd1c9', { shadow: false, ao: false });
        }
      }
      ctx.restore();
      return end;
    },

    // Container: a floating isometric slab whose top diamond spans the rect width, popping up on a spring.
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.ease.back(K.clamp(p)); if (k <= 0) return null;
      const span = w / C / 2, thick = (o.thick || 26) * s, X = x + w / 2, Y = y + h / 2 - thick / 2 + (1 - K.clamp(p)) * 40 * s;
      ctx.save(); ctx.globalAlpha = K.clamp(p * 3);
      ctx.fillStyle = 'rgba(84,72,160,0.10)'; ctx.beginPath(); ctx.ellipse(X + 20 * s, Y + span * 0.55 + 60 * s, span * 0.9, span * 0.28, 0, 0, Math.PI * 2); ctx.fill();
      const f = block(ctx, X, Y - span * 0 + thick, span * k, span * k, thick * k, o.color || P.floor, { shadow: false, left: shade(o.side || P.lav, 0.0), right: shade(o.side || P.lav, 0.12) });
      // faint floor tiles
      ctx.strokeStyle = 'rgba(150,140,200,0.18)'; ctx.lineWidth = 1 * s;
      for (let i = 1; i < 6; i++) { K.poly(ctx, [f.top(i / 6, 0), f.top(i / 6, 1)]); ctx.stroke(); K.poly(ctx, [f.top(0, i / 6), f.top(1, i / 6)]); ctx.stroke(); }
      ctx.restore();
      return f;
    },

    // Big number on an isometric billboard face (text sheared onto the plane).
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 104) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, FONT, 800);
      const w = ctx.measureText(txt).width;
      ctx.translate(x - (w * C) / 2, y - (w * 0.5) / 2);
      ctx.transform(C, 0.5, 0, 1, 0, 0);
      ctx.fillStyle = 'rgba(70,60,150,0.16)'; ctx.fillText(txt, 6 * s, 6 * s);
      ctx.fillStyle = o.color || P.ink; ctx.fillText(txt, 0, 0);
      ctx.restore();
      return { w: w * C, h: size };
    },

    // Isometric pulse rings on the ground plus coral sparkle ticks.
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), col = o.color || P.coral; if (p <= 0) return;
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const q = K.clamp(p * 1.4 - i * 0.18); if (q <= 0) continue;
        const rr = r * (0.55 + 0.6 * K.ease.out(q));
        ctx.globalAlpha = (1 - q) * 0.9 + (i === 0 ? 0.35 * q : 0);
        ctx.strokeStyle = col; ctx.lineWidth = (5 - i) * s;
        ctx.beginPath(); ctx.ellipse(x, y, rr, rr * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.globalAlpha = K.clamp(1.6 - p * 1.2);
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2, d0 = r * 0.7, d1 = r * (0.7 + 0.35 * K.ease.out(K.clamp(p * 1.5)));
        ctx.strokeStyle = i % 2 ? col : P.mint; ctx.lineWidth = 4 * s; ctx.lineCap = 'round';
        K.poly(ctx, [[x + Math.cos(a) * d0, y - r * 0.55 + Math.sin(a) * d0 * 0.5], [x + Math.cos(a) * d1, y - r * 0.55 + Math.sin(a) * d1 * 0.5]]); ctx.stroke();
      }
      ctx.restore();
    },

    // Scene change: a wave of pastel cubes pops up to tile the screen, then sinks away.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), D = 64 * s, cols = ['#ffffff', '#f4f1fb', '#ebe6f8', '#e2dcf4', '#f4f1fb'];
      const r = K.rng(31);
      const iMax = Math.ceil((W / C + H * 2) / D) + 2;
      const cells = [];
      for (let i = -2; i < iMax; i++) for (let j = -iMax; j < iMax; j++) {
        const X = (i - j) * D * C, Y = (i + j) * D * 0.5;
        if (X < -D * 2 || X > W + D * 2 || Y < -D * 2 || Y > H + D * 2) continue;
        cells.push([i + j, X, Y, r()]);
      }
      cells.sort((a, b) => a[0] - b[0]);
      for (const [, X, Y, rv] of cells) {
        const d = (X / W) * 0.6 + (Y / H) * 0.25 + rv * 0.08;
        const k = p < 0.5 ? K.ease.back(K.clamp((p * 2 - d * 0.75) / 0.3)) : 1 - K.ease.in(K.clamp(((p - 0.5) * 2 - d * 0.75) / 0.3));
        if (k <= 0.01) continue;
        const a = D * Math.min(1, k);
        const col = rv < 0.05 ? '#ffd8d2' : rv < 0.1 ? '#d7efe4' : cols[Math.floor(rv * 5)];
        block(ctx, X, Y + D * 0.5 + (1 - Math.min(1, k)) * 30 * s, a, a, D * 0.55 * k, col, { shadow: false, ao: false });
      }
    },
    block, tree, person,
  };

  // ---------- the shared demo: an isometric district wired to seven platform tags ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [P.coral, P.ink, P.coral, P.ink, P.blue, P.ink, P.blue];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, portrait: false, title: [W / 2, 104 * s], titleSize: 54, tileC: [395 * s, 455 * s], tileW: 560 * s,
      chips: PLATFORMS.map((n, i) => [905 * s, (196 + i * 72) * s]), chipSize: 28,
      tile2: [W / 2, 480 * s], tile2W: 780 * s, take: [W / 2, 100 * s] };
    return { s, portrait: true, title: [W / 2, H * 0.085], titleSize: 50, tileC: [W * 0.5, H * 0.4], tileW: W * 0.84,
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.53 : W * 0.47, H * (0.635 + Math.floor(i / 2) * 0.078)]), chipSize: 28,
      tile2: [W / 2, H * 0.5], tile2W: W * 0.94, take: [W / 2, H * 0.12] };
  }
  // The district on the tile: a video kiosk with a screen and the Creator OS server tower.
  function district(ctx, W, H, t, Lo, X, Y, span, opts) {
    const s = Lo.s, { videoP, hubP, showVideo } = opts, out = {};
    const ip0 = (x, y, z) => ip(X, Y, x, y, z), u = span / 560;
    // trees + walkers first (behind / beside)
    const trees = [[-170, -40], [-140, 70], [150, 110], [40, -170]];
    trees.forEach(([tx, ty], i) => { const pp = K.beat(t, 2.2 + i * 0.15, 0.5, 'back'); if (pp > 0) { const q = ip0(tx * u, ty * u, 0); tree(ctx, q[0], q[1], 14 * s * u * 1.6 * pp, s); } });
    if (showVideo) {
      const vk = K.ease.back(K.clamp(videoP));
      if (vk > 0.01) {
        const q = ip0(-95 * u, 70 * u, 0), a = 120 * u, b = 60 * u, h = 120 * u * vk;
        const f = block(ctx, q[0], q[1], a, b, h, '#f7f5ff');
        fill(ctx, quad(f.left, 0.08, 0.12, 0.92, 0.88), P.navy);
        fill(ctx, quad(f.left, 0.1, 0.16, 0.9, 0.84), '#5d68a4');
        if (videoP > 0.6) {
          const c = f.left(0.5, 0.5), tri = [f.left(0.42, 0.32), f.left(0.42, 0.68), f.left(0.62, 0.5)];
          fill(ctx, tri, P.coral); void c;
        }
        out.video = ip0(-95 * u, 70 * u, 120 * u);
      }
    }
    const hk = K.ease.back(K.clamp(hubP));
    if (hk > 0.01) {
      const q = ip0(85 * u, -60 * u, 0), a = 110 * u, b = 110 * u, h = 190 * u * hk;
      const f = block(ctx, q[0], q[1], a, b, h, '#ffffff', { left: '#e9e6f6', right: '#cdc6ea' });
      // server rack panels with blinking LEDs on the left face
      for (let i = 0; i < 3; i++) {
        const u0 = 0.08 + i * 0.3;
        fill(ctx, quad(f.left, u0, 0.08, u0 + 0.24, 0.8), P.navy);
        for (let j = 0; j < 6; j++) {
          const v = 0.14 + j * 0.105; fill(ctx, quad(f.left, u0 + 0.03, v, u0 + 0.21, v + 0.045), '#6c78b8');
          const on = Math.sin(t * 6 + i * 2.1 + j * 1.3) > 0.2;
          const d = f.left(u0 + 0.19, v + 0.022); ctx.fillStyle = on ? (j % 3 ? '#9ff0c8' : P.coral) : '#3c4577';
          ctx.beginPath(); ctx.arc(d[0], d[1], 1.8 * s, 0, Math.PI * 2); ctx.fill();
        }
      }
      // coral cooling stripe + roof fans
      fill(ctx, quad(f.right, 0, 0.86, 1, 0.93), P.coral); fill(ctx, quad(f.left, 0, 0.86, 1, 0.93), '#ff8a7a');
      for (let i = 0; i < 2; i++) {
        const c = f.top(0.3 + i * 0.4, 0.5); ctx.fillStyle = '#dcd7f0';
        ctx.beginPath(); ctx.ellipse(c[0], c[1], 16 * s * u * 1.4, 8 * s * u * 1.4, 0, 0, Math.PI * 2); ctx.fill();
        ctx.save(); ctx.translate(c[0], c[1]); ctx.scale(1, 0.5); ctx.rotate(t * 8 + i);
        ctx.strokeStyle = P.navy; ctx.lineWidth = 2.4 * s; for (let k = 0; k < 3; k++) { ctx.rotate((Math.PI * 2) / 3); K.poly(ctx, [[0, 0], [14 * s * u * 1.4, 0]]); ctx.stroke(); }
        ctx.restore();
      }
      out.hubTop = ip0(85 * u, -60 * u, 190 * u * hk);
      out.hubSide = f.right(0.5, 0.62);
      out.hubFace = f;
    }
    // walkers on the floor
    for (let i = 0; i < 3; i++) {
      const ph = ((t * 0.08 + i * 0.33) % 1), x = K.lerp(-200, 200, ph) * u, y = (i === 1 ? 160 : i === 2 ? -150 : 140) * u;
      const q = ip0(i === 2 ? y * 0.2 + x * 0.1 : x, i === 2 ? y : y, 0);
      if (K.clamp(hubP) > 0.5) person(ctx, q[0], q[1], s * 1.1, [P.coral, P.mint, P.blue][i], t, i);
    }
    return out;
  }
  function tile(ctx, X, Y, span, p, s) {
    const k = K.ease.back(K.clamp(p)); if (k <= 0) return;
    const a = span / C / 2, thick = 30 * s, rise = (1 - K.ease.out(K.clamp(p))) * 120 * s;
    ctx.save(); ctx.globalAlpha = K.clamp(p * 3);
    ctx.fillStyle = 'rgba(84,72,160,0.09)'; ctx.beginPath(); ctx.ellipse(X + 40 * s, Y + a * 0.5 + 90 * s, a * 0.95, a * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    const f = block(ctx, X, Y + thick + rise, a, a, thick, P.floor, { shadow: false, left: '#ddd7f1', right: '#c5bde6' });
    ctx.strokeStyle = 'rgba(150,140,200,0.16)'; ctx.lineWidth = 1 * s;
    for (let i = 1; i < 10; i++) { K.poly(ctx, [f.top(i / 10, 0), f.top(i / 10, 1)]); ctx.stroke(); K.poly(ctx, [f.top(0, i / 10), f.top(1, i / 10)]); ctx.stroke(); }
    // painted walkway
    ctx.setLineDash([10 * s, 8 * s]); ctx.strokeStyle = 'rgba(255,170,90,0.6)'; ctx.lineWidth = 2 * s;
    K.poly(ctx, [f.top(0.08, 0.55), f.top(0.92, 0.55)]); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
  }

  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait;
      style.background(ctx, W, H, t);
      const scene2 = t >= 8.25;
      if (!scene2) {
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.3, 'lin'), { align: 'center', size: Lo.titleSize });
        const [X, Y] = Lo.tileC, span = Lo.tileW;
        tile(ctx, X, Y, span, K.beat(t, 1.2, 0.8, 'lin'), s);
        const d = district(ctx, W, H, t, Lo, X, Y, span, { videoP: K.beat(t, 2.0, 0.7, 'lin'), hubP: K.beat(t, 4.0, 0.7, 'lin'), showVideo: true });
        if (d.video) style.label(ctx, 'your video', d.video[0], d.video[1] - 46 * s, K.beat(t, 2.9, 0.5, 'lin'), { align: 'center', color: P.coral, size: 28 });
        if (d.video && t > 3.3) {
          const from = [d.video[0] + 40 * s, d.video[1] - 10 * s], to = d.hubTop ? [d.hubTop[0] - 30 * s, d.hubTop[1] + 30 * s] : [from[0] + 160 * s, from[1] - 60 * s];
          style.arrow(ctx, from, to, K.beat(t, 3.4, 0.7, 'out'), { bend: -0.35, t, seed: 1 });
        }
        if (d.hubTop) style.label(ctx, 'Creator OS', d.hubTop[0], d.hubTop[1] - 50 * s, K.beat(t, 4.5, 0.5, 'lin'), { align: 'center', size: 40, color: P.navy });
        // fan out
        if (d.hubTop) {
          const src = portrait ? [d.hubTop[0], d.hubTop[1] + 260 * s * 0] : d.hubSide;
          PLATFORMS.forEach((name, i) => {
            const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
            let from, to, bend;
            if (portrait) { from = [W / 2, cy]; to = [left ? W * 0.47 - 4 * s : W * 0.53 + 4 * s, cy]; bend = 0; }
            else { from = [src[0] + 10 * s, src[1]]; to = [cx - 10 * s, cy]; bend = (i - 3) * -0.04; }
            const ap = K.beat(t, t0, 0.4, 'out');
            if (ap > 0) style.arrow(ctx, from, to, ap, { bend, t, seed: i + 2, color: P.coral });
            style.label(ctx, name, cx, cy, K.beat(t, t0 + 0.3, 0.35, 'lin'), { size: Lo.chipSize, color: COLS[i], align: portrait ? (left ? 'right' : 'left') : 'left' });
          });
          if (portrait) {
            // trunk from the tile down the gap between the tag columns
            const tp = K.beat(t, 4.9, 0.5, 'out');
            style.arrow(ctx, [W / 2, Y + span * 0.32], [W / 2, Lo.chips[6][1]], tp, { bend: 0, t });
          }
        }
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        const [X, Y] = Lo.tile2, span = Lo.tile2W;
        tile(ctx, X, Y, span, 1, s);
        const u = span / 560, A = span / C / 4, ip0 = (x, y, z) => ip(X, Y, x, y, z);
        // the tower, moved to the left corner of the bigger tile
        const hq = ip0(-0.62 * A, 0.55 * A, 0);
        const f = block(ctx, hq[0], hq[1], 84 * u, 84 * u, 120 * u, '#ffffff', { left: '#e9e6f6', right: '#cdc6ea' });
        fill(ctx, quad(f.right, 0, 0.86, 1, 0.93), P.coral); fill(ctx, quad(f.left, 0, 0.86, 1, 0.93), '#ff8a7a');
        for (let i = 0; i < 3; i++) fill(ctx, quad(f.left, 0.08 + i * 0.3, 0.1, 0.3 + i * 0.3, 0.78), P.navy);
        tree(ctx, ip0(-0.2 * A, 0.8 * A, 0)[0], ip0(-0.2 * A, 0.8 * A, 0)[1], 16 * s, s);
        const ht = ip0(-0.62 * A, 0.55 * A, 120 * u);
        style.label(ctx, 'Creator OS', ht[0], ht[1] - 40 * s, 1, { align: 'center', size: 34, color: P.navy });
        // billboard standing on the tile, counter sheared onto its face
        const bq = ip0(0.12 * A, -0.42 * A, 0);
        const bw = 1.5 * A, rise = K.ease.back(K.beat(t, 8.35, 0.5, 'lin'));
        const bf = block(ctx, bq[0], bq[1], bw, 18 * u, 0.8 * A * rise, '#ffffff', { left: '#ffffff', right: '#d8d2ef', shadowK: 0.7 });
        if (rise > 0.5) {
          fill(ctx, quad(bf.left, 0.03, 0.06, 0.97, 0.94), '#f7f5ff');
          const v = K.count(t, 8.6, 1.4, 0, 1000000);
          const c = bf.left(0.5, 0.44);
          ctx.save(); const fs = K.fitSize(ctx, '1,000,000', FONT, 800, (portrait ? 66 : 76) * s, bw * 0.84) / s; ctx.restore();
          style.counter(ctx, Math.round(v / 1000) * 1000, c[0], c[1], 1, { size: fs });
          const lc = bf.left(0.5, 0.2);
          ctx.save(); ctx.font = K.font(30 * s, FONT, 700); const vw = ctx.measureText('views').width;
          ctx.translate(lc[0] - (vw * C) / 2, lc[1] - (vw * 0.5) / 2); ctx.transform(C, 0.5, 0, 1, 0, 0); ctx.fillStyle = P.coral; ctx.fillText('views', 0, 0); ctx.restore();
        }
        const ep = K.beat(t, 10.0, 0.9, 'out');
        style.emphasis(ctx, bq[0], bq[1] + 10 * s, bw * 0.62, ep, {});
        // data cubes arcing off the tower into the billboard
        for (let i = 0; i < 5; i++) {
          const ph = (t * 0.6 + i * 0.2) % 1, a0 = f.right(0.5, 0.95), b0 = bf.left(0.08, 0.9);
          const x = K.lerp(a0[0], b0[0], ph), y = K.lerp(a0[1], b0[1], ph) - Math.sin(ph * Math.PI) * 24 * s;
          block(ctx, x, y, 9 * s, 9 * s, 9 * s, i % 2 ? P.coral : '#ffd1c9', { shadow: false, ao: false });
        }
        style.title(ctx, portrait ? 'Post once.\nReach everywhere.' : 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { align: 'center', size: portrait ? 50 : 52 });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      for (let i = 0; i < 4; i++) k.play('click', 0.2 + i * 0.25, { pitch: 1 + i * 0.1 });
      k.play('thud', 1.65, { gain: 0.5 }); k.play('whoosh', 1.55, { dur: 0.4, gain: 0.6 });
      k.play('pop', 2.15); for (let i = 0; i < 4; i++) k.play('pop', 2.3 + i * 0.15, { pitch: 1.3, gain: 0.5 });
      k.play('pop', 2.95, { pitch: 1.2 });
      k.play('whoosh', 3.4, { dur: 0.6, gain: 0.45 }); k.play('pop', 4.1, { pitch: 0.7 }); k.play('thud', 4.2, { gain: 0.4 });
      k.play('pop', 4.55, { pitch: 1.1 });
      for (let i = 0; i < 7; i++) { k.play('click', 5.0 + i * 0.4, { pitch: 0.8 + i * 0.05 }); k.play('pop', 5.3 + i * 0.4, { pitch: 1 + i * 0.06, gain: 0.85 }); }
      k.play('whoosh', 7.6, { dur: 0.6 }); for (let i = 0; i < 6; i++) k.play('click', 7.7 + i * 0.1, { gain: 0.5, pitch: 1.4 });
      k.play('whoosh', 8.3, { dur: 0.6, up: false });
      k.play('thud', 8.4, { gain: 0.5 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('ding', 10.0);
      k.play('chime', 11.2, { note: 'C6' });
    },
  };
  MS.register(style);
})();
