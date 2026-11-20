import type { ReactNode } from "react";
import Link from "next/link";

/**
 * Markdown mínimo e SEGURO para páginas editáveis no painel.
 * - Nunca usa innerHTML: tudo vira elemento React (texto é escapado pelo React).
 * - Suporta: ## / ### títulos, parágrafos, listas (- e 1.), **negrito**, *itálico*,
 *   [links](url) apenas http(s), mailto, tel ou relativos, tabelas simples e comentários <!-- -->.
 * - {{chave}} é substituído por valores das configurações; vazio vira "[informação pendente]".
 */
export type Vars = Record<string, string | null | undefined>;

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/))/i;

function inline(text: string, vars: Vars, key = "i"): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(\{\{([a-zA-Z0-9_.]+)\}\})|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\(([^)\s]+)\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let n = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const k = `${key}-${n++}`;
    if (m[1]) {
      const v = vars[m[2]];
      out.push(v ? v : <span key={k} className="pending">[informação pendente]</span>);
    } else if (m[3]) out.push(<strong key={k}>{inline(m[4], vars, k)}</strong>);
    else if (m[5]) out.push(<em key={k}>{inline(m[6], vars, k)}</em>);
    else if (m[7]) {
      const href = m[9];
      if (SAFE_HREF.test(href)) {
        out.push(
          href.startsWith("/") ? (
            <Link key={k} href={href}>{m[8]}</Link>
          ) : (
            <a key={k} href={href} rel="noopener noreferrer" target={href.startsWith("http") ? "_blank" : undefined}>
              {m[8]}
            </a>
          ),
        );
      } else out.push(m[8]);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function renderMarkdown(src: string, vars: Vars = {}): ReactNode {
  const clean = src.replace(/<!--[\s\S]*?-->/g, "").replace(/\r\n/g, "\n");
  const lines = clean.split("\n");
  const blocks: ReactNode[] = [];
  let i = 0;
  let b = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim()) {
      i++;
      continue;
    }
    const k = `b${b++}`;
    let m: RegExpMatchArray | null;
    if ((m = line.match(/^(#{2,3})\s+(.*)$/))) {
      blocks.push(m[1] === "##" ? <h2 key={k}>{inline(m[2], vars, k)}</h2> : <h3 key={k}>{inline(m[2], vars, k)}</h3>);
      i++;
    } else if (/^\s*[-*]\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) {
        items.push(<li key={`${k}-${items.length}`}>{inline(lines[i].replace(/^\s*[-*]\s+/, ""), vars, `${k}-${items.length}`)}</li>);
        i++;
      }
      blocks.push(<ul key={k}>{items}</ul>);
    } else if (/^\s*\d+\.\s+/.test(line)) {
      const items: ReactNode[] = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) {
        items.push(<li key={`${k}-${items.length}`}>{inline(lines[i].replace(/^\s*\d+\.\s+/, ""), vars, `${k}-${items.length}`)}</li>);
        i++;
      }
      blocks.push(<ol key={k}>{items}</ol>);
    } else if (/^\|.*\|\s*$/.test(line)) {
      const rows: string[][] = [];
      while (i < lines.length && /^\|.*\|\s*$/.test(lines[i])) {
        if (!/^\|[\s:|-]+\|\s*$/.test(lines[i])) rows.push(lines[i].trim().slice(1, -1).split("|").map((c) => c.trim()));
        i++;
      }
      const [head, ...body] = rows;
      blocks.push(
        <div key={k} className="my-6 overflow-x-auto">
          <table className="w-full min-w-[420px] border-collapse text-left text-sm">
            <thead>
              <tr>{head.map((c, j) => <th key={j} className="border-b border-ink py-2 pr-4 font-medium">{inline(c, vars)}</th>)}</tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={ri}>{r.map((c, j) => <td key={j} className="border-b border-line py-2 pr-4 tabular">{inline(c, vars)}</td>)}</tr>
              ))}
            </tbody>
          </table>
        </div>,
      );
    } else {
      const para: string[] = [];
      while (i < lines.length && lines[i].trim() && !/^(#{2,3}\s|\s*[-*]\s|\s*\d+\.\s|\|)/.test(lines[i])) para.push(lines[i++].trim());
      blocks.push(<p key={k}>{inline(para.join(" "), vars, k)}</p>);
    }
  }
  return <>{blocks}</>;
}
