// Byzantine Mosaic (Illustration). A wall built from hand-cut tesserae: a gold-smalti ground laid in jittered rows,
// a red-and-white diamond border band, figures laid in rows that follow their own contours (andamento: rectangles in
// concentric rings, connectors along their length), lettering cut from small tesserae, warm mortar in every joint,
// bevelled tile edges, per-tile colour variation, and gold smalti that flash in turn as light rakes the wall.
(function () {
  const C = { mortar: '#5f5546', gold: '#c9a03c', goldHi: '#f2d77e', goldLo: '#8f6a22', red: '#9e2a24', white: '#ece4d2', lapis: '#1f3a7a', lapisLo: '#152a5c', ink: '#1d1a1f', teal: '#2f7d7a' };
  const SERIF = 'Cormorant Garamond', CAPS = 'Libre Baskerville';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // a few pre-mixed shades per colour so every tile differs without per-tile string building
  const SHADES = new Map();
  function shades(col) {
    if (!SHADES.has(col)) { const a = []; for (let i = 0; i < 7; i++) { const k = (i - 3) / 3; a.push(K.rgba(k < 0 ? K.mix(col, '#000000', -k * 0.22) : K.mix(col, '#ffffff', k * 0.16))); } SHADES.set(col, a); }
    return SHADES.get(col);
  }
  // one tessera: a slightly irregular quad, rotated to the laying direction, with a bevel highlight
  function tess(ctx, x, y, w, h, ang, col, r, bevel = true) {
    const c = Math.cos(ang), s = Math.sin(ang), j = () => (r() - 0.5) * 0.22;
    const pts = [[-0.5 + j(), -0.5 + j()], [0.5 + j(), -0.5 + j()], [0.5 + j(), 0.5 + j()], [-0.5 + j(), 0.5 + j()]].map(([u, v]) => [x + (u * w) * c - (v * h) * s, y + (u * w) * s + (v * h) * c]);
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.lineTo(pts[2][0], pts[2][1]); ctx.lineTo(pts[3][0], pts[3][1]); ctx.closePath();
    const sh = shades(col); ctx.fillStyle = sh[Math.floor(r() * 7)]; ctx.fill();
    if (bevel) { ctx.strokeStyle = 'rgba(255,255,255,0.22)'; ctx.beginPath(); ctx.moveTo(pts[3][0], pts[3][1]); ctx.lineTo(pts[0][0], pts[0][1]); ctx.lineTo(pts[1][0], pts[1][1]); ctx.stroke(); }
  }

  // ---------- the ground: gold field in rows + border band (cached) ----------
  function ground(W, H) {
    return K.cached(`mos-ground:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H), ts = 12 * s, r = K.rng(9), glints = [];
      x.fillStyle = C.mortar; x.fillRect(0, 0, W, H);
      const nz = K.noise(5); x.lineWidth = Math.max(1, 1.1 * s);
      const band = 40 * s;
      for (let row = 0, y = ts / 2; y < H + ts; y += ts * 1.04, row++) {
        let px = -r() * ts;
        while (px < W + ts) {
          const w = ts * r.range(0.75, 1.25), cx = px + w / 2, cy = y + (r() - 0.5) * ts * 0.12;
          const d = Math.min(cx, cy, W - cx, H - cy); let col;
          if (d < band) {
            // border band: dark rule outside, white field with red diamonds, dark rule inside
            const u = d / band, along = (cx < band || cx > W - band) ? cy : cx, k = ((along / (band * 1.2)) % 1 + 1) % 1, dd = Math.abs(k - 0.5) * 2 + Math.abs(u - 0.5) * 1.6;
            col = u < 0.14 || u > 0.86 ? C.red : dd < 0.55 ? C.red : C.white;
          } else {
            const m = nz.fbm2(cx * 0.01, cy * 0.01, 2) * 0.25, q = r() + m;
            col = q > 0.86 ? C.goldHi : q < 0.14 ? '#a98428' : C.gold;
            if (r() < 0.25) glints.push([cx, cy, w * 0.86, ts * 0.86, (r() - 0.5) * 0.12, r() * 6.28]);
          }
          tess(x, cx, cy, w * 0.86, ts * 0.86, (r() - 0.5) * 0.08, col, r);
          px += w;
        }
      }
      // a soft halo of darker smalti in the upper field (depth of the apse)
      const g = x.createRadialGradient(W / 2, H * 0.45, 0, W / 2, H * 0.45, Math.max(W, H) * 0.7); g.addColorStop(0, 'rgba(255,230,160,0.10)'); g.addColorStop(1, 'rgba(40,20,0,0.25)');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      c.glints = glints; return c;
    });
  }

  // ---------- andamento generators (cached tile lists) ----------
  // tiles along a polyline: rows rows wide, laid in order of travel
  function alongPath(pts, ts, rows, seed) {
    const r = K.rng(seed), out = [], L = K.pathLen(pts); let acc = 0, i = 1, segAcc = 0;
    for (let d = ts / 2; d < L; d += ts * r.range(0.9, 1.15)) {
      while (i < pts.length - 1 && segAcc + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]) < d) { segAcc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); i++; }
      const a = pts[i - 1], b = pts[i], sl = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, k = K.clamp((d - segAcc) / sl), ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const px = K.lerp(a[0], b[0], k), py = K.lerp(a[1], b[1], k), nx = -Math.sin(ang), ny = Math.cos(ang);
      for (let rr = 0; rr < rows; rr++) { const off = (rr - (rows - 1) / 2) * ts * 1.05; out.push([px + nx * off, py + ny * off, ts * 0.88 * r.range(0.85, 1.1), ts * 0.86, ang + (r() - 0.5) * 0.1, rr]); }
      acc++;
    }
    return out;
  }
  // a rectangle laid in concentric rings from the edge inward (ring index kept for colouring)
  function rings(x, y, w, h, ts, seed) {
    const out = []; let k = 0;
    for (let inset = ts / 2; inset * 2 < Math.min(w, h); inset += ts * 1.04, k++) {
      const x0 = x + inset, y0 = y + inset, x1 = x + w - inset, y1 = y + h - inset;
      const ring = x1 - x0 < ts * 0.6 ? [[x0, (y0 + y1) / 2 - 0.01], [x0, (y0 + y1) / 2]] : y1 - y0 < ts * 0.6 ? [[x0, y0], [x1, y0]] : [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
      for (const tl of alongPath(ring, ts, 1, seed + k * 13)) { tl[5] = k; out.push(tl); }
    }
    return out;
  }
  // horizontal rows clipped to a convex polygon (for small solid shapes such as the play mark)
  function polyFill(poly, ts, seed) {
    const r = K.rng(seed), out = [], xs = poly.map((p) => p[0]), ys = poly.map((p) => p[1]);
    const inside = (px, py) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c; } return c; };
    for (let y = Math.min(...ys) + ts / 2; y < Math.max(...ys); y += ts * 1.04) for (let x = Math.min(...xs) + ts / 2 * r(); x < Math.max(...xs); x += ts * r.range(0.9, 1.1)) if (inside(x, y)) out.push([x, y, ts * 0.86, ts * 0.86, (r() - 0.5) * 0.1, 0]);
    return out;
  }
  function lay(ctx, tiles, p, colOf, seed) {
    const n = Math.floor(tiles.length * K.clamp(p)), r = K.rng(seed), s = sOf(ctx); ctx.lineWidth = Math.max(1, 1.1 * s);
    for (let i = 0; i < n; i++) { const t = tiles[i]; tess(ctx, t[0], t[1], t[2], t[3], t[4], colOf(t[5], i), r); }
    // the tile being pressed in right now: lifted, with a little shadow
    if (n < tiles.length && p > 0) { const t = tiles[n]; ctx.save(); ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(t[0] - t[2] * 0.4 + 3 * s, t[1] - t[3] * 0.4 + 4 * s, t[2] * 0.9, t[3] * 0.9); tess(ctx, t[0] - 2 * s, t[1] - 3 * s, t[2] * 1.1, t[3] * 1.1, t[4], colOf(t[5], n), r); ctx.restore(); }
  }

  // ---------- lettering cut from small tesserae ----------
  function gridTiles(s) {
    return K.cached(`mos-fine:${s.toFixed(3)}`, () => {
      const ts = Math.max(4, 5.2 * s), n = 14, size = Math.round(ts * n), r = K.rng(31);
      const grout = K.layer(size, size), g = grout.getContext('2d'), shade = K.layer(size, size), h = shade.getContext('2d');
      g.strokeStyle = '#000'; g.lineWidth = Math.max(1, 0.9 * s);
      for (let j = 0; j < n; j++) {
        const y0 = j * ts; g.beginPath(); g.moveTo(0, y0); g.lineTo(size, y0); g.stroke();
        let x = 0; const cuts = []; while (x < size - ts * 0.7) { x += ts * r.range(0.8, 1.2); cuts.push(Math.min(size, x)); }
        let prev = 0; for (const cx of cuts) { const xx = cx >= size - ts * 0.5 ? size : cx; g.beginPath(); g.moveTo(xx, y0); g.lineTo(xx + (r() - 0.5) * ts * 0.2, y0 + ts); g.stroke();
          h.fillStyle = r() < 0.5 ? `rgba(255,255,255,${r() * 0.22})` : `rgba(0,0,0,${r() * 0.25})`; h.fillRect(prev, y0, xx - prev, ts); h.fillStyle = 'rgba(255,255,255,0.18)'; h.fillRect(prev, y0, xx - prev, ts * 0.18); prev = xx; if (xx >= size) break; }
      }
      return { grout, shade };
    });
  }
  function scratch(W, H) { return K.cached(`mos-scratch:${W}x${H}`, () => K.layer(W, H)); }
  function tileText(ctx, text, x, y, p, o) {
    const W = ctx.canvas.width, H = ctx.canvas.height, s = sOf(ctx), size = (o.size || 48) * s;
    const sc = scratch(W, H), x2 = sc.getContext('2d'), fine = gridTiles(s);
    x2.font = K.font(size, o.family || CAPS, o.weight || 700); const txt = o.caps ? text.toUpperCase() : text, w = x2.measureText(txt).width;
    const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, pad = size * 0.3;
    const bx = Math.max(0, Math.floor(x0 - pad)), by = Math.max(0, Math.floor(y - size * 1.05 - pad)), bw = Math.min(W - bx, Math.ceil(w + pad * 2)), bh = Math.min(H - by, Math.ceil(size * 1.45 + pad * 2));
    if (bw <= 0 || bh <= 0 || p <= 0) return { w, h: size };
    x2.save(); x2.clearRect(bx, by, bw, bh); x2.beginPath(); x2.rect(bx, by, bw, bh); x2.clip();
    const shown = txt.slice(0, Math.ceil(txt.length * K.clamp(p)));
    x2.textAlign = 'left'; x2.lineJoin = 'round';
    x2.strokeStyle = o.outline || C.white; x2.lineWidth = size * (o.outlineW || 0.2); x2.strokeText(shown, x0, y);
    x2.fillStyle = o.color || C.lapis; x2.fillText(shown, x0, y);
    // cut the letters into tesserae: punch out the grout joints, then vary each stone
    x2.globalCompositeOperation = 'destination-out'; x2.fillStyle = x2.createPattern(fine.grout, 'repeat'); x2.fillRect(bx, by, bw, bh);
    x2.globalCompositeOperation = 'source-atop'; x2.fillStyle = x2.createPattern(fine.shade, 'repeat'); x2.fillRect(bx, by, bw, bh);
    x2.restore();
    // mortar bed behind the letters, then the stones
    ctx.save(); ctx.shadowColor = 'rgba(30,20,10,0.55)'; ctx.shadowOffsetX = 1.5 * s; ctx.shadowOffsetY = 2 * s; ctx.shadowBlur = 0;
    ctx.drawImage(sc, bx, by, bw, bh, bx, by, bw, bh); ctx.restore();
    return { w, h: size };
  }

  const style = {
    id: 'mosaic', name: 'Byzantine Mosaic', family: 'Illustration',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,600&family=Libre+Baskerville:wght@400;700&display=block',
      specs: ['700 48px "Libre Baskerville"', '700 34px "Cormorant Garamond"'] }],
    palette: { bg: C.gold, mortar: C.mortar, gold: C.gold, red: C.red, white: C.white, lapis: C.lapis, teal: C.teal },
    sfx: { draw: null, land: 'click', emphasis: 'chime', transition: 'glitch', bed: 'room' },
    tess, alongPath, rings, polyFill, lay, tileText,
    setup(W, H) { ground(W, H); },

    // the wall, with gold smalti flashing in turn as a diagonal band of light rakes across it (figures then cover them)
    background(ctx, W, H, t) {
      const g0 = ground(W, H), gl = g0.glints || [], band = ((t * 0.16) % 1.6 - 0.3) * (W + H);
      ctx.drawImage(g0, 0, 0);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [x, y, w, h, a, ph] of gl) {
        const d = Math.abs(x + y * 0.6 - band); if (d > 220) continue;
        const f = (1 - d / 220) * Math.max(0, Math.sin(t * 5 + ph * 3)); if (f < 0.25) continue;
        ctx.fillStyle = `rgba(255,236,170,${(f * 0.55).toFixed(3)})`; ctx.fillRect(x - w / 2, y - h / 2, w, h);
      }
      ctx.restore();
    },
    // raking light sheen, vignette, a touch of grain
    finish(ctx, W, H, t) {
      const band = ((t * 0.16) % 1.6 - 0.3) * (W + H);
      const lg = ctx.createLinearGradient(0, 0, W, H); const k = K.clamp((band / (W + H)) + 0.1);
      lg.addColorStop(0, 'rgba(255,240,200,0)'); lg.addColorStop(Math.max(0, k - 0.12), 'rgba(255,240,200,0)'); lg.addColorStop(k, 'rgba(255,240,200,0.10)'); lg.addColorStop(Math.min(1, k + 0.12), 'rgba(255,240,200,0)'); lg.addColorStop(1, 'rgba(255,240,200,0)');
      ctx.fillStyle = lg; ctx.fillRect(0, 0, W, H);
      K.vignette(ctx, W, H, 0.4, '#1a0f05');
      K.grain(ctx, W, H, t, 0.04, 12, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) { return tileText(ctx, text, x, y, p, { size: 60, color: o.color || C.red, outline: C.white, outlineW: 0.24, ...o }); },
    label(ctx, text, x, y, p, o = {}) { return tileText(ctx, text, x, y, p, { size: 36, color: o.color || C.lapis, outline: C.white, outlineW: 0.26, ...o }); },

    // connector laid tile by tile along its length, two rows wide, with a chevron head of tiles
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), ts = 9 * s, key = `mos-arr:${from.map((v) => v | 0)}:${to.map((v) => v | 0)}:${o.bend ?? 0.12}`;
      const pts = K.arcPts(from, to, o.bend ?? 0.12, 40);
      const body = K.cached(key, () => {
        const b = alongPath(pts.slice(0, -3), ts, 2, 3), e = pts[pts.length - 1], a = pts[pts.length - 6], ang = Math.atan2(e[1] - a[1], e[0] - a[0]), L = ts * 3.2;
        for (const sg of [-1, 1]) for (const tl of alongPath([[e[0] - Math.cos(ang + sg * 0.6) * L, e[1] - Math.sin(ang + sg * 0.6) * L], e], ts, 2, 7 + sg)) { tl[5] = 2; b.push(tl); }
        return b;
      });
      const col = o.color || C.red;
      lay(ctx, body, p, (row) => (row === 2 ? C.ink : col), 11);
      const n = Math.max(1, Math.floor(body.length * K.clamp(p))); return [body[n - 1][0], body[n - 1][1]];
    },

    // a panel laid in concentric rings: dark outline ring, a white ring, then the field colour
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), ts = 10 * s, key = `mos-box:${x | 0},${y | 0},${w | 0},${h | 0}`;
      const tiles = K.cached(key, () => rings(x, y, w, h, ts, (x * 7 + y * 3) | 0));
      const fill = o.fill || C.lapis, edge = o.edge || C.white;
      // the setting bed goes down first: fresh mortar tinted by the field colour (no gold shows through the joints)
      if (p > 0) { ctx.save(); ctx.globalAlpha = K.clamp(p * 4); ctx.fillStyle = C.mortar; ctx.fillRect(x, y, w, h); ctx.fillStyle = K.rgba(K.mix(fill, '#000000', 0.35), 0.8); ctx.fillRect(x + 2 * ts, y + 2 * ts, w - 4 * ts, h - 4 * ts); ctx.restore(); }
      lay(ctx, tiles, p, (k) => (k === 0 ? C.ink : k === 1 ? edge : k === 2 && o.inner ? o.inner : fill), (x + y) | 0);
    },

    counter(ctx, value, x, y, p, o = {}) { return tileText(ctx, K.fmt(value), x, y, 1, { size: o.size || 120, color: o.color || C.red, outline: C.white, outlineW: 0.18, align: o.align || 'center', family: CAPS }); },

    // a ring of red tesserae laid around the moment, then gold smalti flash outward from it
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return; const s = sOf(ctx), ts = 10 * s, rx = r * 1.25, ry = r * (o.ry || 0.62);
      const key = `mos-emph:${x | 0},${y | 0},${r | 0},${ry | 0}`;
      const tiles = K.cached(key, () => { const a = alongPath(K.circlePts(x, y, rx, ry, 120), ts, 2, 21); return a; });
      lay(ctx, tiles, K.clamp(p / 0.7), (row) => (row ? C.white : C.red), 23);
      const fp = K.clamp((p - 0.55) / 0.45); if (fp <= 0) return;
      const rg = K.rng(91); ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 40; i++) { const a = rg() * Math.PI * 2, d = K.lerp(1.05, 1.45, rg()) * K.lerp(0.9, 1, fp), px = x + Math.cos(a) * rx * d, py = y + Math.sin(a) * ry * d, f = Math.max(0, Math.sin(fp * Math.PI * 2 + i)) * (1 - fp * 0.5);
        ctx.fillStyle = `rgba(255,232,150,${(0.7 * f).toFixed(3)})`; ctx.fillRect(px - ts * 0.45, py - ts * 0.45, ts * 0.9, ts * 0.9); }
      ctx.restore();
    },

    // pry and re-lay: a sweeping front lifts the old tesserae (bare ground behind it), then lays the new wall
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), g = ground(W, H), first = p < 0.5, k = K.ease.inOut(first ? p * 2 : (p - 0.5) * 2), fx = K.lerp(-60 * s, W + 60 * s, k);
      ctx.save(); ctx.beginPath(); if (first) ctx.rect(0, 0, Math.max(0, fx), H); else ctx.rect(fx, 0, W - fx, H); ctx.clip(); ctx.drawImage(g, 0, 0); ctx.restore();
      // loose tesserae tumbling at the front
      const r = K.rng(first ? 3 : 4), ts = 11 * s;
      if (k > 0 && k < 1) for (let i = 0; i < 70; i++) {
        const y = r() * H, life = r(), dx = (first ? -1 : 1) * life * 70 * s, dy = life * life * 90 * s;
        ctx.save(); ctx.translate(fx + dx + (r() - 0.5) * 30 * s, y + dy); ctx.rotate(r() * 6 + k * 8);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(-ts / 2 + 3 * s, -ts / 2 + 4 * s, ts, ts);
        ctx.fillStyle = r.pick([C.gold, C.goldHi, C.red, C.lapis, C.white]); ctx.fillRect(-ts / 2, -ts / 2, ts, ts); ctx.restore();
      }
    },
  };

  // ---------- the shared demo: one wall, re-laid once ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 128 * s], video: [100 * s, 240 * s, 260 * s, 180 * s], node: [455 * s, 260 * s, 360 * s, 150 * s],
      chips: PLATFORMS.map((n, i) => [930 * s, (196 + i * 66) * s]) };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.18, W * 0.5, H * 0.14], node: [W * 0.15, H * 0.4, W * 0.7, H * 0.09],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.6 + Math.floor(i / 2) * 0.08)]) };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const scene2 = t >= 8.25;
      if (!scene2) {
        if (P) { style.title(ctx, 'One video.', W / 2, H * 0.085, K.beat(t, 0.1, 0.7, 'lin'), { size: 62, align: 'center' });
          style.title(ctx, 'Every platform.', W / 2, H * 0.135, K.beat(t, 0.8, 0.9, 'lin'), { size: 62, align: 'center' }); }
        else style.title(ctx, 'One video. Every platform.', W / 2, Lo.title[1], K.beat(t, 0.1, 1.6, 'lin'), { size: 56, align: 'center' });
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 1.0, 'lin'), { fill: C.lapis });
        if (t > 2.8) { const tri = [[vx + vw * 0.38, vy + vh * 0.22], [vx + vw * 0.38, vy + vh * 0.78], [vx + vw * 0.66, vy + vh * 0.5]];
          const tl = K.cached(`mos-tri:${W}x${H}`, () => polyFill(tri, 8 * s, 5)); lay(ctx, tl, K.beat(t, 2.8, 0.4, 'lin'), () => C.red, 6); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 50 * s, K.beat(t, 3.0, 0.5, 'lin'), { align: 'center' });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 74 * s], [nx + nw / 2, ny - 14 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - 16 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.4, 0.7, 'lin'), { bend: P ? 0.06 : -0.12 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 4.0, 0.8, 'lin'), { fill: C.red, edge: C.goldHi });
        style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 16 * s, K.beat(t, 4.6, 0.4, 'lin'), { size: 46, align: 'center', color: C.white, outline: C.ink, outlineW: 0.14 });
        if (P) style.arrow(ctx, [W / 2, ny + nh + 14 * s], [W / 2, Lo.chips[6][1] - 4 * s], K.beat(t, 4.95, 0.5, 'lin'), { bend: 0.0 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.35, 'lin');
          if (P) style.arrow(ctx, [W / 2, cy - 12 * s], [left ? W * 0.465 : W * 0.535, cy - 12 * s], p, { bend: 0 });
          else style.arrow(ctx, [nx + nw + 14 * s, ny + nh / 2], [cx - 24 * s, cy - 12 * s], p, { bend: (i - 3) * 0.03 });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.25, 0.3, 'lin'), { size: P ? 36 : 36, align: P ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      } else {
        const [, , nw, nh] = Lo.node, top = P ? H * 0.17 : 70 * s, bw = P ? nw : 380 * s, bh = P ? nh : 110 * s;
        style.box(ctx, W / 2 - bw / 2, top, bw, bh, 1, { fill: C.red, edge: C.goldHi });
        style.title(ctx, 'Creator OS', W / 2, top + bh / 2 + 16 * s, 1, { size: 46, align: 'center', color: C.white, outline: C.ink, outlineW: 0.14 });
        const cy = P ? H * 0.47 : 405 * s;
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t > 8.5) style.counter(ctx, Math.round(v / 1000) * 1000, W / 2, cy, 1, { size: P ? 96 : 120 });
        style.label(ctx, 'views', W / 2, cy + 62 * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 44 });
        style.emphasis(ctx, W / 2, cy - 22 * s, (P ? 230 : 290) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: P ? 0.75 : 0.5 });
        const tp = K.beat(t, 10.5, 1.0, 'lin');
        if (P) { style.title(ctx, 'Post once.', W / 2, H * 0.72, K.clamp(tp * 2), { size: 66, align: 'center' });
          style.title(ctx, 'Reach everywhere.', W / 2, H * 0.72 + 96 * s, K.clamp(tp * 2 - 1), { size: 66, align: 'center' }); }
        else style.title(ctx, 'Post once. Reach everywhere.', W / 2, 655 * s, tp, { size: 52, align: 'center' });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), {});
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2); k.play('swell', 0, { chord: ['C3', 'G3', 'C4'], dur: 2.2, gain: 0.7 });
      const clicks = (t0, d, n, g = 0.8) => { for (let i = 0; i < n; i++) k.play('click', t0 + (d * i) / n, { pitch: 0.8 + ((i * 37) % 10) / 20, gain: g }); };
      clicks(0.1, 1.6, 22, 0.6);
      clicks(2.0, 1.0, 16); clicks(2.8, 0.4, 6); k.play('tick', 3.0);
      clicks(3.4, 0.7, 10); clicks(4.0, 0.8, 14); k.play('chime', 4.8, { note: 'G5', gain: 0.6 });
      for (let i = 0; i < 7; i++) { clicks(5.0 + i * 0.4, 0.35, 5, 0.6); k.play('pop', 5.3 + i * 0.4, { pitch: 1 + i * 0.05, gain: 0.5 }); }
      k.play('glitch', 7.65, { gain: 0.6 }); for (let i = 0; i < 18; i++) k.play('click', 7.6 + i * 0.07, { pitch: 0.6 + (i % 5) * 0.1, gain: 0.5 });
      k.play('whoosh', 8.2, { dur: 0.7 }); clicks(8.3, 0.6, 10, 0.5);
      k.play('count', 8.6, { dur: 1.4 }); clicks(10.0, 0.4, 12); k.play('chime', 10.3, { note: 'E6' });
      clicks(10.5, 1.0, 14, 0.5); k.play('chime', 11.4, { note: 'C6' }); k.play('swell', 10.6, { chord: ['C4', 'E4', 'G4'], dur: 1.4 });
    },
  };
  MS.register(style);
})();
