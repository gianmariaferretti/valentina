import "server-only";

import { cache } from "react";

import type { ChallengeStateRepository } from "@/features/challenges/repositories/challenge-state-repository";
import { SupabaseChallengeStateRepository } from "@/features/challenges/repositories/supabase-challenge-state-repository";
import { EMPTY_CHALLENGE_PROGRESS_STATE } from "@/features/challenges/types";
import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

export function getChallengeStateRepository(): ChallengeStateRepository {
  return new SupabaseChallengeStateRepository();
}

export const loadChallengeState = cache(async function loadChallengeState() {
  if (!(await hasValidAccessSession())) return EMPTY_CHALLENGE_PROGRESS_STATE;

  try {
    return await getChallengeStateRepository().get();
  } catch (error) {
    reportPersistenceFailure("load challenge scores", error);
    return EMPTY_CHALLENGE_PROGRESS_STATE;
  }
});
