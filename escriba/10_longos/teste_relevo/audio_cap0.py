# ESCRIBA — L01 cap. 0: trilha e efeitos sintetizados (sem amostras de terceiros)
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000; DUR = 57.2; N = int(SR * DUR); rng = np.random.default_rng(11)
t_all = np.arange(N) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, f0, f1, o=2): return sosfilt(butter(o, [f0, f1], 'band', fs=SR, output='sos'), x)
def env(n, a, d, s, r, sl=0.7):
    e = np.ones(n) * sl; A, D, R = int(a * SR), int(d * SR), int(r * SR); e[:A] = np.linspace(0, 1, max(A, 1)); e[A:A + D] = np.linspace(1, sl, max(len(e[A:A + D]), 1))
    if R > 0: e[-R:] *= np.linspace(1, 0, R)
    return e
def add(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(x))
    if i >= N or j <= 0: return
    x = x[:j - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4); buf[i:j, 0] += x * l * 1.41; buf[i:j, 1] += x * r * 1.41
def reverb(x, secs=3.0, mix=0.3, seed=1):
    g = np.random.default_rng(seed); L = int(secs * SR); ir = g.standard_normal(L) * np.exp(-np.linspace(0, 7, L)); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum()); out = np.zeros_like(x)
    for c in range(x.shape[1]): out[:, c] = x[:, c] * (1 - mix) + np.fft.irfft(np.fft.rfft(x[:, c], N + L) * np.fft.rfft(np.random.default_rng(seed + c).permutation(ir), N + L))[:N] * mix
    return out
NOTE = lambda n: 440 * 2 ** ((n - 69) / 12); D2, D3, D4 = 38, 50, 62
music = np.zeros((N, 2)); sfx = np.zeros((N, 2))

def drone(t0, t1, root, gain, fade=1.5):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; f = NOTE(root)
    x = sum((1 / k) * np.sin(2 * np.pi * f * k * tt + k) for k in range(1, 7)) + 0.6 * np.sin(2 * np.pi * NOTE(root + 7) * tt)
    x = lp(x, 900) * (1 + 0.15 * np.sin(2 * np.pi * 0.2 * tt)); e = np.minimum(1, np.minimum(tt / fade, (t1 - t0 - tt) / 0.12)); add(music, x * e, t0, gain)
def pad(t0, t1, notes, gain, cut=1400, a=1.0, r=0.6, trem=0.0):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for m in notes:
        for d in (-0.004, 0, 0.0035): ph = 2 * np.pi * NOTE(m) * (1 + d) * tt; x += (2 * ((ph / (2 * np.pi)) % 1) - 1)
    x = lp(x / (3 * len(notes)), cut, 2) * env(n, a, 0.5, 0.85, r) * (1 + trem * np.sin(2 * np.pi * 11 * tt)); add(music, x, t0, gain, -0.2); add(music, x, t0 + 0.012, gain, 0.2)
def coro(t0, t1, notes, gain):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for m in notes: vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * tt + m); ph = np.cumsum(2 * np.pi * NOTE(m) * vib / SR); x += 2 * ((ph / (2 * np.pi)) % 1) - 1
    y = (bp(x, 600, 850) + bp(x, 1050, 1300) * 0.6 + bp(x, 2400, 2800) * 0.2) * env(n, 0.5, 0.4, 0.8, 1.2); add(music, y / len(notes), t0, gain, -0.3); add(music, y / len(notes), t0 + 0.02, gain, 0.3)
def trompa(t0, dur, notes, gain):
    n = int(dur * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for m in notes: ph = 2 * np.pi * NOTE(m) * tt; x += 2 * ((ph / (2 * np.pi)) % 1) - 1
    cut = 300 + 1500 * np.minimum(1, tt / (dur * 0.4)); y = np.zeros(n)
    for i in range(0, n, 2400): y[i:i + 2400] = lp(x[i:i + 2400], float(cut[i]))
    add(music, y * env(n, 0.25, 0.3, 0.8, dur * 0.4) / len(notes), t0, gain)
def oud(f, dur=1.4, gain=0.3):
    n = int(dur * SR); p = int(SR / f); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return hp(out, 80) * gain
def daf(gain=1.0, low=True):
    n = int(0.45 * SR); tt = np.arange(n) / SR; f = 95 * np.exp(-tt * 6) + 48
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * (1.0 if low else 0.4) + bp(rng.standard_normal(n), 1800, 6000) * np.exp(-tt * 40) * 0.35
    return x * gain
def boom(gain=1.0, dur=2.6):
    n = int(dur * SR); tt = np.arange(n) / SR; f = 60 * np.exp(-tt * 2.2) + 30
    return np.tanh((np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.8) + lp(rng.standard_normal(n), 200) * np.exp(-tt * 6) * 0.6) * 1.5) * gain
