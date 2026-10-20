"use client";

import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useState, useTransition } from "react";

import { submitB1Pilot } from "./b1-exam-actions";
import type { publicB1Exam } from "./b1-exam-store";

type Exam = ReturnType<typeof publicB1Exam>;
type Result = Extract<Awaited<ReturnType<typeof submitB1Pilot>>, { ok: true }>;

export function B1Exam({
  exam,
  initial,
}: {
  exam: Exam;
  initial: {
    answers: Record<string, number>;
    writing: Record<string, string>;
    failed: boolean;
  };
}) {
  const [answers, setAnswers] = useState(initial.answers);
  const [writing, setWriting] = useState(initial.writing);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  const readingQuestions = exam.passages.flatMap(
    (passage) => passage.questions,
  );
  const questions = [...readingQuestions, ...exam.language];
  const complete = questions.every((question) =>
    Number.isInteger(answers[question.id]),
  );
  const answered = questions.filter((question) =>
    Number.isInteger(answers[question.id]),
  ).length;
  const feedback = new Map(
    result?.feedback.map((item) => [item.id, item]) ?? [],
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8 sm:py-12">
      <Link
        className="academy-focus inline-flex min-h-11 items-center gap-2 text-xs font-bold tracking-[.12em] text-[#355244] uppercase"
        href="/la-dolce-lingua/laboratorio"
      >
        <ArrowLeft aria-hidden="true" size={16} /> Laboratorio
      </Link>
      <header className="academy-paper mt-5 rounded-[1.7rem] border border-[#718471]/25 p-6 sm:p-10">
        <p className="text-[.62rem] font-bold tracking-[.2em] text-[#a75943] uppercase">
          Lezione 100 · B1 · prova pilota
        </p>
        <h1 className="mt-4 font-display text-4xl text-[#304b3d] sm:text-6xl">
          Una prova, non un diploma.
        </h1>
        <p className="mt-5 max-w-3xl text-sm leading-7 text-[#566355]">
          Due testi da leggere, venti domande di lingua e due produzioni
          scritte. La traccia audio non è ancora disponibile: non mostriamo le
          domande d’ascolto senza audio. Le produzioni scritte richiedono una
          persona che le valuti. Il punteggio qui sotto resta parziale e non
          certifica il B1.
        </p>
        {initial.failed ? (
          <p className="mt-4 text-sm text-[#a75943]" role="status">
            Il salvataggio potrebbe non essere disponibile. Puoi comunque
            leggere la prova.
          </p>
        ) : null}
        <p className="mt-4 text-xs font-semibold text-[#355244]">
          {answered} / {questions.length} risposte selezionate
        </p>
        <div
          className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#e7e7dc]"
          role="progressbar"
          aria-label="Domande risposte"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={questions.length}
        >
          <div
            className="h-full bg-[#a75943]"
            style={{ width: `${(100 * answered) / questions.length}%` }}
          />
        </div>
      </header>

      <div className="mt-7 space-y-7">
        {exam.passages.map((passage, passageIndex) => (
          <section
            className="academy-paper rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-9"
            key={passage.id}
          >
            <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
              Comprensione scritta · testo {passageIndex + 1}
            </p>
            <h2 className="mt-3 font-display text-3xl text-[#304b3d]">
              {passage.title}
            </h2>
            <p className="mt-5 whitespace-pre-wrap border-l-2 border-[#a75943]/55 pl-4 text-sm leading-8">
              {passage.text}
            </p>
            <div className="mt-7 space-y-5">
              {passage.questions.map((question, index) => (
                <QuestionField
                  key={question.id}
                  question={question}
                  ordinal={passageIndex * 5 + index + 1}
                  selected={answers[question.id]}
                  onSelect={(value) =>
                    setAnswers((current) => ({
                      ...current,
                      [question.id]: value,
                    }))
                  }
                  feedback={feedback.get(question.id)}
                />
              ))}
            </div>
          </section>
        ))}
        <section className="academy-paper rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-9">
          <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
            Competenza linguistica
          </p>
          <h2 className="mt-3 font-display text-3xl text-[#304b3d]">
            La lingua in pratica.
          </h2>
          <div className="mt-7 space-y-5">
            {exam.language.map((question, index) => (
              <QuestionField
                key={question.id}
                question={question}
                ordinal={index + 11}
                selected={answers[question.id]}
                onSelect={(value) =>
                  setAnswers((current) => ({
                    ...current,
                    [question.id]: value,
                  }))
                }
                feedback={feedback.get(question.id)}
              />
            ))}
          </div>
        </section>
        <section className="academy-paper rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-9">
          <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
            Produzione scritta · revisione umana
          </p>
          <h2 className="mt-3 font-display text-3xl text-[#304b3d]">
            Metti le parole tue.
          </h2>
          <p className="mt-4 text-sm leading-7 text-[#566355]">
            Il testo viene salvato, non corretto da un algoritmo. Nessun
            confronto esatto con un modello può valutare una produzione
            originale.
          </p>
          <div className="mt-6 space-y-6">
            {exam.writing.map((task) => (
              <label className="block" key={task.id}>
                <span className="block font-display text-2xl text-[#304b3d]">
                  {task.title}
                </span>
                <span className="mt-2 block text-sm leading-7">
                  {task.task}
                </span>
                <span className="mt-2 block text-xs text-[#667163]">
                  Indicazione: {task.wordsMin}–{task.wordsMax} parole ·{" "}
                  {writing[task.id]?.trim().split(/\s+/).filter(Boolean)
                    .length ?? 0}{" "}
                  scritte
                </span>
                <textarea
                  className="academy-focus mt-3 min-h-44 w-full rounded-xl border border-[#728675]/40 bg-[#fffdf8] p-4 text-sm leading-7"
                  maxLength={5000}
                  onChange={(event) =>
                    setWriting((current) => ({
                      ...current,
                      [task.id]: event.target.value,
                    }))
                  }
                  value={writing[task.id] ?? ""}
                />
              </label>
            ))}
          </div>
        </section>
        <section className="rounded-[1.5rem] border border-[#718471]/25 bg-[#edf0e5] p-6 sm:p-8">
          <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
            Ascolto e prova orale
          </p>
          <p className="mt-3 text-sm leading-7">
            Non disponibili in questa versione. La trascrizione riservata
            all’esaminatore e le relative risposte non vengono mostrate qui.
          </p>
        </section>
        <div className="flex flex-wrap items-center gap-4">
          <button
            className="academy-focus inline-flex min-h-12 items-center gap-2 rounded-full bg-[#355244] px-6 text-xs font-bold tracking-[.1em] text-white uppercase disabled:opacity-50"
            disabled={!complete || pending}
            onClick={() => {
              setError("");
              startTransition(() => {
                void submitB1Pilot({ answers, writing }).then((response) => {
                  if (response.ok) setResult(response);
                  else setError(response.message);
                });
              });
            }}
            type="button"
          >
            {pending ? "Salvataggio…" : "Consegna la prova parziale"}{" "}
            <ArrowRight aria-hidden="true" size={15} />
          </button>
          {!complete ? (
            <p className="text-xs text-[#667163]">
              Completa le {questions.length - answered} domande rimaste prima di
              consegnare.
            </p>
          ) : null}
        </div>
        {error ? (
          <p aria-live="polite" className="text-sm text-[#a75943]">
            {error}
          </p>
        ) : null}
        {result ? (
          <section
            aria-live="polite"
            className="academy-paper rounded-[1.5rem] border border-[#718471]/25 p-6 sm:p-9"
          >
            <p className="text-[.62rem] font-bold tracking-[.18em] text-[#a75943] uppercase">
              Report parziale · salvato
            </p>
            <h2 className="mt-3 font-display text-3xl text-[#304b3d]">
              Le risposte, senza finzioni.
            </h2>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <p className="rounded-xl bg-[#edf0e5] p-4 text-sm">
                Lettura:{" "}
                <strong>
                  {result.reading.points}/{result.reading.total}
                </strong>{" "}
                · {result.reading.percent}%
              </p>
              <p className="rounded-xl bg-[#edf0e5] p-4 text-sm">
                Lingua:{" "}
                <strong>
                  {result.language.points}/{result.language.total}
                </strong>{" "}
                · {result.language.percent}%
              </p>
            </div>
            <p className="mt-4 text-sm leading-7">{result.message}</p>
          </section>
        ) : null}
      </div>
    </div>
  );
}

