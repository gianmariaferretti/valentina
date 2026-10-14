import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { LevelExam } from "@/features/italian-corner/academy/level-exam";
import { getPublishedLessons } from "@/features/italian-corner/academy/lesson-store";

export const metadata: Metadata = { title: "Italian level examination" };

export default async function LevelExamPage({
  params,
}: {
  params: Promise<{ level: string }>;
}) {
  const raw = (await params).level.toUpperCase();
  if (raw !== "A2" && raw !== "B1" && raw !== "B2") notFound();
  const level = raw;
  const lessons = (await getPublishedLessons()).filter(
    (lesson) => lesson.level === level,
  );
  const questions = lessons
    .flatMap((lesson) =>
      lesson.exercises
        .filter((exercise) => exercise.type === "multiple-choice")
        .map((exercise) => ({
          key: `${lesson.id}:${exercise.id}`,
          prompt: exercise.prompt,
          options: exercise.options,
        })),
    )
    .slice(0, 10);
  const passing = level === "A2" ? 70 : level === "B1" ? 75 : 80;
  return (
    <div className="page-container py-8 sm:py-12 lg:py-16">
      <Link
        className="inline-flex min-h-11 items-center text-xs font-bold uppercase"
        href="/italian-corner/academy"
      >
        ← La Dolce Lingua
      </Link>
      <header className="mt-6 rounded-[1.8rem] bg-[var(--oxblood)] p-7 text-white sm:p-10">
        <p className="text-xs font-bold tracking-[0.18em] text-white/60 uppercase">
          Academy examination
        </p>
        <h1 className="mt-5 font-display text-[clamp(3rem,7vw,6rem)] leading-[0.9]">
          {level} · Final paper
        </h1>
        <p className="mt-4 text-sm text-white/70">
          A record of what you learned, not a judgment of who you are.
        </p>
      </header>
      <LevelExam level={level} passing={passing} questions={questions} />
    </div>
  );
}
