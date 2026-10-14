# Italian Academy 061–150: publication gate

The supplied `La_Dolce_Lingua_Lezioni_061-150_B1_B2_Laboratorio.json` is source material, not a publishable curriculum. Run:

```sh
npm run validate:italian-laboratory -- /absolute/path/to/La_Dolce_Lingua_Lezioni_061-150_B1_B2_Laboratorio.json
```

The validator fails closed. It checks numbering, levels, unique exercise and assessment IDs, minimum theory/example/activity content, model answers and feedback, and the required B1/B2 exam sections. It does not replace a qualified Italian L2/LS editorial review or check semantic correctness automatically.

Audit on 15 October 2026:

| Measure                                       |                 Supplied material |                                Publication requirement |
| --------------------------------------------- | --------------------------------: | -----------------------------------------------------: |
| Lessons                                       | 90, covering 061–150 without gaps |                                                     90 |
| Examples                                      |           3 per lesson, 270 total |                                       15–20 per lesson |
| Activities                                    |        20 per lesson, 1,800 total |               20–25 meaningful interactions per lesson |
| Final questions                               |           5 per lesson, 450 total | 5 distinct, graded or honestly self-reviewed questions |
| Open activities without a model response      |                               720 |                                                      0 |
| Activities with explicit difficulty and topic |                                 0 |                                                    All |
| Distinct Spanish theory explanations          |             4 across 360 sections |                            Lesson-specific comparisons |

The 061–080 source titles match the existing imported DOCX lessons. Those original lesson files must remain byte-for-byte unchanged. Their supplemental material should be merged into the existing experience only after removing overlaps and checking each activity against its grammatical objective. For example, the supplied 061-A01 hides _studiare_, while the lesson teaches the subjunctive; this does not test the intended form.

The proposed final exams 100 and 150 have no reading passage or structured grammar, vocabulary, writing, and communication sections. Their current questions analyze generic instructions, so they cannot be presented as B1/B2 final exams.

Do not import or deploy lessons 081–150 until the content is authored and reviewed, the validator passes, the existing progress IDs remain stable, and the real interactions are tested. The current Supabase lesson and exercise tables use text IDs without an 080 ceiling; an additive migration is not required for numbering alone. Existing production progress and the 001–080 lessons have not been changed by this audit.
