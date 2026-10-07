"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArcadeDPad } from "@/features/challenges/components/arcade-d-pad";
import { useGameControls } from "@/features/challenges/hooks/use-game-controls";
import type { GameDirection } from "@/features/challenges/types";

const BOARD_SIZE = 420;
const MAZE_SIZE = 21;
const TILE_SIZE = BOARD_SIZE / MAZE_SIZE;
const SCORE_STEP = 10;
const PLAYER_INTERVAL = 104;
const ENEMY_INTERVAL = 188;

type GamePhase = "idle" | "running" | "paused" | "lost" | "won";

interface Point {
  x: number;
  y: number;
}

interface Enemy {
  position: Point;
  readonly start: Point;
  direction: GameDirection;
  readonly color: string;
  readonly shape: "triangle" | "diamond" | "square";
}

const vectors: Record<GameDirection, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const opposites: Record<GameDirection, GameDirection> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

const directions = Object.keys(vectors) as GameDirection[];
const playerStart = { x: 1, y: 1 } as const;
const enemyBlueprints = [
  {
    start: { x: 19, y: 19 },
    direction: "left",
    color: "#ff5d8f",
    shape: "triangle",
  },
  {
    start: { x: 19, y: 1 },
    direction: "down",
    color: "#ffc857",
    shape: "diamond",
  },
  {
    start: { x: 1, y: 19 },
    direction: "up",
    color: "#a7ff4e",
    shape: "square",
  },
] as const satisfies readonly {
  start: Point;
  direction: GameDirection;
  color: string;
  shape: Enemy["shape"];
}[];

const lossMessages = [
  "SO CLOSE.",
  "Nice try, amor.",
  "Coupon remains safely in Gianmaria’s wallet.",
] as const;

function pointKey(point: Point): string {
  return `${point.x}:${point.y}`;
}

function pointsMatch(first: Point, second: Point): boolean {
  return first.x === second.x && first.y === second.y;
}

function seededRandom(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function createMaze(): readonly (readonly number[])[] {
  const grid = Array.from({ length: MAZE_SIZE }, () =>
    Array.from({ length: MAZE_SIZE }, () => 1),
  );
  const random = seededRandom(4102025);
  const stack: Point[] = [{ ...playerStart }];
  grid[playerStart.y][playerStart.x] = 0;

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const candidates = [
      { x: current.x, y: current.y - 2 },
      { x: current.x + 2, y: current.y },
      { x: current.x, y: current.y + 2 },
      { x: current.x - 2, y: current.y },
    ].filter(
      (candidate) =>
        candidate.x > 0 &&
        candidate.x < MAZE_SIZE - 1 &&
        candidate.y > 0 &&
        candidate.y < MAZE_SIZE - 1 &&
        grid[candidate.y][candidate.x] === 1,
    );

    if (candidates.length === 0) {
      stack.pop();
      continue;
    }

    const next = candidates[Math.floor(random() * candidates.length)];
    grid[(current.y + next.y) / 2][(current.x + next.x) / 2] = 0;
    grid[next.y][next.x] = 0;
    stack.push(next);
  }

  return grid;
}

const maze = createMaze();

function createCollectibles(): Set<string> {
  const excluded = new Set([
    pointKey(playerStart),
    ...enemyBlueprints.map((enemy) => pointKey(enemy.start)),
  ]);
  const collectibles = new Set<string>();

  maze.forEach((row, y) => {
    row.forEach((tile, x) => {
      const key = pointKey({ x, y });
      if (tile === 0 && !excluded.has(key)) collectibles.add(key);
    });
  });

  return collectibles;
}

function createEnemies(): Enemy[] {
  return enemyBlueprints.map((enemy) => ({
    ...enemy,
    position: { ...enemy.start },
    start: { ...enemy.start },
  }));
}

function canEnter(point: Point): boolean {
  return (
    point.x >= 0 &&
    point.x < MAZE_SIZE &&
    point.y >= 0 &&
    point.y < MAZE_SIZE &&
    maze[point.y][point.x] === 0
  );
}

function movePoint(point: Point, direction: GameDirection): Point {
  const vector = vectors[direction];
  return { x: point.x + vector.x, y: point.y + vector.y };
}

