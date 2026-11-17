"use client";

import { useState, useTransition } from "react";

import {
  confirmEmailAction,
  type EmailActionResult,
} from "../actions/email-action";

export function ConfirmAction({
  token,
  label,
}: {
  token: string;
  label: string;
}) {
  const [result, setResult] = useState<EmailActionResult | null>(null);
  const [pending, startTransition] = useTransition();
  if (result)
    return (
      <p
        aria-live="polite"
        className={`rounded-2xl p-4 text-base ${result.ok ? "bg-[#dbeccf]" : "bg-[#f8d7d3]"}`}
      >
        {result.message}
      </p>
    );
  return (
    <button
      className="min-h-14 w-full rounded-full bg-[var(--ink)] px-6 text-lg font-semibold text-[var(--paper-white)] disabled:opacity-60"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          setResult(
            await confirmEmailAction(token).catch(() => ({
              ok: false,
              message: "Connessione persa. Riprova.",
            })),
          );
        })
      }
      type="button"
    >
      {pending ? "Un attimo…" : label}
    </button>
  );
}
