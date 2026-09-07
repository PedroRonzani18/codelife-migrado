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

export interface IIslandsRepository {
  islandBySlug(slug: string): Promise<IslandWithLevelsRecord | null>;
}
