"""SFX library (same sounds as the approved demo)."""
import numpy as np
SR = 44100


def tone(freqs, dur, decay, amp=0.3, noise=0.0, seed=0):
    n = int(SR * dur)
    t = np.arange(n) / SR
    rng = np.random.default_rng(seed)
    out = sum(np.sin(2 * np.pi * f * t + rng.random()) for f in freqs) / len(freqs)
    if noise:
        out = out * (1 - noise) + noise * np.convolve(rng.standard_normal(n), np.ones(6) / 6, "same")
    return (amp * out * np.exp(-t * decay)).astype(np.float32)


def sfx_lib():
    rng = np.random.default_rng(4)
    L = {}
    L["clink"] = [tone([2600 + 300 * k, 4100 + 200 * k, 6200], 0.35, 14, 0.22, seed=k) for k in range(4)]
    L["pop"] = tone([500], 0.18, 22, 0.35)
    n = int(SR * 0.18)
    t = np.arange(n) / SR
    L["pop"] = (0.35 * np.sin(2 * np.pi * (380 + 900 * np.exp(-t * 28)) * t) * np.exp(-t * 20)).astype(np.float32)
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    wn = np.convolve(rng.standard_normal(n), np.ones(18) / 18, "same")
    L["whoosh"] = (0.5 * wn * np.sin(np.pi * t / t[-1]) ** 2).astype(np.float32)
    n = int(SR * 0.5)
    t = np.arange(n) / SR
    L["thud"] = (0.6 * np.sin(2 * np.pi * (70 + 80 * np.exp(-t * 18)) * t) * np.exp(-t * 9)
                 + 0.15 * np.convolve(rng.standard_normal(n), np.ones(40) / 40, "same") * np.exp(-t * 25)).astype(np.float32)
    n = int(SR * 0.9)
    t = np.arange(n) / SR
    L["sparkle"] = sum(tone([3000 + 700 * k], 0.9, 6 + k, 0.08, seed=k) * (np.arange(n) > k * 0.07 * SR) for k in range(6)).astype(np.float32)
    n = int(SR * 0.35)
    t = np.arange(n) / SR
    L["crack"] = (0.45 * rng.standard_normal(n) * np.exp(-t * 18)).astype(np.float32)
    n = int(SR * 0.6)
    t = np.arange(n) / SR
    L["splash"] = (0.35 * np.convolve(rng.standard_normal(n), np.ones(8) / 8, "same") * np.exp(-t * 7)).astype(np.float32)
    n = int(SR * 3.0)
    t = np.arange(n) / SR
    L["thunder"] = (0.7 * np.convolve(rng.standard_normal(n), np.ones(300) / 300, "same") * 6 * np.exp(-t * 1.2)
                    * (0.6 + 0.4 * np.sin(t * 9))).astype(np.float32)
    n = int(SR * 0.12)
    t = np.arange(n) / SR
    L["tick"] = (0.18 * np.sin(2 * np.pi * 1800 * t) * np.exp(-t * 60)).astype(np.float32)
    L["ding"] = tone([1320, 1980], 0.8, 6, 0.22)
    L["rise"] = (0.25 * np.sin(2 * np.pi * np.cumsum(np.linspace(80, 400, int(SR * 1.2))) / SR)
                 * np.linspace(0, 1, int(SR * 1.2)) ** 2).astype(np.float32)
    return L


