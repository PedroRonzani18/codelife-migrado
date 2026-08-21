import { access } from 'node:fs/promises';
import { normalize, resolve, sep } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient, SlideType } from '@prisma/client';
import { config } from 'dotenv';

const fixtureAssetRoot = resolve(__dirname, '../assets');

export const fixtureIds = {
  user: '00000000-0000-4000-8000-000000000001',
  trail: '00000000-0000-4000-8000-000000000201',
  island: '00000000-0000-4000-8000-000000000301',
  trailIsland: '00000000-0000-4000-8000-000000000401',
  levels: [
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000502',
    '00000000-0000-4000-8000-000000000503',
  ],
  islandLevels: [
    '00000000-0000-4000-8000-000000000601',
    '00000000-0000-4000-8000-000000000602',
    '00000000-0000-4000-8000-000000000603',
  ],
  slides: [
    '00000000-0000-4000-8000-000000000701',
    '00000000-0000-4000-8000-000000000702',
    '00000000-0000-4000-8000-000000000703',
    '00000000-0000-4000-8000-000000000704',
    '00000000-0000-4000-8000-000000000705',
    '00000000-0000-4000-8000-000000000706',
    '00000000-0000-4000-8000-000000000707',
    '00000000-0000-4000-8000-000000000708',
    '00000000-0000-4000-8000-000000000709',
  ],
  levelSlides: [
    '00000000-0000-4000-8000-000000000801',
    '00000000-0000-4000-8000-000000000802',
    '00000000-0000-4000-8000-000000000803',
    '00000000-0000-4000-8000-000000000804',
    '00000000-0000-4000-8000-000000000805',
    '00000000-0000-4000-8000-000000000806',
    '00000000-0000-4000-8000-000000000807',
    '00000000-0000-4000-8000-000000000808',
    '00000000-0000-4000-8000-000000000809',
  ],
  assets: [
    '00000000-0000-4000-8000-000000000901',
    '00000000-0000-4000-8000-000000000902',
    '00000000-0000-4000-8000-000000000903',
  ],
} as const;

const localAssets = [
  { id: fixtureIds.assets[0], objectKey: 'learning/island-3/variables.svg', mimeType: 'image/svg+xml', width: 640, height: 360 },
  { id: fixtureIds.assets[1], objectKey: 'learning/island-3/events.svg', mimeType: 'image/svg+xml', width: 640, height: 360 },
  { id: fixtureIds.assets[2], objectKey: 'learning/island-3/dom.svg', mimeType: 'image/svg+xml', width: 640, height: 360 },
] as const;

export const islandFixture = {
  slug: 'island-3',
  title: 'Interatividade',
  trail: { slug: 'codelife', title: 'CodeLife' },
  levels: [
    {
      title: 'Variáveis JS',
      slides: [
        { title: 'Variáveis', type: SlideType.TextText, primaryText: 'Variáveis permitem armazenar valores para uso posterior.', secondaryText: 'Use nomes claros para tornar o código mais compreensível.' },
        { title: 'Declarando valores', type: SlideType.TextCode, text: 'Uma declaração associa um nome a um valor.', code: 'const linguagem = "JavaScript";', language: 'javascript' },
        { title: 'Valores na página', type: SlideType.TextImage, text: 'Valores podem ser exibidos na página para tornar o resultado observável.', mediaAssetId: fixtureIds.assets[0], altText: 'Representação de uma variável JavaScript com o valor JavaScript.' },
      ],
    },
    {
      title: 'Eventos de Clique',
      slides: [
        { title: 'Eventos', type: SlideType.TextText, primaryText: 'Eventos permitem responder às ações de uma pessoa usuária.', secondaryText: 'O clique é um evento comum em interfaces web.' },
        { title: 'Clique', type: SlideType.TextCode, text: 'Um listener registra o que deve acontecer após o clique.', code: 'button.addEventListener("click", () => console.log("clicado"));', language: 'javascript' },
        { title: 'Interação', type: SlideType.TextImage, text: 'Uma interação de clique pode atualizar a interface de forma controlada.', mediaAssetId: fixtureIds.assets[1], altText: 'Representação de um botão acionado por clique.' },
      ],
    },
    {
      title: 'Atualizando o DOM',
      slides: [
        { title: 'DOM', type: SlideType.TextText, primaryText: 'O DOM representa a estrutura do documento no navegador.', secondaryText: 'Elementos podem ser selecionados e atualizados pela aplicação.' },
        { title: 'Selecionando elementos', type: SlideType.TextCode, text: 'Uma seleção localiza um elemento antes da atualização.', code: 'document.querySelector("#mensagem")?.textContent = "Atualizado";', language: 'javascript' },
        { title: 'Resultado', type: SlideType.TextImage, text: 'A alteração do DOM torna o conteúdo atualizado visível na página.', mediaAssetId: fixtureIds.assets[2], altText: 'Representação de uma mensagem atualizada no DOM.' },
      ],
    },
  ],
} as const;

