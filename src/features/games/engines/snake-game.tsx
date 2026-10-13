"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ARCADE } from "@/data/arcade-config";
import { useGameControls } from "@/features/challenges/hooks/use-game-controls";
import type { GameDirection } from "@/features/challenges/types";
import {
  ArcadeResult,
  ArcadeStats,
} from "@/features/games/components/arcade-primitives";
import {
  GameDPad,
  GamePausedOverlay,
} from "@/features/games/components/game-primitives";
import { useArcadeCanvas } from "@/features/games/hooks/use-arcade-canvas";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import {
  createSnakeState,
  queueSnakeDirection,
  snakeStatus,
  snakeStepMs,
  snakeObstacles,
  stepSnake,
} from "@/features/games/lib/snake-domain";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";
import styles from "./classic-arcade.module.css";
const directions: Record<GameDirection, number> = {
  up: 0,
  right: 1,
  down: 2,
  left: 3,
};
export function SnakeGame(props: GameEngineProps) {
  const [initialModel] = useState(() => createSnakeState(props.seed));
  const model = useRef(initialModel);
  const [score, setScore] = useState(0),
    [started, setStarted] = useState(false),
    [result, setResult] = useState<GameRunResult | null>(null);
  const transcript = useRef<number[]>([]),
    finished = useRef(false),
    sound = useGameSound(props.soundEnabled);
  const control = (direction: GameDirection) => {
    if (!props.paused && !finished.current)
      queueSnakeDirection(model.current, directions[direction]);
  };
  const touch = useGameControls(control, !props.paused && !result);
  const visual = useRef<{ previous: number[]; movedAt: number } | null>(null);
  const canvas = useArcadeCanvas(
    360,
    360,
    (context) => {
      const state = model.current;
      context.fillStyle = "#f7f2e9";
      context.fillRect(0, 0, 360, 360);
      context.strokeStyle = "#e8dfd2";
      context.lineWidth = 0.6;
      const size = ARCADE.snake.size,
        cellSize = 360 / size;
      for (let i = 0; i <= size; i++) {
        context.beginPath();
        context.moveTo(i * cellSize, 0);
        context.lineTo(i * cellSize, 360);
        context.moveTo(0, i * cellSize);
        context.lineTo(360, i * cellSize);
        context.stroke();
      }
      const moving = new Set(state.movingObstacles.map((o) => o.position));
      for (const cell of snakeObstacles(state)) {
        context.fillStyle = moving.has(cell) ? "#b57a49" : "#b8afa1";
        context.fillRect(
          (cell % size) * cellSize + 2,
          Math.floor(cell / size) * cellSize + 2,
          cellSize - 4,
          cellSize - 4,
        );
      }
      context.fillStyle = "#ad6c46";
      context.beginPath();
      context.arc(
        (state.food % size) * cellSize + cellSize / 2,
        Math.floor(state.food / size) * cellSize + cellSize / 2,
        4,
        0,
        Math.PI * 2,
      );
      context.fill();
      for (let i = state.body.length - 1; i >= 0; i--) {
        const cell = state.body[i];
        const from = visual.current?.previous[i] ?? cell;
        const fraction =
          props.reduceMotion || !visual.current
            ? 1
            : Math.min(
                1,
                (performance.now() - visual.current.movedAt) /
                  snakeStepMs(state.score),
              );
        const x = (from % size) + ((cell % size) - (from % size)) * fraction;
        const y =
          Math.floor(from / size) +
          (Math.floor(cell / size) - Math.floor(from / size)) * fraction;
        context.fillStyle = i === 0 ? "#743441" : "#463938";
        context.beginPath();
        context.roundRect(
          x * cellSize + 1,
          y * cellSize + 1,
          cellSize - 2,
          cellSize - 2,
          i === 0 ? 4 : 2,
        );
        context.fill();
        if (i === 0) {
          context.fillStyle = "#fff8ef";
          context.fillRect(x * cellSize + 5, y * cellSize + 5, 3, 3);
        }
      }
    },
    started && !props.paused && !result,
  );
  const tick = useEffectEvent((delta: number) => {
    const state = model.current;
    if (props.paused || state.status !== "playing") return 0;
    let remaining = delta;
    while (
      remaining >= snakeStepMs(state.score) &&
      state.status === "playing"
    ) {
      remaining -= snakeStepMs(state.score);
      transcript.current.push(state.queued);
      const before = state.score;
      visual.current = {
        previous: [...state.body],
        movedAt: performance.now(),
      };
      stepSnake(state);
      if (state.score > before) {
        setScore(state.score);
        sound("collect");
      }
    }
    const status = snakeStatus(state);
    if (!finished.current && (status === "lost" || status === "won")) {
      finished.current = true;
      const next: GameRunResult = {
        score: state.score * 10,
        progress:
          status === "won"
            ? 100
            : Math.min(
                99,
                Math.floor((state.score / ARCADE.snake.target) * 100),
              ),
        ending: status === "won" ? "snake-complete" : "snake-collision",
        durationMs: state.elapsedMs,
        evidence: { seed: props.seed, inputs: transcript.current },
      };
      setResult(next);
      props.onFinish(next);
      sound(status === "won" ? "victory" : "wrong");
    }
    return remaining;
  });
  useEffect(() => {
    if (!started || props.paused || result) return;
    let frame = 0,
      last = 0,
      accumulated = 0;
    const loop = (now: number) => {
      if (last) accumulated += Math.min(250, now - last);
      last = now;
      accumulated = tick(accumulated);
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [props.paused, result, started]);
  return (
    <section className={styles.stage}>
      <ArcadeStats
        items={[
          { label: "Score", value: score },
          { label: "Best", value: Math.floor((props.bestScore ?? 0) / 10) },
          { label: "Target", value: ARCADE.snake.target },
        ]}
      />
      <div className={styles.canvasWrap} {...touch}>
        <canvas
          className={styles.snakeCanvas}
          ref={canvas}
          role="img"
          aria-label="Snake playfield. Arrow keys, WASD, swipe or direction buttons control the snake."
        />
        {props.paused && !result ? <GamePausedOverlay /> : null}
        {result ? (
          <ArcadeResult
            result={result}
            title={
              result.ending === "snake-complete"
                ? "EXCEPTIONAL SURVIVAL"
                : "GAME OVER"
            }
            onRestart={props.onRestart}
            details={[
              { label: "Score", value: score },
              { label: "Target", value: ARCADE.snake.target },
            ]}
          />
        ) : null}
      </div>
      {!started ? (
        <div className={styles.controls}>
          <button
            type="button"
            disabled={props.paused}
            onClick={() => {
              model.current.status = "playing";
              setStarted(true);
            }}
          >
            START
          </button>
        </div>
      ) : null}
      <GameDPad
        disabled={props.paused || Boolean(result)}
        onDirection={control}
      />
      <p className={styles.caption}>
        Arrow keys / WASD · swipe · no reverse turns
      </p>
    </section>
  );
}
