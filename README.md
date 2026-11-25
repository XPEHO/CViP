# CViP

Monorepo (npm workspaces) :

| Dossier          | Stack                                                     |
| ---------------- | --------------------------------------------------------- |
| `cvip_backend/`  | Node.js + Express 5, TypeScript, TypeORM, node-pg-migrate |
| `cvip_frontend/` | Vue 3 + Vite, TypeScript, Vue Router, Pinia, ESLint       |

PostgreSQL 17 est fourni par `docker-compose.yml`.

## Prérequis

- Node.js 26 (`nvm use` lit le `.nvmrc`)
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

Le serveur Vite proxifie `/api/*` vers le backend : `http://localhost:5173/api/health` vérifie l'API et la connexion à la base (le proxy retire `/api` : le backend sert `/health`). La documentation (Swagger UI) est sur `http://localhost:3000/api-docs`.

### Stack conteneurisée

```sh
docker compose up -d --build   # Postgres + backend (http://localhost:3000) + frontend (http://localhost:8080)
```

Le frontend est servi par nginx, qui proxifie `/api/*` vers le backend (`BACKEND_URL`) en retirant le préfixe `/api`. Le port exposé se règle avec `FRONTEND_PORT`.

Les ports (base, backend, frontend) ne sont publiés que sur `127.0.0.1`. `POSTGRES_USER`, `POSTGRES_PASSWORD` et `POSTGRES_DB` sont obligatoires (voir `.env.example`) : compose refuse de démarrer sans eux. Ne pas lancer `npm run dev:backend` en même temps (même port 3000) ; si le port 5432 est déjà pris sur la machine, changer `POSTGRES_PORT`.

## Scripts

| Commande                     | Description                                                             |
| ---------------------------- | ----------------------------------------------------------------------- |
| `npm run dev`                | Lance backend et frontend en parallèle                                  |
| `npm run dev:backend`        | Backend seul (rechargement auto)                                        |
| `npm run dev:frontend`       | Frontend seul                                                           |
| `npm run build`              | Build de production du frontend                                         |
| `npm run lint`               | Lint des workspaces                                                     |
| `npm run typecheck`          | Vérifie les types (`tsc` backend, `vue-tsc` frontend)                   |
| `npm run format`             | Formate le dépôt avec Prettier (`format:check` vérifie)                 |
| `npm run test:scripts`       | Tests des scripts du dépôt (`scripts/`)                                 |
| `npm test`                   | Tests des workspaces (le back-end requiert Docker)                      |
| `npm run e2e:api` / `e2e:ui` | E2E Cucumber (API) / Playwright + axe (interface), pile Docker démarrée |
| `npm run db:migrate`         | Applique les migrations en attente                                      |
| `npm run db:up` / `db:down`  | Démarre / arrête Postgres                                               |

## Base de données

Le schéma est versionné par [node-pg-migrate](https://salsita.github.io/node-pg-migrate/) dans `cvip_backend/migrations/` (fichiers SQL avec sections `-- Up Migration` / `-- Down Migration`).

```sh
npm run migrate:create -w cvip_backend -- nom-de-la-migration   # nouvelle migration
npm run db:migrate                                         # applique les migrations
npm run migrate:down -w cvip_backend                            # annule la dernière
```

## Contribuer

- Branches : `type/CVIP-nn` (ex. `feat/CVIP-21`). Types : `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `style`, `hotfix`, `release`.
- Commits et titre de PR : `type(CVIP-nn): sujet` (ex. `feat(CVIP-21): créer une version commerciale`). Sans ticket : scope `deps`, `repo`, `docs`, `ci` ou `docker` (ex. `chore(repo): ajouter Prettier`). Le squash merge reprend le titre de la PR.
- Les hooks Git (lefthook) sont installés par `npm install` : Prettier, ESLint, nom de branche et message de commit sont vérifiés avant chaque commit. Les mêmes contrôles tournent en CI.
- Formatage : `npm run format` avant de pousser.

## Sécurité

- **Secrets** : gitleaks analyse l'historique en CI (job `secrets`, binaire vérifié par somme de contrôle) et les fichiers indexés avant chaque commit (hook, ignoré si gitleaks n'est pas installé). Configuration : `.gitleaks.toml`.
- **Analyse statique** : CodeQL (`.github/workflows/codeql.yml`) sur chaque PR, chaque push sur `main` et chaque semaine, et Semgrep (job `semgrep`, image épinglée par digest, règles `p/typescript` et `p/nodejs`) sur les sources des quatre workspaces.
- **Chaîne d'approvisionnement** : toute action GitHub est épinglée par SHA de commit complet (le tag reste en commentaire) et les images Docker par digest ; Dependabot met les deux à jour. Les versions de gitleaks, d'actionlint et de Semgrep sont dans `env` de `ci.yml` (à relever à la main). Le job `workflows` (actionlint) vérifie les workflows.
- **Droits** : les workflows ont `contents: read` par défaut ; seuls la publication (`packages: write`) et CodeQL (`security-events: write`) élèvent leurs droits.
- **Conteneurs** : ports publiés sur `127.0.0.1` seulement, utilisateur non root, `no-new-privileges`, aucun secret dans l'image ni dans le dépôt (`.env` ignoré).
- **Signaler une faille** : voir [SECURITY.md](SECURITY.md).

### Réglages GitHub à activer (hors dépôt)

À faire une fois dans _Settings_ du dépôt (ils ne peuvent pas être versionnés) :

1. _Code security_ : activer **Secret scanning** et **Push protection**, **Dependabot alerts** et **Dependabot security updates**, **Private vulnerability reporting**. Ne pas activer le _default setup_ de CodeQL : le workflow `codeql.yml` le remplace.
2. _Actions > General_ : _Workflow permissions_ sur **Read repository contents**, et cocher **Require actions to be pinned to a full-length commit SHA**.
3. _Rules > Rulesets_ (ou _Branches_) sur `main` : exiger une pull request, une revue des propriétaires (`CODEOWNERS`), la branche à jour avec `main`, et les contrôles `ci`, `conventions`, `secrets`, `workflows`, `e2e (api)`, `e2e (ui)`, `docker (backend)`, `docker (frontend)`, `Static analysis (Semgrep)` et `CodeQL analysis (TypeScript)` ; interdire le force-push et la suppression.
4. _General_ : autoriser uniquement le **squash merge** (le titre de la PR devient le message du commit) et supprimer les branches mergées.

## CI

`.github/workflows/ci.yml` s'exécute sur chaque pull request : lint, typecheck, format, tests avec seuils de couverture (Testcontainers), build, conventions (branche, titre, commits), secrets (gitleaks), workflows (actionlint), analyse Semgrep, construction des images Docker avec contrôle de leur contenu et tests E2E (le job `changes` saute les étapes lourdes d'une PR qui ne touche ni code ni configuration ; les contrôles exigés restent lancés et passent) (job `e2e` : Cucumber sur l'API, Playwright et axe-core sur l'interface, sur la pile complète démarrée par Docker Compose ; les rapports sont publiés en artefacts). Le workflow `cd.yml` le rappelle à chaque push sur `main` avant de publier les images.
