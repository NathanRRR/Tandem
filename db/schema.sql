-- Schéma de données v1 — voir CLAUDE.md pour la logique métier complète.
-- Montants stockés en centimes (INTEGER) pour éviter les erreurs d'arrondi flottant.
-- IDs en UUID généré côté application (VARCHAR(36)) : pas de type UUID natif utilisé ici
-- (portabilité MySQL/MariaDB), voir src/lib/db/schema.ts pour le détail.

CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Revenu net mensuel, historisé : effective_month = premier mois où ce montant s'applique.
-- Pour un mois M, le revenu applicable est le dernier effective_month <= M.
-- Modifier son revenu = insérer une nouvelle ligne future, sans jamais réécrire l'historique.
CREATE TABLE incomes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  effective_month DATE NOT NULL, -- toujours le 1er du mois, ex: 2026-09-01
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, effective_month)
);

-- Table plutôt qu'un ENUM : ajouter/renommer une catégorie plus tard reste un simple INSERT/UPDATE,
-- pas une migration de type.
CREATE TABLE categories (
  id VARCHAR(64) PRIMARY KEY, -- slug stable, ex: 'loyer'
  label VARCHAR(255) NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0
);

INSERT INTO categories (id, label, sort_order) VALUES
  ('loyer', 'Loyer', 1),
  ('courses', 'Courses', 2),
  ('factures', 'Factures', 3),
  ('loisirs', 'Loisirs', 4),
  ('internet', 'Internet', 5),
  ('transport', 'Transport', 6),
  ('sante', 'Santé', 7),
  ('autre', 'Autre', 8);

-- Modèle d'une dépense récurrente (ex: "Loyer, 950€, payé par Alice").
-- Sert de gabarit pour générer une nouvelle occurrence dans expenses à chaque nouveau mois.
CREATE TABLE recurring_templates (
  id VARCHAR(36) PRIMARY KEY,
  label VARCHAR(255) NOT NULL,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  default_payer_id VARCHAR(36) NOT NULL REFERENCES users(id),
  active BOOLEAN NOT NULL DEFAULT true, -- false = ne plus générer de nouvelles occurrences
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Chaque dépense commune : ponctuelle (template_id NULL) ou occurrence générée d'un template.
-- Une occurrence est une copie indépendante : l'éditer ne touche ni le template ni les autres mois.
CREATE TABLE expenses (
  id VARCHAR(36) PRIMARY KEY,
  template_id VARCHAR(36) REFERENCES recurring_templates(id),
  label VARCHAR(255) NOT NULL,
  category_id VARCHAR(64) NOT NULL REFERENCES categories(id),
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  payer_id VARCHAR(36) NOT NULL REFERENCES users(id),
  date DATE NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX expenses_date_idx ON expenses (date);

-- État de règlement par mois. Le solde de compensation n'est jamais stocké : il est recalculé
-- à la volée en sommant les écarts théorique/payé de chaque mois depuis le dernier mois réglé.
CREATE TABLE monthly_settlements (
  month DATE PRIMARY KEY, -- toujours le 1er du mois
  settled BOOLEAN NOT NULL DEFAULT false,
  settled_at TIMESTAMP NULL
);

-- Réglage global du foyer, historisé comme les revenus : effective_month = premier mois où ce
-- mode s'applique. Sans historisation, changer de mode recalculerait discrètement le solde de
-- tout mois passé pas encore réglé (le solde de compensation n'est jamais stocké, voir plus bas).
CREATE TABLE split_mode_settings (
  id VARCHAR(36) PRIMARY KEY,
  split_mode ENUM('equal_rav', 'proportional_income') NOT NULL,
  effective_month DATE NOT NULL UNIQUE
);

-- ---------------------------------------------------------------------------
-- Logique de calcul (implémentée en application, pas en SQL pur) :
--
-- incomeOf(user, mois M)  = dernier incomes.amount_cents où effective_month <= M
-- S(M)                    = somme des expenses.amount_cents du mois M
-- splitModeOf(mois M)     = dernier split_mode_settings.split_mode où effective_month <= M
--                           (equal_rav si aucune ligne — comportement par défaut)
-- Selon splitModeOf(M) :
--   equal_rav (défaut)     : part_A(M) = (S(M) + R_A(M) - R_B(M)) / 2   part_B(M) = S(M) - part_A(M)
--   proportional_income    : part_A(M) = S(M) * R_A(M) / (R_A(M)+R_B(M))   part_B(M) = S(M) - part_A(M)
-- paid_A(M)                = somme des expenses payées par A dans le mois M
-- monthly_delta(M)         = paid_A(M) - part_A(M)
--   > 0 : A a trop payé ce mois-ci  → B doit ce montant à A
--   < 0 : A doit ce montant à B
--
-- solde cumulé affiché = somme des monthly_delta(M') pour tous les mois M' depuis
-- (exclusif) le dernier mois marqué settled=true jusqu'au mois courant (inclus).
--
-- "Marquer comme réglé" = upsert monthly_settlements(month=M, settled=true, settled_at=now()),
-- ce qui remet le cumul à zéro à partir du mois suivant.
--
-- Génération des récurrences : à la première consultation d'un nouveau mois M (ou via un job
-- planifié), pour chaque recurring_templates actif sans occurrence encore créée pour M, insérer
-- une nouvelle ligne expenses (template_id, label, category, amount_cents, payer_id copiés du
-- template, date = 1er du mois M).
-- ---------------------------------------------------------------------------
