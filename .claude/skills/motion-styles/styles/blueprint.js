// Engineering Blueprint (Hand-Drawn). A cyanotype drafting sheet: white line-work that bleeds a little into mottled,
// sun-faded Prussian-blue paper, faint construction lines that run past every corner, dash-dot centre lines,
// 45 degree section hatching, dimension chains, a zoned border, title block and fold creases. A plotter gantry inks
// the lines; numbers sit in dimension callouts; the key result gets a revision cloud. Scene change = next sheet.
(function () {
  const BP = { paper: '#1f4f8c', line: '#eef5ff', faint: '#9fc0ea', accent: '#ffd36b', red: '#ff9a8a' };
  const MONO = 'Space Mono';
  const S = (W, H) => K.layout(W, H).s;

  // white line on cyanotype: a soft bleed pass under a crisp core
  function ink(ctx, pts, p, o = {}) {
    const q = K.trim(pts, p); if (q.length < 2) return null;
    const s = S(ctx.canvas.width, ctx.canvas.height), w = (o.width || 2.2) * s, col = o.color || BP.line;
    ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'miter';
    if (o.dash) ctx.setLineDash(o.dash.map((d) => d * s));
    ctx.globalAlpha = (o.alpha ?? 1) * 0.22; ctx.strokeStyle = col; ctx.lineWidth = w * 3; K.poly(ctx, q); ctx.stroke();
    ctx.globalAlpha = o.alpha ?? 1; ctx.lineWidth = w; K.poly(ctx, q); ctx.stroke();
    ctx.restore();
    return q[q.length - 1];
  }
  const seg = (a, b, n = 2) => K.bezier(a, [K.lerp(a[0], b[0], 0.33), K.lerp(a[1], b[1], 0.33)], [K.lerp(a[0], b[0], 0.66), K.lerp(a[1], b[1], 0.66)], b, n);
  function head(ctx, at, ang, s, col = BP.line, L = 16) {
    ctx.save(); ctx.fillStyle = col; ctx.translate(at[0], at[1]); ctx.rotate(ang);
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-L * s, -4.2 * s); ctx.lineTo(-L * s, 4.2 * s); ctx.closePath(); ctx.fill(); ctx.restore();
  }
  // stencil-style mono lettering, plotted character by character
  function letters(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = o.size * s, col = o.color || BP.line;
    const n = Math.ceil(text.length * K.clamp(p)); if (!n) return { w: 0 };
    ctx.save(); ctx.font = K.font(size, MONO, o.weight ?? 700); ctx.textAlign = o.align || 'left';
    if (o.spacing) ctx.letterSpacing = o.spacing * s + 'px';
    ctx.fillStyle = K.rgba(col, 0.25); ctx.shadowColor = K.rgba(col, 0.6); ctx.shadowBlur = 5 * s;
    const full = ctx.measureText(text).width;
    // keep alignment fixed while plotting: draw partial string from the full string's left edge
    const x0 = o.align === 'center' ? x - full / 2 : o.align === 'right' ? x - full : x;
    ctx.textAlign = 'left'; ctx.fillText(text.slice(0, n), x0, y);
    ctx.shadowBlur = 0; ctx.fillStyle = col; ctx.fillText(text.slice(0, n), x0, y);
    ctx.restore();
    return { w: full, x0 };
  }

  function paper(W, H) {
    return K.cached(`bp-paper:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(12), portrait = H > W;
      x.drawImage(K.paperTex(W, H, BP.paper, 21, 0.09, true), 0, 0);
      // sun fade toward one corner + darker damp blotches
      const g = x.createRadialGradient(W * 0.85, H * 0.1, 0, W * 0.85, H * 0.1, Math.hypot(W, H) * 0.7);
      g.addColorStop(0, 'rgba(120,170,220,0.22)'); g.addColorStop(1, 'rgba(10,30,70,0.25)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
      for (let i = 0; i < 10; i++) { const cx = r() * W, cy = r() * H, rr = r.range(80, 260) * s, gg = x.createRadialGradient(cx, cy, 0, cx, cy, rr); gg.addColorStop(0, `rgba(8,25,60,${r.range(0.06, 0.14)})`); gg.addColorStop(1, 'rgba(8,25,60,0)'); x.fillStyle = gg; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      // drafting grid
      const m = 30 * s, step = 24 * s;
      x.strokeStyle = 'rgba(190,215,250,0.07)'; x.lineWidth = 1;
      for (let gx = m, i = 0; gx < W - m; gx += step, i++) { x.globalAlpha = i % 5 ? 1 : 2.2; x.beginPath(); x.moveTo(gx, m); x.lineTo(gx, H - m); x.stroke(); }
      for (let gy = m, i = 0; gy < H - m; gy += step, i++) { x.globalAlpha = i % 5 ? 1 : 2.2; x.beginPath(); x.moveTo(m, gy); x.lineTo(W - m, gy); x.stroke(); }
      x.globalAlpha = 1;
      // zoned border: double frame, zone ticks and letters
      x.strokeStyle = 'rgba(235,245,255,0.75)'; x.lineWidth = 2.4 * s; x.strokeRect(m * 0.5, m * 0.5, W - m, H - m);
      x.lineWidth = 1.2 * s; x.strokeRect(m, m, W - 2 * m, H - 2 * m);
      x.font = K.font(13 * s, MONO, 700); x.fillStyle = 'rgba(235,245,255,0.7)'; x.textAlign = 'center'; x.textBaseline = 'middle';
      const nx = portrait ? 4 : 8, ny = portrait ? 8 : 4;
      for (let i = 0; i < nx; i++) { const zx = m + ((W - 2 * m) * (i + 0.5)) / nx; x.fillText(String(nx - i), zx, m * 0.75); x.fillText(String(nx - i), zx, H - m * 0.75); if (i) { x.beginPath(); x.moveTo(m + ((W - 2 * m) * i) / nx, m * 0.5); x.lineTo(m + ((W - 2 * m) * i) / nx, m); x.moveTo(m + ((W - 2 * m) * i) / nx, H - m); x.lineTo(m + ((W - 2 * m) * i) / nx, H - m * 0.5); x.stroke(); } }
      for (let i = 0; i < ny; i++) { const zy = m + ((H - 2 * m) * (i + 0.5)) / ny, L = 'ABCDEFGH'[i]; x.fillText(L, m * 0.75, zy); x.fillText(L, W - m * 0.75, zy); }
      // fold creases: a bright ridge beside a dark valley, a little wavy
      const crease = (a, b) => { for (const [off, col] of [[0, 'rgba(210,230,255,0.16)'], [2.5 * s, 'rgba(0,10,30,0.28)']]) { x.strokeStyle = col; x.lineWidth = 2 * s; x.beginPath(); K.wobble(seg(a, b, 30), 1.2 * s, 4).forEach((pt, i) => (i ? x.lineTo(pt[0] + off, pt[1] + off) : x.moveTo(pt[0] + off, pt[1] + off))); x.stroke(); } };
      crease([W / 2, 0], [W / 2, H]); crease([0, H / 2], [W, H / 2]); if (portrait) { crease([0, H / 4], [W, H / 4]); crease([0, (3 * H) / 4], [W, (3 * H) / 4]); }
      // title block
      const tb = portrait ? [W * 0.08, H * 0.915, W * 0.84, H * 0.06] : [W - 300 * s, H - 104 * s, 300 * s - m, 104 * s - m];
      x.fillStyle = 'rgba(15,45,90,0.55)'; x.fillRect(tb[0], tb[1], tb[2], tb[3]);
      x.strokeStyle = 'rgba(235,245,255,0.8)'; x.lineWidth = 1.6 * s; x.strokeRect(tb[0], tb[1], tb[2], tb[3]);
      x.beginPath(); x.moveTo(tb[0], tb[1] + tb[3] * 0.55); x.lineTo(tb[0] + tb[2], tb[1] + tb[3] * 0.55); x.moveTo(tb[0] + tb[2] * 0.5, tb[1] + tb[3] * 0.55); x.lineTo(tb[0] + tb[2] * 0.5, tb[1] + tb[3]); x.stroke();
      x.textAlign = 'left'; x.textBaseline = 'alphabetic'; x.fillStyle = 'rgba(240,248,255,0.9)';
      x.font = K.font(20 * s, MONO, 700); x.fillText('CREATOR OS  MK-I', tb[0] + 12 * s, tb[1] + tb[3] * 0.42);
      x.font = K.font(12 * s, MONO, 400); x.fillText('DWG COS-001', tb[0] + 12 * s, tb[1] + tb[3] * 0.85); x.fillText('SHEET 1/2 REV A', tb[0] + tb[2] * 0.5 + 12 * s, tb[1] + tb[3] * 0.85);
      return c;
    });
  }

  const style = {
    id: 'blueprint', name: 'Engineering Blueprint', family: 'Hand-Drawn',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&display=block', specs: ['700 48px "Space Mono"', '400 30px "Space Mono"'] }],
    palette: { bg: BP.paper, ink: BP.line, faint: BP.faint, accent: BP.accent, red: BP.red },
    sfx: { draw: 'pen', land: 'click', emphasis: 'stamp', transition: 'paper', bed: 'hum' },
    setup(W, H) { paper(W, H); },

    background(ctx, W, H, t) { ctx.drawImage(paper(W, H), 0, 0); },

    finish(ctx, W, H, t) {
      // uneven exposure light falloff, blue-tinted grain, slight bloom of the whites
      K.vignette(ctx, W, H, 0.42, '#04122c');
      K.grain(ctx, W, H, t, 0.05, 24, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), r = letters(ctx, text.toUpperCase(), x, y, p, { size: 50, spacing: 2, ...o });
      // double rule under the title, plotted after the letters
      if (o.rule !== false && r.w) { const k = K.clamp((p - 0.6) / 0.4), x0 = r.x0, y0 = y + 14 * s; ink(ctx, seg([x0, y0], [x0 + r.w, y0]), k, { width: 2.2 }); ink(ctx, seg([x0, y0 + 7 * s], [x0 + r.w, y0 + 7 * s]), k, { width: 1 }); }
      return r;
    },
    label(ctx, text, x, y, p, o = {}) { return letters(ctx, text.toUpperCase(), x, y, p, { size: 32, ...o }); },

    // drafted leader: origin dot, thin line, slim filled arrowhead
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || BP.line;
      const pts = o.elbow ? [from, [o.elbow[0], o.elbow[1]], to] : [from, to];
      const path = pts.length === 3 ? seg(pts[0], pts[1], 12).concat(seg(pts[1], pts[2], 12).slice(1)) : seg(from, to, 24);
      if (p > 0) { ctx.save(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(from[0], from[1], 3.4 * s, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
      const e = ink(ctx, path, K.clamp(p / 0.9), { width: 1.8, color: col });
      if (p >= 0.9) { const a = path[path.length - 2], b = path[path.length - 1]; head(ctx, b, Math.atan2(b[1] - a[1], b[0] - a[0]), s, col, 18); }
      return e;
    },

    // object outline + construction lines past the corners, centre lines, a hatched section and a dimension chain
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), ext = 34 * s;
      const cp = K.clamp(p / 0.3), op = K.clamp((p - 0.25) / 0.45), dp = K.clamp((p - 0.65) / 0.35);
      for (const [a, b] of [[[x - ext, y], [x + w + ext, y]], [[x - ext, y + h], [x + w + ext, y + h]], [[x, y - ext], [x, y + h + ext]], [[x + w, y - ext], [x + w, y + h + ext]]]) ink(ctx, seg(a, b), cp, { width: 1, alpha: 0.35 });
      const e = ink(ctx, K.rectPts(x, y, w, h), op, { width: 3 });
      if (dp > 0) {
        ink(ctx, seg([x + w / 2, y - 14 * s], [x + w / 2, y + h + 14 * s]), dp, { width: 1, dash: [18, 5, 3, 5], alpha: 0.7 });
        if (o.hatch !== false) {
          const hy = y + h * 0.74; ctx.save(); ctx.beginPath(); ctx.rect(x, hy, w, y + h - hy); ctx.clip();
          ctx.strokeStyle = K.rgba(BP.line, 0.55 * dp); ctx.lineWidth = 1.1 * s; ctx.beginPath();
          for (let k = -h; k < w + h; k += 11 * s) { ctx.moveTo(x + k, y + h); ctx.lineTo(x + k + (y + h - hy), hy); }
          ctx.stroke(); ctx.restore(); ink(ctx, seg([x, hy], [x + w, hy]), dp, { width: 1.4 });
        }
        if (o.dim !== false) {
          const dy = y - 26 * s; ink(ctx, seg([x, dy], [x + w, dy]), dp, { width: 1.1 });
          if (dp > 0.8) { head(ctx, [x, dy], Math.PI, s, BP.line, 12); head(ctx, [x + w, dy], 0, s, BP.line, 12);
            ctx.save(); ctx.font = K.font(18 * s, MONO, 400); ctx.fillStyle = BP.line; ctx.textAlign = 'center'; ctx.fillStyle = BP.paper; const lab = String(o.dimText || Math.round(w / s));
            const tw = ctx.measureText(lab).width + 10 * s; ctx.fillRect(x + w / 2 - tw / 2, dy - 10 * s, tw, 20 * s); ctx.fillStyle = BP.line; ctx.fillText(lab, x + w / 2, dy + 6 * s); ctx.restore(); }
        }
      }
      return e;
    },

    // number in mono lettering inside a dimension-style callout box
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 112) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, MONO, 700); const w = ctx.measureText('0,000,000').width; ctx.restore();
      const pad = 24 * s, bx = x - w / 2 - pad, by = y - size * 0.82, bw = w + pad * 2, bh = size * 1.02;
      ink(ctx, K.rectPts(bx, by, bw, bh), p, { width: 2 });
      ink(ctx, K.rectPts(bx + 6 * s, by + 6 * s, bw - 12 * s, bh - 12 * s), p, { width: 1, alpha: 0.5 });
      for (const sx of [bx, bx + bw]) ink(ctx, seg([sx, by - 22 * s], [sx, by + bh + 22 * s]), p, { width: 1, alpha: 0.4 });
      letters(ctx, txt, x + w / 2, y, 1, { size: o.size || 112, align: 'right', color: o.color || BP.line });
      return { bx, by, bw, bh };
    },

    // revision cloud: scalloped arcs around an ellipse + a revision triangle
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || BP.accent, n = 22, rx = r * 1.25, ry = r * 0.62;
      const shown = Math.floor(n * K.clamp(p) + 0.001), part = n * K.clamp(p) - shown;
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 2.6 * s; ctx.shadowColor = K.rgba(col, 0.6); ctx.shadowBlur = 6 * s;
      for (let i = 0; i <= shown && i < n; i++) {
        const a0 = (i / n) * Math.PI * 2 - Math.PI / 2, a1 = ((i + 1) / n) * Math.PI * 2 - Math.PI / 2;
        const p0 = [x + Math.cos(a0) * rx, y + Math.sin(a0) * ry], p1 = [x + Math.cos(a1) * rx, y + Math.sin(a1) * ry];
        const cx = (p0[0] + p1[0]) / 2, cy = (p0[1] + p1[1]) / 2, rad = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) / 2, base = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]);
        const frac = i < shown ? 1 : part; if (frac <= 0) continue;
        ctx.beginPath(); ctx.arc(cx, cy, rad, base + Math.PI, base + Math.PI + Math.PI * frac); ctx.stroke();
      }
      if (p > 0.85) { const tx = x + rx * 0.82, ty = y - ry * 0.95, z = 22 * s; ctx.beginPath(); ctx.moveTo(tx, ty - z); ctx.lineTo(tx + z, ty + z * 0.7); ctx.lineTo(tx - z, ty + z * 0.7); ctx.closePath(); ctx.stroke();
        ctx.shadowBlur = 0; ctx.fillStyle = col; ctx.font = K.font(20 * s, MONO, 700); ctx.textAlign = 'center'; ctx.fillText('1', tx, ty + z * 0.5); }
      ctx.restore();
    },

    // next sheet: a fresh print slides over from the right (covered at 0.5) casting a shadow on the old one
    transition(ctx, W, H, p, o = {}) {
      if (p >= 0.5) return;
      const s = S(W, H), k = K.ease.inOut(K.clamp(p / 0.5)), x = K.lerp(W + 30 * s, 0, k);
      ctx.save();
      const g = ctx.createLinearGradient(x - 50 * s, 0, x, 0); g.addColorStop(0, 'rgba(0,10,30,0)'); g.addColorStop(1, 'rgba(0,10,30,0.55)');
      ctx.fillStyle = g; ctx.fillRect(x - 50 * s, 0, 50 * s, H);
      ctx.drawImage(paper(W, H), 0, 0, W, H, x, 0, W, H);
      ctx.fillStyle = 'rgba(220,235,255,0.25)'; ctx.fillRect(x, 0, 2 * s, H);
      ctx.restore();
    },
  };

  // plotter gantry: a rail across the sheet at the pen's x, the pen carriage at the drawing point
  function plotter(ctx, at, W, H, s) {
    if (!at) return;
    ctx.save();
    ctx.fillStyle = 'rgba(200,220,245,0.08)'; ctx.fillRect(at[0] - 14 * s, 0, 28 * s, H);
    ctx.strokeStyle = 'rgba(220,235,255,0.35)'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(at[0] - 14 * s, 0); ctx.lineTo(at[0] - 14 * s, H); ctx.moveTo(at[0] + 14 * s, 0); ctx.lineTo(at[0] + 14 * s, H); ctx.stroke();
    ctx.fillStyle = 'rgba(10,25,55,0.7)'; ctx.fillRect(at[0] - 22 * s, at[1] - 22 * s, 44 * s, 44 * s);
    ctx.strokeStyle = BP.line; ctx.lineWidth = 1.6 * s; ctx.strokeRect(at[0] - 22 * s, at[1] - 22 * s, 44 * s, 44 * s);
    ctx.beginPath(); ctx.arc(at[0], at[1], 7 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(at[0] - 30 * s, at[1]); ctx.lineTo(at[0] - 10 * s, at[1]); ctx.moveTo(at[0] + 10 * s, at[1]); ctx.lineTo(at[0] + 30 * s, at[1]); ctx.stroke();
    ctx.restore();
  }

  // ---------- demo: drafting the distribution rig ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [96 * s, 290 * s, 250 * s, 150 * s], node: [455 * s, 300 * s, 300 * s, 130 * s],
      chips: PLATFORMS.map((n, i) => [960 * s, (160 + i * 64) * s]), title: [W / 2, 108 * s], counter: [W / 2, 386 * s] };
    return { s, video: [W * 0.25, H * 0.185, W * 0.5, H * 0.11], node: [W * 0.17, H * 0.385, W * 0.66, H * 0.075],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.57 + Math.floor(i / 2) * 0.085)]), title: [W / 2, H * 0.085], counter: [W / 2, H * 0.47] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W;
      // slow camera drift along the sheet
      const cam = K.camAt([[0, { x: W * 0.5, y: H * 0.5, zoom: 1.025 }], [7.5, { x: W * 0.5, y: H * 0.5, zoom: 1.0 }], [8.6, { x: W * 0.5, y: H * 0.5, zoom: 1.02 }], [12, { x: W * 0.5, y: H * 0.5, zoom: 1.0 }]], t);
      ctx.save(); K.camera(ctx, W, H, cam);
      style.background(ctx, W, H, t);
      let at = null; const track = (pt, p) => { if (p > 0 && p < 1 && pt) at = pt; };
      if (t < 8.0) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.15, 1.5, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 78 * s, K.clamp(tp * tt.length - i), { size: portrait ? 48 : 46, align: 'center', rule: i === tt.length - 1 }));
        const [vx, vy, vw, vh] = Lo.video, bp = K.beat(t, 2.0, 1.0, 'lin');
        track(style.box(ctx, vx, vy, vw, vh, bp, { hatch: false, dimText: '1080' }), bp);
        if (t > 2.75) { const pp = K.beat(t, 2.75, 0.35, 'lin'); track(ink(ctx, [[vx + vw * 0.42, vy + vh * 0.24], [vx + vw * 0.42, vy + vh * 0.64], [vx + vw * 0.6, vy + vh * 0.44], [vx + vw * 0.42, vy + vh * 0.24]], pp, { width: 2.6 }), pp); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 46 * s, K.beat(t, 3.05, 0.45, 'lin'), { align: 'center', color: BP.accent });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 66 * s], [nx + nw / 2, ny - 34 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - 14 * s, ny + nh / 2]];
        const ap = K.beat(t, 3.45, 0.6, 'lin'); track(style.arrow(ctx, a1[0], a1[1], ap, {}), ap);
        const np = K.beat(t, 4.0, 0.9, 'lin'); track(style.box(ctx, nx, ny, nw, nh, np, { dimText: 'CORE' }), np);
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh * 0.55, K.beat(t, 4.5, 0.45, 'lin'), { size: 40, align: 'center', rule: false });
        if (portrait) { const yl = Lo.chips[6][1] - 11 * s, p2 = K.beat(t, 4.95, 0.45, 'lin'); track(ink(ctx, seg([W / 2, ny + nh + 34 * s], [W / 2, yl], 20), p2, { width: 1.8 }), p2); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.32, 'lin');
          if (portrait) track(style.arrow(ctx, [W / 2, cy - 11 * s], [left ? W * 0.45 : W * 0.55, cy - 11 * s], p), p);
          else track(style.arrow(ctx, [nx + nw, ny + nh / 2], [cx - 14 * s, cy - 11 * s], p, { elbow: [nx + nw + 70 * s, cy - 11 * s] }), p);
          style.label(ctx, name, portrait ? (left ? W * 0.43 : W * 0.57) : cx, cy, K.beat(t, t0 + 0.26, 0.3, 'lin'), { size: portrait ? 34 : 32, align: portrait ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.2), {});
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.2 : 118 * s, nx2 = W / 2 - nw / 2, ny2 = top - nh / 2;
        const rp = K.beat(t, 8.0, 0.5, 'lin');
        style.box(ctx, nx2, ny2, nw, nh, rp, { dimText: 'CORE', hatch: false });
        style.title(ctx, 'Creator OS', W / 2, ny2 + nh * 0.6, 1, { size: 40, align: 'center', rule: false });
        const v = K.count(t, 8.6, 1.4, 0, 1000000), cp = K.beat(t, 8.3, 0.4, 'lin');
        const C = Lo.counter;
        style.counter(ctx, Math.round(v / 1000) * 1000, C[0], C[1], cp, { size: portrait ? 92 : 112 });
        track(ink(ctx, seg([W / 2, ny2 + nh], [W / 2, C[1] - (portrait ? 92 : 112) * s * 0.82 - 4 * s], 16), cp, { width: 1.6, dash: [18, 5, 3, 5] }), cp);
        style.label(ctx, 'views', C[0], C[1] + 70 * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', size: 36, color: BP.accent });
        const ep = K.beat(t, 10.0, 0.5, 'lin');
        style.emphasis(ctx, C[0], C[1] - 14 * s, (portrait ? 250 : 262) * s, ep, {});
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.9, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, W / 2, (portrait ? H * 0.74 : 598 * s) + i * 76 * s, K.clamp(tp * tk.length - i), { size: portrait ? 46 : 38, align: 'center', color: BP.line, rule: portrait && i === tk.length - 1 }));
      }
      plotter(ctx, at, W, H, s);
      ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 0.8);
      k.play('scribble', 0.15, { medium: 'pen', dur: 1.5 });
      k.play('scribble', 2.0, { medium: 'pen', dur: 1.0 }); k.play('scribble', 2.75, { medium: 'pen', dur: 0.35 });
      k.play('type', 3.05, { dur: 0.45, gain: 0.7 });
      k.play('scribble', 3.45, { medium: 'pen', dur: 0.6 }); k.play('click', 4.05);
      k.play('scribble', 4.0, { medium: 'pen', dur: 0.9 }); k.play('type', 4.5, { dur: 0.45, gain: 0.7 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.3, gain: 0.8 }); k.play('click', 5.3 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('paper', 7.4, { dur: 0.5 }); k.play('whoosh', 7.45, { dur: 0.55, gain: 0.6 });
      k.play('scribble', 8.0, { medium: 'pen', dur: 0.5 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0, { gain: 0.8 }); k.play('scribble', 10.0, { medium: 'pen', dur: 0.5 });
      k.play('type', 10.5, { dur: 0.9, gain: 0.6 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
