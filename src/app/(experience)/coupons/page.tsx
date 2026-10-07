import { ArrowUpRight, CircleDollarSign } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PageIntro } from "@/components/ui/page-intro";
import { coupons } from "@/data/coupons";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Coupons",
};

export default function CouponsPage() {
  return (
    <div className="page-container py-10 sm:py-14 lg:py-20">
      <PageIntro
        aside={
          <div className="mt-5 flex gap-2 text-[0.62rem] font-semibold tracking-[0.13em] uppercase">
            <span className="rounded-full border border-[var(--line)] px-3 py-1.5">
              03 drafted
            </span>
            <span className="rounded-full border border-[var(--line)] px-3 py-1.5">
              01 impossible
            </span>
          </div>
        }
        description="Some are useful. Some are dangerous. One would bankrupt the finance department, which currently consists of one nervous Italian."
        eyebrow="Valentina’s private wallet"
        title="Coupons, with terms and conditions-ish."
      />

      <section className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3 sm:mt-12">
        {coupons.map((coupon) => (
          <Link
            className={cn(
              "group relative flex min-h-80 flex-col overflow-hidden rounded-[1.75rem] border p-6 transition duration-500 hover:-translate-y-1 sm:p-8",
              coupon.isImpossible
                ? "border-[var(--rust)] bg-[var(--rust)] text-white"
                : "border-[var(--line)] bg-white/40",
            )}
            href={`/coupons/${coupon.id}`}
            key={coupon.id}
          >
            <div
              className={cn(
                "absolute top-1/2 -left-3 size-6 -translate-y-1/2 rounded-full border bg-[var(--paper)]",
                coupon.isImpossible
                  ? "border-[var(--rust)]"
                  : "border-[var(--line)]",
              )}
            />
            <div
              className={cn(
                "absolute top-1/2 -right-3 size-6 -translate-y-1/2 rounded-full border bg-[var(--paper)]",
                coupon.isImpossible
                  ? "border-[var(--rust)]"
                  : "border-[var(--line)]",
              )}
            />
            <div className="flex items-center justify-between">
              <span
                className={cn(
                  "font-mono text-[0.68rem] tracking-[0.12em]",
                  coupon.isImpossible ? "text-white/60" : "text-[var(--muted)]",
                )}
              >
                {coupon.code}
              </span>
              {coupon.isImpossible ? (
                <CircleDollarSign aria-hidden="true" size={18} />
              ) : (
                <ArrowUpRight
                  aria-hidden="true"
                  className="transition-transform group-hover:translate-x-1 group-hover:-translate-y-1"
                  size={18}
                />
              )}
            </div>
            <div className="my-auto py-10">
              <p
                className={cn(
                  "text-[0.6rem] font-semibold tracking-[0.16em] uppercase",
                  coupon.isImpossible ? "text-white/55" : "text-[var(--muted)]",
                )}
              >
                {coupon.category}
              </p>
              <h2 className="mt-3 font-display text-4xl leading-none tracking-[-0.035em]">
                {coupon.title}
              </h2>
              <p
                className={cn(
                  "mt-4 max-w-sm text-sm leading-6",
                  coupon.isImpossible ? "text-white/65" : "text-[var(--muted)]",
                )}
              >
                {coupon.description}
              </p>
            </div>
            <div
              className={cn(
                "border-t border-dashed pt-4 text-[0.58rem] font-semibold tracking-[0.14em] uppercase",
                coupon.isImpossible
                  ? "border-white/25 text-white/60"
                  : "border-[var(--line-strong)] text-[var(--muted)]",
              )}
            >
              Redemption flow · next phase
            </div>
          </Link>
        ))}
      </section>
    </div>
  );
}
