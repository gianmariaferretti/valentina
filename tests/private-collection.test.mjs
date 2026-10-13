import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import {
  canAccessPrivateCollection,
  collectionReceipt,
  isCollectionIntent,
} from "../src/features/secret/lib/private-collection-domain.ts";
import { privateCollection } from "../src/data/private-collection.ts";
import {
  ARCHIVE_REVEAL_MS,
  ARCHIVE_REDUCED_REVEAL_MS,
  archiveStages,
} from "../src/features/secret/lib/archive-domain.ts";

const revealedProof = {
  stage: "photo-reveal",
  ageConfirmed: true,
  imageServedAt: 1000,
  revealDuration: ARCHIVE_REVEAL_MS,
  expiresAt: 60_000,
};

test("Private Collection: served photo and full decryption required, independent of the coupon grant", () => {
  assert.equal(canAccessPrivateCollection(revealedProof, 10_999), false);
  assert.equal(canAccessPrivateCollection(revealedProof, 11_000), true);
  assert.equal(
    canAccessPrivateCollection(
      { ...revealedProof, stage: "final-reveal" },
      11_000,
    ),
    true,
  );
  assert.equal(
    canAccessPrivateCollection(
      { ...revealedProof, stage: "final-reveal" },
      10_999,
    ),
    false,
  );
  for (const stage of archiveStages.filter(
    (stage) => !["photo-reveal", "final-reveal"].includes(stage),
  ))
    assert.equal(
      canAccessPrivateCollection({ ...revealedProof, stage }, 11_000),
      false,
    );
  assert.equal(
    canAccessPrivateCollection(
      { ...revealedProof, revealDuration: ARCHIVE_REDUCED_REVEAL_MS },
      1699,
    ),
    false,
  );
  assert.equal(
    canAccessPrivateCollection(
      { ...revealedProof, revealDuration: ARCHIVE_REDUCED_REVEAL_MS },
      1700,
    ),
    true,
  );
});

test("Private Collection: missing/expired/adult-unconfirmed/malformed proofs fail closed", () => {
  assert.equal(canAccessPrivateCollection(null, 11_000), false);
  for (const changes of [
    { ageConfirmed: false },
    { ageConfirmed: "true" },
    { expiresAt: 11_000 },
    { expiresAt: NaN },
    { expiresAt: Infinity },
    { imageServedAt: null },
    { imageServedAt: NaN },
    { imageServedAt: -1 },
    { imageServedAt: 11_001 },
    { revealDuration: 0 },
    { revealDuration: NaN },
    { revealDuration: 699 },
    { revealDuration: 9999 },
  ])
    assert.equal(
      canAccessPrivateCollection({ ...revealedProof, ...changes }, 11_000),
      false,
    );
  assert.equal(canAccessPrivateCollection(revealedProof, NaN), false);
});

test("Private Collection: only three allowlisted intents, no paid/delivered outcome", () => {
  for (const [intent, view] of [
    ["browse", "collection"],
    ["payment-request", "payment-requested"],
    ["exchange-agreement", "exchange-confirmed"],
  ]) {
    assert.equal(isCollectionIntent(intent), true);
    assert.equal(collectionReceipt(intent), view);
  }
  for (const input of [
    null,
    undefined,
    {},
    "payment-successful",
    "upload",
    "redeem",
    "exchange-confirmed",
    100,
  ])
    assert.equal(isCollectionIntent(input), false);
  assert.equal(privateCollection.price, "€100.00");
  assert.equal(privateCollection.exchangePrice, "€0.00");
  assert.equal(privateCollection.exchangeRatio, "10 : 1");
});

test("Private Collection server action: authentication + fresh archive proof on browse and both confirmations", async () => {
  // Execute the actual action with isolated auth/cookie adapters. No live credentials or DB.
  const source = ts.transpileModule(
    readFileSync(
      new URL(
        "../src/features/secret/actions/private-collection-actions.ts",
        import.meta.url,
      ),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
    },
  ).outputText;
  let authenticated = false;
  let proof = null;
  let proofReads = 0;
  const actionFactory = new Function(
    "hasValidAccessSession",
    "readArchiveProof",
    "canAccessPrivateCollection",
    "collectionReceipt",
    "isCollectionIntent",
    source
      .replace(/^import[\s\S]*?from ["'][^"']+["'];\s*$/gm, "")
      .replace("export async function", "async function") +
      "\nreturn accessPrivateCollection;",
  );
  const action = actionFactory(
    async () => authenticated,
    async () => {
      proofReads++;
      return proof;
    },
    canAccessPrivateCollection,
    collectionReceipt,
    isCollectionIntent,
  );
  for (const intent of ["browse", "payment-request", "exchange-agreement"]) {
    assert.equal((await action(intent)).ok, false);
    assert.equal(proofReads, 0);
  }
  authenticated = true;
  assert.equal((await action("browse")).ok, false);
  const now = Date.now();
  proof = {
    ...revealedProof,
    imageServedAt: now - 10_000,
    expiresAt: now + 60_000,
  };
  for (const intent of ["browse", "payment-request", "exchange-agreement"])
    assert.deepEqual(await action(intent), {
      ok: true,
      view: collectionReceipt(intent),
    });
  assert.equal((await action("payment-successful")).ok, false);
  proof = { ...proof, expiresAt: now - 1 };
  assert.equal((await action("exchange-agreement")).ok, false);
  authenticated = false;
  assert.equal((await action("payment-request")).ok, false);
});

test("Private Collection UI accepts no card, contact or photograph input and action has no external side effects", () => {
  const component = readFileSync(
    new URL(
      "../src/features/secret/components/private-collection.tsx",
      import.meta.url,
    ),
    "utf8",
  );
  const ast = ts.createSourceFile(
    "collection.tsx",
    component,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );
  const forbidden = [];
  function visit(node) {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ["input", "textarea", "form", "iframe"].includes(
        node.tagName.getText(ast),
      )
    )
      forbidden.push(node.tagName.getText(ast));
    ts.forEachChild(node, visit);
  }
  visit(ast);
  assert.deepEqual(forbidden, []);
  assert.match(component, /aria-readonly="true"/);
  assert.doesNotMatch(
    component,
    /contentEditable|getUserMedia|localStorage|sessionStorage|mailto:|Payment Successful/,
  );
  const action = readFileSync(
    new URL(
      "../src/features/secret/actions/private-collection-actions.ts",
      import.meta.url,
    ),
    "utf8",
  );
  assert.doesNotMatch(
    action,
    /from .*supabase|from .*rewards|fetch\(|writeArchiveProof|FormData|process\.env/,
  );
});
