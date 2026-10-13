/** Optional isolated PostgreSQL integration runner. No network or live DB connection. */
import { readFileSync, readdirSync } from "node:fs";
import { pathToFileURL } from "node:url";
import assert from "node:assert/strict";
const modulePath = process.env.VG_QA_PGLITE_MODULE;
if (!modulePath)
  throw new Error(
    "Configure the external QA PGlite module, not a production database URL",
  );
const { PGlite } = await import(pathToFileURL(modulePath).href);
const db = new PGlite();
try {
  await db.exec(
    "create role anon; create role authenticated; create role service_role bypassrls;",
  );
  for (const file of readdirSync("supabase/migrations")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    if (file.includes("guard_arcade_coupon_grants"))
      await db.exec(
        "insert into public.coupon_state(user_id,coupon_id,unlocked_at,redeemed_at) values('aaaaaaaa-aaaa-4000-8000-000000000034','one-question-honest-answer','2026-01-01','2026-02-01');",
      );
    await db.exec(readFileSync("supabase/migrations/" + file, "utf8"));
    console.log("Applied isolated migration: " + file);
  }
  for (const file of readdirSync("supabase/tests")
    .filter((f) => f.endsWith(".sql"))
    .sort()) {
    await db.exec(readFileSync("supabase/tests/" + file, "utf8"));
    console.log("PASS isolated SQL: " + file);
  }
  const { rows } = await db.query(
    "select coupon_id,unlocked_at,redeemed_at from public.coupon_state",
  );
  assert.equal(rows.length, 1);
  assert.equal(rows[0].coupon_id, "one-question-honest-answer");
  assert.ok(rows[0].redeemed_at);
  console.log(
    "PASS: historical GV-034 redemption preserved, all test writes rolled back.",
  );
} finally {
  await db.close();
}
