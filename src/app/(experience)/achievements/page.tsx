import type { Metadata } from "next";

import { RouteScaffold } from "@/components/ui/route-scaffold";

export const metadata: Metadata = { title: "Achievements" };

export default function AchievementsPage() {
  return (
    <RouteScaffold
      description="Milestones awarded for long-distance logistics, elite snack theft and other measurable relationship excellence."
      eyebrow="Progress, gamified unnecessarily"
      icon="achievements"
      note="Achievement rules can plug into the shared persistence contract when final milestones are defined."
      title="Badges for surviving us."
    />
  );
}
