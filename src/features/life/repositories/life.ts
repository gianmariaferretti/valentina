import "server-only";

import { cache } from "react";

import { nextReunionDate } from "@/data/reunion";
import { loadSetting } from "@/features/admin/repositories/content";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import {
  citiesSchema,
  defaultCities,
  nextTimeSchema,
  rewardSchema,
  type City,
  type ListName,
  type ListReward,
  type NextTime,
} from "../lib/schemas";
import { openMeteoUrl, parseOpenMeteo, type CityWeather } from "../lib/weather";

// ------------------------------------------------------------ settings

export const loadNextTime = cache(async (): Promise<NextTime> => {
  const parsed = nextTimeSchema.safeParse(await loadSetting("next-time"));
  if (parsed.success) return parsed.data;
  // Fallback: the constant in src/data/reunion.ts (date only, noon in Rome).
  return {
    at: nextReunionDate ? `${nextReunionDate}T12:00:00+01:00` : null,
    from: "Rome",
    to: "Cartagena",
    status: "on-time",
  };
});

export const loadCities = cache(async (): Promise<City[]> => {
  const parsed = citiesSchema.safeParse(await loadSetting("cities"));
  return parsed.success ? parsed.data.cities : defaultCities;
});

/** Open-Meteo, server side, cached 30 minutes. null = show the time only. */
export async function loadWeather(city: City): Promise<CityWeather | null> {
  try {
    const response = await fetch(
      openMeteoUrl(city.latitude, city.longitude, city.timeZone),
      { next: { revalidate: 1800 }, signal: AbortSignal.timeout(4000) },
    );
    if (!response.ok) return null;
    return parseOpenMeteo(await response.json());
  } catch {
    return null;
  }
}

export async function loadCitiesWithWeather(): Promise<
  { city: City; weather: CityWeather | null }[]
> {
  const cities = await loadCities();
  return Promise.all(
    cities.map(async (city) => ({ city, weather: await loadWeather(city) })),
  );
}

// ------------------------------------------------------------ lists

export interface ListItem {
  readonly id: string;
  readonly list: ListName;
  readonly title: string;
  readonly notes: string | null;
  readonly category: string | null;
  readonly sort: number;
  readonly status: "active" | "proposed";
  readonly proposedBy: "gianmaria" | "valentina";
  readonly doneAt: string | null;
  readonly doneBy: "gianmaria" | "valentina" | null;
  readonly reward: ListReward | null;
  readonly hasPhoto: boolean;
  readonly createdAt: string;
}

export async function loadListItems(list: ListName): Promise<ListItem[]> {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("life_lists")
    .select(
      "id, list, title, notes, category, sort, status, proposed_by, done_at, done_by, reward, photo_object, created_at",
    )
    .eq("list", list)
    .order("sort")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const reward = rewardSchema.safeParse(row.reward);
    return {
      id: row.id,
      list: row.list as ListName,
      title: row.title,
      notes: row.notes,
      category: row.category,
      sort: row.sort,
      status: row.status as ListItem["status"],
      proposedBy: row.proposed_by as ListItem["proposedBy"],
      doneAt: row.done_at,
      doneBy: row.done_by as ListItem["doneBy"],
      reward: reward.success ? reward.data : null,
      hasPhoto: Boolean(row.photo_object),
      createdAt: row.created_at,
    };
  });
}

export async function loadPhotoObject(id: string): Promise<string | null> {
  const { client } = getSupabaseServerContext();
  const { data } = await client
    .from("life_lists")
    .select("photo_object")
    .eq("id", id)
    .eq("list", "bucket")
    .maybeSingle();
  return data?.photo_object ?? null;
}

// ------------------------------------------------------------ songs

export interface Song {
  readonly id: string;
  readonly title: string;
  readonly artist: string;
  readonly spotifyUrl: string | null;
  readonly date: string | null;
  readonly place: string | null;
  readonly why: string | null;
  readonly sort: number;
}

export async function loadSongs(): Promise<Song[]> {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("songs")
    .select("id, title, artist, spotify_url, song_date, place, why, sort")
    .order("sort")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    artist: row.artist,
    spotifyUrl: row.spotify_url,
    date: row.song_date,
    place: row.place,
    why: row.why,
    sort: row.sort,
  }));
}
