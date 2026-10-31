// Bioluminescent Deep Sea (Light & Imaging). The midnight zone: near-black water, parallax marine snow streaming up as
// the camera sinks, and nothing lit but living light. Words gather out of plankton, containers are comb jellies with
// rainbow-rippling comb rows, the hub is a jellyfish whose nerve net flickers, arrows are siphonophore chains lighting
// bead by bead, the emphasis is a plankton bloom-burst, and scene changes fall into darkness until a lure lights new water.
(function () {
  const ID = 'deep-sea';
  const C = { water: '#020a12', cyan: '#5ff6ff', teal: '#2fd6c0', blue: '#3f8cff', magenta: '#ff5fd2', amber: '#ffb54a', pale: '#d9fbff' };
  const TF = 'Fraunces', LF = 'Space Grotesk', MF = 'IBM Plex Mono';
  const S = (W, H) => K.layout(W, H).s;
  const cw = (ctx) => [ctx.canvas.width, ctx.canvas.height];

  function bloom(ctx, W, H, f, radius, th, amount) {
    const w = Math.ceil(W / f), h = Math.ceil(H / f);
    const a = K.cached(`${ID}:bla:${w}x${h}`, () => K.layer(w, h)), b = K.cached(`${ID}:blb:${w}x${h}`, () => K.layer(w, h));
    const ax = a.getContext('2d', { willReadFrequently: true }); ax.globalCompositeOperation = 'copy'; ax.drawImage(ctx.canvas, 0, 0, w, h);
    const img = ax.getImageData(0, 0, w, h), d = img.data, t0 = th * 255, k = 255 / (255 - t0);
    for (let i = 0; i < d.length; i += 4) { d[i] = Math.max(0, d[i] - t0) * k; d[i + 1] = Math.max(0, d[i + 1] - t0) * k; d[i + 2] = Math.max(0, d[i + 2] - t0) * k; }
    ax.putImageData(img, 0, 0);
    const bx = b.getContext('2d'); bx.globalCompositeOperation = 'copy'; bx.filter = `blur(${radius}px)`; bx.drawImage(a, 0, 0); bx.filter = 'none';
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = amount; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
  }

  function waterPlate(W, H) {
    return K.cached(`${ID}:water:${W}x${H}`, () => {
      const c = K.layer(W, H), x = c.getContext('2d'), s = S(W, H);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#04192a'); g.addColorStop(0.45, '#020d16'); g.addColorStop(1, '#010407');
      x.fillStyle = g; x.fillRect(0, 0, W, H);
      // last memory of the surface: very faint shafts
      x.globalCompositeOperation = 'lighter';
      const r = K.rng(4);
      for (let i = 0; i < 5; i++) {
        const sx = W * (0.15 + r() * 0.8), w = (60 + r() * 120) * s, lg = x.createLinearGradient(0, 0, 0, H * 0.8);
        lg.addColorStop(0, 'rgba(80,200,220,0.035)'); lg.addColorStop(1, 'rgba(80,200,220,0)');
        x.fillStyle = lg; x.beginPath(); x.moveTo(sx - w / 2, 0); x.lineTo(sx + w / 2, 0); x.lineTo(sx + w * 1.5 - 200 * s, H * 0.8); x.lineTo(sx - w * 1.5 - 200 * s, H * 0.8); x.closePath(); x.fill();
      }
      // murk
      x.globalCompositeOperation = 'source-over';
      const sm = K.layer(160, Math.round(160 * H / W)), sx2 = sm.getContext('2d'), img = sx2.createImageData(sm.width, sm.height), d = img.data, nz = K.noise(8);
      for (let j = 0; j < sm.height; j++) for (let i = 0; i < sm.width; i++) { const v = nz.fbm2(i * 0.04, j * 0.04, 4), o = (j * sm.width + i) * 4; d[o] = 10; d[o + 1] = 60; d[o + 2] = 80; d[o + 3] = K.clamp(v + 0.15) * 70; }
      sx2.putImageData(img, 0, 0); x.drawImage(sm, 0, 0, W, H);
      return c;
    });
  }
  // Marine snow: three depth layers drifting up as we sink, nearer = bigger, faster, softer.
  function snow(ctx, W, H, t, speed = 1) {
    const s = S(W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (let layer = 0; layer < 3; layer++) {
      const r = K.rng(100 + layer), n = [90, 50, 18][layer], v = [14, 34, 70][layer] * s * speed, sz = [1.1, 1.8, 3.2][layer] * s, a = [0.35, 0.45, 0.3][layer];
      ctx.fillStyle = `rgba(190,235,240,${a})`;
      for (let i = 0; i < n; i++) {
        const x0 = r() * W, y0 = r() * H, ph = r() * 6;
        const y = ((y0 - t * v) % (H + 20) + H + 20) % (H + 20) - 10, x = x0 + Math.sin(t * 0.5 + ph) * 8 * s;
        if (speed > 2) { ctx.fillRect(x, y, sz * 0.8, sz * speed * 3); } else { ctx.beginPath(); ctx.arc(x, y, sz, 0, 7); ctx.fill(); }
      }
    }
    ctx.restore();
  }

  // ---------- plankton lettering ----------
  // Sample the glyphs once into points; each plankton mote swims from a scattered start onto its point.
  function textPoints(font, text, step) {
    return K.cached(`${ID}:pts:${font}:${text}:${step}`, () => {
      const m = K.layer(10, 10).getContext('2d'); m.font = font; const w = Math.ceil(m.measureText(text).width) + 20, h = Math.ceil(parseFloat(font.match(/(\d+)px/)[1]) * 1.6);
      const c = K.layer(w, h), x = c.getContext('2d', { willReadFrequently: true }); x.font = font; x.fillStyle = '#fff'; x.textBaseline = 'alphabetic'; x.fillText(text, 10, h * 0.72);
      const d = x.getImageData(0, 0, w, h).data, pts = [], r = K.rng(text.length * 13 + 7);
      for (let y = 0; y < h; y += step) for (let i = 0; i < w; i += step) if (d[(y * w + i) * 4 + 3] > 120) pts.push([i - 10 + (r() - 0.5) * step, y - h * 0.72 + (r() - 0.5) * step, r(), r(), r()]);
      return { pts, w: w - 20 };
    });
  }
  function glowText(ctx, text, x, y, p, o) {
    const [W, H] = cw(ctx), s = S(W, H), size = o.size * s, font = K.font(size, o.font, o.weight || 600, o.italic ? 'italic' : ''), col = o.color;
    const step = Math.max(3, Math.round(size / 11)), tp = textPoints(font, text, step), tw = tp.w;
    const x0 = o.align === 'center' ? x - tw / 2 : o.align === 'right' ? x - tw : x, t = o.t || 0;
    if (p <= 0) return { w: tw, h: size };
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // motes
    const motes = K.clamp(1.6 - p * 1.4);
    if (motes > 0) {
      for (const [px, py, a, b, c] of tp.pts) {
        const k = K.ease.out(K.clamp((p - a * 0.35) / 0.55)), ang = b * Math.PI * 2, rad = (90 + c * 220) * s;
        const sx = x0 + px + Math.cos(ang) * rad, sy = y + py + Math.sin(ang) * rad * 0.6 + 60 * s;
        const mx = K.lerp(sx, x0 + px, k) + Math.sin(t * 2 + a * 9) * 2 * s, my = K.lerp(sy, y + py, k) + Math.cos(t * 1.7 + b * 9) * 2 * s;
        ctx.fillStyle = K.rgba(K.mix(col, '#ffffff', c * 0.5), (0.25 + 0.6 * k) * motes * (0.6 + 0.4 * Math.sin(t * 6 + a * 20)));
        ctx.fillRect(mx - s, my - s, 2.2 * s, 2.2 * s);
      }
    }
    // the gathered word glows on
    const g = K.clamp((p - 0.5) / 0.5);
    if (g > 0) {
      ctx.font = font; ctx.textBaseline = 'alphabetic';
      const breathe = 0.85 + 0.15 * Math.sin(t * 2.2 + text.length);
      ctx.globalAlpha = g * breathe; ctx.shadowColor = col; ctx.shadowBlur = 26 * s; ctx.fillStyle = K.rgba(col, 0.75); ctx.fillText(text, x0, y);
      ctx.shadowBlur = 4 * s; ctx.fillStyle = K.rgba(K.mix(col, '#ffffff', 0.4), 0.8); ctx.fillText(text, x0, y);
    }
    ctx.restore();
    return { w: tw, h: size };
  }

  // ---------- creatures ----------
  function jellyfish(ctx, cx, cy, rx, ry, p, t, s, title) {
    if (p <= 0) return;
    const pulse = 1 + 0.035 * Math.sin(t * 2.4), RX = rx * pulse, RY = ry * (2 - pulse);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const a = K.clamp(p * 1.6);
    // tentacles
    const r = K.rng(61);
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const u = (i + 0.5) / 16, bx = cx - RX * 0.92 + u * RX * 1.84, len = (60 + r() * 90) * s * K.clamp(p * 1.4 - 0.2), ph = r() * 6;
      ctx.strokeStyle = K.rgba(i % 4 === 0 ? C.magenta : C.cyan, 0.22 * a); ctx.lineWidth = (i % 4 === 0 ? 2.2 : 1.2) * s; ctx.beginPath(); ctx.moveTo(bx, cy);
      for (let k = 1; k <= 14; k++) { const q = k / 14; ctx.lineTo(bx + Math.sin(q * 5 + t * 1.6 + ph) * 10 * s * q, cy + q * len); }
      ctx.stroke();
    }
    // bell
    const bell = () => { ctx.beginPath(); ctx.ellipse(cx, cy, RX, RY, 0, Math.PI, 0); ctx.quadraticCurveTo(cx, cy + RY * 0.18, cx - RX, cy); ctx.closePath(); };
    const g = ctx.createRadialGradient(cx, cy - RY * 0.5, 0, cx, cy - RY * 0.3, RX); g.addColorStop(0, `rgba(90,240,255,${0.16 * a})`); g.addColorStop(1, `rgba(40,120,200,${0.05 * a})`);
    bell(); ctx.fillStyle = g; ctx.fill();
    ctx.shadowColor = C.cyan; ctx.shadowBlur = 16 * s; ctx.strokeStyle = K.rgba(C.cyan, 0.75 * a); ctx.lineWidth = 2.2 * s; bell(); ctx.stroke(); ctx.shadowBlur = 0;
    // rim lights
    for (let i = 0; i <= 26; i++) { const u = i / 26, ang = Math.PI + u * Math.PI, lx = cx + Math.cos(ang) * RX, ly = cy + Math.sin(ang) * RY; const on = 0.5 + 0.5 * Math.sin(t * 5 - u * 12); ctx.fillStyle = K.rgba(C.pale, a * (0.3 + 0.7 * on)); ctx.beginPath(); ctx.arc(lx, ly, 2.2 * s, 0, 7); ctx.fill(); }
    // nerve net: nodes flicker alight, lines between neighbours
    const nr = K.rng(62), nodes = [];
    for (let i = 0; i < 14; i++) { const ang = Math.PI * (1.12 + nr() * 0.76), rr = 0.62 + nr() * 0.3; nodes.push([cx + Math.cos(ang) * RX * rr, cy + Math.sin(ang) * RY * rr * 0.95, nr()]); }
    ctx.lineWidth = 1.1 * s;
    for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
      const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]); if (d > RX * 0.55) continue;
      const on = K.clamp((p - 0.3 - nodes[i][2] * 0.4) * 4);
      ctx.strokeStyle = K.rgba(C.teal, 0.35 * on); ctx.beginPath(); ctx.moveTo(nodes[i][0], nodes[i][1]); ctx.lineTo(nodes[j][0], nodes[j][1]); ctx.stroke();
    }
    for (const [nx, ny, k] of nodes) { const on = K.clamp((p - 0.3 - k * 0.4) * 4) * (0.6 + 0.4 * Math.sin(t * 7 + k * 30)); ctx.fillStyle = K.rgba(k > 0.8 ? C.magenta : C.pale, on); ctx.beginPath(); ctx.arc(nx, ny, 2.6 * s, 0, 7); ctx.fill(); }
    ctx.restore();
  }
  function anglerfish(ctx, x, y, sc, a, t) {
    if (a <= 0) return;
    ctx.save(); ctx.translate(x, y); ctx.scale(sc, sc); ctx.globalAlpha = a;
    // body (barely lit by its own lure)
    const g = ctx.createRadialGradient(40, -40, 10, 0, 0, 140); g.addColorStop(0, 'rgba(120,80,50,0.55)'); g.addColorStop(1, 'rgba(20,14,12,0.9)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(-130, -10); ctx.quadraticCurveTo(-60, -95, 50, -60); ctx.quadraticCurveTo(110, -40, 120, 10); ctx.lineTo(60, 12); ctx.quadraticCurveTo(80, 40, 40, 55); ctx.quadraticCurveTo(-60, 70, -130, 20); ctx.lineTo(-175, 45); ctx.lineTo(-170, -40); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(240,230,210,0.85)'; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.moveTo(60 + i * 8, 12); ctx.lineTo(64 + i * 8, i % 2 ? 26 : 30); ctx.lineTo(68 + i * 8, 12); ctx.fill(); }
    ctx.fillStyle = '#e8f6ff'; ctx.beginPath(); ctx.arc(40, -30, 6, 0, 7); ctx.fill(); ctx.fillStyle = '#000'; ctx.beginPath(); ctx.arc(41, -30, 3, 0, 7); ctx.fill();
    // stalk + lure
    ctx.strokeStyle = 'rgba(150,110,80,0.7)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(30, -62); ctx.quadraticCurveTo(70, -150, 140, -110); ctx.stroke();
    const on = 0.75 + 0.25 * Math.sin(t * 3);
    ctx.globalCompositeOperation = 'lighter';
    const lg = ctx.createRadialGradient(140, -104, 0, 140, -104, 60); lg.addColorStop(0, `rgba(255,240,200,${on})`); lg.addColorStop(0.15, `rgba(255,180,80,${0.7 * on})`); lg.addColorStop(1, 'rgba(255,150,60,0)');
    ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(140, -104, 60, 0, 7); ctx.fill();
    ctx.restore();
  }

  const style = {
    id: ID, name: 'Bioluminescent Deep Sea', family: 'Light & Imaging',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@1,9..144,600&family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@500&display=block',
      specs: ['italic 600 64px "Fraunces"', '500 36px "Space Grotesk"', '700 110px "Space Grotesk"', '500 22px "IBM Plex Mono"'] }],
    palette: { bg: C.water, ...C },
    sfx: { draw: null, land: 'pluck', emphasis: 'chime', transition: 'whoosh', bed: 'ocean' },
    setup(W, H) { waterPlate(W, H); },

    background(ctx, W, H, t) { ctx.drawImage(waterPlate(W, H), 0, 0); snow(ctx, W, H, t); },

    finish(ctx, W, H, t) {
      const s = S(W, H);
      // depth gauge
      ctx.save(); ctx.font = K.font(22 * s, MF, 500); ctx.textAlign = 'right'; ctx.fillStyle = 'rgba(160,220,230,0.55)';
      ctx.fillText(`DEPTH ${Math.round(1020 + t * 9)} m`, W - 28 * s, 40 * s); ctx.fillText('TEMP 3.8 C', W - 28 * s, 68 * s);
      ctx.fillStyle = 'rgba(255,80,80,0.8)'; if (Math.floor(t * 1.5) % 2 === 0) { ctx.beginPath(); ctx.arc(W - 250 * s, 32 * s, 4 * s, 0, 7); ctx.fill(); }
      ctx.restore();
      bloom(ctx, W, H, 4, 3, 0.35, 0.6);
      bloom(ctx, W, H, 8, 9, 0.22, 0.6);
      K.vignette(ctx, W, H, 0.7, '#000');
      K.grain(ctx, W, H, t, 0.06, 24, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const [W, H] = cw(ctx), s = S(W, H), size = o.size || 64;
      if (o.maxW) {
        const m = K.layer(4, 4).getContext('2d'); m.font = K.font(size * s, TF, 600, 'italic');
        if (m.measureText(text).width > o.maxW) {
          const lines = K.wrap(m, text, o.maxW), lh = size * s * 1.12; let w = 0;
          lines.forEach((ln, i) => { w = Math.max(w, glowText(ctx, ln, x, y - (lines.length - 1 - i) * lh, K.clamp(p * 1.3 - i * 0.3), { size, font: TF, italic: true, color: o.color || C.cyan, align: o.align, t: o.t }).w); });
          return { w, h: lh * lines.length };
        }
      }
      return glowText(ctx, text, x, y, p, { size, font: TF, italic: true, color: o.color || C.cyan, align: o.align, t: o.t });
    },
    label(ctx, text, x, y, p, o = {}) { return glowText(ctx, text, x, y, p, { size: o.size || 34, font: LF, weight: 500, color: o.color || C.pale, align: o.align, t: o.t }); },

    // Siphonophore chain: beads strung along the path light one after another toward the target.
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const [W, H] = cw(ctx), s = S(W, H), col = o.color || C.cyan, t = o.t || 0;
      const pts = K.arcPts(from, to, o.bend ?? 0.15, 60), L = K.pathLen(pts), gap = (o.gap || 15) * s, n = Math.max(3, Math.floor(L / gap));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      // the stem
      ctx.strokeStyle = K.rgba(col, 0.18); ctx.lineWidth = 1.2 * s; K.poly(ctx, K.trim(pts, K.clamp(p * 1.1))); ctx.stroke();
      let last = null;
      for (let i = 0; i <= n; i++) {
        const u = i / n, on = K.clamp((p - u * 0.85) * 8); if (on <= 0) break;
        const q = K.trim(pts, Math.max(0.001, u)), b = q[q.length - 1], a = q[Math.max(0, q.length - 2)], ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
        const fl = 0.7 + 0.3 * Math.sin(t * 6 - u * 10), big = i === n;
        ctx.save(); ctx.translate(b[0], b[1]); ctx.rotate(ang);
        ctx.fillStyle = K.rgba(col, 0.25 * on); ctx.beginPath(); ctx.ellipse(0, 0, (big ? 12 : 7) * s, (big ? 7 : 4.5) * s, 0, 0, 7); ctx.fill();
        ctx.fillStyle = K.rgba(K.mix(col, '#ffffff', 0.6), 0.9 * on * fl); ctx.beginPath(); ctx.ellipse(0, 0, (big ? 5 : 3) * s, (big ? 3 : 2) * s, 0, 0, 7); ctx.fill();
        if (big) { ctx.strokeStyle = K.rgba(col, 0.8 * on); ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(-14 * s, -10 * s); ctx.lineTo(4 * s, 0); ctx.lineTo(-14 * s, 10 * s); ctx.stroke(); }
        ctx.restore(); last = b;
      }
      ctx.restore();
      return last;
    },

    // Comb jelly membrane: a translucent body with a glowing rim and rainbow comb rows rippling along it.
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), t = o.t || 0, a = K.clamp(p * 1.5), r = Math.min(h / 2, 46 * s);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const sc = K.ease.back(K.clamp(p * 1.3));
      ctx.translate(x + w / 2, y + h / 2); ctx.scale(sc, sc); ctx.translate(-(x + w / 2), -(y + h / 2));
      const g = ctx.createRadialGradient(x + w / 2, y + h / 2, 0, x + w / 2, y + h / 2, w * 0.6); g.addColorStop(0, `rgba(80,200,255,${0.12 * a})`); g.addColorStop(1, `rgba(60,120,220,${0.04 * a})`);
      ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
      ctx.strokeStyle = K.rgba(o.color || C.blue, 0.6 * a); ctx.lineWidth = 2 * s; ctx.shadowColor = o.color || C.blue; ctx.shadowBlur = 12 * s; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke(); ctx.shadowBlur = 0;
      // comb rows: short iridescent dashes travelling around the rim
      const per = 2 * (w + h), n = Math.floor(per / (16 * s));
      for (let i = 0; i < n; i++) {
        let d = (i / n) * per, px, py, ang;
        if (d < w) { px = x + d; py = y + 7 * s; ang = 0; } else if ((d -= w) < h) { px = x + w - 7 * s; py = y + d; ang = Math.PI / 2; } else if ((d -= h) < w) { px = x + w - d; py = y + h - 7 * s; ang = 0; } else { d -= w; px = x + 7 * s; py = y + h - d; ang = Math.PI / 2; }
        if (px < x + r * 0.5 && py < y + r * 0.5 || px > x + w - r * 0.5 && py < y + r * 0.5 || px < x + r * 0.5 && py > y + h - r * 0.5 || px > x + w - r * 0.5 && py > y + h - r * 0.5) continue;
        const hue = (i * 25 - t * 260) % 360, on = 0.4 + 0.6 * Math.max(0, Math.sin(i * 0.8 - t * 9));
        ctx.strokeStyle = `hsla(${(hue + 360) % 360},100%,65%,${0.85 * on * a})`; ctx.lineWidth = 2.4 * s;
        ctx.beginPath(); ctx.moveTo(px - Math.cos(ang) * 4 * s, py - Math.sin(ang) * 4 * s); ctx.lineTo(px + Math.cos(ang) * 4 * s, py + Math.sin(ang) * 4 * s); ctx.stroke();
      }
      ctx.restore();
    },

    counter(ctx, value, x, y, p, o = {}) {
      return glowText(ctx, K.fmt(Math.round(value)), x, y, p >= 1 ? 1 : 0.5 + p * 0.5, { size: o.size || 120, font: LF, weight: 700, color: o.color || C.cyan, align: o.align || 'center', t: o.t });
    },

    // Plankton bloom: a shock of motes bursts outward from the moment, ringed by a glowing wave.
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const [W, H] = cw(ctx), s = S(W, H), col = o.color || C.magenta, rx = r * (o.wide ?? 1.3), ry = r * (o.tall ?? 0.6), rnd = K.rng(o.seed || 31);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const k = K.ease.out(p), fade = 1 - K.clamp((p - 0.55) / 0.45) * 0.7;
      ctx.strokeStyle = K.rgba(col, 0.7 * fade); ctx.lineWidth = 3 * s; ctx.shadowColor = col; ctx.shadowBlur = 14 * s;
      ctx.beginPath(); ctx.ellipse(x, y, rx * (0.6 + 0.4 * k), ry * (0.6 + 0.4 * k), 0, 0, 7); ctx.stroke(); ctx.shadowBlur = 0;
      for (let i = 0; i < 160; i++) {
        const ang = rnd() * Math.PI * 2, d = 0.75 + rnd() * 0.7, pr = (0.5 + 0.5 * k) * d;
        ctx.fillStyle = K.rgba(rnd() < 0.3 ? C.cyan : col, (0.3 + rnd() * 0.6) * fade);
        ctx.fillRect(x + Math.cos(ang) * rx * pr, y + Math.sin(ang) * ry * pr, 2.4 * s, 2.4 * s);
      }
      ctx.restore();
    },

    // Descent into the dark: snow streaks upward, the water goes black, then a lure switches on and lights new water.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), t = o.t || 0;
      ctx.save();
      if (p < 0.5) {
        const k = K.ease.in(p * 2);
        ctx.fillStyle = `rgba(0,3,6,${k})`; ctx.fillRect(0, 0, W, H);
        snow(ctx, W, H, t * (1 + k * 6), 1 + k * 5);
      } else {
        const k = K.ease.out((p - 0.5) * 2), lx = W * 0.5, ly = H * 0.5, R = Math.hypot(W, H) * k;
        const g = ctx.createRadialGradient(lx, ly, R * 0.35, lx, ly, Math.max(1, R)); g.addColorStop(0, 'rgba(0,3,6,0)'); g.addColorStop(1, 'rgba(0,3,6,1)');
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        const a = 1 - k, lg = ctx.createRadialGradient(lx, ly, 0, lx, ly, 120 * s); lg.addColorStop(0, `rgba(255,236,200,${a})`); lg.addColorStop(0.2, `rgba(255,170,70,${0.6 * a})`); lg.addColorStop(1, 'rgba(255,150,60,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(lx, ly, 120 * s, 0, 7); ctx.fill();
      }
      ctx.restore();
    },
  };

  // ---------- the shared demo: a descent through the midnight zone ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [C.magenta, C.cyan, C.amber, C.pale, C.blue, C.teal, C.cyan];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 110 * s], video: [90 * s, 262 * s, 250 * s, 140 * s], jelly: [640 * s, 380 * s, 160 * s, 150 * s],
      chips: PLATFORMS.map((n, i) => [960 * s, (186 + i * 64) * s]), jelly2: [W / 2, 196 * s, 150 * s, 140 * s], counter: [W / 2, 420 * s], views: 484 * s, take: 646 * s };
    return { s, P: true, title: [W / 2, H * 0.115], video: [W * 0.27, H * 0.155, W * 0.46, H * 0.1], jelly: [W / 2, H * 0.44, W * 0.32, H * 0.1],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.6 : W * 0.4, H * (0.6 + Math.floor(i / 2) * 0.075)]), jelly2: [W / 2, H * 0.26, W * 0.32, H * 0.1], counter: [W / 2, H * 0.47], views: H * 0.52, take: H * 0.72 };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        const [vx, vy, vw, vh] = Lo.video, [jx, jy, jrx, jry] = Lo.jelly;
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.1, 1.7, 'lin'), { size: P ? 58 : 64, align: 'center', t, maxW: W * 0.9 });
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.8, 'lin'), { t, color: C.blue });
        if (t > 2.4) { // play glyph glowing inside the comb jelly
          const a = K.beat(t, 2.4, 0.5, 'lin'), cx = vx + vw / 2, cy = vy + vh / 2, r = vh * 0.24;
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a; ctx.fillStyle = K.rgba(C.magenta, 0.5); ctx.shadowColor = C.magenta; ctx.shadowBlur = 18 * s;
          ctx.beginPath(); ctx.moveTo(cx - r * 0.6, cy - r); ctx.lineTo(cx + r, cy); ctx.lineTo(cx - r * 0.6, cy + r); ctx.closePath(); ctx.fill(); ctx.restore();
        }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 50 * s, K.beat(t, 2.7, 0.8, 'lin'), { align: 'center', color: C.pale, t, size: 36 });
        const a1 = P ? [[vx + vw / 2, vy + vh + 76 * s], [jx, jy - jry - 18 * s]] : [[vx + vw + 16 * s, vy + vh / 2], [jx - jrx - 18 * s, jy - jry * 0.35]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.4, 0.7, 'lin'), { bend: P ? 0.04 : -0.15, t, color: C.cyan });
        jellyfish(ctx, jx, jy, jrx, jry, K.beat(t, 4.0, 1.2, 'lin'), t, s);
        style.title(ctx, 'Creator OS', jx, jy - jry * 0.14, K.beat(t, 4.2, 0.9, 'lin'), { size: P ? 46 : 46, align: 'center', t, color: C.pale });
        if (P) style.arrow(ctx, [W / 2, jy + 110 * s], [W / 2, Lo.chips[6][1] + 2 * s], K.beat(t, 4.9, 0.6, 'lin'), { bend: 0, t, color: C.teal });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.36, [lx, ly] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, ly - 12 * s] : [jx + jrx * 0.55, jy + 30 * s];
          const to = P ? [left ? W * 0.42 : W * 0.58, ly - 12 * s] : [lx - 18 * s, ly - 11 * s];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.4, 'lin'), { bend: P ? 0 : (i - 3) * 0.04, t, color: COLS[i], gap: 13 });
          style.label(ctx, name, lx, ly, K.beat(t, t0 + 0.15, 0.45, 'lin'), { size: P ? 38 : 34, color: COLS[i], align: P ? (left ? 'right' : 'left') : 'left', t });
        });
      } else {
        const [jx, jy, jrx, jry] = Lo.jelly2;
        anglerfish(ctx, P ? W * 0.2 : W * 0.12, P ? H * 0.86 : H * 0.82, (P ? 0.9 : 0.75) * s, K.beat(t, 8.3, 0.8, 'lin'), t);
        jellyfish(ctx, jx, jy, jrx, jry, 1, t, s);
        style.title(ctx, 'Creator OS', jx, jy - jry * 0.14, 1, { size: 46, align: 'center', t, color: C.pale });
        const v = K.count(t, 8.6, 1.4, 0, 1000000);
        style.counter(ctx, v, Lo.counter[0], Lo.counter[1], K.beat(t, 8.45, 0.4, 'lin'), { size: P ? 100 : 118, t });
        style.label(ctx, 'views', W / 2, Lo.views, K.beat(t, 8.8, 0.7, 'lin'), { align: 'center', color: C.pale, t, size: 38 });
        style.emphasis(ctx, W / 2, Lo.counter[1] - 40 * s, (P ? 280 : 300) * s, K.beat(t, 10.0, 1.2, 'lin'), { tall: P ? 0.36 : 0.36 });
        style.title(ctx, 'Post once. Reach everywhere.', W / 2, Lo.take, K.beat(t, 10.4, 1.1, 'lin'), { size: P ? 56 : 58, align: 'center', t, color: C.cyan, maxW: W * 0.88 });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3), { t });
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('ocean', 0, 12, 1.2); k.bed('space', 0, 12, 0.8);
      k.play('swell', 0.1, { chord: ['D4', 'A4', 'E5'], dur: 2.2, gain: 0.9 }); k.play('riser', 0.1, { dur: 1.6, gain: 0.35 });
      k.play('pluck', 2.0, { note: 'A4', gain: 0.6 }); k.play('blip', 2.4, { note: 'E6', dur: 0.12, gain: 0.5 }); k.play('pluck', 2.9, { note: 'D5', gain: 0.5 });
      for (let i = 0; i < 6; i++) k.play('blip', 3.4 + i * 0.11, { note: ['A5', 'B5', 'D6', 'E6', 'F#6', 'A6'][i], dur: 0.06, gain: 0.35 });
      k.play('swell', 4.0, { chord: ['D3', 'A3', 'F#4'], dur: 1.6 }); k.play('pluck', 4.6, { note: 'F#5' });
      const notes = ['D5', 'E5', 'F#5', 'A5', 'B5', 'D6', 'E6'];
      for (let i = 0; i < 7; i++) { k.play('blip', 5.0 + i * 0.36, { note: notes[i], dur: 0.05, gain: 0.3 }); k.play('pluck', 5.37 + i * 0.36, { note: notes[i], gain: 0.7 }); }
      k.play('whoosh', 7.6, { dur: 0.65, up: false, gain: 0.9 }); k.play('thud', 8.2, { gain: 0.5 }); k.play('ding', 8.3, { gain: 0.6 });
      k.play('count', 8.6, { dur: 1.4 });
      k.play('chime', 10.0, { note: 'D6', gain: 1.1 }); k.play('riser', 9.6, { dur: 0.45, gain: 0.4 });
      k.play('swell', 10.4, { chord: ['D4', 'F#4', 'A4', 'E5'], dur: 1.6 }); k.play('chime', 11.4, { note: 'A5' });
    },
  };
  MS.register(style);
})();
