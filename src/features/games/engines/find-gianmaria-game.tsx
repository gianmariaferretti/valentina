"use client";

import { Eye, FileQuestion, Search, UserRound } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { findGianmariaScenes } from "@/data/game-content";
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

export function FindGianmariaGame({
  difficulty,
  paused,
  soundEnabled,
  onFinish,
  onRestart,
  onProgressChange,
  onScoreChange,
}: GameEngineProps) {
  const scoreRef = useRef(0);
  const strikesRef = useRef(0);
  const finishedRef = useRef(false);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [strikes, setStrikes] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [verdict, setVerdict] = useState<"correct" | "wrong" | null>(null);
  const [secretFound, setSecretFound] = useState(false);
  const [result, setResult] = useState<GameRunResult | null>(null);
  const playSound = useGameSound(soundEnabled);
  const scene = findGianmariaScenes[sceneIndex];

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

  const sceneSeconds =
    difficulty === "story" ? 24 : difficulty === "daring" ? 12 : 18;
  const { secondsLeft, resetCountdown } = useGameCountdown(
    sceneSeconds,
    !paused && !verdict && !result,
    () =>
      finish({
        score: scoreRef.current,
        progress: Math.round((sceneIndex / findGianmariaScenes.length) * 100),
        ending: "subject-escaped",
        discoveredSecrets: secretFound ? ["operation-redacted-note"] : [],
      }),
  );

  useGameDelay(
    !paused && Boolean(verdict) && !result,
    verdict === "correct" ? 520 : 420,
    () => {
      if (verdict === "correct") {
        if (sceneIndex === findGianmariaScenes.length - 1) {
          finish({
            score: scoreRef.current,
            progress: 100,
            ending: "subject-located",
            discoveredSecrets: secretFound ? ["operation-redacted-note"] : [],
          });
          return;
        }
        setSceneIndex((value) => value + 1);
        resetCountdown(sceneSeconds);
      }
      setSelectedIndex(null);
      setVerdict(null);
    },
  );

  const selectCandidate = useCallback(
    (candidateIndex: number) => {
      if (paused || verdict || finishedRef.current) return;
      setSelectedIndex(candidateIndex);

      if (candidateIndex === scene.targetIndex) {
        const nextScore = scoreRef.current + 100 + secondsLeft * 5;
        const nextProgress = Math.round(
          ((sceneIndex + 1) / findGianmariaScenes.length) * 100,
        );
        scoreRef.current = nextScore;
        setScore(nextScore);
        setVerdict("correct");
        onScoreChange(nextScore);
        onProgressChange(nextProgress);
        playSound("correct");
      } else {
        const nextStrikes = strikesRef.current + 1;
        strikesRef.current = nextStrikes;
        setStrikes(nextStrikes);
        setVerdict("wrong");
        playSound("wrong");
        if (nextStrikes >= 3) {
          finish({
            score: scoreRef.current,
            progress: Math.round(
              (sceneIndex / findGianmariaScenes.length) * 100,
            ),
            ending: "subject-escaped",
            discoveredSecrets: secretFound ? ["operation-redacted-note"] : [],
          });
        }
      }
    },
    [
      finish,
      onProgressChange,
      onScoreChange,
      paused,
      playSound,
      scene.targetIndex,
      sceneIndex,
      secondsLeft,
      secretFound,
      verdict,
    ],
  );

  useEffect(() => {
    if (paused || verdict || result) return;
    function handleNumberKey(event: KeyboardEvent) {
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index > 8) return;
      event.preventDefault();
      selectCandidate(index);
    }
    window.addEventListener("keydown", handleNumberKey);
    return () => window.removeEventListener("keydown", handleNumberKey);
  }, [paused, result, selectCandidate, verdict]);

  return (
    <section
      className={styles.findGame}
      aria-label="Operation Find Gianmaria game"
    >
      <GameHud
        details={[
          { label: "Scene", value: `${sceneIndex + 1}/5` },
          { label: "Time", value: `${secondsLeft}s` },
          { label: "Strikes", value: `${strikes}/3` },
        ]}
        progress={result?.progress ?? (sceneIndex / 5) * 100}
        score={score}
      />

      <div className={styles.surveillanceBoard}>
        <header>
          <div>
            <Eye aria-hidden="true" size={18} />
            <p>{scene.label}</p>
          </div>
          <span>Timer · {String(secondsLeft).padStart(2, "0")}</span>
        </header>
        <div className={styles.clueStrip}>
          <Search aria-hidden="true" size={17} />
          <p>{scene.clue}</p>
        </div>

        <div
          className={styles.candidateGrid}
          aria-label="Surveillance subjects"
        >
          {scene.candidateMarks.map((mark, candidateIndex) => {
            const selected = selectedIndex === candidateIndex;
            const candidateVerdict = selected ? verdict : null;
            return (
              <button
                aria-label={`Subject ${candidateIndex + 1}, evidence mark ${mark}`}
                data-verdict={candidateVerdict ?? undefined}
                disabled={paused || Boolean(verdict) || Boolean(result)}
                key={`${scene.id}-${candidateIndex}`}
                onClick={() => selectCandidate(candidateIndex)}
                type="button"
              >
                <span className={styles.subjectIndex}>
                  {String(candidateIndex + 1).padStart(2, "0")}
                </span>
                <UserRound aria-hidden="true" />
                <strong>{mark}</strong>
              </button>
            );
          })}
        </div>

        <button
          aria-pressed={secretFound}
          className={styles.redactedSecret}
          onClick={() => {
            if (secretFound || paused || result) return;
            setSecretFound(true);
            playSound("collect");
          }}
          type="button"
        >
          <FileQuestion aria-hidden="true" size={15} />
          {secretFound ? "Note recovered" : "██████ note"}
        </button>

        {paused ? <GamePausedOverlay /> : null}
        {result ? (
          <GameOutcome
            failureCopy="The subject left the frame. Surveillance funding has been suspended."
            failureTitle="Subject escaped."
            onRestart={onRestart}
            result={result}
            successCopy="Five sightings confirmed. The suspect was, predictably, Gianmaria."
            successTitle="Subject located."
          />
        ) : null}
      </div>

      <p aria-live="polite" className={styles.gameFeedback}>
        {verdict === "correct"
          ? "Identity confirmed. Advancing surveillance file."
          : verdict === "wrong"
            ? "Decoy. The investigation continues."
            : "Select the subject matching the evidence clue."}
      </p>
    </section>
  );
}
