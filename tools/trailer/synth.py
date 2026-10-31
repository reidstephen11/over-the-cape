import numpy as np
SR = 44100
rng = np.random.default_rng(11)
hz = lambda m: 440 * 2 ** ((m - 69) / 12)

def lowpass(x, a):
    # one-pole low-pass, a in (0,1): smaller = darker
    y = np.empty_like(x); acc = 0.0
    # vectorised via lfilter-like cumulative trick is awkward; chunked python loop is fine at 44.1k*60
    for i in range(len(x)):
        acc += a * (x[i] - acc); y[i] = acc
    return y

def pluck(freq, dur=1.6, bright=0.5):
    n = int(dur * SR); p = max(2, int(SR / freq))
    buf = rng.uniform(-1, 1, p)
    for _ in range(int((1 - bright) * 4)): buf = 0.5 * (buf + np.roll(buf, 1))
    out = np.empty(n)
    for k in range(0, n, p):
        m = min(p, n - k); out[k:k+m] = buf[:m]; buf = 0.996 * 0.5 * (buf + np.roll(buf, -1))
    return out * np.exp(-np.linspace(0, 3, n))

def kick(gain=1.0):
    n = int(0.5 * SR); t = np.arange(n) / SR
    f = 45 + 110 * np.exp(-t * 28)
    return np.tanh(1.6 * np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 6)) * gain

def snare():
    n = int(0.35 * SR); t = np.arange(n) / SR
    noise = rng.uniform(-1, 1, n); noise = noise - np.concatenate([[0], noise[:-1]]) * 0.6
    body = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
    return (noise * np.exp(-t * 14) * 0.6 + body * 0.5)

def hat():
    n = int(0.06 * SR); t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n); x = x - np.concatenate([[0], x[:-1]])
    return x * np.exp(-t * 70) * 0.18

def tom(f=90):
    n = int(0.7 * SR); t = np.arange(n) / SR
    return np.sin(2 * np.pi * np.cumsum(f + 60 * np.exp(-t * 18)) / SR) * np.exp(-t * 5)

def boom(dur=3.5):
    # trailer "hit": sub drop + noise burst + metallic ring
    n = int(dur * SR); t = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(30 + 70 * np.exp(-t * 6)) / SR) * np.exp(-t * 1.2)
    nz = rng.uniform(-1, 1, n) * np.exp(-t * 9) * 0.5
    ring = sum(np.sin(2 * np.pi * f * t) * np.exp(-t * d) for f, d in [(110, 1.5), (164.8, 1.8), (220, 2.2), (329.6, 2.6)]) * 0.18
    return np.tanh(1.4 * (sub + nz + ring))

def riser(dur):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n) * (t / dur) ** 2.2
    tone = np.sin(2 * np.pi * np.cumsum(200 + 900 * (t / dur) ** 2) / SR) * (t / dur) ** 3 * 0.25
    return x * 0.3 + tone

def drone(f, dur, fade=2.0):
    n = int(dur * SR); t = np.arange(n) / SR
    s = sum(np.sin(2 * np.pi * f * h * t + h) / h ** 1.3 for h in range(1, 8))
    lfo = 0.75 + 0.25 * np.sin(2 * np.pi * 0.13 * t)
    env = np.minimum(1, t / fade) * np.minimum(1, (dur - t) / fade)
    return s * lfo * env * 0.16

def bass(f, dur):
    n = int(dur * SR); t = np.arange(n) / SR
    return np.tanh(2.5 * np.sin(2 * np.pi * f * t)) * np.exp(-t * 3) * 0.4

def engine(rpm, thr, fps=24, cyl=6, pitch=1.0, gain=1.0):
    """rpm, thr: per-frame arrays. Returns mono signal of len(rpm)/fps seconds."""
    n = int(len(rpm) / fps * SR)
    tt = np.arange(n) / SR
    fr = np.interp(tt, np.arange(len(rpm)) / fps, np.asarray(rpm, float))
    th = np.interp(tt, np.arange(len(thr)) / fps, np.asarray(thr, float))
    f0 = np.maximum(500, fr) / 60 * cyl / 2 * pitch  # firing frequency
    ph = 2 * np.pi * np.cumsum(f0) / SR
    # firing pulses: sharp periodic waveform + rumble harmonics + combustion noise
    pulses = np.maximum(0, np.sin(ph)) ** 6
    harm = 0.6 * np.sin(ph / 2) + 0.4 * np.sin(ph / 3 * 2) + 0.25 * np.sin(ph * 1.5)
    noise = rng.uniform(-1, 1, n) * pulses
    x = pulses * 1.2 + harm * 0.5 + noise * (0.3 + 0.5 * th)
    x = lowpass(x, 0.12)
    x = np.tanh(2.0 * x)
    amp = (0.35 + 0.65 * th) * gain
    return x * amp

def splash(dur=1.6, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    x = rng.uniform(-1, 1, n)
    x = lowpass(x, 0.25)
    env = np.minimum(1, t / 0.04) * np.exp(-t * 2.5)
    bub = np.sin(2 * np.pi * np.cumsum(300 + 400 * rng.uniform(0, 1, n) * np.exp(-t * 3)) / SR) * 0.1 * np.exp(-t * 4)
    return (x * 1.8 * env + bub) * gain
