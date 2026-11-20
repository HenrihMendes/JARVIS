import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { NewsletterForm } from "./newsletter-form";
import { IconInstagram, IconWhatsapp, IconLock } from "@/components/ui/icons";
import { getSettings, storeAddressLine } from "@/lib/settings";
import { getCategories } from "@/lib/catalog";
import { whatsappLink } from "@/lib/br";
import { CookiePrefsLink } from "./cookie-consent";

export async function Footer() {
  const [settings, categories] = await Promise.all([getSettings(), getCategories()]);
  const s = settings.store;
  const wa = whatsappLink(s.whatsapp, "Olá! Vim pelo site da Nasil Vana Store.");
  const ig = s.instagram ? `https://instagram.com/${s.instagram.replace(/^@/, "")}` : null;
  const address = s.showAddress ? storeAddressLine(s) : null;
  const year = new Date().getFullYear();

  return (
    <footer className="mt-24 bg-ink text-paper" aria-labelledby="rodape-titulo">
      <h2 id="rodape-titulo" className="sr-only">
        Rodapé
      </h2>
      <div className="mx-auto max-w-[1600px] px-[var(--gutter)] pt-20">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="eyebrow text-paper/60">Lista de novidades</p>
            <p className="display mt-4 text-4xl sm:text-5xl">
              Seja a primeira <em>a saber.</em>
            </p>
            <p className="mt-4 max-w-md text-paper/70">Lançamentos, reposições e campanhas da loja — sem excesso de mensagens.</p>
            <div className="mt-8 max-w-md">
              <NewsletterForm tone="dark" />
            </div>
          </div>

          <nav aria-label="Rodapé" className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-6 lg:col-start-7">
            <div>
              <p className="eyebrow text-paper/50">Loja</p>
              <ul className="mt-5 space-y-3 text-[0.9375rem]">
                <li><Link href="/loja" className="link-u">Toda a loja</Link></li>
                {categories.map((c) => (
                  <li key={c.slug}><Link href={`/loja/${c.slug}`} className="link-u">{c.name}</Link></li>
                ))}
              </ul>
            </div>
            <div>
              <p className="eyebrow text-paper/50">Atendimento</p>
              <ul className="mt-5 space-y-3 text-[0.9375rem]">
                <li><Link href="/contato" className="link-u">Contato</Link></li>
                <li><Link href="/perguntas-frequentes" className="link-u">Perguntas frequentes</Link></li>
                <li><Link href="/entrega-e-frete" className="link-u">Entrega e frete</Link></li>
                <li><Link href="/trocas-e-devolucoes" className="link-u">Trocas e devoluções</Link></li>
              </ul>
            </div>
            <div>
              <p className="eyebrow text-paper/50">A marca</p>
              <ul className="mt-5 space-y-3 text-[0.9375rem]">
                <li><Link href="/nossa-historia" className="link-u">Nossa história</Link></li>
                <li><Link href="/politica-de-privacidade" className="link-u">Privacidade</Link></li>
                <li><Link href="/politica-de-cookies" className="link-u">Cookies</Link></li>
                <li><Link href="/termos-de-uso" className="link-u">Termos de uso</Link></li>
              </ul>
            </div>
          </nav>
        </div>

        <div className="mt-20 flex flex-col gap-6 border-t border-paper/15 py-8 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3 text-[0.8125rem] text-paper/70">
            <IconLock size={16} /> Pagamento processado com segurança pelo Mercado Pago · Pix e cartão
          </div>
          <div className="flex items-center gap-2">
            {wa && (
              <a href={wa} target="_blank" rel="noopener" className="grid h-11 w-11 place-items-center rounded-full border border-paper/25 hover:border-paper" aria-label="WhatsApp da loja">
                <IconWhatsapp size={19} />
              </a>
            )}
            {ig && (
              <a href={ig} target="_blank" rel="noopener" className="grid h-11 w-11 place-items-center rounded-full border border-paper/25 hover:border-paper" aria-label="Instagram da loja">
                <IconInstagram size={19} />
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="overflow-hidden px-[var(--gutter)]" aria-hidden="true">
        <Logo variant="full" className="mx-auto block w-full max-w-[1500px] translate-y-[18%] text-paper/[0.07]" />
      </div>

      <div className="border-t border-paper/10 bg-black/30">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-2 px-[var(--gutter)] py-6 text-[0.75rem] leading-relaxed text-paper/55 sm:flex-row sm:justify-between">
          <p>
            © {year} {s.legalName || s.name}
            {s.cnpj ? ` · CNPJ ${s.cnpj}` : ""}
            {address ? ` · ${address}` : ` · ${s.addressCity}, ${s.addressState}`}
            {s.email ? ` · ${s.email}` : ""}
          </p>
          <CookiePrefsLink enabled={Boolean(settings.seo.ga4MeasurementId)} />
        </div>
      </div>
    </footer>
  );
}
