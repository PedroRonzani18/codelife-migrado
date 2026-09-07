export const AUTH_PROVIDER_KEYS = {
  AUTH_REPOSITORY: 'IAuthRepository',
} as const;

export type AuthProviderKeys =
  (typeof AUTH_PROVIDER_KEYS)[keyof typeof AUTH_PROVIDER_KEYS];
