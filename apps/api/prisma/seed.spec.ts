import { SlideType } from '@prisma/client';
import { assertFixtureAssets, assertFixtureIntegrity, fixtureIds, islandFixture, resolveFixtureAssetPath, type FixtureSnapshot } from './seed';

function snapshotSlide(definition: (typeof islandFixture.levels)[number]['slides'][number], index: number) {
  const base = { id: fixtureIds.slides[index], title: definition.title, type: definition.type, position: (index % 3) + 1, textText: null, textImage: null, textCode: null };
  if (definition.type === SlideType.TextText) return { ...base, textText: { primaryText: definition.primaryText, secondaryText: definition.secondaryText } };
  if (definition.type === SlideType.TextImage) return { ...base, textImage: { text: definition.text, altText: definition.altText, mediaAsset: { id: definition.mediaAssetId, objectKey: index === 2 ? 'learning/island-3/variables.svg' : index === 5 ? 'learning/island-3/events.svg' : 'learning/island-3/dom.svg', mimeType: 'image/svg+xml' } } };
  return { ...base, textCode: { text: definition.text, code: definition.code, language: definition.language } };
}

function validSnapshot(): NonNullable<FixtureSnapshot> {
  return {
    id: fixtureIds.island,
    slug: islandFixture.slug,
    title: islandFixture.title,
    levels: islandFixture.levels.map((level, levelIndex) => ({
      id: fixtureIds.levels[levelIndex],
      title: level.title,
      position: levelIndex + 1,
      slides: level.slides.map((slide, slideIndex) => snapshotSlide(slide, levelIndex * 3 + slideIndex)),
    })),
  } as NonNullable<FixtureSnapshot>;
}

describe('experimental fixture integrity', () => {
  it('accepts the exact 1 × 3 × 9 hierarchy', () => {
    expect(() => assertFixtureIntegrity(validSnapshot())).not.toThrow();
  });

  it.each([
    ['an additional level', (snapshot: NonNullable<FixtureSnapshot>) => snapshot.levels.push(snapshot.levels[0]), 'expected exactly 3 levels'],
    ['a non-consecutive position', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.levels[1].position = 4; }, 'unexpected level position 2'],
    ['a wrong slide identity', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.levels[0].slides[0].id = fixtureIds.slides[1]; }, 'unexpected slide at index'],
    ['more than one subtype', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.levels[0].slides[0].textCode = { text: 'x', code: 'x', language: 'text' }; }, 'must have exactly one subtype'],
  ])('rejects %s', (_description, mutate, message) => {
    const snapshot = validSnapshot();
    mutate(snapshot);
    expect(() => assertFixtureIntegrity(snapshot)).toThrow(message);
  });

  it('uses controlled local assets', async () => {
    await expect(assertFixtureAssets()).resolves.toBeUndefined();
    expect(() => resolveFixtureAssetPath('../outside.svg')).toThrow('unsafe media object key');
  });
});
