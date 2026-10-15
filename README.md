# V&G — Year One

A private, interactive first-anniversary experience created by Gianmaria for Valentina. This repository is the production foundation for the application; the previous single-file prototype has intentionally been removed.

## Stack

- Next.js 16 with the App Router and React 19
- TypeScript in strict mode
- Tailwind CSS 4
- Motion for React for focused interface motion
- Lucide icons
- MapLibre GL JS for WebGL geographic maps
- Supabase Postgres for private cross-device progress
- ESLint and Prettier

## Getting started

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Set `SITE_ACCESS_CODE`, a long random `AUTH_SECRET`, and the server-only Supabase variables documented below in `.env.local`. The access code has no client-side or development fallback: verification remains unavailable until `SITE_ACCESS_CODE` is configured. Production also requires `AUTH_SECRET` to sign sessions.

Use Node 22.18+ (Node 24 recommended). Games use native TypeScript, React and Canvas; no external game engine preparation is required.

Run the complete local quality gate with:

```bash
npm run verify
```

## Architecture

```text
src/
├── app/                 # Routes, route groups, layouts, and global styles
│   ├── (experience)/    # Authenticated application shell and feature routes
│   └── access/          # Public access challenge
├── components/
│   ├── design-system/   # Stickers, paper, tickets, polaroids, and ephemera
│   ├── layout/          # Navigation, shell, and footer
│   ├── motion/          # Small client-only animation boundaries
│   └── ui/              # Reusable visual primitives
├── data/                # Typed, static content registries
├── features/            # Feature-owned actions, components, and domain logic
├── hooks/               # Reusable client hooks
├── lib/                 # Auth, persistence contracts, and shared utilities
├── types/               # Cross-feature TypeScript models
└── assets/              # Source-controlled asset notes and future originals
```

Route groups keep public entry pages separate from the authenticated experience without changing public URLs. Server Components are the default. Client Components are limited to interactive feature surfaces (including games), mobile navigation, and helpers that require browser APIs.

### Routes

The current route foundation includes:

- `/`, `/access`, `/home`
- `/coupons`, `/coupons/[id]`
- `/challenges` and five routes: `/challenges/break-defences`, `/challenges/relationship-minefield`, `/challenges/365-memories`, `/challenges/snake`, `/challenges/maze`
- `/map`, `/map/[place]`
- `/open-when`, `/open-when/[slug]`
- `/awards`, `/quiz`, `/gallery`, `/achievements`, `/secret`, `/year-two`
- `/design-system` for development review of visual tokens and components
- `/italian-corner` with separate challenge, Gianmaria exam and Academy routes
- `/la-dolce-lingua`, `/la-dolce-lingua/world/[stop]`, and `/la-dolce-lingua/lessons/[number]` for the private, original 80-lesson Academy and its visual journey
- `/relationship-contract` and its authenticated PDF endpoint for the commemorative treaty

### The Relationship Contract™

`/relationship-contract` is an English, editorial keepsake with eight titles and 40 articles. The source text lives in `src/data/relationship-contract.ts`; the sealed Article 41 lives in the server-only `src/features/relationship-contract/lib/document.ts` and is shown only after both signatures. The document states explicitly that it has **no legal effect** and creates no marriage or engagement promise. The relationship anniversary remains 31 October 2025; the commemorative agreement is dated 31 October 2026 with a five-year term. Changes to signed wording require a new `treatyVersion`, not an in-place edit of the archived snapshot.

Valentina signs a real pointer/keyboard-accessible canvas after confirming review. Before countersignature she can withdraw. Gianmaria must independently unlock his signing desk with `CONTRACT_ADMIN_PASSPHRASE` (at least 24 characters, distinct from `SITE_ACCESS_CODE`); the resulting HTTP-only, one-hour cookie is bound to the active V&G access session and the configured passphrase. Failed administrator attempts are limited in Postgres to five per 15-minute window per HMAC-obscured request fingerprint. If the passphrase is absent, countersignature is deliberately unavailable. Configure it only as a server-side Production secret in Vercel and never in a `NEXT_PUBLIC_` variable. Rotate it in Vercel to invalidate outstanding administrator cookies.

