import { describe, expect, it } from "vitest";
import { computeMonthlyBalance, cumulativeBalance } from "./balance";

const A = "user-a";
const B = "user-b";

describe("computeMonthlyBalance", () => {
  it("reproduit l'exemple de la maquette (revenus différents)", () => {
    // Nathan 2450€, Léa 1950€, 1220€ de dépenses communes.
    const result = computeMonthlyBalance({
      userAId: A,
      userBId: B,
      incomeACents: 245_000,
      incomeBCents: 195_000,
      expenses: [
        { amountCents: 95_000, payerId: A }, // loyer
        { amountCents: 3_990, payerId: A }, // internet
        { amountCents: 7_800, payerId: B }, // électricité
        { amountCents: 6_430, payerId: B }, // courses
        { amountCents: 2_400, payerId: A }, // ciné
        { amountCents: 6_380, payerId: B }, // courses bio
      ],
    });

    expect(result.totalExpensesCents).toBe(122_000);
    expect(result.shareACents).toBe(86_000);
    expect(result.shareBCents).toBe(36_000);
    expect(result.restACents).toBe(159_000);
    expect(result.restBCents).toBe(159_000); // reste à vivre identique des deux côtés
    expect(result.paidACents).toBe(101_390);
    expect(result.paidBCents).toBe(20_610);
    expect(result.deltaCents).toBe(15_390); // Léa doit 153,90 € à Nathan
  });

  it("revient à un partage 50/50 quand les revenus sont égaux", () => {
    const result = computeMonthlyBalance({
      userAId: A,
      userBId: B,
      incomeACents: 200_000,
      incomeBCents: 200_000,
      expenses: [{ amountCents: 10_000, payerId: A }],
    });

    expect(result.shareACents).toBe(5_000);
    expect(result.shareBCents).toBe(5_000);
  });

  it("répartit toujours exactement le total, même avec un centime impair", () => {
    const result = computeMonthlyBalance({
      userAId: A,
      userBId: B,
      incomeACents: 200_001,
      incomeBCents: 200_000,
      expenses: [{ amountCents: 101, payerId: A }],
    });

    expect(result.shareACents + result.shareBCents).toBe(result.totalExpensesCents);
  });

  it("gère un mois sans dépense commune : le reste s'équilibre quand même si les revenus diffèrent", () => {
    const result = computeMonthlyBalance({
      userAId: A,
      userBId: B,
      incomeACents: 200_000,
      incomeBCents: 150_000,
      expenses: [],
    });

    expect(result.totalExpensesCents).toBe(0);
    expect(result.restACents).toBe(result.restBCents); // 175 000 chacun
    expect(result.paidACents).toBe(0);
    // A n'a rien payé mais sa part théorique était de 25 000 (25% de l'écart de revenu) :
    // A doit donc 25 000 à B pour que le reste-à-vivre reste égal.
    expect(result.deltaCents).toBe(-25_000);
  });

  it("ne demande aucun transfert sans dépense et avec des revenus égaux", () => {
    const result = computeMonthlyBalance({
      userAId: A,
      userBId: B,
      incomeACents: 200_000,
      incomeBCents: 200_000,
      expenses: [],
    });

    expect(result.deltaCents).toBe(0);
  });

  it("mode proportional_income : répartit au prorata des revenus (pas d'égalisation du reste)", () => {
    // Nathan 2450€, Léa 1950€ (ratio 245/195), 1220€ de dépenses communes.
    const result = computeMonthlyBalance({
      userAId: A,
      userBId: B,
      incomeACents: 245_000,
      incomeBCents: 195_000,
      expenses: [{ amountCents: 122_000, payerId: A }],
      splitMode: "proportional_income",
    });

    expect(result.shareACents).toBe(Math.floor((122_000 * 245_000) / 440_000));
    expect(result.shareACents + result.shareBCents).toBe(122_000);
    expect(result.restACents).not.toBe(result.restBCents); // pas d'égalisation par design
  });

  it("mode proportional_income : revient à un 50/50 si les deux revenus sont nuls", () => {
    const result = computeMonthlyBalance({
      userAId: A,
      userBId: B,
      incomeACents: 0,
      incomeBCents: 0,
      expenses: [{ amountCents: 101, payerId: A }],
      splitMode: "proportional_income",
    });

    expect(result.shareACents + result.shareBCents).toBe(101);
    expect(result.shareACents).toBe(50);
  });
});

describe("cumulativeBalance", () => {
  const deltas = [
    { month: "2026-06", deltaCents: 1_000 },
    { month: "2026-07", deltaCents: -500 },
    { month: "2026-08", deltaCents: 2_000 },
    { month: "2026-09", deltaCents: 300 },
  ];

  it("somme tous les mois quand rien n'a jamais été réglé", () => {
    expect(cumulativeBalance(deltas, [], "2026-09")).toBe(1_000 - 500 + 2_000 + 300);
  });

  it("ne compte que les mois après le dernier mois réglé", () => {
    expect(cumulativeBalance(deltas, ["2026-07"], "2026-09")).toBe(2_000 + 300);
  });

  it("ignore les mois réglés postérieurs au mois demandé", () => {
    expect(cumulativeBalance(deltas, ["2026-09"], "2026-08")).toBe(1_000 - 500 + 2_000);
  });

  it("retombe à zéro juste après le mois réglé", () => {
    expect(cumulativeBalance(deltas, ["2026-08"], "2026-08")).toBe(0);
  });
});
