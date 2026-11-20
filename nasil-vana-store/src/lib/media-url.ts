/**
 * URL pública das imagens. Funciona no servidor e no navegador.
 * Local: servido por /media/[...key] · S3/CDN: NEXT_PUBLIC_MEDIA_BASE_URL
 */
export const MEDIA_BASE = (process.env.NEXT_PUBLIC_MEDIA_BASE_URL || "/media").replace(/\/$/, "");

export type MediaLike = {
  key: string;
  width: number;
  height: number;
  widths: number[];
  blurDataUrl?: string | null;
  alt?: string | null;
  focalY?: number | null;
};

export const mediaSrc = (key: string, w: number, ext: "avif" | "webp" = "webp") => `${MEDIA_BASE}/${key}/${w}.${ext}`;

export const srcSet = (m: Pick<MediaLike, "key" | "widths">, ext: "avif" | "webp") =>
  m.widths.map((w) => `${mediaSrc(m.key, w, ext)} ${w}w`).join(", ");

export function largest(m: Pick<MediaLike, "widths">, max = Infinity) {
  const ok = m.widths.filter((w) => w <= max);
  return ok.length ? Math.max(...ok) : Math.min(...m.widths);
}
