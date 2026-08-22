import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type {
  CompleteLevelProgressInput,
  ProgressRepositoryPort,
  SetCurrentSlideInput,
  StartLevelProgressInput,
} from './progress.repository.port';

@Injectable()
export class PrismaProgressRepository implements ProgressRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async journeyForUser(userId: string) {
    const islands = await this.prisma.island.findMany({
      orderBy: { slug: 'asc' },
      select: {
        id: true,
        slug: true,
        title: true,
        levels: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            position: true,
            slides: { orderBy: { position: 'asc' }, select: { id: true, position: true } },
          },
        },
        progress: {
          where: { userId },
          take: 1,
          select: {
            id: true,
            currentLevelId: true,
            startedAt: true,
            updatedAt: true,
            levels: {
              select: {
                id: true,
                levelId: true,
                currentSlideId: true,
                startedAt: true,
                completedAt: true,
                updatedAt: true,
              },
            },
          },
        },
      },
    });

    return {
      islands: islands.map(({ progress, ...island }) => ({
        ...island,
        progress: progress[0] ?? null,
      })),
    };
  }

  async startLevel(input: StartLevelProgressInput): Promise<void> {
    await this.prisma.$transaction(async (transaction) => {
      const islandProgress = await transaction.userIslandProgress.upsert({
        where: { userId_islandId: { userId: input.userId, islandId: input.islandId } },
        update: { currentLevelId: input.levelId },
        create: { userId: input.userId, islandId: input.islandId, currentLevelId: input.levelId },
        select: { id: true },
      });
      await transaction.userLevelProgress.upsert({
        where: {
          userIslandProgressId_levelId: {
            userIslandProgressId: islandProgress.id,
            levelId: input.levelId,
          },
        },
        update: {},
        create: {
          userIslandProgressId: islandProgress.id,
          levelId: input.levelId,
          currentSlideId: input.firstSlideId,
        },
      });
    });
  }

  async setCurrentSlide(input: SetCurrentSlideInput): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.userIslandProgress.update({
        where: { id: input.islandProgressId },
        data: { currentLevelId: input.levelId },
      }),
      this.prisma.userLevelProgress.update({
        where: { id: input.levelProgressId },
        data: { currentSlideId: input.slideId },
      }),
    ]);
  }

  async completeLevel(input: CompleteLevelProgressInput): Promise<boolean> {
    const result = await this.prisma.userLevelProgress.updateMany({
      where: {
        id: input.levelProgressId,
        currentSlideId: input.currentSlideId,
        completedAt: null,
      },
      data: { completedAt: input.completedAt },
    });
    return result.count === 1;
  }
}
