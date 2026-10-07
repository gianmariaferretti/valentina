import {
  ArrowLeft,
  CalendarDays,
  Check,
  CircleDot,
  ScanLine,
  ShieldCheck,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Sticker } from "@/components/design-system";
import { coupons, getCoupon } from "@/data/coupons";
import { RedemptionControl } from "@/features/coupons/components/redemption-control";
import { resolveCoupon } from "@/features/coupons/lib/coupon-domain";
import { loadCouponState } from "@/features/coupons/repositories/get-coupon-state-repository";
import type { CouponRarity } from "@/features/coupons/types";
import { cn } from "@/lib/cn";

interface CouponPageProps {
  params: Promise<{ id: string }>;
}

const rarityClassNames: Record<CouponRarity, string> = {
  standard: "bg-[var(--paper-white)] text-[var(--ink)]",
  premium: "bg-[var(--oxblood)] text-[var(--paper-white)]",
  legendary: "bg-[#e7c862] text-[var(--ink)]",
  impossible: "bg-[var(--ink)] text-[var(--paper-white)]",
};

export function generateStaticParams() {
  return coupons.map((coupon) => ({ id: coupon.id }));
}

export async function generateMetadata({
  params,
}: CouponPageProps): Promise<Metadata> {
  const coupon = getCoupon((await params).id);
  if (!coupon) return { title: "Coupon not found" };

  const walletState = await loadCouponState();
  const resolvedCoupon = resolveCoupon(coupon, walletState);

  return {
    title:
      resolvedCoupon.status === "undiscovered"
        ? "Undiscovered coupon"
        : `${resolvedCoupon.code} · ${resolvedCoupon.title}`,
  };
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export default async function CouponPage({ params }: CouponPageProps) {
  const coupon = getCoupon((await params).id);
  if (!coupon) notFound();

  const walletState = await loadCouponState();
  const resolvedCoupon = resolveCoupon(coupon, walletState);
  if (resolvedCoupon.status === "undiscovered") notFound();
  const isDark =
    resolvedCoupon.rarity === "premium" ||
    resolvedCoupon.rarity === "impossible";

  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <Link
        className="inline-flex min-h-11 items-center gap-2 rounded-full text-xs font-bold tracking-[0.12em] text-[var(--muted)] uppercase transition hover:text-[var(--ink)]"
        href="/coupons"
      >
        <ArrowLeft aria-hidden="true" size={15} />
        Valentina&apos;s wallet
      </Link>

      <article
        className={cn(
          "relative mt-5 overflow-hidden rounded-[2rem] border border-[var(--line-strong)] shadow-[var(--shadow-paper)] lg:grid lg:min-h-[43rem] lg:grid-cols-[minmax(0,1fr)_22rem]",
          rarityClassNames[resolvedCoupon.rarity],
        )}
      >
        <span
          aria-hidden="true"
          className="absolute top-8 -left-4 z-10 size-8 rounded-full bg-[var(--paper)] lg:top-auto lg:bottom-24"
        />
        <span
          aria-hidden="true"
          className="absolute top-8 -right-4 z-10 size-8 rounded-full bg-[var(--paper)] lg:top-auto lg:right-[20.5rem] lg:bottom-24"
        />

        <section className="relative flex min-h-[39rem] flex-col px-6 py-8 sm:px-10 sm:py-11 lg:px-14 lg:py-14">
          <div
            aria-hidden="true"
            className={cn(
              "absolute -top-48 -right-36 size-[30rem] rounded-full blur-3xl",
              isDark ? "bg-[var(--red-muted)]/30" : "bg-white/45",
            )}
          />
          <div className="relative flex items-start justify-between gap-5">
            <div>
              <p className="font-mono text-sm tracking-[0.17em] opacity-72">
                {resolvedCoupon.code}
              </p>
              <p className="mt-2 text-[0.58rem] font-bold tracking-[0.18em] uppercase opacity-48">
                V + G · Admit one
              </p>
            </div>
            <Sticker
              rotation={-3}
              size="sm"
              text={resolvedCoupon.rarity}
              variant={
                resolvedCoupon.rarity === "legendary" ||
                resolvedCoupon.rarity === "impossible"
                  ? "legendary"
                  : "text"
              }
            />
          </div>

          <div className="relative my-auto py-14">
            <p className="text-[0.6rem] font-bold tracking-[0.19em] uppercase opacity-52">
              {resolvedCoupon.category} · {resolvedCoupon.status}
            </p>
            <h1 className="mt-5 max-w-5xl font-display text-[clamp(4rem,10vw,8.5rem)] leading-[0.79] tracking-[-0.065em]">
              {resolvedCoupon.title}
            </h1>
            <p className="mt-8 max-w-2xl text-base leading-7 opacity-65 sm:text-lg sm:leading-8">
              {resolvedCoupon.description}
            </p>
          </div>

          <div className="relative grid gap-4 border-t border-dashed border-current pt-5 text-[0.56rem] font-bold tracking-[0.14em] uppercase opacity-58 sm:grid-cols-3">
            <span>Issued {formatDate(resolvedCoupon.createdAt)}</span>
            <span>Non-transferable</span>
            <span className="sm:text-right">Valid for Valentina</span>
          </div>
        </section>

        <aside className="relative flex flex-col border-t border-dashed border-current bg-[var(--paper-deep)] p-6 text-[var(--ink)] lg:border-t-0 lg:border-l lg:p-8">
          <div className="flex items-center justify-between gap-4">
            <ScanLine aria-hidden="true" size={25} strokeWidth={1.5} />
            <span className="rounded-full border border-[var(--line-strong)] px-3 py-1.5 text-[0.56rem] font-bold tracking-[0.14em] uppercase">
              {resolvedCoupon.status}
            </span>
          </div>

          <div className="my-10 lg:my-auto">
            <p className="text-[0.6rem] font-bold tracking-[0.17em] text-[var(--muted)] uppercase">
              Terms, allegedly
            </p>
            <ul className="mt-5 space-y-4">
              {resolvedCoupon.terms.map((term) => (
                <li className="flex gap-3 text-sm leading-6" key={term}>
                  <CircleDot
                    aria-hidden="true"
                    className="mt-1 shrink-0 text-[var(--rust)]"
                    size={14}
                  />
                  <span>{term}</span>
                </li>
              ))}
            </ul>

            {resolvedCoupon.redeemedAt ? (
              <div className="mt-7 flex items-center gap-3 border-t border-[var(--line)] pt-5 text-sm">
                <CalendarDays
                  aria-hidden="true"
                  className="text-[var(--rust)]"
                  size={17}
                />
                <span>Redeemed {formatDate(resolvedCoupon.redeemedAt)}</span>
              </div>
            ) : null}
          </div>

          <RedemptionControl
            challengeId={resolvedCoupon.challengeId}
            couponId={resolvedCoupon.id}
            redeemable={resolvedCoupon.redeemable}
            redeemedAt={resolvedCoupon.redeemedAt}
            status={resolvedCoupon.status}
            title={resolvedCoupon.title}
            type={resolvedCoupon.type}
            unlockCondition={resolvedCoupon.unlockCondition}
          />

          <div className="mt-8 border-t border-[var(--line)] pt-6">
            <div className="h-14 bg-[repeating-linear-gradient(90deg,var(--ink)_0_2px,transparent_2px_5px,var(--ink)_5px_6px,transparent_6px_10px)] opacity-72" />
            <div className="mt-3 flex items-center justify-between text-[0.5rem] font-bold tracking-[0.14em] text-[var(--muted)] uppercase">
              <span>{resolvedCoupon.code}</span>
              <span className="flex items-center gap-1.5">
                {resolvedCoupon.status === "redeemed" ? (
                  <Check aria-hidden="true" size={12} />
                ) : (
                  <ShieldCheck aria-hidden="true" size={12} />
                )}
                Year One
              </span>
            </div>
          </div>
        </aside>
      </article>
    </div>
  );
}
