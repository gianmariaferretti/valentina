"use client";

import { ArrowLeft, ArrowRight, Shield } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  GameHud,
  GameOutcome,
  GamePausedOverlay,
} from "@/features/games/components/game-primitives";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";

import styles from "../components/games.module.css";

const WIDTH = 640;
const HEIGHT = 420;
const BRICK_ROWS = 4;
const BRICK_COLUMNS = 6;
const BRICK_SCORE = 25;

interface Ball {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
}

interface Brick {
  x: number;
  y: number;
  width: number;
  height: number;
  alive: boolean;
  row: number;
}

function createBricks(): Brick[] {
  const gap = 10;
  const margin = 34;
  const width =
    (WIDTH - margin * 2 - gap * (BRICK_COLUMNS - 1)) / BRICK_COLUMNS;
  return Array.from({ length: BRICK_ROWS * BRICK_COLUMNS }, (_, index) => {
    const row = Math.floor(index / BRICK_COLUMNS);
    const column = index % BRICK_COLUMNS;
    return {
      x: margin + column * (width + gap),
      y: 58 + row * 42,
      width,
      height: 30,
      alive: true,
      row,
    };
  });
}

function createBall(speed: number): Ball {
  return {
    x: WIDTH / 2,
    y: HEIGHT - 74,
    vx: speed * 0.68,
    vy: -speed,
    radius: 8,
  };
}

