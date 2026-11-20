import sharp, { type Metadata as SharpMetadata } from "sharp";
import { randomUUID } from "node:crypto";
import { putObject } from "./storage";

/**
 * Pipeline de imagens:
 * 1. Decodifica com sharp (rejeita qualquer arquivo que não seja imagem real — a extensão e o
 *    content-type enviados pelo navegador NÃO são confiáveis).
 * 2. Limita dimensões (proteção contra "decompression bombs").
 * 3. Corrige rotação EXIF e REMOVE metadados (GPS, câmera) — privacidade.
 * 4. Reencoda em AVIF + WebP em várias larguras: o arquivo original nunca é publicado,
 *    o que também neutraliza arquivos poliglotas/maliciosos.
 */
export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;
const ALLOWED = new Set(["jpeg", "png", "webp", "avif", "heif"]);
/** Em plataformas serverless (Netlify) use IMAGE_MAX_WIDTH=1600 para caber no tempo-limite da função. */
const MAX_WIDTH = Math.max(640, Number(process.env.IMAGE_MAX_WIDTH) || 2000);
const WIDTHS = [320, 480, 640, 960, 1280, 1600, 2000].filter((w) => w <= MAX_WIDTH);
const MAX_PIXELS = 60_000_000;

export class ImageValidationError extends Error {}

export type ProcessedImage = {
  key: string;
  width: number;
  height: number;
  widths: number[];
  blurDataUrl: string;
  bytes: number;
};

export async function processAndStoreImage(input: Buffer, opts: { minSize?: number } = {}): Promise<ProcessedImage> {
  const minSize = opts.minSize ?? 300;
  if (input.byteLength === 0) throw new ImageValidationError("Arquivo vazio.");
  if (input.byteLength > MAX_UPLOAD_BYTES) throw new ImageValidationError("Imagem maior que 15 MB.");

  let meta: SharpMetadata;
  try {
    meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).metadata();
  } catch {
    throw new ImageValidationError("Arquivo não é uma imagem válida.");
  }
  if (!meta.format || !ALLOWED.has(meta.format)) {
    throw new ImageValidationError("Formato não suportado. Envie JPG, PNG, WebP, AVIF ou HEIC.");
  }
  if (!meta.width || !meta.height) throw new ImageValidationError("Dimensões inválidas.");
  if (meta.width < minSize || meta.height < minSize) {
    throw new ImageValidationError(`Imagem muito pequena (mínimo ${minSize} × ${minSize} px).`);
  }

  const base = sharp(input, { limitInputPixels: MAX_PIXELS, failOn: "error" }).rotate();
  const oriented = await base.clone().toBuffer({ resolveWithObject: true });
  const width = oriented.info.width;
  const height = oriented.info.height;

  let widths = WIDTHS.filter((w) => w <= width);
  if (widths.length === 0 || (widths[widths.length - 1] < width * 0.9 && widths[widths.length - 1] < MAX_WIDTH)) widths = [...widths, Math.min(width, MAX_WIDTH)];
  widths = [...new Set(widths)].sort((a, b) => a - b);

  const key = `media/${randomUUID()}`;
  let bytes = 0;
  for (const w of widths) {
    const resized = sharp(oriented.data).resize({ width: w, withoutEnlargement: true });
    const [avif, webp] = await Promise.all([
      resized.clone().avif({ quality: 52, effort: 2 }).toBuffer(),
      resized.clone().webp({ quality: 78, effort: 4 }).toBuffer(),
    ]);
    bytes += avif.byteLength + webp.byteLength;
    await putObject(`${key}/${w}.avif`, avif, "image/avif");
    await putObject(`${key}/${w}.webp`, webp, "image/webp");
  }

  const blur = await sharp(oriented.data).resize({ width: 16 }).blur(1).webp({ quality: 40 }).toBuffer();
  return {
    key,
    width,
    height,
    widths,
    blurDataUrl: `data:image/webp;base64,${blur.toString("base64")}`,
    bytes,
  };
}

export function mediaFiles(widths: number[]) {
  return widths.flatMap((w) => [`${w}.avif`, `${w}.webp`]);
}
