import { SlideType } from '@prisma/client';
import { assertFixtureIntegrity, islandFixture, type FixtureSnapshot } from './seed';

function validSnapshot(): NonNullable<FixtureSnapshot> {
  return {
    id: 'island-database-id',
    key: islandFixture.key,
    title: islandFixture.title,
    sortOrder: islandFixture.sortOrder,
    levels: islandFixture.levels.map((level, levelIndex) => ({
      id: `level-database-id-${levelIndex}`,
      key: level.key,
      islandId: 'island-database-id',
      title: level.title,
      sortOrder: level.sortOrder,
      progress: [],
      slides: level.slides.map((slide) => ({
        key: slide.key,
        levelId: `level-database-id-${levelIndex}`,
        title: slide.title,
        sortOrder: slide.sortOrder,
        type: slide.type,
        content: slide.content,
      })),
    })),
  };
}

describe('experimental fixture integrity', () => {
  it('accepts the exact island-3 hierarchy', () => {
    expect(() => assertFixtureIntegrity(validSnapshot())).not.toThrow();
  });

  it('rejects extra scoped content without deleting it', () => {
    const snapshot = validSnapshot();
    snapshot.levels.push({ ...snapshot.levels[0], id: 'extra-level', key: 'extra-level', islandId: snapshot.id, progress: [], slides: [] });

    expect(() => assertFixtureIntegrity(snapshot)).toThrow('expected exactly 3 levels under island-3');
  });

  it.each([
    ['a level linked to another island', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.levels[0].islandId = 'other-island'; }, 'references another island'],
    ['a slide linked to another level', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.levels[0].slides[0].levelId = 'other-level'; }, 'references another level'],
    ['an unexpected slide type', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.levels[0].slides[0].type = SlideType.TextImage; }, 'unexpected type'],
    ['an existing progress record', (snapshot: NonNullable<FixtureSnapshot>) => { snapshot.levels[0].progress.push({ id: 'progress-1' }); }, 'expected zero progress records'],
  ])('rejects %s', (_description, mutate, message) => {
    const snapshot = validSnapshot();
    mutate(snapshot);

    expect(() => assertFixtureIntegrity(snapshot)).toThrow(message);
  });
});
