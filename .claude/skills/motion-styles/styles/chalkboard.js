// Chalkboard Lesson (Hand-Drawn). Dry chalk on a green slate: every stroke and letter is filled with a cached grain
// tile so it skips over the board tooth, a faint dust halo hangs around the line, old eraser swirls cloud the slate,
// and a worn oak frame with a chalk tray holds it all. Scene change = a zig-zag eraser pass that leaves a cloud.
(function () {
  const CH = { white: '#f1f0e6', yellow: '#f2d65c', pink: '#f08fb0', blue: '#8fc6ee', green: '#a7dc8a' };
  const HEAD = 'Cabin Sketch', HAND = 'Patrick Hand';
  const S = (W, H) => K.layout(W, H).s;
  const mid = (a, b, k) => [K.lerp(a[0], b[0], k), K.lerp(a[1], b[1], k)];
  const FR = (W, H) => { const s = S(W, H); return { side: 26 * s, tray: (H > W ? 54 : 50) * s }; };

  // Grain tile of one chalk colour: pixels kept or dropped by board-tooth noise, so fills look dusty and broken.
  function grain(col) {
    return K.cached('chalk-grain:' + col, () => {
      const n = 192, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data;
      const nz = K.noise(91), r = K.rng(92), [cr, cg, cb] = K.hex(col);
      for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
        // tooth: anisotropic noise (the slate was sanded horizontally) + per-pixel speckle
        const tooth = nz.n2(i * 0.35, y * 0.9) * 0.55 + nz.n2(i * 0.08, y * 0.08) * 0.25 + (r() - 0.5) * 0.9;
        const o = (y * n + i) * 4, k = 0.9 + r() * 0.2;
        d[o] = Math.min(255, cr * k); d[o + 1] = Math.min(255, cg * k); d[o + 2] = Math.min(255, cb * k);
        d[o + 3] = tooth > -0.18 ? 255 * K.clamp(0.55 + tooth) : 0;
      }
      x.putImageData(img, 0, 0); return c;
    });
  }
  const pat = (ctx, col) => ctx.createPattern(grain(col), 'repeat');

  // One chalk stroke: dust halo, grainy body, denser core, specks that fell under it.
  function chalk(ctx, pts, p, o = {}) {
    const col = o.color || CH.white, w = o.width || 6, q = K.trim(pts, p);
    if (q.length < 2) return null;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = K.rgba(col, 0.07); ctx.lineWidth = w * 2.6; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = pat(ctx, col); ctx.globalAlpha = 0.95; ctx.lineWidth = w; K.poly(ctx, q); ctx.stroke();
    ctx.globalAlpha = 0.7; ctx.lineWidth = w * 0.45; ctx.translate(w * 0.12, -w * 0.1); K.poly(ctx, q); ctx.stroke();
    ctx.restore();
    // dust specks drifting below the line
    const r = K.rng(o.seed || 1); ctx.save(); ctx.fillStyle = K.rgba(col, 0.35);
    for (let i = 0; i < q.length; i += 3) { if (r() < 0.5) continue; const pt = q[i]; ctx.fillRect(pt[0] + r.range(-w, w), pt[1] + r.range(w * 0.6, w * 4), r.range(1, 2.4), r.range(1, 2.4)); }
    ctx.restore();
    return q[q.length - 1];
  }

  // Text in chalk: each letter appears in turn, a touch rotated, filled with the grain tile and wrapped in dust.
  function chalkText(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 60) * s, fam = o.family || HEAD, col = o.color || CH.white;
    ctx.save(); ctx.font = K.font(size, fam, o.weight ?? 700);
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const n = Math.ceil(text.length * K.clamp(p)), r = K.rng(o.seed || 7);
    ctx.shadowColor = K.rgba(col, 0.35); ctx.shadowBlur = 7 * s;
    let cx = x0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], cw = ctx.measureText(ch).width, rot = (r() - 0.5) * 0.07, dy = (r() - 0.5) * 3 * s;
      if (i < n) {
        ctx.save(); ctx.translate(cx, y + dy); ctx.rotate(rot);
        ctx.fillStyle = pat(ctx, col); ctx.globalAlpha = 0.95; ctx.fillText(ch, 0, 0);
        ctx.globalAlpha = 0.45; ctx.fillText(ch, 1.2 * s, -0.8 * s); ctx.restore();
      }
      cx += cw;
    }
    ctx.restore();
    return { w, h: size };
  }

  // Chalk stick held at the drawing point.
  function stick(ctx, at, col, s) {
    if (!at) return;
    ctx.save(); ctx.translate(at[0], at[1]); ctx.rotate(-0.55); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(4, 6, 92, 16);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(86, -9); ctx.lineTo(88, 9); ctx.lineTo(0, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.45)'; ctx.fillRect(6, -5, 78, 3);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(6, 3, 78, 4);
    ctx.restore();
  }

  function board(W, H) {
    return K.cached(`cb-board:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(31);
      x.drawImage(K.paperTex(W, H, '#2f4a3b', 33, 0.06, false), 0, 0);
      const g = x.createRadialGradient(W * 0.45, H * 0.4, 0, W * 0.5, H * 0.5, Math.hypot(W, H) * 0.6);
      g.addColorStop(0, 'rgba(70,100,80,0.25)'); g.addColorStop(1, 'rgba(10,20,15,0.35)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      // eraser swirls from past lessons: wide translucent arcs, a few denser clouds
      x.lineCap = 'round';
      for (let i = 0; i < 34; i++) {
        const cx = r.range(-0.1, 1.1) * W, cy = r.range(0, 1) * H, len = r.range(160, 420) * s;
        const pts = K.wobble(K.arcPts([cx, cy], [cx + len, cy + r.range(-80, 80) * s], r.range(-0.5, 0.5), 30), 8 * s, i);
        x.strokeStyle = `rgba(225,235,225,${r.range(0.018, 0.045)})`; x.lineWidth = r.range(40, 110) * s; K.poly(x, pts); x.stroke();
      }
      for (let i = 0; i < 9; i++) {
        const cx = r.range(0, W), cy = r.range(0, H), rr = r.range(60, 180) * s;
        const gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); gg.addColorStop(0, 'rgba(230,240,230,0.07)'); gg.addColorStop(1, 'rgba(230,240,230,0)');
        x.fillStyle = gg; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
      }
      // ghost of old chalk writing
      x.font = K.font(46 * s, HAND, 400); x.fillStyle = 'rgba(230,235,225,0.05)';
      [['x = 2', 0.07, 0.8], ['Lesson 3', 0.62, 0.2], ['reach?', 0.7, 0.86], ['a + b', 0.3, 0.55], ['homework', 0.18, 0.3], ['p. 41', 0.85, 0.5], ['draft', 0.45, 0.92]]
        .forEach(([w, fx, fy]) => { x.save(); x.translate(fx * W, fy * H); x.rotate(r.range(-0.06, 0.06)); x.fillText(w, 0, 0); x.restore(); });
      return c;
    });
  }

  function frame(W, H) {
    return K.cached(`cb-frame:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), { side, tray } = FR(W, H), r = K.rng(5);
      const wood = (x0, y0, w, h, horiz) => {
        const g = horiz ? x.createLinearGradient(0, y0, 0, y0 + h) : x.createLinearGradient(x0, 0, x0 + w, 0);
        g.addColorStop(0, '#8a5a32'); g.addColorStop(0.45, '#6e4424'); g.addColorStop(1, '#4a2c16');
        x.fillStyle = g; x.fillRect(x0, y0, w, h);
        x.save(); x.beginPath(); x.rect(x0, y0, w, h); x.clip();
        for (let i = 0; i < 40; i++) {
          x.strokeStyle = `rgba(${r() < 0.5 ? '40,22,10' : '160,110,70'},${r.range(0.12, 0.3)})`; x.lineWidth = r.range(0.6, 2) * s;
          x.beginPath();
          if (horiz) { const yy = y0 + r() * h; x.moveTo(x0, yy); for (let k = 0; k <= 20; k++) x.lineTo(x0 + (w * k) / 20, yy + Math.sin(k * 0.7 + i) * 1.5 * s); }
          else { const xx = x0 + r() * w; x.moveTo(xx, y0); for (let k = 0; k <= 20; k++) x.lineTo(xx + Math.sin(k * 0.7 + i) * 1.5 * s, y0 + (h * k) / 20); }
          x.stroke();
        }
        // worn edges
        x.fillStyle = 'rgba(255,220,180,0.08)'; horiz ? x.fillRect(x0, y0, w, 2 * s) : x.fillRect(x0, y0, 2 * s, h);
        x.restore();
      };
      wood(0, 0, W, side, true); wood(0, 0, side, H, false); wood(W - side, 0, side, H, false);
      wood(0, H - tray, W, tray, true);
      // inner bevel shadow on the slate
      x.strokeStyle = 'rgba(0,0,0,0.45)'; x.lineWidth = 6 * s; x.strokeRect(side + 3 * s, side + 3 * s, W - 2 * side - 6 * s, H - side - tray - 6 * s);
      // tray lip, dust and sticks
      x.fillStyle = '#3d2412'; x.fillRect(side, H - tray, W - 2 * side, 8 * s);
      x.fillStyle = 'rgba(235,235,225,0.28)';
      for (let i = 0; i < 260; i++) x.fillRect(r.range(side, W - side), H - tray + r.range(8, 22) * s, r.range(1, 3) * s, r.range(1, 2) * s);
      const sticks = [CH.white, CH.yellow, CH.pink, CH.blue, CH.white];
      sticks.forEach((col, i) => {
        const sx = W * (0.1 + i * 0.07) + r.range(-8, 8) * s, sy = H - tray + 18 * s, len = r.range(44, 78) * s;
        x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(sx + 3 * s, sy + 4 * s, len, 11 * s);
        x.fillStyle = col; x.fillRect(sx, sy, len, 11 * s); x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(sx, sy + 1 * s, len, 3 * s);
      });
      // felt eraser on the tray
      const ex = W * 0.72, ey = H - tray + 10 * s;
      x.fillStyle = '#c9b48d'; x.fillRect(ex, ey, 130 * s, 24 * s); x.fillStyle = '#2b2b2f'; x.fillRect(ex, ey - 8 * s, 130 * s, 12 * s);
      x.fillStyle = 'rgba(240,240,230,0.35)'; x.fillRect(ex, ey + 18 * s, 130 * s, 6 * s);
      return c;
    });
  }

  const style = {
    id: 'chalkboard', name: 'Chalkboard Lesson', family: 'Hand-Drawn',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Cabin+Sketch:wght@400;700&family=Patrick+Hand&display=block', specs: ['700 60px "Cabin Sketch"', '400 40px "Patrick Hand"'] }],
    palette: { bg: '#2f4a3b', ink: CH.white, accent: CH.pink, yellow: CH.yellow, blue: CH.blue, green: CH.green, wood: '#6e4424' },
    sfx: { draw: 'chalk', land: 'tick', emphasis: 'thud', transition: 'paper', bed: 'room' },

    setup(W, H) { board(W, H); frame(W, H); Object.values(CH).forEach(grain); },

    background(ctx, W, H, t) { ctx.drawImage(board(W, H), 0, 0); },

    finish(ctx, W, H, t) {
      // floating chalk dust in the air (slow, deterministic drift), frame on top, vignette, grain
      const s = S(W, H), r = K.rng(808);
      ctx.save(); ctx.fillStyle = 'rgba(235,240,230,0.22)';
      for (let i = 0; i < 70; i++) {
        const x0 = r() * W, y0 = r() * H, sp = r.range(4, 14) * s, y = (y0 + t * sp) % H, x = x0 + Math.sin(t * 0.6 + i) * 6 * s;
        ctx.fillRect(x, y, 1.6 * s, 1.6 * s);
      }
      ctx.restore();
      ctx.drawImage(frame(W, H), 0, 0);
      K.vignette(ctx, W, H, 0.38, '#050a07');
      K.grain(ctx, W, H, t, 0.05, 24, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) { return chalkText(ctx, text, x, y, p, { size: 60, family: HEAD, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return chalkText(ctx, text, x, y, p, { size: 38, family: HAND, weight: 400, ...o }); },

    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || CH.white;
      const pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.15, 40), 2.4 * s, o.seed || 3);
      const end = chalk(ctx, pts, K.clamp(p / 0.82), { color: col, width: 7 * s, seed: o.seed });
      if (p > 0.82) {
        const hp = K.clamp((p - 0.82) / 0.18), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 22 * s;
        for (const sg of [-1, 1]) chalk(ctx, [b, [b[0] - Math.cos(ang + sg * 0.5) * L, b[1] - Math.sin(ang + sg * 0.5) * L]], hp, { color: col, width: 7 * s, seed: (o.seed || 3) + sg });
      }
      return end;
    },

    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || CH.white;
      // chalk boxes overshoot their corners: four separate strokes that run past each other
      const ov = 12 * s, sd = o.seed || 5;
      const sides = [[[x - ov, y], [x + w + ov * 0.6, y]], [[x + w, y - ov * 0.7], [x + w, y + h + ov]], [[x + w + ov * 0.5, y + h], [x - ov * 0.8, y + h]], [[x, y + h + ov * 0.6], [x, y - ov]]];
      let at = null;
      sides.forEach((sg, i) => {
        const sp = K.clamp(p * 4 - i);
        const pts = K.wobble(K.bezier(sg[0], mid(sg[0], sg[1], 0.33), mid(sg[0], sg[1], 0.66), sg[1], 24), 1.8 * s, sd + i);
        const e = chalk(ctx, pts, sp, { color: col, width: 6.5 * s, seed: sd + i }); if (sp > 0 && sp < 1) at = e;
      });
      // soft side-of-the-chalk shading inside the box once drawn
      if (p > 0.9 && o.fill !== false) { ctx.save(); ctx.globalAlpha = 0.16 * K.clamp((p - 0.9) / 0.1); ctx.fillStyle = pat(ctx, col); ctx.fillRect(x + 8 * s, y + 8 * s, w - 16 * s, h - 16 * s); ctx.restore(); }
      return at;
    },

    counter(ctx, value, x, y, p, o = {}) {
      // re-chalked as it counts: the letter jitter seed follows the value
      return chalkText(ctx, K.fmt(value), x, y, 1, { size: o.size || 120, family: HAND, weight: 400, color: o.color || CH.yellow, align: o.align || 'center', seed: 11 + Math.floor(value / 50000) });
    },

    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      const pts = K.wobble(K.circlePts(x, y, r * 1.2, r * 0.62, 80, -2.6, Math.PI * 2.3), 3.5 * s, o.seed || 13);
      chalk(ctx, pts, p, { color: o.color || CH.pink, width: 7 * s, seed: o.seed || 13 });
    },

    // Eraser pass: zig-zag swipes rub the slate clean (0..0.5), then the chalk cloud they leave settles (0.5..1).
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), bd = board(W, H), r = K.rng(o.seed || 41);
      const k = K.clamp(p / 0.5), rows = 7, bw = 120 * s;
      ctx.save();
      if (p < 0.5) {
        ctx.strokeStyle = ctx.createPattern(bd, 'no-repeat'); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = bw;
        const pts = []; for (let i = 0; i <= rows; i++) { const y = (i / rows) * H; pts.push([i % 2 ? W + bw : -bw, y]); }
        const q = K.trim(K.wobble(pts, 6 * s, 3), k); K.poly(ctx, q); ctx.stroke();
        ctx.lineWidth = bw * 1.3; ctx.strokeStyle = 'rgba(230,235,225,0.12)'; K.poly(ctx, q); ctx.stroke();
        const tip = q[q.length - 1];
        ctx.translate(tip[0], tip[1]); ctx.rotate(0.15);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-70 * s, -30 * s, 150 * s, 66 * s);
        ctx.fillStyle = '#c9b48d'; ctx.fillRect(-75 * s, -10 * s, 150 * s, 40 * s); ctx.fillStyle = '#2b2b2f'; ctx.fillRect(-75 * s, -36 * s, 150 * s, 28 * s);
      } else {
        const a = 1 - (p - 0.5) / 0.5;
        for (let i = 0; i < 14; i++) {
          const cx = r() * W, cy = r() * H, rr = r.range(120, 300) * s;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, `rgba(225,232,222,${0.22 * a})`); g.addColorStop(1, 'rgba(225,232,222,0)');
          ctx.fillStyle = g; ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
        }
      }
      ctx.restore();
    },
    stick,
  };

  // ---------- demo: a teacher's board lesson ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [CH.pink, CH.white, CH.yellow, CH.white, CH.blue, CH.white, CH.blue];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [96 * s, 290 * s, 260 * s, 160 * s], node: [470 * s, 300 * s, 300 * s, 130 * s],
      chips: PLATFORMS.map((n, i) => [1000 * s, (162 + i * 70) * s]), title: [W / 2, 112 * s], counter: [W / 2, 410 * s] };
    return { s, video: [W * 0.25, H * 0.2, W * 0.5, H * 0.12], node: [W * 0.18, H * 0.41, W * 0.64, H * 0.08],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.6 + Math.floor(i / 2) * 0.078)]), title: [W / 2, H * 0.09], counter: [W / 2, H * 0.5] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W;
      style.background(ctx, W, H, t);
      let tip = null, tipCol = CH.white;
      const track = (pt, p, col) => { if (p > 0 && p < 1 && pt) { tip = pt; tipCol = col; } };
      if (t < 8.25) {
        const tp = K.beat(t, 0.15, 1.4, 'lin');
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'];
        tt.forEach((line, i) => style.title(ctx, line, Lo.title[0], Lo.title[1] + i * 64 * s, K.clamp(tp * tt.length - i), { size: portrait ? 50 : 62, align: 'center' }));
        // underline the hook
        const ul = portrait ? [[W * 0.2, Lo.title[1] + 90 * s], [W * 0.8, Lo.title[1] + 86 * s]] : [[W * 0.2, Lo.title[1] + 22 * s], [W * 0.8, Lo.title[1] + 18 * s]];
        const up = K.beat(t, 1.45, 0.4, 'lin'); track(chalk(ctx, K.wobble(K.bezier(ul[0], mid(ul[0], ul[1], 0.3), mid(ul[0], ul[1], 0.7), ul[1], 20), 2 * s, 9), up, { color: CH.yellow, width: 5 * s, seed: 9 }), up, CH.yellow);
        const [vx, vy, vw, vh] = Lo.video, bp = K.beat(t, 2.0, 0.9, 'lin');
        track(style.box(ctx, vx, vy, vw, vh, bp, { seed: 21 }), bp, CH.white);
        if (t > 2.7) { const tri = [[vx + vw * 0.42, vy + vh * 0.28], [vx + vw * 0.42, vy + vh * 0.72], [vx + vw * 0.63, vy + vh * 0.5], [vx + vw * 0.42, vy + vh * 0.28]]; const pp = K.beat(t, 2.7, 0.35, 'lin'); track(chalk(ctx, K.wobble(tri, 1.5 * s, 22), pp, { color: CH.pink, width: 6 * s, seed: 22 }), pp, CH.pink); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 44 * s, K.beat(t, 3.05, 0.45, 'lin'), { align: 'center', color: CH.yellow });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 66 * s], [nx + nw / 2, ny - 16 * s]] : [[vx + vw + 16 * s, vy + vh / 2], [nx - 18 * s, ny + nh / 2]];
        const ap = K.beat(t, 3.45, 0.7, 'lin'); track(style.arrow(ctx, a1[0], a1[1], ap, { seed: 31, bend: portrait ? 0.08 : -0.12 }), ap, CH.white);
        const np = K.beat(t, 4.1, 0.8, 'lin');
        track(style.box(ctx, nx, ny, nw, nh, np, { color: CH.green, seed: 41 }), np, CH.green);
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 20 * s, K.beat(t, 4.55, 0.45, 'lin'), { size: 54, align: 'center', color: CH.green });
        if (portrait) { const yl = Lo.chips[6][1] - 12 * s, p2 = K.beat(t, 4.95, 0.5, 'lin'); track(chalk(ctx, K.wobble([[W / 2, ny + nh + 14 * s], [W / 2, yl]], 1.5 * s, 49), p2, { width: 6 * s, seed: 49 }), p2, CH.white); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = portrait ? [W / 2, cy - 12 * s] : [nx + nw + 16 * s, ny + nh / 2];
          const to = portrait ? [left ? W * 0.45 : W * 0.55, cy - 12 * s] : [cx - 20 * s, cy - 11 * s];
          const p = K.beat(t, t0, 0.34, 'lin'); track(style.arrow(ctx, from, to, p, { seed: 50 + i, bend: portrait ? 0 : (i - 3) * 0.035, color: COLS[i] }), p, COLS[i]);
          style.label(ctx, name, portrait ? (left ? W * 0.43 : W * 0.57) : cx, cy, K.beat(t, t0 + 0.28, 0.3, 'lin'), { size: portrait ? 40 : 40, color: COLS[i], align: portrait ? (left ? 'right' : 'left') : 'left', seed: 60 + i });
        });
        if (t > 7.55) style.transition(ctx, W, H, K.clamp((t - 7.55) / 1.4), {});
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.26 : 128 * s;
        style.box(ctx, W / 2 - nw / 2, top - nh / 2, nw, nh, 1, { color: CH.green, seed: 41 });
        style.title(ctx, 'Creator OS', W / 2, top + 20 * s, 1, { size: 54, align: 'center', color: CH.green });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 104 : 132 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 62 * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', size: 44 });
        const ep = K.beat(t, 10.0, 0.55, 'lin');
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 36 * s, (portrait ? 230 : 250) * s, ep, {});
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 1.0, 'lin');
        tk.forEach((line, i) => style.title(ctx, line, W / 2, (portrait ? H * 0.76 : 628 * s) + i * 70 * s, K.clamp(tp * tk.length - i), { size: portrait ? 54 : 56, align: 'center', color: CH.white }));
        if (t < 8.95) style.transition(ctx, W, H, K.clamp((t - 7.55) / 1.4), {});
      }
      if (tip) stick(ctx, tip, tipCol, s);
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      k.play('scribble', 0.15, { medium: 'chalk', dur: 1.4 }); k.play('scribble', 1.45, { medium: 'chalk', dur: 0.4 });
      k.play('scribble', 2.0, { medium: 'chalk', dur: 0.9 }); k.play('scribble', 2.7, { medium: 'chalk', dur: 0.35 });
      k.play('scribble', 3.05, { medium: 'chalk', dur: 0.45, gain: 0.7 });
      k.play('scribble', 3.45, { medium: 'chalk', dur: 0.7 }); k.play('tick', 4.15);
      k.play('scribble', 4.1, { medium: 'chalk', dur: 0.8 }); k.play('scribble', 4.55, { medium: 'chalk', dur: 0.45 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'chalk', dur: 0.32, gain: 0.8 }); k.play('tick', 5.3 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('paper', 7.6, { dur: 0.25 }); k.play('paper', 7.85, { dur: 0.25 }); k.play('paper', 8.1, { dur: 0.25 }); k.play('whoosh', 8.3, { dur: 0.6, gain: 0.5 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('thud', 10.0); k.play('scribble', 10.0, { medium: 'chalk', dur: 0.55 });
      k.play('scribble', 10.5, { medium: 'chalk', dur: 1.0 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
