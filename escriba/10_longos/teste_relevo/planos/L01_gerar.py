# L01 "O caso Davi": gera os planos dos caps. 1 a 8 (um JSON por capítulo), os dados da camada gráfica e a linha do tempo do áudio.
# Os tempos vêm da narração real (planos/L01_tempos.json, feito por tempos.py). Planos são presos aos parágrafos: (parágrafo, fração).
import json, os
AQUI = os.path.dirname(os.path.abspath(__file__)); T = json.load(open(f'{AQUI}/L01_tempos.json', encoding='utf-8'))
ENTRA, SAI, CAP0 = 0.3, 0.7, 57.2           # respiro antes/depois da fala de cada capítulo; duração da abertura
CARIMBO, TELA_FINAL = 4.0, 20.0
TESTE = 'teste.html'

def cam(nome, d):
    P = {'in': [(1.0, .5, .5), (1.1, .5, .5)], 'out': [(1.12, .5, .5), (1.0, .5, .5)], 'e': [(1.15, .45, .5), (1.15, .55, .5)], 'd': [(1.15, .55, .5), (1.15, .45, .5)],
         'sobe': [(1.15, .5, .56), (1.15, .5, .44)], 'desce': [(1.15, .5, .44), (1.15, .5, .56)]}[nome]
    return [{'t': 0, 'z': P[0][0], 'x': P[0][1], 'y': P[0][2]}, {'t': round(d, 2), 'z': P[1][0], 'x': P[1][1], 'y': P[1][2]}]

