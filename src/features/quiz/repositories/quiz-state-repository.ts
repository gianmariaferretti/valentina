import "server-only";

import type { QuizState } from "@/features/quiz/types";

/** Replace this adapter with a Supabase implementation without changing UI. */
export interface QuizStateRepository {
  get(): Promise<QuizState>;
  save(state: QuizState): Promise<void>;
}
