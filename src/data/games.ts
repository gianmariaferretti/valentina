import type { VgGameDefinition } from "@/features/games/types";
import { endingSecretId, relationshipEndings } from "./relationship-endings.ts";

export const vgGames = [
  {
    gameId: "great-escape",
    slug: "great-escape",
    number: "01",
    title: "V&G: The Great Escape",
    shortTitle: "The Great Escape",
    dossierLabel: "Joint extraction file",
    description:
      "Guide V and G out of a suspiciously bureaucratic archive before the doors seal for the night.",
    objective:
      "Collect both passport stamps, recover the key and reach the exit together.",
    engine: "great-escape",
    difficulty: "standard",
    estimatedMinutes: 3,
    accent: "oxblood",
    instructions: [
      "Move both travellers through the archive grid.",
      "Collect two passport stamps and the brass key.",
      "Avoid the moving searchlight and reach the marked exit.",
    ],
    controls: ["Arrow keys or WASD", "Swipe", "On-screen direction pad"],
    maxScore: 1_000,
    victory: {
      endings: ["escaped-together"],
      minimumProgress: 100,
      minimumScore: 500,
    },
    allowedEndings: ["escaped-together", "caught-in-the-archive"],
    rewards: [
      {
        id: "great-escape-achievement",
        kind: "achievement",
        targetId: "great-escape-complete",
        title: "Exit Strategy",
        description:
          "Escaped a locked archive with the relationship paperwork intact.",
        trigger: "victory",
      },
      {
        id: "great-escape-east-key",
        kind: "item",
        targetId: "item:archive-key-east",
        title: "Eastern Archive Key",
        description:
          "A cross-game key. It looks official enough to be dangerous.",
        trigger: "victory",
      },
    ],
  },
  {
    gameId: "find-gianmaria",
    slug: "find-gianmaria",
    number: "02",
    title: "Operation: Find Gianmaria",
    shortTitle: "Find Gianmaria",
    dossierLabel: "Visual intelligence file",
    description:
      "A classified search operation involving decoys, travel ephemera and one boyfriend who is not as subtle as he thinks.",
    objective:
      "Identify Gianmaria in five increasingly implausible surveillance scenes.",
    engine: "find-gianmaria",
    difficulty: "standard",
    estimatedMinutes: 2,
    accent: "blue",
    instructions: [
      "Study each surveillance board before the timer expires.",
      "Select the correct subject; decoys cost one strike.",
      "Find all five appearances to close the operation.",
    ],
    controls: ["Mouse or touch", "Tab and Enter", "Number keys"],
    maxScore: 1_200,
    victory: {
      endings: ["subject-located"],
      minimumProgress: 100,
      minimumScore: 500,
    },
    allowedEndings: ["subject-located", "subject-escaped"],
    rewards: [
      {
        id: "find-gianmaria-achievement",
        kind: "achievement",
        targetId: "operation-subject-located",
        title: "Excellent Taste in Boyfriends",
        description:
          "Located Gianmaria despite an irresponsible number of decoys.",
        trigger: "victory",
      },
      {
        id: "find-gianmaria-coupon",
        kind: "coupon",
        targetId: "you-found-me",
        title: "GV-032 · You Found Me",
        description:
          "The evidence was persuasive. A classified coupon is now available.",
        trigger: "victory",
      },
      {
        id: "find-gianmaria-redacted-note",
        kind: "secret",
        targetId: "secret:operation-redacted-note",
        title: "Redacted Note",
        description: "A hidden note survived the censorship department.",
        trigger: "secret",
        secretId: "operation-redacted-note",
      },
    ],
  },
  {
    gameId: "survive-relationship",
    slug: "survive-relationship",
    number: "03",
    title: "Survive 24 Hours with Gianmaria",
    shortTitle: "24 Hours Together",
    dossierLabel: "An interactive relationship novel",
    description:
      "Six chapters. One very ordinary day that refuses to stay ordinary. A branching visual novel about listening, questionable decisions and the same team.",
    objective:
      "Live the whole day, discover its consequences, and collect ten different endings.",
    engine: "survive-relationship",
    difficulty: "story",
    estimatedMinutes: 18,
    accent: "rose",
    instructions: [
      "You direct Gianmaria through six chapters, from morning coffee to the final conversation at home.",
      "There are no correct answers. Earlier decisions change later dialogue, trust and available responses.",
      "Follow small clues, keep promises, or create chaos. Your relationship report stays sealed until the day ends.",
      "Replay to collect ten endings. Completed endings are archived across devices; an unfinished day is not saved.",
    ],
    controls: [
      "Mouse or touch",
      "Tab and Enter",
      "Keys 1–5 for responses",
      "P to pause",
    ],
    maxScore: 1_000,
    victory: {
      endings: [
        "perfect-boyfriend",
        "still-together",
        "valentina-wins",
        "gianmaria-was-right",
        "snack-diplomat",
        "beautiful-chaos",
        "quiet-team",
        "eleventh-hour",
      ],
      minimumProgress: 100,
    },
    allowedEndings: relationshipEndings.map((ending) => ending.id),
    permittedSecrets: relationshipEndings.map((ending) =>
      endingSecretId(ending.id),
    ),
    rewards: [
      {
        id: "survive-relationship-achievement",
        kind: "achievement",
        targetId: "relationship-survivor",
        title: "One Whole Day",
        description: "Completed a first full day in the relationship novel.",
        trigger: "completion",
      },
      {
        id: "relationship-perfect-achievement",
        kind: "achievement",
        targetId: "relationship-perfect",
        title: "Suspiciously Perfect",
        description: "Discovered the Perfect Boyfriend ending.",
        trigger: "secret",
        secretId: endingSecretId("perfect-boyfriend"),
      },
      {
        id: "relationship-secret-achievement",
        kind: "achievement",
        targetId: "relationship-eleventh-hour",
        title: "The Little Things",
        description:
          "Followed the clues all the way to the very difficult secret ending.",
        trigger: "secret",
        secretId: endingSecretId("eleventh-hour"),
      },
      {
        id: "relationship-all-endings-achievement",
        kind: "achievement",
        targetId: "relationship-complete-archive",
        title: "Every Version of Us",
        description: "Discovered all ten endings, including the non-canon one.",
        trigger: "collection",
        requiredSecrets: relationshipEndings.map((ending) =>
          endingSecretId(ending.id),
        ),
      },
      {
        id: "survive-relationship-snack-token",
        kind: "item",
        targetId: "item:emergency-snack-token",
        title: "Emergency Snack Token",
        description: "Valid during future crises and suspicious silences.",
        trigger: "victory",
      },
    ],
  },
  {
    gameId: "break-defences",
    slug: "break-defences",
    number: "04",
    title: "Break My Defences",
    shortTitle: "Break Defences",
    dossierLabel: "Oxblood perimeter test",
    description:
      "A tactile precision game about dismantling an unnecessarily dramatic wall, one guarded document at a time.",
    objective: "Clear every defence layer without losing all three attempts.",
    engine: "break-defences",
    difficulty: "daring",
    estimatedMinutes: 4,
    accent: "rust",
    instructions: [
      "Move the brass tray to return the archive seal.",
      "Break every oxblood document block.",
      "Three missed returns close the file.",
    ],
    controls: ["Arrow keys or A/D", "Pointer drag", "On-screen controls"],
    maxScore: 1_200,
    victory: {
      endings: ["defences-breached"],
      minimumProgress: 100,
      minimumScore: 600,
    },
    allowedEndings: ["defences-breached", "file-resealed"],
    rewards: [
      {
        id: "break-defences-achievement",
        kind: "achievement",
        targetId: "defence-breaker",
        title: "Emotional Access Granted",
        description: "Broke every defence without filing an appeal.",
        trigger: "victory",
      },
      {
        id: "break-defences-key-fragment",
        kind: "item",
        targetId: "item:oxblood-key-fragment",
        title: "Oxblood Key Fragment",
        description:
          "Part of a key whose purpose remains aggressively classified.",
        trigger: "victory",
      },
    ],
  },
  {
    gameId: "build-year",
    slug: "build-year",
    number: "05",
    title: "Build Our Year",
    shortTitle: "Build Our Year",
    dossierLabel: "Timeline reconstruction",
    description:
      "Reassemble Year One from shuffled archive cards. The records department denies responsibility for the disorder.",
    objective: "Place all seven chapter cards in their correct sequence.",
    engine: "build-year",
    difficulty: "story",
    estimatedMinutes: 3,
    accent: "gold",
    instructions: [
      "Read the chapter number and archive note on each card.",
      "Move cards earlier or later until the file is chronological.",
      "Submit the timeline when every chapter is in place.",
    ],
    controls: ["Move buttons", "Keyboard focus", "Touch-friendly ordering"],
    maxScore: 1_000,
    victory: {
      endings: ["timeline-sealed"],
      minimumProgress: 100,
    },
    allowedEndings: ["timeline-sealed", "timeline-disputed"],
    rewards: [
      {
        id: "build-year-achievement",
        kind: "achievement",
        targetId: "year-architect",
        title: "Year Architect",
        description:
          "Reconstructed the archive with suspicious chronological competence.",
        trigger: "victory",
      },
      {
        id: "build-year-discovery",
        kind: "discovery",
        targetId: "memory:year-one-timeline",
        title: "Year One Timeline",
        description:
          "The official sequence has been entered into the private archive.",
        trigger: "victory",
      },
    ],
  },
  {
    gameId: "relationship-minefield",
    slug: "relationship-minefield",
    number: "06",
    title: "Relationship Minefield",
    shortTitle: "Minefield",
    dossierLabel: "Hazard assessment",
    description:
      "Clear a field of avoidable arguments using logic, flags and exactly the right amount of caution.",
    objective: "Reveal every safe square; use flags to mark the red flags.",
    engine: "relationship-minefield",
    difficulty: "daring",
    estimatedMinutes: 5,
    accent: "green",
    instructions: [
      "Numbers reveal how many red flags touch a safe square.",
      "Switch between Reveal and Flag modes on touch devices.",
      "One wrong reveal costs a life; three end the inspection.",
    ],
    controls: ["Click or tap", "Reveal/Flag mode", "Keyboard grid navigation"],
    maxScore: 1_000,
    victory: {
      endings: ["field-cleared"],
      minimumProgress: 100,
      minimumScore: 500,
    },
    allowedEndings: ["field-cleared", "avoidable-argument"],
    rewards: [
      {
        id: "minefield-achievement",
        kind: "achievement",
        targetId: "minefield-navigator",
        title: "Red Flag Specialist",
        description:
          "Identified every hazard without starting a committee meeting.",
        trigger: "victory",
      },
      {
        id: "minefield-perfect-route",
        kind: "secret",
        targetId: "secret:minefield-perfect-route",
        title: "Perfect Route",
        description: "Cleared the field without losing a single life.",
        trigger: "secret",
        secretId: "minefield-perfect-route",
      },
    ],
  },
  {
    gameId: "365-memories",
    slug: "365-memories",
    number: "07",
    title: "365 Memories",
    shortTitle: "365 Memories",
    dossierLabel: "Final archive index",
    description:
      "Match paired fragments from Year One and restore the final memory index. Real photographs can replace the marked archive placeholders later.",
    objective: "Find all eight memory pairs before the archive timer expires.",
    engine: "365-memories",
    difficulty: "standard",
    estimatedMinutes: 4,
    accent: "ink",
    instructions: [
      "Turn over two archive cards at a time.",
      "Matching labels remain visible; mismatches are resealed.",
      "Restore all pairs to complete the Year One index.",
    ],
    controls: ["Mouse or touch", "Tab and Enter", "Arrow-key focus"],
    maxScore: 1_600,
    victory: {
      endings: ["archive-complete"],
      minimumProgress: 100,
      minimumScore: 800,
    },
    allowedEndings: ["archive-complete", "archive-timed-out"],
    rewards: [
      {
        id: "memories-achievement",
        kind: "achievement",
        targetId: "memory-keeper-365",
        title: "Keeper of the Archive",
        description:
          "Restored the final index and remembered where everything belonged.",
        trigger: "victory",
      },
      {
        id: "memories-classified-coupon",
        kind: "coupon",
        targetId: "classified-coupon",
        title: "GV-033 · The Classified Coupon",
        description:
          "A sealed coupon has been transferred to Valentina’s wallet.",
        trigger: "victory",
      },
      {
        id: "memories-master-key",
        kind: "item",
        targetId: "item:master-archive-key",
        title: "Master Archive Key",
        description:
          "The final cross-game key. It unlocks absolutely nothing ordinary.",
        trigger: "victory",
      },
    ],
  },
] as const satisfies readonly VgGameDefinition[];

export type VgGameId = (typeof vgGames)[number]["gameId"];

export function getVgGame(slug: string): VgGameDefinition | undefined {
  return vgGames.find((game) => game.slug === slug);
}

export function isVgGameId(value: string): value is VgGameId {
  return vgGames.some((game) => game.gameId === value);
}
