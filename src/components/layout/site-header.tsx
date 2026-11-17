"use client";

import { ChevronDown, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Drawer } from "vaul";

import { Icon } from "@/components/ui/icon";
import { moreNavigation, tabFor, tabNavigation } from "@/data/navigation";
import { endAccessSession } from "@/features/access/actions/end-session";
import { cn } from "@/lib/cn";

const CASINO_HREF = "/coupons/casino";
const COUPONS_HREF = "/coupons";

interface Badges {
  /** Streams in: new coupons this week. */
  couponsBadge?: ReactNode;
  /** Streams in: a red dot when something is waiting in the Kiss Casino. */
  casinoBadge?: ReactNode;
}

function badgeFor(href: string, badges: Badges) {
  if (href === COUPONS_HREF) return badges.couponsBadge ?? null;
  if (href === CASINO_HREF) return badges.casinoBadge ?? null;
  return null;
}

/** Top bar. On computers it carries the tabs and a "More" menu. */
export function SiteHeader({
  progress,
  ...badges
}: Badges & { progress: ReactNode }) {
  const pathname = usePathname();
  const current = tabFor(pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[color:rgba(242,235,224,0.88)] backdrop-blur-xl">
      <div className="mx-auto flex h-18 max-w-[92rem] items-center gap-6 px-5 sm:px-8">
        <Link
          aria-label="V and G home"
          className="font-display text-2xl tracking-[-0.04em]"
          href="/home"
        >
          V<span className="text-[var(--rust)]">&</span>G
        </Link>

        <nav
          aria-label="Main"
          className="hidden min-w-0 flex-1 items-center gap-1 lg:flex"
        >
          {tabNavigation.map((item) => (
            <Link
              aria-current={current === item.href ? "page" : undefined}
              className={cn(
                "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-[0.04em] transition",
                current === item.href
                  ? "bg-[var(--ink)] text-[var(--paper)]"
                  : "text-[var(--muted)] hover:bg-white/45 hover:text-[var(--ink)]",
              )}
              data-kiss-target={item.href === CASINO_HREF ? "" : undefined}
              href={item.href}
              key={item.href}
            >
              <Icon name={item.icon} size={15} />
              {item.shortTitle}
              {badgeFor(item.href, badges)}
            </Link>
          ))}
          <MoreMenu active={current === "more"} pathname={pathname} />
        </nav>

        <span className="ml-auto text-[0.6rem] font-semibold tracking-[0.18em] text-[var(--muted)] uppercase lg:hidden">
          Private archive
        </span>
        <form action={endAccessSession} className="hidden lg:ml-auto lg:block">
          <button
            aria-label="Lock the private archive"
            className="grid size-11 place-items-center rounded-full border border-[var(--line-strong)] transition hover:bg-white/50"
            type="submit"
          >
            <LogOut aria-hidden="true" size={16} />
          </button>
        </form>
      </div>
      {progress}
    </header>
  );
}

function MoreMenu({ active, pathname }: { active: boolean; pathname: string }) {
  const [open, setOpen] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapper}>
      <button
        aria-controls="more-menu"
        aria-expanded={open}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-full px-4 py-2 text-xs font-medium tracking-[0.04em] transition",
          active
            ? "bg-[var(--ink)] text-[var(--paper)]"
            : "text-[var(--muted)] hover:bg-white/45 hover:text-[var(--ink)]",
        )}
        onClick={() => setOpen((value) => !value)}
        ref={button}
        type="button"
      >
        <Icon name="more" size={15} />
        More
        <ChevronDown
          aria-hidden="true"
          className={cn("transition", open && "rotate-180")}
          size={14}
        />
      </button>
      {open ? (
        <div
          className="absolute top-full left-0 z-50 mt-2 w-80 rounded-[1.4rem] border border-[var(--line)] bg-[var(--paper)] p-2 shadow-2xl shadow-black/10"
          id="more-menu"
        >
          <MoreLinks onNavigate={() => setOpen(false)} pathname={pathname} />
        </div>
      ) : null}
    </div>
  );
}

