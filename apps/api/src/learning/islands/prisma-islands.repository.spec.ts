import type { PrismaService } from '../../prisma/prisma.service';
import { PrismaIslandsRepository } from './prisma-islands.repository';

describe('PrismaIslandsRepository', () => {
  it('delegates the island query with pedagogical level ordering', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const prisma = { island: { findUnique } } as unknown as PrismaService;

    await new PrismaIslandsRepository(prisma).islandByKey('island-3');

    expect(findUnique).toHaveBeenCalledWith({
      where: { key: 'island-3' },
      include: { levels: { orderBy: { sortOrder: 'asc' } } },
    });
  });
});
