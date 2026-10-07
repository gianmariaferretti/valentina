import "server-only";

import { CookieQuizStateRepository } from "@/features/quiz/repositories/cookie-quiz-state-repository";
import type { QuizStateRepository } from "@/features/quiz/repositories/quiz-state-repository";

export function getQuizStateRepository(): QuizStateRepository {
  return new CookieQuizStateRepository();
}
