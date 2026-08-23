import { stableKeySchema, uuidSchema } from '@codelife/contracts/common';
import { islandDetailSchema, levelDetailSchema } from '@codelife/contracts/learning';
import { apiFetchParsed, apiUrl } from '@/shared/http';

export function getIsland(slug = 'island-3') {
  const validSlug = stableKeySchema.parse(slug);
  return apiFetchParsed(`/learning/islands/${encodeURIComponent(validSlug)}`, islandDetailSchema);
}

export function getExperimentalIsland() {
  return getIsland('island-3');
}

export function getLevel(levelId: string) {
  const validLevelId = uuidSchema.parse(levelId);
  return apiFetchParsed(`/learning/levels/${encodeURIComponent(validLevelId)}`, levelDetailSchema);
}

export function getMediaUrl(mediaAssetId: string): string {
  const validMediaAssetId = uuidSchema.parse(mediaAssetId);
  return `${apiUrl}/learning/media/${encodeURIComponent(validMediaAssetId)}`;
}
