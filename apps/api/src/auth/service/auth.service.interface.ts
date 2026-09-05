import type { AuthUser } from '../repository/auth.repository.interface';
import type { GoogleIdentity } from '../google-auth/google-auth.types';

export interface ExperimentalSession {
  token: string;
  user: AuthUser;
}

export interface IAuthService {
  startExperimentalSession(): Promise<ExperimentalSession>;
  resolveGoogleIdentity(identity: GoogleIdentity): Promise<AuthUser>;
  resolveSession(token: string): Promise<AuthUser>;
}
