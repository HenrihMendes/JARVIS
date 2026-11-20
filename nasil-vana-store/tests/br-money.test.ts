import { describe, expect, it } from "vitest";
import { cepInRanges, formatCPF, isValidCEP, isValidCPF, isValidPhoneBR, whatsappLink } from "@/lib/br";
import { formatBRL, parseBRLToCents, decimalToCents } from "@/lib/money";

describe("documentos brasileiros", () => {
  it("valida CPF com dígitos verificadores", () => {
    expect(isValidCPF("529.982.247-25")).toBe(true);
    expect(isValidCPF("111.111.111-11")).toBe(false);
    expect(isValidCPF("529.982.247-24")).toBe(false);
    expect(formatCPF("52998224725")).toBe("529.982.247-25");
  });
  it("valida celular com DDD", () => {
    expect(isValidPhoneBR("(66) 99999-0000")).toBe(true);
    expect(isValidPhoneBR("+55 66 99999 0000")).toBe(true);
    expect(isValidPhoneBR("(66) 89999-0000")).toBe(false);
    expect(isValidPhoneBR("9999-0000")).toBe(false);
  });
  it("CEP e faixas", () => {
    expect(isValidCEP("78550-200")).toBe(true);
    expect(cepInRanges("78550200", "78550000-78559999")).toBe(true);
    expect(cepInRanges("78560000", "78550000-78559999")).toBe(false);
    expect(cepInRanges("12345678", "")).toBe(true);
  });
  it("link de WhatsApp", () => {
    expect(whatsappLink("(66) 99999-0000", "Oi")).toBe("https://wa.me/5566999990000?text=Oi");
    expect(whatsappLink("")).toBeNull();
  });
});

describe("dinheiro em centavos", () => {
  it("converte formatos brasileiros", () => {
    expect(parseBRLToCents("399,90")).toBe(39990);
    expect(parseBRLToCents("R$ 1.299,00")).toBe(129900);
    expect(parseBRLToCents("120")).toBe(12000);
    expect(parseBRLToCents("1.500")).toBe(150000);
    expect(() => parseBRLToCents("abc")).toThrow();
  });
  it("sem erro de ponto flutuante", () => {
    expect(decimalToCents(0.1 + 0.2)).toBe(30);
    expect(decimalToCents(399.9)).toBe(39990);
    expect(formatBRL(39990)).toBe("R$ 399,90");
  });
});
