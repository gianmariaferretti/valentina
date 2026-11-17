import type { Metadata } from "next";

import { places } from "@/data/places";
import { CityGlobe } from "@/features/globe/components/city-globe";
import type { LatLng } from "@/features/globe/lib/geo";
import { globeId } from "@/features/globe/lib/types";
import { Checklist } from "@/features/life/components/checklist";
import { DepartureBoard } from "@/features/life/components/departure-board";
import {
  loadCities,
  loadListItems,
  loadNextTime,
} from "@/features/life/repositories/life";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Next time" };

/** Coordinates for a city name: the panel's cities first, then our places. */
function locate(
  name: string,
  cities: readonly { name: string; latitude: number; longitude: number }[],
): LatLng | null {
  const key = name.trim().toLowerCase();
  const city = cities.find((c) => c.name.trim().toLowerCase() === key);
  if (city) return [city.latitude, city.longitude];
  const place = places.find((p) => p.city.trim().toLowerCase() === key);
  return place ? [place.coordinates[1], place.coordinates[0]] : null;
}

export default async function NextTimePage() {
  await requireAccessSession();
  const [next, todo, suitcase, cities] = await Promise.all([
    loadNextTime(),
    loadListItems("todo").catch(() => []),
    loadListItems("suitcase").catch(() => []),
    loadCities().catch(() => []),
  ]);
  const from = locate(next.from, cities);
  const to = locate(next.to, cities);
  return (
    <div className="page-container py-6 sm:py-10">
      <header className="mb-5">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
          Gate V+G · Final call for hugs
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,10vw,5rem)] leading-[0.9] italic">
          Next time
        </h1>
      </header>
      <div className="grid items-center gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <DepartureBoard next={next} />
        {from && to ? (
          <div className="mx-auto w-full max-w-[20rem] lg:max-w-none">
            <CityGlobe
              label={`Route from ${next.from} to ${next.to}`}
              plane={{ from, to }}
              points={[
                {
                  id: globeId(`from-${next.from}`),
                  name: next.from,
                  location: from,
                },
                { id: globeId(`to-${next.to}`), name: next.to, location: to },
              ]}
            />
          </div>
        ) : null}
      </div>
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Checklist
          canPropose
          emptyText="Nothing planned yet. Suspicious."
          items={todo}
          list="todo"
          title="Things to do together"
        />
        <Checklist
          canPropose={false}
          emptyText="The suitcase is empty. Gianmaria is packing hope."
          items={suitcase}
          list="suitcase"
          title="Suitcase"
        />
      </div>
    </div>
  );
}
