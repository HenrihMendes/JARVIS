import type { Swatch as S } from "@/lib/catalog";

export function SwatchDot({ color, size = 12, className = "" }: { color: Pick<S, "hex" | "swatch" | "name">; size?: number; className?: string }) {
  return (
    <span
      title={color.name}
      className={`inline-block rounded-full ring-1 ring-black/15 ${className}`}
      style={{ width: size, height: size, background: color.swatch ?? color.hex ?? "#ccc" }}
    />
  );
}
