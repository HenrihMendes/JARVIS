/**
 * Catálogo inicial montado SOMENTE a partir das peças de divulgação enviadas pela loja.
 *
 * Regras seguidas:
 * - Preço, tamanho e cores: exatamente o que aparece nos pôsteres.
 * - Sem preço ou sem tamanho informado → produto fica como RASCUNHO (não aparece na loja).
 * - Composição de tecido: só quando o pôster informa (ex.: "algodão maquinetado").
 * - ESTOQUE: os pôsteres não informam quantidade. O seed cadastra 1 unidade por variação
 *   anunciada e marca o produto com uma nota interna para conferência no painel.
 */
export type SeedVariant = { color?: string; size?: string; stock?: number };
export type SeedImage = { crop: string; color?: string; alt: string; focalY?: number };
export type SeedProduct = {
  slug: string;
  name: string;
  subtitle?: string;
  category: string;
  status: "draft" | "active" | "coming_soon";
  price?: number;
  description: string;
  composition?: string;
  fitNotes?: string;
  featured?: boolean;
  isNew?: boolean;
  variants: SeedVariant[];
  images: SeedImage[];
  internalNotes: string;
};

const POSTER_NOTE =
  "Importado do pôster de divulgação. CONFIRME: estoque real (seed cadastrou 1 un. por variação), composição do tecido e cuidados de lavagem.";
const AI_NOTICE =
  "Imagens de divulgação. Cores e detalhes podem variar levemente em relação à peça.";

export const SEED_CATEGORIES = [
  {
    slug: "corsets",
    name: "Corsets",
    description: "Corsets em renda e estampas florais, com bojo estruturado e acabamento delicado.",
    seoTitle: "Corsets femininos | Nasil Vana Store",
    seoDescription: "Corsets femininos em renda e estampa floral. Compre online na Nasil Vana Store, loja de moda feminina em Sinop, MT.",
  },
  {
    slug: "conjuntos",
    name: "Conjuntos",
    description: "Conjuntos de alfaiataria para quem quer chegar pronta, do trabalho ao evento.",
    seoTitle: "Conjuntos femininos de alfaiataria | Nasil Vana Store",
    seoDescription: "Conjuntos femininos de alfaiataria com colete, blazer e calça pantalona. Moda feminina em Sinop, MT, com compra online.",
  },
  {
    slug: "vestidos",
    name: "Vestidos",
    description: "Vestidos com caimento estruturado e detalhes que valorizam a silhueta.",
    seoTitle: "Vestidos femininos | Nasil Vana Store",
    seoDescription: "Vestidos femininos elegantes para trabalho e ocasiões especiais. Compre online na Nasil Vana Store, em Sinop, MT.",
  },
  {
    slug: "blusas",
    name: "Blusas",
    description: "Blusas leves e femininas para compor looks do dia a dia.",
    seoTitle: "Blusas femininas | Nasil Vana Store",
    seoDescription: "Blusas femininas leves e sofisticadas. Moda feminina em Sinop, MT, com compra online e pagamento seguro.",
  },
  {
    slug: "saias",
    name: "Saias",
    description: "Saias midi com modelagem que acompanha o movimento.",
    seoTitle: "Saias femininas | Nasil Vana Store",
    seoDescription: "Saias femininas midi e elegantes. Compre online na Nasil Vana Store, loja de moda feminina em Sinop, MT.",
  },
];

