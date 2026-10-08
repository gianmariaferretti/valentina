# V&G — Year One technical report

Reviewed 8 October 2026. This report describes the production foundation after the five-game Arcade overhaul. Detailed executed checks and limitations are in `docs/arcade-qa.md`.

## Architecture

The application uses Next.js 16 App Router, React 19, strict TypeScript, Tailwind CSS 4, Motion, MapLibre GL JS, and Supabase. Server Components compose routes by default; client boundaries are limited to navigation disclosure, forms, reveal interactions, the gallery viewer, the map, and Canvas games.

Responsibilities are separated into:

- `src/app`: routing, metadata, layouts, and route-level loading/error/transition boundaries;
- `src/components`: shared design-system, layout, motion, and UI primitives;
- `src/features`: domain actions, repositories, components, hooks, and types;
- `src/data`: typed static editorial registries;
- `src/lib`: authentication, Supabase, persistence, and shared utilities;
- `src/hooks`: cross-feature client interaction behavior.

Dead prototype-era content models and the unused non-atomic reward mutation path were removed. Shared modal focus behavior and request-memoized persistence reads reduce duplicated logic and work.

## Routes

Public routes are `/` and `/access`. The authenticated `(experience)` group contains `/home`, `/coupons`, `/coupons/[id]`, `/challenges`, `/challenges/[game]`, `/map`, `/map/[place]`, `/open-when`, `/open-when/[slug]`, `/awards`, `/quiz`, `/gallery`, `/achievements`, `/secret`, `/year-two`, and the development review route `/design-system`. Exactly five games are registered: Break My Defences, Relationship Minefield, 365 Memories, Snake and Maze. Retired game URLs redirect to `/challenges`; old database records remain intact.

Navigation comes from `src/data/navigation.ts`; the shell and route group do not need structural changes when a section is added.

## Persistence

Supabase stores user state only: site progress, coupon state, challenge scores, quiz attempts, letter state, achievements, and discoveries. Static stories and definitions remain version-controlled typed data. Repository interfaces isolate feature code from the database provider, and read failure falls back to empty progress without preventing editorial content from rendering.

Coupon redemption and reward-bearing challenge, quiz, letter and V&G game writes use atomic Postgres functions. The original additive games migration extends `challenge_scores` with latest score, start/duration, difficulty, progress, ending, wins/losses, reward IDs and discovered secrets. The server resolves reward eligibility and can atomically grant achievements, coupons, discoveries, secret content and cross-game items. A third additive migration adds minimum successful completion time, fewest successful Memory moves, last result and last-played timestamp. New wrapper RPCs preserve the old atomic functions and row locking. Duplicate/stale/lost/slower results cannot improve these minima. The browser never receives a Supabase secret or direct write capability. Durable UI state is shown only after the server confirms a mutation.

## Security and privacy

- Access codes are read only on the server and compared as fixed-length SHA-256 digests.
- Failed access attempts receive a fixed delay and generic rotating copy.
- Sessions are HMAC-signed, expire after 30 days, and use HTTP-only, SameSite=Strict, Secure-in-production cookies.
- Production requires `AUTH_SECRET`; configure a cryptographically random secret of at least 32 characters. The current remote access validator is preserved; the games expansion does not alter or rotate deployed credentials.
- Private routes and every mutating action recheck the signed session.
- A global lock action clears the session explicitly.
- CSP, `X-Frame-Options`, `nosniff`, `no-referrer`, restrictive Permissions Policy, and header/metadata `noindex` controls are enabled.
- Supabase service credentials remain in server-only modules; RLS is forced and browser roles have no table privileges.

This remains a personal access gate, not identity-grade authentication. Deployment-level access protection and secret rotation are recommended. The authenticated server deterministically replays bounded input transcripts for all five games and derives outcomes/rewards. This validates simulation consistency, not human activity: an authorized browser can generate valid paths, choose seeds or fabricate elapsed-time claims. That is an accepted boundary for the single trusted private user, not a suitable model for competitive prizes.

