import type { Metadata } from "next";
import { Suspense } from "react";
import { requireAdmin } from "@/lib/auth/session";
import { PasswordForm } from "./password-form";

export const metadata: Metadata = { title: "Alterar senha" };

async function Gate() {
  const admin = await requireAdmin({ allowPasswordChange: true });
  return (
    <>
      {admin.mustChangePassword && <p className="mt-4 text-sm text-warn">Por segurança, defina uma nova senha antes de continuar.</p>}
      <PasswordForm />
    </>
  );
}

export default function SenhaPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="serif text-3xl">Alterar senha</h1>
        <Suspense fallback={<div className="skeleton mt-8 h-72" />}>
          <Gate />
        </Suspense>
      </div>
    </main>
  );
}
