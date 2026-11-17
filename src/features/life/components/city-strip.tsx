import { loadCitiesWithWeather } from "../repositories/life";
import { defaultCities } from "../lib/schemas";
import { CityClocks } from "./city-clocks";

/** Server part: cities from the panel, weather from Open-Meteo (cached). */
export async function CityStrip() {
  const items = await loadCitiesWithWeather().catch(() =>
    defaultCities.map((city) => ({ city, weather: null })),
  );
  return <CityClocks items={items} />;
}

export function CityStripFallback() {
  return <div aria-hidden="true" className="h-12" />;
}
