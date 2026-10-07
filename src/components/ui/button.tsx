import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";

import { cn } from "@/lib/cn";

const baseClassName =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-[0.72rem] font-semibold tracking-[0.14em] uppercase transition duration-300 focus-visible:outline-2 focus-visible:outline-offset-4 disabled:cursor-not-allowed disabled:opacity-50";

const variants = {
  primary:
    "bg-[var(--ink)] text-[var(--paper)] hover:bg-[var(--oxblood)] focus-visible:outline-[var(--oxblood)]",
  secondary:
    "border border-[var(--line-strong)] bg-white/35 text-[var(--ink)] hover:border-[var(--ink)] hover:bg-white/65 focus-visible:outline-[var(--ink)]",
  light:
    "bg-[var(--paper)] text-[var(--ink)] hover:bg-white focus-visible:outline-white",
} as const;

type ButtonVariant = keyof typeof variants;

interface LinkButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  variant?: ButtonVariant;
}

export function LinkButton({
  href,
  children,
  className,
  variant = "primary",
}: LinkButtonProps) {
  return (
    <Link
      className={cn(baseClassName, variants[variant], className)}
      href={href}
    >
      {children}
    </Link>
  );
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

export function Button({
  className,
  type = "button",
  variant = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(baseClassName, variants[variant], className)}
      type={type}
      {...props}
    />
  );
}