export function BreakDefencesGame({
  difficulty,
  paused,
  reduceMotion,
  soundEnabled,
  onFinish,
  onRestart,
  onProgressChange,
  onScoreChange,
}: GameEngineProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const ballRef = useRef<Ball>(createBall(240));
  const paddleXRef = useRef(WIDTH / 2 - 55);
  const moveDirectionRef = useRef(0);
  const bricksRef = useRef<Brick[]>(createBricks());
  const scoreRef = useRef(0);
  const livesRef = useRef(3);
  const remainingRef = useRef(BRICK_ROWS * BRICK_COLUMNS);
  const initializedRef = useRef(false);
  const finishedRef = useRef(false);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [remaining, setRemaining] = useState(BRICK_ROWS * BRICK_COLUMNS);
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

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    if (canvas.width !== WIDTH * ratio || canvas.height !== HEIGHT * ratio) {
      canvas.width = WIDTH * ratio;
      canvas.height = HEIGHT * ratio;
    }
    const context = canvas.getContext("2d");
    if (!context) return;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    context.clearRect(0, 0, WIDTH, HEIGHT);
    context.fillStyle = "#f5efe6";
    context.fillRect(0, 0, WIDTH, HEIGHT);

    context.strokeStyle = "rgba(36, 30, 28, 0.07)";
    context.lineWidth = 1;
    for (let y = 20; y < HEIGHT; y += 24) {
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(WIDTH, y);
      context.stroke();
    }

    bricksRef.current.forEach((brick, index) => {
      if (!brick.alive) return;
      const colors = ["#592c2c", "#783b37", "#93463e", "#b46258"];
      context.fillStyle = colors[brick.row];
      context.beginPath();
      context.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
      context.fill();
      context.fillStyle = "rgba(251,248,243,.62)";
      context.font = "700 8px Avenir Next, sans-serif";
      context.textAlign = "center";
      context.fillText(
        `DEFENCE ${String(index + 1).padStart(2, "0")}`,
        brick.x + brick.width / 2,
        brick.y + 19,
      );
    });

    const paddleX = paddleXRef.current;
    context.fillStyle = "#241e1c";
    context.beginPath();
    context.roundRect(paddleX, HEIGHT - 34, 110, 12, 6);
    context.fill();
    context.fillStyle = "#d6b596";
    context.fillRect(paddleX + 34, HEIGHT - 36, 42, 3);

    const ball = ballRef.current;
    context.save();
    if (!reduceMotion) {
      context.shadowColor = "rgba(147,70,62,.48)";
      context.shadowBlur = 14;
    }
    context.fillStyle = "#93463e";
    context.beginPath();
    context.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
    context.fill();
    context.restore();

    context.strokeStyle = "rgba(36,30,28,.28)";
    context.strokeRect(0.5, 0.5, WIDTH - 1, HEIGHT - 1);
  }, [reduceMotion]);

  useEffect(() => {
    draw();
    if (paused || result) return;
    const speed =
      difficulty === "story" ? 220 : difficulty === "daring" ? 310 : 260;
    if (!initializedRef.current) {
      ballRef.current = createBall(speed);
      initializedRef.current = true;
    }
    let frame = 0;
    let lastTime = performance.now();

    function animate(timestamp: number) {
      const delta = Math.min((timestamp - lastTime) / 1_000, 0.035);
      lastTime = timestamp;
      paddleXRef.current = Math.max(
        0,
        Math.min(
          WIDTH - 110,
          paddleXRef.current + moveDirectionRef.current * 390 * delta,
        ),
      );

      const ball = ballRef.current;
      ball.x += ball.vx * delta;
      ball.y += ball.vy * delta;
      if (ball.x - ball.radius <= 0 || ball.x + ball.radius >= WIDTH) {
        ball.vx *= -1;
        ball.x = Math.max(ball.radius, Math.min(WIDTH - ball.radius, ball.x));
      }
      if (ball.y - ball.radius <= 0) {
        ball.vy = Math.abs(ball.vy);
        ball.y = ball.radius;
      }

      const paddleY = HEIGHT - 34;
      if (
        ball.vy > 0 &&
        ball.y + ball.radius >= paddleY &&
        ball.y - ball.radius <= paddleY + 12 &&
        ball.x >= paddleXRef.current &&
        ball.x <= paddleXRef.current + 110
      ) {
        const offset = (ball.x - (paddleXRef.current + 55)) / 55;
        ball.vy = -Math.abs(ball.vy);
        ball.vx = speed * offset;
        ball.y = paddleY - ball.radius;
        playSound("move");
      }

      for (const brick of bricksRef.current) {
        if (
          !brick.alive ||
          ball.x + ball.radius < brick.x ||
          ball.x - ball.radius > brick.x + brick.width ||
          ball.y + ball.radius < brick.y ||
          ball.y - ball.radius > brick.y + brick.height
        ) {
          continue;
        }
        brick.alive = false;
        ball.vy *= -1;
        const nextScore = scoreRef.current + BRICK_SCORE;
        const nextRemaining = bricksRef.current.filter(
          (item) => item.alive,
        ).length;
        const nextProgress = Math.round(
          ((BRICK_ROWS * BRICK_COLUMNS - nextRemaining) /
            (BRICK_ROWS * BRICK_COLUMNS)) *
            100,
        );
        scoreRef.current = nextScore;
        remainingRef.current = nextRemaining;
        setScore(nextScore);
        setRemaining(nextRemaining);
        onScoreChange(nextScore);
        onProgressChange(nextProgress);
        playSound("collect");
        if (nextRemaining === 0) {
          finish({
            score: nextScore,
            progress: 100,
            ending: "defences-breached",
          });
        }
        break;
      }

      if (ball.y - ball.radius > HEIGHT) {
        const nextLives = livesRef.current - 1;
        livesRef.current = nextLives;
        setLives(nextLives);
        playSound("wrong");
        if (nextLives <= 0) {
          const destroyed = BRICK_ROWS * BRICK_COLUMNS - remainingRef.current;
          finish({
            score: scoreRef.current,
            progress: Math.min(
              99,
              Math.round((destroyed / (BRICK_ROWS * BRICK_COLUMNS)) * 100),
            ),
            ending: "file-resealed",
          });
        } else {
          ballRef.current = createBall(speed);
          paddleXRef.current = WIDTH / 2 - 55;
        }
      }

      draw();
      if (!finishedRef.current) frame = requestAnimationFrame(animate);
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [
    difficulty,
    draw,
    finish,
    onProgressChange,
    onScoreChange,
    paused,
    playSound,
    result,
  ]);

  useEffect(() => {
    if (paused || result) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "ArrowLeft" || event.key.toLowerCase() === "a") {
        event.preventDefault();
        moveDirectionRef.current = -1;
      } else if (
        event.key === "ArrowRight" ||
        event.key.toLowerCase() === "d"
      ) {
        event.preventDefault();
        moveDirectionRef.current = 1;
      }
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (
        ["arrowleft", "arrowright", "a", "d"].includes(event.key.toLowerCase())
      ) {
        moveDirectionRef.current = 0;
      }
    }
    window.addEventListener("keydown", handleKeyDown, { passive: false });
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      moveDirectionRef.current = 0;
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [paused, result]);

  function setPointerPaddle(clientX: number) {
    const canvas = canvasRef.current;
    if (!canvas || paused || result) return;
    const rect = canvas.getBoundingClientRect();
    const boardX = ((clientX - rect.left) / rect.width) * WIDTH;
    paddleXRef.current = Math.max(0, Math.min(WIDTH - 110, boardX - 55));
  }

  return (
    <section className={styles.defenceGame} aria-label="Break My Defences game">
      <GameHud
        details={[
          { label: "Defences", value: remaining },
          { label: "Lives", value: lives },
        ]}
        progress={result?.progress ?? ((24 - remaining) / 24) * 100}
        score={score}
      />
      <div className={styles.canvasStage}>
        <canvas
          aria-describedby="defence-help defence-status"
          aria-label="Break My Defences game board"
          className={styles.defenceCanvas}
          onPointerDown={(event) => setPointerPaddle(event.clientX)}
          onPointerMove={(event) => {
            if (event.buttons > 0 || event.pointerType === "touch") {
              setPointerPaddle(event.clientX);
            }
          }}
          ref={canvasRef}
          role="img"
          tabIndex={0}
        />
        {paused ? <GamePausedOverlay /> : null}
        {result ? (
          <GameOutcome
            failureCopy="The file resealed itself. This is inconvenient, not definitive."
            failureTitle="Defences held."
            onRestart={onRestart}
            result={result}
            successCopy="Every layer is down. Emotional access remains subject to terms and conditions."
            successTitle="Access granted."
          />
        ) : null}
      </div>
      <div
        className={styles.paddleControls}
        role="group"
        aria-label="Paddle controls"
      >
        {[
          { label: "Move paddle left", direction: -1, Icon: ArrowLeft },
          { label: "Move paddle right", direction: 1, Icon: ArrowRight },
        ].map(({ label, direction, Icon }) => (
          <button
            aria-label={label}
            disabled={paused || Boolean(result)}
            key={label}
            onPointerCancel={() => (moveDirectionRef.current = 0)}
            onPointerDown={(event) => {
              event.preventDefault();
              moveDirectionRef.current = direction;
            }}
            onPointerLeave={() => (moveDirectionRef.current = 0)}
            onPointerUp={() => (moveDirectionRef.current = 0)}
            type="button"
          >
            <Icon aria-hidden="true" />
          </button>
        ))}
        <span>
          <Shield aria-hidden="true" /> Drag the tray or hold a direction
        </span>
      </div>
      <p className="sr-only" id="defence-help">
        Move the paddle with left and right arrow keys, A and D, pointer drag,
        or the on-screen buttons. Clear all document blocks.
      </p>
      <p aria-live="polite" className="sr-only" id="defence-status">
        Score {score}. {remaining} defences remain. {lives} lives.
      </p>
    </section>
  );
}
