import { z } from "zod";

/** What Gianmaria chose in the panel (Notifiche). */
export const notificationSettingsSchema = z.object({
  couponRedeemed: z.boolean(),
  missYou: z.boolean(),
  digest: z.boolean(),
  /** tel:+39…, https://wa.me/… or empty. */
  callLink: z
    .string()
    .trim()
    .max(200)
    .regex(
      /^(tel:\+?[0-9 ()-]{5,30}|https:\/\/(wa\.me|api\.whatsapp\.com)\/[A-Za-z0-9/?=&+%_-]{1,150})?$/,
      "Usa tel:+39… oppure https://wa.me/…",
    ),
});

export type NotificationSettings = z.infer<typeof notificationSettingsSchema>;

export const defaultNotificationSettings: NotificationSettings = {
  couponRedeemed: true,
  missYou: true,
  digest: false,
  callLink: "",
};

export function parseNotificationSettings(
  value: unknown,
): NotificationSettings {
  const parsed = notificationSettingsSchema.partial().safeParse(value);
  return {
    ...defaultNotificationSettings,
    ...(parsed.success ? parsed.data : {}),
  };
}

/** Resend's free plan allows 100 emails a day: stop well before. */
export const DAILY_EMAIL_CAP = 50;
/** At most one "Miss you" email every 10 minutes; extra taps are bundled. */
export const MISS_YOU_GAP_SECONDS = 10 * 60;
export const MAX_ATTEMPTS = 5;
