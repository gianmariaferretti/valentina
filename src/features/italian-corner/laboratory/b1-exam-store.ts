import "server-only";

import exam from "@/content/italian/laboratory/b1-exam-100.json";

type Question = {
  id: string;
  question: string;
  options: string[];
  correct_answer: number;
  feedback: string;
  points: number;
};
type ReadingPassage = {
  id: string;
  title: string;
  text: string;
  questions: Question[];
};
type WritingTask = {
  id: string;
  title: string;
  task: string;
  words_min: number;
  words_max: number;
};

const reading = exam.sections.find((section) => section.id === "READ");
const language = exam.sections.find((section) => section.id === "LANG");
const writing = exam.sections.find((section) => section.id === "WRITE");
if (!reading || !language || !writing)
  throw new Error("B1 pilot exam is incomplete.");

const passages = reading.passages as ReadingPassage[];
const questions = language.questions as Question[];
const tasks = writing.tasks as WritingTask[];
const allQuestions = [
  ...passages.flatMap((passage) => passage.questions),
  ...questions,
];
if (passages.length !== 2 || allQuestions.length !== 30 || tasks.length !== 2)
  throw new Error("Unexpected B1 pilot exam structure.");

export function publicB1Exam() {
  return {
    passages: passages.map(({ id, title, text, questions: items }) => ({
      id,
      title,
      text,
      questions: items.map(({ id: questionId, question, options }) => ({
        id: questionId,
        question,
        options,
      })),
    })),
    language: questions.map(({ id, question, options }) => ({
      id,
      question,
      options,
    })),
    writing: tasks.map(({ id, title, task, words_min, words_max }) => ({
      id,
      title,
      task,
      wordsMin: words_min,
      wordsMax: words_max,
    })),
  };
}

export function gradeB1Pilot(answers: Record<string, number>) {
  const grade = (items: Question[]) => {
    const total = items.reduce((sum, item) => sum + item.points, 0);
    const points = items.reduce(
      (sum, item) =>
        sum + (answers[item.id] === item.correct_answer ? item.points : 0),
      0,
    );
    return { points, total, percent: Math.round((100 * points) / total) };
  };
  return {
    reading: grade(passages.flatMap((passage) => passage.questions)),
    language: grade(questions),
    feedback: allQuestions.map((item) => ({
      id: item.id,
      correct: answers[item.id] === item.correct_answer,
      explanation: item.feedback,
    })),
  };
}

export function validB1Answers(answers: Record<string, number>): boolean {
  return (
    allQuestions.every(
      (question) =>
        Number.isInteger(answers[question.id]) &&
        answers[question.id] >= 0 &&
        answers[question.id] < question.options.length,
    ) && Object.keys(answers).length === allQuestions.length
  );
}

export function b1ExamQuestions() {
  return allQuestions;
}
export function b1WritingTasks() {
  return tasks;
}
