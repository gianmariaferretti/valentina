import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  checkScene,
  doodleObjects,
  isDoodleId,
  isPng,
  MAX_ELEMENTS,
  MAX_SCENE_BYTES,
  sortDoodles,
} from "../src/features/doodles/lib/doodles.ts";

const read = (path) =>
  readFileSync(new URL(`../${path}`, import.meta.url), "utf8");

const scene = (elements, extra = {}) =>
  JSON.stringify({ type: "excalidraw", version: 2, elements, ...extra });
const line = { id: "a", type: "freedraw" };

test("a scene must be an Excalidraw drawing with something on it", () => {
  assert.equal(checkScene(scene([line])).ok, true);
  assert.equal(checkScene(scene([line])).elements, 1);
  assert.equal(checkScene(scene([{ ...line, isDeleted: true }])).ok, false);
  assert.equal(checkScene(scene([])).ok, false);
  assert.equal(checkScene("not json").ok, false);
  assert.equal(
    checkScene(JSON.stringify({ type: "other", elements: [line] })).ok,
    false,
  );
  assert.equal(
    checkScene(scene([line], { files: { x: { dataURL: "data:" } } })).ok,
    false,
  );
  assert.equal(
    checkScene(scene(Array.from({ length: MAX_ELEMENTS + 1 }, () => line))).ok,
    false,
  );
  assert.equal(checkScene("x".repeat(MAX_SCENE_BYTES + 1)).ok, false);
});

test("ids, objects, PNG check, newest first", () => {
  const id = "123e4567-e89b-42d3-a456-426614174000";
  assert.equal(isDoodleId(id), true);
  assert.equal(isDoodleId("../etc/passwd"), false);
  assert.deepEqual(doodleObjects(id), {
    scene: `doodles/${id}.json`,
    preview: `doodles/${id}.png`,
  });
  assert.throws(() => doodleObjects("nope"));
  assert.equal(
    isPng(new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0])),
    true,
  );
  assert.equal(isPng(new TextEncoder().encode("<svg>")), false);
  assert.deepEqual(
    sortDoodles([
      { id: "old", createdAt: "2026-01-01T00:00:00Z" },
      { id: "new", createdAt: "2026-11-01T00:00:00Z" },
    ]).map((d) => d.id),
    ["new", "old"],
  );
});

test("the migration: additive, private bucket, forced RLS, new outbox kind", () => {
  const sql = read("supabase/migrations/20261118010000_doodles.sql");
  assert.match(sql, /alter table public\.doodles force row level security/);
  assert.match(
    sql,
    /revoke all on public\.doodles from public, anon, authenticated/,
  );
  assert.match(sql, /values \('vg-doodles', 'vg-doodles', false/);
  assert.match(
    sql,
    /'coupon_redeemed', 'miss_you', 'digest', 'test', 'doodle'/,
  );
  assert.doesNotMatch(sql, /drop table|delete from/i);
});

test("Excalidraw loads only on demand, from this site; uploads are guarded", () => {
  const studio = read("src/features/doodles/components/doodle-studio.tsx");
  assert.match(studio, /dynamic\(loadCanvas, \{\s*ssr: false/);
  assert.match(studio, /EXCALIDRAW_ASSET_PATH = "\/excalidraw\/"/);
  // Only the canvas (itself dynamic) imports Excalidraw.
  for (const file of [
    "src/app/(experience)/doodles/page.tsx",
    "src/app/admin/disegni/page.tsx",
    "src/features/doodles/components/doodle-album.tsx",
    "src/features/doodles/components/doodle-studio.tsx",
  ])
    assert.doesNotMatch(read(file), /from "@excalidraw\/excalidraw"/, file);
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts.prebuild, /sync-excalidraw-assets/);
  assert.match(read(".gitignore"), /\/public\/excalidraw\//);
  const sync = read("scripts/sync-excalidraw-assets.mjs");
  assert.doesNotMatch(sync, /"Excalifont"|"Xiaolai"|"Liberation"/);
  // Sessions: Valentina on /api, Gianmaria on /admin (his cookie's path).
  assert.match(
    read("src/app/api/doodles/route.ts"),
    /hasValidAccessSession\(\)/,
  );
  assert.match(
    read("src/app/api/doodles/[id]/[kind]/route.ts"),
    /hasValidAccessSession\(\)/,
  );
  assert.match(
    read("src/app/admin/disegni/upload/route.ts"),
    /readAdminSession\(\)/,
  );
  assert.match(
    read("src/app/admin/disegni/file/[id]/[kind]/route.ts"),
    /readAdminSession\(\)/,
  );
  const handlers = read("src/features/doodles/server/handlers.ts");
  assert.match(handlers, /sameOrigin\(request\)/);
  assert.match(handlers, /isPng\(bytes\)/);
  assert.match(handlers, /key: "doodle:first"/);
  assert.match(handlers, /"private, no-store, max-age=0"/);
  const admin = read("src/features/admin/actions/doodles.ts");
  for (const body of admin.split("export async function ").slice(1))
    assert.match(body, /return withAdmin\(/);
  assert.match(
    read("src/features/notifications/lib/email-templates.ts"),
    /"🎨 Valentina drew you something"/,
  );
});
