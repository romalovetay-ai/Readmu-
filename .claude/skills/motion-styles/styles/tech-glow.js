// Tech Glow Explainer (Popular Explainer Looks). The AI/tech YouTube motion-graphics look: navy-to-indigo space,
// drifting electric glows over a perspective floor grid, dark glass tiles with gradient-stroked line icons,
// connectors that trace on and then carry racing light pulses, gradient headline type and bloom on everything bright.
(function () {
  const C = { bg: '#070b24', navy: '#0b1238', indigo: '#1d1a63', cyan: '#3ee6ff', blue: '#4d7cff', violet: '#9b5cff', pink: '#ff5fd2', mint: '#3dffb5', text: '#e9eeff', dim: '#93a0c8' };
  const HEAD = 'Space Grotesk', BODY = 'Inter';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }
  function glow(ctx, x, y, r, col, a) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, K.rgba(col, a)); g.addColorStop(1, K.rgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function grad(ctx, x0, y0, x1, y1, a = C.cyan, b = C.violet) { const g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }

  // simple line icons, drawn on with p, centred at 0,0 in a unit of size u
  const ICONS = {
    play(ctx, u) { ctx.beginPath(); ctx.roundRect(-u, -u * 0.7, u * 2, u * 1.4, u * 0.25); ctx.moveTo(-u * 0.25, -u * 0.35); ctx.lineTo(u * 0.4, 0); ctx.lineTo(-u * 0.25, u * 0.35); ctx.closePath(); },
    core(ctx, u) { ctx.beginPath(); ctx.roundRect(-u * 0.6, -u * 0.6, u * 1.2, u * 1.2, u * 0.2); for (const k of [-0.3, 0, 0.3]) { ctx.moveTo(k * u * 2, -u * 0.6); ctx.lineTo(k * u * 2, -u); ctx.moveTo(k * u * 2, u * 0.6); ctx.lineTo(k * u * 2, u); ctx.moveTo(-u * 0.6, k * u * 2); ctx.lineTo(-u, k * u * 2); ctx.moveTo(u * 0.6, k * u * 2); ctx.lineTo(u, k * u * 2); } ctx.moveTo(u * 0.25, 0); ctx.arc(0, 0, u * 0.25, 0, TAU); },
  };

  const style = {
    id: 'tech-glow', name: 'Tech Glow Explainer', family: 'Popular Explainer Looks',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@500;600&display=block', specs: ['700 64px "Space Grotesk"', '500 30px "Space Grotesk"', '600 30px "Inter"'] }],
    palette: C,
    sfx: { draw: null, land: 'blip', emphasis: 'ding', transition: 'riser', bed: 'hum' },

    background(ctx, W, H, t) {
      const s = S(W, H);
      const base = K.cached(`tg-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d');
        const g = x.createLinearGradient(0, 0, W * 0.4, H); g.addColorStop(0, '#060a22'); g.addColorStop(0.55, '#0c1340'); g.addColorStop(1, '#1b1660');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        // perspective floor grid, faded into the horizon with an alpha mask
        const hz = H * 0.62, vx = W / 2, gl = K.layer(W, H), gx = gl.getContext('2d');
        gx.strokeStyle = 'rgba(130,160,255,0.22)'; gx.lineWidth = Math.max(1, s);
        for (let i = -16; i <= 16; i++) { gx.beginPath(); gx.moveTo(vx + i * W * 0.012, hz); gx.lineTo(vx + i * W * 0.16, H); gx.stroke(); }
        for (let k = 0; k < 10; k++) { const y = hz + (H - hz) * Math.pow(k / 9, 2.1); gx.beginPath(); gx.moveTo(0, y); gx.lineTo(W, y); gx.stroke(); }
        const m = gx.createLinearGradient(0, hz, 0, H); m.addColorStop(0, 'rgba(0,0,0,0)'); m.addColorStop(0.45, 'rgba(0,0,0,0.6)'); m.addColorStop(1, 'rgba(0,0,0,1)');
        gx.globalCompositeOperation = 'destination-in'; gx.fillStyle = m; gx.fillRect(0, 0, W, H);
        x.drawImage(gl, 0, 0);
        return c;
      });
      ctx.drawImage(base, 0, 0);
      // drifting electric glows
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      glow(ctx, W * (0.72 + 0.05 * Math.sin(t * 0.3)), H * (0.35 + 0.05 * Math.cos(t * 0.25)), Math.max(W, H) * 0.42, C.violet, 0.22);
      glow(ctx, W * (0.25 + 0.04 * Math.cos(t * 0.35)), H * 0.75, Math.max(W, H) * 0.35, C.blue, 0.16);
      // particles
      const r = K.rng(9);
      for (let i = 0; i < 60; i++) { const px = (r() * W + t * r.range(4, 14) * s) % W, py = (r() * H - t * r.range(2, 8) * s + H) % H, a = 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(t * 2 + i)); ctx.fillStyle = K.rgba(i % 3 ? C.cyan : C.violet, a * 0.6); ctx.beginPath(); ctx.arc(px, py, r.range(0.8, 2.2) * s, 0, TAU); ctx.fill(); }
      ctx.restore();
    },

    finish(ctx, W, H, t) {
      // bloom: re-add the frame blurred, screen-blended (cheap: downscale + upscale)
      const s = 0.18, bw = Math.max(1, (W * s) | 0), bh = Math.max(1, (H * s) | 0);
      const b = K.cached(`tg-bloom:${W}x${H}`, () => K.layer(bw, bh)), bx = b.getContext('2d');
      bx.clearRect(0, 0, bw, bh); bx.filter = 'blur(3px) brightness(0.9)'; bx.drawImage(ctx.canvas, 0, 0, bw, bh); bx.filter = 'none';
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = 0.55; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(b, 0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.5, '#02030f');
      K.grain(ctx, W, H, t, 0.035, 24, 'overlay');
    },

    // gradient headline rising word by word
    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 64) * s;
      ctx.save(); ctx.font = K.font(size, HEAD, 700); ctx.textBaseline = 'alphabetic';
      if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${-0.02 * size}px`;
      const words = text.split(' '), sp = size * 0.26, ws = words.map((w) => ctx.measureText(w).width), total = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
      let cx = o.align === 'center' ? x - total / 2 : o.align === 'right' ? x - total : x;
      const hiFrom = o.hiFrom ?? Math.ceil(words.length / 2);
      words.forEach((w, i) => {
        const wp = K.ease.out(K.clamp(p * words.length - i));
        if (wp > 0) {
          ctx.globalAlpha = wp; const dy = (1 - wp) * size * 0.5;
          ctx.fillStyle = i >= hiFrom ? grad(ctx, cx, 0, cx + ws[i], 0, C.cyan, C.violet) : (o.color || C.text);
          ctx.shadowColor = i >= hiFrom ? K.rgba(C.cyan, 0.6) : 'rgba(150,170,255,0.25)'; ctx.shadowBlur = 18 * s;
          ctx.fillText(w, cx, y + dy);
        }
        cx += ws[i] + sp;
      });
      ctx.restore(); return { w: total, h: size };
    },

    // dark glass pill with neon border, glowing status dot, Inter caption
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 30) * s, k = K.ease.back(K.clamp(p));
      ctx.save(); ctx.font = K.font(size, BODY, 600);
      const tw = ctx.measureText(text).width, ph = size * 1.55, pw = tw + size * 1.9;
      const x0 = o.align === 'center' ? x - pw / 2 : o.align === 'right' ? x - pw : x, col = o.color || C.cyan;
      ctx.globalAlpha = K.clamp(p * 2); ctx.translate(x0 + pw / 2, y); ctx.scale(k, k);
      rr(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2); ctx.fillStyle = 'rgba(12,18,52,0.85)'; ctx.fill();
      ctx.lineWidth = 1.6 * s; ctx.strokeStyle = K.rgba(col, 0.75); ctx.shadowColor = col; ctx.shadowBlur = 12 * s; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10 * s; ctx.beginPath(); ctx.arc(-pw / 2 + size * 0.75, 0, size * 0.17, 0, TAU); ctx.fill(); ctx.shadowBlur = 0;
      ctx.fillStyle = C.text; ctx.textBaseline = 'middle'; ctx.fillText(text, -pw / 2 + size * 1.2, size * 0.04);
      ctx.restore(); return { w: pw, h: ph };
    },

    // connector traces on, then light pulses race along it (o.t = scene time for the pulses)
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.arcPts(from, to, o.bend ?? 0.15, 50), col = o.color || C.cyan;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const end = K.drawOn(ctx, pts, K.clamp(p), { strokeStyle: K.rgba(col, 0.75), lineWidth: 2.4 * s, shadowColor: col, shadowBlur: 10 * s });
      if (p < 1 && end) { glow(ctx, end[0], end[1], 22 * s, col, 0.9); }
      if (p >= 1) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(to[0], to[1], 4.5 * s, 0, TAU); ctx.fill();
        const tt = o.t ?? 0;
        for (let k = 0; k < 2; k++) {
          const ph = ((tt * 0.7 + k * 0.5 + (o.seed || 0) * 0.13) % 1), q = K.trim(pts, ph), at = q[q.length - 1];
          glow(ctx, at[0], at[1], 16 * s, '#ffffff', 0.85); glow(ctx, at[0], at[1], 30 * s, col, 0.5);
        }
      }
      ctx.restore(); return end;
    },

    // dark card, thin neon gradient border, glass sheen, optional line icon
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.back(K.clamp(p)), r = o.radius ?? 22 * s;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-w / 2, -h / 2); ctx.globalAlpha = K.clamp(p * 2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; glow(ctx, w / 2, h / 2, Math.max(w, h) * 0.8, o.glow || C.blue, 0.28 * (o.glowAmt ?? 1)); ctx.restore();
      rr(ctx, 0, 0, w, h, r); const bg = ctx.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, 'rgba(26,34,90,0.92)'); bg.addColorStop(1, 'rgba(10,14,44,0.95)'); ctx.fillStyle = bg; ctx.fill();
      ctx.lineWidth = 2.2 * s; ctx.strokeStyle = grad(ctx, 0, 0, w, h, o.c1 || C.cyan, o.c2 || C.violet); ctx.shadowColor = o.c1 || C.cyan; ctx.shadowBlur = 16 * s; ctx.stroke(); ctx.shadowBlur = 0;
      ctx.save(); rr(ctx, 0, 0, w, h, r); ctx.clip(); const sh = ctx.createLinearGradient(0, 0, 0, h * 0.5); sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(1, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fillRect(0, 0, w, h * 0.5); ctx.restore();
      if (o.icon) {
        const ip = K.clamp((p - 0.35) / 0.65), u = Math.min(w, h) * 0.24;
        ctx.save(); ctx.translate(w / 2, h / 2); ICONS[o.icon](ctx, u);
        ctx.setLineDash([u * 12 * ip, u * 12]); ctx.lineWidth = 3.2 * s; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.strokeStyle = grad(ctx, -u, -u, u, u, o.c1 || C.cyan, o.c2 || C.violet); ctx.shadowColor = C.cyan; ctx.shadowBlur = 12 * s; ctx.stroke(); ctx.restore();
      }
      ctx.restore();
    },

    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 120) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, HEAD, 700); if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${-0.03 * size}px`;
      ctx.textAlign = o.align || 'center'; const w = ctx.measureText(txt).width;
      const x0 = ctx.textAlign === 'center' ? x - w / 2 : x;
      ctx.fillStyle = grad(ctx, x0, 0, x0 + w, 0, C.cyan, C.violet); ctx.shadowColor = K.rgba(C.cyan, 0.8); ctx.shadowBlur = 30 * s;
      ctx.fillText(txt, x, y); ctx.shadowBlur = 0; ctx.fillText(txt, x, y);
      ctx.restore();
    },

    // ring of light that ignites and expands + a small rising sparkline flare
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < 2; i++) {
        const kk = K.clamp(k - i * 0.2); if (kk <= 0) continue;
        ctx.globalAlpha = (1 - kk) * 0.9; ctx.strokeStyle = i ? C.violet : C.cyan; ctx.lineWidth = 5 * s; ctx.shadowColor = ctx.strokeStyle; ctx.shadowBlur = 20 * s;
        ctx.beginPath(); ctx.ellipse(x, y, r * (0.6 + kk * 0.6), r * (0.6 + kk * 0.6) * 0.5, 0, 0, TAU); ctx.stroke();
      }
      ctx.globalAlpha = Math.sin(Math.PI * K.clamp(p)); glow(ctx, x, y, r * 1.2, C.cyan, 0.35);
      ctx.restore();
    },

    // camera pushes through: light-speed streaks to a white-cyan flash at 0.5
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(W, H), r = K.rng(31), cx = W / 2, cy = H / 2, R = Math.hypot(W, H) / 2, e = Math.sin(Math.PI * p);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      for (let i = 0; i < 140; i++) {
        const a = r() * TAU, d0 = r() * R, sp = r.range(0.4, 1.4), d = (d0 + p * R * 2.4 * sp) % (R * 1.1), len = R * 0.35 * e * sp;
        ctx.strokeStyle = K.rgba(i % 3 ? C.cyan : C.violet, 0.75 * e); ctx.lineWidth = r.range(1, 3) * s;
        ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * d, cy + Math.sin(a) * d); ctx.lineTo(cx + Math.cos(a) * (d + len), cy + Math.sin(a) * (d + len)); ctx.stroke();
      }
      ctx.restore();
      const f = K.clamp(1 - Math.abs(p - 0.5) * 5);
      if (f > 0) { ctx.save(); ctx.fillStyle = `rgba(200,240,255,${f * 0.95})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [C.pink, C.cyan, '#ff5b6e', C.text, C.blue, C.violet, '#5b8cff'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 112 * s], video: [100 * s, 320 * s, 200 * s, 150 * s], node: [470 * s, 300 * s, 190 * s, 190 * s],
      chips: PLATFORMS.map((n, i) => [960 * s, (186 + i * 70) * s]), counter: [W / 2, 420 * s], take: [W / 2, 640 * s], top: [W / 2 - 60 * s, 130 * s, 120 * s, 120 * s] };
    return { s, P: true, title: [W / 2, H * 0.1], video: [W * 0.36, H * 0.155, W * 0.28, W * 0.21], node: [W * 0.33, H * 0.34, W * 0.34, W * 0.34],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.625 + Math.floor(i / 2) * 0.072)]), counter: [W / 2, H * 0.5], take: [W / 2, H * 0.76], top: [W * 0.4, H * 0.22, W * 0.2, W * 0.2] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      // slow camera push for the whole piece
      ctx.save(); const z = 1 + t * 0.004; ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      style.background(ctx, W, H, t);
      if (t < 8.3) {
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.2, 1.3, 'lin'), { size: P ? 46 : 62, align: 'center', hiFrom: 2 });
        const [vx, vy, vw, vh] = Lo.video, [nx, ny, nw, nh] = Lo.node;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.8, 'lin'), { icon: 'play', c1: C.pink, c2: C.violet, glow: C.pink });
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 40 * s, K.beat(t, 2.6, 0.4, 'lin'), { align: 'center', size: 28, color: C.pink });
        const a1 = P ? [[W / 2, vy + vh + 72 * s], [W / 2, ny - 8 * s]] : [[vx + vw + 6 * s, vy + vh / 2], [nx - 8 * s, ny + nh / 2]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.2, 0.8, 'inOut'), { bend: P ? 0 : -0.08, color: C.pink, t, seed: 1 });
        style.box(ctx, nx, ny, nw, nh, K.beat(t, 3.9, 0.8, 'lin'), { icon: 'core', radius: 34 * s, glowAmt: 1.6 });
        style.label(ctx, 'Creator OS', nx + nw / 2, ny + nh + 40 * s, K.beat(t, 4.5, 0.4, 'lin'), { align: 'center', size: 32 });
        if (P) { const yl = Lo.chips[6][1]; style.arrow(ctx, [W / 2, ny + nh + 76 * s], [W / 2, yl], K.beat(t, 4.9, 0.6, 'inOut'), { bend: 0, t, seed: 2 }); }
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy] : [nx + nw + 6 * s, ny + nh / 2], to = P ? [left ? W * 0.45 : W * 0.55, cy] : [cx - 8 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'inOut'), { bend: P ? 0 : (i - 3) * 0.05, color: COLS[i], t, seed: i + 3 });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.beat(t, t0 + 0.3, 0.3, 'lin'), { size: P ? 28 : 30, color: COLS[i], align: P ? (left ? 'right' : 'left') : 'left' });
        });
      } else {
        const [tx, ty, tw, th] = Lo.top;
        style.box(ctx, tx, ty - th / 2, tw, th, 1, { icon: 'core', radius: 26 * s });
        const cw = (P ? 0.84 * W : 720 * s), chh = (P ? 0.17 * H : 200 * s), [cx, cy] = Lo.counter;
        style.box(ctx, cx - cw / 2, cy - chh * 0.68, cw, chh, K.beat(t, 8.4, 0.5, 'lin'), { radius: 24 * s, glow: C.violet });
        ctx.save(); ctx.font = K.font(28 * s, BODY, 600); ctx.fillStyle = C.dim; ctx.textAlign = 'left';
        if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${4 * s}px`; ctx.globalAlpha = K.beat(t, 8.6, 0.4);
        ctx.fillText('VIEWS', cx - cw / 2 + 34 * s, cy - chh * 0.68 + 46 * s); ctx.restore();
        const v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy + chh * 0.2, 1, { size: P ? 88 : 116 });
        style.emphasis(ctx, cx, cy - chh * 0.1, cw * 0.55, K.beat(t, 10.0, 0.9, 'lin'));
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: P ? 44 : 58, align: 'center', hiFrom: 2 });
      }
      ctx.restore();
      if (t > 7.7 && t < 9.0) style.transition(ctx, W, H, K.clamp((t - 7.7) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 0.8);
      k.play('swell', 0, { dur: 2, chord: ['A3', 'E4', 'B4'] });
      [0.2, 0.52, 0.85, 1.17].forEach((x, i) => k.play('blip', x, { note: ['E5', 'G5', 'B5', 'E6'][i], gain: 0.6 }));
      k.play('pop', 2.1); k.play('whoosh', 3.2, { dur: 0.8 }); k.play('pop', 4.0, { pitch: 0.8 }); k.play('blip', 4.6, { note: 'B5' });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.3, gain: 0.5 }); k.play('blip', 5.32 + i * 0.4, { note: ['C6', 'D6', 'E6', 'G6', 'A6', 'C7', 'D7'][i], gain: 0.7 }); }
      k.play('riser', 7.5, { dur: 0.9 }); k.play('thud', 8.35);
      k.play('count', 8.6, { dur: 1.5 }); k.play('ding', 10.0);
      k.play('whoosh', 10.5, { dur: 0.6, gain: 0.5 }); k.play('chime', 11.3, { note: 'E6' });
    },
  };
  MS.register(style);
})();
