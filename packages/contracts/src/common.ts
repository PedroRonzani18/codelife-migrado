import { z } from 'zod';

// Technical identifiers in the compositional learning model are UUIDs. Stable
// kebab-case keys remain useful only for public business slugs (for example,
// `island-3`) and legacy experimental identities.
export const uuidSchema = z.string().uuid();

export const stableKeySchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a stable kebab-case key');
