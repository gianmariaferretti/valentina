import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { coupons, togetherCoupons } from "../src/data/coupons.ts";
import { apartCoupons } from "../src/data/coupons-apart.ts";
import { casinoPrizes, casinoSets } from "../src/data/casino-prizes.ts";
import {
  canRedeemCoupon,
  createWalletItem,
  isVisibleInWallet,
  pickCouponOfTheDay,
  resolveCoupon,
  sortWalletItems,
} from "../src/features/coupons/lib/coupon-domain.ts";
import { casinoWinToCoupon } from "../src/features/casino/lib/casino-coupons.ts";

const EMPTY = { version: 1, redemptions: [], unlockedCouponIds: [] };
const RETIRED = ["breakfast-in-bed-encore", "spanish-lesson-30-standard"];

function sourceFiles(directory) {
  return readdirSync(directory).flatMap((name) => {
    const path = join(directory, name);
    if (statSync(path).isDirectory()) return sourceFiles(path);
    return /\.(ts|tsx|sql|json)$/.test(name) ? [path] : [];
  });
}

test("Coupon ids and codes are unique across the whole catalogue", () => {
  const ids = coupons.map((coupon) => coupon.id);
  const codes = coupons.map((coupon) => coupon.code);
  assert.equal(new Set(ids).size, ids.length);
  assert.equal(new Set(codes).size, codes.length);
  for (const prize of casinoPrizes) assert.ok(!prize.id.startsWith("casino-c"));
  assert.equal(
    new Set(casinoPrizes.map((prize) => prize.id)).size,
    casinoPrizes.length,
  );
});

test("Every coupon has a setting; all historical coupons are Together", () => {
  for (const coupon of coupons)
    assert.ok(["together", "apart"].includes(coupon.setting), coupon.id);
  assert.equal(togetherCoupons.length, 37);
  for (const coupon of togetherCoupons)
    assert.equal(coupon.setting, "together");
});

test("23 Apart coupons with the right rarity counts, codes and series badges", () => {
  assert.equal(apartCoupons.length, 23);
  const byRarity = Object.groupBy(apartCoupons, (coupon) => coupon.rarity);
  assert.equal(byRarity.standard.length, 10);
  assert.equal(byRarity.premium.length, 9);
  assert.equal(byRarity.legendary.length, 4);
  assert.equal(byRarity.impossible, undefined);
  apartCoupons.forEach((coupon, index) => {
    assert.equal(coupon.setting, "apart");
    assert.equal(coupon.code, `GV-D${String(index + 1).padStart(2, "0")}`);
    assert.ok(coupon.terms.length > 0);
  });
  const movies = apartCoupons.filter(
    (coupon) => coupon.title === "Saturday Movie Night",
  );
  assert.deepEqual(
    movies.map((coupon) => [coupon.id, coupon.series]),
    [
      ["saturday-movie-night-1", { index: 1, total: 3 }],
      ["saturday-movie-night-2", { index: 2, total: 3 }],
      ["saturday-movie-night-3", { index: 3, total: 3 }],
    ],
  );
  assert.ok(apartCoupons.some((coupon) => coupon.id === "im-coming-to-you"));
});

test("Retired duplicates stay in the data, hidden and unredeemable", () => {
  for (const id of RETIRED) {
    const coupon = coupons.find((item) => item.id === id);
    assert.ok(coupon, `${id} must remain so saved redemptions resolve`);
    assert.equal(coupon.retired, true);
    const unlocked = resolveCoupon(coupon, {
      ...EMPTY,
      unlockedCouponIds: [id],
    });
    assert.equal(canRedeemCoupon(unlocked), false);
    assert.equal(isVisibleInWallet(resolveCoupon(coupon, EMPTY)), false);
    const redeemed = resolveCoupon(coupon, {
      ...EMPTY,
      redemptions: [{ couponId: id, redeemedAt: "2026-01-01T00:00:00Z" }],
    });
    assert.equal(
      isVisibleInWallet(redeemed),
      true,
      "a used one stays in the album",
    );
  }
});

test("Retired coupons are not referenced by games, rewards, quizzes or SQL", () => {
  const files = [...sourceFiles("src"), ...sourceFiles("supabase")].filter(
    (path) => !path.endsWith(join("data", "coupons.ts")),
  );
  for (const path of files) {
    const text = readFileSync(path, "utf8");
    for (const id of RETIRED)
      assert.ok(!text.includes(`"${id}"`), `${id} in ${path}`);
    for (const id of RETIRED)
      assert.ok(!text.includes(`'${id}'`), `${id} in ${path}`);
  }
});

test("Wallet items carry setting, series and redemption date; ordering is stable", () => {
  const item = createWalletItem(resolveCoupon(apartCoupons[1], EMPTY));
  assert.equal(item.setting, "apart");
  assert.deepEqual(item.series, { index: 2, total: 3 });
  const items = [
    { ...item, id: "r", status: "redeemed" },
    { ...item, id: "l", status: "locked" },
    { ...item, id: "a", status: "available" },
    { ...item, id: "u", status: "undiscovered" },
  ];
  assert.deepEqual(
    sortWalletItems(items).map((entry) => entry.id),
    ["a", "l", "u", "r"],
  );
});

test("Coupon of the day is deterministic per day", () => {
  const candidates = apartCoupons.map((coupon) => ({ id: coupon.id }));
  assert.equal(
    pickCouponOfTheDay(candidates, 20_000)?.id,
    pickCouponOfTheDay(candidates, 20_000)?.id,
  );
  const picks = new Set(
    Array.from(
      { length: 30 },
      (_, day) => pickCouponOfTheDay(candidates, 20_000 + day)?.id,
    ),
  );
  assert.ok(picks.size > 5);
  assert.equal(pickCouponOfTheDay([], 1), null);
});

test("Casino wins become separate wallet coupons in the right section", () => {
  const coupon = casinoWinToCoupon({
    couponId: "casino-c007",
    code: "GV-C007",
    prizeId: "video-call-your-rules",
    wonAt: "2026-11-16T10:00:00Z",
  });
  assert.equal(coupon.setting, "apart");
  assert.equal(coupon.source, "casino");
  assert.equal(coupon.code, "GV-C007");
  assert.equal(
    casinoWinToCoupon({
      couponId: "casino-c008",
      code: "GV-C008",
      prizeId: "not-a-prize",
      wonAt: "2026-11-16T10:00:00Z",
    }),
    null,
  );
  for (const set of casinoSets) {
    const pieces = casinoPrizes.filter((prize) => prize.setId === set.id);
    assert.equal(pieces.length, 4, set.id);
    const weights = pieces.map((piece) => piece.weight).sort((a, b) => a - b);
    assert.ok(weights[0] < weights[1], `${set.id} keystone must be rarer`);
    assert.ok(casinoPrizes.some((prize) => prize.id === set.bonusPrizeId));
  }
});
