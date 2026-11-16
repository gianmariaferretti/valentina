"use client";

import { useRef, useState } from "react";

import { ScratchSurface } from "@/components/ui/scratch-surface";
import {
  casinoConfig,
  scratchTiers,
  type ScratchTier,
} from "@/data/casino-config";
import { cn } from "@/lib/cn";

import { scratchTicket, type CasinoActionResult } from "../actions";
import type { ScratchEvent } from "../lib/engine";
import styles from "./casino.module.css";
import { pickQuip } from "./croupier";
import { connectionLost, type GameProps } from "./game-types";

const tiers = casinoConfig.scratch.tiers;
const couponOdds: Record<ScratchTier, string> = {
  bronze: "Small chance of a coupon",
  silver: "2× the coupon chance",
  gold: "4× the coupon chance",
};

function TicketBack({ tier }: { tier: ScratchTier }) {
  const info = tiers[tier];
  return (
    <>
      <p className="text-[0.62rem] font-black tracking-[0.18em] uppercase">
        {info.label} ticket · prizes
      </p>
      <ul className="grid gap-1 text-sm font-bold">
        {info.outcomes.map((outcome) => (
          <li className="flex justify-between gap-3" key={outcome.symbol}>
            <span>{outcome.symbol.repeat(3)}</span>
            <span>{Math.floor(outcome.multiplier * info.cost)} 💋</span>
          </li>
        ))}
        <li className="flex justify-between gap-3">
          <span>🎟️</span>
          <span>{couponOdds[tier]}</span>
        </li>
      </ul>
      <p className="text-[0.7rem]">Match 3 symbols to win.</p>
    </>
  );
}

export function ScratchCards({
  view,
  busy,
  sound,
  spend,
  onResult,
  setQuip,
}: GameProps) {
  const [tier, setTier] = useState<ScratchTier>("bronze");
  const [pending, setPending] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [card, setCard] = useState<{
    result: CasinoActionResult;
    event: ScratchEvent;
  } | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealAll, setRevealAll] = useState(false);
  const buyButton = useRef<HTMLButtonElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const cost = tiers[tier].cost;
  const counter = useRef(0);
  const [ticketNo, setTicketNo] = useState(0);
  const scratching = card !== null && !revealed;

  async function buy() {
    if (pending || busy || view.balance < cost) return;
    setPending(true);
    setFlipped(false);
    spend(cost);
    sound.play("card");
    let result: CasinoActionResult;
    try {
      result = await scratchTicket(tier);
    } catch {
      result = connectionLost;
    }
    setPending(false);
    if (!result.ok || result.event.kind !== "scratch") {
      await onResult(result, null);
      return;
    }
    setRevealed(false);
    setRevealAll(false);
    setTicketNo((n) => n + 1);
    setCard({ result, event: result.event });
  }

  async function reveal() {
    if (!card || revealed) return;
    setRevealed(true);
    counter.current += 1;
    const event = card.event;
    setQuip(
      pickQuip(
        event.coupons.length ? "coupon" : event.payout > 0 ? "win" : "lose",
        counter.current,
      ),
    );
    if (event.payout === 0 && event.coupons.length === 0) sound.play("lose");
    await onResult(card.result, stageRef.current);
    buyButton.current?.focus({ preventScroll: true });
  }

  const shownTier = card && !revealed ? card.event.tier : tier;

  return (
    <div>
      <div
        aria-label="Ticket type"
        className="flex flex-wrap justify-center gap-2"
        role="group"
      >
        {scratchTiers.map((value) => (
          <button
            aria-pressed={tier === value}
            className={styles.chip}
            disabled={pending || scratching}
            key={value}
            onClick={() => {
              setTier(value);
              setCard(null);
            }}
            type="button"
          >
            {tiers[value].label} · {tiers[value].cost} 💋
          </button>
        ))}
      </div>

      <div className={cn(styles.ticketStage, "mt-4")} ref={stageRef}>
        <div className={styles.ticketFlip} data-flipped={flipped}>
          <div className={styles.ticketFace} data-tier={shownTier}>
            <div className={styles.ticketHead}>
              <span>{tiers[shownTier].label}</span>
              <span>Match 3</span>
            </div>
            {card ? (
              <ScratchSurface
                className="rounded-[0.8rem]"
                coverText={`${tiers[card.event.tier].label.toUpperCase()} · SCRATCH`}
                dust
                forceReveal={revealAll}
                hideButton
                key={ticketNo}
                onReveal={() => void reveal()}
                onScratch={() => sound.play("scratch")}
                threshold={0.45}
                tone={card.event.tier}
              >
                <div className={styles.scratchGrid}>
                  {card.event.cells.map((symbol, index) => (
                    <span
                      className={styles.scratchCell}
                      data-almost={revealed && card.event.almostIndex === index}
                      data-win={revealed && symbol === card.event.winningSymbol}
                      key={index}
                    >
                      <span>{symbol}</span>
                    </span>
                  ))}
                </div>
              </ScratchSurface>
            ) : (
              <div className={styles.scratchGrid}>
                {Array.from({ length: 9 }, (_, index) => (
                  <span className={styles.scratchCell} key={index}>
                    <span aria-hidden="true">?</span>
                  </span>
                ))}
              </div>
            )}
          </div>
          <div
            aria-hidden={!flipped}
            className={styles.ticketBack}
            data-tier={shownTier}
          >
            <TicketBack tier={shownTier} />
          </div>
        </div>
      </div>

      <p
        aria-live="polite"
        className={styles.result}
        data-win={
          revealed && Boolean(card?.event.payout || card?.event.coupons.length)
        }
      >
        {card && revealed
          ? card.event.coupons.length > 0
            ? `You won: ${card.event.coupons[0].title}`
            : card.event.payout > 0
              ? `WIN! +${card.event.payout} 💋`
              : card.event.almostIndex !== null
                ? "So close…"
                : "No win"
          : scratching
            ? "Scratch with your finger"
            : ""}
      </p>

      {scratching ? (
        <button
          className={styles.bigButton}
          onClick={() => setRevealAll(true)}
          type="button"
        >
          Reveal all
        </button>
      ) : (
        <button
          className={styles.bigButton}
          disabled={pending || busy || view.balance < cost}
          onClick={() => void buy()}
          ref={buyButton}
          type="button"
        >
          {pending ? "Printing…" : `Buy · ${cost} 💋`}
        </button>
      )}
      <div className="mt-2 flex justify-center">
        <button
          aria-pressed={flipped}
          className={styles.smallButton}
          onClick={() => setFlipped((value) => !value)}
          type="button"
        >
          {flipped ? "Show the ticket" : "See prizes"}
        </button>
      </div>
    </div>
  );
}
