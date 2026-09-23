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
