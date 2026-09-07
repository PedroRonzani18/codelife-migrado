import {
  adminUserSchema,
  adminUsersSchema,
  updateUserRoleInputSchema,
  type UpdateUserRoleInput,
} from '@codelife/contracts/users';
import { stableKeySchema } from '@codelife/contracts/common';
import { apiFetchParsed } from '@/shared/http';

export function getAdminUsers() {
  return apiFetchParsed('/admin/users', adminUsersSchema);
}

export function updateAdminUserRole(userKey: string, input: UpdateUserRoleInput) {
  const validUserKey = stableKeySchema.parse(userKey);
  const validInput = updateUserRoleInputSchema.parse(input);
  return apiFetchParsed(`/admin/users/${encodeURIComponent(validUserKey)}/role`, adminUserSchema, {
    method: 'PATCH',
    body: JSON.stringify(validInput),
  });
}
