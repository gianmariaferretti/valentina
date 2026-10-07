"use client";

import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
} from "lucide-react";

import type { GameDirection } from "@/features/challenges/types";
import { cn } from "@/lib/cn";

const controls = [
  {
    direction: "up",
    label: "Move up",
    Icon: ChevronUp,
    position: "col-start-2",
  },
  {
    direction: "left",
    label: "Move left",
    Icon: ChevronLeft,
    position: "col-start-1 row-start-2",
  },
  {
    direction: "down",
    label: "Move down",
    Icon: ChevronDown,
    position: "col-start-2 row-start-2",
  },
  {
    direction: "right",
    label: "Move right",
    Icon: ChevronRight,
    position: "col-start-3 row-start-2",
  },
] as const;

export function ArcadeDPad({
  disabled,
  onDirection,
}: {
  disabled?: boolean;
  onDirection: (direction: GameDirection) => void;
}) {
  return (
    <div
      aria-label="Directional controls"
      className="mx-auto grid w-fit grid-cols-3 grid-rows-2 gap-2"
      role="group"
    >
      {controls.map(({ direction, label, Icon, position }) => (
        <button
          aria-label={label}
          className={cn(
            "grid size-13 place-items-center rounded-xl border border-white/18 bg-white/7 text-white transition active:scale-95 active:bg-white/16 disabled:opacity-30",
            position,
          )}
          disabled={disabled}
          key={direction}
          onPointerDown={(event) => {
            event.preventDefault();
            onDirection(direction);
          }}
          type="button"
        >
          <Icon aria-hidden="true" size={22} strokeWidth={1.8} />
        </button>
      ))}
    </div>
  );
}
