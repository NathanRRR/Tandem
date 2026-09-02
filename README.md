# Tandem

PWA de gestion de budget en couple, façon Tricount mais pensée pour un foyer à deux : suivi des dépenses communes, avec un objectif central de répartition équitable — que chaque mois, il reste le **même reste-à-vivre net** de chaque côté (pondéré par les revenus, pas un simple 50/50).

## Pourquoi

Les outils de partage de dépenses classiques (Tricount, Splitwise...) visent un partage égal ou au prorata des dépenses. Tandem vise autre chose : que les deux personnes du foyer gardent, après leurs dépenses communes, le même reste-à-vivre net — ou à défaut, un partage strictement proportionnel aux revenus. Deux modes de calcul, configurables :

```
equal_rav (par défaut) — égalise le reste-à-vivre :
  part_A = (S + R_A − R_B) / 2
  part_B = (S − R_A + R_B) / 2

proportional_income — chacun paie au prorata de son revenu :
  part_A = S × R_A / (R_A + R_B)
  part_B = S − part_A
```
où `S` est le total des dépenses communes du mois et `R_A`/`R_B` les revenus nets mensuels de chacun.

## Fonctionnalités

- Saisie des dépenses communes (montant, catégorie, payeur, date, récurrence)
- Dépenses récurrentes (loyer, abonnements...) reconduites automatiquement, éditables/supprimables mois par mois
- Calcul et affichage du solde de compensation, cumulé d'un mois sur l'autre tant qu'il n'est pas réglé
- Historique multi-mois, mode de répartition modifiable sans affecter les mois passés déjà réglés
- Login identifiant/mot de passe pour 2 comptes (pas d'inscription publique, pas d'email requis)
- PWA installable sur mobile sans passer par un store

Détail de la logique métier et du modèle de données dans [CLAUDE.md](CLAUDE.md) et [db/schema.sql](db/schema.sql).

## Stack technique

- [Next.js](https://nextjs.org) (front + API) en TypeScript
- MariaDB + [Drizzle ORM](https://orm.drizzle.team)
- Auth par session chiffrée ([iron-session](https://github.com/vvo/iron-session) + bcrypt)
- PWA ([@ducanh2912/next-pwa](https://github.com/DuCanhGH/next-pwa))
- [Vitest](https://vitest.dev) pour la logique de calcul (`src/lib/domain/`)

## Démarrage local

Prérequis : Node.js 20+, Docker.

```bash
cp .env.example .env         # remplir avec de vraies valeurs (identifiants, revenus, secret de session)
docker compose up -d db      # MariaDB en conteneur
npm install
npm run db:generate          # génère une migration depuis src/lib/db/schema.ts
npm run db:migrate           # applique les migrations
npm run db:seed              # crée les 2 comptes du foyer + les catégories, à partir de .env
npm run dev                  # http://localhost:3000
```

```bash
npm run test                 # Vitest — logique de calcul
```

Next.js utilise Turbopack par défaut, incompatible avec le plugin PWA (basé webpack) — `dev`/`build` passent explicitement `--webpack`, déjà configuré dans les scripts npm.

## Déploiement

```bash
docker compose up -d --build
```

Lance MariaDB et l'application (`Dockerfile` fourni). Il reste à appliquer les migrations dans le conteneur (`docker compose exec -T app npx drizzle-kit migrate`) et à placer l'app derrière un reverse proxy HTTPS de votre choix — aucune configuration d'infrastructure spécifique n'est fournie ici au-delà de Docker.

## Licence

[MIT](LICENSE)
