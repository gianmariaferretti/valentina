import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  boardingLine,
  countdownTo,
  inFinalWeek,
} from "../src/features/life/lib/countdown.ts";
import { MAX_PHOTO_BYTES, photoKind } from "../src/features/life/lib/photo.ts";
import {
  isoToRomeLocal,
  romeLocalToIso,
} from "../src/features/life/lib/rome-time.ts";
import {
  citiesSchema,
  defaultCities,
  nextTimeSchema,
  rewardSchema,
  songSchema,
  spotifyEmbed,
} from "../src/features/life/lib/schemas.ts";
import {
  parseOpenMeteo,
  weatherIcon,
} from "../src/features/life/lib/weather.ts";

const at = "2026-12-20T15:30:00.000Z";
const base = new Date(at).getTime();

test("countdown splits days, hours, minutes and seconds", () => {
  const c = countdownTo(
    at,
    base - (12 * 86400 + 4 * 3600 + 32 * 60 + 10) * 1000,
  );
  assert.deepEqual([c.days, c.hours, c.minutes, c.seconds], [12, 4, 32, 10]);
  assert.equal(boardingLine(c), "Boarding in 12 days 04:32:10");
  assert.equal(c.almost, false);
  assert.equal(c.landed, false);
});

test("countdown gets festive under a day and lands at zero", () => {
  assert.equal(countdownTo(at, base - 3600_000).almost, true);
  const landed = countdownTo(at, base + 5000);
  assert.equal(landed.landed, true);
  assert.equal(boardingLine(landed), "LANDED ❤️");
  assert.equal(countdownTo(null, base), null);
  assert.equal(countdownTo("nonsense", base), null);
});

test("the Apart glow follows the same date (final week only)", () => {
  assert.equal(inFinalWeek(at, base - 6 * 86_400_000), true);
  assert.equal(inFinalWeek(at, base - 8 * 86_400_000), false);
  assert.equal(inFinalWeek(at, base + 1), false);
});

test("Rome local time round-trips, winter and summer", () => {
  assert.equal(romeLocalToIso("2026-12-20T16:30"), "2026-12-20T15:30:00.000Z");
  assert.equal(romeLocalToIso("2026-07-01T12:00"), "2026-07-01T10:00:00.000Z");
  assert.equal(isoToRomeLocal("2026-12-20T15:30:00.000Z"), "2026-12-20T16:30");
  assert.equal(romeLocalToIso("20/12/2026"), null);
  assert.equal(isoToRomeLocal(null), "");
});

test("Open-Meteo parsing is defensive and rounds", () => {
  const weather = parseOpenMeteo({
    current: { temperature_2m: 13.6, weather_code: 3, is_day: 0 },
    daily: {
      time: ["2026-11-17", "2026-11-18"],
      weather_code: [61, 0],
      temperature_2m_max: [15.4, 16.6],
      temperature_2m_min: [8.2, null],
    },
  });
  assert.equal(weather.temperature, 14);
  assert.equal(weather.isDay, false);
  assert.deepEqual(weather.daily, [
    { date: "2026-11-17", max: 15, min: 8, code: 61 },
  ]);
  assert.equal(parseOpenMeteo({}), null);
  assert.equal(parseOpenMeteo(null), null);
  assert.equal(weatherIcon(0, false).icon, "🌙");
  assert.equal(weatherIcon(95).label, "Thunderstorm");
});

test("cities, next time and rewards are validated", () => {
  assert.equal(citiesSchema.safeParse({ cities: defaultCities }).success, true);
  assert.equal(
    citiesSchema.safeParse({
      cities: [{ ...defaultCities[0], timeZone: "Mars/Olympus" }],
    }).success,
    false,
  );
  assert.equal(
    nextTimeSchema.safeParse({
      at,
      from: "Rome",
      to: "Cartagena",
      status: "delayed",
    }).success,
    true,
  );
  assert.equal(
    nextTimeSchema.safeParse({
      at,
      from: "Rome",
      to: "Cartagena",
      status: "cancelled",
    }).success,
    false,
  );
  assert.equal(rewardSchema.safeParse({ kisses: 20 }).success, true);
  assert.equal(rewardSchema.safeParse({ kisses: 5000 }).success, false);
  assert.equal(
    rewardSchema.safeParse({ couponId: "DROP TABLE" }).success,
    false,
  );
});

