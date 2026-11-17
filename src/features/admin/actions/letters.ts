"use server";

import { z } from "zod";

import { openWhenLetters } from "@/data/open-when";

import {
  contentKeySchema,
  letterPatchSchema,
  newLetterSchema,
} from "../lib/content-schemas";
import {
  deleteOverride,
  loadAllLetters,
  setOverrideHidden,
  upsertOverride,
} from "../repositories/content";
import { done, failed, withAdmin, type AdminResult } from "./guard";

function formPatch(form: FormData) {
  const value = (name: string) => {
    const raw = form.get(name);
    return typeof raw === "string" ? raw : undefined;
  };
  return {
    title: value("title"),
    preview: value("preview"),
    salutation: value("salutation"),
    paragraphs: value("paragraphs")
      ?.split(/\n\s*\n/)
      .map((paragraph) => paragraph.trim())
      .filter(Boolean),
    signoff: value("signoff"),
    postscript: value("postscript")?.trim() || null,
    annotation: value("annotation")?.trim() ?? undefined,
    mood: value("mood"),
    tone: value("tone"),
    mark: value("mark"),
  };
}

function issues(error: z.ZodError): string {
  const first = error.issues[0];
  return `Controlla “${first?.path.join(".") ?? "campo"}”: ${first?.message ?? "valore non valido"}`;
}

export async function saveLetter(
  slug: string,
  form: FormData,
): Promise<AdminResult> {
  return withAdmin("save letter", async () => {
    const key = contentKeySchema.parse(slug);
    const parsed = letterPatchSchema.safeParse(formPatch(form));
    if (!parsed.success) return failed(issues(parsed.error));
    await upsertOverride("letter", key, parsed.data);
    return done("Lettera salvata 💌");
  });
}

export async function createLetter(
  form: FormData,
): Promise<AdminResult & { slug?: string }> {
  let slug: string | undefined;
  const result = await withAdmin("create letter", async () => {
    const parsed = newLetterSchema.safeParse(formPatch(form));
    if (!parsed.success) return failed(issues(parsed.error));
    const base =
      parsed.data.title
        .normalize("NFKD")
        .replace(/[̀-ͯ]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 60) || "letter";
    const taken = new Set(
      (await loadAllLetters()).map((letter) => letter.slug),
    );
    let candidate = base;
    for (let n = 2; taken.has(candidate); n++) candidate = `${base}-${n}`;
    await upsertOverride(
      "letter",
      contentKeySchema.parse(candidate),
      parsed.data,
    );
    slug = candidate;
    return done("Lettera creata 💌");
  });
  return { ...result, slug };
}

export async function setLetterHidden(
  slug: string,
  hidden: boolean,
): Promise<AdminResult> {
  return withAdmin("hide letter", async () => {
    await setOverrideHidden("letter", contentKeySchema.parse(slug), hidden);
    return done(
      hidden ? "Lettera nascosta 🙈" : "Lettera di nuovo visibile 👀",
    );
  });
}

export async function restoreOriginalLetter(
  slug: string,
): Promise<AdminResult> {
  return withAdmin("restore letter", async () => {
    const key = contentKeySchema.parse(slug);
    if (!openWhenLetters.some((letter) => letter.slug === key))
      return failed("Questa lettera esiste solo nel pannello.");
    await deleteOverride("letter", key);
    return done("Tornata alla versione originale");
  });
}
