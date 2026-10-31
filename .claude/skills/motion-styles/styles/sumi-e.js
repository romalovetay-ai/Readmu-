// Sumi-e Ink Wash (Painterly). Monochrome ink on fibrous rice paper: dilute grey washes that bleed into mist, single
// loaded-brush strokes built from a bundle of bristle tracks that run dry and split as the stroke travels, vast
// negative space, a vertical calligraphy column and a vermilion seal. The hub is an enso circle; emphasis is a
// vermilion stroke and a seal stamp. Scene change = mist rolls across the scroll and thins away.
(function () {
  const INK = { ink: '#151515', wash: '#6e6c68', pale: '#b4b0a8', red: '#c8321e' };
  const SERIF = 'Noto Serif JP';
  const PAPER = '#f2ede0';
  const S = (W, H) => K.layout(W, H).s;

  // One brush stroke as a bundle of bristles: wet and solid at the start, splitting into dry tracks toward the end.
  function brush(ctx, pts, p, o = {}) {
    const q = K.trim(pts, p); if (q.length < 2) return null;
    const s = S(ctx.canvas.width, ctx.canvas.height), w = (o.width || 14) * s, col = o.color || INK.ink, N = o.bristles || 16, r = K.rng(o.seed || 1), nz = K.noise(o.seed || 1);
    const total = K.pathLen(pts) || 1, dry0 = o.dry ?? 0.45;
    // per-point normal + distance along the full stroke
    const nrm = [], dist = [0];
    for (let i = 0; i < q.length; i++) { const a = q[Math.max(0, i - 1)], b = q[Math.min(q.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; nrm.push([-dy / l, dx / l]); if (i) dist.push(dist[i - 1] + Math.hypot(q[i][0] - q[i - 1][0], q[i][1] - q[i - 1][1])); }
    const width = (u) => w * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, 0.12 + u * 0.95))) * (o.press || 1);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // wet body: a soft solid core where the brush is still loaded
    ctx.strokeStyle = K.rgba(col, 0.82);
    for (let i = 1; i < q.length; i++) { const u = dist[i] / total; if (u > dry0 + 0.1) break; ctx.lineWidth = width(u) * 0.85; ctx.beginPath(); ctx.moveTo(q[i - 1][0], q[i - 1][1]); ctx.lineTo(q[i][0], q[i][1]); ctx.stroke(); }
    // bristles
    for (let b = 0; b < N; b++) {
      const off = (b / (N - 1) - 0.5) * 0.95, load = r.range(0.4, 1), lw = r.range(0.9, 2.4) * s, dies = dry0 + load * (1 - dry0) * r.range(0.6, 1.1);
      ctx.strokeStyle = K.rgba(col, r.range(0.55, 0.9)); ctx.lineWidth = lw;
      ctx.beginPath(); let pen = false;
      for (let i = 0; i < q.length; i++) {
        const u = dist[i] / total, wd = width(u), x = q[i][0] + nrm[i][0] * off * wd, y = q[i][1] + nrm[i][1] * off * wd;
        // dry-brush: gaps open up past the dry point, more often on the outer bristles
        const gap = u > dies || (u > dry0 && nz.n2(dist[i] * 0.05, b * 1.7) > 0.25 - (u - dry0) * 0.8 - Math.abs(off) * 0.3);
        if (gap) { pen = false; continue; }
        if (!pen) { ctx.moveTo(x, y); pen = true; } else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    // ink pooled where the brush touched down
    ctx.fillStyle = K.rgba(col, 0.55); ctx.beginPath(); ctx.ellipse(q[0][0], q[0][1], width(0) * 0.5, width(0) * 0.42, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return q[q.length - 1];
  }
  // dilute ink wash: soft blurred blob that fades at its edges (bleeding into mist)
  function washBlob(x, pts, col, a, blur) { x.save(); x.filter = `blur(${blur}px)`; x.fillStyle = K.rgba(col, a); K.poly(x, pts, true); x.fill(); x.restore(); }
  function inkText(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 54) * s, col = o.color || INK.ink;
    ctx.save(); ctx.font = K.font(size, SERIF, o.weight ?? 700); if (o.spacing) ctx.letterSpacing = o.spacing * s + 'px';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, n = Math.ceil(text.length * K.clamp(p));
    ctx.textAlign = 'left';
    // each character lands with a little bleed: grey halo first, then the ink
    ctx.shadowColor = K.rgba(col, 0.45); ctx.shadowBlur = 5 * s; ctx.fillStyle = K.rgba(col, 0.25); ctx.fillText(text.slice(0, n), x0, y);
    ctx.shadowBlur = 0; ctx.fillStyle = K.rgba(col, 0.92); ctx.fillText(text.slice(0, n), x0, y);
    ctx.restore(); return { w, h: size };
  }

  function paper(W, H) {
    return K.cached(`se-paper:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(201), portrait = H > W;
      x.drawImage(K.paperTex(W, H, PAPER, 202, 0.035, false), 0, 0);
      // kozo fibres: long thin curls, some lighter some darker than the sheet
      for (let i = 0; i < (W * H) / (900 * s * s); i++) {
        const x0 = r() * W, y0 = r() * H, a = r() * Math.PI * 2, L = r.range(14, 60) * s;
        x.strokeStyle = r() < 0.6 ? `rgba(255,255,250,${r.range(0.2, 0.5)})` : `rgba(120,110,95,${r.range(0.05, 0.14)})`; x.lineWidth = r.range(0.5, 1.2) * s;
        x.beginPath(); x.moveTo(x0, y0); x.quadraticCurveTo(x0 + Math.cos(a + 0.6) * L * 0.6, y0 + Math.sin(a + 0.6) * L * 0.6, x0 + Math.cos(a) * L, y0 + Math.sin(a) * L); x.stroke();
      }
      // distant mountains: dilute washes, darker at the ridge, dissolving into mist below
      // mountains: noise ridgelines with one or two dominant peaks, wash darkest at the crest and dissolving
      // into mist below, the near crest re-stated with a dry brush contour
      const ridge = (baseY, peaks, col, a, seed, contour) => {
        const nz = K.noise(seed), rr = K.rng(seed), pk = [rr.range(0.15, 0.45), rr.range(0.6, 0.9)], top = [];
        for (let px = -20; px <= W + 20; px += 6 * s) {
          const u = px / W, bell = Math.max(Math.exp(-Math.pow((u - pk[0]) / 0.12, 2)), 0.75 * Math.exp(-Math.pow((u - pk[1]) / 0.1, 2)));
          top.push([px, baseY - peaks * (0.25 + 0.75 * bell) * (0.75 + 0.35 * nz.fbm2(px * 0.006 / s, 0.5, 4)) - Math.abs(nz.n2(px * 0.03 / s, 2)) * 14 * s]);
        }
        const pts = [[-20, H + 20], ...top, [W + 20, H + 20]];
        x.save(); x.filter = `blur(${2.5 * s}px)`; const g = x.createLinearGradient(0, baseY - peaks, 0, baseY + peaks * 0.4);
        g.addColorStop(0, K.rgba(col, a)); g.addColorStop(0.55, K.rgba(col, a * 0.45)); g.addColorStop(1, K.rgba(col, 0)); x.fillStyle = g; K.poly(x, pts, true); x.fill(); x.restore();
        // texture strokes (cun): short dry vertical rubs down from the crest
        x.save(); K.poly(x, pts, true); x.clip(); x.strokeStyle = K.rgba(col, a * 0.5); x.lineCap = 'round';
        for (let i = 0; i < top.length; i += 3) { if (rr() < 0.5) continue; const [tx, ty] = top[i]; x.lineWidth = rr.range(0.8, 2.2) * s; x.beginPath(); x.moveTo(tx, ty + 4 * s); x.lineTo(tx + rr.range(-12, 12) * s, ty + rr.range(20, 70) * s); x.stroke(); }
        x.restore();
        if (contour) brush(x, top.filter((_, i) => i % 2 === 0), 1, { width: 6, seed: seed + 3, bristles: 10, dry: 0.15, color: '#2a2a2a' });
      };
      if (portrait) { ridge(H * 0.9, 420 * s, INK.pale, 0.5, 7); ridge(H * 0.99, 230 * s, INK.wash, 0.62, 8); }
      else { ridge(H * 0.8, 300 * s, INK.pale, 0.5, 7); ridge(H * 0.97, 170 * s, INK.wash, 0.6, 8); }
      // a few birds, three flicks of the brush each
      x.strokeStyle = 'rgba(30,30,30,0.6)'; x.lineWidth = 1.6 * s; x.lineCap = 'round';
      for (let i = 0; i < 4; i++) { const bx = (portrait ? 0.15 : 0.08) * W + i * 26 * s, by = (portrait ? 0.86 : 0.22) * H + Math.sin(i * 2.1) * 10 * s; x.beginPath(); x.moveTo(bx - 7 * s, by - 3 * s); x.quadraticCurveTo(bx - 2 * s, by - 5 * s, bx, by); x.quadraticCurveTo(bx + 2 * s, by - 5 * s, bx + 7 * s, by - 4 * s); x.stroke(); }
      return c;
    });
  }
  // vertical calligraphy column + seal (part of the composition, drawn every frame so it can be revealed)
  function column(ctx, W, H, p) {
    const s = S(W, H), portrait = H > W, size = (portrait ? 46 : 50) * s, x = portrait ? W * 0.93 : W - 64 * s, y0 = portrait ? H * 0.06 : 70 * s, txt = '一度の投稿';
    ctx.save(); ctx.font = K.font(size, SERIF, 900); ctx.textAlign = 'center';
    const n = Math.ceil(txt.length * K.clamp(p));
    for (let i = 0; i < n; i++) { ctx.shadowColor = 'rgba(20,20,20,0.4)'; ctx.shadowBlur = 4 * s; ctx.fillStyle = 'rgba(20,20,20,0.88)'; ctx.fillText(txt[i], x, y0 + (i + 1) * size * 1.12); }
    ctx.restore();
    if (p >= 1) seal(ctx, x, y0 + txt.length * size * 1.12 + size * 0.95, size * 0.95, 1);
  }
  function seal(ctx, x, y, z, a) {
    const s = S(ctx.canvas.width, ctx.canvas.height), r = K.rng(33);
    ctx.save(); ctx.globalAlpha = a; ctx.translate(x, y); ctx.rotate(-0.03);
    ctx.fillStyle = INK.red; ctx.beginPath(); ctx.rect(-z / 2, -z / 2, z, z); ctx.fill();
    // uneven stamp: paper showing through
    ctx.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 40; i++) { ctx.fillStyle = `rgba(0,0,0,${r.range(0.2, 0.8)})`; ctx.fillRect(r.range(-z / 2, z / 2), r.range(-z / 2, z / 2), r.range(1, 3) * s, r.range(1, 3) * s); }
    ctx.globalCompositeOperation = 'destination-out'; ctx.font = K.font(z * 0.62, SERIF, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillStyle = '#000'; ctx.fillText('創', 0, z * 0.04);
    ctx.restore();
  }

  const style = {
    id: 'sumi-e', name: 'Sumi-e Ink Wash', family: 'Painterly',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700;900&display=block', specs: ['700 54px "Noto Serif JP"', '900 50px "Noto Serif JP"'] }],
    palette: { bg: PAPER, ...INK, accent: INK.red },
    sfx: { draw: 'brush', land: 'pluck', emphasis: 'stamp', transition: 'whoosh', bed: 'ocean' },
    setup(W, H) { paper(W, H); },

    background(ctx, W, H, t) { ctx.drawImage(paper(W, H), 0, 0); },
    finish(ctx, W, H, t) {
      // drifting mist bands over everything, a whisper of fibre grain
      const s = S(W, H);
      ctx.save();
      for (let i = 0; i < 3; i++) {
        const y = H * (0.3 + i * 0.25) + Math.sin(t * 0.3 + i) * 20 * s, x = ((t * (12 + i * 6) * s + i * W * 0.4) % (W * 1.6)) - W * 0.3, wd = W * 0.7, hh = 90 * s;
        const g = ctx.createRadialGradient(x, y, 0, x, y, wd / 2); g.addColorStop(0, K.rgba(PAPER, 0.28)); g.addColorStop(1, K.rgba(PAPER, 0));
        ctx.setTransform(1, 0, 0, hh / (wd / 2), 0, y - y * (hh / (wd / 2))); ctx.fillStyle = g; ctx.fillRect(x - wd / 2, y - wd / 2, wd, wd);
      }
      ctx.restore();
      K.vignette(ctx, W, H, 0.16, '#5a5040');
      K.grain(ctx, W, H, t, 0.03, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return inkText(ctx, text, x, y, p, { size: 56, weight: 700, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return inkText(ctx, text, x, y, p, { size: 34, weight: 700, ...o }); },

    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      const pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.14, 36), 1.4 * s, o.seed || 3, 0.02);
      const e = brush(ctx, pts, K.clamp(p / 0.82), { width: o.width || 11, seed: o.seed || 3, color: o.color, dry: 0.4 });
      // the head: one quick flick back from the tip
      if (p > 0.82) { const k = K.clamp((p - 0.82) / 0.18), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = Math.min(30 * s, K.pathLen(pts) * 0.4);
        brush(ctx, K.bezier(b, b, [b[0] - Math.cos(ang - 0.6) * L * 0.6, b[1] - Math.sin(ang - 0.6) * L * 0.6], [b[0] - Math.cos(ang - 0.55) * L, b[1] - Math.sin(ang - 0.55) * L], 12), k, { width: (o.width || 11) * 0.8, seed: (o.seed || 3) + 9, bristles: 10, color: o.color, dry: 0.3 }); }
      return e;
    },

    // a pale wash card with a few confident edge strokes (or an enso circle when o.enso)
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), r = K.rng(o.seed || 5);
      if (o.enso) {
        const cx = x + w / 2, cy = y + h / 2;
        const pts = K.wobble(K.circlePts(cx, cy, w / 2, h / 2, 90, Math.PI * 0.62, Math.PI * 1.88), 2 * s, o.seed || 5, 0.02);
        return brush(ctx, pts, p, { width: 26, seed: o.seed || 5, bristles: 22, dry: 0.5 });
      }
      const wp = K.clamp(p * 1.6);
      if (wp > 0) {
        const L = K.cached(`se-card:${x | 0},${y | 0},${w | 0},${h | 0}`, () => { const c = K.layer(w + 80 * s, h + 80 * s), xx = c.getContext('2d'), pts = []; for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, rr = 1 + r.range(-0.06, 0.08); pts.push([40 * s + w / 2 + Math.sign(Math.cos(a)) * Math.min(Math.abs(Math.cos(a)) * 1.4, 1) * (w / 2) * rr, 40 * s + h / 2 + Math.sign(Math.sin(a)) * Math.min(Math.abs(Math.sin(a)) * 1.4, 1) * (h / 2) * rr]); }
          washBlob(xx, pts, INK.wash, 0.22, 7 * s); washBlob(xx, pts.map(([a, b]) => [a + 6 * s, b + 4 * s]), INK.wash, 0.14, 12 * s); return c; });
        ctx.save(); ctx.globalAlpha = wp; ctx.drawImage(L, x - 40 * s, y - 40 * s); ctx.restore();
      }
      const e1 = brush(ctx, K.wobble(K.bezier([x - 10 * s, y + 4 * s], [x + w * 0.3, y - 2 * s], [x + w * 0.7, y + 3 * s], [x + w + 8 * s, y], 30), 1.2 * s, (o.seed || 5) + 1), K.clamp((p - 0.3) / 0.35), { width: 9, seed: (o.seed || 5) + 1, bristles: 12 });
      const e2 = brush(ctx, K.wobble(K.bezier([x - 4 * s, y + h], [x + w * 0.35, y + h + 3 * s], [x + w * 0.7, y + h - 2 * s], [x + w + 12 * s, y + h + 2 * s], 30), 1.2 * s, (o.seed || 5) + 2), K.clamp((p - 0.6) / 0.35), { width: 12, seed: (o.seed || 5) + 2, bristles: 14 });
      return p < 0.65 ? e1 : e2;
    },

    counter(ctx, value, x, y, p, o = {}) { return inkText(ctx, K.fmt(value), x, y, 1, { size: o.size || 118, weight: 900, align: o.align || 'center' }); },

    // vermilion: an open brush circle, then the seal pressed beside it
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      brush(ctx, K.wobble(K.circlePts(x, y, r * 1.2, r * 0.6, 80, Math.PI * 0.75, Math.PI * 1.85), 2.5 * s, o.seed || 13, 0.02), K.clamp(p / 0.8), { width: 16, color: INK.red, seed: o.seed || 13, bristles: 16, dry: 0.5 });
      if (p > 0.8) { const k = K.clamp((p - 0.8) / 0.2), z = 58 * s * (1.3 - 0.3 * k); seal(ctx, x + r * 1.2 + 10 * s, y + r * 0.5, z, k); }
    },

    // mist rolls across from the right, swallowing the scroll (0.5), then thins
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), cov = Math.sin(Math.PI * K.clamp(p)), r = K.rng(o.seed || 17), front = K.lerp(W * 1.4, -W * 0.4, K.clamp(p));
      ctx.save();
      for (let i = 0; i < 16; i++) {
        const cx = front + r.range(-0.2, 0.9) * W, cy = r() * H, R = r.range(160, 380) * s;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R); g.addColorStop(0, K.rgba(PAPER, 0.9 * cov)); g.addColorStop(1, K.rgba(PAPER, 0));
        ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      }
      ctx.fillStyle = K.rgba(PAPER, 0.85 * Math.pow(cov, 2)); ctx.fillRect(0, 0, W, H);
      ctx.restore();
    },
  };

  // ---------- demo: along the handscroll ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [96 * s, 300 * s, 240 * s, 140 * s], node: [470 * s, 266 * s, 280 * s, 210 * s],
      chips: PLATFORMS.map((n, i) => [960 * s, (166 + i * 72) * s]), title: [560 * s, 120 * s], counter: [W * 0.46, 420 * s] };
    return { s, video: [W * 0.24, H * 0.19, W * 0.46, H * 0.095], node: [W * 0.19, H * 0.385, W * 0.54, H * 0.14],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.54 : W * 0.4, H * (0.6 + Math.floor(i / 2) * 0.075)]), title: [W * 0.46, H * 0.1], counter: [W * 0.46, H * 0.47] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W, CX = portrait ? W * 0.46 : null;
      // the scroll unrolls slowly: the whole sheet drifts
      const cam = { x: W / 2 + (portrait ? 0 : K.lerp(-16, 16, t / 12) * s), y: H / 2 + (portrait ? K.lerp(-16, 16, t / 12) * s : 0), zoom: 1.03 };
      ctx.save(); K.camera(ctx, W, H, cam);
      style.background(ctx, W, H, t);
      column(ctx, W, H, K.beat(t, 0.4, 1.6, 'lin'));
      if (t < 8.0) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.15, 1.5, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 76 * s, K.clamp(tp * tt.length - i), { size: portrait ? 56 : 54, align: 'center' }));
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 1.0, 'lin'), { seed: 21 });
        if (t > 2.6) brush(ctx, [[vx + vw * 0.42, vy + vh * 0.25], [vx + vw * 0.42, vy + vh * 0.75], [vx + vw * 0.62, vy + vh * 0.5], [vx + vw * 0.44, vy + vh * 0.28]].flatMap((pt, i, A) => (i ? K.bezier(A[i - 1], A[i - 1], pt, pt, 10).slice(1) : [pt])), K.beat(t, 2.6, 0.4, 'lin'), { width: 7, seed: 22, bristles: 10, dry: 0.85 });
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 52 * s, K.beat(t, 3.0, 0.45, 'lin'), { align: 'center', color: INK.wash });
        const [nx, ny, nw, nh] = Lo.node, ncx = nx + nw / 2, ncy = ny + nh / 2;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 66 * s], [ncx, ny - 10 * s]] : [[vx + vw + 16 * s, vy + vh / 2], [nx - 18 * s, ncy]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.45, 0.55, 'lin'), { seed: 31, bend: portrait ? 0.08 : -0.12 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.7, 'lin'), { enso: true, seed: 41 });
        style.title(ctx, 'Creator OS', ncx, ncy + 16 * s, K.beat(t, 4.5, 0.45, 'lin'), { size: 46, align: 'center' });
        if (portrait) brush(ctx, K.wobble(K.bezier([CX, ny + nh + 14 * s], [CX, ny + nh + 14 * s], [CX, Lo.chips[6][1] - 12 * s], [CX, Lo.chips[6][1] - 12 * s], 40), 1.2 * s, 49), K.beat(t, 4.95, 0.45, 'lin'), { width: 10, seed: 49, dry: 0.6 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.3, 'lin');
          const ex = ncx + Math.cos((i - 3) * 0.22) * nw / 2, ey = ncy + Math.sin((i - 3) * 0.22) * nh / 2;
          const from = portrait ? [CX, cy - 12 * s] : [ex + 8 * s, ey], to = portrait ? [left ? CX - W * 0.1 : CX + W * 0.1, cy - 12 * s] : [cx - 16 * s, cy - 11 * s];
          style.arrow(ctx, from, to, p, { seed: 50 + i, bend: portrait ? 0 : (i - 3) * 0.03, width: portrait ? 8 : 9 });
          style.label(ctx, name, portrait ? (left ? CX - W * 0.12 : CX + W * 0.12) : cx, cy, K.beat(t, t0 + 0.24, 0.32, 'lin'), { size: portrait ? 34 : 34, align: portrait ? (left ? 'right' : 'left') : 'left' });
        });
      } else {
        const ncx = portrait ? CX : W * 0.46, ncy = portrait ? H * 0.24 : 130 * s;
        style.box(ctx, ncx - 150 * s, ncy - 66 * s, 300 * s, 132 * s, K.beat(t, 8.1, 0.6, 'lin'), { enso: true, seed: 43 });
        style.title(ctx, 'Creator OS', ncx, ncy + 16 * s, K.beat(t, 8.3, 0.4, 'lin'), { size: 44, align: 'center' });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t >= 8.6) style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 100 : 120 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 60 * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', size: 40, color: INK.wash });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 34 * s, (portrait ? 215 : 240) * s, K.beat(t, 10.0, 0.6, 'lin'), {});
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.95, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, portrait ? CX : W * 0.46, (portrait ? H * 0.74 : 630 * s) + i * 80 * s, K.clamp(tp * tk.length - i), { size: portrait ? 56 : 50, align: 'center' }));
      }
      ctx.restore();
      style.finish(ctx, W, H, t);
      if (t > 7.2 && t < 8.8) style.transition(ctx, W, H, K.clamp((t - 7.2) / 1.6), {});
    },
    score(k) {
      k.bed('ocean', 0, 12, 0.8); k.play('swell', 0, { dur: 3, chord: ['D3', 'A3', 'E4'], gain: 0.9 });
      k.play('scribble', 0.15, { medium: 'brush', dur: 1.5 }); k.play('pluck', 1.9, { note: 'D5', gain: 0.5 });
      k.play('scribble', 2.0, { medium: 'brush', dur: 1.0 }); k.play('scribble', 2.6, { medium: 'brush', dur: 0.4 });
      k.play('scribble', 3.45, { medium: 'brush', dur: 0.55, gain: 1.2 });
      k.play('scribble', 4.0, { medium: 'brush', dur: 0.7, gain: 1.4 }); k.play('pluck', 4.7, { note: 'A4', gain: 0.6 });
      const notes = ['D5', 'E5', 'G5', 'A5', 'B5', 'D6', 'E6'];
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'brush', dur: 0.3, gain: 0.9 }); k.play('pluck', 5.28 + i * 0.4, { note: notes[i], gain: 0.5 }); }
      k.play('whoosh', 7.2, { dur: 1.6, gain: 0.5 });
      k.play('scribble', 8.1, { medium: 'brush', dur: 0.6, gain: 1.3 });
      k.play('count', 8.6, { dur: 1.4, gain: 0.7 }); k.play('scribble', 10.0, { medium: 'brush', dur: 0.5, gain: 1.2 }); k.play('stamp', 10.55);
      k.play('scribble', 10.5, { medium: 'brush', dur: 0.95 }); k.play('chime', 11.4, { note: 'D6' });
    },
  };
  MS.register(style);
})();
