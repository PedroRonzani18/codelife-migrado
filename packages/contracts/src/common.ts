import { z } from 'zod';

export const stableKeySchema = z
  .string()
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use a stable kebab-case key');
