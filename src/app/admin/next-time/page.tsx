import type { Metadata } from "next";

import {
  approveListItem,
  createListItem,
  deleteListItem,
  moveListItem,
  saveNextTime,
  tickListItem,
  updateListItem,
} from "@/features/admin/actions/life";
import {
  Card,
  SectionHeader,
  Unavailable,
} from "@/features/admin/components/admin-shell";
import { NextTimeForm } from "@/features/admin/components/life-forms";
import { ListManager } from "@/features/admin/components/list-manager";
import { isoToRomeLocal } from "@/features/life/lib/rome-time";
import { loadListItems, loadNextTime } from "@/features/life/repositories/life";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Next time" };

const actions = {
  create: createListItem,
  update: updateListItem,
  remove: deleteListItem,
  approve: approveListItem,
  tick: tickListItem,
  move: moveListItem,
};

export default async function AdminNextTimePage() {
  await requireAdminSession();
  let data;
  try {
    data = await Promise.all([
      loadNextTime(),
      loadListItems("todo"),
      loadListItems("suitcase"),
    ]);
  } catch {
    return (
      <>
        <SectionHeader title="Next time" />
        <Unavailable />
      </>
    );
  }
  const [next, todo, suitcase] = data;
  return (
    <div>
      <SectionHeader
        subtitle="La stessa data muove anche il conto alla rovescia del portafoglio Apart."
        title="Next time"
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="lg:col-span-2">
          <h2 className="mb-3 text-lg font-semibold">Prossimo incontro</h2>
          <NextTimeForm
            initial={{
              at: isoToRomeLocal(next.at),
              from: next.from,
              to: next.to,
              status: next.status,
            }}
            save={saveNextTime}
          />
        </Card>
        <Card>
          <h2 className="mb-2 text-lg font-semibold">Cose da fare insieme</h2>
          <ListManager actions={actions} items={todo} list="todo" />
        </Card>
        <Card>
          <h2 className="mb-2 text-lg font-semibold">Valigia</h2>
          <ListManager actions={actions} items={suitcase} list="suitcase" />
        </Card>
      </div>
    </div>
  );
}
