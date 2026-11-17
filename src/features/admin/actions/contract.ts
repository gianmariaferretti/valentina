"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  loadContractForAdmin,
  saveSignature,
} from "@/features/relationship-contract/lib/repository";
import { validSignatureImage } from "@/features/relationship-contract/lib/signature";

import { done, failed, withAdmin, type AdminResult } from "./guard";

/** Gianmaria's countersignature: unseals Article 41 for Valentina. */
export async function countersignContract(
  image: string,
  reviewed: boolean,
): Promise<AdminResult> {
  return withAdmin("countersign contract", async () => {
    if (!z.literal(true).safeParse(reviewed).success)
      return failed("Conferma di aver riletto il contratto.");
    if (typeof image !== "string" || !validSignatureImage(image))
      return failed("Disegna la firma prima di confermare.");
    const { state } = await loadContractForAdmin();
    if (state.status !== "awaiting_countersignature")
      return failed(
        state.status === "fully_executed"
          ? "Il contratto è già firmato da entrambi."
          : "Prima deve firmare Valentina.",
      );
    await saveSignature("italian", image);
    revalidatePath("/", "layout");
    return done("Controfirmato: l'Articolo 41 è svelato 🔓");
  });
}
