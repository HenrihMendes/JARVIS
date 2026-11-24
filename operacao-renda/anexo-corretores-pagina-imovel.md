# Operação Renda — Relatório Executivo (24/11/2026)

> **Região assumida: Sinop-MT.** O prompt deixou a cidade em branco. Assumi Sinop porque o repositório `Sexta-Feira` é um demo para Sinop e o WhatsApp nele tem DDD 66. Se a cidade for outra, a lógica da estratégia continua valendo, mas a lista de empresas não.

Legenda: **[OBS]** = fato que eu observei (página carregada, print, texto do site). **[BUSCA]** = vem de resultado de busca ou diretório, não verifiquei na fonte. **[HIP]** = hipótese minha.

---

## 0. Veredito em 5 linhas

1. **Vencedora:** página cinematográfica de **um imóvel** de alto padrão ("Apresentação Exclusiva"), vendida a **corretores autônomos de alto padrão** de Sinop. Preço: **R$ 1.200 por imóvel**, com 50% de entrada.
2. **Motivo:** o comprador já paga por presença digital (todos os 7 corretores que analisei têm site próprio), vende casas de **R$ 1,85 mi a R$ 5,5 mi** e decide sozinho. Além disso, você **já tem o produto pronto** (Sexta-Feira).
3. **Não vamos vender "site".** A página complementa o site que ele já tem. Assim a objeção "já tenho site" perde força.
4. **Uma venda já paga a meta da semana.** Para chegar a R$ 4 mil/mês, a recorrência vem do plano "Vitrine" (R$ 390/mês) e da expansão para Sorriso, Lucas do Rio Verde e incorporadoras.
5. **Primeira ação hoje:** mandar a mensagem nº 1 (seção 6) para **Hans Rodovalho**, com o link da página de imóvel do demo.

---

## 1. Auditoria das ferramentas (o que eu realmente consigo fazer)

| Ferramenta | Situação | Implicação |
|---|---|---|
| Busca web (WebSearch) | ✅ Funciona | Encontra empresas, mas o resultado vem resumido por diretórios, que podem estar desatualizados. |
| Leitura de páginas (WebFetch / curl) | ❌ Bloqueada por padrão (rede "limited") | Guiamais, Apontador e BenDitoGuia falharam por DNS. **Liberei 9 domínios** (sites dos corretores-alvo + seu demo) no ambiente JARVIS. |
| Navegador headless (Playwright/Chromium) | ✅ Funciona nos domínios liberados | Tirei prints mobile e extraí dados reais (pasta `evidencias/`). |
| Instagram / Google Maps / Google Meu Negócio | ❌ Sem acesso (login, bloqueio a robôs) | **Você** precisa checar seguidores, frequência de posts, avaliações e tempo de resposta pelo celular. Não vou inventar isso. |
| Node 22, Astro, Netlify (repo Sexta-Feira) | ✅ | Desenvolver, testar (QA com 185 checks) e publicar sem custo. |
| ElevenLabs (MCP) | ✅ conectado | Gera imagens, vídeo e voz. Serve para narração do imóvel como upsell. Gasta créditos seus. |
| Adobe Express (MCP) | ✅ conectado | Peças visuais e PDF de proposta. |
| WhatsApp / e-mail / telefone | ❌ Não tenho, e não devo ter | Todo envio é feito por você. |

**Custo adicional para executar a estratégia vencedora: R$ 0.** Netlify grátis, subdomínio grátis. Domínio próprio, se o cliente quiser, sai por ~R$ 40/ano no Registro.br e é pago por ele.

---

## 2. Onde está o dinheiro em Sinop [BUSCA]

