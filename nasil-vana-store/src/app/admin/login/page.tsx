import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { Logo } from "@/components/brand/logo";

export const metadata: Metadata = { title: "Entrar" };

export default function LoginPage() {
  return (
    <main className="grid min-h-dvh place-items-center px-6">
      <div className="w-full max-w-sm">
        <Logo variant="full" className="mx-auto block h-12" />
        <h1 className="eyebrow mt-10 text-center text-stone">Painel administrativo</h1>
        <LoginForm />
      </div>
    </main>
  );
}
