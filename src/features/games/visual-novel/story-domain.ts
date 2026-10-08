import {
  hiddenRelationshipChoices,
  relationshipStory,
} from "../../../data/relationship-story.ts";
import {
  endingSecretId,
  type RelationshipEndingId,
} from "../../../data/relationship-endings.ts";
import type {
  Approach,
  RelationshipMetric,
  StoryCondition,
  StoryState,
} from "./types";

const effects: Record<Approach, readonly number[]> = {
  care: [3, 1, 3, 3, -2, -1],
  quiet: [1, 3, 0, 2, -2, -1],
  practical: [1, 1, 1, 1, -1, 0],
  yield: [2, 1, 0, 1, -1, -3],
  chaotic: [1, -1, 0, 1, 4, 0],
  ego: [-1, -2, 0, -1, 2, 4],
  neglect: [-8, -7, -2, -7, 4, 2],
  investigate: [1, -1, 1, 2, 2, 0],
};
export const relationshipMetricLabels: Record<RelationshipMetric, string> = {
  relationshipHealth: "RELATIONSHIP HEALTH",
  trust: "TRUST",
  valentinaPatience: "PATIENCE REMAINING",
  chaos: "CHAOS GENERATED",
  boyfriendPoints: "BOYFRIEND POINTS",
  gianmariaEgo: "GIANMARIA EGO",
};
const metricOrder: readonly RelationshipMetric[] = [
  "relationshipHealth",
  "valentinaPatience",
  "boyfriendPoints",
  "trust",
  "chaos",
  "gianmariaEgo",
];
export function createStoryState(): StoryState {
  return {
    metrics: {
      relationshipHealth: 60,
      valentinaPatience: 65,
      boyfriendPoints: 10,
      trust: 60,
      chaos: 20,
      gianmariaEgo: 50,
    },
    flags: [],
    approaches: {
      care: 0,
      quiet: 0,
      practical: 0,
      yield: 0,
      chaotic: 0,
      ego: 0,
      neglect: 0,
      investigate: 0,
    },
    choices: [],
    cursor: 0,
  };
}
export function meetsConditions(
  state: StoryState,
  conditions: readonly StoryCondition[] = [],
): boolean {
  return conditions.every(
    (condition) =>
      (!condition.flag || state.flags.includes(condition.flag)) &&
      (!condition.metric ||
        ((condition.minimum === undefined ||
          state.metrics[condition.metric] >= condition.minimum) &&
          (condition.maximum === undefined ||
            state.metrics[condition.metric] <= condition.maximum))),
  );
}
export function storyDecision(state: StoryState) {
  return relationshipStory[state.cursor] ?? null;
}
export function availableStoryChoices(state: StoryState) {
  const node = storyDecision(state);
  if (!node) return [];
  const hidden = hiddenRelationshipChoices[node.id];
  return [
    ...node.choices,
    ...(hidden && meetsConditions(state, hidden.requires) ? [hidden] : []),
  ];
}
export function storyPresentation(state: StoryState) {
  const node = storyDecision(state);
  if (!node) return null;
  const alternate =
    node.alternate && meetsConditions(state, node.alternate.when)
      ? node.alternate
      : node;
  let narration = alternate.narration;
  if (node.id === "dinner-arrival" && state.flags.includes("broken-evening"))
    narration =
      "You arrive after the meeting you never agreed on together. The morning promise is still sitting between the plates.";
  if (node.id === "last-argument" && state.metrics.trust < 45)
    narration =
      "She asks carefully now. Earlier dismissals have made even a simple question feel risky.";
  if (node.id === "shop-exit" && state.flags.includes("broken-bag"))
    narration =
      "The missing bag has made the walk heavier. She is tired of checking whether you are still beside her.";
  return { ...node, narration, dialogue: alternate.dialogue };
}
/** Pure and shared with the server: rejected/hidden choices never change state. */
export function chooseStoryResponse(
  state: StoryState,
  choiceId: string,
): { state: StoryState; consequence: string } {
  const node = storyDecision(state);
  const choice = availableStoryChoices(state).find(
    (option) => option.id === choiceId,
  );
  if (!node || !choice)
    throw new Error("This response is not available in this story state.");
  const metrics = { ...state.metrics };
  for (const [index, metric] of metricOrder.entries())
    metrics[metric] = Math.max(
      0,
      Math.min(100, metrics[metric] + effects[choice.approach][index]),
    );
  let consequence = choice.consequence;
  if (node.id === "fine" || node.id === "final-fine") {
    if (choice.id.endsWith(":4")) {
      const trusted =
        state.metrics.trust > 70 && state.metrics.valentinaPatience >= 25;
      metrics.relationshipHealth += trusted ? 5 : -9;
      metrics.trust += trusted ? 2 : -5;
      consequence = trusted
        ? "She trusts the invitation because you have been listening all day. ‘Actually, yes. There is something.’"
        : "The certainty in your voice feels like pressure, not understanding. ‘Please let me answer for myself.’";
    }
    if (choice.id.endsWith(":3") && state.metrics.valentinaPatience < 25) {
      metrics.relationshipHealth -= 5;
      metrics.trust -= 4;
      consequence =
        "Her patience is already thin. Another question closes the conversation rather than opening it.";
    }
  }
  if (
    node.id === "last-argument" &&
    choice.approach === "care" &&
    state.flags.includes("promise-kept")
  ) {
    metrics.trust += 3;
    consequence =
      "You name her concern and the promise you kept. Your actions make the words easier to believe.";
  }
  for (const metric of metricOrder)
    metrics[metric] = Math.max(0, Math.min(100, metrics[metric]));
  const next = {
    metrics,
    flags: [...new Set([...state.flags, ...(choice.flags ?? [])])],
    approaches: {
      ...state.approaches,
      [choice.approach]: state.approaches[choice.approach] + 1,
    },
    choices: [...state.choices, choiceId],
    cursor: state.cursor + 1,
  };
  while (
    next.cursor < relationshipStory.length &&
    !meetsConditions(next, relationshipStory[next.cursor].requires)
  )
    next.cursor++;
  return { state: next, consequence };
}
export function calculateRelationshipEnding(
  state: StoryState,
): RelationshipEndingId {
  if (storyDecision(state)) throw new Error("The day is not complete.");
  const m = state.metrics,
    a = state.approaches;
  const flags = new Set(state.flags);
  const broken = ["broken-evening", "broken-bag", "broken-dinner"].filter(
    (flag) => flags.has(flag),
  ).length;
  if (
    flags.has("envelope-open") &&
    flags.has("phone-away") &&
    flags.has("promise-kept") &&
    flags.has("bag-safe") &&
    m.relationshipHealth >= 85 &&
    m.trust >= 85 &&
    m.valentinaPatience >= 60 &&
    m.chaos >= 20 &&
    m.chaos <= 45 &&
    m.gianmariaEgo >= 20 &&
    m.gianmariaEgo <= 55 &&
    a.care >= 10 &&
    a.quiet >= 4 &&
    broken === 0
  )
    return "eleventh-hour";
  if (m.relationshipHealth < 30 || (m.trust < 35 && m.valentinaPatience < 35))
    return "sleeping-on-the-sofa";
  if (broken >= 2 && m.relationshipHealth < 75) return "you-had-one-job";
  if (
    m.gianmariaEgo >= 85 &&
    ["bill-evidence", "route-evidence", "dessert-evidence"].every((flag) =>
      flags.has(flag),
    ) &&
    m.trust >= 40
  )
    return "gianmaria-was-right";
  if (
    m.relationshipHealth >= 85 &&
    m.trust >= 85 &&
    m.boyfriendPoints >= 85 &&
    m.chaos <= 25 &&
    flags.has("promise-kept") &&
    flags.has("phone-away") &&
    broken === 0
  )
    return "perfect-boyfriend";
  if (a.yield >= 12 && m.gianmariaEgo <= 25 && m.relationshipHealth >= 55)
    return "valentina-wins";
  if (a.practical >= 12 && m.trust >= 50 && m.relationshipHealth >= 50)
    return "snack-diplomat";
  if (m.chaos >= 75 && m.relationshipHealth >= 50 && m.trust >= 45)
    return "beautiful-chaos";
  if (a.quiet >= 12 && m.trust >= 60 && m.valentinaPatience >= 60)
    return "quiet-team";
  return "still-together";
}
export function replayRelationshipStory(choices: readonly string[]) {
  if (
    !Array.isArray(choices) ||
    choices.length > relationshipStory.length ||
    choices.some((id) => typeof id !== "string" || id.length > 80)
  )
    throw new Error("Invalid story transcript.");
  let state = createStoryState();
  for (const id of choices) state = chooseStoryResponse(state, id).state;
  const ending = calculateRelationshipEnding(state);
  return {
    state,
    ending,
    score: state.metrics.relationshipHealth * 10,
    progress: 100,
    discoveredSecrets: [endingSecretId(ending)],
  };
}
