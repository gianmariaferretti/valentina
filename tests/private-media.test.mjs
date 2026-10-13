import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { createHmac } from "node:crypto";
import ts from "typescript";
import manifest from "../src/data/private-media-manifest.json" with { type: "json" };
import { travelPhotos } from "../src/data/media.ts";

const transpile = (path) =>
  ts.transpileModule(
    readFileSync(new URL("../" + path, import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    },
  ).outputText;
const importSource = (source) =>
  import(
    "data:text/javascript;base64," + Buffer.from(source).toString("base64")
  );
const data = await importSource(
  transpile("src/features/media/lib/private-media.ts")
    .replace('import "server-only";', "")
    .replace(
      /import manifest from [^;]+;/,
      `const manifest = ${JSON.stringify(manifest)};`,
    )
    .replace(
      /import \{ getSupabaseServerContext \} from [^;]+;/,
      "const getSupabaseServerContext = () => globalThis.__mediaClient;",
    ),
);

test("Private media: exactly 26 allowlisted objects, opaque authenticated URLs and no arbitrary paths", () => {
  assert.equal(manifest.length, 26);
  assert.deepEqual(
    new Set(manifest.map((p) => p.id)),
    new Set(travelPhotos.map((p) => p.id)),
  );
  for (const photo of travelPhotos) {
    assert.equal(photo.src, "/api/private-media/" + photo.id);
    assert.equal(
      data.privateMediaObject(photo.id),
      "travel/" + photo.id + ".webp",
    );
  }
  for (const value of [
    "__proto__",
    "constructor",
    "../paris-cover",
    "paris-cover/../../secret",
    "%2e%2e",
    "https://evil.test/photo",
    "travel/paris-cover.webp",
    "PARIS-COVER",
    "unknown",
  ])
    assert.equal(data.privateMediaObject(value), undefined);
});

test("Private media storage: public/missing buckets and invalid payloads fail closed, only approved objects download", async () => {
  let downloads = 0,
    publicBucket = false,
    bucketError = null,
    image = new Blob(["webp fixture"], { type: "image/webp" });
  globalThis.__mediaClient = {
    client: {
      storage: {
        getBucket: async (bucket) => {
          assert.equal(bucket, "vg-private-photos");
          return { data: { public: publicBucket }, error: bucketError };
        },
        from: (bucket) => {
          assert.equal(bucket, "vg-private-photos");
          return {
            download: async (object) => {
              assert.equal(object, "travel/paris-cover.webp");
              downloads++;
              return { data: image, error: null };
            },
          };
        },
      },
    },
  };
  await assert.rejects(data.loadPrivateMedia("../../another-bucket/file"));
  assert.equal(downloads, 0);
  publicBucket = true;
  await assert.rejects(data.loadPrivateMedia("travel/paris-cover.webp"));
  publicBucket = false;
  bucketError = { message: "Unavailable" };
  await assert.rejects(data.loadPrivateMedia("travel/paris-cover.webp"));
  bucketError = null;
  assert.equal(
    (await data.loadPrivateMedia("travel/paris-cover.webp")).type,
    "image/webp",
  );
  image = new Blob(["<html>"], { type: "text/html" });
  await assert.rejects(data.loadPrivateMedia("travel/paris-cover.webp"));
  image = new Blob([new Uint8Array(2_000_001)], { type: "image/webp" });
  await assert.rejects(data.loadPrivateMedia("travel/paris-cover.webp"));
  delete globalThis.__mediaClient;
});

test("Private media actual handler: auth first, 401/403/404/503, private no-store headers on EVERY response", async () => {
  globalThis.__mediaRoute = {
    authenticated: false,
    fail: false,
    calls: 0,
    resolve: data.privateMediaObject,
  };
  const route = await importSource(
    transpile("src/app/api/private-media/[id]/route.ts")
      .replace(
        /import \{ hasValidAccessSession \} from [^;]+;/,
        "const hasValidAccessSession = async () => globalThis.__mediaRoute.authenticated;",
      )
      .replace(
        /import\s*\{[^}]*loadPrivateMedia[^}]*\}\s*from [^;]+;/,
        "const privateMediaObject = id => globalThis.__mediaRoute.resolve(id); const loadPrivateMedia = async () => { globalThis.__mediaRoute.calls++; if(globalThis.__mediaRoute.fail) throw Error(); return new Blob(['webp fixture'], { type: 'image/webp' }); };",
      ),
  );
  for (const [authenticated, id, crossSite, fail, status] of [
    [false, "paris-cover", false, false, 401],
    [false, "unknown", false, false, 401],
    [true, "../object", false, false, 404],
    [true, "paris-cover", true, false, 403],
    [true, "paris-cover", false, true, 503],
    [true, "paris-cover", false, false, 200],
  ]) {
    Object.assign(globalThis.__mediaRoute, { authenticated, fail });
    const response = await route.GET(
      new Request("https://site.test/api/private-media/" + id, {
        headers: crossSite ? { "sec-fetch-site": "cross-site" } : {},
      }),
      { params: Promise.resolve({ id }) },
    );
    assert.equal(response.status, status);
    assert.equal(
      response.headers.get("cache-control"),
      "private, no-store, max-age=0",
    );
    assert.equal(response.headers.get("vercel-cdn-cache-control"), "no-store");
    assert.equal(response.headers.get("vary"), "Cookie");
  }
  assert.equal(globalThis.__mediaRoute.calls, 2);
  delete globalThis.__mediaRoute;
});