function QuestionField({
  question,
  ordinal,
  selected,
  onSelect,
  feedback,
}: {
  question: { id: string; question: string; options: string[] };
  ordinal: number;
  selected: number | undefined;
  onSelect: (index: number) => void;
  feedback?: { correct: boolean; explanation: string };
}) {
  return (
    <fieldset className="rounded-xl border border-[#718471]/25 bg-[#fffcf5] p-4 sm:p-5">
      <legend className="px-1 text-sm font-semibold leading-6">
        <span className="font-mono text-xs text-[#a75943]">
          {String(ordinal).padStart(2, "0")}
        </span>{" "}
        {question.question}
      </legend>
      <div className="mt-3 grid gap-2">
        {question.options.map((option, index) => (
          <label
            className="academy-focus flex min-h-11 cursor-pointer items-center gap-3 rounded-lg border border-[#728675]/25 px-3 py-2 text-sm has-checked:border-[#355244] has-checked:bg-[#edf0e5]"
            key={index}
          >
            <input
              checked={selected === index}
              className="accent-[#355244]"
              name={question.id}
              onChange={() => onSelect(index)}
              type="radio"
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      {feedback ? (
        <p
          className={`mt-3 text-xs leading-6 ${feedback.correct ? "text-[#355244]" : "text-[#a75943]"}`}
        >
          {feedback.correct ? "Corretta. " : "Da ripassare. "}
          {feedback.explanation}
        </p>
      ) : null}
    </fieldset>
  );
}
