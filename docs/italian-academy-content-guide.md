# La Dolce Lingua — content guide

The Academy has 100 curriculum slots, but **no real lesson has been authored or published**. The single `fixtures/example-lesson.json` is a development-only format demonstration. Do not present it as Valentina's lesson.

## The source format

The authoritative type-safe schema is [`src/features/italian-corner/academy/lesson-schema.ts`](../src/features/italian-corner/academy/lesson-schema.ts). To inspect a Draft 2020-12 JSON Schema generated from it, run `npm run schema:lessons`. Cross-file rules, such as prerequisites and folder identity, are enforced by `npm run validate:lessons`; those cannot be fully represented in JSON Schema.

| Field                                                    | Purpose                                                                                                    |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `id`, `number`, `level`                                  | Must agree: `a2-001`–`a2-030`, `b1-031`–`b1-065`, `b2-066`–`b2-100`.                                       |
| `status`                                                 | `unpublished` or `published`. New files should start unpublished.                                          |
| `title`, `description`, `estimatedMinutes`, `objectives` | Lesson card and reader introduction.                                                                       |
| `prerequisites`                                          | Earlier lesson IDs; every referenced file must exist.                                                      |
| `explanations`                                           | Bilingual `{id,it,es}` grammar/usage notes.                                                                |
| `grammarExamples`                                        | Italian and Spanish examples, optional note.                                                               |
| `vocabulary`                                             | Cards with ID, Italian/Spanish terms, optional example and audio.                                          |
| `exercises`                                              | Optional multiple-choice, fill-blank, matching, sentence-order, reading, listening and writing activities. |
| `finalAssessment`                                        | Optional exercise IDs and passing percentage; completion uses persisted best activity scores.              |
| `reviewNotes`                                            | Optional study notes.                                                                                      |

For listening and vocabulary, `audioRef` must be a local path under `/audio/italian/` ending in `.mp3`, `.ogg` or `.wav`. Add the licensed or personally recorded media under `public/audio/italian/`; the fixture deliberately has no real audio. A listening activity without audio displays its script as the accessible fallback. Writing is stored for self-review; it is not automatically judged by a model and should not be used as an auto-graded final-assessment criterion.

Exercise answer keys (`correctOptionId`, `acceptedAnswers`, `correctOrder`, matching pairs) are parsed only in the server lesson store. The reader receives a sanitized view; scoring and progress writes happen through authenticated Server Actions.

## Add the first lesson

1. Copy `src/content/italian/fixtures/example-lesson.json` to `src/content/italian/a2/a2-001.json`. Replace **all demonstration material** with the owner's real lesson. Keep its ID, number and A2 level.
2. Set `status` to `unpublished`. Complete Italian and Spanish explanations, all answer keys and explanations, and any audio files.
3. Run `npm run validate:lessons` and `npm run typecheck`. Fix every validation failure, including duplicate IDs, invalid options, missing translations and unavailable prerequisites.
4. During development, open `/italian-corner/academy/preview?lesson=a2-001` (or the matching ID) to inspect the unpublished file. Without a real `a2-001.json`, this route shows the fixture. The preview does not persist progress. **Do not mark a draft as published merely to preview it.** The standard reader refuses unpublished files.
5. Once reviewed, change only that lesson file's `status` to `published`; rerun validation, tests and build. The catalog discovers it without component changes. Deploy only with owner approval.

To correct a published lesson, edit its JSON file, validate again, review the changed answer keys, and release normally. Existing progress remains keyed by stable lesson/exercise IDs; preserve those IDs when correcting wording. If changing an answer key or an exercise's meaning, plan a progress migration or use a new exercise ID so old scores do not masquerade as new results.

## Publishing and database state

The curriculum boundaries are in `src/content/italian/curriculum.json`. Every slot is unpublished unless a valid, matching lesson file exists with `status: published`. The Academy works without Supabase for catalog display, but completion and review write only after the additive Italian Corner migration is applied. Until then it visibly reports that progress is unavailable and refuses to fabricate success.

Apply the migration separately after review; this feature branch intentionally does **not** modify the production database. It adds private server-only tables and RPCs for quiz attempts, lesson/exercise/vocabulary state and level-exam results. Never expose the Supabase secret key or answer-key files in a Client Component.
