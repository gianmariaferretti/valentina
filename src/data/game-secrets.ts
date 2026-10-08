/** Editorial secret copy stays on the server-side archive page. */
export const gameSecretNotes: Readonly<Record<string, string>> = {
  "secret:operation-redacted-note":
    "The suspect's emergency plan: snacks, a questionable shortcut, and finding his way back to wherever you are.",
  "secret:minefield-perfect-route":
    "An entire minefield crossed without starting an argument. The jury would like to study your restraint.",
};

export const masterArchiveFile = {
  title: "Full clearance. Unfortunately.",
  requiredItemIds: [
    "item:archive-key-east",
    "item:oxblood-key-fragment",
    "item:master-archive-key",
  ],
  paragraphs: [
    "You found the key, broke the defences and put the memories back together. The archive has run out of excuses to keep you outside.",
    "Final classified finding: I would choose this year again. Even the missed turns, the absurd debates and the thirty-seventh photograph. Especially if it means choosing you.",
    "Next assignment: another year. Bring the keys. I will bring the snacks.",
  ],
} as const;
