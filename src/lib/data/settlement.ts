import { and, eq, gte } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { monthlySettlements } from "@/lib/db/schema";
import { monthKeyOf, monthKeyToDate, type MonthKey } from "@/lib/domain/month";

export async function getSettledMonths(): Promise<MonthKey[]> {
  const rows = await db
    .select()
    .from(monthlySettlements)
    .where(eq(monthlySettlements.settled, true));

  return rows.map((r) => monthKeyOf(r.month));
}

export async function markMonthSettled(month: MonthKey): Promise<void> {
  const monthDate = monthKeyToDate(month);
  await db
    .insert(monthlySettlements)
    .values({ month: monthDate, settled: true, settledAt: new Date() })
    .onDuplicateKeyUpdate({ set: { settled: true, settledAt: new Date() } });
}

/**
 * À appeler chaque fois qu'une dépense est ajoutée à un mois : si ce mois (ou un mois plus
 * récent) était marqué réglé, son solde cumulé dépendait de données maintenant obsolètes —
 * on le remet "à régler" en cascade plutôt que de laisser le cumul divergent silencieusement
 * (voir CLAUDE.md, bug du 2026-09-02).
 */
export async function unsettleFromMonth(month: MonthKey): Promise<void> {
  const monthDate = monthKeyToDate(month);
  await db
    .update(monthlySettlements)
    .set({ settled: false, settledAt: null })
    .where(and(gte(monthlySettlements.month, monthDate), eq(monthlySettlements.settled, true)));
}
