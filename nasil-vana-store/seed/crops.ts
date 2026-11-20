/**
 * Recortes das fotografias fornecidas pela loja.
 *
 * Os arquivos originais são peças de divulgação (pôsteres) com textos e preços
 * aplicados sobre a foto. Para o catálogo usamos apenas a área da fotografia,
 * sem textos. Coordenadas em pixels do arquivo original.
 *
 * IMPORTANTE: várias dessas imagens aparentam ser geradas/editadas por IA.
 * Substitua por fotografias reais das peças assim que possível (ver docs/FOTOGRAFIA.md).
 */
export type Crop = {
  out: string;
  src: string;
  left: number;
  top: number;
  width: number;
  height: number;
};

const c = (out: string, src: string, left: number, top: number, right: number, bottom: number): Crop => ({
  out,
  src,
  left,
  top,
  width: right - left,
  height: bottom - top,
});

export const CROPS: Crop[] = [
  // Conjunto alfaiataria com fivela
  c("fivela-azul", "conjunto-fivela-azul.jpg", 0, 0, 945, 1280),
  c("fivela-bege", "conjunto-fivela-bege.jpg", 0, 24, 763, 1033),
  c("fivela-preto", "poster-conjunto-fivela-preto.jpg", 318, 214, 676, 1010),
  c("fivela-preto-detalhe", "poster-conjunto-fivela-preto.jpg", 52, 690, 282, 900),

  // Vestido chemise com cinto
  c("vestido-preto", "poster-vestido-preto.jpg", 0, 0, 392, 1036),
  c("vestido-preto-costas", "poster-vestido-preto.jpg", 588, 796, 826, 1166),
  c("vestido-offwhite", "poster-vestido-offwhite.jpg", 0, 0, 388, 1030),
  c("vestido-offwhite-costas", "poster-vestido-offwhite.jpg", 584, 794, 820, 1160),

  // Conjunto colete + calça (berinjela)
  c("colete-berinjela", "poster-colete-berinjela.jpg", 0, 0, 512, 1280),

  // Conjunto assimétrico vinho (sem preço informado)
  c("conjunto-vinho", "poster-conjunto-vinho.jpg", 218, 0, 708, 1152),

  // Blusa bordada + saia midi
  c("blusa-saia-look", "poster-blusa-saia.jpg", 268, 140, 595, 1130),
  c("blusa-bordada", "poster-blusa-saia.jpg", 275, 140, 595, 520),
  c("saia-midi", "poster-blusa-saia.jpg", 262, 480, 595, 1130),

  // Corselet com renda (em breve)
  c("corselet-floral", "poster-corselet-em-breve.jpg", 0, 0, 410, 860),

  // Corset floral com alças — azul / colorido
  c("corset-floral-azul-modelo", "poster-corset-floral-alcas.jpg", 0, 230, 315, 760),
  c("corset-floral-colorido-modelo", "poster-corset-floral-alcas.jpg", 555, 230, 854, 760),
  c("corset-floral-azul-produto", "poster-corset-floral-alcas.jpg", 42, 867, 358, 1198),
  c("corset-floral-colorido-produto", "poster-corset-floral-alcas.jpg", 362, 867, 662, 1196),

  // Corset renda jacquard — preto / azul
  c("corset-renda-preto-modelo", "poster-corset-renda-preto-azul.jpg", 0, 300, 310, 790),
  c("corset-renda-azul-modelo", "poster-corset-renda-preto-azul.jpg", 552, 300, 854, 790),
  c("corset-renda-preto-produto", "poster-corset-renda-preto-azul.jpg", 63, 895, 390, 1208),
  c("corset-renda-azul-produto", "poster-corset-renda-preto-azul.jpg", 395, 890, 668, 1205),

  // Corset renda com alças — rosa / amarelo
  c("corset-alcas-rosa", "poster-corset-rosa-amarelo.jpg", 0, 360, 436, 1280),
  c("corset-alcas-amarelo", "poster-corset-rosa-amarelo.jpg", 612, 360, 1024, 1280),

  // Corset floral barbatanas aparentes — rosé / creme
  c("corset-barbatana-rose-modelo", "poster-corset-barbatanas.jpg", 0, 250, 316, 800),
  c("corset-barbatana-creme-modelo", "poster-corset-barbatanas.jpg", 552, 250, 854, 800),
  c("corset-barbatana-rose-produto", "poster-corset-barbatanas.jpg", 190, 862, 432, 1112),
  c("corset-barbatana-creme-produto", "poster-corset-barbatanas.jpg", 444, 862, 684, 1112),

  // Corset renda bege (tomara que caia) e corset renda azul com floral
  c("corset-bege-modelo", "poster-corset-bege-azul.jpg", 0, 0, 350, 700),
  c("corset-bege-produto", "poster-corset-bege-azul.jpg", 445, 195, 817, 495),
  c("corset-azul-floral-modelo", "poster-corset-bege-azul.jpg", 455, 645, 748, 1195),

  // Corset floral tomara que caia — amarelo / rosa
  c("corset-tqc-amarelo", "poster-corset-floral-tqc.jpg", 0, 480, 426, 1280),
  c("corset-tqc-rosa", "poster-corset-floral-tqc.jpg", 430, 480, 854, 1280),
];
