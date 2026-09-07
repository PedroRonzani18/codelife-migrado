import { randomUUID } from 'node:crypto';
import { Test, type TestingModule } from '@nestjs/testing';
import { PrismaService } from '@/prisma/prisma.service';
import { AppModule } from '@/app.module';
import { USERS_PROVIDER_KEYS } from '../constants';
import type { IUsersRepository } from './users.repository.interface';

describe('PrismaUsersRepository (integration)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let repository: IUsersRepository;
  let secondUserId: string;
  const suffix = randomUUID();
  const users = {
    first: { id: randomUUID(), key: `macro3-repository-first-${suffix}`, username: `macro3-repository-first-${suffix}` },
    second: { id: randomUUID(), key: `macro3-repository-second-${suffix}`, username: `macro3-repository-second-${suffix}` },
  } as const;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    repository = moduleRef.get<IUsersRepository>(USERS_PROVIDER_KEYS.USERS_REPOSITORY);
    await repository.create({ ...users.first, displayName: 'Repository First' });
    const second = await repository.create({ ...users.second, displayName: 'Repository Second' });
    secondUserId = second.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { key: { in: [users.first.key, users.second.key] } } });
    await moduleRef.close();
  });

  it('reads users ordered by username and updates a user by public key', async () => {
    const listed = (await repository.list()).filter((user) => ([users.first.key, users.second.key] as string[]).includes(user.key));
    expect(listed.map((user) => user.key)).toEqual([users.first.key, users.second.key]);

    await expect(repository.findById(secondUserId)).resolves.toMatchObject({ key: users.second.key, role: 'USER' });
    await expect(repository.findByKey(users.second.key)).resolves.toMatchObject({ role: 'USER' });
    await expect(repository.updateRoleByKey(users.second.key, 'ADMIN')).resolves.toMatchObject({
      key: users.second.key,
      role: 'ADMIN',
    });
    await expect(repository.findByKey(users.second.key)).resolves.toMatchObject({ role: 'ADMIN' });
  });
});
