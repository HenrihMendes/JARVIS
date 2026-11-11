# ESCRIBA — trilha e efeitos sintetizados do teste (sem amostras de terceiros)
# Saída: music.wav e sfx.wav (48 kHz, estéreo). A mixagem com a voz é feita no ffmpeg (montar.sh).
import numpy as np, soundfile as sf
from scipy.signal import butter, sosfilt

SR = 48000; DUR = 35.4; N = int(SR * DUR); rng = np.random.default_rng(7)
t_all = np.arange(N) / SR
def lp(x, f, o=2): return sosfilt(butter(o, f, 'low', fs=SR, output='sos'), x)
def hp(x, f, o=2): return sosfilt(butter(o, f, 'high', fs=SR, output='sos'), x)
def bp(x, f0, f1, o=2): return sosfilt(butter(o, [f0, f1], 'band', fs=SR, output='sos'), x)
def env_adsr(n, a, d, s, r, sl=0.7):
    e = np.ones(n) * sl; A, D, R = int(a * SR), int(d * SR), int(r * SR)
    e[:A] = np.linspace(0, 1, max(A, 1)); e[A:A + D] = np.linspace(1, sl, max(len(e[A:A + D]), 1));
    if R > 0: e[-R:] *= np.linspace(1, 0, R)
    return e
def add(buf, x, t0, gain=1.0, pan=0.0):
    i = int(t0 * SR); j = min(N, i + len(x));
    if i >= N or j <= 0: return
    x = x[:j - i] * gain; l = np.cos((pan + 1) * np.pi / 4); r = np.sin((pan + 1) * np.pi / 4)
    buf[i:j, 0] += x * l * 1.41; buf[i:j, 1] += x * r * 1.41
def reverb(x, secs=3.0, mix=0.3, seed=1):
    g = np.random.default_rng(seed); L = int(secs * SR); ir = g.standard_normal(L) * np.exp(-np.linspace(0, 7, L)); ir = lp(ir, 5000); ir /= np.sqrt((ir ** 2).sum())
    out = np.zeros_like(x)
    for c in range(x.shape[1]):
        y = np.fft.irfft(np.fft.rfft(x[:, c], N + L) * np.fft.rfft(np.random.default_rng(seed + c).permutation(ir), N + L))[:N]
        out[:, c] = x[:, c] * (1 - mix) + y * mix
    return out
NOTE = lambda n: 440 * 2 ** ((n - 69) / 12)  # MIDI → Hz
D2, D3, D4 = 38, 50, 62
# Ré Hijaz: Ré Mi♭ Fá♯ Sol Lá Si♭ Dó
HIJAZ = [0, 1, 4, 5, 7, 8, 10, 12]
SIL0, SIL1 = 27.34, 28.79   # silêncio dramático
ACENDE, IMPACTO = 28.79, 31.95
BATIDAS = [17.95, 18.6, 19.25, 19.9, 20.55, 21.2]
SELOS = [1.6, 8.6, 13.1, 18.0, 22.3]

music = np.zeros((N, 2)); sfx = np.zeros((N, 2))

# ---------- MÚSICA ----------
# drone grave em Ré
def drone(t0, t1, root, gain, fade=1.5):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; f = NOTE(root)
    x = sum((1 / k) * np.sin(2 * np.pi * f * k * tt + k) for k in range(1, 7)) + 0.6 * np.sin(2 * np.pi * NOTE(root + 7) * tt)
    x = lp(x, 900) * (1 + 0.15 * np.sin(2 * np.pi * 0.2 * tt)); e = np.minimum(1, np.minimum(tt / fade, (t1 - t0 - tt) / 0.08)); add(music, x * e, t0, gain)
drone(0.0, SIL0, D2, 0.10); drone(SIL1, DUR, D2, 0.12, 0.6)
# pad de cordas (3 serras desafinadas)
def pad(t0, t1, notes, gain, cut=1400, a=1.0, r=0.6, trem=0.0):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for m in notes:
        for d in (-0.004, 0, 0.0035):
            ph = 2 * np.pi * NOTE(m) * (1 + d) * tt; x += (2 * ((ph / (2 * np.pi)) % 1) - 1)
    x = lp(x / (3 * len(notes)), cut, 2) * env_adsr(n, a, 0.5, 0.85, r) * (1 + trem * np.sin(2 * np.pi * 11 * tt)); add(music, x, t0, gain, -0.2); add(music, x, t0 + 0.012, gain, 0.2)
