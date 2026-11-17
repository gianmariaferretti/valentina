"use server";

import { randomBytes } from "node:crypto";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { creditSiteKisses } from "@/features/kisses/repositories/kisses";
import { PRIVATE_PHOTO_BUCKET } from "@/features/media/lib/private-media";
import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import { MAX_PHOTO_BYTES, photoKind } from "../lib/photo";
import { listItemInputSchema, rewardSchema } from "../lib/schemas";

export interface ListActionResult {
  readonly ok: boolean;
  readonly message: string;
}

const idSchema = z.string().uuid();
const expired: ListActionResult = {
  ok: false,
  message: "Your private session has expired.",
};

function refresh() {
  revalidatePath("/next-time");
  revalidatePath("/bucket-list");
}

/** Valentina ticks or unticks a list item. Rewards are paid once, ever. */
export async function toggleListItem(
  id: unknown,
  done: unknown,
): Promise<ListActionResult> {
  if (!(await hasValidAccessSession())) return expired;
  const parsedId = idSchema.safeParse(id);
  const parsedDone = z.boolean().safeParse(done);
  if (!parsedId.success || !parsedDone.success)
    return { ok: false, message: "That item does not exist." };
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("complete_life_item", {
      p_user_id: userId,
      p_id: parsedId.data,
      p_done: parsedDone.data,
      p_by: "valentina",
    });
    if (error) throw error;
    const row = data?.[0];
    let message = parsedDone.data ? "Done! ✓" : "Unticked.";
    if (row?.newly_rewarded) {
      const reward = rewardSchema.safeParse(row.reward);
      if (reward.success && "kisses" in reward.data) {
        // Keyed: paid once ever. The 💋 toast comes from the kiss listener.
        await creditSiteKisses({
          key: `bucket:${parsedId.data}`,
          amount: reward.data.kisses,
          label: "Bucket list: one more thing done together",
        });
        message = "Done! ✓";
      } else if (reward.success)
        message = "Done! A coupon just unlocked in your wallet 🎟️";
      revalidatePath("/coupons");
    }
    refresh();
    return { ok: true, message };
  } catch (error) {
    reportPersistenceFailure("toggle list item", error);
    return { ok: false, message: "Couldn't save that tick. Try again." };
  }
}

/** Valentina proposes something; Gianmaria approves it in the panel. */
export async function proposeListItem(
  list: unknown,
  form: FormData,
): Promise<ListActionResult> {
  if (!(await hasValidAccessSession())) return expired;
  const parsedList = z.enum(["todo", "bucket"]).safeParse(list);
  const parsed = listItemInputSchema.safeParse({
    title: form.get("title") ?? "",
    notes: form.get("notes") ?? undefined,
    category: form.get("category") ?? undefined,
  });
  if (!parsedList.success || !parsed.success)
    return { ok: false, message: "Give it a title (max 140 characters)." };
  try {
    const { client } = getSupabaseServerContext();
    const { error } = await client.from("life_lists").insert({
      list: parsedList.data,
      ...parsed.data,
      status: "proposed",
      proposed_by: "valentina",
      sort: 9999,
    });
    if (error) throw error;
    refresh();
    revalidatePath("/admin", "layout");
    return {
      ok: true,
      message: "Proposed! Gianmaria has to approve it (he will).",
    };
  } catch (error) {
    reportPersistenceFailure("propose list item", error);
    return { ok: false, message: "Couldn't save the proposal. Try again." };
  }
}

/** A photo for a bucket-list item, into the private bucket (never public). */
export async function uploadBucketPhoto(
  id: unknown,
  form: FormData,
): Promise<ListActionResult> {
  if (!(await hasValidAccessSession())) return expired;
  const parsedId = idSchema.safeParse(id);
  const file = form.get("photo");
  if (!parsedId.success || !(file instanceof File))
    return { ok: false, message: "Choose a photo first." };
  if (file.size === 0 || file.size > MAX_PHOTO_BYTES)
    return {
      ok: false,
      message: "That photo is too big (max 2.5 MB after resizing).",
    };
  const bytes = new Uint8Array(await file.arrayBuffer());
  const kind = photoKind(bytes);
  if (!kind)
    return { ok: false, message: "Only photos (JPEG or WebP), please." };
  try {
    const { client } = getSupabaseServerContext();
    const { data: item, error: itemError } = await client
      .from("life_lists")
      .select("photo_object")
      .eq("id", parsedId.data)
      .eq("list", "bucket")
      .maybeSingle();
    if (itemError) throw itemError;
    if (!item) return { ok: false, message: "That item does not exist." };
    const { data: bucket } =
      await client.storage.getBucket(PRIVATE_PHOTO_BUCKET);
    if (!bucket || bucket.public)
      throw new Error("Private photo storage unavailable");
    const object = `bucket-list/${parsedId.data}-${randomBytes(4).toString("hex")}.${kind}`;
    const { error: uploadError } = await client.storage
      .from(PRIVATE_PHOTO_BUCKET)
      .upload(object, bytes, {
        contentType: kind === "webp" ? "image/webp" : "image/jpeg",
        upsert: false,
      });
    if (uploadError) throw uploadError;
    const { error } = await client
      .from("life_lists")
      .update({ photo_object: object })
      .eq("id", parsedId.data);
    if (error) throw error;
    if (item.photo_object)
      await client.storage
        .from(PRIVATE_PHOTO_BUCKET)
        .remove([item.photo_object]);
    refresh();
    return { ok: true, message: "Photo added to the scrapbook 📸" };
  } catch (error) {
    reportPersistenceFailure("upload bucket photo", error);
    return { ok: false, message: "The photo couldn't be saved. Try again." };
  }
}
