export interface AuthUser {
  id: string;
  key: string;
  username: string;
  displayName: string;
}

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

export class AuthRepositoryUniqueConstraintError extends Error {
  constructor() {
    super('Authentication persistence unique constraint conflict');
    this.name = 'AuthRepositoryUniqueConstraintError';
  }
}

export interface IAuthRepository {
  findUserById(id: string): Promise<AuthUser | null>;
  findUserByKey(key: string): Promise<AuthUser | null>;
  findUserByExternalIdentity(provider: AuthIdentityProvider, subject: string): Promise<AuthUser | null>;
  createUserWithExternalIdentity(input: NewUserWithExternalIdentity): Promise<AuthUser>;
}