pad(0.2, 8.1, [D3, D3 + 7, D3 + 12], 0.16, 1100, 2.5)
pad(8.05, 12.7, [D3, D3 + 4, D3 + 7, D3 + 13], 0.18, 1300, 0.3)          # Hijaz: Fá♯ e Mi♭ (tensão)
pad(12.65, 17.65, [D3 - 2, D3 + 1, D3 + 5, D3 + 10], 0.2, 1500, a=0.3, trem=0.25)  # trêmulo, sobe
pad(17.6, 21.9, [D3, D3 + 7, D3 + 13], 0.14, 1000, 0.4)
pad(21.85, SIL0, [D3 - 12, D3, D3 + 3, D3 + 7], 0.18, 900, 1.5, r=0.06)
pad(ACENDE, 32.0, [D3, D3 + 4, D3 + 7, D3 + 12, D3 + 16], 0.24, 2400, 0.05, 1.0)  # revelação: Ré maior
pad(IMPACTO, DUR, [D3 - 12, D3, D3 + 7, D3 + 12], 0.22, 1600, 0.02, 3.0)
# coro "aah" (serra filtrada em formantes) na revelação
def coro(t0, t1, notes, gain):
    n = int((t1 - t0) * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for m in notes:
        vib = 1 + 0.004 * np.sin(2 * np.pi * 5.2 * tt + m); ph = np.cumsum(2 * np.pi * NOTE(m) * vib / SR); x += 2 * ((ph / (2 * np.pi)) % 1) - 1
    y = bp(x, 600, 850) * 1.0 + bp(x, 1050, 1300) * 0.6 + bp(x, 2400, 2800) * 0.2
    y *= env_adsr(n, 0.35, 0.4, 0.8, 1.0); add(music, y / len(notes), t0, gain, -0.3); add(music, y / len(notes), t0 + 0.02, gain, 0.3)
coro(ACENDE, 31.8, [D4, D4 + 4, D4 + 7], 0.35)
coro(IMPACTO + 0.05, DUR, [D3 + 12, D3 + 19, D4 + 12], 0.22)
# trompas graves (serra com filtro que abre)
def trompa(t0, dur, notes, gain):
    n = int(dur * SR); tt = np.arange(n) / SR; x = np.zeros(n)
    for m in notes: ph = 2 * np.pi * NOTE(m) * tt; x += 2 * ((ph / (2 * np.pi)) % 1) - 1
    cut = 300 + 1500 * np.minimum(1, tt / (dur * 0.4)); y = np.zeros(n); blk = 2400
    for i in range(0, n, blk): y[i:i + blk] = lp(x[i:i + blk], float(cut[i]))
    add(music, y * env_adsr(n, 0.25, 0.3, 0.8, dur * 0.4) / len(notes), t0, gain)
trompa(0.25, 3.2, [D2 + 12, D2 + 19], 0.3); trompa(8.05, 2.0, [D2 + 12, D2 + 19, D2 + 24], 0.26); trompa(12.65, 1.6, [D2 + 13, D2 + 20], 0.22)
# oud (Karplus-Strong) — motivo em Ré Hijaz
def oud(f, dur=1.4, gain=0.3):
    n = int(dur * SR); p = int(SR / f); buf = rng.uniform(-1, 1, p); out = np.zeros(n)
    for i in range(n): out[i] = buf[i % p]; buf[i % p] = 0.996 * 0.5 * (buf[i % p] + buf[(i + 1) % p])
    return hp(out, 80) * gain
motivo = [(8.35, 0), (8.65, 1), (8.95, 4), (9.25, 5), (9.55, 7), (10.15, 5), (10.45, 4), (10.75, 1), (11.3, 0)]
for t0, g in motivo: add(music, oud(NOTE(D4 + HIJAZ[HIJAZ.index(g)] if g in HIJAZ else D4 + g)), t0, 0.5, 0.25)
for t0, g in [(22.4, 0), (23.6, 1), (24.8, 4), (26.0, 1)]: add(music, oud(NOTE(D3 + 12 + g), 2.0), t0, 0.45, -0.2)
for k, g in enumerate([0, 7, 12]): add(music, oud(NOTE(D3 + g), 3.0), IMPACTO + 0.05 + k * 0.06, 0.6, (k - 1) * 0.4)
# tambores: daf + tom grave
def daf(gain=1.0, low=True):
    n = int(0.45 * SR); tt = np.arange(n) / SR; f = 95 * np.exp(-tt * 6) + 48
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 9) * (1.0 if low else 0.4)
    x += bp(rng.standard_normal(n), 1800, 6000) * np.exp(-tt * 40) * 0.35
    return x * gain
