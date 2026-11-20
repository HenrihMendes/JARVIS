import sharp from "sharp";

/**
 * Tratamento editorial aplicado a TODAS as fotos de divulgação para dar unidade visual:
 * - ampliação 2× (Lanczos) só até o limite útil;
 * - nitidez moderada (unsharp mask) para recuperar contorno;
 * - gradação quente e levemente dessaturada (tons da marca: areia/camurça), pretos suavemente erguidos;
 * - grão fino de filme, que disfarça o aspecto "liso demais" de imagens geradas por IA.
 * Não altera formas, cores das peças de forma perceptível nem detalhes do produto.
 */
export async function editorialGrade(input: Buffer): Promise<Buffer> {
  const meta = await sharp(input).metadata();
  const w = meta.width!;
  const target = Math.min(1400, Math.round(w * 2));
  const base = sharp(input)
    .resize({ width: target, kernel: "lanczos3" })
    .sharpen({ sigma: 1.1, m1: 0.6, m2: 1.8 })
    .modulate({ saturation: 0.9, brightness: 1.01 })
    .linear([0.95, 0.95, 0.95], [10, 8, 6]) // ergue pretos e aquece levemente
    .recomb([
      [1.03, 0.0, -0.01],
      [0.0, 1.0, 0.0],
      [-0.01, 0.0, 0.97],
    ]);
  const { data, info } = await base.raw().toBuffer({ resolveWithObject: true });
  // Grão monocromático determinístico
  let seed = 1337;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  const ch = info.channels;
  for (let i = 0; i < data.length; i += ch) {
    const n = (rnd() + rnd() - 1) * 7;
    for (let c = 0; c < 3; c++) data[i + c] = Math.max(0, Math.min(255, data[i + c] + n));
  }
  return sharp(data, { raw: info }).png().toBuffer();
}
