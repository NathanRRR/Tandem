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

Le mode de répartition est **historisé comme les revenus** (`split_mode_settings.effective_month`) : changer de mode ne s'applique qu'à partir du mois courant, les mois passés gardant le mode qui était actif à l'époque. Sans ça, un mois passé pas encore réglé aurait vu son solde recalculé silencieusement sous le nouveau mode à chaque affichage (le solde n'est jamais stocké, voir plus bas) — bug identifié et corrigé le 2026-09-01, avant qu'un vrai mois passé n'existe.

Le revenu de chacun est fixe et configuré dans le profil (pas d'ajustement ponctuel type prime en v1 — un changement durable de revenu se fait en modifiant le profil, applicable dès le mois en cours).

## Fonctionnalités v1

- Saisie manuelle des dépenses communes (montant, catégorie, payeur, date, récurrence)
- Catégories de dépenses (loyer, courses, factures, loisirs communs, etc.)
- Calcul et affichage du solde de compensation mensuel
- Historique multi-mois (consultation des mois passés, soldes réglés)
- Login identifiant/mot de passe (2 comptes créés manuellement, pas d'inscription publique — pas d'email requis puisque l'app n'envoie aucune notification)

## Stack technique

- Next.js (front + API dans le même projet) en TypeScript
- PostgreSQL pour la persistance
- PWA (manifest + service worker) pour une installation mobile sans passer par les stores
- Déploiement sur le VPS existant (Docker ou PM2)

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
docker compose up -d db      # Postgres en conteneur
npm install
npm run db:generate          # génère une migration depuis src/lib/db/schema.ts
npm run db:migrate           # applique les migrations
npm run db:seed              # crée les 2 comptes + catégories (à partir de .env)
npm run dev                  # http://localhost:3000
npm run test                 # Vitest — logique de calcul (lib/domain)
```

Déploiement complet (app + db) : `docker compose up -d --build`.

Next.js 16 par défaut utilise Turbopack, incompatible avec `@ducanh2912/next-pwa` (basé webpack) — `dev`/`build` passent explicitement `--webpack`.

## Statut

### Fait

- Cahier des charges v1, modèle de données, maquette des 5 écrans — tous validés.
- App Next.js/TypeScript/Tailwind complète : schéma Drizzle (miroir de `db/schema.sql`), logique de calcul pure et testée (`src/lib/domain/`, 13 tests Vitest verts), auth par session chiffrée (iron-session + bcrypt) avec **identifiant + mot de passe** (pas d'email — l'app n'envoie aucune notification), 5 écrans (login, dashboard, ajout dépense, historique + détail par mois, profil), génération paresseuse des dépenses récurrentes, PWA (manifest + service worker), `Dockerfile` + `docker-compose.yml`.
- Vérifié en conditions réelles (pas juste "ça compile") : connexion avec les deux comptes, ajout d'une dépense ponctuelle et d'une récurrente, calcul du reste-à-vivre et du solde de compensation, règlement du solde, changement de revenu confirmé non-rétroactif en base — le tout rejoué dans le conteneur Docker de production contre la vraie base Postgres.
- Auth migrée d'email vers identifiant (`users.username`) le 2026-09-01 : schéma, seed, action de connexion, écrans login/profil et `.env`/`.env.example`/`docker-compose.yml` tous mis à jour ; migration régénérée proprement (une seule migration a jamais existé, jamais déployée ailleurs qu'en local).
- Nom et mot de passe modifiables depuis l'écran Profil (même pattern que le revenu : `PencilIcon` + formulaire dépliable). Au passage, corrigé un vrai bug trouvé en testant : une session pointant vers un utilisateur supprimé (ex. après un re-seed) plantait l'app en erreur 500 au lieu de renvoyer vers `/login` — un composant serveur ne peut pas invalider un cookie pendant le rendu, donc `/login` reste maintenant accessible même avec un cookie de session obsolète (`getCurrentAndPartner` redirige, `proxy.ts` ne force plus connecté → `/`).
- Tout ce qui précède est vérifié dans le navigateur, y compris ce dernier ajout : connexion par identifiant, changement de nom, changement de mot de passe (ancien mot de passe rejeté, nouveau accepté à la reconnexion).

- Persistance migrée de Postgres vers MariaDB le 2026-09-01 (pour rester sur le même moteur que les autres sites du VPS) : schéma Drizzle porté en `mysql-core`, driver `mysql2`, `docker-compose.yml` basé sur `mariadb:11`. Bug de timezone trouvé et corrigé en testant (voir `db/client.ts`).
- **Déployé en prod le 2026-09-01** sur `budget.rivierenathan.fr` (Docker Compose dans `/opt/budget` sur le VPS, HTTPS Let's Encrypt, auto-déploiement GitHub Actions) — voir `config_vps_for_claude/RECAP.md` pour le détail complet. Smoke-testé en HTTPS (login, dashboard, solde).
- Anti-bruteforce login ajouté le 2026-09-01 (`src/lib/auth/login-throttle.ts`, même pattern que movies/journal/candidatures) : 5 échecs en 5 min → verrou 12h, clé sur `X-Real-IP` (écrasé par nginx, non falsifiable). Vérifié en conditions réelles : mot de passe correct rejeté après 5 échecs.
- Identifiant de Léa renommé `lea` → `lizzie` en base le 2026-09-01 (UPDATE direct, pas de reseed, pour préserver l'id utilisateur et les FK).
- Mode de répartition configurable ajouté le 2026-09-01 (`equal_rav` / `proportional_income`, toggle dans Profil). Le dashboard et l'historique n'affichent plus le badge "Équilibré"/l'icône "=" ou le mot "chacun" que lorsque les deux restes-à-vivre sont réellement égaux (sinon trompeur en mode proportionnel). Vérifié en conditions réelles : bascule des deux modes, calcul et affichage corrects dans les deux sens (15 tests Vitest verts).
- **Bug corrigé le 2026-09-01** (repéré en se posant la question avant qu'un vrai mois passé n'existe) : le réglage était d'abord une valeur globale unique (`app_settings`, une seule ligne) — changer de mode aurait recalculé silencieusement le solde de tout mois passé pas encore réglé. Migré en `split_mode_settings` historisé comme les revenus (`effective_month`) : un changement ne s'applique qu'à partir du mois courant. `getMonthOverview`/`computeCumulativeDelta` résolvent désormais le mode mois par mois plutôt qu'une seule fois globalement.
- App renommée « Équilibre » → **Tandem** le 2026-09-01 (`manifest.json`, `<title>`/`appleWebApp.title`, écran login) et nouvelle icône PWA (`public/icons/icon.svg`) : deux rubans entrelacés (terracotta/sauge) plutôt que les deux cercles superposés d'origine. Le badge "Équilibré" du dashboard (état du calcul, pas le nom de l'app) n'a pas été touché. Sous-domaine (`budget.rivierenathan.fr`) et nom du repo/dossier inchangés — pas demandé, et plus disruptif (DNS, nginx, deploy key, réinstallation de la PWA).
- **Bug corrigé le 2026-09-02** : `ensureRecurringOccurrences` (génération paresseuse des occurrences récurrentes) existait et était correcte depuis le début, mais n'était appelée nulle part — marquer une dépense "récurrente" créait le template + une seule occurrence, jamais reconduite le mois suivant. Repéré lors d'une revue de code demandée explicitement, avant qu'un vrai mois suivant n'ait eu l'occasion de le révéler. Corrigé en appelant `ensureRecurringOccurrences(month)` dans `getMonthOverview`, uniquement quand `month === currentMonthKey()` (jamais pour un mois passé consulté depuis l'historique, qui doit rester figé). Vérifié en conditions réelles : suppression manuelle de l'occurrence du mois courant → régénérée à l'affichage suivant du dashboard (nouvel id, mêmes valeurs que le template), pas de doublon au rechargement suivant, et confirmé qu'un mois passé consulté ne génère toujours rien.
- **Bug corrigé le 2026-09-02** : rien n'empêchait d'ajouter une dépense dans un mois déjà marqué réglé (y compris le mois courant réglé en cours de route) — le solde propre à ce mois se remettait à jour mais le cumul l'excluait quand même, sans bouton pour re-régler. Corrigé avec `unsettleFromMonth` (`data/settlement.ts`) : toute insertion de dépense (ajout manuel via `insertExpense`, ou génération récurrente via `ensureRecurringOccurrences`) remet `settled=false` sur son mois **et sur tout mois plus récent déjà réglé** (`WHERE month >= ? AND settled = true`), pour éviter qu'une dépense rétroactive laisse un mois plus tardif réglé sur la base d'un solde devenu obsolète. Vérifié en conditions réelles : ajout d'une dépense dans un mois tout juste réglé → carte "Solde à régler" et bouton "Marquer comme réglé" réapparaissent avec le bon montant ; et par script, deux mois réglés (août, septembre) + une dépense rétroactive en août → les deux se dé-règlent en cascade.

### Reste à faire

- **Modifier/supprimer une dépense existante** : seul l'ajout est implémenté.
- **Icônes PWA en PNG dédiées** : actuellement une seule icône SVG pour toutes les tailles/purpose — fonctionne sur navigateurs modernes, mais des PNG maskable dédiés seraient plus robustes pour l'installation Android.
- **Revue de code du 2026-09-02** : un candidat bug ("régler un mois plus récent en sautant un mois plus ancien perd sa contribution") a été **infirmé après relecture** — `computeCumulativeDelta` retrouve toujours le dernier mois réglé en remontant dans le temps (`filter(m <= uptoMonth).sort().at(-1)`), donc régler un mois inclut automatiquement tout ce qui n'était pas encore réglé avant lui ; aucune perte réelle tant que le montant affiché au moment du "réglé" est bien celui qui change de mains.
- `listPastMonths` recalcule le cumul de chaque mois passé depuis zéro (O(n²) en nombre de mois d'historique) — pas un bug de résultat, juste une dérive de performance à surveiller si l'historique grossit sur plusieurs années.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