beat = 60 / 92
def tambores(t0, t1, padrao, gain, cresc=(1, 1)):
    t = t0
    while t < t1:
        for off, g, low in padrao:
            tt = t + off * beat
            if tt < t1: a = cresc[0] + (cresc[1] - cresc[0]) * (tt - t0) / max(t1 - t0, 1e-6); add(music, daf(g * a, low), tt, gain, rng.uniform(-0.3, 0.3))
        t += 4 * beat

# ---------- MÚSICA ----------
drone(0.0, 10.9, D2, 0.11, 0.3)                       # vale: drone + trompas + tambor lento
trompa(0.05, 3.5, [D2 + 12, D2 + 19], 0.3)
tambores(0.0, 10.9, [(0, 1, True), (2, 0.7, True), (3, 0.4, False)], 0.5, (0.6, 1.0))
pad(0.3, 10.9, [D3, D3 + 7, D3 + 12], 0.15, 1100, 1.5)
for t0, g in [(5.2, 0), (5.5, 1), (5.8, 4), (6.1, 5), (6.4, 7), (7.9, 5), (8.2, 4), (8.5, 1), (9.0, 0)]: add(music, oud(NOTE(D4 + g)), t0, 0.5, 0.25)
# "Só tem um problema." — tudo cai (11.0) e entra um pulso grave tenso
drone(11.6, 29.6, D2 - 1, 0.1, 1.0)
pad(12.7, 23.0, [D3 - 1, D3 + 3, D3 + 6], 0.15, 900, 2.0)                  # dissonante
for k in range(int((29.6 - 12.7) / (beat))): add(music, daf(0.45, True), 12.7 + k * beat, 0.35)  # pulso
pad(23.0, 29.6, [D3 - 12, D3, D3 + 3, D3 + 7], 0.17, 800, 1.0, r=0.3)
# "Até que a terra começou a devolver testemunhas." — boom e virada; a música cresce até o fim
pad(29.6, 46.8, [D3, D3 + 4, D3 + 7, D3 + 13], 0.18, 1500, 0.4, trem=0.2)
drone(29.6, 50.6, D2, 0.12, 0.3)
tambores(32.9, 46.8, [(i * 0.5, 0.95 if i % 2 == 0 else 0.5, i % 2 == 0) for i in range(8)], 0.55, (0.7, 1.25))
coro(42.0, 50.6, [D4, D4 + 4, D4 + 7], 0.3)
trompa(32.9, 2.2, [D2 + 12, D2 + 19], 0.25); trompa(42.0, 3.0, [D2 + 12, D2 + 19, D2 + 24], 0.28)
pad(46.8, 50.6, [D3, D3 + 7, D3 + 12, D3 + 16], 0.2, 1800, 0.2)
# "E, no fim... você decide." — quase silêncio
drone(50.6, 53.4, D2, 0.08, 0.2)
# título
pad(53.75, DUR, [D3 - 12, D3, D3 + 7, D3 + 12], 0.24, 1600, 0.02, 3.0); coro(53.8, DUR, [D3 + 12, D3 + 19, D4 + 12], 0.22)
for k, g in enumerate([0, 7, 12]): add(music, oud(NOTE(D3 + g), 3.0), 53.8 + k * 0.06, 0.6, (k - 1) * 0.4)
for t0, g in [(0.0, 0.8), (11.0, 0.45), (29.6, 0.85), (32.9, 0.5), (46.8, 0.5), (53.75, 1.0)]: add(music, boom(g), t0, 0.55)
# corte seco antes de "Só tem um problema" e antes de "você decide"
for a, b in [(10.85, 11.55), (50.45, 50.9)]:
    i0, i1 = int(a * SR), int(b * SR); f = int(0.08 * SR); music[i0:i0 + f] *= np.linspace(1, 0.05, f)[:, None]; music[i0 + f:i1] *= 0.05
music = reverb(music, 3.2, 0.3, 3)

