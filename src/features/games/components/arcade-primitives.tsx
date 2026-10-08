"use client";
import { useEffect, useId, useRef } from "react";
import type { GameRunResult } from "@/features/games/types";
import styles from "../engines/classic-arcade.module.css";
export interface ArcadeStat {
  readonly label: string;
  readonly value: string | number;
}
export function ArcadeStats({
  items,
  urgent = false,
}: {
  readonly items: readonly ArcadeStat[];
  readonly urgent?: boolean;
}) {
  return (
    <dl className={styles.stats} data-urgent={urgent}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>{item.label}</dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
export function ArcadeResult({
  result,
  title,
  details,
  onRestart,
}: {
  readonly result: GameRunResult;
  readonly title: string;
  readonly details: readonly ArcadeStat[];
  readonly onRestart: () => void;
}) {
  const ref = useRef<HTMLHeadingElement>(null),
    id = useId();
  useEffect(() => {
    ref.current?.focus({ preventScroll: true });
  }, []);
  return (
    <section
      className={styles.result}
      aria-labelledby={id}
      data-won={result.progress === 100}
    >
      <p>V&amp;G / RESULT</p>
      <h2 id={id} ref={ref} tabIndex={-1}>
        {title}
      </h2>
      <ArcadeStats items={details} />
      <button onClick={onRestart} type="button">
        {result.progress === 100 ? "PLAY AGAIN" : "TRY AGAIN"}
      </button>
      <small>Results and rewards appear below after a confirmed save.</small>
    </section>
  );
}
