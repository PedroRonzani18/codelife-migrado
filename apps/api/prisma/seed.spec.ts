import { SlideType } from '@prisma/client';
import { assertFixtureAssets, assertFixtureIntegrity, fixtureIds, islandFixture, resolveFixtureAssetPath, type FixtureSnapshot } from './seed';

function snapshotSlide(definition: (typeof islandFixture.levels)[number]['slides'][number], index: number) {
  const base = {
    id: fixtureIds.slides[index],
    title: definition.title,
    type: definition.type,
    textText: null,
    textImage: null,
    textCode: null,
  };

  if (definition.type === SlideType.TextText) {
    return { ...base, textText: { primaryText: definition.primaryText, secondaryText: definition.secondaryText } };
  }
  if (definition.type === SlideType.TextImage) {
    const asset = fixtureIds.assets.find((id) => id === definition.mediaAssetId);
    return {
      ...base,
      textImage: {
        text: definition.text,
        altText: definition.altText,
        mediaAsset: { id: asset, objectKey: index === 2 ? 'learning/island-3/variables.svg' : index === 5 ? 'learning/island-3/events.svg' : 'learning/island-3/dom.svg', mimeType: 'image/svg+xml' },
      },
    };
  }
  return { ...base, textCode: { text: definition.text, code: definition.code, language: definition.language } };
}

function validSnapshot(): NonNullable<FixtureSnapshot> {
  return {
    id: fixtureIds.trail,
    slug: islandFixture.trail.slug,
    title: islandFixture.trail.title,
    islands: [{
      id: fixtureIds.trailIsland,
      position: 1,
      island: {
        id: fixtureIds.island,
        slug: islandFixture.slug,
        title: islandFixture.title,
        levels: islandFixture.levels.map((level, levelIndex) => ({
          id: fixtureIds.islandLevels[levelIndex],
          position: levelIndex + 1,
          level: {
            id: fixtureIds.levels[levelIndex],
            title: level.title,
            slides: level.slides.map((slide, slideIndex) => {
              const fixtureIndex = levelIndex * level.slides.length + slideIndex;
              return { id: fixtureIds.levelSlides[fixtureIndex], position: slideIndex + 1, slide: snapshotSlide(slide, fixtureIndex) };
            }),
          },
        })),
      },
    }],
  } as NonNullable<FixtureSnapshot>;
}

describe('experimental fixture integrity', () => {
  it('accepts the exact 1 × 1 × 3 × 9 composition', () => {
    expect(() => assertFixtureIntegrity(validSnapshot())).not.toThrow();
  });

  it.each([
    ['an additional positioned level', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.islands[0].island.levels.push(snapshot.islands[0].island.levels[0]); }, 'expected exactly 3 positioned levels'],
    ['a non-consecutive level position', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.islands[0].island.levels[1].position = 4; }, 'unexpected level position 2'],
    ['a wrong positioned slide identity', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.islands[0].island.levels[0].level.slides[0].id = fixtureIds.levelSlides[1]; }, 'unexpected level-slide identifier'],
    ['more than one subtype', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.islands[0].island.levels[0].level.slides[0].slide.textCode = { text: 'extra', code: 'extra', language: 'javascript' }; }, 'must have exactly one subtype'],
  ])('rejects %s', (_description, mutate, message) => {
    const snapshot = validSnapshot();
    mutate(snapshot);
    expect(() => assertFixtureIntegrity(snapshot)).toThrow(message);
  });

  it('uses only local controlled image assets', async () => {
    await expect(assertFixtureAssets()).resolves.toBeUndefined();
    expect(() => resolveFixtureAssetPath('../outside.svg')).toThrow('unsafe media object key');
  });
});
