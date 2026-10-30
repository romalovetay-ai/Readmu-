// =====================================================================
//  CAMERAS AND (NO) BRIDGES — every boundary is a hard cut on the 8th grid (BRIDGES = []).
//  Each shot frames the one meadow: camOf({ z, p, to }) puts world point p on screen point to at zoom z.
//  The close-ups follow their subject, and a soft push-in keeps held shots alive.
//  9:16 (Shorts): the meadow is wider than the frame, so the wide shot pans with the action (wideCX).
// =====================================================================
const ERA_BG = ERA_LIST.map(() => '#a6dcf3');
// where the action is, for the 9:16 wide shot: Topa, then the balloon on its way to the tree, then the friends
function wideCX() {
  return path1([[0, 700], [EV.away, 700], [EV.away + 2.2, 1230], [EV.rabbitIn, 1230], [EV.rabbitIn + 1.6, 1290], [EV.hogIn, 1290], [EV.hogIn + 1.4, 1130],
    [EV.climb, 1130], [EV.climb + 1.6, 1260], [EV.birdIn, 1260], [EV.birdIn + 1.6, 1330], [EV.lift, 1330], [EV.land, 1220], [EV.hooray, 1220], [EV.hooray + 1.5, 1000]]);
}
const path1 = (keys) => path(keys.map(([t, x]) => [t, x, 0]))[0];
function pieceCam(era, t) {
  const kind = SHOT_LIST[era][1], t0 = ERA_LIST[era][0], pushIn = 1 + seg(t, t0, ERA_LIST[era][1]) * 0.06;
  // a little bump on the stump thuds and the rabbit's landings
  const thud = EV.stumps.concat(EV.jumps.map((j) => j + 0.9)).reduce((a, s) => a + (t > s && t < s + 0.3 ? (1 - seg(t, s, s + 0.3)) * 0.025 : 0), 0);
  if (PORTRAIT) {
    if (kind === 'wide') return camOf({ z: (t > EV.hooray ? 1.0 : 1.12) + (pushIn - 1) * 0.5 + thud, p: [wideCX(), GROUND], to: [W / 2, H * 0.76] });
    if (kind === 'bear') { const b = bearState(); return camOf({ z: 1.7 * pushIn, p: [b.x + 30, b.y - 260], to: [W / 2, H * 0.48] }); }
    if (kind === 'top') return camOf({ z: 1.8 * pushIn, p: [STUCK[0] + 40, STUCK[1] + 110], to: [W / 2, H * 0.42] });
    if (kind === 'rabbit') return camOf({ z: 1.7 * pushIn, p: [1360, GROUND - 200], to: [W / 2, H * 0.6] });
    if (kind === 'reach') return camOf({ z: 1.6 * pushIn, p: [STUMP_X + 40, 400], to: [W / 2, H * 0.45] });
    return null;
  }
  if (kind === 'wide') return camOf({ z: 1 + (pushIn - 1) * 0.5 + thud, p: [W / 2, H * 0.62], to: [W / 2, H * 0.62] });
  if (kind === 'bear') { const b = bearState(); return camOf({ z: 1.75 * pushIn, p: [b.x + 30, b.y - 230], to: [W / 2, H * 0.5] }); }
  if (kind === 'top') return camOf({ z: 1.9 * pushIn, p: [STUCK[0] + 70, STUCK[1] + 60], to: [W / 2, H * 0.5] });
  if (kind === 'rabbit') return camOf({ z: 1.8 * pushIn, p: [1360, GROUND - 170], to: [W / 2, H * 0.58] });
  if (kind === 'reach') return camOf({ z: 1.7 * pushIn, p: [STUMP_X + 50, 330], to: [W / 2, H * 0.5] });
  return null;
}
const BRIDGES = [];
