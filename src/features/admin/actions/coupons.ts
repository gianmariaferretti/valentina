"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { coupons as codeCoupons } from "@/data/coupons";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import {
  contentKeySchema,
  couponPatchSchema,
  newCouponSchema,
} from "../lib/content-schemas";
import {
  deleteOverride,
  loadCouponCatalogue,
  loadOverrideRows,
  setOverrideHidden,
  upsertOverride,
} from "../repositories/content";
import { done, failed, withAdmin, type AdminResult } from "./guard";

const couponIdSchema = z.string().regex(/^[a-z0-9-]{1,100}$/);

function refresh() {
  revalidatePath("/", "layout");
}

async function state(couponId: string) {
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client
    .from("coupon_state")
    .select("unlocked_at, redeemed_at")
    .eq("user_id", userId)
    .eq("coupon_id", couponId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function markDelivered(couponId: string): Promise<AdminResult> {
  return withAdmin("mark delivered", async () => {
    const id = couponIdSchema.parse(couponId);
    const { client, userId } = getSupabaseServerContext();
    const { error } = await client
      .from("coupon_deliveries")
      .upsert(
        { user_id: userId, coupon_id: id },
        { onConflict: "user_id,coupon_id" },
      );
    if (error) throw error;
    refresh();
    return done("Segnato come consegnato ✅");
  });
}

export async function unmarkDelivered(couponId: string): Promise<AdminResult> {
  return withAdmin("unmark delivered", async () => {
    const id = couponIdSchema.parse(couponId);
    const { client, userId } = getSupabaseServerContext();
    const { error } = await client
      .from("coupon_deliveries")
      .delete()
      .eq("user_id", userId)
      .eq("coupon_id", id);
    if (error) throw error;
    refresh();
    return done("Consegna annullata");
  });
}

export async function unlockCoupon(couponId: string): Promise<AdminResult> {
  return withAdmin("unlock coupon", async () => {
    const id = couponIdSchema.parse(couponId);
    const { client, userId } = getSupabaseServerContext();
    const current = await state(id);
    if (current?.unlocked_at) return done("Era già sbloccato");
    const { error } = await client.from("coupon_state").upsert(
      {
        user_id: userId,
        coupon_id: id,
        unlocked_at: new Date().toISOString(),
      },
      { onConflict: "user_id,coupon_id" },
    );
    if (error) throw error;
    refresh();
    return done("Sbloccato: ora lo vede nel portafoglio 🔓");
  });
}

export async function lockCoupon(couponId: string): Promise<AdminResult> {
  return withAdmin("lock coupon", async () => {
    const id = couponIdSchema.parse(couponId);
    const current = await state(id);
    if (current?.redeemed_at)
      return failed("È già stato usato: azzera prima il riscatto.");
    const { client, userId } = getSupabaseServerContext();
    const { error } = await client
      .from("coupon_state")
      .update({ unlocked_at: null })
      .eq("user_id", userId)
      .eq("coupon_id", id);
    if (error) throw error;
    refresh();
    return done("Bloccato di nuovo 🔒");
  });
}

/** Clears one redemption. The previous date is returned for "Annulla". */
export async function resetRedemption(
  couponId: string,
): Promise<AdminResult & { previous?: string }> {
  let previous: string | undefined;
  const result = await withAdmin("reset redemption", async () => {
    const id = couponIdSchema.parse(couponId);
    const current = await state(id);
    if (!current?.redeemed_at) return done("Non era stato usato");
    previous = current.redeemed_at;
    const { client, userId } = getSupabaseServerContext();
    const [reset, delivery] = await Promise.all([
      client
        .from("coupon_state")
        .update({ redeemed_at: null })
        .eq("user_id", userId)
        .eq("coupon_id", id),
      client
        .from("coupon_deliveries")
        .delete()
        .eq("user_id", userId)
        .eq("coupon_id", id),
    ]);
    if (reset.error) throw reset.error;
    if (delivery.error) throw delivery.error;
    refresh();
    return done("Riscatto azzerato: il buono è di nuovo usabile");
  });
  return { ...result, previous };
}

export async function restoreRedemption(
  couponId: string,
  redeemedAt: string,
): Promise<AdminResult> {
  return withAdmin("restore redemption", async () => {
    const id = couponIdSchema.parse(couponId);
    const at = z.string().datetime({ offset: true }).parse(redeemedAt);
    const { client, userId } = getSupabaseServerContext();
    const { error } = await client
      .from("coupon_state")
      .upsert(
        { user_id: userId, coupon_id: id, unlocked_at: at, redeemed_at: at },
        { onConflict: "user_id,coupon_id" },
      );
    if (error) throw error;
    refresh();
    return done("Riscatto ripristinato");
  });
}

export async function resetAllRedemptions(): Promise<AdminResult> {
  return withAdmin("reset all redemptions", async () => {
    const { client, userId } = getSupabaseServerContext();
    const [reset, deliveries] = await Promise.all([
      client
        .from("coupon_state")
        .update({ redeemed_at: null })
        .eq("user_id", userId)
        .not("redeemed_at", "is", null),
      client.from("coupon_deliveries").delete().eq("user_id", userId),
    ]);
    if (reset.error) throw reset.error;
    if (deliveries.error) throw deliveries.error;
    refresh();
    return done("Tutti i riscatti sono stati azzerati");
  });
}

export async function setCouponHidden(
  key: string,
  hidden: boolean,
): Promise<AdminResult> {
  return withAdmin("hide coupon", async () => {
    await setOverrideHidden("coupon", contentKeySchema.parse(key), hidden);
    return done(
      hidden ? "Nascosto dal portafoglio 🙈" : "Di nuovo visibile 👀",
    );
  });
}

export async function restoreOriginalCoupon(key: string): Promise<AdminResult> {
  return withAdmin("restore coupon", async () => {
    const id = contentKeySchema.parse(key);
    if (!codeCoupons.some((coupon) => coupon.id === id))
      return failed("Questo buono esiste solo nel pannello.");
    await deleteOverride("coupon", id);
    return done("Tornato alla versione originale");
  });
}

function formPatch(form: FormData) {
  const value = (name: string) => {
    const raw = form.get(name);
    return typeof raw === "string" ? raw : undefined;
  };
  const terms = value("terms")
    ?.split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const quantity = value("quantity");
  return {
    title: value("title"),
    shortDescription: value("shortDescription"),
    description: value("description") || undefined,
    setting: value("setting"),
    rarity: value("rarity"),
    category: value("category"),
    unlock: value("unlock"),
    unlockCondition: value("unlockCondition")?.trim() || null,
    terms: terms && terms.length > 0 ? terms : undefined,
    quantity: quantity ? Number(quantity) : undefined,
  };
}

function issues(error: z.ZodError): string {
  const first = error.issues[0];
  return `Controlla “${first?.path.join(".") ?? "campo"}”: ${first?.message ?? "valore non valido"}`;
}

export async function saveCoupon(
  key: string,
  form: FormData,
): Promise<AdminResult> {
  return withAdmin("save coupon", async () => {
    const id = contentKeySchema.parse(key);
    const parsed = couponPatchSchema.safeParse(formPatch(form));
    if (!parsed.success) return failed(issues(parsed.error));
    const existing = (await loadOverrideRows("coupon")).find(
      (row) => row.key === id,
    );
    const previous =
      existing && typeof existing.data === "object" && existing.data
        ? (existing.data as Record<string, unknown>)
        : {};
    await upsertOverride("coupon", id, { ...previous, ...parsed.data });
    return done("Buono salvato ✅");
  });
}

function slugify(title: string): string {
  return title
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function createCoupon(
  form: FormData,
): Promise<AdminResult & { id?: string }> {
  let id: string | undefined;
  const result = await withAdmin("create coupon", async () => {
    const parsed = newCouponSchema.safeParse(formPatch(form));
    if (!parsed.success) return failed(issues(parsed.error));
    const catalogue = await loadCouponCatalogue();
    const taken = new Set(catalogue.map((coupon) => coupon.id));
    const rows = await loadOverrideRows("coupon");
    for (const row of rows) taken.add(row.key);
    const base = slugify(parsed.data.title) || "buono";
    let candidate = base;
    for (
      let n = 2;
      taken.has(candidate) ||
      [...taken].some((t) => t.startsWith(`${candidate}-`));
      n++
    )
      candidate = `${base}-${n}`;
    const customCount = rows.filter(
      (row) => !codeCoupons.some((c) => c.id === row.key),
    ).length;
    const code = `GV-P${String(customCount + 1).padStart(2, "0")}`;
    await upsertOverride("coupon", contentKeySchema.parse(candidate), {
      ...parsed.data,
      code,
      createdAt: new Date().toISOString(),
    });
    id = candidate;
    return done("Buono creato 🎟️");
  });
  return { ...result, id };
}
