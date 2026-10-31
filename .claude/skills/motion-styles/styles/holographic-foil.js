// Holographic Foil Card (Light & Imaging). Holo-rare trading cards and die-cut stickers on a dark desk: cracked-ice
// foil whose rainbow diffraction shifts with the card's tilt (each ice cell has its own facet angle), foil-embossed
// lettering with bevel and a specular glint sweeping through, printed ink sitting on top, glitter flecks and a rainbow
// spill on the desk. Cards are dealt in, stickers slap down with an overshoot, and scenes change with a card flip.
(function () {
  const ID = 'holographic-foil';
  const C = { desk: '#121116', ink: '#191428', cream: '#efe9dc', silver: '#c9ccd6', violet: '#8a6cff', pink: '#ff6fc3', cyan: '#5fe3ff', gold: '#ffd36b' };
  const TF = 'Russo One', BF = 'Inter';
  const S = (W, H) => K.layout(W, H).s;
  const cw = (ctx) => [ctx.canvas.width, ctx.canvas.height];

  function hsl(h, s, l) { const a = s * Math.min(l, 1 - l), f = (n) => { const k = (n + h / 30) % 12; return l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)); }; return [f(0) * 255, f(8) * 255, f(4) * 255]; }

  // ---------- cracked-ice foil: Voronoi facets, 12 diffraction phases ----------
  const N = 12, TS = 220;
  function foilTiles() {
    return K.cached(`${ID}:foil`, () => {
      const r = K.rng(808), n = 190, seeds = Array.from({ length: n }, () => [r() * TS, r() * TS]), ph = seeds.map(() => r()), lum = seeds.map(() => 0.36 + r() * 0.34), tiltc = seeds.map(() => r() * 2 - 1);
      const cell = new Uint8Array(TS * TS), edge = new Float32Array(TS * TS);
      for (let y = 0; y < TS; y++) for (let x = 0; x < TS; x++) {
        let d1 = 1e9, d2 = 1e9, c = 0;
        for (let i = 0; i < n; i++) { let dx = Math.abs(x - seeds[i][0]), dy = Math.abs(y - seeds[i][1]); dx = Math.min(dx, TS - dx); dy = Math.min(dy, TS - dy); const d = dx * dx + dy * dy; if (d < d1) { d2 = d1; d1 = d; c = i; } else if (d < d2) d2 = d; }
        cell[y * TS + x] = c; edge[y * TS + x] = Math.sqrt(d2) - Math.sqrt(d1);
      }
      const TAU = Math.PI * 2, tiles = [];
      for (let k = 0; k < N; k++) {
        const cv = K.layer(TS, TS), x = cv.getContext('2d'), img = x.createImageData(TS, TS), d = img.data;
        for (let i = 0; i < TS * TS; i++) {
          const c = cell[i], px = i % TS, py = (i / TS) | 0, e = edge[i];
          // diffraction band sweeps across the sheet (periodic, so tiles join seamlessly); each facet is offset by its own angle
          const band = (k / N) * 360 + 70 * Math.sin((TAU * px) / TS) + 70 * Math.cos((TAU * py) / TS) + tiltc[c] * 55;
          const hue = ((band % 360) + 360) % 360;
          const spec = Math.max(0, Math.cos(TAU * (k / N + ph[c]))) ** 6;           // facet catching the light
          let l = lum[c] + 0.3 * spec, sat = 0.62 + 0.3 * spec;
          if (e < 0.9) { l = c % 3 ? 0.93 : 0.42; sat = 0.15; }
          const [R, G, B] = hsl(hue, sat, Math.min(0.96, l)); d[i * 4] = R; d[i * 4 + 1] = G; d[i * 4 + 2] = B; d[i * 4 + 3] = 255;
        }
        x.putImageData(img, 0, 0); tiles.push(cv);
      }
      return tiles;
    });
  }
  // Paint foil into the current clip: two neighbouring phases cross-faded by tilt, then a specular glint band.
  function foil(ctx, x, y, w, h, phase, glint, s, o = {}) {
    const tiles = foilTiles(), f = ((phase % 1) + 1) % 1 * N, i0 = Math.floor(f) % N, i1 = (i0 + 1) % N, fr = f - Math.floor(f);
    const sc = (o.scale || 0.9) * s, tw = TS * sc, th = TS * sc;
    const base = ctx.globalAlpha;
    ctx.save(); ctx.imageSmoothingEnabled = true;
    for (const [tile, a] of [[tiles[i0], 1], [tiles[i1], fr]]) {
      ctx.globalAlpha = a * base;
      for (let yy = y; yy < y + h; yy += th) for (let xx = x; xx < x + w; xx += tw) ctx.drawImage(tile, xx, yy, tw, th);
    }
    ctx.globalAlpha = base;
    // facet depth: the foil darkens away from the light
    const dg = ctx.createLinearGradient(x, y, x + w, y + h); dg.addColorStop(0, 'rgba(255,255,255,0.08)'); dg.addColorStop(1, `rgba(20,10,40,${o.dark ?? 0.35})`);
    ctx.fillStyle = dg; ctx.fillRect(x, y, w, h);
    if (glint != null) {
      const gx = x + (w + h) * glint - h, g = ctx.createLinearGradient(gx, y, gx + h * 0.9, y + h);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,255,255,0.55)'); g.addColorStop(0.5, 'rgba(255,255,255,0.85)'); g.addColorStop(0.55, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(x, y, w, h);
    }
    ctx.restore();
  }
  const tilt = (t, off = 0) => t * 0.16 + Math.sin(t * 0.9 + off) * 0.12 + off;
  const glintAt = (t, off = 0) => ((t * 0.32 + off) % 1.6) - 0.3;

  // Foil-embossed text: dark bevel, bright bevel, rainbow foil face, glint, on an offscreen buffer reused per frame.
  function foilText(ctx, text, x, y, size, o) {
    const [W, H] = cw(ctx), s = S(W, H);
    ctx.save(); ctx.font = K.font(size, TF, 400);
    const tw = ctx.measureText(text).width, x0 = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
    const bw = Math.ceil(tw + size * 0.6), bh = Math.ceil(size * 1.5);
    const buf = K.cached(`${ID}:tb:${bw}x${bh}`, () => K.layer(bw, bh)), bx = buf.getContext('2d');
    bx.globalCompositeOperation = 'copy'; bx.font = ctx.font; bx.fillStyle = '#fff'; bx.textBaseline = 'alphabetic'; bx.fillText(text, size * 0.3, size * 1.1);
    bx.globalCompositeOperation = 'source-in';
    const g = bx.createLinearGradient(0, 0, bw, bh), ph = o.phase * 360;
    for (let i = 0; i <= 6; i++) { const [R, G, B] = hsl((ph + i * 55) % 360, 0.8, 0.72); g.addColorStop(i / 6, `rgb(${R | 0},${G | 0},${B | 0})`); }
    bx.fillStyle = g; bx.fillRect(0, 0, bw, bh);
    bx.globalCompositeOperation = 'source-atop';
    const gl = o.glint, gx = (bw + bh) * gl - bh, gg = bx.createLinearGradient(gx, 0, gx + bh, bh);
    gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, 'rgba(255,255,255,0.95)'); gg.addColorStop(1, 'rgba(255,255,255,0)'); bx.fillStyle = gg; bx.fillRect(0, 0, bw, bh);
    // bevels on the frame, then the face
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.fillStyle = 'rgba(0,0,0,0.75)'; ctx.fillText(text, x0 + 3 * s, y + 4 * s);
    ctx.fillStyle = 'rgba(40,30,70,0.9)'; ctx.fillText(text, x0 + 1.5 * s, y + 1.5 * s);
    ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillText(text, x0 - 1 * s, y - 1 * s);
    ctx.drawImage(buf, x0 - size * 0.3, y - size * 1.1);
    ctx.restore();
    return { w: tw, h: size };
  }

  // ---------- desk ----------
  function deskPlate(W, H) {
    return K.cached(`${ID}:desk:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H);
      const g = x.createRadialGradient(W * 0.45, H * 0.4, 0, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.65); g.addColorStop(0, '#1d1b23'); g.addColorStop(1, '#09080c');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      const tile = K.layer(200, 200), tx = tile.getContext('2d'), img = tx.createImageData(200, 200), d = img.data, r = K.rng(3);
      for (let i = 0; i < d.length; i += 4) { const v = 128 + (r() - 0.5) * 60; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      tx.putImageData(img, 0, 0); x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.35; x.fillStyle = x.createPattern(tile, 'repeat'); x.fillRect(0, 0, W, H);
      return c;
    });
  }

  function hubIcon(ctx, cx, cy, r, s) {
    ctx.save(); ctx.strokeStyle = 'rgba(25,20,40,0.85)'; ctx.fillStyle = 'rgba(25,20,40,0.85)'; ctx.lineWidth = r * 0.12; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.28, 0, 7); ctx.fill();
    for (let i = 0; i < 7; i++) { const a = -Math.PI / 2 + (i / 7) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * r * 0.42, cy + Math.sin(a) * r * 0.42); ctx.lineTo(cx + Math.cos(a) * r * 0.82, cy + Math.sin(a) * r * 0.82); ctx.stroke(); ctx.beginPath(); ctx.arc(cx + Math.cos(a) * r * 0.92, cy + Math.sin(a) * r * 0.92, r * 0.1, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function playIcon(ctx, cx, cy, r) { ctx.save(); ctx.fillStyle = 'rgba(25,20,40,0.85)'; ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy - r * 0.75); ctx.lineTo(cx + r * 0.8, cy); ctx.lineTo(cx - r * 0.5, cy + r * 0.75); ctx.closePath(); ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.stroke(); ctx.restore(); }

  const style = {
    id: ID, name: 'Holographic Foil Card', family: 'Light & Imaging',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Russo+One&family=Inter:wght@600;800&display=block', specs: ['400 60px "Russo One"', '800 30px "Inter"', '600 18px "Inter"'] }],
    palette: { bg: C.desk, ...C },
    sfx: { draw: null, land: 'pop', emphasis: 'ding', transition: 'whoosh', bed: 'room' },
    setup(W, H) { foilTiles(); deskPlate(W, H); },

    background(ctx, W, H, t) {
      ctx.drawImage(deskPlate(W, H), 0, 0);
      // rainbow spill thrown by the foil onto the desk
      const s = S(W, H), ph = tilt(t);
      ctx.save(); ctx.globalCompositeOperation = 'screen';
      for (let i = 0; i < 3; i++) {
        const px = W * (0.35 + 0.25 * i) + Math.sin(t * 0.4 + i) * 40 * s, py = H * (0.45 + 0.15 * Math.sin(i * 2)), rad = 280 * s;
        const [R, G, B] = hsl((ph * 360 + i * 120) % 360, 0.9, 0.5), g = ctx.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, `rgba(${R | 0},${G | 0},${B | 0},0.11)`); g.addColorStop(1, `rgba(${R | 0},${G | 0},${B | 0},0)`); ctx.fillStyle = g; ctx.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      }
      ctx.restore();
      // glitter flecks scattered on the desk, twinkling as the light moves
      const r = K.rng(55);
      ctx.save();
      for (let i = 0; i < 70; i++) {
        const gx = r() * W, gy = r() * H, sz = (2 + r() * 5) * s, hue = r() * 360, tw = 0.35 + 0.65 * Math.max(0, Math.sin(t * 2.2 + i * 1.7));
        const [R, G, B] = hsl(hue, 0.9, 0.6); ctx.fillStyle = `rgba(${R | 0},${G | 0},${B | 0},${0.55 * tw})`;
        ctx.save(); ctx.translate(gx, gy); ctx.rotate(r() * 3); ctx.fillRect(-sz / 2, -sz / 3, sz, sz * 0.66); ctx.restore();
      }
      ctx.restore();
    },

    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.5, '#000');
      K.grain(ctx, W, H, t, 0.04, 24, 'overlay');
    },

    // Foil-embossed lettering stamped in word by word, a glint sweeping through.
    title(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return { w: 0, h: 0 };
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 60) * s, t = o.t || 0;
      ctx.save(); ctx.font = K.font(size, TF, 400);
      let lines = [text]; if (o.maxW && ctx.measureText(text).width > o.maxW) lines = K.wrap(ctx, text, o.maxW);
      ctx.restore();
      const lh = size * 1.18; let w = 0;
      lines.forEach((ln, i) => {
        const lp = K.clamp(p * lines.length * 1.2 - i), sc = 1 + (1 - K.ease.back(lp)) * 0.25;
        if (lp <= 0) return;
        const yy = y - (lines.length - 1 - i) * lh;
        ctx.save(); ctx.translate(x, yy); ctx.scale(sc, sc); ctx.translate(-x, -yy);
        w = Math.max(w, foilText(ctx, ln, x, yy, size, { align: o.align, phase: tilt(t, 0.3 + i * 0.1), glint: glintAt(t, i * 0.2), alpha: K.clamp(lp * 2) }).w);
        ctx.restore();
      });
      return { w, h: lh * lines.length };
    },

    // Die-cut sticker: white cut margin, foil face, printed ink, slapped down with an overshoot.
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return { w: 0, h: 0 };
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 30) * s, t = o.t || 0;
      ctx.save(); ctx.font = K.font(size, TF, 400);
      const tw = ctx.measureText(text).width, pw = tw + size * 1.1, ph = size * 1.6, m = 5 * s;
      const left = o.align === 'center' ? x - pw / 2 : o.align === 'right' ? x - pw + size * 0.55 : x - size * 0.55, top = y - size * 1.12;
      const k = K.clamp(p / 0.5), sc = 1 + (1 - K.ease.back(k)) * 0.6, rot = ((o.seed || 1) % 5 - 2) * 0.015;
      ctx.globalAlpha = K.clamp(k * 3);
      ctx.translate(left + pw / 2, top + ph / 2); ctx.rotate(rot); ctx.scale(sc, sc); ctx.translate(-(left + pw / 2), -(top + ph / 2));
      ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.beginPath(); ctx.roundRect(left - m + 4 * s * sc, top - m + 6 * s * sc, pw + m * 2, ph + m * 2, ph * 0.3); ctx.fill();
      ctx.fillStyle = '#f7f5f0'; ctx.beginPath(); ctx.roundRect(left - m, top - m, pw + m * 2, ph + m * 2, ph * 0.3); ctx.fill();
      ctx.save(); ctx.beginPath(); ctx.roundRect(left, top, pw, ph, ph * 0.24); ctx.clip();
      foil(ctx, left, top, pw, ph, tilt(t, (o.seed || 1) * 0.13), glintAt(t, (o.seed || 1) * 0.11), s, { scale: 0.6, dark: 0.05 });
      ctx.restore();
      ctx.lineJoin = 'round'; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.lineWidth = size * 0.16; ctx.strokeText(text, left + size * 0.55, y);
      ctx.fillStyle = C.ink; ctx.fillText(text, left + size * 0.55, y);
      ctx.restore();
      return { w: pw, h: ph };
    },

    // Foil ribbon drawn on, a foil arrowhead sticker slapped at the end.
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const [W, H] = cw(ctx), s = S(W, H), t = o.t || 0, lw = (o.w || 9) * s;
      const pts = K.arcPts(from, to, o.bend ?? 0.12, 40), q = K.trim(pts, K.clamp(p / 0.8));
      if (q.length < 2) return null;
      const g = ctx.createLinearGradient(from[0], from[1], to[0], to[1]), ph = tilt(t, (o.seed || 1) * 0.1) * 360;
      for (let i = 0; i <= 5; i++) { const [R, G, B] = hsl((ph + i * 60) % 360, 0.85, 0.68); g.addColorStop(i / 5, `rgb(${R | 0},${G | 0},${B | 0})`); }
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = lw + 4 * s; ctx.save(); ctx.translate(3 * s, 4 * s); K.poly(ctx, q); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = '#f7f5f0'; ctx.lineWidth = lw + 4 * s; K.poly(ctx, q); ctx.stroke();
      ctx.strokeStyle = g; ctx.lineWidth = lw; K.poly(ctx, q); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = lw * 0.25; K.poly(ctx, q.map(([a, b]) => [a - lw * 0.18, b - lw * 0.18])); ctx.stroke();
      if (p > 0.8) {
        const k = K.clamp((p - 0.8) / 0.2), sc = 1 + (1 - K.ease.back(k)) * 0.8, b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 22 * s;
        ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.scale(sc, sc);
        const head = () => { ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.lineTo(-L, -L * 0.75); ctx.lineTo(-L * 0.7, 0); ctx.lineTo(-L, L * 0.75); ctx.closePath(); };
        ctx.lineWidth = 6 * s; ctx.strokeStyle = '#f7f5f0'; head(); ctx.stroke(); ctx.fillStyle = g; head(); ctx.fill();
      }
      ctx.restore();
      return q[q.length - 1];
    },

    // A trading card dealt onto the desk: holo frame, name bar, foil art window, printed text panel.
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), t = o.t || 0, seed = o.seed || 1;
      const k = K.ease.out(K.clamp(p)), from = o.from || [-W * 0.5, -H * 0.2];
      const dx = (1 - k) * from[0], dy = (1 - k) * from[1], rot = K.lerp(-0.7, o.rot ?? -0.03, K.ease.back(K.clamp(p)));
      const r = w * 0.055, ph = tilt(t, seed * 0.21), gl = glintAt(t, seed * 0.17);
      ctx.save(); ctx.translate(x + w / 2 + dx, y + h / 2 + dy); ctx.rotate(rot); ctx.translate(-w / 2, -h / 2);
      // shadow
      ctx.fillStyle = 'rgba(0,0,0,0.55)'; ctx.filter = `blur(${10 * s}px)`; ctx.beginPath(); ctx.roundRect(10 * s, 16 * s, w, h, r); ctx.fill(); ctx.filter = 'none';
      // holo frame (rare) or plain silver
      ctx.save(); ctx.beginPath(); ctx.roundRect(0, 0, w, h, r); ctx.clip();
      if (o.rare !== false) foil(ctx, 0, 0, w, h, ph, gl, s, { dark: 0.3 }); else { const g = ctx.createLinearGradient(0, 0, w, h); g.addColorStop(0, '#d9dbe2'); g.addColorStop(0.5, '#9a9ead'); g.addColorStop(1, '#d4d6de'); ctx.fillStyle = g; ctx.fillRect(0, 0, w, h); }
      ctx.restore();
      const pad = w * 0.06, nameH = h * 0.13, artY = pad + nameH + h * 0.02, artH = h * (o.textPanel === false ? 0.74 : 0.47);
      // name bar
      ctx.fillStyle = 'rgba(15,12,30,0.78)'; ctx.beginPath(); ctx.roundRect(pad, pad, w - pad * 2, nameH, 6 * s); ctx.fill();
      if (o.name) { const fs = K.fitSize(ctx, o.name, TF, 400, (o.nameSize || 34) * s, w - pad * 4, 14); foilText(ctx, o.name, w / 2, pad + nameH * 0.5 + fs * 0.36, fs, { align: 'center', phase: ph + 0.3, glint: gl - 0.1 }); }
      // art window: foil with a printed sunburst and an embossed icon
      ctx.save(); ctx.beginPath(); ctx.rect(pad, artY, w - pad * 2, artH); ctx.clip();
      foil(ctx, pad, artY, w - pad * 2, artH, ph + 0.5, gl, s, { scale: 1.1, dark: 0.25 });
      const cx = w / 2, cy = artY + artH / 2;
      ctx.strokeStyle = 'rgba(30,20,60,0.22)'; ctx.lineWidth = 3 * s;
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * w, cy + Math.sin(a) * w); ctx.stroke(); }
      if (o.icon === 'play') playIcon(ctx, cx, cy, artH * 0.28); else if (o.icon === 'hub') hubIcon(ctx, cx, cy, Math.min(artH, w) * 0.34, s);
      ctx.restore();
      ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2 * s; ctx.strokeRect(pad, artY, w - pad * 2, artH);
      // printed text panel
      if (o.textPanel !== false) {
        const ty = artY + artH + h * 0.03, thh = h - ty - pad;
        ctx.fillStyle = C.cream; ctx.beginPath(); ctx.roundRect(pad, ty, w - pad * 2, thh, 6 * s); ctx.fill();
        ctx.fillStyle = C.ink; ctx.font = K.font(Math.max(14, 15 * s), BF, 600);
        const lines = K.wrap(ctx, o.desc || '', w - pad * 4), fit = Math.max(1, Math.floor((thh - 32 * s) / (18 * s))); lines.slice(0, fit).forEach((ln, i) => ctx.fillText(ln, pad * 2, ty + 22 * s + i * 18 * s));
        ctx.font = K.font(Math.max(13, 13 * s), BF, 800); ctx.fillStyle = 'rgba(25,20,40,0.6)'; ctx.fillText(o.rare === false ? '● COMMON' : '★ HOLO RARE', pad * 2, ty + thh - 10 * s);
        ctx.textAlign = 'right'; ctx.fillText(o.serial || '001/150', w - pad * 2, ty + thh - 10 * s);
      }
      ctx.restore();
    },

    counter(ctx, value, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), t = o.t || 0;
      return foilText(ctx, K.fmt(Math.round(value)), x, y, (o.size || 120) * s, { align: o.align || 'center', phase: tilt(t, 0.7), glint: o.glint ?? glintAt(t, 0.5), alpha: K.clamp(p * 3) });
    },

    // Foil sunburst frame slapped down behind the moment, holo confetti scattering from it.
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), t = o.t || 0, rx = r * (o.wide ?? 1.3), ry = r * (o.tall ?? 0.6), k = K.clamp(p / 0.35), sc = 1 + (1 - K.ease.back(k)) * 0.5;
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha = K.clamp(k * 3);
      const n = 36;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, a2 = a + Math.PI / n * 0.9, [R, G, B] = hsl((tilt(t) * 360 + i * 20) % 360, 0.85, i % 2 ? 0.7 : 0.6);
        const r0 = 1.0, r1 = i % 2 ? 1.22 : 1.36;
        ctx.fillStyle = `rgba(${R | 0},${G | 0},${B | 0},0.95)`; ctx.beginPath();
        ctx.moveTo(Math.cos(a) * rx * r0, Math.sin(a) * ry * r0); ctx.lineTo(Math.cos((a + a2) / 2) * rx * r1, Math.sin((a + a2) / 2) * ry * r1); ctx.lineTo(Math.cos(a2) * rx * r0, Math.sin(a2) * ry * r0); ctx.closePath(); ctx.fill();
      }
      ctx.strokeStyle = '#f7f5f0'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 7); ctx.stroke();
      ctx.restore();
      // confetti
      const rnd = K.rng(o.seed || 71), q = K.clamp((p - 0.25) / 0.75);
      if (q > 0) {
        ctx.save();
        for (let i = 0; i < 60; i++) {
          const a = rnd() * Math.PI * 2, sp = (0.9 + rnd() * 0.9), px = x + Math.cos(a) * rx * (1 + q * sp), py = y + Math.sin(a) * ry * (1 + q * sp) + q * q * 120 * s, [R, G, B] = hsl(rnd() * 360, 0.9, 0.62);
          ctx.fillStyle = `rgba(${R | 0},${G | 0},${B | 0},${1 - q * 0.6})`; ctx.save(); ctx.translate(px, py); ctx.rotate(rnd() * 6 + q * 6); ctx.fillRect(-5 * s, -3 * s, 10 * s, 6 * s); ctx.restore();
        }
        ctx.restore();
      }
    },

    // Card flip: a giant card turns edge-on into its back (p 0.5 = back fills the frame), then turns away.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), k = p < 0.5 ? K.ease.inOut(p * 2) : K.ease.inOut((1 - p) * 2);
      if (k <= 0) return;
      const cwid = W * 1.08 * k, ch = H * 1.08;
      ctx.save(); ctx.translate(W / 2, H / 2);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-cwid / 2 + 12 * s, -ch / 2 + 12 * s, cwid, ch);
      ctx.beginPath(); ctx.roundRect(-cwid / 2, -ch / 2, cwid, ch, 30 * s); ctx.clip();
      ctx.fillStyle = '#1a1438'; ctx.fillRect(-cwid / 2, -ch / 2, cwid, ch);
      ctx.globalAlpha = 0.3; foil(ctx, -cwid / 2, -ch / 2, cwid, ch, tilt(o.t || 0, 1.3), p, s, { scale: 2.2, dark: 0.6 }); ctx.globalAlpha = 1;
      const vg = ctx.createRadialGradient(0, 0, 0, 0, 0, Math.hypot(cwid, ch) / 2); vg.addColorStop(0, 'rgba(26,20,56,0)'); vg.addColorStop(1, 'rgba(10,6,24,0.75)'); ctx.fillStyle = vg; ctx.fillRect(-cwid / 2, -ch / 2, cwid, ch);
      ctx.strokeStyle = '#f7f5f0'; ctx.lineWidth = 10 * s; ctx.strokeRect(-cwid / 2 + 30 * s, -ch / 2 + 30 * s, cwid - 60 * s, ch - 60 * s);
      if (k > 0.6) { ctx.save(); ctx.scale(k, 1); foilText(ctx, 'CREATOR OS', 0, 24 * s, 76 * s, { align: 'center', phase: tilt(o.t || 0), glint: p }); ctx.restore(); }
      // edge-on shading
      const sh = ctx.createLinearGradient(-cwid / 2, 0, cwid / 2, 0); sh.addColorStop(0, `rgba(0,0,0,${0.6 * (1 - k)})`); sh.addColorStop(0.5, 'rgba(0,0,0,0)'); sh.addColorStop(1, `rgba(255,255,255,${0.25 * (1 - k)})`);
      ctx.fillStyle = sh; ctx.fillRect(-cwid / 2, -ch / 2, cwid, ch);
      ctx.restore();
    },
  };

  // ---------- the shared demo: dealt on a desk ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 96 * s], video: [100 * s, 178 * s, 200 * s, 280 * s], node: [470 * s, 150 * s, 250 * s, 350 * s],
      chips: PLATFORMS.map((n, i) => [930 * s, (180 + i * 64) * s]), node2: [110 * s, 170 * s, 230 * s, 322 * s], counter: [W * 0.64, 372 * s], views: 548 * s, take: [W / 2, 648 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.05, H * 0.165, W * 0.38, H * 0.25], node: [W * 0.5, H * 0.15, W * 0.46, H * 0.31],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.59 : W * 0.41, H * (0.6 + Math.floor(i / 2) * 0.085)]), node2: [W * 0.29, H * 0.07, W * 0.42, H * 0.28], counter: [W / 2, H * 0.53], views: H * 0.628, take: [W / 2, H * 0.78] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        const [vx, vy, vw, vh] = Lo.video, [nx, ny, nw, nh] = Lo.node;
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.2, 'lin'), { size: P ? 54 : 58, align: 'center', t, maxW: W * 0.9 });
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.7, 'lin'), { t, name: 'MY VIDEO', icon: 'play', rare: false, seed: 2, rot: -0.05, desc: 'Shot once. Ready to post.', serial: '001/001', nameSize: 26, from: [-W * 0.6, H * 0.3] });
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + (P ? 64 : 58) * s, K.beat(t, 2.75, 0.5, 'lin'), { align: 'center', t, seed: 3 });
        const a1 = P ? [[vx + vw + 10 * s, vy + vh * 0.45], [nx - 14 * s, vy + vh * 0.45]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 22 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: P ? -0.08 : -0.12, t, seed: 4 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.8, 'lin'), { t, name: 'Creator OS', icon: 'hub', seed: 5, rot: 0.02, desc: 'Posts one video to every platform at once.', serial: '007/007', nameSize: 34, from: [W * 0.4, -H * 0.8] });
        if (P) { style.arrow(ctx, [nx + nw / 2, ny + nh + 18 * s], [W / 2, Lo.chips[0][1] - 52 * s], K.beat(t, 4.8, 0.3, 'lin'), { bend: 0.15, t, seed: 48, w: 7 }); style.arrow(ctx, [W / 2, Lo.chips[0][1] - 48 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 5.0, 0.4, 'lin'), { bend: 0, t, seed: 49, w: 7 }); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.36, [lx, ly] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, ly - 14 * s] : [nx + nw + 18 * s, ny + nh * 0.45];
          const to = P ? [left ? W * 0.45 : W * 0.55, ly - 14 * s] : [lx - 24 * s, ly - 13 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.3, 'lin'), { bend: P ? 0 : (i - 3) * 0.035, t, seed: 50 + i, w: P ? 6 : 6 });
          style.label(ctx, name, lx, ly, K.beat(t, t0 + 0.25, 0.45, 'lin'), { size: P ? 32 : 30, align: P ? (left ? 'right' : 'left') : 'left', t, seed: 60 + i });
        });
      } else {
        const [x2, y2, w2, h2] = Lo.node2;
        style.box(ctx, x2, y2, w2, h2, 1, { t, name: 'Creator OS', icon: 'hub', seed: 5, rot: P ? 0.0 : -0.04, desc: 'Posts one video to every platform at once.', serial: '007/007', nameSize: 34 });
        const v = K.count(t, 8.6, 1.4, 0, 1000000), [cx, cy] = Lo.counter;
        style.emphasis(ctx, cx, cy - (P ? 36 : 40) * s, (P ? 300 : 280) * s, K.beat(t, 10.0, 1.2, 'lin'), { t, tall: P ? 0.45 : 0.52, wide: P ? 1.08 : 1.25 });
        style.counter(ctx, v, cx, cy, K.beat(t, 8.45, 0.3, 'lin'), { size: P ? 96 : 104, t, glint: t > 10 ? K.clamp((t - 10.0) / 0.8) * 1.4 - 0.2 : undefined });
        style.label(ctx, 'views', cx, Lo.views, K.beat(t, 8.85, 0.5, 'lin'), { align: 'center', t, seed: 77, size: 34 });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.8, 'lin'), { size: P ? 52 : 52, align: 'center', t, maxW: W * 0.88 });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), { t });
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      k.play('pop', 0.2, { pitch: 0.8 }); k.play('pop', 0.75, { pitch: 1.0 }); k.play('ding', 1.2, { gain: 0.6 });
      k.play('whoosh', 2.0, { dur: 0.5, gain: 0.7 }); k.play('paper', 2.55, { dur: 0.15, gain: 1.2 }); k.play('thud', 2.6, { gain: 0.35 });
      k.play('stamp', 2.85, { gain: 0.5 }); k.play('pop', 2.85, { pitch: 1.2 });
      k.play('whoosh', 3.3, { dur: 0.5, gain: 0.5 }); k.play('pop', 3.95, { pitch: 1.4, gain: 0.7 });
      k.play('whoosh', 4.0, { dur: 0.6, gain: 0.8 }); k.play('paper', 4.62, { dur: 0.15, gain: 1.2 }); k.play('thud', 4.65, { gain: 0.4 }); k.play('chime', 4.8, { note: 'E6', gain: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.36, { dur: 0.22, gain: 0.3 }); k.play('stamp', 5.33 + i * 0.36, { gain: 0.35 }); k.play('pop', 5.33 + i * 0.36, { pitch: 1 + i * 0.07, gain: 0.8 }); }
      k.play('whoosh', 7.6, { dur: 0.6 }); k.play('paper', 8.2, { dur: 0.2, gain: 1.3 }); k.play('whoosh', 8.25, { dur: 0.6, up: false });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('stamp', 10.12, { gain: 0.7 }); k.play('ding', 10.15); for (let i = 0; i < 8; i++) k.play('tick', 10.2 + i * 0.07, { pitch: 1.5 + i * 0.1, gain: 0.5 });
      k.play('pop', 10.6); k.play('chime', 11.3, { note: 'A5' });
    },
  };
  MS.register(style);
})();
