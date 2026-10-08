"use client";

import { Flag, HeartCrack, ShieldCheck } from "lucide-react";
import {
  type KeyboardEvent,
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  GameHud,
  GameOutcome,
  GamePausedOverlay,
} from "@/features/games/components/game-primitives";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import {
  MINEFIELD_SIZE as SIZE,
  minefieldNeighbours as neighbours,
  revealSafeArea,
} from "@/features/games/lib/minefield-domain";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";

import styles from "../components/games.module.css";

const seededMineOrder = [10, 45, 27, 52, 6, 38, 59, 17, 33, 2, 49, 21] as const;

export function RelationshipMinefieldGame({
  difficulty,
  paused,
  soundEnabled,
  onFinish,
  onRestart,
  onProgressChange,
  onScoreChange,
}: GameEngineProps) {
  const mineCount =
    difficulty === "story" ? 8 : difficulty === "daring" ? 12 : 10;
  const mines = useMemo(
    () => new Set<number>(seededMineOrder.slice(0, mineCount)),
    [mineCount],
  );
  const totalSafe = SIZE * SIZE - mines.size;
  const [mode, setMode] = useState<"reveal" | "flag">("reveal");
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const [flags, setFlags] = useState<Set<number>>(new Set());
  const [exploded, setExploded] = useState<Set<number>>(new Set());
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<GameRunResult | null>(null);
  const finishedRef = useRef(false);
  const playSound = useGameSound(soundEnabled);

  const finish = useCallback(
    (nextResult: GameRunResult) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      setResult(nextResult);
      onScoreChange(nextResult.score);
      onProgressChange(nextResult.progress);
      playSound(nextResult.progress === 100 ? "victory" : "wrong");
      onFinish(nextResult);
    },
    [onFinish, onProgressChange, onScoreChange, playSound],
  );

  const toggleFlag = useCallback(
    (index: number) => {
      if (paused || result || revealed.has(index) || exploded.has(index))
        return;
      const next = new Set(flags);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      setFlags(next);
      playSound("move");
    },
    [exploded, flags, paused, playSound, result, revealed],
  );

  const revealCell = useCallback(
    (index: number) => {
      if (
        paused ||
        result ||
        flags.has(index) ||
        revealed.has(index) ||
        exploded.has(index)
      )
        return;
      if (mines.has(index)) {
        const nextLives = lives - 1;
        setLives(nextLives);
        setExploded((current) => new Set(current).add(index));
        playSound("wrong");
        if (nextLives <= 0) {
          const progress = Math.min(
            99,
            Math.round((revealed.size / totalSafe) * 100),
          );
          finish({ score, progress, ending: "avoidable-argument" });
        }
        return;
      }

      const nextRevealed = revealSafeArea(index, mines, revealed, flags);
      const newlyRevealed = nextRevealed.size - revealed.size;
      const nextScore = score + newlyRevealed * 10;
      const nextProgress = Math.round((nextRevealed.size / totalSafe) * 100);
      setRevealed(nextRevealed);
      setScore(nextScore);
      onScoreChange(nextScore);
      onProgressChange(nextProgress);
      playSound("collect");
      if (nextRevealed.size === totalSafe) {
        finish({
          score: nextScore,
          progress: 100,
          ending: "field-cleared",
          discoveredSecrets: lives === 3 ? ["minefield-perfect-route"] : [],
        });
      }
    },
    [
      finish,
      exploded,
      flags,
      lives,
      mines,
      onProgressChange,
      onScoreChange,
      paused,
      playSound,
      result,
      revealed,
      score,
      totalSafe,
    ],
  );

  function activateCell(index: number) {
    if (mode === "flag") toggleFlag(index);
    else revealCell(index);
  }

  function handleCellKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const offsets: Record<string, number | undefined> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -SIZE,
      ArrowDown: SIZE,
    };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    const nextIndex = index + offset;
    if (
      nextIndex < 0 ||
      nextIndex >= SIZE * SIZE ||
      (event.key === "ArrowLeft" && index % SIZE === 0) ||
      (event.key === "ArrowRight" && index % SIZE === SIZE - 1)
    ) {
      return;
    }
    event.preventDefault();
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll("button");
    buttons?.[nextIndex]?.focus();
  }

  return (
    <section
      className={styles.minefieldGame}
      aria-label="Relationship Minefield game"
    >
      <GameHud
        details={[
          { label: "Safe", value: `${revealed.size}/${totalSafe}` },
          { label: "Flags", value: `${flags.size}/${mines.size}` },
          { label: "Lives", value: lives },
        ]}
        progress={result?.progress ?? (revealed.size / totalSafe) * 100}
        score={score}
      />
      <div className={styles.minefieldDocument}>
        <header>
          <div>
            <ShieldCheck aria-hidden="true" />
            <p>Relationship hazard assessment</p>
          </div>
          <div
            className={styles.minefieldModes}
            role="group"
            aria-label="Cell action"
          >
            <button
              aria-pressed={mode === "reveal"}
              onClick={() => setMode("reveal")}
              type="button"
            >
              Reveal
            </button>
            <button
              aria-pressed={mode === "flag"}
              onClick={() => setMode("flag")}
              type="button"
            >
              Flag
            </button>
          </div>
        </header>
        <div
          className={styles.minefieldGrid}
          role="group"
          aria-label="8 by 8 minefield"
        >
          {Array.from({ length: SIZE * SIZE }, (_, index) => {
            const isRevealed = revealed.has(index);
            const isMine = mines.has(index);
            const isExploded = exploded.has(index);
            const adjacentMines = neighbours(index).filter((item) =>
              mines.has(item),
            ).length;
            const isFlagged = flags.has(index);
            return (
              <button
                aria-label={
                  isExploded
                    ? "Triggered red flag"
                    : isRevealed
                      ? adjacentMines > 0
                        ? `${adjacentMines} adjacent red flags`
                        : "Clear square"
                      : isFlagged
                        ? "Flagged square"
                        : `Hidden square ${index + 1}`
                }
                data-exploded={isExploded}
                data-revealed={isRevealed}
                disabled={paused || Boolean(result)}
                key={index}
                onClick={() => activateCell(index)}
                onContextMenu={(event) => {
                  event.preventDefault();
                  toggleFlag(index);
                }}
                onKeyDown={(event) => handleCellKeyDown(event, index)}
                type="button"
              >
                {isExploded && isMine ? (
                  <HeartCrack aria-hidden="true" />
                ) : isFlagged ? (
                  <Flag aria-hidden="true" fill="currentColor" />
                ) : isRevealed && adjacentMines > 0 ? (
                  adjacentMines
                ) : null}
              </button>
            );
          })}
        </div>
        <p className={styles.minefieldNote}>
          Right-click to flag on desktop · use the mode switch on touch screens
        </p>

        {paused ? <GamePausedOverlay /> : null}
        {result ? (
          <GameOutcome
            failureCopy="Three avoidable arguments were located by stepping directly on them."
            failureTitle="Hazard triggered."
            onRestart={onRestart}
            result={result}
            successCopy="Every red flag was handled with logic, restraint and very little collateral damage."
            successTitle="Field cleared."
          />
        ) : null}
      </div>
    </section>
  );
}
