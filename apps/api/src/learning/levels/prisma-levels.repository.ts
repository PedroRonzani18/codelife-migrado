import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { AdminLevelDetail } from '@codelife/contracts/content-management';
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

  async getAdminDetail(id: string): Promise<AdminLevelDetail | null> {
    const level = await this.prisma.level.findUnique({
      where: { id },
      include: {
        _count: { select: { slides: true } },
        slides: {
          orderBy: { position: 'asc' },
          include: {
            textText: true,
            textImage: {
              include: {
                mediaAsset: true,
              },
            },
            textCode: true,
          },
        },
      },
    });
    if (!level) return null;

    return {
      id: level.id,
      islandId: level.islandId,
      title: level.title,
      position: level.position,
      publishedAt: level.publishedAt ? level.publishedAt.toISOString() : null,
      createdAt: level.createdAt.toISOString(),
      updatedAt: level.updatedAt.toISOString(),
      slideCount: level._count.slides,
      slides: level.slides.map((slide) => {
        const base = {
          id: slide.id,
          levelId: slide.levelId,
          title: slide.title,
          position: slide.position,
          createdAt: slide.createdAt.toISOString(),
          updatedAt: slide.updatedAt.toISOString(),
        };
        if (slide.type === 'TextText' && slide.textText) {
          return {
            ...base,
            type: 'TextText' as const,
            primaryText: slide.textText.primaryText,
            secondaryText: slide.textText.secondaryText ?? null,
          };
        }
        if (slide.type === 'TextImage' && slide.textImage) {
          return {
            ...base,
            type: 'TextImage' as const,
            text: slide.textImage.text,
            mediaAssetId: slide.textImage.mediaAssetId,
            mediaAsset: {
              id: slide.textImage.mediaAsset.id,
              objectKey: slide.textImage.mediaAsset.objectKey,
              mimeType: slide.textImage.mediaAsset.mimeType,
              sizeBytes: slide.textImage.mediaAsset.sizeBytes,
              width: slide.textImage.mediaAsset.width,
              height: slide.textImage.mediaAsset.height,
              checksum: slide.textImage.mediaAsset.checksum,
            },
            altText: slide.textImage.altText,
          };
        }
        return {
          ...base,
          type: 'TextCode' as const,
          text: slide.textCode?.text ?? '',
          code: slide.textCode?.code ?? '',
          language: slide.textCode?.language ?? '',
        };
      }),
    };
  }
}
