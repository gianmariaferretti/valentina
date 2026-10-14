import type { CornerQuestion, QuizId } from "./question-bank";

export interface PublicQuestion {
  id: string;
  text: string;
  category: string;
  level: string;
  options: readonly string[];
}

export interface ActiveCornerAttempt {
  id: string;
  quizId: QuizId;
  expiresAt: string;
  questions: readonly PublicQuestion[];
}

export interface CornerAttemptSummary {
  id: string;
  score: number | null;
  passed: boolean;
  status: string;
  startedAt: string;
  completedAt: string | null;
}

export interface CornerQuizSnapshot {
  attempts: readonly CornerAttemptSummary[];
  active: ActiveCornerAttempt | null;
  bestScore: number;
  rewardUnlocked: boolean;
  loadFailed?: boolean;
}

export function shuffled<T>(values: readonly T[], random: () => number): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index--) {
    const pick = Math.floor(random() * (index + 1));
    [result[index], result[pick]] = [result[pick], result[index]];
  }
  return result;
}

export function selectItalianQuestions(
  bank: readonly CornerQuestion[],
  random: () => number,
): CornerQuestion[] {
  // Both reading levels must be reachable while every paper remains 8 A2 / 7 B1.
  const b1Reading = random() < 0.5;
  const quotas = {
    grammar: { A2: b1Reading ? 4 : 3, B1: b1Reading ? 1 : 2 },
    vocabulary: { A2: 2, B1: 2 },
    "verb-tense": { A2: 1, B1: 2 },
    everyday: { A2: 1, B1: 1 },
    reading: { A2: b1Reading ? 0 : 1, B1: b1Reading ? 1 : 0 },
  } as const;
  const selected: CornerQuestion[] = [];
  for (const [category, levels] of Object.entries(quotas)) {
    for (const [level, amount] of Object.entries(levels)) {
      const pool = bank.filter(
        (question) =>
          question.category === category && question.level === level,
      );
      if (pool.length < amount)
        throw new Error(`Insufficient ${category}/${level} questions`);
      selected.push(...shuffled(pool, random).slice(0, amount));
    }
  }
  return shuffled(selected, random);
}

export function createOptionOrders(
  questions: readonly CornerQuestion[],
  random: () => number,
): Record<string, number[]> {
  return Object.fromEntries(
    questions.map((question) => [question.id, shuffled([0, 1, 2, 3], random)]),
  );
}

export function presentQuestions(
  ids: readonly string[],
  orders: Record<string, number[]>,
  bank: readonly CornerQuestion[],
): PublicQuestion[] {
  return ids.map((id) => {
    const question = bank.find((candidate) => candidate.id === id);
    const order = orders[id];
    if (
      !question ||
      !order ||
      order.length !== 4 ||
      new Set(order).size !== 4 ||
      order.some((value) => value < 0 || value > 3)
    ) {
      throw new Error("Stored quiz paper is invalid.");
    }
    return {
      id,
      text: question.text,
      category: question.category,
      level: question.level,
      options: order.map((index) => question.options[index]),
    };
  });
}

export function scoreAnswers(
  ids: readonly string[],
  orders: Record<string, number[]>,
  answers: Record<string, number>,
  bank: readonly CornerQuestion[],
) {
  const questions = presentQuestions(ids, orders, bank);
  return {
    score: questions.reduce((total, question) => {
      const selected = answers[question.id];
      const actual = orders[question.id]?.[selected];
      return (
        total +
        (actual === bank.find((item) => item.id === question.id)?.correct
          ? 1
          : 0)
      );
    }, 0),
    explanations: questions.map((question) => {
      const original = bank.find((item) => item.id === question.id)!;
      const selected = answers[question.id];
      const correctDisplayedIndex = orders[question.id].indexOf(
        original.correct,
      );
      return {
        id: question.id,
        text: question.text,
        correct: orders[question.id]?.[selected] === original.correct,
        correctAnswer: question.options[correctDisplayedIndex],
        explanation: original.explanation,
      };
    }),
  };
}

export function personalResult(score: number): string {
  if (score === 10) return "You know me better than I know myself.";
  if (score >= 8) return "Gianmaria Expert.";
  if (score >= 6) return "Certified Girlfriend.";
  if (score >= 4) return "You know the basics.";
  return "Are we even dating?";
}
