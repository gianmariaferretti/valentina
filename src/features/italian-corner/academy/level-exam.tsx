"use client";

import { useState, useTransition } from "react";

import { submitLevelExam } from "./academy-actions";

interface ExamQuestion {
  key: string;
  prompt: string;
  options: readonly { id: string; text: string }[];
}

export function LevelExam({
  level,
  questions,
  passing,
}: {
  level: "A2" | "B1" | "B2";
  questions: readonly ExamQuestion[];
  passing: number;
}) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{
    score: number;
    passed: boolean;
    message: string;
  } | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();
  if (questions.length < 10)
    return (
      <div className="mt-8 rounded-[1.7rem] border border-dashed border-[var(--line-strong)] bg-[var(--paper-white)] p-7">
        <h2 className="font-display text-3xl">
          The examination room is not open yet.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
          Ten published multiple-choice activities are required for the {level}{" "}
          paper. The lesson authors will supply them; this page does not invent
          course material.
        </p>
      </div>
    );
  function submit() {
    setError("");
    startTransition(() => {
      void submitLevelExam(level, answers).then((response) => {
        if (response.ok) setResult(response);
        else setError(response.message);
      });
    });
  }
  if (result)
    return (
      <section
        aria-live="polite"
        className="mt-8 rounded-[1.7rem] bg-[var(--paper-white)] p-8"
      >
        <p className="text-[0.6rem] font-bold tracking-[0.18em] text-[var(--rust)] uppercase">
          {level} result
        </p>
        <h2 className="mt-5 font-display text-5xl">{result.score}%</h2>
        <p className="mt-3 text-sm">{result.message}</p>
      </section>
    );
  return (
    <section className="mt-8 space-y-4">
      <p className="text-sm text-[var(--muted)]">
        Ten activities · pass at {passing}% · result saved to your private
        Academy record.
      </p>
      {questions.map((question, index) => (
        <fieldset
          className="rounded-[1.4rem] border border-[var(--line)] bg-[var(--paper-white)] p-5"
          key={question.key}
        >
          <legend className="px-1 font-display text-xl">
            {index + 1}. {question.prompt}
          </legend>
          <div className="mt-4 grid gap-2">
            {question.options.map((option) => (
              <label
                className="flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-[var(--line)] px-4 text-sm has-checked:border-[var(--rust)]"
                key={option.id}
              >
                <input
                  checked={answers[question.key] === option.id}
                  name={question.key}
                  onChange={() =>
                    setAnswers((current) => ({
                      ...current,
                      [question.key]: option.id,
                    }))
                  }
                  type="radio"
                />
                <span>{option.text}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <button
        className="min-h-12 rounded-full bg-[var(--oxblood)] px-7 text-xs font-bold text-white uppercase disabled:opacity-50"
        disabled={pending || Object.keys(answers).length !== 10}
        onClick={submit}
        type="button"
      >
        {pending ? "Saving…" : "Submit level exam"}
      </button>
      {error ? (
        <p aria-live="polite" className="text-sm text-[var(--rust)]">
          {error}
        </p>
      ) : null}
    </section>
  );
}
