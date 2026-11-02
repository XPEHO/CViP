# CViP

Monorepo (npm workspaces) :

| Dossier     | Stack                                   |
| ----------- | --------------------------------------- |
| `backend/`  | Node.js + Express 5, `pg`, node-pg-migrate |
| `frontend/` | Vue 3 + Vite, Vue Router, Pinia, ESLint |
| `db/`       | PostgreSQL 17 (Docker Compose)          |

## Prérequis

- Node.js 24 (`nvm use` lit le `.nvmrc`)
- Docker + Docker Compose

## Démarrage

```sh
nvm use
cp .env.example .env   # puis ajuster si besoin
npm install
npm run db:up          # lance Postgres
npm run db:migrate     # applique les migrations
npm run dev            # backend (http://localhost:3000) + frontend (http://localhost:5173)
```

Le serveur Vite proxifie `/api/*` vers le backend : `http://localhost:5173/api/health` vérifie l'API et la connexion à la base.

## Scripts

| Commande               | Description                          |
| ---------------------- | ------------------------------------ |
| `npm run dev`          | Lance backend et frontend en parallèle |
| `npm run dev:backend`  | Backend seul (rechargement auto)     |
| `npm run dev:frontend` | Frontend seul                        |
| `npm run build`        | Build de production du frontend      |
| `npm run lint`         | Lint des workspaces                  |
| `npm test`             | Tests des workspaces (le back-end requiert Postgres) |
| `npm run db:migrate`   | Applique les migrations en attente   |
| `npm run db:up` / `db:down` | Démarre / arrête Postgres       |

## Base de données

Le schéma est versionné par [node-pg-migrate](https://salsita.github.io/node-pg-migrate/) dans `backend/migrations/` (fichiers SQL avec sections `-- Up Migration` / `-- Down Migration`).

```sh
npm run migrate:create -w backend -- nom-de-la-migration   # nouvelle migration
npm run db:migrate                                         # applique les migrations
npm run migrate:down -w backend                            # annule la dernière
```

## CI

`.github/workflows/ci.yml` exécute lint, migrations, tests et build sur chaque pull request et à chaque push sur `main`.
