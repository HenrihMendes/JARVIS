/**
 * Modelos iniciais das páginas institucionais.
 *
 * ATENÇÃO: são MODELOS. Os campos entre {{chaves}} são preenchidos automaticamente com os
 * dados cadastrados em Painel → Configurações. Enquanto não forem preenchidos, a página
 * exibe "[informação pendente]". Revise com um(a) advogado(a) antes de publicar a loja.
 */
export const PAGE_TEMPLATES: { slug: string; title: string; seoDescription: string; body: string }[] = [
  {
    slug: "nossa-historia",
    title: "Nossa história",
    seoDescription: "Conheça a Nasil Vana Store, moda feminina com elegância e personalidade em Sinop, MT.",
    body: `## Moda que valoriza você

A {{loja.nome}} é uma loja de moda feminina de {{loja.cidade}}, {{loja.uf}}, dedicada a peças que unem elegância, personalidade e conforto — da alfaiataria para o trabalho aos corsets para a noite.

Cada peça é escolhida pensando na mulher que quer se sentir bem vestida em todas as ocasiões: caimento que valoriza a silhueta, detalhes que fazem diferença e combinações fáceis de usar no dia a dia.

## Como trabalhamos

- **Curadoria:** selecionamos poucas peças por modelo, com atenção ao caimento e ao acabamento.
- **Atendimento próximo:** tire dúvidas de tamanho e combinação diretamente com a nossa equipe.
- **Compra segura:** pagamento processado pelo Mercado Pago, sem que os dados do seu cartão passem pela nossa loja.

<!-- Proprietária: conte aqui como a loja começou, quem está por trás dela e o que a inspira. Este comentário não aparece no site. -->`,
  },
  {
    slug: "politica-de-privacidade",
    title: "Política de privacidade",
    seoDescription: "Como a Nasil Vana Store coleta, utiliza e protege seus dados pessoais, conforme a LGPD.",
    body: `Esta política explica como tratamos seus dados pessoais, em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).

## Quem é o controlador

**{{loja.razaoSocial}}** (nome fantasia {{loja.nome}}), CNPJ {{loja.cnpj}}, {{loja.endereco}}. Contato para assuntos de privacidade: {{loja.email}}.

## Quais dados coletamos

- **Identificação e contato:** nome, e-mail e telefone, informados no checkout.
- **CPF:** necessário para emissão de nota fiscal e para a análise antifraude do pagamento.
- **Endereço de entrega:** quando você escolhe entrega ou envio.
- **Dados do pedido:** produtos, valores, forma de entrega e status do pagamento.
- **Dados técnicos essenciais:** cookies necessários para manter seu carrinho e registros de segurança (por exemplo, endereço IP de forma resumida para prevenção de abuso).

**Não coletamos nem armazenamos dados de cartão.** O pagamento é realizado no ambiente seguro do Mercado Pago.

## Para que usamos e com qual base legal

- Processar e entregar seu pedido — *execução de contrato* (art. 7º, V).
- Emitir documentos fiscais e cumprir obrigações legais — *obrigação legal* (art. 7º, II).
- Prevenir fraudes e garantir a segurança da loja — *legítimo interesse* (art. 7º, IX) e *prevenção à fraude* (art. 11, II, g, quando aplicável).
- Enviar novidades e ofertas por e-mail — somente com seu *consentimento* (art. 7º, I), que pode ser retirado a qualquer momento.

## Com quem compartilhamos

- **Mercado Pago:** processamento do pagamento.
- **Transportadoras / entregadores:** quando há entrega.
- **Provedores de tecnologia:** hospedagem, banco de dados e envio de e-mails, sob contrato e apenas para operar a loja.
- **Autoridades:** quando exigido por lei.

Não vendemos seus dados.

## Por quanto tempo guardamos

Dados de pedidos são mantidos pelo prazo exigido pela legislação fiscal e de defesa do consumidor. Dados de marketing são mantidos até você cancelar a inscrição.

## Seus direitos (art. 18 da LGPD)

Você pode solicitar confirmação de tratamento, acesso, correção, anonimização, portabilidade, eliminação dos dados tratados com consentimento, informação sobre compartilhamentos e revogação do consentimento. Envie sua solicitação para {{loja.email}}.

## Segurança

Usamos conexão criptografada (HTTPS), controle de acesso ao painel administrativo, senhas armazenadas com hash forte e registros de auditoria. Nenhum sistema é 100% imune a incidentes; caso ocorra algum incidente relevante, comunicaremos os titulares e a ANPD conforme a lei.

## Cookies

Veja a nossa [Política de cookies](/politica-de-cookies).

## Alterações

Esta política pode ser atualizada. A data da última atualização aparece no fim da página.`,
  },
  {
    slug: "politica-de-cookies",
    title: "Política de cookies",
    seoDescription: "Quais cookies a Nasil Vana Store utiliza e como você pode gerenciá-los.",
    body: `Cookies são pequenos arquivos guardados no seu navegador.

## Cookies essenciais (sempre ativos)

- **nv_cart** — mantém o seu carrinho de compras por até 30 dias.
- **nv_consent** — guarda a sua escolha sobre cookies opcionais.

Esses cookies são necessários para o funcionamento da loja e não são usados para publicidade.

## Cookies de medição (opcionais)

Se ativados pela loja, usamos o Google Analytics 4 para entender, de forma agregada, como o site é usado. **Eles só são carregados se você aceitar** no aviso de cookies. Você pode mudar sua escolha a qualquer momento pelo link "Preferências de cookies" no rodapé.

## Pagamento

Ao seguir para o pagamento, você é direcionada ao site do Mercado Pago, que possui sua própria política de cookies e privacidade.`,
  },
  {
    slug: "trocas-e-devolucoes",
    title: "Trocas e devoluções",
    seoDescription: "Política de trocas e devoluções da Nasil Vana Store, incluindo direito de arrependimento.",
    body: `## Direito de arrependimento

Para compras feitas pelo site, você pode desistir da compra em até **7 (sete) dias corridos** a partir do recebimento do produto, sem precisar justificar (art. 49 do Código de Defesa do Consumidor). Nesse caso, devolvemos **integralmente** os valores pagos, incluindo o frete.

Para exercer esse direito, entre em contato por {{loja.email}} ou pelo WhatsApp {{loja.whatsapp}} informando o número do pedido. Confirmaremos o recebimento da sua solicitação imediatamente.

## Troca por tamanho ou modelo

Aceitamos trocas por tamanho ou modelo em até **{{comercio.prazoTroca}} dias** após o recebimento, sujeitas à disponibilidade de estoque.

Para que a troca seja aceita, a peça deve:

- estar sem sinais de uso, lavagem ou odores;
- estar com a etiqueta original fixada;
- ser enviada na embalagem original, sempre que possível.

## Produto com defeito

Se a peça apresentar defeito, fale com a gente. Seguimos os prazos e as garantias previstos no Código de Defesa do Consumidor (art. 26).

## Reembolso

O reembolso é feito pelo mesmo meio de pagamento utilizado na compra, por meio do Mercado Pago. Em compras no cartão, o estorno pode aparecer em até duas faturas, conforme a operadora.`,
  },
  {
    slug: "entrega-e-frete",
    title: "Entrega e frete",
    seoDescription: "Formas de entrega, prazos e frete da Nasil Vana Store.",
    body: `As formas de entrega disponíveis para o seu CEP, com valores e prazos, aparecem no checkout antes do pagamento.

## Prazo

O prazo começa a contar após a **confirmação do pagamento**. Pagamentos via Pix são confirmados em instantes; pagamentos via cartão, normalmente em poucos minutos.

## Acompanhamento

Você recebe a confirmação do pedido por e-mail e pode acompanhar o status pela página do pedido. Quando houver código de rastreio, ele aparece lá.

## Dúvidas

Fale com a gente por {{loja.email}} ou pelo WhatsApp {{loja.whatsapp}}.`,
  },
  {
    slug: "termos-de-uso",
    title: "Termos de uso",
    seoDescription: "Termos e condições de uso da loja virtual Nasil Vana Store.",
    body: `Ao usar este site, você concorda com os termos abaixo.

## Identificação

Loja operada por **{{loja.razaoSocial}}**, CNPJ {{loja.cnpj}}, {{loja.endereco}}. Contato: {{loja.email}}.

## Produtos, preços e estoque

- Preços, disponibilidade e condições são os exibidos no momento da compra e podem mudar sem aviso para compras futuras.
- O estoque é reservado por tempo limitado após você finalizar o pedido. Se o pagamento não for confirmado nesse período, o pedido é cancelado automaticamente e as peças voltam ao estoque.
- Cores podem variar levemente de acordo com a tela de cada aparelho.

## Pagamento

Os pagamentos são processados pelo Mercado Pago. O pedido só é confirmado depois que o Mercado Pago informa a aprovação do pagamento à nossa loja.

## Cancelamento

Pedidos podem ser cancelados conforme a [Política de trocas e devoluções](/trocas-e-devolucoes) e o Código de Defesa do Consumidor.

## Propriedade intelectual

Marca, textos e imagens deste site pertencem à {{loja.nome}} ou são usados com autorização, e não podem ser reproduzidos sem permissão.

## Foro

Fica eleito o foro do domicílio do consumidor para dirimir quaisquer questões relativas a estes termos.`,
  },
];

