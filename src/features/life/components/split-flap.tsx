"use client";

import { Fragment, memo, useEffect, useRef, useState } from "react";

import { flapChars, flipPath } from "../lib/board";
import styles from "./next-time.module.css";

/** Time between two flips of the same flap, and the stagger along a row. */
const STEP_MS = 75;
const STAGGER_MS = 28;
const SETTLE_MS = 420;

/**
 * One shared clock for every flap on the page. All the flaps that move on
 * a tick update in the same task, so React renders them together once
 * instead of hundreds of separate timers (long tasks on phones).
 */
type Tick = (time: number) => boolean;
const subscribers = new Set<Tick>();
let clock = 0;

function onTick(run: Tick) {
  subscribers.add(run);
  if (!clock)
    clock = window.setInterval(() => {
      const time = performance.now();
      for (const sub of subscribers) if (!sub(time)) subscribers.delete(sub);
      if (subscribers.size === 0) {
        window.clearInterval(clock);
        clock = 0;
      }
    }, STEP_MS);
  return () => {
    subscribers.delete(run);
  };
}

interface SlotProps {
  target: string;
  index: number;
  /** Bumped when the board first comes into view: every flap rolls in. */
  cycle: number;
  motion: boolean;
  onFlip?: () => void;
  /** Extra wait before rolling in, so the rows of a board go one by one. */
  lag: number;
}

const FlapSlot = memo(function FlapSlot({
  target,
  index,
  cycle,
  motion,
  onFlip,
  lag,
}: SlotProps) {
  const [state, setState] = useState({ shown: target, prev: target, step: 0 });
  const shown = useRef(target);
  const rolledIn = useRef(0);
  const flip = useRef(onFlip);
  useEffect(() => {
    flip.current = onFlip;
  }, [onFlip]);

  useEffect(() => {
    if (!motion) {
      // Reduced motion: no flips, the new character fades in.
      const timer = window.setTimeout(() => {
        if (shown.current === target) return;
        shown.current = target;
        setState((s) => ({ shown: target, prev: target, step: s.step + 1 }));
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const rollIn = cycle !== rolledIn.current;
    rolledIn.current = cycle;
    const from = rollIn ? " " : shown.current;
    // Rolling in is a short show (3 flips); real changes use the full drum.
    const path = flipPath(from, target, rollIn ? 3 : undefined);
    if (path.length === 0) return;
    const start = performance.now() + (rollIn ? lag : 0) + index * STAGGER_MS;
    let done = 0;
    return onTick((time) => {
      const due = Math.min(
        path.length,
        Math.floor((time - start) / STEP_MS) + 1,
      );
      if (due > done) {
        // Several due at once (a slow frame): jump to the latest one.
        const char = path[due - 1];
        done = due;
        shown.current = char;
        setState((s) => ({ shown: char, prev: s.shown, step: s.step + 1 }));
        flip.current?.();
        return true;
      }
      if (time - start >= path.length * STEP_MS + SETTLE_MS) {
        setState((s) => ({ ...s, prev: s.shown }));
        return false;
      }
      return true;
    });
  }, [target, cycle, index, motion, lag]);

  const { shown: now, prev, step } = state;
  const face = (char: string) => (char === " " ? " " : char);
  const flipping = motion && prev !== now;
  return (
    <span
      className={styles.slot}
      data-final={now === target || undefined}
      data-flipping={flipping || undefined}
    >
      <span className={styles.top}>
        <span className={motion ? undefined : styles.fade} key={`t${step}`}>
          {face(now)}
        </span>
      </span>
      <span className={styles.bottom}>
        <span className={motion ? undefined : styles.fade} key={`b${step}`}>
          {face(flipping ? prev : now)}
        </span>
      </span>
      {flipping ? (
        <Fragment key={step}>
          <span className={`${styles.top} ${styles.leafTop}`}>
            <span>{face(prev)}</span>
          </span>
          <span className={`${styles.bottom} ${styles.leafBottom}`}>
            <span>{face(now)}</span>
          </span>
        </Fragment>
      ) : null}
    </span>
  );
});

function words(chars: string[]) {
  const out: { start: number; chars: string[] }[] = [];
  let current: { start: number; chars: string[] } | null = null;
  chars.forEach((char, index) => {
    if (char === " ") {
      current = null;
      return;
    }
    if (!current) {
      current = { start: index, chars: [] };
      out.push(current);
    }
    current.chars.push(char);
  });
  return out;
}

/**
 * A row of split flaps. Each character really flips forward through the
 * drum, one flap at a time, top half falling and bottom half bouncing into
 * place. Screen readers get the plain text instead.
 */
export function SplitFlap({
  text,
  cycle,
  motion,
  onFlip,
  className,
  lag = 0,
}: {
  text: string;
  cycle: number;
  motion: boolean;
  onFlip?: () => void;
  className?: string;
  lag?: number;
}) {
  const chars = flapChars(text);
  return (
    <span className={`${styles.flaps} ${className ?? ""}`}>
      <span className="sr-only">{text}</span>
      {/* One group per word, so a line only breaks between words. */}
      {words(chars).map((word) => (
        <span aria-hidden="true" className={styles.word} key={word.start}>
          {word.chars.map((char, offset) => {
            const index = word.start + offset;
            return (
              <FlapSlot
                cycle={cycle}
                index={index}
                key={index}
                lag={lag}
                motion={motion}
                onFlip={onFlip}
                target={char}
              />
            );
          })}
        </span>
      ))}
    </span>
  );
}
