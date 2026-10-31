// Editorial Essay Collage (Popular Explainer Looks). The animated-essay collage: warm grainy paper, a flat red colour
// block, archival halftone prints with torn white borders and soft shadows, newspaper clippings in serif type,
// masking tape, a translucent yellow highlighter sweep, red marker rings and big cut-out condensed headlines.
// Cutouts move on 12 fps steps while the camera pushes smoothly.
(function () {
  const C = { paper: '#ece2cf', paperD: '#d9ccb2', clip: '#f3ecdc', ink: '#1b1a18', red: '#cf3b2c', yellow: '#f4d03f', tape: '#e9dfc0', grey: '#8b857a' };
  const HEAD = 'Anton', SERIF = 'Libre Caslon Text';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  const step = (t) => Math.floor(t * 12) / 12;          // 12 fps hand-animated steps
  const stepP = (p) => Math.floor(K.clamp(p) * 8) / 8;

  // torn paper outline: jagged points around a rect
  function torn(x, y, w, h, seed, amp) {
    const r = K.rng(seed), pts = [], seg = (ax, ay, bx, by) => { const n = Math.max(4, Math.round(Math.hypot(bx - ax, by - ay) / (amp * 2.2))); for (let i = 0; i < n; i++) { const k = i / n; pts.push([K.lerp(ax, bx, k) + (r() - 0.5) * amp * (ay === by ? 0.4 : 1), K.lerp(ay, by, k) + (r() - 0.5) * amp * (ax === bx ? 0.4 : 1)]); } };
    seg(x, y, x + w, y); seg(x + w, y, x + w, y + h); seg(x + w, y + h, x, y + h); seg(x, y + h, x, y); return pts;
  }
  function shadowed(ctx, s, fn, d = 8) { ctx.save(); ctx.shadowColor = 'rgba(40,25,10,0.38)'; ctx.shadowBlur = 14 * s; ctx.shadowOffsetX = d * 0.4 * s; ctx.shadowOffsetY = d * s; fn(); ctx.restore(); }
  function tape(ctx, x, y, w, ang, s, seed) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
    const pts = torn(-w / 2, -12 * s, w, 24 * s, seed, 3 * s);
    K.poly(ctx, pts, true); ctx.fillStyle = 'rgba(236,226,196,0.82)'; ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(-w / 2, -12 * s, w, 6 * s);
    ctx.restore();
  }
  // halftone "archival photo" tile: dot screen whose dot size follows a soft noise image
  function halftone(w, h, seed, s) {
    return K.cached(`ec-ht:${w | 0}x${h | 0}:${seed}`, () => {
      const c = K.layer(w, h), x = c.getContext('2d'), nz = K.noise(seed), g = Math.max(4, 5.5 * s);
      x.fillStyle = '#e9e3d6'; x.fillRect(0, 0, w, h); x.fillStyle = '#1d1c1a';
      for (let yy = 0; yy < h + g; yy += g) for (let xx = (yy / g) % 2 ? g / 2 : 0; xx < w + g; xx += g) {
        const u = xx / w, v = yy / h, vig = Math.hypot(u - 0.5, v - 0.55) * 1.3;
        const lum = 0.5 + nz.fbm2(u * 3, v * 3, 3) * 0.9 - vig * 0.6 + (v > 0.65 ? -0.2 : 0);
        const rad = g * 0.62 * Math.sqrt(K.clamp(1 - lum)); if (rad > 0.3) { x.beginPath(); x.arc(xx, yy, rad, 0, TAU); x.fill(); }
      }
      return c;
    });
  }
  function fakeText(ctx, x, y, w, lines, s, seed) {
    const r = K.rng(seed); ctx.fillStyle = 'rgba(30,28,25,0.55)';
    for (let i = 0; i < lines; i++) { const lw = i === lines - 1 ? w * r.range(0.3, 0.7) : w * r.range(0.88, 1); let cx = x; while (cx < x + lw) { const ww = r.range(10, 34) * s; ctx.fillRect(cx, y + i * 13 * s, Math.min(ww, x + lw - cx), 4.5 * s); cx += ww + 5 * s; } }
  }

  const style = {
    id: 'editorial-collage', name: 'Editorial Essay Collage', family: 'Popular Explainer Looks',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Anton&family=Libre+Caslon+Text:ital,wght@0,400;0,700;1,400&display=block', specs: ['400 60px "Anton"', '700 32px "Libre Caslon Text"', 'italic 400 28px "Libre Caslon Text"'] }],
    palette: C,
    sfx: { draw: 'marker', land: 'paper', emphasis: 'stamp', transition: 'whoosh', bed: 'vinyl' },

    background(ctx, W, H, t) {
      const bg = K.cached(`ec-bg:${W}x${H}`, () => {
        const s = S(W, H), c = K.layer(W, H), x = c.getContext('2d'), P = H > W;
        x.drawImage(K.paperTex(W, H, C.paper, 21, 0.09, false), 0, 0);
        // flat red colour block, torn on its leading edge
        const bx = P ? 0 : W * 0.66, by = P ? H * 0.58 : 0, bw = P ? W : W * 0.34, bh = P ? H * 0.42 : H;
        const pts = torn(bx, by, bw + 40 * s, bh + 40 * s, 5, 7 * s);
        shadowed(x, s, () => { K.poly(x, pts, true); x.fillStyle = C.red; x.fill(); }, 4);
        x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.drawImage(K.paperTex(W, H, '#ffffff', 22, 0.12, false), 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        // old clipping peeking from a corner + stray tape
        x.save(); x.translate(-30 * s, -20 * s); x.rotate(-0.05);
        shadowed(x, s, () => { K.poly(x, torn(0, 0, 260 * s, 150 * s, 9, 5 * s), true); x.fillStyle = C.clip; x.fill(); });
        x.fillStyle = C.ink; x.font = K.font(22 * s, SERIF, 700); x.fillText('a machine that', 50 * s, 60 * s); fakeText(x, 50 * s, 80 * s, 180 * s, 4, s, 3);
        x.restore();
        return c;
      });
      ctx.drawImage(bg, 0, 0);
    },

    finish(ctx, W, H, t) {
      // paper grain on 12 fps, warm print vignette, faint dust specks
      K.grain(ctx, W, H, step(t), 0.09, 12, 'overlay');
      // dust specks and fibres that change every 12 fps step
      const r = K.rng(Math.floor(t * 12) + 3), s = S(W, H); ctx.save();
      for (let i = 0; i < 26; i++) { ctx.fillStyle = i % 3 ? 'rgba(40,30,20,0.35)' : 'rgba(255,250,235,0.5)'; ctx.fillRect(r() * W, r() * H, r.range(1, 3) * s, r.range(1, 3) * s); }
      ctx.restore();
      K.vignette(ctx, W, H, 0.3, '#3a2410');
    },

    // big cut-out condensed headline: each line on its own black paper strip with torn ends, slid in on steps
    title(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 64) * s, lines = o.lines || [text];
      ctx.save(); ctx.font = K.font(size, HEAD, 400);
      lines.forEach((ln, i) => {
        const lp = stepP((p - i * 0.3) / 0.7); if (lp <= 0) return;
        const txt = ln.toUpperCase(), tw = ctx.measureText(txt).width, w = tw + size * 0.5, h = size * 1.22;
        const off = o.offsets ? o.offsets[i] : 0;
        const lx = (o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x) + off, ly = y + i * h * 1.04;
        const slide = (1 - K.ease.out(lp)) * (i % 2 ? 1 : -1) * 300 * s, rot = (i % 2 ? 0.012 : -0.016);
        ctx.save(); ctx.translate(lx + slide + w / 2, ly); ctx.rotate(rot);
        const inv = o.inverse ? o.inverse[i] : false, hi = o.highlight ? o.highlight[i] : false;
        shadowed(ctx, s, () => { K.poly(ctx, torn(-w / 2, -h * 0.8, w, h, 30 + i + (o.seed || 0), 4 * s), true); ctx.fillStyle = hi ? C.yellow : inv ? C.clip : C.ink; ctx.fill(); });
        ctx.fillStyle = hi || inv ? C.ink : '#f6f1e6'; ctx.textAlign = 'center'; ctx.fillText(txt, 0, h * 0.1);
        ctx.restore();
      });
      ctx.restore();
    },

    // newspaper clipping: serif type on torn newsprint with a strip of masking tape
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 30) * s, q = stepP(p);
      ctx.save(); ctx.font = K.font(size, SERIF, 700, o.italic ? 'italic' : '');
      const tw = ctx.measureText(text).width, w = tw + size * 0.9, h = size * 1.6;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, rot = ((o.seed || 1) % 5 - 2) * 0.012;
      const drop = (1 - q) * 50 * s;
      ctx.globalAlpha = K.clamp(q * 4); ctx.translate(x0 + w / 2, y - drop); ctx.rotate(rot);
      shadowed(ctx, s, () => { K.poly(ctx, torn(-w / 2, -h / 2, w, h, 60 + (o.seed || 1), 3 * s), true); ctx.fillStyle = o.fill || C.clip; ctx.fill(); }, 5);
      if (o.mark) { ctx.fillStyle = 'rgba(244,208,63,0.7)'; ctx.fillRect(-tw / 2 - 4 * s, -size * 0.25, (tw + 8 * s) * K.clamp((p - 0.4) / 0.6), size * 0.55); }
      ctx.fillStyle = o.color || C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, 2 * s);
      if (o.tape !== false) tape(ctx, -w / 2 + 8 * s, -h / 2 + 2 * s, 46 * s, -0.6, s, 70 + (o.seed || 1));
      ctx.restore(); return { w, h };
    },

    // thin ink route line (dashed) with a pin dot at the start and a small chevron head
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.12, 40), 1 * s, o.seed || 2), q = stepP(p), col = o.color || C.ink;
      ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(from[0], from[1], 5 * s, 0, TAU); ctx.fill();
      ctx.setLineDash(o.solid ? [] : [10 * s, 6 * s]);
      const end = K.drawOn(ctx, pts, q, { strokeStyle: col, lineWidth: (o.width || 2.6) * s, lineCap: 'butt' });
      ctx.setLineDash([]);
      if (q >= 1) K.arrowHead(ctx, pts, 14 * s, { strokeStyle: col, lineWidth: (o.width || 2.6) * s });
      ctx.restore(); return end;
    },

    // archival halftone print with a torn white border, soft shadow and taped corners
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), q = stepP(p), b = 12 * s;
      ctx.save(); const drop = (1 - K.ease.out(q)) * 120 * s, rot = o.rot ?? -0.02;
      ctx.translate(x + w / 2, y + h / 2 - drop); ctx.rotate(rot + (1 - q) * 0.1); ctx.translate(-w / 2, -h / 2);
      shadowed(ctx, s, () => { K.poly(ctx, torn(-b, -b, w + b * 2, h + b * 2, 80 + (o.seed || 0), 4 * s), true); ctx.fillStyle = '#f7f3ea'; ctx.fill(); }, 10);
      ctx.drawImage(halftone(w, h, (o.seed || 0) + 3, s), 0, 0, w, h);
      if (o.inner) o.inner(ctx, w, h);
      tape(ctx, 6 * s, -4 * s, 70 * s, -0.7, s, 90 + (o.seed || 0)); tape(ctx, w - 6 * s, h + 4 * s, 70 * s, -0.7, s, 95 + (o.seed || 0));
      ctx.restore();
    },

    // re-cut condensed numerals, each glyph on its own paper scrap
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 110) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, HEAD, 400);
      const ws = [...txt].map((ch) => ctx.measureText(ch).width + (ch === ',' ? 0 : size * 0.16)), tot = ws.reduce((a, b) => a + b, 0);
      let cx = (o.align === 'left' ? x : x - tot / 2);
      [...txt].forEach((ch, i) => {
        const r = K.rng(i * 13 + 7), w = ws[i], rot = (r() - 0.5) * 0.09, dy = (r() - 0.5) * 8 * s, kind = i % 3;
        ctx.save(); ctx.translate(cx + w / 2, y + dy); ctx.rotate(rot);
        if (ch !== ',') shadowed(ctx, s, () => { K.poly(ctx, torn(-w / 2, -size * 0.82, w, size * 0.98, 100 + i, 3 * s), true); ctx.fillStyle = kind === 0 ? C.clip : kind === 1 ? C.ink : C.yellow; ctx.fill(); }, 5);
        ctx.fillStyle = ch === ',' ? C.ink : kind === 1 ? '#f6f1e6' : C.ink; ctx.textAlign = 'center'; ctx.fillText(ch, 0, size * 0.06);
        ctx.restore(); cx += w;
      });
      ctx.restore();
    },

    // red marker ring, hand drawn with an overshoot loop (o.mode 'highlight' sweeps a highlighter bar instead)
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height);
      if (o.mode === 'highlight') { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(244,208,63,0.75)'; ctx.fillRect(x - r, y - (o.h || 30) * s / 2, 2 * r * K.ease.out(p), (o.h || 30) * s); ctx.restore(); return; }
      const pts = K.wobble(K.circlePts(x, y, r, o.ry || r * 0.62, 90, -2.3, Math.PI * 2.2), 4 * s, o.seed || 4);
      ctx.save(); ctx.globalAlpha = 0.9;
      K.drawOn(ctx, pts, K.ease.inOut(p), { strokeStyle: C.red, lineWidth: 7 * s });
      ctx.globalAlpha = 0.35; K.drawOn(ctx, pts.map(([a, b]) => [a + 2 * s, b + 1.5 * s]), K.ease.inOut(p), { strokeStyle: C.red, lineWidth: 3 * s });
      ctx.restore();
    },

    // a new paper sheet slides up on 12 fps steps with a blurred whip (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), q = Math.floor(p * 14) / 14, y = K.lerp(H * 1.05, -H * 1.25, K.ease.inOut(q)), sh = H * 1.2;
      ctx.save(); ctx.translate(0, y); ctx.rotate(-0.015);
      const sheet = K.cached(`ec-sheet:${W}x${H}`, () => { const c = K.layer(W * 1.1, sh), x = c.getContext('2d'); K.poly(x, torn(0, 10 * s, W * 1.1, sh - 10 * s, 120, 8 * s), true); x.clip(); x.drawImage(K.paperTex(Math.ceil(W * 1.1), Math.ceil(sh), '#f1e8d6', 31, 0.1, false), 0, 0); return c; });
      ctx.shadowColor = 'rgba(40,25,10,0.45)'; ctx.shadowBlur = 30 * s; ctx.shadowOffsetY = -10 * s;
      ctx.drawImage(sheet, -W * 0.05, 0); ctx.shadowColor = 'transparent';
      // whip blur streaks while moving fast
      const v = Math.sin(Math.PI * p); ctx.globalAlpha = 0.25 * v; ctx.fillStyle = C.ink;
      const r = K.rng(Math.floor(p * 14)); for (let i = 0; i < 18; i++) ctx.fillRect(r() * W, r() * sh, 2 * s, r.range(80, 260) * s);
      ctx.restore();
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [70 * s, 105 * s], video: [90 * s, 300 * s, 250 * s, 190 * s], node: [430 * s, 300 * s, 330 * s, 220 * s],
      chips: PLATFORMS.map((n, i) => [1060 * s, (100 + i * 82) * s]), counter: [480 * s, 380 * s], take: [70 * s, 560 * s] };
    return { s, P: true, title: [W * 0.06, H * 0.075], video: [W * 0.27, H * 0.15, W * 0.46, H * 0.12], node: [W * 0.17, H * 0.335, W * 0.66, H * 0.15],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.63 + Math.floor(i / 2) * 0.07)]), counter: [W / 2, H * 0.34], take: [W * 0.06, H * 0.7] };
  }
  function clipping(ctx, x, y, w, h, p, s, t) {
    // the Creator OS node: a newspaper clipping with a headline and a highlighter sweep
    if (p <= 0) return;
    const q = stepP(p), drop = (1 - K.ease.out(q)) * 100 * s;
    ctx.save(); ctx.translate(x + w / 2, y + h / 2 - drop); ctx.rotate(0.015); ctx.translate(-w / 2, -h / 2);
    shadowed(ctx, s, () => { K.poly(ctx, torn(0, 0, w, h, 140, 4 * s), true); ctx.fillStyle = C.clip; ctx.fill(); }, 10);
    ctx.fillStyle = C.grey; ctx.font = K.font(14 * s, SERIF, 700); ctx.fillText('TECHNOLOGY  •  TODAY', 20 * s, 30 * s);
    ctx.fillStyle = C.ink; ctx.font = K.font(54 * s, SERIF, 700); ctx.fillText('Creator OS', 20 * s, 88 * s);
    ctx.font = K.font(22 * s, SERIF, 400, 'italic');
    const hl = K.clamp((t - 4.6) / 0.6);
    if (hl > 0) { ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = 'rgba(244,208,63,0.8)'; ctx.fillRect(18 * s, 102 * s, Math.min(w - 36 * s, 290 * s) * K.ease.out(hl), 28 * s); ctx.restore(); }
    ctx.fillText('posts one video everywhere', 20 * s, 122 * s);
    fakeText(ctx, 20 * s, 146 * s, w - 40 * s, Math.max(1, Math.floor((h - 160 * s) / (13 * s))), s, 8);
    tape(ctx, w / 2, -2 * s, 90 * s, 0.05, s, 150);
    ctx.restore();
  }
  function playInner(ctx, w, h) {
    ctx.fillStyle = 'rgba(247,243,234,0.92)'; ctx.beginPath(); ctx.moveTo(w * 0.42, h * 0.32); ctx.lineTo(w * 0.62, h * 0.5); ctx.lineTo(w * 0.42, h * 0.68); ctx.closePath(); ctx.fill();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, ts = step(t);
      // smooth camera push through the collage (the cutouts themselves step)
      ctx.save(); const z = 1 + t * 0.006; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      style.background(ctx, W, H, t);
      if (t < 8.3) {
        const [vx, vy, vw, vh] = Lo.video, [nx, ny, nw, nh] = Lo.node;
        style.box(ctx, vx, vy, vw, vh, K.beat(ts, 2.0, 0.6, 'lin'), { inner: playInner, seed: 1, rot: -0.035 });
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 50 * s, K.beat(ts, 2.6, 0.4, 'lin'), { align: 'center', italic: true, seed: 2 });
        const a1 = P ? [[W / 2, vy + vh + 90 * s], [W / 2, ny - 20 * s]] : [[vx + vw + 14 * s, vy + 60 * s], [nx - 12 * s, ny + 50 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(ts, 3.3, 0.7, 'lin'), { bend: P ? 0 : -0.2, color: C.red, solid: true, width: 4 });
        clipping(ctx, nx, ny, nw, nh, K.beat(ts, 4.0, 0.6, 'lin'), s, ts);
        if (P) style.arrow(ctx, [W / 2, ny + nh + 30 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(ts, 4.9, 0.5, 'lin'), {});
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy] : [nx + nw + 10 * s, ny + nh * 0.5], to = P ? [left ? W * 0.465 : W * 0.535, cy] : [cx - 120 * s, cy];
          style.arrow(ctx, from, to, K.beat(ts, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.04, seed: 10 + i });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(ts, t0 + 0.3, 0.25, 'lin'), { size: P ? 26 : 28, align: P ? (left ? 'right' : 'left') : 'center', seed: 20 + i, tape: i % 2 === 0 });
        });
        style.title(ctx, '', Lo.title[0], Lo.title[1], K.beat(ts, 0.15, 1.2, 'lin'), { lines: ['One video.', 'Every platform.'], size: P ? 58 : 72, offsets: [0, P ? 120 * s : 180 * s], highlight: [false, true] });
      } else {
        const [cx, cy] = Lo.counter;
        clipping(ctx, P ? W * 0.17 : 70 * s, P ? H * 0.12 : 130 * s, P ? W * 0.66 : 340 * s, (P ? 170 : 150) * s, 1, s, 99);
        const v = K.count(t, 8.6, 1.5, 0, 1000000);
        const cX = P ? cx : W * 0.5 + 130 * s, cY = P ? H * 0.42 : 310 * s;
        style.counter(ctx, Math.round(v / 1000) * 1000, cX, cY, 1, { size: P ? 84 : 100 });
        style.label(ctx, 'views, in the first week', cX, cY + (P ? 115 : 112) * s, K.beat(ts, 8.8, 0.4, 'lin'), { align: 'center', italic: true, seed: 40, size: P ? 26 : 28 });
        style.emphasis(ctx, cX, cY - 28 * s, (P ? 360 : 380) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: (P ? 100 : 104) * s });
        style.title(ctx, '', Lo.take[0], Lo.take[1], K.beat(ts, 10.5, 0.8, 'lin'), { lines: ['Post once.', 'Reach everywhere.'], size: P ? 56 : 66, offsets: [0, P ? 40 * s : 200 * s], inverse: [false, false], highlight: [false, true], seed: 9 });
      }
      ctx.restore();
      if (t > 7.6 && t < 9.0) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.4));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('vinyl', 0, 12, 1);
      k.play('paper', 0.15, { dur: 0.3 }); k.play('thud', 0.3, { gain: 0.4 }); k.play('paper', 0.75, { dur: 0.3 }); k.play('thud', 0.9, { gain: 0.4 });
      k.play('paper', 2.0, { dur: 0.4 }); k.play('thud', 2.5, { gain: 0.3 }); k.play('paper', 2.6, { dur: 0.25 });
      k.play('scribble', 3.3, { medium: 'marker', dur: 0.7 });
      k.play('paper', 4.0, { dur: 0.4 }); k.play('thud', 4.5, { gain: 0.3 }); k.play('scribble', 4.6, { medium: 'marker', dur: 0.6, gain: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.3, gain: 0.5 }); k.play('paper', 5.3 + i * 0.4, { dur: 0.15 }); }
      k.play('whoosh', 7.6, { dur: 0.9 }); k.play('paper', 7.9, { dur: 0.5 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('scribble', 10.0, { medium: 'marker', dur: 0.6 }); k.play('stamp', 10.6, { gain: 0.6 });
      k.play('paper', 10.5, { dur: 0.3 }); k.play('paper', 10.9, { dur: 0.3 }); k.play('chime', 11.4, { note: 'A5' });
    },
  };
  MS.register(style);
})();