type FixtureSlide = (typeof islandFixture.levels)[number]['slides'][number];

type FixtureSlideSnapshot = {
  id: string;
  title: string;
  type: SlideType;
  textText: { primaryText: string; secondaryText: string | null } | null;
  textImage: { text: string; altText: string; mediaAsset: { id: string; objectKey: string; mimeType: string } } | null;
  textCode: { text: string; code: string; language: string } | null;
};

export type FixtureSnapshot = {
  id: string;
  slug: string;
  title: string;
  islands: Array<{
    id: string;
    position: number;
    island: {
      id: string;
      slug: string;
      title: string;
      levels: Array<{
        id: string;
        position: number;
        level: {
          id: string;
          title: string;
          slides: Array<{
            id: string;
            position: number;
            slide: FixtureSlideSnapshot;
          }>;
        };
      }>;
    };
  }>;
} | null;

function assertFixture(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Fixture integrity failed: ${message}`);
}

function assertExactSubtype(slide: FixtureSlideSnapshot, definition: FixtureSlide): void {
  const subtypeCount = [slide.textText, slide.textImage, slide.textCode].filter(Boolean).length;
  assertFixture(subtypeCount === 1, `slide ${slide.id} must have exactly one subtype`);
  assertFixture(slide.type === definition.type, `unexpected type for slide ${slide.id}`);

  if (definition.type === SlideType.TextText) {
    assertFixture(slide.textText?.primaryText === definition.primaryText, `unexpected primary text for slide ${slide.id}`);
    assertFixture(slide.textText?.secondaryText === definition.secondaryText, `unexpected secondary text for slide ${slide.id}`);
    return;
  }

  if (definition.type === SlideType.TextImage) {
    assertFixture(slide.textImage?.text === definition.text, `unexpected text for image slide ${slide.id}`);
    assertFixture(slide.textImage?.altText === definition.altText, `unexpected alt text for image slide ${slide.id}`);
    assertFixture(slide.textImage?.mediaAsset.id === definition.mediaAssetId, `unexpected media asset for slide ${slide.id}`);
    return;
  }

  assertFixture(slide.textCode?.text === definition.text, `unexpected text for code slide ${slide.id}`);
  assertFixture(slide.textCode?.code === definition.code, `unexpected code for slide ${slide.id}`);
  assertFixture(slide.textCode?.language === definition.language, `unexpected language for slide ${slide.id}`);
}

export function assertFixtureIntegrity(snapshot: FixtureSnapshot): void {
  assertFixture(snapshot, `${islandFixture.trail.slug} trail was not found`);
  assertFixture(snapshot.id === fixtureIds.trail, 'unexpected trail identifier');
  assertFixture(snapshot.slug === islandFixture.trail.slug, 'unexpected trail slug');
  assertFixture(snapshot.title === islandFixture.trail.title, 'unexpected trail title');
  assertFixture(snapshot.islands.length === 1, 'expected exactly one trail island');

  const [trailIsland] = snapshot.islands;
  assertFixture(trailIsland.id === fixtureIds.trailIsland, 'unexpected trail island identifier');
  assertFixture(trailIsland.position === 1, 'trail island must be at position 1');
  assertFixture(trailIsland.island.id === fixtureIds.island, 'unexpected island identifier');
  assertFixture(trailIsland.island.slug === islandFixture.slug, `expected ${islandFixture.slug}`);
  assertFixture(trailIsland.island.title === islandFixture.title, `unexpected title for ${islandFixture.slug}`);
  assertFixture(trailIsland.island.levels.length === islandFixture.levels.length, `expected exactly ${islandFixture.levels.length} positioned levels`);

  for (const [levelIndex, expectedLevel] of islandFixture.levels.entries()) {
    const islandLevel = trailIsland.island.levels[levelIndex];
    assertFixture(islandLevel, `missing level at position ${levelIndex + 1}`);
    assertFixture(islandLevel.id === fixtureIds.islandLevels[levelIndex], `unexpected island-level identifier at position ${levelIndex + 1}`);
    assertFixture(islandLevel.position === levelIndex + 1, `unexpected level position ${levelIndex + 1}`);
    assertFixture(islandLevel.level.id === fixtureIds.levels[levelIndex], `unexpected atomic level identifier at position ${levelIndex + 1}`);
    assertFixture(islandLevel.level.title === expectedLevel.title, `unexpected title for level ${levelIndex + 1}`);
    assertFixture(islandLevel.level.slides.length === expectedLevel.slides.length, `expected exactly ${expectedLevel.slides.length} positioned slides at level ${levelIndex + 1}`);

    for (const [slideIndex, expectedSlide] of expectedLevel.slides.entries()) {
      const positionedSlide = islandLevel.level.slides[slideIndex];
      const fixtureIndex = levelIndex * expectedLevel.slides.length + slideIndex;
      assertFixture(positionedSlide, `missing slide at level ${levelIndex + 1}, position ${slideIndex + 1}`);
      assertFixture(positionedSlide.id === fixtureIds.levelSlides[fixtureIndex], `unexpected level-slide identifier at index ${fixtureIndex}`);
      assertFixture(positionedSlide.position === slideIndex + 1, `unexpected slide position ${slideIndex + 1}`);
      assertFixture(positionedSlide.slide.id === fixtureIds.slides[fixtureIndex], `unexpected slide identifier at index ${fixtureIndex}`);
      assertFixture(positionedSlide.slide.title === expectedSlide.title, `unexpected title for slide ${fixtureIndex + 1}`);
      assertExactSubtype(positionedSlide.slide, expectedSlide);
    }
  }
}

export function resolveFixtureAssetPath(objectKey: string): string {
  const normalizedKey = normalize(objectKey);
  assertFixture(!normalizedKey.startsWith('..') && !normalizedKey.startsWith(sep), `unsafe media object key ${objectKey}`);
  const absolutePath = resolve(fixtureAssetRoot, normalizedKey);
  assertFixture(absolutePath.startsWith(`${fixtureAssetRoot}${sep}`), `unsafe media object key ${objectKey}`);
  return absolutePath;
}

export async function assertFixtureAssets(): Promise<void> {
  for (const asset of localAssets) {
    assertFixture(asset.mimeType === 'image/svg+xml', `unexpected MIME type for ${asset.objectKey}`);
    await access(resolveFixtureAssetPath(asset.objectKey));
  }
}

async function readFixtureSnapshot(transaction: Prisma.TransactionClient): Promise<FixtureSnapshot> {
  return transaction.trail.findUnique({
    where: { slug: islandFixture.trail.slug },
    select: {
      id: true,
      slug: true,
      title: true,
      islands: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          position: true,
          island: {
            select: {
              id: true,
              slug: true,
              title: true,
              levels: {
                orderBy: { position: 'asc' },
                select: {
                  id: true,
                  position: true,
                  level: {
                    select: {
                      id: true,
                      title: true,
                      slides: {
                        orderBy: { position: 'asc' },
                        select: {
                          id: true,
                          position: true,
                          slide: {
                            select: {
                              id: true,
                              title: true,
                              type: true,
                              textText: { select: { primaryText: true, secondaryText: true } },
                              textImage: { select: { text: true, altText: true, mediaAsset: { select: { id: true, objectKey: true, mimeType: true } } } },
                              textCode: { select: { text: true, code: true, language: true } },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });
}

async function seedSlide(transaction: Prisma.TransactionClient, definition: FixtureSlide, levelId: string, fixtureIndex: number): Promise<void> {
  const slideId = fixtureIds.slides[fixtureIndex];
  const levelSlideId = fixtureIds.levelSlides[fixtureIndex];

  await transaction.slide.upsert({
    where: { id: slideId },
    update: { title: definition.title, type: definition.type },
    create: { id: slideId, title: definition.title, type: definition.type },
  });

  await transaction.levelSlide.upsert({
    where: { id: levelSlideId },
    update: { levelId, slideId, position: (fixtureIndex % 3) + 1 },
    create: { id: levelSlideId, levelId, slideId, position: (fixtureIndex % 3) + 1 },
  });

  if (definition.type === SlideType.TextText) {
    await transaction.textTextSlide.upsert({
      where: { slideId },
      update: { primaryText: definition.primaryText, secondaryText: definition.secondaryText },
      create: { slideId, primaryText: definition.primaryText, secondaryText: definition.secondaryText },
    });
    return;
  }

  if (definition.type === SlideType.TextImage) {
    await transaction.textImageSlide.upsert({
      where: { slideId },
      update: { text: definition.text, mediaAssetId: definition.mediaAssetId, altText: definition.altText },
      create: { slideId, text: definition.text, mediaAssetId: definition.mediaAssetId, altText: definition.altText },
    });
    return;
  }

  await transaction.textCodeSlide.upsert({
    where: { slideId },
    update: { text: definition.text, code: definition.code, language: definition.language },
    create: { slideId, text: definition.text, code: definition.code, language: definition.language },
  });
}

export async function seedExperimentalFixture(prisma: PrismaClient): Promise<void> {
  await assertFixtureAssets();
  await prisma.$transaction(async (transaction) => {
    await transaction.user.upsert({
      where: { key: 'aluna-demo' },
      update: { username: 'aluna.demo', displayName: 'Aluna Demo' },
      create: { id: fixtureIds.user, key: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo' },
    });

    await transaction.trail.upsert({
      where: { slug: islandFixture.trail.slug },
      update: { title: islandFixture.trail.title },
      create: { id: fixtureIds.trail, slug: islandFixture.trail.slug, title: islandFixture.trail.title },
    });

    for (const asset of localAssets) {
      await transaction.mediaAsset.upsert({
        where: { objectKey: asset.objectKey },
        update: { mimeType: asset.mimeType, width: asset.width, height: asset.height },
        create: asset,
      });
    }

    await transaction.island.upsert({
      where: { slug: islandFixture.slug },
      update: { title: islandFixture.title },
      create: { id: fixtureIds.island, slug: islandFixture.slug, title: islandFixture.title },
    });

    await transaction.trailIsland.upsert({
      where: { id: fixtureIds.trailIsland },
      update: { trailId: fixtureIds.trail, islandId: fixtureIds.island, position: 1 },
      create: { id: fixtureIds.trailIsland, trailId: fixtureIds.trail, islandId: fixtureIds.island, position: 1 },
    });

    for (const [levelIndex, levelDefinition] of islandFixture.levels.entries()) {
      const levelId = fixtureIds.levels[levelIndex];
      await transaction.level.upsert({
        where: { id: levelId },
        update: { title: levelDefinition.title },
        create: { id: levelId, title: levelDefinition.title },
      });

      await transaction.islandLevel.upsert({
        where: { id: fixtureIds.islandLevels[levelIndex] },
        update: { islandId: fixtureIds.island, levelId, position: levelIndex + 1 },
        create: { id: fixtureIds.islandLevels[levelIndex], islandId: fixtureIds.island, levelId, position: levelIndex + 1 },
      });

      for (const [slideIndex, slideDefinition] of levelDefinition.slides.entries()) {
        await seedSlide(transaction, slideDefinition, levelId, levelIndex * levelDefinition.slides.length + slideIndex);
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
