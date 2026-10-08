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
npm install
cp .env.example .env.local
npm run dev
```

Set `SITE_ACCESS_CODE`, a long random `AUTH_SECRET`, and the server-only Supabase variables documented below in `.env.local`. The access code has no client-side or development fallback: verification remains unavailable until `SITE_ACCESS_CODE` is configured. Production also requires `AUTH_SECRET` to sign sessions.

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

Route groups keep public entry pages separate from the authenticated experience without changing public URLs. Server Components are the default. Client Components are limited to the access form, mobile navigation, and motion/persistence helpers that require browser APIs.

### Routes

The current route foundation includes:

- `/`, `/access`, `/home`
- `/coupons`, `/coupons/[id]`
- `/challenges`, `/challenges/snake`, `/challenges/maze`, `/challenges/[game]`
- `/map`, `/map/[place]`
- `/open-when`, `/open-when/[slug]`
- `/awards`, `/quiz`, `/gallery`, `/achievements`, `/secret`, `/year-two`
- `/design-system` for development review of visual tokens and components

Navigation is driven by `src/data/navigation.ts`, so future sections can be added without rewriting the shell.

### Access and privacy

The access code is verified in a Server Action and never shipped in the client bundle. Successful verification creates a 30-day HTTP-only, secure-in-production, same-site session cookie signed with HMAC. The `(experience)` layout verifies that cookie on the server before rendering private routes, and the global navigation provides an explicit **Lock private archive** action that clears it.

The first complete journey is `/` → `/access` → `/home`. The landing page intentionally omits application navigation, the access screen returns rotating server-authored rejection messages, and successful verification briefly confirms the identity before opening the authenticated dashboard. The private shell includes a compact global progress indicator backed by persisted coupon and achievement state.

This is an application-level privacy gate, not a replacement for deployment access controls. For a truly private deployment, also configure platform-level protection and rotate secrets before launch.

Every response also sends a restrictive privacy/security baseline: CSP, clickjacking protection, MIME sniffing protection, a no-referrer policy, disabled camera/microphone/geolocation/payment permissions, and both metadata- and header-level `noindex` directives. The CSP permits HTTPS image/map connections because the MapLibre provider is deployment-configurable; narrow those origins when a final provider is fixed.

### Persistence and Supabase

Persistent state is stored in Supabase Postgres through feature-owned repository contracts. Supabase clients exist only under `src/lib/supabase` and server-only repository modules; no database client, project secret, raw state mutation, or answer key is included in the browser bundle. The existing signed access session remains the application authorization boundary and maps every authorized request to the single configured `SUPABASE_PRIMARY_USER_ID`. Supabase Auth and multi-user social models are intentionally not part of this private site.

The versioned migration at `supabase/migrations/20261007220000_create_private_progress.sql` creates only user-state tables:

| Table              | Stored state                                                          |
| ------------------ | --------------------------------------------------------------------- |
| `site_progress`    | Global memory count and last persisted activity                       |
| `coupon_state`     | Coupon unlock and redemption timestamps                               |
| `challenge_scores` | Best score, attempts, and completion per game                         |
| `quiz_attempts`    | Active, completed, and abandoned attempts with server-checked answers |
| `letter_state`     | Opened envelope timestamps                                            |
| `achievements`     | Idempotent achievement unlocks                                        |
| `discoveries`      | Reward, coupon, challenge, memory, and future secret discoveries      |

Every table has Row Level Security enabled and public `anon`/`authenticated` privileges revoked. Only the server secret’s `service_role` can access state. Multi-table mutations for challenge rewards, letter rewards, quiz completion, and coupon redemption run in Postgres functions so related state is committed atomically. Static definitions—coupons, challenges, letters, cities, awards, quiz questions, and reward copy—remain typed application data under `src/data`; Supabase is not used as a CMS.

Read paths fail closed to an empty state and log a server-side diagnostic, so editorial pages still render when Supabase is missing or temporarily unavailable. Mutations are not optimistically marked complete: the interface updates durable state only after the Server Action confirms the database write, and returns a retryable message when persistence fails.

Repository reads are request-memoized to avoid duplicate state queries when both the application shell and a route need the same progress. Reward-bearing writes remain atomic database functions; unused non-atomic mutation paths have been removed.

#### Supabase setup

1. Create a Supabase project and choose one stable UUID for Valentina’s state. It does not need to reference `auth.users`; it is the private application record key.
2. Install or invoke the Supabase CLI, link the project, and apply the committed migration:

   ```bash
   npx supabase login
   npx supabase link --project-ref your-project-ref
   npx supabase db push
   ```

3. Copy `.env.example` to `.env.local` and set:

   ```text
   SUPABASE_URL=https://your-project-ref.supabase.co
   SUPABASE_SECRET_KEY=sb_secret_...
   SUPABASE_PRIMARY_USER_ID=your-stable-uuid
   ```

   `SUPABASE_SECRET_KEY` is preferred for current Supabase projects. `SUPABASE_SERVICE_ROLE_KEY` remains supported as a legacy server-only alternative. Never prefix either secret with `NEXT_PUBLIC_`, commit it, print it, or pass it to a Client Component. The application does not require a publishable/anon key because all progress access occurs after the private session check on the server.

4. Configure the same values in the deployment provider’s encrypted environment settings, then restart or redeploy the application. Visit `/coupons`, `/challenges`, `/quiz`, and `/open-when` from two devices to confirm the shared state.

Database changes should be added as new migration files and deployed with `supabase db push`; do not edit the production schema manually after migration tracking begins. See the [Supabase migration workflow](https://supabase.com/docs/guides/deployment/database-migrations) and [server secret guidance](https://supabase.com/docs/guides/getting-started/api-keys).

Challenge definitions remain configuration-driven, so targets and future game types can be added without coupling them to route files. Both current game engines—Snake and the original Midnight Circuit maze chase—were implemented in-house using Canvas and `requestAnimationFrame`; they contain no third-party gameplay code, branded characters, copied sprites, sounds, or artwork.

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

All photographic metadata lives in the typed `src/data/media.ts` registry. Gallery, Map, and Awards resolve their images from that canonical source, while surface tags make the same records available to Home and the Secret Area without duplicating `src`, alternative text, captions, dates, or locations. The current source-controlled SVG placeholders under `public/images` can be replaced one record at a time when personal photographs are ready; consumers already use `next/image` with stable dimensions and responsive sizing.

`/gallery` renders that media registry as an asymmetric editorial scrapbook with data-driven category and favourites filters, polaroid and photo-strip treatments, deterministic annotations, and an accessible keyboard-controlled lightbox. Gallery presentation metadata remains optional, so shared media can participate in Map or Awards without appearing in the scrapbook.

## Quality and accessibility

The authenticated route group has branded loading, error, and transition boundaries. Disclosure navigation and dialogs support Escape, focus management, focus return, and accessible current-page state. The gallery viewer adds trapped focus and arrow-key navigation; game canvases support keyboard, swipe, and on-screen controls and pause automatically when the page is hidden. Canvas animation frames run only while a game is active.

Layout sizing is mobile-first and reviewed at 320, 375, 430, 768, and 1440 CSS pixels. Headline clamps, 44px minimum interactive targets, non-obstructive stickers, cooperative map gestures, and `prefers-reduced-motion` handling protect the experience across those widths.

The current engineering review and handoff inventory are documented in [`docs/technical-report.md`](docs/technical-report.md).

## Replacing placeholders

Gianmaria can finish the private content without changing presentation components:

| Content                                                       | Edit here                                    |
| ------------------------------------------------------------- | -------------------------------------------- |
| Photograph files and shared metadata                          | `public/images/` and `src/data/media.ts`     |
| City stories, dates, notes, coordinates, and image references | `src/data/places.ts`                         |
| Coupon copy, terms, rarity, and unlock configuration          | `src/data/coupons.ts`                        |
| Open When letters                                             | `src/data/open-when.ts`                      |
| Award nominees, winners, evidence, and prizes                 | `src/data/awards.ts`                         |
| Personal quiz prompts, answers, and feedback                  | `src/data/quiz-questions.ts`                 |
| Quiz thresholds and rewards                                   | `src/data/quiz.ts` and `src/data/rewards.ts` |

Keep the media IDs stable when replacing placeholders so Map, Awards, Gallery, Home, and Secret Area continue to share the same records.

## Product direction

The visual system is editorial and warm rather than Valentine-themed: parchment neutrals, oxblood accents, ink typography, restrained ornament, and dry microcopy. Routes that still use placeholders are structured so real memories, photographs, and final interactions can be added deliberately in later iterations.
