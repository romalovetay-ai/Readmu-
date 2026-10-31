// ASCII Demoscene (Retro Digital). Everything lives on a strict monospace character grid: a spinning 3D torus
// rasterised into characters through a luminance ramp (point-splatted with a z-buffer, lit by a fixed light), a sparse
// colour-coded plasma backdrop, half-block "figlet" lettering, box-drawing panels and arrows, copper bars, a rainbow
// sine scroller. Finish: soft phosphor bloom, faint scanlines, vignette. The scene change is a scan-row re-raster.
(function () {
  const FONT = 'IBM Plex Mono', RAMP = ' .,:;-=+*!#$@';
  const HUES = ['#2a1a6a', '#4a2aa8', '#7a3ad8', '#b04ad8', '#e05ab0', '#ff6a7a', '#ff9a4a', '#ffd04a', '#6aff8a', '#4ae0ff', '#4a8aff', '#c8d4ff'];
  const CYAN = '#4ae0ff', TEXT = '#c8d4ff', DIMT = '#6a74a8', HOT = '#ffd04a', MAG = '#e05ab0';
  const S = (ctx) => K.layout(ctx.canvas.width, ctx.canvas.height).s;
  const grid = (s) => ({ cw: Math.max(5, Math.round(8 * s)), ch: Math.max(8, Math.round(14 * s)) });

  // atlas: every ramp character in every hue, so the background is drawn with drawImage, not fillText
  function atlas(s) {
    return K.cached(`ascii-atlas:${s.toFixed(3)}`, () => {
      const { cw, ch } = grid(s), c = K.layer(cw * RAMP.length, ch * HUES.length), x = c.getContext('2d');
      x.font = `500 ${Math.round(ch * 0.95)}px "${FONT}"`; x.textBaseline = 'middle'; x.textAlign = 'center';
      HUES.forEach((h, j) => { x.fillStyle = h; for (let i = 0; i < RAMP.length; i++) x.fillText(RAMP[i], i * cw + cw / 2, j * ch + ch / 2 + 1); });
      return c;
    });
  }
  // put one ramp char (lum 0..1) in hue j at cell (cx, cy)
  function cell(ctx, A, s, gx, gy, lum, j) { const { cw, ch } = grid(s), i = Math.max(0, Math.min(RAMP.length - 1, Math.round(lum * (RAMP.length - 1)))); if (i) ctx.drawImage(A, i * cw, j * ch, cw, ch, gx * cw, gy * ch, cw, ch); }

  // ---------- the torus, splatted into the grid ----------
  const ZB = new Map();
  function torus(ctx, cx, cy, R, t, o = {}) {
    const s = S(ctx), { cw, ch } = grid(s), A = atlas(s), gw = Math.ceil(ctx.canvas.width / cw), gh = Math.ceil(ctx.canvas.height / ch);
    const key = gw * 10000 + gh; if (!ZB.has(key)) ZB.set(key, { z: new Float32Array(gw * gh), l: new Float32Array(gw * gh), h: new Uint8Array(gw * gh) });
    const B = ZB.get(key); B.z.fill(0);
    const a = 1.15 + 0.25 * Math.sin(t * 0.8 + (o.phase || 0)), b = t * 1.1, ca = Math.cos(a), sa = Math.sin(a), cb = Math.cos(b), sb = Math.sin(b);
    const r1 = 1, r2 = 2, K2 = 6, K1 = (R / cw) * K2 / (r1 + r2) * 0.9, gcx = cx / cw, gcy = cy / ch, prog = o.p ?? 1;
    const minY = gcy - K1 * 0.6 * (cw / ch) * 3.2, rows = (K1 * 3.2 * (cw / ch)) * 1.2; // scan reveal top to bottom
    const touched = [];
    for (let th = 0; th < 6.283; th += 0.07) {
      const ct = Math.cos(th), st = Math.sin(th);
      for (let ph = 0; ph < 6.283; ph += 0.02) {
        const cp = Math.cos(ph), sp = Math.sin(ph), hx = r2 + r1 * ct, hy = r1 * st;
        const x = hx * (cb * cp + sa * sb * sp) - hy * ca * sb, y = hx * (sb * cp - sa * cb * sp) + hy * ca * cb, z = K2 + ca * hx * sp + hy * sa, ooz = 1 / z;
        const gx = Math.floor(gcx + K1 * ooz * x), gy = Math.floor(gcy - K1 * ooz * y * (cw / ch));
        if (gx < 0 || gy < 0 || gx >= gw || gy >= gh) continue;
        if (prog < 1 && gy > minY + rows * prog) continue;
        const L = cp * ct * sb - ca * ct * sp - sa * st + cb * (ca * st - ct * sa * sp), i = gy * gw + gx;
        if (ooz > B.z[i]) { if (!B.z[i]) touched.push(i); B.z[i] = ooz; B.l[i] = L; B.h[i] = Math.max(0, Math.min(11, Math.round(((th / 6.283) * 5 + (y + 3) * 0.6)) + 1)); }
      }
    }
    for (const i of touched) { const L = B.l[i]; cell(ctx, A, s, i % gw, Math.floor(i / gw), L <= 0 ? 0.12 : K.clamp(0.28 + L * 0.6), o.mono ? 11 : Math.min(11, B.h[i] + (L > 0.9 ? 1 : 0))); }
  }
  function plasma(ctx, W, H, t, amt) {
    if (amt <= 0) return; const s = S(ctx), { cw, ch } = grid(s), A = atlas(s), gw = Math.ceil(W / cw), gh = Math.ceil(H / ch);
    ctx.save(); ctx.globalAlpha = 0.8 * amt;
    for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) {
      const v = Math.sin(gx * 0.11 + t * 1.3) + Math.sin(gy * 0.17 - t * 0.9) + Math.sin((gx + gy) * 0.07 + t * 0.7) + Math.sin(Math.hypot(gx - gw / 2, gy - gh / 2) * 0.12 - t * 1.5);
      const l = (v + 4) / 8; if (l < 0.5) continue;
      cell(ctx, A, s, gx, gy, (l - 0.5) * 1.3, 1 + Math.floor(l * 8) % 5);
    }
    ctx.restore();
  }
  function copper(ctx, W, y, h, t, a = 1) {
    const cols = ['#3a0a5a', '#8a1a8a', '#ff4a9a', '#ffd0e0', '#ff4a9a', '#8a1a8a', '#3a0a5a'];
    ctx.save(); ctx.globalAlpha = a; cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(0, y + (i * h) / cols.length, W, h / cols.length + 1); }); ctx.restore();
  }

  // ---------- figlet-style half-block lettering from the bitmap of a pixel font ----------
  function bitmap(text) {
    return K.cached(`ascii-bm:${text}`, () => {
      const w = text.length * 8, c = K.layer(w, 8), x = c.getContext('2d'); x.font = '8px "Press Start 2P"'; x.textBaseline = 'top'; x.fillStyle = '#fff'; x.fillText(text, 0, 0);
      const d = x.getImageData(0, 0, w, 8).data, on = new Uint8Array(w * 8); for (let i = 0; i < w * 8; i++) on[i] = d[i * 4 + 3] > 110 ? 1 : 0; return { w, on };
    });
  }
  // px = width of one bitmap pixel (one character cell); each cell holds two bitmap rows as half blocks
  function figlet(ctx, text, x, y, px, p, o = {}) {
    const bm = bitmap(text), cw = px, ch = px * 1.75, ph = ch / 2, w = bm.w * cw, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const cols = Math.floor(bm.w * K.clamp(p)), grad = o.grad || ['#ff3a5a', '#ff6a4a', '#ff9a3a', '#ffc84a'];
    const draw = (dx, dy, shadow) => {
      for (let gx = 0; gx < cols; gx++) for (let r = 0; r < 4; r++) {
        const top = bm.on[r * 2 * bm.w + gx], bot = bm.on[(r * 2 + 1) * bm.w + gx]; if (!top && !bot) continue;
        ctx.fillStyle = shadow || grad[r];
        const X = x0 + gx * cw + dx, Y = y - 4 * ch + r * ch + dy;
        if (top) ctx.fillRect(X, Y, cw - 1, ph - 0.5);
        if (bot) ctx.fillRect(X, Y + ph, cw - 1, ph - 0.5);
      }
    };
    draw(cw * 0.6, ch * 0.35, o.shadow || '#4a1a5a'); draw(0, 0);
    return { w, h: 4 * ch };
  }

  function mono(ctx, str, x, y, size, color, align = 'left', weight = 600) {
    ctx.save(); ctx.font = `${weight} ${size}px "${FONT}"`; ctx.textAlign = align; ctx.fillStyle = color; ctx.fillText(str, x, y); ctx.restore();
  }

  const style = {
    id: 'ascii-render', name: 'ASCII Demoscene', family: 'Retro Digital',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600&family=Press+Start+2P&display=block', specs: ['500 14px "IBM Plex Mono"', '600 30px "IBM Plex Mono"', '8px "Press Start 2P"'] }],
    palette: { bg: '#05040c', text: TEXT, dim: DIMT, cyan: CYAN, hot: HOT, magenta: MAG, hues: HUES },
    sfx: { draw: null, land: 'blip', emphasis: 'glitch', transition: 'riser', bed: 'tape' },
    torus, plasma, copper, figlet,

    background(ctx, W, H, t) { ctx.fillStyle = '#05040c'; ctx.fillRect(0, 0, W, H); },
    finish(ctx, W, H, t) {
      const d = 4, w = Math.ceil(W / d), h = Math.ceil(H / d), a = K.cached(`ascii-ba:${W}x${H}`, () => K.layer(w, h)), b = K.cached(`ascii-bb:${W}x${H}`, () => K.layer(w, h));
      const ax = a.getContext('2d'), bx = b.getContext('2d'); ax.clearRect(0, 0, w, h); ax.drawImage(ctx.canvas, 0, 0, w, h);
      bx.clearRect(0, 0, w, h); bx.filter = 'blur(4px)'; bx.drawImage(a, 0, 0); bx.filter = 'none';
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.7; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
      const sl = K.cached(`ascii-sl:${W}x${H}`, () => { const c = K.layer(W, H), x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.22)'; for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1); return c; });
      ctx.drawImage(sl, 0, 0); K.vignette(ctx, W, H, 0.5, '#000'); K.grain(ctx, W, H, t, 0.03, 24, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) { const s = S(ctx); return figlet(ctx, text.toUpperCase(), x, y, (o.size || 64) / 8.5 * s, p, o); },
    label(ctx, text, x, y, p, o = {}) {
      const s = S(ctx), n = Math.floor(text.length * K.clamp(p)), size = (o.size || 30) * s;
      mono(ctx, text.slice(0, n) + (n < text.length && p > 0 ? '_' : ''), x, y, size, o.color || TEXT, o.align || 'left');
      return { w: text.length * size * 0.6, h: size };
    },
    // box-drawing arrow: dashes and pipes stepped along the path on the character grid, a solid head
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null; const s = S(ctx), size = 26 * s, step = size * 0.6, dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy), n = Math.floor((L / step) * K.clamp(p));
      const ch = Math.abs(dx) > Math.abs(dy) * 2 ? '─' : Math.abs(dy) > Math.abs(dx) * 2 ? '│' : (dx > 0) === (dy > 0) ? '╲' : '╱';
      ctx.save(); ctx.font = `600 ${size}px "${FONT}"`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.color || CYAN;
      for (let i = 0; i < n; i++) ctx.fillText(ch, from[0] + (dx * i) / (L / step), from[1] + (dy * i) / (L / step));
      if (p >= 1) { const a = Math.atan2(dy, dx), hc = Math.abs(a) < 0.8 ? '►' : Math.abs(a) > 2.4 ? '◄' : a > 0 ? '▼' : '▲'; ctx.fillStyle = o.head || HOT; ctx.fillText(hc, to[0], to[1]); }
      ctx.restore(); return [from[0] + dx * K.clamp(p), from[1] + dy * K.clamp(p)];
    },
    // box-drawing panel, printed row by row, with an optional [ TITLE ] tab
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return; const s = S(ctx), size = 24 * s, cw = size * 0.6, rows = Math.max(2, Math.round(h / size)), cols = Math.max(2, Math.round(w / cw)), dbl = o.double;
      const [tl, tr, bl, br, hz, vt] = dbl ? ['╔', '╗', '╚', '╝', '═', '║'] : ['┌', '┐', '└', '┘', '─', '│'];
      const shown = Math.ceil(rows * K.clamp(p));
      ctx.save(); ctx.font = `500 ${size}px "${FONT}"`; ctx.textBaseline = 'top'; ctx.fillStyle = o.color || CYAN;
      for (let r = 0; r < shown; r++) {
        const line = r === 0 ? tl + hz.repeat(cols - 2) + tr : r === rows - 1 ? bl + hz.repeat(cols - 2) + br : vt + ' '.repeat(cols - 2) + vt;
        ctx.fillText(line, x, y + r * size);
      }
      if (o.title && p >= 1) { ctx.fillStyle = o.titleColor || HOT; ctx.fillText(`[ ${o.title} ]`, x + cw * 2, y); }
      ctx.restore();
    },
    counter(ctx, value, x, y, p, o = {}) { const s = S(ctx); return figlet(ctx, K.fmt(value), x, y, (o.size || 120) / 8.5 * s, 1, { align: o.align || 'center', grad: o.grad || ['#4ae0ff', '#6aff8a', '#ffd04a', '#ff9a4a'] }); },
    // a double-line frame flashes in reverse video around the key number, sparks fly off the corners
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return; const s = S(ctx), hh = (o.h || 120) * s, on = p >= 1 || Math.floor(p * 10) % 2 === 0;
      if (on) style.box(ctx, x - r, y - hh / 2, r * 2, hh, 1, { double: true, color: HOT });
      const rr = K.rng(9); ctx.save(); ctx.font = `600 ${26 * s}px "${FONT}"`; ctx.fillStyle = MAG;
      for (let i = 0; i < 14; i++) { const a = rr() * 6.283, d = (0.3 + p) * (80 + rr() * 140) * s; if (p < 1) ctx.fillText(rr() > 0.5 ? '*' : '+', x + Math.cos(a) * (r + d * 0.6), y + Math.sin(a) * (hh / 2 + d * 0.4)); }
      ctx.restore();
    },
    // re-raster: a bright scan row sweeps down, leaving static characters; then sweeps again revealing the new page
    transition(ctx, W, H, p, o = {}) {
      const s = S(ctx), { cw, ch } = grid(s), A = atlas(s), gw = Math.ceil(W / cw), gh = Math.ceil(H / ch), r = K.rng(Math.floor(p * 40) + 3);
      const k = p < 0.5 ? p * 2 : (p - 0.5) * 2, yRow = Math.floor(k * gh);
      const y0 = p < 0.5 ? 0 : yRow, y1 = p < 0.5 ? yRow : gh;
      ctx.fillStyle = '#05040c'; ctx.fillRect(0, y0 * ch, W, (y1 - y0) * ch);
      for (let gy = y0; gy < y1; gy++) for (let gx = 0; gx < gw; gx += 1) if (r() < 0.12) cell(ctx, A, s, gx, gy, r() * 0.6, r.int(0, 4));
      ctx.fillStyle = 'rgba(200,220,255,0.85)'; ctx.fillRect(0, yRow * ch, W, ch * 0.6);
    },
  };

  // ---------- the shared demo as a demo intro ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, por: false, hook: [[60 * s, 170 * s, 'ONE VIDEO.'], [60 * s, 290 * s, 'EVERY PLATFORM.']], hsize: 58, torusA: [1090 * s, 400 * s, 165 * s],
      card: [40 * s, 150 * s, 260 * s, 140 * s], cardLbl: [60 * s, 335 * s], node: [575 * s, 260 * s, 130 * s], nodeLbl: [575 * s, 430 * s],
      list: PLATFORMS.map((_, i) => [850 * s, (130 + i * 60) * s]), listBox: [820 * s, 70 * s, 400 * s, 470 * s], nfo: [40 * s, 560 * s],
      top: [W / 2, 120 * s, 90 * s], cnt: [W / 2, 400 * s], csize: 120, views: [W / 2, 450 * s], scroll: 600 * s, ssize: 44 };
    return { s, por: true, hook: [[W / 2, H * 0.12, 'ONE'], [W / 2, H * 0.2, 'VIDEO.'], [W / 2, H * 0.29, 'EVERY'], [W / 2, H * 0.37, 'PLATFORM.']], hsize: 64, torusA: [W / 2, H * 0.62, 300 * s],
      card: [W / 2 - 230 * s, H * 0.06, 460 * s, 110 * s], cardLbl: [W / 2 - 200 * s, H * 0.16], node: [W / 2, H * 0.27, 120 * s], nodeLbl: [W / 2 - 150 * s, H * 0.37],
      list: PLATFORMS.map((_, i) => [W * 0.2, H * (0.46 + i * 0.05)]), listBox: [W * 0.12, H * 0.415, W * 0.76, H * 0.38], nfo: [W * 0.08, H * 0.88],
      top: [W / 2, H * 0.16, 110 * s], cnt: [W / 2, H * 0.42], csize: 70, views: [W / 2, H * 0.47], scroll: H * 0.62, ssize: 40 };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, por = Lo.por;
      style.background(ctx, W, H, t);
      plasma(ctx, W, H, t, K.clamp(t / 1.2) * (t < 8.25 ? 0.8 : 0.6));
      if (t < 2.0) {
        torus(ctx, Lo.torusA[0], Lo.torusA[1], Lo.torusA[2], t, { p: K.beat(t, 0.1, 1.2, 'lin') });
        Lo.hook.forEach(([x, y, txt], i) => style.title(ctx, txt, x, y, K.beat(t, 0.15 + i * 0.3, 0.45, 'lin'), { size: Lo.hsize, align: por ? 'center' : 'left' }));
        if (!por) style.label(ctx, 'a 4k intro  .  creator os  .  party release 2026', 64 * s, 340 * s, K.beat(t, 1.0, 0.6, 'lin'), { size: 28, color: DIMT });
      } else if (t < 8.25) {
        const [vx, vy, vw, vh] = Lo.card;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.4, 'lin'), { title: 'INPUT' });
        if (t > 2.4) { mono(ctx, '►', vx + vw / 2 - 20 * s, vy + vh / 2 + 22 * s, 64 * s, '#ff5a7a', 'left', 500); }
        style.label(ctx, 'your_video.mp4', Lo.cardLbl[0], Lo.cardLbl[1], K.beat(t, 2.6, 0.5, 'lin'), { size: 30 });
        const [ox, oy, orr] = Lo.node;
        if (por) style.arrow(ctx, [W / 2, Lo.cardLbl[1] + 20 * s], [W / 2, oy - orr * 0.95], K.beat(t, 3.3, 0.5, 'lin'));
        else style.arrow(ctx, [vx + vw + 20 * s, vy + vh / 2], [ox - orr * 1.15, oy - 20 * s], K.beat(t, 3.3, 0.5, 'lin'));
        if (t > 3.8) torus(ctx, ox, oy, orr, t, { p: K.beat(t, 3.8, 0.8, 'lin') });
        style.label(ctx, 'CREATOR OS', Lo.nodeLbl[0], Lo.nodeLbl[1], K.beat(t, 4.4, 0.4, 'lin'), { size: 52, color: HOT, align: por ? 'left' : 'center' });
        const [bx, by, bw, bh] = Lo.listBox;
        style.box(ctx, bx, by, bw, bh, K.beat(t, 4.85, 0.25, 'lin'), { title: 'OUTPUT' });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [lx, ly] = Lo.list[i], p = K.beat(t, t0, 0.25, 'lin');
          if (!por) style.arrow(ctx, [ox + orr * 1.25, oy], [bx - 6 * s, ly - 10 * s], p, { head: CYAN });
          if (t > t0 + 0.15) {
            const sel = t < t0 + 0.55;
            if (sel) { ctx.fillStyle = CYAN; ctx.fillRect(lx - 8 * s, ly - 30 * s, (por ? W * 0.62 : 340 * s), 40 * s); }
            style.label(ctx, `> ${name.toUpperCase()}`, lx, ly, K.beat(t, t0 + 0.15, 0.2, 'lin'), { size: 34, color: sel ? '#05040c' : TEXT });
            style.label(ctx, '[OK]', lx + (por ? W * 0.5 : 260 * s), ly, 1, { size: 30, color: sel ? '#05040c' : '#6aff8a' });
          }
        });
        if (por) style.arrow(ctx, [W / 2, Lo.nodeLbl[1] + 14 * s], [W / 2, by - 6 * s], K.beat(t, 4.7, 0.2, 'lin'));
      } else {
        const [tx, ty, tr] = Lo.top;
        torus(ctx, tx, ty, tr, t, {});
        style.label(ctx, 'CREATOR OS', por ? W / 2 : tx + tr * 1.4, por ? ty + tr * 1.1 : ty + 14 * s, 1, { size: 40, color: HOT, align: por ? 'center' : 'left' });
        if (!por) { copper(ctx, W, Lo.cnt[1] - 150 * s, 24 * s, t, 0.85); copper(ctx, W, Lo.cnt[1] + 30 * s, 24 * s, t, 0.85); }
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        style.counter(ctx, v, Lo.cnt[0], Lo.cnt[1], 1, { size: Lo.csize });
        style.label(ctx, 'VIEWS', Lo.views[0], Lo.views[1] + 30 * s, K.beat(t, 8.7, 0.3, 'lin'), { size: 40, color: CYAN, align: 'center' });
        style.emphasis(ctx, Lo.cnt[0], Lo.cnt[1] - Lo.csize * 0.35 * s, por ? W * 0.44 : 545 * s, K.beat(t, 10.0, 0.6, 'lin'), { h: Lo.csize * 1.25 });
        // the takeaway as a rainbow sine scroller that glides in and holds
        if (t > 10.3) {
          const lines = por ? ['POST ONCE.', 'REACH EVERYWHERE.'] : ['*** POST ONCE. REACH EVERYWHERE. ***'], size = Lo.ssize * s, k = K.beat(t, 10.3, 0.7);
          ctx.save(); ctx.font = `600 ${size}px "${FONT}"`; ctx.textAlign = 'left';
          lines.forEach((line, li) => {
            const w = line.length * size * 0.6, x0 = W / 2 - w / 2 + (1 - k) * W;
            for (let i = 0; i < line.length; i++) { const x = x0 + i * size * 0.6, y = Lo.scroll + li * size * 1.5 + Math.sin(i * 0.45 - t * 4) * 10 * s; ctx.fillStyle = HUES[4 + ((i + Math.floor(t * 8)) % 6)]; ctx.fillText(line[i], x, y); }
          });
          ctx.restore();
        }
      }
      // nfo strip
      if (t < 8.25 || por) style.label(ctx, `frame ${String(Math.floor(t * 30)).padStart(4, '0')}  .  ramp " .,:;-=+*!#$@"  .  torus 3d`, Lo.nfo[0], Lo.nfo[1] + 60 * s * (por ? 0 : 1) - (por ? 0 : 20 * s), 1, { size: 28, color: DIMT });
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('tape', 0, 12, 0.6);
      k.play('swell', 0, { dur: 2.2, chord: ['D3', 'A3', 'F4'] });
      for (let i = 0; i < 4; i++) k.play('blip', 0.15 + i * 0.3, { note: ['D5', 'F5', 'A5', 'D6'][i], dur: 0.06 });
      k.play('type', 2.0, { dur: 0.4 }); k.play('type', 2.6, { dur: 0.5 }); k.play('blip', 3.8, { note: 'A5' });
      k.play('type', 3.3, { dur: 0.5, gain: 0.7 }); k.play('riser', 3.8, { dur: 0.8, gain: 0.5 }); k.play('blip', 4.6, { note: 'D6' });
      for (let i = 0; i < 7; i++) { k.play('type', 5.15 + i * 0.4, { dur: 0.18, gain: 0.7 }); k.play('blip', 5.35 + i * 0.4, { note: ['D6', 'E6', 'F6', 'G6', 'A6', 'C7', 'D7'][i], dur: 0.04 }); }
      k.play('riser', 7.6, { dur: 0.65 }); k.play('glitch', 8.25); k.play('whoosh', 8.3, { dur: 0.5, up: false });
      k.play('count', 8.6, { dur: 1.4 }); k.play('glitch', 10.0); k.play('stamp', 10.0, { gain: 0.7 });
      k.play('whoosh', 10.3, { dur: 0.6 }); k.play('chime', 11.1, { note: 'D6' });
    },
  };
  MS.register(style);
})();
