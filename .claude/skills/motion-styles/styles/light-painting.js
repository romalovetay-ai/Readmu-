// Light Painting (Light & Imaging). A long exposure in a dark field: everything is drawn in the air with an LED wand,
// so every line is a hand-jittered trail with a white-hot core and coloured falloff, a twisting RGB light-tube ribbon
// loops the hub, numbers come from an LED pixel stick, a ghost of the painter builds up, stars trail, the horizon
// glows with bokeh and the colours spill onto the wet grass.
(function () {
  const ID = 'light-painting';
  const C = { sky: '#05070f', cyan: '#4ff3ff', magenta: '#ff4fd8', amber: '#ffb347', lime: '#9dff6a', violet: '#9b7bff', white: '#fff7ea' };
  const F = 'Caveat';
  const S = (W, H) => K.layout(W, H).s;
  const cw = (ctx) => [ctx.canvas.width, ctx.canvas.height];
  const horizon = (W, H) => H * (H > W ? 0.83 : 0.8);

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

  // ---------- the night plate: sky, treeline, horizon bokeh, grass ----------
  function nightPlate(W, H) {
    return K.cached(`${ID}:night:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), hy = horizon(W, H), r = K.rng(5), nz = K.noise(6);
      const g = x.createLinearGradient(0, 0, 0, hy); g.addColorStop(0, '#02030a'); g.addColorStop(0.7, '#070b1c'); g.addColorStop(1, '#13162a');
      x.fillStyle = g; x.fillRect(0, 0, W, hy);
      // horizon city glow
      const hg = x.createLinearGradient(0, hy - 120 * s, 0, hy); hg.addColorStop(0, 'rgba(255,140,80,0)'); hg.addColorStop(1, 'rgba(255,140,80,0.12)');
      x.fillStyle = hg; x.fillRect(0, hy - 120 * s, W, 120 * s);
      // bokeh along the horizon (out-of-focus distant lights)
      for (let i = 0; i < 26; i++) {
        const bx = r() * W, by = hy - (4 + r() * 16) * s, br = (6 + r() * 16) * s, col = r.pick(['255,190,110', '255,150,90', '200,220,255', '255,230,170']);
        const bg = x.createRadialGradient(bx, by, br * 0.6, bx, by, br); bg.addColorStop(0, `rgba(${col},${0.18 + r() * 0.2})`); bg.addColorStop(0.85, `rgba(${col},${0.12 + r() * 0.12})`); bg.addColorStop(1, `rgba(${col},0)`);
        x.fillStyle = bg; x.beginPath(); x.arc(bx, by, br, 0, 7); x.fill();
      }
      // treeline silhouette
      x.fillStyle = '#020306'; x.beginPath(); x.moveTo(0, hy);
      for (let px = 0; px <= W; px += 6 * s) x.lineTo(px, hy - (8 + 22 * Math.max(0, nz.fbm2(px * 0.004, 1.3, 4) + 0.15) + 10 * Math.abs(nz.n2(px * 0.05, 2))) * s);
      x.lineTo(W, hy); x.closePath(); x.fill();
      // field
      const fg = x.createLinearGradient(0, hy, 0, H); fg.addColorStop(0, '#05070a'); fg.addColorStop(1, '#010203');
      x.fillStyle = fg; x.fillRect(0, hy, W, H - hy);
      x.strokeStyle = 'rgba(70,90,80,0.22)'; x.lineWidth = 1 * s;
      for (let i = 0; i < 900; i++) { const gx = r() * W, gy = hy + Math.pow(r(), 0.7) * (H - hy), gl = (4 + r() * 12) * s * (0.4 + (gy - hy) / (H - hy)); x.beginPath(); x.moveTo(gx, gy); x.quadraticCurveTo(gx + (r() - 0.5) * 4 * s, gy - gl * 0.6, gx + (r() - 0.5) * 8 * s, gy - gl); x.stroke(); }
      return c;
    });
  }
  // Star trails: arcs around a pole above the frame that lengthen as the exposure runs.
  function stars(ctx, W, H, t) {
    const s = S(W, H), r = K.rng(77), hy = horizon(W, H), pole = [W * 0.62, -H * 0.9], len = 0.0016 + t * 0.00055;
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < 170; i++) {
      const sx = r() * W, sy = r() * hy * 0.95, b = Math.pow(r(), 3), dx = sx - pole[0], dy = sy - pole[1], rad = Math.hypot(dx, dy), a0 = Math.atan2(dy, dx);
      ctx.strokeStyle = `rgba(${220 + b * 35},${225 + b * 30},255,${0.25 + b * 0.7})`; ctx.lineWidth = (0.8 + b * 1.6) * s;
      ctx.beginPath(); ctx.arc(pole[0], pole[1], rad, a0, a0 + len); ctx.stroke();
    }
    ctx.restore();
  }

  // ---------- the wand ----------
  // One light trail: hand jitter, coloured falloff, white-hot core. Returns the wand tip.
  function trail(ctx, pts, p, col, s, o = {}) {
    if (p <= 0) return null;
    const q0 = K.wobble(pts, (o.jit ?? 1.6) * s, o.seed || 1, 0.09), q = K.trim(q0, p);
    if (q.length < 2) return null;
    const lw = (o.lw || 5) * s;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = K.rgba(col, 0.1); ctx.lineWidth = lw * 4.5; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = K.rgba(col, 0.55); ctx.lineWidth = lw * 1.6; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = K.rgba(K.mix(col, '#ffffff', 0.7), 0.95); ctx.lineWidth = lw * 0.5; K.poly(ctx, q); ctx.stroke();
    ctx.restore();
    return q[q.length - 1];
  }
  function tip(ctx, at, col, s) {
    if (!at) return;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(at[0], at[1], 0, at[0], at[1], 34 * s); g.addColorStop(0, 'rgba(255,255,255,0.95)'); g.addColorStop(0.15, K.rgba(col, 0.7)); g.addColorStop(1, K.rgba(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(at[0], at[1], 34 * s, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.2 * s;
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 4; ctx.beginPath(); ctx.moveTo(at[0] - Math.cos(a) * 26 * s, at[1] - Math.sin(a) * 26 * s); ctx.lineTo(at[0] + Math.cos(a) * 26 * s, at[1] + Math.sin(a) * 26 * s); ctx.stroke(); }
    ctx.restore();
  }
  // The painter, half there: a translucent figure that builds up the longer the shutter stays open.
  function ghost(ctx, x, y, h, a, armTo) {
    if (a <= 0) return;
    ctx.save(); ctx.globalAlpha = a; ctx.filter = 'blur(3px)';
    const u = h;
    const g = ctx.createLinearGradient(x, y - u, x, y); g.addColorStop(0, 'rgba(150,170,230,0.55)'); g.addColorStop(1, 'rgba(90,110,170,0.25)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(x, y - u * 0.9, u * 0.055, u * 0.07, 0, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(x - u * 0.1, y - u * 0.8); ctx.quadraticCurveTo(x - u * 0.13, y - u * 0.5, x - u * 0.08, y - u * 0.45);
    ctx.lineTo(x - u * 0.09, y); ctx.lineTo(x - u * 0.02, y); ctx.lineTo(x, y - u * 0.4); ctx.lineTo(x + u * 0.02, y); ctx.lineTo(x + u * 0.09, y);
    ctx.lineTo(x + u * 0.08, y - u * 0.45); ctx.quadraticCurveTo(x + u * 0.13, y - u * 0.5, x + u * 0.1, y - u * 0.8); ctx.closePath(); ctx.fill();
    armTo = armTo || [x - u * 0.16, y - u * 1.12];
    if (armTo) { ctx.strokeStyle = 'rgba(150,170,230,0.45)'; ctx.lineWidth = u * 0.035; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x - u * 0.07, y - u * 0.76); ctx.quadraticCurveTo(x - u * 0.2, y - u * 0.9, armTo[0], armTo[1]); ctx.stroke(); }
    ctx.restore();
  }
  // RGB light-tube ribbon: many thin strands with hue across the width, twisting around an ellipse.
  function ribbon(ctx, cx, cy, rx, ry, p, s, t) {
    if (p <= 0) return;
    const N = 22, M = 90, sweep = Math.PI * 2 * 1.02 * p, a0 = -Math.PI * 0.85;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1.6 * s;
    for (let j = 0; j < N; j++) {
      const k = j / (N - 1) - 0.5, hue = 180 + j * (220 / N);
      ctx.strokeStyle = `hsla(${hue % 360},100%,62%,0.32)`; ctx.beginPath();
      for (let i = 0; i <= M; i++) {
        const a = a0 + (sweep * i) / M, tw = Math.cos(a * 2 + 0.6) * 26 * s;
        const r1 = 1 + (k * tw) / rx, px = cx + Math.cos(a) * rx * r1, py = cy + Math.sin(a) * ry * r1 + k * tw * 0.5 * Math.cos(a);
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  // LED pixel stick: 5x7 glyphs, each lit LED smeared sideways as the stick was walked across.
  const GLYPH = {
    0: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'], 1: ['00100', '01100', '00100', '00100', '00100', '00100', '01110'],
    2: ['01110', '10001', '00001', '00010', '00100', '01000', '11111'], 3: ['11110', '00001', '00001', '01110', '00001', '00001', '11110'],
    4: ['00010', '00110', '01010', '10010', '11111', '00010', '00010'], 5: ['11111', '10000', '11110', '00001', '00001', '10001', '01110'],
    6: ['00110', '01000', '10000', '11110', '10001', '10001', '01110'], 7: ['11111', '00001', '00010', '00100', '01000', '01000', '01000'],
    8: ['01110', '10001', '10001', '01110', '10001', '10001', '01110'], 9: ['01110', '10001', '10001', '01111', '00001', '00010', '01100'],
    ',': ['00', '00', '00', '00', '01', '01', '10'],
  };

  const style = {
    id: ID, name: 'Light Painting', family: 'Light & Imaging',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Caveat:wght@600;700&display=block', specs: ['700 60px "Caveat"', '600 36px "Caveat"'] }],
    palette: { bg: C.sky, ...C },
    sfx: { draw: 'spray', land: 'pluck', emphasis: 'ding', transition: 'whoosh', bed: 'space' },
    setup(W, H) { nightPlate(W, H); },

    background(ctx, W, H, t) { ctx.drawImage(nightPlate(W, H), 0, 0); stars(ctx, W, H, t); },

    finish(ctx, W, H, t) {
      const s = S(W, H), hy = horizon(W, H), rh = H - hy;
      // colour spill on the grass: the painting, flipped, squashed and soft
      const sw = Math.ceil(W / 6), sh = Math.ceil(rh / 6);
      const src = K.cached(`${ID}:spill:${sw}x${sh}`, () => K.layer(sw, sh)), sx = src.getContext('2d');
      sx.save(); sx.globalCompositeOperation = 'copy'; sx.filter = 'blur(2px)'; sx.setTransform(1, 0, 0, -1, 0, sh);
      sx.drawImage(ctx.canvas, 0, hy - rh * 2.2, W, rh * 2.2, 0, 0, sw, sh); sx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.5; ctx.drawImage(src, 0, hy, W, rh); ctx.restore();
      const g = ctx.createLinearGradient(0, hy, 0, H); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = g; ctx.fillRect(0, hy, W, rh);
      bloom(ctx, W, H, 4, 2.5, 0.5, 0.7);
      bloom(ctx, W, H, 8, 8, 0.3, 0.8);
      K.vignette(ctx, W, H, 0.55, '#000');
      K.grain(ctx, W, H, t, 0.07, 24, 'overlay');
    },

    // Handwriting in light: revealed left to right behind the wand tip, double-exposed a hair apart.
    title(ctx, text, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 64) * s, col = o.color || C.amber;
      ctx.save(); ctx.font = K.font(size, F, 700);
      let lines = [text];
      if (o.maxW && ctx.measureText(text).width > o.maxW) lines = K.wrap(ctx, text, o.maxW);
      const lh = size * 1.0, ws = lines.map((l) => ctx.measureText(l).width), total = ws.reduce((a, b) => a + b, 0);
      let done = 0, at = null;
      lines.forEach((ln, li) => {
        const lw = ws[li], x0 = o.align === 'center' ? x - lw / 2 : o.align === 'right' ? x - lw : x, yy = y - (lines.length - 1 - li) * lh;
        const share = K.clamp((p * total - done) / lw); done += lw;
        if (share <= 0) return;
        ctx.save(); ctx.beginPath(); ctx.rect(x0 - 20 * s, yy - size, lw * share + 20 * s + (share >= 1 ? size * 0.4 : 0), size * 1.5); ctx.clip();
        ctx.globalCompositeOperation = 'lighter';
        ctx.shadowColor = col; ctx.shadowBlur = 18 * s; ctx.fillStyle = K.rgba(col, 0.75); ctx.fillText(ln, x0, yy);
        ctx.shadowBlur = 0; ctx.fillStyle = K.rgba(K.mix(col, '#ffffff', 0.6), 0.5); ctx.fillText(ln, x0 + 1.2 * s, yy - 0.8 * s);
        ctx.fillStyle = K.rgba(K.mix(col, '#ffffff', 0.85), 0.55); ctx.fillText(ln, x0 - 0.6 * s, yy + 0.5 * s);
        ctx.restore();
        if (share < 1) at = [x0 + lw * share, yy - size * 0.35];
      });
      ctx.restore();
      if (at && o.tip !== false) tip(ctx, at, col, s);
      return { w: Math.max(...ws), h: lh * lines.length, tip: at };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 40, color: C.cyan, ...o }); },

    arrow(ctx, from, to, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), col = o.color || C.magenta;
      const pts = K.arcPts(from, to, o.bend ?? 0.15, 40), sp = K.clamp(p / 0.8);
      const at = trail(ctx, pts, sp, col, s, { seed: o.seed || 3, lw: o.lw || 4.5 });
      if (p > 0.8) {
        const hp = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 22 * s;
        trail(ctx, [[b[0] - Math.cos(ang - 0.55) * L, b[1] - Math.sin(ang - 0.55) * L], b, [b[0] - Math.cos(ang + 0.55) * L, b[1] - Math.sin(ang + 0.55) * L]], hp, col, s, { seed: (o.seed || 3) + 1, lw: o.lw || 4.5, jit: 0.8 });
        return hp < 1 ? b : null;
      }
      return sp < 1 ? at : null;
    },

    // A traced frame: the painter's rectangle, corners rounded by the swing, the end overshooting the start.
    box(ctx, x, y, w, h, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), col = o.color || C.violet, r = 16 * s;
      const pts = [[x + r, y - 3 * s], [x + w - r, y], [x + w, y + r], [x + w + 2 * s, y + h - r], [x + w - r, y + h], [x + r, y + h + 2 * s], [x, y + h - r], [x - 2 * s, y + r], [x + r * 1.2, y + 2 * s], [x + r * 3.5, y + 5 * s]];
      const sm = []; for (let i = 0; i < pts.length - 1; i++) for (let k = 0; k < 10; k++) { const u = k / 10; sm.push([K.lerp(pts[i][0], pts[i + 1][0], u), K.lerp(pts[i][1], pts[i + 1][1], u)]); }
      sm.push(pts[pts.length - 1]);
      return trail(ctx, sm, p, col, s, { seed: o.seed || 9, lw: 5, jit: 2 });
    },

    counter(ctx, value, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), text = K.fmt(Math.round(value)), pitch = (o.size || 110) / 7 * s;
      let total = 0; for (const ch of text) total += (GLYPH[ch][0].length + 1) * pitch;
      let cx = (o.align === 'left' ? x : x - total / 2), shown = K.clamp(p);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const top = y - pitch * 7;
      let col = 0; const cols = Math.round(total / pitch);
      for (const ch of text) {
        const g = GLYPH[ch];
        for (let c = 0; c < g[0].length; c++, col++) {
          if (col / cols > shown) break;
          const hue = 20 + (col / cols) * 300;
          for (let rr = 0; rr < 7; rr++) if (g[rr][c] === '1') {
            const px = cx + c * pitch, py = top + rr * pitch;
            ctx.fillStyle = `hsla(${hue},100%,60%,0.35)`; ctx.beginPath(); ctx.ellipse(px, py, pitch * 0.62, pitch * 0.42, 0, 0, 7); ctx.fill();
            ctx.fillStyle = `hsla(${hue},100%,88%,0.95)`; ctx.beginPath(); ctx.ellipse(px, py, pitch * 0.32, pitch * 0.2, 0, 0, 7); ctx.fill();
          }
        }
        cx += (g[0].length + 1) * pitch; col++;
      }
      ctx.restore();
      return { w: total, h: pitch * 7 };
    },

    // A ring traced around the moment, then a burst of sparks where it closes.
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), col = o.color || C.amber, rx = r * (o.wide ?? 1.25), ry = r * (o.tall ?? 0.75);
      const pts = K.circlePts(x, y, rx, ry, 90, -2.3, Math.PI * 2.18);
      const at = trail(ctx, pts, K.clamp(p / 0.7), col, s, { seed: o.seed || 17, lw: 5, jit: 2.4 });
      if (p < 0.7) tip(ctx, at, col, s);
      if (p > 0.68) {
        const k = K.clamp((p - 0.68) / 0.32), e = pts[pts.length - 1], rnd = K.rng(o.seed || 23);
        ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
        for (let i = 0; i < 18; i++) {
          const a = rnd() * Math.PI * 2, d0 = 6 * s + k * (40 + rnd() * 60) * s, d1 = d0 + (10 + rnd() * 30) * s * (1 - k * 0.6);
          ctx.strokeStyle = K.rgba(K.mix(col, '#ffffff', 0.5), (1 - k) * 0.9); ctx.lineWidth = 2 * s;
          ctx.beginPath(); ctx.moveTo(e[0] + Math.cos(a) * d0, e[1] + Math.sin(a) * d0 + k * k * 30 * s); ctx.lineTo(e[0] + Math.cos(a) * d1, e[1] + Math.sin(a) * d1 + k * k * 34 * s); ctx.stroke();
        }
        ctx.restore();
      }
    },

    // Whip-pan: the camera swings, every light smears into horizontal streaks, then lands on fresh dark.
    transition(ctx, W, H, p, o = {}) {
      const k = Math.sin(Math.PI * p), s = S(W, H);
      const tmp = K.cached(`${ID}:tmp:${W}x${H}`, () => K.layer(W, H)), tx = tmp.getContext('2d');
      tx.globalCompositeOperation = 'copy'; tx.drawImage(ctx.canvas, 0, 0);
      const dx = p < 0.5 ? -K.ease.in(p * 2) * W * 0.8 : (1 - K.ease.out((p - 0.5) * 2)) * W * 0.8;
      ctx.save(); ctx.fillStyle = '#03040a'; ctx.globalAlpha = 1; ctx.fillRect(0, 0, W, H);
      ctx.globalCompositeOperation = 'lighter';
      const n = 12;
      for (let i = 0; i < n; i++) { ctx.globalAlpha = i === 0 ? 1 - k * 0.7 : k * 0.16; ctx.drawImage(tmp, dx + (i / (n - 1) - 0.5) * k * 260 * s, 0); }
      ctx.globalAlpha = k * 0.6; ctx.drawImage(tmp, 0, 0, W, H, dx - W * 0.4 * k, 0, W * (1 + 0.8 * k), H);
      ctx.restore();
    },
  };

  // ---------- the shared demo: one long exposure, then a whip-pan to a second ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [C.magenta, C.cyan, C.amber, C.white, C.lime, C.violet, C.cyan];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 100 * s], video: [96 * s, 248 * s, 250 * s, 150 * s], node: [482 * s, 262 * s, 300 * s, 124 * s],
      chips: PLATFORMS.map((n, i) => [950 * s, (176 + i * 60) * s]), node2: [W / 2 - 150 * s, 66 * s, 300 * s, 100 * s], counter: [W / 2, 356 * s], views: 466 * s, take: 556 * s, ghost: [W * 0.94, horizon(W, H) + 20 * s, 300 * s] };
    return { s, P: true, title: [W / 2, H * 0.11], video: [W * 0.27, H * 0.15, W * 0.46, H * 0.105], node: [W * 0.16, H * 0.36, W * 0.68, H * 0.08],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.53 + Math.floor(i / 2) * 0.072)]), node2: [W * 0.16, H * 0.11, W * 0.68, H * 0.08], counter: [W / 2, H * 0.38], views: H * 0.47, take: H * 0.64, ghost: [W * 0.88, horizon(W, H) + 30 * s, 330 * s] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      let wand = null, wandCol = C.white;
      const track = (pt, p, col) => { if (pt && p > 0 && p < 1) { wand = pt; wandCol = col; } };
      if (t < 8.25) {
        const [nx, ny, nw, nh] = Lo.node, [vx, vy, vw, vh] = Lo.video;
        ghost(ctx, Lo.ghost[0], Lo.ghost[1], Lo.ghost[2], 0.05 + 0.2 * K.clamp(t / 8), null);
        const tp = K.beat(t, 0.15, 1.5, 'lin');
        track(style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], tp, { size: P ? 60 : 66, align: 'center', color: C.amber, maxW: W * 0.9, tip: false }).tip, tp, C.amber);
        const bp = K.beat(t, 2.0, 0.9, 'lin');
        track(style.box(ctx, vx, vy, vw, vh, bp, { color: C.cyan, seed: 21 }), bp, C.cyan);
        const pp = K.beat(t, 2.6, 0.4, 'lin'), cx = vx + vw / 2, cy = vy + vh / 2, r = vh * 0.24;
        track(trail(ctx, [[cx - r * 0.6, cy - r], [cx + r, cy], [cx - r * 0.6, cy + r], [cx - r * 0.6, cy - r * 1.05]], pp, C.magenta, s, { seed: 22, lw: 5 }), pp, C.magenta);
        const lp = K.beat(t, 3.0, 0.5, 'lin');
        const lr = style.label(ctx, 'your video', cx, vy + vh + 52 * s, lp, { align: 'center', color: C.lime, tip: false }); track(lr.tip, lp, C.lime);
        const a1 = P ? [[cx, vy + vh + 80 * s], [nx + nw / 2, ny - 16 * s]] : [[vx + vw + 16 * s, vy + vh / 2], [nx - 18 * s, ny + nh / 2]];
        const ap = K.beat(t, 3.4, 0.7, 'lin'); track(style.arrow(ctx, a1[0], a1[1], ap, { bend: P ? 0.04 : -0.15, color: C.magenta, seed: 31 }), ap, C.magenta);
        const np = K.beat(t, 4.0, 0.8, 'lin'); track(style.box(ctx, nx, ny, nw, nh, np, { color: C.violet, seed: 41 }), np, C.violet);
        ribbon(ctx, nx + nw / 2, ny + nh / 2, nw * (P ? 0.62 : 0.7), nh * 0.95, K.beat(t, 4.3, 3.2, 'inOut'), s, t);
        const cp = K.beat(t, 4.5, 0.5, 'lin');
        const cr = style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 18 * s, cp, { size: P ? 52 : 56, align: 'center', color: C.white, tip: false }); track(cr.tip, cp, C.white);
        if (P) { const tp2 = K.beat(t, 4.95, 0.5, 'lin'); track(style.arrow(ctx, [W / 2, ny + nh + 16 * s], [W / 2, Lo.chips[6][1] + 2 * s], tp2, { bend: 0.02, color: C.violet, seed: 49 }), tp2, C.violet); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.36, [lx, ly] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, ly - 14 * s] : [nx + nw + 16 * s, ny + nh / 2];
          const to = P ? [left ? W * 0.42 : W * 0.58, ly - 14 * s] : [lx - 18 * s, ly - 12 * s];
          const ap2 = K.beat(t, t0, 0.32, 'lin'); track(style.arrow(ctx, from, to, ap2, { bend: P ? 0 : (i - 3) * 0.035, color: COLS[i], seed: 50 + i, lw: 3.5 }), ap2, COLS[i]);
          const lp2 = K.beat(t, t0 + 0.28, 0.35, 'lin');
          const r2 = style.label(ctx, name, lx, ly, lp2, { size: P ? 44 : 42, color: COLS[i], align: P ? (left ? 'right' : 'left') : 'left', tip: false }); track(r2.tip, lp2, COLS[i]);
        });
      } else {
        const [x2, y2, w2, h2] = Lo.node2;
        ghost(ctx, Lo.ghost[0], Lo.ghost[1], Lo.ghost[2], 0.04 + 0.16 * K.clamp((t - 8.25) / 3.5), null);
        ribbon(ctx, x2 + w2 / 2, y2 + h2 / 2, w2 * (P ? 0.62 : 0.66), h2 * 0.9, 1, s, t);
        style.box(ctx, x2, y2, w2, h2, 1, { color: C.violet, seed: 41 });
        style.title(ctx, 'Creator OS', W / 2, y2 + h2 / 2 + 18 * s, 1, { size: P ? 52 : 52, align: 'center', color: C.white, tip: false });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, v, Lo.counter[0], Lo.counter[1], K.beat(t, 8.4, 0.5, 'lin'), { size: P ? 92 : 104 });
        const vp = K.beat(t, 8.9, 0.4, 'lin'); track(style.label(ctx, 'views', W / 2, Lo.views, vp, { align: 'center', color: C.cyan, size: 44, tip: false }).tip, vp, C.cyan);
        style.emphasis(ctx, W / 2, Lo.counter[1] - (P ? 50 : 52) * s, (P ? 270 : 290) * s, K.beat(t, 9.85, 1.0, 'lin'), { wide: P ? 1.32 : 1.42, tall: P ? 0.42 : 0.36 });
        const kp = K.beat(t, 10.5, 1.0, 'lin');
        track(style.title(ctx, 'Post once. Reach everywhere.', W / 2, Lo.take, kp, { size: P ? 58 : 62, align: 'center', color: C.amber, maxW: W * 0.88, tip: false }).tip, kp, C.amber);
      }
      if (wand) tip(ctx, wand, wandCol, s);
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('space', 0, 12, 1); k.bed('room', 0, 12, 0.6);
      k.play('scribble', 0.15, { medium: 'spray', dur: 1.5, gain: 0.35 }); k.play('swell', 0.15, { chord: ['C4', 'G4', 'D5'], dur: 2 });
      k.play('scribble', 2.0, { medium: 'spray', dur: 0.9, gain: 0.35 }); k.play('pluck', 2.9, { note: 'G4' });
      k.play('scribble', 3.0, { medium: 'spray', dur: 0.5, gain: 0.3 }); k.play('whoosh', 3.4, { dur: 0.7, gain: 0.6 });
      k.play('scribble', 4.0, { medium: 'spray', dur: 0.8, gain: 0.35 }); k.play('pluck', 4.8, { note: 'C5' }); k.play('riser', 4.3, { dur: 3.2, gain: 0.5 });
      const notes = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'];
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.36, { dur: 0.3, gain: 0.35 }); k.play('pluck', 5.3 + i * 0.36, { note: notes[i], gain: 0.8 }); }
      k.play('whoosh', 7.6, { dur: 1.2, gain: 1.1 });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('scribble', 9.85, { medium: 'spray', dur: 0.7, gain: 0.35 }); k.play('ding', 10.55);
      k.play('scribble', 10.5, { medium: 'spray', dur: 1.0, gain: 0.3 }); k.play('chime', 11.5, { note: 'G5' });
    },
  };
  MS.register(style);
})();
