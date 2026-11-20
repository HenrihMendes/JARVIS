"use client";

import { useRef, useState, useTransition } from "react";
import { ActionForm, Check, F, Submit, type ActionState } from "./ui";
import { saveProductAction, saveVariantsAction, uploadProductImageAction, updateProductImageAction, moveProductImageAction, deleteProductImageAction } from "@/app/admin/actions/products";
import { centsToInput } from "@/lib/money";
import { mediaSrc } from "@/lib/media-url";
import { compressForUpload } from "./compress-image";

type Opt = { id: string; name: string };

export type AdminProduct = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  description: string;
  composition: string | null;
  care: string | null;
  fitNotes: string | null;
  status: "draft" | "active" | "coming_soon" | "archived";
  categoryId: string | null;
  priceCents: number | null;
  compareAtCents: number | null;
  featured: boolean;
  isNew: boolean;
  imageNotice: string | null;
  internalNotes: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  gtin: string | null;
  sortOrder: number;
};

export function ProductForm({ product: p, categories }: { product: AdminProduct | null; categories: Opt[] }) {
  return (
    <ActionForm action={saveProductAction} className="grid gap-6 lg:grid-cols-3">
      {(s: ActionState) => {
        const e = s?.errors ?? {};
        return (
          <>
            {p && <input type="hidden" name="id" value={p.id} />}
            <section className="space-y-6 bg-paper p-6 ring-1 ring-line lg:col-span-2">
              <F label="Nome da peça" name="name" defaultValue={p?.name} required error={e.name} />
              <F label="Linha de apoio (opcional)" name="subtitle" defaultValue={p?.subtitle ?? ""} hint='Ex.: "Renda nas bordas · alças finas"' />
              <F label="Descrição" name="description" as="textarea" rows={6} defaultValue={p?.description} error={e.description} hint="Descreva modelagem, detalhes e como usar. Evite promessas que não possam ser comprovadas." />
              <div className="grid gap-6 sm:grid-cols-2">
                <F label="Composição do tecido" name="composition" defaultValue={p?.composition ?? ""} hint="Ex.: 95% poliéster, 5% elastano. Deixe vazio se não souber." />
                <F label="Cuidados de lavagem" name="care" defaultValue={p?.care ?? ""} />
              </div>
              <F label="Observações de caimento/tamanho" name="fitNotes" defaultValue={p?.fitNotes ?? ""} hint='Ex.: "Tamanho único, veste até o M (40)".' />
              <F label="Aviso nas fotos (opcional)" name="imageNotice" defaultValue={p?.imageNotice ?? ""} hint="Ex.: Imagens de divulgação; cores podem variar." />
            </section>

            <aside className="space-y-6">
              <section className="space-y-5 bg-paper p-6 ring-1 ring-line">
                <F label="Status" name="status" as="select" defaultValue={p?.status ?? "draft"} error={e.status}>
                  <option value="draft">Rascunho (não aparece na loja)</option>
                  <option value="active">Ativo (à venda)</option>
                  <option value="coming_soon">Em breve (aparece sem botão de compra)</option>
                  <option value="archived">Arquivado</option>
                </F>
                <F label="Categoria" name="categoryId" as="select" defaultValue={p?.categoryId ?? ""}>
                  <option value="">—</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </F>
                <F label="Preço de venda (R$)" name="price" inputMode="decimal" defaultValue={centsToInput(p?.priceCents)} placeholder="199,90" error={e.price} />
                <F label="Preço original (R$) — opcional" name="compareAt" inputMode="decimal" defaultValue={centsToInput(p?.compareAtCents)} placeholder="Só use se for promoção real" error={e.compareAt} hint="Aparece riscado. Use apenas se a peça já foi vendida por esse valor (CDC)." />
                <div className="space-y-3 pt-1">
                  <Check label="Destaque na página inicial" name="featured" defaultChecked={p?.featured} />
                  <Check label="Marcar como novidade" name="isNew" defaultChecked={p?.isNew} />
                </div>
                <F label="Ordem de exibição" name="sortOrder" type="number" min={0} defaultValue={p?.sortOrder ?? 0} hint="Menor aparece primeiro." />
              </section>

              <details className="bg-paper p-6 ring-1 ring-line">
                <summary className="eyebrow cursor-pointer text-stone">SEO e Google</summary>
                <div className="mt-5 space-y-5">
                  <F label="Endereço (URL)" name="slug" defaultValue={p?.slug ?? ""} hint="Gerado a partir do nome se ficar vazio." error={e.slug} />
                  <F label="Título para o Google" name="seoTitle" maxLength={70} defaultValue={p?.seoTitle ?? ""} hint="Até 70 caracteres." />
                  <F label="Descrição para o Google" name="seoDescription" as="textarea" rows={3} maxLength={170} defaultValue={p?.seoDescription ?? ""} hint="Até 170 caracteres." />
                  <F label="GTIN / código de barras (opcional)" name="gtin" defaultValue={p?.gtin ?? ""} error={e.gtin} hint="Ajuda no Google Merchant Center, se a peça tiver." />
                </div>
              </details>

              <section className="bg-paper p-6 ring-1 ring-line">
                <F label="Notas internas (não aparecem na loja)" name="internalNotes" as="textarea" rows={3} defaultValue={p?.internalNotes ?? ""} />
              </section>

              <Submit className="w-full">{p ? "Salvar produto" : "Criar produto"}</Submit>
            </aside>
          </>
        );
      }}
    </ActionForm>
  );
}

