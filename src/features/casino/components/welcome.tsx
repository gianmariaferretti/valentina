"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Portal } from "@/components/ui/portal";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import { cn } from "@/lib/cn";

import styles from "./casino.module.css";
import { Croupier } from "./croupier";

const slides = [
  "Here you play with 💋. They're real kisses: whatever you buy, you owe Gianmaria.",
  "Pick a game, place your bet, win coupons you can actually use.",
  "The house always wins… almost.",
] as const;

/** The croupier's three-screen tour. Skippable at any point. */
export function WelcomeTour({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [index, setIndex] = useState(0);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { dialogRef, onKeyDown } = useModalDialog({
    initialFocusRef: nextRef,
    isOpen: open,
    onClose,
  });

  if (!open) return null;
  const last = index === slides.length - 1;

  return (
    <Portal>
      <div
        aria-labelledby="welcome-title"
        aria-modal="true"
        className={styles.overlay}
        onKeyDown={onKeyDown}
        ref={dialogRef}
        role="dialog"
        tabIndex={-1}
      >
        <div className={styles.welcomeCard}>
          <Croupier size="large" />
          <h2 className="sr-only" id="welcome-title">
            How the Kiss Casino works
          </h2>
          <p aria-live="polite" className={styles.welcomeLine} key={index}>
            {slides[index]}
          </p>
          <div aria-hidden="true" className={styles.dots}>
            {slides.map((_, dot) => (
              <span data-on={dot === index} key={dot} />
            ))}
          </div>
          <button
            className={styles.bigButton}
            onClick={() => {
              if (last) {
                setIndex(0);
                onClose();
              } else setIndex(index + 1);
            }}
            ref={nextRef}
            type="button"
          >
            {last ? "Let's play" : "Next"}
          </button>
          {last ? null : (
            <button
              className={styles.declineLink}
              onClick={() => {
                setIndex(0);
                onClose();
              }}
              type="button"
            >
              Skip
            </button>
          )}
        </div>
      </div>
    </Portal>
  );
}

/**
 * After a casino coupon is redeemed the casino starts over: the croupier
 * closes the curtains, announces the fresh start and opens them again.
 */
export function ResetCurtains({ onDone }: { onDone: () => void }) {
  const reduced = useReducedMotion() ?? false;
  const [phase, setPhase] = useState<"closing" | "closed" | "opening">(
    "closing",
  );
  const done = useRef(onDone);

  useEffect(() => {
    done.current = onDone;
  }, [onDone]);

  useEffect(() => {
    const timers = [
      window.setTimeout(() => setPhase("closed"), 60),
      window.setTimeout(() => setPhase("opening"), reduced ? 2200 : 3000),
      window.setTimeout(() => done.current(), reduced ? 2600 : 4100),
    ];
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [reduced]);

  const shut = phase !== "opening";
  const transition = reduced
    ? "opacity 400ms ease"
    : "transform 1000ms cubic-bezier(.6,0,.3,1)";

  return (
    <Portal>
      <div aria-live="assertive" role="status">
        {(["left", "right"] as const).map((side) => (
          <div
            aria-hidden="true"
            className={styles.curtain}
            data-side={side}
            key={side}
            style={
              reduced
                ? { opacity: shut ? 1 : 0, transition }
                : {
                    transform: shut
                      ? phase === "closing"
                        ? `translateX(${side === "left" ? "-100%" : "100%"})`
                        : "translateX(0)"
                      : `translateX(${side === "left" ? "-100%" : "100%"})`,
                    transition,
                  }
            }
          />
        ))}
        <div
          className={cn(
            "pointer-events-none fixed inset-0 z-[93] grid place-items-center p-6 text-center",
          )}
          style={{
            opacity: phase === "closed" ? 1 : 0,
            transition: "opacity 400ms ease",
          }}
        >
          <div className="grid justify-items-center gap-3 text-[#fff8ec]">
            <Croupier size="large" />
            <p className="font-display text-4xl leading-tight">
              The casino has been reset
            </p>
            <p className="text-sm tracking-[0.14em] uppercase">
              Fresh start, new luck
            </p>
          </div>
        </div>
      </div>
    </Portal>
  );
}
