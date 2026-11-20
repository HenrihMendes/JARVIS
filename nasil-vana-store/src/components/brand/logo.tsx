import type { CSSProperties } from "react";
import { LOGO_MONO } from "./logo-paths";

/**
 * Logotipo oficial vetorizado. Usamos máscara CSS para herdar a cor do texto
 * (preto sobre papel, papel sobre foto) mantendo o arquivo SVG em cache do navegador.
 */
// "full-small": versão para tamanhos pequenos (cabeçalho), com traços levemente afinados para
// abrir o interior de letras como "a", "o" e "s", que fechavam em telas pequenas.
const RATIO_SMALL = 4167 / 1204;
const RATIOS = { full: 4206 / 1214, word: 2490 / 1200, "full-small": RATIO_SMALL } as const;

export function Logo({
  variant = "word",
  className = "",
  style,
  title = "Nasil Vana Store",
}: {
  variant?: "full" | "word" | "full-small";
  className?: string;
  style?: CSSProperties;
  title?: string;
}) {
  const url = `url(/brand/logo-${variant}.svg)`;
  return (
    <span
      role="img"
      aria-label={title}
      className={`inline-block bg-current ${className}`}
      style={{
        aspectRatio: RATIOS[variant],
        WebkitMaskImage: url,
        maskImage: url,
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskSize: "contain",
        maskSize: "contain",
        ...style,
      }}
    />
  );
}

export function Monogram({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox={LOGO_MONO.viewBox} className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <path d={LOGO_MONO.d} fill="currentColor" />
    </svg>
  );
}
