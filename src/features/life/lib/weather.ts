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
