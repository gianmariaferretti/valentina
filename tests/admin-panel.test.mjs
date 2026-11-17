import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { NextRequest } from "next/server.js";

import { coupons } from "../src/data/coupons.ts";
import { openWhenLetters } from "../src/data/open-when.ts";
import {
  mergeCoupons,
  mergeLetters,
  statusToUnlock,
} from "../src/features/admin/lib/merge-content.ts";

process.env.AUTH_SECRET = "admin-test-secret-that-is-longer-than-32-chars";
delete process.env.SUPABASE_URL;
const { proxy } = await import("../src/proxy.ts");
const { createSessionToken, parseAdminToken } =
  await import("../src/lib/auth/token.ts");

const row = (key, data, hidden = false) => ({
  key,
  data,
  hidden,
  createdAt: "2026-11-17T10:00:00.000Z",
});

test("panel edits override code coupons field by field", () => {
  const first = coupons[0];
  const merged = mergeCoupons(coupons, [
    row(first.id, { title: "Breakfast in Bed, Deluxe", unlock: "locked" }),
  ]);
  const edited = merged.find((coupon) => coupon.id === first.id);
  assert.equal(edited.title, "Breakfast in Bed, Deluxe");
  assert.equal(edited.shortDescription, first.shortDescription);
  assert.equal(edited.status, "locked");
  assert.equal(edited.redeemable, false);
  assert.equal(merged.length, coupons.length);
});

test("hidden coupons are retired, new coupons expand by quantity, bad rows are ignored", () => {
  const merged = mergeCoupons(coupons, [
    row(coupons[1].id, {}, true),
    row("picnic-in-the-park", {
      title: "Picnic in the Park",
      shortDescription: "Blanket, snacks, sunshine (allegedly).",
      setting: "together",
      rarity: "premium",
      category: "dates",
      unlock: "secret",
      quantity: 3,
      code: "GV-P01",
    }),
    row("broken", { title: 42 }),
  ]);
  assert.equal(merged.find((c) => c.id === coupons[1].id).retired, true);
  const picnic = merged.filter((c) => c.id.startsWith("picnic-in-the-park"));
  assert.deepEqual(
    picnic.map((c) => c.id),
    ["picnic-in-the-park-1", "picnic-in-the-park-2", "picnic-in-the-park-3"],
  );
  assert.equal(picnic[0].status, "undiscovered");
  assert.equal(picnic[2].series.total, 3);
  assert.equal(picnic[1].code, "GV-P01-2");
  assert.ok(!merged.some((c) => c.id === "broken"));
  assert.equal(statusToUnlock("undiscovered"), "secret");
});

test("letters: edit, hide and add from the panel", () => {
  const [first] = openWhenLetters;
  const merged = mergeLetters(openWhenLetters, [
    row(first.slug, { title: "You miss me (a lot)", tone: "rose" }, false),
    row(openWhenLetters[1].slug, {}, true),
    row("you-cant-sleep", {
      title: "You can't sleep",
      preview: "Counting sheep is overrated.",
      salutation: "Hi amor,",
      paragraphs: ["Breathe in.", "Breathe out."],
      signoff: "G.",
    }),
  ]);
  assert.equal(merged[0].title, "You miss me (a lot)");
  assert.equal(merged[0].envelope.tone, "rose");
  assert.equal(merged[0].paragraphs, first.paragraphs);
  assert.equal(merged[1].hidden, true);
  const added = merged.find((letter) => letter.slug === "you-cant-sleep");
  assert.equal(added.custom, true);
  assert.equal(added.paragraphs.length, 2);
});

test("/admin is outside Valentina's session check, noindexed, and renews its own cookie", async () => {
  const plain = await proxy(new NextRequest("https://vg.test/admin/buoni"));
  assert.equal(plain.headers.get("location"), null, "no redirect to /access");
  assert.match(plain.headers.get("x-robots-tag"), /noindex/);
  const now = Math.floor(Date.now() / 1000);
  const old = createSessionToken(
    process.env.AUTH_SECRET,
    "vg-admin",
    5 * 86400,
    now - 2 * 86400,
    now,
  );
  const renewed = await proxy(
    new NextRequest("https://vg.test/admin", {
      headers: { cookie: `vg_admin=${old}` },
    }),
  );
  const cookie = renewed.cookies.get("vg_admin");
  assert.equal(cookie.path, "/admin");
  assert.equal(parseAdminToken(cookie.value).issuedAt, now - 2 * 86400);
  // A visitor cookie is not an admin cookie, and vice versa.
  const visitor = createSessionToken(
    process.env.AUTH_SECRET,
    "vg-access",
    3600,
    now,
    now,
  );
  assert.equal(parseAdminToken(visitor), null);
});

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else files.push(path);
  }
  return files;
}

test("every admin page and action checks the admin session", () => {
  for (const file of walk("src/app/admin").filter((f) =>
    f.endsWith("page.tsx"),
  ))
    assert.match(
      readFileSync(file, "utf8"),
      /requireAdminSession\(\)|readAdminSession\(\)/,
      file,
    );
  for (const file of walk("src/features/admin/actions").filter(
    (f) => f.endsWith(".ts") && !/guard|auth/.test(f),
  )) {
    const source = readFileSync(file, "utf8");
    const exported = [...source.matchAll(/export async function (\w+)/g)].map(
      (m) => m[1],
    );
    for (const name of exported) {
      const body = source.slice(
        source.indexOf(`export async function ${name}`),
      );
      const end = body.indexOf("\nexport ", 10);
      assert.match(
        end === -1 ? body : body.slice(0, end),
        /withAdmin\(|return adjustKisses\(/,
        `${file}: ${name}`,
      );
    }
  }
});
