import Link from "next/link";
import { Monogram } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <div className="relative mx-auto flex min-h-[70vh] max-w-[1100px] flex-col justify-center overflow-hidden px-[var(--gutter)] py-20">
      <Monogram className="pointer-events-none absolute -right-10 top-1/2 h-[90%] w-auto -translate-y-1/2 text-ink/[0.04]" />
      <p className="eyebrow text-stone">Erro 404</p>
      <h1 className="display mt-4 text-[clamp(3rem,8vw,6.5rem)]">
        Esta página <em>saiu de cena.</em>
      </h1>
      <p className="mt-6 max-w-md text-stone">O endereço pode ter mudado ou a peça não está mais disponível.</p>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/loja" className="btn btn-primary">Ver a loja</Link>
        <Link href="/" className="btn btn-outline">Página inicial</Link>
      </div>
    </div>
  );
}
