"use server";

import { revalidatePath } from "next/cache";

import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

import {
  claimContractReward,
  loadContract,
  saveSignature,
  withdrawValentinaSignature,
} from "./lib/repository";
import { validSignatureImage } from "./lib/signature";
import type { ContractActionResult } from "./types";

const denied: ContractActionResult = {
  ok: false,
  message: "Private session expired. Enter the archive again.",
};

export async function signAsValentina(
  image: string,
  reviewed: boolean,
): Promise<ContractActionResult> {
  if (!(await hasValidAccessSession())) return denied;
  if (!reviewed)
    return {
      ok: false,
      message:
        "Please confirm that you have reviewed the commemorative Agreement.",
    };
  if (!validSignatureImage(image))
    return { ok: false, message: "Draw a signature before confirming." };
  try {
    await saveSignature("colombian", image);
    revalidatePath("/relationship-contract");
    return {
      ok: true,
      message:
        "Your signature has been privately archived. Awaiting Gianmaria's countersignature.",
    };
  } catch (error) {
    reportPersistenceFailure("sign relationship contract as Valentina", error);
    return {
      ok: false,
      message:
        "The signature could not be saved. Nothing has been signed; please try again.",
    };
  }
}

export async function withdrawSignature(): Promise<ContractActionResult> {
  if (!(await hasValidAccessSession())) return denied;
  try {
    const withdrawn = await withdrawValentinaSignature();
    if (!withdrawn)
      return {
        ok: false,
        message: "A signature can be withdrawn only before countersignature.",
      };
    revalidatePath("/relationship-contract");
    return {
      ok: true,
      message: "Valentina's signature was withdrawn before final execution.",
    };
  } catch (error) {
    reportPersistenceFailure("withdraw relationship signature", error);
    return {
      ok: false,
      message: "The signature could not be withdrawn. Please try again.",
    };
  }
}

export async function requestContractReward(): Promise<ContractActionResult> {
  if (!(await hasValidAccessSession())) return denied;
  try {
    const { state } = await loadContract();
    if (state.loadFailed || state.status !== "fully_executed")
      return {
        ok: false,
        message:
          "Both signatures are required before the reward can be claimed.",
      };
    await claimContractReward();
    revalidatePath("/relationship-contract");
    return {
      ok: true,
      message:
        "Your request has been saved. Contact Gianmaria to claim your reward.",
    };
  } catch (error) {
    reportPersistenceFailure("claim relationship contract reward", error);
    return {
      ok: false,
      message: "The request could not be saved. Please try again.",
    };
  }
}
