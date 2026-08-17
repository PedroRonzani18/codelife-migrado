import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, SlideType } from '@prisma/client';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL is required to seed the experimental fixture');

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });

const levels = [
  {
    key: 'island-3-l1',
    title: 'Variaveis JS',
    slides: [
      ['island-3-l1-s1', 'Variáveis', SlideType.TextText, 'Variáveis permitem armazenar valores para uso posterior.'],
      ['island-3-l1-s2', 'Declarando valores', SlideType.TextCode, 'const linguagem = "JavaScript";'],
      ['island-3-l1-s3', 'Valores na página', SlideType.TextImage, 'Exemplo visual controlado de valor exibido na página.'],
    ],
  },
  {
    key: 'island-3-l2',
    title: 'Eventos de Clique',
    slides: [
      ['island-3-l2-s1', 'Eventos', SlideType.TextText, 'Eventos permitem responder às ações de uma pessoa usuária.'],
      ['island-3-l2-s2', 'Clique', SlideType.TextCode, 'button.addEventListener("click", () => console.log("clicado"));'],
      ['island-3-l2-s3', 'Interação', SlideType.TextImage, 'Exemplo visual controlado de uma interação por clique.'],
    ],
  },
  {
    key: 'island-3-l3',
    title: 'Atualizando o DOM',
    slides: [
      ['island-3-l3-s1', 'DOM', SlideType.TextText, 'O DOM representa a estrutura do documento no navegador.'],
      ['island-3-l3-s2', 'Selecionando elementos', SlideType.TextCode, 'document.querySelector("#mensagem")?.textContent = "Atualizado";'],
      ['island-3-l3-s3', 'Resultado', SlideType.TextImage, 'Exemplo visual controlado de conteúdo atualizado no DOM.'],
    ],
  },
] as const;

async function seed() {
  await prisma.user.upsert({
    where: { key: 'aluna-demo' },
    update: { username: 'aluna.demo', displayName: 'Aluna Demo' },
    create: { key: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo' },
  });
  const island = await prisma.island.upsert({
    where: { key: 'island-3' },
    update: { title: 'Interatividade', sortOrder: 0 },
    create: { key: 'island-3', title: 'Interatividade', sortOrder: 0 },
  });
  for (const [levelOrder, definition] of levels.entries()) {
    const level = await prisma.level.upsert({
      where: { key: definition.key },
      update: { islandId: island.id, title: definition.title, sortOrder: levelOrder },
      create: { key: definition.key, islandId: island.id, title: definition.title, sortOrder: levelOrder },
    });
    for (const [slideOrder, [key, title, type, content]] of definition.slides.entries()) {
      await prisma.slide.upsert({
        where: { key },
        update: { levelId: level.id, title, type, content, sortOrder: slideOrder },
        create: { key, levelId: level.id, title, type, content, sortOrder: slideOrder },
      });
    }
  }
  const [islands, levelCount, slideCount] = await Promise.all([prisma.island.count(), prisma.level.count(), prisma.slide.count()]);
  if (islands !== 1 || levelCount !== 3 || slideCount !== 9) {
    throw new Error(`Fixture integrity failed: expected 1/3/9, received ${islands}/${levelCount}/${slideCount}`);
  }
}

seed().finally(() => prisma.$disconnect());
