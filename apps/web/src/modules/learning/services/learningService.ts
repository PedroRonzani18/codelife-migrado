import { stableKeySchema, uuidSchema } from '@codelife/contracts/common';
import { islandCatalogSchema, islandDetailSchema, levelDetailSchema } from '@codelife/contracts/learning';
import { apiFetchParsed, apiUrl } from '@/shared/http';

export function getIslandCatalog() {
  return apiFetchParsed('/learning/islands', islandCatalogSchema);
}

export function getIsland(slug: string) {
  const validSlug = stableKeySchema.parse(slug);
  return apiFetchParsed(`/learning/islands/${encodeURIComponent(validSlug)}`, islandDetailSchema);
}

export function getLevel(levelId: string) {
  const validLevelId = uuidSchema.parse(levelId);
  return apiFetchParsed(`/learning/levels/${encodeURIComponent(validLevelId)}`, levelDetailSchema);
}

export function getMediaUrl(mediaAssetId: string): string {
  const validMediaAssetId = uuidSchema.parse(mediaAssetId);
  return `${apiUrl}/learning/media/${encodeURIComponent(validMediaAssetId)}`;
}
