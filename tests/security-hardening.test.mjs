import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { arcadeMemories } from "../src/data/arcade-memories.ts";
import { arcadeMemoryIds } from "../src/data/arcade-memory-ids.ts";
import {
  assertProductionConfiguration,
  configurationProblems,
} from "../src/lib/auth/config-check.ts";

const good = {
  AUTH_SECRET: "a".repeat(32),
  SITE_ACCESS_CODE: "the-code",
  CONTRACT_ADMIN_PASSPHRASE: "p".repeat(24),
};

test("A4: weak or missing secrets stop the site with a clear message", () => {
  assert.deepEqual(configurationProblems(good), []);
  assert.equal(
    configurationProblems({ ...good, AUTH_SECRET: "a".repeat(31) }).length,
    1,
  );
  assert.equal(
    configurationProblems({ ...good, SITE_ACCESS_CODE: "" }).length,
    1,
  );
  assert.equal(
    configurationProblems({
      ...good,
      CONTRACT_ADMIN_PASSPHRASE: "p".repeat(23),
    }).length,
    1,
  );
  assert.equal(
    configurationProblems({ ...good, ADMIN_PASSPHRASE: "short" }).length,
    1,
  );
  assert.deepEqual(
    configurationProblems({ ...good, CONTRACT_ADMIN_PASSPHRASE: "" }),
    [],
    "an unset optional passphrase only disables that feature",
  );
  assert.throws(
    () => assertProductionConfiguration({ ...good, AUTH_SECRET: "short" }),
    /refuses to start[\s\S]*AUTH_SECRET must be at least 32/,
  );
});

test("Memory card identities keep their order (seeded transcripts stay valid)", () => {
  assert.deepEqual(
    arcadeMemories.map((memory) => memory.id),
    [...arcadeMemoryIds],
  );
});

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, files);
    else if (/\.(ts|tsx)$/.test(name)) files.push(path);
  }
  return files;
}

test("A6: no client module imports private texts or photo captions", () => {
  const privateModules =
    /^(?:@\/data|\.\.?\/(?:\.\.\/)*data)\/(media|spicy-archive|private-collection|arcade-memories|private-media-manifest|open-when|relationship-contract|coupons|coupons-apart)(?:\.ts|\.json)?$/;
  const offenders = walk("src")
    .filter((file) => readFileSync(file, "utf8").startsWith('"use client"'))
    .filter((file) => {
      const source = readFileSync(file, "utf8");
      return [
        ...source.matchAll(/import\s+(type\s+)?[^;]*?from\s+["']([^"']+)["']/g),
      ].some(([, typeOnly, from]) => !typeOnly && privateModules.test(from));
    });
  assert.deepEqual(offenders, []);
});
