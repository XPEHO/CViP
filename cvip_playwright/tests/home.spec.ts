import { expect, expectNoA11yViolations, test } from './support/fixtures'

test.describe('page d’accueil', () => {
  test('affiche le titre, la langue et l’état de l’API', async ({ page }) => {
    await page.goto('/')

    await expect(page).toHaveTitle('CViP')
    await expect(page.locator('html')).toHaveAttribute('lang', 'fr')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('CViP')
    await expect(page.getByRole('status')).toHaveText('API et base de données disponibles.')
  })

  test('le lien d’évitement est le premier élément atteint au clavier', async ({ page }) => {
    await page.goto('/')

    await page.keyboard.press('Tab')

    const skipLink = page.getByRole('link', { name: 'Aller au contenu' })
    await expect(skipLink).toBeFocused()
    await expect(skipLink).toBeVisible()
  })

  test('le repère principal et l’en-tête sont présents', async ({ page }) => {
    await page.goto('/')

    await expect(page.getByRole('banner')).toBeVisible()
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page.getByRole('link', { name: 'CViP' })).toHaveAttribute('href', '/')
  })

  test('signale une base de données injoignable', async ({ page }) => {
    await page.route('**/api/health', (route) =>
      route.fulfill({ status: 503, json: { status: 'degraded', db: 'unavailable' } }),
    )

    await page.goto('/')

    await expect(page.getByRole('status')).toHaveText(
      'API disponible, base de données injoignable.',
    )
    await expectNoA11yViolations(page)
  })

  test('signale une API injoignable', async ({ page }) => {
    await page.route('**/api/health', (route) => route.abort())

    await page.goto('/')

    await expect(page.getByRole('status')).toHaveText('Le serveur est injoignable.')
    await expectNoA11yViolations(page)
  })
})
