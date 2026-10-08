"use client";
import {
  ArrowLeft,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useModalDialog } from "@/hooks/use-modal-dialog";
import {
  type ComponentType,
  useCallback,
  useEffect,
  useEffectEvent,
  useRef,
  useState,
} from "react";
import {
  beginVgGameRun,
  finishVgGameRun,
  type FinishGameRunInput,
} from "@/features/games/actions/game-actions";
import { GameEngineLoading } from "@/features/games/components/game-primitives";
import { GameRewardReceipts } from "@/features/games/components/game-reward-receipts";
import { formatGameTime } from "@/features/games/lib/arcade-random";
import type {
  GameEngineProps,
  GameProgress,
  GameRewardReceipt,
  GameRunResult,
  VgGameDefinition,
} from "@/features/games/types";
import styles from "./games.module.css";
const engines: Record<
  VgGameDefinition["engine"],
  ComponentType<GameEngineProps>
> = {
  "break-defences": dynamic(
    () =>
      import("../engines/break-defences-game").then((m) => m.BreakDefencesGame),
    { loading: GameEngineLoading },
  ),
  "relationship-minefield": dynamic(
    () =>
      import("../engines/relationship-minefield-game").then(
        (m) => m.RelationshipMinefieldGame,
      ),
    { loading: GameEngineLoading },
  ),
  "365-memories": dynamic(
    () => import("../engines/memories-game").then((m) => m.MemoriesGame),
    { loading: GameEngineLoading },
  ),
  snake: dynamic(
    () => import("../engines/snake-game").then((m) => m.SnakeGame),
    { loading: GameEngineLoading },
  ),
  maze: dynamic(() => import("../engines/maze-game").then((m) => m.MazeGame), {
    loading: GameEngineLoading,
  }),
};
export function GameExperience({
  game,
  initialProgress,
}: {
  readonly game: VgGameDefinition;
  readonly initialProgress: GameProgress;
}) {
  const reduceMotion = Boolean(useReducedMotion()),
    [progress, setProgress] = useState(initialProgress),
    [paused, setPaused] = useState(false),
    [sound, setSound] = useState(false),
    [runKey, setRunKey] = useState(0),
    [seed, setSeed] = useState(0),
    [starting, setStarting] = useState(true),
    [completed, setCompleted] = useState(false),
    [confirmDiscard, setConfirmDiscard] = useState(false),
    [saving, setSaving] = useState(false),
    [feedback, setFeedback] = useState<string | null>(null),
    [rewards, setRewards] = useState<readonly GameRewardReceipt[]>([]),
    [pending, setPending] = useState<FinishGameRunInput | null>(null);
  const runId = useRef<string | null>(null),
    operation = useRef(false),
    finished = useRef(false),
    pendingRef = useRef<FinishGameRunInput | null>(null);
  const clockNeverPauses =
    game.engine === "365-memories" || game.engine === "relationship-minefield";
  const restartButton = useRef<HTMLButtonElement>(null),
    keepButton = useRef<HTMLButtonElement>(null);
  const closeDiscard = useCallback(() => setConfirmDiscard(false), []);
  const { dialogRef: discardDialogRef, onKeyDown: discardKeyDown } =
    useModalDialog({
      isOpen: confirmDiscard,
      onClose: closeDiscard,
      initialFocusRef: keepButton,
      returnFocusRef: restartButton,
    });
  const startRun = useCallback(
    async (discard = false) => {
      if (operation.current) return;
      if (pendingRef.current && finished.current && !discard) {
        setConfirmDiscard(true);
        return;
      }
      setConfirmDiscard(false);
      operation.current = true;
      setStarting(true);
      setRewards([]);
      setPending(null);
      pendingRef.current = null;
      runId.current = null;
      let message =
        "The archive is unavailable. You can play and retry saving your result.";
      try {
        const response = await beginVgGameRun(game.gameId, game.difficulty);
        if (response.progress) setProgress(response.progress);
        runId.current = response.runId ?? null;
        message =
          response.status === "success"
            ? "Attempt registered."
            : `${response.message} You can still play.`;
      } catch {
        /* A network outage must not prevent play. */
      }
      setSeed(crypto.getRandomValues(new Uint32Array(1))[0]);
      finished.current = false;
      setCompleted(false);
      setPaused(false);
      setRunKey((value) => value + 1);
      setFeedback(message);
      setStarting(false);
      operation.current = false;
    },
    [game.gameId, game.difficulty],
  );
  const initialStart = useEffectEvent(() => {
    void startRun();
  });
  useEffect(() => {
    const timer = window.setTimeout(() => initialStart(), 0);
    return () => clearTimeout(timer);
  }, []);
  const save = useCallback(
    async (input: FinishGameRunInput) => {
      if (operation.current) return;
      operation.current = true;
      setSaving(true);
      setFeedback("Saving result and checking rewards…");
      let retry = input;
      try {
        if (!retry.runId) {
          const response = await beginVgGameRun(game.gameId, game.difficulty);
          if (!response.runId) {
            setFeedback(response.message);
            return;
          }
          retry = { ...input, runId: response.runId };
          runId.current = response.runId;
        }
        pendingRef.current = retry;
        setPending(retry);
        const response = await finishVgGameRun(retry);
        if (response.progress) setProgress(response.progress);
        setRewards(response.rewards);
        setFeedback(response.message);
        if (response.status === "success") {
          pendingRef.current = null;
          setPending(null);
        }
      } catch {
        setFeedback(
          "The archive is unreachable. Your completed result is retained here. Retry before leaving this page.",
        );
      } finally {
        setSaving(false);
        operation.current = false;
      }
    },
    [game.gameId, game.difficulty],
  );
  const finish = useCallback(
    (result: GameRunResult) => {
      if (finished.current) return;
      finished.current = true;
      setCompleted(true);
      const input: FinishGameRunInput = {
        runId: runId.current ?? "",
        gameId: game.gameId,
        score: result.score,
        durationMs: Math.max(0, Math.round(result.durationMs ?? 0)),
        difficulty: game.difficulty,
        progress: result.progress,
        ending: result.ending,
        discoveredSecrets: result.discoveredSecrets ?? [],
        moves: result.moves,
        evidence: result.evidence,
      };
      pendingRef.current = input;
      setPending(input);
      void save(input);
    },
    [game.gameId, game.difficulty, save],
  );
  const pause = useCallback(() => {
    if (!clockNeverPauses && !completed && !starting)
      setPaused((value) => !value);
  }, [clockNeverPauses, completed, starting]);
  useEffect(() => {
    if (clockNeverPauses) return;
    const hidden = () => {
      if (document.hidden) setPaused(true);
    };
    const shortcut = (event: KeyboardEvent) => {
      if (
        event.key.toLowerCase() !== "p" ||
        event.ctrlKey ||
        event.metaKey ||
        (event.target instanceof HTMLElement &&
          event.target.matches("input,textarea,select,[contenteditable=true]"))
      )
        return;
      event.preventDefault();
      pause();
    };
    document.addEventListener("visibilitychange", hidden);
    window.addEventListener("keydown", shortcut);
    return () => {
      document.removeEventListener("visibilitychange", hidden);
      window.removeEventListener("keydown", shortcut);
    };
  }, [clockNeverPauses, pause]);
  const Engine = engines[game.engine];
  const best =
    game.metric === "time"
      ? progress.bestTimeMs == null
        ? "—"
        : formatGameTime(progress.bestTimeMs)
      : game.engine === "snake"
        ? Math.floor(progress.bestScore / 10)
        : progress.bestScore;
  return (
    <div className={styles.gameExperience}>
      <div className={styles.playContainer}>
        <nav className={styles.gameBreadcrumb} aria-label="Game navigation">
          <Link href="/challenges">
            <ArrowLeft size={15} aria-hidden="true" />
            Arcade
          </Link>
          <span>{game.number} / 05</span>
        </nav>
        <header className={styles.gameHeader}>
          <p>{game.dossierLabel}</p>
          <h1>{game.title}</h1>
        </header>
        <div className={styles.runtimeActions}>
          {!clockNeverPauses ? (
            <button
              aria-label={paused ? "Resume game" : "Pause game"}
              disabled={completed || starting}
              onClick={() => pause()}
              type="button"
            >
              {paused ? <Play size={16} /> : <Pause size={16} />}
              {paused ? "Resume" : "Pause"}
            </button>
          ) : null}
          <button
            ref={restartButton}
            disabled={starting || saving}
            onClick={() => void startRun()}
            type="button"
          >
            <RotateCcw size={16} aria-hidden="true" />
            Restart
          </button>
          <button
            aria-pressed={sound}
            aria-label={sound ? "Turn sound off" : "Turn sound on"}
            onClick={() => setSound((value) => !value)}
            type="button"
          >
            {sound ? <Volume2 size={16} /> : <VolumeX size={16} />}Sound{" "}
            {sound ? "on" : "off"}
          </button>
          <span className={styles.bestRecord}>
            Best {game.metric === "time" ? "time" : "score"} · {best}
          </span>
        </div>
        <div className={styles.engineFrame} key={runKey}>
          {runKey === 0 ? (
            <GameEngineLoading />
          ) : (
            <Engine
              bestScore={progress.bestScore}
              seed={seed}
              difficulty={game.difficulty}
              paused={paused || starting}
              reduceMotion={reduceMotion}
              soundEnabled={sound}
              archivedSecrets={progress.discoveredSecrets}
              onFinish={finish}
              onRestart={() => void startRun()}
              onScoreChange={() => undefined}
              onProgressChange={() => undefined}
            />
          )}
        </div>
        <details className={styles.instructions}>
          <summary>Instructions &amp; controls</summary>
          <p>{game.objective}</p>
          <ul>
            {game.instructions.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
          <p>{game.controls.join(" · ")}</p>
        </details>
        <div className={styles.persistenceStatus} aria-live="polite">
          <span>{saving ? "Saving" : "Archive"}</span>
          <p>{feedback}</p>
          {pending ? (
            <button
              disabled={saving}
              onClick={() => void save(pending)}
              type="button"
            >
              {saving ? "Saving…" : "Retry saving result"}
            </button>
          ) : null}
        </div>
        <GameRewardReceipts rewards={rewards} />
        <footer className={styles.gameRecordFooter}>
          <span>Attempts · {progress.attempts}</span>
          <span>Wins · {progress.wins}</span>
          <span>Losses · {progress.losses}</span>
          {progress.fewestMoves != null ? (
            <span>Fewest moves · {progress.fewestMoves}</span>
          ) : null}
          <span>
            Last played ·{" "}
            {progress.lastPlayedAt
              ? new Date(progress.lastPlayedAt).toLocaleDateString("en-GB", {
                  timeZone: "Europe/Rome",
                })
              : "—"}
          </span>
          <span>
            Last result · {progress.lastResult?.replaceAll("-", " ") ?? "—"}
          </span>
        </footer>
        {confirmDiscard ? (
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="discard-result-title"
            aria-describedby="discard-result-copy"
            ref={discardDialogRef}
            onKeyDown={discardKeyDown}
            tabIndex={-1}
            className={styles.discardDialog}
          >
            <div>
              <p>V&G / UNSAVED RESULT</p>
              <h2 id="discard-result-title">Keep this result?</h2>
              <p id="discard-result-copy">
                Your result has not reached the archive. Keep it to retry
                saving, or explicitly discard it before replaying.
              </p>
              <div>
                <button type="button" ref={keepButton} onClick={closeDiscard}>
                  Keep result
                </button>
                <button type="button" onClick={() => void startRun(true)}>
                  Discard and replay
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
