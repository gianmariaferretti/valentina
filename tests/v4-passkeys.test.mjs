import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  CHALLENGE_TTL_SECONDS,
  deviceLabel,
  memoryChallengeStore,
  newChallenge,
  passkeyUsable,
  relyingParty,
} from "../src/lib/auth/passkeys.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const C = "abcdefghijklmnopqrstuvwxyz012345";
const now = Date.parse("2026-11-18T10:00:00Z");

test("a challenge verifies once, for its own scope and purpose", async () => {
  const store = memoryChallengeStore();
  await store.save(newChallenge(C, "visitor", "login", now));
  // Wrong purpose or scope: refused, and the challenge is not burned.
  assert.equal(await store.consume(C, "visitor", "register", now), false);
  assert.equal(await store.consume(C, "admin", "login", now), false);
  assert.equal(await store.consume(C, "visitor", "login", now + 1000), true);
  // Reused: refused.
  assert.equal(await store.consume(C, "visitor", "login", now + 2000), false);
  // Unknown: refused.
  assert.equal(
    await store.consume("x".repeat(32), "visitor", "login", now),
    false,
  );
  assert.throws(() => newChallenge("short", "visitor", "login", now));
});

test("an expired challenge is refused", async () => {
  const store = memoryChallengeStore();
  await store.save(newChallenge(C, "visitor", "register", now));
  const later = now + CHALLENGE_TTL_SECONDS * 1000;
  assert.equal(await store.consume(C, "visitor", "register", later), false);
  assert.equal(CHALLENGE_TTL_SECONDS, 300);
});

test("revoked passkeys, and passkeys older than 'log out everywhere', fail", () => {
  const key = { id: "k", createdAt: "2026-11-18T10:00:00Z", revokedAt: null };
  assert.equal(passkeyUsable(key, 0), true);
  assert.equal(
    passkeyUsable({ ...key, revokedAt: "2026-11-18T11:00:00Z" }, 0),
    false,
  );
  const created = Date.parse(key.createdAt) / 1000;
  assert.equal(passkeyUsable(key, created), true);
  assert.equal(passkeyUsable(key, created + 1), false);
  assert.equal(passkeyUsable({ ...key, createdAt: "nonsense" }, 0), false);
});

test("relying party: the env domain or the request host, never a stranger", () => {
  assert.deepEqual(relyingParty(undefined, "http://localhost:3300"), {
    rpID: "localhost",
    origin: "http://localhost:3300",
  });
  assert.deepEqual(relyingParty("example.com", "https://www.example.com"), {
    rpID: "example.com",
    origin: "https://www.example.com",
  });
  assert.throws(() => relyingParty("example.com", "https://evil.test"));
  assert.throws(() => relyingParty("bad domain!", "https://example.com"));
  assert.equal(
    deviceLabel(
      "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Version/18.0 Mobile Safari/604.1",
    ),
    "iPhone · Safari",
  );
});

test("the server: user verification required, challenge burned in the check", () => {
  const server = read("src/lib/auth/passkey-server.ts");
  assert.equal(server.match(/requireUserVerification: true/g).length, 2);
  assert.equal(server.match(/userVerification: "required"/g).length, 2);
  assert.match(server, /expectedChallenge: burn\(scope, "register"/);
  assert.match(server, /expectedChallenge: burn\(scope, "login"/);
  assert.match(server, /passkeyUsable\(/);
  assert.match(server, /process\.env\.WEBAUTHN_RP_ID/);
  assert.match(read(".env.example"), /^WEBAUTHN_RP_ID=/m);
  const actions = read("src/features/access/actions/passkeys.ts");
  // Same attempt limit as the code, counted before verifying.
  assert.match(
    actions,
    /registerAttempt\("visitor", fingerprint\)[\s\S]*verifyPasskeyLogin/,
  );
  // Setting up a passkey needs a session.
  for (const fn of ["startPasskeySetup", "finishPasskeySetup"])
    assert.match(
      actions
        .split(`export async function ${fn}`)[1]
        .split("export async function")[0],
      /hasValidAccessSession\(\)/,
    );
  const admin = read("src/features/admin/actions/security.ts");
  assert.match(admin, /revokePasskeyFromAdmin[\s\S]*return withAdmin\(/);
});

test("the migration: additive, service role only, single-use challenges", () => {
  const sql = read("supabase/migrations/20261118020000_passkeys.sql");
  for (const table of ["passkeys", "webauthn_challenges"]) {
    assert.match(
      sql,
      new RegExp(`alter table public\\.${table} force row level security`),
    );
    assert.match(
      sql,
      new RegExp(
        `revoke all on public\\.${table} from public, anon, authenticated`,
      ),
    );
  }
  assert.match(
    sql,
    /used_at is null\s+and expires_at > timezone\('utc', now\(\)\)/,
  );
  assert.doesNotMatch(
    sql,
    /drop table|alter table public\.(?!passkeys|webauthn)/i,
  );
});

test("the entrance offers Face ID; the code always stays", () => {
  const access = read("src/app/access/page.tsx");
  assert.match(access, /<PasskeyButton \/>\s*<AccessForm \/>/);
  assert.match(
    read("src/features/access/components/access-form.tsx"),
    /CODE_LOGIN_KEY/,
  );
  assert.match(read("src/app/(experience)/layout.tsx"), /<PasskeyOffer \/>/);
  const offer = read("src/features/access/components/passkey-offer.tsx");
  assert.match(offer, /passkeyAlreadyOffered\(\)/);
  assert.match(offer, /next time\?/);
  assert.match(
    read("src/components/layout/site-header.tsx"),
    /<PasskeySetupButton/,
  );
  // The browser library loads on tap only.
  const client = read("src/features/access/components/passkey-client.ts");
  assert.doesNotMatch(client, /^import .* from "@simplewebauthn\/browser";/m);
  assert.match(client, /await import\("@simplewebauthn\/browser"\)/);
});
