"use client";

import { useState } from "react";

import {
  buttonClass,
  inputClass,
  useAdminAction,
  type ActionResult,
} from "./admin-ui";

/** "+ / −" kisses, or "kisses paid", with a number field. */
export function NumberAction({
  label,
  action,
  undo,
  buttons,
}: {
  label: string;
  action: (value: number) => Promise<ActionResult>;
  undo?: (value: number) => Promise<ActionResult>;
  buttons: { text: string; sign: 1 | -1; tone?: "primary" | "ghost" }[];
}) {
  const [value, setValue] = useState("10");
  const { pending, run } = useAdminAction();
  const amount = Math.abs(Math.trunc(Number(value) || 0));
  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold" htmlFor={`n-${label}`}>
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        <input
          className={`${inputClass} w-28`}
          id={`n-${label}`}
          inputMode="numeric"
          min={1}
          onChange={(event) => setValue(event.target.value)}
          type="number"
          value={value}
        />
        {buttons.map((button) => (
          <button
            className={buttonClass(button.tone ?? "ghost")}
            disabled={pending || amount < 1}
            key={button.text}
            onClick={() =>
              run(
                () => action(button.sign * amount),
                undo ? () => undo(button.sign * amount) : undefined,
              )
            }
            type="button"
          >
            {button.text}
          </button>
        ))}
      </div>
    </div>
  );
}

export function CurtainMessageForm({
  paragraphs,
  signoff,
  save,
}: {
  paragraphs: readonly string[];
  signoff: string;
  save: (form: FormData) => Promise<ActionResult>;
}) {
  const { pending, run } = useAdminAction();
  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        run(() => save(form));
      }}
    >
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold">Messaggio finale (in inglese)</span>
        <textarea
          className={`${inputClass} min-h-40`}
          defaultValue={paragraphs.join("\n\n")}
          name="paragraphs"
        />
        <span className="text-xs text-[var(--muted)]">
          Lascia una riga vuota tra un paragrafo e l&apos;altro.
        </span>
      </label>
      <label className="grid gap-1.5 text-sm">
        <span className="font-semibold">Firma</span>
        <input
          className={inputClass}
          defaultValue={signoff}
          maxLength={120}
          name="signoff"
        />
      </label>
      <button
        className={buttonClass("primary", "w-full sm:w-auto")}
        disabled={pending}
        type="submit"
      >
        {pending ? "Salvo…" : "Salva messaggio"}
      </button>
    </form>
  );
}
