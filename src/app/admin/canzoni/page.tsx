import type { Metadata } from "next";

import { ComingSoon } from "@/features/admin/components/coming-soon";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Canzoni" };

export default async function CanzoniPage() {
  await requireAdminSession();
  return (
    <ComingSoon
      items={[
        "Aggiungere, modificare e ordinare le canzoni",
        "Data, posto, il perché e il link Spotify",
      ]}
      phase="Fase 3"
      title="Canzoni"
    />
  );
}
