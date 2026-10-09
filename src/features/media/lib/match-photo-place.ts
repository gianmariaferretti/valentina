/** Suggest a destination from an actual supplied filename. Never guesses a date or registers a photo. */
const aliases = {
  london: ["london", "londra"],
  rome: ["rome", "roma"],
  paris: ["paris", "parigi"],
  hamburg: ["hamburg", "amburgo"],
  brussels: ["brussels", "bruxelles"],
  "polignano-a-mare": ["polignano", "polignano a mare"],
  matera: ["matera"],
  accettura: ["accettura"],
  "amalfi-coast": ["amalfi", "amalfi coast", "costiera", "costiera amalfitana"],
  bari: ["bari"],
} as const;

export function matchPhotoPlace(filename: string): string | null {
  const basename = filename.split(/[\\/]/).at(-1) ?? "";
  const normalized = basename
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z]+/g, " ")
    .trim();
  const matches = Object.entries(aliases).filter(([, names]) =>
    names.some((name) => ` ${normalized} `.includes(` ${name} `)),
  );
  // Ambiguous filenames require an editorial decision, not an arbitrary first match.
  return matches.length === 1 ? matches[0][0] : null;
}