The additive `supabase/migrations/20261014231343_relationship_contract.sql` migration creates three isolated, service-role-only tables: `relationship_contracts` (content snapshot, hash, status, reward request), `relationship_contract_signatures` (PNG canvas strokes and timestamps), and `relationship_contract_admin_attempts` (rate limiting). Atomic SQL functions sign, withdraw, claim the reward request, and register administrator attempts; browser roles have no table/function access and RLS is forced. No existing progress, coupon, media or Academy table is altered. This migration was applied to the connected production project on 14 October 2026 and verified with fully rolled-back signature/withdraw/reward transactions. **Do not run `supabase db push` against production:** older unrelated migrations remain pending.

The PDF endpoint `/api/relationship-contract/pdf` requires the signed V&G session and returns a no-store unsigned review copy or, after execution, a certificate with both archived signatures, real timestamps, content hash and the sealed article. The endpoint uses `pdf-lib`; see `THIRD_PARTY_NOTICES.md`. A reward claim records a request for Gianmaria, not an automatic coupon grant. There is no client-side or localStorage signature persistence. Run `npm run test:contract` to check the article set and sealed-content separation.

### Italian Corner and La Dolce Lingua

`/italian-corner` adds two **new** server-scored, ten-minute examinations without changing the historical `/quiz`. The Italian Challenge selects 15 balanced A2/B1 questions from a 60-question server-only bank (three attempts, pass at 12); the Gianmaria Exam uses the owner's exact ten personal questions (two attempts, pass at eight). Supabase functions atomically reserve attempts, enforce the timer and attempt limits, and grant each distinct coupon/discovery once. Answer keys never enter the pre-submit client bundle. GV-037 and GV-038 are intentionally **sealed, unredeemable reward placeholders** until Gianmaria supplies actual prizes and terms; the app does not invent or silently redeem them.

`/la-dolce-lingua` is the canonical private Academy: 80 lessons in four volumes, numbered 001–080. Every lesson is extracted paragraph-for-paragraph from the four owner-provided Word manuals and kept under `src/content/italian/original-lessons/lessons/`; `index.json` drives the catalog. The first 50 lessons follow the sources' A2 sequence (lesson 050 is its final exam); 051–080 follow the B1 sequence. The reader presents source sections progressively, keeps the original Spanish notes and teacher corrections, and turns unambiguous source-key activities into server-checked multiple choice, fill-in or word-order tasks. Open writing, corrections and transformations are saved for self-review without inventing a grade. The main V&G Home links to both this Academy and the unchanged boyfriend quiz. The Academy landing has a separate Italian editorial identity: the original generated Florence illustration under `public/images/academy/`, a language passport, and four volume portals. The World addition introduces 30 original illustrated settings, five recurring characters, an optional 15-stop illustrated map, and 12 souvenir milestones stored in the existing Supabase `discoveries` table. The first eight stops link to the 80 published lessons; the seven future stops are visibly unpublished and cannot be opened. Lesson headers surface the original objective, and the notebook sidebar distinguishes objectively gradable responses from self-review. See [`docs/la-dolce-lingua-world.md`](docs/la-dolce-lingua-world.md) for scope and asset notes.

Each lesson also has an optional ten-activity supplemental atelier (800 activities across 80 lessons) derived deterministically from its own Italian examples, Spanish comparisons, original rules and teacher explanations. Depending on the source material, formats include recall flashcards, contextual completions, word ordering, multiple choice, four-pair matching and guided translation. The Volume IV lessons use rule/contrast and teacher-feedback recall instead of fabricated translations. Objective answers are recomputed from the original source on the server, never shipped before submission. Flashcards are self-rated and do not affect the grade. Guided translation compares against the source's example sentence; an alternative grammatically correct translation may need manual review. The atelier reuses `italian_exercise_results` and `record_italian_exercise`, with stable `supp-01`–`supp-10` IDs; no database migration or change to the original manuals is needed. These are new interactive formats based on source content, not 800 separately authored new sentences. The original grammatical tables and explanation text remain in the lesson reader.

