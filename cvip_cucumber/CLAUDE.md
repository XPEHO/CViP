# cvip_cucumber/CLAUDE.md

Règles générales : [../CLAUDE.md](../CLAUDE.md). Ici : les tests E2E de l'**API** (boîte noire, par HTTP).

## Principe

Cucumber (`@cucumber/cucumber`) appelle le backend **directement** (`API_URL`, `http://localhost:3000` par défaut, donc sans préfixe `/api`). Le Gherkin est en **français** (`# language: fr`, `Fonctionnalité`, `Scénario`, `Soit`/`Quand`/`Alors`). Les étapes sont en TypeScript, exécuté nativement par Node 26 (pas de compilation) ; importer avec l'extension `.ts`. `npm run typecheck -w cvip_cucumber` vérifie les types et `npm run lint -w cvip_cucumber` lance ESLint (règles de commentaires incluses).

```sh
docker compose up -d --build --wait        # pile complète (voir le CLAUDE.md racine)
npm run e2e -w cvip_cucumber               # rapport : report/cucumber_report.html
npm run e2e:ci -w cvip_cucumber            # + JUnit (report/cucumber_junit.xml)
```

`API_URL` pointe ailleurs si le backend n'est pas sur le port 3000 (ex. `API_URL=http://localhost:3200`).

## Écrire un scénario

- `features/<domaine>/*.feature` et `features/step_definitions/*.steps.ts` ; `features/support/` : `http.ts` (client), `world.ts` (contexte), `hooks.ts` (attente de `/health`).
- Étapes génériques dans `common.steps.ts` : requêtes (`j’envoie une requête POST sur "/skills" avec le corps :`), création en préparation (`l'élément "nom" est créé sur "/skills" avec le corps :`), vérifications (statut, `l’erreur "CODE" avec le statut N`, champs, listes). Ajouter une étape propre à un domaine dans son propre fichier `*.steps.ts`.
- Marqueurs remplacés dans les chemins, corps et valeurs attendues : `{tag}` (suffixe unique du scénario), `{id:nom}` (identifiant d'un élément créé), `{rank}` / `{rank+1}` (rangs élevés pour les niveaux).
- **Pas de nettoyage** : les référentiels n'ont pas de suppression. Chaque scénario isole ses données avec `{tag}` et ne suppose rien de l'état de la base ; la base est éphémère en CI.
- Vérifier le **code d'erreur** (`SKILL_DUPLICATE`…), pas le texte du message.
- Données : jamais de vraies personnes (dépôt public).
