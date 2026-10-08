"use client";
import { useEffect, useEffectEvent, useRef, useState } from "react";
import { ARCADE } from "@/data/arcade-config";
import {
  createDefenceState,
  defenceResult,
  stepDefence,
} from "@/features/games/break-defences/arcade-domain";
import { drawDefence } from "@/features/games/break-defences/arcade-renderer";
import {
  ArcadeResult,
  ArcadeStats,
} from "@/features/games/components/arcade-primitives";
import { GamePausedOverlay } from "@/features/games/components/game-primitives";
import { useArcadeCanvas } from "@/features/games/hooks/use-arcade-canvas";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";
import styles from "./classic-arcade.module.css";
export function BreakDefencesGame(props: GameEngineProps) {
  const [state] = useState(createDefenceState),
    [hud, setHud] = useState({
      score: 0,
      lives: 3,
      remaining: 80,
      serve: true,
    });
  const [result, setResult] = useState<GameRunResult | null>(null);
  const input = useRef({ target: 210, direction: 0, launch: false }),
    transcript = useRef<number[]>([]),
    ended = useRef(false);
  const sound = useGameSound(props.soundEnabled),
    lastSound = useRef(0);
  const canvas = useArcadeCanvas(
    ARCADE.breakout.width,
    ARCADE.breakout.height,
    (ctx) => drawDefence(ctx, state, props.reduceMotion),
    !props.paused && !result,
  );
  const update = useEffectEvent((delta: number) => {
    if (props.paused || ended.current) return;
    const target = input.current.direction
      ? state.paddleX + input.current.direction * 380 * ARCADE.breakout.step
      : input.current.target;
    const encoded =
      Math.round(target * 100) + (input.current.launch ? 100000 : 0);
    const shouldRecord = state.mode === "playing" || input.current.launch;
    stepDefence(
      state,
      Math.round(target * 100) / 100,
      input.current.launch,
      props.reduceMotion,
    );
    input.current.launch = false;
    if (shouldRecord) transcript.current.push(encoded);
    if (state.impact && state.elapsed - lastSound.current > 0.075) {
      sound("collect");
      lastSound.current = state.elapsed;
    }
    if (
      delta ||
      (state.mode === "serve") !== hud.serve ||
      state.mode === "lost" ||
      state.mode === "victory"
    )
      setHud({
        score: state.score,
        lives: state.lives,
        remaining: state.bricks.filter((b) => b.hp).length,
        serve: state.mode === "serve",
      });
    if (state.mode === "lost" || state.mode === "victory") {
      ended.current = true;
      const next = {
        ...defenceResult(state),
        evidence: { seed: props.seed, inputs: transcript.current },
      };
      setResult(next);
      props.onScoreChange(next.score);
      props.onProgressChange(next.progress);
      props.onFinish(next);
      sound(state.mode === "victory" ? "victory" : "wrong");
    }
  });
  useEffect(() => {
    if (props.paused || result) return;
    let frame = 0,
      last = 0,
      accumulated = 0,
      hudAt = 0;
    const loop = (now: number) => {
      if (last) accumulated += Math.min(0.05, (now - last) / 1000);
      last = now;
      while (accumulated >= ARCADE.breakout.step) {
        update(now - hudAt > 100 ? 1 : 0);
        if (now - hudAt > 100) hudAt = now;
        accumulated -= ARCADE.breakout.step;
      }
      frame = requestAnimationFrame(loop);
    };
    frame = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(frame);
  }, [props.paused, result]);
  useEffect(() => {
    if (props.paused || result) return;
    const keydown = (event: KeyboardEvent) => {
      if (
        event.ctrlKey ||
        event.metaKey ||
        event.altKey ||
        (event.target instanceof HTMLElement &&
          event.target.matches("input,textarea,select,[contenteditable=true]"))
      )
        return;
      const key = event.key.toLowerCase();
      if (["arrowleft", "a", "arrowright", "d"].includes(key)) {
        event.preventDefault();
        input.current.direction = ["a", "arrowleft"].includes(key) ? -1 : 1;
      }
      if (
        (key === " " || key === "enter") &&
        !(event.target instanceof HTMLButtonElement)
      ) {
        event.preventDefault();
        input.current.launch = true;
      }
    };
    const release = () => {
      input.current.direction = 0;
      input.current.target = state.paddleX;
    };
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", release);
    window.addEventListener("blur", release);
    return () => {
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", release);
      window.removeEventListener("blur", release);
      release();
    };
  }, [props.paused, result, state]);
  const steer = (clientX: number) => {
    if (props.paused || result) return;
    const rect = canvas.current!.getBoundingClientRect();
    input.current.target = Math.max(
      34,
      Math.min(
        386,
        ((clientX - rect.left) / rect.width) * ARCADE.breakout.width,
      ),
    );
    input.current.direction = 0;
  };
  return (
    <section className={styles.stage}>
      <ArcadeStats
        items={[
          { label: "Score", value: hud.score },
          { label: "Lives", value: hud.lives },
          { label: "Bricks", value: hud.remaining },
        ]}
      />
      <div className={styles.canvasWrap}>
        <canvas
          ref={canvas}
          className={styles.breakCanvas}
          aria-label="Breakout playfield. Move with left and right arrows or drag the paddle."
          role="img"
          onPointerDown={(event) => {
            if (props.paused || result) return;
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            steer(event.clientX);
          }}
          onPointerMove={(event) => {
            if (
              event.pointerType === "mouse" ||
              event.currentTarget.hasPointerCapture(event.pointerId)
            )
              steer(event.clientX);
          }}
        />
        {props.paused && !result ? <GamePausedOverlay /> : null}
        {result ? (
          <ArcadeResult
            result={result}
            title={result.progress === 100 ? "LEVEL CLEARED" : "GAME OVER"}
            onRestart={props.onRestart}
            details={[
              { label: "Score", value: result.score },
              { label: "Bricks cleared", value: 80 - hud.remaining },
            ]}
          />
        ) : null}
      </div>
      <div className={styles.controls}>
        <button
          aria-label="Move paddle left"
          disabled={props.paused || Boolean(result)}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            input.current.direction = -1;
          }}
          onPointerUp={() => {
            input.current.direction = 0;
            input.current.target = state.paddleX;
          }}
          onLostPointerCapture={() => {
            input.current.direction = 0;
            input.current.target = state.paddleX;
          }}
          onClick={() => {
            input.current.target = Math.max(34, state.paddleX - 34);
          }}
          type="button"
        >
          ←
        </button>
        <button
          disabled={props.paused || Boolean(result) || !hud.serve}
          onClick={() => {
            input.current.launch = true;
          }}
          type="button"
        >
          {hud.serve ? "LAUNCH" : "IN PLAY"}
        </button>
        <button
          aria-label="Move paddle right"
          disabled={props.paused || Boolean(result)}
          onPointerDown={(event) => {
            event.preventDefault();
            event.currentTarget.setPointerCapture(event.pointerId);
            input.current.direction = 1;
          }}
          onPointerUp={() => {
            input.current.direction = 0;
            input.current.target = state.paddleX;
          }}
          onLostPointerCapture={() => {
            input.current.direction = 0;
            input.current.target = state.paddleX;
          }}
          onClick={() => {
            input.current.target = Math.min(386, state.paddleX + 34);
          }}
          type="button"
        >
          →
        </button>
      </div>
      <p className={styles.caption}>
        80 bricks · 3 lives · geometric marks show remaining hits
      </p>
    </section>
  );
}
