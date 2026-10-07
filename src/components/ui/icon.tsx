import {
  ArrowUpRight,
  BadgeCheck,
  CircleHelp,
  Gamepad2,
  Gift,
  House,
  Images,
  KeyRound,
  MailOpen,
  MapPinned,
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
  challenges: Gamepad2,
  coupons: Ticket,
  gallery: Images,
  home: House,
  map: MapPinned,
  "open-when": MailOpen,
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