beat = 60 / 96
def tambores(t0, t1, padrao, gain, cresc=(1, 1)):
    t = t0; k = 0
    while t < t1:
        for off, g, low in padrao:
            tt = t + off * beat
            if tt < t1: a = cresc[0] + (cresc[1] - cresc[0]) * (tt - t0) / (t1 - t0); add(music, daf(g * a, low), tt, gain, rng.uniform(-0.3, 0.3))
        t += 4 * beat; k += 1
marcha = [(0, 1, True), (1, 0.55, False), (2, 0.85, True), (3, 0.5, False), (3.5, 0.4, False)]
tambores(0.3, 8.05, marcha, 0.5, (0.35, 1.0))
tambores(8.05, 12.65, marcha + [(2.5, 0.5, False)], 0.55)
tambores(12.65, 17.6, [(i * 0.5, 0.9 if i % 2 == 0 else 0.5, i % 2 == 0) for i in range(8)], 0.55, (0.8, 1.2))
for k in range(4): add(music, daf(0.7, True), 21.9 + k * 1.3, 0.35 * (1 - k * 0.2))  # batimento
# impactos graves (boom)
def boom(gain=1.0, dur=2.6):
    n = int(dur * SR); tt = np.arange(n) / SR; f = 60 * np.exp(-tt * 2.2) + 30
    x = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-tt * 1.8) + lp(rng.standard_normal(n), 200) * np.exp(-tt * 6) * 0.6
    return np.tanh(x * 1.5) * gain
for t0, g in [(0.2, 0.7), (8.05, 0.55), (12.65, 0.4), (21.85, 0.55), (ACENDE, 0.9), (IMPACTO, 1.0)]: add(music, boom(g), t0, 0.55)
# silêncio dramático: zera tudo da música entre SIL0 e SIL1
i0, i1 = int(SIL0 * SR), int(SIL1 * SR); fade = int(0.12 * SR)
music[i0:i0 + fade] *= np.linspace(1, 0, fade)[:, None]; music[i0 + fade:i1] = 0
music = reverb(music, 3.2, 0.32, 3)
music[i0 + fade:i1] = 0

# ---------- EFEITOS ----------
# vento/ambiente
w = lp(rng.standard_normal(N), 400) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t_all)); w2 = lp(rng.standard_normal(N), 380) * (0.6 + 0.4 * np.cos(2 * np.pi * 0.05 * t_all))
amb = np.stack([w, w2], 1) * 0.05; amb[int(SIL0 * SR):int(SIL1 * SR)] *= 0.5; sfx += amb
# passos do exército (S1–S2)
for k in range(int(12.6 / 0.31)):
    t0 = 0.4 + k * 0.31 + rng.uniform(-0.02, 0.02)
    if t0 > 12.6: break
    n = int(0.18 * SR); tt = np.arange(n) / SR; x = lp(rng.standard_normal(n), 260) * np.exp(-tt * 28)
    add(sfx, x, t0, 0.9 * min(1, t0 / 2.5) * (0.6 if t0 > 8.05 else 1), rng.uniform(-0.6, 0.6))
    if rng.random() < 0.5:
        m = int(0.08 * SR); y = bp(rng.standard_normal(m), 3500, 9000) * np.exp(-np.arange(m) / SR * 60); add(sfx, y, t0 + 0.03, 0.12, rng.uniform(-0.8, 0.8))
