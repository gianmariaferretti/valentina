# Supplied travel photographs — integration report

Scope: `feat/five-game-arcade` only. No merge, production deploy, live database write, authentication change, anniversary-date change, coupon-rarity change or game-rule change.

## Inventory and associations

The supplied folder contained 16 photographs (15 HEIC and one JPEG) and one MOV. All were inspected locally; originals remain untouched and are not committed. Fifteen valid images were converted to WebP under `public/images/travel`.

| Supplied file         | Canonical media ID     | Destination / use                                                      |
| --------------------- | ---------------------- | ---------------------------------------------------------------------- |
| Accettura.heic        | accettura-cover        | Accettura cover; Best Trip                                             |
| Accettura1.HEIC       | accettura-evening      | Accettura gallery                                                      |
| Accettura2.HEIC       | accettura-portrait     | Accettura gallery                                                      |
| IMG_3158.HEIC         | accettura-dome         | Accettura gallery; owner confirmed location                            |
| Bari1.HEIC            | bari-cover             | Bari cover                                                             |
| Bari2.HEIC            | bari-street            | Bari gallery                                                           |
| Disneyland_Paris.HEIC | paris-disneyland       | Paris gallery; explicitly labelled Disneyland Paris, not central Paris |
| Matera1.HEIC          | matera-cover           | Matera cover                                                           |
| Parigi1.HEIC          | paris-bite             | Paris gallery; owner-confirmed Best Photo                              |
| Parigi2.HEIC          | paris-cover            | Paris cover                                                            |
| Parigi3.HEIC          | paris-quiet-frame      | Paris map gallery only, by explicit owner request                      |
| Polignano.HEIC        | polignano-a-mare-cover | Polignano a Mare cover                                                 |
| Polignano1.HEIC       | polignano-boat         | Polignano a Mare gallery                                               |
| Polignano3.HEIC       | polignano-table        | Polignano a Mare gallery; Food category                                |
| Roma1.HEIC            | rome-cover             | Rome cover                                                             |

`Brussels1.jpg` is truncated: Sharp reports **VipsJpeg: premature end of JPEG image** during strict decoding. It was not committed, repaired with invented pixels or used as a cover. Brussels retains its illustration pending an intact replacement. London, Hamburg and Amalfi Coast also have no supplied photo and retain existing placeholders. `Pasta.MOV` is a video, not silently converted to a photograph or a new video feature.

Dates remain null/“Date to be added.” No photo date, itinerary or personal memory was invented. Captions and alternative text describe visible content and the supplied filename association.

## Preparation and privacy

HEIC was decoded locally with macOS `sips`, then Sharp's automatic orientation applied before aspect-preserving resize. Each image has a maximum 1600px long edge and WebP quality 84. Together the 15 files are under 4MB; each is under 450KB. EXIF, GPS, orientation tags, XMP and embedded profiles are omitted from output. No source HEIC/JPEG/MOV, local path or private archive photograph is added to Git.

**These travel images are public assets.** The owner was explicitly warned that `public/` images are accessible without the site's access password. He requested `Parigi3.HEIC` on the Paris map page; it is excluded from Gallery and Memory, but this is an editorial restriction, not private asset authorization. The Spicy Archive remains a separate authenticated server/private-Storage path with its non-sensitive illustration unchanged. Never reuse a genuinely private image from that feature in this public registry.

No dependency was added. Existing Next.js/Sharp tooling and their licenses are documented in `THIRD_PARTY_NOTICES.md`.

## Shared rendering

- `src/data/media.ts` is the sole metadata registry. Stable cover IDs resolve to real images without changing navigation, coordinates or chronology.
- Destination galleries use only the remaining actual photos where available; they do not repeat the cover or add generic placeholder frames. Single-photo destinations omit the empty gallery section.
- Destination hero/gallery views use contain rendering, preserving full portrait photographs without stretched or face-cutting hero crops. Other placeholder destinations retain their existing presentation.
- Gallery uses 14 real photographs in a deliberately interleaved order, with existing editorial/Polaroid/photo-strip/tape treatments, categories, favourites and keyboard lightbox. Empty filters have a readable status message instead of a blank grid.
- Only reliably associated Awards change images: Best Trip and Best Photo. The Matera cityscape is not falsely presented as restaurant evidence.
- Memory has 14 photographic pairs and four original symbol pairs. Both cards in each photo pair resolve to the identical canonical image. All 18 identity IDs and their order remain stable, preserving seeded decks and server transcript verification. Rules, timer, rewards, difficulty and shuffle are unchanged. Map-only photos are not game assets.

## Verification

Baseline formatting, lint, TypeScript, 42 automated tests and production build passed. Three added/expanded checks exercise real WebP decoding, intrinsic dimensions, metadata removal, size budgets, unique gallery sources, map-only exclusion, exact photo pairs, destination membership, untouched unknown dates and missing-city fallbacks. Existing deterministic game tests still verify the unchanged decks, timers and server replay.

Final checks: formatting, ESLint (zero warnings), TypeScript, all **45 automated tests** and the production build pass.

### End-to-end photo verification

Story: supplied file → canonical registry → authenticated Map/Gallery/Awards page → Next image optimizer → correctly oriented photograph/lightbox.

| Boundary               | Evidence                                                                                                                                                                                           |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Originals → output     | Strict decoding, all 15 WebP files, intrinsic dimensions and metadata checks pass. The damaged Brussels JPEG is rejected.                                                                          |
| Registry → page        | Paris renders its real cover and three remaining images, including the requested map-only frame. Accettura renders its cover and three remaining images.                                           |
| Image server → browser | All 15 sources return HTTP 200 and image/webp through `/_next/image` at 640px. The lightbox image loads and uses contain rendering.                                                                |
| Interaction → UI       | Gallery has 14 frames; Food selects the actual ice-cream photo; Random shows an empty-state message. The bite photograph opens in the lightbox, and Escape returns focus to its trigger.           |
| Map preview            | The accessible Rome selector opens a preview using the real Rome cover; all ten geographic markers remain.                                                                                         |
| Awards                 | Best Trip and Best Photo display their actual supplied images while the existing category/reveal UI remains intact.                                                                                |
| Responsive layout      | Gallery and Paris have no horizontal overflow at 375, 390, 430, 768, 1024 and 1440px. Accettura's loaded mobile hero is 335px inside a 390px viewport; the full photograph uses contain rendering. |

The local test server deliberately has no live Supabase credentials. Its existing static-content fallback warning is expected; no persistence change or live database write was needed for these static media associations. A physical iPhone/Safari test remains a manual check, not claimed from desktop viewport emulation.
