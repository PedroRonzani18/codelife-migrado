import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient, SlideType } from '@prisma/client';
import { config } from 'dotenv';

export const islandFixture = {
  key: 'island-3',
  title: 'Interatividade',
  sortOrder: 0,
  levels: [
    {
      key: 'island-3-l1',
      title: 'Variaveis JS',
      sortOrder: 0,
      slides: [
        { key: 'island-3-l1-s1', title: 'Variáveis', sortOrder: 0, type: SlideType.TextText, content: 'Variáveis permitem armazenar valores para uso posterior.' },
        { key: 'island-3-l1-s2', title: 'Declarando valores', sortOrder: 1, type: SlideType.TextCode, content: 'const linguagem = "JavaScript";' },
        { key: 'island-3-l1-s3', title: 'Valores na página', sortOrder: 2, type: SlideType.TextImage, content: 'Exemplo visual controlado de valor exibido na página.' },
      ],
    },
    {
      key: 'island-3-l2',
      title: 'Eventos de Clique',
      sortOrder: 1,
      slides: [
        { key: 'island-3-l2-s1', title: 'Eventos', sortOrder: 0, type: SlideType.TextText, content: 'Eventos permitem responder às ações de uma pessoa usuária.' },
        { key: 'island-3-l2-s2', title: 'Clique', sortOrder: 1, type: SlideType.TextCode, content: 'button.addEventListener("click", () => console.log("clicado"));' },
        { key: 'island-3-l2-s3', title: 'Interação', sortOrder: 2, type: SlideType.TextImage, content: 'Exemplo visual controlado de uma interação por clique.' },
      ],
    },
    {
      key: 'island-3-l3',
      title: 'Atualizando o DOM',
      sortOrder: 2,
      slides: [
        { key: 'island-3-l3-s1', title: 'DOM', sortOrder: 0, type: SlideType.TextText, content: 'O DOM representa a estrutura do documento no navegador.' },
        { key: 'island-3-l3-s2', title: 'Selecionando elementos', sortOrder: 1, type: SlideType.TextCode, content: 'document.querySelector("#mensagem")?.textContent = "Atualizado";' },
        { key: 'island-3-l3-s3', title: 'Resultado', sortOrder: 2, type: SlideType.TextImage, content: 'Exemplo visual controlado de conteúdo atualizado no DOM.' },
      ],
    },
  ],
} as const;

export type FixtureSnapshot = {
  id: string;
  key: string;
  title: string;
  sortOrder: number;
  levels: Array<{
    id: string;
    key: string;
    islandId: string;
    title: string;
    sortOrder: number;
    progress: Array<{ id: string }>;
    slides: Array<{
      key: string;
      levelId: string;
      title: string;
      sortOrder: number;
      type: SlideType;
      content: string;
    }>;
  }>;
} | null;

function assertFixture(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Fixture integrity failed: ${message}`);
}

export function assertFixtureIntegrity(snapshot: FixtureSnapshot): void {
  assertFixture(snapshot, `${islandFixture.key} was not found`);
  assertFixture(snapshot.key === islandFixture.key, `expected island key ${islandFixture.key}`);
  assertFixture(snapshot.title === islandFixture.title, `unexpected title for ${islandFixture.key}`);
  assertFixture(snapshot.sortOrder === islandFixture.sortOrder, `unexpected order for ${islandFixture.key}`);
  assertFixture(snapshot.levels.length === islandFixture.levels.length, `expected exactly ${islandFixture.levels.length} levels under ${islandFixture.key}`);

  for (const [levelIndex, expectedLevel] of islandFixture.levels.entries()) {
    const level = snapshot.levels[levelIndex];
    assertFixture(level, `missing level ${expectedLevel.key}`);
    assertFixture(level.key === expectedLevel.key, `expected level ${expectedLevel.key} at order ${levelIndex}`);
    assertFixture(level.islandId === snapshot.id, `level ${level.key} references another island`);
    assertFixture(level.title === expectedLevel.title, `unexpected title for level ${level.key}`);
    assertFixture(level.sortOrder === expectedLevel.sortOrder, `unexpected order for level ${level.key}`);
    assertFixture(level.progress.length === 0, `expected zero progress records for level ${level.key}`);
    assertFixture(level.slides.length === expectedLevel.slides.length, `expected exactly ${expectedLevel.slides.length} slides under ${level.key}`);

    for (const [slideIndex, expectedSlide] of expectedLevel.slides.entries()) {
      const slide = level.slides[slideIndex];
      assertFixture(slide, `missing slide ${expectedSlide.key}`);
      assertFixture(slide.key === expectedSlide.key, `expected slide ${expectedSlide.key} at order ${slideIndex}`);
      assertFixture(slide.levelId === level.id, `slide ${slide.key} references another level`);
      assertFixture(slide.title === expectedSlide.title, `unexpected title for slide ${slide.key}`);
      assertFixture(slide.sortOrder === expectedSlide.sortOrder, `unexpected order for slide ${slide.key}`);
      assertFixture(slide.type === expectedSlide.type, `unexpected type for slide ${slide.key}`);
      assertFixture(slide.content === expectedSlide.content, `unexpected content for slide ${slide.key}`);
    }
  }
}

async function readFixtureSnapshot(transaction: Prisma.TransactionClient): Promise<FixtureSnapshot> {
  return transaction.island.findUnique({
    where: { key: islandFixture.key },
    select: {
      id: true,
      key: true,
      title: true,
      sortOrder: true,
      levels: {
        orderBy: { sortOrder: 'asc' },
        select: {
          id: true,
          key: true,
          islandId: true,
          title: true,
          sortOrder: true,
          progress: { select: { id: true } },
          slides: {
            orderBy: { sortOrder: 'asc' },
            select: { key: true, levelId: true, title: true, sortOrder: true, type: true, content: true },
          },
        },
      },
    },
  });
}

export async function seedExperimentalFixture(prisma: PrismaClient): Promise<void> {
  await prisma.$transaction(async (transaction) => {
    await transaction.user.upsert({
      where: { key: 'aluna-demo' },
      update: { username: 'aluna.demo', displayName: 'Aluna Demo' },
      create: { key: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo' },
    });

    const island = await transaction.island.upsert({
      where: { key: islandFixture.key },
      update: { title: islandFixture.title, sortOrder: islandFixture.sortOrder },
      create: { key: islandFixture.key, title: islandFixture.title, sortOrder: islandFixture.sortOrder },
    });

    for (const definition of islandFixture.levels) {
      const level = await transaction.level.upsert({
        where: { key: definition.key },
        update: { islandId: island.id, title: definition.title, sortOrder: definition.sortOrder },
        create: { key: definition.key, islandId: island.id, title: definition.title, sortOrder: definition.sortOrder },
      });

      for (const slide of definition.slides) {
        await transaction.slide.upsert({
          where: { key: slide.key },
          update: { levelId: level.id, title: slide.title, type: slide.type, content: slide.content, sortOrder: slide.sortOrder },
          create: { key: slide.key, levelId: level.id, title: slide.title, type: slide.type, content: slide.content, sortOrder: slide.sortOrder },
        });
      }
    }

    assertFixtureIntegrity(await readFixtureSnapshot(transaction));
  });
}

async function runSeed(): Promise<void> {
  if (!process.env.DATABASE_URL) config({ path: '../../.env', quiet: true });
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required to seed the experimental fixture');

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try {
    await seedExperimentalFixture(prisma);
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  void runSeed().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Experimental fixture seed failed');
    process.exitCode = 1;
  });
}
