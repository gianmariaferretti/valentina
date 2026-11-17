import type { Metadata } from "next";

import { ComingSoon } from "@/features/admin/components/coming-soon";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Notifiche" };

export default async function NotifichePage() {
  await requireAdminSession();
  return (
    <ComingSoon
      items={[
        "Stato di Resend e pulsante “Invia email di prova”",
        "Interruttori per tipo di notifica",
        "Riepilogo serale sì/no",
        "Numero o link per “Call her”",
        "Storico di email e cuori inviati",
      ]}
      phase="Fase 2"
      title="Notifiche"
    />
  );
}
