import type { Metadata } from "next";

import {
  logoutEverywhere,
  revokePasskeyFromAdmin,
} from "@/features/admin/actions/security";
import { ActionButton } from "@/features/admin/components/admin-ui";
import {
  Card,
  formatWhen,
  Pill,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import { loadAuthEvents } from "@/features/admin/repositories/admin-data";
import { requireAdminSession } from "@/lib/auth/admin-session";
import { listPasskeys, type PasskeySummary } from "@/lib/auth/passkey-server";

export const metadata: Metadata = { title: "Sicurezza" };

const who = {
  visitor: "Valentina (sito)",
  admin: "Tu (pannello)",
  contract: "Contratto",
};
const what = {
  login: ["Accesso", "good"],
  failed: ["Codice sbagliato", "warn"],
  blocked: ["Bloccato (troppi tentativi)", "bad"],
  logout_all: ["Uscita da tutti i dispositivi", "neutral"],
} as const;

export default async function SecurityPage() {
  await requireAdminSession();
  let events;
  try {
    events = await loadAuthEvents(80);
  } catch {
    return (
      <>
        <SectionHeader title="Sicurezza" />
        <Unavailable />
      </>
    );
  }
  let passkeys: PasskeySummary[] | null = null;
  try {
    passkeys = await listPasskeys("visitor");
  } catch {
    // Migration not applied yet: the section says so.
  }
  const day = new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Rome",
  });
  return (
    <div>
      <SectionHeader
        subtitle="Il codice d'accesso ammette 5 tentativi ogni 15 minuti per dispositivo."
        title="Sicurezza"
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="grid gap-3">
          <p className="font-semibold">Sito di Valentina</p>
          <p className="text-sm text-[var(--muted)]">
            Chiude tutte le sessioni aperte: dovrà reinserire il codice su ogni
            dispositivo (effetto entro 30 secondi). Anche le passkey (Face ID)
            registrate fin qui smettono di funzionare.
          </p>
          <ActionButton
            action={logoutEverywhere.bind(null, "visitor")}
            confirm={{
              title: "Far uscire Valentina ovunque?",
              body: "Su telefono, computer e ogni altro dispositivo dovrà reinserire il codice.",
              confirmLabel: "Esci da tutti i dispositivi",
            }}
            tone="danger"
          >
            Esci da tutti i dispositivi (Valentina)
          </ActionButton>
        </Card>
        <Card className="grid gap-3">
          <p className="font-semibold">Questo pannello</p>
          <p className="text-sm text-[var(--muted)]">
            Chiude il pannello su tutti i tuoi dispositivi, compreso questo.
          </p>
          <ActionButton
            action={logoutEverywhere.bind(null, "admin")}
            confirm={{
              title: "Uscire dal pannello ovunque?",
              body: "Dovrai reinserire la passphrase su ogni dispositivo, anche qui.",
              confirmLabel: "Esci ovunque",
            }}
            tone="danger"
          >
            Esci da tutti i dispositivi (io)
          </ActionButton>
        </Card>
      </div>
      <h2 className="mt-6 mb-2 text-lg font-semibold">
        Face ID di Valentina (passkey)
      </h2>
      <Card className="grid gap-2">
        {passkeys === null ? (
          <p className="text-sm text-[var(--muted)]">
            Non ancora attive: applica la migration 20261118020000_passkeys.sql.
            Il codice funziona comunque.
          </p>
        ) : passkeys.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">
            Nessun dispositivo. Valentina può attivarlo dopo aver inserito il
            codice, o dal menu More.
          </p>
        ) : (
          <ul className="grid gap-2">
            {passkeys.map((key) => (
              <li
                className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-[var(--line)] p-3 text-sm"
                key={key.id}
              >
                <span>
                  <span className="font-semibold">
                    {key.device ?? "Dispositivo"}
                  </span>
                  <span className="block text-xs text-[var(--muted)]">
                    Aggiunto il {day.format(new Date(key.createdAt))} · ultimo
                    uso{" "}
                    {key.lastUsedAt
                      ? day.format(new Date(key.lastUsedAt))
                      : "mai"}
                    {key.usable
                      ? ""
                      : key.revokedAt
                        ? " · revocata"
                        : " · non valida dopo «esci da tutti i dispositivi»"}
                  </span>
                </span>
                {key.usable ? (
                  <ActionButton
                    action={revokePasskeyFromAdmin.bind(null, key.id)}
                    confirm={{
                      title: "Revocare questa passkey?",
                      body: "Da quel dispositivo Valentina dovrà usare il codice.",
                      confirmLabel: "Revoca",
                    }}
                    tone="danger"
                  >
                    Revoca
                  </ActionButton>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <h2 className="mt-6 mb-2 text-lg font-semibold">
        Ultimi accessi e tentativi
      </h2>
      <Card className="p-0">
        {events.length === 0 ? (
          <p className="p-4 text-sm">Nessun evento registrato.</p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {events.map((event) => {
              const [label, tone] = what[event.kind as keyof typeof what] ?? [
                event.kind,
                "neutral",
              ];
              return (
                <li
                  className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm"
                  key={event.id}
                >
                  <span>
                    <Pill tone={tone}>{label}</Pill>{" "}
                    {who[event.scope as keyof typeof who] ?? event.scope}
                    {event.detail ? (
                      <span className="text-xs text-[var(--muted)]">
                        {" "}
                        · {event.detail}
                      </span>
                    ) : null}
                  </span>
                  <span className="text-xs text-[var(--muted)]">
                    {formatWhen(event.created_at)}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </Card>
    </div>
  );
}
