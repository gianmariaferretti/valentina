import type { Metadata } from "next";

import {
  adjustKisses,
  markKissesPaid,
  resetCasinoFromAdmin,
  restoreCurtainMessage,
  saveCurtainMessage,
  setCurtainUnlocked,
  undoAdjustKisses,
} from "@/features/admin/actions/casino";
import { ActionButton } from "@/features/admin/components/admin-ui";
import {
  Card,
  formatWhen,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import {
  CurtainMessageForm,
  NumberAction,
} from "@/features/admin/components/casino-forms";
import { loadCasinoAdmin } from "@/features/admin/repositories/admin-data";
import { loadCurtainMessage } from "@/features/admin/repositories/content";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Kiss Casino" };

const statLabels: Record<string, string> = {
  plays: "Giocate",
  wagered: "💋 puntati",
  kissesWon: "💋 vinti",
  couponsWon: "Buoni vinti",
  realKissesBought: "Baci veri comprati",
  realKissesPaid: "Baci veri pagati",
  rouletteSpins: "Giri di roulette",
  blackjackHands: "Mani di blackjack",
  visits: "Visite",
};

export default async function AdminCasinoPage() {
  await requireAdminSession();
  let data;
  try {
    data = await Promise.all([loadCasinoAdmin(), loadCurtainMessage()]);
  } catch {
    return (
      <>
        <SectionHeader title="Kiss Casino" />
        <Unavailable />
      </>
    );
  }
  const [casino, message] = data;
  const view = casino.view;

  return (
    <div>
      <SectionHeader
        subtitle="Le probabilità restano nel codice (src/data/casino-config.ts)."
        title="Kiss Casino"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="grid gap-3">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              ["Saldo", `${view?.balance ?? 0} 💋`],
              ["Le devi", `${casino.debt} baci`],
              ["Livello", view?.vip.label ?? "—"],
              ["Stagione", String(view?.season ?? 1)],
            ].map(([label, value]) => (
              <div className="rounded-2xl bg-[var(--paper)] p-3" key={label}>
                <dt className="text-xs text-[var(--muted)]">{label}</dt>
                <dd className="text-xl font-semibold">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="text-xs text-[var(--muted)]">
            Ultima giocata: {formatWhen(casino.lastActivityAt)}
          </p>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-3">
            {Object.entries(statLabels).map(([key, label]) => (
              <div className="flex justify-between gap-2" key={key}>
                <dt className="text-[var(--muted)]">{label}</dt>
                <dd className="font-semibold">{casino.stats[key] ?? 0}</dd>
              </div>
            ))}
          </dl>
        </Card>

        <Card className="grid gap-5">
          <NumberAction
            action={adjustKisses}
            buttons={[
              { text: "+ Aggiungi 💋", sign: 1, tone: "primary" },
              { text: "− Togli 💋", sign: -1 },
            ]}
            label="Saldo del casinò"
            undo={undoAdjustKisses}
          />
          <NumberAction
            action={markKissesPaid}
            buttons={[
              { text: "💋 Segna baci pagati", sign: 1, tone: "primary" },
            ]}
            label="Baci veri pagati"
          />
          <div className="flex flex-wrap gap-2">
            <ActionButton
              action={setCurtainUnlocked.bind(null, !view?.curtainUnlocked)}
              undo={setCurtainUnlocked.bind(
                null,
                Boolean(view?.curtainUnlocked),
              )}
            >
              {view?.curtainUnlocked
                ? "🎭 Blocca Behind the Curtain"
                : "🎭 Sblocca Behind the Curtain"}
            </ActionButton>
            <ActionButton
              action={resetCasinoFromAdmin}
              confirm={{
                title: "Resettare il casinò?",
                body: "Saldo a 50, livelli, missioni, Kiss Pass e offerte azzerati, nuova stagione. Il debito di baci viene archiviato. I buoni già vinti restano.",
                confirmLabel: "Resetta il casinò",
              }}
              tone="danger"
            >
              Resetta il casinò
            </ActionButton>
          </div>
        </Card>

        <Card className="grid gap-3 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold">
              Messaggio di Behind the Curtain
            </h2>
            <ActionButton action={restoreCurtainMessage}>
              Ripristina originale
            </ActionButton>
          </div>
          <CurtainMessageForm
            paragraphs={message.paragraphs}
            save={saveCurtainMessage}
            signoff={message.signoff}
          />
        </Card>

        <Card className="lg:col-span-2">
          <h2 className="mb-2 text-lg font-semibold">Registro dei baci</h2>
          {casino.ledger.length === 0 ? (
            <p className="text-sm">Ancora nessun movimento.</p>
          ) : (
            <ul className="divide-y divide-[var(--line)] text-sm">
              {casino.ledger.slice(0, 30).map((row) => (
                <li className="flex justify-between gap-3 py-2" key={row.id}>
                  <span>
                    {row.label}
                    <span className="text-xs text-[var(--muted)]">
                      {" "}
                      · stagione {row.season} · {formatWhen(row.at)}
                    </span>
                  </span>
                  <strong>
                    {row.realKisses > 0 ? `+${row.realKisses}` : row.realKisses}
                  </strong>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
