// Etch A Sketch Toy (Hand-Drawn). Glossy red plastic toy, two white knurled knobs, a grainy aluminium-powder screen.
// Everything is ONE thin dark line that never lifts: an own single-stroke block alphabet (every glyph starts and
// ends on the baseline, so words ride a travel line), diagonals stair-stepped on the knob grid, visible travel
// lines between elements. Knobs turn with horizontal / vertical travel. Scene change = shake the toy clean.
(function () {
  const S = (W, H) => K.layout(W, H).s;
  const LINE = '#3b3c3e';

  // ---------- single-stroke block font (x 0..4, cap y 0..6, baseline 6; retraces are invisible) ----------
  const G = {
    A: '0,6 0,2 2,0 4,2 4,6 4,4 0,4 4,4 4,6', B: '0,6 0,0 3,0 4,1 4,2 3,3 0,3 3,3 4,4 4,5 3,6 0,6 4,6',
    C: '0,6 0,0 4,0 0,0 0,6 4,6', D: '0,6 0,0 3,0 4,1 4,5 3,6 0,6 4,6', E: '0,6 0,0 4,0 0,0 0,3 3,3 0,3 0,6 4,6',
    F: '0,6 0,0 4,0 0,0 0,3 3,3 0,3 0,6 4,6', G: '0,6 0,0 4,0 0,0 0,6 4,6 4,3 2,3 4,3 4,6', H: '0,6 0,0 0,3 4,3 4,0 4,6',
    I: '0,6 1,6 1,0 1,6 2,6', J: '0,6 0,4 0,6 4,6 4,0 4,6', K: '0,6 0,0 0,3 4,0 0,3 4,6', L: '0,6 0,0 0,6 4,6',
    M: '0,6 0,0 2,2 4,0 4,6', N: '0,6 0,0 4,6 4,0 4,6', O: '0,6 0,0 4,0 4,6 0,6 4,6', P: '0,6 0,0 4,0 4,3 0,3 0,6 4,6',
    Q: '0,6 0,0 4,0 4,6 3,5 4,6', R: '0,6 0,0 4,0 4,3 0,3 4,6', S: '0,6 4,6 4,3 0,3 0,0 4,0 0,0 0,3 4,3 4,6',
    T: '0,6 2,6 2,0 0,0 4,0 2,0 2,6 4,6', U: '0,6 0,0 0,6 4,6 4,0 4,6', V: '0,6 2,6 0,0 2,6 4,0 2,6 4,6',
    W: '0,6 0,0 0,6 2,4 4,6 4,0 4,6', X: '0,6 4,0 2,3 0,0 4,6', Y: '0,6 2,6 2,3 0,0 2,3 4,0 2,3 2,6 4,6', Z: '0,6 0,6 4,0 0,0 4,0 0,6 4,6',
    0: '0,6 0,0 4,0 4,6 0,6 4,0 0,6 4,6', 1: '0,6 2,6 2,0 1,1 2,0 2,6 4,6', 2: '0,6 0,3 4,3 4,0 0,0 4,0 4,3 0,3 0,6 4,6',
    3: '0,6 4,6 4,0 0,0 4,0 4,3 1,3 4,3 4,6', 4: '0,6 4,6 4,3 0,3 0,0 0,3 4,3 4,0 4,6', 5: '0,6 4,6 4,3 0,3 0,0 4,0 0,0 0,3 4,3 4,6',
    6: '0,6 0,0 4,0 0,0 0,6 4,6 4,3 0,3 4,3 4,6', 7: '0,6 2,6 4,0 0,0 4,0 2,6 4,6', 8: '0,6 0,0 4,0 4,6 4,3 0,3 4,3 4,6',
    9: '0,6 4,6 4,0 0,0 0,3 4,3 4,6', ',': '0,6 1,6 1,7.6 1,6 1.5,6', '.': '0,6 1,6 1,5.2 1,6 1.5,6', ' ': '0,6 2.4,6', '?': '0,6 2,6 2,5 2,6 2,4 4,3 4,0 0,0 0,1 0,0 4,0 4,3 2,4 2,6 4,6',
  };
  const GP = {}; for (const k in G) GP[k] = G[k].split(' ').map((p) => p.split(',').map(Number));
  const ADV = (ch) => (ch === ',' || ch === '.' ? 2.6 : ch === ' ' ? 3.2 : ch === 'I' ? 3.6 : 5.6);
  const textW = (text, u) => { let w = 0; for (const ch of text.toUpperCase()) w += ADV(ch) * u; return w - 1.6 * u; };
  // Polyline for a whole string, baseline at y; size = font size in px (cap height = 2/3 size).
  function textPts(text, x, y, size, align = 'left') {
    const u = size / 9, T = text.toUpperCase(), w = textW(T, u);
    let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x; const out = [];
    for (const ch of T) { const g = GP[ch] || GP[' ']; for (const [gx, gy] of g) out.push([cx + gx * u, y + (gy - 6) * u]); cx += ADV(ch) * u; }
    return out;
  }
  // Knob grid: any diagonal becomes a staircase of horizontal / vertical moves.
  function stair(pts, step) {
    const out = [pts[0]];
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = out[out.length - 1], [x1, y1] = pts[i], dx = x1 - x0, dy = y1 - y0;
      if (Math.abs(dx) < 0.6 || Math.abs(dy) < 0.6) { out.push([x1, y1]); continue; }
      const n = Math.max(1, Math.ceil(Math.max(Math.abs(dx), Math.abs(dy)) / step));
      for (let k = 1; k <= n; k++) { const px = x0 + (dx * k) / n, py = y0 + (dy * k) / n, prev = out[out.length - 1]; out.push([px, prev[1]]); out.push([px, py]); }
    }
    return out;
  }
  const rev = (a) => a.slice().reverse();
  const stepOf = (W, H) => 2.6 * S(W, H);

  // the dark line where the stylus scraped the powder away: dark core, a lighter displaced-powder rim
  function etch(ctx, pts, p, o = {}) {
    const q = K.trim(pts, p); if (q.length < 2) return q[0] || null;
    const s = S(ctx.canvas.width, ctx.canvas.height), w = (o.width || 2.4) * s;
    ctx.save(); ctx.lineCap = 'square'; ctx.lineJoin = 'miter';
    ctx.globalAlpha = o.alpha ?? 1;
    ctx.strokeStyle = 'rgba(236,236,230,0.55)'; ctx.lineWidth = w * 2.3; ctx.translate(0.6 * s, 0.8 * s); K.poly(ctx, q); ctx.stroke(); ctx.translate(-0.6 * s, -0.8 * s);
    ctx.strokeStyle = LINE; ctx.lineWidth = w; K.poly(ctx, q); ctx.stroke();
    ctx.restore();
    return q[q.length - 1];
  }

  function rects(W, H) {
    const s = S(W, H), portrait = H > W;
    const body = [10 * s, 10 * s, W - 20 * s, H - 20 * s];
    const scr = portrait ? [62 * s, 70 * s, W - 124 * s, H - 70 * s - 190 * s] : [92 * s, 62 * s, W - 184 * s, H - 62 * s - 128 * s];
    const kr = (portrait ? 58 : 46) * s, ky = portrait ? H - 100 * s : H - 64 * s;
    return { body, scr, knobs: [[body[0] + kr + 30 * s, ky], [W - body[0] - kr - 30 * s, ky]], kr };
  }
  function rr(x, X, Y, w, h, r) { x.beginPath(); x.moveTo(X + r, Y); x.arcTo(X + w, Y, X + w, Y + h, r); x.arcTo(X + w, Y + h, X, Y + h, r); x.arcTo(X, Y + h, X, Y, r); x.arcTo(X, Y, X + w, Y, r); x.closePath(); }

  function screenTex(W, H) {
    return K.cached(`etch-screen:${W}x${H}`, () => {
      const { scr } = rects(W, H), [x0, y0, w, h] = scr, c = K.layer(w, h), x = c.getContext('2d');
      // aluminium powder: fine sparkly grain over a soft grey gradient
      const img = x.createImageData(w | 0, h | 0), d = img.data, r = K.rng(17), nz = K.noise(18);
      for (let y = 0; y < (h | 0); y++) for (let i = 0; i < (w | 0); i++) {
        const o = (y * (w | 0) + i) * 4, base = 196 - (y / h) * 16 + nz.fbm2(i * 0.01, y * 0.01, 3) * 14;
        const sp = r(), v = base + (r() - 0.5) * 26 + (sp > 0.985 ? 28 : sp < 0.012 ? -30 : 0);
        d[o] = v; d[o + 1] = v; d[o + 2] = v - 4; d[o + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      const g = x.createLinearGradient(0, 0, w, h); g.addColorStop(0, 'rgba(255,255,255,0.14)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.08)');
      x.fillStyle = g; x.fillRect(0, 0, w, h);
      return c;
    });
  }

  function body(W, H) {
    return K.cached(`etch-body:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), R = rects(W, H), [bx, by, bw, bh] = R.body, [sx, sy, sw, sh] = R.scr;
      x.fillStyle = '#2a201c'; x.fillRect(0, 0, W, H);
      // red glossy body
      x.save(); x.shadowColor = 'rgba(0,0,0,0.6)'; x.shadowBlur = 24 * s; x.shadowOffsetY = 8 * s;
      rr(x, bx, by, bw, bh, 58 * s); const g = x.createLinearGradient(0, by, 0, by + bh);
      g.addColorStop(0, '#f2412f'); g.addColorStop(0.18, '#d8221d'); g.addColorStop(0.8, '#b8150f'); g.addColorStop(1, '#8a0d09');
      x.fillStyle = g; x.fill(); x.restore();
      // rim highlight + inner moulded bevel around the screen
      rr(x, bx + 4 * s, by + 4 * s, bw - 8 * s, bh - 8 * s, 54 * s); x.strokeStyle = 'rgba(255,190,170,0.45)'; x.lineWidth = 3 * s; x.stroke();
      rr(x, sx - 22 * s, sy - 22 * s, sw + 44 * s, sh + 44 * s, 36 * s); const g2 = x.createLinearGradient(0, sy - 22 * s, 0, sy + sh + 22 * s);
      g2.addColorStop(0, '#a3120d'); g2.addColorStop(1, '#e8382a'); x.fillStyle = g2; x.fill();
      rr(x, sx - 22 * s, sy - 22 * s, sw + 44 * s, sh + 44 * s, 36 * s); x.strokeStyle = 'rgba(80,0,0,0.5)'; x.lineWidth = 2 * s; x.stroke();
      // the screen well (cut out later), dark gap round the glass
      rr(x, sx - 6 * s, sy - 6 * s, sw + 12 * s, sh + 12 * s, 16 * s); x.fillStyle = '#4a4442'; x.fill();
      x.globalCompositeOperation = 'destination-out'; rr(x, sx, sy, sw, sh, 12 * s); x.fill(); x.globalCompositeOperation = 'source-over';
      // hard specular streaks on the plastic
      x.save(); rr(x, bx, by, bw, bh, 58 * s); x.clip();
      const streak = (x0, w0, a) => { const gg = x.createLinearGradient(x0, 0, x0 + w0, 0); gg.addColorStop(0, 'rgba(255,255,255,0)'); gg.addColorStop(0.5, `rgba(255,255,255,${a})`); gg.addColorStop(1, 'rgba(255,255,255,0)'); x.fillStyle = gg; x.beginPath(); x.moveTo(x0, by); x.lineTo(x0 + w0, by); x.lineTo(x0 + w0 - 60 * s, by + 34 * s); x.lineTo(x0 - 60 * s, by + 34 * s); x.fill(); };
      streak(bx + bw * 0.12, 220 * s, 0.55); streak(bx + bw * 0.55, 90 * s, 0.4);
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.fillRect(bx + 60 * s, by + 8 * s, bw - 120 * s, 3 * s);
      x.restore();
      return c;
    });
  }

  function knob(ctx, cx, cy, r, ang, s) {
    ctx.save(); ctx.translate(cx, cy);
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.arc(3 * s, 6 * s, r * 1.04, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r);
    g.addColorStop(0, '#ffffff'); g.addColorStop(0.7, '#e9e7e0'); g.addColorStop(1, '#b9b6ad');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    // knurling that turns with the knob
    ctx.rotate(ang); ctx.strokeStyle = 'rgba(120,115,105,0.55)'; ctx.lineWidth = 1.6 * s;
    for (let i = 0; i < 36; i++) { const a = (i / 36) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(Math.cos(a) * r * 0.86, Math.sin(a) * r * 0.86); ctx.lineTo(Math.cos(a) * r * 0.99, Math.sin(a) * r * 0.99); ctx.stroke(); }
    ctx.fillStyle = 'rgba(150,145,135,0.5)'; ctx.beginPath(); ctx.arc(0, -r * 0.55, r * 0.07, 0, Math.PI * 2); ctx.fill();
    ctx.rotate(-ang); ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.beginPath(); ctx.ellipse(-r * 0.3, -r * 0.35, r * 0.28, r * 0.16, -0.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  const style = {
    id: 'etch-sketch', name: 'Etch A Sketch Toy', family: 'Hand-Drawn',
    fonts: [],
    palette: { bg: '#c4c4bf', ink: LINE, body: '#d8221d', knob: '#ece9e1', accent: '#b8150f' },
    sfx: { draw: 'pencil', land: 'click', emphasis: 'tick', transition: 'glitch', bed: 'room' },
    setup(W, H) { body(W, H); screenTex(W, H); },

    background(ctx, W, H, t) { const [sx, sy] = rects(W, H).scr; ctx.drawImage(screenTex(W, H), sx, sy); },

    finish(ctx, W, H, t, o = {}) {
      const s = S(W, H), R = rects(W, H), [sx, sy, sw, sh] = R.scr;
      // glass: inner shadow at the top edge + a soft reflection band
      ctx.save(); rr(ctx, sx, sy, sw, sh, 12 * s); ctx.clip();
      const g = ctx.createLinearGradient(0, sy, 0, sy + 40 * s); g.addColorStop(0, 'rgba(0,0,0,0.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = g; ctx.fillRect(sx, sy, sw, 40 * s);
      const rg = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh); rg.addColorStop(0.2, 'rgba(255,255,255,0)'); rg.addColorStop(0.3, 'rgba(255,255,255,0.12)'); rg.addColorStop(0.42, 'rgba(255,255,255,0)');
      ctx.fillStyle = rg; ctx.fillRect(sx, sy, sw, sh); ctx.restore();
      ctx.drawImage(body(W, H), 0, 0);
      const ka = o.knobs || [0, 0]; R.knobs.forEach(([kx, ky], i) => knob(ctx, kx, ky, R.kr, ka[i], s));
      K.vignette(ctx, W, H, 0.3, '#100505');
      K.grain(ctx, W, H, t, 0.03, 24, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = stair(textPts(text, x, y, (o.size || 60) * s, o.align), stepOf(ctx.canvas.width, ctx.canvas.height));
      return etch(ctx, pts, p, o);
    },
    label(ctx, text, x, y, p, o = {}) { return style.title(ctx, text, x, y, p, { size: 38, ...o }); },
    arrow(ctx, from, to, p, o = {}) { return etch(ctx, arrowPts(ctx.canvas.width, ctx.canvas.height, from, to), p, o); },
    box(ctx, x, y, w, h, p, o = {}) { return etch(ctx, boxPts(x, y, w, h, S(ctx.canvas.width, ctx.canvas.height), o.double), p, o); },
    counter(ctx, value, x, y, p, o = {}) { return style.title(ctx, K.fmt(value), x, y, p, { size: o.size || 110, align: o.align || 'center' }); },
    emphasis(ctx, x, y, r, p, o = {}) {
      const W = ctx.canvas.width, H = ctx.canvas.height, s = S(W, H);
      const pts = stair(K.circlePts(x, y, r * 1.2, r * 0.75, 72, Math.PI / 2, Math.PI * 4.1), stepOf(W, H) * 1.6);
      return etch(ctx, pts, p, { width: 2.8, ...o });
    },

    // Shake: the toy jolts, the powder recoats the screen in streaks (covered at 0.5), a ghost of the drawing stays.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), [sx, sy, sw, sh] = rects(W, H).scr, scr = screenTex(W, H);
      const k = Math.sin(Math.PI * K.clamp(p)), j = k * 14 * s;
      const cp = K.cached(`etch-copy:${W}x${H}`, () => K.layer(W, H)), cx = cp.getContext('2d');
      cx.clearRect(0, 0, W, H); cx.drawImage(ctx.canvas, 0, 0);
      ctx.save(); ctx.fillStyle = '#2a201c'; ctx.fillRect(0, 0, W, H);
      ctx.drawImage(cp, Math.sin(p * 61) * j, Math.cos(p * 47) * j * 0.6); ctx.restore();
      // streaky recoat: horizontal bands of fresh powder, each band fills at its own rate
      const cover = K.clamp(p / 0.5), r = K.rng(o.seed || 9);
      ctx.save(); rr(ctx, sx, sy, sw, sh, 12 * s); ctx.clip();
      const bands = 26;
      for (let i = 0; i < bands; i++) {
        const y = sy + (i / bands) * sh, bh = sh / bands + 1, a = K.clamp(cover * (0.8 + r() * 0.6) - r() * 0.25);
        ctx.globalAlpha = p < 0.5 ? a * 0.95 : K.clamp(1 - (p - 0.5) / 0.25) * 0.9 + 0.0;
        ctx.drawImage(scr, 0, y - sy, sw, bh, sx, y, sw, bh);
      }
      ctx.restore();
    },
  };

  // ---------- geometry helpers (screen-space) ----------
  function arrowPts(W, H, from, to) {
    const s = S(W, H), st = stepOf(W, H), body = stair([from, to], st), ang = Math.atan2(to[1] - from[1], to[0] - from[0]), L = 16 * s;
    const h1 = [to[0] - Math.cos(ang - 0.6) * L, to[1] - Math.sin(ang - 0.6) * L], h2 = [to[0] - Math.cos(ang + 0.6) * L, to[1] - Math.sin(ang + 0.6) * L];
    return body.concat(stair([to, h1], st).slice(1), stair([h1, to], st).slice(1), stair([to, h2], st).slice(1), stair([h2, to], st).slice(1));
  }
  // play icon that grows out of the box's bottom edge (the stylus cannot lift, so the stem doubles as the stand)
  function play(b, st) { const tx = b[0] + b[2] * 0.42, w = b[2] * 0.2; return stair([[tx, b[1] + b[3]], [tx, b[1] + b[3] * 0.22], [tx + w, b[1] + b[3] * 0.5], [tx, b[1] + b[3] * 0.78], [tx, b[1] + b[3]]], st); }
  function boxPts(x, y, w, h, s, dbl) {
    const a = [[x, y + h], [x, y], [x + w, y], [x + w, y + h], [x, y + h]];
    if (!dbl) return a; const d = 7 * s;
    return a.concat([[x - d, y + h + d], [x - d, y - d], [x + w + d, y - d], [x + w + d, y + h + d], [x - d, y + h + d]]);
  }

  // ---------- demo: one unbroken line ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  // Pieces: { pts, t0, t1, warp } in draw order; a travel line (stair-stepped) joins each piece to the next.
  function build(W, H) {
    return K.cached(`etch-demo:${W}x${H}`, () => {
      const s = S(W, H), portrait = H > W, [sx, sy, sw, sh] = rects(W, H).scr, st = stepOf(W, H);
      const X = (f) => sx + f * sw, Y = (f) => sy + f * sh;
      const A = [], B = [], ghost = [];
      const add = (list, pts, t0, t1, warp = 1) => {
        if (list.length) { const prev = list[list.length - 1].pts, a = prev[prev.length - 1]; const b = pts[0]; list.push({ pts: [a, [b[0], a[1]], b], t0: t0 - 0.12, t1: t0, travel: 1 }); }
        list.push({ pts, t0, t1, warp });
      };
      const T = (txt, x, y, size, align, t0, t1, list = A) => add(list, stair(textPts(txt, x, y, size * s, align), st), t0, t1);
      if (!portrait) {
        T('One video. Every platform.', X(0.5), Y(0.16), 62, 'center', 0.15, 1.7);
        const vb = [X(0.03), Y(0.38), sw * 0.22, sh * 0.25];
        add(A, boxPts(vb[0], vb[1], vb[2], vb[3], s), 2.0, 2.7);
        add(A, play(vb, st), 2.75, 3.0);
        T('your video', vb[0] + vb[2] / 2, vb[1] + vb[3] + 44 * s, 36, 'center', 3.05, 3.45);
        const nb = [X(0.33), Y(0.4), sw * 0.27, sh * 0.2];
        add(A, arrowPts(W, H, [vb[0] + vb[2] + 10 * s, vb[1] + vb[3] / 2], [nb[0] - 12 * s, nb[1] + nb[3] / 2]), 3.5, 4.05);
        add(A, boxPts(nb[0], nb[1], nb[2], nb[3], s), 4.1, 4.55);
        T('Creator OS', nb[0] + nb[2] / 2, nb[1] + nb[3] / 2 + 16 * s, 42, 'center', 4.55, 4.95);
        PLATFORMS.forEach((n, i) => {
          const t0 = 5.0 + i * 0.4, from = [nb[0] + nb[2] + 6 * s, nb[1] + nb[3] / 2], cy = Y(0.2 + i * 0.118), to = [X(0.69), cy];
          const ar = stair([from, [X(0.65), cy]], st).concat(arrowPts(W, H, [X(0.65), cy], to).slice(1)), lab = stair(textPts(n, X(0.7), cy, 38 * s, 'left'), st);
          add(A, ar.concat(lab, rev(lab), rev(ar)), t0, t0 + 0.4, 0.72);
        });
        // scene 2
        const nb2 = [X(0.34), Y(0.06), sw * 0.32, sh * 0.18];
        add(B, boxPts(nb2[0], nb2[1], nb2[2], nb2[3], s), 8.45, 8.8);
        T('Creator OS', X(0.5), nb2[1] + nb2[3] / 2 + 16 * s, 42, 'center', 8.8, 9.1, B);
        B.counter = { x: X(0.5), y: Y(0.6), size: 112 };
        B.views = { x: X(0.5), y: Y(0.74) };
        B.take = [['Post once. Reach everywhere.', X(0.5), Y(0.93), 48]];
      } else {
        T('One video.', X(0.5), Y(0.07), 52, 'center', 0.15, 0.85);
        T('Every platform.', X(0.5), Y(0.135), 52, 'center', 0.9, 1.7);
        const vb = [X(0.25), Y(0.19), sw * 0.5, sh * 0.13];
        add(A, boxPts(vb[0], vb[1], vb[2], vb[3], s), 2.0, 2.7);
        add(A, play(vb, st), 2.75, 3.0);
        T('your video', X(0.5), vb[1] + vb[3] + 50 * s, 36, 'center', 3.05, 3.45);
        const nb = [X(0.16), Y(0.42), sw * 0.68, sh * 0.09];
        add(A, arrowPts(W, H, [X(0.5), vb[1] + vb[3] + 64 * s], [X(0.5), nb[1] - 10 * s]), 3.5, 4.05);
        add(A, boxPts(nb[0], nb[1], nb[2], nb[3], s), 4.1, 4.55);
        T('Creator OS', X(0.5), nb[1] + nb[3] / 2 + 18 * s, 44, 'center', 4.55, 4.95);
        const yl = Y(0.59 + 3 * 0.11);
        add(A, [[X(0.5), nb[1] + nb[3]], [X(0.5), yl]], 4.95, 5.05);
        PLATFORMS.forEach((n, i) => {
          const t0 = 5.05 + i * 0.39, left = i % 2 === 0, cy = Y(0.6 + Math.floor(i / 2) * 0.11), stem = [X(0.5), cy];
          const tip = [left ? X(0.425) : X(0.575), cy];
          const ar = arrowPts(W, H, stem, tip), lab = stair(textPts(n, left ? X(0.41) : X(0.59), cy, 34 * s, left ? 'right' : 'left'), st);
          // ride the trunk down to this branch, out along the arrow, write the label, ride back
          const down = [[X(0.5), yl], stem];
          add(A, down.concat(ar, lab, rev(lab), rev(ar)), t0, t0 + 0.39, 0.75);
        });
        const nb2 = [X(0.16), Y(0.05), sw * 0.68, sh * 0.09];
        add(B, boxPts(nb2[0], nb2[1], nb2[2], nb2[3], s), 8.45, 8.8);
        T('Creator OS', X(0.5), nb2[1] + nb2[3] / 2 + 18 * s, 44, 'center', 8.8, 9.1, B);
        B.counter = { x: X(0.5), y: Y(0.42), size: 92 };
        B.views = { x: X(0.5), y: Y(0.52) };
        B.take = [['Post once.', X(0.5), Y(0.73), 50], ['Reach everywhere.', X(0.5), Y(0.81), 50]];
      }
      // counter, label, double-traced box, takeaway (scene 2)
      const c = B.counter, cw = textW('1,000,000', (c.size * s) / 9), cx0 = c.x - cw / 2;
      B.counterPts = stair(textPts('1,000,000', cx0, c.y, c.size * s, 'left'), st);
      add(B, B.counterPts, 8.6, 10.0);
      // the number grows as it is written: K.count paces how many digits exist (1 -> 10 -> ... -> 1,000,000)
      B[B.length - 1].prog = (t) => K.clamp(Math.log10(1 + K.count(t, 8.6, 1.4, 0, 1000000)) / 6);
      T('views', B.views.x, B.views.y, 40, 'center', 10.0, 10.2, B);
      const capH = (c.size * s * 2) / 3, pad = 26 * s;
      add(B, boxPts(cx0 - pad, c.y - capH - pad, cw + pad * 2, capH + pad * 2 + 6 * s, s, true), 10.2, 10.55);
      B.take.forEach(([txt, x, y, sz], i) => T(txt, x, y, sz, 'center', 10.55 + (i * 0.75) / B.take.length, 10.55 + ((i + 1) * 0.75) / B.take.length, B));
      const travel = (L) => L.map((pc) => { let dx = 0, dy = 0; for (let i = 1; i < pc.pts.length; i++) { dx += pc.pts[i][0] - pc.pts[i - 1][0]; dy += pc.pts[i][1] - pc.pts[i - 1][1]; } pc.dx = dx; pc.dy = dy; return pc; });
      travel(A); travel(B);
      return { A, B };
    });
  }
  function drawPieces(ctx, list, t, alpha = 1) {
    let at = null, kx = 0, ky = 0;
    for (const pc of list) {
      if (t < pc.t0) break;
      let p = pc.prog ? pc.prog(t) : K.clamp((t - pc.t0) / (pc.t1 - pc.t0));
      if (pc.warp && pc.warp !== 1) p = p < pc.warp ? (p / pc.warp) * 0.5 : 0.5 + ((p - pc.warp) / (1 - pc.warp)) * 0.5;
      const e = etch(ctx, pc.pts, p, { alpha }); at = e; kx += pc.dx * p; ky += pc.dy * p;
    }
    return { at, kx, ky };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const s = S(W, H), { A, B } = build(W, H), R = rects(W, H);
      ctx.fillStyle = '#2a201c'; ctx.fillRect(0, 0, W, H);
      style.background(ctx, W, H, t);
      ctx.save(); rr(ctx, R.scr[0], R.scr[1], R.scr[2], R.scr[3], 12 * s); ctx.clip();
      let st;
      if (t < 8.0) st = drawPieces(ctx, A, t);
      else { drawPieces(ctx, A, 99, 0.09); st = drawPieces(ctx, B, t); }
      // stylus point
      if (st.at) { ctx.fillStyle = '#1e1f21'; ctx.beginPath(); ctx.arc(st.at[0], st.at[1], 2.6 * s, 0, Math.PI * 2); ctx.fill(); }
      ctx.restore();
      const tot = t < 8 ? st : { kx: st.kx + 4000 * s, ky: st.ky + 2000 * s };
      style.finish(ctx, W, H, t, { knobs: [tot.kx / (R.kr * 2.2), tot.ky / (R.kr * 2.2)] });
      if (t > 7.5 && t < 8.6) style.transition(ctx, W, H, K.clamp((t - 7.5) / 1.0), {});
    },
    score(k) {
      k.bed('room', 0, 12, 0.8);
      // the stylus grinding through powder: a long continuous scratch with knob clicks
      k.play('scribble', 0.15, { medium: 'pencil', dur: 1.55, gain: 1.3 });
      k.play('scribble', 1.9, { medium: 'pencil', dur: 3.1, gain: 1.2 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pencil', dur: 0.38, gain: 1.2 }); k.play('click', 5.28 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('click', 4.55); k.play('click', 3.0);
      // shake
      k.play('glitch', 7.55, { gain: 0.6 }); for (let i = 0; i < 6; i++) k.play('whoosh', 7.5 + i * 0.15, { dur: 0.14, gain: 0.5, up: i % 2 === 0 });
      k.play('scribble', 8.45, { medium: 'pencil', dur: 0.65, gain: 1.2 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('scribble', 8.6, { medium: 'pencil', dur: 1.4, gain: 1.1 });
      k.play('tick', 10.2, { gain: 1.4 }); k.play('scribble', 10.0, { medium: 'pencil', dur: 0.55, gain: 1.2 });
      k.play('scribble', 10.6, { medium: 'pencil', dur: 1.0, gain: 1.2 }); k.play('chime', 11.5, { note: 'C6' });
    },
  };
  MS.register(style);
})();
