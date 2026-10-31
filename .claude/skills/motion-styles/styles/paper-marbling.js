// Ebru Paper Marbling (Generative & Type). Turkish ebru built with the actual marbling transforms: every paint drop
// is a polygon; a new drop pushes every earlier boundary outward (p' = c + (p - c) * sqrt(1 + r^2 / |p - c|^2)),
// a comb or stylus displaces points along its stroke by z * 2^(-d / c). A battal stone ground rains in, a rake drags
// it into gel-git flames, ring drops stack at one point and a stylus pulls them into a tulip. Bookbinder labels,
// inked stylus arrows, a wet sheen over the bath, then the sheet is lifted off as the scene change.
(function () {
  const C = { ground: '#efe2c0', navy: '#1e2d6b', sky: '#86afd8', ochre: '#e0a535', teal: '#1d867c', cream: '#f4ead2', red: '#b4322b', ink: '#1a1a24', label: '#f6eedb', green: '#4f7a3a' };
  const SERIF = 'Cormorant Garamond', SC = 'Cormorant SC';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;

  // ---------- marbling math ----------
  function dropOp(polys, c, r) {
    const r2 = r * r;
    for (const P of polys) for (const p of P.pts) { const dx = p[0] - c[0], dy = p[1] - c[1], d2 = dx * dx + dy * dy || 1e-6, k = Math.sqrt(1 + r2 / d2); p[0] = c[0] + dx * k; p[1] = c[1] + dy * k; }
  }
  // comb of parallel tines (spacing lam, 0 = single stylus line) through point o, stroke direction (ux, uy)
  function tineOp(polys, o, ux, uy, z, c, lam) {
    const nx = -uy, ny = ux, k = Math.LN2 / c;
    for (const P of polys) for (const p of P.pts) {
      let d = Math.abs((p[0] - o[0]) * nx + (p[1] - o[1]) * ny);
      if (lam) { d = d % lam; d = Math.min(d, lam - d); }
      const m = z * Math.exp(-d * k); p[0] += ux * m; p[1] += uy * m;
    }
  }
  function circle(c, r, n = 140) { return Array.from({ length: n }, (_, i) => [c[0] + Math.cos((i / n) * TAU) * r, c[1] + Math.sin((i / n) * TAU) * r]); }
  function resample(P, maxSeg) {
    if (P.pts.length > 5000) return;
    const out = [], pts = P.pts, n = pts.length;
    for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; out.push(a); const d = Math.hypot(b[0] - a[0], b[1] - a[1]); if (d > maxSeg) { const k = Math.min(8, Math.ceil(d / maxSeg)); for (let j = 1; j < k; j++) out.push([K.lerp(a[0], b[0], j / k), K.lerp(a[1], b[1], j / k)]); } }
    P.pts = out;
  }
  const clonePolys = (polys) => polys.map((P) => ({ col: P.col, pts: P.pts.map((p) => [p[0], p[1]]) }));

  // ops for a given frame size: [{t0, dur, kind, ...}]
  function buildOps(W, H, Lo) {
    const s = Lo.s, r = K.rng(1453), ops = [], cols = [C.navy, C.sky, C.ochre, C.teal, C.cream, C.navy, C.sky];
    // battal stone ground
    const n = 44;
    for (let i = 0; i < n; i++) ops.push({ t0: 0.05 + i * 0.04, dur: 0.3, kind: 'drop', c: [r() * W, r() * H], r: r.range(55, 105) * s, col: cols[i % cols.length] });
    // gel-git rake: two passes of a vertical-stroke comb, the second offset by half a tine
    const lam = 120 * s;
    ops.push({ t0: 2.1, dur: 0.8, kind: 'tine', o: [0, 0], u: [0, 1], z: 95 * s, c: 22 * s, lam });
    ops.push({ t0: 3.0, dur: 0.8, kind: 'tine', o: [lam / 2, 0], u: [0, -1], z: 95 * s, c: 22 * s, lam });
    // suminagashi ring drops stacked at the node
    const N = Lo.nodeC, rc = [C.red, C.cream, C.navy, C.ochre, C.cream, C.teal, C.red, C.cream];
    rc.forEach((col, i) => ops.push({ t0: 3.9 + i * 0.1, dur: 0.18, kind: 'drop', c: N, r: (P_RING(i) * Lo.ring), col }));
    // stylus pulls the rings into a tulip
    ops.push({ t0: 4.85, dur: 0.6, kind: 'tine', o: [N[0], N[1]], u: Lo.pull, z: Lo.ring * 2.4, c: Lo.ring * 0.5, lam: 0 });
    return ops;
  }
  const P_RING = (i) => 1.0 - i * 0.02;
  function stateAt(W, H, Lo, t) {
    const ops = K.cached(`pm-ops:${W}x${H}`, () => buildOps(W, H, Lo)), s = Lo.s;
    // index of last fully completed op (ops are ordered by start, durations short; treat completion by t0 + dur)
    let done = 0; while (done < ops.length && ops[done].t0 + ops[done].dur <= t) done++;
    const base = done ? stateFull(done - 1) : [];
    function stateFull(i) {
      return K.cached(`pm-full:${W}x${H}:${i}`, () => {
        const polys = i ? clonePolys(stateFull(i - 1)) : [];
        applyOp(polys, ops[i], 1, s); polys.forEach((P) => resample(P, 6 * s)); return polys;
      });
    }
    // partial ops in flight (any op whose window contains t, after `done`)
    let polys = base;
    const live = []; for (let i = done; i < ops.length && ops[i].t0 < t; i++) live.push(ops[i]);
    if (live.length) { polys = clonePolys(base); for (const op of live) applyOp(polys, op, K.ease.out(K.clamp((t - op.t0) / op.dur)), s); }
    return polys;
  }
  function applyOp(polys, op, k, s) {
    if (k <= 0) return;
    if (op.kind === 'drop') { const r = op.r * k; dropOp(polys, op.c, r); polys.push({ col: op.col, pts: circle(op.c, r, Math.max(60, Math.round(op.r / (3 * s)))) }); }
    else tineOp(polys, op.o, op.u[0], op.u[1], op.z * k, op.c, op.lam);
  }
  function drawBath(ctx, W, H, polys, s) {
    ctx.fillStyle = C.ground; ctx.fillRect(0, 0, W, H);
    for (const P of polys) { K.poly(ctx, P.pts, true); ctx.fillStyle = P.col; ctx.fill(); ctx.strokeStyle = 'rgba(26,26,36,0.28)'; ctx.lineWidth = 0.9 * s; ctx.stroke(); }
  }

  const style = {
    id: 'paper-marbling', name: 'Ebru Paper Marbling', family: 'Generative & Type',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Cormorant+SC:wght@600;700&display=block', specs: ['700 60px "Cormorant Garamond"', '700 30px "Cormorant SC"', 'italic 600 30px "Cormorant Garamond"'] }],
    palette: C,
    sfx: { draw: 'brush', land: 'pluck', emphasis: 'chime', transition: 'paper', bed: 'ocean' },

    background(ctx, W, H, t, o = {}) { drawBath(ctx, W, H, o.polys || [], S(W, H)); },

    // laid-paper surface (chain + laid lines), fibre, wet sheen when o.wet, vignette
    finish(ctx, W, H, t, o = {}) {
      const s = S(W, H);
      const laid = K.cached(`pm-laid:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d');
        x.drawImage(K.paperTex(W, H, '#fbf4e4', 17, 0.1, false), 0, 0);
        x.strokeStyle = 'rgba(120,100,70,0.10)'; x.lineWidth = Math.max(1, 0.8 * s);
        for (let y = 0; y < H; y += 4 * s) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); }
        x.strokeStyle = 'rgba(120,100,70,0.16)'; x.lineWidth = 1.6 * s;
        for (let xx = 30 * s; xx < W; xx += 70 * s) { x.beginPath(); x.moveTo(xx, 0); x.lineTo(xx, H); x.stroke(); }
        return c;
      });
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = o.wet ? 0.55 : 0.9; ctx.drawImage(laid, 0, 0); ctx.restore();
      if (o.wet) {
        const x = K.lerp(-W * 0.4, W * 1.4, (t * 0.12) % 1), g = ctx.createLinearGradient(x - W * 0.3, 0, x + W * 0.3, H * 0.4);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.22)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      }
      K.vignette(ctx, W, H, 0.3, '#3b2a14');
      K.grain(ctx, W, H, t, 0.04, 12, 'overlay');
    },

    // bookbinder title label: cream slip, double rule border, engraved serif
    title(ctx, text, x, y, p, o = {}) { return style.label(ctx, text, x, y, p, { size: o.size || 58, weight: 700, ...o, big: true }); },
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 30) * s;
      ctx.save(); ctx.font = o.big ? K.font(size, SERIF, 700) : K.font(size, SC, 700);
      const tw = ctx.measureText(text).width, w = tw + size * (o.big ? 1.2 : 1.1), h = size * (o.big ? 1.55 : 1.7);
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, k = K.ease.out(K.clamp(p));
      ctx.globalAlpha = k; ctx.translate(x0 + w / 2, y + (1 - k) * 14 * s);
      ctx.shadowColor = 'rgba(40,25,10,0.35)'; ctx.shadowBlur = 10 * s; ctx.shadowOffsetY = 4 * s;
      ctx.beginPath(); ctx.roundRect(-w / 2, -h / 2, w, h, 6 * s); ctx.fillStyle = o.fill || C.label; ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = o.rule || C.navy; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.roundRect(-w / 2 + 5 * s, -h / 2 + 5 * s, w - 10 * s, h - 10 * s, 4 * s); ctx.stroke();
      ctx.lineWidth = 0.8 * s; ctx.beginPath(); ctx.roundRect(-w / 2 + 9 * s, -h / 2 + 9 * s, w - 18 * s, h - 18 * s, 3 * s); ctx.stroke();
      ctx.fillStyle = o.color || C.ink; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(text, 0, size * 0.05);
      ctx.restore(); return { w, h };
    },

    // inked stylus stroke: tapered, slightly wavering ink line with a leaf-shaped head
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.15, 50), 2 * s, o.seed || 3), sub = K.trim(pts, K.ease.inOut(K.clamp(p)));
      ctx.save(); ctx.fillStyle = o.color || C.ink;
      const n = sub.length;
      for (let i = 1; i < n; i++) { const k = i / Math.max(1, pts.length - 1), w = (1.2 + 3.2 * Math.sin(Math.PI * Math.min(1, k * 1.1))) * s; ctx.beginPath(); ctx.arc(sub[i][0], sub[i][1], w / 2, 0, TAU); ctx.fill(); }
      if (p >= 1) { const b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]); ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(4 * s, 0); ctx.quadraticCurveTo(-8 * s, -9 * s, -18 * s, 0); ctx.quadraticCurveTo(-8 * s, 9 * s, 4 * s, 0); ctx.fill(); }
      ctx.restore(); return sub[sub.length - 1];
    },

    // a bookbinder card: label stock with double rule (content drawn by the caller)
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p));
      ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 18 * s);
      ctx.shadowColor = 'rgba(40,25,10,0.4)'; ctx.shadowBlur = 14 * s; ctx.shadowOffsetY = 6 * s;
      ctx.fillStyle = o.fill || C.label; ctx.fillRect(x, y, w, h); ctx.shadowColor = 'transparent';
      ctx.strokeStyle = o.rule || C.navy; ctx.lineWidth = 2.2 * s; ctx.strokeRect(x + 7 * s, y + 7 * s, w - 14 * s, h - 14 * s); ctx.lineWidth = 0.9 * s; ctx.strokeRect(x + 12 * s, y + 12 * s, w - 24 * s, h - 24 * s);
      ctx.restore();
    },

    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 110) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, SERIF, 700); const w = ctx.measureText(K.fmt(1000000)).width; ctx.restore();
      style.box(ctx, x - w / 2 - size * 0.4, y - size * 0.95, w + size * 0.8, size * 1.3, 1, {});
      ctx.save(); ctx.font = K.font(size, SERIF, 700); ctx.fillStyle = o.color || C.navy; ctx.textAlign = 'center'; ctx.fillText(txt, x, y); ctx.restore();
    },

    // suminagashi rings blooming outward from the point, alternating inks
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p)), cols = [C.red, C.navy, C.ochre, C.teal];
      ctx.save();
      for (let i = 0; i < 6; i++) { const rr = r * k * (1 - i * 0.12); if (rr <= 0) continue; ctx.strokeStyle = K.rgba(cols[i % 4], 0.85); ctx.lineWidth = (7 - i * 0.6) * s; ctx.beginPath(); for (let j = 0; j <= 80; j++) { const a = (j / 80) * TAU, w = 1 + 0.025 * Math.sin(a * 5 + i); j ? ctx.lineTo(x + Math.cos(a) * rr * w, y + Math.sin(a) * rr * w * (o.squash ?? 0.55)) : ctx.moveTo(x + Math.cos(a) * rr * w, y + Math.sin(a) * rr * w * (o.squash ?? 0.55)); } ctx.stroke(); }
      ctx.restore();
    },

    // the sheet is laid onto the bath (0..0.5) and lifted off with a curling edge (0.5..1)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), cover = p < 0.5 ? K.ease.inOut(p * 2) : 1 - K.ease.inOut((p - 0.5) * 2), edge = H * cover;
      const sheet = K.cached(`pm-sheet:${W}x${H}`, () => K.paperTex(W, H, '#f8f0de', 19, 0.08, false));
      ctx.save();
      ctx.beginPath(); ctx.rect(0, 0, W, edge); ctx.clip(); ctx.drawImage(sheet, 0, 0); ctx.restore();
      if (edge > 2 && edge < H - 2) {
        // curl at the moving edge: a highlight roll and its shadow
        const g = ctx.createLinearGradient(0, edge - 40 * s, 0, edge); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.7, 'rgba(255,255,255,0.7)'); g.addColorStop(1, 'rgba(160,140,110,0.8)');
        ctx.fillStyle = g; ctx.fillRect(0, edge - 40 * s, W, 40 * s);
        const sh = ctx.createLinearGradient(0, edge, 0, edge + 50 * s); sh.addColorStop(0, 'rgba(30,20,10,0.45)'); sh.addColorStop(1, 'rgba(30,20,10,0)');
        ctx.fillStyle = sh; ctx.fillRect(0, edge, W, 50 * s);
      }
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 82 * s], video: [70 * s, 300 * s, 230 * s, 140 * s], nodeC: [610 * s, 330 * s], ring: 38 * s, pull: [0, 1],
      chips: PLATFORMS.map((n, i) => [960 * s, (180 + i * 72) * s]), counter: [W / 2, 400 * s], take: [W / 2, 640 * s] };
    return { s, P: true, title: [W / 2, H * 0.07], video: [W * 0.28, H * 0.12, W * 0.44, H * 0.08], nodeC: [W / 2, H * 0.33], ring: 38 * s, pull: [0, 1],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.62 + Math.floor(i / 2) * 0.07)]), counter: [W / 2, H * 0.5], take: [W / 2, H * 0.78] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, s2 = t >= 8.25;
      const polys = stateAt(W, H, Lo, s2 ? 99 : t);
      if (!s2) {
        style.background(ctx, W, H, t, { polys });
        style.finish(ctx, W, H, t, { wet: true });
        const [vx, vy, vw, vh] = Lo.video, [nx, ny] = Lo.nodeC;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.5));
        const tp = K.beat(t, 2.3, 0.4); if (tp > 0) { ctx.save(); ctx.globalAlpha = tp; ctx.fillStyle = C.red; ctx.beginPath(); const cx = vx + vw / 2, cy = vy + vh / 2; ctx.moveTo(cx - 18 * s, cy - 24 * s); ctx.lineTo(cx + 24 * s, cy); ctx.lineTo(cx - 18 * s, cy + 24 * s); ctx.closePath(); ctx.fill(); ctx.restore(); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 40 * s, K.beat(t, 2.6, 0.4), { align: 'center' });
        const a1 = P ? [[W / 2, vy + vh + 82 * s], [nx, ny - 110 * s]] : [[vx + vw + 12 * s, vy + vh / 2], [nx - 110 * s, ny - 10 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.6, 'lin'), { bend: P ? 0.05 : -0.12 });
        const ly = ny + (P ? 230 : 220) * s;
        style.label(ctx, 'Creator OS', nx, ly, K.beat(t, 4.9, 0.5), { align: 'center', size: 40, fill: C.cream, rule: C.red });
        if (P) style.arrow(ctx, [W / 2, ly + 46 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 5.1, 0.5, 'lin'), { bend: 0.01 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy] : [nx + 50 * s, ny + 120 * s], to = P ? [left ? W * 0.465 : W * 0.535, cy] : [cx - 16 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.38, 'lin'), { bend: P ? 0 : -0.08 + i * 0.02, seed: 10 + i });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.3, 0.35), { size: 30, align: P ? (left ? 'right' : 'left') : 'left' });
        });
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.4, 0.8), { size: P ? 50 : 56, align: 'center' });
      } else {
        // the lifted print: the same pattern on paper, drier and flatter
        ctx.save(); ctx.filter = 'saturate(0.85) brightness(1.04)'; style.background(ctx, W, H, t, { polys }); ctx.restore();
        style.finish(ctx, W, H, t, { wet: false });
        const [cx, cy] = Lo.counter, v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.emphasis(ctx, cx, cy - 40 * s, (P ? 470 : 470) * s, K.beat(t, 10.0, 1.0, 'lin'), { squash: P ? 0.6 : 0.5 });
        style.label(ctx, 'Creator OS', cx, cy - (P ? 210 : 190) * s, 1, { align: 'center', size: 36, fill: C.cream, rule: C.red });
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy, 1, { size: P ? 90 : 104 });
        style.label(ctx, 'views', cx, cy + (P ? 90 : 80) * s, K.beat(t, 8.8, 0.4), { align: 'center' });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.8), { size: P ? 46 : 54, align: 'center' });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
    },
    score(k) {
      k.bed('ocean', 0, 12, 1);
      for (let i = 0; i < 44; i += 4) k.play('pluck', 0.05 + i * 0.04, { note: ['C5', 'E5', 'G5', 'A5', 'C6', 'D6'][i / 4 % 6], gain: 0.3, dur: 0.3 });
      k.play('scribble', 2.1, { medium: 'brush', dur: 0.8 }); k.play('scribble', 3.0, { medium: 'brush', dur: 0.8 });
      k.play('paper', 2.0, { dur: 0.2 }); k.play('pluck', 2.6, { note: 'G4' });
      for (let i = 0; i < 8; i++) k.play('pluck', 3.9 + i * 0.1, { note: ['C6', 'G5', 'E5', 'C5', 'G4', 'E4', 'C4', 'G3'][i], gain: 0.4, dur: 0.4 });
      k.play('scribble', 4.85, { medium: 'brush', dur: 0.6, gain: 1.2 }); k.play('pluck', 5.0, { note: 'E5' });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.3, gain: 0.5 }); k.play('paper', 5.32 + i * 0.4, { dur: 0.12 }); }
      k.play('paper', 7.6, { dur: 0.6 }); k.play('whoosh', 8.2, { dur: 0.7, up: false, gain: 0.6 }); k.play('paper', 8.3, { dur: 0.5 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('chime', 10.0, { note: 'E6' }); k.play('swell', 10.0, { dur: 1.6, chord: ['C4', 'G4', 'E5'] });
      k.play('chime', 11.3, { note: 'C6' });
    },
  };
  MS.register(style);
})();
