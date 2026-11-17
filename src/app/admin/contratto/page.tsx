import type { Metadata } from "next";

import "../../(experience)/relationship-contract/relationship-contract.css";

import { countersignContract } from "@/features/admin/actions/contract";
import {
  Card,
  formatWhen,
  Pill,
  SectionHeader,
} from "@/features/admin/components/admin-shell";
import { Countersign } from "@/features/admin/components/countersign";
import { loadContractForAdmin } from "@/features/relationship-contract/lib/repository";
import { requireAdminSession } from "@/lib/auth/admin-session";

export const metadata: Metadata = { title: "Contratto" };

const statusLabel = {
  awaiting_valentina: ["Aspetta la firma di Valentina", "neutral"],
  awaiting_countersignature: ["Da controfirmare", "warn"],
  fully_executed: ["Firmato da entrambi · Articolo 41 svelato", "good"],
} as const;

export default async function ContractAdminPage() {
  await requireAdminSession();
  const { state } = await loadContractForAdmin();
  const [label, tone] = statusLabel[state.status] ?? ["—", "neutral"];
  return (
    <div className="max-w-2xl">
      <SectionHeader
        subtitle="La controfirma ora si fa solo da qui, non più dalla pagina del contratto."
        title="Contratto"
      />
      <Card className="grid gap-4">
        {state.loadFailed ? (
          <p className="text-sm">
            Non riesco a leggere il contratto ora. Riprova tra poco.
          </p>
        ) : (
          <>
            <p>
              <Pill tone={tone}>{label}</Pill>
            </p>
            <ul className="text-sm">
              {state.signatures.map((signature) => (
                <li key={signature.role}>
                  {signature.role === "colombian" ? "Valentina" : "Gianmaria"}{" "}
                  ha firmato il {formatWhen(signature.signedAt)}
                </li>
              ))}
            </ul>
            {state.rewardRequestedAt ? (
              <p className="rounded-xl bg-[#fff8e3] p-3 text-sm">
                🎁 Valentina ha chiesto il premio il{" "}
                {formatWhen(state.rewardRequestedAt)}.
              </p>
            ) : null}
            {state.status === "awaiting_countersignature" ? (
              <Countersign sign={countersignContract} />
            ) : null}
          </>
        )}
      </Card>
    </div>
  );
}
