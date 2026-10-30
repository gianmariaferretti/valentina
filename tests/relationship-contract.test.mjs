import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  agreementNumber,
  treatyArticleCount,
  treatyPreamble,
  treatyTitles,
  treatyVersion,
} from "../src/data/relationship-contract.ts";
import {
  adminConfigurationIssue,
  adminSessionSignature,
  matchesAdminPassphrase,
} from "../src/features/relationship-contract/lib/admin-crypto.ts";

const articles = treatyTitles.flatMap((title) => title.articles);

test("the treaty has eight distinct Titles and forty consecutively numbered, substantive English Articles", () => {
  assert.equal(agreementNumber, "VG-2026-001");
  assert.equal(treatyVersion, "1.0.0");
  assert.equal(treatyTitles.length, 8);
  assert.equal(treatyArticleCount, 40);
  assert.deepEqual(
    articles.map((article) => article.number),
    Array.from({ length: 40 }, (_, index) => index + 1),
  );
  for (const article of articles) {
    assert.ok(article.title.length > 8);
    assert.ok(article.clauses.length >= 2);
    assert.ok(article.clauses.every((clause) => clause.length >= 70));
  }
  assert.equal(treatyPreamble.length, 7);
});

test("the non-negotiable commitments and freedoms are explicit", () => {
  const article = (number) => articles[number - 1].clauses.join(" ");
  assert.match(
    article(18),
    /The Italian Party expressly undertakes to demonstrate his affection through thoughtful gifts and romantic gestures\./,
  );
  assert.match(
    article(20),
    /Gianmaria Ferretti expressly declares his intention and personal commitment to visit Colombia no later than 31 December 2027\./,
  );
  assert.match(article(37), /31 October 2026.*31 October 2031/);
  assert.match(
    article(38),
    /Beginning on the third anniversary of this Agreement, the Parties may, by mutual and freely expressed consent, elect to transform its fixed five-year symbolic term into an indefinite one through marriage\./,
  );
  assert.match(article(38), /not a proposal, engagement or promise to marry/);
  assert.match(article(39), /not legally binding/);
});

test("the sealed note remains in a server-only module", () => {
  const secretModule = readFileSync(
    new URL(
      "../src/features/relationship-contract/lib/document.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.match(secretModule, /^import "server-only";/);
  assert.match(secretModule, /I would choose you again\./);
});

test("administrator configuration requires a distinct passphrase of at least four characters", () => {
  const longPassphrase = "a-long-independent-contract-passphrase";
  assert.equal(
    adminConfigurationIssue(null, longPassphrase, "site"),
    "missing_access_secret",
  );
  assert.equal(
    adminConfigurationIssue("site-secret", "abc", "site"),
    "missing_or_short_passphrase",
  );
  assert.equal(
    adminConfigurationIssue("site-secret", longPassphrase, longPassphrase),
    "reused_site_code",
  );
  assert.equal(adminConfigurationIssue("site-secret", "abcd", "site"), null);
});

test("administrator cookie signature is bound to the site session, passphrase and expiry", () => {
  const passphrase = "a-long-independent-contract-passphrase";
  const signature = adminSessionSignature(
    "site-secret",
    passphrase,
    "access-cookie",
    "1800000000",
  );
  assert.equal(
    signature,
    adminSessionSignature(
      "site-secret",
      passphrase,
      "access-cookie",
      "1800000000",
    ),
  );
  assert.notEqual(
    signature,
    adminSessionSignature(
      "site-secret",
      passphrase,
      "other-cookie",
      "1800000000",
    ),
  );
  assert.notEqual(
    signature,
    adminSessionSignature(
      "site-secret",
      passphrase,
      "access-cookie",
      "1800000001",
    ),
  );
  assert.notEqual(
    signature,
    adminSessionSignature(
      "site-secret",
      `${passphrase}-rotated`,
      "access-cookie",
      "1800000000",
    ),
  );
  assert.equal(matchesAdminPassphrase(passphrase, passphrase), true);
  assert.equal(matchesAdminPassphrase("wrong", passphrase), false);
});
