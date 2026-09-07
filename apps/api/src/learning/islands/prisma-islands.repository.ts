import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { IIslandsRepository } from './islands.repository.interface';

@Injectable()
export class PrismaIslandsRepository implements IIslandsRepository {
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
