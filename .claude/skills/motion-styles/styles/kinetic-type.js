// Kinetic Type (Generative & Type). A typographic music-video frame in strictly two colours (black + acid yellow):
// condensed words stretched into boxes and cropped edge to edge with zero leading, filled versus outlined, strobe
// echoes, slice glitches, a halftone dreamscape filling one word, inverted mono tags and heavy chevron rules.
// Words land on a 120 bpm grid (0.5 s beats).
(function () {
  const C = { bg: '#0b0b0b', ink: '#e8ff2a' };
  const HEAD = 'Anton', MONO = 'Space Mono';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;

  // halftone dreamscape tile: a moon and horizon rendered as a dot screen (yellow dots on transparent)
  function halftone(W, H, s) {
    return K.cached(`kt-ht:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), g = 9 * s, mx = W * 0.62, my = H * 0.45, mr = Math.min(W, H) * 0.28;
      x.fillStyle = C.ink;
      for (let yy = 0, row = 0; yy < H + g; yy += g, row++) for (let xx = row % 2 ? g / 2 : 0; xx < W + g; xx += g) {
        const dm = Math.hypot(xx - mx, yy - my), moon = dm < mr ? 1 - Math.hypot(xx - mx - mr * 0.35, yy - my + mr * 0.2) / (mr * 1.3) : 0;
        const sky = 0.25 + 0.5 * (yy / H), hz = yy > H * 0.75 ? 0.9 : 0;
        const v = K.clamp(Math.max(moon > 0 ? 0.15 + moon * 0.2 : sky, hz));
        const r = g * 0.55 * Math.sqrt(v); if (r > 0.4) { x.beginPath(); x.arc(xx, yy, r, 0, TAU); x.fill(); }
      }
      return c;
    });
  }
  // a word stretched to exactly fill box (x, y, w, h); mode fill | outline | halftone
  function block(ctx, text, x, y, w, h, o = {}) {
    const p = o.p ?? 1; if (p <= 0) return;
    const s = S(ctx.canvas.width, ctx.canvas.height), W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.save(); ctx.font = K.font(200, HEAD, 400);
    const m = ctx.measureText(text), tw = m.actualBoundingBoxLeft + m.actualBoundingBoxRight, th = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
    const sx = w / tw, sy = h / th;
    const enter = o.enter || 'punch', e = K.ease.out(K.clamp(p));
    let dx = 0, dy = 0, k = 1;
    if (enter === 'whip') dx = (1 - e) * W * 1.1 * (o.dir || 1);
    else if (enter === 'up') dy = (1 - e) * h * 1.05;
    else k = 1 + (1 - e) * 0.35;
    ctx.beginPath(); ctx.rect(x - 2, y - 2, w + 4, h + 4); if (enter === 'up' || o.clip) ctx.clip();
    const glyphs = (ox, oy, mode, alpha = 1) => {
      ctx.save(); ctx.translate(x + w / 2 + ox, y + h / 2 + oy); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2); ctx.scale(sx, sy); ctx.globalAlpha = alpha;
      if (mode === 'outline') { ctx.lineWidth = (o.lw || 3) * s / Math.min(sx, sy); ctx.strokeStyle = o.color || C.ink; ctx.lineJoin = 'miter'; ctx.strokeText(text, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent); }
      else { ctx.fillStyle = o.color || C.ink; ctx.fillText(text, m.actualBoundingBoxLeft, m.actualBoundingBoxAscent); }
      ctx.restore();
    };
    // strobe echoes trail a whip (outline copies), or pulse on the beat when o.echo
    const echoes = o.echo || (enter === 'whip' && p < 1 ? 4 : 0);
    for (let i = echoes; i >= 1; i--) glyphs(dx + i * (o.echoDx ?? 0.06) * w * (o.dir || 1) * (enter === 'whip' ? 1 : 0.4), dy + i * (o.echoDy || 0), 'outline', 0.75 - i * 0.12);
    if (o.mode === 'halftone') {
      const L = K.cached(`kt-word:${W}x${H}`, () => K.layer(W, H)), lx = L.getContext('2d');
      lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, W, H); lx.save();
      const ctx0 = ctx; ctx = lx; lx.font = ctx0.font; glyphs(dx, dy, 'fill'); ctx = ctx0; lx.restore();
      lx.globalCompositeOperation = 'source-in'; lx.drawImage(halftone(W, H, s), (o.htShift || 0), 0); lx.globalCompositeOperation = 'source-over';
      ctx.drawImage(L, 0, 0); glyphs(dx, dy, 'outline');
    } else if (o.slice) {
      // slice glitch: three horizontal bands knocked sideways
      const bands = [[0, 0.38, o.slice], [0.38, 0.62, -o.slice * 0.6], [0.62, 1, o.slice * 0.3]];
      for (const [a, b, off] of bands) { ctx.save(); ctx.beginPath(); ctx.rect(x - W, y + h * a, w + W * 2, h * (b - a)); ctx.clip(); glyphs(dx + off * w, dy, o.mode || 'fill'); ctx.restore(); }
    } else glyphs(dx, dy, o.mode || 'fill');
    ctx.restore();
  }
  function invert(ctx, x, y, w, h) { ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = C.ink; ctx.fillRect(x, y, w, h); ctx.restore(); }

  const style = {
    id: 'kinetic-type', name: 'Kinetic Type', family: 'Generative & Type',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Anton&family=Space+Mono:wght@700&display=block', specs: ['400 200px "Anton"', '700 28px "Space Mono"'] }],
    palette: C,
    sfx: { draw: null, land: 'thud', emphasis: 'stamp', transition: 'glitch', bed: 'tape' },
    block, invert,

    background(ctx, W, H, t) {
      const s = S(W, H); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      // HUD furniture: timecode, verse tag, registration crosshairs
      ctx.save(); ctx.fillStyle = K.rgba(C.ink, 0.55); ctx.font = K.font(14 * s, MONO, 700);
      const tc = `00:${String(Math.floor(t)).padStart(2, '0')}:${String(Math.floor((t % 1) * 24)).padStart(2, '0')}`;
      ctx.fillText(tc, 14 * s, H - 14 * s); ctx.textAlign = 'right'; ctx.fillText('[CREATOR OS / 120 BPM]', W - 14 * s, H - 14 * s);
      ctx.strokeStyle = K.rgba(C.ink, 0.4); ctx.lineWidth = 1 * s;
      for (const [cx, cy] of [[22 * s, 22 * s], [W - 22 * s, 22 * s]]) { ctx.beginPath(); ctx.arc(cx, cy, 6 * s, 0, TAU); ctx.moveTo(cx - 11 * s, cy); ctx.lineTo(cx + 11 * s, cy); ctx.moveTo(cx, cy - 11 * s); ctx.lineTo(cx, cy + 11 * s); ctx.stroke(); }
      ctx.restore();
    },
    finish(ctx, W, H, t) {
      // print-like grain and a faint ink bloom on the yellow, nothing else: the two colours are the look
      K.grain(ctx, W, H, t, 0.07, 24, 'overlay');
      K.vignette(ctx, W, H, 0.25, '#000');
    },

    // a headline = one or more stretched word-blocks; o.box = [x, y, w, h]
    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), h = (o.size || 90) * s;
      ctx.save(); ctx.font = K.font(200, HEAD, 400); const m = ctx.measureText(text); ctx.restore();
      const w = o.w || (m.width / 200) * h * 1.25;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      block(ctx, text, x0, y - h, w, h, { p, ...o });
      return { w, h };
    },
    // inverted mono tag that drops onto its target
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 28) * s, e = K.ease.out(K.clamp(p));
      ctx.save(); ctx.font = K.font(size, MONO, 700); const tw = ctx.measureText(text).width, w = tw + size * 0.8, h = size * 1.5;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, yy = y - h / 2 - (1 - e) * 40 * s;
      ctx.fillStyle = o.inverse ? C.bg : C.ink; ctx.fillRect(x0, yy, w, h);
      if (o.inverse) { ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * s; ctx.strokeRect(x0, yy, w, h); }
      ctx.fillStyle = o.inverse ? C.ink : C.bg; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + size * 0.4, yy + h / 2 + 1 * s);
      ctx.restore(); return { w, h };
    },
    // heavy rule with marching chevrons
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.ease.out(K.clamp(p)), dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy), ang = Math.atan2(dy, dx), th = (o.width || 10) * s;
      ctx.save(); ctx.translate(from[0], from[1]); ctx.rotate(ang); ctx.fillStyle = o.color || C.ink;
      const len = L * e; ctx.fillRect(0, -th / 2, Math.max(0, len - th * 2), th);
      const cs = th * 1.6, gap = cs * 1.4, off = ((o.t || 0) * 120 * s) % gap;
      ctx.save(); ctx.beginPath(); ctx.rect(0, -th * 3, Math.max(0, len - th * 2.2), th * 6); ctx.clip();
      ctx.strokeStyle = C.bg; ctx.lineWidth = th * 0.35;
      for (let xx = off - gap; xx < len; xx += gap) { ctx.beginPath(); ctx.moveTo(xx - cs * 0.4, -th * 0.5); ctx.lineTo(xx, 0); ctx.lineTo(xx - cs * 0.4, th * 0.5); ctx.stroke(); }
      ctx.restore();
      if (e > 0.6) { ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(len - th * 2.6, -th * 1.6); ctx.lineTo(len - th * 2.6, th * 1.6); ctx.closePath(); ctx.fill(); }
      ctx.restore(); return [from[0] + Math.cos(ang) * len, from[1] + Math.sin(ang) * len];
    },
    // heavy rule frame with crop marks
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.ease.out(K.clamp(p)), th = (o.width || 8) * s;
      ctx.save(); ctx.fillStyle = C.ink;
      ctx.fillRect(x, y, w * e, th); ctx.fillRect(x + w - w * e, y + h - th, w * e, th); ctx.fillRect(x, y + h - h * e, th, h * e); ctx.fillRect(x + w - th, y, th, h * e);
      ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5 * s; const cm = 16 * s;
      for (const [cx, cy, sx, sy] of [[x, y, -1, -1], [x + w, y, 1, -1], [x, y + h, -1, 1], [x + w, y + h, 1, 1]]) { ctx.beginPath(); ctx.moveTo(cx + sx * 6 * s, cy); ctx.lineTo(cx + sx * (6 * s + cm), cy); ctx.moveTo(cx, cy + sy * 6 * s); ctx.lineTo(cx, cy + sy * (6 * s + cm)); ctx.stroke(); }
      ctx.restore();
    },
    // huge numerals stretched into their box (o.box) or sized by o.size
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), txt = K.fmt(value);
      if (o.box) { const [bx, by, bw, bh] = o.box; block(ctx, txt, bx, by, bw, bh, { mode: o.mode || 'fill', echo: o.echo || 0, echoDy: o.echoDy || 0, echoDx: 0 }); return; }
      return style.title(ctx, txt, x, y, 1, { size: o.size || 160, align: 'center' });
    },
    // strobe: one-frame inverted flash over the region plus outline echoes stepping out
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), w = o.w || r * 2, h = o.h || r;
      const flashOn = (Math.floor(p * 10) % 3) === 0;
      if (flashOn) invert(ctx, x - w / 2, y - h / 2, w, h);
      ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4 * s;
      for (let i = 1; i <= 3; i++) { const k = K.ease.out(K.clamp(p * 1.4 - i * 0.12)); if (k <= 0) continue; ctx.globalAlpha = 1 - k; ctx.strokeRect(x - w / 2 - k * i * 30 * s, y - h / 2 - k * i * 18 * s, w + k * i * 60 * s, h + k * i * 36 * s); }
      ctx.restore();
    },
    // slice-glitch tear + whip pan: the frame is cut into strips that tear sideways, a yellow slab covers at 0.5
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), copy = K.cached(`kt-copy:${W}x${H}`, () => K.layer(W, H)), cx = copy.getContext('2d');
      cx.clearRect(0, 0, W, H); cx.drawImage(ctx.canvas, 0, 0);
      const e = Math.sin(Math.PI * p), n = 14, r = K.rng(Math.floor(p * 30) + 9);
      ctx.save(); ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H);
      for (let i = 0; i < n; i++) { const y0 = (i / n) * H, hh = H / n + 1, off = (r() - 0.5) * W * 0.6 * e + (p < 0.5 ? -1 : 1) * W * e * e * (i % 2 ? 0.8 : 1.2); ctx.drawImage(copy, 0, y0, W, hh, off, y0, W, hh); }
      const slab = K.clamp(1 - Math.abs(p - 0.5) * 5); if (slab > 0) { ctx.fillStyle = C.ink; ctx.fillRect(0, 0, W, H * slab); ctx.fillRect(0, H * (1 - slab), W, H * slab); }
      ctx.restore();
    },
  };

  // ---------- demo: one word per beat ----------
  const PLATFORMS = ['INSTAGRAM', 'TIKTOK', 'YOUTUBE', 'X', 'LINKEDIN', 'THREADS', 'FACEBOOK'];
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const L = K.layout(W, H), s = L.s, P = L.portrait, m = 18 * s, beat = (b) => K.clamp((t - b) / 0.18);
      style.background(ctx, W, H, t);
      const Wi = W - m * 2;
      if (t < 2.0) {
        // hook: four words, zero leading, edge to edge
        if (!P) {
          const h1 = (H - m * 2) * 0.5;
          block(ctx, 'ONE', m, m, Wi * 0.36, h1, { p: beat(0.15) });
          block(ctx, 'VIDEO.', m + Wi * 0.38, m, Wi * 0.62, h1, { p: beat(0.65), enter: 'whip', mode: 'outline', lw: 4 });
          block(ctx, 'EVERY', m, m + h1 + 6 * s, Wi * 0.4, h1 - 6 * s, { p: beat(1.15), enter: 'up' });
          block(ctx, 'PLATFORM.', m + Wi * 0.42, m + h1 + 6 * s, Wi * 0.58, h1 - 6 * s, { p: beat(1.4), enter: 'whip', slice: t > 1.75 ? 0.04 : 0 });
        } else {
          const hh = (H - m * 2) / 4 - 8 * s;
          block(ctx, 'ONE', m, m, Wi, hh, { p: beat(0.15) });
          block(ctx, 'VIDEO.', m, m + (hh + 8 * s), Wi, hh, { p: beat(0.65), enter: 'whip', mode: 'outline', lw: 4 });
          block(ctx, 'EVERY', m, m + (hh + 8 * s) * 2, Wi, hh, { p: beat(1.15), enter: 'up' });
          block(ctx, 'PLATFORM.', m, m + (hh + 8 * s) * 3, Wi, hh, { p: beat(1.4), enter: 'whip', slice: t > 1.75 ? 0.04 : 0 });
        }
        if (t > 1.15 && t < 1.2) invert(ctx, 0, 0, W, H);
      } else if (t < 8.3) {
        // the video frame, a heavy rule, then CREATOR OS slams up with a one-frame inverted flash
        const shrink = K.beat(t, 4.9, 0.4, 'inOut');
        if (!P) {
          const vx = m + 30 * s, vy = H * 0.36, vw = 260 * s, vh = 170 * s;
          if (shrink < 0.05) {
            style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.3));
            if (t > 2.25) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(vx + vw * 0.4, vy + vh * 0.3); ctx.lineTo(vx + vw * 0.64, vy + vh * 0.5); ctx.lineTo(vx + vw * 0.4, vy + vh * 0.7); ctx.fill(); }
            style.label(ctx, 'YOUR VIDEO', vx, vy - 30 * s, K.beat(t, 2.5, 0.25), {});
          }
          // node block: full right side, then shrinks to the left column for the fan out
          const nx = K.lerp(m + 340 * s, m, shrink), nw = K.lerp(Wi - 340 * s, Wi * 0.34, shrink), ny = K.lerp(H * 0.25, m, shrink), nh = K.lerp(H * 0.5, H - m * 2, shrink);
          if (shrink < 1) style.arrow(ctx, [vx + vw + 14 * s, vy + vh / 2], [m + 330 * s, vy + vh / 2], K.beat(t, 3.3, 0.5) * (1 - shrink), { t });
          if (shrink > 0.99) { block(ctx, 'CREATOR', nx, ny, nw, nh * 0.5 - 4 * s, { mode: 'halftone' }); block(ctx, 'OS', nx, ny + nh * 0.5 + 4 * s, nw, nh * 0.5 - 4 * s, {}); }
          else { block(ctx, 'CREATOR', nx, ny, nw, nh * 0.6, { p: beat(4.0), enter: 'up', mode: 'halftone' }); block(ctx, 'OS', nx + nw * 0.7, ny + nh * 0.62, nw * 0.3, nh * 0.38, { p: beat(4.5) }); }
          if (t > 4.0 && t < 4.06) invert(ctx, 0, 0, W, H);
          // fan out: seven rows stacked edge to edge on the right, one per 0.4 s
          const rx = m + Wi * 0.4, rw = Wi * 0.6, rh = (H - m * 2) / 7;
          if (t > 4.95) style.arrow(ctx, [m + Wi * 0.345, H / 2], [rx - 8 * s, H / 2], K.beat(t, 4.95, 0.3), { t, width: 12 });
          PLATFORMS.forEach((name, i) => {
            const t0 = 5.25 + i * 0.4, w = name === 'X' ? rh * 0.9 : rw;
            block(ctx, name, rx + (name === 'X' ? 0 : 0), m + i * rh + 3 * s, w, rh - 6 * s, { p: beat(t0), enter: 'whip', mode: i % 2 ? 'outline' : 'fill', lw: 3 });
            if (t > t0 && t < t0 + 0.05) invert(ctx, rx, m + i * rh, rw, rh);
          });
          if (t > 7.0) style.label(ctx, 'POSTED x7', rx + rh * 1.2, m + rh * 3.5, K.beat(t, 7.0, 0.2), { inverse: true });
        } else {
          const vx = W * 0.2, vy = H * 0.1, vw = W * 0.6, vh = H * 0.14;
          const vis = 1 - shrink;
          if (vis > 0) { ctx.save(); ctx.globalAlpha = vis; style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.3)); if (t > 2.25) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(vx + vw * 0.42, vy + vh * 0.3); ctx.lineTo(vx + vw * 0.6, vy + vh * 0.5); ctx.lineTo(vx + vw * 0.42, vy + vh * 0.7); ctx.fill(); }
            style.label(ctx, 'YOUR VIDEO', vx, vy - 30 * s, K.beat(t, 2.5, 0.25), {}); style.arrow(ctx, [W / 2, vy + vh + 14 * s], [W / 2, H * 0.36], K.beat(t, 3.3, 0.5), { t }); ctx.restore(); }
          const ny = K.lerp(H * 0.38, m, shrink), nh = K.lerp(H * 0.3, H * 0.16, shrink);
          block(ctx, 'CREATOR', m, ny, Wi, nh * 0.6, { p: beat(4.0), enter: 'up', mode: 'halftone' });
          block(ctx, 'OS', m, ny + nh * 0.63, Wi, nh * 0.37, { p: beat(4.5) });
          if (t > 4.0 && t < 4.06) invert(ctx, 0, 0, W, H);
          const top = m + H * 0.16 + 70 * s, rh = (H - top - m) / 7;
          if (t > 4.95) style.arrow(ctx, [m + 30 * s, m + H * 0.16 + 10 * s], [m + 30 * s, H - m], K.beat(t, 4.95, 0.5), { t, width: 12 });
          PLATFORMS.forEach((name, i) => {
            const t0 = 5.25 + i * 0.4, x0 = m + 80 * s, w = name === 'X' ? rh * 0.8 : Wi - 80 * s;
            block(ctx, name, x0, top + i * rh + 4 * s, w, rh - 8 * s, { p: beat(t0), enter: 'whip', mode: i % 2 ? 'outline' : 'fill', lw: 3 });
            if (t > t0 && t < t0 + 0.05) invert(ctx, x0, top + i * rh, Wi, rh);
          });
        }
      } else {
        // the count: huge numerals stretched full width, strobe on the settle
        const v = Math.round(K.count(t, 8.6, 1.5, 0, 1000000) / 1000) * 1000;
        if (!P) {
          block(ctx, 'CREATOR OS', m, m, Wi * 0.45, H * 0.13, { mode: 'outline', lw: 2 });
          style.label(ctx, 'VIEWS', m + Wi * 0.47, m + H * 0.065, K.beat(t, 8.5, 0.2), {});
          const box = [m, H * 0.2, Wi, H * 0.42];
          style.counter(ctx, v, 0, 0, 1, { box, echo: t > 10.0 && t < 10.6 ? 3 : 0, echoDy: -12 * s });
          style.emphasis(ctx, W / 2, box[1] + box[3] / 2, 0, K.clamp((t - 10.0) / 0.5), { w: Wi, h: box[3] });
          block(ctx, 'POST ONCE.', m, H * 0.66, Wi * 0.44, H * 0.31, { p: beat(10.5), enter: 'up' });
          block(ctx, 'REACH EVERYWHERE.', m + Wi * 0.46, H * 0.66, Wi * 0.54, H * 0.31, { p: beat(11.0), enter: 'whip', mode: 'halftone', htShift: -W * 0.2 });
        } else {
          block(ctx, 'CREATOR OS', m, m, Wi, H * 0.08, { mode: 'outline', lw: 2 });
          style.label(ctx, 'VIEWS', m, H * 0.13, K.beat(t, 8.5, 0.2), {});
          const box = [m, H * 0.17, Wi, H * 0.2];
          style.counter(ctx, v, 0, 0, 1, { box, echo: t > 10.0 && t < 10.6 ? 3 : 0, echoDy: -12 * s });
          style.emphasis(ctx, W / 2, box[1] + box[3] / 2, 0, K.clamp((t - 10.0) / 0.5), { w: Wi, h: box[3] });
          block(ctx, 'POST', m, H * 0.42, Wi, H * 0.12, { p: beat(10.5), enter: 'up' });
          block(ctx, 'ONCE.', m, H * 0.55, Wi, H * 0.12, { p: beat(10.75), enter: 'whip', mode: 'outline', lw: 4 });
          block(ctx, 'REACH', m, H * 0.68, Wi, H * 0.12, { p: beat(11.0), enter: 'up' });
          block(ctx, 'EVERYWHERE.', m, H * 0.81, Wi, H * 0.15, { p: beat(11.25), enter: 'whip', mode: 'halftone' });
        }
      }
      if (t > 7.9 && t < 8.7) style.transition(ctx, W, H, K.clamp((t - 7.9) / 0.8));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('tape', 0, 12, 1);
      for (let b = 0; b < 24; b++) k.play('tick', b * 0.5, { gain: b % 2 ? 0.4 : 0.7 });            // the 120 bpm grid
      k.play('thud', 0.15); k.play('whoosh', 0.55, { dur: 0.2 }); k.play('thud', 0.65); k.play('stamp', 1.15); k.play('whoosh', 1.3, { dur: 0.2 }); k.play('thud', 1.4); k.play('glitch', 1.75);
      k.play('stamp', 2.0, { gain: 0.6 }); k.play('click', 2.25); k.play('thud', 2.5, { gain: 0.5 }); k.play('whoosh', 3.3, { dur: 0.5 });
      k.play('stamp', 4.0); k.play('thud', 4.5); k.play('whoosh', 4.9, { dur: 0.4 });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.15 + i * 0.4, { dur: 0.15, gain: 0.6 }); k.play('thud', 5.25 + i * 0.4, { gain: 0.8 }); }
      k.play('glitch', 7.9); k.play('whoosh', 8.0, { dur: 0.5 }); k.play('glitch', 8.4);
      k.play('count', 8.6, { dur: 1.5 }); k.play('stamp', 10.0); k.play('glitch', 10.1);
      k.play('thud', 10.5); k.play('whoosh', 10.9, { dur: 0.2 }); k.play('thud', 11.0); k.play('chime', 11.3, { note: 'E6' });
    },
  };
  MS.register(style);
})();