# fogo da tocha (S2)
n = int(4.6 * SR); fire = lp(rng.standard_normal(n), 900) * 0.12
for c in rng.uniform(0, 4.6, 120): i = int(c * SR); m = int(0.01 * SR); fire[i:i + m] += hp(rng.standard_normal(m), 2000) * rng.uniform(0.1, 0.4)
add(sfx, fire, 8.05, 0.6, 0.5)
# papiro e pena (S3)
n = int(0.6 * SR); ru = bp(rng.standard_normal(n), 1500, 7000) * np.exp(-np.arange(n) / SR * 5); add(sfx, ru, 12.68, 0.35)
n = int(1.8 * SR); tt = np.arange(n) / SR; esc = bp(rng.standard_normal(n), 2500, 8000) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 3.3 * tt))) * env_adsr(n, 0.1, 0.1, 0.9, 0.3); add(sfx, esc, 12.9, 0.16, 0.2)
add(sfx, bp(rng.standard_normal(int(0.5 * SR)), 2500, 8000) * np.exp(-np.arange(int(0.5 * SR)) / SR * 8), 15.55, 0.15)
# cinzel (S4): impacto de metal + pedra + "swoosh" do martelo
def cinzel():
    n = int(0.7 * SR); tt = np.arange(n) / SR
    x = sum(a * np.sin(2 * np.pi * f * tt) * np.exp(-tt * d) for f, a, d in [(2130, 0.5, 18), (3410, 0.35, 24), (5230, 0.25, 30), (7900, 0.12, 40)])
    x += bp(rng.standard_normal(n), 800, 4000) * np.exp(-tt * 35) * 0.6 + lp(rng.standard_normal(n), 300) * np.exp(-tt * 20) * 0.8
    return x
for b in BATIDAS:
    add(sfx, cinzel(), b, 0.5, 0.15)
    n = int(0.25 * SR); tt = np.arange(n) / SR; add(sfx, bp(rng.standard_normal(n), 400, 1600) * np.sin(np.pi * tt / 0.25) ** 2, b - 0.25, 0.08, -0.1)
# estrondo da estela (S5a) e brilho que acende (S5b)
n = int(4 * SR); tt = np.arange(n) / SR; add(sfx, lp(rng.standard_normal(n), 120) * np.minimum(1, tt) * np.exp(-tt * 0.5), 21.85, 0.4)
n = int(2.5 * SR); tt = np.arange(n) / SR; sh = hp(rng.standard_normal(n), 6000) * np.minimum(1, tt / 0.3) * np.exp(-tt * 1.2)
sh += sum(np.sin(2 * np.pi * f * tt) * np.exp(-tt * 2.5) * 0.15 for f in (1175, 1480, 1760, 2349)); add(sfx, sh, ACENDE, 0.35)
# carimbo do título: baque de madeira na argila + poeira
n = int(1.2 * SR); tt = np.arange(n) / SR; th = np.sin(2 * np.pi * (70 * np.exp(-tt * 8) + 45) * tt) * np.exp(-tt * 10) + bp(rng.standard_normal(n), 300, 2500) * np.exp(-tt * 25) * 0.7
add(sfx, th, IMPACTO, 1.0); add(sfx, hp(rng.standard_normal(int(1.5 * SR)), 3000) * np.exp(-np.arange(int(1.5 * SR)) / SR * 3) * 0.2, IMPACTO + 0.02, 0.6)
# pena raspando antes do carimbo (assinatura sonora) — 0,45 s
n = int(0.45 * SR); tt = np.arange(n) / SR; add(sfx, bp(rng.standard_normal(n), 2500, 9000) * (0.5 + 0.5 * np.sin(2 * np.pi * 9 * tt)) * np.sin(np.pi * tt / 0.45), IMPACTO - 0.5, 0.18)
# selos entrando (carimbo leve)
for s in SELOS:
    n = int(0.3 * SR); tt = np.arange(n) / SR; add(sfx, (np.sin(2 * np.pi * (110 * np.exp(-tt * 20) + 70) * tt) * np.exp(-tt * 22) + bp(rng.standard_normal(n), 500, 3000) * np.exp(-tt * 50) * 0.5), s, 0.35, -0.6)
sfx[int(SIL0 * SR) + 2000:int(SIL1 * SR)] *= 0.35   # o silêncio também vale para os efeitos (fica só o ar)

def norm(x, peak=0.89): m = np.abs(x).max(); return x / m * peak if m > 0 else x
sf.write('music.wav', norm(music), SR); sf.write('sfx.wav', norm(sfx, 0.7), SR); print('ok', N / SR)
