// =====================================================================
//  CAMERAS AND (NO) BRIDGES — every boundary is a hard cut on the 8th grid (BRIDGES = []).
//  Each shot frames the one meadow: camOf({ z, p, to }) puts world point p on screen point to at zoom z.
//  The close-ups follow their subject, and a soft push-in keeps held shots alive.
// =====================================================================
const ERA_BG = ERA_LIST.map(() => '#a6dcf3');
function pieceCam(era, t) {
  const kind = SHOT_LIST[era][1], t0 = ERA_LIST[era][0], pushIn = 1 + seg(t, t0, ERA_LIST[era][1]) * 0.06;
  if (kind === 'wide') {
    // a little bump on the stump thuds and the rabbit's landings
    const thud = EV.stumps.concat(EV.jumps.map((j) => j + 0.9)).reduce((a, s) => a + (t > s && t < s + 0.3 ? (1 - seg(t, s, s + 0.3)) * 0.025 : 0), 0);
    const z = 1 + (pushIn - 1) * 0.5 + thud;
    return camOf({ z, p: [W / 2, H * 0.62], to: [W / 2, H * 0.62] });
  }
  if (kind === 'bear') { const b = bearState(); return camOf({ z: 1.75 * pushIn, p: [b.x + 30, b.y - 230], to: [W / 2, H * 0.5] }); }
  if (kind === 'top') return camOf({ z: 1.9 * pushIn, p: [STUCK[0] + 70, STUCK[1] + 60], to: [W / 2, H * 0.5] });
  if (kind === 'rabbit') return camOf({ z: 1.8 * pushIn, p: [1360, GROUND - 170], to: [W / 2, H * 0.58] });
  if (kind === 'reach') return camOf({ z: 1.7 * pushIn, p: [STUMP_X + 50, 330], to: [W / 2, H * 0.5] });
  return null;
}
const BRIDGES = [];
