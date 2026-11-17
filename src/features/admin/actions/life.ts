"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { creditSiteKisses } from "@/features/kisses/repositories/kisses";
import { romeLocalToIso } from "@/features/life/lib/rome-time";
import {
  citiesSchema,
  listItemInputSchema,
  lists,
  nextTimeSchema,
  rewardSchema,
  songSchema,
} from "@/features/life/lib/schemas";
import { getSupabaseServerContext } from "@/lib/supabase/server";

import { upsertOverride } from "../repositories/content";
import { done, failed, withAdmin, type AdminResult } from "./guard";

const idSchema = z.string().uuid();

function refresh() {
  revalidatePath("/", "layout");
}

function first(error: z.ZodError) {
  return error.issues[0]?.message ?? "Controlla i campi.";
}

export async function saveNextTime(form: FormData): Promise<AdminResult> {
  return withAdmin("next time", async () => {
    const local = String(form.get("at") ?? "");
    const at = local ? romeLocalToIso(local) : null;
    if (local && !at) return failed("Data e ora non valide.");
    const parsed = nextTimeSchema.safeParse({
      at,
      from: String(form.get("from") ?? ""),
      to: String(form.get("to") ?? ""),
      status: String(form.get("status") ?? "on-time"),
    });
    if (!parsed.success) return failed(first(parsed.error));
    await upsertOverride("setting", "next-time", parsed.data);
    return done("Prossimo incontro salvato ✈️");
  });
}

export async function saveCities(json: string): Promise<AdminResult> {
  return withAdmin("cities", async () => {
    let value: unknown;
    try {
      value = JSON.parse(json);
    } catch {
      return failed("Elenco non valido.");
    }
    const parsed = citiesSchema.safeParse({ cities: value });
    if (!parsed.success) return failed(first(parsed.error));
    await upsertOverride("setting", "cities", parsed.data);
    return done("Città salvate 🕰️");
  });
}

function rewardFrom(form: FormData) {
  const type = String(form.get("rewardType") ?? "none");
  if (type === "kisses")
    return rewardSchema.safeParse({ kisses: Number(form.get("kisses")) });
  if (type === "coupon")
    return rewardSchema.safeParse({
      couponId: String(form.get("couponId") ?? ""),
    });
  return { success: true as const, data: null };
}

export async function createListItem(
  list: string,
  form: FormData,
): Promise<AdminResult> {
  return withAdmin("create list item", async () => {
    const parsedList = z.enum(lists).parse(list);
    const input = listItemInputSchema.safeParse({
      title: form.get("title") ?? "",
      notes: form.get("notes") ?? undefined,
      category: form.get("category") ?? undefined,
    });
    if (!input.success) return failed(first(input.error));
    const reward = rewardFrom(form);
    if (!reward.success) return failed("Premio non valido.");
    const { client } = getSupabaseServerContext();
    const { count } = await client
      .from("life_lists")
      .select("id", { count: "exact", head: true })
      .eq("list", parsedList);
    const { error } = await client.from("life_lists").insert({
      list: parsedList,
      ...input.data,
      reward: reward.data,
      sort: count ?? 0,
    });
    if (error) throw error;
    refresh();
    return done("Aggiunto ✅");
  });
}

export async function updateListItem(
  id: string,
  form: FormData,
): Promise<AdminResult> {
  return withAdmin("update list item", async () => {
    const input = listItemInputSchema.safeParse({
      title: form.get("title") ?? "",
      notes: form.get("notes") ?? undefined,
      category: form.get("category") ?? undefined,
    });
    if (!input.success) return failed(first(input.error));
    const reward = rewardFrom(form);
    if (!reward.success) return failed("Premio non valido.");
    const { client } = getSupabaseServerContext();
    const { error } = await client
      .from("life_lists")
      .update({ ...input.data, reward: reward.data })
      .eq("id", idSchema.parse(id));
    if (error) throw error;
    refresh();
    return done("Salvato ✅");
  });
}

export async function approveListItem(id: string): Promise<AdminResult> {
  return withAdmin("approve list item", async () => {
    const { client } = getSupabaseServerContext();
    const { error } = await client
      .from("life_lists")
      .update({ status: "active" })
      .eq("id", idSchema.parse(id));
    if (error) throw error;
    refresh();
    return done("Approvata 👍 Ora la vede nella lista.");
  });
}

export async function deleteListItem(id: string): Promise<AdminResult> {
  return withAdmin("delete list item", async () => {
    const { client } = getSupabaseServerContext();
    const { error } = await client
      .from("life_lists")
      .delete()
      .eq("id", idSchema.parse(id));
    if (error) throw error;
    refresh();
    return done("Eliminato");
  });
}

