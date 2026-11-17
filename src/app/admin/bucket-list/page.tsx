import type { Metadata } from "next";

import { ComingSoon } from "@/features/admin/components/coming-soon";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Bucket list" };

export default async function BucketListPage() {
  await requireAdminSession();
  return (
    <ComingSoon
      items={[
        "Aggiungere, modificare e ordinare le voci",
        "Scegliere il buono o i 💋 che sblocca una spunta",
        "Approvare le proposte di Valentina",
      ]}
      phase="Fase 3"
      title="Bucket list"
    />
  );
}
