export const AUTH_PROVIDER_KEYS = {
  // Serviços
  AUTH_SERVICE: 'IAuthService',

  // Repositórios
  AUTH_REPOSITORY: 'IAuthRepository',
} as const;

export type AuthProviderKeys =
  (typeof AUTH_PROVIDER_KEYS)[keyof typeof AUTH_PROVIDER_KEYS];
