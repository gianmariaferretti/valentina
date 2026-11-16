import { loadCasinoBadge } from "../repositories/load-casino";

/** A red dot on the Casino menu item when a bonus or free spin is waiting. */
export async function CasinoNavBadge() {
  if (!(await loadCasinoBadge())) return null;
  return (
    <span className="ml-1.5 inline-block size-2.5 rounded-full bg-[#d6283e] align-middle ring-2 ring-[var(--paper)]">
      <span className="sr-only"> (something to collect)</span>
    </span>
  );
}