The earlier `/italian-corner/academy` and lesson URLs redirect to the new canonical route so old links cannot show unpublished slots. The separate development fixture, JSON schema and level-exam framework remain available for future content work; see [`docs/italian-academy-content-guide.md`](docs/italian-academy-content-guide.md). The original “Unavailable” symptom was caused by the old loader looking exclusively for published JSON in the A2/B1/B2 folders while the imported material existed only as plain-text volume files. Removing the label would not have made those lessons load. The new loader reads 80 generated, validated JSON lessons directly and the private route resolves each one.

To re-import or independently verify the content against the four original `.docx` files, run the bundled Python runtime with `scripts/import-dolce-lingua.py [--verify] <volume-1.docx> <volume-2.docx> <volume-3.docx> <volume-4.docx>`. `--verify` is read-only. The checked-in import includes all 3,418 Word paragraphs: 3,344 inside lessons plus 74 front-matter paragraphs, in exactly the same order and text, with SHA-256 source checksums. `tests/italian-original-academy.test.mjs` checks numbering, continuity, progressive content and answer-key isolation. Source ambiguities are recorded in [`docs/la-dolce-lingua-source-review.md`](docs/la-dolce-lingua-source-review.md), not silently corrected.

Lesson visits, responses and completion reuse the existing `italian_lesson_progress`, `italian_exercise_results`, `record_italian_exercise` and `complete_italian_lesson` persistence design. Server Actions validate the signed V&G session and lesson/exercise IDs, and use only the server-side Supabase context. Client code receives neither the service key nor solutions before a submitted response. If Supabase is unavailable, lesson content remains readable and unsaved actions report failure. There is no localStorage progress fallback, so a failed save is never presented as durable.

The additive migration [`supabase/migrations/20261014171835_italian_corner_state.sql`](supabase/migrations/20261014171835_italian_corner_state.sql) was applied to the existing production Supabase project on 14 October 2026 after explicit owner approval. Supabase assigned migration version `20261014171835`, so the source file was renamed from `20261013225943_italian_corner_state.sql` without changing its SQL. The five new tables and six server-only functions were verified live; an exercise-save and lesson-completion transaction was rolled back after checks, leaving the existing data counts unchanged. A real authenticated browser save, refresh, and second-device check should still be recorded before claiming cross-device Academy verification.

The former branch preview lacked Supabase credentials and therefore could only render editorial content and placeholders. Production is configured with server-only Supabase variables; do not copy its secret key into an untrusted Preview deployment. Deployment notes and post-login verification results must describe the actual released build, not infer success from a READY preview.

Navigation is driven by `src/data/navigation.ts`, so future sections can be added without rewriting the shell.

### Access and privacy

The access code is verified in a Server Action and never shipped in the client bundle. Successful verification creates a 30-day HTTP-only, secure-in-production, same-site session cookie signed with HMAC. The `(experience)` layout verifies that cookie on the server before rendering private routes, and the global navigation provides an explicit **Lock private archive** action that clears it.

The first complete journey is `/` → `/access` → `/home`. The landing page intentionally omits application navigation, the access screen returns rotating server-authored rejection messages, and successful verification briefly confirms the identity before opening the authenticated dashboard. The private shell includes a compact global progress indicator backed by persisted coupon and achievement state.

This is an application-level privacy gate, not a replacement for deployment access controls. For a truly private deployment, also configure platform-level protection and rotate secrets before launch.

Every response also sends a restrictive privacy/security baseline: CSP, clickjacking protection, MIME sniffing protection, a no-referrer policy, disabled camera/microphone/geolocation/payment permissions, and both metadata- and header-level `noindex` directives. The CSP permits HTTPS image/map connections because the MapLibre provider is deployment-configurable; narrow those origins when a final provider is fixed.

### Persistence and Supabase

Persistent state is stored in Supabase Postgres through feature-owned repository contracts. Supabase clients exist only under `src/lib/supabase` and server-only repository modules; no database client, project secret, raw state mutation, or answer key is included in the browser bundle. The existing signed access session remains the application authorization boundary and maps every authorized request to the single configured `SUPABASE_PRIMARY_USER_ID`. Supabase Auth and multi-user social models are intentionally not part of this private site.

The versioned migration at `supabase/migrations/20261007225657_create_private_progress.sql` creates only user-state tables:

