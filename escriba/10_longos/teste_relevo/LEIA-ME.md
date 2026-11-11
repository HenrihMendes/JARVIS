# Teste do RELEVO (L01 · ~35 s · 16:9)

Teste da camada **B · Relevo** (Estratégia dos Longos, seção 3) aplicado a um trecho épico do L01: o exército de Damasco, o rei Hazael, o mapa, o escultor, a estela e o carimbo "O CASO DAVI".

## Como funciona
- `lib/relevo.js`: motor 2,5D.
  - Cada cena é feita de **placas** com um mapa de altura (pintado em canvas).
  - O shader calcula normais, **sombra própria** (marcha no mapa de altura em direção à luz), cavidades, detalhe de digitais e névoa.
  - As luzes se movem (lamparina, tocha) e as sombras mudam a cada quadro.
- `lib/arte.js`: as figuras e os cenários, desenhados por código:
  - soldados, carro de guerra, Hazael, porta-estandarte, escultor (o braço do martelo é uma peça móvel);
  - paisagem, palácio, oficina, estela com o texto em aramaico antigo, mapa em papiro, placa do título.
- `teste.html`: o "diretor", com a lista de planos e as funções `renderAt(T)`.
- `render.js`: captura os quadros com o Playwright e o Chromium (swiftshader).
- `overlay.html` e `overlay.js`: a camada gráfica 16:9 (série, selos, etiqueta, @escribatv, cartão *bytdwd*).
- `audio.py`: trilha e efeitos sintetizados (drone, cordas, coro, trompas, oud em Ré Hijaz, daf, cinzel, carimbo, silêncio antes da revelação).
- `montar.sh`: mixagem com *ducking* e montagem final (cor, grão, vinheta, camada gráfica).

## Rodar
```bash
npm install                                   # three@0.160.0 + fontes
node render.js prev 0 0 0.33 0 "3,10,15.5"    # prévia: quadros soltos a 1/3 da resolução
node render.js frames 0 35.4 1                # quadros em 1080p (retomável: pula os que existem)
node overlay.js                               # camada gráfica
python audio.py                               # trilha + efeitos (numpy, scipy, soundfile)
VOZ=voz.mp3 ./montar.sh                        # vídeo final em out/
```

## Medidas deste teste
- **Render:** ~1,8 s por quadro num processo só, a 1080p.
- **Com dois processos em paralelo:** ~0,57 quadro/s no total. Os 35 s levaram ~25 min, cerca de 2 a 3 vezes mais rápido que o 3D completo do V01 e V02.
- **Construção das placas:** de 3 a 60 s por cena. A estela em alta resolução é a mais pesada.

## Texto da estela
Só as 4 linhas centrais têm letras. Elas seguem trechos da leitura publicada (Biran & Naveh):
- "e Hadad foi à minha frente";
- "e matei Jorão, filho de Acabe, rei de Israel, e matei Acazias, filho de Jorão, rei da Casa de Davi".

As outras linhas aparecem como **desgaste, não como letras**. Não inventamos texto antigo. ⚠️ Conferir a transliteração com a fonte antes de usar no longo.
