// Hidden-Line Wireframe (Dimensional). Vector-display 3D: a perspective wire mesh scrolling under the camera with
// true hidden-line removal (each row of quads is filled with the night, far to near, before it is stroked), a
// rotating wireframe sphere whose back lines are culled, phosphor-cyan bloom on deep navy, HUD brackets, typed
// monospace readouts, lock-on reticles and a scan-sweep scene change.
(function () {
  const P = { bg0: '#02051a', bg1: '#081440', bg2: '#0f2160', cyan: '#7feaff', hot: '#e8fbff', amber: '#ffd36b', red: '#ff5a6e', dim: '#2a5c9a' };
  const MONO = 'Space Mono', PLEX = 'IBM Plex Mono';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);

  // Glowing stroke of the current path: a wide faint bloom pass then the hot core.
  function glowStroke(ctx, col, w, alpha = 1) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = K.rgba(col, 0.16 * alpha); ctx.lineWidth = w * 4; ctx.stroke();
    ctx.strokeStyle = K.rgba(col, 0.32 * alpha); ctx.lineWidth = w * 2; ctx.stroke();
    ctx.strokeStyle = K.rgba(col, 0.95 * alpha); ctx.lineWidth = w; ctx.stroke();
    ctx.restore();
  }

  // ---------- the terrain ----------
  const NZ = K.noise(31);
  const heightAt = (x, z) => {
    const ridge = 1 - Math.abs(NZ.fbm2(x * 0.09, z * 0.09, 3) * 2);
    return ridge * ridge * 4.2 + NZ.n2(x * 0.3 + 7, z * 0.3) * 0.8 + Math.pow(Math.abs(x) / 14, 2) * 3;
  };
  // Draw the mesh. reveal 0..1 scans rows in from near to far; travel = world z the camera has moved.
  function terrain(ctx, W, H, t, o) {
    const s = S(W, H), hz = o.horizon, f = W * (H > W ? 1.25 : 0.95), camH = 6.2, cols = 40, rows = 32, dz = 1.6, z0 = 2.2;
    const travel = t * 2.2, ph = travel % dz, X = 26;
    const P3 = (x, zz, zw) => { const y = heightAt(x, zw); return [W / 2 + (f * x) / zz, hz + (f * (camH - y)) / zz]; };
    const grid = [];
    for (let i = 0; i <= rows; i++) { const zz = z0 + i * dz - ph, zw = zz + travel, row = []; for (let j = 0; j <= cols; j++) { const x = -X + (j / cols) * 2 * X; row.push(P3(x, zz, zw)); } grid.push({ zz, row }); }
    const scanRow = o.reveal * rows;
    ctx.save(); ctx.lineJoin = 'round';
    for (let i = rows - 1; i >= 0; i--) {
      if (i > scanRow) continue;
      const a = grid[i].row, b = grid[i + 1].row, depth = i / rows;
      ctx.beginPath();
      for (let j = 0; j < cols; j++) { ctx.moveTo(a[j][0], a[j][1]); ctx.lineTo(a[j + 1][0], a[j + 1][1]); ctx.lineTo(b[j + 1][0], b[j + 1][1]); ctx.lineTo(b[j][0], b[j][1]); ctx.closePath(); }
      ctx.fillStyle = K.rgba(K.mix(P.bg1, P.bg0, 1 - depth * 0.6)); ctx.fill();
      const fade = (1 - depth) * 0.9 + 0.1, front = Math.abs(i - scanRow) < 1.5 && o.reveal < 1 ? 1 : 0;
      glowStroke(ctx, front ? P.hot : P.cyan, 1.1 * s, fade * (front ? 1.6 : 1));
    }
    ctx.restore();
    // marker helper: screen point of a world (x, depth fraction)
    return (x, frac) => { const zz = z0 + frac * rows * dz; return P3(x, zz, zz + travel); };
  }
  // Wireframe sphere with back-face culling of its lines, rotating about a tilted axis.
  function sphere(ctx, cx, cy, r, t, p = 1) {
    const s = sOf(ctx); if (p <= 0) return;
    const rot = t * 0.5, tilt = 0.35, pts = (lat, lon) => {
      let x = Math.cos(lat) * Math.cos(lon + rot), y = Math.sin(lat), z = Math.cos(lat) * Math.sin(lon + rot);
      const y2 = y * Math.cos(tilt) - z * Math.sin(tilt), z2 = y * Math.sin(tilt) + z * Math.cos(tilt);
      return [cx + x * r, cy - y2 * r, z2];
    };
    ctx.save();
    ctx.fillStyle = P.bg0; ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
    const g = ctx.createRadialGradient(cx, cy, r * 0.6, cx, cy, r * 1.5); g.addColorStop(0, 'rgba(127,234,255,0.10)'); g.addColorStop(1, 'rgba(127,234,255,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, r * 1.5, 0, Math.PI * 2); ctx.fill();
    const total = 26, drawn = Math.floor(total * p);
    let k = 0;
    const line = (fn, n) => { ctx.beginPath(); let pen = false; for (let i = 0; i <= n; i++) { const q = fn(i / n); if (q[2] < -0.02) { pen = false; continue; } pen ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); pen = true; } glowStroke(ctx, P.cyan, 1.1 * s, 0.85); };
    for (let i = 1; i < 12; i++) { if (k++ > drawn) break; const lat = -Math.PI / 2 + (i / 12) * Math.PI; line((u) => pts(lat, u * Math.PI * 2), 48); }
    for (let i = 0; i < 14; i++) { if (k++ > drawn) break; const lon = (i / 14) * Math.PI * 2; line((u) => pts(-Math.PI / 2 + u * Math.PI, lon), 32); }
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2 * p); glowStroke(ctx, P.hot, 1.4 * s, 0.9);
    ctx.restore();
  }
  function brackets(ctx, x, y, w, h, L, col, lw, s) {
    ctx.beginPath();
    ctx.moveTo(x, y + L); ctx.lineTo(x, y); ctx.lineTo(x + L, y);
    ctx.moveTo(x + w - L, y); ctx.lineTo(x + w, y); ctx.lineTo(x + w, y + L);
    ctx.moveTo(x + w, y + h - L); ctx.lineTo(x + w, y + h); ctx.lineTo(x + w - L, y + h);
    ctx.moveTo(x + L, y + h); ctx.lineTo(x, y + h); ctx.lineTo(x, y + h - L);
    glowStroke(ctx, col, lw, 1); void s;
  }
  const typed = (text, p) => text.slice(0, Math.round(text.length * K.clamp(p)));

  const style = {
    id: 'wireframe-terrain', name: 'Hidden-Line Wireframe', family: 'Dimensional',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=IBM+Plex+Mono:wght@500;600&display=block', specs: ['700 52px "Space Mono"', '400 24px "Space Mono"', '600 28px "IBM Plex Mono"', '500 20px "IBM Plex Mono"'] }],
    palette: { ...P },
    sfx: { draw: null, land: 'blip', emphasis: 'glitch', transition: 'whoosh', bed: 'hum' },

    background(ctx, W, H, t, o = {}) {
      const cv = K.cached(`wf-bg:${W}x${H}`, () => {
        const c = K.layer(W, H), x = c.getContext('2d'), g = x.createLinearGradient(0, 0, 0, H);
        g.addColorStop(0, P.bg0); g.addColorStop(0.5, P.bg1); g.addColorStop(0.62, P.bg2); g.addColorStop(1, P.bg0);
        x.fillStyle = g; x.fillRect(0, 0, W, H);
        const r = K.rng(4); x.fillStyle = 'rgba(200,240,255,0.5)';
        for (let i = 0; i < 90; i++) { const sz = r() < 0.1 ? 1.6 : 0.9; x.fillRect(r() * W, r() * H * 0.5, sz, sz); }
        return c;
      });
      ctx.drawImage(cv, 0, 0);
    },
    // HUD overlay, scanlines, bloom haze, vignette, grain.
    finish(ctx, W, H, t) {
      const s = S(W, H), m = 24 * s, L = 34 * s;
      ctx.save(); ctx.globalAlpha = 0.75; brackets(ctx, m, m, W - m * 2, H - m * 2, L, P.cyan, 1.2 * s, s); ctx.restore();
      // top tick ruler with heading readouts
      ctx.save(); ctx.strokeStyle = K.rgba(P.cyan, 0.45); ctx.lineWidth = 1 * s; ctx.beginPath();
      const off = (t * 40 * s) % (24 * s);
      for (let x = W * 0.3 - off; x < W * 0.7; x += 24 * s) { const big = Math.round((x + off) / (24 * s)) % 5 === 0; ctx.moveTo(x, m + 6 * s); ctx.lineTo(x, m + (big ? 18 : 11) * s); }
      ctx.stroke(); ctx.fillStyle = P.cyan; ctx.beginPath(); ctx.moveTo(W / 2, m + 22 * s); ctx.lineTo(W / 2 - 6 * s, m + 32 * s); ctx.lineTo(W / 2 + 6 * s, m + 32 * s); ctx.fill();
      ctx.font = `500 ${Math.round(18 * s)}px "${PLEX}"`; ctx.fillStyle = K.rgba(P.cyan, 0.75);
      ctx.fillText(`ALT ${(1840 + Math.sin(t) * 12).toFixed(0)}  HDG ${(212 + t * 3).toFixed(1)}`, m + 14 * s, H - m - 12 * s);
      ctx.textAlign = 'right'; ctx.fillText(`T+${t.toFixed(2)}  GRID 40x32`, W - m - 14 * s, H - m - 12 * s);
      ctx.restore();
      const sl = K.cached(`wf-scan:${W}x${H}`, () => { const c = K.layer(4, 4), x = c.getContext('2d'); x.fillStyle = 'rgba(0,0,0,0.22)'; x.fillRect(0, 0, 4, 2); return c; });
      ctx.save(); ctx.fillStyle = ctx.createPattern(sl, 'repeat'); ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.55, '#000005');
      K.grain(ctx, W, H, t, 0.05, 30, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 52) * s, lines = String(text).toUpperCase().split('\n'), lh = size * 1.15, total = lines.join('').length;
      ctx.save(); ctx.font = K.font(size, MONO, 700); ctx.textAlign = o.align || 'left';
      let used = Math.round(total * K.clamp(p)), w = 0;
      if (o.plate && p > 0) {
        const pw = Math.max(...lines.map((l) => ctx.measureText(l).width)) + size, ph = lh * lines.length + size * 0.4;
        const px = o.align === 'center' ? x - pw / 2 : x - size / 2;
        ctx.fillStyle = 'rgba(2,6,24,0.78)'; ctx.fillRect(px, y - size * 1.05, pw, ph);
        brackets(ctx, px, y - size * 1.05, pw, ph, 14 * s, P.cyan, 1.2 * s, s);
      }
      lines.forEach((l, i) => {
        const n = Math.min(l.length, used); used -= n; w = Math.max(w, ctx.measureText(l).width);
        const str = l.slice(0, n); if (!str && n === 0 && used <= 0 && i > 0) return;
        ctx.shadowColor = P.cyan; ctx.shadowBlur = 18 * s; ctx.fillStyle = o.color || P.hot; ctx.fillText(str, x, y + i * lh);
        if (n < l.length && n > 0 || (p < 1 && n === l.length && used === 0 && i === lines.length - 1)) {
          const full = ctx.measureText(l).width, sw = ctx.measureText(str).width, ax = o.align === 'center' ? x - full / 2 + sw : x + sw;
          if (Math.floor((o.t ?? p * 10) * 4) % 2 === 0) { ctx.textAlign = 'left'; ctx.fillRect(o.align === 'center' ? x - ctx.measureText(l).width / 2 + sw + 4 * s : ax + 4 * s, y + i * lh - size * 0.75, size * 0.5, size * 0.85); ctx.textAlign = o.align || 'left'; }
        }
      });
      ctx.restore();
      return { w, h: lh * lines.length };
    },
    // Bracketed HUD tag: corner brackets snap in, the text types on, a tick marks the anchor.
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 28) * s, T = String(text).toUpperCase(); if (p <= 0) return { w: 0, h: 0 };
      ctx.save(); ctx.font = `600 ${Math.round(size)}px "${PLEX}"`;
      const tw = ctx.measureText(T).width, w = tw + size * 1.2, h = size * 1.7, col = o.color || P.cyan;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - h / 2;
      const k = K.ease.out(K.clamp(p * 2.5)), grow = (1 - k) * 18 * s;
      ctx.fillStyle = 'rgba(2,8,30,0.82)'; ctx.fillRect(x0, y0, w, h);
      ctx.fillStyle = K.rgba(col, 0.08); ctx.fillRect(x0, y0, w, h);
      brackets(ctx, x0 - grow, y0 - grow, w + grow * 2, h + grow * 2, 10 * s, col, 1.4 * s, s);
      ctx.shadowColor = col; ctx.shadowBlur = 10 * s; ctx.fillStyle = P.hot; ctx.textBaseline = 'middle';
      ctx.fillText(typed(T, (p - 0.2) / 0.8), x0 + size * 0.6, y + 1 * s);
      ctx.restore();
      return { w, h };
    },
    // Dashed glowing vector with a chevron head and a moving pulse.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0, 40), q = K.trim(pts, K.clamp(p)), col = o.color || P.cyan;
      if (q.length < 2) return null;
      ctx.save(); ctx.setLineDash([10 * s, 7 * s]); ctx.lineDashOffset = -(o.t || 0) * 40 * s; K.poly(ctx, q); glowStroke(ctx, col, 1.5 * s, 1); ctx.restore();
      const end = q[q.length - 1];
      if (p > 0.95) { const a = q[Math.max(0, q.length - 3)], ang = Math.atan2(end[1] - a[1], end[0] - a[0]), L = 14 * s; ctx.beginPath(); ctx.moveTo(end[0] - Math.cos(ang - 0.6) * L, end[1] - Math.sin(ang - 0.6) * L); ctx.lineTo(end[0], end[1]); ctx.lineTo(end[0] - Math.cos(ang + 0.6) * L, end[1] - Math.sin(ang + 0.6) * L); glowStroke(ctx, col, 2 * s, 1); }
      return end;
    },
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return; const k = K.ease.out(K.clamp(p)), grow = (1 - k) * 40 * s, col = o.color || P.cyan;
      ctx.save(); ctx.globalAlpha = K.clamp(p * 3);
      ctx.fillStyle = 'rgba(2,8,30,0.85)'; ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = K.rgba(col, 0.25); ctx.lineWidth = 1 * s; ctx.strokeRect(x, y, w, h);
      // scan grid inside
      ctx.beginPath(); for (let gx = x + 20 * s; gx < x + w; gx += 20 * s) { ctx.moveTo(gx, y); ctx.lineTo(gx, y + h); } ctx.strokeStyle = K.rgba(col, 0.07); ctx.stroke();
      brackets(ctx, x - grow, y - grow, w + grow * 2, h + grow * 2, 18 * s, col, 1.6 * s, s);
      ctx.restore();
    },
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 104) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, MONO, 700); ctx.textAlign = o.align || 'center';
      ctx.shadowColor = o.color || P.amber; ctx.shadowBlur = 26 * s; ctx.fillStyle = o.color || P.amber; ctx.fillText(txt, x, y);
      ctx.shadowBlur = 0; ctx.globalAlpha = 0.9; ctx.fillStyle = '#fff6dc'; ctx.fillText(txt, x, y);
      ctx.restore();
      return { h: size };
    },
    // Lock-on reticle: four brackets close in and spin to rest, a ring and crosshair ticks flash on.
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return; const col = o.color || P.amber, k = K.ease.out(K.clamp(p / 0.6)), rr = r * (1.8 - 0.8 * k), rot = (1 - k) * 1.2;
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      const L = r * 0.32;
      for (let i = 0; i < 4; i++) { ctx.save(); ctx.rotate((i * Math.PI) / 2); ctx.beginPath(); ctx.moveTo(-rr, -rr + L); ctx.lineTo(-rr, -rr); ctx.lineTo(-rr + L, -rr); glowStroke(ctx, col, 2.4 * s, 1); ctx.restore(); }
      ctx.restore();
      if (p > 0.55) {
        const q = K.clamp((p - 0.55) / 0.45), blink = Math.floor(p * 14) % 2 || q > 0.6;
        ctx.save(); if (blink) { ctx.beginPath(); ctx.ellipse(x, y, r * 0.9, r * 0.9, 0, 0, Math.PI * 2); glowStroke(ctx, col, 1.2 * s, 0.7); }
        ctx.beginPath(); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { ctx.moveTo(x + dx * r * 0.95, y + dy * r * 0.95); ctx.lineTo(x + dx * r * 1.15, y + dy * r * 1.15); } glowStroke(ctx, col, 2 * s, 1);
        ctx.font = `600 ${Math.round(22 * s)}px "${PLEX}"`; ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 10 * s; ctx.textAlign = 'right'; ctx.fillText('LOCK', x - r * 1.05, y - r * 1.12); ctx.restore();
      }
    },
    // Scene change: a bright scan bar sweeps down wiping to the night grid, then sweeps again to reveal.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), e = K.ease.inOut, yb = p < 0.5 ? H * e(p * 2) : H * e((p - 0.5) * 2);
      ctx.save();
      if (p < 0.5) { ctx.beginPath(); ctx.rect(0, 0, W, yb); } else { ctx.beginPath(); ctx.rect(0, yb, W, H - yb); }
      ctx.clip(); ctx.fillStyle = P.bg0; ctx.fillRect(0, 0, W, H);
      ctx.beginPath(); for (let x = 0; x < W; x += 40 * s) { ctx.moveTo(x, 0); ctx.lineTo(x, H); } for (let y = 0; y < H; y += 40 * s) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.strokeStyle = K.rgba(P.cyan, 0.12); ctx.lineWidth = 1 * s; ctx.stroke();
      ctx.restore();
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      const g = ctx.createLinearGradient(0, yb - 50 * s, 0, yb + 6 * s); g.addColorStop(0, 'rgba(127,234,255,0)'); g.addColorStop(0.85, 'rgba(127,234,255,0.35)'); g.addColorStop(1, 'rgba(232,251,255,0.95)');
      ctx.fillStyle = g; ctx.fillRect(0, yb - 50 * s, W, 56 * s); ctx.restore();
    },
    terrain, sphere,
  };

  // ---------- the shared demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, portrait: false, horizon: H * 0.48, title: [80 * s, 128 * s], card: [80 * s, 240 * s, 230 * s, 140 * s], sph: [510 * s, 300 * s], sr: 92 * s,
      chips: PLATFORMS.map((n, i) => [905 * s, (170 + i * 70) * s]), sph2: [W / 2 - 60 * s, 140 * s], sr2: 62 * s, counter: [W / 2, 440 * s], take: [W / 2, 628 * s] };
    return { s, portrait: true, horizon: H * 0.5, title: [W / 2, H * 0.085], card: [W * 0.27, H * 0.15, W * 0.46, H * 0.08], sph: [W / 2, H * 0.36], sr: 74 * s,
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.53 : W * 0.47, H * (0.53 + Math.floor(i / 2) * 0.075)]), sph2: [W / 2 - 80 * s, H * 0.2], sr2: 72 * s, counter: [W / 2, H * 0.47], take: [W / 2, H * 0.83] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait;
      style.background(ctx, W, H, t);
      terrain(ctx, W, H, t, { horizon: Lo.horizon, reveal: K.beat(t, 0.4, 2.2, 'out') });
      if (t < 8.25) {
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.3, 'lin'), { size: portrait ? 50 : 50, align: portrait ? 'center' : 'left', t });
        const [vx, vy, vw, vh] = Lo.card;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.5), {});
        if (t > 2.3) {
          const k = K.clamp((t - 2.3) / 0.4), cx = vx + vw / 2, cy = vy + vh / 2, r = Math.min(vw, vh) * 0.25;
          ctx.save(); ctx.beginPath(); K.poly(ctx, K.trim([[cx - r * 0.6, cy - r], [cx + r, cy], [cx - r * 0.6, cy + r], [cx - r * 0.6, cy - r]], k)); glowStroke(ctx, P.cyan, 2 * s, 1); ctx.restore();
        }
        const [cx, cy] = Lo.sph;
        if (portrait) {
          style.label(ctx, 'your video', W / 2 + 26 * s, (vy + vh + cy - Lo.sr) / 2, K.beat(t, 2.7, 0.5, 'lin'), {});
          style.arrow(ctx, [W / 2, vy + vh + 12 * s], [W / 2, cy - Lo.sr - 14 * s], K.beat(t, 3.4, 0.6, 'out'), { t });
        } else {
          style.label(ctx, 'your video', vx + vw / 2, vy + vh + 40 * s, K.beat(t, 2.7, 0.5, 'lin'), { align: 'center' });
          style.arrow(ctx, [vx + vw + 10 * s, vy + vh / 2], [cx - Lo.sr - 18 * s, cy + 20 * s], K.beat(t, 3.4, 0.6, 'out'), { t, bend: -0.12 });
        }
        sphere(ctx, cx, cy, Lo.sr, t, K.beat(t, 3.9, 0.8, 'lin'));
        style.label(ctx, 'Creator OS', cx, cy + Lo.sr + 40 * s, K.beat(t, 4.5, 0.5, 'lin'), { align: 'center', size: 34, color: P.amber });
        if (portrait) style.arrow(ctx, [cx, cy + Lo.sr + 70 * s], [W / 2, Lo.chips[6][1]], K.beat(t, 4.9, 0.5, 'out'), { t, bend: 0 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [lx, ly] = Lo.chips[i], left = i % 2 === 0;
          const from = portrait ? [W / 2, ly] : [cx + Lo.sr + 10 * s, cy + (i - 3) * 12 * s], to = portrait ? [left ? W * 0.465 : W * 0.535, ly] : [lx - 16 * s, ly];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'out'), { t, bend: portrait ? 0 : (i - 3) * -0.03 });
          style.label(ctx, name, lx, ly, K.beat(t, t0 + 0.2, 0.4, 'lin'), { align: portrait ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      } else {
        const [cx, cy] = Lo.sph2;
        sphere(ctx, cx, cy, Lo.sr2, t, 1);
        style.label(ctx, 'Creator OS', cx + Lo.sr2 + 24 * s, cy, 1, { size: 30, color: P.amber });
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000, [nx, ny] = Lo.counter;
        const bw = (portrait ? 700 : 720) * s, bh = (portrait ? 190 : 190) * s;
        style.box(ctx, nx - bw / 2, ny - bh * 0.68, bw, bh, K.beat(t, 8.3, 0.4), { color: P.amber });
        style.counter(ctx, v, nx, ny, 1, { size: portrait ? 84 : 100 });
        ctx.save(); ctx.font = `600 ${Math.round(28 * s)}px "${PLEX}"`; ctx.fillStyle = P.cyan; ctx.textAlign = 'center'; ctx.shadowColor = P.cyan; ctx.shadowBlur = 8 * s;
        ctx.fillText(typed('VIEWS  //  ALL CHANNELS', (t - 8.7) / 0.6), nx, ny + 46 * s); ctx.restore();
        style.emphasis(ctx, nx, ny - 34 * s, (portrait ? 150 : 160) * s, K.beat(t, 10.0, 0.8, 'lin'), {});
        style.title(ctx, portrait ? 'Post once.\nReach everywhere.' : 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { size: portrait ? 48 : 46, align: 'center', t, plate: true });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 1); k.bed('space', 0, 12, 0.5);
      k.play('type', 0.15, { dur: 1.3, gain: 0.8 }); k.play('riser', 0.4, { dur: 2.0, gain: 0.35 });
      k.play('blip', 2.0, { note: 'A5' }); k.play('blip', 2.08, { note: 'E6' }); k.play('type', 2.7, { dur: 0.5, gain: 0.6 });
      k.play('whoosh', 3.4, { dur: 0.6, gain: 0.35 }); k.play('riser', 3.9, { dur: 0.8, gain: 0.3 }); k.play('blip', 4.7, { note: 'C6' }); k.play('type', 4.5, { dur: 0.5, gain: 0.6 });
      for (let i = 0; i < 7; i++) { k.play('click', 5.0 + i * 0.4, { pitch: 1.5, gain: 0.6 }); k.play('blip', 5.2 + i * 0.4, { note: ['E6', 'G6', 'A6', 'B6', 'D7', 'E7', 'G7'][i], gain: 0.6 }); k.play('type', 5.25 + i * 0.4, { dur: 0.25, gain: 0.4 }); }
      k.play('whoosh', 7.6, { dur: 0.65, up: false }); k.play('whoosh', 8.25, { dur: 0.65 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('type', 8.7, { dur: 0.6, gain: 0.5 });
      k.play('glitch', 10.0); k.play('blip', 10.35, { note: 'A6' }); k.play('blip', 10.45, { note: 'A6' });
      k.play('type', 10.5, { dur: 0.9, gain: 0.7 }); k.play('chime', 11.4, { note: 'E6' });
    },
  };
  MS.register(style);
})();
