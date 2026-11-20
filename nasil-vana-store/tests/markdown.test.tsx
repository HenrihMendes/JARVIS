import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { renderMarkdown } from "@/lib/markdown";

const html = (src: string, vars = {}) => renderToStaticMarkup(<>{renderMarkdown(src, vars)}</>);

describe("markdown seguro", () => {
  it("escapa HTML e bloqueia links perigosos", () => {
    const out = html('<script>alert(1)</script> [x](javascript:alert(1)) [ok](https://a.com)');
    expect(out).not.toContain("<script>");
    expect(out).toContain("&lt;script&gt;");
    expect(out).not.toContain('href="javascript');
    expect(out).toContain('href="https://a.com"');
  });
  it("substitui variáveis e marca pendentes", () => {
    const out = html("CNPJ {{loja.cnpj}} — {{loja.nome}}", { "loja.nome": "Nasil" });
    expect(out).toContain("Nasil");
    expect(out).toContain("[informação pendente]");
  });
  it("remove comentários para a proprietária", () => {
    expect(html("Oi <!-- segredo -->")).not.toContain("segredo");
  });
});
