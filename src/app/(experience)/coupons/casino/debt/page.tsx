import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { casinoConfig } from "@/data/casino-config";
import styles from "@/features/casino/components/casino.module.css";
import { KissDebtForm } from "@/features/casino/components/kiss-debt-form";
import {
  loadCasinoLedger,
  loadCasinoSnapshot,
} from "@/features/casino/repositories/load-casino";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Kiss Debt",
};

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default async function KissDebtPage() {
  await requireAccessSession();
  const [snapshot, ledger] = await Promise.all([
    loadCasinoSnapshot(),
    loadCasinoLedger(),
  ]);
  const debt = snapshot.state.debt;
  const season = snapshot.state.season;
  const currentRows = ledger.rows.filter((row) => row.season === season);
  const hasHistory = currentRows.length > 0;
  // Finished seasons are archived, never deleted.
  const archived = [...new Set(ledger.rows.map((row) => row.season))]
    .filter((value) => value !== season)
    .sort((a, b) => b - a)
    .map((value) => {
      const rows = ledger.rows.filter((row) => row.season === value);
      return {
        season: value,
        rows,
        owedAtClose: Math.max(
          0,
          rows.reduce((sum, row) => sum + row.realKisses, 0),
        ),
      };
    });
  const interest = casinoConfig.debtInterest;

  return (
    <div className="page-container max-w-3xl py-8 sm:py-12">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-xs font-bold tracking-[0.12em] text-[var(--muted)] uppercase hover:text-[var(--ink)]"
        href="/coupons/casino"
      >
        <ArrowLeft aria-hidden="true" size={15} />
        Back to the casino
      </Link>

      <h1 className="mt-4 font-display text-[clamp(2.6rem,9vw,5rem)] leading-[0.9] tracking-[-0.05em]">
        Kiss Debt
      </h1>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--muted)]">
        The official ledger of real kisses owed to Gianmaria. Payable in person
        or on video call. Settled on trust: mark what you paid.
      </p>

      {snapshot.failed || ledger.failed ? (
        <p className="mt-8 rounded-2xl border border-dashed border-[var(--line-strong)] p-6 text-sm">
          The ledger is temporarily unavailable. Your debt has not changed.
        </p>
      ) : (
        <div className={`${styles.ledger} mt-8`}>
          {debt === 0 && hasHistory ? (
            <p className={styles.paidStamp}>PAID IN FULL</p>
          ) : null}
          <p className="text-sm">Season {season} · total owed to Gianmaria</p>
          <p className="font-display text-6xl leading-none">
            {debt} <span aria-hidden="true">💋</span>
            <span className="sr-only">real kisses</span>
          </p>
          {debt > interest.threshold ? (
            <p className="mt-2 text-base text-[#b0302a]">
              Over {interest.threshold}: the bank charges{" "}
              {Math.round(interest.rate * 100)}% interest in extra kisses, at
              most once a day. Rules are rules.
            </p>
          ) : null}

          <KissDebtForm debt={debt} />

          <h2 className="mt-10 text-lg font-bold">History</h2>
          {hasHistory ? (
            <ul className="mt-2">
              {currentRows.map((row) => (
                <li className={styles.ledgerRow} key={row.id}>
                  <span>
                    {formatDate(row.at)} · {row.label}
                    {row.chips > 0 ? ` (+${row.chips} chips)` : ""}
                  </span>
                  <span
                    className={
                      row.realKisses > 0 ? "text-[#b0302a]" : "text-[#2f7d4f]"
                    }
                  >
                    {row.realKisses > 0 ? `+${row.realKisses}` : row.realKisses}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.ledgerRow}>
              Nothing yet. Suspiciously responsible.
            </p>
          )}
        </div>
      )}

      {archived.length > 0 ? (
        <section aria-labelledby="archived-seasons" className="mt-10">
          <h2 className="font-display text-3xl" id="archived-seasons">
            Archived seasons
          </h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            Redeeming a casino coupon closes the season. Its ledger stays here.
          </p>
          <div className="mt-4 grid gap-3">
            {archived.map((entry) => (
              <details
                className="rounded-2xl border border-[var(--line-strong)] bg-[var(--paper-white)] p-4"
                key={entry.season}
              >
                <summary className="cursor-pointer font-semibold">
                  Season {entry.season} · closed ·{" "}
                  {entry.owedAtClose > 0
                    ? `${entry.owedAtClose} kisses still owed at close`
                    : "paid in full"}
                </summary>
                <ul className="mt-3 grid gap-1 text-sm">
                  {entry.rows.map((row) => (
                    <li className="flex justify-between gap-3" key={row.id}>
                      <span>
                        {formatDate(row.at)} · {row.label}
                      </span>
                      <span>
                        {row.realKisses > 0
                          ? `+${row.realKisses}`
                          : row.realKisses}
                      </span>
                    </li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
