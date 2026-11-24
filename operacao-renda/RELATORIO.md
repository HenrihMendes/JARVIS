# Operação Renda v2: Relatório Executivo (24/11/2026)

> **O que mudou em relação à v1:** a v1 escolheu "página de imóvel", que no fundo é site, e verificou só 7 empresas. Isso foi viés meu, porque você já tinha o template pronto. A v2 parte do dinheiro que já existe dentro do cliente, sem construir site nenhum. A análise dos corretores ficou em `anexo-corretores-pagina-imovel.md`, como opção secundária.

**Região:** Sinop-MT (assumida pelo DDD 66 e pelo repositório Sexta-Feira).

**Legenda:** **[OBS]** = vi na fonte (página carregada ou diretório lido). **[BUSCA]** = resumo de buscador, não verificado. **[HIP]** = hipótese minha, precisa ser confirmada na conversa com o cliente.

---

## 1. Melhor oportunidade: "Programa de Retorno" para clínicas de estética e harmonização

**Em uma frase:** a clínica já tem centenas de pacientes que fizeram toxina, bioestimulador ou limpeza e não voltaram. Eu organizo essa base, separo quem está no ponto de retorno e entrego as mensagens prontas para a recepção enviar pelo WhatsApp da própria clínica. É dinheiro que já está "dentro de casa".

**Por que é a mais rentável por hora trabalhada:**

