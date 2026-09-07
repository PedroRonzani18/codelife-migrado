import { Prisma } from '@prisma/client';
import type { PrismaService } from '@/prisma/prisma.service';
import { UniqueConstraintViolationError } from '@/prisma/errors/unique-constraint-violation.error';
import { PrismaUsersRepository } from './prisma-users.repository';

function setup() {
  const user = {
    id: 'database-id',
    key: 'user-key',
    username: 'user.name',
    displayName: 'User Name',
    role: 'USER' as const,
  };
  const findMany = jest.fn().mockResolvedValue([user]);
  const findUnique = jest.fn().mockResolvedValue(user);
  const create = jest.fn().mockResolvedValue(user);
  const update = jest.fn().mockResolvedValue({ ...user, role: 'ADMIN' as const });
  const prisma = { user: { findMany, findUnique, create, update } } as unknown as PrismaService;
  return { findMany, findUnique, create, update, prisma, repository: new PrismaUsersRepository(prisma) };
}

describe('PrismaUsersRepository', () => {
  it('lists only the administrative user fields in deterministic order', async () => {
    const { findMany, repository } = setup();

    await expect(repository.list()).resolves.toEqual([{
      id: 'database-id',
      key: 'user-key',
      username: 'user.name',
      displayName: 'User Name',
      role: 'USER',
    }]);
    expect(findMany).toHaveBeenCalledWith({
      orderBy: [{ username: 'asc' }, { key: 'asc' }],
      select: { id: true, key: true, username: true, displayName: true, role: true },
    });
  });

  it('locates a user by public key and updates only the role', async () => {
    const { findUnique, update, repository } = setup();

    await expect(repository.findById('database-id')).resolves.toEqual(expect.objectContaining({ id: 'database-id' }));
    await expect(repository.findByKey('user-key')).resolves.toEqual(expect.objectContaining({ key: 'user-key' }));
    await expect(repository.updateRoleByKey('user-key', 'ADMIN')).resolves.toEqual(expect.objectContaining({ role: 'ADMIN' }));
    expect(findUnique).toHaveBeenNthCalledWith(1, {
      where: { id: 'database-id' },
      select: { id: true, key: true, username: true, displayName: true, role: true },
    });
    expect(findUnique).toHaveBeenCalledWith({
      where: { key: 'user-key' },
      select: { id: true, key: true, username: true, displayName: true, role: true },
    });
    expect(update).toHaveBeenCalledWith({
      where: { key: 'user-key' },
      data: { role: 'ADMIN' },
      select: { id: true, key: true, username: true, displayName: true, role: true },
    });
  });

  it('creates a user with only user fields', async () => {
    const { create, repository } = setup();

    await expect(repository.create({ key: 'new-key', username: 'new-user', displayName: 'New User' })).resolves.toEqual(expect.objectContaining({
      id: 'database-id',
    }));
    expect(create).toHaveBeenCalledWith({
      data: { key: 'new-key', username: 'new-user', displayName: 'New User' },
      select: { id: true, key: true, username: true, displayName: true, role: true },
    });
  });

  it('translates user unique conflicts into a repository error', async () => {
    const { create, repository } = setup();
    create.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('unique conflict', { code: 'P2002', clientVersion: '7.9.1' }));

    await expect(repository.create({ key: 'duplicate-key', username: 'user', displayName: 'User' }))
      .rejects.toBeInstanceOf(UniqueConstraintViolationError);
  });

  it('turns a missing update target into an absent repository result', async () => {
    const { update, repository } = setup();
    update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '7.9.1' }));

    await expect(repository.updateRoleByKey('missing-key', 'ADMIN')).resolves.toBeNull();
  });
});
