"use client";

import { Heart, ShieldAlert } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { relationshipScenarios } from "@/data/game-content";
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

export function SurviveRelationshipGame({
  difficulty,
  paused,
  soundEnabled,
  onFinish,
  onRestart,
  onProgressChange,
  onScoreChange,
}: GameEngineProps) {
  const correctRef = useRef(0);
  const patienceRef = useRef(3);
  const scoreRef = useRef(0);
  const finishedRef = useRef(false);
  const [roundIndex, setRoundIndex] = useState(0);
  const [patience, setPatience] = useState(3);
  const [correct, setCorrect] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [resolved, setResolved] = useState(false);
  const [feedback, setFeedback] = useState(
    "The emergency committee is waiting for your decision.",
  );
  const [result, setResult] = useState<GameRunResult | null>(null);
  const playSound = useGameSound(soundEnabled);
  const scenario = relationshipScenarios[roundIndex];

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

  const chooseAnswer = useCallback(
    (answerIndex: number) => {
      if (paused || resolved || finishedRef.current) return;
      const isCorrect = answerIndex === scenario.correctIndex;
      const nextCorrect = correctRef.current + (isCorrect ? 1 : 0);
      const nextPatience = patienceRef.current - (isCorrect ? 0 : 1);
      const nextScore = scoreRef.current + (isCorrect ? 100 : 0);
      const roundProgress = Math.round(
        ((roundIndex + 1) / relationshipScenarios.length) * 100,
      );

      correctRef.current = nextCorrect;
      patienceRef.current = nextPatience;
      scoreRef.current = nextScore;
      setCorrect(nextCorrect);
      setPatience(nextPatience);
      setScore(nextScore);
      setSelectedIndex(answerIndex >= 0 ? answerIndex : null);
      setResolved(true);
      setFeedback(
        isCorrect
          ? scenario.feedback
          : answerIndex < 0
            ? "Silence was interpreted as a tactical error."
            : "The jury has described that response as ‘boldly unhelpful’. ",
      );
      onScoreChange(nextScore);
      onProgressChange(roundProgress);
      playSound(isCorrect ? "correct" : "wrong");
    },
    [
      onProgressChange,
      onScoreChange,
      paused,
      playSound,
      resolved,
      roundIndex,
      scenario.correctIndex,
      scenario.feedback,
    ],
  );

  const roundSeconds =
    difficulty === "story" ? 18 : difficulty === "daring" ? 8 : 12;
  const { secondsLeft, resetCountdown } = useGameCountdown(
    roundSeconds,
    !paused && !resolved && !result,
    () => chooseAnswer(-1),
  );

  useGameDelay(!paused && resolved && !result, 720, () => {
    const isLastRound = roundIndex === relationshipScenarios.length - 1;
    if (patienceRef.current <= 0 || isLastRound) {
      const won = patienceRef.current > 0 && correctRef.current >= 6;
      const roundProgress = Math.round(
        ((roundIndex + 1) / relationshipScenarios.length) * 100,
      );
      finish({
        score: scoreRef.current,
        progress: won ? 100 : Math.min(99, roundProgress),
        ending: won ? "relationship-intact" : "diplomatic-incident",
      });
      return;
    }
    setRoundIndex((value) => value + 1);
    resetCountdown(roundSeconds);
    setSelectedIndex(null);
    setResolved(false);
    setFeedback("New emergency received. Please pretend to remain calm.");
  });

  useEffect(() => {
    if (paused || resolved || result) return;
    function handleNumberKey(event: KeyboardEvent) {
      const index = Number(event.key) - 1;
      if (!Number.isInteger(index) || index < 0 || index > 2) return;
      event.preventDefault();
      chooseAnswer(index);
    }
    window.addEventListener("keydown", handleNumberKey);
    return () => window.removeEventListener("keydown", handleNumberKey);
  }, [chooseAnswer, paused, resolved, result]);

  return (
    <section
      className={styles.survivalGame}
      aria-label="Survive Our Relationship game"
    >
      <GameHud
        details={[
          { label: "Emergency", value: `${roundIndex + 1}/8` },
          { label: "Correct", value: `${correct}/6` },
          { label: "Time", value: `${secondsLeft}s` },
        ]}
        progress={result?.progress ?? (roundIndex / 8) * 100}
        score={score}
      />

      <div className={styles.emergencyDossier}>
        <header>
          <div>
            <ShieldAlert aria-hidden="true" />
            <span>Emergency {String(roundIndex + 1).padStart(2, "0")}</span>
          </div>
          <div
            className={styles.patienceMeter}
            aria-label={`${patience} patience remaining`}
          >
            {[0, 1, 2].map((index) => (
              <Heart
                aria-hidden="true"
                data-active={index < patience}
                fill={index < patience ? "currentColor" : "none"}
                key={index}
              />
            ))}
          </div>
        </header>
        <p className={styles.scenarioPrompt}>{scenario.prompt}</p>
        <div className={styles.answerStack}>
          {scenario.answers.map((answer, answerIndex) => {
            const selected = selectedIndex === answerIndex;
            const verdict =
              resolved && selected
                ? answerIndex === scenario.correctIndex
                  ? "correct"
                  : "wrong"
                : undefined;
            return (
              <button
                data-verdict={verdict}
                disabled={resolved || Boolean(result)}
                key={answer}
                onClick={() => chooseAnswer(answerIndex)}
                type="button"
              >
                <span>{answerIndex + 1}</span>
                {answer}
              </button>
            );
          })}
        </div>
        <p aria-live="polite" className={styles.dossierFeedback}>
          {feedback}
        </p>

        {paused ? <GamePausedOverlay /> : null}
        {result ? (
          <GameOutcome
            failureCopy="The emergency committee has adjourned. Snacks and a diplomatic reset are advised."
            failureTitle="Diplomatic incident."
            onRestart={onRestart}
            result={result}
            successCopy="Eight emergencies processed. The relationship remains improbably operational."
            successTitle="We survived us."
          />
        ) : null}
      </div>
    </section>
  );
}
