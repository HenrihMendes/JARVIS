import type { Metadata } from "next";
import { Suspense } from "react";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { mediaSrc } from "@/lib/media-url";
import { AdminPage, Badge, Card } from "@/components/admin/server-ui";
import { ActionForm, Check, F, Submit } from "@/components/admin/ui";
import { deleteBannerAction, saveBannerAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Banners" };

type B = typeof schema.banners.$inferSelect & { media: typeof schema.media.$inferSelect | null; secondaryMedia: typeof schema.media.$inferSelect | null };

function BannerForm({ b }: { b?: B }) {
  return (
    <ActionForm action={saveBannerAction} resetOnSuccess={!b} className="grid gap-5 sm:grid-cols-2">
      {b && <input type="hidden" name="id" value={b.id} />}
      <F label="Posição" name="placement" as="select" defaultValue={b?.placement ?? "campaign"}>
        <option value="hero">Abertura da home (principal)</option>
        <option value="campaign">Campanha (seções da home)</option>
      </F>
      <F label="Ordem" name="sortOrder" type="number" defaultValue={b?.sortOrder ?? 0} />
      <F label="Chamada pequena" name="eyebrow" defaultValue={b?.eyebrow ?? ""} placeholder="Ex.: Nova coleção" />
      <F label="Título" name="title" defaultValue={b?.title} />
      <F label="Texto de apoio" name="subtitle" as="textarea" rows={2} defaultValue={b?.subtitle ?? ""} className="sm:col-span-2" />
      <F label="Texto do botão" name="ctaLabel" defaultValue={b?.ctaLabel ?? ""} />
      <F label="Link do botão" name="ctaHref" defaultValue={b?.ctaHref ?? ""} placeholder="/loja/vestidos" />
      <div>
        <F label="Foto principal" name="image" type="file" accept="image/*" hint="Vertical, mínimo 1200 px de largura." />
        {b?.media && <img src={mediaSrc(b.media.key, b.media.widths[0])} alt="" className="mt-2 h-24 w-auto" />}
      </div>
      <div>
        <F label="Foto secundária" name="image2" type="file" accept="image/*" />
        {b?.secondaryMedia && <img src={mediaSrc(b.secondaryMedia.key, b.secondaryMedia.widths[0])} alt="" className="mt-2 h-24 w-auto" />}
      </div>
      <div className="flex items-center gap-6 sm:col-span-2"><Check label="Ativo" name="active" defaultChecked={b?.active ?? true} /><Submit>{b ? "Salvar banner" : "Criar banner"}</Submit></div>
    </ActionForm>
  );
}

async function List() {
  await requireAdmin();
  const rows = await db.query.banners.findMany({ orderBy: [asc(schema.banners.placement), asc(schema.banners.sortOrder)], with: { media: true, secondaryMedia: true } });
  return (
    <div className="space-y-4">
      {rows.map((b) => (
        <details key={b.id} className="bg-paper ring-1 ring-line">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-3 p-5">
            <span className="font-medium">{b.title}</span>
            <span className="flex gap-2"><Badge tone="ink">{b.placement === "hero" ? "Abertura" : "Campanha"}</Badge><Badge tone={b.active ? "ok" : "neutral"}>{b.active ? "Ativo" : "Inativo"}</Badge></span>
          </summary>
          <div className="border-t border-line p-5">
            <BannerForm b={b} />
            <ActionForm action={deleteBannerAction} confirm="Excluir este banner?" className="mt-5 border-t border-line pt-4"><input type="hidden" name="id" value={b.id} /><button className="text-sm text-danger hover:underline">Excluir</button></ActionForm>
          </div>
        </details>
      ))}
      <Card title="Novo banner"><BannerForm /></Card>
    </div>
  );
}

export default function BannersPage() {
  return (
    <AdminPage title="Banners da home" description="A abertura e as campanhas da página inicial. Troque fotos e textos a cada coleção, sem programador.">
      <Suspense fallback={<div className="skeleton h-64" />}><List /></Suspense>
    </AdminPage>
  );
}
