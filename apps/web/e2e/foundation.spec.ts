import { expect, test } from '@playwright/test';

const blockedLevelUrl = '/ilhas/island-3/niveis/00000000-0000-4000-8000-000000000502/slides/00000000-0000-4000-8000-000000000704';

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

test('completes, unlocks, reviews and resumes the controlled journey', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Aprenda interatividade passo a passo.' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Iniciar sessão experimental' })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar sessão experimental' }).click();
  await expect(page.getByRole('heading', { name: 'Interatividade' })).toBeVisible();
  await expect.poll(async () => (await page.context().cookies()).some((cookie) => cookie.name === 'codelife_experimental_session')).toBe(true);

  await page.goto(blockedLevelUrl);
  await expect(page.getByRole('alert')).toContainText('Nível bloqueado');
  await page.goto('/ilhas/island-3');

  await finishLevel(page, ['Variáveis', 'Declarando valores', 'Valores na página'], 'Representação de uma variável JavaScript com o valor JavaScript.');
  await finishLevel(page, ['Eventos', 'Clique', 'Interação'], 'Representação de um botão acionado por clique.');
  await finishLevel(page, ['DOM', 'Selecionando elementos', 'Resultado'], 'Representação de uma mensagem atualizada no DOM.');

  await expect(page.getByText('Ilha concluída', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Sair' }).click();
  await expect(page.getByRole('button', { name: 'Iniciar sessão experimental' })).toBeVisible();
  await page.getByRole('button', { name: 'Iniciar sessão experimental' }).click();
  await expect(page.getByText('Ilha concluída', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Revisar etapa' }).first().click();
  await expect(page.getByText('Revisão', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Anterior' }).click();
  await expect(page.getByRole('heading', { name: 'Declarando valores' })).toBeVisible();
});
