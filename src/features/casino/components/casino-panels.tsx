"use client";

import { useEffect, useState } from "react";

import { casinoConfig } from "@/data/casino-config";
import { cn } from "@/lib/cn";

import type { CasinoView } from "../lib/engine";
import styles from "./casino.module.css";

export function useNow(intervalMs: number): number | null {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    const tick = () => setNow(Date.now());
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [intervalMs]);
  return now;
}

/** Counts up (or down) to the new value; instant with reduced motion. */
export function AnimatedNumber({ value }: { value: number }) {
  const [shown, setShown] = useState(value);
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const timer = window.setTimeout(() => setShown(value), 0);
      return () => window.clearTimeout(timer);
    }
    let frame = 0;
    const from = shown;
    const started = performance.now();
    const duration = value > from ? 700 : 250;
    const step = (time: number) => {
      const progress = Math.min(1, (time - started) / duration);
      setShown(Math.round(from + (value - from) * (1 - (1 - progress) ** 3)));
      if (progress < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
    // Only re-run when the target changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return <>{shown}</>;
}

function Meter({ value, label }: { value: number; label: string }) {
  return (
    <div
      aria-label={label}
      aria-valuemax={100}
      aria-valuemin={0}
      aria-valuenow={Math.round(value * 100)}
      className={styles.meter}
      role="meter"
    >
      <div
        className={styles.meterFill}
        style={{ width: `${Math.round(value * 100)}%` }}
      />
    </div>
  );
}

export function LuckPanel({ view }: { view: CasinoView }) {
  const percent = Math.round(view.luckMeter * 100);
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Luck meter</h3>
      <p className="mt-2 font-display text-2xl">{percent}% full</p>
      <div className="mt-2">
        <Meter label="Luck meter" value={view.luckMeter} />
      </div>
      <p className={cn(styles.muted, "mt-2 text-xs")}>
        It is definitely about to pay out. Probably. Any second.
      </p>
    </section>
  );
}

export function BeatPanel({ view }: { view: CasinoView }) {
  const beat = view.visit?.beat;
  if (!beat) return null;
  const left = Math.max(0, beat.maxSpins - beat.spins);
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Beat Gianmaria</h3>
      <p className="mt-2 text-sm">
        Win {beat.target} times in {beat.maxSpins} slot spins before he does.
      </p>
      {(
        [
          ["You", beat.herWins],
          ["Gianmaria", beat.hisWins],
        ] as const
      ).map(([who, wins]) => (
        <div className="mt-3" key={who}>
          <div className="flex justify-between text-xs font-bold">
            <span>{who}</span>
            <span>
              {wins}/{beat.target}
            </span>
          </div>
          <div aria-hidden="true" className={cn(styles.ticketMeter, "mt-1")}>
            {Array.from({ length: beat.target }, (_, index) => (
              <span data-on={index < wins} key={index} />
            ))}
          </div>
        </div>
      ))}
      <p className={cn(styles.muted, "mt-3 text-xs")} role="status">
        {beat.status === "won"
          ? "You beat him. A coupon has been issued. He wants a rematch."
          : beat.status === "lost"
            ? "Gianmaria won… a hug. Disappointing. New challenge next visit."
            : beat.hisWins >= beat.target - 1
              ? `He is one win away. ${left} spins left. Hurry.`
              : `${left} spins left.`}
      </p>
    </section>
  );
}

