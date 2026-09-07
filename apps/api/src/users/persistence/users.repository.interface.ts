import type { UserRole } from '@codelife/contracts/auth';

export interface UserRecord {
  id: string;
  key: string;
  username: string;
  displayName: string;
  role: UserRole;
}

export interface IUsersRepository {
  listUsers(): Promise<UserRecord[]>;
  findUserByKey(key: string): Promise<UserRecord | null>;
  updateUserRoleByKey(key: string, role: UserRole): Promise<UserRecord | null>;
}
