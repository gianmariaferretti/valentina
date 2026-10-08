import "server-only";

import type { QuizQuestion } from "@/features/quiz/types";

export const quizQuestions = [
  {
    id: "fai-come-vuoi",
    eyebrow: "Translation department",
    prompt: "Quando Gianmaria dice “fai come vuoi”, cosa significa davvero?",
    options: [
      { id: "a", label: "Fai come vuoi" },
      { id: "b", label: "Preferirebbe decidere lui" },
      { id: "c", label: "È una trappola" },
      { id: "d", label: "Dipende dal livello di rischio" },
    ],
    correctOptionId: "c",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "change-his-mind",
    eyebrow: "Negotiation studies",
    prompt: "Qual è il modo più efficace per convincere Gianmaria a cambiare idea?",
    options: [
      { id: "a", label: "Argomentare razionalmente" },
      { id: "b", label: "Insistere" },
      { id: "c", label: "Fargli credere che l’idea fosse sua" },
      { id: "d", label: "Impossibile" },
    ],
    correctOptionId: "d",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "during-argument",
    eyebrow: "Legal department",
    prompt: "Qual è la cosa più probabile che Gianmaria faccia durante una discussione?",
    options: [
      { id: "a", label: "Ammettere immediatamente di avere torto" },
      { id: "b", label: "Presentare una memoria difensiva di 14 pagine" },
      { id: "c", label: "Cambiare argomento" },
      { id: "d", label: "Andarsene" },
    ],
    correctOptionId: "b",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "small-surprise",
    eyebrow: "Budget oversight",
    prompt: "Se Gianmaria organizza una “piccola sorpresa”, cosa significa?",
    options: [
      { id: "a", label: "È davvero piccola" },
      { id: "b", label: "Ha speso troppo" },
      { id: "c", label: "Ha organizzato 14 cose" },
      { id: "d", label: "B e C" },
    ],
    correctOptionId: "b",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "get-out-of-bed",
    eyebrow: "Emergency protocol",
    prompt: "Quale di queste cose potrebbe convincere Gianmaria ad alzarsi dal letto immediatamente?",
    options: [
      { id: "a", label: "Un’emergenza" },
      { id: "b", label: "Una telefonata" },
      { id: "c", label: "Cibo" },
      { id: "d", label: "Valentina che dice “okay, vado da sola”" },
    ],
    correctOptionId: "d",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "officially-in-trouble",
    eyebrow: "Threat assessment",
    prompt: "Quale frase di Valentina dovrebbe far capire a Gianmaria che è ufficialmente nei guai?",
    options: [
      { id: "a", label: "“Okay”" },
      { id: "b", label: "“Tranquillo”" },
      { id: "c", label: "“Fai quello che vuoi”" },
      { id: "d", label: "Queste risposte sono tutte inquietanti" },
    ],
    correctOptionId: "d",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "relationship-start",
    eyebrow: "Historical record",
    prompt: "Quando è iniziata la nostra relazione?",
    options: [
      { id: "a", label: "31/10/2025" },
      { id: "b", label: "01/11/2025" },
      { id: "c", label: "11/11/2025" },
      { id: "d", label: "23/11/2025" },
    ],
    correctOptionId: "a",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "not-hungry",
    eyebrow: "Food intelligence",
    prompt: "Chi dei due è più probabile che dica “non ho fame” e poi mangi metà del piatto dell’altro?",
    options: [
      { id: "a", label: "Gianmaria" },
      { id: "b", label: "Valentina" },
      { id: "c", label: "Entrambi" },
      { id: "d", label: "Dipende da chi ha ordinato meglio" },
    ],
    correctOptionId: "b",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "missed-flight",
    eyebrow: "Aviation incident report",
    prompt: "Se dovessimo perdere un volo, quale sarebbe la causa più probabile?",
    options: [
      { id: "a", label: "Traffico" },
      { id: "b", label: "Valentina" },
      { id: "c", label: "Gianmaria" },
      { id: "d", label: "Una catena di eventi che entrambi sosterranno essere colpa dell’altro" },
    ],
    correctOptionId: "b",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "basketball-team",
    eyebrow: "Sports archive",
    prompt: "In quale squadra giocava Gianmaria a basket?",
    options: [
      { id: "a", label: "Invicta Potenza" },
      { id: "b", label: "Lions Basket Club Potenza" },
      { id: "c", label: "Gekos Pignola" },
      { id: "d", label: "Cartagena Basketball Pignola" },
    ],
    correctOptionId: "a",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "most-beautiful-city",
    eyebrow: "Geographic objectivity",
    prompt: "Qual è la città più bella del mondo?",
    options: [
      { id: "a", label: "Pignola" },
      { id: "b", label: "Cartagena" },
      { id: "c", label: "Barranquilla" },
      { id: "d", label: "Roma" },
    ],
    correctOptionId: "a",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  },
  {
    id: "who-is-more-right",
    eyebrow: "Final examination",
    prompt: "ULTIMA DOMANDA — Chi ha più ragione nella relazione?",
    options: [
      { id: "a", label: "Gianmaria" },
      { id: "b", label: "Valentina" },
      { id: "c", label: "Dipende dai fatti" },
      { id: "d", label: "Valentina" },
    ],
    correctOptionId: "d",
    feedback: {
      correct: "Correct. The official record agrees.",
      incorrect: "Incorrect. The V&G archives respectfully disagree.",
    },
  }
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
