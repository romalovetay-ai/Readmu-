// Neon Sign at Night (Light & Imaging). Hand-bent glass tubes on an old brick wall after rain: unlit grey glass that
// stutters on letter by letter, white-hot cores inside saturated halos, painted-out blockout between segments,
// standoff clips, electrodes and a feed wire, light spilling over the brickwork and smearing in the wet pavement.
(function () {
  const ID = 'neon-sign';
  const C = { pink: '#ff3f8e', cyan: '#2fe6ff', amber: '#ffb13d', violet: '#a95cff', green: '#45ff8f', red: '#ff3030', warm: '#fff0dc', brick: '#5c2a20', night: '#07060a' };
  const F = 'Tilt Neon';
  const S = (W, H) => K.layout(W, H).s;
  const cw = (ctx) => [ctx.canvas.width, ctx.canvas.height];
  const horizon = (W, H) => H * (H > W ? 0.865 : 0.845);

  // ---------- plates ----------
  function wallPlate(W, H) {
    return K.cached(`${ID}:wall:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(12), hy = horizon(W, H);
      x.fillStyle = '#1a1110'; x.fillRect(0, 0, W, H);
      const bw = 74 * s, bh = 27 * s, m = 4 * s;
      for (let row = 0, y = -bh * 0.4; y < hy; row++, y += bh) {
        for (let bx = (row % 2) * -bw / 2; bx < W; bx += bw) {
          const k = r(), base = K.mix('#4e2119', '#7a3a29', k), dark = 0.75 + r() * 0.35;
          x.fillStyle = K.rgba(base.map((v) => v * dark));
          x.beginPath(); x.roundRect(bx + m / 2, y + m / 2, bw - m, bh - m, 2.5 * s); x.fill();
          // chipped corners + soot streak
          if (r() < 0.25) { x.fillStyle = 'rgba(20,12,10,0.6)'; x.beginPath(); x.arc(bx + (r() < 0.5 ? m : bw - m), y + (r() < 0.5 ? m : bh - m), 4 * s * r() + 2 * s, 0, 7); x.fill(); }
          x.fillStyle = 'rgba(255,220,200,0.05)'; x.fillRect(bx + m / 2, y + m / 2, bw - m, 2 * s);
        }
      }
      // grit
      const tile = K.layer(256, 256), tx = tile.getContext('2d'), img = tx.createImageData(256, 256), d = img.data, rr = K.rng(13);
      for (let i = 0; i < d.length; i += 4) { const v = 128 + (rr() - 0.5) * 110; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
      tx.putImageData(img, 0, 0);
      x.globalCompositeOperation = 'overlay'; x.globalAlpha = 0.5; x.fillStyle = x.createPattern(tile, 'repeat'); x.fillRect(0, 0, W, hy);
      // mottled grime + night falloff
      x.globalAlpha = 1; x.globalCompositeOperation = 'multiply';
      const nz = K.noise(14);
      for (let i = 0; i < 40; i++) { const px = r() * W, py = r() * hy, rad = (60 + r() * 200) * s, g = x.createRadialGradient(px, py, 0, px, py, rad); g.addColorStop(0, `rgba(40,30,30,${0.4 + nz.n2(i, 1) * 0.3})`); g.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
      x.globalCompositeOperation = 'source-over';
      const g = x.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, 'rgba(4,3,6,0.72)'); g.addColorStop(0.5, 'rgba(4,3,6,0.5)'); g.addColorStop(1, 'rgba(4,3,6,0.62)');
      x.fillStyle = g; x.fillRect(0, 0, W, hy);
      // wet pavement
      const pg = x.createLinearGradient(0, hy, 0, H); pg.addColorStop(0, '#0d0c10'); pg.addColorStop(1, '#040406');
      x.fillStyle = pg; x.fillRect(0, hy, W, H - hy);
      x.fillStyle = 'rgba(160,160,180,0.10)'; x.fillRect(0, hy, W, 2 * s);
      x.globalAlpha = 0.25; x.globalCompositeOperation = 'overlay'; x.fillStyle = x.createPattern(tile, 'repeat'); x.fillRect(0, hy, W, H - hy);
      return c;
    });
  }
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

  // ---------- tube primitives ----------
  const MEAS = new Map();
  function offsets(ctx, text) {
    const key = ctx.font + '|' + text;
    if (!MEAS.has(key)) { const xs = []; for (let i = 0; i <= text.length; i++) xs.push(ctx.measureText(text.slice(0, i)).width); MEAS.set(key, xs); }
    return MEAS.get(key);
  }
  // Letter i ignition at progress p: stutters on/off in seeded steps, then holds.
  function ignite(p, i, n, seed) {
    const p0 = (i / Math.max(1, n)) * 0.7, d = K.clamp((p - p0) / 0.2);
    if (d <= 0) return 0; if (d >= 1) return 1;
    return K.rng(seed * 131 + i * 17 + Math.floor(d * 12))() < 0.3 + 0.6 * d ? 1 : 0.12;
  }
  function neonText(ctx, text, x, y, o) {
    const [W, H] = cw(ctx), s = S(W, H), size = o.size * s, col = o.color || C.pink;
    ctx.save(); ctx.font = K.font(size, o.font || F, 400); ctx.textBaseline = 'alphabetic';
    const xs = offsets(ctx, text), tw = xs[text.length], x0 = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
    // unlit glass + standoff clips
    ctx.fillStyle = K.rgba(K.mix(col, '#34343a', 0.84), 0.7); ctx.fillText(text, x0, y);
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillText(text, x0, y - 1.2 * s);
    if (o.clips !== false) { ctx.fillStyle = '#4a4a50'; for (let k = 1; k <= Math.max(1, Math.floor(tw / (160 * s))); k++) { const cx = x0 + (tw * k) / (Math.floor(tw / (160 * s)) + 1); ctx.fillRect(cx - 2 * s, y + size * 0.06, 4 * s, size * 0.16); } }
    // lit runs
    const lv = [...text].map((ch, i) => (ch === ' ' ? 0 : o.level(i)));
    let i = 0;
    while (i < text.length) {
      const L = Math.round(lv[i] * 10) / 10; let j = i + 1;
      while (j < text.length && Math.round(lv[j] * 10) / 10 === L) j++;
      if (L > 0.02) {
        const str = text.slice(i, j), rx = x0 + xs[i];
        ctx.globalAlpha = L;
        ctx.shadowColor = col; ctx.shadowBlur = 24 * s; ctx.strokeStyle = col; ctx.lineWidth = size * 0.05; ctx.lineJoin = 'round';
        ctx.strokeText(str, rx, y); ctx.shadowBlur = 10 * s; ctx.fillStyle = col; ctx.fillText(str, rx, y);
        ctx.shadowBlur = 0; ctx.fillStyle = K.rgba(K.mix(col, '#ffffff', o.core ?? 0.62)); ctx.fillText(str, rx, y);
      }
      i = j;
    }
    ctx.restore();
    return { w: tw, h: size, x0 };
  }
  // A bent tube along a polyline. Unlit glass always shows; lit part = first p (by length), optional dash segments.
  function tube(ctx, pts, lit, col, s, o = {}) {
    const lw = (o.lw || 6) * s;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (o.dash) ctx.setLineDash(o.dash.map((d) => d * s));
    ctx.strokeStyle = K.rgba(K.mix(col, '#34343a', 0.84), 0.75); ctx.lineWidth = lw; K.poly(ctx, pts); ctx.stroke();
    const level = o.level ?? 1, q = K.trim(pts, lit);
    if (lit > 0 && q.length > 1 && level > 0.02) {
      ctx.globalAlpha = level;
      ctx.shadowColor = col; ctx.shadowBlur = 22 * s; ctx.strokeStyle = col; ctx.lineWidth = lw * 1.15; K.poly(ctx, q); ctx.stroke();
      ctx.shadowBlur = 0; ctx.strokeStyle = K.rgba(K.mix(col, '#ffffff', 0.75)); ctx.lineWidth = lw * 0.45; K.poly(ctx, q); ctx.stroke();
    }
    ctx.restore();
  }
  function electrode(ctx, pt, ang, s) {
    ctx.save(); ctx.translate(pt[0], pt[1]); ctx.rotate(ang); ctx.fillStyle = '#26262b'; ctx.fillRect(-14 * s, -5 * s, 14 * s, 10 * s); ctx.fillStyle = '#55555c'; ctx.fillRect(-14 * s, -5 * s, 3 * s, 10 * s); ctx.restore();
  }
  function roundRectPts(x, y, w, h, r, n = 8) {
    const pts = [], arc = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (Math.PI / 2) * (i / n); pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    pts.push([x + r + 6, y]);
    pts.push([x + w - r, y]); arc(x + w - r, y + r, -Math.PI / 2); arc(x + w - r, y + h - r, 0); arc(x + r, y + h - r, Math.PI / 2); arc(x + r, y + r, Math.PI);
    pts.push([x + r - 6, y]);
    return pts;
  }

  const style = {
    id: ID, name: 'Neon Sign at Night', family: 'Light & Imaging',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Tilt+Neon&display=block', specs: ['400 56px "Tilt Neon"'] }],
    palette: { bg: C.night, ...C },
    sfx: { draw: null, land: 'click', emphasis: 'blip', transition: 'whoosh', bed: 'hum' },
    setup(W, H) { wallPlate(W, H); },

    background(ctx, W, H, t) { ctx.drawImage(wallPlate(W, H), 0, 0); },

    finish(ctx, W, H, t) {
      const s = S(W, H), hy = horizon(W, H), rh = H - hy;
      // reflection in the wet pavement: flipped, blurred, broken into rippling strips
      const sw = Math.ceil(W / 2), sh2 = Math.ceil(rh / 2);
      const src = K.cached(`${ID}:refl:${sw}x${sh2}`, () => K.layer(sw, sh2)), sx = src.getContext('2d');
      sx.save(); sx.globalCompositeOperation = 'copy'; sx.filter = 'blur(1.6px)'; sx.setTransform(1, 0, 0, -1, 0, sh2);
      sx.drawImage(ctx.canvas, 0, hy - rh, W, rh, 0, 0, sw, sh2); sx.restore();
      const strip = 5 * s, n = Math.ceil(rh / strip);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let j = 0; j < n; j++) {
        const k = j / n, dx = Math.sin(j * 0.9 + t * 7) * (1.5 + 7 * k) * s + Math.sin(j * 0.23 - t * 2) * 3 * s;
        ctx.globalAlpha = 0.55 * (1 - k * 0.85);
        ctx.drawImage(src, 0, (j * strip) / 2, sw, strip / 2, dx, hy + j * strip, W, strip + 0.5);
      }
      ctx.restore();
      // rain drops landing in the puddle
      ctx.save(); ctx.strokeStyle = 'rgba(200,210,255,0.22)'; ctx.lineWidth = 1.2 * s;
      for (let i = 0; i < 7; i++) {
        const per = 1.3, ph = (t + i * 0.37) / per, cyc = Math.floor(ph), k = ph - cyc, r = K.rng(i * 97 + cyc * 13);
        const px = r() * W, py = hy + (0.15 + r() * 0.8) * rh;
        ctx.globalAlpha = 1 - k; ctx.beginPath(); ctx.ellipse(px, py, k * 26 * s, k * 6 * s, 0, 0, 7); ctx.stroke();
      }
      ctx.restore();
      // spill on the bricks: tight halo + wide wash
      bloom(ctx, W, H, 4, 3, 0.45, 0.65);
      bloom(ctx, W, H, 8, 10, 0.22, 1.25);
      K.vignette(ctx, W, H, 0.6, '#000');
      K.grain(ctx, W, H, t, 0.06, 24, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), size = o.size || 60, seed = o.seed || 3;
      ctx.save(); ctx.font = K.font(size * s, F, 400);
      let lines = [text];
      if (o.maxW && ctx.measureText(text).width > o.maxW) lines = K.wrap(ctx, text, o.maxW);
      ctx.restore();
      const lh = size * s * 1.18, n = text.length; let base = 0, maxw = 0;
      lines.forEach((ln, li) => {
        const off = base;
        const r = neonText(ctx, ln, x, y - (lines.length - 1 - li) * lh, { size, color: o.color || C.pink, align: o.align, clips: o.clips,
          level: (i) => { let v = ignite(p, off + i, n, seed); if (o.t != null && o.flicker === off + i && p >= 1) v = K.rng(Math.floor(o.t * 18) * 7 + 1)() < 0.22 ? 0.15 : 1; return v; } });
        base += ln.length + 1; maxw = Math.max(maxw, r.w);
      });
      return { w: maxw, h: lh * lines.length };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 34, color: C.cyan, ...o }); },

    // Chase-light arrow: segmented tube (painted-out gaps) igniting toward the target, chevron head last.
    arrow(ctx, from, to, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), col = o.color || C.amber;
      const pts = K.arcPts(from, to, o.bend ?? 0.12, 40), sp = K.clamp(p / 0.82);
      if (p <= 0) { tube(ctx, pts, 0, col, s, { lw: 5, dash: [20, 9] }); return null; }
      tube(ctx, pts, sp, col, s, { lw: 5, dash: [20, 9] });
      const b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hs = 20 * s;
      const head = [[b[0] - Math.cos(ang - 0.6) * hs, b[1] - Math.sin(ang - 0.6) * hs], b, [b[0] - Math.cos(ang + 0.6) * hs, b[1] - Math.sin(ang + 0.6) * hs]];
      const hl = p > 0.82 ? (K.rng(Math.floor(p * 40) + 5)() < 0.4 + (p - 0.82) * 4 ? 1 : 0.15) : 0;
      tube(ctx, head, 1, col, s, { lw: 5, level: p >= 1 ? 1 : hl });
      return K.trim(pts, sp).pop();
    },

    // Rectangular frame tube with clips and an electrode at the join; buzzes on in stutters.
    box(ctx, x, y, w, h, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), col = o.color || C.violet, r = Math.min(26 * s, h / 3);
      const pts = roundRectPts(x, y, w, h, r);
      const lv = p <= 0.25 ? 0 : p >= 0.9 ? 1 : (K.rng(Math.floor(p * 30) * 3 + (o.seed || 1))() < p ? 1 : 0.12);
      tube(ctx, pts, 1, col, s, { lw: o.lw || 6, level: lv });
      electrode(ctx, pts[0], Math.PI, s); electrode(ctx, pts[pts.length - 1], 0, s);
      ctx.save(); ctx.fillStyle = '#5a5a62';
      for (const [cx, cy] of [[x + w * 0.25, y], [x + w * 0.75, y], [x + w * 0.25, y + h], [x + w * 0.75, y + h], [x, y + h / 2], [x + w, y + h / 2]]) ctx.fillRect(cx - 3 * s, cy - 3 * s, 6 * s, 6 * s);
      ctx.restore();
    },

    // Neon digits; a digit dims and re-lights each time it changes.
    counter(ctx, value, x, y, p, o = {}) {
      const text = K.fmt(Math.round(value)), digs = text.replace(/,/g, '').length;
      let di = 0; const lvl = [];
      for (const ch of text) { if (ch === ',') { lvl.push(1); continue; } const pow = digs - 1 - di++; const f = (value / Math.pow(10, pow)) % 1; lvl.push(value >= (o.to || 1e6) ? 1 : f < 0.12 && pow < 5 ? 0.25 : 1); }
      const [W, H] = cw(ctx);
      return neonText(ctx, text, x, y, { size: o.size || 120, color: o.color || C.amber, align: o.align || 'center', clips: false, level: (i) => (p <= 0 ? 0 : lvl[i] * K.clamp(p * 3)) });
    },

    // Blinking red oval tube with four rays, like a "look here" sign.
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), col = o.color || C.red, rx = r * (o.wide ?? 1.35), ry = r * (o.tall ?? 0.62);
      const blink = p < 0.7 ? (Math.floor(p * 9) % 2 === 0 ? 1 : 0.1) : 1;
      tube(ctx, K.circlePts(x, y, rx, ry, 72, -Math.PI / 2 + 0.12, Math.PI * 2 - 0.24), 1, col, s, { lw: 6, level: blink });
      const rays = [[-0.75, 1], [-0.25, 1], [0.25, 1], [0.75, 1]];
      ctx.save();
      for (const [a] of rays) {
        const ang = -Math.PI / 2 + a, c = Math.cos(ang), sn = Math.sin(ang);
        tube(ctx, [[x + c * (rx + 14 * s), y + sn * (ry + 14 * s)], [x + c * (rx + 40 * s), y + sn * (ry + 40 * s)]], 1, col, s, { lw: 5, level: p > 0.35 ? blink : 0 });
      }
      ctx.restore();
    },

    // Whip-pan along the wall: the frame slides and smears into horizontal streaks, the next sign slides in.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), k = Math.sin(Math.PI * p);
      const tmp = K.cached(`${ID}:tmp:${W}x${H}`, () => K.layer(W, H)), tx = tmp.getContext('2d');
      tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, 0, 0);
      const dx = p < 0.5 ? -K.ease.in(p * 2) * W * 0.7 : (1 - K.ease.out((p - 0.5) * 2)) * W * 0.7;
      ctx.save();
      ctx.globalCompositeOperation = 'copy'; ctx.globalAlpha = 1; ctx.drawImage(wallPlate(W, H), ((dx % (148 * s)) + 148 * s) % (148 * s) - 148 * s, 0);
      ctx.globalCompositeOperation = 'source-over';
      const n = 10, spread = k * 120 * s;
      for (let i = 0; i < n; i++) { ctx.globalAlpha = (1 - k * 0.75) * (i === 0 ? 1 : 0.32); ctx.drawImage(tmp, dx + (i / (n - 1) - 0.5) * spread, 0); }
      // streaks
      ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = k * 0.5;
      ctx.drawImage(tmp, 0, 0, W, H, dx - W * 0.3 * k, 0, W * (1 + 0.6 * k), H);
      ctx.restore();
    },
  };

  // ---------- the shared demo: signs lighting up one by one along one wall ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [C.pink, C.cyan, C.red, C.amber, C.cyan, C.violet, C.green];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 92 * s], video: [96 * s, 236 * s, 250 * s, 156 * s], node: [478 * s, 250 * s, 310 * s, 128 * s],
      chips: PLATFORMS.map((n, i) => [946 * s, (170 + i * 62) * s]), node2: [W / 2 - 150 * s, 40 * s, 300 * s, 104 * s], counter: [W / 2, 340 * s], views: 468 * s, take: 568 * s };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.15, W * 0.5, H * 0.115], node: [W * 0.15, H * 0.37, W * 0.7, H * 0.08],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.54 + Math.floor(i / 2) * 0.085)]), node2: [W * 0.15, H * 0.11, W * 0.7, H * 0.08], counter: [W / 2, H * 0.37], views: H * 0.475, take: H * 0.68 };
  }
  function tvSign(ctx, x, y, w, h, p, s) {
    style.box(ctx, x, y, w, h, p, { color: C.cyan, seed: 21 });
    const cx = x + w / 2, cy = y + h / 2, r = h * 0.26;
    const lv = p < 0.6 ? 0 : p > 0.9 ? 1 : (K.rng(Math.floor(p * 40) + 2)() < 0.5 ? 1 : 0.1);
    tube(ctx, [[cx - r * 0.6, cy - r], [cx + r, cy], [cx - r * 0.6, cy + r], [cx - r * 0.6, cy - r]], 1, C.pink, s, { lw: 6, level: lv });
    tube(ctx, [[x + w * 0.3, y + h + 4 * s], [x + w * 0.22, y + h + 22 * s]], 1, C.cyan, s, { lw: 5, level: p > 0.9 ? 1 : 0 });
    tube(ctx, [[x + w * 0.7, y + h + 4 * s], [x + w * 0.78, y + h + 22 * s]], 1, C.cyan, s, { lw: 5, level: p > 0.9 ? 1 : 0 });
  }
  function wire(ctx, a, b, s) { ctx.save(); ctx.strokeStyle = '#121214'; ctx.lineWidth = 2.5 * s; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.bezierCurveTo(a[0] + 30 * s, a[1] + 60 * s, b[0] - 20 * s, b[1] - 40 * s, b[0], b[1]); ctx.stroke(); ctx.restore(); }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        const [nx, ny, nw, nh] = Lo.node, [vx, vy, vw, vh] = Lo.video;
        wire(ctx, [nx + nw - 30 * s, ny + nh], [nx + nw + 40 * s, horizon(W, H)], s);
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.5, 'lin'), { size: P ? 58 : 58, align: 'center', color: C.pink, t, flicker: 22, maxW: W * 0.88 });
        tvSign(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.9, 'lin'), s);
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + (P ? 64 : 66) * s, K.beat(t, 2.7, 0.6, 'lin'), { align: 'center', color: C.amber, size: 34 });
        const a1 = P ? [[vx + vw / 2, vy + vh + 88 * s], [nx + nw / 2, ny - 16 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 20 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.8, 'lin'), { bend: P ? 0 : -0.1, color: C.amber });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.8, 'lin'), { color: C.violet, seed: 41 });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 17 * s, K.beat(t, 4.4, 0.6, 'lin'), { size: P ? 46 : 50, align: 'center', color: C.cyan, clips: false, seed: 9 });
        if (P) style.arrow(ctx, [W / 2, ny + nh + 16 * s], [W / 2, Lo.chips[6][1] + 2 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0, color: C.violet });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.36, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 16 * s, ny + nh / 2];
          const to = P ? [left ? W * 0.42 : W * 0.58, cy - 12 * s] : [cx - 20 * s, cy - 11 * s];
          if (!P) style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: (i - 3) * 0.035, color: COLS[i] });
          else style.arrow(ctx, from, to, K.beat(t, t0, 0.3, 'lin'), { bend: 0, color: COLS[i] });
          style.label(ctx, name, P ? (left ? W * 0.4 : W * 0.6) : cx, cy, K.beat(t, t0 + 0.25, 0.4, 'lin'), { size: P ? 40 : 34, color: COLS[i], align: P ? (left ? 'right' : 'left') : 'left', seed: 60 + i, clips: false });
        });
      } else {
        const [x2, y2, w2, h2] = Lo.node2;
        wire(ctx, [x2 + w2 - 30 * s, y2 + h2], [x2 + w2 + 60 * s, horizon(W, H)], s);
        style.box(ctx, x2, y2, w2, h2, 1, { color: C.violet });
        style.title(ctx, 'Creator OS', W / 2, y2 + h2 / 2 + 17 * s, 1, { size: P ? 46 : 50, align: 'center', color: C.cyan, clips: false });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, v, Lo.counter[0], Lo.counter[1], K.beat(t, 8.45, 0.3, 'lin'), { size: P ? 110 : 120, color: C.amber });
        style.label(ctx, 'views', W / 2, Lo.views, K.beat(t, 8.8, 0.5, 'lin'), { align: 'center', color: C.cyan, size: 38, seed: 77 });
        style.emphasis(ctx, W / 2, Lo.counter[1] - (P ? 30 : 38) * s, (P ? 245 : 270) * s, K.beat(t, 10.0, 0.8, 'lin'), { tall: P ? 0.42 : 0.4 });
        style.title(ctx, 'Post once. Reach everywhere.', W / 2, Lo.take, K.beat(t, 10.45, 1.0, 'lin'), { size: P ? 56 : 50, align: 'center', color: C.pink, t, flicker: 13, maxW: W * 0.88, seed: 5 });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), { t });
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 1.3); k.bed('tape', 0, 12, 1.4);
      k.play('click', 0.15, { pitch: 0.5 }); k.play('glitch', 0.2, { gain: 0.5 }); k.play('glitch', 0.75, { gain: 0.4 }); k.play('glitch', 1.25, { gain: 0.35 });
      k.play('click', 2.0, { pitch: 0.5 }); k.play('glitch', 2.3, { gain: 0.45 }); k.play('click', 2.7, { pitch: 0.6 }); k.play('glitch', 2.85, { gain: 0.35 });
      for (let i = 0; i < 6; i++) k.play('tick', 3.3 + i * 0.13, { pitch: 0.7 + i * 0.05, gain: 0.7 });
      k.play('click', 4.0, { pitch: 0.5 }); k.play('glitch', 4.3, { gain: 0.5 }); k.play('pluck', 4.75, { note: 'G3', gain: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('tick', 5.0 + i * 0.36, { pitch: 0.8, gain: 0.6 }); k.play('click', 5.28 + i * 0.36, { pitch: 0.55 + i * 0.04 }); k.play('glitch', 5.32 + i * 0.36, { gain: 0.22 }); }
      k.play('whoosh', 7.6, { dur: 0.65 }); k.play('whoosh', 8.25, { dur: 0.6, up: false });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('blip', 10.0, { note: 'A4', dur: 0.09 }); k.play('blip', 10.18, { note: 'A4', dur: 0.09 }); k.play('blip', 10.36, { note: 'A4', dur: 0.09 }); k.play('thud', 10.56, { gain: 0.6 });
      k.play('click', 10.45, { pitch: 0.5 }); k.play('glitch', 10.7, { gain: 0.35 }); k.play('chime', 11.45, { note: 'E5' });
    },
  };
  MS.register(style);
})();
