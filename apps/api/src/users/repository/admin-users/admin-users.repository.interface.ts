import type { UserRole } from '@codelife/contracts/auth';

export interface AdminUserRecord {
  id: string;
  key: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface IAdminUsersRepository {
  listUsers(): Promise<AdminUserRecord[]>;
  findUserByKey(key: string): Promise<AdminUserRecord | null>;
  updateUserRoleByKey(key: string, role: UserRole): Promise<AdminUserRecord | null>;
}
