// Voxel Diorama (Dimensional). MagicaVoxel-style toy world: every object is a stack of unit cubes in true isometric
// projection with three-tone faces, per-face ambient occlusion in the creases, ray-marched grid shadows baked onto the
// grass, per-voxel colour jitter, extruded pixel-voxel lettering, cube-chain arrows and a voxel-rain scene change.
(function () {
  const P = { bg: '#fde6cf', bg2: '#f6c39c', ink: '#4a2f22', grass: '#9fcb55', grass2: '#86b844', dirt: '#a0673f', dirt2: '#74432d',
    rock: '#b9b3ad', rock2: '#8f8a86', water: '#5fc4ea', orange: '#ff8a3d', red: '#ff5a4f', cream: '#fff4e2', dark: '#4a4458',
    navy: '#2b2d42', cyan: '#7ff9ff', yellow: '#ffd23f', trunk: '#8a5a3c', leaf: '#5fae4a', leaf2: '#7cc35a' };
  const FONT = 'Silkscreen';
  const C = Math.cos(Math.PI / 6);
  const S = (W, H) => K.layout(W, H).s;
  const sOf = (ctx) => S(ctx.canvas.width, ctx.canvas.height);
  const tone = (col, k) => K.rgba(k >= 0 ? K.mix(col, '#fff7ea', k) : K.mix(col, '#2a1a24', -k));

  // ---------- cube rendering ----------
  // Draw one unit cube at grid (x,y,z) relative to screen origin (X,Y) with cube size c.
  // faces bitmask: 1 top, 2 right(+x), 4 left(+y); ao = [top, right, left] darkening 0..1.
  function cube(ctx, X, Y, c, x, y, z, col, faces = 7, ao = [0, 0, 0], jit = 0) {
    const ox = X + (x - y) * C * c, oy = Y + (x + y) * 0.5 * c - z * c;
    const ex = [C * c, 0.5 * c], ey = [-C * c, 0.5 * c];
    const base = jit ? K.mix(col, jit > 0 ? '#ffffff' : '#000000', Math.abs(jit)) : col;
    const q = (pts, f) => { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (let i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); ctx.fillStyle = f; ctx.fill(); };
    const tx = ox, ty = oy - c; // top-face back corner
    if (faces & 4) q([ox + ey[0], oy + ey[1], ox + ey[0] + ex[0], oy + ey[1] + ex[1], ox + ey[0] + ex[0], oy + ey[1] + ex[1] - c, ox + ey[0], oy + ey[1] - c], tone(base, -0.2 - ao[2] * 0.25));
    if (faces & 2) q([ox + ex[0], oy + ex[1], ox + ex[0] + ey[0], oy + ex[1] + ey[1], ox + ex[0] + ey[0], oy + ex[1] + ey[1] - c, ox + ex[0], oy + ex[1] - c], tone(base, -0.36 - ao[1] * 0.25));
    if (faces & 1) {
      q([tx, ty, tx + ex[0], ty + ex[1], tx + ex[0] + ey[0], ty + ex[1] + ey[1], tx + ey[0], ty + ey[1]], tone(base, 0.06 - ao[0] * 0.3));
      // bright bevel on the two front top edges (the MagicaVoxel edge catch)
      ctx.strokeStyle = 'rgba(255,250,235,0.28)'; ctx.lineWidth = Math.max(1, c * 0.07);
      ctx.beginPath(); ctx.moveTo(tx + ey[0], ty + ey[1]); ctx.lineTo(tx + ex[0] + ey[0], ty + ex[1] + ey[1]); ctx.lineTo(tx + ex[0], ty + ex[1]); ctx.stroke();
    }
  }
  // A voxel model: Map "x,y,z" -> colour. Returns sorted draw list with culled faces, AO and baked shadows.
  function bake(model, light = [-1, -0.6, 1.3]) {
    const has = (x, y, z) => model.has(x + ',' + y + ',' + z);
    const list = [], r = K.rng(5);
    for (const [k, col] of model) {
      const [x, y, z] = k.split(',').map(Number);
      let faces = 0;
      if (!has(x, y, z + 1)) faces |= 1; if (!has(x + 1, y, z)) faces |= 2; if (!has(x, y + 1, z)) faces |= 4;
      if (!faces) continue;
      const n = (a, b, c2) => (has(a, b, c2) ? 1 : 0);
      const aoT = (n(x - 1, y, z + 1) + n(x, y - 1, z + 1) + n(x + 1, y, z + 1) + n(x, y + 1, z + 1)) * 0.25;
      const aoR = (n(x + 1, y - 1, z) + n(x + 1, y + 1, z) + n(x + 1, y, z + 1) + n(x + 1, y, z - 1) * 0.3) * 0.3;
      const aoL = (n(x - 1, y + 1, z) + n(x + 1, y + 1, z) + n(x, y + 1, z + 1) + n(x, y + 1, z - 1) * 0.3) * 0.3;
      // ray-march toward the light from the top face: any voxel hit = shadowed top
      let sh = 0;
      if (faces & 1) for (let i = 1; i < 14; i++) { if (has(Math.round(x + light[0] * i * 0.5), Math.round(y + light[1] * i * 0.5), Math.round(z + light[2] * i * 0.5))) { sh = 1; break; } }
      list.push({ x, y, z, col, faces, ao: [Math.min(1, aoT + sh * 0.9), aoR, aoL], jit: (r() - 0.5) * 0.08 });
    }
    list.sort((a, b) => a.x + a.y + a.z - (b.x + b.y + b.z) || a.z - b.z);
    return list;
  }
  function drawList(ctx, list, X, Y, c, filter) { for (const v of list) if (!filter || filter(v)) cube(ctx, X, Y, c, v.x, v.y, v.z, v.col, v.faces, v.ao, v.jit); }
  // Render a baked model into a cached canvas; returns {cv, ox, oy} where (ox,oy) is the grid origin in the canvas.
  function modelCanvas(key, list, c) {
    return K.cached(key, () => {
      let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (const v of list) { const sx = (v.x - v.y) * C * c, sy = (v.x + v.y) * 0.5 * c - v.z * c; x0 = Math.min(x0, sx - C * c * 1.1); x1 = Math.max(x1, sx + C * c * 1.1); y0 = Math.min(y0, sy - c * 1.2); y1 = Math.max(y1, sy + c * 1.2); }
      const cv = K.layer(x1 - x0 + 4, y1 - y0 + 4), x = cv.getContext('2d');
      drawList(x, list, -x0 + 2, -y0 + 2, c);
      return { cv, ox: -x0 + 2, oy: -y0 + 2 };
    });
  }

  // ---------- the island model ----------
  function islandModel() {
    return K.cached('vx-island', () => {
      const m = new Map(), nz = K.noise(12), R = 8, set = (x, y, z, c) => m.set(x + ',' + y + ',' + z, c);
      for (let x = -R; x <= R; x++) for (let y = -R; y <= R; y++) {
        const d = Math.hypot(x, y) + nz.n2(x * 0.4, y * 0.4) * 1.2;
        if (d > R) continue;
        const depth = Math.round((R - d) * 0.9 + 1 + nz.n2(x * 0.7 + 5, y * 0.7) * 1.5);
        for (let z = -depth; z <= 0; z++) {
          const col = z === 0 ? ((x * 7 + y * 3) % 5 === 0 ? P.grass2 : P.grass) : z >= -2 ? (z === -1 ? P.dirt : P.dirt2) : ((x + y + z) % 3 === 0 ? P.rock2 : P.rock);
          set(x, y, z, col);
        }
      }
      // pond: carve water one level down
      for (let x = -6; x <= -2; x++) for (let y = 2; y <= 6; y++) if (Math.hypot(x + 4, y - 4) < 2.4 && m.has(x + ',' + y + ',0')) { m.delete(x + ',' + y + ',0'); set(x, y, -1, P.water); }
      // trees
      const tree = (tx, ty, h) => { for (let z = 1; z <= h; z++) set(tx, ty, z, P.trunk); for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) for (let z = h + 1; z <= h + 3; z++) if (!(Math.abs(x) + Math.abs(y) === 2 && z === h + 3)) set(tx + x, ty + y, z, (x + y + z) % 2 ? P.leaf : P.leaf2); };
      tree(-5, -2, 2); tree(4, -5, 3); tree(5, 3, 2);
      // flowers
      for (const [x, y, c] of [[2, 5, P.red], [-1, 6, P.yellow], [6, -1, P.red], [-6, 1, P.yellow]]) set(x, y, 1, c);
      // robot body (Creator OS): cream body, orange head cap, dark visor on the +y face
      for (let x = -1; x <= 1; x++) for (let y = -1; y <= 1; y++) {
        for (let z = 1; z <= 2; z++) set(x, y, z, P.dark);           // legs / base
        for (let z = 3; z <= 6; z++) set(x, y, z, P.cream);          // torso
        for (let z = 7; z <= 9; z++) set(x, y, z, z === 9 ? P.orange : P.cream); // head
      }
      for (let x = -1; x <= 1; x++) set(x, 1, 8, P.navy);              // visor row on the left (+y) face
      set(0, 1, 5, P.orange); set(0, 1, 4, P.orange);                  // chest light
      set(0, 0, 10, P.dark); set(0, 0, 11, P.red);                     // antenna
      return m;
    });
  }
  function tvModel() {
    return K.cached('vx-tv', () => {
      const m = new Map(), set = (x, y, z, c) => m.set(x + ',' + y + ',' + z, c);
      const pix = ['#######', '#.....#', '#.o...#', '#.oo..#', '#.ooo.#', '#.oo..#', '#.o...#', '#######'];
      for (let x = 0; x < 7; x++) for (let y = 0; y < 3; y++) for (let z = 0; z < 8; z++) {
        const ch = pix[7 - z][x];
        set(x, y, z + 1, y < 2 ? P.cream : ch === '#' ? P.dark : ch === 'o' ? P.orange : P.navy);
      }
      set(2, 1, 0, P.dark); set(4, 1, 0, P.dark);
      return m;
    });
  }

  // ---------- pixel-voxel lettering (Silkscreen sampled to a 5-row pixel grid, each pixel an extruded block) ----------
  function pixelMask(text) {
    return K.cached('vx-mask:' + text, () => {
      const F = 16, k = 2, c = K.layer(text.length * 14 + 8, 24), x = c.getContext('2d');
      x.font = `400 ${F}px "${FONT}"`; x.textBaseline = 'top'; x.fillStyle = '#000'; x.fillText(text, 2, 2);
      const gw = Math.ceil((x.measureText(text).width + 4) / k), gh = 10, d = x.getImageData(0, 0, gw * k, gh * k).data, on = [];
      let minY = 99, maxY = 0, maxX = 0;
      for (let gy = 0; gy < gh; gy++) for (let gx = 0; gx < gw; gx++) { const a = d[((gy * k + 1) * gw * k + gx * k + 1) * 4 + 3]; if (a > 128) { on.push([gx, gy]); minY = Math.min(minY, gy); maxY = Math.max(maxY, gy); maxX = Math.max(maxX, gx); } }
      return { on: on.map(([gx, gy]) => [gx - 1, gy - minY]), w: maxX, h: maxY - minY + 1 };
    });
  }
  // Pre-rendered extruded pixel text: one bevelled block per pixel with a darker extrusion behind.
  function voxTextCanvas(text, q, col) {
    return K.cached(`vx-text:${text}:${q}:${col}`, () => {
      const m = pixelMask(text), dep = q * 0.55, cv = K.layer((m.w + 2) * q + dep + 4, (m.h + 1) * q + dep + 4), x = cv.getContext('2d');
      for (const [gx, gy] of m.on) { // extrusion (side + bottom faces)
        const px = gx * q + 2, py = gy * q + 2;
        x.fillStyle = tone(col, -0.45); x.beginPath(); x.moveTo(px + q, py); x.lineTo(px + q + dep, py + dep); x.lineTo(px + q + dep, py + q + dep); x.lineTo(px + q, py + q); x.fill();
        x.fillStyle = tone(col, -0.3); x.beginPath(); x.moveTo(px, py + q); x.lineTo(px + q, py + q); x.lineTo(px + q + dep, py + q + dep); x.lineTo(px + dep, py + q + dep); x.fill();
      }
      for (const [gx, gy] of m.on) { // front faces with a bevel
        const px = gx * q + 2, py = gy * q + 2;
        x.fillStyle = col; x.fillRect(px, py, q, q);
        x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillRect(px, py, q, q * 0.16); x.fillRect(px, py, q * 0.16, q);
        x.fillStyle = 'rgba(40,20,10,0.16)'; x.fillRect(px, py + q * 0.84, q, q * 0.16); x.fillRect(px + q * 0.84, py, q * 0.16, q);
      }
      return { cv, w: (m.w + 1) * q, h: m.h * q, cols: m.w + 1, q };
    });
  }
  // Draw voxel text with blocks dropping in column by column (p 0..1).
  function voxText(ctx, text, x, y, q, col, p, align = 'center') {
    const vt = voxTextCanvas(text, q, col), x0 = align === 'center' ? x - vt.w / 2 : align === 'right' ? x - vt.w : x, y0 = y - vt.h;
    if (p >= 1) { ctx.drawImage(vt.cv, x0, y0); return vt; }
    for (let i = 0; i < vt.cols; i++) {
      const k = K.clamp(p * (vt.cols * 0.35 + 6) / 6 - (i * 0.35) / 6); if (k <= 0) continue;
      const dy = (1 - K.ease.bounce(k)) * -120 * (q / 8);
      ctx.drawImage(vt.cv, i * q + 2, 0, q + q * 0.6, vt.cv.height, x0 + i * q, y0 + dy - 2, q + q * 0.6, vt.cv.height);
    }
    return vt;
  }

  const style = {
    id: 'voxel', name: 'Voxel Diorama', family: 'Dimensional',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=Silkscreen:wght@400;700&display=block', specs: ['400 16px "Silkscreen"', '400 30px "Silkscreen"', '700 30px "Silkscreen"'] }],
    palette: { ...P },
    sfx: { draw: null, land: 'click', emphasis: 'stamp', transition: 'thud', bed: 'room' },

    background(ctx, W, H, t) {
      const g = ctx.createLinearGradient(0, 0, 0, H);
      g.addColorStop(0, '#fff0de'); g.addColorStop(0.6, P.bg); g.addColorStop(1, P.bg2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      const r = ctx.createRadialGradient(W * 0.62, H * 0.42, 0, W * 0.62, H * 0.42, Math.max(W, H) * 0.6);
      r.addColorStop(0, 'rgba(255,252,240,0.65)'); r.addColorStop(1, 'rgba(255,252,240,0)');
      ctx.fillStyle = r; ctx.fillRect(0, 0, W, H);
      // floating grass cubes bobbing at different depths
      const s = S(W, H), rr = K.rng(21);
      for (let i = 0; i < 5; i++) {
        const x = rr.range(0.04, 0.96) * W, y = rr.range(0.25, 0.92) * H + Math.sin(t * 1.2 + i * 1.7) * 7 * s, c = rr.range(12, 22) * s;
        cube(ctx, x, y, c, 0, 0, 0, P.dirt, 6); cube(ctx, x, y - c * 0.28, c, 0, 0, 0, P.grass, 1);
      }
    },

    finish(ctx, W, H, t) {
      // warm bloom from the key light, tilt-shift style darkening at the top and bottom, soft grain
      ctx.save(); ctx.globalCompositeOperation = 'soft-light';
      const g = ctx.createRadialGradient(W * 0.6, H * 0.35, 0, W * 0.6, H * 0.35, Math.max(W, H) * 0.7);
      g.addColorStop(0, 'rgba(255,240,210,0.5)'); g.addColorStop(1, 'rgba(120,60,40,0.35)');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); ctx.restore();
      K.vignette(ctx, W, H, 0.16, '#7a3f22');
      K.grain(ctx, W, H, t, 0.03, 24, 'soft-light');
    },

    title(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), lines = String(text).toUpperCase().split('\n');
      const q = Math.round((o.size || 56) * s / 8 * 10) / 10, lh = q * 8.2;
      let w = 0;
      lines.forEach((l, i) => { const k = K.clamp(p * lines.length - i); if (k > 0) w = Math.max(w, voxText(ctx, l, x, y + i * lh, q, o.color || P.orange, k, o.align || 'center').w); });
      return { w, h: lh * lines.length };
    },
    // Label: an extruded cream block tag with a coloured cube icon and Silkscreen lettering.
    label(ctx, text, x, y, p, o = {}) {
      const s = sOf(ctx), size = (o.size || 28) * s, k = K.ease.back(K.clamp(p)); if (k <= 0.01) return { w: 0, h: 0 };
      ctx.save(); ctx.font = `700 ${size}px "${FONT}"`;
      const tw = ctx.measureText(text).width, ic = size * 0.9, pad = size * 0.45, w = pad + ic + pad * 0.8 + tw + pad, h = size * 1.6, dep = size * 0.3;
      const x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x, y0 = y - h / 2 - (1 - K.clamp(p)) * 30 * s;
      ctx.translate(x0 + w / 2, y0 + h / 2); ctx.scale(k, k); ctx.translate(-(x0 + w / 2), -(y0 + h / 2));
      ctx.fillStyle = 'rgba(110,50,20,0.16)'; ctx.fillRect(x0 + dep * 1.6, y0 + h + dep * 0.8, w, dep * 0.9);
      ctx.fillStyle = tone(P.cream, -0.32); ctx.beginPath(); ctx.moveTo(x0 + w, y0); ctx.lineTo(x0 + w + dep, y0 + dep); ctx.lineTo(x0 + w + dep, y0 + h + dep); ctx.lineTo(x0 + w, y0 + h); ctx.fill();
      ctx.fillStyle = tone(P.cream, -0.2); ctx.beginPath(); ctx.moveTo(x0, y0 + h); ctx.lineTo(x0 + w, y0 + h); ctx.lineTo(x0 + w + dep, y0 + h + dep); ctx.lineTo(x0 + dep, y0 + h + dep); ctx.fill();
      ctx.fillStyle = P.cream; ctx.fillRect(x0, y0, w, h);
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(x0, y0, w, h * 0.08);
      const cx = x0 + pad + ic / 2, cy = y0 + h / 2 + ic * 0.25;
      cube(ctx, cx, cy - ic * 0.25, ic * 0.62, 0, 0, 0, o.color || P.orange, 7);
      ctx.fillStyle = P.ink; ctx.textBaseline = 'middle'; ctx.fillText(String(text).toUpperCase(), x0 + pad + ic + pad * 0.8, y0 + h / 2 + size * 0.05);
      ctx.restore();
      return { w, h };
    },
    // Arrow: a chain of little cubes hopping into place along the path, an orange head cube at the end.
    arrow(ctx, from, to, p, o = {}) {
      const s = sOf(ctx), pts = K.arcPts(from, to, o.bend ?? 0.15, 80), L = K.pathLen(pts), step = (o.step || 22) * s, n = Math.max(2, Math.floor(L / step));
      let last = null;
      for (let i = 0; i <= n; i++) {
        const u = i / n, k = K.clamp((p * (n + 3) - i) / 3); if (k <= 0) continue;
        const pt = K.trim(pts, u).pop(), c = (i === n ? 13 : 8) * s, hop = Math.sin(K.clamp(k) * Math.PI) * 10 * s * (k < 1 ? 1 : 0);
        cube(ctx, pt[0], pt[1] - hop + c * 0.5, c, 0, 0, 0, i === n ? (o.color || P.orange) : (i % 2 ? P.cream : (o.color || P.orange)), 7);
        last = pt;
      }
      return last;
    },
    // Box: a raised voxel slab (cream top, dirt sides) footprint matching the rect.
    box(ctx, x, y, w, h, p, o = {}) {
      const s = sOf(ctx), c = (o.cell || 16) * s, k = K.clamp(p);
      const nx = Math.max(2, Math.round(w / (C * c * 2))), ny = nx, X = x + w / 2, Y = y + h / 2 - nx * 0.5 * c;
      for (let i = 0; i < nx; i++) for (let j = 0; j < ny; j++) {
        const kk = K.clamp(k * 2 - ((i + j) / (nx + ny)) * 1.0); if (kk <= 0) continue;
        const drop = (1 - K.ease.bounce(kk)) * 80 * s;
        cube(ctx, X, Y - drop, c, i - nx / 2, j - ny / 2, 0, o.color || P.cream, 7, [0, 0, 0], ((i * 7 + j * 3) % 5) * 0.012);
      }
    },
    // Counter: extruded pixel-voxel numerals.
    counter(ctx, value, x, y, p, o = {}) {
      const s = sOf(ctx), q = Math.round(((o.size || 100) * s) / 6.5);
      return voxText(ctx, K.fmt(value), x, y, q, o.color || P.orange, 1, o.align || 'center');
    },
    // Emphasis: a burst of cubes flung outward and a star of yellow blocks.
    emphasis(ctx, x, y, r, p, o = {}) {
      const s = sOf(ctx); if (p <= 0) return; const rr = K.rng(o.seed || 3);
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2 + rr() * 0.3, sp = r * (0.7 + rr() * 0.6), k = K.ease.out(K.clamp(p * 1.3));
        const gx = x + Math.cos(a) * sp * k, gy = y + Math.sin(a) * sp * k * 0.75 + p * p * 120 * s;
        const c = (8 + rr() * 8) * s * (1 - K.clamp((p - 0.6) / 0.4));
        if (c > 0.5) cube(ctx, gx, gy, c, 0, 0, 0, [P.yellow, P.orange, P.grass, P.red, P.cyan][i % 5], 7);
      }
    },
    // Scene change: big voxels rain down and stack until they cover the frame, then the floor drops away.
    transition(ctx, W, H, p, o = {}) {
      const s = S(W, H), c = 70 * s, rr = K.rng(77), cols = [P.grass, P.grass2, P.dirt, P.rock, P.cream, P.orange];
      const list = [];
      const ni = Math.ceil(W / (C * c)) + 3, nj = Math.ceil(H / (0.5 * c)) + 4;
      for (let a = -2; a < ni; a++) for (let b = -2; b < nj; b++) {
        const X = a * C * c + (b % 2 ? C * c / 2 * 0 : 0), Y = b * 0.5 * c;
        if ((a + b) % 2) continue;
        list.push([X, Y, rr(), cols[Math.floor(rr() * cols.length)]]);
      }
      list.sort((u, v) => u[1] - v[1]);
      for (const [X, Y, rv, col] of list) {
        const delay = (1 - Y / H) * 0.55 + rv * 0.2;
        let dy;
        if (p < 0.5) { const k = K.clamp((p * 2 - delay * 0.8) / 0.25); if (k <= 0) continue; dy = -(1 - K.ease.bounce(k)) * H * 0.8; }
        else { const k = K.clamp(((p - 0.5) * 2 - (1 - delay) * 0.6) / 0.35); if (k >= 1) continue; dy = K.ease.in(k) * H * 1.2; }
        cube(ctx, X, Y + dy - c * 0.2, c * 1.02, 0, 0, 0, col, 7, [0, 0, 0], (rv - 0.5) * 0.1);
      }
    },
    cube, bake,
  };

  // ---------- the shared demo: a voxel island where the robot (Creator OS) ships your video to seven tags ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [P.red, P.dark, P.red, P.dark, '#3b7bd8', P.dark, '#3b7bd8'];
  function layoutDemo(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, portrait: false, title: [W / 2, 116 * s], tq: 64, tv: [175 * s, 420 * s], tvC: 11 * s, isl: [545 * s, 455 * s], c: 15 * s,
      chips: PLATFORMS.map((n, i) => [905 * s, (196 + i * 70) * s]), isl2: [250 * s, 430 * s], c2: 12 * s, counter: [790 * s, 410 * s], take: [W / 2, 650 * s] };
    return { s, portrait: true, title: [W / 2, H * 0.09], tq: 58, tv: [W * 0.2, H * 0.26], tvC: 9 * s, isl: [W * 0.6, H * 0.435], c: 13 * s,
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.53 : W * 0.47, H * (0.625 + Math.floor(i / 2) * 0.08)]), isl2: [W * 0.5, H * 0.36], c2: 13 * s, counter: [W * 0.5, H * 0.62], take: [W / 2, H * 0.84] };
  }
  // Island with layer-by-layer voxel rain; once complete it is one cached canvas.
  function drawIsland(ctx, X, Y, c, p, t) {
    const list = K.cached('vx-island-list', () => bake(islandModel()));
    const zs = list.map((v) => v.z), zmin = Math.min(...zs), zmax = Math.max(...zs), nL = zmax - zmin + 1;
    // soft contact shadow far below (the island floats)
    ctx.save(); const sh = ctx.createRadialGradient(X + 20 * c / 15, Y + c * 15, 0, X + 20 * c / 15, Y + c * 15, c * 13);
    sh.addColorStop(0, `rgba(120,60,30,${0.22 * K.clamp(p * 2)})`); sh.addColorStop(1, 'rgba(120,60,30,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(X + 20 * c / 15, Y + c * 15, c * 13, c * 4, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    const bob = Math.sin(t * 1.1) * c * 0.25;
    if (p >= 1) { const mc = modelCanvas('vx-island-cv:' + c, list, c); ctx.drawImage(mc.cv, X - mc.ox, Y - mc.oy + bob); return; }
    const lev = p * nL, done = Math.floor(lev);
    if (done > 0) {
      const sub = K.cached(`vx-isl-sub:${done}`, () => bake(new Map([...islandModel()].filter(([k]) => +k.split(',')[2] < zmin + done))));
      const mc = modelCanvas(`vx-island-cv:${c}:${done}`, sub, c); ctx.drawImage(mc.cv, X - mc.ox, Y - mc.oy + bob);
    }
    const z = zmin + done, frac = lev - done, r = K.rng(z + 100);
    for (const v of list) {
      if (v.z !== z) continue;
      const k = K.clamp((frac - r() * 0.5) / 0.5); if (k <= 0) continue;
      cube(ctx, X, Y + bob - (1 - K.ease.bounce(k)) * c * 14, c, v.x, v.y, v.z, v.col, 7, [0, 0, 0], v.jit);
    }
  }
  function drawRobotLive(ctx, X, Y, c, t, on) {
    const bob = Math.sin(t * 1.1) * c * 0.25;
    // waving arm on the +x side: two poses alternate
    const up = Math.floor(t * 3) % 2 === 0;
    const arm = up ? [[2, 0, 6], [3, 0, 7], [3, 0, 8]] : [[2, 0, 6], [3, 0, 6], [3, 0, 7]];
    for (const [x, y, z] of arm) cube(ctx, X, Y + bob, c, x, y, z, P.cream, 7, [0, 0.2, 0]);
    // glowing eyes on the visor
    if (on) {
      const fl = 0.75 + 0.25 * Math.sin(t * 9);
      for (const ex of [-1, 1]) {
        const ox = X + (ex - 2) * C * c + C * c * 0.5, oy = Y + bob + (ex + 2) * 0.5 * c - 8.5 * c + c * 0.25;
        ctx.save(); ctx.globalAlpha = fl; ctx.fillStyle = P.cyan; ctx.shadowColor = P.cyan; ctx.shadowBlur = c * 0.8;
        ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + C * c * 0.6, oy + 0.3 * c); ctx.lineTo(ox + C * c * 0.6, oy + 0.3 * c - c * 0.5); ctx.lineTo(ox, oy - c * 0.5); ctx.fill(); ctx.restore();
      }
    }
  }
  function drawTV(ctx, X, Y, c, p, t) {
    const list = K.cached('vx-tv-list', () => bake(tvModel()));
    if (p <= 0) return;
    const bob = Math.sin(t * 1.3 + 1) * c * 0.3;
    if (p >= 1) { const mc = modelCanvas('vx-tv-cv:' + c, list, c); ctx.drawImage(mc.cv, X - mc.ox, Y - mc.oy + bob); return; }
    const r = K.rng(4);
    for (const v of list) { const k = K.clamp((p * 1.6 - (v.z / 9) * 0.6 - r() * 0.2) / 0.4); if (k <= 0) continue; cube(ctx, X, Y + bob - (1 - K.ease.bounce(k)) * c * 10, c, v.x, v.y, v.z, v.col, v.faces, v.ao, v.jit); }
  }

  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = layoutDemo(W, H), s = Lo.s, portrait = Lo.portrait;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        style.title(ctx, portrait ? 'One video.\nEvery platform.' : 'One video. Every platform.', Lo.title[0], Lo.title[1], K.beat(t, 0.1, 1.5, 'lin'), { size: Lo.tq });
        // video TV
        drawTV(ctx, Lo.tv[0], Lo.tv[1], Lo.tvC, K.beat(t, 2.0, 0.8, 'lin'), t);
        style.label(ctx, 'your video', Lo.tv[0] + 4 * s, Lo.tv[1] - 128 * s * (Lo.tvC / (11 * s)), K.beat(t, 2.8, 0.4, 'lin'), { align: 'center', color: P.orange });
        // island + robot
        const ip = K.beat(t, 1.6, 2.4, 'lin');
        drawIsland(ctx, Lo.isl[0], Lo.isl[1], Lo.c, ip, t);
        if (ip >= 1) drawRobotLive(ctx, Lo.isl[0], Lo.isl[1], Lo.c, t, t > 4.4);
        style.label(ctx, 'Creator OS', Lo.isl[0], Lo.isl[1] - 13.6 * Lo.c, K.beat(t, 4.5, 0.4, 'lin'), { align: 'center', size: 38, color: P.orange });
        // chain from the TV to the robot
        const a1 = portrait ? [[Lo.tv[0] + 60 * s, Lo.tv[1] + 30 * s], [Lo.isl[0] - 130 * s, Lo.isl[1] - 30 * s]] : [[Lo.tv[0] + 80 * s, Lo.tv[1] - 40 * s], [Lo.isl[0] - 75 * s, Lo.isl[1] - 70 * s]];
        style.arrow(ctx, a1[0], a1[1], K.beat(t, 3.5, 0.8, 'lin'), { bend: -0.25 });
        // fan out: chains of cubes to the block tags
        const src = portrait ? [W / 2, Lo.isl[1] + 13 * Lo.c] : [Lo.isl[0] + 120 * s, Lo.isl[1] - 40 * s];
        if (portrait) style.arrow(ctx, src, [W / 2, Lo.chips[6][1]], K.beat(t, 4.9, 0.6, 'lin'), { bend: 0, step: 26 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = portrait ? [W / 2, cy] : src, to = portrait ? [left ? W * 0.465 : W * 0.535, cy] : [cx - 18 * s, cy];
          const chainCol = COLS[i] === P.dark ? P.orange : COLS[i];
          if (portrait) style.arrow(ctx, from, to, K.beat(t, t0, 0.3, 'lin'), { bend: 0, step: 16, color: chainCol });
          else style.arrow(ctx, [from[0] + (3 - Math.abs(i - 3)) * 6 * s, from[1] + (i - 3) * 12 * s], to, K.beat(t, t0, 0.4, 'lin'), { bend: (i - 3) * -0.05, color: chainCol });
          style.label(ctx, name, cx, cy, K.beat(t, t0 + 0.25, 0.35, 'lin'), { color: COLS[i], align: portrait ? (left ? 'right' : 'left') : 'left' });
        });
        if (t > 7.6) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      } else {
        drawIsland(ctx, Lo.isl2[0], Lo.isl2[1], Lo.c2, 1, t);
        drawRobotLive(ctx, Lo.isl2[0], Lo.isl2[1], Lo.c2, t, true);
        style.label(ctx, 'Creator OS', Lo.isl2[0], Lo.isl2[1] - 13.6 * Lo.c2, 1, { align: 'center', size: 34, color: P.orange });
        const v = Math.round(K.count(t, 8.6, 1.4, 0, 1000000) / 1000) * 1000;
        const pop = 1 + K.spring(t, 10.0, 0.12, 2.5, 5);
        ctx.save(); ctx.translate(Lo.counter[0], Lo.counter[1]); ctx.scale(pop, pop); ctx.translate(-Lo.counter[0], -Lo.counter[1]);
        style.counter(ctx, v, Lo.counter[0], Lo.counter[1], 1, { size: portrait ? 84 : 92 });
        ctx.restore();
        style.label(ctx, 'views', Lo.counter[0], Lo.counter[1] + 58 * s, K.beat(t, 8.7, 0.4, 'lin'), { align: 'center', size: 34, color: P.grass });
        style.emphasis(ctx, Lo.counter[0], Lo.counter[1] - 40 * s, (portrait ? 330 : 380) * s, K.beat(t, 10.0, 1.2, 'lin'), {});
        style.title(ctx, portrait ? 'Post once.\nReach everywhere.' : 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1], K.beat(t, 10.5, 1.0, 'lin'), { size: portrait ? 50 : 50, color: P.dirt2 });
        if (t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      }
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('room', 0, 12, 1);
      for (let i = 0; i < 14; i++) k.play('click', 0.15 + i * 0.1, { pitch: 0.8 + (i % 4) * 0.12, gain: 0.7 });
      for (let i = 0; i < 12; i++) k.play('click', 1.6 + i * 0.2, { pitch: 0.6 + (i % 3) * 0.1, gain: 0.55 });
      for (let i = 0; i < 6; i++) k.play('click', 2.0 + i * 0.13, { pitch: 1.2, gain: 0.5 });
      k.play('pop', 2.85, { pitch: 1.1 });
      for (let i = 0; i < 8; i++) k.play('blip', 3.5 + i * 0.1, { note: ['C5', 'D5', 'E5', 'G5'][i % 4], gain: 0.5 });
      k.play('thud', 4.05, { gain: 0.5 }); k.play('blip', 4.4, { note: 'G5' }); k.play('blip', 4.5, { note: 'C6' });
      for (let i = 0; i < 7; i++) { k.play('blip', 5.0 + i * 0.4, { note: ['C5', 'E5', 'G5', 'C6', 'E6', 'G6', 'C7'][i], gain: 0.45 }); k.play('click', 5.3 + i * 0.4, { gain: 0.9 }); k.play('pop', 5.3 + i * 0.4, { pitch: 1 + i * 0.05, gain: 0.5 }); }
      for (let i = 0; i < 8; i++) k.play('thud', 7.65 + i * 0.07, { gain: 0.25 });
      k.play('whoosh', 8.3, { dur: 0.5, up: false });
      k.play('count', 8.6, { dur: 1.4 }); k.play('stamp', 10.0); k.play('pop', 10.05, { pitch: 1.4 });
      for (let i = 0; i < 10; i++) k.play('click', 10.5 + i * 0.1, { pitch: 1 + i * 0.03, gain: 0.5 });
      k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
