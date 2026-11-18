import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  splitHighlights,
  stripHighlights,
} from "../src/components/annotations/highlights.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("==text== becomes a highlighter part; stray markers stay text", () => {
  assert.deepEqual(splitHighlights("I ==really== missed you"), [
    { text: "I ", marked: false },
    { text: "really", marked: true },
    { text: " missed you", marked: false },
  ]);
  assert.deepEqual(splitHighlights("==all of it=="), [
    { text: "all of it", marked: true },
  ]);
  assert.deepEqual(splitHighlights("a == b and ===="), [
    { text: "a == b and ====", marked: false },
  ]);
  assert.deepEqual(
    splitHighlights("==x== and ==y==").map((p) => p.marked),
    [true, false, true],
  );
  // Never across lines.
  assert.equal(splitHighlights("==one\ntwo==").length, 1);
  assert.equal(stripHighlights("I ==really== did"), "I really did");
});

test("one wrapper: lazy library, on view, already drawn with reduced motion", () => {
  const mark = read("src/components/annotations/mark.tsx");
  assert.match(mark, /^"use client";/);
  assert.match(mark, /import\("rough-notation"\)/);
  assert.doesNotMatch(mark, /^import [^;]* from "rough-notation";/m);
  assert.match(mark, /IntersectionObserver/);
  assert.match(mark, /animate: !still && !instant/);
  assert.match(mark, /annotation\?\.remove\(\)/);
  // Only the wrapper talks to the library.
  for (const file of [
    "src/features/life/components/bucket-list.tsx",
    "src/features/life/components/checklist.tsx",
    "src/features/home/components/daily-coupon.tsx",
  ])
    assert.doesNotMatch(read(file), /from "rough-notation"/, file);
});

test("marks where the prompt wants them", () => {
  const bucket = read("src/features/life/components/bucket-list.tsx");
  assert.match(bucket, /type="circle"[\s\S]*DONE/);
  assert.match(
    bucket,
    /active=\{Boolean\(item\.doneAt\)\}[\s\S]*type="strike-through"/,
  );
  assert.match(
    bucket,
    /item\.proposedBy === "valentina"[\s\S]*type="highlight"/,
  );
  assert.match(
    read("src/app/(experience)/home/page.tsx"),
    /type="underline"[\s\S]*Good to see you/,
  );
  const daily = read("src/features/home/components/daily-coupon.tsx");
  assert.match(daily, /active=\{firstToday\}/);
  assert.match(daily, /vg\.daily-coupon\.circled/);
  assert.match(
    read("src/app/(experience)/next-time/page.tsx"),
    /type="circle"[\s\S]*landingDay\.format/,
  );
  assert.match(
    read("src/features/life/components/checklist.tsx"),
    /list === "suitcase"[\s\S]*type="strike-through"/,
  );
  assert.match(
    read("src/features/open-when/components/letter.tsx"),
    /<HighlightedText text=\{paragraph\} \/>/,
  );
  assert.match(
    read("src/features/life/components/song-list.tsx"),
    /<HighlightedText text=\{song\.why\} \/>/,
  );
  assert.match(
    read("THIRD_PARTY_NOTICES.md"),
    /`rough-notation` \| 0\.5\.1\s*\| MIT/,
  );
});
