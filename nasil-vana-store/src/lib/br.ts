/** Validações e formatações brasileiras (CPF, CEP, telefone). */

export const onlyDigits = (v: string) => v.replace(/\D/g, "");

export function isValidCPF(input: string): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const r = (sum * 10) % 11;
    return r === 10 ? 0 : r;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export const formatCPF = (v: string) =>
  onlyDigits(v).slice(0, 11).replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d)/, "$1.$2").replace(/(\d{3})(\d{1,2})$/, "$1-$2");

export const maskCPF = (v: string | null | undefined) => {
  const d = onlyDigits(v ?? "");
  return d.length === 11 ? `***.${d.slice(3, 6)}.***-**` : "—";
};

export const isValidCEP = (v: string) => /^\d{8}$/.test(onlyDigits(v));
export const formatCEP = (v: string) => onlyDigits(v).slice(0, 8).replace(/(\d{5})(\d)/, "$1-$2");

/** Celular/fixo brasileiro com DDD (10 ou 11 dígitos). */
export function isValidPhoneBR(v: string): boolean {
  const d = onlyDigits(v).replace(/^55(?=\d{10,11}$)/, "");
  if (!/^\d{10,11}$/.test(d)) return false;
  const ddd = Number(d.slice(0, 2));
  if (ddd < 11 || ddd > 99) return false;
  if (d.length === 11 && d[2] !== "9") return false;
  return true;
}

export function formatPhoneBR(v: string): string {
  const d = onlyDigits(v).replace(/^55(?=\d{10,11}$)/, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d{1,4})$/, "$1-$2");
  return d.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d{1,4})$/, "$1-$2");
}

/** Link wa.me a partir do número configurado. */
export function whatsappLink(number: string | null | undefined, text?: string): string | null {
  if (!number) return null;
  let d = onlyDigits(number);
  if (d.length === 10 || d.length === 11) d = `55${d}`;
  if (d.length < 12) return null;
  return `https://wa.me/${d}${text ? `?text=${encodeURIComponent(text)}` : ""}`;
}

/** Verifica se um CEP está em alguma faixa "00000000-99999999, ..." */
export function cepInRanges(cep: string, ranges: string | null | undefined): boolean {
  if (!ranges || !ranges.trim()) return true;
  const n = Number(onlyDigits(cep));
  return ranges.split(/[,;\n]/).some((part) => {
    const [a, b] = part.split("-").map((s) => Number(onlyDigits(s)));
    if (!a) return false;
    return n >= a && n <= (b || a);
  });
}

export const UF = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
] as const;
