import { describe, expect, it } from 'vitest';
import {
  adminContentTreeSchema,
  adminIslandTreeItemSchema,
  adminLevelTreeItemSchema,
  adminSlideTreeItemSchema,
  adminUserSchema,
  adminUsersSchema,
  apiErrorCodeSchema,
  apiErrorSchema,
  authSessionSchema,
  completeLevelInputSchema,
  createSlideInputSchema,
  islandCatalogItemSchema,
  islandCatalogSchema,
  islandDetailSchema,
  levelDetailSchema,
  progressSnapshotSchema,
  publishContentInputSchema,
  reorderIslandsInputSchema,
  slideSchema,
  stableKeySchema,
  startLevelInputSchema,
  updateCurrentSlideInputSchema,
  updateSlideInputSchema,
  updateUserRoleInputSchema,
  userRoleSchema,
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
  it('models the current user role explicitly', () => {
    expect(userRoleSchema.parse('USER')).toBe('USER');
    expect(userRoleSchema.safeParse('SUPERUSER').success).toBe(false);
    expect(authSessionSchema.parse({ user: { id: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo', role: 'USER' } })).toMatchObject({
      user: { role: 'USER' },
    });
  });

  it('models the minimal administrative user contract and strict role command', () => {
    const user = { id: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo', role: 'USER' as const };
    expect(adminUserSchema.parse(user)).toEqual(user);
    expect(adminUsersSchema.parse([user])).toEqual([user]);
    expect(updateUserRoleInputSchema.parse({ role: 'ADMIN' })).toEqual({ role: 'ADMIN' });
    expect(updateUserRoleInputSchema.safeParse({ role: 'SUPERUSER' }).success).toBe(false);
    expect(updateUserRoleInputSchema.safeParse({ role: 'ADMIN', extra: true }).success).toBe(false);
  });

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

  it('exposes stable API errors, including content administration and blocking errors', () => {
    expect(apiErrorCodeSchema.parse('LEVEL_NOT_STARTED')).toBe('LEVEL_NOT_STARTED');
    expect(apiErrorCodeSchema.parse('ISLAND_BLOCKED')).toBe('ISLAND_BLOCKED');
    expect(apiErrorCodeSchema.parse('CONTENT_STALE')).toBe('CONTENT_STALE');
    expect(apiErrorCodeSchema.parse('CONTENT_HAS_PROGRESS')).toBe('CONTENT_HAS_PROGRESS');
    expect(apiErrorCodeSchema.parse('CONTENT_NOT_DRAFT')).toBe('CONTENT_NOT_DRAFT');
    expect(apiErrorCodeSchema.parse('CONTENT_NOT_PUBLISHABLE')).toBe('CONTENT_NOT_PUBLISHABLE');
    expect(apiErrorCodeSchema.parse('CONTENT_ORDER_CONFLICT')).toBe('CONTENT_ORDER_CONFLICT');
    expect(apiErrorSchema.parse({ statusCode: 409, code: 'CONTENT_STALE', message: 'Dado desatualizado', requestId: 'req-1' })).toMatchObject({ code: 'CONTENT_STALE' });
  });

  it('models the sequential island catalog with availability', () => {
    const catalogItem = {
      id: ids.island,
      slug: 'island-3',
      title: 'Interatividade',
      position: 1,
      levelCount: 3,
      availability: 'available' as const,
    };
    expect(islandCatalogItemSchema.parse(catalogItem)).toEqual(catalogItem);
    expect(islandCatalogSchema.parse([catalogItem])).toEqual([catalogItem]);
    expect(islandCatalogItemSchema.safeParse({ ...catalogItem, availability: 'unknown' }).success).toBe(false);
  });

  it('models administrative content tree and details', () => {
    const slideTreeItem = {
      id: ids.slide,
      levelId: ids.level,
      title: 'Variáveis',
      position: 1,
      type: 'TextText' as const,
      updatedAt: '2026-09-21T12:00:00.000Z',
    };
    const levelTreeItem = {
      id: ids.level,
      islandId: ids.island,
      title: 'Nível 1',
      position: 1,
      publishedAt: '2026-09-21T12:00:00.000Z',
      updatedAt: '2026-09-21T12:00:00.000Z',
      slides: [slideTreeItem],
    };
    const islandTreeItem = {
      id: ids.island,
      slug: 'island-3',
      title: 'Interatividade',
      position: 1,
      publishedAt: '2026-09-21T12:00:00.000Z',
      updatedAt: '2026-09-21T12:00:00.000Z',
      levels: [levelTreeItem],
    };
    expect(adminSlideTreeItemSchema.parse(slideTreeItem)).toEqual(slideTreeItem);
    expect(adminLevelTreeItemSchema.parse(levelTreeItem)).toEqual(levelTreeItem);
    expect(adminIslandTreeItemSchema.parse(islandTreeItem)).toEqual(islandTreeItem);
    expect(adminContentTreeSchema.parse([islandTreeItem])).toEqual([islandTreeItem]);
  });

  it('validates discriminated creation and updates for all slide types', () => {
    const createTextText = { type: 'TextText' as const, title: 'T1', primaryText: 'P1', secondaryText: null };
    const createTextImage = { type: 'TextImage' as const, title: 'T2', text: 'Txt', mediaAssetId: ids.media, altText: 'Alt' };
    const createTextCode = { type: 'TextCode' as const, title: 'T3', text: 'Txt', code: 'x = 1', language: 'python' };
    expect(createSlideInputSchema.parse(createTextText)).toEqual(createTextText);
    expect(createSlideInputSchema.parse(createTextImage)).toEqual(createTextImage);
    expect(createSlideInputSchema.parse(createTextCode)).toEqual(createTextCode);

    const now = '2026-09-21T12:00:00.000Z';
    const updateTextText = { type: 'TextText' as const, title: 'Novo', expectedUpdatedAt: now };
    expect(updateSlideInputSchema.parse(updateTextText)).toEqual(updateTextText);
    expect(updateSlideInputSchema.safeParse({ ...updateTextText, expectedUpdatedAt: 'invalid-date' }).success).toBe(false);
  });

  it('validates reordering and publishing schemas with strict keys', () => {
    const reorder = { islandIds: [ids.island] };
    expect(reorderIslandsInputSchema.parse(reorder)).toEqual(reorder);
    expect(reorderIslandsInputSchema.safeParse({ islandIds: [] }).success).toBe(false);
    expect(publishContentInputSchema.parse({})).toEqual({});
    expect(publishContentInputSchema.parse({ expectedUpdatedAt: '2026-09-21T12:00:00.000Z' })).toEqual({
      expectedUpdatedAt: '2026-09-21T12:00:00.000Z',
    });
  });
});
