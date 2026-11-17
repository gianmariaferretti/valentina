import assert from "node:assert/strict";
import test from "node:test";

import { NextRequest } from "next/server.js";

process.env.AUTH_SECRET = "test-secret-that-is-definitely-longer-than-32-chars";
delete process.env.SUPABASE_URL;

const { proxy, isPublicPath, config } = await import("../src/proxy.ts");
const { createAccessToken, parseAccessToken, shouldRenew, createSessionToken } =
  await import("../src/lib/auth/token.ts");

const rscHeaders = {
  RSC: "1",
  "Next-Router-State-Tree": encodeURIComponent(
    JSON.stringify(["", { children: ["(experience)", {}] }, null, null, true]),
  ),
};

test("an RSC request to a private page without a cookie gets a redirect and no content", async () => {
  for (const path of [
    "/open-when/you-miss-me",
    "/coupons",
    "/relationship-contract",
    "/gallery",
    "/secret",
  ]) {
    const response = await proxy(
      new NextRequest(`https://vg.test${path}?_rsc=abc`, {
        headers: rscHeaders,
      }),
    );
    assert.equal(response.status, 307, path);
    assert.equal(new URL(response.headers.get("location")).pathname, "/access");
    assert.equal(await response.text(), "", `${path} leaked a body`);
    assert.match(response.headers.get("cache-control"), /no-store/);
  }
});

test("private API routes answer 401 without a cookie", async () => {
  const response = await proxy(
    new NextRequest("https://vg.test/api/private-media/abc"),
  );
  assert.equal(response.status, 401);
});

test("a forged or expired cookie is rejected", async () => {
  const forged = createSessionToken("x".repeat(40), "vg-access", 3600, 1, 1);
  const response = await proxy(
    new NextRequest("https://vg.test/coupons", {
      headers: { cookie: `vg_access=${forged}` },
    }),
  );
  assert.equal(response.status, 307);
  assert.equal(
    parseAccessToken("1700000000.abc"),
    null,
    "old v1 tokens are invalid",
  );
});

test("a valid session passes, and an old one is renewed with the same login time", async () => {
  const fresh = createAccessToken();
  const ok = await proxy(
    new NextRequest("https://vg.test/coupons", {
      headers: { cookie: `vg_access=${fresh}` },
    }),
  );
  assert.equal(ok.headers.get("location"), null);
  assert.equal(ok.cookies.get("vg_access"), undefined, "no renewal needed yet");

  const now = Math.floor(Date.now() / 1000);
  const twoDaysOld = createSessionToken(
    process.env.AUTH_SECRET,
    "vg-access",
    60 * 60 * 24 * 28,
    now - 60 * 60 * 24 * 2,
    now,
  );
  assert.equal(shouldRenew(parseAccessToken(twoDaysOld)), true);
  const renewed = await proxy(
    new NextRequest("https://vg.test/coupons", {
      headers: { cookie: `vg_access=${twoDaysOld}` },
    }),
  );
  const cookie = renewed.cookies.get("vg_access");
  assert.ok(cookie, "renewed cookie set");
  assert.equal(cookie.maxAge, 60 * 60 * 24 * 30);
  const parsed = parseAccessToken(cookie.value);
  assert.equal(parsed.issuedAt, now - 60 * 60 * 24 * 2);
  assert.ok(parsed.expiresAt >= now + 60 * 60 * 24 * 30 - 5);
});

test("only the cover, the entrance and self-checked pages are public", () => {
  for (const path of [
    "/",
    "/access",
    "/robots.txt",
    "/admin",
    "/admin/buoni",
    "/action/abc",
  ])
    assert.equal(isPublicPath(path), true, path);
  for (const path of [
    "/home",
    "/coupons",
    "/access-anything",
    "/administrator",
    "/actions",
  ])
    assert.equal(isPublicPath(path), false, path);
  assert.ok(config.matcher.length >= 2);
});

test("retired travel photographs answer 410", async () => {
  const response = await proxy(
    new NextRequest("https://vg.test/images/travel/matera-together.webp"),
  );
  assert.equal(response.status, 410);
});

test("the design reference is not reachable in production", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const response = await proxy(
    new NextRequest("https://vg.test/design-system"),
  );
  process.env.NODE_ENV = previous;
  assert.equal(response.status, 404);
});
