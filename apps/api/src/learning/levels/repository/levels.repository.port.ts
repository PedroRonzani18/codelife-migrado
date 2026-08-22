import type { SlideType } from '@codelife/contracts/learning';

export const LEVELS_REPOSITORY = Symbol('LEVELS_REPOSITORY');

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
  slides: PositionedSlideRecord[];
}

export interface LevelsRepositoryPort {
  levelById(levelId: string): Promise<PositionedLevelRecord | null>;
}