test("Signed session: existing tokens remain valid; expiry, extra parts, nonnumeric expiry and forgery rejected", async () => {
  const previous = process.env.AUTH_SECRET;
  process.env.AUTH_SECRET = "isolated-unit-test-secret-only";
  const auth = await importSource(
    transpile("src/lib/auth/session.ts")
      .replace('import "server-only";', "")
      .replace(
        /import \{ cookies \} from [^;]+;/,
        "const cookies = async () => ({ get: () => undefined });",
      ),
  );
  const token = auth.createAccessToken();
  assert.ok(auth.verifyAccessToken(token));
  const sign = (expiry) =>
    expiry +
    "." +
    createHmac("sha256", process.env.AUTH_SECRET)
      .update(expiry)
      .digest("base64url");
  for (const invalid of [
    undefined,
    "",
    token + ".extra",
    token + "tampered",
    sign("NaN"),
    sign("Infinity"),
    sign("1"),
    sign(String(Math.floor(Date.now() / 1000) - 1)),
  ])
    assert.equal(auth.verifyAccessToken(invalid), false);
  if (previous === undefined) delete process.env.AUTH_SECRET;
  else process.env.AUTH_SECRET = previous;
});

test("Every personal image consumer uses the protected Image wrapper; no public optimizer or upload exchange", () => {
  for (const file of [
    "src/features/gallery/components/gallery-scrapbook.tsx",
    "src/features/map/components/europe-map-experience.tsx",
    "src/features/awards/components/award-reveal-card.tsx",
    "src/features/games/engines/memories-game.tsx",
    "src/app/(experience)/map/[place]/page.tsx",
    "src/components/design-system/polaroid.tsx",
  ])
    assert.match(
      readFileSync(file, "utf8"),
      /features\/media\/components\/media-image/,
    );
  const image = readFileSync(
    "src/features/media/components/media-image.tsx",
    "utf8",
  );
  assert.match(image, /unoptimized=\{isPrivate/);
  assert.doesNotMatch(image, /images\/travel|supabase\.co|createSignedUrl/);
  assert.match(readFileSync("src/proxy.ts", "utf8"), /status: 410/);
  assert.doesNotMatch(
    readFileSync(
      "src/features/secret/components/private-collection.tsx",
      "utf8",
    ),
    /getUserMedia|type="file"|FormData|\.upload\(/,
  );
});
