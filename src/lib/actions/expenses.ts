"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth/session";
import { currentMonthKey } from "@/lib/data/balance";
import { getCategoryLabel } from "@/lib/data/categories";
import {
  deleteExpense as deleteExpenseRecord,
  insertExpense,
  updateExpense as updateExpenseRecord,
} from "@/lib/data/expenses";
import { insertRecurringTemplate } from "@/lib/data/recurring";
import { parseEurosToCents } from "@/lib/domain/money";
import { monthKeyOf, type MonthKey } from "@/lib/domain/month";

export async function addExpense(formData: FormData) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const categoryId = String(formData.get("categoryId") ?? "");
  const amountCents = parseEurosToCents(String(formData.get("amount") ?? "0"));
  const payerId = String(formData.get("payerId") ?? "");
  const dateInput = String(formData.get("date") ?? "");
  const isRecurring = formData.get("isRecurring") === "on";
  const rawLabel = String(formData.get("label") ?? "").trim();

  if (!categoryId || !payerId || !dateInput || amountCents <= 0) {
    throw new Error("Champs manquants ou invalides");
  }

  const label = rawLabel || (await getCategoryLabel(categoryId));
  const date = new Date(dateInput);

  if (isRecurring) {
    const template = await insertRecurringTemplate({
      label,
      categoryId,
      amountCents,
      defaultPayerId: payerId,
    });
    await insertExpense({ label, categoryId, amountCents, payerId, date, templateId: template.id });
  } else {
    await insertExpense({ label, categoryId, amountCents, payerId, date });
  }

  revalidatePath("/");
  redirect("/");
}

export async function updateExpense(id: string, formData: FormData) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  const categoryId = String(formData.get("categoryId") ?? "");
  const amountCents = parseEurosToCents(String(formData.get("amount") ?? "0"));
  const payerId = String(formData.get("payerId") ?? "");
  const dateInput = String(formData.get("date") ?? "");
  const rawLabel = String(formData.get("label") ?? "").trim();

  if (!categoryId || !payerId || !dateInput || amountCents <= 0) {
    throw new Error("Champs manquants ou invalides");
  }

  const label = rawLabel || (await getCategoryLabel(categoryId));
  const date = new Date(dateInput);

  await updateExpenseRecord(id, { label, categoryId, amountCents, payerId, date });

  const month = monthKeyOf(date);
  revalidatePath("/");
  revalidatePath(`/history/${month}`);
  redirect(month === currentMonthKey() ? "/" : `/history/${month}`);
}

export async function deleteExpense(id: string, redirectMonth: MonthKey) {
  const session = await getSession();
  if (!session.userId) redirect("/login");

  await deleteExpenseRecord(id);

  revalidatePath("/");
  revalidatePath(`/history/${redirectMonth}`);
  redirect(redirectMonth === currentMonthKey() ? "/" : `/history/${redirectMonth}`);
}
