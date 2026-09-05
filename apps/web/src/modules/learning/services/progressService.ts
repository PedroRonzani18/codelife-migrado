import {
  completeLevelInputSchema,
  progressSnapshotSchema,
  startLevelInputSchema,
  updateCurrentSlideInputSchema,
} from '@codelife/contracts/progress';
import { uuidSchema } from '@codelife/contracts/common';
import { apiFetchParsed } from '@/shared/http';

const snapshot = (path: string, init?: RequestInit) => apiFetchParsed(path, progressSnapshotSchema, init);

export function getProgressSnapshot() {
  return snapshot('/progress');
}

export function startLevel(levelId: string) {
  const validLevelId = uuidSchema.parse(levelId);
  const body = startLevelInputSchema.parse({});
  return snapshot(`/progress/levels/${encodeURIComponent(validLevelId)}/start`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function navigateToSlide(levelId: string, slideId: string) {
  const validLevelId = uuidSchema.parse(levelId);
  const body = updateCurrentSlideInputSchema.parse({ slideId: uuidSchema.parse(slideId) });
  return snapshot(`/progress/levels/${encodeURIComponent(validLevelId)}/current-slide`, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

export function completeLevel(levelId: string) {
  const validLevelId = uuidSchema.parse(levelId);
  const body = completeLevelInputSchema.parse({});
  return snapshot(`/progress/levels/${encodeURIComponent(validLevelId)}/complete`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}
