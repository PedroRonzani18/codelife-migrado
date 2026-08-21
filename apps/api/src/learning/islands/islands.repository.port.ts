export const ISLANDS_REPOSITORY = Symbol('ISLANDS_REPOSITORY');

export interface IslandLevelRecord {
  id: string;
  title: string;
  position: number;
}

export interface IslandWithLevelsRecord {
  id: string;
  slug: string;
  title: string;
  position: number;
  levels: IslandLevelRecord[];
}

export interface IslandsRepositoryPort {
  islandBySlug(slug: string): Promise<IslandWithLevelsRecord | null>;
}
