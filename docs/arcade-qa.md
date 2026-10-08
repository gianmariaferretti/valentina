# Five-game Arcade — QA and handoff

Reviewed 8 October 2026 on the dedicated `feat/five-game-arcade` branch. No automatic production merge.

## Scope and files

The active collection contains exactly Break My Defences, Relationship Minefield, 365 Memories, Snake and Maze. The four retired games, their unused narrative/media data, duplicate legacy UI and Monogatari runtime/build dependency were removed. Historical versions remain recoverable in Git; historical database rows were not deleted. Related achievement copy and the final archive's attainable two-key requirement were updated. Authentication, navigation, Map, Quiz, Gallery, letters and existing coupon redemption behavior were not redesigned.

Main implementation surfaces:

- Routes: `src/app/(experience)/challenges/page.tsx` and `[game]/page.tsx`.
- Definitions/settings/media slots: `src/data/games.ts`, `arcade-config.ts`, `arcade-memories.ts`, `defence-arcade.ts`; reward coupon definition in `coupons.ts`.
- Shared shell, result/retry dialog and controls: `src/features/games/components`; Canvas/audio hooks in `hooks`.
- Five engines and scoped playfield styling: `src/features/games/engines`.
- Pure rules/server replay: `src/features/games/lib`, `break-defences`, `actions/game-actions.ts`.
- Existing Supabase repository, regenerated types, additive migration and rollback fixture: `src/features/challenges/repositories`, `src/lib/supabase/database.types.ts`, `supabase/migrations/20261008195014_five_game_arcade_records.sql`, `supabase/tests/game_state.sql`.
- Automated verification: `tests/arcade-logic.test.mjs`, `tests/games-contract.test.mjs`; `npm run verify` now includes them.

No new dependencies. Removed `@monogatari/core`, its unused preparation script/types/licenses and direct esbuild tooling. All five games are in-house. The inspected Memory reference had no reuse license; no code/assets were copied. See `THIRD_PARTY_NOTICES.md`.

The baseline Breakout registry had an achievement/item but no Premium Coupon mapping. GV-036, An Evening, Your Way, supplies the requested locked Premium reward through the existing wallet model.

## Automated and database verification

36 Node tests pass, including:

- All 80 Breakout bricks legitimately cleared by paddle input and independently replayed; circle/brick collision, durability, rebound angles, lives, terminal/restart conditions.
- Mines count, neighbor boundaries, opening safety, bounded logical generation and honest fallback, flood/flags/chords, both outcomes, frozen timer and replay.
- 100 Memory seeds with exactly 36 unique instances/18 pairs; matching/mismatch locks, deadline/background elapsed time, restart, complete input replay and exact 74,999/75,000ms boundary.
- Snake food/growth/body/tail/wall rules, reverse-turn prevention, bounded speed and a legitimate 50-food input simulation/replay.
- 100 seeded 33×33 mazes: connected paths plus actual key-mask door/hazard-safe solvability, all keys required, hazard/wall collision, eight-minute deadline and win/loss replay.
- Five-game registration/order, valid coupon IDs, score/progress/ending reward gates, inventory exclusion of retired records and obtainable remaining archive keys.
- Missing, malformed, oversized and unfinished result transcripts rejected.
- Arcade CSS references only tokens defined by the existing design system; no undefined-color invisible controls.

The live Supabase rollback fixture passes: public-role table/RPC denial, atomic five-kind rewards, failed-grant rollback, duplicate-run idempotence, stale inter-device rejection, higher score/lower successful time/moves, slower/lost/duplicate result protection, legacy Snake compatibility and preservation of previously redeemed coupons. The fixture uses a fresh UUID and ends with ROLLBACK; it leaves no progress.

All three migration filenames match the applied project history. Security advisors report only seven informational deny-all RLS/no-policy findings, intentionally retained for server-only state ([advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy)). Performance advisors report no findings.

Lint (zero warnings), strict TypeScript, formatting, production build and production dependency audit pass. The build produces 78 pages. The full development audit retains a pre-existing braces/Next ESLint advisory with no patched braces version in the registry; no force downgrade was applied.

## Browser verification

The authenticated collection and all five engines launch. Viewport checks covered **375, 390, 430, 768, 1024 and 1440px**, with no page-level horizontal overflow. Browser DOM measurements account for the desktop scrollbar. Memory retains a 6×6 board with minimum measured card width 46.7px at the narrowest tested viewport. Direction buttons measure 48×44px. Mines use 44px magnified cells and contained two-axis panning; optional Fit board is explicitly a smaller overview.

Observed in the local browser:

- Breakout launch, pause/resume, sound toggle, restart and backing-store resize without game reset.
- Mines first reveal/flood, right-click flag, flag-mode toggle, arrow-key focus, restart/timer reset and immediate mine loss with frozen clock.
- Memory generic hidden labels, first flip/countdown, arrow-key focus and the real 75-second timeout with disabled inputs and no deck reveal. A UI-only playthrough reading just legitimately flipped faces also won in 25.8 seconds, 27 attempts (67% accuracy), with all 18 pairs matched.
- Snake start, keyboard input, pause/resume, wall loss, retained result and confirmed replay.
- Maze start, wall blocking, directional buttons/arrows, position update, pause and timer/restart reset.
- Failed persistence leaves gameplay available and completed results retained; retry remains available. The V&G discard dialog focuses Keep result, supports Escape/focus return and requires explicit Discard and replay.
- A retired novel URL redirects to the five-game hub. An unauthenticated request to a private game returns 307 to /access with noindex/security headers.
- Captured browser console has no application errors or warnings.

Wins for all five and Maze loss paths were verified through deterministic full-input simulation/server replay. Memory additionally completed through the browser UI; the other four wins were not manually completed there. SQL reward durability was tested independently of the local browser.

## Explicit limitations and release checks

- Local Supabase credentials were absent. The local UI → Server Action → database-success → refreshed hub/reward flow still needs a configured environment check. Error/retry UI and the live atomic SQL boundary were verified separately. Do not interpret this report as a complete cross-device browser persistence certification.
- Viewport simulation is not real iPhone/Android Safari testing or a measured 60fps guarantee. Test touch drag/swipe, Mines long press/chording/panning, safe areas, orientation changes and sustained gameplay on real devices before promoting the branch.
- Deterministic replay proves a valid game simulation, not human activity. Seeds and timestamp claims originate in the authorized browser; automation and fabricated valid transcripts are possible. This personal site is not a competitive prize platform.
- Unsaved completed results survive retries only while the page remains mounted. Reload/navigation loses them; replay explicitly confirms discarding them.
- Transcript budgets are bounded to prevent excessive server work. Breakout allows 180,000 fixed ticks (~25 active minutes), Snake 30,000 ticks, Mines 8,192 actions, Memory 2,048 flips and Maze its 3,000-tick deadline. Extremely long Breakout/Snake sessions can still play but will not save beyond the budget.
- Mines tries at most 16 logically verified boards, then clearly labels a safe-opening fallback that may require guesses. It never claims every board is no-guess.
- Personal Memory photos remain 18 distinct symbol placeholders. Add real files/canonical metadata to `public/images` / `src/data/media.ts`, then map `image` / `matchingImage` media IDs in `src/data/arcade-memories.ts`. Shared titles keep different photos in a pair recognizable; face images load lazily through next/image.

Keep production credentials unchanged, review the feature branch, configure the same existing server-only environment variables for its preview, and verify cross-device records/rewards before merging.
