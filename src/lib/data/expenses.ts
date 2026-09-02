import { randomUUID } from "crypto";
import { and, desc, gte, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { expenses } from "@/lib/db/schema";
import { addMonths, monthKeyOf, monthKeyToDate, type MonthKey } from "@/lib/domain/month";
import { unsettleFromMonth } from "./settlement";

export type Expense = typeof expenses.$inferSelect;

export async function getExpensesForMonth(month: MonthKey): Promise<Expense[]> {
  const start = monthKeyToDate(month);
  const end = monthKeyToDate(addMonths(month, 1));

  return db
    .select()
    .from(expenses)
    .where(and(gte(expenses.date, start), lt(expenses.date, end)))
    .orderBy(desc(expenses.date));
}

export interface NewExpenseInput {
  label: string;
  categoryId: string;
  amountCents: number;
  payerId: string;
  date: Date;
  templateId?: string;
}

export async function insertExpense(input: NewExpenseInput): Promise<Expense> {
  // drizzle-orm/mysql2 n'a pas de RETURNING : id/createdAt générés ici plutôt qu'en base.
  const row: Expense = {
    id: randomUUID(),
    templateId: input.templateId ?? null,
    label: input.label,
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    payerId: input.payerId,
    date: input.date,
    createdAt: new Date(),
  };
  await db.insert(expenses).values(row);
  await unsettleFromMonth(monthKeyOf(row.date));
  return row;
}

export async function getDistinctExpenseMonths(): Promise<MonthKey[]> {
  const rows = await db.selectDistinct({ date: expenses.date }).from(expenses);
  return Array.from(new Set(rows.map((r) => monthKeyOf(r.date))));
}
