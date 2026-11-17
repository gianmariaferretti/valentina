export type IconName =
  | "achievements"
  | "arrow"
  | "awards"
  | "casino"
  | "challenges"
  | "contract"
  | "coupons"
  | "gallery"
  | "home"
  | "memories"
  | "more"
  | "italian-corner"
  | "map"
  | "next-time"
  | "bucket-list"
  | "songs"
  | "open-when"
  | "quiz"
  | "secret"
  | "year-two";

export type NavigationGroup = "tab" | "memories" | "more";

export interface NavigationItem {
  readonly title: string;
  readonly shortTitle: string;
  readonly href: string;
  readonly description: string;
  readonly icon: IconName;
  readonly group: NavigationGroup;
}
