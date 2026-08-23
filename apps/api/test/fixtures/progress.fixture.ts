import { fixtureIds, islandFixture } from '../../prisma/seed';
import type { JourneyIslandProgressRecord, ProgressJourneyRecord } from '../../src/learning/repository/progress/progress.repository.interface';

export const progressRecordIds = {
  island: '00000000-0000-4000-8000-000000001002',
  levels: [
    '00000000-0000-4000-8000-000000001011',
    '00000000-0000-4000-8000-000000001012',
    '00000000-0000-4000-8000-000000001013',
  ],
} as const;

export interface LevelProgressFixture {
  levelIndex: number;
  slideIndex: number;
  completedAt?: Date | null;
}

const startedAt = new Date('2026-08-20T10:00:00.000Z');

export function createProgress(levels: LevelProgressFixture[], currentLevelIndex = levels.at(-1)?.levelIndex ?? 0): JourneyIslandProgressRecord {
  return {
    id: progressRecordIds.island,
    currentLevelId: fixtureIds.levels[currentLevelIndex],
    startedAt,
    updatedAt: startedAt,
    levels: levels.map(({ levelIndex, slideIndex, completedAt = null }) => ({
      id: progressRecordIds.levels[levelIndex],
      levelId: fixtureIds.levels[levelIndex],
      currentSlideId: fixtureIds.slides[levelIndex * 3 + slideIndex],
      startedAt,
      completedAt,
      updatedAt: new Date(startedAt.getTime() + levelIndex * 1_000),
    })),
  };
}

export function createJourney(progress: JourneyIslandProgressRecord | null = null): ProgressJourneyRecord {
  return {
    islands: [{
      id: fixtureIds.island,
      slug: islandFixture.slug,
      title: islandFixture.title,
      levels: islandFixture.levels.map((level, levelIndex) => ({
        id: fixtureIds.levels[levelIndex],
        title: level.title,
        position: levelIndex + 1,
        slides: level.slides.map((_slide, slideIndex) => ({
          id: fixtureIds.slides[levelIndex * 3 + slideIndex],
          position: slideIndex + 1,
        })),
      })),
      progress,
    }],
  };
}
