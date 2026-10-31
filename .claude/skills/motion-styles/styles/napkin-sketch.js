// Napkin Sketch (Hand-Drawn). A cafe-table pitch in black Sharpie on a paper napkin: ink that feathers into tissue
// fibres (soft bleed halo + hairline wicks), an embossed napkin border, quarter-fold creases and crumple relief,
// a coffee ring, all on warm wooden planks with the cup and the marker. Scene change = a fresh napkin slapped on top.
(function () {
  const INK = { black: '#141414', red: '#c8221e', blue: '#1f3f9a' };
  const FONT = 'Permanent Marker';
  const S = (W, H) => K.layout(W, H).s;
  const NAP = '#f5f2ea';

  function napRect(W, H) {
    const s = S(W, H);
    return H > W ? [W * 0.05, H * 0.13, W * 0.9, H * 0.79] : [150 * s, 22 * s, 980 * s, 676 * s];
  }

  // Sharpie stroke: feathered halo first (ink wicking into the tissue), solid body, hairline wicks off the edge.
  function sharpie(ctx, pts, p, o = {}) {
    const q = K.trim(pts, p); if (q.length < 2) return null;
    const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || INK.black, w = (o.width || 6.5) * s, r = K.rng(o.seed || 1);
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = K.rgba(col, 0.16); ctx.lineWidth = w * 2.1; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = K.rgba(col, 0.25); ctx.lineWidth = w * 1.35; K.poly(ctx, q); ctx.stroke();
    ctx.strokeStyle = K.rgba(col, 0.94); ctx.lineWidth = w; K.poly(ctx, q); ctx.stroke();
    // wicks: short hairlines where the ink ran along a fibre
    ctx.strokeStyle = K.rgba(col, 0.35); ctx.lineWidth = 0.9 * s; ctx.beginPath();
    for (let i = 1; i < q.length; i += 2) { if (r() < 0.55) continue; const a = r() * Math.PI * 2, L = r.range(w * 0.7, w * 1.6); ctx.moveTo(q[i][0] + Math.cos(a) * w * 0.4, q[i][1] + Math.sin(a) * w * 0.4); ctx.lineTo(q[i][0] + Math.cos(a) * L, q[i][1] + Math.sin(a) * L); }
    ctx.stroke();
    // a darker dot where the tip paused at the start
    ctx.fillStyle = K.rgba(col, 0.6); ctx.beginPath(); ctx.arc(q[0][0], q[0][1], w * 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    return q[q.length - 1];
  }
  function inkText(ctx, text, x, y, p, o) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 52) * s, col = o.color || INK.black;
    ctx.save(); ctx.font = K.font(size, FONT, 400);
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    const n = Math.ceil(text.length * K.clamp(p)), r = K.rng(o.seed || 7);
    let cx = x0;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i], cw = ctx.measureText(ch).width, rot = (r() - 0.5) * 0.08, dy = (r() - 0.5) * 4 * s;
      if (i < n) {
        ctx.save(); ctx.translate(cx, y + dy + (o.slope || 0) * (cx - x0)); ctx.rotate(rot + (o.slope || 0));
        ctx.fillStyle = K.rgba(col, 0.2); ctx.shadowColor = K.rgba(col, 0.55); ctx.shadowBlur = 4 * s; ctx.fillText(ch, 0, 0);
        ctx.shadowBlur = 0; ctx.fillStyle = K.rgba(col, 0.93); ctx.fillText(ch, 0, 0); ctx.restore();
      }
      cx += cw;
    }
    ctx.restore(); return { w, h: size };
  }

  function table(W, H) {
    return K.cached(`nap-table:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), r = K.rng(8), nz = K.noise(9);
      const ph = 150 * s;
      for (let py = -r() * ph, k = 0; py < H; py += ph, k++) {
        const base = K.mix('#8a5532', '#6d3f22', r());
        const g = x.createLinearGradient(0, py, 0, py + ph); g.addColorStop(0, K.rgba(K.mix(base, [255, 210, 160], 0.08))); g.addColorStop(1, K.rgba(K.mix(base, [0, 0, 0], 0.15)));
        x.fillStyle = g; x.fillRect(0, py, W, ph);
        // grain: long wavy lines
        for (let i = 0; i < 26; i++) {
          const y0 = py + r() * ph, a = r.range(0.08, 0.22); x.strokeStyle = `rgba(${r() < 0.6 ? '50,25,10' : '200,140,90'},${a})`; x.lineWidth = r.range(0.7, 2.2) * s;
          x.beginPath(); for (let gx = 0; gx <= W; gx += 20 * s) { const yy = y0 + nz.n2(gx * 0.004, y0 * 0.01 + k) * 9 * s; gx ? x.lineTo(gx, yy) : x.moveTo(gx, yy); } x.stroke();
        }
        // a knot now and then
        if (r() < 0.6) { const kx = r() * W, ky = py + r.range(0.3, 0.7) * ph; for (let i = 0; i < 6; i++) { x.strokeStyle = `rgba(50,25,10,${0.25 - i * 0.03})`; x.lineWidth = 1.5 * s; x.beginPath(); x.ellipse(kx, ky, (8 + i * 7) * s, (4 + i * 3) * s, 0, 0, Math.PI * 2); x.stroke(); } }
        x.fillStyle = 'rgba(25,10,4,0.75)'; x.fillRect(0, py + ph - 3 * s, W, 3 * s);
        x.fillStyle = 'rgba(255,220,180,0.12)'; x.fillRect(0, py + ph, W, 1.5 * s);
      }
      // warm window light from the top-left
      const lg = x.createRadialGradient(W * 0.2, H * 0.1, 0, W * 0.3, H * 0.3, Math.hypot(W, H) * 0.8);
      lg.addColorStop(0, 'rgba(255,220,170,0.18)'); lg.addColorStop(1, 'rgba(20,8,2,0.35)'); x.fillStyle = lg; x.fillRect(0, 0, W, H);
      return c;
    });
  }

  // the napkin: tissue fibres, crumple relief, quarter folds, embossed border, a coffee ring
  function napkin(W, H, seed = 1) {
    return K.cached(`nap-napkin:${W}x${H}:${seed}`, () => {
      const [, , nw, nh] = napRect(W, H), s = S(W, H), pad = 24 * s, cw = Math.ceil(nw + pad * 2), ch = Math.ceil(nh + pad * 2);
      const c = K.layer(cw, ch), x = c.getContext('2d'), r = K.rng(seed * 13 + 1);
      // ragged outline
      const edge = []; const n = 120;
      for (let i = 0; i < n; i++) { const k = i / n, side = Math.floor(k * 4), f = (k * 4) % 1, j = () => r.range(-2, 2) * s;
        edge.push(side === 0 ? [pad + f * nw, pad + j()] : side === 1 ? [pad + nw + j(), pad + f * nh] : side === 2 ? [pad + nw - f * nw, pad + nh + j()] : [pad + j(), pad + nh - f * nh]); }
      x.save(); x.shadowColor = 'rgba(30,12,0,0.45)'; x.shadowBlur = 18 * s; x.shadowOffsetY = 6 * s; x.fillStyle = NAP; K.poly(x, edge, true); x.fill(); x.restore();
      x.save(); K.poly(x, edge, true); x.clip();
      // per-pixel tissue: fibres + crumple shading from a ridged noise height field
      const img = x.getImageData(0, 0, cw, ch), d = img.data, nz = K.noise(seed * 7 + 3), [br, bg, bb] = K.hex(NAP);
      for (let y = 0; y < ch; y++) for (let i = 0; i < cw; i++) {
        const o = (y * cw + i) * 4; if (d[o + 3] < 10) continue;
        const u = i / (s * 1), v = y / (s * 1);
        // crumple facets: ridged noise height, lit from the top-left by its finite difference
        const hgt = (a, b) => 1 - Math.abs(nz.fbm2(a * 0.011, b * 0.011, 3)) * 2;
        const h0 = hgt(u, v), shade = (hgt(u - 2, v - 2) - h0) * 2.2 + nz.fbm2(u * 0.004, v * 0.004, 2) * 0.25;
        const fib = nz.n2(u * 0.6, v * 0.06) * 0.03 + nz.n2(u * 0.05, v * 0.7) * 0.03 + (r() - 0.5) * 0.04;
        const k = 1 + K.clamp(shade, -0.6, 0.6) * 0.13 + fib;
        d[o] = Math.min(255, br * k); d[o + 1] = Math.min(255, bg * k); d[o + 2] = Math.min(255, bb * k * 0.995);
      }
      x.putImageData(img, 0, 0);
      // quarter-fold creases
      const cr = (a, b) => { x.strokeStyle = 'rgba(120,110,95,0.35)'; x.lineWidth = 2 * s; x.beginPath(); x.moveTo(a[0], a[1]); x.lineTo(b[0], b[1]); x.stroke(); x.strokeStyle = 'rgba(255,255,255,0.7)'; x.lineWidth = 1.5 * s; x.beginPath(); x.moveTo(a[0] + 2 * s, a[1] + 2 * s); x.lineTo(b[0] + 2 * s, b[1] + 2 * s); x.stroke(); };
      cr([pad + nw / 2, pad], [pad + nw / 2, pad + nh]); cr([pad, pad + nh / 2], [pad + nw, pad + nh / 2]);
      // embossed border: a ring of little pressed flowers + a double line, each as a shadow/highlight pair
      const bi = 26 * s;
      const emb = (fn) => { x.save(); x.translate(1.2 * s, 1.2 * s); x.strokeStyle = 'rgba(255,255,255,0.9)'; fn(); x.restore(); x.save(); x.strokeStyle = 'rgba(140,128,110,0.45)'; fn(); x.restore(); };
      emb(() => { x.lineWidth = 1.4 * s; x.strokeRect(pad + bi, pad + bi, nw - bi * 2, nh - bi * 2); x.strokeRect(pad + bi * 0.55, pad + bi * 0.55, nw - bi * 1.1, nh - bi * 1.1); });
      const flower = (fx, fy) => { x.beginPath(); for (let k = 0; k < 4; k++) { const a = (k * Math.PI) / 2; x.moveTo(fx + Math.cos(a) * 2 * s, fy + Math.sin(a) * 2 * s); x.arc(fx + Math.cos(a) * 4 * s, fy + Math.sin(a) * 4 * s, 2.4 * s, a + Math.PI, a + Math.PI * 3); } x.stroke(); };
      const step = 34 * s, b2 = bi * 0.78;
      emb(() => { x.lineWidth = 1 * s; for (let fx = pad + bi; fx < pad + nw - bi; fx += step) { flower(fx, pad + b2); flower(fx, pad + nh - b2); } for (let fy = pad + bi; fy < pad + nh - bi; fy += step) { flower(pad + b2, fy); flower(pad + nw - b2, fy); } });
      // coffee ring: an uneven brown annulus, darker at the rim where it dried
      if (seed === 1) {
        const cx = pad + nw * 0.86, cy = pad + nh * 0.2, R = 66 * s;
        for (let i = 0; i < 3; i++) { x.strokeStyle = `rgba(120,70,30,${0.16 - i * 0.04})`; x.lineWidth = (5 + i * 5) * s; x.beginPath(); x.arc(cx + i * 2 * s, cy - i * s, R - i * 3 * s, 0.3, Math.PI * 2 - 0.2); x.stroke(); }
        const g = x.createRadialGradient(cx, cy, R * 0.2, cx, cy, R); g.addColorStop(0, 'rgba(150,95,45,0.03)'); g.addColorStop(1, 'rgba(150,95,45,0.09)'); x.fillStyle = g; x.beginPath(); x.arc(cx, cy, R, 0, Math.PI * 2); x.fill();
      }
      x.restore();
      return c;
    });
  }
  function cup(ctx, W, H, s) {
    const portrait = H > W, cx = portrait ? W * 0.9 : W - 60 * s, cy = portrait ? H * 0.065 : 92 * s, R = (portrait ? 120 : 112) * s;
    ctx.save();
    ctx.fillStyle = 'rgba(20,8,0,0.35)'; ctx.beginPath(); ctx.ellipse(cx + 12 * s, cy + 16 * s, R * 1.25, R * 1.2, 0, 0, Math.PI * 2); ctx.fill();
    let g = ctx.createRadialGradient(cx - R * 0.3, cy - R * 0.3, R * 0.2, cx, cy, R * 1.22); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#d6d1c8');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 1.2, 0, Math.PI * 2); ctx.fill(); // saucer
    ctx.fillStyle = '#f4f1ec'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.82, 0, Math.PI * 2); ctx.fill();
    g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 0.66); g.addColorStop(0, '#8a5a34'); g.addColorStop(0.75, '#5c3418'); g.addColorStop(1, '#3a1e0a');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R * 0.66, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(240,220,190,0.85)'; ctx.beginPath(); ctx.moveTo(cx, cy + R * 0.22); ctx.bezierCurveTo(cx - R * 0.42, cy - R * 0.05, cx - R * 0.18, cy - R * 0.38, cx, cy - R * 0.14); ctx.bezierCurveTo(cx + R * 0.18, cy - R * 0.38, cx + R * 0.42, cy - R * 0.05, cx, cy + R * 0.22); ctx.fill();
    ctx.restore();
  }
  function marker(ctx, at, s, lying, W, H) {
    ctx.save();
    if (lying) { const portrait = H > W; ctx.translate(portrait ? W * 0.82 : 70 * s, portrait ? H * 0.955 : H - 120 * s); ctx.rotate(portrait ? -0.25 : -1.1); }
    else { ctx.translate(at[0], at[1]); ctx.rotate(-0.85); }
    ctx.scale(s, s);
    ctx.fillStyle = 'rgba(10,4,0,0.3)'; ctx.fillRect(10, 8, 190, 22);
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, -6); ctx.lineTo(16, 6); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1b1b1b'; ctx.fillRect(16, -11, 54, 22); ctx.fillStyle = '#c8c8c8'; ctx.fillRect(70, -12, 10, 24);
    const g = ctx.createLinearGradient(0, -12, 0, 12); g.addColorStop(0, '#3a3a3a'); g.addColorStop(0.4, '#151515'); g.addColorStop(1, '#050505');
    ctx.fillStyle = g; ctx.fillRect(80, -12, 120, 24); ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(84, -9, 110, 3);
    ctx.restore();
  }

  const style = {
    id: 'napkin-sketch', name: 'Napkin Sketch', family: 'Hand-Drawn',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Permanent+Marker&display=block', specs: ['400 52px "Permanent Marker"'] }],
    palette: { bg: '#7a4a2a', napkin: NAP, ink: INK.black, accent: INK.red, blue: INK.blue },
    sfx: { draw: 'marker', land: 'pop', emphasis: 'stamp', transition: 'paper', bed: 'crowd' },
    setup(W, H) { table(W, H); napkin(W, H, 1); napkin(W, H, 2); },

    background(ctx, W, H, t, o = {}) {
      const s = S(W, H), [nx, ny, nw, nh] = napRect(W, H), pad = 24 * s;
      ctx.drawImage(table(W, H), 0, 0);
      if (o.pile) { ctx.save(); ctx.translate(nx + nw / 2, ny + nh / 2); ctx.rotate(-0.045); ctx.drawImage(napkin(W, H, 1), -nw / 2 - pad, -nh / 2 - pad); ctx.restore(); }
      // the napkin breathes a little, as if just set down
      const b = 1 + 0.0025 * Math.sin(t * 1.3);
      ctx.save(); ctx.translate(nx + nw / 2, ny + nh / 2); ctx.scale(b, b); ctx.rotate(o.pile ? 0.012 : -0.008);
      ctx.drawImage(napkin(W, H, o.pile ? 2 : 1), -nw / 2 - pad, -nh / 2 - pad); ctx.restore();
      cup(ctx, W, H, s);
    },

    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.4, '#1a0a02');
      K.grain(ctx, W, H, t, 0.045, 24, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return inkText(ctx, text, x, y, p, { size: 50, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return inkText(ctx, text, x, y, p, { size: 34, ...o }); },
    arrow(ctx, from, to, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || INK.black;
      const pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.2, 30), 2.2 * s, o.seed || 3, 0.05);
      const e = sharpie(ctx, pts, K.clamp(p / 0.8), { color: col, width: 5.5, seed: o.seed });
      if (p > 0.8) { const k = K.clamp((p - 0.8) / 0.2), b = pts[pts.length - 1], a = pts[pts.length - 6], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 22 * s;
        // a fast check-mark style head: one flick out and back
        sharpie(ctx, [[b[0] - Math.cos(ang - 0.55) * L, b[1] - Math.sin(ang - 0.55) * L], b, [b[0] - Math.cos(ang + 0.55) * L, b[1] - Math.sin(ang + 0.55) * L]], k, { color: col, width: 5.5, seed: (o.seed || 3) + 1 }); }
      return e;
    },
    box(ctx, x, y, w, h, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), r = K.rng(o.seed || 5);
      // one quick loop that does not quite close, the way a box gets scrawled mid-conversation
      const pts = K.wobble([[x + w * 0.04, y + r.range(-4, 4) * s], [x + w + r.range(0, 8) * s, y + r.range(-6, 2) * s], [x + w + r.range(-4, 4) * s, y + h + r.range(0, 6) * s], [x + r.range(-6, 0) * s, y + h], [x - r.range(2, 8) * s, y - r.range(6, 12) * s]].flatMap((pt, i, arr) => i ? K.bezier(arr[i - 1], arr[i - 1], pt, pt, 10).slice(1) : [pt]), 1.6 * s, o.seed || 5, 0.04);
      return sharpie(ctx, pts, p, { color: o.color, width: 6, seed: o.seed });
    },
    counter(ctx, value, x, y, p, o = {}) {
      return inkText(ctx, K.fmt(value), x, y, 1, { size: o.size || 118, align: o.align || 'center', color: o.color || INK.black, seed: 11 + Math.floor(value / 125000) });
    },
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      const pts = K.wobble(K.circlePts(x, y, r * 1.25, r * 0.6, 80, -2.8, Math.PI * 2.35), 4 * s, o.seed || 13, 0.03);
      sharpie(ctx, pts, p, { color: o.color || INK.red, width: 7, seed: o.seed || 13 });
      if (p > 0.85) { const k = K.clamp((p - 0.85) / 0.15); for (let i = 0; i < 3; i++) { const a = -0.9 + i * 0.35; sharpie(ctx, [[x + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 0.75], [x + Math.cos(a) * r * 1.6, y + Math.sin(a) * r * 0.95]], k, { color: o.color || INK.red, width: 5, seed: 80 + i }); } }
    },

    // a fresh napkin is slapped down on top of the pile (covered at 0.5); it lands with a little skid
    transition(ctx, W, H, p, o = {}) {
      if (p >= 0.5) return;
      const s = S(W, H), [nx, ny, nw, nh] = napRect(W, H), pad = 24 * s, k = K.ease.in(K.clamp(p / 0.5));
      const cx = K.lerp(W * 1.25, nx + nw / 2, k), cy = K.lerp(-H * 0.35, ny + nh / 2, k), rot = K.lerp(0.5, 0.012, k), sc = K.lerp(1.12, 1, k);
      ctx.save();
      ctx.fillStyle = `rgba(20,8,0,${0.25 * (1 - k) + 0.1})`; ctx.translate(cx + 30 * s * (1 - k), cy + 40 * s * (1 - k)); ctx.rotate(rot); ctx.fillRect(-nw / 2, -nh / 2, nw, nh);
      ctx.restore();
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.scale(sc, sc); ctx.drawImage(napkin(W, H, 2), -nw / 2 - pad, -nh / 2 - pad); ctx.restore();
    },
  };

  // ---------- demo: the cafe-table pitch ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, video: [212 * s, 250 * s, 220 * s, 140 * s], node: [520 * s, 262 * s, 250 * s, 116 * s],
      chips: PLATFORMS.map((n, i) => [860 * s, (166 + i * 68) * s]), title: [640 * s, 118 * s], counter: [640 * s, 396 * s] };
    return { s, video: [W * 0.28, H * 0.285, W * 0.44, H * 0.09], node: [W * 0.2, H * 0.455, W * 0.6, H * 0.065],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.57 : W * 0.43, H * (0.6 + Math.floor(i / 2) * 0.075)]), title: [W / 2, H * 0.19], counter: [W / 2, H * 0.5] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, portrait = H > W;
      // camera starts tight on the scrawled hook, then pulls back to the whole napkin
      const cam = K.camAt([[0, { x: Lo.title[0], y: Lo.title[1] + 30 * s, zoom: 1.45 }], [1.4, { x: Lo.title[0], y: Lo.title[1] + 60 * s, zoom: 1.35 }], [2.4, { x: W / 2, y: H / 2, zoom: 1 }], [12, { x: W / 2, y: H / 2, zoom: 1 }]], t);
      const zc = cam.zoom || 1; cam.x = K.clamp(cam.x, W / 2 / zc, W - W / 2 / zc); cam.y = K.clamp(cam.y, H / 2 / zc, H - H / 2 / zc);
      ctx.save(); K.camera(ctx, W, H, cam);
      const scene2 = t >= 8.0;
      style.background(ctx, W, H, t, { pile: scene2 });
      let tip = null, tipCol = INK.black; const track = (pt, p, c = INK.black) => { if (p > 0 && p < 1 && pt) { tip = pt; tipCol = c; } };
      if (!scene2) {
        const tt = portrait ? ['One video.', 'Every platform.'] : ['One video. Every platform.'], tp = K.beat(t, 0.15, 1.4, 'lin');
        tt.forEach((ln, i) => style.title(ctx, ln, Lo.title[0], Lo.title[1] + i * 66 * s, K.clamp(tp * tt.length - i), { size: portrait ? 50 : 48, align: 'center', slope: -0.012 }));
        const ul = portrait ? [[W * 0.18, Lo.title[1] + 92 * s], [W * 0.82, Lo.title[1] + 84 * s]] : [[330 * s, 146 * s], [950 * s, 138 * s]];
        const up = K.beat(t, 1.5, 0.3, 'lin'); track(sharpie(ctx, K.wobble(K.bezier(ul[0], ul[0], ul[1], ul[1], 20), 2 * s, 4), up, { width: 6, seed: 4 }), up);
        const [vx, vy, vw, vh] = Lo.video, bp = K.beat(t, 2.0, 0.6, 'lin');
        track(style.box(ctx, vx, vy, vw, vh, bp, { seed: 21 }), bp);
        if (t > 2.6) { const pp = K.beat(t, 2.6, 0.3, 'lin'); track(sharpie(ctx, K.wobble([[vx + vw * 0.42, vy + vh * 0.28], [vx + vw * 0.42, vy + vh * 0.72], [vx + vw * 0.64, vy + vh * 0.5], [vx + vw * 0.42, vy + vh * 0.28]], 1.5 * s, 22), pp, { width: 6, seed: 22 }), pp); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 48 * s, K.beat(t, 2.95, 0.45, 'lin'), { align: 'center', color: INK.blue });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = portrait ? [[vx + vw / 2, vy + vh + 66 * s], [nx + nw / 2, ny - 14 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - 16 * s, ny + nh / 2]];
        const ap = K.beat(t, 3.45, 0.5, 'lin'); track(style.arrow(ctx, a1[0], a1[1], ap, { seed: 31, bend: portrait ? 0.12 : -0.2 }), ap);
        const np = K.beat(t, 4.0, 0.55, 'lin'); track(style.box(ctx, nx, ny, nw, nh, np, { seed: 41 }), np);
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 16 * s, K.beat(t, 4.5, 0.45, 'lin'), { size: 42, align: 'center' });
        if (portrait) { const yl = Lo.chips[6][1] - 12 * s, p2 = K.beat(t, 4.95, 0.4, 'lin'); track(sharpie(ctx, K.wobble([[W / 2, ny + nh + 14 * s], [W / 2, yl]], 2 * s, 49), p2, { width: 5.5, seed: 49 }), p2); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.28, 'lin');
          const from = portrait ? [W / 2, cy - 12 * s] : [nx + nw + 14 * s, ny + nh / 2], to = portrait ? [left ? W * 0.45 : W * 0.55, cy - 12 * s] : [cx - 16 * s, cy - 11 * s];
          track(style.arrow(ctx, from, to, p, { seed: 50 + i, bend: portrait ? 0.05 : (i - 3) * 0.04 }), p);
          style.label(ctx, name, portrait ? (left ? W * 0.43 : W * 0.57) : cx, cy, K.beat(t, t0 + 0.24, 0.28, 'lin'), { size: portrait ? 36 : 34, align: portrait ? (left ? 'right' : 'left') : 'left', seed: 60 + i });
        });
      } else {
        const [, , nw, nh] = Lo.node, top = portrait ? H * 0.25 : 120 * s, bx = W / 2 - nw / 2, by = top - nh / 2;
        const rp = K.beat(t, 8.25, 0.45, 'lin'); track(style.box(ctx, bx, by, nw, nh, rp, { seed: 41 }), rp);
        style.title(ctx, 'Creator OS', W / 2, top + 16 * s, K.beat(t, 8.5, 0.35, 'lin'), { size: 42, align: 'center' });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t > 8.6) style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 96 : 118 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 60 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 40, color: INK.blue });
        const ep = K.beat(t, 10.0, 0.5, 'lin'); track(null, 0);
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 34 * s, (portrait ? 230 : 250) * s, ep, {});
        if (ep > 0 && ep < 1) { const a = -2.8 + Math.PI * 2.35 * ep; tip = [Lo.counter[0] + Math.cos(a) * (portrait ? 230 : 250) * s * 1.25, Lo.counter[1] - 34 * s + Math.sin(a) * (portrait ? 230 : 250) * s * 0.6]; tipCol = INK.red; }
        const tk = portrait ? ['Post once.', 'Reach everywhere.'] : ['Post once. Reach everywhere.'], tp = K.beat(t, 10.5, 0.9, 'lin');
        tk.forEach((ln, i) => style.title(ctx, ln, W / 2, (portrait ? H * 0.74 : 624 * s) + i * 70 * s, K.clamp(tp * tk.length - i), { size: portrait ? 50 : 44, align: 'center' }));
      }
      ctx.restore();
      ctx.save(); K.camera(ctx, W, H, cam); if (t > 7.5 && t < 8.0) style.transition(ctx, W, H, K.clamp((t - 7.5) / 1.0), {}); ctx.restore();
      style.finish(ctx, W, H, t);
      // the marker in hand (tip mapped from world to screen through the camera), or lying on the table
      const z = cam.zoom || 1, scr = tip && [(tip[0] - cam.x) * z + W / 2, (tip[1] - cam.y) * z + H / 2];
      marker(ctx, scr, s * z, !tip, W, H);
    },
    score(k) {
      k.bed('crowd', 0, 12, 0.7);
      k.play('scribble', 0.15, { medium: 'marker', dur: 1.4 }); k.play('scribble', 1.5, { medium: 'marker', dur: 0.3 });
      k.play('scribble', 2.0, { medium: 'marker', dur: 0.6 }); k.play('scribble', 2.6, { medium: 'marker', dur: 0.3 });
      k.play('scribble', 2.95, { medium: 'marker', dur: 0.45, gain: 0.7 });
      k.play('scribble', 3.45, { medium: 'marker', dur: 0.5 }); k.play('pop', 3.95);
      k.play('scribble', 4.0, { medium: 'marker', dur: 0.55 }); k.play('scribble', 4.5, { medium: 'marker', dur: 0.45 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'marker', dur: 0.28, gain: 0.8 }); k.play('pop', 5.26 + i * 0.4, { pitch: 1 + i * 0.06, gain: 0.8 }); }
      k.play('whoosh', 7.5, { dur: 0.45, gain: 0.7 }); k.play('paper', 7.85, { dur: 0.3, gain: 1.4 }); k.play('thud', 7.98, { gain: 0.5 });
      k.play('scribble', 8.25, { medium: 'marker', dur: 0.6 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0); k.play('scribble', 10.0, { medium: 'marker', dur: 0.5 });
      k.play('scribble', 10.5, { medium: 'marker', dur: 0.9 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
