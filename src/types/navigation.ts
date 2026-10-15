export type IconName =
  | "achievements"
  | "arrow"
  | "awards"
  | "challenges"
  | "contract"
  | "coupons"
  | "gallery"
  | "home"
  | "italian-corner"
  | "map"
  | "open-when"
  | "quiz"
  | "secret"
  | "year-two";

export type NavigationGroup = "primary" | "more";

export interface NavigationItem {
  readonly title: string;
  readonly shortTitle: string;
  readonly href: string;
  readonly description: string;
  readonly icon: IconName;
  readonly group: NavigationGroup;
}
