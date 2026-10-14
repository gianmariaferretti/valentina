"use client";

import { ArrowLeft, Check, Headphones, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import {
  completeLesson,
  reviewVocabulary,
  submitLessonExercise,
} from "./academy-actions";
import type { ExerciseAnswer, PublicLesson } from "./exercise-domain";

function VocabularyCard({
  lessonId,
  word,
  preview,
}: {
  lessonId: string;
  word: PublicLesson["vocabulary"][number];
  preview: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [pending, startTransition] = useTransition();
  function review(known: boolean) {
    if (preview) {
      setFeedback("Preview only: no review saved.");
      return;
    }
    startTransition(() => {
      void reviewVocabulary({ lessonId, wordId: word.id, known }).then(
        (result) => setFeedback(result.message),
      );
    });
  }
  return (
    <article className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--paper-white)] p-5">
      <p className="text-[0.58rem] font-bold tracking-[0.17em] text-[var(--rust)] uppercase">
        Vocabulary file
      </p>
      <h3 className="mt-4 font-display text-2xl">{word.italian}</h3>
      {revealed ? (
        <div className="mt-3">
          <p className="text-sm text-[var(--muted)]">{word.spanish}</p>
          {word.example ? (
            <p className="mt-2 text-sm italic">{word.example}</p>
          ) : null}
          {word.audioRef ? (
            <audio
              className="mt-3 w-full"
              controls
              preload="none"
              src={word.audioRef}
            >
              Audio unavailable.
            </audio>
          ) : null}
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              className="min-h-11 rounded-full border border-[var(--line-strong)] px-4 text-xs font-semibold"
              disabled={pending}
              onClick={() => review(false)}
              type="button"
            >
              Review again
            </button>
            <button
              className="min-h-11 rounded-full bg-[var(--oxblood)] px-4 text-xs font-semibold text-white"
              disabled={pending}
              onClick={() => review(true)}
              type="button"
            >
              I remember it
            </button>
          </div>
        </div>
      ) : (
        <button
          className="mt-4 min-h-11 text-xs font-bold tracking-[0.1em] text-[var(--rust)] uppercase"
          onClick={() => setRevealed(true)}
          type="button"
        >
          Reveal translation
        </button>
      )}
      {feedback ? (
        <p aria-live="polite" className="mt-3 text-xs text-[var(--rust)]">
          {feedback}
        </p>
      ) : null}
    </article>
  );
}

