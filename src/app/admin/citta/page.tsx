import type { Metadata } from "next";

import { ComingSoon } from "@/features/admin/components/coming-soon";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Città e orologi" };

export default async function CittaPage() {
  await requireAdminSession();
  return (
    <ComingSoon
      items={["Quali città mostrare", "Nome, fuso orario e chi c'è"]}
      phase="Fase 3"
      title="Città e orologi"
    />
  );
}
