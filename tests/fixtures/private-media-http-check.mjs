/** Real HTTP verification, strictly restricted to the isolated local QA server. */
import assert from "node:assert/strict";
import { createHmac, createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import manifest from "../../src/data/private-media-manifest.json" with { type: "json" };
const origin = new URL(process.env.VG_QA_ORIGIN ?? "http://127.0.0.1:3101");
if (!["localhost", "127.0.0.1"].includes(origin.hostname))
  throw new Error("Isolated loopback QA only");
const secret = process.env.AUTH_SECRET;
if (!secret) throw new Error("Disposable QA AUTH_SECRET required");
const expiry = String(Math.floor(Date.now() / 1000) + 600);
const signature = createHmac("sha256", secret)
  .update(expiry)
  .digest("base64url");
const cookie = `vg_access=${expiry}.${signature}`;
const hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
for (const photo of manifest) {
  const endpoint = new URL("/api/private-media/" + photo.id, origin);
  const anonymous = await fetch(endpoint);
  assert.equal(anonymous.status, 401, photo.id);
  assert.equal(
    anonymous.headers.get("cache-control"),
    "private, no-store, max-age=0",
  );
  const authorized = await fetch(endpoint, { headers: { Cookie: cookie } });
  assert.equal(authorized.status, 200, photo.id);
  assert.equal(
    authorized.headers.get("cache-control"),
    "private, no-store, max-age=0",
  );
  let source;
  try {
    source = readFileSync(photo.source);
  } catch {
    source = readFileSync(".private-media-source-backup/" + photo.id + ".webp");
  }
  assert.equal(
    hash(Buffer.from(await authorized.arrayBuffer())),
    hash(source),
    photo.id,
  );
  const retired = await fetch(
    new URL("/images/travel/" + photo.id + ".webp", origin),
  );
  assert.equal(retired.status, 410, photo.id);
  const optimizer = await fetch(
    new URL(
      "/_next/image?url=" +
        encodeURIComponent("/api/private-media/" + photo.id) +
        "&w=640&q=75",
      origin,
    ),
  );
  assert.equal(optimizer.status, 400, photo.id);
  console.log(
    "PASS real HTTP: private/authenticated, anonymous401, retired410, optimizer400: " +
      photo.id,
  );
}
assert.equal(
  (
    await fetch(new URL("/api/private-media/unknown", origin), {
      headers: { Cookie: cookie },
    })
  ).status,
  404,
);
assert.equal(
  (
    await fetch(new URL("/api/private-media/paris-cover", origin), {
      headers: { Cookie: cookie, "Sec-Fetch-Site": "cross-site" },
    })
  ).status,
  403,
);
assert.equal((await fetch(new URL("/api/secret-image", origin))).status, 401);
assert.equal(
  (
    await fetch(new URL("/api/secret-image", origin), {
      headers: { Cookie: cookie },
    })
  ).status,
  403,
);
console.log(
  "PASS 108 real HTTP checks. Storage is an isolated fixture; NOT a live photo migration.",
);
