# V&G — Year One technical report

Reviewed 8 October 2026. This report describes the production foundation after the V&G Games expansion and engineering review.

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

Public routes are `/` and `/access`. The authenticated `(experience)` group contains `/home`, `/coupons`, `/coupons/[id]`, `/challenges`, `/challenges/[game]`, `/map`, `/map/[place]`, `/open-when`, `/open-when/[slug]`, `/awards`, `/quiz`, `/gallery`, `/achievements`, `/secret`, `/year-two`, and the development review route `/design-system`. Seven primary games are registered in typed data, while `/challenges/snake` and `/challenges/maze` remain supported in a legacy annex.

Navigation comes from `src/data/navigation.ts`; the shell and route group do not need structural changes when a section is added.

## Persistence

Supabase stores user state only: site progress, coupon state, challenge scores, quiz attempts, letter state, achievements, and discoveries. Static stories and definitions remain version-controlled typed data. Repository interfaces isolate feature code from the database provider, and read failure falls back to empty progress without preventing editorial content from rendering.

Coupon redemption and reward-bearing challenge, quiz, letter and V&G game writes use atomic Postgres functions. The additive games migration extends `challenge_scores` with latest score, start/duration, difficulty, progress, ending, wins/losses, reward IDs and discovered secrets. The server resolves reward eligibility and can atomically grant achievements, coupons, discoveries, secret content and cross-game items. The browser never receives a Supabase secret or direct write capability. Durable UI state is shown only after the server confirms a mutation.

## Security and privacy

- Access codes are read only on the server and compared as fixed-length SHA-256 digests.
- Failed access attempts receive a fixed delay and generic rotating copy.
- Sessions are HMAC-signed, expire after 30 days, and use HTTP-only, SameSite=Strict, Secure-in-production cookies.
- Production requires `AUTH_SECRET`; the existing validator accepts 5+ characters. Configure a cryptographically random secret of at least 32 characters. The games expansion does not alter or rotate the deployed access credentials.
- Private routes and every mutating action recheck the signed session.
- A global lock action clears the session explicitly.
- CSP, `X-Frame-Options`, `nosniff`, `no-referrer`, restrictive Permissions Policy, and header/metadata `noindex` controls are enabled.
- Supabase service credentials remain in server-only modules; RLS is forced and browser roles have no table privileges.

This remains a personal access gate, not identity-grade authentication. Deployment-level access protection and secret rotation are recommended. Arcade scores originate in a client-side game and receive server-side range/step/session validation; a hostile authorized browser could still forge a score. That is an accepted boundary for the single trusted private user, not a suitable model for competitive prizes.

## Major components

- `SiteHeader`, `ProgressIndicator`, and `SiteFooter` form the authenticated shell.
- `Sticker`, `Tape`, `PaperCard`, `TicketCard`, `Polaroid`, `PostageStamp`, `PassportStamp`, `HandwrittenNote`, and travel ephemera define the shared tactile system.
- `CouponWallet` and `RedemptionControl` provide collectible ticket browsing and confirmed redemption.
- `GameExperience`, `GameHud`, outcome/reward primitives and seven dynamically imported engines form the shared V&G Games product surface.
- `ChallengeArcade`, `SnakeGame`, and `MazeGame` preserve the original keyboard/touch challenges in the legacy annex.
- `EuropeMapExperience` and `PlaceMiniMap` provide the MapLibre atlas, accessible destination index, cooperative gestures, deferred detail maps, and complete cleanup.
- `Envelope`, `Letter`, and `LetterExperience` model content-driven opening and reward behavior.
- `AwardRevealCard`, `RelationshipQuiz`, and `GalleryScrapbook` own their distinct ceremony, exam, and editorial scrapbook interactions.

## UX and performance review

The visual system remains restrained ivory, ink, oxblood, taupe, and selective sticker color. Each main feature has its own surface—wallet, arcade, atlas, writing desk, awards stage, exam dossier, and scrapbook—while typography, spacing, motion, and ephemera keep them in one product family. Narrow-screen headline clamps and 44px controls prevent clipping at 320–430px; tablet and desktop grids add hierarchy instead of stretching cards.

Dialogs manage initial focus, Escape, Tab containment, scroll locking, and focus return. Mobile navigation exposes state and current page. Loading and error boundaries retain the archive voice. `prefers-reduced-motion` disables decorative transitions, images use `next/image` with responsive `sizes`, and MapLibre/Canvas work is scoped to when it is visible or running. The games collection and all seven running engines were checked without horizontal overflow at 320, 375, 430, 768 and 1440 CSS pixels.

## Remaining content placeholders

No major feature placeholder blocks the architecture, but personal editorial content is intentionally unfinished:

- Replace files under `public/images/` and update the canonical records in `src/data/media.ts`.
- Finalize city dates, stories, notes, and media IDs in `src/data/places.ts`.
- Replace placeholder quiz questions and answers in `src/data/quiz-questions.ts`.
- Review coupon terms in `src/data/coupons.ts`, letters in `src/data/open-when.ts`, and award evidence in `src/data/awards.ts`.
- Replace the explicitly marked Year One timeline/scenario copy in `src/data/game-content.ts` and map game media slots in `src/data/game-media.ts` to real assets in the canonical `src/data/media.ts` registry.
- Keep media IDs stable: Gallery, Map, Awards, Home, and Secret Area share that registry.

Before production launch, apply the committed Supabase migration, configure all server secrets, select the final map provider, add platform access protection, and run `npm run verify`.
