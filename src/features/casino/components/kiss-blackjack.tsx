"use client";

import { useRef, useState } from "react";

import { casinoConfig } from "@/data/casino-config";

import {
  dealBlackjack,
  hitBlackjack,
  standBlackjack,
  type CasinoActionResult,
} from "../actions";
import type { BlackjackEvent, BlackjackView, Card } from "../lib/engine";
import styles from "./casino.module.css";
import { pickQuip } from "./croupier";
import { connectionLost, type GameProps } from "./game-types";

const cfg = casinoConfig.blackjack;
const ranks = [
  "",
  "A",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "J",
  "Q",
  "K",
];
const suits = ["♥", "♦", "♣", "♠"];

function PlayingCard({ card }: { card: Card | null }) {
  if (!card)
    return (
      <span
        aria-label="Hidden card"
        className={`${styles.playingCard} ${styles.cardBack}`}
        role="img"
      />
    );
  const label = `${ranks[card.rank]}${suits[card.suit]}`;
  return (
    <span
      aria-label={label}
      className={styles.playingCard}
      data-red={card.suit < 2}
      role="img"
    >
      <small aria-hidden="true">{ranks[card.rank]}</small>
      <span aria-hidden="true">{suits[card.suit]}</span>
    </span>
  );
}

const outcomeText: Record<NonNullable<BlackjackEvent["outcome"]>, string> = {
  natural: "BLACKJACK!",
  win: "You win!",
  push: "Push — bet returned",
  lose: "The house wins",
  bust: "Bust!",
};

export function KissBlackjack({
  view,
  busy,
  sound,
  spend,
  onResult,
  setQuip,
}: GameProps) {
  const [bet, setBet] = useState<number>(view.blackjack?.bet ?? cfg.bets[0]);
  const [hand, setHand] = useState<BlackjackView | null>(view.blackjack);
  const [outcome, setOutcome] = useState<BlackjackEvent | null>(null);
  const [pending, setPending] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const counter = useRef(0);
  const playing = hand !== null && outcome === null;

  async function act(action: () => Promise<CasinoActionResult>, cost = 0) {
    if (pending || busy) return;
    setPending(true);
    if (cost) {
      spend(cost);
      setOutcome(null);
    }
    sound.play("card");
    let result: CasinoActionResult;
    try {
      result = await action();
    } catch {
      result = connectionLost;
    }
    setPending(false);
    if (!result.ok || result.event.kind !== "blackjack") {
      // Resync an open hand (e.g. it was finished in another tab).
      if (!result.ok && result.view) setHand(result.view.blackjack);
      await onResult(result, null);
      return;
    }
    const event = result.event;
    setHand(event.hand);
    if (event.phase === "playing") {
      await onResult(result, null);
      return;
    }
    setOutcome(event);
    counter.current += 1;
    const won = event.outcome === "natural" || event.outcome === "win";
    setQuip(
      pickQuip(
        event.play?.coupons.length ? "coupon" : won ? "win" : "lose",
        counter.current,
      ),
    );
    if (event.outcome === "lose" || event.outcome === "bust")
      sound.play("lose");
    await onResult(result, tableRef.current);
  }

  return (
    <div>
      <div className={styles.bjTable} ref={tableRef}>
        <div className={styles.hand}>
          <p className={styles.handLabel}>
            Croupier
            {hand?.dealerTotal != null ? ` · ${hand.dealerTotal}` : ""}
          </p>
          <div className={styles.cards}>
            {hand
              ? hand.dealer.map((card, index) => (
                  <PlayingCard
                    card={card}
                    key={`d-${index}-${card?.rank ?? "x"}`}
                  />
                ))
              : null}
          </div>
        </div>
        <p className="text-center text-[0.62rem] font-black tracking-[0.18em] text-[#ffd166] uppercase">
          Blackjack pays {cfg.naturalPays}× + rare coupon · dealer stands on{" "}
          {cfg.dealerStandsOn}
        </p>
        <div className={styles.hand}>
          <div className={styles.cards}>
            {hand
              ? hand.player.map((card, index) => (
                  <PlayingCard
                    card={card}
                    key={`p-${index}-${card.rank}-${card.suit}`}
                  />
                ))
              : null}
          </div>
          <p className={styles.handLabel}>
            You{hand ? ` · ${hand.playerTotal}` : ""}
          </p>
        </div>
      </div>

      <p
        aria-live="polite"
        className={styles.result}
        data-win={outcome?.outcome === "win" || outcome?.outcome === "natural"}
      >
        {outcome?.outcome
          ? outcome.play?.coupons.length
            ? `${outcomeText[outcome.outcome]} You won: ${outcome.play.coupons[0].title}`
            : `${outcomeText[outcome.outcome]}${outcome.play && outcome.play.payout > 0 ? ` +${outcome.play.payout} 💋` : ""}`
          : playing
            ? "Hit for another card, or Stand"
            : "Get closer to 21 than the croupier"}
      </p>

      {playing ? (
        <div className="grid grid-cols-2 gap-3">
          <button
            className={styles.bigButton}
            disabled={pending || busy}
            onClick={() => void act(hitBlackjack)}
            type="button"
          >
            Hit
          </button>
          <button
            className={styles.bigButton}
            disabled={pending || busy}
            onClick={() => void act(standBlackjack)}
            type="button"
          >
            Stand
          </button>
        </div>
      ) : (
        <button
          className={styles.bigButton}
          disabled={pending || busy || view.balance < bet}
          onClick={() => void act(() => dealBlackjack(bet), bet)}
          type="button"
        >
          {pending ? "Dealing…" : `Deal · ${bet} 💋`}
        </button>
      )}

      <div className={styles.controls}>
        <div aria-label="Bet" className="flex gap-2" role="group">
          {cfg.bets.map((value) => (
            <button
              aria-label={`Bet ${value} kisses`}
              aria-pressed={bet === value}
              className={styles.chip}
              disabled={playing || pending}
              key={value}
              onClick={() => setBet(value)}
              type="button"
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <section aria-label="Paytable" className={styles.paytable}>
        <h3>Paytable · bet {bet} 💋</h3>
        <ul>
          <li>
            <span>Blackjack (A + 10/J/Q/K)</span>
            <span>{Math.floor(bet * cfg.naturalPays)} 💋 + rare coupon</span>
          </li>
          <li>
            <span>Beat the croupier</span>
            <span>{Math.floor(bet * cfg.winPays)} 💋</span>
          </li>
          <li>
            <span>Tie</span>
            <span>{Math.floor(bet * cfg.pushPays)} 💋 back</span>
          </li>
          <li>
            <span>Over 21</span>
            <span>lose</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
