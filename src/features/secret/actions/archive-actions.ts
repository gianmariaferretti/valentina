"use server";

import { revalidatePath } from "next/cache";
import { getExperienceReward } from "@/data/rewards";
import { hasValidAccessSession } from "@/lib/auth/session";
import {
  assertSupabaseResult,
  getSupabaseServerContext,
} from "@/lib/supabase/server";
import { grantExperienceCoupon } from "@/features/rewards/repositories/supabase-experience-reward-repository";
import {
  ARCHIVE_REVEAL_MS,
  ARCHIVE_REDUCED_REVEAL_MS,
  ARCHIVE_SESSION_MS,
  canCompleteArchive,
  nextArchiveStage,
  validArchiveAuthorization,
  validArchiveDate,
  validArchiveReference,
  type ArchiveStage,
} from "../lib/archive-domain";
import {
  clearArchiveProof,
  readArchiveProof,
  writeArchiveProof,
} from "../lib/archive-session";

type ArchiveActionResult =
  | { readonly ok: true; readonly stage: ArchiveStage }
  | { readonly ok: false; readonly message: string };

const STAGE_ONE = "spicy-archive:classified-access";
const STAGE_TWO = "spicy-archive:investigation";

export interface ArchiveProgress {
  readonly classifiedAccess: boolean;
  readonly investigation: boolean;
  readonly completed: boolean;
}

export async function loadArchiveProgress(): Promise<ArchiveProgress> {
  const empty = {
    classifiedAccess: false,
    investigation: false,
    completed: false,
  };
  if (!(await hasValidAccessSession())) return empty;
  try {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client
      .from("discoveries")
      .select("discovery_id")
      .eq("user_id", userId)
      .in("discovery_id", [STAGE_ONE, STAGE_TWO, "spicy-archive-completed"]);
    assertSupabaseResult("Unable to load archive progress.", error);
    const found = new Set(data?.map((row) => row.discovery_id));
    const completed = found.has("spicy-archive-completed");
    return {
      classifiedAccess: completed || found.has(STAGE_ONE),
      investigation: completed || found.has(STAGE_TWO),
      completed,
    };
  } catch {
    return empty;
  }
}

async function recordArchiveStage(id: string): Promise<void> {
  const { client, userId } = getSupabaseServerContext();
  const { error } = await client.from("discoveries").upsert(
    {
      user_id: userId,
      discovery_id: id,
      discovery_type: "secret",
      source: "secret:spicy-archive",
    },
    { onConflict: "user_id,discovery_id", ignoreDuplicates: true },
  );
  assertSupabaseResult("Unable to save archive progress.", error);
}

export async function resumeArchive(): Promise<ArchiveActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  const progress = await loadArchiveProgress();
  const stage: ArchiveStage = progress.classifiedAccess
    ? "age-confirmation"
    : "curiosity";
  await writeArchiveProof({
    stage,
    expiresAt: Date.now() + ARCHIVE_SESSION_MS,
    ageConfirmed: false,
    imageServedAt: null,
    revealDuration: ARCHIVE_REVEAL_MS,
  });
  return { ok: true, stage };
}

export async function solveArchiveDate(input: {
  day: string;
  month: string;
  year: string;
}): Promise<ArchiveActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  const proof = await readArchiveProof();
  if (!proof || proof.stage !== "curiosity")
    return { ok: false, message: "Reopen the classified file first." };
  if (!validArchiveDate(input))
    return {
      ok: false,
      message: "The archive date does not match the Year One record.",
    };
  try {
    await recordArchiveStage(STAGE_ONE);
    await writeArchiveProof({ ...proof, stage: "age-confirmation" });
    return { ok: true, stage: "age-confirmation" };
  } catch {
    return {
      ok: false,
      message: "The clearance could not be saved. Try again.",
    };
  }
}

export async function solveArchiveInvestigation(
  fragments: readonly string[],
): Promise<ArchiveActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  const proof = await readArchiveProof();
  if (!proof || proof.stage !== "point-of-no-return" || !proof.ageConfirmed)
    return {
      ok: false,
      message: "Adult clearance is required before the investigation.",
    };
  if (!validArchiveReference(fragments))
    return {
      ok: false,
      message:
        "The file reference is incomplete. Read the three documents in order.",
    };
  try {
    await recordArchiveStage(STAGE_TWO);
    await writeArchiveProof({ ...proof, stage: "sealed-file" });
    return { ok: true, stage: "sealed-file" };
  } catch {
    return {
      ok: false,
      message: "The investigation could not be saved. Try again.",
    };
  }
}