- ~216 mil habitantes (IBGE 2024). PIB per capita de R$ 59,8 mil em 2023, acima da média nacional ([IBGE](https://www.ibge.gov.br/cidades-e-estados/mt/sinop.html)).
- Imobiliário aquecido: prédio de 42 andares em construção (São Benedito, entrega prevista para 2028) e PZ Empreendimentos entrando com loteamentos, escritórios e logística ([Compre Rural](https://www.comprerural.com/trends/riqueza-do-agro-vai-erguer-um-dos-maiores-edificios-do-brasil-gigante-de-r-500-milhoes-tera-154-metros-e-42-andares/), [Forbes](https://forbes.com.br/forbeslife/2025/09/infomercial-pz-empreendimentos-a-marca-que-conecta-a-forca-do-agro-ao-desenvolvimento-urbano/)).
- **Preço pedido em condomínios fechados [OBS]:** Hans Rodovalho anuncia de R$ 1,85 mi a R$ 4,98 mi. Ghislaine anuncia de R$ 1,25 mi a R$ 3,2 mi. Gabriela Di Mateos aparece com R$ 3,95 mi a R$ 5,5 mi [BUSCA].
- **Conta de comissão [HIP, confira a tabela do CRECI-MT]:** com comissão de 5–6%, uma casa de R$ 3 mi rende R$ 150–180 mil, dividida entre os corretores da venda. Nossa página custa menos de 1% disso.

---

## 3. Lista de empresas (32), qualificação e score

**Por que o score é provisório:** só consegui verificar a presença digital dos corretores (seção 3.1). Para clínicas, solar e outros, nome, telefone e endereço vêm de diretórios, e eu **não verifiquei** Instagram, site nem avaliações. Por isso esses scores levam o selo "não verificado" e são sempre menores.

### 3.1 Corretores e imobiliárias de alto padrão (verificados)

| # | Empresa | Site / plataforma | Contato público | O que eu vi [OBS] | Score |
|---|---|---|---|---|---:|
| 1 | **Hans Rodovalho** (corretor) | hansrodovalho.com.br · Luno Imob / Studio Mega | (66) 99671-2941 · @hansrodovalho | Site bem feito. Seção **"Imóveis Exclusivos HR"** e vídeos de imóveis. 9+ anúncios de R$ 1,85 a 4,98 mi. Link para "HRX Produções". **Já investe em apresentação e tem exclusivas**, ou seja, é o perfil exato. | **88** |
| 2 | **Gabriela Di Mateos** (eng. civil + corretora) | gabrieladimateos.com · CRECI 12405 | via site | Posicionamento forte de alto padrão. Home levou **11 s** para carregar no celular simulado, sem link de WhatsApp nem formulário na home. Sobrados de R$ 3,95 a 5,5 mi [BUSCA]. | **85** |
| 3 | **Ghislaine Corretora** (Ghislaine Fuhr) | ghislainecorretora.com.br · Webcasas | (66) 99680-6047 · @ghislaine_fuhr · R. das Caviúnas 150C | **Logo quebrado no celular** (aparece só o texto "GHISLAINE CORRETO" cortado) e banner de cookies cobrindo metade da tela. Casas de R$ 2,29 a 3,2 mi (Alameda das Cores, Portal da Mata). | **84** |
| 4 | **Deivith Fernandes** | deivithfernandesimoveis.com.br · Soft42 · CRECI 15373 | @_deivithfernandes | Imagem do topo **ficou preta** no celular após 2,5 s. Título com erro: **"CASA Á VENDA"**. Tem exclusiva "porteira fechada" no Aquarela das Artes. | **82** |
| 5 | **Eduardo Misturini** | eduardomisturini.com.br · Webcasas · CRECI J 14835 | @eduardomisturini_ | Topo genérico ("BUSQUE PELO SEU INVESTIMENTO IMOBILIÁRIO AQUI", H1 duplicado), 19 imóveis em grade padrão, lista 10 condomínios de alto padrão. | **80** |
| 6 | **Quintanilha Broker** | quintanilhabroker.com.br | via site | **O site não respondeu** no teste (conexão falhou). Anuncia casa no Aquarela Brasil por R$ 1,28 mi [BUSCA]. Confirme se o site está fora do ar: se estiver, é um gancho forte. | 72 |
| 7 | **Gadani Imóveis** | sem site próprio encontrado · CRECI J 17618 | R. das Caviúnas 518, Sala C | Casa de R$ 2,9 mi no Aquarela dos Poemas no ZAP/VivaReal [BUSCA]. Depende de portal. | 70 |
| 8 | **Imobiliária Celeste** | imobiliariaceleste.com.br · WordPress · CRECI 0928-J | @imobiliariaceleste | Site moderno e bom. Destaca o **PZ LOG** (47 módulos na BR-163), ou seja, já trabalha com lançamento de incorporadora. Precisa menos de nós, mas é **canal para lançamentos**. | 65 |
| 9 | **Ben Imóveis** (Flávia Ben) | não verificado | — | Anúncio no Alameda das Cores pela Wimoveis [BUSCA]. | 62 |
| 10 | **Neumann Imobiliária** | não verificado | — | Parceira em casa de R$ 3 mi no Portal da Mata pela Loft [BUSCA]. | 60 |
| 11 | Marcus Aurélio Corretor | só Facebook encontrado | — | [BUSCA] | 50 |

### 3.2 Odontologia [BUSCA, não verificado]

| # | Empresa | Contato | Observação | Score |
|---|---|---|---|---:|
| 12 | Clínica Implantare Sinop | (66) 99600-1233 · Av. das Embaúbas 1621 | Implante = ticket alto [HIP] | 55 |
| 13 | Clínica Odontológica Vem Sorrir | (66) 99684-9878 | 4,8★ com 63 avaliações no Google | 50 |
| 14 | Secchi Odontologia | (66) 99985-5657 · Av. dos Tarumãs 1943 | Faz HOF (harmonização) | 50 |
| 15 | Personalizatto Odontologia | (66) 99660-3914 · Av. dos Jacarandás 2623 | — | 45 |
| 16 | Vitalli Odontologia | (66) 99661-5799 | — | 45 |
| 17 | Cardoso Odontologia | (66) 99929-6327 · Av. das Acácias 2278 | — | 45 |
| 18 | Clínica Dentária Oral Norte | (66) 99611-2550 | **3,3★ em 10 avaliações**: sinal de problema de atendimento [HIP] | 45 |
| 19 | Dr. Carlos Spin Toledo | Av. das Embaúbas 694 (Doctoralia) | Implante, alinhadores, apneia | 45 |
| 20 | Redeorto Sinop | (66) 3531-8894 | Franquia, decisão centralizada | 25 |

### 3.3 Estética [BUSCA, não verificado]

| # | Empresa | Observação | Score |
|---|---|---|---:|
| 21 | Pamela Marques Clinic | Já tem site (pamelamarquesclinic.com.br). Toxina, bioestimulador | 50 |
| 22 | Clínica Jullyete Gonçalves (dermato) | **Dois** sites diferentes no ar (jullyetegoncalves.com.br e drajullyetedermatologia.com.br): possível desorganização [HIP] | 50 |
| 23 | DUO Sinop (Vagner Mari) | Já tem site | 45 |
| 24 | DermoSlim | R. das Primaveras 3827 | 40 |
| 25 | Dra. Ana Kujat (biomedicina estética) | R. das Caviúnas 518 | 40 |
| 26 | Royal Face Sinop / Botocenter | Franquias, marketing centralizado | 20 |

### 3.4 Energia solar e outros [BUSCA, não verificado]

| # | Empresa | Observação | Score |
|---|---|---|---:|
| 27 | Atto Solar Engenharia | Av. dos Jacarandás. Atende agro e indústria. Proposta de R$ 20–60 mil [HIP] | 50 |
| 28 | HBM Solar | Escritórios em Sinop e Alta Floresta | 45 |
| 29 | EcoPower Energia Solar | R. das Orquídeas 1015 | 45 |
| 30 | Bella Energia / Sollar Sul / Randoli Solar | Diretório Solutudo | 40 |
| 31 | Hidrony (oficina de caminhões) | (66) 3515-7597 · 5,0★ | 35 |
| 32 | PZ Empreendimentos / Construtora São Benedito | Grandes, com agências contratadas, ciclo de venda longo | 30 |

**Critério do score (0–100):** capacidade de pagar (20), urgência ou dor visível (15), valor da solução frente ao ticket do cliente (15), acesso direto ao decisor (15), facilidade de demonstrar (15), rapidez de entrega (10), recorrência (10).

---

## 4. Qual solução vende mais rápido

| Solução | Preço sugerido | Tempo de execução | Margem | Recorrência |
|---|---:|---:|---|---|
| **Apresentação Exclusiva do Imóvel** (corretor alto padrão) | **R$ 1.200 / imóvel** | **4–6 h** (template pronto) | ~100% (custo R$ 0) | Média: plano Vitrine R$ 390/mês |
| Site premium completo para corretor (template Sexta-Feira) | R$ 4.500 + R$ 150/mês | 15–25 h | ~95% | Média |
| Confirmação / lembrete / reativação de pacientes por WhatsApp (clínicas) | R$ 1.500 + R$ 350/mês | 10–20 h + suporte | 60–75% (API oficial da Meta + BSP ~R$ 100–250/mês) | **Alta** |
| Auditoria de atendimento "cliente oculto" via WhatsApp (clínicas, imobiliárias) | R$ 400 | 3 h | 100% | Baixa (porta de entrada) |
| Gerador de proposta comercial (energia solar) | R$ 2.500–4.000 | 20–30 h | ~95% | Média |
| Site de lançamento (incorporadora) | R$ 6–12 mil | 30–50 h | Alta | Baixa, ciclo longo |
| Site institucional para clínica | R$ 1.500–2.500 | 8–12 h | Alta | Baixa. Muitas já têm |

Referências de mercado [BUSCA]: SaaS de site e CRM para corretor custa de R$ 130 a R$ 190/mês ([Loft](https://loft.com.br/para-imobiliarias/?p=8597)). Chatbot pronto para clínica fica em torno de R$ 299/mês ([Asaas](https://www.asaas.com/c/094698721890)). Ou seja: no WhatsApp para clínicas você compete com SaaS barato. Na apresentação premium do imóvel, não.

### Top 3
1. **Apresentação Exclusiva do Imóvel**: mais rápida de vender e de entregar.
2. **Site premium completo**: upsell para o mesmo comprador (Hans, Gabriela).
3. **WhatsApp para clínicas**: a aposta de recorrência para o mês 2, **depois** de ter caixa e um caso de sucesso.

### Por que a vencedora vence (e onde ela é fraca)
**A favor:**
- **Demanda comprovada, não suposta:** 7 de 7 corretores de alto padrão verificados pagam por site. Comportamento de compra conta mais que opinião.
- **Ticket ridículo frente ao valor em jogo:** R$ 1.200 contra uma comissão de R$ 100 mil ou mais.
- **Decisor único e acessível:** o próprio corretor, com WhatsApp público.
- **Entrega quase pronta:** a página `/imoveis/[slug]` do Sexta-Feira já existe, testada, com Lighthouse 96.
- **Gancho de captação:** o corretor usa a página para **ganhar a exclusividade** do dono da casa ("é assim que vou apresentar seu imóvel"). Esse é o argumento real, não "mais leads".

**Contra (seja honesto com você mesmo):**
- **Mercado pequeno:** estimo 20 a 40 corretores de alto padrão em Sinop [HIP]. Para chegar a R$ 4 mil/mês é preciso ir para Sorriso, Lucas do Rio Verde e Cuiabá, ou fechar recorrência.
- **Sem foto profissional, não funciona.** O efeito cinematográfico depende de fotos boas. Qualifique: só aceite imóvel com foto ou drone profissional.
- **O demo usa casas fictícias geradas por IA.** Corretor esperto vai notar. Ofereça montar a prévia **com um imóvel real dele, com autorização**.
- **Viés de custo afundado:** parte do motivo de eu escolher imóveis é que você já construiu o Sexta-Feira. Isso é uma razão legítima (tempo de entrega zero), mas **não prova demanda**. Só a primeira venda prova.
- **Não prometa venda do imóvel nem leads.** Ninguém pode garantir.

---

## 5. A oferta

**Nome:** Apresentação Exclusiva (página cinematográfica do imóvel).

**Em 30 segundos:**
> "Eu transformo um imóvel seu de alto padrão numa página própria, com cara de filme: abertura cinematográfica, galeria em tela cheia e ficha completa, tudo pronto para mandar no WhatsApp do comprador ou mostrar ao proprietário na captação. Fica pronta em 72 h depois que eu recebo as fotos. Custa R$ 1.200 por imóvel, metade para começar."

**Escopo exato (e o que fica fora):**
- 1 página por imóvel, com abertura em filme, galeria editorial com zoom, ficha técnica, localização aproximada, botão de WhatsApp com mensagem pronta, CRECI e versão para celular.
- Link próprio (`nomedocorretor-casa.netlify.app` ou subdomínio do domínio dele).
- Preview para o WhatsApp (imagem e título quando o link é compartilhado).
- 1 rodada de ajustes. Página no ar por 6 meses incluída.
- **Fora do escopo:** fotos e vídeo, tráfego pago, CRM, integração com portais, textos jurídicos.

**Preços:**
- Avulso: **R$ 1.200** (50% de entrada no Pix, 50% na entrega).
- Pacote de 3 imóveis: **R$ 2.900**.
- **Vitrine (mensal): R$ 390/mês**, com até 3 imóveis ativos, troca quando vender e relatório mensal de acessos. Fidelidade mínima de 3 meses.
- Oferta de lançamento: **os 3 primeiros clientes** pagam R$ 990 no avulso, em troca de autorização para usar como case. Use isso para fechar rápido, não para sempre.

**Diferenciais:** ninguém em Sinop apresenta imóvel assim (os sites que vi são templates de SaaS iguais entre si). Entrega em 72 h. Não substitui o site atual dele. Preço fixo.

---

## 6. Abordagem: 10 prioritários

**Regras:** você envia, uma mensagem por pessoa, escrita à mão. Nada de disparo em massa. Mande o link **depois** que a pessoa responder, ou no máximo junto com uma frase curta. Primeira mensagem curta.

Link de demo para usar: `https://siteimoveisdemo.netlify.app/imoveis/casa-aroeira/` (página de imóvel). Antes, **grave um vídeo de tela de 30–40 s** rolando essa página no celular. Vídeo converte mais que link no WhatsApp [HIP].

### 1. Hans Rodovalho, (66) 99671-2941
> Hans, boa tarde! Sou o [nome], aqui de Sinop. Vi no seu site a seção de Imóveis Exclusivos HR e os vídeos. Dá pra ver que você investe em apresentação. Eu faço uma página própria para um único imóvel, com cara de filme, para mandar ao comprador ou usar na captação. Posso te mandar um vídeo de 30 s de como fica?

### 2. Gabriela Di Mateos (contato pelo site / Instagram)
> Gabriela, tudo bem? Sou o [nome], de Sinop. Gostei muito do seu posicionamento (engenheira e corretora de alto padrão). Eu crio páginas cinematográficas para um imóvel específico, que o corretor manda direto no WhatsApp do comprador. Para sobrados como os do Alameda das Cores, o efeito é forte. Te mando um vídeo de 30 s?

### 3. Ghislaine, (66) 99680-6047
> Ghislaine, boa tarde! Sou o [nome], de Sinop. Abri seu site pelo celular e a logo não está carregando no topo (aparece só o nome cortado). Achei melhor avisar, porque é a primeira coisa que o cliente vê. Aproveitando: eu faço páginas exclusivas para imóveis de alto padrão, como as suas casas no Alameda das Cores. Posso te mostrar um exemplo?

*(Confira no seu celular antes de enviar. Se a logo já estiver ok, tire a frase.)*

### 4. Deivith Fernandes (Instagram @_deivithfernandes)
> Deivith, tudo certo? Sou o [nome], de Sinop. Vi sua casa "porteira fechada" no Aquarela das Artes em destaque no site. Um detalhe: no celular o topo ficou preto aqui, e o título está "Á VENDA" com acento agudo. Eu faço uma página só para esse tipo de imóvel exclusivo, com apresentação de filme. Quer ver um exemplo de 30 s?

### 5. Eduardo Misturini (Instagram @eduardomisturini_)
> Eduardo, boa tarde! Sou o [nome], de Sinop. Você trabalha com praticamente todos os condomínios top da cidade: Mondrian, Carpe Diem, Alameda das Cores. Eu faço uma página exclusiva por imóvel, para os que merecem mais que um card no portal. Te mostro um exemplo rápido?

### 6. Quintanilha Broker
> [Primeiro confirme se o site está fora do ar.] Oi! Sou o [nome], de Sinop. Tentei abrir o site da Quintanilha Broker e não carregou aqui. Achei melhor te avisar. Também faço páginas exclusivas para imóveis de alto padrão, como a casa no Aquarela Brasil. Quer ver como fica?

### 7. Gadani Imóveis (R. das Caviúnas 518, Sala C): **visita presencial**
> Leve o celular com o vídeo. "Vi a casa de vocês no Aquarela dos Poemas no ZAP. No portal ela fica igual a todas as outras. Isto aqui é como eu apresentaria ela." Mostre o vídeo e pergunte quem decide.

### 8. Imobiliária Celeste
> Ângulo diferente: lançamentos. "Vi o PZ LOG em destaque no site de vocês. Eu faço páginas de apresentação exclusivas para empreendimentos e imóveis-chave. Quem cuida do marketing aí?" Pode render ticket maior, mas a venda é mais lenta.

### 9. Ben Imóveis (Flávia Ben) e 10. Neumann Imobiliária
> Mesma estrutura: cite o imóvel específico que você viu no portal (Alameda das Cores / Portal da Mata), diga como ele aparece hoje (card de portal) e ofereça o vídeo de 30 s.

### Se a pessoa demonstrar interesse
> "Me diz um imóvel seu que você está com mais vontade de vender, e que tenha fotos profissionais. Com sua autorização eu monto uma prévia com ele em 48 h. Se você gostar, publico e fechamos em R$ 1.200, metade na aprovação. Se não gostar, eu apago e não te cobro nada."

Isso é trabalho grátis, mas **limitado** (~3 h) e só para quem já disse sim ao formato. Não faça prévia para quem não respondeu.

### Objeção: "Está caro"
> "Entendo. Pensa assim: numa casa de R$ 3 milhões, R$ 1.200 é menos de 1% da sua comissão. E a página serve também na captação, quando você disputa a exclusividade com outro corretor. Se preferir, o pacote de 3 imóveis sai a R$ 2.900."

Não baixe de R$ 990. Abaixo disso o retorno por hora fica ruim.

### Objeção: "Já tenho site"
> "Exato, e ele continua. Isso não substitui seu site. É uma página só para um imóvel, para os 2 ou 3 que merecem tratamento especial. Seu site é o catálogo; esta é a apresentação."

### Follow-up (2 dias depois, uma vez só)
> "[Nome], só voltando aqui: preparei um exemplo de 30 s mostrando como uma casa do [condomínio que ele anuncia] ficaria. Quer que eu te mande?"

Se não responder, pare. **Mande no máximo 2 mensagens sem resposta.**

### Para fechar
Quem responder: ligação de 10 min ou visita presencial com o celular na mão. Em cidade média, o presencial pesa muito [HIP]. Feche com "te mando o Pix da entrada e começo hoje". Contrato de 1 página (escopo, prazo, preço, ajustes) enviado por WhatsApp e aceito com "de acordo".

---

## 7. Produção (só depois do sim)

- **Arquitetura:** a mesma do Sexta-Feira (Astro estático + GSAP). Para cada imóvel, uma pasta em `src/content/imoveis/<slug>/` com `index.md` e fotos. Falta criar um **modo "imóvel único"**: uma página que abre direto no imóvel, sem a home do corretor fictício. Isso dá **2–4 h, uma única vez**, e só deve ser feito depois da primeira entrada paga ou do primeiro "sim" firme.
- **Deploy:** um site no Netlify por corretor (plano grátis). Domínio próprio é opcional e pago pelo cliente.
- **QA:** rodar `scripts/qa.mjs` (Playwright) antes de entregar.
- **Custos de operação:** R$ 0/mês até muitos clientes. O limite grátis do Netlify é suficiente para dezenas de páginas estáticas [HIP, confira os limites atuais]. ElevenLabs para narração é upsell opcional e usa créditos seus.
- **Manutenção:** ~15 min por troca de imóvel no plano Vitrine.
- **Atenção:** CRECI obrigatório em toda divulgação (Res. COFECI 1.065/2007). Fotos são do cliente, então use somente com autorização. **Nunca** publique um demo com imóvel real sem autorização escrita.

---

## 8. Plano de 7 dias

| Dia | Ação | Meta |
|---|---|---|
| **1 (hoje)** | Gravar vídeo de 30–40 s do demo no celular. Enviar mensagens 1 a 5 (Hans, Gabriela, Ghislaine, Deivith, Misturini). Abrir no seu celular os sites e Instagram dos 10 para confirmar o que eu vi. | 5 contatos |
| **2** | Mensagens 6, 9 e 10. Montar lista de +15 corretores pelo Instagram (busque "corretor Sinop alto padrão" e as marcações dos condomínios Alameda das Cores, Aquarela, Carpe Diem, Portal da Mata) e pelo ZAP/VivaReal com filtro acima de R$ 1,5 mi. | 8 contatos + lista de 15 |
| **3** | Visita presencial à Gadani e a mais 2 escritórios na R. das Caviúnas. Follow-up dos dias 1–2. Começar prévia para quem disse sim. | 3 visitas + 8 contatos |
| **4** | 8 novos contatos. Entregar prévia (48 h). Cobrar a entrada. | **1ª entrada (R$ 495–600)** |
| **5** | 8 contatos. Me avisar do primeiro sim, para eu construir o modo "imóvel único" e você publicar. | 2ª conversa quente |
| **6** | Entregar o 1º projeto e cobrar o saldo. Pedir indicação ("conhece outro corretor que trabalha com exclusivas?"). | **R$ 1.200 recebidos** |
| **7** | Oferecer plano Vitrine ao 1º cliente. Abrir Sorriso e Lucas do Rio Verde (mesma busca). | 1º contrato recorrente |

**Meta diária:** 8 novos contatos personalizados + todos os follow-ups devidos + 1 visita presencial a partir do dia 3. Em 7 dias são ~40–50 abordagens.

**Probabilidade honesta [HIP]:** não tenho taxa de resposta confiável para esse nicho. Fechar R$ 1.000 **recebidos** em 7 dias é possível, não garantido. O gargalo é o tempo de resposta do corretor e a disponibilidade de fotos. Se no dia 4 você tiver zero respostas em ~20 contatos, o problema é a mensagem ou o canal, não o volume. Me traga as respostas que eu ajusto.

---

## 9. Estratégia para o primeiro pagamento

1. Não venda "site". Venda **um imóvel específico dele**, citado pelo nome.
2. Prévia só para quem já disse sim ao formato e só com fotos que ele autorizou.
3. **Entrada antes de publicar.** A prévia fica num link privado; a publicação vem depois do Pix.
4. Oferta de lançamento (R$ 990, 3 vagas) cria um prazo real sem mentir.
5. Depois da entrega, peça indicação na mesma conversa.

---

## 10. Primeira ação hoje

**Grave um vídeo de tela de 30 s rolando `siteimoveisdemo.netlify.app/imoveis/casa-aroeira/` no seu celular e envie a mensagem nº 1 para o Hans Rodovalho, (66) 99671-2941.**

Ele tem exclusivas, já produz vídeo dos imóveis e anuncia de R$ 1,85 a 4,98 mi. É quem mais facilmente vai entender o valor.

---

### Fontes
- [IBGE Cidades: Sinop](https://www.ibge.gov.br/cidades-e-estados/mt/sinop.html)
- Sites verificados com print (pasta `evidencias/`): [hansrodovalho.com.br](https://www.hansrodovalho.com.br), [gabrieladimateos.com](https://gabrieladimateos.com), [ghislainecorretora.com.br](https://ghislainecorretora.com.br), [deivithfernandesimoveis.com.br](https://deivithfernandesimoveis.com.br), [eduardomisturini.com.br](https://eduardomisturini.com.br), [imobiliariaceleste.com.br](https://www.imobiliariaceleste.com.br)
- [Quintanilha Broker](https://www.quintanilhabroker.com.br/) (não carregou no teste)
- Portais: [VivaReal: Aquarela dos Poemas R$ 2,9 mi (Gadani)](https://www.vivareal.com.br/imovel/casa-4-quartos-condominio-aquarela-dos-poemas-bairros-sinop-com-garagem-237m2-venda-RS2900000-id-2879663813/), [Wimoveis (Ben Imóveis)](https://www.wimoveis.com.br/propriedades/casa-de-condominio-para-venda-em-sinop-3049740958.html), [Loft (Neumann)](https://loft.com.br/home/kgof3jvs)
- Odontologia: [BenDitoGuia: Implantare](https://www.benditoguia.com.br/empresa/clinica-implantare-sinop-setor-comercial-mt), [Vem Sorrir](https://www.benditoguia.com.br/empresa/clinica-odontologica-vem-sorrir-setor-comercial-sinop-mt), [Secchi](https://www.benditoguia.com.br/empresa/secchi-odontologia-jardim-paraiso-sinop-mt), [Oral Norte](https://www.benditoguia.com.br/empresa/clinica-dentaria-oral-norte-sinop-setor-comercial-mt), [Doctoralia Sinop](https://www.doctoralia.com.br/sinop)
- Estética: [Royal Face Sinop](https://royalface.com.br/unidade/sinop-mt/), [Pamela Marques Clinic](https://www.pamelamarquesclinic.com.br/), [Jullyete Gonçalves](https://jullyetegoncalves.com.br/dermatologia-e-estetica/), [Duo Sinop](https://www.duosinop.com.br/)
- Solar: [Atto Solar](https://www.solutudo.com.br/atto-solar-engenharia-energia-solar-21668019), [HBM Solar](https://www.solutudo.com.br/hbm-solar-energia-solar-21659009), [EcoPower](https://www.solutudo.com.br/ecopower-energia-solar-sinop-22093940)
- Mercado: [Compre Rural: edifício de 42 andares](https://www.comprerural.com/trends/riqueza-do-agro-vai-erguer-um-dos-maiores-edificios-do-brasil-gigante-de-r-500-milhoes-tera-154-metros-e-42-andares/), [Forbes: PZ Empreendimentos](https://forbes.com.br/forbeslife/2025/09/infomercial-pz-empreendimentos-a-marca-que-conecta-a-forca-do-agro-ao-desenvolvimento-urbano/), [Loft: preço de site e CRM para corretor](https://loft.com.br/para-imobiliarias/?p=8597), [Asaas: chatbot para clínica R$ 299/mês](https://www.asaas.com/c/094698721890)
