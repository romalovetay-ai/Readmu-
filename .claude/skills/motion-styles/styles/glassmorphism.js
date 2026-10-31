// Glassmorphism UI (Dimensional). Vivid drifting colour blobs and glossy orbs under frosted panels that genuinely blur
// what is behind them (each panel samples the frame so far, so glass over glass frosts the card under it too), with a
// 1px light border, a diagonal specular sheen, fine frost grain, glowing gradient connectors and a progress-ring hit.
(function () {
  const P = { base: '#12082e', base2: '#070418', magenta: '#ff2bd6', pink: '#ff4fc1', orange: '#ff7a1a', violet: '#7a2bff',
    cyan: '#00d1ff', blue: '#3b6bff', mint: '#4dffa6', white: '#ffffff', ink: '#ffffff' };
  const FONT = 'Inter';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  const rr = (ctx, x, y, w, h, r) => { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); };

  // Frost grain tile (fine white/black speckle), cached.
  const frostTile = () => K.cached('gm-frost', () => {
    const n = 128, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data, r = K.rng(5);
    for (let i = 0; i < d.length; i += 4) { const v = r() < 0.5 ? 255 : 0; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = r() * 26; }
    x.putImageData(img, 0, 0); return c;
  });
  // A frosted copy of everything drawn so far (downsample + blur + saturate).
  function frosted(ctx, amt = 1) {
    const W = ctx.canvas.width, H = ctx.canvas.height, k = 10, w = Math.ceil(W / k), h = Math.ceil(H / k);
    const c = K.cached(`gm-fro:${w}x${h}`, () => K.layer(w, h)), x = c.getContext('2d');
    x.save(); x.clearRect(0, 0, w, h); x.filter = `blur(${(1.6 * amt).toFixed(2)}px) saturate(1.5) brightness(1.08)`; x.drawImage(ctx.canvas, -2, -2, w + 4, h + 4); x.restore();
    return c;
  }
  // The glass surface itself: frosted backdrop, tint, grain, sheen, light border, soft drop shadow.
  function glass(ctx, x, y, w, h, r, o = {}) {
    const s = sOf(ctx), W = ctx.canvas.width, H = ctx.canvas.height, fro = frosted(ctx, o.blur ?? 1);
    ctx.save();
    // drop shadow (offset darker, very soft)
    ctx.save(); ctx.shadowColor = 'rgba(8,0,30,0.45)'; ctx.shadowBlur = 40 * s; ctx.shadowOffsetY = 18 * s;
    rr(ctx, x, y, w, h, r); ctx.fillStyle = 'rgba(20,10,50,0.25)'; ctx.fill(); ctx.restore();
    rr(ctx, x, y, w, h, r); ctx.save(); ctx.clip();
    ctx.drawImage(fro, 0, 0, W, H);
    const tint = ctx.createLinearGradient(x, y, x + w, y + h);
    tint.addColorStop(0, `rgba(255,255,255,${o.tint ?? 0.2})`); tint.addColorStop(1, `rgba(255,255,255,${(o.tint ?? 0.2) * 0.35})`);
    ctx.fillStyle = tint; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = ctx.createPattern(frostTile(), 'repeat'); ctx.fillRect(x, y, w, h);
    // diagonal specular sheen
    const sx = x + w * (0.15 + 0.1 * Math.sin((o.t || 0) * 0.5)), sh = ctx.createLinearGradient(sx, y, sx + w * 0.35, y + h);
    sh.addColorStop(0, 'rgba(255,255,255,0)'); sh.addColorStop(0.45, 'rgba(255,255,255,0.13)'); sh.addColorStop(0.55, 'rgba(255,255,255,0.03)'); sh.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sh; ctx.fillRect(x, y, w, h);
    ctx.restore();
    // 1px light border, brighter at the top left
    const b = ctx.createLinearGradient(x, y, x + w, y + h);
    b.addColorStop(0, 'rgba(255,255,255,0.75)'); b.addColorStop(0.5, 'rgba(255,255,255,0.12)'); b.addColorStop(1, 'rgba(255,255,255,0.35)');
    rr(ctx, x + 0.5, y + 0.5, w - 1, h - 1, r); ctx.strokeStyle = b; ctx.lineWidth = 1.4 * s; ctx.stroke();
    ctx.restore();
  }
  // The world behind the glass: big soft colour blobs + crisp glossy orbs, all drifting.
  function scene(ctx, W, H, t) {
    const s = S(W, H), m = Math.max(W, H);
    const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, '#24104f'); g.addColorStop(0.5, P.base); g.addColorStop(1, P.base2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const blobs = [[0.18, 0.25, 0.45, P.violet], [0.8, 0.2, 0.4, P.magenta], [0.65, 0.85, 0.42, P.orange], [0.15, 0.85, 0.38, P.cyan], [0.5, 0.5, 0.3, P.pink]];
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    blobs.forEach(([bx, by, br, col], i) => {
      const x = (bx + 0.07 * Math.sin(t * 0.35 + i * 1.7)) * W, y = (by + 0.06 * Math.cos(t * 0.3 + i * 2.3)) * H, r = br * m * (1 + 0.06 * Math.sin(t * 0.5 + i));
      const rg = ctx.createRadialGradient(x, y, 0, x, y, r); rg.addColorStop(0, K.rgba(col, 0.55)); rg.addColorStop(0.5, K.rgba(col, 0.2)); rg.addColorStop(1, K.rgba(col, 0));
      ctx.fillStyle = rg; ctx.fillRect(x - r, y - r, r * 2, r * 2);
    });
    ctx.restore();
    // glossy orbs with crisp edges (they read sharp outside the glass and soft through it)
    const orbs = [[0.08, 0.72, 70, P.blue, P.cyan], [0.93, 0.62, 52, P.orange, '#ffd27a'], [0.05, 0.1, 40, P.magenta, '#ffb2f0'], [0.86, 0.93, 34, P.violet, '#c9a6ff']];
    orbs.forEach(([ox, oy, or, c1, c2], i) => {
      const x = ox * W + Math.sin(t * 0.6 + i * 2) * 14 * s, y = oy * H + Math.cos(t * 0.5 + i) * 12 * s, r = or * s;
      const sg = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
      sg.addColorStop(0, c2); sg.addColorStop(0.55, c1); sg.addColorStop(1, K.rgba(K.mix(c1, '#000000', 0.45)));
      ctx.fillStyle = sg; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.ellipse(x - r * 0.35, y - r * 0.45, r * 0.25, r * 0.14, -0.5, 0, Math.PI * 2); ctx.fill();
    });
  }

  const style = {
    id: 'glassmorphism', name: 'Glassmorphism UI', family: 'Dimensional',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=block', specs: ['800 56px "Inter"', '600 28px "Inter"', '400 24px "Inter"'] }],
    palette: { ...P },
    sfx: { draw: null, land: 'blip', emphasis: 'ding', transition: 'whoosh', bed: 'hum' },

    background(ctx, W, H, t) { scene(ctx, W, H, t); },
    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.35, '#05010f');
      K.grain(ctx, W, H, t, 0.03, 24, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 56) * s, lines = String(text).split('\n'), lh = size * 1.1;
      ctx.save(); ctx.font = K.font(size, FONT, 800); ctx.textAlign = o.align || 'left';
      const words = []; lines.forEach((l, li) => l.split(' ').forEach((wd, wi) => words.push({ li, wi })));
      let wMax = 0, idx = 0;
      lines.forEach((l, li) => {
        const full = ctx.measureText(l).width; wMax = Math.max(wMax, full);
        const ws = l.split(' '), x0 = o.align === 'center' ? x - full / 2 : o.align === 'right' ? x - full : x;
        ctx.textAlign = 'left'; let cx = x0;
        ws.forEach((wd) => {
          const q = K.clamp(p * (words.length + 2) - idx); idx++;
          const e = K.ease.out(q);
          if (q > 0) { ctx.globalAlpha = q; ctx.shadowColor = 'rgba(10,0,40,0.5)'; ctx.shadowBlur = 18 * s; ctx.fillStyle = o.color || '#ffffff'; ctx.fillText(wd, cx, y + li * lh + (1 - e) * 26 * s); }
          cx += ctx.measureText(wd + ' ').width;
        });
      });
      ctx.restore();
      return { w: wMax, h: lh * lines.length };
    },
    // Glass pill with a glowing colour dot.
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 28) * s, k = K.ease.back(K.clamp(p)); if (k <= 0.02) return { w: 0, h: 0 };
      ctx.save(); ctx.font = K.font(size, FONT, 600);
      const tw = ctx.measureText(text).width, h = size * 1.75, dot = size * 0.32, w = h * 0.45 + dot * 2 + size * 0.45 + tw + h * 0.45;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - h / 2;
      ctx.globalAlpha = K.clamp(p * 2.5);
      ctx.translate(x0 + w / 2, y); ctx.scale(k, k); ctx.translate(-(x0 + w / 2), -y);
      glass(ctx, x0, y0, w, h, h / 2, { tint: 0.18, t: o.t });
      const col = o.color || P.mint, dx = x0 + h * 0.45 + dot;
      ctx.shadowColor = col; ctx.shadowBlur = 12 * s; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(dx, y, dot, 0, Math.PI * 2); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = '#ffffff'; ctx.textBaseline = 'middle'; ctx.fillText(text, dx + dot + size * 0.45, y + size * 0.03);
      ctx.restore();
      return { w, h };
    },
    // Glowing gradient connector with a travelling light dot.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.12, 60), q = K.trim(pts, K.clamp(p));
      if (q.length < 2) return null;
      const g = ctx.createLinearGradient(from[0], from[1], to[0], to[1]); g.addColorStop(0, o.c1 || P.cyan); g.addColorStop(1, o.c2 || P.magenta);
      ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
      ctx.strokeStyle = g; ctx.globalAlpha = 0.28; ctx.lineWidth = 11 * s; K.poly(ctx, q); ctx.stroke();
      ctx.globalAlpha = 1; ctx.lineWidth = 2.6 * s; K.poly(ctx, q); ctx.stroke();
      const end = q[q.length - 1];
      // travelling light dot
      if (o.t != null) { const u = (o.t * 0.7 + (o.seed || 0) * 0.17) % 1; if (u < K.clamp(p)) { const d = K.trim(pts, u).pop(); const rg = ctx.createRadialGradient(d[0], d[1], 0, d[0], d[1], 12 * s); rg.addColorStop(0, 'rgba(255,255,255,0.95)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(d[0], d[1], 12 * s, 0, Math.PI * 2); ctx.fill(); } }
      ctx.fillStyle = o.c2 || P.magenta; ctx.beginPath(); ctx.arc(end[0], end[1], 4.5 * s, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      return end;
    },
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.ease.out(K.clamp(p)); if (k <= 0.02) return;
      ctx.save(); ctx.globalAlpha = K.clamp(p * 2);
      const dy = (1 - k) * 40 * s;
      glass(ctx, x, y + dy, w, h, (o.r || 26) * s, { t: o.t, tint: o.tint });
      ctx.restore();
    },
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 110) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, FONT, 800); ctx.textAlign = o.align || 'center';
      ctx.shadowColor = 'rgba(255,80,220,0.55)'; ctx.shadowBlur = 30 * s;
      const g = ctx.createLinearGradient(0, y - size, 0, y); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#ffd6f4');
      ctx.fillStyle = g; ctx.fillText(txt, x, y); ctx.restore();
      return { h: size };
    },
    // Progress ring that sweeps to full, glows, and pings.
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), k = K.ease.inOut(K.clamp(p / 0.7));
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(255,255,255,0.14)'; ctx.lineWidth = 12 * s; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      if (k > 0) {
        const g = ctx.createConicGradient(-Math.PI / 2, x, y); g.addColorStop(0, P.cyan); g.addColorStop(0.5, P.magenta); g.addColorStop(1, P.orange);
        ctx.strokeStyle = g; ctx.shadowColor = P.magenta; ctx.shadowBlur = 20 * s; ctx.lineWidth = 12 * s;
        ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * k); ctx.stroke();
      }
      if (p > 0.7) { const q = K.clamp((p - 0.7) / 0.3); ctx.shadowBlur = 0; ctx.globalAlpha = 1 - q; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 3 * s; ctx.beginPath(); ctx.arc(x, y, r * (1 + q * 0.5), 0, Math.PI * 2); ctx.stroke(); }
      ctx.restore();
    },
    // Scene change: a full-frame frosted pane slides across (frosting the frame under it), then slides away.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), e = K.ease.inOut;
      const x0 = p < 0.5 ? W * (1 - e(p * 2)) : 0, x1 = p < 0.5 ? W : W * (1 - e((p - 0.5) * 2));
      if (x1 - x0 < 1) return;
      const fro = frosted(ctx, 2.6);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, H); ctx.clip();
      ctx.drawImage(fro, 0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.fillRect(x0, 0, x1 - x0, H);
      ctx.fillStyle = ctx.createPattern(frostTile(), 'repeat'); ctx.fillRect(x0, 0, x1 - x0, H);
      ctx.restore();
      const edge = p < 0.5 ? x0 : x1;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(edge - 30 * s, 0, edge + 30 * s, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.5)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(edge - 30 * s, 0, 60 * s, H); ctx.restore();
    },
    glass,
  };

  // ---------- the shared demo: a frosted dashboard ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const DOTS = [P.pink, P.cyan, '#ff4545', '#ffffff', P.blue, '#c9a6ff', '#4d8bff'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, portrait: false, title: [W / 2, 104 * s], card: [80 * s, 255 * s, 270 * s, 180 * s], node: [420 * s, 285 * s, 350 * s, 120 * s],
      chips: PLATFORMS.map((n, i) => [895 * s, (186 + i * 72) * s]), stat: [210 * s, 175 * s, 860 * s, 330 * s], take: [W / 2, 640 * s] };
    return { s, portrait: true, title: [W / 2, H * 0.085], card: [W * 0.22, H * 0.165, W * 0.56, H * 0.13], node: [W * 0.17, H * 0.37, W * 0.66, H * 0.075],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.53 : W * 0.47, H * (0.54 + Math.floor(i / 2) * 0.08)]), stat: [W * 0.07, H * 0.3, W * 0.86, H * 0.34], take: [W / 2, H * 0.76] };
  }
  function osMark(ctx, x, y, r, s) {
    const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, P.cyan); g.addColorStop(0.5, P.violet); g.addColorStop(1, P.magenta);
    ctx.fillStyle = g; rr(ctx, x - r, y - r, r * 2, r * 2, r * 0.35); ctx.fill();
    ctx.fillStyle = '#fff'; ctx.font = K.font(r * 0.85, FONT, 800); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('OS', x, y + r * 0.05); ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    void s;
  }
  function nodePanel(ctx, x, y, w, h, p, t, s, size) {
    style.box(ctx, x, y, w, h, p, { t, r: 24 });
    if (p <= 0.3) return;
    ctx.save(); ctx.globalAlpha = K.clamp((p - 0.3) / 0.4);
    const r = h * 0.3; osMark(ctx, x + h * 0.5, y + h / 2, r, s);
    ctx.font = K.font(size * s, FONT, 800); ctx.fillStyle = '#fff'; ctx.textBaseline = 'middle'; ctx.fillText('Creator OS', x + h * 0.5 + r + 18 * s, y + h / 2 + 2 * s);
    ctx.restore();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.2, 'lin'), { align: 'center', size: portrait ? 54 : 56 });
        const [vx, vy, vw, vh] = Lo.card, cp = K.beat(t, 2.0, 0.6);
        style.box(ctx, vx, vy, vw, vh, cp, { t });
        if (cp > 0.3) {
          const a = K.clamp((cp - 0.3) / 0.5), dy = (1 - cp) * 40 * s, ix = vx + 14 * s, iy = vy + 14 * s + dy, iw = vw - 28 * s, ih = vh - 28 * s;
          ctx.save(); ctx.globalAlpha = a; rr(ctx, ix, iy, iw, ih, 16 * s); ctx.clip();
          const g = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih); g.addColorStop(0, P.orange); g.addColorStop(0.5, P.magenta); g.addColorStop(1, P.violet);
          ctx.fillStyle = g; ctx.fillRect(ix, iy, iw, ih);
          ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(ix, iy + ih * 0.82, iw * K.clamp((t - 2.4) / 3), 5 * s);
          ctx.restore();
          ctx.save(); ctx.globalAlpha = a; const pr = 26 * s, cx = ix + iw / 2, cy = iy + ih / 2;
          ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = P.magenta; ctx.beginPath(); ctx.moveTo(cx - pr * 0.3, cy - pr * 0.42); ctx.lineTo(cx - pr * 0.3, cy + pr * 0.42); ctx.lineTo(cx + pr * 0.45, cy); ctx.fill(); ctx.restore();
        }
        if (portrait) style.label(ctx, 'your video', vx - 18 * s, vy + vh, K.beat(t, 2.7, 0.4), { color: P.orange, t });
        else style.label(ctx, 'your video', vx + vw / 2, vy + vh + 44 * s, K.beat(t, 2.7, 0.4), { align: 'center', color: P.orange, t });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[W / 2 + 60 * s, vy + vh + 6 * s], [W / 2 + 60 * s, ny - 10 * s]] : [[vx + vw + 10 * s, vy + vh / 2], [nx - 10 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.4, 0.6, 'inOut'), { bend: portrait ? 0 : -0.1, t, c1: P.orange, c2: P.magenta });
        nodePanel(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.6), t, s, portrait ? 44 : 40);
        if (portrait) style.arrow(ctx, [W / 2, ny + nh + 8 * s], [W / 2, Lo.chips[6][1]], K.beat(t, 4.8, 0.5, 'inOut'), { bend: 0, t });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = portrait ? [W / 2, cy] : [nx + nw + 8 * s, ny + nh / 2], to = portrait ? [left ? W * 0.47 : W * 0.53, cy] : [cx - 6 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'out'), { bend: portrait ? 0 : (i - 3) * -0.03, t, seed: i, c1: P.cyan, c2: DOTS[i] === '#ffffff' ? P.mint : DOTS[i] });
          style.label(ctx, name, cx, cy, K.beat(t, t0 + 0.25, 0.35), { color: DOTS[i], align: portrait ? (left ? 'right' : 'left') : 'left', t });
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      } else {
        const [sx, sy, sw, sh] = Lo.stat;
        style.box(ctx, sx, sy, sw, sh, 1, { t, r: 32 });
        // the Creator OS chip rides on the stat card (glass over glass)
        const cw = (portrait ? 420 : 330) * s, ch = (portrait ? 80 : 70) * s;
        nodePanel(ctx, W / 2 - cw / 2, sy - ch * 0.55, cw, ch, 1, t, s, portrait ? 36 : 32);
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        const ringC = portrait ? [W / 2, sy + sh * 0.3] : [sx + 150 * s, sy + sh * 0.55], ringR = (portrait ? 70 : 84) * s;
        style.emphasis(ctx, ringC[0], ringC[1], ringR, K.clamp((t - 8.6) / 2.0), {});
        ctx.save(); ctx.font = K.font((portrait ? 36 : 34) * s, FONT, 800); ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(Math.round(K.clamp((t - 8.6) / 1.4) * 100) + '%', ringC[0], ringC[1]); ctx.restore();
        const cc = portrait ? [W / 2, sy + sh * 0.74] : [sx + sw * 0.63, sy + sh * 0.62];
        ctx.save(); ctx.font = K.font(30 * s, FONT, 600); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.textAlign = 'center'; ctx.fillText('views', cc[0], cc[1] - (portrait ? 92 : 112) * s); ctx.restore();
        style.counter(ctx, v, cc[0], cc[1], 1, { size: portrait ? 92 : 96 });
        // sparkline drawing on under the number
        const spW = (portrait ? 560 : 440) * s, spx = cc[0] - spW / 2, spy = cc[1] + (portrait ? 70 : 60) * s, nzz = K.noise(3);
        const pts = Array.from({ length: 40 }, (_, i) => [spx + (i / 39) * spW, spy - Math.pow(i / 39, 1.6) * 40 * s - nzz.n2(i * 0.4, 1) * 8 * s]);
        const q = K.trim(pts, K.beat(t, 8.6, 1.4, 'out'));
        if (q.length > 1) { ctx.save(); ctx.strokeStyle = P.mint; ctx.lineWidth = 3 * s; ctx.shadowColor = P.mint; ctx.shadowBlur = 10 * s; K.poly(ctx, q); ctx.stroke(); ctx.restore(); }
        style.title(ctx, portrait ? 'Post once.\nReach everywhere.' : 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.8, 'lin'), { align: 'center', size: portrait ? 54 : 52 });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 0.6); k.play('swell', 0.0, { dur: 2.5, chord: ['C4', 'G4', 'D5'], gain: 0.8 });
      for (let i = 0; i < 5; i++) k.play('click', 0.2 + i * 0.22, { pitch: 1.4, gain: 0.6 });
      k.play('whoosh', 1.95, { dur: 0.4, gain: 0.4 }); k.play('blip', 2.35, { note: 'E6' }); k.play('pop', 2.75, { pitch: 1.2, gain: 0.7 });
      k.play('whoosh', 3.4, { dur: 0.6, gain: 0.35 });
      k.play('whoosh', 3.95, { dur: 0.4, gain: 0.4 }); k.play('blip', 4.3, { note: 'G6' }); k.play('blip', 4.4, { note: 'C7' });
      const notes = ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7'];
      for (let i = 0; i < 7; i++) { k.play('click', 5.0 + i * 0.4, { pitch: 1.6, gain: 0.5 }); k.play('blip', 5.3 + i * 0.4, { note: notes[i], gain: 0.8 }); }
      k.play('whoosh', 7.6, { dur: 0.6, gain: 0.7 }); k.play('whoosh', 8.3, { dur: 0.6, up: false, gain: 0.6 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('ding', 10.0); k.play('swell', 10.4, { dur: 1.6, chord: ['F4', 'A4', 'C5', 'E5'] });
      k.play('chime', 11.2, { note: 'E6' });
    },
  };
  MS.register(style);
})();
