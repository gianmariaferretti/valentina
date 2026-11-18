import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

import { ourStoryDefaults } from "../src/data/our-story.ts";
import {
  buildChapters,
  mergeStoryWords,
  routePath,
} from "../src/features/our-story/lib/story.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const place = (slug, atlasOrder, dateStart = null) => ({
  slug,
  city: slug,
  country: "X",
  coordinates: [0, 0],
  dateStart,
  dateLabel: "Date to be added",
  atlasOrder,
  photos: Array.from({ length: 5 }, (_, i) => ({
    src: `/api/private-media/${slug}-${i}`,
    alt: "",
    width: 10,
    height: 10,
    caption: "",
  })),
});

test("placeholders are obviously placeholders", () => {
  assert.match(ourStoryDefaults.intro, /\[Placeholder/);
  for (const words of Object.values(ourStoryDefaults.chapters)) {
    assert.match(words.title, /^\[Placeholder\]/);
    assert.match(words.text, /^\[Placeholder text/);
  }
});

test("panel words win chapter by chapter; bad data is ignored", () => {
  const merged = mergeStoryWords(ourStoryDefaults, {
    chapters: { rome: { title: "Rome, at last", text: "Real words." } },
  });
  assert.equal(merged.chapters.rome.title, "Rome, at last");
  assert.equal(merged.chapters.london, ourStoryDefaults.chapters.london);
  assert.equal(merged.intro, ourStoryDefaults.intro);
  assert.equal(
    mergeStoryWords(ourStoryDefaults, { intro: "" }),
    ourStoryDefaults,
  );
  assert.equal(mergeStoryWords(ourStoryDefaults, "nope"), ourStoryDefaults);
  assert.equal(
    mergeStoryWords(ourStoryDefaults, {
      chapters: { "../evil": { title: "x", text: "y" } },
    }),
    ourStoryDefaults,
  );
});

test("chapters: dated first in time order, then atlas order, three photos", () => {
  const words = {
    intro: "i",
    chapters: Object.fromEntries(
      ["a", "b", "c", "d"].map((k) => [k, { title: k, text: k }]),
    ),
  };
  const chapters = buildChapters(
    [
      place("a", 2),
      place("b", 1),
      place("c", 9, "2026-05-01"),
      place("d", 5, "2025-12-24"),
      place("no-words", 0),
    ],
    words,
  );
  assert.deepEqual(
    chapters.map((c) => c.slug),
    ["d", "c", "b", "a"],
  );
  assert.deepEqual(
    chapters.map((c) => c.index),
    [0, 1, 2, 3],
  );
  assert.ok(chapters.every((c) => c.photos.length === 3));
  const d = routePath(4);
  assert.match(d, /^M50 0 /);
  assert.match(d, / 50 400$/);
  assert.equal(routePath(0), "");
});

test("the page: session first, private photos, Motion not GSAP", () => {
  const page = read("src/app/(experience)/our-story/page.tsx");
  assert.match(page, /await requireAccessSession\(\)/);
  const story = read("src/features/our-story/components/story.tsx");
  assert.match(story, /from "motion\/react"/);
  assert.match(story, /motion-reduce:/);
  assert.match(
    read("src/features/our-story/components/story.module.css"),
    /prefers-reduced-motion: reduce/,
  );
  assert.match(story, /Year Two — to be continued…/);
  assert.match(story, /href="\/home"/);
  assert.match(story, /RollingNumber/);
  assert.match(story, /pathLength/);
  assert.match(story, /<Tape/);
  // No GSAP anywhere, so no GPL exception is needed; no GPL code here.
  const pkg = JSON.parse(read("package.json"));
  assert.equal(pkg.dependencies.gsap, undefined);
  for (const file of [page, story])
    assert.doesNotMatch(file, /gsap|pokemon-cards|holo/i);
  assert.equal(
    existsSync(new URL("../LICENSE-EXCEPTIONS.md", import.meta.url)),
    false,
  );
  // The panel can edit the words.
  const action = read("src/features/admin/actions/our-story.ts");
  for (const body of action.split("export async function ").slice(1))
    assert.match(body, /return withAdmin\(/);
  assert.match(action, /storyWordsSchema\.safeParse/);
});
