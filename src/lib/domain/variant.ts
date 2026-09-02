/**
 * Assigne une couleur ("a" terracotta / "b" sauge) de façon stable par personne, indépendamment
 * de qui consulte l'app — comparaison déterministe des id, pas de l'ordre de connexion.
 */
export function personVariant(userId: string, otherUserId: string): "a" | "b" {
  return userId < otherUserId ? "a" : "b";
}
