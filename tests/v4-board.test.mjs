import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  boardingIn,
  boardingInSpoken,
  boardStatus,
  FLAP_DRUM,
  flapChars,
  flipPath,
  MAX_FLIPS,
} from "../src/features/life/lib/board.ts";
import { countdownTo } from "../src/features/life/lib/countdown.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const at = "2026-12-20T12:00:00+01:00";
const before = (ms) => countdownTo(at, Date.parse(at) - ms);
const DAY = 86_400_000;

test("a flap rolls forward through the drum, one character at a time", () => {
  assert.deepEqual(flipPath("A", "D"), ["B", "C", "D"]);
  assert.deepEqual(flipPath("A", "A"), []);
  // Forward only: from Z to A it wraps through the digits and symbols.
  const wrap = flipPath("Z", "A");
  assert.equal(wrap.at(-1), "A");
  assert.ok(wrap.length <= MAX_FLIPS);
  // Long trips skip ahead evenly but always end on the target.
  const long = flipPath(" ", "9");
  assert.equal(long.length, MAX_FLIPS);
  assert.equal(long.at(-1), "9");
  const drum = [...FLAP_DRUM];
  for (let i = 1; i < long.length; i++)
    assert.ok(drum.indexOf(long[i]) > drum.indexOf(long[i - 1]));
  // Off the drum (accents, emoji): one flip.
  assert.deepEqual(flipPath("A", "Í"), ["Í"]);
  assert.deepEqual(flipPath("É", "A"), ["A"]);
  assert.deepEqual(flapChars("Medellín ❤️"), [..."MEDELLÍN ❤"]);
});

test("the status jokes as the day gets closer", () => {
  assert.equal(boardStatus(before(30 * DAY), "on-time"), "ON TIME");
  assert.equal(boardStatus(before(10 * DAY), "on-time"), "MISSING YOU");
  assert.equal(boardStatus(before(DAY + 5), "on-time"), "ALMOST");
  assert.equal(boardStatus(before(0), "on-time"), "LANDED ❤");
  assert.equal(boardStatus(before(30 * DAY), "delayed"), "DELAYED");
  assert.equal(boardStatus(before(30 * DAY), "boarding"), "NOW BOARDING");
  // Landing beats whatever the panel says.
  assert.equal(boardStatus(before(0), "delayed"), "LANDED ❤");
  assert.equal(boardStatus(null, "on-time"), "SCHEDULED");
});

test("boarding in: days and hours far away, seconds on the last day", () => {
  const far = before(12 * DAY + 4 * 3_600_000 + 32 * 60_000 + 10_000);
  assert.equal(boardingIn(far), "12D 04H 32M");
  assert.equal(
    boardingInSpoken(far),
    "Boarding in 12 days, 4 hours, 32 minutes",
  );
  const close = before(4 * 3_600_000 + 32 * 60_000 + 10_000);
  assert.equal(boardingIn(close), "04:32:10");
  assert.equal(boardingInSpoken(close), "Boarding in 4 hours, 32 minutes");
  assert.equal(boardingIn(before(0)), "NOW");
  assert.equal(boardingIn(null), "TBA");
  for (const text of [boardingIn(far), boardingIn(close), "VG031", "31"])
    for (const char of text) assert.ok(FLAP_DRUM.includes(char), char);
});

test("the board: rows, timer, sound only on request, pauses off screen", () => {
  const board = read("src/features/life/components/departure-board.tsx");
  for (const label of ["Flight", "Gate", "From", "To", "Status"])
    assert.match(board, new RegExp(`label="${label}"`));
  assert.match(board, /"Boarding in"/);
  assert.match(board, /role="timer"/);
  assert.match(board, /aria-label=\{boardingInSpoken\(countdown\)\}/);
  assert.match(board, /if \(sound\) clack\(\)/);
  assert.match(board, /IntersectionObserver/);
  assert.match(board, /document\.hidden/);
  assert.match(board, /prefersReducedMotion\(\)/);
  const clack = read("src/features/life/components/clack.ts");
  assert.match(clack, /createBiquadFilter/);
  assert.doesNotMatch(clack, /\.(wav|mp3|ogg)/);
  const flap = read("src/features/life/components/split-flap.tsx");
  // Reduced motion fades; screen readers get the plain text.
  assert.match(flap, /styles\.fade/);
  assert.match(flap, /className="sr-only"/);
  const css = read("src/features/life/components/next-time.module.css");
  assert.match(css, /@keyframes land-bounce/);
  assert.match(css, /prefers-reduced-motion: reduce[\s\S]*\.leafTop/);
  // The split-flap package was evaluated (0BSD) but not installed.
  const pkg = JSON.parse(read("package.json"));
  assert.equal(
    pkg.dependencies["@daformat/react-split-flap-display"],
    undefined,
  );
});
