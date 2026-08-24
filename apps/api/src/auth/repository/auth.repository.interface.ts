export interface AuthUser {
  id: string;
  key: string;
  username: string;
  displayName: string;
}

export interface IAuthRepository {
  findUserById(id: string): Promise<AuthUser | null>;
  findUserByKey(key: string): Promise<AuthUser | null>;
}
