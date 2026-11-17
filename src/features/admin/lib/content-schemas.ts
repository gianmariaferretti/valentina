/**
 * What the control panel may store on top of the content in the code.
 * Shared by the admin forms (validation on the server) and the loaders
 * (a malformed row is ignored, never shown).
 */

import { z } from "zod";

import {
  couponCategories,
  couponRarities,
  couponSettings,
} from "../../coupons/types.ts";

export const contentKeySchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{0,99}$/,
    "Solo lettere minuscole, numeri e trattini.",
  );

const text = (max: number) => z.string().trim().min(1).max(max);

export const couponUnlockModes = ["available", "locked", "secret"] as const;

/** Every field optional: an edit of a code coupon stores only what changed. */
export const couponPatchSchema = z
  .object({
    title: text(80),
    shortDescription: text(220),
    description: text(1200),
    setting: z.enum(couponSettings),
    rarity: z.enum(couponRarities),
    category: z.enum(couponCategories),
    unlock: z.enum(couponUnlockModes),
    unlockCondition: z.string().trim().max(160).nullable(),
    terms: z.array(text(200)).max(8),
    /** Coupons created in the panel only. */
    quantity: z.number().int().min(1).max(10),
    code: z.string().regex(/^GV-[A-Z0-9]{2,8}$/),
    createdAt: z.string().datetime(),
  })
  .partial();

export type CouponPatch = z.infer<typeof couponPatchSchema>;

/** A coupon created in the panel needs the essentials. */
export const newCouponSchema = couponPatchSchema.required({
  title: true,
  shortDescription: true,
  setting: true,
  rarity: true,
  category: true,
  unlock: true,
  quantity: true,
});

export const letterMoods = ["playful", "tender", "steady"] as const;
export const envelopeTones = [
  "ivory",
  "rose",
  "blue",
  "kraft",
  "burgundy",
] as const;
export const envelopeMarks = [
  "air-mail",
  "confidential",
  "kiss",
  "priority",
] as const;

export const letterPatchSchema = z
  .object({
    title: text(80),
    preview: text(160),
    salutation: text(80),
    paragraphs: z.array(text(2000)).min(1).max(12),
    signoff: text(120),
    postscript: z.string().trim().max(300).nullable(),
    annotation: z.string().trim().max(80),
    mood: z.enum(letterMoods),
    tone: z.enum(envelopeTones),
    mark: z.enum(envelopeMarks),
    order: z.number().int().min(0).max(999),
  })
  .partial();

export type LetterPatch = z.infer<typeof letterPatchSchema>;

export const newLetterSchema = letterPatchSchema.required({
  title: true,
  preview: true,
  salutation: true,
  paragraphs: true,
  signoff: true,
});

export const curtainMessageSchema = z.object({
  paragraphs: z.array(text(2000)).min(1).max(12),
  signoff: text(120),
});

export type CurtainMessage = z.infer<typeof curtainMessageSchema>;

export interface OverrideRow {
  readonly key: string;
  readonly data: unknown;
  readonly hidden: boolean;
  readonly createdAt: string;
}
