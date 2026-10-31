// Product Launch Reveal (Popular Explainer Looks). Big-tech keynote product film: one glossy hero device on a
// near-black stage, soft key pool, rim light, a specular highlight gliding over the glass, an edge-lit ring,
// floor reflection, huge tight-tracked sans headlines, gradient key numbers with bloom and hairline spec callouts.
(function () {
  const C = { bg: '#050507', stage: '#121318', text: '#f4f5f7', dim: '#8a8d96', violet: '#a46bff', pink: '#ff5fa8', orange: '#ff9a3c', hair: '#c9ccd3', cyan: '#5fe3ff' };
  const HEAD = 'Inter Tight', BODY = 'Inter';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  function rr(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, Math.min(r, w / 2, h / 2)); }
  function grad3(ctx, x0, x1, y = 0) { const g = ctx.createLinearGradient(x0, y, x1, y); g.addColorStop(0, C.violet); g.addColorStop(0.5, C.pink); g.addColorStop(1, C.orange); return g; }
  function track(ctx, px) { if (ctx.letterSpacing !== undefined) ctx.letterSpacing = `${px}px`; }

  // The hero: a glass-topped slab seen from a three-quarter view. o.light 0..1 key light, o.ring 0..1 edge ring,
  // o.sheen 0..1 position of the gliding specular band, o.yaw small orbit angle, o.refl draws the floor reflection.
  function device(ctx, cx, cy, w, t, o = {}) {
    const s = S(ctx.canvas.width, ctx.canvas.height), light = o.light ?? 1, ring = o.ring ?? 1, yaw = o.yaw ?? -0.18, th = w * 0.07;
    const face = (c2) => { c2.beginPath(); c2.roundRect(-w / 2, -w / 2, w, w, w * 0.12); };
    const place = (c2, dy, flip) => { c2.translate(cx, cy + dy); c2.scale(1, flip ? -0.42 : 0.42); c2.rotate(Math.PI / 4 + yaw); };
    const body = (c2, flip) => {
      // extruded metal side
      for (let i = 10; i >= 1; i--) { c2.save(); place(c2, (th * i) / 10 * (flip ? -1 : 1), flip); face(c2); const k = i / 10; c2.fillStyle = `rgb(${(40 + 50 * (1 - k)) * light + 12 | 0},${(42 + 52 * (1 - k)) * light + 12 | 0},${(48 + 58 * (1 - k)) * light + 14 | 0})`; c2.fill(); c2.restore(); }
      // top glass
      c2.save(); place(c2, 0, flip); face(c2);
      const g = c2.createLinearGradient(-w / 2, -w / 2, w / 2, w / 2); g.addColorStop(0, `rgba(${40 * light + 10 | 0},${42 * light + 10 | 0},${50 * light + 12 | 0},1)`); g.addColorStop(1, '#07070a');
      c2.fillStyle = g; c2.fill();
      // rim light on the back edge
      c2.strokeStyle = `rgba(230,235,255,${0.25 + 0.55 * light})`; c2.lineWidth = 2.2 * s; c2.stroke();
      // edge-lit inner ring
      if (ring > 0) {
        const iw = w * 0.74; c2.beginPath(); c2.roundRect(-iw / 2, -iw / 2, iw, iw, w * 0.08);
        const rg = c2.createLinearGradient(-iw / 2, 0, iw / 2, 0); rg.addColorStop(0, C.violet); rg.addColorStop(0.5, C.pink); rg.addColorStop(1, C.orange);
        c2.setLineDash([iw * 4 * ring, iw * 4]); c2.strokeStyle = rg; c2.lineWidth = 3.2 * s; c2.shadowColor = C.pink; c2.shadowBlur = 18 * s * ring; c2.stroke(); c2.setLineDash([]); c2.shadowBlur = 0;
        // neural core: lit nodes + hairlines inside the ring
        const r = K.rng(12), pts = Array.from({ length: 11 }, () => [r.range(-0.3, 0.3) * w, r.range(-0.3, 0.3) * w]);
        c2.strokeStyle = `rgba(200,210,255,${0.22 * ring})`; c2.lineWidth = 1 * s;
        for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) if ((i * 7 + j) % 3 === 0) { c2.beginPath(); c2.moveTo(pts[i][0], pts[i][1]); c2.lineTo(pts[j][0], pts[j][1]); c2.stroke(); }
        pts.forEach(([a, b], i) => { const on = 0.5 + 0.5 * Math.sin(t * 2.4 + i * 1.7); c2.fillStyle = i % 3 ? `rgba(220,230,255,${ring * 0.8})` : K.rgba(C.cyan, ring); c2.shadowColor = C.cyan; c2.shadowBlur = 10 * s * on; c2.beginPath(); c2.arc(a, b, (i % 3 ? 2.5 : 4) * s, 0, TAU); c2.fill(); });
        c2.shadowBlur = 0;
      }
      // sweeping specular band across the glass
      if (o.sheen != null) { face(c2); c2.clip(); const sx = K.lerp(-w * 1.2, w * 1.2, o.sheen); const sg = c2.createLinearGradient(sx - w * 0.25, 0, sx + w * 0.25, 0); sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,255,255,0.22)'); sg.addColorStop(1, 'rgba(255,255,255,0)'); c2.fillStyle = sg; c2.fillRect(-w, -w, w * 2, w * 2); }
      c2.restore();
    };
    // floor reflection: drawn flipped, faded with a gradient mask on an offscreen layer
    if (o.refl !== false) {
      const W = ctx.canvas.width, H = ctx.canvas.height, L = K.cached(`pl-refl:${W}x${H}`, () => K.layer(W, H)), lx = L.getContext('2d');
      lx.setTransform(1, 0, 0, 1, 0, 0); lx.clearRect(0, 0, W, H);
      lx.save(); lx.translate(0, (cy + th) * 2 + w * 0.02); lx.scale(1, -1); body(lx, false); lx.restore();
      const m = lx.createLinearGradient(0, cy + th, 0, cy + th + w * 0.45); m.addColorStop(0, 'rgba(0,0,0,0.28)'); m.addColorStop(1, 'rgba(0,0,0,0)');
      lx.globalCompositeOperation = 'destination-in'; lx.fillStyle = m; lx.fillRect(0, 0, W, H); lx.globalCompositeOperation = 'source-over';
      ctx.drawImage(L, 0, 0);
    }
    // contact shadow
    ctx.save(); ctx.translate(cx, cy + th * 1.2); ctx.scale(1, 0.25); const sh = ctx.createRadialGradient(0, 0, 0, 0, 0, w * 0.75); sh.addColorStop(0, 'rgba(0,0,0,0.75)'); sh.addColorStop(1, 'rgba(0,0,0,0)'); ctx.fillStyle = sh; ctx.fillRect(-w, -w, w * 2, w * 2); ctx.restore();
    body(ctx, false);
  }

  const style = {
    id: 'product-launch', name: 'Product Launch Reveal', family: 'Popular Explainer Looks',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Inter+Tight:wght@600;800&family=Inter:wght@400;500;600&display=block', specs: ['800 72px "Inter Tight"', '600 30px "Inter Tight"', '500 24px "Inter"'] }],
    palette: C,
    sfx: { draw: null, land: 'click', emphasis: 'swell', transition: 'whoosh', bed: 'hum' },

    background(ctx, W, H, t, o = {}) {
      const bg = K.cached(`pl-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d');
        x.fillStyle = C.bg; x.fillRect(0, 0, W, H);
        const g = x.createRadialGradient(W / 2, H * 0.52, 0, W / 2, H * 0.52, Math.max(W, H) * 0.6); g.addColorStop(0, '#24262e'); g.addColorStop(0.5, '#111217'); g.addColorStop(1, '#050507');
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        // stage floor: slightly lighter band with a soft horizon
        const f = x.createLinearGradient(0, H * 0.55, 0, H); f.addColorStop(0, 'rgba(255,255,255,0)'); f.addColorStop(0.15, 'rgba(255,255,255,0.025)'); f.addColorStop(1, 'rgba(0,0,0,0.4)');
        x.fillStyle = f; x.fillRect(0, H * 0.55, W, H * 0.45);
        return c;
      });
      ctx.drawImage(bg, 0, 0);
    },
    finish(ctx, W, H, t) {
      K.vignette(ctx, W, H, 0.55, '#000');
      K.grain(ctx, W, H, t, 0.025, 24, 'overlay');
    },

    // huge tight-tracked headline; words arrive one at a time (soft rise + fade), optional gradient eyebrow
    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 72) * s;
      ctx.save(); ctx.font = K.font(size, HEAD, 800); track(ctx, -0.035 * size); ctx.textBaseline = 'alphabetic';
      const words = text.split(' '), ws = words.map((w) => ctx.measureText(w).width), sp = size * 0.24, tot = ws.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
      let cx = o.align === 'center' ? x - tot / 2 : o.align === 'right' ? x - tot : x;
      if (o.eyebrow) { ctx.save(); ctx.font = K.font(size * 0.42, HEAD, 600); track(ctx, 0); const ew = ctx.measureText(o.eyebrow).width, ex = o.align === 'center' ? x - ew / 2 : cx; ctx.globalAlpha = K.clamp(p * 4); ctx.fillStyle = grad3(ctx, ex, ex + ew); ctx.fillText(o.eyebrow, ex, y - size * 1.0); ctx.restore(); }
      words.forEach((w, i) => {
        const wp = K.ease.out(K.clamp(p * words.length - i));
        if (wp > 0) {
          ctx.globalAlpha = wp; const g = ctx.createLinearGradient(0, y - size, 0, y); g.addColorStop(0, '#ffffff'); g.addColorStop(1, '#b9bcc6');
          ctx.fillStyle = o.color || g; ctx.filter = wp < 1 ? `blur(${(1 - wp) * 6 * s}px)` : 'none'; ctx.fillText(w, cx, y + (1 - wp) * size * 0.25); ctx.filter = 'none';
        }
        cx += ws[i] + sp;
      });
      ctx.restore(); return { w: tot, h: size };
    },

    // spec label: bold white line + optional grey sub line
    label(ctx, text, x, y, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 30) * s;
      ctx.save(); ctx.globalAlpha = K.ease.out(K.clamp(p)); ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
      ctx.font = K.font(size, HEAD, 600); track(ctx, -0.01 * size); ctx.fillStyle = o.color || C.text; ctx.fillText(text, x + (1 - K.clamp(p)) * 12 * s * (o.align === 'right' ? 1 : -1), y);
      if (o.sub) { ctx.font = K.font(size * 0.62, BODY, 400); track(ctx, 0); ctx.fillStyle = C.dim; ctx.fillText(o.sub, x, y + size * 0.95); }
      ctx.restore();
    },

    // hairline callout: ring-dot at the source, elbowed hairline drawn out to the label
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), elbow = o.elbow ?? true;
      const pts = elbow ? [from, [K.lerp(from[0], to[0], 0.55), to[1]], to] : [from, to];
      const dense = []; for (let i = 1; i < pts.length; i++) for (let k = 0; k <= 20; k++) dense.push([K.lerp(pts[i - 1][0], pts[i][0], k / 20), K.lerp(pts[i - 1][1], pts[i][1], k / 20)]);
      if (elbow) { dense.length = 0; const m = [K.lerp(from[0], to[0], 0.35), to[1]]; for (let k = 0; k <= 20; k++) dense.push([K.lerp(from[0], m[0], k / 20), K.lerp(from[1], m[1], k / 20)]); for (let k = 1; k <= 20; k++) dense.push([K.lerp(m[0], to[0], k / 20), K.lerp(m[1], to[1], k / 20)]); }
      ctx.save();
      ctx.strokeStyle = o.color || 'rgba(220,224,232,0.8)'; ctx.lineWidth = 1.3 * s; ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(from[0], from[1], 6 * s * K.clamp(p * 4), 0, TAU); ctx.stroke(); ctx.beginPath(); ctx.arc(from[0], from[1], 2.4 * s * K.clamp(p * 4), 0, TAU); ctx.fill();
      const end = K.drawOn(ctx, dense, K.ease.inOut(K.clamp(p)), { strokeStyle: ctx.strokeStyle, lineWidth: 1.3 * s });
      if (o.head && p >= 1) K.arrowHead(ctx, dense, 9 * s, { strokeStyle: ctx.strokeStyle, lineWidth: 1.3 * s });
      ctx.restore(); return end;
    },

    // dark glass card with a hairline border and a top-edge highlight
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), k = K.ease.out(K.clamp(p));
      ctx.save(); ctx.globalAlpha = k; ctx.translate(0, (1 - k) * 20 * s);
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 40 * s; ctx.shadowOffsetY = 20 * s;
      rr(ctx, x, y, w, h, o.radius || 22 * s); const g = ctx.createLinearGradient(0, y, 0, y + h); g.addColorStop(0, '#24252c'); g.addColorStop(1, '#0d0d11'); ctx.fillStyle = g; ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.strokeStyle = 'rgba(255,255,255,0.16)'; ctx.lineWidth = 1.2 * s; ctx.stroke();
      ctx.save(); rr(ctx, x, y, w, h, o.radius || 22 * s); ctx.clip(); const sh = ctx.createLinearGradient(x, y, x + w * 0.6, y + h); sh.addColorStop(0, 'rgba(255,255,255,0.10)'); sh.addColorStop(0.4, 'rgba(255,255,255,0)'); ctx.fillStyle = sh; ctx.fillRect(x, y, w, h); ctx.restore();
      ctx.restore();
    },

    // gradient key number with bloom; o.gleam 0..1 sweeps a highlight through the glyphs
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 140) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, HEAD, 800); track(ctx, -0.04 * size); ctx.textAlign = 'left';
      const w = ctx.measureText(txt).width, x0 = (o.align || 'center') === 'center' ? x - w / 2 : x;
      ctx.fillStyle = grad3(ctx, x0, x0 + w); ctx.shadowColor = K.rgba(C.pink, 0.55); ctx.shadowBlur = 50 * s; ctx.fillText(txt, x0, y);
      ctx.shadowBlur = 0; ctx.fillText(txt, x0, y);
      if (o.gleam > 0 && o.gleam < 1) {
        const gx = K.lerp(x0 - w * 0.3, x0 + w * 1.3, o.gleam), g = ctx.createLinearGradient(gx - size * 0.6, 0, gx + size * 0.6, 0);
        g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.5, 'rgba(255,255,255,0.75)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = g; ctx.fillText(txt, x0, y);
      }
      ctx.restore(); return w;
    },

    // bloom swell: a soft violet-orange halo and a thin light ring on the stage floor
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), e = Math.sin(Math.PI * K.clamp(p)) * 0.8 + (p >= 1 ? 0.2 : K.clamp(p) * 0.2);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, K.rgba(C.pink, 0.22 * e)); g.addColorStop(0.5, K.rgba(C.violet, 0.1 * e)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
      const fy = o.floor ?? y + r * 0.45, k = K.ease.out(K.clamp(p));
      ctx.strokeStyle = grad3(ctx, x - r, x + r, fy); ctx.globalAlpha = (1 - k) * 0.9 + 0.1; ctx.lineWidth = 2 * s; ctx.shadowColor = C.pink; ctx.shadowBlur = 14 * s;
      ctx.beginPath(); ctx.ellipse(x, fy, r * (0.4 + 0.6 * k), r * (0.4 + 0.6 * k) * 0.12, 0, 0, TAU); ctx.stroke();
      ctx.restore();
    },

    // light-sweep wipe: a hot vertical band crosses the frame, the scene behind it flares to near white
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const x = K.lerp(-W * 0.4, W * 1.4, K.ease.inOut(p)), bw = W * 0.5;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(x - bw, 0, x + bw, 0); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(0.45, 'rgba(255,240,250,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0.95)'); g.addColorStop(0.55, 'rgba(255,240,250,0.35)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
      const f = K.clamp(1 - Math.abs(p - 0.5) * 4); if (f > 0) { ctx.save(); ctx.fillStyle = `rgba(250,250,252,${f})`; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 150 * s], video: [70 * s, 300 * s, 220 * s, 140 * s], dev: [560 * s, 460 * s, 370 * s],
      chips: PLATFORMS.map((n, i) => [970 * s, (220 + i * 64) * s]), counter: [W / 2, 330 * s], take: [W / 2, 650 * s] };
    return { s, P: true, title: [W / 2, H * 0.12], video: [W * 0.3, H * 0.19, W * 0.4, H * 0.1], dev: [W / 2, H * 0.47, W * 0.56],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.7 + Math.floor(i / 2) * 0.06)]), counter: [W / 2, H * 0.36], take: [W / 2, H * 0.8] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      const [dx, dy, dw] = Lo.dev;
      if (t < 8.2) {
        // the rim light finds the device in the dark, key light fades up, slow orbit + push
        const light = K.beat(t, 0.2, 2.6, 'inOut'), ring = K.beat(t, 4.0, 0.9, 'inOut'), push = 1 + t * 0.008;
        ctx.save(); ctx.translate(dx, dy); ctx.scale(push, push); ctx.translate(-dx, -dy);
        device(ctx, dx, dy, dw, t, { light, ring, yaw: -0.3 + t * 0.02, sheen: K.clamp((t - 2.6) / 1.8) });
        ctx.restore();
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.4, 1.4, 'lin'), { size: P ? 50 : 66, align: 'center', eyebrow: 'Introducing' });
        const [vx, vy, vw, vh] = Lo.video;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.6));
        const vp = K.beat(t, 2.3, 0.5);
        if (vp > 0) { ctx.save(); ctx.globalAlpha = vp; ctx.fillStyle = '#fff'; ctx.beginPath(); const cx = vx + vw / 2, cy = vy + vh / 2; ctx.moveTo(cx - 12 * s, cy - 18 * s); ctx.lineTo(cx + 18 * s, cy); ctx.lineTo(cx - 12 * s, cy + 18 * s); ctx.fill(); ctx.restore(); }
        style.label(ctx, 'Your video', vx + (P ? vw / 2 : 0), vy + vh + 34 * s, K.beat(t, 2.6, 0.5), { size: 28, sub: 'Shot once', align: P ? 'center' : 'left' });
        const a1 = P ? [[vx + vw / 2, vy + vh + 100 * s], [dx, dy - dw * 0.25]] : [[vx + vw, vy + vh / 2], [dx - dw * 0.3, dy - 20 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.3, 0.8, 'lin'), { elbow: !P, head: true });
        style.label(ctx, 'Creator OS', P ? dx : dx, dy + dw * (P ? 0.44 : 0.42), K.beat(t, 4.5, 0.5), { size: 34, align: 'center', sub: 'One engine. Every feed.' });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const a = (i / 6) * Math.PI * 1.1 - Math.PI * 0.55, from = P ? [dx, dy + dw * 0.6] : [dx + Math.cos(a) * dw * 0.22, dy + Math.sin(a) * dw * 0.09];
          const to = P ? [left ? cx + 4 * s : cx - 4 * s, cy] : [cx - 14 * s, cy];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.4, 'lin'), { elbow: !P });
          style.label(ctx, name, P ? (left ? cx - 14 * s : cx + 14 * s) : cx, cy, K.beat(t, t0 + 0.35, 0.35), { size: P ? 30 : 30, align: P ? (left ? 'right' : 'left') : 'left' });
        });
      } else {
        // after the sweep: device lower and smaller, number reveal, tagline
        const ddy = P ? H * 0.58 : 465 * s, ddw = P ? W * 0.42 : 190 * s;
        device(ctx, dx === Lo.dev[0] ? W / 2 : dx, ddy, ddw, t, { light: 1, ring: 1, yaw: -0.14 + (t - 8) * 0.02, sheen: K.clamp((t - 10.0) / 1.4) });
        const [cx, cy] = Lo.counter, v = K.count(t, 8.6, 1.5, 0, 1000000);
        style.label(ctx, 'Views', cx, cy - (P ? 120 : 130) * s, K.beat(t, 8.5, 0.5), { align: 'center', size: 30, color: C.dim });
        style.counter(ctx, Math.round(v / 1000) * 1000, cx, cy, 1, { size: P ? 108 : 130, gleam: K.clamp((t - 10.0) / 0.9) });
        style.emphasis(ctx, cx, cy - 40 * s, (P ? 420 : 520) * s, K.beat(t, 10.0, 1.2, 'lin'), { floor: ddy + ddw * 0.2 });
        style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 1.0, 'lin'), { size: P ? 48 : 60, align: 'center' });
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 0.6);
      k.play('swell', 0, { dur: 3, chord: ['D3', 'A3', 'F#4'] }); k.play('riser', 0.4, { dur: 2.2, gain: 0.5 });
      k.play('thud', 2.0, { gain: 0.6 }); k.play('click', 2.6);
      k.play('whoosh', 3.3, { dur: 0.8, gain: 0.4 }); k.play('chime', 4.0, { note: 'D6', gain: 0.6 }); k.play('click', 4.5, { pitch: 1.2 });
      for (let i = 0; i < 7; i++) { k.play('tick', 5.0 + i * 0.4, { gain: 0.6 }); k.play('click', 5.35 + i * 0.4, { pitch: 1 + i * 0.05 }); }
      k.play('whoosh', 7.6, { dur: 1.2 }); k.play('thud', 8.2, { gain: 0.7 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('swell', 10.0, { dur: 2, chord: ['D4', 'F#4', 'A4', 'D5'] });
      k.play('chime', 11.2, { note: 'A5' });
    },
  };
  MS.register(style);
})();
