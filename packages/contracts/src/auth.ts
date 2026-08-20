import { z } from 'zod';
import { stableKeySchema } from './common.js';

export const currentUserSchema = z.object({
  id: stableKeySchema,
  username: z.string().min(1),
  displayName: z.string().min(1),
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export const authSessionSchema = z.object({ user: currentUserSchema });
export type AuthSession = z.infer<typeof authSessionSchema>;