export async function tickListItem(
  id: string,
  doneFlag: boolean,
): Promise<AdminResult> {
  return withAdmin("tick list item", async () => {
    const { client, userId } = getSupabaseServerContext();
    const { data, error } = await client.rpc("complete_life_item", {
      p_user_id: userId,
      p_id: idSchema.parse(id),
      p_done: doneFlag,
      p_by: "gianmaria",
    });
    if (error) throw error;
    const row = data?.[0];
    if (row?.newly_rewarded) {
      const reward = rewardSchema.safeParse(row.reward);
      if (reward.success && "kisses" in reward.data)
        await creditSiteKisses({
          key: `bucket:${idSchema.parse(id)}`,
          amount: reward.data.kisses,
          label: "Bucket list: ticked by Gianmaria",
        });
    }
    refresh();
    return done(doneFlag ? "Spuntato ✓" : "Spunta tolta");
  });
}

async function reorder(rows: { id: string }[], id: string, direction: number) {
  const index = rows.findIndex((row) => row.id === id);
  const other = index + direction;
  if (index < 0 || other < 0 || other >= rows.length) return null;
  [rows[index], rows[other]] = [rows[other], rows[index]];
  return rows;
}

async function moveItem(id: string, list: string, direction: number) {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("life_lists")
    .select("id")
    .eq("list", list)
    .order("sort")
    .order("created_at");
  if (error) throw error;
  const rows = await reorder(data ?? [], id, direction);
  if (!rows) return;
  await Promise.all(
    rows.map((row, position) =>
      client.from("life_lists").update({ sort: position }).eq("id", row.id),
    ),
  );
}

async function moveSongRow(id: string, direction: number) {
  const { client } = getSupabaseServerContext();
  const { data, error } = await client
    .from("songs")
    .select("id")
    .order("sort")
    .order("created_at");
  if (error) throw error;
  const rows = await reorder(data ?? [], id, direction);
  if (!rows) return;
  await Promise.all(
    rows.map((row, position) =>
      client.from("songs").update({ sort: position }).eq("id", row.id),
    ),
  );
}

export async function moveListItem(
  id: string,
  list: string,
  direction: number,
): Promise<AdminResult> {
  return withAdmin("move list item", async () => {
    await moveItem(
      idSchema.parse(id),
      z.enum(lists).parse(list),
      direction > 0 ? 1 : -1,
    );
    refresh();
    return done(direction > 0 ? "Spostato giù" : "Spostato su");
  });
}

function songFrom(form: FormData) {
  return songSchema.safeParse({
    title: form.get("title") ?? "",
    artist: form.get("artist") ?? "",
    spotifyUrl: form.get("spotifyUrl") ?? "",
    date: form.get("date") ?? "",
    place: form.get("place") ?? "",
    why: form.get("why") ?? "",
  });
}

export async function createSong(form: FormData): Promise<AdminResult> {
  return withAdmin("create song", async () => {
    const parsed = songFrom(form);
    if (!parsed.success) return failed(first(parsed.error));
    const { client } = getSupabaseServerContext();
    const { count } = await client
      .from("songs")
      .select("id", { count: "exact", head: true });
    const { title, artist, spotifyUrl, date, place, why } = parsed.data;
    const { error } = await client.from("songs").insert({
      title,
      artist,
      spotify_url: spotifyUrl,
      song_date: date,
      place,
      why,
      sort: count ?? 0,
    });
    if (error) throw error;
    refresh();
    return done("Canzone aggiunta 🎵");
  });
}

export async function updateSong(
  id: string,
  form: FormData,
): Promise<AdminResult> {
  return withAdmin("update song", async () => {
    const parsed = songFrom(form);
    if (!parsed.success) return failed(first(parsed.error));
    const { title, artist, spotifyUrl, date, place, why } = parsed.data;
    const { client } = getSupabaseServerContext();
    const { error } = await client
      .from("songs")
      .update({
        title,
        artist,
        spotify_url: spotifyUrl,
        song_date: date,
        place,
        why,
      })
      .eq("id", idSchema.parse(id));
    if (error) throw error;
    refresh();
    return done("Canzone salvata 🎵");
  });
}

export async function deleteSong(id: string): Promise<AdminResult> {
  return withAdmin("delete song", async () => {
    const { client } = getSupabaseServerContext();
    const { error } = await client
      .from("songs")
      .delete()
      .eq("id", idSchema.parse(id));
    if (error) throw error;
    refresh();
    return done("Canzone eliminata");
  });
}

export async function moveSong(
  id: string,
  direction: number,
): Promise<AdminResult> {
  return withAdmin("move song", async () => {
    await moveSongRow(idSchema.parse(id), direction > 0 ? 1 : -1);
    refresh();
    return done(direction > 0 ? "Spostata giù" : "Spostata su");
  });
}
