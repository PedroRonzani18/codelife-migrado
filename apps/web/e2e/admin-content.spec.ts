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

test('USER cannot access the content administration route', async ({ page }) => {
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

  await page.goto('/admin/content');
  await expect(page).toHaveURL(/\/ilhas$/);
  await expect(page.getByRole('heading', { name: 'Ilhas de Aprendizado' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Conteúdo' })).not.toBeVisible();
});

test('ADMIN accesses content administration, creates island, level, uploads image slide, and publishes', async ({ page }) => {
  const login = await page.request.post(`${apiUrl}/auth/experimental-login`, { data: {} });
  expect(login.ok()).toBe(true);

  await page.goto('/admin/content');
  await expect(page.getByRole('link', { name: 'Conteúdo' })).toBeVisible();
  await expect(page.getByText('Estrutura de Conteúdo')).toBeVisible();

  // 1. Create a new Island
  await page.getByRole('button', { name: 'Nova Ilha' }).first().click();
  await page.locator('#title').fill('Ilha E2E Teste');
  await page.locator('#slug').fill('ilha-e2e-teste');
  await page.getByRole('button', { name: 'Criar Ilha' }).click();

  // Verify island created with draft badge in tree
  await expect(page.getByRole('button', { name: 'Ilha E2E Teste', exact: true })).toBeVisible();

  // 2. Create Level in this island
  await page.getByRole('button', { name: 'Adicionar nível na ilha Ilha E2E Teste' }).click();
  await page.locator('#level-title').fill('Nível 1 E2E');
  await page.getByRole('button', { name: 'Criar Nível' }).click();

  // Verify level created
  await expect(page.getByRole('button', { name: 'Nível 1 E2E', exact: true })).toBeVisible();

  // 3. Create Slide in this level
  await page.getByRole('button', { name: 'Adicionar slide no nível Nível 1 E2E' }).click();
  await page.locator('#slide-title').fill('Slide com Imagem E2E');

  // Change type to TextImage
  await page.locator('#slide-type').selectOption('TextImage');
  await page.locator('#image-text').fill('Texto de demonstração com imagem anexada.');
  await page.locator('#altText').fill('Imagem ilustrativa E2E.');

  // Create minimal 1x1 PNG file buffer
  const samplePngBuffer = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'base64',
  );

  await page.setInputFiles('#image-file', {
    name: 'test-e2e.png',
    mimeType: 'image/png',
    buffer: samplePngBuffer,
  });

  // Wait for upload to complete
  await expect(page.getByText('Imagem carregada:')).toBeVisible();

  // Submit slide
  await page.getByRole('button', { name: 'Criar Slide' }).click();
  await expect(page.getByRole('button', { name: '1. Slide com Imagem E2E' })).toBeVisible();

  // 4. Publish Level
  await page.getByRole('button', { name: 'Nível 1 E2E', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByRole('button', { name: 'Despublicar' })).toBeVisible();

  // 5. Publish Island
  await page.getByRole('button', { name: 'Ilha E2E Teste', exact: true }).click();
  await page.getByRole('button', { name: 'Publicar' }).click();
  await expect(page.getByRole('button', { name: 'Despublicar' })).toBeVisible();

  // 6. Responsive viewport check
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true);
});
