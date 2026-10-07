import type { OpenWhenState } from "@/features/open-when/types";

export function isLetterOpened(slug: string, state: OpenWhenState): boolean {
  return state.openedLetters.some((letter) => letter.slug === slug);
}

export function isRewardClaimed(
  rewardId: string,
  state: OpenWhenState,
): boolean {
  return state.claimedRewards.some((reward) => reward.rewardId === rewardId);
}
