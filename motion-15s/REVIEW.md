# REVIEW — Escriba · "Os 4 Selos" (15 s, 9:16)

Entrega: `renders/escriba-4-selos-15s.mp4` · 1080×1920 · 30 fps · 15,0 s · H.264 + AAC · 14,2 MB.

## Decisões criativas
- **Tema:** vinheta-manifesto da marca. O texto saiu só de material já aprovado ou adotado no Brand Bible: o gancho do carrossel C1
  ("Nem tudo que você vê num vídeo bíblico é Bíblia."), os 4 Selos, o nome, o lema e "Siga @escribatv". Nada de afirmação
  histórica nova, então não precisou de selo de fonte.
- **Arte:** símbolo, bulla e os 4 selos são os **SVG oficiais extraídos do Manual de identidade**, sem redesenho.
  Cores pela paleta (lápis dominante, lamparina escassa). Fontes Fraunces 900 / Itálico 400, Archivo 800, IBM Plex Mono 600
  (OFL, arquivos em `assets/fonts`).
- **Mundo:** parede lápis iluminada por uma lamparina de argila visível na base (a fonte da luz quente), com poeira subindo no calor.
  É a versão 2D de "Barro & Luz".
- **Assinatura:** carimbo de madeira desce sobre a bulla, a argila cede e o "E" aparece em relevo. Depois ESCRIBA, o lema e o CTA.
- **Transições com causa:** "é Bíblia." é carimbado; cada selo é carimbado; os 4 selos convergem e viram a bulla; o carimbo revela o E.

## Desvios das regras da marca (conscientes, a decidir)
1. **Sem narração.** Regra 6 pede a voz Nassif em todos os vídeos. Num motion de 15 s sem pedido de voz, deixei sem.
   Dá para adicionar pelo ElevenLabs (voz `acdKA5HckGxoxxvy40dA`) se a vinheta for virar abertura de vídeo.
2. **Trilha do catálogo HeyGen, não a trilha original da marca.** O Brand Bible pede trilha original sintetizada
   (drone em Ré, oud em Hijaz de Ré, daf). Usei a faixa do catálogo mais próxima disso: "Hijaz, oud/santur, daf,
   tensa→confiante", 100 BPM (`assets/bgm/CREDITS.md`). Não conferi se ela está em Ré nem se é a mesma escala exata.
   Confira os termos de uso comercial da HeyGen para o seu plano antes de monetizar.
3. **Sem pergunta de comentário** (regra 7). Em 15 s ela roubaria o tempo de leitura do cartão final.
4. **@escribatv em 28 px** (o manual diz 27 px): 28 px é o piso de leitura em celular que o check exige.
5. **2D vetorial, não o 3D de argila do motor V01/V02.** O carimbo e a bulla são planos; fica abaixo do acabamento dos episódios.

## O que foi medido e o que só foi olhado
- `hyperframes check`: ok, 0 erros.
- Mantive 3 avisos `line_unread` no cartão final de propósito. É falso positivo: o amostrador devolveu `opacity: null` em 13,875 s e partiu a contagem.
  Os quadros do MP4 em 13,5 / 13,9 / 14,9 s mostram ESCRIBA, o lema e o CTA na tela, de 12,1 s até o fim.
- Revisão: contact sheets das cenas, dos cortes (−0,2 a +0,2 s) e na largura de celular (360 px). Defeitos achados e corrigidos:
  - ESCRIBA aparecia cinza antes da hora;
  - um retângulo cortava o halo da chama;
  - o carimbo lia como porta-copo, com um "sorriso" no pegador;
  - havia um quadro vazio no corte selos → bulla (10,8 s);
  - sobravam 0,35 s parados antes do 1º selo.
- Áudio do MP4 **medido, não ouvido**:
  - −16,1 LUFS integrado, pico real −1,5 dBTP, sem clipping;
  - a trilha entra em 7,85 s da faixa: os 4 selos e o "é Bíblia." caem em batidas;
  - o silêncio da faixa (18,4–19,1 s) cai logo antes do carimbo final; tirei o riser para não preencher esse silêncio;
  - cada impacto fica 6 a 15 dB acima da trilha; o carimbo final sai de −40 dB para −8 dB;
  - o "pop" do CTA (12,9 s) fica abafado pela trilha que volta; deixei assim.

## Plano mais fraco
O carimbo de madeira (11,0–12,1 s). Visto de cima e em 2D ele funciona, mas não tem o peso do carimbo 3D dos episódios.
Com mais tempo: trazer o cartão final 3D do motor (`09_videos/motor/`) como vídeo e usar este projeto só para a tipografia e a camada da marca.
