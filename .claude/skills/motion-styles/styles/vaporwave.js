// Vaporwave (Retro UI & Neon). A pastel-neon dreamscape on a chewed-up VHS tape: sliced sunset sun, glowing grid
// floor, a marble bust (drawn procedurally, lit lavender with pink/cyan rim light and veins) on a checkerboard plinth
// that glitches in horizontal slices, palm silhouettes, katakana, pastel pop-up windows. The tape finish runs every
// frame: soft VHS resample, chroma split, a crawling tracking band with sliced displacement, scanlines, noise, and the
// VCR on-screen display. Scene changes are tape cuts (blue screen + fast-forward tear).
(function () {
  const PINK = '#ff71ce', CYAN = '#01cdfe', MINT = '#05ffa1', LAV = '#b967ff', YEL = '#fffb96', DEEP = '#1a0a3a';
  const OSD = 'VT323', JP = 'Noto Serif JP', SANS = 'Montserrat';
  const S = (ctx) => K.layout(ctx.canvas.width, ctx.canvas.height).s;
  const tmp = (W, H, n) => K.cached(`vw-t${n}:${W}x${H}`, () => K.layer(W, H));

  // ---------- props ----------
  function bustLayer(s) {
    return K.cached(`vw-bust:${s.toFixed(3)}`, () => {
      const w = Math.round(320 * s), h = Math.round(400 * s), c = K.layer(w, h), x = c.getContext('2d');
      const marble = x.createLinearGradient(w * 0.2, 0, w * 0.85, h); marble.addColorStop(0, '#fbf6ff'); marble.addColorStop(0.5, '#ddd0ee'); marble.addColorStop(1, '#9a86b8');
      x.fillStyle = marble;
      // shoulders + chest
      x.beginPath(); x.moveTo(w * 0.05, h); x.bezierCurveTo(w * 0.05, h * 0.72, w * 0.25, h * 0.62, w * 0.42, h * 0.6); x.lineTo(w * 0.62, h * 0.6); x.bezierCurveTo(w * 0.82, h * 0.63, w * 0.96, h * 0.74, w * 0.96, h); x.closePath(); x.fill();
      // neck
      x.fillRect(w * 0.4, h * 0.42, w * 0.22, h * 0.22);
      // head in profile, facing left: skull, brow, nose, lips, chin
      x.beginPath(); x.moveTo(w * 0.62, h * 0.47); x.bezierCurveTo(w * 0.78, h * 0.42, w * 0.8, h * 0.12, w * 0.55, h * 0.06); x.bezierCurveTo(w * 0.36, h * 0.02, w * 0.28, h * 0.12, w * 0.3, h * 0.2);
      x.lineTo(w * 0.27, h * 0.27); x.lineTo(w * 0.3, h * 0.29); x.lineTo(w * 0.29, h * 0.32); x.lineTo(w * 0.31, h * 0.335); x.lineTo(w * 0.3, h * 0.36); x.bezierCurveTo(w * 0.32, h * 0.42, w * 0.38, h * 0.44, w * 0.45, h * 0.45); x.closePath(); x.fill();
      // curls
      const r = K.rng(77);
      for (let i = 0; i < 26; i++) { const a = r.range(-2.6, 0.4), rr = r.range(0.18, 0.24), cx = w * 0.56 + Math.cos(a) * w * rr, cy = h * 0.2 + Math.sin(a) * h * rr * 0.62; const g = x.createRadialGradient(cx - 3 * s, cy - 3 * s, 1, cx, cy, 13 * s); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#a898c4'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, r.range(9, 14) * s, 0, 6.283); x.fill(); }
      x.globalCompositeOperation = 'source-atop';
      // marble veins
      x.strokeStyle = 'rgba(120,100,150,0.35)'; x.lineWidth = 1.2 * s;
      for (let i = 0; i < 9; i++) { x.beginPath(); let px = r() * w, py = r() * h; x.moveTo(px, py); for (let j = 0; j < 6; j++) { px += r.range(-30, 30) * s; py += r.range(10, 40) * s; x.lineTo(px, py); } x.stroke(); }
      // shading + rim lights
      const sh = x.createLinearGradient(0, 0, w, 0); sh.addColorStop(0, 'rgba(255,113,206,0.35)'); sh.addColorStop(0.25, 'rgba(255,255,255,0)'); sh.addColorStop(0.7, 'rgba(60,30,100,0.0)'); sh.addColorStop(1, 'rgba(1,205,254,0.45)');
      x.fillStyle = sh; x.fillRect(0, 0, w, h);
      x.fillStyle = 'rgba(30,10,60,0.18)'; x.beginPath(); x.ellipse(w * 0.62, h * 0.3, w * 0.12, h * 0.2, 0, 0, 6.283); x.fill();
      x.fillStyle = 'rgba(40,20,70,0.5)'; x.beginPath(); x.ellipse(w * 0.37, h * 0.23, 5 * s, 3 * s, 0, 0, 6.283); x.fill();
      return c;
    });
  }
  function plinth(ctx, x, y, w, h, s) {
    const n = 8, cw = w / n;
    for (let row = 0; row < 2; row++) for (let i = 0; i < n; i++) { ctx.fillStyle = (i + row) % 2 ? '#111' : '#f4f0ff'; ctx.fillRect(x + i * cw, y + row * h / 2, cw + 0.5, h / 2 + 0.5); }
    ctx.fillStyle = '#e6dcf7'; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 20 * s, y - 16 * s); ctx.lineTo(x + w + 20 * s, y - 16 * s); ctx.lineTo(x + w, y); ctx.fill();
    ctx.fillStyle = '#5a4a7a'; ctx.beginPath(); ctx.moveTo(x + w, y); ctx.lineTo(x + w + 20 * s, y - 16 * s); ctx.lineTo(x + w + 20 * s, y + h - 16 * s); ctx.lineTo(x + w, y + h); ctx.fill();
  }
  // glitch: horizontal slices of a layer, displaced on glitch frames
  function sliced(ctx, img, x, y, w, h, t, amt) {
    const n = 18, r = K.rng(Math.floor(t * 15) + 1);
    for (let i = 0; i < n; i++) { const sy = (img.height * i) / n, sh = img.height / n, off = amt > 0 && r() < 0.35 ? r.range(-1, 1) * 40 * amt : 0; ctx.drawImage(img, 0, sy, img.width, sh, x + off, y + (h * i) / n, w, h / n + 0.5); }
  }
  function palm(s, flip) {
    return K.cached(`vw-palm:${s.toFixed(3)}:${flip}`, () => {
      const w = Math.round(360 * s), h = Math.round(520 * s), c = K.layer(w, h), x = c.getContext('2d'), r = K.rng(flip ? 5 : 9);
      if (flip) { x.translate(w, 0); x.scale(-1, 1); }
      x.fillStyle = '#2a0f4a'; x.strokeStyle = '#2a0f4a';
      // trunk
      x.beginPath(); x.moveTo(w * 0.42, h); x.bezierCurveTo(w * 0.46, h * 0.6, w * 0.52, h * 0.4, w * 0.58, h * 0.22); x.lineTo(w * 0.62, h * 0.23); x.bezierCurveTo(w * 0.57, h * 0.42, w * 0.53, h * 0.62, w * 0.5, h); x.fill();
      x.strokeStyle = 'rgba(255,113,206,0.25)'; x.lineWidth = 1.5 * s; for (let i = 0; i < 18; i++) { const k = i / 18, px = K.lerp(0.46, 0.6, 1 - k) * w, py = K.lerp(h, h * 0.24, 1 - k); x.beginPath(); x.moveTo(px - 6 * s, py); x.lineTo(px + 6 * s, py - 4 * s); x.stroke(); }
      // fronds
      x.fillStyle = '#2a0f4a';
      for (let i = 0; i < 9; i++) {
        const a = -Math.PI / 2 + (i - 4) * 0.42 + r.range(-0.1, 0.1), L = r.range(150, 190) * s, cx = w * 0.6, cy = h * 0.22;
        const tx = cx + Math.cos(a) * L, ty = cy + Math.sin(a) * L * 0.55 + L * 0.35 * Math.abs(Math.cos(a));
        x.beginPath(); x.moveTo(cx, cy);
        for (let j = 0; j <= 12; j++) { const k = j / 12, mx = K.lerp(cx, tx, k), my = K.lerp(cy, ty, k) - Math.sin(k * Math.PI) * 30 * s, wv = Math.sin(k * Math.PI) * 18 * s; x.lineTo(mx + wv * Math.sin(a), my - wv * Math.cos(a) - (j % 2 ? 6 * s : 0)); }
        for (let j = 12; j >= 0; j--) { const k = j / 12, mx = K.lerp(cx, tx, k), my = K.lerp(cy, ty, k) - Math.sin(k * Math.PI) * 30 * s; x.lineTo(mx, my + 3 * s); }
        x.fill();
      }
      return c;
    });
  }

  // ---------- the dreamscape ----------
  function scape(ctx, W, H, t, o = {}) {
    const L = K.layout(W, H), s = L.s, por = L.portrait, hz = o.hz || (por ? H * 0.6 : H * 0.62);
    const sky = ctx.createLinearGradient(0, 0, 0, hz); sky.addColorStop(0, '#2b0f5c'); sky.addColorStop(0.55, '#7a2b9c'); sky.addColorStop(0.85, '#e35fb0'); sky.addColorStop(1, '#ff9ad5');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, hz);
    const r = K.rng(4); ctx.fillStyle = 'rgba(255,255,255,0.7)'; for (let i = 0; i < 70; i++) ctx.fillRect(r() * W, r() * hz * 0.6, 1.5 * s, 1.5 * s);
    // sliced sun
    const sr = (por ? 230 : 175) * s, sx = por ? W * 0.5 : W * 0.33, sy = hz - sr * 0.55;
    ctx.save(); ctx.beginPath(); ctx.arc(sx, sy, sr, 0, 6.283); ctx.clip();
    const sg = ctx.createLinearGradient(0, sy - sr, 0, sy + sr); sg.addColorStop(0, YEL); sg.addColorStop(0.55, '#ffb05a'); sg.addColorStop(1, PINK); ctx.fillStyle = sg; ctx.fillRect(sx - sr, sy - sr, 2 * sr, 2 * sr);
    for (let i = 0; i < 9; i++) { const yy = sy + sr * (-0.05 + i * 0.12) - ((t * 6 * s) % (sr * 0.12)), hh = sr * (0.012 + i * 0.011); ctx.clearRect(0, 0, 0, 0); ctx.fillStyle = '#e35fb0'; ctx.fillRect(sx - sr, yy, 2 * sr, hh); }
    ctx.restore();
    // floor grid
    ctx.fillStyle = DEEP; ctx.fillRect(0, hz, W, H - hz);
    ctx.save(); ctx.beginPath(); ctx.rect(0, hz, W, H - hz); ctx.clip(); ctx.lineWidth = 2 * s; ctx.strokeStyle = 'rgba(255,113,206,0.85)';
    for (let i = 0; i < 12; i++) { const z = (i + (t * 0.8) % 1) / 12, yy = hz + (H - hz) * z * z; ctx.globalAlpha = 0.3 + 0.7 * z; ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(W, yy); ctx.stroke(); }
    ctx.globalAlpha = 1; for (let i = -14; i <= 14; i++) { ctx.beginPath(); ctx.moveTo(W / 2 + i * 34 * s, hz); ctx.lineTo(W / 2 + i * W * 0.2, H * 1.3); ctx.stroke(); }
    ctx.restore();
    const hg = ctx.createLinearGradient(0, hz - 30 * s, 0, hz + 20 * s); hg.addColorStop(0, 'rgba(255,154,213,0)'); hg.addColorStop(0.6, 'rgba(255,180,230,0.7)'); hg.addColorStop(1, 'rgba(255,113,206,0)'); ctx.fillStyle = hg; ctx.fillRect(0, hz - 30 * s, W, 50 * s);
    // palms
    if (!o.noPalms) { const p1 = palm(s, false), p2 = palm(s, true); ctx.drawImage(p1, por ? -120 * s : -60 * s, hz - p1.height + 40 * s); ctx.drawImage(p2, W - p2.width + (por ? 120 : 60) * s, hz - p2.height + 40 * s); }
    return hz;
  }

  // ---------- lettering ----------
  function chroma(ctx, str, x, y, font, col, o = {}) {
    ctx.save(); ctx.font = font; ctx.textAlign = o.align || 'left'; if (o.spacing) ctx.letterSpacing = o.spacing;
    const d = o.split ?? 3; ctx.globalAlpha = o.alpha ?? 1;
    ctx.fillStyle = 'rgba(1,205,254,0.85)'; ctx.fillText(str, x - d, y); ctx.fillStyle = 'rgba(255,60,170,0.85)'; ctx.fillText(str, x + d, y);
    ctx.fillStyle = col; ctx.fillText(str, x, y); const w = ctx.measureText(str).width; ctx.restore(); return w;
  }
  function popup(ctx, x, y, w, h, title, s, o = {}) {
    ctx.save(); ctx.globalAlpha = o.alpha ?? 1;
    ctx.fillStyle = 'rgba(20,0,40,0.35)'; ctx.fillRect(x + 6 * s, y + 6 * s, w, h);
    ctx.fillStyle = '#f2e6ff'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = '#3a1a6a'; ctx.lineWidth = 2 * s; ctx.strokeRect(x, y, w, h);
    const tb = 22 * s, g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, LAV); g.addColorStop(1, PINK); ctx.fillStyle = g; ctx.fillRect(x + 2 * s, y + 2 * s, w - 4 * s, tb);
    ctx.fillStyle = '#fff'; ctx.font = `${18 * s}px "${OSD}"`; ctx.fillText(title, x + 8 * s, y + tb - 5 * s);
    ctx.fillStyle = '#f2e6ff'; ctx.fillRect(x + w - tb, y + 5 * s, tb - 8 * s, tb - 6 * s); ctx.fillStyle = '#3a1a6a'; ctx.fillText('x', x + w - tb + 3 * s, y + tb - 6 * s);
    ctx.restore(); return { x: x + 8 * s, y: y + tb + 4 * s, w: w - 16 * s, h: h - tb - 8 * s };
  }

  const style = {
    id: 'vaporwave', name: 'Vaporwave', family: 'Retro UI & Neon',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=VT323&family=Noto+Serif+JP:wght@700;900&family=Montserrat:wght@500;800&display=block', specs: ['40px "VT323"', '900 60px "Noto Serif JP"', '800 40px "Montserrat"', '500 30px "Montserrat"'] }],
    palette: { bg: DEEP, pink: PINK, cyan: CYAN, mint: MINT, lavender: LAV, yellow: YEL, sky: '#7a2b9c' },
    sfx: { draw: null, land: 'blip', emphasis: 'glitch', transition: 'whoosh', bed: 'tape' },
    scape, chroma, popup, bust: bustLayer,

    background(ctx, W, H, t) { scape(ctx, W, H, t); },
    finish(ctx, W, H, t) {
      const s = S(ctx), A = tmp(W, H, 1), a = A.getContext('2d');
      // soft VHS: through a half-res resample
      const hw = Math.ceil(W / 2), hh = Math.ceil(H / 2), Hh = K.cached(`vw-half:${W}x${H}`, () => K.layer(hw, hh)), hx = Hh.getContext('2d');
      hx.drawImage(ctx.canvas, 0, 0, hw, hh); a.clearRect(0, 0, W, H); a.drawImage(ctx.canvas, 0, 0);
      ctx.save(); ctx.globalAlpha = 0.55; ctx.drawImage(Hh, 0, 0, W, H); ctx.restore();
      // chroma split: magenta right, cyan left
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.16;
      ctx.drawImage(A, 4 * s, 0); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.08; ctx.drawImage(A, -4 * s, 1); ctx.restore();
      // tracking band crawling down, with sliced displacement inside it
      const by = ((t * 0.09) % 1.3 - 0.15) * H, bh = 46 * s, r = K.rng(Math.floor(t * 24));
      for (let i = 0; i < 8; i++) { const yy = by + (i * bh) / 8, off = r.range(-14, 14) * s; ctx.drawImage(A, 0, yy, W, bh / 8, off, yy, W, bh / 8); }
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(0, by, W, bh);
      ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (let i = 0; i < 40; i++) ctx.fillRect(r() * W, by + r() * bh, r.range(10, 80) * s, 1.2 * s);
      // head-switching noise at the very bottom
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; ctx.fillRect(0, H - 8 * s, W, 8 * s); for (let i = 0; i < 20; i++) { ctx.fillStyle = `rgba(255,255,255,${r() * 0.4})`; ctx.fillRect(r() * W, H - r() * 8 * s, r.range(20, 120) * s, 1.5 * s); }
      const sl = K.cached(`vw-sl:${W}x${H}`, () => { const c = K.layer(W, H), x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.14)'; for (let y = 0; y < H; y += 3) x.fillRect(0, y, W, 1); return c; });
      ctx.drawImage(sl, 0, 0); K.grain(ctx, W, H, t, 0.09, 30, 'overlay'); K.vignette(ctx, W, H, 0.45, '#100020');
      // VCR on-screen display
      const L = K.layout(W, H), m = 40 * s, fs = 34 * s;
      ctx.save(); ctx.font = `${fs}px "${OSD}"`; ctx.fillStyle = '#ffffff'; ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowOffsetX = 2 * s; ctx.shadowOffsetY = 2 * s;
      ctx.textAlign = 'right'; ctx.fillText(t < 7.6 || t > 8.9 ? 'PLAY ▶' : '▶▶ FF', W - m, m + fs * 0.5);
      ctx.fillText(`SP 0:12:${String(30 + Math.floor(t)).padStart(2, '0')}`, W - m, H - m); ctx.textAlign = 'left'; ctx.fillText('JUN. 14 1996', m, H - m); ctx.restore();
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx), size = (o.size || 60) * s, n = Math.floor(text.length * K.clamp(p));
      const font = o.jp ? `900 ${size}px "${JP}"` : `800 ${size}px "${SANS}"`;
      const w = chroma(ctx, text.slice(0, n), x, y, font, o.color || '#ffffff', { align: o.align, spacing: o.jp ? '0px' : `${Math.round(size * 0.12)}px`, split: 3 * s });
      return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) { const s = S(ctx), size = (o.size || 32) * s, n = Math.floor(text.length * K.clamp(p)); return { w: chroma(ctx, text.slice(0, n), x, y, `${size * 1.25}px "${OSD}"`, o.color || '#ffffff', { align: o.align, split: 2 * s }), h: size }; },
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null; const s = S(ctx), pts = K.arcPts(from, to, o.bend ?? 0.1, 24), q = K.trim(pts, K.clamp(p));
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = K.rgba(o.color || CYAN, 0.3); ctx.lineWidth = 12 * s; K.poly(ctx, q); ctx.stroke(); ctx.strokeStyle = o.color || CYAN; ctx.lineWidth = 4 * s; K.poly(ctx, q); ctx.stroke();
      if (p >= 1) { const b = pts[pts.length - 1], a = pts[pts.length - 3], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 16 * s; ctx.fillStyle = o.color || CYAN; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang - 0.5) * L, b[1] - Math.sin(ang - 0.5) * L); ctx.lineTo(b[0] - Math.cos(ang + 0.5) * L, b[1] - Math.sin(ang + 0.5) * L); ctx.fill(); }
      ctx.restore(); return q[q.length - 1];
    },
    // a pastel pop-up window that blinks in on whole frames
    box(ctx, x, y, w, h, p, o = {}) { if (p <= 0) return null; const s = S(ctx), k = Math.ceil(K.clamp(p) * 3) / 3; return popup(ctx, x + (w * (1 - k)) / 2, y + (h * (1 - k)) / 2, w * k, h * k, o.title || 'reach.exe', s); },
    counter(ctx, value, x, y, p, o = {}) { const s = S(ctx), size = (o.size || 150) * s; return { w: chroma(ctx, K.fmt(value), x, y, `${size}px "${OSD}"`, o.color || '#ffffff', { align: o.align || 'center', split: 5 * s }), h: size }; },
    // chroma burst: the RGB split blows wide on the key frame, with a pastel sparkle ring
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0 || p >= 1) return; const s = S(ctx), k = Math.sin(p * Math.PI), A = tmp(ctx.canvas.width, ctx.canvas.height, 2), a = A.getContext('2d');
      a.clearRect(0, 0, A.width, A.height); a.drawImage(ctx.canvas, 0, 0);
      ctx.save(); ctx.beginPath(); ctx.rect(x - r, y - r * 0.4, r * 2, r * 0.8); ctx.clip(); ctx.globalCompositeOperation = 'lighten'; ctx.globalAlpha = 0.7 * k; ctx.drawImage(A, 18 * s * k, 0); ctx.drawImage(A, -18 * s * k, 0); ctx.restore();
      ctx.save(); ctx.strokeStyle = K.rgba(YEL, k); ctx.lineWidth = 3 * s; for (let i = 0; i < 12; i++) { const a2 = (i / 12) * 6.283, r0 = r * (0.6 + p * 0.5); ctx.beginPath(); ctx.moveTo(x + Math.cos(a2) * r0, y + Math.sin(a2) * r0 * 0.4); ctx.lineTo(x + Math.cos(a2) * (r0 + 30 * s), y + Math.sin(a2) * (r0 + 30 * s) * 0.4); ctx.stroke(); } ctx.restore();
    },
    // tape cut: fast-forward tears, then the VCR blue screen at 0.5, then the tape rolls into lock
    transition(ctx, W, H, p, o = {}) {
      const s = S(ctx), k = p < 0.5 ? p * 2 : (1 - p) * 2, r = K.rng(Math.floor(p * 60) + 7), A = tmp(W, H, 3), a = A.getContext('2d');
      a.clearRect(0, 0, W, H); a.drawImage(ctx.canvas, 0, 0);
      const roll = p > 0.5 ? (1 - k) * 0 + k * H * 0.6 : 0;
      if (roll) { ctx.drawImage(A, 0, roll); ctx.drawImage(A, 0, roll - H); ctx.fillStyle = '#000'; ctx.fillRect(0, roll - 14 * s, W, 14 * s); }
      for (let i = 0; i < Math.floor(k * 14); i++) { const y = r() * H, h = r.range(6, 40) * s; ctx.drawImage(A, 0, y, W, h, r.range(-80, 80) * s, y, W, h); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(0, y, W, 2 * s); }
      if (k > 0.75) { ctx.fillStyle = `rgba(30,60,255,${K.clamp((k - 0.75) * 5)})`; ctx.fillRect(0, 0, W, H); ctx.font = `${60 * s}px "${OSD}"`; ctx.fillStyle = `rgba(255,255,255,${K.clamp((k - 0.8) * 5)})`; ctx.textAlign = 'center'; ctx.fillText('▶▶  FF', W / 2, H / 2); ctx.textAlign = 'left'; }
    },
  };

  // ---------- the shared demo, on tape ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const CHIP = [PINK, CYAN, MINT, LAV, CYAN, PINK, MINT];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, por: false, jp: [70 * s, 130 * s], hook: [[70 * s, 215 * s, 'ONE VIDEO.'], [70 * s, 285 * s, 'EVERY PLATFORM.']], hsize: 54,
      pol: [110 * s, 455 * s, 170 * s], bust: [890 * s, 150 * s, 290 * s], plinth: [890 * s, 512 * s, 270 * s, 80 * s], nodeLbl: [1025 * s, 650 * s],
      chips: PLATFORMS.map((_, i) => [430 * s, (40 + i * 64) * s, 270 * s, 58 * s]), lsize: 30,
      cnt: [470 * s, 300 * s], csize: 170, views: [470 * s, 360 * s], take: [[70 * s, 500 * s, 'POST ONCE.'], [70 * s, 570 * s, 'REACH EVERYWHERE.']], ksize: 50 };
    return { s, por: true, jp: [W * 0.08, H * 0.09], hook: [[W * 0.08, H * 0.15, 'ONE VIDEO.'], [W * 0.08, H * 0.2, 'EVERY'], [W * 0.08, H * 0.25, 'PLATFORM.']], hsize: 48,
      pol: [W * 0.06, H * 0.06, 210 * s], bust: [W / 2 - 130 * s, H * 0.27, 260 * s], plinth: [W / 2 - 135 * s, H * 0.27 + 325 * s, 250 * s, 70 * s], nodeLbl: [W / 2, H * 0.27 + 450 * s],
      chips: PLATFORMS.map((_, i) => [i % 2 ? W * 0.52 : W * 0.06, H * (0.66 + Math.floor(i / 2) * 0.065), W * 0.42, 52 * s]), lsize: 30,
      cnt: [W / 2, H * 0.2], csize: 120, views: [W / 2, H * 0.245], take: [[W * 0.08, H * 0.7, 'POST ONCE.'], [W * 0.08, H * 0.75, 'REACH'], [W * 0.08, H * 0.8, 'EVERYWHERE.']], ksize: 48 };
  }
  function polaroid(ctx, x, y, w, rot, s, t) {
    ctx.save(); ctx.translate(x + w / 2, y + w * 0.6); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(20,0,40,0.4)'; ctx.fillRect(-w / 2 + 6 * s, -w * 0.6 + 8 * s, w, w * 1.2);
    ctx.fillStyle = '#f7f2ea'; ctx.fillRect(-w / 2, -w * 0.6, w, w * 1.2);
    const g = ctx.createLinearGradient(0, -w * 0.52, 0, w * 0.4); g.addColorStop(0, '#5a2b9c'); g.addColorStop(0.6, '#ff8ac8'); g.addColorStop(1, YEL);
    ctx.fillStyle = g; ctx.fillRect(-w * 0.44, -w * 0.52, w * 0.88, w * 0.88);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(-w * 0.1, -w * 0.25); ctx.lineTo(-w * 0.1, w * 0.02); ctx.lineTo(w * 0.14, -w * 0.12); ctx.fill();
    ctx.fillStyle = '#3a1a6a'; ctx.font = `${30 * s}px "${OSD}"`; ctx.textAlign = 'center'; ctx.fillText('your video', 0, w * 0.52); ctx.restore();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, por = Lo.por;
      scape(ctx, W, H, t);
      const [bx, by, bw2] = Lo.bust, B = bustLayer(s * bw2 / (290 * s) * 1), bh2 = bw2 * (400 / 320);
      // the bust glitches in slice by slice at 2.0, then glitches on every land
      const bustIn = K.clamp((t - 3.9) / 0.6), glitchAmt = t < 4.5 ? 1 - bustIn : (t > 10 && t < 10.4 ? 1 : 0) + PLATFORMS.reduce((m, _, i) => m + (Math.abs(t - (5.2 + i * 0.4)) < 0.05 ? 0.6 : 0), 0);
      const [px, py, pw, ph] = Lo.plinth;
      if (t > 3.9) { plinth(ctx, px, py, pw, ph, s); if (bustIn > 0) { ctx.save(); ctx.globalAlpha = bustIn; sliced(ctx, B, bx, by + (por ? 0 : 0), bw2, bh2 - 4 * s, t, glitchAmt); ctx.restore(); } }
      if (t < 8.25) {
        if (t < 2.1) {
          style.title(ctx, 'ワンビデオ', Lo.jp[0], Lo.jp[1], K.beat(t, 0.4, 0.3, 'lin'), { jp: true, size: por ? 46 : 52, color: '#ffe3f6' });
          Lo.hook.forEach(([x, y, txt], i) => style.title(ctx, txt, x, y, K.beat(t, 0.6 + i * 0.25, 0.35, 'lin'), { size: Lo.hsize }));
        } else {
          if (!por) style.title(ctx, 'ニューラル・ポスト', Lo.jp[0], Lo.jp[1] - (por ? 0 : 50 * s), 1, { jp: true, size: por ? 34 : 34, color: 'rgba(255,227,246,0.85)' });
          const [plx, ply, plw] = Lo.pol, slide = K.beat(t, 2.0, 0.7, 'out');
          polaroid(ctx, plx - (1 - slide) * W * 0.4, ply, plw, -0.08 + (1 - slide) * 0.3, s, t);
          const from = por ? [plx + plw + 10 * s, ply + plw * 0.5] : [plx + plw + 20 * s, ply + plw * 0.6], to = por ? [bx + bw2 * 0.2, by + bh2 * 0.05] : [px - 16 * s, py + ph * 0.3];
          style.arrow(ctx, from, to, K.beat(t, 3.3, 0.55, 'lin'), { color: CYAN, bend: por ? -0.2 : -0.1 });
          if (t > 4.4) { const w = (por ? 300 : 270) * s; const ib = popup(ctx, Lo.nodeLbl[0] - w / 2, Lo.nodeLbl[1] - 40 * s, w, 56 * s, 'model.exe', s, { alpha: K.clamp((t - 4.4) * 5) }); chroma(ctx, 'CREATOR OS', Lo.nodeLbl[0], ib.y + 24 * s, `800 ${26 * s}px "${SANS}"`, '#3a1a6a', { align: 'center', split: 1.5 * s }); }
          PLATFORMS.forEach((name, i) => {
            const t0 = 5.0 + i * 0.4, [cx, cy, cw, chh] = Lo.chips[i], p = K.beat(t, t0, 0.25, 'lin');
            const src = por ? [Lo.nodeLbl[0], Lo.nodeLbl[1] + 22 * s] : [bx + 20 * s, by + bh2 * 0.35];
            if (por) { if (i === 0) style.arrow(ctx, src, [W / 2, Lo.chips[6][1] + Lo.chips[6][3] / 2], K.beat(t, 4.9, 0.5, 'lin'), { color: CYAN, bend: 0 }); style.arrow(ctx, [W / 2, cy + chh / 2], [i % 2 ? cx - 2 * s : cx + cw + 2 * s, cy + chh / 2], p, { color: CHIP[i], bend: 0 }); }
            else style.arrow(ctx, src, [cx + cw + 10 * s, cy + chh / 2], p, { color: CHIP[i], bend: 0.05 });
            if (t > t0 + 0.2) { const ib = style.box(ctx, cx, cy, cw, chh, K.beat(t, t0 + 0.2, 0.1, 'lin'), { title: `${name.toLowerCase()}.exe` }); if (ib && t > t0 + 0.3) chroma(ctx, name.toUpperCase(), ib.x + 4 * s, ib.y + ib.h - 3 * s, `800 ${Lo.lsize * s * 0.95}px "${SANS}"`, '#3a1a6a', { split: 1.5 * s }); }
          });
        }
      } else {
        style.title(ctx, 'ビュー', Lo.jp[0], Lo.jp[1] - (por ? 0 : 50 * s), 1, { jp: true, size: 40, color: 'rgba(255,227,246,0.85)' });
        if (por) {} else { const w = 270 * s; const ib = popup(ctx, Lo.nodeLbl[0] - w / 2, Lo.nodeLbl[1] - 40 * s, w, 56 * s, 'model.exe', s); chroma(ctx, 'CREATOR OS', Lo.nodeLbl[0], ib.y + 24 * s, `800 ${26 * s}px "${SANS}"`, '#3a1a6a', { align: 'center', split: 1.5 * s }); }
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        style.counter(ctx, v, Lo.cnt[0], Lo.cnt[1], 1, { size: Lo.csize });
        style.label(ctx, 'VIEWS', Lo.views[0], Lo.views[1] + 20 * s, K.beat(t, 8.7, 0.3, 'lin'), { size: 36, align: 'center', color: '#ffffff' });
        style.emphasis(ctx, Lo.cnt[0], Lo.cnt[1] - Lo.csize * 0.3 * s, (por ? 460 : 420) * s, K.beat(t, 10.0, 0.6, 'lin'));
        Lo.take.forEach(([x, y, txt], i) => style.title(ctx, txt, x, y, K.beat(t, 10.45 + i * 0.25, 0.35, 'lin'), { size: Lo.ksize, color: i ? '#ffe3f6' : '#ffffff' }));
      }
      // the tape starts on the blue screen and rolls into lock
      if (t < 0.6) { const k = t / 0.6; ctx.fillStyle = `rgba(30,60,255,${1 - K.clamp((k - 0.5) * 2)})`; ctx.fillRect(0, 0, W, H); if (k > 0.4) { const A = tmp(W, H, 4), a = A.getContext('2d'); a.clearRect(0, 0, W, H); a.drawImage(ctx.canvas, 0, 0); const off = (1 - k) * H * 0.8; ctx.drawImage(A, 0, off); ctx.drawImage(A, 0, off - H); ctx.fillStyle = '#000'; ctx.fillRect(0, off - 10 * s, W, 10 * s); } }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('tape', 0, 12, 1.2); k.bed('vinyl', 0, 12, 0.5);
      k.play('click', 0.0, { pitch: 0.4, gain: 2 }); k.play('whoosh', 0.25, { dur: 0.35, up: false });
      k.play('swell', 0.4, { dur: 2.5, chord: ['F3', 'A3', 'C4', 'E4'], gain: 1.4 });
      k.play('glitch', 0.4, { gain: 0.4 }); k.play('blip', 0.6, { note: 'E5', dur: 0.05 }); k.play('blip', 0.85, { note: 'G5', dur: 0.05 }); k.play('blip', 1.1, { note: 'C6', dur: 0.05 });
      k.play('whoosh', 2.0, { dur: 0.7 }); k.play('paper', 2.6, { dur: 0.2 }); k.play('whoosh', 3.3, { dur: 0.5 });
      k.play('glitch', 3.9); k.play('pluck', 4.3, { note: 'A4' }); k.play('pop', 4.4, { pitch: 0.8 });
      const n = ['E5', 'G5', 'B5', 'D6', 'E6', 'G6', 'B6'];
      for (let i = 0; i < 7; i++) { k.play('blip', 5.2 + i * 0.4, { note: n[i], dur: 0.06 }); k.play('glitch', 5.2 + i * 0.4, { gain: 0.25 }); }
      k.play('whoosh', 7.6, { dur: 0.6, up: false }); for (let i = 0; i < 6; i++) k.play('click', 7.7 + i * 0.08, { pitch: 0.6 }); k.play('click', 8.25, { pitch: 0.4, gain: 2 }); k.play('whoosh', 8.3, { dur: 0.5 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('glitch', 10.0); k.play('ding', 10.05, { gain: 0.8 });
      k.play('swell', 10.4, { dur: 1.6, chord: ['C4', 'E4', 'G4', 'B4'], gain: 1.4 }); k.play('chime', 11.2, { note: 'E5' });
    },
  };
  MS.register(style);
})();
