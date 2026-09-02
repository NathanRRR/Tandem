import type { MonthKey } from "./month";

/**
 * equal_rav : égalise le reste-à-vivre (formule par défaut, voir db/schema.sql).
 * proportional_income : chacun paie sa part au prorata de son revenu (share_A = S * R_A / (R_A+R_B)),
 * sans viser un reste-à-vivre identique.
 */
export type SplitMode = "equal_rav" | "proportional_income";

export interface MonthlyBalanceInput {
  userAId: string;
  userBId: string;
  incomeACents: number;
  incomeBCents: number;
  expenses: { amountCents: number; payerId: string }[];
  splitMode?: SplitMode;
}

export interface MonthlyBalance {
  totalExpensesCents: number;
  shareACents: number;
  shareBCents: number;
  paidACents: number;
  paidBCents: number;
  restACents: number;
  restBCents: number;
  /** paidA - shareA : positif => B doit ce montant à A pour ce mois, négatif => A doit à B. */
  deltaCents: number;
}

export function computeMonthlyBalance(input: MonthlyBalanceInput): MonthlyBalance {
  const totalExpensesCents = input.expenses.reduce((sum, e) => sum + e.amountCents, 0);
  const splitMode = input.splitMode ?? "equal_rav";

  // Division entière dans les deux modes : garantit shareA + shareB === totalExpensesCents
  // à chaque fois, sans dérive flottante (voir db/schema.sql pour le détail des deux formules).
  const shareACents =
    splitMode === "proportional_income"
      ? computeProportionalShareACents(totalExpensesCents, input.incomeACents, input.incomeBCents)
      : Math.floor((totalExpensesCents + input.incomeACents - input.incomeBCents) / 2);
  const shareBCents = totalExpensesCents - shareACents;

  const paidACents = sumPaidBy(input.expenses, input.userAId);
  const paidBCents = sumPaidBy(input.expenses, input.userBId);

  return {
    totalExpensesCents,
    shareACents,
    shareBCents,
    paidACents,
    paidBCents,
    restACents: input.incomeACents - shareACents,
    restBCents: input.incomeBCents - shareBCents,
    deltaCents: paidACents - shareACents,
  };
}

function computeProportionalShareACents(
  totalExpensesCents: number,
  incomeACents: number,
  incomeBCents: number,
): number {
  const totalIncomeCents = incomeACents + incomeBCents;
  // Aucun revenu déclaré des deux côtés : repli sur un 50/50 plutôt qu'une division par zéro.
  if (totalIncomeCents <= 0) return Math.floor(totalExpensesCents / 2);
  return Math.floor((totalExpensesCents * incomeACents) / totalIncomeCents);
}

function sumPaidBy(expenses: { amountCents: number; payerId: string }[], userId: string): number {
  return expenses.filter((e) => e.payerId === userId).reduce((sum, e) => sum + e.amountCents, 0);
}

export interface MonthDelta {
  month: MonthKey;
  deltaCents: number;
}

/**
 * Solde cumulé affiché : somme des deltaCents de tous les mois depuis (exclusif) le dernier
 * mois marqué réglé jusqu'à `uptoMonth` (inclus). Voir db/schema.sql pour le raisonnement complet.
 */
export function cumulativeBalance(
  monthDeltas: MonthDelta[],
  settledMonths: MonthKey[],
  uptoMonth: MonthKey,
): number {
  const lastSettled = settledMonths
    .filter((m) => m <= uptoMonth)
    .sort()
    .at(-1);

  return monthDeltas
    .filter((entry) => entry.month <= uptoMonth && (!lastSettled || entry.month > lastSettled))
    .reduce((sum, entry) => sum + entry.deltaCents, 0);
}
