"use client";

import { useActionState } from "react";
import { changePasswordAction } from "../actions/auth";

export function PasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, null);
  return (
    <form action={action} className="mt-8 space-y-6 bg-paper p-8">
      <div><label htmlFor="current" className="field-label">Senha atual</label><input id="current" name="current" type="password" autoComplete="current-password" required className="input" /></div>
      <div><label htmlFor="next" className="field-label">Nova senha</label><input id="next" name="next" type="password" autoComplete="new-password" minLength={12} required className="input" /><p className="mt-1.5 text-[0.75rem] text-stone">Mínimo de 12 caracteres. Uma frase longa é mais segura e fácil de lembrar.</p></div>
      <div><label htmlFor="confirm" className="field-label">Confirmar nova senha</label><input id="confirm" name="confirm" type="password" autoComplete="new-password" required className="input" /></div>
      {state?.error && <p role="alert" className="field-error">{state.error}</p>}
      <button type="submit" disabled={pending} className="btn btn-primary w-full">Salvar nova senha</button>
    </form>
  );
}
