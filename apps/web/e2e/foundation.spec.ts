import { expect, test } from '@playwright/test';

test('shows the controlled experimental-login boundary', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Fundação modernizada' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sessão experimental' })).toBeVisible();
});
