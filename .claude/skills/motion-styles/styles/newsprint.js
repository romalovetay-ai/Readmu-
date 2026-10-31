// Vintage Newsprint (Print). A 1950s broadsheet: blackletter masthead, condensed banner headline, greeked
// justified columns, a coarse halftone wire photo, crisp elbowed diagram rules, a red grease-pencil ring,
// thin uneven ink on yellowed pulp with the reverse page showing through, and the spinning-newspaper reveal.
(function () {
  const C = { paper: '#e8dab4', ink: '#211d17', grey: '#5b544a', red: '#b8261d' };
  const F = { mast: 'UnifrakturMaguntia', head: 'Oswald', body: 'Libre Baskerville' };
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // thin, uneven press ink: mostly solid with starved patches and a faint smear direction
  function inkTile() {
    return K.cached('np-ink', () => {
      const n = 256, c = K.layer(n, n), x = c.getContext('2d'), img = x.createImageData(n, n), d = img.data, nz = K.noise(61), r = K.rng(62), [R, G, B] = K.hex(C.ink);
      for (let y = 0; y < n; y++) for (let i = 0; i < n; i++) {
        const a = K.clamp(0.84 + nz.fbm2(i * 0.03, y * 0.05, 3) * 0.3 - (r() < 0.03 ? 0.4 : 0) + (r() - 0.5) * 0.12, 0.25, 1), o = (y * n + i) * 4;
        d[o] = R; d[o + 1] = G; d[o + 2] = B; d[o + 3] = a * 255;
      }
      x.putImageData(img, 0, 0); return c;
    });
  }
  const ink = (ctx) => ctx.createPattern(inkTile(), 'repeat');
  // greeked body copy block: justified lines of fake words in a small serif, cached per size
  function greek(W, H, w, h, seed, mirror = false) {
    return K.cached(`np-greek:${W}x${H}:${w | 0}x${h | 0}:${seed}:${mirror}`, () => {
      const s = S(W, H), c = K.layer(w, h), x = c.getContext('2d'), r = K.rng(seed), lh = 13.5 * s, fs = 10.5 * s;
      x.fillStyle = C.ink; x.font = K.font(fs, F.body, 400); x.textBaseline = 'alphabetic';
      if (mirror) { x.translate(w, 0); x.scale(-1, 1); }
      const syl = ['lo', 're', 'm', 'ip', 'sum', 'do', 'lor', 'sit', 'a', 'met', 'con', 'sec', 'te', 'tur', 'ad', 'pis', 'ci', 'ng', 'el', 'it', 'sed', 'ut', 'qua', 'vel'];
      for (let y = lh; y < h; y += lh) {
        const words = []; let tw = 0;
        while (tw < w * 0.92) { let wd = ''; const n = r.int(1, 4); for (let k = 0; k < n; k++) wd += r.pick(syl); const ww = x.measureText(wd).width; if (tw + ww > w) break; words.push([wd, ww]); tw += ww + fs * 0.3; }
        const last = y + lh >= h || r() < 0.08, gap = last ? fs * 0.3 : (w - words.reduce((a, b) => a + b[1], 0)) / Math.max(1, words.length - 1);
        let cx = r() < 0.06 ? fs : 0; for (const [wd, ww] of words) { x.globalAlpha = 0.7 + r() * 0.3; x.fillText(wd, cx, y); cx += ww + gap; }
      }
      return c;
    });
  }
  // a halftone "wire photo": a creator silhouette at a desk with a camera light, screened to coarse round dots
  function wirePhoto(W, H, w, h) {
    return K.cached(`np-photo:${W}x${H}:${w | 0}x${h | 0}`, () => {
      const s = S(W, H), c = K.layer(w, h), x = c.getContext('2d'), pitch = 6.5 * s, nz = K.noise(5);
      const dark = (u, v) => {
        let d = 0.25 + 0.35 * v + 0.12 * nz.fbm2(u * 4, v * 4, 2);                        // wall + floor
        const hx = u - 0.36, hy = v - 0.36; if (hx * hx / 0.012 + hy * hy / 0.02 < 1) d = 0.75 - 0.25 * (hx < 0 ? 0 : 1); // head
        const bx = u - 0.36, by = v - 0.85; if (bx * bx / 0.06 + by * by / 0.14 < 1) d = 0.8;  // shoulders
        if (u > 0.62 && u < 0.88 && v > 0.32 && v < 0.6) d = 0.55 + 0.25 * Math.sin(u * 30) * 0.2; // ring light / camera
        if (Math.hypot(u - 0.75, v - 0.46) < 0.09) d = 0.12;
        if (v > 0.9) d = 0.9;
        return K.clamp(d);
      };
      x.fillStyle = C.ink;
      for (let y = pitch / 2, row = 0; y < h; y += pitch, row++) for (let i = (row % 2) * pitch / 2; i < w; i += pitch) {
        const d = dark(i / w, y / h), r = Math.sqrt(d) * pitch * 0.62; if (r > 0.3) { x.beginPath(); x.arc(i, y, r, 0, 7); x.fill(); }
      }
      return c;
    });
  }

  const style = {
    id: 'newsprint', name: 'Vintage Newsprint', family: 'Print',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=UnifrakturMaguntia&family=Oswald:wght@400;500;700&family=Libre+Baskerville:ital,wght@0,400;0,700;1,400&display=block',
      specs: ['400 64px "UnifrakturMaguntia"', '700 70px "Oswald"', '500 30px "Oswald"', '400 12px "Libre Baskerville"', 'italic 400 20px "Libre Baskerville"'] }],
    palette: { bg: C.paper, ink: C.ink, accent: C.red, grey: C.grey },
    sfx: { draw: 'pencil', land: 'click', emphasis: 'stamp', transition: 'whoosh', bed: 'room' },

    background(ctx, W, H, t) {
      const tex = K.cached(`np-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H);
        x.drawImage(K.paperTex(W, H, C.paper, 13, 0.08, false), 0, 0);
        // show-through: the reverse page, mirrored, faint
        x.globalAlpha = 0.06; const cw = (W - 80 * s) / (H > W ? 3 : 5);
        for (let i = 0; i < (H > W ? 3 : 5); i++) x.drawImage(greek(W, H, cw - 14 * s, H - 60 * s, 900 + i, true), 40 * s + i * cw, 30 * s);
        x.globalAlpha = 0.05; x.fillStyle = C.ink; x.fillRect(W * 0.55, H * 0.55, W * 0.3, H * 0.22);
        // yellowed edges + a fold crease across the middle
        x.globalAlpha = 1; const g = x.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.35, W / 2, H / 2, Math.hypot(W, H) * 0.6);
        g.addColorStop(0, 'rgba(160,120,50,0)'); g.addColorStop(1, 'rgba(150,105,40,0.28)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        const fy = H * 0.5, fg = x.createLinearGradient(0, fy - 8 * s, 0, fy + 8 * s);
        fg.addColorStop(0, 'rgba(255,248,225,0)'); fg.addColorStop(0.45, 'rgba(255,248,225,0.35)'); fg.addColorStop(0.55, 'rgba(90,70,40,0.16)'); fg.addColorStop(1, 'rgba(90,70,40,0)');
        x.fillStyle = fg; x.fillRect(0, fy - 8 * s, W, 16 * s);
        return c;
      });
      ctx.drawImage(tex, 0, 0);
    },

    finish(ctx, W, H, t) {
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.4; ctx.drawImage(K.paperTex(W, H, '#efe3c2', 29, 0.12, false), 0, 0); ctx.restore();
      K.vignette(ctx, W, H, 0.2, '#2a1c08');
      K.grain(ctx, W, H, t, 0.06, 12, 'overlay');
    },

    // condensed banner headline, inked thin and uneven, set by the roller sweeping left to right
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 70) * s, fam = o.family || F.head, wt = o.weight || 700;
      ctx.save(); ctx.font = K.font(size, fam, wt); if (o.condense) ctx.font = K.font(size, fam, wt);
      let w = ctx.measureText(text).width; const sx = o.maxW && w > o.maxW ? o.maxW / w : 1; w *= sx;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      ctx.beginPath(); ctx.rect(x0 - 10, y - size * 1.2, (w + 20) * K.clamp(p), size * 1.6); ctx.clip();
      ctx.translate(x0, y); ctx.scale(sx, 1); ctx.textBaseline = 'alphabetic';
      ctx.fillStyle = 'rgba(33,29,23,0.18)'; ctx.fillText(text, 0.8 * s, 0.6 * s);   // ink spread
      ctx.fillStyle = o.color || ink(ctx); ctx.fillText(text, 0, 0);
      ctx.restore();
      return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) {
      return style.title(ctx, o.upper === false ? text : text.toUpperCase(), x, y, p, { size: o.size || 32, weight: 500, ...o });
    },

    // crisp newspaper-diagram rule: elbowed (horizontal, vertical, horizontal) with a solid wedge head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), mx = o.elbowX ?? (from[0] + to[0]) / 2;
      const pts = o.straight ? [from, to] : [from, [mx, from[1]], [mx, to[1]], to];
      const q = K.trim(pts, K.clamp(p)); if (q.length < 2) return null;
      ctx.save(); ctx.strokeStyle = o.color || C.ink; ctx.lineWidth = (o.width || 2.6) * s; ctx.lineJoin = 'miter'; K.poly(ctx, q); ctx.stroke();
      ctx.beginPath(); ctx.arc(from[0], from[1], 4 * s, 0, 7); ctx.fillStyle = o.color || C.ink; ctx.fill();
      if (p >= 0.98) { const b = pts[pts.length - 1], a = pts[pts.length - 2], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 15 * s;
        ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang - 0.42) * L, b[1] - Math.sin(ang - 0.42) * L); ctx.lineTo(b[0] - Math.cos(ang + 0.42) * L, b[1] - Math.sin(ang + 0.42) * L); ctx.fill(); }
      ctx.restore();
      return q[q.length - 1];
    },
    // ruled box: heavy outer rule, hairline inner rule, light dot-screen tint
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      ctx.save(); ctx.beginPath(); ctx.rect(x - 4, y - 4, (w + 8) * K.clamp(k * 1.3), h + 8); ctx.clip();
      if (o.tint !== false) {
        const tile = K.cached(`np-tint:${s.toFixed(2)}`, () => { const n = Math.max(4, Math.round(5 * s)), c = K.layer(n, n), x2 = c.getContext('2d'); x2.fillStyle = 'rgba(33,29,23,0.35)'; x2.beginPath(); x2.arc(n / 2, n / 2, n * 0.22, 0, 7); x2.fill(); return c; });
        ctx.fillStyle = ctx.createPattern(tile, 'repeat'); ctx.fillRect(x, y, w, h);
      }
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fillRect(x, y, w, h); }
      ctx.strokeStyle = ink(ctx); ctx.lineWidth = 4 * s; ctx.strokeRect(x, y, w, h);
      ctx.lineWidth = 1.2 * s; ctx.strokeRect(x + 7 * s, y + 7 * s, w - 14 * s, h - 14 * s);
      ctx.restore();
    },
    counter(ctx, value, x, y, p, o = {}) {
      return style.title(ctx, K.fmt(value), x, y, 1, { size: o.size || 140, align: o.align || 'center', weight: 700 });
    },
    // red grease pencil: waxy, broken, slightly open loop drawn in one go
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), pts = K.wobble(K.circlePts(x, y, r * 1.15, r * (o.ry || 0.6), 90, -2.5, Math.PI * 2.15), 6 * s, o.seed || 7, 0.015), q = K.trim(pts, K.clamp(p));
      if (q.length < 2) return;
      ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      const rr = K.rng(5);
      for (let k = 0; k < 4; k++) { ctx.strokeStyle = K.rgba(o.color || C.red, 0.45 + rr() * 0.3); ctx.lineWidth = (3 + rr() * 3) * s; ctx.setLineDash([(30 + rr() * 50) * s, (2 + rr() * 4) * s]); ctx.beginPath(); q.forEach((pt, i) => (i ? ctx.lineTo(pt[0] + (k - 1.5) * 1.6 * s, pt[1] + (k - 1.5) * 1.1 * s) : ctx.moveTo(pt[0], pt[1]))); ctx.stroke(); }
      ctx.restore();
    },
    // the spinning newspaper: the page whirls away into the dark, then the next one whirls up and slaps flat
    transition(ctx, W, H, p, o = {}) {
      const snap = K.cached(`np-snap:${W}x${H}`, () => K.layer(W, H)), g = snap.getContext('2d');
      g.globalCompositeOperation = 'copy'; g.drawImage(ctx.canvas, 0, 0);
      const k = p < 0.5 ? K.ease.in(p / 0.5) : 1 - K.ease.out((p - 0.5) / 0.5);  // 0 = flat page, 1 = gone
      const sc = Math.max(0.0001, 1 - k), rot = (p < 0.5 ? 1 : -1) * k * Math.PI * 4;
      ctx.save(); ctx.fillStyle = '#0d0b08'; ctx.fillRect(0, 0, W, H);
      const lg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(W, H) * 0.7); lg.addColorStop(0, 'rgba(70,60,40,0.5)'); lg.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
      ctx.translate(W / 2, H / 2); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.shadowColor = 'rgba(0,0,0,0.6)'; ctx.shadowBlur = 30; ctx.drawImage(snap, -W / 2, -H / 2);
      ctx.restore();
    },
  };

  // ---------- the shared demo: the front page, then the inside page ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, mast: 70 * s, rule: 96 * s, date: 117 * s, head: [W / 2, 200 * s], video: [60 * s, 260 * s, 290 * s, 175 * s], node: [445 * s, 290 * s, 320 * s, 120 * s],
      chips: PL.map((_, i) => [920 * s, (262 + i * 62) * s]), greek: [[60 * s, 520 * s, 290 * s, 160 * s], [445 * s, 470 * s, 320 * s, 210 * s]], top: [W / 2, 185 * s], counter: [W / 2, 430 * s], take: [W / 2, 640 * s] };
    return { s, P: true, mast: H * 0.05, rule: H * 0.062, date: H * 0.075, head: [W / 2, H * 0.135], head2: [W / 2, H * 0.19], video: [W * 0.08, H * 0.215, W * 0.5, H * 0.125], node: [W * 0.17, H * 0.41, W * 0.66, H * 0.07],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.555 + Math.floor(i / 2) * 0.072)]), greek: [[W * 0.62, H * 0.215, W * 0.3, H * 0.125], [W * 0.08, H * 0.85, W * 0.84, H * 0.12]], top: [W / 2, H * 0.2], counter: [W / 2, H * 0.47], take: [W / 2, H * 0.72] };
  }
  function masthead(ctx, W, H, Lo, s, inside) {
    ctx.save(); ctx.fillStyle = ink(ctx);
    if (!inside) {
      ctx.font = K.font((Lo.P ? 58 : 66) * s, F.mast, 400); ctx.textAlign = 'center'; ctx.fillText('The Daily Creator', W / 2, Lo.mast);
      if (!Lo.P) { ctx.font = K.font(11 * s, F.body, 400); ctx.textAlign = 'left'; ctx.fillText('LATE CITY EDITION', 40 * s, Lo.mast - 30 * s);
      ctx.textAlign = 'right'; ctx.fillText('Weather: viral, clear tonight.', W - 40 * s, Lo.mast - 30 * s); }
    } else {
      ctx.font = K.font(30 * s, F.mast, 400); ctx.textAlign = 'center'; ctx.fillText('The Daily Creator', W / 2, Lo.P ? H * 0.04 : 52 * s);
    }
    const ry = inside ? (Lo.P ? H * 0.05 : 66 * s) : Lo.rule;
    ctx.fillRect(36 * s, ry, W - 72 * s, 3.2 * s); ctx.fillRect(36 * s, ry + 6 * s, W - 72 * s, 1 * s);
    ctx.font = K.font(11 * s, F.body, 400); ctx.textAlign = 'left'; const dy = inside ? ry + 22 * s : Lo.date;
    ctx.fillText(inside ? 'PAGE 2   BUSINESS' : 'VOL. CVI   No. 293', 40 * s, dy);
    ctx.textAlign = 'center'; ctx.fillText('MONDAY, OCTOBER 20, 2026', W / 2, dy); ctx.textAlign = 'right'; ctx.fillText('FIVE CENTS', W - 40 * s, dy);
    ctx.fillRect(36 * s, dy + 8 * s, W - 72 * s, 1 * s);
    ctx.restore();
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      // slow camera creep toward the headline
      const z = 1 + 0.03 * K.beat(t, scene2 ? 8.3 : 0.6, 5, 'inOut');
      ctx.save(); ctx.translate(W / 2, H * 0.35); ctx.scale(z, z); ctx.translate(-W / 2, -H * 0.35);
      style.background(ctx, W, H, t);
      if (!scene2) {
        masthead(ctx, W, H, Lo, s, false);
        if (P) { style.title(ctx, 'ONE VIDEO.', Lo.head[0], Lo.head[1], K.beat(t, 0.6, 0.6, 'lin'), { size: 84, align: 'center' }); style.title(ctx, 'EVERY PLATFORM.', Lo.head2[0], Lo.head2[1], K.beat(t, 1.1, 0.7, 'lin'), { size: 84, align: 'center', maxW: W * 0.86 }); }
        else style.title(ctx, 'ONE VIDEO. EVERY PLATFORM.', Lo.head[0], Lo.head[1], K.beat(t, 0.6, 1.1, 'lin'), { size: 84, align: 'center', maxW: W - 80 * s });
        const hr = P ? Lo.head2[1] + 18 * s : Lo.head[1] + 18 * s; ctx.fillStyle = ink(ctx); ctx.fillRect(36 * s, hr, W - 72 * s, 2 * s);
        // the greeked columns (article copy) fade up with the page
        ctx.save(); ctx.globalAlpha = K.beat(t, 0.6, 0.8); for (const [gx, gy, gw, gh] of Lo.greek) { ctx.drawImage(greek(W, H, gw, gh, Math.round(gx + gy)), gx, gy); } ctx.restore();
        const [vx, vy, vw, vh] = Lo.video, vp = K.beat(t, 2.0, 0.7, 'lin');
        if (vp > 0) {
          ctx.save(); ctx.beginPath(); ctx.rect(vx, vy, vw * vp, vh); ctx.clip(); ctx.drawImage(wirePhoto(W, H, vw, vh), vx, vy);
          const r = Math.min(vw, vh) * 0.2, cx = vx + vw * 0.5, cy = vy + vh * 0.5; ctx.fillStyle = C.paper; ctx.strokeStyle = C.ink; ctx.lineWidth = 3 * s;
          ctx.beginPath(); ctx.arc(cx, cy, r * 1.3, 0, 7); ctx.fill(); ctx.stroke(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy - r * 0.7); ctx.lineTo(cx + r * 0.75, cy); ctx.lineTo(cx - r * 0.45, cy + r * 0.7); ctx.fill(); ctx.restore();
          style.box(ctx, vx, vy, vw, vh, vp, { tint: false });
        }
        // photo caption in italic + the label
        style.label(ctx, 'your video', vx, vy + vh + 40 * s, K.beat(t, 2.6, 0.4, 'lin'), { size: 34 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 56 * s], [nx + nw / 2, ny - 4 * s]] : [[vx + vw + 6 * s, vy + vh / 2], [nx - 6 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.2, 0.8, 'lin'), { elbowX: P ? undefined : (vx + vw + nx) / 2, straight: false });
        const np = K.beat(t, 4.0, 0.8, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, {});
        if (np > 0.3) { ctx.save(); ctx.fillStyle = C.paper; ctx.fillRect(nx + 14 * s, ny + 14 * s, nw - 28 * s, nh - 28 * s); ctx.restore(); style.title(ctx, 'CREATOR OS', nx + nw / 2, ny + nh / 2 + 20 * s, K.clamp((np - 0.3) / 0.7), { size: 56, align: 'center', maxW: nw - 40 * s }); }
        if (P) style.arrow(ctx, [W / 2, ny + nh + 4 * s], [W / 2, Lo.chips[6][1] - 10 * s], K.beat(t, 4.9, 0.5, 'lin'), { straight: true });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 10 * s] : [nx + nw + 6 * s, ny + nh / 2];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 10 * s] : [cx - 12 * s, cy - 11 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { elbowX: P ? undefined : nx + nw + 70 * s, straight: P, width: 2.2 });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.25, 0.3, 'lin'), { size: P ? 34 : 34, align: P ? (left ? 'right' : 'left') : 'left' });
        });
      } else {
        masthead(ctx, W, H, Lo, s, true);
        style.label(ctx, 'By the numbers', W / 2, Lo.top[1] - (P ? 10 : 50) * s, 1, { size: 30, align: 'center' });
        const [, , nw, nh] = Lo.node, w2 = P ? nw : nw * 0.9, h2 = nh * 0.85, bx = Lo.top[0] - w2 / 2, by = Lo.top[1] - h2 / 2 + (P ? 70 : 20) * s;
        style.box(ctx, bx, by, w2, h2, 1, {}); ctx.fillStyle = C.paper; ctx.fillRect(bx + 14 * s, by + 14 * s, w2 - 28 * s, h2 - 28 * s);
        style.title(ctx, 'CREATOR OS', W / 2, by + h2 / 2 + 18 * s, 1, { size: 50, align: 'center', maxW: w2 - 40 * s });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1] + 30 * s, 1, { size: P ? 130 : 140 });
        style.title(ctx, 'views, from a single upload', Lo.counter[0], Lo.counter[1] + (P ? 110 : 88) * s, K.beat(t, 8.8, 0.5, 'lin'), { size: 30, align: 'center', family: F.body, weight: 400 });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 15 * s, (P ? 270 : 290) * s, K.beat(t, 10.0, 0.55, 'lin'), { ry: P ? 0.72 : 0.55 });
        ctx.fillStyle = ink(ctx); ctx.fillRect(36 * s, Lo.take[1] - (P ? 100 : 56) * s, W - 72 * s, 2 * s);
        if (P) { style.title(ctx, 'POST ONCE.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.5, 'lin'), { size: 84, align: 'center' }); style.title(ctx, 'REACH EVERYWHERE.', Lo.take[0], Lo.take[1] + 110 * s, K.beat(t, 10.8, 0.6, 'lin'), { size: 84, align: 'center', maxW: W * 0.86 }); }
        else style.title(ctx, 'POST ONCE. REACH EVERYWHERE.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: 68, align: 'center', maxW: W - 80 * s });
      }
      ctx.restore();
      if (t < 0.6) style.transition(ctx, W, H, 0.5 + 0.5 * K.clamp(t / 0.6), {});
      if (t > 7.5 && t < 9.1) style.transition(ctx, W, H, K.clamp((t - 7.5) / 1.6), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2); k.bed('vinyl', 0, 12, 0.5);
      k.play('whoosh', 0.0, { dur: 0.6 }); k.play('thud', 0.6, { gain: 0.7 }); k.play('paper', 0.6, { dur: 0.3 });
      k.play('type', 0.65, { dur: 1.1 }); k.play('paper', 2.0, { dur: 0.7, gain: 0.8 }); k.play('type', 2.6, { dur: 0.4 });
      k.play('scribble', 3.2, { medium: 'pen', dur: 0.8 }); k.play('click', 4.0); k.play('type', 4.3, { dur: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.3, gain: 0.8 }); k.play('click', 5.3 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('whoosh', 7.5, { dur: 0.8 }); k.play('whoosh', 8.3, { dur: 0.8, up: false }); k.play('thud', 9.1, { gain: 0.7 }); k.play('paper', 9.1, { dur: 0.25 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('scribble', 10.0, { medium: 'chalk', dur: 0.55, gain: 1.2 }); k.play('stamp', 10.05, { gain: 0.5 });
      k.play('type', 10.5, { dur: 0.9 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
