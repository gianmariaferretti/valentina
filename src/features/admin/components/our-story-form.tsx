"use client";

import {
  buttonClass,
  inputClass,
  useAdminAction,
  type ActionResult,
} from "./admin-ui";

/** The words of /our-story: intro, then title and text for each place. */
export function OurStoryForm({
  intro,
  chapters,
  save,
}: {
  intro: string;
  chapters: readonly {
    slug: string;
    city: string;
    title: string;
    text: string;
  }[];
  save: (form: FormData) => Promise<ActionResult>;
}) {
  const { pending, run } = useAdminAction();
  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run(() => save(form));
      }}
    >
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold">Introduzione (in inglese)</span>
        <textarea
          className={`${inputClass} min-h-20`}
          defaultValue={intro}
          maxLength={600}
          name="intro"
          required
        />
      </label>
      {chapters.map((chapter) => (
        <fieldset
          className="grid gap-2 rounded-2xl border border-[var(--line-strong)] p-3"
          key={chapter.slug}
        >
          <legend className="px-1 text-sm font-semibold">{chapter.city}</legend>
          <input
            aria-label={`Titolo · ${chapter.city}`}
            className={inputClass}
            defaultValue={chapter.title}
            maxLength={90}
            name={`title:${chapter.slug}`}
            required
          />
          <textarea
            aria-label={`Testo · ${chapter.city}`}
            className={`${inputClass} min-h-24`}
            defaultValue={chapter.text}
            maxLength={900}
            name={`text:${chapter.slug}`}
            required
          />
        </fieldset>
      ))}
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvo…" : "Salva la storia"}
      </button>
    </form>
  );
}
