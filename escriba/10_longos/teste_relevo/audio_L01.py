# ESCRIBA — L01 completo: trilha e efeitos dos caps. 1 a 8 (sintetizados) + a trilha pronta da abertura (0 a 57,2 s).
# Reaproveita as funções de audio_cap0.py. Tempos: planos/L01_linha.json (gerado por planos/L01_gerar.py).
import json, re, numpy as np, soundfile as sf
L = json.load(open('planos/L01_linha.json')); O = {int(k): v for k, v in L['O'].items()}; Vc = {int(k): v for k, v in L['V'].items()}; CAPS = {int(k): v for k, v in L['capitulos'].items()}
src = open('audio_cap0.py', encoding='utf-8').read()
exec(src[:src.index('# ---------- MÚSICA ----------')].replace('DUR = 57.2', f"DUR = {L['total']}"))
for nome in ('esfarelar', 'carimbo', 'norm'):
    i = src.index(f'def {nome}'); j = i + 1
    while True:
        j = src.index('\n', j) + 1
        if j >= len(src) or (src[j] not in ' \t\n' and not src.startswith('def ' + nome, j)): break
    exec(src[i:j])

# ---------- MÚSICA dos caps. 1 a 8: cama baixa (a voz manda), cor harmônica por capítulo ----------
ACORDE = {1: [0, 3, 7], 2: [0, 3, 7], 3: [0, 1, 7], 4: [0, 3, 8], 5: [0, 1, 5], 6: [0, 4, 7], 7: [0, 7, 12], 8: [0, 4, 7, 12]}
for k in range(1, 9):
    a, b = O[k], O[k] + Vc[k]
    drone(a, b + 0.8, D2, 0.075, 2.0)
    pad(a + 0.2, b + 0.6, [D3 + n for n in ACORDE[k]], 0.075, 1300, 2.5, 1.5)
    add(music, boom(0.35), a, 0.5)
c3 = CAPS[3]; tambores(c3[0], c3[2], [(0, 0.8, True), (1, 0.4, False), (2, 0.6, True), (3, 0.35, False)], 0.4, (0.5, 1.1))   # o carro de Jeú
for t in L['testemunhas']:                                                                                                        # entrada de cada testemunha
    for k2, g in enumerate([0, 7, 12]): add(music, oud(NOTE(D3 + g), 2.2), t + k2 * 0.08, 0.45, (k2 - 1) * 0.4)
coro(CAPS[7][1], CAPS[7][1] + 8, [D3 + 12, D3 + 19], 0.12)                                                                        # veredito
fim = L['carimbo']                                                                                                                # carimbo final + tela final
add(music, boom(1.0), fim + 0.55, 0.55); pad(fim + 0.55, L['total'], [D3 - 12, D3, D3 + 7, D3 + 12], 0.2, 1600, 0.02, 6.0)
coro(fim + 0.6, fim + 12, [D3 + 12, D3 + 19, D4 + 12], 0.18)
for k2, g in enumerate([0, 7, 12]): add(music, oud(NOTE(D3 + g), 3.0), fim + 0.6 + k2 * 0.06, 0.6, (k2 - 1) * 0.4)
music = reverb(music, 3.2, 0.3, 3); i0 = int(57.2 * SR)
# abertura pronta
for nome, buf in (('music_cap0.wav', music), ('sfx_cap0.wav', sfx)):
    x, sr = sf.read(nome); n = min(len(x), len(buf)); buf[:n] += x[:n] * (0.89 if nome.startswith('music') else 0.7)


nf = int(6 * SR); music[-nf:] *= np.linspace(1, 0, nf)[:, None]

# ---------- EFEITOS ----------
n = len(t_all) - i0; w = lp(rng.standard_normal(n), 420) * (0.6 + 0.4 * np.sin(2 * np.pi * 0.07 * t_all[i0:])); sfx[i0:] += np.stack([w, w[::-1]], 1) * 0.04
for t in L['testemunhas']: add(sfx, carimbo(0.6), t + 0.15, 1.0, -0.5)
add(sfx, carimbo(1.0), fim + 0.55, 1.0, 0.0)
p4 = json.load(open('planos/L01_cap4.json'))['planos']
fogo = next(p for p in p4 if p.get('cena') == 'SFogo'); rq = next(p for p in p4 if p.get('tipo') == 'reusa')
a = O[4] + fogo['ini']; nn = int((fogo['fim'] - fogo['ini']) * SR)
crep = bp(rng.standard_normal(nn), 300, 3000) * (rng.random(nn) < 0.004) * 6 + lp(rng.standard_normal(nn), 600) * 0.3
add(sfx, crep * env(nn, 0.4, 0.1, 0.9, 0.6), a, 0.35)                                                                             # fogo
add(sfx, bp(rng.standard_normal(int(1.2 * SR)), 2000, 7000) * np.exp(-np.arange(int(1.2 * SR)) / SR * 3), a + (fogo['fim'] - fogo['ini']) - 1.0, 0.25)  # água fria (chiado)
add(sfx, esfarelar(), O[4] + rq['ini'] + 0.4, 0.8, 0.0)                                                                           # a pedra se parte
sf.write('music_L01.wav', norm(music), SR); sf.write('sfx_L01.wav', norm(sfx, 0.7), SR); print('ok', L['total'])
