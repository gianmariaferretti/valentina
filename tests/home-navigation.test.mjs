import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  memoriesNavigation,
  moreNavigation,
  tabFor,
  tabNavigation,
} from "../src/data/navigation.ts";
import {
  arcPath,
  coverCities,
  coverRoutes,
  togetherAt,
  TOGETHER_SINCE,
} from "../src/features/cover/lib/together.ts";
import {
  closestToUnlock,
  daysUntil,
  freshCouponCount,
  recentlyUnlocked,
} from "../src/features/home/lib/home-wallet.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const item = (id, status, extra = {}) => ({
  id,
  code: id.toUpperCase(),
  title: id,
  shortDescription: "",
  category: "dates",
  rarity: "standard",
  setting: "together",
  type: "standard",
  status,
  href: `/coupons/${id}`,
  callToAction: null,
  secret: false,
  source: "catalogue",
  series: null,
  unlockCondition: null,
  redeemedAt: null,
  scratchable: false,
  redeemable: status === "available",
  ...extra,
});
const coupon = (
  id,
  challengeId = null,
  createdAt = "2025-10-31T00:00:00Z",
) => ({
  id,
  challengeId,
  createdAt,
});
const game = (gameId, progress) => ({ gameId, progress });

test("closest to unlock ranks sealed game coupons by best progress, never 100%", () => {
  const items = [
    item("a", "locked"),
    item("b", "locked"),
    item("c", "locked"),
    item("d", "locked"),
    item("e", "available"),
  ];
  const coupons = [
    coupon("a", "snake"),
    coupon("b", "maze"),
    coupon("c", null),
    coupon("d", "memories"),
    coupon("e", "snake"),
  ];
  const result = closestToUnlock(items, coupons, [
    game("snake", 40),
    game("maze", 100),
    game("memories", 5),
  ]);
  assert.deepEqual(
    result.map((r) => [r.coupon.id, r.percent]),
    [
      ["b", 99],
      ["a", 40],
      ["d", 5],
    ],
  );
  assert.deepEqual(closestToUnlock([item("x", "available")], [], []), []);
});

test("recently unlocked: newest first, only with a known date", () => {
  const items = [
    item("old", "available"),
    item("new", "redeemed"),
    item("casino-1", "available", { source: "casino" }),
    item("undated", "available"),
    item("sealed", "locked"),
  ];
  const coupons = [
    coupon("old"),
    coupon("new"),
    coupon("casino-1", null, "2026-11-10T10:00:00Z"),
    coupon("undated"),
    coupon("sealed"),
  ];
  const state = {
    version: 1,
    redemptions: [],
    unlockedCouponIds: ["old", "new", "sealed"],
    unlockedAt: {
      old: "2026-01-01T00:00:00Z",
      new: "2026-11-15T00:00:00Z",
      sealed: "2026-11-16T00:00:00Z",
    },
  };
  assert.deepEqual(
    recentlyUnlocked(items, coupons, state).map((r) => r.coupon.id),
    ["new", "casino-1", "old"],
  );
  const now = Date.parse("2026-11-17T00:00:00Z");
  // "new" is used, "old" too old: only the casino win is fresh.
  assert.equal(freshCouponCount(items, coupons, state, 7, now), 1);
});

test("days until the next meeting", () => {
  const now = new Date(2026, 10, 17, 22, 0);
  assert.equal(daysUntil(new Date(2026, 10, 20, 9, 0).toISOString(), now), 3);
  assert.equal(daysUntil(new Date(2026, 10, 17, 23, 0).toISOString(), now), 0);
  assert.equal(daysUntil(new Date(2026, 10, 1).toISOString(), now), null);
  assert.equal(daysUntil(null, now), null);
  assert.equal(daysUntil("soon", now), null);
});

test("days together count from 31.10.2025 in Rome", () => {
  assert.equal(
    new Date(TOGETHER_SINCE).toISOString(),
    "2025-10-30T23:00:00.000Z",
  );
  assert.deepEqual(togetherAt(TOGETHER_SINCE - 5000), {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const t = togetherAt(Date.parse("2026-10-31T00:00:05Z"));
  assert.equal(t.days, 365);
  assert.equal(t.hours, 1);
  assert.equal(t.seconds, 5);
});

test("cover routes use known cities and draw arcs", () => {
  for (const [from, to] of coverRoutes) {
    assert.ok(from in coverCities && to in coverCities, `${from}-${to}`);
  }
  assert.match(arcPath([0, 0], [100, 0]), /^M0 0 Q50 -22 100 0$/);
});

test("tabs: Coupons · Casino · Games · Memories, then More", () => {
  assert.deepEqual(
    tabNavigation.map((i) => i.shortTitle),
    ["Coupons", "Casino", "Games", "Memories"],
  );
  assert.deepEqual(
    memoriesNavigation.map((i) => i.href),
    [
      "/map",
      "/gallery",
      "/open-when",
      "/year-two",
      "/next-time",
      "/bucket-list",
      "/songs",
    ],
  );
  assert.deepEqual(
    moreNavigation.map((i) => i.href),
    [
      "/quiz",
      "/italian-corner",
      "/relationship-contract",
      "/awards",
      "/achievements",
      "/secret",
    ],
  );
  assert.equal(tabFor("/home"), "/coupons");
  assert.equal(tabFor("/coupons/abc"), "/coupons");
  assert.equal(tabFor("/coupons/casino"), "/coupons/casino");
  assert.equal(tabFor("/challenges/snake"), "/challenges");
  assert.equal(tabFor("/songs"), "/memories");
  assert.equal(tabFor("/memories"), "/memories");
  assert.equal(tabFor("/la-dolce-lingua/lessons"), "more");
  assert.equal(tabFor("/quiz"), "more");
  assert.equal(tabFor("/nowhere"), null);
});

test("new pages require the session; the public cover stays public-safe", () => {
  for (const page of ["home", "memories"])
    assert.match(
      read(`src/app/(experience)/${page}/page.tsx`),
      /await requireAccessSession\(\)/,
    );
  const cover = [
    read("src/app/page.tsx"),
    read("src/features/cover/components/travel-lines.tsx"),
    read("src/features/cover/components/boarding-pass.tsx"),
    read("src/features/cover/lib/together.ts"),
  ].join("\n");
  // No private data, media, Supabase or session code on the public page.
  assert.doesNotMatch(
    cover,
    /data\/places|media|supabase|getMediaAsset|session/i,
  );
  assert.match(read("src/app/page.tsx"), /href="\/access"/);
  assert.match(read("src/app/page.tsx"), /YEAR TWO/);
});

test("the phone tab bar respects the iPhone safe area", () => {
  assert.match(read("src/app/layout.tsx"), /viewportFit: "cover"/);
  const header = read("src/components/layout/site-header.tsx");
  assert.match(header, /env\(safe-area-inset-bottom\)/);
  assert.match(header, /from "vaul"/);
});
