import type { Metadata } from "next";

import { ComingSoon } from "@/features/admin/components/coming-soon";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Next time" };

export default async function NextTimePage() {
  await requireAdminSession();
  return (
    <ComingSoon
      items={[
        "Data e ora del prossimo incontro, città",
        "Lista di cose da fare insieme",
        "Valigia da spuntare",
      ]}
      phase="Fase 3"
      title="Next time"
    />
  );
}
