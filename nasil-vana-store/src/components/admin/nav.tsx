"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Monogram } from "@/components/brand/logo";
import { IconMenu, IconClose } from "@/components/ui/icons";
import { logoutAction } from "@/app/admin/actions/auth";

const LINKS = [
  { href: "/admin", label: "Visão geral" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/produtos", label: "Produtos" },
  { href: "/admin/categorias", label: "Categorias" },
  { href: "/admin/atributos", label: "Cores e tamanhos" },
  { href: "/admin/cupons", label: "Cupons" },
  { href: "/admin/frete", label: "Frete" },
  { href: "/admin/clientes", label: "Clientes" },
  { href: "/admin/banners", label: "Banners da home" },
  { href: "/admin/paginas", label: "Páginas e FAQ" },
  { href: "/admin/newsletter", label: "Newsletter" },
  { href: "/admin/configuracoes", label: "Configurações" },
];

export function AdminNav({ name, role }: { name: string; role: "owner" | "staff" }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const links = role === "owner" ? [...LINKS, { href: "/admin/usuarios", label: "Usuários" }] : LINKS;
  const active = (href: string) => (href === "/admin" ? path === "/admin" : path.startsWith(href));
  return (
    <>
      <div className="flex items-center justify-between bg-ink px-5 py-3 text-paper lg:hidden">
        <Link href="/admin" className="flex items-center gap-3"><Monogram className="h-6 w-auto" /> <span className="eyebrow">Painel</span></Link>
        <button type="button" onClick={() => setOpen((o) => !o)} className="grid h-11 w-11 place-items-center" aria-label="Menu do painel" aria-expanded={open}>
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>
      <aside className={`${open ? "block" : "hidden"} bg-ink text-paper lg:sticky lg:top-0 lg:block lg:h-dvh`}>
        <div className="flex h-full flex-col px-5 py-6">
          <Link href="/admin" className="hidden items-center gap-3 lg:flex"><Monogram className="h-7 w-auto" /><span className="eyebrow text-paper/70">Painel</span></Link>
          <nav aria-label="Painel" className="mt-2 flex-1 overflow-y-auto lg:mt-10">
            <ul className="space-y-0.5">
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={() => setOpen(false)} aria-current={active(l.href) ? "page" : undefined} className={`block rounded px-3 py-2 text-sm transition-colors ${active(l.href) ? "bg-paper/12 text-paper" : "text-paper/65 hover:text-paper"}`}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-6 border-t border-paper/15 pt-5 text-sm">
            <p className="truncate text-paper/80">{name}</p>
            <div className="mt-3 flex gap-4 text-[0.75rem] text-paper/60">
              <Link href="/" target="_blank" className="hover:text-paper">Ver loja ↗</Link>
              <Link href="/admin/senha" className="hover:text-paper">Senha</Link>
              <form action={logoutAction}><button type="submit" className="hover:text-paper">Sair</button></form>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
