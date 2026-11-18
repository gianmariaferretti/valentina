import {
  ArrowUpRight,
  BadgeCheck,
  BookOpen,
  BookHeart,
  CircleHelp,
  Dices,
  FileSignature,
  Gamepad2,
  Gift,
  Heart,
  LayoutGrid,
  House,
  Images,
  KeyRound,
  MailOpen,
  ListChecks,
  MapPinned,
  Music,
  Plane,
  Medal,
  PartyPopper,
  Sparkles,
  Ticket,
  Trophy,
  type LucideIcon,
} from "lucide-react";

import type { IconName } from "@/types/navigation";

const iconMap: Record<IconName, LucideIcon> = {
  achievements: BadgeCheck,
  arrow: ArrowUpRight,
  awards: Trophy,
  casino: Dices,
  challenges: Gamepad2,
  contract: FileSignature,
  coupons: Ticket,
  gallery: Images,
  home: House,
  "italian-corner": BookOpen,
  map: MapPinned,
  memories: Heart,
  more: LayoutGrid,
  "next-time": Plane,
  "bucket-list": ListChecks,
  songs: Music,
  "open-when": MailOpen,
  "our-story": BookHeart,
  quiz: CircleHelp,
  secret: KeyRound,
  "year-two": PartyPopper,
};

interface IconProps {
  name: IconName;
  className?: string;
  size?: number;
  strokeWidth?: number;
}

export function Icon({
  name,
  className,
  size = 18,
  strokeWidth = 1.7,
}: IconProps) {
  const IconComponent = iconMap[name] ?? Sparkles;
  return (
    <IconComponent
      aria-hidden="true"
      className={className}
      size={size}
      strokeWidth={strokeWidth}
    />
  );
}

export const DecorativeMedal = Medal;
export const DecorativeGift = Gift;
