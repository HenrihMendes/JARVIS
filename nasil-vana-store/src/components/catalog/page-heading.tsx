import Link from "next/link";
import { JsonLd } from "@/components/seo/json-ld";
import { breadcrumbJsonLd } from "@/lib/seo";

export function Breadcrumbs({ items }: { items: { name: string; path: string }[] }) {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd(items)} />
      <nav aria-label="Trilha de navegação" className="text-[0.75rem] text-stone">
        <ol className="flex flex-wrap items-center gap-2">
          {items.map((it, i) => (
            <li key={it.path} className="flex items-center gap-2">
              {i > 0 && <span aria-hidden="true">/</span>}
              {i === items.length - 1 ? (
                <span aria-current="page" className="text-ink">{it.name}</span>
              ) : (
                <Link href={it.path} className="hover:text-ink">{it.name}</Link>
              )}
            </li>
          ))}
        </ol>
      </nav>
    </>
  );
}

export function PageHeading({ eyebrow, title, description, crumbs }: { eyebrow?: string; title: React.ReactNode; description?: string | null; crumbs: { name: string; path: string }[] }) {
  return (
    <header className="mx-auto max-w-[1600px] px-[var(--gutter)] pb-10 pt-8 sm:pt-12">
      <Breadcrumbs items={crumbs} />
      <div className="mt-8 grid items-end gap-6 lg:grid-cols-12">
        <div className="lg:col-span-8">
          {eyebrow && <p className="eyebrow fade-up text-stone">{eyebrow}</p>}
          <h1 className="display mt-3 text-[clamp(3rem,8vw,7rem)]">
            <span className="reveal-line"><span>{title}</span></span>
          </h1>
        </div>
        {description && <p className="fade-up max-w-md text-stone lg:col-span-4" style={{ ["--d" as string]: 200 }}>{description}</p>}
      </div>
    </header>
  );
}
