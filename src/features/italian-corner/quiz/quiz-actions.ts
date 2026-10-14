"use server";

import { randomInt, randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import type { Json } from "@/lib/supabase/database.types";
import { hasValidAccessSession } from "@/lib/auth/session";
import {
  getSupabaseServerContext,
  assertSupabaseResult,
} from "@/lib/supabase/server";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

import { getBank, quizDefinitions, type QuizId } from "./question-bank";
import {
  createOptionOrders,
  presentQuestions,
  scoreAnswers,
  selectItalianQuestions,
  shuffled,
  type ActiveCornerAttempt,
  type CornerQuizSnapshot,
} from "./quiz-domain";

const random = () => randomInt(0, 0x100000000) / 0x100000000;
const validQuiz = (id: string): id is QuizId =>
  id === "italian" || id === "gianmaria";

function parsePaper(row: {
  id: string;
  quiz_id: string;
  expires_at: string;
  question_ids: Json;
  option_orders: Json;
}): ActiveCornerAttempt {
  if (
    !validQuiz(row.quiz_id) ||
    !Array.isArray(row.question_ids) ||
    !row.question_ids.every((id) => typeof id === "string")
  ) {
    throw new Error("Invalid saved quiz paper.");
  }
  const orders = row.option_orders as Record<string, number[]>;
  return {
    id: row.id,
    quizId: row.quiz_id,
    expiresAt: row.expires_at,
    questions: presentQuestions(row.question_ids, orders, getBank(row.quiz_id)),
  };
}

export async function loadCornerQuiz(id: QuizId): Promise<CornerQuizSnapshot> {
  const empty: CornerQuizSnapshot = {
    attempts: [],
    active: null,
    bestScore: 0,
    rewardUnlocked: false,
    loadFailed: true,
  };
  if (!(await hasValidAccessSession())) return empty;
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("italian_corner_attempts")
      .select(
        "id,quiz_id,status,started_at,expires_at,completed_at,score,passed,question_ids,option_orders",
      )
      .eq("user_id", userId)
      .eq("quiz_id", id)
      .order("started_at", { ascending: false });
    assertSupabaseResult("Unable to load Italian Corner attempts.", error);
    const rows = data ?? [];
    const activeRow = rows.find(
      (row) =>
        row.status === "active" && Date.parse(row.expires_at) > Date.now(),
    );
    const { data: reward, error: rewardError } = await client
      .from("discoveries")
      .select("discovery_id")
      .eq("user_id", userId)
      .eq("discovery_id", quizDefinitions[id].rewardId)
      .maybeSingle();
    assertSupabaseResult("Unable to load Italian Corner reward.", rewardError);
    return {
      attempts: rows.map((row) => ({
        id: row.id,
        score: row.score,
        passed: row.passed,
        status: row.status,
        startedAt: row.started_at,
        completedAt: row.completed_at,
      })),
      active: activeRow ? parsePaper(activeRow) : null,
      bestScore: Math.max(0, ...rows.map((row) => row.score ?? 0)),
      rewardUnlocked: Boolean(reward),
    };
  } catch (error) {
    reportPersistenceFailure("load Italian Corner quiz", error);
    return empty;
  }
}

export async function startCornerQuiz(
  id: string,
): Promise<{ ok: boolean; message: string; attempt?: ActiveCornerAttempt }> {
  if (!(await hasValidAccessSession()))
    return {
      ok: false,
      message: "Private session expired. Unlock the archive again.",
    };
  if (!validQuiz(id)) return { ok: false, message: "Unknown examination." };
  try {
    const bank = getBank(id);
    const questions =
      id === "italian"
        ? selectItalianQuestions(bank, random)
        : shuffled(bank, random);
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("start_italian_corner_attempt", {
      p_user_id: userId,
      p_id: randomUUID(),
      p_quiz_id: id,
      p_question_ids: questions.map((question) => question.id),
      p_option_orders: createOptionOrders(questions, random),
    });
    assertSupabaseResult("Unable to start quiz attempt.", error);
    if (!data?.[0]) throw new Error("No quiz attempt was returned.");
    revalidatePath(
      `/italian-corner/${id === "italian" ? "challenge" : "gianmaria-exam"}`,
    );
    return {
      ok: true,
      message: "Examination started.",
      attempt: parsePaper(data[0]),
    };
  } catch (error) {
    reportPersistenceFailure("start Italian Corner quiz", error);
    const reason =
      error instanceof Error && error.cause instanceof Error
        ? error.cause.message
        : error instanceof Error &&
            error.cause &&
            typeof error.cause === "object" &&
            "message" in error.cause
          ? String(error.cause.message)
          : "";
    const message = reason.includes("Attempt limit reached")
      ? "All available attempts have been used."
      : "The examination cannot be started right now. Please try again.";
    return { ok: false, message };
  }
}

export async function submitCornerQuiz(input: {
  quizId: string;
  attemptId: string;
  answers: Record<string, number>;
}) {
  if (!(await hasValidAccessSession()))
    return { ok: false as const, message: "Private session expired." };
  if (
    !input ||
    !validQuiz(input.quizId) ||
    !/^[\da-f-]{36}$/i.test(input.attemptId) ||
    !input.answers ||
    typeof input.answers !== "object" ||
    Array.isArray(input.answers)
  ) {
    return { ok: false as const, message: "Invalid quiz submission." };
  }
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data: row, error } = await client
      .from("italian_corner_attempts")
      .select("id,quiz_id,status,expires_at,question_ids,option_orders")
      .eq("user_id", userId)
      .eq("id", input.attemptId)
      .eq("quiz_id", input.quizId)
      .maybeSingle();
    assertSupabaseResult("Unable to check quiz paper.", error);
    if (!row || row.status !== "active")
      return {
        ok: false as const,
        message: "This paper has already been submitted or expired.",
      };
    const paper = parsePaper(row);
    const ids = paper.questions.map((question) => question.id);
    if (
      Object.keys(input.answers).length > ids.length ||
      Object.entries(input.answers).some(
        ([id, answer]) =>
          !ids.includes(id) ||
          !Number.isInteger(answer) ||
          answer < 0 ||
          answer > 3,
      )
    ) {
      return {
        ok: false as const,
        message: "One or more answers are invalid.",
      };
    }
    const scored = scoreAnswers(
      ids,
      row.option_orders as Record<string, number[]>,
      input.answers,
      getBank(input.quizId),
    );
    const { data: saved, error: saveError } = await client.rpc(
      "finish_italian_corner_attempt",
      {
        p_user_id: userId,
        p_id: row.id,
        p_answers: input.answers,
        p_score: scored.score,
      },
    );
    assertSupabaseResult("Unable to save quiz result.", saveError);
    if (!saved?.[0]) throw new Error("No result was returned.");
    const result = saved[0];
    revalidatePath("/italian-corner");
    revalidatePath("/coupons");
    revalidatePath(`/coupons/${quizDefinitions[input.quizId].couponId}`);
    return {
      ok: true as const,
      score: result.final_score,
      passed: result.passed,
      rewardWasNew: result.reward_was_new,
      attemptsRemaining: result.attempts_remaining,
      explanations: scored.explanations,
      message: result.passed ? "Examination passed." : "Examination complete.",
    };
  } catch (error) {
    reportPersistenceFailure("submit Italian Corner quiz", error);
    return {
      ok: false as const,
      message:
        "Your result could not be saved. Please retry without leaving this page.",
    };
  }
}
