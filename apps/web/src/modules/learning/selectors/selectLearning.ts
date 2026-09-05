import type { IslandDetail, LevelSummary } from '@codelife/contracts/learning';
import type { LevelProgressSnapshot, ProgressSnapshot } from '@codelife/contracts/progress';

export type LevelJourney = LevelSummary & { progress: LevelProgressSnapshot['progress'] };

export function selectLevelProgress(snapshot: ProgressSnapshot | undefined, levelId: string) {
  for (const island of snapshot?.islands ?? []) {
    const level = island.levels.find((candidate) => candidate.id === levelId);
    if (level) return level;
  }
  return undefined;
}

export function selectIslandJourney(island: IslandDetail | undefined, snapshot: ProgressSnapshot | undefined): LevelJourney[] {
  if (!island) return [];
  const progressIsland = snapshot?.islands.find((candidate) => candidate.id === island.id);
  return island.levels.map((level) => {
    const snapshotLevel = progressIsland?.levels.find((candidate) => candidate.id === level.id);
    return {
      ...level,
      availability: snapshotLevel?.availability ?? level.availability,
      progress: snapshotLevel?.progress ?? null,
    };
  });
}
