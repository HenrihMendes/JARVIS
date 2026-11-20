"use client";

import { startTransition, useActionState, useEffect, useMemo, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { lookupCepAction, placeOrderAction, quoteShippingAction, type CheckoutState, type ShippingQuote } from "@/app/actions/checkout";
import { useCart } from "@/components/cart/cart-context";
import { Picture } from "@/components/ui/picture";
import { IconLock, IconChevron, IconCheck } from "@/components/ui/icons";
import { formatBRL } from "@/lib/money";
import { formatCEP, formatCPF, formatPhoneBR, onlyDigits, UF } from "@/lib/br";

type Props = { requireCpf: boolean; paymentsReady: boolean; whatsappHref: string | null; acceptBoleto: boolean };

function Field({
  label,
  name,
  error,
  className = "",
  hint,
  ...rest
}: React.ComponentProps<"input"> & { label: string; name: string; error?: string; hint?: string }) {
  const id = `f-${name}`;
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      <input id={id} name={name} className="input" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-err` : hint ? `${id}-hint` : undefined} {...rest} />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-[0.75rem] text-stone">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} className="field-error">
          {error}
        </p>
      )}
    </div>
  );
}

export function CheckoutForm({ requireCpf, paymentsReady, whatsappHref, acceptBoleto }: Props) {
  const { cart, applyCoupon, removeCoupon, refresh } = useCart();
  const [state, action, submitting] = useActionState<CheckoutState, FormData>(placeOrderAction, null);
  const [idem, setIdem] = useState("");
  const [cep, setCep] = useState("");
  const [addr, setAddr] = useState({ street: "", district: "", city: "", state: "" });
  const [cepMsg, setCepMsg] = useState<string | null>(null);
  const [quote, setQuote] = useState<ShippingQuote | null>(null);
  const [method, setMethod] = useState<string>("");
  const userChoseMethod = useRef(false);
  const [loadingQuote, startQuote] = useTransition();
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const numberRef = useRef<HTMLInputElement>(null);

  useEffect(() => setIdem(crypto.randomUUID()), []);

  const fetchQuote = (c: string | null) =>
    startQuote(async () => {
      const q = await quoteShippingAction(c);
      setQuote(q);
      setMethod((m) => {
        if (userChoseMethod.current && q.options.some((o) => o.id === m)) return m;
        // Com CEP informado, a cliente provavelmente quer entrega: pré-seleciona a 1ª opção com entrega
        const preferred = c ? q.options.find((o) => o.type !== "pickup") : null;
        return (preferred ?? q.options[0])?.id ?? "";
      });
    });

  useEffect(() => {
    fetchQuote(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cart?.subtotalCents, cart?.couponCode]);

  useEffect(() => {
    if (state?.ok) window.location.assign(state.redirectUrl);
    if (state && !state.ok) {
      if (state.notices) void refresh();
      const first = state.errors ? Object.keys(state.errors)[0] : null;
      if (first) document.getElementById(`f-${first}`)?.focus();
    }
  }, [state, refresh]);

  const onCep = async (value: string) => {
    const masked = formatCEP(value);
    setCep(masked);
    const d = onlyDigits(value);
    if (d.length !== 8) return;
    setCepMsg("Buscando endereço…");
    fetchQuote(d);
    const r = await lookupCepAction(d);
    if (r.ok) {
      setAddr({ street: r.street, district: r.district, city: r.city, state: r.state });
      setCepMsg(null);
      window.setTimeout(() => numberRef.current?.focus(), 30);
    } else setCepMsg(r.message);
  };

  const selected = quote?.options.find((o) => o.id === method) ?? null;
  const needsAddress = selected ? selected.type !== "pickup" : true;
  const subtotal = cart?.subtotalCents ?? 0;
  const discount = quote?.discountCents ?? (cart?.coupon?.ok ? cart.coupon.discountCents : 0);
  const shipping = selected?.finalPriceCents ?? 0;
  const total = Math.max(0, subtotal - discount + shipping);
  const err = state && !state.ok ? state.errors ?? {} : {};
  const lines = cart?.lines ?? [];

  const summary = useMemo(
    () => (
      <div>
        <ul className="divide-y divide-line">
          {lines.map((l) => (
            <li key={l.variantId} className="flex gap-4 py-4">
              <div className="relative h-24 w-[4.5rem] shrink-0 overflow-hidden bg-paper-2">
                {l.image && <Picture media={l.image} sizes="80px" fill alt="" />}
                <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-ink px-1 text-[10px] text-paper tabular">{l.quantity}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="serif leading-tight">{l.name}</p>
                {l.variantLabel && <p className="mt-1 text-[0.8125rem] text-stone">{l.variantLabel}</p>}
              </div>
              <p className="text-sm tabular">{formatBRL(l.lineTotalCents)}</p>
            </li>
          ))}
        </ul>

        <div className="border-t border-line py-5">
          {cart?.couponCode && cart.coupon?.ok ? (
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-ok">
                <IconCheck size={16} /> Cupom <strong className="font-medium">{cart.couponCode}</strong>
              </span>
              <button type="button" onClick={() => removeCoupon()} className="link-u text-[0.75rem] uppercase tracking-[0.14em] text-stone">
                Remover
              </button>
            </div>
          ) : (
            <div>
              <label htmlFor="cupom" className="field-label">
                Cupom de desconto
              </label>
              <div className="flex gap-3">
                <input
                  id="cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="input"
                  autoComplete="off"
                  maxLength={40}
                  placeholder="Digite o código"
                />
                <button
                  type="button"
                  className="btn btn-outline !min-h-12 shrink-0 !px-4"
                  onClick={async () => {
                    if (!couponCode.trim()) return;
                    const r = await applyCoupon(couponCode);
                    setCouponMsg(r.ok ? null : (r.message ?? "Cupom inválido."));
                    if (r.ok) setCouponCode("");
                  }}
                >
                  Aplicar
                </button>
              </div>
              {couponMsg && <p className="field-error">{couponMsg}</p>}
            </div>
          )}
        </div>

        <dl className="space-y-2 border-t border-line pt-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-stone">Subtotal</dt>
            <dd className="tabular">{formatBRL(subtotal)}</dd>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-ok">
              <dt>Desconto</dt>
              <dd className="tabular">− {formatBRL(discount)}</dd>
            </div>
          )}
          <div className="flex justify-between">
            <dt className="text-stone">Entrega</dt>
            <dd className="tabular">{selected ? (shipping ? formatBRL(shipping) : "Grátis") : "—"}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-4">
            <dt className="eyebrow">Total</dt>
            <dd className="serif text-2xl tabular">{formatBRL(total)}</dd>
          </div>
        </dl>
      </div>
    ),
    [lines, cart, couponCode, couponMsg, subtotal, discount, shipping, selected, total, applyCoupon, removeCoupon],
  );

  if (cart && lines.length === 0 && !submitting && !state?.ok) {
    return (
      <div className="mx-auto max-w-xl px-[var(--gutter)] py-24 text-center">
        <p className="display text-5xl">
          Sua sacola <em>está vazia.</em>
        </p>
        <Link href="/loja" className="btn btn-primary mt-10">
          Ver a loja
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto grid max-w-[1400px] gap-10 px-[var(--gutter)] pb-24 lg:grid-cols-12 lg:gap-16">
      {/* Resumo — celular (recolhível) */}
      <div className="border-y border-line lg:hidden">
        <button type="button" onClick={() => setSummaryOpen((o) => !o)} className="flex w-full items-center justify-between py-4" aria-expanded={summaryOpen}>
          <span className="flex items-center gap-2 text-sm">
            {summaryOpen ? "Ocultar resumo" : "Ver resumo do pedido"}
            <IconChevron size={14} className={`transition-transform ${summaryOpen ? "-rotate-90" : "rotate-90"}`} />
          </span>
          <span className="serif text-xl tabular">{formatBRL(total)}</span>
        </button>
        {summaryOpen && <div className="pb-6">{summary}</div>}
      </div>

      <form
        className="lg:col-span-7"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          startTransition(() => action(fd)); // preserva os campos se houver erro
        }}
      >
        <input type="hidden" name="idempotencyKey" value={idem} />

        {!paymentsReady && (
          <div role="alert" className="mb-10 border border-warn/40 bg-warn/5 p-5 text-sm text-ink-2">
            <strong className="font-medium">Pagamento online em configuração.</strong> A loja ainda está ativando o Mercado Pago. Você pode tirar dúvidas e finalizar sua compra
            {whatsappHref ? (
              <>
                {" "}
                pelo{" "}
                <a href={whatsappHref} className="underline" target="_blank" rel="noopener">
                  WhatsApp
                </a>
              </>
            ) : (
              " pelos nossos canais de atendimento"
            )}
            .
          </div>
        )}

        {state && !state.ok && (
          <div role="alert" className="mb-10 border-l-2 border-danger bg-danger/5 p-5 text-sm">
            <p className="font-medium text-danger">{state.message}</p>
            {state.notices?.map((n) => (
              <p key={n} className="mt-1 text-ink-2">
                {n}
              </p>
            ))}
          </div>
        )}

        <section aria-labelledby="s-contato">
          <h2 id="s-contato" className="flex items-baseline gap-4">
            <span className="eyebrow text-stone">01</span>
            <span className="serif text-3xl">Seus dados</span>
          </h2>
          <div className="mt-8 grid gap-7 sm:grid-cols-2">
            <Field label="E-mail" name="email" type="email" autoComplete="email" inputMode="email" required error={err.email} className="sm:col-span-2" hint="Enviaremos a confirmação do pedido para este e-mail." />
            <Field label="Nome completo" name="name" autoComplete="name" required error={err.name} className="sm:col-span-2" />
            <Field
              label="Celular (WhatsApp)"
              name="phone"
              type="tel"
              autoComplete="tel-national"
              inputMode="tel"
              required
              error={err.phone}
              onChange={(e) => (e.currentTarget.value = formatPhoneBR(e.currentTarget.value))}
              placeholder="(66) 90000-0000"
            />
            <Field
              label={`CPF${requireCpf ? "" : " (opcional)"}`}
              name="cpf"
              inputMode="numeric"
              autoComplete="off"
              required={requireCpf}
              error={err.cpf}
              onChange={(e) => (e.currentTarget.value = formatCPF(e.currentTarget.value))}
              placeholder="000.000.000-00"
              hint="Necessário para a nota fiscal e a segurança do pagamento."
            />
          </div>
        </section>

        <section aria-labelledby="s-entrega" className="mt-16">
          <h2 id="s-entrega" className="flex items-baseline gap-4">
            <span className="eyebrow text-stone">02</span>
            <span className="serif text-3xl">Entrega</span>
          </h2>

          <div className="mt-8 grid gap-7 sm:grid-cols-6">
            <Field
              label="CEP"
              name="cep"
              inputMode="numeric"
              autoComplete="postal-code"
              value={cep}
              onChange={(e) => onCep(e.target.value)}
              error={err.cep}
              placeholder="00000-000"
              className="sm:col-span-3"
              hint={cepMsg ?? undefined}
            />
            <div className="flex items-end sm:col-span-3">
              <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener" className="pb-3 text-[0.8125rem] text-stone underline underline-offset-4">
                Não sei meu CEP
              </a>
            </div>
          </div>

          <fieldset className="mt-8" aria-describedby={err.shippingMethodId ? "f-ship-err" : undefined}>
            <legend className="field-label">Forma de entrega</legend>
            {loadingQuote && !quote ? (
              <div className="skeleton h-16 w-full" />
            ) : quote && quote.options.length === 0 ? (
              <p className="border border-dashed border-line p-5 text-sm text-stone">
                {cep ? "Ainda não entregamos neste CEP pelo site." : "Informe seu CEP para ver as opções."}{" "}
                {whatsappHref && (
                  <a href={whatsappHref} target="_blank" rel="noopener" className="underline">
                    Fale com a gente pelo WhatsApp.
                  </a>
                )}
              </p>
            ) : (
              <div className="space-y-2.5">
                {quote?.options.map((o) => (
                  <label
                    key={o.id}
                    className={`flex cursor-pointer items-start gap-4 border p-4 transition-colors ${method === o.id ? "border-ink bg-paper-2/60" : "border-line hover:border-mist"}`}
                  >
                    <input type="radio" name="shippingMethodId" value={o.id} checked={method === o.id} onChange={() => {
                        userChoseMethod.current = true;
                        setMethod(o.id);
                      }} className="mt-1 accent-[var(--color-ink)]" />
                    <span className="flex-1">
                      <span className="block font-medium">{o.name}</span>
                      {(o.description || o.eta) && <span className="mt-0.5 block text-[0.8125rem] text-stone">{[o.description, o.eta].filter(Boolean).join(" · ")}</span>}
                    </span>
                    <span className="text-sm tabular">{o.finalPriceCents ? formatBRL(o.finalPriceCents) : "Grátis"}</span>
                  </label>
                ))}
              </div>
            )}
            {err.shippingMethodId && (
              <p id="f-ship-err" className="field-error">
                {err.shippingMethodId}
              </p>
            )}
          </fieldset>

          {needsAddress && (
            <div className="mt-8 grid gap-7 sm:grid-cols-6">
              <Field label="Rua" name="street" autoComplete="address-line1" value={addr.street} onChange={(e) => setAddr({ ...addr, street: e.target.value })} error={err.street} className="sm:col-span-4" />
              <Field ref={numberRef} label="Número" name="number" inputMode="text" autoComplete="address-line2" error={err.number} className="sm:col-span-2" />
              <Field label="Complemento (opcional)" name="complement" autoComplete="address-line3" className="sm:col-span-3" />
              <Field label="Bairro" name="district" value={addr.district} onChange={(e) => setAddr({ ...addr, district: e.target.value })} error={err.district} className="sm:col-span-3" />
              <Field label="Cidade" name="city" autoComplete="address-level2" value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} error={err.city} className="sm:col-span-4" />
              <div className="sm:col-span-2">
                <label htmlFor="f-state" className="field-label">
                  UF
                </label>
                <select id="f-state" name="state" className="input" autoComplete="address-level1" value={addr.state} onChange={(e) => setAddr({ ...addr, state: e.target.value })} aria-invalid={err.state ? true : undefined}>
                  <option value="">—</option>
                  {UF.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
                {err.state && <p className="field-error">{err.state}</p>}
              </div>
            </div>
          )}

          <div className="mt-8">
            <label htmlFor="f-notes" className="field-label">
              Observações (opcional)
            </label>
            <textarea id="f-notes" name="notes" maxLength={500} rows={2} className="input resize-none" placeholder="Ponto de referência, horário preferido…" />
          </div>
        </section>

        <section aria-labelledby="s-pag" className="mt-16">
          <h2 id="s-pag" className="flex items-baseline gap-4">
            <span className="eyebrow text-stone">03</span>
            <span className="serif text-3xl">Pagamento</span>
          </h2>
          <div className="mt-6 flex gap-4 border border-line p-5 text-sm text-ink-2">
            <IconLock size={22} className="mt-0.5 shrink-0 text-suede-deep" />
            <p>
              Você será direcionada ao <strong className="font-medium">Mercado Pago</strong> para pagar com Pix{acceptBoleto ? ", boleto" : ""} ou cartão de crédito em ambiente seguro. A loja não recebe os
              dados do seu cartão. As peças ficam reservadas por tempo limitado até a confirmação do pagamento.
            </p>
          </div>

          <label className="mt-6 flex cursor-pointer items-start gap-3 text-[0.8125rem] text-stone">
            <input type="checkbox" name="marketing" className="mt-0.5 h-4 w-4 accent-[var(--color-suede)]" />
            Quero receber novidades e ofertas por e-mail (opcional).
          </label>

          <button type="submit" disabled={submitting || !idem || !paymentsReady} className="btn btn-primary mt-8 w-full !min-h-14">
            <IconLock size={16} /> {submitting ? "Reservando suas peças…" : `Ir para o pagamento · ${formatBRL(total)}`}
          </button>
          <p className="mt-4 text-center text-[0.75rem] leading-relaxed text-stone">
            Ao continuar, você concorda com os{" "}
            <Link href="/termos-de-uso" className="underline">
              Termos de uso
            </Link>{" "}
            e a{" "}
            <Link href="/politica-de-privacidade" className="underline">
              Política de privacidade
            </Link>
            . Compras online podem ser canceladas em até 7 dias após o recebimento.
          </p>
        </section>
      </form>

      <aside className="hidden lg:col-span-5 lg:block" aria-label="Resumo do pedido">
        <div className="sticky top-[calc(var(--header-h)+1.5rem)] bg-paper-2/60 p-8">
          <h2 className="serif text-2xl">Resumo</h2>
          {summary}
        </div>
      </aside>
    </div>
  );
}
