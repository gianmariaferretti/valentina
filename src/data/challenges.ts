import type {
  ArcadeChallengeDefinition,
  ChallengeDefinition,
} from "@/features/challenges/types";

export const challenges = [
  {
    slug: "snake",
    title: "Serpent Protocol",
    shortTitle: "Snake",
    description:
      "A clean grid, an accelerating serpent and five hundred points standing between Valentina and absolute argumentative power.",
    format: "Grid survival",
    kind: "snake",
    requiredScore: 500,
    scoreStep: 10,
    rewardCouponId: "win-any-argument",
    reward: "GV-666 · Win Any Argument",
    difficulty: "practically-impossible",
    accent: "acid",
    instructions: [
      "Collect signal nodes to grow and score ten points.",
      "Do not hit the boundary or your own trail.",
      "The game accelerates honestly as the score rises.",
    ],
  },
  {
    slug: "maze",
    title: "Midnight Circuit",
    shortTitle: "Maze",
    description:
      "Guide the V&G spark through an original neon labyrinth, collect the archive fragments and avoid the roaming glitches.",
    format: "Original maze chase",
    kind: "maze",
    requiredScore: 1_800,
    scoreStep: 10,
    rewardCouponId: "mystery-date",
    reward: "GV-008 · Mystery Date",
    difficulty: "extreme",
    accent: "cyan",
    instructions: [
      "Collect archive fragments for ten points each.",
      "Three roaming glitches patrol and pursue through the maze.",
      "You have three lives. Reaching the target unlocks the reward.",
    ],
  },
  {
    slug: "boyfriend-exam",
    title: "The boyfriend exam",
    shortTitle: "Boyfriend exam",
    description:
      "A compact test of memory, patience and suspiciously specific facts.",
    format: "Multiple choice",
    kind: "placeholder",
  },
  {
    slug: "two-truths",
    title: "Two truths, one revisionist history",
    shortTitle: "Two truths",
    description: "Decide which version of events has been creatively improved.",
    format: "Round-based",
    kind: "placeholder",
  },
  {
    slug: "final-verdict",
    title: "The final verdict",
    shortTitle: "Final verdict",
    description:
      "An unnecessarily serious trial by memory, logic and relationship jurisprudence.",
    format: "Archived prototype",
    kind: "placeholder",
  },
] as const satisfies readonly ChallengeDefinition[];

export const arcadeChallenges = challenges.filter(
  (
    challenge,
  ): challenge is (typeof challenges)[number] & ArcadeChallengeDefinition =>
    challenge.kind === "snake" || challenge.kind === "maze",
);

export function getChallenge(slug: string): ChallengeDefinition | undefined {
  return challenges.find((challenge) => challenge.slug === slug);
}

export function getArcadeChallenge(
  slug: string,
): ArcadeChallengeDefinition | undefined {
  const challenge = getChallenge(slug);
  return challenge?.kind === "snake" || challenge?.kind === "maze"
    ? challenge
    : undefined;
}
