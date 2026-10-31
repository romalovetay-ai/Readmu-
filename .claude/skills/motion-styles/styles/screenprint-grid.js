// Silkscreen Grid (Print). Warhol-style pulls: a flat flood, loose hand-cut colour plates slapped down off-register,
// then the grainy black photo screen dragged over by the squeegee (streaks, starved edges, a wet ink bead).
// The scene change is the squeegee itself; the payoff is the same video pulled eight times in garish colourways.
(function () {
  const C = { paper: '#f2ede2', black: '#141212', pink: '#ff5fa2', orange: '#ff7a1a', yellow: '#ffe11a', teal: '#17bfd3', purple: '#8b52d9', green: '#63d24c', blue: '#2f5fe0', red: '#ff3d32' };
  const WAYS = [ // [flood, screen colour, play colour] colourways for the repeat grid
    [C.teal, C.yellow, C.pink], [C.pink, C.orange, C.yellow], [C.yellow, C.blue, C.red], [C.purple, C.green, C.yellow],
    [C.orange, C.pink, C.teal], [C.green, C.purple, C.orange], [C.red, C.yellow, C.blue], [C.blue, C.pink, C.green]];
  const F = { head: 'Anton', sten: 'Big Shoulders Stencil Display' };
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // black photo-screen tile: gritty emulsion grain, squeegee streaks, starved patches
  function screenTile() {
    return K.cached('sp-screen', () => {
      const n = 256, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data, nz = K.noise(12), r = K.rng(13);
      for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
        const streak = nz.n2(i * 0.004, y * 0.09) * 0.35, grit = r() < 0.12 ? -0.5 * r() : 0;
        const a = K.clamp(0.93 + streak * (streak < 0 ? 1.2 : 0.2) + grit + nz.fbm2(i * 0.05, y * 0.05, 2) * 0.12, 0.05, 1), o = (y * n + i) * 4;
        d[o] = 20; d[o + 1] = 18; d[o + 2] = 18; d[o + 3] = a * 255;
      }
      x.putImageData(img, 0, 0); return c;
    });
  }
  // flat plate tile in a colour: near solid, a little pinholing and a drag direction
  function plateTile(col) {
    return K.cached(`sp-plate:${col}`, () => {
      const n = 128, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data, nz = K.noise(col.charCodeAt(2)), r = K.rng(col), [R, G, B] = K.hex(col);
      for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
        const a = K.clamp(0.95 + nz.n2(i * 0.02, y * 0.2) * 0.06 - (r() < 0.015 ? 0.5 : 0), 0.3, 1), o = (y * n + i) * 4;
        d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = a * 255;
      }
      x.putImageData(img, 0, 0); return c;
    });
  }
  const screen = (ctx) => ctx.createPattern(screenTile(), 'repeat');
  const flat = (ctx, col) => ctx.createPattern(plateTile(col), 'repeat');
  // hand-cut polygon around a rect: a few straight scissor cuts, corners off true, shifted off-register
  function cutRect(x, y, w, h, seed, slop) {
    const r = K.rng(seed), j = () => (r() - 0.5) * slop * 2;
    return [[x + j(), y + j()], [x + w * (0.4 + r() * 0.2), y + j() * 0.5], [x + w + j(), y + j()], [x + w + j(), y + h + j()], [x + w * (0.4 + r() * 0.2), y + h + j() * 0.5], [x + j(), y + h + j()]];
  }
  function plate(ctx, pts, col, dx = 0, dy = 0) { ctx.save(); ctx.translate(dx, dy); ctx.fillStyle = flat(ctx, col); K.poly(ctx, pts, true); ctx.fill(); ctx.restore(); }
  // the squeegee pull: content revealed by a vertical sweep (k 0..1) with a bead at the leading edge
  function pull(ctx, x, y, w, h, k, fn) {
    if (k <= 0) return; if (k >= 1) { fn(); return; }
    ctx.save(); ctx.beginPath(); ctx.rect(x - 30, y - 30, (w + 60) * k, h + 60); ctx.clip(); fn(); ctx.restore();
  }
  function measure(ctx, text, size, fam, wt = 400) { ctx.save(); ctx.font = K.font(size, fam, wt); const w = ctx.measureText(text).width; ctx.restore(); return w; }

  const style = {
    id: 'screenprint-grid', name: 'Silkscreen Grid', family: 'Print',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Anton&family=Big+Shoulders+Stencil+Display:wght@800;900&display=block', specs: ['400 64px "Anton"', '900 120px "Big Shoulders Stencil Display"'] }],
    palette: { bg: C.paper, ink: C.black, accent: C.pink, ...C },
    sfx: { draw: 'brush', land: 'thud', emphasis: 'glitch', transition: 'whoosh', bed: 'room' },

    // one print on paper: a flood panel inside a paper border (o.flood picks the colour)
    background(ctx, W, H, t, o = {}) {
      const s = S(W, H), m = 22 * s;
      ctx.drawImage(K.paperTex(W, H, C.paper, 9, 0.05, false), 0, 0);
      if (o.flood !== false) plate(ctx, cutRect(m, m, W - 2 * m, H - 2 * m, 3, 4 * s), o.flood || C.teal);
    },
    finish(ctx, W, H, t) {
      K.grain(ctx, W, H, Math.floor(t * 12) / 12, 0.07, 12, 'overlay');
      K.vignette(ctx, W, H, 0.1, '#201010');
    },

    // headline: a loose colour slab per word, then the black screen pulled over with the squeegee
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 72) * s, w = measure(ctx, text, size, F.head), x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      const k1 = K.clamp(p * 2.2), k2 = K.clamp((p - 0.35) / 0.65);
      if (o.slab !== false && k1 > 0) { ctx.save(); ctx.globalAlpha = K.clamp(k1 * 3); plate(ctx, cutRect(x0 - 16 * s, y - size * 0.98, (w + 32 * s), size * 1.18, o.seed || 5, 6 * s), o.slab || C.yellow, 7 * s * (1 - k1), 0); ctx.restore(); }
      pull(ctx, x0, y - size, w, size * 1.3, k2, () => { ctx.save(); ctx.font = K.font(size, F.head, 400); ctx.fillStyle = o.color === undefined ? screen(ctx) : o.color; ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x0 + 5 * s, y + 3 * s); ctx.restore(); });
      return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text.toUpperCase(), x, y, p, { size: o.size || 36, slab: o.slab || C.paper, ...o }); },

    // a fat black brushed arrow, gritty from the screen
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.1, 40), q = K.trim(pts, K.clamp(p / 0.85));
      if (q.length < 2) return null;
      ctx.save(); ctx.strokeStyle = screen(ctx); ctx.fillStyle = screen(ctx); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      ctx.lineWidth = (o.width || 9) * s; K.poly(ctx, q); ctx.stroke();
      if (p > 0.85) { const k = K.clamp((p - 0.85) / 0.15), b = pts[pts.length - 1], a = pts[pts.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = (o.head || 26) * s * k;
        ctx.beginPath(); ctx.moveTo(b[0] + Math.cos(ang) * 4 * s, b[1] + Math.sin(ang) * 4 * s); ctx.lineTo(b[0] - Math.cos(ang - 0.55) * L, b[1] - Math.sin(ang - 0.55) * L); ctx.lineTo(b[0] - Math.cos(ang + 0.55) * L, b[1] - Math.sin(ang + 0.55) * L); ctx.fill(); }
      ctx.restore();
      return q[q.length - 1];
    },

    // a panel: loose colour plate slapped down off-register, then the black key line pulled over it
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k1 = K.clamp(p * 2), k2 = K.clamp((p - 0.4) / 0.6);
      if (k1 > 0) { ctx.save(); ctx.globalAlpha = K.clamp(k1 * 3); plate(ctx, cutRect(x, y, w, h, o.seed || 7, 9 * s), o.fill || C.yellow, (10 + 20 * (1 - k1)) * s, -7 * s); ctx.restore(); }
      pull(ctx, x, y, w, h, k2, () => { ctx.save(); ctx.strokeStyle = screen(ctx); ctx.lineWidth = (o.lw || 8) * s; ctx.strokeRect(x, y, w, h); ctx.restore(); });
    },

    // stencil numerals: colour plate shadow + black screen numbers (bridges in the stencil face)
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 150) * s, txt = K.fmt(value), w = measure(ctx, txt, size, F.sten, 900), x0 = o.align === 'left' ? x : x - w / 2;
      ctx.save(); ctx.font = K.font(size, F.sten, 900); ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = flat(ctx, o.plate || C.paper); ctx.fillText(txt, x0 + 9 * s, y + 7 * s);
      ctx.fillStyle = screen(ctx); ctx.fillText(txt, x0, y); ctx.restore();
      return { w, h: size };
    },

    // colourway flicker: a loose starburst plate behind the moment cycling through garish inks at 12 fps
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      const f = Math.floor(k * 12 * 0.6), cols = [C.yellow, C.pink, C.teal, C.orange, C.green, C.purple];
      const rr = K.rng(o.seed || 19), pts = [];
      for (let i = 0; i < 28; i++) { const a = (i / 28) * Math.PI * 2, R = i % 2 ? r * 0.82 : r * (1.05 + rr() * 0.1); pts.push([x + Math.cos(a) * R, y + Math.sin(a) * R * (o.ry || 0.6)]); }
      const sc = K.ease.back(K.clamp(k * 2.5));
      ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.translate(-x, -y);
      plate(ctx, pts, cols[(f + 1) % cols.length], 9 * s, 6 * s); plate(ctx, pts, cols[f % cols.length]);
      ctx.restore();
    },

    // the squeegee: a rubber blade drags across; first pass floods (covered at 0.5), second prints the next panel
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), first = p < 0.5, k = K.ease.inOut(first ? p / 0.5 : (p - 0.5) / 0.5), bx = K.lerp(-60 * s, W + 60 * s, k);
      ctx.save();
      // flood behind the blade on the first pass, ahead of it on the second
      ctx.beginPath(); if (first) ctx.rect(0, 0, bx, H); else ctx.rect(bx, 0, W - bx, H); ctx.clip();
      ctx.fillStyle = o.flood || C.pink; ctx.fillRect(0, 0, W, H); ctx.fillStyle = flat(ctx, o.flood || C.pink); ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = 'rgba(255,255,255,0.08)'; for (let i = 0; i < 6; i++) ctx.fillRect(0, (i * 0.17 + 0.05) * H, W, 3 * s);
      ctx.restore();
      // wet ink bead + the blade and its wooden handle
      ctx.save(); ctx.fillStyle = screen(ctx); ctx.beginPath(); ctx.ellipse(bx + 14 * s, H / 2, 10 * s, H * 0.52, 0, 0, 7); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(bx + 16 * s, 0, 2.5 * s, H);
      ctx.fillStyle = '#2b2b2b'; ctx.fillRect(bx - 8 * s, -10, 12 * s, H + 20);
      const g = ctx.createLinearGradient(bx - 40 * s, 0, bx - 6 * s, 0); g.addColorStop(0, '#8a5a32'); g.addColorStop(0.5, '#c08452'); g.addColorStop(1, '#6e4524');
      ctx.fillStyle = g; ctx.fillRect(bx - 40 * s, -10, 32 * s, H + 20);
      ctx.restore();
    },
  };

  // ---------- the shared demo: one big pull, then the Warhol wall ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const SLABS = [C.yellow, C.paper, C.orange, C.paper, C.yellow, C.paper, C.orange];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 135 * s], video: [90 * s, 285 * s, 260 * s, 160 * s], node: [460 * s, 300 * s, 320 * s, 130 * s],
      chips: PL.map((_, i) => [925 * s, (248 + i * 66) * s]), top: [W / 2, 120 * s], counter: [W / 2, 430 * s], take: [W / 2, 645 * s], grid: [4, 2] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.2, W * 0.5, H * 0.12], node: [W * 0.15, H * 0.4, W * 0.7, H * 0.075],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.58 + Math.floor(i / 2) * 0.08)]), top: [W / 2, H * 0.12], counter: [W / 2, H * 0.53], take: [W / 2, H * 0.88], grid: [2, 4] };
  }
  // one repeat panel: flood, loose screen-shaped plate, play plate, then the black key
  function videoPanel(ctx, x, y, w, h, way, s, seed, k = 1) {
    const [fl, sc, pl] = way;
    if (k <= 0) return;
    ctx.save(); ctx.globalAlpha = K.clamp(k * 4); plate(ctx, cutRect(x, y, w, h, seed, 3 * s), fl); ctx.restore();
    const bx = x + w * 0.16, by = y + h * 0.2, bw = w * 0.68, bh = h * 0.6;
    if (k > 0.2) plate(ctx, cutRect(bx, by, bw, bh, seed + 1, 10 * s), sc, (seed % 3 - 1) * 8 * s, ((seed >> 1) % 3 - 1) * 6 * s);
    const cx = bx + bw * 0.5, cy = by + bh * 0.5, r = Math.min(bw, bh) * 0.28;
    if (k > 0.4) plate(ctx, [[cx - r * 0.6, cy - r], [cx + r, cy], [cx - r * 0.6, cy + r]], pl, -6 * s, 5 * s);
    pull(ctx, x, y, w, h, K.clamp((k - 0.5) * 2), () => {
      ctx.save(); ctx.strokeStyle = screen(ctx); ctx.fillStyle = screen(ctx); ctx.lineWidth = Math.max(4, w * 0.035);
      ctx.beginPath(); ctx.roundRect(bx, by, bw, bh, bh * 0.12); ctx.stroke();
      ctx.lineWidth = Math.max(3, w * 0.025); ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx - r * 0.6, cy + r); ctx.closePath(); ctx.stroke();
      ctx.fillRect(bx + bw * 0.3, by + bh + h * 0.04, bw * 0.4, h * 0.05);
      ctx.restore();
    });
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      if (!scene2) {
        style.background(ctx, W, H, t, { flood: C.teal });
        if (P) { style.title(ctx, 'One video.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 0.9, 'lin'), { size: 64, align: 'center', slab: C.pink, seed: 3 }); style.title(ctx, 'Every platform.', Lo.title[0], Lo.title[1] + 100 * s, K.beat(t, 0.7, 1.0, 'lin'), { size: 64, align: 'center', slab: C.yellow, seed: 4 }); }
        else style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.5, 'lin'), { size: 78, align: 'center', slab: C.pink });
        const [vx, vy, vw, vh] = Lo.video;
        videoPanel(ctx, vx, vy, vw, vh, WAYS[1], s, 21, K.beat(t, 2.0, 0.9, 'lin'));
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 56 * s, K.beat(t, 2.7, 0.5, 'lin'), { align: 'center', slab: C.yellow });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 82 * s], [nx + nw / 2, ny - 18 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 22 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: P ? 0 : -0.12, width: 11 });
        const np = K.beat(t, 4.0, 0.9, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, { fill: C.yellow, seed: 41 });
        if (np > 0.45) style.title(ctx, 'CREATOR OS', nx + nw / 2, ny + nh / 2 + 24 * s, K.clamp((np - 0.45) / 0.55), { size: 64, align: 'center', slab: false });
        if (P) style.arrow(ctx, [W / 2, ny + nh + 14 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0, width: 8, head: 0.01 });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 13 * s] : [nx + nw + 16 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 13 * s] : [cx - 26 * s, cy - 13 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.32, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, width: 6, head: 20 });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.22, 0.4, 'lin'), { size: P ? 34 : 36, align: P ? (left ? 'right' : 'left') : 'left', slab: SLABS[i], seed: 60 + i });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), { flood: C.pink });
      } else {
        style.background(ctx, W, H, t, { flood: false });
        // the wall: eight pulls of the same video, panel by panel, then a flicker of colourways on the hit
        const [gc, gr] = Lo.grid, m = 22 * s, gap = 10 * s, pw = (W - 2 * m - gap * (gc - 1)) / gc, ph = (H - 2 * m - gap * (gr - 1)) / gr;
        const flick = t >= 10.0 && t < 10.6 ? Math.floor((t - 10.0) * 12) : 0;
        for (let i = 0; i < gc * gr; i++) {
          const cx = i % gc, cy = Math.floor(i / gc), k = K.beat(t, 8.3 + i * 0.09, 0.5, 'lin');
          if (k <= 0) continue;
          videoPanel(ctx, m + cx * (pw + gap), m + cy * (ph + gap), pw, ph, WAYS[(i + flick * 3) % WAYS.length], s, 100 + i * 7, k);
        }
        // the Creator OS chip, counter and takeaway overprinted on the wall
        const np = K.beat(t, 8.5, 0.6, 'lin'), nw = (P ? 560 : 380) * s / (P ? 1.4 : 1), nh = (P ? 110 : 96) * s / (P ? 1.2 : 1);
        style.box(ctx, Lo.top[0] - nw / 2, Lo.top[1] - nh / 2, nw, nh, np, { fill: C.paper, seed: 43 });
        if (np > 0.4) style.title(ctx, 'CREATOR OS', Lo.top[0], Lo.top[1] + 22 * s, K.clamp((np - 0.4) / 0.6), { size: 56, align: 'center', slab: false });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 50 * s, (P ? 330 : 380) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: P ? 0.5 : 0.42 });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 150 : 180 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + (P ? 80 : 70) * s, K.beat(t, 8.9, 0.4, 'lin'), { align: 'center', size: 44, slab: C.yellow });
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1] - 50 * s, K.beat(t, 10.5, 0.6, 'lin'), { size: 64, align: 'center', slab: C.paper }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 50 * s, K.beat(t, 10.65, 0.7, 'lin'), { size: 64, align: 'center', slab: C.yellow }); }
        else style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: 64, align: 'center', slab: C.paper });
        if (t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), { flood: C.pink });
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.3);
      k.play('thud', 0.2, { gain: 0.5 }); k.play('scribble', 0.5, { medium: 'brush', dur: 1.1, gain: 1.3 });
      k.play('thud', 2.0, { gain: 0.5 }); k.play('scribble', 2.45, { medium: 'brush', dur: 0.45, gain: 1.3 }); k.play('thud', 2.75, { gain: 0.35 });
      k.play('scribble', 3.3, { medium: 'brush', dur: 0.7 }); k.play('thud', 4.0, { gain: 0.55 }); k.play('scribble', 4.4, { medium: 'brush', dur: 0.5, gain: 1.3 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'brush', dur: 0.3 }); k.play('thud', 5.25 + i * 0.4, { gain: 0.3 }); }
      k.play('whoosh', 7.4, { dur: 0.9 }); k.play('scribble', 7.5, { medium: 'brush', dur: 0.8, gain: 1.4 }); k.play('whoosh', 8.3, { dur: 0.9 });
      for (let i = 0; i < 8; i++) k.play('thud', 8.3 + i * 0.09, { gain: 0.25 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('glitch', 10.0); k.play('glitch', 10.25); k.play('stamp', 10.0, { gain: 0.7 });
      k.play('scribble', 10.6, { medium: 'brush', dur: 0.8 }); k.play('chime', 11.4, { note: 'A5' });
    },
  };
  MS.register(style);
})();