export async function decryptArchive(
  authorizations: readonly string[],
  reducedMotion = false,
): Promise<ArchiveActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  const proof = await readArchiveProof();
  if (!proof || proof.stage !== "sealed-file" || !proof.ageConfirmed)
    return { ok: false, message: "The sealed file is not ready." };
  if (!validArchiveAuthorization(authorizations))
    return { ok: false, message: "Complete each authorization step first." };
  await writeArchiveProof({
    ...proof,
    stage: "photo-reveal",
    imageServedAt: null,
    revealDuration: reducedMotion
      ? ARCHIVE_REDUCED_REVEAL_MS
      : ARCHIVE_REVEAL_MS,
  });
  return { ok: true, stage: "photo-reveal" };
}

export async function advanceArchive(
  stage: ArchiveStage,
  ageConfirmed = false,
  reducedMotion = false,
): Promise<ArchiveActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  if (stage === "discovery") {
    await writeArchiveProof({
      stage: "curiosity",
      expiresAt: Date.now() + ARCHIVE_SESSION_MS,
      ageConfirmed: false,
      imageServedAt: null,
      revealDuration: ARCHIVE_REVEAL_MS,
    });
    return { ok: true, stage: "curiosity" };
  }
  if (
    stage === "curiosity" ||
    stage === "point-of-no-return" ||
    stage === "sealed-file"
  )
    return { ok: false, message: "Complete the evidence before proceeding." };
  const proof = await readArchiveProof();
  if (!proof || proof.stage !== stage)
    return {
      ok: false,
      message: "This file has expired. Restart the archive.",
    };
  let next = nextArchiveStage(stage, ageConfirmed === true);
  if (!next)
    return { ok: false, message: "Explicit adult confirmation is required." };
  if (
    stage === "age-confirmation" &&
    (await loadArchiveProgress()).investigation
  )
    next = "sealed-file";
  await writeArchiveProof({
    ...proof,
    stage: next,
    ageConfirmed:
      proof.ageConfirmed ||
      (stage === "age-confirmation" && ageConfirmed === true),
    revealDuration:
      reducedMotion === true ? ARCHIVE_REDUCED_REVEAL_MS : ARCHIVE_REVEAL_MS,
  });
  return { ok: true, stage: next };
}

export async function goBackInArchive(): Promise<ArchiveActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  const proof = await readArchiveProof();
  if (!proof) return { ok: false, message: "Restart the archive to continue." };
  const stage =
    proof.stage === "point-of-no-return" ? "age-confirmation" : "curiosity";
  await writeArchiveProof({
    ...proof,
    stage,
    ageConfirmed: false,
    imageServedAt: null,
  });
  return { ok: true, stage };
}

export async function completeArchive(): Promise<ArchiveActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  const proof = await readArchiveProof();
  if (
    !proof ||
    (!canCompleteArchive(proof, Date.now()) && proof.stage !== "final-reveal")
  )
    return {
      ok: false,
      message: "The private file has not finished revealing.",
    };
  try {
    const reward = getExperienceReward("spicy-archive-completed");
    if (!reward) throw new Error("Archive reward missing.");
    await grantExperienceCoupon({
      rewardId: reward.id,
      couponId: reward.targetId,
      source: "secret:spicy-archive",
    });
    await writeArchiveProof({ ...proof, stage: "final-reveal" });
    revalidatePath("/coupons");
    revalidatePath("/home");
    revalidatePath("/achievements");
    return { ok: true, stage: "final-reveal" };
  } catch {
    return {
      ok: false,
      message:
        "Your file is revealed, but the reward could not be saved. Retry saving; your wallet has not been changed.",
    };
  }
}

export async function replayArchiveReveal(
  reducedMotion = false,
): Promise<ArchiveActionResult> {
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  const proof = await readArchiveProof();
  if (
    !proof ||
    !proof.ageConfirmed ||
    !["photo-reveal", "final-reveal"].includes(proof.stage)
  )
    return { ok: false, message: "Restart the archive to continue." };
  await writeArchiveProof({
    ...proof,
    stage: "photo-reveal",
    expiresAt: Date.now() + ARCHIVE_SESSION_MS,
    imageServedAt: null,
    revealDuration:
      reducedMotion === true ? ARCHIVE_REDUCED_REVEAL_MS : ARCHIVE_REVEAL_MS,
  });
  return { ok: true, stage: "photo-reveal" };
}

export async function closeArchive(): Promise<void> {
  if (!(await hasValidAccessSession())) return;
  await clearArchiveProof();
}
