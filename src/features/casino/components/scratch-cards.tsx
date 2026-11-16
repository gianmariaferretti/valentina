"use client";

import { useRef, useState } from "react";

import { ScratchSurface } from "@/components/ui/scratch-surface";
import {
  casinoConfig,
  scratchTiers,
  type ScratchTier,
} from "@/data/casino-config";
import { cn } from "@/lib/cn";

import type { CasinoActionResult } from "../actions";
import type { ScratchEvent } from "../lib/engine";
import styles from "./casino.module.css";

const tones = { bronze: "bronze", silver: "silver", gold: "gold" } as const;

interface ScratchCardsProps {
  balance: number;
  disabled: boolean;
  onBuy: (tier: ScratchTier) => Promise<CasinoActionResult>;
  onSettled: (result: CasinoActionResult) => void;
}

export function ScratchCards({
  balance,
  disabled,
  onBuy,
  onSettled,
}: ScratchCardsProps) {
  const [tier, setTier] = useState<ScratchTier>("bronze");
  const [pending, setPending] = useState(false);
  const [card, setCard] = useState<{
    result: CasinoActionResult;
    event: ScratchEvent;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const buyButton = useRef<HTMLButtonElement>(null);
  const cost = casinoConfig.scratch.tiers[tier].cost;

  async function buy() {
    if (pending || disabled || balance < cost) return;
    setPending(true);
    let result: CasinoActionResult;
    try {
      result = await onBuy(tier);
    } catch {
      result = {
        ok: false,
        message: "The connection dropped. Nothing was charged — try again.",
      };
    } finally {
      setPending(false);
    }
    if (!result.ok || result.event.kind !== "scratch") {
      onSettled(result);
      return;
    }
    setRevealed(false);
    setCard({ result, event: result.event });
  }

  function reveal() {
    if (!card || revealed) return;
    setRevealed(true);
    onSettled(card.result);
    window.setTimeout(
      () => buyButton.current?.focus({ preventScroll: true }),
      50,
    );
  }

  return (
    <div>
      <div
        aria-label="Ticket type"
        className="flex flex-wrap gap-2"
        role="group"
      >
        {scratchTiers.map((value) => (
          <button
            aria-pressed={tier === value}
            className={styles.chip}
            disabled={pending || (card !== null && !revealed)}
            key={value}
            onClick={() => setTier(value)}
            type="button"
          >
            {casinoConfig.scratch.tiers[value].label} ·{" "}
            {casinoConfig.scratch.tiers[value].cost} 💋
          </button>
        ))}
      </div>

      <div className="mx-auto mt-4 max-w-xs">
        {card ? (
          <ScratchSurface
            className="rounded-[1rem]"
            coverText={`${card.event.tier.toUpperCase()} · MATCH 3 TO WIN`}
            key={
              card.event.cells.join("") +
              String(card.result.ok && card.result.view.balance)
            }
            onReveal={reveal}
            revealLabel="Reveal all"
            threshold={0.45}
            tone={tones[card.event.tier]}
          >
            <div className={styles.scratchGrid}>
              {card.event.cells.map((symbol, index) => (
                <span
                  className={styles.scratchCell}
                  data-almost={card.event.almostIndex === index}
                  data-win={symbol === card.event.winningSymbol}
                  key={index}
                >
                  <span>{symbol}</span>
                </span>
              ))}
            </div>
          </ScratchSurface>
        ) : (
          <div className={cn(styles.scratchGrid, "place-items-center")}>
            {Array.from({ length: 9 }, (_, index) => (
              <span className={styles.scratchCell} key={index}>
                <span aria-hidden="true">?</span>
              </span>
            ))}
          </div>
        )}
        <p
          aria-live="polite"
          className={styles.result}
          data-win={revealed && (card?.event.payout ?? 0) > 0}
        >
          {card && revealed
            ? card.event.payout > 0
              ? `WIN! +${card.event.payout} 💋`
              : card.event.almostIndex !== null
                ? "Two 7️⃣ and an almost. Classic."
                : "Not this one."
            : ""}
        </p>
      </div>

      <button
        className={cn(styles.bigButton, "mt-2")}
        disabled={
          pending || disabled || balance < cost || (card !== null && !revealed)
        }
        onClick={() => void buy()}
        ref={buyButton}
        type="button"
      >
        {pending
          ? "Printing…"
          : card
            ? `One more · ${cost} 💋`
            : `Buy ${casinoConfig.scratch.tiers[tier].label} · ${cost} 💋`}
      </button>
    </div>
  );
}
