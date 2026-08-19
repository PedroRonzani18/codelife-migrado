import { describe, expect, it } from 'vitest';
import { apiErrorCodeSchema, apiErrorSchema, stableKeySchema } from './index.js';

describe('shared contracts', () => {
  it('accepts the stable fixture identifiers', () => {
    expect(stableKeySchema.parse('island-3-l1')).toBe('island-3-l1');
  });

  it('rejects an incomplete standard API error', () => {
    expect(() => apiErrorSchema.parse({ statusCode: 400 })).toThrow();
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

  it('rejects unstable error codes and unexpected response fields', () => {
    expect(apiErrorCodeSchema.safeParse('P2002').success).toBe(false);
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