export function MazeGame({
  attempts,
  onRunEnd,
  onScoreChange,
  requiredScore,
}: {
  attempts: number;
  onRunEnd: (score: number, achieved: boolean) => void;
  onScoreChange: (score: number) => void;
  requiredScore: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const playerRef = useRef<Point>({ ...playerStart });
  const enemiesRef = useRef<Enemy[]>(createEnemies());
  const collectiblesRef = useRef(createCollectibles());
  const directionRef = useRef<GameDirection>("right");
  const queuedDirectionRef = useRef<GameDirection>("right");
  const phaseRef = useRef<GamePhase>("idle");
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const invulnerableUntilRef = useRef(0);
  const lastFrameRef = useRef(0);
  const playerAccumulatorRef = useRef(0);
  const enemyAccumulatorRef = useRef(0);
  const enemyTickRef = useRef(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [fragmentsRemaining, setFragmentsRemaining] = useState(
    createCollectibles().size,
  );

  const updatePhase = useCallback((nextPhase: GamePhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const finishRun = useCallback(
    (nextPhase: "lost" | "won", finalScore: number) => {
      updatePhase(nextPhase);
      onRunEnd(finalScore, nextPhase === "won");
    },
    [onRunEnd, updatePhase],
  );

  const resetPositions = useCallback(() => {
    playerRef.current = { ...playerStart };
    enemiesRef.current = createEnemies();
    directionRef.current = "right";
    queuedDirectionRef.current = "right";
  }, []);

  const takeHit = useCallback(
    (timestamp: number) => {
      if (timestamp < invulnerableUntilRef.current) return;

      const nextLives = livesRef.current - 1;
      livesRef.current = nextLives;
      setLives(nextLives);

      if (nextLives <= 0) {
        finishRun("lost", scoreRef.current);
        return;
      }

      resetPositions();
      invulnerableUntilRef.current = timestamp + 1_250;
    },
    [finishRun, resetPositions],
  );

  const checkCollision = useCallback(
    (timestamp: number) => {
      if (
        enemiesRef.current.some((enemy) =>
          pointsMatch(enemy.position, playerRef.current),
        )
      ) {
        takeHit(timestamp);
      }
    },
    [takeHit],
  );

  const movePlayer = useCallback(
    (timestamp: number) => {
      const queuedPosition = movePoint(
        playerRef.current,
        queuedDirectionRef.current,
      );
      if (canEnter(queuedPosition)) {
        directionRef.current = queuedDirectionRef.current;
      }

      const nextPosition = movePoint(playerRef.current, directionRef.current);
      if (canEnter(nextPosition)) playerRef.current = nextPosition;

      const collectibleKey = pointKey(playerRef.current);
      if (collectiblesRef.current.delete(collectibleKey)) {
        const nextScore = scoreRef.current + SCORE_STEP;
        scoreRef.current = nextScore;
        setScore(nextScore);
        setFragmentsRemaining(collectiblesRef.current.size);
        onScoreChange(nextScore);

        if (nextScore >= requiredScore) {
          finishRun("won", nextScore);
          return;
        }
      }

      checkCollision(timestamp);
    },
    [checkCollision, finishRun, onScoreChange, requiredScore],
  );

  const moveEnemies = useCallback(
    (timestamp: number) => {
      enemyTickRef.current += 1;
      enemiesRef.current.forEach((enemy, enemyIndex) => {
        const availableDirections = directions.filter((direction) =>
          canEnter(movePoint(enemy.position, direction)),
        );
        const forwardOptions = availableDirections.filter(
          (direction) => direction !== opposites[enemy.direction],
        );
        const options =
          forwardOptions.length > 0 ? forwardOptions : availableDirections;

        options.sort((first, second) => {
          const firstPosition = movePoint(enemy.position, first);
          const secondPosition = movePoint(enemy.position, second);
          const firstDistance =
            Math.abs(firstPosition.x - playerRef.current.x) +
            Math.abs(firstPosition.y - playerRef.current.y);
          const secondDistance =
            Math.abs(secondPosition.x - playerRef.current.x) +
            Math.abs(secondPosition.y - playerRef.current.y);
          return firstDistance - secondDistance;
        });

        const patrolOffset = (enemyTickRef.current + enemyIndex * 3) % 7;
        const nextDirection =
          options[enemyIndex === 2 && patrolOffset === 0 ? 1 : 0] ?? options[0];
        if (!nextDirection) return;

        enemy.direction = nextDirection;
        enemy.position = movePoint(enemy.position, nextDirection);
      });

      checkCollision(timestamp);
    },
    [checkCollision],
  );

  const draw = useCallback((timestamp: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    const renderSize = BOARD_SIZE * pixelRatio;
    if (canvas.width !== renderSize || canvas.height !== renderSize) {
      canvas.width = renderSize;
      canvas.height = renderSize;
    }

    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    context.fillStyle = "#061018";
    context.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    maze.forEach((row, y) => {
      row.forEach((tile, x) => {
        if (tile === 0) return;
        context.fillStyle = "#0d2735";
        context.fillRect(
          x * TILE_SIZE + 1,
          y * TILE_SIZE + 1,
          TILE_SIZE - 2,
          TILE_SIZE - 2,
        );
        context.strokeStyle = "rgba(57, 207, 255, 0.26)";
        context.lineWidth = 1;
        context.strokeRect(
          x * TILE_SIZE + 2,
          y * TILE_SIZE + 2,
          TILE_SIZE - 4,
          TILE_SIZE - 4,
        );
      });
    });

    context.fillStyle = "rgba(191, 235, 255, 0.78)";
    collectiblesRef.current.forEach((key) => {
      const [x, y] = key.split(":").map(Number);
      context.fillRect(
        x * TILE_SIZE + TILE_SIZE / 2 - 1.5,
        y * TILE_SIZE + TILE_SIZE / 2 - 1.5,
        3,
        3,
      );
    });

    const player = playerRef.current;
    const playerX = player.x * TILE_SIZE + TILE_SIZE / 2;
    const playerY = player.y * TILE_SIZE + TILE_SIZE / 2;
    const visible =
      timestamp >= invulnerableUntilRef.current ||
      Math.floor(timestamp / 90) % 2 === 0;
    if (visible) {
      context.save();
      context.translate(playerX, playerY);
      context.rotate(Math.PI / 4);
      context.shadowColor = "#39cfff";
      context.shadowBlur = 13;
      context.fillStyle = "#9be9ff";
      context.fillRect(-6.5, -6.5, 13, 13);
      context.shadowBlur = 0;
      context.fillStyle = "#ff5d8f";
      context.fillRect(-2.5, -2.5, 5, 5);
      context.restore();
    }

    enemiesRef.current.forEach((enemy) => {
      const x = enemy.position.x * TILE_SIZE + TILE_SIZE / 2;
      const y = enemy.position.y * TILE_SIZE + TILE_SIZE / 2;
      context.save();
      context.translate(x, y);
      context.shadowColor = enemy.color;
      context.shadowBlur = 10;
      context.fillStyle = enemy.color;
      context.beginPath();
      if (enemy.shape === "triangle") {
        context.moveTo(0, -7);
        context.lineTo(7, 6);
        context.lineTo(-7, 6);
        context.closePath();
      } else if (enemy.shape === "diamond") {
        context.moveTo(0, -7);
        context.lineTo(7, 0);
        context.lineTo(0, 7);
        context.lineTo(-7, 0);
        context.closePath();
      } else {
        context.rect(-6, -6, 12, 12);
      }
      context.fill();
      context.restore();
    });

    context.strokeStyle = "rgba(57, 207, 255, 0.45)";
    context.lineWidth = 2;
    context.strokeRect(1, 1, BOARD_SIZE - 2, BOARD_SIZE - 2);
  }, []);

  useEffect(() => {
    let animationFrame = 0;

    function animate(timestamp: number) {
      const elapsed = Math.min(timestamp - lastFrameRef.current, 100);
      lastFrameRef.current = timestamp;

      if (phaseRef.current === "running") {
        playerAccumulatorRef.current += elapsed;
        enemyAccumulatorRef.current += elapsed;

        if (playerAccumulatorRef.current >= PLAYER_INTERVAL) {
          playerAccumulatorRef.current -= PLAYER_INTERVAL;
          movePlayer(timestamp);
        }
        if (
          phaseRef.current === "running" &&
          enemyAccumulatorRef.current >= ENEMY_INTERVAL
        ) {
          enemyAccumulatorRef.current -= ENEMY_INTERVAL;
          moveEnemies(timestamp);
        }
      }

      draw(timestamp);
      animationFrame = window.requestAnimationFrame(animate);
    }

    lastFrameRef.current = performance.now();
    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [draw, moveEnemies, movePlayer]);

  const changeDirection = useCallback((direction: GameDirection) => {
    queuedDirectionRef.current = direction;
  }, []);

  const touchControls = useGameControls(changeDirection, phase === "running");

  const startGame = useCallback(() => {
    const collectibles = createCollectibles();
    collectiblesRef.current = collectibles;
    scoreRef.current = 0;
    livesRef.current = 3;
    invulnerableUntilRef.current = 0;
    enemyTickRef.current = 0;
    playerAccumulatorRef.current = 0;
    enemyAccumulatorRef.current = 0;
    lastFrameRef.current = performance.now();
    resetPositions();
    setScore(0);
    setLives(3);
    setFragmentsRemaining(collectibles.size);
    onScoreChange(0);
    updatePhase("running");
  }, [onScoreChange, resetPositions, updatePhase]);

  function togglePause() {
    if (phase === "running") updatePhase("paused");
    else if (phase === "paused") {
      lastFrameRef.current = performance.now();
      updatePhase("running");
    }
  }

  const lossMessage = lossMessages[(attempts + score / SCORE_STEP) % 3];

  return (
    <div className="arcade-game-panel" data-accent="cyan">
      <div className="mb-4 flex items-center justify-between gap-4 text-[0.58rem] font-bold tracking-[0.16em] text-white/50 uppercase">
        <span>Fragments left · {fragmentsRemaining}</span>
        <span>Lives · {lives}</span>
      </div>

      <div
        className="relative mx-auto aspect-square w-full max-w-[35rem] touch-none overflow-hidden rounded-xl border border-[#39cfff]/35 bg-[#061018] shadow-[0_0_55px_rgba(57,207,255,0.08)]"
        onTouchEnd={touchControls.onTouchEnd}
        onTouchStart={touchControls.onTouchStart}
      >
        <canvas
          aria-label="Midnight Circuit maze game board"
          className="block size-full"
          ref={canvasRef}
          role="img"
          tabIndex={0}
        />

        {phase !== "running" && phase !== "paused" ? (
          <div className="absolute inset-0 grid place-items-center bg-[#061018]/84 p-6 text-center backdrop-blur-[2px]">
            <div className="max-w-sm">
              {phase === "won" ? (
                <>
                  <p className="arcade-pixel text-[#39cfff]">IMPOSSIBLE.</p>
                  <h2 className="mt-3 text-3xl font-black tracking-[-0.03em] text-white uppercase sm:text-4xl">
                    You actually did it.
                  </h2>
                  <p className="mt-5 text-sm font-bold tracking-[0.18em] text-[#ffb4cb] uppercase">
                    Coupon unlocked
                  </p>
                </>
              ) : phase === "lost" ? (
                <>
                  <p className="arcade-pixel text-[#ff5d8f]">{lossMessage}</p>
                  <p className="mt-4 text-sm text-white/55">
                    Final score · {score}
                  </p>
                </>
              ) : (
                <>
                  <p className="arcade-pixel text-[#39cfff]">CIRCUIT READY</p>
                  <p className="mt-4 text-sm leading-6 text-white/55">
                    Guide the V&amp;G spark. The roaming shapes are glitches,
                    not friends.
                  </p>
                </>
              )}
              <button
                className="mt-7 min-h-12 rounded-full bg-[#39cfff] px-7 text-[0.65rem] font-black tracking-[0.14em] text-[#061018] uppercase"
                onClick={startGame}
                type="button"
              >
                {phase === "lost"
                  ? "Try again"
                  : phase === "won"
                    ? "Again"
                    : "Start"}
              </button>
            </div>
          </div>
        ) : null}

        {phase === "paused" ? (
          <div className="absolute inset-0 grid place-items-center bg-[#061018]/78 backdrop-blur-sm">
            <p className="arcade-pixel text-[#39cfff]">PAUSED</p>
          </div>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <button
          className="arcade-action"
          disabled={phase !== "running" && phase !== "paused"}
          onClick={togglePause}
          type="button"
        >
          {phase === "paused" ? <Play size={15} /> : <Pause size={15} />}
          {phase === "paused" ? "Resume" : "Pause"}
        </button>
        <button className="arcade-action" onClick={startGame} type="button">
          <RotateCcw aria-hidden="true" size={15} />
          Restart
        </button>
      </div>

      <div className="mt-6 lg:hidden">
        <ArcadeDPad
          disabled={phase !== "running"}
          onDirection={changeDirection}
        />
      </div>
    </div>
  );
}
