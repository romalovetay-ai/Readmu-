// Illuminated Manuscript (Illustration). A Book of Hours folio: mottled vellum with ruling and pricking,
// iron-gall textura with vermilion rubrics, raised burnished gold with a travelling glint, lapis / rose /
// malachite grounds edged in white-lead filigree, ivy rinceaux with gold bezants, a snail drollery in the margin.
(function () {
  const C = { vellum: '#efe1bf', ink: '#2b1d12', red: '#b3311d', lapis: '#24408f', rose: '#b9566d', green: '#2f7a4c',
    gold: '#c99a35', goldHi: '#f6dc8a', goldLo: '#7d5716', white: '#fbf4e0' };
  const TXT = 'Grenze Gotisch', FELL = 'IM Fell English';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // Raised burnished gold: ochre bole shadow, metallic gradient, a glint band that travels with t, dark rim.
  function gild(ctx, build, x0, y0, x1, y1, t, s) {
    ctx.save();
    build(); ctx.fillStyle = C.goldLo; ctx.translate(1.5 * s, 2 * s); ctx.fill(); ctx.translate(-1.5 * s, -2 * s);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, '#9c7124'); g.addColorStop(0.35, C.gold); g.addColorStop(0.55, C.goldHi); g.addColorStop(0.7, C.gold); g.addColorStop(1, '#8a6020');
    build(); ctx.fillStyle = g; ctx.fill();
    const k = ((t * 0.22) % 1.6) - 0.3, gx = K.lerp(x0 - (x1 - x0) * 0.2, x1 + (x1 - x0) * 0.2, k);
    const gl = ctx.createLinearGradient(gx - 60 * s, y0, gx + 60 * s, y1);
    gl.addColorStop(0, 'rgba(255,250,220,0)'); gl.addColorStop(0.5, 'rgba(255,250,220,0.75)'); gl.addColorStop(1, 'rgba(255,250,220,0)');
    ctx.globalCompositeOperation = 'source-atop'; build(); ctx.fillStyle = gl; ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    build(); ctx.strokeStyle = 'rgba(70,45,10,0.85)'; ctx.lineWidth = 1.6 * s; ctx.stroke();
    ctx.restore();
  }
  // White-lead filigree: tiny strokes and dot triplets along a rectangle edge.
  function filigree(ctx, x, y, w, h, s, seed) {
    const r = K.rng(seed); ctx.save(); ctx.strokeStyle = 'rgba(251,244,224,0.85)'; ctx.fillStyle = 'rgba(251,244,224,0.9)'; ctx.lineWidth = 1.3 * s;
    const step = 22 * s;
    for (let i = 0; i * step < w + h; i++) {
      const u = i * step, px = u < w ? x + u : x + w, py = u < w ? y : y + (u - w);
      const qx = u < w ? x + w - u : x, qy = u < w ? y + h : y + h - (u - w);
      for (const [a, b] of [[px, py], [qx, qy]]) {
        const cx = K.clamp(a, x + 8 * s, x + w - 8 * s), cy = K.clamp(b, y + 8 * s, y + h - 8 * s);
        ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * 3 * s, cy + (r() - 0.5) * 3 * s, 4 * s, r() * 6, r() * 6 + 3.6); ctx.stroke();
        ctx.beginPath(); ctx.arc(cx, cy, 1.4 * s, 0, 7); ctx.fill();
      }
    }
    ctx.restore();
  }
  function ivyLeaf(ctx, x, y, a, sz, col) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(a); ctx.beginPath();
    ctx.moveTo(0, 0); ctx.bezierCurveTo(sz * 0.2, -sz * 0.6, sz * 0.9, -sz * 0.7, sz, -sz * 0.15);
    ctx.bezierCurveTo(sz * 1.2, sz * 0.2, sz * 0.7, sz * 0.7, 0, 0); ctx.fillStyle = col; ctx.fill();
    ctx.strokeStyle = C.ink; ctx.lineWidth = Math.max(1, sz * 0.09); ctx.stroke();
    ctx.strokeStyle = 'rgba(251,244,224,0.7)'; ctx.lineWidth = Math.max(0.8, sz * 0.05); ctx.beginPath(); ctx.moveTo(sz * 0.15, -sz * 0.05); ctx.lineTo(sz * 0.75, -sz * 0.15); ctx.stroke();
    ctx.restore();
  }
  function bezant(ctx, x, y, r) {
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    g.addColorStop(0, C.goldHi); g.addColorStop(0.6, C.gold); g.addColorStop(1, C.goldLo);
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, 7); ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,10,0.8)'; ctx.lineWidth = Math.max(1, r * 0.18); ctx.stroke();
  }
  // Vine running along a polyline with ivy leaves + bezants every few steps (cached into the folio).
  function rinceau(ctx, pts, s, seed) {
    const r = K.rng(seed), w = K.wobble(pts, 5 * s, seed, 0.05);
    ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.8 * s; K.poly(ctx, w); ctx.stroke();
    const cols = [C.lapis, C.rose, C.green, C.red, C.gold];
    for (let i = 4; i < w.length - 2; i += 5) {
      const [x, y] = w[i], [x2, y2] = w[i + 1], a = Math.atan2(y2 - y, x2 - x), side = i % 10 < 5 ? 1 : -1;
      const tx = x + Math.cos(a + side * 1.2) * 18 * s, ty = y + Math.sin(a + side * 1.2) * 18 * s;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + Math.cos(a) * 10 * s, y + Math.sin(a) * 10 * s, tx, ty); ctx.stroke();
      ivyLeaf(ctx, tx, ty, a + side * 1.2, 12 * s, cols[r.int(0, 3)]);
      if (r() < 0.6) { const bx = x + Math.cos(a - side * 1.4) * 14 * s, by = y + Math.sin(a - side * 1.4) * 14 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(bx, by); ctx.stroke(); bezant(ctx, bx, by, 3.6 * s); }
    }
    ctx.restore();
  }
  function folio(W, H) {
    return K.cached(`illum-folio:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(31);
      x.drawImage(K.paperTex(W, H, C.vellum, 17, 0.06, false), 0, 0);
      // flesh-side mottling and darker cockled edges
      for (let i = 0; i < 40; i++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 1); const cx = r.range(0, W), cy = r.range(0, H), rr = r.range(60, 260) * s;
        x.save(); x.translate(cx, cy); x.scale(rr, rr * r.range(0.5, 1)); g.addColorStop(0, 'rgba(150,110,60,0.07)'); g.addColorStop(1, 'rgba(150,110,60,0)'); x.fillStyle = g; x.beginPath(); x.arc(0, 0, 1, 0, 7); x.fill(); x.restore(); }
      const eg = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.62);
      eg.addColorStop(0, 'rgba(120,80,30,0)'); eg.addColorStop(1, 'rgba(120,80,30,0.32)'); x.fillStyle = eg; x.fillRect(0, 0, W, H);
      // ruling + pricking
      const m = 70 * s; x.strokeStyle = 'rgba(140,90,60,0.13)'; x.lineWidth = 1;
      for (let y = m * 1.3; y < H - m; y += 34 * s) { x.beginPath(); x.moveTo(m * 1.1, y); x.lineTo(W - m * 0.6, y); x.stroke(); }
      x.beginPath(); x.moveTo(m * 1.1, m * 0.6); x.lineTo(m * 1.1, H - m * 0.6); x.moveTo(W - m * 0.6, m * 0.6); x.lineTo(W - m * 0.6, H - m * 0.6); x.stroke();
      x.fillStyle = 'rgba(80,50,30,0.35)';
      for (let y = m * 1.3; y < H - m; y += 34 * s) { x.beginPath(); x.arc(W - m * 0.3, y, 1.4 * s, 0, 7); x.fill(); }
      // border bar: alternating lapis / rose / gold segments down the left margin, rinceaux left + bottom
      const bx = 30 * s, bw = 12 * s;
      for (let y = 40 * s, i = 0; y < H - 50 * s; y += 26 * s, i++) {
        x.fillStyle = [C.lapis, C.rose, C.lapis, C.red][i % 4]; x.fillRect(bx, y, bw, 22 * s);
        x.fillStyle = C.gold; x.fillRect(bx, y + 22 * s, bw, 4 * s);
        x.fillStyle = 'rgba(251,244,224,0.8)'; x.fillRect(bx + bw / 2 - 1 * s, y + 4 * s, 2 * s, 14 * s);
      }
      x.strokeStyle = C.ink; x.lineWidth = 1.5 * s; x.strokeRect(bx, 40 * s, bw, H - 90 * s);
      const left = [], bottom = [];
      for (let i = 0; i <= 60; i++) left.push([bx + bw / 2 + Math.sin(i * 0.9) * 10 * s - 2 * s, 40 * s + (H - 90 * s) * (i / 60)]);
      for (let i = 0; i <= 90; i++) bottom.push([bx + bw + (W - bx * 3) * (i / 90), H - 26 * s + Math.sin(i * 0.8) * 6 * s]);
      rinceau(x, left, s, 5); rinceau(x, bottom, s, 9);
      return c;
    });
  }

  // a quill nib that rides the writing point
  function quill(ctx, at, s) {
    if (!at) return; ctx.save(); ctx.translate(at[0], at[1]); ctx.rotate(-0.95); ctx.scale(s, s);
    ctx.fillStyle = 'rgba(40,25,10,0.18)'; ctx.beginPath(); ctx.ellipse(70, 14, 70, 10, 0, 0, 7); ctx.fill();
    ctx.fillStyle = '#2b1d12'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, -3); ctx.lineTo(16, 3); ctx.fill();
    ctx.fillStyle = '#efe6d2'; ctx.beginPath(); ctx.moveTo(14, -2); ctx.quadraticCurveTo(80, -26, 170, -10); ctx.quadraticCurveTo(90, 8, 14, 3); ctx.fill();
    ctx.strokeStyle = 'rgba(80,60,40,0.6)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(14, 0); ctx.quadraticCurveTo(90, -9, 170, -10); ctx.stroke();
    for (let i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(40 + i * 10, -4 - i * 0.6); ctx.lineTo(48 + i * 10, -14 - i * 0.7); ctx.stroke(); }
    ctx.restore();
  }

  // Ink lettering written letter by letter; the newest letter is still wet (darker, slightly bigger).
  function write(ctx, text, x, y, p, o, family, weight) {
    const s = sOf(ctx), size = (o.size || 56) * s;
    ctx.save(); ctx.font = K.font(size, family, weight); ctx.textBaseline = 'alphabetic';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const n = text.length * K.clamp(p), full = Math.floor(n);
    const col = o.color || C.ink;
    let cx = x0, tip = null;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], cw = ctx.measureText(ch).width;
      if (i < full || (i === full && n - full > 0.05)) {
        const wet = i >= full - 1 && p < 1;
        ctx.fillStyle = col; ctx.globalAlpha = wet ? 1 : 0.93;
        if (i === 0 && o.rubric) ctx.fillStyle = C.red;
        ctx.fillText(ch, cx, y);
        // iron-gall pooling: a faint darker echo slightly offset
        ctx.globalAlpha = 0.18; ctx.fillStyle = '#120a04'; ctx.fillText(ch, cx + 0.8 * s, y + 0.6 * s);
        tip = [cx + cw, y - size * 0.3];
      }
      cx += cw;
    }
    ctx.restore();
    return { w, h: size, tip: p > 0 && p < 1 ? tip : null };
  }

  const style = {
    id: 'illuminated', name: 'Illuminated Manuscript', family: 'Illustration',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&family=Grenze+Gotisch:wght@400;700&display=block',
      specs: ['700 56px "Grenze Gotisch"', '400 34px "Grenze Gotisch"', 'italic 400 30px "IM Fell English"'] }],
    palette: { bg: C.vellum, ink: C.ink, accent: C.red, lapis: C.lapis, gold: C.gold, rose: C.rose, malachite: C.green },
    sfx: { draw: 'pen', land: 'pluck', emphasis: 'chime', transition: 'paper', bed: 'room' },
    setup(W, H) { folio(W, H); },

    background(ctx, W, H, t) {
      ctx.drawImage(folio(W, H), 0, 0);
      // snail drollery crawling the bottom vine
      const s = S(W, H), sx = K.lerp(W * 0.55, W * 0.62, (t % 12) / 12), sy = H - 40 * s;
      ctx.save(); ctx.translate(sx, sy); ctx.scale(s, s);
      ctx.fillStyle = '#b9b49a'; ctx.strokeStyle = C.ink; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-30, 8); ctx.quadraticCurveTo(10, 12, 34, 4); ctx.quadraticCurveTo(40, -6, 32, -8); ctx.lineTo(-30, 2); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(30, -6); ctx.lineTo(36, -22); ctx.moveTo(34, -5); ctx.lineTo(44, -18); ctx.stroke();
      ctx.fillStyle = C.gold; ctx.beginPath(); ctx.arc(-6, -12, 18, 0, 7); ctx.fill(); ctx.stroke();
      ctx.beginPath(); for (let a = 0; a < 12; a += 0.2) { const rr = 16 - a * 1.25; ctx.lineTo(-6 + Math.cos(a) * rr, -12 + Math.sin(a) * rr); } ctx.stroke();
      ctx.restore();
    },

    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.16, '#5a3a14');
      K.grain(ctx, W, H, t, 0.04, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return write(ctx, text, x, y, p, o, TXT, 700); },
    label(ctx, text, x, y, p, o = {}) { return write(ctx, text, x, y, p, { size: 36, ...o }, TXT, 400); },

    // penwork arrow: an ink line with a vermilion hairline twin, curl flourishes, a gold leaf head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.12, 40), 1.2 * s, o.seed || 3);
      const q = K.trim(pts, K.clamp(p / 0.85)); if (q.length < 2) return null;
      ctx.save(); ctx.lineCap = 'round';
      ctx.strokeStyle = o.color || C.red; ctx.lineWidth = 2 * s; ctx.beginPath(); q.forEach((pt, i) => (i ? ctx.lineTo(pt[0], pt[1] + 3 * s) : ctx.moveTo(pt[0], pt[1] + 3 * s))); ctx.stroke();
      ctx.strokeStyle = C.ink; ctx.lineWidth = 2.6 * s; K.poly(ctx, q); ctx.stroke();
      // little curl flourishes every so often
      for (let i = 8; K.pathLen(pts) > 140 * s && i < q.length - 6; i += 12) { const [a, b] = q[i]; ctx.lineWidth = 1.4 * s; ctx.beginPath(); ctx.arc(a, b - 5 * s, 5 * s, 0.3, 4.5); ctx.stroke(); }
      if (p > 0.85) {
        const hp = K.clamp((p - 0.85) / 0.15), b = pts[pts.length - 1], a = pts[pts.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 22 * s * hp;
        gild(ctx, () => { ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang - 0.5) * L, b[1] - Math.sin(ang - 0.5) * L); ctx.lineTo(b[0] - Math.cos(ang) * L * 0.6, b[1] - Math.sin(ang) * L * 0.6); ctx.lineTo(b[0] - Math.cos(ang + 0.5) * L, b[1] - Math.sin(ang + 0.5) * L); ctx.closePath(); }, b[0] - L, b[1] - L, b[0] + L, b[1] + L, o.t || 0, s);
      }
      ctx.restore();
      return q[q.length - 1];
    },

    // a miniature frame: gold border laid square by square, pigment floods the field, white-lead filigree
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), t = o.t || 0, bw = 12 * s, fill = o.fill || C.lapis;
      const gp = K.clamp(p / 0.55), fp = K.clamp((p - 0.45) / 0.55);
      // gold leaf squares (laid in order around the frame)
      const step = 16 * s, cells = [];
      for (let u = 0; u < w; u += step) cells.push([x + u, y], [x + u, y + h - bw]);
      for (let v = bw; v < h - bw; v += step) cells.push([x, y + v], [x + w - bw, y + v]);
      const nGold = Math.floor(cells.length * gp);
      if (gp >= 1) gild(ctx, () => { ctx.beginPath(); ctx.rect(x, y, w, h); ctx.rect(x + bw, y + h - bw, w - 2 * bw, -(h - 2 * bw)); }, x, y, x + w, y + h, t, s);
      else for (let i = 0; i < nGold; i++) { const [cx, cy] = cells[i]; gild(ctx, () => { ctx.beginPath(); ctx.rect(cx, cy, Math.min(step, x + w - cx), bw); }, cx, cy, cx + step, cy + bw, t, s); }
      if (fp > 0) {
        ctx.save(); ctx.beginPath(); ctx.rect(x + bw, y + bw, w - 2 * bw, h - 2 * bw); ctx.clip();
        // pigment pools in from the centre outward
        const R = Math.hypot(w, h) * 0.6 * fp;
        ctx.fillStyle = fill; ctx.beginPath(); ctx.arc(x + w / 2, y + h / 2, R, 0, 7); ctx.fill();
        const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, Math.max(1, R));
        g.addColorStop(0, 'rgba(255,255,255,0.08)'); g.addColorStop(0.85, 'rgba(0,0,0,0.05)'); g.addColorStop(1, 'rgba(0,0,0,0.25)');
        ctx.fillStyle = g; ctx.fill();
        if (fp >= 1) filigree(ctx, x + bw, y + bw, w - 2 * bw, h - 2 * bw, s, o.seed || 7);
        ctx.restore();
        ctx.strokeStyle = C.ink; ctx.lineWidth = 1.6 * s; ctx.strokeRect(x + bw, y + bw, w - 2 * bw, h - 2 * bw);
      }
    },

    // numerals in burnished gold, outlined in iron-gall ink, on a lapis ribbon
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 120) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, TXT, 700); ctx.textAlign = 'center';
      const w = ctx.measureText(txt).width, cx = o.align === 'left' ? x + w / 2 : x;
      const g = ctx.createLinearGradient(cx - w / 2, y - size, cx + w / 2, y);
      g.addColorStop(0, '#9c7124'); g.addColorStop(0.4, C.gold); g.addColorStop(0.5, C.goldHi); g.addColorStop(0.62, C.gold); g.addColorStop(1, '#8a6020');
      ctx.fillStyle = C.goldLo; ctx.fillText(txt, cx + 2 * s, y + 3 * s);
      ctx.fillStyle = g; ctx.fillText(txt, cx, y);
      // burnish glint travelling across the numerals
      const k = (((o.t || 0) * 0.3) % 1.4) - 0.2, gx = K.lerp(cx - w / 2, cx + w / 2, k);
      const gl = ctx.createLinearGradient(gx - 40 * s, 0, gx + 40 * s, 0);
      gl.addColorStop(0, 'rgba(255,252,230,0)'); gl.addColorStop(0.5, 'rgba(255,252,230,0.8)'); gl.addColorStop(1, 'rgba(255,252,230,0)');
      ctx.globalAlpha = 0.65; ctx.fillStyle = gl; ctx.fillText(txt, cx, y); ctx.globalAlpha = 1;
      ctx.lineWidth = 2.2 * s; ctx.strokeStyle = 'rgba(55,35,10,0.9)'; ctx.strokeText(txt, cx, y);
      ctx.restore();
      return { w, h: size };
    },

    // vermilion penwork ring with radiating pen flourishes and gold bezants that pop on
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), col = o.color || C.red;
      const pts = K.wobble(K.circlePts(x, y, r * 1.2, r * 0.62, 90, -2.2, Math.PI * 2.15), 2 * s, o.seed || 13);
      ctx.save(); ctx.strokeStyle = col; ctx.lineCap = 'round';
      ctx.lineWidth = 3.4 * s; const q = K.trim(pts, K.clamp(p / 0.7)); if (q.length > 1) { K.poly(ctx, q); ctx.stroke(); }
      ctx.lineWidth = 1.4 * s; const q2 = K.trim(K.circlePts(x, y, r * 1.27, r * 0.68, 90, -2.0, Math.PI * 2.1), K.clamp(p / 0.7)); if (q2.length > 1) { K.poly(ctx, q2); ctx.stroke(); }
      const fp = K.clamp((p - 0.6) / 0.4);
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2, rx = r * 1.32, ry = r * 0.73, px = x + Math.cos(a) * rx, py = y + Math.sin(a) * ry;
        if (i >= fp * 16) continue;
        ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + Math.cos(a) * 18 * s, py + Math.sin(a) * 18 * s); ctx.stroke();
        bezant(ctx, px + Math.cos(a) * 24 * s, py + Math.sin(a) * 24 * s, 4.5 * s);
      }
      ctx.restore();
    },

    // the leaf turns: a fresh folio swings over from the right (p 0..0.5), then the old one lifts away
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), page = folio(W, H);
      const e = p < 0.5 ? K.lerp(W, 0, K.ease.inOut(p * 2)) : 0;
      const e2 = p < 0.5 ? W : K.lerp(W, 0, K.ease.inOut((p - 0.5) * 2));
      ctx.save();
      if (p < 0.5) {
        ctx.beginPath(); ctx.rect(e, 0, W - e, H); ctx.clip(); ctx.drawImage(page, 0, 0);
        ctx.fillStyle = 'rgba(90,60,25,0.12)'; ctx.fillRect(e, 0, W - e, H);
        const g = ctx.createLinearGradient(e, 0, e + 90 * s, 0); g.addColorStop(0, 'rgba(255,248,225,0.9)'); g.addColorStop(0.3, 'rgba(180,140,90,0.35)'); g.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = g; ctx.fillRect(e, 0, 90 * s, H);
      } else {
        ctx.beginPath(); ctx.rect(0, 0, e2, H); ctx.clip(); ctx.drawImage(page, 0, 0);
        ctx.fillStyle = 'rgba(90,60,25,0.1)'; ctx.fillRect(0, 0, e2, H);
        const g = ctx.createLinearGradient(e2 - 80 * s, 0, e2, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(0.7, 'rgba(150,110,60,0.3)'); g.addColorStop(1, 'rgba(255,248,225,0.9)');
        ctx.fillStyle = g; ctx.fillRect(e2 - 80 * s, 0, 80 * s, H);
      }
      ctx.restore();
      // the curling shadow cast on the page below
      const ex = p < 0.5 ? e : e2, sh = ctx.createLinearGradient(ex - 40 * s, 0, ex, 0);
      sh.addColorStop(0, 'rgba(40,25,10,0)'); sh.addColorStop(1, 'rgba(40,25,10,0.35)');
      if (ex > 0 && ex < W) { ctx.fillStyle = sh; ctx.fillRect(ex - 40 * s, 0, 40 * s, H); }
    },

    gild, bezant, quill,
  };

  // ---------- the shared demo: two folios of a Book of Hours ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const PCOL = [C.red, C.ink, C.red, C.ink, C.lapis, C.ink, C.lapis];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [210 * s, 128 * s], init: [92 * s, 52 * s, 104 * s, 104 * s], video: [110 * s, 270 * s, 250 * s, 170 * s],
      node: [480 * s, 285 * s, 290 * s, 140 * s], chips: PLATFORMS.map((n, i) => [960 * s, (205 + i * 68) * s]), counter: [W / 2, 410 * s] };
    return { s, P: true, title: [W * 0.33, H * 0.085], init: [W * 0.1, H * 0.045, W * 0.19, W * 0.19], video: [W * 0.24, H * 0.2, W * 0.52, H * 0.12],
      node: [W * 0.18, H * 0.43, W * 0.64, H * 0.08], chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.62 + Math.floor(i / 2) * 0.08)]), counter: [W / 2, H * 0.5] };
  }
  function play(ctx, x, y, w, h, s) {
    ctx.save(); ctx.fillStyle = C.red; ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.moveTo(x + w * 0.42, y + h * 0.3); ctx.lineTo(x + w * 0.42, y + h * 0.7); ctx.lineTo(x + w * 0.62, y + h * 0.5); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
  }
  function initialO(ctx, x, y, w, h, p, t, s) {
    // champ initial: gold square, rose field, a lapis letter O with white-lead highlights
    style.box(ctx, x, y, w, h, p, { fill: C.rose, t, seed: 3 });
    if (p > 0.8) {
      ctx.save(); ctx.globalAlpha = K.clamp((p - 0.8) / 0.2); ctx.font = K.font(h * 0.9, TXT, 700); ctx.textAlign = 'center';
      ctx.fillStyle = C.white; ctx.fillText('O', x + w / 2 + 2 * s, y + h * 0.78 + 2 * s); ctx.fillStyle = C.lapis; ctx.fillText('O', x + w / 2, y + h * 0.78); ctx.lineWidth = 2 * s; ctx.strokeStyle = C.ink; ctx.strokeText('O', x + w / 2, y + h * 0.78);
      ctx.restore();
    }
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      let tip = null; const track = (r) => { if (r && r.tip) tip = r.tip; };
      const scene2 = t >= 8.25;
      if (!scene2) {
        const [ix, iy, iw, ih] = Lo.init;
        initialO(ctx, ix, iy, iw, ih, K.beat(t, 0.0, 0.8, 'lin'), t, s);
        if (P) { track(style.title(ctx, 'ne video.', Lo.title[0], Lo.title[1], K.beat(t, 0.4, 0.6, 'lin'), { size: 58 }));
          track(style.title(ctx, 'Every platform.', Lo.title[0], Lo.title[1] + 70 * s, K.beat(t, 1.0, 0.9, 'lin'), { size: 52, color: C.red })); }
        else track(style.title(ctx, 'ne video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.4, 1.4, 'lin'), { size: 66 }));
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 1.0, 'lin'), { fill: C.green, t, seed: 21 });
        if (t > 2.9) { ctx.save(); ctx.globalAlpha = K.beat(t, 2.9, 0.3); play(ctx, vx, vy, vw, vh, s); ctx.restore(); }
        track(style.label(ctx, 'your video', vx + vw / 2, vy + vh + 44 * s, K.beat(t, 3.0, 0.5, 'lin'), { align: 'center', color: C.red }));
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 62 * s], [nx + nw / 2, ny - 12 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - 14 * s, ny + nh / 2]];
        const ap = K.beat(t, 3.4, 0.8, 'lin'); const at = style.arrow(ctx, a1[0], a1[1], ap, { seed: 31, bend: P ? 0.08 : -0.12, t }); if (ap > 0 && ap < 1) tip = at;
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.9, 'lin'), { fill: C.lapis, t, seed: 41 });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 18 * s, K.beat(t, 4.6, 0.4, 'lin'), { size: 54, align: 'center', color: C.white });
        if (P) { const yLast = Lo.chips[6][1] - 12 * s, tp = K.beat(t, 4.95, 0.5, 'lin'); const a = style.arrow(ctx, [W / 2, ny + nh + 10 * s], [W / 2, yLast], tp, { seed: 49, bend: 0.01, t }); if (tp > 0 && tp < 1) tip = a; }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 14 * s, ny + nh / 2];
          const to = P ? [left ? W * 0.46 : W * 0.54, cy - 12 * s] : [cx - 40 * s, cy - 12 * s];
          const p = K.beat(t, t0, 0.35, 'lin'), a = style.arrow(ctx, from, to, p, { seed: 50 + i, bend: P ? 0 : (i - 3) * 0.03, t }); if (p > 0 && p < 1) tip = a;
          const lp = K.beat(t, t0 + 0.3, 0.3, 'lin');
          const lx = P ? (left ? W * 0.44 : W * 0.56) : cx;
          if (lp > 0) { ctx.save(); ctx.font = K.font(40 * s, TXT, 700); ctx.fillStyle = C.red; ctx.textAlign = P ? (left ? 'right' : 'left') : 'left';
            if (!P) ctx.fillText('¶', cx - 30 * s, cy); ctx.restore(); }
          track(style.label(ctx, name, lx, cy, lp, { size: P ? 36 : 40, color: PCOL[i], align: P ? (left ? 'right' : 'left') : 'left', seed: 60 + i }));
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        // second folio: the roundel moves to the head of the page, the tally of views gilds itself
        const [, , nw, nh] = Lo.node, top = P ? H * 0.22 : 120 * s;
        style.box(ctx, W / 2 - nw / 2, top - nh / 2, nw, nh, 1, { fill: C.lapis, t, seed: 41 });
        style.title(ctx, 'Creator OS', W / 2, top + 18 * s, 1, { size: 54, align: 'center', color: C.white });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        const cy = P ? H * 0.46 : Lo.counter[1];
        if (t > 8.55) style.counter(ctx, Math.round(v / 1000) * 1000, W / 2, cy, 1, { size: P ? 104 : 132, t });
        style.label(ctx, 'views', W / 2, cy + 58 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', color: C.red, size: 44 });
        style.emphasis(ctx, W / 2, cy - 30 * s, (P ? 230 : 225) * s, K.beat(t, 10.0, 0.6, 'lin'), {});
        const tp = K.beat(t, 10.5, 1.0, 'lin');
        if (P) { track(style.title(ctx, 'Post once.', W / 2, H * 0.7, K.clamp(tp * 2), { size: 62, align: 'center', rubric: true }));
          track(style.title(ctx, 'Reach everywhere.', W / 2, H * 0.7 + 80 * s, K.clamp(tp * 2 - 1), { size: 62, align: 'center' })); }
        else track(style.title(ctx, 'Post once. Reach everywhere.', W / 2, 645 * s, tp, { size: 62, align: 'center', rubric: true }));
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      // folio number in the upper margin, in a later hand
      ctx.save(); ctx.font = K.font(30 * s, FELL, 400, 'italic'); ctx.fillStyle = 'rgba(60,40,20,0.75)'; ctx.textAlign = 'right';
      ctx.fillText(scene2 ? 'fol. ii' : 'fol. i', W - 60 * s, P ? 60 * s : 48 * s); ctx.restore();
      if (tip) quill(ctx, tip, s);
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      k.play('chime', 0.0, { note: 'D5', gain: 0.6 });
      k.play('scribble', 0.4, { medium: 'pen', dur: 1.4 });
      k.play('scribble', 2.0, { medium: 'brush', dur: 1.0 }); k.play('pluck', 2.95, { note: 'G4' });
      k.play('scribble', 3.0, { medium: 'pen', dur: 0.5, gain: 0.7 });
      k.play('scribble', 3.4, { medium: 'pen', dur: 0.8 });
      k.play('scribble', 4.0, { medium: 'brush', dur: 0.9 }); k.play('pluck', 4.6, { note: 'D5' }); k.play('scribble', 4.6, { medium: 'pen', dur: 0.4 });
      const notes = ['D5', 'E5', 'F5', 'G5', 'A5', 'C6', 'D6'];
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.32, gain: 0.8 }); k.play('pluck', 5.32 + i * 0.4, { note: notes[i], gain: 0.8 }); }
      k.play('paper', 7.6, { dur: 0.7 }); k.play('whoosh', 7.7, { dur: 1.0, gain: 0.6 }); k.play('paper', 8.5, { dur: 0.4 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('chime', 10.0, { note: 'A5' }); k.play('scribble', 10.0, { medium: 'pen', dur: 0.6 });
      k.play('scribble', 10.5, { medium: 'pen', dur: 1.0 }); k.play('chime', 11.4, { note: 'D6' }); k.play('swell', 10.6, { chord: ['D4', 'A4', 'D5'], dur: 1.4 });
    },
  };
  MS.register(style);
})();
