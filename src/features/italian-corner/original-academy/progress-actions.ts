"use server";

import { revalidatePath } from "next/cache";

import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

import { gradeOriginalExercise, prepareLesson } from "./lesson-model";
import { getOriginalLesson, lessonHref } from "./lesson-store";
import {
  buildSupplementalActivities,
  gradeSupplementalActivity,
} from "./supplemental-model";

export type OriginalProgress = {
  lessons: {
    lessonId: string;
    status: string;
    lastActivityAt: string;
    bestScore: number | null;
  }[];
  failed: boolean;
};

export async function loadOriginalProgress(): Promise<OriginalProgress> {
  const fallback: OriginalProgress = { lessons: [], failed: true };
  if (!(await hasValidAccessSession())) return fallback;
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("italian_lesson_progress")
      .select("lesson_id,status,last_activity_at,best_score")
      .eq("user_id", userId)
      .order("last_activity_at", { ascending: false });
    assertSupabaseResult("Unable to load Italian lesson progress.", error);
    return {
      lessons: (data ?? []).map((row) => ({
        lessonId: row.lesson_id,
        status: row.status,
        lastActivityAt: row.last_activity_at,
        bestScore: row.best_score,
      })),
      failed: false,
    };
  } catch (error) {
    reportPersistenceFailure("load original Italian lesson progress", error);
    return fallback;
  }
}

export async function loadOriginalResponses(lessonId: string) {
  if (!(await hasValidAccessSession())) return [];
  const number = Number(lessonId.slice(-3));
  const lesson = await getOriginalLesson(number);
  if (!lesson || lesson.id !== lessonId) return [];
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("italian_exercise_results")
      .select("exercise_id,last_answer,latest_score")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId);
    assertSupabaseResult("Unable to load Italian exercise answers.", error);
    return (data ?? []).map((row) => ({
      exerciseId: row.exercise_id,
      answer: typeof row.last_answer === "string" ? row.last_answer : "",
      score: row.latest_score,
    }));
  } catch (error) {
    reportPersistenceFailure("load original Italian exercise answers", error);
    return [];
  }
}

export async function visitOriginalLesson(lessonId: string) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Sessione scaduta." };
  const lesson = await getOriginalLesson(Number(lessonId.slice(-3)));
  if (!lesson || lesson.id !== lessonId)
    return { ok: false as const, message: "Lezione inesistente." };
  try {
    const { client, userId } = getSupabaseServerContext();
    const started = await client
      .from("italian_lesson_progress")
      .upsert(
        { user_id: userId, lesson_id: lessonId },
        { onConflict: "user_id,lesson_id", ignoreDuplicates: true },
      );
    assertSupabaseResult("Unable to start Italian lesson.", started.error);
    const touched = await client
      .from("italian_lesson_progress")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("user_id", userId)
      .eq("lesson_id", lessonId);
    assertSupabaseResult(
      "Unable to update Italian lesson visit.",
      touched.error,
    );
    revalidatePath("/la-dolce-lingua");
    return { ok: true as const, message: "" };
  } catch (error) {
    reportPersistenceFailure("visit original Italian lesson", error);
    return {
      ok: false as const,
      message: "Progressi non disponibili; puoi comunque leggere la lezione.",
    };
  }
}

export async function submitOriginalExercise(input: {
  lessonId: string;
  exerciseId: string;
  answer: string;
}) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Sessione scaduta." };
  if (
    !input ||
    typeof input.answer !== "string" ||
    input.answer.length > 1000 ||
    !input.answer.trim()
  )
    return {
      ok: false as const,
      message: "Scrivi una risposta prima di inviare.",
    };
  const lesson = await getOriginalLesson(Number(input.lessonId?.slice(-3)));
  if (!lesson || lesson.id !== input.lessonId)
    return { ok: false as const, message: "Lezione inesistente." };
  const exercise = prepareLesson(lesson)
    .flatMap((section) => section.exercises)
    .find((item) => item.id === input.exerciseId);
  if (!exercise)
    return { ok: false as const, message: "Attività inesistente." };
  const score = gradeOriginalExercise(exercise, input.answer);
  try {
    const { client, userId } = getSupabaseServerContext();
    const saved = await client.rpc("record_italian_exercise", {
      p_user_id: userId,
      p_lesson_id: lesson.id,
      p_exercise_id: exercise.id,
      p_score: score ?? 0,
      p_answer: input.answer,
    });
    assertSupabaseResult(
      "Unable to save original Italian exercise.",
      saved.error,
    );
    revalidatePath(lessonHref(lesson.number));
    revalidatePath("/la-dolce-lingua");
    return {
      ok: true as const,
      score,
      feedback: exercise.originalFeedback,
      modelAnswer: exercise.modelAnswer,
      message:
        score === null
          ? "Risposta salvata. Confrontala con le indicazioni originali."
          : score === 100
            ? "Risposta conforme alla soluzione del manuale."
            : "Confronta la tua risposta con la soluzione originale.",
    };
  } catch (error) {
    reportPersistenceFailure("save original Italian exercise", error);
    return {
      ok: false as const,
      message: "La risposta non è stata salvata. Riprova.",
    };
  }
}

