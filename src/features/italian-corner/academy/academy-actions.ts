"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";
import type { Json } from "@/lib/supabase/database.types";

import { scoreExercise, type ExerciseAnswer } from "./exercise-domain";
import { getLesson, getPublishedLessons } from "./lesson-store";

export interface AcademyProgress {
  lessons: {
    lessonId: string;
    status: string;
    bestScore: number | null;
    lastActivityAt: string;
  }[];
  mistakes: { lessonId: string; exerciseId: string; latestScore: number }[];
  vocabularyDue: number;
  exams: {
    level: string;
    score: number;
    passed: boolean;
    completedAt: string;
  }[];
  badges: string[];
  failed: boolean;
}

export async function loadAcademyProgress(): Promise<AcademyProgress> {
  const empty: AcademyProgress = {
    lessons: [],
    mistakes: [],
    vocabularyDue: 0,
    exams: [],
    badges: [],
    failed: true,
  };
  if (!(await hasValidAccessSession())) return empty;
  try {
    const { client, userId } = getSupabaseServerContext();
    const [lessons, exercises, vocabulary, exams, badges] = await Promise.all([
      client
        .from("italian_lesson_progress")
        .select("lesson_id,status,best_score,last_activity_at")
        .eq("user_id", userId)
        .order("last_activity_at", { ascending: false }),
      client
        .from("italian_exercise_results")
        .select("lesson_id,exercise_id,latest_score")
        .eq("user_id", userId)
        .lt("latest_score", 100),
      client
        .from("italian_vocabulary_review")
        .select("vocabulary_id")
        .eq("user_id", userId)
        .lte("due_at", new Date().toISOString()),
      client
        .from("italian_level_exams")
        .select("level,score,passed,completed_at")
        .eq("user_id", userId)
        .order("completed_at", { ascending: false }),
      client
        .from("achievements")
        .select("achievement_id")
        .eq("user_id", userId)
        .like("achievement_id", "italian-academy-%"),
    ]);
    for (const [name, result] of [
      ["lessons", lessons],
      ["exercises", exercises],
      ["vocabulary", vocabulary],
      ["exams", exams],
      ["badges", badges],
    ] as const)
      assertSupabaseResult(`Unable to load Academy ${name}.`, result.error);
    const exerciseRows = exercises.data ?? [];
    const lessonIds = [...new Set(exerciseRows.map((row) => row.lesson_id))];
    const referencedLessons = await Promise.all(
      lessonIds.map((lessonId) => getLesson(lessonId)),
    );
    const lessonById = new Map(
      referencedLessons
        .filter((lesson) => lesson !== null)
        .map((lesson) => [lesson.id, lesson]),
    );
    return {
      lessons: (lessons.data ?? []).map((row) => ({
        lessonId: row.lesson_id,
        status: row.status,
        bestScore: row.best_score,
        lastActivityAt: row.last_activity_at,
      })),
      mistakes: exerciseRows
        .filter((row) =>
          lessonById
            .get(row.lesson_id)
            ?.exercises.some(
              (exercise) =>
                exercise.id === row.exercise_id && exercise.type !== "writing",
            ),
        )
        .map((row) => ({
          lessonId: row.lesson_id,
          exerciseId: row.exercise_id,
          latestScore: row.latest_score,
        })),
      vocabularyDue: vocabulary.data?.length ?? 0,
      exams: (exams.data ?? []).map((row) => ({
        level: row.level,
        score: row.score,
        passed: row.passed,
        completedAt: row.completed_at,
      })),
      badges: (badges.data ?? []).map((row) => row.achievement_id),
      failed: false,
    };
  } catch (error) {
    reportPersistenceFailure("load Italian Academy progress", error);
    return empty;
  }
}

function validAnswer(answer: unknown): answer is ExerciseAnswer {
  if (typeof answer === "string") return answer.length <= 1000;
  if (Array.isArray(answer))
    return (
      answer.length <= 30 &&
      answer.every((part) => typeof part === "string" && part.length <= 100)
    );
  if (answer && typeof answer === "object")
    return (
      Object.keys(answer).length <= 30 &&
      Object.entries(answer).every(
        ([key, value]) =>
          key.length <= 100 && typeof value === "string" && value.length <= 100,
      )
    );
  return false;
}

export async function submitLessonExercise(input: {
  lessonId: string;
  exerciseId: string;
  answer: unknown;
  preview?: boolean;
}) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Private session expired." };
  if (
    !input ||
    !/^(a2|b1|b2)-\d{3}$/.test(input.lessonId) ||
    typeof input.exerciseId !== "string" ||
    !validAnswer(input.answer)
  )
    return { ok: false as const, message: "Invalid exercise response." };
  const preview =
    process.env.NODE_ENV === "development" && input.preview === true;
  const lesson = await getLesson(input.lessonId, preview);
  const exercise = lesson?.exercises.find(
    (item) => item.id === input.exerciseId,
  );
  if (!exercise)
    return { ok: false as const, message: "This exercise is not available." };
  const result = scoreExercise(exercise, input.answer);
  if (preview)
    return {
      ok: true as const,
      ...result,
      attempts: 1,
      bestScore: result.score,
      preview: true,
    };
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("record_italian_exercise", {
      p_user_id: userId,
      p_lesson_id: lesson!.id,
      p_exercise_id: exercise.id,
      p_score: result.score,
      p_answer: input.answer as Json,
    });
    assertSupabaseResult("Unable to save exercise result.", error);
    if (!data?.[0]) throw new Error("Exercise result missing.");
    revalidatePath("/italian-corner/academy");
    return {
      ok: true as const,
      ...result,
      attempts: data[0].attempts,
      bestScore: data[0].best_score,
      preview: false,
    };
  } catch (error) {
    reportPersistenceFailure("save Italian exercise", error);
    return {
      ok: false as const,
      message: "The exercise could not be saved. Please retry.",
    };
  }
}

