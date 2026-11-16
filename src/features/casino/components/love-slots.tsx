"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { casinoConfig } from "@/data/casino-config";
import { cn } from "@/lib/cn";

import type { CasinoActionResult } from "../actions";
import type { SlotEvent } from "../lib/engine";
import styles from "./casino.module.css";

const symbols = casinoConfig.slots.symbols;
const initialReels = [
  ["🌹", "💋", "🍝"],
  ["🎬", "💋", "✈️"],
  ["🍦", "💋", "💆"],
];

function filler(count: number, seed: number): string[] {
  return Array.from(
    { length: count },
    (_, index) => symbols[(index * 5 + seed * 3) % symbols.length],
  );
}

interface LoveSlotsProps {
  balance: number;
  theme: string;
  turbo: boolean;
  disabled: boolean;
  onSpin: (bet: number) => Promise<CasinoActionResult>;
  onSettled: (result: CasinoActionResult) => void;
  onTick: () => void;
  /** Pauses auto-spin while a decision is pending (Double or Nothing). */
  paused: boolean;
}

export function LoveSlots({
  balance,
  theme,
  turbo,
  disabled,
  onSpin,
  onSettled,
  onTick,
  paused,
}: LoveSlotsProps) {
  const reducedMotion = useReducedMotion() ?? false;
  const [bet, setBet] = useState<number>(casinoConfig.slots.bets[0]);
  const [strips, setStrips] = useState<string[][]>(initialReels);
  const [offsets, setOffsets] = useState([0, 0, 0]);
  const [durations, setDurations] = useState([0, 0, 0]);
  const [spinning, setSpinning] = useState(false);
  const [event, setEvent] = useState<SlotEvent | null>(null);
  const [auto, setAuto] = useState(0);
  const spinButton = useRef<HTMLButtonElement>(null);
  const spinCount = useRef(0);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach(window.clearTimeout), []);

  async function spin() {
    if (spinning || disabled || balance < bet) {
      setAuto(0);
      return;
    }
    setSpinning(true);
    setEvent(null);
    let result: CasinoActionResult;
    try {
      result = await onSpin(bet);
    } catch {
      result = {
        ok: false,
        message: "The connection dropped. Nothing was charged — try again.",
      };
    }
    if (!result.ok || result.event.kind !== "slots") {
      setSpinning(false);
      setAuto(0);
      onSettled(result);
      return;
    }
    const slot = result.event;
    spinCount.current += 1;
    const total = reducedMotion
      ? 0
      : turbo
        ? casinoConfig.slots.turboSpinMs
        : casinoConfig.slots.spinMs;
    const stopAt = [0.55, 0.75, 1].map((share) => Math.round(total * share));
    const nextStrips = slot.reels.map((finalCells, reel) => [
      ...(reducedMotion ? [] : filler(12 + reel * 5, spinCount.current + reel)),
      ...finalCells,
    ]);
    // Reset to the top without a transition, then roll to the end.
    setDurations([0, 0, 0]);
    setOffsets([0, 0, 0]);
    setStrips(nextStrips);
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        setDurations(stopAt);
        setOffsets(nextStrips.map((strip) => strip.length - 3));
      }),
    );
    stopAt.forEach((ms) => timers.current.push(window.setTimeout(onTick, ms)));
    timers.current.push(
      window.setTimeout(() => {
        // Keep only the visible cells so the next spin starts from here.
        setDurations([0, 0, 0]);
        setStrips(slot.reels);
        setOffsets([0, 0, 0]);
        setSpinning(false);
        setEvent(slot);
        onSettled(result);
        spinButton.current?.focus({ preventScroll: true });
        setAuto((current) => Math.max(0, current - 1));
      }, total + 60),
    );
  }

  // Auto-spin: one spin after another until the count, the balance or a
  // pending decision stops it.
  useEffect(() => {
    if (auto <= 0 || spinning || paused || disabled) return;
    const timer = window.setTimeout(() => void spin(), turbo ? 200 : 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, spinning, paused, disabled]);

  const resultText = event
    ? event.celebrated
      ? `WIN! +${event.payout} 💋${event.hotMultiplied ? " (×2 hot)" : ""}`
      : event.nearMiss
        ? "So close…"
        : ""
    : "";

  return (
    <div>
      <div
        className={cn(
          styles.machine,
          event?.celebrated && !reducedMotion && styles.winLights,
        )}
        data-theme={theme}
      >
        <p className="mb-2 text-center font-display text-2xl italic text-white drop-shadow">
          Love Slots
        </p>
        <div aria-hidden="true" className={styles.reels}>
          {strips.map((strip, reel) => (
            <div
              className={cn(
                styles.reel,
                event?.nearMissReel?.reel === reel &&
                  !reducedMotion &&
                  styles.nearMiss,
              )}
              key={reel}
            >
              <div
                className={styles.reelStrip}
                style={{
                  transform: `translateY(calc(var(--cell) * -${offsets[reel]}))`,
                  transition: durations[reel]
                    ? `transform ${durations[reel]}ms cubic-bezier(0.2, 0.75, 0.25, 1.04)`
                    : "none",
                }}
              >
                {strip.map((symbol, index) => (
                  <span className={styles.symbol} key={`${index}-${symbol}`}>
                    {symbol}
                  </span>
                ))}
              </div>
              <span className={styles.payline} />
            </div>
          ))}
        </div>
        <p
          aria-live="polite"
          className={styles.result}
          data-win={event?.celebrated ?? false}
        >
          {resultText}
          <span className="sr-only">
            {event
              ? `Reels: ${event.reels.map((cells) => cells[1]).join(" ")}. ${
                  event.celebrated
                    ? `You won ${event.payout} kisses.`
                    : "No win."
                }`
              : ""}
          </span>
        </p>
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <div aria-label="Bet" className="flex gap-2" role="group">
          {casinoConfig.slots.bets.map((value) => (
            <button
              aria-pressed={bet === value}
              className={styles.chip}
              disabled={spinning}
              key={value}
              onClick={() => setBet(value)}
              type="button"
            >
              {value} 💋
            </button>
          ))}
        </div>
        <div aria-label="Auto-spin" className="flex gap-2" role="group">
          {auto > 0 ? (
            <button
              className={styles.smallButton}
              onClick={() => setAuto(0)}
              type="button"
            >
              Stop auto ({auto})
            </button>
          ) : (
            casinoConfig.slots.autoSpinCounts.map((count) => (
              <button
                className={styles.smallButton}
                disabled={spinning || disabled || balance < bet}
                key={count}
                onClick={() => setAuto(count)}
                type="button"
              >
                Auto ×{count}
              </button>
            ))
          )}
        </div>
      </div>

      <button
        className={cn(styles.bigButton, "mt-4")}
        disabled={spinning || disabled || balance < bet}
        onClick={() => void spin()}
        ref={spinButton}
        type="button"
      >
        {spinning ? "Spinning…" : event ? "Spin again" : "Pull the lever"} ·{" "}
        {bet} 💋
      </button>
      {balance < bet && !spinning ? (
        <p className={cn(styles.muted, "mt-2 text-center text-sm")}>
          Out of 💋. The Kiss Shop is below, conveniently.
        </p>
      ) : null}
    </div>
  );
}
