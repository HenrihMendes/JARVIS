# ESCRIBA — PRODUÇÃO DOS LONGOS (documento de passagem entre sessões)

> **Leia isto primeiro numa sessão nova**, junto com `ESCRIBA_BRAND_BIBLE.md`. Não é preciso reler o histórico da conversa anterior: tudo o que foi decidido está aqui.
> Atualizado em 11/11/2026.

## 1. Decisões do fundador (✅)
- **Formato:** YouTube 16:9, **8 a 10 min**, 24 fps.
- **Narração:** a da abertura do L01 foi aprovada ("ficou perfeita, na medida certa"). Ela usa:
  - voz Nassif (`acdKA5HckGxoxxvy40dA`), `eleven_v4`;
  - **etiquetas mínimas** (`[calmo, voz grave]`, `[pausa]`, `[mais baixo]`), sem "épico" nem "crescendo";
  - **1 versão (take) por capítulo**.
- **Visual: "argila facetada" (low poly).** Geometria simples, luz forte, névoa e boa câmera, como nos jogos low poly. O motivo é economizar créditos do Claude e tempo, e deixar as cenas mais legíveis. Cores e elementos da marca continuam (barro, lápis-lazúli, lamparina, selos, carimbo).
- **Ritmo explicativo:** planos de **6 a 10 s**, câmera lenta, a imagem respira. A abertura de 57 s ficou acelerada demais (planos de ~3 s).
- **Economia de créditos do Claude** é prioridade:
  - kit fixo de cenários e personagens reaproveitados;
  - poucas rodadas de prévia (1 grade por capítulo);
  - uma sessão nova por vídeo.

## 2. Como economizar créditos do Claude (regras de produção)
1. **Não escrever código novo por plano.** Usar o kit (`lib/`) e descrever os planos como dados: cenário + câmera + duração.
2. **Uma grade de prévia por capítulo**, em escala 0,33, e só os planos novos em 1080.
3. **Planos longos** (6 a 10 s) = menos planos para montar.
4. **Reaproveitar cenários-mestre**: vale de Elá, mesa do Escriba, relevos do teste, documentos e fotos.
5. **Render em segundo plano** (não gasta créditos). Só voltar à conversa quando terminar.
6. **Sessão nova por vídeo**, partindo deste documento.

## 3. O que já existe (`escriba/10_longos/teste_relevo/`)
| Peça | Arquivo | Uso |
|---|---|---|
| Motor 2,5D (relevo, documentos) | `lib/relevo.js` | Placas com sombra própria, papiro com tinta, partículas, chama, céu |
| Arte por código | `lib/arte.js` | Soldados, carro, Hazael, rei com lira, escultor, estela (texto real de Tel Dan), mapa, linha do tempo, "DAVI lenda?", estratos, cidade, placa do título |
| Motor 3D | `lib/barro.js` | Personagem paramétrico, objetos, objetos que se desfazem. **`setLowpoly(true)`** liga o estilo facetado |
| Abertura do L01 | `cap0.html` | 18 planos. `?lp=1` = low poly |
| Render | `render.js` | `PAGE=cap0.html QS=lp=1 node render.js <pasta> <t0> <t1> 1` (pula quadros prontos) |
| Camada gráfica | `overlay.js` + `overlay_cap0.html` | Selos, contador "TESTEMUNHA n/4", créditos de foto, @escribatv |
| Trilha | `audio_cap0.py` | Sintetizada (drone, cordas, coro, oud em Ré Hijaz, daf, efeitos) |
| Montagem | `montar_cap0.sh` | Voz com ganho linear (sem loudnorm dinâmico) → mix → cor/grão/vinheta → mp4 |

- **Ambiente:** "JARVIS" (personal). Libera `commons.wikimedia.org`, `upload.wikimedia.org` e `elevenlabsusercontent.com`. O script de preparação ainda não foi testado numa sessão nova.
- **Fotos:** `L01_o-caso-davi/assets/fotos/` (`baixar.sh`, `CREDITOS.md`). O Wikimedia limita os pedidos (429), então baixar devagar.
  - Faltam a estela de Tel Dan, o portal de Karnak e Qeiyafa.
  - No lugar delas foram usados o portão de Tel Dan, a lista de Sisaque e a fortaleza em 3D.
- **Mídias** (quadros, mp3, mp4) **não vão para o Git**. A narração do cap. 0 está em `L01_o-caso-davi/producao/cap0_voz.mp3`, só nesta máquina.

## 4. Estado do L01 "O caso Davi"
- ✅ **Cap. 0 (abertura, 57 s)** pronto no estilo antigo (argila lisa). A refazer em low poly e mais lento, sem gerar a narração de novo.
- ⏳ **Caps. 1 a 8:** o texto está em `L01_o-caso-davi/roteiro_v2_epico.md`. É preciso aplicar o tom da v3 (menos etiquetas, frases naturais). Faltam a narração (~7 mil créditos do ElevenLabs, 1 versão por capítulo) e a produção.
- ⚠️ **Conferir antes de narrar:**
  - Estela de Mesa: a quebra com fogo e água fria em 1868, as 34 linhas e a disputa europeia;
  - 2 Rs 9:20 ("dirige como um louco") nas traduções;
  - itens "CONFERIR" da ficha em `L01_o-caso-davi/roteiro.md`.

## 5. Próximos passos (sessão nova)
1. Criar o **formato de planos em dados** (JSON: cenário, câmera de/para, duração, pose, camada gráfica) e o "diretor" genérico que o lê. É o que mais economiza daqui para frente.
2. Ajustar o low poly: cores de face por cenário, céu com gradiente, névoa, luz-chave forte. Sem grama de instâncias e sem desfoque pesado.
3. Refazer o cap. 0 com planos de 6 a 10 s, usando a mesma narração.
4. Revisar o texto dos caps. 1 a 8 no tom da v3 → conferir os fatos → narrar (1 versão por capítulo) → produzir capítulo por capítulo → montagem final, capítulos do YouTube e descrição com fontes e créditos.
