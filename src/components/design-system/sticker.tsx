import {
  BadgeCheck,
  CalendarDays,
  Check,
  Flame,
  Heart,
  KeyRound,
  MapPin,
  ShieldCheck,
  Star,
  type LucideIcon,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "@/lib/cn";
import type {
  StickerPosition,
  StickerSize,
  StickerVariant,
} from "@/types/design-system";

interface StickerDefinition {
  defaultText: string;
  icon?: LucideIcon;
  rotation: number;
}

const stickerDefinitions: Record<StickerVariant, StickerDefinition> = {
  text: { defaultText: "Year One", rotation: -2 },
  location: { defaultText: "Somewhere important", icon: MapPin, rotation: 2 },
  date: { defaultText: "04 · 10 · 25", icon: CalendarDays, rotation: -1 },
  classified: { defaultText: "Classified", icon: KeyRound, rotation: -4 },
  "girlfriend-approved": {
    defaultText: "Girlfriend approved",
    icon: BadgeCheck,
    rotation: 3,
  },
  "boyfriend-certified": {
    defaultText: "Boyfriend certified",
    icon: ShieldCheck,
    rotation: -3,
  },
  "do-not-open": { defaultText: "Do not open", icon: KeyRound, rotation: 2 },
  redeemed: { defaultText: "Redeemed", icon: Check, rotation: -5 },
  legendary: { defaultText: "Legendary", icon: Flame, rotation: 4 },
  "top-secret": { defaultText: "Top secret", icon: KeyRound, rotation: -2 },
  star: { defaultText: "Five stars", icon: Star, rotation: 5 },
  heart: { defaultText: "Us", icon: Heart, rotation: -3 },
};

const sizeClassNames: Record<StickerSize, string> = {
  sm: "min-h-8 gap-1.5 px-2.5 py-1 text-[0.56rem]",
  md: "min-h-10 gap-2 px-3.5 py-1.5 text-[0.65rem]",
  lg: "min-h-12 gap-2.5 px-4 py-2 text-[0.73rem]",
};

const positionClassNames: Record<StickerPosition, string> = {
  inline: "relative",
  "top-left": "absolute top-4 left-4 z-10",
  "top-right": "absolute top-4 right-4 z-10",
  "bottom-left": "absolute bottom-4 left-4 z-10",
  "bottom-right": "absolute right-4 bottom-4 z-10",
};

type StickerStyle = CSSProperties & { "--sticker-rotation": string };

interface StickerProps {
  variant?: StickerVariant;
  rotation?: number;
  size?: StickerSize;
  position?: StickerPosition;
  text?: string;
  children?: ReactNode;
  className?: string;
}

export function Sticker({
  variant = "text",
  rotation,
  size = "md",
  position = "inline",
  text,
  children,
  className,
}: StickerProps) {
  const definition = stickerDefinitions[variant];
  const Icon = definition.icon;
  const resolvedRotation = rotation ?? definition.rotation;
  const style: StickerStyle = {
    "--sticker-rotation": `${resolvedRotation}deg`,
  };

  return (
    <span
      className={cn(
        "sticker",
        sizeClassNames[size],
        positionClassNames[position],
        className,
      )}
      data-variant={variant}
      style={style}
    >
      {Icon ? <Icon aria-hidden="true" size={size === "lg" ? 16 : 14} /> : null}
      <span>{children ?? text ?? definition.defaultText}</span>
    </span>
  );
}
