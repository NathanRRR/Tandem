import "dotenv/config";
import bcrypt from "bcryptjs";
import { eq, sql } from "drizzle-orm";
import { db } from "./client";
import { categories, incomes, users } from "./schema";

const CATEGORIES = [
  { id: "loyer", label: "Loyer", sortOrder: 1 },
  { id: "courses", label: "Courses", sortOrder: 2 },
  { id: "factures", label: "Factures", sortOrder: 3 },
  { id: "loisirs", label: "Loisirs", sortOrder: 4 },
  { id: "internet", label: "Internet", sortOrder: 5 },
  { id: "transport", label: "Transport", sortOrder: 6 },
  { id: "sante", label: "Santé", sortOrder: 7 },
  { id: "autre", label: "Autre", sortOrder: 8 },
];

function firstOfCurrentMonth(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}`);
  return value;
}

async function seedUser(prefix: "USER_A" | "USER_B") {
  const username = requireEnv(`${prefix}_USERNAME`);
  const password = requireEnv(`${prefix}_PASSWORD`);
  const name = requireEnv(`${prefix}_NAME`);
  const incomeCents = Number(requireEnv(`${prefix}_INCOME_CENTS`));
  const passwordHash = await bcrypt.hash(password, 12);

  // drizzle-orm/mysql2 n'a pas de RETURNING : upsert puis SELECT pour récupérer l'id
  // (généré côté app à l'insert, mais inconnu ici en cas de mise à jour d'un compte existant).
  await db
    .insert(users)
    .values({ username, passwordHash, name })
    .onDuplicateKeyUpdate({ set: { passwordHash, name } });

  const [user] = await db.select().from(users).where(eq(users.username, username)).limit(1);

  // `id = id` : équivalent MySQL/MariaDB de onConflictDoNothing (no-op sur conflit).
  await db
    .insert(incomes)
    .values({ userId: user.id, amountCents: incomeCents, effectiveMonth: firstOfCurrentMonth() })
    .onDuplicateKeyUpdate({ set: { id: sql`${incomes.id}` } });

  return user;
}

async function main() {
  await db
    .insert(categories)
    .values(CATEGORIES)
    .onDuplicateKeyUpdate({ set: { id: sql`${categories.id}` } });

  const userA = await seedUser("USER_A");
  const userB = await seedUser("USER_B");

  console.log(`Comptes prêts : ${userA.name} (@${userA.username}), ${userB.name} (@${userB.username})`);
  process.exit(0);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
