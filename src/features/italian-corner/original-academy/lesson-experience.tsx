"use client";

import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import type { publicSections } from "./lesson-model";
import {
  completeOriginalLesson,
  revealOriginalSolutions,
  submitOriginalExercise,
  visitOriginalLesson,
} from "./progress-actions";

type Section = ReturnType<typeof publicSections>[number];
type Exercise = Section["exercises"][number];
type Response = { exerciseId: string; answer: string; score: number };

function OriginalParagraph({ text }: { text: string }) {
  if (/^(EN ESPAÑOL|En español|Español:|ES:)/.test(text)) {
    return (
      <details className="rounded-xl border border-[#718471]/25 bg-[#edf0e5] p-4 text-sm leading-7">
        <summary className="academy-focus cursor-pointer font-semibold text-[#355244]">
          Traduzione e confronto in spagnolo
        </summary>
        <p className="mt-3 whitespace-pre-wrap" lang="es">
          {text}
        </p>
      </details>
    );
  }
  const isExample =
    /^\s*(?:0?[1-9])[.)]\s+/.test(text) &&
    (text.includes("→") || text.includes("ES:") || text.includes("  —  "));
  return (
    <p
      className={`whitespace-pre-wrap text-[0.98rem] leading-8 ${isExample ? "border-l-2 border-[#a75943]/65 pl-4 font-medium" : ""}`}
    >
      {text}
    </p>
  );
}

