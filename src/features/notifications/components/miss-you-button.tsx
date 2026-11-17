"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { sendMissYou } from "../actions/love";
import styles from "./love.module.css";

const TOO_MUCH = 8;

function burst(from: DOMRect, reduced: boolean) {
  if (reduced) return;
  for (let i = 0; i < 9; i++) {
    const heart = document.createElement("span");
    heart.textContent = ["❤️", "💖", "💗", "💕"][i % 4];
    heart.className = styles.particle;
    heart.setAttribute("aria-hidden", "true");
    document.body.appendChild(heart);
    const x = from.left + from.width / 2 - 12;
    const y = from.top;
    const dx = (Math.random() - 0.5) * 160;
    const dy = -90 - Math.random() * 160;
    heart
      .animate(
        [
          { transform: `translate(${x}px, ${y}px) scale(0.6)`, opacity: 1 },
          {
            transform: `translate(${x + dx}px, ${y + dy}px) scale(${1 + Math.random()}) rotate(${(Math.random() - 0.5) * 60}deg)`,
            opacity: 0,
          },
        ],
        {
          duration: 900 + Math.random() * 500,
          easing: "cubic-bezier(.2,.7,.3,1)",
        },
      )
      .finished.then(
        () => heart.remove(),
        () => heart.remove(),
      );
  }
}

/** Valentina's "Miss you": hearts fly, Gianmaria gets an email. */
export function MissYouButton({
  variant = "floating",
}: {
  variant?: "floating" | "inline";
}) {
  const reduced = useReducedMotion() ?? false;
  const [bubble, setBubble] = useState<string | null>(null);
  const [tooMuch, setTooMuch] = useState(false);
  const taps = useRef<number[]>([]);
  const timer = useRef(0);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function say(text: string) {
    setBubble(text);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setBubble(null), 3500);
  }

  async function tap(button: HTMLButtonElement) {
    burst(button.getBoundingClientRect(), reduced);
    try {
      navigator.vibrate?.(15);
    } catch {
      // Optional.
    }
    const now = Date.now();
    taps.current = [...taps.current.filter((at) => now - at < 60_000), now];
    if (taps.current.length >= TOO_MUCH && !tooMuch) {
      setTooMuch(true);
      window.setTimeout(() => setTooMuch(false), 2600);
    }
    say("💌 Sending…");
    const result = await sendMissYou().catch(() => ({ ok: false, emailed: 0 }));
    if (!result.ok) say("The heart got lost on the way. Try again?");
    else if (result.emailed > 0)
      say(
        result.emailed > 1
          ? `Sent! Gianmaria knows you miss him ×${result.emailed}.`
          : "Sent! Gianmaria knows you miss him.",
      );
    else say("Saved — it goes out with the next note (one every 10 minutes).");
  }

  return (
    <>
      <button
        aria-label="Miss you — tell Gianmaria"
        className={variant === "floating" ? styles.fab : styles.inline}
        onClick={(event) => void tap(event.currentTarget)}
        type="button"
      >
        <span aria-hidden="true">❤️</span>
        {variant === "inline" ? "Miss you" : null}
      </button>
      <p aria-live="polite" className={bubble ? styles.bubble : "sr-only"}>
        {bubble}
      </p>
      {tooMuch ? (
        <div aria-hidden="true" className={styles.tooMuch}>
          <div>
            <span>🥺</span>
            <span className="font-display text-2xl">Okay, okay.</span>
            <span className="text-sm">He gets it. He misses you too.</span>
          </div>
        </div>
      ) : null}
    </>
  );
}
