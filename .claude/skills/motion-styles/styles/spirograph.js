// Guilloché Security Print (Generative & Type). Banknote lathe work: hairline sine-ring meshes and hypotrochoid
// rosettes drawn pen pass by pen pass in split-fountain iris inks (green to copper to violet) on fibred security
// paper with a wavy underprint and rope border; engraved serif lettering with microtext, red numbering-machine
// serials and counters, rubber cancellation stamps, and a light glint across the note.
(function () {
  const C = { paperA: '#e6ede0', paperB: '#f2e6d8', green: '#2f6f5c', copper: '#c27a45', violet: '#5f55a3', ink: '#1f2b28', red: '#c3262a', stamp: '#6b3fa0' };
  const HEAD = 'Cinzel', MONO = 'IBM Plex Mono', SERIF = 'Cormorant Garamond';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  function iris(ctx, x0, y0, x1, y1) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, C.green); g.addColorStop(0.5, C.copper); g.addColorStop(1, C.violet); return g; }
  // woven sine-ring band: M passes of r(θ) = R0 + A sin(nθ + phase); `passes` may be fractional (last pass draws on)
  function band(ctx, cx, cy, R0, A, n, M, passes, rot, s, o = {}) {
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.strokeStyle = o.ink || iris(ctx, -R0 - A, -R0, R0 + A, R0); ctx.lineWidth = (o.lw || 0.9) * s; ctx.globalAlpha = o.alpha ?? 0.9;
    const seg = Math.max(180, n * 14), full = Math.floor(passes);
    for (let k = 0; k < Math.min(M, Math.ceil(passes)); k++) {
      const ph = (k / M) * TAU * (o.twist || 1) + (o.ph0 || 0), frac = k < full ? 1 : passes - full, N = Math.floor(seg * frac);
      ctx.beginPath();
      for (let i = 0; i <= N; i++) { const a = (i / seg) * TAU, r = R0 + A * Math.sin(n * a + ph) + (o.A2 || 0) * Math.sin((o.n2 || n * 2) * a - ph); const x = Math.cos(a) * r, y = Math.sin(a) * r * (o.ry || 1); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
      ctx.stroke();
    }
    ctx.restore();
  }
  // hypotrochoid rosette, drawn on by p
  function hypo(ctx, cx, cy, R, r, d, sc, p, rot, s, o = {}) {
    const turns = r / gcd(R, r), seg = 900 * turns / 3, N = Math.floor(seg * K.clamp(p));
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(rot); ctx.strokeStyle = o.ink || iris(ctx, -sc, -sc, sc, sc); ctx.lineWidth = (o.lw || 0.8) * s; ctx.globalAlpha = 0.9; ctx.beginPath();
    for (let i = 0; i <= N; i++) { const t = (i / seg) * TAU * turns, x = (R - r) * Math.cos(t) + d * Math.cos(((R - r) / r) * t), y = (R - r) * Math.sin(t) - d * Math.sin(((R - r) / r) * t), k = sc / (R - r + d); i ? ctx.lineTo(x * k, y * k) : ctx.moveTo(x * k, y * k); }
    ctx.stroke(); ctx.restore();
  }
  function gcd(a, b) { return b ? gcd(b, a % b) : a; }
  function micro(ctx, text, x0, y, w, s, col = C.ink) { ctx.save(); ctx.font = K.font(6.5 * s, MONO, 600); ctx.fillStyle = K.rgba(col, 0.7); let t = ''; while (ctx.measureText(t).width < w) t += text + ' '; ctx.beginPath(); ctx.rect(x0, y - 8 * s, w, 12 * s); ctx.clip(); ctx.fillText(t, x0, y); ctx.restore(); }

  const style = {
    id: 'spirograph', name: 'Guilloché Security Print', family: 'Generative & Type',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Cinzel:wght@600;700;800&family=IBM+Plex+Mono:wght@600&family=Cormorant+Garamond:ital,wght@1,600&display=block', specs: ['700 56px "Cinzel"', '600 28px "Cinzel"', '600 40px "IBM Plex Mono"', 'italic 600 24px "Cormorant Garamond"'] }],
    palette: C,
    sfx: { draw: 'pen', land: 'click', emphasis: 'stamp', transition: 'paper', bed: 'room' },
    band, hypo,

    // fibred security paper + wavy underprint + rope border, all cached
    background(ctx, W, H, t, o = {}) {
      const s = S(W, H);
      const note = K.cached(`sp-note:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), r = K.rng(1000);
        const g = x.createLinearGradient(0, 0, W, H); g.addColorStop(0, C.paperA); g.addColorStop(1, C.paperB); x.fillStyle = g; x.fillRect(0, 0, W, H);
        x.globalCompositeOperation = 'multiply'; x.globalAlpha = 0.5; x.drawImage(K.paperTex(W, H, '#ffffff', 3, 0.06, false), 0, 0); x.globalAlpha = 1; x.globalCompositeOperation = 'source-over';
        // security fibres
        for (let i = 0; i < 260; i++) { const a = r() * W, b = r() * H, l = r.range(4, 12) * s, an = r() * TAU; x.strokeStyle = r() < 0.5 ? 'rgba(200,40,50,0.45)' : 'rgba(40,80,190,0.4)'; x.lineWidth = 0.7 * s; x.beginPath(); x.moveTo(a, b); x.quadraticCurveTo(a + Math.cos(an + 1) * l, b + Math.sin(an + 1) * l, a + Math.cos(an) * l * 1.4, b + Math.sin(an) * l * 1.4); x.stroke(); }
        // underprint: fine wave field
        x.lineWidth = 0.6 * s;
        for (let k = 0; k < 90; k++) { const y0 = (k / 90) * H; x.strokeStyle = k % 2 ? 'rgba(47,111,92,0.16)' : 'rgba(95,85,163,0.13)'; x.beginPath(); for (let i = 0; i <= 160; i++) { const xx = (i / 160) * W, yy = y0 + Math.sin(xx / W * TAU * 3 + k * 0.35) * 9 * s + Math.sin(xx / W * TAU * 11 + k) * 2 * s; i ? x.lineTo(xx, yy) : x.moveTo(xx, yy); } x.stroke(); }
        // rope border: two interleaved sine strands between double rules
        const m = 18 * s, bw = 22 * s;
        x.strokeStyle = 'rgba(31,43,40,0.55)'; x.lineWidth = 1 * s; x.strokeRect(m, m, W - m * 2, H - m * 2); x.strokeRect(m + bw, m + bw, W - (m + bw) * 2, H - (m + bw) * 2);
        const rope = (x0, y0, x1, y1) => { const L = Math.hypot(x1 - x0, y1 - y0), ux = (x1 - x0) / L, uy = (y1 - y0) / L, n = Math.floor(L / (7 * s)); for (let ph = 0; ph < 4; ph++) { x.strokeStyle = ph % 2 ? 'rgba(47,111,92,0.55)' : 'rgba(194,122,69,0.5)'; x.beginPath(); for (let i = 0; i <= n * 4; i++) { const tt = i / (n * 4), px = x0 + ux * L * tt, py = y0 + uy * L * tt, off = Math.sin(tt * n * Math.PI + ph * Math.PI / 2) * bw * 0.42; i ? x.lineTo(px - uy * off, py + ux * off) : x.moveTo(px - uy * off, py + ux * off); } x.stroke(); } };
        const c0 = m + bw / 2; rope(c0, c0, W - c0, c0); rope(W - c0, c0, W - c0, H - c0); rope(W - c0, H - c0, c0, H - c0); rope(c0, H - c0, c0, c0);
        return c;
      });
      ctx.drawImage(note, 0, 0);
    },
    // ink spread + paper grain + a light glint crossing the note (o.glint 0..1)
    finish(ctx, W, H, t, o = {}) {
      if (o.glint > 0 && o.glint < 1) { const x = K.lerp(-W * 0.3, W * 1.3, o.glint), g = ctx.createLinearGradient(x - W * 0.15, 0, x + W * 0.15, H * 0.3); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,250,0.45)'); g.addColorStop(1, 'rgba(255,255,255,0)'); ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore(); }
      K.vignette(ctx, W, H, 0.18, '#3a3020');
      K.grain(ctx, W, H, t, 0.035, 12, 'overlay');
    },

    // engraved serif wiped in left to right, with a microtext rule beneath
    title(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = K.fitSize(ctx, text, HEAD, 800, (o.size || 54) * s, ctx.canvas.width * 0.8);
      ctx.save(); ctx.font = K.font(size, HEAD, 800); if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${size * 0.04}px`;
      const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, e = K.ease.inOut(K.clamp(p));
      ctx.save(); ctx.beginPath(); ctx.rect(x0 - 10 * s, y - size * 1.1, (w + 20 * s) * e, size * 1.5); ctx.clip();
      // engraving: fine horizontal line screen inside the glyphs
      ctx.fillStyle = o.color || C.ink; ctx.fillText(text, x0, y);
      ctx.globalCompositeOperation = 'destination-out'; ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let yy = y - size; yy < y + 4 * s; yy += 3 * s) ctx.fillRect(x0, yy, w, 0.9 * s);
      ctx.restore();
      if (o.rule !== false) { const ry = y + size * 0.35; ctx.strokeStyle = K.rgba(C.ink, 0.6); ctx.lineWidth = 0.8 * s; ctx.beginPath(); ctx.moveTo(x0, ry); ctx.lineTo(x0 + w * e, ry); ctx.moveTo(x0, ry + 12 * s); ctx.lineTo(x0 + w * e, ry + 12 * s); ctx.stroke(); micro(ctx, o.micro || 'CREATOR OS DISTRIBUTION RESERVE', x0, ry + 9 * s, w * e, s); }
      ctx.restore(); return { w, h: size };
    },
    // engraved caption in a double-rule cartouche
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 28) * s, e = K.ease.out(K.clamp(p));
      ctx.save(); ctx.font = K.font(size, HEAD, 700); if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${size * 0.05}px`;
      const tw = ctx.measureText(text).width, w = tw + size * 1.2, h = size * 1.7, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
      ctx.globalAlpha = e;
      ctx.fillStyle = 'rgba(248,244,232,0.88)'; ctx.beginPath(); ctx.roundRect(x0, y - h / 2, w, h, h / 2); ctx.fill();
      ctx.strokeStyle = o.color || C.green; ctx.lineWidth = 1.4 * s; ctx.stroke(); ctx.lineWidth = 0.7 * s; ctx.beginPath(); ctx.roundRect(x0 + 4 * s, y - h / 2 + 4 * s, w - 8 * s, h - 8 * s, h / 2); ctx.stroke();
      ctx.fillStyle = C.ink; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + size * 0.6, y + size * 0.06);
      ctx.restore(); return { w, h };
    },
    // engraved double-rule arrow with a hatched head
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.ease.inOut(K.clamp(p)), dx = to[0] - from[0], dy = to[1] - from[1], L = Math.hypot(dx, dy), len = L * e, hl = 16 * s, g = 3.2 * s;
      ctx.save(); ctx.translate(from[0], from[1]); ctx.rotate(Math.atan2(dy, dx)); ctx.strokeStyle = o.color || C.ink; ctx.lineWidth = 1 * s;
      ctx.beginPath(); ctx.moveTo(0, -g); ctx.lineTo(Math.max(0, len - hl * 0.7), -g); ctx.moveTo(0, g); ctx.lineTo(Math.max(0, len - hl * 0.7), g); ctx.stroke();
      if (e > 0.3) { ctx.beginPath(); ctx.moveTo(len, 0); ctx.lineTo(len - hl, -hl * 0.55); ctx.lineTo(len - hl, hl * 0.55); ctx.closePath(); ctx.stroke(); for (let k = 2; k < hl; k += 2.4 * s) { const hh = hl * 0.55 * (1 - k / hl); ctx.beginPath(); ctx.moveTo(len - k, -hh); ctx.lineTo(len - k, hh); ctx.stroke(); } }
      ctx.restore(); return [from[0] + dx * e, from[1] + dy * e];
    },
    // note panel: double hairline frame filled with a faint mesh
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.ease.inOut(K.clamp(p));
      ctx.save(); ctx.fillStyle = 'rgba(250,246,236,0.9)'; ctx.globalAlpha = e; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1;
      K.drawOn(ctx, K.rectPts(x, y, w, h), e, { strokeStyle: C.ink, lineWidth: 1.4 * s, lineCap: 'butt' });
      K.drawOn(ctx, K.rectPts(x + 5 * s, y + 5 * s, w - 10 * s, h - 10 * s), e, { strokeStyle: K.rgba(C.green, 0.8), lineWidth: 0.8 * s, lineCap: 'butt' });
      ctx.beginPath(); ctx.rect(x + 8 * s, y + 8 * s, w - 16 * s, h - 16 * s); ctx.clip();
      ctx.lineWidth = 0.6 * s; ctx.globalAlpha = 0.5 * e;
      for (let k = 0; k < 14; k++) { ctx.strokeStyle = k % 2 ? C.violet : C.green; ctx.beginPath(); for (let i = 0; i <= 60; i++) { const xx = x + (i / 60) * w, yy = y + (k / 13) * h + Math.sin(i / 60 * TAU * 2 + k * 0.7) * 6 * s; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); } ctx.stroke(); }
      ctx.restore();
    },
    // red numbering-machine figures
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = K.fitSize(ctx, K.fmt(1000000), MONO, 600, (o.size || 100) * s, ctx.canvas.width * 0.8), txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, MONO, 600); ctx.textAlign = 'center'; if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${size * 0.04}px`;
      ctx.fillStyle = K.rgba(C.red, 0.25); ctx.fillText(txt, x + 1.5 * s, y + 1.5 * s); ctx.fillStyle = C.red; ctx.shadowColor = K.rgba(C.red, 0.4); ctx.shadowBlur = 2 * s; ctx.fillText(txt, x, y);
      ctx.restore();
    },
    // rubber cancellation stamp slammed on at an angle, with uneven ink
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = K.clamp(p * 4), k = 1 + (1 - K.ease.out(e)) * 0.6, text = o.text || 'VERIFIED';
      ctx.save(); ctx.translate(x, y); ctx.rotate(o.rot ?? -0.18); ctx.scale(k, k); ctx.globalAlpha = 0.85 * e;
      const size = (o.size || 46) * s; ctx.font = K.font(size, HEAD, 800); const tw = ctx.measureText(text).width, w = tw + size * 0.9, h = size * 1.6;
      const L = K.cached(`sp-stamp:${w | 0}x${h | 0}:${text}`, () => {
        const c = K.layer(w + 10, h + 10), x2 = c.getContext('2d'), rr = K.rng(9); x2.translate(5, 5);
        x2.strokeStyle = o.color || C.stamp; x2.lineWidth = 4 * s; x2.beginPath(); x2.roundRect(0, 0, w, h, 10 * s); x2.stroke(); x2.lineWidth = 1.5 * s; x2.beginPath(); x2.roundRect(6 * s, 6 * s, w - 12 * s, h - 12 * s, 6 * s); x2.stroke();
        x2.font = K.font(size, HEAD, 800); x2.fillStyle = o.color || C.stamp; x2.textBaseline = 'middle'; x2.fillText(text, size * 0.45, h / 2 + size * 0.05);
        x2.globalCompositeOperation = 'destination-out'; for (let i = 0; i < 260; i++) { x2.fillStyle = `rgba(0,0,0,${rr.range(0.3, 1)})`; x2.beginPath(); x2.arc(rr() * w, rr() * h, rr.range(0.5, 2.5) * s, 0, TAU); x2.fill(); }
        return c;
      });
      ctx.drawImage(L, -w / 2 - 5, -h / 2 - 5);
      ctx.restore();
    },
    // the camera pans to the next note on the sheet: a second note slides across (0.5 = covered)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), x = K.lerp(W * 1.02, -W * 1.02, K.ease.inOut(p));
      const note = K.cached(`sp-note:${W}x${H}`, () => null);
      ctx.save(); ctx.shadowColor = 'rgba(40,30,20,0.45)'; ctx.shadowBlur = 30 * s; ctx.translate(x, 0);
      if (note) ctx.drawImage(note, 0, 0); ctx.restore();
      // perforation gutter between notes
      ctx.save(); ctx.fillStyle = 'rgba(31,43,40,0.5)'; for (let yy = 10 * s; yy < H; yy += 14 * s) { ctx.beginPath(); ctx.arc(x + W + 1, yy, 2 * s, 0, TAU); ctx.arc(x - 1, yy, 2 * s, 0, TAU); ctx.fill(); } ctx.restore();
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 118 * s], video: [90 * s, 300 * s, 210 * s, 140 * s], node: [600 * s, 400 * s, 160 * s],
      chips: PLATFORMS.map((n, i) => [930 * s, (200 + i * 66) * s]), counter: [W / 2, 420 * s], take: [W / 2, 630 * s], serial: [W - 70 * s, 76 * s] };
    return { s, P: true, title: [W / 2, H * 0.085], video: [W * 0.3, H * 0.115, W * 0.4, H * 0.075], node: [W / 2, H * 0.41, W * 0.27],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.65 + Math.floor(i / 2) * 0.068)]), counter: [W / 2, H * 0.55], take: [W / 2, H * 0.79], serial: [W - 60 * s, H * 0.035] };
  }
  function rosette(ctx, cx, cy, R, p, t, s, reg = 1) {
    // passes start out of register (offset) and are brought into register by `reg`
    const off = (1 - reg) * R * 0.05, rot = t * 0.05;
    band(ctx, cx + off, cy, R * 0.8, R * 0.17, 14, 10, K.clamp(p * 1.4) * 10, rot, s);
    band(ctx, cx - off, cy + off, R * 0.52, R * 0.1, 10, 8, K.clamp(p * 1.4 - 0.2) * 8, -rot * 1.3, s, { ink: iris(ctx, cx - R, cy, cx + R, cy) });
    hypo(ctx, cx, cy + off, 7, 4, 3.4, R * 0.46, K.clamp(p * 1.3 - 0.35), rot * 0.6, s);
    if (p > 0.6) { const k = K.clamp((p - 0.6) / 0.4); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = 'rgba(248,244,232,0.95)'; ctx.beginPath(); ctx.arc(cx, cy, R * 0.22, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1.2 * s; ctx.stroke(); ctx.beginPath(); ctx.arc(cx, cy, R * 0.2, 0, TAU); ctx.lineWidth = 0.6 * s; ctx.stroke();
      ctx.font = K.font(R * 0.075, HEAD, 800); ctx.fillStyle = C.ink; ctx.textAlign = 'center'; ctx.fillText('CREATOR', cx, cy - R * 0.005); ctx.fillText('OS', cx, cy + R * 0.085); ctx.restore(); }
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      // red serial stamped digit by digit
      const serial = 'CO 0428 2026 B', sn = Math.floor(K.clamp((t - 0.3) / 1.2) * serial.length);
      ctx.save(); ctx.font = K.font(22 * s, MONO, 600); ctx.fillStyle = C.red; ctx.textAlign = 'right'; ctx.fillText(serial.slice(0, sn).padEnd(serial.length, ' '), Lo.serial[0], Lo.serial[1]); ctx.restore();
      if (t < 8.25) {
        const [vx, vy, vw, vh] = Lo.video, [nx, ny, nr] = Lo.node;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.6, 'lin'));
        if (t > 2.4) { const k = K.clamp((t - 2.4) / 0.4); band(ctx, vx + vw / 2, vy + vh / 2, vh * 0.3, vh * 0.04, 10, 6, k * 6, 0, s); ctx.save(); ctx.globalAlpha = k; ctx.fillStyle = C.red; ctx.beginPath(); ctx.moveTo(vx + vw / 2 - 10 * s, vy + vh / 2 - 15 * s); ctx.lineTo(vx + vw / 2 + 16 * s, vy + vh / 2); ctx.lineTo(vx + vw / 2 - 10 * s, vy + vh / 2 + 15 * s); ctx.fill(); ctx.restore(); }
        style.label(ctx, 'Your Video', vx + vw / 2, vy + vh + 40 * s, K.beat(t, 2.7, 0.4), { align: 'center' });
        const a1 = P ? [[W / 2, vy + vh + 78 * s], [nx, ny - nr - 10 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [nx - nr - 14 * s, ny - 30 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.6));
        rosette(ctx, nx, ny, nr, K.beat(t, 3.8, 1.5, 'lin'), t, s, K.beat(t, 5.0, 1.5));
        style.label(ctx, 'Creator OS', nx, ny + nr + 34 * s, K.beat(t, 4.9, 0.4), { align: 'center', size: 32, color: C.red });
        if (P) style.arrow(ctx, [W / 2, ny + nr + 72 * s], [W / 2, Lo.chips[6][1] + 2 * s], K.beat(t, 5.0, 0.5));
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const a = -0.8 + (i / 6) * 1.6, from = P ? [W / 2, cy] : [nx + Math.cos(a) * nr * 1.0, ny + Math.sin(a) * nr * 1.0], to = P ? [left ? W * 0.455 : W * 0.545, cy] : [cx - 10 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35));
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.3, 0.3), { align: P ? (left ? 'right' : 'left') : 'left', color: i % 2 ? C.violet : C.green });
        });
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.4, 1.3, 'lin'), { size: P ? 52 : 52, align: 'center' });
      } else {
        const [cx, cy] = Lo.counter;
        // the counter sits in an oval guilloché cartouche; the rosette shrinks to the corner seal
        const ow = (P ? 0.42 * W : 330 * s), oh = (P ? 0.09 * H : 120 * s);
        band(ctx, cx, cy - 34 * s, ow, ow * 0.08, 24, 10, 10, 0, s, { ry: oh / ow, ph0: t * 0.25 });
        band(ctx, cx, cy - 34 * s, ow * 0.86, ow * 0.05, 18, 8, 8, 0, s, { ph0: -t * 0.3, ry: oh / ow * 0.95, ink: iris(ctx, cx - ow, cy, cx + ow, cy) });
        ctx.save(); ctx.fillStyle = 'rgba(248,244,232,0.92)'; ctx.beginPath(); ctx.ellipse(cx, cy - 34 * s, ow * 0.74, oh * 0.66, 0, 0, TAU); ctx.fill(); ctx.strokeStyle = C.ink; ctx.lineWidth = 1 * s; ctx.stroke(); ctx.restore();
        const v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy, 1, { size: P ? 80 : 70 });
        style.label(ctx, 'Views Issued', cx, cy + (P ? 170 : 110) * s, K.beat(t, 8.8, 0.4), { align: 'center' });
        const sx = P ? W / 2 : 190 * s, sy = P ? H * 0.25 : 210 * s, sr = P ? W * 0.17 : 105 * s;
        rosette(ctx, sx, sy, sr, 1, t, s, 1);
        style.emphasis(ctx, cx + (P ? W * 0.2 : 240 * s), cy - (P ? 160 : 140) * s, 0, K.beat(t, 10.0, 0.6, 'lin'), { size: P ? 40 : 44 });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: P ? 48 : 46, align: 'center' });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t, { glint: K.clamp((t - 10.9) / 1.0) });
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      k.play('scribble', 0.4, { medium: 'pen', dur: 1.3, gain: 0.6 });
      for (let i = 0; i < 14; i++) k.play('click', 0.3 + i * (1.2 / 14), { pitch: 0.9, gain: 0.8 });
      k.play('scribble', 2.0, { medium: 'pen', dur: 0.8, gain: 0.6 }); k.play('tick', 2.8);
      k.play('scribble', 3.3, { medium: 'pen', dur: 0.6, gain: 0.5 });
      k.play('scribble', 3.8, { medium: 'pen', dur: 1.5, gain: 0.8 }); k.play('pluck', 4.9, { note: 'D5' });
      for (let i = 0; i < 7; i++) { k.play('scribble', 5.0 + i * 0.4, { medium: 'pen', dur: 0.3, gain: 0.4 }); k.play('click', 5.32 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('paper', 7.6, { dur: 1.2 }); k.play('whoosh', 7.7, { dur: 1.0, gain: 0.5 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('stamp', 10.0); k.play('thud', 10.02, { gain: 0.5 });
      k.play('scribble', 10.5, { medium: 'pen', dur: 0.9, gain: 0.5 }); k.play('chime', 11.2, { note: 'A5' });
    },
  };
  MS.register(style);
})();