## Major components

- `SiteHeader`, `ProgressIndicator`, and `SiteFooter` form the authenticated shell.
- `Sticker`, `Tape`, `PaperCard`, `TicketCard`, `Polaroid`, `PostageStamp`, `PassportStamp`, `HandwrittenNote`, and travel ephemera define the shared tactile system.
- `CouponWallet` and `RedemptionControl` provide collectible ticket browsing and confirmed redemption.
- `GameExperience`, `ArcadeStats`, `ArcadeResult`, reward receipts and five dynamically imported engines form the shared Arcade.
- Pure Breakout/Minesweeper/Memory/Snake/Maze domains share deterministic rules with the server transcript verifier.
- Shared Canvas sizing, pointer controls, original Web Audio tones and scoped CSS preserve responsive play without a third-party engine.
- `EuropeMapExperience` and `PlaceMiniMap` provide the MapLibre atlas, accessible destination index, cooperative gestures, deferred detail maps, and complete cleanup.
- `Envelope`, `Letter`, and `LetterExperience` model content-driven opening and reward behavior.
- `AwardRevealCard`, `RelationshipQuiz`, and `GalleryScrapbook` own their distinct ceremony, exam, and editorial scrapbook interactions.

## UX and performance review

The visual system remains restrained ivory, ink, oxblood, taupe, and selective sticker color. Each main feature has its own surface—wallet, arcade, atlas, writing desk, awards stage, exam dossier, and scrapbook—while typography, spacing, motion, and ephemera keep them in one product family. Narrow-screen headline clamps and 44px controls prevent clipping at 320–430px; tablet and desktop grids add hierarchy instead of stretching cards.

Dialogs manage initial focus, Escape, Tab containment, scroll locking, and focus return. Mobile navigation exposes state and current page. Loading and error boundaries retain the archive voice. `prefers-reduced-motion` disables decorative transitions, images use `next/image` with responsive `sizes`, and MapLibre cleanup remains unchanged. Action-game loops stop when paused/completed; Memory/Minesweeper clocks account for background elapsed time. The current Arcade and all five playfields were checked at 375, 390, 430, 768, 1024 and 1440 CSS pixels; see the QA record for browser versus simulation coverage.

## Remaining content placeholders

No major feature placeholder blocks the architecture, but personal editorial content is intentionally unfinished:

- Replace files under `public/images/` and update the canonical records in `src/data/media.ts`.
- Finalize city dates, stories, notes, and media IDs in `src/data/places.ts`.
- Replace placeholder quiz questions and answers in `src/data/quiz-questions.ts`.
- Review coupon terms in `src/data/coupons.ts`, letters in `src/data/open-when.ts`, and award evidence in `src/data/awards.ts`.
- Replace the 18 distinct Memory symbols in `src/data/arcade-memories.ts` with paired canonical media IDs from `src/data/media.ts`; maintain recognizable visual pair identities. No personal photos were invented.
- Keep media IDs stable: Gallery, Map, Awards, Home, and Secret Area share that registry.

All three committed migrations are applied to the existing Supabase project and their filenames match its history. Supabase types were regenerated from the live schema. SQL rollback tests cover game rewards, legacy compatibility, minimum-time/move records, all reward kinds and retry idempotence; user progress is unchanged by tests. Security advisors show only the seven intentional deny-all RLS tables without browser policies; performance advisors show no findings. See [RLS advisor guidance](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Production dependency audit is clean. The full development audit reports a pre-existing braces/Next ESLint dependency advisory; no patched braces release is available in the registry, so Next was not downgraded or force-upgraded. The retired Monogatari integration and its build dependencies were removed; this overhaul adds no dependencies. Before launch, configure server secrets, add real artwork/content, select the final map provider, add platform access protection, and run `npm run verify`.
