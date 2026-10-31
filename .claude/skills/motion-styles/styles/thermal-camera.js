// Thermal Camera (Light & Imaging). Everything is filmed through a handheld IR camera: objects are painted as
// temperature into a soft low-res heat field, which the camera maps through an ironbow palette with auto-gain,
// edge enhancement, fixed-pattern and temporal sensor noise. The camera's own HUD does the explaining: tag labels,
// spot meter, measurement box, scale bar and live readouts. Scene changes are the shutter-calibration (NUC) click.
//
// How the layers work: primitives that are physical (title, box, arrow, counter) paint grey levels into a half-res
// heat layer; HUD primitives (label, emphasis) draw crisp on the frame. finish() colours the heat field and lays it
// UNDER the HUD with destination-over, then adds the camera chrome on top.
(function () {
  const ID = 'thermal-camera';
  const C = { black: '#05020f', indigo: '#2a0a6e', purple: '#7a1aa0', magenta: '#c42a7a', red: '#ea4f2d', orange: '#f8901a', yellow: '#ffd23a', white: '#fffbe0', hud: '#ffffff', cold: '#46a8ff', hot: '#ff3b2f' };
  const HF = 'IBM Plex Mono', SF = 'Inter';
  const S = (W, H) => K.layout(W, H).s;
  const cw = (ctx) => [ctx.canvas.width, ctx.canvas.height];
  const F = 2; // heat field is 1/F resolution
  const AMB = 62; // ambient grey level

  // ironbow lookup table
  const LUT = (() => {
    const stops = [[0, '#05020f'], [0.16, '#24096a'], [0.32, '#6b1798'], [0.47, '#b22783'], [0.6, '#e2492f'], [0.73, '#f68a17'], [0.86, '#ffcd33'], [1, '#fffbe2']];
    const out = new Uint8ClampedArray(256 * 3);
    for (let i = 0; i < 256; i++) { const v = i / 255; let k = 0; while (k < stops.length - 2 && v > stops[k + 1][0]) k++; const u = (v - stops[k][0]) / (stops[k + 1][0] - stops[k][0]), c = K.mix(stops[k][1], stops[k + 1][1], K.clamp(u)); out[i * 3] = c[0]; out[i * 3 + 1] = c[1]; out[i * 3 + 2] = c[2]; }
    return out;
  })();

  // ---------- heat layer ----------
  function heatCtx(W, H) {
    const c = K.cached(`${ID}:heat:${W}x${H}`, () => K.layer(Math.ceil(W / F), Math.ceil(H / F)));
    const x = c.getContext('2d'); x.setTransform(1 / F, 0, 0, 1 / F, 0, 0); return x;
  }
  const grey = (v, a = 1) => `rgba(${v | 0},${v | 0},${v | 0},${a})`;
  // The room as seen in IR: cold window, warm desk, a radiator, mottled walls (static, cached).
  function roomPlate(W, H) {
    return K.cached(`${ID}:room:${W}x${H}`, () => {
      const c = K.layer(Math.ceil(W / F), Math.ceil(H / F)), x = c.getContext('2d'), s = S(W, H), P = H > W;
      x.setTransform(1 / F, 0, 0, 1 / F, 0, 0);
      x.fillStyle = grey(AMB); x.fillRect(0, 0, W, H);
      const nz = K.noise(21), r = K.rng(22);
      for (let i = 0; i < 30; i++) { const px = r() * W, py = r() * H, rad = (80 + r() * 260) * s, g = x.createRadialGradient(px, py, 0, px, py, rad), v = AMB + nz.n2(i, 0.5) * 22; g.addColorStop(0, grey(v, 0.5)); g.addColorStop(1, grey(v, 0)); x.fillStyle = g; x.fillRect(px - rad, py - rad, rad * 2, rad * 2); }
      // cold window panes (night outside)
      const wx = P ? W * 0.06 : W * 0.025, wy = P ? H * 0.8 : H * 0.14, ww = P ? W * 0.28 : W * 0.12, wh = P ? H * 0.08 : H * 0.2;
      if (!P) { x.fillStyle = grey(26); x.fillRect(wx, wy, ww, wh); x.fillStyle = grey(44); x.fillRect(wx + ww / 2 - 4 * s, wy, 8 * s, wh); x.fillRect(wx, wy + wh / 2 - 4 * s, ww, 8 * s); }
      // desk edge (warmer wood under the lamp)
      const dy = H * (P ? 0.9 : 0.86); const dg = x.createLinearGradient(0, dy, 0, H); dg.addColorStop(0, grey(96)); dg.addColorStop(1, grey(74)); x.fillStyle = dg; x.fillRect(0, dy, W, H - dy);
      // radiator fins under the window
      return c;
    });
  }
  // Hot text: warm glyphs in the heat field (the words are literally warm).
  function heatText(hx, text, x, y, size, level, o = {}) {
    hx.save(); hx.font = K.font(size, o.font || SF, o.weight || 800); hx.textBaseline = 'alphabetic';
    let lines = [text]; if (o.maxW && hx.measureText(text).width > o.maxW) lines = K.wrap(hx, text, o.maxW);
    const lh = size * 1.1, words = text.split(' ').length; let wi = 0, w = 0;
    lines.forEach((ln, li) => {
      const lw = hx.measureText(ln).width; w = Math.max(w, lw);
      let cx = o.align === 'center' ? x - lw / 2 : o.align === 'right' ? x - lw : x;
      for (const wd of ln.split(' ')) {
        const k = typeof level === 'function' ? level(wi, words) : level; wi++;
        if (k > 0) { hx.globalCompositeOperation = 'lighter'; hx.fillStyle = grey(190 * k); hx.fillText(wd, cx, y - (lines.length - 1 - li) * lh); }
        cx += hx.measureText(wd + ' ').width;
      }
    });
    hx.restore();
    return { w, h: lh * lines.length };
  }
  function blob(hx, x, y, r, v) { const g = hx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, grey(v, 1)); g.addColorStop(1, grey(v, 0)); hx.save(); hx.globalCompositeOperation = 'lighter'; hx.fillStyle = g; hx.fillRect(x - r, y - r, r * 2, r * 2); hx.restore(); }

  // HUD helpers (crisp, on the frame)
  function hudText(ctx, text, x, y, size, o = {}) {
    ctx.save(); ctx.font = K.font(size, o.font || HF, o.weight || 600); ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'alphabetic';
    ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 4; ctx.fillStyle = o.color || C.hud; ctx.fillText(text, x, y); ctx.restore();
  }
  function hudBox(ctx, x, y, w, h, s) { ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, w, h); ctx.restore(); }

  const style = {
    id: ID, name: 'Thermal Camera', family: 'Light & Imaging',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@500;600;700&family=Inter:wght@700;800&display=block', specs: ['600 30px "IBM Plex Mono"', '700 22px "IBM Plex Mono"', '800 64px "Inter"'] }],
    palette: { bg: C.indigo, ...C },
    sfx: { draw: null, land: 'blip', emphasis: 'ding', transition: 'click', bed: 'hum' },
    setup(W, H) { roomPlate(W, H); },

    background(ctx, W, H, t) {
      const hx = heatCtx(W, H);
      hx.save(); hx.setTransform(1, 0, 0, 1, 0, 0); hx.globalCompositeOperation = 'copy'; hx.drawImage(roomPlate(W, H), 0, 0); hx.restore();
    },

    finish(ctx, W, H, t) {
      const s = S(W, H), hx = heatCtx(W, H), hc = hx.canvas, w = hc.width, h = hc.height;
      // optics softness
      const soft = K.cached(`${ID}:soft:${w}x${h}`, () => K.layer(w, h)), sx = soft.getContext('2d', { willReadFrequently: true });
      sx.globalCompositeOperation = 'copy'; sx.filter = 'blur(1.3px)'; sx.drawImage(hc, 0, 0); sx.filter = 'none';
      const src = sx.getImageData(0, 0, w, h).data;
      const out = K.cached(`${ID}:out:${w}x${h}`, () => { const c = K.layer(w, h); return { c, img: c.getContext('2d').createImageData(w, h) }; });
      const d = out.img.data, r = K.rng(Math.floor(t * 30) * 7 + 1);
      const fpn = K.cached(`${ID}:fpn:${w}`, () => { const a = new Float32Array(w), rr = K.rng(5); for (let i = 0; i < w; i++) a[i] = (rr() - 0.5) * 5; return a; });
      // auto-gain settles in the first second
      const g = K.ease.out(K.clamp(t / 0.9)), lo = K.lerp(10, 34, g), hi = K.lerp(330, 236, g), k = 255 / (hi - lo);
      for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
          const i = (y * w + x) * 4, v = src[i];
          const e = x > 1 && y > 1 ? Math.abs(v - src[i - 8]) + Math.abs(v - src[i - w * 8]) : 0;
          let q = (v - lo) * k + fpn[x] + (r() - 0.5) * 9 + e * 0.9;
          q = q < 0 ? 0 : q > 255 ? 255 : q | 0;
          d[i] = LUT[q * 3]; d[i + 1] = LUT[q * 3 + 1]; d[i + 2] = LUT[q * 3 + 2]; d[i + 3] = 255;
        }
      }
      out.c.getContext('2d').putImageData(out.img, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'destination-over'; ctx.imageSmoothingEnabled = true; ctx.drawImage(out.c, 0, 0, W, H); ctx.restore();
      // camera chrome
      const P = H > W, m = 22 * s;
      hudText(ctx, 'ε 0.95   IRONBOW', W - (P ? 230 : 250) * s, m + 20 * s, 20 * s, { align: 'right', weight: 700 });
      ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * s; ctx.strokeRect(W - (P ? 215 : 235) * s, m + 6 * s, 36 * s, 17 * s); ctx.fillStyle = '#fff'; ctx.fillRect(W - (P ? 211 : 231) * s, m + 10 * s, 22 * s, 9 * s); ctx.fillRect(W - (P ? 178 : 198) * s, m + 11 * s, 3 * s, 7 * s); ctx.restore();
      hudText(ctx, 'AUTO', W - m - 40 * s, m + 20 * s, 20 * s, { weight: 700, align: 'right' });
      // scale bar
      const bx = W - m - 22 * s, by = m + 70 * s, bh = H - by - (P ? 160 : 110) * s;
      const sg = ctx.createLinearGradient(0, by + bh, 0, by); for (let i = 0; i <= 8; i++) { const q = Math.round((i / 8) * 255); sg.addColorStop(i / 8, `rgb(${LUT[q * 3]},${LUT[q * 3 + 1]},${LUT[q * 3 + 2]})`); }
      ctx.fillStyle = sg; ctx.fillRect(bx, by, 16 * s, bh); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.5 * s; ctx.strokeRect(bx, by, 16 * s, bh);
      const tmax = (61.5 + Math.sin(t * 1.3) * 1.2 + (1 - g) * 20).toFixed(1), tmin = (16.0 + Math.sin(t * 0.7) * 0.3).toFixed(1);
      hudText(ctx, tmax, bx + 16 * s, by - 12 * s, 22 * s, { align: 'right', weight: 700 }); hudText(ctx, tmin, bx + 16 * s, by + bh + 28 * s, 22 * s, { align: 'right', weight: 700 }); hudText(ctx, '°C', bx + 16 * s, by + bh + 54 * s, 20 * s, { align: 'right' });
      // timestamp from the scene clock (no wall clock)
      const sec = 11 + Math.floor(t), stamp = `2026-10-20  23:41:${String(sec).padStart(2, '0')}`;
      hudText(ctx, stamp, m + 8 * s, H - m - 6 * s, 20 * s, { weight: 600 });
      ctx.save(); ctx.globalCompositeOperation = 'overlay'; K.grain(ctx, W, H, t, 0.05, 30, 'overlay'); ctx.restore();
    },

    // Heat title: each word warms up in turn.
    title(ctx, text, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H);
      return heatText(heatCtx(W, H), text, x, y, (o.size || 64) * s, (i, n) => K.clamp(p * (n + 0.8) - i) * (o.heat ?? 1), { align: o.align, maxW: o.maxW, font: o.font, weight: o.weight });
    },
    // HUD tag label: crisp white mono on a dark chip, optional leader line to what it tags.
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return { w: 0, h: 0 };
      const [W, H] = cw(ctx), s = S(W, H), size = (o.size || 30) * s;
      ctx.save(); ctx.font = K.font(size, HF, 600);
      const n = Math.ceil(text.length * K.clamp(p * 1.5)), shown = text.slice(0, n), tw = ctx.measureText(text).width;
      const x0 = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x;
      if (o.lead) { ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = 1.5 * s; ctx.beginPath(); ctx.moveTo(o.lead[0], o.lead[1]); ctx.lineTo(o.align === 'right' ? x0 + tw + 8 * s : x0 - 8 * s, y - size * 0.35); ctx.stroke(); }
      hudBox(ctx, x0 - 8 * s, y - size * 0.95, tw + 16 * s, size * 1.3, s);
      ctx.restore();
      hudText(ctx, shown, x0, y, size, { color: o.color, weight: 600 });
      return { w: tw, h: size };
    },
    // A heat stream along the path with a hot pulse at its head (it is the flow itself).
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const [W, H] = cw(ctx), s = S(W, H), hx = heatCtx(W, H);
      const pts = K.arcPts(from, to, o.bend ?? 0.12, 40), q = K.trim(pts, K.clamp(p));
      hx.save(); hx.globalCompositeOperation = 'lighter'; hx.lineCap = 'round'; hx.lineJoin = 'round';
      hx.strokeStyle = grey(55); hx.lineWidth = (o.w || 12) * s; K.poly(hx, q); hx.stroke();
      hx.strokeStyle = grey(60); hx.lineWidth = (o.w || 12) * s * 0.4; K.poly(hx, q); hx.stroke();
      const b = q[q.length - 1]; if (p < 1) blob(hx, b[0], b[1], 26 * s, 150);
      if (p >= 0.95) { // heat arrives: chevron of warmth at the tip
        const a = pts[pts.length - 5], e = pts[pts.length - 1], ang = Math.atan2(e[1] - a[1], e[0] - a[0]), L = 22 * s;
        hx.strokeStyle = grey(120); hx.lineWidth = 7 * s; hx.beginPath(); hx.moveTo(e[0] - Math.cos(ang - 0.6) * L, e[1] - Math.sin(ang - 0.6) * L); hx.lineTo(e[0], e[1]); hx.lineTo(e[0] - Math.cos(ang + 0.6) * L, e[1] - Math.sin(ang + 0.6) * L); hx.stroke();
      }
      hx.restore();
      return b;
    },
    // A warm device chassis: blades heat bottom to top as p rises.
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), hx = heatCtx(W, H), n = o.bands || 6;
      hx.save(); hx.globalCompositeOperation = 'lighter';
      hx.fillStyle = grey(30 * K.clamp(p * 3)); hx.beginPath(); hx.roundRect(x, y, w, h, 10 * s); hx.fill();
      hx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const k = K.clamp(p * (n + 2) - (n - 1 - i) - 1) * (o.heat ?? 1), by = y + 8 * s + i * (h - 16 * s) / n;
        hx.fillStyle = grey(70 + 40 * k); hx.fillRect(x + 10 * s, by + 3 * s, w - 20 * s, (h - 16 * s) / n - 6 * s);
        for (let j = 0; j < 6; j++) { hx.fillStyle = grey(50 * k); hx.fillRect(x + 18 * s + j * (w - 36 * s) / 6, by + 6 * s, (w - 36 * s) / 12, (h - 16 * s) / n - 12 * s); }
      }
      hx.restore();
    },
    // Hot digits in the field; the spot meter reads them.
    counter(ctx, value, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H);
      return heatText(heatCtx(W, H), K.fmt(Math.round(value)), x, y, (o.size || 120) * s, K.clamp(p) * (o.heat ?? 1.15), { align: o.align || 'center', weight: 800 });
    },
    // Measurement box Bx1: corner brackets snap in, a hot-spot triangle and a live max readout.
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), rw = r * (o.wide ?? 1.25), rh = r * (o.tall ?? 0.55), k = K.ease.back(K.clamp(p / 0.5));
      const bw = rw * (1.4 - 0.4 * k), bh = rh * (1.4 - 0.4 * k), L = 26 * s;
      ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2.5 * s; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 4;
      ctx.globalAlpha = K.clamp(p * 4);
      ctx.strokeRect(x - bw, y - bh, bw * 2, bh * 2);
      ctx.lineWidth = 5 * s;
      for (const [cx, cy, dx, dy] of [[x - bw, y - bh, 1, 1], [x + bw, y - bh, -1, 1], [x - bw, y + bh, 1, -1], [x + bw, y + bh, -1, -1]]) { ctx.beginPath(); ctx.moveTo(cx + dx * L, cy); ctx.lineTo(cx, cy); ctx.lineTo(cx, cy + dy * L); ctx.stroke(); }
      ctx.restore();
      if (p > 0.4) {
        const a = K.clamp((p - 0.4) * 4), tx = x + bw * 0.55, ty = y - bh * 0.55;
        ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = C.hot; ctx.beginPath(); ctx.moveTo(tx, ty - 10 * s); ctx.lineTo(tx + 10 * s, ty + 8 * s); ctx.lineTo(tx - 10 * s, ty + 8 * s); ctx.closePath(); ctx.fill(); ctx.restore();
        hudText(ctx, 'Bx1', x - bw + 6 * s, y - bh - 10 * s, 26 * s, { weight: 700 });
        hudText(ctx, `MAX ${(o.max ?? 98.6).toFixed(1)} °C`, x + bw, y - bh - 10 * s, 26 * s, { weight: 700, align: 'right', color: C.yellow });
      }
    },
    // NUC: the shutter drops (flat uniform field + click), recalibrates, opens on the new scene.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), closed = p > 0.3 && p < 0.7, k = closed ? 1 : p <= 0.3 ? K.clamp((p - 0.22) / 0.08) : K.clamp((0.78 - p) / 0.08);
      if (k <= 0) return;
      ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = '#5b1690'; ctx.fillRect(0, 0, W, H);
      const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.hypot(W, H) / 2); g.addColorStop(0, 'rgba(178,39,131,0.35)'); g.addColorStop(1, 'rgba(36,9,106,0.4)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      if (closed) { hudText(ctx, 'NUC', W / 2, H / 2 - 10 * s, 64 * s, { align: 'center', weight: 700 }); hudText(ctx, 'CALIBRATING', W / 2, H / 2 + 40 * s, 30 * s, { align: 'center', weight: 600 }); }
    },
  };

  // ---------- the shared demo: filmed through the IR camera ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 118 * s], laptop: [86 * s, 270 * s, 250 * s, 150 * s], node: [470 * s, 262 * s, 250 * s, 200 * s],
      chips: PLATFORMS.map((n, i) => [900 * s, (176 + i * 66) * s]), node2: [W / 2 - 110 * s, 64 * s, 220 * s, 150 * s], counter: [W / 2, 400 * s], take: [W / 2, 596 * s], mug: [1130 * s, 652 * s] };
    return { s, P: true, title: [W / 2, H * 0.145], laptop: [W * 0.27, H * 0.185, W * 0.46, H * 0.1], node: [W * 0.3, H * 0.43, W * 0.4, H * 0.12],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.6 + Math.floor(i / 2) * 0.07)]), node2: [W * 0.3, H * 0.1, W * 0.4, H * 0.1], counter: [W / 2, H * 0.44], take: [W / 2, H * 0.68], mug: [W * 0.8, H * 0.86] };
  }
  function laptop(hx, x, y, w, h, p, s, t) {
    if (p <= 0) return;
    hx.save(); hx.globalCompositeOperation = 'lighter';
    const k = K.clamp(p * 1.5);
    hx.fillStyle = grey(40 * k); hx.beginPath(); hx.roundRect(x, y, w, h, 8 * s); hx.fill();            // lid
    hx.fillStyle = grey(70 * k); hx.fillRect(x + 10 * s, y + 10 * s, w - 20 * s, h - 20 * s);         // backlit panel
    hx.fillStyle = grey(55 * k); hx.beginPath(); hx.moveTo(x - 20 * s, y + h + 22 * s); hx.lineTo(x + w + 20 * s, y + h + 22 * s); hx.lineTo(x + w, y + h); hx.lineTo(x, y + h); hx.closePath(); hx.fill(); // base
    const cx = x + w / 2, cy = y + h / 2, r = h * 0.25, pk = K.clamp((p - 0.4) / 0.4);
    hx.fillStyle = grey(110 * pk); hx.beginPath(); hx.moveTo(cx - r * 0.6, cy - r); hx.lineTo(cx + r, cy); hx.lineTo(cx - r * 0.6, cy + r); hx.closePath(); hx.fill();
    hx.restore();
  }
  function mug(hx, x, y, s, t) {
    hx.save(); hx.globalCompositeOperation = 'lighter';
    hx.fillStyle = grey(150); hx.beginPath(); hx.roundRect(x - 34 * s, y - 70 * s, 68 * s, 76 * s, 8 * s); hx.fill();
    hx.strokeStyle = grey(110); hx.lineWidth = 9 * s; hx.beginPath(); hx.arc(x + 36 * s, y - 34 * s, 18 * s, -1.3, 1.3); hx.stroke();
    for (let i = 0; i < 4; i++) { const ph = (t * 0.6 + i * 0.25) % 1; blob(hx, x + Math.sin(ph * 6 + i) * 14 * s, y - 80 * s - ph * 130 * s, (18 + ph * 20) * s, 40 * (1 - ph)); }
    hx.restore();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const hx = heatCtx(W, H);
      mug(hx, Lo.mug[0], Lo.mug[1], s, t);
      if (t < 8.25) {
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.3, 1.4, 'lin'), { size: P ? 58 : 64, align: 'center', maxW: W * 0.86 });
        const [lx, ly, lw, lh] = Lo.laptop, [nx, ny, nw, nh] = Lo.node;
        laptop(hx, lx, ly, lw, lh, K.beat(t, 2.0, 0.9, 'lin'), s, t);
        style.label(ctx, 'your video', lx + lw / 2, ly + lh + (P ? 76 : 70) * s, K.beat(t, 2.7, 0.5, 'lin'), { align: 'center' });
        const a1 = P ? [[lx + lw / 2, ly + lh + 92 * s], [nx + nw / 2, ny - 66 * s]] : [[lx + lw + 26 * s, ly + lh / 2], [nx - 18 * s, ny + nh / 2]];
        const ap = K.beat(t, 3.3, 0.8, 'lin'); const tip = style.arrow(ctx, a1[0], a1[1], ap, { bend: P ? 0.04 : -0.1 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 1.0, 'lin'), { bands: P ? 4 : 6 });
        style.label(ctx, 'Creator OS', nx + nw / 2, ny - 18 * s, K.beat(t, 4.4, 0.5, 'lin'), { align: 'center', size: 36 });
        // spot meter rides the heat into the node
        if (t > 3.3 && t < 4.4 && tip) { const at = t < 4.1 ? tip : a1[1]; ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(at[0], at[1], 12 * s, 0, 7); ctx.moveTo(at[0] - 26 * s, at[1]); ctx.lineTo(at[0] - 12 * s, at[1]); ctx.moveTo(at[0] + 12 * s, at[1]); ctx.lineTo(at[0] + 26 * s, at[1]); ctx.moveTo(at[0], at[1] - 26 * s); ctx.lineTo(at[0], at[1] - 12 * s); ctx.moveTo(at[0], at[1] + 12 * s); ctx.lineTo(at[0], at[1] + 26 * s); ctx.stroke(); ctx.restore(); hudText(ctx, `${(36 + ap * 26).toFixed(1)}°`, at[0] + 30 * s, at[1] - 16 * s, 26 * s, { weight: 700 }); }
        if (P) style.arrow(ctx, [W / 2, ny + nh + 12 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0, w: 10 });
        let landed = 0;
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.36, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const dev = P ? [left ? W * 0.44 : W * 0.56, cy - 12 * s] : [cx, cy - 12 * s];
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 14 * s, ny + nh / 2];
          const to = P ? [left ? dev[0] + 22 * s : dev[0] - 22 * s, dev[1]] : [dev[0] - 26 * s, dev[1]];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.32, 'lin'), { bend: P ? 0 : (i - 3) * 0.03, w: 9 });
          const warm = K.beat(t, t0 + 0.25, 0.5, 'lin');
          // the device on the receiving end warms up
          hx.save(); hx.globalCompositeOperation = 'lighter'; hx.fillStyle = grey(30 + 110 * warm); hx.beginPath(); hx.roundRect(dev[0] - 14 * s, dev[1] - 22 * s, 28 * s, 44 * s, 5 * s); hx.fill(); hx.restore();
          const lp = K.beat(t, t0 + 0.25, 0.3, 'lin'); if (lp > 0) landed++;
          style.label(ctx, name, P ? (left ? dev[0] - 30 * s : dev[0] + 30 * s) : dev[0] + 30 * s, cy, lp, { align: P ? (left ? 'right' : 'left') : 'left', size: P ? 32 : 30 });
        });
        hudBox(ctx, 22 * s, (P ? H - 150 * s : H - 120 * s), 330 * s, 44 * s, s); hudText(ctx, `POSTED: ${landed} / 7`, 34 * s, (P ? H - 118 * s : H - 88 * s), 28 * s, { weight: 700 });
        hudText(ctx, `Sp1  ${(48 + Math.sin(t * 2) * 0.4 + K.clamp((t - 4) / 2) * 14).toFixed(1)} °C`, 34 * s, 54 * s, 28 * s, { weight: 700 });
      } else {
        const [x2, y2, w2, h2] = Lo.node2;
        style.box(ctx, x2, y2, w2, h2, 1, { bands: 4 });
        if (P) style.label(ctx, 'Creator OS', W / 2, y2 + h2 + 52 * s, 1, { size: 32, align: 'center' });
        else style.label(ctx, 'Creator OS', x2 + w2 + 16 * s, y2 + h2 / 2 + 10 * s, 1, { size: 32, lead: [x2 + w2 - 6 * s, y2 + h2 / 2] });
        const v = K.count(t, 8.6, 1.4, 0, 1000000), [cx, cy] = Lo.counter;
        style.counter(ctx, v, cx, cy, K.beat(t, 8.45, 0.4, 'lin'), { size: P ? 104 : 124 });
        style.label(ctx, 'views', cx, cy + (P ? 110 : 100) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 34 });
        style.emphasis(ctx, cx, cy - (P ? 40 : 46) * s, (P ? 300 : 330) * s, K.beat(t, 10.0, 0.6, 'lin'), { tall: P ? 0.36 : 0.32, wide: P ? 0.97 : 1.2, max: 98.6 });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: P ? 56 : 58, align: 'center', maxW: W * 0.86 });
        hudBox(ctx, 22 * s, (P ? H - 150 * s : H - 120 * s), 330 * s, 44 * s, s); hudText(ctx, 'POSTED: 7 / 7', 34 * s, (P ? H - 118 * s : H - 88 * s), 28 * s, { weight: 700 });
        hudText(ctx, `Sp1  ${(62.4 + Math.sin(t * 2) * 0.3).toFixed(1)} °C`, 34 * s, 54 * s, 28 * s, { weight: 700 });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 1.2); k.bed('tape', 0, 12, 0.8);
      k.play('click', 0.0, { pitch: 0.7 }); k.play('click', 0.08, { pitch: 1.4 }); k.play('riser', 0.1, { dur: 0.8, gain: 0.3 });
      for (let i = 0; i < 4; i++) k.play('blip', 0.3 + i * 0.36, { note: 'C6', dur: 0.03, gain: 0.25 });
      k.play('blip', 2.0, { note: 'G5', dur: 0.05, gain: 0.4 }); k.play('type', 2.7, { dur: 0.4, gain: 0.6 }); k.play('blip', 2.95, { note: 'E6', dur: 0.05 });
      k.play('whoosh', 3.3, { dur: 0.8, gain: 0.5 }); for (let i = 0; i < 6; i++) k.play('tick', 3.4 + i * 0.12, { pitch: 1 + i * 0.05, gain: 0.5 });
      k.play('swell', 4.0, { chord: ['A3', 'E4'], dur: 1.0, gain: 0.7 }); k.play('type', 4.4, { dur: 0.4, gain: 0.6 }); k.play('blip', 4.85, { note: 'E6', dur: 0.05 });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.36, { dur: 0.25, gain: 0.3 }); k.play('blip', 5.27 + i * 0.36, { note: ['A5', 'B5', 'C#6', 'E6', 'F#6', 'A6', 'B6'][i], dur: 0.05, gain: 0.7 }); }
      k.play('click', 7.95, { pitch: 0.5, gain: 1.4 }); k.play('thud', 7.97, { gain: 0.5 }); k.play('click', 8.5, { pitch: 0.6, gain: 1.4 });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('blip', 10.0, { note: 'A5', dur: 0.06 }); k.play('ding', 10.15);
      k.play('chime', 11.3, { note: 'E5' });
    },
  };
  MS.register(style);
})();
