import { cn } from "@/lib/cn";

import styles from "./casino.module.css";

/** An original croupier: green visor, bow tie, waistcoat, suspicious grin. */
export function Croupier({
  size = "small",
  className,
}: {
  size?: "small" | "large";
  className?: string;
}) {
  return (
    <svg
      aria-hidden="true"
      className={cn(styles.croupier, className)}
      data-size={size}
      viewBox="0 0 120 148"
    >
      {/* body & waistcoat */}
      <path d="M18 148c2-34 18-52 42-52s40 18 42 52z" fill="#fffaf2" />
      <path d="M33 148c2-26 10-40 27-44 17 4 25 18 27 44z" fill="#7a1e4b" />
      <path d="M60 104l-9 44h18z" fill="#fffaf2" />
      <circle cx="60" cy="122" fill="#ffd166" r="2.2" />
      <circle cx="60" cy="133" fill="#ffd166" r="2.2" />
      {/* bow tie */}
      <path d="M60 100l-14-7v14zm0 0l14-7v14z" fill="#e0233d" />
      <circle cx="60" cy="100" fill="#b5172f" r="3.2" />
      {/* neck & head */}
      <rect fill="#f1c7a8" height="12" rx="4" width="16" x="52" y="84" />
      <ellipse cx="60" cy="62" fill="#f6d2b6" rx="27" ry="30" />
      {/* hair */}
      <path
        d="M33 58c0-22 13-32 27-32s27 10 27 32c-6-9-16-14-27-14s-21 5-27 14z"
        fill="#3a2418"
      />
      {/* visor */}
      <path
        d="M29 48c8-10 20-14 31-14s23 4 31 14l-6 6c-7-6-15-9-25-9s-18 3-25 9z"
        fill="#13a35e"
        opacity="0.92"
      />
      <path
        d="M31 50c8 4 18 6 29 6s21-2 29-6"
        fill="none"
        stroke="#0b6b3c"
        strokeWidth="2"
      />
      {/* face */}
      <ellipse cx="49" cy="64" fill="#2a1a12" rx="2.8" ry="3.4" />
      <ellipse cx="71" cy="64" fill="#2a1a12" rx="2.8" ry="3.4" />
      <path
        d="M44 57q5-3 10 0M66 57q5-3 10 0"
        fill="none"
        stroke="#3a2418"
        strokeLinecap="round"
        strokeWidth="2"
      />
      <path
        d="M48 76q12 9 24 0"
        fill="none"
        stroke="#7a2f20"
        strokeLinecap="round"
        strokeWidth="2.5"
      />
      <path d="M46 73c5-4 9-4 14-1 5-3 9-3 14 1" fill="#3a2418" />
      <ellipse cx="42" cy="72" fill="#ff8fa3" opacity="0.45" rx="5" ry="3" />
      <ellipse cx="78" cy="72" fill="#ff8fa3" opacity="0.45" rx="5" ry="3" />
      {/* a kiss chip */}
      <circle
        cx="96"
        cy="128"
        fill="#b5172f"
        r="11"
        stroke="#fffaf2"
        strokeDasharray="4 3"
        strokeWidth="2.5"
      />
      <text fontSize="11" textAnchor="middle" x="96" y="132">
        💋
      </text>
    </svg>
  );
}

export const croupierQuips = {
  lobby: [
    "Welcome, madame. The house has missed you. Mostly your kisses.",
    "Pick a table. Any table. They are all rigged with love.",
    "Tonight's special: coupons. Tonight's price: kisses.",
    "Gianmaria asked me to say the odds are fair. I said no.",
    "The roulette likes the number 31. I wonder why.",
  ],
  win: [
    "Beginner's luck. Or skill. Mostly luck.",
    "The house is crying. Quietly.",
    "Well played. Please do not tell Gianmaria.",
    "Look at you, winning things.",
  ],
  lose: [
    "The house thanks you for your contribution.",
    "So close. Closer than you think. Probably.",
    "That one was just a warm-up.",
    "Another kiss for the house. Lovely.",
  ],
  coupon: [
    "A coupon! Go spend it before Gianmaria notices.",
    "That one goes straight to the wallet.",
  ],
} as const;

export function pickQuip(kind: keyof typeof croupierQuips, seed: number) {
  const list = croupierQuips[kind];
  return list[Math.abs(Math.floor(seed)) % list.length];
}