export const SEED_COLORS: { name: string; hex?: string; swatch?: string }[] = [
  { name: "Preto", hex: "#141414" },
  { name: "Off-white", hex: "#EFE9DF" },
  { name: "Bege", hex: "#D8C3A5" },
  { name: "Azul serenity", hex: "#9DBCE3" },
  { name: "Azul", hex: "#7FA7DB" },
  { name: "Rosa", hex: "#E07CB8" },
  { name: "Amarelo", hex: "#EFE38A" },
  { name: "Berinjela", hex: "#2E2347" },
  { name: "Vinho", hex: "#5B1F22" },
  { name: "Verde sálvia", hex: "#A3B39E" },
  { name: "Floral azul", swatch: "radial-gradient(circle at 30% 30%, #3f63b0 0 22%, transparent 23%), radial-gradient(circle at 70% 65%, #6f8fd0 0 20%, transparent 21%), #f2f1ee" },
  { name: "Floral colorido", swatch: "radial-gradient(circle at 30% 30%, #c84d5e 0 22%, transparent 23%), radial-gradient(circle at 70% 65%, #d8a94a 0 20%, transparent 21%), #f4efe6" },
  { name: "Floral rosé", swatch: "radial-gradient(circle at 30% 30%, #c08872 0 22%, transparent 23%), radial-gradient(circle at 70% 65%, #7f8f6a 0 20%, transparent 21%), #efe6dc" },
  { name: "Floral creme", swatch: "radial-gradient(circle at 30% 30%, #d4a447 0 22%, transparent 23%), radial-gradient(circle at 70% 65%, #8fa3c2 0 20%, transparent 21%), #f3ead6" },
  { name: "Floral amarelo", swatch: "radial-gradient(circle at 30% 30%, #d6a33c 0 22%, transparent 23%), radial-gradient(circle at 70% 65%, #7c8b62 0 20%, transparent 21%), #f6f3ec" },
  { name: "Floral rosa", swatch: "radial-gradient(circle at 30% 30%, #c3478f 0 22%, transparent 23%), radial-gradient(circle at 70% 65%, #7c8b62 0 20%, transparent 21%), #f6f3ec" },
  { name: "Azul com floral", swatch: "linear-gradient(135deg, #9dbce3 0 55%, #3f63b0 55% 100%)" },
];

export const SEED_SIZES = ["PP", "P", "M", "G", "GG", "Único"];

const CORSET_FIT = "Tamanho único — veste até o M (40), conforme informado pela loja. Fale com a gente para tirar dúvidas de medidas.";

