export const AUTH_PROVIDER_KEYS = {
  EXTERNAL_IDENTITIES_REPOSITORY: 'IExternalIdentitiesRepository',
  IDENTITY_TRANSACTION: 'IIdentityTransaction',
} as const;

export type AuthProviderKeys =
  (typeof AUTH_PROVIDER_KEYS)[keyof typeof AUTH_PROVIDER_KEYS];
