import { z } from 'zod';
import { stableKeySchema } from './common.js';

export const userRoleSchema = z.enum(['USER', 'ADMIN']);
export type UserRole = z.infer<typeof userRoleSchema>;

export const currentUserSchema = z.object({
  id: stableKeySchema,
  username: z.string().min(1),
  displayName: z.string().min(1),
  role: userRoleSchema,
});
export type CurrentUser = z.infer<typeof currentUserSchema>;

export const authSessionSchema = z.object({ user: currentUserSchema });
export type AuthSession = z.infer<typeof authSessionSchema>;
