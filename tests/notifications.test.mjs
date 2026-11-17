import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import { NextRequest } from "next/server.js";

import {
  newNonce,
  signActionToken,
  verifyActionToken,
} from "../src/features/notifications/lib/action-token.ts";
import {
  couponRedeemedEmail,
  formatRome,
  missYouEmail,
} from "../src/features/notifications/lib/email-templates.ts";
import {
  DAILY_EMAIL_CAP,
  MISS_YOU_GAP_SECONDS,
  notificationSettingsSchema,
  parseNotificationSettings,
} from "../src/features/notifications/lib/settings.ts";

process.env.AUTH_SECRET = "notifications-test-secret-longer-than-32";
delete process.env.SUPABASE_URL;
const { proxy } = await import("../src/proxy.ts");

const secret = "e".repeat(40);
const now = 1_800_000_000;

test("signed email links: valid once signed, expired, tampered or weak secret rejected", () => {
  const nonce = newNonce();
  const token = signActionToken(secret, nonce, now + 3600);
  assert.deepEqual(verifyActionToken(secret, token, now), {
    nonce,
    expires: now + 3600,
  });
  assert.equal(verifyActionToken(secret, token, now + 3601), null, "expired");
  assert.equal(
    verifyActionToken("x".repeat(40), token, now),
    null,
    "other secret",
  );
  const tampered = token.slice(0, -1) + (token.endsWith("A") ? "B" : "A");
  assert.equal(verifyActionToken(secret, tampered, now), null, "tampered");
  assert.equal(
    verifyActionToken(
      secret,
      `${nonce}.${now + 9999}.${token.split(".")[2]}`,
      now,
    ),
    null,
    "extended expiry",
  );
  assert.equal(
    verifyActionToken("short", token, now),
    null,
    "secret under 32 chars",
  );
});

test("coupon email: clear subject, Rome time, button, only the title is shared", () => {
  const email = couponRedeemedEmail({
    title: "30 Minute Massage",
    setting: "together",
    rarity: "premium",
    redeemedAt: "2026-11-17T08:15:00.000Z",
    deliverUrl: "https://vg.test/action/abc",
  });
  assert.equal(email.subject, "🎟️ Valentina ha usato: 30 Minute Massage");
  assert.match(email.text, /\(Together · premium — 17\/11 09:15\)/);
  assert.match(email.html, /✅ Consegnato/);
  assert.match(email.html, /href="https:\/\/vg\.test\/action\/abc"/);
  assert.equal(formatRome("2026-07-01T10:00:00Z"), "01/07 12:00");
});

test("Miss you email bundles taps and escapes HTML", () => {
  const email = missYouEmail({
    taps: 4,
    heartUrl: "https://vg.test/a?x=1&y=<2>",
    callUrl: "tel:+391234",
  });
  assert.equal(email.subject, "💌 Valentina misses you ×4");
  assert.match(email.html, /❤️ Send a heart back/);
  assert.match(email.html, /📞 Call her/);
  assert.ok(!email.html.includes("<2>"), "attribute values are escaped");
  assert.equal(
    missYouEmail({ taps: 1, heartUrl: null, callUrl: null }).subject,
    "💌 Valentina misses you",
  );
});

test("settings: digest off by default, call link validated, limits as promised", () => {
  assert.equal(parseNotificationSettings(undefined).digest, false);
  assert.equal(parseNotificationSettings({ digest: true }).digest, true);
  assert.equal(
    notificationSettingsSchema.shape.callLink.safeParse("javascript:alert(1)")
      .success,
    false,
  );
  assert.equal(
    notificationSettingsSchema.shape.callLink.safeParse(
      "https://wa.me/573001234567",
    ).success,
    true,
  );
  assert.equal(
    notificationSettingsSchema.shape.callLink.safeParse("tel:+57 300 123 4567")
      .success,
    true,
  );
  assert.equal(DAILY_EMAIL_CAP, 50);
  assert.equal(MISS_YOU_GAP_SECONDS, 600);
});

test("email confirmation pages and the cron job skip Valentina's session check (they have their own)", async () => {
  for (const path of ["/action/abc.def.ghi", "/api/cron/daily"]) {
    const response = await proxy(new NextRequest(`https://vg.test${path}`));
    assert.equal(response.headers.get("location"), null, path);
    assert.notEqual(response.status, 401, path);
  }
  const hearts = await proxy(new NextRequest("https://vg.test/api/hearts"));
  assert.equal(hearts.status, 401, "the hearts API needs her session");
});

test("the confirmation page never acts on GET; actions check their own credentials", () => {
  const page = readFileSync("src/app/action/[token]/page.tsx", "utf8");
  assert.ok(
    !/consumeActionToken|confirmEmailAction\(/.test(page),
    "opening the link changes nothing",
  );
  const love = readFileSync(
    "src/features/notifications/actions/love.ts",
    "utf8",
  );
  assert.equal((love.match(/hasValidAccessSession\(\)/g) ?? []).length, 2);
  const cron = readFileSync("src/app/api/cron/daily/route.ts", "utf8");
  assert.match(cron, /CRON_SECRET/);
  assert.match(cron, /timingSafeEqual/);
  const redeem = readFileSync(
    "src/features/coupons/actions/redeem-coupon.ts",
    "utf8",
  );
  assert.ok(
    redeem.indexOf("repository.redeem(") <
      redeem.indexOf("notifyCouponRedeemed("),
    "the redemption is saved before any email is attempted",
  );
});
