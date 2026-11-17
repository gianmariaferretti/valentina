"use client";

import { Shuffle } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CouponTicket } from "@/features/coupons/components/coupon-ticket";
import {
  dayKey,
  pickCouponOfTheDay,
} from "@/features/coupons/lib/coupon-domain";
import type { CouponWalletItem } from "@/features/coupons/types";

/**
 * Today's coupon, big, with its rarity finish. The server renders the pick
 * for today in Rome (so it is in the HTML at once); the browser then checks
 * its own date and switches only if it differs (near midnight, or abroad).
 * The same pick as in the wallet, changing at midnight.
 */
export function DailyCoupon({
  candidates,
  initialPick,
}: {
  candidates: readonly CouponWalletItem[];
  initialPick: CouponWalletItem | null;
}) {
  const [pick, setPick] = useState<CouponWalletItem | null | undefined>(
    initialPick,
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const local = pickCouponOfTheDay(candidates, dayKey(new Date()));
      setPick((current) => (current?.id === local?.id ? current : local));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [candidates]);

  return (
    <section aria-labelledby="daily-title" className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h2
          className="flex items-center gap-2 text-[0.62rem] font-bold tracking-[0.18em] uppercase"
          id="daily-title"
        >
          <Shuffle aria-hidden="true" size={14} />
          Coupon of the day
        </h2>
        <span className="text-[0.56rem] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
          Changes at midnight
        </span>
      </div>

      {pick === undefined ? (
        <div
          aria-hidden="true"
          className="aspect-[1.55] w-full animate-pulse rounded-[1.4rem] bg-[var(--paper-deep)] motion-reduce:animate-none"
        />
      ) : pick === null ? (
        <div className="grid min-h-56 place-items-center rounded-[1.4rem] border border-dashed border-[var(--line-strong)] p-6 text-center">
          <div>
            <p className="font-display text-3xl">Nothing to use today.</p>
            <p className="mt-2 text-sm text-[var(--muted)]">
              Everything is used or sealed. Impressive, honestly.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid gap-3">
          <div className="text-[1.04rem] sm:text-[1.12rem]">
            <CouponTicket
              featured
              coupon={{
                ...pick,
                // The home shows it; redeeming happens on the coupon page.
                redeemable: false,
                callToAction: "USE TODAY?",
              }}
            />
          </div>
          {pick.href ? (
            <Link
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--ink)] px-6 text-xs font-bold tracking-[0.14em] text-[var(--paper-white)] uppercase transition hover:bg-[var(--oxblood)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
              href={pick.href}
            >
              Use today?
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
