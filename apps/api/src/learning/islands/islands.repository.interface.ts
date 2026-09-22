export interface LevelSummaryRecord {
  id: string;
  title: string;
  position: number;
}

export interface IslandWithLevelsRecord {
  id: string;
  slug: string;
  title: string;
  position?: number;
  publishedAt?: Date | null;
  levels: LevelSummaryRecord[];
}

export interface IslandRecord {
  id: string;
  slug: string;
  title: string;
  position: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateIslandInput {
  id?: string;
  slug: string;
  title: string;
  position: number;
  publishedAt?: Date | null;
}

export interface UpdateIslandInput {
  slug?: string;
  title?: string;
  position?: number;
  publishedAt?: Date | null;
}

export interface IIslandsRepository {
  islandBySlug(slug: string): Promise<IslandWithLevelsRecord | null>;
  findById(id: string): Promise<IslandRecord | null>;
  findBySlug(slug: string): Promise<IslandRecord | null>;
  listAll(): Promise<IslandRecord[]>;
  count(): Promise<number>;
  create(input: CreateIslandInput): Promise<IslandRecord>;
  update(id: string, input: UpdateIslandInput): Promise<IslandRecord>;
  delete(id: string): Promise<void>;
}
