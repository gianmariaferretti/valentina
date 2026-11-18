import type { Metadata } from "next";

import {
  removeDoodle,
  toggleDoodleFavorite,
} from "@/features/admin/actions/doodles";
import { ActionButton } from "@/features/admin/components/admin-ui";
import { Card, SectionHeader } from "@/features/admin/components/admin-shell";
import { buttonClass } from "@/features/admin/components/styles";
import { DoodleAlbum } from "@/features/doodles/components/doodle-album";
import { DoodleStudio } from "@/features/doodles/components/doodle-studio";
import type { Doodle } from "@/features/doodles/lib/doodles";
import {
  DoodlesNotReady,
  listDoodles,
} from "@/features/doodles/repositories/doodles";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Disegni" };

export default async function AdminDoodlesPage() {
  await requireAdminSession();
  let doodles: Doodle[] = [];
  let ready = true;
  try {
    doodles = await listDoodles();
  } catch (error) {
    if (!(error instanceof DoodlesNotReady)) throw error;
    ready = false;
  }
  return (
    <div className="max-w-4xl">
      <SectionHeader
        subtitle="I disegni di Valentina e i tuoi. Puoi rispondere disegnando, mettere tra i preferiti o eliminare."
        title="Disegni"
      />
      <Card className="grid gap-5">
        <div>
          <DoodleStudio
            className={buttonClass("primary")}
            label="✏️ Disegna per Valentina"
            sendLabel="Manda a Valentina"
            uploadUrl="/admin/disegni/upload"
          />
        </div>
        {!ready ? (
          <p className="text-sm text-[var(--muted)]">
            La tabella dei disegni non esiste ancora: applica la migration
            20261118010000_doodles.sql.
          </p>
        ) : doodles.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Ancora nessun disegno.</p>
        ) : (
          <DoodleAlbum
            doodles={doodles}
            fileBase="/admin/disegni/file"
            renderActions={(doodle) => (
              <>
                {doodle.author === "valentina" ? (
                  <DoodleStudio
                    className={buttonClass("ghost")}
                    label="Rispondi"
                    replyTo={doodle.id}
                    sendLabel="Manda a Valentina"
                    uploadUrl="/admin/disegni/upload"
                  />
                ) : null}
                <ActionButton
                  action={toggleDoodleFavorite.bind(
                    null,
                    doodle.id,
                    !doodle.favorite,
                  )}
                >
                  {doodle.favorite ? "★" : "☆"}
                </ActionButton>
                <ActionButton
                  action={removeDoodle.bind(null, doodle.id)}
                  confirm={{
                    title: "Eliminare il disegno?",
                    body: "Sparisce anche dall'album di Valentina.",
                    confirmLabel: "Elimina",
                  }}
                  tone="danger"
                >
                  Elimina
                </ActionButton>
              </>
            )}
            viewer="gianmaria"
          />
        )}
      </Card>
    </div>
  );
}
