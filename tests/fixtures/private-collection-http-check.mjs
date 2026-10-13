/** Explicit loopback-only QA of the actual Next Server Action, not a deployed endpoint. */
import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const origin = new URL(process.env.VG_QA_ORIGIN ?? "http://127.0.0.1:3101");
if (!["127.0.0.1", "localhost", "[::1]"].includes(origin.hostname))
  throw new Error(
    "This check is restricted to the isolated loopback QA server.",
  );
const secret = process.env.AUTH_SECRET;
if (!secret) throw new Error("Set the disposable local QA AUTH_SECRET.");
const manifest = JSON.parse(
  readFileSync(".next/server/server-reference-manifest.json", "utf8"),
);
const actionId = Object.entries(manifest.node).find(
  ([, action]) => action.exportedName === "accessPrivateCollection",
)?.[0];
if (!actionId) throw new Error("Build the current application before HTTP QA.");
const hmac = (text) =>
  createHmac("sha256", secret).update(text).digest("base64url");
const access = (expiry) => `${expiry}.${hmac(String(expiry))}`;
const validAccess = access(Math.floor(Date.now() / 1000) + 600);
const expiredAccess = access(Math.floor(Date.now() / 1000) - 1);
const now = Date.now();
const proof = {
  stage: "photo-reveal",
  ageConfirmed: true,
  imageServedAt: now - 15_000,
  revealDuration: 10_000,
  expiresAt: now + 60_000,
};
const signedProof = (changes = {}) => {
  const payload = Buffer.from(
    JSON.stringify({ ...proof, ...changes }),
  ).toString("base64url");
  return `${payload}.${hmac(`spicy-archive:${validAccess}:${payload}`)}`;
};
const cookie = (archiveProof) =>
  `vg_access=${validAccess}${archiveProof ? `; vg_spicy_archive=${archiveProof}` : ""}`;
const cases = [
  ["anonymous", "browse", "", false],
  ["expired access", "browse", `vg_access=${expiredAccess}`, false],
  ["no archive proof", "browse", cookie(), false],
  ["tampered proof", "browse", cookie(signedProof() + "bad"), false],
  [
    "expired archive",
    "browse",
    cookie(signedProof({ expiresAt: now - 1 })),
    false,
  ],
  [
    "earlier stage",
    "browse",
    cookie(signedProof({ stage: "sealed-file" })),
    false,
  ],
  [
    "no adult confirmation",
    "browse",
    cookie(signedProof({ ageConfirmed: false })),
    false,
  ],
  [
    "image not served",
    "browse",
    cookie(signedProof({ imageServedAt: null })),
    false,
  ],
  [
    "unfinished reveal",
    "browse",
    cookie(signedProof({ imageServedAt: now + 60_000 })),
    false,
  ],
  ["invalid intent", "payment-successful", cookie(signedProof()), false],
  ["finished reveal", "browse", cookie(signedProof()), true, "collection"],
  [
    "payment request",
    "payment-request",
    cookie(signedProof()),
    true,
    "payment-requested",
  ],
  [
    "exchange agreement",
    "exchange-agreement",
    cookie(signedProof()),
    true,
    "exchange-confirmed",
  ],
];
for (const [label, intent, cookies, expected, view] of cases) {
  const response = await fetch(new URL("/secret", origin), {
    method: "POST",
    headers: {
      "Next-Action": actionId,
      Origin: origin.origin,
      Cookie: cookies,
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: JSON.stringify([intent]),
    redirect: "manual",
  });
  const text = await response.text();
  assert.equal(response.status, 200, label);
  assert.ok(text.includes(`"ok":${expected}`), label);
  if (view) assert.ok(text.includes(`"view":"${view}"`), label);
  console.log(`PASS ${label}: ${expected ? view : "denied"}`);
}
console.log(
  "13 real HTTP checks passed. No live database, payment, upload or personal credentials used.",
);
