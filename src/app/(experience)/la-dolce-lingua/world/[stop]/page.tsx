import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import {
  italianWorlds,
  worldStops,
  worldForLesson,
} from "@/data/italian-world";
import {
  originalCurriculum,
  lessonHref,
} from "@/features/italian-corner/original-academy/lesson-store";
import { loadOriginalProgress } from "@/features/italian-corner/original-academy/progress-actions";

export const metadata: Metadata = {
  title: "La Dolce Lingua World · Stop",
  robots: { index: false, follow: false },
};

export default async function WorldStopPage({
  params,
}: {
  params: Promise<{ stop: string }>;
}) {
  const { stop: raw } = await params;
  const stop = worldStops.find(
    (item) => String(item.id) === raw && item.published,
  );
  if (!stop || !stop.worldId) notFound();
  const progress = await loadOriginalProgress();
  const completed = new Set(
    progress.lessons
      .filter((item) => item.status === "completed")
      .map((item) => item.lessonId),
  );
  const lessons = originalCurriculum.filter(
    (lesson) =>
      lesson.number >= stop.firstLesson && lesson.number <= stop.lastLesson,
  );
  const leadWorld = italianWorlds.find((world) => world.id === stop.worldId);
  if (!leadWorld || lessons.length !== 10) notFound();

  return (
    <main className="academy-stop-page mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <Link
        className="academy-focus inline-flex min-h-11 items-center text-xs font-bold tracking-widest uppercase"
        href="/la-dolce-lingua#world-map"
      >
        ← Back to the world map
      </Link>
      <header
        className="academy-stop-cover mt-6"
        style={
          {
            "--stop-sky": leadWorld.palette.sky,
            "--stop-ground": leadWorld.palette.ground,
          } as React.CSSProperties
        }
      >
        <Image
          alt=""
          aria-hidden="true"
          className="academy-stop-cover-image"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          src={`/images/academy/world-${leadWorld.id}.webp`}
        />
        <span aria-hidden="true" className="academy-stop-cover-shade" />
        <p>WORLD STOP {String(stop.id).padStart(2, "0")} / XV</p>
        <h1>{leadWorld.name}</h1>
        <span>{leadWorld.description}</span>
        <strong>
          Lessons {String(stop.firstLesson).padStart(3, "0")}–
          {String(stop.lastLesson).padStart(3, "0")}
        </strong>
      </header>
      {progress.failed ? (
        <p className="mt-4 text-sm" role="status">
          Progress is temporarily unavailable; lessons remain readable.
        </p>
      ) : null}
      <ol className="academy-stop-lessons mt-8">
        {lessons.map((lesson) => {
          const world = worldForLesson(lesson.number);
          return (
            <li key={lesson.id}>
              <Link className="academy-focus" href={lessonHref(lesson.number)}>
                <span className="academy-stop-lessons-number">
                  {String(lesson.number).padStart(3, "0")}
                </span>
                <span>
                  <strong>{lesson.title}</strong>
                  <small>
                    {world?.name} · {world?.description}
                  </small>
                </span>
                <span className="academy-stop-lessons-state">
                  {completed.has(lesson.id) ? "APPROVATO" : "OPEN ↗"}
                </span>
              </Link>
            </li>
          );
        })}
      </ol>
      <p className="mt-8 text-sm text-[#52614f]">
        The lesson text and answer keys are unchanged. Each place is a new way
        to enter the original material.
      </p>
    </main>
  );
}
