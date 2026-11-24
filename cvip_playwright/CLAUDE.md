# cvip_playwright/CLAUDE.md

Règles générales : [../CLAUDE.md](../CLAUDE.md). Ici : les tests E2E de l'**interface** et le contrôle d'**accessibilité**.

## Principe

Playwright pilote le frontend (`BASE_URL`, `http://localhost:5173` par défaut ; `http://localhost:8080` pour la pile Docker/nginx). Deux projets : `desktop-chrome` et `mobile-safari` (iPhone 14, WebKit). `npm run typecheck -w cvip_playwright` vérifie les types et `npm run lint -w cvip_playwright` lance ESLint (règles de commentaires, pas de `networkidle` ni de `waitForTimeout`).

```sh
docker compose up -d --build --wait                                   # pile complète
npm run install:browsers -w cvip_playwright                           # une fois (Chromium + WebKit)
BASE_URL=http://localhost:8080 npm run e2e -w cvip_playwright
```

Sans télécharger Chromium : `PW_CHANNEL=chrome` utilise le Chrome installé (projet `desktop-chrome` seulement : `-- --project=desktop-chrome`). Rapports : `report/html` (`npm run report`) et `report/junit.xml`.

## Accessibilité (RGAA / WCAG 2.1 AA)

- **Importer `test` et `expect` depuis `tests/support/fixtures.ts`**, jamais depuis `@playwright/test` : la fixture `accessibility` est automatique et lance axe-core (tags `wcag2a`, `wcag2aa`, `wcag21a`, `wcag21aa`) sur la page ouverte à la fin de **chaque** test. Aucune page n'y échappe.
- Pour un état intermédiaire (modale ouverte, message d'erreur affiché, formulaire invalide), appeler `expectNoA11yViolations(page)` à ce moment.
- axe-core ne détecte qu'une partie des critères du RGAA. À contrôler à la main avant toute page destinée aux clients (cahier des charges, §5) : navigation au clavier complète et ordre de tabulation, focus visible, contrastes réels, zoom 200 % et reflow à 320 px, lecteur d'écran (NVDA ou VoiceOver), titres et repères cohérents, formulaires (étiquettes, erreurs annoncées).
- Locators par rôle et nom accessible (`getByRole`, `getByLabel`) : un locator qui échoue signale souvent un problème d'accessibilité.

## Écrire un test

- `tests/<page>.spec.ts`, tests indépendants et parallèles. Les erreurs réseau se simulent avec `page.route(...)`.
- Pas de données réelles de consultant (dépôt public).
- Toute nouvelle page ou nouvel état d'écran : un test qui l'ouvre (donc contrôlé par axe) et vérifie son contenu.
