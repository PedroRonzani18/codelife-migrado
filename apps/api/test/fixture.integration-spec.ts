import { randomUUID } from 'node:crypto';
import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { authSessionSchema } from '@codelife/contracts/auth';
import { apiErrorSchema } from '@codelife/contracts/errors';
import { islandDetailSchema } from '@codelife/contracts/learning';
import { fixtureIds, seedExperimentalFixture } from '../prisma/seed';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

describe('experimental foundation (integration)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(module.createNestApplication());
    await app.init();
  });

  afterAll(async () => { await app.close(); });

  it('keeps the 1 × 3 × 9 hierarchy and differentiates an absent session', async () => {
    await request(app.getHttpServer()).get('/health/live').expect(200, { status: 'ok' });
    await request(app.getHttpServer()).get('/health/ready').expect(200, { status: 'ready' });
    const absent = await request(app.getHttpServer()).get('/auth/me').expect(401);
    expect(apiErrorSchema.parse(absent.body).code).toBe('UNAUTHORIZED');
    const login = await request(app.getHttpServer()).post('/auth/experimental-login').expect(200);
    expect(authSessionSchema.parse(login.body).user.id).toBe('aluna-demo');
    expect(login.headers['set-cookie']).toBeDefined();
    const cookie = login.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('SameSite=Lax');
    await request(app.getHttpServer()).get('/auth/me').set('Cookie', cookie).expect(200, { user: { id: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo' } });
    const island = await request(app.getHttpServer()).get('/learning/islands/island-3').set('Cookie', cookie).expect(200);
    expect(islandDetailSchema.parse(island.body).levels.map((level) => level.id)).toEqual(fixtureIds.levels);
    expect(islandDetailSchema.parse(island.body).levels.map((level) => level.availability)).toEqual(['available', 'blocked', 'blocked']);

    const prisma = app.get(PrismaService);
    const fixture = await prisma.island.findUniqueOrThrow({
      where: { slug: 'island-3' },
      include: { levels: { include: { slides: true } } },
    });
    expect(fixture.levels).toHaveLength(3);
    expect(fixture.levels.flatMap((level) => level.slides)).toHaveLength(9);
    expect(await prisma.userLevelProgress.count()).toBe(0);

    const invalidKey = await request(app.getHttpServer()).get('/learning/islands/INVALID!').set('Cookie', cookie).expect(400);
    expect(apiErrorSchema.parse(invalidKey.body).code).toBe('VALIDATION_ERROR');
    const missing = await request(app.getHttpServer()).get('/learning/islands/unknown').set('Cookie', cookie).expect(404);
    expect(apiErrorSchema.parse(missing.body).code).toBe('RESOURCE_NOT_FOUND');

    await request(app.getHttpServer()).post('/auth/logout').set('Cookie', cookie).expect(403);
    await request(app.getHttpServer())
      .post('/auth/logout')
      .set('Cookie', cookie)
      .set('Origin', app.get(ConfigService).getOrThrow<string>('webOrigin'))
      .expect(200, { ok: true });
  });

  it('keeps existing direct progress untouched when the seed runs again', async () => {
    const prisma = app.get(PrismaService);
    const completedAt = new Date('2026-08-20T12:00:00.000Z');
    const islandProgress = await prisma.userIslandProgress.create({
      data: {
        id: randomUUID(),
        userId: fixtureIds.user,
        islandId: fixtureIds.island,
        currentLevelId: fixtureIds.levels[0],
      },
    });
    const levelProgress = await prisma.userLevelProgress.create({
      data: {
        id: randomUUID(),
        userIslandProgressId: islandProgress.id,
        levelId: fixtureIds.levels[0],
        currentSlideId: fixtureIds.slides[2],
        completedAt,
      },
    });

    await seedExperimentalFixture(prisma);

    await expect(prisma.userLevelProgress.findUniqueOrThrow({ where: { id: levelProgress.id } })).resolves.toMatchObject({
      currentSlideId: fixtureIds.slides[2],
      completedAt,
    });
    expect(await prisma.userIslandProgress.count()).toBe(1);
    expect(await prisma.userLevelProgress.count()).toBe(1);
  });
});
