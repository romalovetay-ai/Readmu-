// Manim-Style Math (Popular Explainer Looks). The 3Blue1Brown/Manim look: pure black, crisp anti-aliased vector
// strokes, a restrained Manim palette, LaTeX-like serif with italic variables, Write (outline traces then fills),
// Create (paths draw on), axes with ticks, SurroundingRectangle, Indicate pulses and ShowPassingFlash.
(function () {
  const C = { bg: '#000000', white: '#ffffff', blue: '#58c4dd', teal: '#5cd0b3', yellow: '#ffe45c', red: '#fc6255', green: '#83c167', gold: '#f0ac5f', purple: '#9a72ac', grey: '#888888' };
  const SERIF = 'STIX Two Text';
  const S = (W, H) => K.layout(W, H).s;
  const TAU = Math.PI * 2;
  const sig = (x) => { x = K.clamp(x); return 1 / (1 + Math.exp(-10 * (x - 0.5))) * 1.0136 - 0.0068; }; // Manim's smooth rate function
  const ease = (x) => K.clamp(sig(x));

  // Manim Write: each glyph's outline traces, then fills; glyphs stagger left to right.
  function write(ctx, text, x, y, p, o = {}) {
    const s = S(ctx.canvas.width, ctx.canvas.height), size = (o.size || 40) * s;
    ctx.save(); ctx.font = K.font(size, o.family || SERIF, o.weight || 400, o.italic ? 'italic' : ''); ctx.textBaseline = 'alphabetic';
    const w = ctx.measureText(text).width, x0 = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    if (p <= 0) { ctx.restore(); return { w, h: size, x0 }; }
    const n = text.length, lag = 0.6, col = o.color || C.white;
    let cx = x0; const L = size * 4;
    for (let i = 0; i < n; i++) {
      const ch = text[i], cw = ctx.measureText(text.slice(0, i + 1)).width - ctx.measureText(text.slice(0, i)).width;
      const a = (i / n) * lag, c = K.clamp((p - a) / (1 - lag));
      if (c > 0 && ch !== ' ') {
        ctx.lineWidth = Math.max(1, 1.4 * s); ctx.strokeStyle = col; ctx.setLineDash([L * K.clamp(c * 2), L]);
        if (c < 1) ctx.strokeText(ch, cx, y);
        ctx.setLineDash([]); ctx.globalAlpha = K.clamp((c - 0.45) / 0.55); ctx.fillStyle = col; ctx.fillText(ch, cx, y); ctx.globalAlpha = 1;
      }
      cx += cw;
    }
    ctx.restore(); return { w, h: size, x0 };
  }
  function measure(ctx, text, size, italic) { ctx.save(); ctx.font = K.font(size, SERIF, 400, italic ? 'italic' : ''); const w = ctx.measureText(text).width; ctx.restore(); return w; }
  function tip(ctx, b, ang, sz, col) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] - Math.cos(ang - 0.38) * sz, b[1] - Math.sin(ang - 0.38) * sz); ctx.lineTo(b[0] - Math.cos(ang + 0.38) * sz, b[1] - Math.sin(ang + 0.38) * sz); ctx.closePath(); ctx.fill(); }

  const style = {
    id: 'math-anim', name: 'Manim-Style Math', family: 'Popular Explainer Looks',
    fonts: [{ css: 'https://fonts.googleapis.com/css2?family=STIX+Two+Text:ital,wght@0,400;0,600;1,400&display=block', specs: ['400 56px "STIX Two Text"', 'italic 400 40px "STIX Two Text"', '600 40px "STIX Two Text"'] }],
    palette: C,
    sfx: { draw: null, land: 'tick', emphasis: 'ding', transition: 'whoosh', bed: 'hum' },

    background(ctx, W, H, t) { ctx.fillStyle = C.bg; ctx.fillRect(0, 0, W, H); },
    // Manim's finish is the absence of texture: pristine black, anti-aliased vectors. Only a near-invisible
    // edge falloff so the frame sits like a rendered Manim scene on a dark player.
    finish(ctx, W, H, t) { K.vignette(ctx, W, H, 0.08, '#000'); },

    // Title: Write, then a white rule Creates under it (the header layout)
    title(ctx, text, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      const r = write(ctx, text, x, y, K.clamp(p / 0.8), { size: o.size || 56, align: o.align, color: o.color });
      if (o.rule !== false && p > 0.5) {
        const rw = o.ruleW || r.w * 1.6, rp = ease((p - 0.5) / 0.5), rx = (o.align === 'center' ? x : r.x0 + r.w / 2) - rw / 2;
        ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(rx, y + 26 * s); ctx.lineTo(rx + rw * rp, y + 26 * s); ctx.stroke(); ctx.restore();
      }
      return r;
    },
    label(ctx, text, x, y, p, o = {}) { return write(ctx, text, x, y, p, { size: o.size || 34, ...o }); },

    // Arrow: Create the shaft, the tip grows in at the end
    arrow(ctx, from, to, p, o = {}) {
      if (p <= 0) return null;
      const s = S(ctx.canvas.width, ctx.canvas.height), col = o.color || C.white, pts = K.arcPts(from, to, o.bend ?? 0, 40), q = ease(p);
      const sz = (o.tip || 18) * s, sub = K.trim(pts, q);
      ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = (o.width || 4) * s; ctx.lineCap = 'round';
      // stop the shaft short of the tip
      const shaft = q >= 1 ? K.trim(pts, 1 - sz * 0.6 / K.pathLen(pts)) : sub;
      K.poly(ctx, shaft); ctx.stroke();
      const b = sub[sub.length - 1], a = sub[Math.max(0, sub.length - 3)];
      if (sub.length > 1) tip(ctx, b, Math.atan2(b[1] - a[1], b[0] - a[0]), sz * K.clamp(q * 3), col);
      ctx.restore(); return b;
    },

    // SurroundingRectangle, Created clockwise from the top-left corner
    box(ctx, x, y, w, h, p, o = {}) {
      if (p <= 0) return;
      const s = S(ctx.canvas.width, ctx.canvas.height);
      ctx.save();
      if (o.fill) { ctx.globalAlpha = 0.18 * ease(p); ctx.fillStyle = o.fill; ctx.fillRect(x, y, w, h); ctx.globalAlpha = 1; }
      K.drawOn(ctx, K.rectPts(x, y, w, h), ease(p), { strokeStyle: o.color || C.yellow, lineWidth: (o.width || 4) * s, lineCap: 'butt', lineJoin: 'miter' });
      ctx.restore();
    },

    // DecimalNumber
    counter(ctx, value, x, y, p, o = {}) {
      const s = S(ctx.canvas.width, ctx.canvas.height);
      ctx.save(); ctx.font = K.font((o.size || 96) * s, SERIF, 400); ctx.fillStyle = o.color || C.white; ctx.textAlign = o.align || 'center'; ctx.fillText(K.fmt(value), x, y); ctx.restore();
    },

    // Indicate + Circumscribe: a yellow flash segment runs round a circle while a soft pulse swells and fades
    emphasis(ctx, x, y, r, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      const s = S(ctx.canvas.width, ctx.canvas.height), pts = K.circlePts(x, y, r, o.ry || r * 0.55, 90, Math.PI);
      const head = ease(p), tail = ease(K.clamp(p * 1.4 - 0.4)), seg = K.trim(pts, head).slice(Math.floor(tail * 90));
      ctx.save(); ctx.strokeStyle = o.color || C.yellow; ctx.lineWidth = 6 * s; ctx.lineCap = 'round';
      if (seg.length > 1) { K.poly(ctx, seg); ctx.stroke(); }
      ctx.restore();
    },

    // FadeOut then FadeIn through pure black (Manim's own scene change)
    transition(ctx, W, H, p, o = {}) {
      if (p <= 0 || p >= 1) return;
      ctx.save(); ctx.fillStyle = `rgba(0,0,0,${Math.sin(Math.PI * p)})`; ctx.fillRect(0, 0, W, H); ctx.restore();
    },
  };

  // ---------- demo ----------
  const PLATFORMS = ['Instagram', 'TikTok', 'YouTube', 'X', 'LinkedIn', 'Threads', 'Facebook'];
  const COLS = [C.red, C.teal, C.red, C.white, C.blue, C.purple, C.blue];
  function lay(W, H) {
    const L = K.layout(W, H), s = L.s;
    if (!L.portrait) return { s, P: false, title: [W / 2, 96 * s], video: [90 * s, 290 * s, 210 * s, 210 * s], node: [560 * s, 415 * s],
      chips: PLATFORMS.map((n, i) => [935 * s, (200 + i * 72) * s]), axes: [130 * s, 560 * s, 600 * s, 330 * s], num: [970 * s, 430 * s], take: [W / 2, 96 * s], top: [170 * s, 660 * s] };
    return { s, P: true, title: [W / 2, H * 0.08], video: [W * 0.38, H * 0.15, W * 0.24, W * 0.24], node: [W / 2, H * 0.42],
      chips: PLATFORMS.map((n, i) => [i % 2 ? W * 0.56 : W * 0.44, H * (0.56 + Math.floor(i / 2) * 0.07)]), axes: [W * 0.16, H * 0.5, W * 0.7, H * 0.22], num: [W / 2, H * 0.64], take: [W / 2, H * 0.08], top: [W / 2, H * 0.2] };
  }
  function nodeBox(ctx, x, y, size, p, s, rectP) {
    const r = write(ctx, 'Creator OS', x, y, p, { size, align: 'center' }); nodeBox.hw = r.w / 2 + 18 * s;
    style.box(ctx, x - r.w / 2 - 18 * s, y - size * s * 0.82, r.w + 36 * s, size * s * 1.15, rectP, { color: C.blue });
  }
  style.demo = {
    duration: 12,
    draw(ctx, W, H, t) {
      const Lo = lay(W, H), s = Lo.s, P = Lo.P;
      style.background(ctx, W, H, t);
      if (t < 8.25) {
        style.title(ctx, 'One video. Every platform.', Lo.title[0], Lo.title[1], K.clamp((t - 0.15) / 1.6), { size: P ? 46 : 54, align: 'center', ruleW: P ? W * 0.84 : W * 0.86 });
        // video = a Square with a Triangle "play" glyph, labelled with an italic variable
        const [vx, vy, vw, vh] = Lo.video, vp = K.clamp((t - 2.0) / 0.8);
        if (vp > 0) {
          K.drawOn(ctx, K.rectPts(vx, vy, vw, vh), ease(vp), { strokeStyle: C.blue, lineWidth: 4 * s, lineCap: 'butt', lineJoin: 'miter' });
          ctx.save(); ctx.globalAlpha = 0.25 * ease(vp); ctx.fillStyle = C.blue; ctx.fillRect(vx, vy, vw, vh); ctx.restore();
          const tri = [[vx + vw * 0.38, vy + vh * 0.3], [vx + vw * 0.68, vy + vh * 0.5], [vx + vw * 0.38, vy + vh * 0.7], [vx + vw * 0.38, vy + vh * 0.3]];
          K.drawOn(ctx, tri, ease(K.clamp((t - 2.5) / 0.5)), { strokeStyle: C.yellow, lineWidth: 4 * s });
        }
        const lw = measure(ctx, 'your video', 32 * s, true);
        style.label(ctx, 'your video', vx + vw / 2, vy + vh + 48 * s, K.clamp((t - 2.6) / 0.7), { align: 'center', italic: true, size: 36, color: C.blue });
        const [nx, ny] = Lo.node;
        const a1 = P ? [[W / 2, vy + vh + 80 * s], [W / 2, ny - 60 * s]] : [[vx + vw + 18 * s, vy + vh / 2], [nx - measure(ctx, 'Creator OS', 58 * s) / 2 - 34 * s, ny - 18 * s]];
        style.arrow(ctx, a1[0], a1[1], K.clamp((t - 3.3) / 0.8), {});
        nodeBox(ctx, nx, ny, P ? 54 : 58, K.clamp((t - 4.0) / 0.8), s, K.clamp((t - 4.5) / 0.6));
        if (P) style.arrow(ctx, [W / 2, ny + 40 * s], [W / 2, Lo.chips[6][1] + 12 * s], K.clamp((t - 4.9) / 0.5), { tip: 14, width: 3 });
        PLATFORMS.forEach((name, i) => {
          const t0 = 5.0 + i * 0.4, [cx, cy] = Lo.chips[i], left = i % 2 === 0;
          const from = P ? [W / 2, cy - 10 * s] : [nx + measure(ctx, 'Creator OS', 58 * s) / 2 + 24 * s, ny - 18 * s], to = P ? [left ? W * 0.46 : W * 0.54, cy - 10 * s] : [cx - 16 * s, cy - 10 * s];
          style.arrow(ctx, from, to, K.clamp((t - t0) / 0.45), { color: COLS[i], width: 3, tip: 14 });
          style.label(ctx, name, P ? (left ? W * 0.44 : W * 0.56) : cx, cy, K.clamp((t - t0 - 0.25) / 0.5), { color: COLS[i], size: P ? 34 : 40, align: P ? (left ? 'right' : 'left') : 'left' });
        });
      } else {
        // the node shrinks to a corner tag; an Axes Create, a curve climbs, the DecimalNumber tracks it
        const [tx, ty] = Lo.top;
        nodeBox(ctx, tx, ty, 32, 1, s, 1);
        const [ax, ay, aw, ah] = Lo.axes, ap = ease(K.clamp((t - 8.4) / 0.6));
        style.arrow(ctx, [ax - 10 * s, ay], [ax + aw, ay], ap, { width: 2.5, tip: 14 });
        style.arrow(ctx, [ax, ay + 10 * s], [ax, ay - ah], ap, { width: 2.5, tip: 14 });
        ctx.save(); ctx.strokeStyle = C.white; ctx.lineWidth = 2 * s; ctx.font = K.font(28 * s, SERIF, 400); ctx.fillStyle = C.white; ctx.textAlign = 'center';
        for (let i = 1; i <= 5; i++) { const xx = ax + (aw * 0.9 * i) / 5; if (ap * aw > xx - ax) { ctx.beginPath(); ctx.moveTo(xx, ay - 7 * s); ctx.lineTo(xx, ay + 7 * s); ctx.stroke(); ctx.fillText(String(i), xx, ay + 34 * s); } }
        for (let i = 1; i <= 3; i++) { const yy = ay - (ah * 0.9 * i) / 3; if (ap * ah > ay - yy) { ctx.beginPath(); ctx.moveTo(ax - 7 * s, yy); ctx.lineTo(ax + 7 * s, yy); ctx.stroke(); } }
        ctx.restore();
        write(ctx, 't', ax + aw + 14 * s, ay + 10 * s, ap, { italic: true, size: 32 });
        write(ctx, 'views', ax + 14 * s, ay - ah - 6 * s, ap, { italic: true, size: 30, color: C.yellow });
        const f = (u) => [ax + u * aw * 0.9, ay - ah * 0.9 * (Math.exp(3.2 * u) - 1) / (Math.exp(3.2) - 1)];
        const curve = Array.from({ length: 80 }, (_, i) => f(i / 79)), cp = ease(K.clamp((t - 8.6) / 1.5));
        K.drawOn(ctx, curve, cp, { strokeStyle: C.blue, lineWidth: 4 * s });
        if (cp > 0) { const d = f(cp); ctx.fillStyle = C.yellow; ctx.beginPath(); ctx.arc(d[0], d[1], 9 * s, 0, TAU); ctx.fill();
          ctx.save(); ctx.setLineDash([6 * s, 6 * s]); ctx.strokeStyle = C.grey; ctx.lineWidth = 2 * s; ctx.beginPath(); ctx.moveTo(d[0], d[1]); ctx.lineTo(d[0], ay); ctx.stroke(); ctx.restore(); }
        const v = Math.round(1000000 * (Math.exp(3.2 * cp) - 1) / (Math.exp(3.2) - 1) / 1000) * 1000;
        const [mx, my] = Lo.num, size = P ? 84 : 96;
        const eqW = measure(ctx, 'views = ', 52 * s, true);
        if (t > 8.5) {
          write(ctx, 'views', mx - (P ? 0 : 0), my - (P ? 100 : 104) * s, K.clamp((t - 8.5) / 0.6), { italic: true, size: 52, color: C.yellow, align: 'center' });
          write(ctx, '=', mx, my - 52 * s, K.clamp((t - 8.7) / 0.4), { size: 44, align: 'center' });
          // Indicate: scale up and tint yellow, then back
          const ind = Math.sin(Math.PI * K.clamp((t - 10.0) / 0.7));
          ctx.save(); ctx.translate(mx, my + 16 * s); ctx.scale(1 + 0.2 * ind, 1 + 0.2 * ind);
          style.counter(ctx, v, 0, size * 0.32 * s, 1, { size, color: K.rgba(K.mix(C.white, C.yellow, ind)) }); ctx.restore();
          ctx.save(); ctx.font = K.font(size * s, SERIF, 400); const nw = ctx.measureText(K.fmt(1000000)).width; ctx.restore();
          const bl = my + 16 * s + size * 0.32 * s;
          style.box(ctx, mx - nw / 2 - 18 * s, bl - size * s * 0.86, nw + 36 * s, size * s * 1.08, K.clamp((t - 10.0) / 0.6), { color: C.yellow });
          style.emphasis(ctx, mx, bl - size * s * 0.32, nw * 0.8, K.clamp((t - 10.3) / 1.0), { ry: size * s * 1.0 });
        }
        if (t > 10.4) style.title(ctx, 'Post once. Reach everywhere.', Lo.take[0], Lo.take[1] + (P ? 0 : 0), K.clamp((t - 10.4) / 1.2), { size: P ? 44 : 52, align: 'center', ruleW: P ? W * 0.84 : W * 0.86 });
        else if (!P) {}
      }
      if (t > 7.6 && t < 8.9) style.transition(ctx, W, H, K.clamp((t - 7.6) / 1.3));
      style.finish(ctx, W, H, t);
    },
    score(k) {
      k.bed('hum', 0, 12, 0.5);
      k.play('scribble', 0.15, { medium: 'pen', dur: 1.3, gain: 0.6 });
      k.play('whoosh', 2.0, { dur: 0.6, gain: 0.5 }); k.play('tick', 2.8); k.play('scribble', 2.6, { medium: 'pen', dur: 0.7, gain: 0.5 });
      k.play('whoosh', 3.3, { dur: 0.6, gain: 0.5 }); k.play('scribble', 4.0, { medium: 'pen', dur: 0.8, gain: 0.6 }); k.play('tick', 5.0, { pitch: 1.2 });
      for (let i = 0; i < 7; i++) { k.play('whoosh', 5.0 + i * 0.4, { dur: 0.3, gain: 0.35 }); k.play('pluck', 5.4 + i * 0.4, { note: ['C5', 'D5', 'E5', 'G5', 'A5', 'C6', 'D6'][i], gain: 0.6 }); }
      k.play('whoosh', 7.6, { dur: 1.2, up: false, gain: 0.5 });
      k.play('count', 8.6, { dur: 1.5 }); k.play('ding', 10.0);
      k.play('scribble', 10.4, { medium: 'pen', dur: 1.0, gain: 0.6 }); k.play('chime', 11.4, { note: 'C6' });
    },
  };
  MS.register(style);
})();
