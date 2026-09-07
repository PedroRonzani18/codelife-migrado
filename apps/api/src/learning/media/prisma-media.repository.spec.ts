import { fixtureIds } from '../../../prisma/seed';
import type { PrismaService } from '@/prisma/prisma.service';
import { PrismaMediaRepository } from './prisma-media.repository';

describe('PrismaMediaRepository', () => {
  it('loads only the fields needed to serve a direct media asset', async () => {
    const findUnique = jest.fn().mockResolvedValue(null);
    await new PrismaMediaRepository({ mediaAsset: { findUnique } } as unknown as PrismaService)
      .mediaAssetById(fixtureIds.assets[0]);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: fixtureIds.assets[0] },
      select: { id: true, objectKey: true, mimeType: true },
    });
  });
});
