import { z } from 'zod';
import { stableKeySchema } from './common.js';
import { userRoleSchema } from './auth.js';

export const adminUserSchema = z
  .object({
    id: stableKeySchema,
    username: z.string().min(1),
    displayName: z.string().min(1),
    role: userRoleSchema,
  })
  .strict();
export type AdminUser = z.infer<typeof adminUserSchema>;

export const adminUsersSchema = z.array(adminUserSchema);
export type AdminUsers = z.infer<typeof adminUsersSchema>;

export const updateUserRoleInputSchema = z
  .object({ role: userRoleSchema })
  .strict();
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleInputSchema>;
