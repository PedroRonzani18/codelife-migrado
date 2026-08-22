import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { LevelsRepositoryPort } from './levels.repository.port';

@Injectable()
export class PrismaLevelsRepository implements LevelsRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  levelById(levelId: string) {
    return this.prisma.level.findUnique({
      where: { id: levelId },
      select: {
        id: true,
        islandId: true,
        title: true,
        position: true,
        slides: {
          orderBy: { position: 'asc' },
          select: {
            id: true,
            title: true,
            type: true,
            position: true,
            textText: { select: { primaryText: true, secondaryText: true } },
            textImage: {
              select: {
                text: true,
                altText: true,
                mediaAsset: {
                  select: {
                    id: true,
                    objectKey: true,
                    mimeType: true,
                    sizeBytes: true,
                    width: true,
                    height: true,
                    checksum: true,
                  },
                },
              },
            },
            textCode: { select: { text: true, code: true, language: true } },
          },
        },
      },
    });
  }
}