function ExerciseCard({
  exercise,
  lessonId,
  previous,
  onSaved,
}: {
  exercise: Exercise;
  lessonId: string;
  previous?: Response;
  onSaved: (response: Response) => void;
}) {
  const [answer, setAnswer] = useState(
    exercise.mode === "order" ? "" : (previous?.answer ?? ""),
  );
  const [orderedTokens, setOrderedTokens] = useState<string[]>([]);
  const [result, setResult] = useState<{
    score: number | null;
    feedback: string | null;
    modelAnswer: string | null;
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const isChoice = exercise.mode === "choice";
  return (
    <div
      className="rounded-[1.3rem] border border-[#718471]/25 bg-[#fffcf5] p-4 shadow-[0_12px_30px_rgba(52,66,49,.05)] sm:p-6"
      id={exercise.id}
    >
      <p className="mb-3 text-[0.6rem] font-bold tracking-[.16em] text-[#a75943] uppercase">
        {exercise.mode === "open"
          ? "Risposta personale"
          : isChoice
            ? "Scegli una risposta"
            : exercise.mode === "order"
              ? "Riordina le parole"
              : exercise.mode === "correction"
                ? "Correggi la frase"
                : exercise.mode === "transformation"
                  ? "Trasforma la frase"
                  : "Completa la frase"}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-7 sm:text-base">
        {exercise.prompt}
      </p>
      {isChoice ? (
        <fieldset className="mt-5 grid gap-2">
          <legend className="sr-only">Seleziona una risposta</legend>
          {exercise.options.map((option, index) => (
            <label
              className="academy-focus flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[#728675]/30 px-4 py-2 text-sm has-checked:border-[#48624f] has-checked:bg-[#edf0e5]"
              key={`${option}-${index}`}
            >
              <input
                checked={answer === option}
                className="accent-[#48624f]"
                name={exercise.id}
                onChange={() => setAnswer(option)}
                type="radio"
                value={option}
              />
              <span>{option}</span>
            </label>
          ))}
        </fieldset>
      ) : exercise.mode === "order" ? (
        <div className="mt-5">
          <p className="min-h-12 rounded-xl border border-dashed border-[#728675]/45 bg-white/70 p-3 text-sm">
            {answer || "Tocca le parole nell’ordine giusto"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {exercise.tokens.map((token, index) => (
              <button
                className="academy-focus min-h-11 rounded-full border border-[#728675]/45 bg-white px-4 text-sm disabled:opacity-40"
                disabled={
                  orderedTokens.filter((item) => item === token).length >=
                  exercise.tokens.filter((item) => item === token).length
                }
                key={`${token}-${index}`}
                onClick={() => {
                  const next = [...orderedTokens, token];
                  setOrderedTokens(next);
                  setAnswer(next.join(" "));
                }}
                type="button"
              >
                {token}
              </button>
            ))}
          </div>
          <button
            className="academy-focus mt-2 min-h-11 text-xs text-[#355244]"
            onClick={() => {
              setOrderedTokens([]);
              setAnswer("");
            }}
            type="button"
          >
            Cancella ordine
          </button>
        </div>
      ) : exercise.mode === "open" ? (
        <label className="mt-5 block">
          <span className="sr-only">La tua risposta</span>
          <textarea
            className="academy-focus min-h-28 w-full rounded-xl border border-[#728675]/40 bg-[#fffdf8] p-4 text-sm leading-6"
            maxLength={1000}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="Scrivi qui la tua risposta…"
            value={answer}
          />
        </label>
      ) : (
        <label className="mt-5 block">
          <span className="sr-only">La tua risposta</span>
          <input
            className="academy-focus min-h-12 w-full rounded-xl border border-[#728675]/40 bg-[#fffdf8] px-4 text-sm"
            maxLength={200}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder="La tua risposta"
            type="text"
            value={answer}
          />
        </label>
      )}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          className="academy-focus min-h-11 rounded-full bg-[#355244] px-5 text-xs font-bold tracking-[.12em] text-white uppercase disabled:opacity-50"
          disabled={pending || !answer.trim()}
          onClick={() => {
            setError("");
            startTransition(() => {
              void submitOriginalExercise({
                lessonId,
                exerciseId: exercise.id,
                answer,
              }).then((response) => {
                if (response.ok) {
                  setResult({
                    score: response.score,
                    feedback: response.feedback,
                    modelAnswer: response.modelAnswer,
                    message: response.message,
                  });
                  onSaved({
                    exerciseId: exercise.id,
                    answer,
                    score: response.score ?? 0,
                  });
                } else setError(response.message);
              });
            });
          }}
          type="button"
        >
          {pending
            ? "Salvataggio…"
            : exercise.mode === "open"
              ? "Salva e confronta"
              : "Verifica risposta"}
        </button>
        {result ? (
          <button
            className="academy-focus inline-flex min-h-11 items-center gap-2 rounded-full border border-[#718471]/35 px-5 text-xs font-semibold"
            onClick={() => {
              setAnswer("");
              setOrderedTokens([]);
              setResult(null);
            }}
            type="button"
          >
            <RotateCcw aria-hidden="true" size={14} /> Riprova
          </button>
        ) : null}
      </div>
      {previous && !result ? (
        <p className="mt-3 text-xs text-[#627164]">
          Risposta precedente: {previous.answer}.{" "}
          {exercise.mode === "order"
            ? "Puoi ricomporla e inviarla di nuovo."
            : "Puoi modificarla e inviarla di nuovo."}
        </p>
      ) : null}
      {result ? (
        <div
          aria-live="polite"
          className="mt-5 rounded-xl bg-[#edf0e5] p-4 text-sm leading-7"
        >
          <p className="font-semibold text-[#355244]">
            {result.score === 100 ? "✓ " : ""}
            {result.message}
          </p>
          {result.feedback ? (
            <p className="mt-2 whitespace-pre-wrap">{result.feedback}</p>
          ) : result.modelAnswer ? (
            <p className="mt-2">Soluzione del manuale: {result.modelAnswer}</p>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p aria-live="polite" className="mt-3 text-sm text-[#9c493d]">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function SectionScreen({
  section,
  lessonId,
  responses,
  onSaved,
}: {
  section: Section;
  lessonId: string;
  responses: Response[];
  onSaved: (response: Response) => void;
}) {
  const firstIndex = new Map(
    section.exercises.map((exercise) => [exercise.sourceIndexes[0], exercise]),
  );
  const consumed = new Set(
    section.exercises.flatMap((exercise) => exercise.sourceIndexes),
  );
  return (
    <article className="academy-paper rounded-[1.5rem] border border-[#718471]/25 px-5 py-7 shadow-[0_22px_60px_rgba(52,66,49,.07)] sm:px-9 sm:py-10">
      <p className="mb-5 text-[0.65rem] font-bold tracking-[.2em] text-[#a75943] uppercase">
        {section.kind === "practice"
          ? "Atelier · pratica"
          : "Appunti di lezione"}
      </p>
      <h2 className="font-display text-3xl leading-tight text-[#304b3d] sm:text-4xl">
        {section.heading}
      </h2>
      <div className="academy-rule my-7" />
      <div className="space-y-5">
        {section.paragraphs.map((paragraph, index) => {
          const exercise = firstIndex.get(index);
          if (exercise)
            return (
              <ExerciseCard
                exercise={exercise}
                key={exercise.id}
                lessonId={lessonId}
                onSaved={onSaved}
                previous={responses.find(
                  (item) => item.exerciseId === exercise.id,
                )}
              />
            );
          if (consumed.has(index)) return null;
          return <OriginalParagraph key={index} text={paragraph.text} />;
        })}
      </div>
    </article>
  );
}

export function LessonExperience({
  lessonId,
  number,
  title,
  level,
  volume,
  sections,
  responses,
  previousHref,
  nextHref,
}: {
  lessonId: string;
  number: number;
  title: string;
  level: string;
  volume: number;
  sections: Section[];
  responses: Response[];
  previousHref: string | null;
  nextHref: string | null;
}) {
  const [step, setStep] = useState(0);
  const [message, setMessage] = useState("");
  const [solutions, setSolutions] = useState<Awaited<
    ReturnType<typeof revealOriginalSolutions>
  > | null>(null);
  const [savedResponses, setSavedResponses] = useState(responses);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    void visitOriginalLesson(lessonId).then((result) => {
      if (!result.ok) setMessage(result.message);
    });
  }, [lessonId]);
  const section = sections[step];
  const percent = Math.round(((step + 1) / sections.length) * 100);
  function go(nextStep: number) {
    setStep(nextStep);
    window.scrollTo({
      top: 0,
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "instant"
        : "smooth",
    });
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8 sm:py-12">
      <Link
        className="academy-focus inline-flex min-h-11 items-center gap-2 text-xs font-bold tracking-[.12em] text-[#355244] uppercase"
        href="/la-dolce-lingua#curriculum"
      >
        <ArrowLeft aria-hidden="true" size={16} /> Tutte le lezioni
      </Link>
      <header className="mt-6 rounded-[1.6rem] bg-[#304b3d] px-6 py-8 text-[#f7f1e5] sm:px-10 sm:py-11">
        <p className="text-[.65rem] font-bold tracking-[.18em] text-[#e6c5a6] uppercase">
          Volume {volume} · {level} · Lezione {String(number).padStart(3, "0")}
        </p>
        <h1 className="mt-5 max-w-4xl font-display text-[clamp(2.4rem,6vw,5rem)] leading-[.98] tracking-tight">
          {title}
        </h1>
        <div className="mt-8 flex items-center gap-4">
          <span className="text-xs">
            Sezione {step + 1} / {sections.length}
          </span>
          <div
            aria-label={`${percent}% della lezione visualizzato`}
            className="h-1.5 w-40 overflow-hidden rounded-full bg-white/25"
          >
            <div
              className="h-full bg-[#e6c5a6]"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </header>
      {message ? (
        <p
          aria-live="polite"
          className="mt-4 rounded-xl border border-[#a75943]/40 p-4 text-sm"
        >
          {message}
        </p>
      ) : null}
      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]">
        <div className="min-w-0">
          <SectionScreen
            key={section.id}
            lessonId={lessonId}
            onSaved={(response) =>
              setSavedResponses((current) => [
                ...current.filter(
                  (item) => item.exerciseId !== response.exerciseId,
                ),
                response,
              ])
            }
            responses={savedResponses}
            section={section}
          />
          <div className="mt-6 flex items-center justify-between gap-3">
            <button
              className="academy-focus inline-flex min-h-12 items-center gap-2 rounded-full border border-[#718471]/35 px-5 text-sm disabled:opacity-35"
              disabled={step === 0}
              onClick={() => go(step - 1)}
              type="button"
            >
              <ArrowLeft aria-hidden="true" size={16} /> Indietro
            </button>
            <button
              className="academy-focus inline-flex min-h-12 items-center gap-2 rounded-full bg-[#355244] px-5 text-sm text-white disabled:opacity-35"
              disabled={step === sections.length - 1}
              onClick={() => go(step + 1)}
              type="button"
            >
              Avanti <ArrowRight aria-hidden="true" size={16} />
            </button>
          </div>
          {step === sections.length - 1 ? (
            <section className="mt-8 rounded-[1.5rem] border border-[#718471]/25 bg-[#fffcf5] p-6">
              <h2 className="font-display text-3xl text-[#304b3d]">
                La chiave e il traguardo.
              </h2>
              <p className="mt-3 text-sm leading-7 text-[#59695b]">
                Le correzioni sono riprodotte dal manuale originale. Le risposte
                libere non ricevono un voto automatico.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <button
                  className="academy-focus min-h-12 rounded-full border border-[#355244] px-5 text-sm font-semibold text-[#355244] disabled:opacity-50"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => {
                      void revealOriginalSolutions(lessonId).then(setSolutions);
                    })
                  }
                  type="button"
                >
                  Mostra tutte le soluzioni originali
                </button>
                <button
                  className="academy-focus inline-flex min-h-12 items-center gap-2 rounded-full bg-[#355244] px-5 text-sm font-semibold text-white disabled:opacity-50"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => {
                      void completeOriginalLesson(lessonId).then((result) =>
                        setMessage(result.message),
                      );
                    })
                  }
                  type="button"
                >
                  <Check aria-hidden="true" size={16} /> Segna come completata
                </button>
              </div>
              {solutions ? (
                <div className="mt-6 space-y-5" aria-live="polite">
                  {solutions.map((item) => (
                    <div key={item.heading}>
                      <h3 className="font-display text-2xl">{item.heading}</h3>
                      <div className="mt-3 space-y-3">
                        {item.paragraphs.map((paragraph, index) => (
                          <OriginalParagraph
                            key={index}
                            text={paragraph.text}
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>
          ) : null}
          <nav
            aria-label="Lezioni vicine"
            className="mt-8 flex flex-wrap justify-between gap-3 border-t border-[#718471]/25 pt-5 text-sm text-[#355244]"
          >
            {previousHref ? (
              <Link
                className="academy-focus inline-flex min-h-11 items-center"
                href={previousHref}
              >
                ← Lezione precedente
              </Link>
            ) : (
              <span />
            )}
            {nextHref ? (
              <Link
                className="academy-focus inline-flex min-h-11 items-center"
                href={nextHref}
              >
                Lezione successiva →
              </Link>
            ) : null}
          </nav>
        </div>
        <aside className="self-start rounded-[1.4rem] border border-[#718471]/25 bg-[#e5e9da] p-5 lg:sticky lg:top-32">
          <p className="text-[.65rem] font-bold tracking-[.16em] text-[#a75943] uppercase">
            Nel quaderno
          </p>
          <ol className="mt-4 space-y-1">
            {sections.map((item, index) => (
              <li key={item.id}>
                <button
                  aria-current={index === step ? "step" : undefined}
                  className={`academy-focus min-h-11 w-full rounded-lg px-3 py-2 text-left text-xs leading-5 ${index === step ? "bg-[#355244] text-white" : "hover:bg-white/60"}`}
                  onClick={() => go(index)}
                  type="button"
                >
                  <span className="mr-2 font-mono opacity-60">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  {item.heading}
                </button>
              </li>
            ))}
          </ol>
        </aside>
      </div>
    </div>
  );
}