# (parágrafo, fração, cena, opções). tipo: q = quadro (padrão), a = anim, r = reusa
FOTO = lambda f: 'foto:' + f
S = {
 1: [(0, 0, 'C02', {'cam': 'e'}),
     (0, .5, 'FILA', {'keys': lambda d, A: [(0, 1.7, .80, .55), (A(1, 0) + .4, 1.7, .80, .55), (A(2, 0) - .2, 1.5, .33, .55), (A(2, 0) + .6, 1.8, .13, .55), (d, 1.85, .12, .55)]}),
     (3, 0, FOTO('vale_de_ela.jpg'), {'cam': 'in'}),
     (4, 0, 'reusa', {'clipe': 'out_v2/cap0/clipes/P01.mp4', 't0': 1.0}),
     (4, .34, 'C03', {'cam': 'sobe', 'u': .4}),
     (4, .67, 'C02', {'cam': 'in'}),
     (5, 0, 'C14', {'cam': 'in', 'u': .6})],
 2: [(0, 0, FOTO('obelisco_negro.jpg'), {'cam': 'sobe'}),
     (0, .5, FOTO('karnak_portal_bubastita.jpg'), {'cam': 'e'}),
     (1, 0, 'C02', {'cam': 'in'}),
     (1, .5, 'C08', {'cam': 'desce', 'u': .55}),
     (2, 0, 'C14', {'cam': 'in', 'u': .3}),
     (2, .45, 'C07', {'cam': 'in', 't': 6.0}),
     (3, 0, 'S5a', {'cam': 'sobe', 'pagina': TESTE, 'u': .3})],
 3: [(0, 0, 'S1', {'cam': 'e', 'pagina': TESTE, 'u': .3}),
     (1, 0, 'S1', {'cam': 'd', 'pagina': TESTE, 'u': .85}),
     (2, 0, 'C03', {'cam': 'desce', 'u': .6}),
     (3, 0, 'C14', {'cam': 'in', 'u': .8}),
     (4, 0, FOTO('tel_dan_portao.jpg'), {'cam': 'e'}),
     (5, 0, FOTO('estela_tel_dan.jpg'), {'keys': lambda d, A: [(0, 1.0, .5, .5), (d, 1.3, .5, .48)]}),
     (6, .45, 'S4', {'tipo': 'a', 'pagina': TESTE}),
     (6, .75, 'S2', {'cam': 'in', 'pagina': TESTE, 'u': .5}),
     (6, .9, 'S5b', {'tipo': 'a', 'pagina': TESTE, 'revela': (7, .65)}),
     (8, 0, FOTO('obelisco_negro.jpg'), {'cam': 'desce'}),
     (9, 0, 'C05', {'cam': 'e', 't': 5.0}),
     (10, 0, 'C14', {'cam': 'in', 'u': .4}),
     (10, .5, FOTO('estela_tel_dan.jpg'), {'cam': 'out'}),
     (11, 0, 'S5a', {'cam': 'in', 'pagina': TESTE, 'u': .7}),
     (12, 0, FOTO('estela_mesa_louvre.jpg'), {'cam': 'in'})],
 4: [(0, 0, 'S1', {'cam': 'd', 'pagina': TESTE, 'u': .6}),
     (0, .5, FOTO('estela_mesa_louvre.jpg'), {'cam': 'sobe'}),
     (1, 0, 'S3', {'cam': 'e', 'pagina': TESTE, 'u': .5}),
     (2, 0, 'SFogo', {'tipo': 'a', 'pagina': TESTE}),
     (2, .62, 'reusa', {'clipe': 'out_v2/cap0/clipes/P05.mp4', 't0': 2.35}),
     (3, 0, FOTO('estela_mesa_louvre.jpg'), {'cam': 'in'}),
     (4, 0, FOTO('estela_mesa_louvre.jpg'), {'keys': lambda d, A: [(0, 1.05, .5, .55), (d, 1.8, .5, .74)]}),
     (5, 0, 'C14', {'cam': 'in', 'u': .5}),
     (6, 0, FOTO('estela_mesa_louvre.jpg'), {'cam': 'd'}),
     (7, 0, 'C13', {'cam': 'in', 'u': .5, 't': 0.5}),
     (8, 0, FOTO('karnak_portal_bubastita.jpg'), {'cam': 'in'})],
 5: [(0, 0, FOTO('karnak_portal_bubastita.jpg'), {'cam': 'in'}),
     (0, .5, FOTO('lista_sisaque.jpg'), {'cam': 'sobe'}),
     (1, 0, FOTO('lista_sisaque.jpg'), {'keys': lambda d, A: [(0, 1.5, .4, .45), (d, 1.6, .6, .45)]}),
     (2, 0, 'C05', {'cam': 'd', 't': 5.0}),
     (3, 0, FOTO('lista_sisaque.jpg'), {'keys': lambda d, A: [(0, 1.8, .55, .6), (d, 2.0, .45, .6)]}),
     (4, 0, 'C13', {'tipo': 'a'}),
     (4, .35, 'C14', {'cam': 'in', 'u': .5}),
     (5, 0, 'C12b', {'cam': 'in', 'u': .35})],
 6: [(0, 0, FOTO('vale_de_ela.jpg'), {'cam': 'e'}),
     (0, .55, 'reusa', {'clipe': 'out_v2/cap0/clipes/P01.mp4', 't0': 0}),
     (1, 0, 'C14', {'cam': 'in', 'u': .9}),
     (2, 0, FOTO('khirbet_qeiyafa.jpg'), {'cam': 'in'}),
     (3, 0, 'C12b', {'cam': 'in', 'u': .2}),
     (3, .5, 'C05', {'cam': 'e', 't': 5.0}),
     (4, 0, 'S3', {'cam': 'd', 'pagina': TESTE, 'u': .6}),
     (5, 0, 'C02', {'cam': 'in'}),
     (5, .5, 'C08', {'cam': 'desce', 'u': .3}),
     (6, 0, 'C03', {'cam': 'sobe', 'u': .5})],
 7: [(0, 0, 'C13', {'cam': 'in', 'u': .5, 't': 0.5}),
     (1, .45, FOTO('estela_tel_dan.jpg'), {'cam': 'out'}),
     (2, 0, 'C09f', {'escala': 3, 'keys': lambda d, A: [(0, 2.0, 'f1'), (A(3, 0) - .4, 2.1, 'f1'), (A(3, 0) + .3, 2.0, 'f2'), (d, 2.2, 'f2')]}),
     (4, 0, 'C12b', {'cam': 'in', 'u': .35}),
     (5, 0, 'C07', {'cam': 'in', 't': 0.2})],
 8: [(0, 0, FOTO('vale_de_ela.jpg'), {'cam': 'in'}),
     (0, .5, 'FILA', {'keys': lambda d, A: [(0, 1.8, .14, .55), (d, 1.95, .12, .55)]}),
     (1, 0, FOTO('estela_tel_dan.jpg'), {'cam': 'in'}),
     (2, 0, 'C09f', {'escala': 3, 'cam': 'out'}),
     (3, 0, 'C14', {'cam': 'in', 'u': .5})],
}