# ---------- EFEITOS ----------
w = lp(rng.standard_normal(N), 420) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t_all)); w2 = lp(rng.standard_normal(N), 400) * (0.6 + 0.4 * np.cos(2 * np.pi * 0.05 * t_all))
sfx += np.stack([w, w2], 1) * 0.05
# vale: murmúrio distante dos exércitos + metal
n = int(5.0 * SR); mur = bp(rng.standard_normal(n), 200, 900) * (0.5 + 0.5 * np.abs(np.sin(2 * np.pi * 0.7 * np.arange(n) / SR))); add(sfx, mur * env(n, 0.5, 0.2, 0.9, 1.0), 0, 0.12)
for k in range(10): m = int(0.06 * SR); add(sfx, bp(rng.standard_normal(m), 3500, 9000) * np.exp(-np.arange(m) / SR * 60), rng.uniform(0.3, 4.6), 0.06, rng.uniform(-0.8, 0.8))
add(sfx, (lambda n: np.sin(2 * np.pi * 420 * np.arange(n) / SR) * np.exp(-np.arange(n) / SR * 3) * 0.3 + bp(rng.standard_normal(n), 2000, 5000) * np.exp(-np.arange(n) / SR * 8) * 0.2)(int(1.2 * SR)), 2.0, 0.25, -0.3)  # funda girando (assobio)
# desfazer em pó (3x)
def esfarelar():
    n = int(1.0 * SR); tt = np.arange(n) / SR; x = bp(rng.standard_normal(n), 300, 5000) * (np.exp(-tt * 6) * (0.5 + 0.5 * (rng.random(n) > 0.97)))
    return x + lp(rng.standard_normal(n), 200) * np.exp(-tt * 12) * 0.6
for t0 in (18.55, 19.75, 20.95): add(sfx, esfarelar(), t0, 0.7, rng.uniform(-0.3, 0.3))
# pena escrevendo (linha do tempo e "lenda?")
n = int(3.4 * SR); tt = np.arange(n) / SR; add(sfx, bp(rng.standard_normal(n), 2500, 8000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 3.1 * tt))) * env(n, 0.1, 0.1, 0.9, 0.3), 13.0, 0.13, 0.2)
n = int(1.4 * SR); tt = np.arange(n) / SR; add(sfx, bp(rng.standard_normal(n), 2500, 8000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 3.6 * tt))) * env(n, 0.05, 0.1, 0.9, 0.2), 24.6, 0.14, -0.2)
# descida pelas camadas: terra deslizando
n = int(3.3 * SR); tt = np.arange(n) / SR; add(sfx, (lp(rng.standard_normal(n), 300) + bp(rng.standard_normal(n), 800, 3000) * 0.25) * env(n, 0.4, 0.2, 0.9, 0.6), 29.6, 0.35)
# carimbos das testemunhas e selos
def carimbo(g=1.0):
    n = int(0.35 * SR); tt = np.arange(n) / SR; return (np.sin(2 * np.pi * (110 * np.exp(-tt * 20) + 70) * tt) * np.exp(-tt * 22) + bp(rng.standard_normal(n), 500, 3000) * np.exp(-tt * 50) * 0.5) * g
for t0 in (1.3, 5.3, 23.4): add(sfx, carimbo(0.35), t0, 1.0, -0.6)
for t0 in (33.05, 35.45, 38.05, 42.15): add(sfx, carimbo(0.6), t0, 1.0, -0.5)
# selo deslizando na Tabuleta
n = int(0.8 * SR); tt = np.arange(n) / SR; add(sfx, bp(rng.standard_normal(n), 400, 2500) * np.sin(np.pi * tt / 0.8) ** 2, 48.4, 0.25, 0.3)
# lamparina (crepitar leve nas cenas da mesa)
for a, b in [(11.0, 12.7), (18.2, 23.0), (46.8, 53.2)]:
    n = int((b - a) * SR); x = lp(rng.standard_normal(n), 700) * 0.04
    for c in rng.uniform(0, b - a, int((b - a) * 6)): i = int(c * SR); m = int(0.008 * SR); x[i:i + m] += hp(rng.standard_normal(m), 2500) * rng.uniform(0.05, 0.2)
    add(sfx, x, a, 0.7, 0.4)
# título: pena (0,45 s) → carimbo na argila → poeira
n = int(0.45 * SR); tt = np.arange(n) / SR; add(sfx, bp(rng.standard_normal(n), 2500, 9000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) * np.sin(np.pi * tt / 0.45), 53.75 - 0.5, 0.18)
n = int(1.2 * SR); tt = np.arange(n) / SR; add(sfx, np.sin(2 * np.pi * (70 * np.exp(-tt * 8) + 45) * tt) * np.exp(-tt * 10) + bp(rng.standard_normal(n), 300, 2500) * np.exp(-tt * 25) * 0.7, 53.75, 1.0)

def norm(x, peak=0.89): m = np.abs(x).max(); return x / m * peak if m > 0 else x
sf.write('music_cap0.wav', norm(music), SR); sf.write('sfx_cap0.wav', norm(sfx, 0.7), SR); print('ok', DUR)
