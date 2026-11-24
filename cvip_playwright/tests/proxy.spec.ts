import { expect, test } from './support/fixtures'

// The frontend is served by nginx (or Vite in dev), which strips the /api prefix before the backend.
test.describe('proxy /api', () => {
  test('GET /api/health atteint le backend', async ({ request }) => {
    const response = await request.get('/api/health')

    expect(response.status()).toBe(200)
    expect(await response.json()).toEqual({ status: 'ok', db: 'connected' })
  })

  test('une route d’API inconnue renvoie l’erreur structurée du backend', async ({ request }) => {
    const response = await request.get('/api/inconnue')

    expect(response.status()).toBe(404)
    expect(await response.json()).toMatchObject({ code: 'NOT_FOUND' })
  })

  test('une route du frontend retombe sur l’application (secours SPA)', async ({ page }) => {
    const response = await page.goto('/une/route/inconnue')

    expect(response?.status()).toBe(200)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Page introuvable')
    await page.getByRole('link', { name: "Retour à l'accueil" }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('CViP')
  })
})
