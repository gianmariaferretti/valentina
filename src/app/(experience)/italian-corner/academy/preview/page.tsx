import { notFound } from "next/navigation";

import { publicLesson } from "@/features/italian-corner/academy/exercise-domain";
import { LessonReader } from "@/features/italian-corner/academy/lesson-reader";
import { getLesson } from "@/features/italian-corner/academy/lesson-store";

export default async function LessonPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ lesson?: string }>;
}) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { lesson: requestedId } = await searchParams;
  const lesson = await getLesson(requestedId ?? "a2-001", true);
  if (!lesson) notFound();
  return <LessonReader lesson={publicLesson(lesson)} preview />;
}
