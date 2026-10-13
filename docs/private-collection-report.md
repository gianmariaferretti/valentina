# Spicy Archive — Private Collection

Scope: `feat/five-game-arcade`, existing `/secret` experience only. The exclusive-checkout request supersedes the earlier upload/exchange design. No upload form, camera/library permission, photo-submission storage or automatic email has been implemented.

## Journey and presentation

The existing seven stages, private image endpoint, ten-second one-image decryption, adult confirmation, replay and close action remain. Two seconds after the final reveal, a deliberate invitation opens a separate lazy-loaded panel inside the existing focus-trapped dialog. The product is confidential: its black/oxblood/ivory/gold presentation contains no photograph or media URL. Both access choices have equivalent accessible controls.

- Collection → **PAY €100** → contact/payment presentation and order summary → **YOUR REQUEST HAS BEEN RECEIVED.** / **AWAITING PAYMENT**.
- Collection → **EXCHANGE 10 PHOTOS** → **THE 10:1 EXCHANGE** → **DEAL ACCEPTED.**, **Ten from you. One from me.**, **AGREEMENT CONFIRMED**.
- Both confirmations return to the collection or the already-revealed archive. Closing/Escape uses the existing close-to-home action.

## Security and data boundaries

`accessPrivateCollection` authenticates the existing signed access cookie and rechecks the HMAC archive proof on entry and on each confirmation. The proof must have explicit adult confirmation, a successfully served image, completed normal/reduced reveal duration and an unexpired session. Earlier stages, guessed intents and client-side navigation cannot authorize a confirmation.

The payment/contact fields use labelled, focusable, `aria-readonly` display elements. There are no input, textarea, form, content-editable, upload or payment-provider elements in the checkout. No banking/contact information is collected or persisted. The only payload is one of three intents. No external request, email, photograph delivery, coupon write or new signed-media URL is performed by these actions.

The payment button makes **no charge** and displays no paid/successful-transaction claim. The agreement is an ephemeral, on-site intention, not a delivered photo or a durable order. **The website does not notify Gianmaria**: the confirmation explicitly asks the player to contact him to arrange payment or exchange outside the website. Reloading starts the existing archive sequence again and discards the checkout view.

GV-032 still uses `completeArchive` and the existing atomic reward RPC. It is never contingent on visiting the collection, payment or agreement. A database outage shows the original retry-saving state; a completed reveal still authorizes the collection without pretending the coupon was saved.

## Implementation

- `src/data/private-collection.ts`: editorial offer, prices and ratio; no private media/object reference.
- `src/features/secret/lib/private-collection-domain.ts`: allowlisted intents, view/receipt types and pure proof guard.
- `src/features/secret/actions/private-collection-actions.ts`: fresh server authorization; no external side effects.
- `src/features/secret/components/private-collection.tsx`: product, read-only field, summary, offer and confirmation components.
- `src/features/secret/components/private-collection.module.css`: scoped responsive visual language.
- Existing archive component/CSS: two-second invitation and conditional dynamic import. Timer cleanup on replay/exit; reduced-motion transitions; heading focus and dialog scroll reset on view changes.
- `tests/private-collection.test.mjs`: graph/proof/intent/action tests and AST check that payment/upload inputs cannot appear.

No new dependency, third-party source, asset, migration or environment variable. Motion and Lucide reuse the application's existing packages/licence notices. No access code, anniversary date, route, game rule or existing persistence table has changed.

## Verification

Automated baseline passed before implementation. Final checks: Prettier, zero-warning ESLint, TypeScript, **51 automated tests**, and the production build pass. New tests exercise both reveal durations, seven-stage gating, null/expired/invalid proofs, unknown intents, unauthenticated requests, reauthorization for both confirmations, exact prices, no paid outcome and absence of input elements or persistence/payment side effects.

**Local browser verification:** all seven stages, ten-second original illustration reveal, invitation, both offers, both server-authorized confirmations, return-to-collection, return-to-archive, heading focus and forward/backward Tab trapping. Read-only card fields cannot accept typing; the DOM contains zero editable fields. Collection, checkout, exchange and both confirmation views were measured at **320, 375, 390, 430, 768, 1024 and 1440px**: no dialog horizontal overflow; all buttons at least 44px (new controls at least 48px). Confirmation/offer screenshots were visually reviewed. A physical iPhone/Safari and an OS-level reduced-motion session still need manual QA; reduced-motion code and the shorter authorization duration are tested separately.

**Production-mode local integration:** Next `start` connected via the existing Supabase SDK to the isolated PostgreSQL/API fixture, not the live project. GV-032 was unlocked **before entering the collection**, with `redeemed_at = null`. Both checkout confirmations left the hash of coupon/discovery records exactly unchanged: one coupon row, two discovery rows, no duplicate grant or redemption. The missing-database path was also exercised against the existing local dev process: original reward-retry feedback remains, while the completed reveal can still open the collection.

**13 real HTTP checks** against the production-mode local action pass: anonymous, expired access, missing/tampered/expired archive proof, earlier stage, missing adult confirmation, image not served, incomplete duration and unknown intent are denied; valid browse and both acknowledgements succeed. `/api/secret-image` without credentials still returns 401 with browser/CDN no-store headers. These checks use disposable signed QA cookies, never production keys.

Reproduce the HTTP checks after a production build, using the same disposable secret configured on the loopback-only QA Next server:

```bash
VG_QA_ORIGIN=http://127.0.0.1:3101 AUTH_SECRET=<disposable-local-qa-secret> \
  node tests/fixtures/private-collection-http-check.mjs
```

The fixture rejects non-loopback origins, derives the action ID from the current local build, accepts no payment credentials and performs no database mutation. To repeat reward integration, use `tests/fixtures/archive-progress-server.mjs` and the isolated setup documented in [the archive report](spicy-archive-report.md). No live Supabase/Vercel configuration or deployment was altered.

## Release boundary and existing setup

No merge, push-triggered deployment, production deployment or live migration is performed. The existing archive's reward migration and private final photograph must be configured separately before production release, as documented in README. When no private object is configured, QA uses the original non-sensitive envelope illustration, not an invented personal photograph.

Update, 14 October 2026: the later private-media migration uploaded and verified all 26 photographs in a private Supabase bucket and moved the tracked originals outside `public/` on the feature branch. Previously published Git/deployment copies remain exposed; this historical report's earlier release boundary predates that migration. Do not infer that production media is private until a new release is verified. Historic exposure remediation remains a separate, explicitly authorized task.
