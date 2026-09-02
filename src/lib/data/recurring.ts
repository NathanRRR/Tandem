import { randomUUID } from "crypto";
import { and, eq, gte, isNotNull, lt } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { expenses, recurringTemplates } from "@/lib/db/schema";
import { draftOccurrencesForMonth } from "@/lib/domain/recurring";
import { addMonths, monthKeyToDate, type MonthKey } from "@/lib/domain/month";
import { unsettleFromMonth } from "./settlement";

export type RecurringTemplateRow = typeof recurringTemplates.$inferSelect;

export interface NewRecurringTemplateInput {
  label: string;
  categoryId: string;
  amountCents: number;
  defaultPayerId: string;
}

export async function insertRecurringTemplate(
  input: NewRecurringTemplateInput,
): Promise<RecurringTemplateRow> {
  // drizzle-orm/mysql2 n'a pas de RETURNING : id/createdAt générés ici plutôt qu'en base.
  const row: RecurringTemplateRow = {
    id: randomUUID(),
    label: input.label,
    categoryId: input.categoryId,
    amountCents: input.amountCents,
    defaultPayerId: input.defaultPayerId,
    active: true,
    createdAt: new Date(),
  };
  await db.insert(recurringTemplates).values(row);
  return row;
}

/**
 * Génère les occurrences manquantes du mois pour tous les modèles récurrents actifs.
 * Appelée paresseusement à l'ouverture du dashboard — pas besoin de cron (voir CLAUDE.md).
 */
export async function ensureRecurringOccurrences(month: MonthKey): Promise<void> {
  const start = monthKeyToDate(month);
  const end = monthKeyToDate(addMonths(month, 1));

  const activeTemplates = await db
    .select()
    .from(recurringTemplates)
    .where(eq(recurringTemplates.active, true));

  const existing = await db
    .select({ templateId: expenses.templateId })
    .from(expenses)
    .where(and(gte(expenses.date, start), lt(expenses.date, end), isNotNull(expenses.templateId)));

  const already = new Set(existing.map((e) => e.templateId as string));

  const drafts = draftOccurrencesForMonth(activeTemplates, already, start);

  if (drafts.length > 0) {
    await db.insert(expenses).values(
      drafts.map((d) => ({
        templateId: d.templateId,
        label: d.label,
        categoryId: d.categoryId,
        amountCents: d.amountCents,
        payerId: d.payerId,
        date: d.date,
      })),
    );
    await unsettleFromMonth(month);
  }
}
