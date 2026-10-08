"use client";
import { LogOut, X } from "lucide-react";
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
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import { formatGameTime } from "@/features/games/lib/arcade-random";
import {
  createMazeState,
  mazeHazardPositions,
  mazeStatus,
  stepMaze,
} from "@/features/games/lib/maze-domain";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";
import styles from "./classic-arcade.module.css";
const commands: Record<GameDirection, number> = {
    up: 1,
    right: 2,
    down: 3,
    left: 4,
  },
  keyLabels = ["I", "II", "III"];
export function MazeGame(props: GameEngineProps) {
  const [snapshot, setSnapshot] = useState(() => createMazeState(props.seed)),
    [started, setStarted] = useState(false),
    [result, setResult] = useState<GameRunResult | null>(null);
  const model = useRef({ ...snapshot, visited: new Set(snapshot.visited) });
  const pending = useRef(0),
    transcript = useRef<number[]>([]),
    finished = useRef(false),
    sound = useGameSound(props.soundEnabled);
  const control = (direction: GameDirection) => {
    if (!props.paused && !finished.current)
      pending.current = commands[direction];
  };
  const touch = useGameControls(control, !props.paused && !result);
  const tick = useEffectEvent(() => {
    const state = model.current;
    if (props.paused || state.status !== "playing") return;
    transcript.current.push(pending.current);
    const before = state.keys;
    stepMaze(state, pending.current);
    pending.current = 0;
    if (before !== state.keys) sound("collect");
    setSnapshot({ ...state, visited: new Set(state.visited) });
    const status = mazeStatus(state);
    if (!finished.current && (status === "lost" || status === "won")) {
      finished.current = true;
      const next: GameRunResult = {
        score:
          status === "won"
            ? 1800
            : Math.round((state.visited.size / state.board.floor.size) * 1000),
        progress:
          status === "won"
            ? 100
            : Math.min(
                99,
                Math.floor((state.visited.size / state.board.floor.size) * 100),
              ),
        ending: status === "won" ? "maze-escaped" : "maze-lost",
        durationMs: state.ticks * ARCADE.maze.stepMs,
        evidence: { seed: props.seed, inputs: transcript.current },
      };
      setResult(next);
      props.onFinish(next);
      sound(status === "won" ? "victory" : "wrong");
    }
  });
  useEffect(() => {
    if (!started || props.paused || result) return;
    let frame = 0,
      last = 0,
      accumulated = 0;
    const loop = (now: number) => {
      if (last) accumulated += Math.min(250, now - last);
      last = now;
      while (accumulated >= ARCADE.maze.stepMs) {
        tick();
        accumulated -= ARCADE.maze.stepMs;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [props.paused, result, started]);
  const playerX = snapshot.position % 33,
    playerY = Math.floor(snapshot.position / 33),
    originX = Math.max(0, Math.min(18, playerX - 7)),
    originY = Math.max(0, Math.min(18, playerY - 7)),
    hazards = new Set(mazeHazardPositions(snapshot));
  const visible = new Set<number>();
  for (let y = playerY - 4; y <= playerY + 4; y++)
    for (let x = playerX - 4; x <= playerX + 4; x++)
      if (
        x >= 0 &&
        y >= 0 &&
        x < 33 &&
        y < 33 &&
        Math.hypot(x - playerX, y - playerY) <= 4.4
      )
        visible.add(y * 33 + x);
  return (
    <section className={styles.stage}>
      <ArcadeStats
        urgent={snapshot.ticks * ARCADE.maze.stepMs > 420_000}
        items={[
          {
            label: "Time",
            value: formatGameTime(
              ARCADE.maze.limitMs - snapshot.ticks * ARCADE.maze.stepMs,
            ),
          },
          {
            label: "Keys",
            value: keyLabels
              .map((label, i) => (snapshot.keys & (1 << i) ? label : "—"))
              .join(" · "),
          },
          { label: "Grid", value: "33 × 33" },
        ]}
      />
      <div className={styles.canvasWrap} {...touch}>
        <div
          className={styles.mazeGrid}
          role="img"
          aria-label={`Maze. Position column ${playerX + 1}, row ${playerY + 1}. Keys ${keyLabels.filter((_, i) => snapshot.keys & (1 << i)).join(", ") || "none"}. Use arrows or direction controls.`}
        >
          {Array.from({ length: 225 }, (_, i) => {
            const cell =
                (originY + Math.floor(i / 15)) * 33 + originX + (i % 15),
              lit = visible.has(cell),
              known = lit || snapshot.visited.has(cell),
              key = snapshot.board.keys.indexOf(cell),
              door = snapshot.board.doors.indexOf(cell);
            let kind = !known
              ? "hidden"
              : snapshot.board.floor.has(cell)
                ? "floor"
                : "wall";
            if (known && key >= 0 && !(snapshot.keys & (1 << key)))
              kind = "key";
            if (known && door >= 0 && !(snapshot.keys & (1 << door)))
              kind = "door";
            if (known && cell === snapshot.board.exit) kind = "exit";
            if (lit && hazards.has(cell)) kind = "hazard";
            if (cell === snapshot.position) kind = "player";
            return (
              <span
                className={styles.mazeCell}
                key={i}
                data-kind={kind}
                data-visible={lit}
                aria-hidden="true"
              >
                {kind === "key" ? (
                  keyLabels[key]
                ) : kind === "door" ? (
                  keyLabels[door]
                ) : kind === "exit" ? (
                  <LogOut />
                ) : kind === "hazard" ? (
                  <X />
                ) : null}
              </span>
            );
          })}
          <span
            className={styles.mazePlayer}
            aria-hidden="true"
            style={{
              transform: `translate(${(playerX - originX) * 100}%, ${(playerY - originY) * 100}%)`,
            }}
          >
            ●
          </span>
        </div>
        {props.paused && !result ? <GamePausedOverlay /> : null}
        {result ? (
          <ArcadeResult
            result={result}
            title={snapshot.status === "won" ? "EXIT FOUND" : "GAME OVER"}
            onRestart={props.onRestart}
            details={[
              {
                label: "Time",
                value: formatGameTime(snapshot.ticks * ARCADE.maze.stepMs),
              },
              {
                label: "Keys",
                value: keyLabels.filter((_, i) => snapshot.keys & (1 << i))
                  .length,
              },
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
        Keys open matching numbered gates · × marks a moving hazard · exit
        requires all three keys
      </p>
    </section>
  );
}
