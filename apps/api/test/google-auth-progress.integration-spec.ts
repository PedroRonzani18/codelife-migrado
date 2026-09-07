import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { IdentityProvider } from '@prisma/client';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { authSessionSchema } from '@codelife/contracts/auth';
import { apiErrorSchema } from '@codelife/contracts/errors';
import { progressSnapshotSchema } from '@codelife/contracts/progress';
import { fixtureIds } from '../prisma/seed';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { GOOGLE_AUTH_TRANSACTION_COOKIE } from '../src/auth/cookies/auth-cookie';
import { GoogleAuthService } from '../src/auth/google-auth/google-auth.service';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Google identity and learning progress (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let googleAuth: { createAuthorizationUrl: jest.Mock; handleCallback: jest.Mock };
  let sessionCookieName: string;
  let origin: string;

  const identities = {
    first: {
      subject: `macrostep-6-a-${randomUUID()}`,
      email: `macrostep-6-a-${randomUUID()}@example.com`,
      emailVerified: true,
      displayName: 'Macrostep Six Person A',
    },
    second: {
      subject: `macrostep-6-b-${randomUUID()}`,
      email: `macrostep-6-b-${randomUUID()}@example.com`,
      emailVerified: true,
      displayName: 'Macrostep Six Person B',
    },
    failed: {
      subject: `macrostep-7-failed-${randomUUID()}`,
      email: `macrostep-7-failed-${randomUUID()}@example.com`,
      emailVerified: true,
      displayName: 'Macrostep Seven Failed',
    },
  } as const;
  type TestIdentity = (typeof identities)[keyof typeof identities];
  let currentIdentity: TestIdentity = identities.first;

  function cookieHeaders(headers: string | string[] | undefined): string[] {
    if (Array.isArray(headers)) return headers;
    return headers ? [headers] : [];
  }

  function cookieValue(headers: string | string[] | undefined, name: string): string | undefined {
    return cookieHeaders(headers)
      .find((header) => header.startsWith(`${name}=`))
      ?.split(';', 1)[0];
  }

  async function authenticate(identity: TestIdentity): Promise<string> {
    currentIdentity = identity;
    const start = await request(app.getHttpServer()).get('/auth/google').expect(302);
    const transactionCookie = cookieValue(start.headers['set-cookie'], GOOGLE_AUTH_TRANSACTION_COOKIE);
    expect(transactionCookie).toBeDefined();

    const callback = await request(app.getHttpServer())
      .get('/auth/google/callback?code=authorization-code&state=provider-state')
      .set('Cookie', transactionCookie!)
      .expect(302);
    const sessionCookie = cookieValue(callback.headers['set-cookie'], sessionCookieName);
    expect(sessionCookie).toBeDefined();
    return sessionCookie!;
  }

  async function userForSubject(subject: string) {
    return prisma.externalIdentity.findFirstOrThrow({
      where: { provider: IdentityProvider.GOOGLE, subject },
      include: { user: true },
    });
  }

  async function clearCreatedUsers() {
    const externalIdentities = await prisma.externalIdentity.findMany({
      where: {
        subject: {
          in: [identities.first.subject, identities.second.subject, identities.failed.subject],
        },
      },
      select: { userId: true },
    });
    const userIds = externalIdentities.map(({ userId }) => userId);
    if (userIds.length === 0) return;

    await prisma.userLevelProgress.deleteMany({
      where: { userIslandProgress: { userId: { in: userIds } } },
    });
    await prisma.userIslandProgress.deleteMany({ where: { userId: { in: userIds } } });
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
      handleCallback: jest.fn().mockImplementation(async () => currentIdentity),
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
    origin = config.getOrThrow<string>('webOrigin');
  });

  afterAll(async () => {
    await clearCreatedUsers();
    await app.close();
  });

  it('persists progress across logout and relogin, while isolating another Google identity', async () => {
    const firstSession = await authenticate(identities.first);
    const firstSessionResponse = authSessionSchema.parse(
      (await request(app.getHttpServer()).get('/auth/me').set('Cookie', firstSession).expect(200)).body,
    );
    const firstIdentity = await userForSubject(identities.first.subject);
    expect(firstSessionResponse.user.id).toBe(firstIdentity.user.key);
    expect(firstSessionResponse.user.role).toBe('USER');
    expect(firstIdentity.user.role).toBe('USER');

    await request(app.getHttpServer())
      .post(`/progress/levels/${fixtureIds.levels[0]}/start`)
      .set('Cookie', firstSession)
      .set('Origin', origin)
      .send({})
      .expect(200);
    await request(app.getHttpServer())
      .put(`/progress/levels/${fixtureIds.levels[0]}/current-slide`)
      .set('Cookie', firstSession)
      .set('Origin', origin)
      .send({ slideId: fixtureIds.slides[1] })
      .expect(200);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', firstSession)
      .set('Origin', origin)
      .send({})
      .expect(200);

    const reloginSession = await authenticate(identities.first);
    const reloginResponse = authSessionSchema.parse(
      (await request(app.getHttpServer()).get('/auth/me').set('Cookie', reloginSession).expect(200)).body,
    );
    const firstIdentityAfterRelogin = await userForSubject(identities.first.subject);
    expect(reloginResponse.user.id).toBe(firstSessionResponse.user.id);
    expect(firstIdentityAfterRelogin.user.id).toBe(firstIdentity.user.id);
    expect(firstIdentityAfterRelogin.user.key).toBe(firstIdentity.user.key);
    expect(firstIdentityAfterRelogin.user.username).toBe(firstIdentity.user.username);

    const resumed = progressSnapshotSchema.parse(
      (await request(app.getHttpServer()).get('/progress').set('Cookie', reloginSession).expect(200)).body,
    );
    expect(resumed.lastVisited?.slideId).toBe(fixtureIds.slides[1]);
    expect(resumed.islands[0].progress?.currentLevelId).toBe(fixtureIds.levels[0]);
    expect(resumed.islands[0].levels[0].progress?.currentSlideId).toBe(fixtureIds.slides[1]);

    const secondSession = await authenticate(identities.second);
    const secondBeforeProgress = progressSnapshotSchema.parse(
      (await request(app.getHttpServer()).get('/progress').set('Cookie', secondSession).expect(200)).body,
    );
    expect(secondBeforeProgress.lastVisited).toBeNull();
    expect(secondBeforeProgress.islands[0].progress).toBeNull();

    await request(app.getHttpServer())
      .post(`/progress/levels/${fixtureIds.levels[0]}/start`)
      .set('Cookie', secondSession)
      .set('Origin', origin)
      .send({})
      .expect(200);

    const secondIdentity = await userForSubject(identities.second.subject);
    expect(secondIdentity.user.role).toBe('USER');
    const firstProgress = await prisma.userLevelProgress.findFirstOrThrow({
      where: {
        levelId: fixtureIds.levels[0],
        userIslandProgress: { userId: firstIdentity.user.id },
      },
    });
    const secondProgress = await prisma.userLevelProgress.findFirstOrThrow({
      where: {
        levelId: fixtureIds.levels[0],
        userIslandProgress: { userId: secondIdentity.user.id },
      },
    });
    expect(firstProgress.currentSlideId).toBe(fixtureIds.slides[1]);
    expect(secondProgress.currentSlideId).toBe(fixtureIds.slides[0]);
    expect(secondIdentity.user.id).not.toBe(firstIdentity.user.id);

    const logout = await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', reloginSession)
      .set('Origin', origin)
      .send({})
      .expect(200);
    expect(cookieHeaders(logout.headers['set-cookie']).find((header) => header.startsWith(`${sessionCookieName}=`))).toEqual(
      expect.stringContaining('Expires=Thu, 01 Jan 1970'),
    );
    expect(apiErrorSchema.parse((await request(app.getHttpServer()).get('/auth/me').expect(401)).body).code).toBe('UNAUTHORIZED');
    expect(apiErrorSchema.parse((await request(app.getHttpServer()).get('/progress').expect(401)).body).code).toBe('UNAUTHORIZED');
  });

  it('rejects an invalid OIDC callback without creating identity or session', async () => {
    currentIdentity = identities.failed;
    googleAuth.handleCallback.mockRejectedValue(new Error('invalid state'));

    const start = await request(app.getHttpServer()).get('/auth/google').expect(302);
    const transactionCookie = cookieValue(start.headers['set-cookie'], GOOGLE_AUTH_TRANSACTION_COOKIE);
    expect(transactionCookie).toBeDefined();

    const callback = await request(app.getHttpServer())
      .get('/auth/google/callback?code=authorization-code&state=provider-state')
      .set('Cookie', transactionCookie!)
      .expect(401);
    expect(apiErrorSchema.parse(callback.body).code).toBe('UNAUTHORIZED');
    expect(cookieValue(callback.headers['set-cookie'], sessionCookieName)).toBeUndefined();
    await expect(prisma.externalIdentity.findFirst({ where: { subject: identities.failed.subject } })).resolves.toBeNull();
    expect(apiErrorSchema.parse((await request(app.getHttpServer()).get('/auth/me').expect(401)).body).code).toBe('UNAUTHORIZED');
  });
});
