import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import type { IMediaRepository } from './media.repository.interface';

@Injectable()
export class PrismaMediaRepository implements IMediaRepository {
  constructor(private readonly prisma: PrismaService) {}

  mediaAssetById(mediaAssetId: string) {
    return this.prisma.mediaAsset.findUnique({
      where: { id: mediaAssetId },
      select: { id: true, objectKey: true, mimeType: true },
    });
  }
}
