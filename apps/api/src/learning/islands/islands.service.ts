import { Injectable } from '@nestjs/common';
import {
  islandDetailSchema,
  type IslandCatalogItem,
  type IslandDetail,
} from '@codelife/contracts/learning';
import { ProgressService } from '../progress/progress.service';

@Injectable()
export class IslandsService {
  constructor(private readonly progress: ProgressService) {}

  async catalog(userId: string): Promise<IslandCatalogItem[]> {
    return this.progress.catalog(userId);
  }

  async islandDetail(userId: string, slug: string): Promise<IslandDetail> {
    const island = await this.progress.assertIslandAccess(userId, slug);
    return islandDetailSchema.parse({
      id: island.id,
      slug: island.slug,
      title: island.title,
      levelCount: island.levels.length,
      availability: island.availability,
      levels: island.levels.map((level) => ({
        id: level.id,
        title: level.title,
        position: level.position,
        availability: level.availability,
      })),
    });
  }
}

