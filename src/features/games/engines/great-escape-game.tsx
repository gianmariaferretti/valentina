"use client";

import { KeyRound, ScanLine, Stamp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { useGameControls } from "@/features/challenges/hooks/use-game-controls";
import type { GameDirection } from "@/features/challenges/types";
import {
  GameDPad,
  GameHud,
  GameOutcome,
  GamePausedOverlay,
} from "@/features/games/components/game-primitives";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";

import styles from "../components/games.module.css";

const archiveGrid = [
  "#########",
  "#S..#..P#",
  "#.#.#.#.#",
  "#.#...#.#",
  "#.###.#.#",
  "#K....#.#",
  "###.#...#",
  "#P..#..E#",
  "#########",
] as const;

const lightPath = [
  "5:3",
  "5:4",
  "5:5",
  "5:6",
  "6:6",
  "7:6",
  "7:5",
  "7:4",
  "7:3",
  "7:2",
  "7:1",
  "7:2",
  "7:3",
  "7:4",
  "7:5",
  "7:6",
  "6:6",
  "5:6",
  "5:5",
  "4:5",
  "3:5",
  "2:5",
] as const;

const vectors: Record<GameDirection, { x: number; y: number }> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function cellKey(x: number, y: number) {
  return `${x}:${y}`;
}

const initialCollectibles = new Set(["7:1", "1:5", "1:7"]);
const initialPlayer = { x: 1, y: 1 } as const;

export function GreatEscapeGame({
  difficulty,
  paused,
  soundEnabled,
  onFinish,
  onRestart,
  onProgressChange,
  onScoreChange,
}: GameEngineProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<{ x: number; y: number }>(initialPlayer);
  const lightIndexRef = useRef(0);
  const collectedRef = useRef(new Set<string>());
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const [player, setPlayer] = useState<{ x: number; y: number }>(initialPlayer);
  const [lightCell, setLightCell] = useState<string>(lightPath[0]);
  const [collected, setCollected] = useState<Set<string>>(new Set());
  const [score, setScore] = useState(0);
  const [result, setResult] = useState<GameRunResult | null>(null);
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

  const move = useCallback(
    (direction: GameDirection) => {
      if (paused || finishedRef.current) return;
      const vector = vectors[direction];
      const next = {
        x: playerRef.current.x + vector.x,
        y: playerRef.current.y + vector.y,
      };
      if (archiveGrid[next.y]?.[next.x] === "#") return;

      const nextKey = cellKey(next.x, next.y);
      playerRef.current = next;
      setPlayer(next);
      playSound("move");

      if (
        initialCollectibles.has(nextKey) &&
        !collectedRef.current.has(nextKey)
      ) {
        const nextCollected = new Set(collectedRef.current).add(nextKey);
        const nextScore = scoreRef.current + 100;
        collectedRef.current = nextCollected;
        scoreRef.current = nextScore;
        setCollected(new Set(nextCollected));
        setScore(nextScore);
        onScoreChange(nextScore);
        onProgressChange(nextCollected.size * 25);
        playSound("collect");
      }

      if (nextKey === lightPath[lightIndexRef.current]) {
        finish({
          score: scoreRef.current,
          progress: collectedRef.current.size * 25,
          ending: "caught-in-the-archive",
        });
        return;
      }

      if (
        archiveGrid[next.y][next.x] === "E" &&
        collectedRef.current.size === 3
      ) {
        finish({
          score: scoreRef.current + 200,
          progress: 100,
          ending: "escaped-together",
        });
      }
    },
    [finish, onProgressChange, onScoreChange, paused, playSound],
  );

  const touchControls = useGameControls(move, !paused && !result);

  useEffect(() => {
    boardRef.current?.focus();
  }, []);

  useEffect(() => {
    if (paused || result) return;
    const intervalMs =
      difficulty === "story" ? 1_050 : difficulty === "daring" ? 570 : 760;
    const interval = window.setInterval(() => {
      lightIndexRef.current = (lightIndexRef.current + 1) % lightPath.length;
      const nextLightCell = lightPath[lightIndexRef.current];
      setLightCell(nextLightCell);
      if (nextLightCell === cellKey(playerRef.current.x, playerRef.current.y)) {
        finish({
          score: scoreRef.current,
          progress: collectedRef.current.size * 25,
          ending: "caught-in-the-archive",
        });
      }
    }, intervalMs);
    return () => window.clearInterval(interval);
  }, [difficulty, finish, paused, result]);

  return (
    <section className={styles.escapeGame} aria-label="The Great Escape game">
      <GameHud
        details={[
          { label: "Evidence", value: `${collected.size}/3` },
          { label: "Searchlight", value: paused ? "Held" : "Active" },
        ]}
        progress={result?.progress ?? collected.size * 25}
        score={result?.score ?? score}
      />

      <div className={styles.escapeLayout}>
        <div
          aria-describedby="escape-help escape-status"
          aria-label="Archive escape grid"
          className={styles.escapeBoard}
          onTouchEnd={touchControls.onTouchEnd}
          onTouchStart={touchControls.onTouchStart}
          ref={boardRef}
          role="application"
          tabIndex={0}
        >
          {archiveGrid.flatMap((row, y) =>
            [...row].map((cell, x) => {
              const key = cellKey(x, y);
              const collectible =
                initialCollectibles.has(key) && !collected.has(key);
              const isPlayer = player.x === x && player.y === y;
              return (
                <span
                  className={styles.escapeCell}
                  data-cell={
                    cell === "#" ? "wall" : cell === "E" ? "exit" : "floor"
                  }
                  data-light={lightCell === key}
                  key={key}
                >
                  {collectible ? (
                    key === "1:5" ? (
                      <KeyRound aria-hidden="true" size={14} />
                    ) : (
                      <Stamp aria-hidden="true" size={14} />
                    )
                  ) : null}
                  {cell === "E" ? (
                    <span className={styles.exitMark}>EXIT</span>
                  ) : null}
                  {lightCell === key ? (
                    <ScanLine aria-hidden="true" size={16} />
                  ) : null}
                  {isPlayer ? (
                    <span className={styles.travellers} aria-hidden="true">
                      <i>V</i>
                      <i>G</i>
                    </span>
                  ) : null}
                </span>
              );
            }),
          )}
          {paused ? <GamePausedOverlay /> : null}
          {result ? (
            <GameOutcome
              failureCopy="The searchlight found the file. Gianmaria denies operational responsibility."
              failureTitle="Archive lockdown."
              onRestart={onRestart}
              result={result}
              successCopy="Two travellers, three pieces of evidence and one improbably clean extraction."
              successTitle="You got us out."
            />
          ) : null}
        </div>

        <aside className={styles.escapeManifest}>
          <p>Extraction manifest</p>
          <ul>
            <li data-found={collected.has("7:1")}>
              <Stamp aria-hidden="true" /> Northern passport stamp
            </li>
            <li data-found={collected.has("1:5")}>
              <KeyRound aria-hidden="true" /> Brass archive key
            </li>
            <li data-found={collected.has("1:7")}>
              <Stamp aria-hidden="true" /> Southern passport stamp
            </li>
          </ul>
          <GameDPad disabled={paused || Boolean(result)} onDirection={move} />
        </aside>
      </div>

      <p className="sr-only" id="escape-help">
        Move using arrow keys, WASD, swipe gestures or the directional buttons.
        Collect two passport stamps and one key, then reach the exit while
        avoiding the moving searchlight.
      </p>
      <p aria-live="polite" className="sr-only" id="escape-status">
        Position column {player.x + 1}, row {player.y + 1}. Score {score}.
        {collected.size} of 3 objects collected.
      </p>
    </section>
  );
}
