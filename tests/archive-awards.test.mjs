import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import ts from "typescript";
import { mediaAssets } from "../src/data/media.ts";
import { matchPhotoPlace } from "../src/features/media/lib/match-photo-place.ts";
import {
  archiveStages,
  nextArchiveStage,
  canCompleteArchive,
  ARCHIVE_REVEAL_MS,
  ARCHIVE_REDUCED_REVEAL_MS,
} from "../src/features/secret/lib/archive-domain.ts";

// Resolve this pure content module's sole runtime alias without importing React/Next.
const mediaUrl = new URL("../src/data/media.ts", import.meta.url).href;
const awardSource = ts
  .transpileModule(
    readFileSync(new URL("../src/data/awards.ts", import.meta.url), "utf8"),
    {
      compilerOptions: {
        target: ts.ScriptTarget.ES2022,
        module: ts.ModuleKind.ESNext,
      },
    },
  )
  .outputText.replace('"@/data/media"', JSON.stringify(mediaUrl));
const { awards, getAwardWinner } = await import(
  "data:text/javascript;base64," + Buffer.from(awardSource).toString("base64")
);
const expected = {
  "best-trip": ["Accettura", ["Accettura", "Naples", "Hamburg"]],
  "best-date": [
    "National Gallery",
    [
      "National Gallery",
      "Mexican Dinner",
      "Parco della Musica Concert",
      "Sushi Date",
    ],
  ],
  "best-dinner": [
    "Colombian Dinner by Valentina",
    [
      "Colombian Dinner by Valentina",
      "Italian Dinner by Gianmaria",
      "Dinner at the National Gallery",
    ],
  ],
  "best-photo": ["The Gianmaria Bite Photo", ["The Gianmaria Bite Photo"]],
  "best-surprise": [
    "Surprise Flowers",
    ["Surprise Flowers", "The Necklace Gift"],
  ],
  "worst-restaurant": [
    "The Cave Restaurant in Matera",
    ["The Cave Restaurant in Matera", "The Empty Restaurant in Matera"],
  ],
  "best-dramatic-performance": [
    "Valentina Mad at Me for No Reason",
    ["Valentina Mad at Me for No Reason", "Gianmaria Playing the Mad Card"],
  ],
  "most-beautiful-city": [
    "Pignola",
    ["Pignola", "Rome", "Cartagena", "Hamburg"],
  ],
  "most-annoying": ["Gianmaria's English", ["Gianmaria's English"]],
};

test("Awards: exact requested nominees and winners, valid IDs, preserved MVP and no removed categories", () => {
  assert.equal(awards.length, 14);
  assert.equal(new Set(awards.map((a) => a.id)).size, awards.length);
  for (const [id, [winner, names]] of Object.entries(expected)) {
    const award = awards.find((a) => a.id === id);
    assert.equal(getAwardWinner(award).name, winner);
    assert.deepEqual(
      award.nominees.map((n) => n.name),
      names,
    );
  }
  assert.equal(
    getAwardWinner(awards.find((a) => a.id === "relationship-mvp")).name,
    "VALENTINA",
  );
  assert.equal(
    awards.some((a) => ["best-excuse", "most-expensive-taste"].includes(a.id)),
    false,
  );
});
test("Awards: cancelled category has no nominees or winner; single nominee reveals remain valid", () => {
  const cancelled = awards.find((a) => a.id === "most-pointless-argument");
  assert.equal(cancelled.status, "cancelled");
  assert.deepEqual(cancelled.nominees, []);
  assert.equal(getAwardWinner(cancelled), null);
  assert.equal(cancelled.sticker.text, "CASE CLOSED");
  assert.equal(
    cancelled.description,
    "After careful consideration, the jury has concluded that Valentina is always right.",
  );
  for (const award of awards.filter((a) => a.status !== "cancelled"))
    assert.ok(getAwardWinner(award));
});
test("Media: ten destinations have correctly attributed covers, with no fabricated photograph dates", () => {
  for (const slug of [
    "london",
    "rome",
    "paris",
    "hamburg",
    "brussels",
    "polignano-a-mare",
    "matera",
    "accettura",
    "amalfi-coast",
    "bari",
  ]) {
    const asset = mediaAssets.find((m) => m.id === slug + "-cover");
    assert.equal(asset.relatedPlace, slug);
    assert.equal(asset.date, null);
    assert.ok(asset.alt.includes("placeholder"));
  }
});
test("Media: Italian/English matching is conservative and rejects ambiguous/unrelated filenames", () => {
  for (const [filename, slug] of [
    ["roma_01.jpg", "rome"],
    ["AMBURGO-3.JPEG", "hamburg"],
    ["bruxelles.webp", "brussels"],
    ["costiera_2.jpg", "amalfi-coast"],
    ["polignano-a-mare.png", "polignano-a-mare"],
    ["London 05.jpeg", "london"],
  ])
    assert.equal(matchPhotoPlace(filename), slug);
  assert.equal(matchPhotoPlace("rome_paris.jpg"), null);
  assert.equal(matchPhotoPlace("IMG_1234.jpg"), null);
  assert.equal(matchPhotoPlace("barista.jpg"), null);
});
test("Archive: exactly seven sequential stages; explicit age confirmation and completion cannot be skipped", () => {
  assert.equal(archiveStages.length, 7);
  assert.equal(nextArchiveStage("discovery", false), "curiosity");
  assert.equal(nextArchiveStage("curiosity", false), "age-confirmation");
  assert.equal(nextArchiveStage("age-confirmation", false), null);
  assert.equal(
    nextArchiveStage("age-confirmation", true),
    "point-of-no-return",
  );
  assert.equal(nextArchiveStage("point-of-no-return", true), "sealed-file");
  assert.equal(nextArchiveStage("sealed-file", true), "photo-reveal");
  assert.equal(nextArchiveStage("photo-reveal", true), null);
  assert.equal(nextArchiveStage("final-reveal", true), null);
});
test("Archive: reward requires served image, adult confirmation, completed reveal and unexpired proof", () => {
  const proof = {
    stage: "photo-reveal",
    ageConfirmed: true,
    imageServedAt: 1000,
    revealDuration: ARCHIVE_REVEAL_MS,
    expiresAt: 60_000,
  };
  assert.equal(canCompleteArchive(proof, 10_999), false);
  assert.equal(canCompleteArchive(proof, 11_000), true);
  for (const changes of [
    { ageConfirmed: false },
    { imageServedAt: null },
    { stage: "sealed-file" },
    { expiresAt: 11_000 },
  ])
    assert.equal(canCompleteArchive({ ...proof, ...changes }, 11_000), false);
  assert.equal(
    canCompleteArchive(
      { ...proof, revealDuration: ARCHIVE_REDUCED_REVEAL_MS },
      1700,
    ),
    true,
  );
});
