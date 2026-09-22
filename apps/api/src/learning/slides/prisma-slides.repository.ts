import { Inject, Injectable } from '@nestjs/common';
import { Prisma, SlideType as PrismaSlideType } from '@prisma/client';
import { PrismaService } from '@/prisma/prisma.service';
import type {
  CreateSlideInput,
  ISlidesRepository,
  SlideRecord,
  UpdateSlideInput,
} from './slides.repository.interface';

const slideSelect = {
  id: true,
  levelId: true,
  title: true,
  type: true,
  position: true,
  createdAt: true,
  updatedAt: true,
  textText: { select: { primaryText: true, secondaryText: true } },
  textImage: { select: { text: true, altText: true, mediaAssetId: true } },
  textCode: { select: { text: true, code: true, language: true } },
} as const;

@Injectable()
export class PrismaSlidesRepository implements ISlidesRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: Pick<
      PrismaService,
      'slide' | 'textTextSlide' | 'textImageSlide' | 'textCodeSlide'
    >,
  ) {}

  async findById(id: string): Promise<SlideRecord | null> {
    const slide = await this.prisma.slide.findUnique({
      where: { id },
      select: slideSelect,
    });
    return slide ? this.toSlideRecord(slide) : null;
  }

  async findByLevelId(levelId: string): Promise<SlideRecord[]> {
    const slides = await this.prisma.slide.findMany({
      where: { levelId },
      orderBy: { position: 'asc' },
      select: slideSelect,
    });
    return slides.map((slide) => this.toSlideRecord(slide));
  }

  async countByLevelId(levelId: string): Promise<number> {
    return this.prisma.slide.count({
      where: { levelId },
    });
  }

  async create(input: CreateSlideInput): Promise<SlideRecord> {
    const slide = await this.prisma.slide.create({
      data: {
        id: input.id,
        levelId: input.levelId,
        title: input.title,
        type: input.type as PrismaSlideType,
        position: input.position,
        textText: input.textText ? { create: input.textText } : undefined,
        textImage: input.textImage ? { create: input.textImage } : undefined,
        textCode: input.textCode ? { create: input.textCode } : undefined,
      },
      select: slideSelect,
    });
    return this.toSlideRecord(slide);
  }

  async update(id: string, input: UpdateSlideInput): Promise<SlideRecord> {
    const slide = await this.prisma.slide.update({
      where: { id },
      data: {
        title: input.title,
        position: input.position,
        textText: input.textText ? { update: input.textText } : undefined,
        textImage: input.textImage ? { update: input.textImage } : undefined,
        textCode: input.textCode ? { update: input.textCode } : undefined,
      },
      select: slideSelect,
    });
    return this.toSlideRecord(slide);
  }

  async delete(id: string): Promise<void> {
    await this.prisma.slide.delete({
      where: { id },
    });
  }

  private toSlideRecord(slide: Prisma.SlideGetPayload<{ select: typeof slideSelect }>): SlideRecord {
    return {
      id: slide.id,
      levelId: slide.levelId,
      title: slide.title,
      type: slide.type as SlideRecord['type'],
      position: slide.position,
      createdAt: slide.createdAt,
      updatedAt: slide.updatedAt,
      textText: slide.textText ?? null,
      textImage: slide.textImage ?? null,
      textCode: slide.textCode ?? null,
    };
  }
}
