// =====================================================================
//  THE MEADOW — one world, drawn whole every frame; where everyone is comes from TT and the cues (EV).
//  World coords = the wide shot (1920x1080). Close-ups are cameras on this same world (src/bridges.js).
// =====================================================================
const GROUND = 930, TREE_X = 1610, STUCK = [1415, 150], STUMP_X = 1330, STUMP_H = 72, BS = 0.95;
// keyed path: keys [[t, x, y], ...], eased between keys (ease per segment)
function path(keys, ease = EZ.io) {
  if (TT <= keys[0][0]) return [keys[0][1], keys[0][2]];
  for (let i = 1; i < keys.length; i++) if (TT < keys[i][0]) { const [a, ax, ay] = keys[i - 1], [b, bx, by] = keys[i], u = ease(seg(TT, a, b)); return [lerp(ax, bx, u), lerp(ay, by, u)]; }
  const k = keys[keys.length - 1]; return [k[1], k[2]];
}
const hop = (t0, d, h) => (TT > t0 && TT < t0 + d ? Math.sin(seg(TT, t0, t0 + d) * Math.PI) * h : 0);
const between = (a, b) => TT >= a && TT < b;
const windK = () => clamp(seg(TT, EV.wind - 0.2, EV.wind + 0.4)) * (1 - seg(TT, EV.away + 1.2, EV.away + 2.4));
// ---- where Topa is
function bearState() {
  const top = GROUND - 3 * STUMP_H;
  let [x, y] = path([[EV.run, 640, GROUND], [EV.run + 1.5, 1180, GROUND], [EV.climb, 1180, GROUND], [EV.climb + 1.6, STUMP_X, top], [EV.down, STUMP_X, top], [EV.down + 0.7, 1180, GROUND]]);
  if (between(EV.run, EV.run + 1.5)) y -= Math.abs(Math.sin(TT * TAU * 2.4)) * 18;                     // running
  if (between(EV.climb, EV.climb + 1.6)) y -= Math.abs(Math.sin(TT * TAU * 2)) * 22;                  // climbing steps
  if (between(EV.down, EV.down + 0.7)) y -= Math.sin(seg(TT, EV.down, EV.down + 0.7) * Math.PI) * 90; // the jump down
  if (TT > EV.hooray) y -= Math.abs(Math.sin((TT - EV.hooray) * Math.PI * 2)) * 34;                    // the dance
  let mood = 'smile', armL = 0.35, armR = 2.5, lean = 0, reach = 1;
  if (between(EV.wave, EV.wave + 2.2)) armL = 2.5 + Math.sin(TT * TAU * 2.2) * 0.45;                   // waving hello
  if (TT > EV.hearts - 0.3 && TT < EV.wind) mood = 'happy';
  if (TT >= EV.wind) mood = 'wow';
  if (TT >= EV.away + 0.6) { mood = 'sad'; armR = 0.4; }
  if (between(EV.away, EV.away + 0.6)) armR = 2.9;                                                     // grabbing after it
  if (TT >= EV.cry) mood = 'cry';
  if (TT >= EV.rabbitIn + 0.6) mood = 'smile';
  if (TT >= EV.rabbitSad) mood = 'sad';
  if (TT >= EV.hogIn + 0.4) mood = 'smile';
  if (TT >= EV.climb) mood = 'blink';
  if (between(EV.almost - 0.4, EV.no)) { mood = 'wow'; armR = Math.PI - 0.22 + Math.sin(TT * 30) * 0.03; lean = -0.05; y -= 14; reach = 1.5; }
  if (TT >= EV.no) mood = 'sad';
  if (TT >= EV.birdIn) mood = 'wow';
  if (TT >= EV.lift) { armL = 2.6; armR = 2.6; }
  if (TT >= EV.land - 0.1) { mood = 'happy'; armL = 0.4; armR = 2.6; }
  if (TT >= EV.hooray) { armL = 2.4 + Math.sin(TT * TAU) * 0.5; armR = 2.6; }
  return { x, y, mood, armL, armR, lean, reach, squash: TT >= EV.land && TT < EV.land + 0.3 ? 1 - seg(TT, EV.land, EV.land + 0.3) : 0 };
}
// ---- the rabbit: hops in, three jumps under the balloon, droops, hops aside for the hedgehog
function rabbitState() {
  const t0 = EV.rabbitIn, x0 = -160, x1 = 1360;
  let [x, y] = path([[t0, x0, GROUND], [t0 + 1.6, x1, GROUND], [EV.hogIn, x1, GROUND], [EV.hogIn + 1.0, 700, GROUND]], (u) => u);
  if (between(t0, t0 + 1.6)) y -= Math.abs(Math.sin(seg(TT, t0, t0 + 1.6) * Math.PI * 4)) * 70;       // four hops in
  if (between(EV.hogIn, EV.hogIn + 1.0)) y -= Math.abs(Math.sin(seg(TT, EV.hogIn, EV.hogIn + 1) * Math.PI * 2)) * 50;
  EV.jumps.forEach((j, i) => { y -= hop(j, 0.9, [100, 140, 170][i]); });
  if (TT > EV.hooray) y -= Math.abs(Math.sin((TT - EV.hooray) * Math.PI * 2 + 1)) * 60;
  const crouch = EV.jumps.reduce((c, j) => c + (between(j - 0.2, j) ? seg(TT, j - 0.2, j) : 0), 0);
  const sad = TT >= EV.rabbitSad && TT < EV.hogIn + 1.2 ? EZ.o2(seg(TT, EV.rabbitSad, EV.rabbitSad + 0.4)) : 0;
  return { x, y, crouch, sad, mood: sad > 0.5 ? 'sad' : TT >= EV.land ? 'happy' : 'smile', on: TT >= t0 };
}
function hogState() {
  const t0 = EV.hogIn, [x, y] = path([[t0, -180, GROUND], [t0 + 1.4, 920, GROUND]], (u) => u);
  const hopY = TT > EV.hooray ? Math.abs(Math.sin((TT - EV.hooray) * Math.PI * 2 + 2)) * 40 : 0;
  const spin = TT > EV.hooray ? Math.floor((TT - EV.hooray) / 1.0) % 2 ? 0 : seg(mod(TT - EV.hooray, 1), 0, 0.6) * TAU : 0;
  return { x, y: y - hopY, run: between(t0, t0 + 1.4) ? TT * 3 : 0, spin, mood: TT >= EV.land ? 'happy' : TT >= EV.climb && TT < EV.birdIn ? 'wow' : 'smile', on: TT >= t0 };
}
// ---- the balloon (and the bird carrying it); needs Topa's paw
function balloonState(paw) {
  const held = [paw[0] + 40 + Math.sin(TT * 2) * 10, paw[1] - 250];
  if (TT < EV.away) return { c: held, end: paw };
  const fly = seg(TT, EV.away, EV.away + 2.2);
  if (fly < 1) {   // up in an arc on the wind, then onto the branch
    const u = EZ.io(fly), q = [1000, -120], a = held;
    const c = [(1 - u) ** 2 * a[0] + 2 * (1 - u) * u * q[0] + u * u * STUCK[0], (1 - u) ** 2 * a[1] + 2 * (1 - u) * u * q[1] + u * u * STUCK[1]];
    return { c, end: null };
  }
  const stuckEnd = [STUCK[0] + 6, STUCK[1] + 96 * 0.9 + 62];   // the string wound round the branch, its end hanging short
  if (TT < EV.lift) {
    const wob = [Math.sin(TT * 2.3) * 6, Math.sin(TT * 3.1) * 4];
    return { c: [STUCK[0] + wob[0], STUCK[1] + wob[1] - (TT > EV.grab ? seg(TT, EV.grab, EV.grab + 0.6) * 30 : 0)], end: null, stuckEnd };
  }
  const target = [paw[0], paw[1]];
  if (TT < EV.land) {   // the bird holds the string end and floats down to Topa
    const u = EZ.io(seg(TT, EV.lift, EV.land)), e = [lerp(stuckEnd[0], target[0], u) + Math.sin(u * Math.PI * 3) * 40 * (1 - u), lerp(stuckEnd[1] - 30, target[1], u)];
    return { c: [e[0] + 10, e[1] - 96 * 0.9 - 160], end: e, beak: e };
  }
  return { c: held, end: paw };
}
function birdPos(b) {
  if (TT < EV.birdIn) return null;
  if (TT < EV.grab) { const [x, y] = path([[EV.birdIn, 2080, 110], [EV.birdIn + 1.6, 1560, 300], [EV.grab - 0.3, 1520, 320], [EV.grab, b.stuckEnd[0] + 62, b.stuckEnd[1] + 2]]); return { x, y: y + Math.sin(TT * 9) * 8, flap: 7, dir: -1 }; }
  if (TT < EV.land) { const e = b.beak ?? [b.stuckEnd[0], b.stuckEnd[1] - (TT > EV.grab ? seg(TT, EV.grab, EV.grab + 0.6) * 30 : 0)]; return { x: e[0] + 62, y: e[1] + 2, flap: 6, dir: -1 }; }
  const [x, y] = path([[EV.land, 1400, 600], [EV.land + 1.2, 1500, 255], [EV.hooray, 1500, 255]]);
  if (TT > EV.hooray) { const a = (TT - EV.hooray) * 1.6; return { x: 1150 + Math.cos(a) * 330, y: 300 + Math.sin(a) * 90, flap: 6, dir: Math.sin(a) > 0 ? -1 : 1 }; }
  return { x, y, flap: TT < EV.land + 1.2 ? 6 : 0, dir: -1 };
}
