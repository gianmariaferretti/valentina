import type { Metadata } from "next";

import { RouteScaffold } from "@/components/ui/route-scaffold";

export const metadata: Metadata = { title: "Awards" };

export default function AwardsPage() {
  return (
    <RouteScaffold
      description="An independent jury will review the evidence. The jury is not independent, and most categories have already been fixed."
      eyebrow="The inaugural V&G awards"
      icon="awards"
      note="Award categories, nominees and reveal interactions can now be added as feature-owned data and components."
      title="Excellence, chaos and selective memory."
    />
  );
}
