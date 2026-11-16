"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { casinoConfig } from "@/data/casino-config";
import { casinoPrizes } from "@/data/casino-prizes";
import { cn } from "@/lib/cn";

import { spinLoveSlots, type CasinoActionResult } from "../actions";
import type { SlotEvent } from "../lib/engine";
import styles from "./casino.module.css";
import { pickQuip } from "./croupier";
import { connectionLost, type GameProps } from "./game-types";

const cfg = casinoConfig.slots;
const symbols = cfg.symbols;
const initialGrid = [
  ["🌹", "💋", "🍝"],
  ["🎬", "💋", "✈️"],
  ["🍦", "❤️", "💆"],
  ["✈️", "🍝", "🎬"],
  ["❤️", "🌹", "🍦"],
];

function filler(count: number, seed: number) {
  return Array.from(
    { length: count },
    (_, i) => symbols[(i * 7 + seed * 3) % symbols.length],
  );
}

const examplePrize = (tier: string) =>
  casinoPrizes.find((prize) => prize.kind === tier)?.title ?? "";

export function SlotPaytable({ bet }: { bet: number }) {
  return (
    <section aria-label="Paytable" className={styles.paytable}>
      <h3>Paytable · any line, from the left · bet {bet} 💋</h3>
      <ul>
        {cfg.outcomes.map((outcome) => (
          <li key={outcome.id}>
            <span>{outcome.label}</span>
            <span>{Math.floor(outcome.multiplier * bet)} 💋</span>
          </li>
        ))}
        <li>
          <span>{cfg.couponSymbols.common.repeat(3)}</span>
          <span>{examplePrize("common")}</span>
        </li>
        <li>
          <span>{cfg.couponSymbols.rare.repeat(3)}</span>
          <span>{examplePrize("rare")}</span>
        </li>
        <li>
          <span>{cfg.couponSymbols.epic.repeat(3)}</span>
          <span>{examplePrize("epic")}</span>
        </li>
        <li>
          <span>{cfg.couponSymbols.jackpot.repeat(3)}</span>
          <span>JACKPOT</span>
        </li>
      </ul>
      <p className="mt-2 text-[0.7rem] text-[#cfe3d6]">
        Coupon symbols win a coupon of that rarity (examples shown).
      </p>
    </section>
  );
}

