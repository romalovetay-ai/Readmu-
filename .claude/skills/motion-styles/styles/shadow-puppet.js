// Shadow Puppet Theatre (Paper & Craft). Black card silhouettes with punched lace cut-work, pinned joints and thin
// control rods, pressed to a backlit cloth screen that glows amber at the lamp and falls to red-brown at the edges.
// Coloured gels fill the openings, plaques hang and sway on strings, arrows are growing vines, the lamp breathes,
// and lace curtains close and part for the scene change.
(function () {
  const C = { glow: '#ffc35a', amber: '#f0a040', rust: '#b5521d', edge: '#3a1306', ink: '#140904', gelA: '#2bb3a0', gelB: '#d8432f', gelC: '#e8b62a', gelD: '#5b8ee0' };
  const FONT = 'IM Fell English';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  let NOW = 0; // scene clock for idle sway (set by the demo each frame; primitives fall back to still)

  function sil(ctx) { ctx.fillStyle = C.ink; ctx.strokeStyle = C.ink; }
  // ornamental plaque path: notched corners and round ears on both sides
  function plaquePath(ctx, w, h) {
    const n = Math.min(14, h * 0.25), e = h * 0.22;
    ctx.beginPath(); ctx.moveTo(-w / 2 + n, -h / 2); ctx.lineTo(w / 2 - n, -h / 2); ctx.arc(w / 2, -h / 2, n, Math.PI, Math.PI / 2, true);
    ctx.arc(w / 2 + e * 0.3, 0, e, -Math.PI / 2, Math.PI / 2); ctx.arc(w / 2, h / 2, n, -Math.PI / 2, Math.PI, true);
    ctx.lineTo(-w / 2 + n, h / 2); ctx.arc(-w / 2, h / 2, n, 0, -Math.PI / 2, true); ctx.arc(-w / 2 - e * 0.3, 0, e, Math.PI / 2, Math.PI * 1.5);
    ctx.arc(-w / 2, -h / 2, n, Math.PI / 2, 0, true); ctx.closePath();
  }
  // hanging plaque with punched lettering lit from behind; drops in on its strings and sways to rest
  function plaque(ctx, text, x, y, size, p, o = {}) {
    const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return { w: 0, h: 0 };
    ctx.save(); ctx.font = K.font(size, FONT, 400, o.italic ? 'italic' : ''); const tw = ctx.measureText(text).width; ctx.restore();
    const w = tw + size * 1.1, h = size * 1.45, drop = (1 - K.ease.back(k)) * -(o.dropH ?? 90 * sOf(ctx));
    const sway = K.spring(NOW, o.t0 ?? 0, 0.06, 1.1, 2.4) * (k < 1 ? 1 : 1) + 0.012 * Math.sin(NOW * 1.3 + (o.seed || 0));
    const cx = o.align === 'center' ? x : o.align === 'right' ? x - w / 2 : x + w / 2, cy = y - size * 0.35 + drop;
    const strL = o.string ?? 34 * s;
    ctx.save(); ctx.globalAlpha = K.clamp(k * 3); ctx.translate(cx, cy - h / 2 - strL); ctx.rotate(k < 1 ? 0 : sway);
    // strings to the nail(s)
    ctx.strokeStyle = 'rgba(20,9,4,0.85)'; ctx.lineWidth = 1.6 * s;
    if (o.twin) { ctx.beginPath(); ctx.moveTo(-w * 0.32, -strL * 2); ctx.lineTo(-w * 0.32, strL); ctx.moveTo(w * 0.32, -strL * 2); ctx.lineTo(w * 0.32, strL); ctx.stroke(); }
    else { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-w * 0.3, strL); ctx.moveTo(0, 0); ctx.lineTo(w * 0.3, strL); ctx.stroke(); sil(ctx); ctx.beginPath(); ctx.arc(0, 0, 3.5 * s, 0, 7); ctx.fill(); }
    ctx.translate(0, strL + h / 2);
    sil(ctx); plaquePath(ctx, w, h); ctx.fill();
    // punched dotted border lets pin-pricks of light through
    ctx.fillStyle = K.rgba(C.glow, 0.85); const per = 2 * (w + h), nd = Math.floor(per / (11 * s));
    for (let i = 0; i < nd; i++) { const u = (i / nd) * per; let px, py; if (u < w - 16 * s) { px = -w / 2 + 8 * s + u; py = -h / 2 + 7 * s; } else if (u < w * 2 - 32 * s) { px = -w / 2 + 8 * s + (u - w + 16 * s); py = h / 2 - 7 * s; } else continue; ctx.beginPath(); ctx.arc(px, py, 1.4 * s, 0, 7); ctx.fill(); }
    // the cut lettering glows, a coloured gel behind it when asked
    ctx.font = K.font(size, FONT, 400, o.italic ? 'italic' : ''); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.shadowColor = o.gel || C.glow; ctx.shadowBlur = 14 * s; ctx.fillStyle = o.gel ? K.rgba(K.mix(o.gel, '#fff3c8', 0.62), 1) : '#ffd98a';
    ctx.fillText(text, 0, size * 0.05);
    ctx.restore();
    return { w, h };
  }
  // control rod from a point down off the bottom of the screen
  function rod(ctx, x, y, H, s, lean = 0.12) { ctx.save(); ctx.strokeStyle = 'rgba(20,9,4,0.75)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + H * lean, H + 10); ctx.stroke(); ctx.beginPath(); ctx.fillStyle = C.ink; ctx.arc(x, y, 3 * s, 0, 7); ctx.fill(); ctx.restore(); }
  // vine with leaves along a path (the arrow)
  function vine(ctx, q, s, seed, w = 3.2) {
    if (q.length < 2) return;
    ctx.save(); sil(ctx); ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = w * s; K.poly(ctx, q); ctx.stroke();
    const L = K.pathLen(q), r = K.rng(seed);
    for (let d = 24 * s, i = 0; d < L - 18 * s; d += 26 * s, i++) {
      const a = K.trim(q, d / L), b = a[a.length - 1], c = a[Math.max(0, a.length - 3)], ang = Math.atan2(b[1] - c[1], b[0] - c[0]) + (i % 2 ? 0.9 : -0.9), ll = (9 + r() * 5) * s;
      ctx.save(); ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(ll * 0.5, -ll * 0.45, ll, 0); ctx.quadraticCurveTo(ll * 0.5, ll * 0.45, 0, 0); ctx.fill(); ctx.restore();
    }
    ctx.restore();
  }

  const style = {
    id: 'shadow-puppet', name: 'Shadow Puppet Theatre', family: 'Paper & Craft',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=IM+Fell+English:ital@0;1&display=block', specs: ['400 48px "IM Fell English"', 'italic 400 48px "IM Fell English"'] }],
    palette: { bg: C.amber, ink: C.ink, accent: C.gelB, glow: C.glow, edge: C.edge, gel: C.gelA },
    sfx: { draw: 'pencil', land: 'pluck', emphasis: 'ding', transition: 'paper', bed: 'room' },

    // the backlit cloth: lamp hotspot, falloff to red-brown, cloth weave, lace valance and a ground strip
    background(ctx, W, H, t) {
      const s = S(W, H), P = H > W;
      const tex = K.cached(`sp-cloth:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), lx = W * 0.5, ly = H * (P ? 0.42 : 0.45);
        const g = x.createRadialGradient(lx, ly, 0, lx, ly, Math.hypot(W, H) * 0.62);
        g.addColorStop(0, '#ffd27a'); g.addColorStop(0.25, C.amber); g.addColorStop(0.6, C.rust); g.addColorStop(1, C.edge);
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        // weave: fine warp and weft threads + slubs
        const r = K.rng(4); x.globalAlpha = 0.07; x.fillStyle = '#000';
        for (let yy = 0; yy < H; yy += 3) x.fillRect(0, yy, W, 1);
        for (let xx = 0; xx < W; xx += 3) x.fillRect(xx, 0, 1, H);
        x.globalAlpha = 0.12; for (let i = 0; i < 300; i++) { x.fillStyle = r() < 0.5 ? '#fff0c0' : '#3a1306'; x.fillRect(r() * W, r() * H, (6 + r() * 30) * s, 1.2 * s); }
        x.globalAlpha = 1;
        // stage furniture silhouettes: scalloped lace valance with punched holes, ground with grass tufts
        x.fillStyle = C.ink; const vh = 26 * s; x.fillRect(0, 0, W, vh);
        for (let xx = 0; xx < W + 40 * s; xx += 40 * s) { x.beginPath(); x.arc(xx, vh, 20 * s, 0, Math.PI); x.fill(); }
        x.globalCompositeOperation = 'destination-out';
        for (let xx = 0; xx < W + 40 * s; xx += 40 * s) { x.beginPath(); x.arc(xx, vh + 6 * s, 5 * s, 0, 7); x.fill(); x.beginPath(); x.arc(xx + 20 * s, vh - 9 * s, 3 * s, 0, 7); x.fill(); }
        x.globalCompositeOperation = 'source-over';
        // tassels
        for (let xx = 20 * s; xx < W; xx += 160 * s) { x.fillRect(xx, vh, 1.5 * s, 34 * s); x.beginPath(); x.moveTo(xx - 5 * s, vh + 44 * s); x.lineTo(xx + 6 * s, vh + 44 * s); x.lineTo(xx + 0.7 * s, vh + 30 * s); x.fill(); }
        const gy = H - (P ? 70 : 44) * s; x.beginPath(); x.moveTo(0, H);
        for (let xx = 0; xx <= W; xx += 18 * s) x.lineTo(xx, gy + Math.sin(xx * 0.011) * 7 * s + r() * 3 * s);
        x.lineTo(W, H); x.fill();
        for (let i = 0; i < 46; i++) { const gx = r() * W, hh = (8 + r() * 18) * s; x.beginPath(); x.moveTo(gx - 3 * s, gy + 6 * s); x.lineTo(gx + (r() - 0.5) * 6 * s, gy - hh); x.lineTo(gx + 3 * s, gy + 6 * s); x.fill(); }
        return c;
      });
      ctx.drawImage(tex, 0, 0);
    },

    // the lamp breathing (flame flicker), deep edge falloff, faint grain of the cloth
    finish(ctx, W, H, t) {
      const nz = K.cached('sp-flick', () => K.noise(99)), f = nz.n2(t * 3.1, 0.5) * 0.6 + nz.n2(t * 9.7, 2.5) * 0.4;
      ctx.save(); ctx.globalCompositeOperation = f > 0 ? 'soft-light' : 'multiply';
      ctx.fillStyle = f > 0 ? `rgba(255,214,140,${0.25 * f})` : `rgba(120,50,20,${-0.22 * f})`; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.42, '#1a0702');
      K.grain(ctx, W, H, t, 0.05, 12, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) { return plaque(ctx, text, x, y, (o.size || 54) * sOf(ctx), p, { twin: true, string: o.string ?? 60 * sOf(ctx), ...o }); },
    label(ctx, text, x, y, p, o = {}) { return plaque(ctx, text, x, y, (o.size || 34) * sOf(ctx), p, { string: 22 * sOf(ctx), ...o }); },

    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.18, 60), q = K.trim(pts, K.clamp(p));
      vine(ctx, q, s, o.seed || 3, o.width || 3.2);
      if (p >= 0.9 && q.length > 3) { // a leaf-shaped arrowhead
        const b = q[q.length - 1], a = q[q.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 22 * s * K.clamp((p - 0.9) / 0.1);
        ctx.save(); sil(ctx); ctx.translate(b[0], b[1]); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(6 * s, 0); ctx.quadraticCurveTo(-L * 0.4, -L * 0.6, -L, 0); ctx.quadraticCurveTo(-L * 0.4, L * 0.6, 6 * s, 0); ctx.fill(); ctx.restore();
      }
      return q[q.length - 1];
    },

    // a cut-work frame puppet: silhouette with a gel window, lace holes punched along the border; rises on its rod
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      const H = ctx.canvas.height, dy = (1 - K.ease.out(k)) * (H - y + 20 * s);
      ctx.save(); ctx.translate(0, dy);
      const lay = K.cached(`sp-frame:${w | 0}x${h | 0}:${o.gel || C.gelA}:${s.toFixed(2)}`, () => {
        const pad = 24 * s, c = K.layer(w + pad * 2, h + pad * 2), x2 = c.getContext('2d'), b = 14 * s;
        x2.translate(pad, pad); x2.fillStyle = C.ink; x2.beginPath(); x2.roundRect(0, 0, w, h, 10 * s); x2.fill();
        // scalloped outer edge
        for (let u = 0; u < w; u += 18 * s) { x2.beginPath(); x2.arc(u + 9 * s, 0, 8 * s, Math.PI, 0); x2.fill(); x2.beginPath(); x2.arc(u + 9 * s, h, 8 * s, 0, Math.PI); x2.fill(); }
        x2.globalCompositeOperation = 'destination-out';
        x2.beginPath(); x2.roundRect(b, b, w - 2 * b, h - 2 * b, 8 * s); x2.fill();                  // the window
        for (let u = 14 * s; u < w - 10 * s; u += 18 * s) { x2.beginPath(); x2.arc(u, b * 0.5, 2.6 * s, 0, 7); x2.fill(); x2.beginPath(); x2.arc(u, h - b * 0.5, 2.6 * s, 0, 7); x2.fill(); }
        x2.globalCompositeOperation = 'source-over';
        x2.globalAlpha = 0.62; x2.fillStyle = o.gel || C.gelA; x2.beginPath(); x2.roundRect(b, b, w - 2 * b, h - 2 * b, 8 * s); x2.fill();   // coloured gel
        x2.globalAlpha = 1; x2.fillStyle = C.ink;
        for (const [cx, cy] of [[b, b], [w - b, b], [b, h - b], [w - b, h - b]]) { x2.beginPath(); x2.arc(cx, cy, 5 * s, 0, 7); x2.fill(); }  // corner pins
        return c;
      });
      ctx.drawImage(lay, x - 24 * s, y - 24 * s);
      if (o.rod !== false) rod(ctx, x + w * 0.5, y + h - 6 * s, H - dy, s, o.lean ?? 0.05);
      ctx.restore();
    },

    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 110) * s;
      return plaque(ctx, K.fmt(value), x, y, size, 1, { align: 'center', twin: true, string: (o.string ?? 50) * s, gel: o.gel, seed: 3 });
    },

    // cut-work sun: dark rays punched with gel tips, rising behind the moment while the lamp flares
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), k = K.ease.out(K.clamp(p)); if (k <= 0) return;
      ctx.save(); ctx.translate(x, y); ctx.rotate(k * 0.4); ctx.scale(k, k);
      const g = ctx.createRadialGradient(0, 0, r * 0.5, 0, 0, r * 1.6); g.addColorStop(0, 'rgba(255,230,160,0.45)'); g.addColorStop(1, 'rgba(255,230,160,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r * 1.6, 0, 7); ctx.fill();
      const n = 18;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2, r0 = r * 1.02, r1 = r * (i % 2 ? 1.28 : 1.42);
        ctx.save(); ctx.rotate(a); sil(ctx); ctx.beginPath(); ctx.moveTo(r0, -9 * s); ctx.lineTo(r1, 0); ctx.lineTo(r0, 9 * s); ctx.fill();
        ctx.fillStyle = K.rgba(i % 3 ? C.gelC : C.gelB, 0.8); ctx.beginPath(); ctx.arc(r0 + (r1 - r0) * 0.45, 0, 3 * s, 0, 7); ctx.fill(); ctx.restore();
      }
      ctx.lineWidth = 6 * s; ctx.strokeStyle = C.ink; ctx.setLineDash([10 * s, 6 * s]); ctx.beginPath(); ctx.arc(0, 0, r * 0.98, 0, 7); ctx.stroke();
      ctx.restore();
    },

    // lace curtains close from both sides (covered at 0.5) and part again
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), k = p < 0.5 ? K.ease.inOut(p / 0.5) : 1 - K.ease.inOut((p - 0.5) / 0.5), cw = (W / 2 + 30 * s) * k;
      for (const side of [-1, 1]) {
        ctx.save(); if (side > 0) { ctx.translate(W, 0); ctx.scale(-1, 1); }
        sil(ctx); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(cw, 0);
        for (let yy = 0; yy <= H; yy += 30 * s) ctx.quadraticCurveTo(cw + 16 * s, yy + 15 * s, cw, yy + 30 * s);
        ctx.lineTo(0, H); ctx.closePath(); ctx.fill();
        // lace cut-work: rows of punched rosettes letting the lamp glow through
        ctx.fillStyle = K.rgba(C.glow, 0.55);
        for (let yy = 30 * s; yy < H; yy += 56 * s) for (let xx = cw - 30 * s; xx > 10; xx -= 64 * s) {
          for (let j = 0; j < 6; j++) { const a = (j / 6) * Math.PI * 2; ctx.beginPath(); ctx.arc(xx + Math.cos(a) * 9 * s, yy + Math.sin(a) * 9 * s, 3 * s, 0, 7); ctx.fill(); }
          ctx.beginPath(); ctx.arc(xx, yy, 3.4 * s, 0, 7); ctx.fill();
        }
        // folds
        ctx.fillStyle = 'rgba(255,200,120,0.06)'; for (let xx = 20 * s; xx < cw; xx += 46 * s) ctx.fillRect(xx, 0, 10 * s, H);
        ctx.restore();
      }
    },
  };

  // ---------- the shared demo: a little shadow play ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const GELS = [C.gelB, C.gelA, C.gelB, null, C.gelD, null, C.gelD];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 150 * s], video: [150 * s, 280 * s, 240 * s, 140 * s], node: [470 * s, 300 * s, 300 * s, 140 * s],
      chips: PL.map((_, i) => [925 * s, (232 + i * 62) * s]), top: [W / 2, 165 * s], counter: [W / 2, 410 * s], take: [W / 2, 600 * s], puppet: [92 * s, H - 44 * s] };
    return { s, P: true, title: [W / 2, H * 0.12], video: [W * 0.3, H * 0.19, W * 0.5, H * 0.11], node: [W * 0.17, H * 0.4, W * 0.66, H * 0.08],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.57 + Math.floor(i / 2) * 0.075)]), top: [W / 2, H * 0.17], counter: [W / 2, H * 0.47], take: [W / 2, H * 0.74], puppet: [W * 0.14, H * 0.36] };
  }
  // the creator puppet: jointed arm raised on its rod, head with a cut-work eye
  function creator(ctx, x, y, s, raise, H) {
    ctx.save(); ctx.translate(x, y); sil(ctx);
    ctx.beginPath(); ctx.moveTo(-34 * s, 0); ctx.lineTo(-22 * s, -120 * s); ctx.quadraticCurveTo(0, -140 * s, 22 * s, -120 * s); ctx.lineTo(34 * s, 0); ctx.closePath(); ctx.fill();       // robe
    ctx.beginPath(); ctx.arc(0, -150 * s, 24 * s, 0, 7); ctx.fill();                                                                                                                   // head
    ctx.beginPath(); ctx.moveTo(8 * s, -170 * s); ctx.lineTo(30 * s, -186 * s); ctx.lineTo(16 * s, -160 * s); ctx.fill();                                                              // cap peak
    ctx.globalCompositeOperation = 'destination-out'; ctx.beginPath(); ctx.arc(9 * s, -153 * s, 4.5 * s, 0, 7); ctx.fill();
    for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(0, -100 * s + i * 22 * s, 4 * s, 0, 7); ctx.fill(); }
    ctx.globalCompositeOperation = 'source-over';
    // jointed arm: shoulder pin, upper arm, elbow pin, forearm up toward the card
    const a1 = -0.6 - raise * 0.5, a2 = a1 + 0.3, sx = 14 * s, sy = -112 * s, L1 = 52 * s, L2 = 50 * s;
    const ex = sx + Math.cos(a1) * L1, ey = sy + Math.sin(a1) * L1, hx = ex + Math.cos(a2) * L2, hy = ey + Math.sin(a2) * L2;
    ctx.lineCap = 'round'; ctx.lineWidth = 13 * s; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke(); ctx.lineWidth = 10 * s; ctx.beginPath(); ctx.moveTo(ex, ey); ctx.lineTo(hx, hy); ctx.stroke();
    ctx.fillStyle = C.rust; for (const [px, py] of [[sx, sy], [ex, ey]]) { ctx.beginPath(); ctx.arc(px, py, 3 * s, 0, 7); ctx.fill(); }
    ctx.restore();
    rod(ctx, x + hx, y + hy, H, s, 0.1); rod(ctx, x, y - 40 * s, H, s, -0.02);
    return [x + hx, y + hy];
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      NOW = t;
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      style.background(ctx, W, H, t);
      if (!scene2) {
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.2, 0.9, 'lin'), { size: P ? 46 : 52, align: 'center', t0: 1.1, italic: false, string: (P ? 80 : 70) * s });
        const [vx, vy, vw, vh] = Lo.video, vp = K.beat(t, 2.0, 0.8, 'lin');
        // the creator puppet hops in from the left and lifts the video card on its rod
        const hop = K.beat(t, 1.6, 0.7, 'out'), bob = Math.abs(Math.sin(K.clamp((t - 1.6) / 0.7) * Math.PI * 2)) * 14 * s * (1 - hop);
        if (!P) { const hand = creator(ctx, K.lerp(-80 * s, Lo.puppet[0], hop), Lo.puppet[1] - bob, s, K.beat(t, 2.0, 0.6, 'out'), H);
          if (vp > 0.5) { ctx.save(); ctx.strokeStyle = C.ink; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(hand[0], hand[1]); ctx.lineTo(vx + 40 * s, vy + vh + (1 - K.ease.out(vp)) * (H - vy) - 8 * s); ctx.stroke(); ctx.restore(); } }
        style.box(ctx, vx, vy, vw, vh, vp, { gel: C.gelB, rod: P, lean: 0.02 });
        if (vp > 0.6) { ctx.save(); ctx.translate(0, (1 - K.ease.out(vp)) * (H - vy)); sil(ctx); const r = Math.min(vw, vh) * 0.26, cx = vx + vw / 2, cy = vy + vh / 2; ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx - r * 0.6, cy + r); ctx.fill(); ctx.restore(); }
        style.label(ctx, 'your video', vx + vw / 2, vy - 22 * s, K.beat(t, 2.6, 0.5, 'lin'), { align: 'center', t0: 3.1, italic: true, seed: 2, string: 10 * s });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw * 0.3, vy + vh + 20 * s], [nx + nw * 0.45, ny - 26 * s]] : [[vx + vw + 22 * s, vy + vh * 0.55], [nx - 30 * s, ny + nh * 0.5]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.8, 'lin'), { bend: P ? -0.25 : -0.2 });
        const np = K.beat(t, 4.0, 0.9, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, { gel: C.gelA });
        if (np > 0.5) { ctx.save(); ctx.translate(0, (1 - K.ease.out(np)) * (H - ny)); sil(ctx); ctx.font = K.font(K.fitSize(ctx, 'Creator OS', FONT, 400, 54 * s, nw - 60 * s), FONT, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Creator OS', nx + nw / 2, ny + nh / 2 + 4 * s); ctx.restore(); }
        if (P) style.arrow(ctx, [W / 2, ny + nh + 18 * s], [W / 2, Lo.chips[6][1] + 30 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0.02, width: 3.6 });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 4 * s] : [nx + nw + 18 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.44 : W * 0.56, cy - 4 * s] : [cx - 34 * s, cy - 8 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0.05 : (i - 3) * 0.03, width: 2.6, seed: 10 + i });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.2, 0.45, 'lin'), { size: 32, align: P ? (left ? 'right' : 'left') : 'left', gel: GELS[i], t0: t0 + 0.65, seed: i });
        });
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * 0.8, h2 = nh * 0.8;
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 40 * s, (P ? 230 : 170) * s, K.beat(t, 10.0, 0.7, 'lin'), {});
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 84 : 92, string: P ? 70 : 40 });
        // the Creator OS frame now hangs from the valance on two cords
        ctx.save(); ctx.strokeStyle = 'rgba(20,9,4,0.85)'; ctx.lineWidth = 1.6 * s; ctx.beginPath(); ctx.moveTo(Lo.top[0] - w2 * 0.35, 0); ctx.lineTo(Lo.top[0] - w2 * 0.35, Lo.top[1]); ctx.moveTo(Lo.top[0] + w2 * 0.35, 0); ctx.lineTo(Lo.top[0] + w2 * 0.35, Lo.top[1]); ctx.stroke(); ctx.restore();
        style.box(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, { gel: C.gelA, rod: false });
        sil(ctx); ctx.font = K.font(K.fitSize(ctx, 'Creator OS', FONT, 400, 48 * s, w2 - 50 * s), FONT, 400); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('Creator OS', Lo.top[0], Lo.top[1] + 4 * s);
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + (P ? 150 : 120) * s, K.beat(t, 8.8, 0.5, 'lin'), { align: 'center', size: 34, italic: true, t0: 9.3, gel: C.gelC, string: 10 * s });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.8, 'lin'), { size: P ? 40 : 46, align: 'center', t0: 11.3, italic: true, string: 16 * s, twin: false });
      }
      if (t > 7.4 && t < 9.2) style.transition(ctx, W, H, K.clamp((t - 7.4) / 1.8), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.4); k.bed('hum', 0, 12, 0.35);
      k.play('whoosh', 0.2, { dur: 0.6, up: false, gain: 0.6 }); k.play('pluck', 1.05, { note: 'A3' }); k.play('pluck', 1.2, { note: 'E4', gain: 0.6 });
      k.play('paper', 1.6, { dur: 0.15 }); k.play('paper', 1.95, { dur: 0.15 }); k.play('paper', 2.2, { dur: 0.15 });
      k.play('whoosh', 2.0, { dur: 0.7, up: false, gain: 0.5 }); k.play('pluck', 3.1, { note: 'C4', gain: 0.8 });
      k.play('scribble', 3.3, { medium: 'pencil', dur: 0.8, gain: 1.4 }); k.play('whoosh', 4.0, { dur: 0.8, up: false, gain: 0.5 }); k.play('thud', 4.9, { gain: 0.4 });
      const notes = ['D4', 'F4', 'A4', 'C5', 'D5', 'F5', 'A5'];
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pencil', dur: 0.3, gain: 1.2 }); k.play('pluck', 5.6 + i * 0.4, { note: notes[i], gain: 0.75 }); }
      k.play('paper', 7.4, { dur: 0.9, gain: 1.3 }); k.play('whoosh', 7.5, { dur: 0.8, gain: 0.5 }); k.play('paper', 8.3, { dur: 0.9, gain: 1.3 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('pluck', 9.3, { note: 'G4' });
      k.play('ding', 10.0); k.play('swell', 10.0, { dur: 2, chord: ['D4', 'F4', 'A4'] });
      k.play('pluck', 11.3, { note: 'D5', gain: 0.7 }); k.play('chime', 11.4, { note: 'D6' });
    },
  };
  MS.register(style);
})();