export async function reviewVocabulary(input: {
  lessonId: string;
  wordId: string;
  known: boolean;
}) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Private session expired." };
  if (
    !input ||
    typeof input.known !== "boolean" ||
    !/^(a2|b1|b2)-\d{3}$/.test(input.lessonId)
  )
    return { ok: false as const, message: "Invalid review." };
  const lesson = await getLesson(input.lessonId);
  if (!lesson?.vocabulary.some((word) => word.id === input.wordId))
    return { ok: false as const, message: "Word not found." };
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc(
      "record_italian_vocabulary_review",
      {
        p_user_id: userId,
        p_vocabulary_id: `${lesson.id}:${input.wordId}`,
        p_known: input.known,
      },
    );
    assertSupabaseResult("Unable to save vocabulary review.", error);
    if (!data?.[0]) throw new Error("Vocabulary review missing.");
    revalidatePath("/italian-corner/academy");
    return {
      ok: true as const,
      message: input.known
        ? "Remembered. Next review in three days."
        : "Saved for tomorrow's review.",
    };
  } catch (error) {
    reportPersistenceFailure("save vocabulary review", error);
    return { ok: false as const, message: "Review could not be saved." };
  }
}

export async function completeLesson(lessonId: string) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Private session expired." };
  const lesson = await getLesson(lessonId);
  if (!lesson?.finalAssessment)
    return {
      ok: false as const,
      message: "This lesson has no final assessment yet.",
    };
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("italian_exercise_results")
      .select("exercise_id,best_score")
      .eq("user_id", userId)
      .eq("lesson_id", lesson.id)
      .in("exercise_id", lesson.finalAssessment.exerciseIds);
    assertSupabaseResult("Unable to inspect final assessment.", error);
    const results = data ?? [];
    if (results.length !== lesson.finalAssessment.exerciseIds.length)
      return {
        ok: false as const,
        message: "Complete every final assessment activity first.",
      };
    const score = Math.round(
      results.reduce((sum, row) => sum + row.best_score, 0) / results.length,
    );
    if (score < lesson.finalAssessment.passingPercent)
      return {
        ok: false as const,
        message: `Your assessment average is ${score}%. You need ${lesson.finalAssessment.passingPercent}%.`,
        score,
      };
    const saved = await client.rpc("complete_italian_lesson", {
      p_user_id: userId,
      p_lesson_id: lesson.id,
      p_score: score,
    });
    assertSupabaseResult("Unable to complete lesson.", saved.error);
    revalidatePath("/italian-corner/academy");
    revalidatePath("/achievements");
    return {
      ok: true as const,
      message: `Lesson completed with ${score}%.`,
      score,
    };
  } catch (error) {
    reportPersistenceFailure("complete Italian lesson", error);
    return {
      ok: false as const,
      message: "Lesson completion could not be saved.",
    };
  }
}

export async function submitLevelExam(
  level: "A2" | "B1" | "B2",
  answers: Record<string, string>,
) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Private session expired." };
  if (
    !["A2", "B1", "B2"].includes(level) ||
    !answers ||
    typeof answers !== "object" ||
    Array.isArray(answers)
  )
    return { ok: false as const, message: "Invalid examination." };
  const lessons = (await getPublishedLessons()).filter(
    (lesson) => lesson.level === level,
  );
  const questions = lessons
    .flatMap((lesson) =>
      lesson.exercises
        .filter((exercise) => exercise.type === "multiple-choice")
        .map((exercise) => ({ lesson, exercise })),
    )
    .slice(0, 10);
  if (questions.length < 10 || questions.length !== Object.keys(answers).length)
    return {
      ok: false as const,
      message: "This level examination is not ready or has missing answers.",
    };
  const keys = questions.map(
    ({ lesson, exercise }) => `${lesson.id}:${exercise.id}`,
  );
  if (Object.keys(answers).some((key) => !keys.includes(key)))
    return { ok: false as const, message: "Unknown examination answer." };
  const score = Math.round(
    questions.reduce(
      (sum, { lesson, exercise }) =>
        sum +
        scoreExercise(exercise, answers[`${lesson.id}:${exercise.id}`]).score,
      0,
    ) / questions.length,
  );
  const passing = level === "A2" ? 70 : level === "B1" ? 75 : 80;
  try {
    const { client, userId } = getSupabaseServerContext();
    const { error } = await client.rpc("record_italian_level_exam", {
      p_id: randomUUID(),
      p_user_id: userId,
      p_level: level,
      p_score: score,
    });
    assertSupabaseResult("Unable to save level examination.", error);
    revalidatePath("/italian-corner/academy");
    return {
      ok: true as const,
      score,
      passed: score >= passing,
      message:
        score >= passing
          ? `${level} level passed.`
          : `${level} level recorded. Keep practicing.`,
    };
  } catch (error) {
    reportPersistenceFailure("save Italian level exam", error);
    return {
      ok: false as const,
      message: "Level examination could not be saved.",
    };
  }
}
