// Radiograph on Lightbox (Light & Imaging). Blue-base film clipped to a fluorescent viewer: subjects are additive
// translucent density (hollow shells, dense screws and pins, soft plastics), the film has collimation borders, a lead
// marker and an ID flash block, a radiologist works it in yellow grease pencil, headers sit on masking tape, and the
// viewer's tubes stutter on while the film develops top-down. Scene changes pull the film down and slap a new one up.
(function () {
  const ID = 'x-ray';
  const C = { box: '#e9eef2', film: '#07111c', exposed: '#03070d', border: '#3c5163', bone: '#cfe9ff', grease: '#f4d23c', tape: '#e8dcb8', ink: '#1d1b18' };
  const TF = 'Permanent Marker', GF = 'Caveat', MF = 'Courier Prime';
  const S = (W, H) => K.layout(W, H).s;
  const cw = (ctx) => [ctx.canvas.width, ctx.canvas.height];
  const filmRect = (W, H) => { const s = S(W, H), m = (H > W ? 26 : 34) * s; return [m, m + 18 * s, W - m * 2, H - m * 2 - 18 * s]; };
  const collim = (W, H) => { const [x, y, w, h] = filmRect(W, H), s = S(W, H), b = 26 * s; return [x + b, y + b + 14 * s, w - b * 2, h - b * 2 - 14 * s]; };

  function bloom(ctx, W, H, f, radius, th, amount) {
    const w = Math.ceil(W / f), h = Math.ceil(H / f);
    const a = K.cached(`${ID}:bla:${w}x${h}`, () => K.layer(w, h)), b = K.cached(`${ID}:blb:${w}x${h}`, () => K.layer(w, h));
    const ax = a.getContext('2d', { willReadFrequently: true }); ax.globalCompositeOperation = 'copy'; ax.drawImage(ctx.canvas, 0, 0, w, h);
    const img = ax.getImageData(0, 0, w, h), d = img.data, t0 = th * 255, k = 255 / (255 - t0);
    for (let i = 0; i < d.length; i += 4) { d[i] = Math.max(0, d[i] - t0) * k; d[i + 1] = Math.max(0, d[i + 1] - t0) * k; d[i + 2] = Math.max(0, d[i + 2] - t0) * k; }
    ax.putImageData(img, 0, 0);
    const bx = b.getContext('2d'); bx.globalCompositeOperation = 'copy'; bx.filter = `blur(${radius}px)`; bx.drawImage(a, 0, 0); bx.filter = 'none';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amount; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
  }

  // ---------- plates ----------
  // The viewer: diffuse white glass with faint tube banding, a steel bezel.
  function boxPlate(W, H) {
    return K.cached(`${ID}:box:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), portrait = H > W;
      x.fillStyle = '#d9e0e6'; x.fillRect(0, 0, W, H);
      const n = portrait ? 3 : 4;
      for (let i = 0; i < n; i++) {
        const cx = portrait ? W * (i + 0.5) / n : W / 2, cy = portrait ? H / 2 : H * (i + 0.5) / n;
        const g = portrait ? x.createLinearGradient(cx - W / n, 0, cx + W / n, 0) : x.createLinearGradient(0, cy - H / n, 0, cy + H / n);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.65)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
      }
      // bezel
      x.strokeStyle = '#8a949c'; x.lineWidth = 14 * s; x.strokeRect(0, 0, W, H);
      x.strokeStyle = 'rgba(0,0,0,0.25)'; x.lineWidth = 2 * s; x.strokeRect(7 * s, 7 * s, W - 14 * s, H - 14 * s);
      return c;
    });
  }
  // The film itself: blue base, collimation border, exposed field, lead marker, edge print, dust and scratches.
  function filmPlate(W, H, seed) {
    return K.cached(`${ID}:film:${W}x${H}:${seed}`, () => {
      const [fx, fy, fw, fh] = filmRect(W, H), [ex, ey, ew, eh] = collim(W, H), s = S(W, H);
      const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(seed), nz = K.noise(seed);
      x.fillStyle = '#4a6175'; x.fillRect(fx, fy, fw, fh);
      const g = x.createLinearGradient(fx, fy, fx + fw, fy + fh); g.addColorStop(0, 'rgba(120,150,175,0.25)'); g.addColorStop(1, 'rgba(10,20,30,0.25)'); x.fillStyle = g; x.fillRect(fx, fy, fw, fh);
      // exposed field: deep blue-black with soft scatter fog
      x.fillStyle = C.exposed; x.fillRect(ex, ey, ew, eh);
      const fg = x.createRadialGradient(ex + ew / 2, ey + eh / 2, 0, ex + ew / 2, ey + eh / 2, Math.max(ew, eh) * 0.7); fg.addColorStop(0, 'rgba(40,70,100,0.28)'); fg.addColorStop(1, 'rgba(40,70,100,0.05)');
      x.fillStyle = fg; x.fillRect(ex, ey, ew, eh);
      // penumbra at the collimator edge
      x.strokeStyle = 'rgba(70,95,120,0.6)'; x.lineWidth = 6 * s; x.filter = 'blur(3px)'; x.strokeRect(ex, ey, ew, eh); x.filter = 'none';
      // lead marker + edge print
      x.fillStyle = 'rgba(235,245,255,0.92)'; x.font = K.font(40 * s, 'Arial', 900); x.fillText('R', ex + 22 * s, ey + 56 * s);
      x.font = K.font(18 * s, 'Arial', 700); x.fillText('PA', ex + 56 * s, ey + 56 * s);
      x.fillStyle = 'rgba(15,25,35,0.75)'; x.font = K.font(14 * s, MF, 700);
      x.fillText(`SAFETY  ■  BLUE BASE  ■  35x43  ■  ${seed === 1 ? '0712' : '0713'}`, fx + 60 * s, fy + 22 * s);
      // dust (light: blocked by specks on the film) and fine scratches
      for (let i = 0; i < 220; i++) { x.fillStyle = r() < 0.7 ? `rgba(220,235,250,${0.15 + r() * 0.4})` : 'rgba(0,0,0,0.5)'; x.beginPath(); x.arc(fx + r() * fw, fy + r() * fh, (0.5 + r() * 1.4) * s, 0, 7); x.fill(); }
      x.strokeStyle = 'rgba(200,220,240,0.12)'; x.lineWidth = 0.8 * s;
      for (let i = 0; i < 14; i++) { const sx = fx + r() * fw, sy = fy + r() * fh, len = (60 + r() * 260) * s, a = r() * 0.6 - 0.3; x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + Math.cos(a) * len * 0.5, sy + Math.sin(a) * len * 0.5 + nz.n2(i, 1) * 20 * s, sx + Math.cos(a) * len, sy + Math.sin(a) * len); x.stroke(); }
      return c;
    });
  }
  function clips(ctx, W, H) {
    const s = S(W, H), [fx, fy, fw] = filmRect(W, H);
    for (const cx of [fx + fw * 0.2, fx + fw * 0.8]) {
      const g = ctx.createLinearGradient(0, fy - 22 * s, 0, fy + 22 * s); g.addColorStop(0, '#c9d0d6'); g.addColorStop(0.5, '#8d979f'); g.addColorStop(1, '#5d666d');
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(cx - 40 * s + 3 * s, fy - 20 * s + 4 * s, 80 * s, 40 * s);
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(cx - 40 * s, fy - 20 * s, 80 * s, 40 * s, 8 * s); ctx.fill();
      ctx.fillStyle = '#3b4248'; ctx.beginPath(); ctx.arc(cx, fy - 2 * s, 7 * s, 0, 7); ctx.fill(); ctx.fillStyle = '#d6dde2'; ctx.beginPath(); ctx.arc(cx - 2 * s, fy - 4 * s, 2.5 * s, 0, 7); ctx.fill();
    }
  }

  // ---------- radiographic density ----------
  // Everything on the film adds light: a shell edge is brighter than its interior, metal is near-white.
  function dens(ctx, a) { ctx.globalCompositeOperation = 'lighter'; ctx.shadowColor = `rgba(190,225,255,${Math.min(1, a * 1.5)})`; }
  function shell(ctx, path, a, s, lw = 3) {
    dens(ctx, a); ctx.shadowBlur = 6 * s;
    path(); ctx.fillStyle = `rgba(120,170,215,${a * 0.1})`; ctx.fill();
    path(); ctx.strokeStyle = `rgba(200,232,255,${a * 0.5})`; ctx.lineWidth = lw * s; ctx.stroke();
    ctx.shadowBlur = 0;
  }
  function screw(ctx, x, y, r, a, s) {
    dens(ctx, a); ctx.shadowBlur = 6 * s; ctx.fillStyle = `rgba(225,242,255,${0.85 * a})`; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over'; ctx.strokeStyle = `rgba(20,40,60,${0.6 * a})`; ctx.lineWidth = r * 0.3; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y); ctx.lineTo(x + r * 0.6, y); ctx.moveTo(x, y - r * 0.6); ctx.lineTo(x, y + r * 0.6); ctx.stroke();
  }
  // A phone carrying the video, seen through: shell, glass, battery cell, board, screws, lens ring, the play glyph.
  function phoneXR(ctx, x, y, w, h, a, s) {
    if (a <= 0) return;
    ctx.save();
    shell(ctx, () => { ctx.beginPath(); ctx.roundRect(x, y, w, h, w * 0.16); }, a, s, 4);
    shell(ctx, () => { ctx.beginPath(); ctx.roundRect(x + w * 0.07, y + h * 0.05, w * 0.86, h * 0.9, w * 0.1); }, a * 0.35, s, 1.5);
    shell(ctx, () => { ctx.beginPath(); ctx.roundRect(x + w * 0.16, y + h * 0.42, w * 0.68, h * 0.44, 6 * s); }, a * 0.8, s, 2.5);
    dens(ctx, a); ctx.fillStyle = `rgba(180,215,245,${0.18 * a})`; for (let i = 0; i < 4; i++) ctx.fillRect(x + w * 0.2, y + h * (0.47 + i * 0.09), w * 0.6, 2 * s);
    // logic board + chips
    shell(ctx, () => { ctx.beginPath(); ctx.rect(x + w * 0.14, y + h * 0.1, w * 0.72, h * 0.27); }, a * 0.55, s, 1.5);
    dens(ctx, a); ctx.fillStyle = `rgba(210,235,255,${0.3 * a})`; ctx.fillRect(x + w * 0.22, y + h * 0.15, w * 0.22, h * 0.1); ctx.fillRect(x + w * 0.52, y + h * 0.14, w * 0.14, h * 0.07); ctx.fillRect(x + w * 0.52, y + h * 0.24, w * 0.24, h * 0.06);
    // lens ring
    ctx.strokeStyle = `rgba(225,245,255,${0.8 * a})`; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(x + w * 0.76, y + h * 0.08, w * 0.06, 0, 7); ctx.stroke();
    // the play glyph, denser ink in the screen
    const cx = x + w / 2, cy = y + h * 0.64, r = w * 0.17;
    shell(ctx, () => { ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx - r * 0.6, cy + r); ctx.closePath(); }, a * 1.6, s, 3);
    for (const [px, py] of [[0.12, 0.04], [0.88, 0.04], [0.12, 0.96], [0.88, 0.96]]) screw(ctx, x + w * px, y + h * py, 5 * s, a, s);
    ctx.restore();
  }
  // The hub: a gear train on pivot pins with a spring and a controller chip.
  function hubXR(ctx, cx, cy, R, a, s, t) {
    if (a <= 0) return;
    ctx.save();
    const gear = (gx, gy, r, n, rot) => {
      shell(ctx, () => { ctx.beginPath(); for (let i = 0; i <= n * 2; i++) { const ang = rot + (i / (n * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 0.84; i ? ctx.lineTo(gx + Math.cos(ang) * rr, gy + Math.sin(ang) * rr) : ctx.moveTo(gx + Math.cos(ang) * rr, gy + Math.sin(ang) * rr); } ctx.closePath(); }, a, s, 2.5);
      shell(ctx, () => { ctx.beginPath(); ctx.arc(gx, gy, r * 0.45, 0, 7); }, a * 0.7, s, 2);
      screw(ctx, gx, gy, Math.max(5 * s, r * 0.13), a, s);
    };
    gear(cx - R * 0.42, cy, R * 0.55, 12, t * 0.4);
    gear(cx + R * 0.48, cy - R * 0.1, R * 0.42, 9, -t * 0.53);
    shell(ctx, () => { ctx.beginPath(); ctx.rect(cx - R * 0.15, cy + R * 0.42, R * 0.6, R * 0.32); }, a * 1.2, s, 2);
    dens(ctx, a); ctx.strokeStyle = `rgba(210,238,255,${0.6 * a})`; ctx.lineWidth = 2 * s; ctx.beginPath();
    for (let i = 0; i <= 12; i++) { const px = cx - R * 1.05 + (i / 12) * R * 0.5, py = cy + R * 0.55 + (i % 2 ? -1 : 1) * R * 0.08; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); } ctx.stroke();
    ctx.restore();
  }

  // grease pencil: waxy yellow, several thin streaky passes
  function grease(ctx, pts, p, s, o = {}) {
    const q = K.trim(K.wobble(pts, 1.5 * s, o.seed || 3, 0.05), p); if (q.length < 2) return null;
    const col = o.color || C.grease, w = (o.w || 4.5) * s;
    ctx.save(); ctx.globalCompositeOperation = 'source-over'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const [dx, dy, al, lw] of [[0, 0, 0.9, 1], [w * 0.25, -w * 0.15, 0.55, 0.55], [-w * 0.2, w * 0.2, 0.45, 0.45]]) {
      ctx.strokeStyle = K.rgba(col, al); ctx.lineWidth = w * lw; ctx.beginPath(); q.forEach((pt, i) => (i ? ctx.lineTo(pt[0] + dx, pt[1] + dy) : ctx.moveTo(pt[0] + dx, pt[1] + dy))); ctx.stroke();
    }
    ctx.restore();
    return q[q.length - 1];
  }

  const style = {
    id: ID, name: 'Radiograph on Lightbox', family: 'Light & Imaging',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Caveat:wght@700&family=Courier+Prime:wght@700&display=block',
      specs: ['400 52px "Permanent Marker"', '700 40px "Caveat"', '700 64px "Courier Prime"'] }],
    palette: { bg: C.box, ...C },
    sfx: { draw: 'pencil', land: 'paper', emphasis: 'pop', transition: 'whoosh', bed: 'hum' },
    setup(W, H) { boxPlate(W, H); filmPlate(W, H, 1); filmPlate(W, H, 2); },

    background(ctx, W, H, t, o = {}) {
      ctx.drawImage(boxPlate(W, H), 0, 0);
      ctx.drawImage(filmPlate(W, H, o.film || 1), 0, 0);
    },

    finish(ctx, W, H, t) {
      const s = S(W, H);
      // slow push-in on the viewer
      const z = 1 + 0.025 * K.ease.inOut(K.clamp(t / 12));
      const tmp = K.cached(`${ID}:tmp:${W}x${H}`, () => K.layer(W, H)), tx = tmp.getContext('2d');
      tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'copy'; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.drawImage(tmp, -W / 2, -H / 2); ctx.restore();
      // the light through the film halates at the edges
      bloom(ctx, W, H, 4, 4, 0.72, 0.45);
      // glass reflection sheen
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0.3, 'rgba(255,255,255,0)'); g.addColorStop(0.42, 'rgba(255,255,255,0.05)'); g.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // fluorescent stutter as the viewer switches on
      if (t < 0.9) { const on = t < 0.12 ? 0.85 : (K.rng(Math.floor(t * 20) + 3)() < t ? 0 : 0.55); ctx.fillStyle = `rgba(5,8,12,${on})`; ctx.fillRect(0, 0, W, H); }
      K.vignette(ctx, W, H, 0.35, '#0a1118');
      K.grain(ctx, W, H, t, 0.05, 24, 'overlay');
    },

    // Masking tape header: the tape tears on, then the words are written in marker.
    title(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return { w: 0, h: 0 };
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 52) * s;
      ctx.save(); ctx.font = K.font(size, TF, 400);
      let lines = [text]; if (o.maxW && ctx.measureText(text).width > o.maxW) lines = K.wrap(ctx, text, o.maxW);
      const lh = size * 1.25, tw = Math.max(...lines.map((l) => ctx.measureText(l).width)), padX = size * 0.5, th = lh * lines.length + size * 0.35;
      const bx = (o.align === 'left' ? x : o.align === 'right' ? x - tw : x - tw / 2) - padX, by = y - size * 0.95 - (lines.length - 1) * lh, bw = tw + padX * 2;
      const tp = K.ease.out(K.clamp(p / 0.4)), r = K.rng(o.seed || 5);
      ctx.translate(bx + bw / 2, by + th / 2); ctx.rotate(o.rot ?? -0.012); ctx.translate(-(bx + bw / 2), -(by + th / 2));
      // tape with torn ends
      ctx.beginPath(); ctx.moveTo(bx, by);
      const right = bx + bw * tp;
      ctx.lineTo(right, by); for (let i = 0; i <= 8; i++) ctx.lineTo(right + (r() - 0.5) * 8 * s, by + (th * i) / 8);
      ctx.lineTo(bx, by + th); for (let i = 8; i >= 0; i--) ctx.lineTo(bx + (r() - 0.5) * 8 * s, by + (th * i) / 8);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.save(); ctx.translate(3 * s, 4 * s); ctx.fill(); ctx.restore();
      ctx.fillStyle = 'rgba(232,220,184,0.93)'; ctx.fill();
      ctx.save(); ctx.clip(); ctx.strokeStyle = 'rgba(160,140,100,0.15)'; ctx.lineWidth = 1 * s; for (let i = 0; i < 40; i++) { const lx = bx + r() * bw; ctx.beginPath(); ctx.moveTo(lx, by); ctx.lineTo(lx + 6 * s, by + th); ctx.stroke(); } ctx.restore();
      // marker words
      const wp = K.clamp((p - 0.35) / 0.65);
      if (wp > 0) {
        const total = lines.reduce((a, l) => a + l.length, 0); let used = 0;
        ctx.fillStyle = o.color || C.ink; ctx.textBaseline = 'alphabetic';
        lines.forEach((ln, i) => { const n = K.clamp(Math.round(wp * total) - used, 0, ln.length); used += ln.length; const lw = ctx.measureText(ln).width, lx = o.align === 'left' ? x : o.align === 'right' ? x - lw : x - lw / 2; ctx.fillText(ln.slice(0, n), lx, y - (lines.length - 1 - i) * lh); });
      }
      ctx.restore();
      return { w: bw, h: th };
    },

    // Grease pencil handwriting on the glass.
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return { w: 0, h: 0 };
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 40) * s;
      ctx.save(); ctx.font = K.font(size, GF, 700); ctx.textBaseline = 'alphabetic';
      const tw = ctx.measureText(text).width, x0 = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
      ctx.beginPath(); ctx.rect(x0 - 10 * s, y - size, (tw + 10 * s) * K.clamp(p) + (p >= 1 ? size * 0.4 : 0), size * 1.5); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillText(text, x0 + 2 * s, y + 2 * s);
      ctx.fillStyle = K.rgba(o.color || C.grease, 0.95); ctx.fillText(text, x0, y);
      ctx.fillStyle = 'rgba(255,250,210,0.35)'; ctx.fillText(text, x0 - 0.8 * s, y - 0.8 * s);
      ctx.restore();
      return { w: tw, h: size };
    },

    arrow(ctx, from, to, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H);
      const pts = K.arcPts(from, to, o.bend ?? 0.15, 40), end = grease(ctx, pts, K.clamp(p / 0.8), s, { seed: o.seed || 3, color: o.color, w: o.w });
      if (p > 0.8) {
        const hp = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 18 * s;
        grease(ctx, [[b[0] - Math.cos(ang - 0.5) * L, b[1] - Math.sin(ang - 0.5) * L], b, [b[0] - Math.cos(ang + 0.5) * L, b[1] - Math.sin(ang + 0.5) * L]], hp, s, { seed: (o.seed || 3) + 1, color: o.color, w: o.w });
      }
      return end;
    },

    // Grease-pencil frame drawn around a region of the film.
    box(ctx, x, y, w, h, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H);
      grease(ctx, [...K.rectPts(x, y, w, h), [x + w * 0.12, y - 3 * s]], p, s, { seed: o.seed || 5, color: o.color });
    },

    // The ID flasher types the number into the white flash block.
    counter(ctx, value, x, y, p, o = {}) {
      if (p <= 0) return { w: 0, h: 0 };
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 100) * s, text = K.fmt(Math.round(value));
      ctx.save(); ctx.font = K.font(size, MF, 700);
      const tw = ctx.measureText('0,000,000').width, bw = tw + size * 0.7, bh = size * 1.75, bx = x - bw / 2, by = y - size * 1.12;
      const flash = K.clamp(1 - p * 3);
      ctx.fillStyle = `rgba(238,240,232,${0.95})`; ctx.fillRect(bx, by, bw, bh);
      ctx.strokeStyle = 'rgba(30,40,50,0.5)'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(bx + 6 * s, by + 6 * s, bw - 12 * s, bh - 12 * s);
      ctx.fillStyle = 'rgba(30,35,40,0.7)'; ctx.font = K.font(18 * s, MF, 700); ctx.fillText('CREATOR OS LAB   RADIOLOGY   VIEWS', bx + 16 * s, by + 28 * s);
      ctx.font = K.font(size, MF, 700); ctx.fillStyle = '#15191d'; ctx.textAlign = 'center'; ctx.fillText(text, x, y + size * 0.35);
      if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${flash})`; ctx.fillRect(bx, by, bw, bh); }
      ctx.restore();
      return { w: bw, h: bh };
    },

    // Grease-pencil loop scrawled around the finding, with a tick of conviction.
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), rx = r * (o.wide ?? 1.3), ry = r * (o.tall ?? 0.6);
      const pts = K.circlePts(x, y, rx, ry, 80, -2.5, Math.PI * 2.15);
      grease(ctx, pts, K.clamp(p / 0.75), s, { seed: o.seed || 13, w: 5.5 });
      if (p > 0.75) { const e = pts[pts.length - 1], k = K.clamp((p - 0.75) / 0.25); grease(ctx, [[e[0] + 10 * s, e[1] - 30 * s], [e[0] + 24 * s, e[1] - 6 * s], [e[0] + 60 * s, e[1] - 60 * s]], k, s, { seed: 99, w: 5.5 }); }
    },

    // Pull the film down out of the clips, then slap the next one up (p 0.5 = bare lightbox).
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), [fx, fy, fw, fh] = filmRect(W, H);
      const tmp = K.cached(`${ID}:tr:${W}x${H}`, () => K.layer(W, H)), tx = tmp.getContext('2d');
      tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, 0, 0);
      const dy = p < 0.5 ? K.ease.in(p * 2) * H * 1.05 : -(1 - K.ease.back(K.clamp((p - 0.5) * 2))) * H * 1.05;
      ctx.save();
      ctx.drawImage(boxPlate(W, H), 0, 0);
      ctx.beginPath(); ctx.rect(fx - 4 * s, fy - 4 * s, fw + 8 * s, fh + 8 * s); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(fx + 6 * s, fy + dy + 8 * s, fw, fh);
      ctx.drawImage(tmp, 0, 0, W, H, 0, dy, W, H);
      ctx.restore();
      clips(ctx, W, H);
    },
  };

  // ---------- the shared demo: a radiologist reading two films ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 128 * s], phone: [150 * s, 196 * s, 150 * s, 270 * s], hub: [640 * s, 392 * s, 130 * s], tag: [640 * s, 262 * s],
      chips: PLATFORMS.map((n, i) => [946 * s, (206 + i * 62) * s]), hub2: [W * 0.84, 290 * s, 110 * s], tag2: [W * 0.84, 210 * s], counter: [W * 0.42, 352 * s], take: [W / 2, 616 * s] };
    return { s, P: true, title: [W / 2, H * 0.115], phone: [W * 0.39, H * 0.165, W * 0.22, H * 0.15], hub: [W / 2, H * 0.53, W * 0.16], tag: [W / 2, H * 0.445],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.65 + Math.floor(i / 2) * 0.07)]), hub2: [W / 2, H * 0.29, W * 0.15], tag2: [W / 2, H * 0.215], counter: [W / 2, H * 0.5], take: [W / 2, H * 0.79] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      const second = t >= 8.25;
      style.background(ctx, W, H, t, { film: second ? 2 : 1 });
      const [ex, ey, ew, eh] = collim(W, H);
      if (!second) {
        const [px, py, pw, ph] = Lo.phone, [hx, hy, hr] = Lo.hub;
        // the film develops top-down from milky fog
        phoneXR(ctx, px, py, pw, ph, 1, s);
        hubXR(ctx, hx, hy, hr, 1, s, t);
        const dev = K.clamp((t - 0.2) / 1.6);
        if (dev < 1) { ctx.save(); ctx.globalCompositeOperation = 'screen'; const yy = ey + eh * dev * 1.3 - eh * 0.3, g = ctx.createLinearGradient(0, yy, 0, yy + eh * 0.3); g.addColorStop(0, 'rgba(150,170,185,0)'); g.addColorStop(1, 'rgba(150,170,185,0.85)'); ctx.fillStyle = g; ctx.fillRect(ex, yy, ew, ey + eh - yy); ctx.restore(); }
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.5, 1.4, 'lin'), { size: P ? 48 : 52, maxW: W * 0.8 });
        style.box(ctx, px - 16 * s, py - 16 * s, pw + 32 * s, ph + 32 * s, K.beat(t, 2.0, 0.8, 'lin'), { seed: 21 });
        style.label(ctx, 'your video', px + pw / 2, py + ph + 70 * s, K.beat(t, 2.7, 0.6, 'lin'), { align: 'center', size: 44 });
        const a1 = P ? [[px + pw / 2, py + ph + 96 * s], [hx, Lo.tag[1] - 50 * s]] : [[px + pw + 26 * s, py + ph / 2], [hx - hr * 1.3, hy - 10 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: P ? 0.05 : -0.12, seed: 31 });
        style.title(ctx, 'Creator OS', Lo.tag[0], Lo.tag[1], K.beat(t, 4.0, 0.9, 'lin'), { size: P ? 44 : 44, rot: 0.03, seed: 9 });
        if (P) style.arrow(ctx, [W / 2, hy + hr * 1.0], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0.02, seed: 49 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.36, [lx, ly] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, ly - 14 * s] : [hx + hr * 1.15, hy];
          const to = P ? [left ? W * 0.42 : W * 0.58, ly - 14 * s] : [lx - 18 * s, ly - 12 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.3, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, seed: 50 + i, w: 3.6 });
          style.label(ctx, name, lx, ly, K.beat(t, t0 + 0.25, 0.35, 'lin'), { size: P ? 46 : 44, align: P ? (left ? 'right' : 'left') : 'left' });
        });
      } else {
        const [hx, hy, hr] = Lo.hub2;
        hubXR(ctx, hx, hy, hr, 1, s, t);
        style.title(ctx, 'Creator OS', Lo.tag2[0], Lo.tag2[1], 1, { size: 40, rot: 0.03, seed: 9 });
        const v = K.count(t, 8.6, 1.4, 0, 1000000), [cx, cy] = Lo.counter;
        style.counter(ctx, v, cx, cy, K.beat(t, 8.45, 0.3, 'lin'), { size: P ? 84 : 92 });
        style.label(ctx, 'views', cx, cy + (P ? 132 : 128) * s, K.beat(t, 8.9, 0.4, 'lin'), { align: 'center', size: 48 });
        style.emphasis(ctx, cx, cy + 10 * s, (P ? 300 : 300) * s, K.beat(t, 10.0, 0.6, 'lin'), { tall: P ? 0.52 : 0.5, wide: P ? 1.1 : 1.3 });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.8, 'lin'), { size: P ? 46 : 50, maxW: W * 0.8, rot: -0.02 });
      }
      if (!(t > 7.6 && t < 8.9)) clips(ctx, W, H);
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 1.4); k.bed('room', 0, 12, 0.8);
      k.play('click', 0.0, { pitch: 0.4 }); k.play('glitch', 0.15, { gain: 0.3 }); k.play('click', 0.45, { pitch: 0.4 }); k.play('glitch', 0.6, { gain: 0.25 });
      k.play('paper', 0.5, { dur: 0.45 }); k.play('scribble', 0.85, { medium: 'marker', dur: 1.0, gain: 0.8 });
      k.play('scribble', 2.0, { medium: 'pencil', dur: 0.8, gain: 1.6 }); k.play('scribble', 2.7, { medium: 'pencil', dur: 0.6, gain: 1.6 });
      k.play('scribble', 3.3, { medium: 'pencil', dur: 0.7, gain: 1.6 });
      k.play('paper', 4.0, { dur: 0.35 }); k.play('scribble', 4.3, { medium: 'marker', dur: 0.6, gain: 0.8 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.36, { medium: 'pencil', dur: 0.55, gain: 1.4 }); k.play('tick', 5.28 + i * 0.36, { pitch: 0.6, gain: 0.5 }); }
      k.play('paper', 7.6, { dur: 0.5, gain: 1.3 }); k.play('whoosh', 7.7, { dur: 0.5, up: false }); k.play('whoosh', 8.25, { dur: 0.35 }); k.play('thud', 8.6, { gain: 0.7 }); k.play('stamp', 8.6, { gain: 0.5 });
      k.play('type', 8.6, { dur: 1.4, gain: 0.8 }); k.play('count', 8.6, { dur: 1.4, gain: 0.6 });
      k.play('scribble', 10.0, { medium: 'pencil', dur: 0.6, gain: 1.8 }); k.play('pop', 10.45);
      k.play('paper', 10.5, { dur: 0.3 }); k.play('scribble', 10.8, { medium: 'marker', dur: 0.5, gain: 0.8 }); k.play('chime', 11.4, { note: 'E5' });
    },
  };
  MS.register(style);
})();
