import type { OriginalLesson } from "./lesson-model";

export type SupplementalActivity = {
  id: string;
  kind: "flashcard" | "fill" | "order" | "choice" | "matching" | "translation";
  prompt: string;
  answer: string;
  explanation: string;
  options: string[];
  tokens: string[];
  pairs: { italian: string; spanish: string }[];
};

type Example = { italian: string; spanish: string | null };

function normalized(value: string): string {
  return value
    .normalize("NFC")
    .toLocaleLowerCase("it-IT")
    .replace(/[’‘]/g, "'")
    .replace(/[.!?]+$/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function examplesFor(lesson: OriginalLesson): Example[] {
  const start = lesson.paragraphs.findIndex(
    (paragraph) =>
      /^Heading/.test(paragraph.style) &&
      /Esempi guidati|Guarda come si usa|Esempi in contesto|Guarda come funziona/i.test(
        paragraph.text,
      ),
  );
  if (start < 0) return [];
  const examples: Example[] = [];
  for (let index = start + 1; index < lesson.paragraphs.length; index++) {
    const paragraph = lesson.paragraphs[index];
    if (/^Heading/.test(paragraph.style)) break;
    const clean = paragraph.text
      .replace(/^\s*(?:0?\d{1,2}[.)]?|•)\s+/, "")
      .trim();
    const parts =
      lesson.volume === 4
        ? [clean]
        : clean.split(/\s+→\s+|\s+—\s+|\n\s*ES:\s*/);
    if (parts[0])
      examples.push({
        italian: parts[0].trim(),
        spanish: parts[1]?.trim() ?? null,
      });
  }
  return examples;
}

function sectionText(lesson: OriginalLesson, heading: RegExp): string[] {
  const start = lesson.paragraphs.findIndex(
    (paragraph) =>
      /^Heading/.test(paragraph.style) && heading.test(paragraph.text),
  );
  if (start < 0) return [];
  const texts: string[] = [];
  for (let index = start + 1; index < lesson.paragraphs.length; index++) {
    const paragraph = lesson.paragraphs[index];
    if (/^Heading/.test(paragraph.style)) break;
    texts.push(paragraph.text);
  }
  return texts;
}

// The blank in each source example targets the lesson's grammar, not simply
// the first long word. Keep these source-specific anchors beside the derivation.
const lessonFocus: Record<number, [string, string]> = {
  1: ["parlo", "prendiamo"],
  2: ["Ho", "Siamo"],
  3: ["Posso", "Voglio"],
  4: ["Lo", "Gli"],
  5: ["grande", "simpatiche"],
  6: ["a", "da"],
  7: ["al", "nello"],
  8: ["Mi", "Ti"],
  9: ["capisco", "Finiscono"],
  10: ["alzo", "Gli"],
  11: ["ho", "Abbiamo"],
  12: ["Ho", "Hai"],
  13: ["arrivata", "Siamo"],
  14: ["fatto", "detto"],
  15: ["Ho", "Sono"],
  16: ["sono", "sei"],
  17: ["arrivata", "partiti"],
  18: ["ho", "Hai"],
  19: ["andata", "fatto"],
  20: ["Ho", "Sono"],
  21: ["parlavo", "prendevamo"],
  22: ["ero", "faceva"],
  23: ["era", "pioveva"],
  24: ["visitavamo", "uscivo"],
  25: ["abitavo", "ho"],
  26: ["leggevo", "parlavano"],
  27: ["faceva", "abbiamo"],
  28: ["nacque", "entrò"],
  29: ["fu", "ho"],
  30: ["giocavo", "ho"],
  31: ["parlerò", "prenderemo"],
  32: ["sarò", "Avremo"],
  33: ["scriverò", "farà"],
  34: ["ceno", "arriverà"],
  35: ["Parla", "Prendete"],
  36: ["correre", "dimenticate"],
  37: ["la", "Li"],
  38: ["Telefono", "Scrivo"],
  39: ["leggerlo", "Lo"],
  40: ["andrò", "parlare"],
  41: ["ci", "Ne"],
  42: ["mio", "Mia"],
  43: ["più", "meno"],
  44: ["spesso", "mai"],
  45: ["C’è", "Ci"],
  46: ["piace", "piacciono"],
  47: ["lavori", "Hai"],
  48: ["quindi", "perché"],
  49: ["Ho", "Sono"],
  50: ["sono", "andavo"],
  51: ["prendo", "preso"],
  52: ["Avevo", "Era"],
  53: ["partito", "Avevo"],
  54: ["avevo", "dimenticato"],
  55: ["Avrò", "Sarà"],
  56: ["avrò", "sarà"],
  57: ["Parlerei", "Prenderesti"],
  58: ["Vorrei", "Potresti"],
  59: ["Avrei", "Sarei"],
  60: ["Avevo", "avrò"],
  61: ["sia", "è"],
  62: ["parliate", "dormano"],
  63: ["abbia", "vadano"],
  64: ["parta", "piova"],
  65: ["sia", "studi"],
  66: ["sei", "sia"],
  67: ["abbia", "sia"],
  68: ["studi", "abbia"],
  69: ["lavori", "abbia"],
  70: ["stia", "abbiano"],
  71: ["l’ho", "le"],
  72: ["Glielo", "Me la"],
  73: ["ci", "ci"],
  74: ["Ne", "ne"],
  75: ["che", "cui"],
  76: ["Camminando", "Studiando"],
  77: ["sto", "preparo"],
  78: ["per", "di"],
  79: ["ce la", "ce ne"],
  80: ["cui", "te lo"],
};

function omission(
  sentence: string,
  focus?: string,
): { prompt: string; answer: string } {
  if (focus) {
    const safe = focus.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const position =
      sentence.match(new RegExp(`(?<![\\p{L}])${safe}(?![\\p{L}])`, "iu"))
        ?.index ?? -1;
    if (position >= 0)
      return {
        prompt: `${sentence.slice(0, position)}____${sentence.slice(position + focus.length)}`,
        answer: sentence.slice(position, position + focus.length),
      };
  }
  const words = [...sentence.matchAll(/[\p{L}À-ÿ]+(?:[’'][\p{L}]+)?/gu)];
  const verbPattern =
    /(?:avo|avi|ava|avamo|avate|avano|evo|evi|eva|evamo|evate|evano|ivo|ivi|iva|ivamo|ivate|ivano|iamo|ate|ano|ono|ando|endo|ato|uta|uto|ito)$/i;
  const irregular =
    /^(?:vai|hai|sei|sono|ho|era|ero|erano|vado|faccio|fa|dà|ci|ne)$/i;
  const candidate =
    words.find(
      (match) => verbPattern.test(match[0]) || irregular.test(match[0]),
    ) ?? words.find((match, index) => index > 0 && match[0].length >= 5);
  const chosen = candidate ?? words.at(-1);
  if (!chosen || chosen.index === undefined)
    return { prompt: sentence, answer: sentence };
  return {
    prompt: `${sentence.slice(0, chosen.index)}____${sentence.slice(chosen.index + chosen[0].length)}`,
    answer: chosen[0],
  };
}

function rotatedOptions(values: string[], selected: number): string[] {
  const shift = (selected + 1) % values.length;
  return [...values.slice(shift), ...values.slice(0, shift)];
}

/** New retrieval formats are derived from the lesson's own examples, never
 * from invented claims or translations. The source documents remain untouched.
 */
export function buildSupplementalActivities(
  lesson: OriginalLesson,
): SupplementalActivity[] {
  const examples = examplesFor(lesson);
  if (examples.length < 2) return [];
  const activities: SupplementalActivity[] = [];
  const add = (activity: Omit<SupplementalActivity, "id">) =>
    activities.push({
      ...activity,
      id: `supp-${String(activities.length + 1).padStart(2, "0")}`,
    });
  const allBilingual =
    examples.length >= 4 && examples.slice(0, 4).every((item) => item.spanish);

  if (allBilingual) {
    for (const example of examples.slice(0, 2)) {
      add({
        kind: "flashcard",
        prompt: example.spanish!,
        answer: example.italian,
        explanation:
          "Confronta la forma italiana con l'esempio autentico della lezione.",
        options: [],
        tokens: [],
        pairs: [],
      });
    }
  }
  for (const [index, example] of examples.slice(0, 2).entries()) {
    const gap = omission(example.italian, lessonFocus[lesson.number]?.[index]);
    add({
      kind: "fill",
      prompt: gap.prompt,
      answer: gap.answer,
      explanation: `Nell'esempio originale la parola è «${gap.answer}». Rileggi la frase nel suo contesto.`,
      options: [],
      tokens: [],
      pairs: [],
    });
  }
  for (const example of examples.slice(0, 2)) {
    const tokens = example.italian.split(/\s+/).filter(Boolean);
    add({
      kind: "order",
      prompt: example.spanish ?? "Ricostruisci l'esempio della lezione.",
      answer: example.italian,
      explanation:
        "L'ordine segue l'esempio italiano della lezione; controlla posizione del verbo e dei pronomi.",
      options: [],
      tokens: [...tokens.slice(1), tokens[0]],
      pairs: [],
    });
  }

  if (allBilingual) {
    const firstFour = examples.slice(0, 4);
    for (const selected of [2, 3]) {
      const example = firstFour[selected];
      add({
        kind: "choice",
        prompt: `Quale frase italiana esprime «${example.spanish}»?`,
        answer: example.italian,
        explanation: `La coppia del manuale è «${example.italian}» → «${example.spanish}».`,
        options: rotatedOptions(
          firstFour.map((item) => item.italian),
          selected,
        ),
        tokens: [],
        pairs: [],
      });
    }
    add({
      kind: "matching",
      prompt: "Abbina le quattro frasi italiane alle traduzioni spagnole.",
      answer: "0,1,2,3",
      explanation:
        "Ogni coppia riprende gli esempi italiano/spagnolo del manuale: confronta significato e forma.",
      options: [],
      tokens: [],
      pairs: firstFour.map((item) => ({
        italian: item.italian,
        spanish: item.spanish!,
      })),
    });
    add({
      kind: "translation",
      prompt: `Traduci in italiano: ${firstFour[2].spanish}`,
      answer: firstFour[2].italian,
      explanation: `Una soluzione guida del manuale è «${firstFour[2].italian}». Altre formulazioni corrette potrebbero essere possibili.`,
      options: [],
      tokens: [],
      pairs: [],
    });
  } else {
    const rule =
      sectionText(lesson, /Capisci la regola/i).find(
        (text) => text.length > 40,
      ) ?? lesson.title;
    const bridge =
      sectionText(lesson, /Puente con el español/i)[0] ?? lesson.title;
    add({
      kind: "flashcard",
      prompt: `Qual è la regola centrale di «${lesson.title}»?`,
      answer: rule,
      explanation: "Regola tratta dalla spiegazione originale della lezione.",
      options: [],
      tokens: [],
      pairs: [],
    });
    add({
      kind: "flashcard",
      prompt: "Quale ponte con lo spagnolo propone il manuale?",
      answer: bridge,
      explanation: "Confronto originale italiano/spagnolo.",
      options: [],
      tokens: [],
      pairs: [],
    });
    const prompts = sectionText(lesson, /Pratica guidata/i);
    const feedback = new Map(
      sectionText(lesson, /Soluzioni e feedback del docente/i)
        .map((text) => text.match(/^\s*([1-4])\.\s+([\s\S]+)$/))
        .filter((match): match is RegExpMatchArray => Boolean(match))
        .map((match) => [Number(match[1]), match[2]] as const),
    );
    for (const [position, prompt] of prompts.entries()) {
      const match = prompt.match(/^\s*([1-4])\.\s+([\s\S]+)$/);
      if (!match || !feedback.has(Number(match[1]))) continue;
      const next = prompts[position + 1]?.trim();
      const fullPrompt = next?.startsWith("A)")
        ? `${match[2]} ${next}`
        : match[2];
      add({
        kind: "flashcard",
        prompt: `Spiega la correzione della prova ${match[1]}: ${fullPrompt}`,
        answer: feedback.get(Number(match[1]))!,
        explanation:
          "La spiegazione del docente è conservata parola per parola.",
        options: [],
        tokens: [],
        pairs: [],
      });
    }
  }
  return activities;
}

export function publicSupplementalActivities(
  activities: SupplementalActivity[],
) {
  return activities.map(({ answer, explanation, ...activity }) => ({
    ...activity,
    ...(activity.kind === "flashcard" ? { answer, explanation } : {}),
  }));
}

export function gradeSupplementalActivity(
  activity: SupplementalActivity,
  answer: string,
): number | null {
  if (activity.kind === "flashcard") return null;
  return normalized(activity.answer) === normalized(answer) ? 100 : 0;
}
