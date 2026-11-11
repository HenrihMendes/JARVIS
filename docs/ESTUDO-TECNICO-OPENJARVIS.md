# Estudo técnico: OpenJarvis e o seu assistente J.A.R.V.I.S.

> **Status:** estudo concluído, nada foi instalado nem executado no seu computador.
> **Data:** 11/11/2026
> **Base da análise:** código-fonte real do OpenJarvis (commit `6201505`, 11/11/2026), documentação oficial, issues abertas no GitHub, e o código de um projeto público de terceiros construído sobre o OpenJarvis (usado só como exemplo).
> **Próximo passo:** você aprova (ou corta) o plano da seção 12, e só depois começamos.

---

## Sumário

1. [Veredito em uma página](#1-veredito-em-uma-página)
2. [O vídeo de referência e um exemplo real](#2-o-vídeo-de-referência-e-um-exemplo-real)
3. [O que é o OpenJarvis (pelo código, não pelo marketing)](#3-o-que-é-o-openjarvis-pelo-código-não-pelo-marketing)
4. [O que o OpenJarvis já oferece](#4-o-que-o-openjarvis-já-oferece)
5. [O que aparece no vídeo e não existe nativamente](#5-o-que-aparece-no-vídeo-e-não-existe-nativamente)
6. [Riscos do OpenJarvis para o seu caso](#6-riscos-do-openjarvis-para-o-seu-caso)
7. [Seu notebook: diagnóstico e o que ele aguenta](#7-seu-notebook-diagnóstico-e-o-que-ele-aguenta)
8. [Arquitetura recomendada](#8-arquitetura-recomendada)
9. [Tecnologias escolhidas e por quê](#9-tecnologias-escolhidas-e-por-quê)
10. [Custos reais](#10-custos-reais)
11. [Limitações técnicas (o que não vai ficar igual ao filme)](#11-limitações-técnicas-o-que-não-vai-ficar-igual-ao-filme)
12. [Plano de implementação por etapas](#12-plano-de-implementação-por-etapas)
13. [Seus pontos cegos](#13-seus-pontos-cegos)
14. [Decisões](#14-decisões)
15. [Fontes](#15-fontes)

---

## 1. Veredito em uma página

**1. Palmas, palavra de ativação, painel futurista e ações no Windows não existem no OpenJarvis.** Procurei no código-fonte inteiro por *wake word*, *hotword*, *clap*, *porcupine*, *openwakeword* e *VAD*: **zero resultados** fora de um e-mail fictício num conjunto de testes. Qualquer vídeo que mostre isso usa código extra construído por cima do OpenJarvis.

**2. Desconfie de "100% local e sem mensalidade".** Não tive acesso ao seu vídeo. Mas analisei o código de um projeto público de terceiros que monta esses mesmos efeitos sobre o OpenJarvis. Nele, qualquer pedido com palavras como "hoje", "agora", "clima", "agenda", "e-mail" ou "arquivo" vai para a **API paga da Anthropic (Claude Opus 5.5)**. Sem a chave paga, o assistente responde: *"Para pesquisar ou executar tarefas, falta configurar a chave da nuvem"*. O modelo local só faz conversa simples. É o padrão mais comum nesse tipo de demonstração.

**3. Palmas detectadas só por volume são frágeis.** Nesse projeto, "palma" é: pico de volume acima de um limiar e 6 vezes acima do ruído, com duas ocorrências entre 0,12 s e 0,80 s. Uma batida na mesa ou uma porta fechando também disparam. Funciona em vídeo, falha no dia a dia.

**4. O OpenJarvis é bom, mas é para outra coisa.** É um framework de **pesquisa** de Stanford (status "Alpha"), com cerca de 179 mil linhas de Python. O foco é medir energia, custo e desempenho de IA local. Ele traz muita coisa que você não precisa (mineração de criptomoeda, 32 canais de chat, benchmarks). E é fraco exatamente no que você quer: voz contínua, português, Windows e segurança das ações.

**5. Minha recomendação original:** **não usar o OpenJarvis como base do produto.** Usar como **referência de estudo** e construir um núcleo próprio, enxuto, Windows-first e pt-BR-first, com as mesmas peças de código aberto que o OpenJarvis usa por baixo (Ollama, faster-whisper, Kokoro) mais as que faltam nele (openWakeWord, Silero VAD, motor de permissões, interface própria).

> **Decisão tomada (11/11/2026):** o OpenJarvis **será a base**, com as condições da seção 14. A arquitetura da seção 8 será ajustada quando chegarem os dados do notebook.

**6. Seu notebook é o ponto fraco.** Lenovo IdeaPad Slim 3 com i5-13420H, **8 GB de RAM** e **sem placa de vídeo dedicada**. Dá para voz local e um "cérebro" pequeno (modelo de 2B), mas não para a inteligência das demonstrações. Detalhes e caminhos de melhoria na seção 7.1.

**7. Custo:** dá para ter **R$ 0/mês** com tudo local, aceitando um assistente mais lento e menos inteligente que os de demonstração. Um plano híbrido sensato (local por padrão, nuvem só quando você autorizar) fica em **poucos dólares por mês** (seção 10).

---

## 2. O vídeo de referência e um exemplo real

### 2.1 Limitação desta análise

**Não tive acesso ao vídeo**, e eu não consigo assistir a vídeos. Por isso este estudo **não descreve o vídeo**. Ele parte do que você contou no pedido (ativação por duas palmas, "bom dia" com briefing, interface futurista) e verifica, no código, o que o OpenJarvis tem ou não tem. Essa parte vale para qualquer vídeo.

Para entender **como** esses efeitos costumam ser feitos, analisei um projeto público de terceiros construído sobre o OpenJarvis ([enricomed/Jarvis-](https://github.com/enricomed/Jarvis-)). Ele serve só como exemplo de implementação: **não tem relação com o seu projeto** e não será usado nele.

### 2.2 Como esses efeitos são feitos num exemplo real

| Funcionalidade | Como é feita nesse exemplo | Nativo do OpenJarvis? | Arquivo de evidência |
|---|---|---|---|
| Ativação por **duas palmas** | Pico de amplitude ≥ limiar e > 6× o ruído de fundo; 2 picos entre 0,12 s e 0,80 s; 80 ms de refratário. Tem modo `--calibrar`. Sem IA, só limiar de volume. | **Não** | `scripts/jarvis_show.py`, função `esperar_duas_palmas` |
| **Jingle** de abertura | Toca `voz/jingle.mp3` se existir | **Não** | `jarvis_show.py`, `tocar_jingle` |
| Ativação por "**Olá, Jarvis**" | Fica gravando todo trecho com voz (detecção por energia) e **transcreve tudo com Whisper** `base` na CPU. Depois procura "jarvis" ou variantes ("jarbas", "javis", "garvis"...) por semelhança de texto. Não é um detector de palavra de ativação de verdade. | **Não** | `jarvis_show.py`, classe `AtivadorPorVoz` |
| **Ouvir** (fala → texto) | faster-whisper, modelo `small` | **Sim** (`speech/faster_whisper.py`) | — |
| **Pensar** | Ollama + `gemma4:e4b` (9,6 GB) ou `gemma4:e2b` (7,2 GB) | **Sim** (`engine/ollama.py`) | `README.md` do exemplo |
| **Falar** em pt-BR | Kokoro, voz `pf_dora` | **Parcial**: o Kokoro é suportado; a voz pt-BR funciona pelo prefixo `p`, mas não está na lista de vozes do OpenJarvis e o padrão é `bm_george` (britânico) | `speech/kokoro_tts.py`, `core/config.py` |
| **Conversa mãos-livres** (sem apertar Enter) | Loop próprio: ouve, responde, ouve de novo; encerra com "obrigado, Jarvis" ou dois silêncios | **Não**. No OpenJarvis, `jarvis chat --voice` exige **Enter** a cada fala | `cli/_voice_chat.py` (`input("You> [type, or press Enter to speak] ")`) |
| **Pesquisa na internet** | **Claude Opus 5.5 via API paga** + web search da Anthropic | **Não** (o OpenJarvis tem `web_search` com DuckDuckGo, mas o exemplo não usa) | `scripts/nuvem.py`: `MODELO = "claude-opus-5-5"` |
| **Executar ações** (abrir app, lembrete, agenda, Chrome) | AppleScript (**só Mac**) + "Claude in Chrome" via Claude Code | **Não** | `scripts/acoes_mac.py`, `nuvem.py` |
| **Painel holográfico** | Página HTML com animações CSS (`@keyframes`), servida por FastAPI + WebSocket. Não é 3D. | **Não** | `app/index.html`, `scripts/app_jarvis.py` |
| **"Bom dia"** com clima, agenda e e-mails | O OpenJarvis tem o agente `morning_digest`. A doc diz que "Good morning" dispara o resumo, mas **não achei esse gatilho no código** (só a saudação `'Good morning'` da tela de chat). | **Parcial** | `agents/morning_digest.py`, `docs/user-guide/morning-digest.md` |

### 2.3 O que isso significa para você

Nesse exemplo, o OpenJarvis entra com STT, TTS, chamada ao Ollama e personas. O efeito "uau" (palmas, jingle, painel, ações) é código extra, e a parte inteligente de verdade (pesquisar, agir) roda **na nuvem paga**. Não há nada de errado nisso como protótipo. Mas não é um produto "local, privado e grátis". Vale conferir se o seu vídeo de referência não esconde a mesma coisa.

Um detalhe preocupante no exemplo: o documento `docs/SEGURANCA-LGPD.md` afirma *"nada sai do seu computador"*, enquanto o código manda para a nuvem qualquer frase com "hoje", "agenda" ou "e-mail" quando a chave está configurada. **Documentação e código se contradizem.** É exatamente o tipo de coisa que precisamos evitar.

---

## 3. O que é o OpenJarvis (pelo código, não pelo marketing)

| Item | Fato verificado |
|---|---|
| Origem | Hazy Research e Scaling Intelligence Lab, Stanford. Artigo no arXiv (2605.17172). Anunciado no blog do Ollama em 28/05/2026. |
| Licença | Apache 2.0 (arquivo `LICENSE`) |
| Maturidade | `Development Status :: 3 - Alpha` (`pyproject.toml`) |
| Tamanho | 687 arquivos Python, cerca de 179 mil linhas, mais frontend React/Tauri e extensão Rust |
| Atividade | Repositório criado em 02/2026; cerca de 14,6 mil estrelas, 3,5 mil forks, 112 issues abertas; commits diários |
| Python | 3.10 a 3.13 (3.14 não funciona no Windows por falta de numpy) |
| Foco declarado | "Evaluations that treat energy, FLOPs, latency, and dollar cost as first-class constraints" e um "learning loop" com traces locais. É uma **plataforma de pesquisa** sobre eficiência de IA local. |

### 3.1 Arquitetura do OpenJarvis

Cinco "primitivas" combináveis, todas com registro de plugins (`core/registry.py`):

```
           ┌──────────────────────────────────────────────────────┐
 entrada   │  CLI (jarvis chat/ask)  ·  API FastAPI  ·  32 canais  │
           │  (Telegram, Slack, WhatsApp...)  ·  Desktop Tauri     │
           └──────────────┬───────────────────────────────────────┘
                          ▼
           ┌──────────────────────────────┐   ┌───────────────────┐
           │ AGENTES (8 principais)       │◄─►│ FERRAMENTAS (~60) │
           │ simple, orchestrator, ReAct, │   │ shell, arquivos,  │
           │ morning_digest, deep_research│   │ web, MCP, skills  │
           │ operative, monitor...        │   └───────────────────┘
           └──────────────┬───────────────┘
                          ▼
           ┌──────────────────────────────┐   ┌───────────────────┐
           │ INTELLIGENCE (roteamento de  │   │ MEMÓRIA           │
           │ modelos, catálogo)           │   │ SQLite FTS5, FAISS│
           └──────────────┬───────────────┘   │ fatos do usuário  │
                          ▼                   └───────────────────┘
           ┌──────────────────────────────┐
           │ ENGINE: Ollama, vLLM, llama. │   + telemetria de energia,
           │ cpp, MLX, nuvem (OpenAI,     │     benchmarks, "learning"
           │ Anthropic, Gemini, LiteLLM)  │     (DSPy/GEPA), mineração
           └──────────────────────────────┘
```

### 3.2 Como funcionam os modelos locais e o Ollama

- O OpenJarvis **não roda o modelo**: ele chama o servidor do Ollama em `http://localhost:11434` pela rota `/api/chat` (`engine/ollama.py`).
- O próprio OpenJarvis escolhe o modelo pela memória disponível (`core/config.py`, `recommend_model`):

  | Memória utilizável | Modelo sugerido |
  |---|---|
  | até 8 GB | `qwen3.5:2b` |
  | até 16 GB | `qwen3.5:4b` |
  | até 32 GB | `qwen3.5:9b` |
  | acima | `qwen3.5:27b` |

  "Memória utilizável" é 90% da VRAM se houver GPU, ou `(RAM − 4) × 0,8` se não houver. **Exemplo:** notebook com GPU de 4 GB → 3,6 GB → `qwen3.5:2b`. Sem GPU e com 16 GB de RAM → 9,6 GB → `qwen3.5:4b`.
- O contexto padrão é **16.384 tokens** (`JARVIS_NUM_CTX`). Isso consome bem mais memória que o padrão do Ollama (4k). Em notebook, o exemplo reduz para 8.192.
- **Detalhe importante:** se o modelo não aceitar *function calling*, o OpenJarvis **repete a chamada sem as ferramentas, em silêncio** (`ollama.py`, linhas 194-197). O agente perde as ferramentas e você não fica sabendo.

### 3.3 Reconhecimento de voz (STT)

- Padrão: **faster-whisper** local, modelo `base`, idioma em **detecção automática** (`SpeechConfig`). Para português, precisa configurar `language = "pt"` e usar pelo menos o `small`.
- Alternativas na nuvem: OpenAI Whisper e Deepgram (pagas).
- Captação (`speech/voice_io.py`): grava até detectar 1,5 s de silêncio por **volume RMS fixo (500)**. Não há VAD neural. Em ambiente com ruído (ventilador, rua), isso corta errado ou não para de gravar.

### 3.4 Síntese de voz (TTS)

- Ordem de preferência: Kokoro (local) → OpenAI TTS → Cartesia → ElevenLabs (as três últimas pagas).
- Kokoro suporta pt-BR (`pf_dora`, `pm_alex`, `pm_santa`). Avaliações de terceiros classificam essas vozes como **nota C**: "usáveis", não naturais. Não achei teste de audição independente.
- A síntese é **bloqueante e de uma vez só**: espera a resposta inteira do modelo, gera o áudio inteiro, toca (`speak()` em `_voice_chat.py`). Não há streaming por frase nem interrupção.
- No Windows há issue aberta: **"No spoken audio on native Windows"** (#1211, de 31/10/2026).

### 3.5 Memória

Três camadas reais no código:

1. **Fatos de longo prazo** (`memory/service.py`, `extractor.py`): depois de cada troca, um modelo pequeno extrai "fatos duráveis" sobre você (preferências, projetos) em segundo plano. Existe issue aberta: memória não substitui fatos desatualizados (#1189).
2. **Base de documentos (RAG)**: SQLite FTS5 por padrão (busca por palavra-chave, persistente). FAISS e ColBERT existem, mas **ficam só na memória RAM e se perdem ao reiniciar** (dito na própria doc).
3. **Perfil do usuário** editável por ferramenta (`tools/user_profile_manage.py`).

### 3.6 Agentes e ferramentas

- 8 agentes destacados no README (o código registra mais de 20, contando variantes experimentais): `simple`, `orchestrator`, `native_react`, `native_openhands` (gera e roda Python), `operative`, `monitor_operative`, `deep_research` e `morning_digest`.
- Cerca de 60 ferramentas registradas, entre elas: `shell_exec`, `file_read`, `file_write`, `apply_patch`, `code_interpreter`, `web_search` (DuckDuckGo grátis; Tavily e outros pagos), `browser` (Playwright), `pdf_tool`, `weather`, `calculator`, lembretes e agenda (só **Apple**), `git`, banco de dados, MCP.
- **Nenhuma ferramenta vem ligada.** Sem configurar `tools.enabled`, o agente tem zero ferramentas.
- **Skills**: instala habilidades no padrão agentskills.io (Hermes, OpenClaw). Atenção: importar milhares de skills da comunidade é instalar código e instruções de terceiros sem revisão.

### 3.7 Automação e agendamento

- Agendador com cron (`scheduler/`), agentes "contínuos", resumo matinal agendado (`jarvis digest --schedule "0 6 * * *"`).
- No Windows, serviço via Tarefa Agendada (`deploy/windows/`).

### 3.8 Interface gráfica

- `jarvis gui`: servidor local + frontend React 19, Tailwind e shadcn. É um **chat** com barra lateral, página de agentes, de fontes de dados e um painel de **energia, custo e traces**.
- App desktop **Tauri 2** com instalador `.exe`, Ollama embutido e auto-update.
- Microfone na GUI: botão de **ditado** (aperta, fala, aperta de novo). As respostas aparecem só em texto. "Conversa por voz no app desktop" é **pedido de funcionalidade em aberto** (#1038).
- O overlay rápido (`Cmd+Shift+Space`) é **só macOS**.
- **Nada disso parece J.A.R.V.I.S.** Não há esfera, ondas, nem os estados visuais que você descreveu.

### 3.9 Integrações externas

- Conectores: Gmail (OAuth ou IMAP), Google Calendar, Tasks, Contacts, Drive, Outlook, Notion, Obsidian, Slack, GitHub, Spotify, Strava, Oura, Dropbox, Hacker News, RSS, clima (**só OpenWeatherMap, exige chave**), além de Apple Notes, Health, Music e iMessage (só Mac).
- Issue aberta: **`jarvis connect gmail` falha no Windows** porque a URL do OAuth é cortada no `&` (#1246, de 07/11/2026).

### 3.10 Ativação por voz ou som

**Não existe.** Nem palavra de ativação, nem palmas, nem "sempre ouvindo". Há issues pedindo isso (#901, "native voice channel"; #664, modo de voz com Gemini Live, na nuvem).

---

## 4. O que o OpenJarvis já oferece

| Seu objetivo | OpenJarvis nativo | Avaliação honesta |
|---|---|---|
| 1. Ativação por palavra ou som | ❌ Não tem | Precisa ser construído do zero |
| 2. Conversa em pt-BR | ⚠️ STT e TTS funcionam em pt se configurados | Roteamento de complexidade e detector de *prompt injection* são **só em inglês** (issue #1076; conferi o código e o suporte a português não entrou). Persona padrão "britânica". |
| 3. Voz natural | ⚠️ Kokoro `pf_dora` (local, qualidade média) ou serviços pagos | Sem streaming e sem interrupção; bug de áudio no Windows (#1211) |
| 4. Memória contextual | ✅ Fatos + RAG + perfil | É o ponto mais forte, mas com bug de fatos desatualizados (#1189) |
| 5. Comandos no Windows | ⚠️ `shell_exec` genérico | **Sem lista de permitidos e com aprovação automática no app/servidor** (seção 6). Não há ferramentas Windows específicas (abrir app, notificação, lembrete). |
| 6. Internet | ✅ `web_search` (DuckDuckGo grátis), `browser` | O DuckDuckGo via biblioteca `ddgs` é não oficial e pode ser bloqueado por excesso de uso |
| 7. Rotina | ⚠️ Digest + Google Calendar/Tasks | Lembretes e agenda locais só para Apple |
| 8. Pesquisar e analisar arquivos | ✅ `file_read`, `pdf_tool`, RAG | Funciona; o índice semântico não persiste |
| 9. Novas ferramentas | ✅ MCP + skills + registro de plugins | Bom e padronizado |
| 10. Interface J.A.R.V.I.S. | ❌ Chat genérico | Precisa ser construída do zero |

**Resumo:** dos 10 objetivos, o OpenJarvis cobre bem 3 (memória, extensibilidade, arquivos), cobre mal 4 e não cobre 3. Os 3 que ele não cobre (ativação, interface, ações seguras no Windows) são justamente o "produto" que você quer.

---

## 5. O que aparece no vídeo e não existe nativamente

Com base no que você descreveu do vídeo (palmas, "bom dia", interface futurista, execução de tarefas).

| Funcionalidade | Precisa de | Dificuldade |
|---|---|---|
| Duas palmas | Detector de eventos sonoros (limiar + verificação por IA, ex.: YAMNet) | Média |
| "Olá, Jarvis" | Detector de palavra de ativação (openWakeWord com modelo treinado para "Jarvis") | Média (o treino é a parte chata) |
| Conversa mãos-livres | VAD neural (Silero), máquina de estados, encerramento por frase | Média |
| Interromper o Jarvis enquanto ele fala | Cancelamento de eco (AEC) ou fone de ouvido | **Alta** (seção 11) |
| Jingle | Tocar um arquivo | Trivial |
| Painel futurista | Interface própria (WebGL/Three.js) ligada aos estados do núcleo | Alta (é design + engenharia) |
| Pesquisa na internet "inteligente" | No exemplo analisado: Claude pago. Local: modelo + ferramenta de busca, com resultado pior | Média |
| Ações no computador | Ferramentas Windows + motor de permissões + confirmação | Alta (segurança) |
| "Bom dia" instantâneo | Pré-calcular o briefing em horário agendado | Média |

---

## 6. Riscos do OpenJarvis para o seu caso

Todos verificados no código ou na documentação oficial.

### 6.1 Segurança das ações (crítico para o seu requisito de confirmação)

Da própria documentação (`docs/user-guide/system-access.md`):

- *"`shell_exec` runs arbitrary commands as your user. There is no command allowlist, no denylist, and no sandbox unless you turn one on."*
- No **servidor HTTP e no app desktop**, ferramentas sensíveis são **aprovadas automaticamente**. Só o `jarvis chat` no terminal pede confirmação.
- A opção `security.enforce_tool_confirmation` **não faz nada**: o carregador aceita, mas nada a lê.
- O bloqueio de arquivos sensíveis (`.env`, `id_rsa`) vale só para `file_read`/`file_write` e olha só o nome do arquivo. `cat ~/.ssh/id_rsa` via `shell_exec` passa.

Isso **contraria frontalmente** o seu requisito: *"operações destrutivas, envio de mensagens e pagamentos devem exigir confirmação explícita"*.

**O risco piora com o briefing.** Um assistente que lê seus e-mails e tem acesso ao shell pode ser manipulado por um **e-mail malicioso** ("ignore as instruções anteriores e rode..."). O detector de *prompt injection* do OpenJarvis só reconhece padrões em inglês.

### 6.2 Privacidade e telemetria

- `posthog` (analytics) é **dependência obrigatória**, no backend e no frontend.
- É opt-in, mas o prompt do instalador diz *"Press Enter or Y to consent"*: **Enter = aceitar**. Quem aperta Enter no automático passa a enviar dados de uso.
- Existe um "leaderboard" que pede nome e e-mail em troca de sorteio de um Mac mini.
- A doc garante que conteúdo de chat não é enviado. Não auditei a fundo, mas a lista de eventos está em `analytics/events.py`.

### 6.3 Windows é cidadão de segunda classe

- A doc chama o Windows nativo de *"advanced"* e recomenda **WSL2**. Microfone e áudio dentro do WSL2 são uma dor de cabeça à parte.
- Issues abertas no Windows: sem áudio falado (#1211), OAuth do Gmail quebrado (#1246), `jarvis gui`/`jarvis start` nunca sobem o servidor com uv (#1062), alerta do Windows Defender durante a instalação (#1184), chaves de nuvem com aspas e erro de encoding (#1192).
- A instalação completa pede Python, uv, Git, Node e, para a extensão de memória, **Rust e Visual Studio Build Tools** (vários GB).

### 6.4 Excesso de escopo

O código inclui mineração da blockchain Pearl (requer GPU H100, opt-in, inativa por padrão), 32 canais de mensagem, benchmarks de energia, treino de modelos e comparação de frameworks. Nada disso serve para você. É superfície de ataque, peso de instalação e mais coisa para quebrar a cada atualização.

### 6.5 Dependência de um projeto Alpha em alta rotatividade

Centenas de commits por mês. Se você construir em cima e personalizar, cada atualização pode quebrar suas mudanças. O exemplo do guia já faz isso: clona o OpenJarvis e importa módulos internos (`openjarvis.cli._voice_chat`, com underline = API privada).

---

## 7. Seu notebook: diagnóstico e o que ele aguenta

### 7.1 Diagnóstico do seu notebook (dados de 11/11/2026)

| Item | Seu notebook | O que significa |
|---|---|---|
| Modelo | Lenovo IdeaPad Slim 3 15IRH10 | — |
| Processador | Intel Core i5-13420H: 8 núcleos (4 de desempenho + 4 de eficiência), 12 threads, até 4,6 GHz | Bom para notebook. É ele que vai rodar a IA. |
| RAM | 8 GB DDR5-4800 (7,67 GB utilizáveis) | **O gargalo principal.** Pela ficha da Lenovo, esses 8 GB são soldados na placa e existe **um slot livre** (a confirmar no seu aparelho). Com um módulo só, a memória roda em **canal único**, com metade da velocidade de leitura possível. A IA local depende muito dessa velocidade. |
| Placa de vídeo | Intel UHD Graphics, integrada (48 EUs; os "128 MB" são só a reserva de vídeo) | **Não ajuda na IA.** O Ollama ignora GPUs integradas por padrão, e nessa classe a CPU tende a ser mais rápida. |
| NPU | Não tem (a 13ª geração da Intel não tem) | — |
| Disco | 477 GB, com 252 GB livres | **Sobra espaço.** Precisamos de cerca de 30 GB. |
| Sistema | Windows 11, 64 bits, x64 | Compatível com tudo do plano |

**Veredito: é o perfil A da tabela 7.3, o mais fraco.**

**Orçamento de memória com 8 GB** (estimativas, a medir na Etapa 0):

| Peça | Memória |
|---|---|
| Windows 11 e programas em segundo plano | 3–4 GB |
| Modelo de 2B quantizado, contexto de 4k | ~2 GB |
| Whisper `base` ou `small` (int8) | 0,3–1 GB |
| Voz Piper | 0,1–0,2 GB |
| OpenJarvis (Python) e interface | 0,5–1 GB |
| **Total** | **6–8 GB: no limite.** Com o navegador aberto, o Windows passa a usar o disco como memória e tudo fica lento. |

**O que roda bem hoje:**
- ouvir a palavra "Jarvis" (openWakeWord), transcrever (Whisper `base`/`small`) e falar (Piper);
- conversa simples e resumos curtos com um modelo de 2B (`qwen3.5:2b`);
- briefing de "bom dia" **pré-calculado** antes de você acordar. Processar um prompt longo (e-mails, notícias, agenda) na CPU pode levar dezenas de segundos; feito com antecedência, isso não importa;
- comandos frequentes ("abra o Spotify", "que horas são", "crie um lembrete") reconhecidos **por regra**, sem depender da IA. É rápido, confiável e não erra de ferramenta.

**O que não roda bem hoje:**
- modelos de 4B ou maiores junto com voz e interface: a memória estoura;
- a voz Kokoro, padrão do OpenJarvis: puxa PyTorch e transformers (`uv.lock`), pesado demais para 8 GB. Por isso a voz será **Piper**;
- o `gemma4:e2b` padrão do Ollama (download de 7,2 GB), recomendado em alguns guias para "8 GB": não cabe;
- tarefas com várias etapas e ferramentas: um modelo de 2B erra muito;
- o contexto padrão do OpenJarvis (16 mil tokens): precisa cair para 4–8 mil.

### 7.1.1 Caminhos para melhorar

| Opção | Custo | O que você ganha |
|---|---|---|
| **A.** Ficar com 8 GB, tudo local | R$ 0 | Assistente básico: voz, comandos por regra, conversa simples, briefing pré-calculado |
| **B.** 8 GB + nuvem opcional (pergunta pendente da seção 14) | Poucos dólares por mês, só quando usar | Inteligência de verdade em pesquisa e tarefas complexas. O texto desses pedidos sai do PC. |
| **C.** Adicionar um módulo de 16 GB DDR5 SO-DIMM (total de 24 GB, o máximo testado pela Lenovo, em canal duplo) | Cerca de R$ 1.400 a R$ 2.650 em anúncios recentes. Memória está cara; confira antes de comprar. | Modelo de 4B com folga; 9B possível, mas lento; geração de texto até cerca de 2× mais rápida pelo canal duplo (estimativa) |
| **D.** C + B | Soma dos dois | O melhor possível neste notebook. Continua sem GPU, então nunca vai ser rápido como nos vídeos. |

**Recomendação:** não compre memória agora. Construa A + B, com a porta da nuvem pronta e **desligada**, e meça tudo na Etapa 0. Se a lentidão ou a burrice do modelo local incomodarem, o upgrade de RAM é a melhor compra possível para este notebook, mas só depois de medir.

**Para confirmar o slot livre (só leitura):** Gerenciador de Tarefas → Desempenho → Memória → "Slots usados". Se aparecer **1 de 2**, há um slot livre.

### 7.2 Comandos de diagnóstico (somente leitura, opcionais agora)

Abra o **PowerShell** (não precisa ser administrador) e cole o bloco abaixo. Ele **só lê** informações e não instala, altera ou envia nada. Depois cole o resultado aqui.

```powershell
"=== SISTEMA ==="
Get-CimInstance Win32_OperatingSystem | Select-Object Caption, Version, BuildNumber, OSArchitecture
"Arquitetura: $env:PROCESSOR_ARCHITECTURE"
"=== PROCESSADOR ==="
Get-CimInstance Win32_Processor | Select-Object Name, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed
"=== MEMORIA RAM ==="
$cs = Get-CimInstance Win32_ComputerSystem
"RAM total: {0:N1} GB" -f ($cs.TotalPhysicalMemory/1GB)
Get-CimInstance Win32_PhysicalMemory | Select-Object Capacity, Speed, Manufacturer
"=== GPU (nome e driver) ==="
Get-CimInstance Win32_VideoController | Select-Object Name, DriverVersion, VideoProcessor
"=== VRAM real (o campo AdapterRAM do Windows trava em 4 GB, por isso lemos o registro) ==="
Get-ItemProperty "HKLM:\SYSTEM\ControlSet001\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}\0*" -ErrorAction SilentlyContinue |
  Where-Object { $_."HardwareInformation.qwMemorySize" } |
  ForEach-Object { "{0}: {1:N1} GB" -f $_.DriverDesc, ($_."HardwareInformation.qwMemorySize"/1GB) }
"=== NVIDIA (se houver) ==="
if (Get-Command nvidia-smi -ErrorAction SilentlyContinue) { nvidia-smi --query-gpu=name,memory.total,driver_version --format=csv } else { "nvidia-smi nao encontrado" }
"=== DISCO ==="
Get-PSDrive -PSProvider FileSystem | Select-Object Name, @{n='Usado_GB';e={[math]::Round($_.Used/1GB,1)}}, @{n='Livre_GB';e={[math]::Round($_.Free/1GB,1)}}
Get-PhysicalDisk | Select-Object FriendlyName, MediaType, Size
"=== FERRAMENTAS JA INSTALADAS ==="
foreach ($c in 'python','py','node','npm','git','uv','ollama','cargo','winget') {
  $x = Get-Command $c -ErrorAction SilentlyContinue
  if ($x) { "{0}: {1}" -f $c, $x.Source } else { "{0}: nao instalado" -f $c }
}
"=== VERSOES (ignora o atalho falso da Microsoft Store) ==="
foreach ($c in 'python','py','node') {
  $x = Get-Command $c -ErrorAction SilentlyContinue
  if ($x -and $x.Source -notlike '*WindowsApps*') { "{0}: {1}" -f $c, (& $c --version 2>&1) }
}
if (Get-Command py -ErrorAction SilentlyContinue) { py -0 2>&1 }
"=== AUDIO (microfones e saidas) ==="
Get-PnpDevice -Class AudioEndpoint -Status OK -ErrorAction SilentlyContinue | Select-Object FriendlyName
"=== ENERGIA ==="
Get-CimInstance Win32_Battery -ErrorAction SilentlyContinue | Select-Object Name, EstimatedChargeRemaining
```

> Se preferir, o Claude Code instalado no seu notebook pode rodar esse mesmo bloco. São só consultas.

### 7.3 O que cada perfil de hardware permite

Estimativas baseadas em guias de terceiros; os números variam por quantização e contexto. **Vamos medir na Etapa 0** antes de decidir.

| Perfil do notebook | Cérebro local viável | Voz local | Veredito |
|---|---|---|---|
| **A.** 8 GB RAM, sem GPU dedicada | `qwen3.5:2b` ou `gemma4:e2b`, lentos e limitados | Whisper `base`/`small` + Piper ou Kokoro na CPU: ok | **Híbrido obrigatório** para agir e pesquisar. Local só para voz e conversa simples. |
| **B.** 16 GB RAM, GPU integrada (Intel Iris/Arc, Radeon) | `qwen3.5:4b` ou `gemma4:e4b` na CPU/iGPU. Um teste com iGPU Intel Xe relata ~8–13 tokens/s em modelos de 2–3B e dificuldade com 9B. | ok | Funciona, mas a resposta vai demorar alguns segundos. Ferramentas complexas falham mais. Híbrido recomendado. |
| **C.** 16 GB RAM + NVIDIA 6–8 GB VRAM (RTX 3050/4050/4060) | `qwen3.5:9b` ou `gemma4:e4b` na GPU | Whisper `small`/`medium` na GPU | **Bom.** Dá para ser local por padrão. |
| **D.** 32 GB RAM + 12 GB VRAM ou mais | Modelos de 14B–27B (quantizados) | Whisper `large-v3-turbo` | Excelente, perto das demonstrações em inteligência |

**Orçamento de memória típico** (perfil B, 16 GB): Windows e apps ~5 GB; modelo 4B quantizado com 8k de contexto ~4–5 GB; Whisper `small` int8 ~1 GB; Kokoro ~0,5–1 GB; interface ~0,3 GB. Sobram ~4 GB. Cabe, mas com o navegador cheio de abas começa a trocar memória com o disco.

**Disco:** reserve **30 GB livres**. Modelos do Ollama ocupam 3–10 GB cada (e você vai querer testar mais de um), modelos de voz 0,5–3 GB, mais Python, ferramentas e cache. O exemplo do guia pede 15 GB, e isso só para o mínimo.

---

## 8. Arquitetura recomendada

### 8.1 Princípios

1. **Local por padrão, nuvem só por exceção explícita.** Nada sai do computador sem uma regra que você escreveu.
2. **Windows e pt-BR primeiro.** Não adaptar depois.
3. **O modelo nunca executa nada diretamente.** Ele *propõe* uma ação; um motor de permissões decide; você confirma quando necessário.
4. **Conteúdo externo é "não confiável".** E-mail e página web podem ler, mas não podem disparar ações sozinhos.
5. **Peças trocáveis.** Cada parte (modelo, STT, TTS, ativação) atrás de uma interface simples, sem amarrar a um fornecedor.
6. **Pequeno e entendível.** Você precisa conseguir manter isso.

### 8.2 Visão geral

```
┌─────────────────────────── NOTEBOOK (Windows 11) ───────────────────────────┐
│                                                                             │
│  ┌──────────────── INTERFACE (Vite + React + Three.js) ─────────────────┐   │
│  │ esfera · ondas · painéis · notificações · confirmações · memória     │   │
│  │ Fase 1: navegador em modo app  →  Fase final: Tauri (bandeja/atalho) │   │
│  └───────────────────────────────▲───────────────────────────────────────┘   │
│                       WebSocket  │ eventos de estado + nível de áudio        │
│  ┌───────────────────────────────┴──── NÚCLEO (Python, FastAPI) ─────────┐   │
│  │                                                                       │   │
│  │  ÁUDIO ─────────────────────────────────────────────────────────────  │   │
│  │  microfone → buffer → [palavra de ativação | palmas | atalho] →       │   │
│  │  VAD (fim da fala) → STT  ·······  TTS por frase → alto-falante       │   │
│  │                                                                       │   │
│  │  ORQUESTRADOR (máquina de estados: repouso → aguardando → ouvindo →   │   │
│  │  processando → respondendo → executando → notificando)                │   │
│  │        │                    │                      │                  │   │
│  │        ▼                    ▼                      ▼                  │   │
│  │  CÉREBRO              FERRAMENTAS             MEMÓRIA                 │   │
│  │  roteador de          registro + MOTOR DE     SQLite: conversas,      │   │
│  │  provedores           PERMISSÕES (nível de    fatos aprovados,        │   │
│  │  (OpenAI-compatível)  risco, lista de         preferências;           │   │
│  │        │              permitidos, confirma-   índice de arquivos      │   │
│  │        │              ção, auditoria)         (texto + vetores)       │   │
│  │        │                    │                                         │   │
│  │        │              CONECTORES: clima · notícias (RSS) · Google     │   │
│  │        │              Agenda/Gmail (somente leitura) · busca web      │   │
│  │        │              AGENDADOR: briefing pré-calculado às 6h30       │   │
│  │        │              COFRE: tokens no Gerenciador de Credenciais     │   │
│  └────────┼──────────────────────────────────────────────────────────────┘   │
│           ▼                                                                 │
│  ┌──────────────────┐                                                       │
│  │ Ollama (local)   │                                                       │
│  └──────────────────┘                                                       │
└───────────┬─────────────────────────────────────────────────────────────────┘
            │ somente se você permitir (opcional, por tipo de pedido)
            ▼
   API de nuvem (Claude / outra) · Google APIs · Open-Meteo · RSS
```

### 8.3 Fluxo de uma interação

1. **Repouso:** o microfone alimenta só o detector de ativação (baixo consumo de CPU). Nada é transcrito nem gravado.
2. **Ativação:** "Jarvis" (openWakeWord) **ou** duas palmas (detector + verificação) **ou** atalho de teclado → toca o som de ativação → estado *ouvindo*.
3. **Ouvindo:** o Silero VAD detecta o fim da fala → o áudio vai para o faster-whisper (idioma fixo `pt`).
4. **Processando:** o orquestrador monta o contexto (histórico curto + fatos relevantes da memória) e chama o cérebro em *streaming*.
5. **Respondendo:** a cada frase completa, o TTS sintetiza e toca. Você ouve a primeira frase antes de o modelo terminar de pensar.
6. **Executando:** se o modelo pedir uma ferramenta, o motor de permissões classifica:
   - **leitura** (clima, agenda, buscar arquivo) → executa;
   - **escrita** (criar lembrete, mover arquivo) → pede confirmação por voz ou clique;
   - **sensível** (apagar, enviar e-mail, pagar, rodar comando) → confirmação **dupla e explícita**, com a ação exata na tela;
   - **fora da lista** → recusa e registra.
7. **Notificando:** lembretes e alertas viram notificação do Windows e cartão na interface.

### 8.4 Defesa contra prompt injection (o ponto que as demonstrações ignoram)

Quando o contexto contém conteúdo externo (e-mail, página, notícia), o orquestrador **desliga as ferramentas de escrita e as sensíveis** naquele turno. O modelo pode resumir o e-mail, mas não pode agir com base nele sem um novo pedido seu. É uma regra simples, no código e não no prompt, e fecha a maior brecha desse tipo de assistente.

### 8.5 Estrutura de pastas proposta (repositório `JARVIS`)

```
JARVIS/
├── README.md
├── docs/
│   ├── ESTUDO-TECNICO-OPENJARVIS.md      ← este documento
│   ├── arquitetura.md
│   └── decisoes/                          ← registros de decisão (ADR), um por escolha
├── core/                                  ← núcleo Python (uv)
│   ├── pyproject.toml
│   ├── src/jarvis/
│   │   ├── app.py                         ← FastAPI + WebSocket
│   │   ├── estado.py                      ← máquina de estados e barramento de eventos
│   │   ├── config.py
│   │   ├── audio/      captura.py  ativacao.py  palmas.py  vad.py  stt.py  tts.py  reproducao.py
│   │   ├── cerebro/    roteador.py  provedores/{ollama,anthropic,openai_compat}.py  prompts/
│   │   ├── ferramentas/ registro.py  permissoes.py  apps_windows.py  arquivos.py  lembretes.py  busca_web.py
│   │   ├── conectores/ google_auth.py  gmail.py  agenda.py  clima.py  noticias.py
│   │   ├── memoria/    banco.py  fatos.py  indice_arquivos.py
│   │   ├── briefing/   coleta.py  redacao.py  agendador.py
│   │   └── seguranca/  cofre.py  auditoria.py  conteudo_nao_confiavel.py
│   └── tests/
├── ui/                                    ← Vite + React + TypeScript + Three.js
│   ├── src/  (cena/esfera, paineis/, estados/, ws/)
│   └── src-tauri/                         ← só na etapa final
├── config/
│   ├── jarvis.example.toml
│   └── permissoes.example.toml            ← lista de apps, pastas e comandos permitidos
├── modelos/                               ← (ignorado no git) palavra de ativação, vozes
└── scripts/                               ← diagnóstico (só leitura) e instalação
```

O repositório **Sexta-Feira** atual é um site imobiliário (Astro) sem relação com este projeto e fica fora dele (decisão de 11/11/2026).

### 8.6 Ajuste: OpenJarvis como base (decisão de 11/11/2026)

As seções 8.1 a 8.5 continuam valendo como princípios e fluxo. A diferença é **quem faz cada parte**:

```
┌──────────── NOSSA CAMADA (repositório JARVIS) ────────────┐   ┌──── OPENJARVIS (versão travada, sem modificar) ────┐
│ Ouvidos: openWakeWord ("Jarvis"), Silero VAD, Whisper      │   │ Cérebro: classe pública `Jarvis` (sdk.py) → Ollama │
│ Boca: Piper, frase a frase                                 │   │ Memória: fatos do usuário + documentos (SQLite)    │
│ Comandos por regra (abrir app, hora, lembrete, bom dia)    │──►│ Conectores: Google Agenda, Gmail, RSS              │
│ Motor de permissões + ferramentas Windows                  │   │ Briefing: agente morning_digest + agendador        │
│ Interface (React + Three.js) via WebSocket                 │   │ MCP e skills (novas ferramentas)                   │
│ Clima (Open-Meteo), roteador local/nuvem (nuvem desligada) │   │ Motores de nuvem (só se a nuvem for ligada)        │
└────────────────────────────────────────────────────────────┘   └────────────────────────────────────────────────────┘
```

**Como os dois se conectam:**

- **Um único processo Python.** Nossa camada importa o OpenJarvis como biblioteca e usa só a classe pública `Jarvis`. Nada de módulos internos com `_` no nome, como faz o exemplo da seção 2. Com 8 GB de RAM, um processo a menos faz diferença. Se a integração ficar instável, a alternativa é falar com o `jarvis serve` por HTTP.
- **Versão travada no `pyproject.toml`**, apontando para um commit específico do GitHub. Nenhuma cópia do código do OpenJarvis dentro do nosso repositório.
- **Extras mínimos.** Sem `voice` (Kokoro/PyTorch), sem `desktop`, sem `mining`. A lista final sai da Etapa 0.

**Como cada pedido é tratado:**

1. **Comando conhecido** ("abra o Spotify", "que horas são", "bom dia, Jarvis") → reconhecido por regra → motor de permissões → executa. Sem IA, rápido e previsível.
2. **Conversa** → `Jarvis.ask_stream()` → Piper fala frase a frase. É o caminho rápido, mas sem ferramentas e sem histórico (limitação do SDK, seção 14.1). O histórico curto da conversa será montado pela nossa camada.
3. **Pedido que precisa de ferramenta** → `Jarvis.ask()` com um agente que só enxerga **as nossas** ferramentas seguras. É mais lento, porque espera a resposta inteira.
4. **Pedido complexo com a nuvem ligada** → mesmo caminho, com um motor de nuvem, dentro do teto de gasto.

**Estrutura de pastas ajustada:**

```
JARVIS/
├── docs/                 estudo, arquitetura, decisões
├── core/                 nossa camada (Python 3.12, uv)
│   ├── pyproject.toml    depende do OpenJarvis travado num commit
│   └── src/jarvis/
│       ├── app.py        FastAPI + WebSocket para a interface
│       ├── estado.py     máquina de estados (os 7 estados da interface)
│       ├── audio/        ativacao.py · vad.py · stt.py · tts_piper.py · reproducao.py
│       ├── comandos/     intencoes.py (comandos por regra)
│       ├── cerebro/      ponte_openjarvis.py · roteador.py (local x nuvem)
│       ├── ferramentas/  permissoes.py · apps_windows.py · arquivos.py · lembretes.py
│       ├── clima/        open_meteo.py
│       └── seguranca/    cofre.py · auditoria.py · conteudo_nao_confiavel.py
├── ui/                   Vite + React + TypeScript + Three.js
├── config/               jarvis.example.toml · permissoes.example.toml · openjarvis.example.toml
└── modelos/              (fora do git) palavra "Jarvis", voz Piper
```

---

## 9. Tecnologias escolhidas e por quê

| Camada | Escolha | Por quê | Alternativa | Licença |
|---|---|---|---|---|
| Linguagem do núcleo | **Python 3.12** | Todo o ecossistema de voz e IA local é Python. O próprio README do seu repositório diz "IA em Python". 3.12 tem rodas (wheels) prontas no Windows para tudo que vamos usar; o 3.14 não. | — | — |
| Gerenciador | **uv** | Rápido, cria ambiente isolado, não suja o Python do sistema | pip + venv | MIT/Apache |
| Servidor local | **FastAPI + WebSocket** | Padrão comprovado (o exemplo do guia e o OpenJarvis usam) | — | MIT |
| Motor de IA local | **Ollama** | Instalador Windows, suporte a NVIDIA, AMD e (desde a 0.30, segundo terceiros) Vulkan; expõe API compatível com OpenAI | LM Studio, llama.cpp server | MIT |
| Modelo local | **`qwen3.5:2b`** no notebook atual (8 GB). `qwen3.5:4b` ou `gemma4:e4b` só com mais RAM. Decidir por teste em pt-BR. | É o que cabe junto com voz e interface; escolha por medição, não por fama | — | verificar a licença de cada um na Etapa 0 |
| Fala → texto | **faster-whisper** (`small` ou `medium`, int8, `language="pt"`) | Melhor custo-benefício local em português; já testado no Windows pelo OpenJarvis | whisper.cpp | MIT |
| Fim da fala (VAD) | **Silero VAD** | Neural, leve, muito melhor que limiar de volume | WebRTC VAD | MIT |
| Palavra de ativação | **openWakeWord** com modelo treinado para "Jarvis" | Local, grátis, roda em CPU. O **Porcupine** (Picovoice) **encerrou o plano gratuito em 30/06/2026**, segundo relatos de usuários; o plano pago "Foundation" custa ~US$ 6 mil/ano, segundo terceiros. | Whisper contínuo (como no exemplo analisado): gasta CPU e transcreve tudo que você fala | código Apache 2.0; verificar a licença dos modelos pré-treinados |
| Palmas | Detector de "ataque" sonoro + verificação com **YAMNet** (classe "Clapping") só nos candidatos | Corta os falsos positivos do limiar simples sem gastar CPU o tempo todo | Só limiar (como no exemplo analisado) | Apache 2.0 |
| Texto → fala | **Piper** (`pt_BR-faber`, `jeff`) no notebook atual. Kokoro (`pf_dora`) só com mais RAM, porque no OpenJarvis ele puxa PyTorch e transformers. Teste de audição na Etapa 0. | Os dois rodam em CPU; nenhum soa humano em pt-BR. O OpenJarvis não suporta Piper, então a voz fica na nossa camada. Qwen3-TTS (clonagem de voz, pt-BR) é promissor, mas prefere GPU. | ElevenLabs (pago, muito mais natural) | Kokoro Apache 2.0; Piper: verificar (o repositório mudou de mantenedor) |
| Memória | **SQLite** (FTS5 + `sqlite-vec`) | Um arquivo, zero servidor, persistente, fácil de fazer backup e de apagar | LanceDB | domínio público / MIT |
| Embeddings | modelo multilíngue via Ollama (ex.: `bge-m3`) | Busca semântica em português | — | verificar |
| Ferramentas externas | **MCP** (Model Context Protocol) | Padrão aberto; dá para plugar servidores prontos sem reescrever | Plugins próprios | — |
| Interface | **Vite + React + TypeScript + Three.js** | Esfera com shader, ondas e painéis animados com qualidade de produto; seu Node 24 serve | Svelte | MIT |
| App desktop | **Tauri 2** (na etapa final) | Muito mais leve que Electron, usa o WebView2 que já vem no Windows 11. Custo: exige Rust + Build Tools para compilar. | Electron (mais pesado, mais simples) | MIT/Apache |
| Clima | **Open-Meteo** | Sem chave, grátis para uso não comercial (limite 10 mil chamadas/dia) | OpenWeatherMap (exige chave) | CC BY 4.0 (dados) |
| Notícias | **RSS** de fontes escolhidas por você | Grátis, sem chave, você controla as fontes | NewsAPI (limitado) | — |
| Agenda e e-mail | **Google Calendar API + Gmail API**, escopos **somente leitura** | Grátis; OAuth de app desktop | IMAP | — |
| Segredos | **Gerenciador de Credenciais do Windows** (biblioteca `keyring`) | Tokens fora de arquivos de texto | arquivo `.env` (pior) | MIT |
| Agendador | **APScheduler** | Briefing pré-calculado, lembretes | Agendador de Tarefas do Windows | MIT |
| Nuvem (opcional) | **Roteador neutro**: Claude, Gemini, OpenAI ou outro, atrás da mesma interface | Atende "não depender de um fornecedor" | — | pago |

---

## 10. Custos reais

### 10.1 O que é gratuito de verdade

| Item | Condição |
|---|---|
| Ollama, faster-whisper, Silero, openWakeWord, Kokoro, Piper, SQLite, FastAPI, React, Three.js, Tauri | Código aberto, sem custo |
| Modelos locais (Qwen, Gemma) | Download grátis; licenças a confirmar |
| Open-Meteo | Grátis para uso pessoal e não comercial, sem chave |
| RSS | Grátis |
| Gmail API e Google Calendar API | Grátis dentro das cotas. Exige um projeto no Google Cloud (sem cartão para isso). **Pegadinha:** com o app em modo "Testing", o token de acesso **expira a cada 7 dias** e você precisa reautorizar. Publicar o app evita isso, mas escopos do Gmail podem exigir verificação do Google (vou confirmar na etapa de integração). |
| Busca web via DuckDuckGo (`ddgs`) | Grátis, mas é acesso não oficial: pode ser limitado ou parar de funcionar |
| Treino da palavra de ativação | Grátis (Google Colab ou no próprio PC, se tiver GPU) |

### 10.2 O que exige assinatura ou pagamento (todos opcionais)

| Item | Preço | Quando faz sentido |
|---|---|---|
| **Claude API** (Anthropic), preços por milhão de tokens (entrada / saída) | Haiku 5.5: US$ 0,10 / 0,50 · Sonnet 5.5: US$ 2 / 10 · Opus 5.5: US$ 4 / 20 | Pesquisas e tarefas complexas, se o modelo local não der conta |
| Busca web da Anthropic | US$ 10 por 1.000 buscas, mais os tokens das páginas lidas | Pesquisa de qualidade |
| **Gemini API**, plano grátis | US$ 0, **mas o Google usa seus dados para melhorar produtos e humanos podem lê-los** (termos de 23/03/2026) | **Não recomendo** para dados pessoais |
| ElevenLabs (voz) | Planos pagos; não verifiquei os preços atuais | Se a voz local não te satisfizer |
| Picovoice Porcupine | Sem plano grátis desde 30/06/2026 (relatos); pago ~US$ 6 mil/ano (terceiros) | Não faz sentido para uso pessoal |
| Claude Code | Sua assinatura atual | Custo de **desenvolver**, não de rodar o assistente |

### 10.3 Simulação mensal do modo híbrido (estimativa)

Premissas: 30 pedidos/dia que vão para a nuvem, ~3 mil tokens de entrada e ~500 de saída cada (900 pedidos/mês, 2,7 milhões de tokens de entrada e 0,45 milhão de saída).

| Modelo de nuvem | Tokens | + 10 buscas/dia | Total/mês |
|---|---|---|---|
| Haiku 5.5 | ~US$ 0,50 | US$ 3 | **~US$ 3,50** |
| Sonnet 5.5 | ~US$ 10 | US$ 3 | **~US$ 13** |
| Opus 5.5 (o que o exemplo analisado usa) | ~US$ 20 | US$ 3 | **~US$ 23** |

**Ressalva honesta:** buscas e agentes leem páginas e resultados de ferramentas, o que pode multiplicar os tokens de entrada por 3 a 5 vezes. Trate esses números como **piso**, não teto. Some IOF e a cotação do dólar no cartão. A boa notícia: no desenho proposto, a nuvem é **desligada por padrão**, e dá para colocar um teto de gasto mensal no painel da Anthropic.

### 10.4 O que depende de hardware

Tudo que é local. Se o notebook for perfil A ou B (seção 7.3), o custo "zero" é pago em **tempo de espera, bateria e calor**, não em dinheiro.

---

## 11. Limitações técnicas (o que não vai ficar igual ao filme)

1. **Inteligência.** Um modelo de 4B–9B num notebook é bem inferior aos modelos de nuvem em raciocínio e, principalmente, em **usar ferramentas corretamente**. "Execute tarefas" é onde o modelo pequeno mais erra (escolhe a ferramenta errada, inventa parâmetros). Mitigação: ferramentas simples e bem descritas, validação rígida dos parâmetros e nuvem opcional para tarefas complexas.
2. **Latência.** A cadeia ouvir → transcrever → pensar → falar soma alguns segundos num notebook. Com streaming por frase dá para começar a falar antes de terminar de pensar, mas **não espere a resposta instantânea do filme**. Mediremos na Etapa 0.
3. **Voz natural em pt-BR local.** É o elo mais fraco. Kokoro e Piper são "bons para máquina", não humanos. Voz realmente natural hoje, em pt-BR, é paga e na nuvem.
4. **Interromper o Jarvis enquanto ele fala** (*barge-in*). Com alto-falante e microfone do próprio notebook, o assistente **ouve a si mesmo**. Exige cancelamento de eco, que não é confiável em todo hardware. Solução prática: **fone de ouvido** ou interromper por atalho ou pela palavra de ativação.
5. **Palmas.** Mesmo com verificação por IA, palmas vão ter falsos positivos e negativos. Recomendo a palavra de ativação como principal e palmas como "modo show", opcional.
6. **Microfone sempre ligado.** Consome bateria e CPU. Com openWakeWord o custo é baixo, mas não é zero. No exemplo analisado, a abordagem "Whisper ouvindo tudo" é bem mais pesada.
7. **Modelo residente na memória.** Para responder rápido, o modelo fica carregado (o exemplo do guia força isso a cada 4 minutos). São vários GB de RAM/VRAM ocupados o tempo todo. Precisaremos de um modo econômico.
8. **Gmail e Google.** O token de 7 dias em modo teste e a possível exigência de verificação para escopos do Gmail são burocracia real do Google, não do projeto.
9. **Antivírus e SmartScreen.** Executáveis não assinados (inclusive um app Tauri nosso) geram alertas. O próprio OpenJarvis tem issue de alerta do Defender.
10. **Interface premium custa caro em tempo.** Esfera com shader e animação fluida é fácil de prototipar e difícil de deixar polida, leve e sem gastar GPU à toa num notebook.

---

## 12. Plano de implementação por etapas

Cada etapa termina com algo **funcionando e testável**, e só passamos para a próxima com a sua aprovação. Esforço relativo: P (pequeno), M (médio), G (grande). Não dou prazo em dias porque depende do seu tempo disponível.

| # | Etapa | Entrega | Critério de pronto | Esforço |
|---|---|---|---|---|
| **0** | **Prova de viabilidade no seu notebook** | Hardware já conhecido (seção 7.1). Com sua aprovação: instalar o Ollama e o OpenJarvis (versão travada, telemetria desligada, extras mínimos). Testar `qwen3.5:2b` e `qwen3.5:4b` com um roteiro fixo de 10 perguntas em pt-BR (conversa, resumo de e-mail, escolha de ferramenta em JSON), medindo velocidade, RAM e uso do disco como memória. Testar Whisper `base` e `small` com 10 frases gravadas por você. Teste de audição Piper vs. Kokoro. Confirmar se `jarvis serve` e o SDK funcionam no Windows. | Planilha com tokens/s, uso de RAM, acertos e latência. **Decisões:** modelo, voz, nuvem opcional, upgrade de RAM. | P |
| **1** | **Núcleo de voz (aperte para falar)** | Atalho → ouvir → transcrever → modelo local em streaming → falar frase a frase. Interface mínima no navegador. | Conversa de 5 turnos em pt-BR, com histórico, sem travar. Latência medida e registrada. | M |
| **2** | **Ativação** | Palavra "Jarvis" (openWakeWord treinado) + palmas com verificação (opcional) + atalho de reserva. Encerramento por frase ("obrigado, Jarvis") ou silêncio. | Menos de 1 falso acionamento por hora com TV ou música ligada; mais de 90% de acerto quando você chama. | M |
| **3** | **Interface J.A.R.V.I.S. v1** | Esfera animada (Three.js), ondas reagindo ao microfone e à voz, os 7 estados visuais, painel de conversa, modo de baixo consumo. | Os 7 estados aparecem corretos ao vivo; uso de GPU em repouso medido e aceitável. | G |
| **4** | **Memória** | Histórico da conversa + fatos que **você aprova** ("lembre que...") + tela "o que você sabe sobre mim", com editar e apagar. | Ele lembra uma preferência depois de reiniciar; "esqueça isso" apaga de verdade. | M |
| **5** | **Ferramentas seguras no Windows** | Motor de permissões (níveis de risco, lista de apps e pastas permitidas, confirmação, log de auditoria). Comandos frequentes reconhecidos por regra, sem IA. Abrir apps da lista, buscar arquivos, lembretes com notificação do Windows. | Nenhuma ação de escrita sem confirmação; ação fora da lista é recusada; teste de "e-mail malicioso" não dispara nada. | G |
| **6** | **Integrações** | Clima (Open-Meteo), notícias (RSS que você escolher), Google Agenda e Gmail **somente leitura**, busca web. Tokens no cofre do Windows. | Cada integração funciona sozinha e falha de forma graciosa (sem internet, token expirado). | M |
| **7** | **Briefing "Bom dia, Jarvis"** | Coleta agendada às 6h30, redação em pt-BR, cartões visuais (clima, agenda, e-mails prioritários, notícias, pendências) e narração. | "Bom dia, Jarvis" começa a responder em segundos, porque já está pronto. Nada inventado: todo item com origem. | M |
| **8** | **Análise de arquivos** | Indexar pastas que você escolher (PDF, DOCX, TXT); perguntas com citação do arquivo e trecho. | Respostas com fonte; pasta fora da lista não é lida. | M |
| **9** | **Extensibilidade** | Cliente MCP + formato simples de "habilidade" (manifesto + permissões declaradas). | Adicionar uma ferramenta nova sem mexer no núcleo. | M |
| **10** | **Produto** | App Tauri, ícone na bandeja, iniciar com o Windows, interrupção (com fone), nuvem opcional com teto de gasto, instalador. | Instala e roda num Windows limpo seguindo o README. | G |

**Sugestão de corte para chegar mais rápido a algo útil:** Etapas 0 → 1 → 3 (versão simples) → 2 → 7. Isso entrega o "efeito vídeo" (ativação + interface + bom dia) cedo. Ferramentas que mexem no computador (Etapa 5) vêm depois, com calma, porque é onde mora o risco.

---

## 13. Seus pontos cegos

Você pediu um parceiro crítico, então aqui vai sem rodeio:

1. **Vídeos de demonstração costumam esconder custo e fragilidade.** No exemplo real que analisei, o "uau" vinha de uma API paga e de scripts de demonstração. Se o objetivo é "local, grátis e privado", o resultado vai ser **menos impressionante** que uma demonstração assim, a menos que seu notebook tenha uma boa GPU NVIDIA.
2. **"Custo zero" e "qualidade de produto premium" competem entre si.** Você pode ter os dois só aceitando mais tempo de desenvolvimento e respostas mais lentas e simples. Decida qual vem primeiro.
3. **Você pediu tudo ao mesmo tempo** (voz, memória, Gmail, agenda, notícias, automação, RAG, plugins, interface premium). É projeto de meses. O maior risco não é técnico: é abandonar no meio por excesso de escopo. Por isso o plano entrega valor por etapas.
4. **Um assistente que lê e-mail e executa comandos é um alvo.** Quase todos os projetos "Jarvis" caseiros ignoram isso. Se pularmos o motor de permissões, um e-mail bem escrito pode mandar seu assistente apagar arquivos.
5. **Voz natural em português, local, ainda não existe com qualidade humana.** Se isso for inegociável, você vai pagar uma API de voz e mandar texto para fora.
6. **Notebook não é servidor.** Microfone sempre ligado, modelo carregado e animação 3D contínua custam bateria, calor e ruído de ventoinha.
7. **"Interromper e retomar conversas"** depende de hardware de áudio (fone) mais do que de software.
8. **O Claude Code não substitui entender o sistema.** O exemplo do guia funciona, mas o dono provavelmente não sabe que o próprio documento de LGPD está errado. Se você não entender o que está rodando no seu PC, não vai conseguir confiar nele para agir por você.

---

## 14. Decisões

### 14.1 Já tomadas (11/11/2026)

| Decisão | Escolha |
|---|---|
| Base do projeto | **OpenJarvis como base**, com as condições abaixo |
| Ativação | **Palavra "Jarvis"** |
| Repositório | **`JARVIS`**, separado do `Sexta-Feira` |
| Vídeo | Só referência visual e de ideias. O projeto não segue nem depende de nenhum guia de terceiros. |

**Condições para usar o OpenJarvis como base:**

1. **Sem mexer no código dele e com versão travada** (commit fixo). Atualização só depois de testar.
2. **Ferramentas de ação do OpenJarvis desligadas** (`shell_exec`, `file_write`, `apply_patch`, `code_interpreter`). Ações no computador passam só pelas nossas ferramentas, com o motor de permissões e confirmação.
3. **Telemetria desligada explicitamente** na instalação (`--no-analytics`).
4. **Português configurado desde o início:** `speech.language = "pt"`, Whisper `small` ou maior, voz `pf_dora`.
5. **Desviar dos bugs abertos no Windows:** áudio próprio no lugar do dele (#1211); servidor via `jarvis serve`, que não aparece no bug #1062 (confirmar na Etapa 0); login do Google contornado ou por conector próprio (#1246).
6. **Ponto de atenção no desenho:** no SDK, `ask_stream()` vai direto ao modelo, **sem ferramentas e sem histórico** (`src/openjarvis/sdk.py`); só `ask()` passa pelos agentes e ferramentas, e espera a resposta inteira. Conversa pode ser rápida; ações serão mais lentas. Validar na Etapa 1.

### 14.2 Pendentes

1. **Nuvem:** pode existir um modo híbrido **opcional, desligado por padrão** e com teto de gasto? Ou o projeto é **estritamente** local? Com 8 GB de RAM e sem GPU, a recomendação de deixar essa porta pronta ficou mais forte (seção 7.1.1).
2. **Upgrade de RAM:** recomendação é **não comprar agora** e decidir depois das medições da Etapa 0.
3. **Slot livre:** confirmar no Gerenciador de Tarefas (seção 7.1.1).
4. **Aprovação do plano** (seção 12) para começar a Etapa 0. Nada será instalado antes disso.

---

## 15. Fontes

**Código e documentação lidos diretamente**
- OpenJarvis, código-fonte (commit `6201505`): https://github.com/open-jarvis/OpenJarvis
  - voz: `src/openjarvis/speech/voice_io.py`, `faster_whisper.py`, `kokoro_tts.py`, `_tts_discovery.py`; `src/openjarvis/cli/_voice_chat.py`
  - motor e modelos: `src/openjarvis/engine/ollama.py`; `src/openjarvis/core/config.py` (`recommend_model`, `SpeechConfig`)
  - memória: `src/openjarvis/memory/service.py`, `extractor.py`
  - interface: `frontend/src/hooks/useSpeech.ts`, `frontend/src-tauri/src/lib.rs`
  - documentação: `docs/user-guide/system-access.md`, `memory.md`, `morning-digest.md`, `mining.md`, `docs/telemetry.md`, `docs/getting-started/windows-native.md`
- Projeto de terceiros sobre o OpenJarvis, usado só como exemplo de implementação: https://github.com/enricomed/Jarvis- (`scripts/jarvis_show.py`, `scripts/nuvem.py`, `scripts/instalar_windows.bat`, `docs/SEGURANCA-LGPD.md`)
- Issues do OpenJarvis citadas: #1211, #1246, #1062, #1184, #1192, #1038, #1076, #1189, #901, #664

**Pesquisa na web**
- Blog do Ollama sobre o OpenJarvis (28/05/2026): https://registry.ollama.ai/blog/openjarvis
- Projeto OpenJarvis (Stanford): https://scalingintelligence.stanford.edu/blogs/openjarvis/
- Jarvis Clap (palmas com YAMNet, macOS): https://www.tabnews.com.br/devjoaolopes/jarvis-clap-abre-apps-com-dois-palmas
- Qwen 3.5, requisitos: https://unsloth.ai/docs/models/qwen3.5.md · https://insiderllm.com/guides/qwen-3-5-small-models-9b-beats-30b/
- Gemma 4, requisitos: https://unsloth.ai/docs/models/gemma-4 · https://dev.to/mrviduus/i-put-ollama-on-a-4-gb-mobile-gpu-and-got-25-heres-the-vram-math-3mhk
- Ollama no Windows e GPUs: https://docs.ollama.com/windows · https://docs.ollama.com/gpu · https://insiderllm.com/guides/intel-arc-local-ai/
- openWakeWord e treino: https://github.com/dscripka/openWakeWord/blob/main/docs/custom_verifier_models.md · https://community.home-assistant.io/t/colab-notebooks-to-train-your-custom-openwakeword-or-microwakeword/1026635 · https://pequi-mecanico-home.github.io/pdf/paper_wakeword.pdf
- Fim do plano grátis do Picovoice: https://community.home-assistant.io/t/fyi-picovoice-confirmed-free-tier-accesskeys-will-stop-working-after-june-30-2026/1012744 · https://news.ycombinator.com/item?id=48248969 · https://www.activepieces.com/blog/picovoice-pricing-2026-free-foundation-enterprise
- Vozes Kokoro pt-BR: https://offlinetts.com/voice/pf-dora/ · https://offlinetts.com/voice/pm-alex/
- Piper pt-BR: https://huggingface.co/rhasspy/piper-voices/blob/refs%2Fpr%2F11/pt/pt_BR/faber/medium/MODEL_CARD
- TTS local em 2026: https://localaimaster.com/blog/best-local-tts-models · https://github.com/saitodisse/voz-local
- Open-Meteo, termos: https://open-meteo.com/en/terms
- Token OAuth do Google com expiração em 7 dias: https://www.unipile.com/google-oauth-refresh-token/ · https://groups.google.com/g/adwords-api/c/vdrb2QMWXHQ
- Gemini API, uso de dados no plano grátis: https://ai.google.dev/gemini-api/terms · https://ai.google.dev/gemini-api/docs/logs-policy
- Preços da Claude API: documentação oficial da Anthropic (tabela de modelos, 11/2026)
- Seu notebook, memória e expansão: https://psref.lenovo.com/Product/IdeaPad/IdeaPad_Slim_3_15IRH10 · https://www.kingston.com/en/memory/search/model/110300/lenovo-ideapad-slim-3-15irh10 · https://www.mrmemory.co.uk/memory-ram-upgrades/lenovo/ideapad/slim-3-15irh10
- Processador i5-13420H: https://www.intel.com/content/www/us/en/products/sku/232173.html · https://techpowerup.com/cpu-specs/core-i5-13420h.c3058
- Preços de memória DDR5 SO-DIMM 16 GB no Brasil (anúncios sem data confiável): https://www.buscape.com.br/busca/16gb+ddr5-5600+sodimm · https://lista.mercadolivre.com.br/memoria-ram-notebook-ddr5-16gb-5600 · https://www.pichau.com.br/memoria-para-notebook-corsair-sodimm-ddr5-16gb-1x16gb-ddr5-5600mhz-c48-cmsx16gx5m1a5600c48