export function LoveSlots({
  view,
  turbo,
  busy,
  paused,
  sound,
  spend,
  onResult,
  setQuip,
}: GameProps) {
  const reduced = useReducedMotion() ?? false;
  const [bet, setBet] = useState<number>(cfg.bets[0]);
  const [strips, setStrips] = useState<string[][]>(initialGrid);
  const [spinning, setSpinning] = useState(false);
  const [event, setEvent] = useState<SlotEvent | null>(null);
  const [suspense, setSuspense] = useState(false);
  const [auto, setAuto] = useState(0);
  const [leverY, setLeverY] = useState(0);
  const stripRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cabinetRef = useRef<HTMLDivElement>(null);
  const spinButton = useRef<HTMLButtonElement>(null);
  const counter = useRef(0);
  const drag = useRef<{ start: number } | null>(null);

  async function spin() {
    if (spinning || busy || view.balance < bet) {
      setAuto(0);
      return;
    }
    setSpinning(true);
    setEvent(null);
    spend(bet);
    sound.play("spin");
    const loop = window.setInterval(() => sound.play("spin"), 560);
    let result: CasinoActionResult;
    try {
      result = await spinLoveSlots(bet);
    } catch {
      result = connectionLost;
    }
    if (!result.ok || result.event.kind !== "slots") {
      window.clearInterval(loop);
      setSpinning(false);
      setAuto(0);
      await onResult(result, null);
      return;
    }
    const slot = result.event;
    counter.current += 1;
    const base = reduced ? 0 : turbo ? cfg.turboSpinMs : cfg.spinMs;
    const next = slot.grid.map((cells, reel) => [
      ...strips[reel],
      ...(reduced ? [] : filler(10 + reel * 3, counter.current + reel)),
      ...cells,
    ]);
    setStrips(next);
    await new Promise<void>((r) => requestAnimationFrame(() => r()));

    const durations = next.map((_, reel) => {
      let duration = base * (0.42 + 0.145 * reel);
      if (slot.suspense && reel >= 2 && !reduced && !turbo)
        duration += cfg.suspenseMs * (reel - 1) * 0.55;
      return Math.round(duration);
    });
    let suspenseTimer = 0;
    if (slot.suspense && !reduced) {
      suspenseTimer = window.setTimeout(() => {
        setSuspense(true);
        sound.play("heartbeat");
      }, durations[1]);
    }
    await Promise.all(
      next.map(async (strip, reel) => {
        const element = stripRefs.current[reel];
        if (!element || reduced || durations[reel] === 0) return;
        const cell =
          element.firstElementChild?.getBoundingClientRect().height ?? 60;
        const distance = (strip.length - 3) * cell;
        const animation = element.animate(
          [
            { transform: "translateY(0)" },
            {
              transform: `translateY(${-distance - cell * 0.22}px)`,
              offset: 0.9,
            },
            { transform: `translateY(${-distance}px)` },
          ],
          {
            duration: durations[reel],
            easing: "cubic-bezier(0.22, 0.62, 0.28, 1)",
            fill: "forwards",
          },
        );
        await animation.finished.catch(() => undefined);
        sound.play("stop");
      }),
    );
    window.clearInterval(loop);
    window.clearTimeout(suspenseTimer);
    sound.stop("heartbeat");
    setSuspense(false);
    // Keep only the visible cells so the next spin starts from here.
    stripRefs.current.forEach((element) =>
      element?.getAnimations().forEach((a) => a.cancel()),
    );
    setStrips(slot.grid);
    setEvent(slot);
    setSpinning(false);
    setQuip(
      pickQuip(
        slot.coupons.length ? "coupon" : slot.celebrated ? "win" : "lose",
        counter.current,
      ),
    );
    if (slot.nearMiss2) sound.play("lose");
    await onResult(result, cabinetRef.current);
    spinButton.current?.focus({ preventScroll: true });
    setAuto((value) => Math.max(0, value - 1));
  }

  useEffect(() => {
    if (auto <= 0 || spinning || paused || busy) return;
    const timer = window.setTimeout(() => void spin(), turbo ? 200 : 500);
    return () => window.clearTimeout(timer);
    // spin() reads the latest state when it fires.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auto, spinning, paused, busy]);

  const winningCells = new Set<string>();
  for (const line of event?.lines ?? [])
    for (let reel = 0; reel < line.length; reel++)
      winningCells.add(`${reel}-${line.row}`);
  const missCell = event?.nearMiss2
    ? `${event.nearMiss2.reel}-${event.nearMiss2.missRow}`
    : null;
  const theme = view.vip.id === "bronze" ? "classic" : view.vip.id;
  const canSpin = !spinning && !busy && view.balance >= bet;

  return (
    <div>
      <div className={styles.machine}>
        <div
          className={styles.cabinet}
          data-suspense={suspense}
          data-theme={theme}
          ref={cabinetRef}
        >
          <div aria-hidden="true" className={styles.reels}>
            {strips.map((strip, reel) => (
              <div className={styles.reel} key={reel}>
                <div
                  className={styles.strip}
                  ref={(element) => {
                    stripRefs.current[reel] = element;
                  }}
                >
                  {strip.map((symbol, row) => (
                    <span
                      className={cn(
                        styles.cell,
                        !spinning &&
                          winningCells.has(`${reel}-${row}`) &&
                          styles.cellWin,
                        !spinning &&
                          missCell === `${reel}-${row}` &&
                          styles.cellBump,
                      )}
                      key={`${row}-${symbol}`}
                    >
                      {symbol}
                    </span>
                  ))}
                </div>
              </div>
            ))}
            <svg
              className={styles.paylines}
              preserveAspectRatio="none"
              viewBox="0 0 100 3"
            >
              {[0, 1, 2].map((row) => (
                <line
                  data-win={
                    !spinning &&
                    (event?.lines.some((line) => line.row === row) ?? false)
                  }
                  key={row}
                  vectorEffect="non-scaling-stroke"
                  x1="0"
                  x2="100"
                  y1={row + 0.5}
                  y2={row + 0.5}
                />
              ))}
            </svg>
          </div>
          {event?.nearMiss2 && !spinning ? (
            <p aria-hidden="true" className={styles.soClose}>
              SO CLOSE!
            </p>
          ) : null}
        </div>

        <button
          aria-label={`Pull the lever: spin for ${bet} kisses`}
          className={styles.lever}
          disabled={!canSpin}
          onClick={(e) => {
            // Keyboard activation; a drag already spun on pointer up.
            if (e.detail === 0) void spin();
          }}
          onPointerCancel={() => {
            drag.current = null;
            setLeverY(0);
          }}
          onPointerDown={(e) => {
            if (!canSpin) return;
            drag.current = { start: e.clientY };
            e.currentTarget.setPointerCapture(e.pointerId);
          }}
          onPointerMove={(e) => {
            if (!drag.current) return;
            setLeverY(
              Math.max(0, Math.min(96, e.clientY - drag.current.start)),
            );
          }}
          onPointerUp={(e) => {
            const moved = drag.current ? e.clientY - drag.current.start : 0;
            const wasDragging = drag.current !== null;
            drag.current = null;
            setLeverY(0);
            // A pull past halfway, or a simple tap, spins.
            if (wasDragging && (moved > 45 || moved < 6)) void spin();
          }}
          type="button"
        >
          <span className={styles.leverTrack} />
          <span
            className={styles.leverKnob}
            style={{
              transform: `translateY(${leverY}px)`,
              transition:
                leverY === 0
                  ? "transform 260ms cubic-bezier(.3,1.6,.5,1)"
                  : "none",
            }}
          />
        </button>
      </div>

      <p
        aria-live="polite"
        className={styles.result}
        data-win={Boolean(event?.celebrated || event?.coupons.length)}
      >
        {event
          ? event.coupons.length > 0
            ? `You won: ${event.coupons[0].title}`
            : event.celebrated
              ? `WIN! +${event.payout} 💋${event.hotMultiplied ? " (×2 hot)" : ""}`
              : event.nearMiss2
                ? "So close…"
                : "No win"
          : ""}
      </p>

      <button
        className={styles.bigButton}
        disabled={!canSpin}
        onClick={() => void spin()}
        ref={spinButton}
        type="button"
      >
        {spinning ? "Spinning…" : `Spin · ${bet} 💋`}
      </button>
      {view.balance < bet && !spinning ? (
        <p className="mt-2 text-center text-sm text-[#d6e9dc]">
          Not enough 💋. Tap “Buy 💋” at the top.
        </p>
      ) : null}

      <div className={styles.controls}>
        <div aria-label="Bet" className="flex gap-2" role="group">
          {cfg.bets.map((value) => (
            <button
              aria-label={`Bet ${value} kisses`}
              aria-pressed={bet === value}
              className={styles.chip}
              disabled={spinning}
              key={value}
              onClick={() => setBet(value)}
              type="button"
            >
              {value}
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
            cfg.autoSpinCounts.map((count) => (
              <button
                className={styles.smallButton}
                disabled={!canSpin}
                key={count}
                onClick={() => setAuto(count)}
                type="button"
              >
                Auto {count}
              </button>
            ))
          )}
        </div>
      </div>

      <SlotPaytable bet={bet} />
    </div>
  );
}