export const SIZE_GUIDE_PAGE = {
  slug: "guia-de-medidas",
  title: "Guia de medidas",
  seoDescription: "Como tirar suas medidas para escolher o tamanho certo na Nasil Vana Store.",
  body: `## Como medir

Use uma fita métrica flexível, sem apertar, de preferência vestindo roupas leves.

- **Busto:** contorne a parte mais volumosa do busto, mantendo a fita paralela ao chão.
- **Cintura:** contorne a parte mais fina do tronco, normalmente um pouco acima do umbigo.
- **Quadril:** contorne a parte mais larga do quadril, com os pés juntos.

## Dicas

- Se ficar entre dois tamanhos, prefira o maior para peças estruturadas (corsets e alfaiataria).
- Cada produto informa os tamanhos disponíveis e observações de caimento.
- Na dúvida, fale com a gente pelo WhatsApp antes de comprar.

<!-- Proprietária: adicione aqui a tabela de medidas real da loja (PP a GG), por exemplo:
| Tamanho | Busto | Cintura | Quadril |
Este comentário não aparece no site. -->`,
};

export const FAQ_TEMPLATES: { question: string; answer: string }[] = [
  {
    question: "Quais formas de pagamento são aceitas?",
    answer:
      "O pagamento é feito pelo Mercado Pago, com Pix e cartão de crédito. As opções e o parcelamento disponíveis aparecem na tela de pagamento.",
  },
  {
    question: "Meus dados de cartão ficam salvos na loja?",
    answer:
      "Não. Você digita os dados do cartão no ambiente seguro do Mercado Pago. A Nasil Vana Store não recebe nem armazena número de cartão ou código de segurança.",
  },
  {
    question: "Quando meu pedido é confirmado?",
    answer:
      "Assim que o Mercado Pago confirma o pagamento para a loja. Você recebe a confirmação e pode acompanhar o status na página do pedido.",
  },
  {
    question: "Como escolho o tamanho certo?",
    answer:
      "Cada produto mostra os tamanhos disponíveis e observações de caimento. Na dúvida, fale com a gente pelo WhatsApp antes de comprar — ajudamos você a escolher.",
  },
  {
    question: "Posso trocar ou devolver?",
    answer:
      "Sim. Para compras online, você tem 7 dias após o recebimento para desistir da compra, com reembolso integral. Veja todos os detalhes na página Trocas e devoluções.",
  },
  {
    question: "Por quanto tempo a peça fica reservada?",
    answer:
      "Ao finalizar o pedido, a peça fica reservada por tempo limitado enquanto aguardamos a confirmação do pagamento. Se o pagamento não for confirmado, a reserva é liberada automaticamente.",
  },
];
