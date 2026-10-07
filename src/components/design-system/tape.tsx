import type { CSSProperties } from "react";

import { cn } from "@/lib/cn";

type TapeTone = "cream" | "rose" | "yellow" | "clear" | "burgundy";
type TapeSize = "sm" | "md" | "lg";
type TapePosition = "inline" | "top" | "top-left" | "top-right";

const sizeClassNames: Record<TapeSize, string> = {
  sm: "h-5 w-20",
  md: "h-7 w-28",
  lg: "h-9 w-36",
};

const positionClassNames: Record<TapePosition, string> = {
  inline: "relative",
  top: "absolute top-0 left-1/2 z-10",
  "top-left": "absolute top-1 left-5 z-10",
  "top-right": "absolute top-1 right-5 z-10",
};

type TapeStyle = CSSProperties & { "--tape-rotation": string };

interface TapeProps {
  tone?: TapeTone;
  size?: TapeSize;
  position?: TapePosition;
  rotation?: number;
  className?: string;
}

export function Tape({
  tone = "cream",
  size = "md",
  position = "inline",
  rotation = -2,
  className,
}: TapeProps) {
  const style: TapeStyle = { "--tape-rotation": `${rotation}deg` };

  return (
    <span
      aria-hidden="true"
      className={cn(
        "tape",
        sizeClassNames[size],
        positionClassNames[position],
        className,
      )}
      data-position={position}
      data-tone={tone}
      style={style}
    />
  );
}
