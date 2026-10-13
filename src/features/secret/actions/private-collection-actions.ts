"use server";

import { hasValidAccessSession } from "@/lib/auth/session";
import { readArchiveProof } from "../lib/archive-session";
import {
  canAccessPrivateCollection,
  collectionReceipt,
  isCollectionIntent,
  type CollectionActionResult,
  type CollectionIntent,
} from "../lib/private-collection-domain";

/**
 * Acknowledges an on-site intention, not a transaction or delivery request.
 * Accepts no contact/card/media data. Never writes progress, sends email or charges.
 */
export async function accessPrivateCollection(
  intent: CollectionIntent,
): Promise<CollectionActionResult> {
  if (!isCollectionIntent(intent))
    return { ok: false, message: "This request could not be confirmed." };
  if (!(await hasValidAccessSession()))
    return { ok: false, message: "Please unlock the website again." };
  if (!canAccessPrivateCollection(await readArchiveProof(), Date.now()))
    return {
      ok: false,
      message: "Reopen the archive and reveal the private file to continue.",
    };
  return { ok: true, view: collectionReceipt(intent) };
}
