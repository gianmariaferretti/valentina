import { z } from "zod";

const paragraphSchema = z.object({
  style: z.string(),
  text: z.string(),
});

export const originalLessonSchema = z.object({
  id: z.string().regex(/^(a2|b1)-\d{3}$/),
  number: z.number().int().min(1).max(80),
  volume: z.number().int().min(1).max(4),
  level: z.enum(["A2", "B1"]),
  title: z.string().min(1),
  source: z.object({
    file: z.string(),
    sha256: z.string().length(64),
    firstParagraph: z.number().int(),
    lastParagraphExclusive: z.number().int(),
  }),
  paragraphs: z.array(paragraphSchema).min(1),
});

export type OriginalLesson = z.infer<typeof originalLessonSchema>;
export type OriginalParagraph = OriginalLesson["paragraphs"][number];

export type OriginalExercise = {
  id: string;
  prompt: string;
  sourceIndexes: number[];
  mode: "choice" | "fill" | "order" | "correction" | "transformation" | "open";
  options: string[];
  tokens: string[];
  answerNumber: number | null;
  modelAnswer: string | null;
  originalFeedback: string | null;
};

export type LessonSection = {
  id: string;
  heading: string;
  kind: "content" | "practice" | "solutions";
  paragraphs: OriginalParagraph[];
  exercises: OriginalExercise[];
};

const answerLine = /^\s*0?(\d{1,2})[.)]?\s+([\s\S]+)$/;
const numberedQuestion = /^\s*0?(\d{1,2})[.)]?\s+([\s\S]+)$/;
const letteredQuestion = /^\s*([ABC])[.)]\s+([\s\S]+)$/;

function normalize(value: string) {
  return value
    .normalize("NFC")
    .trim()
    .replace(/\s+/g, " ")
    .toLocaleLowerCase("it-IT");
}

function modelAnswer(feedback: string): string {
  return feedback
    .replace(/^\s*0?\d{1,2}[.)]?\s+/, "")
    .split(/\s+[—–]\s+|\.\s+|\.\./, 1)[0]
    .trim()
    .replace(/[.!]+$/, "");
}

function choiceOptions(prompt: string): string[] {
  const lettered = [
    ...prompt.matchAll(/(?:^|\s)([A-D])\)\s*([^\n]+?)(?=\s+[A-D]\)|$)/g),
  ].map((match) => match[2].trim());
  if (lettered.length >= 2 && lettered.length <= 4) return lettered;
  const parenthesized = [...prompt.matchAll(/\(([^()]*\/[^()]*)\)/g)].at(
    -1,
  )?.[1];
  if (parenthesized) {
    const options = parenthesized.split(/\s*\/\s*/).map((item) => item.trim());
    if (options.length >= 2 && options.length <= 4) return options;
  }
  return [];
}

function isPractice(heading: string) {
  return /Practice Lab|Allenamento interattivo|pratica guidata|Tocca a te|Mini-verifica|Sfida attiva|Allenamento attivo|Missione personale|La tua missione|Your Turn|Quick check|Mini-dialogo e comprensione/i.test(
    heading,
  );
}

function isSolutions(heading: string) {
  return /^(Soluzioni|Chiave delle risposte)/i.test(heading);
}

function splitSections(lesson: OriginalLesson): LessonSection[] {
  const sections: LessonSection[] = [];
  let current: LessonSection = {
    id: "section-0",
    heading: "Prima di iniziare",
    kind: "content",
    paragraphs: [],
    exercises: [],
  };
  for (const [index, paragraph] of lesson.paragraphs.entries()) {
    if (index === 0 || (index === 1 && lesson.volume === 1)) continue;
    if (/^Heading [12]$/.test(paragraph.style)) {
      if (current.paragraphs.length || current.heading !== "Prima di iniziare")
        sections.push(current);
      current = {
        id: `section-${sections.length + 1}`,
        heading: paragraph.text,
        kind: isSolutions(paragraph.text)
          ? "solutions"
          : isPractice(paragraph.text)
            ? "practice"
            : "content",
        paragraphs: [],
        exercises: [],
      };
    } else if (paragraph.text.trim()) {
      current.paragraphs.push(paragraph);
    }
  }
  if (current.paragraphs.length || current.heading !== "Prima di iniziare")
    sections.push(current);
  return sections;
}

