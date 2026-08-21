import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IslandsRepositoryPort } from './islands.repository.port';

@Injectable()
export class PrismaIslandsRepository implements IslandsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async islandBySlug(slug: string) {
    const positionedIsland = await this.prisma.trailIsland.findFirst({
      where: { trail: { slug: 'codelife' }, island: { slug } },
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

    if (!positionedIsland) return null;
    return {
      id: positionedIsland.id,
      slug: positionedIsland.island.slug,
      title: positionedIsland.island.title,
      position: positionedIsland.position,
      levels: positionedIsland.island.levels.map((level) => ({ id: level.id, title: level.level.title, position: level.position })),
    };
  }
}
