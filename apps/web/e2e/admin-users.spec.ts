import { createHmac } from 'node:crypto';
import { expect, test } from '@playwright/test';

const apiUrl = process.env.WEB_E2E_API_URL ?? process.env.VITE_API_URL ?? 'http://localhost:3001';
const authCookieName = process.env.AUTH_COOKIE_NAME ?? 'codelife_session';
const macro5E2eUserId = '00000000-0000-4000-8000-000000002201';

function encode(value: unknown): string {
  return Buffer.from(JSON.stringify(value)).toString('base64url');
}

function signFixtureSession(secret: string): string {
  const header = encode({ alg: 'HS256', typ: 'JWT' });
  const payload = encode({
    sub: macro5E2eUserId,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    iss: 'codelife-api',
    aud: 'codelife-web',
  });
  const signature = createHmac('sha256', secret).update(`${header}.${payload}`).digest('base64url');
  return `${header}.${payload}.${signature}`;
}

test('USER cannot access the user administration route', async ({ page }) => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    test.skip(true, 'requires the isolated Macro 5 fixture created by pnpm verify');
    return;
  }

  await page.context().addCookies([{
    name: authCookieName,
    value: signFixtureSession(secret),
    url: `${apiUrl}/`,
    httpOnly: true,
    sameSite: 'Lax',
  }]);

  await page.goto('/admin/users');
  await expect(page).toHaveURL(/\/ilhas\/island-3$/);
  await expect(page.getByRole('heading', { name: 'Interatividade' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Administração' })).not.toBeVisible();
});

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
