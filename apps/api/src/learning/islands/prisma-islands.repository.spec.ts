import type { PrismaService } from '../../prisma/prisma.service';
import { PrismaIslandsRepository } from './prisma-islands.repository';

describe('PrismaIslandsRepository', () => {
  it('loads a direct island and its ordered levels', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    const repository = new PrismaIslandsRepository({ island: { findUnique } } as unknown as PrismaService);
    await repository.islandBySlug('island-3');
    expect(findUnique).toHaveBeenCalledWith({
      where: { slug: 'island-3' },
      select: { id: true, slug: true, title: true, levels: { orderBy: { position: 'asc' }, select: { id: true, position: true, title: true } } },
    });
  });
});
