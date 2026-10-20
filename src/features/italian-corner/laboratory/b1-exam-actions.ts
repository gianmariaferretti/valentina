"use server";

import { revalidatePath } from "next/cache";

import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

import {
  b1ExamQuestions,
  b1WritingTasks,
  gradeB1Pilot,
  validB1Answers,
} from "./b1-exam-store";

export async function loadB1PilotDraft() {
  if (!(await hasValidAccessSession()))
    return {
      answers: {} as Record<string, number>,
      writing: {} as Record<string, string>,
      failed: true,
    };
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("italian_exercise_results")
      .select("exercise_id,last_answer")
      .eq("user_id", userId)
      .eq("lesson_id", "b1-100");
    assertSupabaseResult("Unable to load B1 pilot draft.", error);
    const answers: Record<string, number> = {};
    const writing: Record<string, string> = {};
    const questions = new Map(b1ExamQuestions().map((item) => [item.id, item]));
    const taskIds = new Set(b1WritingTasks().map((item) => item.id));
    for (const row of data ?? []) {
      const key = row.exercise_id.replace(/^pilot-/, "");
      const value = row.last_answer;
      if (
        questions.has(key) &&
        typeof value === "number" &&
        Number.isInteger(value)
      )
        answers[key] = value;
      if (taskIds.has(key) && typeof value === "string") writing[key] = value;
    }
    return { answers, writing, failed: false };
  } catch (error) {
    reportPersistenceFailure("load B1 pilot draft", error);
    return {
      answers: {} as Record<string, number>,
      writing: {} as Record<string, string>,
      failed: true,
    };
  }
}

export async function submitB1Pilot(input: {
  answers: Record<string, number>;
  writing: Record<string, string>;
}) {
  if (
    !input ||
    typeof input.answers !== "object" ||
    !input.answers ||
    !validB1Answers(input.answers) ||
    typeof input.writing !== "object" ||
    !input.writing ||
    !(await hasValidAccessSession())
  )
    return {
      ok: false as const,
      message: "Completa tutte le domande a scelta multipla e riprova.",
    };
  const tasks = b1WritingTasks();
  for (const task of tasks) {
    const value = input.writing[task.id] ?? "";
    if (typeof value !== "string" || value.length > 5000)
      return { ok: false as const, message: "Testo scritto non valido." };
  }
  const grade = gradeB1Pilot(input.answers);
  try {
    const { client, userId } = getSupabaseServerContext();
    // Store individual exercise state, never call record_italian_level_exam:
    // audio, human writing assessment and the oral component are unavailable.
    for (const question of b1ExamQuestions()) {
      const saved = await client.rpc("record_italian_exercise", {
        p_user_id: userId,
        p_lesson_id: "b1-100",
        p_exercise_id: `pilot-${question.id}`,
        p_score:
          input.answers[question.id] === question.correct_answer ? 100 : 0,
        p_answer: input.answers[question.id],
      });
      assertSupabaseResult("Unable to save B1 pilot answer.", saved.error);
    }
    for (const task of tasks) {
      const answer = input.writing[task.id]?.trim();
      if (!answer) continue;
      const saved = await client.rpc("record_italian_exercise", {
        p_user_id: userId,
        p_lesson_id: "b1-100",
        p_exercise_id: `pilot-${task.id}`,
        p_score: 0,
        p_answer: answer,
      });
      assertSupabaseResult("Unable to save B1 pilot writing.", saved.error);
    }
    revalidatePath("/la-dolce-lingua/esame-b1");
    return {
      ok: true as const,
      ...grade,
      message:
        "Risposte salvate. Risultato parziale, non una certificazione B1.",
    };
  } catch (error) {
    reportPersistenceFailure("save B1 pilot attempt", error);
    return {
      ok: false as const,
      message:
        "Non tutte le risposte sono state salvate. Riprova: i salvataggi già riusciti restano nel quaderno.",
    };
  }
}
