"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { recordKissPayment } from "../actions";

/** Valentina records the kisses she paid. Trust-based: no confirmation. */
export function KissDebtForm({ debt }: { debt: number }) {
  const router = useRouter();
  const [amount, setAmount] = useState(Math.min(5, Math.max(1, debt)));
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-6 grid gap-3 sm:grid-cols-[minmax(0,10rem)_auto] sm:items-end"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          const result = await recordKissPayment(amount);
          setMessage(
            result.ok
              ? result.debt === 0
                ? "Paid in full. Gianmaria is both proud and slightly poorer."
                : `Recorded. ${result.debt} still owed.`
              : result.message,
          );
          if (result.ok) router.refresh();
        });
      }}
    >
      <label className="grid gap-1.5 text-sm font-semibold">
        Kisses paid
        <input
          className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-white px-4 text-lg"
          disabled={debt === 0 || pending}
          inputMode="numeric"
          max={Math.max(1, debt)}
          min={1}
          onChange={(event) =>
            setAmount(Math.floor(Number(event.target.value) || 0))
          }
          type="number"
          value={amount}
        />
      </label>
      <button
        className="min-h-12 rounded-full bg-[var(--rust)] px-6 text-[0.7rem] font-bold tracking-[0.14em] text-white uppercase transition hover:bg-[var(--oxblood)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)] disabled:opacity-50"
        disabled={debt === 0 || pending || amount < 1}
        type="submit"
      >
        {pending ? "Recording…" : "I paid 💋"}
      </button>
      {message ? (
        <p className="text-sm text-[var(--rust)] sm:col-span-2" role="status">
          {message}
        </p>
      ) : null}
    </form>
  );
}
