import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { IslandsRepositoryPort } from './islands.repository.port';

@Injectable()
export class PrismaIslandsRepository implements IslandsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  islandByKey(key: string) {
    return this.prisma.island.findUnique({
      where: { key },
      include: { levels: { orderBy: { sortOrder: 'asc' } } },
    });
  }
}
