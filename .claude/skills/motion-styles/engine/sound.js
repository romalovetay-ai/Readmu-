// sound.js: synthesized sound-effects kit for the Creator OS motion-style suite.
// Plain Web Audio, no files. A scene writes   score(k) { k.bed('room', 0, D); k.play('pop', 1.2); ... }
// and the same function schedules into the live player (SND.live) or an OfflineAudioContext (SND.renderOffline)
// so the MP4 render gets the identical mix. Times are seconds on the scene clock. Seeded, so renders repeat exactly.
(function () {
  'use strict';
  const SND = (window.SND = {});

  function rng(seed) {
    let h = 2166136261; const s = String(seed);
    for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
    let a = h >>> 0 || 1;
    return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  const NOTE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
  const hz = (n) => { if (typeof n === 'number') return n; const m = /^([A-G])([#b]?)(-?\d)$/.exec(n); return 440 * Math.pow(2, (NOTE[m[1]] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0) + (Number(m[3]) - 4) * 12 - 9) / 12); };
  SND.hz = hz;

  // Build a kit bound to an AudioContext. `from` = scene time that maps to ctx time `base`.
  SND.kit = function (ctx, o = {}) {
    const VO = !!o.voiceover, from = o.from || 0, base = ctx.currentTime + (o.delay ?? 0.05), SR = ctx.sampleRate;
    const at = (t) => (Math.round((base + (t - from)) * SR) + 0.25) / SR;
    const live = (t) => t >= from - 0.001;                       // skip events before the playhead
    const master = ctx.createGain(); master.gain.value = o.master ?? 1.7;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -14; comp.knee.value = 10; comp.ratio.value = 3.5; comp.attack.value = 0.003; comp.release.value = 0.2;
    // brick-wall-ish limiter after the master so loud hits never clip the MP4 mix
    const lim = ctx.createDynamicsCompressor();
    lim.threshold.value = -3; lim.knee.value = 0; lim.ratio.value = 20; lim.attack.value = 0.001; lim.release.value = 0.08;
    comp.connect(master); master.connect(lim); lim.connect(o.dest || ctx.destination);
    const bus = {};
    for (const [n, g] of Object.entries({ sfx: VO ? 0.6 : 0.85, amb: VO ? 0 : 0.5, music: VO ? 0 : 0.42 })) { bus[n] = ctx.createGain(); bus[n].gain.value = g; bus[n].connect(comp); }
    // generated room reverb (decaying stereo noise, darker in the tail)
    const verb = ctx.createConvolver(), wet = ctx.createGain(); wet.gain.value = 0.22;
    { const secs = 1.4, n = Math.floor(SR * secs), ir = ctx.createBuffer(2, n, SR), r = rng('verb');
      for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); let lp = 0; for (let i = 0; i < n; i++) { const k = i / n; lp += ((r() * 2 - 1) - lp) * (0.9 - 0.75 * k); d[i] = lp * Math.pow(1 - k, 2.6); } }
      verb.buffer = ir; verb.connect(wet); wet.connect(comp); }
    const noiseBuf = (() => { const n = SR * 2, b = ctx.createBuffer(1, n, SR), d = b.getChannelData(0), r = rng('noise'); for (let i = 0; i < n; i++) d[i] = r() * 2 - 1; return b; })();

    const out = (busName = 'sfx', send = 0.15) => { const g = ctx.createGain(); g.connect(bus[busName]); if (send) { const s = ctx.createGain(); s.gain.value = send; g.connect(s); s.connect(verb); } return g; };
    const env = (g, t, a, d, peak, curve = 'exp') => { g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); if (curve === 'exp') g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); else g.gain.linearRampToValueAtTime(0.0001, t + a + d); };
    function tone({ t, f = 440, f2, dur = 0.2, type = 'sine', gain = 0.3, a = 0.004, bus: b = 'sfx', send = 0.15, glide = 'exp' }) {
      if (!live(t)) return; const T = at(t), os = ctx.createOscillator(), g = ctx.createGain();
      os.type = type; os.frequency.setValueAtTime(hz(f), T);
      if (f2) os.frequency[glide === 'exp' ? 'exponentialRampToValueAtTime' : 'linearRampToValueAtTime'](hz(f2), T + dur);
      env(g, T, a, dur, gain); os.connect(g); g.connect(out(b, send)); os.start(T); os.stop(T + a + dur + 0.05);
    }
    function noise({ t, dur = 0.2, gain = 0.3, a = 0.003, type = 'bandpass', f = 2000, f2, q = 1, bus: b = 'sfx', send = 0.12, curve = 'exp', mod }) {
      if (!live(t)) return; const T = at(t), src = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      src.buffer = noiseBuf; src.loop = true; fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f, T);
      if (f2) fl.frequency.exponentialRampToValueAtTime(f2, T + dur);
      env(g, T, a, dur, gain, curve);
      if (mod) { // amplitude modulation for strokes / scribbles (seeded wobble)
        const r = rng(mod + ':' + t), steps = Math.max(2, Math.floor(dur / 0.045));
        for (let i = 0; i <= steps; i++) { const tt = T + a + (dur * i) / steps; g.gain.setValueAtTime(Math.max(0.0001, gain * (0.25 + 0.75 * r())), tt); }
        g.gain.exponentialRampToValueAtTime(0.0001, T + a + dur + 0.04);
      }
      src.connect(fl); fl.connect(g); g.connect(out(b, send)); src.start(T, rng(t)() * 1.5); src.stop(T + a + dur + 0.1);
    }

    const VOICES = {
      pop: (t, p) => { tone({ t, f: 880 * (p.pitch || 1), f2: 260 * (p.pitch || 1), dur: 0.09, type: 'sine', gain: 0.32 * (p.gain ?? 1) }); noise({ t, dur: 0.02, gain: 0.08, f: 3000 }); },
      stamp: (t, p) => { tone({ t, f: 140, f2: 48, dur: 0.22, gain: 0.5 * (p.gain ?? 1) }); noise({ t, dur: 0.12, gain: 0.25 * (p.gain ?? 1), type: 'lowpass', f: 900 }); },
      thud: (t, p) => { tone({ t, f: 90, f2: 38, dur: 0.35, gain: 0.55 * (p.gain ?? 1), send: 0.3 }); },
      whoosh: (t, p) => noise({ t, dur: p.dur || 0.35, a: (p.dur || 0.35) * 0.45, gain: 0.22 * (p.gain ?? 1), f: p.up === false ? 3200 : 300, f2: p.up === false ? 300 : 3200, q: 0.9, curve: 'lin', send: 0.2 }),
      tick: (t, p) => { noise({ t, dur: 0.012, gain: 0.18 * (p.gain ?? 1), type: 'highpass', f: 4500 }); tone({ t, f: 2100 * (p.pitch || 1), dur: 0.015, gain: 0.06 }); },
      click: (t, p) => tone({ t, f: 1200 * (p.pitch || 1), dur: 0.012, type: 'square', gain: 0.07 * (p.gain ?? 1), send: 0.02 }),
      blip: (t, p) => tone({ t, f: p.note || 'E6', dur: p.dur || 0.07, type: 'square', gain: 0.08 * (p.gain ?? 1), send: 0.05 }),
      pluck: (t, p) => tone({ t, f: p.note || 'C5', dur: p.dur || 0.5, type: 'triangle', gain: 0.22 * (p.gain ?? 1), send: 0.25 }),
      chime: (t, p) => { const n = p.note || 'A5'; tone({ t, f: n, dur: 1.3, gain: 0.16 * (p.gain ?? 1), send: 0.45 }); tone({ t: t + 0.02, f: hz(n) * 1.5, dur: 1.0, gain: 0.08 * (p.gain ?? 1), send: 0.45 }); },
      ding: (t, p) => { tone({ t, f: 'E6', dur: 0.8, gain: 0.14 * (p.gain ?? 1), send: 0.35 }); tone({ t: t + 0.09, f: 'B6', dur: 0.9, gain: 0.12 * (p.gain ?? 1), send: 0.35 }); },
      wrong: (t, p) => { tone({ t, f: 220, dur: 0.14, type: 'square', gain: 0.08 * (p.gain ?? 1) }); tone({ t: t + 0.15, f: 185, dur: 0.22, type: 'square', gain: 0.08 * (p.gain ?? 1) }); },
      riser: (t, p) => { const d = p.dur || 1.2; noise({ t, dur: d, a: d * 0.9, gain: 0.18 * (p.gain ?? 1), f: 400, f2: 6000, curve: 'lin', send: 0.25 }); tone({ t, f: 110, f2: 440, dur: d, a: d * 0.9, type: 'sawtooth', gain: 0.05 * (p.gain ?? 1), glide: 'lin', send: 0.2 }); },
      glitch: (t, p) => { const r = rng('g' + t); for (let i = 0; i < 6; i++) tone({ t: t + i * 0.025, f: 200 + r() * 1800, dur: 0.02, type: 'square', gain: 0.07 * (p.gain ?? 1), send: 0 }); },
      paper: (t, p) => noise({ t, dur: p.dur || 0.18, gain: 0.14 * (p.gain ?? 1), f: 1800, q: 0.6, mod: 'paper' }),
      swell: (t, p) => { const d = p.dur || 2; for (const n of p.chord || ['C4', 'E4', 'G4']) tone({ t, f: n, dur: d, a: d * 0.5, gain: 0.05 * (p.gain ?? 1), bus: 'music', send: 0.4, glide: 'lin' }); },
      // Drawing noises: length matches the draw-on. medium: marker | chalk | pencil | brush | pen | spray
      scribble: (t, p) => {
        const m = p.medium || 'marker', d = p.dur || 0.6, g = p.gain ?? 1;
        const M = { marker: [2600, 1.4, 0.16], chalk: [4200, 2.5, 0.2], pencil: [6200, 1.2, 0.08], brush: [1100, 0.7, 0.1], pen: [5200, 3, 0.07], spray: [7000, 0.5, 0.12] }[m];
        noise({ t, dur: d, gain: M[2] * g, f: M[0], q: M[1], mod: m, send: 0.06 });
        if (m === 'chalk') for (let i = 0; i < Math.floor(d / 0.12); i++) noise({ t: t + i * 0.12 + 0.03, dur: 0.008, gain: 0.12 * g, type: 'highpass', f: 6000 });
      },
      type: (t, p) => { const d = p.dur || 0.6, r = rng('type' + t); let x = t; while (x < t + d) { noise({ t: x, dur: 0.018, gain: (0.08 + r() * 0.06) * (p.gain ?? 1), f: 3200 + r() * 1500, q: 2 }); x += 0.055 + r() * 0.06; } },
      count: (t, p) => { const d = p.dur || 1, n = Math.min(Math.round(d * 12), 30); for (let i = 0; i < n; i++) { const k = i / n; VOICES.tick(t + d * (1 - Math.pow(1 - k, 1.8)), { gain: 0.8, pitch: 1 + k * 0.3 }); } },
    };

    const BEDS = {
      room: (t0, t1, g) => noise({ t: t0, dur: t1 - t0, a: 0.6, gain: 0.035 * g, type: 'lowpass', f: 420, q: 0.3, bus: 'amb', send: 0, curve: 'lin' }),
      tape: (t0, t1, g) => noise({ t: t0, dur: t1 - t0, a: 0.4, gain: 0.02 * g, type: 'highpass', f: 6500, bus: 'amb', send: 0, curve: 'lin' }),
      hum: (t0, t1, g) => { tone({ t: t0, f: 60, dur: t1 - t0, a: 0.5, gain: 0.04 * g, bus: 'amb', send: 0, glide: 'lin' }); tone({ t: t0, f: 120, dur: t1 - t0, a: 0.5, gain: 0.015 * g, bus: 'amb', send: 0, glide: 'lin' }); },
      vinyl: (t0, t1, g) => { BEDS.tape(t0, t1, g * 0.7); const r = rng('vinyl'); for (let x = t0; x < t1; x += 0.08 + r() * 0.35) noise({ t: x, dur: 0.006, gain: 0.05 * g * r(), type: 'highpass', f: 3000, bus: 'amb', send: 0 }); },
      space: (t0, t1, g) => { for (const [f, d] of [[55, 0], [82.4, 0.6], [110.3, 1.1]]) tone({ t: t0, f, dur: t1 - t0, a: 1.5 + d, gain: 0.028 * g, bus: 'amb', send: 0.5, glide: 'lin' }); },
      ocean: (t0, t1, g) => { for (let x = t0; x < t1; x += 3.2) noise({ t: x, dur: 3.0, a: 1.4, gain: 0.05 * g, type: 'lowpass', f: 700, bus: 'amb', send: 0.3, curve: 'lin' }); },
      crowd: (t0, t1, g) => noise({ t: t0, dur: t1 - t0, a: 0.8, gain: 0.03 * g, f: 900, q: 0.4, bus: 'amb', send: 0.2, curve: 'lin', mod: 'crowd' }),
    };

    return {
      vo: VO,
      hz,
      play(name, t, p = {}) { const v = VOICES[name]; if (!v) throw new Error('unknown sound ' + name); v(t, p); },
      bed(kind, t0, t1, gain = 1) { if (VO) return; BEDS[kind](Math.max(t0, from), t1, gain); },
      tone: (p) => tone(p),
      noise: (p) => noise(p),
      voices: Object.keys(VOICES), beds: Object.keys(BEDS),
    };
  };

  // Live playback in the player from scene time `fromT`; returns stop().
  SND.live = function (score, fromT = 0, o = {}) {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const k = SND.kit(ctx, { ...o, from: fromT }); score(k);
    return () => ctx.close();
  };
  // Offline render -> interleaved stereo Float32Array (for the MP4 mux).
  SND.renderOffline = async function (score, dur, sr = 48000, o = {}) {
    const ctx = new OfflineAudioContext(2, Math.ceil((dur + 0.5) * sr), sr);
    const k = SND.kit(ctx, { ...o, from: 0, delay: 0 }); score(k);
    const buf = await ctx.startRendering(), L = buf.getChannelData(0), R = buf.getChannelData(1), out = new Float32Array(L.length * 2);
    for (let i = 0; i < L.length; i++) { out[2 * i] = L[i]; out[2 * i + 1] = R[i]; }
    return out;
  };
})();
