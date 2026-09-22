import type { SlideType } from '@codelife/contracts/learning';

export interface MediaAssetRecord {
  id: string;
  objectKey: string;
  mimeType: string;
  sizeBytes: number | null;
  width: number | null;
  height: number | null;
  checksum: string | null;
}

export interface PositionedSlideRecord {
  id: string;
  title: string;
  type: SlideType;
  position: number;
  textText: { primaryText: string; secondaryText: string | null } | null;
  textImage: { text: string; altText: string; mediaAsset: MediaAssetRecord } | null;
  textCode: { text: string; code: string; language: string } | null;
}

export interface PositionedLevelRecord {
  id: string;
  islandId: string;
  title: string;
  position: number;
  publishedAt?: Date | null;
  slides: PositionedSlideRecord[];
}

export interface LevelRecord {
  id: string;
  islandId: string;
  title: string;
  position: number;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateLevelInput {
  id?: string;
  islandId: string;
  title: string;
  position: number;
  publishedAt?: Date | null;
}

export interface UpdateLevelInput {
  title?: string;
  position?: number;
  publishedAt?: Date | null;
}

export interface ILevelsRepository {
  levelById(levelId: string): Promise<PositionedLevelRecord | null>;
  findById(id: string): Promise<LevelRecord | null>;
  findByIslandId(islandId: string): Promise<LevelRecord[]>;
  countByIslandId(islandId: string): Promise<number>;
  create(input: CreateLevelInput): Promise<LevelRecord>;
  update(id: string, input: UpdateLevelInput): Promise<LevelRecord>;
  delete(id: string): Promise<void>;
}
