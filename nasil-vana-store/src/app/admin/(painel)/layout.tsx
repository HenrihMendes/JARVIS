import { Suspense } from "react";
import { getAdmin } from "@/lib/auth/session";
import { AdminNav } from "@/components/admin/nav";
import { redirect } from "next/navigation";

async function Shell({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  if (admin.mustChangePassword) redirect("/admin/senha");
  return (
    <div className="lg:grid lg:min-h-dvh lg:grid-cols-[15rem_1fr]">
      <AdminNav name={admin.name} role={admin.role} />
      <main id="conteudo" className="min-w-0">{children}</main>
    </div>
  );
}

export default function PainelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div className="p-10"><div className="skeleton h-10 w-64" /></div>}>
      <Shell>{children}</Shell>
    </Suspense>
  );
}
