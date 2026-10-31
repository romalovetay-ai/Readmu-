// Soft 3D Clay (Dimensional). Puffy matte-clay objects on a seamless pastel sweep: chunky extrusion, broad core
// shadow, bright bounce-light rim along the bottom, glossy specular blob, blurry contact shadows that breathe with
// the bob, depth-of-field on far props, squash-and-stretch pops, clay-tube arrows and a clay-curtain scene change.
(function () {
  const P = { sweep: '#f3eeff', sweep2: '#fdfbff', lav: '#a99cff', violet: '#7d6bf0', pink: '#ff8fa8', peach: '#ffc2a8', mint: '#a6e3d2',
    sky: '#9fd3ff', butter: '#ffe08a', ink: '#4b3a8c', white: '#ffffff', coral: '#ff7a68' };
  const FONT = 'Fredoka';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  const dark = (c, k) => K.rgba(K.mix(c, '#4a2f86', k));
  const light = (c, k) => K.rgba(K.mix(c, '#ffffff', k));

  // Shape paths (add to the current path, no beginPath) so they can be combined for the inner-shadow trick.
  const pillPath = (x, y, w, h, r) => (c) => c.roundRect(x, y, w, h, r ?? h / 2);
  const circlePath = (x, y, r) => (c) => { c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2); };
  const bubblePath = (x, y, w, h, r) => (c) => { c.roundRect(x, y, w, h, r); c.moveTo(x + w * 0.2, y + h - 4); c.lineTo(x + w * 0.12, y + h + h * 0.32); c.lineTo(x + w * 0.38, y + h - 4); c.closePath(); };
  const ringPath = (x, y, R, r) => (c) => { c.moveTo(x + R, y); c.arc(x, y, R, 0, Math.PI * 2); c.moveTo(x + r, y); c.arc(x, y, r, 0, Math.PI * 2, true); };

  // Render one clay body into ctx: extrusion, base, core light/shadow, inner-shadow core, bounce rim, specular.
  function clayBody(x, path, b, col, o = {}) {
    const m = Math.min(b.w, b.h), d = (o.depth ?? 0.1) * m;
    x.save();
    x.beginPath(); x.save(); x.translate(0, d); path(x); x.restore(); x.fillStyle = dark(col, 0.3); x.fill('evenodd');
    x.beginPath(); path(x); x.fillStyle = col; x.fill('evenodd');
    x.save(); x.beginPath(); path(x); x.clip('evenodd');
    const g = x.createLinearGradient(b.x, b.y, b.x + b.w * 0.45, b.y + b.h);
    g.addColorStop(0, 'rgba(255,255,255,0.38)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,30,120,0.16)');
    x.fillStyle = g; x.fillRect(b.x - 10, b.y - 10, b.w + 20, b.h + 20);
    const ring = () => { x.beginPath(); x.rect(b.x - m * 3, b.y - m * 3, b.w + m * 6, b.h + m * 6); path(x); };
    // core shadow hugging the lower right edges
    x.shadowColor = 'rgba(70,35,130,0.42)'; x.shadowBlur = m * 0.28; x.shadowOffsetX = -m * 0.05; x.shadowOffsetY = -m * 0.1; ring(); x.fillStyle = '#000'; x.fill('evenodd');
    // bounce light: a thin bright rim along the bottom edge
    x.shadowColor = 'rgba(255,255,255,0.85)'; x.shadowBlur = m * 0.07; x.shadowOffsetX = 0; x.shadowOffsetY = -m * 0.035; ring(); x.fill('evenodd');
    // soft top edge highlight
    x.shadowColor = 'rgba(255,255,255,0.55)'; x.shadowBlur = m * 0.12; x.shadowOffsetX = m * 0.02; x.shadowOffsetY = m * 0.05; ring(); x.fill('evenodd');
    x.restore();
    // glossy specular blob
    const sx = b.x + b.w * (o.specX ?? 0.24), sy = b.y + b.h * (o.specY ?? 0.24), sr = m * 0.2;
    const sg = x.createRadialGradient(sx, sy, 0, sx, sy, sr); sg.addColorStop(0, 'rgba(255,255,255,0.9)'); sg.addColorStop(0.45, 'rgba(255,255,255,0.35)'); sg.addColorStop(1, 'rgba(255,255,255,0)');
    x.fillStyle = sg; x.beginPath(); x.ellipse(sx, sy, sr * 1.3, sr * 0.75, -0.5, 0, Math.PI * 2); x.fill();
    x.restore();
  }
  // Puffy lettering: darker extrusion stack, soft gradient face, tiny highlight.
  function puffyText(x, text, px, py, size, col, o = {}) {
    x.save(); x.font = K.font(size, FONT, 700); x.textAlign = o.align || 'left'; x.textBaseline = o.baseline || 'alphabetic';
    const dep = Math.max(2, size * 0.07);
    x.fillStyle = dark(col === '#ffffff' ? P.violet : col, col === '#ffffff' ? 0.15 : 0.35);
    for (let i = dep; i > 0; i -= 1) x.fillText(text, px, py + i);
    const g = x.createLinearGradient(0, py - size * 0.8, 0, py);
    g.addColorStop(0, light(col, 0.35)); g.addColorStop(1, col);
    x.fillStyle = g; x.fillText(text, px, py);
    x.globalCompositeOperation = 'source-atop'; x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(0, 0, 1, 1);
    x.restore();
  }
  // Cache a clay sprite (with padding for extrusion/shadow); returns {cv, ox, oy}.
  function sprite(key, w, h, draw, blur = 0) {
    return K.cached('clay:' + key + ':' + blur, () => {
      const pad = Math.ceil(Math.max(w, h) * 0.25 + 10), cv = K.layer(w + pad * 2, h + pad * 2), x = cv.getContext('2d');
      x.translate(pad, pad); draw(x);
      if (!blur) return { cv, ox: pad, oy: pad };
      const c2 = K.layer(cv.width, cv.height), y = c2.getContext('2d'); y.filter = `blur(${blur}px)`; y.drawImage(cv, 0, 0);
      return { cv: c2, ox: pad, oy: pad };
    });
  }
  // Blurry contact shadow on the sweep (smaller and sharper when the object is close to the floor).
  function contact(ctx, cx, cy, w, lift, s) {
    const k = 1 / (1 + lift / (60 * s)), rx = w * 0.5 * (1.1 - 0.3 * k), ry = rx * 0.18;
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx);
    g.addColorStop(0, `rgba(90,60,170,${0.28 * k + 0.05})`); g.addColorStop(1, 'rgba(90,60,170,0)');
    ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx); ctx.translate(-cx, -cy); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, rx, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  }
  // Draw a sprite centred at (cx, cy) with squash/stretch scale.
  function put(ctx, sp, cx, cy, w, h, sx = 1, sy = 1, alpha = 1) {
    ctx.save(); ctx.globalAlpha = alpha; ctx.translate(cx, cy + h / 2); ctx.scale(sx, sy); ctx.drawImage(sp.cv, -w / 2 - sp.ox, -h - sp.oy); ctx.restore();
  }
  // Squash and stretch for a pop at progress p (0..1+): returns [sx, sy, dropOffset].
  function squash(p) {
    if (p <= 0) return [0, 0, 0];
    const fall = K.clamp(p / 0.35), drop = (1 - K.ease.in(fall)) * -1;
    const tt = Math.max(0, p - 0.35), w = Math.exp(-6 * tt) * Math.sin(tt * 22) * (p > 0.35 ? 1 : 0);
    const st = p < 0.35 ? 0.12 * fall : 0;
    return [1 - st + w * 0.18, 1 + st - w * 0.2, drop];
  }

  const style = {
    id: 'soft-3d', name: 'Soft 3D Clay', family: 'Dimensional',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=block', specs: ['700 60px "Fredoka"', '600 30px "Fredoka"'] }],
    palette: { ...P },
    sfx: { draw: null, land: 'pop', emphasis: 'chime', transition: 'thud', bed: 'room' },

    background(ctx, W, H, t) {
      const cv = K.cached(`clay-sweep:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d');
        const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#efe9ff'); g.addColorStop(0.55, P.sweep); g.addColorStop(0.62, '#f6f2ff'); g.addColorStop(1, '#e9e2fb');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        const r = x.createRadialGradient(W * 0.5, H * 0.35, 0, W * 0.5, H * 0.35, Math.max(W, H) * 0.65); r.addColorStop(0, 'rgba(255,255,255,0.85)'); r.addColorStop(1, 'rgba(255,255,255,0)');
        x.fillStyle = r; x.fillRect(0, 0, W, H);
        return c;
      });
      ctx.drawImage(cv, 0, 0);
      // far props, out of focus (depth of field), bobbing slowly
      const s = S(W, H);
      const props = [[0.06, 0.2, 34, P.mint, 'ball', 4], [0.94, 0.16, 26, P.butter, 'ball', 4], [0.9, 0.88, 46, P.lav, 'ball', 5], [0.08, 0.86, 60, P.peach, 'donut', 3]];
      props.forEach(([fx, fy, r, col, kind, bl], i) => {
        const R = r * s, sp = sprite(`prop${i}:${Math.round(R)}`, R * 2, R * 2, (x) => clayBody(x, kind === 'donut' ? ringPath(R, R, R, R * 0.42) : circlePath(R, R, R), { x: 0, y: 0, w: R * 2, h: R * 2 }, col, { depth: 0.06 }), Math.round(bl * s));
        const bob = Math.sin(t * 1.2 + i * 1.9) * 8 * s;
        ctx.drawImage(sp.cv, fx * W - R - sp.ox, fy * H - R - sp.oy + bob);
      });
    },
    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.12, '#8a78d8');
      K.grain(ctx, W, H, t, 0.025, 24, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 60) * s, lines = String(text).split('\n'), lh = size * 1.1;
      let w = 0;
      ctx.save(); ctx.font = K.font(size, FONT, 700);
      lines.forEach((l, li) => {
        const lw = ctx.measureText(l).width; w = Math.max(w, lw);
        const q = K.clamp(p * lines.length * 1.2 - li * 0.9); if (q <= 0) return;
        const [sx, sy, drop] = squash(q * 1.4);
        ctx.save(); const cy = y + li * lh; ctx.translate(x, cy); ctx.scale(sx, sy); ctx.translate(0, drop * 40 * s);
        puffyText(ctx, l, 0, 0, size, o.color || P.violet, { align: o.align || 'center' }); ctx.restore();
      });
      ctx.restore();
      return { w, h: lh * lines.length };
    },
    // Squishy pill that springs on with squash and stretch.
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 30) * s; if (p <= 0) return { w: 0, h: 0 };
      ctx.save(); ctx.font = K.font(size, FONT, 600); const tw = ctx.measureText(text).width; ctx.restore();
      const h = size * 1.9, w = tw + size * 1.6, col = o.color || P.lav;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      const sp = sprite(`pill:${text}:${Math.round(size)}:${col}`, w, h + h * 0.12, (c) => {
        clayBody(c, pillPath(0, 0, w, h), { x: 0, y: 0, w, h }, col, { depth: 0.12, specX: 0.12, specY: 0.28 });
        puffyText(c, text, w / 2, h / 2 + size * 0.36, size, o.text || '#ffffff', { align: 'center' });
      });
      const [sx, sy, drop] = squash(K.clamp(p) * 1.6);
      const lift = -drop * 34 * s;
      contact(ctx, x0 + w / 2, y + h * 0.62, w * 0.9, lift, s);
      put(ctx, sp, x0 + w / 2, y + drop * 34 * s, w, h, sx, sy);
      return { w, h };
    },
    // Puffy clay tube with a blobby head.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.2, 50), q = K.trim(pts, K.clamp(p)), col = o.color || P.lav, w = (o.width || 13) * s;
      if (q.length < 2) return null;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(90,60,170,0.13)'; ctx.lineWidth = w * 1.1; ctx.save(); ctx.translate(4 * s, w * 0.9); K.poly(ctx, q); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = dark(col, 0.32); ctx.lineWidth = w; ctx.save(); ctx.translate(0, w * 0.18); K.poly(ctx, q); ctx.stroke(); ctx.restore();
      ctx.strokeStyle = col; ctx.lineWidth = w * 0.92; K.poly(ctx, q); ctx.stroke();
      ctx.strokeStyle = light(col, 0.55); ctx.lineWidth = w * 0.28; ctx.save(); ctx.translate(-w * 0.08, -w * 0.22); K.poly(ctx, q); ctx.stroke(); ctx.restore();
      const end = q[q.length - 1];
      if (p > 0.96) {
        const a = q[Math.max(0, q.length - 4)], ang = Math.atan2(end[1] - a[1], end[0] - a[0]), L = w * 1.6;
        ctx.save(); ctx.translate(end[0], end[1]); ctx.rotate(ang);
        const head = (c) => { c.moveTo(L * 0.5, 0); c.lineTo(-L * 0.6, -L * 0.75); c.lineTo(-L * 0.6, L * 0.75); c.closePath(); };
        ctx.lineWidth = w * 0.7; ctx.strokeStyle = dark(col, 0.32); ctx.fillStyle = dark(col, 0.32); ctx.save(); ctx.translate(0, 0); ctx.rotate(-ang); ctx.translate(0, w * 0.18); ctx.rotate(ang); ctx.beginPath(); head(ctx); ctx.fill(); ctx.stroke(); ctx.restore();
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.beginPath(); head(ctx); ctx.fill(); ctx.stroke();
        ctx.fillStyle = light(col, 0.6); ctx.beginPath(); ctx.arc(-L * 0.25, -L * 0.3, w * 0.22, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      }
      ctx.restore();
      return end;
    },
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), col = o.color || P.lav; if (p <= 0) return;
      const sp = sprite(`box:${Math.round(w)}x${Math.round(h)}:${col}:${o.kind || 'r'}`, w, h, (c) => clayBody(c, o.kind === 'bubble' ? bubblePath(0, 0, w, h, 34 * s) : pillPath(0, 0, w, h, (o.r || 30) * s), { x: 0, y: 0, w, h }, col, { depth: 0.08, specX: 0.12, specY: 0.2 }));
      const [sx, sy, drop] = squash(K.clamp(p) * 1.5);
      contact(ctx, x + w / 2, y + h + 22 * s, w, -drop * 80 * s + 14 * s, s);
      put(ctx, sp, x + w / 2, y + h / 2 + drop * 80 * s, w, h, sx, sy);
    },
    // Number inside a butter-yellow clay badge.
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 100) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, FONT, 700); const tw = ctx.measureText('1,000,000').width; ctx.restore();
      const w = tw + size * 0.9, h = size * 1.45;
      const sp = sprite(`badge:${Math.round(w)}x${Math.round(h)}`, w, h, (c) => clayBody(c, pillPath(0, 0, w, h), { x: 0, y: 0, w, h }, P.butter, { depth: 0.1, specX: 0.1, specY: 0.25 }));
      contact(ctx, x, y - size * 0.34 + h * 0.5 + 24 * s, w, 20 * s, s);
      put(ctx, sp, x, y - size * 0.34, w, h);
      puffyText(ctx, txt, x, y + size * 0.02, size, o.color || '#ffffff', { align: 'center' });
      return { w, h };
    },
    // Clay stars and balls popping out around the key moment.
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return;
      const items = [[-1.05, -0.55, P.pink, 'star', 30], [1.05, -0.6, P.sky, 'star', 26], [-0.95, 0.65, P.mint, 'ball', 16], [0.98, 0.55, P.coral, 'star', 22], [0, -0.95, P.butter, 'star', 24], [-0.5, -0.9, P.lav, 'ball', 12], [0.55, 0.92, P.pink, 'ball', 14]];
      items.forEach(([ux, uy, col, kind, rad], i) => {
        const q = K.clamp(p * 1.6 - i * 0.07); if (q <= 0) return;
        const R = rad * 1.6 * s, [sx, sy] = squash(q * 1.3), k = K.ease.back(K.clamp(q * 1.5));
        const sp = sprite(`emph:${kind}:${col}:${Math.round(R)}`, R * 2, R * 2, (c) => {
          if (kind === 'ball') return clayBody(c, circlePath(R, R, R), { x: 0, y: 0, w: R * 2, h: R * 2 }, col, { depth: 0.08 });
          const star = (cc) => { for (let j = 0; j < 10; j++) { const a = -Math.PI / 2 + (j / 10) * Math.PI * 2, rr = j % 2 ? R * 0.5 : R; cc[j ? 'lineTo' : 'moveTo'](R + Math.cos(a) * rr, R + Math.sin(a) * rr); } cc.closePath(); };
          c.lineJoin = 'round'; clayBody(c, star, { x: 0, y: 0, w: R * 2, h: R * 2 }, col, { depth: 0.1 });
        });
        const px = x + ux * r * k, py = y + uy * r * 0.42 * k + Math.sin(i + p * 6) * 3 * s;
        put(ctx, sp, px, py, R * 2, R * 2, sx, sy);
      });
    },
    // Scene change: fat pastel clay bars drop in with a bounce to fill the frame, then spring away upward.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), n = 5, bh = H / n, cols = [P.lav, P.pink, P.mint, P.butter, P.sky];
      for (let i = n - 1; i >= 0; i--) {
        const d = (n - 1 - i) * 0.09;
        let y;
        if (p < 0.5) { const k = K.clamp((p * 2 - d) / 0.55); if (k <= 0) continue; y = i * bh - (1 - K.ease.bounce(k)) * (i + 1.4) * bh; }
        else { const k = K.clamp(((p - 0.5) * 2 - (n - 1 - i) * 0.07) / 0.6); if (k >= 1) continue; y = i * bh - K.ease.in(k) * (i + 1.6) * bh; }
        const w = W + 120 * s, h = bh + 40 * s;
        const sp = sprite(`bar:${W}x${H}:${i}`, w, h, (c) => clayBody(c, pillPath(0, 0, w, h, 60 * s), { x: 0, y: 0, w, h }, cols[i], { depth: 0.12, specX: 0.08, specY: 0.25 }));
        ctx.drawImage(sp.cv, -60 * s - sp.ox, y - 20 * s - sp.oy);
      }
    },
    clayBody, puffyText, sprite,
  };

  // ---------- the shared demo: a pastel clay set ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const PCOLS = [P.pink, '#8f86a8', P.coral, '#6f6a86', P.sky, '#9d8fd0', '#7fa8ff'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, portrait: false, title: [W / 2, 112 * s], card: [90 * s, 280 * s, 240 * s, 160 * s], node: [420 * s, 290 * s, 330 * s, 120 * s],
      chips: PLATFORMS.map((n, i) => [890 * s, (196 + i * 70) * s]), node2: [W / 2 - 165 * s, 80 * s], counter: [W / 2, 380 * s], take: [W / 2, 640 * s] };
    return { s, portrait: true, title: [W / 2, H * 0.09], card: [W * 0.26, H * 0.17, W * 0.48, H * 0.11], node: [W * 0.18, H * 0.355, W * 0.64, H * 0.08],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.53 : W * 0.47, H * (0.545 + Math.floor(i / 2) * 0.08)]), node2: [W / 2 - 240 * s * 0.75, H * 0.2], counter: [W / 2, H * 0.47], take: [W / 2, H * 0.75] };
  }
  function nodeBubble(ctx, x, y, w, h, p, s, size) {
    style.box(ctx, x, y, w, h, p, { color: P.violet, kind: 'bubble' });
    if (p <= 0.2) return;
    const [sx, sy, drop] = squash(K.clamp(p) * 1.5);
    ctx.save(); ctx.translate(x + w / 2, y + h + drop * 80 * s); ctx.scale(sx, sy);
    puffyText(ctx, 'Creator OS', 0, -h / 2 + size * s * 0.36, size * s, '#ffffff', { align: 'center' }); ctx.restore();
  }
  function videoCard(ctx, x, y, w, h, p, s) {
    style.box(ctx, x, y, w, h, p, { color: P.pink, r: 34 });
    if (p <= 0.25) return;
    const [sx, sy, drop] = squash(K.clamp(p) * 1.5), R = Math.min(w, h) * 0.26;
    const sp = sprite(`play:${Math.round(R)}`, R * 2, R * 2, (c) => { c.lineJoin = 'round'; clayBody(c, (cc) => { cc.moveTo(R * 0.55, R * 0.25); cc.lineTo(R * 1.75, R); cc.lineTo(R * 0.55, R * 1.75); cc.closePath(); }, { x: 0, y: 0, w: R * 2, h: R * 2 }, '#ffffff', { depth: 0.1, specX: 0.35, specY: 0.35 }); });
    put(ctx, sp, x + w / 2 + R * 0.1, y + h / 2 + drop * 80 * s, R * 2, R * 2, sx, sy);
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait;
      style.background(ctx, W, H, t);
      const bob = (i) => Math.sin(t * 1.6 + i * 1.3) * 5 * s;
      if (t < 8.25) {
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.1, 1.3, 'lin'), { size: portrait ? 56 : 62 });
        const [vx, vy, vw, vh] = Lo.card;
        videoCard(ctx, vx, vy + bob(1), vw, vh, K.beat(t, 2.0, 0.8, 'lin'), s);
        if (portrait) style.label(ctx, 'your video', vx - 14 * s, vy + vh + 4 * s, K.beat(t, 2.7, 0.7, 'lin'), { color: P.coral, size: 28 });
        else style.label(ctx, 'your video', vx + vw / 2, vy + vh + 54 * s, K.beat(t, 2.7, 0.7, 'lin'), { color: P.coral, align: 'center', size: 28 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[W / 2 + 70 * s, vy + vh + 26 * s], [W / 2 + 70 * s, ny - 18 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 20 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.4, 0.7, 'out'), { bend: portrait ? 0 : -0.12, color: P.lav });
        nodeBubble(ctx, nx, ny + bob(2), nw, nh, K.beat(t, 4.0, 0.8, 'lin'), s, portrait ? 52 : 46);
        if (portrait) style.arrow(ctx, [W / 2, ny + nh + 40 * s], [W / 2, Lo.chips[6][1] - 10 * s], K.beat(t, 4.9, 0.5, 'out'), { bend: 0, width: 12, color: P.lav });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = portrait ? [W / 2, cy] : [nx + nw + 16 * s, ny + nh / 2], to = portrait ? [left ? W * 0.47 : W * 0.53, cy] : [cx - 12 * s, cy];
          if (!portrait) style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'out'), { bend: (i - 3) * -0.05, width: 9, color: PCOLS[i] });
          style.label(ctx, name, cx, cy + bob(i + 3) * 0.6, K.beat(t, t0 + 0.2, 0.7, 'lin'), { color: PCOLS[i], align: portrait ? (left ? 'right' : 'left') : 'left', size: 28 });
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      } else {
        const nw = (portrait ? 480 : 330) * s * (portrait ? 0.75 : 1), nh = (portrait ? 100 : 100) * s;
        nodeBubble(ctx, Lo.node2[0], Lo.node2[1] + bob(2), portrait ? 360 * s : 330 * s, nh, 1, s, portrait ? 44 : 42);
        void nw;
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000, [cx, cy] = Lo.counter;
        const pop = 1 + K.spring(t, 10.0, 0.09, 2.6, 6);
        ctx.save(); ctx.translate(cx, cy); ctx.scale(pop, 2 - pop); ctx.translate(-cx, -cy);
        style.counter(ctx, v, cx, cy + bob(5), 1, { size: portrait ? 84 : 100 });
        ctx.restore();
        style.label(ctx, 'views', cx, cy + (portrait ? 120 : 112) * s, K.beat(t, 8.7, 0.7, 'lin'), { color: P.mint, align: 'center', text: '#ffffff', size: 32 });
        style.emphasis(ctx, cx, cy - 40 * s, (portrait ? 400 : 430) * s, K.beat(t, 10.0, 0.9, 'lin'), {});
        style.title(ctx, portrait ? 'Post once.\nReach everywhere.' : 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: portrait ? 56 : 56 });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 0.8);
      k.play('pop', 0.3, { pitch: 0.6 }); k.play('pop', 0.75, { pitch: 0.75 });
      k.play('pop', 2.3, { pitch: 0.55 }); k.play('pluck', 2.45, { note: 'G4', gain: 0.6 }); k.play('pop', 3.0, { pitch: 0.9 });
      k.play('paper', 3.4, { dur: 0.6, gain: 0.5 }); k.play('pop', 4.3, { pitch: 0.5 }); k.play('pluck', 4.4, { note: 'C5', gain: 0.7 });
      const notes = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'];
      for (let i = 0; i < 7; i++) { k.play('paper', 5.0 + i * 0.4, { dur: 0.25, gain: 0.35 }); k.play('pop', 5.4 + i * 0.4, { pitch: 0.7 + i * 0.06 }); k.play('pluck', 5.45 + i * 0.4, { note: notes[i], gain: 0.4 }); }
      for (let i = 0; i < 5; i++) k.play('thud', 7.7 + i * 0.09, { gain: 0.35 });
      k.play('whoosh', 8.3, { dur: 0.6, up: false, gain: 0.6 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('pop', 10.0, { pitch: 0.6 }); k.play('chime', 10.05, { note: 'E6' });
      for (let i = 0; i < 5; i++) k.play('pop', 10.1 + i * 0.07, { pitch: 1.2 + i * 0.1, gain: 0.5 });
      k.play('chime', 11.3, { note: 'C6' });
    },
  };
  MS.register(style);
})();
