/**
 * Layers the control panel's changes over the content in the code.
 * Pure functions: the code stays the base, Supabase rows win field by field,
 * new keys add new items, `hidden` retires an item (kept for history).
 */

import type { Coupon, CouponStatus } from "../../coupons/types.ts";
import type { OpenWhenLetter } from "../../open-when/types.ts";
import {
  couponPatchSchema,
  letterPatchSchema,
  type CouponPatch,
  type LetterPatch,
  type OverrideRow,
} from "./content-schemas.ts";

const unlockStatus: Record<NonNullable<CouponPatch["unlock"]>, CouponStatus> = {
  available: "available",
  locked: "locked",
  secret: "undiscovered",
};

export function statusToUnlock(
  status: CouponStatus,
): NonNullable<CouponPatch["unlock"]> {
  return status === "undiscovered"
    ? "secret"
    : status === "locked"
      ? "locked"
      : "available";
}

function applyCouponPatch(coupon: Coupon, patch: CouponPatch): Coupon {
  const description = patch.description ?? coupon.description;
  return {
    ...coupon,
    title: patch.title ?? coupon.title,
    shortDescription: patch.shortDescription ?? coupon.shortDescription,
    description,
    setting: patch.setting ?? coupon.setting,
    rarity: patch.rarity ?? coupon.rarity,
    category: patch.category ?? coupon.category,
    status: patch.unlock ? unlockStatus[patch.unlock] : coupon.status,
    redeemable:
      patch.unlock === undefined
        ? coupon.redeemable
        : patch.unlock === "available",
    unlockCondition:
      patch.unlockCondition === undefined
        ? coupon.unlockCondition
        : patch.unlockCondition,
    secret: patch.unlock ? patch.unlock === "secret" : coupon.secret,
    terms: patch.terms ?? coupon.terms,
  };
}

const DEFAULT_TERMS = [
  "Valid once.",
  "Subject to mutual availability, safety and common sense.",
];

function newCoupons(
  key: string,
  patch: CouponPatch,
  createdAt: string,
): Coupon[] {
  if (
    !patch.title ||
    !patch.shortDescription ||
    !patch.setting ||
    !patch.rarity ||
    !patch.category
  )
    return [];
  const quantity = patch.quantity ?? 1;
  const unlock = patch.unlock ?? "available";
  const base: Coupon = {
    id: key,
    code: patch.code ?? "GV-NEW",
    title: patch.title,
    shortDescription: patch.shortDescription,
    description: patch.description ?? patch.shortDescription,
    category: patch.category,
    rarity: patch.rarity,
    setting: patch.setting,
    type: "standard",
    status: unlockStatus[unlock],
    redeemable: unlock === "available",
    challengeId: null,
    unlockCondition: patch.unlockCondition ?? null,
    secret: unlock === "secret",
    createdAt: patch.createdAt ?? createdAt,
    redeemedAt: null,
    terms: patch.terms ?? DEFAULT_TERMS,
  };
  if (quantity === 1) return [base];
  return Array.from({ length: quantity }, (_, index) => ({
    ...base,
    id: `${key}-${index + 1}`,
    code: `${base.code}-${index + 1}`,
    series: { index: index + 1, total: quantity },
  }));
}

export function mergeCoupons(
  base: readonly Coupon[],
  rows: readonly OverrideRow[],
): Coupon[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const merged: Coupon[] = base.map((coupon) => {
    const row = byKey.get(coupon.id);
    if (!row) return coupon;
    const parsed = couponPatchSchema.safeParse(row.data);
    const patched = parsed.success
      ? applyCouponPatch(coupon, parsed.data)
      : coupon;
    return row.hidden ? { ...patched, retired: true } : patched;
  });
  const known = new Set(base.map((coupon) => coupon.id));
  for (const row of rows) {
    if (known.has(row.key)) continue;
    const parsed = couponPatchSchema.safeParse(row.data);
    if (!parsed.success) continue;
    for (const coupon of newCoupons(row.key, parsed.data, row.createdAt))
      if (!known.has(coupon.id))
        merged.push(row.hidden ? { ...coupon, retired: true } : coupon);
  }
  return merged;
}

function applyLetterPatch(
  letter: OpenWhenLetter,
  patch: LetterPatch,
): OpenWhenLetter {
  return {
    ...letter,
    title: patch.title ?? letter.title,
    preview: patch.preview ?? letter.preview,
    salutation: patch.salutation ?? letter.salutation,
    paragraphs: patch.paragraphs ?? letter.paragraphs,
    signoff: patch.signoff ?? letter.signoff,
    postscript:
      patch.postscript === undefined ? letter.postscript : patch.postscript,
    annotation: patch.annotation ?? letter.annotation,
    mood: patch.mood ?? letter.mood,
    envelope: {
      tone: patch.tone ?? letter.envelope.tone,
      mark: patch.mark ?? letter.envelope.mark,
      rotation: letter.envelope.rotation,
    },
  };
}

export interface MergedLetter extends OpenWhenLetter {
  readonly hidden: boolean;
  readonly custom: boolean;
}

export function mergeLetters(
  base: readonly OpenWhenLetter[],
  rows: readonly OverrideRow[],
): MergedLetter[] {
  const byKey = new Map(rows.map((row) => [row.key, row]));
  const merged: MergedLetter[] = base.map((letter) => {
    const row = byKey.get(letter.slug);
    if (!row) return { ...letter, hidden: false, custom: false };
    const parsed = letterPatchSchema.safeParse(row.data);
    return {
      ...(parsed.success ? applyLetterPatch(letter, parsed.data) : letter),
      hidden: row.hidden,
      custom: false,
    };
  });
  const known = new Set(base.map((letter) => letter.slug));
  rows
    .filter((row) => !known.has(row.key))
    .forEach((row, index) => {
      const parsed = letterPatchSchema.safeParse(row.data);
      if (!parsed.success) return;
      const patch = parsed.data;
      if (
        !patch.title ||
        !patch.preview ||
        !patch.salutation ||
        !patch.paragraphs ||
        !patch.signoff
      )
        return;
      merged.push({
        slug: row.key,
        title: patch.title,
        preview: patch.preview,
        salutation: patch.salutation,
        paragraphs: patch.paragraphs,
        signoff: patch.signoff,
        postscript: patch.postscript ?? null,
        annotation: patch.annotation ?? "",
        mood: patch.mood ?? "tender",
        envelope: {
          tone: patch.tone ?? "ivory",
          mark: patch.mark ?? "kiss",
          rotation: index % 2 === 0 ? -2 : 2,
        },
        rewardId: null,
        hidden: row.hidden,
        custom: true,
      });
    });
  return merged;
}
