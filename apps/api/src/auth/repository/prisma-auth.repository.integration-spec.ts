import { randomUUID } from 'node:crypto';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '../../app.module';
import { AUTH_PROVIDER_KEYS } from '../constants';
import { AuthService } from '../service/auth.service';
import type { IAuthRepository } from './auth.repository.interface';
import { PrismaService } from '../../prisma/prisma.service';

describe('PrismaAuthRepository (integration)', () => {
  let moduleRef: TestingModule;
  let repository: IAuthRepository;
  let authService: AuthService;
  let prisma: PrismaService;

  async function clearMacrostepUsers() {
    const identities = await prisma.externalIdentity.findMany({
      where: { subject: { startsWith: 'macrostep-3-' } },
      select: { userId: true },
    });
    const userIds = identities.map(({ userId }) => userId);
    if (userIds.length === 0) return;
    await prisma.externalIdentity.deleteMany({ where: { userId: { in: userIds } } });
    await prisma.user.deleteMany({ where: { id: { in: userIds } } });
  }

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    repository = moduleRef.get<IAuthRepository>(AUTH_PROVIDER_KEYS.AUTH_REPOSITORY);
    authService = moduleRef.get(AuthService);
    prisma = moduleRef.get(PrismaService);
  });

  beforeEach(clearMacrostepUsers);

  afterAll(async () => {
    await clearMacrostepUsers();
    await moduleRef.close();
  });

  it('loads the seeded identity by stable key and database id', async () => {
    const userByKey = await repository.findUserByKey('aluna-demo');
    expect(userByKey).toEqual(expect.objectContaining({
      key: 'aluna-demo',
      username: 'aluna.demo',
      displayName: 'Aluna Demo',
    }));

    await expect(repository.findUserById(userByKey!.id)).resolves.toEqual(userByKey);
  });

  it('creates and then reuses one User for the same Google identity', async () => {
    const subject = `macrostep-3-${randomUUID()}`;
    const identity = {
      subject,
      displayName: 'Pedro Augusto Ronzani',
      email: `${subject}@example.com`,
      emailVerified: true,
    };

    const first = await authService.resolveGoogleIdentity(identity);
    const second = await authService.resolveGoogleIdentity(identity);

    expect(second).toEqual(first);
    expect(first.username).toBe('pedro-augusto-ronzani');
    expect(first.key).toMatch(/^[0-9a-f-]{36}$/);
    expect(first.key).not.toContain(subject);
    await expect(prisma.externalIdentity.count({ where: { subject } })).resolves.toBe(1);
    await expect(prisma.user.count({ where: { id: first.id } })).resolves.toBe(1);
  });

  it('keeps distinct Google identities on distinct Users and suffixes username collisions', async () => {
    const first = await authService.resolveGoogleIdentity({
      subject: `macrostep-3-${randomUUID()}`,
      displayName: 'Pedro Augusto Ronzani',
    });
    const second = await authService.resolveGoogleIdentity({
      subject: `macrostep-3-${randomUUID()}`,
      displayName: 'Pedro Augusto Ronzani',
    });

    expect(second.id).not.toBe(first.id);
    expect(second.key).not.toBe(first.key);
    expect(first.username).toBe('pedro-augusto-ronzani');
    expect(second.username).toBe('pedro-augusto-ronzani-2');
  });

  it('does not duplicate User or ExternalIdentity under concurrent first access', async () => {
    const subject = `macrostep-3-${randomUUID()}`;
    const identity = {
      subject,
      displayName: 'Concurrent User',
    };

    const results = await Promise.all([
      authService.resolveGoogleIdentity(identity),
      authService.resolveGoogleIdentity(identity),
    ]);

    expect(new Set(results.map((result) => result.id)).size).toBe(1);
    expect(new Set(results.map((result) => result.key)).size).toBe(1);
    await expect(prisma.externalIdentity.count({ where: { subject } })).resolves.toBe(1);
    await expect(prisma.user.count({ where: { id: results[0].id } })).resolves.toBe(1);
  });
});
