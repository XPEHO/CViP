// Shared fixtures: `test` checks the accessibility (WCAG 2.1 AA) of the open page at the end of each test.
import { expect, test as base, type Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// WCAG levels targeted by RGAA 4: A and AA, versions 2.0 and 2.1.
const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

/** Fails if axe-core detects a violation in the current state of the page. */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const { violations } = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const report = violations
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}) : ${violation.help}\n` +
        violation.nodes.map((node) => `  - ${node.target.join(' ')}`).join('\n'),
    )
    .join('\n')
  expect(violations, `Violations d'accessibilité :\n${report}`).toEqual([])
}

// The fixture is automatic: no page can escape it. For an intermediate state of a test
// (open modal, displayed error), call `expectNoA11yViolations(page)` at that point.
export const test = base.extend<{ accessibility: void }>({
  accessibility: [
    async ({ page }, use) => {
      await use()
      if (page.url() !== 'about:blank') await expectNoA11yViolations(page)
    },
    { auto: true },
  ],
})

export { expect }
