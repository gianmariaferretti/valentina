import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { LessonExperience } from "@/features/italian-corner/original-academy/lesson-experience";
import {
  prepareLesson,
  publicSections,
} from "@/features/italian-corner/original-academy/lesson-model";
import {
  getOriginalLesson,
  lessonHref,
} from "@/features/italian-corner/original-academy/lesson-store";
import { loadOriginalResponses } from "@/features/italian-corner/original-academy/progress-actions";
import {
  buildSupplementalActivities,
  publicSupplementalActivities,
} from "@/features/italian-corner/original-academy/supplemental-model";

export const metadata: Metadata = {
  title: "La Dolce Lingua · Lezione",
  robots: { index: false, follow: false },
};

export default async function OriginalLessonPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number: raw } = await params;
  if (!/^\d{3}$/.test(raw)) notFound();
  const lesson = await getOriginalLesson(Number(raw));
  if (!lesson) notFound();
  const responses = await loadOriginalResponses(lesson.id);
  const sections = publicSections(prepareLesson(lesson));
  const supplemental = publicSupplementalActivities(
    buildSupplementalActivities(lesson),
  );
  const objective = lesson.paragraphs
    .find((paragraph) => /^OBIETTIVO\b/i.test(paragraph.text))
    ?.text.replace(/^OBIETTIVO\s*[•·:]?\s*/i, "");
  return (
    <LessonExperience
      lessonId={lesson.id}
      level={lesson.level}
      nextHref={lesson.number < 80 ? lessonHref(lesson.number + 1) : null}
      number={lesson.number}
      objective={objective ?? null}
      previousHref={lesson.number > 1 ? lessonHref(lesson.number - 1) : null}
      responses={responses}
      sections={sections}
      supplemental={supplemental}
      title={lesson.title}
      volume={lesson.volume}
    />
  );
}
