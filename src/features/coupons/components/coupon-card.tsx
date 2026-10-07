import { ArrowUpRight, LockKeyhole, Sparkles, TicketCheck } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/cn";
import type { CouponRarity, CouponWalletItem } from "@/features/coupons/types";

const rarityClassNames: Record<CouponRarity, string> = {
  standard:
    "border-[var(--line-strong)] bg-[var(--paper-white)] text-[var(--ink)]",
  premium:
    "border-[var(--oxblood)] bg-[var(--oxblood)] text-[var(--paper-white)]",
  legendary:
    "border-[#9c7623] bg-[#e7c862] text-[var(--ink)] shadow-[0_18px_50px_rgba(119,82,18,0.16)]",
  impossible:
    "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-white)] shadow-[inset_0_0_0_1px_rgba(180,98,88,0.55)]",
};

const statusLabels = {
  available: "Available",
  redeemed: "Redeemed",
  locked: "Locked",
  undiscovered: "Undiscovered",
} as const;

export function CouponCard({ coupon }: { coupon: CouponWalletItem }) {
  if (coupon.status === "undiscovered") {
    return (
      <article className="relative flex min-h-[23rem] flex-col overflow-hidden rounded-[1.6rem] border border-dashed border-[var(--line-strong)] bg-[repeating-linear-gradient(135deg,rgba(36,30,28,0.025)_0_10px,transparent_10px_20px)] p-6 text-[var(--muted)] sm:p-7">
        <div className="flex items-start justify-between">
          <span className="font-mono text-xs tracking-[0.16em]">GV-???</span>
          <LockKeyhole aria-hidden="true" size={19} strokeWidth={1.5} />
        </div>
        <div className="my-auto py-12 text-center">
          <span className="mx-auto grid size-16 place-items-center rounded-full border border-dashed border-[var(--line-strong)] font-display text-3xl">
            ?
          </span>
          <h2 className="mt-6 font-display text-5xl tracking-[-0.04em]">???</h2>
          <p className="mx-auto mt-4 max-w-xs text-sm leading-6">
            {coupon.shortDescription}
          </p>
        </div>
        <div className="border-t border-dashed border-[var(--line-strong)] pt-4 text-[0.58rem] font-bold tracking-[0.15em] uppercase">
          Undiscovered · Keep looking
        </div>
      </article>
    );
  }

  const rarity = coupon.rarity ?? "standard";
  const isDark = rarity === "premium" || rarity === "impossible";
  const content = (
    <article
      className={cn(
        "group relative flex min-h-[23rem] flex-col overflow-hidden rounded-[1.6rem] border p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-lifted)] sm:p-7",
        rarityClassNames[rarity],
        coupon.status === "redeemed" && "opacity-75 saturate-[0.7]",
      )}
    >
      <span
        aria-hidden="true"
        className="absolute top-[68%] -left-3 size-6 rounded-full border border-current bg-[var(--paper)] opacity-50"
      />
      <span
        aria-hidden="true"
        className="absolute top-[68%] -right-3 size-6 rounded-full border border-current bg-[var(--paper)] opacity-50"
      />

      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="font-mono text-xs tracking-[0.16em] opacity-70">
            {coupon.code}
          </p>
          <p className="mt-2 text-[0.56rem] font-bold tracking-[0.18em] uppercase opacity-50">
            {coupon.category} · {rarity}
          </p>
        </div>
        {coupon.status === "redeemed" ? (
          <TicketCheck aria-hidden="true" size={21} strokeWidth={1.5} />
        ) : rarity === "legendary" || rarity === "impossible" ? (
          <Sparkles aria-hidden="true" size={21} strokeWidth={1.5} />
        ) : (
          <ArrowUpRight
            aria-hidden="true"
            className="transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1"
            size={21}
            strokeWidth={1.5}
          />
        )}
      </div>

      <div className="my-auto py-10">
        <h2 className="max-w-md font-display text-[2.7rem] leading-[0.9] tracking-[-0.045em] sm:text-5xl">
          {coupon.title}
        </h2>
        <p className="mt-5 max-w-sm text-sm leading-6 opacity-62">
          {coupon.shortDescription}
        </p>
      </div>

      <div className="flex min-h-14 items-center justify-between gap-3 border-t border-dashed border-current pt-4 text-[0.56rem] font-bold tracking-[0.13em] uppercase">
        <span
          className={cn(
            "rounded-full border border-current px-2.5 py-1.5 opacity-70",
            coupon.status === "redeemed" &&
              "-rotate-2 border-[var(--red-muted)] text-[var(--red-muted)] opacity-100",
          )}
        >
          {statusLabels[coupon.status]}
        </span>
        <span className={cn("text-right", isDark && "text-white/75")}>
          {coupon.callToAction}
        </span>
      </div>
    </article>
  );

  return coupon.href ? (
    <Link
      aria-label={`${coupon.callToAction}: ${coupon.title}`}
      className="rounded-[1.6rem] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
      href={coupon.href}
    >
      {content}
    </Link>
  ) : (
    content
  );
}
