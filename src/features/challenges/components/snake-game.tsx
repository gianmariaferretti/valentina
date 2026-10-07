"use client";

import { Pause, Play, RotateCcw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArcadeDPad } from "@/features/challenges/components/arcade-d-pad";
import { useGameControls } from "@/features/challenges/hooks/use-game-controls";
import type { GameDirection } from "@/features/challenges/types";

const BOARD_SIZE = 360;
const GRID_SIZE = 18;
const CELL_SIZE = BOARD_SIZE / GRID_SIZE;
const SCORE_STEP = 10;

type GamePhase = "idle" | "running" | "paused" | "lost" | "won";
interface Point {
  x: number;
  y: number;
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

const lossMessages = [
  "SO CLOSE.",
  "Nice try, amor.",
  "Coupon remains safely in Gianmaria’s wallet.",
] as const;

function pointsMatch(first: Point, second: Point): boolean {
  return first.x === second.x && first.y === second.y;
}

function findFood(snake: readonly Point[]): Point {
  const openCells: Point[] = [];
  for (let y = 0; y < GRID_SIZE; y += 1) {
    for (let x = 0; x < GRID_SIZE; x += 1) {
      if (!snake.some((point) => point.x === x && point.y === y)) {
        openCells.push({ x, y });
      }
    }
  }

  return (
    openCells[Math.floor(Math.random() * openCells.length)] ?? {
      x: 0,
      y: 0,
    }
  );
}

export function SnakeGame({
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
  const snakeRef = useRef<Point[]>([
    { x: 8, y: 9 },
    { x: 7, y: 9 },
    { x: 6, y: 9 },
  ]);
  const foodRef = useRef<Point>({ x: 13, y: 9 });
  const directionRef = useRef<GameDirection>("right");
  const queuedDirectionRef = useRef<GameDirection>("right");
  const scoreRef = useRef(0);
  const phaseRef = useRef<GamePhase>("idle");
  const lastTickRef = useRef(0);
  const [phase, setPhase] = useState<GamePhase>("idle");
  const [score, setScore] = useState(0);
  const [snakeLength, setSnakeLength] = useState(3);

  const updatePhase = useCallback((nextPhase: GamePhase) => {
    phaseRef.current = nextPhase;
    setPhase(nextPhase);
  }, []);

  const draw = useCallback(() => {
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

    context.fillStyle = "#07110f";
    context.fillRect(0, 0, BOARD_SIZE, BOARD_SIZE);

    context.strokeStyle = "rgba(167, 255, 78, 0.07)";
    context.lineWidth = 1;
    for (let index = 1; index < GRID_SIZE; index += 1) {
      const position = index * CELL_SIZE;
      context.beginPath();
      context.moveTo(position, 0);
      context.lineTo(position, BOARD_SIZE);
      context.stroke();
      context.beginPath();
      context.moveTo(0, position);
      context.lineTo(BOARD_SIZE, position);
      context.stroke();
    }

    const food = foodRef.current;
    const foodX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const foodY = food.y * CELL_SIZE + CELL_SIZE / 2;
    context.shadowColor = "#ff5d8f";
    context.shadowBlur = 14;
    context.fillStyle = "#ff5d8f";
    context.beginPath();
    context.arc(foodX, foodY, CELL_SIZE * 0.27, 0, Math.PI * 2);
    context.fill();
    context.shadowBlur = 0;

    snakeRef.current.forEach((point, index) => {
      const inset = index === 0 ? 2 : 3.5;
      context.fillStyle = index === 0 ? "#dfff86" : "#9ded45";
      context.shadowColor = "#a7ff4e";
      context.shadowBlur = index === 0 ? 12 : 4;
      context.beginPath();
      context.roundRect(
        point.x * CELL_SIZE + inset,
        point.y * CELL_SIZE + inset,
        CELL_SIZE - inset * 2,
        CELL_SIZE - inset * 2,
        index === 0 ? 5 : 4,
      );
      context.fill();
    });
    context.shadowBlur = 0;

    context.strokeStyle = "rgba(167, 255, 78, 0.4)";
    context.lineWidth = 2;
    context.strokeRect(1, 1, BOARD_SIZE - 2, BOARD_SIZE - 2);
  }, []);

  const finishRun = useCallback(
    (nextPhase: "lost" | "won", finalScore: number) => {
      updatePhase(nextPhase);
      onRunEnd(finalScore, nextPhase === "won");
    },
    [onRunEnd, updatePhase],
  );

  const tick = useCallback(() => {
    directionRef.current = queuedDirectionRef.current;
    const vector = vectors[directionRef.current];
    const snake = snakeRef.current;
    const head = {
      x: snake[0].x + vector.x,
      y: snake[0].y + vector.y,
    };

    const hitBoundary =
      head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE;
    const ateFood = pointsMatch(head, foodRef.current);
    const occupiedTrail = ateFood ? snake : snake.slice(0, -1);
    const hitTrail = occupiedTrail.some((point) => pointsMatch(point, head));
    if (hitBoundary || hitTrail) {
      finishRun("lost", scoreRef.current);
      return;
    }

    const nextSnake = [head, ...snake];
    if (ateFood) {
      const nextScore = scoreRef.current + SCORE_STEP;
      scoreRef.current = nextScore;
      setScore(nextScore);
      setSnakeLength(nextSnake.length);
      onScoreChange(nextScore);
      foodRef.current = findFood(nextSnake);

      if (nextScore >= requiredScore) {
        snakeRef.current = nextSnake;
        finishRun("won", nextScore);
        return;
      }
    } else {
      nextSnake.pop();
    }

    snakeRef.current = nextSnake;
  }, [finishRun, onScoreChange, requiredScore]);

  useEffect(() => {
    let animationFrame = 0;

    function animate(timestamp: number) {
      if (phaseRef.current === "running") {
        const interval = Math.max(58, 128 - scoreRef.current * 0.08);
        if (timestamp - lastTickRef.current >= interval) {
          lastTickRef.current = timestamp;
          tick();
        }
      }
      draw();
      animationFrame = window.requestAnimationFrame(animate);
    }

    animationFrame = window.requestAnimationFrame(animate);
    return () => window.cancelAnimationFrame(animationFrame);
  }, [draw, tick]);

  const changeDirection = useCallback((direction: GameDirection) => {
    if (direction === opposites[directionRef.current]) return;
    queuedDirectionRef.current = direction;
  }, []);

  const touchControls = useGameControls(changeDirection, phase === "running");

  const startGame = useCallback(() => {
    snakeRef.current = [
      { x: 8, y: 9 },
      { x: 7, y: 9 },
      { x: 6, y: 9 },
    ];
    foodRef.current = { x: 13, y: 9 };
    directionRef.current = "right";
    queuedDirectionRef.current = "right";
    scoreRef.current = 0;
    lastTickRef.current = performance.now();
    setScore(0);
    setSnakeLength(3);
    onScoreChange(0);
    updatePhase("running");
  }, [onScoreChange, updatePhase]);

  function togglePause() {
    if (phase === "running") updatePhase("paused");
    else if (phase === "paused") {
      lastTickRef.current = performance.now();
      updatePhase("running");
    }
  }

  const lossMessage = lossMessages[(attempts + score / SCORE_STEP) % 3];

  return (
    <div className="arcade-game-panel" data-accent="acid">
      <div className="mb-4 flex items-center justify-between gap-4 text-[0.58rem] font-bold tracking-[0.16em] text-white/50 uppercase">
        <span>Signal length · {snakeLength}</span>
        <span>{phase}</span>
      </div>

      <div
        className="relative mx-auto aspect-square w-full max-w-[32rem] touch-none overflow-hidden rounded-xl border border-[#a7ff4e]/35 bg-[#07110f] shadow-[0_0_55px_rgba(167,255,78,0.08)]"
        onTouchEnd={touchControls.onTouchEnd}
        onTouchStart={touchControls.onTouchStart}
      >
        <canvas
          aria-label="Snake game board"
          className="block size-full"
          ref={canvasRef}
          role="img"
          tabIndex={0}
        />

        {phase !== "running" && phase !== "paused" ? (
          <div className="absolute inset-0 grid place-items-center bg-[#07110f]/82 p-6 text-center backdrop-blur-[2px]">
            <div className="max-w-sm">
              {phase === "won" ? (
                <>
                  <p className="arcade-pixel text-[#a7ff4e]">IMPOSSIBLE.</p>
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
                  <p className="arcade-pixel text-[#a7ff4e]">SERPENT READY</p>
                  <p className="mt-4 text-sm leading-6 text-white/55">
                    Arrow keys, WASD, swipe or use the controls below.
                  </p>
                </>
              )}
              <button
                className="mt-7 min-h-12 rounded-full bg-[#a7ff4e] px-7 text-[0.65rem] font-black tracking-[0.14em] text-[#07110f] uppercase"
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
          <div className="absolute inset-0 grid place-items-center bg-[#07110f]/78 backdrop-blur-sm">
            <p className="arcade-pixel text-[#a7ff4e]">PAUSED</p>
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
