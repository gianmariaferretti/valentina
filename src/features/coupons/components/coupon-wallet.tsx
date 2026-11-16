"use client";

import { CalendarHeart, Shuffle } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import {
  dayKey,
  pickCouponOfTheDay,
  sortWalletItems,
} from "@/features/coupons/lib/coupon-domain";
import type {
  CouponFilter,
  CouponSetting,
  CouponWalletItem,
} from "@/features/coupons/types";
import { cn } from "@/lib/cn";

import { AlbumStub, CouponTicket } from "./coupon-ticket";
import { SettingToggle } from "./setting-toggle";
import styles from "./wallet.module.css";

const MODE_KEY = "vg.wallet.mode";
const SCRATCHED_KEY = "vg.wallet.scratched";

const filterLabels: Record<CouponFilter, string> = {
  all: "All",
  album: "Album",
  dates: "Dates",
  food: "Food",
  romantic: "Romantic",
  emergency: "Emergency",
  standard: "Standard",
  premium: "Premium",
  legendary: "Legendary",
  impossible: "Impossible",
};

const filterOrder: readonly CouponFilter[] = [
  "all",
  "dates",
  "food",
  "romantic",
  "emergency",
  "standard",
  "premium",
  "legendary",
  "impossible",
  "album",
];

function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Storage is only a convenience; private browsing may refuse it.
  }
}

function matchesFilter(item: CouponWalletItem, filter: CouponFilter): boolean {
  if (filter === "all") return true;
  if (filter === "album") return item.status === "redeemed";
  return item.category === filter || item.rarity === filter;
}

interface CouponWalletProps {
  coupons: readonly CouponWalletItem[];
  initialMode: CouponSetting;
  /** True when `?mode=` was present, which wins over the remembered mode. */
  modeFromUrl: boolean;
  reunionDate: string | null;
  reunionCouponId: string;
}

