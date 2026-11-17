/**
 * 💋 the rest of the site pays into the Kiss Casino. Each event pays once,
 * ever. These are the defaults: the control panel (Kiss Casino section) can
 * change every amount; 0 switches an event off.
 */
export const kissRewardDefaults = {
  /** First victory in each of the V&G Games. */
  gameWin: 50,
  /** First time the boyfriend quiz is completed. */
  quizComplete: 40,
  /** Each La Dolce Lingua lesson completed. */
  lessonComplete: 15,
  /** Each Italian exam or challenge passed. */
  examPassed: 80,
  /** Each achievement unlocked. */
  achievement: 25,
  /** First opening of each "Open when…" letter. */
  letterFirstOpen: 10,
  /** First visit to each place on the map. */
  placeFirstOpen: 10,
} as const;

export type KissRewardKind = keyof typeof kissRewardDefaults;
export type KissRewardAmounts = Record<KissRewardKind, number>;

/** Italian labels for the control panel. */
export const kissRewardLabels: Record<KissRewardKind, string> = {
  gameWin: "Prima vittoria in un gioco",
  quizComplete: "Quiz completato (la prima volta)",
  lessonComplete: "Lezione di La Dolce Lingua completata",
  examPassed: "Esame o sfida d'italiano superati",
  achievement: "Achievement sbloccato",
  letterFirstOpen: "Prima apertura di una lettera",
  placeFirstOpen: "Prima visita a un luogo della mappa",
};

/** Upper bound for a single event (the database allows up to 100 000). */
export const MAX_KISS_REWARD = 1000;
