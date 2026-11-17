import "server-only";

import { revalidatePath, revalidateTag, unstable_cache } from "next/cache";
import { cache } from "react";

import {
  gianmariaCurtainMessage,
  gianmariaCurtainSignoff,
} from "@/data/casino-curtain";
import { coupons as codeCoupons } from "@/data/coupons";
import { openWhenLetters } from "@/data/open-when";
import type { Coupon } from "@/features/coupons/types";
import type { Json } from "@/lib/supabase/database.types";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import {
  curtainMessageSchema,
  type CurtainMessage,
  type OverrideRow,
} from "../lib/content-schemas";
import {
  mergeCoupons,
  mergeLetters,
  type MergedLetter,
} from "../lib/merge-content";

export type ContentKind = "coupon" | "letter" | "setting";

const tag = (kind: ContentKind) => `content:${kind}`;

async function fetchRows(kind: ContentKind): Promise<OverrideRow[]> {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("content_overrides")
    .select("key,data,hidden,created_at")
    .eq("kind", kind)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    key: row.key,
    data: row.data,
    hidden: row.hidden,
    createdAt: row.created_at,
  }));
}

/**
 * Panel changes, cached on the server and invalidated by tag whenever the
 * panel saves. If Supabase is unreachable the code content is used as is.
 */
export const loadOverrideRows = cache(
  async (kind: ContentKind): Promise<readonly OverrideRow[]> => {
    try {
      return await unstable_cache(() => fetchRows(kind), ["content", kind], {
        tags: [tag(kind)],
        revalidate: 3600,
      })();
    } catch {
      return [];
    }
  },
);

export const loadCouponCatalogue = cache(async (): Promise<Coupon[]> =>
  mergeCoupons(codeCoupons, await loadOverrideRows("coupon")),
);

export async function findCatalogueCoupon(
  id: string,
): Promise<Coupon | undefined> {
  return (await loadCouponCatalogue()).find((coupon) => coupon.id === id);
}

/** Every letter, hidden ones included (the panel). */
export const loadAllLetters = cache(async (): Promise<MergedLetter[]> =>
  mergeLetters(openWhenLetters, await loadOverrideRows("letter")),
);

/** Letters Valentina can see. */
export async function loadVisibleLetters(): Promise<MergedLetter[]> {
  return (await loadAllLetters()).filter((letter) => !letter.hidden);
}

export async function findVisibleLetter(
  slug: string,
): Promise<MergedLetter | undefined> {
  return (await loadVisibleLetters()).find((letter) => letter.slug === slug);
}

export const defaultCurtainMessage: CurtainMessage = {
  paragraphs: [...gianmariaCurtainMessage],
  signoff: gianmariaCurtainSignoff,
};

export async function loadCurtainMessage(): Promise<CurtainMessage> {
  const row = (await loadOverrideRows("setting")).find(
    (candidate) => candidate.key === "curtain-message",
  );
  const parsed = curtainMessageSchema.safeParse(row?.data);
  return parsed.success ? parsed.data : defaultCurtainMessage;
}

export async function loadSetting(key: string): Promise<unknown> {
  return (await loadOverrideRows("setting")).find((row) => row.key === key)
    ?.data;
}

// ------------------------------------------------------------- writes

function invalidate(kind: ContentKind) {
  revalidateTag(tag(kind), { expire: 0 });
  // Pages showing this content render it fresh on the next visit.
  revalidatePath("/", "layout");
}

export async function upsertOverride(
  kind: ContentKind,
  key: string,
  data: Record<string, unknown>,
  hidden?: boolean,
): Promise<void> {
  const { client } = getSupabaseServerContext();
  const { error } = await client.from("content_overrides").upsert(
    {
      kind,
      key,
      data: data as Json,
      ...(hidden === undefined ? {} : { hidden }),
    },
    { onConflict: "kind,key" },
  );
  if (error) throw error;
  invalidate(kind);
}

export async function setOverrideHidden(
  kind: ContentKind,
  key: string,
  hidden: boolean,
): Promise<void> {
  const { client } = getSupabaseServerContext();
  const { error } = await client
    .from("content_overrides")
    .upsert(
      { kind, key, hidden },
      { onConflict: "kind,key", ignoreDuplicates: false },
    );
  if (error) throw error;
  invalidate(kind);
}

export async function deleteOverride(
  kind: ContentKind,
  key: string,
): Promise<void> {
  const { client } = getSupabaseServerContext();
  const { error } = await client
    .from("content_overrides")
    .delete()
    .eq("kind", kind)
    .eq("key", key);
  if (error) throw error;
  invalidate(kind);
}
