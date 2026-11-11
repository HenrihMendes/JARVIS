# ESCRIBA — PRODUÇÃO DOS LONGOS (documento de passagem entre sessões)

> **Leia isto primeiro numa sessão nova**, junto com `ESCRIBA_BRAND_BIBLE.md`. Não é preciso reler o histórico da conversa anterior: tudo o que foi decidido está aqui.
> Atualizado em 11/11/2026 (2ª sessão).
> ⚠️ **`ESCRIBA_BRAND_BIBLE.md` não está em nenhum branch do repositório.** A 2ª sessão não conseguiu lê-lo. Se ele existe, precisa ser commitado aqui ou anexado à sessão.

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
- **Velocidade do render low poly** (medida em 11/11, container de 4 CPUs, 1080p, `cap0.html?lp=1`):
  - **~1,5 a 1,6 s por quadro** nos planos C01, C04 e C13, praticamente igual ao Relevo (~1,8 s);
  - a construção de uma cena leva até ~13 s (a mesa do Escriba);
  - **10 min = 14.400 quadros ≈ 6 a 7 h de render.** O low poly economiza código e créditos do Claude, **não tempo de render**.
  - Para o diretor, nesta ordem de ganho:
    1. fotos e documentos com movimento simples direto no ffmpeg, sem WebGL;
    2. testar 720p com upscale (faces chapadas aguentam bem);
    3. capturar em JPEG em vez de PNG.
- **Mídias** (quadros, mp3, mp4) **não vão para o Git**. A narração do cap. 0 também está guardada no ElevenLabs: flow `2MGWDdGu9YZZ9ik6RWt1`, sessão `wlCJqQfzONo1sPllfEi0`. Para baixar de novo **sem gastar créditos**, use `creative_get_flow_run_status`, que devolve a URL do áudio.

## 4. Estado do L01 "O caso Davi"
- ✅ **Cap. 0 (abertura, 57 s)** pronto no estilo antigo (argila lisa). A refazer em low poly e mais lento, sem gerar a narração de novo.
- 🟡 **Caps. 1 a 8:** o **texto v3 está pronto para aprovação** em `L01_o-caso-davi/roteiro_v3_producao.md`. Tem 1.201 palavras, e o vídeo fica em ≈ 9:50 a 10:10.
  - A checagem de fatos foi feita e corrigiu 5 pontos (tabela no fim do roteiro).
  - Faltam a narração (1 versão por capítulo) e a produção.
- ✅ Já conferidos: Mesa (achada em 1868, quebrada em 1869; 34 linhas), 2 Rs 9:20 na NVI, Lemaire 1994, Kitchen 1997, Casa de Omri, Qeiyafa e PNAS 2024 (103 datações).
- ⚠️ **Ainda faltam:** 1 Sm 16:10-11 e 17:16, 40 em 2 traduções; a formulação "a maioria dos historiadores, crentes ou não".

## 5. Próximos passos (sessão nova)
> **Ordem revista na 2ª sessão.** O texto e a narração vêm antes do diretor, por três motivos: o texto é a parte mais barata; ele trava a narração; e a duração real do áudio é o que define os planos.

0. Aprovar o texto dos caps. 1 a 8 → narrar o cap. 1 → medir a velocidade real (palavras por minuto) → ajustar o resto, se precisar → narrar os caps. 2 a 8.
1. Criar o **formato de planos em dados** (JSON: cenário, câmera de/para, duração, pose, camada gráfica) e o "diretor" genérico que o lê. É o que mais economiza daqui para frente.
2. Ajustar o low poly: cores de face por cenário, céu com gradiente, névoa, luz-chave forte. Sem grama de instâncias e sem desfoque pesado.
3. Refazer o cap. 0 com planos de 6 a 10 s, usando a mesma narração.
4. Revisar o texto dos caps. 1 a 8 no tom da v3 → conferir os fatos → narrar (1 versão por capítulo) → produzir capítulo por capítulo → montagem final, capítulos do YouTube e descrição com fontes e créditos.
