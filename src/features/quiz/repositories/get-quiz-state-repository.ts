import "server-only";

import { cache } from "react";

import type { QuizStateRepository } from "@/features/quiz/repositories/quiz-state-repository";
import { SupabaseQuizStateRepository } from "@/features/quiz/repositories/supabase-quiz-state-repository";
import { EMPTY_QUIZ_STATE } from "@/features/quiz/types";
import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

export function getQuizStateRepository(): QuizStateRepository {
  return new SupabaseQuizStateRepository();
}

export const loadQuizState = cache(async function loadQuizState() {
  if (!(await hasValidAccessSession())) return EMPTY_QUIZ_STATE;

  try {
    return await getQuizStateRepository().get();
  } catch (error) {
    reportPersistenceFailure("load quiz state", error);
    return EMPTY_QUIZ_STATE;
  }
});
