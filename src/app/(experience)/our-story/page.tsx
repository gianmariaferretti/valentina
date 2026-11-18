import type { Metadata } from "next";

import { ourStoryDefaults } from "@/data/our-story";
import { places } from "@/data/places";
import { loadSetting } from "@/features/admin/repositories/content";
import { Story } from "@/features/our-story/components/story";
import {
  buildChapters,
  mergeStoryWords,
  type StoryPlace,
} from "@/features/our-story/lib/story";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Our story" };

/**
 * Year One as a scroll story. Behind the session like every page here: the
 * photos are the gallery's private ones, served by /api/private-media.
 */
export default async function OurStoryPage() {
  await requireAccessSession();
  const stored = await loadSetting("our-story").catch(() => null);
  const words = mergeStoryWords(ourStoryDefaults, stored);
  const storyPlaces: StoryPlace[] = places.map((place) => ({
    slug: place.slug,
    city: place.city,
    country: place.country,
    coordinates: place.coordinates,
    dateStart: place.dateRange.start,
    dateLabel: place.dateRange.label,
    atlasOrder: place.atlasOrder,
    photos: [place.coverImage, ...place.galleryImages].map((photo) => ({
      src: photo.src,
      alt: photo.alt,
      width: photo.width,
      height: photo.height,
      caption: photo.caption,
    })),
  }));
  const chapters = buildChapters(storyPlaces, words);

  return (
    <div className="page-container overflow-x-clip py-6 sm:py-10">
      <header>
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
          Year One · {chapters.length} chapters
        </p>
        <h1 className="mt-2 font-display text-[clamp(3rem,13vw,7rem)] leading-[0.85] tracking-[-0.05em] italic">
          Our story
        </h1>
      </header>
      <Story chapters={chapters} intro={words.intro} />
    </div>
  );
}
