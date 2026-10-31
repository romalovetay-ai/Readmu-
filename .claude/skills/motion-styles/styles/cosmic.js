// Cosmic Star Chart (Cosmic & Psychedelic). Deep-space painting crossed with an engraved celestial atlas: fbm nebulae in
// teal, violet, rose and gold, a lit banded ringed gas giant with a cratered moon, a diffraction-spiked key star and
// comets, overlaid with hairline gold and pale-cyan chart work: dotted orbits with arrowheads, degree rings, ring
// markers and small-caps serif labels.
(function () {
  const C = { space: '#05060f', teal: '#1f8a8f', violet: '#5b2a86', rose: '#c2457a', gold: '#e6c47a', cyan: '#a6eef2', cream: '#f4ead2', ink: '#0b0c1a' };
  const HEAD = 'Syne', SC = 'Cormorant SC', SERIF = 'Cormorant Garamond';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  function glow(ctx, x, y, r, col, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, K.rgba(col, a)); g.addColorStop(1, K.rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function spikeStar(ctx, x, y, r, a, s) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
    glow(ctx, x, y, r * 1.6, '#cfe9ff', 0.55); glow(ctx, x, y, r * 0.35, '#ffffff', 1);
    for (const [ang, len, w] of [[0, 1, 1.6], [Math.PI / 2, 1, 1.6], [Math.PI / 4, 0.45, 1], [-Math.PI / 4, 0.45, 1]]) {
      const g = ctx.createLinearGradient(x - Math.cos(ang) * r * 2.4 * len, y - Math.sin(ang) * r * 2.4 * len, x + Math.cos(ang) * r * 2.4 * len, y + Math.sin(ang) * r * 2.4 * len);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.strokeStyle = g; ctx.lineWidth = w * s; ctx.beginPath(); ctx.moveTo(x - Math.cos(ang) * r * 2.4 * len, y - Math.sin(ang) * r * 2.4 * len); ctx.lineTo(x + Math.cos(ang) * r * 2.4 * len, y + Math.sin(ang) * r * 2.4 * len); ctx.stroke();
    }
    ctx.restore();
  }
  // banded gas giant sprite (cached per radius), lit from the upper left
  function planetSprite(r) {
    return K.cached(`cs-planet:${r | 0}`, () => {
      const d = Math.ceil(r * 2), c = K.layer(d, d), x = c.getContext('2d'), nz = K.noise(91);
      x.beginPath(); x.arc(r, r, r, 0, TAU); x.clip();
      const cols = ['#e9d2b0', '#c99a6e', '#efe0c6', '#b77c58', '#d9b48c', '#8f6aa0', '#e4c9a3', '#a8735a'];
      for (let yy = 0; yy < d; yy += 2) { const v = yy / d, k = v * 9 + nz.n2(v * 6, 1.3) * 1.8, ci = Math.floor(k) % cols.length; x.fillStyle = K.rgba(K.mix(cols[(ci + cols.length) % cols.length], cols[(ci + 1) % cols.length], k - Math.floor(k))); x.fillRect(0, yy, d, 2.5); }
      // turbulent streaks
      x.globalAlpha = 0.25; for (let i = 0; i < 40; i++) { const yy = (nz.n2(i, 2) * 0.5 + 0.5) * d; x.fillStyle = i % 2 ? '#fff4e0' : '#6e4a3a'; x.beginPath(); x.ellipse(r + nz.n2(i, 5) * r, yy, r * (0.3 + Math.abs(nz.n2(i, 7))), 2 + Math.abs(nz.n2(i, 9)) * 4, 0, 0, TAU); x.fill(); }
      x.globalAlpha = 1;
      const g = x.createRadialGradient(r * 0.6, r * 0.55, r * 0.1, r, r, r * 1.05); g.addColorStop(0, 'rgba(255,250,235,0.15)'); g.addColorStop(0.55, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(5,6,20,0.85)');
      x.fillStyle = g; x.fillRect(0, 0, d, d);
      x.strokeStyle = 'rgba(166,238,242,0.55)'; x.lineWidth = Math.max(2, r * 0.025); x.beginPath(); x.arc(r, r, r - 1, Math.PI * 0.95, Math.PI * 1.55); x.stroke();
      return c;
    });
  }
  function planet(ctx, cx, cy, r, light, t) {
    const ring = (front) => { ctx.save(); ctx.translate(cx, cy); ctx.rotate(-0.28); ctx.beginPath(); if (front) ctx.rect(-r * 3, 0, r * 6, r * 3); else ctx.rect(-r * 3, -r * 3, r * 6, r * 3); ctx.clip();
      for (let i = 0; i < 9; i++) { const k = 1.35 + i * 0.09; ctx.strokeStyle = `rgba(${230 - i * 6},${205 - i * 8},${165 - i * 8},${(i === 4 ? 0.18 : 0.62) * light})`; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.ellipse(0, 0, r * k, r * k * 0.26, 0, 0, TAU); ctx.stroke(); }
      ctx.restore(); };
    ctx.save(); glow(ctx, cx, cy, r * 1.6, C.cyan, 0.12 * light); ctx.restore();
    ring(false);
    ctx.save(); ctx.globalAlpha = light; ctx.drawImage(planetSprite(r), cx - r, cy - r); ctx.restore();
    // ring shadow band across the globe
    ctx.save(); ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.clip(); ctx.translate(cx, cy); ctx.rotate(-0.28); ctx.fillStyle = 'rgba(5,6,20,0.35)'; ctx.fillRect(-r, r * 0.3, r * 2, r * 0.08); ctx.restore();
    ring(true);
  }
  function moon(ctx, x, y, r, s) {
    const g = ctx.createRadialGradient(x - r * 0.4, y - r * 0.4, 0, x, y, r); g.addColorStop(0, '#d9d4cc'); g.addColorStop(0.7, '#8d8780'); g.addColorStop(1, '#2a2832');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill();
    const rr = K.rng(5); ctx.fillStyle = 'rgba(40,36,44,0.35)'; for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.arc(x + rr.range(-0.5, 0.5) * r, y + rr.range(-0.5, 0.5) * r, rr.range(0.08, 0.2) * r, 0, TAU); ctx.fill(); }
    ctx.strokeStyle = K.rgba(C.gold, 0.8); ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(x, y, r * 1.6, 0, TAU); ctx.stroke();
  }
  function track(ctx, px) { if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${px}px`; }

  const style = {
    id: 'cosmic', name: 'Cosmic Star Chart', family: 'Cosmic & Psychedelic',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=Cormorant+SC:wght@500;600;700&family=Cormorant+Garamond:ital,wght@1,500;1,600&display=block', specs: ['800 64px "Syne"', '600 30px "Cormorant SC"', 'italic 600 26px "Cormorant Garamond"'] }],
    palette: C,
    sfx: { draw: 'pen', land: 'chime', emphasis: 'swell', transition: 'riser', bed: 'space' },

    background(ctx, W, H, t, o = {}) {
      const s = S(W, H);
      const neb = K.cached(`cs-neb:${W}x${H}`, () => {
        const sc = 4, w = Math.ceil(W / sc), h = Math.ceil(H / sc), c = K.layer(w, h), x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data, nz = K.noise(2001);
        const T = K.hex(C.teal), V = K.hex(C.violet), R = K.hex(C.rose), G = K.hex(C.gold);
        for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
          const u = i / Math.max(w, h), v = j / Math.max(w, h), a = nz.fbm2(u * 2.2, v * 2.2, 5), b = nz.fbm2(u * 3 + 5, v * 3 + 1, 5), e = nz.fbm2(u * 1.5 + 9, v * 1.5 + 4, 4);
          const tv = K.clamp(a * 1.6 + 0.15), vv = K.clamp(b * 1.6 + 0.2), rv = K.clamp(e * 1.8 - 0.05), gv = K.clamp(a * b * 3);
          const o4 = (j * w + i) * 4;
          d[o4] = 5 + T[0] * tv * 0.7 + V[0] * vv * 0.75 + R[0] * rv * 0.6 + G[0] * gv * 0.3;
          d[o4 + 1] = 6 + T[1] * tv * 0.7 + V[1] * vv * 0.75 + R[1] * rv * 0.6 + G[1] * gv * 0.3;
          d[o4 + 2] = 15 + T[2] * tv * 0.7 + V[2] * vv * 0.75 + R[2] * rv * 0.6 + G[2] * gv * 0.3;
          d[o4 + 3] = 255;
        }
        x.putImageData(img, 0, 0);
        const big = K.layer(W, H), bx = big.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.filter = 'blur(2px)'; bx.drawImage(c, 0, 0, W, H); bx.filter = 'none';
        const r = K.rng(33);
        for (let i = 0; i < 900; i++) { const a = Math.pow(r(), 2.5); bx.fillStyle = `rgba(${220 + r() * 35},${220 + r() * 35},255,${0.25 + a * 0.75})`; bx.beginPath(); bx.arc(r() * W, r() * H, (0.4 + a * 1.4) * s, 0, TAU); bx.fill(); }
        return big;
      });
      // slow camera drift through the sky
      const dz = 1.04 + (o.zoom || 0), dx = Math.sin(t * 0.08) * W * 0.01;
      ctx.save(); ctx.translate(W / 2 + dx, H / 2); ctx.scale(dz, dz); ctx.translate(-W / 2, -H / 2); ctx.globalAlpha = o.fade ?? 1; ctx.drawImage(neb, 0, 0); ctx.restore();
      const r = K.rng(7); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 18; i++) { const x = r() * W, y = r() * H, k = 0.5 + 0.5 * Math.sin(t * 2 + i * 2.3); glow(ctx, x, y, (3 + 5 * k) * s, '#dff4ff', 0.8 * k); }
      ctx.restore();
    },
    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.55, '#02030a');
      K.grain(ctx, W, H, t, 0.04, 24, 'overlay');
    },

    // big Syne headline in warm cream with a hairline gold graduated rule; letters fade up left to right
    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = K.fitSize(ctx, text, HEAD, 800, (o.size || 62) * s, o.maxW || ctx.canvas.width * 0.9);
      ctx.save(); ctx.font = K.font(size, HEAD, 800); track(ctx, -0.01 * size);
      const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      if (o.kicker) { ctx.save(); ctx.font = K.font(size * 0.36, SC, 600); track(ctx, size * 0.06); ctx.fillStyle = C.gold; ctx.globalAlpha = K.clamp(p * 3); ctx.textAlign = o.align === 'center' ? 'center' : 'left'; ctx.fillText(o.kicker, o.align === 'center' ? x : x0, y - size * 0.95); ctx.restore(); }
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10 * s, y - size * 1.2, (w + 20 * s) * K.ease.out(K.clamp(p)), size * 1.6); ctx.clip();
      const g = ctx.createLinearGradient(0, y - size, 0, y); g.addColorStop(0, '#fff8e6'); g.addColorStop(1, '#e9d7ae');
      ctx.fillStyle = o.color || g; ctx.shadowColor = 'rgba(255,230,180,0.35)'; ctx.shadowBlur = 16 * s; ctx.fillText(text, x0, y); ctx.restore();
      if (o.rule !== false) {
        const rp = K.clamp((p - 0.3) / 0.7), ry = y + size * 0.3; ctx.strokeStyle = K.rgba(C.gold, 0.85); ctx.lineWidth = 1.2 * s;
        ctx.beginPath(); ctx.moveTo(x0, ry); ctx.lineTo(x0 + w * rp, ry); ctx.stroke();
        for (let i = 0; i <= 60 * rp; i++) { const xx = x0 + (w * i) / 60; ctx.beginPath(); ctx.moveTo(xx, ry); ctx.lineTo(xx, ry + (i % 10 ? 4 : 9) * s); ctx.stroke(); }
      }
      ctx.restore(); return { w, h: size };
    },

    // small-caps serif chart label with optional italic gloss beneath
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 30) * s;
      ctx.save(); ctx.globalAlpha = K.ease.out(K.clamp(p)); ctx.font = K.font(size, SC, 600); track(ctx, size * 0.08);
      ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle'; ctx.fillStyle = o.color || C.gold; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 8 * s;
      ctx.fillText(text.toUpperCase() === text ? text : text, x, y);
      if (o.sub) { ctx.font = K.font(size * 0.8, SERIF, 600, 'italic'); track(ctx, 0); ctx.fillStyle = C.cream; ctx.fillText(o.sub, x, y + size * 0.95); }
      ctx.restore();
    },

    // dotted orbit line with chevron arrowheads riding it
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.arcPts(from, to, o.bend ?? 0.2, 60), q = K.ease.inOut(K.clamp(p)), sub = K.trim(pts, q), col = o.color || C.cyan;
      ctx.save(); ctx.setLineDash([2 * s, 6 * s]); ctx.lineCap = 'round';
      ctx.strokeStyle = K.rgba(col, 0.9); ctx.lineWidth = 2 * s; K.poly(ctx, sub); ctx.stroke(); ctx.setLineDash([]);
      const L = K.pathLen(pts), chev = (k) => { const a = K.trim(pts, k), b = a[a.length - 1], c = a[Math.max(0, a.length - 3)], ang = Math.atan2(b[1] - c[1], b[0] - c[0]); ctx.save(); ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.strokeStyle = col; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(-8 * s, -6 * s); ctx.lineTo(0, 0); ctx.lineTo(-8 * s, 6 * s); ctx.stroke(); ctx.restore(); };
      if (L > 120 * s && q > 0.5) chev(0.5);
      if (q >= 1) chev(1);
      ctx.restore(); return sub[sub.length - 1];
    },

    // chart cartouche: hairline double frame with corner ticks over a dark translucent field
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), q = K.ease.inOut(K.clamp(p));
      ctx.save(); ctx.globalAlpha = q * 0.55; ctx.fillStyle = '#060818'; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
      K.drawOn(ctx, K.rectPts(x, y, w, h), q, { strokeStyle: K.rgba(o.color || C.gold, 0.9), lineWidth: 1.4 * s, lineCap: 'butt' });
      K.drawOn(ctx, K.rectPts(x + 6 * s, y + 6 * s, w - 12 * s, h - 12 * s), q, { strokeStyle: K.rgba(o.color || C.gold, 0.5), lineWidth: 1 * s, lineCap: 'butt' });
      ctx.restore();
    },

    // big Syne figures over a graduated sextant scale
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), txt = K.fmt(value), size = K.fitSize(ctx, K.fmt(1000000), HEAD, 800, (o.size || 110) * s, ctx.canvas.width * 0.86);
      ctx.save(); ctx.font = K.font(size, HEAD, 800); ctx.textAlign = 'center';
      const w = ctx.measureText(txt).width, g = ctx.createLinearGradient(0, y - size, 0, y); g.addColorStop(0, '#fff6dd'); g.addColorStop(1, C.gold);
      ctx.fillStyle = g; ctx.shadowColor = 'rgba(255,220,150,0.45)'; ctx.shadowBlur = 24 * s; ctx.fillText(txt, x, y); ctx.shadowBlur = 0;
      // sextant arc scale under the number with a moving index
      const R = w * 0.7, cy = y + R * 0.95 - size * 0.05, a0 = -Math.PI / 2 - 0.55, a1 = -Math.PI / 2 + 0.55;
      ctx.strokeStyle = K.rgba(C.gold, 0.8); ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.arc(x, cy, R, a0, a1); ctx.stroke();
      for (let i = 0; i <= 40; i++) { const a = K.lerp(a0, a1, i / 40), l = (i % 10 ? 6 : i % 5 ? 9 : 14) * s; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * R, cy + Math.sin(a) * R); ctx.lineTo(x + Math.cos(a) * (R - l), cy + Math.sin(a) * (R - l)); ctx.stroke(); }
      const ai = K.lerp(a0, a1, K.clamp(o.frac ?? 1)); ctx.strokeStyle = C.cyan; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x + Math.cos(ai) * (R + 10 * s), cy + Math.sin(ai) * (R + 10 * s)); ctx.lineTo(x + Math.cos(ai) * (R - 22 * s), cy + Math.sin(ai) * (R - 22 * s)); ctx.stroke();
      ctx.restore();
    },

    // key star flare with an expanding ring marker
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p)), f = Math.sin(Math.PI * K.clamp(p * 1.2));
      ctx.save(); ctx.strokeStyle = K.rgba(C.cyan, 0.9 * (1 - k) + 0.3); ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.arc(x, y, r * k, 0, TAU); ctx.stroke(); ctx.setLineDash([3 * s, 5 * s]); ctx.beginPath(); ctx.arc(x, y, r * k * 1.12, 0, TAU); ctx.stroke(); ctx.restore();
      spikeStar(ctx, o.sx ?? x + r * 0.92, o.sy ?? y - r * 0.4, 60 * s * (0.3 + f), 1, s);
    },

    // warp: stars smear into radial streaks toward a teal-white flash (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), r = K.rng(77), e = Math.sin(Math.PI * p), R = Math.hypot(W, H) / 2;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = 0; i < 180; i++) { const a = r() * TAU, d = r() * R, l = R * 0.6 * e * r.range(0.3, 1); ctx.strokeStyle = K.rgba(i % 4 ? '#dff6ff' : C.gold, 0.6 * e); ctx.lineWidth = r.range(0.8, 2.4) * s; ctx.beginPath(); ctx.moveTo(W / 2 + Math.cos(a) * d, H / 2 + Math.sin(a) * d); ctx.lineTo(W / 2 + Math.cos(a) * (d + l), H / 2 + Math.sin(a) * (d + l)); ctx.stroke(); }
      ctx.restore();
      const f = K.clamp(1 - Math.abs(p - 0.5) * 4.5); if (f > 0) { ctx.save(); ctx.fillStyle = `rgba(214,246,250,${f})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [80 * s, 140 * s], star: [190 * s, 380 * s], planet: [600 * s, 395 * s, 115 * s],
      chips: PLATFORMS.map((n, i) => [1010 * s, (180 + i * 74) * s]), counter: [W / 2, 400 * s], take: [W / 2, 640 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], star: [W / 2, H * 0.235], planet: [W / 2, H * 0.455, W * 0.13],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.58 : W * 0.42, H * (0.69 + Math.floor(i / 2) * 0.066)]), counter: [W / 2, H * 0.47], take: [W / 2, H * 0.8] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t, { fade: K.beat(t, 0, 1.2, 'out'), zoom: t * 0.003 });
      if (t < 8.3) {
        const [px, py, pr] = Lo.planet, light = K.beat(t, 3.9, 1.0, 'inOut');
        // degree ring sweeping round the planet
        const dr = pr * 2.15, dp = K.beat(t, 4.3, 1.4, 'inOut');
        ctx.save(); ctx.strokeStyle = K.rgba(C.gold, 0.55); ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.arc(px, py, dr, -Math.PI / 2, -Math.PI / 2 + TAU * dp); ctx.stroke();
        for (let i = 0; i < 72 * dp; i++) { const a = -Math.PI / 2 + (i / 72) * TAU, l = (i % 6 ? 5 : 11) * s; ctx.beginPath(); ctx.moveTo(px + Math.cos(a) * dr, py + Math.sin(a) * dr); ctx.lineTo(px + Math.cos(a) * (dr - l), py + Math.sin(a) * (dr - l)); ctx.stroke(); }
        ctx.font = K.font(13 * s, SERIF, 600, 'italic'); ctx.fillStyle = K.rgba(C.gold, 0.7); ctx.textAlign = 'center';
        for (let i = 0; i < 12 * dp; i++) { const a = -Math.PI / 2 + (i / 12) * TAU; ctx.fillText(`${i * 30}°`, px + Math.cos(a) * (dr + 14 * s), py + Math.sin(a) * (dr + 14 * s) + 4 * s); }
        ctx.restore();
        if (light > 0) { planet(ctx, px, py, pr, light, t); const ma = t * 0.5; moon(ctx, px + Math.cos(ma) * pr * 1.7, py + Math.sin(ma) * pr * 0.55 - pr * 0.1, pr * 0.13, s); }
        // the video = a bright star in a ring marker, flaring on arrival
        const [sx, sy] = Lo.star, sp = K.beat(t, 2.0, 0.7, 'out');
        if (sp > 0) { spikeStar(ctx, sx, sy, 34 * s * (1 + 0.6 * Math.sin(Math.PI * K.clamp((t - 2.0) / 0.8))), sp, s); style.emphasis(ctx, sx, sy, 42 * s, sp, { sx: -999, sy: -999 }); }
        style.label(ctx, 'Your Video', sx + (P ? 0 : 0), sy + 76 * s, K.beat(t, 2.6, 0.5), { align: 'center', sub: 'one bright source', size: 30 });
        const a1 = P ? [[sx, sy + 140 * s], [px, py - pr * 1.55]] : [[sx + 60 * s, sy - 10 * s], [px - pr * 1.5, py - pr * 0.5]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.8, 'lin'), { bend: P ? 0.05 : -0.25 });
        style.label(ctx, 'Creator OS', px, py + pr * (P ? 2.5 : 1.95), K.beat(t, 4.6, 0.5), { align: 'center', size: 34, color: C.cream, sub: 'the engine at the centre' });
        if (P) style.arrow(ctx, [W / 2, py + pr * 3.15], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.6, 'lin'), { bend: 0 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const a = -0.9 + (i / 6) * 1.8, from = P ? [W / 2, cy] : [px + Math.cos(a) * pr * 1.6, py + Math.sin(a) * pr * 1.15], to = P ? [left ? W * 0.455 : W * 0.545, cy] : [cx - 30 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.4, 'lin'), { bend: P ? 0 : 0.08, color: i % 2 ? C.cyan : C.gold });
          const lp = K.beat(t, t0 + 0.32, 0.4);
          const mx = P ? (left ? W * 0.45 : W * 0.55) : cx - 14 * s;
          if (lp > 0 && !P) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, mx, cy, 10 * s, '#ffffff', lp); ctx.restore(); }
          style.label(ctx, name, P ? (left ? W * 0.42 : W * 0.58) : cx + 8 * s, cy, lp, { size: P ? 30 : 30, align: P ? (left ? 'right' : 'left') : 'left', color: i % 2 ? C.cyan : C.gold });
        });
        if (P) { style.title(ctx, 'One video.', W / 2, H * 0.08, K.beat(t, 0.3, 0.8, 'lin'), { size: 64, align: 'center', kicker: 'Chart I  •  The Distribution Sky', rule: false }); style.title(ctx, 'Every platform.', W / 2, H * 0.08 + 104 * s, K.beat(t, 0.8, 0.9, 'lin'), { size: 64, align: 'center' }); }
        else style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.3, 1.4, 'lin'), { size: 54, align: 'left', kicker: 'Chart I  •  The Distribution Sky' });
      } else {
        const [cx, cy] = Lo.counter;
        planet(ctx, P ? W * 0.5 : 170 * s, P ? H * 0.23 : 170 * s, P ? W * 0.11 : 70 * s, 1, t);
        style.label(ctx, 'Creator OS', P ? W * 0.5 : 170 * s, P ? H * 0.31 : 290 * s, 1, { align: 'center', size: 28, color: C.cream });
        const v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.label(ctx, 'Views observed', cx, cy - (P ? 120 : 130) * s, K.beat(t, 8.5, 0.5), { align: 'center', size: 32 });
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy, 1, { size: P ? 96 : 116, frac: v / 1000000 });
        style.emphasis(ctx, cx, cy - 40 * s, (P ? 330 : 360) * s, K.beat(t, 10.0, 0.9, 'lin'));
        if (P) { style.title(ctx, 'Post once.', W / 2, H * 0.78, K.beat(t, 10.5, 0.6, 'lin'), { size: 64, align: 'center', rule: false }); style.title(ctx, 'Reach everywhere.', W / 2, H * 0.78 + 104 * s, K.beat(t, 10.9, 0.7, 'lin'), { size: 64, align: 'center' }); }
        else style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 1.0, 'lin'), { size: 52, align: 'center' });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('space', 0, 12, 1.1);
      k.play('swell', 0, { dur: 2.4, chord: ['D3', 'A3', 'E4'] }); k.play('scribble', 0.3, { medium: 'pen', dur: 1.4, gain: 0.4 });
      k.play('chime', 2.0, { note: 'A6', gain: 0.8 }); k.play('scribble', 3.3, { medium: 'pen', dur: 0.8, gain: 0.5 });
      k.play('swell', 3.9, { dur: 1.6, chord: ['A3', 'E4', 'B4'] }); k.play('tick', 4.6);
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.35, gain: 0.35 }); k.play('blip', 5.35 + i * 0.4, { note: ['E6', 'F#6', 'A6', 'B6', 'D7', 'E7', 'F#7'][i], gain: 0.35 }); }
      k.play('riser', 7.3, { dur: 0.9 }); k.play('thud', 8.25, { gain: 0.6 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('swell', 10.0, { dur: 2, chord: ['D4', 'F#4', 'A4', 'E5'] }); k.play('chime', 10.0, { note: 'D7', gain: 0.5 });
      k.play('chime', 11.3, { note: 'A5' });
    },
  };
  MS.register(style);
})();
