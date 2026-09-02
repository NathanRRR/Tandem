# Tandem

PWA de gestion de budget en couple, façon Tricount mais personnalisée pour un foyer à deux : suivi des dépenses communes, avec un objectif central de répartition équitable — que chaque mois, il reste le **même reste-à-vivre net** de chaque côté (pondéré par les revenus, pas un simple 50/50).

## Règles de commit

Ne jamais créditer Claude en co-auteur des commits.

## Logique métier centrale

Deux utilisateurs, chacun avec un revenu net fixe mensuel (`R_A`, `R_B`), configuré une fois dans son profil et modifiable.

Chaque dépense commune est saisie par celui qui l'a payée depuis son propre compte (pas de compte commun). Seules les dépenses communes comptent dans l'équilibrage — les dépenses perso de chacun sont hors calcul.

Pour un mois donné, soit `S` le total des dépenses communes. Deux modes de calcul possibles (réglage global du foyer, `app_settings.split_mode`, modifiable depuis le profil) :

```
equal_rav (par défaut) — égalise le reste-à-vivre :
  R_A − part_A = R_B − part_B, avec part_A + part_B = S
  part_A = (S + R_A − R_B) / 2
  part_B = (S − R_A + R_B) / 2

proportional_income — chacun paie au prorata de son revenu, sans viser un reste-à-vivre identique :
  part_A = S × R_A / (R_A + R_B)
  part_B = S − part_A
```

En fin de mois, l'app compare la part théorique de chacun à ce qu'il a réellement payé et affiche le solde de compensation (qui doit combien à qui) pour équilibrer.

### Dépenses récurrentes

Une dépense peut être marquée récurrente (ex : loyer). Elle est alors recopiée automatiquement dans le mois suivant sans ressaisie, tout en restant éditable/supprimable pour un mois donné (ex : mois où elle ne s'applique pas). Modifier le montant d'une occurrence récurrente n'affecte que les mois futurs : les mois passés conservent le montant qui était valable à l'époque (chaque mois a sa propre copie indépendante).

### Solde de compensation

Toutes les dépenses communes suivent systématiquement le mode de calcul actif (pas de mode par dépense — un seul réglage global pour tout le foyer, voir ci-dessus). Le solde de compensation d'un mois n'est pas soldé isolément : s'il n'est pas marqué "réglé", il se cumule avec le solde du mois suivant. Il faut donc un solde cumulé courant en plus du détail mois par mois.

Le mode de répartition est **historisé comme les revenus** (`split_mode_settings.effective_month`) : changer de mode ne s'applique qu'à partir du mois courant, les mois passés gardant le mode qui était actif à l'époque. Sans ça, un mois passé pas encore réglé verrait son solde recalculé silencieusement sous le nouveau mode à chaque affichage (le solde n'est jamais stocké, voir plus bas).

Le revenu de chacun est fixe et configuré dans le profil (pas d'ajustement ponctuel type prime en v1 — un changement durable de revenu se fait en modifiant le profil, applicable dès le mois en cours).

## Fonctionnalités v1

- Saisie manuelle des dépenses communes (montant, catégorie, payeur, date, récurrence)
- Catégories de dépenses (loyer, courses, factures, loisirs communs, etc.)
- Calcul et affichage du solde de compensation mensuel
- Historique multi-mois (consultation des mois passés, soldes réglés)
- Login identifiant/mot de passe (2 comptes créés manuellement, pas d'inscription publique — pas d'email requis puisque l'app n'envoie aucune notification)

## Stack technique

- Next.js (front + API dans le même projet) en TypeScript
- MariaDB pour la persistance
- PWA (manifest + service worker) pour une installation mobile sans passer par les stores
- Déploiement Docker (`Dockerfile` + `docker-compose.yml` fournis)

## Roadmap (hors v1, mais à garder possible sans refonte)

- Dashboard temps réel : reste-à-vivre projeté visible en continu pendant le mois
- Stats & graphiques multi-mois : évolution des dépenses par catégorie

Ces deux pistes sont de simples agrégations/vues sur les données déjà prévues (dépenses datées + catégorisées) — pas d'impact sur le modèle de données de la v1.

Explicitement hors scope pour l'instant : enveloppes budgétaires, objectif d'épargne commun, justificatifs/photos, notifications push, export CSV/PDF. Rester minimal ailleurs.

## Modèle de données

Voir [db/schema.sql](db/schema.sql) pour le schéma complet et la logique de calcul.

Points non-évidents du modèle :
- Les revenus sont historisés (`incomes.effective_month`), pas un simple champ éditable : un changement de revenu s'applique dès le mois courant (upsert sur le mois en cours) sans jamais réécrire l'historique des mois passés.
- Une dépense récurrente est un `recurring_templates` qui génère une occurrence indépendante (`expenses.template_id`) à chaque nouveau mois. Éditer le template n'affecte que les générations futures ; éditer une occurrence n'affecte que son mois.
- Le solde de compensation n'est jamais stocké : seul l'état "réglé" par mois (`monthly_settlements`) est persisté, le solde cumulé est recalculé à la volée depuis le dernier mois réglé.

## Développement local

```bash
cp .env.example .env         # remplir avec de vraies valeurs
docker compose up -d db      # MariaDB en conteneur
npm install
npm run db:generate          # génère une migration depuis src/lib/db/schema.ts
npm run db:migrate           # applique les migrations
npm run db:seed              # crée les 2 comptes + catégories (à partir de .env)
npm run dev                  # http://localhost:3000
npm run test                 # Vitest — logique de calcul (lib/domain)
```

Déploiement complet (app + db) : `docker compose up -d --build`.

Next.js 16 par défaut utilise Turbopack, incompatible avec `@ducanh2912/next-pwa` (basé webpack) — `dev`/`build` passent explicitement `--webpack`.

## État actuel

### Fait

- Modèle de données (schéma Drizzle en `mysql-core`, miroir de `db/schema.sql`), logique de calcul pure et testée (`src/lib/domain/`, tests Vitest).
- Auth par session chiffrée (iron-session + bcrypt) avec identifiant + mot de passe (pas d'email, pas d'inscription publique — 2 comptes créés par `npm run db:seed`), anti-bruteforce sur le login (`src/lib/auth/login-throttle.ts`).
- 5 écrans : login, dashboard, ajout de dépense, historique (+ détail par mois), profil (revenu, nom, mot de passe, mode de répartition modifiables).
- Dépenses récurrentes : génération paresseuse d'une nouvelle occurrence à chaque mois courant, éditable/supprimable indépendamment par mois.
- Édition/suppression d'une dépense (`/expenses/[id]/edit`), avec dé-règlement en cascade du mois concerné et de tout mois plus récent déjà réglé si la modification en change le solde.
- Mode de répartition configurable (`equal_rav` / `proportional_income`), historisé comme les revenus (`split_mode_settings.effective_month`).
- PWA (manifest + service worker), `Dockerfile` + `docker-compose.yml`.

### Reste à faire

- Icônes PWA en PNG dédiées : actuellement une seule icône SVG pour toutes les tailles/purpose — fonctionne sur navigateurs modernes, mais des PNG maskable dédiés seraient plus robustes pour l'installation Android.
- `listPastMonths` recalcule le cumul de chaque mois passé depuis zéro (O(n²) en nombre de mois d'historique) — pas un bug de résultat, juste une dérive de performance à surveiller si l'historique grossit sur plusieurs années.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
