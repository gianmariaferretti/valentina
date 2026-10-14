import { readFile } from "node:fs/promises";

const source = process.argv[2];
if (!source) {
  console.error(
    "Usage: npm run validate:italian-laboratory -- /absolute/path/to/laboratory.json",
  );
  process.exit(2);
}

let document;
try {
  document = JSON.parse(await readFile(source, "utf8"));
} catch (error) {
  console.error(`Cannot read laboratory JSON: ${error.message}`);
  process.exit(2);
}

const errors = [];
const lessons = Array.isArray(document?.lessons) ? document.lessons : [];
const expectedNumbers = Array.from({ length: 90 }, (_, index) => index + 61);
const numbers = lessons.map((lesson) => lesson?.number).sort((a, b) => a - b);
if (JSON.stringify(numbers) !== JSON.stringify(expectedNumbers))
  errors.push("The source must contain each lesson 061–150 exactly once.");

const activityIds = new Set();
const assessmentIds = new Set();
const repeatedExplanations = new Map();
let activityCount = 0;
let exampleCount = 0;
let assessmentCount = 0;

for (const lesson of lessons) {
  if (!lesson || typeof lesson !== "object") {
    errors.push("A lesson is missing or malformed.");
    continue;
  }
  const label = `Lesson ${String(lesson.number).padStart(3, "0")}`;
  const level = lesson.number <= 100 ? "B1" : "B2";
  if (lesson.level !== level) errors.push(`${label}: expected level ${level}.`);
  if (typeof lesson.title !== "string" || !lesson.title.trim())
    errors.push(`${label}: title is missing.`);

  const theory = Array.isArray(lesson.theory) ? lesson.theory : [];
  if (theory.length < 3 || theory.length > 5)
    errors.push(`${label}: expected 3–5 theory sections.`);
  for (const [index, section] of theory.entries()) {
    const prefix = `${label}, theory ${index + 1}`;
    for (const key of [
      "rule",
      "simpleExplanation",
      "detailedExplanation",
      "exceptions",
      "commonMistakes",
      "spanishComparison",
    ]) {
      if (typeof section?.[key] !== "string" || !section[key].trim())
        errors.push(`${prefix}: ${key} is missing.`);
    }
    if (
      !Array.isArray(section?.contextualExamples) ||
      !section.contextualExamples.length
    )
      errors.push(`${prefix}: contextual examples are missing.`);
    const comparison = section?.spanishComparison ?? section?.espanol;
    if (typeof comparison === "string" && comparison.trim())
      repeatedExplanations.set(
        comparison,
        (repeatedExplanations.get(comparison) ?? 0) + 1,
      );
  }

  const examples = Array.isArray(lesson.examples) ? lesson.examples : [];
  exampleCount += examples.length;
  if (examples.length < 15 || examples.length > 20)
    errors.push(`${label}: ${examples.length} examples; expected 15–20.`);
  const exampleTexts = examples.map((example) => example?.text?.trim());
  if (exampleTexts.some((text) => !text))
    errors.push(`${label}: an example has no sentence.`);
  if (new Set(exampleTexts).size !== examples.length)
    errors.push(`${label}: duplicate example sentences.`);

  const activities = Array.isArray(lesson.activities) ? lesson.activities : [];
  activityCount += activities.length;
  if (activities.length < 20 || activities.length > 25)
    errors.push(`${label}: ${activities.length} activities; expected 20–25.`);
  for (const [index, activity] of activities.entries()) {
    const prefix = `${label}, activity ${index + 1}`;
    if (typeof activity?.id !== "string" || !activity.id.trim())
      errors.push(`${prefix}: ID is missing.`);
    else if (activityIds.has(activity.id))
      errors.push(`${prefix}: duplicate ID ${activity.id}.`);
    else activityIds.add(activity.id);
    for (const key of ["prompt", "explanation", "difficulty", "topic"]) {
      if (typeof activity?.[key] !== "string" || !activity[key].trim())
        errors.push(`${prefix}: ${key} is missing.`);
    }
    const open = ["writing", "open_transformation", "explain_rule"].includes(
      activity?.type,
    );
    if (open) {
      if (
        !activity?.modelAnswer ||
        !Array.isArray(activity?.rubric) ||
        !activity.rubric.length
      )
        errors.push(
          `${prefix}: open response needs a model answer and rubric.`,
        );
    } else if (activity?.answer == null) {
      errors.push(`${prefix}: correct answer is missing.`);
    }
  }

  const assessment = Array.isArray(lesson.final_assessment)
    ? lesson.final_assessment
    : [];
  assessmentCount += assessment.length;
  if (assessment.length !== 5)
    errors.push(`${label}: expected exactly 5 final-assessment items.`);
  for (const [index, item] of assessment.entries()) {
    const prefix = `${label}, assessment ${index + 1}`;
    if (typeof item?.id !== "string" || !item.id.trim())
      errors.push(`${prefix}: ID is missing.`);
    else if (assessmentIds.has(item.id))
      errors.push(`${prefix}: duplicate ID ${item.id}.`);
    else assessmentIds.add(item.id);
    if (typeof item?.prompt !== "string" || !item.prompt.trim())
      errors.push(`${prefix}: prompt is missing.`);
    if (item?.answer == null && !item?.model_answer && !item?.modelAnswer)
      errors.push(`${prefix}: answer or model answer is missing.`);
    if (!item?.feedback && !item?.explanation)
      errors.push(`${prefix}: feedback is missing.`);
  }

  if (lesson.number === 100 || lesson.number === 150) {
    const sections = Array.isArray(lesson.examSections)
      ? lesson.examSections
      : [];
    const skills = new Set(sections.map((section) => section.skill));
    for (const skill of [
      "reading",
      "grammar",
      "vocabulary",
      "writing",
      "simulation",
    ]) {
      if (!skills.has(skill)) errors.push(`${label}: exam lacks ${skill}.`);
    }
    if (
      !sections.some(
        (section) => section.skill === "reading" && section.passage,
      )
    )
      errors.push(`${label}: reading exam needs an actual passage.`);
  }
}

for (const [text, count] of repeatedExplanations) {
  if (count > 5)
    errors.push(
      `A Spanish explanation is repeated ${count} times: “${text.slice(0, 70)}”.`,
    );
}

console.log(
  `Laboratory audit: ${lessons.length} lessons, ${exampleCount} examples, ${activityCount} activities, ${assessmentCount} assessment items.`,
);
if (errors.length) {
  for (const error of errors.slice(0, 30)) console.error(`✗ ${error}`);
  if (errors.length > 30)
    console.error(`… and ${errors.length - 30} further errors.`);
  console.error(
    `${errors.length} content requirements failed; do not publish.`,
  );
  process.exitCode = 1;
} else {
  console.log("✓ Structural and minimum-content requirements satisfied.");
}
