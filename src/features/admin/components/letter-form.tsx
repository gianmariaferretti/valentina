"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import {
  envelopeMarks,
  envelopeTones,
  letterMoods,
} from "../lib/content-schemas";
import { buttonClass, Field, inputClass, type ActionResult } from "./admin-ui";

export interface LetterFormValues {
  title: string;
  preview: string;
  salutation: string;
  paragraphs: string;
  signoff: string;
  postscript: string;
  annotation: string;
  mood: string;
  tone: string;
  mark: string;
}

export function LetterForm({
  initial,
  submit,
  isNew,
}: {
  initial: LetterFormValues;
  submit: (form: FormData) => Promise<ActionResult>;
  isNew: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const select = (name: keyof LetterFormValues, options: readonly string[]) => (
    <select className={inputClass} defaultValue={initial[name]} name={name}>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await submit(form).catch(() => ({
            ok: false,
            message: "Connessione persa. Riprova.",
          }));
          if (result.ok) {
            toast.success(result.message);
            router.push("/admin/lettere");
            router.refresh();
          } else toast.error(result.message);
        });
      }}
    >
      <Field hint="Si legge come “Open when …” (in inglese)." label="Titolo">
        <input
          className={inputClass}
          defaultValue={initial.title}
          maxLength={80}
          name="title"
          required
        />
      </Field>
      <Field label="Anteprima sulla busta">
        <input
          className={inputClass}
          defaultValue={initial.preview}
          maxLength={160}
          name="preview"
          required
        />
      </Field>
      <Field label="Saluto iniziale">
        <input
          className={inputClass}
          defaultValue={initial.salutation}
          maxLength={80}
          name="salutation"
          required
        />
      </Field>
      <Field
        hint="Una riga vuota tra un paragrafo e l'altro. ==Così== per l'evidenziatore."
        label="Testo"
      >
        <textarea
          className={`${inputClass} min-h-56`}
          defaultValue={initial.paragraphs}
          name="paragraphs"
          required
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Firma">
          <input
            className={inputClass}
            defaultValue={initial.signoff}
            maxLength={120}
            name="signoff"
            required
          />
        </Field>
        <Field label="P.S. (facoltativo)">
          <input
            className={inputClass}
            defaultValue={initial.postscript}
            maxLength={300}
            name="postscript"
          />
        </Field>
      </div>
      <Field label="Nota a mano sulla busta (facoltativa)">
        <input
          className={inputClass}
          defaultValue={initial.annotation}
          maxLength={80}
          name="annotation"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-3">
        <Field label="Tono">{select("mood", letterMoods)}</Field>
        <Field label="Colore busta">{select("tone", envelopeTones)}</Field>
        <Field label="Timbro">{select("mark", envelopeMarks)}</Field>
      </div>
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvo…" : isNew ? "Crea lettera" : "Salva lettera"}
      </button>
    </form>
  );
}
