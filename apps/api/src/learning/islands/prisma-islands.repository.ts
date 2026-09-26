import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { AdminContentTree, AdminIslandDetail } from '@codelife/contracts/content-management';
import type {
  CreateIslandInput,
  IIslandsRepository,
  IslandRecord,
  IslandWithLevelsRecord,
  UpdateIslandInput,
} from './islands.repository.interface';

const islandSelect = {
  id: true,
  slug: true,
  title: true,
  position: true,
  publishedAt: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class PrismaIslandsRepository implements IIslandsRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: Pick<PrismaService, 'island'>,
  ) {}

  async islandBySlug(slug: string): Promise<IslandWithLevelsRecord | null> {
    return this.prisma.island.findUnique({
      where: { slug },
      select: {
        id: true,
        slug: true,
        title: true,
        position: true,
        publishedAt: true,
        levels: {
          orderBy: { position: 'asc' },
          select: { id: true, position: true, title: true },
        },
      },
    });
  }

  async findById(id: string): Promise<IslandRecord | null> {
    return this.prisma.island.findUnique({
      where: { id },
      select: islandSelect,
    });
  }

  async findBySlug(slug: string): Promise<IslandRecord | null> {
    return this.prisma.island.findUnique({
      where: { slug },
      select: islandSelect,
    });
  }

  async listAll(): Promise<IslandRecord[]> {
    return this.prisma.island.findMany({
      orderBy: { position: 'asc' },
      select: islandSelect,
    });
  }

  async count(): Promise<number> {
    return this.prisma.island.count();
  }

  async create(input: CreateIslandInput): Promise<IslandRecord> {
    return this.prisma.island.create({
      data: {
        id: input.id,
        slug: input.slug,
        title: input.title,
        position: input.position,
        publishedAt: input.publishedAt,
      },
      select: islandSelect,
    });
  }

  async update(id: string, input: UpdateIslandInput): Promise<IslandRecord> {
    return this.prisma.island.update({
      where: { id },
      data: {
        slug: input.slug,
        title: input.title,
        position: input.position,
        publishedAt: input.publishedAt,
      },
      select: islandSelect,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.island.delete({
      where: { id },
    });
  }

  async getAdminTree(): Promise<AdminContentTree> {
    const islands = await this.prisma.island.findMany({
      orderBy: { position: 'asc' },
      include: {
        levels: {
          orderBy: { position: 'asc' },
          include: {
            slides: {
              orderBy: { position: 'asc' },
              include: {
                textText: true,
                textImage: true,
                textCode: true,
              },
            },
          },
        },
      },
    });

    return islands.map((island) => ({
      id: island.id,
      slug: island.slug,
      title: island.title,
      position: island.position,
      publishedAt: island.publishedAt ? island.publishedAt.toISOString() : null,
      updatedAt: island.updatedAt.toISOString(),
      levels: island.levels.map((level) => ({
        id: level.id,
        islandId: level.islandId,
        title: level.title,
        position: level.position,
        publishedAt: level.publishedAt ? level.publishedAt.toISOString() : null,
        updatedAt: level.updatedAt.toISOString(),
        slides: level.slides.map((slide) => {
          const type = slide.textText ? 'TextText' : slide.textImage ? 'TextImage' : 'TextCode';
          return {
            id: slide.id,
            levelId: slide.levelId,
            title: slide.title,
            position: slide.position,
            type: type as 'TextText' | 'TextImage' | 'TextCode',
            updatedAt: slide.updatedAt.toISOString(),
          };
        }),
      })),
    }));
  }

  async getAdminDetail(id: string): Promise<AdminIslandDetail | null> {
    const island = await this.prisma.island.findUnique({
      where: { id },
      include: {
        levels: {
          orderBy: { position: 'asc' },
          include: {
            _count: { select: { slides: true } },
          },
        },
      },
    });
    if (!island) return null;

    return {
      id: island.id,
      slug: island.slug,
      title: island.title,
      position: island.position,
      publishedAt: island.publishedAt ? island.publishedAt.toISOString() : null,
      createdAt: island.createdAt.toISOString(),
      updatedAt: island.updatedAt.toISOString(),
      levelCount: island.levels.length,
      levels: island.levels.map((level) => ({
        id: level.id,
        islandId: level.islandId,
        title: level.title,
        position: level.position,
        publishedAt: level.publishedAt ? level.publishedAt.toISOString() : null,
        createdAt: level.createdAt.toISOString(),
        updatedAt: level.updatedAt.toISOString(),
        slideCount: level._count.slides,
      })),
    };
  }
}
