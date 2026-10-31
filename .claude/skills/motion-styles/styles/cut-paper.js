// Cut-Paper Diorama (Paper & Craft). A layered cardstock shadow box: every shape is its own scissor-cut sheet with
// fibre texture, a lit top edge and a soft drop shadow onto the sheet behind; letters are cut from colour stock
// mounted on white, torn edges show the white core, labels are paper tags on string, numbers are swapped digit
// tiles, emphasis is a pop-up paper sunburst, and the scene changes by pop-up layers sliding through on parallax.
(function () {
  const C = { sky: '#3d3f7a', sky2: '#2c2d5e', mtn: '#6c6fb0', hill: '#2f7a62', hill2: '#3f9a6e', cream: '#f4ead2', white: '#fbf8f0', red: '#e0523f', orange: '#f2913d', yellow: '#f6c64a', teal: '#3fb3a5', blue: '#4b7fd1', pink: '#ee8fb0', ink: '#2b2540' };
  const LETTER = [C.red, C.orange, C.yellow, C.teal, C.blue, C.pink];
  const FONT = 'Archivo Black';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // cardstock: colour with fibre flecks and gentle mottling, as a repeating pattern
  function stock(ctx, col) {
    const tile = K.cached(`cp-stock:${col}`, () => {
      const n = 384, c = K.layer(n, n), x = c.getContext('2d'), r = K.rng(col);
      x.drawImage(K.paperTex(n, n, col, col.charCodeAt(3), 0.05, false), 0, 0);
      for (let i = 0; i < 140; i++) { x.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.07)'; x.lineWidth = 0.6 + r() * 0.7; const px = r() * n, py = r() * n, a = r() * 6.3, l = 4 + r() * 14; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a + 1) * l * 0.5, py + Math.sin(a + 1) * l * 0.5, px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke(); }
      return c;
    });
    return ctx.createPattern(tile, 'repeat');
  }
  // one cut sheet: drop shadow onto the layer behind, fibre fill, lit top-left edge, faint shade bottom-right
  function sheet(ctx, path, col, depth = 1, o = {}) {
    const s = sOf(ctx);
    ctx.save(); ctx.shadowColor = `rgba(15,10,30,${0.32 + depth * 0.06})`; ctx.shadowBlur = (6 + depth * 6) * s; ctx.shadowOffsetX = depth * 2.5 * s; ctx.shadowOffsetY = depth * 4.5 * s;
    if (o.core) { ctx.fillStyle = C.white; path(ctx, 2.5 * s); ctx.fill(); ctx.shadowColor = 'transparent'; }
    ctx.fillStyle = stock(ctx, col); path(ctx, 0); ctx.fill(); ctx.restore();
    ctx.save(); path(ctx, 0); ctx.clip();
    ctx.lineWidth = 3 * s; ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.translate(1.6 * s, 1.8 * s); path(ctx, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(0,0,0,0.16)'; ctx.translate(-3.6 * s, -3.8 * s); path(ctx, 0); ctx.stroke();
    ctx.restore();
  }
  const rectPath = (x, y, w, h, r = 6) => (c, g) => { c.beginPath(); c.roundRect(x - g, y - g, w + 2 * g, h + 2 * g, r); };
  const polyPath = (pts) => (c, g) => { c.beginPath(); const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cy = pts.reduce((a, p) => a + p[1], 0) / pts.length; pts.forEach((p, i) => { const d = Math.hypot(p[0] - cx, p[1] - cy) || 1, X = p[0] + ((p[0] - cx) / d) * g, Y = p[1] + ((p[1] - cy) / d) * g; i ? c.lineTo(X, Y) : c.moveTo(X, Y); }); c.closePath(); };
  // torn edge points between a and b
  function torn(a, b, seed, amp) { const r = K.rng(seed), n = Math.max(4, Math.floor(Math.hypot(b[0] - a[0], b[1] - a[1]) / 9)), out = []; for (let i = 0; i <= n; i++) { const t = i / n; out.push([K.lerp(a[0], b[0], t) + (r() - 0.5) * amp * (a[1] === b[1] ? 0.2 : 1), K.lerp(a[1], b[1], t) + (r() - 0.5) * amp * (a[1] === b[1] ? 1 : 0.2)]); } return out; }

  // cut-out letters: white mount behind, each letter its own colour of stock, popping up one by one
  function cutText(ctx, text, x, y, size, p, o = {}) {
    const s = sOf(ctx);
    ctx.save(); ctx.font = K.font(size, FONT, 400); ctx.textBaseline = 'alphabetic';
    const ws = [...text].map((c) => ctx.measureText(c).width), tr = size * 0.02, total = ws.reduce((a, c) => a + c + tr, -tr);
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    const n = text.length;
    [...text].forEach((ch, i) => {
      const k = K.clamp(p * (n + 3) - i) / 1, kk = K.ease.back(K.clamp(k / 3));
      if (ch !== ' ' && kk > 0) {
        const col = o.color || LETTER[(i + (o.seed || 0)) % LETTER.length], r = K.rng(i + (o.seed || 0) * 17);
        ctx.save(); ctx.translate(cx + ws[i] / 2, y - size * 0.35); ctx.rotate((r() - 0.5) * 0.06); ctx.scale(kk, kk); ctx.translate(-ws[i] / 2, size * 0.35);
        ctx.shadowColor = 'rgba(15,10,30,0.4)'; ctx.shadowBlur = 8 * s; ctx.shadowOffsetX = 2 * s; ctx.shadowOffsetY = 4 * s;
        if (o.mount !== false) { ctx.lineJoin = 'round'; ctx.lineWidth = size * 0.16; ctx.strokeStyle = C.white; ctx.strokeText(ch, 0, 0); ctx.fillStyle = C.white; ctx.fillText(ch, 0, 0); }
        ctx.shadowColor = 'rgba(15,10,30,0.25)'; ctx.shadowBlur = 3 * s; ctx.shadowOffsetX = 1 * s; ctx.shadowOffsetY = 1.5 * s;
        ctx.fillStyle = stock(ctx, col); ctx.fillText(ch, 0, 0);
        ctx.restore();
      }
      cx += ws[i] + tr;
    });
    ctx.restore();
    return total;
  }

  const style = {
    id: 'cut-paper', name: 'Cut-Paper Diorama', family: 'Paper & Craft',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Archivo+Black&display=block', specs: ['400 60px "Archivo Black"'] }],
    palette: { bg: C.sky, ink: C.ink, accent: C.red, ...C },
    sfx: { draw: null, land: 'paper', emphasis: 'pop', transition: 'whoosh', bed: 'room' },

    // the shadow box: dusk sky sheet with punched stars, a mountain layer and two hill layers, drifting on parallax
    background(ctx, W, H, t) {
      const s = S(W, H), P = H > W, base = H - (P ? 150 : 95) * s;
      const sky = K.cached(`cp-sky:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(3);
        x.fillStyle = stock(x, C.sky); x.fillRect(0, 0, W, H);
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(20,18,50,0.35)'); g.addColorStop(1, 'rgba(255,190,140,0.12)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        for (let i = 0; i < 60; i++) { const px = r() * W, py = r() * H * 0.7, rr = (1.2 + r() * 2.2) * s; x.fillStyle = 'rgba(0,0,0,0.25)'; x.beginPath(); x.arc(px + 1, py + 1.5, rr, 0, 7); x.fill(); x.fillStyle = '#fbf2c8'; x.beginPath(); x.arc(px, py, rr, 0, 7); x.fill(); }
        return c;
      });
      ctx.drawImage(sky, 0, 0);
      const layer = (key, col, depth, yb, amp, freq, seed) => K.cached(`cp-l:${key}:${W}x${H}`, () => {
        const c = K.layer(W + 80 * s, H), x = c.getContext('2d'), r = K.rng(seed), pts = [[0, H]];
        for (let xx = 0; xx <= W + 80 * s; xx += 14 * s) pts.push([xx, yb - Math.abs(Math.sin(xx * freq + seed)) * amp - r() * 4 * s]);
        pts.push([W + 80 * s, H]);
        const sx = sOf; void sx; x.save(); x.shadowColor = 'rgba(15,10,30,0.4)'; x.shadowBlur = (8 + depth * 6) * s; x.shadowOffsetY = -2 * s; x.fillStyle = stock(x, col); K.poly(x, pts, true); x.fill(); x.restore();
        x.save(); K.poly(x, pts, true); x.clip(); x.lineWidth = 3 * s; x.strokeStyle = 'rgba(255,255,255,0.35)'; x.translate(0, 2 * s); K.poly(x, pts.slice(1, -1)); x.stroke(); x.restore();
        return c;
      });
      const drift = (d) => -10 * s - t * d * 2.6 * s;   // slow monotonic parallax (layers are 80px wider than the frame)
      ctx.drawImage(layer('mtn', C.mtn, 1, base - 40 * s, 70 * s, 0.006, 1), drift(0.5), 0);
      ctx.drawImage(layer('h1', C.hill, 2, base + 10 * s, 26 * s, 0.009, 2), drift(1), 0);
      ctx.drawImage(layer('h2', C.hill2, 3, base + 50 * s, 18 * s, 0.013, 3), drift(1.6), 0);
    },

    finish(ctx, W, H, t) {
      const g = ctx.createLinearGradient(0, 0, 0, H); g.addColorStop(0, 'rgba(255,236,200,0.08)'); g.addColorStop(1, 'rgba(0,0,0,0.08)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      K.vignette(ctx, W, H, 0.28, '#0d0a1c');
      K.grain(ctx, W, H, t, 0.045, 12, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) { const s = sOf(ctx), size = (o.size || 64) * s; return { w: cutText(ctx, text, x, y, size, p, o), h: size }; },
    // a paper tag on a string, dropped onto what it names
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 32) * s, k = K.clamp(p); if (k <= 0) return { w: 0, h: 0 };
      ctx.save(); ctx.font = K.font(size, FONT, 400); const tw = ctx.measureText(text).width; ctx.restore();
      const w = tw + size * 1.4, h = size * 1.5, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - size * 1.05;
      const drop = (1 - K.ease.back(k)) * -40 * s, rot = (o.tilt ?? -0.03);
      ctx.save(); ctx.globalAlpha = K.clamp(k * 3); ctx.translate(x0 + w / 2, y0 + h / 2 + drop); ctx.rotate(rot); ctx.translate(-(x0 + w / 2), -(y0 + h / 2));
      const n = h * 0.32, tag = [[x0 + n, y0], [x0 + w, y0], [x0 + w, y0 + h], [x0 + n, y0 + h], [x0, y0 + h - n], [x0, y0 + n]];
      sheet(ctx, polyPath(tag), o.fill || C.cream, 1.2);
      ctx.fillStyle = C.ink; ctx.globalAlpha *= 0.85; ctx.beginPath(); ctx.arc(x0 + n * 0.75, y0 + h / 2, 3.2 * s, 0, 7); ctx.fill();
      ctx.font = K.font(size, FONT, 400); ctx.fillStyle = o.color || C.ink; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + n * 1.5, y0 + h / 2 + 1 * s);
      ctx.restore();
      return { w, h };
    },

    // a paper strip that grows along the path, with a folded arrowhead
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.15, 40), q = K.trim(pts, K.clamp(p / 0.85)); if (q.length < 2) return null;
      const w = (o.width || 12) * s, L = [], R = [];
      q.forEach((pt, i) => { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; L.push([pt[0] - (dy / l) * w / 2, pt[1] + (dx / l) * w / 2]); R.push([pt[0] + (dy / l) * w / 2, pt[1] - (dx / l) * w / 2]); });
      sheet(ctx, polyPath([...L, ...R.reverse()]), o.color || C.cream, 1);
      if (p > 0.85) { const k = K.ease.back(K.clamp((p - 0.85) / 0.15)), b = pts[pts.length - 1], a = pts[pts.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hl = w * 2.2 * k;
        const tri = [[b[0] + Math.cos(ang) * hl * 0.4, b[1] + Math.sin(ang) * hl * 0.4], [b[0] - Math.cos(ang - 0.8) * hl, b[1] - Math.sin(ang - 0.8) * hl], [b[0] - Math.cos(ang + 0.8) * hl, b[1] - Math.sin(ang + 0.8) * hl]];
        sheet(ctx, polyPath(tri), o.color || C.cream, 1.4);
        ctx.save(); ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(tri[0][0], tri[0][1]); ctx.lineTo((tri[1][0] + tri[2][0]) / 2, (tri[1][1] + tri[2][1]) / 2); ctx.stroke(); ctx.restore(); }
      return q[q.length - 1];
    },

    // a two-ply card: darker back sheet + front sheet, sliding up into its slot
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      const dy = (1 - K.ease.out(k)) * 60 * s;
      ctx.save(); ctx.globalAlpha = K.clamp(k * 3); ctx.translate(0, dy);
      sheet(ctx, rectPath(x + 10 * s, y + 10 * s, w, h, 8 * s), o.back || C.ink, 1);
      sheet(ctx, rectPath(x, y, w, h, 8 * s), o.color || C.yellow, 2.2);
      ctx.restore();
    },

    // each digit on its own paper tile; tiles swap (flip) when their digit changes
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 96) * s, txt = K.fmt(value), tw = size * 0.78, gap = size * 0.08, cw = size * 0.3;
      const widths = [...txt].map((c) => (c === ',' ? cw : tw)), total = widths.reduce((a, b) => a + b + gap, -gap);
      let cx = x - total / 2;
      [...txt].forEach((ch, i) => {
        if (ch === ',') { ctx.save(); ctx.font = K.font(size, FONT, 400); ctx.fillStyle = C.white; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 6 * s; ctx.shadowOffsetY = 3 * s; ctx.fillText(',', cx, y); ctx.restore(); cx += cw + gap; return; }
        const r = K.rng(i * 13 + 7), rot = (r() - 0.5) * 0.08;
        ctx.save(); ctx.translate(cx + tw / 2, y - size * 0.35); ctx.rotate(rot);
        sheet(ctx, rectPath(-tw / 2, -size * 0.62, tw, size * 1.12, 6 * s), i % 2 ? C.cream : C.white, 1.6);
        ctx.font = K.font(size * 0.92, FONT, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(15,10,30,0.25)'; ctx.shadowBlur = 3 * s; ctx.shadowOffsetY = 2 * s;
        ctx.fillStyle = stock(ctx, LETTER[(i + (o.seed || 0)) % LETTER.length]); ctx.fillText(ch, 0, size * 0.02);
        ctx.restore(); cx += tw + gap;
      });
      return { w: total, h: size };
    },

    // concentric paper rings (a pop-up sunburst) rising behind the moment
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), rings = [C.red, C.orange, C.yellow, C.cream];
      rings.forEach((col, i) => {
        const k = K.ease.back(K.clamp(p * 1.6 - i * 0.18)); if (k <= 0) return;
        const rr = r * (1 - i * 0.2) * k, ry = rr * (o.ry || 0.62);
        sheet(ctx, (c, g) => { c.beginPath(); c.ellipse(x, y, rr + g, ry + g, 0, 0, 7); }, col, 1 + i * 0.4);
      });
    },

    // pop-up layers slide up through the frame (covered at 0.5), then on out the top
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), cols = [C.hill, C.teal, C.mtn, C.sky2];
      const base = K.lerp(H + 40 * s, -(1.25 * H + 0.9 * H) - 40 * s, K.ease.inOut(p));
      cols.forEach((col, i) => {
        const top = base + i * 0.3 * H, bot = top + 1.25 * H;
        const pts = [[-20, bot]]; for (let xx = -20; xx <= W + 20; xx += 18 * s) pts.push([xx, top + Math.sin(xx * (0.008 + i * 0.002) + i) * 22 * s]); pts.push([W + 20, bot]);
        sheet(ctx, polyPath(pts), col, 3);
      });
    },
  };

  // ---------- the shared demo: one diorama ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const TAGS = [C.cream, C.yellow, C.cream, C.pink, C.cream, C.yellow, C.cream];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 110 * s], video: [90 * s, 240 * s, 250 * s, 150 * s], node: [450 * s, 255 * s, 330 * s, 140 * s],
      chips: PL.map((_, i) => [915 * s, (196 + i * 62) * s]), top: [W / 2, 95 * s], counter: [W / 2, 370 * s], take: [W / 2, 560 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.19, W * 0.5, H * 0.11], node: [W * 0.15, H * 0.375, W * 0.7, H * 0.075],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.54 + Math.floor(i / 2) * 0.066)]), top: [W / 2, H * 0.13], counter: [W / 2, H * 0.43], take: [W / 2, H * 0.66] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      // camera pans along the diorama very slightly (parallax)
      style.background(ctx, W, H, t);
      if (!scene2) {
        if (P) { style.title(ctx, 'One video.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 0.8, 'lin'), { size: 64, align: 'center' }); style.title(ctx, 'Every platform.', Lo.title[0], Lo.title[1] + 92 * s, K.beat(t, 0.7, 1.0, 'lin'), { size: 60, align: 'center', seed: 2 }); }
        else style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.5, 'lin'), { size: 64, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video, vp = K.beat(t, 2.0, 0.6, 'lin');
        style.box(ctx, vx, vy, vw, vh, vp, { color: C.blue });
        if (vp > 0.5) { const r = Math.min(vw, vh) * 0.26, cx = vx + vw / 2, cy = vy + vh / 2 + (1 - K.ease.out(vp)) * 60 * s; sheet(ctx, polyPath([[cx - r * 0.6, cy - r], [cx + r, cy], [cx - r * 0.6, cy + r]]), C.white, 2.6); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 62 * s, K.beat(t, 2.6, 0.5, 'lin'), { align: 'center', fill: C.yellow, tilt: 0.03 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 88 * s], [nx + nw / 2, ny - 20 * s]] : [[vx + vw + 22 * s, vy + vh / 2], [nx - 22 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: P ? 0 : -0.15, color: C.cream });
        const np = K.beat(t, 4.0, 0.7, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, { color: C.red });
        if (np > 0.4) cutText(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 18 * s + (1 - K.ease.out(np)) * 60 * s, 50 * s, (np - 0.4) / 0.6, { align: 'center', color: C.cream, mount: false });
        if (P) style.arrow(ctx, [W / 2, ny + nh + 20 * s], [W / 2, Lo.chips[6][1] + 10 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0, width: 10 });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 20 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 12 * s] : [cx - 22 * s, cy - 12 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, width: 7, color: LETTER[i % LETTER.length] });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.2, 0.4, 'lin'), { size: P ? 30 : 30, align: P ? (left ? 'right' : 'left') : 'left', fill: TAGS[i], tilt: (i % 2 ? 0.03 : -0.03) });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * 0.8, h2 = nh * 0.8;
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 30 * s, (P ? 330 : 330) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: P ? 0.7 : 0.5 });
        style.box(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, { color: C.red });
        cutText(ctx, 'Creator OS', Lo.top[0], Lo.top[1] + 15 * s, 42 * s, 1, { align: 'center', color: C.cream, mount: false });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 84 : 96 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + (P ? 105 : 92) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 34, fill: C.yellow });
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.6, 'lin'), { size: 64, align: 'center', seed: 1 }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 92 * s, K.beat(t, 10.8, 0.8, 'lin'), { size: 60, align: 'center', seed: 3 }); }
        else style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 1.0, 'lin'), { size: 56, align: 'center', seed: 1 });
        if (t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.3);
      for (let i = 0; i < 22; i++) k.play('paper', 0.2 + i * 0.065, { dur: 0.06, gain: 0.6 });
      k.play('paper', 2.0, { dur: 0.4 }); k.play('pop', 2.4, { pitch: 0.8, gain: 0.6 }); k.play('paper', 2.6, { dur: 0.3 });
      k.play('paper', 3.3, { dur: 0.7, gain: 0.8 }); k.play('paper', 4.0, { dur: 0.5 }); k.play('pop', 4.45, { pitch: 0.7 });
      for (let i = 0; i < 7; i++) { k.play('paper', 5.0 + i * 0.4, { dur: 0.3, gain: 0.7 }); k.play('pop', 5.3 + i * 0.4, { pitch: 0.9 + i * 0.05, gain: 0.6 }); }
      k.play('whoosh', 7.4, { dur: 1.0 }); k.play('paper', 7.6, { dur: 1.0, gain: 1.2 }); k.play('whoosh', 8.4, { dur: 0.8, up: false });
      k.play('count', 8.6, { dur: 1.4 }); for (let i = 0; i < 4; i++) k.play('pop', 10.0 + i * 0.1, { pitch: 0.7 + i * 0.15 });
      for (let i = 0; i < 12; i++) k.play('paper', 10.5 + i * 0.08, { dur: 0.06, gain: 0.6 });
      k.play('chime', 11.4, { note: 'E6' });
    },
  };
  MS.register(style);
})();
