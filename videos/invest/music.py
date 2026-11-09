"""Procedural lofi hip-hop bed (no licensing issues): FM electric piano chords, sub bass, swung drums,
vinyl crackle, kick sidechain, gentle lowpass. lofi(total_seconds, sr, seed, drops=[t...]) -> float32 mono."""
import numpy as np

BPM = 80


def _midi(m):
    return 440.0 * 2 ** ((m - 69) / 12)


def _lp(x, cutoff, sr):
    """One-pole lowpass applied twice (gentle 12 dB/oct)."""
    a = np.exp(-2 * np.pi * cutoff / sr)
    for _ in range(2):
        y = np.empty_like(x)
        acc = 0.0
        b = 1 - a
        # vectorised IIR via cumulative trick is unstable; loop in chunks with numba-free python is slow,
        # so use scipy if available
        try:
            from scipy.signal import lfilter
            return lfilter([b], [1, -a], lfilter([b], [1, -a], x)).astype(np.float32)
        except ImportError:
            for i in range(len(x)):
                acc = acc * a + b * x[i]
                y[i] = acc
            x = y
    return x


def _hp(x, cutoff, sr):
    return (x - _lp(x, cutoff, sr)).astype(np.float32)


def epiano(freq, dur, sr, vel=1.0):
    """FM electric piano (Rhodes-like): bell attack + warm body + tremolo."""
    n = int(dur * sr)
    t = np.arange(n) / sr
    env = np.exp(-t * 1.6) * (1 - np.exp(-t * 300))
    idx = 2.2 * np.exp(-t * 6) + 0.35
    mod = np.sin(2 * np.pi * freq * t) * idx
    car = np.sin(2 * np.pi * freq * t + mod)
    bell = 0.18 * np.sin(2 * np.pi * freq * 14 * t) * np.exp(-t * 18)
    trem = 1 + 0.12 * np.sin(2 * np.pi * 4.2 * t)
    return (vel * env * trem * (car + bell)).astype(np.float32)


def kick(sr):
    t = np.arange(int(0.45 * sr)) / sr
    f = 48 + 90 * np.exp(-t * 28)
    ph = 2 * np.pi * np.cumsum(f) / sr
    return (np.sin(ph) * np.exp(-t * 7) + 0.3 * np.random.default_rng(1).standard_normal(len(t)) * np.exp(-t * 90)).astype(np.float32)


def snare(sr, rng):
    t = np.arange(int(0.3 * sr)) / sr
    noise = rng.standard_normal(len(t)).astype(np.float32)
    body = np.sin(2 * np.pi * 185 * t) * np.exp(-t * 22)
    return (0.6 * _hp(noise, 1200, sr) * np.exp(-t * 16) + 0.5 * body).astype(np.float32)


def hat(sr, rng, open_=False):
    t = np.arange(int((0.25 if open_ else 0.06) * sr)) / sr
    noise = rng.standard_normal(len(t)).astype(np.float32)
    return (_hp(noise, 7000, sr) * np.exp(-t * (14 if open_ else 70))).astype(np.float32)


# Fmaj9 - Em7 - Dm9 - Cmaj7 (calm, a bit melancholic), voiced around middle C
CHORDS = [[53, 57, 60, 64, 67], [52, 55, 59, 62, 67], [50, 53, 57, 60, 64], [48, 52, 55, 59, 62]]
BASS = [41, 40, 38, 36]


def lofi(total, sr=44100, seed=3, drops=()):
    rng = np.random.default_rng(seed)
    n = int(total * sr)
    out = np.zeros(n + sr * 4, np.float32)
    drums = np.zeros_like(out)
    duck = np.ones_like(out)
    beat = 60 / BPM
    bar = 4 * beat
    k, sn = kick(sr), snare(sr, rng)
    h, ho = hat(sr, rng), hat(sr, rng, True)
    nbars = int(total / bar) + 2
    drop_bars = {int(d / bar) for d in drops}
    for b in range(nbars):
        t0 = b * bar
        ci = b % 4
        intro = b < 2
        # chords: slightly strummed, a second softer hit on the "and" of 3
        for hit, vel in ((0.0, 0.9), (2.5 * beat, 0.45)):
            for j, m in enumerate(CHORDS[ci]):
                s = int((t0 + hit + j * 0.012) * sr)
                tone = epiano(_midi(m), bar - hit + 0.4, sr, vel * 0.2)
                out[s:s + len(tone)] += tone[:max(0, len(out) - s)]
        # sub bass with a little pickup
        for hit, dur, m in ((0, 1.6 * beat, BASS[ci]), (2 * beat, 0.9 * beat, BASS[ci]), (3.5 * beat, 0.45 * beat, BASS[ci] + 7)):
            s = int((t0 + hit) * sr)
            tt = np.arange(int(dur * sr)) / sr
            tone = 0.11 * np.tanh(1.3 * np.sin(2 * np.pi * _midi(m) * tt)) * np.minimum(1, tt * 60) * np.exp(-tt * 1.2)
            if not intro:
                out[s:s + len(tone)] += tone[:max(0, len(out) - s)]
        if intro or b in drop_bars:
            continue
        # drums with swing on the 8ths
        for st in range(8):
            sw = 0.09 * beat if st % 2 else 0.0
            s = int((t0 + st * beat / 2 + sw) * sr)
            if st in (0, 5):
                drums[s:s + len(k)] += 0.5 * k[:max(0, len(drums) - s)]
                d = np.ones(int(0.35 * sr), np.float32)
                d[:] = 1 - 0.45 * np.exp(-np.arange(len(d)) / sr * 9)
                duck[s:s + len(d)] = np.minimum(duck[s:s + len(d)], d[:max(0, len(duck) - s)])
            if st in (2, 6):
                drums[s:s + len(sn)] += 0.45 * sn[:max(0, len(drums) - s)]
            hh = ho if st == 7 and b % 2 else h
            drums[s:s + len(hh)] += (0.16 if st % 2 else 0.22) * hh[:max(0, len(drums) - s)]
    out = _lp(out, 5200, sr) * duck
    drums = _lp(drums, 9000, sr)
    # vinyl crackle + soft hiss
    crackle = np.zeros_like(out)
    pops = rng.integers(0, len(out), size=int(total * 7))
    crackle[pops] = rng.uniform(0.05, 0.25, size=len(pops)) * rng.choice([-1, 1], size=len(pops))
    crackle = _lp(crackle, 3500, sr) + 0.004 * _lp(rng.standard_normal(len(out)).astype(np.float32), 6000, sr)
    mix = out + drums * 0.9 + crackle
    # gentle tape saturation and fades
    mix = np.tanh(mix * 1.4) / 1.4
    fade = int(2 * sr)
    mix[:fade] *= np.linspace(0, 1, fade)
    mix = mix[:n]
    mix[-fade:] *= np.linspace(1, 0, fade)
    return (mix / (np.max(np.abs(mix)) + 1e-9) * 0.8).astype(np.float32)


if __name__ == "__main__":
    import sys, wave
    sr = 44100
    x = lofi(float(sys.argv[2]) if len(sys.argv) > 2 else 40, sr)
    with wave.open(sys.argv[1] if len(sys.argv) > 1 else "lofi.wav", "w") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(sr)
        w.writeframes((x * 32767).astype(np.int16).tobytes())
