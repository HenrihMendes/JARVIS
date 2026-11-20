import type { Metadata } from "next";
import { Suspense } from "react";
import { asc, desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth/session";
import { AdminPage, Badge, Card, Table } from "@/components/admin/server-ui";
import { ActionForm, F, Submit } from "@/components/admin/ui";
import { createAdminUserAction, toggleAdminUserAction } from "@/app/admin/actions/store";

export const metadata: Metadata = { title: "Usuários" };

async function List() {
  const me = await requireAdmin({ role: "owner" });
  const [users, log] = await Promise.all([
    db.select().from(schema.adminUsers).orderBy(asc(schema.adminUsers.createdAt)),
    db.select().from(schema.auditLog).orderBy(desc(schema.auditLog.createdAt)).limit(40),
  ]);
  return (
    <div className="space-y-6">
      <Table head={["Nome", "E-mail", "Papel", "Último acesso", ""]}>
        {users.map((u) => (
          <tr key={u.id}>
            <td className="px-4 py-3">{u.name}</td>
            <td className="px-4 py-3">{u.email}</td>
            <td className="px-4 py-3"><Badge tone={u.role === "owner" ? "ink" : "neutral"}>{u.role === "owner" ? "Proprietária" : "Equipe"}</Badge> {!u.active && <Badge tone="danger">Inativo</Badge>}</td>
            <td className="px-4 py-3 text-stone">{u.lastLoginAt?.toLocaleString("pt-BR", { timeZone: "America/Cuiaba" }) ?? "—"}</td>
            <td className="px-4 py-3 text-right">
              {u.id !== me.id && (
                <ActionForm action={toggleAdminUserAction} confirm={u.active ? `Desativar ${u.name}?` : `Reativar ${u.name}?`}>
                  <input type="hidden" name="id" value={u.id} />
                  <button className="text-sm underline">{u.active ? "Desativar" : "Reativar"}</button>
                </ActionForm>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Card title="Novo usuário">
        <ActionForm action={createAdminUserAction} resetOnSuccess className="grid gap-5 sm:grid-cols-4 sm:items-end">
          <F label="Nome" name="name" />
          <F label="E-mail" name="email" type="email" />
          <F label="Papel" name="role" as="select" defaultValue="staff">
            <option value="staff">Equipe (sem configurações e reembolsos)</option>
            <option value="owner">Proprietária (acesso total)</option>
          </F>
          <Submit>Criar</Submit>
        </ActionForm>
      </Card>
      <Card title="Registro de atividades (auditoria)">
        <ul className="space-y-1.5 text-[0.8125rem]">
          {log.map((l) => (
            <li key={l.id} className="grid grid-cols-[9rem_1fr] gap-3">
              <span className="text-stone tabular">{l.createdAt.toLocaleString("pt-BR", { timeZone: "America/Cuiaba", dateStyle: "short", timeStyle: "short" })}</span>
              <span>{l.actorEmail ?? "—"} · {l.action}{l.entity ? ` · ${l.entity}` : ""}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

export default function UsuariosPage() {
  return (
    <AdminPage title="Usuários" description="Quem acessa o painel. Cada pessoa deve ter o próprio login — nunca compartilhe senhas.">
      <Suspense fallback={<div className="skeleton h-64" />}><List /></Suspense>
    </AdminPage>
  );
}
