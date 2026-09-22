import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { apiErrorSchema } from '@codelife/contracts/errors';
import {
  islandCatalogSchema,
  islandDetailSchema,
  levelDetailSchema,
} from '@codelife/contracts/learning';
import { progressSnapshotSchema } from '@codelife/contracts/progress';
import { fixtureIds } from '../prisma/seed';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

const users = {
  first: '00000000-0000-4000-8000-000000001101',
  second: '00000000-0000-4000-8000-000000001102',
} as const;

const testUserKeys = ['phase2-user-a', 'phase2-user-b'];

describe('authenticated learning progress (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let origin: string;
  let cookieName: string;

  const cookie = async (userId: string = users.first) => `${cookieName}=${await jwt.signAsync({ sub: userId })}`;
  const start = (session: string, levelIndex: number) => request(app.getHttpServer())
    .post(`/progress/levels/${fixtureIds.levels[levelIndex]}/start`)
    .set('Cookie', session).set('Origin', origin).send({});
  const navigate = (session: string, levelIndex: number, slideIndex: number) => request(app.getHttpServer())
    .put(`/progress/levels/${fixtureIds.levels[levelIndex]}/current-slide`)
    .set('Cookie', session).set('Origin', origin)
    .send({ slideId: fixtureIds.slides[levelIndex * 3 + slideIndex] });
  const complete = (session: string, levelIndex: number) => request(app.getHttpServer())
    .post(`/progress/levels/${fixtureIds.levels[levelIndex]}/complete`)
    .set('Cookie', session).set('Origin', origin).send({});

  async function clearProgress() {
    await prisma.userLevelProgress.deleteMany({ where: { userIslandProgress: { userId: { in: Object.values(users) } } } });
    await prisma.userIslandProgress.deleteMany({ where: { userId: { in: Object.values(users) } } });
  }

  async function clearStaleTestUsers() {
    const staleUsers = await prisma.user.findMany({
      where: { key: { in: testUserKeys } },
      select: { id: true },
    });
    const staleUserIds = staleUsers.map((user) => user.id);
    if (staleUserIds.length === 0) return;
    await prisma.userLevelProgress.deleteMany({ where: { userIslandProgress: { userId: { in: staleUserIds } } } });
    await prisma.userIslandProgress.deleteMany({ where: { userId: { in: staleUserIds } } });
    await prisma.user.deleteMany({ where: { id: { in: staleUserIds } } });
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(module.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    const config = app.get(ConfigService);
    origin = config.getOrThrow('webOrigin');
    cookieName = config.getOrThrow('cookieName');
    await clearStaleTestUsers();
    await prisma.user.upsert({ where: { id: users.first }, update: {}, create: { id: users.first, key: 'phase2-user-a', username: 'phase2.user.a', displayName: 'Phase 2 User A' } });
    await prisma.user.upsert({ where: { id: users.second }, update: {}, create: { id: users.second, key: 'phase2-user-b', username: 'phase2.user.b', displayName: 'Phase 2 User B' } });
  });
  beforeEach(clearProgress);
  afterAll(async () => {
    await clearProgress();
    await prisma.user.deleteMany({ where: { id: { in: Object.values(users) } } });
    await app.close();
  });

  it('reads content and an empty snapshot without creating progress', async () => {
    const session = await cookie();
    const catalog = await request(app.getHttpServer()).get('/learning/islands').set('Cookie', session).expect(200);
    const catalogItems = islandCatalogSchema.parse(catalog.body);
    expect(catalogItems).toHaveLength(1);
    expect(catalogItems[0]).toMatchObject({
      id: fixtureIds.island,
      slug: 'island-3',
      position: 1,
      levelCount: 3,
      availability: 'available',
    });

    const island = await request(app.getHttpServer()).get('/learning/islands/island-3').set('Cookie', session).expect(200);
    expect(islandDetailSchema.parse(island.body)).toMatchObject({
      id: fixtureIds.island,
      slug: 'island-3',
      availability: 'available',
      levelCount: 3,
      levels: [
        { id: fixtureIds.levels[0], position: 1, availability: 'available' },
        { id: fixtureIds.levels[1], position: 2, availability: 'blocked' },
        { id: fixtureIds.levels[2], position: 3, availability: 'blocked' },
      ],
    });

    const level = await request(app.getHttpServer()).get(`/learning/levels/${fixtureIds.levels[0]}`).set('Cookie', session).expect(200);
    expect(levelDetailSchema.parse(level.body)).toMatchObject({ id: fixtureIds.levels[0], islandId: fixtureIds.island, position: 1, availability: 'available' });
    const response = await request(app.getHttpServer()).get('/progress').set('Cookie', session).expect(200);
    expect(progressSnapshotSchema.parse(response.body)).toMatchObject({ lastVisited: null, islands: [{ progress: null }] });
    expect(await prisma.userIslandProgress.count({ where: { userId: users.first } })).toBe(0);
  });

  it('serves authenticated controlled media and keeps blocked level content closed', async () => {
    await request(app.getHttpServer())
      .get(`/learning/media/${fixtureIds.assets[0]}`)
      .expect(401);

    const session = await cookie();
    const media = await request(app.getHttpServer())
      .get(`/learning/media/${fixtureIds.assets[0]}`)
      .set('Cookie', session)
      .expect(200);
    expect(media.headers['content-type']).toMatch(/^image\/svg\+xml/);
    expect(Buffer.from(media.body as Uint8Array).toString('utf8')).toContain('<svg');

    const blocked = await request(app.getHttpServer())
      .get(`/learning/levels/${fixtureIds.levels[1]}`)
      .set('Cookie', session)
      .expect(403);
    expect(apiErrorSchema.parse(blocked.body).code).toBe('LEVEL_BLOCKED');

    const invalidMediaId = await request(app.getHttpServer())
      .get('/learning/media/not-a-uuid')
      .set('Cookie', session)
      .expect(400);
    expect(apiErrorSchema.parse(invalidMediaId.body).code).toBe('VALIDATION_ERROR');
  });

  it('requires authentication, a trusted origin and strict command bodies', async () => {
    await request(app.getHttpServer()).get('/progress').expect(401);
    const session = await cookie();
    await request(app.getHttpServer()).post(`/progress/levels/${fixtureIds.levels[0]}/start`).set('Cookie', session).send({}).expect(403);
    const invalid = await request(app.getHttpServer()).post(`/progress/levels/${fixtureIds.levels[0]}/start`).set('Cookie', session).set('Origin', origin).send({ status: 'started' }).expect(400);
    expect(apiErrorSchema.parse(invalid.body).code).toBe('VALIDATION_ERROR');
  });

  it('starts explicitly, navigates adjacently and completes on the last slide', async () => {
    const session = await cookie();
    const started = progressSnapshotSchema.parse((await start(session, 0).expect(200)).body);
    expect(started.lastVisited?.slideId).toBe(fixtureIds.slides[0]);
    await expect(start(session, 0)).resolves.toMatchObject({ status: 200 });
    const jump = await navigate(session, 0, 2);
    expect(jump.status).toBe(409);
    expect(apiErrorSchema.parse(jump.body).code).toBe('INVALID_SLIDE_TRANSITION');
    await navigate(session, 0, 1).expect(200);
    const early = await complete(session, 0);
    expect(early.status).toBe(409);
    await navigate(session, 0, 2).expect(200);
    const completed = progressSnapshotSchema.parse((await complete(session, 0).expect(200)).body);
    expect(completed.islands[0].levels.map((level) => level.availability)).toEqual(['completed', 'available', 'blocked']);
    const repeated = progressSnapshotSchema.parse((await complete(session, 0).expect(200)).body);
    expect(repeated.islands[0].levels[0].progress?.completedAt).toBe(completed.islands[0].levels[0].progress?.completedAt);
  });

  it('rejects navigation before start and keeps blocked levels closed', async () => {
    const session = await cookie();
    const notStarted = await navigate(session, 0, 0);
    expect(notStarted.status).toBe(409);
    expect(apiErrorSchema.parse(notStarted.body).code).toBe('LEVEL_NOT_STARTED');
    const blocked = await start(session, 1);
    expect(blocked.status).toBe(403);
    expect(apiErrorSchema.parse(blocked.body).code).toBe('LEVEL_BLOCKED');
  });

  it('isolates progress by authenticated user', async () => {
    await start(await cookie(users.first), 0).expect(200);
    const second = progressSnapshotSchema.parse((await request(app.getHttpServer()).get('/progress').set('Cookie', await cookie(users.second)).expect(200)).body);
    expect(second.islands[0].progress).toBeNull();
  });

  it('enforces multi-island sequential progression, hides drafts and rejects blocked island access with ISLAND_BLOCKED', async () => {
    const session = await cookie();
    const secondIslandId = '00000000-0000-4000-8000-000000000020';
    const secondLevelId = '00000000-0000-4000-8000-000000000201';
    const secondSlideId = '00000000-0000-4000-8000-000000002001';
    const draftIslandId = '00000000-0000-4000-8000-000000000099';
    const draftLevelId = '00000000-0000-4000-8000-000000000599';
    const draftSlideId = '00000000-0000-4000-8000-000000000799';

    try {
      await prisma.island.create({
        data: {
          id: secondIslandId,
          slug: 'island-2',
          title: 'Ilha 2',
          position: 2,
          publishedAt: new Date(),
          levels: {
            create: {
              id: secondLevelId,
              title: 'Nível 2.1',
              position: 1,
              publishedAt: new Date(),
              slides: {
                create: {
                  id: secondSlideId,
                  title: 'Slide 2.1.1',
                  type: 'TextText',
                  position: 1,
                  textText: { create: { primaryText: 'Texto 2.1' } },
                },
              },
            },
          },
        },
      });

      await prisma.island.create({
        data: {
          id: draftIslandId,
          slug: 'island-draft',
          title: 'Ilha Rascunho',
          position: 3,
          publishedAt: null,
        },
      });

      await prisma.level.create({
        data: {
          id: draftLevelId,
          islandId: fixtureIds.island,
          title: 'Nível Rascunho',
          position: 4,
          publishedAt: null,
          slides: {
            create: {
              id: draftSlideId,
              title: 'Slide Rascunho',
              type: 'TextText',
              position: 1,
              textText: { create: { primaryText: 'Texto Rascunho' } },
            },
          },
        },
      });

      const catalogRes = await request(app.getHttpServer()).get('/learning/islands').set('Cookie', session).expect(200);
      const catalog = islandCatalogSchema.parse(catalogRes.body);
      expect(catalog).toEqual([
        {
          id: fixtureIds.island,
          slug: 'island-3',
          title: 'Interatividade',
          position: 1,
          levelCount: 3,
          availability: 'available',
        },
        {
          id: secondIslandId,
          slug: 'island-2',
          title: 'Ilha 2',
          position: 2,
          levelCount: 1,
          availability: 'blocked',
        },
      ]);

      const blockedIsland = await request(app.getHttpServer())
        .get('/learning/islands/island-2')
        .set('Cookie', session)
        .expect(403);
      expect(apiErrorSchema.parse(blockedIsland.body).code).toBe('ISLAND_BLOCKED');

      const blockedLevel = await request(app.getHttpServer())
        .get(`/learning/levels/${secondLevelId}`)
        .set('Cookie', session)
        .expect(403);
      expect(apiErrorSchema.parse(blockedLevel.body).code).toBe('ISLAND_BLOCKED');

      const blockedStart = await request(app.getHttpServer())
        .post(`/progress/levels/${secondLevelId}/start`)
        .set('Cookie', session)
        .set('Origin', origin)
        .send({})
        .expect(403);
      expect(apiErrorSchema.parse(blockedStart.body).code).toBe('ISLAND_BLOCKED');

      await request(app.getHttpServer())
        .get(`/learning/levels/${draftLevelId}`)
        .set('Cookie', session)
        .expect(404);

      for (let i = 0; i < 3; i++) {
        await start(session, i).expect(200);
        await navigate(session, i, 1).expect(200);
        await navigate(session, i, 2).expect(200);
        await complete(session, i).expect(200);
      }

      const unlockedCatalogRes = await request(app.getHttpServer()).get('/learning/islands').set('Cookie', session).expect(200);
      const unlockedCatalog = islandCatalogSchema.parse(unlockedCatalogRes.body);
      expect(unlockedCatalog[0].availability).toBe('completed');
      expect(unlockedCatalog[1].availability).toBe('available');

      const secondIslandDetail = await request(app.getHttpServer())
        .get('/learning/islands/island-2')
        .set('Cookie', session)
        .expect(200);
      expect(islandDetailSchema.parse(secondIslandDetail.body)).toMatchObject({
        id: secondIslandId,
        slug: 'island-2',
        availability: 'available',
        levelCount: 1,
      });

      const secondLevelDetail = await request(app.getHttpServer())
        .get(`/learning/levels/${secondLevelId}`)
        .set('Cookie', session)
        .expect(200);
      expect(levelDetailSchema.parse(secondLevelDetail.body)).toMatchObject({
        id: secondLevelId,
        availability: 'available',
        position: 1,
      });

      const completedIsland = await request(app.getHttpServer())
        .get('/learning/islands/island-3')
        .set('Cookie', session)
        .expect(200);
      expect(islandDetailSchema.parse(completedIsland.body)).toMatchObject({
        id: fixtureIds.island,
        availability: 'completed',
      });
    } finally {
      await prisma.userLevelProgress.deleteMany({ where: { levelId: { in: [secondLevelId, draftLevelId] } } });
      await prisma.userIslandProgress.deleteMany({ where: { islandId: { in: [secondIslandId, draftIslandId] } } });
      await prisma.textTextSlide.deleteMany({ where: { slideId: { in: [secondSlideId, draftSlideId] } } });
      await prisma.slide.deleteMany({ where: { id: { in: [secondSlideId, draftSlideId] } } });
      await prisma.level.deleteMany({ where: { id: { in: [secondLevelId, draftLevelId] } } });
      await prisma.island.deleteMany({ where: { id: { in: [secondIslandId, draftIslandId] } } });
    }
  });
});
