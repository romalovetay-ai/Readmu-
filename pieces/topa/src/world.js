// =====================================================================
//  THE WORLD — sky, sun, clouds, hills, the big tree, flowers, small life, wind, confetti; and sceneMeadow().
// =====================================================================
function sky() {
  cut(rect(-600, -900, WW + 1200, WH + 1800, 0), '#a6dcf3', { key: 'sky', shadow: false, tear: 0, shade: false, grain: 0.4, pat: pat.stripes('rgba(255,255,255,0.16)', 26, 90, 0.25) });
  // the sun with a face, its rays turning
  const sx = 230, sy = 165, ra = TT * 0.4;
  for (let i = 0; i < 12; i++) { const a = ra + i / 12 * TAU; cut([[sx + Math.cos(a - 0.12) * 100, sy + Math.sin(a - 0.12) * 100], [sx + Math.cos(a) * (150 + (i % 2) * 20), sy + Math.sin(a) * (150 + (i % 2) * 20)], [sx + Math.cos(a + 0.12) * 100, sy + Math.sin(a + 0.12) * 100]], '#f7c948', { key: 'sr' + i, sb: 6, sy: 3, grain: 0.5 }); }
  cut(ellipsePts(sx, sy, 98, 98, 0, 36), PAL.yellow, { key: 'sun', crayon: '#e6b23a', sb: 10 });
  critterFace(sx, sy - 6, 1.3, TT > EV.wind && TT < EV.birdIn ? 'smile' : 'happy', { ex: 24, my: 34, key: 'sunf', ph: 7 });
  // clouds drifting (faster in the wind)
  const drift = TT * 18 + clamp(seg(TT, EV.wind, EV.away + 2)) * 260;
  [[300, 120, 1], [1050, 90, 0.8], [1700, 170, 0.9], [2300, 110, 0.7]].forEach(([x0, y, s], i) => {
    const x = mod(x0 + drift * (0.6 + i * 0.15), WW + 700) - 350;
    for (const [dx, dy, r] of [[-60, 10, 52], [0, -12, 66], [62, 8, 50], [10, 22, 58]]) cut(ellipsePts(x + dx * s, y + dy * s, r * s * 1.2, r * s * 0.8, 0, 22), '#ffffff', { key: 'cl' + i + dx, sb: 8, sy: 5, grain: 0.3 });
  });
  // birds far away
  for (let i = 0; i < 3; i++) { const x = mod(500 + i * 90 + TT * 40, WW + 400) - 200, y = 300 + i * 18 + Math.sin(TT * 3 + i) * 6, f = Math.sin(TT * 14 + i) * 8; ink([[x - 16, y - f], [x, y], [x + 16, y - f]], { w: 3, color: '#4a5a70', amt: 0.3, key: 'fb' + i }); }
}
function hills() {
  cut(ellipsePts(380, 860, 760, 280, 0, 60), '#a8dc8e', { key: 'h1', sb: 14, pat: pat.dots('rgba(255,255,255,0.18)', 3, 46) });
  cut(ellipsePts(1500, 880, 860, 250, 0, 60), '#8fcf7a', { key: 'h2', sb: 14, pat: pat.stripes('rgba(255,255,255,0.12)', 4, 30, 0.4) });
  for (const [x, y, s] of [[240, 640, 0.7], [470, 610, 0.9], [980, 690, 0.6]]) {   // lollipop trees on the hills
    cut(rect(x - 8 * s, y, 16 * s, 70 * s, 3), PAL.woodD, { key: 'lt' + x, sb: 4 });
    cut(ellipsePts(x, y - 10 * s, 50 * s, 58 * s, 0, 22), PAL.greenD, { key: 'lc' + x, sb: 6 });
  }
}
function meadow() {
  const P = [[-300, 760]]; for (let x = -300; x <= WW + 300; x += 120) P.push([x, 740 + Math.sin(x * 0.006) * 22]);
  P.push([WW + 300, WH + 700], [-300, WH + 700]);
  cut(P, PAL.green, { key: 'mead', shadow: false, tear: 0.6, pat: pat.stripes('rgba(255,255,255,0.10)', 5, 34, -0.3) });
  cut([[-300, 1010], [WW * 0.4, 990], [WW + 300, 1020], [WW + 300, WH + 700], [-300, WH + 700]], PAL.greenD, { key: 'mead2', tear: 0.8, sy: -5 });
  // grass tufts that sway
  const R = RNG('tufts');
  for (let i = 0; i < 26; i++) {
    const x = R.r(-40, WW + 40), y = R.r(780, 1060), lean = Math.sin(TT * 2 + i) * 0.12 + windK() * 0.6;
    for (let k = -1; k <= 1; k++) ink([[x + k * 10, y], [x + k * 14 + Math.sin(lean) * 34, y - 34 + k * k * 6]], { w: 4, color: '#3f8a47', amt: 0.3, key: 'tf' + i + k });
  }
}
function flower(x, y, s, c, key, ph) {
  const bend = Math.sin(TT * 2.2 + ph) * 0.12 + windK() * 0.5, hx = x + Math.sin(bend) * 60 * s, hy = y - 60 * s;
  ink([[x, y], [(x + hx) / 2, y - 30 * s], [hx, hy]], { w: 5 * s, color: PAL.greenD, key: key + 'st' });
  cut(ellipsePts(x + 12 * s, y - 22 * s, 14 * s, 7 * s, 0.5, 10), PAL.greenD, { key: key + 'lf', shadow: false });
  for (let p = 0; p < 6; p++) { const a = p / 6 * TAU + TT * 0.3; cut(ellipsePts(hx + Math.cos(a) * 17 * s, hy + Math.sin(a) * 17 * s, 13 * s, 9 * s, a, 12), c, { key: key + 'p' + p, sb: 3, sy: 2, grain: 0.3 }); }
  cut(ellipsePts(hx, hy, 10 * s, 10 * s, 0, 12), PAL.yellow, { key: key + 'c', shadow: false, grain: false });
}
function flowers() {
  const R = RNG('flowers'), cols = [PAL.pink, PAL.purple, '#ffffff', '#ffb347', PAL.pinkL];
  for (let i = 0; i < 16; i++) { const x = 60 + i * 118 + R.n(30), y = R.r(800, 1060); if (Math.abs(x - TREE_X) < 90) continue; flower(x, y, R.r(0.8, 1.2), cols[i % cols.length], 'fl' + i, i); }
  for (const [x, y, s] of [[1760, 965, 1], [1820, 990, 0.7], [140, 1000, 0.8]]) {   // mushrooms
    cut(rect(x - 12 * s, y - 50 * s, 24 * s, 50 * s, 6), '#f7efe0', { key: 'ms' + x, sb: 4 });
    cut(ellipsePts(x, y - 52 * s, 44 * s, 28 * s, 0, 20, Math.PI, TAU).concat([[x + 44 * s, y - 50 * s], [x - 44 * s, y - 50 * s]]), PAL.purple, { key: 'mc' + x, pat: pat.dots('rgba(255,255,255,0.85)', 5 * s, 22 * s) });
  }
}
function tree() {
  cut([[TREE_X - 95, GROUND + 40], [TREE_X - 50, GROUND - 40], [TREE_X - 40, 300], [TREE_X + 40, 300], [TREE_X + 55, GROUND - 40], [TREE_X + 110, GROUND + 40]], '#8a5a34', { key: 'trunk', crayon: '#6b4024', crAl: 0.35, pat: pat.stripes('rgba(60,30,10,0.22)', 4, 26, 0.05) });
  cut(capsulePts(TREE_X - 20, 330, STUCK[0] - 40, STUCK[1] + 70, 34, 6), '#8a5a34', { key: 'branch', sb: 8 });
  const sw = Math.sin(TT * 1.3) * 6 + windK() * 18;
  [[1610, 170, 230, 170, '#5aa05a'], [1450, 140, 150, 120, '#6fb86a'], [1770, 230, 170, 150, '#4f9550'], [1620, 330, 200, 120, '#62ab5c'], [1500, 290, 130, 100, '#4f9550']].forEach(([x, y, rx, ry, c], i) =>
    cut(ellipsePts(x + sw * (i % 2 ? 1 : 0.6), y, rx, ry, 0, 40), c, { key: 'crown' + i, sb: 14, pat: pat.dots('rgba(255,255,255,0.12)', 4, 40) }));
  cut(capsulePts(TREE_X - 120, 300, STUCK[0] + 10, STUCK[1] + 75, 26, 6), '#8a5a34', { key: 'branch2', sb: 8 });
  cut(capsulePts(STUCK[0] + 20, STUCK[1] + 80, STUCK[0] - 50, STUCK[1] + 50, 18, 4), '#8a5a34', { key: 'twig', sb: 6 });
  for (let i = 0; i < 7; i++) { const R = RNG('tf', i); sparkle(1460 + R.f() * 320, 110 + R.f() * 260, 9 + (B + i) % 3 * 2, '#fff6c8'); }   // blossoms
  // a bee buzzing round the crown
  for (let i = 0; i < 2; i++) { const a = TT * (2.4 + i) + i * 2, x = 1600 + Math.cos(a) * 260, y = 230 + Math.sin(a * 1.3) * 120;
    cut(ellipsePts(x, y, 14, 10, 0, 12), '#f6cf55', { key: 'bee' + i, sb: 3, pat: pat.stripes('rgba(40,30,20,0.85)', 4, 10) });
    cut(ellipsePts(x - 2, y - 11, 8, 6 + Math.abs(Math.sin(TT * 40)) * 4, 0, 10), 'rgba(255,255,255,0.8)', { key: 'beew' + i, shadow: false, grain: false, shade: false }); }
}
function butterflies() {
  [[300, 760, '#f3a3bf'], [1050, 700, '#8c7ad8'], [700, 860, '#ffb347']].forEach(([x0, y0, c], i) => {
    const x = x0 + Math.sin(TT * 0.7 + i) * 160 + windK() * 300, y = y0 + Math.sin(TT * 1.9 + i * 2) * 60, f = 0.25 + Math.abs(Math.sin(TT * 18 + i)) * 0.75;
    for (const sx of [-1, 1]) cut(ellipsePts(x + sx * 15 * f, y, 16 * f, 20, sx * 0.3, 12), c, { key: 'bfw' + i + sx, sb: 3, sy: 2, grain: 0.3 });
    ink([[x, y - 12], [x, y + 12]], { w: 4, color: PAL.ink, amt: 0.2, key: 'bfb' + i });
  });
}
function snail() {
  const x = 120 + TT * 9, y = 1040;
  cut(ellipsePts(x + 10, y - 6, 42, 12, 0, 16), '#d9b38c', { key: 'snb', sb: 3 });
  cut(ellipsePts(x, y - 30, 30, 30, 0, 22), '#c97b4a', { key: 'sns', pat: (bb) => { ctx.strokeStyle = 'rgba(90,40,15,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); for (let a = 0; a < 12; a += 0.2) ctx.lineTo(x + Math.cos(a) * a * 2.2, y - 30 + Math.sin(a) * a * 2.2); ctx.stroke(); } });
  ink([[x + 44, y - 12], [x + 50, y - 34]], { w: 3, color: '#a6845f', key: 'sna' }); dot(x + 50, y - 36, 4);
}
function windLines() {
  const k = windK(); if (k <= 0) return;
  for (let i = 0; i < 7; i++) {
    const R = RNG('wl', i), y0 = R.r(150, 850), x = mod(R.f() * 2000 + TT * 1500, WW + 900) - 450, P = [];
    for (let j = 0; j <= 14; j++) P.push([x + j * 26, y0 + Math.sin(j * 0.5 + TT * 6 + i) * 18]);
    const n = P.length; P.push([P[n - 1][0] + 30 * Math.cos(TT * 4), P[n - 1][1] - 34], [P[n - 1][0] - 4, P[n - 1][1] - 40]);
    ink(P, { w: 7 * k, color: 'rgba(255,255,255,0.85)', amt: 0.6, key: 'wl' + i });
  }
  for (let i = 0; i < 9; i++) { const R = RNG('lv', i), x = mod(R.f() * 2400 + TT * 900, WW + 600) - 300, y = R.r(200, 900) + Math.sin(TT * 5 + i) * 50, a = TT * 6 + i;
    cut(rot(ellipsePts(x, y, 22 * k, 10 * k, 0, 12), x, y, a), i % 2 ? PAL.green : '#9ccc65', { key: 'lv' + i, sb: 4 }); }
}
function confetti(t0) {
  if (TT < t0) return;
  const cols = ['#f06292', PAL.yellow, '#4c8fd6', PAL.purple, '#7ad866', '#ffb347'];
  for (let i = 0; i < (PORTRAIT ? 110 : 70); i++) {
    const R = RNG('cf', i), d = TT - t0, burst = d < 1.2;
    let x, y;
    if (burst) { const a = -Math.PI / 2 + R.n(1.3), v = R.r(500, 1100); x = 1180 + Math.cos(a) * v * d; y = 560 + Math.sin(a) * v * d + 700 * d * d; }
    else { x = R.r(-200, WW + 200) + Math.sin(TT * 2 + i) * 40; y = mod(R.r(0, 1900) + d * R.r(120, 220), 1900) - 450; }
    const a = TT * R.r(3, 8) + i;
    cut(rot(rect(x - 9, y - 5, 18, 10, 2), x, y, a), cols[i % cols.length], { key: 'cf' + i, sb: 2, sy: 2, grain: false, tear: 0.3, shade: false });
  }
}
function dust(x, y, t0) {
  if (TT < t0 || TT > t0 + 0.6) return; const u = seg(TT, t0, t0 + 0.6);
  for (let i = 0; i < 6; i++) { const a = Math.PI + i / 5 * Math.PI, r = 40 + u * 90; cut(ellipsePts(x + Math.cos(a) * r, y - 10 + Math.sin(a) * r * 0.3, 28 * (1 - u) + 4, 20 * (1 - u) + 3, 0, 12), '#f3ead6', { key: 'du' + i + t0, shadow: false, grain: false }); }
}
// ---- the whole meadow at TT
function sceneMeadow() {
  sky(); hills(); meadow(); tree(); flowers(); snail(); butterflies();
  // stumps the hedgehog builds
  EV.stumps.forEach((t, i) => { const k = popS(t); if (k > 0) { ctx.save(); ctx.translate(STUMP_X, GROUND - i * STUMP_H); ctx.scale(1, k); stump(0, 0, 170 - i * 14, STUMP_H, 'stp' + i); ctx.restore(); } dust(STUMP_X, GROUND - i * STUMP_H, t); });
  const r = rabbitState(), h = hogState();
  if (h.on && h.x > -160) hedgehog(h.x, h.y, 1.0, h);
  if (r.on && r.x > -150) rabbit(r.x, r.y, 1.0, r);
  const b = bearState(), paws = bear(b.x, b.y, BS, b);
  const bl = balloonState(paws.R);
  const bp = birdPos(bl);
  if (bl.stuckEnd && !bl.end) {   // tied round the twig: the string hangs short from the knot
    balloon(bl.c[0], bl.c[1], 0.9, bl.stuckEnd[0] + (TT > EV.grab ? 0 : Math.sin(TT * 3) * 6), bl.stuckEnd[1] - (TT > EV.grab ? seg(TT, EV.grab, EV.grab + 0.6) * 30 : 0));
  } else balloon(bl.c[0], bl.c[1], 0.9, bl.end ? bl.end[0] : null, bl.end ? bl.end[1] : null);
  if (bp) bird(bp.x, bp.y, 1, bp);
  // hearts while Topa hugs the balloon, and again at the end
  for (const [t0, n] of [[EV.hearts, 4], [EV.hooray, 6]]) for (let i = 0; i < n; i++) {
    const t = t0 + i * 0.35, d = TT - t; if (d < 0 || d > 2.2) continue;
    const R = RNG('hrt', t0, i), x = b.x + R.r(-180, 180) + Math.sin(d * 4 + i) * 20, y = b.y - 380 - d * 140;
    heart(x, y, popS(t) * R.r(1.6, 2.4), ['#f06292', '#f8a5c2', '#ff8a65'][i % 3], 'hrt' + t0 + i);
  }
  windLines(); confetti(EV.land);
  // tags: the title at the start, the end card
  if (DEFER) {
    DEFER.push(() => { if (TT < 5.2) tag('Топа и шарик', PORTRAIT ? CX : 330, PORTRAIT ? SAFE.top + 110 : 115, PORTRAIT ? 76 : 64, { rot: -0.04, s: popS(0.4) * (1 - seg(TT, 4.8, 5.1)) }); });
    DEFER.push(() => { if (TT > EV.end) tag('Конец!', CX, PORTRAIT ? H * 0.42 : H / 2 - 40, 110, { rot: 0.02, s: popS(EV.end) }); });
  }
}
