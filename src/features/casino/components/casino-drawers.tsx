"use client";

import { Sparkles } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { Drawer } from "vaul";

import { cn } from "@/lib/cn";

import type { CasinoView } from "../lib/engine";
import {
  BeatPanel,
  FeedPanel,
  LuckPanel,
  MissionsPanel,
  PassPanel,
  PiggyPanel,
  SetsPanel,
  ShopPanel,
  VipPanel,
  WelcomePanel,
} from "./casino-panels";
import styles from "./casino.module.css";

function Sheet({
  open,
  onOpenChange,
  title,
  description,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <Drawer.Root onOpenChange={onOpenChange} open={open}>
      <Drawer.Portal>
        <Drawer.Overlay className={styles.drawerOverlay} />
        <Drawer.Content className={styles.drawer}>
          <div aria-hidden="true" className={styles.drawerHandle} />
          <div className={styles.drawerBody}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <Drawer.Title className="font-display text-3xl italic">
                  {title}
                </Drawer.Title>
                <Drawer.Description className={cn(styles.muted, "text-xs")}>
                  {description}
                </Drawer.Description>
              </div>
              <Drawer.Close className={styles.smallButton}>Close</Drawer.Close>
            </div>
            {children}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

export interface DrawerActions {
  busy: boolean;
  onWelcome: () => void;
  onMission: (id: string) => void;
  onPass: () => void;
  onPiggy: () => void;
  onBuy: (id: string) => void;
}

export function RewardsDrawer({
  open,
  onOpenChange,
  view,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: CasinoView;
  actions: DrawerActions;
}) {
  return (
    <Sheet
      description="Missions, Kiss Pass, piggy bank, VIP and sets."
      onOpenChange={onOpenChange}
      open={open}
      title="Rewards"
    >
      <WelcomePanel
        disabled={actions.busy}
        onCollect={actions.onWelcome}
        view={view}
      />
      <div className="grid gap-3 md:grid-cols-2">
        <MissionsPanel
          disabled={actions.busy}
          onClaim={actions.onMission}
          view={view}
        />
        <PassPanel
          disabled={actions.busy}
          onCollect={actions.onPass}
          view={view}
        />
        <LuckPanel view={view} />
        <BeatPanel view={view} />
        <PiggyPanel
          disabled={actions.busy}
          onBreak={actions.onPiggy}
          view={view}
        />
        <VipPanel view={view} />
        <SetsPanel view={view} />
        <FeedPanel view={view} />
      </div>
      <nav
        aria-label="Casino pages"
        className="flex flex-wrap justify-center gap-x-6 gap-y-2 pt-2 text-xs text-[#d9c7cf]"
      >
        <Link
          className="underline-offset-4 hover:underline"
          href="/coupons/casino/debt"
        >
          Kiss Debt
        </Link>
        {view.curtainUnlocked ? (
          <Link
            className="inline-flex items-center gap-1 text-[#ffd166] underline-offset-4 hover:underline"
            href="/coupons/casino/behind-the-curtain"
          >
            <Sparkles aria-hidden="true" size={13} />
            Behind the Curtain
          </Link>
        ) : null}
      </nav>
    </Sheet>
  );
}

export function ShopDrawer({
  open,
  onOpenChange,
  view,
  actions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  view: CasinoView;
  actions: DrawerActions;
}) {
  return (
    <Sheet
      description="Every 💋 you buy is a real kiss you owe Gianmaria."
      onOpenChange={onOpenChange}
      open={open}
      title="Buy 💋"
    >
      <ShopPanel disabled={actions.busy} onBuy={actions.onBuy} view={view} />
    </Sheet>
  );
}
