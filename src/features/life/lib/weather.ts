/** Open-Meteo (free, no key) → what the city strip shows. Pure parsing. */

export interface CityWeather {
  readonly temperature: number;
  readonly code: number;
  readonly isDay: boolean;
  readonly daily: readonly {
    date: string;
    max: number;
    min: number;
    code: number;
  }[];
}

export function openMeteoUrl(
  latitude: number,
  longitude: number,
  timeZone: string,
) {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,weather_code,is_day",
    daily: "weather_code,temperature_2m_max,temperature_2m_min",
    forecast_days: "6",
    timezone: timeZone,
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

export function parseOpenMeteo(body: unknown): CityWeather | null {
  const data = body as {
    current?: {
      temperature_2m?: number;
      weather_code?: number;
      is_day?: number;
    };
    daily?: {
      time?: string[];
      weather_code?: number[];
      temperature_2m_max?: number[];
      temperature_2m_min?: number[];
    };
  };
  const current = data?.current;
  if (
    typeof current?.temperature_2m !== "number" ||
    typeof current.weather_code !== "number"
  )
    return null;
  const daily = data.daily;
  return {
    temperature: Math.round(current.temperature_2m),
    code: current.weather_code,
    isDay: current.is_day !== 0,
    daily: (daily?.time ?? []).flatMap((date, i) => {
      const max = daily?.temperature_2m_max?.[i];
      const min = daily?.temperature_2m_min?.[i];
      const code = daily?.weather_code?.[i];
      return typeof max === "number" &&
        typeof min === "number" &&
        typeof code === "number"
        ? [{ date, max: Math.round(max), min: Math.round(min), code }]
        : [];
    }),
  };
}

/** WMO weather code → emoji and short English label. */
export function weatherIcon(
  code: number,
  isDay = true,
): { icon: string; label: string } {
  if (code === 0)
    return isDay
      ? { icon: "☀️", label: "Clear" }
      : { icon: "🌙", label: "Clear night" };
  if (code <= 2)
    return isDay
      ? { icon: "🌤️", label: "Mostly sunny" }
      : { icon: "🌙", label: "Mostly clear" };
  if (code === 3) return { icon: "☁️", label: "Cloudy" };
  if (code === 45 || code === 48) return { icon: "🌫️", label: "Fog" };
  if (code >= 51 && code <= 67) return { icon: "🌧️", label: "Rain" };
  if (code >= 71 && code <= 77) return { icon: "❄️", label: "Snow" };
  if (code >= 80 && code <= 82) return { icon: "🌦️", label: "Showers" };
  if (code >= 85 && code <= 86) return { icon: "🌨️", label: "Snow showers" };
  if (code >= 95) return { icon: "⛈️", label: "Thunderstorm" };
  return { icon: "🌡️", label: "Weather" };
}

/** Night between 20:00 and 6:00 local time when the weather service is down. */
export function isNightAt(timeZone: string, now: Date): boolean {
  const hour = Number(
    new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      hourCycle: "h23",
      timeZone,
    }).format(now),
  );
  return hour < 6 || hour >= 20;
}

/**
 * WMO weather code → Meteocons icon (day or night). Every slug returned
 * here is copied by scripts/sync-weather-icons.mjs into public/weather/.
 */
export function meteoconFor(code: number, isDay = true): string {
  const dn = isDay ? "day" : "night";
  if (code === 0) return `clear-${dn}`;
  if (code === 1 || code === 2) return `partly-cloudy-${dn}`;
  if (code === 3) return `overcast-${dn}`;
  if (code === 45 || code === 48) return `fog-${dn}`;
  if (code >= 51 && code <= 55) return `partly-cloudy-${dn}-drizzle`;
  if (code === 56 || code === 57 || code === 66 || code === 67) return "sleet";
  if (code >= 61 && code <= 65) return "rain";
  if (code >= 71 && code <= 77) return "snow";
  if (code >= 80 && code <= 82) return `partly-cloudy-${dn}-rain`;
  if (code === 85 || code === 86) return `partly-cloudy-${dn}-snow`;
  if (code === 95) return `thunderstorms-${dn}-rain`;
  if (code >= 96) return `thunderstorms-${dn}-hail`;
  return `overcast-${dn}`;
}

/** Every icon meteoconFor can return (kept in sync by a test). */
export const METEOCONS_USED = [
  ...["clear", "partly-cloudy", "overcast", "fog"].flatMap((name) => [
    `${name}-day`,
    `${name}-night`,
  ]),
  ...["drizzle", "rain", "snow"].flatMap((kind) => [
    `partly-cloudy-day-${kind}`,
    `partly-cloudy-night-${kind}`,
  ]),
  "sleet",
  "rain",
  "snow",
  "thunderstorms-day-rain",
  "thunderstorms-night-rain",
  "thunderstorms-day-hail",
  "thunderstorms-night-hail",
] as const;
