// Low-Poly Faceted (Dimensional). A triangulated perspective valley with flat per-face Lambert shading and depth fog,
// faceted ranges and cone trees under a dawn gradient, a spinning faceted crystal for Creator OS, angular two-tone
// ribbon arrows, cut-corner tags, a faceted rocket lift-off and a triangle facet-flip scene change.
(function () {
  const P = { night: '#2a1f4f', violet: '#4d3f84', mauve: '#c06a93', peach: '#ffb08a', dawn: '#ffd49a', pale: '#fff4d8',
    coral: '#ff7060', coral2: '#d9474a', mint: '#3ccf9a', ink: '#2a1f4f', cream: '#fff6f0', pine: '#1f5c46', pine2: '#2e7d5b' };
  const FONT = 'Space Grotesk';
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  const tri = (ctx, a, b, c, col) => { ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); ctx.strokeStyle = col; ctx.lineWidth = 0.6; ctx.stroke(); };
  const mixc = (a, b, k) => K.mix(a, b, K.clamp(k));
  const norm = (v) => { const l = Math.hypot(v[0], v[1], v[2]) || 1; return [v[0] / l, v[1] / l, v[2] / l]; };
  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const LIGHT = norm([0.55, 0.6, -0.55]);

  // ---------- the cached faceted world (sky, sun, ranges, valley, trees) ----------
  function world(W, H) {
    return K.cached(`lp-world:${W}x${H}`, () => {
      const pad = 1.08, cw = Math.round(W * pad), ch = Math.round(H * pad), cv = K.layer(cw, ch), x = cv.getContext('2d');
      const portrait = H > W, hz = ch * (portrait ? 0.5 : 0.5), r = K.rng(42), nz = K.noise(8);
      // sky
      const g = x.createLinearGradient(0, 0, 0, hz);
      g.addColorStop(0, P.night); g.addColorStop(0.35, P.violet); g.addColorStop(0.7, P.mauve); g.addColorStop(0.92, P.peach); g.addColorStop(1, P.pale);
      x.fillStyle = g; x.fillRect(0, 0, cw, ch);
      // faceted sun with a soft halo
      const sx = cw * (portrait ? 0.7 : 0.68), sy = hz * 0.72, sr = Math.min(cw, ch) * 0.075;
      const halo = x.createRadialGradient(sx, sy, sr * 0.5, sx, sy, sr * 5); halo.addColorStop(0, 'rgba(255,220,170,0.55)'); halo.addColorStop(1, 'rgba(255,220,170,0)');
      x.fillStyle = halo; x.fillRect(0, 0, cw, ch);
      for (let i = 0; i < 12; i++) { const a0 = (i / 12) * Math.PI * 2, a1 = ((i + 1) / 12) * Math.PI * 2; tri(x, [sx, sy], [sx + Math.cos(a0) * sr, sy + Math.sin(a0) * sr], [sx + Math.cos(a1) * sr, sy + Math.sin(a1) * sr], K.rgba(mixc('#fff1c8', '#ffc98a', 0.25 + 0.5 * (0.5 + 0.5 * Math.sin(a0 + 1)))) ); }
      // three faceted mountain ranges, farther = foggier
      const ranges = [[hz - ch * 0.2, '#6a4f8f', 0.62, 7], [hz - ch * 0.13, '#5a3f7a', 0.42, 9], [hz - ch * 0.06, '#4a3268', 0.22, 12]];
      ranges.forEach(([top, col, fog, n], li) => {
        const pts = [];
        for (let i = 0; i <= n; i++) { const px = (i / n) * cw * 1.1 - cw * 0.05 + r.range(-20, 20); const py = i % 2 ? hz - r.range(0.0, 0.03) * ch : top + r.range(0, 0.06) * ch; pts.push([px, py]); }
        const base = hz + 4;
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], m = [(a[0] + b[0]) / 2 + r.range(-15, 15), Math.max(a[1], b[1]) + (base - Math.max(a[1], b[1])) * 0.45];
          const up = b[1] < a[1]; // edge rises to the right: that slope faces the light on the left
          const lit = mixc(col, '#f7c9b0', 0.18), dk = mixc(col, '#1e1436', 0.25);
          tri(x, a, b, m, K.rgba(mixc(up ? dk : lit, '#e8a6a3', fog)));
          tri(x, a, m, [a[0], base], K.rgba(mixc(lit, '#e8a6a3', fog + 0.05)));
          tri(x, m, b, [b[0], base], K.rgba(mixc(dk, '#e8a6a3', fog + 0.05)));
          tri(x, [a[0], base], m, [b[0], base], K.rgba(mixc(col, '#e8a6a3', fog + 0.1)));
          if (li === 0 && (up ? b : a)[1] < top + ch * 0.02) { const pk = up ? b : a; tri(x, pk, [pk[0] - 14, pk[1] + 16], [pk[0] + 12, pk[1] + 18], K.rgba(mixc('#ffe8f0', '#e8a6a3', 0.2))); }
        }
      });
      // valley: perspective triangulated terrain
      const f = cw * 0.85, camH = 6, rows = 24, cols = 30, zN = 3.2, zF = 260, grid = [];
      for (let i = 0; i <= rows; i++) {
        const k = i / rows, z = zF * Math.pow(zN / zF, k), span = (z * cw) / (2 * f) * 1.35, row = [];
        for (let j = 0; j <= cols; j++) {
          const u = j / cols + (i % 2 ? 0.5 / cols : 0) + r.range(-0.15, 0.15) / cols, X = (u - 0.5) * 2 * span;
          const side = Math.pow(Math.abs(u - 0.5) * 2, 1.6), hgt = side * (2.2 + z * 0.035) + nz.fbm2(X * 0.25, z * 0.25, 3) * 1.6 + 0.3;
          const sxp = cw / 2 + (f * X) / z, syp = hz + (f * (camH - hgt)) / z;
          row.push({ w: [X, hgt, z], s: [sxp, syp], u });
        }
        grid.push(row);
      }
      const shadeTri = (A, B, Cc) => {
        const n = norm(cross(sub(B.w, A.w), sub(Cc.w, A.w))), nn = n[1] < 0 ? [-n[0], -n[1], -n[2]] : n;
        const lam = 0.35 + 0.75 * Math.max(0, dot(nn, LIGHT)), hgt = (A.w[1] + B.w[1] + Cc.w[1]) / 3, z = (A.w[2] + B.w[2] + Cc.w[2]) / 3, u = (A.u + B.u + Cc.u) / 3;
        let base = hgt < 1.0 ? '#2f7a5c' : hgt < 2.4 ? '#3f8a62' : hgt < 3.6 ? '#7a6a9a' : '#c9b6d6';
        if (Math.abs(u - 0.5) < 0.05 && hgt < 1.1) base = '#a99ad8';
        const c = K.mix(base, '#140c22', 0); const lit = c.map((v) => v * lam);
        const fog = Math.pow(K.clamp((z - zN) / (zF - zN)), 0.55) * 0.85;
        return K.rgba(mixc(lit, '#e9a7a2', fog));
      };
      for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
        const a = grid[i][j], b = grid[i][j + 1], c = grid[i + 1][j], d = grid[i + 1][j + 1];
        tri(x, a.s, b.s, c.s, shadeTri(a, b, c)); tri(x, b.s, d.s, c.s, shadeTri(b, d, c));
      }
      // cone trees on the slopes, far to near
      for (let i = 2; i < rows; i++) for (let j = 1; j < cols; j++) {
        const v = grid[i][j]; if (Math.abs(v.u - 0.5) < 0.12 || v.w[1] > 3.2 || nz.n2(v.w[0] * 0.8, v.w[2] * 0.8) < 0.05 || r() < 0.35) continue;
        const z = v.w[2], th = (f * 1.25) / z, tw = th * 0.32, [px, py] = v.s, fog = Math.pow(K.clamp((z - zN) / (zF - zN)), 0.55) * 0.85;
        tri(x, [px, py - th], [px - tw, py], [px, py + tw * 0.15], K.rgba(mixc(P.pine2, '#e9a7a2', fog)));
        tri(x, [px, py - th], [px, py + tw * 0.15], [px + tw, py], K.rgba(mixc(P.pine, '#e9a7a2', fog)));
      }
      return cv;
    });
  }

  // Cut-corner (chamfered) rectangle path.
  function chamfer(ctx, x, y, w, h, c) { ctx.beginPath(); ctx.moveTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.lineTo(x + w, y + h - c); ctx.lineTo(x + w - c, y + h); ctx.lineTo(x + c, y + h); ctx.lineTo(x, y + h - c); ctx.lineTo(x, y + c); ctx.closePath(); }
  // Faceted fill: fan triangles from an off-centre point to the outline vertices, each a slightly different shade.
  function facetFill(ctx, verts, col, seed, alpha = 1) {
    const r = K.rng(seed), cx = verts.reduce((a, v) => a + v[0], 0) / verts.length, cy = verts.reduce((a, v) => a + v[1], 0) / verts.length;
    const ctr = [cx - (verts[1][0] - verts[0][0]) * 0.15, cy - 6];
    ctx.save(); ctx.globalAlpha = alpha;
    for (let i = 0; i < verts.length; i++) { const a = verts[i], b = verts[(i + 1) % verts.length], k = (Math.atan2((a[1] + b[1]) / 2 - cy, (a[0] + b[0]) / 2 - cx) + Math.PI) / (Math.PI * 2); tri(ctx, ctr, a, b, K.rgba(mixc(col, k < 0.5 ? '#ffffff' : '#000000', 0.05 + r() * 0.08))); }
    ctx.restore();
  }
  const chamferVerts = (x, y, w, h, c) => [[x + c, y], [x + w * 0.5, y], [x + w - c, y], [x + w, y + c], [x + w, y + h - c], [x + w - c, y + h], [x + w * 0.5, y + h], [x + c, y + h], [x, y + h - c], [x, y + c]];

  // Faceted octahedron crystal, spinning about its vertical axis.
  function crystal(ctx, cx, cy, r, t, p = 1) {
    const s = sOf(ctx), k = K.ease.back(K.clamp(p)); if (k <= 0.01) return;
    const ang = t * 0.7, n = 6, ring = [], top = [0, -r * 1.35 * k, 0], bot = [0, r * 1.1 * k, 0];
    for (let i = 0; i < n; i++) { const a = ang + (i / n) * Math.PI * 2; ring.push([Math.cos(a) * r * k, 0, Math.sin(a) * r * k * 0.9]); }
    const proj = (v) => [cx + v[0], cy + v[1] + v[2] * 0.22];
    const faces = [];
    for (let i = 0; i < n; i++) { const a = ring[i], b = ring[(i + 1) % n]; faces.push([top, a, b], [bot, b, a]); }
    // glow under the crystal
    const gl = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2.6); gl.addColorStop(0, 'rgba(120,255,210,0.35)'); gl.addColorStop(1, 'rgba(120,255,210,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(cx, cy, r * 2.6, 0, Math.PI * 2); ctx.fill();
    const L = norm([0.5, -0.7, -0.6]);
    faces.map((f) => { const nrm = norm(cross(sub(f[1], f[0]), sub(f[2], f[0]))); return { f, nrm, z: (f[0][2] + f[1][2] + f[2][2]) / 3 }; })
      .filter((o) => o.nrm[2] < 0.05).sort((a, b) => b.z - a.z)
      .forEach((o) => { const lam = 0.45 + 0.6 * Math.max(0, dot(o.nrm, L)); const c = K.mix('#3ccf9a', '#d8fff0', lam - 0.45); tri(ctx, proj(o.f[0]), proj(o.f[1]), proj(o.f[2]), K.rgba(c.map((v) => v * Math.min(1.1, lam + 0.3)))); });
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = 1 * s; ctx.restore();
  }

  // Faceted rocket: three visible body facets, coral nose and fins, flickering faceted flame.
  function rocket(ctx, x, y, h, t, firing) {
    const w = h * 0.22, s = sOf(ctx), r = K.rng(Math.floor(t * 18));
    if (firing) {
      for (let i = 0; i < 5; i++) { const fl = h * (0.35 + r() * 0.25) * (1 - i * 0.15), ww = w * (0.45 - i * 0.07); tri(ctx, [x - ww, y], [x + ww, y], [x + (r() - 0.5) * w * 0.3, y + fl], ['#ff5a4a', '#ff8a4a', '#ffb347', '#ffe08a', '#fff6d0'][i]); }
    }
    const top = y - h;
    tri(ctx, [x - w / 2, top + h * 0.3], [x - w / 6, top + h * 0.3], [x - w / 6, y], '#c9c0dc'); tri(ctx, [x - w / 2, top + h * 0.3], [x - w / 6, y], [x - w / 2, y], '#b4aacb');
    tri(ctx, [x - w / 6, top + h * 0.3], [x + w / 6, top + h * 0.3], [x + w / 6, y], '#efeaf7'); tri(ctx, [x - w / 6, top + h * 0.3], [x + w / 6, y], [x - w / 6, y], '#e2dcef');
    tri(ctx, [x + w / 6, top + h * 0.3], [x + w / 2, top + h * 0.3], [x + w / 2, y], '#fffaff'); tri(ctx, [x + w / 6, top + h * 0.3], [x + w / 2, y], [x + w / 6, y], '#f4effa');
    tri(ctx, [x, top], [x - w / 2, top + h * 0.3], [x - w / 6, top + h * 0.3], P.coral2); tri(ctx, [x, top], [x - w / 6, top + h * 0.3], [x + w / 6, top + h * 0.3], P.coral); tri(ctx, [x, top], [x + w / 6, top + h * 0.3], [x + w / 2, top + h * 0.3], '#ff9a86');
    tri(ctx, [x - w / 2, y - h * 0.22], [x - w * 1.05, y + h * 0.04], [x - w / 2, y], P.coral2); tri(ctx, [x + w / 2, y - h * 0.22], [x + w * 1.05, y + h * 0.04], [x + w / 2, y], P.coral);
    ctx.fillStyle = P.night; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * w * 0.2, top + h * 0.45 + Math.sin(a) * w * 0.2); } ctx.fill();
    ctx.fillStyle = '#7ad7ff'; ctx.beginPath(); for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; ctx[i ? 'lineTo' : 'moveTo'](x + Math.cos(a) * w * 0.13, top + h * 0.45 + Math.sin(a) * w * 0.13); } ctx.fill();
    void s;
  }
  // Faceted smoke column: irregular polygons expanding and drifting.
  function smoke(ctx, x, y, t, t0, s) {
    const n = 16, r = K.rng(5);
    for (let i = 0; i < n; i++) {
      const born = t0 + i * 0.12, age = t - born; if (age < 0) continue;
      const rr = (20 + age * 50 + r() * 10) * s, px = x + (r() - 0.5) * 90 * s * Math.min(1, age), py = y - i * 6 * s + age * 10 * s;
      const k = 7, rot = r() * 6;
      const verts = []; for (let j = 0; j < k; j++) { const a = rot + (j / k) * Math.PI * 2; verts.push([px + Math.cos(a) * rr * (0.8 + r() * 0.3), py + Math.sin(a) * rr * 0.75 * (0.8 + r() * 0.3)]); }
      for (let j = 0; j < k; j++) tri(ctx, [px, py], verts[j], verts[(j + 1) % k], K.rgba(mixc('#fff6f0', '#c9b0d8', 0.15 + (j / k) * 0.5 * (verts[j][1] > py ? 1 : 0.3))));
    }
  }

  const style = {
    id: 'low-poly', name: 'Low-Poly Faceted', family: 'Dimensional',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&display=block', specs: ['700 56px "Space Grotesk"', '500 28px "Space Grotesk"'] }],
    palette: { ...P },
    sfx: { draw: null, land: 'pluck', emphasis: 'stamp', transition: 'whoosh', bed: 'space' },

    background(ctx, W, H, t) {
      const cv = world(W, H), z = 1 + t * 0.004, ox = (cv.width * z - W) / 2 + Math.sin(t * 0.25) * 8, oy = (cv.height * z - H) / 2;
      ctx.drawImage(cv, -ox, -oy, cv.width * z, cv.height * z);
      // legibility veil at the top where the headline sits
      const g = ctx.createLinearGradient(0, 0, 0, H * 0.35); g.addColorStop(0, 'rgba(30,20,60,0.45)'); g.addColorStop(1, 'rgba(30,20,60,0)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H * 0.35);
    },
    finish(ctx, W, H, t) {
      // atmospheric haze band at the horizon, warm vignette, fine grain
      const hz = H * 0.5, g = ctx.createLinearGradient(0, hz - H * 0.12, 0, hz + H * 0.12);
      g.addColorStop(0, 'rgba(255,190,170,0)'); g.addColorStop(0.5, 'rgba(255,190,170,0.10)'); g.addColorStop(1, 'rgba(255,190,170,0)');
      ctx.fillStyle = g; ctx.fillRect(0, hz - H * 0.12, W, H * 0.24);
      K.vignette(ctx, W, H, 0.28, '#1a1030');
      K.grain(ctx, W, H, t, 0.035, 24, 'overlay');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 56) * s, lines = String(text).split('\n'), lh = size * 1.08;
      ctx.save(); ctx.font = K.font(size, FONT, 700); ctx.textBaseline = 'alphabetic';
      let wMax = 0;
      lines.forEach((l, li) => {
        const w = ctx.measureText(l).width; wMax = Math.max(wMax, w);
        const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, ly = y + li * lh;
        // facets of the reveal: the line is uncovered by a slanted clip sweeping across
        const q = K.clamp(p * (lines.length + 0.5) - li * 0.8);
        if (q <= 0) return;
        ctx.save(); ctx.beginPath(); const sx = x0 - size + (w + size * 2) * K.ease.out(q); ctx.moveTo(x0 - size, ly - size * 1.2); ctx.lineTo(sx + size * 0.4, ly - size * 1.2); ctx.lineTo(sx - size * 0.4, ly + size * 0.4); ctx.lineTo(x0 - size, ly + size * 0.4); ctx.clip();
        ctx.fillStyle = 'rgba(20,10,40,0.35)'; ctx.fillText(l, x0 + 3 * s, ly + 4 * s);
        ctx.fillStyle = o.color || '#ffffff'; ctx.fillText(l, x0, ly);
        ctx.restore();
      });
      if (o.bar !== false) {
        const bw = Math.min(wMax * 0.4, 220 * s) * K.ease.out(K.clamp(p * 1.5 - 0.2)), by = y + (lines.length - 1) * lh + size * 0.32;
        const bx = o.align === 'center' ? x - bw / 2 : x;
        tri(ctx, [bx, by], [bx + bw, by], [bx + bw - 8 * s, by + 8 * s], P.coral); tri(ctx, [bx, by], [bx + bw - 8 * s, by + 8 * s], [bx - 8 * s, by + 8 * s], P.coral2);
      }
      ctx.restore();
      return { w: wMax, h: lh * lines.length };
    },
    // Cut-corner tag: cream facets, coral notch, indigo lettering.
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 28) * s, k = K.ease.back(K.clamp(p)); if (k <= 0.01) return { w: 0, h: 0 };
      ctx.save(); ctx.font = K.font(size, FONT, 700);
      const tw = ctx.measureText(text).width, padL = size * 1.05, w = padL + tw + size * 0.6, h = size * 1.6, c = size * 0.42;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - h / 2;
      ctx.translate(x0, y); ctx.scale(1, k); ctx.translate(-x0, -y);
      ctx.fillStyle = 'rgba(20,10,40,0.35)'; chamfer(ctx, x0 + 4 * s, y0 + 6 * s, w, h, c); ctx.fill();
      facetFill(ctx, chamferVerts(x0, y0, w, h, c), P.cream, (o.seed || 1) + text.length);
      tri(ctx, [x0 + c * 0.7, y0 + h * 0.3], [x0 + c * 0.7, y0 + h * 0.7], [x0 + c * 0.7 + size * 0.35, y0 + h * 0.5], o.color || P.coral);
      ctx.fillStyle = P.ink; ctx.textBaseline = 'middle'; ctx.fillText(text, x0 + padL, y + size * 0.04);
      ctx.restore();
      return { w, h };
    },
    // Angular two-tone ribbon arrow: straight segments with a 45 degree elbow, lit top half, shaded bottom half.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), w = (o.width || 10) * s, col = o.color || P.coral;
      const dx = to[0] - from[0], dy = to[1] - from[1], ex = Math.abs(dx) > Math.abs(dy);
      const mid = ex ? [from[0] + dx * (o.elbow ?? 0.35), from[1]] : [from[0], from[1] + dy * (o.elbow ?? 0.35)];
      const mid2 = ex ? [mid[0] + Math.abs(dy) * Math.sign(dx) * 0.9, to[1]] : [to[0], mid[1] + Math.abs(dx) * Math.sign(dy) * 0.9];
      let pts = [from, mid, mid2, to];
      if (ex && Math.abs(mid2[0] - from[0]) > Math.abs(dx)) pts = [from, [from[0] + dx * 0.5, from[1] + dy * 0.5], to];
      const q = K.trim(pts, K.clamp(p)); if (q.length < 2) return null;
      const hl = 20 * s, end = q[q.length - 1], prev = q[q.length - 2], a = Math.atan2(end[1] - prev[1], end[0] - prev[0]);
      const tip = p > 0.98 ? end : null, body = tip ? K.trim(q, Math.max(0, 1 - hl / K.pathLen(q))) : q;
      ctx.save(); ctx.lineJoin = 'miter'; ctx.lineCap = 'butt';
      ctx.strokeStyle = K.rgba(mixc(col, '#1a1030', 0.35)); ctx.lineWidth = w; K.poly(ctx, body); ctx.stroke();
      ctx.save(); ctx.translate(0, -w * 0.25); ctx.strokeStyle = col; ctx.lineWidth = w * 0.5; K.poly(ctx, body); ctx.stroke(); ctx.restore();
      if (tip) {
        const b0 = [end[0] - Math.cos(a) * hl, end[1] - Math.sin(a) * hl], nx = -Math.sin(a) * hl * 0.6, ny = Math.cos(a) * hl * 0.6;
        tri(ctx, end, [b0[0] - nx, b0[1] - ny], b0, col); tri(ctx, end, b0, [b0[0] + nx, b0[1] + ny], K.rgba(mixc(col, '#1a1030', 0.35)));
      }
      ctx.restore();
      return end;
    },
    // Box: chamfered faceted panel (deep indigo glass) with a lit top edge.
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), k = K.ease.out(K.clamp(p)); if (k <= 0.01) return;
      const c = 18 * s;
      ctx.save(); ctx.translate(x + w / 2, y + h / 2); ctx.scale(k, k); ctx.translate(-(x + w / 2), -(y + h / 2));
      ctx.fillStyle = 'rgba(15,8,35,0.35)'; chamfer(ctx, x + 6 * s, y + 10 * s, w, h, c); ctx.fill();
      facetFill(ctx, chamferVerts(x, y, w, h, c), o.color || '#3a2d6b', o.seed || 7, 0.92);
      ctx.strokeStyle = 'rgba(255,214,190,0.6)'; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(x, y + c); ctx.lineTo(x + c, y); ctx.lineTo(x + w - c, y); ctx.lineTo(x + w, y + c); ctx.stroke();
      ctx.restore();
    },
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 110) * s, txt = K.fmt(value);
      ctx.save(); ctx.font = K.font(size, FONT, 700); ctx.textAlign = o.align || 'center';
      ctx.fillStyle = 'rgba(20,10,40,0.4)'; ctx.fillText(txt, x + 4 * s, y + 6 * s);
      const g = ctx.createLinearGradient(0, y - size, 0, y); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#fff1e0'); g.addColorStop(0.51, '#ffd0b8'); g.addColorStop(1, '#ffb08a');
      ctx.fillStyle = g; ctx.fillText(txt, x, y);
      ctx.restore();
      return { w: 0, h: size };
    },
    // Emphasis: two-tone crystal shards bursting out and a faceted ring settling.
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return; const rr = K.rng(o.seed || 9), k = K.ease.out(K.clamp(p));
      ctx.save(); ctx.globalAlpha = K.clamp(2 - p * 1.6);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2 + rr() * 0.2, d0 = r * 0.6 * k, d1 = r * (0.85 + rr() * 0.35) * k, wa = 0.06 + rr() * 0.04;
        const A = [x + Math.cos(a) * d1, y + Math.sin(a) * d1 * 0.6], B = [x + Math.cos(a - wa) * d0, y + Math.sin(a - wa) * d0 * 0.6], Cc = [x + Math.cos(a + wa) * d0, y + Math.sin(a + wa) * d0 * 0.6];
        const M = [(B[0] + Cc[0]) / 2, (B[1] + Cc[1]) / 2];
        tri(ctx, A, B, M, i % 2 ? P.coral : '#7fffd0'); tri(ctx, A, M, Cc, i % 2 ? P.coral2 : P.mint);
      }
      ctx.globalAlpha = 1; ctx.strokeStyle = '#ffe1c8'; ctx.lineWidth = 3 * s;
      const n = 10; ctx.beginPath(); for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2 * k; const pt = [x + Math.cos(a - Math.PI / 2) * r * 0.62, y + Math.sin(a - Math.PI / 2) * r * 0.62 * 0.6]; i ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1]); } ctx.stroke();
      ctx.restore();
    },
    // Scene change: a field of dawn-coloured triangles flips into place across the frame, then flips away.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), e = 110 * s, hgt = e * 0.866, rr = K.rng(13);
      for (let row = -1; row * hgt < H + hgt; row++) for (let col = -1; col * e / 2 < W + e; col++) {
        const up = (row + col) % 2 === 0, x0 = col * e / 2, y0 = row * hgt;
        const A = up ? [x0, y0 + hgt] : [x0, y0], B = up ? [x0 + e / 2, y0] : [x0 + e / 2, y0 + hgt], Cc = up ? [x0 + e, y0 + hgt] : [x0 + e, y0];
        const cx = (A[0] + B[0] + Cc[0]) / 3, cy = (A[1] + B[1] + Cc[1]) / 3, d = (cx / W) * 0.7 + rr() * 0.15;
        const k = p < 0.5 ? K.clamp((p * 2 - d * 0.8) / 0.22) : 1 - K.clamp(((p - 0.5) * 2 - d * 0.8) / 0.22);
        if (k <= 0.01) continue;
        const sx = Math.cos((1 - k) * Math.PI / 2); // flip: squash about the vertical axis
        const f = (q) => [cx + (q[0] - cx) * sx * 1.02, cy + (q[1] - cy) * 1.02];
        const yy = cy / H, base = yy < 0.4 ? mixc(P.night, P.violet, yy / 0.4) : yy < 0.75 ? mixc(P.violet, P.mauve, (yy - 0.4) / 0.35) : mixc(P.mauve, P.peach, (yy - 0.75) / 0.25);
        tri(ctx, f(A), f(B), f(Cc), K.rgba(mixc(base, up ? '#ffffff' : '#000000', 0.04 + rr() * 0.08)));
      }
    },
    crystal, rocket,
  };

  // ---------- the shared demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [P.coral, P.mint, P.coral, P.mint, '#7ad7ff', P.mint, '#7ad7ff'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, portrait: false, title: [W / 2, 96 * s], card: [90 * s, 300 * s, 250 * s, 160 * s], crys: [540 * s, 360 * s], cr: 62 * s,
      chips: PLATFORMS.map((n, i) => [890 * s, (190 + i * 72) * s]), rocket: [330 * s, 610 * s], rh: 240 * s, counter: [850 * s, 400 * s], take: [W / 2, 96 * s] };
    return { s, portrait: true, title: [W / 2, H * 0.09], card: [W * 0.08, H * 0.2, W * 0.42, H * 0.11], crys: [W * 0.72, H * 0.33], cr: 54 * s,
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.53 : W * 0.47, H * (0.605 + Math.floor(i / 2) * 0.08)]), rocket: [W * 0.5, H * 0.9], rh: 300 * s, counter: [W / 2, H * 0.33], take: [W / 2, H * 0.12] };
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.15, 1.2, 'lin'), { align: 'center', size: portrait ? 52 : 56 });
        const [vx, vy, vw, vh] = Lo.card;
        style.box(ctx, vx, vy, vw, vh, K.beat(t, 2.0, 0.6), { seed: 3 });
        if (t > 2.4) {
          const k = K.ease.back(K.beat(t, 2.4, 0.5)), cx = vx + vw / 2, cy = vy + vh / 2, r = Math.min(vw, vh) * 0.26 * k;
          tri(ctx, [cx - r * 0.6, cy - r], [cx - r * 0.6, cy], [cx + r, cy], P.coral); tri(ctx, [cx - r * 0.6, cy], [cx - r * 0.6, cy + r], [cx + r, cy], P.coral2);
        }
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 40 * s, K.beat(t, 2.8, 0.4), { align: 'center', color: P.coral });
        const [cx, cy] = Lo.crys;
        const a1 = portrait ? [[vx + vw + 14 * s, vy + vh / 2], [cx - Lo.cr * 1.4, cy - 10 * s]] : [[vx + vw + 14 * s, vy + vh / 2], [cx - Lo.cr * 1.4, cy]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.4, 0.7, 'inOut'), { elbow: 0.4 });
        crystal(ctx, cx, cy, Lo.cr, t, K.beat(t, 4.0, 0.7, 'lin'));
        style.label(ctx, 'Creator OS', cx, cy + Lo.cr * 1.9, K.beat(t, 4.5, 0.4), { align: 'center', size: 38, color: P.mint });
        if (portrait) style.arrow(ctx, [cx, cy + Lo.cr * 2.5], [W / 2, Lo.chips[6][1] + 20 * s], K.beat(t, 4.9, 0.5, 'inOut'), { elbow: 0.03, width: 9 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [lx, ly] = Lo.chips[i], left = i % 2 === 0;
          const from = portrait ? [W / 2, ly] : [cx + Lo.cr * 1.2, cy + (i - 3) * 9 * s];
          const to = portrait ? [left ? W * 0.465 : W * 0.535, ly] : [lx - 12 * s, ly];
          style.arrow(ctx, from, to, K.beat(t, t0, 0.35, 'out'), { elbow: portrait ? 0.5 : 0.15 + Math.abs(i - 3) * 0.02, width: 8, color: COLS[i] });
          style.label(ctx, name, lx, ly, K.beat(t, t0 + 0.25, 0.3), { color: COLS[i], align: portrait ? (left ? 'right' : 'left') : 'left', seed: i });
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      } else {
        // lift-off: the crystal rides the rocket nose as Creator OS, the counter climbs with it
        const lift = K.ease.in(K.clamp((t - 8.7) / 3.3)) * (portrait ? 420 : 260) * s;
        const [rx, ry] = Lo.rocket;
        if (t > 8.6) smoke(ctx, rx, ry, t, 8.6, s);
        rocket(ctx, rx, ry - lift, Lo.rh, t, t > 8.6);
        crystal(ctx, rx, ry - lift - Lo.rh - 40 * s, 26 * s, t, 1);
        style.label(ctx, 'Creator OS', portrait ? rx + 70 * s : rx - 60 * s, ry - lift - Lo.rh * 0.62, 1, { size: 30, color: P.mint, align: portrait ? 'left' : 'right' });
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 36 * s, (portrait ? 300 : 340) * s, K.beat(t, 10.0, 1.0), {});
        const pw = (portrait ? 560 : 600) * s, ph = 190 * s;
        style.box(ctx, Lo.counter[0] - pw / 2, Lo.counter[1] - 120 * s, pw, ph, K.beat(t, 8.3, 0.4), { seed: 11 });
        style.counter(ctx, v, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 88 : 104 });
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 70 * s, K.beat(t, 8.7, 0.4), { align: 'center', size: 32, color: P.coral });
        style.title(ctx, portrait ? 'Post once.\nReach everywhere.' : 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 0.9, 'lin'), { align: 'center', size: portrait ? 52 : 54 });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('space', 0, 12, 0.9);
      k.play('whoosh', 0.15, { dur: 0.9, gain: 0.5 }); k.play('pluck', 1.0, { note: 'E5' });
      k.play('pluck', 2.0, { note: 'A4' }); k.play('pop', 2.45, { pitch: 0.8 }); k.play('pluck', 2.85, { note: 'C5', gain: 0.8 });
      k.play('whoosh', 3.4, { dur: 0.7, gain: 0.45 });
      k.play('riser', 3.9, { dur: 0.6, gain: 0.5 }); k.play('chime', 4.5, { note: 'E5', gain: 0.7 });
      const notes = ['A4', 'C5', 'D5', 'E5', 'G5', 'A5', 'C6'];
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.3, gain: 0.25 }); k.play('pluck', 5.25 + i * 0.4, { note: notes[i] }); }
      k.play('whoosh', 7.6, { dur: 0.6 }); for (let i = 0; i < 8; i++) k.play('click', 7.65 + i * 0.07, { pitch: 0.7 + i * 0.05, gain: 0.5 });
      k.play('whoosh', 8.3, { dur: 0.6, up: false });
      k.play('thud', 8.6, { gain: 0.6 }); k.play('riser', 8.6, { dur: 3.0, gain: 0.45 });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0); k.play('chime', 11.3, { note: 'A5' });
    },
  };
  MS.register(style);
})();
