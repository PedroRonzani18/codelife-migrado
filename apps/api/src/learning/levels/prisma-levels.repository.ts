import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type {
  CreateLevelInput,
  ILevelsRepository,
  LevelRecord,
  PositionedLevelRecord,
  UpdateLevelInput,
} from './levels.repository.interface';

const levelSelect = {
  id: true,
  islandId: true,
  title: true,
  position: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaLevelsRepository implements ILevelsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: Pick<PrismaService, 'level'>,
  ) {}

  async levelById(levelId: string): Promise<PositionedLevelRecord | null> {
    return this.prisma.level.findUnique({
      where: { id: levelId },
      select: {
        id: true,
        islandId: true,
        title: true,
        position: true,
        publishedAt: true,
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

  async findById(id: string): Promise<LevelRecord | null> {
    return this.prisma.level.findUnique({
      where: { id },
      select: levelSelect,
    });
  }

  async findByIslandId(islandId: string): Promise<LevelRecord[]> {
    return this.prisma.level.findMany({
      where: { islandId },
      orderBy: { position: 'asc' },
      select: levelSelect,
    });
  }

  async countByIslandId(islandId: string): Promise<number> {
    return this.prisma.level.count({
      where: { islandId },
    });
  }

  async create(input: CreateLevelInput): Promise<LevelRecord> {
    return this.prisma.level.create({
      data: {
        id: input.id,
        islandId: input.islandId,
        title: input.title,
        position: input.position,
        publishedAt: input.publishedAt,
      },
      select: levelSelect,
    });
  }

  async update(id: string, input: UpdateLevelInput): Promise<LevelRecord> {
    return this.prisma.level.update({
      where: { id },
      data: {
        title: input.title,
        position: input.position,
        publishedAt: input.publishedAt,
      },
      select: levelSelect,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.level.delete({
      where: { id },
    });
  }
}
