import { IdentityProvider, Prisma } from '@prisma/client';
import type { PrismaService } from '../../prisma/prisma.service';
import { PrismaAuthRepository } from './prisma-auth.repository';
import { UniqueConstraintViolationError } from './unique-constraint-violation.error';

describe('PrismaAuthRepository', () => {
  const findUnique = jest.fn();
  const externalIdentityFindUnique = jest.fn();
  const userCreate = jest.fn();
  const externalIdentityCreate = jest.fn();
  const transaction = {
    user: { create: userCreate },
    externalIdentity: { create: externalIdentityCreate },
  };
  const transactionRunner = jest.fn((operation: (client: typeof transaction) => Promise<unknown>) => operation(transaction));
  const prisma = {
    user: { findUnique, create: userCreate },
    externalIdentity: { findUnique: externalIdentityFindUnique, create: externalIdentityCreate },
    $transaction: transactionRunner,
  } as unknown as PrismaService;
  const repository = new PrismaAuthRepository(prisma);

  beforeEach(() => {
    findUnique.mockReset();
    externalIdentityFindUnique.mockReset();
    userCreate.mockReset();
    externalIdentityCreate.mockReset();
    transactionRunner.mockClear();
  });

  it('delegates identity lookups by database id and stable key', async () => {
    findUnique.mockResolvedValueOnce({ id: 'user-1', key: 'user-key', username: 'user', displayName: 'User', role: 'USER' })
      .mockResolvedValueOnce({ id: 'user-2', key: 'aluna-demo', username: 'aluna.demo', displayName: 'Aluna Demo', role: 'USER' });

    await repository.findUserById('user-1');
    await repository.findUserByKey('aluna-demo');

    expect(findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: 'user-1' },
      select: { id: true, key: true, username: true, displayName: true, role: true },
    });
    expect(findUnique).toHaveBeenNthCalledWith(2, {
      where: { key: 'aluna-demo' },
      select: { id: true, key: true, username: true, displayName: true, role: true },
    });
  });

  it('finds a user through the provider and external subject', async () => {
    const user = { id: 'user-1', key: 'user-key', username: 'user', displayName: 'User', role: 'USER' };
    externalIdentityFindUnique.mockResolvedValue({ user });

    await expect(repository.findUserByExternalIdentity('GOOGLE', 'google-subject')).resolves.toEqual(user);
    expect(externalIdentityFindUnique).toHaveBeenCalledWith({
      where: { provider_subject: { provider: IdentityProvider.GOOGLE, subject: 'google-subject' } },
      select: { user: { select: { id: true, key: true, username: true, displayName: true, role: true } } },
    });
  });

  it('creates User and ExternalIdentity in the same transaction', async () => {
    const user = { id: 'user-1', key: 'generated-key', username: 'pedro-augusto', displayName: 'Pedro Augusto', role: 'USER' };
    userCreate.mockResolvedValue(user);
    externalIdentityCreate.mockResolvedValue({});

    await expect(repository.createUserWithExternalIdentity({
      provider: 'GOOGLE',
      subject: 'google-subject',
      email: 'pedro@example.com',
      emailVerified: true,
      key: 'generated-key',
      username: 'pedro-augusto',
      displayName: 'Pedro Augusto',
    })).resolves.toEqual(user);

    expect(transactionRunner).toHaveBeenCalledTimes(1);
    expect(userCreate).toHaveBeenCalledWith({
      data: { key: 'generated-key', username: 'pedro-augusto', displayName: 'Pedro Augusto' },
      select: { id: true, key: true, username: true, displayName: true, role: true },
    });
    expect(externalIdentityCreate).toHaveBeenCalledWith({
      data: {
        provider: IdentityProvider.GOOGLE,
        subject: 'google-subject',
        email: 'pedro@example.com',
        emailVerified: true,
        userId: 'user-1',
      },
    });
  });

  it('translates database unique conflicts into a repository error', async () => {
    userCreate.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('unique conflict', {
      code: 'P2002',
      clientVersion: '7.9.1',
    }));

    await expect(repository.createUserWithExternalIdentity({
      provider: 'GOOGLE',
      subject: 'google-subject',
      key: 'generated-key',
      username: 'user',
      displayName: 'User',
    })).rejects.toBeInstanceOf(UniqueConstraintViolationError);
  });
});
