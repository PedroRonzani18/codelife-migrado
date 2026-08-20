export const ISLANDS_REPOSITORY = Symbol('ISLANDS_REPOSITORY');

export interface IslandLevelRecord {
  key: string;
  title: string;
  sortOrder: number;
}

export interface IslandWithLevelsRecord {
  key: string;
  title: string;
  sortOrder: number;
  levels: IslandLevelRecord[];
}

export interface IslandsRepositoryPort {
  islandByKey(key: string): Promise<IslandWithLevelsRecord | null>;
}
