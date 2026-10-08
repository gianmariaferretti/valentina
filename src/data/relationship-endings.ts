export const relationshipEndings = [
  {
    id: "perfect-boyfriend",
    title: "PERFECT BOYFRIEND",
    description:
      "You listened, remembered and resisted the urge to turn dinner into a TED talk. An unprecedented day. Please do not become unbearable about it.",
  },
  {
    id: "still-together",
    title: "STILL TOGETHER",
    description:
      "Not flawless. Not a catastrophe. Two people choosing each other again, even after the restaurant incident.",
  },
  {
    id: "sleeping-on-the-sofa",
    title: "SLEEPING ON THE SOFA",
    description:
      "The sofa has accepted your application. Tomorrow starts with an apology, not an appeal.",
  },
  {
    id: "you-had-one-job",
    title: "YOU HAD ONE JOB",
    description:
      "Several promises, very little follow-through. The reservations department and Valentina would both like a word.",
  },
  {
    id: "valentina-wins",
    title: "VALENTINA WINS",
    description:
      "You retired the imaginary scoreboard. Valentina chose the destination, the dinner and the film. Somehow, both of you won.",
  },
  {
    id: "gianmaria-was-right",
    title: "GIANMARIA WAS RIGHT*",
    description:
      "The receipts support your version of events. The jury refuses to encourage this behaviour.",
    footnote: "*This ending is considered non-canon.",
  },
  {
    id: "snack-diplomat",
    title: "THE SNACK DIPLOMAT",
    description:
      "A portable charger, a backup table and emergency chips. Love was not a grand speech today. It was logistics.",
  },
  {
    id: "beautiful-chaos",
    title: "CHAOS, BUT MAKE IT ROMANTIC",
    description:
      "The itinerary is missing. So is one shopping bag. You are both laughing too hard to file a report.",
  },
  {
    id: "quiet-team",
    title: "THE QUIET TEAM",
    description:
      "No dramatic rescue. Just enough space, a shared blanket and the rare pleasure of not needing to explain everything.",
  },
  {
    id: "eleventh-hour",
    title: "THE ELEVENTH HOUR",
    description:
      "You followed four small clues, kept the ordinary promises and found a tiny blue envelope. Inside: ‘Same team. Even on the complicated days.’",
    secret: true,
  },
] as const;
export type RelationshipEndingId = (typeof relationshipEndings)[number]["id"];
export const endingSecretId = (id: string) => `relationship-ending:${id}`;
