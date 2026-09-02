import { and, desc, eq, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { incomes } from "@/lib/db/schema";
import { monthKeyOf, monthKeyToDate, type MonthKey } from "@/lib/domain/month";

/** Dernier revenu dont effectiveMonth <= month — jamais rétroactif (voir db/schema.sql). */
export async function getIncomeAt(userId: string, month: MonthKey): Promise<number | null> {
  const [row] = await db
    .select()
    .from(incomes)
    .where(and(eq(incomes.userId, userId), lte(incomes.effectiveMonth, monthKeyToDate(month))))
    .orderBy(desc(incomes.effectiveMonth))
    .limit(1);

  return row ? row.amountCents : null;
}

/** Mois le plus ancien pour lequel un revenu existe, pour n'importe quel utilisateur. */
export async function getEarliestIncomeMonth(): Promise<MonthKey | null> {
  const rows = await db.select({ effectiveMonth: incomes.effectiveMonth }).from(incomes);
  if (rows.length === 0) return null;
  return rows.map((r) => monthKeyOf(r.effectiveMonth)).sort().at(0) ?? null;
}

/**
 * Prend effet dès le mois courant (upsert sur le mois courant, jamais sur un mois passé —
 * voir CLAUDE.md). Les mois déjà écoulés gardent le montant qui était valable à l'époque,
 * chacun ayant sa propre ligne effectiveMonth indépendante.
 */
export async function setCurrentIncome(userId: string, amountCents: number): Promise<void> {
  const currentMonth = monthKeyOf(new Date());
  await db
    .insert(incomes)
    .values({ userId, amountCents, effectiveMonth: monthKeyToDate(currentMonth) })
    .onDuplicateKeyUpdate({ set: { amountCents } });
}
