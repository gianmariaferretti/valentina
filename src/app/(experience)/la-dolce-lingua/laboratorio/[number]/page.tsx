import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { loadLaboratoryResponses } from "@/features/italian-corner/laboratory/laboratory-actions";
import { LaboratoryLesson } from "@/features/italian-corner/laboratory/laboratory-lesson";
import {
  getLaboratoryLesson,
  publicLaboratoryLesson,
} from "@/features/italian-corner/laboratory/laboratory-store";

export const metadata: Metadata = {
  title: "Laboratorio · La Dolce Lingua",
  robots: { index: false, follow: false },
};

export default async function LaboratoryLessonPage({
  params,
}: {
  params: Promise<{ number: string }>;
}) {
  const { number: raw } = await params;
  if (!/^\d{3}$/.test(raw)) notFound();
  const lesson = getLaboratoryLesson(Number(raw));
  if (!lesson) notFound();
  const responses = await loadLaboratoryResponses(lesson.number);
  return (
    <LaboratoryLesson
      lesson={publicLaboratoryLesson(lesson)}
      responses={responses}
    />
  );
}
