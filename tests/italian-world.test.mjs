import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  italianWorlds,
  publishedLessonWorldAssignments,
  worldCharacters,
  worldForLesson,
  worldStops,
} from "../src/data/italian-world.ts";
import {
  collectibleDiscoveryId,
  collectibleForLesson,
  italianWorldCollectibles,
} from "../src/data/italian-world-collectibles.ts";

const lessonIndex = JSON.parse(
  await readFile(
    new URL(
      "../src/content/italian/original-lessons/index.json",
      import.meta.url,
    ),
    "utf8",
  ),
);

test("the world registry has thirty original, populated environments and five characters", () => {
  assert.equal(italianWorlds.length, 30);
  assert.equal(Object.keys(worldCharacters).length, 5);
  assert.equal(new Set(italianWorlds.map((world) => world.id)).size, 30);
  for (const world of italianWorlds) {
    assert.equal(world.scenery.length, 3);
    assert.equal(world.motion.length, 3);
    assert.ok(world.description && world.interactiveProp && world.easterEgg);
    assert.ok(world.characterId in worldCharacters);
  }
});

test("every published lesson has a stable visual assignment without changing curriculum IDs", () => {
  assert.equal(lessonIndex.length, 80);
  assert.equal(publishedLessonWorldAssignments.length, lessonIndex.length);
  assert.deepEqual(
    publishedLessonWorldAssignments.map(
      (assignment) => assignment.lessonNumber,
    ),
    lessonIndex.map((lesson) => lesson.number),
  );
  assert.equal(
    new Set(publishedLessonWorldAssignments.map((item) => item.sceneId)).size,
    30,
  );
  for (const assignment of publishedLessonWorldAssignments) {
    assert.ok(worldForLesson(assignment.lessonNumber));
    assert.ok(assignment.interactiveProps.length);
    assert.ok(assignment.educationalVisuals.length);
  }
  assert.equal(worldForLesson(81), null);
});

test("fifteen map stops exist, but unpublished blocks never masquerade as lessons", () => {
  assert.equal(worldStops.length, 15);
  assert.equal(worldStops.filter((stop) => stop.published).length, 8);
  assert.deepEqual(
    worldStops.map((stop) => stop.firstLesson),
    Array.from({ length: 15 }, (_, index) => index * 10 + 1),
  );
});

test("twelve unique souvenirs are granted only by published lesson milestones", () => {
  assert.equal(italianWorldCollectibles.length, 12);
  assert.equal(
    new Set(italianWorldCollectibles.map((item) => item.id)).size,
    12,
  );
  assert.equal(
    new Set(italianWorldCollectibles.map((item) => item.lesson)).size,
    12,
  );
  for (const item of italianWorldCollectibles) {
    assert.ok(item.lesson >= 1 && item.lesson <= 80);
    assert.equal(collectibleForLesson(item.lesson)?.id, item.id);
    assert.equal(collectibleDiscoveryId(item.id), `italian-world:${item.id}`);
  }
  assert.equal(collectibleForLesson(81), null);
});
