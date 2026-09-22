import type { SlideType } from '@codelife/contracts/learning';

export interface SlideRecord {
  id: string;
  levelId: string;
  title: string;
  type: SlideType;
  position: number;
  createdAt: Date;
  updatedAt: Date;
  textText?: { primaryText: string; secondaryText: string | null } | null;
  textImage?: { text: string; altText: string; mediaAssetId: string } | null;
  textCode?: { text: string; code: string; language: string } | null;
}

export interface CreateSlideInput {
  id?: string;
  levelId: string;
  title: string;
  type: SlideType;
  position: number;
  textText?: { primaryText: string; secondaryText: string | null };
  textImage?: { text: string; altText: string; mediaAssetId: string };
  textCode?: { text: string; code: string; language: string };
}

export interface UpdateSlideInput {
  title?: string;
  position?: number;
  textText?: { primaryText?: string; secondaryText?: string | null };
  textImage?: { text?: string; altText?: string; mediaAssetId?: string };
  textCode?: { text?: string; code?: string; language?: string };
}

export interface ISlidesRepository {
  findById(id: string): Promise<SlideRecord | null>;
  findByLevelId(levelId: string): Promise<SlideRecord[]>;
  countByLevelId(levelId: string): Promise<number>;
  create(input: CreateSlideInput): Promise<SlideRecord>;
  update(id: string, input: UpdateSlideInput): Promise<SlideRecord>;
  delete(id: string): Promise<void>;
  deleteByLevelId(levelId: string): Promise<void>;
  getAdminDetail(id: string): Promise<import('@codelife/contracts/content-management').AdminSlideDetail | null>;
}