export const SEED_PRODUCTS: SeedProduct[] = [
  /* ------------------------------ Corsets (ativos) ------------------------------ */
  {
    slug: "corset-floral-com-alcas",
    name: "Corset Floral com Alças",
    subtitle: "Renda nas bordas · alças finas",
    category: "corsets",
    status: "active",
    price: 12000,
    featured: true,
    isNew: true,
    description:
      "Corset de estampa floral com bojo estruturado, alças finas e acabamento em renda nas bordas superior e inferior. Feminino e romântico, combina com calça de alfaiataria, saia ou jeans.",
    fitNotes: CORSET_FIT,
    variants: [
      { color: "Floral azul", size: "Único" },
      { color: "Floral colorido", size: "Único" },
    ],
    images: [
      { crop: "corset-floral-azul-produto", color: "Floral azul", alt: "Corset floral azul com alças finas e renda branca nas bordas, foto do produto" },
      { crop: "corset-floral-azul-modelo", color: "Floral azul", alt: "Modelo vestindo corset floral azul com alças e calça off-white", focalY: 40 },
      { crop: "corset-floral-colorido-produto", color: "Floral colorido", alt: "Corset de estampa floral colorida com alças finas, foto do produto" },
      { crop: "corset-floral-colorido-modelo", color: "Floral colorido", alt: "Modelo vestindo corset floral colorido com calça verde-oliva", focalY: 40 },
    ],
    internalNotes: POSTER_NOTE,
  },
  {
    slug: "corset-renda-jacquard",
    name: "Corset Renda Jacquard",
    subtitle: "Tomara que caia · barra em renda",
    category: "corsets",
    status: "active",
    price: 12000,
    featured: true,
    description:
      "Corset em tecido com textura floral, bojo estruturado e barra em renda que desenha a cintura em V. Sofisticado na versão preta, delicado na versão azul.",
    fitNotes: CORSET_FIT,
    variants: [
      { color: "Preto", size: "Único" },
      { color: "Azul", size: "Único" },
    ],
    images: [
      { crop: "corset-renda-preto-produto", color: "Preto", alt: "Corset preto com textura floral e renda nas bordas, foto do produto" },
      { crop: "corset-renda-preto-modelo", color: "Preto", alt: "Modelo vestindo corset preto tomara que caia com calça off-white", focalY: 35 },
      { crop: "corset-renda-azul-produto", color: "Azul", alt: "Corset azul com textura floral e renda nas bordas, foto do produto" },
      { crop: "corset-renda-azul-modelo", color: "Azul", alt: "Modelo vestindo corset azul tomara que caia com calça off-white", focalY: 35 },
    ],
    internalNotes: POSTER_NOTE,
  },
  {
    slug: "corset-renda-com-alcas",
    name: "Corset Renda com Alças",
    subtitle: "Rosa e amarelo",
    category: "corsets",
    status: "active",
    price: 12000,
    isNew: true,
    description:
      "Corset em renda com desenho floral tom sobre tom, alças finas e acabamento rendado nas bordas. Cores vibrantes para looks leves e femininos.",
    fitNotes: CORSET_FIT,
    variants: [
      { color: "Rosa", size: "Único" },
      { color: "Amarelo", size: "Único" },
    ],
    images: [
      { crop: "corset-alcas-rosa", color: "Rosa", alt: "Modelo vestindo corset rosa em renda com alças finas", focalY: 45 },
      { crop: "corset-alcas-amarelo", color: "Amarelo", alt: "Modelo vestindo corset amarelo em renda com alças finas", focalY: 45 },
    ],
    internalNotes: POSTER_NOTE,
  },
  {
    slug: "corset-floral-barbatanas",
    name: "Corset Floral com Barbatanas",
    subtitle: "Recortes aparentes · alças",
    category: "corsets",
    status: "active",
    price: 12000,
    featured: true,
    description:
      "Corset de estampa floral com barbatanas e recortes aparentes em vivo contrastante, bojo estruturado e alças. Um clássico romântico com ar vintage.",
    fitNotes: CORSET_FIT,
    variants: [
      { color: "Floral rosé", size: "Único" },
      { color: "Floral creme", size: "Único" },
    ],
    images: [
      { crop: "corset-barbatana-rose-produto", color: "Floral rosé", alt: "Corset floral rosé com barbatanas aparentes, foto do produto" },
      { crop: "corset-barbatana-rose-modelo", color: "Floral rosé", alt: "Modelo vestindo corset floral rosé com barbatanas aparentes", focalY: 40 },
      { crop: "corset-barbatana-creme-produto", color: "Floral creme", alt: "Corset floral creme com barbatanas aparentes, foto do produto" },
      { crop: "corset-barbatana-creme-modelo", color: "Floral creme", alt: "Modelo vestindo corset floral creme com barbatanas aparentes", focalY: 40 },
    ],
    internalNotes: POSTER_NOTE,
  },
  {
    slug: "corset-renda-bege",
    name: "Corset Renda Bege",
    subtitle: "Tomara que caia",
    category: "corsets",
    status: "active",
    price: 12000,
    description:
      "Corset tomara que caia em tecido com textura floral bege, bojo estruturado e renda delicada nas bordas. Neutro e elegante, combina com tudo.",
    fitNotes: CORSET_FIT,
    variants: [{ color: "Bege", size: "Único" }],
    images: [
      { crop: "corset-bege-modelo", color: "Bege", alt: "Modelo vestindo corset bege tomara que caia com renda nas bordas", focalY: 45 },
      { crop: "corset-bege-produto", color: "Bege", alt: "Corset bege com textura floral e renda, foto do produto" },
    ],
    internalNotes: POSTER_NOTE,
  },
  {
    slug: "corset-renda-azul-floral",
    name: "Corset Renda Azul com Floral",
    subtitle: "Renda e estampa · alças",
    category: "corsets",
    status: "active",
    price: 12000,
    description:
      "Corset que combina renda azul com recortes de estampa floral no bojo e no centro, com alças finas e acabamento rendado.",
    fitNotes: CORSET_FIT,
    variants: [{ color: "Azul com floral", size: "Único" }],
    images: [
      { crop: "corset-azul-floral-modelo", color: "Azul com floral", alt: "Modelo vestindo corset em renda azul com recortes de estampa floral", focalY: 50 },
    ],
    internalNotes: POSTER_NOTE,
  },
  {
    slug: "corset-floral-tomara-que-caia",
    name: "Corset Floral Tomara que Caia",
    subtitle: "Romântico · renda nas bordas",
    category: "corsets",
    status: "active",
    price: 12000,
    description:
      "Corset tomara que caia de base branca com estampa floral, bojo estruturado e renda nas bordas. Disponível em flores amarelas ou rosas.",
    fitNotes: CORSET_FIT,
    variants: [
      { color: "Floral amarelo", size: "Único" },
      { color: "Floral rosa", size: "Único" },
    ],
    images: [
      { crop: "corset-tqc-amarelo", color: "Floral amarelo", alt: "Modelo vestindo corset tomara que caia com estampa de flores amarelas", focalY: 30 },
      { crop: "corset-tqc-rosa", color: "Floral rosa", alt: "Modelo vestindo corset tomara que caia com estampa de flores rosas", focalY: 30 },
    ],
    internalNotes: POSTER_NOTE,
  },

  /* --------------------------- Vestidos e conjuntos --------------------------- */
  {
    slug: "vestido-chemise-com-cinto",
    name: "Vestido Chemise com Cinto",
    subtitle: "Gola alfaiataria · fivela dourada",
    category: "vestidos",
    status: "active",
    price: 39990,
    featured: true,
    description:
      "Vestido sem mangas com gola de alfaiataria, abotoamento frontal e cinto com fivela em metal dourado que marca a cintura. Comprimento na altura dos joelhos. Do escritório ao jantar.",
    fitNotes: "Disponível no preto (tamanho G) e no off-white (tamanho M), conforme estoque informado pela loja.",
    variants: [
      { color: "Preto", size: "G" },
      { color: "Off-white", size: "M" },
    ],
    images: [
      { crop: "vestido-preto", color: "Preto", alt: "Modelo vestindo vestido chemise preto sem mangas com cinto de fivela dourada", focalY: 25 },
      { crop: "vestido-preto-costas", color: "Preto", alt: "Costas do vestido chemise preto com cinto", focalY: 30 },
      { crop: "vestido-offwhite", color: "Off-white", alt: "Modelo vestindo vestido chemise off-white sem mangas com cinto de fivela dourada", focalY: 25 },
      { crop: "vestido-offwhite-costas", color: "Off-white", alt: "Costas do vestido chemise off-white com cinto", focalY: 30 },
    ],
    internalNotes: POSTER_NOTE,
  },
  {
    slug: "conjunto-colete-e-calca-alfaiataria",
    name: "Conjunto Colete e Calça Alfaiataria",
    subtitle: "Berinjela · peça exclusiva",
    category: "conjuntos",
    status: "active",
    price: 25500,
    featured: true,
    description:
      "Conjunto de colete alongado com lapela, bolsos com aba e botões dourados, acompanhado de calça pantalona de alfaiataria com vinco. Uma composição de presença para o trabalho e eventos.",
    fitNotes: "Tamanho G, conforme informado pela loja.",
    variants: [{ color: "Berinjela", size: "G" }],
    images: [
      { crop: "colete-berinjela", color: "Berinjela", alt: "Modelo vestindo conjunto de colete e calça pantalona de alfaiataria cor berinjela", focalY: 20 },
    ],
    internalNotes: `${POSTER_NOTE} O cinto azul da foto parece ser acessório de produção — confirme se acompanha o conjunto.`,
  },
  {
    slug: "blusa-bordada-manga-bufante",
    name: "Blusa Bordada Manga Bufante",
    subtitle: "Bordado folhagem",
    category: "blusas",
    status: "active",
    price: 14000,
    isNew: true,
    description:
      "Blusa off-white de mangas curtas bufantes com elástico e bordado de folhagem verde no decote. Leve e feminina, forma a combinação perfeita com a Saia Midi com Botões.",
    fitNotes: "Tamanho P, conforme informado pela loja.",
    variants: [{ color: "Off-white", size: "P" }],
    images: [
      { crop: "blusa-bordada", color: "Off-white", alt: "Modelo vestindo blusa off-white de manga bufante com bordado verde no decote", focalY: 30 },
      { crop: "blusa-saia-look", color: "Off-white", alt: "Look completo: blusa bordada off-white com saia midi verde sálvia", focalY: 20 },
    ],
    internalNotes: POSTER_NOTE,
  },
  {
    slug: "saia-midi-com-botoes",
    name: "Saia Midi com Botões",
    subtitle: "Algodão maquinetado · fenda frontal",
    category: "saias",
    status: "active",
    price: 38990,
    composition: "Algodão maquinetado (conforme divulgação da loja).",
    description:
      "Saia midi de cintura alta em algodão maquinetado verde sálvia, com abotoamento lateral e fenda frontal. Movimento e elegância para o dia a dia.",
    fitNotes: "Tamanho P, conforme informado pela loja.",
    variants: [{ color: "Verde sálvia", size: "P" }],
    images: [
      { crop: "saia-midi", color: "Verde sálvia", alt: "Saia midi verde sálvia com botões e fenda frontal, vestida pela modelo", focalY: 30 },
      { crop: "blusa-saia-look", color: "Verde sálvia", alt: "Look completo: saia midi verde sálvia com blusa bordada off-white", focalY: 20 },
    ],
    internalNotes: `${POSTER_NOTE} O pôster lista "SAIA P P" — confirme se são 2 unidades.`,
  },

  /* ----------------------- Rascunhos (faltam informações) ----------------------- */
  {
    slug: "conjunto-alfaiataria-com-fivela",
    name: "Conjunto Alfaiataria com Fivela",
    subtitle: "Blazer transpassado · calça pantalona",
    category: "conjuntos",
    status: "draft",
    price: 21500,
    description:
      "Blazer curto transpassado com fivela lateral e acabamento assimétrico, acompanhado de calça pantalona de alfaiataria com vinco.",
    variants: [{ color: "Preto" }, { color: "Azul serenity" }, { color: "Bege" }],
    images: [
      { crop: "fivela-azul", color: "Azul serenity", alt: "Modelo vestindo conjunto de alfaiataria azul serenity com blazer de fivela e calça pantalona", focalY: 20 },
      { crop: "fivela-bege", color: "Bege", alt: "Modelo vestindo conjunto de alfaiataria bege com blazer de fivela e calça pantalona", focalY: 20 },
      { crop: "fivela-preto", color: "Preto", alt: "Modelo vestindo conjunto de alfaiataria preto com blazer de fivela", focalY: 20 },
      { crop: "fivela-preto-detalhe", color: "Preto", alt: "Detalhe da fivela lateral do blazer preto", focalY: 50 },
    ],
    internalNotes:
      "RASCUNHO: o pôster informa R$ 215,00 apenas para o preto e não informa tamanhos. Confirme tamanhos, estoque e preço das cores azul e bege antes de publicar.",
  },
  {
    slug: "conjunto-assimetrico-vinho",
    name: "Conjunto Assimétrico Vinho",
    subtitle: "Top de lapela assimétrica · calça",
    category: "conjuntos",
    status: "draft",
    description: "Top de alça única com lapela assimétrica e calça de alfaiataria em tom vinho.",
    variants: [{ color: "Vinho" }],
    images: [{ crop: "conjunto-vinho", color: "Vinho", alt: "Modelo vestindo conjunto vinho com top assimétrico de lapela e calça de alfaiataria", focalY: 25 }],
    internalNotes: "RASCUNHO: sem preço e sem tamanhos no material enviado.",
  },
  {
    slug: "corselet-com-renda",
    name: "Corselet com Renda",
    subtitle: "Várias cores e modelos",
    category: "corsets",
    status: "coming_soon",
    description:
      "Corselet com renda nas bordas e amarração nas costas. Chega em breve em várias cores: preto, branco, vermelho, rosa, bege, azul-marinho, onça, verde e floral.",
    variants: [],
    images: [{ crop: "corselet-floral", alt: "Modelo vestindo corselet floral com renda branca nas bordas", focalY: 40 }],
    internalNotes:
      "EM BREVE: pôster \"Vai chegar na loja\". Sem preço/tamanhos. Cadastre as variações e mude para Ativo quando chegar.",
  },
];
