import { asc, eq } from "drizzle-orm";
import { db } from "@/lib/db/client";
import { categories } from "@/lib/db/schema";

export type Category = typeof categories.$inferSelect;

export async function getCategories(): Promise<Category[]> {
  return db.select().from(categories).orderBy(asc(categories.sortOrder));
}

export async function getCategoryLabel(categoryId: string): Promise<string> {
  const [row] = await db.select().from(categories).where(eq(categories.id, categoryId)).limit(1);
  if (!row) throw new Error(`Catégorie inconnue : ${categoryId}`);
  return row.label;
}
