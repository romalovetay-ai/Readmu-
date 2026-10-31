// Risograph Zine (Print). Three fluorescent spot inks, each its own drum pass, multiplied on off-white stock:
// grainy patchy solids with roller streaks, dotted tints, plates that slide into (and out of) registration,
// a print that "boils" at 8 fps, and a fresh sheet fed through the drum as the scene change.
(function () {
  const INK = { pink: '#ff48b0', blue: '#0078bf', yellow: '#ffe14a', paper: '#f4efe3' };
  const DISPLAY = 'Archivo Black', MONO = 'Space Mono';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // per-frame registration state (set by the demo from t; primitives read it). Default: settled misregistration.
  let REG = null;
  const BASE = { yellow: [-3.5, 2.5], pink: [3, -1.5], blue: [0, 0] };
  function off(ctx, col) {
    const s = sOf(ctx), b = BASE[col] || [0, 0], r = REG && REG[col] ? REG[col] : [0, 0];
    return [b[0] * s + r[0], b[1] * s + r[1]];
  }

  // Grainy ink tile: solid spot colour whose alpha is patchy (fbm), streaked by the roller, pocked by paper tooth.
  function inkTile(col) {
    return K.cached(`riso-ink:${col}`, () => {
      const n = 256, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
      const nz = K.noise(col.length * 31 + col.charCodeAt(1)), r = K.rng(col), [R, G, B] = K.hex(col);
      for (let y = 0; y < n; y++) {
        const streak = 0.08 * Math.sin(y * 0.21 + nz.n2(0, y * 0.05) * 3) + 0.07 * nz.n2(3.3, y * 0.11);
        for (let i = 0; i < n; i++) {
          const patch = nz.fbm2(i * 0.025, y * 0.025, 3) * 0.22, tooth = r() < 0.07 ? -0.45 * r() : 0;
          const a = K.clamp(0.86 + patch + streak + tooth + (r() - 0.5) * 0.18, 0.12, 1), o = (y * n + i) * 4;
          d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = a * 255;
        }
      }
      x.putImageData(img, 0, 0); return c;
    });
  }
  // Dotted tint (riso screens light areas as coarse dots) in one ink.
  function tintTile(col, pitch) {
    return K.cached(`riso-tint:${col}:${pitch | 0}`, () => {
      const n = Math.max(4, pitch | 0), c = K.layer(n * 2, n * 2), x = c.getContext('2d');
      x.fillStyle = col;
      for (const [cx, cy] of [[0, 0], [n * 2, 0], [0, n * 2], [n * 2, n * 2], [n, n]]) { x.beginPath(); x.arc(cx, cy, n * 0.32, 0, Math.PI * 2); x.fill(); }
      return c;
    });
  }
  // Draw `fn` as one ink pass: multiply, misregistered, filled/stroked with the grainy ink pattern.
  function plate(ctx, col, fn, o = {}) {
    const key = col === INK.pink ? 'pink' : col === INK.blue ? 'blue' : col === INK.yellow ? 'yellow' : 'blue';
    const [dx, dy] = off(ctx, key);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.translate(dx, dy);
    const pat = ctx.createPattern(o.tint ? tintTile(col, o.tint) : inkTile(col), 'repeat');
    ctx.fillStyle = pat; ctx.strokeStyle = pat;
    fn(); ctx.restore();
  }
  // drum-roll reveal: the ink appears top-down as the sheet passes under the drum
  function roll(ctx, x, y, w, h, p, fn) {
    if (p <= 0) return; if (p >= 1) { fn(); return; }
    ctx.save(); ctx.beginPath(); ctx.rect(x - 20, y - 20, w + 40, (h + 40) * p); ctx.clip(); fn(); ctx.restore();
  }
  const measure = (ctx, text, size, fam) => { ctx.save(); ctx.font = K.font(size, fam, fam === MONO ? 700 : 400); const w = ctx.measureText(text).width; ctx.restore(); return w; };

  const style = {
    id: 'risograph', name: 'Risograph Zine', family: 'Print',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Space+Mono:wght@400;700&display=block', specs: ['400 64px "Archivo Black"', '700 30px "Space Mono"', '400 24px "Space Mono"'] }],
    palette: { bg: INK.paper, ink: INK.blue, accent: INK.pink, pink: INK.pink, blue: INK.blue, yellow: INK.yellow },
    sfx: { draw: 'spray', land: 'click', emphasis: 'stamp', transition: 'paper', bed: 'tape' },

    background(ctx, W, H, t) {
      ctx.drawImage(K.paperTex(W, H, INK.paper, 17, 0.05, false), 0, 0);
      // stray drum specks + a ghost roller line left on the stock (cached)
      const g = K.cached(`riso-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(5), s = S(W, H);
        for (let i = 0; i < 140; i++) { x.fillStyle = K.rgba(r.pick([INK.pink, INK.blue, INK.yellow]), 0.25 + r() * 0.35); x.beginPath(); x.arc(r() * W, r() * H, (0.6 + r() * 1.6) * s, 0, 7); x.fill(); }
        x.fillStyle = 'rgba(0,120,191,0.035)'; x.fillRect(0, H * 0.31, W, 5 * s); x.fillRect(0, H * 0.77, W, 3 * s);
        return c;
      });
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.drawImage(g, 0, 0); ctx.restore();
    },

    finish(ctx, W, H, t) {
      // paper tooth over the ink: lighten specks where ink skipped, then soft grain at the print's 8 fps boil
      K.grain(ctx, W, H, Math.floor(t * 8) / 8, 0.09, 8, 'overlay');
      K.vignette(ctx, W, H, 0.07, '#6a4a3a');
    },

    // two-plate display type: pink pass rolls first, blue pass lands misregistered on top (overlap goes purple)
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 64) * s, w = measure(ctx, text, size, DISPLAY);
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      const cols = o.plates || [INK.pink, INK.blue];
      cols.forEach((col, i) => {
        roll(ctx, x0, y - size, w, size * 1.3, K.clamp(p * 1.6 - i * 0.6), () => plate(ctx, col, () => {
          ctx.font = K.font(size, DISPLAY, 400); ctx.textBaseline = 'alphabetic';
          ctx.fillText(text, x0 + (i ? 0 : 5 * s), y + (i ? 0 : 4 * s));
        }));
      });
      return { w, h: size };
    },
    // mono caption on a yellow highlighter swipe
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 30) * s, w = measure(ctx, text, size, MONO);
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      const k = K.clamp(p * 1.4);
      if (o.bar !== false) plate(ctx, o.bar || INK.yellow, () => { ctx.fillRect(x0 - 10 * s, y - size * 0.82, (w + 20 * s) * K.ease.out(k), size * 1.08); });
      roll(ctx, x0, y - size, w, size * 1.3, K.clamp((p - 0.25) / 0.75), () => plate(ctx, o.color || INK.blue, () => {
        ctx.font = K.font(size, MONO, 700); ctx.textBaseline = 'alphabetic'; ctx.fillText(text, x0, y);
      }));
      return { w, h: size };
    },
    // dotted blue flow arrow: round dots laid along the path, solid triangular head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.15, 60), q = K.trim(pts, K.clamp(p));
      if (q.length < 2) return null;
      const col = o.color || INK.blue, gap = (o.gap || 15) * s, rad = (o.dot || 4.4) * s, len = K.pathLen(q);
      plate(ctx, col, () => {
        for (let d = 0; d < len - rad * 2; d += gap) { const pt = K.trim(q, d / len); const e = pt[pt.length - 1]; ctx.beginPath(); ctx.arc(e[0], e[1], rad, 0, 7); ctx.fill(); }
        if (p > 0.05) {
          const b = q[q.length - 1], a = q[Math.max(0, q.length - 4)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hl = 22 * s;
          ctx.beginPath(); ctx.moveTo(b[0] + Math.cos(ang) * 4 * s, b[1] + Math.sin(ang) * 4 * s);
          ctx.lineTo(b[0] - Math.cos(ang - 0.5) * hl, b[1] - Math.sin(ang - 0.5) * hl); ctx.lineTo(b[0] - Math.cos(ang + 0.5) * hl, b[1] - Math.sin(ang + 0.5) * hl); ctx.fill();
        }
      });
      return q[q.length - 1];
    },
    // card: yellow solid, pink dotted tint, blue key line all from separate passes
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx);
      roll(ctx, x, y, w, h, K.clamp(p * 1.8), () => plate(ctx, o.fill || INK.yellow, () => ctx.fillRect(x, y, w, h)));
      roll(ctx, x, y, w, h, K.clamp(p * 1.8 - 0.4), () => plate(ctx, o.tint || INK.pink, () => ctx.fillRect(x + w * 0.5, y, w * 0.5, h), { tint: 9 * s }));
      roll(ctx, x, y, w, h, K.clamp(p * 1.8 - 0.8), () => plate(ctx, o.color || INK.blue, () => { ctx.lineWidth = 6 * s; ctx.strokeRect(x, y, w, h); }));
    },
    counter(ctx, value, x, y, p, o = {}) {
      return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 128, align: o.align || 'center', plates: [INK.pink, INK.blue] });
    },
    // scribbled pink loop, three passes of a fat riso marker
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), pts = K.wobble(K.circlePts(x, y, r * 1.2, r * 0.62, 120, -2.6, Math.PI * 4.3), 7 * s, o.seed || 9, 0.02);
      plate(ctx, o.color || INK.pink, () => { const q = K.trim(pts, K.clamp(p)); if (q.length < 2) return; ctx.lineWidth = 8 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; K.poly(ctx, q); ctx.stroke(); });
    },
    // a fresh sheet fed through the drum: slides down over the frame (covered at 0.5) and out the bottom,
    // the leading edge wet with three bands of ink
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), y = K.lerp(-H * 1.05, H * 1.05, K.ease.inOut(p));
      ctx.save();
      ctx.fillStyle = 'rgba(40,30,30,0.18)'; ctx.fillRect(0, y + H, W, 18 * s);
      ctx.save(); ctx.beginPath(); ctx.rect(0, y, W, H); ctx.clip(); ctx.translate(0, y); style.background(ctx, W, H, 0); ctx.restore();
      [INK.yellow, INK.pink, INK.blue].forEach((c, i) => plate(ctx, c, () => ctx.fillRect(0, y + H - (60 - i * 16) * s, W, 22 * s)));
      ctx.restore();
    },
  };

  // ---------- the shared demo: a one-page zine run through the drum ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const BAR = [INK.yellow, INK.pink, INK.yellow, INK.yellow, INK.pink, INK.yellow, INK.yellow];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [80 * s, 190 * s], video: [80 * s, 300 * s, 270 * s, 165 * s], node: [470 * s, 310 * s, 300 * s, 140 * s],
      chips: PL.map((_, i) => [960 * s, (238 + i * 66) * s]), top: [W / 2, 110 * s], counter: [W / 2, 420 * s], take: [W / 2, 640 * s] };
    return { s, P: true, title: [W * 0.08, H * 0.115], video: [W * 0.08, H * 0.2, W * 0.5, H * 0.13], node: [W * 0.17, H * 0.42, W * 0.66, H * 0.085],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.6 + Math.floor(i / 2) * 0.08)]), top: [W / 2, H * 0.22], counter: [W / 2, H * 0.5], take: [W / 2, H * 0.76] };
  }
  // registration over time: plates slide in one drum pass at a time at the start of each scene, and boil at 8 fps
  function setReg(t, W, H) {
    const s = S(W, H), f = Math.floor(t * 8), r = K.rng(f * 7 + 1), j = () => (r() - 0.5) * 1.6 * s;
    const slide = (t0, dir) => { const k = 1 - K.beat(t, t0, 0.55, 'out'); return [dir[0] * k * W * 0.6, dir[1] * k * H * 0.25]; };
    const sc = t >= 8.3 ? 8.3 : 0;
    const y = slide(sc + 0.0, [-1, 0.3]), pk = slide(sc + 0.15, [1, -0.2]), b = slide(sc + 0.3, [0.4, 1]);
    REG = { yellow: [y[0] + j(), y[1] + j()], pink: [pk[0] + j(), pk[1] + j()], blue: [b[0] + j(), b[1] + j()] };
  }
  function sun(ctx, x, y, r, s) {
    plate(ctx, INK.yellow, () => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill(); });
    plate(ctx, INK.pink, () => { ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.clip(); for (let i = 0; i < 5; i++) ctx.fillRect(x - r, y + r * (0.25 + i * 0.15), r * 2, r * (0.04 + i * 0.012)); });
    plate(ctx, INK.pink, () => { ctx.beginPath(); ctx.arc(x + r * 0.15, y - r * 0.1, r * 0.82, 0, 7); ctx.fill(); }, { tint: 7 * s });
  }
  function stars(ctx, W, H, s) {
    const r = K.rng(12);
    plate(ctx, INK.blue, () => { for (let i = 0; i < 9; i++) { const x = r() * W, y = r() * H * 0.95, k = (5 + r() * 6) * s; ctx.fillRect(x - k, y - 1.3 * s, k * 2, 2.6 * s); ctx.fillRect(x - 1.3 * s, y - k, 2.6 * s, k * 2); } });
  }
  function playCard(ctx, x, y, w, h, p, s) {
    style.box(ctx, x, y, w, h, p, { fill: INK.yellow, tint: INK.pink });
    if (p > 0.6) plate(ctx, INK.blue, () => { const r = Math.min(w, h) * 0.26, cx = x + w * 0.5, cy = y + h * 0.5; ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx - r * 0.6, cy + r); ctx.fill(); });
  }
  function node(ctx, x, y, w, h, p, s, size) {
    roll(ctx, x, y, w, h, K.clamp(p * 1.6), () => plate(ctx, INK.blue, () => ctx.fillRect(x, y, w, h)));
    roll(ctx, x, y, w, h, K.clamp(p * 1.6 - 0.5), () => plate(ctx, INK.pink, () => ctx.fillRect(x + 10 * s, y + h - 16 * s, w - 20 * s, 8 * s)));
    if (p > 0.45) {
      const sz = K.fitSize(ctx, 'CREATOR OS', DISPLAY, 400, size * s, w * 0.86); ctx.save(); ctx.font = K.font(sz, DISPLAY, 400); const tw = ctx.measureText('CREATOR OS').width; ctx.restore();
      // knocked-out lettering: paper shows through the blue, yellow pass printed into the counter
      roll(ctx, x, y, w, h, K.clamp((p - 0.45) / 0.55), () => {
        ctx.save(); ctx.font = K.font(sz, DISPLAY, 400); ctx.fillStyle = ctx.createPattern(K.paperTex(ctx.canvas.width, ctx.canvas.height, INK.paper, 17, 0.05, false), 'no-repeat'); ctx.textBaseline = 'middle'; const [bx, by] = off(ctx, 'blue'); ctx.fillText('CREATOR OS', x + w / 2 - tw / 2 + bx, y + h / 2 + by); ctx.restore();
      });
    }
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      setReg(t, W, H);
      style.background(ctx, W, H, t);
      if (!scene2) {
        sun(ctx, P ? W * 0.84 : W * 0.9, P ? H * 0.9 : 112 * s, (P ? 130 : 92) * s, s);
        stars(ctx, W, H, s);
        style.label(ctx, 'ZINE No.07 / CREATOR OS', Lo.title[0], Lo.title[1] - (P ? 105 : 95) * s, K.beat(t, 0.1, 0.5, 'lin'), { size: 24, bar: INK.yellow, color: INK.blue });
        const tp = K.beat(t, 0.25, 1.3, 'lin');
        if (P) { style.title(ctx, 'One video.', Lo.title[0], Lo.title[1] - 20 * s, tp, { size: 62 }); style.title(ctx, 'Every platform.', Lo.title[0], Lo.title[1] + 64 * s, K.beat(t, 0.8, 1.2, 'lin'), { size: 62 }); }
        else style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], tp, { size: 60 });
        const [vx, vy, vw, vh] = Lo.video;
        playCard(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.8, 'lin'), s);
        style.label(ctx, 'your video', vx, vy + vh + 50 * s, K.beat(t, 2.6, 0.5, 'lin'), { size: 32, bar: INK.pink });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw + 20 * s, vy + vh * 0.6], [nx + nw * 0.7, ny - 20 * s]] : [[vx + vw + 16 * s, vy + vh / 2], [nx - 18 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.2, 0.8, 'lin'), { bend: P ? -0.25 : -0.12 });
        node(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.9, 'lin'), s, 46);
        if (P) style.arrow(ctx, [W / 2, ny + nh + 16 * s], [W / 2, Lo.chips[6][1] + 10 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0 });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 16 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 12 * s] : [cx - 22 * s, cy - 11 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, gap: 13, dot: 3.6, color: i % 3 === 1 ? INK.pink : INK.blue });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.25, 0.35, 'lin'), { size: P ? 32 : 34, align: P ? (left ? 'right' : 'left') : 'left', bar: BAR[i] });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * 0.85, h2 = nh * 0.85;
        stars(ctx, W, H, s);
        node(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, s, 42);
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 108 : 132 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 70 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 36, bar: INK.yellow });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 20 * s, (P ? 300 : 330) * s, K.beat(t, 10.0, 0.6, 'lin'), {});
        const tk = K.beat(t, 10.5, 1.0, 'lin');
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1], tk, { size: 60, align: 'center' }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 80 * s, K.beat(t, 10.8, 0.9, 'lin'), { size: 60, align: 'center' }); }
        else style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], tk, { size: 58, align: 'center' });
        if (t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      }
      REG = null;
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('tape', 0, 12, 1.2); k.bed('room', 0, 12, 0.7);
      k.play('whoosh', 0.0, { dur: 0.5, gain: 0.5 }); k.play('paper', 0.2, { dur: 0.5 }); k.play('scribble', 0.25, { medium: 'spray', dur: 1.3 });
      k.play('scribble', 2.0, { medium: 'spray', dur: 0.8 }); k.play('click', 2.7); k.play('click', 2.9, { pitch: 1.2 });
      k.play('scribble', 3.2, { medium: 'spray', dur: 0.8, gain: 0.7 }); k.play('scribble', 4.0, { medium: 'spray', dur: 0.9 }); k.play('click', 4.5); k.play('pop', 4.9, { gain: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'spray', dur: 0.3, gain: 0.6 }); k.play('click', 5.3 + i * 0.4, { pitch: 1 + i * 0.08 }); }
      k.play('paper', 7.4, { dur: 1.6 }); k.play('whoosh', 7.6, { dur: 1.2 }); k.play('thud', 8.3, { gain: 0.4 });
      k.play('click', 8.3); k.play('click', 8.45, { pitch: 1.2 }); k.play('click', 8.6, { pitch: 1.4 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0); k.play('scribble', 10.0, { medium: 'marker', dur: 0.6 });
      k.play('scribble', 10.5, { medium: 'spray', dur: 1.0 }); k.play('chime', 11.4, { note: 'E6' });
    },
  };
  MS.register(style);
})();
