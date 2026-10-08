"use client";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp } from "lucide-react";
import { useCallback, useEffect, useRef } from "react";
import type { GameDirection } from "@/features/challenges/types";
import { cn } from "@/lib/cn";
import styles from "./games.module.css";
export function GamePausedOverlay() {
  return (
    <div className={styles.pauseOverlay} role="status">
      <strong>Paused</strong>
      <p>Resume to continue.</p>
    </div>
  );
}
const controls = [
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
  const timer = useRef<number | null>(null);
  const stop = useCallback(() => {
    if (timer.current !== null) clearInterval(timer.current);
    timer.current = null;
  }, []);
  useEffect(() => {
    if (disabled) stop();
    return stop;
  }, [disabled, stop]);
  return (
    <div className={styles.dPad} role="group" aria-label="Directional controls">
      {controls.map(({ direction, label, Icon, className }) => (
        <button
          key={direction}
          type="button"
          disabled={disabled}
          className={cn(styles.dPadButton, className)}
          aria-label={label}
          onPointerDown={(event) => {
            event.preventDefault();
            stop();
            event.currentTarget.setPointerCapture(event.pointerId);
            onDirection(direction);
            timer.current = window.setInterval(
              () => onDirection(direction),
              160,
            );
          }}
          onPointerUp={stop}
          onPointerCancel={stop}
          onLostPointerCapture={stop}
          onClick={(event) => {
            if (event.detail === 0) onDirection(direction);
          }}
        >
          <Icon size={20} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}
export function GameEngineLoading() {
  return (
    <div className={styles.engineLoading} role="status">
      <span aria-hidden="true" />
      <p>Loading game…</p>
    </div>
  );
}
