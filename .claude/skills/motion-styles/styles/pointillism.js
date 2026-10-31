// Pointillist Afternoon (Painterly). Neo-Impressionist divisionism: every surface is filled with small dabs of
// unmixed pigment (complementary hues side by side so they mix in the eye), the bare canvas weave peeking between
// them and a dotted painted border. Each colour is a cached tile of dabs used as a pattern, so text, arrows and
// panels are dabs too, and three tile variants alternate a few times a second so the dots shimmer while the
// overall colour holds. Scene change = the canvas re-dabbed in a diagonal sweep.
(function () {
  const MIX = {
    sky: [['#9cc3f0', 3], ['#ffffff', 2], ['#c8b6f0', 1.2], ['#f5c48a', 0.8], ['#7aa6e8', 2]],
    water: [['#2f63c8', 3], ['#4f8fe0', 2], ['#2fa7a0', 1], ['#e9f0ff', 1], ['#f08a3a', 0.4]],
    grass: [['#3e9a3a', 3], ['#7cc24a', 2], ['#e6d84a', 1], ['#2a5fb0', 1], ['#f07a3a', 0.4]],
    shade: [['#1f5a2a', 3], ['#2a3f7a', 2], ['#3e8a3a', 1.5], ['#7a3a6a', 0.6]],
    ink: [['#1c2a7a', 3], ['#3a1f6e', 2], ['#a8231f', 0.8], ['#0f4a5a', 1]],
    cream: [['#fff6dc', 3], ['#ffe4a8', 2], ['#ffd0c8', 1], ['#d8ecff', 1]],
    red: [['#e2442a', 3], ['#f08a2a', 2], ['#c8243a', 1], ['#ffd24a', 0.6]],
    gold: [['#f5c430', 3], ['#ffe27a', 2], ['#f08a2a', 1], ['#8a6ad8', 0.5]],
    bark: [['#5a3a1a', 2], ['#2a2a6a', 1], ['#8a5a2a', 2], ['#1f5a2a', 0.6]],
  };
  const SERIF = 'Playfair Display';
  // finer dabs where legibility matters (lettering, arrows, plaques)
  const FINE = { ink: 0.68, red: 0.8, gold: 0.85, cream: 0.85 };
  const S = (W, H) => K.layout(W, H).s;

  // a tile of dabs for one colour mix; variant v reshuffles the dabs (shimmer)
  function tile(name, v, s) {
    return K.cached(`pt-tile:${name}:${v}:${s.toFixed(3)}`, () => {
      const n = Math.round(96 * Math.max(1, s)), c = K.layer(n, n), x = c.getContext('2d'), r = K.rng(name.length * 97 + v * 13 + 5), mix = MIX[name];
      const tot = mix.reduce((a, m) => a + m[1], 0), pick = () => { let u = r() * tot; for (const [col, w] of mix) { u -= w; if (u <= 0) return col; } return mix[0][0]; };
      const f = FINE[name] || 1, count = Math.floor((n * n) / (9.5 * s * s * f * f));
      for (let i = 0; i < count; i++) {
        const px = r() * n, py = r() * n, rx = r.range(1.6, 2.7) * s * f, ry = r.range(1.1, 1.9) * s * f, a = r() * Math.PI;
        x.fillStyle = pick();
        for (const ox of [-n, 0, n]) for (const oy of [-n, 0, n]) { if (px + ox < -6 * s || px + ox > n + 6 * s || py + oy < -6 * s || py + oy > n + 6 * s) continue; x.beginPath(); x.ellipse(px + ox, py + oy, rx, ry, a, 0, Math.PI * 2); x.fill(); }
      }
      return c;
    });
  }
  let FRAME_V = 0;
  const pat = (ctx, name) => { const s = S(ctx.canvas.width, ctx.canvas.height); return ctx.createPattern(tile(name, FRAME_V, s), 'repeat'); };
  const variant = (t) => Math.floor(t * 8) % 3;

  function canvasWeave(W, H) {
    return K.cached(`pt-weave:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(3);
      x.fillStyle = '#e9dfc6'; x.fillRect(0, 0, W, H);
      for (let i = 0; i < W; i += 2.5 * s) { x.fillStyle = `rgba(150,130,95,${r.range(0.05, 0.14)})`; x.fillRect(i, 0, 1.1 * s, H); }
      for (let j = 0; j < H; j += 2.5 * s) { x.fillStyle = `rgba(255,250,235,${r.range(0.05, 0.16)})`; x.fillRect(0, j, W, 1.1 * s); }
      return c;
    });
  }

  function dotText(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 70) * s;
    ctx.save(); ctx.font = K.font(size, SERIF, 800, o.italic === false ? '' : 'italic'); ctx.textAlign = 'left';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.beginPath(); ctx.rect(x0 - 20 * s, y - size * 1.2, (w + 40 * s) * K.clamp(p), size * 1.8); ctx.clip();
    // a halo of pale dabs separates the letters from the busy field, then the pigment dabs of the letters
    ctx.lineJoin = 'round'; ctx.strokeStyle = pat(ctx, o.halo || 'cream'); ctx.lineWidth = (o.haloW || 12) * s; ctx.strokeText(text, x0, y);
    ctx.fillStyle = pat(ctx, o.mix || 'ink'); ctx.fillText(text, x0, y); ctx.fillText(text, x0, y);
    ctx.restore(); return { w, h: size };
  }

  const style = {
    id: 'pointillism', name: 'Pointillist Afternoon', family: 'Painterly',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,800;1,800&display=block', specs: ['italic 800 70px "Playfair Display"', '800 40px "Playfair Display"'] }],
    palette: { bg: '#e9dfc6', ink: '#1c2a7a', sky: '#9cc3f0', water: '#2f63c8', grass: '#3e9a3a', accent: '#e2442a', gold: '#f5c430' },
    sfx: { draw: 'spray', land: 'blip', emphasis: 'ding', transition: 'whoosh', bed: 'ocean' },
    setup(W, H) { const s = S(W, H); for (const k of Object.keys(MIX)) for (let v = 0; v < 3; v++) tile(k, v, s); canvasWeave(W, H); },

    // a Sunday on the river bank, all in dabs
    background(ctx, W, H, t) {
      FRAME_V = variant(t);
      const s = S(W, H), portrait = H > W, hz = H * (portrait ? 0.5 : 0.46), wb = H * (portrait ? 0.6 : 0.6);
      ctx.drawImage(canvasWeave(W, H), 0, 0);
      ctx.save(); ctx.globalAlpha = 0.95;
      ctx.fillStyle = pat(ctx, 'sky'); ctx.fillRect(0, 0, W, hz);
      ctx.fillStyle = pat(ctx, 'water'); ctx.fillRect(0, hz, W, wb - hz);
      ctx.fillStyle = pat(ctx, 'grass'); ctx.beginPath(); ctx.moveTo(0, wb + 20 * s); ctx.quadraticCurveTo(W * 0.5, wb - 26 * s, W, wb + 10 * s); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
      // shadow under the trees
      ctx.fillStyle = pat(ctx, 'shade'); ctx.beginPath(); ctx.ellipse(W * 0.08, H * 0.9, W * 0.22, H * 0.06, 0, 0, Math.PI * 2); ctx.fill();
      // a tree at the edge and a drifting sailboat
      const tx = portrait ? W * 0.06 : W * 0.05, ty = portrait ? H * 0.66 : H * 0.16, tr = portrait ? 0.6 : 1;
      ctx.fillStyle = pat(ctx, 'bark'); ctx.fillRect(tx - 9 * s * tr, ty + 20 * s, 18 * s * tr, H * 0.9 - ty);
      ctx.fillStyle = pat(ctx, 'shade'); ctx.beginPath(); ctx.ellipse(tx, ty, 70 * s * tr, 110 * s * tr, 0, 0, Math.PI * 2); ctx.fill();
      const bx = (portrait ? W * 0.82 : W * 0.86) + Math.sin(t * 0.35) * 14 * s, by = hz + (wb - hz) * 0.45;
      ctx.fillStyle = pat(ctx, 'cream'); ctx.beginPath(); ctx.moveTo(bx, by - 70 * s); ctx.lineTo(bx + 40 * s, by - 6 * s); ctx.lineTo(bx, by - 6 * s); ctx.closePath(); ctx.fill();
      ctx.fillStyle = pat(ctx, 'red'); ctx.fillRect(bx - 34 * s, by - 6 * s, 80 * s, 12 * s);
      ctx.restore();
    },
    finish(ctx, W, H, t) {
      const s = S(W, H), b = 16 * s;
      // dotted painted border: a band of blue with orange dabs, complementaries side by side
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, W, H); ctx.rect(b, b, W - 2 * b, H - 2 * b); ctx.fillStyle = pat(ctx, 'ink'); ctx.fill('evenodd');
      ctx.beginPath(); ctx.rect(b * 0.35, b * 0.35, W - b * 0.7, H - b * 0.7); ctx.strokeStyle = pat(ctx, 'red'); ctx.lineWidth = 4 * s; ctx.stroke(); ctx.restore();
      K.vignette(ctx, W, H, 0.22, '#3a2a10');
      K.grain(ctx, W, H, t, 0.03, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return dotText(ctx, text, x, y, p, { size: 72, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return dotText(ctx, text, x, y, p, { size: 42, italic: false, haloW: 12, ...o }); },
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.arcPts(from, to, o.bend ?? 0.15, 40), q = K.trim(pts, K.clamp(p / 0.8));
      if (q.length < 2) return null;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = pat(ctx, 'cream'); ctx.lineWidth = 14 * s; K.poly(ctx, q); ctx.stroke();
      ctx.strokeStyle = pat(ctx, o.mix || 'red'); ctx.lineWidth = 8 * s; K.poly(ctx, q); ctx.stroke();
      if (p > 0.8) { const k = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.min(28 * s, K.pathLen(pts) * 0.4) * k;
        const tri = [[b[0] + Math.cos(ang) * 6 * s, b[1] + Math.sin(ang) * 6 * s], [b[0] - Math.cos(ang - 0.5) * L, b[1] - Math.sin(ang - 0.5) * L], [b[0] - Math.cos(ang + 0.5) * L, b[1] - Math.sin(ang + 0.5) * L]];
        ctx.fillStyle = pat(ctx, o.mix || 'red'); ctx.strokeStyle = pat(ctx, 'cream'); ctx.lineWidth = 5 * s; K.poly(ctx, tri, true); ctx.stroke(); ctx.fill(); }
      ctx.restore(); return q[q.length - 1];
    },
    // a painted plaque: pale dab field inside a ring of fine dark dabs, built up from the left
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height); if (p <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 20 * s, y - 20 * s, (w + 40 * s) * K.clamp(p), h + 40 * s); ctx.clip();
      ctx.beginPath(); ctx.roundRect(x, y, w, h, 16 * s); ctx.fillStyle = pat(ctx, o.mix || 'cream'); ctx.fill(); ctx.fill();
      ctx.strokeStyle = pat(ctx, o.edge || 'ink'); ctx.lineWidth = 7 * s; ctx.stroke();
      ctx.restore();
    },
    counter(ctx, value, x, y, p, o = {}) { return dotText(ctx, K.fmt(value), x, y, 1, { size: o.size || 132, align: o.align || 'center', italic: false, haloW: 18 }); },
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      ctx.save(); ctx.lineCap = 'round';
      for (let i = 0; i < 2; i++) {
        const pts = K.circlePts(x, y, r * (1.22 + i * 0.06), r * (0.62 + i * 0.04), 90, -Math.PI / 2 + i, Math.PI * 2), q = K.trim(pts, K.clamp(p * 1.3 - i * 0.3));
        if (q.length < 2) continue;
        ctx.strokeStyle = pat(ctx, i ? 'gold' : 'red'); ctx.lineWidth = (i ? 6 : 12) * s; K.poly(ctx, q); ctx.stroke();
      }
      ctx.restore();
    },
    // re-dab the canvas in a diagonal sweep: fresh pale dabs advance to cover (0.5), then recede off the far corner
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), D = W + H, k = K.ease.inOut(K.clamp(p)), front = p < 0.5 ? k * 2 * D : (k - 0.5) * 2 * D;
      ctx.save(); ctx.beginPath();
      // covered region: x + y < front while sweeping in, x + y > front while sweeping out
      if (p < 0.5) { ctx.moveTo(0, 0); ctx.lineTo(front, 0); ctx.lineTo(0, front); ctx.closePath(); }
      else { ctx.moveTo(front, 0); ctx.lineTo(front + 2 * D, 0); ctx.lineTo(0, front + 2 * D); ctx.lineTo(0, front); ctx.closePath(); }
      ctx.clip(); ctx.drawImage(canvasWeave(W, H), 0, 0); ctx.fillStyle = pat(ctx, 'cream'); ctx.fillRect(0, 0, W, H); ctx.fillStyle = pat(ctx, 'sky'); ctx.globalAlpha = 0.5; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      // the brush line of fresh dabs at the front
      ctx.save(); ctx.strokeStyle = pat(ctx, 'red'); ctx.lineWidth = 10 * s; ctx.beginPath(); ctx.moveTo(front, 0); ctx.lineTo(0, front); ctx.stroke(); ctx.restore();
    },
  };

  // ---------- demo: a painted afternoon ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [120 * s, 280 * s, 250 * s, 160 * s], node: [490 * s, 290 * s, 290 * s, 140 * s],
      chips: PLATFORMS.map((n, i) => [985 * s, (172 + i * 70) * s]), title: [W / 2, 118 * s], counter: [W / 2, 420 * s] };
    return { s, video: [W * 0.26, H * 0.2, W * 0.48, H * 0.11], node: [W * 0.16, H * 0.405, W * 0.68, H * 0.08],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.585 + Math.floor(i / 2) * 0.078)]), title: [W / 2, H * 0.1], counter: [W / 2, H * 0.49] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W;
      style.background(ctx, W, H, t);
      if (t < 8.0) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.15, 1.5, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 86 * s, K.clamp(tp * tt.length - i), { size: portrait ? 70 : 70, align: 'center' }));
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.7, 'lin'), {});
        if (t > 2.6) { const k = K.beat(t, 2.6, 0.3, 'back'), cx = vx + vw * 0.5, cy = vy + vh * 0.5, z = Math.min(vw, vh) * 0.26 * k; ctx.save(); ctx.fillStyle = pat(ctx, 'red'); ctx.beginPath(); ctx.moveTo(cx - z * 0.8, cy - z); ctx.lineTo(cx - z * 0.8, cy + z); ctx.lineTo(cx + z, cy); ctx.closePath(); ctx.fill(); ctx.fill(); ctx.restore(); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 54 * s, K.beat(t, 3.0, 0.45, 'lin'), { align: 'center' });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 74 * s], [nx + nw / 2, ny - 16 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 18 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.45, 0.55, 'lin'), { bend: portrait ? 0.08 : -0.14 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.7, 'lin'), { mix: 'gold' });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 20 * s, K.beat(t, 4.45, 0.45, 'lin'), { size: 56, align: 'center', italic: false });
        if (portrait) style.arrow(ctx, [W / 2, ny + nh + 14 * s], [W / 2, Lo.chips[6][1] - 4 * s], K.beat(t, 4.95, 0.45, 'lin'), { bend: 0 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'lin');
          const from = portrait ? [W / 2, cy - 14 * s] : [nx + nw + 18 * s, ny + nh / 2], to = portrait ? [left ? W * 0.455 : W * 0.545, cy - 14 * s] : [cx - 16 * s, cy - 13 * s];
          style.arrow(ctx, from, to, p, { bend: portrait ? 0 : (i - 3) * 0.035, mix: i % 2 ? 'red' : 'gold' });
          style.label(ctx, name, portrait ? (left ? W * 0.43 : W * 0.57) : cx, cy, K.beat(t, t0 + 0.24, 0.32, 'lin'), { size: portrait ? 44 : 42, align: portrait ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.3) style.transition(ctx, W, H, K.clamp((t - 7.3) / 1.4), {});
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.24 : 124 * s;
        style.box(ctx, W / 2 - nw / 2, top - nh / 2, nw, nh, 1, { mix: 'gold' });
        style.title(ctx, 'Creator OS', W / 2, top + 20 * s, 1, { size: 56, align: 'center', italic: false });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t >= 8.55) style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 108 : 112 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 64 * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', size: 48 });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 36 * s, (portrait ? 236 : 262) * s, K.beat(t, 10.0, 0.6, 'lin'), {});
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.95, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, W / 2, (portrait ? H * 0.74 : 640 * s) + i * 88 * s, K.clamp(tp * tk.length - i), { size: portrait ? 70 : 62, align: 'center' }));
        if (t < 8.7) style.transition(ctx, W, H, K.clamp((t - 7.3) / 1.4), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('ocean', 0, 12, 0.9); k.play('swell', 0, { dur: 3, chord: ['G4', 'B4', 'D5'], gain: 0.9 });
      k.play('scribble', 0.15, { medium: 'spray', dur: 1.5 });
      k.play('scribble', 2.0, { medium: 'spray', dur: 0.7 }); k.play('blip', 2.7, { note: 'G6', gain: 0.6 });
      k.play('scribble', 3.0, { medium: 'spray', dur: 0.45, gain: 0.7 });
      k.play('scribble', 3.45, { medium: 'spray', dur: 0.55 }); k.play('blip', 4.0, { note: 'D6', gain: 0.6 });
      k.play('scribble', 4.0, { medium: 'spray', dur: 0.7 });
      const notes = ['G5', 'A5', 'B5', 'D6', 'E6', 'G6', 'A6'];
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'spray', dur: 0.3, gain: 0.8 }); k.play('blip', 5.26 + i * 0.4, { note: notes[i], gain: 0.7 }); }
      k.play('whoosh', 7.3, { dur: 1.3, gain: 0.6 }); k.play('scribble', 7.3, { medium: 'spray', dur: 1.3, gain: 1.2 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('ding', 10.0); k.play('scribble', 10.0, { medium: 'spray', dur: 0.6 });
      k.play('scribble', 10.5, { medium: 'spray', dur: 0.95 }); k.play('chime', 11.4, { note: 'G6' });
    },
  };
  MS.register(style);
})();
