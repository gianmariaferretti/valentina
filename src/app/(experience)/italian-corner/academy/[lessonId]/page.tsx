import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { publicLesson } from "@/features/italian-corner/academy/exercise-domain";
import { LessonReader } from "@/features/italian-corner/academy/lesson-reader";
import { getLesson } from "@/features/italian-corner/academy/lesson-store";

export const metadata: Metadata = { title: "Italian lesson" };

export default async function LessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await getLesson(lessonId);
  if (!lesson) notFound();
  return <LessonReader lesson={publicLesson(lesson)} preview={false} />;
}
