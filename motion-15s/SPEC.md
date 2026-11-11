# SPEC — Escriba · vinheta "Os 4 Selos" (15 s, 9:16)

GOAL:    em 15 s o espectador entende o que diferencia a Escriba (os 4 Selos) e sai sabendo o nome, o lema e o @.
OUTPUT:  HyperFrames, 1080 x 1920, 30 fps. Reel / Shorts / TikTok.
TIME:    15 s x 30 fps = 450 frames. Trilha HeyGen (Hijaz + daf, 100 BPM = 18 quadros por batida) a partir de 7,85 s
         da faixa; selos a cada 2 batidas (1,2 s). SFX Pixabay nos impactos. Mix -16,1 LUFS, pico -1,5 dBTP.
SOURCE:  ESCRIBA_BRAND_BIBLE.md (09/11/2026) + Manual de identidade (artifact 5Kie1bnH2AG2QyqUeLHbUm).
         Símbolo e selos = SVG oficiais extraídos do manual, sem redesenho.

LOOK:    medium "Barro & Luz" em 2D: parede noturna lápis-lazúli iluminada por uma lamparina de argila visível.
         ground   #1D2A4D (topo #141D36), textura de reboco feTurbulence 7 %, vinheta 55 % nas bordas
         key      lamparina na base (flame #FFBF7A -> #E2A43A), poça de luz radial 0.30 de opacidade, raio 1000 px
         render   GSAP 3.15.0 embutido em assets/vendor (o render não depende de CDN)
         ink      papiro #F1E6D2; apoio #C9BEAA
         accent   lamparina #E2A43A: 1 palavra por frase ("Bíblia.", o lema), barra de progresso, chama
         argila   barro #B5532C / barro escuro #7A3A1E; madeira do carimbo #8A5A34 / #5E3A20
         display  Fraunces 900, 104 px, tracking -0.01 em (gancho); Fraunces 900 138 px, +0.09 em (ESCRIBA)
         lema     Fraunces Itálico 400, 58 px, lamparina
         texto    Archivo 800, 40 px, papiro (descritores dos selos, CTA)
         rótulos  IBM Plex Mono 600, 27–30 px, tracking 0.16 em
         grão     6 %, trocado a 12 fps (determinístico)
OBJECTS: os 4 selos de argila oficiais (TEXTO lápis claro, ACHADO barro, LEITURA oliva, RECRIAÇÃO lamparina);
         a bulla da marca (borda irregular, anel papiro, "E" de cálamo + 3 camadas);
         um carimbo de madeira (pegador, pescoço, bloco) que desce sobre a bulla;
         a lamparina de argila com chama viva (fonte da luz); poeira subindo no calor da chama.
MOTION:  entrada de selo/carimbo = pressão: power3.in 0.16 s até 0.94, assenta com back.out(1.6) 0.24 s
         títulos: entram e ficam parados; nada flutua depois de pousar
         saída = 40–50 % da entrada: blur 0->8 px + opacidade em 0.18 s
         movimento de mundo: chama (0.5 s por ciclo, semente fixa), poeira subindo 260–420 px em 15 s
SHOTS:
  00.00–03.90  GANCHO. Frame 0 já mostra "Nem tudo que você vê num vídeo bíblico". 0.45 s: "é Bíblia." é carimbado
               (Bíblia. em lamparina) + impacto grave. Leitura 3.4 s. Sai palavra a palavra com blur. whoosh em 3.6 s.
               Título no topo 500 px (centro da faixa segura).
  03.80–10.90  OS 4 SELOS. Rótulo mono "OS 4 SELOS DA ESCRIBA". Grade 2x2, um selo carimbado a cada 1.2 s
               (abs 4.16, 5.36, 6.56, 7.76 = batidas da trilha), cada um com descritor de 1 linha. Impactos alternando 2 takes.
               10.35–10.80: os 4 selos convergem para o centro (power3.in, blur 6 px) e viram a bulla. whoosh.
  10.80–15.00  ASSINATURA. Bulla sem o E. A trilha cai a quase zero (10,55–11,25). Carimbo de madeira desce
               (11.35 impacto grave + trilha volta forte na mesma batida + poeira de argila),
               sobe e revela o E em relevo. ESCRIBA letra a letra (12.05), lema (12.45), "Siga @escribatv" (12.8, pop).
               Segura 2.1–2.5 s.
  00.00–15.00  CAMADA DA MARCA. @escribatv + símbolo 62 px (top 232, right 44) e barra de progresso lamparina (y 214).
BANNED:  vazio escuro sem fonte de luz; brilho/bloom/lens flare; gradiente roxo; partículas sem causa (a poeira
         está na luz da chama); títulos que deslizam depois de pousar; tudo entrando com fade + slide-up;
         redesenhar a bulla como círculo; sombra/brilho/gradiente no logotipo; "@escriba.tv"; sensacionalismo.
         (Exceções da própria marca: fundo lápis dominante, @ fixo no canto, botão em pílula.)
SAFE:    nada de texto acima de 168 px nem abaixo de 1330 px; nada de texto x > 960 abaixo de 1100 px (trilho do app).
QA:      t=0 (gancho legível, thumbnail), 0.7 (Bíblia. carimbada), 4.6 / 8.4 (selos), 10.6 (convergência),
         11.4 (impacto), 12.3 (E revelado), 14.5 (cartão final completo) — também a 360 px de largura.
