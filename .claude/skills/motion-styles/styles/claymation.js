// Claymation Set (Paper & Craft). Plasticine stop-motion: chunky hand-squished slabs and letters with soft waxy
// shading, thumbprints and tool marks, lumpy silhouettes that boil on twos, rolled-coil arrows, a clay buddy on a
// sculpted table, a shallow depth-of-field wall, squash-and-stretch pops and a rolling-pin slab as the scene change.
(function () {
  const C = { wall: '#4d8a96', table: '#c47447', yellow: '#f2c14e', red: '#d9503f', teal: '#3fae9a', blue: '#4f74c8', pink: '#e98aa8', green: '#7cbf5a', cream: '#f3e6cc', ink: '#2a2420', orange: '#ec8a3c' };
  const LETTERS = [C.yellow, C.pink, C.teal, C.orange, C.blue, C.green, C.red];
  const FONT = 'Fredoka';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  let NOW = 0;
  const boil = () => Math.floor(NOW * 12);          // on twos at 24 fps
  const NZ = K.noise(321);

  // lumpy rounded-rect outline, re-squished every boil frame
  function lumpRect(x, y, w, h, r, seed, amp) {
    const pts = [], n = 64, b = boil(), per = 2 * (w + h);
    for (let i = 0; i < n; i++) {
      const u = (i / n) * per; let px, py, nx, ny;
      if (u < w) { px = x + u; py = y; nx = 0; ny = -1; } else if (u < w + h) { px = x + w; py = y + u - w; nx = 1; ny = 0; } else if (u < 2 * w + h) { px = x + w - (u - w - h); py = y + h; nx = 0; ny = 1; } else { px = x; py = y + h - (u - 2 * w - h); nx = -1; ny = 0; }
      // round the corners by pulling points toward the inset rect
      const cx = K.clamp(px, x + r, x + w - r), cy = K.clamp(py, y + r, y + h - r), dx = px - cx, dy = py - cy, d = Math.hypot(dx, dy);
      if (d > r) { px = cx + (dx / d) * r; py = cy + (dy / d) * r; }
      const j = NZ.n3(i * 0.35 + seed, seed * 0.7, b * 0.37) * amp + NZ.n3(i * 1.3, seed, b * 0.5) * amp * 0.25;
      pts.push([px + (nx || dx / (d || 1)) * j, py + (ny || dy / (d || 1)) * j]);
    }
    return pts;
  }
  // smooth closed path through points (quadratic midpoints)
  function smoothPath(ctx, pts) { ctx.beginPath(); const n = pts.length; ctx.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2); for (let i = 0; i < n; i++) { const a = pts[i], b = pts[(i + 1) % n]; ctx.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); } ctx.closePath(); }
  // a plasticine lump: contact shadow, base, waxy top-left light, bottom-right core shadow, rim, thumbprints, spec
  function clayShape(ctx, pts, col, bx, by, bw, bh, o = {}) {
    const s = sOf(ctx);
    ctx.save(); ctx.shadowColor = 'rgba(30,20,10,0.45)'; ctx.shadowBlur = 16 * s; ctx.shadowOffsetX = 6 * s; ctx.shadowOffsetY = 10 * s;
    ctx.fillStyle = col; smoothPath(ctx, pts); ctx.fill(); ctx.restore();
    ctx.save(); smoothPath(ctx, pts); ctx.clip();
    const g = ctx.createLinearGradient(bx, by, bx + bw * 0.5, by + bh);
    g.addColorStop(0, K.rgba(K.mix(col, '#ffffff', 0.32), 0.9)); g.addColorStop(0.45, K.rgba(col, 0)); g.addColorStop(1, K.rgba(K.mix(col, '#1a0c04', 0.4), 0.85));
    ctx.fillStyle = g; ctx.fillRect(bx - 20, by - 20, bw + 40, bh + 40);
    // inner rim darkening (soft) so the edge rolls over like a pressed lump
    ctx.lineWidth = 14 * s; ctx.strokeStyle = K.rgba(K.mix(col, '#1a0c04', 0.45), 0.35); ctx.filter = `blur(${5 * s}px)`; smoothPath(ctx, pts); ctx.stroke(); ctx.filter = 'none';
    // thumbprints: a few concentric partial ridges, plus a tool-mark scratch
    const r = K.rng(o.seed || 1);
    for (let k = 0; k < (o.prints ?? 2); k++) {
      const tx = bx + bw * (0.2 + r() * 0.6), ty = by + bh * (0.25 + r() * 0.5), rot = r() * 3;
      ctx.save(); ctx.translate(tx, ty); ctx.rotate(rot); ctx.lineWidth = 1.3 * s;
      for (let j = 1; j < 6; j++) { ctx.strokeStyle = K.rgba(j % 2 ? '#ffffff' : '#000000', 0.07); ctx.beginPath(); ctx.ellipse(0, 0, j * 4.2 * s, j * 3 * s, 0, 0.3, Math.PI * 1.6); ctx.stroke(); }
      ctx.restore();
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 2 * s; ctx.beginPath(); const sx = bx + bw * r(), sy = by + bh * (0.6 + r() * 0.3); ctx.moveTo(sx, sy); ctx.lineTo(sx + bw * 0.15, sy - 4 * s); ctx.stroke();
    // waxy specular sheen
    const sp = ctx.createRadialGradient(bx + bw * 0.25, by + bh * 0.22, 0, bx + bw * 0.25, by + bh * 0.22, Math.max(bw, bh) * 0.35);
    sp.addColorStop(0, 'rgba(255,255,255,0.28)'); sp.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sp; ctx.fillRect(bx, by, bw, bh);
    ctx.restore();
  }
  // squash and stretch pop: returns [sx, sy] for progress k
  const squash = (k) => { if (k >= 1) return [1, 1]; const e = K.ease.back(k), w = Math.sin(k * Math.PI) * 0.18; return [e * (1 + w), e * (1 - w * 0.8)]; };
  // pressed clay letters, each a different colour, bevelled, nudged a little every boil frame
  function clayText(ctx, text, x, y, size, p, o = {}) {
    const s = sOf(ctx), b = boil();
    ctx.save(); ctx.font = K.font(size, FONT, 700); ctx.textBaseline = 'alphabetic';
    const ws = [...text].map((c) => ctx.measureText(c).width), track = size * 0.03, total = ws.reduce((a, c) => a + c + track, -track);
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    const n = text.length, d = Math.max(1.5, size * 0.035);
    [...text].forEach((ch, i) => {
      const k = K.clamp(p * (n + 3) - i) / 1, kk = K.clamp(k / 3);
      if (ch !== ' ' && kk > 0) {
        const r = K.rng(i * 7 + (o.seed || 1) * 131 + b * 3), col = o.color || LETTERS[(i + (o.seed || 0)) % LETTERS.length], [sx, sy] = squash(kk);
        ctx.save(); ctx.translate(cx + ws[i] / 2, y); ctx.rotate((r() - 0.5) * 0.08 + (o.tilt || 0)); ctx.scale(sx, sy); ctx.translate(-ws[i] / 2, (r() - 0.5) * size * 0.03);
        ctx.shadowColor = 'rgba(25,15,8,0.5)'; ctx.shadowBlur = size * 0.12; ctx.shadowOffsetX = size * 0.04; ctx.shadowOffsetY = size * 0.07;
        ctx.fillStyle = K.rgba(K.mix(col, '#1a0c04', 0.5)); ctx.fillText(ch, d, d); ctx.shadowColor = 'transparent';
        ctx.fillStyle = K.rgba(K.mix(col, '#ffffff', 0.45)); ctx.fillText(ch, -d * 0.7, -d * 0.7);
        ctx.fillStyle = col; ctx.fillText(ch, 0, 0);
        ctx.globalAlpha = 0.18; ctx.fillStyle = '#ffffff'; ctx.save(); ctx.beginPath(); ctx.rect(0, -size, ws[i], size * 0.45); ctx.clip(); ctx.fillText(ch, 0, 0); ctx.restore();
        ctx.restore();
      }
      cx += ws[i] + track;
    });
    ctx.restore();
    return total;
  }
  // rolled coil along a path: shadow, body, highlight
  function coil(ctx, q, w, col, s) {
    if (q.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    const jit = q.map((p, i) => [p[0], p[1] + NZ.n3(i * 0.3, 1, boil() * 0.4) * 1.2 * s]);
    ctx.strokeStyle = 'rgba(25,15,8,0.35)'; ctx.lineWidth = w * 1.05; ctx.filter = `blur(${4 * s}px)`; ctx.translate(4 * s, 7 * s); K.poly(ctx, jit); ctx.stroke(); ctx.filter = 'none'; ctx.translate(-4 * s, -7 * s);
    ctx.strokeStyle = K.rgba(K.mix(col, '#1a0c04', 0.35)); ctx.lineWidth = w; ctx.translate(0, w * 0.12); K.poly(ctx, jit); ctx.stroke(); ctx.translate(0, -w * 0.12);
    ctx.strokeStyle = col; ctx.lineWidth = w * 0.82; K.poly(ctx, jit); ctx.stroke();
    ctx.strokeStyle = K.rgba(K.mix(col, '#ffffff', 0.5), 0.7); ctx.lineWidth = w * 0.22; ctx.translate(-w * 0.12, -w * 0.2); K.poly(ctx, jit); ctx.stroke();
    ctx.restore();
  }

  const style = {
    id: 'claymation', name: 'Claymation Set', family: 'Paper & Craft',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&display=block', specs: ['700 60px "Fredoka"', '600 32px "Fredoka"'] }],
    palette: { bg: C.wall, ink: C.ink, accent: C.red, ...C },
    sfx: { draw: null, land: 'pop', emphasis: 'thud', transition: 'whoosh', bed: 'room' },

    // sculpted clay wall (out of focus) and a lumpy clay table in front
    background(ctx, W, H, t) {
      const s = S(W, H), P = H > W, ty = H - (P ? 300 : 110) * s;
      const tex = K.cached(`clay-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(8);
        x.drawImage(K.paperTex(W, H, C.wall, 61, 0.1, false), 0, 0);
        // smears, thumb drags and knife marks on the wall, then defocus it
        for (let i = 0; i < 70; i++) { const px = r() * W, py = r() * ty, rr = (10 + r() * 40) * s; x.fillStyle = r() < 0.5 ? 'rgba(255,255,255,0.06)' : 'rgba(0,30,40,0.08)'; x.beginPath(); x.ellipse(px, py, rr * 1.6, rr * 0.7, r() * 3, 0, 7); x.fill(); }
        for (let i = 0; i < 30; i++) { x.strokeStyle = 'rgba(0,25,35,0.12)'; x.lineWidth = 2 * s; const px = r() * W, py = r() * ty; x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + 30 * s, py + 8 * s, px + 70 * s, py - 4 * s); x.stroke(); }
        const out = K.layer(W, H), o = out.getContext('2d'); o.filter = `blur(${5 * s}px)`; o.drawImage(c, 0, 0); o.filter = 'none';
        const lg = o.createLinearGradient(0, 0, 0, ty); lg.addColorStop(0, 'rgba(255,240,210,0.12)'); lg.addColorStop(1, 'rgba(0,20,30,0.18)'); o.fillStyle = lg; o.fillRect(0, 0, W, ty);
        // the table: lumpy top edge, a lighter lip, dents
        o.fillStyle = C.table; o.beginPath(); o.moveTo(0, H);
        for (let xx = 0; xx <= W + 10; xx += 20 * s) o.lineTo(xx, ty + Math.sin(xx * 0.02) * 4 * s + r() * 3 * s);
        o.lineTo(W, H); o.closePath(); o.fill();
        const tg = o.createLinearGradient(0, ty, 0, H); tg.addColorStop(0, 'rgba(255,220,180,0.35)'); tg.addColorStop(0.08, 'rgba(255,220,180,0)'); tg.addColorStop(1, 'rgba(60,20,5,0.35)'); o.fillStyle = tg; o.fillRect(0, ty - 6 * s, W, H - ty + 6 * s);
        for (let i = 0; i < 40; i++) { o.fillStyle = r() < 0.5 ? 'rgba(255,230,200,0.12)' : 'rgba(80,30,10,0.12)'; o.beginPath(); o.ellipse(r() * W, ty + r() * (H - ty), (6 + r() * 20) * s, (3 + r() * 6) * s, 0, 0, 7); o.fill(); }
        return out;
      });
      ctx.drawImage(tex, 0, 0);
    },

    finish(ctx, W, H, t) {
      // warm key light from the top left, cool fill, film grain at stop-motion cadence
      const g = ctx.createRadialGradient(W * 0.25, -H * 0.1, 0, W * 0.25, -H * 0.1, Math.hypot(W, H));
      g.addColorStop(0, 'rgba(255,225,170,0.16)'); g.addColorStop(1, 'rgba(255,225,170,0)');
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.3, '#10161a');
      K.grain(ctx, W, H, Math.floor(t * 12) / 12, 0.05, 12, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) { const s = sOf(ctx); return { w: clayText(ctx, text, x, y, (o.size || 64) * s, p, o), h: (o.size || 64) * s }; },
    label(ctx, text, x, y, p, o = {}) { const s = sOf(ctx); return { w: clayText(ctx, text, x, y, (o.size || 36) * s, p, { color: o.color || C.cream, ...o }), h: (o.size || 36) * s }; },

    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.15, 40), q = K.trim(pts, K.clamp(p / 0.85));
      if (q.length < 2) return null;
      const col = o.color || C.cream, w = (o.width || 13) * s;
      coil(ctx, q, w, col, s);
      if (p > 0.85) {
        const k = K.ease.back(K.clamp((p - 0.85) / 0.15)), b = pts[pts.length - 1], a = pts[pts.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = w * 2.1 * k;
        const tri = [[b[0] + Math.cos(ang) * L * 0.5, b[1] + Math.sin(ang) * L * 0.5], [b[0] - Math.cos(ang - 0.7) * L, b[1] - Math.sin(ang - 0.7) * L], [b[0] - Math.cos(ang + 0.7) * L, b[1] - Math.sin(ang + 0.7) * L]];
        const pts2 = []; for (let i = 0; i < 3; i++) { const A = tri[i], B = tri[(i + 1) % 3]; for (let j = 0; j < 4; j++) pts2.push([K.lerp(A[0], B[0], j / 4), K.lerp(A[1], B[1], j / 4)]); }
        clayShape(ctx, pts2, col, b[0] - L, b[1] - L, L * 2, L * 2, { prints: 0 });
      }
      return q[q.length - 1];
    },

    // a clay slab popped on with squash and stretch
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      const [sx, sy] = squash(k);
      ctx.save(); ctx.translate(x + w / 2, y + h); ctx.scale(sx, sy); ctx.translate(-(x + w / 2), -(y + h));
      clayShape(ctx, lumpRect(x, y, w, h, Math.min(w, h) * 0.22, o.seed || 3, 3.2 * s), o.color || C.yellow, x, y, w, h, { seed: o.seed });
      ctx.restore();
    },

    counter(ctx, value, x, y, p, o = {}) { const s = sOf(ctx), size = (o.size || 130) * s; return { w: clayText(ctx, K.fmt(value), x, y, size, 1, { align: o.align || 'center', seed: 3, color: o.color }), h: size }; },

    // a red clay ring slapped on around the moment (shake comes from the scene)
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      const [sx, sy] = squash(K.clamp(k * 1.4)), pts = K.circlePts(x, y, r * 1.1, r * (o.ry || 0.62), 80).map((pt, i) => [pt[0] + NZ.n3(i * 0.4, 7, boil() * 0.4) * 2 * s, pt[1] + NZ.n3(i * 0.4, 9, boil() * 0.4) * 2 * s]);
      ctx.save(); ctx.translate(x, y); ctx.scale(sx, sy); ctx.translate(-x, -y);
      coil(ctx, pts, 18 * s, o.color || C.red, s);
      ctx.restore();
    },

    // a slab of clay rolled across by a rolling pin; covered at 0.5, rolled off the other side after
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), first = p < 0.5, k = K.ease.inOut(first ? p / 0.5 : (p - 0.5) / 0.5), ex = K.lerp(-60 * s, W + 60 * s, k);
      const edge = []; for (let i = 0; i <= 24; i++) { const yy = (i / 24) * (H + 40) - 20; edge.push([ex + NZ.n2(i * 0.5, 3) * 18 * s, yy]); }
      ctx.save(); ctx.beginPath();
      if (first) { ctx.moveTo(-10, -20); edge.forEach((pt) => ctx.lineTo(pt[0], pt[1])); ctx.lineTo(-10, H + 20); }
      else { ctx.moveTo(W + 10, -20); edge.forEach((pt) => ctx.lineTo(pt[0], pt[1])); ctx.lineTo(W + 10, H + 20); }
      ctx.closePath(); ctx.fillStyle = o.color || C.orange; ctx.shadowColor = 'rgba(20,10,5,0.5)'; ctx.shadowBlur = 24 * s; ctx.fill(); ctx.shadowColor = 'transparent';
      ctx.clip();
      const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, 'rgba(255,240,220,0.25)'); g.addColorStop(1, 'rgba(60,20,0,0.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = 'rgba(80,30,5,0.12)'; ctx.lineWidth = 3 * s; for (let i = 0; i < 10; i++) { ctx.beginPath(); ctx.moveTo(0, (i + 0.5) * H / 10); ctx.bezierCurveTo(W * 0.3, (i + 0.3) * H / 10, W * 0.6, (i + 0.8) * H / 10, W, (i + 0.5) * H / 10); ctx.stroke(); }
      ctx.restore();
      // the wooden rolling pin riding the edge
      ctx.save(); const pg = ctx.createLinearGradient(ex - 26 * s, 0, ex + 26 * s, 0); pg.addColorStop(0, '#8a5a30'); pg.addColorStop(0.4, '#e2b07a'); pg.addColorStop(1, '#7a4a22');
      ctx.fillStyle = pg; ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 18 * s; ctx.shadowOffsetX = 8 * s; ctx.fillRect(ex - 26 * s, -10, 52 * s, H + 20); ctx.restore();
    },
  };

  // ---------- the shared demo: one clay set, a clay buddy presents ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 112 * s], video: [95 * s, 230 * s, 250 * s, 150 * s], node: [460 * s, 270 * s, 320 * s, 140 * s],
      chips: PL.map((_, i) => [915 * s, (205 + i * 62) * s]), top: [W / 2, 90 * s], counter: [W / 2, 360 * s], take: [W / 2, 528 * s], buddy: [105 * s, 660 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.195, W * 0.5, H * 0.1], node: [W * 0.15, H * 0.375, W * 0.7, H * 0.07],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.53 + Math.floor(i / 2) * 0.062)]), top: [W / 2, H * 0.12], counter: [W / 2, H * 0.36], take: [W / 2, H * 0.52], buddy: [W * 0.5, H * 0.93] };
  }
  // the clay buddy: a squishy potato with googly eyes that blinks, waves and jumps
  function buddy(ctx, x, y, s, t, jump) {
    const hop = jump * 40 * s, sq = 1 + 0.06 * Math.sin(t * 5) + (jump > 0 ? -0.1 * jump : 0);
    const w = 90 * s, h = 120 * s, bx = x - w / 2, by = y - h - hop;
    ctx.save(); ctx.translate(x, y - hop); ctx.scale(1 / sq, sq); ctx.translate(-x, -(y - hop));
    clayShape(ctx, lumpRect(bx, by, w, h, w * 0.45, 77, 2.5 * s), C.yellow, bx, by, w, h, { seed: 5 });
    // waving arm coil
    const wave = Math.sin(t * 6) * 0.5;
    coil(ctx, [[bx + w * 0.9, by + h * 0.5], [bx + w * 1.15, by + h * 0.3], [bx + w * 1.25 + wave * 10 * s, by + h * 0.05]], 14 * s, C.yellow, s);
    // googly eyes + blink
    const blink = (t % 2.7) < 0.12;
    for (const ex of [0.33, 0.68]) {
      const cx = bx + w * ex, cy = by + h * 0.32;
      ctx.fillStyle = '#fbf7ee'; ctx.beginPath(); ctx.ellipse(cx, cy, 12 * s, blink ? 2 * s : 14 * s, 0, 0, 7); ctx.fill();
      if (!blink) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx + 3 * s, cy + 2 * s, 6 * s, 0, 7); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx + 1 * s, cy - 1 * s, 2 * s, 0, 7); ctx.fill(); }
    }
    ctx.strokeStyle = '#7a3b1e'; ctx.lineWidth = 5 * s; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(bx + w * 0.5, by + h * 0.52, 16 * s, 0.25, Math.PI - 0.25); ctx.stroke();
    ctx.restore();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      NOW = t;
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      const shake = K.spring(t, 10.05, 9 * s, 7, 6);
      ctx.save(); ctx.translate(shake, shake * 0.4);
      style.background(ctx, W, H, t);
      buddy(ctx, Lo.buddy[0], Lo.buddy[1], s, t, scene2 ? Math.max(0, Math.sin(K.clamp((t - 10.05) / 0.5) * Math.PI)) : 0);
      if (!scene2) {
        if (P) { style.title(ctx, 'One video.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 0.8, 'lin'), { size: 64, align: 'center' }); style.title(ctx, 'Every platform.', Lo.title[0], Lo.title[1] + 92 * s, K.beat(t, 0.7, 1.0, 'lin'), { size: 64, align: 'center', seed: 3 }); }
        else style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.5, 'lin'), { size: 66, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video, vp = K.beat(t, 2.0, 0.6, 'lin');
        style.box(ctx, vx, vy, vw, vh, vp, { color: C.blue, seed: 21 });
        if (vp > 0.6) { const r = Math.min(vw, vh) * 0.25, cx = vx + vw / 2, cy = vy + vh / 2; const tri = [[cx - r * 0.6, cy - r], [cx + r, cy], [cx - r * 0.6, cy + r]], pts = []; for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) pts.push([K.lerp(tri[i][0], tri[(i + 1) % 3][0], j / 5), K.lerp(tri[i][1], tri[(i + 1) % 3][1], j / 5)]); clayShape(ctx, pts, C.cream, cx - r, cy - r, r * 2, r * 2, { prints: 1 }); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 54 * s, K.beat(t, 2.6, 0.5, 'lin'), { align: 'center', seed: 2, size: 40 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 80 * s], [nx + nw / 2, ny - 22 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - 26 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: P ? 0 : -0.15, color: C.cream });
        const np = K.beat(t, 4.0, 0.7, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, { color: C.red, seed: 41 });
        if (np > 0.5) clayText(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 20 * s, 54 * s, (np - 0.5) * 2, { align: 'center', color: C.cream, seed: 9 });
        if (P) style.arrow(ctx, [W / 2, ny + nh + 18 * s], [W / 2, Lo.chips[6][1] + 6 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0, width: 10 });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 18 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 12 * s] : [cx - 24 * s, cy - 12 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, width: 8, color: LETTERS[i] });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.2, 0.4, 'lin'), { size: P ? 36 : 40, align: P ? (left ? 'right' : 'left') : 'left', color: LETTERS[i], seed: i });
        });
        if (t > 7.4) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * 0.8, h2 = nh * 0.8;
        style.box(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, { color: C.red, seed: 41 });
        clayText(ctx, 'Creator OS', Lo.top[0], Lo.top[1] + 16 * s, 46 * s, 1, { align: 'center', color: C.cream, seed: 9 });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 104 : 124 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 66 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 40 });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 30 * s, (P ? 300 : 320) * s, K.beat(t, 10.0, 0.4, 'lin'), { ry: P ? 0.6 : 0.5 });
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1] + 60 * s, K.beat(t, 10.5, 0.6, 'lin'), { size: 60, align: 'center', seed: 1 }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 150 * s, K.beat(t, 10.8, 0.8, 'lin'), { size: 60, align: 'center', seed: 4 }); }
        else style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1] + 30 * s, K.beat(t, 10.5, 1.0, 'lin'), { size: 56, align: 'center', seed: 1 });
        if (t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      }
      ctx.restore();
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.3);
      for (let i = 0; i < 20; i++) k.play('pop', 0.2 + i * 0.07, { pitch: 0.5 + (i % 5) * 0.08, gain: 0.45 });
      k.play('thud', 2.0, { gain: 0.6 }); k.play('pop', 2.3, { pitch: 0.7 });
      for (let i = 0; i < 10; i++) k.play('pop', 2.65 + i * 0.05, { pitch: 0.6, gain: 0.35 });
      k.play('paper', 3.3, { dur: 0.6, gain: 0.6 }); k.play('pop', 3.95, { pitch: 0.55 }); k.play('thud', 4.0, { gain: 0.7 });
      for (let i = 0; i < 10; i++) k.play('pop', 4.4 + i * 0.05, { pitch: 0.65, gain: 0.35 });
      for (let i = 0; i < 7; i++) { k.play('paper', 5.0 + i * 0.4, { dur: 0.25, gain: 0.5 }); k.play('pop', 5.3 + i * 0.4, { pitch: 0.6 + i * 0.05 }); }
      k.play('whoosh', 7.4, { dur: 0.9 }); k.play('thud', 8.3, { gain: 0.5 }); k.play('whoosh', 8.3, { dur: 0.9, up: false });
      k.play('count', 8.6, { dur: 1.4 }); k.play('thud', 10.0); k.play('pop', 10.05, { pitch: 0.5 }); k.play('pop', 10.3, { pitch: 1.3 });
      for (let i = 0; i < 12; i++) k.play('pop', 10.5 + i * 0.06, { pitch: 0.55 + (i % 4) * 0.1, gain: 0.4 });
      k.play('chime', 11.4, { note: 'G5' });
    },
  };
  MS.register(style);
})();
