import type { OpenWhenLetter } from "@/types/content";

export const openWhenLetters = [
  {
    slug: "you-miss-me",
    title: "You miss me",
    preview: "Entirely reasonable. Excellent taste, actually.",
  },
  {
    slug: "you-cannot-sleep",
    title: "You cannot sleep",
    preview: "A note with the deeply ironic advice to put the phone down.",
  },
  {
    slug: "you-need-to-laugh",
    title: "You need to laugh",
    preview: "Emergency material approved by the boyfriend committee.",
  },
] as const satisfies readonly OpenWhenLetter[];

export function getOpenWhenLetter(slug: string) {
  return openWhenLetters.find((letter) => letter.slug === slug);
}
