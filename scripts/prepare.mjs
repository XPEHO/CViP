// `prepare` script (run by npm install / npm ci): installs the Git hooks (lefthook).
// Skipped outside a developer machine: CI, Docker image (no .git) or missing dev dependencies.
import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'

if (process.env.CI || !existsSync('.git')) process.exit(0)

try {
  // Developer tool run by `npm install`: `npx` is resolved from the developer's own PATH.
  execSync('npx --no-install lefthook install', { stdio: 'inherit' }) // NOSONAR S4036
} catch {
  console.warn('Hooks Git non installés (lefthook indisponible).')
}
