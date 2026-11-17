import type { Metadata } from "next";

import { saveCities } from "@/features/admin/actions/life";
import { Card, SectionHeader } from "@/features/admin/components/admin-shell";
import { CitiesForm } from "@/features/admin/components/life-forms";
import { loadCities } from "@/features/life/repositories/life";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Città e orologi" };

export default async function AdminCitiesPage() {
  await requireAdminSession();
  const cities = await loadCities();
  return (
    <div className="max-w-4xl">
      <SectionHeader
        subtitle="Le città della striscia in home: ora dal vivo e meteo (Open-Meteo)."
        title="Città e orologi"
      />
      <Card>
        <CitiesForm initial={cities} save={saveCities} />
      </Card>
    </div>
  );
}
