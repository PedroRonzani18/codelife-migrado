export const USERS_PROVIDER_KEYS = {
  USERS_REPOSITORY: 'IUsersRepository',
} as const;

export type UsersProviderKeys =
  (typeof USERS_PROVIDER_KEYS)[keyof typeof USERS_PROVIDER_KEYS];
