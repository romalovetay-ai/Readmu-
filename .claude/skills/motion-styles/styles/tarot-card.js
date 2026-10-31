// Tarot Card (Illustration). An aged art-nouveau tarot reading on crushed velvet: foxed cardstock with worn edges,
// stamped gold-foil borders whose sheen slides with t, flat muted lithograph colours inside bold even outlines,
// celestial symbols, Roman-numeral cartouches and name plaques. Cards are dealt, flipped and gathered.
(function () {
  const C = { velvet: '#3b0f22', velvetHi: '#7a2444', stock: '#eadcb6', line: '#2b2224', gold: '#c9a24a', goldHi: '#fff0b8', goldLo: '#7a5a1c',
    navy: '#1f2a4f', teal: '#2f6b62', rust: '#b0563c', mustard: '#c99a3a', lav: '#9a8fb3', cream: '#f3e6c4' };
  const CAPS = 'Cinzel', SERIF = 'Cormorant Garamond';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // gold foil gradient with a bright band whose position is a function of t (the sheen sliding across the stamp)
  function foil(ctx, x0, y0, x1, y1, t, off = 0) {
    const g = ctx.createLinearGradient(x0, y0, x1, y1), k = ((t * 0.18 + off) % 1.4) - 0.2;
    const st = [[0, '#8a6424'], [0.3, C.gold], [0.55, '#e3c477'], [0.8, C.gold], [1, '#7d5b20']];
    st.forEach(([o, c]) => g.addColorStop(o, c));
    if (k > 0.02 && k < 0.98) { g.addColorStop(Math.max(0, k - 0.06), '#d8b866'); g.addColorStop(k, C.goldHi); g.addColorStop(Math.min(1, k + 0.06), '#d8b866'); }
    return g;
  }
  function velvet(W, H) {
    return K.cached(`tarot-velvet:${W}x${H}`, () => {
      const w = Math.ceil(W / 4), h = Math.ceil(H / 4), c = K.layer(w, h), x = c.getContext('2d'), img = x.createImageData(w, h), d = img.data, nz = K.noise(81);
      const lo = K.hex('#22060f'), mid = K.hex(C.velvet), hi = K.hex(C.velvetHi);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
        // crushed pile: folded ridges from warped noise, plus fine sparkle
        const u = i / w, v = j / h, warp = nz.fbm2(u * 3, v * 3, 3);
        const ridge = Math.abs(Math.sin((u * 2.2 + v * 1.4 + warp * 2.4) * Math.PI)), f = Math.pow(ridge, 3) * 0.75 + nz.fbm2(u * 9, v * 9, 2) * 0.35;
        const c3 = f < 0.5 ? K.mix(lo, mid, f * 2) : K.mix(mid, hi, (f - 0.5) * 2), o = (j * w + i) * 4;
        d[o] = c3[0]; d[o + 1] = c3[1]; d[o + 2] = c3[2]; d[o + 3] = 255;
      }
      x.putImageData(img, 0, 0);
      const big = K.layer(W, H), bx = big.getContext('2d'); bx.imageSmoothingQuality = 'high'; bx.drawImage(c, 0, 0, W, H);
      return big;
    });
  }
  // full-frame cardstock: cream, fibres, foxing spots and edge browning; cards clip it to their shape
  function stock(W, H) {
    return K.cached(`tarot-stock:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(12), s = S(W, H);
      x.drawImage(K.paperTex(W, H, C.stock, 41, 0.06, true), 0, 0);
      for (let i = 0; i < 260; i++) { const rr = r.range(1, 7) * s, cx = r.range(0, W), cy = r.range(0, H);
        const g = x.createRadialGradient(cx, cy, 0, cx, cy, rr); g.addColorStop(0, 'rgba(140,90,40,0.35)'); g.addColorStop(1, 'rgba(140,90,40,0)'); x.fillStyle = g; x.fillRect(cx - rr, cy - rr, rr * 2, rr * 2); }
      return c;
    });
  }
  function starTile(s) {
    return K.cached(`tarot-stars:${s.toFixed(3)}`, () => {
      const p = Math.round(34 * s), c = K.layer(p, p), x = c.getContext('2d'); x.fillStyle = C.navy; x.fillRect(0, 0, p, p);
      x.fillStyle = 'rgba(214,180,100,0.85)'; const st = (a, b, r) => { x.beginPath(); for (let i = 0; i < 8; i++) { const ang = (i / 8) * Math.PI * 2, R = i % 2 ? r * 0.35 : r; x.lineTo(a + Math.cos(ang) * R, b + Math.sin(ang) * R); } x.fill(); };
      st(p * 0.25, p * 0.25, 3.2 * s); st(p * 0.75, p * 0.75, 2.4 * s); return c;
    });
  }
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
  function star(ctx, x, y, r, n = 8, inner = 0.4) { ctx.beginPath(); for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * Math.PI * 2 - Math.PI / 2, R = i % 2 ? r * inner : r; ctx.lineTo(x + Math.cos(a) * R, y + Math.sin(a) * R); } ctx.closePath(); }

  // the card face: stock, gold frame, arched window with flat litho colours, numeral and plaque
  function face(ctx, x, y, w, h, o, t) {
    const s = sOf(ctx), W = ctx.canvas.width, H = ctx.canvas.height, R = Math.min(w, h) * 0.05;
    ctx.save(); rr(ctx, x, y, w, h, R); ctx.clip(); ctx.fillStyle = C.stock; ctx.fillRect(x, y, w, h); { const st = stock(W, H), sw = Math.min(st.width, Math.ceil(w)), sh = Math.min(st.height, Math.ceil(h)); ctx.drawImage(st, 0, 0, sw, sh, x, y, w, h); }
    // worn, browned edges
    rr(ctx, x, y, w, h, R); ctx.strokeStyle = 'rgba(120,80,40,0.35)'; ctx.lineWidth = Math.max(4, w * 0.05); ctx.stroke();
    const m = w * 0.06, fx = x + m, fy = y + m, fw = w - 2 * m, fh = h - 2 * m;
    ctx.strokeStyle = foil(ctx, x, y, x + w, y + h, t, o.seed * 0.1 || 0); ctx.lineWidth = Math.max(2, w * 0.022); ctx.strokeRect(fx, fy, fw, fh);
    ctx.lineWidth = Math.max(1, w * 0.007); ctx.strokeRect(fx + w * 0.025, fy + w * 0.025, fw - w * 0.05, fh - w * 0.05);
    for (const [cx, cy] of [[fx, fy], [fx + fw, fy], [fx, fy + fh], [fx + fw, fy + fh]]) { ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(cx, cy, w * 0.045, 0, 7); ctx.fill(); ctx.strokeStyle = foil(ctx, x, y, x + w, y + h, t); ctx.lineWidth = Math.max(1.5, w * 0.012); ctx.stroke(); ctx.fillStyle = C.gold; star(ctx, cx, cy, w * 0.03, 4, 0.35); ctx.fill(); }
    // numeral cartouche
    const top = fy + fh * 0.03, nh = fh * 0.1;
    ctx.fillStyle = C.line; ctx.font = K.font(nh * 0.8, CAPS, 700); ctx.textAlign = 'center'; ctx.fillText(o.numeral || 'I', x + w / 2, top + nh * 0.82);
    ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(1, w * 0.008); ctx.beginPath(); ctx.moveTo(x + w * 0.22, top + nh); ctx.lineTo(x + w * 0.78, top + nh); ctx.stroke();
    // arched window
    const ax = fx + fw * 0.08, aw = fw * 0.84, ay = top + nh * 1.25, ah = fh * 0.66;
    const arch = () => { ctx.beginPath(); ctx.moveTo(ax, ay + ah); ctx.lineTo(ax, ay + aw / 2); ctx.arc(ax + aw / 2, ay + aw / 2, aw / 2, Math.PI, 0); ctx.lineTo(ax + aw, ay + ah); ctx.closePath(); };
    ctx.save(); arch(); ctx.clip();
    ctx.fillStyle = o.sky || C.navy; ctx.fillRect(ax, ay, aw, ah);
    // sunburst rays in two muted tones
    const cx = ax + aw / 2, cy = ay + ah * 0.45; ctx.fillStyle = 'rgba(201,154,58,0.28)';
    for (let i = 0; i < 24; i += 2) { const a0 = (i / 24) * Math.PI * 2 + t * 0.05, a1 = ((i + 1) / 24) * Math.PI * 2 + t * 0.05; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, ah, a0, a1); ctx.fill(); }
    // lavender cloud bank
    ctx.fillStyle = C.lav; ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(1.5, w * 0.012);
    ctx.beginPath(); for (let i = 0; i <= 5; i++) ctx.arc(ax + (i / 5) * aw, ay + ah * 0.95, aw * 0.14, Math.PI, 0); ctx.lineTo(ax + aw, ay + ah); ctx.lineTo(ax, ay + ah); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (o.art) o.art(ctx, cx, cy, aw * 0.36, t);
    ctx.restore();
    arch(); ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(2, w * 0.016); ctx.stroke();
    // name plaque
    const py = ay + ah + fh * 0.04, ph = fh - (py - fy) - fh * 0.03;
    ctx.fillStyle = C.cream; ctx.fillRect(fx + fw * 0.06, py, fw * 0.88, ph); ctx.strokeStyle = foil(ctx, x, y, x + w, y + h, t); ctx.lineWidth = Math.max(1.5, w * 0.012); ctx.strokeRect(fx + fw * 0.06, py, fw * 0.88, ph);
    const name = (o.name || '').toUpperCase(), fsz = K.fitSize(ctx, name, CAPS, 700, ph * 0.62, fw * 0.8, 8);
    ctx.font = K.font(fsz, CAPS, 700); ctx.fillStyle = C.line; ctx.textBaseline = 'middle'; ctx.fillText(name, x + w / 2, py + ph * 0.55);
    ctx.restore();
    rr(ctx, x, y, w, h, R); ctx.strokeStyle = 'rgba(60,35,20,0.6)'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  }
  function back(ctx, x, y, w, h, t) {
    const s = sOf(ctx), R = Math.min(w, h) * 0.05;
    ctx.save(); rr(ctx, x, y, w, h, R); ctx.clip(); ctx.fillStyle = ctx.createPattern(starTile(s), 'repeat'); ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = foil(ctx, x, y, x + w, y + h, t); ctx.lineWidth = Math.max(2, w * 0.02); ctx.strokeRect(x + w * 0.06, y + w * 0.06, w * 0.88, h - w * 0.12);
    const cx = x + w / 2, cy = y + h / 2; ctx.fillStyle = foil(ctx, cx - w * 0.2, cy - w * 0.2, cx + w * 0.2, cy + w * 0.2, t); star(ctx, cx, cy, w * 0.22, 12, 0.55); ctx.fill();
    ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(cx, cy, w * 0.09, 0, 7); ctx.fill();
    ctx.restore(); rr(ctx, x, y, w, h, R); ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 1.5 * s; ctx.stroke();
  }
  // a card: p 0..0.45 dealt in (slides from off-screen, face down), 0.45..1 flips face up
  function card(ctx, x, y, w, h, p, o = {}, t = 0) {
    if (p <= 0) return; const s = sOf(ctx), W = ctx.canvas.width;
    const dp = K.ease.out(K.clamp(p / 0.45)), fp = K.ease.inOut(K.clamp((p - 0.45) / 0.55));
    const ox = (1 - dp) * (W * 0.6), oy = (1 - dp) * -120 * s, rot = (1 - dp) * 0.5 + (o.rot || 0);
    const cx = x + w / 2 + ox, cy = y + h / 2 + oy, ang = Math.cos(fp * Math.PI), lift = Math.sin(fp * Math.PI);
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot);
    ctx.fillStyle = 'rgba(10,0,5,0.45)'; ctx.beginPath(); ctx.roundRect(-w / 2 + (8 + lift * 14) * s, -h / 2 + (10 + lift * 16) * s, w, h, w * 0.05); ctx.fill();
    ctx.scale(Math.max(0.02, Math.abs(ang)) * (1 + lift * 0.06), 1 + lift * 0.06);
    if (ang > 0 && !o.faceUp) back(ctx, -w / 2, -h / 2, w, h, t); else face(ctx, -w / 2, -h / 2, w, h, o, t);
    ctx.restore();
  }
  // gilded rays + four-point sparkles
  function burst(ctx, x, y, r, p, t) {
    if (p <= 0) return; const s = sOf(ctx), e = K.ease.out(p), a = Math.sin(Math.PI * K.clamp(p)) * 0.6 + 0.4 * (p >= 1 ? 1 : 0);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r * 1.6 * e); g.addColorStop(0, 'rgba(255,220,140,0.5)'); g.addColorStop(1, 'rgba(255,200,100,0)');
    ctx.fillStyle = g; for (let i = 0; i < 32; i++) { const a0 = (i / 32) * Math.PI * 2 + t * 0.1, wd = i % 2 ? 0.03 : 0.06; ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r * 1.6 * e * (i % 2 ? 0.75 : 1), a0 - wd, a0 + wd); ctx.fill(); }
    ctx.restore();
    ctx.save(); const rg = K.rng(4);
    for (let i = 0; i < 9; i++) { const ang = rg() * Math.PI * 2, d = r * rg.range(0.7, 1.3) * e, sz = rg.range(8, 18) * s * (0.6 + 0.4 * Math.sin(t * 4 + i));
      ctx.fillStyle = 'rgba(255,240,190,0.95)'; star(ctx, x + Math.cos(ang) * d * 1.3, y + Math.sin(ang) * d * 0.7, sz * K.clamp(p * 2), 4, 0.18); ctx.fill(); }
    ctx.restore();
  }

  const style = {
    id: 'tarot-card', name: 'Tarot Card', family: 'Illustration',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700&family=Cormorant+Garamond:ital,wght@0,600;1,500;1,600&display=block',
      specs: ['700 56px "Cinzel"', '600 34px "Cinzel"', 'italic 600 34px "Cormorant Garamond"', '600 34px "Cormorant Garamond"'] }],
    palette: { bg: C.velvet, ink: C.line, gold: C.gold, stock: C.stock, navy: C.navy, teal: C.teal, rust: C.rust, mustard: C.mustard, lavender: C.lav },
    sfx: { draw: null, land: 'paper', emphasis: 'chime', transition: 'whoosh', bed: 'room' },
    card, face, back, foil, burst,

    background(ctx, W, H, t) {
      ctx.drawImage(velvet(W, H), 0, 0);
      // a slow pool of candle light drifting over the pile
      const x = W * (0.5 + 0.12 * Math.sin(t * 0.35)), y = H * (0.42 + 0.06 * Math.cos(t * 0.27)), g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * 0.6);
      g.addColorStop(0, 'rgba(255,170,150,0.14)'); g.addColorStop(1, 'rgba(255,170,150,0)'); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    },
    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.55, '#0c0206');
      K.grain(ctx, W, H, t, 0.05, 24, 'overlay');
    },

    // foil-stamped Roman capitals; each letter presses in with a flash of sheen
    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 56) * s, t = o.t || 0;
      ctx.save(); ctx.font = K.font(size, CAPS, 700); const txt = o.caps === false ? text : text.toUpperCase(), w = ctx.measureText(txt).width;
      let cx = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x; const n = txt.length * K.clamp(p);
      for (let i = 0; i < txt.length; i++) {
        const ch = txt[i], cw = ctx.measureText(ch).width, a = K.clamp(n - i);
        if (a > 0) {
          ctx.globalAlpha = a; ctx.fillStyle = 'rgba(20,0,8,0.7)'; ctx.fillText(ch, cx + 2 * s, y + 3 * s);
          ctx.fillStyle = o.color || foil(ctx, cx - size, y - size, cx + size * 2, y, t, i * 0.03); ctx.fillText(ch, cx, y);
          if (a < 1) { ctx.globalAlpha = 1 - a; ctx.fillStyle = C.goldHi; ctx.fillText(ch, cx, y); }
        }
        cx += cw;
      }
      ctx.restore(); return { w, h: size };
    },
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 36) * s;
      ctx.save(); ctx.globalAlpha = K.clamp(p * 1.5); ctx.font = K.font(size, SERIF, 600, 'italic'); ctx.textAlign = o.align || 'left';
      ctx.fillStyle = 'rgba(15,0,6,0.7)'; ctx.fillText(text, x + 2 * s, y + 2 * s); ctx.fillStyle = o.color || C.cream; ctx.fillText(text, x, y);
      const w = ctx.measureText(text).width; ctx.restore(); return { w, h: size };
    },

    // gold filigree line: a drawn-on double strand with a curl at the root and a star head
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), t = o.t || 0, pts = K.arcPts(from, to, o.bend ?? 0.15, 40), q = K.trim(pts, K.clamp(p / 0.85));
      if (q.length < 2) return null;
      ctx.save(); ctx.lineCap = 'round'; ctx.strokeStyle = foil(ctx, from[0], from[1], to[0], to[1], t);
      ctx.lineWidth = 3 * s; K.poly(ctx, q); ctx.stroke();
      ctx.lineWidth = 1.2 * s; ctx.beginPath(); q.forEach((pt, i) => { const off = Math.sin(i * 0.5) * 5 * s; i ? ctx.lineTo(pt[0], pt[1] + off) : ctx.moveTo(pt[0], pt[1] + off); }); ctx.stroke();
      ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.arc(from[0], from[1] - 7 * s, 7 * s, Math.PI * 0.5, Math.PI * 2.2); ctx.stroke();
      if (p > 0.85) { const b = pts[pts.length - 1], a = pts[pts.length - 4], ang = Math.atan2(b[1] - a[1], b[0] - a[0]), L = 16 * s * K.clamp((p - 0.85) / 0.15);
        ctx.fillStyle = foil(ctx, b[0] - L, b[1] - L, b[0] + L, b[1] + L, t); ctx.beginPath(); ctx.moveTo(b[0] + Math.cos(ang) * L * 0.4, b[1] + Math.sin(ang) * L * 0.4); ctx.lineTo(b[0] - Math.cos(ang - 0.55) * L, b[1] - Math.sin(ang - 0.55) * L); ctx.lineTo(b[0] - Math.cos(ang) * L * 0.4, b[1] - Math.sin(ang) * L * 0.4); ctx.lineTo(b[0] - Math.cos(ang + 0.55) * L, b[1] - Math.sin(ang + 0.55) * L); ctx.closePath(); ctx.fill(); }
      ctx.restore(); return q[q.length - 1];
    },

    // the container is a card (o.numeral, o.name, o.art); with o.plaque it is a small brass-edged minor plaque
    box(ctx, x, y, w, h, p, o = {}) {
      if (!o.plaque) return card(ctx, x, y, w, h, p, o, o.t || 0);
      if (p <= 0) return; const s = sOf(ctx), e = K.ease.back(K.clamp(p)), t = o.t || 0;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(e, e); ctx.translate(-(x + w / 2), -(y + h / 2));
      ctx.fillStyle = 'rgba(10,0,5,0.45)'; rr(ctx, x + 5 * s, y + 6 * s, w, h, 8 * s); ctx.fill();
      ctx.save(); rr(ctx, x, y, w, h, 8 * s); ctx.clip(); ctx.drawImage(stock(ctx.canvas.width, ctx.canvas.height), x, y, w, h, x, y, w, h); ctx.restore();
      ctx.strokeStyle = foil(ctx, x, y, x + w, y + h, t, (o.seed || 0) * 0.07); ctx.lineWidth = 3 * s; rr(ctx, x + 4 * s, y + 4 * s, w - 8 * s, h - 8 * s, 6 * s); ctx.stroke();
      ctx.restore();
    },

    // a brass plaque with engraved numerals
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 110) * s, txt = K.fmt(value), t = o.t || 0;
      ctx.save(); ctx.font = K.font(size, CAPS, 700); ctx.textAlign = 'center';
      const w = Math.max(ctx.measureText('0,000,000').width, ctx.measureText(txt).width) + 90 * s, h = size * 1.25;
      ctx.fillStyle = 'rgba(10,0,5,0.5)'; rr(ctx, x - w / 2 + 8 * s, y - h * 0.78 + 10 * s, w, h, 18 * s); ctx.fill();
      const g = ctx.createLinearGradient(0, y - h * 0.78, 0, y + h * 0.22); g.addColorStop(0, '#d9b45a'); g.addColorStop(0.45, '#a87d2c'); g.addColorStop(1, '#6e4c16');
      ctx.fillStyle = g; rr(ctx, x - w / 2, y - h * 0.78, w, h, 18 * s); ctx.fill();
      ctx.strokeStyle = foil(ctx, x - w / 2, y - h, x + w / 2, y, t); ctx.lineWidth = 4 * s; rr(ctx, x - w / 2 + 8 * s, y - h * 0.78 + 8 * s, w - 16 * s, h - 16 * s, 12 * s); ctx.stroke();
      for (const sx of [-1, 1]) { ctx.fillStyle = '#5a3e10'; ctx.beginPath(); ctx.arc(x + sx * (w / 2 - 24 * s), y - h * 0.28, 6 * s, 0, 7); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,236,170,0.55)'; ctx.fillText(txt, x, y + 2 * s);
      ctx.fillStyle = '#2b1a06'; ctx.fillText(txt, x, y);
      ctx.restore(); return { w, h };
    },
    emphasis(ctx, x, y, r, p, o = {}) { burst(ctx, x, y, r, p, o.t || 0); },

    // a giant card back sweeps across and gathers the spread, then lifts away
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), w = Math.max(W, H) * 1.5, h = w * 1.2;
      const x = p < 0.5 ? K.lerp(W * 1.2, W / 2, K.ease.out(p * 2)) : K.lerp(W / 2, -W * 0.9, K.ease.in((p - 0.5) * 2));
      const rot = p < 0.5 ? K.lerp(0.35, 0, K.ease.out(p * 2)) : K.lerp(0, -0.3, (p - 0.5) * 2);
      ctx.save(); ctx.translate(x, H / 2); ctx.rotate(rot);
      ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(-w / 2 - 30 * s, -h / 2, 30 * s, h);
      back(ctx, -w / 2, -h / 2, w, h, o.t || 0); ctx.restore();
    },
  };

  // ---------- art inside the windows ----------
  function artVideo(ctx, cx, cy, r, t) {
    const s = sOf(ctx); ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(2, r * 0.06);
    ctx.fillStyle = C.mustard; ctx.beginPath(); ctx.arc(cx, cy, r, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.rust; ctx.beginPath(); ctx.moveTo(cx - r * 0.32, cy - r * 0.5); ctx.lineTo(cx - r * 0.32, cy + r * 0.5); ctx.lineTo(cx + r * 0.55, cy); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  function artOS(ctx, cx, cy, r, t) {
    ctx.save(); ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(2, r * 0.045);
    // orbit rings with drifting planets, an all-seeing eye at the heart
    for (let i = 0; i < 2; i++) { ctx.beginPath(); ctx.ellipse(cx, cy, r * (1.05 + i * 0.25), r * (0.38 + i * 0.1), -0.25, 0, 7); ctx.strokeStyle = 'rgba(214,180,100,0.9)'; ctx.stroke(); }
    ctx.strokeStyle = C.line; ctx.fillStyle = C.teal; ctx.beginPath(); ctx.arc(cx, cy, r * 0.62, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.cream; ctx.beginPath(); ctx.moveTo(cx - r * 0.5, cy); ctx.quadraticCurveTo(cx, cy - r * 0.42, cx + r * 0.5, cy); ctx.quadraticCurveTo(cx, cy + r * 0.42, cx - r * 0.5, cy); ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.navy; ctx.beginPath(); ctx.arc(cx, cy, r * 0.17, 0, 7); ctx.fill();
    for (let i = 0; i < 3; i++) { const a = t * (0.6 + i * 0.25) + i * 2.1, px = cx + Math.cos(a) * r * (1.05 + (i % 2) * 0.25), py = cy + Math.sin(a) * r * (0.38 + (i % 2) * 0.1);
      const rx = px - cx, ry = py - cy, c = Math.cos(-0.25), sn = Math.sin(-0.25); ctx.fillStyle = [C.rust, C.mustard, C.lav][i];
      ctx.beginPath(); ctx.arc(cx + rx * c - ry * sn, cy + rx * sn + ry * c, r * 0.11, 0, 7); ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }
  // little celestial marks for the minor plaques (drawn, so no emoji fallback can sneak in)
  function sym(ctx, i, x, y, r) {
    ctx.save(); ctx.fillStyle = C.rust; ctx.strokeStyle = C.line; ctx.lineWidth = Math.max(1.2, r * 0.14);
    const k = i % 7;
    if (k === 0) { ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, 7); ctx.fill(); ctx.stroke(); for (let j = 0; j < 8; j++) { const a = (j / 8) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.65, y + Math.sin(a) * r * 0.65); ctx.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); ctx.stroke(); } }
    else if (k === 1) { ctx.beginPath(); ctx.arc(x, y, r * 0.85, 0.6, Math.PI * 2 - 0.6); ctx.arc(x + r * 0.35, y, r * 0.65, Math.PI * 2 - 0.9, 0.9, true); ctx.closePath(); ctx.fillStyle = C.mustard; ctx.fill(); ctx.stroke(); }
    else if (k === 2) { star(ctx, x, y, r, 5, 0.45); ctx.fillStyle = C.mustard; ctx.fill(); ctx.stroke(); }
    else if (k === 3) { ctx.beginPath(); ctx.arc(x, y, r * 0.5, 0, 7); ctx.fillStyle = C.teal; ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.3, -0.4, 0, 7); ctx.stroke(); }
    else if (k === 4) { star(ctx, x, y, r, 8, 0.4); ctx.fill(); ctx.stroke(); }
    else if (k === 5) { ctx.beginPath(); ctx.arc(x, y, r * 0.8, 0, 7); ctx.fillStyle = C.lav; ctx.fill(); ctx.stroke(); ctx.fillStyle = C.line; ctx.beginPath(); ctx.arc(x, y, r * 0.22, 0, 7); ctx.fill(); }
    else { ctx.beginPath(); ctx.moveTo(x, y - r); ctx.lineTo(x + r * 0.7, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r * 0.7, y); ctx.closePath(); ctx.fillStyle = C.teal; ctx.fill(); ctx.stroke(); }
    ctx.restore();
  }

  // ---------- the shared demo: a reading on the velvet ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 84 * s], video: [90 * s, 175 * s, 210 * s, 340 * s], node: [430 * s, 150 * s, 250 * s, 405 * s],
      chips: PLATFORMS.map((n, i) => [870 * s, (160 + i * 72) * s]), chipW: 290 * s, chipH: 56 * s };
    return { s, P: true, title: [W / 2, H * 0.07], video: [W * 0.07, H * 0.165, W * 0.32, H * 0.25], node: [W * 0.47, H * 0.15, W * 0.46, H * 0.33],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.535 : W * 0.465, H * (0.6 + Math.floor(i / 2) * 0.085)]), chipW: W * 0.4, chipH: 0.055 * H };
  }
  function plaque(ctx, name, i, cx, cy, w, h, p, t, align) {
    if (p <= 0) return; const s = sOf(ctx), x = align === 'right' ? cx - w : cx;
    style.box(ctx, x, cy - h / 2, w, h, p, { plaque: true, t, seed: i });
    if (p > 0.5) { ctx.save(); ctx.globalAlpha = K.clamp((p - 0.5) * 2); ctx.textBaseline = 'middle'; sym(ctx, i, x + h * 0.6, cy, h * 0.28);
      ctx.font = K.font(K.fitSize(ctx, name.toUpperCase(), CAPS, 700, Math.min(34 * s, h * 0.5), w - h * 1.3, 10), CAPS, 700); ctx.fillStyle = C.line; ctx.textAlign = 'left';
      ctx.fillText(name.toUpperCase(), x + h * 1.05, cy + 3 * s); ctx.restore(); }
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const scene2 = t >= 8.25;
      if (!scene2) {
        if (P) { style.title(ctx, 'One video.', W / 2, H * 0.065, K.beat(t, 0.1, 0.7, 'lin'), { size: 60, align: 'center', t });
          style.title(ctx, 'Every platform.', W / 2, H * 0.115, K.beat(t, 0.8, 0.9, 'lin'), { size: 60, align: 'center', t }); }
        else style.title(ctx, 'One video. Every platform.', W / 2, Lo.title[1], K.beat(t, 0.1, 1.6, 'lin'), { size: 52, align: 'center', t });
        const [vx, vy, vw, vh] = Lo.video;
        card(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 1.0, 'lin'), { numeral: 'I', name: 'The Video', art: artVideo, sky: C.teal, rot: -0.04, seed: 1 }, t);
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 46 * s, K.beat(t, 3.0, 0.5, 'lin'), { align: 'center' });
        const [nx, ny, nw, nh] = Lo.node;
        const a1 = [[vx + vw + 12 * s, vy + vh * 0.45], [nx - 12 * s, ny + nh * 0.45]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.4, 0.7, 'lin'), { bend: -0.25, t });
        card(ctx, nx, ny, nw, nh, K.beat(t, 3.9, 1.0, 'lin'), { numeral: 'XXI', name: 'Creator OS', art: artOS, sky: C.navy, seed: 3 }, t);
        const bot = [nx + nw / 2, ny + nh + 14 * s];
        if (P) {
          const yLast = Lo.chips[6][1], tp = K.beat(t, 4.9, 0.5, 'lin');
          if (tp > 0) { const lead = K.arcPts(bot, [W / 2, H * 0.54], 0.2, 30); ctx.save(); ctx.strokeStyle = foil(ctx, 0, 0, W, H, t); ctx.lineWidth = 3 * s; K.poly(ctx, K.trim(lead, K.clamp(tp * 2))); ctx.stroke(); ctx.restore(); }
          style.arrow(ctx, [W / 2, H * 0.54], [W / 2, yLast + 20 * s], K.clamp(tp * 2 - 1), { bend: 0, t });
        }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0, p = K.beat(t, t0, 0.35, 'lin');
          if (P) style.arrow(ctx, [W / 2, cy], [left ? W * 0.475 : W * 0.525, cy], p, { bend: 0, t });
          else style.arrow(ctx, [nx + nw + 12 * s, ny + nh * 0.45], [cx - 12 * s, cy], p, { bend: (i - 3) * 0.04, t });
          plaque(ctx, name, i, P ? (left ? cx - 30 * s : cx + 30 * s) : cx, cy, Lo.chipW * (P ? 0.92 : 1), Lo.chipH, K.beat(t, t0 + 0.25, 0.35, 'lin'), t, P && left ? 'right' : 'left');
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), { t });
      } else {
        // the reading: Creator OS card stands at the head, the plaque tallies the views
        const cw = (P ? 0.3 * W : 150 * s), ch = cw * 1.62, cx = W / 2 - cw / 2, cy = P ? H * 0.05 : 30 * s;
        card(ctx, cx, cy, cw, ch, 1, { numeral: 'XXI', name: 'Creator OS', art: artOS, sky: C.navy, seed: 3 }, t);
        const ny = P ? H * 0.47 : 440 * s;
        style.emphasis(ctx, W / 2, ny - 40 * s, (P ? 300 : 260) * s, K.beat(t, 10.0, 0.9, 'lin'), { t });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        if (t > 8.45) style.counter(ctx, Math.round(v / 1000) * 1000, W / 2, ny, 1, { size: P ? 84 : 92, t });
        style.label(ctx, 'views', W / 2, ny + (P ? 92 : 80) * s, K.beat(t, 8.8, 0.4, 'lin'), { align: 'center', size: 44 });
        const tp = K.beat(t, 10.5, 1.0, 'lin');
        if (P) { style.title(ctx, 'Post once.', W / 2, H * 0.72, K.clamp(tp * 2), { size: 62, align: 'center', t });
          style.title(ctx, 'Reach everywhere.', W / 2, H * 0.72 + 90 * s, K.clamp(tp * 2 - 1), { size: 62, align: 'center', t }); }
        else style.title(ctx, 'Post once. Reach everywhere.', W / 2, 660 * s, tp, { size: 50, align: 'center', t });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), { t });
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1.2); k.play('swell', 0.0, { chord: ['D4', 'F4', 'A4'], dur: 2.0, gain: 0.8 });
      k.play('chime', 0.2, { note: 'A5', gain: 0.5 });
      k.play('whoosh', 2.0, { dur: 0.4 }); k.play('paper', 2.4, { dur: 0.25 }); k.play('paper', 2.5, { dur: 0.3 }); k.play('pluck', 2.95, { note: 'D5' });
      k.play('scribble', 3.4, { medium: 'pen', dur: 0.7, gain: 0.5 }); k.play('ding', 4.0, { gain: 0.4 });
      k.play('whoosh', 3.9, { dur: 0.4 }); k.play('paper', 4.35, { dur: 0.35 }); k.play('pluck', 4.85, { note: 'A4' });
      const notes = ['D5', 'E5', 'F5', 'A5', 'C6', 'D6', 'F6'];
      for (let i = 0; i < 7; i++) { k.play('paper', 5.0 + i * 0.4, { dur: 0.12, gain: 0.7 }); k.play('pluck', 5.3 + i * 0.4, { note: notes[i], gain: 0.7 }); }
      k.play('whoosh', 7.6, { dur: 0.7 }); k.play('paper', 7.9, { dur: 0.5 }); k.play('whoosh', 8.3, { dur: 0.6, up: false });
      k.play('count', 8.6, { dur: 1.4 }); k.play('chime', 10.0, { note: 'A5' }); k.play('swell', 10.0, { chord: ['D4', 'A4', 'D5'], dur: 1.8 });
      k.play('chime', 11.3, { note: 'D6' });
    },
  };
  MS.register(style);
})();