function ExerciseCard({
  exercise,
  lessonId,
  preview,
}: {
  exercise: PublicLesson["exercises"][number];
  lessonId: string;
  preview: boolean;
}) {
  const [answer, setAnswer] = useState<ExerciseAnswer>(
    exercise.type === "matching"
      ? {}
      : exercise.type === "sentence-order"
        ? []
        : "",
  );
  const [feedback, setFeedback] = useState<{
    score: number;
    explanation: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const selectedTokens = Array.isArray(answer) ? answer : [];
  function submit() {
    setError("");
    startTransition(() => {
      void submitLessonExercise({
        lessonId,
        exerciseId: exercise.id,
        answer,
        preview,
      }).then((result) => {
        if (result.ok)
          setFeedback({ score: result.score, explanation: result.explanation });
        else setError(result.message);
      });
    });
  }
  return (
    <article
      id={exercise.id}
      className="rounded-[1.6rem] border border-[var(--line)] bg-[var(--paper-white)] p-5 sm:p-7"
    >
      <div className="flex items-center justify-between gap-3">
        <span className="text-[0.59rem] font-bold tracking-[0.17em] text-[var(--rust)] uppercase">
          {exercise.type.replaceAll("-", " ")}
        </span>
        <span className="font-mono text-[0.65rem] text-[var(--muted)]">
          {exercise.id}
        </span>
      </div>
      <h3 className="mt-4 font-display text-2xl leading-tight sm:text-3xl">
        {exercise.prompt}
      </h3>
      {exercise.type === "reading" && "text" in exercise ? (
        <blockquote className="mt-5 border-l-2 border-[var(--rust)] pl-4 text-sm leading-7 italic">
          {exercise.text}
        </blockquote>
      ) : null}
      {exercise.type === "listening" && "script" in exercise ? (
        <div className="mt-5">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase">
            <Headphones size={16} /> Listening activity
          </p>
          {exercise.audioRef ? (
            <audio
              className="mt-3 w-full"
              controls
              preload="none"
              src={exercise.audioRef}
            >
              Audio unavailable.
            </audio>
          ) : (
            <p className="mt-2 text-sm text-[var(--muted)]">
              Audio recording pending. Use the accessible transcript below.
            </p>
          )}
          <details className="mt-3 text-sm">
            <summary className="cursor-pointer">Read transcript</summary>
            <p className="mt-2 leading-6">{exercise.script}</p>
          </details>
        </div>
      ) : null}
      {"options" in exercise && exercise.options ? (
        <fieldset className="mt-5 grid gap-2">
          <legend className="sr-only">Choose an answer</legend>
          {exercise.options.map((option) => (
            <label
              className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] px-4 py-2 text-sm has-checked:border-[var(--rust)] has-checked:bg-[var(--rust)]/10"
              key={option.id}
            >
              <input
                checked={answer === option.id}
                className="accent-[var(--rust)]"
                onChange={() => setAnswer(option.id)}
                type="radio"
                name={exercise.id}
              />
              <span>{option.text}</span>
            </label>
          ))}
        </fieldset>
      ) : null}
      {exercise.type === "fill-blank" || exercise.type === "writing" ? (
        <label className="mt-5 block text-sm">
          <span className="sr-only">Your answer</span>
          {exercise.type === "writing" ? (
            <textarea
              className="min-h-32 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] p-4 outline-[var(--rust)]"
              maxLength={1000}
              onChange={(event) => setAnswer(event.target.value)}
              value={typeof answer === "string" ? answer : ""}
            />
          ) : (
            <input
              className="min-h-12 w-full rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-4 outline-[var(--rust)]"
              maxLength={200}
              onChange={(event) => setAnswer(event.target.value)}
              value={typeof answer === "string" ? answer : ""}
            />
          )}
        </label>
      ) : null}
      {exercise.type === "matching" &&
      "left" in exercise &&
      "right" in exercise ? (
        <div className="mt-5 grid gap-3">
          {exercise.left?.map((item) => (
            <label
              className="grid gap-2 text-sm sm:grid-cols-2 sm:items-center"
              key={item.id}
            >
              <span>{item.text}</span>
              <select
                className="min-h-12 rounded-xl border border-[var(--line-strong)] bg-[var(--paper)] px-3"
                onChange={(event) =>
                  setAnswer((current) => ({
                    ...(typeof current === "object" && !Array.isArray(current)
                      ? current
                      : {}),
                    [item.id]: event.target.value,
                  }))
                }
                value={
                  typeof answer === "object" && !Array.isArray(answer)
                    ? (answer[item.id] ?? "")
                    : ""
                }
              >
                <option value="">Choose translation</option>
                {exercise.right?.map((choice) => (
                  <option key={choice.id} value={choice.id}>
                    {choice.text}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>
      ) : null}
      {exercise.type === "sentence-order" &&
      "tokens" in exercise &&
      exercise.tokens ? (
        <div className="mt-5">
          <p className="min-h-14 rounded-xl border border-dashed border-[var(--line-strong)] p-3 text-sm">
            {selectedTokens.join(" ") || "Tap words to build the sentence"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {exercise.tokens.map((token, index) => (
              <button
                className="min-h-11 rounded-full border border-[var(--line-strong)] px-4 text-sm disabled:opacity-30"
                disabled={
                  selectedTokens.filter((part) => part === token).length >=
                  exercise.tokens!.filter((part) => part === token).length
                }
                key={`${token}:${index}`}
                onClick={() =>
                  setAnswer((current) => [
                    ...(Array.isArray(current) ? current : []),
                    token,
                  ])
                }
                type="button"
              >
                {token}
              </button>
            ))}
          </div>
          <button
            className="mt-3 inline-flex min-h-11 items-center gap-2 text-xs text-[var(--rust)]"
            onClick={() => setAnswer([])}
            type="button"
          >
            <RotateCcw size={14} /> Clear sentence
          </button>
        </div>
      ) : null}
      <button
        className="mt-6 min-h-12 rounded-full bg-[var(--ink)] px-6 text-xs font-bold tracking-[0.12em] text-white uppercase disabled:opacity-50"
        disabled={pending || (typeof answer === "string" && !answer.trim())}
        onClick={submit}
        type="button"
      >
        {pending
          ? "Checking…"
          : exercise.type === "writing"
            ? "Save writing draft"
            : "Check answer"}
      </button>
      {feedback ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-xl bg-[var(--paper-deep)] p-4 text-sm leading-6"
        >
          {exercise.type === "writing"
            ? "Writing saved for self-review."
            : `${feedback.score}% · `}
          {feedback.explanation}
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className="mt-3 text-sm text-[var(--rust)]">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export function LessonReader({
  lesson,
  preview,
}: {
  lesson: PublicLesson;
  preview: boolean;
}) {
  const [completion, setCompletion] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase"
        href="/italian-corner/academy"
      >
        <ArrowLeft size={16} /> La Dolce Lingua
      </Link>
      <header className="mt-6 rounded-[2rem] bg-[var(--oxblood)] p-6 text-white sm:p-10">
        <p className="text-[0.62rem] font-bold tracking-[0.18em] text-white/65 uppercase">
          {lesson.level} · Lesson {lesson.number} · {lesson.estimatedMinutes}{" "}
          minutes {preview ? "· development preview" : ""}
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9] tracking-[-0.05em]">
          {lesson.title}
        </h1>
        <p className="mt-5 max-w-2xl text-sm leading-7 text-white/75">
          {lesson.description}
        </p>
      </header>
      <div className="mt-7 grid gap-7 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div className="space-y-7">
          <section className="rounded-[1.6rem] bg-[var(--paper-white)] p-6">
            <h2 className="font-display text-3xl">What you will learn</h2>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-6">
              {lesson.objectives.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>
          {lesson.explanations.length ? (
            <section className="space-y-4">
              <h2 className="font-display text-3xl">Grammar notes</h2>
              {lesson.explanations.map((note) => (
                <article
                  className="grid gap-4 rounded-[1.6rem] bg-[var(--paper-white)] p-6 sm:grid-cols-2"
                  key={note.id}
                >
                  <p lang="it" className="text-sm leading-7">
                    {note.it}
                  </p>
                  <p
                    lang="es"
                    className="border-t border-[var(--line)] pt-4 text-sm leading-7 text-[var(--muted)] sm:border-t-0 sm:border-l sm:pt-0 sm:pl-4"
                  >
                    {note.es}
                  </p>
                </article>
              ))}
            </section>
          ) : null}
          {lesson.grammarExamples.length ? (
            <section className="rounded-[1.6rem] bg-[var(--paper-deep)] p-6">
              <h2 className="font-display text-3xl">Examples</h2>
              <ul className="mt-4 space-y-4">
                {lesson.grammarExamples.map((example, index) => (
                  <li key={index}>
                    <p lang="it" className="font-medium">
                      {example.italian}
                    </p>
                    <p lang="es" className="mt-1 text-sm text-[var(--muted)]">
                      {example.spanish}
                    </p>
                    {example.note ? (
                      <p className="mt-1 text-xs italic">{example.note}</p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          {lesson.vocabulary.length ? (
            <section>
              <h2 className="mb-4 font-display text-3xl">Vocabulary</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {lesson.vocabulary.map((word) => (
                  <VocabularyCard
                    key={word.id}
                    lessonId={lesson.id}
                    preview={preview}
                    word={word}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {lesson.exercises.length ? (
            <section>
              <h2 className="mb-4 font-display text-3xl">
                Practice & assessment
              </h2>
              <div className="grid gap-4">
                {lesson.exercises.map((exercise) => (
                  <ExerciseCard
                    exercise={exercise}
                    key={exercise.id}
                    lessonId={lesson.id}
                    preview={preview}
                  />
                ))}
              </div>
            </section>
          ) : null}
          {lesson.finalAssessment ? (
            <section className="rounded-[1.6rem] border border-[var(--rust)]/35 bg-[var(--paper-white)] p-6">
              <h2 className="font-display text-3xl">Final assessment</h2>
              <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
                Complete the designated activities and reach{" "}
                {lesson.finalAssessment.passingPercent}% average. Your best
                result in each activity counts.
              </p>
              {preview ? (
                <p className="mt-4 text-sm italic">
                  Development fixture: completion is not persisted.
                </p>
              ) : (
                <button
                  className="mt-5 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--oxblood)] px-6 text-xs font-bold text-white uppercase"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => {
                      void completeLesson(lesson.id).then((result) =>
                        setCompletion(result.message),
                      );
                    })
                  }
                  type="button"
                >
                  <Check size={16} /> Complete lesson
                </button>
              )}
              {completion ? (
                <p aria-live="polite" className="mt-3 text-sm">
                  {completion}
                </p>
              ) : null}
            </section>
          ) : null}
        </div>
        <aside className="self-start rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper-deep)] p-5 lg:sticky lg:top-32">
          <p className="text-[0.62rem] font-bold tracking-[0.17em] uppercase">
            Field notes
          </p>
          <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
            Italian explanations sit beside Spanish, so neither language has to
            do all the heavy lifting.
          </p>
          {lesson.reviewNotes.map((note) => (
            <p
              className="mt-4 border-t border-[var(--line)] pt-4 text-sm italic"
              key={note}
            >
              {note}
            </p>
          ))}
        </aside>
      </div>
    </div>
  );
}