| Table              | Stored state                                                                                       |
| ------------------ | -------------------------------------------------------------------------------------------------- |
| `site_progress`    | Global memory count and last persisted activity                                                    |
| `coupon_state`     | Coupon unlock and redemption timestamps                                                            |
| `challenge_scores` | Attempts, scores, timing, difficulty, endings, wins/losses, progress, rewards and secrets per game |
| `quiz_attempts`    | Active, completed, and abandoned attempts with server-checked answers                              |
| `letter_state`     | Opened envelope timestamps                                                                         |
| `achievements`     | Idempotent achievement unlocks                                                                     |
| `discoveries`      | Reward, coupon, challenge, memory, and future secret discoveries                                   |

Every table has Row Level Security enabled and public `anon`/`authenticated` privileges revoked. Only the server secret’s `service_role` can access state. Multi-table mutations for challenge rewards, letter rewards, quiz completion, and coupon redemption run in Postgres functions so related state is committed atomically. Static definitions—coupons, challenges, letters, cities, awards, quiz questions, and reward copy—remain typed application data under `src/data`; Supabase is not used as a CMS.

Read paths fail closed to an empty state and log a server-side diagnostic, so editorial pages still render when Supabase is missing or temporarily unavailable. Mutations are not optimistically marked complete: the interface updates durable state only after the Server Action confirms the database write, and returns a retryable message when persistence fails.

Repository reads are request-memoized to avoid duplicate state queries when both the application shell and a route need the same progress. Reward-bearing writes remain atomic database functions; unused non-atomic mutation paths have been removed.

#### Supabase setup

