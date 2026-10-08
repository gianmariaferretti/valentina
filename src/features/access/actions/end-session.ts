"use server";

import { redirect } from "next/navigation";

import { clearAccessSession } from "@/lib/auth/session";

export async function endAccessSession(): Promise<never> {
  await clearAccessSession();
  redirect("/access");
}
