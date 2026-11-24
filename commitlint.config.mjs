// Format: type(CVIP-nn): subject, or type(exception): subject for what has no ticket
// (deps, repo, docs, ci, docker) — see CLAUDE.md, Git section.
const EXCEPTION_SCOPES = ['deps', 'repo', 'docs', 'ci', 'docker']
const TICKET_RE = /^CVIP-\d+$/

export default {
  extends: ['@commitlint/config-conventional'],
  parserPreset: {
    parserOpts: {
      headerPattern: /^(\w+)\(([\w-]+)\): (.+)$/,
      headerCorrespondence: ['type', 'scope', 'subject'],
    },
  },
  // Dependabot (prefixes defined in .github/dependabot.yml): long titles, not checked.
  ignores: [(message) => /^chore\((deps|docker|ci)\)/.test(message)],
  plugins: [
    {
      rules: {
        'scope-ticket-or-exception': ({ scope }) => [
          Boolean(scope) && (TICKET_RE.test(scope) || EXCEPTION_SCOPES.includes(scope)),
          `le message doit suivre « type(CVIP-nn): sujet » ou « type(${EXCEPTION_SCOPES.join('|')}): sujet »`,
        ],
      },
    },
  ],
  rules: {
    'scope-ticket-or-exception': [2, 'always'],
    'scope-case': [0],
    'subject-case': [0],
    'header-max-length': [2, 'always', 100],
  },
}
