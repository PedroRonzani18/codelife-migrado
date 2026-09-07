import { IdentityProvider, Prisma } from '@prisma/client';
import type { PrismaService } from '@/prisma/prisma.service';
import { UniqueConstraintViolationError } from '@/prisma/errors/unique-constraint-violation.error';
import { PrismaExternalIdentitiesRepository } from './prisma-external-identities.repository';

describe('PrismaExternalIdentitiesRepository', () => {
  const findUnique = jest.fn();
  const create = jest.fn();
  const prisma = {
    externalIdentity: { findUnique, create },
  } as unknown as PrismaService;
  const repository = new PrismaExternalIdentitiesRepository(prisma);

  beforeEach(() => {
    findUnique.mockReset();
    create.mockReset();
  });

  it('finds an identity by provider and subject without loading the User', async () => {
    const identity = {
      id: 'identity-1',
      provider: IdentityProvider.GOOGLE,
      subject: 'google-subject',
      userId: 'user-1',
      email: 'person@example.com',
      emailVerified: true,
    };
    findUnique.mockResolvedValue(identity);

    await expect(repository.findByProviderAndSubject('GOOGLE', 'google-subject')).resolves.toEqual({
      ...identity,
      provider: 'GOOGLE',
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { provider_subject: { provider: IdentityProvider.GOOGLE, subject: 'google-subject' } },
      select: {
        id: true,
        provider: true,
        subject: true,
        userId: true,
        email: true,
        emailVerified: true,
      },
    });
  });

  it('creates only the ExternalIdentity record', async () => {
    create.mockResolvedValue({
      id: 'identity-1',
      provider: IdentityProvider.GOOGLE,
      subject: 'google-subject',
      userId: 'user-1',
      email: null,
      emailVerified: null,
    });

    await expect(repository.create({
      provider: 'GOOGLE',
      subject: 'google-subject',
      userId: 'user-1',
    })).resolves.toMatchObject({ id: 'identity-1', provider: 'GOOGLE', userId: 'user-1' });
    expect(create).toHaveBeenCalledWith({
      data: {
        provider: IdentityProvider.GOOGLE,
        subject: 'google-subject',
        email: undefined,
        emailVerified: undefined,
        userId: 'user-1',
      },
      select: {
        id: true,
        provider: true,
        subject: true,
        userId: true,
        email: true,
        emailVerified: true,
      },
    });
  });

  it('translates unique conflicts into a repository error', async () => {
    create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('unique conflict', {
      code: 'P2002',
      clientVersion: '7.9.1',
    }));

    await expect(repository.create({
      provider: 'GOOGLE',
      subject: 'google-subject',
      userId: 'user-1',
    })).rejects.toBeInstanceOf(UniqueConstraintViolationError);
  });
});