export function MissionsPanel({
  view,
  onClaim,
  disabled,
}: {
  view: CasinoView;
  onClaim: (id: string) => void;
  disabled: boolean;
}) {
  const missions = view.visit?.missions ?? [];
  if (missions.length === 0) return null;
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>This visit&apos;s missions</h3>
      <ul className="mt-3 grid gap-3">
        {missions.map((mission) => (
          <li key={mission.id}>
            <div className="flex items-center justify-between gap-2 text-sm">
              <span>{mission.label}</span>
              <span className="text-xs font-bold text-[var(--neon-gold,#ffd166)]">
                +{mission.reward} 💋
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-2">
              <div className="flex-1">
                <Meter
                  label={`${mission.label} progress`}
                  value={mission.progress}
                />
              </div>
              {mission.claimed ? (
                <span className="text-xs">✓</span>
              ) : mission.complete ? (
                <button
                  className={styles.smallButton}
                  disabled={disabled}
                  onClick={() => onClaim(mission.id)}
                  type="button"
                >
                  Collect
                </button>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function VipPanel({ view }: { view: CasinoView }) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>VIP level</h3>
      <p className="mt-2 font-display text-2xl">{view.vip.label}</p>
      {view.vip.nextLabel ? (
        <>
          <div className="mt-2">
            <Meter
              label={`Progress to ${view.vip.nextLabel}`}
              value={view.vip.progress}
            />
          </div>
          <p className={cn(styles.muted, "mt-2 text-xs")}>
            Next: {view.vip.nextLabel} — new slot theme and a bonus. Levels are
            never lost.
          </p>
        </>
      ) : (
        <p className={cn(styles.muted, "mt-2 text-xs")}>
          The highest level. The house bows. Slightly.
        </p>
      )}
    </section>
  );
}

export function SetsPanel({ view }: { view: CasinoView }) {
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Collection sets</h3>
      <ul className="mt-3 grid gap-3">
        {view.sets.map((set) => (
          <li key={set.id}>
            <div className="flex justify-between text-sm">
              <span>{set.label}</span>
              <span className="text-xs font-bold">
                {set.complete ? "Complete ✓" : `${set.owned}/${set.total}`}
              </span>
            </div>
            <div className="mt-1.5">
              <Meter
                label={`${set.label} progress`}
                value={set.complete ? 1 : set.progress}
              />
            </div>
          </li>
        ))}
      </ul>
      <p className={cn(styles.muted, "mt-3 text-xs")}>
        Complete a set for a bonus coupon. The last piece is always the shy one.
      </p>
    </section>
  );
}

export function PiggyPanel({
  view,
  onBreak,
  disabled,
}: {
  view: CasinoView;
  onBreak: () => void;
  disabled: boolean;
}) {
  const [confirming, setConfirming] = useState(false);
  const cost = casinoConfig.piggy.breakCostRealKisses;
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Piggy bank</h3>
      <p className="mt-2 font-display text-2xl">
        <span aria-hidden="true">🐷 </span>
        {view.piggy} 💋 inside
      </p>
      <p className={cn(styles.muted, "mt-1 text-xs")}>
        It fills itself with every play. It would be a shame to leave it there.
      </p>
      {confirming ? (
        <div className="mt-3 grid gap-2">
          <p className="text-sm">Break it for {cost} real kisses?</p>
          <button
            className={styles.smallButton}
            disabled={disabled}
            onClick={() => {
              setConfirming(false);
              onBreak();
            }}
            type="button"
          >
            Yes, smash it
          </button>
          <button
            className={styles.declineLink}
            onClick={() => setConfirming(false)}
            type="button"
          >
            Leave the pig alone
          </button>
        </div>
      ) : (
        <button
          className={cn(styles.smallButton, "mt-3")}
          disabled={disabled || view.piggy <= 0}
          onClick={() => setConfirming(true)}
          type="button"
        >
          Break it · {cost} real kisses
        </button>
      )}
    </section>
  );
}

function formatCountdown(ms: number): string {
  const seconds = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function ShopPanel({
  view,
  onBuy,
  disabled,
}: {
  view: CasinoView;
  onBuy: (id: string) => void;
  disabled: boolean;
}) {
  const now = useNow(1000);
  const deal = view.visit?.flashDeal ?? null;
  const dealLeft =
    deal && now !== null ? new Date(deal.expiresAt).getTime() - now : null;
  return (
    <section className={styles.panel} id="kiss-shop">
      <h3 className={styles.panelTitle}>Kiss Shop</h3>
      <p className={cn(styles.muted, "mt-1 text-xs")}>
        Packs arrive instantly. The real kisses are added to your Kiss Debt.
      </p>
      {view.firstPurchaseDouble ? (
        <p className={cn(styles.banner, "mt-3 text-sm")} data-tone="gold">
          First purchase DOUBLED — once only.
        </p>
      ) : null}
      {deal && dealLeft !== null && dealLeft > 0 ? (
        <button
          className={cn(styles.pack, "mt-4 w-full")}
          disabled={disabled}
          onClick={() => onBuy(deal.id)}
          type="button"
        >
          <span className={styles.packBadge}>
            Flash deal — {formatCountdown(dealLeft)}
          </span>
          <span className="font-display text-xl">{deal.label}</span>
          <span className="text-sm">
            {deal.chips} 💋 · costs {deal.realKisses} real kisses
          </span>
        </button>
      ) : null}
      <div className="mt-4 grid grid-cols-2 gap-3">
        {casinoConfig.shop.packs.map((pack) => (
          <button
            className={styles.pack}
            disabled={disabled}
            key={pack.id}
            onClick={() => onBuy(pack.id)}
            type="button"
          >
            {pack.badge ? (
              <span className={styles.packBadge}>{pack.badge}</span>
            ) : null}
            <span className="font-display text-lg leading-tight">
              {pack.label}
            </span>
            <span className="text-sm font-bold">
              {pack.chips * (view.firstPurchaseDouble ? 2 : 1)} 💋
            </span>
            <span className="text-xs text-[var(--muted)]">
              costs {pack.realKisses} real kisses
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

export function FeedPanel({ view }: { view: CasinoView }) {
  const now = useNow(3500);
  const lines = [
    ...view.recentWins.map((win) => win.text),
    ...casinoConfig.feed,
  ];
  const start = now === null ? 0 : Math.floor(now / 3500) % lines.length;
  const shown = Array.from(
    { length: 4 },
    (_, index) => lines[(start + index) % lines.length],
  );
  return (
    <section className={styles.panel}>
      <h3 className={styles.panelTitle}>Live wins</h3>
      <ul className={cn(styles.feed, "mt-3")}>
        {shown.map((line, index) => (
          <li key={`${start}-${index}`}>
            <span aria-hidden="true">
              {line.startsWith("Valentina") ? "💋" : "🎰"}
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
