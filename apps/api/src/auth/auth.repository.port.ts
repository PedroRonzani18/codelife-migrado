export const AUTH_REPOSITORY = Symbol('AUTH_REPOSITORY');

export interface AuthUser {
  id: string;
  key: string;
  username: string;
  displayName: string;
}

export interface AuthRepositoryPort {
  findUserById(id: string): Promise<AuthUser | null>;
  findUserByKey(key: string): Promise<AuthUser | null>;
}
