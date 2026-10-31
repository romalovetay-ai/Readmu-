// Punk Zine Collage (Paper & Craft). A photocopied cut-and-paste spread: ransom-note letters cut from mismatched
// magazines, typed strips under masking tape, torn halftone scraps with staples, black marker scrawls, all crushed
// to high-contrast toner that boils at 8 fps, with one fluoro-pink spot ink overprinted off-register. Each beat is
// a fresh photocopied sheet slapped down over the last with a copier flash.
(function () {
  const C = { paper: '#f2f0ea', toner: '#111111', pink: '#ff2e88', grey: '#d8d4cb', tape: 'rgba(222,204,160,0.72)' };
  const FACES = [['Anton', 400], ['Abril Fatface', 400], ['Black Ops One', 400], ['Bebas Neue', 400], ['Shrikhand', 400], ['Rubik Mono One', 400], ['Playfair Display', 900], ['Special Elite', 400]];
  const TYPE = 'Special Elite', MARK = 'Permanent Marker';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  let NOW = 0;
  const step = () => Math.floor(NOW * 8);          // the stop-motion / toner boil clock

  // toner speckle tiles (four, cycled at 8 fps): black specks and a few white dropouts
  function tonerTile(v) {
    return K.cached(`cz-toner:${v}`, () => {
      const n = 256, c = K.layer(n, n), x = c.getContext('2d'), r = K.rng(500 + v);
      for (let i = 0; i < 520; i++) { x.fillStyle = r() < 0.75 ? `rgba(0,0,0,${0.2 + r() * 0.45})` : 'rgba(255,255,255,0.7)'; const w = r() < 0.92 ? 0.8 + r() * 1.2 : 2 + r() * 3; x.fillRect(r() * n, r() * n, w, w * (0.5 + r())); }
      return c;
    });
  }
  // halftone screen tile (coarse photocopied dots)
  function dotTile(pitch) {
    return K.cached(`cz-dots:${pitch | 0}`, () => { const n = Math.max(5, pitch | 0), c = K.layer(n, n), x = c.getContext('2d'); x.fillStyle = C.toner; x.beginPath(); x.arc(n / 2, n / 2, n * 0.36, 0, 7); x.fill(); return c; });
  }
  const jitterPoly = (x, y, w, h, r, a) => [[x + (r() - 0.5) * a, y + (r() - 0.5) * a], [x + w + (r() - 0.5) * a, y + (r() - 0.5) * a], [x + w + (r() - 0.5) * a, y + h + (r() - 0.5) * a], [x + (r() - 0.5) * a, y + h + (r() - 0.5) * a]];
  function tornPoly(x, y, w, h, seed, amp) {
    const r = K.rng(seed), out = [], seg = (a, b, n) => { for (let i = 0; i < n; i++) { const t = i / n; out.push([K.lerp(a[0], b[0], t) + (r() - 0.5) * amp, K.lerp(a[1], b[1], t) + (r() - 0.5) * amp]); } };
    const n = 14; seg([x, y], [x + w, y], n); seg([x + w, y], [x + w, y + h], n); seg([x + w, y + h], [x, y + h], n); seg([x, y + h], [x, y], n); return out;
  }
  function tape(ctx, x, y, w, h, rot, s) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = C.tape;
    ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); for (let i = 0; i <= 4; i++) ctx.lineTo(-w / 2 + (i % 2 ? 3 : -2) * s, -h / 2 + (h * i) / 4);
    ctx.lineTo(w / 2, h / 2); for (let i = 4; i >= 0; i--) ctx.lineTo(w / 2 + (i % 2 ? -3 : 2) * s, -h / 2 + (h * i) / 4); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(-w / 2, -h / 2, w, 1.5 * s); ctx.restore();
  }
  function staple(ctx, x, y, rot, s) { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillStyle = '#555'; ctx.fillRect(-12 * s, -1.6 * s, 24 * s, 3.2 * s); ctx.fillStyle = '#bbb'; ctx.fillRect(-12 * s, -1.6 * s, 24 * s, 1 * s); ctx.restore(); }

  // ransom-note letters: every glyph cut from a different magazine, re-cut and jittered on the 8 fps clock
  function ransom(ctx, text, x, y, size, p, o = {}) {
    const s = sOf(ctx), n = text.length, shown = Math.ceil(n * K.clamp(p)), st = o.still ? 0 : step();
    const cells = [...text].map((ch, i) => {
      const r = K.rng((o.seed || 1) * 977 + i * 31 + (o.recut || 0));
      const [fam, wt] = FACES[Math.floor(r() * FACES.length)], sz = size * (0.86 + r() * 0.26), up = r() < 0.7;
      const bgPick = r(), bg = bgPick < 0.42 ? C.paper : bgPick < 0.72 ? C.toner : bgPick < 0.86 ? C.pink : C.grey, fg = bg === C.toner ? C.paper : bg === C.pink ? C.toner : C.toner;
      ctx.save(); ctx.font = K.font(sz, fam, wt); const glyph = up ? ch.toUpperCase() : ch.toLowerCase(), w = ch === ' ' ? size * 0.32 : ctx.measureText(glyph).width + sz * 0.2; ctx.restore();
      return { ch: glyph, fam, wt, sz, bg, fg, w, r };
    });
    const total = cells.reduce((a, c) => a + c.w + size * 0.04, 0), maxW = o.maxW ?? ctx.canvas.width * 0.92;
    if (total > maxW && !o._fit) return ransom(ctx, text, x, y, size * (maxW / total) * 0.97, p, { ...o, _fit: true });
    let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
    cells.forEach((c, i) => {
      if (i < shown && c.ch.trim()) {
        const j = K.rng(i * 7 + st * 13 + (o.seed || 1)), rot = (c.r() - 0.5) * 0.22 + (j() - 0.5) * 0.04, dy = (c.r() - 0.5) * size * 0.14 + (j() - 0.5) * 2 * s;
        ctx.save(); ctx.translate(cx + c.w / 2, y - size * 0.35 + dy); ctx.rotate(rot);
        const h = c.sz * 1.12, poly = jitterPoly(-c.w / 2, -h * 0.58, c.w, h, c.r, 5 * s);
        ctx.fillStyle = c.bg; K.poly(ctx, poly, true); ctx.fill();
        if (c.bg === C.paper || c.bg === C.grey) { ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 1.2 * s; K.poly(ctx, poly, true); ctx.stroke(); }
        ctx.font = K.font(c.sz, c.fam, c.wt); ctx.fillStyle = c.fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(c.ch, 0, c.sz * 0.02);
        ctx.restore();
      }
      cx += c.w + size * 0.04;
    });
    return total;
  }

  const style = {
    id: 'collage-zine', name: 'Punk Zine Collage', family: 'Paper & Craft',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Anton&family=Abril+Fatface&family=Black+Ops+One&family=Bebas+Neue&family=Shrikhand&family=Rubik+Mono+One&family=Playfair+Display:wght@900&family=Special+Elite&family=Permanent+Marker&display=block',
      specs: ['400 40px "Anton"', '400 40px "Abril Fatface"', '400 40px "Black Ops One"', '400 40px "Bebas Neue"', '400 40px "Shrikhand"', '400 40px "Rubik Mono One"', '900 40px "Playfair Display"', '400 30px "Special Elite"', '400 30px "Permanent Marker"'] }],
    palette: { bg: C.paper, ink: C.toner, accent: C.pink, grey: C.grey },
    sfx: { draw: 'marker', land: 'stamp', emphasis: 'glitch', transition: 'whoosh', bed: 'tape' },

    // the copy paper: torn pink spot-ink band, ghost of a previous paste-up, lid shadow at the edges
    background(ctx, W, H, t, o = {}) {
      const s = S(W, H), P = H > W;
      const tex = K.cached(`cz-bg:${W}x${H}:${o.band || 0}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(31);
        x.fillStyle = C.paper; x.fillRect(0, 0, W, H);
        x.globalAlpha = 0.5; x.drawImage(K.paperTex(W, H, C.paper, 13, 0.04, false), 0, 0); x.globalAlpha = 1;
        // pink band torn across the sheet, multiplied
        const y0 = (P ? 0.62 : 0.55 + (o.band ? -0.25 : 0)) * H, sl = (P ? 0.08 : 0.2) * H, pts = [];
        for (let xx = -20; xx <= W + 20; xx += 12 * s) pts.push([xx, y0 - sl * (xx / W) + (r() - 0.5) * 10 * s]);
        for (let xx = W + 20; xx >= -20; xx -= 12 * s) pts.push([xx, y0 - sl * (xx / W) + (P ? 230 : 150) * s + (r() - 0.5) * 10 * s]);
        x.globalCompositeOperation = 'multiply'; x.fillStyle = C.pink; K.poly(x, pts, true); x.fill();
        x.globalAlpha = 0.35; x.fillStyle = x.createPattern(tonerTile(9), 'repeat'); K.poly(x, pts, true); x.fill(); x.globalAlpha = 1;
        // ghost glue marks + scotch residue
        x.globalCompositeOperation = 'source-over';
        for (let i = 0; i < 5; i++) { x.strokeStyle = 'rgba(0,0,0,0.06)'; x.lineWidth = 1.5 * s; x.strokeRect(r() * W * 0.8, r() * H * 0.8, (80 + r() * 200) * s, (40 + r() * 120) * s); }
        // copier lid shadow and side streaks
        const g = x.createLinearGradient(0, 0, W, 0); g.addColorStop(0, 'rgba(0,0,0,0.22)'); g.addColorStop(0.04, 'rgba(0,0,0,0)'); g.addColorStop(0.96, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)'); x.fillStyle = g; x.fillRect(0, 0, W, H);
        for (let i = 0; i < 4; i++) { x.fillStyle = `rgba(0,0,0,${0.04 + r() * 0.05})`; x.fillRect(r() * W, 0, (1 + r() * 2) * s, H); }
        return c;
      });
      ctx.drawImage(tex, 0, 0);
    },

    // toner boil at 8 fps, contrast crush, the drum's grey banding
    finish(ctx, W, H, t) {
      const v = Math.floor(t * 8) % 4;
      ctx.save(); ctx.fillStyle = ctx.createPattern(tonerTile(v), 'repeat'); ctx.globalAlpha = 0.5; ctx.fillRect(0, 0, W, H); ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.25; ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.grain(ctx, W, H, Math.floor(t * 8) / 8, 0.08, 8, 'overlay');
      const by = ((Math.floor(t * 8) * 97) % 100) / 100 * H;
      ctx.fillStyle = 'rgba(0,0,0,0.035)'; ctx.fillRect(0, by, W, 18 * S(W, H));
    },

    title(ctx, text, x, y, p, o = {}) { const s = sOf(ctx), size = (o.size || 62) * s; return { w: ransom(ctx, text, x, y, size, p, o), h: size }; },
    // typed strip under a piece of masking tape
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 30) * s, k = K.clamp(p); if (k <= 0) return { w: 0, h: 0 };
      ctx.save(); ctx.font = K.font(size, TYPE, 400); const tw = ctx.measureText(text).width; ctx.restore();
      const w = tw + size * 0.9, h = size * 1.35, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - size * 1.0;
      const r = K.rng(o.seed || text.length), rot = (r() - 0.5) * 0.06, slam = 1 + 0.25 * (1 - K.ease.out(K.clamp(k * 2)));
      ctx.save(); ctx.translate(x0 + w / 2, y0 + h / 2); ctx.rotate(rot); ctx.scale(slam, slam);
      ctx.fillStyle = o.fill || '#fbfaf6'; K.poly(ctx, jitterPoly(-w / 2, -h / 2, w, h, r, 3 * s), true); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.2 * s; ctx.stroke();
      ctx.font = K.font(size, TYPE, 400); ctx.fillStyle = C.toner; ctx.textBaseline = 'middle'; ctx.fillText(text.slice(0, Math.ceil(text.length * K.clamp(k * 1.5))), -w / 2 + size * 0.45, 2 * s);
      if (o.tape !== false) tape(ctx, (r() < 0.5 ? -1 : 1) * w * 0.45, -h * 0.45, 46 * s, 18 * s, (r() - 0.5) * 0.6, s);
      ctx.restore();
      return { w, h };
    },

    // black marker scrawl: doubled wobbly line, hand-drawn barbs
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.wobble(K.arcPts(from, to, o.bend ?? 0.2, 40), 3 * s, (o.seed || 3) + step() % 2, 0.05), q = K.trim(pts, K.clamp(p / 0.85)); if (q.length < 2) return null;
      ctx.save(); ctx.strokeStyle = o.color || C.toner; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.lineWidth = (o.width || 6) * s; K.poly(ctx, q); ctx.stroke(); ctx.lineWidth = (o.width || 6) * 0.5 * s; ctx.translate(1.5 * s, -1.2 * s); K.poly(ctx, q); ctx.stroke(); ctx.translate(-1.5 * s, 1.2 * s);
      if (p > 0.85) { const k = K.clamp((p - 0.85) / 0.15), b = pts[pts.length - 1], a = pts[pts.length - 5], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 24 * s * k; ctx.lineWidth = (o.width || 6) * s;
        for (const sg of [-1, 1]) { ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang + sg * 0.6) * L, b[1] - Math.sin(ang + sg * 0.6) * L); ctx.stroke(); } }
      ctx.restore();
      return q[q.length - 1];
    },

    // a torn halftone scrap, taped and stapled down
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.clamp(p); if (k <= 0) return;
      const slam = 1 + 0.35 * (1 - K.ease.out(K.clamp(k * 1.6))), r = K.rng(o.seed || 5);
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.rotate((r() - 0.5) * 0.06); ctx.scale(slam, slam); ctx.translate(-(x + w / 2), -(y + h / 2));
      ctx.globalAlpha = K.clamp(k * 4);
      const poly = tornPoly(x, y, w, h, o.seed || 5, 7 * s);
      ctx.fillStyle = '#ffffff'; K.poly(ctx, poly, true); ctx.fill();
      ctx.save(); K.poly(ctx, poly, true); ctx.clip();
      if (o.fill) { ctx.fillStyle = o.fill; ctx.fillRect(x - 10, y - 10, w + 20, h + 20); }
      // halftone gradient: dense dots fading across the scrap
      const g = ctx.createLinearGradient(x, y, x + w, y + h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,0.9)');
      ctx.fillStyle = ctx.createPattern(dotTile(7 * s), 'repeat'); ctx.globalAlpha = o.dots ?? 0.85; ctx.fillRect(x - 10, y - 10, w + 20, h + 20); ctx.globalAlpha = 1;
      ctx.fillStyle = g; ctx.fillRect(x - 10, y - 10, w + 20, h + 20);
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.7)'; ctx.lineWidth = 1.4 * s; K.poly(ctx, poly, true); ctx.stroke();
      tape(ctx, x + 8 * s, y + 4 * s, 60 * s, 20 * s, -0.7, s); tape(ctx, x + w - 6 * s, y + h - 4 * s, 60 * s, 20 * s, -0.7, s);
      staple(ctx, x + w - 22 * s, y + 14 * s, 0.2, s);
      ctx.restore();
    },

    // the counter is re-cut from magazine letters every time it ticks
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 110) * s;
      return { w: ransom(ctx, K.fmt(value), x, y, size, 1, { align: o.align || 'center', seed: 7, recut: Math.floor(value / 50000) }), h: size };
    },
    // slashed with the pink spot ink: a fat scribbled loop and a double underline, off-register
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx), pts = K.wobble(K.circlePts(x, y, r * 1.15, r * (o.ry || 0.55), 90, -2.8, Math.PI * 2.3), 8 * s, 4, 0.03), q = K.trim(pts, K.clamp(p * 1.3));
      ctx.save(); ctx.globalCompositeOperation = 'multiply'; ctx.strokeStyle = C.pink; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (q.length > 1) { ctx.lineWidth = 13 * s; ctx.translate(5 * s, 3 * s); K.poly(ctx, q); ctx.stroke(); ctx.translate(-5 * s, -3 * s); }
      const u = K.clamp((p - 0.6) / 0.4);
      if (u > 0) for (const dy of [0, 14 * s]) { ctx.lineWidth = 9 * s; ctx.beginPath(); ctx.moveTo(x - r * 0.6, y + r * (o.ry || 0.55) * 0.55 + dy); ctx.lineTo(x - r * 0.6 + r * 1.2 * u, y + r * (o.ry || 0.55) * 0.5 + dy - 6 * s); ctx.stroke(); }
      ctx.restore();
    },

    // a fresh photocopy slapped down over the last (covered at 0.5), then yanked off; copier flash on impact
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), first = p < 0.5, k = first ? K.ease.out(p / 0.5) : K.ease.in((p - 0.5) / 0.5);
      const sc = first ? K.lerp(1.35, 1.04, k) : 1.04, rot = first ? K.lerp(0.25, -0.015, k) : -0.015 - 0.3 * k, dx = first ? 0 : -k * W * 1.3;
      ctx.save(); ctx.translate(W / 2 + dx, H / 2); ctx.rotate(rot); ctx.scale(sc, sc);
      ctx.shadowColor = 'rgba(0,0,0,0.4)'; ctx.shadowBlur = 30 * s; ctx.fillStyle = C.paper; ctx.fillRect(-W / 2, -H / 2, W, H); ctx.shadowColor = 'transparent';
      ctx.fillStyle = ctx.createPattern(tonerTile(3), 'repeat'); ctx.fillRect(-W / 2, -H / 2, W, H);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-W / 2, -H / 2, 16 * s, H); ctx.fillRect(W / 2 - 22 * s, -H / 2, 22 * s, H);
      ctx.restore();
      // copier flash: a hot white bar sweeping as the sheet lands
      const fl = K.clamp(1 - Math.abs(p - 0.5) / 0.12);
      if (fl > 0) { const bx = K.lerp(-0.2, 1.2, K.clamp((p - 0.38) / 0.24)) * W, g = ctx.createLinearGradient(bx - 160 * s, 0, bx + 160 * s, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, `rgba(255,255,255,${0.9 * fl})`); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); }
    },
  };

  // ---------- the shared demo: two photocopied spreads ----------
  const PL = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 120 * s], video: [90 * s, 250 * s, 260 * s, 165 * s], node: [450 * s, 270 * s, 320 * s, 140 * s],
      chips: PL.map((_, i) => [915 * s, (215 + i * 66) * s]), top: [W / 2, 115 * s], counter: [W / 2, 400 * s], take: [W / 2, 610 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.25, H * 0.2, W * 0.5, H * 0.11], node: [W * 0.15, H * 0.385, W * 0.7, H * 0.075],
      chips: PL.map((_, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.55 + Math.floor(i / 2) * 0.07)]), top: [W / 2, H * 0.14], counter: [W / 2, H * 0.43], take: [W / 2, H * 0.66] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      NOW = t;
      const Lo = lay(W, H), s = Lo.s, P = Lo.P, scene2 = t >= 8.3;
      // the whole spread jitters on the 8 fps clock, like a stop-motion paste-up
      const jr = K.rng(step() + 3), jx = (jr() - 0.5) * 2 * s, jy = (jr() - 0.5) * 2 * s;
      ctx.save(); ctx.translate(jx, jy);
      style.background(ctx, W, H, t, { band: scene2 ? 1 : 0 });
      if (!scene2) {
        if (P) { style.title(ctx, 'One video.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 0.8, 'lin'), { size: 70, align: 'center', seed: 2 }); style.title(ctx, 'Every platform.', Lo.title[0], Lo.title[1] + 110 * s, K.beat(t, 0.8, 1.0, 'lin'), { size: 62, align: 'center', seed: 5 }); }
        else style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.5, 'lin'), { size: 60, align: 'center', seed: 2 });
        const [vx, vy, vw, vh] = Lo.video, vp = K.beat(t, 2.0, 0.4, 'lin');
        style.box(ctx, vx, vy, vw, vh, vp, { seed: 21 });
        if (vp > 0.6) { ctx.save(); const r = Math.min(vw, vh) * 0.27, cx = vx + vw / 2, cy = vy + vh / 2; ctx.fillStyle = C.toner; ctx.beginPath(); ctx.arc(cx, cy, r * 1.25, 0, 7); ctx.fill(); ctx.fillStyle = C.paper; ctx.beginPath(); ctx.moveTo(cx - r * 0.45, cy - r * 0.65); ctx.lineTo(cx + r * 0.7, cy); ctx.lineTo(cx - r * 0.45, cy + r * 0.65); ctx.fill(); ctx.restore(); }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 54 * s, K.beat(t, 2.6, 0.5, 'lin'), { align: 'center', seed: 3, size: 32 });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = P ? [[vx + vw / 2, vy + vh + 80 * s], [nx + nw / 2, ny - 20 * s]] : [[vx + vw + 20 * s, vy + vh / 2], [nx - 22 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.6, 'lin'), { bend: P ? 0.1 : -0.25 });
        const np = K.beat(t, 4.0, 0.5, 'lin');
        style.box(ctx, nx, ny, nw, nh, np, { seed: 41, fill: C.pink, dots: 0.35 });
        if (np > 0.5) style.title(ctx, 'Creator OS', nx + nw / 2, ny + nh / 2 + 18 * s, K.clamp((np - 0.5) * 2.5), { size: P ? 52 : 50, align: 'center', seed: 9 });
        if (P) style.arrow(ctx, [W / 2, ny + nh + 18 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.5, 'lin'), { bend: 0.02 });
        PL.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 12 * s] : [nx + nw + 18 * s, ny + nh * (0.15 + i * 0.117)];
          const to = P ? [left ? W * 0.43 : W * 0.57, cy - 12 * s] : [cx - 22 * s, cy - 12 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.3, 'lin'), { bend: P ? 0 : (i - 3) * 0.04, width: 4, seed: 10 + i });
          const lx = P ? (left ? W * 0.41 : W * 0.59) : cx;
          style.label(ctx, name, lx, cy, K.beat(t, t0 + 0.2, 0.35, 'lin'), { size: P ? 32 : 32, align: P ? (left ? 'right' : 'left') : 'left', seed: 20 + i, fill: i % 3 === 1 ? '#ffd1e6' : undefined, tape: i % 2 === 0 });
        });
      } else {
        const [, , nw, nh] = Lo.node, w2 = nw * 0.85, h2 = nh * 0.85;
        style.box(ctx, Lo.top[0] - w2 / 2, Lo.top[1] - h2 / 2, w2, h2, 1, { seed: 41, fill: C.pink, dots: 0.35 });
        style.title(ctx, 'Creator OS', Lo.top[0], Lo.top[1] + 16 * s, 1, { size: 46, align: 'center', seed: 9 });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0], Lo.counter[1], 1, { size: P ? 92 : 104 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + (P ? 105 : 92) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 36, seed: 4 });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 30 * s, (P ? 300 : 330) * s, K.beat(t, 10.0, 0.6, 'lin'), { ry: P ? 0.6 : 0.5 });
        if (P) { style.title(ctx, 'Post once.', Lo.take[0], Lo.take[1] + 20 * s, K.beat(t, 10.5, 0.6, 'lin'), { size: 64, align: 'center', seed: 11 }); style.title(ctx, 'Reach everywhere.', Lo.take[0], Lo.take[1] + 130 * s, K.beat(t, 10.7, 0.65, 'lin'), { size: 58, align: 'center', seed: 13 }); }
        else style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 1.0, 'lin'), { size: 52, align: 'center', seed: 11 });
      }
      ctx.restore();
      if (t > 7.6 && t < 9.0) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.4), {});
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('tape', 0, 12, 1.5); k.bed('room', 0, 12, 0.8);
      for (let i = 0; i < 9; i++) k.play('paper', 0.2 + i * 0.17, { dur: 0.08, gain: 0.8 });
      k.play('stamp', 2.0, { gain: 0.6 }); k.play('paper', 2.0, { dur: 0.2 }); k.play('click', 2.3, { pitch: 0.5 });
      k.play('type', 2.6, { dur: 0.45 }); k.play('scribble', 3.3, { medium: 'marker', dur: 0.6 });
      k.play('stamp', 4.0, { gain: 0.6 }); k.play('click', 4.2, { pitch: 0.5 }); for (let i = 0; i < 5; i++) k.play('paper', 4.2 + i * 0.1, { dur: 0.06 });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'marker', dur: 0.3, gain: 0.8 }); k.play('type', 5.2 + i * 0.4, { dur: 0.25, gain: 0.8 }); }
      k.play('whoosh', 7.6, { dur: 0.6 }); k.play('stamp', 8.3); k.play('riser', 8.15, { dur: 0.3, gain: 0.5 }); k.play('whoosh', 8.5, { dur: 0.5, up: false });
      k.play('count', 8.6, { dur: 1.4 }); for (let i = 0; i < 6; i++) k.play('paper', 8.6 + i * 0.23, { dur: 0.05, gain: 0.5 });
      k.play('glitch', 10.0); k.play('scribble', 10.0, { medium: 'marker', dur: 0.6, gain: 1.2 }); k.play('stamp', 10.05, { gain: 0.5 });
      for (let i = 0; i < 9; i++) k.play('paper', 10.5 + i * 0.11, { dur: 0.06, gain: 0.8 });
      k.play('chime', 11.4, { note: 'A5' });
    },
  };
  MS.register(style);
})();
