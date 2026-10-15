/** Souvenirs are presentation data; ownership lives in Supabase discoveries. */
export const italianWorldCollectibles = [
  {
    id: "moka",
    name: "La moka",
    lesson: 5,
    mark: "☕",
    place: "Il bar italiano",
  },
  {
    id: "cornetto",
    name: "Il cornetto",
    lesson: 10,
    mark: "✦",
    place: "La panetteria",
  },
  {
    id: "pizza",
    name: "La pizza",
    lesson: 15,
    mark: "◉",
    place: "La pizzeria napoletana",
  },
  {
    id: "vespa",
    name: "La Vespa",
    lesson: 20,
    mark: "↗",
    place: "La Vespa in città",
  },
  {
    id: "mask",
    name: "La maschera",
    lesson: 25,
    mark: "◈",
    place: "Il Carnevale di Venezia",
  },
  {
    id: "book",
    name: "Il libro",
    lesson: 30,
    mark: "▤",
    place: "La biblioteca segreta",
  },
  {
    id: "lemon",
    name: "Il limone",
    lesson: 35,
    mark: "●",
    place: "La Costiera Amalfitana",
  },
  {
    id: "ticket",
    name: "Il biglietto",
    lesson: 40,
    mark: "▰",
    place: "Il treno italiano",
  },
  {
    id: "gelato",
    name: "Il gelato",
    lesson: 45,
    mark: "♢",
    place: "La gelateria",
  },
  {
    id: "key",
    name: "La chiave",
    lesson: 50,
    mark: "⚿",
    place: "Il castello medievale",
  },
  {
    id: "postcard",
    name: "La cartolina",
    lesson: 60,
    mark: "▱",
    place: "La campagna toscana",
  },
  {
    id: "newspaper",
    name: "Il giornale",
    lesson: 80,
    mark: "▧",
    place: "La redazione del giornale",
  },
] as const;

export const collectibleDiscoveryId = (id: string) => `italian-world:${id}`;

export function collectibleForLesson(number: number) {
  return (
    italianWorldCollectibles.find((item) => item.lesson === number) ?? null
  );
}
