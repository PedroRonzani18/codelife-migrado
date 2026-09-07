import type { AuthUser } from '../types/auth-user';

export type AuthIdentityProvider = 'GOOGLE';

export interface ExternalIdentityInput {
  provider: AuthIdentityProvider;
  subject: string;
  email?: string;
  emailVerified?: boolean;
}

export interface NewUserWithExternalIdentity extends ExternalIdentityInput {
  key: string;
  username: string;
  displayName: string;
}

export interface IAuthRepository {
  findUserById(id: string): Promise<AuthUser | null>;
  findUserByKey(key: string): Promise<AuthUser | null>;
  findUserByExternalIdentity(provider: AuthIdentityProvider, subject: string): Promise<AuthUser | null>;
  createUserWithExternalIdentity(input: NewUserWithExternalIdentity): Promise<AuthUser>;
}
