// Patent Drawing (Illustration). A 1930s US patent sheet: ruling-pen black line art with heavier shade lines on the
// lower and right edges, parallel-line and stipple shading, reference numerals on curved leaders, FIG. captions, a
// typeset header, an inked signature, odometer drums for numbers and the examiner's red pencil, on yellowed,
// creased paper. Lines are inked one stroke at a time: outlines, then shading, then numerals.
(function () {
  const C = { paper: '#efe3c4', ink: '#1b1813', red: '#b8322a', faint: 'rgba(60,45,25,0.18)' };
  const SERIF = 'Libre Baskerville', TYPE = 'Courier Prime', SIGN = 'Mrs Saint Delafield';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  function sheet(W, H) {
    return K.cached(`pat-sheet:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(1933);
      x.drawImage(K.paperTex(W, H, C.paper, 71, 0.05, false), 0, 0);
      // yellowing toward the edges + a faint coffee ring
      const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.hypot(W, H) * 0.6); g.addColorStop(0, 'rgba(200,160,80,0)'); g.addColorStop(1, 'rgba(170,120,50,0.28)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const rx = W * 0.82, ry = H * 0.8, rr = 70 * s; x.strokeStyle = 'rgba(150,100,45,0.12)'; x.lineWidth = 5 * s; x.beginPath(); x.arc(rx, ry, rr, 0.3, 5.9); x.stroke(); x.lineWidth = 1.5 * s; x.beginPath(); x.arc(rx + 3 * s, ry - 2 * s, rr - 4 * s, 0, 6.28); x.stroke();
      // fold creases: a light ridge and a dark valley side by side
      const folds = H > W ? [['h', H / 3], ['h', (2 * H) / 3], ['v', W / 2]] : [['v', W / 3], ['v', (2 * W) / 3], ['h', H / 2]];
      for (const [d, v] of folds) { for (const [o, col] of [[0, 'rgba(255,255,245,0.5)'], [2 * s, 'rgba(110,80,40,0.16)']]) { x.strokeStyle = col; x.lineWidth = 1.6 * s; x.beginPath();
        if (d === 'v') { x.moveTo(v + o, 0); for (let y = 0; y <= H; y += 40) x.lineTo(v + o + r.range(-1, 1) * s, y); } else { x.moveTo(0, v + o); for (let xx = 0; xx <= W; xx += 40) x.lineTo(xx, v + o + r.range(-1, 1) * s); } x.stroke(); } }
      // a thin ruled border, as on the sheet
      x.strokeStyle = 'rgba(27,24,19,0.8)'; x.lineWidth = 1.4 * s; x.strokeRect(20 * s, 20 * s, W - 40 * s, H - 40 * s);
      return c;
    });
  }

  // ink a list of polylines in order (ruling pen: crisp, even). p spans them all by length.
  function ink(ctx, polys, p, w, col) {
    const s = sOf(ctx), lens = polys.map((q) => K.pathLen(q)), total = lens.reduce((a, b) => a + b, 0); let left = total * K.clamp(p), tip = null;
    ctx.save(); ctx.strokeStyle = col || C.ink; ctx.lineWidth = w * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let i = 0; i < polys.length && left > 0; i++) { const f = Math.min(1, left / (lens[i] || 1)); const q = K.trim(polys[i], f); if (q.length > 1) { K.poly(ctx, q); ctx.stroke(); tip = q[q.length - 1]; } left -= lens[i]; }
    ctx.restore(); return tip;
  }
  const seg = (a, b) => [a, b];
  // parallel-line shading inside a convex quad (lines parallel to edge a->b), revealed by p
  function shadeLines(ctx, quad, n, p, w) {
    const [a, b, c, d] = quad, out = [];
    for (let i = 1; i < n; i++) { const k = i / n; out.push([[K.lerp(a[0], d[0], k), K.lerp(a[1], d[1], k)], [K.lerp(b[0], c[0], k), K.lerp(b[1], c[1], k)]]); }
    return ink(ctx, out, p, w || 1);
  }
  function stipple(ctx, cx, cy, rx, ry, n, p, seed) {
    const s = sOf(ctx), r = K.rng(seed), m = Math.floor(n * K.clamp(p)); ctx.save(); ctx.fillStyle = C.ink;
    for (let i = 0; i < m; i++) { const a = r() * Math.PI * 2, d = Math.sqrt(r()); const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d; if (Math.cos(a) + Math.sin(a) < r() * 1.2 - 0.3) continue; ctx.fillRect(x, y, 1.6 * s, 1.6 * s); }
    ctx.restore();
  }
  // reference numeral on a curved leader
  function numeral(ctx, n, from, to, p) {
    if (p <= 0) return; const s = sOf(ctx);
    const pts = K.arcPts(from, to, 0.22, 20); ink(ctx, [pts], K.clamp(p * 1.4), 1);
    if (p > 0.5) { ctx.save(); ctx.globalAlpha = K.clamp((p - 0.5) * 2); ctx.font = K.font(28 * s, SERIF, 400); ctx.fillStyle = C.ink; ctx.textAlign = from[0] <= to[0] ? 'right' : 'left'; ctx.textBaseline = 'middle';
      ctx.fillText(String(n), from[0] + (from[0] <= to[0] ? -6 : 6) * s, from[1]); ctx.restore(); }
  }
  // an isometric-ish box: front face, top face, right face; shade lines heavier on right and bottom edges
  function isoBox(ctx, x, y, w, h, d, p, o = {}) {
    const dx = d * 0.8, dy = -d * 0.5;
    const F = [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], T = [[x, y], [x + dx, y + dy], [x + w + dx, y + dy], [x + w, y]], R = [[x + w, y], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + w, y + h]];
    const outline = [[...F, F[0]], [T[0], T[1], T[2], T[3]], [R[1], R[2], R[3]]];
    ink(ctx, outline, K.clamp(p / 0.5), 1.8);
    // shade lines (patent convention: light from upper left, so lower and right edges get the heavy line)
    ink(ctx, [[F[3], F[2], F[1]], [R[3], R[2]]], K.clamp((p - 0.4) / 0.2), 3.6);
    shadeLines(ctx, [R[0], R[3], R[2], R[1]].map((q) => q), 9, K.clamp((p - 0.55) / 0.3), 1);
    return { F, T, R };
  }

  const style = {
    id: 'patent-drawing', name: 'Patent Drawing', family: 'Illustration',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&family=Courier+Prime:wght@400;700&family=Mrs+Saint+Delafield&display=block',
      specs: ['700 44px "Libre Baskerville"', '400 30px "Libre Baskerville"', 'italic 400 30px "Libre Baskerville"', '700 64px "Courier Prime"', '400 60px "Mrs Saint Delafield"'] }],
    palette: { bg: C.paper, ink: C.ink, accent: C.red },
    sfx: { draw: 'pen', land: 'tick', emphasis: 'stamp', transition: 'paper', bed: 'room' },
    ink, isoBox, numeral, stipple, shadeLines,

    background(ctx, W, H, t) { ctx.drawImage(sheet(W, H), 0, 0); },
    finish(ctx, W, H, t) { K.grain(ctx, W, H, t, 0.045, 12, 'soft-light'); K.vignette(ctx, W, H, 0.12, '#5a4320'); },

    // typeset caps (the drawing's own lettering is stencil-neat Baskerville)
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 46) * s;
      ctx.save(); ctx.font = K.font(size, SERIF, 700, o.italic ? 'italic' : ''); ctx.textAlign = o.align || 'left'; ctx.fillStyle = o.color || C.ink;
      const txt = o.caps ? text.toUpperCase() : text, n = Math.ceil(txt.length * K.clamp(p)), w = ctx.measureText(txt).width;
      ctx.textAlign = 'left'; const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; ctx.fillText(txt.slice(0, n), x0, y);
      ctx.restore(); return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 32) * s;
      ctx.save(); ctx.font = K.font(size, SERIF, 400, o.italic ? 'italic' : ''); ctx.textAlign = 'left'; ctx.fillStyle = o.color || C.ink;
      const n = Math.ceil(text.length * K.clamp(p)), w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      ctx.fillText(text.slice(0, n), x0, y); ctx.restore(); return { w, h: size };
    },
    // ruled arrow: straight or gently curved hairline, small solid head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0, 30), tip = ink(ctx, [pts], K.clamp(p / 0.85), 1.6, o.color);
      if (p > 0.85) { const b = pts[pts.length - 1], a = pts[pts.length - 3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 15 * s * K.clamp((p - 0.85) / 0.15);
        ctx.save(); ctx.fillStyle = o.color || C.ink; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang - 0.3) * L, b[1] - Math.sin(ang - 0.3) * L); ctx.lineTo(b[0] - Math.cos(ang + 0.3) * L, b[1] - Math.sin(ang + 0.3) * L); ctx.closePath(); ctx.fill(); ctx.restore(); }
      return tip;
    },
    box(ctx, x, y, w, h, p, o = {}) { return isoBox(ctx, x, y, w, h, o.depth ?? Math.min(w, h) * 0.3, p, o); },

    // odometer drums: every digit on its own wheel, the lower ones rolling the higher ones over
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 84) * s, digits = o.digits || 7, dw = size * 0.72, dh = size * 1.2, gap = size * 0.12, comma = size * 0.28;
      const commas = Math.floor((digits - 1) / 3), total = digits * dw + (digits - 1) * gap + commas * comma, x0 = (o.align === 'left' ? x : x - total / 2), top = y - dh * 0.78;
      const v = Math.max(0, value);
      ctx.save(); ctx.font = K.font(size, TYPE, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      // housing
      ctx.lineWidth = 2 * s; ctx.strokeStyle = C.ink; ctx.strokeRect(x0 - 14 * s, top - 12 * s, total + 28 * s, dh + 24 * s);
      ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(x0 - 14 * s, top + dh + 12 * s); ctx.lineTo(x0 + total + 14 * s, top + dh + 12 * s); ctx.lineTo(x0 + total + 14 * s, top - 12 * s); ctx.stroke();
      let cx = x0;
      for (let i = 0; i < digits; i++) {
        const k = digits - 1 - i, pow = Math.pow(10, k), xk = v / pow, d = Math.floor(xk) % 10;
        const frac = k === 0 ? xk - Math.floor(xk) : K.clamp(((v % pow) / pow) * 10 - 9);
        ctx.save(); ctx.beginPath(); ctx.rect(cx, top, dw, dh); ctx.clip();
        ctx.fillStyle = 'rgba(255,250,235,0.6)'; ctx.fillRect(cx, top, dw, dh);
        ctx.fillStyle = C.ink; ctx.fillText(String(d), cx + dw / 2, top + dh / 2 - frac * dh); ctx.fillText(String((d + 1) % 10), cx + dw / 2, top + dh / 2 + (1 - frac) * dh);
        // drum curvature: hatching thickening toward top and bottom edges
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1 * s;
        for (let j = 0; j < 5; j++) { const yy = top + (j + 1) * dh * 0.035 * (j + 1) * 0.6; ctx.beginPath(); ctx.moveTo(cx, yy); ctx.lineTo(cx + dw, yy); ctx.stroke(); ctx.beginPath(); ctx.moveTo(cx, top + dh - (yy - top)); ctx.lineTo(cx + dw, top + dh - (yy - top)); ctx.stroke(); }
        ctx.restore();
        ctx.lineWidth = 1.6 * s; ctx.strokeRect(cx, top, dw, dh);
        cx += dw;
        if (k > 0 && k % 3 === 0) { ctx.fillStyle = C.ink; ctx.fillText(',', cx + (gap + comma) / 2, top + dh * 0.72); cx += comma; }
        cx += gap;
      }
      ctx.restore(); return { w: total, h: dh };
    },
    // the examiner's red pencil: a grainy, doubled loop
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), pts = K.wobble(K.circlePts(x, y, r * 1.25, r * (o.ry || 0.6), 90, -2.5, Math.PI * 2.2), 4 * s, o.seed || 3, 0.02), q = K.trim(pts, K.clamp(p));
      if (q.length < 2) return;
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = o.color || C.red;
      ctx.globalAlpha = 0.85; ctx.lineWidth = 4 * s; ctx.setLineDash([9 * s, 1.5 * s, 4 * s, 1 * s]); K.poly(ctx, q); ctx.stroke();
      ctx.globalAlpha = 0.5; ctx.lineWidth = 2 * s; ctx.setLineDash([3 * s, 2 * s]); K.poly(ctx, q.map(([a, b]) => [a + 2 * s, b + 1.5 * s])); ctx.stroke();
      ctx.restore();
    },
    // the next sheet is drawn across the drafting table: slides in from below over the old one, then the view moves on
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), sh = sheet(W, H), first = p < 0.5, k = K.ease.inOut(first ? p * 2 : (p - 0.5) * 2);
      const y = first ? K.lerp(H, 0, k) : K.lerp(0, -H, k);
      ctx.save(); ctx.beginPath(); ctx.rect(0, Math.max(0, y), W, H); ctx.clip(); ctx.drawImage(sh, 0, y); ctx.restore();
      if (y > -H && y < H) { const e = first ? y : y + H; const g = ctx.createLinearGradient(0, e - 30 * s, 0, e); g.addColorStop(0, 'rgba(40,25,5,0)'); g.addColorStop(1, 'rgba(40,25,5,0.3)');
        if (first) { ctx.fillStyle = g; ctx.fillRect(0, e - 30 * s, W, 30 * s); } }
    },
  };

  // ---------- the drawings for the demo ----------
  function fig1(ctx, x, y, w, h, p, t) {
    // a display monitor on a stand, play symbol on the screen
    const s = sOf(ctx), d = w * 0.18, { F } = isoBox(ctx, x, y, w, h, d, p);
    const ix = x + w * 0.08, iy = y + h * 0.1, iw = w * 0.84, ih = h * 0.8;
    ink(ctx, [[[ix, iy], [ix + iw, iy], [ix + iw, iy + ih], [ix, iy + ih], [ix, iy]]], K.clamp((p - 0.3) / 0.3), 1.4);
    const tri = [[x + w * 0.42, y + h * 0.3], [x + w * 0.42, y + h * 0.7], [x + w * 0.62, y + h * 0.5], [x + w * 0.42, y + h * 0.3]];
    ink(ctx, [tri], K.clamp((p - 0.45) / 0.25), 2.2);
    stipple(ctx, x + w * 0.5, y + h * 0.5, iw * 0.45, ih * 0.42, 260, K.clamp((p - 0.6) / 0.3), 3);
    // stand
    const sx = x + w / 2, sy = y + h;
    ink(ctx, [[[sx - w * 0.06, sy], [sx - w * 0.08, sy + h * 0.25]], [[sx + w * 0.06, sy], [sx + w * 0.08, sy + h * 0.25]], [[sx - w * 0.3, sy + h * 0.25], [sx + w * 0.3, sy + h * 0.25], [sx + w * 0.3 + d * 0.5, sy + h * 0.25 - d * 0.3]]], K.clamp((p - 0.3) / 0.4), 1.8);
    ink(ctx, [[[sx - w * 0.3, sy + h * 0.25], [sx + w * 0.3, sy + h * 0.25]]], K.clamp((p - 0.6) / 0.2), 3.4);
  }
  function fig2(ctx, x, y, w, h, p, t) {
    // the distribution machine: a cabinet with three dials, an intake hopper, a row of output ports
    const s = sOf(ctx), d = Math.min(w, h) * 0.35; isoBox(ctx, x, y, w, h, d, p);
    for (let i = 0; i < 3; i++) { const cx = x + w * (0.22 + i * 0.28), cy = y + h * 0.36, r = Math.min(w, h) * 0.13;
      ink(ctx, [K.circlePts(cx, cy, r, r, 40)], K.clamp((p - 0.35) / 0.3), 1.5);
      const a = -2.3 + 1.6 * K.clamp(p) + Math.sin(t * 2 + i) * 0.15; ink(ctx, [[[cx, cy], [cx + Math.cos(a) * r * 0.8, cy + Math.sin(a) * r * 0.8]]], K.clamp((p - 0.55) / 0.2), 1.8); }
    // a slot
    ink(ctx, [[[x + w * 0.12, y + h * 0.72], [x + w * 0.88, y + h * 0.72], [x + w * 0.88, y + h * 0.8], [x + w * 0.12, y + h * 0.8], [x + w * 0.12, y + h * 0.72]]], K.clamp((p - 0.45) / 0.3), 1.4);
    shadeLines(ctx, [[x + w * 0.12, y + h * 0.72], [x + w * 0.88, y + h * 0.72], [x + w * 0.88, y + h * 0.8], [x + w * 0.12, y + h * 0.8]], 4, K.clamp((p - 0.6) / 0.3), 0.9);
  }

  // ---------- the shared demo: patent No. 1,000,000 ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 150 * s], fig1: [110 * s, 280 * s, 200 * s, 140 * s], fig2: [470 * s, 290 * s, 250 * s, 150 * s],
      chips: PLATFORMS.map((n, i) => [960 * s, (238 + i * 58) * s]) };
    return { s, P: true, title: [W / 2, H * 0.12], fig1: [W * 0.1, H * 0.295, W * 0.28, H * 0.09], fig2: [W * 0.55, H * 0.295, W * 0.32, H * 0.11],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.6 + Math.floor(i / 2) * 0.075)]) };
  }
  function header(ctx, W, H, s, P, sheetNo, p) {
    ctx.save(); ctx.globalAlpha = K.clamp(p * 3); ctx.fillStyle = C.ink; ctx.font = K.font(28 * s, SERIF, 400);
    const y = P ? 80 * s : 62 * s;
    ctx.textAlign = 'left'; ctx.fillText('Oct. 20, 2026.', 44 * s, y);
    ctx.textAlign = 'right'; ctx.fillText(P ? 'No. 1,000,000' : 'Patent No. 1,000,000', W - 44 * s, y);
    ctx.textAlign = 'center'; ctx.font = K.font(28 * s, SERIF, 400, 'italic'); ctx.fillText(sheetNo, W / 2, y + (P ? 44 : 0) * s);
    ctx.restore();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const scene2 = t >= 8.25;
      header(ctx, W, H, s, P, scene2 ? '2 Sheets, Sheet 2' : '2 Sheets, Sheet 1', 1);
      if (!scene2) {
        if (P) { style.title(ctx, 'ONE VIDEO.', W / 2, H * 0.15, K.beat(t, 0.1, 0.7, 'lin'), { size: 58, align: 'center' });
          style.title(ctx, 'EVERY PLATFORM.', W / 2, H * 0.195, K.beat(t, 0.8, 0.9, 'lin'), { size: 58, align: 'center' }); }
        else style.title(ctx, 'ONE VIDEO. EVERY PLATFORM.', W / 2, Lo.title[1] - 30 * s, K.beat(t, 0.1, 1.6, 'lin'), { size: 46, align: 'center' });
        if (!P) style.label(ctx, 'Filed by Creator OS', W / 2, Lo.title[1] + 14 * s, K.beat(t, 1.2, 0.6, 'lin'), { align: 'center', italic: true, size: 30 });
        const [ax, ay, aw, ah] = Lo.fig1; const p1 = K.beat(t, 2.0, 1.3, 'lin');
        fig1(ctx, ax, ay, aw, ah, p1, t);
        numeral(ctx, 10, [ax - 30 * s, ay - 20 * s], [ax + aw * 0.12, ay + ah * 0.12], K.beat(t, 3.0, 0.4, 'lin'));
        style.title(ctx, 'FIG. 1.', ax + aw / 2, ay + ah * 1.25 + 56 * s, K.beat(t, 3.0, 0.3, 'lin'), { size: 40, align: 'center' });
        style.label(ctx, 'your video', ax + aw / 2, ay + ah * 1.25 + 96 * s, K.beat(t, 3.1, 0.5, 'lin'), { align: 'center', italic: true });
        const [bx, by, bw, bh] = Lo.fig2, d2 = Math.min(bw, bh) * 0.35;
        style.arrow(ctx, P ? [ax + aw + 20 * s, ay + ah * 0.45] : [ax + aw + 50 * s, ay + ah * 0.45], P ? [bx - 16 * s, by + bh * 0.5] : [bx - 20 * s, by + bh * 0.5], K.beat(t, 3.4, 0.6, 'lin'), {});
        fig2(ctx, bx, by, bw, bh, K.beat(t, 4.0, 1.0, 'lin'), t);
        numeral(ctx, 20, [bx + bw * 0.5, by - d2 * 0.5 - 40 * s], [bx + bw * 0.5, by - d2 * 0.25], K.beat(t, 4.6, 0.4, 'lin'));
        style.title(ctx, 'FIG. 2.', bx + bw / 2, by + bh + 56 * s, K.beat(t, 4.7, 0.3, 'lin'), { size: 40, align: 'center' });
        style.label(ctx, 'Creator OS', bx + bw / 2, by + bh + 98 * s, K.beat(t, 4.8, 0.4, 'lin'), { align: 'center', size: 36 });
        // outputs: ruled arrows from the ports to numbered parts
        const port = P ? [W / 2, by + bh + 120 * s] : [bx + bw + d2 * 0.8 + 10 * s, by + bh * 0.5 - d2 * 0.25];
        if (P) style.arrow(ctx, port, [W / 2, Lo.chips[6][1] + 6 * s], K.beat(t, 4.95, 0.5, 'lin'), {});
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'lin');
          if (P) style.arrow(ctx, [W / 2, cy - 10 * s], [left ? W * 0.465 : W * 0.535, cy - 10 * s], p, {});
          else style.arrow(ctx, port, [cx - 90 * s, cy - 10 * s], p, { bend: 0 });
          const lp = K.beat(t, t0 + 0.2, 0.35, 'lin'); const num = 30 + i * 2;
          if (P) style.label(ctx, (left ? name + '  ' + num : num + '  ' + name), left ? W * 0.44 : W * 0.56, cy, lp, { align: left ? 'right' : 'left', size: 34 });
          else { style.label(ctx, String(num), cx - 80 * s, cy, lp, { size: 30 }); style.label(ctx, name, cx - 20 * s, cy, lp, { size: 34 }); }
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        // sheet 2: FIG. 2 small at the head, FIG. 3 the odometer, signatures at the foot
        const bw = P ? W * 0.3 : 170 * s, bh = bw * 0.6, bx = W / 2 - bw / 2 - bw * 0.15, by = P ? H * 0.14 : 120 * s;
        fig2(ctx, bx, by, bw, bh, 1, t);
        if (P) style.label(ctx, 'Creator OS', W / 2, by + bh + 60 * s, 1, { size: 36, align: 'center' }); else style.label(ctx, 'Creator OS', W / 2 + bw * 0.75, by + bh * 0.6, 1, { size: 34 });
        const cy = P ? H * 0.45 : 380 * s;
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, v, W / 2, cy, 1, { size: P ? 70 : 76 });
        style.title(ctx, 'FIG. 3.', W / 2, cy + (P ? 150 : 112) * s, K.beat(t, 8.7, 0.3, 'lin'), { size: 40, align: 'center' });
        style.label(ctx, 'views', W / 2, cy + (P ? 192 : 150) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', italic: true, size: 36 });
        style.emphasis(ctx, W / 2, cy - 20 * s, (P ? 225 : 300) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: P ? 0.42 : 0.31 });
        const ty = P ? H * 0.7 : 598 * s, tp = K.beat(t, 10.5, 0.9, 'lin');
        if (P) { style.title(ctx, 'POST ONCE.', W / 2, ty, K.clamp(tp * 2), { size: 50, align: 'center' }); style.title(ctx, 'REACH EVERYWHERE.', W / 2, ty + 72 * s, K.clamp(tp * 2 - 1), { size: 50, align: 'center' }); }
        else style.title(ctx, 'POST ONCE. REACH EVERYWHERE.', W / 2, ty, tp, { size: 44, align: 'center' });
        // inventor's signature, inked last
        const sp = K.beat(t, 11.0, 0.8, 'lin');
        if (sp > 0) { ctx.save(); ctx.font = K.font((P ? 64 : 56) * s, SIGN, 400); ctx.fillStyle = C.ink; ctx.textAlign = 'right';
          const sx = W - 60 * s, sy = P ? H * 0.9 : 690 * s; const sw = ctx.measureText('Creator OS').width + 20 * s; ctx.beginPath(); ctx.rect(sx - sw, sy - 80 * s, sw * sp, 120 * s); ctx.clip(); ctx.fillText('Creator OS', sx, sy); ctx.restore();
          if (P) style.label(ctx, 'INVENTOR.', W - 60 * s, H * 0.9 - 90 * s, 1, { align: 'right', size: 28 }); else style.label(ctx, 'INVENTOR.', W - 400 * s, 690 * s, 1, { align: 'right', size: 28 }); }
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      k.play('type', 0.1, { dur: 1.6, gain: 0.8 }); k.play('type', 1.2, { dur: 0.6, gain: 0.5 });
      k.play('scribble', 2.0, { medium: 'pen', dur: 1.3 }); k.play('tick', 3.05); k.play('type', 3.1, { dur: 0.5, gain: 0.6 });
      k.play('scribble', 3.4, { medium: 'pen', dur: 0.6 }); k.play('scribble', 4.0, { medium: 'pen', dur: 1.0 }); k.play('tick', 4.75); k.play('type', 4.8, { dur: 0.4, gain: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.28, gain: 0.7 }); k.play('tick', 5.22 + i * 0.4, { pitch: 1 + i * 0.04 }); k.play('type', 5.25 + i * 0.4, { dur: 0.25, gain: 0.5 }); }
      k.play('paper', 7.6, { dur: 0.9 }); k.play('paper', 8.3, { dur: 0.5, gain: 0.7 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('scribble', 10.0, { medium: 'pencil', dur: 0.6 }); k.play('stamp', 10.6, { gain: 0.6 });
      k.play('type', 10.5, { dur: 0.9, gain: 0.7 }); k.play('scribble', 11.0, { medium: 'pen', dur: 0.8 }); k.play('chime', 11.5, { note: 'E5' });
    },
  };
  MS.register(style);
})();
