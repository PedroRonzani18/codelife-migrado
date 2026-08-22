export const ISLANDS_REPOSITORY = Symbol('ISLANDS_REPOSITORY');

export interface LevelSummaryRecord {
  id: string;
  title: string;
  position: number;
}

export interface IslandWithLevelsRecord {
  id: string;
  slug: string;
  title: string;
  levels: LevelSummaryRecord[];
}

export interface IslandsRepositoryPort {
  islandBySlug(slug: string): Promise<IslandWithLevelsRecord | null>;
}
