/**
 * The words of /our-story, one short chapter per place. Everything here is
 * an OBVIOUS PLACEHOLDER: Gianmaria replaces it from the panel
 * (Pannello → La nostra storia) or here in the code. Places, dates and
 * photos come from src/data/places.ts and the gallery.
 */

export interface StoryChapterWords {
  readonly title: string;
  readonly text: string;
}

export interface StoryWords {
  readonly intro: string;
  readonly chapters: Readonly<Record<string, StoryChapterWords>>;
}

const placeholder = (city: string): StoryChapterWords => ({
  title: `[Placeholder] The ${city} chapter`,
  text: `[Placeholder text — Gianmaria writes this one.] Two or three sentences about ${city}: what happened, what we ate, the small detail only we remember. Lorem ipsum until then.`,
});

export const ourStoryDefaults: StoryWords = {
  intro:
    "[Placeholder intro] Year One, told one place at a time. Scroll slowly — the route draws itself.",
  chapters: {
    london: placeholder("London"),
    rome: placeholder("Rome"),
    paris: placeholder("Paris"),
    hamburg: placeholder("Hamburg"),
    brussels: placeholder("Brussels"),
    "polignano-a-mare": placeholder("Polignano a Mare"),
    matera: placeholder("Matera"),
    accettura: placeholder("Accettura"),
    "amalfi-coast": placeholder("Amalfi Coast"),
    bari: placeholder("Bari"),
  },
};
