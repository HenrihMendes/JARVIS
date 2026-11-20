import type { CSSProperties } from "react";
import { largest, mediaSrc, srcSet, type MediaLike } from "@/lib/media-url";

/**
 * Imagem responsiva com AVIF + WebP, largura/altura explícitas (CLS = 0),
 * placeholder desfocado e carregamento preguiçoso por padrão.
 */
export function Picture({
  media,
  sizes,
  alt,
  priority = false,
  className = "",
  imgClassName = "",
  fill = false,
  style,
  imgStyle,
  draggable,
}: {
  media: MediaLike;
  sizes: string;
  alt?: string;
  priority?: boolean;
  className?: string;
  imgClassName?: string;
  /** Preenche o contêiner (object-fit: cover) usando o ponto focal */
  fill?: boolean;
  style?: CSSProperties;
  imgStyle?: CSSProperties;
  draggable?: boolean;
}) {
  const fallback = mediaSrc(media.key, largest(media, 1280), "webp");
  const wrapperStyle: CSSProperties = {
    backgroundImage: media.blurDataUrl ? `url(${media.blurDataUrl})` : undefined,
    backgroundSize: "cover",
    backgroundPosition: `50% ${media.focalY ?? 30}%`,
    ...(fill ? {} : { aspectRatio: `${media.width} / ${media.height}` }),
    ...style,
  };
  return (
    <picture className={`block overflow-hidden bg-paper-2 ${fill ? "absolute inset-0" : ""} ${className}`} style={wrapperStyle}>
      <source type="image/avif" srcSet={srcSet(media, "avif")} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(media, "webp")} sizes={sizes} />
      <img
        src={fallback}
        alt={alt ?? media.alt ?? ""}
        width={media.width}
        height={media.height}
        loading={priority ? "eager" : "lazy"}
        fetchPriority={priority ? "high" : "auto"}
        decoding={priority ? "sync" : "async"}
        draggable={draggable}
        className={`block h-full w-full ${fill ? "object-cover" : ""} ${imgClassName}`}
        style={{ objectPosition: `50% ${media.focalY ?? 30}%`, ...imgStyle }}
      />
    </picture>
  );
}
