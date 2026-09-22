import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
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
}
