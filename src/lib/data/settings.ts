import { desc, lte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { splitModeSettings } from "@/lib/db/schema";
import type { SplitMode } from "@/lib/domain/balance";
import { monthKeyOf, monthKeyToDate, type MonthKey } from "@/lib/domain/month";

/** Dernier mode dont effectiveMonth <= month — jamais rétroactif, même logique que getIncomeAt. */
export async function getSplitModeAt(month: MonthKey): Promise<SplitMode> {
  const [row] = await db
    .select()
    .from(splitModeSettings)
    .where(lte(splitModeSettings.effectiveMonth, monthKeyToDate(month)))
    .orderBy(desc(splitModeSettings.effectiveMonth))
    .limit(1);
  return row?.splitMode ?? "equal_rav";
}

/** Prend effet dès le mois courant — même logique que setCurrentIncome. */
export async function setCurrentSplitMode(mode: SplitMode): Promise<void> {
  const currentMonth = monthKeyOf(new Date());
  await db
    .insert(splitModeSettings)
    .values({ splitMode: mode, effectiveMonth: monthKeyToDate(currentMonth) })
    .onDuplicateKeyUpdate({ set: { splitMode: mode } });
}
