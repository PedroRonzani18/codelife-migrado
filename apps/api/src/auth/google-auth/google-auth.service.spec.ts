import type { ConfigService } from '@nestjs/config';
import { GoogleAuthService } from './google-auth.service';

type TestProtocol = ConstructorParameters<typeof GoogleAuthService>[1];

function createConfig(values: Record<string, unknown>): ConfigService {
  return { get: (key: string) => values[key] } as ConfigService;
}

function createProtocol() {
  const protocol = {
    discovery: jest.fn().mockResolvedValue('configuration'),
    buildAuthorizationUrl: jest.fn().mockResolvedValue(new URL('https://accounts.google.com/o/oauth2/v2/auth')),
    calculatePKCECodeChallenge: jest.fn().mockResolvedValue('challenge'),
    randomNonce: jest.fn().mockResolvedValue('nonce'),
    randomPKCECodeVerifier: jest.fn().mockResolvedValue('verifier'),
    randomState: jest.fn().mockResolvedValue('state'),
    authorizationCodeGrant: jest.fn(),
  };
  return protocol as typeof protocol & TestProtocol;
}

describe('GoogleAuthService', () => {
  it('requires Google configuration only when authorization starts', async () => {
    const protocol = createProtocol();
    const service = new GoogleAuthService(createConfig({}), protocol);

    await expect(service.createAuthorizationUrl()).rejects.toThrow('googleClientId');
    expect(protocol.discovery).not.toHaveBeenCalled();
  });

  it('builds an authorization request with PKCE, state and nonce', async () => {
    const protocol = createProtocol();
    const service = new GoogleAuthService(createConfig({
      googleClientId: 'client-id',
      googleClientSecret: 'client-secret',
      googleRedirectUri: 'http://localhost:3001/auth/google/callback',
    }), protocol);

    await expect(service.createAuthorizationUrl()).resolves.toEqual({
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      state: 'state',
      nonce: 'nonce',
      codeVerifier: 'verifier',
    });
    expect(protocol.discovery).toHaveBeenCalledWith(
      new URL('https://accounts.google.com'),
      'client-id',
      'client-secret',
    );
    expect(protocol.buildAuthorizationUrl).toHaveBeenCalledWith('configuration', {
      redirect_uri: 'http://localhost:3001/auth/google/callback',
      response_type: 'code',
      scope: 'openid email profile',
      code_challenge: 'challenge',
      code_challenge_method: 'S256',
      state: 'state',
      nonce: 'nonce',
    });
  });

  it('validates the callback and returns only the external identity claims', async () => {
    const protocol = createProtocol();
    protocol.authorizationCodeGrant.mockResolvedValue({
      claims: () => ({
        sub: 'google-subject',
        email: 'person@example.com',
        email_verified: true,
        name: 'Person Example',
      }),
    });
    const service = new GoogleAuthService(createConfig({
      googleClientId: 'client-id',
      googleRedirectUri: 'http://localhost:3001/auth/google/callback',
    }), protocol);

    await expect(service.handleCallback({
      callbackUrl: 'http://localhost:3001/auth/google/callback?code=code&state=state',
      state: 'state',
      nonce: 'nonce',
      codeVerifier: 'verifier',
    })).resolves.toEqual({
      subject: 'google-subject',
      email: 'person@example.com',
      emailVerified: true,
      displayName: 'Person Example',
    });
    expect(protocol.authorizationCodeGrant).toHaveBeenCalledWith(
      'configuration',
      new URL('http://localhost:3001/auth/google/callback?code=code&state=state'),
      {
        expectedState: 'state',
        expectedNonce: 'nonce',
        idTokenExpected: true,
        pkceCodeVerifier: 'verifier',
      },
    );
  });

  it('rejects invalid callback claims and redirect URIs', async () => {
    const protocol = createProtocol();
    protocol.authorizationCodeGrant.mockResolvedValue({ claims: () => ({ email: 'person@example.com' }) });
    const service = new GoogleAuthService(createConfig({
      googleClientId: 'client-id',
      googleRedirectUri: 'http://localhost:3001/auth/google/callback',
    }), protocol);

    await expect(service.handleCallback({
      callbackUrl: 'http://localhost:3001/auth/google/callback?code=code&state=state',
      state: 'state',
      nonce: 'nonce',
      codeVerifier: 'verifier',
    })).rejects.toThrow('subject');
    await expect(service.handleCallback({
      callbackUrl: 'http://localhost:3001/auth/other/callback?code=code&state=state',
      state: 'state',
      nonce: 'nonce',
      codeVerifier: 'verifier',
    })).rejects.toThrow('does not match');
  });
});
