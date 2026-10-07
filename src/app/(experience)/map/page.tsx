import { Compass } from "lucide-react";
import type { Metadata } from "next";

import {
  HandwrittenNote,
  PassportStamp,
  PostageStamp,
  Sticker,
} from "@/components/design-system";
import { PageIntro } from "@/components/ui/page-intro";
import { places } from "@/data/places";
import { EuropeMapExperience } from "@/features/map/components/europe-map-experience";

export const metadata: Metadata = {
  title: "Our map",
  description:
    "An interactive atlas of the places in Valentina and Gianmaria’s first year.",
};

export default function MapPage() {
  return (
    <div className="pb-16 sm:pb-20 lg:pb-28">
      <div className="page-container pt-10 sm:pt-14 lg:pt-20">
        <div className="grid items-end gap-8 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <PageIntro
            description="Five real coordinates, several future photographs and a highly biased atlas of the places that became part of us."
            eyebrow="Where we have been"
            title="Our little world, accurately pinned."
          />
          <div className="flex flex-wrap items-center gap-3 lg:justify-end lg:pb-2">
            <Sticker
              rotation={-3}
              size="sm"
              text={`${places.length} destinations`}
              variant="location"
            />
            <Sticker
              rotation={2}
              size="sm"
              text="Europe · Year One"
              variant="date"
            />
          </div>
        </div>

        <div className="mt-8 sm:mt-12">
          <EuropeMapExperience destinations={places} />
        </div>

        <section className="mt-12 grid gap-8 border-t border-[var(--line)] pt-10 sm:mt-16 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
          <div>
            <div className="flex items-center gap-2 text-[0.6rem] font-bold tracking-[0.16em] text-[var(--muted)] uppercase">
              <Compass aria-hidden="true" size={15} />
              Map notes
            </div>
            <p className="mt-4 max-w-2xl font-display text-3xl tracking-[-0.035em] sm:text-4xl">
              Pins are geographic. The order is editorial.
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              No line between destinations is shown because the archive does not
              yet store an explicit travel chronology. The exact dates and real
              photographs can be added without rebuilding the map.
            </p>
            <HandwrittenNote className="mt-6" rotation={-2}>
              the route is ours to add later
            </HandwrittenNote>
          </div>
          <div className="flex items-end gap-4">
            <PostageStamp
              country="Our atlas"
              tone="blue"
              value="05"
              year="Y1"
            />
            <PassportStamp
              className="hidden sm:flex"
              code="V+G"
              date="YEAR ONE"
              location="EUROPE"
              rotation={7}
            />
          </div>
        </section>
      </div>
    </div>
  );
}
