# cvip_backend/CLAUDE.md

Règles générales : [../CLAUDE.md](../CLAUDE.md). Ici : ce qui est propre au backend.

## Stack

TypeScript strict, Node 26 (ESM), Express 5, **TypeORM** (entités à décorateurs, `synchronize: false`), `helmet`, node-pg-migrate. Tests d'intégration : `node:test` + **Testcontainers** (un Postgres éphémère par fichier de test, migrations rejouées, requêtes `fetch` sur l'app) ; pas de mock de la base.

**Exécution : `tsc` compile vers `dist/`, Node exécute `dist/`**. Les décorateurs TypeORM exigent cette compilation : Node ne sait pas exécuter des `.ts` avec décorateurs. Conséquences :

- `dev` lance `tsc --watch` et `node --watch dist/server.js` en parallèle (`predev` fait un premier build).
- `test` et `test:coverage` compilent d'abord (`pretest` / `npm run build`), puis exécutent `dist/**/*.test.js`. Les tests sont à côté du code (`foo.ts` + `foo.test.ts`).
- Importer avec l'extension `.ts` (`from './errors.ts'`) ; `tsc` la réécrit en `.js`. Imports de types avec `import type` (`verbatimModuleSyntax`).
- `build` supprime `dist/` avec Node (`fs.rmSync`) et non `rm -rf`, pour fonctionner sous Windows (`cmd.exe`). Même règle pour tout nouveau script npm : pas de `rm`, `mkdir -p`, `VAR=x cmd` ni guillemets simples (utiliser `cross-env` et des guillemets doubles échappés).

## Architecture en couches (`src/`)

`routes → controllers → services → repositories → entities`. Chaque couche n'appelle que celle du dessous.

| Dossier         | Rôle                                                                                                                                        |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `routes/`       | Déclare les routes Express et assemble dépôt, service et contrôleur d'un domaine (`<domaine>.routes.ts`).                                   |
| `controllers/`  | Gestionnaires `handle*` : lisent la requête via les mappers, appellent le service, répondent, traduisent les erreurs métier en codes d'API. |
| `services/`     | Règles métier, **sans HTTP ni TypeORM** : le dépôt est injecté, ce qui permet les tests unitaires avec un faux dépôt.                       |
| `repositories/` | Accès aux données. Seule couche qui parle à TypeORM.                                                                                        |
| `entities/`     | Entités TypeORM, miroirs manuels des migrations SQL (propriétés camelCase, colonnes snake_case).                                            |
| `mappers/`      | `http.mapper.ts` : requête ↔ valeurs typées, entités → JSON snake_case. Aucune règle métier.                                                |
| `middleware/`   | Gestionnaire d'erreurs et route inconnue.                                                                                                   |
| `utils/`        | `api-error` (codes), `validation`, `naming`, `pg-error`. `config/env.ts` : variables d'environnement.                                       |
| `db/`           | `data-source.ts` (connexion TypeORM, `withTransaction`).                                                                                    |

- `app.ts` exporte `createApp()` (sans effet de bord) ; `server.ts` joue les migrations (**échec = arrêt du processus**), initialise TypeORM puis écoute. `migrations/` est hors de `src/`.
- Le contrat JSON reste en **snake_case** (`merged_into_id`, `include_merged`, `target_id`) ; les entités sont en camelCase, la conversion est faite par `toResponse` / `getBody`.
- **Pas de SQL brut hors des repositories**, et seulement dans ces exceptions documentées : l'autocomplétion (jointure sur l'élément canonique), le report de références `cv_*` lors des fusions, la résolution d'une compétence par nom et la permutation des rangs d'un niveau (`unnest`). Tout le reste passe par le dépôt TypeORM / QueryBuilder.
- Les quatre référentiels (compétences, niveaux, certifications, secteurs) partagent un dépôt, un service, un contrôleur et un routeur génériques (`referential.*`) ; chaque domaine n'ajoute que sa spécification (colonnes, tri) et ses particularités.
- **Commentaires** : voir « Commentaires (TSDoc) » dans [../CLAUDE.md](../CLAUDE.md). `file-headers.test.ts` vérifie l'en-tête de chaque fichier et un `/** */` sur chaque export ; ESLint (`eslint-plugin-jsdoc`) impose la ligne sur chaque fonction, interface et classe.

## Erreurs de l'API

Toute erreur renvoie `{ code, message, details? }`. `code` est stable et c'est lui que le frontend utilise ; `message` est en français et n'est pas un contrat.

