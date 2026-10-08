import "server-only";

import type { QuizQuestion } from "@/features/quiz/types";

/**
 * Placeholder content only. Replace prompts, options, answer keys and feedback
 * here when Gianmaria's final personal questions are ready. Presentation and
 * persistence do not need to change.
 */
export const quizQuestions = [
  {
    id: "ideal-free-saturday",
    eyebrow: "Weekend intelligence",
    prompt:
      "What is Gianmaria's suspiciously ideal version of a free Saturday?",
    options: [
      { id: "spreadsheet", label: "A colour-coded errands spreadsheet" },
      { id: "food-walk", label: "Excellent food, a long walk and no alarms" },
      { id: "networking", label: "An optional networking event" },
      { id: "laundry", label: "Six consecutive loads of laundry" },
    ],
    correctOptionId: "food-walk",
    feedback: {
      correct: "Correct. Leisure has been correctly identified.",
      incorrect: "Bold theory. The boyfriend committee has concerns.",
    },
  },
  {
    id: "restaurant-behaviour",
    eyebrow: "Field observation",
    prompt: "At a new restaurant, what is he most likely to do first?",
    options: [
      { id: "menu-study", label: "Study the menu like it contains legal risk" },
      { id: "order-random", label: "Order the first thing he sees" },
      { id: "ask-wifi", label: "Ask for the Wi-Fi password" },
      { id: "skip-dessert", label: "Announce that dessert is unnecessary" },
    ],
    correctOptionId: "menu-study",
    feedback: {
      correct: "Correct. Due diligence has been observed.",
      incorrect: "Incorrect, but confidently so. Respectable.",
    },
  },
  {
    id: "travel-priority",
    eyebrow: "Travel protocol",
    prompt: "What quietly determines whether a trip is going well?",
    options: [
      { id: "souvenir", label: "The number of souvenir shops" },
      { id: "hotel-tv", label: "The size of the hotel television" },
      { id: "coffee", label: "Reliable coffee at strategically useful times" },
      { id: "matching", label: "Matching airport outfits" },
    ],
    correctOptionId: "coffee",
    feedback: {
      correct: "Correct. Logistics run on caffeine and optimism.",
      incorrect: "A charming answer. Operationally disastrous.",
    },
  },
  {
    id: "minor-crisis",
    eyebrow: "Emergency procedure",
    prompt: "During a minor crisis, Gianmaria's first instinct is usually to…",
    options: [
      { id: "vanish", label: "Vanish into the nearest gift shop" },
      { id: "plan", label: "Make a plan with unnecessary subheadings" },
      { id: "nap", label: "Take a restorative three-hour nap" },
      { id: "poll", label: "Create a public opinion poll" },
    ],
    correctOptionId: "plan",
    feedback: {
      correct: "Correct. The subheadings are already being drafted.",
      incorrect: "No. Chaos has clearly compromised your judgment.",
    },
  },
  {
    id: "gift-clue",
    eyebrow: "Classified gifting",
    prompt: "Which clue most strongly suggests he has planned a surprise?",
    options: [
      { id: "casual", label: "He becomes suspiciously casual about logistics" },
      { id: "announcement", label: "He announces it four weeks early" },
      { id: "calendar", label: "He deletes every calendar entry" },
      { id: "receipt", label: "He leaves the receipt on the table" },
    ],
    correctOptionId: "casual",
    feedback: {
      correct: "Correct. Subtlety remains under active investigation.",
      incorrect: "Incorrect. The surprise department denies everything.",
    },
  },
  {
    id: "movie-night",
    eyebrow: "Domestic cinema",
    prompt: "What is the real danger during movie night?",
    options: [
      {
        id: "snacks",
        label: "Running out of snacks before the opening credits",
      },
      { id: "subtitles", label: "Accidentally enabling subtitles" },
      {
        id: "commentary",
        label: "A director's commentary appearing uninvited",
      },
      { id: "blanket", label: "Owning more than one blanket" },
    ],
    correctOptionId: "snacks",
    feedback: {
      correct: "Correct. The snack ratio is a matter of national importance.",
      incorrect: "A cinematic misunderstanding. The snacks know the truth.",
    },
  },
  {
    id: "message-translation",
    eyebrow: "Linguistics division",
    prompt: "When he texts “two minutes,” what should that be translated as?",
    options: [
      { id: "two", label: "Exactly two minutes" },
      { id: "twelve", label: "A flexible twelve-ish minutes" },
      { id: "tomorrow", label: "Tomorrow morning" },
      { id: "never", label: "A philosophical concept, not a time" },
    ],
    correctOptionId: "twelve",
    feedback: {
      correct: "Correct. You are fluent in boyfriend time.",
      incorrect: "Translation failed. Please recalibrate expectations.",
    },
  },
  {
    id: "argument-tactic",
    eyebrow: "Debate studies",
    prompt:
      "Which phrase signals that an argument is becoming unnecessarily detailed?",
    options: [
      { id: "technically", label: "“Technically…”" },
      { id: "fair", label: "“That's fair.”" },
      { id: "hungry", label: "“Should we eat first?”" },
      { id: "agree", label: "“I completely agree.”" },
    ],
    correctOptionId: "technically",
    feedback: {
      correct: "Correct. The footnotes were seconds away.",
      incorrect: "Incorrect. Technically, this will be discussed later.",
    },
  },
  {
    id: "comfort-food",
    eyebrow: "Emotional infrastructure",
    prompt: "After a terrible day, which plan has the highest success rate?",
    options: [
      { id: "email", label: "Replying to several more emails" },
      { id: "run", label: "A surprise competitive 10K" },
      { id: "food-sofa", label: "Comfort food and the sofa with Valentina" },
      { id: "chores", label: "Reorganising every cupboard" },
    ],
    correctOptionId: "food-sofa",
    feedback: {
      correct: "Correct. Recovery protocol successfully activated.",
      incorrect: "This answer has made the terrible day slightly worse.",
    },
  },
  {
    id: "best-part",
    eyebrow: "Final examination",
    prompt: "What has been the best part of Year One?",
    options: [
      { id: "itineraries", label: "The impeccably sensible itineraries" },
      { id: "receipts", label: "The increasingly impressive receipt archive" },
      { id: "us", label: "Building a very strange, very good “us”" },
      { id: "weather", label: "European weather consistency" },
    ],
    correctOptionId: "us",
    feedback: {
      correct: "Correct. Disgustingly sincere, but correct.",
      incorrect: "Incorrect. The jury recommends one dramatic reconsideration.",
    },
  },
] as const satisfies readonly QuizQuestion[];

export function getQuizQuestion(id: string): QuizQuestion | undefined {
  return quizQuestions.find((question) => question.id === id);
}

export function getQuizQuestionViews() {
  return quizQuestions.map(({ id, eyebrow, prompt, options }) => ({
    id,
    eyebrow,
    prompt,
    options,
  }));
}
import "server-only";
