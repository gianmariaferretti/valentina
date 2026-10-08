"use client";

import {
  ArrowDown,
  ArrowUp,
  CalendarRange,
  Check,
  GripVertical,
} from "lucide-react";
import { useCallback, useMemo, useState } from "react";

import { buildYearChapters } from "@/data/game-content";
import {
  GameHud,
  GameOutcome,
  GamePausedOverlay,
} from "@/features/games/components/game-primitives";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import type { GameEngineProps, GameRunResult } from "@/features/games/types";

import styles from "../components/games.module.css";

const initialOrder = [3, 0, 5, 1, 6, 2, 4] as const;
type ChapterId = (typeof buildYearChapters)[number]["id"];

export function BuildYearGame({
  paused,
  soundEnabled,
  onFinish,
  onRestart,
  onProgressChange,
  onScoreChange,
}: GameEngineProps) {
  const [orderedIds, setOrderedIds] = useState<readonly ChapterId[]>(
    initialOrder.map((index) => buildYearChapters[index].id),
  );
  const [moves, setMoves] = useState(0);
  const [result, setResult] = useState<GameRunResult | null>(null);
  const playSound = useGameSound(soundEnabled);
  const chaptersById = useMemo(
    () => new Map(buildYearChapters.map((chapter) => [chapter.id, chapter])),
    [],
  );
  const correctPositions = orderedIds.filter(
    (id, index) => id === buildYearChapters[index].id,
  ).length;
  const liveProgress = Math.round(
    (correctPositions / buildYearChapters.length) * 100,
  );

  const moveChapter = useCallback(
    (index: number, offset: -1 | 1) => {
      if (paused || result) return;
      const target = index + offset;
      if (target < 0 || target >= orderedIds.length) return;
      const next = [...orderedIds];
      [next[index], next[target]] = [next[target], next[index]];
      const nextCorrect = next.filter(
        (id, chapterIndex) => id === buildYearChapters[chapterIndex].id,
      ).length;
      const nextProgress = Math.round(
        (nextCorrect / buildYearChapters.length) * 100,
      );
      setOrderedIds(next);
      setMoves((value) => value + 1);
      onProgressChange(nextProgress);
      playSound("move");
    },
    [onProgressChange, orderedIds, paused, playSound, result],
  );

  function submitTimeline() {
    if (paused || result) return;
    const complete = correctPositions === buildYearChapters.length;
    const score = complete
      ? Math.max(700, 1_000 - moves * 25)
      : correctPositions * 100;
    const nextResult: GameRunResult = {
      score,
      progress: complete ? 100 : Math.min(99, liveProgress),
      ending: complete ? "timeline-sealed" : "timeline-disputed",
    };
    setResult(nextResult);
    onScoreChange(score);
    onProgressChange(nextResult.progress);
    playSound(complete ? "victory" : "wrong");
    onFinish(nextResult);
  }

  return (
    <section className={styles.buildYearGame} aria-label="Build Our Year game">
      <GameHud
        details={[
          { label: "Placed", value: `${correctPositions}/7` },
          { label: "Moves", value: moves },
        ]}
        progress={result?.progress ?? liveProgress}
        score={result?.score ?? 0}
      />

      <div className={styles.timelineDesk}>
        <header>
          <CalendarRange aria-hidden="true" />
          <div>
            <p>Reconstruction file · 31.10.2025 — 31.10.2026</p>
            <h2>Put the archive back in order.</h2>
          </div>
        </header>

        <ol className={styles.timelineCards}>
          {orderedIds.map((chapterId, index) => {
            const chapter = chaptersById.get(chapterId);
            if (!chapter) return null;
            const inPlace = chapter.id === buildYearChapters[index].id;
            return (
              <li data-correct={inPlace} key={chapter.id}>
                <GripVertical
                  aria-hidden="true"
                  className={styles.timelineGrip}
                />
                <div className={styles.timelineCardNumber}>{chapter.order}</div>
                <div>
                  <p>{chapter.date}</p>
                  <h3>{chapter.title}</h3>
                  <span>{chapter.note}</span>
                </div>
                <div className={styles.timelineMoveButtons}>
                  <button
                    aria-label={`Move ${chapter.title} earlier`}
                    disabled={paused || Boolean(result) || index === 0}
                    onClick={() => moveChapter(index, -1)}
                    type="button"
                  >
                    <ArrowUp aria-hidden="true" />
                  </button>
                  <button
                    aria-label={`Move ${chapter.title} later`}
                    disabled={
                      paused ||
                      Boolean(result) ||
                      index === orderedIds.length - 1
                    }
                    onClick={() => moveChapter(index, 1)}
                    type="button"
                  >
                    <ArrowDown aria-hidden="true" />
                  </button>
                </div>
              </li>
            );
          })}
        </ol>

        <button
          className={styles.submitTimeline}
          disabled={paused || Boolean(result)}
          onClick={submitTimeline}
          type="button"
        >
          <Check aria-hidden="true" />
          Submit reconstructed year
        </button>

        {paused ? <GamePausedOverlay /> : null}
        {result ? (
          <GameOutcome
            failureCopy="The chronology department has raised seven objections and one eyebrow."
            failureTitle="Timeline disputed."
            onRestart={onRestart}
            result={result}
            successCopy="All seven chapters are in sequence. The archive can stop pretending it was organised."
            successTitle="Year reconstructed."
          />
        ) : null}
      </div>
    </section>
  );
}
