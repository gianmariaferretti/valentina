"use server";

import { revalidatePath } from "next/cache";
import { getExperienceReward } from "@/data/rewards";
import { hasValidAccessSession } from "@/lib/auth/session";
import { grantExperienceCoupon } from "@/features/rewards/repositories/supabase-experience-reward-repository";
import {
  ARCHIVE_REVEAL_MS,
  ARCHIVE_REDUCED_REVEAL_MS,
  ARCHIVE_SESSION_MS,
  canCompleteArchive,
  nextArchiveStage,
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
  const proof = await readArchiveProof();
  if (!proof || proof.stage !== stage)
    return {
      ok: false,
      message: "This file has expired. Restart the archive.",
    };
  const next = nextArchiveStage(stage, ageConfirmed === true);
  if (!next)
    return { ok: false, message: "Explicit adult confirmation is required." };
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
