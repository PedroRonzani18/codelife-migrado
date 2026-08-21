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
  updateCurrentSlideInputSchema,
  uuidSchema,
} from './index.js';

const ids = {
  trail: '3d350bf3-1540-4a5e-a7cd-6d5551b35dd1',
  trailIsland: 'cb7638c4-0d42-4f6a-b341-1060ccf0872f',
  islandLevel: 'de6a6f44-5ef0-43d6-87e5-1959cbbaadbe',
  levelSlide: 'cfb6e5b0-bbef-4b42-9a2d-0252fd3b21a7',
  nextLevelSlide: 'd08078aa-49c9-4b56-8ee7-79a7c584cbb7',
  media: '55ad205d-a81d-4201-9e08-a33c0f34b22c',
};

const level = {
  id: ids.islandLevel,
  title: 'Variáveis',
  position: 1,
  availability: 'available' as const,
};

describe('shared contracts', () => {
  it('accepts business slugs but requires UUIDs for compositional positions', () => {
    expect(stableKeySchema.parse('island-3')).toBe('island-3');
    expect(uuidSchema.parse(ids.islandLevel)).toBe(ids.islandLevel);
    expect(uuidSchema.safeParse('island-3-l1').success).toBe(false);
  });

  it('models each slide subtype as a strict discriminated union', () => {
    const base = {
      id: ids.levelSlide,
      title: 'Título',
      position: 1,
      previousLevelSlideId: null,
      nextLevelSlideId: ids.nextLevelSlide,
    };

    expect(
      slideSchema.parse({
        ...base,
        type: 'TextText',
        primaryText: 'Texto principal',
        secondaryText: null,
      }),
    ).toMatchObject({ type: 'TextText', primaryText: 'Texto principal' });
    expect(
      slideSchema.parse({
        ...base,
        type: 'TextImage',
        text: 'Texto da imagem',
        mediaAsset: {
          id: ids.media,
          objectKey: 'island-3/variaveis.png',
          mimeType: 'image/png',
          sizeBytes: 1024,
          width: 640,
          height: 480,
          checksum: null,
        },
        altText: 'Uma variável exibida na página',
      }),
    ).toMatchObject({ type: 'TextImage', altText: 'Uma variável exibida na página' });
    expect(
      slideSchema.parse({
        ...base,
        type: 'TextCode',
        text: 'Exemplo',
        code: 'const valor = 1;',
        language: 'javascript',
      }),
    ).toMatchObject({ type: 'TextCode', language: 'javascript' });

    expect(
      slideSchema.safeParse({
        ...base,
        type: 'TextCode',
        text: 'Exemplo',
        code: 'const valor = 1;',
        language: 'javascript',
        primaryText: 'Campo de outro subtipo',
      }).success,
    ).toBe(false);
  });

  it('accepts compositional island and level read models', () => {
    expect(
      islandDetailSchema.parse({
        id: ids.trailIsland,
        slug: 'island-3',
        title: 'Interatividade',
        position: 1,
        levelCount: 1,
        levels: [level],
      }),
    ).toMatchObject({ id: ids.trailIsland, levels: [{ id: ids.islandLevel }] });
    expect(
      levelDetailSchema.parse({
        ...level,
        trailIslandId: ids.trailIsland,
        slides: [
          {
            id: ids.levelSlide,
            title: 'Texto',
            position: 1,
            previousLevelSlideId: null,
            nextLevelSlideId: null,
            type: 'TextText',
            primaryText: 'Conteúdo',
            secondaryText: null,
          },
        ],
      }),
    ).toMatchObject({ trailIslandId: ids.trailIsland, slides: [{ id: ids.levelSlide }] });
  });

  it('rejects zero positions, direct relation keys, and unexpected read-model fields', () => {
    expect(
      islandDetailSchema.safeParse({
        id: ids.trailIsland,
        slug: 'island-3',
        title: 'Interatividade',
        position: 0,
        levelCount: 1,
        levels: [level],
      }).success,
    ).toBe(false);
    expect(
      levelDetailSchema.safeParse({
        ...level,
        trailIslandId: ids.trailIsland,
        slides: [],
        order: 0,
      }).success,
    ).toBe(false);
  });

  it('accepts the canonical progress snapshot, including in-progress availability', () => {
    expect(
      progressSnapshotSchema.parse({
        trail: { id: ids.trail, slug: 'codelife', title: 'CodeLife' },
        lastVisited: {
          trailIslandId: ids.trailIsland,
          islandLevelId: ids.islandLevel,
          levelSlideId: ids.levelSlide,
        },
        nextRecommended: {
          islandLevelId: ids.islandLevel,
          levelSlideId: ids.nextLevelSlide,
        },
        islands: [
          {
            id: ids.trailIsland,
            slug: 'island-3',
            title: 'Interatividade',
            position: 1,
            levelCount: 1,
            levels: [
              {
                ...level,
                availability: 'in_progress',
                progress: {
                  currentLevelSlideId: ids.levelSlide,
                  completedAt: null,
                },
              },
            ],
          },
        ],
      }),
    ).toMatchObject({
      lastVisited: { levelSlideId: ids.levelSlide },
      islands: [{ levels: [{ availability: 'in_progress' }] }],
    });
  });

  it('accepts only the body owned by each progress command', () => {
    expect(updateCurrentSlideInputSchema.parse({ levelSlideId: ids.levelSlide })).toEqual({
      levelSlideId: ids.levelSlide,
    });
    expect(completeLevelInputSchema.parse({})).toEqual({});

    for (const field of ['userId', 'completedAt', 'status', 'position']) {
      expect(
        updateCurrentSlideInputSchema.safeParse({
          levelSlideId: ids.levelSlide,
          [field]: ids.trail,
        }).success,
      ).toBe(false);
      expect(completeLevelInputSchema.safeParse({ [field]: ids.trail }).success).toBe(false);
    }
  });

  it('permits null continuity references but keeps the snapshot strict', () => {
    expect(
      progressSnapshotSchema.safeParse({
        trail: { id: ids.trail, slug: 'codelife', title: 'CodeLife' },
        lastVisited: null,
        nextRecommended: null,
        islands: [],
      }).success,
    ).toBe(true);
    expect(
      progressSnapshotSchema.safeParse({
        trail: { id: ids.trail, slug: 'codelife', title: 'CodeLife' },
        lastVisited: null,
        nextRecommended: null,
        islands: [],
        revision: 1,
      }).success,
    ).toBe(false);
  });

  it('accepts a validation error with structured details', () => {
    expect(
      apiErrorSchema.parse({
        statusCode: 400,
        code: 'VALIDATION_ERROR',
        message: 'Payload inválido',
        details: [{ field: 'levelId', message: 'levelId must be a string' }],
        requestId: 'b47d8dd1-5909-4e59-978d-5e1e09586aec',
      }),
    ).toEqual({
      statusCode: 400,
      code: 'VALIDATION_ERROR',
      message: 'Payload inválido',
      details: [{ field: 'levelId', message: 'levelId must be a string' }],
      requestId: 'b47d8dd1-5909-4e59-978d-5e1e09586aec',
    });
  });

  it('exposes stable domain codes and rejects unstable or unexpected API errors', () => {
    expect(apiErrorCodeSchema.parse('LEVEL_BLOCKED')).toBe('LEVEL_BLOCKED');
    expect(apiErrorCodeSchema.parse('INVALID_SLIDE_TRANSITION')).toBe('INVALID_SLIDE_TRANSITION');
    expect(apiErrorCodeSchema.parse('LEVEL_NOT_READY_FOR_COMPLETION')).toBe('LEVEL_NOT_READY_FOR_COMPLETION');
    expect(apiErrorCodeSchema.safeParse('PROGRESS_VERSION_CONFLICT').success).toBe(false);
    expect(
      apiErrorSchema.safeParse({
        statusCode: 500,
        code: 'INTERNAL_ERROR',
        message: 'Erro interno do servidor',
        stack: 'sensitive stack',
      }).success,
    ).toBe(false);
  });

  it('requires a request identifier in every API error', () => {
    expect(
      apiErrorSchema.safeParse({
        statusCode: 404,
        code: 'RESOURCE_NOT_FOUND',
        message: 'Recurso não encontrado',
      }).success,
    ).toBe(false);
  });
});
