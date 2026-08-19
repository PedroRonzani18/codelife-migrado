import type { Request } from 'express';
export type AuthenticatedRequest = Request & { user: { id: string; key: string; username: string; displayName: string } };
