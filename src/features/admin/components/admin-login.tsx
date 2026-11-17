"use client";

import { useActionState } from "react";

import { adminLogin, type AdminLoginState } from "../actions/auth";
import { buttonClass, inputClass } from "./admin-ui";

const initial: AdminLoginState = { message: null };

export function AdminLogin({ configured }: { configured: boolean }) {
  const [state, action, pending] = useActionState(adminLogin, initial);
  return (
    <form action={action} className="mx-auto mt-16 grid max-w-sm gap-4">
      <h1 className="font-display text-4xl">Scrivania di Gianmaria</h1>
      <p className="text-sm text-[var(--muted)]">
        Pannello di controllo privato. Serve la tua passphrase, non il codice
        del sito.
      </p>
      {!configured ? (
        <p className="rounded-xl bg-[#fde7c4] p-3 text-sm" role="status">
          Pannello non configurato: imposta <code>ADMIN_PASSPHRASE</code>{" "}
          (almeno 24 caratteri) su Vercel e ripubblica.
        </p>
      ) : null}
      <label
        className="grid gap-1.5 text-sm font-semibold"
        htmlFor="admin-passphrase"
      >
        Passphrase
        <input
          autoComplete="current-password"
          autoFocus
          className={inputClass}
          id="admin-passphrase"
          maxLength={256}
          name="passphrase"
          required
          type="password"
        />
      </label>
      <button
        className={buttonClass("primary", "w-full")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Controllo…" : "Entra"}
      </button>
      <p aria-live="polite" className="min-h-5 text-sm text-[#b3261e]">
        {state.message}
      </p>
    </form>
  );
}
