"use client";

import { Images, RotateCw } from "lucide-react";
import Image from "next/image";
import { type KeyboardEvent, useCallback, useRef, useState } from "react";

import { memoryPairDefinitions } from "@/data/game-content";
import { gameMediaPlaceholders } from "@/data/game-media";
import { getMediaAsset } from "@/data/media";
import {
  GameHud,
  GameOutcome,
  GamePausedOverlay,
} from "@/features/games/components/game-primitives";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import {
  useGameCountdown,
  useGameDelay,
} from "@/features/games/hooks/use-game-clock";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";

import styles from "../components/games.module.css";

const shuffleOrder = [
  5, 12, 1, 9, 14, 3, 7, 10, 0, 15, 6, 2, 11, 4, 13, 8,
] as const;

interface MemoryCard {
  readonly cardId: string;
  readonly pairId: string;
  readonly label: string;
  readonly stamp: string;
  readonly src: string;
}

const mediaSlotsById = new Map(
  gameMediaPlaceholders.map((slot) => [slot.id, slot]),
);
const unshuffledCards = memoryPairDefinitions.flatMap((pair) => {
  const slot = mediaSlotsById.get(pair.mediaId);
  if (!slot) return [];
  const media = getMediaAsset(slot.assetId);
  return [0, 1].map((copy) => ({
    cardId: `${pair.id}-${copy}`,
    pairId: pair.id,
    label: pair.label,
    stamp: pair.stamp,
    src: media.src,
  }));
});
const memoryCards = shuffleOrder.map((index) => unshuffledCards[index]);

export function MemoriesGame({
  difficulty,
  paused,
  reduceMotion,
  soundEnabled,
  onFinish,
  onRestart,
  onProgressChange,
  onScoreChange,
}: GameEngineProps) {
  const cards = memoryCards;
  const [flipped, setFlipped] = useState<readonly string[]>([]);
  const [matchedPairs, setMatchedPairs] = useState<Set<string>>(new Set());
  const [moves, setMoves] = useState(0);
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

  const { secondsLeft } = useGameCountdown(
    difficulty === "story" ? 150 : difficulty === "daring" ? 70 : 100,
    !paused && !result && matchedPairs.size < memoryPairDefinitions.length,
    () =>
      finish({
        score,
        progress: Math.min(
          99,
          Math.round((matchedPairs.size / memoryPairDefinitions.length) * 100),
        ),
        ending: "archive-timed-out",
      }),
  );

  useGameDelay(
    !paused && !result && flipped.length === 2,
    reduceMotion ? 160 : 720,
    () => {
      if (matchedPairs.size === memoryPairDefinitions.length) {
        finish({
          score: Math.min(1_600, score + secondsLeft * 5),
          progress: 100,
          ending: "archive-complete",
        });
        return;
      }
      setFlipped([]);
    },
  );

  const selectCard = useCallback(
    (card: MemoryCard) => {
      if (
        paused ||
        result ||
        flipped.length >= 2 ||
        flipped.includes(card.cardId) ||
        matchedPairs.has(card.pairId)
      ) {
        return;
      }

      playSound("move");
      if (flipped.length === 0) {
        setFlipped([card.cardId]);
        return;
      }

      const firstCard = cards.find((item) => item.cardId === flipped[0]);
      setFlipped([flipped[0], card.cardId]);
      setMoves((value) => value + 1);
      if (firstCard?.pairId === card.pairId) {
        const nextPairs = new Set(matchedPairs).add(card.pairId);
        const nextScore = score + 100;
        const nextProgress = Math.round(
          (nextPairs.size / memoryPairDefinitions.length) * 100,
        );
        setMatchedPairs(nextPairs);
        setScore(nextScore);
        onScoreChange(nextScore);
        onProgressChange(nextProgress);
        playSound("correct");
      } else {
        playSound("wrong");
      }
    },
    [
      cards,
      flipped,
      matchedPairs,
      onProgressChange,
      onScoreChange,
      paused,
      playSound,
      result,
      score,
    ],
  );

  function handleCardKeyDown(
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) {
    const columns = window.matchMedia("(min-width: 768px)").matches ? 8 : 4;
    const offsets: Record<string, number | undefined> = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -columns,
      ArrowDown: columns,
    };
    const offset = offsets[event.key];
    if (offset === undefined) return;
    const next = index + offset;
    if (next < 0 || next >= cards.length) return;
    event.preventDefault();
    const buttons =
      event.currentTarget.parentElement?.querySelectorAll("button");
    buttons?.[next]?.focus();
  }

  return (
    <section className={styles.memoriesGame} aria-label="365 Memories game">
      <GameHud
        details={[
          { label: "Pairs", value: `${matchedPairs.size}/8` },
          { label: "Moves", value: moves },
          { label: "Time", value: `${secondsLeft}s` },
        ]}
        progress={result?.progress ?? (matchedPairs.size / 8) * 100}
        score={result?.score ?? score}
      />
      <div className={styles.memoryTable}>
        <header>
          <Images aria-hidden="true" />
          <div>
            <p>Year One · contact sheet 365</p>
            <h2>Match the archive fragments.</h2>
          </div>
        </header>
        <div
          className={styles.memoryGrid}
          role="group"
          aria-label="Memory cards"
        >
          {cards.map((card, index) => {
            const visible =
              flipped.includes(card.cardId) || matchedPairs.has(card.pairId);
            return (
              <button
                aria-label={
                  visible
                    ? `${card.label}, ${matchedPairs.has(card.pairId) ? "matched" : "revealed"} memory card`
                    : `Sealed memory card ${index + 1}`
                }
                aria-pressed={visible}
                data-matched={matchedPairs.has(card.pairId)}
                data-visible={visible}
                disabled={
                  paused || Boolean(result) || (!visible && flipped.length >= 2)
                }
                key={card.cardId}
                onClick={() => selectCard(card)}
                onKeyDown={(event) => handleCardKeyDown(event, index)}
                type="button"
              >
                <span aria-hidden="true" className={styles.memoryCardBack}>
                  <strong>V&amp;G</strong>
                  <RotateCw aria-hidden="true" />
                  <i>{String(index + 1).padStart(2, "0")}</i>
                </span>
                <span aria-hidden="true" className={styles.memoryCardFace}>
                  <span>
                    <Image
                      alt=""
                      fill
                      sizes="(max-width: 719px) 28vw, 10rem"
                      src={card.src}
                    />
                  </span>
                  <strong>{card.label}</strong>
                  <i>{card.stamp}</i>
                </span>
              </button>
            );
          })}
        </div>

        {paused ? <GamePausedOverlay /> : null}
        {result ? (
          <GameOutcome
            failureCopy="The index resealed itself. The memories are safe; your score is less fortunate."
            failureTitle="Archive timed out."
            onRestart={onRestart}
            result={result}
            successCopy="Eight pairs restored. The final index is complete and deeply over-organised."
            successTitle="365 remembered."
          />
        ) : null}
      </div>
    </section>
  );
}
