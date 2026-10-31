// 16-Bit Pixel Odyssey (Retro Digital). A SNES-era cutscene drawn on a true low-res grid (320x180 landscape at 4x,
// 360x640 portrait at 3x) and blown up nearest-neighbour: banded dusk sky with checkerboard dither between bands,
// parallax hills and city in whole-pixel steps, a strict palette, aliased Press Start 2P lettering (alpha thresholded,
// never anti-aliased), blue RPG windows with a white bevel, a typing dialog box, and the SNES mosaic + 16-step fade.
(function () {
  const C = {
    ink: '#0b0b1e', night: '#1a1640', navy: '#24205a', violet: '#3d2a78', plum: '#6a3088', mag: '#a83a8a', rose: '#d8506e',
    coral: '#f07a5a', peach: '#f8b070', sun: '#fde08a', sunHi: '#fff4c0', hill1: '#4a2a6e', hill2: '#2c1d52', city: '#191438',
    win: '#ffd86a', winC: '#6ae0ff', road: '#14112c', rail: '#3a3266', white: '#f4f4ff', cream: '#fff1c8', gold: '#ffd23a',
    boxA: '#2a46b8', boxB: '#20378f', boxC: '#182a6e', edge: '#c8d4ff', red: '#e83a4a', green: '#5ad86a', cyan: '#6ae0ff',
  };
  const FONT = 'Press Start 2P';
  const snap = (v) => Math.round(v);
  const S = (ctx) => K.layout(ctx.canvas.width, ctx.canvas.height).s;

  // ---------- crisp pixel primitives (no anti-aliasing anywhere) ----------
  // Text: rendered once at a multiple of 8px, alpha thresholded to hard pixels, tinted, cached.
  function glyphs(text, size, color) {
    return K.cached(`p16:${size}:${color}:${text}`, () => {
      const w = Math.max(1, text.length * size), h = size + 2, c = K.layer(w, h), x = c.getContext('2d');
      x.font = `${size}px "${FONT}"`; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(text, 0, 0);
      const im = x.getImageData(0, 0, w, h), d = im.data, [r, g, b] = K.hex(color);
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= 120) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; } else d[i + 3] = 0; }
      x.putImageData(im, 0, 0); return c;
    });
  }
  const pxSize = (size) => Math.max(8, Math.round(size / 8) * 8);
  // y = top of the text
  function pxText(ctx, text, x, y, size, color, align = 'left', shadow = C.ink) {
    size = pxSize(size); if (!text) return 0;
    const w = text.length * size, x0 = snap(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x), y0 = snap(y), o = size / 8;
    if (shadow) ctx.drawImage(glyphs(text, size, shadow), x0 + o, y0 + o);
    ctx.drawImage(glyphs(text, size, color), x0, y0);
    return w;
  }
  const fitSize = (text, size, maxW) => { let z = pxSize(size); while (z > 8 && text.length * z > maxW) z -= 8; return z; };
  function px(ctx, x, y, w, h, col) { ctx.fillStyle = col; ctx.fillRect(snap(x), snap(y), Math.max(1, snap(w)), Math.max(1, snap(h))); }
  // Bresenham line, t px thick, optional dot pattern
  function pxLine(ctx, x0, y0, x1, y1, col, t = 1, dash = 0) {
    x0 = snap(x0); y0 = snap(y0); x1 = snap(x1); y1 = snap(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, i = 0;
    ctx.fillStyle = col;
    for (;;) { if (!dash || (i % dash) < dash / 2) ctx.fillRect(x0, y0, t, t); i++; if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  function pxDisc(ctx, cx, cy, r, col, cut) { ctx.fillStyle = col; for (let y = -r; y <= r; y++) { if (cut && cut(y)) continue; const w = Math.floor(Math.sqrt(r * r - y * y)); ctx.fillRect(snap(cx - w), snap(cy + y), w * 2 + 1, 1); } }
  // RPG window: dark outline, white bevel, banded blue body, notched corners
  function windowBox(ctx, x, y, w, h, o = {}) {
    x = snap(x); y = snap(y); w = snap(w); h = snap(h); if (w < 6 || h < 6) return;
    px(ctx, x + 1, y, w - 2, h, C.ink); px(ctx, x, y + 1, w, h - 2, C.ink);
    px(ctx, x + 2, y + 1, w - 4, h - 2, C.edge); px(ctx, x + 1, y + 2, w - 2, h - 4, C.edge);
    const bands = [o.a || C.boxA, o.b || C.boxB, o.c || C.boxC], ih = h - 6;
    for (let i = 0; i < 3; i++) px(ctx, x + 3, y + 3 + Math.floor((ih * i) / 3), w - 6, Math.ceil(ih / 3) + 1, bands[i]);
    // checker dither on each band seam
    ctx.fillStyle = bands[1]; for (let xx = x + 3; xx < x + w - 3; xx += 2) ctx.fillRect(xx, y + 3 + Math.floor(ih / 3) - 1, 1, 1);
    ctx.fillStyle = bands[2]; for (let xx = x + 4; xx < x + w - 3; xx += 2) ctx.fillRect(xx, y + 3 + Math.floor((2 * ih) / 3) - 1, 1, 1);
    px(ctx, x + 3, y + 3, w - 6, 1, 'rgba(255,255,255,0.25)');
  }
  function playIcon(ctx, cx, cy, r, col) { ctx.fillStyle = col; const w = Math.round(r * 1.5); for (let i = 0; i <= w; i++) { const hh = Math.round(r * (1 - i / w)); ctx.fillRect(snap(cx - w / 2 + i), snap(cy - hh), 1, hh * 2 + 1); } }
  const HERO = ['..rrrr..', '.rrrrrr.', '.ssffss.', '.sfeefs.', '..ffff..', '.bbbbbb.', 'fbbbbbbf', '.bbbbbb.', '..jjjj..', '..j..j..'];
  const HERO2 = ['..rrrr..', '.rrrrrr.', '.ssffss.', '.sfeefs.', '..ffff..', '.bbbbbb.', 'fbbbbbbf', '.bbbbbb.', '..jjjj..', '.j....j.'];
  const HC = { r: C.rose, s: '#3a2030', f: '#f8c8a0', e: C.ink, b: '#3a6ad8', j: '#2a2a5a' };
  function sprite(ctx, rows, x, y, map) { rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') px(ctx, x + i, y + j, 1, 1, map[row[i]]); }); }

  // ---------- buffer + geometry ----------
  function buf(W, H) {
    const por = H > W, k = por ? 3 : 4, bw = Math.round(W / k), bh = Math.round(H / k);
    return K.cached(`p16-buf:${W}x${H}`, () => ({ c: K.layer(bw, bh), bw, bh, k, por }));
  }
  function sky(bw, bh, por) {
    return K.cached(`p16-sky:${bw}x${bh}`, () => {
      const c = K.layer(bw, bh), x = c.getContext('2d'), stops = [C.night, C.navy, C.violet, C.plum, C.mag, C.rose, C.coral, C.peach];
      const horizon = por ? bh * 0.73 : bh * 0.72, band = horizon / stops.length;
      for (let i = 0; i < stops.length; i++) {
        const y0 = Math.floor(i * band); x.fillStyle = stops[i]; x.fillRect(0, y0, bw, Math.ceil(band) + 1);
        if (i) { x.fillStyle = stops[i - 1]; for (let yy = 0; yy < 2; yy++) for (let xx = (yy % 2); xx < bw; xx += 2) x.fillRect(xx, y0 + yy, 1, 1); }
      }
      x.fillStyle = C.peach; x.fillRect(0, Math.floor(horizon), bw, bh);
      const r = K.rng(16); // still stars, hand placed by the seed
      for (let i = 0; i < 40; i++) { x.fillStyle = r() > 0.7 ? C.cream : '#9a8ad0'; x.fillRect(r.int(0, bw), r.int(0, Math.floor(horizon * 0.35)), 1, 1); }
      // wispy banded clouds
      for (let i = 0; i < 5; i++) { const cy = r.int(Math.floor(horizon * 0.25), Math.floor(horizon * 0.75)), cx = r.int(0, bw), w = r.int(24, 60); x.fillStyle = r() > 0.5 ? C.rose : C.mag; x.fillRect(cx, cy, w, 2); x.fillRect(cx + 6, cy - 1, w - 14, 1); x.fillStyle = C.plum; x.fillRect(cx + 2, cy + 2, w - 4, 1); }
      return c;
    });
  }
  function scenery(ctx, bw, bh, t, por) {
    ctx.drawImage(sky(bw, bh, por), 0, 0);
    const horizon = Math.floor(por ? bh * 0.73 : bh * 0.72);
    // twinkling stars on whole frames (12 fps)
    const f = Math.floor(t * 12), r = K.rng(7);
    for (let i = 0; i < 10; i++) { const x = r.int(0, bw), y = r.int(0, Math.floor(horizon * 0.3)); if ((f + i * 3) % 9 < 4) { px(ctx, x, y, 1, 1, C.white); if ((f + i) % 9 === 0) { px(ctx, x - 1, y, 3, 1, C.cream); px(ctx, x, y - 1, 1, 3, C.cream); } } }
    // striped sun sitting on the horizon
    const sr = por ? 46 : 30, sx = por ? bw * 0.7 : bw * 0.78, sy = horizon - (por ? 30 : 16);
    pxDisc(ctx, sx, sy, sr, C.sun, (y) => y > 4 && y % 5 >= 3 - Math.floor(y / 16));
    pxDisc(ctx, sx, sy, sr - 4, C.sunHi, (y) => y > -4);
    const n = K.noise(4);
    // far hills, near city: parallax in whole-pixel steps
    const off1 = Math.floor(t * 3), off2 = Math.floor(t * 8);
    ctx.fillStyle = C.hill1;
    for (let x = 0; x < bw; x++) { const h = Math.floor(18 + 16 * n.fbm2((x + off1) * 0.02, 0.5, 3) + 10 * Math.abs(n.n2((x + off1) * 0.06, 2))); ctx.fillRect(x, horizon - h, 1, h); }
    ctx.fillStyle = C.hill2;
    for (let x = 0; x < bw; x++) { const h = Math.floor(8 + 10 * n.fbm2((x + off1 * 2) * 0.03, 5.5, 3)); ctx.fillRect(x, horizon - h, 1, h); }
    // city blocks with lit windows
    const rb = K.rng(99);
    for (let i = 0, x = -((off2) % 240); x < bw; i++) {
      const w = 10 + (i * 37) % 18, h = 14 + (i * 53) % 26; px(ctx, x, horizon - h, w, h + 2, C.city);
      for (let wy = horizon - h + 3; wy < horizon - 2; wy += 4) for (let wx = x + 2; wx < x + w - 2; wx += 3) if (((wx * 7 + wy * 13 + i) % 5) < 2) px(ctx, wx, wy, 1, 2, ((wx + wy) % 7) ? C.win : C.winC);
      x += w + 2 + (i % 3); if (i > 60) break;
    }
    // road + railing
    px(ctx, 0, horizon, bw, bh - horizon, C.road);
    px(ctx, 0, horizon + 1, bw, 1, C.rail);
    for (let x = -(off2 % 12); x < bw; x += 12) px(ctx, x, horizon - 5, 1, 6, C.rail);
    px(ctx, 0, horizon - 5, bw, 1, C.rail);
    for (let x = -((off2 * 2) % 24); x < bw; x += 24) px(ctx, x, horizon + Math.floor((bh - horizon) * 0.55), 10, 1, '#2c2660');
    return horizon;
  }

  const style = {
    id: 'pixel-16bit', name: '16-Bit Pixel Odyssey', family: 'Retro Digital',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=block', specs: ['8px "Press Start 2P"', '16px "Press Start 2P"'] }],
    palette: { bg: C.night, ...C },
    sfx: { draw: null, land: 'blip', emphasis: 'ding', transition: 'glitch', bed: 'tape' },
    pxText, pxLine, windowBox, buffer: buf,

    // On a full-size canvas the background is the scenery drawn on the pixel grid and blown up.
    background(ctx, W, H, t) {
      const B = buf(W, H), b = B.c.getContext('2d');
      if (ctx.canvas === B.c) { scenery(ctx, B.bw, B.bh, t, B.por); return; }
      scenery(b, B.bw, B.bh, t, B.por);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(B.c, 0, 0, W, H); ctx.restore();
    },
    // The display pass: whatever is on the canvas is snapped to the pixel grid (nearest neighbour, idempotent for
    // grid-aligned art), then the faint row gaps of a consumer CRT.
    finish(ctx, W, H, t) {
      const B = buf(W, H); if (ctx.canvas === B.c) return;
      const tmp = K.cached(`p16-tmp:${W}x${H}`, () => K.layer(B.bw, B.bh)), x = tmp.getContext('2d');
      x.imageSmoothingEnabled = false; x.clearRect(0, 0, B.bw, B.bh); x.drawImage(ctx.canvas, 0, 0, B.bw, B.bh);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, W, H);
      const rows = K.cached(`p16-rows:${W}x${H}`, () => { const c = K.layer(W, H), r = c.getContext('2d'); r.fillStyle = 'rgba(0,0,0,0.13)'; for (let y = B.k - 1; y < H; y += B.k) r.fillRect(0, y, W, 1); return c; });
      ctx.drawImage(rows, 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.22, '#000');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx), size = o.fit ? fitSize(text, (o.size || 64) * s, o.fit) : pxSize((o.size || 64) * s);
      const n = Math.floor(text.length * K.clamp(p));
      const w = text.length * size, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      pxText(ctx, text.slice(0, n), x0, y - size, size, o.color || C.white, 'left', o.shadow ?? C.ink);
      return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 30, ...o }); },
    // dotted chevron path, marching
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx), th = Math.max(1, Math.round(6 * s)), e = [K.lerp(from[0], to[0], K.clamp(p)), K.lerp(from[1], to[1], K.clamp(p))];
      if (p <= 0) return null;
      pxLine(ctx, from[0], from[1], e[0], e[1], o.color || C.gold, th, 4 * th);
      if (p >= 1) { const ang = Math.atan2(to[1] - from[1], to[0] - from[0]), L = 14 * s * 1.6; for (const sg of [-1, 1]) pxLine(ctx, to[0], to[1], to[0] - Math.cos(ang + sg * 0.7) * L, to[1] - Math.sin(ang + sg * 0.7) * L, o.color || C.gold, th); }
      return e;
    },
    // the window snaps open: grows from a 2px line in whole steps
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return; const k = Math.ceil(K.clamp(p) * 4) / 4, hh = Math.max(6, h * k);
      windowBox(ctx, x, y + (h - hh) / 2, w, hh, o);
    },
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx), size = pxSize((o.size || 96) * s), t = K.fmt(value);
      pxText(ctx, t, x, y - size, size, o.color || C.gold, o.align || 'center', C.ink);
      return { w: t.length * size, h: size };
    },
    // LEVEL UP sparkle: eight pixel rays shoot out in whole steps, then twinkle crosses
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx), k = Math.floor(K.clamp(p) * 8) / 8, col = o.color || C.cream;
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, r0 = r * (0.55 + 0.5 * k), r1 = r0 + 16 * s * 2 * (1 - k * 0.5);
        if (p > 0 && p < 1) pxLine(ctx, x + Math.cos(a) * r0, y + Math.sin(a) * r0 * 0.55, x + Math.cos(a) * r1, y + Math.sin(a) * r1 * 0.55, i % 2 ? C.gold : col, Math.max(1, Math.round(5 * s)), 0);
      }
      if (p > 0.2) { const r2 = K.rng(55); for (let i = 0; i < 10; i++) { const a = r2() * 6.283, d = r * (0.7 + r2() * 0.5), sx = x + Math.cos(a) * d, sy = y + Math.sin(a) * d * 0.5, on = (Math.floor(p * 20) + i) % 3; if (on) { px(ctx, sx - 2, sy, 5, 1, C.white); px(ctx, sx, sy - 2, 1, 5, C.white); } } }
    },
    // SNES mosaic: blocks grow while the brightness steps down in 16 levels, then back
    transition(ctx, W, H, p, o = {}) {
      const k = p < 0.5 ? p * 2 : (1 - p) * 2, m = 1 + Math.round(K.ease.in(k) * 15);
      if (m > 1) {
        const tw = Math.max(1, Math.ceil(W / m)), th = Math.max(1, Math.ceil(H / m));
        const tmp = K.cached(`p16-mos:${W}x${H}`, () => K.layer(W, H)), x = tmp.getContext('2d');
        x.imageSmoothingEnabled = false; x.clearRect(0, 0, W, H); x.drawImage(ctx.canvas, 0, 0, W, H, 0, 0, tw, th);
        ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, tw, th, 0, 0, tw * m, th * m); ctx.restore();
      }
      ctx.fillStyle = `rgba(0,0,0,${Math.floor(k * 16) / 16})`; ctx.fillRect(0, 0, W, H);
    },
  };

  // ---------- the shared demo as a SNES cutscene ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(bw, bh, por) {
    if (!por) return {
      dlg: [8, 116, 304, 58], name: [18, 122], lines: [[18, 136, 'ONE VIDEO.'], [18, 154, 'EVERY PLATFORM.']], lsz: 16,
      card: [10, 34, 66, 46], cardLbl: [43, 86], node: [100, 38, 92, 38], nodeTxt: [[146, 46, 'CREATOR'], [146, 58, 'OS']],
      chips: PLATFORMS.map((_, i) => [214, 6 + i * 19, 98, 16]), heroY: 118, heroX: [-12, 70],
      top: [112, 6, 96, 22], stat: [40, 38, 240, 72], cnt: [160, 80], views: [160, 88], take: [[18, 136, 'POST ONCE.'], [18, 154, 'REACH EVERYWHERE.']],
    };
    return {
      dlg: [8, 466, 344, 146], name: [20, 478], lines: [[20, 500, 'ONE VIDEO.'], [20, 532, 'EVERY'], [20, 564, 'PLATFORM.']], lsz: 24,
      card: [124, 26, 112, 64], cardLbl: [180, 98], node: [84, 150, 192, 44], nodeTxt: [[180, 164, 'CREATOR OS']],
      chips: PLATFORMS.map((_, i) => (i % 2 ? [190, 214 + Math.floor(i / 2) * 40, 160, 28] : [10, 214 + Math.floor(i / 2) * 40, 160, 28])), heroY: 452, heroX: [-12, 150],
      top: [84, 30, 192, 40], stat: [20, 110, 320, 170], cnt: [180, 212], views: [180, 230], take: [[20, 500, 'POST ONCE.'], [20, 532, 'REACH'], [20, 564, 'EVERYWHERE.']],
    };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const B = buf(W, H), b = B.c.getContext('2d'), { bw, bh, por } = B, Lo = lay(bw, bh, por);
      b.imageSmoothingEnabled = false;
      scenery(b, bw, bh, t, por);
      const F = Math.floor(t * 30) / 30; // whole frames
      const dialog = (lines, t0, name, cps = 22) => {
        const [dx, dy, dw, dh] = Lo.dlg; style.box(b, dx, dy, dw, dh, K.beat(F, t0, 0.13, 'lin'));
        if (F < t0 + 0.13) return;
        pxText(b, name, Lo.name[0], Lo.name[1], por ? 16 : 8, C.gold);
        let tt = t0 + 0.15;
        lines.forEach(([x, y, txt], i) => { const n = Math.max(0, Math.min(txt.length, Math.floor((F - tt) * cps))); pxText(b, txt.slice(0, n), x, y + (por ? 8 : 0), Lo.lsz, C.white); tt += txt.length / cps + 0.1; });
        if (Math.floor(F * 3) % 2) { const ax = dx + dw - 14, ay = dy + dh - 10; for (let i = 0; i < 4; i++) px(b, ax + i, ay + i, 8 - i * 2, 1, C.gold); }
      };
      if (F < 8.25) {
        // hero walks on with a 2-frame cycle
        const hx = Math.round(K.lerp(Lo.heroX[0], Lo.heroX[1], K.clamp((F - 1.0) / 4))), cyc = Math.floor(F * 6) % 2;
        sprite(b, cyc && F < 5 ? HERO2 : HERO, hx, Lo.heroY - (por ? 0 : 0), HC);
        if (F < 2.0) dialog(Lo.lines, 0.1, 'CREATOR OS', 30);
        const [vx, vy, vw, vh] = Lo.card;
        style.box(b, vx, vy, vw, vh, K.beat(F, 2.0, 0.2, 'lin'));
        if (F > 2.2) { playIcon(b, vx + vw / 2, vy + vh / 2, por ? 12 : 8, C.red); px(b, vx + 6, vy + vh - 8, (vw - 12) * K.clamp((F - 2.2) / 2), 2, C.cyan); }
        if (F > 2.6) pxText(b, 'YOUR VIDEO', Lo.cardLbl[0], Lo.cardLbl[1], por ? 16 : 8, C.cream, 'center');
        const [nx, ny, nw, nh] = Lo.node;
        if (por) style.arrow(b, [vx + vw / 2, Lo.cardLbl[1] + 20], [nx + nw / 2, ny - 4], K.beat(F, 3.4, 0.5, 'lin'));
        else style.arrow(b, [vx + vw + 2, vy + vh / 2], [nx - 3, ny + nh / 2], K.beat(F, 3.4, 0.5, 'lin'));
        style.box(b, nx, ny, nw, nh, K.beat(F, 4.0, 0.2, 'lin'), { a: '#8a2ab8', b: '#6a2098', c: '#4a1878' });
        if (F > 4.25) Lo.nodeTxt.forEach(([x, y, txt]) => pxText(b, txt, x, y, por ? 16 : 8, C.gold, 'center'));
        if (por && F > 4.95) { const yl = Lo.chips[6][1] + 14; pxLine(b, bw / 2, ny + nh + 2, bw / 2, K.lerp(ny + nh + 2, yl, K.beat(F, 4.95, 0.4, 'lin')), C.gold, 2, 8); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy, cw, ch] = Lo.chips[i], p = K.beat(F, t0, 0.2, 'lin');
          if (por) { if (p > 0) pxLine(b, bw / 2, cy + ch / 2, i % 2 ? cx - 2 : cx + cw + 1, cy + ch / 2, C.gold, 2); }
          else style.arrow(b, [nx + nw + 2, ny + nh / 2], [cx - 3, cy + ch / 2], p);
          style.box(b, cx, cy, cw, ch, K.beat(F, t0 + 0.15, 0.13, 'lin'));
          if (F > t0 + 0.28) {
            pxText(b, name.toUpperCase(), cx + cw / 2, cy + (ch - (por ? 16 : 8)) / 2, por ? 16 : 8, C.white, 'center');
            if (F < t0 + 0.6) { const k = Math.floor((F - t0 - 0.28) * 20); for (const [ex, ey] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) px(b, cx + cw / 2 + ex * (cw / 2 + k), cy + ch / 2 + ey * (ch / 2 + k), 2, 2, C.cream); }
          }
        });
      } else {
        const [tx, ty, tw, th] = Lo.top;
        windowBox(b, tx, ty, tw, th, { a: '#8a2ab8', b: '#6a2098', c: '#4a1878' });
        pxText(b, 'CREATOR OS', tx + tw / 2, ty + (th - (por ? 16 : 8)) / 2, por ? 16 : 8, C.gold, 'center');
        const [sx, sy, sw, sh] = Lo.stat; style.box(b, sx, sy, sw, sh, K.beat(F, 8.4, 0.2, 'lin'));
        if (F > 8.6) {
          pxText(b, 'VIEWS', sx + 8, sy + 8, por ? 16 : 8, C.cream);
          const v = Math.round(K.count(F, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
          style.counter(b, v, Lo.cnt[0], Lo.cnt[1], 1, { size: por ? 64 : 96 });
          const bar = (sw - 16) * K.beat(F, 8.6, 1.4); px(b, sx + 8, Lo.views[1] + (por ? 20 : 4), sw - 16, por ? 8 : 4, C.ink); px(b, sx + 8, Lo.views[1] + (por ? 20 : 4), bar, por ? 8 : 4, F > 10 ? C.gold : C.green);
          pxText(b, 'EXP', sx + sw - 8, sy + 8, por ? 16 : 8, C.green, 'right');
        }
        style.emphasis(b, Lo.cnt[0], Lo.cnt[1] - (por ? 30 : 12), por ? 150 : 110, K.beat(F, 10.0, 0.6, 'lin'));
        if (F >= 10.0 && F < 10.1) { b.fillStyle = 'rgba(255,255,255,0.6)'; b.fillRect(0, 0, bw, bh); }
        if (F > 10.4) dialog(Lo.take, 10.4, 'CREATOR OS', 34);
      }
      // 16-step brightness fade-in at the very start
      if (F < 0.5) { b.fillStyle = `rgba(0,0,0,${1 - Math.floor((F / 0.5) * 16) / 16})`; b.fillRect(0, 0, bw, bh); }
      if (F > 7.6 && F < 8.9) style.transition(b, bw, bh, K.clamp((F - 7.6) / 1.3));
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(B.c, 0, 0, W, H); ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('tape', 0, 12, 0.6);
      k.play('swell', 0.0, { dur: 2.0, chord: ['A3', 'C4', 'E4'], gain: 0.8 });
      const typeB = (t0, txt, cps = 22) => { for (let i = 0; i < txt.length; i++) if (txt[i] !== ' ') k.play('blip', t0 + i / cps, { note: 'A5', dur: 0.025, gain: 0.5 }); };
      k.play('click', 0.1); typeB(0.25, 'ONE VIDEO.', 30); typeB(0.25 + 10 / 30 + 0.1, 'EVERY PLATFORM.', 30);
      k.play('blip', 2.0, { note: 'C6' }); k.play('pop', 2.6, { pitch: 1.3 });
      k.play('tick', 3.4); k.play('tick', 3.6); k.play('tick', 3.8);
      k.play('blip', 4.0, { note: 'E6' }); k.play('blip', 4.08, { note: 'G6' }); k.play('blip', 4.16, { note: 'C7' });
      const notes = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7'];
      for (let i = 0; i < 7; i++) k.play('blip', 5.28 + i * 0.4, { note: notes[i], dur: 0.06 });
      k.play('glitch', 7.6, { gain: 0.6 }); k.play('whoosh', 7.7, { dur: 0.6, up: false }); k.play('whoosh', 8.3, { dur: 0.5 });
      k.play('blip', 8.4, { note: 'C6' }); k.play('count', 8.6, { dur: 1.4 });
      k.play('ding', 10.0); k.play('blip', 10.0, { note: 'C7', dur: 0.12 }); k.play('blip', 10.12, { note: 'E7', dur: 0.12 }); k.play('blip', 10.24, { note: 'G7', dur: 0.2 });
      k.play('click', 10.4); typeB(10.55, 'POST ONCE.', 34); typeB(10.55 + 10 / 34 + 0.1, 'REACH EVERYWHERE.', 34);
      k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
