import "server-only";

import { agreementNumber, treatyVersion } from "@/data/relationship-contract";
import { reportPersistenceFailure } from "@/lib/persistence/persistence-error";
import type { Json } from "@/lib/supabase/database.types";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";

import {
  contractHash,
  currentContractDocument,
  parseArchivedDocument,
  type ContractDocument,
} from "./document";
import type { ContractSignature, ContractState, SignerRole } from "../types";

export interface LoadedContract {
  document: ContractDocument;
  state: ContractState;
}

function emptyContract(loadFailed = false): LoadedContract {
  const document = currentContractDocument();
  return {
    document,
    state: {
      status: "awaiting_valentina",
      version: treatyVersion,
      hash: contractHash(document),
      signatures: [],
      rewardRequestedAt: null,
      loadFailed,
    },
  };
}

export async function loadContract(): Promise<LoadedContract> {
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data: contract, error } = await client
      .from("relationship_contracts")
      .select(
        "id,version,content_hash,content_snapshot,status,reward_requested_at",
      )
      .eq("user_id", userId)
      .eq("agreement_number", agreementNumber)
      .eq("version", treatyVersion)
      .maybeSingle();
    assertSupabaseResult("Unable to load contract.", error);
    if (!contract) return emptyContract();
    const document = parseArchivedDocument(contract.content_snapshot);
    if (!document || contractHash(document) !== contract.content_hash) {
      throw new Error("Archived contract content failed its integrity check.");
    }
    const { data: signatures, error: signatureError } = await client
      .from("relationship_contract_signatures")
      .select("signer_role,signer_name,signature_png,signed_at")
      .eq("contract_id", contract.id)
      .order("signed_at", { ascending: true });
    assertSupabaseResult("Unable to load contract signatures.", signatureError);
    return {
      document,
      state: {
        status: contract.status as ContractState["status"],
        version: contract.version,
        hash: contract.content_hash,
        signatures: (signatures ?? []).map((signature): ContractSignature => ({
          role: signature.signer_role as SignerRole,
          name: signature.signer_name,
          image: signature.signature_png,
          signedAt: signature.signed_at,
        })),
        rewardRequestedAt: contract.reward_requested_at,
        loadFailed: false,
      },
    };
  } catch (error) {
    reportPersistenceFailure("load relationship contract", error);
    return emptyContract(true);
  }
}

export async function saveSignature(
  role: SignerRole,
  image: string,
): Promise<void> {
  const document = currentContractDocument();
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client.rpc("sign_relationship_contract", {
    p_user_id: userId,
    p_agreement_number: agreementNumber,
    p_version: treatyVersion,
    p_content_hash: contractHash(document),
    p_content_snapshot: document as unknown as Json,
    p_signer_role: role,
    p_signer_name: role === "colombian" ? "Valentina" : "Gianmaria Ferretti",
    p_signature_png: image,
  });
  assertSupabaseResult("Unable to save signature.", error);
  if (!data?.[0]) throw new Error("The signature was not saved.");
}

export async function withdrawValentinaSignature(): Promise<boolean> {
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client.rpc("withdraw_relationship_signature", {
    p_user_id: userId,
    p_agreement_number: agreementNumber,
    p_version: treatyVersion,
  });
  assertSupabaseResult("Unable to withdraw signature.", error);
  return data === true;
}

export async function claimContractReward(): Promise<string> {
  const { client, userId } = getSupabaseServerContext();
  const { data, error } = await client.rpc("claim_relationship_reward", {
    p_user_id: userId,
    p_agreement_number: agreementNumber,
    p_version: treatyVersion,
  });
  assertSupabaseResult("Unable to save reward request.", error);
  if (!data) throw new Error("Reward request was not saved.");
  return data;
}
