  // =====================================================================
  //  SCORE — a bouncy D-major groove for the happy parts, a B-minor pad for the sad ones, cartoon SFX on every action,
  //  silence while the bird carries the balloon down, the loudest chord when it lands in Topa's paws.
  // =====================================================================
  const E = EV, BAR = 4 * BEAT;
  const PROG = [['D3', ['D5', 'Fs5', 'A5']], ['G2', ['B4', 'D5', 'G5']], ['A2', ['Cs5', 'E5', 'A5']], ['D3', ['A4', 'D5', 'Fs5']]];
  const kick = (t, v) => sub(t, v);
  const hat = (t, v) => noiseHit(t, 0.035, 'highpass', 7500, 0.7, v, 0.2);
  const boing = (t, v, k = 1) => { blip(t, 150 * k, 520 * k, 0.26, v); blip(t + 0.05, 230 * k, 760 * k, 0.2, v * 0.6, 0.2); };
  const pop = (t, v) => blip(t, 950, 320, 0.08, v);
  const chirp = (t, v, pan = 0.4) => { blip(t, 2600, 3700, 0.07, v, pan); blip(t + 0.1, 2900, 4300, 0.06, v * 0.8, pan); };
  const flap = (t, v) => noiseHit(t, 0.06, 'bandpass', 1300, 1.4, v, 0.3);
  const thud = (t, v) => { sub(t, v); noiseHit(t, 0.18, 'lowpass', 380, 0.7, v * 0.9); };
  const sadHorn = (t, v) => ['G4', 'Fs4', 'F4', 'E4'].forEach((n, i) => pluck(t + i * 0.32, nz(n), v, 0, i === 3 ? 0.9 : 0.3, 1200, 0.2));
  // the groove: bass on the beat, hats on the offbeats, a kick on 1 and 3, a plucked arpeggio
  function groove(t0, t1, v, o = {}) {
    for (let t = onBeat(t0), i = 0; t < t1 - 0.01; t += E8, i++) {
      const bar = Math.floor((t - GRID0) / BAR), [root, ch] = PROG[mod(bar, 4)], inBeat = mod(i, 2) === 0, beatN = mod(Math.round((t - GRID0) / BEAT), 4);
      to = 'm';
      if (inBeat) bass(t, nz(root), v * 1.3);
      if (!inBeat) hat(t, v * 0.35);
      if (o.kick !== false && inBeat && (beatN === 0 || beatN === 2 || o.fourOnFloor)) kick(t, v * 0.9);
      if (o.melody !== false) { const n = ch[mod(i, 3)]; if (mod(i, 4) !== 3) pluck(t, nz(n), v * (inBeat ? 0.9 : 0.6), 0.25 - mod(i, 3) * 0.2, 0.28, 4200, 0.25); }
    }
  }
  // ---- 1. the meadow
  groove(0, E.wind - 0.25, 0.09);
  to = 's';
  [0.9, 2.6, 4.1, 6.9, 8.6].forEach((t, i) => chirp(t, 0.035, i % 2 ? -0.5 : 0.5));
  pop(0.4, 0.08);                                                         // the title tag
  for (let i = 0; i < 4; i++) { const t = E.hearts + i * 0.35; pop(t, 0.06); to = 'm'; chime(t, [nz(['D6', 'Fs6', 'A6', 'D6'][i])], 0.03); to = 's'; }
  // ---- 2. the wind takes the balloon
  sweep(E.wind - 0.3, E.away + 0.4, 0.05, 250, 2200, -0.4);
  sweep(E.wind + 0.4, E.away + 1.6, 0.04, 400, 3200, 0.4);
  blip(E.away, 420, 1500, 0.9, 0.07, 0.3);                                // whee — up it goes
  pop(E.away + 2.2, 0.06);                                                // onto the branch
  // ---- 3. sad: stuck, Topa cries
  to = 'm';
  pad(E.away + 1.0, E.rabbitIn - 0.1, ['B2', 'D3', 'Fs3', 'B3'], 0.01, { type: 'triangle', cut: 700, att: 0.6, rel: 0.5, send: 0.4 });
  ['Fs5', 'D5', 'B4', 'A4', 'Fs4'].forEach((n, i) => pluck(VL('l4').t0 + i * 0.6, nz(n), 0.06, 0, 0.6, 2000, 0.4));
  to = 's';
  for (let i = 0; i < 6; i++) blip(E.cry + i * 0.33, 1900, 1150, 0.12, 0.03, i % 2 ? 0.3 : -0.3);   // tear drops
  // ---- 4. the rabbit
  groove(E.rabbitIn - 0.25, E.rabbitSad - 0.25, 0.075, { kick: false });
  to = 's';
  for (let k = 0; k < 4; k++) boing(E.rabbitIn + (k + 0.5) * 0.4, 0.035, 1.2);
  E.jumps.forEach((j, i) => { boing(j, 0.06, 1 + i * 0.25); pop(j + 0.9, 0.05); });
  sadHorn(E.rabbitSad, 0.07);
  // ---- 5. the hedgehog and the stumps
  groove(E.hogIn - 0.25, E.climb - 0.25, 0.08);
  to = 's';
  for (let t = E.hogIn; t < E.hogIn + 1.4; t += E16) noiseHit(t, 0.03, 'bandpass', 2400, 2, 0.02, 0.2);   // little running feet
  E.stumps.forEach((t, i) => { thud(t, 0.07); pop(t + 0.05, 0.04 + i * 0.01); });
  // ---- 6. Topa climbs: up the scale, almost... no
  to = 'm';
  ['D5', 'E5', 'Fs5', 'G5'].forEach((n, i) => pluck(E.climb + i * 0.4, nz(n), 0.08, 0, 0.3, 4000, 0.25));
  to = 's';
  for (let i = 0; i < 4; i++) boing(E.climb + i * 0.4, 0.02, 0.8);
  riser(E.climb + 1.6, E.almost, 0.025);
  to = 'm';
  for (let t = E.almost; t < E.no - 0.1; t += E16) pluck(t, nz('A5'), 0.035, 0, 0.12, 3500, 0.1);   // the reach, trembling
  sadHorn(E.no, 0.07);
  to = 's'; boing(E.down, 0.05, 0.7); thud(E.down + 0.7, 0.07);
  // ---- 7. the bird (the busiest stretch, before the silence)
  groove(E.birdIn - 0.25, E.lift - 0.3, 0.085, { fourOnFloor: true });
  to = 's';
  for (let i = 0; i < 4; i++) chirp(E.birdIn + i * 0.45, 0.05, -0.3);
  for (let t = E.birdIn; t < E.lift; t += 0.16) flap(t, 0.025);
  chirp(E.grab, 0.06, 0);
  // ---- 8. silence: only a few soft wing beats as the balloon floats down
  for (let t = E.lift + 0.2; t < E.lift + 1.4; t += 0.3) flap(t, 0.006);
  // ---- 9. THE PAYOFF: the balloon lands in Topa's paws
  to = 'm';
  ['D4', 'A4', 'D5', 'Fs5', 'A5'].forEach((n, i) => pluck(E.land, nz(n), 0.3, -0.4 + i * 0.2, 0.45, 5200, 0.35));
  to = 's'; sub(E.land, 0.45); noiseHit(E.land, 0.5, 'highpass', 3000, 0.5, 0.06, 0, 0.4);
  to = 'm'; chime(E.land + 0.05, [nz('D6'), nz('A6')], 0.05);
  pad(E.land, E.hooray - 0.1, ['D3', 'A3', 'D4', 'Fs4'], 0.02, { cut: 1400, att: 0.08, rel: 0.4, send: 0.5 });
  // ---- 10. hooray: everyone dances
  groove(onBeat(E.hooray - 0.25), DURATION - 1.5, 0.1, { fourOnFloor: true });
  to = 's';
  for (let i = 0; i < 6; i++) { pop(E.hooray + i * 0.35, 0.04); }
  for (let i = 0; i < 8; i++) chirp(E.hooray + 0.6 + i * 0.8, 0.03, i % 2 ? 0.5 : -0.5);
  to = 'm';
  ['D4', 'A4', 'D5', 'Fs5', 'A5', 'D6'].forEach((n, i) => pluck(DURATION - 1.5 + i * 0.03, nz(n), 0.09, -0.5 + i * 0.2, 1.2, 4500, 0.5));   // the last chord
  chime(E.end, [nz('D6'), nz('Fs6'), nz('A6')], 0.04);
