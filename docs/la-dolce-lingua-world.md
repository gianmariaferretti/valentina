# La Dolce Lingua World

The World layer is a presentation and discovery experience around the existing original Academy. It does **not** rewrite the 80 published lesson texts, source answers, grading, IDs, or the existing Supabase progress records.

## Current release

- `src/data/italian-world.ts` defines 30 original settings, five recurring characters, deterministic visual assignments for lessons 001–080, and 15 ten-lesson stops. Each published lesson has a setting, character, interactive prop, motion cues, and educational visual metadata. Only stops 01–08 have lessons; stops 09–15 are clearly labelled future chapters.
- `public/images/academy/world-*.webp` contains 30 original scene illustrations. `character-*.webp` contains five transparent illustrated characters; `dolce-lingua-world-atlas.webp` is the original illustrated map. These were generated specifically for this application, then converted/optimized as WebP. There are no copied commercial game sprites, music, or fonts. Each lesson loads only its own backdrop and character. The map loads its own atlas on the Academy landing; all 30 world images are **not** loaded there.
- `/la-dolce-lingua/world/[stop]` is an optional visual entry to each published ten-lesson block. The existing complete curriculum list remains available without using the map.
- `WorldScene` layers the scene, subtle decorative motion, an optional discoverable prop, and a recurring character around the unchanged reader. Interactions never hide instructional text, and reduced-motion preferences disable decorative movement.
- The original server-side `complete_italian_lesson` save remains the source of truth. A completion stamp appears only after that action succeeds. Twelve milestone souvenirs use the existing private `discoveries` table with `discovery_type='item'` and `italian-world:` IDs. The server chooses the milestone from the validated lesson number; the browser cannot grant one by supplying a reward ID. Writes are idempotent. A failed souvenir write does not erase a completed lesson and is retryable by invoking completion again. No migration or new public permission is needed.

## Content gate

Lessons 081–150 are **not published**. The supplied 061–150 JSON was previously audited as incomplete for this Academy: its lesson examples and open activities need editorial review, and the 100/150 exam material lacks complete passages/sections. Adding visual stops does not convert that source into valid lessons. Publish those seven stops only after the source content and answer keys are validated, imported, tested and approved. Do not make inaccessible lessons appear complete merely by changing the route or UI.

## Visual source and replacement

The generated assets are original placeholders, not personal photographs. Replace individual `world-<id>.webp` files or change their registry path once artwork is approved; keep the IDs stable so lesson assignments do not change. Character IDs are `giuseppe`, `giulia`, `marco`, `sofia`, and `pippo`. All image usage goes through `next/image` and the Academy-only local image pattern in `next.config.ts`.

## Persistence and privacy

The single private user's lesson and exercise progress remains in `italian_lesson_progress` and `italian_exercise_results`; collectibles share `discoveries`. All writes are server-side after the signed V&G access check and use only the server Supabase secret. The private collection read degrades to an unavailable notice if Supabase fails; lessons remain readable. No collectible data is stored in localStorage. The Academy route, scene assets, and private data should still be covered by the site's access and deployment protection policies.

## Verification

Run `npm run verify`. `tests/italian-world.test.mjs` checks world count, visual assignments, stop publication gate, and souvenir milestones. For UI QA, inspect the Academy landing, a world stop, and a lesson at 320, 375, 430, 768, and 1440 px, with keyboard focus and reduced motion. End-to-end souvenir persistence requires a configured Supabase project and an authenticated completion of one of the milestone lessons; local development without credentials cannot prove cross-device storage.
