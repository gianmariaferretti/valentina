export const findGianmariaScenes = [
  {
    id: "platform",
    label: "Surveillance still 01 · Platform",
    clue: "The correct subject has the burgundy passport and missed the obvious sign.",
    targetIndex: 6,
    candidateMarks: [
      "MAP",
      "TEA",
      "GATE",
      "BOOK",
      "FILM",
      "TAXI",
      "VG",
      "COAT",
      "BAG",
    ],
  },
  {
    id: "museum",
    label: "Surveillance still 02 · Museum",
    clue: "Find the subject standing too close to the exit with ticket 31.",
    targetIndex: 2,
    candidateMarks: [
      "A7",
      "WEST",
      "31",
      "AUDIO",
      "CAFE",
      "NORTH",
      "12",
      "COAT",
      "GUIDE",
    ],
  },
  {
    id: "airport",
    label: "Surveillance still 03 · Airport",
    clue: "The correct luggage tag carries the initials G.F.",
    targetIndex: 8,
    candidateMarks: [
      "V1",
      "ROM",
      "HAM",
      "PAR",
      "BRU",
      "LON",
      "VLC",
      "GATE",
      "G.F.",
    ],
  },
  {
    id: "restaurant",
    label: "Surveillance still 04 · Restaurant",
    clue: "Find the suspect holding the bill while pretending not to calculate it.",
    targetIndex: 4,
    candidateMarks: [
      "MENU",
      "WATER",
      "BREAD",
      "WINE",
      "€?",
      "SALT",
      "DESSERT",
      "COAT",
      "TABLE",
    ],
  },
  {
    id: "archive",
    label: "Surveillance still 05 · Archive",
    clue: "The final subject carries the V&G file marked 365.",
    targetIndex: 0,
    candidateMarks: [
      "365",
      "006",
      "MAP",
      "QUIZ",
      "FILE",
      "STAMP",
      "KEY",
      "TAPE",
      "VOID",
    ],
  },
] as const;

export const relationshipScenarios = [
  {
    id: "hungry",
    prompt:
      "Valentina says she is ‘not hungry’ while looking directly at your food.",
    answers: [
      "Protect the plate",
      "Order extra anyway",
      "Begin a legal argument",
    ],
    correctIndex: 1,
    feedback:
      "Preventive chips remain the strongest known relationship technology.",
  },
  {
    id: "lost",
    prompt:
      "You are both lost and the map insists the destination is behind you.",
    answers: ["Blame the city", "Walk faster", "Stop, laugh and recalibrate"],
    correctIndex: 2,
    feedback: "Navigation restored. Dignity remains under investigation.",
  },
  {
    id: "late",
    prompt: "The reservation is in twelve minutes. Nobody is wearing shoes.",
    answers: [
      "Issue a calm countdown",
      "Cancel civilization",
      "Leave a dramatic note",
    ],
    correctIndex: 0,
    feedback: "Measured urgency: surprisingly compatible with romance.",
  },
  {
    id: "film",
    prompt: "Movie night has reached the forty-minute selection stage.",
    answers: [
      "Open another app",
      "Use a three-film shortlist",
      "Watch trailers until dawn",
    ],
    correctIndex: 1,
    feedback: "A shortlist prevents the streaming interface from winning.",
  },
  {
    id: "argument",
    prompt:
      "A tiny disagreement has acquired exhibits, witnesses and closing arguments.",
    answers: [
      "Lower the stakes",
      "Find more evidence",
      "Text from the next room",
    ],
    correctIndex: 0,
    feedback:
      "The court acknowledges that this was never about the original topic.",
  },
  {
    id: "sleep",
    prompt: "Someone says ‘I’m not tired’ and immediately falls asleep.",
    answers: [
      "Take photographic evidence",
      "Wake them for accuracy",
      "Deploy a blanket",
    ],
    correctIndex: 2,
    feedback: "Blanket deployed. Contradictory testimony archived for later.",
  },
  {
    id: "photo",
    prompt: "The first thirty-six photographs were apparently ‘almost right’.",
    answers: [
      "Take number thirty-seven",
      "Retire from photography",
      "Apply a random filter",
    ],
    correctIndex: 0,
    feedback: "Number thirty-seven was obviously the one. This is science.",
  },
  {
    id: "terrible-day",
    prompt:
      "The day has been objectively terrible and solutions are not requested.",
    answers: [
      "Present a spreadsheet",
      "Listen and bring something good",
      "Explain perspective",
    ],
    correctIndex: 1,
    feedback: "Correct: presence first, unsolicited consultancy never.",
  },
] as const;

export const buildYearChapters = [
  {
    id: "chapter-01",
    order: 1,
    date: "31 OCT 2025",
    title: "The beginning",
    note: "The one date in this file that is not negotiable.",
  },
  {
    id: "chapter-02",
    order: 2,
    date: "ARCHIVE SLOT 02",
    title: "First shared map pin",
    note: "Replace this card with the real location and date.",
  },
  {
    id: "chapter-03",
    order: 3,
    date: "ARCHIVE SLOT 03",
    title: "First boarding pass",
    note: "Replace this card with the real trip from Year One.",
  },
  {
    id: "chapter-04",
    order: 4,
    date: "ARCHIVE SLOT 04",
    title: "The dinner worth archiving",
    note: "Replace this card with the real dinner and date.",
  },
  {
    id: "chapter-05",
    order: 5,
    date: "ARCHIVE SLOT 05",
    title: "The ridiculous argument",
    note: "Replace this card with an approved version of events.",
  },
  {
    id: "chapter-06",
    order: 6,
    date: "ARCHIVE SLOT 06",
    title: "The photograph that stayed",
    note: "Replace this card with the real photograph and caption.",
  },
  {
    id: "chapter-07",
    order: 7,
    date: "31 OCT 2026",
    title: "Year One",
    note: "One complete year. Further renewals strongly implied.",
  },
] as const;

export const memoryPairDefinitions = [
  {
    id: "beginning",
    label: "The beginning",
    mediaId: "memory-slot-beginning",
    stamp: "31·10·25",
  },
  {
    id: "trip",
    label: "A shared trip",
    mediaId: "memory-slot-trip",
    stamp: "BOARDING",
  },
  {
    id: "city",
    label: "A city that became ours",
    mediaId: "memory-slot-city",
    stamp: "COORDINATES",
  },
  {
    id: "dinner",
    label: "A dinner worth keeping",
    mediaId: "memory-slot-dinner",
    stamp: "TABLE 02",
  },
  {
    id: "random",
    label: "A perfectly random day",
    mediaId: "memory-slot-random",
    stamp: "CANDID",
  },
  {
    id: "favourite",
    label: "A favourite frame",
    mediaId: "memory-slot-favourite",
    stamp: "SELECTED",
  },
  {
    id: "chaos",
    label: "Harmless chaos",
    mediaId: "memory-slot-chaos",
    stamp: "EVIDENCE",
  },
  {
    id: "next",
    label: "What comes next",
    mediaId: "memory-slot-next",
    stamp: "TO BE CONTINUED",
  },
] as const;
