import { access } from 'node:fs/promises';
import { normalize, resolve, sep } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { Prisma, PrismaClient, SlideType } from '@prisma/client';
import { config } from 'dotenv';

const fixtureAssetRoot = resolve(__dirname, '../assets');

export const fixtureIds = {
  user: '00000000-0000-4000-8000-000000000001',
  island: '00000000-0000-4000-8000-000000000301',
  levels: [
    '00000000-0000-4000-8000-000000000501',
    '00000000-0000-4000-8000-000000000502',
    '00000000-0000-4000-8000-000000000503',
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
  position: number;
  textText: { primaryText: string; secondaryText: string | null } | null;
  textImage: { text: string; altText: string; mediaAsset: { id: string; objectKey: string; mimeType: string } } | null;
  textCode: { text: string; code: string; language: string } | null;
};
export type FixtureSnapshot = {
  id: string;
  slug: string;
  title: string;
  levels: Array<{ id: string; title: string; position: number; slides: FixtureSlideSnapshot[] }>;
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
  } else if (definition.type === SlideType.TextImage) {
    assertFixture(slide.textImage?.text === definition.text, `unexpected text for image slide ${slide.id}`);
    assertFixture(slide.textImage?.altText === definition.altText, `unexpected alt text for image slide ${slide.id}`);
    assertFixture(slide.textImage?.mediaAsset.id === definition.mediaAssetId, `unexpected media asset for slide ${slide.id}`);
  } else {
    assertFixture(slide.textCode?.text === definition.text, `unexpected text for code slide ${slide.id}`);
    assertFixture(slide.textCode?.code === definition.code, `unexpected code for slide ${slide.id}`);
    assertFixture(slide.textCode?.language === definition.language, `unexpected language for slide ${slide.id}`);
  }
}

export function assertFixtureIntegrity(snapshot: FixtureSnapshot): void {
  assertFixture(snapshot, `${islandFixture.slug} island was not found`);
  assertFixture(snapshot.id === fixtureIds.island, 'unexpected island identifier');
  assertFixture(snapshot.slug === islandFixture.slug, `expected ${islandFixture.slug}`);
  assertFixture(snapshot.title === islandFixture.title, `unexpected title for ${islandFixture.slug}`);
  assertFixture(snapshot.levels.length === islandFixture.levels.length, `expected exactly ${islandFixture.levels.length} levels`);
  for (const [levelIndex, expectedLevel] of islandFixture.levels.entries()) {
    const level = snapshot.levels[levelIndex];
    assertFixture(level?.id === fixtureIds.levels[levelIndex], `unexpected level at position ${levelIndex + 1}`);
    assertFixture(level.position === levelIndex + 1, `unexpected level position ${levelIndex + 1}`);
    assertFixture(level.title === expectedLevel.title, `unexpected level title ${levelIndex + 1}`);
    assertFixture(level.slides.length === expectedLevel.slides.length, `unexpected slide count at level ${levelIndex + 1}`);
    for (const [slideIndex, expectedSlide] of expectedLevel.slides.entries()) {
      const fixtureIndex = levelIndex * expectedLevel.slides.length + slideIndex;
      const slide = level.slides[slideIndex];
      assertFixture(slide?.id === fixtureIds.slides[fixtureIndex], `unexpected slide at index ${fixtureIndex}`);
      assertFixture(slide.position === slideIndex + 1, `unexpected slide position ${slideIndex + 1}`);
      assertFixture(slide.title === expectedSlide.title, `unexpected slide title ${fixtureIndex + 1}`);
      assertExactSubtype(slide, expectedSlide);
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
  return transaction.island.findUnique({
    where: { slug: islandFixture.slug },
    select: {
      id: true, slug: true, title: true,
      levels: {
        orderBy: { position: 'asc' },
        select: {
          id: true, title: true, position: true,
          slides: {
            orderBy: { position: 'asc' },
            select: {
              id: true, title: true, type: true, position: true,
              textText: { select: { primaryText: true, secondaryText: true } },
              textImage: { select: { text: true, altText: true, mediaAsset: { select: { id: true, objectKey: true, mimeType: true } } } },
              textCode: { select: { text: true, code: true, language: true } },
            },
          },
        },
      },
    },
  });
}

async function seedSlide(transaction: Prisma.TransactionClient, definition: FixtureSlide, levelId: string, fixtureIndex: number): Promise<void> {
  const slideId = fixtureIds.slides[fixtureIndex];
  const position = (fixtureIndex % 3) + 1;
  await transaction.slide.upsert({
    where: { id: slideId },
    update: { levelId, title: definition.title, type: definition.type, position },
    create: { id: slideId, levelId, title: definition.title, type: definition.type, position },
  });
  if (definition.type === SlideType.TextText) {
    await transaction.textTextSlide.upsert({ where: { slideId }, update: { primaryText: definition.primaryText, secondaryText: definition.secondaryText }, create: { slideId, primaryText: definition.primaryText, secondaryText: definition.secondaryText } });
  } else if (definition.type === SlideType.TextImage) {
    await transaction.textImageSlide.upsert({ where: { slideId }, update: { text: definition.text, mediaAssetId: definition.mediaAssetId, altText: definition.altText }, create: { slideId, text: definition.text, mediaAssetId: definition.mediaAssetId, altText: definition.altText } });
  } else {
    await transaction.textCodeSlide.upsert({ where: { slideId }, update: { text: definition.text, code: definition.code, language: definition.language }, create: { slideId, text: definition.text, code: definition.code, language: definition.language } });
  }
}

export async function seedExperimentalFixture(prisma: PrismaClient): Promise<void> {
  await assertFixtureAssets();
  await prisma.$transaction(async (transaction) => {
    await transaction.user.upsert({ where: { key: 'aluna-demo' }, update: { username: 'aluna.demo', displayName: 'Aluna Demo' }, create: { id: fixtureIds.user, key: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo' } });
    for (const asset of localAssets) await transaction.mediaAsset.upsert({ where: { objectKey: asset.objectKey }, update: { mimeType: asset.mimeType, width: asset.width, height: asset.height }, create: asset });
    await transaction.island.upsert({ where: { slug: islandFixture.slug }, update: { title: islandFixture.title }, create: { id: fixtureIds.island, slug: islandFixture.slug, title: islandFixture.title } });
    for (const [levelIndex, levelDefinition] of islandFixture.levels.entries()) {
      const levelId = fixtureIds.levels[levelIndex];
      await transaction.level.upsert({ where: { id: levelId }, update: { islandId: fixtureIds.island, title: levelDefinition.title, position: levelIndex + 1 }, create: { id: levelId, islandId: fixtureIds.island, title: levelDefinition.title, position: levelIndex + 1 } });
      for (const [slideIndex, slideDefinition] of levelDefinition.slides.entries()) await seedSlide(transaction, slideDefinition, levelId, levelIndex * levelDefinition.slides.length + slideIndex);
    }
    assertFixtureIntegrity(await readFixtureSnapshot(transaction));
  });
}

async function runSeed(): Promise<void> {
  if (!process.env.DATABASE_URL) config({ path: '../../.env', quiet: true });
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) throw new Error('DATABASE_URL is required to seed the experimental fixture');
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  try { await seedExperimentalFixture(prisma); } finally { await prisma.$disconnect(); }
}

if (require.main === module) {
  void runSeed().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : 'Experimental fixture seed failed');
    process.exitCode = 1;
  });
}
