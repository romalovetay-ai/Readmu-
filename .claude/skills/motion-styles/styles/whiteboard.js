// Whiteboard Explainer (Hand-Drawn). Dry-erase marker on a glossy board: streaky chisel strokes with pooled ends,
// double-traced boxes and arrows, ghost residue of an erased lesson, a ceiling-light sheen, a felt-eraser wipe.
(function () {
  const INK = { black: '#1f2833', blue: '#1f5fbf', red: '#d23a2f', green: '#1d8a4a' };
  const FONT = 'Kalam';

  // One marker stroke: a few offset passes with varying alpha give the chisel streaks; ends pool darker.
  function marker(ctx, pts, p, o = {}) {
    const col = o.color || INK.black, w = (o.width || 7), seed = o.seed || 1;
    const q = K.trim(pts, p); if (q.length < 2) return null;
    const r = K.rng(seed);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (let pass = 0; pass < 3; pass++) {
      const off = (pass - 1) * w * 0.22;
      ctx.strokeStyle = K.rgba(col, 0.55 + r() * 0.3); ctx.lineWidth = w * (0.72 + r() * 0.2);
      ctx.beginPath(); q.forEach((pt, i) => (i ? ctx.lineTo(pt[0] + off, pt[1] + off * 0.6) : ctx.moveTo(pt[0] + off, pt[1] + off * 0.6))); ctx.stroke();
    }
    // streak gaps: thin board-coloured lines along the stroke
    ctx.strokeStyle = 'rgba(246,247,244,0.35)'; ctx.lineWidth = w * 0.12;
    ctx.beginPath(); q.forEach((pt, i) => (i ? ctx.lineTo(pt[0] + w * 0.18, pt[1] - w * 0.1) : ctx.moveTo(pt[0] + w * 0.18, pt[1] - w * 0.1))); ctx.stroke();
    // pooled ink at the start and (once finished) the end
    ctx.fillStyle = K.rgba(col, 0.85);
    const dot = (pt) => { ctx.beginPath(); ctx.arc(pt[0], pt[1], w * 0.55, 0, Math.PI * 2); ctx.fill(); };
    dot(q[0]); if (p >= 1) dot(q[q.length - 1]);
    ctx.restore();
    return q[q.length - 1];
  }
  // The marker in hand at the drawing point (only while a stroke is still drawing).
  function pen(ctx, at, col, s) {
    if (!at) return;
    ctx.save(); ctx.translate(at[0], at[1]); ctx.rotate(-0.7); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(6, 4, 150, 26);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, -9); ctx.lineTo(18, 9); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e9ecef'; ctx.fillRect(18, -13, 110, 26); ctx.fillStyle = col; ctx.fillRect(100, -14, 44, 28);
    ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.fillRect(22, -10, 100, 5);
    ctx.restore();
  }
  const S = (W, H) => K.layout(W, H).s;

  const style = {
    id: 'whiteboard', name: 'Whiteboard Explainer', family: 'Hand-Drawn',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Kalam:wght@400;700&display=block', specs: ['700 48px "Kalam"', '400 32px "Kalam"'] }],
    palette: { bg: '#f6f7f4', ...INK },
    sfx: { draw: 'marker', land: 'pop', emphasis: 'stamp', transition: 'whoosh', bed: 'room' },

    background(ctx, W, H, t) {
      const g = ctx.createLinearGradient(0, 0, W, H);
      g.addColorStop(0, '#fbfcfa'); g.addColorStop(0.55, '#f2f4f1'); g.addColorStop(1, '#e9ece8');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      // ghost of the last erased lesson (cached)
      const ghost = K.cached(`wb-ghost:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(404), s = S(W, H);
        x.strokeStyle = 'rgba(80,95,110,0.07)'; x.lineCap = 'round';
        for (let i = 0; i < 26; i++) {
          const cx = r.range(0, W), cy = r.range(0, H), pts = K.wobble(K.arcPts([cx, cy], [cx + r.range(-260, 260) * s, cy + r.range(-120, 120) * s], r.range(-0.4, 0.4)), 3 * s, i);
          x.lineWidth = r.range(4, 14) * s; K.poly(x, pts); x.stroke();
        }
        x.font = K.font(54 * s, FONT, 700); x.fillStyle = 'rgba(80,95,110,0.05)';
        for (let i = 0; i < 6; i++) x.fillText(r.pick(['f(x)', 'step 2', 'input', '= ?', 'loop', 'data']), r.range(0, W), r.range(0, H));
        return c;
      });
      ctx.drawImage(ghost, 0, 0);
    },

    finish(ctx, W, H, t) {
      // ceiling-light sheen drifting slightly, a faint edge darkening, light grain
      const sx = W * (0.62 + 0.03 * Math.sin(t * 0.4));
      const g = ctx.createLinearGradient(sx - W * 0.25, 0, sx + W * 0.25, H);
      g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.28)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.12, '#2a3340');
      K.grain(ctx, W, H, t, 0.035, 24, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 64) * s;
      ctx.save(); ctx.font = K.font(size, FONT, 700);
      const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      // letters written one by one, each a touch rotated like handwriting
      const n = Math.floor(text.length * K.clamp(p)), r = K.rng(o.seed || 7);
      let cx = x0;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i], cw = ctx.measureText(ch).width, rot = (r() - 0.5) * 0.06, dy = (r() - 0.5) * 3 * s;
        if (i < n) { ctx.save(); ctx.translate(cx, y + dy); ctx.rotate(rot); ctx.fillStyle = o.color || INK.black; ctx.globalAlpha = 0.92; ctx.fillText(ch, 0, 0); ctx.restore(); }
        cx += cw;
      }
      ctx.restore();
      return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 34, ...o }); },

    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      const pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.18, 40), 2.2 * s, o.seed || 3);
      const end = marker(ctx, pts, K.clamp(p / 0.85), { color: o.color || INK.black, width: 6 * s, seed: o.seed });
      if (p > 0.85) {
        const hp = K.clamp((p - 0.85) / 0.15), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 22 * s;
        for (const sgn of [-1, 1]) marker(ctx, [b, [b[0] - Math.cos(ang + sgn * 0.5) * L, b[1] - Math.sin(ang + sgn * 0.5) * L]], hp, { color: o.color || INK.black, width: 6 * s, seed: (o.seed || 3) + sgn });
      }
      return end;
    },

    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || INK.black;
      const pts = K.wobble(K.rectPts(x, y, w, h), 2.5 * s, o.seed || 5);
      marker(ctx, pts, K.clamp(p * 1.25), { color: col, width: 6 * s, seed: o.seed || 5 });
      // second, looser trace (double-traced look) once the first is done
      if (p > 0.6) marker(ctx, K.wobble(K.rectPts(x + 4 * s, y - 3 * s, w - 6 * s, h + 5 * s), 3.5 * s, (o.seed || 5) + 9), K.clamp((p - 0.6) / 0.4), { color: col, width: 3.5 * s, seed: (o.seed || 5) + 9 });
    },

    counter(ctx, value, x, y, p, o = {}) {
      return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 110, color: o.color || INK.blue, align: o.align || 'center', seed: 11 });
    },

    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      const pts = K.wobble(K.circlePts(x, y, r * 1.25, r * 0.8, 70, -2.4, Math.PI * 2.25), 3 * s, o.seed || 13);
      marker(ctx, pts, p, { color: o.color || INK.red, width: 7 * s, seed: o.seed || 13 });
    },

    // felt eraser sweeping left to right; 0..0.5 wipes away, 0.5..1 reveals the clean next board
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), bw = 260 * s, x = K.lerp(-bw, W + bw, p);
      ctx.save();
      ctx.fillStyle = '#f4f6f3'; ctx.fillRect(0, 0, Math.max(0, x - bw * 0.3), H);
      // residue smears just behind the eraser
      ctx.globalAlpha = 0.25; ctx.fillStyle = '#c9ced4';
      for (let i = 0; i < 6; i++) ctx.fillRect(x - bw * 0.3 - i * 18 * s, (i * 97) % H, 14 * s, H * 0.5);
      ctx.globalAlpha = 1;
      ctx.translate(x, H / 2); ctx.rotate(0.05);
      ctx.fillStyle = '#3b3f46'; ctx.fillRect(-bw * 0.3, -110 * s, bw * 0.6, 220 * s);
      ctx.fillStyle = '#5a6069'; ctx.fillRect(-bw * 0.3, -110 * s, bw * 0.6, 40 * s);
      ctx.fillStyle = '#e5d6b0'; ctx.fillRect(-bw * 0.3, 80 * s, bw * 0.6, 30 * s);
      ctx.restore();
    },

    pen,
  };

  // ---------- the shared demo, drawn live on one board ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [INK.red, INK.black, INK.red, INK.black, INK.blue, INK.black, INK.blue];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [110 * s, 300 * s, 270 * s, 170 * s], node: [520 * s, 315 * s, 280 * s, 140 * s],
      chips: PLATFORMS.map((n, i) => [990 * s, (190 + i * 76) * s]), title: [W / 2, 120 * s], counter: [W / 2, 420 * s] };
    // portrait: everything placed by fractions of the frame so it fills a phone screen
    return { s, video: [W * 0.25, H * 0.2, W * 0.5, H * 0.13], node: [W * 0.2, H * 0.43, W * 0.6, H * 0.085],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.6 + Math.floor(i / 2) * 0.075)]), title: [W / 2, H * 0.11], counter: [W / 2, H * 0.5] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = H > W;
      style.background(ctx, W, H, t);
      let penAt = null, penCol = INK.black;
      const trackPen = (pt, p, col) => { if (p > 0 && p < 1 && pt) { penAt = pt; penCol = col; } };
      const scene2 = t >= 8.25;
      if (!scene2) {
        // hook
        const tp = K.beat(t, 0.15, 1.3, 'lin');
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], tp, { size: portrait ? 44 : 62, align: 'center' });
        // video card + play triangle
        const [vx, vy, vw, vh] = Lo.video, bp = K.beat(t, 2.0, 0.9, 'lin');
        style.box(ctx, vx, vy, vw, vh, bp, { seed: 21 });
        if (t > 2.6) { const tri = [[vx + vw * 0.42, vy + vh * 0.3], [vx + vw * 0.42, vy + vh * 0.7], [vx + vw * 0.62, vy + vh * 0.5], [vx + vw * 0.42, vy + vh * 0.3]]; marker(ctx, K.wobble(tri, 1.5 * s, 22), K.beat(t, 2.6, 0.4, 'lin'), { color: INK.red, width: 6 * s, seed: 22 }); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 46 * s, K.beat(t, 3.0, 0.5, 'lin'), { align: 'center', color: INK.blue });
        // arrow to the node
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 70 * s], [nx + nw / 2, ny - 14 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - 16 * s, ny + nh / 2]];
        const ap = K.beat(t, 3.4, 0.8, 'lin'); trackPen(style.arrow(ctx, a1[0], a1[1], ap, { seed: 31, bend: portrait ? 0.1 : -0.15 }), ap, INK.black);
        const np = K.beat(t, 4.1, 0.9, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, { color: INK.green, seed: 41 });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 18 * s, K.beat(t, 4.6, 0.5, 'lin'), { size: 52, align: 'center', color: INK.green });
        // fan out (landscape: arrows straight to each label; portrait: a centre trunk with short branches, no crossings)
        if (portrait) {
          const yLast = Lo.chips[PLATFORMS.length - 1][1] - 12 * s;
          const tp2 = K.beat(t, 4.95, 0.5, 'lin');
          trackPen(style.arrow(ctx, [W / 2, ny + nh + 12 * s], [W / 2, yLast + 4 * s], tp2, { seed: 49, bend: 0.02 }), tp2, INK.black);
        }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = portrait ? [W / 2, cy - 12 * s] : [nx + nw + 14 * s, ny + nh / 2];
          const to = portrait ? [left ? W * 0.455 : W * 0.545, cy - 12 * s] : [cx - 22 * s, cy - 10 * s];
          const p = K.beat(t, t0, 0.35, 'lin'); trackPen(style.arrow(ctx, from, to, p, { seed: 50 + i, bend: portrait ? 0 : (i - 3) * 0.04, color: COLS[i] }), p, COLS[i]);
          const lx = portrait ? (left ? W * 0.43 : W * 0.57) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.3, 0.3, 'lin'), { size: portrait ? 34 : 40, color: COLS[i], align: portrait ? (left ? 'right' : 'left') : 'left', seed: 60 + i });
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        // clean board: the node moved up, the counter rolls, then the takeaway
        const [nx, ny, nw, nh] = Lo.node, top = portrait ? H * 0.27 : 130 * s;
        style.box(ctx, W / 2 - nw / 2, top - nh / 2, nw, nh, 1, { color: INK.green, seed: 41 });
        style.title(ctx, 'Creator OS', W / 2, top + 18 * s, 1, { size: 52, align: 'center', color: INK.green });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 96 : 130 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 60 * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', color: INK.black });
        const ep = K.beat(t, 10.0, 0.55, 'lin');
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 30 * s, (portrait ? 220 : 245) * s, ep, {});
        trackPen(null, 0, INK.red);
        style.title(ctx, 'Post once. Reach everywhere.', W / 2, portrait ? H * 0.74 : 650 * s, K.beat(t, 10.5, 1.0, 'lin'), { size: portrait ? 42 : 58, align: 'center', color: INK.black });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      if (penAt) pen(ctx, penAt, penCol, s);
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      k.play('scribble', 0.15, { medium: 'marker', dur: 1.3 });
      k.play('scribble', 2.0, { medium: 'marker', dur: 0.9 }); k.play('scribble', 2.6, { medium: 'marker', dur: 0.4 });
      k.play('scribble', 3.0, { medium: 'marker', dur: 0.5, gain: 0.7 });
      k.play('scribble', 3.4, { medium: 'marker', dur: 0.8 }); k.play('pop', 4.2);
      k.play('scribble', 4.1, { medium: 'marker', dur: 0.9 }); k.play('scribble', 4.6, { medium: 'marker', dur: 0.5 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'marker', dur: 0.3, gain: 0.8 }); k.play('pop', 5.35 + i * 0.4, { pitch: 1 + i * 0.06, gain: 0.8 }); }
      k.play('whoosh', 7.6, { dur: 1.2 }); k.play('paper', 7.9, { dur: 0.6 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0); k.play('scribble', 10.0, { medium: 'marker', dur: 0.55 });
      k.play('scribble', 10.5, { medium: 'marker', dur: 1.0 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
