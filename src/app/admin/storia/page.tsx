import type { Metadata } from "next";

import { ourStoryDefaults } from "@/data/our-story";
import { places } from "@/data/places";
import {
  restoreOurStory,
  saveOurStory,
} from "@/features/admin/actions/our-story";
import { ActionButton } from "@/features/admin/components/admin-ui";
import { Card, SectionHeader } from "@/features/admin/components/admin-shell";
import { OurStoryForm } from "@/features/admin/components/our-story-form";
import { loadSetting } from "@/features/admin/repositories/content";
import { mergeStoryWords } from "@/features/our-story/lib/story";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "La nostra storia" };

export default async function AdminOurStoryPage() {
  await requireAdminSession();
  const words = mergeStoryWords(
    ourStoryDefaults,
    await loadSetting("our-story").catch(() => null),
  );
  const chapters = places
    .filter((place) => words.chapters[place.slug])
    .map((place) => ({
      slug: place.slug,
      city: place.city,
      ...words.chapters[place.slug],
    }));
  return (
    <div className="max-w-3xl">
      <SectionHeader
        subtitle="I testi di /our-story, in inglese. Luoghi, date e foto arrivano dalla mappa e dalla galleria."
        title="La nostra storia"
      />
      <Card className="grid gap-4">
        <div className="flex justify-end">
          <ActionButton action={restoreOurStory}>
            Ripristina originale
          </ActionButton>
        </div>
        <OurStoryForm
          chapters={chapters}
          intro={words.intro}
          save={saveOurStory}
        />
      </Card>
    </div>
  );
}
