import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class LearningRepository {
  constructor(private readonly prisma: PrismaService) {}

  islandByKey(key: string) {
    return this.prisma.island.findUnique({
      where: { key },
      include: { levels: { orderBy: { sortOrder: 'asc' } } },
    });
  }

  fixtureCounts() {
    return Promise.all([this.prisma.island.count(), this.prisma.level.count(), this.prisma.slide.count()]);
  }
}
