"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Logo, Monogram } from "@/components/brand/logo";
import { IconBag, IconClose, IconMenu, IconSearch, IconArrow, IconInstagram, IconWhatsapp } from "@/components/ui/icons";
import { Sheet } from "@/components/ui/sheet";
import { useCart } from "@/components/cart/cart-context";

import { Picture } from "@/components/ui/picture";
import type { MediaLike } from "@/lib/media-url";

export type NavCategory = { slug: string; name: string; cover?: MediaLike | null; count?: number };

export function Header({
  categories,
  whatsappHref,
  instagramHref,
}: {
  categories: NavCategory[];
  whatsappHref: string | null;
  instagramHref: string | null;
}) {
  const { cart, open: openCart } = useCart();
  const pathname = usePathname();
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const lastY = useRef(0);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 8);
      // Só decide após um deslocamento claro (evita o "pisca-pisca" com rolagem suave):
      // descendo → esconde; subindo → mostra; perto do topo → sempre visível.
      const delta = y - lastY.current;
      if (y < 120) {
        setHidden(false);
        lastY.current = y;
      } else if (Math.abs(delta) > 12) {
        setHidden(delta > 0);
        lastY.current = y;
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Fecha menu/busca ao navegar
  const [prevPath, setPrevPath] = useState(pathname);
  if (prevPath !== pathname) {
    setPrevPath(pathname);
    setMenu(false);
    setSearch(false);
  }

  const primary = categories.slice(0, 4);
  const count = cart?.count ?? 0;
  const isActive = (href: string) => (href === "/loja" ? pathname === "/loja" : pathname.startsWith(href));

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-[transform,background-color,box-shadow] duration-500 ease-[var(--ease-editorial)] ${
          hidden && !menu ? "-translate-y-full" : "translate-y-0"
        } ${scrolled ? "bg-paper shadow-[0_1px_0_var(--color-line)]" : "bg-paper"}`}
      >
        <a href="#conteudo" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:bg-ink focus:px-4 focus:py-2 focus:text-paper">
          Pular para o conteúdo
        </a>
        <div className="mx-auto grid h-[var(--header-h)] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-[var(--gutter)]">
          {/* Esquerda */}
          <div className="flex items-center gap-7">
            <button
              type="button"
              onClick={() => setMenu(true)}
              className="-ml-2.5 grid h-11 w-11 place-items-center lg:hidden"
              aria-label="Abrir menu"
              aria-expanded={menu}
            >
              <IconMenu size={22} />
            </button>
            <nav aria-label="Principal" className="hidden lg:block">
              <ul className="flex items-center gap-7 text-[0.75rem] font-medium uppercase tracking-[0.16em]">
                <li>
                  <Link href="/loja" className="link-u" aria-current={isActive("/loja") ? "page" : undefined}>
                    Loja
                  </Link>
                </li>
                {primary.map((c) => (
                  <li key={c.slug}>
                    <Link href={`/loja/${c.slug}`} className="link-u" aria-current={isActive(`/loja/${c.slug}`) ? "page" : undefined}>
                      {c.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          </div>

          {/* Centro */}
          <Link href="/" aria-label="Nasil Vana Store — página inicial" className="group flex items-center justify-center">
            <Logo variant="full-small" className="h-10 lg:h-11" />
          </Link>

          {/* Direita */}
          <div className="flex items-center justify-end gap-1 sm:gap-3">
            <Link href="/nossa-historia" className="link-u mr-3 hidden text-[0.75rem] font-medium uppercase tracking-[0.16em] xl:inline">
              Nossa história
            </Link>
            <button type="button" onClick={() => setSearch(true)} className="grid h-11 w-11 place-items-center" aria-label="Buscar">
              <IconSearch size={21} />
            </button>
            <button
              type="button"
              id="bag-button"
              onClick={openCart}
              className="relative -mr-2.5 grid h-11 w-11 place-items-center"
              aria-label={`Abrir sacola${count ? `, ${count} ${count === 1 ? "item" : "itens"}` : ""}`}
            >
              <IconBag size={22} />
              {count > 0 && (
                <span
                  key={count}
                  className="absolute right-1 top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full bg-ink px-1 text-[10px] font-medium text-paper tabular [animation:fade-up_.4s_var(--ease-editorial)]"
                >
                  {count}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Menu em tela cheia (celular) */}
      <Sheet open={menu} onClose={() => setMenu(false)} side="full" label="Menu" className="!bg-ink !text-paper">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between px-6 py-4">
            <Monogram className="h-7 w-auto text-paper" />
            <button type="button" onClick={() => setMenu(false)} className="-mr-2 grid h-11 w-11 place-items-center" aria-label="Fechar menu">
              <IconClose />
            </button>
          </div>
          <nav aria-label="Menu" className="flex-1 overflow-y-auto px-6 pt-4">
            <ul className="divide-y divide-paper/10 border-y border-paper/10">
              {[{ slug: "", name: "Toda a loja", cover: null, count: undefined } as NavCategory, ...categories].map((c, i) => (
                <li key={c.slug || "all"} className="overflow-hidden">
                  <Link
                    href={c.slug ? `/loja/${c.slug}` : "/loja"}
                    className="group flex items-center gap-4 py-4"
                    style={{ animation: menu ? `rise .9s var(--ease-editorial) ${120 + i * 70}ms both` : undefined }}
                  >
                    <span className="relative h-16 w-12 shrink-0 overflow-hidden bg-paper/10">
                      {c.cover ? <Picture media={c.cover} sizes="60px" fill alt="" /> : <Monogram className="absolute inset-3 h-auto w-auto text-paper/40" />}
                    </span>
                    <span className="display flex-1 text-[2.1rem] leading-none">{c.name}</span>
                    <span className="eyebrow text-paper/50">{c.count != null ? String(c.count).padStart(2, "0") : ""}</span>
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-8 grid grid-cols-2 gap-3 text-[0.8125rem] uppercase tracking-[0.14em] text-paper/70">
              <li><Link href="/nossa-historia">Nossa história</Link></li>
              <li><Link href="/perguntas-frequentes">Dúvidas</Link></li>
              <li><Link href="/trocas-e-devolucoes">Trocas</Link></li>
              <li><Link href="/contato">Contato</Link></li>
            </ul>
          </nav>
          <div className="flex gap-3 border-t border-paper/10 px-6 py-5">
            {whatsappHref && (
              <a href={whatsappHref} target="_blank" rel="noopener" className="btn btn-light flex-1 !min-h-11 !px-3">
                <IconWhatsapp size={18} /> WhatsApp
              </a>
            )}
            {instagramHref && (
              <a href={instagramHref} target="_blank" rel="noopener" className="btn flex-1 !min-h-11 border-paper/40 !px-3 text-paper">
                <IconInstagram size={18} /> Instagram
              </a>
            )}
          </div>
        </div>
      </Sheet>

      <SearchSheet open={search} onClose={() => setSearch(false)} categories={categories} />
    </>
  );
}

function SearchSheet({ open, onClose, categories }: { open: boolean; onClose: () => void; categories: NavCategory[] }) {
  const router = useRouter();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) window.setTimeout(() => input.current?.focus(), 60);
  }, [open]);
  return (
    <Sheet open={open} onClose={onClose} side="top" label="Buscar na loja">
      <div className="mx-auto max-w-5xl px-[var(--gutter)] pb-10 pt-6">
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className="-mr-2 grid h-11 w-11 place-items-center" aria-label="Fechar busca">
            <IconClose />
          </button>
        </div>
        <form
          role="search"
          action="/loja"
          onSubmit={(e) => {
            e.preventDefault();
            const q = new FormData(e.currentTarget).get("q")?.toString().trim();
            if (q) router.push(`/loja?q=${encodeURIComponent(q)}`);
            onClose();
          }}
          className="flex items-end gap-4 border-b border-ink pb-3"
        >
          <label htmlFor="busca" className="sr-only">
            O que você procura?
          </label>
          <input
            ref={input}
            id="busca"
            name="q"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            maxLength={80}
            placeholder="O que você procura?"
            className="display w-full bg-transparent text-3xl placeholder:text-mist focus:outline-none sm:text-5xl"
          />
          <button type="submit" className="mb-1 grid h-11 w-11 shrink-0 place-items-center" aria-label="Buscar">
            <IconArrow size={26} />
          </button>
        </form>
        <div className="mt-6 flex flex-wrap gap-2">
          <span className="eyebrow mr-2 self-center text-stone">Sugestões</span>
          {categories.map((c) => (
            <Link key={c.slug} href={`/loja/${c.slug}`} onClick={onClose} className="rounded-full border border-line px-4 py-2 text-sm hover:border-ink">
              {c.name}
            </Link>
          ))}
        </div>
      </div>
    </Sheet>
  );
}

/** Versão estática (sem hooks) usada enquanto os dados do cabeçalho carregam — mesma altura, sem CLS. */
export function HeaderShell() {
  return (
    <header className="sticky top-0 z-40 bg-paper">
      <div className="mx-auto grid h-[var(--header-h)] max-w-[1600px] grid-cols-[1fr_auto_1fr] items-center px-[var(--gutter)]">
        <span />
        <Link href="/" aria-label="Nasil Vana Store — página inicial" className="flex items-center justify-center">
          <Logo variant="full-small" className="h-10 lg:h-11" />
        </Link>
        <span />
      </div>
    </header>
  );
}