test("Spotify links become embeds; anything else is refused", () => {
  assert.equal(
    spotifyEmbed(
      "https://open.spotify.com/intl-it/track/4uLU6hMCjMI75M1A2tKUQC?si=x",
    ),
    "https://open.spotify.com/embed/track/4uLU6hMCjMI75M1A2tKUQC",
  );
  assert.equal(
    spotifyEmbed("https://evil.example/track/4uLU6hMCjMI75M1A2tKUQC"),
    null,
  );
  assert.equal(spotifyEmbed(null), null);
  const ok = songSchema.safeParse({
    title: "A",
    artist: "B",
    spotifyUrl: "",
    date: "",
    place: "",
    why: "",
  });
  assert.equal(ok.success, true);
  assert.equal(ok.data.spotifyUrl, null);
  assert.equal(
    songSchema.safeParse({
      title: "A",
      artist: "B",
      spotifyUrl: "javascript:alert(1)",
      date: "",
      place: "",
      why: "",
    }).success,
    false,
  );
});

test("photos are recognised by magic bytes, not by name", () => {
  const webp = new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50, 0x56, 0x50,
    0x38, 0x20,
  ]);
  const jpg = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
  const svg = new TextEncoder().encode("<svg onload=alert(1)>");
  assert.equal(photoKind(webp), "webp");
  assert.equal(photoKind(jpg), "jpg");
  assert.equal(photoKind(svg), null);
  assert.ok(MAX_PHOTO_BYTES <= 3_000_000);
});

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

test("new pages, actions and the photo route require the session", () => {
  for (const page of ["next-time", "bucket-list", "songs"])
    assert.match(
      read(`src/app/(experience)/${page}/page.tsx`),
      /await requireAccessSession\(\)/,
    );
  for (const page of ["next-time", "bucket-list", "canzoni", "citta"])
    assert.match(
      read(`src/app/admin/${page}/page.tsx`),
      /await requireAdminSession\(\)/,
    );
  const actions = read("src/features/life/actions/lists.ts");
  for (const name of [
    "toggleListItem",
    "proposeListItem",
    "uploadBucketPhoto",
  ]) {
    const body = actions
      .split(`export async function ${name}`)[1]
      .split("export async function")[0];
    assert.match(body, /hasValidAccessSession\(\)/, name);
  }
  const route = read("src/app/api/bucket-photo/[id]/route.ts");
  assert.match(route, /hasValidAccessSession|requireAccessSession/);
  assert.match(route, /no-store/);
  const admin = read("src/features/admin/actions/life.ts");
  const bodies = admin.split("export async function ").slice(1);
  assert.ok(bodies.length >= 10);
  for (const body of bodies)
    assert.match(body, /^\w+\([^]*?\{\s*return withAdmin\(/, body.slice(0, 30));
});

test("CSP allows only the Spotify player frame", () => {
  assert.match(
    read("next.config.ts"),
    /frame-src https:\/\/open\.spotify\.com/,
  );
});

test("the migration is service-role only with forced RLS", () => {
  const sql = read(
    "supabase/migrations/20261117125526_life_lists_and_songs.sql",
  );
  for (const table of ["life_lists", "songs"]) {
    assert.match(
      sql,
      new RegExp(`alter table public.${table} force row level security`),
    );
    assert.match(
      sql,
      new RegExp(
        `revoke all on public.${table} from public, anon, authenticated`,
      ),
    );
  }
  assert.match(sql, /security invoker/);
  assert.match(sql, /set search_path = ''/);
});
