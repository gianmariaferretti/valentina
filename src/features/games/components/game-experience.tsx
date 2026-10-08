"use client";

import {
  ArrowLeft,
  Clock3,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { PaperCard, Sticker, Tape } from "@/components/design-system";
import {
  beginVgGameRun,
  finishVgGameRun,
  type FinishGameRunInput,
} from "@/features/games/actions/game-actions";
import { GameEngineLoading } from "@/features/games/components/game-primitives";
import { GameRewardReceipts } from "@/features/games/components/game-reward-receipts";
import type {
  GameDifficulty,
  GameEngineProps,
  GameProgress,
  GameRewardReceipt,
  GameRunResult,
  VgGameDefinition,
} from "@/features/games/types";

import styles from "./games.module.css";

const GreatEscapeGame = dynamic(
  () =>
    import("@/features/games/engines/great-escape-game").then(
      (module) => module.GreatEscapeGame,
    ),
  { loading: GameEngineLoading },
);
const FindGianmariaGame = dynamic(
  () =>
    import("@/features/games/engines/find-gianmaria-game").then(
      (module) => module.FindGianmariaGame,
    ),
  { loading: GameEngineLoading },
);
const SurviveRelationshipGame = dynamic(
  () =>
    import("@/features/games/engines/survive-relationship-game").then(
      (module) => module.SurviveRelationshipGame,
    ),
  { loading: GameEngineLoading },
);
const BreakDefencesGame = dynamic(
  () =>
    import("@/features/games/engines/break-defences-game").then(
      (module) => module.BreakDefencesGame,
    ),
  { loading: GameEngineLoading },
);
const BuildYearGame = dynamic(
  () =>
    import("@/features/games/engines/build-year-game").then(
      (module) => module.BuildYearGame,
    ),
  { loading: GameEngineLoading },
);
const RelationshipMinefieldGame = dynamic(
  () =>
    import("@/features/games/engines/relationship-minefield-game").then(
      (module) => module.RelationshipMinefieldGame,
    ),
  { loading: GameEngineLoading },
);
const MemoriesGame = dynamic(
  () =>
    import("@/features/games/engines/memories-game").then(
      (module) => module.MemoriesGame,
    ),
  { loading: GameEngineLoading },
);

const gameEngines: Record<
  VgGameDefinition["engine"],
  ComponentType<GameEngineProps>
> = {
  "great-escape": GreatEscapeGame,
  "find-gianmaria": FindGianmariaGame,
  "survive-relationship": SurviveRelationshipGame,
  "break-defences": BreakDefencesGame,
  "build-year": BuildYearGame,
  "relationship-minefield": RelationshipMinefieldGame,
  "365-memories": MemoriesGame,
};

const difficultyCopy: Record<GameDifficulty, string> = {
  story: "A gentler route through the file.",
  standard: "The intended amount of avoidable pressure.",
  daring: "Less patience, more paperwork.",
};

function formatDuration(durationMs: number): string {
  const seconds = Math.max(0, Math.floor(durationMs / 1_000));
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function GameExperience({
  game,
  initialProgress,
}: {
  readonly game: VgGameDefinition;
  readonly initialProgress: GameProgress;
}) {
  const reduceMotion = Boolean(useReducedMotion());
  const [view, setView] = useState<"briefing" | "running">("briefing");
  const [difficulty, setDifficulty] = useState<GameDifficulty>(game.difficulty);
  const [progressState, setProgressState] = useState(initialProgress);
  const [currentScore, setCurrentScore] = useState(0);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const pausedRef = useRef(false);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [runKey, setRunKey] = useState(0);
  const [starting, setStarting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [rewards, setRewards] = useState<readonly GameRewardReceipt[]>([]);
  const [pendingSave, setPendingSave] = useState<FinishGameRunInput | null>(
    null,
  );
  const runIdRef = useRef<string | null>(null);
  const operationPendingRef = useRef(false);
  const startTimeRef = useRef(0);
  const pauseStartedAtRef = useRef<number | null>(null);
  const pausedDurationRef = useRef(0);
  const finishedRef = useRef(false);

  const startRun = useCallback(async () => {
    if (operationPendingRef.current) return;
    operationPendingRef.current = true;
    setStarting(true);
    setSaving(false);
    setFeedback("Registering a new attempt…");
    setRewards([]);
    setPendingSave(null);
    runIdRef.current = null;
    let startMessage =
      "This attempt could not be saved. You can still play and retry saving the result.";
    try {
      const response = await beginVgGameRun(game.gameId, difficulty);
      if (response.progress) setProgressState(response.progress);
      runIdRef.current = response.runId ?? null;
      startMessage =
        response.status === "success"
          ? "Attempt registered · evidence recording active"
          : `${response.message} You can still play this run.`;
    } catch {
      // Network failures must leave a playable local run with a visible retry path.
    }

    finishedRef.current = false;
    startTimeRef.current = performance.now();
    pauseStartedAtRef.current = null;
    pausedDurationRef.current = 0;
    setCurrentScore(0);
    setCurrentProgress(0);
    setPaused(false);
    pausedRef.current = false;
    setRunKey((value) => value + 1);
    setView("running");
    setFeedback(startMessage);
    setStarting(false);
    operationPendingRef.current = false;
  }, [difficulty, game.gameId]);

  const saveResult = useCallback(
    async (input: FinishGameRunInput) => {
      if (operationPendingRef.current) return;
      operationPendingRef.current = true;
      setSaving(true);
      setFeedback("Archiving the result and checking the reward drawer…");
      let retryableInput = input;
      try {
        let runId = input.runId;
        if (!runId) {
          const started = await beginVgGameRun(game.gameId, input.difficulty);
          if (!started.runId) {
            setFeedback(started.message);
            setPendingSave(input);
            return;
          }
          runId = started.runId;
          runIdRef.current = runId;
        }
        retryableInput = { ...input, runId };
        setPendingSave(retryableInput);
        const response = await finishVgGameRun(retryableInput);
        if (response.progress) setProgressState(response.progress);
        setRewards(response.rewards);
        setFeedback(response.message);
        if (response.status === "success") setPendingSave(null);
      } catch {
        setPendingSave(retryableInput);
        setFeedback(
          "The archive is temporarily unreachable. Your result is still here; retry saving before leaving this page.",
        );
      } finally {
        setSaving(false);
        operationPendingRef.current = false;
      }
    },
    [game.gameId],
  );

  const finishRun = useCallback(
    async (result: GameRunResult) => {
      if (finishedRef.current) return;
      finishedRef.current = true;
      const durationMs = Math.max(
        0,
        Math.floor(
          performance.now() - startTimeRef.current - pausedDurationRef.current,
        ),
      );
      setCurrentScore(result.score);
      setCurrentProgress(result.progress);
      const input: FinishGameRunInput = {
        runId: runIdRef.current ?? "",
        gameId: game.gameId,
        score: result.score,
        durationMs,
        difficulty,
        progress: result.progress,
        ending: result.ending,
        discoveredSecrets: result.discoveredSecrets ?? [],
      };
      setPendingSave(input);
      await saveResult(input);
    },
    [difficulty, game.gameId, saveResult],
  );

  const togglePause = useCallback(() => {
    if (finishedRef.current || view !== "running") return;
    const next = !pausedRef.current;
    pausedRef.current = next;
    if (next) {
      pauseStartedAtRef.current = performance.now();
    } else if (pauseStartedAtRef.current !== null) {
      pausedDurationRef.current +=
        performance.now() - pauseStartedAtRef.current;
      pauseStartedAtRef.current = null;
    }
    setPaused(next);
  }, [view]);

  useEffect(() => {
    function pauseWhenHidden() {
      if (!document.hidden || view !== "running" || finishedRef.current) return;
      if (pausedRef.current) return;
      pausedRef.current = true;
      pauseStartedAtRef.current = performance.now();
      setPaused(true);
    }

    function handlePauseShortcut(event: KeyboardEvent) {
      const target = event.target;
      if (
        event.key.toLowerCase() !== "p" ||
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        (target instanceof HTMLElement && target.isContentEditable)
      ) {
        return;
      }
      event.preventDefault();
      togglePause();
    }

    document.addEventListener("visibilitychange", pauseWhenHidden);
    window.addEventListener("keydown", handlePauseShortcut);
    return () => {
      document.removeEventListener("visibilitychange", pauseWhenHidden);
      window.removeEventListener("keydown", handlePauseShortcut);
    };
  }, [togglePause, view]);

  const engineProps: GameEngineProps = {
    difficulty,
    paused: paused || starting,
    reduceMotion,
    soundEnabled,
    onFinish: finishRun,
    onRestart: startRun,
    onScoreChange: setCurrentScore,
    onProgressChange: setCurrentProgress,
  };
  const Engine = gameEngines[game.engine];

  return (
    <div className={styles.gameExperience} data-accent={game.accent}>
      <div className="page-container py-6 sm:py-10 lg:py-14">
        <nav className={styles.gameBreadcrumb} aria-label="Game navigation">
          <Link href="/challenges">
            <ArrowLeft aria-hidden="true" size={15} />
            All games
          </Link>
          <span>{game.number} / 07</span>
        </nav>

        <header className={styles.gameHeader}>
          <div>
            <p>{game.dossierLabel}</p>
            <h1>{game.title}</h1>
          </div>
          <div className={styles.gameHeaderStamp}>
            <Sticker
              rotation={-4}
              size="sm"
              text="Playable file"
              variant="classified"
            />
            <span>
              <Clock3 aria-hidden="true" size={14} />
              {game.estimatedMinutes} min
            </span>
          </div>
        </header>

        {view === "briefing" ? (
          <section className={styles.briefingGrid}>
            <PaperCard
              className={styles.briefingDocument}
              elevated
              texture="ruled"
            >
              <Tape position="top" size="md" tone="cream" />
              <p className={styles.documentCode}>
                V&amp;G / GAME {game.number} / EYES ONLY
              </p>
              <h2>Mission briefing</h2>
              <p>{game.description}</p>
              <div className={styles.objectiveBox}>
                <span>Objective</span>
                <strong>{game.objective}</strong>
              </div>
              <ol className={styles.instructionList}>
                {game.instructions.map((instruction, index) => (
                  <li key={instruction}>
                    <span>{String(index + 1).padStart(2, "0")}</span>
                    {instruction}
                  </li>
                ))}
              </ol>
            </PaperCard>

            <aside className={styles.briefingAside}>
              <section>
                <p>Difficulty file</p>
                <div className={styles.difficultyPicker}>
                  {(["story", "standard", "daring"] as const).map((option) => (
                    <button
                      aria-pressed={difficulty === option}
                      data-selected={difficulty === option}
                      key={option}
                      onClick={() => setDifficulty(option)}
                      type="button"
                    >
                      <strong>{option}</strong>
                      <span>{difficultyCopy[option]}</span>
                    </button>
                  ))}
                </div>
              </section>
              <section>
                <p>Controls</p>
                <ul>
                  {game.controls.map((control) => (
                    <li key={control}>{control}</li>
                  ))}
                </ul>
              </section>
              <button
                className={styles.primaryGameAction}
                disabled={starting}
                onClick={() => void startRun()}
                type="button"
              >
                {starting ? "Opening file…" : "Start operation"}
              </button>
              <button
                aria-pressed={soundEnabled}
                className={styles.soundPreference}
                onClick={() => setSoundEnabled((value) => !value)}
                type="button"
              >
                {soundEnabled ? (
                  <Volume2 aria-hidden="true" />
                ) : (
                  <VolumeX aria-hidden="true" />
                )}
                Sound {soundEnabled ? "on" : "off"}
              </button>
            </aside>
          </section>
        ) : (
          <>
            <section
              className={styles.runtimeBar}
              aria-label="Current game status"
            >
              <dl>
                <div>
                  <dt>Score</dt>
                  <dd>{currentScore.toLocaleString("en-GB")}</dd>
                </div>
                <div>
                  <dt>Progress</dt>
                  <dd>{currentProgress}%</dd>
                </div>
                <div>
                  <dt>Best</dt>
                  <dd>{progressState.bestScore.toLocaleString("en-GB")}</dd>
                </div>
                <div>
                  <dt>Attempts</dt>
                  <dd>{progressState.attempts}</dd>
                </div>
              </dl>
              <div className={styles.runtimeActions}>
                <button
                  aria-label={paused ? "Resume game" : "Pause game"}
                  onClick={togglePause}
                  type="button"
                >
                  {paused ? (
                    <Play aria-hidden="true" />
                  ) : (
                    <Pause aria-hidden="true" />
                  )}
                  <span>{paused ? "Resume" : "Pause"}</span>
                </button>
                <button
                  aria-label="Restart game"
                  disabled={starting || saving}
                  onClick={() => void startRun()}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" />
                  <span>Restart</span>
                </button>
                <button
                  aria-label={soundEnabled ? "Turn sound off" : "Turn sound on"}
                  aria-pressed={soundEnabled}
                  onClick={() => setSoundEnabled((value) => !value)}
                  type="button"
                >
                  {soundEnabled ? (
                    <Volume2 aria-hidden="true" />
                  ) : (
                    <VolumeX aria-hidden="true" />
                  )}
                  <span>Sound</span>
                </button>
              </div>
            </section>

            <div className={styles.engineFrame} key={runKey}>
              <Engine {...engineProps} />
            </div>

            <div className={styles.persistenceStatus} aria-live="polite">
              <span data-active={saving}>{saving ? "Saving" : "Archive"}</span>
              <p>{feedback}</p>
              {pendingSave ? (
                <button
                  disabled={saving}
                  onClick={() => void saveResult(pendingSave)}
                  type="button"
                >
                  {saving ? "Saving…" : "Retry saving result"}
                </button>
              ) : null}
            </div>
            <GameRewardReceipts rewards={rewards} />
          </>
        )}

        <footer className={styles.gameRecordFooter}>
          <span>
            Best score · {progressState.bestScore.toLocaleString("en-GB")}
          </span>
          <span>Wins · {progressState.wins}</span>
          <span>Losses · {progressState.losses}</span>
          <span>
            Last duration · {formatDuration(progressState.durationMs)}
          </span>
        </footer>
      </div>
    </div>
  );
}
