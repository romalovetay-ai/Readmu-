// Phosphor Terminal (Retro Digital). A green P1-phosphor CRT: VT323 text typed at terminal speed, phosphor-line
// drawings, an inverse-video status line, then the tube itself: bloom + halation, scanlines, a rolling hum bar, barrel
// distortion (strip-resampled, so the raster bows like curved glass), colour fringing toward the edges, tube vignette,
// a glass reflection and the plastic bezel. The scene change is a V-hold roll.
(function () {
  const PH = '#5cff7a', DIM = '#2c9a48', HOT = '#d6ffde', BG = '#03140a', FONT = 'VT323';
  const S = (ctx) => K.layout(ctx.canvas.width, ctx.canvas.height).s;

  function geom(W, H) {
    const L = K.layout(W, H);
    if (!L.portrait) return { ...L, scr: [W * 0.05, H * 0.05, W * 0.9, H * 0.84] };
    return { ...L, scr: [W * 0.05, H * 0.035, W * 0.9, H * 0.86] };
  }
  const rr = (x, X, Y, w, h, r) => { x.beginPath(); x.roundRect(X, Y, w, h, r); };

  function bezel(W, H) {
    return K.cached(`crt-bez:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), g = geom(W, H), [sx, sy, sw, sh] = g.scr, s = g.s;
      const bg = x.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#5d5a52'); bg.addColorStop(1, '#3b3934');
      x.fillStyle = bg; x.fillRect(0, 0, W, H);
      const r = K.rng(8); x.fillStyle = 'rgba(255,255,255,0.025)'; for (let i = 0; i < 4000; i++) x.fillRect(r() * W, r() * H, 1.5, 1.5);
      // moulded lip around the tube
      const lip = 16 * s; const lg = x.createLinearGradient(sx, sy - lip, sx, sy + sh + lip); lg.addColorStop(0, '#24231f'); lg.addColorStop(1, '#4a4842');
      x.fillStyle = lg; rr(x, sx - lip, sy - lip, sw + lip * 2, sh + lip * 2, 40 * s); x.fill();
      x.globalCompositeOperation = 'destination-out'; rr(x, sx, sy, sw, sh, 34 * s); x.fill(); x.globalCompositeOperation = 'source-over';
      // badge + knobs on the chin
      const cy = sy + sh + (H - (sy + sh)) / 2 + 4 * s;
      x.fillStyle = '#c9c4b5'; x.font = `700 ${Math.max(11, 13 * s)}px "Space Mono"`; x.fillText('CX-80  CREATOR TERMINAL', sx + 10 * s, cy);
      x.fillStyle = '#8f8a7d'; x.font = `400 ${Math.max(9, 10 * s)}px "Space Mono"`; x.fillText('HIGH RESOLUTION  P1 PHOSPHOR', sx + 300 * s, cy);
      for (const kx of [sx + sw - 170 * s, sx + sw - 120 * s]) { const kg = x.createRadialGradient(kx - 3 * s, cy - 8 * s, 1, kx, cy - 5 * s, 11 * s); kg.addColorStop(0, '#8a877f'); kg.addColorStop(1, '#1b1a18'); x.fillStyle = kg; x.beginPath(); x.arc(kx, cy - 5 * s, 10 * s, 0, 6.283); x.fill(); }
      x.fillStyle = '#8f8a7d'; x.font = `400 ${Math.max(9, 10 * s)}px "Space Mono"`; x.fillText('POWER', sx + sw - 70 * s, cy);
      return c;
    });
  }
  function scanTex(W, H) {
    return K.cached(`crt-scan:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), st = Math.max(3, Math.round(3 * geom(W, H).s));
      x.fillStyle = 'rgba(0,0,0,0.42)'; for (let y = 0; y < H; y += st) x.fillRect(0, y + st - 1, W, 1);
      x.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < H; y += st) x.fillRect(0, y + st - 2, W, 1);
      return c;
    });
  }
  const tmp = (W, H, n) => K.cached(`crt-t${n}:${W}x${H}`, () => K.layer(W, H));

  // strip-resampled barrel: rows narrow toward top/bottom, columns shorten toward left/right
  function barrel(ctx, W, H, k) {
    const [sx, sy, sw, sh] = geom(W, H).scr, A = tmp(W, H, 1), B = tmp(W, H, 2), a = A.getContext('2d'), b = B.getContext('2d');
    a.clearRect(0, 0, W, H); a.drawImage(ctx.canvas, sx, sy, sw, sh, sx, sy, sw, sh);
    b.clearRect(0, 0, W, H); const N = 72, cx = sx + sw / 2, cy = sy + sh / 2;
    for (let i = 0; i < N; i++) { const y0 = sy + (sh * i) / N, hh = sh / N + 1, d = (y0 + hh / 2 - cy) / (sh / 2), f = 1 - k * d * d, w2 = sw * f; b.drawImage(A, sx, y0, sw, hh, cx - w2 / 2, y0, w2, hh); }
    ctx.save(); ctx.fillStyle = '#000'; ctx.fillRect(sx, sy, sw, sh);
    for (let i = 0; i < N; i++) { const x0 = sx + (sw * i) / N, ww = sw / N + 1, d = (x0 + ww / 2 - cx) / (sw / 2), f = 1 - k * 0.8 * d * d, h2 = sh * f; ctx.drawImage(B, x0, sy, ww, sh, x0, cy - h2 / 2, ww, h2); }
    ctx.restore();
  }
  function bloom(ctx, W, H, amt) {
    const d = 4, w = Math.ceil(W / d), h = Math.ceil(H / d), a = K.cached(`crt-ba:${W}x${H}`, () => K.layer(w, h)), b = K.cached(`crt-bb:${W}x${H}`, () => K.layer(w, h));
    const ax = a.getContext('2d'), bx = b.getContext('2d'); ax.clearRect(0, 0, w, h); ax.drawImage(ctx.canvas, 0, 0, w, h);
    bx.clearRect(0, 0, w, h); bx.filter = 'blur(3px)'; bx.drawImage(a, 0, 0); bx.filter = 'none';
    const [sx, sy, sw, sh] = geom(W, H).scr;
    ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amt; ctx.drawImage(b, 0, 0, W, H);
    bx.clearRect(0, 0, w, h); bx.filter = 'blur(10px)'; bx.drawImage(a, 0, 0); bx.filter = 'none'; ctx.globalAlpha = amt * 0.6; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
  }

  function txt(ctx, s, x, y, size, o = {}) {
    ctx.save(); ctx.font = `${size}px "${FONT}"`; ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    if (o.inverse) { const w = ctx.measureText(s).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; ctx.fillStyle = o.color || PH; ctx.fillRect(x0 - size * 0.15, y - size * 0.78, w + size * 0.3, size * 0.95); ctx.fillStyle = BG; ctx.fillText(s, x, y); }
    else { ctx.fillStyle = o.color || PH; ctx.fillText(s, x, y); }
    const w = ctx.measureText(s).width; ctx.restore(); return w;
  }

  let flashUntil = 0;
  const style = {
    id: 'crt-terminal', name: 'Phosphor Terminal', family: 'Retro Digital',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=VT323&family=Space+Mono:wght@400;700&display=block', specs: ['40px "VT323"', '700 13px "Space Mono"', '400 10px "Space Mono"'] }],
    palette: { bg: BG, phosphor: PH, dim: DIM, hot: HOT, bezel: '#4a4842' },
    sfx: { draw: null, land: 'click', emphasis: 'stamp', transition: 'whoosh', bed: 'hum' },
    screen: (W, H) => geom(W, H).scr,

    background(ctx, W, H, t) {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const [sx, sy, sw, sh] = geom(W, H).scr, g = ctx.createRadialGradient(sx + sw / 2, sy + sh / 2, 0, sx + sw / 2, sy + sh / 2, Math.hypot(sw, sh) / 2);
      g.addColorStop(0, '#04190c'); g.addColorStop(1, '#010703'); ctx.fillStyle = g; ctx.fillRect(sx, sy, sw, sh);
    },
    finish(ctx, W, H, t) {
      const g = geom(W, H), [sx, sy, sw, sh] = g.scr;
      bloom(ctx, W, H, 0.95);
      ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
      ctx.drawImage(scanTex(W, H), 0, 0);
      // hum bar rolling up the raster
      const hy = sy + sh - (((t * 0.22) % 1) * (sh * 1.4)), hb = ctx.createLinearGradient(0, hy - sh * 0.12, 0, hy + sh * 0.12);
      hb.addColorStop(0, 'rgba(120,255,150,0)'); hb.addColorStop(0.5, 'rgba(120,255,150,0.06)'); hb.addColorStop(1, 'rgba(120,255,150,0)');
      ctx.fillStyle = hb; ctx.fillRect(sx, hy - sh * 0.12, sw, sh * 0.24);
      // phosphor flicker
      ctx.fillStyle = `rgba(0,0,0,${0.04 + 0.04 * K.noise(5).n2(t * 50, 1)})`; ctx.fillRect(sx, sy, sw, sh);
      ctx.restore();
      barrel(ctx, W, H, 0.07);
      // colour fringing: a slightly larger magenta ghost and a smaller cyan one, strongest at the edges
      const A = tmp(W, H, 3), a = A.getContext('2d');
      a.clearRect(0, 0, W, H); a.drawImage(ctx.canvas, sx, sy, sw, sh, sx, sy, sw, sh); a.globalCompositeOperation = 'multiply'; a.fillStyle = '#ff2a70'; a.fillRect(sx, sy, sw, sh); a.globalCompositeOperation = 'destination-in'; a.drawImage(ctx.canvas, sx, sy, sw, sh, sx, sy, sw, sh); a.globalCompositeOperation = 'source-over';
      ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.28;
      const e = 0.006; ctx.drawImage(A, sx, sy, sw, sh, sx - sw * e, sy - sh * e, sw * (1 + 2 * e), sh * (1 + 2 * e)); ctx.restore();
      // tube shading, glass reflection, bezel
      ctx.save(); ctx.beginPath(); ctx.roundRect(sx, sy, sw, sh, 34 * g.s); ctx.clip();
      const v = ctx.createRadialGradient(sx + sw / 2, sy + sh / 2, Math.min(sw, sh) * 0.3, sx + sw / 2, sy + sh / 2, Math.hypot(sw, sh) * 0.55);
      v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.75)'); ctx.fillStyle = v; ctx.fillRect(sx, sy, sw, sh);
      const gl = ctx.createLinearGradient(sx, sy, sx + sw * 0.6, sy + sh * 0.7); gl.addColorStop(0, 'rgba(255,255,255,0.08)'); gl.addColorStop(0.4, 'rgba(255,255,255,0.02)'); gl.addColorStop(0.41, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl; ctx.fillRect(sx, sy, sw, sh);
      ctx.restore();
      ctx.drawImage(bezel(W, H), 0, 0);
      K.grain(ctx, W, H, t, 0.035, 30, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx), n = Math.floor(text.length * K.clamp(p)), size = (o.size || 84) * s;
      ctx.save(); ctx.font = `${size}px "${FONT}"`; const full = ctx.measureText(text).width; ctx.restore();
      if (o.align === 'center') x -= full / 2; else if (o.align === 'right') x -= full; // typed text keeps its final position
      const w = txt(ctx, text.slice(0, n), x, y, size, { color: o.color, inverse: o.inverse });
      if (o.cursor && n < text.length + 1) { const on = Math.floor((o.t ?? 0) * 3.5) % 2 === 0 || p < 1; if (on) { ctx.fillStyle = o.color || PH; ctx.fillRect(x + w + size * 0.05, y - size * 0.7, size * 0.45, size * 0.8); } }
      return { w: full, h: size };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 44, ...o }); },
    // phosphor line drawing: hard core + soft halo, with an open arrowhead
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null; const s = S(ctx), e = [K.lerp(from[0], to[0], K.clamp(p)), K.lerp(from[1], to[1], K.clamp(p))];
      ctx.save(); ctx.lineCap = 'square'; ctx.strokeStyle = o.color || PH; ctx.lineWidth = 3 * s;
      ctx.beginPath(); ctx.moveTo(from[0], from[1]); ctx.lineTo(e[0], e[1]); ctx.stroke();
      if (p >= 1) { const ang = Math.atan2(to[1] - from[1], to[0] - from[0]), L = 16 * s; ctx.beginPath(); ctx.moveTo(to[0] - Math.cos(ang - 0.5) * L, to[1] - Math.sin(ang - 0.5) * L); ctx.lineTo(to[0], to[1]); ctx.lineTo(to[0] - Math.cos(ang + 0.5) * L, to[1] - Math.sin(ang + 0.5) * L); ctx.stroke(); }
      ctx.restore(); return e;
    },
    // a double-ruled box, traced on clockwise
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return; const s = S(ctx), pts = K.rectPts(x, y, w, h), q = K.trim(pts, K.clamp(p));
      ctx.save(); ctx.strokeStyle = o.color || PH; ctx.lineWidth = 3 * s; K.poly(ctx, q); ctx.stroke();
      if (p >= 1) { ctx.lineWidth = 1.5 * s; ctx.strokeRect(x + 7 * s, y + 7 * s, w - 14 * s, h - 14 * s); }
      ctx.restore();
    },
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx), size = (o.size || 160) * s;
      ctx.save(); ctx.font = `${size}px "${FONT}"`; const str = K.fmt(value), w = ctx.measureText(str).width; ctx.restore();
      txt(ctx, str, x - w / 2, y, size, { color: o.color || HOT, inverse: o.inverse });
      return { w, h: size };
    },
    // inverse-video flip: a phosphor block behind the number blinks on, plus a bracket rule
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return; const s = S(ctx), on = p >= 1 || Math.floor(p * 8) % 2 === 0;
      if (on) { const hh = (o.h || 90) * s; ctx.save(); ctx.globalCompositeOperation = 'difference'; ctx.fillStyle = HOT; ctx.fillRect(x - r, y - hh, r * 2, hh * 1.25); ctx.globalCompositeOperation = 'multiply'; ctx.fillStyle = PH; ctx.fillRect(x - r, y - hh, r * 2, hh * 1.25); ctx.restore(); }
    },
    // V-hold roll: the raster slips vertically with the blanking bar crossing; the frame is blanked at 0.5
    transition(ctx, W, H, p, o = {}) {
      const [sx, sy, sw, sh] = geom(W, H).scr, A = tmp(W, H, 4), a = A.getContext('2d');
      a.clearRect(0, 0, W, H); a.drawImage(ctx.canvas, 0, 0);
      const k = p < 0.5 ? p * 2 : (1 - p) * 2, off = ((p < 0.5 ? 1 : -1) * K.ease.in(k) * sh * 0.9 + sh * 4) % sh, bar = sh * (0.08 + 0.9 * Math.pow(k, 6));
      ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip(); ctx.fillStyle = BG; ctx.fillRect(sx, sy, sw, sh);
      ctx.drawImage(A, sx, sy, sw, sh, sx, sy + off, sw, sh); ctx.drawImage(A, sx, sy, sw, sh, sx, sy + off - sh, sw, sh);
      ctx.fillStyle = '#000'; ctx.fillRect(sx, sy + off - bar / 2, sw, bar);
      ctx.fillStyle = 'rgba(160,255,180,0.08)'; ctx.fillRect(sx, sy + off - bar / 2 - 6, sw, 6);
      ctx.restore();
    },
  };

  // ---------- the shared demo as a live terminal session ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const g = geom(W, H), [sx, sy, sw, sh] = g.scr, s = g.s;
    if (!g.portrait) return { g, s, x0: sx + 60 * s, head: sy + 60 * s, hook: [[sy + 300 * s, '> ONE VIDEO.'], [sy + 400 * s, '  EVERY PLATFORM.']], hsize: 96,
      card: [sx + 60 * s, sy + 170 * s, 230 * s, 140 * s], cardLbl: [sx + 175 * s, sy + 355 * s], node: [sx + 370 * s, sy + 170 * s, 290 * s, 140 * s],
      list: PLATFORMS.map((_, i) => [sx + 740 * s, sy + (120 + i * 62) * s]), lsize: 46, status: sy + sh - 30 * s,
      top: [sx + sw / 2 - 150 * s, sy + 55 * s, 300 * s, 90 * s], cnt: [sx + sw / 2, sy + 330 * s], csize: 170, views: sy + 400 * s, take: [[sy + 505 * s, '> POST ONCE. REACH EVERYWHERE.']], tsize: 56 };
    return { g, s, x0: sx + 40 * s, head: sy + 50 * s, hook: [[H * 0.3, '> ONE VIDEO.'], [H * 0.36, '  EVERY'], [H * 0.42, '  PLATFORM.']], hsize: 96,
      card: [W / 2 - 170 * s, H * 0.09, 340 * s, 110 * s], cardLbl: [W / 2, H * 0.2], node: [W / 2 - 220 * s, H * 0.235, 440 * s, 125 * s],
      list: PLATFORMS.map((_, i) => [sx + 210 * s, H * (0.39 + i * 0.058)]), lsize: 46, status: sy + sh - 26 * s,
      top: [W / 2 - 220 * s, H * 0.07, 440 * s, 95 * s], cnt: [W / 2, H * 0.36], csize: 120, views: H * 0.41, take: [[H * 0.56, '> POST ONCE.'], [H * 0.62, '  REACH'], [H * 0.68, '  EVERYWHERE.']], tsize: 80 };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, g = Lo.g, [sx, sy, sw, sh] = g.scr;
      style.background(ctx, W, H, t);
      ctx.save(); ctx.beginPath(); ctx.rect(sx, sy, sw, sh); ctx.clip();
      // power on: a dot, a bright line that snaps open, then the raster settles
      if (t < 0.35) {
        const k = t / 0.35, cx = sx + sw / 2, cy = sy + sh / 2;
        if (k < 0.4) { const r = 6 + 30 * k; const gg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * s); gg.addColorStop(0, '#fff'); gg.addColorStop(1, 'rgba(92,255,122,0)'); ctx.fillStyle = gg; ctx.fillRect(cx - r * s, cy - r * s, 2 * r * s, 2 * r * s); }
        else { const hh = Math.max(3, sh * Math.pow((k - 0.4) / 0.6, 3)); ctx.fillStyle = k < 0.7 ? '#e8ffe8' : 'rgba(150,255,170,0.6)'; ctx.fillRect(sx, cy - hh / 2, sw, hh); }
        ctx.restore(); style.finish(ctx, W, H, t); return;
      }
      const warm = K.clamp((t - 0.35) / 0.6); ctx.globalAlpha = 0.55 + 0.45 * warm;
      style.title(ctx, t < 8.25 ? 'CREATOR OS TERMINAL  BIOS 2.06' : 'CREATOR OS  /  ANALYTICS', Lo.x0, Lo.head, 1, { size: 34, color: DIM });
      if (t < 2.0) {
        Lo.hook.forEach(([y, line], i) => style.title(ctx, line, Lo.x0, y, K.beat(t, 0.4 + i * 0.32, line.length / 44, 'lin'), { size: Lo.hsize, cursor: i === Lo.hook.length - 1, t }));
      } else if (t < 8.25) {
        // the hook scrolls away: it lives on as the status line below
        const [vx, vy, vw, vh] = Lo.card; style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.5, 'lin'));
        if (t > 2.4) { ctx.fillStyle = PH; ctx.beginPath(); ctx.moveTo(vx + vw * 0.42, vy + vh * 0.3); ctx.lineTo(vx + vw * 0.42, vy + vh * 0.7); ctx.lineTo(vx + vw * 0.62, vy + vh * 0.5); ctx.fill(); }
        style.label(ctx, 'your_video.mp4', Lo.cardLbl[0], Lo.cardLbl[1], K.beat(t, 2.6, 0.5, 'lin'), { size: 40, align: 'center' });
        const [nx, ny, nw, nh] = Lo.node;
        if (g.portrait) style.arrow(ctx, [W / 2, Lo.cardLbl[1] + 14 * s], [W / 2, ny - 10 * s], K.beat(t, 3.3, 0.5, 'lin'));
        else style.arrow(ctx, [vx + vw + 14 * s, vy + vh / 2], [nx - 14 * s, ny + nh / 2], K.beat(t, 3.3, 0.5, 'lin'));
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 3.9, 0.5, 'lin'));
        style.title(ctx, 'CREATOR OS', nx + 26 * s, ny + nh / 2 + 6 * s, K.beat(t, 4.3, 0.35, 'lin'), { size: 56, color: HOT });
        if (t > 4.7) style.title(ctx, Math.floor(t * 2) % 2 ? '[RUNNING]' : '', nx + 26 * s, ny + nh - 18 * s, 1, { size: 30, color: DIM });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [lx, ly] = Lo.list[i], p = K.beat(t, t0, 0.2, 'lin');
          if (g.portrait) { const bx = sx + 150 * s; if (i === 0) style.arrow(ctx, [W / 2, ny + nh + 8 * s], [W / 2, ny + nh + 40 * s], K.beat(t, 4.9, 0.1, 'lin')); if (i === 0 && t > 4.95) { ctx.strokeStyle = PH; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.moveTo(W / 2, ny + nh + 40 * s); ctx.lineTo(bx, ny + nh + 40 * s); ctx.lineTo(bx, K.lerp(ny + nh + 40 * s, Lo.list[6][1] - 14 * s, K.beat(t, 4.95, 2.6, 'lin'))); ctx.stroke(); } style.arrow(ctx, [bx, ly - 14 * s], [lx - 16 * s, ly - 14 * s], p); }
          else style.arrow(ctx, [nx + nw + 10 * s, ny + nh / 2], [lx - 16 * s, ly - 14 * s], p);
          const line = `${name.toUpperCase().padEnd(10, '.')} OK`;
          style.title(ctx, line, lx, ly, K.beat(t, t0 + 0.15, 0.22, 'lin'), { size: Lo.lsize });
        });
      } else {
        const [tx, ty, tw, th] = Lo.top; style.box(ctx, tx, ty, tw, th, 1);
        style.title(ctx, 'CREATOR OS', tx + tw / 2, ty + th / 2 + 16 * s, 1, { size: 56, color: HOT, align: 'center' });
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        style.counter(ctx, v, Lo.cnt[0], Lo.cnt[1], 1, { size: Lo.csize });
        style.emphasis(ctx, Lo.cnt[0], Lo.cnt[1], g.portrait ? sw * 0.46 : 380 * s, K.beat(t, 10.0, 0.5, 'lin'), { h: Lo.csize * 0.75 });
        style.title(ctx, 'VIEWS', Lo.cnt[0], Lo.views, K.beat(t, 8.7, 0.2, 'lin'), { size: 52, color: DIM, align: 'center' });
        let tt = 10.45; Lo.take.forEach(([y, line], i) => { style.title(ctx, line, Lo.x0, y, K.beat(t, tt, line.length / 32, 'lin'), { size: Lo.tsize, cursor: i === Lo.take.length - 1, t }); tt += line.length / 32; });
      }
      // inverse-video status line (the question lives on here)
      if (t > 2.0) {
        const clock = `00:00:${String(Math.floor(t)).padStart(2, '0')}`;
        const st = g.portrait ? ` ONE VIDEO. EVERY PLATFORM.  ${clock} ` : ` CX-80  ONE VIDEO. EVERY PLATFORM.  9600 BAUD  ONLINE  ${clock} `;
        style.title(ctx, st, Lo.x0, Lo.status, 1, { size: g.portrait ? 40 : 34, inverse: true });
      }
      ctx.globalAlpha = 1;
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 1);
      k.play('thud', 0.0, { gain: 0.6 }); k.tone({ t: 0.05, f: 15000, dur: 2.5, gain: 0.006, bus: 'amb', send: 0 });
      k.play('type', 0.4, { dur: 0.3 }); k.play('type', 0.72, { dur: 0.4 }); k.play('type', 1.04, { dur: 0.25 });
      k.play('click', 2.0); k.play('type', 2.6, { dur: 0.5 }); k.play('blip', 3.8, { note: 'E6', dur: 0.04 });
      k.play('click', 3.9); k.play('type', 4.3, { dur: 0.35 }); k.play('blip', 4.7, { note: 'A6', dur: 0.05 });
      for (let i = 0; i < 7; i++) { k.play('type', 5.15 + i * 0.4, { dur: 0.22, gain: 0.8 }); k.play('blip', 5.4 + i * 0.4, { note: 'C7', dur: 0.03, gain: 0.6 }); }
      k.play('whoosh', 7.6, { dur: 0.6, up: false }); k.play('glitch', 8.2, { gain: 0.5 }); k.play('whoosh', 8.3, { dur: 0.5 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0); k.play('blip', 10.0, { note: 'A5', dur: 0.12 });
      k.play('type', 10.45, { dur: 0.95 });
      k.play('chime', 11.45, { note: 'E5' });
    },
  };
  MS.register(style);
})();
