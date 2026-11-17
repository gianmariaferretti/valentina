import type { Metadata } from "next";

import { Checklist } from "@/features/life/components/checklist";
import { DepartureBoard } from "@/features/life/components/departure-board";
import { loadListItems, loadNextTime } from "@/features/life/repositories/life";
import { requireAccessSession } from "@/lib/auth/session";

export const metadata: Metadata = { title: "Next time" };

export default async function NextTimePage() {
  await requireAccessSession();
  const [next, todo, suitcase] = await Promise.all([
    loadNextTime(),
    loadListItems("todo").catch(() => []),
    loadListItems("suitcase").catch(() => []),
  ]);
  return (
    <div className="page-container py-6 sm:py-10">
      <header className="mb-5">
        <p className="text-[0.62rem] font-bold tracking-[0.2em] text-[var(--rust)] uppercase">
          Gate V+G · Final call for hugs
        </p>
        <h1 className="mt-2 font-display text-[clamp(2.6rem,10vw,5rem)] leading-[0.9] italic">
          Next time
        </h1>
      </header>
      <DepartureBoard next={next} />
      <div className="mt-6 grid gap-5 lg:grid-cols-2">
        <Checklist
          canPropose
          emptyText="Nothing planned yet. Suspicious."
          items={todo}
          list="todo"
          title="Things to do together"
        />
        <Checklist
          canPropose={false}
          emptyText="The suitcase is empty. Gianmaria is packing hope."
          items={suitcase}
          list="suitcase"
          title="Suitcase"
        />
      </div>
    </div>
  );
}
