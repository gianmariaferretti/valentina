import type { Metadata } from "next";
import Link from "next/link";

import { KissCasino } from "@/features/casino/components/kiss-casino";
import { toView } from "@/features/casino/lib/engine";
import { loadCasinoSnapshot } from "@/features/casino/repositories/load-casino";

export const metadata: Metadata = {
  title: "Kiss Casino",
};

export default async function KissCasinoPage() {
  const snapshot = await loadCasinoSnapshot();

  return (
    <div className="page-container py-4 sm:py-8">
      <header className="mb-3 text-center">
        <h1 className="sr-only">Kiss Casino</h1>
        <p className="text-[0.6rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
          V + G · Open late · Every chip is a real kiss
        </p>
      </header>

      {snapshot.failed ? (
        <div className="rounded-[1.6rem] border border-dashed border-[var(--line-strong)] px-6 py-14 text-center">
          <p className="font-display text-3xl">The casino is closed tonight.</p>
          <p className="mx-auto mt-3 max-w-md text-sm text-[var(--muted)]">
            The tables could not be reached. Nothing was charged. Please try
            again in a moment.
          </p>
          <Link className="mt-6 inline-block text-sm underline" href="/coupons">
            Back to the wallet
          </Link>
        </div>
      ) : (
        <KissCasino initialView={toView(snapshot.state, new Date())} />
      )}
    </div>
  );
}
