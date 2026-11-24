# cvip_frontend/CLAUDE.md

Règles générales : [../CLAUDE.md](../CLAUDE.md). Ici : ce qui est propre au frontend.

## Stack

Node 26, Vue 3 en TypeScript strict (`<script setup lang="ts">`, `defineProps<{ … }>()`), Vite, Vue Router, Pinia, **SCSS** (`sass`), Vitest + `@vue/test-utils` + jsdom. Lint : oxlint puis ESLint (`eslint.config.ts`, `@vue/eslint-config-typescript`, `eslint-plugin-vue` `flat/recommended` + règles strictes, `@vitest/eslint-plugin`) ; Prettier est à la racine. Types vérifiés par `vue-tsc` (`npm run typecheck`, inclus dans `build`). Les `tsconfig` sont séparés (`app`, `node`, `vitest`), alias `@` = `src/`.

## Structure (`src/`)

| Dossier          | Rôle                                                                                                                   |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `api/core/`      | `http-client.ts` (`request<T>()`, seul point d'appel à `fetch`, préfixe `/api`) et `api-error.ts` (`ApiError`).        |
| `api/<domaine>/` | Un module par domaine (`health/health.api.ts`…) : fonctions typées qui appellent `request`.                            |
| `router/`        | `index.ts` et `route-name.ts` (enum `RouteName` : on ne référence jamais une route par une chaîne).                    |
| `views/`         | Une vue par route (`<Nom>View.vue`) : assemble des composants, charge ses données via un composable.                   |
| `components/`    | Composants réutilisables, sans appel API direct (données et événements par props/emits). Ex. `ApiStatus.vue`.          |
| `composables/`   | Logique réactive partagée (`useXxx`). Ex. `useLoadState(loader)` : `data`, `error`, `loading`, `load()`.               |
| `stores/`        | Stores Pinia en « setup stores » (`defineStore('nom', () => { … })`), un fichier par store. Vide pour l'instant.       |
| `services/`      | Logique métier pure côté client (validation de formulaire, calculs), sans Vue ni appel réseau. Vide pour l'instant.    |
| `utils/`         | Utilitaires purs. `utils/errors/error-message.ts` : `errorMessage(error)` donne le texte à afficher d'après le `code`. |
| `assets/`        | `main.scss` : variables de thème (`:root`), réinitialisation, focus visible.                                           |

Les tests sont à côté du code (`foo.ts` + `foo.spec.ts`). `stores/` et `services/` ne contiennent qu'un `.gitkeep` (Git ne suit pas les dossiers vides) : le supprimer au premier fichier réel. `HomeView` montre l'enchaînement attendu : `api/` (appel) → composable (`useLoadState`) → composant (`ApiStatus`) → `errorMessage` pour l'erreur.

- **Erreurs d'API** : toute réponse d'erreur du backend est `{ code, message, details? }` et devient une `ApiError(code, status, message, details)`. Le frontend **se base sur `code`, jamais sur le texte du message**. `ApiErrorCode` est le miroir du type `ErrorCode` du backend : le mettre à jour avec lui. `NETWORK_ERROR` (statut 0) est produit par le client quand le serveur ne répond pas.
- **Styles : SCSS uniquement**, jamais de CSS (`<style scoped lang="scss">`, fichiers `.scss`). Couleurs et espacements via les variables `:root`, tailles en `rem`.
- **Accessibilité** : lien d'évitement, repères (`header`, `main`), `<output>` pour les messages d'état (rôle `status` implicite, règle Sonar S6819), focus visible. Les écrans doivent respecter RGAA / WCAG 2.1 AA (contrôle axe prévu en E2E).
- **Commentaires** : voir « Commentaires (TSDoc) » dans [../CLAUDE.md](../CLAUDE.md). `file-headers.spec.ts` vérifie l'en-tête de chaque fichier ; ESLint (`eslint-plugin-jsdoc`) impose la ligne sur chaque fonction, interface et classe.

## Commandes

```sh
npm run dev -w cvip_frontend           # 5173, /api/* proxifié vers le backend
npm run build -w cvip_frontend         # vue-tsc puis vite build
npm test -w cvip_frontend
npm run lint -w cvip_frontend          # oxlint + ESLint, sans modifier les fichiers
npm run lint:fix -w cvip_frontend      # idem avec --fix
```

## Pièges

- Les tests passent par `cross-env NODE_OPTIONS=--no-experimental-webstorage` : sur Node 26, le `localStorage` natif masque celui de jsdom. Ne pas lancer `vitest` directement.
- `/api-docs` (Swagger du backend) : l'ouvrir directement sur `http://localhost:3000/api-docs`.
- Le rendu des CV partagés (pages publiques) devra être isolé de l'interface interne et respecter RGAA / WCAG 2.1 AA (cahier des charges, §5).
