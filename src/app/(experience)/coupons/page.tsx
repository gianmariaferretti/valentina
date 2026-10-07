import { CreditCard, LockKeyhole, Search, TicketCheck } from "lucide-react";
import type { Metadata } from "next";

import { Sticker } from "@/components/design-system";
import { FadeIn } from "@/components/motion/fade-in";
import { coupons } from "@/data/coupons";
import { CouponWallet } from "@/features/coupons/components/coupon-wallet";
import {
  createWalletItem,
  getCouponWalletStats,
  resolveCoupons,
} from "@/features/coupons/lib/coupon-domain";
import { getCouponStateRepository } from "@/features/coupons/repositories/get-coupon-state-repository";

export const metadata: Metadata = {
  title: "Valentina’s Wallet",
};

const statIcons = {
  available: CreditCard,
  redeemed: TicketCheck,
  locked: LockKeyhole,
  undiscovered: Search,
} as const;

export default async function CouponsPage() {
  const walletState = await getCouponStateRepository().get();
  const resolvedCoupons = resolveCoupons(coupons, walletState);
  const stats = getCouponWalletStats(resolvedCoupons);
  const walletItems = resolvedCoupons.map(createWalletItem);

  return (
    <div className="page-container py-6 sm:py-10 lg:py-14">
      <FadeIn>
        <header className="relative overflow-hidden rounded-[2rem] bg-[var(--ink)] px-6 py-8 text-[var(--paper-white)] sm:px-10 sm:py-11 lg:px-14 lg:py-14">
          <div
            aria-hidden="true"
            className="absolute -top-52 -right-36 size-[34rem] rounded-full bg-[var(--oxblood)] opacity-80 blur-3xl"
          />
          <div className="relative">
            <div className="flex items-start justify-between gap-5">
              <p className="text-[0.6rem] font-bold tracking-[0.2em] text-white/48 uppercase">
                V + G · Private wallet
              </p>
              <Sticker
                className="hidden sm:inline-flex"
                rotation={3}
                size="sm"
                variant="girlfriend-approved"
              />
            </div>

            <div className="mt-12 grid gap-9 lg:grid-cols-[minmax(0,1fr)_18rem] lg:items-end">
              <div>
                <h1 className="max-w-5xl font-display text-[clamp(2.7rem,11vw,8.5rem)] leading-[0.78] tracking-[-0.065em] uppercase">
                  Valentina&apos;s
                  <br />
                  <span className="italic text-[var(--sand)]">Wallet</span>
                </h1>
                <p className="mt-7 max-w-xl text-sm leading-6 text-white/58 sm:text-base sm:leading-7">
                  Collectible promises with varying levels of practicality,
                  legal ambiguity and Gianmaria exposure.
                </p>
              </div>

              <div className="lg:text-right">
                <p className="font-display text-6xl tracking-[-0.06em] sm:text-7xl">
                  {stats.discovered}
                  <span className="text-2xl text-white/35">
                    {" "}
                    / {stats.total}
                  </span>
                </p>
                <p className="mt-2 text-[0.6rem] font-bold tracking-[0.17em] text-white/45 uppercase">
                  Discovered
                </p>
              </div>
            </div>

            <dl className="mt-11 grid grid-cols-2 border-t border-l border-white/14 sm:grid-cols-4">
              {(
                ["available", "redeemed", "locked", "undiscovered"] as const
              ).map((status) => {
                const Icon = statIcons[status];
                return (
                  <div
                    className="flex min-h-24 items-center gap-3 border-r border-b border-white/14 px-4 py-4 sm:px-5"
                    key={status}
                  >
                    <Icon
                      aria-hidden="true"
                      className="shrink-0 text-[var(--sand)]"
                      size={18}
                      strokeWidth={1.5}
                    />
                    <div>
                      <dd className="font-display text-2xl">{stats[status]}</dd>
                      <dt className="text-[0.54rem] font-bold tracking-[0.13em] text-white/45 uppercase">
                        {status}
                      </dt>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.08}>
        <CouponWallet coupons={walletItems} />
      </FadeIn>
    </div>
  );
}
