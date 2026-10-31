// Pocket Monochrome (Retro Digital). An original DMG-style handheld: a true 160x144 LCD in exactly four pea-soup
// greens, blown up nearest-neighbour, each pixel multiplied onto a reflective backing so it casts a faint shadow,
// a visible pixel grid, slow-LCD ghosting on motion, and the purple-grey bezel with its striped label.
//
// Drawing model: scenes draw on the LCD buffer (style.lcd(W, H) -> 160x144 canvas) using ONLY the four shade inks
// (style.palette.ink0..ink3) and the primitives below; style.background(ctx) draws the device, style.finish(ctx)
// puts the LCD on the glass. Primitives take LCD coordinates.
(function () {
  // what is drawn into the buffer (multiply factors) -> what the glass shows over the backing
  const INK = ['#ffffff', '#b8cbb2', '#63816b', '#284646'];
  const SHOW = ['#c7d38a', '#8fa860', '#4d6b3a', '#1f3a26'];
  const LW = 160, LH = 144, FONT = 'Press Start 2P';
  const RGB = INK.map((c) => K.hex(c));

  function lcd(W, H) { return K.cached(`gb-lcd:${W}x${H}`, () => K.layer(LW, LH)); }
  function ghostBuf(W, H) { return K.cached(`gb-ghost:${W}x${H}`, () => K.layer(LW, LH)); }
  function geom(W, H) {
    const por = H > W;
    if (!por) { const k = Math.max(1, Math.floor(Math.min(W / 1280, H / 720) * 4)), w = LW * k, h = LH * k; return { por, k, x: Math.round((W - w) / 2), y: Math.round((H - h) / 2 + h * 0.02), w, h, s: K.layout(W, H).s }; }
    const k = Math.max(1, Math.floor((W * 0.8) / LW)), w = LW * k, h = LH * k;
    return { por, k, x: Math.round((W - w) / 2), y: Math.round(H * 0.075), w, h, s: K.layout(W, H).s };
  }

  // ---------- crisp LCD primitives ----------
  function glyphs(text, size, shade, tall) {
    return K.cached(`gb-g:${size}:${shade}:${tall ? 1 : 0}:${text}`, () => {
      const w = Math.max(1, text.length * size), h = size + 1, c = K.layer(w, h), x = c.getContext('2d');
      x.font = `${size}px "${FONT}"`; x.textBaseline = 'top'; x.fillStyle = '#000'; x.fillText(text, 0, 0);
      const im = x.getImageData(0, 0, w, h), d = im.data, [r, g, b] = RGB[shade];
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= 120) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; } else d[i + 3] = 0; }
      x.putImageData(im, 0, 0);
      if (!tall) return c;
      const c2 = K.layer(w, h * 2), x2 = c2.getContext('2d'); x2.imageSmoothingEnabled = false; x2.drawImage(c, 0, 0, w, h * 2); return c2;
    });
  }
  // kind: 'small' (8px), 'tall' (8px double height), 'big' (16px). y = top.
  function text(ctx, str, x, y, kind = 'small', shade = 3, align = 'left') {
    if (!str) return 0; const size = kind === 'big' ? 16 : 8, w = str.length * size;
    const x0 = Math.round(align === 'center' ? x - w / 2 : align === 'right' ? x - w : x);
    ctx.drawImage(glyphs(str, size, shade, kind === 'tall'), x0, Math.round(y)); return w;
  }
  const fill = (ctx, x, y, w, h, shade) => { ctx.fillStyle = INK[shade]; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); };
  function line(ctx, x0, y0, x1, y1, shade, dash = 0) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, i = 0;
    ctx.fillStyle = INK[shade];
    for (;;) { if (!dash || i % dash < dash / 2) ctx.fillRect(x0, y0, 1, 1); i++; if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // the GB text window: double rule border with rounded corners
  function win(ctx, x, y, w, h) {
    fill(ctx, x, y, w, h, 0);
    fill(ctx, x + 1, y, w - 2, 1, 3); fill(ctx, x + 1, y + h - 1, w - 2, 1, 3); fill(ctx, x, y + 1, 1, h - 2, 3); fill(ctx, x + w - 1, y + 1, 1, h - 2, 3);
    fill(ctx, x + 3, y + 2, w - 6, 1, 2); fill(ctx, x + 3, y + h - 3, w - 6, 1, 2); fill(ctx, x + 2, y + 3, 1, h - 6, 2); fill(ctx, x + w - 3, y + 3, 1, h - 6, 2);
  }
  // remap every pixel of a region through a shade table (palette fades, inversion)
  function remap(ctx, table, x = 0, y = 0, w = LW, h = LH) {
    x = Math.max(0, Math.round(x)); y = Math.max(0, Math.round(y)); w = Math.min(LW - x, Math.round(w)); h = Math.min(LH - y, Math.round(h)); if (w <= 0 || h <= 0) return;
    const im = ctx.getImageData(x, y, w, h), d = im.data;
    for (let i = 0; i < d.length; i += 4) {
      let best = 0, bd = 1e9; for (let k = 0; k < 4; k++) { const q = RGB[k], dd = (d[i] - q[0]) ** 2 + (d[i + 1] - q[1]) ** 2 + (d[i + 2] - q[2]) ** 2; if (dd < bd) { bd = dd; best = k; } }
      const o = RGB[table[best]]; d[i] = o[0]; d[i + 1] = o[1]; d[i + 2] = o[2]; d[i + 3] = 255;
    }
    ctx.putImageData(im, x, y);
  }

  // ---------- the device ----------
  function device(W, H) {
    return K.cached(`gb-dev:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), g = geom(W, H), s = g.s, pad = g.k * (g.por ? 8 : 6);
      const rr = (X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };
      if (!g.por) { x.fillStyle = '#e4e1d8'; x.fillRect(0, 0, W, H); const r = K.rng(3); x.fillStyle = 'rgba(0,0,0,0.03)'; for (let i = 0; i < 3000; i++) x.fillRect(r() * W, r() * H, 2, 2); }
      else {
        x.fillStyle = '#d9d6cf'; x.fillRect(0, 0, W, H);
        const bg = x.createLinearGradient(0, 0, W, 0); bg.addColorStop(0, '#cfccc5'); bg.addColorStop(0.5, '#dedbd4'); bg.addColorStop(1, '#c8c5be');
        x.fillStyle = bg; rr(W * 0.02, H * 0.01, W * 0.96, H * 0.98, [30 * s, 30 * s, 160 * s, 30 * s]); x.fill();
      }
      // bezel with the big rounded lower-right corner
      const bx = g.x - pad * 2.2, by = g.y - pad * 2.4, bw = g.w + pad * 4.4, bh = g.h + pad * 4.2;
      x.save(); x.shadowColor = 'rgba(0,0,0,0.3)'; x.shadowBlur = 24 * s; x.shadowOffsetY = 8 * s;
      const bz = x.createLinearGradient(0, by, 0, by + bh); bz.addColorStop(0, '#7b7a92'); bz.addColorStop(1, '#5f5e76');
      x.fillStyle = bz; rr(bx, by, bw, bh, [16 * s, 16 * s, 70 * s, 16 * s]); x.fill(); x.restore();
      x.strokeStyle = 'rgba(255,255,255,0.18)'; x.lineWidth = 2; rr(bx + 2, by + 2, bw - 4, bh - 4, [14 * s, 14 * s, 68 * s, 14 * s]); x.stroke();
      // the striped label
      const ly = by + pad * 1.15, fs = Math.max(11, 12 * s);
      x.font = `italic 800 ${fs}px "Inter"`; x.fillStyle = '#d9d8e6'; x.textAlign = 'center'; x.fillText('DOT MATRIX WITH CREATOR SOUND', W / 2, ly + fs * 0.35);
      const tw = x.measureText('DOT MATRIX WITH CREATOR SOUND').width;
      for (const [side] of [[-1], [1]]) { const x0 = side < 0 ? bx + pad : W / 2 + tw / 2 + 14 * s, x1 = side < 0 ? W / 2 - tw / 2 - 14 * s : bx + bw - pad; x.fillStyle = '#8c2f5a'; x.fillRect(x0, ly - 4 * s, x1 - x0, 2.5 * s); x.fillStyle = '#2f3a8c'; x.fillRect(x0, ly + 2 * s, x1 - x0, 2.5 * s); }
      x.textAlign = 'center'; x.font = `700 ${Math.max(10, 11 * s)}px "Inter"`; x.fillStyle = '#c9c8d6'; x.fillText('BATTERY', bx + pad * 1.1, g.y + g.h * 0.42);
      // LCD recess
      x.fillStyle = '#2a2a34'; x.fillRect(g.x - 3, g.y - 3, g.w + 6, g.h + 6);
      if (g.por) { // the rest of the handheld
        const cy = g.y + g.h + pad * 2.2 + H * 0.04;
        x.textAlign = 'left'; x.fillStyle = '#2b2e7a'; x.font = `italic 800 ${44 * s}px "Inter"`; x.fillText('Creator OS', W * 0.06, cy);
        x.font = `italic 800 ${44 * s}px "Inter"`; const cw = x.measureText('Creator OS ').width; x.font = `800 ${26 * s}px "Inter"`; x.fillText('POCKET', W * 0.06 + cw, cy);
        // D-pad
        const dx = W * 0.22, dy = H * 0.74, a = 46 * s, bw2 = 30 * s;
        x.fillStyle = 'rgba(0,0,0,0.12)'; x.beginPath(); x.arc(dx, dy, a * 1.45, 0, 6.283); x.fill();
        x.fillStyle = '#26262c'; x.fillRect(dx - bw2 / 2, dy - a, bw2, a * 2); x.fillRect(dx - a, dy - bw2 / 2, a * 2, bw2);
        x.fillStyle = '#3a3a42'; x.beginPath(); x.arc(dx, dy, bw2 * 0.3, 0, 6.283); x.fill();
        // A / B
        for (const [bxp, byp, lab] of [[W * 0.82, H * 0.71, 'A'], [W * 0.66, H * 0.75, 'B']]) {
          x.fillStyle = 'rgba(0,0,0,0.12)'; x.beginPath(); x.arc(bxp, byp, 40 * s, 0, 6.283); x.fill();
          const gg = x.createRadialGradient(bxp - 8 * s, byp - 8 * s, 2, bxp, byp, 34 * s); gg.addColorStop(0, '#c2386e'); gg.addColorStop(1, '#7c1c46');
          x.fillStyle = gg; x.beginPath(); x.arc(bxp, byp, 34 * s, 0, 6.283); x.fill();
          x.fillStyle = '#2b2e7a'; x.font = `800 ${22 * s}px "Inter"`; x.textAlign = 'center'; x.fillText(lab, bxp, byp + 64 * s);
        }
        // SELECT / START
        for (const [sx, lab] of [[W * 0.4, 'SELECT'], [W * 0.56, 'START']]) {
          x.save(); x.translate(sx, H * 0.86); x.rotate(-0.45); x.fillStyle = '#8b8a93'; rr(-30 * s, -8 * s, 60 * s, 16 * s, 8 * s); x.fill(); x.restore();
          x.fillStyle = '#2b2e7a'; x.font = `800 ${15 * s}px "Inter"`; x.textAlign = 'center'; x.fillText(lab, sx, H * 0.86 + 40 * s);
        }
        // speaker grille
        x.save(); x.translate(W * 0.84, H * 0.9); x.rotate(-0.45); x.fillStyle = 'rgba(0,0,0,0.25)'; for (let i = 0; i < 6; i++) { rr(-70 * s + i * 22 * s, -60 * s, 9 * s, 120 * s, 4.5 * s); x.fill(); } x.restore();
      }
      return c;
    });
  }
  function backing(W, H) {
    return K.cached(`gb-back:${W}x${H}`, () => {
      const g = geom(W, H), c = K.layer(g.w, g.h), x = c.getContext('2d'); x.fillStyle = SHOW[0]; x.fillRect(0, 0, g.w, g.h);
      const r = K.rng(21); for (let i = 0; i < g.w * g.h * 0.02; i++) { x.fillStyle = r() > 0.5 ? 'rgba(255,255,230,0.06)' : 'rgba(40,60,20,0.05)'; x.fillRect(r() * g.w, r() * g.h, 2, 2); }
      return c;
    });
  }
  function grid(W, H) {
    return K.cached(`gb-grid:${W}x${H}`, () => {
      const g = geom(W, H), c = K.layer(g.w, g.h), x = c.getContext('2d'), gw = Math.max(1, Math.round(g.k / 5));
      x.fillStyle = 'rgba(210,225,170,0.35)';
      for (let i = 0; i <= LW; i++) x.fillRect(i * g.k, 0, gw, g.h);
      for (let j = 0; j <= LH; j++) x.fillRect(0, j * g.k, g.w, gw);
      return c;
    });
  }

  const style = {
    id: 'gameboy', name: 'Pocket Monochrome', family: 'Retro Digital',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Inter:ital,wght@0,700;0,800;1,800&display=block', specs: ['8px "Press Start 2P"', '16px "Press Start 2P"', 'italic 800 20px "Inter"', '800 20px "Inter"'] }],
    palette: { bg: SHOW[0], shade0: SHOW[0], shade1: SHOW[1], shade2: SHOW[2], shade3: SHOW[3], ink0: INK[0], ink1: INK[1], ink2: INK[2], ink3: INK[3], bezel: '#6d6c84', body: '#d9d6cf' },
    sfx: { draw: null, land: 'blip', emphasis: 'ding', transition: 'whoosh', bed: 'tape' },
    lcd, text, fill, line, win, remap, LW, LH,

    background(ctx, W, H, t) { ctx.drawImage(device(W, H), 0, 0); const b = lcd(W, H).getContext('2d'); b.fillStyle = INK[0]; b.fillRect(0, 0, LW, LH); },
    finish(ctx, W, H, t) {
      const g = geom(W, H), L = lcd(W, H);
      ctx.save(); ctx.imageSmoothingEnabled = false;
      ctx.drawImage(backing(W, H), g.x, g.y);
      ctx.globalCompositeOperation = 'multiply';
      // each dark pixel throws a soft shadow onto the reflective layer behind the liquid crystal
      ctx.globalAlpha = 0.35; ctx.drawImage(L, g.x + g.k * 0.45, g.y + g.k * 0.45, g.w, g.h);
      ctx.globalAlpha = 1; ctx.drawImage(L, g.x, g.y, g.w, g.h);
      ctx.globalCompositeOperation = 'source-over'; ctx.drawImage(grid(W, H), g.x, g.y);
      // glass: soft sheen + inner edge shade
      const sh = ctx.createLinearGradient(g.x, g.y, g.x + g.w, g.y + g.h); sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(0.45, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.06)');
      ctx.fillStyle = sh; ctx.fillRect(g.x, g.y, g.w, g.h);
      ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = g.k; ctx.strokeRect(g.x + g.k / 2, g.y + g.k / 2, g.w - g.k, g.h - g.k);
      ctx.restore();
      // battery LED
      const pad = g.k * (g.por ? 8 : 6), lx = g.x - pad * 2.2 + pad * 1.1, ly = g.y + g.h * 0.36, r = 9 * g.s;
      const lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, r * 2); lg.addColorStop(0, '#ff6a5a'); lg.addColorStop(0.35, '#d42a2a'); lg.addColorStop(1, 'rgba(212,42,42,0)');
      ctx.fillStyle = lg; ctx.fillRect(lx - r * 2, ly - r * 2, r * 4, r * 4);
      K.grain(ctx, W, H, t, 0.03, 24, 'soft-light');
    },

    // sizes are in the 1280-authored scale: >= 100 -> 16px font, >= 44 -> 8px double height, else 8px
    title(ctx, str, x, y, p, o = {}) {
      const size = o.size || 64, kind = size >= 100 ? 'big' : size >= 44 ? 'tall' : 'small', h = kind === 'small' ? 8 : 16;
      const n = Math.floor(str.length * K.clamp(p)); const w = str.length * (kind === 'big' ? 16 : 8);
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      text(ctx, str.slice(0, n), x0, y - h, kind, o.shade ?? 3); return { w, h };
    },
    label(ctx, str, x, y, p, o = {}) { return style.title(ctx, str, x, y, p, { size: 30, ...o }); },
    // an arrow-tile path: dotted line that marches, solid head
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null; const e = [K.lerp(from[0], to[0], p), K.lerp(from[1], to[1], p)];
      line(ctx, from[0], from[1], e[0], e[1], o.shade ?? 3, 4);
      if (p >= 1) { const ang = Math.atan2(to[1] - from[1], to[0] - from[0]); for (const sg of [-1, 1]) line(ctx, to[0], to[1], to[0] - Math.cos(ang + sg * 0.75) * 4, to[1] - Math.sin(ang + sg * 0.75) * 4, o.shade ?? 3); }
      return e;
    },
    // the window layer slides up from the bottom of the box area in 8px steps
    box(ctx, x, y, w, h, p, o = {}) { if (p <= 0) return; const hh = Math.max(4, Math.ceil((h * K.clamp(p)) / 8) * 8); win(ctx, x, y + h - Math.min(h, hh), w, Math.min(h, hh)); },
    counter(ctx, value, x, y, p, o = {}) { return style.title(ctx, K.fmt(value), x, y, 1, { size: 128, align: o.align || 'center', shade: o.shade }); },
    // battle-intro flash: the band around the number inverts on alternate frames, then stripes wipe out
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0 || p >= 1) return; const f = Math.floor(p * 10);
      if (f < 6) { if (f % 2 === 0) remap(ctx, [3, 2, 1, 0], x - r, y - 14, r * 2, 26); }
      else { const k = (p - 0.6) / 0.4; for (let j = 0; j < 26; j += 2) fill(ctx, x - r, y - 14 + j, r * 2 * (1 - k), 1, 3); }
    },
    // palette steps to white (door transition), 0.5 = all white
    transition(ctx, W, H, p, o = {}) {
      const k = p < 0.5 ? p * 2 : (1 - p) * 2, step = Math.min(3, Math.floor(k * 4));
      if (step) remap(ctx, [0, 1, 2, 3].map((i) => Math.max(0, i - step)));
    },
  };

  // ---------- the shared demo as a handheld RPG ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const TREE = ['..3333..', '.322223.', '32212223', '32222123', '.322223.', '..3333..', '...33...', '...33...'];
  const HERO = [['..3333..', '.333333.', '.311113.', '.313313.', '..1111..', '.333333.', '3.3333.3', '..3..3..'], ['..3333..', '.333333.', '.311113.', '.313313.', '..1111..', '.333333.', '3.3333.3', '.3....3.']];
  const sprite = (c, rows, x, y) => rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] !== '.') fill(c, x + i, y + j, 1, 1, +row[i]); });

  function frame(c, t) {
    const F = Math.floor(t * 30) / 30;
    fill(c, 0, 0, LW, LH, 0);
    if (F < 2.0) {
      // boot: the title drops in one pixel per frame, then PRESS START blinks
      const drop = Math.min(0, -40 + Math.floor(F * 30) * 2);
      win(c, 6, 18 + drop, 148, 70);
      text(c, 'ONE VIDEO.', 80, 30 + drop, 'tall', 3, 'center');
      text(c, 'EVERY PLATFORM.', 80, 58 + drop, 'tall', 3, 'center');
      if (F > 1.0 && Math.floor(F * 3) % 2) text(c, 'PRESS START', 80, 110, 'small', 2, 'center');
      text(c, '2026 CREATOR OS', 80, 128, 'small', 1, 'center');
      return;
    }
    if (F < 8.25) {
      // overworld: grass dither, trees, a path
      for (let y = 4; y < LH; y += 8) for (let x = (y / 4) % 2 ? 2 : 6; x < LW; x += 8) fill(c, x, y, 1, 1, 1);
      for (let x = 0; x < LW; x += 8) sprite(c, TREE, x, 136);
      const hx = Math.min(56, -8 + Math.floor((F - 2.0) * 30)), cyc = Math.floor(F * 4) % 2;
      // the video: a little TV
      const p1 = K.beat(F, 2.0, 0.3, 'lin');
      style.box(c, 10, 8, 40, 30, p1);
      if (F > 2.3) { fill(c, 14, 12, 32, 20, 2); for (let i = 0; i < 9; i++) fill(c, 26 + i, 17 + Math.floor(i / 2), 1, 10 - Math.floor(i / 2) * 2, 0); fill(c, 22, 38, 16, 2, 3); }
      if (F > 2.7) { text(c, 'YOUR', 30, 42, 'small', 3, 'center'); text(c, 'VIDEO', 30, 52, 'small', 3, 'center'); }
      style.arrow(c, [30, 62], [30, 69], K.beat(F, 3.4, 0.4, 'lin'));
      // Creator OS: a house with a striped roof and a sign
      const p2 = K.beat(F, 4.0, 0.3, 'lin');
      if (p2 > 0) { for (let i = 0; i < 6; i++) fill(c, 6 - i + 6, 70 + i * 2, 52 + i * 2 - 12, 2, i % 2 ? 2 : 3); style.box(c, 4, 82, 64, 32, p2); }
      if (F > 4.3) { text(c, 'CREATOR', 36, 88, 'small', 3, 'center'); text(c, 'OS', 36, 100, 'small', 3, 'center'); }
      PLATFORMS.forEach((name, i) => {
        const t0 = 5.0 + i * 0.4, y = 4 + i * 19, p = K.beat(F, t0, 0.25, 'lin');
        if (i === 0) { style.arrow(c, [69, 98], [76, 98], K.beat(F, 4.8, 0.15, 'lin')); const bus = K.beat(F, 4.95, 0.3 + 0, 'lin'); if (bus > 0) { line(c, 76, 98, 76, K.lerp(98, 8, bus), 3); line(c, 76, 98, 76, K.lerp(98, 122, bus), 3); } }
        style.arrow(c, [76, y + 4], [83, y + 4], p);
        if (F > t0 + 0.25) { text(c, name.toUpperCase(), 86, y, 'small', 3); if (F < t0 + 0.6) fill(c, 86, y + 10, (name.length * 8) * K.clamp((F - t0 - 0.25) / 0.2), 1, 2); }
      });
      if (hx > -8) sprite(c, HERO[F < 4 ? cyc : 0], hx, 126);
      return;
    }
    // status screen
    win(c, 0, 0, LW, 24); text(c, 'CREATOR OS', 80, 8, 'small', 3, 'center');
    text(c, 'VIEWS', 80, 30, 'small', 2, 'center');
    const v = Math.round(K.count(F, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
    style.counter(c, v, 80, 62, 1);
    for (let i = 0; i < 18; i++) fill(c, 8 + i * 8, 72, 6, 4, i < Math.round(18 * K.beat(F, 8.6, 1.4)) ? 3 : 1);
    if (F > 10.45) { style.box(c, 0, 92, LW, 52, K.beat(F, 10.45, 0.2, 'lin')); }
    if (F > 10.6) { const n1 = Math.floor((F - 10.6) * 40), n2 = Math.floor((F - 10.88) * 40); text(c, 'POST ONCE.'.slice(0, Math.max(0, n1)), 12, 100, 'tall', 3); text(c, 'REACH EVERYWHERE.'.slice(0, Math.max(0, n2)), 12, 120, 'tall', 3); }
    style.emphasis(c, 80, 56, 76, K.beat(F, 10.0, 0.6, 'lin'));
  }

  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      style.background(ctx, W, H, t);
      const L = lcd(W, H).getContext('2d'), G = ghostBuf(W, H).getContext('2d');
      L.imageSmoothingEnabled = false; G.imageSmoothingEnabled = false;
      // slow liquid crystal: the previous frame lingers under moving things
      frame(G, Math.max(0, t - 1 / 15)); if (t > 7.6 && t < 8.9) style.transition(G, LW, LH, K.clamp((t - 1 / 15 - 7.6) / 1.3));
      frame(L, t); if (t > 7.6 && t < 8.9) style.transition(L, LW, LH, K.clamp((t - 7.6) / 1.3));
      L.save(); L.globalCompositeOperation = 'darken'; L.globalAlpha = 0.5; L.drawImage(G.canvas, 0, 0); L.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('tape', 0, 12, 0.5);
      k.play('blip', 0.0, { note: 'C6', dur: 0.08 }); k.play('blip', 1.33, { note: 'C7', dur: 0.3 });
      k.play('blip', 2.0, { note: 'G5' }); k.play('pop', 2.3, { pitch: 1.4 });
      for (let i = 0; i < 10; i++) k.play('click', 2.7 + i * 0.03, { pitch: 1.4 });
      k.play('tick', 3.4); k.play('tick', 3.55); k.play('tick', 3.7);
      k.play('blip', 4.0, { note: 'E5' }); k.play('blip', 4.08, { note: 'A5' });
      for (let i = 0; i < 7; i++) k.play('blip', 5.25 + i * 0.4, { note: ['C6', 'E6', 'G6', 'C6', 'E6', 'G6', 'C7'][i], dur: 0.05 });
      k.play('whoosh', 7.6, { dur: 0.6, up: true }); k.play('blip', 8.25, { note: 'G4', dur: 0.15 }); k.play('whoosh', 8.3, { dur: 0.5, up: false });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('glitch', 10.0, { gain: 0.6 }); k.play('ding', 10.05);
      for (let i = 0; i < 10; i++) k.play('blip', 10.6 + i / 40, { note: 'A5', dur: 0.02, gain: 0.5 });
      for (let i = 0; i < 17; i++) k.play('blip', 10.88 + i / 40, { note: 'A5', dur: 0.02, gain: 0.5 });
      k.play('chime', 11.6, { note: 'G5' });
    },
  };
  MS.register(style);
})();
