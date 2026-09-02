"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { setCurrentIncome } from "@/lib/data/income";
import { parseEurosToCents } from "@/lib/domain/money";

export async function updateIncome(formData: FormData) {
  const session = await getSession();
  if (!session.userId) throw new Error("Non authentifié");

  const amountCents = parseEurosToCents(String(formData.get("amount") ?? "0"));
  if (amountCents <= 0) throw new Error("Montant invalide");

  await setCurrentIncome(session.userId, amountCents);
  revalidatePath("/profile");
  revalidatePath("/");
}
