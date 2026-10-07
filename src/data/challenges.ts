import type { Challenge } from "@/types/content";

export const challenges = [
  {
    slug: "boyfriend-exam",
    title: "The boyfriend exam",
    description:
      "A compact test of memory, patience and suspiciously specific facts.",
    format: "Multiple choice",
  },
  {
    slug: "two-truths",
    title: "Two truths, one revisionist history",
    description: "Decide which version of events has been creatively improved.",
    format: "Round-based",
  },
  {
    slug: "final-verdict",
    title: "The final verdict",
    description:
      "An unnecessarily serious trial by memory, logic and relationship jurisprudence.",
    format: "Impossible mode",
  },
] as const satisfies readonly Challenge[];

export function getChallenge(slug: string) {
  return challenges.find((challenge) => challenge.slug === slug);
}
