import { describe, expect, it } from 'vitest';
import {
  apiErrorCodeSchema,
  apiErrorSchema,
  completeLevelInputSchema,
  islandDetailSchema,
  levelDetailSchema,
  progressSnapshotSchema,
  slideSchema,
  stableKeySchema,
  startLevelInputSchema,
  updateCurrentSlideInputSchema,
  uuidSchema,
} from './index.js';

const ids = {
  island: 'cb7638c4-0d42-4f6a-b341-1060ccf0872f',
  level: 'de6a6f44-5ef0-43d6-87e5-1959cbbaadbe',
  slide: 'cfb6e5b0-bbef-4b42-9a2d-0252fd3b21a7',
  nextSlide: 'd08078aa-49c9-4b56-8ee7-79a7c584cbb7',
  media: '55ad205d-a81d-4201-9e08-a33c0f34b22c',
};
const level = { id: ids.level, title: 'Variáveis', position: 1, availability: 'available' as const };
const slide = { id: ids.slide, title: 'Texto', position: 1, previousSlideId: null, nextSlideId: null, type: 'TextText' as const, primaryText: 'Conteúdo', secondaryText: null };

describe('shared contracts', () => {
  it('accepts stable slugs and UUID entity identifiers', () => {
    expect(stableKeySchema.parse('island-3')).toBe('island-3');
    expect(uuidSchema.parse(ids.level)).toBe(ids.level);
    expect(uuidSchema.safeParse('island-3-l1').success).toBe(false);
  });

  it('models strict slide subtypes with direct adjacent slide ids', () => {
    expect(slideSchema.parse(slide)).toMatchObject({ type: 'TextText' });
    const base = { id: slide.id, title: slide.title, position: slide.position, previousSlideId: null, nextSlideId: null };
    expect(slideSchema.parse({ ...base, type: 'TextCode', text: 'Exemplo', code: 'const x = 1;', language: 'javascript' })).toMatchObject({ type: 'TextCode' });
    expect(slideSchema.parse({ ...base, type: 'TextImage', text: 'Imagem', mediaAsset: { id: ids.media, objectKey: 'image.svg', mimeType: 'image/svg+xml', sizeBytes: null, width: 640, height: 360, checksum: null }, altText: 'Descrição' })).toMatchObject({ type: 'TextImage' });
    expect(slideSchema.safeParse({ ...slide, unexpected: true }).success).toBe(false);
  });

  it('accepts direct island and level read models', () => {
    expect(islandDetailSchema.parse({ id: ids.island, slug: 'island-3', title: 'Interatividade', levelCount: 1, levels: [level] })).toMatchObject({ id: ids.island });
    expect(levelDetailSchema.parse({ ...level, islandId: ids.island, slides: [slide] })).toMatchObject({ islandId: ids.island });
  });

  it('accepts the canonical two-level progress snapshot', () => {
    const startedAt = '2026-08-20T10:00:00.000Z';
    expect(progressSnapshotSchema.parse({
      lastVisited: { islandId: ids.island, levelId: ids.level, slideId: ids.slide },
      nextRecommended: { levelId: ids.level, slideId: ids.nextSlide },
      islands: [{
        id: ids.island, slug: 'island-3', title: 'Interatividade', levelCount: 1,
        progress: { currentLevelId: ids.level, startedAt },
        levels: [{ ...level, availability: 'in_progress', progress: { currentSlideId: ids.slide, startedAt, completedAt: null } }],
      }],
    })).toMatchObject({ lastVisited: { slideId: ids.slide } });
  });

  it('allows only server-owned command bodies', () => {
    expect(startLevelInputSchema.parse({})).toEqual({});
    expect(updateCurrentSlideInputSchema.parse({ slideId: ids.slide })).toEqual({ slideId: ids.slide });
    expect(completeLevelInputSchema.parse({})).toEqual({});
    expect(updateCurrentSlideInputSchema.safeParse({ slideId: ids.slide, userId: ids.island }).success).toBe(false);
    expect(startLevelInputSchema.safeParse({ status: 'started' }).success).toBe(false);
  });

  it('exposes stable API errors, including an unstarted level', () => {
    expect(apiErrorCodeSchema.parse('LEVEL_NOT_STARTED')).toBe('LEVEL_NOT_STARTED');
    expect(apiErrorSchema.parse({ statusCode: 409, code: 'LEVEL_NOT_STARTED', message: 'Não iniciado', requestId: 'request-id' })).toMatchObject({ code: 'LEVEL_NOT_STARTED' });
  });
});
