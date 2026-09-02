import { computeMonthlyBalance, cumulativeBalance, type MonthDelta, type MonthlyBalance } from "@/lib/domain/balance";
import { addMonths, monthKeyOf, startOfMonthUTC, type MonthKey } from "@/lib/domain/month";
import { getDistinctExpenseMonths, getExpensesForMonth, type Expense } from "./expenses";
import { getEarliestIncomeMonth, getIncomeAt } from "./income";
import { ensureRecurringOccurrences } from "./recurring";
import { getSplitModeAt } from "./settings";
import { getSettledMonths } from "./settlement";
import { getCurrentAndPartner, type User } from "./users";

export interface MonthOverview {
  currentUser: User;
  partner: User;
  month: MonthKey;
  balance: MonthlyBalance;
  cumulativeDeltaCents: number;
  isSettled: boolean;
  expenses: Expense[];
}

export function currentMonthKey(): MonthKey {
  return monthKeyOf(startOfMonthUTC(new Date()));
}

export async function getMonthOverview(
  currentUserId: string,
  month: MonthKey = currentMonthKey(),
): Promise<MonthOverview> {
  const { currentUser, partner } = await getCurrentAndPartner(currentUserId);

  // Génération paresseuse : seulement pour le mois courant, jamais pour un mois passé consulté
  // depuis l'historique (qui doit rester figé, surtout une fois réglé).
  if (month === currentMonthKey()) {
    await ensureRecurringOccurrences(month);
  }

  const [incomeCurrent, incomePartner, monthExpenses, settledMonths, splitMode] = await Promise.all([
    getIncomeAt(currentUser.id, month),
    getIncomeAt(partner.id, month),
    getExpensesForMonth(month),
    getSettledMonths(),
    getSplitModeAt(month),
  ]);

  if (incomeCurrent === null || incomePartner === null) {
    throw new Error(
      "Revenu manquant pour ce mois — renseignez-le dans le profil avant de continuer.",
    );
  }

  const balance = computeMonthlyBalance({
    userAId: currentUser.id,
    userBId: partner.id,
    incomeACents: incomeCurrent,
    incomeBCents: incomePartner,
    expenses: monthExpenses.map((e) => ({ amountCents: e.amountCents, payerId: e.payerId })),
    splitMode,
  });

  const cumulativeDeltaCents = await computeCumulativeDelta(
    currentUser.id,
    partner.id,
    month,
    settledMonths,
  );

  return {
    currentUser,
    partner,
    month,
    balance,
    cumulativeDeltaCents,
    isSettled: settledMonths.includes(month),
    expenses: monthExpenses,
  };
}

/** Mois passés (hors mois courant) ayant au moins une dépense ou un règlement, du plus récent au plus ancien. */
export async function listPastMonths(currentUserId: string): Promise<MonthOverview[]> {
  const current = currentMonthKey();
  const [expenseMonths, settledMonths] = await Promise.all([
    getDistinctExpenseMonths(),
    getSettledMonths(),
  ]);

  const months = Array.from(new Set([...expenseMonths, ...settledMonths]))
    .filter((m) => m < current)
    .sort()
    .reverse();

  const overviews: MonthOverview[] = [];
  for (const month of months) {
    overviews.push(await getMonthOverview(currentUserId, month));
  }
  return overviews;
}

async function computeCumulativeDelta(
  userAId: string,
  userBId: string,
  uptoMonth: MonthKey,
  settledMonths: MonthKey[],
): Promise<number> {
  const lastSettled = settledMonths.filter((m) => m <= uptoMonth).sort().at(-1);
  const earliest = await getEarliestIncomeMonth();
  const startMonth = lastSettled ? addMonths(lastSettled, 1) : earliest;

  if (!startMonth || startMonth > uptoMonth) return 0;

  const deltas: MonthDelta[] = [];
  let cursor = startMonth;
  while (cursor <= uptoMonth) {
    const [incomeA, incomeB] = await Promise.all([
      getIncomeAt(userAId, cursor),
      getIncomeAt(userBId, cursor),
    ]);

    if (incomeA !== null && incomeB !== null) {
      const [monthExpenses, monthSplitMode] = await Promise.all([
        getExpensesForMonth(cursor),
        getSplitModeAt(cursor),
      ]);
      const monthBalance = computeMonthlyBalance({
        userAId,
        userBId,
        incomeACents: incomeA,
        incomeBCents: incomeB,
        expenses: monthExpenses.map((e) => ({ amountCents: e.amountCents, payerId: e.payerId })),
        splitMode: monthSplitMode,
      });
      deltas.push({ month: cursor, deltaCents: monthBalance.deltaCents });
    }

    cursor = addMonths(cursor, 1);
  }

  return cumulativeBalance(deltas, settledMonths, uptoMonth);
}
