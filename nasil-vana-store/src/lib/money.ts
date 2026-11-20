/** Utilitários monetários. Todos os valores são inteiros em centavos (BRL). */

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

export function formatBRL(cents: number): string {
  return brl.format(cents / 100).replace(/ /g, " ");
}

/** Divide o preço em partes para exibição editorial: "R$", "399", ",90" */
export function priceParts(cents: number) {
  const reais = Math.floor(cents / 100);
  const c = String(cents % 100).padStart(2, "0");
  return { currency: "R$", whole: reais.toLocaleString("pt-BR"), fraction: `,${c}` };
}

/** "399,90" | "399.90" | "R$ 1.299,00" -> centavos. Lança erro se inválido. */
export function parseBRLToCents(input: string): number {
  const cleaned = input.replace(/[R$\s]/g, "").trim();
  if (!cleaned) throw new Error("Valor vazio");
  let normalized = cleaned;
  if (/,\d{1,2}$/.test(cleaned)) normalized = cleaned.replace(/\./g, "").replace(",", ".");
  else if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) normalized = cleaned.replace(/\./g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) throw new Error("Valor inválido");
  const [i, d = ""] = normalized.split(".");
  return Number(i) * 100 + Number(d.padEnd(2, "0"));
}

export function centsToInput(cents: number | null | undefined): string {
  if (cents == null) return "";
  return (cents / 100).toFixed(2).replace(".", ",");
}

/** Converte valor decimal vindo do provedor (ex.: 399.9) em centavos sem erro de ponto flutuante. */
export function decimalToCents(value: number): number {
  return Math.round(value * 100);
}

export function percentOf(cents: number, percent: number): number {
  return Math.floor((cents * percent) / 100);
}
