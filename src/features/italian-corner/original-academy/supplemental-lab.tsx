"use client";

import { Check, RotateCcw } from "lucide-react";
import { useState, useTransition } from "react";

import { submitSupplementalActivity } from "./progress-actions";
import type { publicSupplementalActivities } from "./supplemental-model";

type Activity = ReturnType<typeof publicSupplementalActivities>[number];
type SavedResponse = { exerciseId: string; answer: string; score: number };

const labels: Record<Activity["kind"], string> = {
  flashcard: "Carta di ripasso",
  fill: "Completa l'esempio",
  order: "Ricostruisci la frase",
  choice: "Scegli nel contesto",
  matching: "Abbina italiano e spagnolo",
  translation: "Traduzione guidata",
};

function ActivityCard({
  activity,
  lessonId,
  previous,
  onSaved,
}: {
  activity: Activity;
  lessonId: string;
  previous?: SavedResponse;
  onSaved: (response: SavedResponse) => void;
}) {
  const [answer, setAnswer] = useState("");
  const [selectedTokens, setSelectedTokens] = useState<number[]>([]);
  const [matches, setMatches] = useState<string[]>(Array(4).fill(""));
  const [revealed, setRevealed] = useState(false);
  const [result, setResult] = useState<{
    score: number | null;
    message: string;
    feedback: string;
    modelAnswer: string | null;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const currentAnswer =
    activity.kind === "matching" ? matches.join(",") : answer;

  function save(value: string) {
    setError("");
    startTransition(async () => {
      try {
        const response = await submitSupplementalActivity({
          lessonId,
          activityId: activity.id,
          answer: value,
        });
        if (!response.ok) {
          setError(response.message);
          return;
        }
        setResult({
          score: response.score,
          message: response.message,
          feedback: response.feedback,
          modelAnswer: response.modelAnswer,
        });
        onSaved({
          exerciseId: activity.id,
          answer: value,
          score: response.score ?? 0,
        });
      } catch {
        setError(
          "Salvataggio non riuscito. Riprova quando la connessione torna disponibile.",
        );
      }
    });
  }

  return (
    <article className="rounded-[1.3rem] border border-[#718471]/25 bg-[#fffcf5] p-4 shadow-[0_12px_30px_rgba(52,66,49,.05)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[0.61rem] font-bold tracking-[.16em] text-[#a75943] uppercase">
          {labels[activity.kind]}
        </p>
        <span className="font-mono text-xs text-[#667867]">
          {activity.id.slice(-2)} / 10
        </span>
      </div>
      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 sm:text-base">
        {activity.prompt}
      </p>

      {activity.kind === "flashcard" ? (
        <div className="mt-5">
          {revealed ? (
            <p className="rounded-xl border-l-2 border-[#a75943] bg-[#edf0e5] p-4 text-sm leading-7">
              {activity.answer}
            </p>
          ) : (
            <button
              className="academy-focus min-h-11 rounded-full border border-[#355244] px-5 text-sm text-[#355244]"
              onClick={() => setRevealed(true)}
              type="button"
            >
              Gira la carta
            </button>
          )}
          {revealed && !result ? (
            <div className="mt-4 flex flex-wrap gap-2">
              <button
                className="academy-focus min-h-11 rounded-full bg-[#355244] px-5 text-xs font-semibold text-white disabled:opacity-50"
                disabled={pending}
                onClick={() => save("known")}
                type="button"
              >
                La sapevo
              </button>
              <button
                className="academy-focus min-h-11 rounded-full border border-[#355244] px-5 text-xs font-semibold text-[#355244] disabled:opacity-50"
                disabled={pending}
                onClick={() => save("again")}
                type="button"
              >
                Da ripassare
              </button>
            </div>
          ) : null}
        </div>
      ) : activity.kind === "choice" ? (
        <fieldset className="mt-5 grid gap-2">
          <legend className="sr-only">Scegli la frase italiana</legend>
          {activity.options.map((option) => (
            <label
              className="academy-focus flex min-h-11 cursor-pointer items-center gap-3 rounded-xl border border-[#718471]/30 p-3 text-sm has-checked:bg-[#edf0e5]"
              key={option}
            >
              <input
                checked={answer === option}
                name={activity.id}
                onChange={() => setAnswer(option)}
                type="radio"
                value={option}
              />
              {option}
            </label>
          ))}
        </fieldset>
      ) : activity.kind === "order" ? (
        <div className="mt-5">
          <p className="min-h-12 rounded-xl border border-dashed border-[#718471]/40 bg-white p-3 text-sm">
            {answer || "Tocca le parole nell'ordine giusto"}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {activity.tokens.map((token, index) => (
              <button
                className="academy-focus min-h-11 rounded-full border border-[#718471]/40 bg-white px-4 text-sm disabled:opacity-40"
                disabled={selectedTokens.includes(index)}
                key={`${index}-${token}`}
                onClick={() => {
                  const next = [...selectedTokens, index];
                  setSelectedTokens(next);
                  setAnswer(
                    next.map((position) => activity.tokens[position]).join(" "),
                  );
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
              setSelectedTokens([]);
              setAnswer("");
            }}
            type="button"
          >
            Cancella ordine
          </button>
        </div>
      ) : activity.kind === "matching" ? (
        <fieldset className="mt-5 space-y-3">
          <legend className="sr-only">
            Abbina ogni frase italiana alla sua traduzione spagnola
          </legend>
          {activity.pairs.map((pair, index) => (
            <label
              className="block rounded-xl border border-[#718471]/30 p-3 text-sm"
              key={pair.italian}
            >
              <span className="block font-medium">{pair.italian}</span>
              <select
                className="academy-focus mt-2 min-h-11 w-full min-w-0 rounded-lg border border-[#718471]/35 bg-white px-3"
                onChange={(event) =>
                  setMatches((current) =>
                    current.map((value, position) =>
                      position === index ? event.target.value : value,
                    ),
                  )
                }
                value={matches[index]}
              >
                <option value="">Scegli la traduzione</option>
                {[...activity.pairs.slice(1), activity.pairs[0]].map(
                  (candidate) => {
                    const originalIndex = activity.pairs.findIndex(
                      (item) => item.italian === candidate.italian,
                    );
                    return (
                      <option
                        key={candidate.italian}
                        value={String(originalIndex)}
                      >
                        {candidate.spanish}
                      </option>
                    );
                  },
                )}
              </select>
            </label>
          ))}
        </fieldset>
      ) : (
        <label className="mt-5 block">
          <span className="sr-only">La tua risposta</span>
          <input
            className="academy-focus min-h-12 w-full rounded-xl border border-[#718471]/40 bg-white px-4 text-sm"
            maxLength={200}
            onChange={(event) => setAnswer(event.target.value)}
            placeholder={
              activity.kind === "translation"
                ? "Scrivi la frase italiana"
                : "La parola mancante"
            }
            type="text"
            value={answer}
          />
        </label>
      )}

      {activity.kind !== "flashcard" ? (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="academy-focus min-h-11 rounded-full bg-[#355244] px-5 text-xs font-bold tracking-[.1em] text-white uppercase disabled:opacity-50"
            disabled={
              pending ||
              !currentAnswer.trim() ||
              (activity.kind === "matching" && matches.some((value) => !value))
            }
            onClick={() => save(currentAnswer)}
            type="button"
          >
            {pending ? "Salvataggio…" : "Verifica e salva"}
          </button>
          {result ? (
            <button
              className="academy-focus inline-flex min-h-11 items-center gap-2 rounded-full border border-[#718471]/35 px-4 text-xs"
              onClick={() => {
                setAnswer("");
                setSelectedTokens([]);
                setMatches(Array(4).fill(""));
                setResult(null);
              }}
              type="button"
            >
              <RotateCcw aria-hidden="true" size={14} /> Riprova
            </button>
          ) : null}
        </div>
      ) : null}
      {previous && !result ? (
        <p className="mt-3 text-xs text-[#627164]">
          Attività già registrata. Puoi ripeterla per consolidare.
        </p>
      ) : null}
      {result ? (
        <div
          aria-live="polite"
          className="mt-5 rounded-xl bg-[#edf0e5] p-4 text-sm leading-7"
        >
          <p className="flex items-center gap-2 font-semibold text-[#355244]">
            {result.score === 100 ? (
              <Check aria-hidden="true" size={16} />
            ) : null}
            {result.message}
          </p>
          <p className="mt-2">{result.feedback}</p>
          {result.score !== 100 && result.modelAnswer ? (
            <p className="mt-2 font-medium">
              Soluzione guida: {result.modelAnswer}
            </p>
          ) : null}
        </div>
      ) : null}
      {error ? (
        <p aria-live="polite" className="mt-3 text-sm text-[#9c493d]">
          {error}
        </p>
      ) : null}
    </article>
  );
}

export function SupplementalLab({
  activities,
  lessonId,
  responses,
  onSaved,
}: {
  activities: Activity[];
  lessonId: string;
  responses: SavedResponse[];
  onSaved: (response: SavedResponse) => void;
}) {
  return (
    <section
      aria-labelledby="supplemental-title"
      className="academy-paper rounded-[1.5rem] border border-[#718471]/25 px-5 py-7 shadow-[0_22px_60px_rgba(52,66,49,.07)] sm:px-9 sm:py-10"
    >
      <p className="mb-4 text-[0.65rem] font-bold tracking-[.2em] text-[#a75943] uppercase">
        Atelier · attività nuove
      </p>
      <h2
        className="font-display text-3xl leading-tight text-[#304b3d] sm:text-4xl"
        id="supplemental-title"
      >
        Metti in pratica.
      </h2>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-[#59695b]">
        Dieci esercizi supplementari costruiti sugli esempi di questa lezione.
        Le risposte chiuse sono verificate dal server; le carte di ripasso sono
        autovalutate e non contano nel voto.
      </p>
      <div className="academy-rule my-7" />
      <div className="grid gap-4 xl:grid-cols-2">
        {activities.map((activity) => (
          <ActivityCard
            activity={activity}
            key={activity.id}
            lessonId={lessonId}
            onSaved={onSaved}
            previous={responses.find(
              (response) => response.exerciseId === activity.id,
            )}
          />
        ))}
      </div>
    </section>
  );
}
