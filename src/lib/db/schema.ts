import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  index,
  int,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/mysql-core";

// Miroir de db/schema.sql — voir ce fichier pour la logique de calcul complète.
// Montants en centimes (INTEGER) pour éviter les erreurs d'arrondi flottant.
// IDs en UUID généré côté application (varchar(36)) : MySQL/MariaDB n'a pas de type
// uuid natif dans drizzle-orm/mysql-core, et pas de clause RETURNING fiable après insert —
// générer l'id avant l'insert évite un aller-retour DB supplémentaire pour le récupérer.

export const users = mysqlTable("users", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  username: varchar("username", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Revenu net mensuel, historisé : effectiveMonth = premier mois où ce montant s'applique.
// Pour un mois M, le revenu applicable est le dernier effectiveMonth <= M. Modifier son revenu
// insère une nouvelle ligne future, sans jamais réécrire l'historique (voir lib/domain/balance.ts).
export const incomes = mysqlTable(
  "incomes",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    userId: varchar("user_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    amountCents: int("amount_cents").notNull(),
    effectiveMonth: date("effective_month", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    uniqueIndex("incomes_user_effective_month_idx").on(table.userId, table.effectiveMonth),
    check("incomes_amount_nonnegative", sql`${table.amountCents} >= 0`),
  ],
);

// Table plutôt qu'un enum : ajouter/renommer une catégorie reste un simple INSERT/UPDATE.
export const categories = mysqlTable("categories", {
  id: varchar("id", { length: 64 }).primaryKey(), // slug stable, ex: 'loyer'
  label: varchar("label", { length: 255 }).notNull(),
  sortOrder: int("sort_order").notNull().default(0),
});

// Modèle d'une dépense récurrente (ex: "Loyer, 950€, payé par Nathan").
// Sert de gabarit pour générer une nouvelle occurrence dans `expenses` à chaque nouveau mois.
export const recurringTemplates = mysqlTable(
  "recurring_templates",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    label: varchar("label", { length: 255 }).notNull(),
    categoryId: varchar("category_id", { length: 64 })
      .notNull()
      .references(() => categories.id),
    amountCents: int("amount_cents").notNull(),
    defaultPayerId: varchar("default_payer_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    active: boolean("active").notNull().default(true), // false = ne plus générer de nouvelles occurrences
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [check("recurring_templates_amount_nonnegative", sql`${table.amountCents} >= 0`)],
);

// Chaque dépense commune : ponctuelle (templateId NULL) ou occurrence générée d'un template.
// Une occurrence est une copie indépendante : l'éditer ne touche ni le template ni les autres mois.
export const expenses = mysqlTable(
  "expenses",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .$defaultFn(() => randomUUID()),
    templateId: varchar("template_id", { length: 36 }).references(() => recurringTemplates.id),
    label: varchar("label", { length: 255 }).notNull(),
    categoryId: varchar("category_id", { length: 64 })
      .notNull()
      .references(() => categories.id),
    amountCents: int("amount_cents").notNull(),
    payerId: varchar("payer_id", { length: 36 })
      .notNull()
      .references(() => users.id),
    date: date("date", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => [
    index("expenses_date_idx").on(table.date),
    check("expenses_amount_nonnegative", sql`${table.amountCents} >= 0`),
  ],
);

// État de règlement par mois. Le solde de compensation n'est jamais stocké : il est recalculé
// à la volée (lib/domain/balance.ts) en sommant les écarts théorique/payé depuis le dernier mois réglé.
export const monthlySettlements = mysqlTable("monthly_settlements", {
  month: date("month", { mode: "date" }).primaryKey(), // toujours le 1er du mois
  settled: boolean("settled").notNull().default(false),
  settledAt: timestamp("settled_at"),
});

// Réglage global du foyer, historisé comme les revenus : effectiveMonth = premier mois où ce
// mode s'applique. Un changement de mode n'affecte jamais les mois déjà vécus (voir income.ts) —
// sans ça, changer de mode recalculerait discrètement le solde de tout mois passé pas encore réglé.
export const splitModeSettings = mysqlTable("split_mode_settings", {
  id: varchar("id", { length: 36 })
    .primaryKey()
    .$defaultFn(() => randomUUID()),
  splitMode: mysqlEnum("split_mode", ["equal_rav", "proportional_income"]).notNull(),
  effectiveMonth: date("effective_month", { mode: "date" }).notNull().unique(),
});