- Codes globaux : `VALIDATION_ERROR` (400), `BAD_REQUEST` (400), `PAYLOAD_TOO_LARGE` (413), `NOT_FOUND` (route inconnue, 404), `REFERENCED_OR_MISSING` (409), `INTERNAL_ERROR` (500).
- Codes par domaine, `<DOMAINE>_<NATURE>` (type `ErrorCode` dans `utils/api-error.ts`) : `*_NOT_FOUND` (404), `*_DUPLICATE`, `*_MERGED`, `*_ALREADY_MERGED`, `*_TARGET_MERGED`, `*_TARGET_INACTIVE` (409), `SKILL_DISABLED` (409). Domaines : `SKILL`, `SKILL_LEVEL`, `SECTOR`, `CERTIFICATION`.
- Les **services** lèvent une classe d'erreur par cas (`ReferentialNotFoundError`, `ReferentialTargetInactiveError`, `SkillDisabledError`… dans `services/referential.errors.ts`, indépendantes de HTTP) ; le **contrôleur** les traduit en `<DOMAINE>_<NATURE>` par `instanceof` (`toReferentialCode`, `withReferentialErrors`). Les **mappers** lèvent `ApiError` / `validationError` (400). Toute autre erreur remonte au `handleError` : les erreurs PostgreSQL attendues (`23503`, `23514`, `22P02`) sont traduites, le reste est journalisé et renvoie `INTERNAL_ERROR` sans détail.
- Une violation d'unicité (`23505`) est traduite en `*_DUPLICATE` par le dépôt (`translateUniqueViolation`).
- Ajouter un code : l'ajouter au type `ErrorCode`, documenter la route dans `config/openapi.ts`, ajouter un test.
- `/health` (servi en `/api/health` derrière le proxy) garde son propre format (`{ status: 'ok'|'degraded', db: 'connected'|'unavailable' }`), ce n'est pas une erreur d'API. Il n'expose jamais le message d'erreur de la base (endpoint public) : la cause est écrite dans les logs.

## Documentation OpenAPI

`GET /api-docs` (Swagger UI) et `GET /api-docs.json`. En production, nginx retirant `/api`, elles sont joignables en `/api/api-docs` ; en dev, directement sur `localhost:3000/api-docs`. La spec est **générée** dans `config/openapi.ts` à partir de la description des référentiels (leurs routeurs sont génériques) ; toute route ajoutée ou modifiée doit y figurer. Pas de `swagger-jsdoc` ni de blocs `@openapi` : ils dupliqueraient quatre fois les mêmes blocs.

## Commandes

```sh
npm run dev -w cvip_backend            # tsc --watch + node --watch
npm run build -w cvip_backend          # dist/
npm run lint -w cvip_backend
npm run typecheck -w cvip_backend
npm test -w cvip_backend               # requiert Docker (Postgres jetable par Testcontainers)
npm run test:coverage -w cvip_backend  # c8 : coverage/lcov.info
npm run migrate:create -w cvip_backend -- nom-de-la-migration
```

## Pièges

- `dev` et `start` chargent `../.env` avec `--env-file-if-exists` ; sans `DATABASE_URL`, `config/env.ts` lève une erreur au démarrage. Les tests n'ont pas besoin de `.env`.
- Si le port 5432 est déjà pris sur la machine, changer `POSTGRES_PORT` et le port de `DATABASE_URL` dans `.env` (pour `dev` seulement : les conteneurs de test prennent un port libre).
- Pas de CORS : le frontend appelle `/api` en même origine ; le proxy (Vite en dev, nginx en prod) **retire le préfixe `/api`** : les routes du backend n’en ont pas (`/health`, `/skills`…).
- La couverture est mesurée par `c8` sur `dist/` avec les source maps : les chemins du `lcov.info` sont ceux des `.ts` (`src/…`). Les motifs d'exclusion de `.c8rc.json` doivent être indépendants du dossier (`**/server.ts`), car c8 les applique au chemin compilé.
- Données de test : jamais de vraies personnes (voir le CLAUDE.md racine, dépôt public).
- Une migration mergée ne se modifie pas : on en ajoute une. Les entités sont à mettre à jour à la main avec elle.

## Écrire un test d'intégration

Utiliser `src/test-utils/integration.ts` (le fichier de test démarre sa propre base, donc pas de nettoyage) :

- `before` : `startTestDatabase()` (Postgres 17 jetable, migrations rejouées, pose `DATABASE_URL`, fournit `database.pool` pour les fixtures SQL), puis `startTestServer()` : il initialise TypeORM et démarre l'app. Les imports de l'app sont **dynamiques** dans le helper : `config/env.ts` lit `DATABASE_URL` à l'import, un `import` statique de l'app en haut du fichier échouerait.
- `server.api` : `get`, `post`, `patch`, `put`, `postRaw` ; renvoie `{ status, body }`.
- `after` : `server.close()` (ferme aussi TypeORM) puis `database.stop()`.
- Chaque fichier a sa base ; les fichiers tournent en parallèle, donc ne pas supposer d'état partagé.
- Tests unitaires de services, mappers et contrôleurs : faux dépôt injecté et faux `req`/`res` (`src/test-utils/http.ts`), sans Docker.
