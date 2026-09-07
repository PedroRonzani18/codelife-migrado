import type { UserRole } from '@codelife/contracts/users';
import type { UserRecord } from '../internal/user-record';

export type { UserRecord } from '../internal/user-record';

export interface CreateUserInput {
  key: string;
  username: string;
  displayName: string;
}

export interface IUsersRepository {
  findById(id: string): Promise<UserRecord | null>;
  findByKey(key: string): Promise<UserRecord | null>;
  list(): Promise<UserRecord[]>;
  create(input: CreateUserInput): Promise<UserRecord>;
  updateRoleByKey(key: string, role: UserRole): Promise<UserRecord | null>;
}
