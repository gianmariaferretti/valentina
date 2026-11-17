import { CityGlobe } from "@/features/globe/components/city-globe";
import { cityGlobe } from "@/features/globe/lib/city-globe-data";

import { loadCitiesWithWeather } from "../repositories/life";
import { defaultCities } from "../lib/schemas";
import { weatherIcon } from "../lib/weather";
import { CityClocks } from "./city-clocks";

/** Server part: cities from the panel, weather from Open-Meteo (cached). */
export async function CityStrip({ globe = false }: { globe?: boolean }) {
  const items = await loadCitiesWithWeather().catch(() =>
    defaultCities.map((city) => ({ city, weather: null })),
  );
  if (!globe) return <CityClocks items={items} />;
  const badges = Object.fromEntries(
    items.flatMap(({ city, weather }) =>
      weather
        ? [
            [
              city.name,
              `${weatherIcon(weather.code, weather.isDay).icon} ${weather.temperature}°`,
            ],
          ]
        : [],
    ),
  );
  const { points, arcs } = cityGlobe(
    items.map(({ city }) => city),
    badges,
  );
  return (
    <div className="grid gap-4">
      <div className="mx-auto w-full max-w-[22rem] sm:max-w-[26rem]">
        <CityGlobe
          arcs={arcs}
          label={`Globe with our cities: ${points.map((p) => p.name).join(", ")}`}
          points={points}
        />
      </div>
      <CityClocks items={items} />
    </div>
  );
}

export function CityStripFallback({ globe = false }: { globe?: boolean }) {
  return (
    <div aria-hidden="true" className={globe ? "grid gap-4" : "h-12"}>
      {globe ? (
        <>
          <div className="mx-auto aspect-square w-full max-w-[22rem] sm:max-w-[26rem]" />
          <div className="h-12" />
        </>
      ) : null}
    </div>
  );
}
