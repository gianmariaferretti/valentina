import type { Place } from "@/types/content";

export const places = [
  {
    slug: "london",
    city: "London",
    country: "United Kingdom",
    coordinates: [51.5072, -0.1276],
    summary: "Flights, weather commentary and a chapter worth keeping.",
  },
  {
    slug: "paris",
    city: "Paris",
    country: "France",
    coordinates: [48.8566, 2.3522],
    summary: "A placeholder for the story that belongs at these coordinates.",
  },
  {
    slug: "rome",
    city: "Rome",
    country: "Italy",
    coordinates: [41.9028, 12.4964],
    summary: "Some memories deserve their own pin and a better caption.",
  },
  {
    slug: "cartagena",
    city: "Cartagena",
    country: "Colombia",
    coordinates: [10.391, -75.4794],
    summary: "Distance, home and one very good reason to cross an ocean.",
  },
] as const satisfies readonly Place[];

export function getPlace(slug: string) {
  return places.find((place) => place.slug === slug);
}
