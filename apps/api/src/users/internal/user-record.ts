import type { UserRole } from '@codelife/contracts/users';

export interface UserRecord {
  id: string;
  key: string;
  username: string;
  displayName: string;
  role: UserRole;
}
