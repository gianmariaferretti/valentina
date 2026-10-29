"use client";

import {
  ArrowLeft,
  ArrowRight,
  Clock3,
  LockKeyhole,
  Medal,
  RotateCcw,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useTransition } from "react";

import { startCornerQuiz, submitCornerQuiz } from "./quiz-actions";
import {
  personalResult,
  type ActiveCornerAttempt,
  type CornerQuizSnapshot,
} from "./quiz-domain";
import type { QuizId } from "./question-bank";

interface Props {
  quizId: QuizId;
  title: string;
  subtitle: string;
  introduction: string;
  maxAttempts: number;
  passing: number;
  snapshot: CornerQuizSnapshot;
  rewardHref: string;
}

type Finished = Extract<
  Awaited<ReturnType<typeof submitCornerQuiz>>,
  { ok: true }
>;

export function CornerQuiz({
  quizId,
  title,
  subtitle,
  introduction,
  maxAttempts,
  passing,
  snapshot,
  rewardHref,
}: Props) {
  const [active, setActive] = useState<ActiveCornerAttempt | null>(
    snapshot.active,
  );
  const [attemptsUsed, setAttemptsUsed] = useState(snapshot.attempts.length);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [now, setNow] = useState(0);
  const [finished, setFinished] = useState<Finished | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const autoSubmitted = useRef(false);

  const submit = useCallback(() => {
    if (!active || pending) return;
    startTransition(() => {
      void submitCornerQuiz({ quizId, attemptId: active.id, answers }).then(
        (result) => {
          if (!result.ok) {
            setMessage(result.message);
            autoSubmitted.current = false;
            return;
          }
          setFinished(result);
          setAttemptsUsed(maxAttempts - result.attemptsRemaining);
          setActive(null);
          setMessage(null);
        },
      );
    });
  }, [active, answers, maxAttempts, pending, quizId]);

  useEffect(() => {
    if (!active) return;
    const interval = window.setInterval(() => setNow(Date.now()), 300);
    return () => window.clearInterval(interval);
  }, [active]);

  const isRelationship = quizId === "boyfriend-v2";
  const totalQuestions = isRelationship ? 20 : quizId === "italian" ? 15 : 10;
  const durationMinutes = isRelationship ? 15 : 10;
  const secondsLeft = active
    ? Math.min(
        durationMinutes * 60,
        Math.max(0, Math.ceil((Date.parse(active.expiresAt) - now) / 1000)),
      )
    : 0;
  useEffect(() => {
    if (active && secondsLeft === 0 && !pending && !autoSubmitted.current) {
      autoSubmitted.current = true;
      submit();
    }
  }, [active, pending, secondsLeft, submit]);

  function start() {
    setMessage(null);
    startTransition(() => {
      void startCornerQuiz(quizId).then((result) => {
        if (!result.ok || !result.attempt) {
          setMessage(result.message);
          return;
        }
        autoSubmitted.current = false;
        setAnswers({});
        setQuestionIndex(0);
        setNow(Date.now());
        setFinished(null);
        setAttemptsUsed((current) => current + 1);
        setActive(result.attempt);
      });
    });
  }

  const remaining = Math.max(0, maxAttempts - attemptsUsed);
  const question = active?.questions[questionIndex];
  const answered = active ? Object.keys(answers).length : 0;

  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <Link
        className="inline-flex min-h-11 items-center gap-2 text-xs font-bold tracking-[0.13em] text-[var(--muted)] uppercase"
        href={isRelationship ? "/home" : "/la-dolce-lingua"}
      >
        <ArrowLeft size={16} />{" "}
        {isRelationship ? "Year One" : "La Dolce Lingua"}
      </Link>
      <header className="mt-7 max-w-5xl">
        <p className="text-[0.64rem] font-bold tracking-[0.24em] text-[var(--rust)] uppercase">
          V + G · Examination file
        </p>
        <h1 className="mt-3 font-display text-[clamp(3.6rem,9vw,8.5rem)] leading-[0.86] tracking-[-0.065em]">
          {title}
        </h1>
        <p className="mt-5 font-display text-2xl italic text-[var(--rust)] sm:text-3xl">
          {subtitle}
        </p>
      </header>

      {finished ? (
        <section
          aria-live="polite"
          className="route-transition mt-10 rounded-[2rem] border border-[var(--line)] bg-[var(--paper-white)] p-6 shadow-[var(--shadow-paper)] sm:p-10"
        >
          <div className="flex items-start justify-between gap-5">
            <span className="text-[0.65rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
              Result sealed · {finished.score}/{totalQuestions}
            </span>
            <Medal aria-hidden="true" size={28} />
          </div>
          <h2 className="mt-7 max-w-3xl font-display text-[clamp(2.7rem,7vw,5.5rem)] leading-[0.92] tracking-[-0.05em]">
            {isRelationship
              ? finished.passed
                ? "Girlfriend verified."
                : "The jury requests further evidence."
              : quizId === "gianmaria"
                ? personalResult(finished.score)
                : finished.passed
                  ? "Italian enough. Officially."
                  : "Not quite yet, amor."}
          </h2>
          <p className="mt-5 text-sm leading-7 text-[var(--muted)]">
            {finished.passed
              ? "The sealed reward is now in Valentina's wallet. Prize details are still waiting for Gianmaria."
              : `You have ${finished.attemptsRemaining} attempt${finished.attemptsRemaining === 1 ? "" : "s"} left.`}
          </p>
          {finished.passed ? (
            <Link
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--oxblood)] px-6 text-xs font-bold tracking-[0.12em] text-white uppercase"
              href={rewardHref}
            >
              View sealed reward <ArrowRight size={16} />
            </Link>
          ) : finished.attemptsRemaining > 0 ? (
            <button
              className="mt-7 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--oxblood)] px-6 text-xs font-bold tracking-[0.12em] text-white uppercase"
              disabled={pending}
              onClick={start}
              type="button"
            >
              <RotateCcw size={16} /> Try again
            </button>
          ) : null}
          <details className="mt-10 border-t border-[var(--line)] pt-6">
            <summary className="cursor-pointer text-sm font-semibold">
              Review answers and explanations
            </summary>
            <ol className="mt-5 grid gap-3">
              {finished.explanations.map((entry, index) => (
                <li
                  className="rounded-2xl bg-[var(--paper)] p-4"
                  key={entry.id}
                >
                  <span className="text-[0.6rem] font-bold tracking-[0.16em] text-[var(--rust)] uppercase">
                    {index + 1} · {entry.correct ? "Correct" : "Incorrect"}
                  </span>
                  <p className="mt-2 font-medium">{entry.text}</p>
                  <p className="mt-1 text-sm text-[var(--muted)]">
                    Correct answer: {entry.correctAnswer}. {entry.explanation}
                  </p>
                </li>
              ))}
            </ol>
          </details>
        </section>
      ) : active && question ? (
        <section
          className="route-transition mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_15rem]"
          key={question.id}
        >
          <div className="overflow-hidden rounded-[2rem] border border-[var(--line)] bg-[var(--paper-white)] p-5 shadow-[var(--shadow-paper)] sm:p-9">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--line)] pb-5">
              <span className="text-[0.62rem] font-bold tracking-[0.18em] text-[var(--rust)] uppercase">
                Question {questionIndex + 1} / {active.questions.length}
              </span>
              <span
                className="inline-flex items-center gap-2 font-mono text-sm"
                aria-live="off"
              >
                <Clock3 size={16} />{" "}
                {Math.floor(secondsLeft / 60)
                  .toString()
                  .padStart(2, "0")}
                :{(secondsLeft % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <div
              aria-label="Question progress"
              className="mt-5 h-1.5 overflow-hidden rounded-full bg-[var(--paper-deep)]"
            >
              <div
                className="h-full bg-[var(--rust)] transition-[width] motion-reduce:transition-none"
                style={{
                  width: `${((questionIndex + 1) / active.questions.length) * 100}%`,
                }}
              />
            </div>
            <p className="mt-7 text-[0.58rem] font-bold tracking-[0.2em] text-[var(--muted)] uppercase">
              {quizId === "italian"
                ? `${question.level} · ${question.category}`
                : "Private evidence"}
            </p>
            <h2 className="mt-3 max-w-3xl font-display text-[clamp(2rem,5vw,3.8rem)] leading-[1.02] tracking-[-0.04em]">
              {question.text}
            </h2>
            <fieldset className="mt-8 grid gap-3">
              <legend className="sr-only">Choose one answer</legend>
              {question.options.map((option, index) => (
                <label
                  className={`flex min-h-14 cursor-pointer items-center gap-4 rounded-2xl border px-4 py-3 text-sm leading-6 transition-colors ${answers[question.id] === index ? "border-[var(--rust)] bg-[var(--rust)]/10" : "border-[var(--line)] hover:bg-[var(--paper)]"}`}
                  key={`${question.id}:${index}`}
                >
                  <input
                    checked={answers[question.id] === index}
                    className="accent-[var(--rust)]"
                    disabled={pending || secondsLeft === 0}
                    name={question.id}
                    onChange={() =>
                      setAnswers((current) => ({
                        ...current,
                        [question.id]: index,
                      }))
                    }
                    type="radio"
                    value={index}
                  />
                  <span>{option}</span>
                </label>
              ))}
            </fieldset>
            <div className="mt-8 flex flex-wrap gap-3">
              {questionIndex > 0 ? (
                <button
                  className="min-h-12 rounded-full border border-[var(--line-strong)] px-6 text-xs font-bold uppercase"
                  onClick={() => setQuestionIndex((value) => value - 1)}
                  type="button"
                >
                  Previous
                </button>
              ) : null}
              {questionIndex < active.questions.length - 1 ? (
                <button
                  className="min-h-12 rounded-full bg-[var(--ink)] px-6 text-xs font-bold text-white uppercase disabled:opacity-50"
                  disabled={answers[question.id] === undefined}
                  onClick={() => setQuestionIndex((value) => value + 1)}
                  type="button"
                >
                  Next question
                </button>
              ) : (
                <button
                  className="min-h-12 rounded-full bg-[var(--oxblood)] px-6 text-xs font-bold text-white uppercase disabled:opacity-50"
                  disabled={pending || answered < active.questions.length}
                  onClick={submit}
                  type="button"
                >
                  {pending ? "Saving…" : "Submit examination"}
                </button>
              )}
            </div>
          </div>
          <aside className="self-start rounded-[1.75rem] border border-[var(--line)] bg-[var(--paper-deep)] p-6">
            <span className="text-[0.62rem] font-bold tracking-[0.17em] uppercase">
              Examination rules
            </span>
            <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
              {durationMinutes} minutes. One paper. No answer key until you
              submit. Your time continues if you leave this page.
            </p>
            <p className="mt-5 font-mono text-sm">
              {answered} / {active.questions.length} answered
            </p>
          </aside>
        </section>
      ) : (
        <section className="mt-10 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
          <div className="rounded-[2rem] border border-[var(--line)] bg-[var(--paper-white)] p-6 shadow-[var(--shadow-paper)] sm:p-10">
            <p className="max-w-2xl whitespace-pre-line font-display text-2xl leading-snug sm:text-3xl">
              {introduction}
            </p>
            <div className="mt-9 flex flex-wrap gap-3 text-xs font-bold tracking-[0.12em] uppercase">
              <span className="rounded-full border border-[var(--line)] px-4 py-3">
                {durationMinutes} minutes
              </span>
              <span className="rounded-full border border-[var(--line)] px-4 py-3">
                Pass {passing}/{totalQuestions}
              </span>
              <span className="rounded-full border border-[var(--line)] px-4 py-3">
                {remaining} attempts left
              </span>
            </div>
            {remaining > 0 ? (
              <button
                className="mt-9 inline-flex min-h-12 items-center gap-2 rounded-full bg-[var(--oxblood)] px-7 text-xs font-bold tracking-[0.14em] text-white uppercase disabled:opacity-50"
                disabled={pending || snapshot.loadFailed}
                onClick={start}
                type="button"
              >
                {pending ? "Preparing paper…" : "Start examination"}{" "}
                <ArrowRight size={16} />
              </button>
            ) : (
              <p className="mt-8 text-sm text-[var(--rust)]">
                The examination archive is closed. All attempts have been used.
              </p>
            )}
            {snapshot.loadFailed ? (
              <p className="mt-5 text-sm text-[var(--rust)]">
                Progress is temporarily unavailable. The paper cannot be started
                until it is safely connected.
              </p>
            ) : null}
          </div>
          <aside className="rounded-[1.75rem] border border-[var(--line)] bg-[var(--paper-deep)] p-6">
            <LockKeyhole
              aria-hidden="true"
              className="text-[var(--rust)]"
              size={25}
            />
            <h2 className="mt-4 font-display text-3xl">Sealed reward</h2>
            <p className="mt-3 text-sm leading-7 text-[var(--muted)]">
              {snapshot.rewardUnlocked
                ? "Unlocked in Valentina's wallet. Prize details pending."
                : "One secret reward, unlocked only by a passing score."}
            </p>
            <p className="mt-6 text-xs text-[var(--muted)]">
              Best score: {snapshot.bestScore}
            </p>
            {snapshot.rewardUnlocked ? (
              <Link
                className="mt-4 inline-flex min-h-11 items-center gap-2 text-xs font-bold uppercase"
                href={rewardHref}
              >
                Open wallet <ArrowRight size={15} />
              </Link>
            ) : null}
          </aside>
        </section>
      )}
      {message ? (
        <p
          aria-live="polite"
          className="mt-5 rounded-xl border border-[var(--rust)]/30 bg-[var(--paper-white)] p-4 text-sm text-[var(--rust)]"
        >
          {message}
        </p>
      ) : null}
      {snapshot.attempts.length > 0 ? (
        <section className="mt-12 border-t border-[var(--line)] pt-6">
          <h2 className="font-display text-2xl">Previous papers</h2>
          <ol className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {snapshot.attempts.map((attempt, index) => (
              <li
                className="rounded-xl border border-[var(--line)] bg-[var(--paper-white)] p-4 text-sm"
                key={attempt.id}
              >
                Paper {snapshot.attempts.length - index} ·{" "}
                {attempt.status === "completed"
                  ? `${attempt.score} correct · ${attempt.passed ? "passed" : "not passed"}`
                  : attempt.status}
              </li>
            ))}
          </ol>
        </section>
      ) : null}
    </div>
  );
}
