import { expect, test } from '@playwright/test';

const apiUrl = process.env.WEB_E2E_API_URL ?? process.env.VITE_API_URL ?? 'http://localhost:3001';

test('ADMIN accesses the user administration route and sees the persisted list', async ({ page }) => {
  const login = await page.request.post(`${apiUrl}/auth/experimental-login`, { data: {} });
  expect(login.ok()).toBe(true);

  await page.goto('/admin/users');
  await expect(page.getByRole('link', { name: 'Administração' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Administração de usuários' })).toBeVisible();
  await expect(page.getByRole('table')).toContainText('Aluna Demo');
  await expect(page.getByRole('button', { name: /Rebaixamento indisponível/ })).toBeDisabled();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true);
});
