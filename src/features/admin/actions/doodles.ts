"use server";

import { revalidatePath } from "next/cache";

import { isDoodleId } from "@/features/doodles/lib/doodles";
import {
  deleteDoodle,
  DoodlesNotReady,
  setDoodleFavorite,
} from "@/features/doodles/repositories/doodles";

import { done, failed, withAdmin, type AdminResult } from "./guard";

function refresh() {
  revalidatePath("/doodles");
  revalidatePath("/admin/disegni");
}

const notReady = () =>
  failed("I disegni non sono ancora attivi: applica la migration.");

export async function toggleDoodleFavorite(
  id: string,
  favorite: boolean,
): Promise<AdminResult> {
  return withAdmin("doodle favorite", async () => {
    if (!isDoodleId(id)) return failed("Disegno non trovato.");
    try {
      await setDoodleFavorite(id, favorite);
    } catch (error) {
      if (error instanceof DoodlesNotReady) return notReady();
      throw error;
    }
    refresh();
    return done(favorite ? "Tra i preferiti ⭐" : "Tolto dai preferiti");
  });
}

export async function removeDoodle(id: string): Promise<AdminResult> {
  return withAdmin("delete doodle", async () => {
    if (!isDoodleId(id)) return failed("Disegno non trovato.");
    try {
      await deleteDoodle(id);
    } catch (error) {
      if (error instanceof DoodlesNotReady) return notReady();
      throw error;
    }
    refresh();
    return done("Disegno eliminato");
  });
}
