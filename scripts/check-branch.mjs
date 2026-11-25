// Checks the branch name: type/CVIP-nn (see CLAUDE.md, Git section).
// Usage: node scripts/check-branch.mjs [branch-name] (default: current branch).
import { execFileSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const BRANCH_RE = /^(feat|fix|chore|docs|test|refactor|style|hotfix|release)\/CVIP-\d+$/

export const isValidBranch = (name) =>
  name === 'main' || name === 'HEAD' || name.startsWith('dependabot/') || BRANCH_RE.test(name)

const main = () => {
  const name =
    process.argv[2] ??
    // Developer tool run from a Git hook: `git` is resolved from the developer's own PATH.
    execFileSync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], { encoding: 'utf8' }).trim() // NOSONAR S4036
  if (isValidBranch(name)) return
  console.error(`Nom de branche invalide : « ${name} »`)
  console.error('Attendu : type/CVIP-nn (ex. feat/CVIP-21)')
  console.error('Types : feat, fix, chore, docs, test, refactor, style, hotfix, release')
  process.exit(1)
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main()
