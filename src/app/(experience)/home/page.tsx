import { ArrowUpRight, Dices, Plane } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";

import { FadeIn } from "@/components/motion/fade-in";
import { Icon } from "@/components/ui/icon";
import { RollingGroup, RollingNumber } from "@/components/ui/rolling-number";
import { loadCouponCatalogue } from "@/features/admin/repositories/content";
import { CasinoNavBadge } from "@/features/casino/components/casino-nav-badge";
import {
  loadCasinoCoupons,
  loadCasinoSnapshot,
} from "@/features/casino/repositories/load-casino";
import { loadChallengeState } from "@/features/challenges/repositories/get-challenge-state-repository";
import styles from "@/features/coupons/components/wallet.module.css";
import { formatStampDate } from "@/features/coupons/components/stamp-date";
import {
  createWalletItem,
  dayKey,
  getCouponWalletStats,
  isVisibleInWallet,
  pickCouponOfTheDay,
  resolveCoupons,
} from "@/features/coupons/lib/coupon-domain";
import { loadCouponState } from "@/features/coupons/repositories/get-coupon-state-repository";
import { togetherAt } from "@/features/cover/lib/together";
import { DailyCoupon } from "@/features/home/components/daily-coupon";
import {
  closestToUnlock,
  daysUntil,
  recentlyUnlocked,
} from "@/features/home/lib/home-wallet";
import {
  CityStrip,
  CityStripFallback,
} from "@/features/life/components/city-strip";
import { loadNextTime } from "@/features/life/repositories/life";
import { MissYouButton } from "@/features/notifications/components/miss-you-button";
import { requireAccessSession } from "@/lib/auth/session";
import { cn } from "@/lib/cn";
import type { IconName } from "@/types/navigation";

export const metadata: Metadata = {
  title: "Home",
};

const STRIP_TICKETS = 60;

/** Today's calendar date in Rome, as the day index the wallet uses. */
function romeDayKey(now: Date): number {
  const [y, m, d] = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Rome",
  })
    .format(now)
    .split("-")
    .map(Number);
  return dayKey(new Date(y, m - 1, d));
}

const shortcuts: {
  href: string;
  title: string;
  note: string;
  icon: IconName;
}[] = [
  {
    href: "/memories",
    title: "Memories",
    note: "Map, letters, songs",
    icon: "map",
  },
  {
    href: "/challenges",
    title: "Games",
    note: "Five private files",
    icon: "challenges",
  },
  {
    href: "/open-when",
    title: "Open when",
    note: "Letters for later",
    icon: "open-when",
  },
  {
    href: "/gallery",
    title: "Gallery",
    note: "Selected evidence",
    icon: "gallery",
  },
  { href: "/quiz", title: "Quiz", note: "No pressure", icon: "quiz" },
  {
    href: "/la-dolce-lingua",
    title: "Italian",
    note: "La Dolce Lingua",
    icon: "italian-corner",
  },
  {
    href: "/relationship-contract",
    title: "Contract",
    note: "Forty articles",
    icon: "contract",
  },
  { href: "/awards", title: "Awards", note: "Avoidable chaos", icon: "awards" },
];

