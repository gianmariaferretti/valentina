"use client";

import Link from "next/link";
import { useState, useTransition } from "react";

import { claimHouseAlwaysLoses } from "../actions";

export function FinaleClaim({ claimed }: { claimed: boolean }) {
  const [result, setResult] = useState<
    | { ok: true; couponId: string; forgiven: number }
    | { ok: false; message: string }
    | null
  >(null);
  const [pending, startTransition] = useTransition();

  if (claimed && !result)
    return (
      <p className="mt-5 text-sm text-[var(--muted)]">
        Already claimed. The house lost, as foretold.
      </p>
    );

  if (result?.ok)
    return (
      <div className="mt-5" role="status">
        <p className="font-display text-2xl">
          {result.forgiven > 0
            ? `${result.forgiven} kisses forgiven. Debt: zero.`
            : "Debt: zero. It already was, which is suspicious."}
        </p>
        <Link
          className="mt-3 inline-block text-sm font-bold underline"
          href={`/coupons/${result.couponId}`}
        >
          See the coupon in your wallet
        </Link>
      </div>
    );

  return (
    <div className="mt-5">
      <button
        className="min-h-12 w-full rounded-full bg-[var(--rust)] px-6 text-[0.72rem] font-bold tracking-[0.14em] text-white uppercase transition hover:bg-[var(--oxblood)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)] disabled:opacity-50 sm:w-auto"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const response = await claimHouseAlwaysLoses();
            if (response.ok && response.event.kind === "finale") {
              setResult({
                ok: true,
                couponId: response.event.coupons[0]?.couponId ?? "",
                forgiven: response.event.forgiven,
              });
            } else
              setResult({
                ok: false,
                message: response.ok ? "Unexpected result." : response.message,
              });
          })
        }
        type="button"
      >
        {pending ? "Claiming…" : "Claim “The House Always Loses to You”"}
      </button>
      {result && !result.ok ? (
        <p className="mt-3 text-sm text-[var(--rust)]" role="alert">
          {result.message}
        </p>
      ) : null}
    </div>
  );
}
