import { Images, Sparkles } from "lucide-react";
import type { Metadata } from "next";

import { HandwrittenNote, Sticker } from "@/components/design-system";
import { getGalleryMedia } from "@/data/media";
import { GalleryScrapbook } from "@/features/gallery/components/gallery-scrapbook";

import styles from "@/features/gallery/components/gallery.module.css";

export const metadata: Metadata = {
  title: "365 Days in Photos",
  description:
    "A private editorial scrapbook of photographs from V&G Year One.",
};

export default function GalleryPage() {
  const galleryMedia = getGalleryMedia();

  return (
    <div className={`page-container ${styles.page}`}>
      <header className={styles.hero}>
        <div className={styles.heroTopline}>
          <span>V&amp;G photographic archive · Volume 01</span>
          <Sticker
            rotation={3}
            size="sm"
            text="Selected evidence"
            variant="girlfriend-approved"
          />
        </div>

        <div className={styles.heroContent}>
          <p>One year · selectively remembered</p>
          <h1>
            365 days
            <em>in photos</em>
          </h1>
        </div>

        <div className={styles.heroFooter}>
          <p>
            Not a camera roll. Not an algorithm. Just the frames that made Year
            One look suspiciously well documented.
          </p>
          <HandwrittenNote rotation={-2} tone="ink">
            real photographs replace the placeholders when ready
          </HandwrittenNote>
        </div>

        <Images aria-hidden="true" className="absolute bottom-8 left-0" />
        <Sparkles
          aria-hidden="true"
          className="absolute right-[28%] bottom-20 text-[var(--rust)]"
          size={19}
        />
      </header>

      <GalleryScrapbook media={galleryMedia} />
    </div>
  );
}
