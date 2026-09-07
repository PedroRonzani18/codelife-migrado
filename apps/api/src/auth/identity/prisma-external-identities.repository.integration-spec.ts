import { randomUUID } from 'node:crypto';
import { Test, type TestingModule } from '@nestjs/testing';
import { AppModule } from '@/app.module';
import { PrismaService } from '@/prisma/prisma.service';
import { AUTH_PROVIDER_KEYS } from '../constants';
import type { IExternalIdentitiesRepository } from './external-identities.repository.interface';

describe('PrismaExternalIdentitiesRepository (integration)', () => {
  let moduleRef: TestingModule;
  let prisma: PrismaService;
  let repository: IExternalIdentitiesRepository;
  let userId: string;
  const subject = `macrostep-3-identity-${randomUUID()}`;

  beforeAll(async () => {
    moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    await moduleRef.init();
    prisma = moduleRef.get(PrismaService);
    repository = moduleRef.get<IExternalIdentitiesRepository>(AUTH_PROVIDER_KEYS.EXTERNAL_IDENTITIES_REPOSITORY);
    const user = await prisma.user.create({
      data: {
        key: `macro3-identity-user-${randomUUID()}`,
        username: `macro3-identity-user-${randomUUID()}`,
        displayName: 'External Identity Repository User',
      },
    });
    userId = user.id;
  });

  afterAll(async () => {
    await prisma.externalIdentity.deleteMany({ where: { subject } });
    if (userId) await prisma.user.delete({ where: { id: userId } });
    await moduleRef.close();
  });

  it('creates and finds an ExternalIdentity by its provider subject', async () => {
    await expect(repository.create({
      provider: 'GOOGLE',
      subject,
      email: 'identity@example.com',
      emailVerified: true,
      userId,
    })).resolves.toMatchObject({ provider: 'GOOGLE', subject, userId, emailVerified: true });

    await expect(repository.findByProviderAndSubject('GOOGLE', subject)).resolves.toMatchObject({
      provider: 'GOOGLE',
      subject,
      userId,
      email: 'identity@example.com',
    });
  });
});
