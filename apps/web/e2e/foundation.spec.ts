import { expect, test } from '@playwright/test';

const blockedLevelUrl = '/ilhas/island-3/niveis/00000000-0000-4000-8000-000000000502/slides/00000000-0000-4000-8000-000000000704';
const firstLevelSecondSlideUrl = '/ilhas/island-3/niveis/00000000-0000-4000-8000-000000000501/slides/00000000-0000-4000-8000-000000000702';
const apiUrl = process.env.WEB_E2E_API_URL ?? process.env.VITE_API_URL ?? 'http://localhost:3001';

async function captureEvidence(page: import('@playwright/test').Page, testInfo: import('@playwright/test').TestInfo, name: string) {
  const path = testInfo.outputPath(`${name}.png`);
  await page.screenshot({ path, fullPage: true });
  await testInfo.attach(name, { path, contentType: 'image/png' });
}

async function finishLevel(page: import('@playwright/test').Page, expectedSlides: [string, string, string], imageAlt: string) {
  await page.getByRole('button', { name: 'Começar etapa' }).click();
  await expect(page.getByRole('heading', { name: expectedSlides[0] })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo' }).click();
  await expect(page.getByRole('heading', { name: expectedSlides[1] })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo' }).click();
  await expect(page.getByRole('heading', { name: expectedSlides[2] })).toBeVisible();
  const image = page.getByRole('img', { name: imageAlt });
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await page.getByRole('button', { name: 'Concluir nível' }).click();
  await expect(page.getByText('Conclusão registrada. Escolha a próxima ação abaixo.')).toBeVisible();
  await page.getByRole('link', { name: 'Voltar à ilha' }).click();
}

async function startFixtureSession(page: import('@playwright/test').Page) {
  const response = await page.request.post(`${apiUrl}/auth/experimental-login`, { data: {} });
  expect(response.ok()).toBe(true);
}

test('starts Google login through the backend redirect boundary', async ({ page }) => {
  let requested = false;
  await page.route(`${apiUrl}/auth/google**`, async (route) => {
    requested = true;
    await route.fulfill({
      status: 200,
      contentType: 'text/html',
      body: '<!doctype html><title>Google auth stub</title>',
    });
  });

  await page.goto('/');
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
  await page.getByRole('button', { name: 'Entrar com Google' }).click();
  await expect.poll(() => requested).toBe(true);
});

test('completes, unlocks, reviews and resumes the controlled journey', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Aprenda interatividade passo a passo.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
  await captureEvidence(page, testInfo, 'tcc-15-login-desktop');
  await startFixtureSession(page);
  await page.goto('/ilhas/island-3');
  await expect(page.getByRole('heading', { name: 'Interatividade' })).toBeVisible();
  await expect.poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === 'codelife_experimental_session')).toBe(true);

  await page.goto(blockedLevelUrl);
  await expect(page.getByRole('alert')).toContainText('Nível bloqueado');
  await page.goto('/ilhas/island-3');

  await page.getByRole('button', { name: 'Começar etapa' }).click();
  await expect(page.getByRole('heading', { name: 'Variáveis' })).toBeVisible();
  await page.getByRole('button', { name: 'Próximo' }).press('Enter');
  await expect(page.getByRole('heading', { name: 'Declarando valores' })).toBeVisible();

  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
  await startFixtureSession(page);
  await page.goto(firstLevelSecondSlideUrl);
  await expect(page.getByRole('heading', { name: 'Declarando valores' })).toBeVisible();

  await page.getByRole('button', { name: 'Próximo' }).click();
  await expect(page.getByRole('heading', { name: 'Valores na página' })).toBeVisible();
  const firstLevelImage = page.getByRole('img', { name: 'Representação de uma variável JavaScript com o valor JavaScript.' });
  await expect(firstLevelImage).toBeVisible();
  await expect.poll(() => firstLevelImage.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).resolves.toBe(true);
  await captureEvidence(page, testInfo, 'tcc-15-reader-mobile');
  await page.getByRole('button', { name: 'Concluir nível' }).click();
  await expect(page.getByText('Conclusão registrada. Escolha a próxima ação abaixo.')).toBeVisible();
  await page.getByRole('link', { name: 'Voltar à ilha' }).click();

  await finishLevel(page, ['Eventos', 'Clique', 'Interação'], 'Representação de um botão acionado por clique.');
  await finishLevel(page, ['DOM', 'Selecionando elementos', 'Resultado'], 'Representação de uma mensagem atualizada no DOM.');

  await expect(page.getByText('Ilha concluída', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Entrar com Google' })).toBeVisible();
  await startFixtureSession(page);
  await page.goto('/ilhas/island-3');
  await expect(page.getByText('Ilha concluída', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Revisar etapa' }).first().click();
  await expect(page.getByText('Revisão', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Anterior' }).click();
  await expect(page.getByRole('heading', { name: 'Declarando valores' })).toBeVisible();
});
