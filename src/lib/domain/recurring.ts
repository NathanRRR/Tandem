export interface RecurringTemplate {
  id: string;
  label: string;
  categoryId: string;
  amountCents: number;
  defaultPayerId: string;
  active: boolean;
}

export interface GeneratedExpenseDraft {
  templateId: string;
  label: string;
  categoryId: string;
  amountCents: number;
  payerId: string;
  date: Date; // 1er du mois cible
}

/**
 * Détermine quelles occurrences créer pour un mois donné : un modèle actif sans occurrence
 * déjà générée pour ce mois donne une nouvelle dépense. L'appelant (couche DB) fournit
 * `templateIdsAlreadyGeneratedForMonth` en interrogeant `expenses.templateId` pour ce mois,
 * et est responsable de l'insertion effective des drafts retournés ici.
 */
export function draftOccurrencesForMonth(
  templates: RecurringTemplate[],
  templateIdsAlreadyGeneratedForMonth: Set<string>,
  targetMonthFirstDay: Date,
): GeneratedExpenseDraft[] {
  return templates
    .filter((t) => t.active && !templateIdsAlreadyGeneratedForMonth.has(t.id))
    .map((t) => ({
      templateId: t.id,
      label: t.label,
      categoryId: t.categoryId,
      amountCents: t.amountCents,
      payerId: t.defaultPayerId,
      date: targetMonthFirstDay,
    }));
}