CRED = {'tel_dan_portao.jpg': 'Foto: Adrianlw · Wikimedia Commons · domínio público', 'estela_tel_dan.jpg': 'Foto: בית השלום · Wikimedia Commons',
        'estela_mesa_louvre.jpg': 'Foto: Tangopaso · Wikimedia Commons · domínio público', 'karnak_portal_bubastita.jpg': 'Foto: Olaf Tausch · Wikimedia Commons · CC BY 3.0',
        'lista_sisaque.jpg': 'Foto: Jack1956 · Wikimedia Commons · domínio público', 'khirbet_qeiyafa.jpg': 'Foto: Davidbena · Wikimedia Commons · CC0',
        'vale_de_ela.jpg': 'Foto: Davidbena · Wikimedia Commons · CC0', 'obelisco_negro.jpg': 'Desenho: F. Delitzsch, Babel and Bible · domínio público'}

O = {0: 0.0}; V = {}
for k in range(1, 9): V[k] = round(ENTRA + T[str(k)][-1][1] + SAI, 3); O[k] = round(O[k - 1] + (CAP0 if k == 1 else V[k - 1]), 3)
TOTAL = round(O[8] + V[8] + CARIMBO + TELA_FINAL, 3)
cred_ev = []
for k, lista in S.items():
    par = T[str(k)]; A = lambda i, f: round(ENTRA + par[i][0] + f * (par[i][1] - par[i][0]), 3)
    ini = [0.0 if j == 0 else A(i, f) for j, (i, f, _, _) in enumerate(lista)]
    fim_cap = V[k] + (CARIMBO + TELA_FINAL if k == 8 else 0)
    planos = []
    for j, (i, f, cena, o) in enumerate(lista):
        a, b = ini[j], (ini[j + 1] if j + 1 < len(lista) else V[k]); d = round(b - a, 3)
        Ar = lambda ii, ff: round(A(ii, ff) - a, 3)
        p = {'id': f'C{k}P{j + 1:02d}', 'ini': a, 'fim': b}
        if cena == 'reusa': p.update(tipo='reusa', clipe=o['clipe'], t0=o.get('t0', 0))
        elif o.get('tipo') == 'a':
            p.update(tipo='anim', cena=cena)
            if 'revela' in o: p['t0'] = round(1.49 - (A(*o['revela']) - a), 3)   # S5b: "Casa de Davi" acende no ponto da fala
        else:
            p.update(tipo='quadro', cena=cena, luz='lamparina')
            for c in ('u', 't', 'escala'):
                if c in o: p[c] = o[c]
            if 'keys' in o:
                ks = o['keys'](d, Ar); p['cam'] = [{'t': round(x[0], 2), 'z': x[1], 'foco': int(x[2][1])} if isinstance(x[2], str) else {'t': round(x[0], 2), 'z': x[1], 'x': x[2], 'y': x[3]} for x in ks]
            else: p['cam'] = cam(o.get('cam', 'in'), d)
        if 'pagina' in o: p['pagina'] = o['pagina']
        if cena.startswith('foto:'): cred_ev.append([round(O[k] + a, 2), round(O[k] + b, 2), CRED[cena[5:]]])
        planos.append(p)
    if k == 8:   # carimbo final + tela final (20 s para os elementos de tela final do YouTube)
        planos.append({'id': 'C8P90', 'ini': V[8], 'fim': round(V[8] + CARIMBO, 3), 'tipo': 'reusa', 'clipe': 'out_v2/cap0/clipes/P11.mp4', 't0': 0})
        planos.append({'id': 'C8P91', 'ini': round(V[8] + CARIMBO, 3), 'fim': round(fim_cap, 3), 'tipo': 'quadro', 'cena': 'C04', 'u': 0.0, 'luz': 'lamparina', 'cam': cam('out', TELA_FINAL)})
    json.dump({'titulo': f'L01 · cap. {k}', 'pagina': 'cap0.html', 'qs': 'lp=1', 'saida': f'out_v2/cap{k}', 'dur': round(fim_cap, 3), 'planos': planos},
              open(f'{AQUI}/L01_cap{k}.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)

# ---------- camada gráfica (tempos absolutos) ----------
P = lambda k, i, f=0.0: round(O[k] + ENTRA + T[str(k)][i][0] + f * (T[str(k)][i][1] - T[str(k)][i][0]), 2)
Pf = lambda k, i: round(O[k] + ENTRA + T[str(k)][i][1], 2)
selos = [[1.3, 4.8, 'RECRIAÇÃO', 'Cenas e personagens são reconstruções artísticas'], [5.3, 10.7, 'TEXTO', '1 Samuel 17 · 2 Samuel 5'],
         [23.4, 29.4, 'LEITURA', 'Corrente "minimalista", anos 1990 (Davies, Thompson, Lemche)']]
def selo(k, i, tipo, txt, dur=5.5): a = P(k, i) + 0.4; selos.append([a, round(a + dur, 2), tipo, txt])
selo(1, 1, 'TEXTO', '1 Samuel 16:10-11'); selo(1, 4, 'TEXTO', '1 Samuel 17 · 18:8-9 · 2 Samuel 2:4 · 5:3-7')
selo(3, 0, 'TEXTO', '2 Reis 9:17-20'); selo(3, 2, 'TEXTO', '2 Reis 9:24, 27'); selo(3, 6, 'LEITURA', 'Autor provável: Hazael, rei de Damasco')
selo(3, 8, 'ACHADO', 'Inscrições assírias: Israel = "Casa de Omri"'); selo(3, 11, 'LEITURA', 'Autêntica para a maioria dos especialistas')
selo(4, 0, 'TEXTO', '2 Reis 3:4-5'); selo(4, 4, 'LEITURA', 'Linha 31: "Casa de Davi" (Lemaire, 1994)')
selo(4, 5, 'LEITURA', 'Ou "Balaque"? (Finkelstein, Na\'aman e Römer, 2019)'); selo(4, 6, 'LEITURA', 'Imagens RTI favorecem "Casa de Davi" (Langlois, 2019)')
selo(5, 0, 'TEXTO', '1 Reis 14:25'); selo(5, 1, 'LEITURA', 'Proposta de K. A. Kitchen (1997) · sem consenso')
selo(6, 0, 'TEXTO', '1 Samuel 17:2, 16, 40'); selo(6, 2, 'ACHADO', 'Khirbet Qeiyafa · escavada desde 2007 (Garfinkel e Ganor)')
selo(6, 4, 'LEITURA', 'Datação e filiação debatidas'); selo(6, 5, 'ACHADO', '103 datações por carbono 14 · Regev et al., PNAS 2024')
selo(7, 1, 'LEITURA', 'Davi histórico, fundador de dinastia: posição da maioria')
test = [[33.05, 35.25, 1, 'A pedra do inimigo', 'Estela de Tel Dan · Museu de Israel'], [35.45, 37.85, 2, 'A letra quebrada', 'Estela de Mesa · Museu do Louvre'],
        [38.05, 41.95, 3, 'O faraó', 'Lista de Sheshonq I · Karnak, Egito'], [42.15, 46.7, 4, 'A fortaleza do vale', 'Khirbet Qeiyafa · vale de Elá (recriação)'],
        [P(3, 4), P(3, 4) + 5, 1, 'A pedra do inimigo', 'Estela de Tel Dan'], [P(4, 0) + .3, P(4, 0) + 5.3, 2, 'A letra quebrada', 'Estela de Mesa'],
        [P(5, 0) + .3, P(5, 0) + 5.3, 3, 'O faraó', 'Lista de Sheshonq I · Karnak'], [P(6, 2), P(6, 2) + 5, 4, 'A fortaleza do vale', 'Khirbet Qeiyafa'],
        [P(7, 1, .05), P(7, 1, .05) + 6, 1, 'FORTE', 'A pedra do inimigo'], [P(7, 2), Pf(7, 2), 2, 'PROVÁVEL', 'A letra quebrada'],
        [P(7, 3), Pf(7, 3), 3, 'DESCARTADA', 'O faraó'], [P(7, 4), Pf(7, 4), 4, 'EM ABERTO', 'A fortaleza do vale']]
test = [[round(a, 2), round(b, 2), n, t1, t2] for a, b, n, t1, t2 in test]
etiq = [[0.8, 4.8, 'VALE DE ELÁ · c. 1000 a.C.']] + [[P(k, i) + .4, P(k, i) + 4.4, t] for k, i, t in
        [(1, 0, 'BELÉM · c. 1000 a.C.'), (3, 0, 'JEZREEL · c. 841 a.C.'), (3, 4, 'TEL DAN · JULHO DE 1993'), (4, 1, 'DHIBAN, ATUAL JORDÂNIA · 1868'),
         (5, 0, 'KARNAK, EGITO · c. 925 a.C.'), (6, 0, 'VALE DE ELÁ'), (6, 2, 'KHIRBET QEIYAFA')]]
etiq = [[round(a, 2), round(b, 2), t] for a, b, t in etiq]
m7 = P(7, 5, .45)
cartao = [[P(7, 5, .05), m7, 'DAVI EXISTIU?', ''], [m7, Pf(7, 5) + .5, 'DAVI ERA QUÃO GRANDE?', ''],
          [P(8, 2, .1), Pf(8, 2), 'QUAL TESTEMUNHA TE CONVENCEU?', '1 · a pedra do inimigo    2 · a letra quebrada    3 · a fortaleza do vale']]
cred = [[33.05, 35.25, CRED['estela_tel_dan.jpg']], [35.45, 37.85, CRED['estela_mesa_louvre.jpg']], [38.05, 41.95, CRED['lista_sisaque.jpg']]] + cred_ev
dados = {'dur': TOTAL, 'selos': selos, 'test': test, 'etiq': etiq, 'cartao': [[round(a, 2), round(b, 2), x, y] for a, b, x, y in cartao], 'cred': cred}
open(f'{AQUI}/L01_overlay.js', 'w', encoding='utf-8').write('window.D = ' + json.dumps(dados, ensure_ascii=False) + ';\n')
json.dump({'total': TOTAL, 'O': O, 'V': V, 'entra': ENTRA, 'cap0': CAP0, 'carimbo': O[8] + V[8], 'testemunhas': [t[0] for t in test[4:8]],
           'capitulos': {k: [P(k, i) for i in range(len(T[str(k)]))] for k in range(1, 9)}}, open(f'{AQUI}/L01_linha.json', 'w'), indent=1)
print('total', TOTAL, 's =', f'{int(TOTAL // 60)}:{TOTAL % 60:04.1f}', '| inícios', {k: O[k] for k in O})
