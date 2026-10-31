// Botanical Plate (Illustration). A hand-coloured copperplate natural-history plate: swelling engraved lines,
// hatching that follows each form (denser on the shadow side), loose transparent watercolour laid a beat after the
// print and never quite on the line, numbered figures, Latin italic captions, foxed rag paper with a pressed plate mark.
(function () {
  const C = { paper: '#efe5cc', ink: '#2a2520', sepia: '#5b4a36', rose: '#c9707a', leaf: '#7f9a62', sky: '#8fb0b8', ochre: '#d6a957', red: '#b8432f', copper: '#b07a4a' };
  const SERIF = 'Libre Baskerville', ITAL = 'Cormorant Garamond';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  function sheet(W, H) {
    return K.cached(`bot-sheet:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(808);
      x.drawImage(K.paperTex(W, H, C.paper, 55, 0.055, false), 0, 0);
      // foxing: rust freckles and a couple of tide-mark blooms
      for (let i = 0; i < 180; i++) { const cx = r.range(0, W), cy = r.range(0, H), rr = r.range(1, 5) * s * (r() < 0.08 ? 4 : 1);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(150,95,45,0.32)'); g.addColorStop(1, 'rgba(150,95,45,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      for (let i = 0; i < 3; i++) { const cx = r.range(0, W), cy = r.range(0, H), rr = r.range(80, 200) * s; const tg = x.createRadialGradient(cx, cy, rr * 0.8, cx, cy, rr); tg.addColorStop(0, 'rgba(160,120,70,0)'); tg.addColorStop(0.92, 'rgba(160,120,70,0.03)'); tg.addColorStop(1, 'rgba(160,120,70,0)'); x.fillStyle = tg; x.beginPath(); x.arc(cx, cy, rr, 0, 7); x.fill(); }
      const eg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.hypot(W, H) * 0.6);
      eg.addColorStop(0, 'rgba(140,100,50,0)'); eg.addColorStop(1, 'rgba(140,100,50,0.22)'); x.fillStyle = eg; x.fillRect(0, 0, W, H);
      // the plate mark: the copper plate pressed the paper smooth inside, leaving a bevelled ridge
      const m = 26 * s, pw = W - 2 * m, ph = H - 2 * m;
      x.fillStyle = 'rgba(255,252,240,0.18)'; x.fillRect(m, m, pw, ph);
      x.strokeStyle = 'rgba(255,255,255,0.55)'; x.lineWidth = 2 * s; x.strokeRect(m + 1.5 * s, m + 1.5 * s, pw, ph);
      x.strokeStyle = 'rgba(90,65,35,0.35)'; x.lineWidth = 1.5 * s; x.strokeRect(m, m, pw, ph);
      // engraved double rule border
      x.strokeStyle = C.ink; x.lineWidth = 1.6 * s; x.strokeRect(m + 14 * s, m + 14 * s, pw - 28 * s, ph - 28 * s);
      x.lineWidth = 0.8 * s; x.strokeRect(m + 19 * s, m + 19 * s, pw - 38 * s, ph - 38 * s);
      return c;
    });
  }

  // a tapered engraved line: thin entry and exit, swelling in the middle (the burin's cut)
  function cut(ctx, a, b, w, bend = 0) {
    const mx = (a[0] + b[0]) / 2 - (b[1] - a[1]) * bend, my = (a[1] + b[1]) / 2 + (b[0] - a[0]) * bend;
    const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1, nx = -dy / l * w / 2, ny = dx / l * w / 2;
    ctx.moveTo(a[0], a[1]); ctx.quadraticCurveTo(mx + nx, my + ny, b[0], b[1]); ctx.quadraticCurveTo(mx - nx, my - ny, a[0], a[1]);
  }
  // hatch a shape: parallel curved cuts at angle `ang`, plus cross-hatching on the shadow side (o.shade = [dx, dy])
  function hatch(ctx, build, bx, by, bw, bh, p, o = {}) {
    if (p <= 0) return; const s = sOf(ctx), sp = (o.spacing || 5.5) * s, ang = o.ang ?? 0.7, c = Math.cos(ang), sn = Math.sin(ang);
    const cx = bx + bw / 2, cy = by + bh / 2, R = Math.hypot(bw, bh) / 2 + 4;
    ctx.save(); build(); ctx.clip(); ctx.fillStyle = o.color || C.ink;
    const n = Math.floor((2 * R) / sp), shown = Math.floor(n * K.clamp(p));
    ctx.beginPath();
    for (let i = 0; i < shown; i++) { const d = -R + i * sp, ox = cx - sn * d, oy = cy + c * d; cut(ctx, [ox - c * R, oy - sn * R], [ox + c * R, oy + sn * R], (o.w || 1.1) * s, o.bend ?? 0.08); }
    ctx.fill();
    if (o.shade && p > 0.5) { // shadow side: a second, denser cross-hatch clipped to a half-plane
      ctx.beginPath(); const [dx, dy] = o.shade; ctx.rect(cx + dx * bw * 0.05 - (dx < 0 ? R * 2 : 0), by - R, R * 2, bh + R * 2); ctx.clip();
      const a2 = ang + 1.2, c2 = Math.cos(a2), s2 = Math.sin(a2), sh = Math.floor(n * K.clamp((p - 0.5) * 2) * 1.3); ctx.beginPath();
      for (let i = 0; i < sh; i++) { const d = -R + i * sp * 0.75, ox = cx - s2 * d, oy = cy + c2 * d; cut(ctx, [ox - c2 * R, oy - s2 * R], [ox + c2 * R, oy + s2 * R], 0.9 * s, 0.05); }
      ctx.fill();
    }
    ctx.restore();
  }
  // transparent watercolour, laid loosely (a little off register), with a darker pooled edge
  function wash(ctx, build, col, p, o = {}) {
    if (p <= 0) return; const s = sOf(ctx);
    ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.translate((o.dx ?? 3) * s, (o.dy ?? -2) * s);
    ctx.globalAlpha = 0.55 * K.clamp(p); build(); ctx.fillStyle = col; ctx.fill();
    ctx.globalAlpha = 0.3 * K.clamp(p); ctx.lineWidth = 3 * s; ctx.strokeStyle = col; ctx.stroke();
    ctx.restore();
  }
  function engraveLine(ctx, pts, p, w, col) {
    const s = sOf(ctx), q = K.trim(pts, K.clamp(p)); if (q.length < 2) return null;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = col || C.ink;
    ctx.lineWidth = w * 0.55 * s; K.poly(ctx, q); ctx.stroke();
    const mid = q.slice(Math.floor(q.length * 0.2), Math.ceil(q.length * 0.8)); if (mid.length > 1) { ctx.lineWidth = w * s; K.poly(ctx, mid); ctx.stroke(); }
    ctx.restore(); return q[q.length - 1];
  }

  // ---- specimens ----
  function petal(ctx, cx, cy, a, L, Wd) { ctx.beginPath(); const ex = cx + Math.cos(a) * L, ey = cy + Math.sin(a) * L, px = -Math.sin(a) * Wd, py = Math.cos(a) * Wd;
    ctx.moveTo(cx, cy); ctx.bezierCurveTo(cx + Math.cos(a) * L * 0.3 + px, cy + Math.sin(a) * L * 0.3 + py, ex + px * 0.6, ey + py * 0.6, ex, ey);
    ctx.bezierCurveTo(ex - px * 0.6, ey - py * 0.6, cx + Math.cos(a) * L * 0.3 - px, cy + Math.sin(a) * L * 0.3 - py, cx, cy); ctx.closePath(); }
  function flower(ctx, cx, cy, R, p, t) {
    const s = sOf(ctx), sway = Math.sin(t * 1.3) * 0.03;
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(sway); ctx.translate(-cx, -cy);
    const lp = K.clamp(p / 0.5), hp = K.clamp((p - 0.25) / 0.5), wp = K.clamp((p - 0.6) / 0.4);
    for (let i = 0; i < 5; i++) {
      const a = -Math.PI / 2 + (i / 5) * Math.PI * 2 + 0.3, build = () => petal(ctx, cx, cy, a, R, R * 0.42);
      wash(ctx, build, C.rose, wp, { dx: 4, dy: -3 });
      hatch(ctx, build, cx - R, cy - R, R * 2, R * 2, hp, { ang: a + 0.3, spacing: 4.5, shade: [Math.cos(a + 1) > 0 ? 1 : -1, 0], w: 1.15, bend: 0.14 });
      ctx.save(); build(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8 * s; ctx.globalAlpha = lp; ctx.stroke(); ctx.restore();
      // the vein down the petal's spine
      engraveLine(ctx, [[cx, cy], [cx + Math.cos(a) * R * 0.85, cy + Math.sin(a) * R * 0.85]], lp, 1.6);
    }
    const disc = () => { ctx.beginPath(); ctx.arc(cx, cy, R * 0.24, 0, 7); };
    wash(ctx, disc, C.ochre, wp); hatch(ctx, disc, cx - R * 0.3, cy - R * 0.3, R * 0.6, R * 0.6, hp, { ang: 0.2, spacing: 3.5 });
    ctx.save(); disc(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8 * s; ctx.globalAlpha = lp; ctx.stroke(); ctx.restore();
    // stamens
    for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.28; engraveLine(ctx, [[cx, cy], [cx + Math.cos(a) * R * 0.55, cy + Math.sin(a) * R * 0.55]], hp, 1.2); if (hp > 0.9) { ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(cx + Math.cos(a) * R * 0.58, cy + Math.sin(a) * R * 0.58, 3 * s, 0, 7); ctx.fill(); } }
    ctx.restore();
  }
  function seedPod(ctx, cx, cy, rx, ry, p) {
    const s = sOf(ctx), lp = K.clamp(p / 0.5), hp = K.clamp((p - 0.25) / 0.5), wp = K.clamp((p - 0.6) / 0.4);
    const pod = () => { ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, -0.25, 0, 7); };
    wash(ctx, pod, C.sky, wp); hatch(ctx, pod, cx - rx, cy - ry, rx * 2, ry * 2, hp, { ang: -0.25 + Math.PI / 2, spacing: 5, shade: [1, 0], bend: 0.18 });
    engraveLine(ctx, K.circlePts(cx, cy, rx, ry, 80, -Math.PI / 2).map(([x, y]) => { const dx = x - cx, dy = y - cy, c = Math.cos(-0.25), sn = Math.sin(-0.25); return [cx + dx * c - dy * sn, cy + dx * sn + dy * c]; }), lp, 2.6);
    // the play mark, engraved and washed vermilion
    const tri = () => { ctx.beginPath(); ctx.moveTo(cx - rx * 0.22, cy - ry * 0.35); ctx.lineTo(cx - rx * 0.22, cy + ry * 0.35); ctx.lineTo(cx + rx * 0.32, cy); ctx.closePath(); };
    if (hp > 0) { ctx.save(); ctx.globalAlpha = hp; tri(); ctx.fillStyle = C.paper; ctx.fill(); ctx.restore(); wash(ctx, tri, C.red, wp, { dx: 2, dy: 2 }); ctx.save(); ctx.globalAlpha = hp; tri(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * s; ctx.stroke(); ctx.restore(); }
    // stalk
    engraveLine(ctx, [[cx - rx * 0.9, cy + ry * 0.3], [cx - rx * 1.25, cy + ry * 0.8], [cx - rx * 1.35, cy + ry * 1.3]], lp, 2.2);
  }
  function leaf(ctx, x, y, a, L, p, flip) {
    const s = sOf(ctx), build = () => petal(ctx, x, y, a, L, L * 0.28);
    wash(ctx, build, C.leaf, K.clamp((p - 0.5) * 2));
    hatch(ctx, build, x - L, y - L, L * 2, L * 2, K.clamp(p * 1.4), { ang: a + (flip ? -1 : 1), spacing: 4, w: 0.9 });
    ctx.save(); build(); ctx.globalAlpha = K.clamp(p * 2); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6 * s; ctx.stroke(); ctx.restore();
    engraveLine(ctx, [[x, y], [x + Math.cos(a) * L * 0.92, y + Math.sin(a) * L * 0.92]], K.clamp(p * 2), 1.5);
  }

  const style = {
    id: 'botanical-plate', name: 'Botanical Plate', family: 'Illustration',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;0,600;1,500;1,600&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=block',
      specs: ['italic 600 48px "Cormorant Garamond"', '600 34px "Cormorant Garamond"', '400 30px "Libre Baskerville"', 'italic 400 48px "Libre Baskerville"', '700 40px "Libre Baskerville"'] }],
    palette: { bg: C.paper, ink: C.ink, rose: C.rose, leaf: C.leaf, sky: C.sky, ochre: C.ochre, accent: C.red },
    sfx: { draw: 'pen', land: 'pluck', emphasis: 'chime', transition: 'whoosh', bed: 'room' },
    hatch, wash, flower, seedPod, leaf, engraveLine,

    background(ctx, W, H, t) { ctx.drawImage(sheet(W, H), 0, 0); },
    finish(ctx, W, H, t) {
      K.grain(ctx, W, H, t, 0.04, 12, 'soft-light');
      K.vignette(ctx, W, H, 0.1, '#5a3e1e');
    },

    // engraved roman caption, letters cut in left to right
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 48) * s;
      ctx.save(); ctx.font = K.font(size, SERIF, 400, o.italic === false ? '' : 'italic'); ctx.textAlign = o.align || 'left';
      const w = ctx.measureText(text).width, n = Math.ceil(text.length * K.clamp(p));
      ctx.fillStyle = o.color || C.ink; ctx.fillText(text.slice(0, n), o.align === 'center' ? x - w / 2 + ctx.measureText(text.slice(0, n)).width / 2 : x, y);
      ctx.restore(); return { w, h: size };
    },
    // Latin-style italic caption with an optional figure number ("2.") before it
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 34) * s;
      ctx.save(); ctx.globalAlpha = K.clamp(p * 1.6); ctx.font = K.font(size, ITAL, 600, 'italic'); ctx.textAlign = o.align || 'left'; ctx.fillStyle = o.color || C.ink;
      const n = Math.ceil(text.length * K.clamp(p * 1.3)); ctx.fillText(text.slice(0, n), x, y);
      const w = ctx.measureText(text).width; ctx.restore(); return { w, h: size };
    },

    // fletched engraved arrow: swelling shaft, feather barbs at the tail, a cut head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.08, 36), end = engraveLine(ctx, pts, K.clamp(p / 0.8), 2.2, o.color);
      if (!end) return null;
      ctx.save(); ctx.strokeStyle = o.color || C.ink; ctx.lineWidth = 1.1 * s; ctx.lineCap = 'round';
      const a0 = pts[0], a1 = pts[3], ta = Math.atan2(a1[1] - a0[1], a1[0] - a0[0]);
      for (let i = 0; i < 4; i++) { const bx = a0[0] + Math.cos(ta) * (4 + i * 5) * s, by = a0[1] + Math.sin(ta) * (4 + i * 5) * s;
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - Math.cos(ta + sg * 0.7) * 9 * s, by - Math.sin(ta + sg * 0.7) * 9 * s); ctx.stroke(); } }
      if (p > 0.8) { const hp = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 15 * s * hp;
        ctx.fillStyle = o.color || C.ink; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang - 0.38) * L, b[1] - Math.sin(ang - 0.38) * L); ctx.lineTo(b[0] - Math.cos(ang) * L * 0.6, b[1] - Math.sin(ang) * L * 0.6); ctx.lineTo(b[0] - Math.cos(ang + 0.38) * L, b[1] - Math.sin(ang + 0.38) * L); ctx.closePath(); ctx.fill(); }
      ctx.restore(); return end;
    },

    // an engraved specimen frame: ruled border with corner ticks, hatched shadow along two sides, tinted ground
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), rect = () => { ctx.beginPath(); ctx.rect(x, y, w, h); };
      wash(ctx, rect, o.tint || C.sky, K.clamp((p - 0.6) / 0.4), { dx: 4, dy: 3 });
      engraveLine(ctx, K.rectPts(x, y, w, h), K.clamp(p / 0.5), 2);
      hatch(ctx, () => { ctx.beginPath(); ctx.rect(x + w, y + 6 * s, 8 * s, h); ctx.rect(x + 6 * s, y + h, w, 8 * s); }, x, y, w + 10 * s, h + 10 * s, K.clamp((p - 0.3) / 0.5), { ang: 0.8, spacing: 3 });
    },

    // an engraved cartouche: oval frame, scrolled ends, the figure cut in roman numerals
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 100) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, SERIF, 700); ctx.textAlign = 'center';
      const w = ctx.measureText('0,000,000').width + 90 * s, h = size * 1.45, cy = y - size * 0.34;
      const ov = () => { ctx.beginPath(); ctx.ellipse(x, cy, w / 2, h / 2, 0, 0, 7); };
      wash(ctx, ov, C.ochre, 0.7, { dx: 5, dy: 4 });
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.4 * s; ov(); ctx.stroke(); ctx.lineWidth = 1 * s; ctx.beginPath(); ctx.ellipse(x, cy, w / 2 - 9 * s, h / 2 - 9 * s, 0, 0, 7); ctx.stroke();
      for (const sg of [-1, 1]) { ctx.lineWidth = 1.8 * s; ctx.beginPath(); ctx.arc(x + sg * (w / 2 + 16 * s), cy, 14 * s, 0, 7); ctx.stroke(); ctx.beginPath(); ctx.arc(x + sg * (w / 2 + 16 * s), cy, 6 * s, 0, 7); ctx.stroke(); }
      ctx.fillStyle = C.ink; ctx.fillText(txt, x, y);
      ctx.restore(); return { w, h };
    },

    // the colourist's red wash ringing the moment: a loose, uneven watercolour loop that blooms in
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return; const s = sOf(ctx), pts = K.wobble(K.circlePts(x, y, r * 1.25, r * (o.ry || (ctx.canvas.height > ctx.canvas.width ? 0.7 : 0.56)), 90, -2.4, Math.PI * 2.1), 6 * s, o.seed || 4, 0.02), q = K.trim(pts, K.clamp(p / 0.8));
      if (q.length < 2) return;
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.strokeStyle = o.color || C.red;
      for (const [wd, a] of [[22, 0.18], [12, 0.3], [5, 0.35]]) { ctx.globalAlpha = a; ctx.lineWidth = wd * s; K.poly(ctx, q); ctx.stroke(); }
      ctx.restore();
    },

    // the press roller: a fresh sheet is drawn across under the roller, then the roller travels back pulling the new print
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), rw = 70 * s, sheetC = sheet(W, H);
      const x = p < 0.5 ? K.lerp(-rw, W + rw, K.ease.inOut(p * 2)) : K.lerp(W + rw, -rw, K.ease.inOut((p - 0.5) * 2));
      ctx.save();
      if (p < 0.5) { ctx.beginPath(); ctx.rect(0, 0, Math.max(0, x), H); ctx.clip(); ctx.drawImage(sheetC, 0, 0); }
      else { ctx.beginPath(); ctx.rect(0, 0, Math.max(0, x), H); ctx.clip(); ctx.drawImage(sheetC, 0, 0); }
      ctx.restore();
      // the roller: a steel cylinder seen end-on as a vertical band with highlights
      const g = ctx.createLinearGradient(x - rw / 2, 0, x + rw / 2, 0);
      g.addColorStop(0, '#2b2724'); g.addColorStop(0.3, '#8d867c'); g.addColorStop(0.45, '#e2ddd2'); g.addColorStop(0.6, '#7d766d'); g.addColorStop(1, '#1f1c1a');
      ctx.fillStyle = 'rgba(30,20,10,0.3)'; ctx.fillRect(x + rw / 2, 0, 24 * s, H);
      ctx.fillStyle = g; ctx.fillRect(x - rw / 2, 0, rw, H);
    },
  };

  // ---------- the shared demo: two plates from a naturalist's folio ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 150 * s], pod: [220 * s, 370 * s, 105 * s, 70 * s], flower: [600 * s, 360 * s, 110 * s],
      chips: PLATFORMS.map((n, i) => [930 * s, (196 + i * 66) * s]) };
    return { s, P: true, title: [W / 2, H * 0.1], pod: [W * 0.3, H * 0.27, W * 0.17, W * 0.115], flower: [W * 0.62, H * 0.375, W * 0.17],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.57 + Math.floor(i / 2) * 0.09)]) };
  }
  function header(ctx, W, H, s, plate) {
    ctx.save(); ctx.font = K.font(28 * s, SERIF, 400); ctx.fillStyle = C.ink; ctx.textBaseline = 'alphabetic';
    const P = H > W, y = P ? 86 * s : 74 * s; ctx.textAlign = 'left'; ctx.fillText('Vol. I.', 66 * s, y);
    ctx.textAlign = 'right'; ctx.fillText('Pl. ' + plate, W - 66 * s, y);
    ctx.textAlign = 'center'; ctx.font = K.font(28 * s, SERIF, 400); ctx.fillText(P ? 'FLORA DIGITALIS' : 'F L O R A   D I G I T A L I S', W / 2, y);
    ctx.restore();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const scene2 = t >= 8.25;
      header(ctx, W, H, s, scene2 ? 'II.' : 'I.');
      if (!scene2) {
        if (P) { style.title(ctx, 'One video.', W / 2, H * 0.115, K.beat(t, 0.1, 0.7, 'lin'), { size: 56, align: 'center' });
          style.title(ctx, 'Every platform.', W / 2, H * 0.16, K.beat(t, 0.8, 0.9, 'lin'), { size: 56, align: 'center' }); }
        else style.title(ctx, 'One video. Every platform.', W / 2, Lo.title[1], K.beat(t, 0.1, 1.6, 'lin'), { size: 52, align: 'center' });
        // Fig. 1: the seed pod
        const [px, py, prx, pry] = Lo.pod; seedPod(ctx, px, py, prx, pry, K.beat(t, 2.0, 1.4, 'lin'));
        style.label(ctx, '1. your video', px - prx * 0.6, py + pry + 62 * s, K.beat(t, 3.0, 0.6, 'lin'), {});
        // Fig. 2: the bloom (stem drawn first, from below)
        const [fx, fy, fr] = Lo.flower, stemBot = P ? [fx - 30 * s, fy + fr * 1.1] : [fx - 20 * s, fy + 270 * s];
        engraveLine(ctx, K.arcPts([fx, fy], stemBot, 0.12, 30), K.beat(t, 3.8, 0.6, 'lin'), 3);
        if (!P) { leaf(ctx, fx - 8 * s, fy + 170 * s, Math.PI * 0.85, 90 * s, K.beat(t, 4.1, 0.8, 'lin'), false); leaf(ctx, fx - 14 * s, fy + 220 * s, 0.25, 80 * s, K.beat(t, 4.3, 0.8, 'lin'), true); }
        flower(ctx, fx, fy, fr, K.beat(t, 3.9, 1.3, 'lin'), t);
        style.label(ctx, '2. Creator OS', P ? fx - fr * 0.95 : fx - 70 * s, P ? fy + fr * 1.0 : fy - fr - 30 * s, K.beat(t, 4.6, 0.5, 'lin'), { size: 42, align: P ? 'right' : 'left' });
        const ap = K.beat(t, 3.3, 0.7, 'lin');
        style.arrow(ctx, P ? [px + prx * 0.6, py + pry * 0.9] : [px + prx + 18 * s, py - 6 * s], P ? [fx - fr * 1.0, fy - fr * 0.25] : [fx - fr - 20 * s, fy], ap, { bend: P ? 0.18 : -0.12 });
        // the fan-out: in portrait the stem is the trunk and each platform is a leaf node off it
        if (P) {
          const tp = K.beat(t, 4.95, 0.5, 'lin'), y0 = fy + fr * 1.1, yl = Lo.chips[6][1] + 10 * s;
          engraveLine(ctx, [[fx - 30 * s, y0], [W / 2, y0 + (Lo.chips[0][1] - y0) * 0.5], [W / 2, yl]], tp, 3);
        }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.35, 'lin');
          if (P) { leaf(ctx, W / 2, cy - 14 * s, left ? Math.PI * 0.94 : -0.06 * Math.PI, 80 * s, p, !left); }
          else style.arrow(ctx, [fx + fr + 14 * s, fy], [cx - 46 * s, cy - 10 * s], p, { bend: (i - 3) * 0.05 });
          const lx = P ? (left ? W * 0.44 - 64 * s : W * 0.56 + 64 * s) : cx;
          style.label(ctx, (i + 3) + '. ' + name, lx, cy, K.beat(t, t0 + 0.25, 0.4, 'lin'), { align: P ? (left ? 'right' : 'left') : 'left', size: P ? 36 : 34 });
        });
        // the engraver's caption line under the figures
        style.label(ctx, P ? 'Semen videi, & Flos creatoris.' : 'Semen videi, & Flos creatoris, cum foliis septem.', W / 2, P ? H * 0.935 : 652 * s, K.beat(t, 6.0, 1.2, 'lin'), { align: 'center', size: 30 });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        // plate II: the bloom at the head of the sheet, the yield in a cartouche, the colourist's red ring
        const fx = W / 2, fy = P ? H * 0.22 : 190 * s, fr = P ? W * 0.13 : 78 * s;
        flower(ctx, fx, fy, fr, 1, t);
        style.label(ctx, 'Creator OS', fx + fr * 1.15, fy + 12 * s, 1, { size: 38 });
        const cy = P ? H * 0.47 : 470 * s;
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t > 8.5) style.counter(ctx, Math.round(v / 1000) * 1000, W / 2, cy, 1, { size: P ? 78 : 84 });
        style.label(ctx, 'views', W / 2, cy + (P ? 100 : 94) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 40 });
        style.emphasis(ctx, W / 2, cy - 30 * s, (P ? 232 : 235) * s, K.beat(t, 10.0, 0.6, 'lin'), {});
        const tp = K.beat(t, 10.5, 1.0, 'lin');
        if (P) { style.title(ctx, 'Post once.', W / 2, H * 0.72, K.clamp(tp * 2), { size: 60, align: 'center' });
          style.title(ctx, 'Reach everywhere.', W / 2, H * 0.72 + 80 * s, K.clamp(tp * 2 - 1), { size: 60, align: 'center' }); }
        else style.title(ctx, 'Post once. Reach everywhere.', W / 2, 650 * s, tp, { size: 46, align: 'center' });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      k.play('scribble', 0.1, { medium: 'pen', dur: 1.6, gain: 0.6 });
      k.play('scribble', 2.0, { medium: 'pencil', dur: 1.4 }); k.play('scribble', 2.9, { medium: 'brush', dur: 0.5, gain: 0.8 }); k.play('pluck', 3.05, { note: 'G4' });
      k.play('scribble', 3.3, { medium: 'pen', dur: 0.7 }); k.play('scribble', 3.8, { medium: 'pencil', dur: 1.4 }); k.play('scribble', 4.7, { medium: 'brush', dur: 0.5, gain: 0.8 });
      k.play('pluck', 4.65, { note: 'C5' });
      const notes = ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'];
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.32, gain: 0.7 }); k.play('pluck', 5.3 + i * 0.4, { note: notes[i], gain: 0.75 }); }
      k.play('whoosh', 7.6, { dur: 0.65 }); k.play('thud', 8.0, { gain: 0.5 }); k.play('whoosh', 8.25, { dur: 0.6, up: false }); k.play('paper', 8.7, { dur: 0.4 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('scribble', 10.0, { medium: 'brush', dur: 0.6 }); k.play('chime', 10.1, { note: 'G5' });
      k.play('scribble', 10.5, { medium: 'pen', dur: 1.0, gain: 0.6 }); k.play('chime', 11.3, { note: 'C6' });
    },
  };
  MS.register(style);
})();
