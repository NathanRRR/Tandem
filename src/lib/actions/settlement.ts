"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { markMonthSettled } from "@/lib/data/settlement";
import type { MonthKey } from "@/lib/domain/month";

export async function markSettled(month: MonthKey) {
  const session = await getSession();
  if (!session.userId) throw new Error("Non authentifié");

  await markMonthSettled(month);
  revalidatePath("/");
  revalidatePath("/history");
}
