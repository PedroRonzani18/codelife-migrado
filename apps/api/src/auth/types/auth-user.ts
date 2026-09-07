import type { UserRole } from '@codelife/contracts/auth';

export interface AuthUser {
  id: string;
  key: string;
  username: string;
  displayName: string;
  role: UserRole;
}
