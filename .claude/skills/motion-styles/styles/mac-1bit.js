// MacPaint 1984 (Retro Digital). Pure 1-bit black and white at the original 72-dpi grain: the frame is drawn in grey on
// a half-resolution buffer and the display pass Atkinson-dithers it to 1 bit (blown highlights, crunchy shadows) and
// blows it up nearest-neighbour. 8x8 fill patterns, striped title bars, marching ants, aliased bitmap type (alpha
// thresholded), a tool palette whose active tool follows the story, a pattern palette, and zoom-rect transitions.
(function () {
  const B0 = '#000000', W0 = '#ffffff';
  const SERIF = 'Libre Baskerville', SANS = 'Inter';
  const S = (ctx) => K.layout(ctx.canvas.width, ctx.canvas.height).s;
  const R = Math.round;

  function buf(W, H) { const k = 2, bw = R(W / k), bh = R(H / k); return K.cached(`m1-buf:${W}x${H}`, () => ({ c: K.layer(bw, bh), bw, bh, k, por: H > W })); }

  // ---------- 1-bit helpers ----------
  const PATS = {
    gray: ['10101010', '01010101'], light: ['10001000', '00000000', '00100010', '00000000'], dark: ['11101110', '10111011'],
    diag: ['10000000', '01000000', '00100000', '00010000', '00001000', '00000100', '00000010', '00000001'],
    brick: ['11111111', '10000000', '10000000', '10000000', '11111111', '00001000', '00001000', '00001000'],
    weave: ['11000001', '01100010', '00110100', '00011000', '00101100', '01000110', '10000011', '00000001'],
    dots: ['10000000', '00000000', '00001000', '00000000'], hstripe: ['11111111', '00000000'], check: ['11110000', '11110000', '11110000', '11110000', '00001111', '00001111', '00001111', '00001111'],
    scales: ['10000001', '01000010', '00111100', '00000000', '00011000', '00100100', '11000011', '00000000'], wave: ['00011000', '00100100', '11000011', '00000000'],
  };
  function pat(ctx, name) {
    const rows = PATS[name]; const tile = K.cached(`m1-pat:${name}`, () => { const c = K.layer(8, 8), x = c.getContext('2d'); x.fillStyle = W0; x.fillRect(0, 0, 8, 8); x.fillStyle = B0; for (let y = 0; y < 8; y++) { const row = rows[y % rows.length]; for (let i = 0; i < 8; i++) if (row[i] === '1') x.fillRect(i, y, 1, 1); } return c; });
    return ctx.createPattern(tile, 'repeat');
  }
  function glyphs(str, font, color) {
    return K.cached(`m1-g:${font}:${color}:${str}`, () => {
      const m = K.layer(4, 4).getContext('2d'); m.font = font; const w = Math.ceil(m.measureText(str).width) + 4, h = Math.ceil(parseFloat(font.match(/(\d+)px/)[1]) * 1.5);
      const c = K.layer(Math.max(1, w), h), x = c.getContext('2d'); x.font = font; x.textBaseline = 'alphabetic'; x.fillStyle = '#000'; x.fillText(str, 1, Math.round(h * 0.75));
      const im = x.getImageData(0, 0, c.width, h), d = im.data, v = color === W0 ? 255 : 0;
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= 110) { d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; } else d[i + 3] = 0; }
      x.putImageData(im, 0, 0); return { c, w: w - 4, base: Math.round(h * 0.75) };
    });
  }
  // aliased bitmap text; y = baseline
  function btext(ctx, str, x, y, size, o = {}) {
    if (!str) return 0; const font = `${o.weight || 700} ${R(size)}px "${o.family || SANS}"`, g = glyphs(str, font, o.color || B0);
    const x0 = R(o.align === 'center' ? x - g.w / 2 : o.align === 'right' ? x - g.w : x);
    if (o.box) { ctx.fillStyle = W0; ctx.fillRect(x0 - 4, R(y - size * 0.95), g.w + 9, R(size * 1.3)); }
    ctx.drawImage(g.c, x0 - 1, R(y) - g.base); return g.w;
  }
  const textW = (str, size, o = {}) => glyphs(str, `${o.weight || 700} ${R(size)}px "${o.family || SANS}"`, B0).w;
  const rect = (ctx, x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(R(x), R(y), R(w), R(h)); };
  function frameRect(ctx, x, y, w, h, t = 1, col = B0) { rect(ctx, x, y, w, t, col); rect(ctx, x, y + h - t, w, t, col); rect(ctx, x, y, t, h, col); rect(ctx, x + w - t, y, t, h, col); }
  function pline(ctx, x0, y0, x1, y1, th = 1, col = B0) {
    x0 = R(x0); y0 = R(y0); x1 = R(x1); y1 = R(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy;
    ctx.fillStyle = col; for (;;) { ctx.fillRect(x0, y0, th, th); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // marching ants: 4-on 4-off pixels crawling round the rectangle
  function ants(ctx, x, y, w, h, t) {
    x = R(x); y = R(y); w = R(w); h = R(h); const off = Math.floor(t * 12) % 8, per = 2 * (w + h);
    for (let i = 0; i < per; i++) { const on = ((i + off) % 8) < 4; let px, py; if (i < w) { px = x + i; py = y; } else if (i < w + h) { px = x + w; py = y + i - w; } else if (i < 2 * w + h) { px = x + w - (i - w - h); py = y + h; } else { px = x; py = y + h - (i - 2 * w - h); } rect(ctx, px, py, 1, 1, on ? B0 : W0); }
  }
  function invert(ctx, x, y, w, h) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = W0; ctx.fillRect(R(x), R(y), R(w), R(h)); ctx.restore(); }

  // Atkinson dither to pure black/white
  let GB = null;
  function atkinson(ctx, w, h) {
    const im = ctx.getImageData(0, 0, w, h), d = im.data, n = w * h;
    if (!GB || GB.length !== n + 2 * w + 4) GB = new Float32Array(n + 2 * w + 4);
    const g = GB; for (let i = 0, j = 0; i < n; i++, j += 4) g[i] = d[j] * 0.3 + d[j + 1] * 0.59 + d[j + 2] * 0.11;
    g.fill(0, n);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x, o = g[i], v = o < 128 ? 0 : 255, e = (o - v) / 8; d[i * 4] = d[i * 4 + 1] = d[i * 4 + 2] = v; d[i * 4 + 3] = 255;
      if (e) { if (x + 1 < w) g[i + 1] += e; if (x + 2 < w) g[i + 2] += e; if (x > 0) g[i + w - 1] += e; g[i + w] += e; if (x + 1 < w) g[i + w + 1] += e; g[i + 2 * w] += e; }
    }
    ctx.putImageData(im, 0, 0);
  }

  // ---------- the desktop ----------
  function geo(bw, bh, por) {
    if (!por) return { menu: 14, tools: [6, 22, 52, 212], win: [66, 20, 566, 286], canvas: [68, 38, 562, 266], pats: [66, 314, 566, 40], disk: null };
    return { menu: 18, tools: [6, 24, 528, 58], win: [6, 92, 528, 768], canvas: [8, 112, 524, 746], pats: [6, 870, 528, 82], disk: null };
  }
  const TOOLS = ['select', 'lasso', 'hand', 'text', 'bucket', 'spray', 'brush', 'pencil', 'line', 'eraser', 'rect', 'frect', 'oval', 'foval', 'round', 'poly'];
  function toolIcon(ctx, name, x, y, sz) {
    const c = x + sz / 2, m = y + sz / 2, q = sz * 0.28;
    switch (name) {
      case 'select': frameRect(ctx, c - q, m - q, 2 * q, 2 * q, 1); break;
      case 'lasso': ctx.fillStyle = B0; for (let a = 0; a < 6.28; a += 0.25) rect(ctx, c + Math.cos(a) * q, m + Math.sin(a) * q * 0.6, 1, 1, B0); break;
      case 'hand': rect(ctx, c - q * 0.6, m - q * 0.2, q * 1.2, q * 1.1, B0); for (let i = 0; i < 4; i++) rect(ctx, c - q * 0.6 + i * q * 0.33, m - q, 1, q * 0.8, B0); break;
      case 'text': btext(ctx, 'A', c, m + sz * 0.22, sz * 0.62, { align: 'center', family: SERIF }); break;
      case 'bucket': frameRect(ctx, c - q * 0.7, m - q * 0.5, q * 1.4, q * 1.3, 1); pline(ctx, c + q * 0.7, m - q * 0.2, c + q, m + q * 0.5); break;
      case 'spray': rect(ctx, c - q * 0.3, m - q * 0.2, q * 0.6, q * 1.2, B0); for (let i = 0; i < 6; i++) rect(ctx, c - q + (i % 3) * 3, m - q + Math.floor(i / 3) * 3, 1, 1, B0); break;
      case 'brush': pline(ctx, c - q, m + q, c + q, m - q, 2); break;
      case 'pencil': pline(ctx, c - q, m + q, c + q, m - q, 1); pline(ctx, c - q + 2, m + q, c + q + 1, m - q + 1, 1); break;
      case 'line': pline(ctx, c - q, m + q, c + q, m - q, 1); break;
      case 'eraser': frameRect(ctx, c - q, m - q * 0.5, 2 * q, q, 1); break;
      case 'rect': frameRect(ctx, c - q, m - q * 0.7, 2 * q, 1.4 * q, 1); break;
      case 'frect': ctx.fillStyle = pat(ctx, 'gray'); ctx.fillRect(R(c - q), R(m - q * 0.7), R(2 * q), R(1.4 * q)); frameRect(ctx, c - q, m - q * 0.7, 2 * q, 1.4 * q, 1); break;
      case 'oval': case 'foval': for (let a = 0; a < 6.28; a += 0.12) rect(ctx, c + Math.cos(a) * q, m + Math.sin(a) * q * 0.7, 1, 1, B0); break;
      case 'round': frameRect(ctx, c - q, m - q * 0.7, 2 * q, 1.4 * q, 1); break;
      case 'poly': pline(ctx, c - q, m + q * 0.6, c, m - q * 0.7); pline(ctx, c, m - q * 0.7, c + q, m + q * 0.6); pline(ctx, c - q, m + q * 0.6, c + q, m + q * 0.6); break;
    }
  }
  function desktop(ctx, bw, bh, por, t, active, titleText) {
    const G = geo(bw, bh, por);
    ctx.fillStyle = pat(ctx, 'gray'); ctx.fillRect(0, 0, bw, bh);
    rect(ctx, 0, 0, bw, G.menu, W0); rect(ctx, 0, G.menu, bw, 1, B0);
    const ms = por ? 15 : 11; let mx = 10;
    // a little 8-point star where the apple would be
    pline(ctx, mx + 3, 3, mx + 3, G.menu - 4); pline(ctx, mx, G.menu / 2, mx + 6, G.menu / 2); pline(ctx, mx + 1, 4, mx + 5, G.menu - 5); pline(ctx, mx + 5, 4, mx + 1, G.menu - 5); mx += 20;
    for (const m of ['File', 'Edit', 'Goodies', 'Font', 'FontSize', 'Style']) { mx += btext(ctx, m, mx, G.menu - (por ? 4 : 3), ms) + (por ? 16 : 12); }
    // tool palette
    const [tx, ty, tw, th] = G.tools; rect(ctx, tx, ty, tw, th, W0); frameRect(ctx, tx, ty, tw, th);
    const cols = por ? 16 : 2, sz = por ? Math.floor((tw - 8) / 16) : Math.floor((tw - 6) / 2);
    TOOLS.forEach((name, i) => { const x = tx + 3 + (i % cols) * sz, y = ty + 3 + Math.floor(i / cols) * sz; frameRect(ctx, x, y, sz, sz); toolIcon(ctx, name, x, y, sz); if (name === active) invert(ctx, x + 1, y + 1, sz - 2, sz - 2); });
    if (!por) { const ly = ty + 3 + 8 * sz + 6; rect(ctx, tx, ly, tw, 1, B0); for (let i = 0; i < 4; i++) rect(ctx, tx + 8, ly + 10 + i * 10, tw - 16, i + 1, B0); }
    // the window: striped title bar, close box, title
    const [wx, wy, ww, wh] = G.win; rect(ctx, wx + 2, wy + 2, ww, wh, B0); rect(ctx, wx, wy, ww, wh, W0); frameRect(ctx, wx, wy, ww, wh);
    const tb = 18; for (let y = wy + 4; y < wy + tb - 2; y += 2) rect(ctx, wx + 3, y, ww - 6, 1, B0);
    rect(ctx, wx, wy + tb, ww, 1, B0); rect(ctx, wx + 10, wy + 4, 12, 11, W0); frameRect(ctx, wx + 11, wy + 5, 10, 9);
    const ts = por ? 14 : 12, tw2 = textW(titleText, ts) + 16; rect(ctx, wx + ww / 2 - tw2 / 2, wy + 2, tw2, tb - 3, W0); btext(ctx, titleText, wx + ww / 2, wy + tb - 5, ts, { align: 'center' });
    // pattern palette
    const [px, py, pw, ph] = G.pats; rect(ctx, px, py, pw, ph, W0); frameRect(ctx, px, py, pw, ph);
    const names = Object.keys(PATS), n = por ? 11 : 18, cw = Math.floor((pw - 50) / n), rows = 2, chh = Math.floor((ph - 6) / rows);
    ctx.fillStyle = pat(ctx, 'weave'); ctx.fillRect(px + 4, py + 4, 38, ph - 8); frameRect(ctx, px + 4, py + 4, 38, ph - 8);
    for (let r = 0; r < rows; r++) for (let i = 0; i < n; i++) { const x = px + 46 + i * cw, y = py + 3 + r * chh; ctx.fillStyle = (i + r) % 7 === 0 ? B0 : (i + r) % 7 === 3 ? W0 : pat(ctx, names[(i * 3 + r * 5) % names.length]); ctx.fillRect(x, y, cw, chh); frameRect(ctx, x, y, cw + 1, chh + 1); }
    if (G.disk) { const [dx, dy] = G.disk; rect(ctx, dx, dy, 26, 26, W0); frameRect(ctx, dx, dy, 26, 26); rect(ctx, dx + 6, dy, 14, 9, B0); rect(ctx, dx + 14, dy + 2, 3, 5, W0); btext(ctx, 'Disk', dx + 13, dy + 40, 11, { align: 'center', box: true }); }
    return G;
  }
  function pointer(ctx, x, y, kind = 'arrow') {
    x = R(x); y = R(y);
    if (kind === 'cross') { rect(ctx, x - 7, y, 15, 1, B0); rect(ctx, x, y - 7, 1, 15, B0); rect(ctx, x - 1, y - 1, 3, 3, W0); return; }
    const shape = ['1', '11', '1.1', '1..1', '1...1', '1....1', '1.....1', '1......1', '1.....11', '1..1..1', '1.1.1..1', '11..1..1', '1....1..1', '.....1..1', '......11'];
    shape.forEach((row, j) => { for (let i = 0; i < row.length; i++) { if (row[i] === '1') rect(ctx, x + i, y + j, 1, 1, B0); else rect(ctx, x + i, y + j, 1, 1, W0); } });
  }

  const style = {
    id: 'mac-1bit', name: 'MacPaint 1984', family: 'Retro Digital',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Libre+Baskerville:wght@700&family=Inter:wght@700&display=block', specs: ['700 30px "Libre Baskerville"', '700 16px "Inter"'] }],
    palette: { bg: W0, ink: B0, paper: W0 },
    sfx: { draw: 'pencil', land: 'click', emphasis: 'blip', transition: 'whoosh', bed: 'room' },
    buffer: buf, pattern: pat, ants, btext, atkinson,

    background(ctx, W, H, t) { ctx.fillStyle = W0; ctx.fillRect(0, 0, W, H); },
    // the display: whatever is on the canvas goes down to 72-dpi pixels, is Atkinson-dithered to 1 bit, and comes back up
    finish(ctx, W, H, t) {
      const Bf = buf(W, H), tmp = K.cached(`m1-fin:${W}x${H}`, () => K.layer(Bf.bw, Bf.bh)), x = tmp.getContext('2d', { willReadFrequently: true });
      x.imageSmoothingEnabled = false; x.drawImage(ctx.canvas, 0, 0, Bf.bw, Bf.bh); atkinson(x, Bf.bw, Bf.bh);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, W, H); ctx.restore();
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx), n = Math.floor(text.length * K.clamp(p)), size = (o.size || 60) * s, w = textW(text, size, { family: SERIF });
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      btext(ctx, text.slice(0, n), x0, y, size, { family: o.family || SERIF });
      if (n < text.length && p > 0) { const cw = textW(text.slice(0, n) || ' ', size, { family: SERIF }); rect(ctx, x0 + cw + 2, y - size * 0.8, 1, size, B0); }
      return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) { const s = S(ctx), n = Math.floor(text.length * K.clamp(p)); btext(ctx, text.slice(0, n), x, y, (o.size || 32) * s, { align: o.align, box: o.box }); return { w: textW(text, (o.size || 32) * s), h: (o.size || 32) * s }; },
    // line tool: a 2px aliased line rubber-banded out, then a filled pixel head
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null; const s = S(ctx), th = Math.max(1, R(3 * s)), e = [K.lerp(from[0], to[0], K.clamp(p)), K.lerp(from[1], to[1], K.clamp(p))];
      pline(ctx, from[0], from[1], e[0], e[1], th);
      if (p >= 1) { const a = Math.atan2(to[1] - from[1], to[0] - from[0]), L = 12 * s * 1.4; ctx.fillStyle = B0; ctx.beginPath(); ctx.moveTo(R(to[0]), R(to[1])); ctx.lineTo(R(to[0] - Math.cos(a - 0.5) * L), R(to[1] - Math.sin(a - 0.5) * L)); ctx.lineTo(R(to[0] - Math.cos(a + 0.5) * L), R(to[1] - Math.sin(a + 0.5) * L)); ctx.fill(); }
      return e;
    },
    // rectangle tool: the frame snaps out from a corner, then the bucket floods it with a pattern
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return; const k = K.clamp(p / 0.6), s = S(ctx), ww = w * k, hh = h * k, t = Math.max(1, R(2 * s));
      if (p >= 0.6 && o.pattern) { ctx.fillStyle = pat(ctx, o.pattern); ctx.fillRect(R(x), R(y), R(w), R(h)); }
      else if (p >= 0.6) rect(ctx, x, y, w, h, W0);
      rect(ctx, x + 3, y + h, w, 3, p >= 0.6 && o.shadow ? B0 : 'transparent');
      frameRect(ctx, x, y, ww, hh, t);
    },
    counter(ctx, value, x, y, p, o = {}) { return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 120, align: o.align || 'center' }); },
    // selection: marching ants around the region, then Invert flashes it
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return; const hh = o.h || r * 0.5; ants(ctx, x - r, y - hh / 2, r * 2, hh, o.t || 0);
      if (p > 0.3 && p < 0.9 && Math.floor(p * 10) % 2 === 1) invert(ctx, x - r + 1, y - hh / 2 + 1, r * 2 - 1, hh - 1);
    },
    // zoom rects: dotted rectangles shrink to the centre (window closing), then grow out (opening)
    transition(ctx, W, H, p, o = {}) {
      const k = p < 0.5 ? p * 2 : (1 - p) * 2, r0 = o.rect || [0, 0, W, H], cx = r0[0] + r0[2] / 2, cy = r0[1] + r0[3] / 2;
      if (k > 0.5) { rect(ctx, r0[0], r0[1], r0[2], r0[3], W0); }
      for (let i = 0; i < 5; i++) { const f = K.clamp(1 - k * 1.2 + i * 0.08); if (f <= 0.02 || f > 1) continue; const w = r0[2] * f, h = r0[3] * f; ants(ctx, cx - w / 2, cy - h / 2, w, h, i); }
    },
  };

  // ---------- the shared demo, painted in MacPaint ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(por) {
    if (!por) return { hook: [[96, 128, 'One video.'], [96, 178, 'Every platform.']], hsize: 64,
      card: [86, 66, 140, 84], cardLbl: [156, 176], node: [280, 92, 140, 80], nodeLbl: [350, 138],
      list: PLATFORMS.map((_, i) => [478, 70 + i * 32]), lsize: 32,
      top: [86, 50, 140, 34], cnt: [300, 180], csize: 100, views: [300, 206], bars: [488, 96, 130, 124], take: [[349, 276, 'Post once. Reach everywhere.']], tsize: 50 };
    return { hook: [[270, 380, 'One video.'], [270, 440, 'Every platform.']], hsize: 64,
      card: [180, 140, 180, 110], cardLbl: [270, 286], node: [150, 330, 240, 90], nodeLbl: [270, 383],
      list: PLATFORMS.map((_, i) => (i % 2 ? [292, 498 + Math.floor(i / 2) * 64] : [248, 498 + Math.floor(i / 2) * 64])), lsize: 32,
      top: [150, 140, 240, 50], cnt: [270, 420], csize: 92, views: [270, 460], bars: [60, 520, 420, 150], take: [[270, 740, 'Post once.'], [270, 800, 'Reach everywhere.']], tsize: 56 };
  }
  // a dithered photo-ish thumbnail: grey gradients the display pass will Atkinson-dither
  function thumb(ctx, x, y, w, h, t) {
    const g = ctx.createRadialGradient(x + w * 0.6, y + h * 0.35, 2, x + w * 0.5, y + h * 0.5, w * 0.7); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#c8c8c8'); g.addColorStop(1, '#202020');
    ctx.fillStyle = g; ctx.fillRect(R(x), R(y), R(w), R(h));
    const hz = ctx.createLinearGradient(0, y + h * 0.65, 0, y + h); hz.addColorStop(0, '#5a5a5a'); hz.addColorStop(1, '#101010'); ctx.fillStyle = hz; ctx.fillRect(R(x), R(y + h * 0.68), R(w), R(h * 0.32));
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Bf = buf(W, H), b = Bf.c.getContext('2d'), { bw, bh, por } = Bf, Lo = lay(por), s = S(b);
      b.imageSmoothingEnabled = false;
      const F = Math.floor(t * 30) / 30;
      const active = F < 2 ? 'text' : F < 2.9 ? 'rect' : F < 3.4 ? 'text' : F < 4.0 ? 'line' : F < 4.6 ? 'bucket' : F < 8.25 ? 'line' : F < 10 ? 'frect' : F < 10.45 ? 'select' : 'text';
      const G = desktop(b, bw, bh, por, F, active, F < 8.25 ? 'untitled' : 'reach.paint');
      const [cx, cy, cw, chh] = G.canvas;
      b.save(); b.beginPath(); b.rect(cx, cy, cw, chh); b.clip();
      let ptr = null, kind = 'cross';
      if (F < 0.4) style.transition(b, bw, bh, 0.5 + F / 0.8, { rect: G.canvas });
      if (F < 2.0) {
        Lo.hook.forEach(([x, y, txt], i) => { const p = K.beat(F, 0.35 + i * 0.5, 0.5, 'lin'); style.title(b, txt, x, y, p, { size: Lo.hsize, align: por ? 'center' : 'left' }); if (p > 0 && p < 1) ptr = [x + (por ? 0 : 200 * p), y - 10]; });
        if (F > 1.5) { const w = por ? 420 : 400; ants(b, por ? 270 - w / 2 : 86, por ? 330 : 92, w, por ? 130 : 100, F); }
      } else if (F < 8.25) {
        const [vx, vy, vw, vh] = Lo.card, pb = K.beat(F, 2.0, 0.5, 'lin');
        style.box(b, vx, vy, vw, vh, pb); if (pb > 0 && pb < 0.6) ptr = [vx + vw * pb / 0.6, vy + vh * pb / 0.6];
        if (pb >= 0.6) { thumb(b, vx + 3, vy + 3, vw - 6, vh - 6, F); b.fillStyle = W0; b.beginPath(); b.moveTo(R(vx + vw * 0.42), R(vy + vh * 0.3)); b.lineTo(R(vx + vw * 0.42), R(vy + vh * 0.7)); b.lineTo(R(vx + vw * 0.62), R(vy + vh * 0.5)); b.fill(); frameRect(b, vx, vy, vw, vh, 2); }
        style.label(b, 'your video', Lo.cardLbl[0], Lo.cardLbl[1], K.beat(F, 2.9, 0.4, 'lin'), { align: 'center' });
        const [nx, ny, nw, nh] = Lo.node;
        const ap = K.beat(F, 3.4, 0.5, 'lin'), a1 = por ? [[vx + vw / 2, Lo.cardLbl[1] + 8], [nx + nw / 2, ny - 4]] : [[vx + vw + 6, vy + vh / 2], [nx - 6, ny + nh / 2]];
        const e = style.arrow(b, a1[0], a1[1], ap); if (ap > 0 && ap < 1) ptr = e;
        const np = K.beat(F, 4.0, 0.6, 'lin'); style.box(b, nx, ny, nw, nh, np, { pattern: 'diag', shadow: true }); if (np > 0.55 && np < 0.75) { ptr = [nx + nw / 2, ny + nh / 2]; kind = 'arrow'; }
        if (F > 4.5) style.label(b, 'Creator OS', Lo.nodeLbl[0], Lo.nodeLbl[1], 1, { align: 'center', box: true, size: 36 });
        if (por && F > 4.95) { const yl = Lo.list[6][1] - 6; pline(b, bw / 2, ny + nh + 4, bw / 2, K.lerp(ny + nh + 4, yl, K.beat(F, 4.95, 0.4, 'lin')), 2); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [lx, ly] = Lo.list[i], p = K.beat(F, t0, 0.25, 'lin'), left = i % 2 === 0;
          let e2 = null;
          if (por) { if (p > 0) e2 = style.arrow(b, [bw / 2, ly - 6], [left ? bw / 2 - 18 : bw / 2 + 18, ly - 6], p); }
          else e2 = style.arrow(b, [nx + nw + 6, ny + nh / 2], [lx - 8, ly - 6], p);
          if (p > 0 && p < 1) ptr = e2;
          if (F > t0 + 0.25) { const n = Math.min(name.length, Math.floor((F - t0 - 0.25) * 40)); btext(b, name.slice(0, n), por ? (left ? lx - 22 : lx + 22) : lx, ly + 4, Lo.lsize * s, { align: por ? (left ? 'right' : 'left') : 'left' }); }
        });
      } else {
        const [tx, ty, tw, th] = Lo.top; style.box(b, tx, ty, tw, th, 1, { pattern: 'diag', shadow: true });
        style.label(b, 'Creator OS', tx + tw / 2, ty + th / 2 + 6, 1, { align: 'center', box: true, size: 30 });
        // a pattern-filled chart climbs while the count rolls
        const [bx, by, bwid, bht] = Lo.bars, k = K.beat(F, 8.6, 1.4);
        if (!por) { ['dark', 'brick', 'weave'].forEach((pn, i) => { const hgt = bht * K.clamp(k * (0.4 + i * 0.3)); b.fillStyle = pat(b, pn); b.fillRect(bx + i * 44, by + bht - hgt, 34, hgt); frameRect(b, bx + i * 44, by + bht - hgt, 34, hgt); }); rect(b, bx - 6, by + bht, 142, 2, B0); }
        else { ['dark', 'brick', 'weave', 'scales', 'check'].forEach((pn, i) => { const hgt = bht * K.clamp(k * (0.3 + i * 0.17)); b.fillStyle = pat(b, pn); b.fillRect(bx + i * 86, by + bht - hgt, 64, hgt); frameRect(b, bx + i * 86, by + bht - hgt, 64, hgt); }); rect(b, bx - 6, by + bht, bwid + 12, 2, B0); }
        const v = Math.round(K.count(F, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        style.counter(b, v, Lo.cnt[0], Lo.cnt[1], 1, { size: Lo.csize });
        style.label(b, 'views', Lo.views[0], Lo.views[1], K.beat(F, 8.7, 0.3, 'lin'), { align: 'center' });
        const cwid = textW('1,000,000', Lo.csize * s, { family: SERIF });
        style.emphasis(b, Lo.cnt[0], Lo.cnt[1] - Lo.csize * s * 0.32, cwid / 2 + 12, F >= 10 ? Math.min(1, (F - 10) / 0.6) : 0, { h: Lo.csize * s * 1.05, t: F });
        Lo.take.forEach(([x, y, txt], i) => style.title(b, txt, x, y, K.beat(F, 10.45 + i * 0.35, por ? 0.35 : 0.7, 'lin'), { size: Lo.tsize, align: 'center' }));
      }
      if (F > 7.6 && F < 8.9) style.transition(b, bw, bh, K.clamp((F - 7.6) / 1.3), { rect: G.canvas });
      b.restore();
      if (ptr) pointer(b, ptr[0], ptr[1], kind);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(Bf.c, 0, 0, W, H); ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.7);
      k.play('whoosh', 0.0, { dur: 0.35, gain: 0.5 });
      k.play('type', 0.35, { dur: 0.45 }); k.play('type', 0.85, { dur: 0.5 });
      k.play('click', 2.0); k.play('scribble', 2.0, { medium: 'pencil', dur: 0.3 }); k.play('paper', 2.3, { dur: 0.1 });
      k.play('type', 2.9, { dur: 0.3 }); k.play('click', 3.4); k.play('scribble', 3.4, { medium: 'pencil', dur: 0.5 });
      k.play('click', 4.0); k.play('scribble', 4.0, { medium: 'pencil', dur: 0.36 }); k.play('pop', 4.36, { pitch: 0.7 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pencil', dur: 0.25, gain: 0.7 }); k.play('click', 5.25 + i * 0.4, { pitch: 1.2 }); k.play('type', 5.27 + i * 0.4, { dur: 0.15, gain: 0.6 }); }
      k.play('whoosh', 7.6, { dur: 0.6, up: false }); k.play('whoosh', 8.3, { dur: 0.55 });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('blip', 10.0, { note: 'A4', dur: 0.12, gain: 1.4 }); k.play('blip', 10.12, { note: 'A4', dur: 0.12, gain: 1.4 });
      k.play('type', 10.45, { dur: 0.7 }); k.play('chime', 11.3, { note: 'C6' });
    },
  };
  MS.register(style);
})();
