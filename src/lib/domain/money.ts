export function parseEurosToCents(input: string): number {
  const normalized = input.trim().replace(/\s/g, "").replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error("Montant invalide");
  }
  return Math.round(value * 100);
}

export function formatCents(cents: number): string {
  const euros = cents / 100;
  return `${euros.toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
}
