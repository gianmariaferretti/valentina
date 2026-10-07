import "server-only";

import { CookieChallengeStateRepository } from "@/features/challenges/repositories/cookie-challenge-state-repository";
import type { ChallengeStateRepository } from "@/features/challenges/repositories/challenge-state-repository";

export function getChallengeStateRepository(): ChallengeStateRepository {
  return new CookieChallengeStateRepository();
}
