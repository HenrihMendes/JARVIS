"use client";

import { createContext, startTransition, useActionState, useContext, useEffect, useRef, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

const PendingCtx = createContext<boolean | null>(null);

/* Componentes simples do painel. Foco: clareza para quem não é técnica. */

export type ActionState = { ok?: boolean; message?: string; errors?: Record<string, string> } | null;

export function ActionForm({
  action,
  children,
  className = "",
  resetOnSuccess = false,
  confirm,
}: {
  action: (s: ActionState, f: FormData) => Promise<ActionState>;
  children: ReactNode | ((state: ActionState) => ReactNode);
  className?: string;
  resetOnSuccess?: boolean;
  confirm?: string;
}) {
  const [state, dispatch, pending] = useActionState(action, null);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok && resetOnSuccess) ref.current?.reset();
  }, [state, resetOnSuccess]);
  return (
    // Envio manual: o React 19 limpa formulários enviados via `action`; aqui os campos são
    // preservados quando há erro de validação.
    <form
      ref={ref}
      className={className}
      onSubmit={(e) => {
        e.preventDefault();
        if (confirm && !window.confirm(confirm)) return;
        const fd = new FormData(e.currentTarget);
        startTransition(() => dispatch(fd));
      }}
    >
      <PendingCtx.Provider value={pending}>{typeof children === "function" ? children(state) : children}</PendingCtx.Provider>
      {state?.message && (
        <p role={state.ok ? "status" : "alert"} className={`mt-4 text-sm ${state.ok ? "text-ok" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}

export function Submit({ children, variant = "primary", className = "" }: { children: ReactNode; variant?: "primary" | "outline" | "danger"; className?: string }) {
  const ctx = useContext(PendingCtx);
  const status = useFormStatus();
  const pending = ctx ?? status.pending;
  const v = variant === "danger" ? "btn btn-outline !border-danger !text-danger hover:!text-paper [&::before]:!bg-danger" : variant === "outline" ? "btn btn-outline" : "btn btn-primary";
  return (
    <button type="submit" disabled={pending} className={`${v} !min-h-11 ${className}`}>
      {pending ? "Salvando…" : children}
    </button>
  );
}

export function F({
  label,
  name,
  error,
  hint,
  className = "",
  as = "input",
  children,
  ...rest
}: {
  label: string;
  name: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  as?: "input" | "textarea" | "select";
  children?: ReactNode;
} & Record<string, unknown>) {
  const id = `a-${name}`;
  const common = { id, name, className: "input", "aria-invalid": error ? true : undefined, ...rest };
  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {as === "textarea" ? (
        <textarea {...(common as React.TextareaHTMLAttributes<HTMLTextAreaElement>)} />
      ) : as === "select" ? (
        <select {...(common as React.SelectHTMLAttributes<HTMLSelectElement>)}>{children}</select>
      ) : (
        <input {...(common as React.InputHTMLAttributes<HTMLInputElement>)} />
      )}
      {hint && !error && <p className="mt-1.5 text-[0.75rem] leading-snug text-stone">{hint}</p>}
      {error && <p className="field-error">{error}</p>}
    </div>
  );
}

export function Check({ label, name, defaultChecked, hint }: { label: string; name: string; defaultChecked?: boolean; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-3 text-sm">
      <input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-0.5 h-4 w-4 accent-[var(--color-ink)]" />
      <span>
        {label}
        {hint && <span className="block text-[0.75rem] text-stone">{hint}</span>}
      </span>
    </label>
  );
}
