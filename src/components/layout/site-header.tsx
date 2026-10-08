"use client";

import { LogOut, Menu, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";

import { Icon } from "@/components/ui/icon";
import { primaryNavigation, secondaryNavigation } from "@/data/navigation";
import { endAccessSession } from "@/features/access/actions/end-session";
import { cn } from "@/lib/cn";

function isCurrentPath(pathname: string, href: string) {
  return (
    pathname === href || (href !== "/home" && pathname.startsWith(`${href}/`))
  );
}

export function SiteHeader({ progress }: { progress: ReactNode }) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const mobileNavigationRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const animationFrame = requestAnimationFrame(() => {
      mobileNavigationRef.current
        ?.querySelector<HTMLAnchorElement>("a[href]")
        ?.focus();
    });
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      setIsOpen(false);
      menuButtonRef.current?.focus();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      cancelAnimationFrame(animationFrame);
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color:rgba(242,235,224,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[92rem] items-center gap-8 px-5 sm:px-8">
        <Link
          aria-label="V and G home"
          className="font-display text-2xl tracking-[-0.04em]"
          href="/home"
        >
          V<span className="text-[var(--rust)]">&</span>G
        </Link>

        <nav className="hidden min-w-0 flex-1 items-center gap-1 lg:flex">
          {primaryNavigation.map((item) => (
            <Link
              className={cn(
                "inline-flex min-h-11 items-center rounded-full px-3.5 py-2 text-xs font-medium tracking-[0.04em] transition",
                isCurrentPath(pathname, item.href)
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:bg-white/45 hover:text-[var(--ink)]",
              )}
              aria-current={
                isCurrentPath(pathname, item.href) ? "page" : undefined
              }
              href={item.href}
              key={item.href}
            >
              {item.shortTitle}
            </Link>
          ))}
        </nav>

        <div className="ml-auto hidden items-center gap-3 lg:flex">
          <span className="text-[0.6rem] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
            Private archive · 01
          </span>
          <Link
            aria-label="Open secret section"
            className="grid size-11 place-items-center rounded-full border border-[var(--line-strong)] transition hover:bg-white/50"
            href="/secret"
          >
            <Icon name="secret" size={16} />
          </Link>
          <form action={endAccessSession}>
            <button
              aria-label="Lock the private archive"
              className="grid size-11 place-items-center rounded-full border border-[var(--line-strong)] transition hover:bg-white/50"
              type="submit"
            >
              <LogOut aria-hidden="true" size={16} />
            </button>
          </form>
        </div>

        <button
          aria-controls="mobile-navigation"
          aria-expanded={isOpen}
          aria-label={isOpen ? "Close navigation" : "Open navigation"}
          className="ml-auto grid size-11 place-items-center rounded-full border border-[var(--line-strong)] lg:hidden"
          onClick={() => setIsOpen((current) => !current)}
          ref={menuButtonRef}
          type="button"
        >
          {isOpen ? <X size={19} /> : <Menu size={19} />}
        </button>
      </div>

      {progress}

      {isOpen ? (
        <nav
          className="absolute inset-x-0 top-full max-h-[calc(100svh-7.25rem)] overflow-y-auto border-b border-[var(--line)] bg-[var(--paper)] px-5 py-6 shadow-2xl shadow-black/10 lg:hidden"
          id="mobile-navigation"
          ref={mobileNavigationRef}
        >
          <p className="mb-3 text-[0.6rem] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
            The essentials
          </p>
          <div className="grid gap-1">
            {primaryNavigation.map((item) => (
              <MobileLink
                current={isCurrentPath(pathname, item.href)}
                href={item.href}
                item={item}
                key={item.href}
                onNavigate={() => setIsOpen(false)}
              />
            ))}
          </div>
          <p className="mt-7 mb-3 text-[0.6rem] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase">
            More questionable decisions
          </p>
          <div className="grid gap-1 sm:grid-cols-2">
            {secondaryNavigation.map((item) => (
              <MobileLink
                current={isCurrentPath(pathname, item.href)}
                href={item.href}
                item={item}
                key={item.href}
                onNavigate={() => setIsOpen(false)}
              />
            ))}
          </div>
          <form
            action={endAccessSession}
            className="mt-6 border-t border-[var(--line)] pt-5"
          >
            <button
              className="flex min-h-12 w-full items-center gap-3 rounded-2xl px-3 text-left text-sm font-semibold text-[var(--muted)] transition hover:bg-white/60 hover:text-[var(--ink)]"
              type="submit"
            >
              <span className="grid size-9 place-items-center rounded-full border border-[var(--line)]">
                <LogOut aria-hidden="true" size={16} />
              </span>
              Lock private archive
            </button>
          </form>
        </nav>
      ) : null}
    </header>
  );
}

function MobileLink({
  current,
  href,
  item,
  onNavigate,
}: {
  current: boolean;
  href: string;
  item:
    (typeof primaryNavigation)[number] | (typeof secondaryNavigation)[number];
  onNavigate: () => void;
}) {
  return (
    <Link
      aria-current={current ? "page" : undefined}
      className="flex items-center gap-3 rounded-2xl px-3 py-3 transition hover:bg-white/60"
      href={href}
      onClick={onNavigate}
    >
      <span className="grid size-9 place-items-center rounded-full border border-[var(--line)]">
        <Icon name={item.icon} size={16} />
      </span>
      <span>
        <span className="block text-sm font-semibold">{item.shortTitle}</span>
        <span className="block text-xs text-[var(--muted)]">
          {item.description}
        </span>
      </span>
    </Link>
  );
}
