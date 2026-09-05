import type { AuthorizationCodeGrantChecks, Configuration, IDToken } from 'openid-client';

export type GoogleOidcTokenResponse = {
  claims(): IDToken | undefined;
};

export type GoogleOidcProtocol = {
  authorizationCodeGrant(
    configuration: Configuration,
    callbackUrl: URL,
    checks: AuthorizationCodeGrantChecks,
  ): Promise<GoogleOidcTokenResponse>;
  buildAuthorizationUrl(
    configuration: Configuration,
    parameters: Record<string, string>,
  ): Promise<URL>;
  calculatePKCECodeChallenge(codeVerifier: string): Promise<string>;
  discovery(server: URL, clientId: string, clientSecret?: string): Promise<Configuration>;
  randomNonce(): Promise<string>;
  randomPKCECodeVerifier(): Promise<string>;
  randomState(): Promise<string>;
};

export const GOOGLE_OIDC_PROTOCOL = Symbol('GoogleOidcProtocol');

export const googleOidcProtocol: GoogleOidcProtocol = {
  authorizationCodeGrant: async (configuration, callbackUrl, checks) =>
    (await import('openid-client')).authorizationCodeGrant(configuration, callbackUrl, checks),
  buildAuthorizationUrl: async (configuration, parameters) =>
    (await import('openid-client')).buildAuthorizationUrl(configuration, parameters),
  calculatePKCECodeChallenge: async (codeVerifier) =>
    (await import('openid-client')).calculatePKCECodeChallenge(codeVerifier),
  discovery: async (server, clientId, clientSecret) =>
    (await import('openid-client')).discovery(server, clientId, clientSecret),
  randomNonce: async () => (await import('openid-client')).randomNonce(),
  randomPKCECodeVerifier: async () => (await import('openid-client')).randomPKCECodeVerifier(),
  randomState: async () => (await import('openid-client')).randomState(),
};
