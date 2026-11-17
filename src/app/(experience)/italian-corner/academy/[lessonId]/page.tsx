import { notFound, redirect } from "next/navigation";

import { lessonHref } from "@/features/italian-corner/original-academy/lesson-store";
import { requireAccessSession } from "@/lib/auth/session";

export default async function LegacyAcademyLessonPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  await requireAccessSession();
  const { lessonId } = await params;
  const match = lessonId.match(/^(?:a2|b1|b2)-(\d{3})$/);
  if (!match || Number(match[1]) < 1 || Number(match[1]) > 80) notFound();
  redirect(lessonHref(Number(match[1])));
}
