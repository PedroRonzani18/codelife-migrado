import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { apiErrorSchema } from '@codelife/contracts/errors';
import { levelDetailSchema } from '@codelife/contracts/learning';
import { progressSnapshotSchema } from '@codelife/contracts/progress';
import { fixtureIds } from '../prisma/seed';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

const users = {
  first: '00000000-0000-4000-8000-000000001101',
  second: '00000000-0000-4000-8000-000000001102',
} as const;

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

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(module.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    const config = app.get(ConfigService);
    origin = config.getOrThrow('webOrigin');
    cookieName = config.getOrThrow('cookieName');
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
    const level = await request(app.getHttpServer()).get(`/learning/levels/${fixtureIds.levels[0]}`).set('Cookie', session).expect(200);
    expect(levelDetailSchema.parse(level.body)).toMatchObject({ id: fixtureIds.levels[0], islandId: fixtureIds.island });
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
});
