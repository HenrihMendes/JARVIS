import { formatBRL } from "@/lib/money";

export function Price({
  cents,
  compareAt,
  className = "",
  size = "md",
}: {
  cents: number;
  compareAt?: number | null;
  className?: string;
  size?: "sm" | "md" | "lg";
}) {
  const main = size === "lg" ? "text-2xl" : size === "sm" ? "text-[0.8125rem]" : "text-[0.9375rem]";
  const onSale = compareAt != null && compareAt > cents;
  return (
    <span className={`inline-flex items-baseline gap-2 tabular ${className}`}>
      {onSale && (
        <>
          <span className="sr-only">De</span>
          <s className="text-stone text-[0.8em]">{formatBRL(compareAt!)}</s>
          <span className="sr-only">por</span>
        </>
      )}
      <span className={`${main} tracking-wide`}>{formatBRL(cents)}</span>
    </span>
  );
}

/**
 * Parcelamento: só aparece se configurado no painel. Não calculamos o valor da parcela porque
 * juros dependem da configuração da conta Mercado Pago — as condições finais aparecem no pagamento.
 */
export function Installments({ max, note }: { max: number | null; note?: string }) {
  if (!max || max < 2) return null;
  return (
    <span className="text-stone text-[0.8125rem]">
      Em até {max}× no cartão{note ? ` ${note}` : ""}
    </span>
  );
}
