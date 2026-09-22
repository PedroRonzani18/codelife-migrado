import { Inject, Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type {
  CreateMediaAssetInput,
  IMediaRepository,
  MediaAssetRecord,
} from './media.repository.interface';

const mediaSelect = {
  id: true,
  objectKey: true,
  mimeType: true,
  sizeBytes: true,
  width: true,
  height: true,
  checksum: true,
} as const;

@Injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(
    @Inject(PrismaService)
    private readonly prisma: Pick<PrismaService, 'mediaAsset'>,
  ) {}

  async mediaAssetById(mediaAssetId: string): Promise<MediaAssetRecord | null> {
    return this.prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: { id: true, objectKey: true, mimeType: true },
    });
  }

  async findById(id: string): Promise<MediaAssetRecord | null> {
    return this.prisma.mediaAsset.findUnique({
      where: { id },
      select: mediaSelect,
    });
  }

  async create(input: CreateMediaAssetInput): Promise<MediaAssetRecord> {
    return this.prisma.mediaAsset.create({
      data: {
        id: input.id,
        objectKey: input.objectKey,
        mimeType: input.mimeType,
        sizeBytes: input.sizeBytes,
        width: input.width,
        height: input.height,
        checksum: input.checksum,
      },
      select: mediaSelect,
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.mediaAsset.delete({
      where: { id },
    });
  }
}
