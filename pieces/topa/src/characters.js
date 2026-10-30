// =====================================================================
//  CHARACTERS — Topa the bear, the rabbit, the hedgehog, the bird, the balloon, stumps.
//  All drawn as torn-paper cutouts (cut()), feet at (x, y), size s (1 = Topa about 400px tall).
//  Red belongs to the balloon only.
// =====================================================================
const CP = {
  bear: '#a0673a', bearD: '#7a4824', tan: '#e6b98a', rabbit: '#f6f1ea', rabbitD: '#d9cfc2', ear: '#f5a9bd',
  hog: '#7b5534', hogD: '#5a3a20', hogFace: '#ecc99e', bird: '#4c8fd6', birdL: '#bfe0f7', beak: '#f2b632',
  red: '#e5392c', redD: '#b3241a', stump: '#b9844f', stumpTop: '#e8c08c',
};
// a face: eye spacing ex, mouth under the eyes by my; moods smile, happy, wow, sad, cry, blink
function critterFace(x, y, s, mood = 'smile', o = {}) {
  const I = PAL.ink, ex = (o.ex ?? 22) * s, my = (o.my ?? 26) * s, key = o.key ?? 'cf';
  if (mood !== 'happy' && (B + (o.ph ?? 0)) % 41 < 2) mood = mood === 'sad' || mood === 'cry' ? mood : 'blink';   // a blink now and then
  for (const sx of [-1, 1]) {
    const X = x + sx * ex;
    if (mood === 'happy') ink(arcPts(X, y + 5 * s, 9 * s, Math.PI * 1.15, Math.PI * 1.85, 8), { w: 4 * s, color: I, amt: 0.2, key: key + 'eh' + sx });
    else if (mood === 'blink') ink([[X - 8 * s, y], [X + 8 * s, y]], { w: 4 * s, color: I, amt: 0.2, key: key + 'eb' + sx });
    else { dot(X, y, (mood === 'wow' ? 9 : 7.5) * s, I); dot(X + 2.5 * s, y - 3 * s, 2.6 * s, '#fff'); }
    if (mood === 'sad' || mood === 'cry') ink([[X - sx * 13 * s, y - 15 * s], [X + sx * 4 * s, y - 20 * s]], { w: 3.4 * s, color: I, amt: 0.2, key: key + 'br' + sx });
  }
  ctx.fillStyle = 'rgba(240,110,120,0.5)'; ctx.beginPath();
  ctx.ellipse(x - ex - 10 * s, y + 14 * s, 9 * s, 5.5 * s, 0, 0, TAU); ctx.ellipse(x + ex + 10 * s, y + 14 * s, 9 * s, 5.5 * s, 0, 0, TAU); ctx.fill();
  const mY = y + my;
  if (mood === 'sad' || mood === 'cry') ink(arcPts(x, mY + 8 * s, 9 * s, Math.PI * 1.2, Math.PI * 1.8, 8), { w: 3.6 * s, color: I, amt: 0.2, key: key + 'ms' });
  else if (mood === 'wow') { ctx.fillStyle = I; ctx.beginPath(); ctx.ellipse(x, mY, 6 * s, 8 * s, 0, 0, TAU); ctx.fill(); }
  else if (mood === 'happy') {
    ctx.fillStyle = I; ctx.beginPath(); ctx.arc(x, mY - 4 * s, 12 * s, 0, Math.PI); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#e8707a'; ctx.beginPath(); ctx.ellipse(x, mY + 3 * s, 6.5 * s, 3.5 * s, 0, 0, TAU); ctx.fill();
  } else ink(arcPts(x, mY - 6 * s, 10 * s, Math.PI * 0.2, Math.PI * 0.8, 8), { w: 3.6 * s, color: I, amt: 0.2, key: key + 'm' });
  if (mood === 'cry') {   // two streams of tears
    for (const sx of [-1, 1]) for (let i = 0; i < 3; i++) {
      const k = mod(TT * 1.6 + i / 3 + (sx > 0 ? 0.17 : 0), 1), X = x + sx * (ex + 4 * s + k * 26 * s), Y = y + 10 * s + k * 120 * s;
      cut(ellipsePts(X, Y, 6 * s, 9 * s, 0, 12), '#7cc6f0', { key: 'tear' + sx + i, shadow: false, tear: 0.3, grain: false });
    }
  }
}
// an arm from shoulder (sx, sy) at angle a (0 = straight down, + = away from the body on that side); returns the paw
function limb(sx, sy, a, side, L, w, c, key) {
  const hx = sx + Math.sin(a) * side * L, hy = sy + Math.cos(a) * L;
  cut(capsulePts(sx, sy, hx, hy, w, 6), c, { key: key + 'a', sb: 6, sy: 4 });
  cut(ellipsePts(hx, hy, w * 0.62, w * 0.58, 0, 14), c, { key: key + 'p', sb: 4, sy: 3 });
  return [hx, hy];
}
// ---- Topa the bear. o: mood, armL, armR (angles), lean, squash
function bear(x, y, s, o = {}) {
  const sq = o.squash ?? 0, bob = Math.sin(TT * TAU * 0.8) * 4 * s;
  ctx.save(); ctx.translate(x, y); ctx.rotate(o.lean ?? 0); ctx.scale(1 + sq * 0.12, 1 - sq * 0.12); ctx.translate(-x, -y);
  for (const sx of [-1, 1]) cut(ellipsePts(x + sx * 50 * s, y - 28 * s, 44 * s, 34 * s, 0, 18), CP.bearD, { key: 'bl' + sx });
  const by = y - 140 * s + bob;
  cut(ellipsePts(x, by, 110 * s, 125 * s, 0, 34), CP.bear, { key: 'bb', crayon: CP.bearD, crAl: 0.25 });
  cut(ellipsePts(x, by + 18 * s, 68 * s, 80 * s, 0, 28), CP.tan, { key: 'bbel', shadow: false });
  const hy = y - 320 * s + bob * 1.4;
  for (const sx of [-1, 1]) {
    cut(ellipsePts(x + sx * 80 * s, hy - 78 * s, 40 * s, 40 * s, 0, 18), CP.bear, { key: 'be' + sx });
    cut(ellipsePts(x + sx * 80 * s, hy - 78 * s, 21 * s, 21 * s, 0, 14), CP.tan, { key: 'bei' + sx, shadow: false });
  }
  cut(ellipsePts(x, hy, 112 * s, 102 * s, 0, 34), CP.bear, { key: 'bh', crayon: CP.bearD, crAl: 0.2 });
  cut(ellipsePts(x, hy + 40 * s, 52 * s, 38 * s, 0, 20), CP.tan, { key: 'bm', shadow: false });
  cut(ellipsePts(x, hy + 22 * s, 18 * s, 12 * s, 0, 12), PAL.ink, { key: 'bn', shadow: false, grain: false });
  critterFace(x, hy - 12 * s, s * 1.15, o.mood ?? 'smile', { ex: 30, my: 58, key: 'bf', ph: 3 });
  const shy = by - 70 * s;
  const L = limb(x - 92 * s, shy, o.armL ?? 0.35, -1, 105 * s, 50 * s, CP.bear, 'bal');
  const R = limb(x + 92 * s, shy, o.armR ?? 0.35, 1, 105 * s * (o.reach ?? 1), 50 * s, CP.bear, 'bar');
  ctx.restore();
  // paw positions after the lean/squash transform
  const T = (p) => { const dx = p[0] - x, dy = p[1] - y, a = o.lean ?? 0, c = Math.cos(a), si = Math.sin(a); const ux = dx * (1 + sq * 0.12), uy = dy * (1 - sq * 0.12); return [x + ux * c - uy * si, y + ux * si + uy * c]; };
  return { L: T(L), R: T(R), head: T([x, hy]) };
}
// ---- the rabbit. o: mood, sad (ears droop 0..1), crouch
function rabbit(x, y, s, o = {}) {
  const droop = o.sad ?? 0, cr = o.crouch ?? 0;
  ctx.save(); ctx.translate(x, y); ctx.scale(1 + cr * 0.12, 1 - cr * 0.18); ctx.translate(-x, -y);
  cut(ellipsePts(x - 60 * s, y - 40 * s, 22 * s, 22 * s, 0, 12), '#ffffff', { key: 'rt' });
  for (const sx of [-1, 1]) cut(ellipsePts(x + sx * 30 * s, y - 14 * s, 36 * s, 16 * s, 0, 14), CP.rabbitD, { key: 'rf' + sx });
  cut(ellipsePts(x, y - 85 * s, 60 * s, 75 * s, 0, 26), CP.rabbit, { key: 'rb' });
  cut(ellipsePts(x, y - 70 * s, 34 * s, 42 * s, 0, 18), '#ffffff', { key: 'rbel', shadow: false });
  const hy = y - 190 * s;
  for (const sx of [-1, 1]) {
    const a = sx * (0.18 + droop * 1.15) + Math.sin(TT * 5 + sx) * 0.05, ex = x + sx * 26 * s, ey = hy - 40 * s;
    const tip = [ex + Math.sin(a) * 120 * s, ey - Math.cos(a) * 120 * s];
    cut(rot(ellipsePts((ex + tip[0]) / 2, (ey + tip[1]) / 2, 24 * s, 66 * s, 0, 18), (ex + tip[0]) / 2, (ey + tip[1]) / 2, a), CP.rabbit, { key: 'rear' + sx });
    cut(rot(ellipsePts((ex + tip[0]) / 2, (ey + tip[1]) / 2, 11 * s, 48 * s, 0, 14), (ex + tip[0]) / 2, (ey + tip[1]) / 2, a), CP.ear, { key: 'reai' + sx, shadow: false });
  }
  cut(ellipsePts(x, hy, 62 * s, 56 * s, 0, 26), CP.rabbit, { key: 'rh' });
  cut(ellipsePts(x, hy + 16 * s, 8 * s, 6 * s, 0, 10), CP.ear, { key: 'rn', shadow: false, grain: false });
  critterFace(x, hy - 6 * s, s * 0.9, o.mood ?? 'smile', { ex: 24, my: 36, key: 'rfc', ph: 11 });
  for (const sx of [-1, 1]) cut(capsulePts(x + sx * 40 * s, y - 120 * s, x + sx * 52 * s, y - 70 * s, 22 * s, 4), CP.rabbit, { key: 'rarm' + sx, sb: 4 });
  ctx.restore();
}
// ---- the hedgehog, facing right. o: mood, run (0..1 leg cycle), spin
function hedgehog(x, y, s, o = {}) {
  ctx.save(); ctx.translate(x, y - 60 * s); ctx.rotate(o.spin ?? 0); ctx.translate(-x, -(y - 60 * s));
  const leg = Math.sin((o.run ?? 0) * TAU) * 10 * s;
  for (const [dx, k] of [[-40, 1], [30, -1]]) cut(ellipsePts(x + dx * s + leg * k, y - 10 * s, 16 * s, 12 * s, 0, 12), CP.hogD, { key: 'hl' + dx });
  const sp = [];   // the spiky back
  for (let i = 0; i <= 14; i++) { const a = Math.PI * 0.95 + i / 14 * Math.PI * 1.05, r = (i % 2 ? 110 : 82) * s; sp.push([x - 10 * s + Math.cos(a) * r, y - 50 * s + Math.sin(a) * r * 0.82]); }
  sp.push([x + 60 * s, y - 20 * s], [x - 90 * s, y - 20 * s]);
  cut(sp, CP.hogD, { key: 'hsp', crayon: '#3d2614', crAl: 0.4, crPer: 25 });
  cut(ellipsePts(x - 10 * s, y - 50 * s, 82 * s, 58 * s, 0, 26), CP.hog, { key: 'hb', pat: pat.stripes('rgba(60,35,15,0.25)', 3, 14, 0.6) });
  cut(ellipsePts(x + 62 * s, y - 52 * s, 46 * s, 40 * s, -0.15, 20), CP.hogFace, { key: 'hf' });
  cut(ellipsePts(x + 108 * s, y - 60 * s, 11 * s, 10 * s, 0, 10), PAL.ink, { key: 'hn', shadow: false, grain: false });
  critterFace(x + 66 * s, y - 64 * s, s * 0.7, o.mood ?? 'smile', { ex: 16, my: 30, key: 'hfc', ph: 23 });
  ctx.restore();
}
// ---- the bird, facing left (dir -1) or right (1). o: flap (wing speed), mood
function bird(x, y, s, o = {}) {
  const d = o.dir ?? -1, wa = Math.sin(TT * TAU * (o.flap ?? 0)) * 0.9;
  ctx.save(); ctx.translate(x, y); ctx.scale(-d, 1); ctx.translate(-x, -y);
  cut([[x + 30 * s, y], [x + 78 * s, y - 22 * s], [x + 80 * s, y + 12 * s]], CP.bird, { key: 'btl' });
  cut(ellipsePts(x, y, 46 * s, 40 * s, 0, 24), CP.bird, { key: 'bbd' });
  cut(ellipsePts(x - 6 * s, y + 12 * s, 30 * s, 22 * s, 0, 18), CP.birdL, { key: 'bbl', shadow: false });
  cut([[x - 40 * s, y - 6 * s], [x - 66 * s, y + 2 * s], [x - 40 * s, y + 10 * s]], CP.beak, { key: 'bbk', sb: 3 });
  cut(rot(ellipsePts(x + 14 * s, y - 18 * s, 34 * s, 16 * s, 0, 16), x + 4 * s, y - 10 * s, -0.4 - wa), '#3a77bd', { key: 'bwg', sb: 4 });
  dot(x - 18 * s, y - 10 * s, 6 * s, PAL.ink); dot(x - 16 * s, y - 12 * s, 2 * s, '#fff');
  ctx.restore();
  return [x + d * 60 * s, y + 2 * s];   // the beak tip
}
// ---- the balloon at (x, y) with its string down to (sx, sy) (or hanging when sx is null)
function balloon(x, y, s, sx, sy) {
  const kx = x, ky = y + 96 * s, P = [];
  const ex = sx ?? kx + Math.sin(TT * 3) * 10 * s, ey = sy ?? ky + 150 * s;
  for (let i = 0; i <= 12; i++) { const u = i / 12; P.push([lerp(kx, ex, u) + Math.sin(u * Math.PI * 2 + TT * 6) * 8 * s * (1 - Math.abs(u - 0.5) * 2), lerp(ky, ey, u)]); }
  ink(P, { w: 3.2 * s, color: '#4a3a33', amt: 0.3, key: 'bstr' });
  cut([[kx - 12 * s, ky + 12 * s], [kx + 12 * s, ky + 12 * s], [kx, ky - 4 * s]], CP.redD, { key: 'bknot', shadow: false });
  cut(ellipsePts(x, y, 76 * s, 92 * s, 0, 32), CP.red, { key: 'bln', crayon: CP.redD, crAl: 0.3, sb: 16, sy: 10 });
  cut(rot(ellipsePts(x - 30 * s, y - 38 * s, 14 * s, 26 * s, 0, 12), x - 30 * s, y - 38 * s, 0.5), 'rgba(255,255,255,0.7)', { key: 'blnh', shadow: false, grain: false, shade: false });
  return [kx, ky];
}
function stump(x, y, w, h, key) {
  cut(rect(x - w / 2, y - h, w, h, 6), CP.stump, { key: key + 's', pat: pat.stripes('rgba(110,60,25,0.25)', 4, 22) });
  cut(ellipsePts(x, y - h, w / 2, 18, 0, 22), CP.stumpTop, { key: key + 't', shadow: false, pat: (bb) => { ctx.strokeStyle = 'rgba(140,85,40,0.5)'; ctx.lineWidth = 2; for (let r = 6; r < w / 2; r += 9) { ctx.beginPath(); ctx.ellipse(x, y - h, r, r * 0.35, 0, 0, TAU); ctx.stroke(); } } });
}
function heart(x, y, s, c = '#f06292', key = 'ht') {
  const P = []; for (let i = 0; i < 40; i++) { const t = i / 40 * TAU; P.push([x + 16 * s * Math.sin(t) ** 3, y - s * (13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t))]); }
  cut(P, c, { key, sb: 6, sy: 4 });
}
