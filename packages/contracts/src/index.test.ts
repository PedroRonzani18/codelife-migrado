import { describe, expect, it } from 'vitest';
import { apiErrorSchema, stableKeySchema } from './index.js';

describe('shared contracts', () => {
  it('accepts the stable fixture identifiers', () => {
    expect(stableKeySchema.parse('island-3-l1')).toBe('island-3-l1');
  });

  it('rejects an incomplete standard API error', () => {
    expect(() => apiErrorSchema.parse({ statusCode: 400 })).toThrow();
  });
});