export function prepareLesson(lesson: OriginalLesson): LessonSection[] {
  const sections = splitSections(lesson);
  const solutions = new Map<number, string>();
  for (const section of sections.filter((item) => item.kind === "solutions")) {
    for (const paragraph of section.paragraphs) {
      const match = paragraph.text.match(answerLine);
      if (match && !solutions.has(Number(match[1])))
        solutions.set(Number(match[1]), paragraph.text);
    }
  }
  for (const [sectionIndex, section] of sections.entries()) {
    if (section.kind !== "practice") continue;
    const exercises: OriginalExercise[] = [];
    for (let index = 0; index < section.paragraphs.length; index++) {
      const sourceIndex = index;
      const text = section.paragraphs[index].text;
      const numbered = text.match(numberedQuestion);
      const lettered = text.match(letteredQuestion);
      const personal =
        /Missione personale|La tua missione|Your Turn|Quick check|Mini-dialogo e comprensione/i.test(
          section.heading,
        );
      if (!numbered && !lettered && !personal) continue;
      const answerNumber = numbered ? Number(numbered[1]) : null;
      let prompt = text;
      const next = section.paragraphs[index + 1]?.text;
      if (numbered && next && /^\s*A\)\s+/.test(next)) {
        prompt += `\n${next}`;
        index++;
      }
      const feedback =
        answerNumber === null ? null : (solutions.get(answerNumber) ?? null);
      const answer = feedback ? modelAnswer(feedback) : null;
      const options = choiceOptions(prompt);
      const matchingOptions = options.filter(
        (option) => normalize(option) === normalize(answer ?? ""),
      );
      const orderMatch = prompt.match(
        /(?:\[ORDINA\]|Riordina)[^«]*«([^»]+\/[^»]+)»/i,
      );
      const tokens = orderMatch
        ? orderMatch[1].split(/\s*\/\s*/).map((token) => token.trim())
        : [];
      const mode: OriginalExercise["mode"] =
        options.length && matchingOptions.length === 1
          ? "choice"
          : tokens.length > 1 && answer
            ? "order"
            : /\[CORREGGI\]|\bCorreggi:/i.test(prompt)
              ? "correction"
              : /\[TRASFORMA\]|\bTrasforma:|\bRiscrivi:/i.test(prompt)
                ? "transformation"
                : answer &&
                    answer.length <= 80 &&
                    !answer.includes("/") &&
                    (prompt.includes("___") || /\bCompleta\b/i.test(prompt))
                  ? "fill"
                  : "open";
      exercises.push({
        id: `s${sectionIndex}-e${String(exercises.length + 1).padStart(2, "0")}`,
        prompt,
        sourceIndexes:
          sourceIndex === index ? [sourceIndex] : [sourceIndex, index],
        mode,
        options: mode === "choice" ? options : [],
        tokens,
        answerNumber,
        modelAnswer: answer,
        originalFeedback: feedback,
      });
      if (personal) break;
    }
    section.exercises = exercises;
  }
  return sections;
}

export function publicSections(sections: LessonSection[]) {
  return sections
    .filter((section) => section.kind !== "solutions")
    .map((section) => ({
      ...section,
      exercises: section.exercises.map((exercise) => ({
        id: exercise.id,
        prompt: exercise.prompt,
        sourceIndexes: exercise.sourceIndexes,
        mode: exercise.mode,
        options: exercise.options,
        tokens: exercise.tokens,
        answerNumber: exercise.answerNumber,
      })),
    }));
}

export function gradeOriginalExercise(
  exercise: OriginalExercise,
  answer: string,
) {
  if (
    !["choice", "fill", "order"].includes(exercise.mode) ||
    !exercise.modelAnswer
  )
    return null;
  const normalizedAnswer = normalize(answer);
  const normalizedModel = normalize(exercise.modelAnswer);
  return normalizedAnswer === normalizedModel ? 100 : 0;
}
