# V&G — Year One

A private, interactive first-anniversary experience created by Gianmaria for Valentina. This repository is the production foundation for the application; the previous single-file prototype has intentionally been removed.

## Stack

- Next.js 16 with the App Router and React 19
- TypeScript in strict mode
- Tailwind CSS 4
- Motion for React for focused interface motion
- Lucide icons
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
- `/challenges/[game]`
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

Suggested next step: add a Supabase server/client package, implement `ProgressRepository`, and migrate access throttling and user progress into database-backed records protected by Row Level Security.

### Content model

Placeholder content lives in typed registries under `src/data`. Feature work should extend those models or move a domain into its own `features/<feature>` package; route files should remain thin composition layers.

### Visual system

The reusable primitives under `src/components/design-system` combine editorial typography with tactile travel-journal objects. `Sticker` provides deterministic variants, rotations, sizes, and position presets; supporting components cover tape, paper surfaces, tickets, polaroids, postage, passport stamps, luggage tags, handwriting, arrows, and small doodles. The `/design-system` route is the canonical visual review surface.

## Product direction

The visual system is editorial and warm rather than Valentine-themed: parchment neutrals, oxblood accents, ink typography, restrained ornament, and dry microcopy. The route pages intentionally stop at polished skeletons so real memories, photographs, and final interactions can be added deliberately in later iterations.
