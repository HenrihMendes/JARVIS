"use client";

import { useActionState } from "react";
import { loginAction } from "../actions/auth";

export function LoginForm() {
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="mt-8 space-y-6 bg-paper p-8 shadow-[0_20px_60px_-30px_rgba(0,0,0,.3)]">
      <div>
        <label htmlFor="email" className="field-label">E-mail</label>
        <input id="email" name="email" type="email" autoComplete="username" required className="input" defaultValue={state?.email ?? ""} key={state?.email ?? "e"} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">Senha</label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
      </div>
      {state?.error && <p role="alert" className="field-error">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">{pending ? "Entrando…" : "Entrar"}</button>
    </form>
  );
}
