import type { NavigationItem } from "@/types/navigation";

export const navigationItems = [
  {
    title: "Home",
    shortTitle: "Home",
    href: "/home",
    description: "The Year One dashboard.",
    icon: "home",
    group: "primary",
  },
  {
    title: "Our coupons",
    shortTitle: "Coupons",
    href: "/coupons",
    description: "Promises with suspiciously flexible terms.",
    icon: "coupons",
    group: "primary",
  },
  {
    title: "Our map",
    shortTitle: "Map",
    href: "/map",
    description: "Coordinates for the memories that matter.",
    icon: "map",
    group: "primary",
  },
  {
    title: "Open when…",
    shortTitle: "Open when",
    href: "/open-when",
    description: "A small emergency kit in letter form.",
    icon: "open-when",
    group: "primary",
  },
  {
    title: "Gallery",
    shortTitle: "Gallery",
    href: "/gallery",
    description: "Evidence that we occasionally take a good photo.",
    icon: "gallery",
    group: "primary",
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
    title: "The quiz",
    shortTitle: "Quiz",
    href: "/quiz",
    description: "One relationship. Several trick questions.",
    icon: "quiz",
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
  {
    title: "Year Two",
    shortTitle: "Year Two",
    href: "/year-two",
    description: "The next season, with no cancellation policy.",
    icon: "year-two",
    group: "more",
  },
] as const satisfies readonly NavigationItem[];

export const primaryNavigation = navigationItems.filter(
  (item) => item.group === "primary",
);

export const secondaryNavigation = navigationItems.filter(
  (item) => item.group === "more",
);