| Critério | Programa de Retorno | Por quê |
|---|---|---|
| Dinheiro rápido | ✅ | Não tem nada para construir. A ferramenta já está pronta e testada (`retorno/retorno.html`). A entrega leva 48 h. |
| Esforço | ✅ 3–4 h por clínica | 1 h para exportar a lista junto com a clínica, 1 h de configuração, 30 min treinando a recepção, 1 h de acompanhamento. |
| Facilidade de venda | ✅ | O dono vê o resultado em dias (agendamentos), não em meses como em site ou SEO. |
| Custo | ✅ R$ 0 | Não usa API, servidor nem disparador. Roda no navegador da clínica. |
| Risco técnico | ✅ baixo | Envio manual com limite diário, pelo número da clínica, só para quem já é paciente. Isso reduz o risco de bloqueio pela Meta. |
| LGPD | ✅ argumento de venda | Os dados não saem do computador da clínica. Você não armazena dado de paciente. |
| Recorrência | ✅ natural | Todo mês uma nova leva de pacientes "vence" o ciclo. A toxina dura em média **4–6 meses**, segundo a bula ([Dr. Consulta](https://drconsulta.com/conteudo/botox-bula/)). |
| Escala | ✅ | O mesmo processo serve para odontologia (limpeza a cada 6 meses, manutenção de alinhador), dermatologia, veterinária (vacinas) e oficinas (revisão). |

**Demanda validada no mercado [BUSCA]:** há empresas vendendo exatamente isso no Brasil: Capim ([blog](https://blog.capim.com.br/artigo/reativacao-de-pacientes-com-ia-camila-comunicativa-capim)), MaxZapp ([site](https://maxzapp.ai/sistema-para-clinicas)), Versatilis ([guia](https://versatilis.com.br/reativacao-pacientes-inativos/)), WeRamp, que cobra R$ 30 por paciente que comparece ([site](https://weramp.com.br/recall-de-pacientes)), e até curso, o "Paciente que Volta" ([site](https://secretariaquevende.com.br/pqv/)). Quando há fornecedores, curso e cobrança por resultado, existe comprador.

**Conta para o cliente [HIP, não prometa]:**
- O preço de toxina no Brasil fica em torno de **R$ 900–1.800 por área** ([Catraca Livre](https://catracalivre.com.br/saude-bem-estar/quanto-custa-fazer-uma-aplicacao-de-botox-em-2026/), [Cirurgia.net](https://www.cirurgia.net/precos/botox)). **Não achei preço de Sinop**; pergunte na clínica.
- Exemplo: 300 pacientes, 100 no ponto de retorno, 10% voltam = 10 sessões ≈ R$ 9–18 mil de faturamento.
- A Versatilis sugere como **meta** reagendar 15% em 30 dias. É meta de fornecedor, não resultado comprovado.
- Para a clínica, nosso preço se paga com **um** retorno.

### Onde ela é fraca
1. **Concorrência de software.** Capim e WeRamp oferecem recall automatizado, alguns de graça. **Resposta:** eles vendem ferramenta; você vende o serviço feito, com a recepção treinada. Em Sinop a adoção desses softwares é desconhecida. Pergunte na conversa.
2. **Depende da lista.** Se a clínica não tem sistema de agenda e a base vive só nas conversas do WhatsApp, a segmentação fica manual e lenta. **Qualifique na primeira conversa:** "vocês usam algum sistema de agenda?"
3. **"Minha secretária faz isso."** Na maioria das vezes não faz [HIP]. Responda com uma pergunta: "quantos pacientes de toxina de julho ela chamou este mês?"
4. **Risco de bloqueio do WhatsApp.** Existe se mandarem para gente que nunca foi paciente ou em massa. Por isso há limite diário e mensagens personalizadas, e a ferramenta não automatiza o envio.
5. **Mercado.** Sinop tem algumas dezenas de clínicas de estética e 203 consultórios odontológicos listados [OBS]. Para R$ 4 mil/mês são precisos de 8 a 10 clientes recorrentes, o que é viável em 1 a 3 meses, não em 7 dias.

---

## 2. Auditoria das ferramentas

| Ferramenta | Status | Observação |
|---|---|---|
| Busca web | ✅ | Resultados resumidos. Diretórios podem estar desatualizados. |
| Leitura de páginas | ⚠️ só domínios liberados | Liberei 22 domínios no ambiente JARVIS (sites de clínicas e corretores, DentMap, EsteticaGuia). O Doctoralia bloqueia robôs (resposta vazia). |
| Navegador headless (Playwright) | ✅ | Usei para extrair os 203 perfis do DentMap e o ranking do EsteticaGuia, e para testar a ferramenta. |
| Instagram / Google Maps / avaliações | ❌ | Sem acesso. Número de seguidores e de avaliações você verifica no celular. |
| WhatsApp | ❌ (de propósito) | Todo envio é feito por você. Eu não envio nada. |
| Node / Python / Git | ✅ | Ferramenta construída e versionada. |
| **Custo adicional da estratégia** | **R$ 0** | — |

---

## 3. Três melhores segmentos

1. **Estética e harmonização (médica, biomédica, odontológica):** ciclo de retorno embutido (toxina a cada 4–6 meses), ticket alto, pagamento particular, decisor é a própria profissional.
2. **Odontologia com HOF, ortodontia ou alinhadores:** manutenção mensal e limpeza semestral. Há 203 consultórios em Sinop no DentMap [OBS]. O problema: muitos são profissionais solo com base pequena.
3. **Dermatologia particular:** consultas de R$ 500–800 em Sinop (BellaDore R$ 800, Pisa R$ 600, Dermatoprime R$ 500, pelo Doctoralia [BUSCA]). Retorno anual e procedimentos estéticos.

**Fora do top 3 e por quê:** corretores (ticket enorme, mas o produto é página/site e o mercado é pequeno, ver anexo); energia solar e agro (sem evidência de dor que eu consiga verificar de fora); franquias como Royal Face e Botocenter (marketing centralizado, sem decisor local).

---

## 4. Comparativo de soluções

| Solução | Preço sugerido | Execução | Margem | Recorrência |
|---|---:|---:|---|---|
| **Programa de Retorno** (reativação de base) | **R$ 900 (campanha) + R$ 490/mês** | **3–4 h + 1,5 h/mês** | ~100% | **Alta (ciclo do procedimento)** |
| Ficha Google + rotina de avaliações | R$ 600 + R$ 300/mês | 3 h + 1 h/mês | ~100% | Média. Mercado cobra R$ 597–697/mês ([Asaas](https://www.asaas.com/c/i5f7lu7xu7jbqpwb)) |
| Recepção com IA no WhatsApp (fora do horário) | R$ 1.500 + R$ 400/mês | 15–25 h | 60–75% (API Meta + BSP) | Alta, mas concorre com SaaS de ~R$ 299/mês |
| Teste de atendimento (cliente oculto) + relatório | R$ 400 | 3 h | 100% | Baixa (porta de entrada) |
| Página de imóvel para corretor (v1) | R$ 1.200 | 4–6 h | ~100% | Média |
| Site para clínica | R$ 1.500–2.500 | 8–12 h | ~95% | Baixa. As boas já têm site [OBS] |
| Gerador de proposta (energia solar) | R$ 2.500–4.000 | 20–30 h | ~95% | Média. Sem evidência de dor |

**Top 3:**
1. **Programa de Retorno** (vencedora).
2. **Ficha Google + avaliações**: upsell natural, porque quem voltou e gostou é quem você pede para avaliar.
3. **Recepção com IA**: para o mês 2, só com caixa e um case na mão.

---

## 5. A oferta

**Nome:** Programa de Retorno.

**Em 30 segundos:**
> "Sua clínica tem pacientes de toxina e bioestimulador que já passaram do tempo de reaplicar e ninguém chamou de volta. Eu pego a lista da sua agenda, separo quem está no ponto e deixo as mensagens prontas e personalizadas para a sua recepção mandar pelo WhatsApp de vocês, 40 por dia. Os dados não saem do seu computador. Custa R$ 900, metade para começar. Se não sair nenhum agendamento em 14 dias, eu devolvo a entrada."

**Escopo:**
- Exportação da lista do sistema de agenda (feita junto com a clínica).
- Segmentação por procedimento e tempo desde o último atendimento (ciclos ajustáveis: toxina 120 dias, bioestimulador 180, limpeza 180…).
- 2 a 3 versões de mensagem no tom da clínica.
- Treino de 30 min com a recepção: como enviar, o que responder, como registrar.
- Planilha de controle (quem foi contatado, quem agendou).
- Relatório em 14 dias: contatados, respostas, agendamentos.

**Fora do escopo:** envio pelas mãos de vocês, tráfego pago, atendimento.

**Preço e pagamento:**
- Campanha: **R$ 900**, com 50% no Pix na aceitação e 50% na entrega da lista pronta.
- Mensal (opcional, a partir do mês 2): **R$ 490/mês**, com a nova leva de vencidos todo mês, mensagem de pós-procedimento, mensagem de aniversário e relatório.
- **Garantia:** nenhum agendamento em 14 dias = devolução da entrada. Ela é segura porque depende de **um** agendamento, e você não promete faturamento.
- Desconto de fundador para os 2 primeiros clientes: R$ 700, em troca de depoimento e autorização para citar o resultado.

**Diferenciais:** serviço pronto (não é mais um software); dados ficam na clínica; resultado medido em 14 dias; preço fixo baixo frente a um único procedimento.

---

## 6. Lista de empresas (37) e prioridade

**Sobre o score:** de fora, o que dá para ver é o canal de contato, o tipo de procedimento e se é franquia. O problema em si (pacientes inativos não reativados) **não é visível de fora**. É uma hipótese [HIP] para todas, e você confirma com 2 perguntas na conversa: "usam sistema de agenda?" e "quem chama o paciente de toxina de volta hoje?".

Critérios (0–100): decisor acessível (20), procedimento com ciclo de retorno (20), ticket provável (15), independente/não franquia (15), canal de contato público (10), facilidade de demonstrar (10), recorrência (10).

### 6.1 Estética e harmonização ([EsteticaGuia, Sinop](https://esteticaguia.com/clinicas-de-harmonizacao/sinop/) [OBS])

| # | Empresa | Contato público | Presença digital [OBS] | Observação | Score |
|---|---|---|---|---|---:|
| 1 | **Pamela Marques Clinic** | (66) 99944-8008 · R. Veneza 149 | Site próprio com WhatsApp | 3ª no ranking do guia. Toxina, bioestimulador, ácido hialurônico [BUSCA]. Já investe em presença. | **86** |
| 2 | **DermoSlim** | (66) 99264-2551 · R. das Primaveras 3827 | **Só Instagram** (@dermoslim.estetica) | Botox, bioestimulador, limpeza, micropigmentação. Mix com recorrência. | **84** |
| 3 | **DUO by Vagner Mari** | (66) 99927-0999 · Av. das Embaúbas 2489B | Site com "Agende agora" | Estética integrada + dermato. Estrutura maior, mais pacientes [HIP]. | **83** |
| 4 | **Pelissari Estética Avançada** | (66) 99640-0103 | Site com WhatsApp "agendar avaliação" | Especializada em harmonização. | **82** |
| 5 | **Dra. Amanda Zanette (Lavieen e Harmonização)** | (66) 99675-4244 · R. das Cerejeiras 1515 | Só link de WhatsApp | Harmonização + laser (Lavieen). | **80** |
| 6 | **Ludmilla Fernandes Estética Avançada** | (66) 99679-6828 · R. das Camélias 688 | Só Instagram | — | **78** |
| 7 | **Dra. Kris Silveira** | (66) 99621-2368 · R. das Petúnias 598 | Só Instagram | — | **78** |
| 8 | **Clínica Jullyete Gonçalves** (dermato) | (66) 99236-7693 · R. das Nogueiras 1329 | **Dois sites diferentes** no ar | Dermato + estética, toxina e bioestimulador. Dois sites sugerem fornecedores diferentes ou desorganização [HIP]. | **78** |
| 9 | **Dra. Marciane Souza (estética facial)** | (66) 99912-0571 | Site esteticamarcianesouza.com | — | 75 |
| 10 | **Clínica Dra. Fátima Costa** | (66) 99983-6552 · R. dos Cajueiros 399 | Site drafatimacosta.com.br | — | 75 |
| 11 | Dra. Raíssa Sôffa Estética Avançada | (66) 99653-1723 | Só Instagram | — | 74 |
| 12 | Dra. Ana Kujat (biomedicina estética) | (66) 99647-8218 · R. das Caviúnas 518 | Só Instagram | — | 72 |
| 13 | DermaSlim Clinic | (66) 99940-1110 · R. das Caviúnas 518 | Só Instagram | Mesmo endereço da Ana Kujat | 70 |
| 14 | BioFace Clinic (Dra. Samara Soares) | (66) 99654-6346 · R. dos Angicos 237 | Nenhum canal listado | — | 70 |
| 15 | Mariane Nunes (enf., melasma e harmonização) | (66) 99941-7693 | Só WhatsApp | — | 68 |
| 16 | Dra. Myllena Zanin (HOF + estética dental) | (66) 99693-0771 · Clínica Ory | — | — | 68 |
| 17 | Celeste Lima (Clínica Saúde Integrada) | (66) 99694-2477 | Só Facebook | — | 62 |
| 18 | CEAS (Estética Avançada Sanches) | (66) 3532-3459 | Site (não carregou no teste) | 53 avaliações no Google [BUSCA] | 62 |
| 19 | Estética Taila Boeri | (66) 99670-9157 | WhatsApp | Foco em área íntima e laser. Ciclo de depilação a laser [HIP] | 60 |
| 20 | Royal Face Sinop / Botocenter | — | Franquias | Decisão centralizada | 20 |

### 6.2 Odontologia com HOF, ortodontia ou alinhadores ([DentMap](https://dentmap.com.br/dentistas/sinop), 203 perfis extraídos [OBS])

| # | Empresa | Contato | Foco | Score |
|---|---|---|---|---:|
| 21 | Turci Odontologia (Invisalign) | (66) 99983-8979 | Ortodontia / alinhadores | 70 |
| 22 | Furtado Odontologia Especializada (Invisalign) | (66) 99978-2330 | Alinhadores | 70 |
| 23 | Dra. Nahyara Luna (Invisalign) | (66) 99241-1198 | Alinhadores | 66 |
| 24 | Due Vite Odontologia (harmonização) | (66) 99227-9423 | HOF + odonto | 68 |
| 25 | Dra. Stanslay Bernal (harmonização e rejuvenescimento) | (66) 99650-7232 | HOF | 66 |
| 26 | Dra. Bruna Moro (harmonização orofacial) | (66) 99906-2029 | HOF | 64 |
| 27 | Dra. Ester Machado (harmonização) | (66) 99638-3722 | HOF | 64 |
| 28 | Dra. Rhayelli (dentista e harmonização) | (66) 99900-3371 | HOF | 62 |
| 29 | Secchi Odontologia / Dra. Francieli Secchi | (66) 99985-5657 | Endo, orto, HOF | 62 |
| 30 | Clínica Implantare | (66) 99600-1233 | Implante (ciclo de retorno fraco) | 50 |
| 31 | Dr. Carlos Spin Toledo | Av. das Embaúbas 694 | Implante, apneia. 41 opiniões no Doctoralia [BUSCA] | 50 |

### 6.3 Dermatologia ([Doctoralia](https://www.doctoralia.com.br/servicos-de-tratamento/consulta-dermatologia/sinop) [BUSCA])

| # | Clínica | Endereço | Observação | Score |
|---|---|---|---|---:|
| 32 | BellaDore Centro Clínico | R. das Caviúnas 1916 | Consulta R$ 800. Injetáveis (Dra. Isabela Ribeiro). Sem agendamento online no Doctoralia | 70 |
| 33 | Clínica Pisa Dermatologia e Estética | Av. das Figueiras 1952 | Consulta R$ 600 | 68 |
| 34 | Dermatoprime | Av. dos Tarumãs 1942 | Consulta R$ 500 | 62 |
| 35 | Byuderme | Av. dos Tarumãs 1561 | Multiespecialidade | 58 |
| 36 | Clínica Cimed (Dra. Fernanda Lorenski) | Av. das Embaúbas 1600 | Harmonização + dermato | 60 |
| 37 | Sinop Clínica (Thompson Cirurgia Plástica e Dermato) | R. das Hortências 1439 | Não aceita plano: 100% particular | 64 |

*Telefones e endereços vêm de diretórios públicos (EsteticaGuia, DentMap, Doctoralia). Confirme antes de usar.*

---

## 7. Abordagem: os 10 prioritários

**Regras de ouro:** uma mensagem escrita à mão por pessoa. Nada de disparo. No máximo 2 tentativas sem resposta. Para as clínicas que só têm Instagram, use a DM do Instagram **e** o WhatsApp.

### Estrutura (adapte o trecho entre colchetes)

**1ª mensagem (curta, específica, sem link):**
> "Oi, Dra. [nome], tudo bem? Sou o [seu nome], aqui de Sinop. Trabalho com clínicas de estética numa coisa bem específica: chamar de volta os pacientes de [toxina/bioestimulador] que já passaram do tempo de reaplicar. Normalmente isso fica esquecido na correria da recepção. Posso te fazer uma pergunta rápida sobre como vocês fazem isso hoje?"

**Personalização por clínica (use só o que é verdade):**

| # | Clínica | Gancho específico |
|---|---|---|
| 1 | Pamela Marques Clinic | "Vi no site que vocês trabalham com toxina, bioestimulador e ácido hialurônico: três procedimentos com retorno programado." |
| 2 | DermoSlim | "Vi no seu Instagram que vocês fazem botox, bioestimulador e limpeza de pele, que são procedimentos com retorno certo." |
| 3 | DUO (Vagner Mari) | "Vi que a DUO junta estética e dermatologia. Com esse volume de pacientes, deve ter muita gente no ponto de retorno." |
| 4 | Pelissari | "Vi que o site de vocês leva direto para o WhatsApp para agendar avaliação. Vocês fazem algo parecido para chamar de volta quem já é paciente?" |
| 5 | Dra. Amanda Zanette | "Vi que você trabalha com harmonização e Lavieen, que tem protocolo em sessões." |
| 6 | Ludmilla Fernandes | "Vi seu trabalho em estética avançada no Instagram." |
| 7 | Dra. Kris Silveira | idem, citando um procedimento que ela divulga |
| 8 | Dra. Jullyete | "Vi que você oferece toxina e bioestimulador junto com a dermato." (Não cite os dois sites na primeira mensagem; guarde para a reunião.) |
| 9 | Dra. Marciane Souza | "Vi no seu site o foco em estética facial." |
| 10 | Dra. Fátima Costa | "Vi no seu site [procedimento que aparece lá]." |

### Se a pessoa responder "pode perguntar"
> "Quando uma paciente faz toxina, alguém da clínica chama ela de volta 4 ou 5 meses depois, ou vocês esperam ela lembrar sozinha?"

- Se responder **"esperamos" ou "às vezes"** → "É exatamente isso que eu resolvo. Vocês usam algum sistema de agenda, ou fica tudo no WhatsApp?" → "Consigo te mostrar em 15 minutos, aí na clínica, como fica. Que dia é melhor?"
- **Na reunião:** abra `retorno.html` no notebook ou celular, clique em "Carregar exemplo fictício" e mostre a lista de vencidos com o botão de WhatsApp. Depois pergunte: "quantas pacientes de toxina vocês atenderam no primeiro semestre?"

### Objeção: preço
> "Uma única paciente que volta para a toxina já paga o programa. E se não sair nenhum agendamento em 14 dias, eu devolvo a entrada. O risco fica comigo."

Não baixe de R$ 700.

### Objeção: "Já temos sistema" ou "minha secretária faz"
> "Ótimo, isso facilita: a lista sai de lá. Só uma pergunta: quantas pacientes de toxina de junho e julho foram chamadas este mês? Se a resposta for 'todas', vocês não precisam de mim e eu te agradeço pelo tempo."

Essa resposta é honesta e qualifica o cliente. Quem já faz bem não é cliente.

### Follow-up (2 a 3 dias depois, uma vez só)
> "Dra. [nome], só voltando aqui: preparei um exemplo de como fica a lista de retorno de uma clínica (com dados fictícios). Te mostro em 15 minutos quando for bom para você?"

### Para fechar
- **Presencial vence:** Sinop é uma cidade média e as clínicas ficam concentradas (Setor Comercial, Caviúnas, Embaúbas, Tarumãs).
- Feche na reunião: "começo amanhã. Te mando o Pix da entrada de R$ 450 agora?"
- Contrato de 1 página por WhatsApp: escopo, prazo, preço, garantia e uma cláusula LGPD dizendo que os dados permanecem com a clínica e que você não guarda cópia.

---

## 8. Produção (o que já está pronto)

- **Ferramenta:** `retorno/retorno.html`, um arquivo único. Não precisa instalar nada; abre em qualquer navegador.
  - Lê CSV (vírgula ou ponto e vírgula) e identifica as colunas sozinha.
  - Normaliza telefone para +55 e remove duplicados, mantendo o atendimento mais recente.
  - Calcula quem passou do ciclo de cada procedimento (ciclos editáveis) e divide em lotes diários.
  - Gera a mensagem personalizada e o link do WhatsApp com o texto pronto.
  - Marca quem já foi contatado e exporta a planilha de controle.
  - **Testada** com Playwright: dados fictícios, CSV com aspas e vírgulas, telefone em vários formatos, linhas sem telefone. Zero erros no console. Corrigi 3 bugs no teste: concordância da mensagem, vírgula no primeiro nome e escape de HTML.
  - Print: `retorno/demo.png`.
- **Sem servidor, sem API, sem mensalidade de ferramenta.** Custo de operação: R$ 0.
- **Manutenção:** ~1,5 h por clínica por mês no plano mensal.
- **Ética e compliance:** só envie para pacientes da própria clínica, pelo número dela, com limite diário. Sem disparo automático. Os dados não saem do computador da clínica.

---

## 9. Plano de 7 dias

| Dia | Ação | Meta |
|---|---|---|
| **1 (hoje)** | Abrir `retorno.html` no seu celular ou notebook e treinar a demo (2 min). Mandar a 1ª mensagem para as clínicas 1–8. Conferir no Instagram e no Google (avaliações, posts) as clínicas 1–10, para ter certeza de que estão ativas. | 8 contatos |
| **2** | Clínicas 9–20. Responder quem respondeu e marcar visitas. | 12 contatos + 2 visitas marcadas |
| **3** | 2 visitas com demo. Dermatologia (32–37) por telefone ou presencial. | 2 reuniões + 6 contatos |
| **4** | Follow-up dos dias 1–2. Odonto HOF (21–29). | **1º Pix de entrada (R$ 350–450)** |
| **5** | Execução do 1º cliente: exportar lista, configurar, treinar a recepção. | 1º cliente rodando |
| **6** | Entrega e cobrança do saldo. Mais reuniões. | **R$ 900 recebidos** |
| **7** | 2º fechamento. Começar Sorriso e Lucas do Rio Verde (mesma busca no EsteticaGuia). | ≥ R$ 1.000 acumulados |

**Meta diária:** 10 contatos novos personalizados + todos os follow-ups devidos + 1 a 2 visitas a partir do dia 3.

**Sinal de alerta:** com 20 contatos e zero respostas no dia 3, o problema é a mensagem ou o canal. Me traga as conversas que eu ajusto.

**Probabilidade honesta [HIP]:** não tenho taxa de conversão confiável para esse serviço em Sinop. O que faz esta opção superar a v1 é o argumento financeiro direto, mais fácil de entender que "apresentação premium", e a garantia que tira o risco do cliente. R$ 1.000 em 7 dias depende de 1 a 2 fechamentos em ~50 contatos. É possível, não garantido.

---

## 10. Estratégia para o primeiro pagamento

1. Venda a pergunta, não o produto: "quem chama a paciente de toxina de volta?"
2. Demo de 2 minutos com dados fictícios, presencial sempre que possível.
3. Garantia de devolução da entrada, que é o que permite fechar na primeira reunião.
4. Entrada de 50% **antes** de exportar a lista.
5. Relatório de 14 dias com número de agendamentos, que vira o case para vender às próximas e o gancho do plano mensal.

---

## 11. Primeira ação hoje

**Mande a 1ª mensagem (seção 7) para a Pamela Marques Clinic, (66) 99944-8008, com o gancho "toxina, bioestimulador e ácido hialurônico: três procedimentos com retorno programado".**

Antes disso, abra o Instagram dela e confirme que ela divulga esses procedimentos. Ela está bem colocada no ranking local, tem site (ou seja, investe) e trabalha com os três procedimentos de ciclo mais claro.

---

### Fontes
- Clínicas: [EsteticaGuia: harmonização em Sinop](https://esteticaguia.com/clinicas-de-harmonizacao/sinop/) · [DentMap: dentistas em Sinop](https://dentmap.com.br/dentistas/sinop) · [Doctoralia: dermatologia em Sinop](https://www.doctoralia.com.br/servicos-de-tratamento/consulta-dermatologia/sinop) · [Pelissari](https://pelissariestetica.com.br/) · [Pamela Marques](https://www.pamelamarquesclinic.com.br/) · [DUO Sinop](https://www.duosinop.com.br/) · [Jullyete Gonçalves](https://jullyetegoncalves.com.br/dermatologia-e-estetica/) · [Royal Face Sinop](https://royalface.com.br/unidade/sinop-mt/)
- Demanda e mercado: [Capim](https://blog.capim.com.br/artigo/reativacao-de-pacientes-com-ia-camila-comunicativa-capim) · [Versatilis](https://versatilis.com.br/reativacao-pacientes-inativos/) · [MaxZapp](https://maxzapp.ai/sistema-para-clinicas) · [WeRamp](https://weramp.com.br/recall-de-pacientes) · [Paciente que Volta](https://secretariaquevende.com.br/pqv/) · [Ramper/Olhar Digital: só 12% respondem em menos de 10 min](https://olhardigital.com.br/2022/04/18/pro/empresas-respondem-primeiro-contato-cliente/)
- Toxina: [bula (Dr. Consulta)](https://drconsulta.com/conteudo/botox-bula/) · [Catraca Livre: preços 2026](https://catracalivre.com.br/saude-bem-estar/quanto-custa-fazer-uma-aplicacao-de-botox-em-2026/) · [Cirurgia.net](https://www.cirurgia.net/precos/botox)
- Google Meu Negócio: [Asaas, R$ 597/mês](https://www.asaas.com/c/i5f7lu7xu7jbqpwb)
