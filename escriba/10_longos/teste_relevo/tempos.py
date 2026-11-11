# Tempos de cada parágrafo da narração (sem gastar crédito): os N-1 maiores silêncios separam os N parágrafos.
# Uso: python3 tempos.py <caps.json> <pasta_mp3> 1 2 3 ...   → imprime JSON {cap: [[ini, fim, "texto"], ...]}
import json, re, subprocess, sys
caps = json.load(open(sys.argv[1], encoding='utf-8')); pasta = sys.argv[2]; out = {}
for c in sys.argv[3:]:
    f = f'{pasta}/cap{c}_voz.mp3'
    log = subprocess.run(['ffmpeg', '-hide_banner', '-i', f, '-af', 'silencedetect=noise=-38dB:d=0.25', '-f', 'null', '-'], capture_output=True, text=True).stderr
    ini = [float(x) for x in re.findall(r'silence_start: ([\d.]+)', log)]; fim = [float(x) for x in re.findall(r'silence_end: ([\d.]+)', log)]
    dur = float(subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f], capture_output=True, text=True).stdout)
    sil = [(a, b) for a, b in zip(ini, fim) if a > 0.3 and b < dur - 0.3]
    pars = [re.sub(r'\[[^\]]*\]\s*', '', p).strip() for p in caps[c].split('\n\n')]
    # fronteira esperada pela proporção de letras; encaixa no silêncio mais próximo (e mais longo, em empate)
    n = [len(p) for p in pars]; tot = sum(n); lim = [0.0]; acc = 0; meio = [((a + b) / 2, b - a) for a, b in sil]
    for k in range(len(pars) - 1):
        acc += n[k]; alvo = dur * acc / tot
        cand = [m for m in meio if m[0] > lim[-1] + 0.5] or [(alvo, 0)]
        m = min(cand, key=lambda m: abs(m[0] - alvo) - 0.8 * m[1]); lim.append(round(m[0], 2))
    lim.append(round(dur, 2))
    out[c] = [[lim[i], lim[i + 1], pars[i][:70]] for i in range(len(pars))]
print(json.dumps(out, ensure_ascii=False, indent=0))
