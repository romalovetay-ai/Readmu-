// Papercraft Models (Popular Explainer Looks). Printed cardstock kit pieces on a green self-healing cutting mat:
// boxy oblique prisms with Lambert-shaded faces, dotted fold lines, glue tabs and hairline seam gaps, tent-card
// labels, creased paper-strip arrows, all animated on twos with a stop-motion jitter under a warm key light.
(function () {
  const C = { mat: '#2e6a4b', matD: '#24563c', line: '#9fd0b0', card: '#f4efe4', blue: '#2f6fb7', orange: '#e8742f', red: '#d63a32', yellow: '#efc23a', ink: '#23262b', grey: '#7c8590', green: '#3a9a5a' };
  const HEAD = 'Archivo Black', BODY = 'Rubik';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  const shade = (col, k) => { const [r, g, b] = K.hex(col); return `rgb(${Math.min(255, r * k) | 0},${Math.min(255, g * k) | 0},${Math.min(255, b * k) | 0})`; };
  // stop motion: quantize progress to 12 fps steps and jitter a piece while it is animating
  const twos = (p, dur = 0.6) => { const steps = Math.max(2, Math.round(dur * 12)); return Math.round(K.clamp(p) * steps) / steps; };
  function jit(seed, p, s) { if (p <= 0 || p >= 1) return [0, 0, 0]; const r = K.rng(seed * 997 + Math.round(p * 12)); return [(r() - 0.5) * 3 * s, (r() - 0.5) * 3 * s, (r() - 0.5) * 0.012]; }

  function quad(ctx, pts, fill, stroke, lw) { K.poly(ctx, pts, true); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke(); } }
  function dotted(ctx, a, b, s, col = 'rgba(40,40,50,0.45)') { ctx.save(); ctx.setLineDash([3 * s, 4 * s]); ctx.strokeStyle = col; ctx.lineWidth = 1.3 * s; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); ctx.restore(); }

  // Oblique cardstock prism. Front face (x,y,w,h); depth d grows with fold progress. Lambert-ish face shading:
  // key light from upper left: top 1.06, front 0.97, right side 0.72. Returns the front-face rect.
  function prism(ctx, x, y, w, h, d, col, fold, s, o = {}) {
    const dx = d * 0.62 * fold, dy = -d * 0.5 * fold;
    // contact shadow on the mat
    ctx.save(); ctx.fillStyle = 'rgba(8,30,18,0.38)'; ctx.filter = `blur(${6 * s}px)`;
    ctx.beginPath(); ctx.moveTo(x + 6 * s, y + h + 2 * s); ctx.lineTo(x + w + dx + 16 * s, y + h + dy + 8 * s); ctx.lineTo(x + w + dx + 22 * s, y + h + 14 * s); ctx.lineTo(x + 10 * s, y + h + 12 * s); ctx.closePath(); ctx.fill(); ctx.restore();
    if (fold > 0.02) {
      const top = [[x, y], [x + w, y], [x + w + dx, y + dy], [x + dx, y + dy]], side = [[x + w, y], [x + w + dx, y + dy], [x + w + dx, y + h + dy], [x + w, y + h]];
      quad(ctx, side, shade(o.side || col, 0.72), 'rgba(0,0,0,0.25)', 1 * s);
      quad(ctx, top, shade(o.top || col, 1.06), 'rgba(0,0,0,0.18)', 1 * s);
      // printed border band on the top face + seam gap highlight
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2 * s; ctx.beginPath(); ctx.moveTo(x + w + 1.5 * s, y + 1); ctx.lineTo(x + w + dx + 1.5 * s, y + dy + 1); ctx.stroke(); ctx.restore();
      dotted(ctx, [x + w * 0.04, y + dy * 0.5 + 1], [x + w * 0.96 + dx, y + dy * 0.5 + 1], s, 'rgba(0,0,0,0.18)');
    } else {
      // flat template: glue tabs still visible
      ctx.fillStyle = shade(col, 0.88); const tb = 14 * s;
      K.poly(ctx, [[x + w * 0.15, y], [x + w * 0.85, y], [x + w * 0.8, y - tb], [x + w * 0.2, y - tb]], true); ctx.fill();
      dotted(ctx, [x, y], [x + w, y], s);
    }
    quad(ctx, [[x, y], [x + w, y], [x + w, y + h], [x, y + h]], shade(col, 0.97), 'rgba(0,0,0,0.28)', 1 * s);
    // printed inner border + fold line at the base
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2 * s; ctx.strokeRect(x + 7 * s, y + 7 * s, w - 14 * s, h - 14 * s); ctx.restore();
    dotted(ctx, [x + 3 * s, y + h - 3 * s], [x + w - 3 * s, y + h - 3 * s], s, 'rgba(0,0,0,0.3)');
    return [x, y, w, h];
  }

  const style = {
    id: 'papercraft', name: 'Papercraft Models', family: 'Popular Explainer Looks',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Archivo+Black&family=Rubik:wght@600;800&display=block', specs: ['400 60px "Archivo Black"', '800 30px "Rubik"', '600 20px "Rubik"'] }],
    palette: C,
    sfx: { draw: null, land: 'paper', emphasis: 'pop', transition: 'whoosh', bed: 'room' },

    background(ctx, W, H, t) {
      const mat = K.cached(`pc-mat:${W}x${H}`, () => {
        const s = S(W, H), c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(42);
        x.drawImage(K.paperTex(W, H, C.mat, 8, 0.05, false), 0, 0);
        const step = 22 * s;
        x.lineWidth = Math.max(1, 0.9 * s);
        for (let i = 0, gx = 0; gx < W; i++, gx += step) { x.strokeStyle = i % 5 ? 'rgba(170,220,190,0.22)' : 'rgba(190,235,205,0.45)'; x.beginPath(); x.moveTo(gx, 0); x.lineTo(gx, H); x.stroke(); }
        for (let i = 0, gy = 0; gy < H; i++, gy += step) { x.strokeStyle = i % 5 ? 'rgba(170,220,190,0.22)' : 'rgba(190,235,205,0.45)'; x.beginPath(); x.moveTo(0, gy); x.lineTo(W, gy); x.stroke(); }
        // angle guides
        x.strokeStyle = 'rgba(190,235,205,0.18)'; x.setLineDash([8 * s, 6 * s]);
        for (const a of [Math.PI / 4, Math.PI / 6]) { x.beginPath(); x.moveTo(0, H); x.lineTo(Math.cos(a) * W * 2, H - Math.sin(a) * W * 2); x.stroke(); }
        x.setLineDash([]);
        // ruler numbers along the top and left edges
        x.fillStyle = 'rgba(200,240,215,0.6)'; x.font = K.font(10 * s, BODY, 600);
        for (let i = 1; i * step * 5 < W; i++) x.fillText(String(i * 5), i * step * 5 + 3 * s, 12 * s);
        for (let i = 1; i * step * 5 < H; i++) x.fillText(String(i * 5), 3 * s, i * step * 5 - 3 * s);
        // healed knife scuffs
        x.strokeStyle = 'rgba(20,50,35,0.35)'; x.lineWidth = 1 * s;
        for (let i = 0; i < 40; i++) { const a = r() * W, b = r() * H, l = r.range(20, 140) * s, an = r.range(-0.4, 0.4) + (r() < 0.5 ? 0 : Math.PI / 2); x.beginPath(); x.moveTo(a, b); x.lineTo(a + Math.cos(an) * l, b + Math.sin(an) * l); x.stroke(); }
        // craft tools at the edges: steel ruler bottom-right, pencil bottom-left, glue stick top-right
        x.save(); x.translate(W * 0.86, H * 0.97); x.rotate(-0.32);
        x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(-250 * s + 6 * s, -18 * s + 8 * s, 520 * s, 38 * s);
        const rg = x.createLinearGradient(0, -18 * s, 0, 20 * s); rg.addColorStop(0, '#e9edf0'); rg.addColorStop(0.5, '#b9c1c8'); rg.addColorStop(1, '#8e979f');
        x.fillStyle = rg; x.fillRect(-250 * s, -18 * s, 520 * s, 38 * s); x.strokeStyle = '#555c63'; x.lineWidth = 1 * s;
        for (let k = 0; k < 100; k++) { x.beginPath(); x.moveTo(-245 * s + k * 5.2 * s, -18 * s); x.lineTo(-245 * s + k * 5.2 * s, -18 * s + (k % 10 ? 6 : 12) * s); x.stroke(); }
        x.restore();
        x.save(); x.translate(W * 0.05, H * 0.93); x.rotate(-1.0);
        x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(4 * s, 6 * s, 180 * s, 14 * s);
        x.fillStyle = '#2f5fae'; x.fillRect(0, 0, 160 * s, 14 * s); x.fillStyle = '#d9b48a'; x.beginPath(); x.moveTo(160 * s, 0); x.lineTo(185 * s, 7 * s); x.lineTo(160 * s, 14 * s); x.fill();
        x.fillStyle = '#222'; x.beginPath(); x.moveTo(178 * s, 5 * s); x.lineTo(185 * s, 7 * s); x.lineTo(178 * s, 9 * s); x.fill(); x.fillStyle = 'rgba(255,255,255,0.3)'; x.fillRect(0, 2 * s, 160 * s, 3 * s);
        x.restore();
        x.save(); x.translate(W * 0.955, H * 0.1); x.rotate(0.15);
        x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(-18 * s, -50 * s, 44 * s, 110 * s);
        x.fillStyle = '#7a4fb3'; x.fillRect(-22 * s, -55 * s, 40 * s, 100 * s); x.fillStyle = '#efe6d2'; x.fillRect(-22 * s, -10 * s, 40 * s, 18 * s); x.fillStyle = '#5a3590'; x.fillRect(-22 * s, -55 * s, 40 * s, 14 * s);
        x.fillStyle = 'rgba(255,255,255,0.25)'; x.fillRect(-18 * s, -55 * s, 6 * s, 100 * s);
        x.restore();
        return c;
      });
      ctx.drawImage(mat, 0, 0);
    },

    finish(ctx, W, H, t) {
      // warm key light from the upper left, falloff to the corners, cardstock grain
      const g = ctx.createRadialGradient(W * 0.3, H * 0.15, 0, W * 0.3, H * 0.15, Math.hypot(W, H) * 0.8);
      g.addColorStop(0, 'rgba(255,214,160,0.20)'); g.addColorStop(1, 'rgba(255,214,160,0)');
      ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.4, '#0c1f15');
      K.grain(ctx, W, H, t, 0.04, 12, 'overlay');
    },

    // printed tent card headline: blue kit header strip + heavy lettering on cream stock, hops in on twos
    title(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 56) * s, q = twos(p, 0.6);
      ctx.save(); ctx.font = K.font(size, HEAD, 400);
      const tw = ctx.measureText(text).width, w = tw + size * 1.1, h = size * 2.0;
      const [jx, jy, jr] = jit(o.seed || 3, p, s), hop = Math.sin(Math.PI * q) * 40 * s * (1 - q);
      const cx = o.align === 'left' ? x + w / 2 : o.align === 'right' ? x - w / 2 : x;
      ctx.translate(cx + jx, y - hop + jy); ctx.rotate(jr - 0.012);
      const fold = K.clamp(q * 1.4);
      // tent back slope (visible above the card as it stands up)
      ctx.fillStyle = shade(C.card, 0.7); ctx.fillRect(-w / 2 + 6 * s, -h * 0.62 - 10 * s * fold, w - 12 * s, 12 * s * fold);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.filter = `blur(${5 * s}px)`; ctx.fillRect(-w / 2 + 10 * s, h * 0.38, w, 16 * s); ctx.filter = 'none';
      ctx.fillStyle = C.card; ctx.fillRect(-w / 2, -h * 0.62, w, h);
      ctx.fillStyle = o.band || C.blue; ctx.fillRect(-w / 2, -h * 0.62, w, h * 0.22);
      ctx.fillStyle = '#fff'; ctx.font = K.font(13 * s, BODY, 800); ctx.textAlign = 'center';
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${3 * s}px`;
      ctx.fillText(o.kicker || 'KIT No.07  •  CUT  •  FOLD  •  GLUE', 0, -h * 0.62 + h * 0.15);
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = '0px';
      ctx.font = K.font(size, HEAD, 400); ctx.fillStyle = o.color || C.ink; ctx.fillText(text, 0, h * 0.13);
      ctx.fillStyle = C.orange; ctx.fillRect(-tw * 0.3, h * 0.22, tw * 0.6, 4 * s);
      dotted(ctx, [-w / 2, -h * 0.62 + 2 * s], [w / 2, -h * 0.62 + 2 * s], s, 'rgba(255,255,255,0.6)');
      ctx.restore(); return { w, h };
    },

    // small tent tag dropped onto what it names
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 28) * s, q = twos(p, 0.4);
      ctx.save(); ctx.font = K.font(size, BODY, 800);
      const tw = ctx.measureText(text).width, w = tw + size * 1.2, h = size * 1.6;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, drop = (1 - q) * 70 * s;
      const [jx, jy, jr] = jit((o.seed || 1) + 50, p, s);
      ctx.translate(x0 + jx, y - h / 2 - drop + jy); ctx.rotate(jr);
      ctx.globalAlpha = K.clamp(q * 3);
      ctx.fillStyle = 'rgba(0,0,0,0.32)'; ctx.fillRect(5 * s, h - 2 * s + drop * 0.4, w, 8 * s);
      ctx.fillStyle = shade(o.fill || C.card, 0.72); ctx.fillRect(3 * s, -8 * s, w - 6 * s, 9 * s);       // tent slope behind
      ctx.fillStyle = o.fill || C.card; ctx.fillRect(0, 0, w, h);
      ctx.fillStyle = o.color || C.blue; ctx.fillRect(0, 0, size * 0.28, h);
      dotted(ctx, [0, 1.5 * s], [w, 1.5 * s], s);
      ctx.fillStyle = C.ink; ctx.textBaseline = 'middle'; ctx.fillText(text, size * 0.62, h / 2 + 1 * s);
      ctx.restore(); return { w, h };
    },

    // a creased paper strip that unrolls along the mat with a folded arrowhead tab
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), q = twos(p, 0.5), pts = K.arcPts(from, to, o.bend ?? 0.1, 30), sub = K.trim(pts, K.clamp(q / 0.85));
      if (sub.length < 2) return null;
      const col = o.color || C.yellow, wdt = (o.width || 14) * s;
      ctx.save(); ctx.lineCap = 'butt'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = wdt; ctx.translate(3 * s, 5 * s); K.poly(ctx, sub); ctx.stroke(); ctx.translate(-3 * s, -5 * s);
      ctx.strokeStyle = col; K.poly(ctx, sub); ctx.stroke();
      // crease shading: alternating darker panels
      ctx.strokeStyle = 'rgba(0,0,0,0.13)'; ctx.setLineDash([16 * s, 16 * s]); K.poly(ctx, sub); ctx.stroke(); ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1.2 * s; ctx.translate(0, -wdt * 0.38); K.poly(ctx, sub); ctx.stroke(); ctx.translate(0, wdt * 0.38);
      const end = sub[sub.length - 1];
      if (q > 0.85) {
        const a = pts[pts.length - 4], b = pts[pts.length - 1], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), hs = 26 * s * K.clamp((q - 0.85) / 0.15);
        ctx.translate(b[0], b[1]); ctx.rotate(ang);
        ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.moveTo(4 * s, 5 * s); ctx.lineTo(-hs + 4 * s, -hs * 0.7 + 5 * s); ctx.lineTo(-hs + 4 * s, hs * 0.7 + 5 * s); ctx.fill();
        ctx.fillStyle = shade(col, 1.04); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-hs, -hs * 0.7); ctx.lineTo(-hs, 0); ctx.fill();
        ctx.fillStyle = shade(col, 0.8); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-hs, 0); ctx.lineTo(-hs, hs * 0.7); ctx.fill();
      }
      ctx.restore(); return end;
    },

    // a printed card face that folds itself up into a prism
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), q = twos(p, 0.8), [jx, jy] = jit(o.seed || 7, p, s);
      const hop = q < 0.4 ? (1 - q / 0.4) * 60 * s : 0;
      prism(ctx, x + jx, y + jy - hop, w, h, o.depth ?? Math.min(w, h) * 0.45, o.color || C.card, K.clamp((q - 0.4) / 0.6), s, o);
    },

    // printed tent card with big heavy numerals
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 110) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, HEAD, 400);
      const tw = ctx.measureText(txt).width, w = tw + size * 0.7, h = size * 1.35;
      prism(ctx, x - w / 2, y - h * 0.8, w, h, 40 * s, C.card, 1, s);
      ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText(txt, x, y + size * 0.05 - h * 0.08);
      ctx.restore();
    },

    // red paper flag pops up on a toothpick + paper confetti
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), q = twos(p, 0.6), k = K.ease.back(K.clamp(q * 1.3));
      const rnd = K.rng(o.seed || 21);
      for (let i = 0; i < 22; i++) {
        const a = rnd() * TAU, d = r * (0.5 + rnd() * 0.9) * K.ease.out(q), cx = x + Math.cos(a) * d, cy = y + Math.sin(a) * d * 0.6 + q * q * 30 * s;
        ctx.save(); ctx.translate(cx, cy); ctx.rotate(rnd() * TAU + q * 6); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(-5 * s + 3 * s, -3 * s + 4 * s, 12 * s, 7 * s);
        ctx.fillStyle = [C.red, C.yellow, C.blue, C.orange][i % 4]; ctx.fillRect(-6 * s, -3.5 * s, 12 * s, 7 * s); ctx.restore();
      }
      const fx = x + (o.dx ?? r * 0.85), fy = y + (o.dy ?? -r * 0.15);
      ctx.save(); ctx.translate(fx, fy); ctx.scale(1, k);
      ctx.strokeStyle = '#c8a77a'; ctx.lineWidth = 4 * s; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -110 * s); ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.moveTo(4 * s, -104 * s); ctx.lineTo(70 * s, -84 * s); ctx.lineTo(4 * s, -60 * s); ctx.fill();
      ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(0, -110 * s); ctx.lineTo(66 * s, -90 * s); ctx.lineTo(0, -66 * s); ctx.fill();
      ctx.fillStyle = shade(C.red, 0.75); ctx.beginPath(); ctx.moveTo(0, -88 * s); ctx.lineTo(66 * s, -90 * s); ctx.lineTo(0, -66 * s); ctx.fill();
      ctx.restore();
    },

    // a fresh printed kit sheet slides across the mat on twos (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), q = Math.round(p * 16) / 16, x = K.lerp(W * 1.05, -W * 1.15, q), sw = W * 1.1;
      ctx.save(); ctx.translate(x, 0); ctx.rotate(-0.02);
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(14 * s, -20 * s, sw, H * 1.1);
      ctx.fillStyle = C.card; ctx.fillRect(0, -30 * s, sw, H * 1.1);
      ctx.fillStyle = C.blue; ctx.fillRect(0, -30 * s, sw, 70 * s);
      // printed cut lines / templates on the sheet
      ctx.setLineDash([6 * s, 6 * s]); ctx.strokeStyle = 'rgba(40,40,50,0.35)'; ctx.lineWidth = 1.5 * s;
      for (let i = 0; i < 4; i++) ctx.strokeRect(60 * s + i * sw * 0.24, H * 0.3, sw * 0.18, H * 0.4);
      ctx.setLineDash([]); ctx.fillStyle = '#fff'; ctx.font = K.font(22 * s, BODY, 800); ctx.fillText('SHEET B   •   CUT ALONG SOLID LINES', 40 * s, 15 * s);
      ctx.restore();
    },
  };

  // ---------- kit models for the demo ----------
  function robotModel(ctx, cx, by, sc, p, t, s) {
    // body prism + head prism + antenna, folding up one after the other
    const bw = 210 * sc, bh = 120 * sc, hw = 160 * sc, hh = 110 * sc, dep = 70 * sc;
    const bp = twos(K.clamp(p / 0.55), 0.6), hp = twos(K.clamp((p - 0.4) / 0.6), 0.6);
    if (bp > 0) {
      const [jx, jy] = jit(81, bp, s), hop = bp < 0.3 ? (1 - bp / 0.3) * 50 * s : 0;
      const [x, y] = prism(ctx, cx - bw / 2 + jx, by - bh + jy - hop, bw, bh, dep, C.card, K.clamp((bp - 0.3) / 0.7), s);
      ctx.fillStyle = C.blue; ctx.fillRect(x + 14 * sc, y + 14 * sc, bw - 28 * sc, bh * 0.42);
      ctx.fillStyle = '#fff'; ctx.font = K.font(24 * sc, HEAD, 400); ctx.textAlign = 'center'; ctx.fillText('CREATOR OS', x + bw / 2, y + 14 * sc + bh * 0.3);
      for (let i = 0; i < 3; i++) { const dx = x + bw * (0.3 + i * 0.2), dy = y + bh * 0.76; ctx.fillStyle = '#efe6d0'; ctx.beginPath(); ctx.arc(dx, dy, 13 * sc, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2 * sc; ctx.stroke(); ctx.beginPath(); ctx.moveTo(dx, dy); ctx.lineTo(dx + Math.cos(t * 2 + i) * 9 * sc, dy + Math.sin(t * 2 + i) * 9 * sc); ctx.stroke(); }
      ctx.textAlign = 'left';
    }
    if (hp > 0) {
      const [jx, jy] = jit(82, hp, s), hop = hp < 0.3 ? (1 - hp / 0.3) * 70 * s : 0;
      const hx = cx - hw / 2 + jx + 4 * sc, hy = by - bh - hh - 2 * sc + jy - hop;
      ctx.strokeStyle = '#8c8f94'; ctx.lineWidth = 4 * sc; ctx.beginPath(); ctx.moveTo(hx + hw / 2 + 18 * sc, hy - 18 * sc); ctx.lineTo(hx + hw / 2 + 18 * sc, hy - 50 * sc); ctx.stroke();
      prism(ctx, hx + hw / 2 + 6 * sc, hy - 74 * sc, 24 * sc, 24 * sc, 16 * sc, C.red, K.clamp((hp - 0.3) / 0.7), s);
      const [x, y] = prism(ctx, hx, hy, hw, hh, dep * 0.8, C.card, K.clamp((hp - 0.3) / 0.7), s);
      ctx.fillStyle = '#c9d6e6'; ctx.fillRect(x + 14 * sc, y + 14 * sc, hw - 28 * sc, hh - 28 * sc);
      for (const ex of [0.33, 0.67]) { const ox = x + hw * ex, oy = y + hh * 0.45; ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(ox, oy, 15 * sc, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 2.5 * sc; ctx.stroke(); ctx.fillStyle = C.ink; ctx.beginPath(); ctx.arc(ox + 2 * sc, oy + 2 * sc, 7 * sc, 0, TAU); ctx.fill(); }
      ctx.fillStyle = C.orange; ctx.fillRect(x + hw * 0.38, y + hh * 0.7, hw * 0.24, 9 * sc);
      ctx.fillStyle = 'rgba(230,110,120,0.5)'; ctx.beginPath(); ctx.arc(x + hw * 0.2, y + hh * 0.66, 7 * sc, 0, TAU); ctx.arc(x + hw * 0.8, y + hh * 0.66, 7 * sc, 0, TAU); ctx.fill();
    }
  }
  function videoModel(ctx, x, y, w, h, p, s) {
    const q = twos(p, 0.7); if (q <= 0) return;
    const [jx, jy] = jit(61, p, s), hop = q < 0.35 ? (1 - q / 0.35) * 50 * s : 0;
    const [fx, fy] = prism(ctx, x + jx, y + jy - hop, w, h, 40 * s, C.card, K.clamp((q - 0.35) / 0.65), s);
    ctx.fillStyle = '#2b3140'; ctx.fillRect(fx + 14 * s, fy + 14 * s, w - 28 * s, h - 28 * s);
    ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(fx + w * 0.42, fy + h * 0.32); ctx.lineTo(fx + w * 0.62, fy + h * 0.5); ctx.lineTo(fx + w * 0.42, fy + h * 0.68); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.12)'; ctx.beginPath(); ctx.moveTo(fx + 14 * s, fy + 14 * s); ctx.lineTo(fx + w * 0.5, fy + 14 * s); ctx.lineTo(fx + 14 * s, fy + h * 0.6); ctx.fill();
  }

  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = ['#d6457e', '#23262b', C.red, '#555b66', C.blue, '#7a4fb3', '#3b5fbf'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 108 * s], video: [100 * s, 330 * s, 210 * s, 130 * s], robot: [600 * s, 520 * s, 1 * s],
      chips: PLATFORMS.map((n, i) => [930 * s, (196 + i * 66) * s]), counter: [W / 2 - 20 * s, 440 * s], take: [W / 2, 640 * s], robot2: [W * 0.15, 470 * s, 0.8 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.34, H * 0.14, W * 0.3, H * 0.08], robot: [W / 2, H * 0.535, 0.95 * s],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.615 + Math.floor(i / 2) * 0.07)]), counter: [W / 2 - 20 * s, H * 0.53], take: [W / 2, H * 0.76], robot2: [W / 2, H * 0.36, 1.1 * s] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      // camera slides across the mat between the two halves
      const slide = K.ease.inOut(K.clamp((t - 7.7) / 1.0));
      style.background(ctx, W, H, t);
      if (t < 8.2) {
        ctx.save(); ctx.translate(-slide * W * 0.15, 0);
        const [vx, vy, vw, vh] = Lo.video, [rx, ry, rs] = Lo.robot;
        videoModel(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.8, 'lin'), s);
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 46 * s, K.beat(t, 2.7, 0.4, 'lin'), { align: 'center', color: C.red, seed: 2 });
        const a1 = P ? [[W / 2, vy + vh + 84 * s], [W / 2, ry - 290 * rs]] : [[vx + vw + 46 * s, vy + vh / 2], [rx - 140 * rs, ry - 150 * rs]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.7, 'lin'), { bend: P ? 0 : -0.1, color: C.yellow });
        robotModel(ctx, rx, ry, rs, K.beat(t, 3.9, 1.1, 'lin'), t, s);
        if (P) style.arrow(ctx, [W / 2, ry + 30 * s], [W / 2, Lo.chips[6][1] + 4 * s], K.beat(t, 4.9, 0.5, 'lin'), { width: 12, color: C.yellow });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy] : [rx + 160 * rs, ry - 120 * rs], to = P ? [left ? W * 0.47 : W * 0.53, cy] : [cx - 12 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'lin'), { bend: P ? 0 : (i - 3) * 0.04, width: P ? 9 : 10, color: i % 2 ? C.orange : C.yellow });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.28, 0.3, 'lin'), { color: COLS[i], align: P ? (left ? 'right' : 'left') : 'left', seed: 10 + i, size: P ? 26 : 28 });
        });
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.2, 0.9, 'lin'), { size: P ? 44 : 54 });
        ctx.restore();
      } else {
        ctx.save(); ctx.translate((1 - slide) * W * 0.15, 0);
        const [rx, ry, rs] = Lo.robot2;
        robotModel(ctx, rx, ry, rs, 1, t, s);
        const v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, Lo.counter[0] + (P ? 0 : 90 * s), Lo.counter[1], 1, { size: P ? 80 : 104 });
        style.label(ctx, 'views', Lo.counter[0] + (P ? 0 : 90 * s), Lo.counter[1] + (P ? 80 : 70) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', color: C.green, seed: 30 });
        style.emphasis(ctx, Lo.counter[0] + (P ? 0 : 90 * s), Lo.counter[1] - 60 * s, (P ? 260 : 300) * s, K.beat(t, 10.0, 0.7, 'lin'), { dx: (P ? 300 : 330) * s, dy: -40 * s });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.8, 'lin'), { size: P ? 40 : 50, band: C.green, kicker: 'STEP 3  •  DONE' });
        ctx.restore();
      }
      if (t > 7.5 && t < 9.0) style.transition(ctx, W, H, K.clamp((t - 7.5) / 1.5));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2);
      k.play('paper', 0.2, { dur: 0.4 }); k.play('thud', 0.9, { gain: 0.5 });
      k.play('paper', 2.0, { dur: 0.3 }); k.play('paper', 2.35, { dur: 0.35 }); k.play('click', 2.8); k.play('paper', 2.75, { dur: 0.15 });
      k.play('paper', 3.3, { dur: 0.7 });
      k.play('paper', 3.9, { dur: 0.3 }); k.play('click', 4.3); k.play('paper', 4.4, { dur: 0.3 }); k.play('click', 4.9, { pitch: 1.2 });
      for (let i = 0; i < 7; i++) { k.play('paper', 5.0 + i * 0.4, { dur: 0.25, gain: 0.8 }); k.play('click', 5.48 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('whoosh', 7.6, { dur: 1.0 }); k.play('paper', 7.9, { dur: 0.6 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('pop', 10.0); k.play('paper', 10.05, { dur: 0.3 });
      k.play('paper', 10.5, { dur: 0.35 }); k.play('thud', 11.0, { gain: 0.5 }); k.play('chime', 11.3, { note: 'G5' });
    },
  };
  MS.register(style);
})();
