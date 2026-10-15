export type ContractStatus =
  "awaiting_valentina" | "awaiting_countersignature" | "fully_executed";

export type SignerRole = "colombian" | "italian";

export interface ContractSignature {
  role: SignerRole;
  name: string;
  image: string;
  signedAt: string;
}

export interface ContractState {
  status: ContractStatus;
  version: string;
  hash: string;
  signatures: ContractSignature[];
  rewardRequestedAt: string | null;
  loadFailed: boolean;
}

export interface ContractActionResult {
  ok: boolean;
  message: string;
}
