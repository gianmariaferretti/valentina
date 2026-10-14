# La Dolce Lingua source review

The four owner-supplied Word manuals are authoritative. The import preserves every paragraph verbatim and does not resolve editorial ambiguities by changing content.

## Items for Gianmaria to review

- Volume I, lesson 001, teacher solutions 07 and 08 contain a double full stop (`Io parlo italiano..` and `Loro studiano ogni sera..`). The exact source text remains unchanged in the stored solution and in the reader.
- Volume IV asks the future website to generate a _new_ quick-check question pool. The supplemental atelier adds contextual gap/order practice and rule/teacher-feedback recall grounded in the source, without pretending to be a separately authored quick-check question bank. The existing four source questions and quick-check instruction are shown as written.
- Free production, sentence correction and transformation can admit more than one valid answer. The site saves those responses and shows the teacher's original model/feedback, but does not award an automatic correctness score. Auto-checking is limited to exact-answer choices, short completions and word order with a usable source key. An answer marked as not matching the model is an invitation to compare, not a claim that every other grammatical formulation is invalid.
- The sources contain instructions for listening practice but no audio recordings. The importer does not generate audio or pretend that recordings exist.

## Integrity and privacy

`scripts/import-dolce-lingua.py --verify` compares each checked-in JSON paragraph with the corresponding Word paragraph, including source checksums. All 80 lessons and all 3,418 source paragraphs were verified on 14 October 2026. The four front matters are stored separately from the 3,344 lesson paragraphs.

The Academy route is inside the existing authenticated `(experience)` layout. It reuses the existing private Italian progress tables and server-only RPCs, without changing old quiz, coupon or game state. The additive Italian migration was applied to the production Supabase project on 14 October 2026 after explicit owner approval. The supplemental atelier needs no further schema change; its stable `supp-01`–`supp-10` exercise IDs are stored in the same exercise-result table. These interactions reuse source sentences and explanations rather than claim new separately authored lesson copy.
