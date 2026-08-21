import type { PrismaService } from '../../prisma/prisma.service';
import { PrismaIslandsRepository } from './prisma-islands.repository';

describe('PrismaIslandsRepository', () => {
  it('reads an island through its singleton-trail and ordered positioning records', async () => {
    const findFirst = jest.fn().mockResolvedValue(null);
    const prisma = { trailIsland: { findFirst } } as unknown as PrismaService;

    await new PrismaIslandsRepository(prisma).islandBySlug('island-3');

    expect(findFirst).toHaveBeenCalledWith({
      where: { trail: { slug: 'codelife' }, island: { slug: 'island-3' } },
      select: {
        id: true,
        position: true,
        island: {
          select: {
            slug: true,
            title: true,
            levels: {
              orderBy: { position: 'asc' },
              select: { id: true, position: true, level: { select: { title: true } } },
            },
          },
        },
      },
    });
  });
});
