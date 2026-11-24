// Pre-commit hook: scans the staged changes for secrets with gitleaks.
// Never blocks when gitleaks is not installed (CI scans the whole history anyway).
import { spawnSync } from 'node:child_process'

// Developer tool run from a Git hook: `gitleaks` is resolved from the developer's own PATH.
const args = ['git', '--pre-commit', '--staged', '--redact']
const result = spawnSync('gitleaks', args, { stdio: 'inherit' }) // NOSONAR S4036

if (result.error?.code === 'ENOENT') {
  console.warn('gitleaks not installed: local secret scan skipped (CI scans the history).')
  process.exit(0)
}

process.exit(result.status ?? 1)
