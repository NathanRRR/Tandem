"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/session";
import { updateUserName, updateUserPassword, verifyUserPassword } from "@/lib/data/users";

export async function updateName(formData: FormData) {
  const session = await getSession();
  if (!session.userId) throw new Error("Non authentifié");

  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("Le prénom ne peut pas être vide");

  await updateUserName(session.userId, name);
  revalidatePath("/profile");
  revalidatePath("/");
  revalidatePath("/history");
}

export async function updatePassword(formData: FormData) {
  const session = await getSession();
  if (!session.userId) throw new Error("Non authentifié");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!newPassword || newPassword !== confirmPassword) {
    redirect("/profile?passwordError=1");
  }

  const isCurrentValid = await verifyUserPassword(session.userId, currentPassword);
  if (!isCurrentValid) {
    redirect("/profile?passwordError=1");
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await updateUserPassword(session.userId, passwordHash);
  redirect("/profile?passwordUpdated=1");
}