export function CouponWallet({
  coupons,
  initialMode,
  modeFromUrl,
  reunionDate,
  reunionCouponId,
}: CouponWalletProps) {
  const [mode, setMode] = useState<CouponSetting>(initialMode);
  const [filter, setFilter] = useState<CouponFilter>("all");
  const [scratched, setScratched] = useState<ReadonlySet<string> | null>(null);
  const [today, setToday] = useState<Date | null>(null);

  useEffect(() => {
    // Client-only values (local date, storage) are read after hydration.
    const timer = window.setTimeout(() => {
      setToday(new Date());
      try {
        const saved = JSON.parse(readStorage(SCRATCHED_KEY) ?? "[]");
        setScratched(
          new Set(
            Array.isArray(saved)
              ? saved.filter((v) => typeof v === "string")
              : [],
          ),
        );
      } catch {
        setScratched(new Set());
      }
      if (!modeFromUrl && readStorage(MODE_KEY) === "apart") {
        setMode("apart");
        window.history.replaceState(null, "", "?mode=apart");
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, [modeFromUrl]);

  const changeMode = useCallback((next: CouponSetting) => {
    setMode(next);
    setFilter("all");
    writeStorage(MODE_KEY, next);
    window.history.replaceState(
      null,
      "",
      next === "apart" ? "?mode=apart" : window.location.pathname,
    );
  }, []);

  const markScratched = useCallback((id: string) => {
    setScratched((current) => {
      const next = new Set(current ?? []);
      next.add(id);
      writeStorage(SCRATCHED_KEY, JSON.stringify([...next]));
      return next;
    });
  }, []);

  const counts = useMemo(
    () => ({
      together: coupons.filter((item) => item.setting === "together").length,
      apart: coupons.filter((item) => item.setting === "apart").length,
    }),
    [coupons],
  );

  const section = useMemo(
    () => sortWalletItems(coupons.filter((item) => item.setting === mode)),
    [coupons, mode],
  );

  const filters = useMemo(
    () =>
      filterOrder.filter(
        (value) =>
          value === "all" ||
          value === "album" ||
          section.some((item) => matchesFilter(item, value)),
      ),
    [section],
  );

  const visible = useMemo(
    () => section.filter((item) => matchesFilter(item, filter)),
    [section, filter],
  );

  const reunionDays = useMemo(() => {
    if (!reunionDate || !today) return null;
    const target = new Date(`${reunionDate}T00:00:00`);
    if (Number.isNaN(target.getTime())) return null;
    const days = dayKey(target) - dayKey(today);
    return days >= 0 ? days : null;
  }, [reunionDate, today]);

  const daily = useMemo(() => {
    if (!today) return null;
    return pickCouponOfTheDay(
      section.filter((item) => item.status === "available" && item.href),
      dayKey(today),
    );
  }, [section, today]);

  return (
    <section aria-labelledby="coupon-collection" className="mt-8 sm:mt-12">
      <h2 className="sr-only" id="coupon-collection">
        The collection
      </h2>
      <SettingToggle counts={counts} mode={mode} onChange={changeMode} />

      <div className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <CouponOfTheDay
          key={mode}
          candidates={section.filter((item) => item.status === "available")}
          pick={daily}
        />
        {mode === "apart" && reunionDays !== null ? (
          <div
            className="flex items-center gap-4 rounded-[1.4rem] border border-[var(--line-strong)] bg-[var(--paper-white)] p-5"
            role="status"
          >
            <CalendarHeart
              aria-hidden="true"
              className="shrink-0 text-[var(--rust)]"
              size={28}
              strokeWidth={1.5}
            />
            <p className="font-display text-2xl leading-tight tracking-[-0.03em]">
              {reunionDays === 0
                ? "Reunion day. Today."
                : `Next reunion in ${reunionDays} ${reunionDays === 1 ? "day" : "days"}`}
            </p>
          </div>
        ) : null}
      </div>

      <div className="-mx-5 mt-8 overflow-x-auto px-5 pb-2 sm:mx-0 sm:px-0">
        <div
          aria-label="Filter coupons"
          className="flex w-max gap-2"
          role="group"
        >
          {filters.map((value, index) => (
            <button
              aria-pressed={filter === value}
              className={cn(
                "min-h-11 rounded-full border px-4 text-[0.62rem] font-bold tracking-[0.12em] uppercase transition",
                value === "album" && "border-dashed",
                filter === value
                  ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--paper-white)]"
                  : "border-[var(--line-strong)] bg-white/40 hover:border-[var(--ink)] hover:bg-white/70",
              )}
              key={value}
              onClick={() => setFilter(value)}
              style={{ rotate: `${((index % 3) - 1) * 1.2}deg` }}
              type="button"
            >
              {filterLabels[value]}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status">
        Showing {visible.length} {mode} coupons
      </p>

      {visible.length === 0 ? (
        <div className="mt-6 rounded-[1.6rem] border border-dashed border-[var(--line-strong)] px-6 py-16 text-center">
          <p className="font-display text-3xl">
            {filter === "album"
              ? "No stubs yet."
              : "Nothing in this pocket yet."}
          </p>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {filter === "album"
              ? "Redeemed coupons leave their stub here, stamped and dated."
              : "This category is either empty or being suspiciously secretive."}
          </p>
        </div>
      ) : filter === "album" ? (
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {visible.map((coupon) => (
            <AlbumStub coupon={coupon} key={coupon.id} />
          ))}
        </div>
      ) : (
        <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {visible.map((coupon) => (
            <CouponTicket
              coupon={coupon}
              covered={
                coupon.scratchable &&
                (scratched === null || !scratched.has(coupon.id))
              }
              glow={
                coupon.id === reunionCouponId &&
                reunionDays !== null &&
                reunionDays < 7 &&
                coupon.status === "available"
              }
              key={coupon.id}
              onScratched={markScratched}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function CouponOfTheDay({
  candidates,
  pick,
}: {
  candidates: readonly CouponWalletItem[];
  pick: CouponWalletItem | null;
}) {
  // The reel shows a run of titles and lands on today's pick.
  const reel = useMemo(() => {
    if (!pick) return [];
    const others = candidates.filter((item) => item.id !== pick.id);
    const filler = Array.from(
      { length: 9 },
      (_, index) =>
        others[(index * 7) % Math.max(1, others.length)]?.title ?? pick.title,
    );
    return [...filler, pick.title];
  }, [candidates, pick]);
  const [landed, setLanded] = useState(false);

  useEffect(() => {
    if (!pick) return;
    const frame = requestAnimationFrame(() => setLanded(true));
    return () => cancelAnimationFrame(frame);
  }, [pick]);

  return (
    <div className="rounded-[1.4rem] bg-[var(--oxblood)] p-4 text-[var(--paper-white)] shadow-[var(--shadow-paper)] sm:p-5">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.18em] uppercase">
          <Shuffle aria-hidden="true" size={14} />
          Coupon of the day
        </p>
        <span className="text-[0.56rem] font-bold tracking-[0.14em] text-white/80 uppercase">
          Changes at midnight
        </span>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <div
          aria-hidden="true"
          className={cn(styles.reelWindow, "min-w-0 flex-1")}
        >
          <div
            className={styles.reelTrack}
            style={{
              transform: `translateY(-${landed ? (reel.length - 1) * 3.2 : 0}rem)`,
            }}
          >
            {(reel.length ? reel : ["Shuffling…"]).map((title, index) => (
              <span className={styles.reelItem} key={`${title}-${index}`}>
                {title}
              </span>
            ))}
          </div>
        </div>
        {pick?.href ? (
          <Link
            className="inline-flex min-h-12 shrink-0 items-center rounded-full bg-[var(--sticker-yellow)] px-4 text-[0.62rem] font-bold tracking-[0.12em] text-[var(--ink)] uppercase transition hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href={pick.href}
          >
            Use today?
          </Link>
        ) : null}
      </div>
      <p className="sr-only" role="status">
        {pick
          ? `Coupon of the day: ${pick.title}`
          : "No coupon available today."}
      </p>
      {!pick && candidates.length === 0 ? (
        <p className="mt-2 text-xs text-white/80">
          Everything here is used or sealed. Impressive.
        </p>
      ) : null}
    </div>
  );
}