1. Create a Supabase project and choose one stable UUID for Valentina’s state. It does not need to reference `auth.users`; it is the private application record key.
2. For a **new, empty project only**, install or invoke the Supabase CLI, link the project, inspect its migration plan, and apply the committed migrations:

   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase migration list
   npx supabase db push
   ```

   Do **not** run `db push` against the existing production project: two unrelated older migrations remain pending there. Apply any future production migration only after reviewing its exact SQL and obtaining owner approval.

3. Copy `.env.example` to `.env.local` and set:

   ```text
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   SUPABASE_PRIMARY_USER_ID=your-stable-uuid
   ```

   `SUPABASE_SECRET_KEY` is preferred for current Supabase projects. `SUPABASE_SERVICE_ROLE_KEY` remains supported as a legacy server-only alternative. Never prefix either secret with `NEXT_PUBLIC_`, commit it, print it, or pass it to a Client Component. The application does not require a publishable/anon key because all progress access occurs after the private session check on the server.

4. Configure the same values in the deployment provider’s encrypted environment settings, then restart or redeploy the application. Visit `/coupons`, `/challenges`, `/quiz`, and `/open-when` from two devices to confirm the shared state.

Database changes should be added as new migration files; do not edit the production schema manually after migration tracking begins. Before any future `supabase db push`, inspect `supabase migration list`: the Italian migration was applied after two older repository migrations (`20261008223505` and `20261010124951`) that are still pending in production. Do not blindly push all pending files or assume timestamp order matches live history. The additive `20261008152552_expand_vg_games_state.sql` migration extends the existing challenge table and adds atomic `begin_game_run` / `finish_game_run` functions; it does not create a competing game-state store. See the [Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations) and [server secret guidance](https://supabase.com/docs/guides/getting-started/api-keys).

### V&G Arcade

The collection contains exactly five working games: **Break My Defences**, **Relationship Minefield**, **365 Memories**, **Snake**, and **Maze**, in that order. The hub counts only those definitions toward `X / 5`. Retired game URLs redirect to the hub; historical Supabase records and the original migrations remain intact.

`src/data/games.ts` owns identity, instructions, legal outcomes and rewards. `src/data/arcade-config.ts` owns the single fixed mode per game. Pure TypeScript domains under `src/features/games/lib` and `break-defences` are independent of presentation and reused by the server verifier. `GameExperience` dynamically imports only the selected engine, registers an attempt, provides shared sound/restart/loading/persistence controls, and displays confirmed reward receipts.

| Game                   | Rules and controls                                                                                                                                                                                                  | Durable reward                                                                   |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Break My Defences      | One wall of 90 unlabeled standard/reinforced/armoured bricks; 58px logical paddle, three lives, bounded accelerating 120Hz physics. Mouse, arrows and touch drag. No boss, power-ups or extra lives.                | GV-036 on victory; also GV-031 only when replay proves zero lost lives.          |
| Relationship Minefield | 16×16, 55 mines, safe first-click neighborhood; recursive reveal, flags and chording. Right-click, long press, flag toggle and keyboard. Bounded generation; the labeled safe-opening fallback may require guesses. | Achievement only. GV-034 is retired, not deleted from historical database state. |
| 365 Memories           | 6×6, 18 pairs, 75 real elapsed seconds from the first flip. Fisher–Yates shuffle, finite input states, no preview/hints/pause. Hidden labels do not disclose identities.                                            | Configured coupon, achievement and archive key.                                  |
| Snake                  | Seeded 24×24 grid, 75 foods, one life; static/moving obstacles, additional blocks every 15 foods, accelerating fixed steps. Keyboard, swipe and direction pad.                                                      | GV-035 and the 75-food achievement after verified victory.                       |
| Maze                   | Seeded 45×45 DFS maze, five matching keys/gates, limited visibility, fog, five moving hazards and a 300-second active timer. Key-mask BFS rejects impossible/over-time candidates before presentation.              | GV-026 Weekend Getaway and the Wayfinder achievement.                            |

Snake keeps historical persistence units (10 points per food); the new target is 750 points/75 foods. Historical best scores, 50-food achievements and already earned/redeemed coupons remain unchanged. Snake's reserved closed corridor guarantees a reachable food circuit at every required body length. Hazards occupy shortcuts, never that corridor; new blocks cannot materialize under food/body or next to the head. Maze rejects candidates whose safe five-key route exceeds its deadline, retries a bounded deterministic sequence, and has a prevalidated procedural fallback. The requested 1%/0.5% human success rates are **design aspirations, not measured results or random reward probabilities**.

Breakout, Snake and Maze pause on request or when the page is hidden. **Memory and Minesweeper cannot pause**: their monotonic clocks include background time, with input-time checks preventing late moves. Result clocks freeze immediately. Canvas backing stores resize without changing game state; loops, timers, input listeners, audio contexts and observers are cleaned up on navigation. Reduced motion removes decorative/interpolation effects, not game difficulty.

The original rules and Web Audio tones are in-house. No new dependency or commercial artwork was added. The memory reference repository was inspected, but no license permitting reuse was found; none of its code or assets was copied. Monogatari and its now-unused build integration were removed with the retired novel. See `THIRD_PARTY_NOTICES.md`.

#### Trusted results, retries and records

Every authenticated finish action replays a bounded seeded input transcript rather than trusting a client victory boolean, score or reward ID. Breakout reconstructs every collision; Minesweeper reconstructs board/actions; Memory reconstructs flips and times; Snake reconstructs ticks/food; Maze reconstructs movement, keys, hazards and exit. Invalid, unfinished or contradictory paths receive no write or reward.

This is **consistency verification, not authoritative anti-cheat**. An authorized browser can construct a valid simulated path, choose a seed or fabricate wall-clock timestamps. Minesweeper completion time is browser-reported and bounded; Memory timestamps prove consistency with its deadline, not human interaction. Do not use these games for competitive or financial prizes.

Server-issued run UUIDs, active-run row locking and atomic finish functions reject superseded attempts and make retries idempotent. A failed save retains the complete result/transcript in memory with **Retry saving result**; replaying requires explicit confirmation before discarding an unsaved result. Leaving/reloading the page loses that unsaved in-memory result. Rewards, completion counters and the durable hub update only after confirmed writes. There is no localStorage progress store and no client coupon mutation.

The additive `20261008195014_five_game_arcade_records.sql` migration adds only `best_time_ms`, `fewest_moves`, `last_result` and `last_played_at` to the existing `challenge_scores` table. `begin_arcade_run` / `finish_arcade_run` preserve the earlier atomic reward functions while keeping minimum successful time/moves and maximum score. Duplicate/lost/slower results cannot overwrite better records; existing coupon redemption timestamps remain untouched. The first three migrations are applied to the existing project. `20261008223505_grant_spicy_archive_reward.sql` and `20261010124951_guard_arcade_coupon_grants.sql` are separately reviewed, additive release requirements, **not automatically applied to production**. The latter checks new game/coupon mappings and blocks new GV-034 grants while preserving history. Browser roles remain denied; only server credentials can call these functions.

The existing record still supports gameId, attempts, startedAt, completedAt, bestScore, latestScore, duration, difficulty, progress, ending, wins, losses, unlockedRewards and discoveredSecrets. The new optional fields supplement it rather than creating a parallel store.

`/secret` is now **The Spicy Archive**, one controlled seven-stage experience with explicit adult self-declaration, a sealed envelope and a ten-second horizontal image reveal. Game keys and historical discoveries remain untouched, but the old two-key inventory is no longer a separate Secret Area interface. GV-032 unlocks only after the complete reveal, through an authenticated, atomic server reward grant.

Run `npm run test:games` for deterministic game, transcript and reward tests. Run `supabase/tests/game_state.sql` after migrations for ephemeral, fully rolled-back tests of atomic grants, stale runs, min/max records, duplicate retries, access denial and legacy compatibility. The Server Action body limit is 2MB to accommodate bounded Breakout transcripts (180,000 physics ticks, approximately 25 active minutes). Longer runs remain playable but cannot be verified/saved; other transcript budgets are documented in the verifier.

See [Arcade QA and limitations](docs/arcade-qa.md) for executed checks and what still requires a real device or configured local database. The relationship began **31 October 2025**.

Open When content remains in the typed `src/data/open-when.ts` registry, while rewards live in `src/data/rewards.ts`. The discriminated reward model can accept additional reward kinds without coupling them to `Envelope`, `Letter`, or route components.

The V&G Awards are configured entirely in `src/data/awards.ts`. Each typed entry owns its category, nominees, winner, copy, media, optional evidence, sticker treatment, prize, and presentation size. The route remains a Server Component while each ceremony envelope uses a small Client Component for the nominee and winner reveal sequence. Ceremony styling is scoped to the feature with a CSS Module.

The relationship quiz keeps its replaceable question bank in `src/data/quiz-questions.ts` and its result bands and reward thresholds in `src/data/quiz.ts`. Correct answer keys stay in a server-only module. Each answer is validated in sequence by a Server Action against the active Supabase attempt; the client receives only the selected answer result. Completed attempts determine the persisted best score, while achievement and reward inserts are idempotent.

### Geographic maps

`/map` and `/map/[place]` use MapLibre GL JS with real vector map data. The typed destination registry in `src/data/places.ts` stores coordinates in MapLibre’s `[longitude, latitude]` order alongside editorial content, image placeholders, sticker metadata, notes, and a deliberately non-chronological atlas order.

The default style is OpenFreeMap Liberty:

```text
https://tiles.openfreemap.org/styles/liberty
```

OpenFreeMap’s public service permits commercial usage, does not require an API key, and includes the required OpenStreetMap/OpenMapTiles attribution in the style; the application keeps MapLibre’s attribution control visible. The public service has no SLA. For a deployment that requires contracted availability or self-hosted tiles, set `NEXT_PUBLIC_MAP_STYLE_URL` to a compatible MapLibre Style Specification URL and verify that provider’s access, billing, attribution, privacy, and allowed-origin requirements.

The style URL is public browser configuration, not a secret. Map requests are sent directly from the visitor’s browser to the configured provider. A strict Content Security Policy must allow the configured style/tile/font hosts and MapLibre’s worker/image requirements. The MapLibre worker is bundled as a same-origin hashed asset using the official Next.js setup.

Map interaction is paired with keyboard-accessible marker buttons, a complete destination index, direct memory links, and an external OpenStreetMap link on each location page. Cooperative touch gestures prevent the embedded map from trapping mobile page scrolling.

Location mini-maps initialize only when they approach the viewport. All MapLibre markers, observers, event handlers, and map instances are removed during route cleanup.

### Content model

Placeholder content lives in typed registries under `src/data`. Feature work should extend those models or move a domain into its own `features/<feature>` package; route files should remain thin composition layers.

### Visual system

The reusable primitives under `src/components/design-system` combine editorial typography with tactile travel-journal objects. `Sticker` provides deterministic variants, rotations, sizes, and position presets; supporting components cover tape, paper surfaces, tickets, polaroids, postage, passport stamps, luggage tags, handwriting, arrows, and small doodles. The `/design-system` route is the canonical visual review surface.

All photographic metadata lives in the typed `src/data/media.ts` registry. Gallery, Map, Awards and Memory resolve canonical IDs without duplicating dimensions, alternative text, captions, dates or locations. All 26 personal image URLs now resolve to `/api/private-media/[id]`; `src/data/private-media-manifest.json` is the server's explicit object allowlist. Downloads require the existing signed session, a private `vg-private-photos` bucket and server-only credentials. Browser and both CDN caches receive `private, no-store`/`no-store`. The shared `MediaImage` wrapper deliberately uses `next/image` **unoptimized** for private URLs, retains lazy loading and shows a non-sensitive placeholder on failure. Public optimization of API/travel URLs is explicitly denied.

The originals are optimized, orientation-corrected WebPs (maximum 1600px, no EXIF/GPS/XMP, 5.58MB total). On 14 October 2026 all 26 were uploaded to the private Supabase bucket, authenticated downloads matched their local SHA-256 hashes, anonymous Storage/application requests were denied, and the originals were moved to an ignored local backup outside `public/`. This branch no longer ships them as public assets; `src/proxy.ts` also returns **410** for legacy URLs. Historical public Git blobs and older Vercel deployments remain exposed until separately remediated. Keep the recoverable local backup until a production release is verified. See [private photo migration and release checklist](docs/follow-up-completion.md).

The Gallery displays 25 photographs in a deliberately interleaved editorial order. `paris-quiet-frame` remains **map-only**, excluded from Gallery and Memory, and now uses authenticated image delivery too. `paris-bite` remains the owner-confirmed Best Photo image; Best Trip uses the Accettura landscape. All 18 Memory identities/order and pairs remain stable; every face uses the private gateway, with no hidden-card downloads. Hamburg/Amalfi Coast retain honest placeholders. Eight unconfirmed photographs remain Gallery-only; no destination or capture date has been invented.

`/gallery` renders that media registry as an asymmetric editorial scrapbook with data-driven category and favourites filters, polaroid and photo-strip treatments, deterministic annotations, and an accessible keyboard-controlled lightbox. Gallery presentation metadata remains optional, so shared media can participate in Map or Awards without appearing in the scrapbook.

## Quality and accessibility

The authenticated route group has branded loading, error, and transition boundaries. Disclosure navigation and dialogs support Escape, focus management, focus return, and accessible current-page state. The gallery viewer adds trapped focus and arrow-key navigation; game canvases support keyboard, swipe, and on-screen controls. Action games pause when hidden, while timed Memory/Minesweeper retain real elapsed time. Canvas animation frames stop when a game is paused or completed.

Layout sizing is mobile-first and reviewed at 320, 375, 430, 768, and 1440 CSS pixels. Headline clamps, 44px minimum interactive targets, non-obstructive stickers, cooperative map gestures, and `prefers-reduced-motion` handling protect the experience across those widths.

The current engineering review and handoff inventory are documented in [`docs/technical-report.md`](docs/technical-report.md).

## Replacing placeholders

### Private Spicy Archive image and reward setup

The final archive image is **not** part of the public media registry. Leave both `SPICY_ARCHIVE_BUCKET` and `SPICY_ARCHIVE_OBJECT` unset for the original, non-sensitive envelope illustration. To supply the photograph later:

1. Create a **private** Supabase Storage bucket. Keep it private and do not grant browser download policies.
2. Upload a JPEG, PNG, WebP or AVIF prepared for display, preferably under 2MB (the endpoint rejects files above 12MB). Remove sensitive EXIF/GPS metadata first.
3. Set `SPICY_ARCHIVE_BUCKET`, `SPICY_ARCHIVE_OBJECT` and descriptive `SPICY_ARCHIVE_IMAGE_ALT` in server-only environment configuration. Never prefix them with `NEXT_PUBLIC_`, put the photograph in `public/`, or embed its Storage URL in client code.
4. Apply `20261008223505_grant_spicy_archive_reward.sql` to a local/preview database before testing the reward. This additive migration is **not automatically applied to production**. Review it before a separately authorized production release.

`/api/secret-image` verifies the existing access session and a signed, session-bound archive proof on every request. It refuses public buckets, streams the image without a signed/public Storage URL, and sends private/no-store headers for browser and CDN caches. The image uses `next/image` with `unoptimized` intentionally: the shared image optimizer cannot safely forward this authorization or cache private media. No image request occurs before the seal is opened. A private image already delivered to an authorized visitor cannot be made uncopyable.

Archive progress is ephemeral: an HTTP-only session cookie contains the signed stage and explicit adult confirmation, expires logically after 30 minutes, and is cleared on exit. Refreshing starts the visible sequence again; no date of birth or identity document is stored. Reduced motion uses a 700ms non-flashing reveal. The durable completion is stored only in the existing `coupon_state` and `discoveries` tables through `grant_experience_coupon`; retries never redeem a coupon or change an existing redemption.

### Private Collection: requests arranged in person

Two seconds after the final archive reveal, **WANTED SOMETHING ACTUALLY SPICY?** opens a lazy-loaded Private Collection, without leaving the archive's accessible modal. A confidential product presentation offers **PAY €100** or **EXCHANGE 10 PHOTOS FOR 1**, displaying **10 PHOTOS : 1 PHOTO**.

This is an invitation to arrange the purchase/exchange directly with Gianmaria, **not an integrated payment service**. The checkout's contact and card fields are read-only display elements, not HTML inputs: no card number, CVV, expiry, email or other personal data can be typed, pasted, autofilled, submitted or stored. A payment request ends at **AWAITING PAYMENT**; an exchange ends at **AGREEMENT CONFIRMED**. Neither sends an email, notifies Gianmaria, initiates delivery, uploads photographs or creates a durable order. The player must contact him personally. No uploads, exchange bucket, new database table, payment dependency or environment variable is needed.

Opening the collection and confirming either choice use authenticated Server Actions. Every request rechecks the existing session-bound archive proof, adult confirmation, successful image service, reveal duration and expiry. The server accepts only an allowlisted intent, never contact/card/media data. Confirmation views are ephemeral acknowledgements, reset when returning to the collection or restarting the archive. **GV-032 remains independent of both choices**: its existing atomic completion grant runs immediately after the reveal, even if the collection is never opened. The collection also remains available if saving that coupon temporarily fails; it cannot claim that the reward was saved.

Content is in `src/data/private-collection.ts`; UI, domain guards and actions live under `src/features/secret/`. See [the Private Collection verification report](docs/private-collection-report.md). No automatic merge or deployment is part of this implementation.

See [the implementation and QA report](docs/spicy-archive-report.md) for photo availability, award changes, testing evidence and remaining setup.

Gianmaria can finish the private content without changing presentation components:

| Content                                                       | Edit here                                                                                |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Private photograph objects and shared metadata                | Private Supabase Storage; `src/data/private-media-manifest.json` and `src/data/media.ts` |
| City stories, dates, notes, coordinates, and image references | `src/data/places.ts`                                                                     |
| Coupon copy, terms, rarity, and unlock configuration          | `src/data/coupons.ts`                                                                    |
| Open When letters                                             | `src/data/open-when.ts`                                                                  |
| Award nominees, winners, evidence, and prizes                 | `src/data/awards.ts`                                                                     |
| Personal quiz prompts, answers, and feedback                  | `src/data/quiz-questions.ts`                                                             |
| Quiz thresholds and rewards                                   | `src/data/quiz.ts` and `src/data/rewards.ts`                                             |
| Game rules, thresholds and rewards                            | `src/data/games.ts`                                                                      |
| Fixed Arcade settings                                         | `src/data/arcade-config.ts`                                                              |
| 18 memory identities and paired photograph references         | `src/data/arcade-memories.ts` → canonical `src/data/media.ts`                            |

Keep the media IDs stable when replacing placeholders so Map, Awards, Gallery, Home, and Secret Area continue to share the same records.

## Product direction

The visual system is editorial and warm rather than Valentine-themed: parchment neutrals, oxblood accents, ink typography, restrained ornament, and dry microcopy. Routes that still use placeholders are structured so real memories, photographs, and final interactions can be added deliberately in later iterations.
