/** 31 October 2025, midnight in Rome (UTC+1 then). */
export const TOGETHER_SINCE = Date.UTC(2025, 9, 30, 23, 0, 0);

export interface Together {
  readonly days: number;
  readonly hours: number;
  readonly minutes: number;
  readonly seconds: number;
}

/** Time together since 31.10.2025; zero before that. */
export function togetherAt(now: number): Together {
  const total = Math.max(0, Math.floor((now - TOGETHER_SINCE) / 1000));
  return {
    days: Math.floor(total / 86_400),
    hours: Math.floor((total % 86_400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

/**
 * The background routes. City names only: the cover page is public, so no
 * photos, dates or private text. Positions are a stylised map (not to scale).
 */
export const coverCities = {
  Cartagena: [90, 500],
  London: [610, 310],
  Brussels: [700, 350],
  Hamburg: [770, 310],
  Paris: [640, 390],
  Rome: [790, 470],
  Amalfi: [840, 530],
  Bari: [905, 465],
  Polignano: [945, 500],
  Matera: [890, 560],
} as const satisfies Record<string, readonly [number, number]>;

/** The same cities for tall phone screens (viewBox 600 × 1000). */
export const coverCitiesPortrait = {
  Cartagena: [70, 930],
  London: [120, 120],
  Brussels: [270, 85],
  Hamburg: [430, 60],
  Paris: [200, 160],
  Rome: [380, 500],
  Amalfi: [410, 555],
  Bari: [490, 485],
  Polignano: [530, 530],
  Matera: [470, 575],
} as const satisfies Record<CoverCity, readonly [number, number]>;

export type CoverCity = keyof typeof coverCities;

export const coverRoutes: readonly [CoverCity, CoverCity][] = [
  ["Cartagena", "Rome"],
  ["Rome", "London"],
  ["London", "Paris"],
  ["Paris", "Brussels"],
  ["Brussels", "Hamburg"],
  ["Rome", "Amalfi"],
  ["Rome", "Bari"],
  ["Bari", "Polignano"],
  ["Bari", "Matera"],
];

/** A gentle arc between two points (quadratic Bézier, bulging upwards). */
export function arcPath(
  [x1, y1]: readonly [number, number],
  [x2, y2]: readonly [number, number],
): string {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const lift = Math.hypot(x2 - x1, y2 - y1) * 0.22;
  return `M${x1} ${y1} Q${mx} ${my - lift} ${x2} ${y2}`;
}
