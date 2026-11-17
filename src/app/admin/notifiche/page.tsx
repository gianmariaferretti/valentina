import type { Metadata } from "next";

import {
  retryEmails,
  saveNotificationSettings,
  sendHeartFromPanel,
  sendTestEmailFromPanel,
} from "@/features/admin/actions/notifications";
import { ActionButton } from "@/features/admin/components/admin-ui";
import {
  Card,
  formatWhen,
  Pill,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import {
  HeartForm,
  NotificationSettingsForm,
} from "@/features/admin/components/notification-forms";
import { loadHearts } from "@/features/admin/repositories/admin-data";
import { notifierStatus } from "@/features/notifications/lib/notifier";
import { DAILY_EMAIL_CAP } from "@/features/notifications/lib/settings";
import {
  emailsSentToday,
  loadNotificationSettings,
  loadOutbox,
} from "@/features/notifications/repositories/outbox";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Notifiche" };

const statusPill = {
  sent: ["inviata", "good"],
  failed: ["fallita", "bad"],
  pending: ["in coda", "warn"],
} as const;

export default async function NotificationsPage() {
  await requireAdminSession();
  let data;
  try {
    data = await Promise.all([
      loadNotificationSettings(),
      loadOutbox(40),
      emailsSentToday(),
      loadHearts(10),
    ]);
  } catch {
    return (
      <>
        <SectionHeader title="Notifiche" />
        <Unavailable />
      </>
    );
  }
  const [settings, outbox, sentToday, hearts] = data;
  const status = notifierStatus();
  const capped = sentToday >= DAILY_EMAIL_CAP;

  return (
    <div>
      <SectionHeader
        subtitle="Le notifiche per te arrivano via email (Resend, piano gratuito)."
        title="Notifiche"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="grid gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">Resend</h2>
            {status.configured ? (
              <Pill tone="good">
                {status.name === "log"
                  ? "modalità sviluppo (file)"
                  : `attivo → ${status.to}`}
              </Pill>
            ) : (
              <Pill tone="bad">da configurare</Pill>
            )}
          </div>
          {!status.configured ? (
            <p className="text-sm">
              Mancano su Vercel: <strong>{status.missing.join(", ")}</strong>.
              Le email restano in coda e partono appena è tutto configurato.
            </p>
          ) : null}
          <p className="text-sm">
            Inviate oggi: <strong>{sentToday}</strong> / {DAILY_EMAIL_CAP}{" "}
            <span className="text-xs text-[var(--muted)]">
              (tetto di sicurezza; il piano gratuito ne permette 100)
            </span>
          </p>
          {capped ? (
            <p className="rounded-xl bg-[#f8d7d3] p-3 text-sm">
              Limite di oggi raggiunto: le notifiche sono ferme fino a domani e
              poi ripartono da sole.
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2">
            <ActionButton action={sendTestEmailFromPanel} tone="primary">
              Invia email di prova
            </ActionButton>
            <ActionButton action={retryEmails}>
              Riprova quelle in sospeso
            </ActionButton>
          </div>
        </Card>

        <Card>
          <h2 className="mb-3 text-lg font-semibold">Cosa ricevere</h2>
          <NotificationSettingsForm
            initial={settings}
            save={saveNotificationSettings}
          />
        </Card>

        <Card className="grid gap-3">
          <h2 className="text-lg font-semibold">Manda un cuore a Valentina</h2>
          <p className="text-sm text-[var(--muted)]">
            Le compare un grande cuore animato sul sito: subito se è aperto,
            altrimenti alla prossima apertura.
          </p>
          <HeartForm send={sendHeartFromPanel} />
          {hearts.length ? (
            <ul className="divide-y divide-[var(--line)] text-sm">
              {hearts.map((heart) => (
                <li className="flex justify-between gap-2 py-2" key={heart.id}>
                  <span>❤️ {heart.message ?? "senza messaggio"}</span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatWhen(heart.created_at)} ·{" "}
                    {heart.seen_at ? "visto" : "non visto"}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </Card>

        <Card className="p-0 lg:col-span-2">
          <h2 className="p-4 pb-0 text-lg font-semibold">Storico email</h2>
          {outbox.length === 0 ? (
            <p className="p-4 text-sm">Nessuna email ancora.</p>
          ) : (
            <ul className="mt-2 divide-y divide-[var(--line)]">
              {outbox.map((row) => {
                const [label, tone] = statusPill[
                  row.status as keyof typeof statusPill
                ] ?? [row.status, "neutral"];
                return (
                  <li
                    className="grid gap-1 p-3 text-sm sm:grid-cols-[1fr_auto]"
                    key={row.id}
                  >
                    <span>
                      {row.subject}
                      {row.last_error && row.status !== "sent" ? (
                        <span className="block text-xs text-[#8a1c14]">
                          {row.last_error}
                        </span>
                      ) : null}
                    </span>
                    <span className="flex items-center gap-2 text-xs text-[var(--muted)]">
                      <Pill tone={tone}>
                        {label}
                        {row.attempts > 1 ? ` · ${row.attempts} tentativi` : ""}
                      </Pill>
                      {formatWhen(row.sent_at ?? row.created_at)}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
