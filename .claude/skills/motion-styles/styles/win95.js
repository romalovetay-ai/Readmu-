// Win95 Desktop (Retro UI & Neon). A mid-90s beige-box desktop drawn on a 2x pixel grid (640x360 / 540x960 buffer,
// blown up nearest-neighbour): teal wallpaper, 2-pixel bevelled grey chrome, navy title bars, aliased system text
// (alpha-thresholded, never smoothed), dotted pixel arrows, block progress bars, a setup wizard that walks the story,
// and the hung-window smear (a stair of frozen dialog copies) as the scene change.
(function () {
  const C = { teal: '#008080', face: '#c0c0c0', hi: '#ffffff', lt: '#dfdfdf', sh: '#808080', dk: '#000000', navy: '#000080', navy2: '#1084d0', white: '#ffffff', text: '#000000', sel: '#000080', red: '#ff0000', yellow: '#ffff00', blue: '#0000ff', green: '#008000' };
  const FONT = 'Arimo', R = Math.round;
  const S = (ctx) => K.layout(ctx.canvas.width, ctx.canvas.height).s;
  function buf(W, H) { const k = 2, bw = R(W / k), bh = R(H / k); return K.cached(`w95-buf:${W}x${H}`, () => ({ c: K.layer(bw, bh), bw, bh, k, por: H > W })); }

  // ---------- pixel primitives ----------
  const rect = (x, ctxx, y, w, h, col) => { ctxx.fillStyle = col; ctxx.fillRect(R(x), R(y), R(w), R(h)); };
  const fr = (c, x, y, w, h, col) => rect(x, c, y, w, h, col);
  function glyphs(str, size, weight, color) {
    return K.cached(`w95-g:${size}:${weight}:${color}:${str}`, () => {
      const m = K.layer(4, 4).getContext('2d'), font = `${weight} ${size}px "${FONT}"`; m.font = font; const w = Math.ceil(m.measureText(str).width) + 3, h = Math.ceil(size * 1.5);
      const c = K.layer(Math.max(1, w), h), x = c.getContext('2d'); x.font = font; x.fillStyle = '#000'; x.fillText(str, 1, R(size * 1.05));
      const im = x.getImageData(0, 0, c.width, h), d = im.data, [r, g, b] = K.hex(color);
      for (let i = 0; i < d.length; i += 4) { if (d[i + 3] >= 125) { d[i] = r; d[i + 1] = g; d[i + 2] = b; d[i + 3] = 255; } else d[i + 3] = 0; }
      x.putImageData(im, 0, 0); return { c, w: w - 3, base: R(size * 1.05) };
    });
  }
  function txt(c, str, x, y, size, o = {}) { if (!str) return 0; const g = glyphs(str, R(size), o.bold ? 700 : 400, o.color || C.text); const x0 = R(o.align === 'center' ? x - g.w / 2 : o.align === 'right' ? x - g.w : x); c.drawImage(g.c, x0 - 1, R(y) - g.base); return g.w; }
  const tw = (str, size, bold) => glyphs(str, R(size), bold ? 700 : 400, C.text).w;
  function raised(c, x, y, w, h, fill = C.face) { fr(c, x, y, w, h, C.dk); fr(c, x, y, w - 1, h - 1, C.hi); fr(c, x + 1, y + 1, w - 2, h - 2, C.sh); fr(c, x + 1, y + 1, w - 3, h - 3, C.lt); fr(c, x + 2, y + 2, w - 4, h - 4, fill); }
  function sunken(c, x, y, w, h, fill = C.white) { fr(c, x, y, w, h, C.hi); fr(c, x, y, w - 1, h - 1, C.sh); fr(c, x + 1, y + 1, w - 2, h - 2, C.lt); fr(c, x + 1, y + 1, w - 3, h - 3, C.dk); fr(c, x + 2, y + 2, w - 4, h - 4, fill); }
  function button(c, x, y, w, h, label, size, o = {}) { if (o.pressed) sunken(c, x, y, w, h, C.face); else raised(c, x, y, w, h); if (o.default) { fr(c, x - 1, y - 1, w + 2, 1, C.dk); fr(c, x - 1, y + h, w + 2, 1, C.dk); fr(c, x - 1, y, 1, h, C.dk); fr(c, x + w, y, 1, h, C.dk); } txt(c, label, x + w / 2 + (o.pressed ? 1 : 0), y + h / 2 + size * 0.38 + (o.pressed ? 1 : 0), size, { align: 'center' }); if (o.focus) dotted(c, x + 4, y + 4, w - 8, h - 8); }
  function dotted(c, x, y, w, h) { for (let i = 0; i < w; i += 2) { fr(c, x + i, y, 1, 1, C.dk); fr(c, x + i, y + h - 1, 1, 1, C.dk); } for (let j = 0; j < h; j += 2) { fr(c, x, y + j, 1, 1, C.dk); fr(c, x + w - 1, y + j, 1, 1, C.dk); } }
  function window95(c, x, y, w, h, title, o = {}) {
    raised(c, x, y, w, h); const tb = o.tb || (c.canvas.height > c.canvas.width ? 28 : 18);
    fr(c, x + 3, y + 3, w - 6, tb, o.inactive ? C.sh : C.navy);
    if (!o.inactive) { const g = c.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, C.navy); g.addColorStop(1, C.navy2); c.fillStyle = g; c.fillRect(R(x + 3), R(y + 3), R(w - 6), tb); }
    if (o.icon) o.icon(c, x + 6, y + 3 + (tb - 14) / 2, 14);
    txt(c, title, x + (o.icon ? 24 : 7), y + 3 + tb * 0.74, tb * 0.66, { bold: true, color: o.inactive ? C.lt : C.white });
    const bs = tb - 4; let bx = x + w - 5 - bs;
    for (const k of o.minmax === false ? ['x'] : ['x', 'o', '_']) { raised(c, bx, y + 5, bs, bs - 2); if (k === 'x') { for (let i = 0; i < bs * 0.5; i++) { fr(c, bx + bs * 0.25 + i, y + 5 + bs * 0.18 + i, 2, 1, C.dk); fr(c, bx + bs * 0.75 - i - 1, y + 5 + bs * 0.18 + i, 2, 1, C.dk); } } else if (k === 'o') { fr(c, bx + 3, y + 8, bs - 7, bs - 9, C.dk); fr(c, bx + 4, y + 10, bs - 9, bs - 12, C.face); } else fr(c, bx + 4, y + 5 + bs - 7, bs * 0.4, 2, C.dk); bx -= k === 'x' ? bs + 2 : bs; }
    return { x: x + 4, y: y + tb + 5, w: w - 8, h: h - tb - 9 };
  }
  function pline(c, x0, y0, x1, y1, col, dash = 0, th = 1) {
    x0 = R(x0); y0 = R(y0); x1 = R(x1); y1 = R(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy, i = 0;
    c.fillStyle = col; for (;;) { if (!dash || i % dash < dash / 2) c.fillRect(x0, y0, th, th); i++; if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } }
  }
  // ---------- icons (our own pixel drawings) ----------
  const ICON = {
    computer(c, x, y, z) { fr(c, x + z * 0.1, y, z * 0.8, z * 0.6, C.face); fr(c, x + z * 0.18, y + z * 0.08, z * 0.64, z * 0.42, C.teal); fr(c, x + z * 0.18, y + z * 0.08, z * 0.64, 1, C.dk); fr(c, x + z * 0.35, y + z * 0.6, z * 0.3, z * 0.1, C.sh); fr(c, x + z * 0.05, y + z * 0.72, z * 0.9, z * 0.2, C.face); fr(c, x + z * 0.05, y + z * 0.9, z * 0.9, 1, C.dk); },
    bin(c, x, y, z) { fr(c, x + z * 0.22, y + z * 0.2, z * 0.56, z * 0.75, C.lt); for (let i = 0; i < 4; i++) fr(c, x + z * 0.3 + i * z * 0.13, y + z * 0.28, 1, z * 0.6, C.sh); fr(c, x + z * 0.15, y + z * 0.12, z * 0.7, z * 0.1, C.sh); },
    file(c, x, y, z) { fr(c, x + z * 0.2, y, z * 0.55, z, C.dk); fr(c, x + z * 0.2 + 1, y + 1, z * 0.55 - 2, z - 2, C.white); fr(c, x + z * 0.6, y, z * 0.15, z * 0.15, C.sh); for (let i = 0; i < 4; i++) fr(c, x + z * 0.3, y + z * (0.3 + i * 0.15), z * 0.35, 1, C.blue); fr(c, x + z * 0.32, y + z * 0.55, z * 0.2, z * 0.2, C.red); },
    app(c, x, y, z) { fr(c, x, y, z, z * 0.85, C.dk); fr(c, x + 1, y + 1, z - 2, z * 0.85 - 2, C.white); fr(c, x + 1, y + 1, z - 2, z * 0.18, C.navy); for (let i = 0; i < z * 0.36; i++) fr(c, x + z * 0.38 + i * 0.5, y + z * 0.32 + i * 0.5 * 0, 1, Math.max(1, z * 0.36 - i), C.red); fr(c, x + z * 0.3, y + z * 0.3, 0, 0, C.red); },
    folder(c, x, y, z) { fr(c, x, y + z * 0.15, z * 0.4, z * 0.15, '#d8c060'); fr(c, x, y + z * 0.25, z, z * 0.6, '#ffe070'); fr(c, x, y + z * 0.85, z, 1, C.sh); },
    info(c, x, y, z) { c.fillStyle = C.white; c.beginPath(); c.arc(R(x + z / 2), R(y + z / 2), R(z / 2), 0, 6.283); c.fill(); c.fillStyle = C.blue; c.beginPath(); c.arc(R(x + z / 2), R(y + z / 2), R(z / 2 - 2), 0, 6.283); c.fill(); fr(c, x + z * 0.44, y + z * 0.4, z * 0.12, z * 0.4, C.white); fr(c, x + z * 0.44, y + z * 0.2, z * 0.12, z * 0.12, C.white); },
  };
  function appIcon(c, x, y, z) { fr(c, x, y, z, z * 0.85, C.dk); fr(c, x + 1, y + 1, z - 2, z * 0.85 - 2, C.white); fr(c, x + 1, y + 1, z - 2, Math.max(2, z * 0.18), C.navy); const ty = y + z * 0.32, th = z * 0.4; for (let i = 0; i < th * 0.8; i++) { const hh = th * (1 - i / (th * 0.8)); fr(c, x + z * 0.36 + i, ty + (th - hh) / 2, 1, hh, C.red); } }
  ICON.app = appIcon;
  function pointer(c, x, y) { const rows = ['1', '11', '121', '1221', '12221', '122221', '1222221', '12222221', '122222221', '1222222221', '122221111', '1221221', '121 1221', '11  1221', '1    1221', '     1221', '      11']; rows.forEach((row, j) => { for (let i = 0; i < row.length; i++) if (row[i] === '1') fr(c, x + i, y + j, 1, 1, C.dk); else if (row[i] === '2') fr(c, x + i, y + j, 1, 1, C.white); }); }
  function hourglass(c, x, y) { fr(c, x, y, 11, 2, C.dk); fr(c, x, y + 16, 11, 2, C.dk); for (let i = 0; i < 7; i++) { fr(c, x + 1 + i * 0.7, y + 2 + i, 9 - i * 1.4, 1, i < 3 ? '#c0a060' : C.white); fr(c, x + 1 + i * 0.7, y + 15 - i, 9 - i * 1.4, 1, i > 3 ? C.white : '#c0a060'); } }

  function desktop(c, bw, bh, por, t, tasks) {
    fr(c, 0, 0, bw, bh, C.teal);
    const icons = [['My Computer', ICON.computer], ['Recycle Bin', ICON.bin], ['your_video.mp4', ICON.file], ['README.TXT', ICON.file]];
    const z = por ? 40 : 28, fs = por ? 18 : 12;
    icons.forEach(([name, fn], i) => { const x = por ? 16 + i * 130 : 12, y = por ? 14 : 12 + i * 62; fn(c, x + (por ? 40 : 18), y, z); const w = tw(name, fs); const lx = x + (por ? 60 : 32); if (name === 'your_video.mp4' && t > 2 && t < 8.25) { fr(c, lx - w / 2 - 2, y + z + 3, w + 4, fs + 3, C.sel); txt(c, name, lx, y + z + fs + 1, fs, { align: 'center', color: C.white }); } else txt(c, name, lx, y + z + fs + 1, fs, { align: 'center', color: C.white }); });
    // taskbar
    const th = por ? 40 : 26, ty = bh - th; fr(c, 0, ty, bw, th, C.face); fr(c, 0, ty, bw, 1, C.lt); fr(c, 0, ty + 1, bw, 1, C.hi);
    const sw = por ? 100 : 62; raised(c, 3, ty + 3, sw, th - 6); for (let i = 0; i < 4; i++) fr(c, 8 + (i % 2) * 6, ty + 6 + Math.floor(i / 2) * 6, 5, 5, [C.red, C.green, C.blue, C.yellow][i]); txt(c, 'Start', 24 + (por ? 12 : 0), ty + th * 0.68, por ? 20 : 13, { bold: true });
    let x = sw + 8; tasks.forEach((tk, i) => { const w = por ? 190 : 150; if (x + w > bw - (por ? 110 : 80)) return; if (i === 0) sunken(c, x, ty + 3, w, th - 6, C.lt); else raised(c, x, ty + 3, w, th - 6); appIcon(c, x + 4, ty + 6, th - 12); txt(c, tk, x + th - 2, ty + th * 0.68, por ? 17 : 12, { bold: i === 0 }); x += w + 3; });
    const cw = por ? 100 : 72; sunken(c, bw - cw - 3, ty + 3, cw, th - 6, C.face); txt(c, '4:20 PM', bw - cw / 2 - 3, ty + th * 0.68, por ? 17 : 12, { align: 'center' });
    return ty;
  }

  const style = {
    id: 'win95', name: 'Win95 Desktop', family: 'Retro UI & Neon',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Arimo:wght@400;700&display=block', specs: ['400 12px "Arimo"', '700 12px "Arimo"'] }],
    palette: { bg: C.teal, ...C },
    sfx: { draw: null, land: 'click', emphasis: 'ding', transition: 'wrong', bed: 'hum' },
    buffer: buf, window95, raised, sunken, button, txt, icons: ICON,

    background(ctx, W, H, t) { ctx.fillStyle = C.teal; ctx.fillRect(0, 0, W, H); },
    // the monitor: snap to the 2x grid (idempotent for grid art), faint CRT rows and a touch of glass
    finish(ctx, W, H, t) {
      const Bf = buf(W, H), tmp = K.cached(`w95-fin:${W}x${H}`, () => K.layer(Bf.bw, Bf.bh)), x = tmp.getContext('2d');
      x.imageSmoothingEnabled = false; x.drawImage(ctx.canvas, 0, 0, Bf.bw, Bf.bh);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(tmp, 0, 0, W, H);
      const rows = K.cached(`w95-rows:${W}x${H}`, () => { const c = K.layer(W, H), r = c.getContext('2d'); r.fillStyle = 'rgba(0,0,0,0.06)'; for (let y = 1; y < H; y += 2) r.fillRect(0, y, W, 1); return c; });
      ctx.drawImage(rows, 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.18, '#000');
    },

    title(ctx, text, x, y, p, o = {}) { const s = S(ctx), size = (o.size || 52) * s, n = Math.floor(text.length * K.clamp(p)), w = tw(text, size, true); const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; txt(ctx, text.slice(0, n), x0, y, size, { bold: o.bold ?? true, color: o.color }); return { w, h: size }; },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 30, bold: false, ...o }); },
    // a dotted 1px pixel line with a solid triangle head
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null; const e = [K.lerp(from[0], to[0], K.clamp(p)), K.lerp(from[1], to[1], K.clamp(p))];
      pline(ctx, from[0], from[1], e[0], e[1], o.color || C.dk, 4, o.th || 2);
      if (p >= 1) { const a = Math.atan2(to[1] - from[1], to[0] - from[0]), L = 9; ctx.fillStyle = o.color || C.dk; ctx.beginPath(); ctx.moveTo(R(to[0]), R(to[1])); ctx.lineTo(R(to[0] - Math.cos(a - 0.5) * L), R(to[1] - Math.sin(a - 0.5) * L)); ctx.lineTo(R(to[0] - Math.cos(a + 0.5) * L), R(to[1] - Math.sin(a + 0.5) * L)); ctx.fill(); }
      return e;
    },
    // a window opens with the outline-zoom rectangles, then appears whole
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return null;
      if (p < 0.6) { const k = p / 0.6, ox = o.from ? o.from[0] : x + w / 2, oy = o.from ? o.from[1] : y + h; for (let i = 0; i < 3; i++) { const f = K.clamp(k - i * 0.15); if (f <= 0) continue; dotted(ctx, K.lerp(ox, x, f), K.lerp(oy, y, f), Math.max(4, w * f), Math.max(4, h * f)); } return null; }
      return window95(ctx, x, y, w, h, o.title || 'Creator OS', { icon: appIcon, ...o });
    },
    counter(ctx, value, x, y, p, o = {}) { return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 96, align: o.align || 'center' }); },
    // the title bar flashes active/inactive (the system "ding" flash) while a pressed-in field frames the number
    emphasis(ctx, x, y, r, p, o = {}) { if (p <= 0) return; const h = o.h || r * 0.4; if (Math.floor(p * 8) % 2 === 0 || p >= 1) { fr(ctx, x - r, y - h / 2, r * 2, 2, C.navy); fr(ctx, x - r, y + h / 2 - 2, r * 2, 2, C.navy); fr(ctx, x - r, y - h / 2, 2, h, C.navy); fr(ctx, x + r - 2, y - h / 2, 2, h, C.navy); } },
    // hung app: a frozen dialog dragged across the screen smears a stair of copies (covered at 0.5), then repaints
    transition(ctx, W, H, p, o = {}) {
      const n = 26, k = p < 0.5 ? p * 2 : 1, repaint = p < 0.5 ? -1 : (p - 0.5) * 2 * H * 1.1, ww = W * 0.55, hh = H * 0.36;
      const cnt = Math.floor(n * k);
      for (let i = 0; i < cnt; i++) {
        const f = i / (n - 1), x = K.lerp(-ww * 0.3, W - ww * 0.7, f) + Math.sin(f * 9) * W * 0.12, y = K.lerp(-hh * 0.2, H - hh * 0.8, f);
        if (repaint >= 0 && y + hh < repaint) continue;
        const ix = window95(ctx, x, y, ww, hh, 'BRAIN.EXE', { minmax: false, tb: Math.max(14, R(hh * 0.12)) });
        ICON.info(ctx, ix.x + 10, ix.y + 10, 24); txt(ctx, 'This program is not responding.', ix.x + 44, ix.y + 26, Math.max(11, hh * 0.08));
      }
      if (repaint >= 0) fr(ctx, 0, repaint, W, 0, C.teal);
    },
  };

  // ---------- the shared demo as a setup wizard ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(por) {
    if (!por) return { win: [92, 18, 540, 306], banner: [100, 44, 118, 228], pane: [232, 44], fs: 14, hs: 26,
      hook: [[236, 82, 'One video.'], [236, 112, 'Every platform.']], file: [252, 64], app: [348, 64], z: 32, list: PLATFORMS.map((_, i) => [452, 64 + i * 26]), prog: [236, 254, 380], btn: 286 };
    return { win: [12, 100, 516, 790], banner: [20, 136, 500, 140], pane: [28, 300], fs: 22, hs: 40,
      hook: [[36, 352, 'One video.'], [36, 402, 'Every platform.']], file: [70, 310], app: [300, 310], z: 56, list: PLATFORMS.map((_, i) => [150, 466 + i * 44]), prog: [36, 802, 460], btn: 836 };
  }
  function banner(c, x, y, w, h, t) {
    const g = c.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#000060'); g.addColorStop(1, '#2050c0'); c.fillStyle = g; c.fillRect(x, y, w, h);
    for (let yy = y; yy < y + h; yy += 2) for (let xx = x + ((yy / 2) % 2); xx < x + w; xx += 4) if (((xx * 7 + yy * 3) % 11) < 3) fr(c, xx, yy, 1, 1, '#4070e0');
    const mw = Math.min(w, h) * 0.6, mx = x + w / 2 - mw / 2, my = y + h * 0.18;
    raised(c, mx, my, mw, mw * 0.75); fr(c, mx + 6, my + 6, mw - 12, mw * 0.75 - 18, '#000000');
    const blink = Math.floor(t * 2) % 2; appIcon(c, mx + mw / 2 - mw * 0.18, my + mw * 0.14, mw * 0.36); if (blink) fr(c, mx + mw - 18, my + mw * 0.75 - 9, 4, 2, '#00ff00');
    fr(c, mx + mw * 0.3, my + mw * 0.75, mw * 0.4, 6, C.face);
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Bf = buf(W, H), c = Bf.c.getContext('2d'), { bw, bh, por } = Bf, Lo = lay(por), F = Math.floor(t * 30) / 30, fs = Lo.fs;
      c.imageSmoothingEnabled = false;
      const scene2 = F >= 8.25;
      desktop(c, bw, bh, por, F, scene2 ? ['Creator OS', 'Upload Status'] : ['Creator OS Setup', 'Neural Net']);
      let ptr = null, busy = false;
      const [wx, wy, ww, wh] = Lo.win;
      if (!scene2) {
        const ip = style.box(c, wx, wy, ww, wh, K.beat(F, 0.0, 0.35, 'lin'), { title: 'Creator OS Setup Wizard', from: [40, 160] });
        if (ip) {
          const [bx, by, bwid, bht] = Lo.banner; banner(c, bx, by, bwid, bht, F);
          if (F < 2.0) {
            Lo.hook.forEach(([x, y, line], i) => style.title(c, line, x, y + (por ? 20 : 0), K.beat(F, 0.4 + i * 0.3, 0.3, 'lin'), { size: Lo.hs / (por ? 0.738 : 0.5) }));
            const body = ['This wizard will post your video', 'to every platform you choose.', '', 'Click Next to continue.'];
            if (F > 1.1) body.forEach((ln, i) => txt(c, ln, Lo.pane[0] + 4, Lo.hook[1][1] + (por ? 80 : 40) + i * fs * 1.35, fs));
          } else {
            txt(c, F < 5 ? 'Step 2 of 3: Import your video' : 'Step 3 of 3: Choose platforms', Lo.pane[0] + 4, Lo.pane[1] + (por ? 0 : 0) + (por ? -10 : 0) + fs, fs, { bold: true });
            const [fx, fy] = Lo.file, [ax, ay] = Lo.app, z = Lo.z;
            if (F > 2.1) { ICON.file(c, fx, fy + fs, z); txt(c, 'your_video.mp4', fx + z / 2, fy + fs + z + fs + 2, fs, { align: 'center' }); }
            if (F > 2.1 && F < 3.4) ptr = [fx + z * 0.7 + (3.4 - F) * 30, fy + fs + z * 0.6];
            const ap = K.beat(F, 3.4, 0.5, 'lin'); style.arrow(c, [fx + z + 6, fy + fs + z / 2], [ax - 8, ay + fs + z / 2], ap);
            if (F > 3.9) { appIcon(c, ax, ay + fs, z); txt(c, 'Creator OS', ax + z / 2, ay + fs + z + fs + 2, fs, { align: 'center', bold: true }); }
            // copying progress in blocks
            const [px, py, pw] = Lo.prog, k = K.clamp((F - 3.4) / 4.2), blocks = Math.floor(k * 28);
            if (F > 3.4) { txt(c, k < 1 ? 'Copying files...' : 'Done.', px, py - 6, fs); sunken(c, px, py, pw, fs + 8, C.white); const bwd = (pw - 6) / 28; for (let i = 0; i < blocks; i++) fr(c, px + 3 + i * bwd, py + 3, bwd - 2, fs + 2, C.navy); busy = k < 1; }
            // the checklist: each platform gets a dotted arrow and a tick
            if (F > 4.8) {
              const lx0 = Lo.list[0][0] - 8, ly0 = Lo.list[0][1] + fs * 0.3;
              if (por) { pline(c, ax + z / 2, ay + fs + z + fs * 1.6, ax + z / 2, ay + fs + z + fs * 2.4, C.dk, 4, 2); pline(c, ax + z / 2, ay + fs + z + fs * 2.4, 110, ay + fs + z + fs * 2.4, C.dk, 4, 2); pline(c, 110, ay + fs + z + fs * 2.4, 110, K.lerp(ly0, Lo.list[6][1], K.beat(F, 4.85, 2.6, 'lin')) - fs * 0.4, C.dk, 4, 2); }
              sunken(c, lx0 - 6, Lo.list[0][1] - fs - 8, por ? 340 : 168, Lo.list[6][1] - Lo.list[0][1] + fs * 2 + 10, C.white);
            }
            PLATFORMS.forEach((name, i) => {
              const t0 = 5.0 + i * 0.4, [lx, ly] = Lo.list[i], p = K.beat(F, t0, 0.2, 'lin');
              if (por) style.arrow(c, [110, ly - fs * 0.4], [lx - 6, ly - fs * 0.4], p);
              else style.arrow(c, [ax + z + 4, ay + fs + z / 2], [lx - 8, ly - fs * 0.4], p, { th: 1 });
              if (F > 4.8) { const cb = fs; sunken(c, lx, ly - cb, cb, cb, C.white); txt(c, name, lx + cb + 6, ly - 1, fs); const on = F > t0 + 0.2; if (on) { for (let j = 0; j < 3; j++) { fr(c, lx + 3 + j, ly - cb * 0.5 + j, 1, 2, C.dk); } for (let j = 0; j < cb * 0.5; j++) fr(c, lx + 5 + j, ly - cb * 0.25 - j, 1, 2, C.dk); } if (F > t0 + 0.2 && F < t0 + 0.45) { fr(c, lx + cb + 4, ly - fs, tw(name, fs) + 4, fs + 3, C.sel); txt(c, name, lx + cb + 6, ly - 1, fs, { color: C.white }); ptr = [lx + 4, ly - cb * 0.4]; } }
            });
          }
          const by2 = wy + wh - (por ? 50 : 32), bwid2 = por ? 140 : 80, bht2 = por ? 36 : 22;
          button(c, wx + ww - bwid2 * 3 - 30, by2, bwid2, bht2, '< Back', fs);
          button(c, wx + ww - bwid2 * 2 - 22, by2, bwid2, bht2, 'Next >', fs, { default: true, focus: true, pressed: (F > 1.85 && F < 2.0) });
          button(c, wx + ww - bwid2 - 12, by2, bwid2, bht2, 'Cancel', fs);
          if (F > 1.5 && F < 2.05) ptr = [wx + ww - bwid2 * 1.5 - 22, by2 + bht2 / 2];
        }
      } else {
        const ip = window95(c, wx, wy, ww, wh * (por ? 0.62 : 0.78), 'Creator OS - Upload Status', { icon: appIcon });
        const cx = ip.x + ip.w / 2;
        txt(c, 'Posted to 7 platforms', ip.x + 10, ip.y + fs + 8, fs, { bold: true });
        // group box with the views counter
        const gy = ip.y + fs * 2.6, gh = por ? 220 : 92; fr(c, ip.x + 10, gy, ip.w - 20, 1, C.sh); fr(c, ip.x + 10, gy + 1, ip.w - 20, 1, C.hi); fr(c, ip.x + 10, gy + gh, ip.w - 20, 1, C.sh); fr(c, ip.x + 10, gy, 1, gh, C.sh); fr(c, ip.x + ip.w - 11, gy, 1, gh, C.sh);
        fr(c, ip.x + 18, gy - fs / 2, tw('Views', fs) + 8, fs, C.face); txt(c, 'Views', ip.x + 22, gy + fs * 0.4, fs);
        const v = Math.round(K.count(F, 8.6, 1.4, 0, 1000000) / 1000) * 1000, csz = por ? 72 : 44;
        txt(c, K.fmt(v), cx, gy + gh * 0.5 + csz * 0.38, csz, { bold: true, align: 'center' });
        style.emphasis(c, cx, gy + gh * 0.5, tw('1,000,000', csz, true) / 2 + 16, K.beat(F, 10.0, 0.5, 'lin'), { h: csz * 1.5 });
        const [px, , pw] = Lo.prog, py = gy + gh + (por ? 40 : 16); sunken(c, ip.x + 10, py, ip.w - 20, fs + 8, C.white); const bwd = (ip.w - 26) / 30, k = K.beat(F, 8.6, 1.4); for (let i = 0; i < Math.floor(k * 30); i++) fr(c, ip.x + 13 + i * bwd, py + 3, bwd - 2, fs + 2, C.navy);
        sunken(c, ip.x, ip.y + ip.h - fs - 8, ip.w, fs + 8, C.face); txt(c, `${K.fmt(v)} views`, ip.x + 6, ip.y + ip.h - 6, fs * 0.9);
        if (F < 8.6) busy = true;
        // the payoff: a classic message box
        if (F > 10.4) {
          const mw = por ? 470 : 330, mh = por ? 220 : 128, mx = bw / 2 - mw / 2, my = por ? wy + wh * 0.6 : 176;
          const ib = style.box(c, mx, my, mw, mh, K.beat(F, 10.4, 0.35, 'lin'), { title: 'Creator OS', minmax: false, from: [cx, gy] });
          if (ib) { ICON.info(c, ib.x + 14, ib.y + 14, por ? 44 : 30); const ts = por ? 30 : 18; txt(c, 'Post once.', ib.x + (por ? 76 : 56), ib.y + ts + 12, ts, { bold: true }); txt(c, 'Reach everywhere.', ib.x + (por ? 76 : 56), ib.y + ts * 2 + 18, ts, { bold: true }); button(c, ib.x + ib.w / 2 - (por ? 60 : 40), ib.y + ib.h - (por ? 48 : 30), por ? 120 : 80, por ? 36 : 22, 'OK', fs, { default: true, focus: true }); if (F > 11.2) ptr = [ib.x + ib.w / 2, ib.y + ib.h - (por ? 30 : 18)]; }
        }
      }
      if (F > 7.6 && F < 8.9) style.transition(c, bw, bh, K.clamp((F - 7.6) / 1.3));
      if (ptr) pointer(c, ptr[0], ptr[1]); else if (busy) hourglass(c, bw * 0.62, bh * 0.6);
      ctx.save(); ctx.imageSmoothingEnabled = false; ctx.drawImage(Bf.c, 0, 0, W, H); ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 0.5); k.bed('room', 0, 12, 0.6);
      k.play('swell', 0.0, { dur: 1.6, chord: ['C4', 'G4', 'E5'], gain: 1.2 }); k.play('chime', 0.1, { note: 'G5', gain: 0.5 });
      k.play('click', 1.85, { gain: 1.5 }); k.play('click', 1.95, { gain: 1.2, pitch: 0.8 });
      k.play('click', 2.1); k.play('tick', 3.4); k.play('pop', 3.9, { pitch: 1.2 });
      for (let i = 0; i < 14; i++) k.play('tick', 3.5 + i * 0.3, { gain: 0.5 });
      for (let i = 0; i < 7; i++) { k.play('click', 5.2 + i * 0.4, { gain: 1.3 }); k.play('blip', 5.22 + i * 0.4, { note: 'C6', dur: 0.03, gain: 0.4 }); }
      k.play('wrong', 7.6); k.play('glitch', 7.8, { gain: 0.5 }); for (let i = 0; i < 8; i++) k.play('click', 7.65 + i * 0.07, { pitch: 0.5, gain: 0.8 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('ding', 10.0);
      k.play('pop', 10.4, { pitch: 0.8 }); k.play('chime', 10.75, { note: 'E5' }); k.play('click', 11.3, { gain: 1.4 });
    },
  };
  MS.register(style);
})();