export default async function HomePage() {
  await requireAccessSession();
  const [walletState, casinoCoupons, catalogue, nextTime, games, casino] =
    await Promise.all([
      loadCouponState(),
      loadCasinoCoupons(),
      loadCouponCatalogue(),
      loadNextTime(),
      loadChallengeState(),
      loadCasinoSnapshot(),
    ]);

  const resolved = resolveCoupons(
    [...catalogue, ...casinoCoupons],
    walletState,
  ).filter(isVisibleInWallet);
  const items = resolved.map(createWalletItem);
  const stats = getCouponWalletStats(resolved);
  const candidates = items.filter(
    (item) => item.status === "available" && item.href && !item.scratchable,
  );
  const initialPick = pickCouponOfTheDay(candidates, romeDayKey(new Date()));
  const recent = recentlyUnlocked(items, resolved, walletState);
  const closest = closestToUnlock(items, resolved, games.games);
  const today = new Date();
  const days = daysUntil(nextTime.at, today);
  const together = togetherAt(today.getTime()).days;
  const stripCount = Math.min(STRIP_TICKETS, stats.total);
  const stripFilled = Math.round(
    (stats.redeemed / Math.max(1, stats.total)) * stripCount,
  );

  return (
    <div className="page-container py-5 sm:py-10">
      <FadeIn>
        <p className="text-[0.6rem] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
          V + G · Valentina&apos;s wallet
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.4rem,9vw,5.5rem)] leading-[0.85] tracking-[-0.05em]">
          Good to see you<span className="text-[var(--rust)]">.</span>
        </h1>
        <p className="mt-3 text-sm text-[var(--muted)]">
          <RollingNumber
            className="font-display text-xl text-[var(--ink)] tabular-nums"
            rollIn
            value={together}
          />{" "}
          days together, and counting.
        </p>
      </FadeIn>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <FadeIn>
          <DailyCoupon candidates={candidates} initialPick={initialPick} />
        </FadeIn>

        <div className="grid gap-4">
          <FadeIn delay={0.04}>
            <Link
              aria-label={`Collected: ${stats.redeemed} of ${stats.total} coupons. Open the wallet`}
              className="block rounded-[1.4rem] bg-[var(--ink)] p-5 text-[var(--paper-white)] transition hover:bg-[#2a1f1c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
              href="/coupons"
            >
              <span className="flex items-baseline justify-between gap-3">
                <span className="font-display text-5xl tracking-[-0.05em]">
                  <RollingGroup>
                    <RollingNumber rollIn value={stats.redeemed} />
                    <span className="ml-1 text-xl text-white/60">
                      {" "}
                      / <RollingNumber value={stats.total} />
                    </span>
                  </RollingGroup>
                </span>
                <span className="text-[0.6rem] font-bold tracking-[0.17em] text-white/70 uppercase">
                  Collected
                </span>
              </span>
              <span aria-hidden="true" className={cn(styles.strip, "mt-3")}>
                {Array.from({ length: stripCount }, (_, index) => (
                  <span
                    className={styles.stripTicket}
                    data-filled={index < stripFilled}
                    key={index}
                  />
                ))}
              </span>
              <span className="mt-3 flex items-center gap-1 text-xs text-white/75">
                {stats.available} ready to use · open the wallet
                <ArrowUpRight aria-hidden="true" size={14} />
              </span>
            </Link>
          </FadeIn>

          <FadeIn delay={0.06}>
            <Link
              aria-label="Enter the Kiss Casino"
              className={cn(
                styles.neon,
                "focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]",
              )}
              href="/coupons/casino"
            >
              <span aria-hidden="true" className={styles.bulbs} />
              <span className={styles.neonSub}>
                {casino.failed ? (
                  "Open late"
                ) : (
                  <>
                    <RollingNumber rollIn value={casino.state.balance} /> 💋 in
                    your pocket
                  </>
                )}
                <Suspense fallback={null}>
                  <CasinoNavBadge />
                </Suspense>
              </span>
              <span className={styles.neonTitle}>Kiss Casino</span>
              <span className="text-xs text-[#ffd9e8]">
                Win coupons. Lose kisses. The house is Gianmaria.
              </span>
            </Link>
          </FadeIn>

          <FadeIn delay={0.08}>
            <Link
              className="flex items-center gap-4 rounded-[1.4rem] border border-[var(--line-strong)] bg-[var(--paper-white)] p-5 transition hover:border-[var(--ink)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
              href="/next-time"
            >
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[var(--ink)] text-[var(--paper-white)]">
                <Plane aria-hidden="true" size={20} />
              </span>
              <span className="min-w-0">
                <span className="block text-[0.6rem] font-bold tracking-[0.16em] text-[var(--muted)] uppercase">
                  Next time · {nextTime.from} → {nextTime.to}
                </span>
                <span className="block font-display text-2xl leading-tight tracking-[-0.03em]">
                  {days === null ? (
                    "Date to be announced"
                  ) : days === 0 ? (
                    "Today. Finally."
                  ) : (
                    <>
                      <RollingNumber rollIn value={days} />{" "}
                      {days === 1 ? "day" : "days"} to go
                    </>
                  )}
                </span>
              </span>
              <ArrowUpRight
                aria-hidden="true"
                className="ml-auto shrink-0"
                size={18}
              />
            </Link>
          </FadeIn>
        </div>
      </div>

      <div className="mt-6">
        <Suspense fallback={<CityStripFallback globe />}>
          <CityStrip globe />
        </Suspense>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--muted)]">
        <MissYouButton variant="inline" />
        <span>Tap it. He gets an email. Really.</span>
      </div>

      <section aria-labelledby="recent-title" className="mt-10">
        <h2
          className="font-display text-3xl tracking-[-0.03em]"
          id="recent-title"
        >
          Fresh in the wallet
        </h2>
        {recent.length === 0 ? (
          <p className="mt-2 text-sm text-[var(--muted)]">
            Nothing new yet. Win a game or visit the casino and it lands here.
          </p>
        ) : (
          <ul className="-mx-5 mt-3 flex snap-x gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:px-0">
            {recent.map(({ coupon, at }) => (
              <li className="w-56 shrink-0 snap-start" key={coupon.id}>
                <Link
                  className={cn(
                    styles.albumStub,
                    "h-full focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]",
                  )}
                  href={`/coupons/${coupon.id}`}
                >
                  <span className={styles.code}>
                    {coupon.source === "casino" ? (
                      <Dices
                        aria-label="Won at the Kiss Casino"
                        className="mr-1 inline"
                        size={12}
                      />
                    ) : null}
                    {coupon.code}
                  </span>
                  <span className="font-display text-xl leading-tight">
                    {coupon.title}
                  </span>
                  <span className="mt-auto text-[0.6rem] font-bold tracking-[0.12em] text-[var(--muted)] uppercase">
                    {coupon.source === "casino" ? "Won" : "Unlocked"} ·{" "}
                    {formatStampDate(at)}
                    {coupon.status === "redeemed" ? " · used" : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {closest.length ? (
        <section aria-labelledby="closest-title" className="mt-10">
          <h2
            className="font-display text-3xl tracking-[-0.03em]"
            id="closest-title"
          >
            Almost yours
          </h2>
          <ul className="mt-3 grid gap-3 md:grid-cols-3">
            {closest.map(({ coupon, percent }) => (
              <li key={coupon.id}>
                <Link
                  className="block h-full rounded-[1.4rem] border border-[var(--line)] bg-[var(--paper-white)] p-4 transition hover:border-[var(--line-strong)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
                  href={coupon.href ?? "/coupons"}
                >
                  <span className="text-[0.58rem] font-bold tracking-[0.16em] text-[var(--rust)] uppercase">
                    Sealed · {coupon.rarity}
                  </span>
                  <span className="mt-1 block font-display text-xl leading-tight">
                    {coupon.title}
                  </span>
                  <span className="mt-1 block text-xs text-[var(--muted)]">
                    {coupon.unlockCondition}
                  </span>
                  <span
                    aria-label={`${percent}% of the way there`}
                    aria-valuemax={100}
                    aria-valuemin={0}
                    aria-valuenow={percent}
                    className="mt-3 block h-2.5 overflow-hidden rounded-full bg-[var(--paper-deep)]"
                    role="progressbar"
                  >
                    <span
                      className="block h-full rounded-full bg-[var(--rust)]"
                      style={{ width: `${Math.max(3, percent)}%` }}
                    />
                  </span>
                  <span className="mt-1 block text-right text-xs tabular-nums text-[var(--muted)]">
                    {percent}%
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <nav aria-labelledby="shortcuts-title" className="mt-10 pb-4">
        <h2
          className="font-display text-3xl tracking-[-0.03em]"
          id="shortcuts-title"
        >
          Everything else
        </h2>
        <ul className="-mx-5 mt-3 flex snap-x gap-2.5 overflow-x-auto px-5 pb-2 [scrollbar-width:none] sm:mx-0 sm:grid sm:grid-cols-4 sm:px-0">
          {shortcuts.map((item) => (
            <li className="w-36 shrink-0 snap-start sm:w-auto" key={item.href}>
              <Link
                className="flex h-full flex-col gap-3 rounded-2xl border border-[var(--line)] bg-[var(--paper-white)] p-3.5 transition hover:border-[var(--line-strong)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--rust)]"
                href={item.href}
              >
                <span className="grid size-9 place-items-center rounded-full border border-[var(--line)]">
                  <Icon name={item.icon} size={16} />
                </span>
                <span>
                  <span className="block text-sm font-semibold">
                    {item.title}
                  </span>
                  <span className="block text-xs text-[var(--muted)]">
                    {item.note}
                  </span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
