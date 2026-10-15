# Italian Laboratory editorial review — 15 October 2026

Source reviewed: the owner-supplied `La_Dolce_Lingua_Lezioni_061-150_B1_B2_Laboratorio.json` in Downloads. This review concerns its **new 081–150 material**; the original, published 001–080 Word-manual lessons remain untouched.

The published 001–080 bundle was also rechecked against all four owner-supplied Word files with `scripts/import-dolce-lingua.py --verify`: all 80 lessons match their original sources. The application test suite confirms their routes, exercise grouping and server-side answer handling. This proves import integrity, not that every sentence in the owner's original manuscripts has been independently copyedited; the known source typos and assessment caveats remain listed in `docs/la-dolce-lingua-source-review.md`.

## Inventory and integrity

- All 70 numbers from 081 through 150 are present once, with 20 B1 and 50 B2 labels.
- There are 1,400 activities with unique IDs and 350 final-assessment items with unique IDs. Every lesson has exactly 20 activities and five final-assessment items.
- Every lesson has only **three examples** (210 in total), against the requested 15–20 per lesson. The source validator reports 9,016 unmet requirements across the full 061–150 file; many errors reflect the gap between the source's compact schema and the intended publication specification.

## Pedagogical blockers

1. **Explanations are generic, not bilingual teaching notes.** All 70 new lessons repeat the same four Spanish instructions. They do not explain the lesson-specific contrast with Spanish. The four Italian theory paragraphs per lesson are brief notes, not a simple explanation, detailed explanation, exceptions and common mistakes with contextual examples.
2. **Most open practice cannot be reviewed fairly.** Of the 1,400 new activities, 560 open-response items have neither a model answer nor a rubric. Free writing must not be auto-scored by exact string comparison.
3. **Final assessments are incomplete.** Each lesson has one production task without a model answer; the generic three-word rubric is not enough to tell a learner why an answer is good or needs correction.
4. **Some generated items assess the wrong skill.** Lesson 101 is about forming the imperfect subjunctive, but its first gap asks for `casa`. Lesson 100's supposed B1 exam asks the learner to complete words in instructions such as “Racconta un'esperienza significativa”, not to demonstrate B1 reading or writing.
5. **The level exams are not exams.** Lessons 100 and 150 have no `examSections`, reading passages, structured writing evaluation or skill coverage. They must not be described as a B1/B2 assessment or certification.
6. **Feedback is often formulaic.** For example, lesson 081's analysis prompt about “Quando arrivi, chiamami” is paired with a model statement about a different sentence containing two subordinate clauses. This can mislead a learner even when the sentence itself is grammatical.

## Publication decision

Do **not** expose 081–150 as completed Academy lessons or add their IDs to progress calculations yet. Doing so would imply that an unreviewed, partly mismatched answer bank is complete and would create durable exercise records against unstable keys. The site continues to offer the 80 fully imported original lessons. No learning data, games, coupons or rewards were changed by this review.

Before publication, the source needs lesson-specific bilingual explanations, at least 15 varied examples per lesson, model responses and rubrics for open practice, correction of off-topic items, and actual B1/B2 exam sections with reading passages. Run `npm run validate:italian-laboratory -- /absolute/path/to/revised.json`, then manually review a sample from each topic and both exams. Only then map the reviewed content into the Academy's server-side lesson store and persistence flow.
