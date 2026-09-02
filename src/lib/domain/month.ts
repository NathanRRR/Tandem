// Représentation d'un mois en "YYYY-MM" : la comparaison chronologique se fait par simple
// comparaison de chaînes (grâce au zero-padding), sans les pièges de fuseau horaire des Date.
export type MonthKey = string;

export function monthKeyOf(date: Date): MonthKey {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

export function startOfMonthUTC(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}

export function monthKeyToDate(key: MonthKey): Date {
  const [year, month] = key.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, 1));
}

export function addMonths(key: MonthKey, delta: number): MonthKey {
  const [year, month] = key.split("-").map(Number);
  const total = year * 12 + (month - 1) + delta;
  const newYear = Math.floor(total / 12);
  const newMonth = (total % 12) + 1;
  return `${newYear}-${String(newMonth).padStart(2, "0")}`;
}

/** Ex: "2026-09" -> "Septembre 2026" */
export function formatMonthLabel(key: MonthKey): string {
  const label = new Intl.DateTimeFormat("fr-FR", { month: "long", year: "numeric" }).format(
    monthKeyToDate(key),
  );
  return label.charAt(0).toUpperCase() + label.slice(1);
}
