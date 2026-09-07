import type { AdminUser, UpdateUserRoleInput } from '@codelife/contracts/users';

export interface IAdminUsersService {
  list(): Promise<AdminUser[]>;
  updateRole(actorId: string, userKey: string, input: UpdateUserRoleInput): Promise<AdminUser>;
}
