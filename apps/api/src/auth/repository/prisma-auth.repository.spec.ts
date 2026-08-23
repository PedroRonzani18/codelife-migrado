import type { PrismaService } from '../../prisma/prisma.service';
import { PrismaAuthRepository } from './prisma-auth.repository';

describe('PrismaAuthRepository', () => {
  const findUnique = jest.fn();
  const prisma = { user: { findUnique } } as unknown as PrismaService;
  const repository = new PrismaAuthRepository(prisma);

  beforeEach(() => findUnique.mockReset());

  it('delegates identity lookups by database id and stable key', async () => {
    findUnique.mockResolvedValueOnce({ id: 'user-1' }).mockResolvedValueOnce({ key: 'aluna-demo' });

    await repository.findUserById('user-1');
    await repository.findUserByKey('aluna-demo');

    expect(findUnique).toHaveBeenNthCalledWith(1, { where: { id: 'user-1' } });
    expect(findUnique).toHaveBeenNthCalledWith(2, { where: { key: 'aluna-demo' } });
  });
});
