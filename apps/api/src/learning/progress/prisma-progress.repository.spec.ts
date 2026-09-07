import { fixtureIds } from '../../../prisma/seed';
import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaProgressRepository } from './prisma-progress.repository';

function setup() {
  const transaction = {
    userIslandProgress: { upsert: jest.fn().mockResolvedValue({ id: 'island-progress' }) },
    userLevelProgress: { upsert: jest.fn() },
  };
  const prisma = {
    island: { findMany: jest.fn() },
    userIslandProgress: { update: jest.fn().mockResolvedValue({}) },
    userLevelProgress: { update: jest.fn().mockResolvedValue({}), updateMany: jest.fn() },
    $transaction: jest.fn((operation: unknown) => typeof operation === 'function'
      ? (operation as (tx: typeof transaction) => Promise<unknown>)(transaction)
      : Promise.all(operation as Promise<unknown>[])),
  } as unknown as PrismaService;
  return { prisma, transaction, repository: new PrismaProgressRepository(prisma) };
}

describe('PrismaProgressRepository', () => {
  it('loads direct islands and flattens the user-specific progress relation', async () => {
    const { prisma, repository } = setup();
    const findMany = prisma.island.findMany as jest.Mock;
    findMany.mockResolvedValue([{ id: fixtureIds.island, slug: 'island-3', title: 'Interatividade', levels: [], progress: [] }]);
    await expect(repository.journeyForUser(fixtureIds.user)).resolves.toEqual({ islands: [{ id: fixtureIds.island, slug: 'island-3', title: 'Interatividade', levels: [], progress: null }] });
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({ orderBy: { slug: 'asc' } }));
  });

  it('starts island and level progress transactionally', async () => {
    const { transaction, repository } = setup();
    await repository.startLevel({ userId: fixtureIds.user, islandId: fixtureIds.island, levelId: fixtureIds.levels[0], firstSlideId: fixtureIds.slides[0] });
    expect(transaction.userIslandProgress.upsert).toHaveBeenCalledWith(expect.objectContaining({ where: { userId_islandId: { userId: fixtureIds.user, islandId: fixtureIds.island } } }));
    expect(transaction.userLevelProgress.upsert).toHaveBeenCalledWith(expect.objectContaining({ create: expect.objectContaining({ currentSlideId: fixtureIds.slides[0] }) }));
  });

  it('moves both cursors and completes only from the expected slide', async () => {
    const { prisma, repository } = setup();
    await repository.setCurrentSlide({ islandProgressId: 'island-progress', levelProgressId: 'level-progress', levelId: fixtureIds.levels[0], slideId: fixtureIds.slides[1] });
    expect(prisma.userIslandProgress.update).toHaveBeenCalledWith({ where: { id: 'island-progress' }, data: { currentLevelId: fixtureIds.levels[0] } });
    (prisma.userLevelProgress.updateMany as jest.Mock).mockResolvedValue({ count: 1 });
    await expect(repository.completeLevel({ levelProgressId: 'level-progress', currentSlideId: fixtureIds.slides[2], completedAt: new Date('2026-08-20T12:00:00.000Z') })).resolves.toBe(true);
    expect(prisma.userLevelProgress.updateMany).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'level-progress', currentSlideId: fixtureIds.slides[2], completedAt: null } }));
  });
});