export async function submitSupplementalActivity(input: {
  lessonId: string;
  activityId: string;
  answer: string;
}) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Sessione scaduta." };
  if (
    !input ||
    typeof input.answer !== "string" ||
    !input.answer.trim() ||
    input.answer.length > 1000
  )
    return {
      ok: false as const,
      message: "Scrivi una risposta prima di inviare.",
    };
  const lesson = await getOriginalLesson(Number(input.lessonId?.slice(-3)));
  if (!lesson || lesson.id !== input.lessonId)
    return { ok: false as const, message: "Lezione inesistente." };
  const activity = buildSupplementalActivities(lesson).find(
    (item) => item.id === input.activityId,
  );
  if (!activity)
    return { ok: false as const, message: "Attività inesistente." };
  if (
    activity.kind === "flashcard" &&
    !["known", "again"].includes(input.answer)
  )
    return { ok: false as const, message: "Ripasso non valido." };
  const score =
    activity.kind === "flashcard"
      ? input.answer === "known"
        ? 100
        : 0
      : (gradeSupplementalActivity(activity, input.answer) ?? 0);
  try {
    const { client, userId } = getSupabaseServerContext();
    const saved = await client.rpc("record_italian_exercise", {
      p_user_id: userId,
      p_lesson_id: lesson.id,
      p_exercise_id: activity.id,
      p_score: score,
      p_answer: input.answer,
    });
    assertSupabaseResult(
      "Unable to save supplemental Italian activity.",
      saved.error,
    );
    revalidatePath(lessonHref(lesson.number));
    revalidatePath("/la-dolce-lingua");
    return {
      ok: true as const,
      score: activity.kind === "flashcard" ? null : score,
      feedback: activity.explanation,
      modelAnswer: activity.kind === "flashcard" ? null : activity.answer,
      message:
        activity.kind === "flashcard"
          ? "Ripasso registrato."
          : score === 100
            ? "Corretto: hai ritrovato la forma nell'esempio."
            : activity.kind === "translation"
              ? "Confronta con la soluzione guida; una variante equivalente può essere corretta."
              : "Rileggi l'esempio e riprova.",
    };
  } catch (error) {
    reportPersistenceFailure("save supplemental Italian activity", error);
    return {
      ok: false as const,
      message: "La risposta non è stata salvata. Riprova.",
    };
  }
}

export async function revealOriginalSolutions(lessonId: string) {
  if (!(await hasValidAccessSession())) return [];
  const lesson = await getOriginalLesson(Number(lessonId.slice(-3)));
  if (!lesson || lesson.id !== lessonId) return [];
  return prepareLesson(lesson)
    .filter((section) => section.kind === "solutions")
    .map((section) => ({
      heading: section.heading,
      paragraphs: section.paragraphs,
    }));
}

export async function completeOriginalLesson(lessonId: string) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Sessione scaduta." };
  const lesson = await getOriginalLesson(Number(lessonId.slice(-3)));
  if (!lesson || lesson.id !== lessonId)
    return { ok: false as const, message: "Lezione inesistente." };
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("italian_exercise_results")
      .select("exercise_id,best_score")
      .eq("user_id", userId)
      .eq("lesson_id", lessonId);
    assertSupabaseResult("Unable to inspect Italian lesson responses.", error);
    if (!data?.length)
      return {
        ok: false as const,
        message: "Prova almeno un’attività prima di completare la lezione.",
      };
    const gradable = new Set([
      ...prepareLesson(lesson)
        .flatMap((section) => section.exercises)
        .filter((item) => ["choice", "fill", "order"].includes(item.mode))
        .map((item) => item.id),
      ...buildSupplementalActivities(lesson)
        .filter((item) => item.kind !== "flashcard")
        .map((item) => item.id),
    ]);
    const scores = data
      .filter((row) => gradable.has(row.exercise_id))
      .map((row) => row.best_score);
    const score = scores.length
      ? Math.round(
          scores.reduce((sum, value) => sum + value, 0) / scores.length,
        )
      : 0;
    const saved = await client.rpc("complete_italian_lesson", {
      p_user_id: userId,
      p_lesson_id: lessonId,
      p_score: score,
    });
    assertSupabaseResult(
      "Unable to complete original Italian lesson.",
      saved.error,
    );
    revalidatePath("/la-dolce-lingua");
    revalidatePath(lessonHref(lesson.number));
    revalidatePath("/achievements");
    return { ok: true as const, message: "Lezione completata. Bravissima!" };
  } catch (error) {
    reportPersistenceFailure("complete original Italian lesson", error);
    return {
      ok: false as const,
      message: "Completamento non salvato. Riprova.",
    };
  }
}
