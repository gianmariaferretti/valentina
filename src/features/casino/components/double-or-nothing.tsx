"use client";

import { useReducedMotion } from "motion/react";
import { useRef, useState } from "react";

import { doubleIt, keepWinnings, type CasinoActionResult } from "../actions";
import type { DoubleEvent } from "../lib/engine";
import styles from "./casino.module.css";
import { connectionLost } from "./game-types";
import type { CasinoSoundApi } from "./sounds";

/** A 3D coin toss: heads doubles the win, tails loses it. */
export function DoubleOrNothing({
  amount,
  busy,
  sound,
  onResult,
  onClose,
}: {
  amount: number;
  busy: boolean;
  sound: CasinoSoundApi;
  onResult: (
    result: CasinoActionResult,
    origin: Element | null,
  ) => Promise<void>;
  onClose: () => void;
}) {
  const reduced = useReducedMotion() ?? false;
  const [pending, setPending] = useState(false);
  const [toss, setToss] = useState<DoubleEvent | null>(null);
  const coinRef = useRef<HTMLDivElement>(null);
  const [spent, setSpent] = useState(amount);

  async function flip() {
    if (pending || busy) return;
    setPending(true);
    sound.play("flip");
    const coin = coinRef.current;
    const spinning =
      coin && !reduced
        ? coin.animate(
            [
              { transform: "translateY(0) rotateY(0)" },
              { transform: "translateY(-3.5rem) rotateY(900deg)" },
              { transform: "translateY(0) rotateY(1800deg)" },
            ],
            { duration: 900, iterations: Infinity, easing: "linear" },
          )
        : null;
    let result: CasinoActionResult;
    try {
      result = await doubleIt();
    } catch {
      result = connectionLost;
    }
    spinning?.cancel();
    if (!result.ok || result.event.kind !== "double") {
      setPending(false);
      await onResult(result, null);
      onClose();
      return;
    }
    const event = result.event;
    if (coin && !reduced) {
      const end = event.face === "heads" ? 1800 : 1980;
      await coin
        .animate(
          [
            { transform: "translateY(0) rotateY(0)" },
            {
              transform: `translateY(-4.5rem) rotateY(${end / 2}deg)`,
              offset: 0.45,
            },
            { transform: `translateY(0) rotateY(${end}deg)` },
          ],
          {
            duration: 1100,
            easing: "cubic-bezier(.25,.6,.35,1)",
            fill: "forwards",
          },
        )
        .finished.catch(() => undefined);
    } else if (coin) {
      coin.style.transform = event.face === "heads" ? "" : "rotateY(180deg)";
    }
    setToss(event);
    if (!event.won) sound.play("lose");
    await onResult(result, coinRef.current);
    await new Promise((r) => window.setTimeout(r, 1300));
    const next = result.view.pendingDouble;
    if (event.won && next) {
      // Heads: the bigger pot can be doubled again.
      setSpent(next);
      setToss(null);
      if (coin) {
        coin.getAnimations().forEach((animation) => animation.cancel());
        coin.style.transform = "";
      }
      setPending(false);
    } else onClose();
  }

  async function keep() {
    if (pending || busy) return;
    setPending(true);
    let result: CasinoActionResult;
    try {
      result = await keepWinnings();
    } catch {
      result = connectionLost;
    }
    await onResult(result, null);
    setPending(false);
    onClose();
  }

  return (
    <div
      aria-labelledby="double-title"
      className={styles.doublePanel}
      role="group"
    >
      <p className="font-display text-2xl" id="double-title">
        Double or Nothing?
      </p>
      <p className="mt-1 text-sm text-[#d6e9dc]">
        Heads: {spent * 2} 💋. Tails: you lose the {spent} 💋.
      </p>
      <div className={styles.coinStage}>
        <div className={styles.coin} ref={coinRef}>
          <span className={styles.coinFace}>💋</span>
          <span className={styles.coinFace} data-face="tails">
            ✕
          </span>
        </div>
      </div>
      <p
        aria-live="polite"
        className={styles.result}
        data-win={toss?.won ?? false}
      >
        {toss ? (toss.won ? `Heads! +${toss.amount} 💋` : "Tails. Gone.") : ""}
      </p>
      {toss ? null : (
        <>
          <button
            className={styles.bigButton}
            disabled={pending || busy}
            onClick={() => void flip()}
            ref={(element) => element?.focus({ preventScroll: true })}
            type="button"
          >
            {pending ? "Flipping…" : "Flip the coin"}
          </button>
          <button
            className={styles.declineLink}
            disabled={pending || busy}
            onClick={() => void keep()}
            type="button"
          >
            Keep my {spent} 💋
          </button>
        </>
      )}
    </div>
  );
}
