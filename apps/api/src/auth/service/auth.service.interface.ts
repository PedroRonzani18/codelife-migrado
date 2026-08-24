import type { AuthUser } from '../repository/auth.repository.interface';

export interface ExperimentalSession {
  token: string;
  user: AuthUser;
}

export interface IAuthService {
  startExperimentalSession(): Promise<ExperimentalSession>;
  resolveSession(token: string): Promise<AuthUser>;
}
