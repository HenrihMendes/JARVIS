import type { ReactNode } from "react";
import Link from "next/link";

export function AdminPage({ title, description, actions, children, back }: { title: string; description?: ReactNode; actions?: ReactNode; children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <div className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
      {back && (
        <Link href={back.href} className="eyebrow text-stone hover:text-ink">
          ← {back.label}
        </Link>
      )}
      <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="serif text-4xl">{title}</h1>
          {description && <div className="mt-2 max-w-2xl text-sm text-stone">{description}</div>}
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="mt-8">{children}</div>
    </div>
  );
}

export function Card({ title, children, className = "", aside }: { title?: ReactNode; children: ReactNode; className?: string; aside?: ReactNode }) {
  return (
    <section className={`bg-paper p-6 ring-1 ring-line sm:p-7 ${className}`}>
      {title && (
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="eyebrow text-stone">{title}</h2>
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "ok" | "warn" | "danger" | "ink" }) {
  const t = { neutral: "bg-linen text-ink-2", ok: "bg-ok/12 text-ok", warn: "bg-warn/12 text-warn", danger: "bg-danger/10 text-danger", ink: "bg-ink text-paper" }[tone];
  return <span className={`inline-flex items-center whitespace-nowrap rounded-full px-2.5 py-0.5 text-[0.6875rem] font-medium uppercase tracking-[0.08em] ${t}`}>{children}</span>;
}

export function Table({ head, children, empty }: { head: ReactNode[]; children: ReactNode; empty?: string }) {
  return (
    <div className="overflow-x-auto bg-paper ring-1 ring-line">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line">
          <tr>
            {head.map((h, i) => (
              <th key={i} scope="col" className="px-4 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.12em] text-stone">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty && <p className="px-4 py-10 text-center text-sm text-stone">{empty}</p>}
    </div>
  );
}

export function Stat({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="bg-paper p-6 ring-1 ring-line">
      <p className="eyebrow text-stone">{label}</p>
      <p className="serif mt-3 text-3xl tabular">{value}</p>
      {hint && <p className="mt-1 text-[0.75rem] text-stone">{hint}</p>}
    </div>
  );
}

export function statusTone(s: string) {
  if (s === "needs_attention") return "danger" as const;
  if (s === "pending_payment") return "warn" as const;
  if (["cancelled", "expired", "refunded"].includes(s)) return "neutral" as const;
  if (s === "delivered") return "ink" as const;
  return "ok" as const;
}
