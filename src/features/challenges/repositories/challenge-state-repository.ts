import "server-only";

import type { ChallengeProgressState } from "@/features/challenges/types";

/** Server-owned persistence boundary; ready for a future Supabase adapter. */
export interface ChallengeStateRepository {
  get(): Promise<ChallengeProgressState>;
  save(state: ChallengeProgressState): Promise<void>;
}
