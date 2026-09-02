import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { db } from "@/lib/db/client";
import { users } from "@/lib/db/schema";

export type User = typeof users.$inferSelect;

export async function getAllUsers(): Promise<User[]> {
  return db.select().from(users);
}

/**
 * L'app n'a que 2 comptes fixes : le partenaire est simplement "l'autre" utilisateur.
 * Une session dont l'utilisateur n'existe plus (ex: base re-seedée) est une session orpheline :
 * on renvoie vers /login plutôt que de planter avec une erreur 500. On ne peut pas détruire le
 * cookie ici (un composant serveur ne peut pas écrire de cookie) — se reconnecter en écrase
 * simplement la valeur via l'action `login`, donc pas besoin de le faire explicitement.
 */
export async function getCurrentAndPartner(
  currentUserId: string,
): Promise<{ currentUser: User; partner: User }> {
  const all = await getAllUsers();
  const currentUser = all.find((u) => u.id === currentUserId);
  const partner = all.find((u) => u.id !== currentUserId);

  if (!currentUser || !partner) {
    redirect("/login");
  }

  return { currentUser, partner };
}

export async function updateUserName(userId: string, name: string): Promise<void> {
  await db.update(users).set({ name }).where(eq(users.id, userId));
}

export async function verifyUserPassword(userId: string, password: string): Promise<boolean> {
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return false;
  return bcrypt.compare(password, user.passwordHash);
}

export async function updateUserPassword(userId: string, passwordHash: string): Promise<void> {
  await db.update(users).set({ passwordHash }).where(eq(users.id, userId));
}
