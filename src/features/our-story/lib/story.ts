/** Pure helpers for /our-story: words from the panel over the code's. */

import { z } from "zod";

import type { StoryChapterWords, StoryWords } from "../../../data/our-story.ts";

const line = (max: number) => z.string().trim().min(1).max(max);

export const storyWordsSchema = z.object({
  intro: line(600),
  chapters: z.record(
    z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
    z.object({ title: line(90), text: line(900) }),
  ),
});

export interface StoryPhoto {
  readonly src: string;
  readonly alt: string;
  readonly width: number;
  readonly height: number;
  readonly caption: string;
}

export interface StoryPlace {
  readonly slug: string;
  readonly city: string;
  readonly country: string;
  readonly coordinates: readonly [number, number];
  readonly dateStart: string | null;
  readonly dateLabel: string;
  readonly atlasOrder: number;
  readonly photos: readonly StoryPhoto[];
}

export interface StoryChapter extends StoryPlace, StoryChapterWords {
  readonly index: number;
}

/** Panel overrides win chapter by chapter; anything invalid is ignored. */
export function mergeStoryWords(
  defaults: StoryWords,
  stored: unknown,
): StoryWords {
  const parsed = storyWordsSchema.partial().safeParse(stored);
  if (!parsed.success) return defaults;
  return {
    intro: parsed.data.intro ?? defaults.intro,
    chapters: { ...defaults.chapters, ...(parsed.data.chapters ?? {}) },
  };
}

/**
 * One chapter per place that has words, in time order where the dates are
 * known (undated places follow, in atlas order). At most three photos each.
 */
export function buildChapters(
  places: readonly StoryPlace[],
  words: StoryWords,
): StoryChapter[] {
  return places
    .filter((place) => words.chapters[place.slug])
    .toSorted((a, b) => {
      if (a.dateStart && b.dateStart)
        return a.dateStart.localeCompare(b.dateStart);
      if (a.dateStart) return -1;
      if (b.dateStart) return 1;
      return a.atlasOrder - b.atlasOrder;
    })
    .map((place, index) => ({
      ...place,
      ...words.chapters[place.slug],
      photos: place.photos.slice(0, 3),
      index,
    }));
}

/**
 * The winding route behind the chapters: one bend per chapter, alternating
 * sides, drawn in a `width` × `height` box (pixels of the story column, so
 * the stroke and the drawing progress are never stretched).
 */
export function routePath(
  count: number,
  width = 100,
  height = count * 100,
): string {
  if (count <= 0) return "";
  const sx = width / 100;
  const sy = height / (count * 100);
  const r = (n: number) => Math.round(n * 10) / 10;
  const at = (x: number, y: number) => `${r(x * sx)} ${r(y * sy)}`;
  const point = (i: number) => [i % 2 === 0 ? 30 : 70, i * 100 + 50] as const;
  let d = `M${at(50, 0)} C${at(50, 20)} ${at(point(0)[0], 30)} ${at(...point(0))}`;
  for (let i = 1; i < count; i++) {
    const [x0, y0] = point(i - 1);
    const [x1, y1] = point(i);
    d += ` C${at(x0, y0 + 50)} ${at(x1, y1 - 50)} ${at(x1, y1)}`;
  }
  const [xl, yl] = point(count - 1);
  d += ` C${at(xl, yl + 30)} ${at(50, yl + 30)} ${at(50, count * 100)}`;
  return d;
}
