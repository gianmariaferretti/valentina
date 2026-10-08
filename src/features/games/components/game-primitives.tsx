"use client";

import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useId, useRef } from "react";

import type { GameDirection } from "@/features/challenges/types";
import type { GameRunResult } from "@/features/games/types";
import { cn } from "@/lib/cn";

import styles from "./games.module.css";

export function GameHud({
  details,
  progress,
  score,
}: {
  readonly details?: readonly { label: string; value: string | number }[];
  readonly progress: number;
  readonly score: number;
}) {
  return (
    <div className={styles.gameHud}>
      <dl>
        <div>
          <dt>Score</dt>
          <dd>{score.toLocaleString("en-GB")}</dd>
        </div>
        {(details ?? []).map((detail) => (
          <div key={detail.label}>
            <dt>{detail.label}</dt>
            <dd>{detail.value}</dd>
          </div>
        ))}
      </dl>
      <div className={styles.progressTrack}>
        <span style={{ width: `${Math.max(0, Math.min(100, progress))}%` }} />
      </div>
    </div>
  );
}

export function GamePausedOverlay() {
  return (
    <div className={styles.pauseOverlay} role="status">
      <span>File temporarily sealed</span>
      <strong>Paused</strong>
      <p>Resume when the real world has stopped interrupting.</p>
    </div>
  );
}

export function GameOutcome({
  result,
  onRestart,
  successTitle,
  failureTitle,
  successCopy,
  failureCopy,
}: {
  readonly result: GameRunResult;
  readonly onRestart: () => void;
  readonly successTitle: string;
  readonly failureTitle: string;
  readonly successCopy: string;
  readonly failureCopy: string;
}) {
  const won = result.progress >= 100;
  const titleId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    headingRef.current?.scrollIntoView({
      block: "center",
      behavior: "instant",
    });
  }, []);

  return (
    <div
      className={styles.outcomeOverlay}
      data-outcome={won ? "won" : "lost"}
      aria-labelledby={titleId}
      role="region"
    >
      <div>
        <span className={styles.outcomeMark}>
          {won ? <Trophy aria-hidden="true" /> : <X aria-hidden="true" />}
        </span>
        <p>{won ? "Case closed" : "Case remains open"}</p>
        <h2 id={titleId} ref={headingRef} tabIndex={-1}>
          {won ? successTitle : failureTitle}
        </h2>
        <span>{won ? successCopy : failureCopy}</span>
        <dl>
          <div>
            <dt>Score</dt>
            <dd>{result.score.toLocaleString("en-GB")}</dd>
          </div>
          <div>
            <dt>Ending</dt>
            <dd>{result.ending.replaceAll("-", " ")}</dd>
          </div>
        </dl>
        <button onClick={onRestart} type="button">
          <RotateCcw aria-hidden="true" size={16} />
          Replay case
        </button>
      </div>
    </div>
  );
}

const dPadControls = [
  {
    direction: "up",
    label: "Move up",
    Icon: ArrowUp,
    className: styles.dPadUp,
  },
  {
    direction: "left",
    label: "Move left",
    Icon: ArrowLeft,
    className: styles.dPadLeft,
  },
  {
    direction: "down",
    label: "Move down",
    Icon: ArrowDown,
    className: styles.dPadDown,
  },
  {
    direction: "right",
    label: "Move right",
    Icon: ArrowRight,
    className: styles.dPadRight,
  },
] as const;

export function GameDPad({
  disabled,
  onDirection,
}: {
  readonly disabled?: boolean;
  readonly onDirection: (direction: GameDirection) => void;
}) {
  return (
    <div aria-label="Directional controls" className={styles.dPad} role="group">
      {dPadControls.map(({ direction, label, Icon, className }) => (
        <button
          aria-label={label}
          className={cn(styles.dPadButton, className)}
          disabled={disabled}
          key={direction}
          onClick={() => onDirection(direction)}
          type="button"
        >
          <Icon aria-hidden="true" size={20} />
        </button>
      ))}
    </div>
  );
}

export function GameEngineLoading() {
  return (
    <div className={styles.engineLoading} role="status">
      <span aria-hidden="true" />
      <p>Opening sealed game file…</p>
    </div>
  );
}
