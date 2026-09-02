"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { setCurrentSplitMode } from "@/lib/data/settings";

export async function updateSplitMode(formData: FormData) {
  const session = await getSession();
  if (!session.userId) throw new Error("Non authentifié");

  const mode = String(formData.get("splitMode") ?? "");
  if (mode !== "equal_rav" && mode !== "proportional_income") {
    throw new Error("Mode de répartition invalide");
  }

  await setCurrentSplitMode(mode);
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/history");
}