/* ------------------------------- Variações ------------------------------- */

type Row = { id?: string | null; colorId: string | null; sizeId: string | null; sku: string; stock: number; price: string; active: boolean };

export function VariantEditor({ productId, baseSku, initial, colors, sizes }: { productId: string; baseSku: string; initial: Row[]; colors: Opt[]; sizes: Opt[] }) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [selColors, setSelColors] = useState<string[]>([]);
  const [selSizes, setSelSizes] = useState<string[]>([]);
  const update = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));
  const skuFor = (c: string | null, s: string | null) =>
    [baseSku, colors.find((x) => x.id === c)?.name.slice(0, 3), sizes.find((x) => x.id === s)?.name]
      .filter(Boolean)
      .join("-")
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^A-Za-z0-9-]/g, "")
      .toUpperCase();

  const generate = () => {
    const cs = selColors.length ? selColors : [null];
    const ss = selSizes.length ? selSizes : [null];
    const next = [...rows];
    for (const c of cs)
      for (const s of ss) {
        if (next.some((r) => r.colorId === c && r.sizeId === s)) continue;
        next.push({ colorId: c, sizeId: s, sku: skuFor(c, s), stock: 0, price: "", active: true });
      }
    setRows(next);
  };

  return (
    <ActionForm action={saveVariantsAction}>
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="rows" value={JSON.stringify(rows.map((r) => ({ ...r, stock: Number(r.stock) || 0 })))} />

      <div className="mb-6 grid gap-4 bg-paper-2/60 p-5 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div>
          <p className="field-label">Cores</p>
          <div className="flex flex-wrap gap-1.5">
            {colors.map((c) => (
              <button key={c.id} type="button" onClick={() => setSelColors((s) => (s.includes(c.id) ? s.filter((x) => x !== c.id) : [...s, c.id]))} className={`rounded-full border px-3 py-1 text-[0.8125rem] ${selColors.includes(c.id) ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`}>
                {c.name}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="field-label">Tamanhos</p>
          <div className="flex flex-wrap gap-1.5">
            {sizes.map((s) => (
              <button key={s.id} type="button" onClick={() => setSelSizes((x) => (x.includes(s.id) ? x.filter((y) => y !== s.id) : [...x, s.id]))} className={`min-w-10 border px-2.5 py-1 text-[0.8125rem] ${selSizes.includes(s.id) ? "border-ink bg-ink text-paper" : "border-line bg-paper"}`}>
                {s.name}
              </button>
            ))}
          </div>
        </div>
        <button type="button" onClick={generate} className="btn btn-outline !min-h-11">
          Gerar combinações
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead className="border-b border-line text-[0.6875rem] uppercase tracking-[0.12em] text-stone">
            <tr>
              <th className="py-2 pr-3 font-medium">Cor</th>
              <th className="py-2 pr-3 font-medium">Tamanho</th>
              <th className="py-2 pr-3 font-medium">SKU</th>
              <th className="py-2 pr-3 font-medium">Estoque</th>
              <th className="py-2 pr-3 font-medium">Preço próprio (opcional)</th>
              <th className="py-2 pr-3 font-medium">Ativa</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {rows.map((r, i) => (
              <tr key={r.id ?? `n${i}`}>
                <td className="py-2 pr-3">
                  <select className="input !min-h-10 !py-1" value={r.colorId ?? ""} onChange={(e) => update(i, { colorId: e.target.value || null })} aria-label="Cor">
                    <option value="">—</option>
                    {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </td>
                <td className="py-2 pr-3">
                  <select className="input !min-h-10 !py-1" value={r.sizeId ?? ""} onChange={(e) => update(i, { sizeId: e.target.value || null })} aria-label="Tamanho">
                    <option value="">—</option>
                    {sizes.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </td>
                <td className="py-2 pr-3"><input className="input !min-h-10 !py-1 uppercase" value={r.sku} onChange={(e) => update(i, { sku: e.target.value })} aria-label="SKU" /></td>
                <td className="py-2 pr-3"><input className="input !min-h-10 w-20 !py-1" type="number" min={0} value={r.stock} onChange={(e) => update(i, { stock: Math.max(0, Number(e.target.value)) })} aria-label="Estoque" /></td>
                <td className="py-2 pr-3"><input className="input !min-h-10 w-28 !py-1" inputMode="decimal" placeholder="—" value={r.price} onChange={(e) => update(i, { price: e.target.value })} aria-label="Preço próprio" /></td>
                <td className="py-2 pr-3"><input type="checkbox" checked={r.active} onChange={(e) => update(i, { active: e.target.checked })} className="h-4 w-4 accent-[var(--color-ink)]" aria-label="Ativa" /></td>
                <td className="py-2 text-right">
                  <button type="button" onClick={() => setRows((x) => x.filter((_, j) => j !== i))} className="text-[0.75rem] uppercase tracking-[0.1em] text-danger hover:underline">
                    Remover
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="py-6 text-sm text-stone">Nenhuma variação. Escolha cores e/ou tamanhos acima e clique em “Gerar combinações”.</p>}
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => setRows((r) => [...r, { colorId: null, sizeId: null, sku: `${baseSku}-${r.length + 1}`, stock: 0, price: "", active: true }])} className="btn btn-outline !min-h-11">
          + Variação manual
        </button>
        <Submit>Salvar variações e estoque</Submit>
      </div>
    </ActionForm>
  );
}

/* --------------------------------- Fotos --------------------------------- */

type Img = { id: string; key: string; widths: number[]; alt: string; focalY: number; colorId: string | null };

export function ImageManager({ productId, images, colors }: { productId: string; images: Img[]; colors: Opt[] }) {
  const input = useRef<HTMLInputElement>(null);
  const [color, setColor] = useState("");
  const [log, setLog] = useState<string[]>([]);
  const [busy, start] = useTransition();

  const upload = (files: FileList | null) => {
    if (!files?.length) return;
    start(async () => {
      const msgs: string[] = [];
      for (const original of Array.from(files)) {
        const f = await compressForUpload(original);
        if (f.size > 5.5 * 1024 * 1024) {
          msgs.push(`${f.name}: arquivo grande demais (máx. ~5 MB). Exporte em JPG e tente de novo.`);
          continue;
        }
        const fd = new FormData();
        fd.set("productId", productId);
        fd.set("file", f);
        if (color) fd.set("colorId", color);
        setLog((l) => [...l, `Enviando ${f.name}…`]);
        const r = await uploadProductImageAction(fd);
        msgs.push(r.ok ? `${f.name}: enviada.` : `${f.name}: ${r.message}`);
      }
      setLog(msgs);
      if (input.current) input.current.value = "";
    });
  };

  return (
    <div>
      <div
        className="flex flex-col items-center justify-center gap-3 border border-dashed border-mist bg-paper-2/40 p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          upload(e.dataTransfer.files);
        }}
      >
        <p className="text-sm">Arraste as fotos aqui ou</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <select value={color} onChange={(e) => setColor(e.target.value)} className="input !min-h-11 w-auto bg-paper px-3" aria-label="Cor das fotos">
            <option value="">Fotos sem cor específica</option>
            {colors.map((c) => <option key={c.id} value={c.id}>Fotos da cor: {c.name}</option>)}
          </select>
          <button type="button" disabled={busy} onClick={() => input.current?.click()} className="btn btn-primary !min-h-11">
            {busy ? "Processando…" : "Escolher fotos"}
          </button>
        </div>
        <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/avif,image/heic,image/heif" multiple hidden onChange={(e) => upload(e.target.files)} />
        <p className="text-[0.75rem] text-stone">JPG, PNG, WebP ou AVIF · reduzidas automaticamente antes do envio · mínimo 300 px. Recomendado: 1600 × 2400 px (vertical 2:3), fundo neutro.</p>
        {log.length > 0 && <ul className="text-left text-[0.8125rem] text-stone" aria-live="polite">{log.map((l, i) => <li key={i}>{l}</li>)}</ul>}
      </div>

      {images.length > 0 && (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {images.map((img, i) => (
            <li key={img.id} className="bg-paper ring-1 ring-line">
              <div className="relative aspect-[3/4] bg-paper-2">
                <img src={mediaSrc(img.key, img.widths.find((w) => w >= 480) ?? img.widths[img.widths.length - 1], "webp")} alt={img.alt} className="h-full w-full object-cover" style={{ objectPosition: `50% ${img.focalY}%` }} />
                {i === 0 && <span className="eyebrow absolute left-2 top-2 bg-ink px-2 py-1 text-[0.625rem] text-paper">Capa</span>}
              </div>
              <ActionForm action={updateProductImageAction} className="space-y-3 p-3">
                <input type="hidden" name="id" value={img.id} />
                <F label="Texto alternativo" name="alt" defaultValue={img.alt} hint="Descreva a foto para leitores de tela e Google." />
                <F label="Cor" name="colorId" as="select" defaultValue={img.colorId ?? ""}>
                  <option value="">—</option>
                  {colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </F>
                <F label="Enquadramento vertical (0 = topo, 100 = base)" name="focalY" type="number" min={0} max={100} defaultValue={img.focalY} />
                <Submit variant="outline" className="w-full">Salvar foto</Submit>
              </ActionForm>
              <div className="flex justify-between border-t border-line px-3 py-2 text-[0.75rem]">
                <div className="flex gap-3">
                  <form action={moveProductImageAction}><input type="hidden" name="id" value={img.id} /><input type="hidden" name="dir" value="up" /><button disabled={i === 0} className="hover:underline disabled:opacity-30">← Antes</button></form>
                  <form action={moveProductImageAction}><input type="hidden" name="id" value={img.id} /><input type="hidden" name="dir" value="down" /><button disabled={i === images.length - 1} className="hover:underline disabled:opacity-30">Depois →</button></form>
                </div>
                <form action={deleteProductImageAction} onSubmit={(e) => { if (!confirm("Excluir esta foto?")) e.preventDefault(); }}>
                  <input type="hidden" name="id" value={img.id} />
                  <button className="text-danger hover:underline">Excluir</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
