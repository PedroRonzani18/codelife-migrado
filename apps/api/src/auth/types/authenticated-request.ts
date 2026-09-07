import type { Request } from 'express';
import type { AuthUser } from '../repository/auth.repository.interface';

export type AuthenticatedRequest = Request & { user: AuthUser };
