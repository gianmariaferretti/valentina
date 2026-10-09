# Awards, media and Spicy Archive — implementation report

Scope: `feat/five-game-arcade` only. No merge to main, production deployment, live database migration, password change, anniversary-date change, game-rule change or coupon-rarity change.

## A. Awards changes

The existing ceremony design and nominee → winner Motion sequence remain. Winners and nominee citations use the supplied English copy:

| Category                  | Winner                            | Nominees                                                                                   |
| ------------------------- | --------------------------------- | ------------------------------------------------------------------------------------------ |
| Best Trip                 | Accettura                         | Accettura, Naples, Hamburg                                                                 |
| Best Date                 | National Gallery                  | National Gallery, Mexican Dinner, Parco della Musica Concert, Sushi Date                   |
| Best Dinner               | Colombian Dinner by Valentina     | Colombian Dinner by Valentina, Italian Dinner by Gianmaria, Dinner at the National Gallery |
| Best Photo                | The Gianmaria Bite Photo          | Only The Gianmaria Bite Photo                                                              |
| Best Surprise             | Surprise Flowers                  | Surprise Flowers, The Necklace Gift                                                        |
| Worst Restaurant          | The Cave Restaurant in Matera     | The Cave Restaurant in Matera, The Empty Restaurant in Matera                              |
| Most Pointless Argument   | Cancelled                         | None                                                                                       |
| Best Dramatic Performance | Valentina Mad at Me for No Reason | Valentina Mad at Me for No Reason, Gianmaria Playing the Mad Card                          |
| Most Beautiful City       | Pignola                           | Pignola, Rome, Cartagena, Hamburg                                                          |
| Most Annoying             | Gianmaria's English               | Only Gianmaria's English                                                                   |

Worst Navigation Skills, Longest Getting Ready, Most Likely to Fall Asleep and Relationship MVP retain their original definitions. MVP remains VALENTINA, with the existing prize. The cancelled category is a typed special case with no nominees/winner, the official statement, AWARD CANCELLED and CASE CLOSED. Programme numbering now reflects 14 categories rather than a hardcoded 15.

## B. Removed awards

Best Excuse is removed. Most Expensive Taste is replaced by Most Beautiful City. The cancelled argument award does not invoke the winner reveal.

## C. Uploaded photographs discovered

After fetching GitHub and checking both remote branches, **no personal raster photographs were present**. The user-supplied `main/public/images` path contains:

- `awards/city-night-placeholder.svg`
- `awards/golden-hour-placeholder.svg`
- `awards/instant-film-placeholder.svg`
- `awards/jury-evidence-placeholder.svg`
- `awards/table-for-two-placeholder.svg`
- `map/city-placeholder.svg`
- `map/detail-placeholder.svg`
- `map/transit-placeholder.svg`
- `year-one-cover.svg`

The audited main revision is `f4d780ee5921d5e9ce14bd888004d31d6b199b19`. None of these illustrations is presented as an actual supplied photograph. Personal photo integration remains pending the committed files; there are no ambiguous photographs to resolve yet.

## D. Photo-to-city mapping

The ten destinations retain their routes, geographic coordinates, dates and navigation. Polignano a Mare, Matera, Accettura, Amalfi Coast and Bari now have their own canonical placeholder media identities instead of reusing Brussels-labelled metadata.

| Route            | Supported filename words                            | Current personal photos |
| ---------------- | --------------------------------------------------- | ----------------------- |
| london           | london, londra                                      | Missing                 |
| rome             | rome, roma                                          | Missing                 |
| paris            | paris, parigi                                       | Missing                 |
| hamburg          | hamburg, amburgo                                    | Missing                 |
| brussels         | brussels, bruxelles                                 | Missing                 |
| polignano-a-mare | polignano, polignano a mare                         | Missing                 |
| matera           | matera                                              | Missing                 |
| accettura        | accettura                                           | Missing                 |
| amalfi-coast     | amalfi, amalfi coast, costiera, costiera amalfitana | Missing                 |
| bari             | bari                                                | Missing                 |

`matchPhotoPlace` is a conservative editorial helper: it accepts English/Italian words but returns null for ambiguous or unrelated filenames. It does not silently register images, infer dates or invent memories. Once files are committed, inspect the actual images, choose a cover, register intrinsic dimensions/alt/caption in `src/data/media.ts`, and reference those same IDs in `src/data/places.ts`. The private final archive photograph must never join this public registry.

## E. Gallery and memory game

The existing gallery presentation, 15-placeholder selection, filters and lightbox remain. No extra repetitive placeholder shots were added to the gallery. Awards retain their non-sensitive illustrations because no reliable personal photographs are available. The 18-pair Memory game already supports canonical `image`/`matchingImage` IDs; its symbols and all gameplay settings remain unchanged pending identifiable photos.

## F–G. One seven-stage Spicy Archive

`/secret` now contains one full-screen, warm-ivory/oxblood/classified-paper experience:

1. **discovery** — YOU FOUND SOMETHING; deliberate CONTINUE ANYWAY.
2. **curiosity** — the humorous confidential warning and handwritten annotation.
3. **age-confirmation** — explicit adult self-declaration; genuine back action.
4. **point-of-no-return** — final warning; changing one's mind returns to age confirmation and clears adult clearance.
5. **sealed-file** — layered paper envelope, seal, opening flap and emerging frame.
6. **photo-reveal** — authorized image fetch followed by the strip scan.
7. **final-reveal** — image remains visible; replay, close, and persisted reward status.

