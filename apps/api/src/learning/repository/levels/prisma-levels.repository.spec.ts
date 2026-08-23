import { fixtureIds } from '../../../../prisma/seed';
import type { PrismaService } from '../../../prisma/prisma.service';
import { PrismaLevelsRepository } from './prisma-levels.repository';

describe('PrismaLevelsRepository', () => {
  it('loads a direct level with ordered direct slides', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    await new PrismaLevelsRepository({ level: { findUnique } } as unknown as PrismaService).levelById(fixtureIds.levels[0]);
    expect(findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: fixtureIds.levels[0] } }));
    expect(findUnique.mock.calls[0][0].select.slides.orderBy).toEqual({ position: 'asc' });
  });
});
