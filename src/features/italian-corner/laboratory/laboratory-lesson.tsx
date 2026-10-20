"use client";

import { ArrowLeft, ArrowRight, Check, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";

import {
  saveLaboratoryAnswer,
  visitLaboratoryLesson,
} from "./laboratory-actions";
import type { publicLaboratoryLesson } from "./laboratory-store";

type Lesson = ReturnType<typeof publicLaboratoryLesson>;
type Response = { exerciseId: string; answer: string; score: number };

export function LaboratoryLesson({
  lesson,
  responses,
}: {
  lesson: Lesson;
  responses: Response[];
}) {
  const [activityIndex, setActivityIndex] = useState(0);
  const [saved, setSaved] = useState(responses);
  const [answer, setAnswer] = useState(
    () =>
      responses.find((row) => row.exerciseId === lesson.activities[0]?.id)
        ?.answer ?? "",
  );
  const [result, setResult] = useState<{
    score: number | null;
    modelAnswer: string | null;
    feedback: string | null;
    message: string;
  } | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const activity = lesson.activities[activityIndex];
  const answered = saved.filter((row) =>
    lesson.activities.some((item) => item.id === row.exerciseId),
  ).length;

  useEffect(() => {
    void visitLaboratoryLesson(lesson.number).then((response) => {
      if (!response.ok) setMessage(response.message);
    });
  }, [lesson.number]);

  function move(index: number) {
    setActivityIndex(index);
    setAnswer(
      saved.find((row) => row.exerciseId === lesson.activities[index].id)
        ?.answer ?? "",
    );
    setResult(null);
    setMessage("");
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <Link
        className="academy-focus inline-flex min-h-11 items-center gap-2 text-xs font-bold tracking-[.12em] text-[#355244] uppercase"
        href="/la-dolce-lingua/laboratorio"
      >
        <ArrowLeft aria-hidden="true" size={16} /> Tutte le lezioni del
        laboratorio
      </Link>
      <header className="academy-paper mt-5 rounded-[1.7rem] border border-[#718471]/25 p-6 sm:p-10">
        <p className="text-[.64rem] font-bold tracking-[.2em] text-[#a75943] uppercase">
          Laboratorio {lesson.level} · Lezione{" "}
          {String(lesson.number).padStart(3, "0")}
        </p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl leading-tight text-[#304b3d] sm:text-6xl">
          {lesson.title}
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[#566355]">
          Questa è una bozza didattica consultabile: le risposte vengono salvate
          nel tuo quaderno privato, ma la lezione non conferisce una
          certificazione di livello.
        </p>
        {message ? (
          <p
            aria-live="polite"
            className="mt-4 rounded-xl border border-[#a75943]/40 p-4 text-sm"
          >
            {message}
          </p>
        ) : null}
      </header>

      <div className="mt-7 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_17rem]">
        <div className="min-w-0 space-y-6">
          <section className="academy-paper rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-9">
            <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
              Da imparare
            </p>
            <ul className="mt-4 list-inside list-disc space-y-2 text-sm leading-7 text-[#304b3d]">
              {lesson.objectives.map((objective) => (
                <li key={objective}>{objective}</li>
              ))}
            </ul>
          </section>
          <section className="academy-paper rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-9">
            <h2 className="font-display text-3xl text-[#304b3d]">
              La regola, in contesto.
            </h2>
            <div className="mt-5 space-y-6">
              {lesson.theory.map((part, index) => (
                <article key={`${part.heading}-${index}`}>
                  <h3 className="text-xs font-bold tracking-[.14em] text-[#a75943] uppercase">
                    {part.heading}
                  </h3>
                  <p className="mt-2 text-[.98rem] leading-8">{part.italian}</p>
                  {part.spanish ? (
                    <details className="mt-3 rounded-xl border border-[#718471]/25 bg-[#edf0e5] p-4 text-sm leading-7">
                      <summary className="academy-focus cursor-pointer font-semibold text-[#355244]">
                        Confronto con lo spagnolo
                      </summary>
                      <p className="mt-3" lang="es">
                        {part.spanish}
                      </p>
                    </details>
                  ) : null}
                </article>
              ))}
            </div>
          </section>
          <section className="academy-paper rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-9">
            <h2 className="font-display text-3xl text-[#304b3d]">
              Esempi da osservare.
            </h2>
            <ol className="mt-5 space-y-4">
              {lesson.examples.map((example, index) => (
                <li
                  className="border-l-2 border-[#a75943]/65 pl-4"
                  key={`${index}-${example.sentence}`}
                >
                  <p className="text-base leading-7">{example.sentence}</p>
                  <p className="mt-1 text-xs leading-6 text-[#667163]">
                    {example.explanation}
                  </p>
                </li>
              ))}
            </ol>
          </section>
          <section
            className="academy-paper rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-9"
            id="attivita"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
                  Il tuo quaderno · {activityIndex + 1} /{" "}
                  {lesson.activities.length}
                </p>
                <h2 className="mt-3 font-display text-3xl text-[#304b3d]">
                  Prova tu.
                </h2>
              </div>
              <span className="rounded-full border border-[#728675]/40 px-3 py-1 text-xs text-[#355244]">
                {answered} salvate
              </span>
            </div>
            <div
              className="mt-5 h-1.5 overflow-hidden rounded-full bg-[#e7e7dc]"
              role="progressbar"
              aria-label="Attività salvate"
              aria-valuenow={answered}
              aria-valuemin={0}
              aria-valuemax={lesson.activities.length}
            >
              <div
                className="h-full bg-[#a75943]"
                style={{
                  width: `${(100 * answered) / lesson.activities.length}%`,
                }}
              />
            </div>
            <p className="mt-7 text-sm leading-7 sm:text-base">
              {activity.prompt}
            </p>
            <label className="mt-5 block">
              <span className="sr-only">La tua risposta</span>
              <textarea
                className="academy-focus min-h-28 w-full rounded-xl border border-[#728675]/40 bg-[#fffdf8] p-4 text-sm leading-6"
                maxLength={2000}
                onChange={(event) => setAnswer(event.target.value)}
                placeholder="Scrivi la tua risposta…"
                value={answer}
              />
            </label>
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                className="academy-focus min-h-11 rounded-full bg-[#355244] px-5 text-xs font-bold tracking-[.1em] text-white uppercase disabled:opacity-50"
                disabled={!answer.trim() || pending}
                onClick={() => {
                  setMessage("");
                  startTransition(() => {
                    void saveLaboratoryAnswer({
                      number: lesson.number,
                      activityId: activity.id,
                      answer,
                    }).then((response) => {
                      if (!response.ok) {
                        setMessage(response.message);
                        return;
                      }
                      setSaved((current) => [
                        ...current.filter(
                          (row) => row.exerciseId !== activity.id,
                        ),
                        {
                          exerciseId: activity.id,
                          answer,
                          score: response.score ?? 0,
                        },
                      ]);
                      setResult(response);
                    });
                  });
                }}
                type="button"
              >
                {pending ? "Salvataggio…" : "Salva e confronta"}
              </button>
              {result ? (
                <button
                  className="academy-focus inline-flex min-h-11 items-center gap-2 rounded-full border border-[#728675]/40 px-5 text-xs"
                  onClick={() => {
                    setAnswer("");
                    setResult(null);
                  }}
                  type="button"
                >
                  <RotateCcw aria-hidden="true" size={14} /> Riprova
                </button>
              ) : null}
            </div>
            {result ? (
              <div
                aria-live="polite"
                className="mt-5 rounded-xl border border-[#718471]/35 bg-[#edf0e5] p-4 text-sm leading-7"
              >
                <p className="font-semibold text-[#304b3d]">{result.message}</p>
                {result.modelAnswer ? (
                  <p className="mt-2">
                    <span className="font-semibold">Soluzione guida:</span>{" "}
                    {result.modelAnswer}
                  </p>
                ) : null}
                {result.feedback ? (
                  <p className="mt-2">{result.feedback}</p>
                ) : null}
              </div>
            ) : null}
            {message ? (
              <p aria-live="polite" className="mt-4 text-sm text-[#a75943]">
                {message}
              </p>
            ) : null}
            <nav
              aria-label="Navigazione delle attività"
              className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#718471]/25 pt-5"
            >
              <button
                className="academy-focus inline-flex min-h-11 items-center gap-2 rounded-full border border-[#728675]/40 px-4 text-xs disabled:opacity-35"
                disabled={activityIndex === 0}
                onClick={() => move(activityIndex - 1)}
                type="button"
              >
                <ArrowLeft aria-hidden="true" size={15} /> Precedente
              </button>
              <button
                className="academy-focus inline-flex min-h-11 items-center gap-2 rounded-full border border-[#728675]/40 px-4 text-xs disabled:opacity-35"
                disabled={activityIndex === lesson.activities.length - 1}
                onClick={() => move(activityIndex + 1)}
                type="button"
              >
                Successiva <ArrowRight aria-hidden="true" size={15} />
              </button>
            </nav>
          </section>
        </div>
        <aside className="rounded-[1.5rem] border border-[#718471]/25 bg-[#fffcf5] p-5 lg:sticky lg:top-24">
          <p className="text-[.62rem] font-bold tracking-[.16em] text-[#a75943] uppercase">
            Appunti di studio
          </p>
          <p className="mt-3 text-sm leading-7 text-[#566355]">
            {lesson.status === "editorial-draft"
              ? "Stesura B2 ampliata, ancora in revisione editoriale."
              : "Materiale preliminare: esempi e attività richiedono ampliamento e revisione."}
          </p>
          <p className="mt-4 flex items-center gap-2 text-xs text-[#355244]">
            <Check aria-hidden="true" size={15} /> Le risposte sono private; il
            salvataggio viene confermato dal server.
          </p>
          <Link
            className="academy-focus mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-semibold text-[#355244]"
            href="/la-dolce-lingua/laboratorio"
          >
            Torna all’indice <ArrowRight aria-hidden="true" size={15} />
          </Link>
        </aside>
      </div>
    </div>
  );
}
