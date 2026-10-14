import {
  ArrowRight,
  BookMarked,
  GraduationCap,
  NotebookTabs,
} from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { loadAcademyProgress } from "@/features/italian-corner/academy/academy-actions";
import { getCurriculum } from "@/features/italian-corner/academy/lesson-store";

export const metadata: Metadata = { title: "La Dolce Lingua" };

export default async function AcademyPage() {
  const [curriculum, progress] = await Promise.all([
    getCurriculum(),
    loadAcademyProgress(),
  ]);
  const published = curriculum.filter((item) => item.status === "published");
  const completed = progress.lessons.filter(
    (item) => item.status === "completed",
  ).length;
  const passedLevels = new Set(
    progress.exams.filter((exam) => exam.passed).map((exam) => exam.level),
  ).size;
  const resume = progress.lessons.find((item) =>
    curriculum.some(
      (entry) => entry.id === item.lessonId && entry.status === "published",
    ),
  );
  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <Link
        className="inline-flex min-h-11 items-center text-xs font-bold tracking-[0.14em] text-[var(--muted)] uppercase"
        href="/italian-corner"
      >
        ← Italian Corner
      </Link>
      <header className="mt-6 overflow-hidden rounded-[2rem] bg-[var(--ink)] p-6 text-[var(--paper-white)] sm:p-10 lg:p-14">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--sand)] uppercase">
          V + G · Italian Academy
        </p>
        <h1 className="mt-8 font-display text-[clamp(3.7rem,9vw,8rem)] leading-[0.82] tracking-[-0.06em]">
          La Dolce
          <br />
          <em>Lingua.</em>
        </h1>
        <p className="mt-8 max-w-xl font-display text-2xl italic text-white/72">
          An Italian Course Made with Love
        </p>
        <p className="mt-6 max-w-2xl text-sm leading-7 text-white/65">
          One hundred numbered lesson slots. Real lessons appear here only when
          Gianmaria adds and publishes their validated files.
        </p>
      </header>
      <section
        aria-label="Student dashboard"
        className="mt-6 grid gap-3 sm:grid-cols-3"
      >
        <div className="rounded-[1.4rem] bg-[var(--paper-white)] p-5">
          <BookMarked className="text-[var(--rust)]" size={22} />
          <p className="mt-4 font-display text-3xl">{completed} / 100</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Lessons completed</p>
        </div>
        <div className="rounded-[1.4rem] bg-[var(--paper-white)] p-5">
          <NotebookTabs className="text-[var(--rust)]" size={22} />
          <p className="mt-4 font-display text-3xl">
            {progress.mistakes.length}
          </p>
          <p className="mt-1 text-xs text-[var(--muted)]">
            Activities to revisit
          </p>
        </div>
        <div className="rounded-[1.4rem] bg-[var(--paper-white)] p-5">
          <GraduationCap className="text-[var(--rust)]" size={22} />
          <p className="mt-4 font-display text-3xl">{passedLevels} / 3</p>
          <p className="mt-1 text-xs text-[var(--muted)]">Level exams passed</p>
        </div>
      </section>
      {progress.failed ? (
        <p
          role="status"
          className="mt-5 rounded-xl border border-[var(--rust)]/35 p-4 text-sm text-[var(--rust)]"
        >
          Progress is temporarily unavailable. The curriculum remains readable;
          results will not be guessed.
        </p>
      ) : null}
      {resume ? (
        <Link
          className="mt-5 flex min-h-16 items-center justify-between gap-3 rounded-[1.2rem] bg-[var(--oxblood)] px-5 text-sm font-semibold text-white"
          href={`/italian-corner/academy/${resume.lessonId}`}
        >
          <span>
            Resume{" "}
            {curriculum.find((entry) => entry.id === resume.lessonId)?.title}
          </span>
          <ArrowRight size={18} />
        </Link>
      ) : null}
      {process.env.NODE_ENV === "development" ? (
        <Link
          className="mt-5 inline-flex min-h-11 items-center gap-2 text-xs font-bold text-[var(--rust)] uppercase"
          href="/italian-corner/academy/preview"
        >
          Preview development fixture <ArrowRight size={14} />
        </Link>
      ) : null}
      <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <section>
          <h2 className="font-display text-4xl">The curriculum</h2>
          <p className="mt-2 text-sm text-[var(--muted)]">
            {published.length} published · {100 - published.length} awaiting
            content
          </p>
          <div className="mt-6 space-y-4">
            {(["A2", "B1", "B2"] as const).map((level) => {
              const entries = curriculum.filter(
                (entry) => entry.level === level,
              );
              return (
                <details
                  className="group overflow-hidden rounded-[1.5rem] border border-[var(--line)] bg-[var(--paper-white)]"
                  key={level}
                  open={level === "A2"}
                >
                  <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-4 px-5 sm:px-7">
                    <span className="font-display text-3xl">{level}</span>
                    <span className="text-xs text-[var(--muted)]">
                      Lessons {entries[0]?.number}–{entries.at(-1)?.number} ·{" "}
                      {
                        entries.filter((entry) => entry.status === "published")
                          .length
                      }{" "}
                      live
                    </span>
                  </summary>
                  <ol className="grid gap-2 border-t border-[var(--line)] p-3 sm:grid-cols-2 sm:p-5">
                    {entries.map((entry) => (
                      <li key={entry.id}>
                        {entry.status === "published" ? (
                          <Link
                            className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3 text-sm hover:border-[var(--rust)]"
                            href={`/italian-corner/academy/${entry.id}`}
                          >
                            <span>{entry.title}</span>
                            <ArrowRight size={15} />
                          </Link>
                        ) : (
                          <div className="flex min-h-12 items-center justify-between gap-3 rounded-xl border border-dashed border-[var(--line)] p-3 text-sm text-[var(--muted)]">
                            <span>{entry.title}</span>
                            <span className="text-[0.59rem] uppercase">
                              Unpublished
                            </span>
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </details>
              );
            })}
          </div>
        </section>
        <aside className="space-y-4">
          <section className="rounded-[1.4rem] bg-[var(--paper-deep)] p-5">
            <h3 className="font-display text-2xl">Level examinations</h3>
            <p className="mt-2 text-xs leading-6 text-[var(--muted)]">
              A2, B1 and B2 become available when enough published activities
              exist.
            </p>
            {(["A2", "B1", "B2"] as const).map((level) => (
              <Link
                className="mt-3 flex min-h-11 items-center justify-between border-t border-[var(--line)] text-xs font-bold"
                href={`/italian-corner/academy/exams/${level.toLowerCase()}`}
                key={level}
              >
                {level} examination <ArrowRight size={15} />
              </Link>
            ))}
          </section>
          <section className="rounded-[1.4rem] bg-[var(--paper-white)] p-5">
            <h3 className="font-display text-2xl">Mistake review</h3>
            {progress.mistakes.length ? (
              <ul className="mt-3 space-y-2">
                {progress.mistakes.slice(0, 12).map((item) => (
                  <li key={`${item.lessonId}:${item.exerciseId}`}>
                    <Link
                      className="flex min-h-11 items-center text-xs text-[var(--rust)] underline underline-offset-4"
                      href={`/italian-corner/academy/${item.lessonId}#${item.exerciseId}`}
                    >
                      {item.lessonId} · {item.exerciseId} · {item.latestScore}%
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-3 text-xs leading-6 text-[var(--muted)]">
                Nothing to review yet.
              </p>
            )}
            <p className="mt-3 border-t border-[var(--line)] pt-3 text-xs text-[var(--muted)]">
              Vocabulary due: {progress.vocabularyDue}
            </p>
          </section>
        </aside>
      </div>
    </div>
  );
}
