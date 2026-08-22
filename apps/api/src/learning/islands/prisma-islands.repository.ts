import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IslandsRepositoryPort } from './islands.repository.port';

@Injectable()
export class PrismaIslandsRepository implements IslandsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  islandBySlug(slug: string) {
    return this.prisma.island.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        levels: {
          orderBy: { position: 'asc' },
          select: { id: true, position: true, title: true },
        },
      },
    });
  }
}
