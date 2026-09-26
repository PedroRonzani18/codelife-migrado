import { expect, test } from '@playwright/test';

const apiUrl = process.env.WEB_E2E_API_URL ?? process.env.VITE_API_URL ?? 'http://localhost:3001';

test('authenticated student is redirected from root to /ilhas catalog and navigates to an island', async ({ page }) => {
  const login = await page.request.post(`${apiUrl}/auth/experimental-login`, { data: {} });
  expect(login.ok()).toBe(true);

  // Navigate to root
  await page.goto('/');

  // Expect redirect to /ilhas
  await expect(page).toHaveURL(/\/ilhas$/);
  await expect(page.getByRole('heading', { name: 'Ilhas de Aprendizado' })).toBeVisible();

  // Island card should be present for published fixture island
  await expect(page.getByRole('heading', { name: 'Interatividade' })).toBeVisible();
  await expect(page.getByText('Ilha 1')).toBeVisible();

  // Click to enter the island
  const actionButton = page.getByRole('link', { name: /(Começar|Continuar|Revisitar) ilha/i });
  await expect(actionButton).toBeVisible();
  await actionButton.click();

  // Should arrive at /ilhas/island-3
  await expect(page).toHaveURL(/\/ilhas\/island-3$/);
  await expect(page.getByRole('heading', { name: 'Interatividade' })).toBeVisible();

  // Back link should return to /ilhas
  await page.getByRole('link', { name: 'Todas as ilhas' }).click();
  await expect(page).toHaveURL(/\/ilhas$/);
});

test('handles blocked island direct access with recover link back to catalog', async ({ page }) => {
  const login = await page.request.post(`${apiUrl}/auth/experimental-login`, { data: {} });
  expect(login.ok()).toBe(true);

  // Intercept direct route to a blocked island
  await page.route(`${apiUrl}/learning/islands/ilha-bloqueada`, async (route) => {
    const reqOrigin = route.request().headers()['origin'] ?? '*';
    if (route.request().method() === 'OPTIONS') {
      await route.fulfill({
        status: 204,
        headers: {
          'access-control-allow-origin': reqOrigin,
          'access-control-allow-credentials': 'true',
          'access-control-allow-methods': 'GET, OPTIONS',
          'access-control-allow-headers': 'Content-Type, Cookie',
        },
      });
      return;
    }
    await route.fulfill({
      status: 403,
      contentType: 'application/json',
      headers: {
        'access-control-allow-origin': reqOrigin,
        'access-control-allow-credentials': 'true',
      },
      body: JSON.stringify({
        statusCode: 403,
        code: 'ISLAND_BLOCKED',
        message: 'Você precisa completar as ilhas anteriores antes de acessar esta.',
        requestId: 'test-blocked-req-1',
      }),
    });
  });

  await page.goto('/ilhas/ilha-bloqueada');
  await expect(page.getByText('Ilha bloqueada')).toBeVisible();
  await expect(page.getByText('A ilha está bloqueada. Conclua a ilha anterior antes de continuar.')).toBeVisible();

  // Recovery button takes back to /ilhas
  const backButton = page.getByRole('link', { name: 'Voltar ao catálogo de ilhas' });
  await expect(backButton).toBeVisible();
  await backButton.click();
  await expect(page).toHaveURL(/\/ilhas$/);
});

test('catalog view is responsive on mobile viewport', async ({ page }) => {
  const login = await page.request.post(`${apiUrl}/auth/experimental-login`, { data: {} });
  expect(login.ok()).toBe(true);

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/ilhas');
  await expect(page.getByRole('heading', { name: 'Ilhas de Aprendizado' })).toBeVisible();
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true);
});