function MoreLinks({
  pathname,
  onNavigate,
}: {
  pathname: string;
  onNavigate: () => void;
}) {
  return (
    <ul className="grid gap-0.5">
      {moreNavigation.map((item) => {
        const here =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <li key={item.href}>
            <Link
              aria-current={here ? "page" : undefined}
              className={cn(
                "flex min-h-12 items-center gap-3 rounded-2xl px-3 py-2 transition hover:bg-white/70",
                here && "bg-white/70",
              )}
              href={item.href}
              onClick={onNavigate}
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-full border border-[var(--line)]">
                <Icon name={item.icon} size={16} />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">
                  {item.shortTitle}
                </span>
                <span className="block truncate text-xs text-[var(--muted)]">
                  {item.description}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/** Phone tab bar: Coupons · Casino · Games · Memories · More (a drawer). */
export function TabBar(badges: Badges) {
  const pathname = usePathname();
  const current = tabFor(pathname);
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (lastPath !== pathname) {
    setLastPath(pathname);
    setOpen(false);
  }

  const tabClass = (on: boolean) =>
    cn(
      "relative flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-2xl text-[0.62rem] font-semibold tracking-[0.02em] transition",
      on ? "text-[var(--ink)]" : "text-[var(--muted)]",
    );

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-[55] border-t border-[var(--line)] bg-[color:rgba(242,235,224,0.94)] px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto flex max-w-lg items-stretch">
        {tabNavigation.map((item) => {
          const on = current === item.href;
          return (
            <li className="flex flex-1" key={item.href}>
              <Link
                aria-current={on ? "page" : undefined}
                className={tabClass(on)}
                href={item.href}
              >
                <span
                  className={cn(
                    "relative grid h-7 w-12 place-items-center rounded-full transition",
                    on && "bg-[var(--ink)] text-[var(--paper)]",
                  )}
                  data-kiss-target={item.href === CASINO_HREF ? "" : undefined}
                >
                  <Icon name={item.icon} size={18} />
                  <span className="absolute -top-1.5 -right-1">
                    {badgeFor(item.href, badges)}
                  </span>
                </span>
                {item.shortTitle}
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <Drawer.Root onOpenChange={setOpen} open={open}>
            <Drawer.Trigger
              aria-current={current === "more" ? "page" : undefined}
              className={tabClass(current === "more" || open)}
            >
              <span
                className={cn(
                  "grid h-7 w-12 place-items-center rounded-full transition",
                  (current === "more" || open) &&
                    "bg-[var(--ink)] text-[var(--paper)]",
                )}
              >
                <Icon name="more" size={18} />
              </span>
              More
            </Drawer.Trigger>
            <Drawer.Portal>
              <Drawer.Overlay className="fixed inset-0 z-[70] bg-black/40" />
              <Drawer.Content className="fixed inset-x-0 bottom-0 z-[71] flex max-h-[85svh] flex-col rounded-t-[1.6rem] bg-[var(--paper)] outline-none">
                <div
                  aria-hidden="true"
                  className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-[var(--line-strong)]"
                />
                <div className="overflow-y-auto px-4 pt-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
                  <Drawer.Title className="px-1 font-display text-3xl">
                    More
                  </Drawer.Title>
                  <Drawer.Description className="mb-2 px-1 text-xs text-[var(--muted)]">
                    The rest of the archive. Some of it is even serious.
                  </Drawer.Description>
                  <MoreLinks
                    onNavigate={() => setOpen(false)}
                    pathname={pathname}
                  />
                  <form
                    action={endAccessSession}
                    className="mt-3 border-t border-[var(--line)] pt-3"
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
                </div>
              </Drawer.Content>
            </Drawer.Portal>
          </Drawer.Root>
        </li>
      </ul>
    </nav>
  );
}
