"use client";
import { Flag, CircleX } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ARCADE } from "@/data/arcade-config";
import {
  ArcadeResult,
  ArcadeStats,
} from "@/features/games/components/arcade-primitives";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import { formatGameTime } from "@/features/games/lib/arcade-random";
import {
  actMine,
  createMineState,
  generateMineBoard,
  MINE_CELLS,
  tickMineClock,
} from "@/features/games/lib/classic-minefield";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";
import styles from "./classic-arcade.module.css";
export function RelationshipMinefieldGame(props: GameEngineProps) {
  const { onFinish, seed, paused } = props;
  const [snapshot, setSnapshot] = useState(createMineState),
    [flagMode, setFlagMode] = useState(false),
    [fit, setFit] = useState(false),
    [generating, setGenerating] = useState(false),
    [result, setResult] = useState<GameRunResult | null>(null);
  const model = useRef({
    ...snapshot,
    revealed: new Set(snapshot.revealed),
    flags: new Set(snapshot.flags),
  });
  const grid = useRef<HTMLDivElement>(null),
    firstAt = useRef<number | null>(null),
    finished = useRef(false),
    transcript = useRef<number[]>([]);
  const press = useRef<{
      timer: number;
      x: number;
      y: number;
      fired: boolean;
    } | null>(null),
    generationTimer = useRef<number | null>(null);
  const sound = useGameSound(props.soundEnabled);
  const publish = useCallback(() => {
    const state = model.current;
    setSnapshot({
      ...state,
      revealed: new Set(state.revealed),
      flags: new Set(state.flags),
    });
    if (finished.current || (state.status !== "won" && state.status !== "lost"))
      return;
    finished.current = true;
    const safe = state.revealed.size - (state.detonated !== null ? 1 : 0);
    const next: GameRunResult = {
      score: safe,
      progress:
        state.status === "won"
          ? 100
          : Math.min(99, Math.floor((safe / 201) * 100)),
      ending: state.status === "won" ? "field-cleared" : "mine-detonated",
      durationMs: state.elapsedMs,
      evidence: { seed: seed, inputs: transcript.current },
    };
    setResult(next);
    onFinish(next);
    sound(state.status === "won" ? "victory" : "wrong");
  }, [onFinish, seed, sound]);
  useEffect(() => {
    if (snapshot.status !== "playing") return;
    const timer = window.setInterval(() => {
      const state = model.current;
      if (state.status === "playing" && firstAt.current !== null) {
        tickMineClock(state, firstAt.current, performance.now());
        publish();
      }
    }, 250);
    return () => clearInterval(timer);
  }, [publish, snapshot.status]);
  useEffect(
    () => () => {
      if (press.current) clearTimeout(press.current.timer);
      if (generationTimer.current !== null)
        clearTimeout(generationTimer.current);
    },
    [],
  );
  const action = useCallback(
    (index: number, kind: number) => {
      const state = model.current;
      if (paused || finished.current || generating) return;
      if (!state.board && kind !== 0) return;
      if (!state.board) {
        setGenerating(true);
        generationTimer.current = window.setTimeout(() => {
          state.board = generateMineBoard(seed, index);
          state.status = "playing";
          firstAt.current = performance.now();
          transcript.current.push(index * 3);
          actMine(state, index, 0);
          setGenerating(false);
          publish();
        }, 0);
        return;
      }
      tickMineClock(state, firstAt.current!, performance.now());
      transcript.current.push(index * 3 + kind);
      actMine(state, index, kind);
      sound(kind === 1 ? "move" : "collect");
      publish();
    },
    [paused, generating, seed, sound, publish],
  );
  const cancelPress = () => {
    if (press.current) clearTimeout(press.current.timer);
  };
  return (
    <section className={styles.stage}>
      <ArcadeStats
        items={[
          { label: "Time", value: formatGameTime(snapshot.elapsedMs) },
          { label: "Flags", value: snapshot.flags.size },
          {
            label: "Mines remaining",
            value: ARCADE.mines.count - snapshot.flags.size,
          },
        ]}
      />
      <div className={styles.canvasWrap}>
        <div
          className={styles.mineViewport}
          aria-label="Minefield; pan inside the board to explore magnified cells"
        >
          <div
            className={styles.mineGrid}
            data-fit={fit}
            ref={grid}
            role="group"
            aria-label="16 by 16 minefield"
            onKeyDown={(event) => {
              const cell =
                event.target instanceof HTMLButtonElement
                  ? Number(event.target.dataset.cell)
                  : -1;
              if (cell < 0) return;
              const delta: Record<string, number> = {
                ArrowUp: -16,
                ArrowDown: 16,
                ArrowLeft: -1,
                ArrowRight: 1,
              };
              if (event.key in delta) {
                event.preventDefault();
                const next = Math.max(
                  0,
                  Math.min(255, cell + delta[event.key]),
                );
                grid
                  .current!.querySelector<HTMLButtonElement>(
                    `[data-cell="${next}"]`,
                  )
                  ?.focus();
              }
              if (event.key.toLowerCase() === "f") {
                event.preventDefault();
                action(cell, 1);
              }
            }}
          >
            {Array.from({ length: MINE_CELLS }, (_, index) => {
              const revealed = snapshot.revealed.has(index),
                flagged = snapshot.flags.has(index),
                mine = snapshot.detonated === index,
                count = snapshot.board?.counts[index] ?? 0;
              return (
                <button
                  key={index}
                  type="button"
                  className={styles.mineCell}
                  data-cell={index}
                  data-revealed={revealed}
                  data-count={revealed ? count : undefined}
                  data-mine={mine}
                  disabled={Boolean(result) || paused || generating}
                  aria-label={`Row ${Math.floor(index / 16) + 1}, column ${(index % 16) + 1}: ${mine ? "detonated mine" : revealed ? (count === 0 ? "empty" : `${count} adjacent mines`) : flagged ? "flagged" : "covered"}`}
                  onClick={() => {
                    if (press.current?.fired) {
                      press.current = null;
                      return;
                    }
                    action(index, flagMode ? 1 : revealed ? 2 : 0);
                  }}
                  onContextMenu={(event) => {
                    event.preventDefault();
                    if (press.current?.fired) return;
                    action(index, 1);
                  }}
                  onPointerDown={(event) => {
                    if (event.pointerType !== "touch" || result || generating)
                      return;
                    cancelPress();
                    const info = {
                      x: event.clientX,
                      y: event.clientY,
                      fired: false,
                      timer: 0,
                    };
                    info.timer = window.setTimeout(() => {
                      info.fired = true;
                      action(index, 1);
                    }, 450);
                    press.current = info;
                  }}
                  onPointerMove={(event) => {
                    if (
                      press.current &&
                      Math.hypot(
                        event.clientX - press.current.x,
                        event.clientY - press.current.y,
                      ) > 8
                    ) {
                      cancelPress();
                      press.current.fired = true;
                    }
                  }}
                  onPointerUp={cancelPress}
                  onPointerCancel={() => {
                    cancelPress();
                    press.current = null;
                  }}
                >
                  {mine ? (
                    <CircleX aria-hidden="true" />
                  ) : flagged ? (
                    <Flag aria-hidden="true" />
                  ) : revealed && count > 0 ? (
                    count
                  ) : null}
                </button>
              );
            })}
          </div>
        </div>
        {result ? (
          <ArcadeResult
            result={result}
            title={snapshot.status === "won" ? "CASE SURVIVED" : "GAME OVER"}
            onRestart={props.onRestart}
            details={[
              { label: "Time", value: formatGameTime(snapshot.elapsedMs) },
              { label: "Safe cells", value: `${result.score} / 201` },
            ]}
          />
        ) : null}
      </div>
      <div className={styles.controls}>
        <button
          aria-pressed={flagMode}
          type="button"
          onClick={() => setFlagMode((value) => !value)}
        >
          Flag mode {flagMode ? "ON" : "OFF"}
        </button>
        <button
          aria-pressed={fit}
          type="button"
          onClick={() => setFit((value) => !value)}
        >
          {fit ? "Magnify cells" : "Fit board"}
        </button>
      </div>
      <p className={styles.caption} role="status">
        {generating
          ? "Checking a safe opening…"
          : snapshot.board
            ? snapshot.board.verified
              ? "This board was verified solvable by logical deductions."
              : "Safe opening verified. This board may require guesses."
            : "First reveal starts the timer. Pan the board; long-press or use Flag mode."}
      </p>
    </section>
  );
}
