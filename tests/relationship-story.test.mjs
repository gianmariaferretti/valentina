import assert from "node:assert/strict";
import test from "node:test";
import {
  relationshipChapters,
  relationshipStory,
  hiddenRelationshipChoices,
} from "../src/data/relationship-story.ts";
import {
  relationshipEndings,
  endingSecretId,
} from "../src/data/relationship-endings.ts";
import { vgGames } from "../src/data/games.ts";
import { evaluateGameResult } from "../src/features/games/lib/game-domain.ts";
import {
  createStoryState,
  storyDecision,
  availableStoryChoices,
  chooseStoryResponse,
  replayRelationshipStory,
  storyPresentation,
} from "../src/features/games/visual-novel/story-domain.ts";

const profiles = {
  care: {
    care: 30,
    quiet: 1,
    practical: 1,
    yield: 1,
    chaotic: 1,
    ego: 1,
    investigate: 1,
    neglect: 0,
  },
  quiet: {
    care: 1,
    quiet: 30,
    practical: 1,
    yield: 1,
    chaotic: 1,
    ego: 1,
    investigate: 0,
    neglect: 0,
  },
  practical: {
    care: 1,
    quiet: 1,
    practical: 30,
    yield: 1,
    chaotic: 1,
    ego: 1,
    investigate: 0,
    neglect: 0,
  },
  yield: {
    care: 1,
    quiet: 1,
    practical: 1,
    yield: 30,
    chaotic: 1,
    ego: 1,
    investigate: 0,
    neglect: 0,
  },
  chaos: {
    care: 2,
    quiet: 1,
    practical: 1,
    yield: 1,
    chaotic: 30,
    ego: 1,
    investigate: 1,
    neglect: 0,
  },
  ego: {
    care: 5,
    quiet: 1,
    practical: 1,
    yield: 0,
    chaotic: 1,
    ego: 15,
    investigate: 0,
    neglect: 0,
  },
  disaster: {
    care: 0,
    quiet: 1,
    practical: 1,
    yield: 0,
    chaotic: 0,
    ego: 30,
    investigate: 0,
    neglect: 50,
  },
  unreliable: {
    care: 1,
    quiet: 2,
    practical: 1,
    yield: 1,
    chaotic: 2,
    ego: 6,
    investigate: 0,
    neglect: 30,
  },
  ordinary: {
    care: 2,
    quiet: 2,
    practical: 2,
    yield: 2,
    chaotic: 2,
    ego: 3,
    investigate: 1,
    neglect: 1,
  },
  secret: {
    care: 7,
    quiet: 4,
    practical: 1,
    yield: 0,
    chaotic: 5,
    ego: 1,
    investigate: 1,
    neglect: 0,
  },
};
const visited = new Set();
const seenResponses = new Set();
export const witnesses = new Map();
let rng = 0x3102025;
function random() {
  rng = (Math.imul(rng, 1664525) + 1013904223) >>> 0;
  return rng / 2 ** 32;
}
for (const [name, weights] of Object.entries(profiles)) {
  for (let run = 0; run < 1800; run++) {
    let state = createStoryState();
    while (storyDecision(state)) {
      const node = storyDecision(state);
      visited.add(node.id);
      let choices = availableStoryChoices(state);
      if (name === "secret") {
        const mystery = choices.find(
          (choice) => choice.approach === "investigate",
        );
        const required = [
          "morning-plan",
          "promise-check",
          "bag",
          "dinner-arrival",
          "night-promise",
        ].includes(node.id);
        if (mystery) choices = [mystery];
        else if (required)
          choices = [
            choices.find((choice) =>
              choice.flags?.some((flag) =>
                [
                  "dinner-promise",
                  "promise-kept",
                  "bag-safe",
                  "phone-away",
                  "same-team",
                ].includes(flag),
              ),
            ),
          ];
      }
      let total = choices.reduce(
        (sum, choice) => sum + (weights[choice.approach] || 0.01),
        0,
      );
      let target = random() * total;
      const choice =
        choices.find(
          (choice) => (target -= weights[choice.approach] || 0.01) < 0,
        ) ?? choices.at(-1);
      seenResponses.add(choice.id);
      state = chooseStoryResponse(state, choice.id).state;
      assert.ok(
        Object.values(state.metrics).every(
          (value) => Number.isInteger(value) && value >= 0 && value <= 100,
        ),
      );
    }
    const result = replayRelationshipStory(state.choices);
    if (!witnesses.has(result.ending))
      witnesses.set(result.ending, state.choices);
  }
}

