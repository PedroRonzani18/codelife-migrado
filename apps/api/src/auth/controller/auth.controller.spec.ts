import { UnauthorizedException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { AuthController } from './auth.controller';
import type { AuthService } from '../service/auth.service';
import {
  GOOGLE_AUTH_TRANSACTION_COOKIE,
} from '../cookies/auth-cookie';

describe('AuthController Google flow', () => {
  const configValues: Record<string, unknown> = {
    cookieName: 'codelife_session',
    cookieSecure: false,
    cookieSameSite: 'lax',
    cookieMaxAgeSeconds: 28_800,
    googleRedirectUri: 'http://localhost:3001/auth/google/callback',
    webOrigin: 'http://localhost:5173',
  };
  const config = {
    get: (key: string) => configValues[key],
    getOrThrow: (key: string) => configValues[key],
  } as unknown as ConfigService;

  function createResponse() {
    return {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      redirect: jest.fn(),
    } as unknown as Response & {
      cookie: jest.Mock;
      clearCookie: jest.Mock;
      redirect: jest.Mock;
    };
  }

  function createService() {
    return {
      startExperimentalSession: jest.fn(),
      startGoogleAuthorization: jest.fn(),
      completeGoogleAuthentication: jest.fn(),
      resolveGoogleIdentity: jest.fn(),
      resolveSession: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;
  }

  it('stores the signed OIDC transaction and redirects to Google', async () => {
    const auth = createService();
    auth.startGoogleAuthorization.mockResolvedValue({
      authorizationUrl: 'https://accounts.google.com/auth',
      transactionToken: 'transaction-token',
    });
    const response = createResponse();
    const controller = new AuthController(auth, config);

    await controller.google(response);

    expect(response.cookie).toHaveBeenCalledWith(
      GOOGLE_AUTH_TRANSACTION_COOKIE,
      'transaction-token',
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        path: '/auth/google/callback',
        maxAge: 600_000,
      }),
    );
    expect(response.redirect).toHaveBeenCalledWith('https://accounts.google.com/auth');
  });

  it('creates the CodeLife session and redirects to the configured frontend', async () => {
    const auth = createService();
    const user = { id: 'db-user-1', key: 'user-key', username: 'person', displayName: 'Person Example', role: 'USER' as const };
    auth.completeGoogleAuthentication.mockResolvedValue({ token: 'session-token', user });
    const response = createResponse();
    const controller = new AuthController(auth, config);
    const request = {
      originalUrl: '/auth/google/callback?code=code&state=state',
      query: {},
      cookies: { [GOOGLE_AUTH_TRANSACTION_COOKIE]: 'transaction-token' },
    } as unknown as Request;

    await controller.googleCallback(request, response);

    expect(response.clearCookie).toHaveBeenCalledWith(
      GOOGLE_AUTH_TRANSACTION_COOKIE,
      expect.objectContaining({ path: '/auth/google/callback' }),
    );
    expect(auth.completeGoogleAuthentication).toHaveBeenCalledWith({
      callbackUrl: 'http://localhost:3001/auth/google/callback?code=code&state=state',
      transactionToken: 'transaction-token',
    });
    expect(response.cookie).toHaveBeenCalledWith(
      'codelife_session',
      'session-token',
      expect.objectContaining({ httpOnly: true, path: '/' }),
    );
    expect(response.redirect).toHaveBeenCalledWith('http://localhost:5173');
  });

  it('does not resolve or create a session when Google cancels authorization', async () => {
    const auth = createService();
    const response = createResponse();
    const controller = new AuthController(auth, config);
    const request = {
      originalUrl: '/auth/google/callback?error=access_denied',
      query: { error: 'access_denied' },
      cookies: { [GOOGLE_AUTH_TRANSACTION_COOKIE]: 'transaction-token' },
    } as unknown as Request;

    await expect(controller.googleCallback(request, response)).rejects.toBeInstanceOf(UnauthorizedException);
    expect(response.clearCookie).toHaveBeenCalled();
    expect(auth.completeGoogleAuthentication).not.toHaveBeenCalled();
    expect(response.cookie).not.toHaveBeenCalled();
    expect(response.redirect).not.toHaveBeenCalled();
  });
});