Text is separate from presentation in `src/data/spicy-archive.ts`. Domain transitions, signed session proof, image loading, actions and shared reward persistence are feature-owned modules. Query parameters cannot select a stage. Refresh starts at discovery; starting again resets the server proof. The shell remains unchanged on every other route.

## H. Horizontal photograph reveal

One image is rendered inside one consistent 4:5 editorial frame with `object-fit: contain`. A CSS clip-path animation advances through 20 horizontal bands over 10 seconds: the first band appears at 500ms and the final band at 10 seconds. There are no duplicate full-resolution image layers. The scan starts only after the image loads; failed downloads have a retry and cannot trigger the reward. Reduced motion uses a 700ms continuous, non-flashing reveal with no decorative stage displacement.

## I. GV-032 integration

The reward definition lives in `src/data/rewards.ts`. Only the completion action can grant it. The server checks authentication, signed stage, explicit adult confirmation, successful image service, expiry and the minimum reveal duration. No client coupon ID or victory boolean is trusted.

The additive `grant_experience_coupon` RPC atomically inserts the coupon unlock and discovery records. Conflict handling preserves the earliest existing unlock and never assigns `redeemed_at`. Browser roles cannot execute it; only server credentials can. Failed persistence keeps the fully revealed image and offers Retry Saving Reward. A client refresh may restart the experience but cannot undo a saved reward.

These checks enforce sequential authorization and timing, not proof that a human actually looked at every pixel. An authorized visitor can save delivered media. This is a private playful experience, not financial anti-cheat or verified age identification.

## J. Authentication and privacy

The existing access system/password and authenticated route layout are unchanged. Every new action verifies the access session; the image endpoint additionally requires adult/archive clearance. The HMAC proof is HTTP-only, same-site, secure in production, and bound to the current signed site session.

The server downloads the configured object from a **private** Supabase Storage bucket and refuses a public bucket. No public/signed Storage URL or object path is shipped to the client. Browser/CDN/Vercel-CDN headers are no-store. Authenticated images deliberately bypass the shared Next image optimizer; an unauthenticated optimizer request cannot forward access cookies. No personal or sensitive photograph is committed. The current illustration is original and non-sensitive.

## K. Verification

- Baseline formatting, ESLint, TypeScript, 36 game tests and production build passed before edits.
- Added six automated tests for awards, cancelled/single nominees, ten media identities, conservative filename matching, seven-stage sequencing and reveal completion guards.
- All 42 tests pass; existing game tests remain unchanged.
- All four migrations execute in isolated PostgreSQL/PGlite. Existing `game_state.sql` and new `archive_reward.sql` rollback suites pass.
- SQL checks: initial unlock, no auto-redemption, idempotent retry, preservation of an existing redeemed timestamp, exactly two discovery records and no browser-role execution privilege.
- HTTP checks: image without access = 401; valid access without archive proof = 403; tampered archive proof = 403. All return private/no-store headers.
- Browser: access redirect, all seven stages, both back choices, seal opening, one-image ten-second scan, full image remaining visible, replay, close-to-home and graceful missing-database retry.
- Full-stack production-mode local test: the complete browser sequence saved GV-032 through the existing Supabase SDK and new RPC against the isolated PostgreSQL/API fixture; UI confirmed “Coupon saved. Not redeemed.” The subsequent coupon count rose from 30 to 31, with no redemption timestamp.
- Browser: Awards single-nominee Best Photo and two-nominee Best Surprise reveal the correct winners; the cancelled category is visible.
- Browser: archive and Awards have no horizontal overflow at 375, 390, 430, 768, 1024 and 1440px; archive buttons are at least 44px and images use contain.
- Gallery Trips filtering and lightbox opening were exercised without changing gallery code.
- Reduced-motion domain duration and CSS handling are checked in code/tests. A real iPhone/Safari and an OS-level reduced-motion session still require manual device QA.

The optional isolated API fixture in `tests/fixtures/archive-progress-server.mjs` exercises the existing Supabase SDK/repository against actual PostgreSQL functions without live credentials. It is **not** a replacement persistence implementation and must never be deployed.

To reproduce isolated database/API QA without adding a project dependency:

```bash
VG_QA_DEP_DIR=$(mktemp -d /tmp/vg-archive-db.XXXXXX)
npm install --prefix "$VG_QA_DEP_DIR" --no-save @electric-sql/pglite@0.5.8
VG_QA_PGLITE_MODULE="$VG_QA_DEP_DIR/node_modules/@electric-sql/pglite/dist/index.js" \
  node tests/fixtures/archive-progress-server.mjs
```

Use a separately started local Next process with `SUPABASE_URL=http://127.0.0.1:3200`, `SUPABASE_SECRET_KEY=archive-qa-only` and a disposable UUID. The fixture is ephemeral, bound to loopback and never connects to a live database. Do not change or copy production access secrets for this test.

## L. Remaining manual configuration

1. Commit the actual ordinary travel photographs to the indicated GitHub directory; their cover selection, galleries, award associations and Memory pair assignments cannot be truthfully completed before they exist.
2. Supply the final archive photograph through private Storage only; set the three server-only image variables as documented in README.
3. Review/apply the additive reward migration to a preview/local Supabase environment. Production remains untouched until separately approved.
4. Perform final real-device iPhone/Safari and reduced-motion preference QA.