// Random sampling alone can miss alternatives inside rare conditional scenes.
// Fork every edge from a genuinely reachable prefix, then finish each day normally.
let reachablePrefix = createStoryState();
for (const id of witnesses.get("eleventh-hour") ?? []) {
  for (const choice of availableStoryChoices(reachablePrefix)) {
    seenResponses.add(choice.id);
    let branch = chooseStoryResponse(reachablePrefix, choice.id).state;
    while (storyDecision(branch))
      branch = chooseStoryResponse(
        branch,
        availableStoryChoices(branch)[0].id,
      ).state;
    replayRelationshipStory(branch.choices);
  }
  reachablePrefix = chooseStoryResponse(reachablePrefix, id).state;
}

test("six chapters contain 36 unconditional decisions, conditional scenes and unique choices", () => {
  assert.deepEqual(
    relationshipChapters.map((chapter) => chapter.time),
    ["08:00", "11:30", "14:00", "17:30", "20:00", "23:00"],
  );
  assert.equal(relationshipStory.filter((node) => !node.requires).length, 36);
  assert.equal(relationshipStory.filter((node) => node.requires).length, 3);
  const ids = relationshipStory.flatMap((node) =>
    node.choices.map((choice) => choice.id),
  );
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(
    ids.every((id) => seenResponses.has(id)),
    "Every ordinary decision edge must be simulated",
  );
  assert.ok(relationshipStory.every((node) => node.choices.length === 4));
  assert.equal(visited.size, relationshipStory.length);
  assert.ok(
    Object.values(hiddenRelationshipChoices).every((choice) =>
      seenResponses.has(choice.id),
    ),
  );
});

test("deterministic simulation reaches all ten endings through actual complete transcripts", () => {
  const missing = relationshipEndings
    .filter((ending) => !witnesses.has(ending.id))
    .map((ending) => ending.id);
  assert.deepEqual(
    missing,
    [],
    `Missing endings: ${missing.join(", ")}; reached ${[...witnesses.keys()]}`,
  );
  for (const ending of relationshipEndings) {
    const choices = witnesses.get(ending.id);
    assert.ok(choices.length >= 36);
    assert.equal(replayRelationshipStory(choices).ending, ending.id);
  }
});

test("hidden/unavailable responses, incomplete days and extra decisions are rejected", () => {
  assert.throws(() => chooseStoryResponse(createStoryState(), "fine:5"));
  assert.throws(() => replayRelationshipStory([]));
  assert.throws(() => replayRelationshipStory(["coffee:99"]));
  assert.throws(() =>
    replayRelationshipStory([...witnesses.values().next().value, "lights:1"]),
  );
});

test("identical response materially depends on previous trust, patience and promises", () => {
  const cursor = relationshipStory.findIndex((node) => node.id === "fine");
  const initial = createStoryState();
  const trusting = {
    ...initial,
    cursor,
    metrics: { ...initial.metrics, trust: 85 },
  };
  const strained = {
    ...initial,
    cursor,
    metrics: { ...initial.metrics, trust: 40, valentinaPatience: 20 },
  };
  const positive = chooseStoryResponse(trusting, "fine:4");
  const negative = chooseStoryResponse(strained, "fine:4");
  assert.ok(
    positive.state.metrics.relationshipHealth >
      initial.metrics.relationshipHealth,
  );
  assert.ok(
    negative.state.metrics.relationshipHealth <
      initial.metrics.relationshipHealth,
  );
  assert.notEqual(positive.consequence, negative.consequence);
  assert.notEqual(
    storyPresentation(trusting).narration,
    storyPresentation(strained).narration,
  );
});

test("a final choice cannot turn a disastrous full day into the perfect/secret ending", () => {
  const transcript = witnesses.get("sleeping-on-the-sofa");
  for (const option of relationshipStory.at(-1).choices) {
    const ending = replayRelationshipStory([
      ...transcript.slice(0, -1),
      option.id,
    ]).ending;
    assert.notEqual(ending, "perfect-boyfriend");
    assert.notEqual(ending, "eleventh-hour");
  }
});

test("ending grants and collection achievements use persisted, whitelisted archive records", () => {
  const game = vgGames.find((game) => game.gameId === "survive-relationship");
  const perfect = replayRelationshipStory(witnesses.get("perfect-boyfriend"));
  const grants = evaluateGameResult(game, perfect);
  assert.ok(
    grants.rewards.some(
      (reward) => reward.id === "survive-relationship-achievement",
    ),
  );
  assert.ok(
    grants.rewards.some(
      (reward) => reward.id === "relationship-perfect-achievement",
    ),
  );
  assert.ok(!grants.rewards.some((reward) => reward.trigger === "collection"));
  const collection = evaluateGameResult(
    game,
    perfect,
    relationshipEndings
      .filter((ending) => ending.id !== perfect.ending)
      .map((ending) => endingSecretId(ending.id)),
  );
  assert.ok(
    collection.rewards.some((reward) => reward.trigger === "collection"),
  );
  assert.deepEqual(
    evaluateGameResult(game, { ...perfect, discoveredSecrets: ["made-up"] })
      .discoveredSecrets,
    [],
  );
});
