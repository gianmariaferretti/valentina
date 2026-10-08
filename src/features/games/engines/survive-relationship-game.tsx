"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { Sticker } from "@/components/design-system";
import {
  relationshipChapters,
  relationshipStory,
} from "@/data/relationship-story";
import { relationshipEndings } from "@/data/relationship-endings";
import { useGameSound } from "@/features/games/hooks/use-game-sound";
import { GameEngineLoading } from "@/features/games/components/game-primitives";
import {
  availableStoryChoices,
  createStoryState,
  replayRelationshipStory,
  relationshipMetricLabels,
  storyDecision,
  storyPresentation,
} from "@/features/games/visual-novel/story-domain";
import { createNovelRuntime } from "@/features/games/visual-novel/monogatari-adapter";
import { SceneArtwork } from "@/features/games/visual-novel/scene-artwork";
import type { GameEngineProps } from "@/features/games/types";
import type { RelationshipMetric } from "@/features/games/visual-novel/types";
import styles from "@/features/games/visual-novel/novel.module.css";

export function SurviveRelationshipGame({
  paused,
  soundEnabled,
  reduceMotion,
  onFinish,
  onProgressChange,
  onRestart,
}: GameEngineProps) {
  const [state, setState] = useState(createStoryState);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(0);
  const [busy, setBusy] = useState(false);
  const [reaction, setReaction] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const runtime = useRef<Awaited<ReturnType<typeof createNovelRuntime>> | null>(
    null,
  );
  const locked = useRef(false);
  const mounted = useRef(true);
  const focusTarget = useRef<HTMLHeadingElement>(null);
  const sound = useGameSound(soundEnabled);
  const decision = storyDecision(state);
  const presentation = storyPresentation(state);
  const choices = availableStoryChoices(state);
  const chapter = relationshipChapters[decision?.chapter ?? 5];

  useEffect(() => {
    let cancelled = false;
    mounted.current = true;
    createNovelRuntime()
      .then((engine) => {
        if (cancelled) {
          engine.dispose();
          return;
        }
        runtime.current = engine;
        setReady(true);
      })
      .catch(() => {
        if (!cancelled)
          setError(
            "The story engine could not be loaded. Your private archive is unaffected.",
          );
      });
    return () => {
      cancelled = true;
      mounted.current = false;
      runtime.current?.dispose();
      runtime.current = null;
    };
  }, [loadingKey]);
  useEffect(() => {
    if (ready) focusTarget.current?.focus({ preventScroll: true });
  }, [state.cursor, reaction, ready, revealed]);

  async function choose(id: string) {
    if (paused || reaction || locked.current || !runtime.current || !decision)
      return;
    locked.current = true;
    setBusy(true);
    setError(null);
    try {
      const result = await runtime.current.choose(state, id);
      if (!mounted.current) return;
      setState(result.state);
      setReaction(result.consequence);
      onProgressChange(
        Math.round((result.state.cursor / relationshipStory.length) * 100),
      );
      sound("move");
    } catch {
      if (mounted.current)
        setError("That response could not be applied. Please try again.");
    } finally {
      locked.current = false;
      if (mounted.current) setBusy(false);
    }
  }
  function continueStory() {
    if (paused || busy || !reaction) return;
    setReaction(null);
  }
  const handleKey = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.repeat ||
      event.target instanceof HTMLInputElement ||
      event.target instanceof HTMLTextAreaElement
    )
      return;
    const index = Number(event.key) - 1;
    if (!paused && !reaction && choices[index]) {
      event.preventDefault();
      void choose(choices[index].id);
    }
  });
  useEffect(() => {
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  if (!ready)
    return (
      <div className={styles.loading}>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button
              type="button"
              onClick={() => {
                setError(null);
                setLoadingKey((key) => key + 1);
              }}
            >
              Retry loading story
            </button>
          </>
        ) : (
          <GameEngineLoading />
        )}
      </div>
    );
  if (!decision && !reaction) {
    const result = replayRelationshipStory(state.choices);
    const ending = relationshipEndings.find(
      (item) => item.id === result.ending,
    )!;
    return (
      <section className={styles.report} data-reduced-motion={reduceMotion}>
        <p className={styles.eyebrow}>24 HOURS LATER / SEALED REPORT</p>
        <h2 ref={focusTarget} tabIndex={-1}>
          {revealed ? ending.title : "What the day left behind."}
        </h2>
        <dl>
          {(Object.keys(relationshipMetricLabels) as RelationshipMetric[]).map(
            (metric) => (
              <div key={metric}>
                <dt>{relationshipMetricLabels[metric]}</dt>
                <dd>
                  {state.metrics[metric]} <span>/ 100</span>
                </dd>
                <meter
                  aria-label={relationshipMetricLabels[metric]}
                  value={state.metrics[metric]}
                  min={0}
                  max={100}
                />
              </div>
            ),
          )}
        </dl>
        {revealed ? (
          <div className={styles.ending}>
            <Sticker
              text={
                ending.id === "eleventh-hour" ? "Top secret" : "Evidence filed"
              }
              variant="classified"
              rotation={-3}
            />
            <p>{ending.description}</p>
            {"footnote" in ending ? <small>{ending.footnote}</small> : null}
            <button type="button" onClick={onRestart}>
              Live another version of the day
            </button>
          </div>
        ) : (
          <button
            type="button"
            disabled={paused}
            onClick={() => {
              setRevealed(true);
              sound("victory");
              onFinish({
                score: result.score,
                progress: 100,
                ending: result.ending,
                discoveredSecrets: result.discoveredSecrets,
                storyChoices: state.choices,
              });
            }}
          >
            Reveal the ending
          </button>
        )}
        <p className={styles.filingNote}>
          Check the archive status below. An ending is collected only after its
          save succeeds.
        </p>
      </section>
    );
  }
  return (
    <section
      className={styles.novel}
      data-reduced-motion={reduceMotion}
      aria-label="Interactive relationship story"
    >
      <div className={styles.scene} data-chapter={decision?.chapter ?? 5}>
        <div className={styles.sceneTitle}>
          <p>
            {chapter.time} / CHAPTER{" "}
            {String((decision?.chapter ?? 5) + 1).padStart(2, "0")}
          </p>
          <h2>{chapter.title}</h2>
          <span>{chapter.setting}</span>
        </div>
        <SceneArtwork slotId={chapter.artwork} />
        <p className={styles.annotation}>{chapter.annotation}</p>
      </div>
      <div className={styles.dialogue}>
        <p className={styles.eyebrow}>
          {reaction ? "WHAT HAPPENED NEXT" : presentation?.speaker}
        </p>
        <h3 ref={focusTarget} tabIndex={-1}>
          {reaction ? "A little consequence." : presentation?.dialogue}
        </h3>
        <p className={styles.narration} aria-live="polite">
          {reaction ?? presentation?.narration}
        </p>
        {paused ? (
          <p className={styles.pause} role="status">
            The day is paused. Resume using the controls above.
          </p>
        ) : null}
        {error ? <p role="alert">{error}</p> : null}
        {reaction ? (
          <button
            className={styles.continue}
            type="button"
            disabled={paused || busy}
            onClick={continueStory}
          >
            {decision ? "Continue the day" : "Open the relationship report"}{" "}
            <span aria-hidden="true">→</span>
          </button>
        ) : (
          <div className={styles.choices}>
            {choices.map((choice, index) => (
              <button
                key={choice.id}
                type="button"
                disabled={paused || busy}
                onClick={() => void choose(choice.id)}
              >
                <span>{String.fromCharCode(65 + index)}</span>
                {choice.text}
              </button>
            ))}
          </div>
        )}
        <p className={styles.caption}>
          No countdown. No correct answer. Just what you do next.
        </p>
      </div>
    </section>
  );
}
