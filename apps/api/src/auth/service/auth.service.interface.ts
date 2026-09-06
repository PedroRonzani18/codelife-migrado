import type { AuthUser } from '../repository/auth.repository.interface';
import type { GoogleIdentity } from '../google-auth/google-auth.types';

export interface AuthSession {
  token: string;
  user: AuthUser;
}

export interface GoogleAuthorization {
  authorizationUrl: string;
  transactionToken: string;
}

export interface GoogleAuthenticationInput {
  callbackUrl: string;
  transactionToken?: string;
}

export interface IAuthService {
  startExperimentalSession(): Promise<AuthSession>;
  startGoogleAuthorization(): Promise<GoogleAuthorization>;
  completeGoogleAuthentication(input: GoogleAuthenticationInput): Promise<AuthSession>;
  resolveGoogleIdentity(identity: GoogleIdentity): Promise<AuthUser>;
  resolveSession(token: string): Promise<AuthUser>;
}
