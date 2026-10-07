"use client";

import { useMemo, useState } from "react";

import { CouponCard } from "@/features/coupons/components/coupon-card";
import type { CouponFilter, CouponWalletItem } from "@/features/coupons/types";
import { cn } from "@/lib/cn";

const filters = [
  { value: "all", label: "All" },
  { value: "dates", label: "Dates" },
  { value: "food", label: "Food" },
  { value: "romantic", label: "Romantic" },
  { value: "emergency", label: "Emergency" },
  { value: "premium", label: "Premium" },
  { value: "legendary", label: "Legendary" },
  { value: "impossible", label: "Impossible" },
] as const satisfies readonly { value: CouponFilter; label: string }[];

export function CouponWallet({
  coupons,
}: {
  coupons: readonly CouponWalletItem[];
}) {
  const [activeFilter, setActiveFilter] = useState<CouponFilter>("all");

  const filteredCoupons = useMemo(() => {
    if (activeFilter === "all") return coupons;

    return coupons.filter(
      (coupon) =>
        coupon.status !== "undiscovered" &&
        (coupon.category === activeFilter || coupon.rarity === activeFilter),
    );
  }, [activeFilter, coupons]);

  return (
    <section className="mt-10 sm:mt-14" aria-labelledby="coupon-collection">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="text-[0.6rem] font-bold tracking-[0.18em] text-[var(--rust)] uppercase">
            The collection
          </p>
          <h2
            className="mt-2 font-display text-4xl tracking-[-0.04em] sm:text-5xl"
            id="coupon-collection"
          >
            Pick carefully.
          </h2>
        </div>
        <p className="hidden text-xs text-[var(--muted)] sm:block">
          {filteredCoupons.length} shown
        </p>
      </div>

      <div className="-mx-5 mt-7 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        <div
          aria-label="Filter coupons"
          className="flex w-max gap-2"
          role="group"
        >
          {filters.map((filter) => (
            <button
              aria-pressed={activeFilter === filter.value}
              className={cn(
                "min-h-11 rounded-full border px-4 text-[0.62rem] font-bold tracking-[0.12em] uppercase transition",
                activeFilter === filter.value
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-white)]"
                  : "border-[var(--line-strong)] bg-white/30 hover:border-[var(--ink)] hover:bg-white/60",
              )}
              key={filter.value}
              onClick={() => setActiveFilter(filter.value)}
              type="button"
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">
        Showing {filteredCoupons.length} coupons
      </p>

      {filteredCoupons.length > 0 ? (
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredCoupons.map((coupon) => (
            <CouponCard coupon={coupon} key={coupon.id} />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--line-strong)] px-6 py-16 text-center">
          <p className="font-display text-3xl">Nothing in this pocket yet.</p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            This category is either empty or being suspiciously secretive.
          </p>
        </div>
      )}
    </section>
  );
}
