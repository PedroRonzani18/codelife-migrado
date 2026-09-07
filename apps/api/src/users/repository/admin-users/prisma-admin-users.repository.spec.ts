import { Prisma } from '@prisma/client';
import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaAdminUsersRepository } from './prisma-admin-users.repository';

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
  const update = jest.fn().mockResolvedValue({ ...user, role: 'ADMIN' as const });
  const prisma = { user: { findMany, findUnique, update } } as unknown as PrismaService;
  return { findMany, findUnique, update, prisma, repository: new PrismaAdminUsersRepository(prisma) };
}

describe('PrismaAdminUsersRepository', () => {
  it('lists only the administrative user fields in deterministic order', async () => {
    const { findMany, repository } = setup();

    await expect(repository.listUsers()).resolves.toEqual([{
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

    await expect(repository.findUserByKey('user-key')).resolves.toEqual(expect.objectContaining({ key: 'user-key' }));
    await expect(repository.updateUserRoleByKey('user-key', 'ADMIN')).resolves.toEqual(expect.objectContaining({ role: 'ADMIN' }));
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

  it('turns a missing update target into an absent repository result', async () => {
    const { update, repository } = setup();
    update.mockRejectedValue(new Prisma.PrismaClientKnownRequestError('missing', { code: 'P2025', clientVersion: '7.9.1' }));

    await expect(repository.updateUserRoleByKey('missing-key', 'ADMIN')).resolves.toBeNull();
  });
});
