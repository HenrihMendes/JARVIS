import type { Metadata } from "next";
import { Suspense } from "react";
import { getSettings, storeAddressLine } from "@/lib/settings";
import { whatsappLink } from "@/lib/br";
import { Breadcrumbs } from "@/components/catalog/page-heading";
import { IconWhatsapp, IconInstagram, IconPin, IconChat } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com a Nasil Vana Store: WhatsApp, e-mail, Instagram e endereço da loja em Sinop, MT.",
  alternates: { canonical: "/contato" },
};

async function Channels() {
  const { store: s } = await getSettings();
  const wa = whatsappLink(s.whatsapp, "Olá! Vim pelo site da Nasil Vana Store.");
  const address = s.showAddress ? storeAddressLine(s) : null;
  const items = [
    wa && { icon: <IconWhatsapp size={24} />, label: "WhatsApp", value: s.whatsapp, href: wa },
    s.email && { icon: <IconChat size={24} />, label: "E-mail", value: s.email, href: `mailto:${s.email}` },
    s.instagram && { icon: <IconInstagram size={24} />, label: "Instagram", value: `@${s.instagram.replace(/^@/, "")}`, href: `https://instagram.com/${s.instagram.replace(/^@/, "")}` },
    address && { icon: <IconPin size={24} />, label: "Loja", value: address, href: s.mapsUrl || undefined },
  ].filter(Boolean) as { icon: React.ReactNode; label: string; value: string; href?: string }[];

  if (!items.length) {
    return <p className="mt-12 max-w-xl text-stone">Os canais de atendimento estão sendo atualizados. Volte em breve.</p>;
  }
  return (
    <>
      <ul className="mt-14 grid gap-px bg-line sm:grid-cols-2">
        {items.map((it) => (
          <li key={it.label} className="bg-paper">
            <a href={it.href} target={it.href?.startsWith("http") ? "_blank" : undefined} rel="noopener" className="group flex h-full flex-col gap-4 p-8 transition-colors hover:bg-paper-2">
              <span className="text-suede-deep">{it.icon}</span>
              <span className="eyebrow text-stone">{it.label}</span>
              <span className="serif text-2xl group-hover:underline">{it.value}</span>
            </a>
          </li>
        ))}
      </ul>
      {s.openingHours && <p className="mt-8 text-stone">Horário de atendimento: {s.openingHours}</p>}
    </>
  );
}

export default function ContatoPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-[var(--gutter)] pt-10 sm:pt-14">
      <Breadcrumbs items={[{ name: "Início", path: "/" }, { name: "Contato", path: "/contato" }]} />
      <h1 className="display mt-8 text-[clamp(2.8rem,6.5vw,5.5rem)]">
        Fale <em>com a gente</em>
      </h1>
      <p className="mt-6 max-w-xl text-stone">Dúvidas sobre tamanho, combinação de peças ou sobre o seu pedido? Respondemos com atenção.</p>
      <Suspense fallback={<div className="skeleton mt-14 h-64" />}>
        <Channels />
      </Suspense>
    </div>
  );
}
