import { describe, expect, it } from 'vitest';
import type { IslandDetail } from '@codelife/contracts/learning';
import type { ProgressSnapshot } from '@codelife/contracts/progress';
import { selectIslandJourney, selectLevelProgress } from './selectLearning';

const islandId = '11111111-1111-4111-8111-111111111111';
const levelId = '22222222-2222-4222-8222-222222222222';
const slideId = '33333333-3333-4333-8333-333333333333';

const island = {
  id: islandId,
  slug: 'island-3',
  title: 'Fundamentos',
  levelCount: 1,
  levels: [{ id: levelId, title: 'Eventos', position: 1, availability: 'in_progress' }],
} satisfies IslandDetail;

const snapshot = {
  lastVisited: null,
  nextRecommended: { levelId, slideId },
  islands: [{
    id: islandId,
    slug: 'island-3',
    title: 'Fundamentos',
    levelCount: 1,
    progress: null,
    levels: [{
      ...island.levels[0],
      progress: { currentSlideId: slideId, startedAt: '2026-08-22T00:00:00.000Z', completedAt: null },
    }],
  }],
} satisfies ProgressSnapshot;

describe('learning selectors', () => {
  it('combines island content with its progress state', () => {
    expect(selectIslandJourney(island, snapshot)[0]?.progress?.currentSlideId).toBe(slideId);
  });

  it('finds a level progress across islands', () => {
    expect(selectLevelProgress(snapshot, levelId)?.id).toBe(levelId);
    expect(selectLevelProgress(snapshot, '44444444-4444-4444-8444-444444444444')).toBeUndefined();
  });
});
