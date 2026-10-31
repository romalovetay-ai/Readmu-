// 1940s Film Noir (Light & Imaging). A detective office shot on nitrate: venetian-blind light raking the plaster,
// smoke hanging in the beams, a glowing terminal as the only other light, booking placards for labels, white newsreel
// arrows, a mechanical odometer, a rubber stamp, iris transitions, then the projector pass: gate weave, halation,
// flicker, heavy grain, dust and scratches, all forced to silver monochrome.
(function () {
  const ID = 'film-noir';
  const C = { black: '#08080a', ink: '#151517', wall: '#2b2a28', grey: '#6f6c66', silver: '#cdc8bd', white: '#f3f0e8' };
  const TF = 'Limelight', PF = 'Special Elite', NF = 'Oswald';
  const S = (W, H) => K.layout(W, H).s;
  const cw = (ctx) => [ctx.canvas.width, ctx.canvas.height];

  // ---------- cached plates ----------
  function wallPlate(W, H) {
    return K.cached(`${ID}:wall:${W}x${H}`, () => {
      const w = Math.ceil(W / 3), h = Math.ceil(H / 3), c = K.layer(w, h), x = c.getContext('2d');
      const img = x.createImageData(w, h), d = img.data, nz = K.noise(31), r = K.rng(32);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const m = nz.fbm2(i * 0.03, j * 0.03, 4) * 0.5 + (r() - 0.5) * 0.12, v = 40 + m * 34, o = (j * w + i) * 4;
        d[o] = v; d[o + 1] = v * 0.98; d[o + 2] = v * 0.95; d[o + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      const out = K.layer(W, H), ox = out.getContext('2d'); ox.imageSmoothingEnabled = true; ox.drawImage(c, 0, 0, W, H);
      return out;
    });
  }
  // Slatted window light: soft-edged stripes on a skewed patch, drawn small and scaled up for a soft penumbra.
  function blindsPlate(W, H) {
    return K.cached(`${ID}:blinds:${W}x${H}`, () => {
      const f = 4, w = Math.ceil(W / f), h = Math.ceil(H / f), c = K.layer(w, h), x = c.getContext('2d');
      const portrait = H > W;
      x.save(); x.translate(w * (portrait ? 0.15 : 0.42), h * (portrait ? 0.02 : -0.05)); x.rotate(-0.42); x.transform(1, 0, -0.25, 1, 0, 0);
      const n = portrait ? 26 : 15, band = (portrait ? h * 0.75 : h * 1.05) / n;
      x.fillStyle = '#fff';
      const len = w * (portrait ? 1.4 : 1.0);
      for (let i = 0; i < n; i++) x.fillRect(0, i * band, len, band * 0.52);
      // window-frame edges fall off softly instead of cutting hard
      x.globalCompositeOperation = 'destination-in';
      const e = x.createLinearGradient(0, 0, len, 0); e.addColorStop(0, 'rgba(0,0,0,0)'); e.addColorStop(0.16, 'rgba(0,0,0,1)'); e.addColorStop(1, 'rgba(0,0,0,1)');
      x.fillStyle = e; x.fillRect(-10, -10, len + 20, n * band + 20);
      x.restore(); x.globalCompositeOperation = 'source-over';
      // falloff from the window
      x.globalCompositeOperation = 'destination-in';
      const g = x.createRadialGradient(w * 0.8, h * 0.15, 0, w * 0.8, h * 0.15, Math.hypot(w, h) * 0.75);
      g.addColorStop(0, 'rgba(0,0,0,1)'); g.addColorStop(0.65, 'rgba(0,0,0,0.65)'); g.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      const out = K.layer(W, H), ox = out.getContext('2d'); ox.filter = 'blur(1.5px)'; ox.drawImage(c, 0, 0, W, H);
      return out;
    });
  }
  function smokePlate(W, H) {
    return K.cached(`${ID}:smoke:${W}x${H}`, () => {
      const w = 220, h = Math.round(220 * H / W), c = K.layer(w, h), x = c.getContext('2d');
      const img = x.createImageData(w, h), d = img.data, nz = K.noise(55);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        const q = nz.fbm2(i * 0.022 + nz.n2(j * 0.02, 3) * 1.4, j * 0.03, 5), a = K.clamp((q + 0.05) * 2.2), o = (j * w + i) * 4;
        d[o] = d[o + 1] = d[o + 2] = 235; d[o + 3] = a * a * 255;
      }
      x.putImageData(img, 0, 0);
      const out = K.layer(W, H * 1.5), ox = out.getContext('2d'); ox.drawImage(c, 0, 0, W, H * 1.5);
      return out;
    });
  }
  // ---------- bloom (halation) on bright areas: quarter-res threshold + blur ----------
  function bloom(ctx, W, H, th, radius, amount) {
    const f = 4, w = Math.ceil(W / f), h = Math.ceil(H / f);
    const a = K.cached(`${ID}:bla:${w}x${h}`, () => K.layer(w, h)), b = K.cached(`${ID}:blb:${w}x${h}`, () => K.layer(w, h));
    const ax = a.getContext('2d', { willReadFrequently: true }); ax.globalCompositeOperation = 'copy'; ax.drawImage(ctx.canvas, 0, 0, w, h);
    const img = ax.getImageData(0, 0, w, h), d = img.data, t0 = th * 255, k = 255 / (255 - t0);
    for (let i = 0; i < d.length; i += 4) { d[i] = Math.max(0, d[i] - t0) * k; d[i + 1] = Math.max(0, d[i + 1] - t0) * k; d[i + 2] = Math.max(0, d[i + 2] - t0) * k; }
    ax.putImageData(img, 0, 0);
    const bx = b.getContext('2d'); bx.globalCompositeOperation = 'copy'; bx.filter = `blur(${radius}px)`; bx.drawImage(a, 0, 0); bx.filter = 'none';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amount; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
  }

  // ---------- props ----------
  // CRT terminal, the only other light in the room.
  function terminal(ctx, x, y, w, h, p, t, s) {
    if (p <= 0) return;
    ctx.save(); ctx.globalAlpha = K.clamp(p * 2);
    const glow = K.clamp((p - 0.3) / 0.4) * (0.92 + 0.08 * Math.sin(t * 37) * Math.sin(t * 11));
    // spill on the wall
    const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 1.3);
    g.addColorStop(0, `rgba(240,240,232,${0.28 * glow})`); g.addColorStop(1, 'rgba(240,240,232,0)');
    ctx.fillStyle = g; ctx.fillRect(x - w, y - h, w * 3, h * 3);
    // housing
    const hg = ctx.createLinearGradient(x, y, x, y + h); hg.addColorStop(0, '#77746e'); hg.addColorStop(1, '#2f2e2c');
    ctx.fillStyle = hg; rr(ctx, x, y, w, h, 14 * s); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 2 * s; rr(ctx, x, y, w, h, 14 * s); ctx.stroke();
    // screen
    const sx = x + w * 0.1, sy = y + h * 0.1, sw = w * 0.8, sh = h * 0.68;
    ctx.fillStyle = '#0d0d0d'; rr(ctx, sx - 4 * s, sy - 4 * s, sw + 8 * s, sh + 8 * s, 18 * s); ctx.fill();
    const sg = ctx.createRadialGradient(sx + sw / 2, sy + sh / 2, 0, sx + sw / 2, sy + sh / 2, sw * 0.7);
    sg.addColorStop(0, K.rgba('#f4f2ea', glow)); sg.addColorStop(0.75, K.rgba('#b9b6ad', glow * 0.9)); sg.addColorStop(1, K.rgba('#5e5c57', glow * 0.9));
    ctx.fillStyle = sg; rr(ctx, sx, sy, sw, sh, 16 * s); ctx.fill();
    // CRT flash on warm-up
    const flash = K.clamp(1 - Math.abs(p - 0.45) / 0.08);
    if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; rr(ctx, sx, sy, sw, sh, 16 * s); ctx.fill(); }
    ctx.save(); rr(ctx, sx, sy, sw, sh, 16 * s); ctx.clip();
    ctx.fillStyle = 'rgba(0,0,0,0.13)'; for (let j = sy; j < sy + sh; j += 4 * s) ctx.fillRect(sx, j, sw, 1.6 * s);
    ctx.restore();
    // play triangle burned dark into the phosphor
    if (glow > 0.2) {
      const cx = sx + sw / 2, cy = sy + sh / 2, r = sh * 0.26;
      ctx.fillStyle = K.rgba('#1a1a1a', glow * 0.9); ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx - r * 0.6, cy + r); ctx.closePath(); ctx.fill();
    }
    // knobs + vent
    ctx.fillStyle = '#1b1b1b'; for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.arc(x + w * (0.78 + i * 0.09), y + h * 0.89, 5 * s, 0, 7); ctx.fill(); }
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; for (let i = 0; i < 6; i++) ctx.fillRect(x + w * 0.12 + i * 9 * s, y + h * 0.87, 5 * s, 9 * s);
    ctx.restore();
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  // The detective: fedora + trench coat in profile, rim-lit, blinds falling across him.
  function detective(ctx, x, y, hgt, a, W, H, t) {
    if (a <= 0) return;
    const u = hgt;
    ctx.save(); ctx.globalAlpha = a;
    const P = (pts) => pts.map(([px, py]) => [x + px * u, y - py * u]);
    const path = () => {
      ctx.beginPath(); ctx.moveTo(x - 0.42 * u, y);
      const seg = (c1, c2, e) => ctx.bezierCurveTo(x + c1[0] * u, y - c1[1] * u, x + c2[0] * u, y - c2[1] * u, x + e[0] * u, y - e[1] * u);
      const ln = (e) => ctx.lineTo(x + e[0] * u, y - e[1] * u);
      seg([-0.41, 0.25], [-0.38, 0.5], [-0.3, 0.63]);   // coat front up to the shoulder
      ln([-0.17, 0.705]);                               // turned-up collar
      seg([-0.17, 0.73], [-0.175, 0.75], [-0.172, 0.765]); // chin
      ln([-0.186, 0.787]); ln([-0.178, 0.795]);         // mouth
      seg([-0.2, 0.81], [-0.205, 0.82], [-0.19, 0.835]); // nose
      ln([-0.185, 0.858]);                              // brow under the brim
      seg([-0.26, 0.86], [-0.33, 0.862], [-0.345, 0.872]); // brim front, snapped down
      seg([-0.32, 0.885], [-0.22, 0.893], [-0.155, 0.897]);
      seg([-0.15, 0.95], [-0.14, 0.985], [-0.11, 0.99]); // crown front
      seg([-0.06, 0.995], [-0.03, 0.968], [0.0, 0.968]); // centre dent
      seg([0.03, 0.968], [0.07, 0.995], [0.1, 0.99]);
      seg([0.125, 0.98], [0.13, 0.93], [0.13, 0.9]);    // crown back
      seg([0.2, 0.895], [0.25, 0.888], [0.255, 0.876]); // brim back
      seg([0.22, 0.866], [0.15, 0.862], [0.1, 0.86]);
      seg([0.1, 0.8], [0.085, 0.76], [0.1, 0.72]);      // back of head + neck
      seg([0.16, 0.69], [0.3, 0.65], [0.36, 0.6]);      // collar to shoulder
      seg([0.43, 0.5], [0.46, 0.25], [0.47, 0]);
      ctx.closePath();
    };
    path(); ctx.fillStyle = '#060606'; ctx.fill();
    // blinds over the coat
    ctx.save(); path(); ctx.clip(); ctx.globalAlpha = a * 0.16; ctx.drawImage(blindsPlate(W, H), 0, 0); ctx.restore();
    // rim light only on the side facing the light
    ctx.save(); path(); ctx.clip(); ctx.beginPath(); ctx.rect(x - u, y - 1.2 * u, u * 0.93, 1.3 * u); ctx.clip();
    ctx.lineWidth = u * 0.008; ctx.strokeStyle = 'rgba(240,237,228,0.7)'; ctx.shadowColor = 'rgba(255,255,255,0.9)'; ctx.shadowBlur = u * 0.015; path(); ctx.stroke(); ctx.restore();
    // cigarette ember + curl
    const ex = x - 0.13 * u, ey = y - 0.782 * u;
    ctx.fillStyle = '#fff'; ctx.shadowColor = '#fff'; ctx.shadowBlur = 10; ctx.beginPath(); ctx.arc(ex - 0.05 * u, ey, u * 0.006, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.strokeStyle = 'rgba(220,220,215,0.28)'; ctx.lineWidth = u * 0.006; ctx.beginPath();
    for (let i = 0; i <= 30; i++) { const k = i / 30, px = ex - 0.05 * u + Math.sin(k * 7 + t * 1.3) * u * 0.03 * k, py = ey - k * u * 0.35; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.stroke();
    ctx.restore();
  }

  const style = {
    id: ID, name: '1940s Film Noir', family: 'Light & Imaging',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Limelight&family=Special+Elite&family=Oswald:wght@500;700&display=block', specs: ['400 64px "Limelight"', '400 32px "Special Elite"', '700 80px "Oswald"', '500 30px "Oswald"'] }],
    palette: { bg: C.black, ...C },
    sfx: { draw: null, land: 'thud', emphasis: 'stamp', transition: 'whoosh', bed: 'vinyl' },
    setup(W, H) { wallPlate(W, H); blindsPlate(W, H); smokePlate(W, H); },

    background(ctx, W, H, t) {
      ctx.drawImage(wallPlate(W, H), 0, 0);
      // blinds sway a hair, light breathes
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.5 + 0.03 * Math.sin(t * 1.7);
      ctx.translate(W * 0.9, 0); ctx.rotate(0.006 * Math.sin(t * 0.6)); ctx.translate(-W * 0.9, 0);
      ctx.drawImage(blindsPlate(W, H), 0, 0); ctx.restore();
      // smoke hanging in the beams, drifting up
      const sm = smokePlate(W, H), dy = -((t * 14) % (H * 0.5));
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.16; ctx.drawImage(sm, Math.sin(t * 0.3) * 20, dy); ctx.restore();
      // desk edge
      const s = S(W, H), dyk = H > W ? H * 0.93 : H * 0.9;
      const g = ctx.createLinearGradient(0, dyk, 0, H); g.addColorStop(0, '#191918'); g.addColorStop(1, '#050505');
      ctx.fillStyle = g; ctx.fillRect(0, dyk, W, H - dyk); ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.fillRect(0, dyk, W, 2 * s);
    },

    finish(ctx, W, H, t) {
      const s = S(W, H), f = Math.floor(t * 24), r = K.rng(f * 7 + 3);
      // gate weave
      const tmp = K.cached(`${ID}:tmp:${W}x${H}`, () => K.layer(W, H)), tx = tmp.getContext('2d');
      tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'copy';
      ctx.translate(W / 2 + (r() - 0.5) * 2.2 * s, H / 2 + (r() - 0.5) * 3.2 * s); ctx.scale(1.012, 1.012); ctx.drawImage(tmp, -W / 2, -H / 2); ctx.restore();
      // silver: strip colour, lift highlights into halation
      ctx.save(); ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore();
      bloom(ctx, W, H, 0.62, 3, 0.55);
      // projector flicker
      ctx.fillStyle = `rgba(0,0,0,${0.03 + r() * 0.07})`; ctx.fillRect(0, 0, W, H);
      K.vignette(ctx, W, H, 0.78, '#000');
      K.grain(ctx, W, H, t, 0.22, 24, 'overlay');
      // dust (per frame) and scratches (live a few frames)
      ctx.save();
      for (let i = 0; i < 9; i++) { const x = r() * W, y = r() * H, big = r() < 0.2; ctx.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.ellipse(x, y, (big ? 3 : 1.3) * s, (big ? 2 : 1.1) * s, r() * 3, 0, 7); ctx.fill(); }
      if (r() < 0.25) { ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1.2 * s; const x = r() * W, y = r() * H; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 20 * s, y + 10 * s, x + 8 * s, y + 34 * s); ctx.stroke(); }
      const rs = K.rng(Math.floor(f / 7) * 13 + 1);
      for (let i = 0; i < 2; i++) { if (rs() < 0.6) { const x = rs() * W + (r() - 0.5) * 3 * s; ctx.fillStyle = `rgba(235,235,230,${0.12 + rs() * 0.2})`; ctx.fillRect(x, 0, 1.1 * s, H); } }
      ctx.restore();
    },

    // Title card: art-deco lettering dissolving in word by word, a soft halo, optional deco rules.
    title(ctx, text, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 64) * s;
      ctx.save(); ctx.font = K.font(size, o.font || TF, 400); ctx.textBaseline = 'alphabetic';
      let lines = [text];
      if (o.maxW && ctx.measureText(text).width > o.maxW) lines = K.wrap(ctx, text, o.maxW);
      const words = text.split(' ').length; let wi = 0;
      const lh = size * 1.12, y0 = y - (lines.length - 1) * lh;
      let maxw = 0;
      lines.forEach((ln, li) => {
        const lw = ctx.measureText(ln).width; maxw = Math.max(maxw, lw);
        let cx = o.align === 'center' ? x - lw / 2 : o.align === 'right' ? x - lw : x;
        for (const wd of ln.split(' ')) {
          const a = K.clamp(p * (words + 0.6) - wi); wi++;
          if (a > 0) {
            ctx.globalAlpha = a; ctx.fillStyle = '#000'; ctx.shadowColor = 'rgba(0,0,0,0.95)'; ctx.shadowBlur = 22 * s;
            ctx.fillText(wd, cx + 2 * s, y0 + li * lh + 3 * s);
            ctx.fillStyle = o.color || C.white; ctx.shadowColor = 'rgba(255,255,255,0.4)'; ctx.shadowBlur = 10 * s;
            ctx.fillText(wd, cx, y0 + li * lh); ctx.shadowBlur = 0;
          }
          cx += ctx.measureText(wd + ' ').width;
        }
      });
      if (o.rule) {
        const a = K.clamp(p * 1.5), half = maxw / 2 + 30 * s;
        ctx.globalAlpha = a; ctx.strokeStyle = C.silver; ctx.lineWidth = 2 * s;
        for (const dy of [-size * 0.95, size * 0.32]) { const yy = (dy < 0 ? y0 : y) + dy; ctx.beginPath(); ctx.moveTo(x - half * a, yy); ctx.lineTo(x + half * a, yy); ctx.stroke(); }
        ctx.beginPath(); ctx.moveTo(x - half * a, y + size * 0.32 + 6 * s); ctx.lineTo(x + half * a, y + size * 0.32 + 6 * s); ctx.lineWidth = 1 * s; ctx.stroke();
      }
      ctx.restore();
      return { w: maxw, h: size * lines.length };
    },

    // Booking placard: black slate, chalk-white border, hung on a cord, swings in and settles.
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return { w: 0, h: 0 };
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 30) * s;
      ctx.save(); ctx.font = K.font(size, PF, 400);
      const tw = ctx.measureText(text).width, pw = tw + size * 1.2, ph = size * 1.55;
      const left = o.align === 'center' ? x - pw / 2 : o.align === 'right' ? x - pw + size * 0.6 : x - size * 0.6;
      const top = y - size * 1.08, e = K.ease.out(K.clamp(p * 1.6)), sw = K.spring(p * 1.2, 0.35, 0.09, 1.6, 4);
      ctx.globalAlpha = K.clamp(p * 3);
      ctx.translate(left + pw / 2, top - (1 - e) * 40 * s); ctx.rotate(sw);
      // cord
      ctx.strokeStyle = 'rgba(200,196,188,0.6)'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(-pw * 0.3, 0); ctx.lineTo(0, -ph * 0.45); ctx.lineTo(pw * 0.3, 0); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-pw / 2 + 5 * s, 6 * s, pw, ph);
      const g = ctx.createLinearGradient(0, 0, 0, ph); g.addColorStop(0, '#1d1d1f'); g.addColorStop(1, '#0c0c0d');
      ctx.fillStyle = g; ctx.fillRect(-pw / 2, 0, pw, ph);
      ctx.strokeStyle = 'rgba(230,226,216,0.8)'; ctx.lineWidth = 2 * s; ctx.strokeRect(-pw / 2 + 4 * s, 4 * s, pw - 8 * s, ph - 8 * s);
      ctx.fillStyle = '#ece8de'; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, -tw / 2, size * 1.08);
      ctx.restore();
      return { w: pw, h: ph };
    },

    // Newsreel arrow: a fat white shaft with a big solid head and a hard drop shadow.
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const [W, H] = cw(ctx), s = S(W, H), lw = (o.width || 7) * s;
      const pts = K.arcPts(from, to, o.bend ?? 0.12, 40), sp = K.clamp(p / 0.85), q = K.trim(pts, sp);
      ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      for (const [dx, col] of [[4 * s, 'rgba(0,0,0,0.65)'], [0, o.color || C.white]]) {
        ctx.save(); ctx.translate(dx, dx); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = lw;
        K.poly(ctx, q.length > 2 && p > 0.85 ? q.slice(0, -2) : q); ctx.stroke();
        if (p > 0.85) {
          const hs = (16 + 18 * K.ease.back(K.clamp((p - 0.85) / 0.15))) * s, b = pts[pts.length - 1], a = pts[pts.length - 6], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
          ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang - 0.42) * hs, b[1] - Math.sin(ang - 0.42) * hs); ctx.lineTo(b[0] - Math.cos(ang + 0.42) * hs, b[1] - Math.sin(ang + 0.42) * hs); ctx.closePath(); ctx.fill();
        }
        ctx.restore();
      }
      ctx.restore();
      return q[q.length - 1];
    },

    // Deco intertitle frame: dark card, a double silver rule drawn on around it, optional lamp glow.
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H);
      ctx.save();
      if (o.glow) { const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.9); g.addColorStop(0, `rgba(255,255,250,${0.22 * p})`); g.addColorStop(1, 'rgba(255,255,250,0)'); ctx.fillStyle = g; ctx.fillRect(x - w, y - h * 2, w * 3, h * 5); }
      ctx.fillStyle = `rgba(8,8,9,${0.82 * K.clamp(p * 2)})`; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = o.color || C.silver; ctx.lineWidth = 2.5 * s;
      K.drawOn(ctx, K.rectPts(x, y, w, h), K.clamp(p * 1.4), { strokeStyle: o.color || C.silver, lineWidth: 2.5 * s, lineCap: 'square' });
      if (p > 0.5) K.drawOn(ctx, K.rectPts(x + 8 * s, y + 8 * s, w - 16 * s, h - 16 * s), K.clamp((p - 0.5) * 2), { strokeStyle: o.color || C.silver, lineWidth: 1.2 * s, lineCap: 'square' });
      // deco corner steps
      if (p > 0.8) { ctx.globalAlpha = K.clamp((p - 0.8) * 5); ctx.fillStyle = C.silver; for (const [cx, cy] of [[x, y], [x + w, y], [x, y + h], [x + w, y + h]]) ctx.fillRect(cx - 5 * s, cy - 5 * s, 10 * s, 10 * s); }
      ctx.restore();
    },

    // Mechanical odometer: each drum rolls, upper drums only turn as the lower ones carry over.
    counter(ctx, value, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 110) * s, digits = o.digits || 7;
      const cwid = size * 0.66, chgt = size * 1.05, gap = size * 0.07, comma = size * 0.2;
      const groups = Math.floor((digits - 1) / 3), total = digits * cwid + (digits - 1) * gap + groups * comma;
      let cx = (o.align === 'left' ? x : o.align === 'right' ? x - total : x - total / 2) + total;
      const top = y - chgt * 0.78, v = Math.max(0, value);
      ctx.save(); ctx.globalAlpha = K.clamp(p * 3);
      // housing
      ctx.fillStyle = '#121213'; ctx.fillRect(cx - total - 16 * s, top - 14 * s, total + 32 * s, chgt + 28 * s);
      ctx.strokeStyle = 'rgba(220,216,206,0.6)'; ctx.lineWidth = 2 * s; ctx.strokeRect(cx - total - 16 * s, top - 14 * s, total + 32 * s, chgt + 28 * s);
      ctx.font = K.font(size * 0.82, NF, 700); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      for (let i = 0; i < digits; i++) {
        if (i && i % 3 === 0) { cx -= comma; ctx.fillStyle = C.white; ctx.fillText(',', cx + comma / 2, top + chgt * 0.86); }
        const x0 = cx - cwid; cx -= cwid + gap;
        const unit = Math.pow(10, i), base = Math.floor(v / unit) % 10;
        const frac = i === 0 ? 0 : K.smooth(0.9, 1, (v % unit) / unit);
        const g = ctx.createLinearGradient(0, top, 0, top + chgt); g.addColorStop(0, '#050505'); g.addColorStop(0.5, '#2a2a2a'); g.addColorStop(1, '#050505');
        ctx.fillStyle = g; ctx.fillRect(x0, top, cwid, chgt);
        ctx.save(); ctx.beginPath(); ctx.rect(x0, top, cwid, chgt); ctx.clip(); ctx.fillStyle = C.white;
        ctx.fillText(String(base), x0 + cwid / 2, top + chgt / 2 - frac * chgt);
        ctx.fillText(String((base + 1) % 10), x0 + cwid / 2, top + chgt / 2 + (1 - frac) * chgt);
        const sh = ctx.createLinearGradient(0, top, 0, top + chgt); sh.addColorStop(0, 'rgba(0,0,0,0.75)'); sh.addColorStop(0.3, 'rgba(0,0,0,0)'); sh.addColorStop(0.7, 'rgba(0,0,0,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.75)');
        ctx.fillStyle = sh; ctx.fillRect(x0, top, cwid, chgt); ctx.restore();
      }
      ctx.restore();
      return { w: total, h: chgt };
    },

    // Rubber stamp slammed down: oversize and blurred in the air, hard impact, speckled ink.
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), text = o.text || 'CASE CLOSED';
      const bw = r * 1.9, bh = r * 0.62, key = `${ID}:stamp:${Math.round(bw)}x${Math.round(bh)}:${text}`;
      const plate = K.cached(key, () => {
        const c = K.layer(bw + 20, bh + 20), x2 = c.getContext('2d'); x2.translate(10, 10);
        x2.strokeStyle = '#efece4'; x2.lineWidth = bh * 0.07; x2.strokeRect(0, 0, bw, bh); x2.lineWidth = bh * 0.025; x2.strokeRect(bh * 0.1, bh * 0.1, bw - bh * 0.2, bh - bh * 0.2);
        x2.fillStyle = '#efece4'; x2.textAlign = 'center'; x2.textBaseline = 'middle';
        x2.font = K.font(K.fitSize(x2, text, NF, 700, bh * 0.56, bw * 0.84), NF, 700); x2.fillText(text, bw / 2, bh * 0.54);
        // ink starvation speckle
        const r2 = K.rng(91); x2.globalCompositeOperation = 'destination-out';
        for (let i = 0; i < 900; i++) { x2.globalAlpha = r2() * 0.9; x2.beginPath(); x2.arc(r2() * bw, r2() * bh, r2() * bh * 0.02 + 0.5, 0, 7); x2.fill(); }
        return c;
      });
      const k = K.clamp(p / 0.28), sc = k < 1 ? K.lerp(1.9, 1, K.ease.in(k)) : 1 + K.spring(p, 0.28, 0.04, 3, 9);
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.16); ctx.scale(sc, sc);
      ctx.globalAlpha = k < 1 ? 0.35 * k : 0.92;
      ctx.drawImage(plate, -bw / 2 - 10, -bh / 2 - 10);
      ctx.restore();
    },

    // Iris out to black, then iris in on the next scene.
    transition(ctx, W, H, p, o = {}) {
      const R = Math.hypot(W, H) * 0.6, cx = o.x ?? W / 2, cy = o.y ?? H / 2;
      const r = p < 0.5 ? R * (1 - K.ease.inOut(p * 2)) : R * K.ease.inOut((p - 0.5) * 2);
      ctx.save(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.arc(cx, cy, Math.max(0.1, r), 0, Math.PI * 2, true); ctx.fill('evenodd');
      // soft iris edge
      const g = ctx.createRadialGradient(cx, cy, Math.max(0, r - 30), cx, cy, Math.max(1, r)); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.9)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, Math.max(1, r), 0, 7); ctx.fill();
      ctx.restore();
    },
  };

  // ---------- the shared demo: a case board in a dark office ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 108 * s], video: [86 * s, 268 * s, 280 * s, 200 * s], node: [486 * s, 296 * s, 300 * s, 150 * s],
      chips: PLATFORMS.map((n, i) => [950 * s, (206 + i * 72) * s]), node2: [W * 0.5 - 150 * s, 150 * s], counter: [W * 0.42, 418 * s], det: [W * 0.84, H * 1.0, H * 0.92] };
    return { s, P: true, title: [W / 2, H * 0.105], video: [W * 0.28, H * 0.14, W * 0.44, H * 0.11], node: [W * 0.18, H * 0.38, W * 0.64, H * 0.08],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.57 + Math.floor(i / 2) * 0.075)]), node2: [W * 0.18, H * 0.15], counter: [W * 0.5, H * 0.38], det: [W * 0.8, H * 1.0, H * 0.3] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const [nx, ny, nw, nh] = Lo.node;
      if (t < 8.25) {
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.4, 'lin'), { size: P ? 48 : 62, align: 'center', rule: true, maxW: W * 0.88 });
        const [vx, vy, vw, vh] = Lo.video;
        terminal(ctx, vx, vy, vw, vh, K.beat(t, 1.9, 1.0, 'lin'), t, s);
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 56 * s, K.beat(t, 2.7, 0.6, 'lin'), { align: 'center' });
        const a1 = P ? [[vx + vw / 2, vy + vh + 82 * s], [nx + nw / 2, ny - 14 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - 18 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.8, 'out'), { bend: P ? 0.05 : -0.12 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.9, 'lin'), { glow: true });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 18 * s, K.beat(t, 4.5, 0.5, 'lin'), { size: P ? 46 : 50, align: 'center' });
        if (P) style.arrow(ctx, [W / 2, ny + nh + 12 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.95, 0.5, 'lin'), { bend: 0, width: 6 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 14 * s] : [nx + nw + 14 * s, ny + nh / 2];
          const to = P ? [left ? W * 0.462 : W * 0.538, cy - 14 * s] : [cx - 22 * s, cy - 14 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'out'), { bend: P ? 0 : (i - 3) * 0.03, width: P ? 5 : 4.5 });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.28, 0.5, 'lin'), { size: P ? 32 : 30, align: P ? (left ? 'right' : 'left') : 'left' });
        });
      } else {
        // the detective studies the take; the node hangs on the board above
        const [x2, y2] = Lo.node2, nw2 = P ? nw : 300 * s, nh2 = P ? nh : 120 * s;
        detective(ctx, Lo.det[0], Lo.det[1], Lo.det[2], K.beat(t, 8.3, 0.6, 'lin'), W, H, t);
        style.box(ctx, x2, y2, nw2, nh2, 1, { glow: true });
        style.title(ctx, 'Creator OS', x2 + nw2 / 2, y2 + nh2 / 2 + 18 * s, 1, { size: P ? 46 : 50, align: 'center' });
        const [cx, cy] = Lo.counter, v = K.count(t, 8.6, 1.4, 0, 1000000);
        const sh = K.spring(t, 10.05, 6 * s, 9, 7);
        ctx.save(); ctx.translate(0, sh);
        style.counter(ctx, v, cx, cy, K.beat(t, 8.35, 0.3, 'lin'), { size: P ? 84 : 104 });
        style.label(ctx, 'views', cx, cy + (P ? 120 : 130) * s, K.beat(t, 8.8, 0.5, 'lin'), { align: 'center', size: P ? 34 : 32 });
        style.emphasis(ctx, cx + (P ? 170 : 240) * s, cy + (P ? 175 : 104) * s, (P ? 110 : 120) * s, K.beat(t, 9.75, 1.0, 'lin'), {});
        ctx.restore();
        style.title(ctx, 'Post once. Reach everywhere.', W / 2, P ? H * 0.66 : 656 * s, K.beat(t, 10.5, 0.9, 'lin'), { size: P ? 50 : 52, align: 'center', maxW: W * 0.86 });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      style.finish(ctx, W, H, t);
    },
  };
  style.demo.score = function (k) {
    k.bed('vinyl', 0, 12, 1.2); k.bed('hum', 0, 12, 0.5);
    k.play('swell', 0.15, { chord: ['A3', 'C4', 'E4'], dur: 2, gain: 0.9 });
    k.play('glitch', 2.35, { gain: 0.5 }); k.play('blip', 2.4, { note: 'A5', dur: 0.25, gain: 0.6 });
    k.play('thud', 2.75, { gain: 0.6 }); k.play('paper', 2.75, { dur: 0.2 });
    k.play('whoosh', 3.3, { dur: 0.7, gain: 0.8 });
    k.play('type', 4.0, { dur: 0.9, gain: 0.7 }); k.play('pluck', 4.6, { note: 'E4', gain: 0.8 });
    for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.25, gain: 0.45 }); k.play('thud', 5.3 + i * 0.4, { gain: 0.55 }); k.play('paper', 5.3 + i * 0.4, { dur: 0.12, gain: 0.7 }); }
    k.play('whoosh', 7.6, { dur: 0.65, up: false }); k.play('whoosh', 8.25, { dur: 0.65 });
    k.play('count', 8.6, { dur: 1.4 });
    k.play('stamp', 10.03, { gain: 1.2 }); k.play('thud', 10.03, { gain: 0.8 });
    k.play('swell', 10.5, { chord: ['F3', 'A3', 'C4', 'E4'], dur: 1.4 }); k.play('chime', 11.3, { note: 'A4', gain: 0.8 });
  };
  MS.register(style);
})();
