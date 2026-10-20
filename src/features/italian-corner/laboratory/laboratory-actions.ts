"use server";

import { revalidatePath } from "next/cache";

import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

import {
  getLaboratoryLesson,
  gradeLaboratoryAnswer,
  laboratoryHref,
} from "./laboratory-store";

export async function loadLaboratoryResponses(number: number) {
  const lesson = getLaboratoryLesson(number);
  if (!lesson || !(await hasValidAccessSession())) return [];
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("italian_exercise_results")
      .select("exercise_id,last_answer,latest_score")
      .eq("user_id", userId)
      .eq(
        "lesson_id",
        `${lesson.level.toLowerCase()}-${String(number).padStart(3, "0")}`,
      );
    assertSupabaseResult("Unable to load Italian laboratory responses.", error);
    return (data ?? []).map((row) => ({
      exerciseId: row.exercise_id,
      answer: typeof row.last_answer === "string" ? row.last_answer : "",
      score: row.latest_score,
    }));
  } catch (error) {
    reportPersistenceFailure("load Italian laboratory responses", error);
    return [];
  }
}

export async function visitLaboratoryLesson(number: number) {
  const lesson = getLaboratoryLesson(number);
  if (!lesson || !(await hasValidAccessSession()))
    return { ok: false as const, message: "Sessione non disponibile." };
  try {
    const { client, userId } = getSupabaseServerContext();
    const lessonId = `${lesson.level.toLowerCase()}-${String(number).padStart(3, "0")}`;
    const inserted = await client
      .from("italian_lesson_progress")
      .upsert(
        { user_id: userId, lesson_id: lessonId },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      );
    assertSupabaseResult(
      "Unable to start Italian laboratory lesson.",
      inserted.error,
    );
    const touched = await client
      .from("italian_lesson_progress")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("lesson_id", lessonId);
    assertSupabaseResult(
      "Unable to update Italian laboratory visit.",
      touched.error,
    );
    return { ok: true as const, message: "" };
  } catch (error) {
    reportPersistenceFailure("visit Italian laboratory lesson", error);
    return {
      ok: false as const,
      message: "Puoi studiare la lezione, ma il progresso non è disponibile.",
    };
  }
}

export async function saveLaboratoryAnswer(input: {
  number: number;
  activityId: string;
  answer: string;
}) {
  if (
    !input ||
    !Number.isInteger(input.number) ||
    typeof input.activityId !== "string" ||
    typeof input.answer !== "string" ||
    !input.answer.trim() ||
    input.answer.length > 2000 ||
    !(await hasValidAccessSession())
  )
    return { ok: false as const, message: "Risposta o sessione non valida." };
  const lesson = getLaboratoryLesson(input.number);
  const activity = lesson?.activities.find(
    (item) => item.id === input.activityId,
  );
  if (!lesson || !activity)
    return { ok: false as const, message: "Attività inesistente." };
  const score = gradeLaboratoryAnswer(lesson, activity, input.answer);
  try {
    const { client, userId } = getSupabaseServerContext();
    const saved = await client.rpc("record_italian_exercise", {
      p_user_id: userId,
      p_lesson_id: `${lesson.level.toLowerCase()}-${String(lesson.number).padStart(3, "0")}`,
      p_exercise_id: activity.id,
      p_score: score ?? 0,
      p_answer: input.answer,
    });
    assertSupabaseResult(
      "Unable to save Italian laboratory answer.",
      saved.error,
    );
    revalidatePath(laboratoryHref(lesson.number));
    revalidatePath("/la-dolce-lingua/laboratorio");
    return {
      ok: true as const,
      score,
      modelAnswer:
        lesson.status === "editorial-draft"
          ? (activity.modelAnswer ?? activity.answers[0] ?? null)
          : null,
      feedback: lesson.status === "editorial-draft" ? activity.feedback : null,
      message:
        lesson.status === "source-draft"
          ? "Risposta salvata. Questo fascicolo è in revisione e non mostra una correzione automatica."
          : score === null
            ? "Risposta salvata. Confrontala con la guida; non è stata valutata automaticamente."
            : score === 100
              ? "Forma riconosciuta."
              : "Risposta salvata. Rileggi la regola e confronta la soluzione.",
    };
  } catch (error) {
    reportPersistenceFailure("save Italian laboratory answer", error);
    return {
      ok: false as const,
      message: "La risposta non è stata salvata. Riprova.",
    };
  }
}
