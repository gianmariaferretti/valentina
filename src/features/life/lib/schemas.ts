import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

export function isTimeZone(value: string): boolean {
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return true;
  } catch {
    return false;
  }
}

export const citySchema = z.object({
  name: text(40),
  timeZone: z
    .string()
    .refine(isTimeZone, "Fuso orario non valido (es. Europe/Rome)."),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  /** Who is there right now, e.g. "Valentina". */
  who: z.string().trim().max(60).default(""),
});

export type City = z.infer<typeof citySchema>;

export const citiesSchema = z.object({
  cities: z.array(citySchema).min(1).max(8),
});

export const defaultCities: City[] = [
  {
    name: "Rome",
    timeZone: "Europe/Rome",
    latitude: 41.9028,
    longitude: 12.4964,
    who: "Gianmaria",
  },
  {
    name: "Cartagena",
    timeZone: "America/Bogota",
    latitude: 10.391,
    longitude: -75.4794,
    who: "Valentina",
  },
  {
    name: "Barranquilla",
    timeZone: "America/Bogota",
    latitude: 10.9639,
    longitude: -74.7964,
    who: "",
  },
  {
    name: "Hamburg",
    timeZone: "Europe/Berlin",
    latitude: 53.5511,
    longitude: 9.9937,
    who: "",
  },
];

export const flightStatuses = ["on-time", "delayed", "boarding"] as const;

export const nextTimeSchema = z.object({
  /** ISO date-time of arrival (UTC). */
  at: z.string().datetime({ offset: true }).nullable(),
  from: text(40),
  to: text(40),
  status: z.enum(flightStatuses),
});

export type NextTime = z.infer<typeof nextTimeSchema>;

export const lists = ["todo", "suitcase", "bucket"] as const;
export type ListName = (typeof lists)[number];

export const bucketCategories = [
  "travel",
  "food",
  "adventures",
  "silly things",
  "home",
  "someday",
] as const;

export const rewardSchema = z.union([
  z.object({ couponId: z.string().regex(/^[a-z0-9-]{1,100}$/) }),
  z.object({ kisses: z.number().int().min(1).max(1000) }),
]);
export type ListReward = z.infer<typeof rewardSchema>;

export const listItemInputSchema = z.object({
  title: text(140),
  notes: z
    .string()
    .trim()
    .max(600)
    .optional()
    .transform((v) => v || null),
  category: z
    .string()
    .trim()
    .max(40)
    .optional()
    .transform((v) => v || null),
});

export const SPOTIFY_URL =
  /^https:\/\/open\.spotify\.com\/(?:intl-[a-z]{2}\/)?(track|album|playlist)\/([A-Za-z0-9]{10,40})/;

/** Spotify page link → embed player URL, or null. */
export function spotifyEmbed(url: string | null | undefined): string | null {
  const match = url?.match(SPOTIFY_URL);
  return match
    ? `https://open.spotify.com/embed/${match[1]}/${match[2]}`
    : null;
}

export const songSchema = z.object({
  title: text(140),
  artist: text(140),
  spotifyUrl: z
    .string()
    .trim()
    .max(300)
    .refine(
      (v) => v === "" || SPOTIFY_URL.test(v),
      "Incolla il link Spotify del brano (open.spotify.com/track/…).",
    )
    .transform((v) => v || null),
  date: z
    .string()
    .trim()
    .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Data AAAA-MM-GG")
    .transform((v) => v || null),
  place: z
    .string()
    .trim()
    .max(120)
    .transform((v) => v || null),
  why: z
    .string()
    .trim()
    .max(600)
    .transform((v) => v || null),
});
