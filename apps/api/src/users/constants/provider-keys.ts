export const USERS_PROVIDER_KEYS = {
  ADMIN_USERS_SERVICE: 'IAdminUsersService',
  ADMIN_USERS_REPOSITORY: 'IAdminUsersRepository',
} as const;

export type UsersProviderKeys =
  (typeof USERS_PROVIDER_KEYS)[keyof typeof USERS_PROVIDER_KEYS];
