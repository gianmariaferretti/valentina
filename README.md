# V&G — Year One

A private, interactive first-anniversary experience created by Gianmaria for Valentina. This repository is the production foundation for the application; the previous single-file prototype has intentionally been removed.

## Stack

- Next.js 16 with the App Router and React 19
- TypeScript in strict mode
- Tailwind CSS 4
- Motion for React for focused interface motion
- Lucide icons
- MapLibre GL JS for WebGL geographic maps
- ESLint and Prettier

## Getting started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Set `SITE_ACCESS_CODE` and a long random `AUTH_SECRET` in `.env.local`. The access code has no client-side or development fallback: verification remains unavailable until `SITE_ACCESS_CODE` is configured. Production also requires `AUTH_SECRET` to sign sessions.

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

The access code is verified in a Server Action and never shipped in the client bundle. Successful verification creates an HTTP-only, same-site session cookie signed with HMAC. The `(experience)` layout verifies that cookie on the server before rendering private routes.

The first complete journey is `/` → `/access` → `/home`. The landing page intentionally omits application navigation, the access screen returns rotating server-authored rejection messages, and successful verification briefly confirms the identity before opening the authenticated dashboard. The private shell includes a compact global progress indicator with placeholder values ready to be connected to persistence.

This is an application-level privacy gate, not a replacement for deployment access controls. For a truly private deployment, also configure platform-level protection and rotate secrets before launch.

### Persistence and Supabase

Persistent feature state is accessed through the `ProgressRepository` interface in `src/lib/persistence`. The initial browser implementation uses local storage and keeps the prototype usable without infrastructure. A later Supabase adapter can implement the same contract and be selected by a repository factory without coupling components to a database client.

Coupons use the same adapter principle with a stricter server-owned boundary. `CouponStateRepository` currently resolves to a signed, HTTP-only cookie adapter; redemption is validated in a Server Action before state is written. A future Supabase adapter can replace the repository factory while the wallet, ticket routes, and redemption controls remain unchanged. Challenge coupons are modeled explicitly and route into `/challenges/[game]` instead of passing through direct redemption.

Challenge progress follows the same server-owned adapter boundary. `ChallengeStateRepository` persists attempts, best scores, and completion in a signed HTTP-only cookie, while challenge completion updates the associated coupon unlock state. The game definitions remain configuration-driven, so targets and future game types can be added without coupling them to route files. Both current game engines—Snake and the original Midnight Circuit maze chase—were implemented in-house using Canvas and `requestAnimationFrame`; they contain no third-party gameplay code, branded characters, copied sprites, sounds, or artwork.

Open When follows the same pattern through `OpenWhenStateRepository`. The current signed-cookie adapter records opened envelopes and claimed reward IDs without exposing mutable progress to client JavaScript. Letter content is defined in the typed `src/data/open-when.ts` registry, while rewards live in `src/data/rewards.ts` and pass through a generic server-side grant executor. The first reward type unlocks coupons, but the discriminated reward model is designed to accept additional reward kinds without coupling them to `Envelope`, `Letter`, or route components.

The V&G Awards are configured entirely in `src/data/awards.ts`. Each typed entry owns its category, nominees, winner, copy, media, optional evidence, sticker treatment, prize, and presentation size. The route remains a Server Component while each ceremony envelope uses a small Client Component for the nominee and winner reveal sequence. Ceremony styling is scoped to the feature with a CSS Module.

The relationship quiz keeps its replaceable question bank in `src/data/quiz-questions.ts` and its result bands and reward thresholds in `src/data/quiz.ts`. Correct answer keys stay in a server-only module. Each answer is validated in sequence by a Server Action against a signed active attempt; the client receives only the selected answer result. `QuizStateRepository` persists best score, completed attempts, achievement IDs, claimed reward IDs, and the active attempt in an HTTP-only signed cookie. Perfect-score coupon grants pass through the shared reward executor and are idempotent.

### Geographic maps

`/map` and `/map/[place]` use MapLibre GL JS with real vector map data. The typed destination registry in `src/data/places.ts` stores coordinates in MapLibre’s `[longitude, latitude]` order alongside editorial content, image placeholders, sticker metadata, notes, and a deliberately non-chronological atlas order.

The default style is OpenFreeMap Liberty:

```text
https://tiles.openfreemap.org/styles/liberty
```

OpenFreeMap’s public service permits commercial usage, does not require an API key, and includes the required OpenStreetMap/OpenMapTiles attribution in the style; the application keeps MapLibre’s attribution control visible. The public service has no SLA. For a deployment that requires contracted availability or self-hosted tiles, set `NEXT_PUBLIC_MAP_STYLE_URL` to a compatible MapLibre Style Specification URL and verify that provider’s access, billing, attribution, privacy, and allowed-origin requirements.

The style URL is public browser configuration, not a secret. Map requests are sent directly from the visitor’s browser to the configured provider. A strict Content Security Policy must allow the configured style/tile/font hosts and MapLibre’s worker/image requirements. The MapLibre worker is bundled as a same-origin hashed asset using the official Next.js setup.

Map interaction is paired with keyboard-accessible marker buttons, a complete destination index, direct memory links, and an external OpenStreetMap link on each location page. Cooperative touch gestures prevent the embedded map from trapping mobile page scrolling.

Suggested next step: add a Supabase server/client package, implement `ProgressRepository`, and migrate access throttling and user progress into database-backed records protected by Row Level Security.

### Content model

Placeholder content lives in typed registries under `src/data`. Feature work should extend those models or move a domain into its own `features/<feature>` package; route files should remain thin composition layers.

### Visual system

The reusable primitives under `src/components/design-system` combine editorial typography with tactile travel-journal objects. `Sticker` provides deterministic variants, rotations, sizes, and position presets; supporting components cover tape, paper surfaces, tickets, polaroids, postage, passport stamps, luggage tags, handwriting, arrows, and small doodles. The `/design-system` route is the canonical visual review surface.

All photographic metadata lives in the typed `src/data/media.ts` registry. Gallery, Map, and Awards resolve their images from that canonical source, while surface tags make the same records available to Home and the Secret Area without duplicating `src`, alternative text, captions, dates, or locations. The current source-controlled SVG placeholders under `public/images` can be replaced one record at a time when personal photographs are ready; consumers already use `next/image` with stable dimensions and responsive sizing.

`/gallery` renders that media registry as an asymmetric editorial scrapbook with data-driven category and favourites filters, polaroid and photo-strip treatments, deterministic annotations, and an accessible keyboard-controlled lightbox. Gallery presentation metadata remains optional, so shared media can participate in Map or Awards without appearing in the scrapbook.

## Product direction

The visual system is editorial and warm rather than Valentine-themed: parchment neutrals, oxblood accents, ink typography, restrained ornament, and dry microcopy. Routes that still use placeholders are structured so real memories, photographs, and final interactions can be added deliberately in later iterations.
