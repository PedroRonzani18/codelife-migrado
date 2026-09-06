import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { authSessionSchema } from '@codelife/contracts/auth';
import { apiErrorSchema } from '@codelife/contracts/errors';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import {
  GOOGLE_AUTH_TRANSACTION_COOKIE,
} from '../src/auth/cookies/auth-cookie';
import { GoogleAuthService } from '../src/auth/google-auth/google-auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Google backend authentication flow (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let googleAuth: { createAuthorizationUrl: jest.Mock; handleCallback: jest.Mock };
  let sessionCookieName: string;
  let webOrigin: string;
  let googleRedirectUri: string;
  const subject = `macrostep-4-${randomUUID()}`;
  const previousEnvironment = {
    NODE_ENV: process.env.NODE_ENV,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI,
  };

  function cookieHeaders(headers: string | string[] | undefined): string[] {
    if (Array.isArray(headers)) return headers;
    return headers ? [headers] : [];
  }

  function cookieValue(headers: string | string[] | undefined, name: string): string | undefined {
    return cookieHeaders(headers)
      ?.find((header) => header.startsWith(`${name}=`))
      ?.split(';', 1)[0];
  }

  async function clearCreatedUser() {
    const identities = await prisma.externalIdentity.findMany({
      where: { subject },
      select: { userId: true },
    });
    const userIds = identities.map(({ userId }) => userId);
    if (userIds.length === 0) return;
    await prisma.externalIdentity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.GOOGLE_CLIENT_ID = 'integration-google-client';
    process.env.GOOGLE_REDIRECT_URI = 'http://localhost:3001/auth/google/callback';

    googleAuth = {
      createAuthorizationUrl: jest.fn().mockResolvedValue({
        authorizationUrl: 'https://accounts.google.com/o/oauth2/auth?state=provider-state',
        state: 'provider-state',
        nonce: 'provider-nonce',
        codeVerifier: 'provider-verifier',
      }),
      handleCallback: jest.fn().mockResolvedValue({
        subject,
        email: 'person@example.com',
        emailVerified: true,
        displayName: 'Person Example',
      }),
    };
    const module = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(GoogleAuthService)
      .useValue(googleAuth)
      .compile();
    app = configureApp(module.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    const config = app.get(ConfigService);
    sessionCookieName = config.getOrThrow<string>('cookieName');
    webOrigin = config.getOrThrow<string>('webOrigin');
    googleRedirectUri = config.getOrThrow<string>('googleRedirectUri');
  });

  afterAll(async () => {
    await clearCreatedUser();
    await app.close();
    if (previousEnvironment.NODE_ENV === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = previousEnvironment.NODE_ENV;
    if (previousEnvironment.GOOGLE_CLIENT_ID === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = previousEnvironment.GOOGLE_CLIENT_ID;
    if (previousEnvironment.GOOGLE_REDIRECT_URI === undefined) delete process.env.GOOGLE_REDIRECT_URI;
    else process.env.GOOGLE_REDIRECT_URI = previousEnvironment.GOOGLE_REDIRECT_URI;
  });

  beforeEach(() => {
    googleAuth.createAuthorizationUrl.mockClear();
    googleAuth.handleCallback.mockClear();
    googleAuth.handleCallback.mockResolvedValue({
      subject,
      email: 'person@example.com',
      emailVerified: true,
      displayName: 'Person Example',
    });
  });

  it('starts Google authorization, completes the callback and reuses the local session', async () => {
    const start = await request(app.getHttpServer()).get('/auth/google').expect(302);
    expect(start.headers.location).toBe('https://accounts.google.com/o/oauth2/auth?state=provider-state');
    const transactionCookie = cookieValue(start.headers['set-cookie'], GOOGLE_AUTH_TRANSACTION_COOKIE);
    expect(transactionCookie).toBeDefined();
    expect(cookieHeaders(start.headers['set-cookie']).find((header) => header.startsWith(`${GOOGLE_AUTH_TRANSACTION_COOKIE}=`))).toEqual(
      expect.stringContaining('HttpOnly'),
    );

    const callback = await request(app.getHttpServer())
      .get('/auth/google/callback?code=authorization-code&state=provider-state')
      .set('Cookie', transactionCookie!)
      .expect(302);
    expect(callback.headers.location).toBe(webOrigin);
    const sessionCookie = cookieValue(callback.headers['set-cookie'], sessionCookieName);
    expect(sessionCookie).toBeDefined();
    expect(cookieHeaders(callback.headers['set-cookie']).find((header) => header.startsWith(`${GOOGLE_AUTH_TRANSACTION_COOKIE}=`))).toEqual(
      expect.stringContaining('Expires=Thu, 01 Jan 1970'),
    );

    const session = await request(app.getHttpServer()).get('/auth/me').set('Cookie', sessionCookie!).expect(200);
    expect(authSessionSchema.parse(session.body)).toMatchObject({
      user: { username: 'person-example', displayName: 'Person Example' },
    });
    expect(googleAuth.handleCallback).toHaveBeenCalledWith({
      callbackUrl: `${googleRedirectUri}?code=authorization-code&state=provider-state`,
      state: 'provider-state',
      nonce: 'provider-nonce',
      codeVerifier: 'provider-verifier',
    });
  });

  it('clears the transaction and does not create a session when callback validation fails', async () => {
    googleAuth.handleCallback.mockRejectedValue(new Error('invalid callback'));
    const start = await request(app.getHttpServer()).get('/auth/google').expect(302);
    const transactionCookie = cookieValue(start.headers['set-cookie'], GOOGLE_AUTH_TRANSACTION_COOKIE);

    const callback = await request(app.getHttpServer())
      .get('/auth/google/callback?code=authorization-code&state=provider-state')
      .set('Cookie', transactionCookie!)
      .expect(401);
    expect(apiErrorSchema.parse(callback.body).code).toBe('UNAUTHORIZED');
    expect(cookieValue(callback.headers['set-cookie'], sessionCookieName)).toBeUndefined();
    expect(cookieHeaders(callback.headers['set-cookie']).find((header) => header.startsWith(`${GOOGLE_AUTH_TRANSACTION_COOKIE}=`))).toEqual(
      expect.stringContaining('Expires=Thu, 01 Jan 1970'),
    );
  });

  it('treats provider cancellation as an unauthorized local callback', async () => {
    const callback = await request(app.getHttpServer())
      .get('/auth/google/callback?error=access_denied&error_description=cancelled')
      .expect(401);
    expect(apiErrorSchema.parse(callback.body).code).toBe('UNAUTHORIZED');
    expect(googleAuth.handleCallback).not.toHaveBeenCalled();
  });
});
