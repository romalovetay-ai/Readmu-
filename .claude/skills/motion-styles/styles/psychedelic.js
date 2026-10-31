// Psychedelic Poster (Cosmic & Psychedelic). 1960s San Francisco concert-poster psychedelia: full-strength inks in
// vibrating complementary pairs, liquid churning ring bands, sunbursts, daisies and a mirror-symmetric eye-flower,
// bulbous melting Shrikhand lettering with inline and drop, all printed on worn, scuffed poster stock.
(function () {
  const C = { mag: '#ff2a8f', lime: '#a6e22e', blue: '#2547d8', purple: '#7b2fc4', orange: '#ff7a1c', yellow: '#ffd233', cream: '#fbefd3', dark: '#2a1248', red: '#e8322a' };
  const HEAD = 'Shrikhand', BODY = 'Righteous';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  const NZ = K.noise(1960);

  // liquid ring bands churning around (cx, cy): vector rings with sin + noise radial wobble
  function bands(ctx, W, H, t, cx, cy, o = {}) {
    const s = S(W, H), R = Math.hypot(W, H) * 0.75, n = o.n || 34, pal = o.pal || [C.mag, C.lime], step = R / n, seg = 110;
    for (let k = n; k >= 1; k--) {
      const base = k * step + (t * 26 * s) % (step * 2) - step;
      if (base <= 0) continue;
      ctx.beginPath();
      for (let i = 0; i <= seg; i++) {
        const a = (i / seg) * TAU, ca = Math.cos(a), sa = Math.sin(a);
        const w = Math.sin(a * 3 + t * 0.6 + k * 0.15) * 0.07 + NZ.n3(ca * 1.2 + 3, sa * 1.2, t * 0.12 + k * 0.03) * 0.28;
        const r = base * (1 + w * Math.min(1, base / (R * 0.15)));
        i ? ctx.lineTo(cx + ca * r * 1.15, cy + sa * r) : ctx.moveTo(cx + ca * r * 1.15, cy + sa * r);
      }
      ctx.closePath();
      ctx.fillStyle = pal[k % pal.length]; ctx.fill();
      ctx.strokeStyle = 'rgba(42,18,72,0.55)'; ctx.lineWidth = 2.2 * s; ctx.stroke();
    }
  }
  function daisy(ctx, x, y, r, rot, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    for (let i = 0; i < 9; i++) { ctx.save(); ctx.rotate((i / 9) * TAU); ctx.beginPath(); ctx.ellipse(0, -r * 0.62, r * 0.24, r * 0.48, 0, 0, TAU); ctx.fillStyle = C.cream; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 2.2 * s; ctx.stroke(); ctx.restore(); }
    ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, TAU); ctx.fillStyle = C.orange; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r * 0.15, 0, TAU); ctx.fillStyle = C.yellow; ctx.fill();
    ctx.restore();
  }
  // mirror-symmetric eye-flower; p unfurls petals then opens the eye
  function eyeFlower(ctx, cx, cy, R, p, t, s) {
    const layers = [[16, 1.0, C.blue, 'spike'], [12, 0.82, C.purple, 'oval'], [12, 0.6, C.orange, 'spike'], [10, 0.5, C.lime, 'oval']];
    layers.forEach(([n, rk, col, kind], li) => {
      const lp = K.ease.back(K.clamp(p * 1.6 - li * 0.18)); if (lp <= 0) return;
      for (let i = 0; i < n; i++) {
        ctx.save(); ctx.translate(cx, cy); ctx.rotate((i / n) * TAU + li * 0.2 + Math.sin(t * 0.8) * 0.03 * (li % 2 ? 1 : -1)); ctx.scale(1, lp);
        const L = R * rk;
        ctx.beginPath();
        if (kind === 'spike') { ctx.moveTo(-L * 0.16, -L * 0.25); ctx.quadraticCurveTo(-L * 0.12, -L * 0.75, 0, -L); ctx.quadraticCurveTo(L * 0.12, -L * 0.75, L * 0.16, -L * 0.25); }
        else ctx.ellipse(0, -L * 0.6, L * 0.17, L * 0.38, 0, 0, TAU);
        ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 3 * s; ctx.stroke();
        if (kind === 'oval') { ctx.beginPath(); ctx.ellipse(0, -L * 0.6, L * 0.08, L * 0.25, 0, 0, TAU); ctx.fillStyle = li === 1 ? C.lime : C.mag; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.arc(0, -L * 0.88, L * 0.04, 0, TAU); ctx.fillStyle = C.cream; ctx.fill(); }
        ctx.restore();
      }
    });
    // scalloped collar + eye
    const ep = K.clamp(p * 1.6 - 0.75); if (ep <= 0) return;
    const er = R * 0.36 * K.ease.back(ep);
    ctx.save(); ctx.translate(cx, cy);
    ctx.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU, r = er * (1.12 + 0.07 * Math.cos(a * 16)); i ? ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r) : ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    ctx.closePath(); ctx.fillStyle = C.orange; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 3 * s; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, er, 0, TAU); ctx.fillStyle = C.cream; ctx.fill(); ctx.stroke();
    // veins
    ctx.strokeStyle = 'rgba(232,50,42,0.7)'; ctx.lineWidth = 1.6 * s;
    for (let i = 0; i < 7; i++) { const a = i * 0.9 + 0.3; ctx.beginPath(); ctx.moveTo(Math.cos(a) * er * 0.95, Math.sin(a) * er * 0.95); ctx.quadraticCurveTo(Math.cos(a + 0.2) * er * 0.75, Math.sin(a + 0.2) * er * 0.75, Math.cos(a) * er * 0.55, Math.sin(a) * er * 0.55); ctx.stroke(); }
    // eye opens: lids squeeze the iris disc
    const open = K.ease.out(K.clamp(ep * 1.4 - 0.2)), look = Math.sin(t * 1.3) * er * 0.08;
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, 0, er * 0.98, er * 0.98 * open, 0, 0, TAU); ctx.clip();
    [[0.62, C.blue], [0.5, C.lime], [0.38, C.orange], [0.24, C.dark]].forEach(([k, col]) => { ctx.beginPath(); ctx.arc(look, 0, er * k, 0, TAU); ctx.fillStyle = col; ctx.fill(); });
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2 * s; for (let i = 0; i < 24; i++) { const a = (i / 24) * TAU; ctx.beginPath(); ctx.moveTo(look + Math.cos(a) * er * 0.26, Math.sin(a) * er * 0.26); ctx.lineTo(look + Math.cos(a) * er * 0.6, Math.sin(a) * er * 0.6); ctx.stroke(); }
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(look - er * 0.12, -er * 0.14, er * 0.07, 0, TAU); ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  const style = {
    id: 'psychedelic', name: 'Psychedelic Poster', family: 'Cosmic & Psychedelic',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Shrikhand&family=Righteous&display=block', specs: ['400 64px "Shrikhand"', '400 30px "Righteous"'] }],
    palette: C,
    sfx: { draw: null, land: 'pluck', emphasis: 'swell', transition: 'whoosh', bed: 'vinyl' },

    background(ctx, W, H, t, o = {}) { bands(ctx, W, H, t, o.cx ?? W / 2, o.cy ?? H / 2, o); },

    finish(ctx, W, H, t) {
      // worn poster stock: paper multiply, white scuffs and fold creases, edge dirt, grain
      const s = S(W, H);
      const worn = K.cached(`ps-worn:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(67);
        x.drawImage(K.paperTex(W, H, '#fff6e6', 13, 0.12, false), 0, 0);
        return c;
      });
      const scuff = K.cached(`ps-scuff:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(68);
        x.strokeStyle = 'rgba(255,248,230,0.55)'; x.lineCap = 'round';
        for (let i = 0; i < 70; i++) { const a = r() * W, b = r() * H, l = r.range(4, 40) * s; x.lineWidth = r.range(0.6, 2.2) * s; x.beginPath(); x.moveTo(a, b); x.lineTo(a + r.range(-l, l), b + r.range(-l * 0.3, l * 0.3)); x.stroke(); }
        for (let i = 0; i < 400; i++) { x.fillStyle = `rgba(255,248,230,${r.range(0.2, 0.6)})`; x.fillRect(r() * W, r() * H, r.range(0.8, 2.5) * s, r.range(0.8, 2.5) * s); }
        // fold creases
        x.strokeStyle = 'rgba(255,250,235,0.22)'; x.lineWidth = 2 * s; x.beginPath(); x.moveTo(W / 2, 0); x.lineTo(W / 2 + 6 * s, H); x.moveTo(0, H / 2); x.lineTo(W, H / 2 - 4 * s); x.stroke();
        return c;
      });
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(worn, 0, 0); ctx.restore();
      ctx.drawImage(scuff, 0, 0);
      K.vignette(ctx, W, H, 0.4, '#3a1a10');
      K.grain(ctx, W, H, t, 0.06, 12, 'overlay');
    },

    // bulbous Shrikhand: yellow fill, red inline, fat cream outline, deep blue drop; letters melt into place
    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 64) * s;
      ctx.save(); ctx.font = K.font(size, HEAD, 400); ctx.lineJoin = 'round'; ctx.textBaseline = 'alphabetic';
      const tw = ctx.measureText(text).width; let cx = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
      const layer = (fn) => { let xx = cx; for (let i = 0; i < text.length; i++) { const ch = text[i], cw = ctx.measureText(text.slice(0, i + 1)).width - ctx.measureText(text.slice(0, i)).width; const lp = K.clamp(p * 1.5 - (i / text.length) * 0.5); if (lp > 0 && ch !== ' ') { const m = K.ease.out(lp), sy = 1 + (1 - m) * 1.2, wob = Math.sin(o.t ?? 0 + i) * 0; ctx.save(); ctx.translate(xx + cw / 2, y); ctx.scale(1 + (1 - m) * 0.15, sy); ctx.globalAlpha = K.clamp(lp * 3); fn(ch, -cw / 2, lp); ctx.restore(); } xx += cw; } };
      layer((ch, lx) => { ctx.fillStyle = o.shadow || C.blue; ctx.strokeStyle = o.shadow || C.blue; ctx.lineWidth = size * 0.22; ctx.strokeText(ch, lx + size * 0.07, size * 0.08); ctx.fillText(ch, lx + size * 0.07, size * 0.08); });
      layer((ch, lx) => { ctx.strokeStyle = C.dark; ctx.lineWidth = size * 0.2; ctx.strokeText(ch, lx, 0); ctx.strokeStyle = C.cream; ctx.lineWidth = size * 0.13; ctx.strokeText(ch, lx, 0); });
      layer((ch, lx, lp) => {
        ctx.fillStyle = o.color || C.yellow; ctx.fillText(ch, lx, 0);
        ctx.strokeStyle = o.inline || C.red; ctx.lineWidth = size * 0.035; ctx.strokeText(ch, lx, 0);
        // drips while melting
        if (lp < 1) { const cw = ctx.measureText(ch).width; ctx.fillStyle = o.color || C.yellow; for (let k = 0; k < 2; k++) { const dx = lx + cw * (0.3 + k * 0.4), dl = (1 - lp) * size * (0.3 + k * 0.25); ctx.beginPath(); ctx.ellipse(dx, size * 0.05 + dl, size * 0.05, dl * 0.6 + 1, 0, 0, TAU); ctx.fill(); } }
      });
      ctx.restore(); return { w: tw, h: size };
    },

    // cream ribbon banner with folded tails, dark outline
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 30) * s, k = K.ease.back(K.clamp(p));
      ctx.save(); ctx.font = K.font(size, BODY, 400);
      const tw = ctx.measureText(text).width, w = tw + size * 1.2, h = size * 1.55;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      ctx.translate(x0 + w / 2, y); ctx.scale(k, 1); ctx.rotate(o.rot || 0);
      ctx.lineJoin = 'round'; ctx.strokeStyle = C.dark; ctx.lineWidth = 3 * s;
      const tail = (sx) => { ctx.beginPath(); ctx.moveTo(sx * w / 2, -h * 0.2); ctx.lineTo(sx * (w / 2 + h * 0.6), -h * 0.2); ctx.lineTo(sx * (w / 2 + h * 0.38), h * 0.3); ctx.lineTo(sx * (w / 2 + h * 0.6), h * 0.75); ctx.lineTo(sx * w / 2, h * 0.75); ctx.closePath(); ctx.fillStyle = o.tail || C.mag; ctx.fill(); ctx.stroke(); };
      tail(-1); tail(1);
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6 * s); ctx.fillStyle = o.fill || C.cream; ctx.fill(); ctx.stroke();
      ctx.fillStyle = o.color || C.dark; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.05);
      ctx.restore(); return { w, h };
    },

    // striped ribbon that flows along a wavy path, ending in a fat teardrop point
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), base = K.arcPts(from, to, o.bend ?? 0.12, 50), L = K.pathLen(base);
      const pts = base.map((q, i) => { const a = base[Math.max(0, i - 1)], b = base[Math.min(base.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, w = Math.sin((i / base.length) * Math.PI * 3 + (o.t || 0) * 3) * 6 * s * Math.sin((i / (base.length - 1)) * Math.PI); return [q[0] - (dy / l) * w, q[1] + (dx / l) * w]; });
      const sub = K.trim(pts, K.ease.inOut(K.clamp(p)));
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const wd = (o.width || 14) * s;
      ctx.strokeStyle = C.dark; ctx.lineWidth = wd + 5 * s; K.poly(ctx, sub); ctx.stroke();
      ctx.strokeStyle = o.color || C.yellow; ctx.lineWidth = wd; K.poly(ctx, sub); ctx.stroke();
      ctx.strokeStyle = o.c2 || C.purple; ctx.setLineDash([10 * s, 10 * s]); ctx.lineDashOffset = -(o.t || 0) * 40 * s; ctx.lineWidth = wd * 0.5; K.poly(ctx, sub); ctx.stroke(); ctx.setLineDash([]);
      const b = sub[sub.length - 1];
      if (p >= 0.98) { const a = pts[pts.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]); ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(10 * s, 0); ctx.quadraticCurveTo(-8 * s, -20 * s, -22 * s, -14 * s); ctx.quadraticCurveTo(-14 * s, 0, -22 * s, 14 * s); ctx.quadraticCurveTo(-8 * s, 20 * s, 10 * s, 0); ctx.fillStyle = o.color || C.yellow; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 3 * s; ctx.stroke(); }
      ctx.restore(); return b;
    },

    // a fat rounded blob-panel: dark outline, coloured rim, cream face
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.back(K.clamp(p)), r = Math.min(w, h) * 0.3;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2);
      ctx.beginPath(); ctx.roundRect(6 * s, 8 * s, w, h, r); ctx.fillStyle = C.blue; ctx.fill();
      ctx.beginPath(); ctx.roundRect(0, 0, w, h, r); ctx.fillStyle = o.rim || C.purple; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 4 * s; ctx.stroke();
      ctx.beginPath(); ctx.roundRect(12 * s, 12 * s, w - 24 * s, h - 24 * s, r * 0.7); ctx.fillStyle = o.fill || C.cream; ctx.fill(); ctx.lineWidth = 3 * s; ctx.stroke();
      ctx.restore();
    },

    counter(ctx, value, x, y, p, o = {}) { return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 110, align: o.align || 'center', color: C.lime, inline: C.blue, shadow: C.mag }); },

    // kaleidoscope sunburst: alternating rays spinning out behind the hit
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p)), n = 24, rot = (o.t || 0) * 0.4;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      for (let i = 0; i < n; i++) { const a0 = (i / n) * TAU, a1 = ((i + 0.5) / n) * TAU; ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, r * k * 1.6, a0, a1); ctx.closePath(); ctx.fillStyle = [C.yellow, C.orange, C.mag][i % 3]; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 2 * s; ctx.stroke(); }
      ctx.beginPath(); ctx.arc(0, 0, r * k * 0.95, 0, TAU); ctx.fillStyle = C.purple; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, 0, r * k * 0.82, 0, TAU); ctx.fillStyle = C.blue; ctx.fill(); ctx.stroke();
      ctx.restore();
    },

    // iris ripple: rings of ink flood out from the centre and cover the poster, then drain away
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), R = Math.hypot(W, H) * 0.6, e = p < 0.5 ? K.ease.in(p * 2) : 1 - K.ease.out((p - 0.5) * 2), n = 12;
      ctx.save();
      for (let i = n; i >= 1; i--) { const r = R * e * (i / n) * 1.05; if (r <= 0) continue; ctx.beginPath(); for (let k = 0; k <= 60; k++) { const a = (k / 60) * TAU, rr = r * (1 + 0.05 * Math.sin(a * 6 + p * 12 + i)); k ? ctx.lineTo(W / 2 + Math.cos(a) * rr * 1.2, H / 2 + Math.sin(a) * rr) : ctx.moveTo(W / 2 + Math.cos(a) * rr * 1.2, H / 2 + Math.sin(a) * rr); } ctx.closePath(); ctx.fillStyle = [C.purple, C.orange, C.blue, C.yellow][i % 4]; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 3 * s; ctx.stroke(); }
      ctx.restore();
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const TAILS = [C.mag, C.lime, C.orange, C.purple, C.blue, C.mag, C.lime];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 110 * s], video: [70 * s, 300 * s, 230 * s, 150 * s], flower: [560 * s, 420 * s, 175 * s],
      chips: PLATFORMS.map((n, i) => [960 * s, (190 + i * 70) * s]), counter: [W / 2, 420 * s], take: [W / 2, 650 * s] };
    return { s, P: true, title: [W / 2, H * 0.09], video: [W * 0.3, H * 0.12, W * 0.4, H * 0.08], flower: [W / 2, H * 0.45, W * 0.27],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.69 + Math.floor(i / 2) * 0.064)]), counter: [W / 2, H * 0.5], take: [W / 2, H * 0.8] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, [fx, fy, fr] = Lo.flower;
      const s2 = t >= 8.25;
      // colour ripples out from the centre over the first beat
      const reveal = K.beat(t, 0, 1.2, 'out');
      ctx.fillStyle = C.cream; ctx.fillRect(0, 0, W, H);
      ctx.save(); ctx.beginPath(); ctx.arc(s2 ? W / 2 : fx, s2 ? Lo.counter[1] : fy, Math.hypot(W, H) * reveal, 0, TAU); ctx.clip();
      style.background(ctx, W, H, t, s2 ? { cx: W / 2, cy: Lo.counter[1], pal: [C.orange, C.blue] } : { cx: fx, cy: fy });
      ctx.restore();
      // corner daisies
      const dr = 46 * s; [[dr * 1.2, dr * 1.2], [W - dr * 1.2, dr * 1.2], [dr * 1.2, H - dr * 1.2], [W - dr * 1.2, H - dr * 1.2]].forEach(([x, y], i) => daisy(ctx, x, y, dr * K.ease.back(K.beat(t, 0.4 + i * 0.1, 0.5, 'lin')), t * 0.3 * (i % 2 ? -1 : 1), s));
      if (!s2) {
        const [vx, vy, vw, vh] = Lo.video;
        eyeFlower(ctx, fx, fy, fr, K.beat(t, 3.9, 1.4, 'lin'), t, s);
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.6, 'lin'), {});
        const tp = K.beat(t, 2.4, 0.4, 'out'); if (tp > 0) { ctx.save(); ctx.translate(vx + vw / 2, vy + vh / 2); ctx.scale(tp, tp); ctx.beginPath(); ctx.moveTo(-16 * s, -24 * s); ctx.lineTo(26 * s, 0); ctx.lineTo(-16 * s, 24 * s); ctx.closePath(); ctx.fillStyle = C.mag; ctx.fill(); ctx.strokeStyle = C.dark; ctx.lineWidth = 3 * s; ctx.stroke(); ctx.restore(); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 40 * s, K.beat(t, 2.7, 0.4, 'lin'), { align: 'center', size: 28 });
        const a1 = P ? [[W / 2, vy + vh + 82 * s], [W / 2, fy - fr * 1.05]] : [[vx + vw + 10 * s, vy + vh / 2], [fx - fr * 1.05, fy - fr * 0.3]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.8, 'lin'), { t, bend: P ? 0.02 : -0.15 });
        style.label(ctx, 'Creator OS', fx, fy + fr * 1.12, K.beat(t, 4.9, 0.4, 'lin'), { align: 'center', size: 34, fill: C.yellow, tail: C.blue });
        if (P) style.arrow(ctx, [W / 2, fy + fr * 1.35], [W / 2, Lo.chips[6][1] + 18 * s], K.beat(t, 5.0, 0.6, 'lin'), { t, width: 10, bend: 0.01 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const a = -0.55 + (i / 6) * 1.1, from = P ? [W / 2, cy] : [fx + Math.cos(a) * fr * 0.98, fy + Math.sin(a) * fr * 0.98], to = P ? [left ? W * 0.47 : W * 0.53, cy] : [cx - 38 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.38, 'lin'), { t, width: P ? 8 : 10, color: i % 2 ? C.lime : C.yellow, c2: i % 2 ? C.blue : C.mag, bend: 0.04 });
          style.label(ctx, name, P ? (left ? W * 0.44 - 26 * s : W * 0.56 + 26 * s) : cx, cy, K.beat(t, t0 + 0.3, 0.3, 'lin'), { size: 28, align: P ? (left ? 'right' : 'left') : 'left', tail: TAILS[i] });
        });
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.5, 1.3, 'lin'), { size: P ? 50 : 70, align: 'center' });
      } else {
        const [cx, cy] = Lo.counter;
        style.emphasis(ctx, cx, cy - 40 * s, (P ? 300 : 260) * s, K.beat(t, 10.0, 0.6, 'lin'), { t });
        // the flower shrinks into a badge above the number
        eyeFlower(ctx, cx, P ? H * 0.27 : 130 * s, P ? W * 0.13 : 80 * s, 1, t, s);
        const v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy, 1, { size: P ? 96 : 120 });
        style.label(ctx, 'far out views', cx, cy + 66 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 30 });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 1.0, 'lin'), { size: P ? 46 : 62, align: 'center' });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('vinyl', 0, 12, 1);
      k.play('swell', 0, { dur: 2.2, chord: ['E3', 'B3', 'G#4'] }); k.play('whoosh', 0.1, { dur: 1.0 });
      'CEGBD'.split('').forEach((n, i) => k.play('pluck', 0.5 + i * 0.25, { note: n + '5', gain: 0.6 }));
      k.play('pop', 2.0); k.play('pluck', 2.7, { note: 'A4' }); k.play('whoosh', 3.3, { dur: 0.8 });
      k.play('riser', 3.9, { dur: 1.2, gain: 0.6 }); k.play('thud', 5.1, { gain: 0.5 }); k.play('pluck', 4.9, { note: 'E5' });
      for (let i = 0; i < 7; i++) k.play('pluck', 5.3 + i * 0.4, { note: ['E5', 'G5', 'A5', 'B5', 'D6', 'E6', 'G6'][i] });
      k.play('whoosh', 7.6, { dur: 0.7 }); k.play('whoosh', 8.25, { dur: 0.6, up: false });
      k.play('count', 8.6, { dur: 1.5 }); k.play('swell', 10.0, { dur: 2, chord: ['E4', 'G#4', 'B4', 'E5'] }); k.play('stamp', 10.0, { gain: 0.6 });
      k.play('chime', 11.2, { note: 'E6' });
    },
  };
  MS.register(style);
})();
