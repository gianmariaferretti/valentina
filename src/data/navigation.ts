import type { NavigationItem } from "@/types/navigation";

/**
 * The app-style navigation. Tabs: Coupons · Casino · Games · Memories · More.
 * Memories is a hub page; More opens a drawer (phone) or a menu (desktop).
 */
export const navigationItems = [
  {
    title: "Our coupons",
    shortTitle: "Coupons",
    href: "/coupons",
    description: "Promises with suspiciously flexible terms.",
    icon: "coupons",
    group: "tab",
  },
  {
    title: "Kiss Casino",
    shortTitle: "Casino",
    href: "/coupons/casino",
    description: "Rigged, openly. Win coupons, lose kisses.",
    icon: "casino",
    group: "tab",
  },
  {
    title: "V&G Games",
    shortTitle: "Games",
    href: "/challenges",
    description: "Five playable files from the private archive.",
    icon: "challenges",
    group: "tab",
  },
  {
    title: "Memories",
    shortTitle: "Memories",
    href: "/memories",
    description: "Places, photos, letters, songs and what comes next.",
    icon: "memories",
    group: "tab",
  },
  {
    title: "Our map",
    shortTitle: "Map",
    href: "/map",
    description: "Coordinates for the memories that matter.",
    icon: "map",
    group: "memories",
  },
  {
    title: "Our story",
    shortTitle: "Our story",
    href: "/our-story",
    description: "Year One, chapter by chapter, scrolling.",
    icon: "our-story",
    group: "memories",
  },
  {
    title: "Gallery",
    shortTitle: "Gallery",
    href: "/gallery",
    description: "Evidence that we occasionally take a good photo.",
    icon: "gallery",
    group: "memories",
  },
  {
    title: "Open when…",
    shortTitle: "Letters",
    href: "/open-when",
    description: "A small emergency kit in letter form.",
    icon: "open-when",
    group: "memories",
  },
  {
    title: "Year Two",
    shortTitle: "Year Two",
    href: "/year-two",
    description: "The next season, with no cancellation policy.",
    icon: "year-two",
    group: "memories",
  },
  {
    title: "Next time",
    shortTitle: "Next time",
    href: "/next-time",
    description: "Departures board, plans and the suitcase.",
    icon: "next-time",
    group: "memories",
  },
  {
    title: "Bucket list",
    shortTitle: "Bucket list",
    href: "/bucket-list",
    description: "Things to do in this life, together.",
    icon: "bucket-list",
    group: "memories",
  },
  {
    title: "Our songs",
    shortTitle: "Songs",
    href: "/songs",
    description: "The soundtrack so far.",
    icon: "songs",
    group: "memories",
  },
  {
    title: "The quiz",
    shortTitle: "Quiz",
    href: "/quiz",
    description: "One relationship. Several trick questions.",
    icon: "quiz",
    group: "more",
  },
  {
    title: "Italian Academy",
    shortTitle: "Academy",
    href: "/italian-corner",
    description: "La Dolce Lingua and two very Italian examinations.",
    icon: "italian-corner",
    group: "more",
  },
  {
    title: "The Relationship Contract™",
    shortTitle: "Contract",
    href: "/relationship-contract",
    description: "Forty articles. Two countries. One love story.",
    icon: "contract",
    group: "more",
  },
  {
    title: "Awards",
    shortTitle: "Awards",
    href: "/awards",
    description: "Celebrating excellence and avoidable chaos.",
    icon: "awards",
    group: "more",
  },
  {
    title: "Achievements",
    shortTitle: "Achievements",
    href: "/achievements",
    description: "Badges earned through highly serious research.",
    icon: "achievements",
    group: "more",
  },
  {
    title: "Secret",
    shortTitle: "Secret",
    href: "/secret",
    description: "Nothing to see here. Obviously.",
    icon: "secret",
    group: "more",
  },
] as const satisfies readonly NavigationItem[];

export const tabNavigation = navigationItems.filter(
  (item) => item.group === "tab",
);

export const memoriesNavigation = navigationItems.filter(
  (item) => item.group === "memories",
);

export const moreNavigation = navigationItems.filter(
  (item) => item.group === "more",
);

/** Which tab a path belongs to; null means "More". The home is the wallet. */
export function tabFor(pathname: string): string | null {
  const under = (href: string) =>
    pathname === href || pathname.startsWith(`${href}/`);
  if (under("/coupons/casino")) return "/coupons/casino";
  if (pathname === "/home" || under("/coupons")) return "/coupons";
  if (under("/challenges")) return "/challenges";
  if (
    pathname === "/memories" ||
    memoriesNavigation.some((item) => under(item.href))
  )
    return "/memories";
  if (
    moreNavigation.some((item) => under(item.href)) ||
    under("/la-dolce-lingua")
  )
    return "more";
  return null;
}
