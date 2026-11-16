import { CreditCard, LockKeyhole, Search, TicketCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Sticker } from "@/components/design-system";
import { FadeIn } from "@/components/motion/fade-in";
import { coupons } from "@/data/coupons";
import { REUNION_COUPON_ID } from "@/data/coupons-apart";
import { nextReunionDate } from "@/data/reunion";
import { loadCasinoCoupons } from "@/features/casino/repositories/load-casino";
import { CouponWallet } from "@/features/coupons/components/coupon-wallet";
import styles from "@/features/coupons/components/wallet.module.css";
import {
  createWalletItem,
  getCouponWalletStats,
  isVisibleInWallet,
  resolveCoupons,
} from "@/features/coupons/lib/coupon-domain";
import { loadCouponState } from "@/features/coupons/repositories/get-coupon-state-repository";
import { cn } from "@/lib/cn";

export const metadata: Metadata = {
  title: "Valentina’s Wallet",
};

const statIcons = {
  available: CreditCard,
  redeemed: TicketCheck,
  locked: LockKeyhole,
  undiscovered: Search,
} as const;

/** The strip never draws more than this many tickets; larger totals scale. */
const STRIP_TICKETS = 60;

export default async function CouponsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const [walletState, casinoCoupons, params] = await Promise.all([
    loadCouponState(),
    loadCasinoCoupons(),
    searchParams,
  ]);
  const resolvedCoupons = resolveCoupons(
    [...coupons, ...casinoCoupons],
    walletState,
  ).filter(isVisibleInWallet);
  const stats = getCouponWalletStats(resolvedCoupons);
  const walletItems = resolvedCoupons.map(createWalletItem);
  const modeParam = params.mode;
  const modeFromUrl = modeParam === "apart" || modeParam === "together";
  const stripCount = Math.min(STRIP_TICKETS, stats.total);
  const stripFilled = Math.round(
    (stats.redeemed / Math.max(1, stats.total)) * stripCount,
  );

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
              <p className="text-[0.6rem] font-bold tracking-[0.2em] text-white/70 uppercase">
                V + G · Private wallet
              </p>
              <Sticker
                className="hidden sm:inline-flex"
                rotation={3}
                size="sm"
                variant="girlfriend-approved"
              />
            </div>

            <div className="mt-12 grid gap-9 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
              <div>
                <h1 className="max-w-5xl font-display text-[clamp(2.7rem,11vw,8.5rem)] leading-[0.78] tracking-[-0.065em] uppercase">
                  Valentina&apos;s
                  <br />
                  <span className="italic text-[var(--sand)]">Wallet</span>
                </h1>
                <p className="mt-7 max-w-xl text-sm leading-6 text-white/75 sm:text-base sm:leading-7">
                  Collectible promises with varying levels of practicality,
                  legal ambiguity and Gianmaria exposure. Now available in
                  person and over Wi-Fi.
                </p>
              </div>

              <div className="lg:text-right">
                <p className="font-display text-6xl tracking-[-0.06em] sm:text-7xl">
                  {stats.redeemed}
                  <span className="text-2xl text-white/60">
                    {" "}
                    / {stats.total}
                  </span>
                </p>
                <p className="mt-2 text-[0.6rem] font-bold tracking-[0.17em] text-white/70 uppercase">
                  Collected
                </p>
                <div
                  aria-label={`${stats.redeemed} of ${stats.total} coupons collected`}
                  className={cn(styles.strip, "mt-4")}
                  role="img"
                >
                  {Array.from({ length: stripCount }, (_, index) => (
                    <span
                      className={styles.stripTicket}
                      data-filled={index < stripFilled}
                      key={index}
                    />
                  ))}
                </div>
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
                      <dt className="text-[0.54rem] font-bold tracking-[0.13em] text-white/70 uppercase">
                        {status === "locked" ? "sealed" : status}
                      </dt>
                    </div>
                  </div>
                );
              })}
            </dl>
          </div>
        </header>
      </FadeIn>

      <FadeIn delay={0.05}>
        <Link
          aria-label="Enter the Kiss Casino"
          className={cn(
            styles.neon,
            "mt-6 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]",
          )}
          href="/coupons/casino"
        >
          <span aria-hidden="true" className={styles.bulbs} />
          <span className={styles.neonSub}>Open late · No real money</span>
          <span className={styles.neonTitle}>Kiss Casino</span>
          <span className="text-xs text-[#ffd9e8]">
            Win coupons. Lose kisses. The house is Gianmaria.
          </span>
        </Link>
      </FadeIn>

      <FadeIn delay={0.08}>
        <CouponWallet
          coupons={walletItems}
          initialMode={modeParam === "apart" ? "apart" : "together"}
          modeFromUrl={modeFromUrl}
          reunionCouponId={REUNION_COUPON_ID}
          reunionDate={nextReunionDate}
        />
      </FadeIn>
    </div>
  );
}
