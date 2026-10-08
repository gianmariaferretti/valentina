"use client";
import {
  Anchor,
  Bike,
  BookOpen,
  Camera,
  Coffee,
  Compass,
  Flower2,
  Gift,
  KeyRound,
  Moon,
  Mountain,
  Music,
  Plane,
  Shell,
  Sun,
  TrainFront,
  TreePine,
  Umbrella,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ARCADE } from "@/data/arcade-config";
import { arcadeMemories } from "@/data/arcade-memories";
import { getMediaAsset } from "@/data/media";
import {
  ArcadeResult,
  ArcadeStats,
} from "@/features/games/components/arcade-primitives";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import { formatGameTime } from "@/features/games/lib/arcade-random";
import {
  createMemoryState,
  flipMemory,
  tickMemory,
} from "@/features/games/lib/memory-domain";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";
import styles from "./classic-arcade.module.css";
const symbols = [
  Plane,
  TrainFront,
  Camera,
  Compass,
  KeyRound,
  Coffee,
  Moon,
  Sun,
  Mountain,
  Umbrella,
  Music,
  BookOpen,
  Anchor,
  Flower2,
  Shell,
  Bike,
  TreePine,
  Gift,
];
export function MemoriesGame(props: GameEngineProps) {
  const { onFinish, seed, paused } = props;
  const [snapshot, setSnapshot] = useState(() => createMemoryState(seed)),
    [result, setResult] = useState<GameRunResult | null>(null);
  const model = useRef({
    ...snapshot,
    open: [...snapshot.open],
    matched: new Set(snapshot.matched),
  });
  const transcript = useRef<number[]>([]),
    times = useRef<number[]>([]),
    finished = useRef(false),
    boardRef = useRef<HTMLDivElement>(null);
  const sound = useGameSound(props.soundEnabled);
  const publish = useCallback(() => {
    const state = model.current;
    setSnapshot({
      ...state,
      open: [...state.open],
      matched: new Set(state.matched),
    });
    if (finished.current || (state.status !== "WON" && state.status !== "LOST"))
      return;
    finished.current = true;
    const next: GameRunResult = {
      score: (state.matched.size / 2) * 100,
      progress:
        state.status === "WON"
          ? 100
          : Math.min(99, Math.floor((state.matched.size / 36) * 100)),
      ending: state.status === "WON" ? "archive-complete" : "archive-timed-out",
      durationMs: state.elapsedMs,
      moves: state.attempts,
      evidence: {
        seed: seed,
        inputs: transcript.current,
        times: times.current,
      },
    };
    setResult(next);
    onFinish(next);
    sound(state.status === "WON" ? "victory" : "wrong");
  }, [onFinish, seed, sound]);
  useEffect(() => {
    if (
      snapshot.status === "READY" ||
      snapshot.status === "WON" ||
      snapshot.status === "LOST"
    )
      return;
    const tick = () => {
      tickMemory(model.current, Math.floor(performance.now()));
      publish();
    };
    const timer = window.setInterval(tick, 100);
    document.addEventListener("visibilitychange", tick);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [publish, snapshot.status]);
  const select = useCallback(
    (index: number) => {
      const state = model.current;
      if (paused || finished.current) return;
      const now = Math.floor(performance.now()),
        before = state.matched.size;
      if (flipMemory(state, index, now)) {
        transcript.current.push(index);
        times.current.push(now - state.startedAt!);
        sound(state.matched.size > before ? "correct" : "move");
      }
      publish();
    },
    [paused, publish, sound],
  );
  return (
    <section className={styles.stage}>
      <ArcadeStats
        urgent={snapshot.elapsedMs > 55_000}
        items={[
          {
            label: "Time remaining",
            value: formatGameTime(ARCADE.memory.limitMs - snapshot.elapsedMs),
          },
          { label: "Pairs", value: `${snapshot.matched.size / 2} / 18` },
          { label: "Attempts", value: snapshot.attempts },
        ]}
      />
      <div
        className={styles.memoryGrid}
        ref={boardRef}
        onKeyDown={(event) => {
          const offsets: Record<string, number> = {
            ArrowRight: 1,
            ArrowLeft: -1,
            ArrowDown: 6,
            ArrowUp: -6,
          };
          const offset = offsets[event.key],
            buttons = [
              ...boardRef.current!.querySelectorAll<HTMLButtonElement>(
                "button[data-card]",
              ),
            ];
          if (
            offset === undefined ||
            !(event.target instanceof HTMLButtonElement)
          )
            return;
          event.preventDefault();
          const index = buttons.indexOf(event.target);
          let next = index + offset;
          while (next >= 0 && next < 36 && buttons[next].disabled)
            next += offset;
          if (next >= 0 && next < 36)
            buttons[next].focus({ preventScroll: true });
        }}
      >
        {snapshot.deck.map((card, index) => {
          const memoryIndex = arcadeMemories.findIndex(
              (memory) => memory.id === card.memoryId,
            ),
            memory = arcadeMemories[memoryIndex],
            Icon = symbols[memoryIndex];
          const matched = snapshot.matched.has(index),
            open = matched || snapshot.open.includes(index),
            mediaId =
              card.variant === 1
                ? (memory.matchingImage ?? memory.image)
                : memory.image;
          const media = open && mediaId ? getMediaAsset(mediaId) : null;
          return (
            <button
              key={card.instanceId}
              className={styles.memoryCard}
              type="button"
              data-card={index}
              data-open={open}
              data-matched={matched}
              disabled={paused || matched || Boolean(result)}
              aria-label={
                open
                  ? `${memory.title}${matched ? ", matched" : ", face up"}`
                  : `Face-down card ${index + 1}`
              }
              onClick={() => select(index)}
            >
              <span className={styles.cardInner} aria-hidden="true">
                <span className={styles.cardBack}>V+G</span>
                <span className={styles.cardFace}>
                  {open ? (
                    <>
                      {media ? (
                        <Image
                          src={media.src}
                          alt=""
                          fill
                          sizes="(max-width: 600px) 64px, 96px"
                          loading="lazy"
                        />
                      ) : (
                        <Icon />
                      )}
                      <span>{memory.title}</span>
                    </>
                  ) : null}
                </span>
              </span>
            </button>
          );
        })}
        {result ? (
          <ArcadeResult
            result={result}
            title={
              snapshot.status === "WON"
                ? "ALL MEMORIES MATCHED"
                : "TIME EXPIRED"
            }
            onRestart={props.onRestart}
            details={
              snapshot.status === "WON"
                ? [
                    {
                      label: "Completion",
                      value: `${(snapshot.elapsedMs / 1000).toFixed(1)}s`,
                    },
                    {
                      label: "Time left",
                      value: formatGameTime(
                        ARCADE.memory.limitMs - snapshot.elapsedMs,
                      ),
                    },
                    { label: "Attempts", value: snapshot.attempts },
                    {
                      label: "Accuracy",
                      value: `${Math.round((18 / snapshot.attempts) * 100)}%`,
                    },
                  ]
                : [
                    {
                      label: "Pairs",
                      value: `${snapshot.matched.size / 2} / 18`,
                    },
                    { label: "Attempts", value: snapshot.attempts },
                    { label: "Elapsed", value: "75s" },
                  ]
            }
          />
        ) : null}
      </div>
      <p className={styles.caption}>
        {snapshot.status === "READY"
          ? "First flip starts the clock."
          : "The clock keeps running in other tabs."}{" "}
        No preview. No extra time.
      </p>
    </section>
  );
}
