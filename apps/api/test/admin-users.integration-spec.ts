import type { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { adminUsersSchema, adminUserSchema } from '@codelife/contracts/users';
import { apiErrorSchema } from '@codelife/contracts/errors';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/bootstrap/configure-app';
import { PrismaService } from '../src/prisma/prisma.service';

const users = {
  admin: { id: '00000000-0000-4000-8000-000000002101', key: 'macro3-admin-a', username: 'macro3-admin-a', displayName: 'Macro 3 Admin A' },
  target: { id: '00000000-0000-4000-8000-000000002102', key: 'macro3-user-b', username: 'macro3-user-b', displayName: 'Macro 3 User B' },
} as const;

describe('administrative users API (integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let jwt: JwtService;
  let cookieName: string;
  let origin: string;

  const cookie = async (userId: string) => `${cookieName}=${await jwt.signAsync({ sub: userId })}`;

  async function clearUsers() {
    const userIds = await prisma.user.findMany({
      where: { key: { in: Object.values(users).map((user) => user.key) } },
      select: { id: true },
    });
    const ids = userIds.map((user) => user.id);
    if (ids.length === 0) return;
    await prisma.userLevelProgress.deleteMany({ where: { userIslandProgress: { userId: { in: ids } } } });
    await prisma.userIslandProgress.deleteMany({ where: { userId: { in: ids } } });
    await prisma.externalIdentity.deleteMany({ where: { userId: { in: ids } } });
    await prisma.user.deleteMany({ where: { id: { in: ids } } });
  }

  beforeAll(async () => {
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = configureApp(module.createNestApplication());
    await app.init();
    prisma = app.get(PrismaService);
    jwt = app.get(JwtService);
    const config = app.get(ConfigService);
    cookieName = config.getOrThrow('cookieName');
    origin = config.getOrThrow('webOrigin');
    await clearUsers();
    await prisma.user.createMany({
      data: [
        { ...users.admin, role: 'ADMIN' },
        { ...users.target, role: 'USER' },
      ],
    });
  });

  beforeEach(async () => {
    await prisma.user.update({ where: { id: users.admin.id }, data: { role: 'ADMIN' } });
    await prisma.user.update({ where: { id: users.target.id }, data: { role: 'USER' } });
  });

  afterAll(async () => {
    await clearUsers();
    await app.close();
  });

  it('requires ADMIN and returns only minimal users in deterministic order', async () => {
    const targetSession = await cookie(users.target.id);
    const adminSession = await cookie(users.admin.id);

    const unauthenticated = await request(app.getHttpServer()).get('/admin/users').expect(401);
    expect(apiErrorSchema.parse(unauthenticated.body).code).toBe('UNAUTHORIZED');

    const forbidden = await request(app.getHttpServer()).get('/admin/users').set('Cookie', targetSession).expect(403);
    expect(apiErrorSchema.parse(forbidden.body).code).toBe('FORBIDDEN');

    const response = await request(app.getHttpServer()).get('/admin/users').set('Cookie', adminSession).expect(200);
    const listed = adminUsersSchema.parse(response.body);
    expect(listed.map((user) => user.username)).toEqual([...listed].map((user) => user.username).sort());
    expect(listed.every((user) => Object.keys(user).sort().join(',') === 'displayName,id,role,username')).toBe(true);
    expect(listed.filter((user) => user.id.startsWith('macro3-'))).toEqual([
      { id: users.admin.key, username: users.admin.username, displayName: users.admin.displayName, role: 'ADMIN' },
      { id: users.target.key, username: users.target.username, displayName: users.target.displayName, role: 'USER' },
    ]);
  });

  it('rejects non-admin updates, invalid bodies, and nonexistent targets', async () => {
    const targetSession = await cookie(users.target.id);
    const adminSession = await cookie(users.admin.id);

    await request(app.getHttpServer())
      .patch(`/admin/users/${users.target.key}/role`)
      .set('Cookie', targetSession)
      .set('Origin', origin)
      .send({ role: 'ADMIN' })
      .expect(403);
    await request(app.getHttpServer())
      .patch(`/admin/users/${users.target.key}/role`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ role: 'SUPERUSER' })
      .expect(400);
    await request(app.getHttpServer())
      .patch(`/admin/users/${users.target.key}/role`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ role: 'ADMIN', extra: true })
      .expect(400);
    await request(app.getHttpServer())
      .patch('/admin/users/missing-key/role')
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ role: 'ADMIN' })
      .expect(404);
    await expect(prisma.user.findUnique({ where: { id: users.target.id }, select: { role: true } })).resolves.toEqual({ role: 'USER' });
  });

  it('promotes and demotes another user using the same JWT while preventing self-demotion', async () => {
    const adminSession = await cookie(users.admin.id);
    const targetSession = await cookie(users.target.id);

    const promoted = await request(app.getHttpServer())
      .patch(`/admin/users/${users.target.key}/role`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ role: 'ADMIN' })
      .expect(200);
    expect(adminUserSchema.parse(promoted.body)).toEqual({
      id: users.target.key,
      username: users.target.username,
      displayName: users.target.displayName,
      role: 'ADMIN',
    });
    await expect(prisma.user.findUnique({ where: { id: users.target.id }, select: { role: true } })).resolves.toEqual({ role: 'ADMIN' });

    await request(app.getHttpServer()).get('/admin/users').set('Cookie', targetSession).expect(200);

    const selfDemotion = await request(app.getHttpServer())
      .patch(`/admin/users/${users.admin.key}/role`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ role: 'USER' })
      .expect(403);
    expect(apiErrorSchema.parse(selfDemotion.body)).toMatchObject({ code: 'FORBIDDEN' });
    await expect(prisma.user.findUnique({ where: { id: users.admin.id }, select: { role: true } })).resolves.toEqual({ role: 'ADMIN' });

    const demoted = await request(app.getHttpServer())
      .patch(`/admin/users/${users.target.key}/role`)
      .set('Cookie', adminSession)
      .set('Origin', origin)
      .send({ role: 'USER' })
      .expect(200);
    expect(adminUserSchema.parse(demoted.body).role).toBe('USER');
    await expect(prisma.user.findUnique({ where: { id: users.target.id }, select: { role: true } })).resolves.toEqual({ role: 'USER' });
    await request(app.getHttpServer()).get('/admin/users').set('Cookie', targetSession).expect(403);
  });
});
