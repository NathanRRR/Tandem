import { describe, expect, it } from "vitest";
import { draftOccurrencesForMonth, type RecurringTemplate } from "./recurring";

const templates: RecurringTemplate[] = [
  {
    id: "tpl-loyer",
    label: "Loyer",
    categoryId: "loyer",
    amountCents: 95_000,
    defaultPayerId: "user-a",
    active: true,
  },
  {
    id: "tpl-internet",
    label: "Internet",
    categoryId: "internet",
    amountCents: 3_990,
    defaultPayerId: "user-a",
    active: true,
  },
  {
    id: "tpl-abonnement-arrete",
    label: "Ancien abonnement",
    categoryId: "autre",
    amountCents: 1_000,
    defaultPayerId: "user-b",
    active: false,
  },
];

describe("draftOccurrencesForMonth", () => {
  const targetMonth = new Date(Date.UTC(2026, 8, 1)); // septembre 2026

  it("génère une occurrence pour chaque modèle actif sans occurrence existante", () => {
    const drafts = draftOccurrencesForMonth(templates, new Set(), targetMonth);

    expect(drafts).toHaveLength(2);
    expect(drafts.map((d) => d.templateId).sort()).toEqual(["tpl-internet", "tpl-loyer"]);
    expect(drafts[0].date).toBe(targetMonth);
  });

  it("ignore les modèles inactifs", () => {
    const drafts = draftOccurrencesForMonth(templates, new Set(), targetMonth);
    expect(drafts.some((d) => d.templateId === "tpl-abonnement-arrete")).toBe(false);
  });

  it("ne régénère pas une occurrence déjà créée ce mois-ci", () => {
    const drafts = draftOccurrencesForMonth(
      templates,
      new Set(["tpl-loyer"]),
      targetMonth,
    );

    expect(drafts).toHaveLength(1);
    expect(drafts[0].templateId).toBe("tpl-internet");
  });

  it("copie les valeurs du modèle dans le draft généré", () => {
    const [draft] = draftOccurrencesForMonth(
      [templates[0]],
      new Set(),
      targetMonth,
    );

    expect(draft).toMatchObject({
      templateId: "tpl-loyer",
      label: "Loyer",
      categoryId: "loyer",
      amountCents: 95_000,
      payerId: "user-a",
    });
  });
});
