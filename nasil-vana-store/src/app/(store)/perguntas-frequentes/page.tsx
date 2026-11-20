import type { Metadata } from "next";
import { Suspense } from "react";
import { getFaqs } from "@/lib/pages";
import { Breadcrumbs } from "@/components/catalog/page-heading";
import { JsonLd } from "@/components/seo/json-ld";
import { IconPlus } from "@/components/ui/icons";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description: "Pagamento, entrega, trocas e tamanhos: respostas para as dúvidas mais comuns sobre comprar na Nasil Vana Store.",
  alternates: { canonical: "/perguntas-frequentes" },
};

async function List() {
  const faqs = await getFaqs();
  return (
    <>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: f.answer } })) }} />
      <div className="mt-12 max-w-3xl border-t border-line">
        {faqs.map((f, i) => (
          <details key={f.id} className="group border-b border-line" open={i === 0}>
            <summary className="flex cursor-pointer list-none items-center justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
              <span className="serif text-xl sm:text-2xl">{f.question}</span>
              <IconPlus size={18} className="shrink-0 transition-transform duration-500 group-open:rotate-45" />
            </summary>
            <p className="pb-6 leading-relaxed text-ink-2">{f.answer}</p>
          </details>
        ))}
      </div>
    </>
  );
}

export default function FaqPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-[var(--gutter)] pt-10 sm:pt-14">
      <Breadcrumbs items={[{ name: "Início", path: "/" }, { name: "Perguntas frequentes", path: "/perguntas-frequentes" }]} />
      <h1 className="display mt-8 text-[clamp(2.8rem,6.5vw,5.5rem)]">
        Perguntas <em>frequentes</em>
      </h1>
      <Suspense fallback={<div className="skeleton mt-12 h-96 max-w-3xl" />}>
        <List />
      </Suspense>
    </div>
  );
}
