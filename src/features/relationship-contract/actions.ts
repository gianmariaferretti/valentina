"use server";

import { setTimeout as delay } from "node:timers/promises";

import { revalidatePath } from "next/cache";

import { hasValidAccessSession } from "@/lib/auth/session";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";

import {
  clearContractAdminSession,
  getContractAdminConfigurationIssue,
  hasContractAdminSession,
  tryContractAdminLogin,
} from "./lib/admin-session";
import {
  claimContractReward,
  loadContract,
  saveSignature,
  withdrawValentinaSignature,
} from "./lib/repository";
import type { ContractActionResult } from "./types";

function validSignatureImage(value: string): boolean {
  if (!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(value))
    return false;
  const bytes = Buffer.from(
    value.slice("data:image/png;base64,".length),
    "base64",
  );
  return (
    bytes.length >= 500 &&
    bytes.length <= 250_000 &&
    bytes
      .subarray(0, 8)
      .equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])) &&
    bytes.readUInt32BE(16) >= 300 &&
    bytes.readUInt32BE(16) <= 1400 &&
    bytes.readUInt32BE(20) >= 120 &&
    bytes.readUInt32BE(20) <= 600
  );
}

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

export async function signAsGianmaria(
  image: string,
  reviewed: boolean,
): Promise<ContractActionResult> {
  if (!(await hasValidAccessSession()) || !(await hasContractAdminSession()))
    return {
      ok: false,
      message: "Gianmaria's separate authorisation is required.",
    };
  if (!reviewed || !validSignatureImage(image))
    return {
      ok: false,
      message:
        "Review the Agreement and draw your signature before confirming.",
    };
  try {
    await saveSignature("italian", image);
    revalidatePath("/relationship-contract");
    return {
      ok: true,
      message:
        "Both signatures are archived. The Agreement is signed and sealed.",
    };
  } catch (error) {
    reportPersistenceFailure("countersign relationship contract", error);
    return {
      ok: false,
      message: "The countersignature could not be saved. Please try again.",
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

export async function authoriseGianmaria(
  passphrase: string,
): Promise<ContractActionResult> {
  if (!(await hasValidAccessSession())) return denied;
  const configurationIssue = getContractAdminConfigurationIssue();
  if (configurationIssue) {
    return {
      ok: false,
      message:
        configurationIssue === "missing_or_short_passphrase" ||
        configurationIssue === "reused_site_code"
          ? "The separate administrator passphrase is not configured correctly. Gianmaria must set a unique secret of at least 24 characters in Vercel Production and redeploy."
          : "The private signing service is not configured. Gianmaria must check the server access secret and redeploy.",
    };
  }
  try {
    const valid = await tryContractAdminLogin(passphrase);
    if (valid) {
      revalidatePath("/relationship-contract");
      return {
        ok: true,
        message: "Gianmaria's signing desk is open for one hour.",
      };
    }
  } catch (error) {
    reportPersistenceFailure("authorise contract administrator", error);
  }
  await delay(600);
  return {
    ok: false,
    message:
      "Authorisation unavailable or denied. Please wait before trying again.",
  };
}

export async function endGianmariaSession(): Promise<void> {
  await clearContractAdminSession();
  revalidatePath("/relationship-contract");
}
