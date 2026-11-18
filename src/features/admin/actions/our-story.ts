"use server";

import { revalidatePath } from "next/cache";

import { storyWordsSchema } from "@/features/our-story/lib/story";

import { deleteOverride, upsertOverride } from "../repositories/content";
import { done, failed, withAdmin, type AdminResult } from "./guard";

/** Saves the words of /our-story: the intro and each chapter's title and text. */
export async function saveOurStory(form: FormData): Promise<AdminResult> {
  return withAdmin("our story", async () => {
    const chapters: Record<string, { title: string; text: string }> = {};
    for (const [key, value] of form.entries()) {
      const match = /^title:(.+)$/.exec(key);
      if (!match) continue;
      chapters[match[1]] = {
        title: String(value),
        text: String(form.get(`text:${match[1]}`) ?? ""),
      };
    }
    const parsed = storyWordsSchema.safeParse({
      intro: String(form.get("intro") ?? ""),
      chapters,
    });
    if (!parsed.success)
      return failed("Ogni capitolo vuole un titolo e un testo (in inglese).");
    await upsertOverride("setting", "our-story", parsed.data);
    revalidatePath("/our-story");
    return done("Storia salvata 📖");
  });
}

export async function restoreOurStory(): Promise<AdminResult> {
  return withAdmin("restore our story", async () => {
    await deleteOverride("setting", "our-story");
    revalidatePath("/our-story");
    return done("Tornati ai testi del codice");
  });
}
