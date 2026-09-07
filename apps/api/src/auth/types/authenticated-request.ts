import type { Request } from 'express';
import type { UserRecord } from '../../users/internal/user-record';

export type AuthenticatedRequest = Request & { user: UserRecord };
