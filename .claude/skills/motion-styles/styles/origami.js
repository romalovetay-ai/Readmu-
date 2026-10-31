// Origami Studio (Paper & Craft). Folded-paper models on a seamless studio sweep: every form is flat facets with
// consistent fold shading from one key light, crisp crease lines, two-tone paper (front colour, pale back), soft
// table shadows. Panels unfold crease by crease, arrows are creased paper arrows, labels are tent cards, a paper
// crane bobs overhead, the key light slowly orbits, and a pre-creased sheet folds over the frame as the transition.
(function () {
  const PAPER = { teal: ['#2aa39b', '#a9ddd6'], red: ['#df5039', '#f6c0b2'], yellow: ['#efb935', '#fae3a3'], blue: ['#3a5fb2', '#b3c6ec'], cream: ['#f2ebdb', '#fbf8f0'], ink: '#26303a' };
  const F = { head: 'Space Grotesk', mono: 'Space Mono' };
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  let NOW = 0;
  const tone = (col, f) => K.rgba(f >= 0 ? K.mix(col, '#ffffff', f) : K.mix(col, '#0a0d14', -f));
  const P2 = (k) => (Array.isArray(k) ? k : PAPER[k] || PAPER.cream);

  // soft contact shadow on the table under an object
  function tableShadow(ctx, x, y, w, h, s, a = 0.22) {
    ctx.save(); ctx.fillStyle = `rgba(40,45,55,${a})`; ctx.filter = `blur(${10 * s}px)`;
    ctx.beginPath(); ctx.ellipse(x + w / 2 + 10 * s, y + h + 4 * s, w * 0.52, Math.max(8 * s, h * 0.1), 0, 0, 7); ctx.fill(); ctx.filter = 'none'; ctx.restore();
  }
  function facet(ctx, pts, fill) { ctx.fillStyle = fill; K.poly(ctx, pts, true); ctx.fill(); }
  function crease(ctx, a, b, s, light = true) { ctx.save(); ctx.lineWidth = 1.2 * s; ctx.strokeStyle = light ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore(); }

  // a folded panel: two facets split by a diagonal valley fold, a dog-ear in the back colour, lower half unfolding
  function panel(ctx, x, y, w, h, p, paper, s, o = {}) {
    const [front, back] = P2(paper), k = K.clamp(p); if (k <= 0) return;
    const ang = Math.PI * (1 - K.ease.inOut(k)), cy = y + h / 2, sy = Math.cos(ang);          // lower half: folded up behind (-1) to flat (1)
    tableShadow(ctx, x, y, w, h, s, 0.25 * k);
    // top half
    facet(ctx, [[x, y], [x + w, y], [x + w, cy], [x, cy]], tone(front, 0.06));
    facet(ctx, [[x, y], [x + w * 0.62, y], [x, cy]], tone(front, 0.14));                          // a lit facet from a pre-fold
    // bottom half, rotating about the centre crease
    const by = cy + (h / 2) * sy, bcol = sy >= 0 ? tone(front, -0.06 - 0.25 * (1 - sy)) : tone(back, -0.1 - 0.15 * (1 + sy));
    facet(ctx, [[x, cy], [x + w, cy], [x + w, by], [x, by]], bcol);
    if (sy > 0.2) facet(ctx, [[x + w, cy], [x + w, by], [x + w * 0.45, by]], tone(front, -0.16));
    crease(ctx, [x, cy], [x + w, cy], s, sy < 0.95);
    // dog-ear: top-right corner folded down showing the pale back
    const d = Math.min(w, h) * 0.22;
    if (k > 0.5 && o.ear !== false) { facet(ctx, [[x + w - d, y], [x + w, y], [x + w, y + d]], 'rgba(230,230,228,0.0)'); ctx.save(); ctx.fillStyle = '#e6e5e1'; K.poly(ctx, [[x + w - d, y], [x + w, y], [x + w, y + d]], true); ctx.fill(); ctx.restore(); facet(ctx, [[x + w - d, y], [x + w - d, y + d], [x + w, y + d]], tone(back, -0.02)); crease(ctx, [x + w - d, y], [x + w, y + d], s, false); }
    ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1 * s; ctx.strokeRect(x, y, w, Math.max(h / 2, by - y)); ctx.restore();
  }
  // tent card: printed front with a fold strip on top, standing on the table
  function tent(ctx, text, x, y, size, p, o = {}) {
    const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return { w: 0, h: 0 };
    ctx.save(); ctx.font = K.font(size, F.head, 700); const tw = ctx.measureText(text).width; ctx.restore();
    const w = tw + size * 0.9, h = size * 1.5, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - size * 1.05;
    const sq = K.ease.back(k);
    ctx.save(); ctx.translate(x0 + w / 2, y0 + h); ctx.scale(1, sq); ctx.translate(-(x0 + w / 2), -(y0 + h));
    tableShadow(ctx, x0, y0, w, h, s, 0.2);
    const [front] = P2(o.paper || 'cream'), top = h * 0.14;
    facet(ctx, [[x0, y0 + top], [x0 + w, y0 + top], [x0 + w, y0 + h], [x0, y0 + h]], tone(front, 0));
    facet(ctx, [[x0 + 3 * s, y0], [x0 + w - 3 * s, y0], [x0 + w, y0 + top], [x0, y0 + top]], tone(front, 0.25));
    facet(ctx, [[x0, y0 + h * 0.62], [x0 + w, y0 + h * 0.55], [x0 + w, y0 + h], [x0, y0 + h]], 'rgba(0,0,0,0.035)');
    crease(ctx, [x0, y0 + top], [x0 + w, y0 + top], s, true);
    if (o.bar) { ctx.fillStyle = o.bar; ctx.fillRect(x0 + w / 2 - w * 0.12, y0 + h - size * 0.1, w * 0.24, 3 * s); }
    ctx.font = K.font(size, F.head, 700); ctx.fillStyle = o.color || PAPER.ink; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x0 + (w - tw) / 2, y0 + top + size * 0.98);
    ctx.restore();
    return { w, h };
  }
  // the paper crane: body diamond, two wings flapping slowly, neck and tail points
  function crane(ctx, x, y, sc, t, paper) {
    const [c] = P2(paper), f = Math.sin(t * 2.2) * 0.35;
    ctx.save(); ctx.translate(x, y + Math.sin(t * 1.3) * 8 * sc); ctx.scale(sc, sc);
    ctx.save(); ctx.fillStyle = 'rgba(40,45,55,0.12)'; ctx.filter = 'blur(8px)'; ctx.beginPath(); ctx.ellipse(10, 150, 70, 10, 0, 0, 7); ctx.fill(); ctx.restore();
    facet(ctx, [[-60, -30], [-10, 0], [-95, -70]], tone(c, -0.1));                     // tail
    facet(ctx, [[60, -30], [10, 0], [90, -85], [100, -80]], tone(c, 0.05));            // neck
    facet(ctx, [[90, -85], [100, -80], [112, -70]], tone(c, -0.2));                     // head
    facet(ctx, [[-40, -10], [0, -40], [40, -10], [0, 14]], tone(c, -0.18));             // body
    facet(ctx, [[0, -40], [40, -10], [0, 14]], tone(c, -0.05));
    facet(ctx, [[-30, -18], [30, -18], [70 * (1 - f), -95 - 40 * f]], tone(c, 0.18));   // far wing
    facet(ctx, [[-30, -18], [30, -18], [-40 * (1 + f), -110 - 30 * f]], tone(c, 0.3));  // near wing
    crease(ctx, [-30, -18], [30, -18], 1.5, true);
    ctx.restore();
  }

  const style = {
    id: 'origami', name: 'Origami Studio', family: 'Paper & Craft',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Space+Mono:wght@400;700&display=block', specs: ['700 56px "Space Grotesk"', '400 20px "Space Mono"'] }],
    palette: { bg: '#e7e5e0', ink: PAPER.ink, accent: PAPER.red[0], teal: PAPER.teal[0], red: PAPER.red[0], yellow: PAPER.yellow[0], blue: PAPER.blue[0] },
    sfx: { draw: null, land: 'paper', emphasis: 'ding', transition: 'whoosh', bed: 'room' },

    // seamless sweep: wall falling into the table with a soft curve, a key light pool that slowly orbits
    background(ctx, W, H, t) {
      const s = S(W, H), hz = H * (H > W ? 0.3 : 0.38);
      const base = K.cached(`ori-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d');
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#d9d7d2'); g.addColorStop(hz / H, '#e4e2dd'); g.addColorStop(Math.min(0.99, hz / H + 0.18), '#eeece8'); g.addColorStop(1, '#e2e0db');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.drawImage(K.paperTex(W, H, '#f6f5f2', 71, 0.03, false), 0, 0);
        return c;
      });
      ctx.drawImage(base, 0, 0);
      const lx = W * (0.5 + 0.18 * Math.sin(t * 0.25)), ly = hz + H * 0.15;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(W, H) * 0.6);
      lg.addColorStop(0, 'rgba(255,252,244,0.55)'); lg.addColorStop(1, 'rgba(255,252,244,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
    },
    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.22, '#3a3f48');
      K.grain(ctx, W, H, t, 0.03, 12, 'overlay');
    },

    // headline on a folded ribbon banner (tails tucked behind with their fold triangles)
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 56) * s, k = K.clamp(p); if (k <= 0) return { w: 0, h: 0 };
      if (o.plain) return tent(ctx, text, x, y, size, p, o);
      ctx.save(); ctx.font = K.font(size, F.head, 700); const tw = ctx.measureText(text).width; ctx.restore();
      const w = tw + size * 1.0, h = size * 1.45, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - size * 1.05;
      const [front, back] = P2(o.paper || 'teal'), open = K.ease.inOut(K.clamp(k * 1.6)), cw = w * open;
      ctx.save(); ctx.translate(x0 + w / 2, 0);
      tableShadow(ctx, -cw / 2, y0, cw, h, s, 0.12);
      const tl = h * 0.9, dy = h * 0.28;
      for (const sg of [-1, 1]) {   // tails behind
        const ex = sg * (cw / 2 + tl * open), ix = sg * (cw / 2 - h * 0.1);
        facet(ctx, [[ix, y0 + dy], [ex, y0 + dy], [ex - sg * h * 0.28, y0 + dy + h / 2], [ex, y0 + dy + h], [ix, y0 + dy + h]], tone(front, -0.22));
        facet(ctx, [[sg * cw / 2, y0 + h], [ix, y0 + dy + h], [sg * cw / 2, y0 + dy + h]], tone(back, -0.25));
      }
      facet(ctx, [[-cw / 2, y0], [cw / 2, y0], [cw / 2, y0 + h], [-cw / 2, y0 + h]], tone(front, 0.02));
      facet(ctx, [[-cw / 2, y0], [cw / 2, y0], [cw / 2, y0 + h * 0.42], [-cw / 2, y0 + h * 0.52]], tone(front, 0.12));
      crease(ctx, [-cw / 2, y0 + h * 0.52], [cw / 2, y0 + h * 0.42], s, true);
      ctx.beginPath(); ctx.rect(-cw / 2, y0, cw, h); ctx.clip();
      ctx.font = K.font(size, F.head, 700); ctx.fillStyle = o.color || '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
      ctx.globalAlpha = K.clamp((k - 0.35) * 3); ctx.fillText(text, 0, y0 + h / 2 + size * 0.36);
      ctx.restore();
      return { w, h };
    },
    label(ctx, text, x, y, p, o = {}) { return tent(ctx, text, x, y, (o.size || 32) * sOf(ctx), p, o); },

    // creased paper arrow: two-tone halves split by the centre crease, folded head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.08, 30), q = K.trim(pts, K.clamp(p / 0.85)); if (q.length < 2) return null;
      const [front] = P2(o.paper || 'yellow'), w = (o.width || 14) * s, L = [], R = [];
      q.forEach((pt, i) => { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; L.push([pt[0] - (dy / l) * w / 2, pt[1] + (dx / l) * w / 2]); R.push([pt[0] + (dy / l) * w / 2, pt[1] - (dx / l) * w / 2]); });
      ctx.save(); ctx.fillStyle = 'rgba(40,45,55,0.16)'; ctx.filter = `blur(${4 * s}px)`; ctx.translate(4 * s, 8 * s); K.poly(ctx, [...L, ...[...R].reverse()], true); ctx.fill(); ctx.restore();
      facet(ctx, [...q, ...[...R].reverse()], tone(front, 0.14)); facet(ctx, [...q, ...[...L].reverse()], tone(front, -0.12));
      if (p > 0.85) {
        const k = K.ease.back(K.clamp((p - 0.85) / 0.15)), b = pts[pts.length - 1], a = pts[pts.length - 3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hl = w * 2 * k;
        const tip = [b[0] + Math.cos(ang) * hl * 0.6, b[1] + Math.sin(ang) * hl * 0.6], l1 = [b[0] - Math.cos(ang - 1.1) * hl, b[1] - Math.sin(ang - 1.1) * hl], l2 = [b[0] - Math.cos(ang + 1.1) * hl, b[1] - Math.sin(ang + 1.1) * hl];
        facet(ctx, [tip, l1, b], tone(front, -0.18)); facet(ctx, [tip, l2, b], tone(front, 0.2)); crease(ctx, tip, b, s, true);
      }
      return q[q.length - 1];
    },
    box(ctx, x, y, w, h, p, o = {}) { panel(ctx, x, y, w, h, p, o.paper || 'teal', sOf(ctx), o); },
    counter(ctx, value, x, y, p, o = {}) { return tent(ctx, K.fmt(value), x, y, (o.size || 110) * sOf(ctx), 1, { align: o.align || 'center', paper: 'cream', bar: PAPER.red[0] }); },

    // a pleated paper fan opening behind the moment, with a key-light flare
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), k = K.ease.out(K.clamp(p)); if (k <= 0) return;
      const [front] = P2(o.paper || 'red'), n = 16, sweep = Math.PI * 1.25 * k, a0 = -Math.PI / 2 - sweep / 2;
      ctx.save();
      const fl = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8); fl.addColorStop(0, `rgba(255,250,235,${0.6 * k})`); fl.addColorStop(1, 'rgba(255,250,235,0)'); ctx.fillStyle = fl; ctx.fillRect(x - r * 2, y - r * 2, r * 4, r * 4);
      for (let i = 0; i < n; i++) {
        const A = a0 + (sweep * i) / n, B = a0 + (sweep * (i + 1)) / n, R = r * 1.25;
        facet(ctx, [[x, y + r * 0.2], [x + Math.cos(A) * R, y + r * 0.2 + Math.sin(A) * R * (o.ry || 0.75)], [x + Math.cos(B) * R, y + r * 0.2 + Math.sin(B) * R * (o.ry || 0.75)]], tone(front, i % 2 ? 0.15 : -0.12));
      }
      ctx.restore();
    },

    // a pre-creased sheet folds over from the right (covered at 0.5), then folds away to the left
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), first = p < 0.5, k = K.ease.inOut(first ? p / 0.5 : (p - 0.5) / 0.5), cx = K.lerp(W, 0, k);
      const [front] = P2(o.paper || 'teal');
      const x0 = first ? cx : 0, x1 = first ? W : cx; if (x1 - x0 < 1) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip();
      ctx.fillStyle = tone(front, 0.05); ctx.fillRect(0, 0, W, H);
      // the sheet's pre-creased diagonal grid in alternating facet tones
      const g = 160 * s; let i = 0;
      for (let yy = -g; yy < H + g; yy += g) for (let xx = -g; xx < W + g; xx += g, i++) { facet(ctx, [[xx, yy], [xx + g, yy], [xx + g, yy + g]], tone(front, (i % 2 ? 0.1 : -0.05))); crease(ctx, [xx, yy], [xx + g, yy + g], s, true); }
      // fold shading at the moving crease
      const ex = first ? cx : cx, sh = ctx.createLinearGradient(ex, 0, ex + (first ? 1 : -1) * 120 * s, 0);
      sh.addColorStop(0, 'rgba(0,0,0,0.3)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
  };

  // ---------- the shared demo: one studio table ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const PAPS = ['red', 'yellow', 'red', 'blue', 'blue', 'teal', 'blue'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 118 * s], video: [90 * s, 250 * s, 250 * s, 160 * s], node: [450 * s, 265 * s, 320 * s, 140 * s],
      chips: PL.map((_, i) => [905 * s, (205 + i * 66) * s]), top: [W / 2, 140 * s], counter: [W / 2, 410 * s], take: [W / 2, 600 * s], crane: [1150 * s, 130 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.215, W * 0.5, H * 0.1], node: [W * 0.15, H * 0.39, W * 0.7, H * 0.07],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.555 + Math.floor(i / 2) * 0.07)]), top: [W / 2, H * 0.15], counter: [W / 2, H * 0.45], take: [W / 2, H * 0.68], crane: [W * 0.78, H * 0.9] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      NOW = t;
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      // camera push-in on the hit
      const z = 1 + 0.05 * K.beat(t, 10.0, 0.6, 'out');
      ctx.save(); ctx.translate(Lo.counter[0], Lo.counter[1]); ctx.scale(scene2 ? z : 1, scene2 ? z : 1); ctx.translate(-Lo.counter[0], -Lo.counter[1]);
      style.background(ctx, W, H, t);
      crane(ctx, Lo.crane[0], Lo.crane[1], s * (P ? 0.9 : 0.7), t, scene2 ? 'red' : 'teal');
      if (!scene2) {
        if (P) { style.title(ctx, 'One video.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 0.9, 'lin'), { size: 56, align: 'center' }); style.title(ctx, 'Every platform.', Lo.title[0], Lo.title[1] + 110 * s, K.beat(t, 0.7, 1.0, 'lin'), { size: 56, align: 'center', paper: 'red' }); }
        else style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.4, 'lin'), { size: 58, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video, vp = K.beat(t, 2.0, 0.8, 'lin');
        style.box(ctx, vx, vy, vw, vh, vp, { paper: 'blue' });
        if (vp > 0.7) { const r = Math.min(vw, vh) * 0.24, cx = vx + vw / 2, cy = vy + vh / 2; facet(ctx, [[cx - r * 0.6, cy - r], [cx + r, cy], [cx - r * 0.6, cy]], '#ffffff'); facet(ctx, [[cx - r * 0.6, cy], [cx + r, cy], [cx - r * 0.6, cy + r]], '#d9dde6'); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 62 * s, K.beat(t, 2.6, 0.5, 'lin'), { align: 'center', size: 34 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 82 * s], [nx + nw / 2, ny - 18 * s]] : [[vx + vw + 20 * s, vy + vh / 2], [nx - 22 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: 0, paper: 'yellow' });
        const np = K.beat(t, 4.0, 0.8, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, { paper: 'teal' });
        if (np > 0.75) { ctx.save(); ctx.globalAlpha = K.clamp((np - 0.75) * 4); ctx.font = K.font(K.fitSize(ctx, 'Creator OS', F.head, 700, 54 * s, nw - 50 * s), F.head, 700); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Creator OS', nx + nw / 2, ny + nh / 2 + 2 * s); ctx.restore(); }
        if (P) style.arrow(ctx, [W / 2, ny + nh + 18 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0, width: 12, paper: 'yellow' });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 18 * s] : [nx + nw + 18 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 18 * s] : [cx - 24 * s, cy - 16 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.02, width: 9, paper: PAPS[i] });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.2, 0.4, 'lin'), { size: P ? 32 : 32, align: P ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * 0.8, h2 = nh * 0.8;
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 40 * s, (P ? 250 : 270) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: P ? 0.9 : 0.75 });
        style.box(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, { paper: 'teal', ear: false });
        ctx.save(); ctx.font = K.font(46 * s, F.head, 700); ctx.fillStyle = '#ffffff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Creator OS', Lo.top[0], Lo.top[1] + 2 * s); ctx.restore();
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 100 : 108 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + (P ? 110 : 84) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 32, paper: 'yellow' });
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1] + 30 * s, K.beat(t, 10.5, 0.6, 'lin'), { size: 56, align: 'center', paper: 'red' }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 140 * s, K.beat(t, 10.8, 0.8, 'lin'), { size: 56, align: 'center' }); }
        else style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1] + 20 * s, K.beat(t, 10.5, 1.0, 'lin'), { size: 52, align: 'center' });
        if (t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      }
      ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2);
      k.play('paper', 0.15, { dur: 0.5 }); k.play('paper', 0.75, { dur: 0.4 }); k.play('pluck', 1.2, { note: 'E5', gain: 0.5 });
      k.play('paper', 2.0, { dur: 0.5 }); k.play('paper', 2.4, { dur: 0.3 }); k.play('pop', 2.7, { pitch: 0.8, gain: 0.5 });
      k.play('paper', 3.3, { dur: 0.6 }); k.play('paper', 4.0, { dur: 0.5 }); k.play('paper', 4.4, { dur: 0.4 }); k.play('pluck', 4.8, { note: 'A5', gain: 0.5 });
      for (let i = 0; i < 7; i++) { k.play('paper', 5.0 + i * 0.4, { dur: 0.25, gain: 0.7 }); k.play('pop', 5.3 + i * 0.4, { pitch: 0.7 + i * 0.05, gain: 0.5 }); }
      k.play('whoosh', 7.4, { dur: 0.9 }); k.play('paper', 7.5, { dur: 0.8, gain: 1.2 }); k.play('whoosh', 8.3, { dur: 0.9, up: false }); k.play('paper', 8.4, { dur: 0.8, gain: 1.1 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('ding', 10.0); k.play('paper', 10.0, { dur: 0.5, gain: 1.2 });
      k.play('paper', 10.5, { dur: 0.6 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
